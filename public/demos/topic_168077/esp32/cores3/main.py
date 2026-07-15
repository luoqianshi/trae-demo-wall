"""
Coin Kids - M5Stack CoreS3 统一固件 (UIFlow2/MicroPython)
===========================================================
一台设备实现全部功能：
  1. 起床打卡（RFID刷卡 + 数学题 + 最多5次重试）
  2. 睡觉检测（内置麦克风 + 提醒 + 阈值校准）
  3. RFID录入模式
  4. 无RFID时自动降级为纯答题+睡眠检测模式

MQTT 话题:
  发布: coin-kids/device/{id}/rfid      → RFID刷卡
  发布: coin-kids/device/{id}/result    → 答题结果
  发布: coin-kids/device/{id}/sound     → 声音检测
  发布: coin-kids/device/{id}/enroll    → RFID录入
  发布: coin-kids/device/{id}/photo_meta → 照片元数据
  发布: coin-kids/device/{id}/photo     → 照片二进制数据
  订阅: coin-kids/device/{id}/child_info  → 孩子信息
  订阅: coin-kids/device/{id}/command   → 指令
  订阅: coin-kids/device/{id}/sleep-config → 睡觉检测配置
  订阅: coin-kids/device/{id}/error     → 错误消息
"""

import ujson
import utime
import _thread
import sys
import os
import camera

# ============================================================
# 配置加载
# ============================================================

def load_config():
    try:
        with open("/flash/apps/config.json", "r") as f:
            return ujson.load(f)
    except:
        print("[错误] 无法加载 config.json")
        return {}

CFG = load_config()

DEVICE_ID = CFG.get("device_id", "cores3-default")
MQTT_BROKER = CFG.get("mqtt_broker", "broker.emqx.io")
SLEEP_TIMEOUT = CFG.get("sleep_timeout_sec", 30)

WAKE_UP_CFG = CFG.get("wake_up", {})
RFID_CFG = CFG.get("rfid", {})
SLEEP_CFG = CFG.get("sleep_check", {})

MAX_ATTEMPTS = WAKE_UP_CFG.get("max_attempts", 5)
WAKE_START = WAKE_UP_CFG.get("start_time", "06:00")
WAKE_END = WAKE_UP_CFG.get("end_time", "08:00")

# ============================================================
# M5Stack 硬件初始化（UIFlow2 标准 API）
# ============================================================

LCD = None
TOUCH = None
rfid_device = None
rfid_available = False
sound_buf = bytearray(2048)  # 声音检测缓冲区
camera_initialized = False
PHOTO_DIR = "/flash/apps/photos"  # TF卡照片目录

# 波形显示缓冲区
SOUND_BUF_SIZE = 64
sound_levels = [0] * SOUND_BUF_SIZE  # 环形缓冲区
sound_idx = 0
current_sound_level = 0       # 最新声音级别
waveform_cycle = 0            # 波形更新计数器

try:
    import M5
    from M5 import *
    M5.begin()
    Speaker.begin()
    Speaker.setVolumePercentage(50)
    LCD = M5.Lcd
    # 设置内置中文字体（EFontCN24 支持中文显示）
    try:
        LCD.setFont(M5.Lcd.FONTS.EFontCN24)
        print("[字体] 设置中文字体成功")
    except:
        print("[字体] 设置中文字体失败，使用默认字体")
    TOUCH = M5.Touch
    # Speaker 和 Mic 在 from M5 import * 后为全局变量
    print("[硬件] M5Stack CoreS3 初始化成功")
except ImportError:
    print("[警告] 未检测到 M5Stack 库，使用模拟模式")

# ============================================================
# WiFi & MQTT
# ============================================================

import network
from umqtt.simple import MQTTClient

mqtt_client = None
mqtt_connected = False
mqtt_subscribed_topics = []  # 保存订阅话题，重连后重新订阅
last_mqtt_reconnect = 0     # 上次重连时间（ticks）
mqtt_reconnect_interval = 30  # 重连间隔（秒）

def connect_wifi():
    """检查WiFi连接状态（UIFlow2系统已自动连接WiFi）"""
    wlan = network.WLAN(network.STA_IF)
    if wlan.isconnected():
        ip = wlan.ifconfig()[0]
        print(f"[WiFi] 已连接: {ip}")
        return True
    print("[WiFi] 未连接，等待系统自动连接...")
    for _ in range(30):
        utime.sleep(1)
        if wlan.isconnected():
            ip = wlan.ifconfig()[0]
            print(f"[WiFi] 已连接: {ip}")
            return True
    print("[WiFi] 连接超时")
    return False

def sync_time():
    """通过 NTP 同步系统时间，失败时静默降级"""
    try:
        import ntptime
        # MicroPython 默认 NTP 池，设置时区偏移（UTC+8）
        ntptime.settime()
        t = utime.localtime()
        print(f"[NTP] 时间同步成功: {t[0]:04d}-{t[1]:02d}-{t[2]:02d} {t[3]:02d}:{t[4]:02d}:{t[5]:02d}")
        return True
    except Exception as e:
        print(f"[NTP] 时间同步失败（使用系统时间）: {e}")
        return False

def mqtt_callback(topic, msg):
    topic = topic.decode() if isinstance(topic, bytes) else topic
    msg = msg.decode() if isinstance(msg, bytes) else msg
    print(f"[MQTT] <- {topic}")
    if topic == f"coin-kids/device/{DEVICE_ID}/child_info":
        on_child_info(msg)
    elif topic == f"coin-kids/device/{DEVICE_ID}/command":
        on_command(msg)
    elif topic == f"coin-kids/device/{DEVICE_ID}/sleep-config":
        on_sleep_config(msg)
    elif topic == f"coin-kids/device/{DEVICE_ID}/error":
        on_error(msg)

def connect_mqtt():
    global mqtt_client, mqtt_connected, mqtt_subscribed_topics
    client_id = f"coin-kids-{DEVICE_ID}"
    try:
        mqtt_client = MQTTClient(client_id, MQTT_BROKER, keepalive=60)
        mqtt_client.set_callback(mqtt_callback)
        mqtt_client.connect()
        mqtt_connected = True
        print("[MQTT] 连接成功")

        mqtt_subscribed_topics = [
            f"coin-kids/device/{DEVICE_ID}/child_info",
            f"coin-kids/device/{DEVICE_ID}/command",
            f"coin-kids/device/{DEVICE_ID}/sleep-config",
            f"coin-kids/device/{DEVICE_ID}/error",
        ]
        for t in mqtt_subscribed_topics:
            mqtt_client.subscribe(t)
            print(f"[MQTT] 订阅: {t}")
        return True
    except Exception as e:
        print(f"[MQTT] 连接失败: {e}")
        mqtt_connected = False
        return False

def mqtt_publish(suffix, data):
    if not mqtt_connected or mqtt_client is None:
        return
    topic = f"coin-kids/device/{DEVICE_ID}/{suffix}"
    payload = ujson.dumps(data) if isinstance(data, dict) else str(data)
    try:
        mqtt_client.publish(topic, payload)
        print(f"[MQTT] -> {topic}")
    except Exception as e:
        print(f"[MQTT] 发布失败: {e}")

def mqtt_check():
    global mqtt_client, mqtt_connected, last_mqtt_reconnect
    if mqtt_client is not None and mqtt_connected:
        try:
            mqtt_client.check_msg()
        except Exception as e:
            print(f"[MQTT] 连接断开: {e}")
            mqtt_connected = False
            try:
                mqtt_client.disconnect()
            except:
                pass
            mqtt_client = None
    # 自动重连
    if not mqtt_connected and utime.time() - last_mqtt_reconnect > mqtt_reconnect_interval:
        last_mqtt_reconnect = utime.time()
        print("[MQTT] 尝试重连...")
        connect_mqtt()

# ============================================================
# 屏幕绘制
# ============================================================

W = 320
H = 240
CONTENT_H = 190  # 主内容区高度（顶部），底部 50px 留给波形
WAVE_Y = 192     # 波形区域起始Y
WAVE_H = 46      # 波形区域高度
BLACK = 0x000000
WHITE = 0xFFFFFF
RED = 0xFF0000
GREEN = 0x00FF00
BLUE = 0x0000FF
YELLOW = 0xFFFF00
ORANGE = 0xFFA500
GRAY = 0x888888
LIGHT_GRAY = 0xCCCCCC
DARK_GRAY = 0x333333
CYAN = 0x00FFFF
BTN_NUM = 0x2C3E50
BTN_OK = 0x27AE60
BTN_BACK = 0xC0392B

# 数字键盘按钮区域
KB = []  # 由 _build_keyboard 填充

def _build_keyboard():
    global KB
    KB = []
    kb_y = 100
    kb_w = 40
    kb_h = 18
    gap = 3
    sx = (W - (3 * kb_w + 2 * gap)) // 2  # 居中
    rows = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
    ]
    for r, row in enumerate(rows):
        for c, label in enumerate(row):
            x = sx + c * (kb_w + gap)
            y = kb_y + r * (kb_h + gap)
            KB.append({"x": x, "y": y, "w": kb_w, "h": kb_h, "label": label, "value": label, "color": BTN_NUM})
    # 第四行: ⌫ 0 OK
    by = kb_y + 3 * (kb_h + gap)
    KB.append({"x": sx, "y": by, "w": kb_w, "h": kb_h, "label": "⌫", "value": "back", "color": BTN_BACK})
    KB.append({"x": sx + kb_w + gap, "y": by, "w": kb_w, "h": kb_h, "label": "0", "value": "0", "color": BTN_NUM})
    KB.append({"x": sx + 2 * (kb_w + gap), "y": by, "w": kb_w, "h": kb_h, "label": "OK", "value": "submit", "color": BTN_OK})

_build_keyboard()

def scr_fill(c):
    if LCD: LCD.clear(c)

def scr_fill_content(c):
    """仅填充主内容区（0-CONTENT_H），保留底部波形区域"""
    if LCD:
        LCD.fillRect(0, 0, W, CONTENT_H, c)

def scr_clear_bottom():
    """清除底部波形区域"""
    if LCD:
        LCD.fillRect(0, CONTENT_H, W, H - CONTENT_H, BLACK)

def scr_text(s, x, y, c=WHITE, size=1):
    if LCD:
        LCD.setTextSize(size)
        LCD.setCursor(x, y)
        LCD.print(s, c)

def scr_text_center(s, y, c=WHITE, size=1):
    if LCD:
        LCD.setTextSize(size)
        tw = LCD.textWidth(s)
        LCD.setCursor((W - tw) // 2, y)
        LCD.print(s, c)

def scr_rect(x, y, w, h, c, outline=False):
    if LCD:
        if outline:
            LCD.rect(x, y, w, h, c)
        else:
            LCD.fillRect(x, y, w, h, c)

def scr_brightness(v):
    if LCD:
        try:
            LCD.setBrightness(v)
        except:
            pass

def _draw_btn(btn):
    scr_rect(btn["x"], btn["y"], btn["w"], btn["h"], btn["color"])
    scr_text_center(btn["label"], btn["y"] + (btn["h"] - 8) // 2, WHITE)

def _draw_btn_pressed(btn):
    scr_rect(btn["x"], btn["y"], btn["w"], btn["h"], YELLOW)
    scr_text_center(btn["label"], btn["y"] + (btn["h"] - 8) // 2, BLACK)

def draw_keyboard():
    for b in KB:
        _draw_btn(b)

def hit_test(tx, ty):
    for b in KB:
        if b["x"] <= tx <= b["x"] + b["w"] and b["y"] <= ty <= b["y"] + b["h"]:
            return b
    return None

def btn_effect(btn):
    _draw_btn_pressed(btn)
    utime.sleep_ms(80)
    _draw_btn(btn)

# ---- 界面绘制函数 ----

def draw_idle():
    global idle_msg
    scr_text_center("Coin Kids", 10, CYAN, 1)
    scr_text_center(f"设备: {DEVICE_ID}", 30, GRAY)
    if rfid_available:
        scr_text_center("请刷卡答题", 60, WHITE, 1)
    else:
        scr_text_center("无RFID模式（等待指令）", 60, ORANGE, 1)
    if sleep_cfg.get("is_enabled", True):
        scr_text_center(f"睡眠检测: {sleep_cfg['start_time']}~{sleep_cfg['end_time']}", 90, DARK_GRAY)
    scr_text_center(f"打卡: {WAKE_START}~{WAKE_END}", 110, DARK_GRAY)
    scr_text_center(idle_msg, 150, GRAY)

def draw_math_ui(child_name, expression, answer_input, remaining_sec, attempt, max_attempts):
    # 标题
    scr_rect(0, 0, W, 20, DARK_GRAY)
    scr_text("起床打卡", 4, 2, WHITE)
    nw = LCD.textWidth(child_name) if LCD else 0
    scr_text(child_name, W - nw - 4, 2, YELLOW)

    # 题目
    scr_text_center(expression, 28, WHITE, 1)

    # 答案框
    scr_rect(50, 48, 220, 24, DARK_GRAY)
    if answer_input:
        scr_text_center(answer_input, 50, GREEN, 1)
    else:
        scr_text_center("输入答案", 50, GRAY, 1)

    # 倒计时 + 尝试次数
    timer_str = f"剩余{remaining_sec}s"
    scr_text(timer_str, W - 60, 78, RED if remaining_sec <= 10 else WHITE, 1)
    scr_text(f"第{attempt}/{max_attempts}次", 4, 78, LIGHT_GRAY, 1)

    # 键盘
    draw_keyboard()

def draw_result(correct, child_name, problem, user_answer, attempt, attempts):
    if correct:
        scr_text_center("回答正确!", 20, GREEN, 1)
        scr_text_center(f"{child_name} 打卡成功", 50, WHITE)
    else:
        scr_text_center("回答错误", 20, RED, 1)
        scr_text_center(f"题目: {problem}", 50, WHITE)
        scr_text_center(f"你的答案: {user_answer}", 75, ORANGE)
        scr_text_center(f"已用完{attempts}次机会", 100, GRAY)
    scr_text_center("3秒后返回", 150, GRAY)

def draw_waiting(msg="等待服务器..."):
    scr_text_center(msg, 80, YELLOW, 1)

def draw_sleep_reminder(remaining_min):
    scr_text_center("睡觉提醒", 10, ORANGE, 1)
    scr_text_center(f"还有 {remaining_min} 分钟", 40, WHITE)
    scr_text_center("快去睡觉吧!", 80, CYAN)
    scr_text_center("保持安静哦", 120, GRAY)

def draw_sleep_checking():
    scr_text_center("睡觉检测中...", 20, GREEN, 1)
    scr_text_center("正在监测声音", 60, GRAY)
    scr_text_center("请保持安静", 90, GRAY)

def draw_calibrate(level, threshold):
    scr_text_center("阈值校准模式", 10, CYAN, 1)
    scr_text_center(f"当前音量: {level}", 40, WHITE, 1)
    scr_text_center(f"阈值: {threshold}", 70, YELLOW)
    # 音量条
    bar_w = min(300, int(level / 10))
    scr_rect(10, 100, bar_w, 20, GREEN if level < threshold else RED)
    scr_rect(10, 100, 300, 20, WHITE, outline=True)
    # 阈值线
    th_x = int(threshold / 10)
    scr_rect(th_x, 95, 2, 30, RED)
    scr_text_center("触摸退出校准", 150, GRAY)

def draw_enroll(count):
    scr_text_center("RFID 录入模式", 15, CYAN, 1)
    scr_text_center("请依次刷卡...", 50, WHITE)
    scr_text_center(f"已录入: {count} 张", 90, GREEN)
    scr_text_center("触摸退出", 150, GRAY)

# ============================================================
# 波形绘制
# ============================================================

def draw_waveform():
    """在底部 20% 区域绘制声音波形（非阻塞，每次更新 64 个柱状条）"""
    global sound_levels, sound_idx, current_sound_level

    if not LCD:
        return

    # 分隔线
    LCD.fillRect(0, 190, W, 2, DARK_GRAY)

    # 清除波形区域
    LCD.fillRect(0, WAVE_Y, W, WAVE_H, BLACK)

    # 音量文本
    col = GREEN if current_sound_level < 80 else YELLOW if current_sound_level < 300 else RED
    LCD.setTextSize(1)
    LCD.setCursor(2, WAVE_Y + 2)
    LCD.print(f"音量:{current_sound_level}", col)

    # 绘制柱状波形
    bw = 5   # 柱宽+间隔
    bh_max = 36  # 最大柱高
    wy = WAVE_Y + 4  # 波形起始Y
    n_bars = min(SOUND_BUF_SIZE, (W - 80) // bw)  # 剩余宽度可容纳的柱数
    for i in range(n_bars):
        idx = (sound_idx + i) % SOUND_BUF_SIZE
        val = sound_levels[idx]
        bh = 1 + int(val / 2000 * bh_max)  # 0-2000 映射到 1-36
        if bh > bh_max:
            bh = bh_max
        x = 80 + i * bw
        bar_col = GREEN if val < 80 else YELLOW if val < 300 else RED
        LCD.fillRect(x, wy + bh_max - bh, 4, bh, bar_col)

    # 阈值线
    threshold = sleep_cfg.get("sound_threshold", 100)
    th_x = 80 + int(threshold / 2000 * n_bars * bw)
    if th_x < 80:
        th_x = 80
    LCD.fillRect(th_x, wy, 2, bh_max, RED)

# ============================================================
# 统一顶部内容绘制（主循环调用）
# ============================================================

def draw_top():
    """清除顶部内容区并重新绘制当前模式的内容"""
    with mode_lock:
        m = mode
    scr_fill_content(BLACK)
    if m == MODE_IDLE:
        draw_idle()
    elif m == MODE_WAITING_INFO:
        draw_waiting()
    elif m == MODE_ANSWERING and child_info:
        remaining = max(0, math_timeout - int(utime.time() - math_start)) if math_start else math_timeout
        draw_math_ui(child_info.get("child_name", ""), current_expr, user_input, remaining, attempt + 1, child_info.get("max_attempts", 5))
    elif m == MODE_SHOWING_RESULT:
        draw_result(result_correct, result_child_name, result_problem, result_user_answer, result_attempt, result_attempts)
    elif m == MODE_SLEEP_CHECK:
        draw_sleep_checking()
    elif m == MODE_CALIBRATE:
        draw_calibrate(current_sound_level, sleep_cfg.get("sound_threshold", 100))
    elif m == MODE_ENROLL:
        draw_enroll(enroll_count)

# ============================================================
# 摄像头 & 拍照
# ============================================================

def init_camera():
    """初始化摄像头"""
    global camera_initialized
    try:
        camera.init(pixformat=camera.RGB565, framesize=camera.QVGA)
        camera_initialized = True
        print("[摄像头] 初始化成功")
        return True
    except Exception as e:
        print(f"[摄像头] 初始化失败: {e}")
        return False

def ensure_photo_dir():
    """确保照片目录存在"""
    try:
        dirs = os.listdir("/flash/apps") if "/flash" in os.listdir("/") else []
        if "photos" not in dirs:
            os.mkdir(PHOTO_DIR)
        return True
    except:
        return False

def take_photo():
    """拍照并返回图像对象"""
    if not camera_initialized:
        return None
    try:
        img = camera.snapshot()
        if img:
            print("[拍照] 成功")
        return img
    except Exception as e:
        print(f"[拍照] 失败: {e}")
        return None

def save_photo(img, prefix="checkin"):
    """保存照片到TF卡，返回文件路径"""
    if img is None:
        return None
    try:
        ensure_photo_dir()
        t = utime.localtime()
        filename = f"{prefix}_{t[0]:04d}{t[1]:02d}{t[2]:02d}_{t[3]:02d}{t[4]:02d}{t[5]:02d}.jpg"
        filepath = f"{PHOTO_DIR}/{filename}"
        img.save(filepath)
        print(f"[照片] 已保存: {filepath}")
        cleanup_old_photos()
        return filepath
    except Exception as e:
        print(f"[照片] 保存失败: {e}")
        return None

def cleanup_old_photos(max_count=10):
    """超出max_count张图片后删除最旧的"""
    try:
        if not ensure_photo_dir():
            return
        files = []
        for f in os.listdir(PHOTO_DIR):
            if f.lower().endswith((".jpg", ".jpeg")):
                fpath = f"{PHOTO_DIR}/{f}"
                try:
                    stat = os.stat(fpath)
                    files.append((stat[8], fpath))  # stat[8] = mtime
                except:
                    pass
        if len(files) > max_count:
            files.sort()  # 按mtime排序，最旧在前
            for i in range(len(files) - max_count):
                try:
                    os.remove(files[i][1])
                    print(f"[照片] 删除旧照片: {files[i][1]}")
                except:
                    pass
    except Exception as e:
        print(f"[照片] 清理失败: {e}")

def upload_photo(filepath):
    """通过MQTT上传照片"""
    if filepath is None or not mqtt_connected:
        return
    try:
        with open(filepath, "rb") as f:
            img_data = f.read()
        # 发送元数据
        mqtt_publish("photo_meta", {
            "filename": filepath.split("/")[-1],
            "size": len(img_data),
            "timestamp": iso_now(),
        })
        # 发送图片二进制数据
        topic = f"coin-kids/device/{DEVICE_ID}/photo"
        mqtt_client.publish(topic, img_data)
        print(f"[照片] 已上传: {filepath} ({len(img_data)} bytes)")
    except Exception as e:
        print(f"[照片] 上传失败: {e}")

# ============================================================
# 声音检测
# ============================================================

def read_sound_level():
    """使用 Mic.record() 采集短时音频样本计算音量级别，放大 4x 提升灵敏度"""
    global sound_buf
    try:
        Mic.begin()
        # 记录约 128ms 的音频（8000Hz 采样率，2048 字节）
        Mic.record(sound_buf, 8000, False)
        timeout = 30
        while Mic.isRecording() and timeout > 0:
            utime.sleep_ms(5)
            timeout -= 1
        Mic.end()
        # 计算 RMS（均方根）并放大 4x 提升灵敏度
        total = 0
        count = 0
        for i in range(0, len(sound_buf), 2):
            if i + 1 < len(sound_buf):
                sample = (sound_buf[i + 1] << 8) | sound_buf[i]
                if sample > 32768:
                    sample -= 65536
                total += sample * sample
                count += 1
        rms = int((total / max(count, 1)) ** 0.5) if count > 0 else 0
        return min(rms * 8, 2000)  # 放大 8x，上限 2000
    except:
        return 0

def beep(freq=800, duration=150):
    try:
        Speaker.tone(freq, duration)
    except:
        pass

def beep_reminder():
    for _ in range(3):
        beep(1000, 200)
        utime.sleep_ms(300)

# ============================================================
# RFID 读卡
# ============================================================

def init_rfid():
    global rfid_device, rfid_available
    try:
        from hardware import I2C, Pin
        from unit import RFIDUnit
        scl = RFID_CFG.get("i2c_scl", 1)
        sda = RFID_CFG.get("i2c_sda", 2)
        addr = RFID_CFG.get("i2c_addr", 40)  # 0x28
        i2c = I2C(0, scl=Pin(scl), sda=Pin(sda), freq=100000)
        rfid_device = RFIDUnit(i2c, addr)
        rfid_available = True
        print("[RFID] RFID读卡器初始化成功")
        return True
    except Exception as e:
        print(f"[RFID] 初始化失败: {e}")
        print("[RFID] 将进入无RFID模式")
        return False

last_rfid_uid = ""
last_rfid_time = 0

def read_rfid():
    global last_rfid_uid, last_rfid_time
    if rfid_device is None:
        return None
    try:
        if not rfid_device.is_new_card_present():
            return None
        uid_bytes = rfid_device.read_card_uid()
        if not uid_bytes:
            return None
        uid = "".join(f"{b:02X}" for b in uid_bytes if b != 0)
        if len(uid) < 4:
            return None
        now = utime.ticks_ms()
        if uid == last_rfid_uid and utime.ticks_diff(now, last_rfid_time) < 1500:
            return None
        last_rfid_uid = uid
        last_rfid_time = now
        return uid
    except:
        return None

# ============================================================
# 数学题生成（设备端）
# ============================================================

import random

def gen_math():
    """生成三个两位数的四则运算题，返回 (表达式, 答案)"""
    a = random.randint(10, 99)
    b = random.randint(10, 99)
    c = random.randint(10, 99)
    ops = ["+", "-", "×", "÷"]
    for _ in range(20):
        o1 = random.randint(0, 3)
        o2 = random.randint(0, 3)
        mid, ok1 = _calc(a, o1, b)
        if not ok1:
            continue
        result, ok2 = _calc(mid, o2, c)
        if not ok2 or result < 0 or result > 9999:
            continue
        expr = f"{a} {ops[o1]} {b} {ops[o2]} {c} = ?"
        return expr, result
    expr = f"{a} + {b} + {c} = ?"
    return expr, a + b + c

def _calc(x, op, y):
    if op == 0: return x + y, True
    if op == 1:
        if x < y: return 0, False
        return x - y, True
    if op == 2: return x * y, True
    if op == 3:
        if y == 0 or x % y != 0: return 0, False
        return x // y, True
    return 0, False

# ============================================================
# 时间工具
# ============================================================

def now_hm():
    t = utime.localtime()
    return t[3], t[4]

def hm_to_min(h, m):
    return h * 60 + m

def is_in_range(now_h, now_m, start_s, end_s):
    sh, sm = map(int, start_s.split(":"))
    eh, em = map(int, end_s.split(":"))
    nm = hm_to_min(now_h, now_m)
    start = hm_to_min(sh, sm)
    end = hm_to_min(eh, em)
    if end < start:  # 跨午夜（如 21:00~00:00）
        return nm >= start or nm <= end
    return start <= nm <= end

def iso_now():
    t = utime.localtime()
    return f"{t[0]:04d}-{t[1]:02d}-{t[2]:02d}T{t[3]:02d}:{t[4]:02d}:{t[5]:02d}Z"

# ============================================================
# 全局状态机
# ============================================================

MODE_IDLE = 0
MODE_WAITING_INFO = 1   # 已刷卡，等待服务器返回孩子信息
MODE_ANSWERING = 2       # 正在答题
MODE_SHOWING_RESULT = 3  # 显示结果
MODE_SLEEP_CHECK = 4     # 睡觉检测
MODE_CALIBRATE = 5       # 阈值校准
MODE_ENROLL = 6          # RFID录入

mode = MODE_IDLE
mode_lock = _thread.allocate_lock()

# 答题状态
child_info = None        # {"log_id", "child_id", "child_name", "device_id", "max_attempts"}
current_expr = ""        # 当前数学题表达式
current_answer_val = 0   # 当前正确答案
user_input = ""          # 用户输入
attempt = 0              # 当前尝试次数
math_start = 0           # 答题开始时间(ticks)
math_timeout = 60        # 60秒超时
waiting_start = 0        # 等待 child_info 开始时间
waiting_timeout = 30     # 等待超时（秒）
last_activity = 0
last_drawn_mode = -1  # 跟踪上次绘制的模式，避免重复清除

# 睡觉检测状态
sleep_cfg = {
    "start_time": SLEEP_CFG.get("start_time", "22:00"),
    "end_time": SLEEP_CFG.get("end_time", "22:20"),
    "reminder_1_min": SLEEP_CFG.get("reminder_1_min", 20),
    "reminder_2_min": SLEEP_CFG.get("reminder_2_min", 10),
    "sound_threshold": SLEEP_CFG.get("sound_threshold", 100),
    "is_enabled": SLEEP_CFG.get("is_enabled", True),
}
reminder_1_done = False
reminder_2_done = False
last_sound_report = 0
last_day = 0
sleep_reminder_state = 0  # 0=无提醒, 1=提醒1显示中, 2=提醒2显示中, 3=声音检测提醒中
sleep_reminder_start = 0

# 显示状态缓存（供主循环绘制使用）
result_correct = False
result_child_name = ""
result_problem = ""
result_user_answer = ""
result_attempt = 0
result_attempts = 0
enroll_count = 0
sleep_reminder_shown = False  # 睡觉提醒是否正在显示
idle_msg = "触摸唤醒屏幕"     # 空闲模式下的提示文字

# ============================================================
# MQTT 消息处理
# ============================================================

def on_child_info(msg):
    global mode, child_info, current_expr, current_answer_val, user_input, attempt, math_start, waiting_start
    try:
        data = ujson.loads(msg)
    except:
        return
    child_info = data
    attempt = 0
    user_input = ""
    math_start = utime.time()
    waiting_start = 0  # 已收到，清除等待计时

    # 答题前拍照
    scr_brightness(128)
    utime.sleep(1)
    img = take_photo()
    if img:
        fpath = save_photo(img, "pre")
        if fpath:
            upload_photo(fpath)

    # 设备端生成数学题
    expr, ans = gen_math()
    current_expr = expr
    current_answer_val = ans

    print(f"[答题] 孩子: {data.get('child_name')}, 题目: {expr}, 答案: {ans}")
    mode = MODE_ANSWERING
    scr_brightness(128)

def on_command(msg):
    global mode, sleep_cfg
    try:
        data = ujson.loads(msg)
    except:
        data = {"cmd": msg}
    cmd = data.get("cmd", "")
    print(f"[指令] {cmd}")

    if cmd == "wake":
        scr_brightness(128)
        reset_idle()
    elif cmd == "sleep":
        scr_brightness(0)
    elif cmd == "reset":
        reset_idle()
    elif cmd == "enroll":
        with mode_lock:
            if mode == MODE_ENROLL:
                return
        _thread.start_new_thread(do_enroll, ())
    elif cmd == "calibrate":
        with mode_lock:
            if mode == MODE_CALIBRATE:
                return
            mode = MODE_CALIBRATE
        scr_brightness(128)
        _thread.start_new_thread(calibrate_loop, ())
    elif cmd == "stop_calibrate":
        with mode_lock:
            mode = MODE_IDLE
        reset_idle()

def on_sleep_config(msg):
    global sleep_cfg, reminder_1_done, reminder_2_done, sleep_reminder_state
    try:
        new_cfg = ujson.loads(msg)
        sleep_cfg.update(new_cfg)
        reminder_1_done = False
        reminder_2_done = False
        sleep_reminder_state = 0
        print("[配置] 睡觉检测配置已更新")
    except:
        pass

def on_error(msg):
    global mode
    try:
        data = ujson.loads(msg)
    except:
        data = {"error": msg}
    err = data.get("error", "未知错误")
    print(f"[错误] {err}")
    utime.sleep(3)
    reset_idle()

# ============================================================
# 答题流程
# ============================================================

def submit_answer():
    global mode, child_info, current_expr, current_answer_val, user_input, attempt, math_start
    global result_correct, result_child_name, result_problem, result_user_answer, result_attempt, result_attempts

    if not child_info:
        return

    correct = (user_input == str(current_answer_val))
    attempt += 1
    max_a = child_info.get("max_attempts", 5)
    now = iso_now()
    # 使用 math_start（出题时记录的时间）作为开始时间
    start_t = utime.localtime(math_start) if math_start else utime.localtime()
    start_time = f"{start_t[0]:04d}-{start_t[1]:02d}-{start_t[2]:02d}T{start_t[3]:02d}:{start_t[4]:02d}:{start_t[5]:02d}Z"

    print(f"[答题] 第{attempt}次: 输入={user_input}, 正确={correct}")

    if correct or attempt >= max_a:
        # 答题后拍照
        img = take_photo()
        if img:
            fpath = save_photo(img, "post")
            if fpath:
                upload_photo(fpath)

        # 上报最终结果
        result = {
            "log_id": child_info["log_id"],
            "child_id": child_info["child_id"],
            "correct": correct,
            "answer": user_input,
            "problem": current_expr,
            "attempt": attempt,
            "attempts": attempt,
            "start_time": start_time,
            "end_time": now,
        }
        mqtt_publish("result", result)

        # 存储结果缓存，主循环会绘制
        result_correct = correct
        result_child_name = child_info.get("child_name", "")
        result_problem = current_expr
        result_user_answer = user_input
        result_attempt = attempt
        result_attempts = attempt

        with mode_lock:
            mode = MODE_SHOWING_RESULT
        utime.sleep(3)
        reset_idle()
    else:
        # 答错，生成新题继续
        child_info["log_id"] = child_info.get("log_id", "")  # 保持同一个log_id
        expr, ans = gen_math()
        current_expr = expr
        current_answer_val = ans
        user_input = ""
        math_start = utime.time()

        scr_fill_content(BLACK)
        draw_math_ui(child_info.get("child_name", ""), expr, "", 60, attempt + 1, max_a)

def reset_idle():
    global mode, child_info, current_expr, current_answer_val, user_input, attempt, math_start, last_activity, waiting_start, idle_msg
    with mode_lock:
        mode = MODE_IDLE
    child_info = None
    current_expr = ""
    current_answer_val = 0
    user_input = ""
    attempt = 0
    math_start = 0
    waiting_start = 0
    last_activity = utime.time()
    idle_msg = "触摸唤醒屏幕"
    # 主循环会处理空闲超时熄屏，此处不再阻塞

# ============================================================
# RFID录入模式
# ============================================================

def do_enroll():
    global mode, enroll_count
    with mode_lock:
        mode = MODE_ENROLL
    scr_brightness(128)
    enroll_count = 0
    enrolled = []
    while enroll_count < 10:
        mqtt_check()
        # 触摸退出
        if TOUCH and M5.Touch.getCount():
            break
        uid = read_rfid()
        if uid and uid not in enrolled:
            enroll_count += 1
            enrolled.append(uid)
            print(f"[录入] #{enroll_count}: {uid}")
            mqtt_publish("enroll", {"uid": uid, "index": enroll_count})
            draw_top()
            utime.sleep(1)
        utime.sleep_ms(200)
    draw_top()
    scr_text_center("录入完成!", 180, GREEN)
    utime.sleep(3)
    reset_idle()

# ============================================================
# 阈值校准模式
# ============================================================

def calibrate_loop():
    global mode
    threshold = sleep_cfg.get("sound_threshold", 100)
    while True:
        with mode_lock:
            if mode != MODE_CALIBRATE:
                break
        # 不调用mqtt_check()，由主循环统一处理MQTT
        level = read_sound_level()
        draw_calibrate(level, threshold)
        # 触摸退出
        if TOUCH and M5.Touch.getCount():
            break
        utime.sleep_ms(300)
    reset_idle()

# ============================================================
# 触摸处理
# ============================================================

def handle_touch():
    global user_input, last_activity

    if not TOUCH:
        return

    if not M5.Touch.getCount():
        return

    tx = M5.Touch.getX()
    ty = M5.Touch.getY()
    scr_brightness(128)
    last_activity = utime.time()

    with mode_lock:
        cur_mode = mode
    if cur_mode == MODE_ANSWERING:
        btn = hit_test(tx, ty)
        if btn is None:
            return
        btn_effect(btn)
        val = btn["value"]
        if val == "back":
            user_input = user_input[:-1]
        elif val == "submit":
            if user_input:
                submit_answer()
                return
        else:
            if len(user_input) < 6:
                user_input += val
        remaining = max(0, math_timeout - int(utime.time() - math_start))
        draw_math_ui(child_info.get("child_name", ""), current_expr, user_input, remaining, attempt + 1, child_info.get("max_attempts", 5))
    elif cur_mode == MODE_IDLE:
        # 触摸唤醒屏幕（无RFID时不作为答题入口，仅唤醒）
        last_activity = utime.time()
        scr_brightness(128)
        idle_msg = "触摸唤醒屏幕"
        draw_top()

# ============================================================
# 睡觉检测循环
# ============================================================

def sleep_check_loop():
    global reminder_1_done, reminder_2_done, last_sound_report, last_day, last_activity
    global sleep_reminder_state, sleep_reminder_start

    if not sleep_cfg.get("is_enabled", True):
        sleep_reminder_state = 0
        return

    h, m = now_hm()
    day = utime.localtime()[2]
    now = utime.time()

    # 每天重置
    if day != last_day:
        last_day = day
        reminder_1_done = False
        reminder_2_done = False

    st = sleep_cfg["start_time"]
    et = sleep_cfg["end_time"]
    sh, sm = map(int, st.split(":"))
    r1_min = sleep_cfg["reminder_1_min"]
    r2_min = sleep_cfg["reminder_2_min"]
    threshold = sleep_cfg["sound_threshold"]

    # 计算提醒时间
    r1_h, r1_m = sh, sm - r1_min
    if r1_m < 0: r1_h -= 1; r1_m += 60
    r2_h, r2_m = sh, sm - r2_min
    if r2_m < 0: r2_h -= 1; r2_m += 60

    # === 非阻塞提醒状态机 ===
    if sleep_reminder_state == 1:
        # 提醒1显示中，等待5秒后恢复
        if now - sleep_reminder_start >= 5:
            sleep_reminder_state = 0
            draw_top()
        return
    elif sleep_reminder_state == 2:
        # 提醒2显示中
        if now - sleep_reminder_start >= 5:
            sleep_reminder_state = 0
            draw_top()
        return
    elif sleep_reminder_state == 3:
        # 声音检测提醒中，等待3秒后恢复
        if now - sleep_reminder_start >= 3:
            sleep_reminder_state = 0
            draw_top()
        return

    # 提醒1
    if not reminder_1_done and h == r1_h and m == r1_m:
        reminder_1_done = True
        scr_brightness(128)
        scr_fill_content(BLACK)
        draw_sleep_reminder(r1_min)
        beep_reminder()
        last_activity = now
        sleep_reminder_state = 1
        sleep_reminder_start = now
        return

    # 提醒2
    if not reminder_2_done and h == r2_h and m == r2_m:
        reminder_2_done = True
        scr_brightness(128)
        scr_fill_content(BLACK)
        draw_sleep_reminder(r2_min)
        beep_reminder()
        last_activity = now
        sleep_reminder_state = 2
        sleep_reminder_start = now
        return

    # 检测窗口
    if is_in_range(h, m, st, et):
        level = read_sound_level()
        if level > threshold:
            if now - last_sound_report > 5:
                last_sound_report = now
                mqtt_publish("sound", {"level": level})
                print(f"[声音] 检测到声音: {level}")
                scr_brightness(128)
                scr_fill_content(BLACK)
                draw_sleep_reminder(0)
                scr_text_center(f"检测到声音! 级别:{level}", 80, RED)
                beep_reminder()
                last_activity = now
                sleep_reminder_state = 3
                sleep_reminder_start = now
                return
        # 更新屏幕（如果亮着）
        if now - last_activity < 10:
            scr_fill_content(BLACK)
            draw_sleep_checking()

# ============================================================
# 主循环
# ============================================================

def main():
    global mode, math_start, last_activity, user_input, idle_msg, waiting_start, last_drawn_mode
    global waveform_cycle, sound_idx, current_sound_level, last_sound_report

    print("")
    print("=" * 50)
    print("  Coin Kids - M5Stack CoreS3 统一固件")
    print(f"  设备ID: {DEVICE_ID}")
    print(f"  RFID: {'检测中...' if RFID_CFG else '未配置'}")
    print(f"  打卡: {WAKE_START}~{WAKE_END}")
    print(f"  睡觉检测: {SLEEP_CFG.get('start_time')}~{SLEEP_CFG.get('end_time')}")
    print("=" * 50)

    # 初始化屏幕
    scr_brightness(128)
    idle_msg = "系统启动中..."
    draw_top()

    # 连接WiFi（UIFlow2 系统已自动连接，仅检查状态）
    wifi_ok = connect_wifi()
    if not wifi_ok:
        idle_msg = "WiFi连接失败"
        draw_top()
        while True:
            utime.sleep(1)

    # NTP 时间同步
    sync_time()

    # 初始化RFID
    init_rfid()
    if not rfid_available:
        print("[模式] 无RFID模式：从机模式，等待MQTT指令进入答题")

    # 初始化摄像头
    init_camera()

    # 连接MQTT
    connect_mqtt()

    draw_top()
    last_activity = utime.time()
    utime.sleep(3)

    # 主循环
    while True:
        # UIFlow2 状态更新（触摸、按键等）
        try:
            M5.update()
        except:
            pass

        # 捕获当前mode，避免多线程竞争
        with mode_lock:
            cur_mode = mode

        # 1. MQTT消息
        mqtt_check()

        # 2. 触摸处理
        handle_touch()

        # 3. RFID检测（仅空闲模式）
        if cur_mode == MODE_IDLE and rfid_available:
            uid = read_rfid()
            if uid:
                h, m = now_hm()
                if not is_in_range(h, m, WAKE_START, WAKE_END):
                    scr_brightness(128)
                    idle_msg = f"不在打卡时间 {WAKE_START}~{WAKE_END}"
                    draw_top()
                    last_activity = utime.time()
                    continue
                print(f"[RFID] 检测到卡: {uid}")
                with mode_lock:
                    mode = MODE_WAITING_INFO
                waiting_start = utime.time()
                scr_brightness(128)
                draw_top()
                mqtt_publish("rfid", uid)
                last_activity = utime.time()

        # 3a. 等待 child_info 超时处理&声音检测
        if cur_mode == MODE_WAITING_INFO:
            if waiting_start and utime.time() - waiting_start > waiting_timeout:
                print("[等待] 获取孩子信息超时，返回空闲模式")
                reset_idle()
            else:
                # 等待期间也检测噪声
                level = read_sound_level()
                threshold = sleep_cfg.get("sound_threshold", 100)
                if level > threshold:
                    now = utime.time()
                    if now - last_sound_report > 5:
                        last_sound_report = now
                        mqtt_publish("sound", {"level": level, "phase": "waiting"})
                        print(f"[声音] 等待时检测到声音: {level}")

        # 4. 答题超时
        if cur_mode == MODE_ANSWERING and math_start:
            elapsed = utime.time() - math_start
            remaining = max(0, math_timeout - int(elapsed))
            if elapsed >= math_timeout:
                print("[答题] 超时")
                if user_input:
                    submit_answer()
                else:
                    # 自动提交空答案
                    user_input = ""
                    submit_answer()
            elif elapsed % 2 == 0:
                # 刷新倒计时
                draw_math_ui(child_info.get("child_name", ""), current_expr, user_input, remaining, attempt + 1, child_info.get("max_attempts", 5))

        # 5. 睡觉检测（仅空闲模式）
        if cur_mode == MODE_IDLE:
            sleep_check_loop()

        # 6. 空闲超时休眠
        if cur_mode == MODE_IDLE:
            if utime.time() - last_activity > SLEEP_TIMEOUT:
                scr_brightness(0)

        # 7. 模式变化检测 → 统一刷新顶部内容
        if cur_mode != last_drawn_mode:
            last_drawn_mode = cur_mode
            draw_top()

        # 8. 声音波形采样（每5次循环，约500ms间隔）
        waveform_cycle = (waveform_cycle + 1) % 5
        if waveform_cycle == 0:
            current_sound_level = read_sound_level()
            sound_levels[sound_idx] = current_sound_level
            sound_idx = (sound_idx + 1) % SOUND_BUF_SIZE

        # 8. 刷新底部波形（始终显示）
        draw_waveform()

        utime.sleep_ms(100)

main()