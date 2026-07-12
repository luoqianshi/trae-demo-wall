import os
import json
import uuid
from flask import Flask, render_template, request, jsonify
from parser import parse_document, select_random_blanks
from ai_service import recognize_with_baidu

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")


def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"document_folder": "", "quiz_count": 5}


def save_config(config):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/files')
def get_files():
    config = load_config()
    folder = config.get("document_folder", "")

    if not folder or not os.path.isdir(folder):
        return jsonify({"success": False, "message": "未配置文档文件夹或文件夹不存在", "files": []})

    files = []
    for filename in os.listdir(folder):
        ext = os.path.splitext(filename)[1].lower()
        if ext in [".txt", ".docx"]:
            filepath = os.path.join(folder, filename)
            if os.path.isfile(filepath):
                files.append({
                    "name": filename,
                    "path": filename,
                    "type": ext[1:].upper()
                })

    return jsonify({"success": True, "files": files})


@app.route('/api/quiz/<filename>')
def get_quiz(filename):
    config = load_config()
    folder = config.get("document_folder", "")
    count = request.args.get('count', config.get("quiz_count", 5), type=int)

    if not folder or not os.path.isdir(folder):
        return jsonify({"success": False, "message": "未配置文档文件夹"})

    filepath = os.path.join(folder, filename)
    if not os.path.isfile(filepath):
        return jsonify({"success": False, "message": "文件不存在"})

    blanks = parse_document(filepath)
    if not blanks:
        return jsonify({"success": False, "message": "文档中未找到可抽背的内容，请检查标记"})

    selected = select_random_blanks(blanks, count)
    return jsonify({"success": True, "quiz": selected, "total_blanks": len(blanks)})


@app.route('/api/config', methods=['GET', 'POST'])
def handle_config():
    if request.method == 'GET':
        config = load_config()
        return jsonify({"success": True, "config": config})
    else:
        data = request.get_json()
        if data:
            save_config(data)
            return jsonify({"success": True, "message": "配置已保存"})
        return jsonify({"success": False, "message": "无效数据"})


@app.route('/api/ai_recognize', methods=['POST'])
def ai_recognize():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "未上传图片"})
    
    image = request.files['image']
    if image.filename == '':
        return jsonify({"success": False, "message": "请选择图片"})
    
    config = load_config()
    api_key = config.get("baidu_api_key", "")
    secret_key = config.get("baidu_secret_key", "")
    
    if not api_key or not secret_key:
        return jsonify({"success": False, "message": "未配置百度云API Key，请在配置页面填写"})
    
    try:
        temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_path = os.path.join(temp_dir, str(uuid.uuid4()) + '.jpg')
        image.save(temp_path)
        
        text = recognize_with_baidu(temp_path, api_key, secret_key)
        
        os.remove(temp_path)
        
        if not text:
            return jsonify({"success": False, "message": "未识别到文字，请确保图片清晰"})
        
        return jsonify({"success": True, "text": text})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


@app.route('/api/save_doc', methods=['POST'])
def save_doc():
    data = request.get_json()
    if not data or 'filename' not in data or 'content' not in data:
        return jsonify({"success": False, "message": "缺少必要参数"})
    
    filename = data['filename']
    content = data['content']
    
    if not filename.endswith('.txt'):
        filename += '.txt'
    
    config = load_config()
    folder = config.get("document_folder", "")
    
    if not folder:
        return jsonify({"success": False, "message": "未配置文档文件夹"})
    
    os.makedirs(folder, exist_ok=True)
    
    filepath = os.path.join(folder, filename)
    
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return jsonify({"success": True, "message": "文档保存成功"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)