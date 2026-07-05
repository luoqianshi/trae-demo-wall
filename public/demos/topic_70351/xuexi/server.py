import os
import re
import json
import sys
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
from dotenv import load_dotenv

from models import db, init_db, Textbook, Unit, Question, AnswerRecord, ExamPaper, ExamQuestion
from seed_data import seed_data

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///xuexi.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

init_db(app)
seed_data(app)

DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY', '')
DEEPSEEK_BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1')
DEEPSEEK_MODEL = os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')


def extract_json(text):
    if not text:
        return None
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    match = re.search(r'\[[\s\S]*\]', text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass
    return None


def call_deepseek(messages, temperature=0.7, max_tokens=2048):
    if not DEEPSEEK_API_KEY or DEEPSEEK_API_KEY == 'your_deepseek_api_key_here':
        return {
            'error': True,
            'message': '未配置 DeepSeek API Key，请在 .env 文件中设置 DEEPSEEK_API_KEY'
        }
    url = f'{DEEPSEEK_BASE_URL}/chat/completions'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {DEEPSEEK_API_KEY}'
    }
    payload = {
        'model': DEEPSEEK_MODEL,
        'messages': messages,
        'temperature': temperature,
        'max_tokens': max_tokens,
        'stream': False
    }
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        content = data['choices'][0]['message']['content']
        return {'error': False, 'content': content}
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                detail = e.response.json()
                error_msg = detail.get('error', {}).get('message', error_msg)
            except Exception:
                error_msg = e.response.text or error_msg
        return {'error': True, 'message': f'DeepSeek API 调用失败：{error_msg}'}
    except Exception as e:
        return {'error': True, 'message': f'未知错误：{str(e)}'}


SYSTEM_PROMPT_READER = """你是一位资深的中学语文老师，名叫"墨老师"。你的任务是引导学生深入理解文学作品，培养他们的文学鉴赏能力。

请遵循以下教学原则：
1. 循循善诱：不要直接给出答案，而是用提问引导学生思考
2. 贴近学生：用中学生能理解的语言，避免过于学术化的表达
3. 层层深入：从字词理解，到句子赏析，再到篇章结构和主题思想
4. 鼓励肯定：对学生的思考给予积极反馈，增强他们的信心
5. 联系生活：适当结合学生的生活经验，帮助他们产生共鸣

回答时请用自然、亲切的语气，就像和学生面对面交流一样。"""

SYSTEM_PROMPT_WRITING = """你是一位资深的中学语文作文辅导老师。你的任务是帮助中学生提升写作能力。

请遵循以下原则：
1. 以鼓励为主，先肯定优点，再提出改进建议
2. 建议要具体、可操作，避免空泛的评价
3. 贴近中学生的认知水平和生活经验
4. 注重培养学生的观察力、思考力和表达力
5. 语言亲切自然，就像面对面辅导一样"""


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/reading')
def reading():
    return send_from_directory('.', 'reading.html')


@app.route('/writing')
def writing():
    return send_from_directory('.', 'writing.html')


@app.route('/questions')
def questions():
    return send_from_directory('.', 'questions.html')


@app.route('/practice')
def practice():
    return send_from_directory('.', 'practice.html')


@app.route('/css/<path:path>')
def serve_css(path):
    return send_from_directory('css', path)


@app.route('/js/<path:path>')
def serve_js(path):
    return send_from_directory('js', path)


@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory('assets', path)


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    text_content = data.get('text', '')
    history = data.get('history', [])
    user_message = data.get('message', '')
    if not text_content:
        return jsonify({'error': True, 'message': '缺少课文内容'}), 400
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPT_READER},
        {'role': 'system', 'content': f'当前阅读的课文内容：\n\n{text_content}'}
    ]
    for msg in history:
        role = 'user' if msg.get('role') == 'user' else 'assistant'
        messages.append({'role': role, 'content': msg.get('content', '')})
    if user_message:
        messages.append({'role': 'user', 'content': user_message})
    else:
        messages.append({
            'role': 'user',
            'content': '请为我解读这篇文章，先从整体上谈谈你的理解，然后提出一个引导性的问题让我思考。'
        })
    result = call_deepseek(messages, temperature=0.8, max_tokens=1500)
    if result['error']:
        return jsonify(result), 500
    return jsonify({'error': False, 'reply': result['content']})


@app.route('/api/polish', methods=['POST'])
def polish():
    data = request.get_json()
    essay = data.get('essay', '')
    if not essay:
        return jsonify({'error': True, 'message': '缺少作文内容'}), 400
    prompt = f"""请对下面这篇中学生作文进行润色优化。

要求：
1. 保持原文的立意和情感不变
2. 优化语言表达，让文字更生动、更有文采
3. 改进句子结构，增强节奏感和表现力
4. 润色后字数与原文大致相当
5. 请以JSON格式返回结果，包含以下字段：
   - polished_essay: 润色后的完整作文
   - changes_summary: 修改要点总结（3-5条，用数组形式）
   - overall_comment: 总体评价和鼓励

作文内容：
{essay}

请直接返回JSON，不要添加额外的解释文字。"""
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPT_WRITING},
        {'role': 'user', 'content': prompt}
    ]
    result = call_deepseek(messages, temperature=0.7, max_tokens=2000)
    if result['error']:
        return jsonify(result), 500
    parsed = extract_json(result['content'])
    if parsed and isinstance(parsed, dict):
        return jsonify({
            'error': False,
            'polished_essay': parsed.get('polished_essay', result['content']),
            'changes_summary': parsed.get('changes_summary', []),
            'overall_comment': parsed.get('overall_comment', '')
        })
    return jsonify({
        'error': False,
        'polished_essay': result['content'],
        'changes_summary': [],
        'overall_comment': ''
    })


@app.route('/api/suggestions', methods=['POST'])
def suggestions():
    data = request.get_json()
    essay = data.get('essay', '')
    if not essay:
        return jsonify({'error': True, 'message': '缺少作文内容'}), 400
    prompt = f"""请阅读下面这篇中学生作文，给出具体的改进建议。

要求：
1. 先肯定作文的优点，再提出改进建议
2. 建议要具体、可操作，每条建议说明改什么、为什么改、怎么改
3. 重点关注：立意、结构、描写、语言、情感表达等方面
4. 请以JSON格式返回结果，格式如下：
{{
  "strengths": ["优点1", "优点2", "优点3"],
  "suggestions": [
    {{"num": 1, "text": "具体建议内容"}},
    {{"num": 2, "text": "具体建议内容"}},
    {{"num": 3, "text": "具体建议内容"}}
  ]
}}

作文内容：
{essay}

请直接返回JSON，不要添加额外的解释文字。"""
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPT_WRITING},
        {'role': 'user', 'content': prompt}
    ]
    result = call_deepseek(messages, temperature=0.7, max_tokens=1500)
    if result['error']:
        return jsonify(result), 500
    parsed = extract_json(result['content'])
    if parsed and isinstance(parsed, dict):
        return jsonify({
            'error': False,
            'strengths': parsed.get('strengths', []),
            'suggestions': parsed.get('suggestions', [])
        })
    return jsonify({
        'error': False,
        'strengths': [],
        'suggestions': [{'num': 1, 'text': result['content']}]
    })


@app.route('/api/vocab', methods=['POST'])
def vocab():
    data = request.get_json()
    essay = data.get('essay', '')
    if not essay:
        return jsonify({'error': True, 'message': '缺少作文内容'}), 400
    prompt = f"""请从下面这篇中学生作文中，找出可以提升的词汇或短语，给出更有文采的替换建议。

要求：
1. 选择文中使用比较普通、可以更精准或更生动的词语
2. 每个替换建议说明原文词语和替换后的词语
3. 替换后要保持原意，且符合中学生的写作水平
4. 请以JSON格式返回结果，格式如下：
{{
  "vocab_list": [
    {{"original": "原文词语", "improved": "替换词语", "reason": "为什么这样改"}},
    {{"original": "原文词语", "improved": "替换词语", "reason": "为什么这样改"}}
  ]
}}
5. 提供5-8个词汇提升建议

作文内容：
{essay}

请直接返回JSON，不要添加额外的解释文字。"""
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPT_WRITING},
        {'role': 'user', 'content': prompt}
    ]
    result = call_deepseek(messages, temperature=0.7, max_tokens=1500)
    if result['error']:
        return jsonify(result), 500
    parsed = extract_json(result['content'])
    if parsed and isinstance(parsed, dict):
        return jsonify({
            'error': False,
            'vocab_list': parsed.get('vocab_list', [])
        })
    return jsonify({'error': False, 'vocab_list': []})


@app.route('/api/imagery', methods=['POST'])
def imagery():
    data = request.get_json()
    text = data.get('text', '')
    title = data.get('title', '')
    if not text:
        return jsonify({'error': True, 'message': '缺少课文内容'}), 400
    prompt = f"""请根据下面这段文字的意境，生成一段富有诗意的画面描述，用于AI绘画的意象展示。

文章标题：{title}
相关文字片段：
{text}

要求：
1. 用优美的散文笔法描绘画面，字数100-150字
2. 突出文字中的核心意象和情感氛围
3. 画面要有层次感和视觉冲击力
4. 风格偏向水墨画或诗意摄影
5. 请以JSON格式返回结果，格式如下：
{{
  "description": "画面描述文字",
  "scenes": [
    {{"name": "意象名称", "desc": "简短解读"}},
    {{"name": "意象名称", "desc": "简短解读"}},
    {{"name": "意象名称", "desc": "简短解读"}}
  ]
}}

请直接返回JSON，不要添加额外的解释文字。"""
    messages = [
        {'role': 'system', 'content': '你是一位擅长文学意象转化的视觉艺术家，善于将文字意境转化为生动的画面描述。'},
        {'role': 'user', 'content': prompt}
    ]
    result = call_deepseek(messages, temperature=0.8, max_tokens=1000)
    if result['error']:
        return jsonify(result), 500
    parsed = extract_json(result['content'])
    if parsed and isinstance(parsed, dict):
        return jsonify({
            'error': False,
            'description': parsed.get('description', result['content']),
            'scenes': parsed.get('scenes', [])
        })
    return jsonify({'error': False, 'description': result['content'], 'scenes': []})


@app.route('/api/textbooks', methods=['GET'])
def get_textbooks():
    textbooks = Textbook.query.order_by(Textbook.sort_order).all()
    return jsonify({'error': False, 'data': [tb.to_dict() for tb in textbooks]})


@app.route('/api/textbooks/<int:textbook_id>/units', methods=['GET'])
def get_units(textbook_id):
    textbook = Textbook.query.get(textbook_id)
    if not textbook:
        return jsonify({'error': True, 'message': '教材不存在'}), 404
    units = Unit.query.filter_by(textbook_id=textbook_id).order_by(Unit.sort_order).all()
    return jsonify({'error': False, 'data': [u.to_dict() for u in units]})


@app.route('/api/units/<int:unit_id>/questions', methods=['GET'])
def get_unit_questions(unit_id):
    unit = Unit.query.get(unit_id)
    if not unit:
        return jsonify({'error': True, 'message': '单元不存在'}), 404
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    include_answer = request.args.get('include_answer', 'false').lower() == 'true'
    questions = Question.query.filter_by(unit_id=unit_id, is_active=True).order_by(Question.sort_order).all()
    total = len(questions)
    start = (page - 1) * page_size
    end = start + page_size
    page_questions = questions[start:end]
    return jsonify({
        'error': False,
        'data': [q.to_dict(include_answer=include_answer) for q in page_questions],
        'total': total,
        'page': page,
        'page_size': page_size,
        'unit': unit.to_dict()
    })


@app.route('/api/questions/<int:question_id>', methods=['GET'])
def get_question(question_id):
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'error': True, 'message': '题目不存在'}), 404
    return jsonify({'error': False, 'data': question.to_dict(include_answer=True)})


@app.route('/api/questions/<int:question_id>/submit', methods=['POST'])
def submit_answer(question_id):
    question = Question.query.get(question_id)
    if not question:
        return jsonify({'error': True, 'message': '题目不存在'}), 404
    data = request.get_json()
    user_answer = (data.get('answer') or '').strip()
    session_id = data.get('session_id', '')
    time_spent = data.get('time_spent', 0)
    is_correct = False
    correct_answer = question.answer.strip()
    if question.question_type == 'choice':
        is_correct = user_answer.upper() == correct_answer.upper()
    elif question.question_type == 'fill':
        user_clean = re.sub(r'\s+', '', user_answer)
        ans_clean = re.sub(r'\s+', '', correct_answer)
        is_correct = user_clean == ans_clean
    record = AnswerRecord(
        question_id=question_id,
        user_answer=user_answer,
        is_correct=is_correct,
        time_spent=time_spent,
        session_id=session_id
    )
    db.session.add(record)
    db.session.commit()
    return jsonify({
        'error': False,
        'is_correct': is_correct,
        'correct_answer': correct_answer,
        'analysis': question.analysis,
        'record_id': record.id
    })


@app.route('/api/questions/random', methods=['GET'])
def get_random_question():
    unit_id = request.args.get('unit_id', type=int)
    textbook_id = request.args.get('textbook_id', type=int)
    question_type = request.args.get('question_type', '')
    wrong_only = request.args.get('wrong_only', 'false').lower() == 'true'
    session_id = request.args.get('session_id', '')
    query = Question.query.filter_by(is_active=True)
    if unit_id:
        query = query.filter_by(unit_id=unit_id)
    if textbook_id:
        unit_ids = [u.id for u in Unit.query.filter_by(textbook_id=textbook_id).all()]
        query = query.filter(Question.unit_id.in_(unit_ids))
    if question_type:
        query = query.filter_by(question_type=question_type)
    if wrong_only and session_id:
        wrong_q_ids = [r.question_id for r in AnswerRecord.query.filter_by(
            session_id=session_id, is_correct=False
        ).all()]
        if wrong_q_ids:
            query = query.filter(Question.id.in_(wrong_q_ids))
        else:
            return jsonify({'error': False, 'data': None, 'message': '暂无错题'})
    questions = query.all()
    if not questions:
        return jsonify({'error': False, 'data': None, 'message': '暂无题目'})
    import random
    question = random.choice(questions)
    return jsonify({'error': False, 'data': question.to_dict(include_answer=False)})


@app.route('/api/wrong-questions', methods=['GET'])
def get_wrong_questions():
    session_id = request.args.get('session_id', '')
    if not session_id:
        return jsonify({'error': True, 'message': '缺少session_id'}), 400
    records = AnswerRecord.query.filter_by(
        session_id=session_id, is_correct=False
    ).order_by(AnswerRecord.created_at.desc()).all()
    seen_ids = set()
    unique_records = []
    for r in records:
        if r.question_id not in seen_ids:
            seen_ids.add(r.question_id)
            unique_records.append(r)
    result = []
    for r in unique_records:
        if r.question:
            item = r.question.to_dict(include_answer=True)
            item['user_answer'] = r.user_answer
            item['wrong_time'] = r.created_at.isoformat() if r.created_at else None
            result.append(item)
    return jsonify({'error': False, 'data': result, 'total': len(result)})


@app.route('/api/exam-papers', methods=['GET'])
def get_exam_papers():
    textbook_id = request.args.get('textbook_id', type=int)
    query = ExamPaper.query.filter_by(is_active=True)
    if textbook_id:
        query = query.filter_by(textbook_id=textbook_id)
    papers = query.order_by(ExamPaper.id.desc()).all()
    return jsonify({'error': False, 'data': [p.to_dict() for p in papers]})


@app.route('/api/exam-papers/<int:paper_id>', methods=['GET'])
def get_exam_paper(paper_id):
    paper = ExamPaper.query.get(paper_id)
    if not paper:
        return jsonify({'error': True, 'message': '试卷不存在'}), 404
    include_answer = request.args.get('include_answer', 'false').lower() == 'true'
    questions = ExamQuestion.query.filter_by(
        exam_paper_id=paper_id
    ).order_by(ExamQuestion.sort_order).all()
    return jsonify({
        'error': False,
        'data': paper.to_dict(),
        'questions': [eq.to_dict(include_answer=include_answer) for eq in questions]
    })


@app.route('/api/exam/submit', methods=['POST'])
def submit_exam():
    data = request.get_json()
    paper_id = data.get('paper_id')
    answers = data.get('answers', {})
    session_id = data.get('session_id', '')
    if not paper_id:
        return jsonify({'error': True, 'message': '缺少试卷ID'}), 400
    paper = ExamPaper.query.get(paper_id)
    if not paper:
        return jsonify({'error': True, 'message': '试卷不存在'}), 404
    exam_questions = ExamQuestion.query.filter_by(exam_paper_id=paper_id).all()
    total_score = 0
    correct_count = 0
    details = []
    for eq in exam_questions:
        q = eq.question
        if not q:
            continue
        user_answer = str(answers.get(str(q.id), '')).strip()
        correct_answer = q.answer.strip()
        is_correct = False
        if q.question_type == 'choice':
            is_correct = user_answer.upper() == correct_answer.upper()
        elif q.question_type == 'fill':
            user_clean = re.sub(r'\s+', '', user_answer)
            ans_clean = re.sub(r'\s+', '', correct_answer)
            is_correct = user_clean == ans_clean
        if is_correct:
            total_score += eq.score
            correct_count += 1
        details.append({
            'question_id': q.id,
            'user_answer': user_answer,
            'correct_answer': correct_answer,
            'is_correct': is_correct,
            'score': eq.score if is_correct else 0,
            'analysis': q.analysis
        })
    return jsonify({
        'error': False,
        'score': total_score,
        'total_score': paper.total_score,
        'correct_count': correct_count,
        'total_count': len(exam_questions),
        'details': details
    })


@app.route('/api/stats', methods=['GET'])
def get_stats():
    session_id = request.args.get('session_id', '')
    total_questions = Question.query.filter_by(is_active=True).count()
    total_units = Unit.query.count()
    total_textbooks = Textbook.query.count()
    practiced = 0
    correct_count = 0
    if session_id:
        records = AnswerRecord.query.filter_by(session_id=session_id).all()
        q_ids = set()
        for r in records:
            q_ids.add(r.question_id)
            if r.is_correct:
                correct_count += 1
        practiced = len(q_ids)
    return jsonify({
        'error': False,
        'data': {
            'total_questions': total_questions,
            'total_units': total_units,
            'total_textbooks': total_textbooks,
            'practiced': practiced,
            'correct_count': correct_count,
            'accuracy': round(correct_count / max(1, practiced), 2) if practiced else 0
        }
    })


@app.route('/api/health', methods=['GET'])
def health():
    has_key = bool(DEEPSEEK_API_KEY and DEEPSEEK_API_KEY != 'your_deepseek_api_key_here')
    total_questions = Question.query.filter_by(is_active=True).count()
    total_units = Unit.query.count()
    total_textbooks = Textbook.query.count()
    return jsonify({
        'status': 'ok',
        'api_configured': has_key,
        'model': DEEPSEEK_MODEL,
        'question_bank': {
            'textbooks': total_textbooks,
            'units': total_units,
            'questions': total_questions
        }
    })


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.getenv('FLASK_PORT', 8000))
    with app.app_context():
        total_questions = Question.query.filter_by(is_active=True).count()
        tb_count = Textbook.query.count()
        unit_count = Unit.query.count()
    print(f'语境 AI课堂 - 语文AI学习助手')
    print(f'服务已启动：http://localhost:{port}')
    print(f'DeepSeek API 已配置：{bool(DEEPSEEK_API_KEY and DEEPSEEK_API_KEY != "your_deepseek_api_key_here")}')
    print(f'题库：{tb_count}册教材，{unit_count}个单元，{total_questions}道题目')
    app.run(host='0.0.0.0', port=port, debug=False)
