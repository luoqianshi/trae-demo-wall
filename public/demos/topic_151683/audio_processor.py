# -*- coding: utf-8 -*-
"""
audio_processor.py - 核心音频处理模块（改进版）
功能：使用librosa做音高检测(pYIN)，提取旋律，生成MIDI文件，
      根据多种乐器音域进行适配。
依赖：librosa, numpy, mido
"""

import os
import numpy as np
import librosa
import mido

# 导入乐器数据模块，获取各乐器音域信息
import instruments_data


def load_audio(filepath):
    """
    加载音频文件，转为单声道，采样率22050Hz。

    参数:
        filepath (str): 音频文件路径（支持wav/mp3/flac等librosa支持的格式）
    返回:
        y (np.ndarray): 单声道音频数据，采样率22050Hz
        sr (int): 采样率（固定为22050）
    """
    # 使用librosa加载音频，自动转为单声道，目标采样率22050Hz
    y, sr = librosa.load(filepath, sr=22050, mono=True)
    return y, sr


def extract_melody(filepath):
    """
    使用librosa.pyin提取音高轨迹(f0, voiced_flag, voiced_probs)。

    pYIN是一种基于概率的音高检测算法，适合处理音乐旋律。

    参数:
        filepath (str): 音频文件路径
    返回:
        f0 (np.ndarray): 基频轨迹（Hz），未发声处为0
        times (np.ndarray): 对应的时间轴（秒）
        voiced_flag (np.ndarray): 布尔数组，True表示该帧有发声
        voiced_probs (np.ndarray): 发声概率（0~1之间）
    """
    y, sr = load_audio(filepath)

    # pYIN参数设置
    # fmin: 最低频率(C2 ≈ 65Hz，覆盖古琴最低音C2=39对应的频率以下)
    # fmax: 最高频率(C7 ≈ 2093Hz，覆盖古筝最高音D7=88以上)
    fmin = librosa.note_to_hz('C2')
    fmax = librosa.note_to_hz('C7')

    # 使用pyin提取音高，帧步长设置为512样本（约23ms @22050Hz）
    f0, voiced_flag, voiced_probs = librosa.pyin(
        y,
        fmin=fmin,
        fmax=fmax,
        sr=sr,
        frame_length=2048,
        hop_length=512
    )

    # 计算每帧对应的时间点
    times = librosa.times_like(f0, sr=sr, hop_length=512)

    return f0, times, voiced_flag, voiced_probs


def f0_to_midi_notes(f0, times, voiced_flag):
    """
    将连续的f0轨迹转换为离散的MIDI音符列表。

    处理策略：
    1. 将f0频率转换为MIDI音高（四舍五入到最近的整数音高）
    2. 合并连续相同音高的帧为一个音符
    3. 最小音符时值为32分音符（在120BPM下约0.0625秒=62.5ms）
    4. 未发声段填充为休止符

    参数:
        f0 (np.ndarray): 基频轨迹（Hz）
        times (np.ndarray): 时间轴（秒）
        voiced_flag (np.ndarray): 发声标记
    返回:
        notes (list): 音符列表，每个元素为元组 (start_time, end_time, midi_pitch, velocity)
                     velocity: 100表示正常音符，0表示休止符
    """
    # 将f0转换为MIDI音高
    # MIDI音高 = 69 + 12 * log2(f0 / 440)
    midi_pitches = np.zeros_like(f0)

    # 只对发声帧计算MIDI音高
    for i in range(len(f0)):
        if voiced_flag[i] and not np.isnan(f0[i]) and f0[i] > 0:
            midi_pitches[i] = int(round(69 + 12 * np.log2(f0[i] / 440.0)))
        else:
            midi_pitches[i] = -1  # 标记为未发声

    # 量化到32分音符的时值（在120BPM下，32分音符 = 60/120/8 = 0.0625秒）
    # 为了更好的精度，使用较小的量化单位
    min_note_duration = 0.0625  # 32分音符时值（秒）
    quantization_step = min_note_duration

    notes = []

    if len(midi_pitches) == 0:
        return notes

    # 遍历帧，合并连续相同音高
    current_pitch = midi_pitches[0]
    current_start = times[0]
    is_rest = current_pitch == -1

    for i in range(1, len(midi_pitches)):
        pitch = midi_pitches[i]

        # 检查是否发生了变化（音高变化 或 发声/休止切换）
        pitch_changed = (pitch != current_pitch)

        if pitch_changed:
            # 计算当前音符/休止符的结束时间
            current_end = times[i]
            duration = current_end - current_start

            # 只有持续时间大于最小时值才记录
            if duration >= min_note_duration:
                if is_rest:
                    notes.append((current_start, current_end, 0, 0))  # 休止符
                else:
                    notes.append((current_start, current_end, int(current_pitch), 100))

            # 开始新的音符/休止符
            current_pitch = pitch
            current_start = times[i]
            is_rest = (pitch == -1)

    # 处理最后一个音符/休止符
    current_end = times[-1] + quantization_step  # 补上最后一帧的时长
    duration = current_end - current_start
    if duration >= min_note_duration:
        if is_rest:
            notes.append((current_start, current_end, 0, 0))
        else:
            notes.append((current_start, current_end, int(current_pitch), 100))

    # 合并连续相同音高的短音符
    notes = _merge_same_pitch_notes(notes)

    # 时间量化：对齐到网格
    notes = _quantize_notes(notes, quantization_step)

    return notes


def _merge_same_pitch_notes(notes):
    """
    合并连续相同音高的音符。

    参数:
        notes (list): 原始音符列表
    返回:
        merged (list): 合并后的音符列表
    """
    if not notes:
        return notes

    merged = []
    prev = notes[0]

    for i in range(1, len(notes)):
        current = notes[i]
        # 如果音高相同且类型相同（都是音符或都是休止符），且无间隔，则合并
        if (current[2] == prev[2] and
                current[3] == prev[3] and
                abs(current[0] - prev[1]) < 0.01):
            # 合并：保留起始时间，结束时间为当前音符的结束时间
            prev = (prev[0], current[1], prev[2], prev[3])
        else:
            merged.append(prev)
            prev = current

    merged.append(prev)
    return merged


def _quantize_notes(notes, step):
    """
    将音符时间量化到最近的量化步长网格。

    参数:
        notes (list): 音符列表
        step (float): 量化步长（秒）
    返回:
        quantized (list): 量化后的音符列表
    """
    quantized = []
    for note in notes:
        start, end, pitch, velocity = note
        # 量化起始和结束时间
        q_start = round(start / step) * step
        q_end = round(end / step) * step
        # 确保量化后仍有正时长
        if q_end <= q_start:
            q_end = q_start + step
        quantized.append((q_start, q_end, pitch, velocity))
    return quantized


def compute_range_intersection(instrument_ids):
    """
    计算多个乐器音域的交集。

    如果多个乐器的音域有重叠区域，返回重叠的公共音域范围；
    如果无交集（即max(min) > min(max)），则返回第一个乐器的音域。

    参数:
        instrument_ids (list): 乐器ID列表，如 ['violin', 'guqin']
    返回:
        dict: 包含 'min' 和 'max' 键的音域范围字典
    """
    if not instrument_ids:
        # 无乐器时，使用默认的小提琴音域
        return {'min': 55, 'max': 96}

    # 收集所有乐器的音域
    ranges = []
    for inst_id in instrument_ids:
        inst = instruments_data.get_instrument(inst_id)
        if inst and 'range' in inst:
            ranges.append({
                'min': inst['range']['min'],
                'max': inst['range']['max'],
            })

    if not ranges:
        return {'min': 55, 'max': 96}

    # 计算交集：取所有乐器音域的最大下限和最小上限
    range_min = max(r['min'] for r in ranges)
    range_max = min(r['max'] for r in ranges)

    # 如果无交集（最大下限 > 最小上限），回退到第一个乐器的音域
    if range_min > range_max:
        print(f"警告：乐器音域无交集（range_min={range_min}, range_max={range_max}），"
              f"使用第一个乐器 '{instrument_ids[0]}' 的音域")
        return ranges[0]

    print(f"乐器音域交集：MIDI {range_min} - {range_max}")
    return {'min': range_min, 'max': range_max}


def adapt_to_instrument(notes, instrument_id):
    """
    将音符适配到指定乐器的音域范围。

    音域数据从 instruments_data.py 中读取。
    - 低于音域下限的音符向上移调八度（+12）直到进入音域
    - 高于音域上限的音符向下移调八度（-12）直到进入音域
    休止符不受影响。

    参数:
        notes (list): 音符列表 [(start, end, midi_pitch, velocity), ...]
        instrument_id (str): 乐器ID，如 'violin', 'guqin' 等
    返回:
        adapted (list): 适配后的音符列表
    """
    # 从乐器数据中读取音域
    inst = instruments_data.get_instrument(instrument_id)
    if inst and 'range' in inst:
        range_low = inst['range']['min']
        range_high = inst['range']['max']
    else:
        # 未知乐器，使用默认小提琴音域
        print(f"警告：未知乐器 '{instrument_id}'，使用默认小提琴音域")
        range_low = 55   # G3
        range_high = 96  # E6

    adapted = []
    for note in notes:
        start, end, pitch, velocity = note

        # 跳过休止符
        if velocity == 0:
            adapted.append(note)
            continue

        adjusted_pitch = pitch

        # 低于音域下限 → 向上移调
        while adjusted_pitch < range_low:
            adjusted_pitch += 12

        # 高于音域上限 → 向下移调
        while adjusted_pitch > range_high:
            adjusted_pitch -= 12

        adapted.append((start, end, adjusted_pitch, velocity))

    return adapted


def adapt_to_instruments_intersection(notes, instrument_ids):
    """
    将音符适配到多个乐器音域的交集范围。

    如果多个乐器音域有交集，则适配到交集范围；
    如果无交集，则使用第一个乐器的音域。

    参数:
        notes (list): 音符列表 [(start, end, midi_pitch, velocity), ...]
        instrument_ids (list): 乐器ID列表
    返回:
        adapted (list): 适配后的音符列表
    """
    # 计算音域交集
    range_info = compute_range_intersection(instrument_ids)
    range_low = range_info['min']
    range_high = range_info['max']

    adapted = []
    for note in notes:
        start, end, pitch, velocity = note

        # 跳过休止符
        if velocity == 0:
            adapted.append(note)
            continue

        adjusted_pitch = pitch

        # 低于音域下限 → 向上移调
        while adjusted_pitch < range_low:
            adjusted_pitch += 12

        # 高于音域上限 → 向下移调
        while adjusted_pitch > range_high:
            adjusted_pitch -= 12

        adapted.append((start, end, adjusted_pitch, velocity))

    return adapted


def generate_midi(notes, output_path, bpm=120, midi_program=41):
    """
    使用mido库生成标准MIDI文件。

    参数:
        notes (list): 音符列表 [(start_time, end_time, midi_pitch, velocity), ...]
        output_path (str): 输出MIDI文件路径
        bpm (int): 速度（每分钟拍数），默认120
        midi_program (int): MIDI乐器编号（Program Change），默认41（小提琴）
    返回:
        output_path (str): 生成的MIDI文件路径
    """
    # 创建MIDI文件
    mid = mido.MidiFile()
    # 设置时间分辨率：480 ticks per beat（标准分辨率）
    ticks_per_beat = 480
    mid.ticks_per_beat = ticks_per_beat

    # 创建音轨
    track = mido.MidiTrack()
    mid.tracks.append(track)

    # 设置速度（BPM）
    tempo = mido.bpm2tempo(bpm)
    track.append(mido.MetaMessage('set_tempo', tempo=tempo, time=0))

    # 设置乐器（Program Change，由参数传入，不再硬编码）
    track.append(mido.Message('program_change', program=midi_program, time=0))

    # 计算时间转换因子：秒 → ticks
    # ticks = seconds * (ticks_per_beat * bpm / 60)
    seconds_to_ticks = ticks_per_beat * bpm / 60.0

    # 将音符转换为MIDI事件
    # 先按开始时间排序
    sorted_notes = sorted(notes, key=lambda n: (n[0], n[2]))

    # 构建事件列表：每个note_on和note_off都转换为ticks时间
    events = []
    for note in sorted_notes:
        start, end, pitch, velocity = note

        # 跳过休止符（velocity=0）
        if velocity == 0 or pitch <= 0:
            continue

        # 限制MIDI音高范围（0~127）
        pitch = max(0, min(127, pitch))

        start_tick = int(round(start * seconds_to_ticks))
        end_tick = int(round(end * seconds_to_ticks))

        events.append((start_tick, 'note_on', pitch, velocity))
        events.append((end_tick, 'note_off', pitch, 0))

    # 按时间排序，note_off优先（同时间先关后开）
    events.sort(key=lambda e: (e[0], e[1] != 'note_off'))

    # 写入MIDI事件
    prev_tick = 0
    for event in events:
        tick, msg_type, pitch, vel = event

        # 计算相对时间（delta time）
        delta = max(0, tick - prev_tick)
        prev_tick = tick

        if msg_type == 'note_on':
            track.append(mido.Message('note_on', note=pitch, velocity=vel, time=delta))
        elif msg_type == 'note_off':
            track.append(mido.Message('note_off', note=pitch, velocity=vel, time=delta))

    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # 保存MIDI文件
    mid.save(output_path)
    return output_path


def process_audio(filepath, output_dir, instrument_ids=None):
    """
    完整处理管线：音频 → f0检测 → MIDI音符 → 多乐器音域交集适配 → 生成MIDI文件。

    参数:
        filepath (str): 输入音频文件路径
        output_dir (str): 输出目录路径
        instrument_ids (list): 选定的乐器ID列表，如 ["violin", "guqin"]。
                               如果为None或空列表，默认使用 ['violin']。
    返回:
        dict: 处理结果，包含以下键：
            - 'midi_path': 生成的MIDI文件路径
            - 'notes_count': 音符数量
            - 'rest_count': 休止符数量
            - 'notes': 适配后的音符列表
    """
    # 默认乐器列表
    if not instrument_ids:
        instrument_ids = ['violin']

    # 确保输出目录存在
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # 第1步：提取音高轨迹
    f0, times, voiced_flag, voiced_probs = extract_melody(filepath)

    # 第2步：将f0转换为MIDI音符
    notes = f0_to_midi_notes(f0, times, voiced_flag)

    # 第3步：适配到所有选中乐器音域的交集
    adapted_notes = adapt_to_instruments_intersection(notes, instrument_ids)

    # 第4步：确定MIDI乐器编号（使用第一个乐器的midi_program）
    first_inst = instruments_data.get_instrument(instrument_ids[0])
    midi_program = first_inst['midi_program'] if first_inst else 41

    # 第5步：生成MIDI文件
    base_name = os.path.splitext(os.path.basename(filepath))[0]
    inst_suffix = '_'.join(instrument_ids) if instrument_ids else 'violin'
    midi_filename = f"{base_name}_{inst_suffix}.mid"
    midi_path = os.path.join(output_dir, midi_filename)
    generate_midi(adapted_notes, midi_path, bpm=120, midi_program=midi_program)

    # 统计信息
    notes_count = sum(1 for n in adapted_notes if n[3] > 0)
    rest_count = sum(1 for n in adapted_notes if n[3] == 0)

    return {
        'midi_path': midi_path,
        'notes_count': notes_count,
        'rest_count': rest_count,
        'notes': adapted_notes,
        'f0': f0,
        'times': times,
        'voiced_flag': voiced_flag
    }


# ===== 模块自测试 =====
if __name__ == '__main__':
    print("=== audio_processor 模块自测试（改进版） ===")
    print()

    # 测试 adapt_to_instrument 函数
    test_notes = [
        (0.0, 0.5, 40, 100),    # E2，低于小提琴音域，应上移+12→52→再+12→64(E5)
        (0.5, 1.0, 55, 100),    # G3，刚好在小提琴音域下限，不变
        (1.0, 1.5, 60, 100),    # C4，在音域内，不变
        (1.5, 2.0, 72, 100),    # C5，在音域内，不变
        (2.0, 2.5, 100, 100),   # E7，高于小提琴音域上限，应下移-12→88(E6)→再-12→76(E5)
        (2.5, 3.0, 0, 0),       # 休止符，不变
    ]

    print("测试 adapt_to_instrument（适配到小提琴）:")
    for note in test_notes:
        note_name = "休止" if note[2] == 0 else f"MIDI {note[2]}"
        print(f"  原始: {note_name}  时间: {note[0]:.2f}-{note[1]:.2f}s")

    adapted = adapt_to_instrument(test_notes, 'violin')
    print("  适配后:")
    for note in adapted:
        note_name = "休止" if note[2] == 0 else f"MIDI {note[2]}"
        print(f"    {note_name}  时间: {note[0]:.2f}-{note[1]:.2f}s")

    # 测试适配到古琴音域（C2=39 ~ D5=76）
    print("\n测试 adapt_to_instrument（适配到古琴）:")
    adapted_guqin = adapt_to_instrument(test_notes, 'guqin')
    for note in adapted_guqin:
        note_name = "休止" if note[2] == 0 else f"MIDI {note[2]}"
        print(f"    {note_name}  时间: {note[0]:.2f}-{note[1]:.2f}s")

    # 测试音域交集计算
    print("\n测试 compute_range_intersection:")
    intersection = compute_range_intersection(['violin', 'erhu'])
    print(f"  violin(55-96) ∩ erhu(48-84) = MIDI {intersection['min']}-{intersection['max']}")

    intersection2 = compute_range_intersection(['violin', 'guqin'])
    print(f"  violin(55-96) ∩ guqin(39-76) = MIDI {intersection2['min']}-{intersection2['max']}")

    # 测试多乐器交集适配
    print("\n测试 adapt_to_instruments_intersection:")
    adapted_multi = adapt_to_instruments_intersection(test_notes, ['violin', 'erhu'])
    for note in adapted_multi:
        note_name = "休止" if note[2] == 0 else f"MIDI {note[2]}"
        print(f"    {note_name}  时间: {note[0]:.2f}-{note[1]:.2f}s")

    print("\n=== 自测试完成 ===")
