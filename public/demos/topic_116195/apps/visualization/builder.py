"""
可视化反馈数据转换器
负责将 Submission 和 DiagnosisRecord 模型转换为 VisualizationPayload
"""
from datetime import datetime
from typing import List, Optional
import json

from .structures import (
    VisualizationPayload, TimelineNode, Evidence, Suggestion,
    DataSource, Summary, CodeSnapshot, ExecutionOutput, TestcaseResult,
    DiagnosisExtract, HighlightRange,
    NodeType, NodeStatus, SuggestionCategory, ActionType,
    generate_node_id, calculate_duration_ms, format_iso8601,
    parse_error_location, extract_variable_name_from_error,
    calculate_pass_rate, create_default_evidence, create_placeholder_node
)


class VisualizationPayloadBuilder:
    """
    可视化反馈数据构建器
    核心职责：将数据库模型转换为前端可渲染的结构化数据
    """

    PAYLOAD_VERSION = "1.0"

    def __init__(self, submission, diagnosis_record=None):
        """
        初始化构建器

        Args:
            submission: Submission 模型实例
            diagnosis_record: DiagnosisRecord 模型实例（可选）
        """
        self.submission = submission
        self.diagnosis = diagnosis_record
        self.node_sequence = 0  # 节点序号计数器

    def build(self) -> VisualizationPayload:
        """
        构建完整的可视化反馈数据

        Returns:
            VisualizationPayload 实例
        """
        return VisualizationPayload(
            payload_version=self.PAYLOAD_VERSION,
            generated_at=format_iso8601(datetime.now()),
            submission_id=self.submission.id,
            problem_id=self.submission.problem_id,
            data_source=self._build_data_source(),
            summary=self._build_summary(),
            timeline=self._build_timeline(),
            evidence=self._build_evidence(),
            suggestions=self._build_suggestions()
        )

    def _build_data_source(self) -> DataSource:
        """构建数据来源信息"""
        return DataSource(
            submission_version=1,  # 当前版本固定为1
            diagnosis_id=self.diagnosis.id if self.diagnosis else None,
            diagnosis_version=1 if self.diagnosis else None
        )

    def _build_summary(self) -> Summary:
        """
        构建执行摘要
        从 Submission 中提取关键指标
        """
        # 解析测试结果（假设 test_results 字段存储 JSON）
        test_results = self._parse_test_results()
        passed_count = sum(1 for r in test_results if r.get('pass', False))
        total_count = len(test_results)

        # 确定整体状态
        if self.submission.status == 'accepted':
            overall_status = 'success'
        elif passed_count > 0:
            overall_status = 'partial'
        else:
            overall_status = 'failed'

        # 计算执行时间（毫秒）
        execution_time_ms = getattr(self.submission, 'execution_time_ms', 0)

        # 统计错误数量
        error_count = 1 if self.submission.error_type else 0

        # 提取主要问题
        primary_issue = None
        if self.submission.error_type:
            primary_issue = f"{self.submission.error_type}: {self._extract_error_message()}"

        return Summary(
            overall_status=overall_status,
            pass_rate=calculate_pass_rate(passed_count, total_count),
            execution_time_ms=execution_time_ms,
            error_count=error_count,
            primary_issue=primary_issue
        )

    def _build_timeline(self) -> List[TimelineNode]:
        """
        构建时间线节点数组
        按执行阶段顺序生成节点
        """
        timeline = []

        # 1. 提交接收节点
        timeline.append(self._create_submit_node())

        # 2. 编译/语法检查节点
        timeline.append(self._create_compile_node())

        # 3. 开始执行节点
        if self.submission.error_type != 'SyntaxError':
            timeline.append(self._create_run_start_node())

            # 4. 测试用例循环节点（包含子节点）
            timeline.append(self._create_testcase_loop_node())

        # 5. 诊断节点（如果有诊断记录）
        if self.diagnosis:
            timeline.append(self._create_diagnosis_node())

        # 6. 执行完成节点
        timeline.append(self._create_finish_node())

        return timeline

    def _create_submit_node(self) -> TimelineNode:
        """创建提交接收节点"""
        self.node_sequence += 1
        start_time = self.submission.created_at
        end_time = start_time  # 假设接收瞬间完成

        return TimelineNode(
            node_id=generate_node_id(NodeType.SUBMIT_RECEIVED, self.node_sequence),
            node_type=NodeType.SUBMIT_RECEIVED,
            status=NodeStatus.SUCCESS,
            title="提交已接收",
            description=f"代码已提交到评测系统（题目ID: {self.submission.problem_id}）",
            start_at=format_iso8601(start_time),
            end_at=format_iso8601(end_time),
            duration_ms=0,
            children=[],
            evidence_refs=[],
            metadata={}
        )

    def _create_compile_node(self) -> TimelineNode:
        """创建编译/语法检查节点"""
        self.node_sequence += 1
        start_time = self.submission.created_at
        # 假设语法检查耗时 100-200ms
        end_time = start_time

        # 判断是否有语法错误
        has_syntax_error = self.submission.error_type == 'SyntaxError'

        return TimelineNode(
            node_id=generate_node_id(NodeType.COMPILE, self.node_sequence),
            node_type=NodeType.COMPILE,
            status=NodeStatus.FAILED if has_syntax_error else NodeStatus.SUCCESS,
            title="语法检查",
            description="发现语法错误" if has_syntax_error else "Python 语法检查通过",
            start_at=format_iso8601(start_time),
            end_at=format_iso8601(end_time),
            duration_ms=0,
            children=[],
            evidence_refs=["execution_output"] if has_syntax_error else [],
            metadata={}
        )

    def _create_run_start_node(self) -> TimelineNode:
        """创建开始执行节点"""
        self.node_sequence += 1
        start_time = self.submission.created_at
        end_time = start_time

        return TimelineNode(
            node_id=generate_node_id(NodeType.RUN_START, self.node_sequence),
            node_type=NodeType.RUN_START,
            status=NodeStatus.SUCCESS,
            title="开始执行",
            description="Pyodide 环境初始化完成，开始运行代码",
            start_at=format_iso8601(start_time),
            end_at=format_iso8601(end_time),
            duration_ms=0,
            children=[],
            evidence_refs=[],
            metadata={}
        )

    def _create_testcase_loop_node(self) -> TimelineNode:
        """
        创建测试用例循环节点（父节点）
        包含所有测试用例子节点
        """
        self.node_sequence += 1
        test_results = self._parse_test_results()

        # 创建子节点
        children = []
        for idx, test_result in enumerate(test_results, start=1):
            children.append(self._create_testcase_child_node(idx, test_result))

        # 统计通过情况
        passed_count = sum(1 for r in test_results if r.get('pass', False))
        total_count = len(test_results)

        # 确定父节点状态
        if passed_count == total_count:
            status = NodeStatus.SUCCESS
        elif passed_count > 0:
            status = NodeStatus.WARNING
        else:
            status = NodeStatus.FAILED

        start_time = self.submission.created_at
        end_time = start_time

        return TimelineNode(
            node_id=generate_node_id(NodeType.TESTCASE_LOOP, self.node_sequence),
            node_type=NodeType.TESTCASE_LOOP,
            status=status,
            title="测试用例执行",
            description=f"{passed_count}/{total_count} 测试用例通过",
            start_at=format_iso8601(start_time),
            end_at=format_iso8601(end_time),
            duration_ms=0,
            children=children,
            evidence_refs=["testcase_results"],
            metadata={"pass_rate": calculate_pass_rate(passed_count, total_count)}
        )

    def _create_testcase_child_node(self, index: int, test_result: dict) -> TimelineNode:
        """
        创建单个测试用例子节点

        Args:
            index: 测试用例序号
            test_result: 测试结果字典 {"input": "4", "expected": "True", "actual": "True", "pass": True}
        """
        self.node_sequence += 1
        is_pass = test_result.get('pass', False)
        input_val = test_result.get('input', '')
        expected = test_result.get('expected', '')
        actual = test_result.get('actual', '')

        # 构建描述文本
        if is_pass:
            description = f"输入: {input_val} | 期望: {expected} | 实际: {actual} ✓"
        else:
            if actual:
                description = f"输入: {input_val} | 期望: {expected} | 实际: {actual} ✗"
            else:
                description = f"输入: {input_val} | 期望: {expected} | 实际: (运行时错误)"

        start_time = self.submission.created_at
        end_time = start_time

        return TimelineNode(
            node_id=generate_node_id(NodeType.TESTCASE, self.node_sequence),
            node_type=NodeType.TESTCASE,
            status=NodeStatus.SUCCESS if is_pass else NodeStatus.FAILED,
            title=f"测试用例 #{index}",
            description=description,
            start_at=format_iso8601(start_time),
            end_at=format_iso8601(end_time),
            duration_ms=0,
            children=[],
            evidence_refs=[f"testcase_results[{index-1}]"],
            metadata={"testcase_id": index}
        )

    def _create_diagnosis_node(self) -> TimelineNode:
        """创建诊断节点"""
        self.node_sequence += 1
        start_time = self.diagnosis.created_at if self.diagnosis else self.submission.created_at
        end_time = start_time

        # 判断诊断是否成功
        has_diagnosis = bool(self.diagnosis and self.diagnosis.diagnosis_text)

        return TimelineNode(
            node_id=generate_node_id(NodeType.DIAGNOSIS, self.node_sequence),
            node_type=NodeType.DIAGNOSIS,
            status=NodeStatus.SUCCESS if has_diagnosis else NodeStatus.FAILED,
            title="智能诊断",
            description="LLM 分析完成，已生成修复建议" if has_diagnosis else "诊断未完成或失败",
            start_at=format_iso8601(start_time),
            end_at=format_iso8601(end_time),
            duration_ms=getattr(self.diagnosis, 'latency_ms', 0) if self.diagnosis else 0,
            children=[],
            evidence_refs=["diagnosis_extract"] if has_diagnosis else [],
            metadata={
                "diagnosis_id": self.diagnosis.id if self.diagnosis else None,
                "model": getattr(self.diagnosis, 'model_name', 'unknown') if self.diagnosis else None
            }
        )

    def _create_finish_node(self) -> TimelineNode:
        """创建执行完成节点"""
        self.node_sequence += 1
        end_time = self.submission.updated_at or self.submission.created_at

        is_success = self.submission.status == 'accepted'

        return TimelineNode(
            node_id=generate_node_id(NodeType.FINISH, self.node_sequence),
            node_type=NodeType.FINISH,
            status=NodeStatus.SUCCESS if is_success else NodeStatus.FAILED,
            title="执行完成",
            description="所有测试用例通过！" if is_success else "提交未通过，请根据诊断建议修改代码",
            start_at=format_iso8601(end_time),
            end_at=format_iso8601(end_time),
            duration_ms=0,
            children=[],
            evidence_refs=[],
            metadata={"final_status": self.submission.status}
        )

    def _build_evidence(self) -> Evidence:
        """
        构建证据集合
        整合代码快照、执行输出、测试结果、诊断摘要
        """
        # 1. 代码快照
        code_snapshot = self._build_code_snapshot()

        # 2. 执行输出
        execution_output = ExecutionOutput(
            stdout=getattr(self.submission, 'stdout_text', ''),
            stderr=getattr(self.submission, 'error_trace', '')
        )

        # 3. 测试用例结果
        testcase_results = self._build_testcase_results()

        # 4. 诊断摘要
        diagnosis_extract = self._build_diagnosis_extract() if self.diagnosis else None

        return Evidence(
            code_snapshot=code_snapshot,
            execution_output=execution_output,
            testcase_results=testcase_results,
            diagnosis_extract=diagnosis_extract
        )

    def _build_code_snapshot(self) -> CodeSnapshot:
        """构建代码快照"""
        code_text = self.submission.code_text

        # 解析错误行号
        error_lines = []
        highlight_ranges = []

        if self.submission.error_type:
            line_num, col_num = parse_error_location(
                getattr(self.submission, 'error_trace', '')
            )
            if line_num:
                error_lines.append(line_num)

                # 尝试提取变量名并生成高亮范围
                var_name = extract_variable_name_from_error(
                    getattr(self.submission, 'error_trace', ''),
                    self.submission.error_type
                )
                if var_name and col_num is None:
                    # 在代码中查找变量位置
                    lines = code_text.split('\n')
                    if 0 < line_num <= len(lines):
                        line_text = lines[line_num - 1]
                        start_col = line_text.find(var_name)
                        if start_col != -1:
                            highlight_ranges.append(HighlightRange(
                                line=line_num,
                                start_col=start_col,
                                end_col=start_col + len(var_name),
                                type="error"
                            ))

        return CodeSnapshot(
            full_code=code_text,
            error_lines=error_lines,
            highlight_ranges=highlight_ranges
        )

    def _build_testcase_results(self) -> List[TestcaseResult]:
        """构建测试用例结果列表"""
        test_results = self._parse_test_results()
        results = []

        for idx, test_result in enumerate(test_results, start=1):
            results.append(TestcaseResult(
                testcase_id=idx,
                input=test_result.get('input', ''),
                expected_output=test_result.get('expected', ''),
                actual_output=test_result.get('actual', ''),
                match=test_result.get('pass', False),
                error_type=self.submission.error_type if not test_result.get('pass') else None
            ))

        return results

    def _build_diagnosis_extract(self) -> Optional[DiagnosisExtract]:
        """从 DiagnosisRecord 提取结构化诊断信息"""
        if not self.diagnosis:
            return None

        # 提取根因（假设 diagnosis 有 root_cause 字段或从 diagnosis_text 提取）
        root_cause = getattr(self.diagnosis, 'root_cause', '') or self._extract_root_cause_from_text()

        # 提取错误位置
        error_location = getattr(self.diagnosis, 'error_location', '') or self._extract_error_location()

        # 提取知识点
        knowledge_points = getattr(self.diagnosis, 'knowledge_points', [])
        if isinstance(knowledge_points, str):
            knowledge_points = json.loads(knowledge_points) if knowledge_points else []

        return DiagnosisExtract(
            root_cause=root_cause,
            error_location=error_location,
            knowledge_points=knowledge_points
        )

    def _build_suggestions(self) -> List[Suggestion]:
        """
        构建修复建议列表
        从 DiagnosisRecord 的 fix_suggestions 字段提取
        """
        if not self.diagnosis:
            return []

        suggestions = []

        # 假设 diagnosis 有 fix_suggestions 字段（JSON 数组或文本）
        fix_suggestions_raw = getattr(self.diagnosis, 'fix_suggestions', '')

        if isinstance(fix_suggestions_raw, str):
            try:
                fix_suggestions = json.loads(fix_suggestions_raw) if fix_suggestions_raw else []
            except json.JSONDecodeError:
                # 如果不是 JSON，按行分割
                fix_suggestions = [s.strip() for s in fix_suggestions_raw.split('\n') if s.strip()]
        else:
            fix_suggestions = fix_suggestions_raw

        # 转换为 Suggestion 对象
        for idx, suggestion_text in enumerate(fix_suggestions, start=1):
            suggestions.append(Suggestion(
                priority=idx,
                category=SuggestionCategory.FIX_ERROR if idx == 1 else SuggestionCategory.VERIFY,
                title=f"建议 {idx}",
                description=suggestion_text,
                action_type=ActionType.CODE_EDIT if idx == 1 else ActionType.RERUN,
                target_line=None,  # 需要进一步解析
                example_fix=None
            ))

        # 添加默认的验证建议
        if suggestions:
            suggestions.append(Suggestion(
                priority=len(suggestions) + 1,
                category=SuggestionCategory.VERIFY,
                title="验证修复后的输出",
                description="修改后重新运行，确保所有测试用例通过。",
                action_type=ActionType.RERUN,
                target_line=None,
                example_fix=None
            ))

        return suggestions

    # ============ 辅助方法 ============

    def _parse_test_results(self) -> List[dict]:
        """
        解析测试结果
        假设 Submission 有 test_results 字段存储 JSON
        """
        test_results_raw = getattr(self.submission, 'test_results', '')

        if isinstance(test_results_raw, str):
            try:
                return json.loads(test_results_raw) if test_results_raw else []
            except json.JSONDecodeError:
                return []
        elif isinstance(test_results_raw, list):
            return test_results_raw
        else:
            return []

    def _extract_error_message(self) -> str:
        """从错误堆栈中提取简短错误信息"""
        error_trace = getattr(self.submission, 'error_trace', '')
        if not error_trace:
            return "未知错误"

        # 提取最后一行（通常是错误信息）
        lines = error_trace.strip().split('\n')
        return lines[-1] if lines else "未知错误"

    def _extract_root_cause_from_text(self) -> str:
        """从诊断文本中提取根因（简化版）"""
        diagnosis_text = getattr(self.diagnosis, 'diagnosis_text', '')
        # 简单提取第一句话作为根因
        sentences = diagnosis_text.split('。')
        return sentences[0] + '。' if sentences else diagnosis_text[:100]

    def _extract_error_location(self) -> str:
        """提取错误位置描述"""
        line_num, _ = parse_error_location(getattr(self.submission, 'error_trace', ''))
        return f"第{line_num}行" if line_num else "位置未知"
