from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.schemas import AnnotationCreate, AnnotationOut
from app.core.labels import validate_label, ALL_LABELS, get_labels_for_frontend
from app.models.models import Annotation, Frame

router = APIRouter(prefix="/annotations", tags=["annotations"])


@router.get("/", response_model=List[AnnotationOut])
def list_annotations(
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List all annotations. Optional filter by source (manual/auto)."""
    query = db.query(Annotation)
    if source:
        query = query.filter(Annotation.source == source)
    return query.all()


@router.get("/labels")
def get_labels():
    """Return all available labels with categories for frontend rendering."""
    return {"categories": get_labels_for_frontend(), "all_labels": ALL_LABELS}


@router.post("/", response_model=AnnotationOut)
def create_annotation(annotation: AnnotationCreate, db: Session = Depends(get_db)):
    """Create or update an annotation for a frame."""
    # Validate label
    if not validate_label(annotation.label):
        raise HTTPException(status_code=400, detail=f"Invalid label: {annotation.label}")

    # Check if annotation already exists for this frame
    existing = db.query(Annotation).filter(Annotation.frame_id == annotation.frame_id).first()
    if existing:
        # Update existing annotation
        existing.label = annotation.label
        existing.source = annotation.source
        existing.confidence = annotation.confidence
        db.commit()
        db.refresh(existing)
        return existing

    db_annotation = Annotation(**annotation.dict())
    db.add(db_annotation)
    # mark frame as annotated
    frame = db.query(Frame).filter(Frame.id == annotation.frame_id).first()
    if frame:
        frame.is_annotated = True
    db.commit()
    db.refresh(db_annotation)
    return db_annotation


@router.get("/frame/{frame_id}")
def get_annotation_by_frame(frame_id: int, db: Session = Depends(get_db)):
    """Get annotation for a specific frame, if it exists."""
    ann = db.query(Annotation).filter(Annotation.frame_id == frame_id).first()
    if not ann:
        return {"exists": False}
    return {"exists": True, "id": ann.id, "label": ann.label, "source": ann.source, "confidence": ann.confidence}


@router.put("/{annotation_id}", response_model=AnnotationOut)
def update_annotation(annotation_id: int, label: str, db: Session = Depends(get_db)):
    """Update an annotation's label (e.g., override auto-annotation)."""
    if not validate_label(label):
        raise HTTPException(status_code=400, detail=f"Invalid label: {label}")

    ann = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Annotation not found")

    ann.label = label
    ann.source = "manual"  # Override always marks as manual
    ann.confidence = 1.0
    db.commit()
    db.refresh(ann)
    return ann


@router.delete("/{annotation_id}")
def delete_annotation(annotation_id: int, db: Session = Depends(get_db)):
    """Delete an annotation and unmark the frame."""
    ann = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Annotation not found")

    frame = db.query(Frame).filter(Frame.id == ann.frame_id).first()
    if frame:
        frame.is_annotated = False

    db.delete(ann)
    db.commit()
    return {"ok": True}
