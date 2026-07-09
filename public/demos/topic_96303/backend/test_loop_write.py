import sys
import os

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'loop_write_test.txt')

try:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write("Start\n")
        f.flush()
        
        for i in range(3):
            f.write(f"Line {i}\n")
            f.flush()
        
        f.write("End\n")
    
    print("Done!")
except Exception as e:
    print(f"Error: {e}")
