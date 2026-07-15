"""
数据导入服务
支持解析微信聊天记录 CSV 和通话记录 CSV
"""

import csv
import io
import json
import logging
import re
from collections import OrderedDict
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.database import crud
from app.database.models import Note

logger = logging.getLogger(__name__)


class ImportResult:
    """导入结果"""
    def __init__(self):
        self.total_rows = 0
        self.imported_count = 0
        self.skipped_count = 0
        self.notes = []  # 导入的笔记列表（用于预览）
        self.errors = []

    def to_dict(self):
        return {
            "total_rows": self.total_rows,
            "imported_count": self.imported_count,
            "skipped_count": self.skipped_count,
            "notes": [{
                "title": n.title[:50],
                "content": n.content[:200] if n.content else "",
                "note_type": n.note_type,
                "created_at": n.created_at.isoformat() if n.created_at else "",
            } for n in self.notes[:20]],
            "errors": self.errors[:10],
        }


class ImportService:
    """数据导入服务"""

    def __init__(self):
        self.supported_formats = {
            "wechat_csv": {"name": "微信聊天记录 (CSV)", "ext": [".csv"]},
            "call_log_csv": {"name": "通话记录 (CSV)", "ext": [".csv"]},
            "wechat_json": {"name": "微信聊天记录 (JSON)", "ext": [".json"]},
        }

    def get_supported_formats(self) -> dict:
        return self.supported_formats

    def detect_format(self, filename: str, content_preview: str) -> Optional[str]:
        """
        根据文件名和内容前几行自动检测格式

        Args:
            filename: 文件名
            content_preview: 文件前 500 个字符

        Returns:
            格式标识字符串，或 None
        """
        fname = filename.lower()

        # JSON 格式检测
        if fname.endswith(".json"):
            if "talkerName" in content_preview or "MsgType" in content_preview:
                return "wechat_json"
            return None

        # CSV 格式检测
        if not fname.endswith(".csv"):
            return None

        lines = content_preview.strip().split("\n")
        if not lines:
            return None

        # 解析 CSV 表头
        header = lines[0].strip().lower()

        # 微信聊天记录 CSV 常见表头
        wechat_headers = ["talkername", "msgtype", "content", "timestamp", "sender", "isrecv", "time",
                          "发送人", "内容", "聊天时间", "消息类型", "说话人"]
        if any(h in header for h in wechat_headers):
            return "wechat_csv"

        # 通话记录 CSV 常见表头
        call_headers = ["number", "duration", "type", "date", "name", "call_type", "phone",
                        "联系人", "通话时长", "通话类型", "电话", "号码"]
        if any(h in header for h in call_headers):
            return "call_log_csv"

        # 无法自动检测
        return None

    def import_wechat_csv(self, file_content: str, db: Session, preview_only: bool = False) -> ImportResult:
        """
        导入微信聊天记录 CSV

        支持的 CSV 格式（表头）：
        - talkerName, msgType, content, timestamp (或 time/date)
        - 也支持：sender, content, timestamp, isRecv

        将聊天记录按对话日期分组，每天/每个联系人创建一条笔记
        """
        result = ImportResult()

        reader = csv.DictReader(io.StringIO(file_content))
        if not reader.fieldnames:
            result.errors.append("CSV 文件为空或格式不正确")
            return result

        # 规范化列名
        field_map = {}
        for f in reader.fieldnames:
            fl = f.strip().lower().replace(" ", "").replace("_", "")
            if "talker" in fl:
                field_map["talker"] = f
            elif "sender" in fl or "发送人" in fl or "说话人" in fl:
                field_map["sender"] = f
            elif fl in ("content", "msg", "message", "text") or "内容" in fl:
                field_map["content"] = f
            elif fl in ("timestamp", "time", "date", "datetime") or "时间" in fl or "日期" in fl or "聊天时间" in fl:
                field_map["timestamp"] = f
            elif fl in ("type", "msgtype") or "消息类型" in fl:
                field_map["type"] = f
            elif fl in ("isrecv", "isreceived", "direction") or "方向" in fl:
                field_map["direction"] = f

        if "content" not in field_map:
            result.errors.append("CSV 中未找到消息内容列（需包含 content/text/msg/内容 等列名）")
            return result

        # 按日期+联系人分组
        groups = OrderedDict()

        for row in reader:
            try:
                result.total_rows += 1
                content = (row.get(field_map.get("content", "content")) or "").strip()
                if not content:
                    result.skipped_count += 1
                    continue

                talker = row.get(field_map.get("talker", ""), "").strip() or row.get(field_map.get("sender", ""), "").strip()

                # 解析时间
                ts_raw = row.get(field_map.get("timestamp", ""), "").strip()
                date_key = self._parse_date_key(ts_raw)

                # 确定消息类型
                msg_type = row.get(field_map.get("type", ""), "").strip()
                if msg_type in ("1", "text", "Text", "文本"):
                    msg_type_str = "[文本]"
                elif msg_type in ("3", "image", "Image", "图片"):
                    msg_type_str = "[图片]"
                elif msg_type in ("34", "voice", "Voice", "语音"):
                    msg_type_str = "[语音消息]"
                elif msg_type in ("43", "video", "Video", "视频"):
                    msg_type_str = "[视频消息]"
                elif msg_type in ("49", "link", "Link", "链接"):
                    msg_type_str = "[链接]"
                elif msg_type in ("42", "namecard", "名片"):
                    msg_type_str = "[名片]"
                else:
                    msg_type_str = ""

                key = (date_key, talker)
                if key not in groups:
                    groups[key] = []
                groups[key].append(f"{msg_type_str}{content}")

            except Exception as e:
                result.skipped_count += 1
                if len(result.errors) < 10:
                    result.errors.append(f"第 {result.total_rows} 行解析失败: {str(e)}")

        # 为每个分组创建一条笔记
        for (date_key, talker), messages in groups.items():
            title_parts = []
            if talker:
                title_parts.append(f"与 {talker} 的对话")
            if date_key:
                title_parts.append(date_key)
            title = " - ".join(title_parts) if title_parts else "聊天记录"

            body = "\n".join(messages)

            if preview_only:
                # 预览模式：不写数据库
                note = Note(
                    title=title,
                    content=body,
                    note_type="chat_history",
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )
                result.notes.append(note)
            else:
                note = crud.create_note(
                    db=db,
                    title=title,
                    content=body,
                    note_type="chat_history",
                )
                result.notes.append(note)
            result.imported_count += 1

        return result

    def import_call_log_csv(self, file_content: str, db: Session, preview_only: bool = False) -> ImportResult:
        """
        导入通话记录 CSV

        支持的 CSV 格式（表头）：
        - number/name, duration, type/date
        - type: incoming/outgoing/missed 或 INCOMING/OUTGOING/MISSED
        - duration: 秒数

        按日期分组创建笔记
        """
        result = ImportResult()

        reader = csv.DictReader(io.StringIO(file_content))
        if not reader.fieldnames:
            result.errors.append("CSV 文件为空或格式不正确")
            return result

        # 规范化列名
        field_map = {}
        for f in reader.fieldnames:
            fl = f.strip().lower().replace(" ", "").replace("_", "")
            if fl in ("number", "phone", "phonenumber") or "电话" in fl or "号码" in fl:
                field_map["number"] = f
            elif fl in ("name", "contact", "contactname") or "联系人" in fl or "姓名" in fl:
                field_map["name"] = f
            elif fl in ("duration", "length") or "时长" in fl or "通话时长" in fl:
                field_map["duration"] = f
            elif fl in ("type", "calltype", "call_type") or "类型" in fl or "通话类型" in fl:
                field_map["type"] = f
            elif fl in ("date", "time", "timestamp", "datetime") or "时间" in fl or "日期" in fl:
                field_map["date"] = f

        if "date" not in field_map and "type" not in field_map:
            result.errors.append("CSV 中未找到日期或类型列")
            return result

        # 按日期分组
        groups = OrderedDict()

        for row in reader:
            try:
                result.total_rows += 1

                number = row.get(field_map.get("number", ""), "").strip()
                name = row.get(field_map.get("name", ""), "").strip()
                duration_raw = row.get(field_map.get("duration", ""), "").strip()
                call_type = row.get(field_map.get("type", ""), "").strip()
                date_raw = row.get(field_map.get("date", ""), "").strip()

                if not number and not name:
                    result.skipped_count += 1
                    continue

                # 解析时长
                try:
                    duration_sec = int(float(duration_raw))
                except (ValueError, TypeError):
                    duration_sec = 0

                # 格式化通话类型
                call_type_lower = call_type.lower()
                if call_type_lower in ("incoming", "1", "来电", "呼入"):
                    type_str = "来电"
                elif call_type_lower in ("outgoing", "2", "去电", "呼出", "dial"):
                    type_str = "去电"
                elif call_type_lower in ("missed", "3", "未接", "miss"):
                    type_str = "未接"
                else:
                    type_str = call_type or "未知"

                # 格式化时长
                if duration_sec > 0:
                    mins, secs = divmod(duration_sec, 60)
                    duration_str = f"{mins}分{secs}秒" if mins else f"{secs}秒"
                else:
                    duration_str = "未接通"

                date_key = self._parse_date_key(date_raw)
                display_name = name or number

                # 格式化时间（如果有的话）
                time_str = ""
                if date_raw:
                    time_str = date_raw.strip()

                line = f"- {type_str} {display_name}（{duration_str}）{(' ' + time_str) if time_str else ''}"

                if date_key not in groups:
                    groups[date_key] = []
                groups[date_key].append(line)

            except Exception as e:
                result.skipped_count += 1
                if len(result.errors) < 10:
                    result.errors.append(f"第 {result.total_rows} 行解析失败: {str(e)}")

        # 为每天创建一条笔记
        for date_key, lines in groups.items():
            title = f"通话记录 - {date_key}"
            body = "\n".join(lines)
            body = f"共 {len(lines)} 通通话：\n\n{body}"

            if preview_only:
                note = Note(
                    title=title,
                    content=body,
                    note_type="call_log",
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )
                result.notes.append(note)
            else:
                note = crud.create_note(
                    db=db,
                    title=title,
                    content=body,
                    note_type="call_log",
                )
                result.notes.append(note)
            result.imported_count += 1

        return result

    def import_wechat_json(self, file_content: str, db: Session, preview_only: bool = False) -> ImportResult:
        """
        导入微信聊天记录 JSON 格式
        常见格式：{"talkerName": "...", "messageList": [...]}
        或者 PyWxDump 导出的格式
        """
        result = ImportResult()

        try:
            data = json.loads(file_content)
        except json.JSONDecodeError as e:
            result.errors.append(f"JSON 解析失败: {e}")
            return result

        # 兼容多种 JSON 格式
        messages = []
        talker_name = ""

        if isinstance(data, list):
            # 纯消息列表
            messages = data
        elif isinstance(data, dict):
            # 尝试常见的 JSON 结构
            if "messageList" in data:
                messages = data["messageList"]
                talker_name = data.get("talkerName", data.get("nickname", ""))
            elif "messages" in data:
                messages = data["messages"]
                talker_name = data.get("talkerName", data.get("contact", ""))
            elif "talkerName" in data or "nickname" in data:
                # 可能是单个对话对象
                talker_name = data.get("talkerName", data.get("nickname", ""))
                for key, val in data.items():
                    if isinstance(val, list):
                        messages = val
                        break
            else:
                # 尝试把整个 dict 当作一条条消息
                for key, val in data.items():
                    if isinstance(val, str) and len(val) > 5:
                        messages.append({"content": val})

        if not messages:
            result.errors.append("JSON 中未找到消息内容")
            return result

        # 按日期分组
        groups = OrderedDict()

        for i, msg in enumerate(messages):
            try:
                result.total_rows += 1

                if isinstance(msg, str):
                    content = msg.strip()
                    ts_raw = ""
                elif isinstance(msg, dict):
                    content = ""
                    for k in ("content", "text", "msg", "message", "body", "说话内容"):
                        if k in msg:
                            content = str(msg[k]).strip()
                            break
                    ts_raw = ""
                    for k in ("timestamp", "time", "date", "createTime", "create_time", "时间"):
                        if k in msg:
                            ts_raw = str(msg[k])
                            break
                    if not talker_name:
                        for k in ("talkerName", "sender", "nickname", "from", "fromUser"):
                            if k in msg:
                                talker_name = str(msg[k]).strip()
                                break
                else:
                    result.skipped_count += 1
                    continue

                if not content:
                    result.skipped_count += 1
                    continue

                date_key = self._parse_date_key(ts_raw)

                key = (date_key, talker_name)
                if key not in groups:
                    groups[key] = []
                groups[key].append(content)

            except Exception as e:
                result.skipped_count += 1
                if len(result.errors) < 10:
                    result.errors.append(f"第 {i + 1} 条消息解析失败: {str(e)}")

        for (date_key, talker), msgs in groups.items():
            title_parts = []
            if talker:
                title_parts.append(f"与 {talker} 的对话")
            if date_key:
                title_parts.append(date_key)
            title = " - ".join(title_parts) if title_parts else "聊天记录"
            body = "\n".join(msgs)

            if preview_only:
                note = Note(
                    title=title,
                    content=body,
                    note_type="chat_history",
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                )
                result.notes.append(note)
            else:
                note = crud.create_note(db=db, title=title, content=body, note_type="chat_history")
                result.notes.append(note)
            result.imported_count += 1

        return result

    def detect_text_format(self, text: str) -> Optional[str]:
        """
        根据粘贴文本内容自动识别格式

        Args:
            text: 粘贴的纯文本

        Returns:
            "wechat_text" / "call_log_text" / None
        """
        if not text or not text.strip():
            return None

        lines = text.strip().split("\n")
        if len(lines) < 2:
            return None

        # 微信聊天文本特征：多种时间格式
        # 格式1: "张三 2025/1/15 10:30"
        # 格式2: "张三 2025-01-15 10:30:00"
        # 格式3: "张三 2025年1月15日 10:30"
        # 格式4: "[2025-01-15 10:30:00] 张三: 消息"
        header_pattern = re.compile(
            r'^(.+?)\s+'
            r'(\d{4}[/-]\d{1,2}[/-]\d{1,2}[\sT]\d{1,2}:\d{2}(?::\d{2})?'
            r'|\d{4}年\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2}(?::\d{2})?)'
            r'\s*$'
        )
        bracket_pattern = re.compile(r'^\[\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}(:\d{2})?\]')
        wechat_matches = sum(
            1 for line in lines
            if header_pattern.match(line.strip()) or bracket_pattern.match(line.strip())
        )
        non_empty = sum(1 for line in lines if line.strip())
        if non_empty > 0 and wechat_matches / non_empty >= 0.3 and wechat_matches >= 1:
            return "wechat_text"

        # 通话记录特征：包含 来电/去电/未接/呼入/呼出 等关键词
        call_keywords = ["来电", "去电", "未接", "呼入", "呼出", "missed", "incoming", "outgoing"]
        duration_pattern = re.compile(r'\d+分\d+秒|\d+:\d{2}|\d+秒')
        call_lines = 0
        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            has_call_kw = any(kw in stripped for kw in call_keywords)
            has_duration = bool(duration_pattern.search(stripped))
            has_date = bool(re.search(r'\d{4}[/-]\d{1,2}[/-]\d{1,2}', stripped))
            if (has_call_kw or has_duration) and has_date:
                call_lines += 1
        if non_empty > 0 and call_lines / non_empty >= 0.4 and call_lines >= 1:
            return "call_log_text"

        return None

    def import_wechat_text(self, text: str, db: Session, preview_only: bool = False) -> ImportResult:
        """
        解析粘贴的微信聊天纯文本

        支持多种格式：
            格式A（PC 斜杠日期）: 张三 2025/1/15 10:30 \\n 消息内容
            格式B（中文日期）  : 张三 2025年1月15日 10:30 \\n 消息内容
            格式C（方括号）   : [2025-01-15 10:30:00] 张三: 消息内容
            格式D（紧凑单行） : 张三 2025/1/15 10:30 消息内容
        """
        result = ImportResult()

        if not text or not text.strip():
            result.errors.append("粘贴内容为空")
            return result

        # 统一的时间匹配模式（不捕获，只做定位用）
        dt_pattern = r'\d{4}[/\-年]\d{1,2}[/\-月]\d{1,2}[日]?\s*[上下午]?\s*\d{1,2}:\d{2}(?::\d{2})?'

        # 格式C: [时间] 发送人: 内容（方括号，单行）
        bracket_re = re.compile(
            r'^\[(' + dt_pattern + r')\]\s*(.+?)\s*[:：]\s*(.+)$'
        )

        # 格式A/B: 发送人 + 时间（header 行），内容在下一行
        # 用非贪婪 sender + 时间在行尾
        header_re = re.compile(
            r'^(.+?)\s+(' + dt_pattern + r')\s*$'
        )

        # 格式D: 紧凑单行 - sender 在时间前，内容在时间后
        compact_re = re.compile(
            r'^(.+?)\s+(' + dt_pattern + r')\s+(.+)$'
        )

        lines = text.strip().split("\n")
        groups = OrderedDict()

        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            result.total_rows += 1

            # 1. 尝试格式C: [时间] 发送人: 内容
            m = bracket_re.match(line)
            if m:
                raw_time = m.group(1)
                sender = m.group(2).strip()
                content = m.group(3).strip()
                date_key = self._parse_date_key(raw_time)
                key = (date_key, sender)
                if key not in groups:
                    groups[key] = []
                groups[key].append(content)
                i += 1
                continue

            # 2. 尝试格式A/B: header 行（发送人 + 时间），内容在下一行
            m = header_re.match(line)
            if m:
                sender = m.group(1).strip()
                raw_time = m.group(2)
                date_key = self._parse_date_key(raw_time)
                # 下一行是消息内容
                content = ""
                if i + 1 < len(lines) and lines[i + 1].strip():
                    content = lines[i + 1].strip()
                    i += 2
                else:
                    i += 1
                    result.skipped_count += 1
                    continue

                if not content:
                    result.skipped_count += 1
                    continue

                key = (date_key, sender)
                if key not in groups:
                    groups[key] = []
                groups[key].append(content)
                continue

            # 3. 尝试格式D: 紧凑单行（sender + time + content）
            m2 = compact_re.match(line)
            if m2:
                sender = m2.group(1).strip()
                raw_time = m2.group(2)
                content = m2.group(3).strip()

                if not content:
                    result.skipped_count += 1
                    i += 1
                    continue

                date_key = self._parse_date_key(raw_time)
                key = (date_key, sender)
                if key not in groups:
                    groups[key] = []
                groups[key].append(content)
                i += 1
                continue

            # 无法识别的行，跳过
            result.skipped_count += 1
            i += 1

        # 为每个分组创建笔记
        for (date_key, sender), messages in groups.items():
            title_parts = []
            if sender:
                title_parts.append(f"与 {sender} 的对话")
            if date_key:
                title_parts.append(date_key)
            title = " - ".join(title_parts) if title_parts else "聊天记录"
            body = "\n".join(messages)

            if preview_only:
                note = Note(title=title, content=body, note_type="chat_history",
                            created_at=datetime.now(), updated_at=datetime.now())
                result.notes.append(note)
            else:
                note = crud.create_note(db=db, title=title, content=body, note_type="chat_history")
                result.notes.append(note)
            result.imported_count += 1

        if result.total_rows > 0 and result.imported_count == 0:
            result.errors.append("未能从粘贴内容中识别出聊天记录，请检查格式")

        return result

    def import_call_log_text(self, text: str, db: Session, preview_only: bool = False) -> ImportResult:
        """
        解析粘贴的通话记录纯文本

        支持多种常见格式：
            2025-01-15 15:00  张三  呼出  180秒
            2025/1/15 15:00 来电 张三 3分0秒
            张三 来电 2025-01-15 15:00 通话时长 3分0秒
        """
        result = ImportResult()

        if not text or not text.strip():
            result.errors.append("粘贴内容为空")
            return result

        # 通话类型关键词映射
        call_type_map = {
            "来电": "来电", "呼入": "来电", "incoming": "来电",
            "去电": "去电", "呼出": "去电", "outgoing": "去电", "dial": "去电",
            "未接": "未接", "missed": "未接", "miss": "未接",
        }

        lines = text.strip().split("\n")
        groups = OrderedDict()

        for line in lines:
            line = line.strip()
            if not line:
                continue

            result.total_rows += 1

            # 提取通话类型
            call_type_str = "未知"
            for kw, mapped in call_type_map.items():
                if kw in line.lower():
                    call_type_str = mapped
                    break

            # 提取联系人/号码（去掉日期时间、类型、时长的部分）
            # 去掉日期时间
            cleaned = re.sub(r'\d{4}[/-]\d{1,2}[/-]\d{1,2}[\sT]\d{1,2}:\d{2}(?::\d{2})?', '', line)
            # 去掉时长
            cleaned = re.sub(r'\d+分\d+秒', '', cleaned)
            cleaned = re.sub(r'\d+:\d{2}', '', cleaned)
            cleaned = re.sub(r'\d+秒', '', cleaned)
            # 去掉类型关键词
            for kw in list(call_type_map.keys()):
                cleaned = cleaned.replace(kw, '')
            cleaned = re.sub(r'通话时长|持续时间|时长', '', cleaned)
            # 清理分隔符
            cleaned = re.sub(r'[\t,;|，；、]+', ' ', cleaned).strip()

            contact = cleaned if cleaned else "未知联系人"

            # 提取日期
            date_match = re.search(r'(\d{4}[/-]\d{1,2}[/-]\d{1,2})', line)
            date_key = self._parse_date_key(date_match.group(1)) if date_match else "未知日期"

            # 提取时长
            duration_str = "未知"
            dm = re.search(r'(\d+)分(\d+)秒', line)
            if dm:
                mins, secs = int(dm.group(1)), int(dm.group(2))
                duration_str = f"{mins}分{secs}秒" if mins else f"{secs}秒"
            else:
                ds = re.search(r'(\d+)秒', line)
                if ds:
                    duration_str = f"{ds.group(1)}秒"
                else:
                    dh = re.search(r'(\d+):(\d{2})', line)
                    if dh:
                        total_sec = int(dh.group(1)) * 60 + int(dh.group(2))
                        mins, secs = divmod(total_sec, 60)
                        duration_str = f"{mins}分{secs}秒" if mins else f"{secs}秒"

            if call_type_str == "未接":
                duration_str = "未接通"

            entry = f"- {call_type_str} {contact}（{duration_str}）"

            if date_key not in groups:
                groups[date_key] = []
            groups[date_key].append(entry)

        # 为每天创建笔记
        for date_key, entries in groups.items():
            title = f"通话记录 - {date_key}"
            body = f"共 {len(entries)} 通通话：\n\n" + "\n".join(entries)

            if preview_only:
                note = Note(title=title, content=body, note_type="call_log",
                            created_at=datetime.now(), updated_at=datetime.now())
                result.notes.append(note)
            else:
                note = crud.create_note(db=db, title=title, content=body, note_type="call_log")
                result.notes.append(note)
            result.imported_count += 1

        if result.total_rows > 0 and result.imported_count == 0:
            result.errors.append("未能从粘贴内容中识别出通话记录，请检查格式")

        return result

    def _parse_date_key(self, raw: str) -> str:
        """从各种时间格式中提取日期键 (YYYY-MM-DD)"""
        if not raw:
            return "未知日期"

        # 预处理：将中文日期中的 年月日 替换为标准分隔符
        cleaned_raw = raw.strip()
        cleaned_raw = re.sub(r'(\d{4})年(\d{1,2})月(\d{1,2})日', r'\1-\2-\3', cleaned_raw)
        # 去掉上午/下午
        cleaned_raw = re.sub(r'[上下午]\s*', ' ', cleaned_raw).strip()

        # 常见时间格式尝试
        formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y/%m/%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y/%m/%d %H:%M",
            "%Y-%m-%d",
            "%Y/%m/%d",
            "%Y%m%d%H%M%S",
            "%Y%m%d",
            "%d-%m-%Y %H:%M:%S",
        ]

        # 去掉毫秒
        cleaned = cleaned_raw.split(".")[0].strip()

        for fmt in formats:
            try:
                dt = datetime.strptime(cleaned, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue

        # 如果都失败了，尝试提取 4 位年份
        m = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', cleaned)
        if m:
            return f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}"

        return "未知日期"


# 全局单例
import_service = ImportService()