"""后端测试"""
import pytest
from app.services.latex_processor import LatexValidator, LatexOptimizer, process_latex


class TestLatexValidator:
    def test_balanced_braces(self):
        result = LatexValidator.validate(r"\frac{a}{b}")
        assert result["is_valid"] is True

    def test_unbalanced_braces(self):
        result = LatexValidator.validate(r"\frac{a{b}")
        assert result["is_valid"] is False

    def test_missing_end(self):
        result = LatexValidator.validate(r"\begin{align} x = y")
        assert result["is_valid"] is False

    def test_left_right_mismatch(self):
        result = LatexValidator.validate(r"\left( x \right]")
        assert result["is_valid"] is False

    def test_simple_formula(self):
        result = LatexValidator.validate(r"E = mc^2")
        assert result["is_valid"] is True


class TestLatexOptimizer:
    def test_auto_fix_strip(self):
        result = LatexOptimizer.auto_fix("  x = 1  ")
        assert result == "x = 1"

    def test_format_multiline(self):
        latex = """\\begin{align}
x &= 1 \\\\
y &= 2
\\end{align}"""
        formatted = LatexOptimizer.format_multiline(latex)
        assert "\\begin{align}" in formatted
        assert "\\end{align}" in formatted


class TestProcessLatex:
    def test_full_pipeline_valid(self):
        result = process_latex(r"E = mc^2")
        assert result["is_valid"] is True
        assert "formatted" in result

    def test_full_pipeline_invalid(self):
        result = process_latex(r"\frac{a{b}", auto_fix=True)
        assert "auto_fixed" in result