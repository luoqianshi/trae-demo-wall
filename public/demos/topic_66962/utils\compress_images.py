"""
再次压缩 - 更激进参数确保 < 2MB
"""
import os
from PIL import Image

root = os.path.join(os.path.dirname(__file__), '..')
lessons_dir = os.path.join(root, 'images', 'lessons')
images_dir = os.path.join(root, 'images')

total_before = 0
total_after = 0

# 1. 课程图：600px, quality 40
print("=== 课程背景图 ===")
if os.path.exists(lessons_dir):
    for fname in sorted(os.listdir(lessons_dir)):
        if not fname.lower().endswith(('.jpg', '.jpeg')):
            continue
        fpath = os.path.join(lessons_dir, fname)
        before = os.path.getsize(fpath)
        total_before += before
        img = Image.open(fpath)
        if img.mode != 'RGB': img = img.convert('RGB')
        w, h = img.size
        if w > 600:
            ratio = 600 / w
            img = img.resize((600, int(h * ratio)), Image.LANCZOS)
        img.save(fpath, 'JPEG', quality=40, optimize=True)
        after = os.path.getsize(fpath)
        total_after += after
        print(f'  {fname}: {before//1024}KB → {after//1024}KB')

# 2. 装饰图：150px, 保持格式
print("\n=== 装饰图 ===")
root_images = [f for f in os.listdir(images_dir) 
               if f.lower().endswith(('.jpg', '.jpeg', '.png')) 
               and os.path.isfile(os.path.join(images_dir, f))]
for fname in sorted(root_images):
    fpath = os.path.join(images_dir, fname)
    before = os.path.getsize(fpath)
    if before < 1024 * 10:
        continue
    total_before += before
    img = Image.open(fpath)
    w, h = img.size
    if w > 150:
        ratio = 150 / w
        img = img.resize((150, int(h * ratio)), Image.LANCZOS)
    ext = fname.lower().split('.')[-1]
    if ext in ('jpg', 'jpeg'):
        if img.mode != 'RGB': img = img.convert('RGB')
        img.save(fpath, 'JPEG', quality=60, optimize=True)
    else:
        if img.mode not in ('RGBA', 'P'): img = img.convert('RGBA')
        img.save(fpath, 'PNG', optimize=True)
    after = os.path.getsize(fpath)
    total_after += after
    print(f'  {fname}: {before//1024}KB → {after//1024}KB')

print(f'\n===== 总计 =====')
print(f'压缩前: {total_before//1024} KB → 压缩后: {total_after//1024} KB')