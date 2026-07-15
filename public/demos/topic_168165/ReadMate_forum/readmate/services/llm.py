"""LLM 服务 - 统一接口封装 MiniMax/OpenAI 兼容调用

功能：
- 复用 OpenAI 客户端实例（连接池）
- 所有流式调用统一 30s 超时
- 异常时 yield 友好错误消息而非崩溃
- 自动过滤 <think> 思维链标签
"""
import base64
import re
import time
from pathlib import Path
from typing import Optional, Generator, List, Dict, Any

from openai import OpenAI, APIError, APIConnectionError, APITimeoutError, RateLimitError, AuthenticationError

from ..core.config import get_config
from ..core.logger import get_logger
from ..core.exceptions import LLMError

logger = get_logger(__name__)

# 用户可读 LLM 调用日志（独立于 logger，写到 %USERPROFILE%\.readmate\readmate_llm.log）
_LLM_LOG_PATH = Path.home() / ".readmate" / "readmate_llm.log"


def _llm_log(msg: str) -> None:
    """写一行到 readmate_llm.log（含时间戳和 PID）"""
    try:
        _LLM_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        import os
        ts = time.strftime("%H:%M:%S")
        line = f"[{ts}][PID {os.getpid()}] {msg}\n"
        with _LLM_LOG_PATH.open("a", encoding="utf-8") as f:
            f.write(line)
    except Exception:
        pass

_TK_PATTERN = re.compile(r"<think>.*?</think>", re.DOTALL)
_TK_OPEN_PATTERN = re.compile(r"<think>.*$", re.DOTALL)

# API 请求超时（秒）
REQUEST_TIMEOUT = 30.0
# 最大重试次数
MAX_RETRIES = 2


class LLMService:
    """LLM 服务统一接口（线程安全，客户端复用）"""

    def __init__(self):
        self._cfg = get_config()
        self._client: Optional[OpenAI] = None

    def _get_client(self) -> OpenAI:
        """获取或创建 OpenAI 兼容客户端（复用连接池）

        当 api_key 为空/占位符时，启用 Mock 模式（不连真 LLM，
        用预制的演示回答流式输出），保证初赛 Demo 评审不依赖网络和 key。
        """
        if self._client is not None:
            return self._client
        api_key = self._cfg.get("minimax_api_key", "")
        if not api_key or api_key == "placeholder_for_ui_test":
            # Mock 模式：返回一个不可用的"客户端"对象（实际不会真调用）
            # 上层会通过 _should_use_mock() 走 mock 分支
            self._client = None
            return None
        self._client = OpenAI(
            api_key=api_key,
            base_url=self._cfg.get("base_url") or self._cfg.get("minimax_base_url", "https://api.minimaxi.com/v1"),
            timeout=REQUEST_TIMEOUT,
        )
        return self._client

    def _should_use_mock(self) -> bool:
        """是否启用 Mock LLM（无 key 时自动启用，方便 Demo 评审）"""
        api_key = self._cfg.get("minimax_api_key", "")
        return not api_key or api_key == "placeholder_for_ui_test"

    def _mock_stream(self, action: str, selected_text: str) -> Generator[str, None, None]:
        """Mock 流式输出：模拟打字机效果，用预制回答展示完整功能

        评审不配 API Key 也能体验到：流式输出、Markdown 渲染、面板交互。
        第一个 yield 出去的是 [MOCK_MODE] 标记，answer_panel 会消费掉它并显示提示条。
        """
        import time as _time

        # 第一个 chunk 是 Mock 模式标记（answer_panel 会识别并显示提示条）
        yield "[MOCK_MODE]"

        # 根据 action 选不同的预设回答
        snippets = {
            "解释": (
                f"**{selected_text[:20] if selected_text else '这段内容'}** 是 ReadMate 的核心场景。\n\n"
                f"**含义**：让用户选中屏幕任意文字后，一键获得 AI 解释。\n\n"
                f"**使用方式**：\n"
                f"1. 选中文字（任何应用都行）\n"
                f"2. 鼠标附近弹出青色浮动按钮\n"
                f"3. 点按钮 → 答案面板流式显示\n\n"
                f"（Mock 演示模式，配置 API Key 后启用真实 LLM）"
            ),
            "翻译": (
                f"**Translation (Mock Mode)**:\n\n"
                f"Selected: {selected_text[:50] if selected_text else 'this content'}\n\n"
                f"→ A desktop AI assistant that lets you ask questions about selected text with one click.\n\n"
                f"（Mock 演示模式，配 API Key 后启用真实翻译）"
            ),
            "总结": (
                f"**核心要点**（Mock 演示）：\n\n"
                f"- 选区监听：跨应用识别用户选中的文字\n"
                f"- 浮动按钮：鼠标位置弹出，一键提问\n"
                f"- 流式输出：AI 回答逐字显示，Markdown 渲染\n\n"
                f"（Mock 演示模式，配 API Key 后启用真实 LLM）"
            ),
            "分析": (
                f"**多维分析**（Mock 演示）：\n\n"
                f"**背景**：日常读文档/网页时频繁想查 AI\n\n"
                f"**原理**：选区监听 + 浮动 UI + LLM 流式\n\n"
                f"**应用**：学习/工作/研究场景的即时辅助\n\n"
                f"（Mock 演示模式，配 API Key 后启用真实分析）"
            ),
        }
        answer = snippets.get(action, snippets["解释"])

        # 模拟打字机：每 50ms yield 2-3 个字符
        _llm_log(f"⚙️ 使用 Mock LLM（无 API Key），action={action}")
        i = 0
        while i < len(answer):
            # 一次 yield 2-3 字符（模拟 chunk）
            step = 2 + (i % 2)
            chunk = answer[i:i+step]
            yield chunk
            i += step
            _time.sleep(0.04)  # 40ms per chunk → 接近真实 LLM 流速

    def reset_client(self):
        """重置客户端（配置变更后调用）"""
        self._client = None

    @staticmethod
    def _image_to_data_uri(image_bytes: bytes) -> str:
        b64 = base64.b64encode(image_bytes).decode("utf-8")
        return f"data:image/jpeg;base64,{b64}"

    @staticmethod
    def _strip_think(text: str, in_think: bool) -> tuple:
        result = text
        if in_think:
            close_match = re.search(r"</think>", result)
            if close_match:
                result = result[close_match.end():]
                in_think = False
            else:
                return "", True
        while "<think>" in result:
            close_match = re.search(r"</think>", result)
            if close_match:
                result = _TK_PATTERN.sub("", result)
            else:
                idx = result.find("<think>")
                result = result[:idx]
                in_think = True
                break
        return result, in_think

    def _safe_call_stream(
        self,
        messages: List[Dict[str, Any]],
        max_tokens: int,
        temperature: float,
        action_label: str = "AI",
        selected_text: str = "",
    ) -> Generator[str, None, None]:
        """统一的流式调用封装：含超时、重试、异常处理。

        出错时 yield 以 "⚠️" 开头的友好错误消息。
        无 API Key 时自动走 Mock 分支（不连真 LLM）。
        """
        _llm_log(f"▶ {action_label} 开始调用，模型={self._cfg.get('minimax_model')}, "
                 f"base_url={self._cfg.get('base_url') or self._cfg.get('minimax_base_url')}, "
                 f"api_key={'SET' if self._cfg.get('minimax_api_key') else 'EMPTY'}, "
                 f"消息数={len(messages)}")

        # Mock 分支：无 key 时返回预制流式回答（保证 Demo 评审可用）
        if self._should_use_mock():
            action_name = action_label.strip("[]") or "解释"
            yield from self._mock_stream(action_name, selected_text)
            return

        client = self._get_client()
        model = self._cfg.get("minimax_model") or "MiniMax-M3"
        t0 = time.time()
        in_think = False
        total_chars = 0
        chunk_count = 0

        last_err: Optional[Exception] = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                stream = client.chat.completions.create(
                    model=model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    stream=True,
                    timeout=REQUEST_TIMEOUT,
                )
                for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    text = getattr(delta, "content", None) or ""
                    if not text:
                        text = getattr(delta, "reasoning_content", None) or ""
                    if not text:
                        continue
                    visible, in_think = self._strip_think(text, in_think)
                    if visible:
                        total_chars += len(visible)
                        chunk_count += 1
                        if chunk_count <= 5:
                            _llm_log(f"  chunk #{chunk_count}: {visible!r}")
                        yield visible

                elapsed = time.time() - t0
                _llm_log(f"✅ {action_label} 完成，耗时 {elapsed:.1f}s, chunks={chunk_count}, 字数={total_chars}")
                logger.info(f"{action_label} 流式回答耗时 {elapsed:.1f}s, 字数 {total_chars}")
                return

            except AuthenticationError as e:
                _llm_log(f"❌ 认证失败: {e}")
                logger.error(f"{action_label} 认证失败: {e}")
                yield "⚠️ API Key 无效，请检查配置后重试。"
                return
            except APITimeoutError as e:
                last_err = e
                _llm_log(f"⏱ 超时 (第{attempt+1}次): {e}")
                logger.warning(f"{action_label} 请求超时 (第{attempt+1}次): {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                yield "⚠️ 请求超时，请检查网络后重试。"
                return
            except APIConnectionError as e:
                last_err = e
                logger.warning(f"{action_label} 连接失败 (第{attempt+1}次): {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                yield "⚠️ 网络连接失败，请检查网络后重试。"
                return
            except RateLimitError as e:
                logger.error(f"{action_label} 触发限流: {e}")
                yield "⚠️ 请求过于频繁，请稍后再试。"
                return
            except APIError as e:
                logger.error(f"{action_label} API 错误: {e}", exc_info=True)
                yield f"⚠️ AI 服务错误: {getattr(e, 'message', str(e))[:80]}"
                return
            except Exception as e:
                logger.error(f"{action_label} 未知错误: {e}", exc_info=True)
                yield f"⚠️ 出错了: {str(e)[:80]}"
                return

        if last_err:
            logger.error(f"{action_label} 重试{MAX_RETRIES}次后仍失败: {last_err}")

    # ==================== 预设动作 ====================

    def ask_stream(
        self,
        selected_text: str,
        action: str = "解释",
        screenshot: Optional[bytes] = None,
        recent_screenshots: Optional[List[bytes]] = None,
    ) -> Generator[str, None, None]:
        action_prompts = {
            "解释": f"用户在阅读时选中了以下内容，请结合屏幕上下文简洁地解释它。\n\n选中内容:\n{selected_text}",
            "翻译": f"将以下选中的内容翻译成中文。如果是中文则翻译成英文。\n\n选中内容:\n{selected_text}",
            "总结": f"用户选中了以下内容，请结合屏幕上下文，用 3 个要点总结其核心意思。\n\n选中内容:\n{selected_text}",
            "分析": f"用户选中了以下内容，请结合屏幕上下文，从背景、原理、应用三个维度分析。\n\n选中内容:\n{selected_text}",
        }
        prompt = action_prompts.get(action, action_prompts["解释"])

        content: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
        # 暂时禁用截图上传：避免真实 LLM 因屏幕内容敏感而返回 422
        # if screenshot:
        #     content.append({
        #         "type": "image_url",
        #         "image_url": {"url": self._image_to_data_uri(screenshot), "detail": "low"},
        #     })
        # if recent_screenshots:
        #     content.append({"type": "text", "text": "以下是用户最近看过的屏幕内容（按时间倒序）:"})
        #     for img in recent_screenshots[-3:]:
        #         content.append({
        #             "type": "image_url",
        #             "image_url": {"url": self._image_to_data_uri(img), "detail": "low"},
        #         })

        messages = [
            {
                "role": "system",
                "content": (
                    "你是 ReadMate，一个常驻桌面的屏幕阅读伴侣。"
                    "用户在阅读时遇到不懂的内容，选中后点击你询问。"
                    "请用简洁、准确、口语化的方式回答，像朋友间解释一样。"
                    "回答不超过 200 字。"
                    "禁止输出 <think 标签，直接输出回答正文。"
                ),
            },
            {"role": "user", "content": content},
        ]
        yield from self._safe_call_stream(messages, max_tokens=600, temperature=0.7, action_label=f"[{action}]", selected_text=selected_text)

    def ask(
        self,
        selected_text: str,
        action: str = "解释",
        screenshot: Optional[bytes] = None,
        recent_screenshots: Optional[List[bytes]] = None,
    ) -> str:
        return "".join(self.ask_stream(selected_text, action, screenshot, recent_screenshots))

    # ==================== 自定义提问 ====================

    def ask_custom_stream(
        self,
        selected_text: str,
        custom_question: str,
        screenshot: Optional[bytes] = None,
        recent_screenshots: Optional[List[bytes]] = None,
    ) -> Generator[str, None, None]:
        prompt = (
            f"用户在阅读时选中了以下内容，并提出了一个自定义问题。"
            f"请结合屏幕上下文回答。\n\n选中内容:\n{selected_text}\n\n用户问题:\n{custom_question}"
        )
        content: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
        # 暂时禁用截图上传：避免真实 LLM 因屏幕内容敏感而返回 422
        # if screenshot:
        #     content.append({"type": "image_url", "image_url": {"url": self._image_to_data_uri(screenshot), "detail": "low"}})
        # if recent_screenshots:
        #     content.append({"type": "text", "text": "以下是用户最近看过的屏幕内容（按时间倒序）:"})
        #     for img in recent_screenshots[-3:]:
        #         content.append({"type": "image_url", "image_url": {"url": self._image_to_data_uri(img), "detail": "low"}})

        messages = [
            {
                "role": "system",
                "content": (
                    "你是 ReadMate，一个常驻桌面的屏幕阅读伴侣。"
                    "用户选中文字后提出了自定义问题，请结合屏幕上下文回答。"
                    "请用简洁、准确、口语化的方式回答。"
                    "回答不超过 300 字。"
                    "禁止输出 <think 标签，直接输出回答正文。"
                ),
            },
            {"role": "user", "content": content},
        ]
        yield from self._safe_call_stream(messages, max_tokens=800, temperature=0.7, action_label="[自定义提问]", selected_text=selected_text)

    def ask_custom(
        self,
        selected_text: str,
        custom_question: str,
        screenshot: Optional[bytes] = None,
        recent_screenshots: Optional[List[bytes]] = None,
    ) -> str:
        return "".join(self.ask_custom_stream(selected_text, custom_question, screenshot, recent_screenshots))

    # ==================== 追问 ====================

    def ask_followup_stream(
        self,
        selected_text: str,
        conversation_history: List[Dict[str, str]],
        followup_question: str,
        screenshot: Optional[bytes] = None,
    ) -> Generator[str, None, None]:
        messages: List[Dict[str, Any]] = [
            {
                "role": "system",
                "content": (
                    "你是 ReadMate，一个常驻桌面的屏幕阅读伴侣。"
                    "用户最初选中了一段文字向你提问，现在基于之前的回答继续追问。"
                    "请结合上下文和之前的对话，继续用简洁、准确、口语化的方式回答。"
                    "回答不超过 200 字。"
                    "禁止输出 <think 标签，直接输出回答正文。"
                ),
            },
        ]
        for msg in conversation_history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if content:
                messages.append({"role": role, "content": content})

        user_content: List[Dict[str, Any]] = []
        # 暂时禁用截图上传：避免真实 LLM 因屏幕内容敏感而返回 422
        # if screenshot:
        #     user_content.append({"type": "image_url", "image_url": {"url": self._image_to_data_uri(screenshot), "detail": "low"}})
        q_text = f"用户最初选中的内容:\n{selected_text}\n\n追问: {followup_question}"
        user_content.append({"type": "text", "text": q_text})
        messages.append({"role": "user", "content": user_content})

        yield from self._safe_call_stream(messages, max_tokens=600, temperature=0.7, action_label="[追问]", selected_text=selected_text)

    def ask_followup(
        self,
        selected_text: str,
        conversation_history: List[Dict[str, str]],
        followup_question: str,
        screenshot: Optional[bytes] = None,
    ) -> str:
        return "".join(self.ask_followup_stream(selected_text, conversation_history, followup_question, screenshot))
