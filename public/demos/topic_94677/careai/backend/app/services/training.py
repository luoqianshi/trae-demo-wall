"""
Real model training service based on ResNet18 transfer learning.
Trains on annotated frames, exports to ONNX format.
Supports multi-label classification (each frame can have multiple tags).
"""
import os
import io
import time
import threading
import json
import numpy as np
from PIL import Image
from datetime import datetime

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import torchvision
from torchvision import transforms

from app.models.models import ModelVersion, Annotation, Frame
from app.core.labels import ALL_LABELS, LABEL_CATEGORIES, PRIVACY_LABELS

# Import stop flags from train API (circular import safe at runtime)
def _get_stop_flag(model_id):
    try:
        from app.api.train import _stop_flags
        return _stop_flags.get(model_id, False)
    except Exception:
        return False

# Training logs store: model_id -> list of log entries
_training_logs: dict = {}

def add_training_log(model_id, text):
    """Add a log entry for a training job."""
    if model_id not in _training_logs:
        _training_logs[model_id] = []
    _training_logs[model_id].append(text)
    # Keep last 200 entries
    if len(_training_logs[model_id]) > 200:
        _training_logs[model_id] = _training_logs[model_id][-200:]

def get_training_logs(model_id):
    """Get all log entries for a training job."""
    return _training_logs.get(model_id, [])

def clear_training_logs(model_id):
    """Clear logs for a training job."""
    if model_id in _training_logs:
        del _training_logs[model_id]


# ---- Config ----
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../../models")
os.makedirs(MODELS_DIR, exist_ok=True)
FRAMES_DIR = os.path.join(os.path.dirname(__file__), "../../frames")
IMAGE_SIZE = 224
BATCH_SIZE = 16


def _get_all_individual_labels():
    """Get all individual labels from label categories (excluding privacy labels).

    Privacy labels (上身裸露, 下身裸露, 更衣中) are intentionally excluded so
    they never become model output classes. They are only used to trigger
    image blurring, not for training.
    """
    labels = []
    for cat in LABEL_CATEGORIES:
        for item in cat["items"]:
            if item not in PRIVACY_LABELS:
                labels.append(item)
    # Also include any legacy labels (excluding privacy labels)
    for l in ALL_LABELS:
        if l not in labels and l not in PRIVACY_LABELS:
            labels.append(l)
    return labels


class FrameDataset(Dataset):
    """Dataset that loads annotated frames from DB.
    Supports multi-label: each frame can have multiple comma-separated tags.
    """

    def __init__(self, db, transform=None, label_list=None, camera_id=None, dataset_id=None):
        self.transform = transform
        ann_query = db.query(Annotation)
        if camera_id is not None or dataset_id is not None:
            ann_query = ann_query.join(Frame, Annotation.frame_id == Frame.id)
            if camera_id is not None:
                ann_query = ann_query.filter(Frame.camera_id == camera_id)
            if dataset_id is not None:
                ann_query = ann_query.filter(Frame.dataset_id == dataset_id)
        annotations = ann_query.all()
        self.samples = []

        # Use provided label list or build from data
        if label_list:
            self.label_list = label_list
        else:
            all_labels_set = set()
            for ann in annotations:
                tags = [t.strip() for t in ann.label.split(",") if t.strip()]
                for t in tags:
                    # Privacy labels are excluded from the label space
                    if t not in PRIVACY_LABELS:
                        all_labels_set.add(t)
            # Merge with predefined labels for stable ordering
            predefined = _get_all_individual_labels()
            self.label_list = predefined + sorted(all_labels_set - set(predefined))

        self.label_to_idx = {label: i for i, label in enumerate(self.label_list)}
        self.num_classes = len(self.label_list)

        for ann in annotations:
            frame = db.query(Frame).filter(Frame.id == ann.frame_id).first()
            if not frame:
                continue
            img_filename = os.path.basename(frame.image_path)
            img_path = os.path.join(FRAMES_DIR, img_filename)
            if not os.path.exists(img_path):
                continue
            # Parse multi-label: create a multi-hot vector
            tags = [t.strip() for t in ann.label.split(",") if t.strip()]
            # Privacy labels do not participate in training:
            # - Samples whose labels are ALL privacy labels are skipped entirely.
            # - Samples with privacy + other labels are kept, but the privacy
            #   tags are ignored when building the training label vector.
            non_privacy_tags = [t for t in tags if t not in PRIVACY_LABELS]
            if not non_privacy_tags:
                # Only privacy labels present - exclude from training
                continue
            label_vec = np.zeros(self.num_classes, dtype=np.float32)
            for t in non_privacy_tags:
                if t in self.label_to_idx:
                    label_vec[self.label_to_idx[t]] = 1.0
                else:
                    # Custom label not in predefined list - add it
                    self.label_list.append(t)
                    self.label_to_idx[t] = len(self.label_list) - 1
                    label_vec = np.append(label_vec, 0.0)
                    self.num_classes = len(self.label_list)
                    label_vec[self.label_to_idx[t]] = 1.0
            self.samples.append((img_path, label_vec))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img_path, label_vec = self.samples[idx]
        image = Image.open(img_path).convert("RGB")
        if self.transform:
            image = self.transform(image)
        return image, torch.from_numpy(label_vec)


def get_transforms():
    """Return train and val transforms."""
    train_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE + 20, IMAGE_SIZE + 20)),
        transforms.RandomCrop(IMAGE_SIZE),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    val_transform = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform


def train_model_job(model_name: str, num_epochs: int, db_session_factory, base_model_path=None, camera_id=None, dataset_id=None):
    """Background training job with ResNet18 transfer learning.
    Uses multi-label BCE loss for comma-separated tags.
    base_model_path: if provided, load weights from this ONNX model (incremental training).
    camera_id: if provided, only train on frames from this camera.
    dataset_id: if provided, only train on frames from this dataset.
    """
    db = db_session_factory()

    try:
        # Create model record
        model = ModelVersion(
            name=model_name,
            path=f"models/{model_name}.onnx",
            status="preparing",
            is_active=False
        )
        db.add(model)
        db.commit()
        db.refresh(model)

        # Load dataset
        train_transform, val_transform = get_transforms()

        # First pass: collect all individual labels to build stable label list
        all_labels = _get_all_individual_labels()

        dataset = FrameDataset(db, transform=train_transform, label_list=list(all_labels), camera_id=camera_id, dataset_id=dataset_id)

        if len(dataset) == 0:
            model.status = "failed: no annotated samples found"
            db.commit()
            return

        num_classes = dataset.num_classes
        num_samples = len(dataset)
        model.status = f"training (0/{num_epochs})"
        model.num_samples = num_samples
        model.num_labels = num_classes
        db.commit()

        # Split train/val (80/20, at least 1 sample each)
        if num_samples < 2:
            train_indices = list(range(num_samples))
            val_indices = list(range(num_samples))
        else:
            split = max(1, int(num_samples * 0.8))
            train_indices = list(range(split))
            val_indices = list(range(split, num_samples))

        from torch.utils.data import Subset
        train_dataset = Subset(dataset, train_indices)
        val_dataset = FrameDataset(db, transform=val_transform, label_list=list(all_labels), camera_id=camera_id, dataset_id=dataset_id)
        val_dataset.samples = [dataset.samples[i] for i in val_indices]
        val_dataset.label_list = dataset.label_list
        val_dataset.label_to_idx = dataset.label_to_idx
        val_dataset.num_classes = dataset.num_classes

        train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, drop_last=False)
        val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

        # Build model: ResNet18 with custom head for multi-label
        backbone = torchvision.models.resnet18(weights=torchvision.models.ResNet18_Weights.DEFAULT)
        num_features = backbone.fc.in_features
        backbone.fc = nn.Linear(num_features, num_classes)

        # Incremental training: load weights from previous ONNX model
        if base_model_path and os.path.exists(base_model_path):
            try:
                import onnx
                from onnx2torch import onnx2torch
                prev_model = onnx2torch(base_model_path)
                # Try to copy compatible weights
                prev_state = prev_model.state_dict()
                curr_state = backbone.state_dict()
                loaded = 0
                for key in curr_state:
                    if key in prev_state and prev_state[key].shape == curr_state[key].shape:
                        curr_state[key] = prev_state[key]
                        loaded += 1
                backbone.load_state_dict(curr_state)
                print(f"[Training] Loaded {loaded}/{len(curr_state)} weight tensors from {base_model_path}")
            except Exception as e:
                print(f"[Training] Could not load base model weights: {e}, training from scratch")

        model_net = backbone

        device = torch.device("cpu")
        model_net = model_net.to(device)

        # Multi-label loss: BCE for each label independently
        criterion = nn.BCEWithLogitsLoss()
        # Use lower learning rate for incremental training
        lr = 0.0003 if base_model_path else 0.001
        optimizer = torch.optim.Adam(model_net.parameters(), lr=lr)

        best_val_acc = 0.0
        was_stopped = False
        early_stopped = False
        patience = 10  # Stop if no improvement for 10 consecutive epochs
        no_improve_count = 0
        import time
        train_start_time = time.time()

        # Log training start
        cam_label = "全部摄像头" if camera_id is None else f"摄像头 ID {camera_id}"
        ds_label = f", 数据集 ID {dataset_id}" if dataset_id is not None else ""
        add_training_log(model.id, f"[开始] 模型: {model_name} | 数据源: {cam_label}{ds_label}")
        add_training_log(model.id, f"[数据] 训练集 {len(train_indices)} 张, 验证集 {len(val_indices)} 张, 标签数 {num_classes}")
        add_training_log(model.id, f"[参数] 轮数: {num_epochs}, 学习率: {lr}, 批量: {BATCH_SIZE}, 早停耐心: {patience}轮")

        for epoch in range(1, num_epochs + 1):
            # Check stop flag
            if _get_stop_flag(model.id):
                was_stopped = True
                add_training_log(model.id, f"[停止] 用户手动停止训练 (第 {epoch} 轮)")
                break

            epoch_start = time.time()

            # Training phase
            model_net.train()
            running_loss = 0.0
            for images, labels in train_loader:
                images, labels = images.to(device), labels.to(device)
                optimizer.zero_grad()
                outputs = model_net(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                running_loss += loss.item()

            # Validation phase: multi-label accuracy
            model_net.eval()
            correct = 0
            total = 0
            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(device), labels.to(device)
                    outputs = model_net(images)
                    preds = (torch.sigmoid(outputs) > 0.5).float()
                    total += labels.size(0)
                    correct += (preds == labels).all(dim=1).sum().item()

            val_acc = correct / total if total > 0 else 0.0
            avg_loss = running_loss / max(len(train_loader), 1)
            epoch_time = time.time() - epoch_start
            elapsed = time.time() - train_start_time

            improved = val_acc > best_val_acc
            if improved:
                best_val_acc = val_acc
                no_improve_count = 0
            else:
                no_improve_count += 1

            # Log each epoch
            improvement = "↑" if improved else ""
            remaining_patience = patience - no_improve_count
            early_stop_hint = f" [早停倒计时: {remaining_patience}轮]" if (no_improve_count > 0 and remaining_patience <= 5) else ""
            add_training_log(model.id, f"[第{epoch}/{num_epochs}轮] loss={avg_loss:.4f} 验证准确率={val_acc:.1%} 最佳={best_val_acc:.1%} {improvement} 耗时={epoch_time:.1f}s 累计={elapsed:.0f}s{early_stop_hint}")

            # Update DB status
            model.status = f"training ({epoch}/{num_epochs}) loss={avg_loss:.3f} val_acc={val_acc:.3f}"
            db.commit()

            # Early stopping check
            if no_improve_count >= patience:
                early_stopped = True
                add_training_log(model.id, f"[早停] 连续 {patience} 轮验证准确率未提升，自动停止训练 (第 {epoch} 轮)")
                break

        # Export to ONNX
        model_net.eval()
        dummy_input = torch.randn(1, 3, IMAGE_SIZE, IMAGE_SIZE)
        onnx_path = os.path.join(MODELS_DIR, f"{model_name}.onnx")
        torch.onnx.export(
            model_net,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=13,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
            dynamo=False
        )

        # Save label mapping alongside model
        label_map_path = os.path.join(MODELS_DIR, f"{model_name}_labels.json")
        with open(label_map_path, "w", encoding="utf-8") as f:
            json.dump({"labels": dataset.label_list, "multi_label": True}, f, ensure_ascii=False)

        # Update model record
        model.status = "ready"
        model.accuracy = round(best_val_acc, 4)
        model.num_samples = num_samples
        model.num_labels = num_classes
        model.path = f"models/{model_name}.onnx"
        if was_stopped:
            model.status = "stopped"
            add_training_log(model.id, f"[结果] 训练已停止, 最佳准确率: {best_val_acc:.1%}")
        else:
            add_training_log(model.id, f"[导出] 正在导出 ONNX 模型...")
            # Auto-activate the newly trained model
            db.query(ModelVersion).filter(ModelVersion.id != model.id).update({ModelVersion.is_active: False})
            model.is_active = True
            add_training_log(model.id, f"[激活] 模型已自动设为生效模型")
        db.commit()

        total_time = time.time() - train_start_time
        print(f"[Training] Model '{model_name}' training {'stopped' if was_stopped else ('early-stopped' if early_stopped else 'complete')}. "
              f"Best val accuracy: {best_val_acc:.4f}, saved to {onnx_path}, time: {total_time:.0f}s")

        if not was_stopped and not early_stopped:
            add_training_log(model.id, f"[完成] 训练完成! 最佳准确率: {best_val_acc:.1%}, 总耗时: {total_time:.0f}s")
        elif early_stopped:
            add_training_log(model.id, f"[完成] 训练完成(早停)! 最佳准确率: {best_val_acc:.1%}, 总耗时: {total_time:.0f}s")

    except Exception as e:
        print(f"[Training] Error: {e}")
        import traceback
        traceback.print_exc()
        try:
            model.status = f"failed: {str(e)[:200]}"
            db.commit()
            add_training_log(model.id, f"[错误] 训练失败: {str(e)[:200]}")
        except:
            pass
    finally:
        db.close()


def start_training(model_name: str, num_epochs: int = 50, db_session_factory=None, base_model_path=None, camera_id=None, dataset_id=None):
    """Start training in background thread."""
    if db_session_factory is None:
        from app.core.database import SessionLocal
        db_session_factory = SessionLocal

    thread = threading.Thread(
        target=train_model_job,
        args=(model_name, num_epochs, db_session_factory, base_model_path, camera_id, dataset_id)
    )
    thread.daemon = True
    thread.start()
    return {"message": "Training started", "model_name": model_name}
