from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.memory_bank import MemoryBank
from core.memory_processor import MemoryProcessor

app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
CORS(app)

memory_bank = MemoryBank(storage_path="../memory_store", user_id="default")
memory_processor = MemoryProcessor(memory_bank=memory_bank)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/stats', methods=['GET'])
def get_stats():
    stats = memory_bank.get_stats()
    detailed = memory_bank.get_detailed_stats()
    return jsonify({"stats": stats, "detailed": detailed})


@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    sessions = memory_bank.get_all_sessions()
    return jsonify([s.to_dict() for s in sessions])


@app.route('/api/sessions/active', methods=['GET'])
def get_active_sessions():
    sessions = memory_bank.get_active_sessions()
    return jsonify([s.to_dict() for s in sessions])


@app.route('/api/sessions/forgotten', methods=['GET'])
def get_forgotten_sessions():
    sessions = memory_bank.get_forgotten_sessions()
    return jsonify([s.to_dict() for s in sessions])


@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    session = memory_bank.get_session(session_id)
    if session:
        return jsonify(session.to_dict())
    return jsonify({"error": "Session not found"}), 404


@app.route('/api/sessions', methods=['POST'])
def create_session():
    data = request.json
    title = data.get('title', '新学习')
    topic = data.get('topic', '')
    session = memory_bank.create_session(title=title, topic=topic)
    return jsonify(session.to_dict()), 201


@app.route('/api/sessions/<session_id>', methods=['PUT'])
def update_session(session_id):
    data = request.json
    memory_bank.update_session(session_id, **data)
    session = memory_bank.get_session(session_id)
    if session:
        return jsonify(session.to_dict())
    return jsonify({"error": "Session not found"}), 404


@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    success = memory_bank.delete_session(session_id)
    if success:
        return jsonify({"success": True})
    return jsonify({"success": False}), 404


@app.route('/api/sessions/<session_id>/messages', methods=['POST'])
def add_message(session_id):
    data = request.json
    role = data.get('role', 'user')
    content = data.get('content', '')
    memory_bank.add_message_to_session(session_id, role, content)
    memory_processor.add_message_for_processing(role, content, session_id)
    return jsonify({"success": True})


@app.route('/api/sessions/<session_id>/decay', methods=['POST'])
def apply_decay(session_id):
    session = memory_bank.get_session(session_id)
    if session:
        session.apply_decay()
        memory_bank._save_session(session)
        return jsonify(session.to_dict())
    return jsonify({"error": "Session not found"}), 404


@app.route('/api/sessions/<session_id>/restore', methods=['POST'])
def restore_session(session_id):
    memory_bank.restore_forgotten_session(session_id)
    session = memory_bank.get_session(session_id)
    if session:
        return jsonify(session.to_dict())
    return jsonify({"error": "Session not found"}), 404


@app.route('/api/related', methods=['POST'])
def find_related():
    data = request.json
    content = data.get('content', '')
    top_k = data.get('top_k', 5)
    min_threshold = data.get('min_threshold', 0.3)
    related = memory_bank.find_related_sessions(content, top_k=top_k, min_threshold=min_threshold)
    result = [{"session": s.to_dict(), "score": score} for s, score in related]
    return jsonify(result)


@app.route('/api/recall', methods=['GET'])
def get_recall_sessions():
    top_k = request.args.get('top_k', 5, type=int)
    max_days = request.args.get('max_days', 30, type=int)
    sessions = memory_bank.get_recent_sessions_for_recall(top_k=top_k, max_days=max_days)
    return jsonify([s.to_dict() for s in sessions])


@app.route('/api/decay-curve/<session_id>', methods=['GET'])
def get_decay_curve(session_id):
    session = memory_bank.get_session(session_id)
    if session:
        days = request.args.get('days', 30, type=int)
        half_life = request.args.get('half_life', 7.0, type=float)
        curve = memory_bank.simulate_decay_curve(session, days=days, half_life_days=half_life)
        return jsonify(curve)
    return jsonify({"error": "Session not found"}), 404


@app.route('/api/sensitivity', methods=['GET'])
def get_sensitivity():
    analysis = memory_bank.param_sensitivity_analysis()
    return jsonify(analysis)


@app.route('/api/decay-all', methods=['POST'])
def decay_all():
    memory_bank.apply_decay_to_all()
    return jsonify({"success": True})


@app.route('/api/cleanup-forgotten', methods=['POST'])
def cleanup_forgotten():
    max_days = request.json.get('max_days', 30)
    count = memory_bank.cleanup_forgotten_sessions(max_days_forgotten=max_days)
    return jsonify({"deleted_count": count})


@app.route('/api/process', methods=['POST'])
def process_messages():
    data = request.json
    memory_processor.force_process_now()
    return jsonify({"success": True})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)