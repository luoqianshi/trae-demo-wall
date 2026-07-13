"""
Prompt模板系统
提供诊断Prompt的模板和上下文构建功能
"""
from typing import Dict, Any, Optional, List
from apps.submissions.models import Submission
import logging

logger = logging.getLogger(__name__)

# Prompt版本号（用于论文实验复现）
PROMPT_VERSION = "v1.0"

# Schema版本号
SCHEMA_VERSION = "v1.0"


class DiagnosisPromptTemplate:
    """
    诊断Prompt模板类
    负责生成LLM诊断所需的System和User Prompt
    """

    # 诊断类型对应的System Prompt
    DIAGNOSIS_TYPE_PROMPTS = {
        'error': """你是一位Python代码错误诊断专家。请诊断代码中的错误、警告和潜在问题。

**诊断重点**：
1. 语法错误：缩进、括号、引号、关键字拼写等
2. 运行时错误：变量未定义、类型错误、索引越界、除零等
3. 逻辑错误：算法错误、条件判断错误、循环逻辑问题
4. 潜在警告：可能导致问题的代码写法
5. **逻辑正确性判断**：即使输出格式不匹配，判断算法思路和核心逻辑是否正确

**输出要求**：
- 精确定位：指出第几行的具体问题
- 清晰解释：用简单语言说明为什么错
- 引导修复：给出修改思路，不直接给完整答案
- 使用初中生能理解的语言
- **logic_correct字段**：判断学生的算法逻辑是否正确（即使输出格式有误）

**输出格式**（严格JSON）：
```json
{
  "errors": [
    {"line": 5, "type": "NameError", "message": "变量x未定义就使用了", "hint": "在使用x之前，先用x=0这样的语句给它赋值"}
  ],
  "warnings": [
    {"line": 8, "message": "这个变量定义了但从未使用", "suggestion": "如果不需要可以删除"}
  ],
  "suggestions": [
    "建议在第3行添加输入验证，检查输入是否为数字"
  ],
  "explanation": "代码主要问题是变量使用前未定义，修复后应该能正常运行",
  "logic_correct": true,
  "logic_explanation": "算法思路正确，使用了正确的判断条件和循环逻辑，只是输出格式与预期不符（多了空格或换行）",
  "confidence": 0.9
}
```

**logic_correct判断标准**：
- true: 算法思路正确，核心逻辑无误，只是输出格式、文字表述、或小的实现细节有差异
- false: 算法思路错误，逻辑判断有误，或者有严重的语法/运行时错误
- 例如：学生输出"是闰年"而题目要求"True"，但判断逻辑正确 → logic_correct=true
- 例如：学生的闰年判断条件写错了 → logic_correct=false""",

        'explain': """你是一位代码讲解老师。请用通俗易懂的语言解释这段代码的功能和实现思路。

**讲解重点**：
1. 整体功能：这段代码要完成什么任务
2. 执行流程：代码按什么顺序执行，每步做什么
3. 关键逻辑：核心算法或重要的判断条件
4. 变量作用：重要变量的含义和用途
5. 知识点：涉及哪些编程概念

**讲解要求**：
- 像讲故事一样，按执行顺序讲解
- 用生活中的例子类比抽象概念
- 避免专业术语，用初中生能懂的话
- 不要指出错误，假设代码是正确的

**输出格式**（严格JSON）：
```json
{
  "overall_function": "这段代码的作用是计算两个数的和并输出结果",
  "step_by_step": [
    "第1步（第1-2行）：使用input()函数读取用户输入的两个数字",
    "第2步（第3行）：将输入的文本转换成整数类型",
    "第3步（第4行）：把两个数相加，结果存到变量sum中",
    "第4步（第5行）：用print()输出计算结果"
  ],
  "key_logic": "核心是类型转换和加法运算，input()读到的是字符串，必须用int()转成数字才能计算",
  "important_variables": {
    "a, b": "存储用户输入的两个数字",
    "sum": "存储计算结果"
  },
  "knowledge_points": ["输入输出", "类型转换", "算术运算", "变量赋值"],
  "analogy": "就像你在计算器上输入两个数，按等号得到结果一样",
  "confidence": 0.95
}
```""",

        'quality': """你是一位代码质量评估专家。请从多个维度评估代码质量并给出改进建议。

**评估维度**：
1. 可读性（40分）：变量命名、代码结构、注释
2. 可维护性（30分）：代码组织、模块化、复用性
3. 性能（20分）：算法效率、资源使用
4. 规范性（10分）：代码风格、格式规范

**评估要求**：
- 给出0-100的总分和各维度分数
- 指出代码的优点（做得好的地方）
- 列出存在的问题
- 提供具体的改进建议
- 假设代码功能正确，只评价写法

**输出格式**（严格JSON）：
```json
{
  "total_score": 75,
  "readability": {
    "score": 30,
    "comment": "变量命名清晰（如sum、count），但缺少注释说明复杂逻辑"
  },
  "maintainability": {
    "score": 22,
    "comment": "代码结构简单易懂，但有重复代码可以提取成函数"
  },
  "performance": {
    "score": 15,
    "comment": "算法效率一般，使用了嵌套循环，数据量大时会变慢"
  },
  "style": {
    "score": 8,
    "comment": "缩进规范，但行间距不统一，建议函数之间空两行"
  },
  "strengths": [
    "变量命名有意义，一看就懂",
    "代码逻辑清晰，没有复杂的嵌套"
  ],
  "issues": [
    "第5-8行和第12-15行代码重复，违反DRY原则",
    "缺少输入验证，如果输入非数字会报错"
  ],
  "suggestions": [
    "把重复的代码提取成一个函数，提高复用性",
    "添加try-except处理输入错误",
    "在复杂逻辑前加注释，说明这段代码的作用"
  ],
  "confidence": 0.9
}
```""",

        'complete': """你是一位代码补全助手。请识别代码缺失的部分，并引导学生补全代码。

**识别重点**：
1. 缺少输入：是否缺少读取数据的代码
2. 缺少处理：是否缺少核心计算或逻辑
3. 缺少输出：是否缺少显示结果的代码
4. 缺少边界处理：是否缺少异常处理或特殊情况判断

**补全要求**：
- 明确指出缺少什么
- 说明缺失会导致什么问题
- 给出补全的位置和思路
- 可以给伪代码框架，但不给完整实现
- 引导学生自己思考和编写

**输出格式**（严格JSON）：
```json
{
  "missing_parts": [
    {
      "location": "代码开头",
      "type": "输入处理",
      "description": "缺少读取用户输入的代码",
      "impact": "没有输入数据，程序无法运行"
    },
    {
      "location": "第10行之后",
      "type": "输出语句",
      "description": "缺少输出结果的print语句",
      "impact": "计算完成但看不到结果"
    }
  ],
  "completion_hints": [
    {
      "step": 1,
      "hint": "在开头添加input()读取数据",
      "example_structure": "n = int(input('请输入一个数字：'))"
    },
    {
      "step": 2,
      "hint": "在结尾添加print()输出结果",
      "example_structure": "print('结果是：', result)"
    }
  ],
  "suggested_structure": "# 第1步：读取输入\n# 第2步：处理数据（已有）\n# 第3步：输出结果",
  "knowledge_points": ["input()函数的使用", "print()函数的使用", "类型转换"],
  "next_step": "先尝试添加输入和输出，运行看看效果，再逐步完善",
  "confidence": 0.9
}
```"""
    }

    # System Prompt模板（默认，保持向后兼容）
    SYSTEM_PROMPT = DIAGNOSIS_TYPE_PROMPTS['error'] + """

**注意**：
- 必须返回有效的JSON格式
- confidence字段表示诊断的置信度（0-1之间）
- 如果通过率100%，fix_suggestions应该为空或包含代码质量改进建议
- code_quality_tips仅在通过率100%时提供，否则为空数组"""

    # User Prompt模板（用于有错误的情况）
    USER_PROMPT_TEMPLATE = """请帮我分析以下Python代码的错误：

**题目**：{problem_title}
**题目描述**：
{problem_description}

**学生代码**：
```python
{code}
```

**执行结果**：
- 状态：{status}
- 通过率：{pass_rate}%
- 通过测试用例：{pass_count}/{total_count}

**失败的测试用例**：
{failed_cases}

**错误信息**：
{error_info}

请按照指定的JSON格式输出诊断结果。"""

    # User Prompt模板（用于质量评估）
    USER_PROMPT_PERFECT_TEMPLATE = """请对以下Python代码进行质量评估（不是错误诊断）：

**题目**：{problem_title}
**题目描述**：
{problem_description}

**学生代码**：
```python
{code}
```

**执行结果**：
- 状态：{status}
- 通过率：{pass_rate}%
- 通过测试用例：{pass_count}/{total_count}

**评估要求**：
1. 假设代码功能目标明确，重点评价写法质量
2. 必须按以下JSON字段输出：
   - total_score
   - readability（含score/comment）
   - maintainability（含score/comment）
   - performance（含score/comment）
   - style（含score/comment）
   - strengths（数组）
   - issues（数组）
   - suggestions（数组）
   - confidence
3. 只返回JSON，不要返回其他文本

请按照指定的JSON格式输出诊断结果。"""

    # User Prompt模板（用于代码解释）
    USER_PROMPT_EXPLAIN_TEMPLATE = """请解释以下Python代码：

**题目**：{problem_title}
**题目描述**：
{problem_description}

**学生代码**：
```python
{code}
```

**说明要求**：
1. 用初中生能理解的语言讲解
2. 必须按以下JSON字段输出：
   - overall_function
   - step_by_step（数组）
   - key_logic
   - important_variables（对象）
   - knowledge_points（数组）
   - analogy
   - confidence
3. 只返回JSON，不要返回其他文本

请按照指定的JSON格式输出诊断结果。"""

    # User Prompt模板（用于代码补全）
    USER_PROMPT_COMPLETE_TEMPLATE = """请分析以下Python代码中缺失或待完善的部分，并给出补全引导：

**题目**：{problem_title}
**题目描述**：
{problem_description}

**学生代码**：
```python
{code}
```

**执行结果**：
- 状态：{status}
- 通过率：{pass_rate}%
- 通过测试用例：{pass_count}/{total_count}

**补全要求**：
1. 不要直接给完整答案，给结构化引导
2. 必须按以下JSON字段输出：
   - missing_parts（数组）
   - completion_hints（数组）
   - suggested_structure
   - knowledge_points（数组）
   - next_step
   - confidence
3. 只返回JSON，不要返回其他文本

请按照指定的JSON格式输出诊断结果。"""

    @classmethod
    def get_system_prompt(cls, diagnosis_type: str = 'error') -> str:
        """
        获取System Prompt

        Args:
            diagnosis_type: 诊断类型（error/explain/quality/complete）

        Returns:
            str: 对应类型的System Prompt
        """
        return cls.DIAGNOSIS_TYPE_PROMPTS.get(diagnosis_type, cls.DIAGNOSIS_TYPE_PROMPTS['error'])

    @classmethod
    def build_user_prompt(cls, context: Dict[str, Any], diagnosis_type: str = 'error') -> str:
        """
        构建User Prompt

        Args:
            context: 诊断上下文，包含题目、代码、执行结果等信息
            diagnosis_type: 诊断类型（error/explain/quality/complete）

        Returns:
            str: 构建好的User Prompt
        """
        # 提取上下文信息
        problem_title = context.get("problem_title", "未知题目")
        problem_description = context.get("problem_description", "无描述")
        code = context.get("code", "")
        status = context.get("status", "unknown")
        pass_rate = context.get("pass_rate", 0)
        pass_count = context.get("pass_count", 0)
        total_count = context.get("total_count", 0)
        failed_cases = context.get("failed_cases", [])
        error_info = context.get("error_info", "无错误信息")

        if diagnosis_type == 'quality':
            user_prompt = cls.USER_PROMPT_PERFECT_TEMPLATE.format(
                problem_title=problem_title,
                problem_description=cls._truncate_text(problem_description, 500),
                code=cls._truncate_text(code, 1000),
                status=status,
                pass_rate=pass_rate,
                pass_count=pass_count,
                total_count=total_count,
            )
        elif diagnosis_type == 'explain':
            user_prompt = cls.USER_PROMPT_EXPLAIN_TEMPLATE.format(
                problem_title=problem_title,
                problem_description=cls._truncate_text(problem_description, 500),
                code=cls._truncate_text(code, 1000),
            )
        elif diagnosis_type == 'complete':
            user_prompt = cls.USER_PROMPT_COMPLETE_TEMPLATE.format(
                problem_title=problem_title,
                problem_description=cls._truncate_text(problem_description, 500),
                code=cls._truncate_text(code, 1000),
                status=status,
                pass_rate=pass_rate,
                pass_count=pass_count,
                total_count=total_count,
            )
        else:
            failed_cases_text = cls._format_failed_cases(failed_cases)
            user_prompt = cls.USER_PROMPT_TEMPLATE.format(
                problem_title=problem_title,
                problem_description=cls._truncate_text(problem_description, 500),
                code=cls._truncate_text(code, 1000),
                status=status,
                pass_rate=pass_rate,
                pass_count=pass_count,
                total_count=total_count,
                failed_cases=failed_cases_text,
                error_info=cls._truncate_text(error_info, 500)
            )

        return user_prompt

    @staticmethod
    def _format_failed_cases(failed_cases: List[Dict[str, Any]], max_cases: int = 3) -> str:
        """
        格式化失败的测试用例

        Args:
            failed_cases: 失败的测试用例列表
            max_cases: 最多显示的用例数量

        Returns:
            str: 格式化后的文本
        """
        if not failed_cases:
            return "无失败用例"

        # 限制显示数量
        cases_to_show = failed_cases[:max_cases]
        result_lines = []

        for idx, case in enumerate(cases_to_show, 1):
            result_lines.append(f"用例 {idx}:")
            result_lines.append(f"  输入: {case.get('input', 'N/A')}")
            result_lines.append(f"  期望输出: {case.get('expected', 'N/A')}")
            result_lines.append(f"  实际输出: {case.get('actual', 'N/A')}")
            if case.get('error_message'):
                result_lines.append(f"  错误: {case.get('error_message')}")
            result_lines.append("")

        if len(failed_cases) > max_cases:
            result_lines.append(f"（还有 {len(failed_cases) - max_cases} 个失败用例未显示）")

        return "\n".join(result_lines)

    @staticmethod
    def _truncate_text(text: str, max_length: int) -> str:
        """
        截断文本到指定长度

        Args:
            text: 原始文本
            max_length: 最大长度

        Returns:
            str: 截断后的文本
        """
        if not text:
            return ""
        if len(text) <= max_length:
            return text
        return text[:max_length] + "...(已截断)"


class DiagnosisContextBuilder:
    """
    诊断上下文构建器
    从Submission中提取并组装诊断所需的上下文信息
    """

    @staticmethod
    def build_context(submission: Submission) -> Dict[str, Any]:
        """
        构建诊断上下文

        Args:
            submission: 提交记录对象

        Returns:
            Dict: 诊断上下文字典
        """
        try:
            # 基本信息
            context = {
                "submission_id": submission.id,
                "problem_id": submission.problem.id,
                "problem_title": submission.problem.title,
                "problem_description": submission.problem.description,
                "code": submission.code_text,
                "status": submission.run_status,
                "score": submission.score,
            }

            # 如果有执行结果，添加详细信息
            if hasattr(submission, '_execution_result') and submission._execution_result:
                exec_result = submission._execution_result
                context.update({
                    "pass_rate": exec_result.get("pass_rate", 0),
                    "pass_count": exec_result.get("pass_count", 0),
                    "total_count": exec_result.get("total_count", 0),
                    "total_time": exec_result.get("total_time", 0),
                    "test_results": exec_result.get("test_results", []),
                    "first_error": exec_result.get("first_error"),
                })

                # 提取失败的测试用例
                failed_cases = [
                    {
                        "input": test.get("input"),
                        "expected": test.get("expected_output"),
                        "actual": test.get("actual_output"),
                        "error_message": test.get("error_message"),
                    }
                    for test in exec_result.get("test_results", [])
                    if not test.get("pass")
                ]
                context["failed_cases"] = failed_cases

                # 提取错误信息
                first_error = exec_result.get("first_error")
                if first_error:
                    error_info_parts = []
                    if first_error.get("error_type"):
                        error_info_parts.append(f"错误类型: {first_error['error_type']}")
                    if first_error.get("error_message"):
                        error_info_parts.append(f"错误信息: {first_error['error_message']}")
                    context["error_info"] = "\n".join(error_info_parts)
                else:
                    context["error_info"] = "无具体错误信息"
            else:
                # 从submission直接提取信息
                # 根据score计算通过率（score是0-100的分数）
                pass_rate = submission.score if submission.score is not None else 0
                total_tests = len(submission.problem.test_cases)
                pass_count = int((pass_rate / 100.0) * total_tests) if total_tests > 0 else 0

                logger.info(f"Building context from submission: score={submission.score}, pass_rate={pass_rate}, pass_count={pass_count}/{total_tests}")

                context.update({
                    "pass_rate": pass_rate,
                    "pass_count": pass_count,
                    "total_count": total_tests,
                    "failed_cases": [],
                    "error_info": submission.error_trace or "无错误信息"
                })

            logger.info(f"Built diagnosis context for submission {submission.id}")
            return context

        except Exception as e:
            logger.error(f"Failed to build diagnosis context: {str(e)}")
            raise


def get_prompt_version() -> str:
    """获取当前Prompt版本号"""
    return PROMPT_VERSION


def get_schema_version() -> str:
    """获取当前Schema版本号"""
    return SCHEMA_VERSION
