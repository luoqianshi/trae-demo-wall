import sqlite3
import os
from contextlib import contextmanager
from valueledger.config import DB_PATH, DATA_DIR
from valueledger.server.utils import hash_password, get_now


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'usr',
                status TEXT NOT NULL DEFAULT 'active',
                ip_address TEXT,
                mac_address TEXT,
                created_at TIMESTAMP NOT NULL
            )
        """)

        cursor.execute("PRAGMA table_info(users)")
        cols = [row[1] for row in cursor.fetchall()]
        if "status" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                created_by INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                assignee_id INTEGER NOT NULL,
                created_by INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'todo',
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (assignee_id) REFERENCES users(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS code_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                code_content TEXT NOT NULL,
                ai_score FLOAT,
                ai_comment TEXT,
                final_score FLOAT,
                final_comment TEXT,
                code_hash TEXT NOT NULL,
                is_modified BOOLEAN NOT NULL DEFAULT 0,
                submitted_at TIMESTAMP NOT NULL,
                confirmed_at TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)

        conn.commit()


@contextmanager
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def create_user(username, password, ip_address, mac_address):
    hashed_pwd = hash_password(password)
    now = get_now()

    with get_db_connection() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) as count FROM users")
        count = cursor.fetchone()["count"]
        role = "boss" if count == 0 else "usr"

        cursor.execute("""
            INSERT INTO users (username, password, role, status, ip_address, mac_address, created_at)
            VALUES (?, ?, ?, 'active', ?, ?, ?)
        """, (username, hashed_pwd, role, ip_address, mac_address, now))

        user_id = cursor.lastrowid
        conn.commit()
        return get_user_by_id(user_id)


def get_user_by_username(username):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_id(user_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def verify_user(username, password):
    hashed_pwd = hash_password(password)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, hashed_pwd))
        row = cursor.fetchone()
        if not row:
            return None
        user = dict(row)
        if user.get("status") == "dismissed":
            return None
        return user


def update_user_role(user_id, new_role):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
        conn.commit()
        return get_user_by_id(user_id)


def set_user_status(user_id, status):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET status = ? WHERE id = ?", (status, user_id))
        conn.commit()
        return get_user_by_id(user_id)


def get_all_users():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users ORDER BY created_at")
        return [dict(row) for row in cursor.fetchall()]


def create_project(name, description, created_by):
    now = get_now()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO projects (name, description, created_by, created_at, status)
            VALUES (?, ?, ?, ?, 'active')
        """, (name, description, created_by, now))
        project_id = cursor.lastrowid
        conn.commit()
        return get_project_by_id(project_id)


def get_project_by_id(project_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_all_projects():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
        projects = [dict(row) for row in cursor.fetchall()]
        for p in projects:
            cursor.execute("SELECT COUNT(*) as total FROM tasks WHERE project_id = ?", (p["id"],))
            p["total_tasks"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) as done FROM tasks WHERE project_id = ? AND status = 'confirmed'", (p["id"],))
            p["completed_tasks"] = cursor.fetchone()["done"]
            if p["total_tasks"] > 0:
                p["progress"] = int(p["completed_tasks"] / p["total_tasks"] * 100)
            else:
                p["progress"] = 0
        return projects


def create_task(project_id, title, description, assignee_id, created_by):
    now = get_now()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (project_id, title, description, assignee_id, created_by, status, created_at)
            VALUES (?, ?, ?, ?, ?, 'todo', ?)
        """, (project_id, title, description, assignee_id, created_by, now))
        task_id = cursor.lastrowid
        conn.commit()
        return get_task_by_id(task_id)


def get_task_by_id(task_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, p.name as project_name, u.username as assignee_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE t.id = ?
        """, (task_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_project_tasks(project_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, u.username as assignee_name
            FROM tasks t
            LEFT JOIN users u ON t.assignee_id = u.id
            WHERE t.project_id = ?
            ORDER BY t.created_at DESC
        """, (project_id,))
        return [dict(row) for row in cursor.fetchall()]


def get_user_tasks(user_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT t.*, p.name as project_name
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.assignee_id = ?
            ORDER BY t.created_at DESC
        """, (user_id,))
        return [dict(row) for row in cursor.fetchall()]


def update_task_status(task_id, status):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (status, task_id))
        conn.commit()
        return get_task_by_id(task_id)


def create_code_submission(task_id, user_id, filename, code_content, ai_score, ai_comment, code_hash):
    now = get_now()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO code_submissions 
            (task_id, user_id, filename, code_content, ai_score, ai_comment, code_hash, is_modified, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (task_id, user_id, filename, code_content, ai_score, ai_comment, code_hash, now))
        sub_id = cursor.lastrowid
        cursor.execute("UPDATE tasks SET status = 'submitted' WHERE id = ?", (task_id,))
        conn.commit()
        return get_submission_by_id(sub_id)


def get_submission_by_id(sub_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, t.title as task_title, u.username as username
            FROM code_submissions s
            LEFT JOIN tasks t ON s.task_id = t.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        """, (sub_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def confirm_submission(sub_id, final_score, final_comment):
    now = get_now()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        sub = get_submission_by_id(sub_id)
        is_modified = (abs(final_score - sub["ai_score"]) > 0.1) or (final_comment.strip() != sub["ai_comment"].strip())
        cursor.execute("""
            UPDATE code_submissions 
            SET final_score = ?, final_comment = ?, is_modified = ?, confirmed_at = ?
            WHERE id = ?
        """, (final_score, final_comment, 1 if is_modified else 0, now, sub_id))
        cursor.execute("UPDATE tasks SET status = 'confirmed' WHERE id = ?", (sub["task_id"],))
        conn.commit()
        return get_submission_by_id(sub_id)


def get_user_submissions(user_id):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.*, t.title as task_title, p.name as project_name
            FROM code_submissions s
            LEFT JOIN tasks t ON s.task_id = t.id
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE s.user_id = ?
            ORDER BY s.submitted_at DESC
        """, (user_id,))
        return [dict(row) for row in cursor.fetchall()]


def update_user_password(user_id, new_password):
    hashed_pwd = hash_password(new_password)
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (hashed_pwd, user_id))
        conn.commit()
        return get_user_by_id(user_id)


def change_password(user_id, old_password, new_password):
    user = get_user_by_id(user_id)
    if not user:
        return False, "用户不存在"
    if hash_password(old_password) != user["password"]:
        return False, "旧密码错误"
    update_user_password(user_id, new_password)
    return True, "密码修改成功"


def get_all_contributions():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                u.id, u.username, u.role, u.status,
                COUNT(s.id) as submission_count,
                AVG(COALESCE(s.final_score, s.ai_score)) as avg_score,
                COUNT(CASE WHEN t.status = 'confirmed' THEN 1 END) as completed_tasks
            FROM users u
            LEFT JOIN tasks t ON t.assignee_id = u.id
            LEFT JOIN code_submissions s ON s.user_id = u.id AND s.confirmed_at IS NOT NULL
            WHERE u.role = 'usr' AND u.status = 'active'
            GROUP BY u.id
            ORDER BY COALESCE(avg_score, 0) DESC, submission_count DESC
        """)
        return [dict(row) for row in cursor.fetchall()]


def create_session(token, user_id):
    now = get_now()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", (token, user_id, now))
        conn.commit()


def get_user_by_token(token):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT u.* FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ?
        """, (token,))
        row = cursor.fetchone()
        return dict(row) if row else None


def has_users():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM users")
        row = cursor.fetchone()
        return row["count"] > 0
