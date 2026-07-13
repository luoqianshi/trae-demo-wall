"""
可视化反馈模块单元测试
测试 VisualizationPayloadBuilder 的核心转换逻辑
"""
import json
from datetime import datetime
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.submissions.models import Submission
from apps.diagnosis.models import DiagnosisRecord
from apps.problems.models import Problem
from apps.visualization.builder import VisualizationPayloadBuilder
from apps.visualization.structures import NodeType, NodeStatus

User = get_user_model()


class VisualizationPayloadBuilderTest(TestCase):
    """测试可视化反馈数据构建器"""

    def setUp(self):
        """准备测试数据"""
        # 创建测试用户
        self.student = User.objects.create_user(
            username='test_student',
            password='test123',
            role='student'
        )

        # 创建测试题目
        self.problem = Problem.objects.create(
            title='判断偶数',
            description='输入一个整数，判断是否为偶数',
            difficulty='easy',
            test_cases_json=json.dumps([
                {"input": "4", "expected": "True"},
                {"input": "7", "expected": "False"},
                {"input": "10", "expected": "True"}
            ])
        )

    def test_build_success_submission(self):
        """测试成功提交的可视化反馈生成"""
        # 创建成功的提交记录
        submission = Submission.objects.create(
            user=self.student,
            problem=self.problem,
            code_text="n = int(input())\nprint(n % 2 == 0)",
            status='accepted',
            error_type=None,
            test_results=json.dumps([
                {"input": "4", "expected": "True", "actual": "True", "pass": True},
                {"input": "7", "expected": "False", "actual": "False", "pass": True},
                {"input": "10", "expected": "True", "actual": "True", "pass": True}
            ]),
            execution_time_ms=1200
        )

        # 构建可视化反馈
        builder = VisualizationPayloadBuilder(submission)
        payload = builder.build()

        # 验证顶层结构
        self.assertEqual(payload.payload_version, "1.0")
        self.assertEqual(payload.submission_id, submission.id)
        self.assertEqual(pa.problem_id, self.problem.id)

        # 验证摘要
        self.assertEqual(payload.summary.overall_status, "success")
        self.assertEqual(payload.summary.pass_rate, "3/3")
        self.assertEqual(payload.summary.error_count, 0)
        self.assertIsNone(payload.summary.primary_issue)

        # 验证时间线节点数量（提交 + 编译 + 运行开始 + 测试循环 + 完成）
        self.assertGreaterEqual(len(payload.timeline), 5)

        # 验证节点类型
        node_types = [node.node_type for node in payload.timeline]
        self.assertIn(NodeType.SUBMIT_RECEIVED, node_types)
        self.assertIn(NodeType.COMPILE, node_types)
        self.assertIn(NodeType.TESTCASE_LOOP, node_types)
        self.assertIn(NodeType.FINISH, node_types)

        # 验证测试用例子节点
        testcase_loop_node = next(
            node for node in payload.timeline if node.node_type == NodeType.TESTCASE_LOOP
        )
        self.assertEqual(len(testcase_loop_node.children), 3)
        self.assertEqual(testcase_loop_node.status, NodeStatus.SUCCESS)

    def test_build_failed_submission_with_name_error(self):
        """测试带有 NameError 的失败提交"""
        # 创建失败的提交记录
        submission = Submission.objects.create(
            user=self.student,
            problem=self.problem,
            code_text="n = int(input())\nprint(x)",
            status='wrong_answer',
            error_type='NameError',
            error_trace="Traceback (most recent call last):\n  File \"<exec>\", line 2, in <module>\nNameError: name 'x' is not defined",
            test_results=json.dumps([
                {"input": "4", "expected": "True", "actual": "", "pass": False},
                {"input": "7", "expected": "False", "actual": "", "pass": False},
                {"input": "10", "expected": "True", "actual": "", "pass": False}
            ]),
            execution_time_ms=800
        )

        # 创建诊断记录
        diagnosis = DiagnosisRecord.objects.create(
            submission=submission,
            diagnosis_text="你在第2行使用了变量 x，但它没有先被定义。",
            root_cause="变量 'x' 在第2行被使用，但从未定义",
            error_location="第2行",
            fix_suggestions=json.dumps([
                "检查变量名是否拼写错误（想用 'n'？）",
                "在使用前先定义变量 x"
            ]),
            knedge_points=json.dumps(["变量定义", "变量作用域", "NameError异常"]),
            latency_ms=3500
        )

        # 构建可视化反馈
        builder = VisualizationPayloadBuilder(submission, diagnosis)
        payload = builder.build()

        # 验证摘要
        self.assertEqual(payload.summary.overall_status, "failed")
        self.assertEqual(payload.summary.pass_rate, "0/3")
        self.assertEqual(payload.summary.error_count, 1)
        self.assertIn("NameError", payload.summary.primary_issue)

        # 验证诊断节点存在
        node_types = [node.node_type for node in payload.timeline]
        self.assertIn(NodeType.DIAGNO_types)

        # 验证证据
        self.assertIsNotNone(payload.evidence.code_snapshot)
        self.assertIn(2, payload.evidence.code_snapshot.error_lines)
        self.assertIn("NameError", payload.evidence.execution_output.stderr)

        # 验证诊断摘要
        self.assertIsNotNone(payload.evidence.diagnosis_extract)
        self.assertIn("变量", payload.evidence.diagnosis_extract.root_cause)
        self.assertEqual(len(payload.evidence.diagnosis_extract.knowledge_points), 3)

        # 验证建议
        self.assertGreater(len(payload.suggestions), 0)
        self.assertEqual(payload.suggestions[0]1)

    def test_build_syntax_error_submission(self):
        """测试语法错误提交（不执行测试用例）"""
        submission = Submission.objects.create(
            user=self.student,
            problem=self.problem,
            code_text="n = int(input()\nprint(n)",  # 缺少右括号
            status='compile_error',
            error_type='SyntaxError',
            error_trace="SyntaxError: invalid syntax",
            test_results=json.dumps([]),
            execution_time_ms=0
        )

        builder = VisualizationPayloadBuilder(submission)
        payload = builder.build()

        # 验证编译节点状态为失败
        compile_node = next(
            node for node in payload.timeline if node.node_type == NodeType.COMPILE
        )
        self.assertEqual(compile_node.status, NodeStatus.FAILED)

        # 验证没有测试用例节点（因为编译失败）
        node_types = [node.node_type for node in payload.timeline]
        self.assertNotIn(NodeType.TESTCASE_LOOP, node_types)

    def test_build_partial_pass_submission(self):
        """测试部分通过的提交"""
        submission = Submission.objects.create(
            user=self.student,
            problem=self.problem,
            code_text="n = int(input())\nprint(n > 5)",  # 逻辑错误
            status='wrong_answer',
            error_type=None,
            test_results=json.dumps([
                {"input": "4", "expected": "True", "actual": "False", "pass": False},
                {"input": "7", "expected": "False", "actual": "True", "pass": False},
                {"input": "10", "expected": "True", "actual": "True", "pass": True}
            ]),
            execution_time_ms=1100
        )

        builder = VisualizationPayloadBuilder(submission)
        payload = builder.build()

        # 验证摘要状态为部分成功
        self.assertEqual(payload.summary.overall_status, "partial")
        self.assertEqual(payload.summary.pass_rate, "1/3")

        # 验证测试循环节点状态为警告
        testcase_loop_node = next(   node for node in payload.timeline if node.node_type == NodeType.TESTCASE_LOOP
        )
        self.assertEqual(testcase_loop_node.status, NodeStatus.WARNING)

        # 验证子节点状态
        child_statuses = [child.status for child in testcase_loop_node.children]
        self.assertEqual(child_statuses.count(NodeStatus.FAILED), 2)
        self.assertEqual(child_statuses.count(NodeStatus.SUCCESS), 1)

    def test_to_dict_serialization(self):
        """测试 to_dict 序列化功能"""
        submission = Submission.objects.create(
            user=self.studn            problem=self.problem,
            code_text="n = int(input())\nprint(n % 2 == 0)",
            status='accepted',
            test_results=json.dumps([
                {"input": "4", "expected": "True", "actual": "True", "pass": True}
            ])
        )

        builder = VisualizationPayloadBuilder(submission)
        payload = builder.build()

        # 转换为字典
        payload_dict = payload.to_dict()

        # 验证字典结构
        self.assertIsInstance(payload_dict, dict)
        self.assertIn('payload_version', payload_dict)
        self.assertIn('timeline', payload_dict)
        self.assertIn('evidence', payload_dict)
        self.assertIn('suggestions', payload_dict)

        # 验证可以序列化为 JSON
        json_str = json.dumps(payload_dict)
        self.assertIsInstance(json_str, str)

        # 验证反序列化
        parsed = json.loads(json_str)
        self.assertEqual(parsed['payload_version'], "1.0")

    def test_node_id_uniqueness(self):
        """测试节点ID唯一性"""
        submission = Submission.objects.create(
            user=self.student,
            problem=self.problem,
            code_text="print('test')",
            status='accepted',
            test_results=json.dumps([
                {"input": "1", "expected": "1", "actual": "1", "pass": True},
                {"input": "2", "expected": "2", "actual": "2", "pass": True}
            ])
        )

        builder = VisualizationPayloadBuilder(submission)
        payload = builder.build()

        # 收集所有节点ID（包括子节点）
        node_ids = []
        for node in payload.timeline:
            node_ids.append(node.node_id)
            for child in node.children:
                node_ids.append(child.node_id)

        # 验证无重复
        self.assertEqual(len(node_ids), len(set(node_ids)))

    def test_evid_consistency(self):
        """测试证据引用一致性"""
        submission = Submission.objects.create(
            user=self.student,
            problem=self.problem,
            code_text="n = int(input())\nprint(x)",
            status='wrong_answer',
            error_type='NameError',
            error_trace="NameError: name 'x' is not defined",
            test_results=json.dumps([
                {"input": "4", "expected": "True", "actual": "", "pass": False}
            ])
        )

        diagnosis = DiagnosisRecord.objects.create(
            submission=submission,
            diagnosis_text="变量未定义",
            root_cause="变量 x 未定义"
        )

        builder = VisualizationPayloadBuilder(submission, diagnosis)
        payload = builder.build()

        # 收集所有 evidence_refs
        all_refs = []
        for node in payload.timeline:
            all_refs.extend(node.evidence_refs)

        # 验证引用的证据确实存在
        if "execution_output" in all_refs:
            self.assertIsNotNone(payload.evidence.execution_output)

        if "testcase_results" in all_refs:
            self.assertGreater(len(payload.evidence.testcase_results), 0)

        if "diagnosis_extract" in all_refs:
            self.assertIsNotNone(payload.evidence.diagnosis_extract)


class VisualizationStructuresTest(TestCase):
    """测试数据结构辅助函数"""

    def test_generate_node_id(self):
        """测试节点ID生成"""
        from apps.visualization.structures import generate_node_id

        node_id = generate_node_id(NodeType.COMPILE, 1)
        self.assertEqual(node_id, "compile_001")

        node_id = generate_node_id(NodeType.TESTCASE, 42)
        self.assertEqual(node_id, "testcase_042")

    def test_calculate_duration_ms(self):
        """测试时间差计算"""
        from apps.visualization.structures import calculate_duration_ms

        start = datetime(2026, 3, 7, 14, 30, 0, 0)
        end = datetime(2026, 3, 7, 14, 30, 1, 500000)  # 1.5秒后

        duration = calculate_duration_ms(start, end)
        self.assertEqual(duration, 1500)

    def test_parse_error_location(self):
        """测试错误位置解析"""
        from apps.visualization.structures import parse_error_location

        error_trace = """Traceback (most recent call last):
  File "<exec>", line 5, in <module>
NameError: name 'x' is not defined"""

        line_num, col_num =_error_location(error_trace)
        self.assertEqual(line_num, 5)

    def test_extract_variable_name_from_error(self):
        """测试变量名提取"""
        from apps.visualization.structures import extract_variable_name_from_error

        error_trace = "NameError: name 'foo' is not defined"
        var_name = extract_variable_name_from_error(error_trace, "NameError")
        self.assertEqual(var_name, "foo")

    def test_calculate_pass_rate(self):
        """测试通过率计算"""
        from apps.visualization.structures import calculate_pass_rate

 f.assertEqual(calculate_pass_rate(2, 3), "2/3")
        self.assertEqual(calculate_pass_rate(0, 5), "0/5")
        self.assertEqual(calculate_pass_rate(10, 10), "10/10")
