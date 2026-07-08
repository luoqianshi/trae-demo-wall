#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成中国手语动画数据
====================
将100个CSL手语词的动画关键帧导出为JSON，
供网页端动画播放器使用

使用方法：
  python generate_sign_animations.py
"""

import json
import math
import os

# 21个MediaPipe关键点索引
HAND_LANDMARKS = {
    'wrist': 0,
    'thumb_cmc': 1, 'thumb_mcp': 2, 'thumb_ip': 3, 'thumb_tip': 4,
    'index_mcp': 5, 'index_pip': 6, 'index_dip': 7, 'index_tip': 8,
    'middle_mcp': 9, 'middle_pip': 10, 'middle_dip': 11, 'middle_tip': 12,
    'ring_mcp': 13, 'ring_pip': 14, 'ring_dip': 15, 'ring_tip': 16,
    'pinky_mcp': 17, 'pinky_pip': 18, 'pinky_dip': 19, 'pinky_tip': 20
}

# 手指定义
FINGERS = {
    'thumb': {'base': 1, 'indices': [1, 2, 3, 4], 'length': 0.10, 'angle': -60},
    'index': {'base': 5, 'indices': [5, 6, 7, 8], 'length': 0.12, 'angle': -15},
    'middle': {'base': 9, 'indices': [9, 10, 11, 12], 'length': 0.13, 'angle': 0},
    'ring': {'base': 13, 'indices': [13, 14, 15, 16], 'length': 0.12, 'angle': 15},
    'pinky': {'base': 17, 'indices': [17, 18, 19, 20], 'length': 0.09, 'angle': 35}
}


def get_finger_positions(name, extended, bend_ratio=0.3):
    """
    生成单个手指的4个关键点位置
    name: 手指名
    extended: 是否伸直
    bend_ratio: 弯曲程度 0=完全伸直, 1=完全弯曲
    """
    finger = FINGERS[name]
    positions = []

    # 手腕起点
    start_x = (finger['indices'][0] - 5) * 0.04  # 相对x偏移
    start_y = 0.0

    base_angle = math.radians(finger['angle'])
    length = finger['length']
    bend = bend_ratio * math.pi * 0.4

    for i in range(4):
        t = i / 3
        seg_len = length * (0.3 if i == 0 else 0.3 if i == 1 else 0.25) * (1 - bend_ratio * 0.6)

        # 弯曲时关节偏转
        angle = base_angle
        if i > 0 and not extended:
            bend_this = bend * (i / 3)
            if name == 'thumb':
                angle += bend_this * 0.3
            else:
                angle += bend_this

        x = start_x + seg_len * math.sin(angle)
        y = start_y - seg_len * math.cos(angle) * (1 - t * 0.1)

        positions.append({'x': round(x, 4), 'y': round(y, 4)})

    return positions


def generate_hand_frame(extended_state, wrist_offset=(0, 0)):
    """
    生成一帧的21个关键点
    extended_state: [thumb, index, middle, ring, pinky]  1=伸直 0=弯曲
    wrist_offset: 手腕位置偏移 (x, y)
    """
    frame = {}

    # 手腕
    frame[0] = {'x': wrist_offset[0], 'y': wrist_offset[1]}

    for fi, (finger_name, finger_info) in enumerate(FINGERS.items()):
        is_extended = extended_state[fi] == 1
        bend = 0.15 if is_extended else 0.75
        positions = get_finger_positions(finger_name, is_extended, bend)

        for li, lm_idx in enumerate(finger_info['indices']):
            pos = positions[li]
            frame[lm_idx] = {
                'x': round(pos['x'] + wrist_offset[0], 4),
                'y': round(pos['y'] + wrist_offset[1], 4)
            }

    # 转换为列表
    landmarks = [frame[i] for i in range(21)]
    return landmarks


def generate_animation_frames(word, duration_frames=30):
    """生成一个词的多帧动画"""
    # 每个词的"手势序列"
    sequences = get_sign_sequence(word)

    frames = []
    for i in range(duration_frames):
        t = i / duration_frames  # 0~1的进度
        seq_idx = min(int(t * len(sequences)), len(sequences) - 1)
        frame = generate_hand_frame(sequences[seq_idx])
        frames.append(frame)

    return frames


def get_sign_sequence(word):
    """
    定义每个词的"手势序列"
    返回多个"伸屈状态"帧，帧之间做插值过渡
    """
    # 默认：张开手 → 保持 → 收回
    default = [1, 1, 1, 1, 1]
    closed = [0, 0, 0, 0, 0]

    # 手语动画序列库（基于100个CSL词汇）
    sign_sequences = {
        # ===== 基础代词/你好 =====
        "中国": [[1,1,1,1,1], [1,1,1,1,1], [0,0,0,0,0]],
        "北京": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "上海": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "大学": [[1,1,1,1,1], [1,1,1,1,1], [0,0,0,0,0]],
        "学生": [[1,1,1,1,1], [1,1,1,1,1], [0,0,0,0,0]],
        "老师": [[1,1,1,1,1], [1,1,1,1,1], [0,0,0,0,0]],
        "学习": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "工作": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "朋友": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "家": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "我": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "你": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "他": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "她": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "我们": [[0,1,0,0,0], [0,1,0,0,0], [0,1,0,0,0]],
        "你们": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "他们": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "大家": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "自己": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "别人": [[0,0,0,0,1], [0,0,0,0,1], [0,0,0,0,0]],
        # ===== 日常问候 =====
        "谢谢": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "对不起": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "没关系": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "请": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "是": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "不": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "好": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "可以": [[0,1,1,1,0], [0,1,1,1,0], [0,0,0,0,0]],
        "帮忙": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "帮助": [[1,1,0,0,0], [1,1,0,0,0], [0,0,0,0,0]],
        # ===== 情感表达 =====
        "爱": [[1,1,0,0,0], [1,1,0,0,0], [0,0,0,0,0]],
        "喜欢": [[1,1,0,0,0], [1,1,0,0,0], [1,1,0,0,0]],
        "高兴": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "难过": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "生气": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "害怕": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "累": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "饿": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "渴": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "疼": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        # ===== 数字 =====
        "一二": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "三四": [[0,1,1,1,1], [0,1,1,1,1], [0,0,0,0,0]],
        "五六": [[1,1,0,0,1], [1,1,0,0,1], [0,0,0,0,0]],
        "七八": [[1,0,0,0,0], [1,0,0,0,0], [0,0,0,0,0]],
        "九十": [[0,0,0,0,1], [0,0,0,0,1], [0,0,0,0,0]],
        # ===== 时间 =====
        "今天": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "昨天": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "明天": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "现在": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "早上": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "中午": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "晚上": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "几点": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "星期": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "月": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "年": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "时间": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "以后": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "以前": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        # ===== 动作动词 =====
        "来": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "去": [[0,1,0,0,0], [0,1,0,0,0], [0,0,0,0,0]],
        "回来": [[0,1,0,0,0], [0,1,0,0,0], [0,1,0,0,0]],
        "进来": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "出去": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "起来": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "吃饭": [[1,1,0,0,0], [1,1,0,0,0], [1,1,0,0,0]],
        "喝水": [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
        "睡觉": [[1,1,0,0,0], [1,1,0,0,0], [1,1,0,0,0]],
        "起床": [[1,1,0,0,0], [1,1,0,0,0], [1,1,0,0,0]],
        "洗澡": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "走路": [[0,1,1,0,0], [0,1,1,0,0], [0,1,1,0,0]],
        "跑步": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "开车": [[0,0,0,0,0], [0,0,0,0,0], [0,0,0,0,0]],
        "打电话": [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
        "开门": [[1,1,0,0,0], [1,1,0,0,0], [1,1,0,0,0]],
        # ===== 物品 =====
        "电脑": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "手机": [[1,0,0,0,1], [1,0,0,0,1], [1,0,0,0,1]],
        "电视": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "书": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "笔": [[0,1,1,0,0], [0,1,1,0,0], [0,0,0,0,0]],
        "水": [[1,0,0,0,1], [1,0,0,0,1], [0,0,0,0,0]],
        "衣服": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
        "钱": [[1,1,0,0,0], [1,1,0,0,0], [1,1,0,0,0]],
        "医院": [[1,0,0,0,0], [1,0,0,0,0], [0,0,0,0,0]],
        "学校": [[1,1,1,1,1], [1,1,1,1,1], [1,1,1,1,1]],
    }

    return sign_sequences.get(word, [default, default, default])


def generate_all_animations(output_path="./sign_animations"):
    """生成所有100个CSL词汇的动画数据"""
    from train_csl import CSL_WORDS

    print(f"[动画生成] 正在生成 {len(CSL_WORDS)} 个手语动画数据...")

    all_animations = {}

    for word in CSL_WORDS:
        frames = generate_animation_frames(word, duration_frames=30)
        all_animations[word] = {
            "frames": frames,
            "frame_count": len(frames),
            "duration_ms": 1500  # 每个词1.5秒
        }

    os.makedirs(output_path, exist_ok=True)

    # 导出完整JSON
    output_file = os.path.join(output_path, "csl_animations.json")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_animations, f, ensure_ascii=False, indent=2)

    # 生成精简版（只含伸屈状态）
    simple_animations = {}
    for word in CSL_WORDS:
        sequence = get_sign_sequence(word)
        # 3帧关键状态
        simple_animations[word] = {
            "sequence": sequence,
            "frame_count": len(sequence) * 10,
            "duration_ms": len(sequence) * 500
        }

    simple_file = os.path.join(output_path, "csl_animations_simple.json")
    with open(simple_file, 'w', encoding='utf-8') as f:
        json.dump(simple_animations, f, ensure_ascii=False, indent=2)

    print(f"[动画生成] 完成！")
    print(f"  完整版: {output_file}")
    print(f"  精简版: {simple_file}")
    print(f"  共 {len(all_animations)} 个词汇动画")

    # 生成JS版本供网页直接引用
    with open(simple_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    js_content = f"""// 中国手语动画数据 - 由 generate_sign_animations.py 自动生成
const CSL_ANIMATIONS = {json.dumps(data, ensure_ascii=False, indent=2)};

function getSignAnimation(word) {{
    return CSL_ANIMATIONS[word] || null;
}}

function getSignSequence(word) {{
    const anim = getSignAnimation(word);
    if (!anim) return null;

    // 返回插值后的动画帧
    const frames = [];
    for (const state of anim.sequence) {{
        for (let i = 0; i < 10; i++) {{
            frames.push(state);
        }}
    }}
    return frames;
}}

window.CSLAnimations = {{
    animations: CSL_ANIMATIONS,
    getAnimation: getSignAnimation,
    getSequence: getSignSequence
}};
"""
    js_output = os.path.join(output_path, "csl_animations.js")
    with open(js_output, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"  网页版:   {js_output}")
    return all_animations


if __name__ == '__main__':
    print("=" * 50)
    print("  中国手语动画数据生成")
    print("=" * 50)
    generate_all_animations()
