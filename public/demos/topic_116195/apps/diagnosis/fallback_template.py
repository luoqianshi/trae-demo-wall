"""
降级诊断模板
当LLM不可用时，提供基于规则的模板诊断
"""
from typing import Dict, Any, Optional


class FallbackDiagnosisTemplate:
    """
    降级诊断模板类
    基于错误类型提供预定义的诊断建议
    """

    # 常见错误类型的模板
    TEMPLATES = {
        "NameError": {
            "error_type": "NameError",
            "root_cause": "你使用了一个未定义的变量名",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查变量名是否拼写正确",
                "确保在使用变量前已经定义（赋值）",
                "注意Python区分大小写，name和Name是不同的变量"
            ],
            "knowledge_points": ["变量定义", "变量作用域"],
            "next_step": "找到未定义的变量，在使用前先给它赋值",
            "confidence": 0.8
        },
        "SyntaxError": {
            "error_type": "SyntaxError",
            "root_cause": "代码的语法不正确",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查括号、引号是否配对",
                "检查冒号(:)是否缺失（if、for、while、def后面需要冒号）",
                "检查缩进是否正确"
            ],
            "knowledge_points": ["Python语法", "代码缩进"],
            "next_step": "仔细检查错误行附近的语法，特别注意标点符号",
            "confidence": 0.7
        },
        "IndentationError": {
            "error_type": "IndentationError",
            "root_cause": "代码的缩进不正确",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "Python使用缩进来表示代码块，通常使用4个空格",
                "确保同一代码块的缩进一致",
                "不要混用Tab和空格"
            ],
            "knowledge_points": ["代码缩进", "代码块"],
            "next_step": "调整代码缩进，确保每个代码块的缩进一致",
            "confidence": 0.9
        },
        "TypeError": {
            "error_type": "TypeError",
            "root_cause": "对不兼容的数据类型进行了操作",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查变量的数据类型是否正确",
                "确保运算符两边的数据类型兼容",
                "必要时使用类型转换函数（如int()、str()）"
            ],
            "knowledge_points": ["数据类型", "类型转换"],
            "next_step": "检查涉及的变量类型，必要时进行类型转换",
            "confidence": 0.7
        },
        "ValueError": {
            "error_type": "ValueError",
            "root_cause": "函数接收到了不合适的参数值",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查传入函数的参数值是否合理",
                "特别注意类型转换时的输入（如int('abc')会报错）",
                "确保输入数据的格式正确"
            ],
            "knowledge_points": ["函数参数", "数据验证"],
            "next_step": "检查函数调用时传入的参数值是否符合要求",
            "confidence": 0.7
        },
        "IndexError": {
            "error_type": "IndexError",
            "root_cause": "访问了列表或字符串中不存在的索引位置",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查索引值是否超出范围",
                "记住Python索引从0开始",
                "使用len()函数检查列表长度"
            ],
            "knowledge_points": ["列表索引", "字符串索引"],
            "next_step": "检查索引值，确保在有效范围内（0到len-1）",
            "confidence": 0.8
        },
        "KeyError": {
            "error_type": "KeyError",
            "root_cause": "访问了字典中不存在的键",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查键名是否拼写正确",
                "使用dict.get()方法代替直接访问，可以提供默认值",
                "先用'in'关键字检查键是否存在"
            ],
            "knowledge_points": ["字典操作", "键值对"],
            "next_step": "确认字典中确实存在该键，或使用get()方法",
            "confidence": 0.8
        },
        "ZeroDivisionError": {
            "error_type": "ZeroDivisionError",
            "root_cause": "尝试除以零",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查除数是否可能为零",
                "在除法运算前添加条件判断",
                "确保输入数据的合理性"
            ],
            "knowledge_points": ["除法运算", "条件判断"],
            "next_step": "在除法前检查除数是否为零，添加必要的判断",
            "confidence": 0.9
        },
        "AttributeError": {
            "error_type": "AttributeError",
            "root_cause": "对象没有你尝试访问的属性或方法",
            "error_location": "请检查错误信息中提示的行号",
            "fix_suggestions": [
                "检查对象类型是否正确",
                "确认方法名或属性名拼写正确",
                "查看对象的可用方法和属性"
            ],
            "knowledge_points": ["对象属性", "方法调用"],
            "next_step": "确认对象类型和可用的方法/属性",
            "confidence": 0.7
        },
        "SecurityError": {
            "error_type": "SecurityError",
            "root_cause": "代码包含不安全的操作",
            "error_location": "代码中使用了被禁止的模块或函数",
            "fix_suggestions": [
                "不要使用os、sys等系统模块",
                "不要使用open()、file()等文件操作",
                "不要使用eval()、exec()等危险函数"
            ],
            "knowledge_points": ["代码安全", "模块限制"],
            "next_step": "移除不安全的代码，使用允许的标准库函数",
            "confidence": 1.0
        },
        "TimeoutError": {
            "error_type": "TimeoutError",
            "root_cause": "代码执行时间过长",
            "error_location": "可能存在死循环或效率问题",
            "fix_suggestions": [
                "检查是否有死循环（循环条件永远为真）",
                "检查循环次数是否过多",
                "优化算法效率"
            ],
            "knowledge_points": ["循环控制", "算法效率"],
            "next_step": "检查循环逻辑，确保循环能够正常结束",
            "confidence": 0.8
        },
    }

    # 默认模板（当错误类型未知时使用）
    DEFAULT_TEMPLATE = {
        "error_type": "UnknownError",
        "root_cause": "代码执行出现了错误",
        "error_location": "请检查错误信息",
        "fix_suggestions": [
            "仔细阅读错误信息，找到错误发生的位置",
            "检查该行代码的语法和逻辑",
            "尝试简化代码，逐步调试"
        ],
        "knowledge_points": ["代码调试"],
        "next_step": "根据错误信息定位问题，逐步排查",
        "confidence": 0.5
    }

    @classmethod
    def get_diagnosis(cls, error_type: Optional[str] = None,
                     error_message: Optional[str] = None,
                     code: Optional[str] = None) -> Dict[str, Any]:
        """
        获取降级诊断结果

        Args:
            error_type: 错误类型
            error_message: 错误信息
            code: 代码文本

        Returns:
            Dict: 诊断结果
        """
        # 根据错误类型选择模板
        if error_type and error_type in cls.TEMPLATES:
            diagnosis = cls.TEMPLATES[error_type].copy()
        else:
            diagnosis = cls.DEFAULT_TEMPLATE.copy()

        # 如果有错误信息，尝试提取更多细节
        if error_message:
            diagnosis = cls._enhance_with_error_message(diagnosis, error_message)

        return diagnosis

    @classmethod
    def _enhance_with_error_message(cls, diagnosis: Dict[str, Any],
                                    error_message: str) -> Dict[str, Any]:
        """
        根据错误信息增强诊断结果

        Args:
            diagnosis: 基础诊断结果
            error_message: 错误信息

        Returns:
            Dict: 增强后的诊断结果
        """
        enhanced = diagnosis.copy()

        # 尝试从错误信息中提取行号
        import re
        line_match = re.search(r'line (\d+)', error_message)
        if line_match:
            line_num = line_match.group(1)
            enhanced["error_location"] = f"第 {line_num} 行"

        # 尝试从错误信息中提取变量名（针对NameError）
        if diagnosis["error_type"] == "NameError":
            name_match = re.search(r"name '(\w+)' is not defined", error_message)
            if name_match:
                var_name = name_match.group(1)
                enhanced["root_cause"] = f"变量 '{var_name}' 未定义就被使用了"
                enhanced["fix_suggestions"].insert(0, f"在使用 '{var_name}' 前先给它赋值")

        return enhanced


def get_fallback_diagnosis(error_type: Optional[str] = None,
                          error_message: Optional[str] = None,
                          code: Optional[str] = None) -> Dict[str, Any]:
    """
    获取降级诊断的便捷函数

    Args:
        error_type: 错误类型
        error_message: 错误信息
        code: 代码文本

    Returns:
        Dict: 诊断结果
    """
    return FallbackDiagnosisTemplate.get_diagnosis(error_type, error_message, code)
