import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['GRADIO_ANALYTICS_ENABLED'] = 'false'
os.environ['PYTHONWARNINGS'] = 'ignore'
import warnings
warnings.filterwarnings('ignore')
import gradio as gr
import httpx
_original_httpx_get = httpx.get
_original_httpx_head = httpx.head
def _safe_httpx_get(*args, **kwargs):
    try:
        return _original_httpx_get(*args, **kwargs)
    except AttributeError:
        return None
class _MockResponse:
    status_code = 200
    def json(self): return {}
def _safe_httpx_head(*args, **kwargs):
    try:
        return _original_httpx_head(*args, **kwargs)
    except AttributeError:
        return _MockResponse()
httpx.get = _safe_httpx_get
httpx.head = _safe_httpx_head
import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
# 配置
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'使用设备: {device}')
# 情绪类别
class_names = ['Ahegao', 'Angry', 'Happy', 'Neutral', 'Sad', 'Surprise']
# 中文显示标签
class_names_zh = {
    'Ahegao': '😳 激动 (Ahegao)',
    'Angry': '😡 愤怒 (Angry)',
    'Happy': '😄 开心 (Happy)',
    'Neutral': '😐 中性 (Neutral)',
    'Sad': '😢 悲伤 (Sad)',
    'Surprise': '😲 惊讶 (Surprise)',
}
# 加载模型
model = models.resnet18()
num_ftrs = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(num_ftrs, 256),
    nn.ReLU(),
    nn.Dropout(0.3),
    nn.Linear(256, len(class_names))  # 输出类别数
)
# 加载训练好的权重
model.load_state_dict(torch.load('emotion_model_best.pth', map_location=device))
model.to(device)
model.eval()
print('模型加载成功！')
# 图像预处理（必须和训练时一致）
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
# 预测函数
def predict_image(img):
    """
    输入：PIL图像
    输出：情绪标签及置信度
    """
    # 预处理
    img_tensor = transform(img).unsqueeze(0).to(device)

    # 推理
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)[0]

    # 构建返回结果
    result = {class_names_zh[class_names[i]]: float(probs[i]) for i in range(len(class_names))}

    # 打印到控制台
    top_class = max(result, key=result.get)
    print(f'预测结果: {top_class} (置信度: {result[top_class]:.2%})')

    return result
# 创建 Gradio 界面
interface = gr.Interface(
    fn=predict_image,
    inputs=gr.Image(
        type='pil',
        label='上传人脸照片',
        sources=['upload'],
        interactive=True
    ),
    outputs=gr.Label(num_top_classes=3, label='识别结果'),
    title='情绪识别助手',
    description='上传一张清晰的人脸照片，将自动识别你的情绪状态',
    article='''
    ### 支持识别的情绪
    - 😳 激动 (Ahegao)
    - 😡 愤怒 (Angry)
    - 😄 开心 (Happy)
    - 😐 中性 (Neutral)
    - 😢 悲伤 (Sad)
    - 😲 惊讶 (Surprise)

    ### 使用说明
    1. 点击 "上传" 或拖拽图片到框中
    2. 等待1-2秒，AI会自动分析
    3. 查看顶部3个最可能的情绪结果
    ''',
    examples=None,  # 如果有示例图片，可以添加
    allow_flagging='never',
    clear_btn='清除',
    submit_btn='开始识别'
)
# 启动
if __name__ == '__main__':
    print('\n启动情绪识别演示...')
    app, local_url, share_url = interface.launch(share=False)  # share=False 仅本地访问
    print(f'本地访问: {local_url}')