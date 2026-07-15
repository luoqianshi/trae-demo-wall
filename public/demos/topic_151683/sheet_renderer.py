# -*- coding: utf-8 -*-
"""
sheet_renderer.py - 乐谱渲染模块
功能：用PIL(Pillow)绘制五线谱PNG图片。
依赖：Pillow (PIL), mido
"""

import os
import math
import mido
from PIL import Image, ImageDraw, ImageFont


# ============================================================
# 常量定义
# ============================================================

# 页面布局
PAGE_WIDTH = 1600            # 页面宽度（像素）
MARGIN_LEFT = 80             # 左边距
MARGIN_RIGHT = 60            # 右边距
MARGIN_TOP = 100             # 上边距（标题区域）
MARGIN_BOTTOM = 40           # 下边距
LINE_SPACING = 14            # 线间距（两条五线谱线之间的距离）
HALF_LINE_SPACING = 7        # 半线间距

# 五线谱参数
STAFF_LINES = 5              # 五线谱线数
MEASURES_PER_ROW = 8        # 每行小节数

# 颜色定义（RGB元组）
COLOR_BG = (255, 255, 250)       # 背景色（暖白）
COLOR_STAFF_LINE = (40, 40, 40)  # 五线谱线颜色（深灰/近黑）
COLOR_NOTE = (20, 20, 20)        # 音符颜色（黑色）
COLOR_BARLINE = (40, 40, 40)    # 小节线颜色
COLOR_TITLE = (30, 30, 80)       # 标题颜色（深蓝）
COLOR_SUBTITLE = (80, 80, 80)    # 副标题颜色（灰色）
COLOR_LEDGER = (40, 40, 40)     # 加线颜色
COLOR_TIME_SIG = (40, 40, 40)   # 拍号颜色
COLOR_REST = (40, 40, 40)       # 休止符颜色

# 音符尺寸
NOTE_HEAD_WIDTH = 12           # 音符头宽度
NOTE_HEAD_HEIGHT = 9           # 音符头高度
STEM_LENGTH = 45               # 符干长度
BEAM_THICKNESS = 4             # 符梁粗细

# 高音谱号相关（使用Unicode字符绘制）
# 高音谱号的Unicode: 𝄞 (U+1D11E) 或使用简化绘制
TREBLE_CLEF_CHAR = "\U0001D11E"


# ============================================================
# 字体检测与加载
# ============================================================

def _find_chinese_font():
    """
    检测系统中可用的中文字体。

    依次尝试常见中文字体路径（Windows/Linux/macOS）。

    返回:
        font_path (str or None): 找到的字体文件路径，如果找不到则返回None
    """
    # 常见中文字体路径列表
    chinese_fonts = [
        # Windows
        "C:\\Windows\\Fonts\\msyh.ttc",       # Microsoft YaHei
        "C:\\Windows\\Fonts\\msyhbd.ttc",     # Microsoft YaHei Bold
        "C:\\Windows\\Fonts\\simhei.ttf",     # SimHei（黑体）
        "C:\\Windows\\Fonts\\simsun.ttc",     # SimSun（宋体）
        "C:\\Windows\\Fonts\\simkai.ttf",      # KaiTi（楷体）
        # Linux
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc",
        "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf",
        # macOS
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Medium.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
    ]

    for font_path in chinese_fonts:
        if os.path.exists(font_path):
            return font_path

    return None


def _load_font(size):
    """
    加载指定大小的字体，优先使用中文字体。

    参数:
        size (int): 字体大小
    返回:
        font (ImageFont.FreeTypeFont): 加载的字体对象
    """
    # 尝试加载中文字体
    chinese_font_path = _find_chinese_font()
    if chinese_font_path:
        try:
            return ImageFont.truetype(chinese_font_path, size)
        except Exception:
            pass

    # 回退到默认字体
    try:
        return ImageFont.truetype("arial.ttf", size)
    except Exception:
        try:
            return ImageFont.load_default()
        except Exception:
            return ImageFont.load_default()


def _load_music_font(size):
    """
    加载音乐符号字体（用于高音谱号等）。

    如果没有专门的音乐字体，使用Bravura或回退到系统字体。

    参数:
        size (int): 字体大小
    返回:
        font (ImageFont.FreeTypeFont): 加载的字体对象
    """
    # 尝试常见的音乐字体
    music_fonts = [
        "C:\\Windows\\Fonts\\Bravura.ttf",
        "C:\\Windows\\Fonts\\NotoMusic-Regular.ttf",
    ]

    for font_path in music_fonts:
        if os.path.exists(font_path):
            try:
                return ImageFont.truetype(font_path, size)
            except Exception:
                continue

    # 回退到中文字体（高音谱号用字符绘制）
    return _load_font(size)


# ============================================================
# MIDI解析
# ============================================================

def _parse_midi(midi_path):
    """
    从MIDI文件中解析出音符事件列表。

    参数:
        midi_path (str): MIDI文件路径
    返回:
        dict: 包含以下键：
            - 'notes': [(start_time_sec, end_time_sec, midi_pitch, velocity), ...]
            - 'bpm': 速度
            - 'time_signature': (numerator, denominator)
    """
    mid = mido.MidiFile(midi_path)

    bpm = 120  # 默认BPM
    time_sig_numerator = 4
    time_sig_denominator = 4
    ticks_per_beat = mid.ticks_per_beat if mid.ticks_per_beat else 480

    # 计算每秒对应的tick数
    seconds_per_tick = 60.0 / (bpm * ticks_per_beat)

    # 收集所有轨道的音符事件
    all_events = []

    for track in mid.tracks:
        abs_tick = 0

        for msg in track:
            abs_tick += msg.time

            # 解析速度变化
            if msg.type == 'set_tempo':
                bpm = mido.tempo2bpm(msg.tempo)
                seconds_per_tick = 60.0 / (bpm * ticks_per_beat)

            # 解析拍号
            if msg.type == 'time_signature':
                time_sig_numerator = msg.numerator
                time_sig_denominator = msg.denominator

            # 记录音符开/关事件
            if msg.type == 'note_on' and msg.velocity > 0:
                all_events.append((abs_tick, 'note_on', msg.note, msg.velocity))
            elif msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0):
                all_events.append((abs_tick, 'note_off', msg.note, 0))

    # 将所有事件按时间排序
    all_events.sort(key=lambda e: (e[0], e[1] != 'note_off'))

    # 匹配note_on和note_off，构建音符列表
    active_notes = {}  # {pitch: (start_tick, velocity)}
    notes = []

    for event in all_events:
        tick, event_type, pitch, velocity = event

        if event_type == 'note_on':
            active_notes[pitch] = (tick, velocity)
        elif event_type == 'note_off':
            if pitch in active_notes:
                start_tick, vel = active_notes.pop(pitch)
                start_sec = start_tick * seconds_per_tick
                end_sec = tick * seconds_per_tick
                notes.append((start_sec, end_sec, pitch, vel))

    return {
        'notes': notes,
        'bpm': bpm,
        'time_signature': (time_sig_numerator, time_sig_denominator)
    }


def _notes_to_quantized(notes, bpm, time_sig):
    """
    将MIDI音符按拍号进行量化和分组。

    根据BPM和拍号计算出每拍的秒数，然后将音符分配到各拍和小节中。

    参数:
        notes (list): 音符列表 [(start_sec, end_sec, midi_pitch, velocity), ...]
        bpm (int): 速度
        time_sig (tuple): (分子, 分母)，如(4, 4)表示4/4拍
    返回:
        measures (list): 每个元素是一个小节，包含该小节内的音符列表
    """
    num, denom = time_sig
    # 每拍的秒数
    beat_duration = 60.0 / bpm
    # 每小节的秒数
    measure_duration = beat_duration * num

    measures = []

    if not notes:
        return measures

    # 找到最大时间
    max_time = max(n[1] for n in notes)
    # 计算总小节数
    total_measures = int(math.ceil(max_time / measure_duration))
    if total_measures == 0:
        total_measures = 1

    # 初始化小节列表
    for i in range(total_measures):
        measures.append([])

    # 将每个音符分配到对应的小节
    for note in notes:
        start, end, pitch, vel = note
        # 计算该音符起始所在的小节编号
        measure_idx = int(start / measure_duration)
        measure_idx = min(measure_idx, total_measures - 1)
        measures[measure_idx].append(note)

    return measures


def _duration_to_note_type(duration_sec, bpm):
    """
    根据音符持续时间确定音符类型。

    参数:
        duration_sec (float): 音符持续时间（秒）
        bpm (int): 速度
    返回:
        note_type (int): 音符类型
            0 = 全音符 (4拍)
            1 = 二分音符 (2拍)
            2 = 四分音符 (1拍)
            3 = 八分音符 (1/2拍)
            4 = 十六分音符 (1/4拍)
    """
    beat_duration = 60.0 / bpm
    beats = duration_sec / beat_duration

    if beats >= 3.5:
        return 0   # 全音符
    elif beats >= 1.5:
        return 1   # 二分音符
    elif beats >= 0.75:
        return 2   # 四分音符
    elif beats >= 0.375:
        return 3   # 八分音符
    else:
        return 4   # 十六分音符


def _pitch_to_staff_position(midi_pitch):
    """
    将MIDI音高转换为五线谱上的位置（以半行间距为单位，中线=0）。

    高音谱号下，C4(MIDI 60)在中间偏下（第一间）。
    计算公式：position = (midi_pitch - 60)，每单位对应一个半行间距。
    C4=0, D4=1, E4=2(第一线), F4=3(第一间), G4=4(第二线)...

    参数:
        midi_pitch (int): MIDI音高值
    返回:
        position (int): 在五线谱上的位置（相对于C4=0的偏移量）
    """
    return midi_pitch - 60


# ============================================================
# 五线谱绘制函数
# ============================================================

def _draw_staff_lines(draw, x_start, x_end, staff_top_y):
    """
    绘制五线谱的五条线。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x_start (int): 五线谱起始X坐标
        x_end (int): 五线谱结束X坐标
        staff_top_y (int): 五线谱最上面一条线的Y坐标
    """
    for i in range(STAFF_LINES):
        y = staff_top_y + i * LINE_SPACING
        draw.line([(x_start, y), (x_end, y)], fill=COLOR_STAFF_LINE, width=1)


def _draw_treble_clef(draw, x, staff_top_y, font):
    """
    在五线谱左侧绘制高音谱号。

    使用Unicode字符 𝄞 或简化图形绘制。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 谱号起始X坐标
        staff_top_y (int): 五线谱顶部Y坐标
        font (ImageFont): 字体对象
    """
    # 高音谱号中心对齐到G4线（第二条线，从下数）
    # 五线谱从上到下：F5(线1), D5(线2), B4(线3), G4(线4), E4(线5)
    # G4在MIDI中为67，position = 67-60 = 7
    # staff_top_y + 3 * LINE_SPACING 是G4线的Y坐标（从上数第4条线）
    clef_center_y = staff_top_y + 3 * LINE_SPACING

    try:
        # 尝试用Unicode高音谱号字符绘制
        text = TREBLE_CLEF_CHAR
        bbox = draw.textbbox((x, clef_center_y - 50), text, font=font)
        draw.text((x, clef_center_y - 50), text, fill=COLOR_NOTE, font=font)
    except Exception:
        # 如果Unicode字符无法渲染，用简化的文字替代
        draw.text((x, clef_center_y - 20), "G", fill=COLOR_NOTE, font=font)


def _draw_time_signature(draw, x, staff_top_y, numerator, denominator, font):
    """
    在五线谱上绘制拍号。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 拍号起始X坐标
        staff_top_y (int): 五线谱顶部Y坐标
        numerator (int): 拍号分子
        denominator (int): 拍号分母
        font (ImageFont): 字体对象
    """
    staff_center_y = staff_top_y + 2 * LINE_SPACING

    # 分子：画在中间偏上
    num_str = str(numerator)
    bbox_num = draw.textbbox((0, 0), num_str, font=font)
    num_width = bbox_num[2] - bbox_num[0]
    num_height = bbox_num[3] - bbox_num[1]
    draw.text((x - num_width // 2, staff_center_y - num_height - 2),
              num_str, fill=COLOR_TIME_SIG, font=font)

    # 分母：画在中间偏下
    den_str = str(denominator)
    bbox_den = draw.textbbox((0, 0), den_str, font=font)
    den_width = bbox_den[2] - bbox_den[0]
    draw.text((x - den_width // 2, staff_center_y + 4),
              den_str, fill=COLOR_TIME_SIG, font=font)


def _draw_barline(draw, x, staff_top_y):
    """
    绘制小节线。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 小节线X坐标
        staff_top_y (int): 五线谱顶部Y坐标
    """
    staff_bottom_y = staff_top_y + (STAFF_LINES - 1) * LINE_SPACING
    draw.line([(x, staff_top_y), (x, staff_bottom_y)], fill=COLOR_BARLINE, width=1)


def _draw_double_barline(draw, x, staff_top_y):
    """
    绘制双小节线（结束线）。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 双小节线X坐标
        staff_top_y (int): 五线谱顶部Y坐标
    """
    staff_bottom_y = staff_top_y + (STAFF_LINES - 1) * LINE_SPACING
    # 细线
    draw.line([(x - 4, staff_top_y), (x - 4, staff_bottom_y)], fill=COLOR_BARLINE, width=1)
    # 粗线
    draw.line([(x, staff_top_y), (x, staff_bottom_y)], fill=COLOR_BARLINE, width=2)


def _draw_ledger_lines(draw, note_x, note_y, staff_top_y, staff_bottom_y):
    """
    绘制加线（当音符在五线谱范围之外时）。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        note_x (int): 音符X坐标
        note_y (int): 音符中心Y坐标
        staff_top_y (int): 五线谱顶部Y坐标
        staff_bottom_y (int): 五线谱底部Y坐标
    """
    ledger_half_width = NOTE_HEAD_WIDTH // 2 + 4

    # 上方加线
    y = staff_top_y - LINE_SPACING
    while y >= note_y - HALF_LINE_SPACING:
        draw.line([(note_x - ledger_half_width, y), (note_x + ledger_half_width, y)],
                  fill=COLOR_LEDGER, width=1)
        y -= LINE_SPACING

    # 下方加线
    y = staff_bottom_y + LINE_SPACING
    while y <= note_y + HALF_LINE_SPACING:
        draw.line([(note_x - ledger_half_width, y), (note_x + ledger_half_width, y)],
                  fill=COLOR_LEDGER, width=1)
        y += LINE_SPACING


def _draw_note_head(draw, x, y, note_type):
    """
    绘制音符头。

    全音符是空心椭圆，其余是实心椭圆。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 音符中心X坐标
        y (int): 音符中心Y坐标
        note_type (int): 音符类型（0=全, 1=二分, 2=四分, 3=八分, 4=十六分）
    """
    hw = NOTE_HEAD_WIDTH // 2
    hh = NOTE_HEAD_HEIGHT // 2

    if note_type == 0:
        # 全音符：空心椭圆
        draw.ellipse([x - hw, y - hh, x + hw, y + hh],
                     outline=COLOR_NOTE, width=2)
    else:
        # 二分及更短：实心椭圆（略微倾斜）
        draw.ellipse([x - hw, y - hh, x + hw, y + hh],
                     fill=COLOR_NOTE)


def _draw_stem(draw, x, note_y, note_type, stem_direction='up'):
    """
    绘制符干。

    符干方向：音符在第三线（B4）以上时朝下，以下时朝上。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 符干X坐标（连接到音符头的一侧）
        note_y (int): 音符头中心Y坐标
        note_type (int): 音符类型
        stem_direction (str): 'up' 或 'down'
    """
    if note_type == 0:
        return  # 全音符无符干

    if stem_direction == 'up':
        # 符干朝上：从音符头右侧向上
        stem_x = x + NOTE_HEAD_WIDTH // 2 - 1
        stem_end_y = note_y - STEM_LENGTH
        draw.line([(stem_x, note_y), (stem_x, stem_end_y)],
                  fill=COLOR_NOTE, width=1)
    else:
        # 符干朝下：从音符头左侧向下
        stem_x = x - NOTE_HEAD_WIDTH // 2 + 1
        stem_end_y = note_y + STEM_LENGTH
        draw.line([(stem_x, note_y), (stem_x, stem_end_y)],
                  fill=COLOR_NOTE, width=1)


def _draw_flags(draw, x, note_y, note_type, stem_direction='up'):
    """
    绘制符尾（八分和十六分音符）。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 符干X坐标
        note_y (int): 音符头中心Y坐标
        note_type (int): 音符类型（3=八分, 4=十六分）
        stem_direction (str): 'up' 或 'down'
    """
    if note_type < 3:
        return  # 四分音符及以上没有符尾

    flag_count = note_type - 2  # 八分=1个符尾，十六分=2个符尾

    if stem_direction == 'up':
        stem_x = x + NOTE_HEAD_WIDTH // 2 - 1
        stem_top = note_y - STEM_LENGTH
        for i in range(flag_count):
            flag_y = stem_top + i * 8
            # 绘制向右弯曲的符尾
            points = [
                (stem_x, flag_y),
                (stem_x + 10, flag_y + 8),
                (stem_x + 4, flag_y + 16)
            ]
            draw.line(points, fill=COLOR_NOTE, width=2)
    else:
        stem_x = x - NOTE_HEAD_WIDTH // 2 + 1
        stem_bottom = note_y + STEM_LENGTH
        for i in range(flag_count):
            flag_y = stem_bottom - i * 8
            # 绘制向左弯曲的符尾
            points = [
                (stem_x, flag_y),
                (stem_x - 10, flag_y - 8),
                (stem_x - 4, flag_y - 16)
            ]
            draw.line(points, fill=COLOR_NOTE, width=2)


def _draw_rest(draw, x, staff_top_y, note_type):
    """
    绘制休止符。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x (int): 休止符X坐标
        staff_top_y (int): 五线谱顶部Y坐标
        note_type (int): 对应的音符时值类型
    """
    staff_center_y = staff_top_y + 2 * LINE_SPACING

    if note_type == 2:
        # 四分休止符：锯齿形状
        points = [
            (x - 4, staff_center_y - 8),
            (x + 2, staff_center_y - 2),
            (x - 4, staff_center_y + 4),
            (x + 2, staff_center_y + 10)
        ]
        draw.line(points, fill=COLOR_REST, width=2)
    elif note_type == 1:
        # 二分休止符：横线在上
        y = staff_center_y - LINE_SPACING
        draw.line([(x - 6, y), (x + 6, y)], fill=COLOR_REST, width=3)
    elif note_type == 0:
        # 全休止符：横线在下
        y = staff_center_y + LINE_SPACING
        draw.line([(x - 6, y), (x + 6, y)], fill=COLOR_REST, width=3)
        draw.line([(x, y - 6), (x, y)], fill=COLOR_REST, width=2)
    else:
        # 八分/十六分休止符：简化为点
        draw.ellipse([x - 3, staff_center_y - 3, x + 3, staff_center_y + 3],
                     fill=COLOR_REST)


def _draw_note(draw, note_x, staff_top_y, midi_pitch, note_type, font):
    """
    绘制完整的音符（音符头 + 符干 + 符尾 + 加线）。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        note_x (int): 音符X坐标
        staff_top_y (int): 五线谱顶部Y坐标
        midi_pitch (int): MIDI音高
        note_type (int): 音符类型
        font (ImageFont): 字体对象（备用）
    """
    staff_center_y = staff_top_y + 2 * LINE_SPACING
    staff_bottom_y = staff_top_y + (STAFF_LINES - 1) * LINE_SPACING

    # 根据MIDI音高计算Y坐标
    # C4(60)在第一间下方，position=0对应staff_center_y
    position = _pitch_to_staff_position(midi_pitch)
    note_y = staff_center_y - position * HALF_LINE_SPACING

    # 判断符干方向：position >= 6（G4线以上）时朝下
    stem_direction = 'down' if position >= 6 else 'up'

    # 绘制加线（如果音符超出五线谱范围）
    _draw_ledger_lines(draw, note_x, note_y, staff_top_y, staff_bottom_y)

    # 绘制音符头
    _draw_note_head(draw, note_x, note_y, note_type)

    # 绘制符干
    _draw_stem(draw, note_x, note_y, note_type, stem_direction)

    # 绘制符尾
    _draw_flags(draw, note_x, note_y, note_type, stem_direction)


def _draw_measure(draw, x_start, x_end, staff_top_y, measure_notes, bpm, font):
    """
    绘制一个小节内的所有音符。

    参数:
        draw (ImageDraw.ImageDraw): 绘图对象
        x_start (int): 小节起始X坐标
        x_end (int): 小节结束X坐标
        staff_top_y (int): 五线谱顶部Y坐标
        measure_notes (list): 该小节内的音符列表
        bpm (int): 速度
        font (ImageFont): 字体对象
    返回:
        next_x (int): 下一个可用的X坐标
    """
    if not measure_notes:
        return x_end

    measure_width = x_end - x_start
    note_count = len(measure_notes)

    if note_count == 0:
        return x_end

    # 计算音符间距
    spacing = min(measure_width / (note_count + 1), 40)
    spacing = max(spacing, 18)  # 最小间距

    # 居中对齐
    total_width = spacing * (note_count - 1) if note_count > 1 else 0
    offset = x_start + (measure_width - total_width) / 2

    for i, note in enumerate(measure_notes):
        start, end, pitch, vel = note

        if vel == 0:
            # 休止符
            rest_x = int(offset + i * spacing)
            duration = end - start
            note_type = _duration_to_note_type(duration, bpm)
            _draw_rest(draw, rest_x, staff_top_y, note_type)
        else:
            # 正常音符
            note_x = int(offset + i * spacing)
            duration = end - start
            note_type = _duration_to_note_type(duration, bpm)
            _draw_note(draw, note_x, staff_top_y, pitch, note_type, font)

    return x_end


# ============================================================
# 主渲染函数
# ============================================================

def render_sheet(midi_path, output_path, title="弦音工坊", instrument="小提琴"):
    """
    主入口：从MIDI文件渲染五线谱PNG图片。

    处理流程：
    1. 解析MIDI文件获取音符信息
    2. 按拍号将音符分组为小节
    3. 按行排列小节（每行8小节）
    4. 绘制五线谱、谱号、拍号、音符、小节线
    5. 添加标题和乐器名称
    6. 输出PNG图片（宽1600px，高根据内容自适应）

    参数:
        midi_path (str): 输入MIDI文件路径
        output_path (str): 输出PNG图片路径
        title (str): 标题文字，默认"弦音工坊"
        instrument (str): 乐器名称，默认"小提琴"
    返回:
        output_path (str): 输出的PNG图片路径
    """
    # 解析MIDI文件
    midi_data = _parse_midi(midi_path)
    notes = midi_data['notes']
    bpm = midi_data['bpm']
    time_sig = midi_data['time_signature']

    # 将音符按小节分组
    measures = _notes_to_quantized(notes, bpm, time_sig)

    # 如果没有音符，创建一个空白小节
    if not measures:
        measures = [[]]

    # 计算总行数
    num_measures = len(measures)
    num_rows = math.ceil(num_measures / MEASURES_PER_ROW)
    if num_rows == 0:
        num_rows = 1

    # 计算页面尺寸
    row_height = STAFF_LINES * LINE_SPACING + 60  # 每行高度（含行间距）
    page_height = MARGIN_TOP + num_rows * row_height + MARGIN_BOTTOM

    # 创建画布
    img = Image.new('RGB', (PAGE_WIDTH, int(page_height)), COLOR_BG)
    draw = ImageDraw.Draw(img)

    # 加载字体
    title_font = _load_font(32)
    subtitle_font = _load_font(20)
    time_sig_font = _load_font(28)
    music_font = _load_music_font(56)

    # ===== 绘制标题 =====
    # 标题居中
    bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = bbox[2] - bbox[0]
    title_x = (PAGE_WIDTH - title_width) // 2
    draw.text((title_x, 20), title, fill=COLOR_TITLE, font=title_font)

    # 乐器名称
    bbox_sub = draw.textbbox((0, 0), instrument, font=subtitle_font)
    sub_width = bbox_sub[2] - bbox_sub[0]
    sub_x = (PAGE_WIDTH - sub_width) // 2
    draw.text((sub_x, 60), instrument, fill=COLOR_SUBTITLE, font=subtitle_font)

    # ===== 绘制每一行五线谱 =====
    content_width = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
    measure_width = content_width / MEASURES_PER_ROW

    for row in range(num_rows):
        # 当前行Y坐标
        row_y = MARGIN_TOP + row * row_height
        staff_top_y = row_y + 20  # 行内上方留20px

        # 当行包含的小节范围
        start_measure = row * MEASURES_PER_ROW
        end_measure = min(start_measure + MEASURES_PER_ROW, num_measures)

        # 绘制五线谱线（贯穿整行）
        staff_x_start = MARGIN_LEFT - 10
        staff_x_end = PAGE_WIDTH - MARGIN_RIGHT + 10
        _draw_staff_lines(draw, staff_x_start, staff_x_end, staff_top_y)

        # 绘制高音谱号和拍号（仅第一行或每行第一小节处）
        if row == 0:
            clef_x = MARGIN_LEFT + 5
            _draw_treble_clef(draw, clef_x, staff_top_y, music_font)

            # 拍号
            ts_x = clef_x + 55
            _draw_time_signature(draw, ts_x, staff_top_y,
                                  time_sig[0], time_sig[1], time_sig_font)

        # 绘制每个小节
        for i in range(start_measure, end_measure):
            measure_idx = i - start_measure  # 当行内的小节序号

            # 小节的X范围
            m_x_start = MARGIN_LEFT + measure_idx * measure_width
            m_x_end = m_x_start + measure_width

            # 获取当前小节的音符
            if i < len(measures):
                measure_notes = measures[i]
            else:
                measure_notes = []

            # 绘制小节内容
            note_area_start = m_x_start + 5
            note_area_end = m_x_end - 5
            _draw_measure(draw, note_area_start, note_area_end,
                         staff_top_y, measure_notes, bpm, time_sig_font)

            # 绘制小节线
            if measure_idx > 0:
                _draw_barline(draw, int(m_x_start), staff_top_y)

        # 绘制行末双小节线（最后一行）
        if row == num_rows - 1:
            last_measure_x = MARGIN_LEFT + (end_measure - start_measure) * measure_width
            _draw_double_barline(draw, int(last_measure_x), staff_top_y)

    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # 保存PNG图片
    img.save(output_path, 'PNG')

    return output_path


# ===== 模块自测试 =====
if __name__ == '__main__':
    print("=== sheet_renderer 模块自测试 ===")
    print()

    # 创建一个简单的测试MIDI文件
    import mido as mido_lib

    test_midi_path = os.path.join(
        'c:\\Users\\admin\\.trae-cn\\work\\6a416d87e0b92281d1a0eb63',
        'test_sheet.mid'
    )

    # 生成测试MIDI（C大调音阶）
    mid = mido_lib.MidiFile(ticks_per_beat=480)
    track = mido_lib.MidiTrack()
    mid.tracks.append(track)

    track.append(mido_lib.MetaMessage('set_tempo', tempo=mido_lib.bpm2tempo(120), time=0))
    track.append(mido_lib.MetaMessage('time_signature', numerator=4, denominator=4, time=0))
    track.append(mido_lib.Message('program_change', program=41, time=0))

    # C大调音阶两个八度 + 休止符
    scale_pitches = [60, 62, 64, 65, 67, 69, 71, 72,   # C4-C5
                     74, 76, 77, 79, 81, 83, 84, 72]    # D5-C5

    for i, pitch in enumerate(scale_pitches):
        track.append(mido_lib.Message('note_on', note=pitch, velocity=100, time=0))
        track.append(mido_lib.Message('note_off', note=pitch, velocity=0, time=480))

    mid.save(test_midi_path)

    # 测试渲染
    test_png_path = os.path.join(
        'c:\\Users\\admin\\.trae-cn\\work\\6a416d87e0b92281d1a0eb63',
        'test_sheet.png'
    )

    print(f"测试MIDI文件: {test_midi_path}")
    print(f"测试渲染中...")
    result = render_sheet(test_midi_path, test_png_path,
                          title="测试乐谱", instrument="小提琴")
    print(f"渲染完成: {result}")

    # 清理测试文件
    if os.path.exists(test_midi_path):
        os.remove(test_midi_path)
    if os.path.exists(test_png_path):
        os.remove(test_png_path)

    print("=== 自测试完成 ===")
