import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
import warnings
warnings.filterwarnings('ignore')

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split, Dataset
from torchvision import datasets, transforms, models
from torchvision.utils import make_grid
from PIL import Image
import matplotlib.pyplot as plt
plt.rcParams['font.sans-serif'] = ['SimHei']
plt.rcParams['axes.unicode_minus'] = False
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay

DATA_DIR = r'dataset'
BATCH_SIZE = 16
GRADIENT_ACCUMULATION_STEPS = 2
EPOCHS = 15
LR = 0.001
WEIGHT_DECAY = 1e-4
PATIENCE = 5
MODEL_SAVE_PATH = 'emotion_model_best.pth'

class SafeImageFolder(Dataset):
    def __init__(self, root, transform=None):
        self.samples = []
        self.targets = []
        self.classes = []
        self.class_to_idx = {}
        
        for class_name in sorted(os.listdir(root)):
            class_dir = os.path.join(root, class_name)
            if not os.path.isdir(class_dir):
                continue
            class_idx = len(self.classes)
            self.classes.append(class_name)
            self.class_to_idx[class_name] = class_idx
            
            for img_name in os.listdir(class_dir):
                img_path = os.path.join(class_dir, img_name)
                if os.path.isfile(img_path):
                    self.samples.append((img_path, class_idx))
                    self.targets.append(class_idx)
        
        self.transform = transform
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, target = self.samples[idx]
        try:
            img = Image.open(img_path).convert('RGB')
            if self.transform:
                img = self.transform(img)
            return img, target
        except Exception:
            img = Image.new('RGB', (224, 224), color=(0, 0, 0))
            if self.transform:
                img = self.transform(img)
            return img, target

def build_transforms():
    train_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    return train_transform, val_transform

def build_model(num_classes):
    model = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
    num_ftrs = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(0.5),
        nn.Linear(num_ftrs, 256),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(256, num_classes)
    )
    return model

def train_model(model, train_loader, val_loader, criterion, optimizer, scheduler, device, epochs, patience):
    train_losses, val_losses = [], []
    train_accs, val_accs = [], []
    best_val_acc = 0.0
    best_epoch = 0
    patience_counter = 0

    print('\n开始训练...')
    for epoch in range(epochs):
        model.train()
        train_loss, train_correct, train_total = 0, 0, 0

        for batch_idx, (images, labels) in enumerate(train_loader):
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss = loss / GRADIENT_ACCUMULATION_STEPS
            loss.backward()

            if (batch_idx + 1) % GRADIENT_ACCUMULATION_STEPS == 0:
                optimizer.step()
                optimizer.zero_grad()

            train_loss += loss.item() * GRADIENT_ACCUMULATION_STEPS
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()

        if (len(train_loader) % GRADIENT_ACCUMULATION_STEPS != 0):
            optimizer.step()
            optimizer.zero_grad()

        scheduler.step()

        model.eval()
        val_loss, val_correct, val_total = 0, 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)

                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

        train_loss /= len(train_loader)
        val_loss /= len(val_loader)
        train_acc = train_correct / train_total
        val_acc = val_correct / val_total

        train_losses.append(train_loss)
        val_losses.append(val_loss)
        train_accs.append(train_acc)
        val_accs.append(val_acc)

        print(f'Epoch {epoch+1}/{epochs} | 训练损失: {train_loss:.4f}  训练准确率: {train_acc:.4f} | 验证损失: {val_loss:.4f}  验证准确率: {val_acc:.4f} | LR: {scheduler.get_last_lr()[0]:.6f}')

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_epoch = epoch + 1
            torch.save(model.state_dict(), MODEL_SAVE_PATH)
            patience_counter = 0
        else:
            patience_counter += 1

        if patience_counter >= patience:
            print(f'\n早停触发！连续 {patience} 轮验证准确率未提升')
            break

    return train_losses, val_losses, train_accs, val_accs, best_val_acc, best_epoch

def evaluate_model(model, val_loader, class_names, device):
    model.load_state_dict(torch.load(MODEL_SAVE_PATH))
    model.eval()

    print('\n分类报告:')
    y_true, y_pred = [], []
    with torch.no_grad():
        for images, labels in val_loader:
            images = images.to(device)
            outputs = model(images)
            _, predicted = outputs.max(1)
            y_true.extend(labels.tolist())
            y_pred.extend(predicted.tolist())

    print(classification_report(y_true, y_pred, target_names=class_names, digits=4))

    cm = confusion_matrix(y_true, y_pred)
    fig_cm, ax_cm = plt.subplots(figsize=(8, 6))
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_names)
    disp.plot(cmap='Blues', ax=ax_cm, xticks_rotation=45)
    ax_cm.set_title('混淆矩阵')
    plt.tight_layout()
    plt.savefig('confusion_matrix.png', dpi=150, bbox_inches='tight')
    plt.show()

    return y_true, y_pred

def plot_curves(train_losses, val_losses, train_accs, val_accs, best_epoch):
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    ax1.plot(train_losses, label='Train Loss')
    ax1.plot(val_losses, label='Val Loss')
    ax1.set_title('Loss 曲线')
    ax1.legend()

    ax2.plot(train_accs, label='Train Acc')
    ax2.plot(val_accs, label='Val Acc')
    ax2.axvline(x=best_epoch-1, color='r', linestyle='--', label='Best')
    ax2.set_title('准确率曲线')
    ax2.legend()
    plt.savefig('training_curves.png', dpi=150, bbox_inches='tight')
    plt.show()

def visualize_samples(val_loader):
    images, labels = next(iter(val_loader))
    inv_normalize = transforms.Normalize(
        mean=[-0.485/0.229, -0.456/0.224, -0.406/0.225],
        std=[1/0.229, 1/0.224, 1/0.225]
    )
    im = inv_normalize(make_grid(images[:16], nrow=8))
    plt.figure(figsize=(14, 7))
    plt.imshow(np.transpose(im.numpy(), (1, 2, 0)))
    plt.title('验证集样本')
    plt.axis('off')
    plt.savefig('validation_samples.png', dpi=150, bbox_inches='tight')
    plt.show()

def main():
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'使用设备: {device}')

    train_transform, val_transform = build_transforms()

    full_dataset = SafeImageFolder(DATA_DIR, transform=train_transform)
    class_names = full_dataset.classes
    num_classes = len(class_names)
    print(f'类别: {class_names} ({num_classes}类)')
    print(f'总图片数: {len(full_dataset)}')

    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    val_dataset.dataset.transform = val_transform

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, num_workers=0)

    print(f'训练集: {train_size}, 验证集: {val_size}')

    model = build_model(num_classes)
    model = model.to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=WEIGHT_DECAY)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    train_losses, val_losses, train_accs, val_accs, best_val_acc, best_epoch = train_model(
        model, train_loader, val_loader, criterion, optimizer, scheduler, device, EPOCHS, PATIENCE
    )

    print(f'\n最佳验证准确率: {best_val_acc:.4f} (第 {best_epoch} 轮)')

    evaluate_model(model, val_loader, class_names, device)
    plot_curves(train_losses, val_losses, train_accs, val_accs, best_epoch)
    visualize_samples(val_loader)

    print(f'\n最佳模型已保存为 {MODEL_SAVE_PATH}')

if __name__ == '__main__':
    main()