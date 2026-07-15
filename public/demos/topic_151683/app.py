# -*- coding: utf-8 -*-
"""
弦音工坊 - Flask Web 后端主文件（改进版）
提供音频上传、旋律提取、乐谱渲染、多乐器音色合成等功能的Web API服务。

改进内容：
- /api/upload 增加 title 字段处理
- 新增 /api/bpm POST 接口：使用librosa进行BPM检测
- 新增 SSE(Server-Sent Events)路由 /api/task/<task_id>/stream
- process_task 中传入 instrument_ids 进行多乐器音域交集适配
"""

from flask import Flask, render_template, request, jsonify, send_from_directory, Response
import os
import uuid
import json
import threading
import time
import queue
from datetime import datetime

# 导入项目模块
import audio_processor
import sheet_renderer
import soundfont_synthesizer
import instruments_data

app = Flask(__name__)

# 配置
app.config['UPLOAD_FOLDER'] = 'uploads'       # 上传文件存放目录
app.config['OUTPUT_FOLDER'] = 'output'         # 输出文件存放目录
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 最大上传文件大小：50MB

# 允许的音频文件格式
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'flac', 'ogg'}

# 存储所有任务的状态（内存字典，task_id -> 任务信息）
tasks = {}

# SSE消息队列：每个task_id对应一个队列，用于SSE推送
sse_queues = {}


def allowed_file(filename):
    """检查文件扩展名是否为允许的音频格式"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def generate_demo_wav(output_path):
    """
    生成一个简单的C大调音阶WAV文件，用于Demo演示。
    使用scipy生成正弦波，包含C4到C5的完整音阶。

    参数:
        output_path: 输出WAV文件路径
    返回:
        output_path: 生成的WAV文件路径
    """
    import numpy as np
    from scipy.io import wavfile

    SAMPLE_RATE = 22050
    NOTE_DURATION = 0.5  # 每个音符持续0.5秒

    # C大调音阶：C4, D4, E4, F4, G4, A4, B4, C5
    # 对应MIDI音高: 60, 62, 64, 65, 67, 69, 71, 72
    scale_pitches = [60, 62, 64, 65, 67, 69, 71, 72]

    samples = []
    for pitch in scale_pitches:
        # MIDI音高转频率：f = 440 * 2^((pitch - 69) / 12)
        frequency = 440.0 * (2.0 ** ((pitch - 69) / 12.0))
        num_samples = int(NOTE_DURATION * SAMPLE_RATE)
        t = np.linspace(0, NOTE_DURATION, num_samples, endpoint=False)
        # 生成正弦波并添加简单的ADSR包络
        note = np.sin(2.0 * np.pi * frequency * t)
        # 简单的淡入淡出
        fade_len = min(200, num_samples // 4)
        fade_in = np.linspace(0, 1, fade_len)
        fade_out = np.linspace(1, 0, fade_len)
        note[:fade_len] *= fade_in
        note[-fade_len:] *= fade_out
        samples.append(note)

    # 拼接所有音符
    audio = np.concatenate(samples)
    # 归一化到16位整数范围
    audio_16bit = (audio * 32767 * 0.8).astype(np.int16)

    # 确保输出目录存在
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    wavfile.write(output_path, SAMPLE_RATE, audio_16bit)
    return output_path


def notify_sse(task_id, event_type, data):
    """
    通过SSE向客户端推送任务状态更新。

    参数:
        task_id: 任务唯一标识
        event_type: 事件类型，如 'progress', 'completed', 'failed'
        data: 事件数据（字典）
    """
    if task_id in sse_queues:
        try:
            payload = json.dumps({
                'data': data,
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            })
            # SSE格式：event行指定事件名，data行传数据
            sse_queues[task_id].put((event_type, payload))
        except Exception as e:
            print(f"[SSE推送失败] task_id={task_id}, 错误={e}")


def process_task(task_id, filepath, instrument_ids, title):
    """
    核心处理流程（在后台异步线程中执行）。

    处理步骤：
    1. 调用 audio_processor.process_audio() 将音频转为MIDI（传入instrument_ids）
    2. 调用 sheet_renderer.render_sheet() 生成五线谱图片
    3. 对每个选定乐器调用 soundfont_synthesizer.synthesize_audio() 生成音频
    4. 更新任务状态为完成，保存结果文件路径
    5. 通过SSE推送完成通知

    参数:
        task_id: 任务唯一标识
        filepath: 上传的音频文件路径（或demo生成的WAV路径）
        instrument_ids: 选定的乐器ID列表，如 ["violin", "guqin"]
        title: 曲名标题
    """
    output_dir = app.config['OUTPUT_FOLDER']

    try:
        # ===== 第1步：音频处理 → 提取旋律生成MIDI =====
        # process_audio 接收 instrument_ids，自动计算音域交集进行适配
        notify_sse(task_id, 'progress', {'step': 1, 'message': '正在提取旋律...'})
        result = audio_processor.process_audio(filepath, output_dir, instrument_ids=instrument_ids)
        midi_path = result['midi_path']

        # 获取第一个乐器的中文名称用于乐谱标题
        first_instrument = instruments_data.get_instrument(instrument_ids[0]) \
            if instrument_ids else instruments_data.get_instrument('violin')
        instrument_name = first_instrument['name'] if first_instrument else '小提琴'

        # 更新任务状态：记录MIDI文件
        tasks[task_id]['midi_file'] = os.path.basename(midi_path)
        notify_sse(task_id, 'progress', {'step': 2, 'message': 'MIDI生成完成，正在渲染乐谱...'})

        # ===== 第2步：渲染五线谱图片 =====
        sheet_filename = f"sheet_{task_id}.png"
        sheet_path = os.path.join(output_dir, sheet_filename)
        sheet_renderer.render_sheet(
            midi_path,
            sheet_path,
            title=title,
            instrument=instrument_name
        )
        tasks[task_id]['sheet_image'] = sheet_filename
        notify_sse(task_id, 'progress', {'step': 3, 'message': '乐谱渲染完成，正在合成音频...'})

        # ===== 第3步：为每个选定乐器合成音频 =====
        audio_files = {}
        for idx, inst_id in enumerate(instrument_ids):
            inst_info = instruments_data.get_instrument(inst_id)
            inst_name = inst_info['name'] if inst_info else inst_id
            notify_sse(task_id, 'progress', {
                'step': 3,
                'sub_step': idx + 1,
                'total': len(instrument_ids),
                'message': f'正在合成 {inst_name} 音频...',
            })
            audio_filename = f"audio_{inst_id}_{task_id}.wav"
            audio_path = os.path.join(output_dir, audio_filename)
            soundfont_synthesizer.synthesize_audio(
                midi_path,
                audio_path,
                instrument=inst_id
            )
            audio_files[inst_id] = audio_filename

        # ===== 第4步：更新任务状态为完成 =====
        tasks[task_id]['status'] = 'completed'
        tasks[task_id]['audio_files'] = audio_files
        print(f"[任务完成] task_id={task_id}, 标题={title}")

        # ===== 第5步：通过SSE推送完成通知 =====
        # 构建结果数据
        audio_list = []
        for inst_id, filename in audio_files.items():
            inst_info = instruments_data.get_instrument(inst_id)
            audio_list.append({
                'instrument_id': inst_id,
                'instrument_name': inst_info['name'] if inst_info else inst_id,
                'filename': filename,
                'url': f'/output/{filename}',
            })

        notify_sse(task_id, 'completed', {
            'task_id': task_id,
            'midi_file': os.path.basename(midi_path),
            'midi_url': f"/output/{os.path.basename(midi_path)}",
            'sheet_image': sheet_filename,
            'sheet_url': f"/output/{sheet_filename}",
            'audio_files': audio_list,
            'notes_count': result['notes_count'],
            'rest_count': result['rest_count'],
        })

        # 推送一个结束标记，关闭SSE连接
        if task_id in sse_queues:
            sse_queues[task_id].put(None)

    except Exception as e:
        # 处理失败，记录错误信息
        tasks[task_id]['status'] = 'failed'
        tasks[task_id]['error'] = str(e)
        print(f"[任务失败] task_id={task_id}, 错误={e}")

        # 通过SSE推送失败通知
        notify_sse(task_id, 'failed', {
            'task_id': task_id,
            'error': str(e),
        })

        if task_id in sse_queues:
            sse_queues[task_id].put(None)


# ============================================================
# 路由定义
# ============================================================

@app.route('/')
def index():
    """主页路由"""
    return render_template('index.html')


@app.route('/api/instruments', methods=['GET'])
def get_instruments():
    """
    获取乐器列表 API
    返回所有乐器的简要信息列表（JSON格式）
    """
    instruments_list = instruments_data.get_instruments_list()
    return jsonify({
        'success': True,
        'data': instruments_list
    })


@app.route('/api/instruments/<instrument_id>', methods=['GET'])
def get_instrument_detail(instrument_id):
    """
    获取单个乐器详情 API
    根据乐器ID返回完整的乐器数据（JSON格式）

    参数:
        instrument_id: 乐器ID，如 violin, guqin, erhu, pipa, guzheng
    """
    instrument = instruments_data.get_instrument(instrument_id)
    if instrument is None:
        return jsonify({
            'success': False,
            'error': f'未找到乐器: {instrument_id}'
        }), 404

    return jsonify({
        'success': True,
        'data': instrument
    })


@app.route('/api/upload', methods=['POST'])
def upload_audio():
    """
    上传音频文件 API
    接收音频文件和乐器选择参数，创建后台处理任务。

    表单参数:
        file: 音频文件（wav, mp3, flac, ogg）
        instruments: JSON字符串，如 '["violin","guqin","erhu"]'
        title: 曲名标题（默认"未命名曲调"）

    返回:
        JSON: 包含 task_id，用于后续查询任务状态或SSE订阅
    """
    # 检查是否有文件上传
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': '未上传文件'}), 400

    file = request.files['file']

    # 检查文件名是否为空
    if file.filename == '':
        return jsonify({'success': False, 'error': '文件名为空'}), 400

    # 检查文件格式
    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': f'不支持的文件格式，仅支持: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400

    # 解析乐器选择参数
    instruments_str = request.form.get('instruments', '["violin"]')
    try:
        instrument_ids = json.loads(instruments_str)
        if not isinstance(instrument_ids, list):
            instrument_ids = ['violin']
    except (json.JSONDecodeError, TypeError):
        instrument_ids = ['violin']

    # 解析曲名标题
    title = request.form.get('title', '').strip()
    if not title:
        title = '未命名曲调'

    # 验证乐器ID是否有效
    for inst_id in instrument_ids:
        if instruments_data.get_instrument(inst_id) is None:
            return jsonify({
                'success': False,
                'error': f'未知乐器: {inst_id}'
            }), 400

    # 生成唯一的任务ID
    task_id = uuid.uuid4().hex[:12]

    # 保存上传的文件（使用task_id作为文件名前缀避免冲突）
    upload_dir = app.config['UPLOAD_FOLDER']
    ext = file.filename.rsplit('.', 1)[1].lower()
    save_filename = f"input_{task_id}.{ext}"
    save_path = os.path.join(upload_dir, save_filename)
    file.save(save_path)

    # 初始化任务状态
    tasks[task_id] = {
        'status': 'processing',
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'instrument_ids': instrument_ids,
        'title': title,
        'sheet_image': None,        # 完成后填充
        'audio_files': {},          # 完成后填充
        'midi_file': None,          # 完成后填充
        'error': None,
    }

    # 创建SSE消息队列
    sse_queues[task_id] = queue.Queue()

    # 启动后台线程处理任务（不阻塞当前请求）
    thread = threading.Thread(
        target=process_task,
        args=(task_id, save_path, instrument_ids, title),
        daemon=True
    )
    thread.start()

    return jsonify({
        'success': True,
        'task_id': task_id,
        'message': '文件上传成功，任务已开始处理',
        'stream_url': f'/api/task/{task_id}/stream',  # SSE订阅地址
    })


@app.route('/api/task/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """
    查询任务状态 API
    返回指定任务的当前处理状态。

    参数:
        task_id: 任务唯一标识

    返回:
        JSON: 任务状态信息
    """
    task = tasks.get(task_id)
    if task is None:
        return jsonify({
            'success': False,
            'error': '未找到该任务'
        }), 404

    return jsonify({
        'success': True,
        'data': {
            'task_id': task_id,
            'status': task['status'],
            'created_at': task['created_at'],
            'instrument_ids': task['instrument_ids'],
            'error': task.get('error'),
        }
    })


@app.route('/api/task/<task_id>/stream', methods=['GET'])
def task_sse_stream(task_id):
    """
    SSE(Server-Sent Events)路由
    当任务完成/失败时通过SSE推送结果，替代前端3秒轮询。

    前端使用 EventSource API 连接此路由：
        const evtSource = new EventSource('/api/task/<task_id>/stream');

    参数:
        task_id: 任务唯一标识

    返回:
        text/event-stream: SSE事件流
    """
    task = tasks.get(task_id)
    if task is None:
        return jsonify({
            'success': False,
            'error': '未找到该任务'
        }), 404

    def generate():
        """
        SSE事件生成器。
        持续监听队列中的消息，有消息时立即推送。
        当收到None时（任务结束标志），关闭流。
        """
        q = sse_queues.get(task_id)
        if q is None:
            # 没有队列（任务可能已完成或不存在），直接返回当前状态
            task = tasks.get(task_id)
            if task:
                snapshot_data = json.dumps({
                    'task_id': task_id,
                    'status': task['status'],
                    'audio_files': task.get('audio_files', {}),
                    'error': task.get('error'),
                })
                evt = 'completed' if task['status'] == 'completed' else 'failed'
                yield f"event: {evt}\ndata: {snapshot_data}\n\n"
            return

        # 发送初始连接确认（使用默认message事件）
        task = tasks.get(task_id)
        task_status = task['status'] if task else 'unknown'
        connect_msg = json.dumps({'task_id': task_id, 'status': task_status})
        yield f"data: {connect_msg}\n\n"

        # 如果任务已经完成，直接推送结果并关闭
        if task_status in ('completed', 'failed'):
            evt = 'completed' if task_status == 'completed' else 'failed'
            result_data = json.dumps({
                'task_id': task_id,
                'status': task_status,
                'audio_files': task.get('audio_files', {}),
                'error': task.get('error'),
            })
            yield f"event: {evt}\ndata: {result_data}\n\n"
            return

        # 持续监听队列
        try:
            while True:
                try:
                    # 设置超时，避免永久阻塞（每30秒发送一次心跳）
                    msg = q.get(timeout=30)
                    if msg is None:
                        # 收到结束标记
                        break
                    # msg 是 (event_type, payload) 元组
                    event_type, payload = msg
                    yield f"event: {event_type}\ndata: {payload}\n\n"
                except queue.Empty:
                    # 超时，发送心跳保持连接（使用默认message事件）
                    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    task_status = task['status'] if task else 'unknown'
                    heartbeat = json.dumps({'status': task_status, 'timestamp': ts})
                    yield f"data: {heartbeat}\n\n"
        except GeneratorExit:
            # 客户端断开连接
            pass
        finally:
            # 清理队列
            if task_id in sse_queues:
                del sse_queues[task_id]

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',  # 禁用nginx缓冲
        }
    )


@app.route('/api/result/<task_id>', methods=['GET'])
def get_task_result(task_id):
    """
    获取任务结果 API
    返回已完成任务的乐谱图片路径、音频文件路径等信息。

    参数:
        task_id: 任务唯一标识

    返回:
        JSON: 包含所有结果文件的访问路径
    """
    task = tasks.get(task_id)
    if task is None:
        return jsonify({
            'success': False,
            'error': '未找到该任务'
        }), 404

    if task['status'] == 'processing':
        return jsonify({
            'success': True,
            'data': {
                'task_id': task_id,
                'status': 'processing',
                'message': '任务正在处理中，请稍后查询'
            }
        })

    if task['status'] == 'failed':
        return jsonify({
            'success': False,
            'data': {
                'task_id': task_id,
                'status': 'failed',
                'error': task.get('error', '处理失败')
            }
        }), 500

    # 任务完成，返回结果
    audio_list = []
    for inst_id, filename in task.get('audio_files', {}).items():
        inst_info = instruments_data.get_instrument(inst_id)
        audio_list.append({
            'instrument_id': inst_id,
            'instrument_name': inst_info['name'] if inst_info else inst_id,
            'filename': filename,
            'url': f'/output/{filename}',
        })

    result = {
        'task_id': task_id,
        'status': 'completed',
        'created_at': task['created_at'],
        'instrument_ids': task['instrument_ids'],
        'sheet_image': task.get('sheet_image'),
        'sheet_url': f"/output/{task['sheet_image']}" if task.get('sheet_image') else None,
        'midi_file': task.get('midi_file'),
        'midi_url': f"/output/{task['midi_file']}" if task.get('midi_file') else None,
        'audio_files': audio_list,
    }

    return jsonify({
        'success': True,
        'data': result
    })


@app.route('/api/bpm', methods=['POST'])
def detect_bpm():
    """
    BPM检测 API
    使用librosa对上传的音频文件进行BPM（每分钟拍数）检测。

    表单参数:
        file: 音频文件（wav, mp3, flac, ogg）

    返回:
        JSON: 包含估算的BPM值
    """
    # 检查是否有文件上传
    if 'file' not in request.files:
        return jsonify({'success': False, 'error': '未上传文件'}), 400

    file = request.files['file']

    # 检查文件名是否为空
    if file.filename == '':
        return jsonify({'success': False, 'error': '文件名为空'}), 400

    # 检查文件格式
    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': f'不支持的文件格式，仅支持: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400

    try:
        import librosa

        # 临时保存文件
        upload_dir = app.config['UPLOAD_FOLDER']
        temp_filename = f"temp_bpm_{uuid.uuid4().hex[:8]}.{file.filename.rsplit('.', 1)[1].lower()}"
        temp_path = os.path.join(upload_dir, temp_filename)
        file.save(temp_path)

        try:
            # 使用librosa进行BPM检测
            # 加载音频
            y, sr = librosa.load(temp_path, sr=22050, mono=True)

            # 使用librosa.beat.beat_track检测BPM
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)

            # tempo可能是数组，取第一个值
            if hasattr(tempo, '__iter__'):
                bpm_value = float(tempo[0]) if len(tempo) > 0 else 120.0
            else:
                bpm_value = float(tempo)

            # 限制BPM在合理范围内
            bpm_value = max(40.0, min(240.0, bpm_value))

            return jsonify({
                'success': True,
                'data': {
                    'bpm': round(bpm_value, 1),
                    'message': f'检测到BPM: {bpm_value:.1f}',
                }
            })
        finally:
            # 清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except ImportError:
        return jsonify({
            'success': False,
            'error': 'BPM检测功能需要librosa库，请先安装: pip install librosa'
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'BPM检测失败: {str(e)}'
        }), 500


@app.route('/output/<filename>', methods=['GET'])
def serve_output_file(filename):
    """
    提供输出文件的静态下载/访问
    用于乐谱图片、音频文件、MIDI文件的HTTP访问

    参数:
        filename: 文件名（如 sheet_xxx.png, audio_violin_xxx.wav）
    """
    output_dir = app.config['OUTPUT_FOLDER']
    return send_from_directory(output_dir, filename)


@app.route('/api/demo', methods=['GET'])
def run_demo():
    """
    Demo演示 API
    生成一个简单的C大调音阶WAV文件，然后走正常的音频处理流程。
    可用于前端快速体验完整功能，无需上传音频。

    查询参数:
        instruments: JSON字符串，如 '["violin","guqin"]'
        title: 曲名标题（默认"Demo - C大调音阶"）

    返回:
        JSON: 包含 task_id 和 stream_url
    """
    # 解析乐器选择参数（支持JSON数组或逗号分隔字符串）
    instruments_str = request.args.get('instruments', '["violin"]')
    try:
        instrument_ids = json.loads(instruments_str)
        if not isinstance(instrument_ids, list):
            instrument_ids = ['violin']
    except (json.JSONDecodeError, TypeError):
        # fallback: 逗号分隔
        instrument_ids = [s.strip() for s in instruments_str.split(',') if s.strip()]
        if not instrument_ids:
            instrument_ids = ['violin']

    # 解析曲名标题
    title = request.args.get('title', 'Demo - C大调音阶')

    # 验证乐器ID是否有效
    for inst_id in instrument_ids:
        if instruments_data.get_instrument(inst_id) is None:
            return jsonify({
                'success': False,
                'error': f'未知乐器: {inst_id}'
            }), 400

    # 生成唯一的任务ID
    task_id = uuid.uuid4().hex[:12]

    # 生成Demo用的WAV音频文件（保存到uploads目录）
    upload_dir = app.config['UPLOAD_FOLDER']
    demo_filename = f"demo_{task_id}.wav"
    demo_path = os.path.join(upload_dir, demo_filename)

    # 初始化任务状态
    tasks[task_id] = {
        'status': 'processing',
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'instrument_ids': instrument_ids,
        'title': title,
        'sheet_image': None,
        'audio_files': {},
        'midi_file': None,
        'error': None,
    }

    # 创建SSE消息队列
    sse_queues[task_id] = queue.Queue()

    # 启动后台线程：先生成Demo音频，再走正常处理流程
    def demo_workflow():
        try:
            # 生成Demo WAV文件（C大调音阶）
            generate_demo_wav(demo_path)
            # 走正常处理流程
            process_task(task_id, demo_path, instrument_ids, title)
        except Exception as e:
            tasks[task_id]['status'] = 'failed'
            tasks[task_id]['error'] = str(e)
            notify_sse(task_id, 'failed', {'task_id': task_id, 'error': str(e)})
            print(f"[Demo失败] task_id={task_id}, 错误={e}")

    thread = threading.Thread(target=demo_workflow, daemon=True)
    thread.start()

    return jsonify({
        'success': True,
        'task_id': task_id,
        'message': 'Demo任务已开始处理',
        'stream_url': f'/api/task/{task_id}/stream',  # SSE订阅地址
    })


# ============================================================
# 启动入口
# ============================================================

if __name__ == '__main__':
    # 确保必要的目录存在
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['OUTPUT_FOLDER'], exist_ok=True)
    print("=== 弦音工坊 Web 服务启动（改进版） ===")
    print(f"上传目录: {app.config['UPLOAD_FOLDER']}")
    print(f"输出目录: {app.config['OUTPUT_FOLDER']}")
    print("新增功能: SSE推送 /api/task/<task_id>/stream")
    print("新增功能: BPM检测 /api/bpm")
    print("访问地址: http://0.0.0.0:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
