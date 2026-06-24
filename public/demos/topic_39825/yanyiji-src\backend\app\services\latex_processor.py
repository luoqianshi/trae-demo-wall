"""LaTeX 后处理服务 - 语法校验与结构优化"""
import re
from typing import Optional


class LatexValidator:
    """LaTeX 语法校验器"""

    # 常见的 LaTeX 环境配对
    ENVIRONMENTS = {
        "align": "end{align}",
        "align*": "end{align*}",
        "gather": "end{gather}",
        "gather*": "end{gather*}",
        "equation": "end{equation}",
        "equation*": "end{equation*}",
        "matrix": "end{matrix}",
        "bmatrix": "end{bmatrix}",
        "pmatrix": "end{pmatrix}",
        "cases": "end{cases}",
        "array": "end{array}",
    }

    # 需要配对的括号
    BRACKET_PAIRS = {
        "{": "}",
        "(": ")",
        "[": "]",
        "\\{": "\\}",
    }

    @staticmethod
    def validate_braces(latex: str) -> list[str]:
        """检查括号是否匹配，返回错误列表"""
        errors = []
        stack = []

        i = 0
        while i < len(latex):
            char = latex[i]

            # 处理转义的大括号
            if i > 0 and latex[i - 1] == "\\" and char in "{}":
                i += 1
                continue

            if char == "{":
                stack.append(("brace", i))
            elif char == "}":
                if not stack:
                    errors.append(f"第 {i} 位置: 多余的右大括号 '}}'")
                else:
                    stack.pop()

            i += 1

        for _, pos in stack:
            errors.append(f"第 {pos} 位置: 未闭合的左大括号 '{{'")

        return errors

    @staticmethod
    def validate_environments(latex: str) -> list[str]:
        """检查环境配对"""
        errors = []
        begin_pattern = re.compile(r"\\begin\{(\w+\*?)\}")
        end_pattern = re.compile(r"\\end\{(\w+\*?)\}")

        begins = begin_pattern.findall(latex)
        ends = end_pattern.findall(latex)

        # 简单检查数量
        for env in set(begins):
            if begins.count(env) > ends.count(env):
                errors.append(f"环境 '{env}' 缺少 \\end{{{env}}}")

        for env in set(ends):
            if ends.count(env) > begins.count(env):
                errors.append(f"环境 '{env}' 多余的 \\end{{{env}}}")

        return errors

    @staticmethod
    def validate_commands(latex: str) -> list[str]:
        """检查常见命令错误"""
        errors = []
        warnings = []

        # 检查 \left 和 \right 配对
        left_count = latex.count("\\left")
        right_count = latex.count("\\right")
        if left_count != right_count:
            errors.append(f"\\left 和 \\right 不匹配 (left: {left_count}, right: {right_count})")

        # 检查 \frac 参数数量
        frac_pattern = re.compile(r"\\frac(?!\s*\{)")
        frac_matches = frac_pattern.findall(latex)
        if frac_matches:
            warnings.append(f"\\frac 命令后建议使用大括号包裹参数")

        return errors + warnings

    @classmethod
    def validate(cls, latex: str) -> dict:
        """完整校验，返回结果"""
        errors = []
        errors.extend(cls.validate_braces(latex))
        errors.extend(cls.validate_environments(latex))
        errors.extend(cls.validate_commands(latex))

        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
            "latex": latex,
        }


class LatexOptimizer:
    """LaTeX 结构优化器"""

    # 需要剥离的数学环境
    _STRIP_ENVS = [
        'align', 'align*', 'gather', 'gather*', 'equation', 'equation*',
        'matrix', 'bmatrix', 'pmatrix', 'vmatrix', 'Vmatrix',
        'cases', 'array', 'eqnarray', 'eqnarray*',
        'flalign', 'flalign*', 'multline', 'multline*',
    ]

    @staticmethod
    def strip_environment(latex: str) -> str:
        """剥离数学环境（\\begin{...}...\\end{...}），返回纯公式内容

        支持两种情况：
        1. 环境包裹整个字符串（首尾匹配）
        2. 环境嵌入字符串中间（提取内部内容）
        """
        s = latex.strip()

        # 情况1：环境在首尾
        for env in LatexOptimizer._STRIP_ENVS:
            begin = f'\\begin{{{env}}}'
            end = f'\\end{{{env}}}'
            if s.startswith(begin) and s.endswith(end):
                inner = s[len(begin):-len(end)].strip()
                return LatexOptimizer.strip_environment(inner)

        # 情况2：环境在字符串中间（如 "文字 \\begin{align} ... \\end{align}"）
        for env in LatexOptimizer._STRIP_ENVS:
            pattern = re.compile(
                r'\\begin\{' + re.escape(env) + r'\}(.*?)\\end\{' + re.escape(env) + r'\}',
                re.DOTALL
            )
            match = pattern.search(s)
            if match:
                inner = match.group(1).strip()
                # 用提取的内容替换原环境，保留环境外的其他内容
                s = s[:match.start()] + inner + s[match.end():]
                return LatexOptimizer.strip_environment(s)

        return s

    @staticmethod
    def clean_vlm_output(latex: str) -> list[str]:
        """清理 VLM 返回的 LaTeX，拆分为独立公式列表

        处理：
        1. 剥离 \\begin{align} 等环境包装
        2. 移除 \\tag{...}、\\label{...}、\\quad、\\qquad
        3. 按 \\\\ 拆分多行公式
        4. 清理每行的 \\text{}、多余空格等
        """
        # 1. 剥离环境包装
        s = LatexOptimizer.strip_environment(latex)

        # 2. 移除 tag/label/非公式标记
        s = re.sub(r'\\tag\{[^}]*\}', '', s)
        s = re.sub(r'\\label\{[^}]*\}', '', s)
        s = re.sub(r'\\nonumber|\\notag', '', s)
        s = re.sub(r'\\quad|\\qquad', ' ', s)

        # 3. 按 \\ 拆分行（处理多行公式）
        lines = re.split(r'\\\\', s)

        formulas = []
        for line in lines:
            line = line.strip()
            if not line:
                continue

            # 移除行首 & (对齐符)
            line = re.sub(r'^&\s*', '', line)
            # 移除 &= 或 = 中的 & 对齐符
            line = line.replace('&=', '=').replace('=&', '=')

            # 清理 \text{...} → 完全移除（VLM 常在公式前加文字描述如"姿态指数映射"）
            line = re.sub(r'\\text\s*\{[^}]*\}', '', line)

            # 移除残留的中文文字和描述性文本（非数学符号）
            # 匹配连续的中文字符、英文单词后跟冒号/逗号等
            line = re.sub(r'^[\u4e00-\u9fa5a-zA-Z\s,，:：;；]+(?=[\\[{(])', '', line)
            line = re.sub(r'[\\[{(][\u4e00-\u9fa5a-zA-Z\s,，:：;；]+[}\])]$', '', line)

            # \operatorname{Exp} → \operatorname{Exp}（保留）
            # \mathrm 同上保留

            # 清理多余空格
            line = re.sub(r'\s+', ' ', line).strip()

            if line and len(line) > 1:  # 过滤太短的无效结果
                formulas.append(line)

        return formulas if formulas else [latex]

    @staticmethod
    def auto_fix(latex: str) -> str:
        """自动修复常见问题"""
        fixed = latex

        # 移除多余的文本标记
        fixed = re.sub(r"\\text\s*\{\s*\\mathrm\s*\{([^}]+)\}\s*\}", r"\\mathrm{\1}", fixed)

        # 统一求和/积分上下标格式
        fixed = re.sub(r"\\sum_(\w+)\^(\w+)", r"\\sum_{\1}^{\2}", fixed)

        # 修复缺失的空格
        fixed = re.sub(r"\\begin\{(\w+)\}(?!\s)", r"\\begin{\1}\n", fixed)
        fixed = re.sub(r"(?<!\s)\\end\{(\w+)\}", r"\n\\end{\1}", fixed)

        # 确保公式后有换行
        fixed = fixed.strip()

        return fixed

    @staticmethod
    def format_multiline(latex: str) -> str:
        """格式化多行公式"""
        lines = latex.split("\n")
        formatted = []
        indent_level = 0

        for line in lines:
            stripped = line.strip()
            if not stripped:
                formatted.append("")
                continue

            # 减少缩进
            if stripped.startswith("\\end{"):
                indent_level = max(0, indent_level - 1)

            formatted.append("  " * indent_level + stripped)

            # 增加缩进
            if stripped.startswith("\\begin{"):
                indent_level += 1

        return "\n".join(formatted)


def process_latex(latex: str, auto_fix: bool = True) -> dict:
    """完整的后处理流程（单个公式）"""
    # 先剥离环境包装（VLM 常返回 \begin{align} 等）
    cleaned = LatexOptimizer.strip_environment(latex)

    result = LatexValidator.validate(cleaned)

    if auto_fix:
        fixed_latex = LatexOptimizer.auto_fix(cleaned)
        result["auto_fixed"] = fixed_latex
        result["fixed_validation"] = LatexValidator.validate(fixed_latex)
    else:
        result["auto_fixed"] = cleaned

    result["formatted"] = LatexOptimizer.format_multiline(
        result.get("auto_fixed", cleaned)
    )

    return result


def process_latex_from_vlm(latex: str, auto_fix: bool = True) -> list[dict]:
    """处理 VLM 返回的 LaTeX，支持多行公式拆分

    Returns:
        list[dict]: 每个独立公式的处理结果，同 process_latex 返回格式
    """
    formulas = LatexOptimizer.clean_vlm_output(latex)
    results = []
    for f in formulas:
        results.append(process_latex(f, auto_fix=auto_fix))
    return results