# -*- coding: utf-8 -*-
"""
TimeForge X —— AI人生规划指挥中心
Flask主应用 - 完整后端
"""
import os
import json
import uuid
from datetime import datetime, timedelta, date

from flask import Flask, request, jsonify, render_template, send_from_directory, g

from config import Config
from database import get_db, init_db, dict_from_row, dicts_from_rows
from auth import (
    hash_password, verify_password, create_jwt, decode_jwt,
    login_required, optional_login, generate_verification_code,
    generate_reset_token, validate_email, validate_phone,
    validate_username, validate_password, calculate_level_info,
    add_experience
)
from agents import (
    AGENT_DEFINITIONS, PIPELINE_MODES, COURSE_TEMPLATES,
    generate_group_discussion, execute_pipeline,
    plan_course_assignment, plan_exam_prep, plan_career,
    analyze_procrastination, get_growth_dashboard
)

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = Config.SECRET_KEY

init_db()

# =============================================
# 页面路由
# =============================================
@app.route('/')
def index():
    return render_template('index.html', page='dashboard')

@app.route('/login')
def login_page():
    return render_template('login.html', page='login')

@app.route('/register')
def register_page():
    return render_template('register.html', page='register')

@app.route('/tasks')
def tasks_page():
    return render_template('tasks.html', page='tasks')

@app.route('/profile')
def profile_page():
    return render_template('profile.html', page='profile')

@app.route('/agents')
def agents_page():
    return render_template('agents.html', page='agents')

@app.route('/pipeline')
def pipeline_page():
    return render_template('pipeline.html', page='pipeline')

@app.route('/course-planner')
def course_planner_page():
    return render_template('course_planner.html', page='course-planner')

@app.route('/exam-planner')
def exam_planner_page():
    return render_template('exam_planner.html', page='exam-planner')

@app.route('/career-center')
def career_center_page():
    return render_template('career_center.html', page='career-center')

@app.route('/procrastination')
def procrastination_page():
    return render_template('procrastination.html', page='procrastination')

@app.route('/growth')
def growth_page():
    return render_template('growth.html', page='growth')

@app.route('/community')
def community_page():
    return render_template('community.html', page='community')

@app.route('/export')
def export_page():
    return render_template('export.html', page='export')

@app.route('/demo')
def demo_page():
    return render_template('demo.html', page='demo')

@app.route('/about')
def about_page():
    return render_template('about.html', page='about')

@app.route('/tech-arch')
def tech_arch_page():
    return render_template('tech_arch.html', page='tech-arch')

@app.route('/dev-log')
def dev_log_page():
    return render_template('dev_log.html', page='dev-log')

@app.route('/highlights')
def highlights_page():
    return render_template('highlights.html', page='highlights')

@app.route('/help')
def help_page():
    return render_template('help.html', page='help')

@app.route('/team')
def team_page():
    return render_template('team.html', page='team')

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

# =============================================
# 认证 API
# =============================================

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    register_type = data.get('type', 'username')

    if not validate_password(password):
        return jsonify({"success": False, "message": "密码至少6位"}), 400

    conn = get_db()

    if register_type == 'email':
        if not email or not validate_email(email):
            return jsonify({"success": False, "message": "邮箱格式不正确"}), 400
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            conn.close()
            return jsonify({"success": False, "message": "该邮箱已注册"}), 400
    elif register_type == 'phone':
        if not phone or not validate_phone(phone):
            return jsonify({"success": False, "message": "手机号格式不正确"}), 400
        existing = conn.execute("SELECT id FROM users WHERE phone = ?", (phone,)).fetchone()
        if existing:
            conn.close()
            return jsonify({"success": False, "message": "该手机号已注册"}), 400
    else:
        if not username or not validate_username(username):
            return jsonify({"success": False, "message": "用户名3-20位，支持中英文数字下划线"}), 400
        existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing:
            conn.close()
            return jsonify({"success": False, "message": "该用户名已被占用"}), 400

    if not username:
        username = email.split('@')[0] if email else phone

    password_hash = hash_password(password)
    conn.execute('''
        INSERT INTO users (username, email, phone, password_hash)
        VALUES (?, ?, ?, ?)
    ''', (username, email or None, phone or None, password_hash))
    conn.commit()

    user = dict_from_row(conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone())
    conn.close()

    token = create_jwt({"user_id": user["id"], "username": user["username"]})
    return jsonify({
        "success": True,
        "message": "注册成功",
        "token": token,
        "user": _format_user(user),
    })


@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    login_type = data.get('type', 'username')
    account = data.get('account', '').strip()
    password = data.get('password', '')
    code = data.get('code', '')

    conn = get_db()

    # 验证码登录
    if code and login_type in ('email', 'phone'):
        target = data.get('email', '') or data.get('phone', '')
        if not target:
            return jsonify({"success": False, "message": "请输入邮箱或手机号"}), 400
        from datetime import datetime as dt
        vc = conn.execute(
            "SELECT * FROM verification_codes WHERE target = ? AND code = ? AND type = ? AND used = 0 AND expires_at > ? ORDER BY id DESC LIMIT 1",
            (target, code, 'login', dt.now().isoformat())
        ).fetchone()
        if not vc:
            conn.close()
            return jsonify({"success": False, "message": "验证码错误或已过期"}), 400
        conn.execute("UPDATE verification_codes SET used = 1 WHERE id = ?", (vc["id"],))
        if login_type == 'email':
            user = dict_from_row(conn.execute("SELECT * FROM users WHERE email = ?", (target,)).fetchone())
        else:
            user = dict_from_row(conn.execute("SELECT * FROM users WHERE phone = ?", (target,)).fetchone())
    else:
        user = None
        if login_type == 'email':
            user = dict_from_row(conn.execute("SELECT * FROM users WHERE email = ?", (account,)).fetchone())
        elif login_type == 'phone':
            user = dict_from_row(conn.execute("SELECT * FROM users WHERE phone = ?", (account,)).fetchone())
        else:
            user = dict_from_row(conn.execute("SELECT * FROM users WHERE username = ?", (account,)).fetchone())

        if not user:
            conn.close()
            return jsonify({"success": False, "message": "账号不存在"}), 400

        if not verify_password(password, user["password_hash"]):
            conn.close()
            return jsonify({"success": False, "message": "密码错误"}), 400

    conn.close()

    if not user:
        return jsonify({"success": False, "message": "用户不存在"}), 400

    token = create_jwt({"user_id": user["id"], "username": user["username"]})
    return jsonify({
        "success": True,
        "message": "登录成功",
        "token": token,
        "user": _format_user(user),
    })


@app.route('/api/auth/send-code', methods=['POST'])
def api_send_code():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    target = data.get('target', '').strip()
    code_type = data.get('type', 'login')
    code = generate_verification_code()
    expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()

    conn = get_db()
    conn.execute('''
        INSERT INTO verification_codes (target, code, type, expires_at)
        VALUES (?, ?, ?, ?)
    ''', (target, code, code_type, expires_at))
    conn.commit()
    conn.close()

    # 模拟发送验证码
    print(f"[验证码] 发送到 {target}: {code}")

    return jsonify({
        "success": True,
        "message": f"验证码已发送到{target}",
        "code": code,  # 开发环境返回验证码
    })


@app.route('/api/auth/forgot-password', methods=['POST'])
def api_forgot_password():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    email = data.get('email', '').strip()
    if not email:
        return jsonify({"success": False, "message": "请输入邮箱"}), 400

    conn = get_db()
    user = dict_from_row(conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone())
    if not user:
        conn.close()
        return jsonify({"success": False, "message": "该邮箱未注册"}), 400

    token = generate_reset_token()
    expires_at = (datetime.now() + timedelta(hours=1)).isoformat()
    conn.execute('''
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (?, ?, ?)
    ''', (user["id"], token, expires_at))
    conn.commit()
    conn.close()

    reset_link = f"重置链接: /reset-password?token={token}"
    print(f"[密码重置] {reset_link}")

    return jsonify({
        "success": True,
        "message": "重置链接已发送到您的邮箱",
        "reset_token": token,
    })


@app.route('/api/auth/reset-password', methods=['POST'])
def api_reset_password():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    token = data.get('token', '')
    new_password = data.get('password', '')

    if not validate_password(new_password):
        return jsonify({"success": False, "message": "密码至少6位"}), 400

    conn = get_db()
    reset_record = dict_from_row(conn.execute(
        "SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > ?",
        (token, datetime.now().isoformat())
    ).fetchone())

    if not reset_record:
        conn.close()
        return jsonify({"success": False, "message": "重置链接无效或已过期"}), 400

    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                 (hash_password(new_password), reset_record["user_id"]))
    conn.execute("UPDATE password_reset_tokens SET used = 1 WHERE id = ?", (reset_record["id"],))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "密码重置成功"})


@app.route('/api/auth/me', methods=['GET'])
@login_required
def api_me():
    return jsonify({"success": True, "user": _format_user(g.current_user)})


@app.route('/api/auth/update-profile', methods=['POST'])
@login_required
def api_update_profile():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    conn = get_db()
    updates = []
    params = []

    if 'bio' in data:
        updates.append("bio = ?")
        params.append(data['bio'][:200])
    if 'avatar_url' in data:
        updates.append("avatar_url = ?")
        params.append(data['avatar_url'])
    if 'username' in data and data['username'] != g.current_user['username']:
        if not validate_username(data['username']):
            conn.close()
            return jsonify({"success": False, "message": "用户名格式不正确"}), 400
        existing = conn.execute("SELECT id FROM users WHERE username = ? AND id != ?",
                                (data['username'], g.current_user['id'])).fetchone()
        if existing:
            conn.close()
            return jsonify({"success": False, "message": "用户名已被占用"}), 400
        updates.append("username = ?")
        params.append(data['username'])

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(g.current_user['id'])
        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
        conn.commit()

    user = dict_from_row(conn.execute("SELECT * FROM users WHERE id = ?", (g.current_user['id'],)).fetchone())
    conn.close()

    return jsonify({"success": True, "message": "资料更新成功", "user": _format_user(user)})


@app.route('/api/auth/change-password', methods=['POST'])
@login_required
def api_change_password():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    old_password = data.get('old_password', '')
    new_password = data.get('new_password', '')

    if not verify_password(old_password, g.current_user['password_hash']):
        return jsonify({"success": False, "message": "原密码错误"}), 400

    if not validate_password(new_password):
        return jsonify({"success": False, "message": "新密码至少6位"}), 400

    conn = get_db()
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                 (hash_password(new_password), g.current_user['id']))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "密码修改成功"})


@app.route('/api/auth/checkin', methods=['POST'])
@login_required
def api_checkin():
    conn = get_db()
    today_str = date.today().isoformat()
    user = dict_from_row(conn.execute("SELECT * FROM users WHERE id = ?", (g.current_user['id'],)).fetchone())
    checkin_dates = json.loads(user.get("checkin_dates", "[]"))

    if today_str in checkin_dates:
        conn.close()
        return jsonify({"success": False, "message": "今日已打卡"})

    checkin_dates.append(today_str)
    new_streak = user["streak"] + 1
    new_max_streak = max(user.get("max_streak", 0), new_streak)

    conn.execute("UPDATE users SET checkin_dates = ?, streak = ?, max_streak = ?, experience = experience + 50 WHERE id = ?",
                 (json.dumps(checkin_dates), new_streak, new_max_streak, g.current_user['id']))
    conn.commit()

    user = dict_from_row(conn.execute("SELECT * FROM users WHERE id = ?", (g.current_user['id'],)).fetchone())
    level_info = calculate_level_info(user["experience"])
    conn.execute("UPDATE users SET level = ? WHERE id = ?", (level_info["level"], g.current_user['id']))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "打卡成功！+50经验值",
        "streak": new_streak,
        "level_info": level_info,
    })


# =============================================
# 智能体 API
# =============================================

@app.route('/api/agents', methods=['GET'])
def api_agents_list():
    conn = get_db()
    agents = dicts_from_rows(conn.execute("SELECT * FROM agents WHERE is_active = 1").fetchall())
    conn.close()
    return jsonify({"success": True, "agents": agents})


@app.route('/api/agents/chat', methods=['POST'])
def api_agents_chat():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    message = data.get('message', '')
    mode = data.get('mode', 'group')
    selected_agents = data.get('agents', [])
    session_id = data.get('session_id', str(uuid.uuid4()))

    if not message:
        return jsonify({"success": False, "message": "请输入消息"}), 400

    if mode == 'single':
        agent_name = selected_agents[0] if selected_agents else 'time_manager'
        agent = AGENT_DEFINITIONS.get(agent_name, AGENT_DEFINITIONS['time_manager'])
        from agents import generate_agent_response
        response = generate_agent_response(agent_name, message)
        return jsonify({
            "success": True,
            "session_id": session_id,
            "mode": "single",
            "discussion": [{
                "agent": agent_name,
                "display_name": agent["display_name"],
                "emoji": agent["emoji"],
                "color": agent["color"],
                "content": response,
                "phase": "single",
            }],
        })

    # 群聊模式
    discussion = generate_group_discussion(message, selected_agents)

    # 保存对话记录
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    conn = get_db()
    for item in discussion:
        conn.execute('''
            INSERT INTO conversations (user_id, session_id, role, agent_name, content, mode)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, session_id, 'assistant', item.get('agent', ''), item['content'], mode))
    conn.execute('''
        INSERT INTO conversations (user_id, session_id, role, agent_name, content, mode)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, session_id, 'user', '', message, mode))
    conn.execute("UPDATE users SET ai_collaborations = ai_collaborations + 1 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "session_id": session_id,
        "mode": "group",
        "discussion": discussion,
    })


# =============================================
# 流水线 API
# =============================================

@app.route('/api/pipeline/modes', methods=['GET'])
def api_pipeline_modes():
    return jsonify({"success": True, "modes": [
        {"key": k, "name": v["name"], "icon": v["icon"], "desc": v["desc"], "phases_count": len(v["phases"])}
        for k, v in PIPELINE_MODES.items()
    ]})


@app.route('/api/pipeline/execute', methods=['POST'])
def api_pipeline_execute():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    mode = data.get('mode', '')
    user_input = data.get('input', '')
    if not mode or not user_input:
        return jsonify({"success": False, "message": "请选择模式并输入目标"}), 400

    result = execute_pipeline(mode, user_input)
    return jsonify(result)


# =============================================
# 课程作业规划 API
# =============================================

@app.route('/api/course/templates', methods=['GET'])
def api_course_templates():
    return jsonify({"success": True, "templates": [
        {"name": k, "tasks": v["tasks"], "hours": v["estimated_hours"], "difficulty": v["difficulty"]}
        for k, v in COURSE_TEMPLATES.items()
    ]})


@app.route('/api/course/plan', methods=['POST'])
def api_course_plan():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    course_name = data.get('course_name', '')
    deadline = data.get('deadline', '')
    custom_tasks = data.get('custom_tasks', None)

    if not course_name:
        return jsonify({"success": False, "message": "请选择或输入课程名称"}), 400

    result = plan_course_assignment(course_name, deadline, custom_tasks)
    return jsonify(result)


# =============================================
# 考研规划 API
# =============================================

@app.route('/api/exam/universities', methods=['GET'])
def api_universities():
    from agents import UNIVERSITIES
    return jsonify({"success": True, "universities": UNIVERSITIES})


@app.route('/api/exam/subjects', methods=['GET'])
def api_exam_subjects():
    from agents import EXAM_SUBJECTS
    return jsonify({"success": True, "subjects": [
        {"name": k, "topics": v["topics"], "weight": v["weight"]}
        for k, v in EXAM_SUBJECTS.items()
    ]})


@app.route('/api/exam/plan', methods=['POST'])
def api_exam_plan():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    target_school = data.get('school', '')
    target_major = data.get('major', '')
    exam_date = data.get('exam_date', '')
    subjects = data.get('subjects', [])

    if not target_school or not exam_date:
        return jsonify({"success": False, "message": "请选择目标院校和考试日期"}), 400

    result = plan_exam_prep(target_school, target_major, exam_date, subjects)
    return jsonify(result)


# =============================================
# 职业规划 API
# =============================================

@app.route('/api/career/positions', methods=['GET'])
def api_career_positions():
    from agents import CAREER_POSITIONS
    return jsonify({"success": True, "positions": [
        {"name": k, "skills": v["skills"], "salary": v["salary_range"], "industry": v["industry"]}
        for k, v in CAREER_POSITIONS.items()
    ]})


@app.route('/api/career/plan', methods=['POST'])
def api_career_plan():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    position = data.get('position', '')
    industry = data.get('industry', '')

    result = plan_career(position, industry)
    return jsonify(result)


# =============================================
# 拖延症分析 API
# =============================================

@app.route('/api/procrastination', methods=['GET'])
@optional_login
def api_procrastination():
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    result = analyze_procrastination(user_id)
    return jsonify(result)


# =============================================
# 成长仪表盘 API
# =============================================

@app.route('/api/growth', methods=['GET'])
@optional_login
def api_growth():
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    result = get_growth_dashboard(user_id)
    return jsonify(result)


# =============================================
# 仪表盘 API
# =============================================

@app.route('/api/dashboard', methods=['GET'])
@optional_login
def api_dashboard():
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    conn = get_db()

    user = dict_from_row(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
    all_tasks = dicts_from_rows(conn.execute(
        "SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC", (user_id,)
    ).fetchall())

    for task in all_tasks:
        if task.get("subtasks"):
            try:
                task["subtasks"] = json.loads(task["subtasks"])
            except (json.JSONDecodeError, TypeError):
                task["subtasks"] = []

    today_str = date.today().isoformat()
    today_activity = dict_from_row(conn.execute(
        "SELECT * FROM activities WHERE user_id = ? AND date = ?", (user_id, today_str)
    ).fetchone())
    conn.close()

    risk_count = {"绿色": 0, "黄色": 0, "红色": 0}
    for task in all_tasks:
        if task["status"] == "进行中":
            try:
                dl = datetime.strptime(task.get("deadline", ""), "%Y-%m-%d").date()
                remaining = (dl - date.today()).days
            except (ValueError, TypeError):
                remaining = 999
            completion_rate = task.get("completed_hours", 0) / max(task.get("estimated_hours", 1), 1)
            if remaining <= 2 or completion_rate < 0.3:
                risk_count["红色"] += 1
            elif remaining <= 7 or completion_rate < 0.6:
                risk_count["黄色"] += 1
            else:
                risk_count["绿色"] += 1

    level_info = calculate_level_info(user["experience"]) if user else calculate_level_info(0)

    in_progress = [t for t in all_tasks if t["status"] == "进行中"]
    completed = [t for t in all_tasks if t["status"] == "已完成"]

    # 检查今日是否已打卡
    checkin_dates = json.loads(user.get("checkin_dates", "[]")) if user else []
    today_checked_in = today_str in checkin_dates

    return jsonify({
        "success": True,
        "user": _format_user(user) if user else None,
        "level_info": level_info,
        "tasks": {
            "total": len(all_tasks),
            "in_progress": len(in_progress),
            "completed": len(completed),
            "delayed": len([t for t in all_tasks if t["status"] == "已延期"]),
            "recent": all_tasks[:5],
        },
        "ddl_risk": risk_count,
        "today_checked_in": today_checked_in,
        "today_activity": {
            "focus_minutes": today_activity["focus_minutes"] if today_activity else 0,
            "tasks_done": today_activity["tasks_done"] if today_activity else 0,
        },
    })


# =============================================
# 任务 API
# =============================================

@app.route('/api/tasks', methods=['GET', 'POST'])
@optional_login
def api_tasks():
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    conn = get_db()

    if request.method == 'GET':
        all_tasks = dicts_from_rows(conn.execute(
            "SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC", (user_id,)
        ).fetchall())
        for task in all_tasks:
            if task.get("subtasks"):
                try:
                    task["subtasks"] = json.loads(task["subtasks"])
                except (json.JSONDecodeError, TypeError):
                    task["subtasks"] = []
        conn.close()
        return jsonify({"success": True, "tasks": all_tasks, "total": len(all_tasks)})

    elif request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "请求数据为空"}), 400

        title = data.get("title", "")
        task_type = data.get("type", "其他")
        deadline = data.get("deadline", "")
        difficulty = data.get("difficulty", 3)
        estimated_hours = data.get("estimated_hours", 20)
        subtasks = data.get("subtasks", [])
        pipeline_mode = data.get("pipeline_mode", "")

        if not subtasks:
            subtasks = [{"title": t, "completed": False, "estimated_hours": round(estimated_hours / 5, 1)}
                        for t in ["需求分析", "设计", "实现", "测试", "文档"]]

        cursor = conn.execute('''
            INSERT INTO tasks (user_id, title, type, deadline, difficulty, estimated_hours, subtasks, pipeline_mode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, title, task_type, deadline, difficulty, estimated_hours,
              json.dumps(subtasks, ensure_ascii=False), pipeline_mode))
        new_id = cursor.lastrowid
        conn.commit()

        new_task = dict_from_row(conn.execute("SELECT * FROM tasks WHERE id = ?", (new_id,)).fetchone())
        if new_task.get("subtasks"):
            new_task["subtasks"] = json.loads(new_task["subtasks"])
        conn.close()

        return jsonify({"success": True, "task": new_task, "message": "任务创建成功"})


@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@optional_login
def api_delete_task(task_id):
    conn = get_db()
    task = dict_from_row(conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone())
    if not task:
        conn.close()
        return jsonify({"success": False, "message": "任务不存在"}), 404
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "任务已删除"})

@app.route('/api/tasks/<int:task_id>/complete', methods=['POST'])
@optional_login
def api_complete_subtask(task_id):
    data = request.get_json() or {}
    subtask_index = data.get("subtask_index", 0)

    conn = get_db()
    task = dict_from_row(conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone())
    if not task:
        conn.close()
        return jsonify({"success": False, "message": "任务不存在"}), 404

    subtasks = json.loads(task["subtasks"]) if task.get("subtasks") else []
    if 0 <= subtask_index < len(subtasks):
        subtasks[subtask_index]["completed"] = True
        completed_hours = task.get("completed_hours", 0) + subtasks[subtask_index].get("estimated_hours", 0)
    else:
        conn.close()
        return jsonify({"success": False, "message": "子任务索引无效"}), 400

    all_completed = all(s.get("completed", False) for s in subtasks)
    new_status = "已完成" if all_completed else task["status"]

    conn.execute('''
        UPDATE tasks SET subtasks = ?, completed_hours = ?, status = ?
        WHERE id = ?
    ''', (json.dumps(subtasks, ensure_ascii=False), completed_hours, new_status, task_id))

    user_id = task.get("user_id", 1)
    conn.execute("UPDATE users SET tasks_completed = tasks_completed + 1, experience = experience + 30 WHERE id = ?",
                 (user_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True, "message": "子任务完成！+30经验值",
        "subtask_completed": subtasks[subtask_index]["title"],
        "all_completed": all_completed, "new_status": new_status,
    })


# =============================================
# 社区 API
# =============================================

@app.route('/api/community/posts', methods=['GET', 'POST'])
@optional_login
def api_community_posts():
    conn = get_db()

    if request.method == 'GET':
        category = request.args.get('category', '')
        sort = request.args.get('sort', 'latest')

        query = '''
            SELECT p.*, u.username, u.avatar_url, u.level,
                   (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as comment_count
            FROM community_posts p
            LEFT JOIN users u ON p.user_id = u.id
        '''
        params = []
        if category:
            query += " WHERE p.category = ?"
            params.append(category)

        order_map = {"latest": "p.created_at DESC", "popular": "p.likes DESC", "views": "p.views DESC"}
        query += f" ORDER BY {order_map.get(sort, 'p.created_at DESC')}"

        posts = dicts_from_rows(conn.execute(query, params).fetchall())
        for post in posts:
            if post.get("tags"):
                try:
                    post["tags"] = json.loads(post["tags"])
                except (json.JSONDecodeError, TypeError):
                    post["tags"] = []
        conn.close()
        return jsonify({"success": True, "posts": posts, "total": len(posts)})

    elif request.method == 'POST':
        user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "请求数据为空"}), 400

        title = data.get('title', '').strip()
        content = data.get('content', '').strip()
        category = data.get('category', '经验分享')
        tags = data.get('tags', [])

        if not title or not content:
            conn.close()
            return jsonify({"success": False, "message": "标题和内容不能为空"}), 400

        cursor = conn.execute('''
            INSERT INTO community_posts (user_id, title, content, category, tags)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, title, content, category, json.dumps(tags, ensure_ascii=False)))
        conn.execute("UPDATE users SET experience = experience + 20 WHERE id = ?", (user_id,))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()

        return jsonify({"success": True, "message": "发布成功！+20经验值", "post_id": new_id})


@app.route('/api/community/posts/<int:post_id>', methods=['GET'])
def api_community_post_detail(post_id):
    conn = get_db()
    conn.execute("UPDATE community_posts SET views = views + 1 WHERE id = ?", (post_id,))
    post = dict_from_row(conn.execute('''
        SELECT p.*, u.username, u.avatar_url, u.level,
               (SELECT COUNT(*) FROM community_comments WHERE post_id = p.id) as comment_count
        FROM community_posts p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = ?
    ''', (post_id,)).fetchone())

    if not post:
        conn.close()
        return jsonify({"success": False, "message": "帖子不存在"}), 404

    if post.get("tags"):
        try:
            post["tags"] = json.loads(post["tags"])
        except (json.JSONDecodeError, TypeError):
            post["tags"] = []

    comments = dicts_from_rows(conn.execute('''
        SELECT c.*, u.username, u.avatar_url
        FROM community_comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ? ORDER BY c.created_at ASC
    ''', (post_id,)).fetchall())
    conn.commit()
    conn.close()

    return jsonify({"success": True, "post": post, "comments": comments})


@app.route('/api/community/posts/<int:post_id>/like', methods=['POST'])
@optional_login
def api_like_post(post_id):
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    conn = get_db()

    existing = conn.execute(
        "SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?", (post_id, user_id)
    ).fetchone()

    if existing:
        conn.execute("DELETE FROM post_likes WHERE id = ?", (existing["id"],))
        conn.execute("UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?", (post_id,))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "liked": False, "message": "已取消点赞"})

    conn.execute("INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)", (post_id, user_id))
    conn.execute("UPDATE community_posts SET likes = likes + 1 WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "liked": True, "message": "点赞成功"})


@app.route('/api/community/posts/<int:post_id>/comments', methods=['POST'])
@optional_login
def api_add_comment(post_id):
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    data = request.get_json()
    if not data or not data.get('content', '').strip():
        return jsonify({"success": False, "message": "评论内容不能为空"}), 400

    conn = get_db()
    conn.execute('''
        INSERT INTO community_comments (post_id, user_id, content)
        VALUES (?, ?, ?)
    ''', (post_id, user_id, data['content'].strip()))
    conn.execute("UPDATE users SET experience = experience + 5 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "评论成功！+5经验值"})


# =============================================
# 导出 API
# =============================================

@app.route('/api/export', methods=['POST'])
@optional_login
def api_export():
    user_id = g.current_user['id'] if hasattr(g, 'current_user') and g.current_user else 1
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "请求数据为空"}), 400

    export_type = data.get('type', 'growth_report')
    export_format = data.get('format', 'json')

    content = _generate_export_content(export_type, user_id)
    conn = get_db()
    conn.execute('''
        INSERT INTO exports (user_id, type, format) VALUES (?, ?, ?)
    ''', (user_id, export_type, export_format))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "导出成功",
        "type": export_type,
        "format": export_format,
        "content": content,
        "filename": f"timeforge_{export_type}_{date.today().isoformat()}.{export_format}",
    })


def _generate_export_content(export_type, user_id):
    conn = get_db()
    user = dict_from_row(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
    tasks = dicts_from_rows(conn.execute(
        "SELECT * FROM tasks WHERE user_id = ? ORDER BY deadline ASC", (user_id,)
    ).fetchall())
    activities = dicts_from_rows(conn.execute(
        "SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC LIMIT 30", (user_id,)
    ).fetchall())
    conn.close()

    if export_type == 'growth_report':
        level_info = calculate_level_info(user["experience"]) if user else calculate_level_info(0)
        return {
            "title": "成长报告",
            "generated_at": datetime.now().isoformat(),
            "user": {
                "username": user.get("username", ""),
                "level": level_info["level"],
                "level_name": level_info["level_name"],
                "streak": user.get("streak", 0),
                "focus_hours": user.get("focus_hours", 0),
                "tasks_completed": user.get("tasks_completed", 0),
                "ai_collaborations": user.get("ai_collaborations", 0),
            },
            "summary": f"已完成{user.get('tasks_completed', 0)}个任务，累计专注{user.get('focus_hours', 0)}小时",
        }
    elif export_type == 'study_report':
        return {
            "title": "学习报告",
            "generated_at": datetime.now().isoformat(),
            "tasks": [{"title": t["title"], "status": t["status"], "deadline": t["deadline"]} for t in tasks],
            "completion_rate": round(len([t for t in tasks if t["status"] == "已完成"]) / max(len(tasks), 1) * 100, 1),
            "weekly_activity": activities[:7],
        }
    elif export_type == 'career_report':
        return {
            "title": "职业规划报告",
            "generated_at": datetime.now().isoformat(),
            "recommendation": "基于你的技能分析，建议优先提升核心编程能力",
            "skill_gaps": [],
            "roadmap": [],
        }
    else:
        return {"title": "报告", "generated_at": datetime.now().isoformat()}


# =============================================
# 演示/Demo API
# =============================================

@app.route('/api/demo/quick-experience', methods=['POST'])
def api_demo_quick_experience():
    data = request.get_json() or {}
    scenario = data.get('scenario', 'dashboard')

    demo_results = {
        "dashboard": {
            "message": "欢迎来到TimeForge X！我是你的AI助手，这是你的个人仪表盘。\n\n📊 当前状态：\n• 进行中任务：3个\n• DDL风险等级：黄色\n• 连续打卡：12天\n\n💡 建议：先查看DDL风险预测，优先处理紧急任务。",
            "quick_actions": ["查看任务", "AI拆解任务", "流水线规划"],
        },
        "agents": {
            "message": "你好！我是你的AI成长团队。\n\n我们这里有：\n⏰ 时间管理师\n📚 学习规划师\n🎓 考研导师\n💼 职业顾问\n🧠 心理教练\n📊 效率分析师\n\n请告诉我你的目标，我们会为你提供团队协作方案！",
            "quick_actions": ["开始群聊讨论", "选择单个AI", "查看流水线"],
        },
        "pipeline": {
            "message": "智能流水线模式已就绪！\n\n支持以下模式：\n📄 论文模式\n💻 课程设计模式\n🏆 竞赛模式\n🎓 考研模式\n🚀 创业模式\n\n选择一种模式，AI将自动完成全流程规划。",
            "quick_actions": ["试试论文模式", "试试考研模式", "试试竞赛模式"],
        },
        "course": {
            "message": "课程作业规划助手已就绪！\n\n支持：\n• 软件工程实验报告\n• 数据库课程设计\n• 操作系统实验\n• 数据结构大作业\n\n输入课程名称和截止日期，AI自动拆解任务并生成甘特图。",
            "quick_actions": ["规划数据库课设", "规划数据结构大作业"],
        },
        "exam": {
            "message": "考研规划中心已就绪！\n\n功能包括：\n• 考研倒计时\n• 院校分析\n• 科目规划\n• 录取概率预测\n\n输入目标院校和专业，获得完整备考方案。",
            "quick_actions": ["分析清华计算机", "规划考研每日任务"],
        },
        "career": {
            "message": "职业规划中心已就绪！\n\n功能包括：\n• 职业测评\n• 简历优化\n• 模拟面试\n• 薪资预测\n\n选择目标岗位，获得完整职业规划。",
            "quick_actions": ["分析前端开发", "模拟技术面试"],
        },
    }

    result = demo_results.get(scenario, demo_results["dashboard"])
    return jsonify({"success": True, "scenario": scenario, **result})


# =============================================
# 辅助函数
# =============================================

def _format_user(user):
    if not user:
        return None
    level_info = calculate_level_info(user["experience"])
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "avatar_url": user.get("avatar_url", ""),
        "bio": user.get("bio", ""),
        "level": level_info["level"],
        "level_name": level_info["level_name"],
        "experience": user["experience"],
        "exp_percentage": level_info["exp_percentage"],
        "next_level_exp": level_info["next_level_exp"],
        "streak": user.get("streak", 0),
        "max_streak": user.get("max_streak", 0),
        "focus_hours": user.get("focus_hours", 0),
        "tasks_completed": user.get("tasks_completed", 0),
        "ai_collaborations": user.get("ai_collaborations", 0),
        "created_at": user.get("created_at", ""),
    }


# =============================================
# 错误处理
# =============================================
@app.errorhandler(404)
def not_found(error):
    return jsonify({"success": False, "message": "路由不存在"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"success": False, "message": "服务器内部错误"}), 500


# =============================================
# 启动入口
# =============================================
if __name__ == '__main__':
    print("=" * 60)
    print("  TimeForge X —— AI人生规划指挥中心")
    print("  启动地址: http://localhost:5000")
    print("  仪表盘:   http://localhost:5000/")
    print("  演示模式: http://localhost:5000/demo")
    print("=" * 60)
    app.run(debug=True, host=Config.HOST, port=Config.PORT)