# -*- coding: utf-8 -*-
"""
TimeForge X - 数据库模型
完整的用户系统、任务系统、多智能体、社区、导出等
"""
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'timeforge.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # =============================================
    # 用户表 - 完整认证系统
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            avatar_url TEXT DEFAULT '',
            bio TEXT DEFAULT '',
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            max_streak INTEGER DEFAULT 0,
            focus_hours REAL DEFAULT 0.0,
            tasks_completed INTEGER DEFAULT 0,
            ai_collaborations INTEGER DEFAULT 0,
            checkin_dates TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # =============================================
    # 验证码表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verification_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target TEXT NOT NULL,
            code TEXT NOT NULL,
            type TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # =============================================
    # 密码重置令牌
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMP NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 任务表 (扩展)
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            title TEXT NOT NULL,
            type TEXT NOT NULL,
            category TEXT DEFAULT '通用',
            deadline TEXT,
            status TEXT DEFAULT '进行中',
            priority TEXT DEFAULT '中',
            difficulty INTEGER DEFAULT 3,
            estimated_hours REAL DEFAULT 0.0,
            completed_hours REAL DEFAULT 0.0,
            subtasks TEXT DEFAULT '[]',
            pipeline_mode TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 活动记录表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            date TEXT NOT NULL,
            focus_minutes INTEGER DEFAULT 0,
            tasks_done INTEGER DEFAULT 0,
            ddl_risk TEXT DEFAULT '绿色',
            procrastination_index REAL DEFAULT 0,
            efficiency_score REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # =============================================
    # AI对话记录表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER DEFAULT 1,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            agent_name TEXT DEFAULT '',
            content TEXT NOT NULL,
            mode TEXT DEFAULT 'chat',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 智能体配置表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            role_description TEXT NOT NULL,
            icon TEXT DEFAULT '',
            color TEXT DEFAULT '#6366F1',
            emoji TEXT DEFAULT '🤖',
            is_active INTEGER DEFAULT 1
        )
    ''')

    # =============================================
    # 社区帖子表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            category TEXT DEFAULT '经验分享',
            tags TEXT DEFAULT '[]',
            likes INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0,
            is_featured INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 评论表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS community_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            likes INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES community_posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 点赞记录表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS post_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(post_id, user_id),
            FOREIGN KEY (post_id) REFERENCES community_posts(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 学习小组表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS study_groups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            creator_id INTEGER NOT NULL,
            member_count INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 导出记录表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS exports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            format TEXT NOT NULL,
            file_path TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 考研规划表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS exam_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_school TEXT DEFAULT '',
            target_major TEXT DEFAULT '',
            exam_date TEXT DEFAULT '',
            subjects TEXT DEFAULT '[]',
            daily_hours REAL DEFAULT 8.0,
            progress REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 职业规划表
    # =============================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS career_plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            target_position TEXT DEFAULT '',
            target_industry TEXT DEFAULT '',
            skills TEXT DEFAULT '[]',
            skill_gaps TEXT DEFAULT '[]',
            roadmap TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')

    # =============================================
    # 初始化智能体
    # =============================================
    agents_data = [
        ('time_manager', '时间管理师', '专业的时间管理专家，帮助用户合理规划时间，提高效率', '⏰', '#6366F1', '⏰'),
        ('study_planner', '学习规划师', '学习路径设计专家，根据目标制定科学的学习计划', '📚', '#10B981', '📚'),
        ('exam_mentor', '考研导师', '考研规划与辅导专家，提供院校分析和备考策略', '🎓', '#F59E0B', '🎓'),
        ('career_advisor', '职业顾问', '职业发展规划专家，提供行业洞察和职业建议', '💼', '#3B82F6', '💼'),
        ('psych_coach', '心理教练', '积极心理学专家，帮助克服拖延、焦虑和压力', '🧠', '#EC4899', '🧠'),
        ('efficiency_analyst', '效率分析师', '数据分析专家，通过数据洞察提升学习和工作效率', '📊', '#8B5CF6', '📊'),
        ('project_manager', '项目经理', '项目管理专家，帮助分解任务、跟踪进度、管理风险', '📋', '#14B8A6', '📋'),
        ('resume_advisor', '简历顾问', '简历优化专家，帮助打造专业简历，提升求职竞争力', '📝', '#F97316', '📝'),
        ('interviewer', '面试官', '模拟面试专家，提供真实的面试场景和反馈建议', '🎤', '#EF4444', '🎤'),
        ('startup_mentor', '创业导师', '创业指导专家，提供商业模式分析和创业建议', '🚀', '#06B6D4', '🚀'),
    ]
    cursor.executemany('''
        INSERT OR IGNORE INTO agents (name, display_name, role_description, icon, color, emoji)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', agents_data)

    conn.commit()
    conn.close()


def dict_from_row(row):
    if row is None:
        return None
    return dict(row)


def dicts_from_rows(rows):
    return [dict(row) for row in rows]