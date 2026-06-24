import os

files = [
    'D:\\workspace\\gaosan-9ke-1.js',
    'D:\\workspace\\gaosan-9ke-2.js'
]

all_content = []
for fpath in files:
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if content.endswith(','):
                content = content[:-1]
            all_content.append(content)
        print(f"读取: {fpath} ({len(content)} 字符)")
    else:
        print(f"文件不存在: {fpath}")

combined = "'高三': {\n    " + ",\n    ".join(all_content) + "\n}"

output_path = 'D:\\workspace\\gaosan-complete.js'
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(combined)

print(f"\n合并完成! 文件大小: {len(combined)} 字符")
print(f"文件路径: {output_path}")
