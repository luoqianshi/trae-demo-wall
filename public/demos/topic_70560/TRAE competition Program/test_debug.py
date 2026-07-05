import requests
import openpyxl
import os

TEST_DIR = "test_data"
os.makedirs(TEST_DIR, exist_ok=True)

def create_test_file(filename, data, headers):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(headers)
    for row in data:
        ws.append(row)
    filepath = os.path.join(TEST_DIR, filename)
    wb.save(filepath)
    return filepath

headers = ["班级", "姓名", "学号", "语文", "数学", "英语"]

data1 = [
    ["初一1班", "张三", "2026001", 85, 92, 88],
    ["初一1班", "张三", "2026001", 85, 92, 88],
]

file1 = create_test_file("test1.xlsx", data1, headers)

url = "http://localhost:8000/api/match/merge"
files = [
    ('files', open(file1, 'rb')),
    ('files', open(file1, 'rb')),
]

response = requests.post(url, files=files)
print(f"状态码: {response.status_code}")
print(f"完整响应: {response.json()}")

try:
    os.remove(file1)
except:
    pass