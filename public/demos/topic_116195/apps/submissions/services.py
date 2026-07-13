from apps.diagnosis.services import find_cached_diagnosis
"""
提交与评测模块Service层
封装提交记录相关的业务逻辑和数据访问
"""
from django.db.models import Count, Q, Avg
from .models import Submission
from apps.problems.models import Problem
from .executor import CodeExecutor
import logging

logger = logging.getLogger(__name__)


def quick_execute_code(code, input_data):
    """
    快速执行代码（不保存提交记录）

    如果提供了多行输入，会为每行输入分别执行代码并收集所有输出

    Args:
        code: Python代码
        input_data: 输入数据（可以是多行）

    Returns:
        dict: {
            'success': bool,
            'output': str,
            'error': str,
            'execution_time': float
        }
    """
    import time
    start_time = time.time()

    try:
        # 确保 input_data 不是 None
        if input_data is None:
            input_data = ''

        # 确保输入数据格式正确
        input_data = str(input_data).strip()

        # 检查是否有多行输入
        input_lines = input_data.split('\n') if input_data else ['']

        # 如果只有一行或没有输入，直接执行
        if len(input_lines) <= 1:
            single_input = input_lines[0] if input_lines else ''
            if single_input and not single_input.endswith('\n'):
                single_input += '\n'

            executor = CodeExecutor()
            result = executor.execute(code, single_input)
            execution_time = time.time() - start_time

            return {
                'success': result['success'],
                'output': result.get('stdout', ''),
                'error': result.get('error_message') or result.get('stderr'),
                'execution_time': round(execution_time, 3)
            }

        # 多行输入：为每行分别执行代码
        all_outputs = []
        all_errors = []
        executor = CodeExecutor()

        for line in input_lines:
            if not line.strip():  # 跳过空行
                continue

            # 为每行添加换行符
            line_input = line + '\n'
            result = executor.execute(code, line_input)

            if result['success']:
                output = result.get('stdout', '').strip()
                if output:
                    all_outputs.append(output)
            else:
                error = result.get('error_message') or result.get('stderr')
                all_errors.append(f"输入 '{line}' 时出错: {error}")

        execution_time = time.time() - start_time

        # 如果有错误，返回错误信息
        if all_errors:
            return {
                'success': False,
                'output': '\n'.join(all_outputs) if all_outputs else '',
                'error': '\n'.join(all_errors),
                'execution_time': round(execution_time, 3)
            }

        # 返回所有输出
        return {
            'success': True,
            'output': '\n'.join(all_outputs),
            'error': None,
            'execution_time': round(execution_time, 3)
        }

    except Exception as e:
        execution_time = time.time() - start_time
        return {
            'success': False,
            'output': '',
            'error': str(e),
            'execution_time': round(execution_time, 3)
        }


def create_submission(student, problem_id, code_text, run_status='pending',
                     score=0, stdout_text='', error_type=None, error_trace=None):
    """
    创建提交记录

    Args:
        student: 学生User对象
        problem_id: 题目ID
        code_text: 代码文本
        run_status: 运行状态
        score: 得分
        stdout_text: 标准输出
        error_type: 错误类型
        error_trace: 错误堆栈

    Returns:
        Submission对象或None
    """
    try:
        problem = Problem.objects.get(id=problem_id)
        submission = Submission.objects.create(
            student=student,
            problem=problem,
            code_text=code_text,
            run_status=run_status,
            score=score,
            stdout_text=stdout_text or '',
            error_type=error_type,
            error_trace=error_trace
        )
        return submission
    except Problem.DoesNotExist:
        return None


def list_student_submissions(student, problem_id=None, run_status=None, page=1, page_size=20):
    """
    获取学生的提交记录列表

    Args:
        student: 学生User对象
        problem_id: 题目ID（可选）
        run_status: 运行状态筛选（可选）
        page: 页码
        page_size: 每页数量

    Returns:
        dict: {
            'submissions': 提交列表,
            'total': 总数量,
            'page': 当前页,
            'page_size': 每页数量,
            'total_pages': 总页数
        }
    """
    queryset = Submission.objects.filter(student=student)

    # 题目筛选
    if problem_id:
        queryset = queryset.filter(problem_id=problem_id)

    # 状态筛选
    if run_status:
        queryset = queryset.filter(run_status=run_status)

    # 统计总数
    total = queryset.count()

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    submissions = list(queryset.select_related('problem')[start:end])

    # 计算总页数
    total_pages = (total + page_size - 1) // page_size

    return {
        'submissions': submissions,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages
    }


def get_submission_detail(submission_id):
    """
    获取提交详情

    Args:
        submission_id: 提交ID

    Returns:
        Submission对象或None
    """
    try:
        return Submission.objects.select_related('student', 'problem').get(id=submission_id)
    except Submission.DoesNotExist:
        return None


def get_student_problem_submissions(student, problem_id):
    """
    获取学生某题的所有提交记录

    Args:
        student: 学生User对象
        problem_id: 题目ID

    Returns:
        QuerySet: 提交记录列表
    """
    return Submission.objects.filter(
        student=student,
        problem_id=problem_id
    ).order_by('-created_at')


def get_student_statistics(student):
    """
    获取学生统计信息

    Args:
        student: 学生User对象

    Returns:
        dict: {
            'total_submissions': 总提交数,
            'success_count': 成功数,
            'fail_count': 失败数,
            'error_count': 错误数,
            'avg_score': 平均分,
            'solved_problems': 已解决题目数
        }
    """
    submissions = Submission.objects.filter(student=student)

    total = submissions.count()
    success_count = submissions.filter(run_status='success').count()
    fail_count = submissions.filter(run_status='fail').count()
    error_count = submissions.filter(run_status='error').count()

    # 平均分
    avg_score = submissions.aggregate(Avg('score'))['score__avg'] or 0

    # 已解决题目数（至少有一次成功提交的题目）
    solved_problems = submissions.filter(run_status='success').values('problem').distinct().count()

    return {
        'total_submissions': total,
        'success_count': success_count,
        'fail_count': fail_count,
        'error_count': error_count,
        'avg_score': round(avg_score, 2),
        'solved_problems': solved_problems
    }


def get_problem_submissions(problem_id, run_status=None, page=1, page_size=20):
    """
    获取某题的所有提交记录（教师查看）

    Args:
        problem_id: 题目ID
        run_status: 运行状态筛选（可选）
        page: 页码
        page_size: 每页数量

    Returns:
        dict: 提交列表和统计信息
    """
    queryset = Submission.objects.filter(problem_id=problem_id)

    if run_status:
        queryset = queryset.filter(run_status=run_status)

    total = queryset.count()

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    submissions = list(queryset.select_related('student')[start:end])

    total_pages = (total + page_size - 1) // page_size

    return {
        'submissions': submissions,
        'total': total,
        'page': page,
        'page_size': page_size,
        'total_pages': total_pages
    }


def get_problem_statistics(problem_id):
    """
    获取题目提交统计

    Args:
        problem_id: 题目ID

    Returns:
        dict: 统计信息
    """
    submissions = Submission.objects.filter(problem_id=problem_id)

    total = submissions.count()
    success_count = submissions.filter(run_status='success').count()
    pass_rate = (success_count / total * 100) if total > 0 else 0

    # 常见错误类型统计
    error_stats = submissions.filter(
        error_type__isnull=False
    ).values('error_type').annotate(
        count=Count('id')
    ).order_by('-count')[:5]

    return {
        'total_submissions': total,
        'success_count': success_count,
        'pass_rate': round(pass_rate, 2),
        'top_errors': list(error_stats)
    }


def execute_and_judge_submission(student, problem_id, code_text, language='python'):
    """
    执行代码并判题（第3阶段核心功能）

    Args:
        student: 学生User对象
        problem_id: 题目ID
        code_text: 代码文本
        language: 编程语言（默认python）

    Returns:
        dict: {
            'success': bool,           # 是否成功
            'submission': Submission,  # 提交对象
            'execution_result': dict,  # 执行结果详情
            'error': str              # 错误信息（如果有）
        }
    """
    try:
        # 1. 参数校验
        if not code_text or not code_text.strip():
            return {
                'success': False,
                'submission': None,
                'execution_result': None,
                'error': 'Code cannot be empty'
            }

        if len(code_text) > 10000:
            return {
                'success': False,
                'submission': None,
                'execution_result': None,
                'error': 'Code too long (max 10000 characters)'
            }

        # 2. 获取题目和测试用例
        try:
            problem = Problem.objects.get(id=problem_id)
        except Problem.DoesNotExist:
            return {
                'success': False,
                'submission': None,
                'execution_result': None,
                'error': f'Problem {problem_id} not found'
            }

        test_cases = problem.test_cases
        if not test_cases:
            return {
                'success': False,
                'submission': None,
                'execution_result': None,
                'error': 'No test cases configured for this problem'
            }

        # 3. 创建初始提交记录（状态：pending）
        submission = Submission.objects.create(
            student=student,
            problem=problem,
            code_text=code_text,
            run_status='pending',
            score=0
        )

        logger.info(f"Created submission {submission.id} for student {student.username} on problem {problem_id}")

        # 4. 执行代码并判题
        try:
            executor = CodeExecutor(timeout=5, memory_limit_mb=128)
            execution_result = executor.execute_with_test_cases(code_text, test_cases)

            # 5. 更新提交记录
            submission.run_status = execution_result['status']
            submission.score = int(execution_result['pass_rate'])

            # 记录第一个错误信息（如果有）
            if execution_result['first_error']:
                first_error = execution_result['first_error']
                submission.error_type = first_error.get('error_type', '')

                # 构建错误堆栈信息
                error_trace_parts = []
                if first_error.get('description'):
                    error_trace_parts.append(f"Test case: {first_error['description']}")
                if first_error.get('input'):
                    error_trace_parts.append(f"Input: {first_error['input']}")
                if first_error.get('expected'):
                    error_trace_parts.append(f"Expected: {first_error['expected']}")
                if first_error.get('actual'):
                    error_trace_parts.append(f"Actual: {first_error['actual']}")
                if first_error.get('error_message'):
                    error_trace_parts.append(f"Error: {first_error['error_message']}")

                submission.error_trace = '\n'.join(error_trace_parts)

            # 记录成功时的输出（取第一个测试用例的输出）
            if execution_result['test_results']:
                first_result = execution_result['test_results'][0]
                submission.stdout_text = first_result.get('actual_output', '')

            submission.save()

            # LLM 逻辑正确加分（如果题目允许且未满分）
            if submission.score < 100 and problem.llm_logic_bonus > 0:
                cached_diag = find_cached_diagnosis(
                    submission.code_text,
                    submission.error_type or ""
                )
                if cached_diag and cached_diag.source == "llm":
                    try:
                        diag_data = cached_diag.diagnosis_data
                        if isinstance(diag_data, dict) and diag_data.get("logic_correct") is True:
                            bonus = problem.llm_logic_bonus
                            submission.score = min(100, submission.score + bonus)
                            submission.error_trace = (submission.error_trace or "") + "\n[LLM_LOGIC_BONUS] LLM 判定逻辑正确；+{bonus} 分。".format(bonus=bonus)
                            submission.save()
                    except Exception:
                        # 如果解析出错，忽略此次加分
                        pass

            logger.info(f"Submission {submission.id} judged: {execution_result['status']}, "
                       f"pass_rate={execution_result['pass_rate']}%")

            return {
                'success': True,
                'submission': submission,
                'execution_result': execution_result,
                'error': None
            }

        except Exception as e:
            # 执行失败，更新为error状态
            submission.run_status = 'error'
            submission.error_type = 'SystemError'
            submission.error_trace = str(e)
            submission.save()

            logger.error(f"Execution failed for submission {submission.id}: {str(e)}")

            return {
                'success': False,
                'submission': submission,
                'execution_result': None,
                'error': f'Execution failed: {str(e)}'
            }

    except Exception as e:
        logger.error(f"Failed to create submission: {str(e)}")
        return {
            'success': False,
            'submission': None,
            'execution_result': None,
            'error': f'System error: {str(e)}'
        }


def update_submission_status(submission_id, run_status, score=None,
                            stdout_text=None, error_type=None, error_trace=None):
    """
    更新提交状态（用于异步执行场景）

    Args:
        submission_id: 提交ID
        run_status: 运行状态
        score: 得分（可选）
        stdout_text: 标准输出（可选）
        error_type: 错误类型（可选）
        error_trace: 错误堆栈（可选）

    Returns:
        bool: 是否更新成功
    """
    try:
        submission = Submission.objects.get(id=submission_id)
        submission.run_status = run_status

        if score is not None:
            submission.score = score
        if stdout_text is not None:
            submission.stdout_text = stdout_text
        if error_type is not None:
            submission.error_type = error_type
        if error_trace is not None:
            submission.error_trace = error_trace

        submission.save()
        return True
    except Submission.DoesNotExist:
        return False

