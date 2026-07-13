"""
可视化反馈数据结构定义
用于将 Submission 和 DiagnosisRecord 转换为前端可渲染的过程型反馈数据
"""
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class NodeType(str, Enum):
    """时间线节点类型枚举"""
    SUBMIT_RECEIVED = "submit_received"
    COMPILE = "compile"
    RUN_START = "run_start"
    TESTCASE = "testcase"
    TESTCASE_LOOP = "testcase_loop"
    DIAGNOSIS = "diagnosis"
    FINISH = "finish"


class NodeStatus(str, Enum):
    """节点状态枚举"""
    SUCCESS = "success"
    FAILED = "failed"
    WARNING = "warning"
    RUNNING = "running"
    SKIPPED = "skipped"


class SuggestionCategory(str, Enum):
    """建议类别枚举"""
    FIX_ERROR = "fix_error"
    IMPROVE_LOGIC = "improve_logic"
    VERIFY = "verify"
    LEARN = "learn"


class ActionType(str, Enum):
    """操作类型枚举"""
    CODE_EDIT = "code_edit"
    RERUN = "rerun"
    READ_DOC = "read_doc"


@dataclass
class HighlightRange:
    """代码高亮范围"""
    line: int
    start_col: int
    end_col: int
    type: str  # "error" / "warning" / "info"


@dataclass
class CodeSnapshot:
    """代码快照证据"""
    full_code: str
    error_lines: List[int] = field(default_factory=list)
    highlight_ranges: List[HighlightRange] = field(default_factory=list)


@dataclass
class ExecutionOutput:
    """执行输出证据"""
    stdout: str = ""
    stderr: str = ""


@dataclass
class TestcaseResult:
    """单个测试用例结果"""
    testcase_id: int
    input: str
    expected_output: str
    actual_output: str
    match: bool
    error_type: Optional[str] = None


@dataclass
class DiagnosisExtract:
    """诊断摘要提取"""
    root_cause: str
    error_location: str
    knowledge_points: List[str] = field(default_factory=list)


@dataclass
class Evidence:
    """证据集合"""
    code_snapshot: Optional[CodeSnapshot] = None
    execution_output: Optional[ExecutionOutput] = None
    testcase_results: List[TestcaseResult] = field(default_factory=list)
    diagnosis_extract: Optional[DiagnosisExtract] = None


@dataclass
class Suggestion:
    """修复建议"""
    priority: int
    category: SuggestionCategory
    title: str
    description: str
    action_type: ActionType
    target_line: Optional[int] = None
    example_fix: Optional[str] = None


@dataclass
class TimelineNode:
    """时间线节点"""
    node_id: str
    node_type: NodeType
    status: NodeStatus
    title: str
    description: str
    start_at: str  # ISO8601 格式
    end_at: Optional[str] = None
    duration_ms: Optional[int] = None
    children: List['TimelineNode'] = field(default_factory=list)
    evidence_refs: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DataSource:
    """数据来源版本信息"""
    submission_version: int
    diagnosis_id: Optional[int] = None
    diagnosis_version: Optional[int] = None


@dataclass
class Summary:
    """执行摘要"""
    overall_status: str  # "success" / "failed" / "partial"
    pass_rate: str  # "2/3" 格式
    execution_time_ms: int
    error_count: int
    primary_issue: Optional[str] = None


@dataclass
class VisualizationPayload:
    """可视化反馈完整数据载荷"""
    payload_version: str
    generated_at: str  # ISO8601 格式
    submission_id: int
    problem_id: int
    data_source: DataSource
    summary: Summary
    timeline: List[TimelineNode]
    evidence: Evidence
    suggestions: List[Suggestion]

    def to_dict(self) -> Dict[str, Any]:
        """
        转换为字典格式，用于 JSON 序列化
        处理嵌套的 dataclass 和 Enum 类型
        """
        def convert_value(obj):
            if isinstance(obj, Enum):
                return obj.value
            elif isinstance(obj, list):
                return [convert_value(item) for item in obj]
            elif isinstance(obj, dict):
                return {k: convert_value(v) for k, v in obj.items()}
            elif hasattr(obj, '__dataclass_fields__'):
                return {k: convert_value(v) for k, v in asdict(obj).items()}
            else:
                return obj

        return convert_value(asdict(self))


# ============ 辅助函数 ============

def generate_node_id(node_type: NodeType, sequence: int) -> str:
    """
    生成节点唯一标识
    格式: {type}_{序号}
    例如: compile_001, testcase_003
    """
    return f"{node_type.value}_{sequence:03d}"


def calculate_duration_ms(start_at: datetime, end_at: datetime) -> int:
    """
    计算时间差（毫秒）
    """
    delta = end_at - start_at
    return int(delta.total_seconds() * 1000)


def format_iso8601(dt: datetime) -> str:
    """
    格式化为 ISO8601 时间字符串
    """
    return dt.strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'


def parse_error_location(error_trace: str) -> tuple[Optional[int], Optional[int]]:
    """
    从错误堆栈中解析行号和列号

    示例输入:
    Traceback (most recent call last):
      File "<exec>", line 2, in <module>
    NameError: name 'x' is not defined

    返回: (line_number, column_number) 或 (None, None)
    """
    import re

    # 匹配 "line X" 模式
    line_match = re.search(r'line (\d+)', error_trace)
    line_num = int(line_match.group(1)) if line_match else None

    # Python 错误堆栈通常不包含列号，需要从代码分析
    # 这里返回 None，后续在代码分析时补充
    return line_num, None


def extract_variable_name_from_error(error_trace: str, error_type: str) -> Optional[str]:
    """
    从错误信息中提取变量名

    示例:
    NameError: name 'x' is not defined -> 'x'
    """
    import re

    if error_type == "NameError":
        match = re.search(r"name '(\w+)' is not defined", error_trace)
        return match.group(1) if match else None

    return None


def calculate_pass_rate(passed: int, total: int) -> str:
    """
    计算通过率字符串
    返回格式: "2/3"
    """
    return f"{passed}/{total}"


# ============ 默认值生成器 ============

def create_default_evidence() -> Evidence:
    """创建默认空证据对象"""
    return Evidence(
        code_snapshot=None,
        execution_output=ExecutionOutput(stdout="", stderr=""),
        testcase_results=[],
        diagnosis_extract=None
    )


def create_placeholder_node(node_type: NodeType, message: str = "数据不可用") -> TimelineNode:
    """
    创建占位节点（用于数据缺失场景）
    """
    now = datetime.now()
    return TimelineNode(
        node_id=generate_node_id(node_type, 999),
        node_type=node_type,
        status=NodeStatus.SKIPPED,
        title=f"{node_type.value} (占位)",
        description=message,
        start_at=format_iso8601(now),
        end_at=format_iso8601(now),
        duration_ms=0,
        children=[],
        evidence_refs=[],
        metadata={"placeholder": True}
    )
