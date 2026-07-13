"""
代码安全检测服务
提供更细粒度的代码安全审计功能
"""
import re
import ast
import logging

logger = logging.getLogger(__name__)


class CodeSecurityChecker:
    """代码安全检测器"""

    # 危险模块列表
    DANGEROUS_MODULES = {
        'os', 'sys', 'subprocess', 'shutil', 'pathlib',
        'socket', 'urllib', 'requests', 'http',
        'pickle', 'marshal', 'shelve',
        'ctypes', 'cffi',
        '__builtin__', 'builtins'
    }

    # 危险函数列表
    DANGEROUS_FUNCTIONS = {
        'eval', 'exec', 'compile', '__import__',
        'open', 'file', 'input',
        'globals', 'locals', 'vars', 'dir',
        'getattr', 'setattr', 'delattr', 'hasattr',
        'reload', 'execfile'
    }

    # 危险属性列表
    DANGEROUS_ATTRIBUTES = {
        '__dict__', '__class__', '__bases__', '__subclasses__',
        '__code__', '__globals__', '__builtins__'
    }

    def __init__(self):
        self.violations = []

    def check(self, code_text):
        """
        检查代码安全性

        Args:
            code_text: 代码文本

        Returns:
            dict: {
                'is_safe': bool,
                'violations': list,
                'risk_level': str  # low/medium/high
            }
        """
        self.violations = []

        # 1. 基础检查
        self._check_code_length(code_text)
        self._check_encoding(code_text)

        # 2. 语法树分析
        try:
            tree = ast.parse(code_text)
            self._check_ast(tree)
        except SyntaxError as e:
            # 语法错误不算安全问题，由执行器处理
            pass
        except Exception as e:
            logger.error(f"AST parsing failed: {str(e)}")
            self.violations.append({
                'type': 'parse_error',
                'message': '代码解析失败',
                'severity': 'medium'
            })

        # 3. 正则表达式检查（作为AST的补充）
        self._check_patterns(code_text)

        # 4. 计算风险等级
        risk_level = self._calculate_risk_level()

        return {
            'is_safe': len(self.violations) == 0,
            'violations': self.violations,
            'risk_level': risk_level
        }

    def _check_code_length(self, code_text):
        """检查代码长度"""
        max_length = 10000  # 10KB
        if len(code_text) > max_length:
            self.violations.append({
                'type': 'length_exceeded',
                'message': f'代码长度超过限制（{max_length}字符）',
                'severity': 'low'
            })

    def _check_encoding(self, code_text):
        """检查编码安全性"""
        # 检查是否包含非法字符
        try:
            code_text.encode('utf-8')
        except UnicodeEncodeError:
            self.violations.append({
                'type': 'encoding_error',
                'message': '代码包含非法字符',
                'severity': 'medium'
            })

    def _check_ast(self, tree):
        """检查AST语法树"""
        for node in ast.walk(tree):
            # 检查导入语句
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name in self.DANGEROUS_MODULES:
                        self.violations.append({
                            'type': 'dangerous_import',
                            'message': f'禁止导入模块: {alias.name}',
                            'severity': 'high',
                            'line': node.lineno
                        })

            elif isinstance(node, ast.ImportFrom):
                if node.module in self.DANGEROUS_MODULES:
                    self.violations.append({
                        'type': 'dangerous_import',
                        'message': f'禁止导入模块: {node.module}',
                        'severity': 'high',
                        'line': node.lineno
                    })

            # 检查函数调用
            elif isinstance(node, ast.Call):
                func_name = self._get_function_name(node.func)
                if func_name in self.DANGEROUS_FUNCTIONS:
                    self.violations.append({
                        'type': 'dangerous_function',
                        'message': f'禁止调用函数: {func_name}',
                        'severity': 'high',
                        'line': node.lineno
                    })

            # 检查属性访问
            elif isinstance(node, ast.Attribute):
                if node.attr in self.DANGEROUS_ATTRIBUTES:
                    self.violations.append({
                        'type': 'dangerous_attribute',
                        'message': f'禁止访问属性: {node.attr}',
                        'severity': 'high',
                        'line': node.lineno
                    })

    def _get_function_name(self, node):
        """获取函数名"""
        if isinstance(node, ast.Name):
            return node.id
        elif isinstance(node, ast.Attribute):
            return node.attr
        return ''

    def _check_patterns(self, code_text):
        """使用正则表达式检查危险模式"""
        patterns = [
            (r'while\s+True\s*:', 'infinite_loop', '可能存在无限循环', 'medium'),
            (r'for\s+\w+\s+in\s+range\s*\(\s*\d{6,}', 'large_loop', '循环次数过大', 'medium'),
            (r'[\[\{]\s*\d{4,}\s*[\]\}]', 'large_literal', '字面量过大', 'low'),
        ]

        for pattern, vtype, message, severity in patterns:
            if re.search(pattern, code_text):
                self.violations.append({
                    'type': vtype,
                    'message': message,
                    'severity': severity
                })

    def _calculate_risk_level(self):
        """计算风险等级"""
        if not self.violations:
            return 'safe'

        high_count = sum(1 for v in self.violations if v['severity'] == 'high')
        medium_count = sum(1 for v in self.violations if v['severity'] == 'medium')

        if high_count > 0:
            return 'high'
        elif medium_count > 2:
            return 'high'
        elif medium_count > 0:
            return 'medium'
        else:
            return 'low'


def check_code_security(code_text):
    """
    便捷函数：检查代码安全性

    Args:
        code_text: 代码文本

    Returns:
        dict: 检查结果
    """
    checker = CodeSecurityChecker()
    return checker.check(code_text)
