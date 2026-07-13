"""
执行结果到时间线节点的高级转换器
Day2 优化：时间戳模拟、特殊状态支持、错误定位增强
"""
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import re

from .structures import (
    TimelineNode, NodeType, NodeStatus,
    generate_node_id, format_iso8601
)


class TimelineNodeFactory:
    """
    时间线节点工厂类
    负责生成各类节点，并模拟真实的时间流逝
    """

    def __init__(self, base_time: datetime):
        """
        初始化工厂

        Args:
            base_time: 基准时间（通常为 submission.created_at）
        """
        self.base_time = base_time
        self.current_time = base_time
        self.node_sequence = 0

    def advance_time(self, milliseconds: int) -> datetime:
        """
        推进当前时间

        Args:
            milliseconds: 推进的毫秒数

        Returns:
            推进后的时间
        """
        self.current_time += timedelta(milliseconds=milliseconds)
        return self.current_time

    def create_node(
        self,
        node_type: NodeType,
        status: NodeStatus,
        title: str,
        description: str,
        duration_ms: int = 0,
        children: List[TimelineNode] = None,
        evidence_refs: List[str] = None,
        metadata: dict = None
    ) -> TimelineNode:
        """
        创建时间线节点（统一入口）

        Args:
            node_type: 节点类型
            status: 节点状态
            title: 标题
            description: 描述
            duration_ms: 持续时间（毫秒）
            children: 子节点列表
            evidence_refs: 证据引用列表
            metadata: 元数据

        Returns:
            TimelineNode 实例
        """
        self.node_sequence += 1
        start_at = self.current_time
        end_at = self.advance_time(duration_ms) if duration_ms > 0 else start_at

        return TimelineNode(
            node_id=generate_node_id(node_type, self.node_sequence),
            node_type=node_type,
            status=status,
            title=title,
            description=description,
            start_at=format_iso8601(start_at),
            end_at=format_iso8601(end_at),
            duration_ms=duration_ms,
            children=children or [],
            evidence_refs=evidence_refs or [],
            metadata=metadata or {}
        )

    def create_submit_node(self) -> TimelineNode:""创建提交接收节点"""
        return self.create_node(
            node_type=NodeType.SUBMIT_RECEIVED,
            status=NodeStatus.SUCCESS,
            title="提交已接收",
            description="代码已提交到评测系统",
            duration_ms=50,
            metadata={"phase": "submit"}
        )

    def create_compile_node(self, has_syntax_error: bool, error_detail: str = None) -> TimelineNode:
        """
        创建编译/语法检查节点

        Args:
            has_syntax_error: 是否有语法错误
            error_detail: 错误详情
        """
        if has_syntax_error:
            description = f"发现语法错误: {error_detail}" if error_detail else "发现语法错误"
            evidence_refs = ["execution_output"]
        else:
            description = "Python 语法检查通过"
            evidence_refs = []

        return self.create_node(
            node_type=NodeType.COMPILE,
            status=NodeStatus.FAILED if has_syntax_error else NodeStatus.SUCCESS,
            title="语法检查",
            description=description,
            duration_ms=120,
            evidence_refs=evidence_refs,
            metadata={"phase": "compile", "has_error": has_syntax_error}
        )

    def create_run_start_node(self) -> TimelineNode:
        """创建开始执行节点"""
        return self.create_node(
            node_type=NodeType.RUN_START,
            status=NodeStatus.SUCCESS,
            title="开始执行",
            description="Pyodide 环境初始化完成，开始运行代码",
            duration_ms=80,
            metadata={"phase": "run"}
        )

    def create_testcase_node(
        self,
        testcase_id: int,
        input_val: str,
        expected: str,
        actual: str,
        is_pass: bool,
        error_type: str = None,
        special_status: str = None
    ) -> TimelineNode:
        """
        创建单个测试用例节点

        Args:
            testcase_id: 测试用例ID
            input_val: 输入值
            expected: 期望输出
            actual: 实际输出
            is_pass: 是否通过
            error_type: 错误类型（如 NameError）
            special_status: 特殊状态（timeout, memory_limit, etc.）

        Returns:
            TimelineNode 实例
        """
        # 确定节点状态
        if special_status == "timeout":
            status = NodeStatus.FAILED
            description = f"输入: {input_val} | 期望: {expected} | 实际: (超时)"
        elif special_status == "memory_limit":
            status = NodeStatus.FAILED
            description = f"输入: {input_val} | 期望: {expected} | 实际: (内存超限)"
        elif is_pass:
            status = NodeStatus.SUCCESS
            description = f"输入: {input_val} | 期望: {expected} | 实际: {actual} ✓"
        else:
            status = NodeStatus.FAILED
            if actual:
                description = f"输入: {input_val} | 期望: {expected} | 实际: {actual} ✗"
            else:
                description = f"输入: {input_val} | 期望: {expected} | 实际: (运行时错误)"

        # 模拟测试用例执行时间（300-500ms）
        duration_ms = 350 if not special_status else 2000 if special_status == "timeout" else 400

        return self.create_node(
            node_type=NodeType.TESTCASE,
            status=status,
            title=f"测试用例 #{testcase_id}",
            description=description,
            duration_ms=duration_ms,
            evidence_refs=[f"testcase_results[{testcase_id-1}]"],
            metadata={
                "testcase_id": testcase_id,
                "error_type": error_type,
                "special_status": special_status
            }
        )

    def create_testcase_loop_node(
        self,
        children: List[TimelineNode],
        passed_count: int,
        total_count: int
    ) -> TimelineNode:
        """
        创建测试用例循环节点（父节点）

        Args:
            children: 子节点列表
            passed_count: 通过数量
            total_count: 总数量
        """
        # 确定父节点状态
        if passed_count == total_count:
            status = NodeStatus.SUCCESS
        elif passed_count > 0:
            status = NodeStatus.WARNING
        else:
            status = NodeStatus.FAILED

        # 计算总持续时间
        tion = sum(child.duration_ms or 0 for child in children)

        return self.create_node(
            node_type=NodeType.TESTCASE_LOOP,
            status=status,
            title="测试用例执行",
            description=f"{passed_count}/{total_count} 测试用例通过",
            duration_ms=total_duration,
            children=children,
            evidence_refs=["testcase_results"],
            metadata={
                "pass_rate": f"{passed_count}/{total_count}",
                "passed_count": passed_count,
                "total_count": total_count
            }
        )

    def create_diagnosis_node(
        self  has_diagnosis: bool,
        diagnosis_id: int = None,
        model_name: str = None,
        latency_ms: int = 0
    ) -> TimelineNode:
        """
        创建诊断节点

        Args:
            has_diagnosis: 是否有诊断结果
            diagnosis_id: 诊断记录ID
            model_name: 模型名称
            latency_ms: 诊断耗时
        """
        if has_diagnosis:
            status = NodeStatus.SUCCESS
            description = "LLM 分析完成，已生成修复建议"
            evidence_refs = ["diagnosis_extract"]
        else:
            status = NodeStatus.FAILED
            description = "诊断未时或模型不可用）"
            evidence_refs = []

        return self.create_node(
            node_type=NodeType.DIAGNOSIS,
            status=status,
            title="智能诊断",
            description=description,
            duration_ms=latency_ms or 3500,
            evidence_refs=evidence_refs,
            metadata={
                "diagnosis_id": diagnosis_id,
                "model": model_name or "unknown",
                "has_result": has_diagnosis
            }
        )

    def create_finish_node(self, is_success: bool, final_status: str) -> TimelineNode:
        """
        创建执行完成节点

        Args:
            is_success: 是否成功
            final_status: 最终状态
        """
        if is_success:
            description = "所有测试用例通过！代码正确 🎉"
        else:
            description = "提交未通过，请根据诊断建议修改代码"

        return self.create_node(
            node_type=NodeType.FINISH,
            status=NodeStatus.SUCCESS if is_success else NodeStatus.FAILED,
            title="执行完成",
            description=description,
            duration_ms=0,
            metadata={"final_status": final_status}
        )


class ErrorLocationParser:
    """
    错误位置解析器（增强版）
    支持多种错误类型的行号和列号提取
    """

    @staticmethod
    def parse(error_trace: str, error_type: str) -> Tuple[Optional[int], Optional[int], Optional[str]]:
        """
        解析错误位置

        Args:
            error_trace: 错误堆栈
            error_type: 错误类型

        Returns:
            (line_number, column_number, error_snippet)
        """
        if not error_trace:
            return None, None, None

        # 1. 提取行号
        line_num = ErrorLocationParser._extract_line_number(error_trace)

        # 2. 提取列号（部分错误类型支持）
        col_num = ErrorLocationParser._extract_column_number(error_trace, error_type)

        # 3. 提取错误代码片段
        snippet = ErrorLocationParser._extract_code_snippet(error_trace)

        return line_num, col_num, snippet

    @staticmethod
    def _extract_line_number(error_trace: str) -> Optional[int]:
        """提取行号"""
        # 匹配 "line X" 模式
        match = re.search(r'line (\d+)', error_trace)
        return int(match.group(1)) if match else None

    @staticmethod
    def _extract_column_number(error_trace: str, error_type: str) -> Optional[int]:
        """
        提取列号（仅部分错误类型支持）

        SyntaxError 通常会显示列号：
        File "<exec>", line 2
            n = int(input()
                           ^
        SyntaxError: invalid syntax
        """
        if error_type == "SyntaxError":
            # 查找 ^ 符号的位置
            lines = error_trace.split('\n')
            for i, line in enumerate(lines):
                if '^' in line:
                    return line.index('^')

        return None

    @staticmethod
    def _extract_code_snippet(error_trace: str) -> Optional[str]:
        """
        提取错误代码片段

        示例:
        File "<exec>", line 2
            n = int(input()
                           ^
        """
        lines = error_trace.split('\n')
        for i, line in enumerate(lines):
            # 查找缩进的代码行（通常在 File "..." 之后）
            if line.strip() and not line.strip().startswith('File') and not line.strip().startswith('Traceback'):
                # 检查下一行是否有 ^ 符号
                if i + 1 < len(lines) and '^' in lines[i + 1]:
                    return line.strip()
                # 或者直接返回第一个缩进行
                if line.startswith('    '):
                    return line.strip()

        return None


class VariableNameExtractor:
    """
    变量名提取器（增强版）
    支持多种错误类型的变量名提取
    """

    @staticmethod
    def extract(error_trace: str, error_type: str) -> Optional[str]:
        """
        从错误信息中提取变量名

        Args:
            error_trace: 错误堆栈
            error_type: 错误类型

        Returns:
            变量名或 None
        """
        if error_type == "NameError":
            return VariableNameExtractor._extract_from_name_error(error_trace)
        elif error_type == "AttributeError":
            return VariableNameExtractor._extract_from_attribute_error(error_trace)
        elif error_type == "KeyError":
            return VariableNameExtractor._extract_from_key_error(error_trace)

        return None

    @staticmethod
    def _extract_from_name_error(error_trace: str) -> Optional[str]:
        """
        从 NameError 提取变量名
        示例: NameError: name 'x' is not defined
        """
        match = re.search(r"name '(\w+)' is not defined", error_trace)
        return match.group(1) if match else None

    @staticmethod
    def _extract_from_attribute_error(error_trace: str) al[str]:
        """
        从 AttributeError 提取属性名
        示例: AttributeError: 'list' object has no attribute 'append_all'
        """
        match = re.search(r"has no attribute '(\w+)'", error_trace)
        return match.group(1) if match else None

    @staticmethod
    def _extract_from_key_error(error_trace: str) -> Optional[str]:
        """
        从 KeyError 提取键名
        示例: KeyError: 'name'
        """
        match = re.search(r"KeyError: ['\"](\w+)['\"]", error_trace)
        return match.group(1) if match else None


class PerformanceMetricsCollector:
    """
    性能指标收集器
    用于在 metadata 中记录各阶段性能数据
    """

    def __init__(self):
        self.metrics = {
            "total_time_ms": 0,
            "compile_time_ms": 0,
            "execution_time_ms": 0,
            "diagnosis_time_ms": 0,
            "testcase_count": 0,
            "avg_testcase_time_ms": 0
        }

    def add_compile_time(self, duration_ms: int):
        """记录编译时间"""
        self.metrics["compile_time_ms"] = duration_ms

    def add_execution_time(self, duration_ms: int):
        """记录执行时间"""
        self.metrics["execution_time_ms"] = duration_ms

    def add_diagnosis_time(self, duration_ms: int):
        """记录诊断时间"""
        self.metrics["diagnosis_time_ms"] = duration_ms

    def add_testcase_time(self, duration_ms: int):
        """记录单个测试用例时间"""
        self.metrics["testcase_count"] += 1
        total_testcase_time = self.metrics.get("total_testcase_time_ms", 0) + duration_ms
        secs["total_testcase_time_ms"] = total_testcase_time
        self.metrics["avg_testcase_time_ms"] = total_testcase_time // self.metrics["testcase_count"]

    def calculate_total_time(self):
        """计算总时间"""
        self.metrics["total_time_ms"] = (
            self.metrics["compile_time_ms"] +
            self.metrics["execution_time_ms"] +
            self.metrics["diagnosis_time_ms"]
        )

    def get_metrics(self) -> dict:
        """获取所有指标"""
        self.calculate_total_time()
        return self.metrics.copy()


# ============ 辅助=====

def detect_special_testcase_status(test_result: dict) -> Optional[str]:
    """
    检测测试用例的特殊状态

    Args:
        test_result: 测试结果字典

    Returns:
        特殊状态字符串或 None
        可能的值: "timeout", "memory_limit", "runtime_error"
    """
    # 检查是否有特殊标记字段
    if test_result.get("timeout"):
        return "timeout"

    if test_result.get("memory_limit_exceeded"):
        return "memory_limit"

    # 检查错误类型
    error_type = test_result.get("error_type")
    if error_type and not test_result.get("pass"):
        return "runtime_error"

    return None


def estimate_execution_time(code_text: str, testcase_count: int) -> int:
    """
    估算代码执行时间（用于模拟真实场景）

    Args:
        code_text: 代码文本
        testcase_count: 测试用例数量

    Returns:
        估算的执行时间（毫秒）
    """
    # 基础时间
    base_time = 100

    # 根据代码行数增加时间
    line_count = len(code_text.split('\n'))
    line_time = line_count * 10

    # 根据测试用例数量增加时间
    testcase_time = testcase_count * 300

    return base_time + line_time + testcase_time


def format_error_message(error_type: str, error_trace: str) -> str:
    """
    格式化错误信息为用户友好的描述

    Args:
        error_type: 错误类型
        error_trace: 错误堆栈

    Returns:
        格式化后的错误描述
    """
    # 提取最后一行错误信息
    lines = error_trace.strip().split('\n')
    last_line = lines[-1] if lines else error_trace

    # 根据错误类型生成友好描述
    friendly_messages = {
        "NameError": "变量未定义",
        "SyntaxError": "语法错误",
        "IndentationError": "缩进错误",
        "TypeError": "类型错误",
        "ValueError": "值错误",
        "ZeroDivisionError": "除零错误",
        "IndexError": "索引越界",
        "KeyError": "键不存在",
        "AttributeError": "属性不存在"
    }

    friendly = friendly_messages.get(error_type, "运行时错误")
    return f"{friendly}: {last_line}"
