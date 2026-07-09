import sys
import os
sys.path.insert(0, '.')

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_result.txt')
print(f"Result path: {result_path}")

with open(result_path, "w", encoding="utf-8") as f:
    f.write("Test 123\n")
    f.write("Hello World\n")

print("File written successfully")

with open(result_path, "r", encoding="utf-8") as f:
    content = f.read()
    print(f"Content: {content}")
