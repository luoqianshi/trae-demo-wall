from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os

from app.core.database import get_db
from app.core.schemas import ModelVersionOut
from app.models.models import ModelVersion

router = APIRouter(prefix="/models", tags=["models"])

MODELS_DIR = os.path.join(os.path.dirname(__file__), "../../models")


@router.get("/", response_model=List[ModelVersionOut])
def list_models(db: Session = Depends(get_db)):
    return db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).all()


@router.post("/switch/{model_id}")
def switch_model(model_id: int, db: Session = Depends(get_db)):
    db.query(ModelVersion).update({ModelVersion.is_active: False})
    model = db.query(ModelVersion).filter(ModelVersion.id == model_id).first()
    if model:
        model.is_active = True
        db.commit()
    return {"ok": True}


@router.delete("/{model_id}")
def delete_model(model_id: int, db: Session = Depends(get_db)):
    """Delete a model version and its files."""
    model = db.query(ModelVersion).filter(ModelVersion.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    if model.is_active:
        raise HTTPException(status_code=400, detail="Cannot delete the active model. Switch to another model first.")

    if model.status and "training" in model.status:
        raise HTTPException(status_code=400, detail="Cannot delete a model that is currently training. Stop training first.")

    # Delete ONNX and label files
    if model.path:
        onnx_path = os.path.join(MODELS_DIR, os.path.basename(model.path))
        if os.path.exists(onnx_path):
            os.remove(onnx_path)
        label_path = onnx_path.replace(".onnx", "_labels.json")
        if os.path.exists(label_path):
            os.remove(label_path)

    db.delete(model)
    db.commit()
    return {"ok": True, "message": f"Model '{model.name}' deleted"}
