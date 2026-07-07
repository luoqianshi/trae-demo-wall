# -*- coding: utf-8 -*-
"""
PVZ存档管理系统
基于SQLite的存档存储与读取
"""

import os
import json
import sqlite3
from datetime import datetime


class SaveManager:
    """PVZ游戏存档管理器"""

    def __init__(self):
        self.db_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'config', 'pvz_saves.db'
        )
        self._ensure_config_dir()
        self.init_db()

    def _ensure_config_dir(self):
        """确保config目录存在"""
        config_dir = os.path.dirname(self.db_path)
        if not os.path.exists(config_dir):
            os.makedirs(config_dir, exist_ok=True)

    def _get_connection(self):
        """获取SQLite连接"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """初始化数据库表"""
        conn = self._get_connection()
        try:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS pvz_saves (
                    slot INTEGER PRIMARY KEY,
                    data TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    name TEXT NOT NULL
                )
            ''')
            conn.commit()
        finally:
            conn.close()

    def save_game(self, slot, data):
        """
        保存游戏存档

        Args:
            slot: 存档槽位 (整数)
            data: 存档数据 (字典，将被JSON序列化)

        Returns:
            dict: 保存结果
        """
        conn = self._get_connection()
        try:
            serialized = json.dumps(data, ensure_ascii=False)
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            name = data.get('name', f'存档 {slot}')

            conn.execute('''
                INSERT INTO pvz_saves (slot, data, timestamp, name)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(slot) DO UPDATE SET
                    data = excluded.data,
                    timestamp = excluded.timestamp,
                    name = excluded.name
            ''', (slot, serialized, timestamp, name))
            conn.commit()
            return {'success': True, 'slot': slot, 'timestamp': timestamp}
        except Exception as e:
            conn.rollback()
            return {'success': False, 'error': str(e)}
        finally:
            conn.close()

    def load_game(self, slot):
        """
        加载游戏存档

        Args:
            slot: 存档槽位

        Returns:
            dict: 存档数据，若不存在返回None
        """
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                'SELECT * FROM pvz_saves WHERE slot = ?', (slot,)
            )
            row = cursor.fetchone()
            if row is None:
                return None
            return {
                'slot': row['slot'],
                'data': json.loads(row['data']),
                'timestamp': row['timestamp'],
                'name': row['name']
            }
        finally:
            conn.close()

    def list_saves(self):
        """
        列出所有存档

        Returns:
            list: 存档列表
        """
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                'SELECT slot, name, timestamp FROM pvz_saves ORDER BY slot'
            )
            saves = []
            for row in cursor.fetchall():
                saves.append({
                    'slot': row['slot'],
                    'name': row['name'],
                    'timestamp': row['timestamp']
                })
            return saves
        finally:
            conn.close()

    def delete_save(self, slot):
        """
        删除存档

        Args:
            slot: 存档槽位

        Returns:
            dict: 删除结果
        """
        conn = self._get_connection()
        try:
            cursor = conn.execute(
                'DELETE FROM pvz_saves WHERE slot = ?', (slot,)
            )
            conn.commit()
            if cursor.rowcount == 0:
                return {'success': False, 'error': '存档不存在'}
            return {'success': True, 'slot': slot}
        except Exception as e:
            conn.rollback()
            return {'success': False, 'error': str(e)}
        finally:
            conn.close()
