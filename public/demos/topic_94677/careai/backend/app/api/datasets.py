from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.models import Dataset, Frame, Camera

router = APIRouter(prefix="/datasets", tags=["datasets"])


class DatasetCreate(BaseModel):
    name: str
    description: str = ""
    camera_id: Optional[int] = None


class DatasetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.get("/")
def list_datasets(db: Session = Depends(get_db)):
    """List all datasets with frame counts."""
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    result = []
    for ds in datasets:
        frame_count = db.query(Frame).filter(Frame.dataset_id == ds.id).count()
        annotated_count = db.query(Frame).filter(Frame.dataset_id == ds.id, Frame.is_annotated == True).count()
        cam_name = None
        if ds.camera_id:
            cam = db.query(Camera).filter(Camera.id == ds.camera_id).first()
            if cam:
                cam_name = cam.name
        result.append({
            "id": ds.id,
            "name": ds.name,
            "description": ds.description,
            "camera_id": ds.camera_id,
            "camera_name": cam_name,
            "frame_count": frame_count,
            "annotated_count": annotated_count,
            "created_at": ds.created_at.isoformat() if ds.created_at else None,
        })
    return result


@router.post("/")
def create_dataset(ds: DatasetCreate, db: Session = Depends(get_db)):
    """Create a new dataset."""
    existing = db.query(Dataset).filter(Dataset.name == ds.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Dataset '{ds.name}' already exists")
    db_ds = Dataset(name=ds.name, description=ds.description, camera_id=ds.camera_id)
    db.add(db_ds)
    db.commit()
    db.refresh(db_ds)
    return {
        "id": db_ds.id,
        "name": db_ds.name,
        "description": db_ds.description,
        "camera_id": db_ds.camera_id,
    }


@router.put("/{dataset_id}")
def update_dataset(dataset_id: int, ds_update: DatasetUpdate, db: Session = Depends(get_db)):
    """Update dataset name or description."""
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    if ds_update.name is not None:
        ds.name = ds_update.name
    if ds_update.description is not None:
        ds.description = ds_update.description
    db.commit()
    db.refresh(ds)
    return {"id": ds.id, "name": ds.name, "description": ds.description}


@router.delete("/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Delete a dataset. Frames are unlinked (dataset_id set to NULL), not deleted."""
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    # Unlink frames
    frames = db.query(Frame).filter(Frame.dataset_id == dataset_id).all()
    for f in frames:
        f.dataset_id = None
    db.delete(ds)
    db.commit()
    return {"ok": True, "unlinked_frames": len(frames)}


@router.post("/{dataset_id}/assign-frames")
def assign_frames_to_dataset(dataset_id: int, frame_ids: List[int], db: Session = Depends(get_db)):
    """Assign a list of frame IDs to a dataset."""
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    updated = 0
    for fid in frame_ids:
        frame = db.query(Frame).filter(Frame.id == fid).first()
        if frame:
            frame.dataset_id = dataset_id
            updated += 1
    db.commit()
    return {"ok": True, "assigned": updated}


@router.post("/{dataset_id}/assign-camera/{camera_id}")
def assign_camera_frames_to_dataset(dataset_id: int, camera_id: int, db: Session = Depends(get_db)):
    """Assign all frames from a camera to a dataset."""
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    frames = db.query(Frame).filter(Frame.camera_id == camera_id).all()
    for f in frames:
        f.dataset_id = dataset_id
    db.commit()
    return {"ok": True, "assigned": len(frames)}
