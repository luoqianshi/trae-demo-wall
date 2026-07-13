"""
诊断结果融合模块（Day3）
将 DiagnosisRecord 结构化结论融合进可视化反馈模型
"""
from typing import List, Dict, Optional, Tuple
import json
import re
from dataclasses import dataclass


@dataclass
class DiagnosisQualityScore:
    """诊断质量评分"""
    completeness: float  # 完整性 (0-1)
    accuracy: float  # 准确性 (0-1)
    actionability: float  # 可操作性 (0-1)
    overall: float  # 总分 (0-1)
    feedback: str  # 评分反馈


class DiagnosisFusionEngine:
    """
    诊断融合引擎
    负责将 DiagnosisRecord 的结构化数据融合到可视化反馈中
    """

    def __init__(self, diagnosis_record, submission):
        """
        初始化融合引擎

        Args:
            diagnosis_record: DiagnosisRecord 模型实例
            submission: Submission 模型实例
        """
        self.diagnosis = diagnosis_record
        self.submission = submission

    def extract_evidence_cards(self) -> List[Dict]:
        """
        提取证据卡片
        将诊断结论转换为结构化的证据卡片

        Returns:
            证据卡片列表，每个卡片包含：
            - card_type: 卡片类型（error_analysis/fix_guide/knowledge_ref）
            - title: 标题
            - content: 内容
            - priority: 优先级
            - evidence_refs: 关联的证据引用
        """
        cards = []

        # 1. 错误分析卡片
        if hasattr(self.diagnosis, 'root_cause') and self.diagnosis.root_cause:
            cards.append({
                "card_type": "error_analysis",
                "title": "错误根因分析",
                "content": self.diagnosis.root_cause,
                "priority": 1,
                "evidence_refs": ["code_snapshot", "execution_output"],
                "metadata": {
                    "error_type": self.submission.error_type,
                    "error_location": getattr(self.diagnosis, 'error_location', '未知')
                }
            })

        # 2. 修复指南卡片
        fix_suggestions = self._parse_fix_suggestions()
        if fix_suggestions:
            cards.append({
                "card_type": "fix_guide",
                "title": "修复建议",
                "content": fix_suggestions,
                "priority": 2,
                "evidence_refs": ["code_snapshot"],
                "metadata": {
                    "suggestion_count": len(fix_suggestions),
                    "target_lines": self._extract_target_lines(fix_suggestions)
                }
            })

        # 3. 知识点参考卡片
        knowledge_points = self._parse_knowledge_points()
        if knowledge_points:
            cards.append({
                "card_type": "knowledge_ref",
                "title": "相关知识点",
                "content": knowledge_points,
                "priority": 3,
                "evidence_refs": [],
                "metadata": {
                    "knowledge_count": len(knowledge_points)
                }
            })

        return cards

    def attach_evidence_to_failed_nodes(self, timeline_nodes: List) -> List:
        """
        在失败节点上挂载证据

        Args:
            timeline_nodes: 时间线节点列表

        Returns:
            更新后的节点列表
        """
        for node in timeline_nodes:
            # 处理测试用例循环节点的子节点
            if node.node_type == "testcase_loop" and node.children:
                for child in node.children:
                    if child.status == "failed":
                        child.metadata["attached_evidence"] = self._get_testcase_evidence(
                            child.metadata.get("testcase_id")
                        )

            # 处理编译失败节点
            elif node.node_type == "compile" and node.status == "failed":
                node.metadata["attached_evidence"] = {
                    "stderr_snippet": self._extract_stderr_snippet(),
                    "suspected_line": self._extract_suspected_error_line(),
                    "fix_hint": self._generate_compile_error_hint()
                }

        return timeline_nodes

    def generate_next_steps(self) -> List[Dict]:
        """
        生成"下一步建议"区块
        提供结构化的操作指引

        Returns:
            下一步操作列表，每个操作包含：
            - step_number: 步骤编号
            - action: 操作类型（fix/verify/learn）
            - description: 描述
            - target: 目标（代码行号、测试用例ID等）
            - estimated_time: 预估耗时（分钟）
        """
        next_steps = []
        step_number = 1

        # 步骤1：修复主要错误
        if self.submission.error_type:
            next_steps.append({
                "step_number": step_number,
                "action": "fix",
                "description": f"修复 {self.submission.error_type} 错误",
                "target": self._get_primary_error_location(),
                "estimated_time": 5,
                "details": getattr(self.diagnosis, 'root_cause', '请检查错误信息')
            })
            step_number += 1

        # 步骤2：验证修复
        next_steps.append({
            "step_number": step_number,
            "action": "verify",
            "description": "重新运行测试用例",
            "target": "all_testcases",
            "estimated_time": 1,
            "details": "确保所有测试用例通过"
        })
        step_number += 1

        # 步骤3：学习相关知识（如果有知识点）
        knowledge_points = self._parse_knowledge_points()
        if knowledge_points:
            next_steps.append({
                "step_number": step_number,
                "action": "learn",
                "description": "复习相关知识点",
                "target": knowledge_points[0] if knowledge_points else "基础语法",
                "estimated_time": 10,
                "details": f"建议复习：{', '.join(knowledge_points[:3])}"
            })

        return next_steps

    def evaluate_diagnosis_quality(self) -> DiagnosisQualityScore:
        """
        评估诊断质量
        用于监控 LLM 诊断效果

        Returns:
            DiagnosisQualityScore 实例
        """
        # 1. 完整性评分（是否包含必要字段）
        completeness = self._calculate_completeness()

        # 2. 准确性评分（是否正确识别错误类型）
        accuracy = self._calculate_accuracy()

        # 3. 可操作性评分（建议是否具体可执行）
        actionability = self._calculate_actionability()

        # 4. 总分
        overall = (completeness * 0.3 + accuracy * 0.4 + actionability * 0.3)

        # 5. 生成反馈
        feedback = self._generate_quality_feedback(completeness, accuracy, actionability)

        return DiagnosisQualityScore(
            completeness=completeness,
            accuracy=accuracy,
            actionability=actionability,
            overall=overall,
            feedback=feedback
        )

    # ============ 私有辅助方法 ============

    def _parse_fix_suggestions(self) -> List[str]:
        """解析修复建议"""
        fix_suggestions_raw = getattr(self.diagnosis, 'fix_suggestions', '')

        if not fix_suggestions_raw:
            return []

        if isinstance(fix_suggestions_raw, str):
            try:
                return json.loads(fix_suggestions_raw)
            except json.JSONDecodeError:
                # 按行分割
                return [s.strip() for s in fix_suggestions_raw.split('\n') if s.strip()]
        elif isinstance(fix_suggestions_raw, list):
            return fix_suggestions_raw
        else:
            return []

    def _parse_knowledge_points(self) -> List[str]:
        """解析知识点"""
        knowledge_points_raw = getattr(self.diagnosis, 'knowledge_points', '')

        if not knowledge_points_raw:
            return []

        if isinstance(knowledge_points_raw, str):
            try:
                return json.loads(knowledge_points_raw)
            except json.JSONDecodeError:
                # 按逗号分割
                return [kp.strip() for kp in knowledge_points_raw.split(',') if kp.strip()]
        elif isinstance(knowledge_points_raw, list):
            return knowledge_points_raw
        else:
            return []

    def _extract_target_lines(self, suggestions: List[str]) -> List[int]:
        """从建议中提取目标行号"""
        target_lines = []
        for suggestion in suggestions:
            match = re.search(r'第(\d+)行', suggestion)
            if match:
                target_lines.append(int(match.group(1)))
        return target_lines

    def _get_testcase_evidence(self, testcase_id: int) -> Dict:
        """获取测试用例的证据"""
        test_results = self._parse_test_results()

        if testcase_id and 0 < testcase_id <= len(test_results):
            test_result = test_results[testcase_id - 1]
            return {
                "input": test_result.get('input', ''),
                "expected": test_result.get('expected', ''),
                "actual": test_result.get('actual', ''),
                "diff": self._generate_output_diff(
                    test_result.get('expected', ''),
                    test_result.get('actual', '')
                )
            }

        return {}

    def _extract_stderr_snippet(self, max_lines: int = 5) -> str:
        """提取 stderr 的关键片段"""
        stderr = getattr(self.submission, 'error_trace', '')
        if not stderr:
            return ""

        lines = stderr.strip().split('\n')
        # 返回最后几行（通常是最关键的错误信息）
        return '\n'.join(lines[-max_lines:])

    def _extract_suspected_error_line(self) -> Optional[int]:
        """提取疑似错误行号"""
        error_trace = getattr(self.submission, 'error_trace', '')
        match = re.search(r'line (\d+)', error_trace)
        return int(match.group(1)) if match else None

    def _generate_compile_error_hint(self) -> str:
        """生成编译错误提示"""
        error_type = self.submission.error_type

        hints = {
            "SyntaxError": "检查括号、引号是否配对，语句是否完整",
            "IndentationError": "检查缩进是否一致（建议使用4个空格）",
            "TabError": "不要混用Tab和空格进行缩进"
        }

        return hints.get(error_type, "请仔细检查代码语法")

    def _get_primary_error_location(self) -> str:
        """获取主要错误位置"""
        error_location = getattr(self.diagnosis, 'error_location', '')
        if error_location:
            return error_location

        # 从 error_trace 提取
        line_num = self._extract_suspected_error_line()
        return f"第{line_num}行" if line_num else "未知位置"

    def _generate_output_diff(self, expected: str, actual: str) -> str:
        """
        生成输出差异描述

        Args:
            expected: 期望输出
            actual: 实际输出

        Returns:
            差异描述
        """
        if not actual:
            return "程序未产生输出（可能因错误中断）"

        if expected == actual:
            return "输出完全匹配"

        # 简单的差异描述
        if len(expected) != len(actual):
            return f"长度不匹配（期望{len(expected)}字符，实际{len(actual)}字符）"

        # 查找第一个不同的字符
        for i, (e, a) in enumerate(zip(expected, actual)):
            if e != a:
                return f"第{i+1}个字符不同（期望'{e}'，实际'{a}'）"

        return "输出不匹配"

    def _parse_test_results(self) -> List[dict]:
        """解析测试结果"""
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

    # ============ 质量评估方法 ============

    def _calculate_completeness(self) -> float:
        """
        计算完整性评分
        检查诊断记录是否包含必要字段
        """
        required_fields = ['diagnosis_text', 'root_cause', 'fix_suggestions']
        present_count = sum(
            1 for field in required_fields
            if hasattr(self.diagnosis, field) and getattr(self.diagnosis, field)
        )
        return present_count / len(required_fields)

    def _calculate_accuracy(self) -> float:
        """
        计算准确性评分
        检查诊断是否正确识别错误类型
        """
        diagnosis_text = getattr(self.diagnosis, 'diagnosis_text', '').lower()
        error_type = self.submission.error_type

        if not error_type:
            return 0.5  # 无错误类型时给中等分

        # 检查诊断文本中是否提到错误类型
        error_type_lower = error_type.lower()
        if error_type_lower in diagnosis_text:
            return 1.0

        # 检查是否提到相关关键词
        keywords = {
            "nameerror": ["变量", "未定义", "name"],
            "syntaxerror": ["语法", "syntax", "括号", "引号"],
            "indentationerror": ["缩进", "indent", "空格"],
            "typeerror": ["类型", "type"],
            "valueerror": ["值", "value"],
        }

        if error_type_lower in keywords:
            for keyword in keywords[error_type_lower]:
                if keyword in diagnosis_text:
                    return 0.7  # 部分匹配

        return 0.3  # 未匹配

    def _calculate_actionability(self) -> float:
        """
        计算可操作性评分
        检查建议是否具体可执行
        """
        fix_suggestions = self._parse_fix_suggestions()

        if not fix_suggestions:
            return 0.0

        score = 0.0

        # 检查是否包含具体行号
        has_line_number = any(re.search(r'第?\d+行', s) for s in fix_suggestions)
        if has_line_number:
            score += 0.4

        # 检查是否包含代码示例
        has_code_example = any('```' in s or 'print' in s or '=' in s for s in fix_suggestions)
        if has_code_example:
            score += 0.3

        # 检查建议数量（2-4条为最佳）
        if 2 <= len(fix_suggestions) <= 4:
            score += 0.3
        elif len(fix_suggestions) == 1:
            score += 0.1

        return min(score, 1.0)

    def _generate_quality_feedback(
        self,
        completeness: float,
        accuracy: float,
        actionability: float
    ) -> str:
        """生成质量反馈文本"""
        feedback_parts = []

        if completeness < 0.7:
            feedback_parts.append("诊断信息不完整")
        if accuracy < 0.7:
            feedback_parts.append("错误识别不准确")
        if actionability < 0.7:
            feedback_parts.append("建议不够具体")

        if not feedback_parts:
            return "诊断质量良好"

        return "；".join(feedback_parts)


class EvidenceMountingHelper:
    """
    证据挂载辅助类
    提供便捷的证据挂载方法
    """

    @staticmethod
    def mount_stderr_to_node(node, stderr: str, max_length: int = 200):
        """
        将 stderr 挂载到节点

        Args:
            node: TimelineNode 实例
            stderr: 错误输出
            max_length: 最大长度
        """
        if not hasattr(node, 'metadata'):
            node.metadata = {}

        # 截取关键部分
        if len(stderr) > max_length:
            stderr = "..." + stderr[-max_length:]

        node.metadata["stderr_snippet"] = stderr
        node.evidence_refs.append("execution_output")

    @staticmethod
    def mount_failed_testcase_to_node(node, testcase_result: dict):
        """
        将失败的测试用例信息挂载到节点

        Args:
            node: TimelineNode 实例
            testcase_result: 测试用例结果字典
        """
        if not hasattr(node, 'metadata'):
            node.metadata = {}

        node.metadata["failed_testcase"] = {
            "input": testcase_result.get('input', ''),
            "expected": testcase_result.get('expected', ''),
            "actual": testcase_result.get('actual', ''),
            "error_type": testcase_result.get('error_type', '')
        }

    @staticmethod
    def mount_code_location_to_node(node, line_number: int, code_snippet: str):
        """
        将代码位置信息挂载到节点

        Args:
            node: TimelineNode 实例
            line_number: 行号
            code_snippet: 代码片段
        """
        if not hasattr(node, 'metadata'):
            node.metadata = {}

        node.metadata["code_location"] = {
            "line": line_number,
            "snippet": code_snippet
        }
        node.evidence_refs.append("code_snapshot")
