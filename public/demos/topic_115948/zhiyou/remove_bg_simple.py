import os
from PIL import Image

def remove_background(input_path, output_path, threshold=30):
    img = Image.open(input_path).convert('RGBA')
    data = img.getdata()
    
    new_data = []
    for item in data:
        r, g, b, a = item
        if r > 220 and g > 220 and b > 220:
            diff_r = abs(r - 255)
            diff_g = abs(g - 255)
            diff_b = abs(b - 255)
            if diff_r < threshold and diff_g < threshold and diff_b < threshold:
                new_data.append((255, 255, 255, 0))
            else:
                new_data.append(item)
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    img.save(output_path)

def process_images(input_dir, output_dir, threshold=30):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for filename in os.listdir(input_dir):
        if filename.endswith('.jpg') or filename.endswith('.png'):
            input_path = os.path.join(input_dir, filename)
            output_filename = os.path.splitext(filename)[0] + '.png'
            output_path = os.path.join(output_dir, output_filename)
            
            try:
                remove_background(input_path, output_path, threshold)
                print(f"处理完成: {filename}")
            except Exception as e:
                print(f"处理失败 {filename}: {e}")

base_dir = '/Users/shian/trae/zhiyou-ui/q-version'

process_images(os.path.join(base_dir, 'hair'), '/Users/shian/trae/zhiyou/src/assets/q-version/hair')
process_images(os.path.join(base_dir, 'face'), '/Users/shian/trae/zhiyou/src/assets/q-version/face')
process_images(os.path.join(base_dir, 'clothing'), '/Users/shian/trae/zhiyou/src/assets/q-version/clothing')

print("所有图片处理完成！")