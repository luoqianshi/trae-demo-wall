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

data = [
    ["初一1班", "张三", "2026001", 85, 92, 88],
    ["初一1班", "张三", "2026001", 85, 92, 88],
    ["初一1班", "李四", "2026002", 78, 85, 90],
    ["初一2班", "王五", "2026003", 90, 88, 92],
    ["初一2班", "张三", "2026001", 82, 79, 85],
]

file1 = create_test_file("single_test.xlsx", data, headers)

print("测试文件创建成功")
print(f"文件: {file1}")
print(f