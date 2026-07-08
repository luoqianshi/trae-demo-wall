import json
import base64
from flask import Flask, send_from_directory, jsonify, request, send_file
import os

app = Flask(__name__)

# 商品信息
product_info = {
    "name": "83%双重酵萃 酵萃护肤神仙水精华露190ml",
    "price": "¥99",
    "originalPrice": "¥299",
    "freight": "免运费",
    "specs": "精华露190ml",
    "service": "本品不支持退换",
    "unshipped": "无",
    "tags": ["美妆", "护肤", "精华"]
}

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/api/product')
def get_product():
    return jsonify(product_info)

@app.route('/images/<path:filename>')
def get_image(filename):
    img_path = os.path.join(r'D:\items\美妆产品1', filename)
    if os.path.exists(img_path):
        return send_from_directory(r'D:\items\美妆产品1', filename)
    return "Not found", 404

@app.route('/api/top-images')
def get_top_images():
    images = []
    for i in range(1, 6):
        fname = f'顶端展示{i}.jpg'
        img_path = os.path.join(r'D:\items\美妆产品1', fname)
        if os.path.exists(img_path):
            with open(img_path, 'rb') as f:
                data = base64.b64encode(f.read()).decode()
                images.append(f'data:image/jpeg;base64,{data}')
    return jsonify(images)

@app.route('/api/detail-images')
def get_detail_images():
    images = []
    for i in range(1, 21):
        fname = f'商品详情{i}.jpg'
        img_path = os.path.join(r'D:\items\美妆产品1', fname)
        if os.path.exists(img_path):
            with open(img_path, 'rb') as f:
                data = base64.b64encode(f.read()).decode()
                images.append(f'data:image/jpeg;base64,{data}')
    return jsonify(images)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
