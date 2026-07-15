import json
import os
import random
import glob
from datetime import datetime, timedelta, date
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.secret_key = 'smartlearn_v3_2026'

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
CONTENT_DIR = os.path.join(BASE_DIR, 'content')
os.makedirs(DATA_DIR, exist_ok=True)

SUBJECTS = {
    'math': {'name': '数学', 'icon': '📐', 'color': '#f97316', 'has_reading': False},
    'english': {'name': '英语', 'icon': '🔤', 'color': '#06b6d4', 'has_reading': True},
    'chinese': {'name': '语文', 'icon': '📚', 'color': '#22c55e', 'has_reading': True},
    'sports': {'name': '体育', 'icon': '⚽', 'color': '#fbbf24', 'has_reading': False}
}

WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
WEEKDAY_ICONS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '🎉', '🌟']

DEFAULT_WEEKLY_PLAN = {
    0: [
        {'type': 'study', 'subject': 'math', 'title': '数学练习', 'duration': 30, 'desc': '有理数/方程/几何练习'},
        {'type': 'study', 'subject': 'english', 'title': '英语学习', 'duration': 25, 'desc': '词汇语法+阅读理解'},
        {'type': 'sports', 'subject': 'sports', 'title': '体育锻炼', 'duration': 20, 'desc': '跳绳+热身运动'}
    ],
    1: [
        {'type': 'study', 'subject': 'chinese', 'title': '语文学习', 'duration': 25, 'desc': '字词基础+现代文阅读'},
        {'type': 'study', 'subject': 'math', 'title': '数学练习', 'duration': 30, 'desc': '方程组/不等式'},
        {'type': 'sports', 'subject': 'sports', 'title': '体育锻炼', 'duration': 20, 'desc': '开合跳+深蹲训练'}
    ],
    2: [
        {'type': 'study', 'subject': 'english', 'title': '英语学习', 'duration': 30, 'desc': '时态练习+短文阅读'},
        {'type': 'study', 'subject': 'chinese', 'title': '语文学习', 'duration': 25, 'desc': '修辞手法+病句修改'},
        {'type': 'sports', 'subject': 'sports', 'title': '体育锻炼', 'duration': 20, 'desc': '耐力慢跑+拉伸放松'}
    ],
    3: [
        {'type': 'study', 'subject': 'math', 'title': '数学练习', 'duration': 30, 'desc': '整式乘除/因式分解'},
        {'type': 'study', 'subject': 'english', 'title': '英语学习', 'duration': 25, 'desc': '词汇复习+阅读理解'},
        {'type': 'sports', 'subject': 'sports', 'title': '体育锻炼', 'duration': 20, 'desc': '高抬腿+俯卧撑'}
    ],
    4: [
        {'type': 'study', 'subject': 'chinese', 'title': '语文学习', 'duration': 25, 'desc': '文言文+文学常识'},
        {'type': 'review', 'subject': 'all', 'title': '周复习', 'duration': 30, 'desc': '本周知识点+错题回顾'},
        {'type': 'sports', 'subject': 'sports', 'title': '体育锻炼', 'duration': 25, 'desc': '综合体能训练'}
    ],
    5: [
        {'type': 'review', 'subject': 'all', 'title': '周末总复习', 'duration': 40, 'desc': '本周错题+知识点巩固'},
        {'type': 'study', 'subject': 'english', 'title': '英语拓展阅读', 'duration': 25, 'desc': '趣味英语短文阅读'},
        {'type': 'sports', 'subject': 'sports', 'title': '周末运动', 'duration': 35, 'desc': '户外活动/球类运动'}
    ],
    6: [
        {'type': 'study', 'subject': 'chinese', 'title': '课外阅读', 'duration': 30, 'desc': '散文/说明文阅读积累'},
        {'type': 'study', 'subject': 'math', 'title': '预习巩固', 'duration': 25, 'desc': '趣味数学+思维训练'},
        {'type': 'sports', 'subject': 'sports', 'title': '休闲运动', 'duration': 30, 'desc': '散步/瑜伽/兴趣运动'}
    ]
}


def load_content():
    knowledge_map = {}
    question_bank = {s: [] for s in SUBJECTS}
    reading_bank = {s: [] for s in SUBJECTS}
    
    subjects_file = os.path.join(CONTENT_DIR, 'knowledge', 'subjects.json')
    if os.path.exists(subjects_file):
        with open(subjects_file, 'r', encoding='utf-8') as f:
            subj_data = json.load(f)
        for skey, sval in subj_data.items():
            knowledge_map[skey] = []
            for kpid, kpinfo in sval.get('points', {}).items():
                kp_def = {
                    'id': kpid,
                    'name': kpinfo['name'],
                    'desc': kpinfo.get('desc', ''),
                    'level': 1,
                    'prerequisites': [],
                    'principle': kpinfo.get('principle', kpinfo.get('desc', ''))
                }
                knowledge_map[skey].append(kp_def)
    
    for subject in SUBJECTS:
        q_dir = os.path.join(CONTENT_DIR, 'questions', subject)
        if os.path.isdir(q_dir):
            for qf in glob.glob(os.path.join(q_dir, '*.json')):
                try:
                    with open(qf, 'r', encoding='utf-8') as f:
                        qs = json.load(f)
                    if isinstance(qs, list):
                        for q in qs:
                            q['type'] = 'choice'
                            q['source_file'] = os.path.basename(qf)
                            question_bank[subject].append(q)
                except Exception as e:
                    print(f"Warning: failed to load {qf}: {e}")
        
        r_dir = os.path.join(CONTENT_DIR, 'readings', subject)
        if os.path.isdir(r_dir):
            for rf in sorted(glob.glob(os.path.join(r_dir, '*.json'))):
                try:
                    with open(rf, 'r', encoding='utf-8') as f:
                        reading = json.load(f)
                    reading['type'] = 'reading'
                    reading['source_file'] = os.path.basename(rf)
                    kp_for_reading = 'e9' if subject == 'english' else 'c9'
                    for q in reading.get('questions', []):
                        q['type'] = 'reading_question'
                        q['reading_id'] = reading['id']
                        q['kp'] = kp_for_reading
                        q['difficulty'] = q.get('difficulty', 2)
                        if 'explain' not in q:
                            q['explain'] = '仔细阅读文章，找到相关内容分析作答。'
                    reading_bank[subject].append(reading)
                except Exception as e:
                    print(f"Warning: failed to load {rf}: {e}")
    
    for subject in SUBJECTS:
        if subject not in knowledge_map or not knowledge_map[subject]:
            kp_id_base = subject[0]
            kp_def = {'id': f'{kp_id_base}0', 'name': f'{SUBJECTS[subject]["name"]}基础', 'desc': '基础知识练习', 'level': 1, 'prerequisites': [], 'principle': ''}
            knowledge_map[subject] = [kp_def]
    
    default_kps = {
        'english': {'id': 'e9', 'name': '阅读理解', 'desc': '阅读文章理解文意', 'level': 2, 'prerequisites': ['e1'], 'principle': '阅读理解要先通读全文了解大意，再看题目带着问题找答案，注意首尾段和每段首句。'},
        'chinese': {'id': 'c9', 'name': '现代文阅读', 'desc': '散文、说明文阅读理解', 'level': 2, 'prerequisites': ['c2', 'c4'], 'principle': '现代文阅读技巧：通读全文抓中心，审题定向找区间，筛选整合作答，注意关键词句。'}
    }
    for s, kp_def in default_kps.items():
        if s in knowledge_map:
            existing_ids = {k['id'] for k in knowledge_map[s]}
            if kp_def['id'] not in existing_ids:
                knowledge_map[s].append(kp_def)
    
    total_questions = sum(len(v) for v in question_bank.values())
    total_readings = sum(len(v) for v in reading_bank.values())
    print(f"📚 题库加载完成：{total_questions}道选择题 + {total_readings}篇阅读材料")
    for s in SUBJECTS:
        qc = len(question_bank[s])
        rc = len(reading_bank[s])
        kpc = len(knowledge_map.get(s, []))
        print(f"   {SUBJECTS[s]['icon']} {SUBJECTS[s]['name']}: {qc}道选择题, {rc}篇阅读, {kpc}个知识点")
    
    return knowledge_map, question_bank, reading_bank


KNOWLEDGE_MAP, QUESTION_BANK, READING_BANK = load_content()


def load_data(filename, default=None):
    filepath = os.path.join(DATA_DIR, filename)
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return default if default is not None else {}


def save_data(filename, data):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_user(user_id='default'):
    users = load_data('users.json', {})
    today = date.today().isoformat()
    if user_id not in users:
        users[user_id] = {
            'id': user_id,
            'name': '学习者',
            'grade': '初一',
            'created_at': datetime.now().isoformat(),
            'total_points': 0,
            'level': 1,
            'xp': 0,
            'streak_days': 0,
            'last_study_date': None,
            'study_sessions': [],
            'achievements': [],
            'subject_mastery': {s: {} for s in SUBJECTS},
            'wrong_questions': [],
            'daily_tasks': {},
            'wrong_readings': []
        }
        for subject, kps in KNOWLEDGE_MAP.items():
            for kp in kps:
                users[user_id]['subject_mastery'][subject][kp['id']] = {
                    'mastery': 0.0,
                    'correct_count': 0,
                    'wrong_count': 0,
                    'next_review': datetime.now().isoformat(),
                    'review_count': 0,
                    'ease_factor': 2.5,
                    'interval_days': 1
                }
        users[user_id]['daily_tasks'][today] = generate_daily_tasks(0)
        save_data('users.json', users)
    user = users[user_id]
    
    for subject, kps in KNOWLEDGE_MAP.items():
        if subject not in user['subject_mastery']:
            user['subject_mastery'][subject] = {}
        for kp in kps:
            if kp['id'] not in user['subject_mastery'][subject]:
                user['subject_mastery'][subject][kp['id']] = {
                    'mastery': 0.0,
                    'correct_count': 0,
                    'wrong_count': 0,
                    'next_review': datetime.now().isoformat(),
                    'review_count': 0,
                    'ease_factor': 2.5,
                    'interval_days': 1
                }
    
    if today not in user.get('daily_tasks', {}):
        weekday = date.today().weekday()
        user['daily_tasks'][today] = generate_daily_tasks(weekday)
        save_data('users.json', users)
    return user


def generate_daily_tasks(weekday):
    plan = DEFAULT_WEEKLY_PLAN.get(weekday, DEFAULT_WEEKLY_PLAN[0])
    tasks = []
    for i, item in enumerate(plan):
        tasks.append({
            'id': f"task_{int(datetime.now().timestamp())}_{i}",
            'type': item['type'],
            'subject': item['subject'],
            'title': item['title'],
            'desc': item['desc'],
            'duration': item['duration'],
            'completed': False,
            'completed_at': None
        })
    return tasks


def save_user(user, user_id='default'):
    users = load_data('users.json', {})
    users[user_id] = user
    save_data('users.json', users)


def spaced_repetition_update(mastery_data, correct):
    now = datetime.now()
    ef = mastery_data['ease_factor']
    interval = mastery_data['interval_days']
    
    if correct:
        if mastery_data['review_count'] == 0:
            interval = 1
        elif mastery_data['review_count'] == 1:
            interval = 3
        else:
            interval = round(interval * ef)
        ef = ef + 0.1
        mastery_data['mastery'] = min(1.0, mastery_data['mastery'] + 0.12)
    else:
        interval = 1
        ef = max(1.3, ef - 0.2)
        mastery_data['mastery'] = max(0.0, mastery_data['mastery'] - 0.08)
    
    mastery_data['ease_factor'] = round(ef, 2)
    mastery_data['interval_days'] = interval
    mastery_data['next_review'] = (now + timedelta(days=interval)).isoformat()
    mastery_data['review_count'] += 1
    return mastery_data


def recommend_questions(user, subject, count=5):
    mastery = user['subject_mastery'][subject]
    available_qs = list(QUESTION_BANK.get(subject, []))
    available_readings = list(READING_BANK.get(subject, []))
    
    result_items = []
    
    wrong_kp_ids = set(w['kp'] for w in user.get('wrong_questions', []) if w.get('subject') == subject)
    
    scored_qs = []
    now = datetime.now()
    
    for q in available_qs:
        kp_id = q.get('kp')
        if not kp_id:
            continue
        kp_mastery = mastery.get(kp_id, {}).get('mastery', 0.5)
        next_review_str = mastery.get(kp_id, {}).get('next_review')
        needs_review = 1.0
        is_wrong = kp_id in wrong_kp_ids
        
        if next_review_str:
            next_review = datetime.fromisoformat(next_review_str)
            if now >= next_review:
                needs_review = 2.0 if not is_wrong else 3.0
            else:
                needs_review = 0.5
        
        score = (1 - kp_mastery) * needs_review * (2.5 if is_wrong else 1.0) * random.uniform(0.8, 1.2)
        scored_qs.append((score, q, kp_id, 'choice'))
    
    include_reading = SUBJECTS.get(subject, {}).get('has_reading', False) and available_readings and random.random() < 0.35
    
    if include_reading:
        reading = random.choice(available_readings)
        reading_questions = reading.get('questions', [])
        if reading_questions:
            rq_count = min(len(reading_questions), random.randint(2, 3))
            selected_rqs = random.sample(reading_questions, rq_count)
            reading_result = {
                'type': 'reading',
                'id': reading['id'],
                'title': reading.get('title', ''),
                'author': reading.get('author', ''),
                'content': reading['content'],
                'questions': []
            }
            for rq in selected_rqs:
                rq_copy = dict(rq)
                rq_copy['type'] = 'reading_question'
                reading_result['questions'].append(rq_copy)
            result_items.append(('reading', reading_result))
    
    scored_qs.sort(reverse=True, key=lambda x: x[0])
    used_kps = set()
    selected_qs = []
    
    for score, q, kp_id, qtype in scored_qs:
        if len(selected_qs) < min(2, len([w for w in user.get('wrong_questions', []) if w.get('subject') == subject])) and kp_id in wrong_kp_ids and kp_id not in used_kps:
            selected_qs.append(q)
            used_kps.add(kp_id)
    
    for score, q, kp_id, qtype in scored_qs:
        if kp_id not in used_kps:
            selected_qs.append(q)
            used_kps.add(kp_id)
        if len(selected_qs) >= count - (sum(len(r[1].get('questions', [])) for r in result_items if r[0] == 'reading')):
            break
    
    while len(selected_qs) < count and available_qs:
        q = random.choice(available_qs)
        if q not in selected_qs:
            selected_qs.append(q)
    
    for q in selected_qs:
        result_items.append(('choice', q))
    
    random.shuffle(result_items)
    
    questions = []
    for item_type, item_data in result_items:
        if item_type == 'reading':
            questions.append({
                'item_type': 'reading',
                'reading': item_data
            })
        else:
            questions.append({
                'item_type': 'question',
                'question': item_data
            })
    
    return questions


def check_achievements(user):
    achievements = []
    total = user['total_points']
    sessions = len(user['study_sessions'])
    today_completed = sum(1 for t in user.get('daily_tasks', {}).get(date.today().isoformat(), []) if t.get('completed'))
    
    achievement_defs = [
        {'id': 'first_step', 'name': '迈出第一步', 'desc': '完成第一次学习', 'icon': '🎯', 'cond': sessions >= 1},
        {'id': 'streak_3', 'name': '三天打鱼', 'desc': '连续学习3天', 'icon': '🔥', 'cond': user['streak_days'] >= 3},
        {'id': 'streak_7', 'name': '一周坚持', 'desc': '连续学习7天', 'icon': '💪', 'cond': user['streak_days'] >= 7},
        {'id': 'streak_30', 'name': '月度学霸', 'desc': '连续学习30天', 'icon': '🏅', 'cond': user['streak_days'] >= 30},
        {'id': 'points_100', 'name': '知识猎手', 'desc': '总积分达到100', 'icon': '🏆', 'cond': total >= 100},
        {'id': 'points_500', 'name': '学霸初成', 'desc': '总积分达到500', 'icon': '👑', 'cond': total >= 500},
        {'id': 'points_2000', 'name': '学神附体', 'desc': '总积分达到2000', 'icon': '🚀', 'cond': total >= 2000},
        {'id': 'all_subjects', 'name': '全面发展', 'desc': '四个学科都学习过', 'icon': '🌟', 'cond': all(any(m['mastery'] > 0 for m in user['subject_mastery'][s].values()) for s in SUBJECTS)},
        {'id': 'marathon', 'name': '马拉松', 'desc': '累计学习10次', 'icon': '🏃', 'cond': sessions >= 10},
        {'id': 'marathon_50', 'name': '学习达人', 'desc': '累计学习50次', 'icon': '🎖️', 'cond': sessions >= 50},
        {'id': 'daily_complete', 'name': '今日达标', 'desc': '完成今日所有任务', 'icon': '✅', 'cond': today_completed >= 3},
        {'id': 'wrong_master', 'name': '知错能改', 'desc': '错题本中收录题目', 'icon': '📝', 'cond': len(user.get('wrong_questions', [])) >= 3},
        {'id': 'reader', 'name': '阅读之星', 'desc': '完成3篇阅读理解', 'icon': '📖', 'cond': any(s.get('reading_correct', 0) >= 3 for s in [])}
    ]
    
    current_ids = set(a['id'] for a in user['achievements'])
    for a in achievement_defs:
        if a['cond'] and a['id'] not in current_ids:
            achievements.append(a)
            user['achievements'].append(a)
    return achievements


def calculate_level(xp):
    level = 1
    remaining = xp
    threshold = 100
    while remaining >= threshold:
        remaining -= threshold
        level += 1
        threshold = int(threshold * 1.5)
    return level, remaining, threshold


@app.route('/')
def index():
    return render_template('index.html', subjects=SUBJECTS, knowledge_map=KNOWLEDGE_MAP,
                          weekday_names=WEEKDAY_NAMES, weekday_icons=WEEKDAY_ICONS)


@app.route('/api/user', methods=['GET'])
def api_get_user():
    user = get_user()
    level, current_xp, xp_needed = calculate_level(user['xp'])
    user['current_level'] = level
    user['current_xp'] = current_xp
    user['xp_needed'] = xp_needed
    return jsonify(user)


@app.route('/api/calendar', methods=['GET'])
def api_calendar():
    user = get_user()
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    
    week_data = []
    need_save = False
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        d_str = d.isoformat()
        tasks = user.get('daily_tasks', {}).get(d_str, [])
        if not tasks:
            tasks = generate_daily_tasks(i)
            if 'daily_tasks' not in user:
                user['daily_tasks'] = {}
            user['daily_tasks'][d_str] = tasks
            need_save = True
    if need_save:
        save_user(user)
    
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        d_str = d.isoformat()
        tasks = user['daily_tasks'][d_str]
        
        completed_count = sum(1 for t in tasks if t.get('completed'))
        is_today = (d == today)
        is_past = (d < today)
        
        week_data.append({
            'date': d_str,
            'weekday': i,
            'weekday_name': WEEKDAY_NAMES[i],
            'weekday_icon': WEEKDAY_ICONS[i],
            'is_today': is_today,
            'is_past': is_past,
            'is_future': (d > today),
            'tasks': tasks,
            'total_tasks': len(tasks),
            'completed_tasks': completed_count,
            'all_completed': completed_count == len(tasks) and len(tasks) > 0
        })
    
    return jsonify({'week': week_data, 'today': today.isoformat()})


@app.route('/api/task/complete', methods=['POST'])
def api_complete_task():
    data = request.json
    task_id = data.get('task_id')
    date_str = data.get('date')
    completed = data.get('completed', True)
    
    user = get_user()
    if date_str in user.get('daily_tasks', {}):
        for task in user['daily_tasks'][date_str]:
            if task['id'] == task_id:
                task['completed'] = completed
                task['completed_at'] = datetime.now().isoformat() if completed else None
                break
    
    if completed:
        today = date.today().isoformat()
        today_tasks = user['daily_tasks'].get(today, [])
        all_done = len(today_tasks) > 0 and all(t.get('completed') for t in today_tasks)
        if all_done:
            user['xp'] += 20
            user['total_points'] += 20
    
    new_achievements = check_achievements(user)
    save_user(user)
    
    level, current_xp, xp_needed = calculate_level(user['xp'])
    return jsonify({
        'success': True,
        'level': level,
        'current_xp': current_xp,
        'xp_needed': xp_needed,
        'total_points': user['total_points'],
        'achievements': new_achievements
    })


@app.route('/api/subjects/<subject>/recommend', methods=['GET'])
def api_recommend(subject):
    if subject not in SUBJECTS:
        return jsonify({'error': 'Invalid subject'}), 400
    count = int(request.args.get('count', 5))
    user = get_user()
    items = recommend_questions(user, subject, count)
    total_questions = 0
    for item in items:
        if item['item_type'] == 'reading':
            total_questions += len(item['reading']['questions'])
        else:
            total_questions += 1
    return jsonify({
        'items': items,
        'subject': SUBJECTS[subject],
        'total_questions': total_questions
    })


@app.route('/api/subjects/<subject>/answer', methods=['POST'])
def api_answer(subject):
    if subject not in SUBJECTS:
        return jsonify({'error': 'Invalid subject'}), 400
    data = request.json
    kp_id = data.get('kp_id')
    correct = data.get('correct', False)
    time_taken = data.get('time_taken', 30)
    question_text = data.get('question', '')
    options = data.get('options', [])
    ans = data.get('ans', 0)
    explain = data.get('explain', '')
    is_reading = data.get('is_reading', False)
    
    user = get_user()
    mastery_data = user['subject_mastery'][subject].get(kp_id)
    if not mastery_data:
        all_kp_ids = [k['id'] for k in KNOWLEDGE_MAP.get(subject, [])]
        if all_kp_ids:
            default_kp = all_kp_ids[0]
            mastery_data = user['subject_mastery'][subject][default_kp]
            kp_id = default_kp
        else:
            return jsonify({'error': 'Invalid knowledge point'}), 400
    
    if correct:
        mastery_data['correct_count'] += 1
        points = 10
        if time_taken < 10:
            points += 5
        elif time_taken < 20:
            points += 2
        if is_reading:
            points += 3
        user['wrong_questions'] = [w for w in user.get('wrong_questions', [])
                                  if not (w.get('kp') == kp_id and w.get('subject') == subject and w.get('q') == question_text)]
    else:
        mastery_data['wrong_count'] += 1
        points = 2
        wrong_q = {
            'subject': subject,
            'kp': kp_id,
            'q': question_text,
            'options': options,
            'ans': ans,
            'explain': explain,
            'is_reading': is_reading,
            'added_at': datetime.now().isoformat(),
            'wrong_count': 1
        }
        existing = [w for w in user.get('wrong_questions', []) if w.get('q') == question_text and w.get('subject') == subject]
        if existing:
            existing[0]['wrong_count'] = existing[0].get('wrong_count', 1) + 1
        else:
            if 'wrong_questions' not in user:
                user['wrong_questions'] = []
            user['wrong_questions'].append(wrong_q)
    
    today = date.today().isoformat()
    if user['last_study_date'] != today:
        if user['last_study_date']:
            last_date = date.fromisoformat(user['last_study_date'])
            if (date.today() - last_date).days == 1:
                user['streak_days'] += 1
            elif (date.today() - last_date).days > 1:
                user['streak_days'] = 1
        else:
            user['streak_days'] = 1
        user['last_study_date'] = today
    
    session_data = {
        'id': f"sess_{int(datetime.now().timestamp())}",
        'subject': subject,
        'start_time': datetime.now().isoformat(),
        'kp_id': kp_id,
        'correct': correct,
        'is_reading': is_reading
    }
    user['study_sessions'].append(session_data)
    if len(user['study_sessions']) > 200:
        user['study_sessions'] = user['study_sessions'][-200:]
    
    spaced_repetition_update(mastery_data, correct)
    user['xp'] += points
    user['total_points'] += points
    
    new_achievements = check_achievements(user)
    save_user(user)
    
    level, current_xp, xp_needed = calculate_level(user['xp'])
    
    kp_info = next((k for k in KNOWLEDGE_MAP.get(subject, []) if k['id'] == kp_id), None)
    principle = kp_info.get('principle', '') if kp_info else ''
    
    return jsonify({
        'success': True,
        'points_earned': points,
        'total_points': user['total_points'],
        'mastery': mastery_data['mastery'],
        'next_review': mastery_data['next_review'],
        'achievements': new_achievements,
        'level': level,
        'current_xp': current_xp,
        'xp_needed': xp_needed,
        'streak_days': user['streak_days'],
        'principle': principle
    })


@app.route('/api/knowledge/<subject>', methods=['GET'])
def api_knowledge(subject):
    if subject not in SUBJECTS:
        return jsonify({'error': 'Invalid subject'}), 400
    user = get_user()
    kps = []
    total_q = len(QUESTION_BANK.get(subject, []))
    total_r = len(READING_BANK.get(subject, []))
    for kp in KNOWLEDGE_MAP.get(subject, []):
        m = user['subject_mastery'][subject].get(kp['id'], {})
        kps.append({
            **kp,
            'mastery': m.get('mastery', 0),
            'correct': m.get('correct_count', 0),
            'wrong': m.get('wrong_count', 0),
            'next_review': m.get('next_review'),
            'needs_review': datetime.fromisoformat(m.get('next_review', datetime.now().isoformat())) <= datetime.now() if m else True,
            'review_count': m.get('review_count', 0)
        })
    return jsonify({
        'knowledge_points': kps,
        'subject': SUBJECTS[subject],
        'total_questions': total_q,
        'total_readings': total_r
    })


@app.route('/api/review/due', methods=['GET'])
def api_due_review():
    user = get_user()
    now = datetime.now()
    due = {}
    wrong = {s: [] for s in SUBJECTS}
    for wq in user.get('wrong_questions', []):
        s = wq['subject']
        if s in wrong:
            wrong[s].append(wq)
    
    for subject in SUBJECTS:
        due[subject] = []
        for kp_id, m in user['subject_mastery'][subject].items():
            if m.get('next_review'):
                nr = datetime.fromisoformat(m['next_review'])
                if now >= nr and (m['correct_count'] + m['wrong_count']) > 0:
                    kp_info = next((k for k in KNOWLEDGE_MAP.get(subject, []) if k['id'] == kp_id), None)
                    if kp_info:
                        due[subject].append({**kp_info, 'mastery': m['mastery'], 'is_wrong': kp_id in set(w['kp'] for w in wrong.get(subject, []))})
    return jsonify({'due_reviews': due, 'wrong_questions': wrong})


@app.route('/api/wrong-questions', methods=['GET'])
def api_wrong_questions():
    user = get_user()
    by_subject = {}
    for s in SUBJECTS:
        by_subject[s] = [w for w in user.get('wrong_questions', []) if w.get('subject') == s]
    return jsonify({'wrong_questions': by_subject})


@app.route('/api/sports/exercises', methods=['GET'])
def api_sports_exercises():
    exercises = [
        {'name': '热身活动', 'duration': 60, 'desc': '关节活动 + 原地踏步', 'icon': '🤸'},
        {'name': '开合跳', 'duration': 45, 'desc': '双脚开合同时手臂上下摆动', 'icon': '⭐'},
        {'name': '休息', 'duration': 20, 'desc': '深呼吸，慢走放松', 'icon': '😌'},
        {'name': '深蹲', 'duration': 45, 'desc': '像坐椅子一样下蹲，膝盖不超过脚尖', 'icon': '🏋️', 'reps': '12-15个'},
        {'name': '高抬腿', 'duration': 40, 'desc': '大腿抬到水平位置，节奏均匀', 'icon': '🏃'},
        {'name': '休息', 'duration': 20, 'desc': '深呼吸放松', 'icon': '😌'},
        {'name': '跳绳', 'duration': 60, 'desc': '手腕摇绳，前脚掌轻跳', 'icon': '⏫'},
        {'name': '俯卧撑/跪姿俯卧撑', 'duration': 45, 'desc': '身体成一条直线，女生可做跪姿', 'icon': '💪', 'reps': '8-12个'},
        {'name': '拉伸放松', 'duration': 60, 'desc': '全身静态拉伸，每个动作15-30秒', 'icon': '🧘'}
    ]
    return jsonify({'exercises': exercises})


@app.route('/api/content/stats', methods=['GET'])
def api_content_stats():
    stats = {}
    for s in SUBJECTS:
        stats[s] = {
            'name': SUBJECTS[s]['name'],
            'icon': SUBJECTS[s]['icon'],
            'questions': len(QUESTION_BANK.get(s, [])),
            'readings': len(READING_BANK.get(s, [])),
            'knowledge_points': len(KNOWLEDGE_MAP.get(s, []))
        }
    total_q = sum(s['questions'] for s in stats.values())
    total_r = sum(s['readings'] for s in stats.values())
    return jsonify({
        'subjects': stats,
        'total_questions': total_q,
        'total_readings': total_r,
        'total_items': total_q + sum(s['readings'] * 3 for s in stats.values())
    })


@app.route('/api/dashboard', methods=['GET'])
def api_dashboard():
    user = get_user()
    level, current_xp, xp_needed = calculate_level(user['xp'])
    today = date.today().isoformat()
    
    subject_stats = {}
    total_correct = 0
    total_questions = 0
    for s in SUBJECTS:
        correct = sum(m['correct_count'] for m in user['subject_mastery'][s].values())
        wrong = sum(m['wrong_count'] for m in user['subject_mastery'][s].values())
        total = correct + wrong
        kps = KNOWLEDGE_MAP.get(s, [])
        avg_mastery = sum(m['mastery'] for m in user['subject_mastery'][s].values()) / len(kps) if kps else 0
        subject_stats[s] = {
            'name': SUBJECTS[s]['name'],
            'icon': SUBJECTS[s]['icon'],
            'color': SUBJECTS[s]['color'],
            'correct': correct,
            'wrong': wrong,
            'total': total,
            'accuracy': round(correct / total * 100, 1) if total > 0 else 0,
            'avg_mastery': round(avg_mastery * 100, 1),
            'kp_count': len(kps),
            'q_count': len(QUESTION_BANK.get(s, [])),
            'r_count': len(READING_BANK.get(s, []))
        }
        total_correct += correct
        total_questions += total
    
    now = datetime.now()
    due_count = 0
    for s in SUBJECTS:
        for m in user['subject_mastery'][s].values():
            if m.get('next_review'):
                nr = datetime.fromisoformat(m['next_review'])
                if now >= nr and (m['correct_count'] + m['wrong_count']) > 0:
                    due_count += 1
    
    today_tasks = user.get('daily_tasks', {}).get(today, [])
    today_completed = sum(1 for t in today_tasks if t.get('completed'))
    
    week_ago = (date.today() - timedelta(days=7)).isoformat()
    week_sessions = [s for s in user['study_sessions'] if s['start_time'][:10] >= week_ago]
    week_days_studied = len(set(s['start_time'][:10] for s in week_sessions))
    
    return jsonify({
        'user': {
            'name': user['name'],
            'grade': user['grade'],
            'level': level,
            'current_xp': current_xp,
            'xp_needed': xp_needed,
            'total_points': user['total_points'],
            'streak_days': user['streak_days'],
            'achievements': user['achievements'],
            'total_sessions': len(user['study_sessions']),
            'wrong_count': len(user.get('wrong_questions', [])),
            'achievement_count': len(user.get('achievements', []))
        },
        'subject_stats': subject_stats,
        'total_questions': total_questions,
        'total_correct': total_correct,
        'overall_accuracy': round(total_correct / total_questions * 100, 1) if total_questions > 0 else 0,
        'due_review_count': due_count,
        'week_sessions': len(week_sessions),
        'week_days_studied': week_days_studied,
        'today_tasks': today_tasks,
        'today_completed': today_completed,
        'today_total': len(today_tasks),
        'content_stats': {
            'total_questions': sum(len(QUESTION_BANK.get(s, [])) for s in SUBJECTS),
            'total_readings': sum(len(READING_BANK.get(s, [])) for s in SUBJECTS)
        }
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🎓 智学成长乐园 v3.0 · 自适应学习系统")
    print("=" * 60)
    print("📅 学习日历 · 📖 阅读理解 · 📝 错题本 · 🏆 成就系统")
    print("📚 题库从content目录加载，支持无限扩充")
    print("启动中... 请在浏览器中访问: http://localhost:5000")
    print("=" * 60)
    app.run(debug=True, port=5000)
