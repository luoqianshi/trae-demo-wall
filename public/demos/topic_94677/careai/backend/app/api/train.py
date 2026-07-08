from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from fastapi import Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
import threading
import os

from app.core.database import get_db, SessionLocal
from app.models.models import ModelVersion, Frame, Annotation, Camera
from app.services.training import start_training
from app.services.inference import infer, process_frame
from app.core.labels import is_normal

router = APIRouter(prefix="/train", tags=["train"])

# ---- Auto-annotation job store ----
_auto_annotate_jobs: dict = {}
_aa_lock = threading.Lock()

# ---- Training stop flag ----
_stop_flags: dict = {}


@router.post("/stop")
def stop_training(db: Session = Depends(get_db)):
    """Stop the current training job."""
    model = db.query(ModelVersion).filter(
        ModelVersion.status.like("training%")
    ).order_by(ModelVersion.created_at.desc()).first()

    if not model:
        return {"error": "No training in progress"}

    # Set stop flag
    _stop_flags[model.id] = True

    # Mark model as stopped
    model.status = "stopped"
    db.commit()

    return {"message": "Training stop signal sent", "model_name": model.name, "model_id": model.id}


@router.post("/")
async def train_model(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Start model training in background. Uses annotated frames from DB as dataset.
    JSON body: { num_epochs, base_model, camera_id, model_name }
    base_model: "incremental" to load current active model weights, None for from-scratch.
    camera_id: if provided, only train on frames from this camera.
    """
    # Parse JSON body
    try:
        body = await request.json()
    except Exception:
        body = {}

    num_epochs = body.get("num_epochs", 50)
    base_model = body.get("base_model")
    camera_id = body.get("camera_id")
    dataset_id = body.get("dataset_id")
    model_name = body.get("model_name")
    running = db.query(ModelVersion).filter(ModelVersion.status.like("training%")).first()
    if running:
        return {"error": "Training already in progress", "model": running.name, "status": running.status}

    if not model_name:
        model_name = f"care-home-{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    # Count annotations for the selected camera/dataset (or all)
    ann_query = db.query(Annotation)
    if camera_id is not None or dataset_id is not None:
        ann_query = ann_query.join(Frame, Annotation.frame_id == Frame.id)
        if camera_id is not None:
            ann_query = ann_query.filter(Frame.camera_id == camera_id)
        if dataset_id is not None:
            ann_query = ann_query.filter(Frame.dataset_id == dataset_id)
    ann_count = ann_query.count()
    if ann_count == 0:
        return {"error": "No annotated samples found. Please annotate some frames first."}

    # For incremental training, find the active model's path
    incremental = base_model == "incremental"
    base_model_path = None
    if incremental:
        active = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
        if not active:
            active = db.query(ModelVersion).filter(ModelVersion.status == "ready").order_by(ModelVersion.created_at.desc()).first()
        if active and active.path:
            base_model_path = os.path.join(os.path.dirname(__file__), "../../models", os.path.basename(active.path))
            if not os.path.exists(base_model_path):
                base_model_path = None
        if not base_model_path:
            return {"error": "No existing model found for incremental training. Please train from scratch first."}

    def db_factory():
        return SessionLocal()

    result = start_training(model_name, num_epochs, db_factory, base_model_path=base_model_path, camera_id=camera_id, dataset_id=dataset_id)

    # Get camera name for logging
    cam_name = "全部摄像头"
    if camera_id is not None:
        cam = db.query(Camera).filter(Camera.id == camera_id).first()
        if cam:
            cam_name = cam.name

    return {
        "message": "Training started",
        "model_name": model_name,
        "num_epochs": num_epochs,
        "dataset_size": ann_count,
        "base_model": "incremental" if incremental else "scratch",
        "camera": cam_name
    }


@router.get("/status")
def training_status(db: Session = Depends(get_db)):
    """Get current training status."""
    from app.services.training import get_training_logs

    model = db.query(ModelVersion).filter(
        ModelVersion.status.like("training%")
    ).order_by(ModelVersion.created_at.desc()).first()

    if not model:
        latest = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).first()
        if latest:
            return {
                "status": "idle",
                "message": f"Last model: {latest.name} ({latest.status})",
                "model_name": latest.name,
                "accuracy": latest.accuracy,
                "model_id": latest.id,
                "logs": get_training_logs(latest.id)
            }
        return {"status": "idle", "message": "No training has been performed yet", "logs": []}

    # Calculate elapsed time
    from datetime import datetime, timezone
    elapsed_seconds = 0
    if model.created_at:
        # created_at is stored as UTC (SQLite default), compare with utcnow
        elapsed_seconds = (datetime.utcnow() - model.created_at).total_seconds()

    # Get training logs
    logs = get_training_logs(model.id)

    return {
        "status": model.status,
        "model_id": model.id,
        "model_name": model.name,
        "started_at": model.created_at.isoformat() if model.created_at else None,
        "elapsed_seconds": round(elapsed_seconds),
        "logs": logs
    }


@router.post("/infer/{frame_id}")
def run_inference(frame_id: int, db: Session = Depends(get_db)):
    """Run inference on a specific frame using the active model."""
    frame = db.query(Frame).filter(Frame.id == frame_id).first()
    if not frame:
        return {"error": "Frame not found"}

    result = infer(frame.image_path, db)
    if result is None:
        return {"error": "No trained model available. Please train a model first."}

    return {
        "frame_id": frame_id,
        "label": result["label"],
        "confidence": result["confidence"],
        "model_name": result["model_name"]
    }


@router.post("/infer-all")
def run_inference_all(db: Session = Depends(get_db)):
    """Run inference on all unannotated frames and create events for non-normal states."""
    frames = db.query(Frame).filter(Frame.is_annotated == False).all()
    if not frames:
        return {"message": "No unannotated frames to process"}

    events_created = 0
    frames_processed = 0

    for frame in frames:
        result = infer(frame.image_path, db)
        if result is None:
            return {"error": "No trained model available. Please train a model first."}

        frames_processed += 1
        event = process_frame(frame.image_path, frame.camera_id, db)
        if event:
            events_created += 1

    return {
        "frames_processed": frames_processed,
        "events_created": events_created,
        "message": f"Processed {frames_processed} frames, created {events_created} events"
    }


# ---- Auto-annotation pipeline ----

def _run_auto_annotate(job_id: str, confidence_threshold: float):
    """
    Background worker: run model inference on all unannotated frames,
    auto-create annotations for high-confidence predictions.
    """
    db = SessionLocal()
    try:
        # Get all unannotated frames
        frames = db.query(Frame).filter(Frame.is_annotated == False).all()
        total = len(frames)

        with _aa_lock:
            _auto_annotate_jobs[job_id]["total"] = total
            _auto_annotate_jobs[job_id]["processed"] = 0
            _auto_annotate_jobs[job_id]["auto_annotated"] = 0
            _auto_annotate_jobs[job_id]["low_confidence"] = 0
            _auto_annotate_jobs[job_id]["results"] = []

        auto_count = 0
        low_conf_count = 0
        results = []

        for i, frame in enumerate(frames):
            # Skip frames that already have annotations (manual or auto)
            existing_ann = db.query(Annotation).filter(Annotation.frame_id == frame.id).first()
            if existing_ann:
                with _aa_lock:
                    _auto_annotate_jobs[job_id]["processed"] = i + 1
                    _auto_annotate_jobs[job_id]["progress"] = min(100, int((i + 1) / max(1, total) * 100))
                continue

            result = infer(frame.image_path, db)

            if result is None:
                # No model available
                with _aa_lock:
                    _auto_annotate_jobs[job_id]["status"] = "error"
                    _auto_annotate_jobs[job_id]["error"] = "No trained model available"
                return

            label = result["label"]
            confidence = result["confidence"]

            if confidence >= confidence_threshold:
                # Auto-annotate: create annotation with source="auto"
                # But do NOT mark frame as is_annotated=True - it needs human confirmation
                ann = Annotation(
                    frame_id=frame.id,
                    label=label,
                    source="auto",
                    confidence=confidence,
                    annotated_by="model"
                )
                db.add(ann)
                # Keep is_annotated=False so it still shows as "needs confirmation"
                db.commit()
                db.refresh(ann)
                auto_count += 1
                results.append({
                    "frame_id": frame.id,
                    "label": label,
                    "confidence": round(confidence, 4),
                    "auto_annotated": True,
                })
            else:
                # Low confidence: leave for manual review
                low_conf_count += 1
                results.append({
                    "frame_id": frame.id,
                    "label": label,
                    "confidence": round(confidence, 4),
                    "auto_annotated": False,
                })

            # Update progress
            with _aa_lock:
                _auto_annotate_jobs[job_id]["processed"] = i + 1
                _auto_annotate_jobs[job_id]["auto_annotated"] = auto_count
                _auto_annotate_jobs[job_id]["low_confidence"] = low_conf_count
                _auto_annotate_jobs[job_id]["progress"] = min(100, int((i + 1) / max(1, total) * 100))

        with _aa_lock:
            _auto_annotate_jobs[job_id]["status"] = "done"
            _auto_annotate_jobs[job_id]["progress"] = 100
            _auto_annotate_jobs[job_id]["results"] = results

    except Exception as e:
        with _aa_lock:
            _auto_annotate_jobs[job_id]["status"] = "error"
            _auto_annotate_jobs[job_id]["error"] = str(e)
    finally:
        db.close()


@router.post("/auto-annotate")
def auto_annotate(
    confidence_threshold: float = 0.85,
    db: Session = Depends(get_db)
):
    """
    Run auto-annotation pipeline on all unannotated frames.

    Uses the active local model to predict labels for each frame.
    Frames with confidence >= threshold are auto-annotated.
    Low-confidence frames are left for manual review.

    All processing is local. No data leaves this machine.

    Returns a job_id for progress polling via GET /train/auto-annotate-status/{job_id}.
    """
    # Check if model exists
    model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    if not model:
        model = db.query(ModelVersion).filter(ModelVersion.status == "ready").first()
    if not model:
        return {"error": "No trained model available. Please train a model first."}

    # Check if there are unannotated frames
    unannotated_count = db.query(Frame).filter(Frame.is_annotated == False).count()
    if unannotated_count == 0:
        return {"message": "No unannotated frames to process"}

    import uuid
    job_id = uuid.uuid4().hex[:12]
    with _aa_lock:
        _auto_annotate_jobs[job_id] = {
            "status": "processing",
            "progress": 0,
            "total": unannotated_count,
            "processed": 0,
            "auto_annotated": 0,
            "low_confidence": 0,
            "confidence_threshold": confidence_threshold,
            "model_name": model.name,
            "results": [],
            "error": None,
        }

    thread = threading.Thread(
        target=_run_auto_annotate,
        args=(job_id, confidence_threshold),
        daemon=True,
    )
    thread.start()

    return {
        "job_id": job_id,
        "total_frames": unannotated_count,
        "confidence_threshold": confidence_threshold,
        "model_name": model.name,
    }


@router.get("/auto-annotate-status/{job_id}")
def auto_annotate_status(job_id: str):
    """Poll auto-annotation job progress."""
    with _aa_lock:
        job = _auto_annotate_jobs.get(job_id)
        if not job:
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Job not found")
        return dict(job)
