import os
import json
import aiosqlite
from datetime import datetime
from typing import Optional, List, Dict

DB_PATH = "data/app.db"

class LocalStorage:
    def __init__(self):
        self.db_path = DB_PATH
        self._ensure_db_exists()
    
    def _ensure_db_exists(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
    
    async def init_tables(self):
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(20) DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            ''')
            await conn.execute('''
                CREATE TABLE IF NOT EXISTS student_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    encrypted_data TEXT NOT NULL,
                    file_name VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            await conn.commit()
    
    async def create_user(self, username: str, password_hash: str, role: str = 'user') -> int:
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                (username, password_hash, role)
            )
            await conn.commit()
            return cursor.lastrowid
    
    async def get_user_by_username(self, username: str) -> Optional[Dict]:
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(
                'SELECT id, username, password_hash, role, created_at, last_login FROM users WHERE username = ?',
                (username,)
            )
            row = await cursor.fetchone()
            if row:
                return {
                    'id': row[0],
                    'username': row[1],
                    'password_hash': row[2],
                    'role': row[3],
                    'created_at': row[4],
                    'last_login': row[5]
                }
            return None
    
    async def update_last_login(self, user_id: int):
        async with aiosqlite.connect(self.db_path) as conn:
            await conn.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                (user_id,)
            )
            await conn.commit()
    
    async def get_admin_count(self) -> int:
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(
                'SELECT COUNT(*) FROM users WHERE role = ?',
                ('admin',)
            )
            row = await cursor.fetchone()
            return row[0] if row else 0
    
    async def save_student_data(self, user_id: int, encrypted_data: str, file_name: str) -> int:
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(
                'INSERT INTO student_data (user_id, encrypted_data, file_name) VALUES (?, ?, ?)',
                (user_id, encrypted_data, file_name)
            )
            await conn.commit()
            return cursor.lastrowid
    
    async def get_student_data_list(self, user_id: int) -> List[Dict]:
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(
                'SELECT id, file_name, created_at FROM student_data WHERE user_id = ? ORDER BY created_at DESC',
                (user_id,)
            )
            rows = await cursor.fetchall()
            return [{
                'id': row[0],
                'file_name': row[1],
                'created_at': row[2]
            } for row in rows]
    
    async def get_student_data(self, record_id: int, user_id: int) -> Optional[Dict]:
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(
                'SELECT id, encrypted_data, file_name, created_at FROM student_data WHERE id = ? AND user_id = ?',
                (record_id, user_id)
            )
            row = await cursor.fetchone()
            if row:
                return {
                    'id': row[0],
                    'encrypted_data': row[1],
                    'file_name': row[2],
                    'created_at': row[3]
                }
            return None
    
    async def delete_student_data(self, record_id: int, user_id: int) -> bool:
        async with aiosqlite.connect(self.db_path) as conn:
            cursor = await conn.execute(
                'DELETE FROM student_data WHERE id = ? AND user_id = ?',
                (record_id, user_id)
            )
            await conn.commit()
            return cursor.rowcount > 0

local_storage = LocalStorage()