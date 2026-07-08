from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.schemas import CameraCreate, CameraOut
from app.models.models import Camera, Dataset

router = APIRouter(prefix="/cameras", tags=["cameras"])


@router.get("/", response_model=List[CameraOut])
def list_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()


@router.post("/", response_model=CameraOut)
def create_camera(camera: CameraCreate, db: Session = Depends(get_db)):
    db_camera = Camera(**camera.dict())
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    # Auto-create a dataset with the camera's name
    ds = Dataset(name=db_camera.name, description=f"摄像头「{db_camera.name}」的默认数据集", camera_id=db_camera.id)
    db.add(ds)
    db.commit()
    return db_camera


@router.delete("/{camera_id}")
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    # Delete associated auto-created dataset
    ds = db.query(Dataset).filter(Dataset.camera_id == camera_id).first()
    if ds:
        db.delete(ds)
    db.delete(camera)
    db.commit()
    return {"ok": True}
