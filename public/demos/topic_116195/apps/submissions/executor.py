"""
代码执行器模块
提供安全的Python代码执行环境，支持超时控制、资源限制和危险代码检测
"""
import subprocess
import tempfile
import os
import time
import re
from typing import Dict, Any, Optional, Tuple


class CodeExecutor:
    """
    代码执行器类
    在受限环境中执行Python代码，返回标准化的执行结果
    """

    # 危险模块黑名单（禁止导入）
    DANGEROUS_MODULES = {
        'os', 'sys', 'subprocess', 'shutil', 'pathlib',
        'socket', 'urllib', 'requests', 'http',
        'pickle', 'shelve', 'marshal',
        'ctypes', 'multiprocessing', 'threading',
        '__import__', 'eval', 'exec', 'compile',
        'open', 'file', 'input'  # 禁止文件操作和标准输入（测试用例会注入）
    }

    # 危险函数调用模式（正则检测）
    DANGEROUS_PATTERNS = [
        r'__import__\s*\(',
        r'eval\s*\(',
        r'exec\s*\(',
        r'compile\s*\(',
        r'open\s*\(',
        r'file\s*\(',
    ]

    def __init__(self, timeout: int = 30, memory_limit_mb: int = 128):
        """
        初始化执行器

        Args:
            timeout: 超时时间（秒），默认30秒
            memory_limit_mb: 内存限制（MB），默认128MB
        """
        self.timeout = timeout
        self.memory_limit_mb = memory_limit_mb

    def check_code_safety(self, code: str) -> Tuple[bool, Optional[str]]:
        """
        检查代码安全性

        Args:
            code: 待检查的代码

        Returns:
            (is_safe, error_message): 是否安全，错误信息
        """
        # 检查危险模块导入
        for module in self.DANGEROUS_MODULES:
            # 检查 import xxx 或 from xxx import
            if re.search(rf'\bimport\s+{module}\b', code) or \
               re.search(rf'\bfrom\s+{module}\b', code):
                return False, f"检测到禁止使用的模块: {module}"

        # 检查危险函数调用
        for pattern in self.DANGEROUS_PATTERNS:
            if re.search(pattern, code):
                return False, f"检测到危险的函数调用: {pattern}"

        return True, None

    def execute(self, code: str, stdin_data: str = "") -> Dict[str, Any]:
        """
        执行Python代码

        Args:
            code: 待执行的Python代码
            stdin_data: 标准输入数据（用于测试用例）

        Returns:
            dict: {
                'success': bool,           # 是否执行成功
                'stdout': str,             # 标准输出
                'stderr': str,             # 标准错误
                'exit_code': int,          # 退出码
                'time_used': float,        # 执行耗时（秒）
                'memory_used': int,        # 内存使用（KB，暂不实现）
                'error_type': str,         # 错误类型（如NameError）
                'error_message': str       # 错误信息
            }
        """
        # 1. 安全检查
        is_safe, safety_error = self.check_code_safety(code)
        if not is_safe:
            return {
                'success': False,
                'stdout': '',
                'stderr': safety_error,
                'exit_code': -1,
                'time_used': 0.0,
                'memory_used': 0,
                'error_type': 'SecurityError',
                'error_message': safety_error
            }

        # 2. 创建临时文件存储代码
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                f.write(code)
                temp_file = f.name
        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'exit_code': -1,
                'time_used': 0.0,
                'memory_used': 0,
                'error_type': 'FileError',
                'error_message': f"创建临时文件失败: {str(e)}"
            }

        # 3. 执行代码
        try:
            start_time = time.time()

            # 设置环境变量，确保使用UTF-8编码
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'

            # 使用subprocess执行Python代码
            process = subprocess.Popen(
                ['python', temp_file],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env
            )

            # 传入标准输入并等待执行完成（带超时）
            try:
                stdout_bytes, stderr_bytes = process.communicate(
                    input=stdin_data.encode('utf-8', errors='replace'),
                    timeout=self.timeout
                )
                stdout = stdout_bytes.decode('utf-8', errors='replace')
                stderr = stderr_bytes.decode('utf-8', errors='replace')
                exit_code = process.returncode
                time_used = time.time() - start_time
            except subprocess.TimeoutExpired:
                # 超时，强制终止进程
                process.kill()
                stdout, stderr = process.communicate()
                time_used = self.timeout
                return {
                    'success': False,
                    'stdout': stdout,
                    'stderr': '执行超时',
                    'exit_code': -1,
                    'time_used': time_used,
                    'memory_used': 0,
                    'error_type': 'TimeoutError',
                    'error_message': f'代码执行超过 {self.timeout} 秒'
                }

            # 4. 解析执行结果
            success = (exit_code == 0)
            error_type = ''
            error_message = ''

            if not success and stderr:
                # 从stderr中提取错误类型
                error_type, error_message = self._parse_error(stderr)

            return {
                'success': success,
                'stdout': stdout.strip() if stdout else '',
                'stderr': stderr.strip() if stderr else '',
                'exit_code': exit_code,
                'time_used': round(time_used, 3),
                'memory_used': 0,  # 暂不实现内存统计
                'error_type': error_type,
                'error_message': error_message
            }

        except Exception as e:
            return {
                'success': False,
                'stdout': '',
                'stderr': str(e),
                'exit_code': -1,
                'time_used': 0.0,
                'memory_used': 0,
                'error_type': 'SystemError',
                'error_message': f"执行失败: {str(e)}"
            }

        finally:
            # 5. 清理临时文件
            try:
                if os.path.exists(temp_file):
                    os.remove(temp_file)
            except:
                pass

    def _parse_error(self, stderr: str) -> Tuple[str, str]:
        """
        从stderr中解析错误类型和错误信息

        Args:
            stderr: 标准错误输出

        Returns:
            (error_type, error_message): 错误类型和错误信息
        """
        # Python错误格式通常是：
        # Traceback (most recent call last):
        #   File "xxx.py", line X, in <module>
        #     code line
        # ErrorType: error message

        lines = stderr.strip().split('\n')
        if not lines:
            return 'UnknownError', stderr

        # 最后一行通常包含错误类型和信息
        last_line = lines[-1]

        # 尝试匹配 "ErrorType: message" 格式
        match = re.match(r'^(\w+Error|Exception):\s*(.+)$', last_line)
        if match:
            error_type = match.group(1)
            error_message = match.group(2)
            return error_type, error_message

        # 如果匹配失败，返回完整stderr
        return 'UnknownError', stderr

    def execute_with_test_cases(self, code: str, test_cases: list) -> Dict[str, Any]:
        """
        使用测试用例执行代码并比对结果

        Args:
            code: 待执行的代码
            test_cases: 测试用例列表，格式：[{"input": "5", "output": "True", "description": "..."}]

        Returns:
            dict: {
                'pass_count': int,         # 通过的测试用例数
                'total_count': int,        # 总测试用例数
                'pass_rate': float,        # 通过率（0-100）
                'status': str,             # 'success'/'fail'/'error'
                'test_results': list,      # 每个测试用例的详细结果
                'total_time': float,    总耗时
                'first_error': dict        # 第一个错误的详细信息（如果有）
            }
        """
        if not test_cases:
            return {
                'pass_count': 0,
                'total_count': 0,
                'pass_rate': 0.0,
                'status': 'error',
                'test_results': [],
                'total_time': 0.0,
                'first_error': {'message': '没有提供测试用例'}
            }

        test_results = []
        pass_count = 0
        total_time = 0.0
        first_error = None

        # 逐个执行测试用例
        for idx, test_case in enumerate(test_cases):
            input_data = test_case.get('input', '')
            expected_output = test_case.get('output', '').strip()
            description = test_case.get('description', f'Test case {idx + 1}')

            # 执行代码
            result = self.execute(code, stdin_data=input_data)
            total_time += result['time_used']

            # 比对输出
            actual_output = result['stdout'].strip()
            is_pass = (result['success'] and actual_output == expected_output)

            if is_pass:
                pass_count += 1
            elif not first_error:
                # 记录第一个错误
                first_error = {
                    'test_case_index': idx,
                    'description': description,
                    'input': input_data,
                    'expected': expected_output,
                    'actual': actual_output,
                    'error_type': result['error_type'],
                    'error_message': result['error_message']
                }

            # 记录测试结果
            test_results.append({
                'index': idx,
                'description': description,
                'input': input_data,
                'expected_output': expected_output,
                'actual_output': actual_output,
                'pass': is_pass,
                'time_used': result['time_used'],
                'error_type': result['error_type'],
                'error_message': result['error_message']
            })

        # 计算通过率
        total_count = len(test_cases)
        pass_rate = (pass_count / total_count * 100) if total_count > 0 else 0

        # 判断最终状态
        if pass_count == total_count:
            status = 'success'
        elif pass_count > 0:
            status = 'fail'  # 部分通过
        else:
            status = 'error' if first_error and first_error.get('error_type') else 'fail'

        return {
            'pass_count': pass_count,
            'total_count': total_count,
            'pass_rate': round(pass_rate, 2),
            'status': status,
            'test_results': test_results,
            'total_time': round(total_time, 3),
            'first_error': first_error
        }
