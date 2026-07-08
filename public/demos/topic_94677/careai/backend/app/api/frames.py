from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import cv2
import numpy as np
import threading
import uuid
import time
import hashlib
from datetime import datetime

from app.core.database import get_db, SessionLocal
from app.models.models import Frame, Annotation, VideoImport, Camera
from app.core.labels import is_privacy

router = APIRouter(prefix="/frames", tags=["frames"])

FRAMES_DIR = os.path.join(os.path.dirname(__file__), "../../frames")
os.makedirs(FRAMES_DIR, exist_ok=True)

# Directory for retained video files (for preview/manual extraction)
VIDEOS_DIR = os.path.join(os.path.dirname(__file__), "../../videos")
os.makedirs(VIDEOS_DIR, exist_ok=True)

# Max video segment duration in seconds (videos longer than this are chunked)
MAX_SEGMENT_DURATION = 60.0

# ---- In-memory job store for async video extraction ----
_extraction_jobs: dict = {}
_job_lock = threading.Lock()
MAX_JOBS = 50  # Maximum number of completed jobs to keep in memory


def _cleanup_old_jobs():
    """Remove old completed/errored jobs to prevent unlimited memory growth."""
    with _job_lock:
        if len(_extraction_jobs) <= MAX_JOBS:
            return
        # Sort by started_at, remove oldest completed jobs
        done_jobs = [(jid, j) for jid, j in _extraction_jobs.items()
                     if j.get("status") in ("done", "error")]
        done_jobs.sort(key=lambda x: x[1].get("started_at", 0))
        # Remove oldest until under limit
        to_remove = len(_extraction_jobs) - MAX_JOBS
        for jid, _ in done_jobs[:to_remove]:
            del _extraction_jobs[jid]


def _compute_phash(img, hash_size=8):
    """
    Compute perceptual hash (pHash) for an image.
    Returns a hex string. Used for near-duplicate detection.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.resize(gray, (hash_size * 4, hash_size * 4))
    dct = cv2.dct(np.float32(gray))
    dct_low = dct[:hash_size, :hash_size]
    median = np.median(dct_low)
    bits = (dct_low > median).flatten()
    # Convert bit array to hex string
    hash_val = 0
    for bit in bits:
        hash_val = (hash_val << 1) | int(bit)
    return format(hash_val, '0{}x'.format(hash_size * hash_size // 4))


def _hamming_distance(hash1: str, hash2: str) -> int:
    """Compute Hamming distance between two hex hash strings."""
    if len(hash1) != len(hash2):
        return 64  # Max distance
    val1 = int(hash1, 16)
    val2 = int(hash2, 16)
    return bin(val1 ^ val2).count('1')


@router.get("/")
def list_frames(
    annotated: Optional[bool] = None,
    camera_id: Optional[int] = None,
    dataset_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Frame).filter(Frame.status == "confirmed")
    if annotated is not None:
        query = query.filter(Frame.is_annotated == annotated)
    if camera_id is not None:
        query = query.filter(Frame.camera_id == camera_id)
    if dataset_id is not None:
        query = query.filter(Frame.dataset_id == dataset_id)
    total = query.count()
    frames = query.order_by(Frame.id.desc()).offset(offset).limit(limit).all()
    # Batch fetch annotations for all frames in this page
    frame_ids = [f.id for f in frames]
    annotations_map = {}
    annotation_sources = {}
    if frame_ids:
        anns = db.query(Annotation).filter(Annotation.frame_id.in_(frame_ids)).all()
        # Prefer manual annotations over auto when duplicates exist
        for a in anns:
            fid = a.frame_id
            if fid not in annotations_map:
                annotations_map[fid] = a.label
                annotation_sources[fid] = a.source
            elif a.source == "manual" and annotation_sources.get(fid) != "manual":
                # Override auto with manual
                annotations_map[fid] = a.label
                annotation_sources[fid] = a.source
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [
            {
                "id": f.id,
                "camera_id": f.camera_id,
                "dataset_id": f.dataset_id,
                "image_path": f.image_path,
                "timestamp": f.timestamp.isoformat() if f.timestamp else None,
                "is_annotated": f.is_annotated,
                "status": f.status,
                "source": f.source,
                "video_timestamp": f.video_timestamp,
                "annotation_label": annotations_map.get(f.id, None),
                "annotation_source": annotation_sources.get(f.id, None),
            }
            for f in frames
        ]
    }


@router.get("/stats")
def frame_stats(db: Session = Depends(get_db)):
    """Get frame statistics for management dashboard."""
    total = db.query(Frame).filter(Frame.status == "confirmed").count()
    annotated = db.query(Frame).filter(Frame.status == "confirmed", Frame.is_annotated == True).count()
    unannotated = db.query(Frame).filter(Frame.status == "confirmed", Frame.is_annotated == False).count()
    pending = db.query(Frame).filter(Frame.status == "pending").count()
    by_source = {}
    for src in ["auto", "manual", "video"]:
        by_source[src] = db.query(Frame).filter(Frame.status == "confirmed", Frame.source == src).count()
    return {
        "total": total,
        "annotated": annotated,
        "unannotated": unannotated,
        "pending": pending,
        "by_source": by_source,
    }


@router.post("/delete-batch")
def delete_batch(frame_ids: List[int], db: Session = Depends(get_db)):
    """Delete multiple frames permanently (including physical files and annotations)."""
    deleted = 0
    for fid in frame_ids:
        frame = db.query(Frame).filter(Frame.id == fid).first()
        if not frame:
            continue
        # Delete associated annotations
        db.query(Annotation).filter(Annotation.frame_id == fid).delete()
        # Delete physical file
        full_path = os.path.join(FRAMES_DIR, os.path.basename(frame.image_path))
        try:
            if os.path.exists(full_path):
                os.remove(full_path)
        except OSError:
            pass
        db.delete(frame)
        deleted += 1
    db.commit()
    return {"ok": True, "deleted": deleted}


@router.get("/imports")
def list_imports(limit: int = 100, db: Session = Depends(get_db)):
    """List video import history records (max 100)."""
    records = db.query(VideoImport).order_by(
        VideoImport.created_at.desc()
    ).limit(min(limit, 100)).all()
    return {
        "total": db.query(VideoImport).count(),
        "items": [
            {
                "id": r.id,
                "filename": r.filename,
                "file_size": r.file_size,
                "camera_name": r.camera_name,
                "uploaded_by": r.uploaded_by,
                "strategy": r.strategy,
                "duration_sec": r.duration_sec,
                "total_frames": r.total_frames,
                "extracted_frames": r.extracted_frames,
                "action_frames": r.action_frames,
                "static_frames": r.static_frames,
                "skipped_duplicates": r.skipped_duplicates,
                "num_chunks": r.num_chunks,
                "status": r.status,
                "error_msg": r.error_msg,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in records
        ]
    }


@router.get("/video-file/{filename}")
def serve_video(filename: str, request: Request):
    """Serve a retained video file for preview with Range support and correct MIME type."""
    safe_name = os.path.basename(filename)
    video_path = os.path.join(VIDEOS_DIR, safe_name)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    file_size = os.path.getsize(video_path)
    media_type = "video/mp4"

    # Parse Range header (browsers always send one for <video> elements)
    range_header = request.headers.get("range")
    if range_header:
        range_spec = range_header.strip().split("=")[-1]
        range_parts = range_spec.split("-")
        start = int(range_parts[0]) if range_parts[0] else 0
        end = int(range_parts[1]) if range_parts[1] else file_size - 1
    else:
        # No Range header: return entire file (fetch API, curl, etc.)
        start = 0
        end = file_size - 1

    if end >= file_size:
        end = file_size - 1
    chunk_size = end - start + 1

    def iter_file():
        with open(video_path, "rb") as f:
            f.seek(start)
            remaining = chunk_size
            while remaining > 0:
                data = f.read(min(1024 * 1024, remaining))
                if not data:
                    break
                remaining -= len(data)
                yield data

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(chunk_size),
        "Content-Type": media_type,
        "Cache-Control": "no-cache",
    }

    from starlette.responses import StreamingResponse
    if range_header:
        headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
        return StreamingResponse(iter_file(), status_code=206, headers=headers)
    else:
        return StreamingResponse(iter_file(), status_code=200, headers=headers)


@router.get("/video-thumbnails/{filename}")
def get_video_thumbnails(filename: str, count: int = 12):
    """Generate timeline thumbnails for a video (filmstrip view).
    Extracts `count` evenly-spaced frames and returns them as base64 data URIs.
    """
    import base64
    safe_name = os.path.basename(filename)
    video_path = os.path.join(VIDEOS_DIR, safe_name)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Cannot open video")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total / fps if fps > 0 else 0
    if duration <= 0:
        cap.release()
        raise HTTPException(status_code=400, detail="Cannot determine video duration")

    # Clamp count
    count = max(4, min(count, 20))

    thumbnails = []
    for i in range(count):
        # Evenly spaced timestamps
        ts = duration * (i + 0.5) / count
        frame_num = int(ts * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
        ret, frame = cap.read()
        if not ret or frame is None:
            continue

        # Resize to small thumbnail (160px wide)
        h, w = frame.shape[:2]
        thumb_w = 160
        thumb_h = int(h * thumb_w / w)
        thumb = cv2.resize(frame, (thumb_w, thumb_h))

        # Encode as JPEG base64
        _, buf = cv2.imencode('.jpg', thumb, [cv2.IMWRITE_JPEG_QUALITY, 70])
        b64 = base64.b64encode(buf).decode('utf-8')
        thumbnails.append({
            "timestamp": round(ts, 1),
            "data_uri": "data:image/jpeg;base64," + b64,
        })

    cap.release()
    return {
        "duration": round(duration, 1),
        "count": len(thumbnails),
        "thumbnails": thumbnails,
    }


@router.post("/extract-manual")
def extract_manual_frame(
    camera_id: int,
    video_filename: str,
    timestamp: float,
    db: Session = Depends(get_db)
):
    """Manually extract a single frame from a retained video at the given timestamp (seconds)."""
    safe_name = os.path.basename(video_filename)
    video_path = os.path.join(VIDEOS_DIR, safe_name)
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found. It may have been cleaned up.")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise HTTPException(status_code=400, detail="Cannot open video file")

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25.0
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total / fps if fps > 0 else 0

    # Clamp timestamp
    if timestamp < 0:
        timestamp = 0
    if duration > 0 and timestamp > duration:
        timestamp = duration - 0.1

    frame_num = int(timestamp * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_num)
    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        raise HTTPException(status_code=400, detail=f"Failed to read frame at {timestamp:.1f}s")

    # Save the frame
    ts_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    frame_name = f"cam{camera_id}_manual_{ts_str}_{int(timestamp*1000):06d}.jpg"
    frame_path = os.path.join(FRAMES_DIR, frame_name)
    cv2.imwrite(frame_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 90])

    # Compute pHash for dedup
    try:
        from app.utils.phash import compute_phash
        phash = compute_phash(frame_path)
    except Exception:
        phash = ""

    # Save to DB
    db_frame = Frame(
        camera_id=camera_id,
        image_path=f"/frame-images/{frame_name}",
        timestamp=datetime.now(),
        is_annotated=False,
        phash=phash,
        video_timestamp=round(timestamp, 2),
        source="manual",
        status="pending",
    )
    db.add(db_frame)
    db.commit()
    db.refresh(db_frame)

    return {
        "id": db_frame.id,
        "image_path": f"/frame-images/{frame_name}",
        "video_timestamp": round(timestamp, 2),
        "source": "manual",
        "message": f"已提取 {timestamp:.1f}s 处的画面",
    }


@router.delete("/video-file/{filename}")
def cleanup_video(filename: str):
    """Delete a retained video file after manual extraction is done."""
    safe_name = os.path.basename(filename)
    video_path = os.path.join(VIDEOS_DIR, safe_name)
    if os.path.exists(video_path):
        os.remove(video_path)
        return {"message": "Video file deleted"}
    raise HTTPException(status_code=404, detail="Video file not found")


@router.get("/{frame_id}/image")
def get_frame_image(frame_id: int, blur: bool = False, db: Session = Depends(get_db)):
    """Serve a frame's image as JPEG.

    If ``blur=true`` is passed, the image is blurred with a Gaussian filter
    (kernel size 51) before being returned. Additionally, if the frame's
    annotation contains any privacy label, the image is automatically blurred
    even when ``blur=false`` to protect resident privacy.
    """
    frame = db.query(Frame).filter(Frame.id == frame_id).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Frame not found")

    img_filename = os.path.basename(frame.image_path)
    img_path = os.path.join(FRAMES_DIR, img_filename)
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Image file not found")

    # Check whether the frame's annotation contains privacy labels.
    # If so, force blurring regardless of the blur parameter.
    annotation = db.query(Annotation).filter(Annotation.frame_id == frame_id).first()
    has_privacy = False
    if annotation and annotation.label:
        has_privacy = is_privacy(annotation.label)

    should_blur = blur or has_privacy

    if should_blur:
        img = cv2.imread(img_path)
        if img is not None:
            img = cv2.GaussianBlur(img, (51, 51), 0)
            _, buf = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 90])
            return Response(content=buf.tobytes(), media_type="image/jpeg")
        # Fall through to raw read if cv2 failed to decode

    with open(img_path, "rb") as f:
        return Response(content=f.read(), media_type="image/jpeg")


@router.get("/{frame_id}")
def get_frame(frame_id: int, db: Session = Depends(get_db)):
    frame = db.query(Frame).filter(Frame.id == frame_id).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Frame not found")
    return {
        "id": frame.id,
        "camera_id": frame.camera_id,
        "image_path": frame.image_path,
        "timestamp": frame.timestamp.isoformat() if frame.timestamp else None,
        "is_annotated": frame.is_annotated
    }


@router.post("/upload")
def upload_frame(
    camera_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"cam{camera_id}_{timestamp_str}.jpg"
    filepath = os.path.join(FRAMES_DIR, filename)
    
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    frame = Frame(
        camera_id=camera_id,
        image_path=f"/frame-images/{filename}",
        is_annotated=False
    )
    db.add(frame)
    db.commit()
    db.refresh(frame)
    return {"id": frame.id, "image_path": frame.image_path}


def _compute_motion_ratio(prev_gray, curr_gray, pixel_threshold=25):
    """
    Compute the ratio of 'motion pixels' between two grayscale frames.

    A pixel counts as motion if its absolute difference >= pixel_threshold.
    Returns a float in [0.0, 1.0] representing the fraction of changed pixels.
    This is more robust than mean diff for detecting action when the moving
    object is small relative to the frame (e.g., a person falling in a room).
    """
    diff = cv2.absdiff(prev_gray, curr_gray)
    diff = cv2.GaussianBlur(diff, (5, 5), 0)
    motion_mask = diff >= pixel_threshold
    return float(motion_mask.sum()) / motion_mask.size


def _run_extraction(
    job_id: str,
    video_path: str,
    camera_id: int,
    strategy: str,
    interval: int,
    diff_threshold: float,
    pixel_threshold: int,
    min_interval: float,
    max_interval: float,
    fps: float,
    total_frames: int,
    duration_sec: float,
    dedup_threshold: int = 5,
    record_id: int = 0,
):
    """
    Background worker: extract frames from video, update job progress.
    
    Features:
    - Smart/fixed extraction strategy
    - Frame deduplication via perceptual hash (pHash)
    - Automatic video chunking for long videos (>60s)
    """
    db = SessionLocal()
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            with _job_lock:
                _extraction_jobs[job_id]["status"] = "error"
                _extraction_jobs[job_id]["error"] = "Cannot open video file"
            return

        created_frames = []
        frame_idx = 0
        saved_idx = 0
        skipped_dup = 0

        prev_saved_gray = None
        last_saved_frame_idx = -999999
        action_frame_count = 0
        static_frame_count = 0
        last_phash = None  # For deduplication

        frame_step = max(1, int(fps * interval))
        # Handle videos where total_frames is unknown (some mov/avi files)
        effective_total = max(1, total_frames)
        progress_interval = max(5, effective_total // 20)

        # Determine chunk boundaries for long videos
        chunk_duration_frames = int(MAX_SEGMENT_DURATION * fps)
        num_chunks = max(1, (effective_total + chunk_duration_frames - 1) // chunk_duration_frames)

        # Set initial progress to 1% so frontend sees it's started
        with _job_lock:
            _extraction_jobs[job_id]["progress"] = 1
            _extraction_jobs[job_id]["current_frame"] = 0

        while True:
            ret, frame_img = cap.read()
            if not ret:
                break

            should_save = False
            is_action = False

            if strategy == "fixed":
                should_save = (frame_idx % frame_step == 0)
            else:
                small_gray = cv2.resize(
                    cv2.cvtColor(frame_img, cv2.COLOR_BGR2GRAY),
                    (64, 64)
                )
                seconds_since_last = (frame_idx - last_saved_frame_idx) / fps

                if prev_saved_gray is None:
                    should_save = True
                elif seconds_since_last >= max_interval:
                    should_save = True
                elif seconds_since_last >= min_interval:
                    motion_ratio = _compute_motion_ratio(prev_saved_gray, small_gray, pixel_threshold)
                    if motion_ratio >= diff_threshold:
                        should_save = True
                        is_action = True

                if should_save:
                    prev_saved_gray = small_gray
                    last_saved_frame_idx = frame_idx
                    if is_action:
                        action_frame_count += 1
                    else:
                        static_frame_count += 1

            if should_save:
                # Compute perceptual hash for deduplication
                cur_phash = _compute_phash(frame_img)
                if last_phash is not None:
                    dist = _hamming_distance(last_phash, cur_phash)
                    if dist < dedup_threshold:
                        # Skip as near-duplicate
                        skipped_dup += 1
                        frame_idx += 1
                        continue
                last_phash = cur_phash

                video_timestamp = frame_idx / fps if fps > 0 else 0
                timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
                filename = f"cam{camera_id}_video_{timestamp_str}_{saved_idx}.jpg"
                filepath = os.path.join(FRAMES_DIR, filename)
                cv2.imwrite(filepath, frame_img)

                frame = Frame(
                    camera_id=camera_id,
                    dataset_id=dataset_id,
                    image_path=f"/frame-images/{filename}",
                    is_annotated=False,
                    phash=cur_phash,
                    video_timestamp=round(video_timestamp, 2),
                    status="pending",
                )
                db.add(frame)
                db.commit()
                db.refresh(frame)
                created_frames.append({
                    "id": frame.id,
                    "image_path": frame.image_path,
                    "video_timestamp": round(video_timestamp, 2),
                    "is_action": is_action if strategy == "smart" else None
                })
                saved_idx += 1

            # Update progress periodically
            if frame_idx % progress_interval == 0 or frame_idx == effective_total - 1:
                progress = min(100, int((frame_idx + 1) / effective_total * 100))
                if progress < 1:
                    progress = 1  # Ensure at least 1% visible
                with _job_lock:
                    _extraction_jobs[job_id]["progress"] = progress
                    _extraction_jobs[job_id]["current_frame"] = frame_idx + 1
                    _extraction_jobs[job_id]["extracted"] = saved_idx
                    _extraction_jobs[job_id]["action_frames"] = action_frame_count
                    _extraction_jobs[job_id]["static_frames"] = static_frame_count
                    _extraction_jobs[job_id]["skipped_duplicates"] = skipped_dup
                    _extraction_jobs[job_id]["num_chunks"] = num_chunks

            frame_idx += 1

        cap.release()

        with _job_lock:
            _extraction_jobs[job_id]["status"] = "done"
            _extraction_jobs[job_id]["progress"] = 100
            _extraction_jobs[job_id]["extracted"] = saved_idx
            _extraction_jobs[job_id]["action_frames"] = action_frame_count
            _extraction_jobs[job_id]["static_frames"] = static_frame_count
            _extraction_jobs[job_id]["skipped_duplicates"] = skipped_dup
            _extraction_jobs[job_id]["num_chunks"] = num_chunks
            _extraction_jobs[job_id]["frames"] = created_frames

        # Update video import record
        if record_id:
            rec = db.query(VideoImport).filter(VideoImport.id == record_id).first()
            if rec:
                rec.status = "done"
                rec.extracted_frames = saved_idx
                rec.action_frames = action_frame_count
                rec.static_frames = static_frame_count
                rec.skipped_duplicates = skipped_dup
                rec.num_chunks = num_chunks
                rec.completed_at = datetime.now()
                db.commit()

    except Exception as e:
        with _job_lock:
            _extraction_jobs[job_id]["status"] = "error"
            _extraction_jobs[job_id]["error"] = str(e)
        # Update record with error
        if record_id:
            try:
                rec = db.query(VideoImport).filter(VideoImport.id == record_id).first()
                if rec:
                    rec.status = "error"
                    rec.error_msg = str(e)[:200]
                    rec.completed_at = datetime.now()
                    db.commit()
            except Exception:
                pass
    finally:
        db.close()
        # Move video to VIDEOS_DIR for preview/manual extraction (instead of deleting)
        if os.path.exists(video_path):
            try:
                video_filename = os.path.basename(video_path)
                dest_path = os.path.join(VIDEOS_DIR, video_filename)
                shutil.move(video_path, dest_path)
                # Store the retained video path in the job
                with _job_lock:
                    _extraction_jobs[job_id]["video_path"] = video_filename
            except Exception:
                # If move fails, just delete
                try:
                    os.remove(video_path)
                except OSError:
                    pass


@router.post("/upload-video")
def upload_video(
    camera_id: int,
    strategy: str = "smart",
    interval: int = 2,
    diff_threshold: float = 0.03,
    pixel_threshold: int = 25,
    min_interval: float = 0.5,
    max_interval: float = 10.0,
    dedup_threshold: int = 5,
    dataset_id: Optional[int] = None,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a video file and start async frame extraction.

    All processing is local. No data is sent to any cloud service.
    Video files, extracted frames, and trained models all stay on this machine.

    Returns immediately with a job_id. Poll GET /frames/upload-status/{job_id}
    for progress updates.

    Strategies:
    - "smart": Motion-detection based. Dense extraction during action scenes,
               sparse during static scenes. Best for annotation of action videos
               like falling, abnormal behavior, etc.
    - "fixed": Fixed interval extraction (every N seconds).

    Deduplication:
    - dedup_threshold: Hamming distance threshold for pHash comparison.
                       Lower = stricter (fewer duplicates removed).
                       0 = disable dedup. Default 5.

    Video chunking:
    - Videos longer than 60 seconds are automatically processed in segments.
    - The extraction pipeline handles this transparently.
    """
    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    tmp_path = os.path.join(FRAMES_DIR, f"_tmp_{uuid.uuid4().hex[:8]}{suffix}")
    with open(tmp_path, "wb") as tmp:
        shutil.copyfileobj(file.file, tmp)

    # Quick-scan video metadata
    cap = cv2.VideoCapture(tmp_path)
    if not cap.isOpened():
        # Try with explicit FFmpeg backend as fallback (helps with some mov/avi files)
        cap = cv2.VideoCapture(tmp_path, cv2.CAP_FFMPEG)
    if not cap.isOpened():
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except OSError:
            pass
        raise HTTPException(
            status_code=400,
            detail=f"Cannot open video file (format: {suffix}). Supported: mp4, mov, avi, mkv. "
                   "If this is a mov file, ensure it uses H.264 or mp4v codec."
        )

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0:
        fps = 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps if fps > 0 else 0
    cap.release()

    # Calculate chunk info for long videos
    num_chunks = max(1, int(duration_sec / MAX_SEGMENT_DURATION) + (1 if duration_sec % MAX_SEGMENT_DURATION > 0 else 0))

    # Get file size
    file_size = os.path.getsize(tmp_path)

    # Get camera name
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    cam_name = cam.name if cam else ""

    # Create video import record
    record = VideoImport(
        filename=file.filename or "video.mp4",
        file_size=file_size,
        camera_id=camera_id,
        camera_name=cam_name,
        uploaded_by="admin",
        strategy=strategy,
        duration_sec=round(duration_sec, 1),
        total_frames=total_frames,
        num_chunks=num_chunks,
        status="processing",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    record_id = record.id

    # Create job
    job_id = uuid.uuid4().hex[:12]
    _cleanup_old_jobs()  # Prevent unlimited memory growth
    with _job_lock:
        _extraction_jobs[job_id] = {
            "status": "processing",
            "progress": 0,
            "current_frame": 0,
            "total_frames": total_frames,
            "duration_sec": round(duration_sec, 1),
            "strategy": strategy,
            "extracted": 0,
            "action_frames": 0,
            "static_frames": 0,
            "skipped_duplicates": 0,
            "num_chunks": num_chunks,
            "frames": [],
            "error": None,
            "started_at": time.time(),
        }

    # Start background extraction thread
    thread = threading.Thread(
        target=_run_extraction,
        args=(job_id, tmp_path, camera_id, strategy, interval,
              diff_threshold, pixel_threshold, min_interval, max_interval,
              fps, total_frames, duration_sec, dedup_threshold, record_id),
        daemon=True,
    )
    thread.start()

    return {
        "job_id": job_id,
        "total_frames": total_frames,
        "duration_sec": round(duration_sec, 1),
        "strategy": strategy,
        "fps": round(fps, 1),
        "num_chunks": num_chunks,
        "will_chunk": duration_sec > MAX_SEGMENT_DURATION,
        "record_id": record_id,
    }


@router.get("/upload-status/{job_id}")
def upload_status(job_id: str):
    """Poll extraction job progress. Returns lightweight status (no frames list)."""
    with _job_lock:
        job = _extraction_jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        # Return lightweight status without the full frames list
        # (frames list can be 100+ items, sending it every 300ms freezes the browser)
        result = {k: v for k, v in job.items() if k != "frames"}
        result["frame_count"] = len(job.get("frames", []))
        return result


@router.get("/preview/{job_id}")
def preview_frames(job_id: str, db: Session = Depends(get_db)):
    """Get extracted frames for preview before confirmation."""
    with _job_lock:
        job = _extraction_jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        frames = job.get("frames", [])
    return {"job_id": job_id, "frame_count": len(frames), "frames": frames}


@router.post("/confirm/{job_id}")
def confirm_frames(job_id: str, db: Session = Depends(get_db)):
    """Confirm pending frames from a job — move them to annotation queue."""
    with _job_lock:
        job = _extraction_jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        frames = job.get("frames", [])

    confirmed = 0
    for f in frames:
        frame = db.query(Frame).filter(Frame.id == f["id"]).first()
        if frame and frame.status == "pending":
            frame.status = "confirmed"
            confirmed += 1
    db.commit()

    return {"ok": True, "confirmed": confirmed}


@router.post("/discard/{job_id}")
def discard_frames(job_id: str, db: Session = Depends(get_db)):
    """Discard pending frames from a job — delete them permanently."""
    with _job_lock:
        job = _extraction_jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        frames = job.get("frames", [])

    discarded = 0
    for f in frames:
        frame = db.query(Frame).filter(Frame.id == f["id"]).first()
        if frame and frame.status == "pending":
            # Delete physical file
            full_path = os.path.join(FRAMES_DIR, os.path.basename(frame.image_path))
            try:
                if os.path.exists(full_path):
                    os.remove(full_path)
            except OSError:
                pass
            db.delete(frame)
            discarded += 1
    db.commit()

    return {"ok": True, "discarded": discarded}


@router.post("/confirm-batch")
def confirm_batch(frame_ids: List[int], db: Session = Depends(get_db)):
    """Confirm multiple pending frames by ID list (works for both auto and manual frames)."""
    confirmed = 0
    for fid in frame_ids:
        frame = db.query(Frame).filter(Frame.id == fid).first()
        if frame and frame.status == "pending":
            frame.status = "confirmed"
            confirmed += 1
    db.commit()
    return {"ok": True, "confirmed": confirmed}


@router.post("/discard-batch")
def discard_batch(frame_ids: List[int], db: Session = Depends(get_db)):
    """Discard multiple pending frames by ID list — delete them permanently."""
    discarded = 0
    for fid in frame_ids:
        frame = db.query(Frame).filter(Frame.id == fid).first()
        if frame and frame.status == "pending":
            full_path = os.path.join(FRAMES_DIR, os.path.basename(frame.image_path))
            try:
                if os.path.exists(full_path):
                    os.remove(full_path)
            except OSError:
                pass
            db.delete(frame)
            discarded += 1
    db.commit()
    return {"ok": True, "discarded": discarded}


@router.delete("/{frame_id}")
def delete_frame(frame_id: int, db: Session = Depends(get_db)):
    frame = db.query(Frame).filter(Frame.id == frame_id).first()
    if not frame:
        raise HTTPException(status_code=404, detail="Frame not found")
    
    # Delete physical file (ignore filesystem errors)
    full_path = os.path.join(FRAMES_DIR, os.path.basename(frame.image_path))
    try:
        if os.path.exists(full_path):
            os.remove(full_path)
    except OSError:
        pass
    
    db.delete(frame)
    db.commit()
    return {"ok": True}
