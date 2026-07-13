"""
可视化反馈模块初始化脚本
用于快速验证模块功能
"""
import os
import sys
import django

# 设置Django环境
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from datetime import datetime
from apps.visualization.builder_v3 import VisualizationPayloadBuilder
from apps.visualization.structures import *
import json


def create_mock_submission():
    """创建模拟的Submission对象"""
    class MockSubmission:
        def __init__(self):
            self.id = 9001
            self.problem_id = 101
            self.user_id = 1
            self.code_text = "n = int(input())\nprint(x)"
            self.status = 'wrong_answer'
            self.error_type = 'NameError'
            self.error_trace = """Traceback (most recent call last):
  File "<exec>", line 2, in <module>
NameError: name 'x' is not defined"""
            self.stdout_text = ""
            self.test_results = json.dumps([
                {"input": "4", "expected": "True", "actual": "", "pass": False},
                {"input": "7", "expected": "False", "actual": "", "pass": False},
                {"input": "10", "expected": "True", "actual": "", "pass": False}
            ])
            self.execution_time_ms = 1240
            self.created_at = datetime.now()
            self.updated_at = datetime.now()

    return MockSubmission()


def create_mock_diagnosis():
    """创建模拟的DiagnosisRecord对象"""
    class MockDiagnosis:
        def __init__(self):
            self.id = 5023
            self.diagnosis_text = "你在第2行使用了变量 x，但它没有先被定义。检查是否拼写错误或遗漏赋值语句。"
            self.root_cause = "变量 'x' 在第2行被使用，但从未定义"
            self.error_location = "第2行"
            self.fix_suggestions = json.dumps([
                "检查变量名是否拼写错误（想用 'n'？）",
                "在使用前先定义变量 x"
            ])
            self.knowledge_points = json.dumps(["变量定义", "变量作用域", "NameError异常"])
            self.model_name = "qwen2.5-coder:7b"
            self.latency_ms = 3600
            self.created_at = datetime.now()

    return MockDiagnosis()


def test_visualization_builder():
    """测试可视化构建器"""
    print("=" * 60)
    print("可视化反馈模块功能测试")
    print("=" * 60)

    # 1. 创建模拟数据
    print("\n[1/5] 创建模拟数据...")
    submission = create_mock_submission()
    diagnosis = create_mock_diagnosis()
    print("✓ 模拟数据创建成功")

    # 2. 初始化构建器
    print("\n[2/5] 初始化构建器...")
    builder = VisualizationPayloadBuilder(submission, diagnosis)
    print("✓ 构建器初始化成功")

    # 3. 构建可视化反馈数据
    print("\n[3/5] 构建可视化反馈数据...")
    payload = builder.build()
    print("✓ 数据构建成功")

    # 4. 验证数据结构
    print("\n[4/5] 验证数据结构...")
    assert payload.payload_version == "1.0", "版本号错误"
    assert payload.submission_id == 9001, "提交ID错误"
    assert payload.problem_id == 101, "题目ID错误"
    assert len(payload.timeline) >= 5, "时间线节点数量不足"
    assert payload.summary.overall_status == "failed", "状态判断错误"
    assert payload.summary.pass_rate == "0/3", "通过率计算错误"
    assert len(payload.suggestions) > 0, "建议列表为空"
    print("✓ 数据结构验证通过")

    # 5. 输出JSON
    print("\n[5/5] 序列化为JSON...")
    payload_dict = payload.to_dict()
    json_str = json.dumps(payload_dict, ensure_ascii=False, indent=2)
    print("✓ JSON序列化成功")

    # 6. 显示关键信息
    print("\n" + "=" * 60)
    print("构建结果摘要")
    print("=" * 60)
    print(f"协议版本: {payload.payload_version}")
    print(f"生成时间: {payload.generated_at}")
    print(f"提交ID: {payload.submission_id}")
    print(f"题目ID: {payload.problem_id}")
    print(f"执行状态: {payload.summary.overall_status}")
    print(f"通过率: {payload.summary.pass_rate}")
    print(f"执行时间: {payload.summary.execution_time_ms}ms")
    print(f"错误数量: {payload.summary.error_count}")
    print(f"主要问题: {payload.summary.primary_issue}")
    print(f"\n时间线节点数量: {len(payload.timeline)}")
    for i, node in enumerate(payload.timeline, 1):
        print(f"  {i}. {node.title} ({node.status})")
        if node.children:
            for j, child in enumerate(node.children, 1):
                print(f"     {i}.{j} {child.title} ({child.status})")
    print(f"\n建议数量: {len(payload.suggestions)}")
    for i, suggestion in enumerate(payload.suggestions, 1):
        print(f"  {i}. [优先级{suggestion.priority}] {suggestion.title}")

    # 7. 获取性能指标
    print("\n" + "=" * 60)
    print("性能指标")
    print("=" * 60)
    metrics = builder.get_performance_metrics()
    for key, value in metrics.items():
        print(f"{key}: {value}")

    # 8. 获取诊断质量评分
    print("\n" + "=" * 60)
    print("诊断质量评分")
    print("=" * 60)
    quality_score = builder.get_diagnosis_quality_score()
    if quality_score:
        print(f"总分: {quality_score['overall']:.2f}")
        print(f"完整性: {quality_score['completeness']:.2f}")
        print(f"准确性: {quality_score['accuracy']:.2f}")
        print(f"可操作性: {quality_score['actionability']:.2f}")
        print(f"反馈: {quality_score['feedback']}")

    # 9. 保存JSON到文件
    output_file = "visualization_test_output.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(json_str)
    print(f"\n✓ JSON已保存到: {output_file}")

    print("\n" + "=" * 60)
    print("测试完成！所有功能正常")
    print("=" * 60)


def test_error_location_parser():
    """测试错误定位解析器"""
    from apps.visualization.timeline_factory import ErrorLocationParser

    print("\n" + "=" * 60)
    print("错误定位解析器测试")
    print("=" * 60)

    test_cases = [
        {
            "name": "NameError",
            "trace": """Traceback (most recent call last):
  File "<exec>", line 5, in <module>
NameError: name 'x' is not defined""",
            "error_type": "NameError",
            "expected_line": 5
        },
        {
            "name": "SyntaxError",
            "trace": """  File "<exec>", line 2
    n = int(input()
                   ^
SyntaxError: invalid syntax""",
            "error_type": "SyntaxError",
            "expected_line": 2
        }
    ]

    for i, test in enumerate(test_cases, 1):
        print(f"\n测试用例 {i}: {test['name']}")
        line_num, col_num, snippet = ErrorLocationParser.parse(
            test['trace'],
            test['error_type']
        )
        print(f"  行号: {line_num} (期望: {test['expected_line']})")
        print(f"  列号: {col_num}")
        print(f"  代码片段: {snippet}")
        assert line_num == test['expected_line'], f"行号解析错误"
        print("  ✓ 通过")


def test_variable_name_extractor():
    """测试变量名提取器"""
    from apps.visualization.timeline_factory import VariableNameExtractor

    print("\n" + "=" * 60)
    print("变量名提取器测试")
    print("=" * 60)

    test_cases = [
        {
            "name": "NameError",
            "trace": "NameError: name 'foo' is not defined",
            "error_type": "NameError",
            "expected": "foo"
        },
        {
            "name": "AttributeError",
            "trace": "AttributeError: 'list' object has no attribute 'append_all'",
            "error_type": "AttributeError",
            "expected": "append_all"
        }
    ]

    for i, test in enumerate(test_cases, 1):
        print(f"\n测试用例 {i}: {test['name']}")
        var_name = VariableNameExtractor.extract(
            test['trace'],
            test['error_type']
        )
        print(f"  提取结果: {var_name} (期望: {test['expected']})")
        assert var_name == test['expected'], f"变量名提取错误"
        print("  ✓ 通过")


if __name__ == '__main__':
    try:
        # 运行主测试
        test_visualization_builder()

        # 运行辅助功能测试
        test_error_location_parser()
        test_variable_name_extractor()

        print("\n" + "=" * 60)
        print("🎉 所有测试通过！模块功能正常")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ 测试失败: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
