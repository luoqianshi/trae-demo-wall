"""
Real inference service using ONNX Runtime.
Loads the active model and performs actual image classification.
Supports both single-label (legacy) and multi-label models.

Privacy: All inference runs locally. No cloud API calls.
Model files and image data never leave the local machine.
"""
import os
import json
import numpy as np
import onnxruntime as ort
from PIL import Image
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.models import Event, AlertRule, ModelVersion, Frame
from app.core.labels import get_risk_level, get_description, is_normal, is_urgent

# ---- Paths ----
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../../models")
FRAMES_DIR = os.path.join(os.path.dirname(__file__), "../../frames")
IMAGE_SIZE = 224

# Normalization constants (same as training)
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Cache for loaded model
_model_cache = {}


def _load_model(db: Session):
    """Load the active ONNX model and its label mapping. Returns (session, labels, model, is_multi) or None."""
    model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    if not model:
        model = db.query(ModelVersion).filter(ModelVersion.status == "ready").first()
    if not model:
        return None, None, None, False

    onnx_path = os.path.join(MODELS_DIR, os.path.basename(model.path))
    label_path = os.path.join(MODELS_DIR, os.path.basename(model.path).replace(".onnx", "_labels.json"))

    if not os.path.exists(onnx_path) or not os.path.exists(label_path):
        return None, None, None, False

    # Use cache if available
    cache_key = model.path
    if cache_key in _model_cache:
        return _model_cache[cache_key]

    # Load ONNX model
    sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])

    # Load labels and check if multi-label
    with open(label_path, "r", encoding="utf-8") as f:
        label_data = json.load(f)
    labels = label_data["labels"]
    is_multi = label_data.get("multi_label", False)

    _model_cache[cache_key] = (sess, labels, model, is_multi)
    return sess, labels, model, is_multi


def _preprocess_image(img_path: str) -> np.ndarray:
    """Load and preprocess image for ONNX inference."""
    img = Image.open(img_path).convert("RGB")
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE))
    img_array = np.array(img, dtype=np.float32) / 255.0
    img_array = (img_array - MEAN) / STD
    img_array = img_array.transpose(2, 0, 1)  # HWC -> CHW
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    return img_array


def infer(frame_path: str, db: Session) -> dict:
    """
    Run real inference on a frame using the active ONNX model.
    Returns {"label": str, "confidence": float, "model_name": str} or None if no model.
    For multi-label models, returns comma-separated labels with average confidence.
    """
    sess, labels, model, is_multi = _load_model(db)
    if sess is None:
        return None

    # Resolve image path
    img_filename = os.path.basename(frame_path)
    img_path = os.path.join(FRAMES_DIR, img_filename)
    if not os.path.exists(img_path):
        return None

    # Preprocess and run inference
    input_data = _preprocess_image(img_path)
    input_name = sess.get_inputs()[0].name
    outputs = sess.run(None, {input_name: input_data})
    logits = outputs[0][0]

    if is_multi:
        # Multi-label: sigmoid, threshold 0.5
        probs = 1.0 / (1.0 + np.exp(-logits))  # sigmoid
        active_indices = np.where(probs >= 0.5)[0]

        if len(active_indices) == 0:
            # No label above threshold, take top-3
            top_indices = np.argsort(probs)[::-1][:3]
            active_indices = top_indices

        active_labels = [labels[i] for i in active_indices]
        active_confs = [float(probs[i]) for i in active_indices]
        label = ",".join(active_labels)
        confidence = round(sum(active_confs) / len(active_confs), 4)
    else:
        # Legacy single-label: softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)
        top_idx = int(np.argmax(probs))
        label = labels[top_idx]
        confidence = round(float(probs[top_idx]), 4)

    return {"label": label, "confidence": confidence, "model_name": model.name}


def process_frame(frame_path: str, camera_id: int, db: Session) -> Event:
    """Process a single frame: run inference and create event if non-normal."""
    result = infer(frame_path, db)
    if result is None:
        return None

    label = result["label"]
    confidence = result["confidence"]
    risk = get_risk_level(label)

    # Only create events for non-normal states
    if is_normal(label):
        return None

    # Check alert rule - match any of the active labels
    labels_list = [l.strip() for l in label.split(",") if l.strip()]
    rule = db.query(AlertRule).filter(AlertRule.state_name.in_(labels_list)).first()
    if rule and not rule.is_enabled:
        return None

    event = Event(
        event_type=label,
        risk_level=risk,
        description=get_description(label),
        confidence=confidence,
        image_path=frame_path,
        camera_id=camera_id,
        is_notified=is_urgent(label)
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
