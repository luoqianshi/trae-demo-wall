import os
import uuid
import json
import threading
import datetime
from flask import Flask, render_template, request, jsonify, send_file, session
from werkzeug.utils import secure_filename
from core.knowledge_base import KnowledgeBase
from core.document_parser import DocumentParser
from core.rule_matcher import RuleMatcher
from core.review_engine import ReviewEngine
from core.report_generator import ReportGenerator

app = Flask(__name__)
app.secret_key = 'zhin管家-secret-key-2026'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['EXPORT_FOLDER'] = os.path.join(os.path.dirname(__file__), 'exports')

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['EXPORT_FOLDER'], exist_ok=True)

# 全局实例
kb = KnowledgeBase()
parser = DocumentParser()
matcher = RuleMatcher()
engine = ReviewEngine(kb, parser, matcher)
report_gen = ReportGenerator(app.config['EXPORT_FOLDER'])
review_sessions = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/review')
def review_page():
    return render_template('review.html')

@app.route('/report')
def report_page():
    return render_template('report.html')

@app.route('/config')
def config_page():
    return render_template('config.html')

# ============ API ============

@app.route('/api/process_areas')
def api_process_areas():
    areas = kb.get_process_areas()
    return jsonify({'success': True, 'process_areas': areas})

@app.route('/api/check_items/<pa_id>')
def api_check_items(pa_id):
    level = request.args.get('level', 1, type=int)
    items = kb.get_check_items(pa_id, level)
    return jsonify({'success': True, 'check_items': items})

@app.route('/api/upload', methods=['POST'])
def api_upload():
    uploaded_files = request.files.getlist('files')
    saved = []
    for f in uploaded_files:
        if f.filename:
            filename = secure_filename(f.filename)
            session_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'current')
            os.makedirs(session_dir, exist_ok=True)
            filepath = os.path.join(session_dir, filename)
            f.save(filepath)
            size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
            saved.append({
                'name': filename,
                'path': filepath,
                'size': size,
                'info': f'{size//1024}KB' if size > 1024 else f'{size}B',
                'status': '已上传'
            })
    return jsonify({'success': True, 'files': saved})

@app.route('/api/scan_dir', methods=['POST'])
def api_scan_dir():
    data = request.get_json()
    dir_path = data.get('path', '')
    if not dir_path or not os.path.exists(dir_path):
        return jsonify({'success': False, 'message': '目录不存在'})
    docs = parser.scan_directory(dir_path)
    files = []
    for d in docs:
        size_str = f'{d["size"]//1024}KB' if d["size"] > 1024 else f'{d["size"]}B'
        files.append({
            'name': d['name'],
            'path': d['path'],
            'info': size_str,
            'status': '已扫描'
        })
    return jsonify({'success': True, 'files': files})

@app.route('/api/start_review', methods=['POST'])
def api_start_review():
    """开始审核"""
    data = request.get_json()
    # 获取当前上传的文件
    current_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'current')
    files = []
    if os.path.exists(current_dir):
        for fname in os.listdir(current_dir):
            fpath = os.path.join(current_dir, fname)
            if os.path.isfile(fpath):
                files.append({'name': fname, 'path': fpath})

    if not files:
        return jsonify({'success': False, 'message': '请先上传文档或扫描目录'})

    session = engine.create_session(
        project_name=data.get('project_name', '未命名项目'),
        project_domain=data.get('project_domain', ''),
        target_level=data.get('target_level', 'Level 2'),
        process_areas=data.get('process_areas', []),
        files=files,
        use_llm=data.get('use_llm', False)
    )

    review_sessions[session['session_id']] = session

    # 后台执行审核
    def run():
        def update_progress(s):
            review_sessions[s['session_id']] = s
        engine.run_review(session, update_progress)

    thread = threading.Thread(target=run, daemon=True)
    thread.start()

    return jsonify({'success': True, 'session_id': session['session_id']})

@app.route('/api/task_status/<session_id>')
def api_task_status(session_id):
    """获取任务状态"""
    s = review_sessions.get(session_id)
    if not s:
        return jsonify({'status': 'not_found'})
    return jsonify({
        'status': s['status'],
        'progress': s['progress'],
        'current_file': s['current_file'],
        'message': s['message']
    })

@app.route('/api/report/<session_id>')
def api_report(session_id):
    """获取审核报告"""
    s = review_sessions.get(session_id)
    if not s or s['status'] != 'completed':
        return jsonify({'success': False, 'message': '报告未就绪'})
    report = engine.get_report(s)
    return jsonify({'success': True, 'report': report})

@app.route('/api/export/<session_id>/<fmt>')
def api_export(session_id, fmt):
    """导出报告 (html/md/xlsx)"""
    s = review_sessions.get(session_id)
    if not s or s['status'] != 'completed':
        return jsonify({'success': False, 'message': '报告未就绪'})
    report = engine.get_report(s)
    exporters = {
        'html': report_gen.export_html,
        'md': report_gen.export_markdown,
        'xlsx': report_gen.export_excel
    }
    if fmt not in exporters:
        return jsonify({'success': False, 'message': '不支持的格式'})
    filepath = exporters[fmt](s, report)
    mime_map = {'html': 'text/html', 'md': 'text/markdown', 'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}
    return send_file(filepath, mimetype=mime_map.get(fmt, 'application/octet-stream'), as_attachment=True, download_name=f'report_{session_id[:8]}.{fmt}')

@app.route('/api/config', methods=['GET', 'POST'])
def api_config():
    """LLM 配置读写"""
    config_file = os.path.join(app.config['UPLOAD_FOLDER'], 'config.json')
    if request.method == 'GET':
        if os.path.exists(config_file):
            with open(config_file, 'r', encoding='utf-8') as f:
                return jsonify(json.load(f))
        return jsonify({})
    else:
        data = request.get_json()
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return jsonify({'success': True, 'message': '配置已保存'})

@app.route('/api/test_llm', methods=['POST'])
def api_test_llm():
    """测试 LLM 连接"""
    data = request.get_json()
    api_url = data.get('api_url', '')
    api_key = data.get('api_key', '')
    if not api_key:
        return jsonify({'success': False, 'message': 'API Key 不能为空'})
    try:
        import requests
        headers = {'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'}
        resp = requests.get(f'{api_url}/models', headers=headers, timeout=10)
        if resp.status_code == 200:
            return jsonify({'success': True, 'message': '连接成功'})
        else:
            return jsonify({'success': False, 'message': f'连接失败: HTTP {resp.status_code}'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'连接失败: {str(e)}'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5002)