"""异步任务管理器

在后台线程中运行生成和提取任务，提供状态查询和日志捕获。
"""
import os
import sys
import copy
import uuid
import json
import threading
import traceback
import time
import contextlib
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
from enum import Enum

# 确保项目根目录在 sys.path 中
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import CONFIG
from web.web_config import (
    UPLOAD_DIR, OUTPUT_DIR, MEMORY_DIR, EXTRACT_DIR,
    GENERATE_TIMEOUT, EXTRACT_TIMEOUT, MAX_LOG_LINES,
)


class TaskType(Enum):
    GENERATE = "generate"
    EXTRACT = "extract"


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    TIMEOUT = "timeout"


@dataclass
class TaskInfo:
    """任务信息"""
    task_id: str
    task_type: str  # "generate" / "extract"
    status: str = "pending"
    progress: int = 0  # 0-100
    message: str = ""
    log_lines: List[str] = field(default_factory=list)
    error: str = ""
    created_at: float = 0.0
    finished_at: float = 0.0
    result_file: str = ""  # 生成 PPT 或提取文本的路径
    result_filename: str = ""  # 下载时的文件名
    params: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = asdict(self)
        # 精简日志（避免返回太多行）
        d["log_lines"] = self.log_lines[-MAX_LOG_LINES:]
        return d


class _LogCapture:
    """捕获 stdout 和 stderr 输出到日志列表"""

    def __init__(self, log_lines: List[str]):
        self.log_lines = log_lines

    def write(self, text):
        if text and text.strip():
            self.log_lines.append(text.rstrip())

    def flush(self):
        pass


class TaskManager:
    """任务管理器：管理后台线程和任务状态"""

    def __init__(self):
        self._tasks: Dict[str, TaskInfo] = {}
        self._lock = threading.Lock()
        self._executor = threading.Thread(target=self._cleanup_loop, daemon=True)
        self._executor.start()

    def submit_generate(self, task_id: str, params: dict) -> str:
        """提交生成任务

        Args:
            task_id: 任务 ID（由路由层生成）
            params: 参数字典，包含：
                - input_path: 上传的输入文件路径
                - ai_mode: 挖空模式 (manual/ai/mixed)
                - ai_model: AI 模型名
                - ai_provider: AI 提供商
                - ai_api_key: API key
                - chars_per_page: 每页字符数 (None=自动)
                - max_blanks_per_paragraph: 每段最大挖空数
                - max_retries: 最大重试次数

        Returns:
            task_id
        """
        task = TaskInfo(
            task_id=task_id,
            task_type="generate",
            created_at=time.time(),
            params=params,
        )
        with self._lock:
            self._tasks[task_id] = task

        thread = threading.Thread(
            target=self._run_generate,
            args=(task,),
            daemon=True,
        )
        thread.start()
        return task_id

    def submit_extract(self, task_id: str, params: dict) -> str:
        """提交提取任务

        Args:
            task_id: 任务 ID
            params: 参数字典，包含：
                - input_path: 上传的 PPT 文件路径
                - output_path: 输出文本文件路径

        Returns:
            task_id
        """
        task = TaskInfo(
            task_id=task_id,
            task_type="extract",
            created_at=time.time(),
            params=params,
        )
        with self._lock:
            self._tasks[task_id] = task

        thread = threading.Thread(
            target=self._run_extract,
            args=(task,),
            daemon=True,
        )
        thread.start()
        return task_id

    def get_task(self, task_id: str) -> Optional[TaskInfo]:
        """获取任务信息"""
        with self._lock:
            return self._tasks.get(task_id)

    def get_all_tasks(self) -> List[TaskInfo]:
        """获取所有任务（按创建时间降序）"""
        with self._lock:
            tasks = list(self._tasks.values())
        tasks.sort(key=lambda t: t.created_at, reverse=True)
        return tasks

    def delete_task(self, task_id: str) -> bool:
        """删除任务及其关联文件"""
        with self._lock:
            task = self._tasks.pop(task_id, None)
        if task is None:
            return False

        # 清理关联文件
        for path in [task.result_file, task.params.get("input_path", "")]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass

        # 清理 memory 目录
        mem_dir = os.path.join(MEMORY_DIR, task_id)
        if os.path.exists(mem_dir):
            import shutil
            shutil.rmtree(mem_dir, ignore_errors=True)

        return True

    def shutdown(self):
        """关闭任务管理器"""
        pass  # daemon 线程会自动退出

    # ── 内部方法 ──────────────────────────────────────────

    def _run_generate(self, task: TaskInfo):
        """在后台线程中运行生成任务"""
        task.status = "running"
        task.message = "正在初始化..."

        # 捕获 print 输出
        log_capture = _LogCapture(task.log_lines)

        try:
            with contextlib.redirect_stdout(log_capture), contextlib.redirect_stderr(log_capture):
                # 深拷贝配置，避免污染全局 CONFIG
                cfg = copy.deepcopy(CONFIG)

                # 设置 per-task 路径
                cfg["input_doc"] = task.params["input_path"]
                cfg["output_path"] = os.path.join(OUTPUT_DIR, f"{task.task_id}.pptx")
                cfg["memory_dir"] = os.path.join(MEMORY_DIR, task.task_id)

                # 应用用户参数（跳过空值）
                for key in ("ai_mode", "ai_model", "ai_provider", "ai_api_key",
                            "chars_per_page", "max_blanks_per_paragraph", "max_retries"):
                    val = task.params.get(key)
                    if val is not None and val != "":
                        # chars_per_page 特殊处理：空字符串 = 自动
                        if key == "chars_per_page" and val == "":
                            cfg[key] = None
                        elif key == "max_retries" or key == "max_blanks_per_paragraph":
                            cfg[key] = int(val)
                        elif key == "chars_per_page":
                            cfg[key] = int(val)
                        else:
                            cfg[key] = val

                # 确保 memory 目录存在
                os.makedirs(cfg["memory_dir"], exist_ok=True)

                task.message = "正在解析输入文本..."
                task.progress = 10

                # 导入并运行 loop_engine
                from loop_engine import run_loop

                task.message = "正在生成 PPT..."
                task.progress = 30

                success = run_loop(cfg)

                if success:
                    task.status = "success"
                    task.progress = 100
                    task.message = "生成成功！"
                    task.result_file = cfg["output_path"]
                    task.result_filename = f"挖空PPT_{task.task_id}.pptx"
                else:
                    task.status = "failed"
                    task.message = "生成失败，请检查日志"
                    task.error = "run_loop 返回 False"

        except Exception as e:
            task.status = "failed"
            task.message = f"生成出错: {type(e).__name__}"
            task.error = str(e)
            err_tb = traceback.format_exc()
            task.log_lines.append(f"[ERROR] {err_tb}")

        finally:
            task.finished_at = time.time()
            if task.status == "running":
                task.status = "failed"
                task.message = "未知错误"

    def _run_extract(self, task: TaskInfo):
        """在后台线程中运行提取任务"""
        task.status = "running"
        task.message = "正在提取挖空文本..."

        log_capture = _LogCapture(task.log_lines)

        try:
            with contextlib.redirect_stdout(log_capture), contextlib.redirect_stderr(log_capture):
                from modules.ppt_extractor import extract_blanks_from_pptx

                input_path = task.params["input_path"]
                output_path = os.path.join(EXTRACT_DIR, f"{task.task_id}_extracted.txt")

                task.progress = 50

                content = extract_blanks_from_pptx(input_path, output_path)

                task.status = "success"
                task.progress = 100
                task.message = "提取成功！"
                task.result_file = output_path
                task.result_filename = f"挖空文本_{task.task_id}.txt"

        except Exception as e:
            task.status = "failed"
            task.message = f"提取出错: {type(e).__name__}"
            task.error = str(e)
            err_tb = traceback.format_exc()
            task.log_lines.append(f"[ERROR] {err_tb}")

        finally:
            task.finished_at = time.time()
            if task.status == "running":
                task.status = "failed"
                task.message = "未知错误"

    def _cleanup_loop(self):
        """定期清理旧任务"""
        while True:
            time.sleep(300)  # 每 5 分钟检查一次
            with self._lock:
                tasks = list(self._tasks.values())

            # 按创建时间排序，保留最新的 50 个
            tasks.sort(key=lambda t: t.created_at, reverse=True)
            for task in tasks[50:]:
                self.delete_task(task.task_id)
