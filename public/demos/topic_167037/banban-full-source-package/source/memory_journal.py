"""
伴伴 - 滚动记忆日志（Memory Journal）
让 AI 拥有持续一周以上的长期记忆

原理：
- 每天结束时，AI 基于当天活动生成一篇 ~150字"日记"
- 保留最近 7 天的日记
- 每天将 7 天日记压缩成一篇 ~400字"周度摘要"
- 周度摘要注入到每次 companion_check 的 prompt 中

这样 AI 每次说话时，都能看到"这个人过去一周在做什么"。

存储结构：
~/.banban/memory/
├── daily/
│   ├── 2026-07-08.json   # {date, summary, activity_count, key_events}
│   ├── ...
│   └── 2026-07-14.json
└── weekly_digest.json     # {start_date, end_date, digest, updated_at}
"""
import json
import os
import threading
from datetime import datetime, date, timedelta
from typing import Optional


MEMORY_DIR = os.path.join(os.path.expanduser("~"), ".banban", "memory")
DAILY_DIR = os.path.join(MEMORY_DIR, "daily")
WEEKLY_DIGEST_PATH = os.path.join(MEMORY_DIR, "weekly_digest.json")

MAX_DAILY_DAYS = 14  # 保留最近14天的日记文件（防止无限增长）


class MemoryJournal:
    """滚动记忆日志管理器"""

    def __init__(self, ai_client=None):
        self._ai = ai_client
        self._lock = threading.Lock()
        os.makedirs(DAILY_DIR, exist_ok=True)

    def set_ai_client(self, ai_client):
        """设置 AI 客户端（延迟注入）"""
        self._ai = ai_client

    # ========= 每日摘要 =========

    def generate_daily_summary(self, activities: list, speaks: list,
                                user_memory: str = "") -> Optional[dict]:
        """让 AI 为当天生成一篇日记摘要

        Args:
            activities: 当天活动列表 [{time, description, app}]
            speaks: 当天发言列表 [{time, message}]
            user_memory: 用户画像摘要（可选）

        Returns:
            {date, summary, activity_count, speak_count, key_themes}
        """
        if not activities:
            return None
        if not self._ai:
            # 无 AI 时生成简易摘要
            return self._generate_simple_summary(activities, speaks)

        today_str = date.today().isoformat()

        # 构建活动文本（最多取30条，防止太长）
        act_lines = []
        for a in activities[-30:]:
            t = a.get("time", "")
            d = a.get("description", "")
            act_lines.append(f"  {t} {d}")

        speak_lines = []
        for s in speaks:
            speak_lines.append(f"  {s.get('time', '')} 说了「{s.get('message', '')}」")

        user_section = ""
        if user_memory:
            user_section = f"\n## 用户画像\n{user_memory}\n"

        prompt = (
            f"你是伴伴，请根据以下用户今天的活动记录，写一篇简短的「今日观察日记」。\n"
            f"要求：\n"
            f"1. 150字以内\n"
            f"2. 包含：用户今天主要在做什么、有什么规律或模式、状态如何\n"
            f"3. 语气像朋友写日记，不要像报告\n"
            f"4. 如果有值得记住的事（开始新项目、完成任务、状态变化），重点提一下\n"
            f"5. 用中文\n"
            f"{user_section}\n"
            f"## 今日活动记录（{len(activities)}条）\n"
            + "\n".join(act_lines)
            + ("\n\n## 今日主动发言\n" + "\n".join(speak_lines) if speak_lines else "")
        )

        try:
            result = self._ai.chat(
                [{"role": "system", "content": "你是伴伴的记忆模块，负责为用户每天写观察日记。输出纯文本，不要JSON。"},
                 {"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=200,
            )
            summary = result.strip() if isinstance(result, str) else str(result).strip()
        except Exception as e:
            print(f"[MemoryJournal] AI 生成日记失败: {e}")
            return self._generate_simple_summary(activities, speaks)

        entry = {
            "date": today_str,
            "summary": summary,
            "activity_count": len(activities),
            "speak_count": len(speaks),
        }

        # 保存到文件
        self._save_daily_entry(entry)
        return entry

    def _generate_simple_summary(self, activities: list, speaks: list) -> dict:
        """无 AI 时的简易摘要"""
        today_str = date.today().isoformat()
        # 统计应用分布
        app_counts = {}
        for a in activities:
            app = a.get("app", "未知")
            app_counts[app] = app_counts.get(app, 0) + 1
        top_apps = sorted(app_counts.items(), key=lambda x: -x[1])[:3]
        summary = f"今天共记录{len(activities)}条活动。" \
                  f"主要使用：{'、'.join([f'{a}({c}次)' for a, c in top_apps])}。"
        entry = {
            "date": today_str,
            "summary": summary,
            "activity_count": len(activities),
            "speak_count": len(speaks),
        }
        self._save_daily_entry(entry)
        return entry

    def _save_daily_entry(self, entry: dict):
        """保存每日日记到文件"""
        try:
            filename = f"{entry['date']}.json"
            filepath = os.path.join(DAILY_DIR, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(entry, f, ensure_ascii=False, indent=2)
            print(f"[MemoryJournal] 日记已保存：{entry['date']}（{entry.get('activity_count', 0)}条活动）")
            # 清理旧文件
            self._cleanup_old_entries()
        except Exception as e:
            print(f"[MemoryJournal] 保存日记失败: {e}")

    def _cleanup_old_entries(self):
        """清理超过保留天数的旧日记"""
        try:
            cutoff = date.today() - timedelta(days=MAX_DAILY_DAYS)
            for filename in os.listdir(DAILY_DIR):
                if not filename.endswith(".json"):
                    continue
                date_str = filename.replace(".json", "")
                try:
                    entry_date = date.fromisoformat(date_str)
                    if entry_date < cutoff:
                        os.remove(os.path.join(DAILY_DIR, filename))
                except ValueError:
                    pass
        except Exception:
            pass

    def get_recent_daily_summaries(self, days: int = 7) -> list[dict]:
        """获取最近 N 天的日记"""
        result = []
        try:
            for i in range(days):
                d = date.today() - timedelta(days=i)
                filename = f"{d.isoformat()}.json"
                filepath = os.path.join(DAILY_DIR, filename)
                if os.path.exists(filepath):
                    with open(filepath, "r", encoding="utf-8") as f:
                        result.append(json.load(f))
        except Exception as e:
            print(f"[MemoryJournal] 加载日记失败: {e}")
        return result

    # ========= 周度摘要 =========

    def generate_weekly_digest(self) -> Optional[str]:
        """让 AI 将最近7天的日记压缩成一篇周度摘要

        Returns:
            周度摘要文本（~400字）
        """
        daily_entries = self.get_recent_daily_summaries(7)

        if not daily_entries:
            return None

        # 如果只有1天的日记，直接用
        if len(daily_entries) == 1:
            digest = daily_entries[0].get("summary", "")
            self._save_weekly_digest(daily_entries, digest)
            return digest

        # 无 AI 时用简单拼接
        if not self._ai:
            digest_parts = []
            for entry in reversed(daily_entries):  # 从早到晚
                digest_parts.append(f"[{entry['date']}] {entry.get('summary', '')}")
            digest = " ".join(digest_parts)
            self._save_weekly_digest(daily_entries, digest)
            return digest

        # AI 压缩
        daily_texts = []
        for entry in reversed(daily_entries):  # 从早到晚
            daily_texts.append(f"[{entry['date']}] {entry.get('summary', '')}")

        prompt = (
            "你是伴伴的记忆模块。以下是用户过去一周的每日观察日记。\n"
            "请将它们压缩成一篇 400字以内的「周度记忆摘要」。\n"
            "要求：\n"
            "1. 提炼这一周的核心主线：用户在做什么项目、什么任务\n"
            "2. 总结行为模式：工作习惯、作息规律、状态变化\n"
            "3. 标注关键事件：开始/完成/变化的事\n"
            "4. 语气简洁客观，像朋友的备忘录\n"
            "5. 用中文\n\n"
            "## 每日日记\n"
            + "\n".join(daily_texts)
        )

        try:
            result = self._ai.chat(
                [{"role": "system", "content": "你是伴伴的记忆压缩模块，负责将每日日记压缩成周度摘要。输出纯文本。"},
                 {"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=400,
            )
            digest = result.strip() if isinstance(result, str) else str(result).strip()
        except Exception as e:
            print(f"[MemoryJournal] AI 生成周度摘要失败: {e}")
            digest_parts = []
            for entry in reversed(daily_entries):
                digest_parts.append(f"[{entry['date']}] {entry.get('summary', '')}")
            digest = " ".join(digest_parts)

        self._save_weekly_digest(daily_entries, digest)
        return digest

    def _save_weekly_digest(self, daily_entries: list, digest: str):
        """保存周度摘要"""
        try:
            dates = [e["date"] for e in daily_entries]
            data = {
                "start_date": min(dates) if dates else "",
                "end_date": max(dates) if dates else "",
                "digest": digest,
                "daily_count": len(daily_entries),
                "updated_at": datetime.now().isoformat(),
            }
            with open(WEEKLY_DIGEST_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"[MemoryJournal] 周度摘要已更新（{len(daily_entries)}天 → {len(digest)}字）")
        except Exception as e:
            print(f"[MemoryJournal] 保存周度摘要失败: {e}")

    def get_weekly_digest(self) -> str:
        """获取当前周度摘要文本"""
        try:
            if os.path.exists(WEEKLY_DIGEST_PATH):
                with open(WEEKLY_DIGEST_PATH, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return data.get("digest", "")
        except Exception as e:
            print(f"[MemoryJournal] 加载周度摘要失败: {e}")
        return ""

    def get_weekly_digest_info(self) -> dict:
        """获取周度摘要的元信息"""
        try:
            if os.path.exists(WEEKLY_DIGEST_PATH):
                with open(WEEKLY_DIGEST_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return {}

    # ========= 初始化时滚动 =========

    def refresh_on_startup(self):
        """启动时检查：如果有新日记但周度摘要过期，重新生成"""
        daily_entries = self.get_recent_daily_summaries(7)
        digest_info = self.get_weekly_digest_info()

        if not daily_entries:
            return

        # 如果周度摘要不存在或最新日记日期 > 摘要的 end_date，需要更新
        latest_daily = max(e["date"] for e in daily_entries)
        digest_end = digest_info.get("end_date", "")

        if not digest_end or latest_daily > digest_end:
            print(f"[MemoryJournal] 检测到新日记，重新生成周度摘要（最新：{latest_daily}，摘要截止：{digest_end}）")
            self.generate_weekly_digest()
