from flask import Flask, jsonify, request, send_from_directory, session
from flask_cors import CORS
from datetime import datetime, timedelta
from functools import wraps
import os

import config
import models
import vector_store
import ocr_service
import graphrag_service
import recommender

app = Flask(__name__, static_folder='public')
app.secret_key = config.SECRET_KEY
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # 本地开发保持 False，生产环境如需 HTTPS 建议设为 True
CORS(app, supports_credentials=True)

# ================= 初始化数据 =================
mistakes = models.load_mistakes()
mistakes = models.migrate_base64_images(mistakes)
knowledge_points = [
    '二次函数', '一元二次方程', '勾股定理', '相似三角形',
    '一次函数', '反比例函数', '圆的性质', '概率统计',
    '实数运算', '整式乘法', '分式方程', '不等式'
]
mistake_reasons = ['概念不清', '计算失误', '审题偏差', '思路错误', '公式遗忘']

# 初始化向量库
if vector_store.is_available():
    vector_store.init_with_mistakes(mistakes)
    print('[server] 向量库初始化完成')
else:
    print('[server] 警告：ChromaDB 不可用，向量功能未启用')

# ================= 模拟数据：相似题与知识点卡片 =================
similar_questions = {
    '二次函数': [
        {'title': '二次函数 y = -(x-2)² + 3 的顶点坐标是？', 'difficulty': 1, 'answer': '(2, 3)'},
        {'title': '抛物线 y = x² - 4x + 5 的对称轴是？', 'difficulty': 2, 'answer': 'x = 2'}
    ],
    '勾股定理': [
        {'title': '直角三角形两直角边为 6 和 8，斜边为？', 'difficulty': 1, 'answer': '10'},
        {'title': '等腰三角形腰长为 5，底边为 6，求底边上的高。', 'difficulty': 2, 'answer': '4'}
    ],
    '一元二次方程': [
        {'title': '解方程 x² - 7x + 12 = 0。', 'difficulty': 1, 'answer': 'x₁=3, x₂=4'},
        {'title': '若 x² + px + q = 0 的两根为 -1 和 3，求 p、q。', 'difficulty': 2, 'answer': 'p=-2, q=-3'}
    ],
    '相似三角形': [
        {'title': '△ABC 中，DE ∥ BC，AD = 2，DB = 4，DE = 3，求 BC。', 'difficulty': 2, 'answer': '9'}
    ],
    '一次函数': [
        {'title': '一次函数 y = 2x + 1 与 x 轴交点坐标是？', 'difficulty': 1, 'answer': '(-0.5, 0)'}
    ],
    '反比例函数': [
        {'title': '反比例函数 y = 6/x 经过点 (a, 2)，求 a。', 'difficulty': 1, 'answer': '3'}
    ],
    '圆的性质': [
        {'title': '圆的半径为 13，弦心距为 5，求弦长。', 'difficulty': 2, 'answer': '24'}
    ]
}

knowledge_cards = {
    '二次函数': {
        'definition': '形如 y = ax² + bx + c（a≠0）的函数叫做二次函数。',
        'pitfalls': '注意顶点式 y = a(x-h)² + k 中，顶点坐标是 (h, k)，注意符号。',
        'example': 'y = 2(x-1)² + 1 的顶点为 (1, 1)，开口向上。'
    },
    '勾股定理': {
        'definition': '直角三角形两直角边的平方和等于斜边的平方：a² + b² = c²。',
        'pitfalls': '注意区分直角边和斜边，斜边是直角所对的边。',
        'example': '3-4-5 是最常见的勾股数。'
    },
    '一元二次方程': {
        'definition': '只含有一个未知数，且未知数的最高次数是 2 的整式方程。',
        'pitfalls': '使用求根公式时，先化为标准形式 ax² + bx + c = 0。',
        'example': 'x² - 5x + 6 = (x-2)(x-3) = 0，根为 2 和 3。'
    },
    '相似三角形': {
        'definition': '对应角相等、对应边成比例的两个三角形叫做相似三角形。',
        'pitfalls': '平行线分线段成比例时，注意对应关系。',
        'example': 'DE ∥ BC 时，AD/AB = AE/AC = DE/BC。'
    },
    '一次函数': {
        'definition': '形如 y = kx + b（k≠0）的函数叫做一次函数。',
        'pitfalls': 'k 决定直线的倾斜程度，b 是 y 轴截距。',
        'example': '过 (1,3)、(2,5) 可列方程组求出 k=2, b=1。'
    },
    '反比例函数': {
        'definition': '形如 y = k/x（k≠0）的函数叫做反比例函数。',
        'pitfalls': '图像上任意一点横纵坐标乘积等于 k。',
        'example': '过 (2,6) 则 k = 2×6 = 12。'
    },
    '圆的性质': {
        'definition': '垂直于弦的直径平分这条弦，并且平分弦所对的两条弧。',
        'pitfalls': '圆心到弦的距离、半径、半弦长构成直角三角形。',
        'example': '半径 5，弦长 8，则半弦长 4，弦心距 = √(25-16) = 3。'
    }
}

# ================= 辅助函数 =================
def get_today():
    return datetime.now().strftime('%Y-%m-%d')


def calc_next_review(mastery, difficulty, is_correct):
    base = 1 + (mastery / 100) * 6 if is_correct else 1
    nxt = max(1, round(base * (1 + difficulty * 0.3)))
    if not is_correct:
        nxt = max(1, round(nxt * 0.5))
    d = datetime.now() + timedelta(days=nxt)
    return d.strftime('%Y-%m-%d')


def update_mastery(mastery, is_correct, difficulty):
    delta = 8 + (5 - difficulty) if is_correct else -(10 + difficulty * 2)
    return max(0, min(100, mastery + delta))


def _enrich_mistake(m):
    """将图片相对路径转换为 base64，供前端显示"""
    data = dict(m)
    if data.get('image') and not data['image'].startswith('data:image'):
        data['image'] = models.load_image_base64(data['image'])
    if data.get('answerImage') and not data['answerImage'].startswith('data:image'):
        data['answerImage'] = models.load_image_base64(data['answerImage'])
    return data


_current_user_cache = {}


def current_user():
    """从 session 获取当前登录用户（带进程内缓存，减少文件读取）"""
    user_id = session.get('user_id')
    if not user_id:
        return None
    cached = _current_user_cache.get(user_id)
    if cached and cached.get('id') == user_id:
        return cached
    user = models.get_user_by_id(user_id)
    if user:
        _current_user_cache[user_id] = user
    return user


def login_required(f):
    """要求登录的装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if current_user() is None:
            return jsonify({'error': '请先登录'}), 401
        return f(*args, **kwargs)

    return decorated


def teacher_required(f):
    """要求教师权限的装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = current_user()
        if user is None:
            return jsonify({'error': '请先登录'}), 401
        if user.get('role') != 'teacher':
            return jsonify({'error': '需要教师权限'}), 403
        return f(*args, **kwargs)

    return decorated


# ================= API：认证 =================
@app.route('/api/auth/me', methods=['GET'])
def auth_me():
    user = current_user()
    if not user:
        return jsonify({'loggedIn': False}), 200
    return jsonify({'loggedIn': True, 'user': models.user_to_public(user)})


@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    if not username or not password:
        return jsonify({'error': '用户名和密码不能为空'}), 400

    user = models.verify_user(username, password)
    if not user:
        return jsonify({'error': '用户名或密码错误'}), 401

    session['user_id'] = user['id']
    return jsonify({'success': True, 'user': models.user_to_public(user)})


@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    session.pop('user_id', None)
    return jsonify({'success': True})


@app.route('/api/auth/register', methods=['POST'])
@login_required
def auth_register():
    # 仅教师角色可注册新用户
    if current_user().get('role') != 'teacher':
        return jsonify({'error': '只有教师可以注册新用户'}), 403

    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    class_id = (data.get('classId') or '').strip()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    role = (data.get('role') or 'student').strip()

    new_user, error = models.create_user(name, class_id, username, password, role)
    if error:
        return jsonify({'error': error}), 400

    return jsonify({'success': True, 'user': models.user_to_public(new_user)})


@app.route('/api/auth/users', methods=['GET'])
@login_required
def auth_users():
    users = models.load_users()
    return jsonify({'users': [models.user_to_public(u) for u in users]})


@app.route('/api/auth/users/<user_id>', methods=['PUT'])
@login_required
def auth_update_user(user_id):
    if current_user().get('role') != 'teacher':
        return jsonify({'error': '只有教师可以修改用户'}), 403
    if current_user().get('id') == user_id:
        return jsonify({'error': '不能修改当前登录账号'}), 400

    data = request.get_json() or {}
    updated, error = models.update_user(user_id, data)
    if error:
        return jsonify({'error': error}), 400
    _current_user_cache.pop(user_id, None)
    return jsonify({'success': True, 'user': models.user_to_public(updated)})


@app.route('/api/auth/users/<user_id>', methods=['DELETE'])
@login_required
def auth_delete_user(user_id):
    if current_user().get('role') != 'teacher':
        return jsonify({'error': '只有教师可以删除用户'}), 403
    if current_user().get('id') == user_id:
        return jsonify({'error': '不能删除当前登录账号'}), 400

    users = models.load_users()
    target = next((u for u in users if u.get('id') == user_id), None)
    if not target:
        return jsonify({'error': '用户不存在'}), 404

    users = [u for u in users if u.get('id') != user_id]
    models.save_users(users)
    _current_user_cache.pop(user_id, None)
    return jsonify({'success': True})


# ================= API：OCR =================
@app.route('/api/ocr', methods=['POST'])
@login_required
def ocr_recognize():
    data = request.get_json()
    image = data.get('image', '').strip()
    if not image:
        return jsonify({'error': '缺少图片'}), 400
    result = ocr_service.recognize(image)
    return jsonify(result)


# ================= API：学生端 =================

@app.route('/api/student/review-today', methods=['GET'])
@login_required
def review_today():
    user = current_user()
    today = get_today()
    knowledge = request.args.get('knowledge', '').strip()
    reason = request.args.get('reason', '').strip()
    difficulty = request.args.get('difficulty', '0').strip()
    try:
        count = int(request.args.get('count', 10))
    except ValueError:
        count = 10
    count = max(1, min(50, count))

    lst = [m for m in mistakes if m['studentId'] == user['id'] and m['nextReviewAt'] <= today]
    if knowledge:
        lst = [m for m in lst if m['knowledge'] == knowledge]
    if reason:
        lst = [m for m in lst if m['reason'] == reason]
    if difficulty and difficulty != '0':
        lst = [m for m in lst if m['difficulty'] == int(difficulty)]

    total = len(lst)
    lst.sort(key=lambda x: x['difficulty'], reverse=True)
    return jsonify({'today': today, 'total': total, 'completed': 0, 'list': [_enrich_mistake(x) for x in lst[:count]]})


@app.route('/api/student/recommend', methods=['GET'])
@login_required
def recommend_questions():
    user = current_user()
    mode = request.args.get('mode', 'manual').strip()
    try:
        count = int(request.args.get('count', 3))
    except ValueError:
        count = 3
    count = max(1, min(10, count))

    if mode == 'auto':
        result = recommender.auto_recommend(mistakes, user['id'], count)
    else:
        knowledge = request.args.get('knowledge', '').strip()
        reason = request.args.get('reason', '').strip()
        try:
            difficulty = int(request.args.get('difficulty', 0))
        except ValueError:
            difficulty = 0
        difficulty = max(0, min(5, difficulty))
        result = recommender.manual_recommend(
            mistakes, user['id'], knowledge, reason, difficulty, count
        )

    if not result['success']:
        return jsonify({'error': result.get('error', '推荐失败')}), 400

    result['questions'] = [_enrich_mistake(q) for q in result['questions']]
    return jsonify(result)


@app.route('/api/student/review/<int:id>/result', methods=['POST'])
@login_required
def review_result(id):
    user = current_user()
    m = next((x for x in mistakes if x['id'] == id and x['studentId'] == user['id']), None)
    if not m:
        return jsonify({'error': '错题不存在'}), 404
    data = request.get_json()
    is_correct = data.get('isCorrect', False)

    m['reviewCount'] += 1
    if is_correct:
        m['correctCount'] += 1
    else:
        m['wrongCount'] += 1
    m['mastery'] = update_mastery(m['mastery'], is_correct, m['difficulty'])
    m['nextReviewAt'] = calc_next_review(m['mastery'], m['difficulty'], is_correct)
    m['status'] = 'due' if m['nextReviewAt'] <= get_today() else 'scheduled'
    models.save_mistakes(mistakes)
    vector_store.upsert_mistake(m)

    return jsonify({
        'success': True,
        'mistake': _enrich_mistake(m),
        'knowledgeCard': None if is_correct else knowledge_cards.get(m['knowledge']),
        'similarQuestions': [] if is_correct else similar_questions.get(m['knowledge'], [])
    })


@app.route('/api/student/mistakes', methods=['GET'])
@login_required
def student_mistakes():
    user = current_user()
    lst = [m for m in mistakes if m['studentId'] == user['id']]
    return jsonify({'total': len(lst), 'list': [_enrich_mistake(x) for x in lst]})


@app.route('/api/student/mistakes', methods=['POST'])
@login_required
def add_mistake():
    global mistakes
    data = request.get_json()
    image = data.get('image', '').strip()
    if not image:
        return jsonify({'error': '缺少题目图片'}), 400

    title = (data.get('title') or '').strip()
    ocr_text = (data.get('ocrText') or '').strip()
    if not title and ocr_text:
        title = ocr_text[:60] + ('...' if len(ocr_text) > 60 else '')
    if not title:
        title = f'错题 #{models.get_next_id(mistakes)}'

    difficulty = int(data.get('difficulty', 3))
    difficulty = max(1, min(5, difficulty))

    image_path = models.save_base64_image(image)

    answer_image = (data.get('answerImage') or '').strip()
    answer_image_path = models.save_base64_image(answer_image) if answer_image else ''

    user = current_user()
    new_mistake = {
        'id': models.get_next_id(mistakes),
        'studentId': user['id'],
        'studentName': user['name'],
        'classId': user['classId'],
        'title': title,
        'answer': '',
        'knowledge': data.get('knowledge', '未分类'),
        'reason': data.get('reason', '未标注'),
        'difficulty': difficulty,
        'createdAt': get_today(),
        'nextReviewAt': get_today(),
        'reviewCount': 0,
        'correctCount': 0,
        'wrongCount': 1,
        'mastery': 30,
        'status': 'due',
        'image': image_path,
        'answerImage': answer_image_path,
        'ocrText': ocr_text
    }
    mistakes.append(new_mistake)
    models.save_mistakes(mistakes)
    vector_store.upsert_mistake(new_mistake)
    return jsonify({'success': True, 'mistake': _enrich_mistake(new_mistake)})


@app.route('/api/student/mistakes/<int:id>', methods=['DELETE'])
@login_required
def delete_mistake(id):
    user = current_user()
    global mistakes
    m = next((x for x in mistakes if x['id'] == id and x['studentId'] == user['id']), None)
    if not m:
        return jsonify({'error': '错题不存在'}), 404
    mistakes = [x for x in mistakes if x['id'] != id]
    models.save_mistakes(mistakes)
    vector_store.delete_mistake(id)
    deleted_images = models.cleanup_orphan_images(mistakes)
    return jsonify({'success': True, 'deletedImages': deleted_images})


@app.route('/api/student/report', methods=['GET'])
@login_required
def student_report():
    user = current_user()
    lst = [m for m in mistakes if m['studentId'] == user['id']]
    stats = {k: {'total': 0, 'correct': 0, 'mastery': 0} for k in knowledge_points}
    for m in lst:
        if m['knowledge'] not in stats:
            stats[m['knowledge']] = {'total': 0, 'correct': 0, 'mastery': 0}
        stats[m['knowledge']]['total'] += 1
        stats[m['knowledge']]['correct'] += m['correctCount']
        stats[m['knowledge']]['mastery'] += m['mastery']

    radar = []
    for k, s in stats.items():
        radar.append({'name': k, 'value': round(s['mastery'] / s['total']) if s['total'] else 0})

    return jsonify({
        'totalMistakes': len(lst),
        'reviewedToday': len([m for m in lst if m['nextReviewAt'] <= get_today()]),
        'averageMastery': round(sum(m['mastery'] for m in lst) / len(lst)) if lst else 0,
        'radar': radar
    })


# ================= API：老师端 =================

@app.route('/api/teacher/heatmap', methods=['GET'])
@teacher_required
def teacher_heatmap():
    stats = {k: {'wrong': 0, 'total': 0, 'students': set()} for k in knowledge_points}
    for m in mistakes:
        if m['knowledge'] not in stats:
            stats[m['knowledge']] = {'wrong': 0, 'total': 0, 'students': set()}
        stats[m['knowledge']]['total'] += 1
        stats[m['knowledge']]['wrong'] += m['wrongCount']
        stats[m['knowledge']]['students'].add(m['studentName'])

    heatmap = []
    for k, s in stats.items():
        rate = round(s['wrong'] / (s['total'] + s['wrong']) * 100) if (s['total'] + s['wrong']) else 0
        heatmap.append({
            'knowledge': k,
            'wrongCount': s['wrong'],
            'totalCount': s['total'],
            'affectedStudents': list(s['students']),
            'rate': rate
        })
    heatmap.sort(key=lambda x: x['rate'], reverse=True)
    return jsonify({'classId': 'c301', 'className': '初三（1）班', 'heatmap': heatmap})


@app.route('/api/teacher/students', methods=['GET'])
@teacher_required
def teacher_students():
    students = {}
    for m in mistakes:
        sid = m['studentId']
        if sid not in students:
            students[sid] = {'id': sid, 'name': m['studentName'], 'mistakes': 0, 'weakPoints': []}
        students[sid]['mistakes'] += 1
        if m['mastery'] < 50:
            students[sid]['weakPoints'].append(m['knowledge'])
    return jsonify({'students': list(students.values())})


@app.route('/api/teacher/students/<student_id>/mistakes', methods=['GET'])
@teacher_required
def teacher_student_mistakes(student_id):
    lst = [m for m in mistakes if m['studentId'] == student_id]
    return jsonify({'studentId': student_id, 'total': len(lst), 'list': [_enrich_mistake(x) for x in lst]})


@app.route('/api/teacher/mistakes/<int:id>/review-date', methods=['PUT'])
@teacher_required
def update_mistake_review_date(id):
    global mistakes
    m = next((x for x in mistakes if x['id'] == id), None)
    if not m:
        return jsonify({'error': '错题不存在'}), 404

    data = request.get_json()
    next_review = (data.get('nextReviewAt') or '').strip()
    if not next_review:
        return jsonify({'error': '缺少下次复习时间'}), 400

    try:
        datetime.strptime(next_review, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': '日期格式不正确，应为 YYYY-MM-DD'}), 400

    m['nextReviewAt'] = next_review
    m['status'] = 'due' if next_review <= get_today() else 'scheduled'
    models.save_mistakes(mistakes)
    vector_store.upsert_mistake(m)
    return jsonify({'success': True, 'mistake': _enrich_mistake(m)})


@app.route('/api/teacher/dashboard', methods=['GET'])
@teacher_required
def teacher_dashboard():
    class_mistakes = [m for m in mistakes if m['classId'] == 'c301']
    weak = {}
    for m in class_mistakes:
        weak[m['knowledge']] = weak.get(m['knowledge'], 0) + m['wrongCount']
    weak_points = sorted(weak.items(), key=lambda x: x[1], reverse=True)[:5]

    return jsonify({
        'className': '初三（1）班',
        'studentCount': 5,
        'totalMistakes': len(class_mistakes),
        'avgMastery': round(sum(m['mastery'] for m in class_mistakes) / len(class_mistakes)) if class_mistakes else 0,
        'weakPoints': [{'name': k, 'count': v} for k, v in weak_points]
    })


@app.route('/api/teacher/tags', methods=['GET'])
@login_required
def teacher_tags():
    return jsonify({
        'knowledge': knowledge_points,
        'reasons': mistake_reasons
    })


@app.route('/api/teacher/knowledge', methods=['POST'])
@teacher_required
def add_knowledge():
    global knowledge_points
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': '知识点名称不能为空'}), 400
    if name in knowledge_points:
        return jsonify({'error': '知识点已存在'}), 400
    knowledge_points.append(name)
    return jsonify({'success': True, 'knowledge': knowledge_points})


@app.route('/api/teacher/knowledge', methods=['DELETE'])
@teacher_required
def delete_knowledge():
    global knowledge_points
    data = request.get_json()
    name = data.get('name', '').strip()
    if name in knowledge_points:
        knowledge_points.remove(name)
    return jsonify({'success': True, 'knowledge': knowledge_points})


@app.route('/api/teacher/reason', methods=['POST'])
@teacher_required
def add_reason():
    global mistake_reasons
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': '错因名称不能为空'}), 400
    if name in mistake_reasons:
        return jsonify({'error': '错因已存在'}), 400
    mistake_reasons.append(name)
    return jsonify({'success': True, 'reasons': mistake_reasons})


@app.route('/api/teacher/reason', methods=['DELETE'])
@teacher_required
def delete_reason():
    global mistake_reasons
    data = request.get_json()
    name = data.get('name', '').strip()
    if name in mistake_reasons:
        mistake_reasons.remove(name)
    return jsonify({'success': True, 'reasons': mistake_reasons})


# ================= API：GraphRAG 管理 =================
@app.route('/api/admin/reindex-graphrag', methods=['POST'])
@login_required
def reindex_graphrag():
    if not graphrag_service.is_available():
        return jsonify({'success': False, 'error': '未配置 OPENAI_API_KEY'}), 400
    graphrag_service.export_mistakes(mistakes)
    result = graphrag_service.index()
    return jsonify(result)


# ================= 静态文件 =================
@app.route('/')
def index():
    response = send_from_directory('public', 'student.html')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response


@app.route('/<path:path>')
def static_files(path):
    # 优先从 public 目录查找；若未找到且路径为 data/images/，则从 data 目录查找
    public_path = os.path.join('public', path)
    if os.path.exists(public_path) and os.path.isfile(public_path):
        response = send_from_directory('public', path)
    elif path.startswith('data/images/'):
        response = send_from_directory('.', path)
    else:
        response = send_from_directory('public', path)
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response


if __name__ == '__main__':
    print('错题小助手 Demo 已启动：')
    print('学生端：http://localhost:3000/student.html')
    print('老师端：http://localhost:3000/teacher.html')
    app.run(host='0.0.0.0', port=3000, debug=True)
