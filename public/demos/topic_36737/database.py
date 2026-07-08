import json
import sqlite3
from typing import Any


DB_PATH = "yuecai.db"


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    if "tags" in item and isinstance(item["tags"], str):
        try:
            item["tags"] = json.loads(item["tags"])
        except json.JSONDecodeError:
            item["tags"] = []
    if "recommended_dishes" in item and isinstance(item["recommended_dishes"], str):
        try:
            item["recommended_dishes"] = json.loads(item["recommended_dishes"])
        except json.JSONDecodeError:
            item["recommended_dishes"] = []
    return item


def init_db() -> None:
    with _connect() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS dishes (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL UNIQUE,
                price INTEGER NOT NULL,
                category TEXT NOT NULL,
                tags TEXT NOT NULL,
                description TEXT NOT NULL,
                image_url TEXT NOT NULL DEFAULT '',
                features TEXT NOT NULL
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS order_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_input TEXT NOT NULL,
                recommended_dishes TEXT NOT NULL,
                total_price INTEGER NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def get_all_dishes() -> list[dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute("SELECT * FROM dishes ORDER BY id").fetchall()
    return [_row_to_dict(row) for row in rows]


def get_dish_by_id(dish_id: int) -> dict[str, Any] | None:
    with _connect() as conn:
        row = conn.execute("SELECT * FROM dishes WHERE id = ?", (dish_id,)).fetchone()
    return _row_to_dict(row) if row else None


def save_order_history(
    user_input: str, recommended_dishes: list[dict[str, Any]], total_price: int
) -> int:
    payload = json.dumps(recommended_dishes, ensure_ascii=False)
    with _connect() as conn:
        cursor = conn.execute(
            """
            INSERT INTO order_history (user_input, recommended_dishes, total_price)
            VALUES (?, ?, ?)
            """,
            (user_input, payload, total_price),
        )
        return int(cursor.lastrowid)


def get_order_history(limit: int = 20) -> list[dict[str, Any]]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM order_history ORDER BY created_at DESC, id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [_row_to_dict(row) for row in rows]
