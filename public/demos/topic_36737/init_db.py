import json
from pathlib import Path

import database


def main() -> None:
    database.init_db()
    dishes_path = Path(__file__).with_name("dishes.json")
    dishes = json.loads(dishes_path.read_text(encoding="utf-8"))

    inserted = 0
    with database._connect() as conn:
        for dish in dishes:
            cursor = conn.execute(
                """
                INSERT OR IGNORE INTO dishes
                    (id, name, price, category, tags, description, image_url, features)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    dish["id"],
                    dish["name"],
                    dish["price"],
                    dish["category"],
                    json.dumps(dish["tags"], ensure_ascii=False),
                    dish["description"],
                    dish.get("image_url", ""),
                    dish["features"],
                ),
            )
            inserted += cursor.rowcount

    print(f"Initialized {inserted} dishes")


if __name__ == "__main__":
    main()
