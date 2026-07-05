from PIL import Image, ImageDraw
import os, math, random

ASSET_DIR = "assets"
os.makedirs(ASSET_DIR, exist_ok=True)

# 调色板：宋代水墨 + 工笔重彩
PALETTE = {
    'sky_top': (70, 85, 105),
    'sky_bot': (160, 175, 190),
    'ground': (95, 80, 65),
    'ground_light': (120, 105, 88),
    'wood': (140, 65, 55),
    'wood_dark': (90, 40, 35),
    'roof': (75, 55, 45),
    'lantern': (210, 60, 50),
    'paper': (245, 235, 215),
    'hero_robe': (75, 120, 110),
    'hero_robe_dark': (45, 80, 75),
    'skin': (235, 195, 165),
    'hair': (35, 30, 28),
    'sword': (180, 185, 190),
    'civ_m': (130, 125, 115),
    'civ_f': (185, 105, 115),
    'merchant': (165, 100, 45),
    'yayi': (40, 45, 55),
    'yayi_hat': (25, 25, 30),
    'jinjun': (145, 45, 45),
    'gold': (240, 190, 60),
    'ink': (40, 40, 45),
    'blood': (200, 45, 55),
}

def px(draw, x, y, color, size=1):
    draw.rectangle([x, y, x+size-1, y+size-1], fill=color)

def draw_rect(draw, x, y, w, h, color):
    draw.rectangle([x, y, x+w-1, y+h-1], fill=color)

def draw_grad_bg(img, c1, c2):
    w, h = img.size
    for y in range(h):
        t = y / h
        r = int(c1[0] * (1-t) + c2[0] * t)
        g = int(c1[1] * (1-t) + c2[1] * t)
        b = int(c1[2] * (1-t) + c2[2] * t)
        for x in range(w):
            img.putpixel((x, y), (r, g, b))

def gen_bg_far():
    w, h = 1920, 1080
    img = Image.new('RGB', (w, h), PALETTE['sky_top'])
    draw = ImageDraw.Draw(img)
    draw_grad_bg(img, PALETTE['sky_top'], PALETTE['sky_bot'])
    # 远山
    for i, (base, color) in enumerate([(500, (100,115,125)), (650, (80,95,105)), (800, (60,75,85))]):
        pts = []
        x = 0
        while x < w:
            y = base + int(60*math.sin(x*0.005 + i)) + int(30*math.sin(x*0.012))
            pts.append((x, y))
            x += 40
        pts += [(w, h), (0, h)]
        draw.polygon(pts, fill=color)
    # 城墙楼阁剪影
    for x in range(100, w, 350):
        height = random.randint(120, 220)
        draw.rectangle([x, h-300-height, x+180, h-300], fill=(50,60,68))
        # 飞檐
        draw.polygon([(x-20, h-300-height), (x+90, h-300-height-40), (x+200, h-300-height)], fill=(45,55,62))
    return img

def gen_bg_street():
    w, h = 1920, 1080
    img = Image.new('RGB', (w, h), PALETTE['sky_bot'])
    draw = ImageDraw.Draw(img)
    # 天
    draw_grad_bg(img, PALETTE['sky_top'], PALETTE['paper'])
    # 地面
    draw.rectangle([0, 580, w, h], fill=PALETTE['ground'])
    # 石板路
    for x in range(-40, w, 80):
        draw.rectangle([x, 580, x+70, 590], fill=PALETTE['ground_light'])
    for x in range(0, w, 120):
        draw.rectangle([x, 600, x+60, 610], fill=PALETTE['ground_light'])
    # 店铺建筑
    def building(x, width, height, color):
        draw.rectangle([x, 580-height, x+width, 580], fill=color)
        # 柱子
        draw.rectangle([x+10, 580-height, x+25, 580], fill=PALETTE['wood_dark'])
        draw.rectangle([x+width-25, 580-height, x+width-10, 580], fill=PALETTE['wood_dark'])
        # 招牌
        draw.rectangle([x+15, 580-height-35, x+width-15, 580-height-10], fill=PALETTE['paper'])
        draw.rectangle([x+15, 580-height-35, x+width-15, 580-height-30], fill=PALETTE['wood'])
        # 屋顶
        draw.polygon([(x-15, 580-height), (x+width//2, 580-height-55), (x+width+15, 580-height)], fill=PALETTE['roof'])
    for x in range(50, w, 400):
        building(x, 180, 180, PALETTE['wood'])
    # 灯笼
    for x in range(150, w, 400):
        draw.rectangle([x, 360, x+8, 420], fill=PALETTE['wood_dark'])
        draw.ellipse([x-12, 380, x+20, 420], fill=PALETTE['lantern'])
    # 货摊
    for x in range(250, w, 600):
        draw.rectangle([x, 520, x+70, 580], fill=PALETTE['wood'])
        draw.polygon([(x-10, 520), (x+35, 480), (x+80, 520)], fill=PALETTE['roof'])
    return img

def draw_human(draw, cx, cy, colors, pose='idle', frame=0, weapon=None):
    """绘制简约像素人物，cx,cy 为脚底中心"""
    # 头
    head_w, head_h = 18, 18
    draw.rectangle([cx-head_w//2, cy-76, cx+head_w//2, cy-76+head_h], fill=PALETTE['skin'])
    # 头发
    draw.rectangle([cx-head_w//2, cy-78, cx+head_w//2, cy-70], fill=colors['hair'])
    # 身体
    body_w, body_h = 26, 38
    bx, by = cx-body_w//2, cy-58
    draw.rectangle([bx, by, bx+body_w, by+body_h], fill=colors['robe'])
    # 腰带
    draw.rectangle([bx, by+26, bx+body_w, by+31], fill=colors['belt'])
    # 腿
    leg_w, leg_h = 10, 22
    leg_offset = frame * 4  # 行走帧摆动
    draw.rectangle([cx-12-leg_offset, cy-22, cx-2-leg_offset, cy], fill=colors['pants'])
    draw.rectangle([cx+2+leg_offset, cy-22, cx+12+leg_offset, cy], fill=colors['pants'])
    # 手臂
    arm_w, arm_h = 8, 26
    if pose == 'attack':
        draw.rectangle([cx+8, cy-56, cx+36, cy-50], fill=PALETTE['skin'])  # 伸出的手臂
    else:
        draw.rectangle([cx-20, cy-54, cx-12, cy-30], fill=PALETTE['skin'])
        draw.rectangle([cx+12, cy-54, cx+20, cy-30], fill=PALETTE['skin'])
    # 武器
    if weapon == 'sword':
        draw.rectangle([cx+14, cy-70, cx+18, cy-20], fill=PALETTE['sword'])
        draw.rectangle([cx+12, cy-22, cx+20, cy-18], fill=PALETTE['wood_dark'])  # 柄
    elif weapon == 'longsword':
        draw.rectangle([cx+16, cy-90, cx+22, cy-15], fill=PALETTE['sword'])


def gen_hero():
    # 两帧行走精灵表
    w, h = 128, 96
    img = Image.new('RGBA', (w, h), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    colors = {'hair': PALETTE['hair'], 'robe': PALETTE['hero_robe'], 'belt': PALETTE['hero_robe_dark'], 'pants': PALETTE['hero_robe_dark']}
    for frame in range(2):
        cx = 32 + frame * 64
        cy = 84
        draw_human(draw, cx, cy, colors, frame=frame, weapon='sword')
    return img

def gen_npc_civ_m():
    img = Image.new('RGBA', (128, 96), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    colors = {'hair': PALETTE['hair'], 'robe': PALETTE['civ_m'], 'belt': (100,95,88), 'pants': (90,85,78)}
    for f in range(2):
        draw_human(draw, 32 + f*64, 84, colors, frame=f)
    return img

def gen_npc_civ_f():
    img = Image.new('RGBA', (128, 96), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    colors = {'hair': PALETTE['hair'], 'robe': PALETTE['civ_f'], 'belt': (145,80,90), 'pants': (145,80,90)}
    for f in range(2):
        draw_human(draw, 32 + f*64, 84, colors, frame=f)
        # 长裙
        draw.rectangle([10 + f*64, 60, 54 + f*64, 84], fill=PALETTE['civ_f'])
    return img

def gen_npc_merchant():
    img = Image.new('RGBA', (160, 96), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    colors = {'hair': PALETTE['hair'], 'robe': PALETTE['merchant'], 'belt': (120,70,35), 'pants': (90,70,50)}
    for f in range(2):
        cx = 40 + f*80
        draw_human(draw, cx, 84, colors, frame=f)
        # 挑担
        draw.rectangle([cx-36, 40, cx+36, 48], fill=PALETTE['wood_dark'])
        draw.rectangle([cx-34, 28, cx-10, 42], fill=PALETTE['wood'])
        draw.rectangle([cx+10, 28, cx+34, 42], fill=PALETTE['wood'])
    return img

def gen_enemy_yayi():
    img = Image.new('RGBA', (128, 96), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    colors = {'hair': PALETTE['yayi_hat'], 'robe': PALETTE['yayi'], 'belt': (25,25,30), 'pants': (30,35,45)}
    for f in range(2):
        cx = 32 + f*64
        draw_human(draw, cx, 84, colors, frame=f, weapon='sword')
        # 帽子
        draw.rectangle([cx-18, 10, cx+18, 18], fill=PALETTE['yayi_hat'])
    return img

def gen_enemy_jinjun():
    img = Image.new('RGBA', (144, 108), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    colors = {'hair': PALETTE['hair'], 'robe': PALETTE['jinjun'], 'belt': (100,35,35), 'pants': (60,40,40)}
    for f in range(2):
        cx = 36 + f*72
        draw_human(draw, cx, 96, colors, frame=f, weapon='longsword')
        # 头盔
        draw.rectangle([cx-22, 8, cx+22, 20], fill=PALETTE['jinjun'])
        draw.rectangle([cx-14, 4, cx+14, 12], fill=(180,180,180))
        # 护甲
        draw.rectangle([cx-16, 40, cx+16, 70], fill=(165,55,55))
    return img

def gen_fx_slash():
    w, h = 128, 128
    img = Image.new('RGBA', (w, h), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    # 白色水墨剑光弧线
    for i in range(20):
        t = i / 19
        x = int(10 + t * 100)
        y1 = int(90 - 70 * math.sin(t * math.pi * 0.7))
        y2 = y1 - random.randint(3, 8)
        alpha = int(255 * (1 - abs(t - 0.5) * 2))
        draw.line([(x, y1), (x+6, y2)], fill=(255,255,255,alpha), width=4)
    return img

def gen_fx_hit():
    w, h = 64, 64
    img = Image.new('RGBA', (w, h), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    cx, cy = 32, 32
    for _ in range(12):
        r = random.randint(8, 28)
        a = random.random() * math.pi * 2
        x = cx + int(r * math.cos(a))
        y = cy + int(r * math.sin(a))
        size = random.randint(3, 8)
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(*PALETTE['blood'], 220))
    return img

def gen_ui_wanted():
    w, h = 64, 64
    img = Image.new('RGBA', (w, h), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([4, 4, 60, 60], fill=(*PALETTE['blood'], 230), outline=(120,30,30), width=3)
    draw.rectangle([18, 20, 46, 48], fill=(245,235,215,180))
    draw.text((22, 22), "通缉", fill=PALETTE['blood'])
    return img

def gen_ui_coin():
    w, h = 64, 64
    img = Image.new('RGBA', (w, h), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([4, 4, 60, 60], fill=PALETTE['gold'], outline=(160,120,30), width=3)
    draw.rectangle([24, 24, 40, 40], fill=(40,30,20))
    draw.text((18, 16), "元", fill=(40,30,20))
    return img

def save(name, img):
    path = os.path.join(ASSET_DIR, name)
    img.save(path)
    print(f"Saved {path}")

if __name__ == '__main__':
    save('bg-far.png', gen_bg_far())
    save('bg-street.png', gen_bg_street())
    save('hero.png', gen_hero())
    save('npc-civilian-m.png', gen_npc_civ_m())
    save('npc-civilian-f.png', gen_npc_civ_f())
    save('npc-merchant.png', gen_npc_merchant())
    save('enemy-yayi.png', gen_enemy_yayi())
    save('enemy-jinjun.png', gen_enemy_jinjun())
    save('fx-slash.png', gen_fx_slash())
    save('fx-hit.png', gen_fx_hit())
    save('ui-wanted.png', gen_ui_wanted())
    save('ui-coin.png', gen_ui_coin())
    print("All assets generated.")
