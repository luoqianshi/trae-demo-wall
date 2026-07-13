import os
from rembg import remove
from PIL import Image

def process_images(input_dir, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for filename in os.listdir(input_dir):
        if filename.endswith('.jpg') or filename.endswith('.png'):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename)
            
            try:
                with open(input_path, 'rb') as i:
                    with open(output_path, 'wb') as o:
                        input_image = i.read()
                        output_image = remove(input_image)
                        o.write(output_image)
                print(f"处理完成: {filename}")
            except Exception as e:
                print(f"处理失败 {filename}: {e}")

base_dir = '/Users/shian/trae/zhiyou-ui/q-version'

process_images(os.path.join(base_dir, 'hair'), '/Users/shian/trae/zhiyou/src/assets/q-version/hair')
process_images(os.path.join(base_dir, 'face'), '/Users/shian/trae/zhiyou/src/assets/q-version/face')
process_images(os.path.join(base_dir, 'clothing'), '/Users/shian/trae/zhiyou/src/assets/q-version/clothing')

print("所有图片处理完成！")
