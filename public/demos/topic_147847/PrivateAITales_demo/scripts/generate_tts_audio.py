"""
TTS 音频生成脚本
使用 Qwen3-TTS API 为 Demo 自动演示预生成配音文件。

统一音色：Dylan（北京男性，自然清晰）贯穿全程。

结构：
  - intro:     产品目的、意义、核心功能简介
  - p01~p09:   9步演示配音
  - closing:   简单收尾

用法：
  python scripts/generate_tts_audio.py                    # 生成占位文件
  python scripts/generate_tts_audio.py --server http://IP:PORT  # 指定API生成真实配音
"""

import os
import sys
import json
import wave
import struct
import argparse
import urllib.request
import urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "audio")

# 统一音色
UNIFIED_SPEAKER = "Serena"

# ---- 配音脚本定义 ----
# (文件名, 文本)
VOICEOVER_SCRIPTS = [
    # ===== 开场介绍（拆分为3段，避免单次文本过长导致超时） =====
    ("intro_part1.wav",
     "私塾绘本，一个用AI守护孩子阅读的产品。"
     "当前市面上面向儿童的故事类应用中，超过百分之四十七含有不当内容，"
     "每年有超过六百万册问题绘本流入市场。"
     "家长想给孩子选好书，却没有时间一本一本审核。"),

    ("intro_part2.wav",
     "私塾绘本的核心功能是：AI自动审核绘本内容安全，按价值观打标分级；"
     "家长一句话描述需求，AI即刻创作定制绘本；"
     "孩子端由AI陪读伙伴小安陪伴阅读，启发思考。"
     "家长在手机上管内容，孩子在Pad上享阅读，双端分离，各取所需。"),

    ("intro_part3.wav",
     "接下来，请观看私塾绘本的完整功能演示。"),

    # ===== 家长端：5步 =====
    ("parent/p01_onboarding.wav",
     "第一步，锁定教育导向。孔先生是AI私塾先生，开场就讲清核心价值："
     "家长设定价值观，AI审核绘本。"
     "家长录入孩子信息，锁定教育导向，孔先生从此坐镇私塾。"),

    ("parent/p02_chat.wav",
     "第二步，孔先生对话。孔先生主动汇报孩子的阅读情况，"
     "推荐匹配家庭价值观的绘本，生成本周阅读报告。"
     "家长不用自己翻书，AI已经帮你审核过了。"),

    ("parent/p03_create.wav",
     "第三步，创作绘本。这是私塾绘本的核心亮点："
     "家长只需输入一句话，比如'教孩子分享玩具'，"
     "AI即刻生成符合价值观审核的定制绘本。"
     "创作即审核，完成即安全，市面上找不到的书，这里可以定制。"),

    ("parent/p04_library.wav",
     "第四步，书柜浏览。所有通过审核的绘本都在书柜中，"
     "按价值观主题分类筛选。每本书都标注绿黄红三级安全等级，"
     "绿色孩子自己读，黄色亲子共读，红色不适合。一目了然。"),

    ("parent/p05_bookstore.wav",
     "第五步，书店精选。孔先生精选推荐，按年龄和价值观筛选，"
     "每本都经过AI安全审核。家长可以放心挑选，不用担心内容问题。"),

    # ===== 孩子端：4步 =====
    ("child/c06_home.wav",
     "第六步，切换到孩子端。这是Pad横屏的专属体验。"
     "小安是AI陪读伙伴，欢迎孩子回家，根据孩子的兴趣推荐绘本，"
     "展示阅读统计和孔先生精选书目。"),

    ("child/c07_chat.wav",
     "第七步，小安陪聊。孩子与小安对话，选择想读的书。"
     "小安给孩子几个选项，让孩子做选择题而不是问答题。"
     "AI智能推荐匹配的绘本，每本都经过家长审核。"),

    ("child/c08_reader.wav",
     "第八步，绘本阅读。横屏Pad沉浸式阅读体验，"
     "左右翻页像真书。小安在阅读过程中陪伴提问，"
     "启发孩子思考，不是电子保姆式的放养，而是真正的阅读陪伴。"),

    ("child/c09_library.wav",
     "第九步，我的书柜。孩子自己的小书柜，已读和未读分类管理，"
     "可以继续上次的阅读进度。想看哪本，点开就能接着读。"),

    # ===== 收尾 =====
    ("closing.wav",
     "以上是私塾绘本的核心功能演示。"
     "正式产品将包含完整的AI生成绘本内容、精美的插图，和真实的语音朗读。"
     "私塾绘本，让每一个孩子都能读到安全、合适、有营养的好书。"
     "感谢观看。"),
]


def generate_placeholder_wav(filepath, duration_sec=3.0, sample_rate=24000):
    """生成占位静音 WAV 文件"""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    n_samples = int(sample_rate * duration_sec)
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(b'\x00\x00' * n_samples)


def synthesize_via_api(server, speaker, text, output_path, max_retries=3):
    """通过 TTS API 合成语音，带重试机制"""
    import time
    url = f"{server}/api/v1/custom-voice"
    payload = json.dumps({
        "text": text,
        "speaker": speaker,
        "language": "Chinese",
    }).encode("utf-8")

    timeout = 180  # 长文本需要更长时间

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, data=payload, headers={
                "Content-Type": "application/json",
            })
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                result = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            print(f"  ❌ API 错误 {e.code}: {body[:200]}")
            return False
        except Exception as e:
            if attempt < max_retries - 1:
                wait = (attempt + 1) * 3
                print(f"  ⚠️ 请求失败 (尝试 {attempt+1}/{max_retries}): {e}，{wait}秒后重试...")
                time.sleep(wait)
                continue
            print(f"  ❌ 请求失败: {e}")
            return False

        if not result.get("success"):
            print(f"  ❌ 合成失败: {result.get('message', '未知错误')}")
            return False

        audio_url = result.get("data", {}).get("audio_file_url", "")
        if not audio_url:
            print(f"  ❌ 响应中未找到音频 URL")
            return False

        # 下载音频文件
        dl_url = f"{server}{audio_url}" if audio_url.startswith("/") else audio_url
        try:
            with urllib.request.urlopen(dl_url, timeout=30) as resp:
                audio_data = resp.read()
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'wb') as f:
                f.write(audio_data)
            duration = result.get("data", {}).get("duration_seconds", 0)
            print(f"  ✅ 已生成: {os.path.basename(output_path)} ({duration:.1f}s)")
            return True
        except Exception as e:
            print(f"  ❌ 下载失败: {e}")
            return False

    return False


def generate_all(server=None, placeholder_only=False, skip_existing=False):
    import time
    total = 0
    success = 0
    skipped = 0

    for filename, text in VOICEOVER_SCRIPTS:
        output_path = os.path.join(AUDIO_DIR, filename)
        total += 1

        # 跳过已存在的真实音频文件（非占位）
        if skip_existing and os.path.exists(output_path):
            size = os.path.getsize(output_path)
            if size > 1000:  # 大于1KB说明是真实音频
                print(f"  ⏭️  {filename} (已存在，跳过)")
                skipped += 1
                success += 1
                continue

        if server and not placeholder_only:
            print(f"  🎤 [{UNIFIED_SPEAKER}] {filename}")
            if synthesize_via_api(server, UNIFIED_SPEAKER, text, output_path):
                success += 1
            time.sleep(2)  # 请求间隔，避免服务器过载
        else:
            duration = max(3.0, len(text) * 0.25)
            generate_placeholder_wav(output_path, duration)
            print(f"  ⏸️  {filename} (占位 {duration:.1f}s)")
            success += 1

    print(f"\n{'='*50}")
    print(f"完成: {success}/{total} 个音频文件")
    if skipped > 0:
        print(f"其中 {skipped} 个已存在，跳过重新生成")
    if server and not placeholder_only:
        print(f"目录: {AUDIO_DIR}")
    else:
        print(f"⚠️  当前为占位文件，请使用 --server 参数指定 TTS API 地址生成真实配音")
        print(f"目录: {AUDIO_DIR}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TTS 音频生成脚本")
    parser.add_argument("--server", "-s", type=str, default=None,
                        help="TTS API 服务地址，如 http://localhost:26880")
    parser.add_argument("--placeholder", action="store_true",
                        help="强制生成占位静音文件（即使提供了 --server）")
    parser.add_argument("--skip-existing", action="store_true",
                        help="跳过已存在的真实音频文件（用于断点续传）")
    args = parser.parse_args()

    print("=" * 50)
    print("私塾绘本 Demo · TTS 配音生成")
    print("=" * 50)
    print(f"统一音色: {UNIFIED_SPEAKER}（温柔女性，自然清晰）")
    print(f"音频目录: {AUDIO_DIR}")
    print(f"配音结构: 开场介绍 → 9步演示 → 收尾")

    if args.server:
        print(f"API 地址: {args.server}")
        if args.skip_existing:
            print("模式: 跳过已存在文件")
    else:
        print("⚠️  未指定 API 地址，将生成占位静音文件")

    generate_all(server=args.server, placeholder_only=args.placeholder, skip_existing=args.skip_existing)