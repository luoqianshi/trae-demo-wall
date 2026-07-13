"""
可视化反馈数据转换器 v2（Day2优化版）
使用 TimelineNodeFactory 和增强的错误解析器
"""
from datetime import datetime
from typing import List, Optional
import json
import logging

from .structures import (
    VisualizationPayload, TimelineNode, Evidence, Suggestion,
    DataSource, Summary, CodeSnapshot, ExecutionOutput, TestcaseResult,
    DiagnosisExtract, HighlightRange,
    NodeType, NodeStatus, SuggestionCategory, ActionType,
    calculate_pass_rate, format_iso8601
)
from .timeline_factory import (
    TimelineNodeFactory,
    ErrorLocationParser,
    VariableNameExtractor,
    PerformanceMetricsCollector,
    detect_special_testcase_status,
    estimate_execution_time,
    format_error_message
)

logger = logging.getLogger(__name__)


class VisualizationPayloadBuilderV2:
    """
    可视化反馈数据构建器 V2（Day2优化版）

    改进点：
    1. 使用 TimelineNodeFactory 生成节点，时间戳更精确
    2. 使用 ErrorLocationParser 增强错误定位
    3. 支持测试用例特殊状态（超时、内存超限）
    4. 收集性能指标到 metadata
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

        # 初始化工厂和收集器
        self.factory = TimelineNodeFactory(submission.created_at)
        self.metrics_collector = PerformanceMetricsCollector()

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
            submission_version=1,
            diagnosis_id=self.diagnosis.id if self.diagnosis else None,
            diagnosis_version=1 if self.diagnosis else None
        )

    def _build_summary(self) -> Summary:
        """
        构建执行摘要
        从 Submission 中提取关键指标
        """
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

        # 计算执行时间（使用估算或实际值）
        execution_time_ms = getattr(self.submission, 'execution_time_ms', 0)
        if not execution_time_ms:
            execution_time_ms = estimate_execution_time(
                self.submission.code_text,
                total_count
            )

        # 统计错误数量
        error_count = 1 if self.submission.error_type else 0

        # 提取主要问题（使用格式化函数）
        primary_issue = None
        if self.submission.error_type:
            error_trace = getattr(self.submission, 'error_trace', '')
            primary_issue = format_error_message(self.submission.error_type, error_trace)

        return Summary(
            overall_status=overall_status,
            pass_rate=calculate_pass_rate(passed_count, total_count),
            execution_time_ms=execution_time_ms,
            error_count=error_count,
            primary_issue=primary_issue
        )

    def _build_timeline(self) -> List[TimelineNode]:
        """
        构建时间线节点数组（使用工厂模式）
        """
        timeline = []

        # 1. 提交接收节点
        submit_node = self.factory.create_submit_node()
        timeline.append(submit_node)

        # 2. 编译/语法检查节点
        has_syntax_error = self.submission.error_type == 'SyntaxError'
        error_detail = self._extract_error_message() if has_syntax_error else None
        compile_node = self.factory.create_compile_node(has_syntax_error, error_detail)
        timeline.append(compile_node)
        self.metrics_collector.add_compile_time(compile_node.duration_ms)

        # 3. 如果语法检查通过，继续执行
        if not has_syntax_error:
            # 开始执行节点
            run_start_node = self.factory.create_run_start_node()
            timeline.append(run_start_node)

            # 测试用例循环节点
            testcase_loop_node = self._create_testcase_loop_node()
            timeline.append(testcase_loop_node)
            self.metrics_collector.add_execution_time(testcase_loop_node.duration_ms)

        # 4. 诊断节点（如果有）
        if self.diagnosis:
            diagnosis_node = self.factory.create_diagnosis_node(
                has_diagnosis=True,
                diagnosis_id=self.diagnosis.id,
                model_name=getattr(self.diagnosis, 'model_name', 'qwen2.5-coder:7b'),
                latency_ms=getattr(self.diagnosis, 'latency_ms', 3500)
            )
            timeline.append(diagnosis_node)
            self.metrics_collector.add_diagnosis_time(diagnosis_node.duration_ms)

        # 5. 执行完成节点
        is_success = self.submission.status == 'accepted'
        finish_node = self.factory.create_finish_node(is_success, self.submission.status)
        timeline.append(finish_node)

        return timeline

    def _create_testcase_loop_node(self) -> TimelineNode:
        """
        创建测试用例循环节点（使用工厂）
        """
        test_results = self._parse_test_results()
        children = []

        for idx, test_result in enumerate(test_results, start=1):
            # 检测特殊状态
            special_status = detect_special_testcase_status(test_result)

            # 创建子节点
            child_node = self.factory.create_testcase_node(
                testcase_id=idx,
                input_val=test_result.get('input', ''),
                expected=test_result.get('expected', ''),
                actual=test_result.get('actual', ''),
                is_pass=test_result.get('pass', False),
                error_type=self.submission.error_type if not test_result.get('pass') else None,
                special_status=special_status
            )
            children.append(child_node)
            self.metrics_collector.add_testcase_time(child_node.duration_ms)

        # 统计通过情况
        passed_count = sum(1 for r in test_results if r.get('pass', False))
        total_count = len(test_results)

        # 创建父节点
        return self.factory.create_testcase_loop_node(children, passed_count, total_count)

    def _build_evidence(self) -> Evidence:
        """
        构建证据集合（使用增强的解析器）
        """
        # 1. 代码快照（使用增强的错误定位）
        code_snapshot = self._build_code_snapshot_enhanced()

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

    def _build_code_snapshot_enhanced(self) -> CodeSnapshot:
        """
        构建代码快照（使用增强的错误解析器）
        """
        code_text = self.submission.code_text
        error_lines = []
        highlight_ranges = []

        if self.submission.error_type:
            error_trace = getattr(self.submission, 'error_trace', '')

            # 使用增强的解析器
            line_num, col_num, snippet = ErrorLocationParser.parse(
                error_trace,
                self.submission.error_type
            )

            if line_num:
                error_lines.append(line_num)

                # 提取变量名
                var_name = VariableNameExtractor.extract(
                    error_trace,
                    self.submission.error_type
                )

                if var_name:
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
                elif col_num is not None:
                    # 使用列号信息
                    highlight_ranges.append(HighlightRange(
                        line=line_num,
                        start_col=col_num,
                        end_col=col_num + 1,
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
            # 检测特殊状态
            special_status = detect_special_testcase_status(test_result)

            # 确定错误类型
            if special_status == "timeout":
                error_type = "TimeoutError"
            elif special_status == "memory_limit":
                error_type = "MemoryError"
            elif not test_result.get('pass'):
                error_type = self.submission.error_type
            else:
                error_type = None

            results.append(TestcaseResult(
                testcase_id=idx,
                input=test_result.get('input', ''),
                expected_output=test_result.get('expected', ''),
                actual_output=test_result.get('actual', ''),
                match=test_result.get('pass', False),
                error_type=error_type
            ))

        return results

    def _build_diagnosis_extract(self) -> Optional[DiagnosisExtract]:
        """从 DiagnosisRecord 提取结构化诊断信息"""
        if not self.diagnosis:
            return None

        # 提取根因
        root_cause = getattr(self.diagnosis, 'root_cause', '') or self._extract_root_cause_from_text()

        # 提取错误位置（使用增强解析器）
        error_trace = getattr(self.submission, 'error_trace', '')
        line_num, _, _ = ErrorLocationParser.parse(
            error_trace,
            self.submission.error_type or ''
        )
        error_location = f"第{line_num}行" if line_num else "位置未知"

        # 提取知识点
        knowledge_points = getattr(self.diagnosis, 'knowledge_points', [])
        if isinstance(knowledge_points, str):
            try:
                knowledge_points = json.loads(knowledge_points) if knowledge_points else []
            except json.JSONDecodeError:
                knowledge_points = []

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
            return self._generate_default_suggestions()

        suggestions = []

        # 提取修复建议
        fix_suggestions_raw = getattr(self.diagnosis, 'fix_suggestions', '')

        if isinstance(fix_suggestions_raw, str):
            try:
                fix_suggestions = json.loads(fix_suggestions_raw) if fix_suggestions_raw else []
            except json.JSONDecodeError:
                # 如果不是 JSON，按行分割
                fix_suggestions = [s.strip() for s in fix_suggestions_raw.split('\n') if s.strip()]
        else:
            fix_suggestions = fix_suggestions_raw or []

        # 转换为 Suggestion 对象
        for idx, suggestion_text in enumerate(fix_suggestions[:3], start=1):  # 最多3条
            suggestions.append(Suggestion(
                priority=idx,
                category=SuggestionCategory.FIX_ERROR if idx == 1 else SuggestionCategory.VERIFY,
                title=f"建议 {idx}",
                description=suggestion_text,
                action_type=ActionType.CODE_EDIT if idx == 1 else ActionType.RERUN,
                target_line=self._extract_target_line_from_suggestion(suggestion_text),
                example_fix=None
            ))

        # 添加验证建议
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

        return suggestions if suggestions else self._generate_default_suggestions()

    def _generate_default_suggestions(self) -> List[Suggestion]:
        """生成默认建议（当无诊断记录时）"""
        suggestions = []

        if self.submission.error_type:
            suggestions.append(Suggestion(
                priority=1,
                category=SuggestionCategory.FIX_ERROR,
                title=f"修复 {self.submission.error_type}",
                description=f"请检查代码中的 {self.submission.error_type} 错误，参考错误信息进行修改。",
                action_type=ActionType.CODE_EDIT,
                target_line=None,
                example_fix=None
            ))

        suggestions.append(Suggestion(
            priority=2,
            category=SuggestionCategory.VERIFY,
            title="重新运行测试",
            description="修改后重新提交代码，查看是否通过测试。",
            action_type=ActionType.RERUN,
            target_line=None,
            example_fix=None
        ))

        return suggestions

    def _extract_target_line_from_suggestion(self, suggestion_text: str) -> Optional[int]:
        """
        从建议文本中提取目标行号
        示例: "在第5行添加..." -> 5
        """
        import re
        match = re.search(r'第(\d+)行', suggestion_text)
        return int(match.group(1)) if match else None

    # ============ 辅助方法 ============

    def _parse_test_results(self) -> List[dict]:
        """
        解析测试结果（防御性编程）
        """
        test_results_raw = getattr(self.submission, 'test_results', None)

        if not test_results_raw:
            return []

        if isinstance(test_results_raw, str):
            try:
                return json.loads(test_results_raw)
            except json.JSONDecodeError:
                logger.warning(f"Invalid test_results JSON for submission {self.submission.id}")
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

        lines = error_trace.strip().split('\n')
        return lines[-1] if lines else "未知错误"

    def _extract_root_cause_from_text(self) -> str:
        """从诊断文本中提取根因"""
        diagnosis_text = getattr(self.diagnosis, 'diagnosis_text', '')
        sentences = diagnosis_text.split('。')
        return sentences[0] + '。' if sentences else diagnosis_text[:100]

    def get_performance_metrics(self) -> dict:
        """
        获取性能指标（可用于日志或监控）
        """
        return self.metrics_collector.get_metrics()


# 向后兼容：保留原类名
VisualizationPayloadBuilder = VisualizationPayloadBuilderV2
