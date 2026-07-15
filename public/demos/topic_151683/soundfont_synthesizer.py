# -*- coding: utf-8 -*-
"""
soundfont_synthesizer.py - 多乐器音色合成模块
功能：使用简单的正弦波+谐波合成不同乐器音色，将MIDI文件转为WAV音频。
依赖：numpy, scipy, mido
支持的乐器：violin(小提琴), guqin(古琴), erhu(二胡), pipa(琵琶), guzheng(古筝)
"""

import os
import math
import numpy as np
from scipy.io import wavfile
import mido


# ============================================================
# 采样率常量
# ============================================================
SAMPLE_RATE = 22050  # 采样率（Hz）


# ============================================================
# 乐器合成参数定义
# ============================================================

# 各乐器的合成参数
# 每种乐器包含：
#   - harmonics: 谐波振幅列表（第1次谐波=基频，第2次=2倍频...）
#   - attack: ADSR包络的起音时间（秒）
#   - decay: ADSR包络的衰减时间（秒）
#   - sustain_level: ADSR包络的持续音量级别（0~1）
#   - release: ADSR包络的释放时间（秒）
#   - vibrato_rate: 颤音速率（Hz），0表示无颤音
#   - vibrato_depth: 颤音深度（半音），0表示无颤音
#   - vibrato_delay: 颤音延迟时间（秒），从音符开始到颤音出现的时间

INSTRUMENT_PARAMS = {
    # 小提琴：多谐波锯齿波近似，带颤音和ADSR
    'violin': {
        'harmonics': [1.0, 0.8, 0.6, 0.45, 0.35, 0.25, 0.18, 0.12],
        'attack': 0.08,
        'decay': 0.15,
        'sustain_level': 0.75,
        'release': 0.15,
        'vibrato_rate': 5.5,
        'vibrato_depth': 0.04,
        'vibrato_delay': 0.15,
    },
    # 古琴：少谐波，慢起音，长持续，微弱音高滑移
    'guqin': {
        'harmonics': [1.0, 0.3, 0.15, 0.08],
        'attack': 0.25,
        'decay': 0.3,
        'sustain_level': 0.6,
        'release': 0.4,
        'vibrato_rate': 4.0,
        'vibrato_depth': 0.015,
        'vibrato_delay': 0.5,
    },
    # 二胡：强颤音，锯齿波近似带一定滤波
    'erhu': {
        'harmonics': [1.0, 0.9, 0.7, 0.5, 0.35, 0.2, 0.1],
        'attack': 0.06,
        'decay': 0.1,
        'sustain_level': 0.8,
        'release': 0.1,
        'vibrato_rate': 6.0,
        'vibrato_depth': 0.06,
        'vibrato_delay': 0.08,
    },
    # 琵琶：拨弦音色，快速起音，快速衰减，丰富谐波
    'pipa': {
        'harmonics': [1.0, 0.7, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1],
        'attack': 0.01,
        'decay': 0.08,
        'sustain_level': 0.3,
        'release': 0.05,
        'vibrato_rate': 0.0,
        'vibrato_depth': 0.0,
        'vibrato_delay': 0.0,
    },
    # 古筝：拨弦但有较长的持续，中等谐波
    'guzheng': {
        'harmonics': [1.0, 0.6, 0.4, 0.3, 0.2, 0.12, 0.08],
        'attack': 0.01,
        'decay': 0.12,
        'sustain_level': 0.5,
        'release': 0.1,
        'vibrato_rate': 0.0,
        'vibrato_depth': 0.0,
        'vibrato_delay': 0.0,
    },
}


# ============================================================
# ADSR包络函数
# ============================================================

def adsr_envelope(t, attack=0.05, decay=0.1, sustain_level=0.7, release=0.1, duration=1.0):
    """
    ADSR包络函数：计算给定时间点的音量包络值。

    ADSR = Attack（起音）→ Decay（衰减）→ Sustain（持续）→ Release（释放）

    参数:
        t (np.ndarray): 时间数组（秒）
        attack (float): 起音时间（秒），音量从0上升到1
        decay (float): 衰减时间（秒），音量从1下降到sustain_level
        sustain_level (float): 持续音量级别（0~1之间）
        release (float): 释放时间（秒），音量从sustain_level下降到0
        duration (float): 总音符时长（秒）
    返回:
        envelope (np.ndarray): 包络值数组，与t同形状，值在0~1之间
    """
    envelope = np.zeros_like(t, dtype=np.float64)

    # 确保释放阶段不超出音符总时长
    release_start = duration - release

    for i, ti in enumerate(t):
        if ti < 0:
            envelope[i] = 0.0
        elif ti < attack:
            # Attack阶段：从0线性上升到1
            envelope[i] = ti / attack if attack > 0 else 1.0
        elif ti < attack + decay:
            # Decay阶段：从1线性下降到sustain_level
            decay_progress = (ti - attack) / decay if decay > 0 else 1.0
            envelope[i] = 1.0 - (1.0 - sustain_level) * decay_progress
        elif ti < release_start:
            # Sustain阶段：保持sustain_level
            envelope[i] = sustain_level
        elif ti < duration:
            # Release阶段：从sustain_level线性下降到0
            release_progress = (ti - release_start) / release if release > 0 else 1.0
            envelope[i] = sustain_level * (1.0 - release_progress)
        else:
            envelope[i] = 0.0

    return envelope


# ============================================================
# 基础波形合成函数
# ============================================================

def synth_note(frequency, duration, instrument_type='violin'):
    """
    合成单个音符的音频样本。

    使用谐波叠加的方式合成不同乐器的音色：
    - 每个谐波是一个正弦波，频率为基频的整数倍
    - 谐波振幅由乐器参数决定
    - 应用ADSR包络控制音量变化
    - 可选颤音效果（频率调制）

    参数:
        frequency (float): 基频（Hz），如A4=440Hz
        duration (float): 音符持续时间（秒）
        instrument_type (str): 乐器类型，支持：
            'violin', 'guqin', 'erhu', 'pipa', 'guzheng'
    返回:
        samples (np.ndarray): 音频样本数组（float64，范围-1~1）
                              长度 = duration * SAMPLE_RATE
    """
    # 获取乐器参数
    params = INSTRUMENT_PARAMS.get(instrument_type, INSTRUMENT_PARAMS['violin'])

    # 计算总采样点数
    num_samples = int(duration * SAMPLE_RATE)
    if num_samples == 0:
        return np.array([], dtype=np.float64)

    # 生成时间数组
    t = np.linspace(0, duration, num_samples, endpoint=False)

    # 初始化音频样本
    samples = np.zeros(num_samples, dtype=np.float64)

    # 叠加各次谐波
    harmonics = params['harmonics']
    for n, amplitude in enumerate(harmonics, start=1):
        # 第n次谐波的频率
        harmonic_freq = frequency * n

        # 防止频率过高导致混叠（超过奈奎斯特频率）
        if harmonic_freq >= SAMPLE_RATE / 2:
            break

        # 生成正弦波并叠加
        samples += amplitude * np.sin(2.0 * np.pi * harmonic_freq * t)

    # 归一化：防止总振幅过大
    max_amp = sum(harmonics[:len(harmonics)]) if harmonics else 1.0
    if max_amp > 0:
        samples /= max_amp

    # 添加颤音效果（频率调制）
    vibrato_rate = params.get('vibrato_rate', 0.0)
    vibrato_depth = params.get('vibrato_depth', 0.0)
    vibrato_delay = params.get('vibrato_delay', 0.0)

    if vibrato_rate > 0 and vibrato_depth > 0:
        # 颤音延迟包络（渐入效果）
        vibrato_envelope = np.clip((t - vibrato_delay) / 0.2, 0, 1)
        # 颤音调制：以半音为单位，转换为频率比
        # vibrato_depth是半音数，1半音 = 2^(1/12) ≈ 1.0595
        vibrato_mod = vibrato_depth * np.sin(2.0 * np.pi * vibrato_rate * t) * vibrato_envelope
        # 频率调制（重新计算相位）
        phase = 2.0 * np.pi * frequency * t + 2.0 * np.pi * vibrato_mod * t
        # 重新生成带颤音的音频
        vibrato_samples = np.zeros(num_samples, dtype=np.float64)
        for n, amplitude in enumerate(harmonics, start=1):
            harmonic_freq = frequency * n
            if harmonic_freq >= SAMPLE_RATE / 2:
                break
            vibrato_samples += amplitude * np.sin(n * phase)

        if max_amp > 0:
            vibrato_samples /= max_amp

        # 混合原始音频和颤音音频（颤音渐入）
        samples = samples * (1.0 - vibrato_envelope * 0.5) + vibrato_samples * (vibrato_envelope * 0.5)

    # 应用ADSR包络
    envelope = adsr_envelope(
        t,
        attack=params.get('attack', 0.05),
        decay=params.get('decay', 0.1),
        sustain_level=params.get('sustain_level', 0.7),
        release=params.get('release', 0.1),
        duration=duration
    )

    samples *= envelope

    # 最终归一化到 [-1, 1]
    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / peak * 0.9  # 留10%余量

    return samples


# ============================================================
# MIDI解析
# ============================================================

def _parse_midi_for_synthesis(midi_path):
    """
    解析MIDI文件，提取音符事件用于合成。

    参数:
        midi_path (str): MIDI文件路径
    返回:
        dict: 包含以下键：
            - 'notes': [(start_sec, end_sec, midi_pitch, velocity), ...]
            - 'bpm': 速度
    """
    mid = mido.MidiFile(midi_path)

    bpm = 120
    ticks_per_beat = mid.ticks_per_beat if mid.ticks_per_beat else 480
    seconds_per_tick = 60.0 / (bpm * ticks_per_beat)

    # 收集所有音符事件
    all_events = []

    for track in mid.tracks:
        abs_tick = 0
        for msg in track:
            abs_tick += msg.time

            # 解析速度变化
            if msg.type == 'set_tempo':
                bpm = mido.tempo2bpm(msg.tempo)
                seconds_per_tick = 60.0 / (bpm * ticks_per_beat)

            # 记录音符事件
            if msg.type == 'note_on' and msg.velocity > 0:
                all_events.append((abs_tick, 'note_on', msg.note, msg.velocity))
            elif msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0):
                all_events.append((abs_tick, 'note_off', msg.note, 0))

    # 按时间排序
    all_events.sort(key=lambda e: (e[0], e[1] != 'note_off'))

    # 匹配note_on/note_off
    active_notes = {}
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
        'bpm': bpm
    }


def _midi_pitch_to_frequency(midi_pitch):
    """
    将MIDI音高转换为频率（Hz）。

    公式：f = 440 * 2^((midi_pitch - 69) / 12)
    MIDI 69 = A4 = 440Hz

    参数:
        midi_pitch (int): MIDI音高值（0~127）
    返回:
        frequency (float): 对应的频率（Hz）
    """
    return 440.0 * (2.0 ** ((midi_pitch - 69) / 12.0))


# ============================================================
# 主合成函数
# ============================================================

def synthesize_audio(midi_path, output_path, instrument="violin"):
    """
    主入口：将MIDI文件合成为WAV音频。

    处理流程：
    1. 解析MIDI文件提取音符事件
    2. 将每个MIDI音符转换为频率
    3. 使用对应乐器的合成参数生成音频波形
    4. 将所有音符按时间顺序叠加到最终音频中
    5. 写入标准WAV文件（22050Hz，16位PCM）

    支持的乐器：
    - violin（小提琴）：多谐波锯齿波近似，带颤音和ADSR
    - guqin（古琴）：少谐波，慢起音，长持续，微弱音高滑移
    - erhu（二胡）：强颤音，锯齿波近似带一定滤波
    - pipa（琵琶）：拨弦音色，快速起音，快速衰减，丰富谐波
    - guzheng（古筝）：拨弦但有较长持续，中等谐波

    参数:
        midi_path (str): 输入MIDI文件路径
        output_path (str): 输出WAV文件路径
        instrument (str): 乐器类型，默认"violin"
    返回:
        output_path (str): 输出的WAV文件路径
    """
    # 验证乐器类型
    if instrument not in INSTRUMENT_PARAMS:
        print(f"警告：未知乐器 '{instrument}'，使用默认的 'violin'")
        instrument = 'violin'

    # 解析MIDI文件
    midi_data = _parse_midi_for_synthesis(midi_path)
    notes = midi_data['notes']
    bpm = midi_data['bpm']

    if not notes:
        print("警告：MIDI文件中没有音符，生成1秒静音")
        silence = np.zeros(SAMPLE_RATE, dtype=np.float64)
        _write_wav(silence, output_path)
        return output_path

    # 计算总音频时长
    total_duration = max(note[1] for note in notes)
    # 在末尾添加0.5秒的释放余量
    total_duration += 0.5
    total_samples = int(total_duration * SAMPLE_RATE)

    # 初始化音频缓冲区
    audio_buffer = np.zeros(total_samples, dtype=np.float64)

    print(f"开始合成：乐器={instrument}, 音符数={len(notes)}, "
          f"BPM={bpm}, 时长={total_duration:.1f}秒")

    # 逐个合成音符并叠加到缓冲区
    for i, note in enumerate(notes):
        start_sec, end_sec, midi_pitch, velocity = note

        # 跳过静音音符
        if velocity <= 0:
            continue

        # 计算音符实际持续时间
        note_duration = end_sec - start_sec
        if note_duration < 0.01:
            note_duration = 0.01  # 最短10ms

        # 添加释放时间
        release_time = INSTRUMENT_PARAMS[instrument].get('release', 0.1)
        total_note_duration = note_duration + release_time
        total_note_duration = min(total_note_duration, total_duration - start_sec)

        if total_note_duration <= 0:
            continue

        # 将MIDI音高转为频率
        frequency = _midi_pitch_to_frequency(midi_pitch)

        # 合成单个音符
        note_samples = synth_note(frequency, total_note_duration, instrument)

        # 根据velocity调整音量（velocity 0~127映射到0.3~1.0）
        volume = 0.3 + (velocity / 127.0) * 0.7
        note_samples *= volume

        # 将音符样本写入缓冲区的对应位置
        start_sample = int(start_sec * SAMPLE_RATE)
        end_sample = start_sample + len(note_samples)

        # 确保不超出缓冲区范围
        end_sample = min(end_sample, total_samples)
        actual_length = end_sample - start_sample

        if actual_length > 0 and start_sample >= 0:
            # 叠加（允许和弦/重叠音）
            audio_buffer[start_sample:end_sample] += note_samples[:actual_length]

    # 最终归一化，防止削波
    peak = np.max(np.abs(audio_buffer))
    if peak > 1.0:
        audio_buffer = audio_buffer / peak * 0.95
    elif peak > 0:
        audio_buffer = audio_buffer / peak * 0.9  # 保持一致的音量

    # 写入WAV文件
    _write_wav(audio_buffer, output_path)

    print(f"合成完成: {output_path}")
    return output_path


def _write_wav(samples, output_path):
    """
    将音频样本写入WAV文件。

    参数:
        samples (np.ndarray): 音频样本数组（float64，范围-1~1）
        output_path (str): 输出WAV文件路径
    """
    # 转换为16位整数格式（标准PCM WAV）
    audio_16bit = np.clip(samples * 32767, -32768, 32767).astype(np.int16)

    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    # 写入WAV文件
    wavfile.write(output_path, SAMPLE_RATE, audio_16bit)


# ============================================================
# 单音符快速合成工具函数
# ============================================================

def quick_synth_note(midi_pitch, duration, instrument='violin', velocity=100):
    """
    快速合成单个音符（便利函数）。

    参数:
        midi_pitch (int): MIDI音高（0~127）
        duration (float): 持续时间（秒）
        instrument (str): 乐器类型
        velocity (int): 力度（0~127）
    返回:
        samples (np.ndarray): 音频样本数组
    """
    frequency = _midi_pitch_to_frequency(midi_pitch)
    note_samples = synth_note(frequency, duration, instrument)

    # 根据velocity调整音量
    volume = 0.3 + (velocity / 127.0) * 0.7
    note_samples *= volume

    return note_samples


# ===== 模块自测试 =====
if __name__ == '__main__':
    print("=== soundfont_synthesizer 模块自测试 ===")
    print()

    # 测试ADSR包络
    print("1. 测试ADSR包络函数")
    t = np.linspace(0, 2.0, 100)
    env = adsr_envelope(t, attack=0.1, decay=0.2, sustain_level=0.7, release=0.3, duration=2.0)
    print(f"   包络范围: [{env.min():.4f}, {env.max():.4f}]")
    print(f"   0.05秒处: {env[2]:.4f} (应在起音上升段)")
    print(f"   1.0秒处:  {env[49]:.4f} (应在持续段)")
    print(f"   1.8秒处:  {env[89]:.4f} (应在释放段)")

    # 测试单音符合成
    print("\n2. 测试单音符合成")
    instruments = ['violin', 'guqin', 'erhu', 'pipa', 'guzheng']

    test_dir = 'c:\\Users\\admin\\.trae-cn\\work\\6a416d87e0b92281d1a0eb63'

    for inst in instruments:
        samples = synth_note(440.0, 1.0, inst)
        print(f"   {inst:10s}: 长度={len(samples)}样本, "
              f"峰值={np.max(np.abs(samples)):.4f}")

    # 生成一个完整的测试MIDI并合成
    print("\n3. 测试完整MIDI合成管线")

    import mido as mido_lib

    # 创建测试MIDI（简单旋律）
    test_midi = os.path.join(test_dir, 'test_synth.mid')
    test_wav = os.path.join(test_dir, 'test_synth.wav')

    mid = mido_lib.MidiFile(ticks_per_beat=480)
    track = mido_lib.MidiTrack()
    mid.tracks.append(track)

    track.append(mido_lib.MetaMessage('set_tempo', tempo=mido_lib.bpm2tempo(100), time=0))
    track.append(mido_lib.Message('program_change', program=41, time=0))

    # 简单旋律：C E G C' (C大调琶音)
    melody = [(60, 480), (64, 480), (67, 480), (72, 960)]  # (pitch, duration_ticks)
    for pitch, dur in melody:
        track.append(mido_lib.Message('note_on', note=pitch, velocity=100, time=0))
        track.append(mido_lib.Message('note_off', note=pitch, velocity=0, time=dur))

    mid.save(test_midi)

    # 合成
    synthesize_audio(test_midi, test_wav, instrument='violin')

    # 验证输出文件
    if os.path.exists(test_wav):
        sr, data = wavfile.read(test_wav)
        print(f"   WAV文件: 采样率={sr}Hz, 时长={len(data)/sr:.2f}秒, "
              f"位深={data.dtype}")

    # 清理测试文件
    if os.path.exists(test_midi):
        os.remove(test_midi)
    if os.path.exists(test_wav):
        os.remove(test_wav)

    print("\n=== 自测试完成 ===")
