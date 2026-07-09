import sqlite3

conn = sqlite3.connect('business_automation.db')
cursor = conn.cursor()

cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [row[0] for row in cursor.fetchall()]
print("Tables:", tables)

cursor.execute("PRAGMA table_info(dishes)")
columns = [row[1] for row in cursor.fetchall()]
print("Dishes columns:", columns)

if 'category_id' not in columns:
    cursor.execute("ALTER TABLE dishes ADD COLUMN category_id TEXT")
    conn.commit()
    print("Added category_id column")

cursor.execute("PRAGMA table_info(dishes)")
columns = [row[1] for row in cursor.fetchall()]
print("Dishes columns after:", columns)

conn.close()