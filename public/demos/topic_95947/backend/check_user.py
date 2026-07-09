import sqlite3

conn = sqlite3.connect('business_automation.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name, email FROM merchants")
users = cursor.fetchall()
print("现有用户:")
for user in users:
    print(f"  ID: {user[0]}, 名称: {user[1]}, 邮箱: {user[2]}")

conn.close()