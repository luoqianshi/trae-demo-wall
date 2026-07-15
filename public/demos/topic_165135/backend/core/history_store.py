import os
import json
import sqlite3
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mirror_spirit.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            diary_text TEXT,
            ideal_self TEXT,
            actual_self TEXT,
            discrepancy_score REAL,
            location_keyword TEXT,
            suggested_action TEXT,
            emotion_dimensions TEXT,
            strengths TEXT,
            growth_areas TEXT,
            mirror_insight TEXT,
            personality_traits TEXT,
            gps_latitude REAL,
            gps_longitude REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            role TEXT,
            content TEXT,
            insight TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT DEFAULT 'default_user',
            date TEXT UNIQUE,
            avg_discrepancy_score REAL,
            avg_emotion_dimensions TEXT,
            top_location_keyword TEXT,
            summary_text TEXT,
            mirror_insight TEXT,
            suggestions TEXT,
            analysis_count INTEGER DEFAULT 0,
            chat_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS push_notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT DEFAULT 'default_user',
            type TEXT,
            title TEXT,
            content TEXT,
            insight TEXT,
            is_read INTEGER DEFAULT 0,
            priority TEXT DEFAULT 'normal',
            related_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE DEFAULT 'default_user',
            push_enabled INTEGER DEFAULT 1,
            morning_push_time TEXT DEFAULT '08:00',
            evening_push_time TEXT DEFAULT '22:00',
            quiet_hours_start TEXT DEFAULT '23:00',
            quiet_hours_end TEXT DEFAULT '07:00',
            max_daily_pushes INTEGER DEFAULT 5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()

def save_analysis_record(analysis: dict, diary_text: str, lat: float = None, lng: float = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO analysis_records 
        (diary_text, ideal_self, actual_self, discrepancy_score, location_keyword, 
         suggested_action, emotion_dimensions, strengths, growth_areas, 
         mirror_insight, personality_traits, gps_latitude, gps_longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        diary_text,
        analysis.get("ideal_self", ""),
        analysis.get("actual_self", ""),
        analysis.get("discrepancy_score", 0),
        analysis.get("location_keyword", ""),
        analysis.get("suggested_action", ""),
        json.dumps(analysis.get("emotion_dimensions", {})),
        json.dumps(analysis.get("strengths", [])),
        json.dumps(analysis.get("growth_areas", [])),
        analysis.get("mirror_insight", ""),
        json.dumps(analysis.get("personality_traits", [])),
        lat,
        lng
    ))
    
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return record_id

def get_analysis_history(limit: int = 30, days: int = None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT * FROM analysis_records ORDER BY created_at DESC LIMIT ?"
    params = [limit]
    
    if days:
        query = "SELECT * FROM analysis_records WHERE created_at >= ? ORDER BY created_at DESC LIMIT ?"
        since = datetime.now() - timedelta(days=days)
        params = [since.isoformat(), limit]
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    records = []
    for row in rows:
        record = dict(row)
        record["emotion_dimensions"] = json.loads(record.get("emotion_dimensions", "{}"))
        record["strengths"] = json.loads(record.get("strengths", "[]"))
        record["growth_areas"] = json.loads(record.get("growth_areas", "[]"))
        record["personality_traits"] = json.loads(record.get("personality_traits", "[]"))
        records.append(record)
    
    conn.close()
    return records

def get_trend_data(days: int = 7):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    since = datetime.now() - timedelta(days=days)
    
    cursor.execute("""
        SELECT DATE(created_at) as date, AVG(discrepancy_score) as avg_score, COUNT(*) as count
        FROM analysis_records 
        WHERE created_at >= ?
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    """, (since.isoformat(),))
    
    rows = cursor.fetchall()
    conn.close()
    
    dates = []
    scores = []
    
    for i in range(days):
        date = (datetime.now() - timedelta(days=days-1-i)).strftime("%Y-%m-%d")
        dates.append(date)
        found = False
        for row in rows:
            if row[0] == date:
                scores.append(round(row[1], 1))
                found = True
                break
        if not found:
            scores.append(None)
    
    return {"dates": dates, "scores": scores}

def save_chat_message(user_id: str, role: str, content: str, insight: str = None):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO chat_messages (user_id, role, content, insight)
        VALUES (?, ?, ?, ?)
    """, (user_id, role, content, insight))
    
    conn.commit()
    conn.close()

def get_chat_history(user_id: str, limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT * FROM chat_messages 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    """, (user_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    messages = []
    for row in reversed(rows):
        messages.append({
            "role": row["role"],
            "content": row["content"],
            "insight": row["insight"],
            "created_at": row["created_at"]
        })
    
    return messages

def get_overall_stats():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM analysis_records")
    total_analyses = cursor.fetchone()[0]
    
    cursor.execute("SELECT AVG(discrepancy_score) FROM analysis_records WHERE created_at >= date('now', '-7 days')")
    avg_week = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT AVG(discrepancy_score) FROM analysis_records WHERE created_at >= date('now', '-30 days')")
    avg_month = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM chat_messages")
    total_chats = cursor.fetchone()[0]
    
    cursor.execute("""
        SELECT location_keyword, COUNT(*) as cnt 
        FROM analysis_records 
        GROUP BY location_keyword 
        ORDER BY cnt DESC 
        LIMIT 5
    """)
    top_locations = [{"keyword": row[0], "count": row[1]} for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_analyses": total_analyses,
        "avg_week_score": round(avg_week, 1),
        "avg_month_score": round(avg_month, 1),
        "total_chats": total_chats,
        "top_locations": top_locations
    }

def save_daily_summary(user_id: str, date_str: str, summary: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT OR REPLACE INTO daily_summaries
        (user_id, date, avg_discrepancy_score, avg_emotion_dimensions,
         top_location_keyword, summary_text, mirror_insight, suggestions,
         analysis_count, chat_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user_id,
        date_str,
        summary.get("avg_discrepancy_score", 0),
        json.dumps(summary.get("avg_emotion_dimensions", {})),
        summary.get("top_location_keyword", ""),
        summary.get("summary_text", ""),
        summary.get("mirror_insight", ""),
        json.dumps(summary.get("suggestions", [])),
        summary.get("analysis_count", 0),
        summary.get("chat_count", 0),
    ))

    conn.commit()
    conn.close()

def get_daily_summaries(user_id: str = "default_user", limit: int = 30):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM daily_summaries
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT ?
    """, (user_id, limit))

    rows = cursor.fetchall()
    conn.close()

    summaries = []
    for row in rows:
        record = dict(row)
        record["avg_emotion_dimensions"] = json.loads(record.get("avg_emotion_dimensions", "{}"))
        record["suggestions"] = json.loads(record.get("suggestions", "[]"))
        summaries.append(record)

    return summaries

def get_daily_summary_by_date(user_id: str, date_str: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM daily_summaries
        WHERE user_id = ? AND date = ?
    """, (user_id, date_str))

    row = cursor.fetchone()
    conn.close()

    if row:
        record = dict(row)
        record["avg_emotion_dimensions"] = json.loads(record.get("avg_emotion_dimensions", "{}"))
        record["suggestions"] = json.loads(record.get("suggestions", "[]"))
        return record
    return None

def create_push_notification(user_id: str, notif_type: str, title: str,
                           content: str, insight: str = "",
                           priority: str = "normal", related_date: str = ""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO push_notifications
        (user_id, type, title, content, insight, priority, related_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_id, notif_type, title, content, insight, priority, related_date))

    notif_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return notif_id

def get_push_notifications(user_id: str = "default_user", limit: int = 50, unread_only: bool = False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM push_notifications WHERE user_id = ?"
    params = [user_id]

    if unread_only:
        query += " AND is_read = 0"

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

def get_unread_count(user_id: str = "default_user"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT COUNT(*) FROM push_notifications
        WHERE user_id = ? AND is_read = 0
    """, (user_id,))

    count = cursor.fetchone()[0]
    conn.close()
    return count

def mark_notification_read(notif_id: int, user_id: str = "default_user"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE push_notifications SET is_read = 1
        WHERE id = ? AND user_id = ?
    """, (notif_id, user_id))

    conn.commit()
    conn.close()

def mark_all_notifications_read(user_id: str = "default_user"):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE push_notifications SET is_read = 1
        WHERE user_id = ? AND is_read = 0
    """, (user_id,))

    conn.commit()
    conn.close()

def get_user_settings(user_id: str = "default_user"):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM user_settings WHERE user_id = ?
    """, (user_id,))

    row = cursor.fetchone()

    if not row:
        cursor.execute("""
            INSERT INTO user_settings (user_id) VALUES (?)
        """, (user_id,))
        conn.commit()

        cursor.execute("""
            SELECT * FROM user_settings WHERE user_id = ?
        """, (user_id,))
        row = cursor.fetchone()

    conn.close()
    return dict(row)

def update_user_settings(user_id: str, settings: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    fields = []
    values = []
    for key in ["push_enabled", "morning_push_time", "evening_push_time",
                "quiet_hours_start", "quiet_hours_end", "max_daily_pushes"]:
        if key in settings:
            fields.append(f"{key} = ?")
            values.append(settings[key])

    if fields:
        values.append(user_id)
        query = f"UPDATE user_settings SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
        cursor.execute(query, values)
        conn.commit()

    conn.close()

init_db()
