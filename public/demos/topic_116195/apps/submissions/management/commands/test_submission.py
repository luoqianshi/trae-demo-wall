"""
测试提交功能的管理命令
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.problems.models import Problem
from apps.submissions import services


class Command(BaseCommand):
    help = 'Test submission functionality'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("Testing Submission Service - Stage 3")
        self.stdout.write("=" * 60)

        # 1. Get test user and problem
        self.stdout.write("\n[Step 1] Get test user and problem...")
        try:
            student = User.objects.get(username='student001')
            self.stdout.write(self.style.SUCCESS(f"Found student: {student.username}"))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Student not found"))
            return

        try:
            problem = Problem.objects.get(id=1)  # 使用ID=1的题目（判断偶数）
            self.stdout.write(self.style.SUCCESS(f"Found problem: {problem.title} (ID: {problem.id})"))
            self.stdout.write(f"   Test cases: {len(problem.test_cases)}")
            for idx, tc in enumerate(problem.test_cases):
                self.stdout.write(f"   - Case {idx+1}: input={tc.get('input')}, output={tc.get('output')}")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Problem not found: {e}"))
            return

        # 2. Test correct code
        self.stdout.write("\n[Step 2] Test correct code...")
        correct_code = """n = int(input())
print(n % 2 == 0)"""

        result = services.execute_and_judge_submission(
            student=student,
            problem_id=problem.id,
            code_text=correct_code
        )

        if result['success']:
            submission = result['submission']
            exec_result = result['execution_result']
            self.stdout.write(self.style.SUCCESS(f"Submission created: ID={submission.id}"))
            self.stdout.write(f"   Status: {submission.run_status}")
            self.stdout.write(f"   Score: {submission.score}")
            self.stdout.write(f"   Pass rate: {exec_result['pass_rate']}%")
            self.stdout.write(f"   Pass count: {exec_result['pass_count']}/{exec_result['total_count']}")
            self.stdout.write(f"   Total time: {exec_result['total_time']}s")
        else:
            self.stdout.write(self.style.ERROR(f"Submission failed: {result['error']}"))

        # 3. Test code with error
        self.stdout.write("\n[Step 3] Test code with error...")
        error_code = """n = int(input())
print(x)  # NameError"""

        result = services.execute_and_judge_submission(
            student=student,
            problem_id=problem.id,
            code_text=error_code
        )

        if result['success']:
            submission = result['submission']
            exec_result = result['execution_result']
            self.stdout.write(self.style.SUCCESS(f"Error submission created: ID={submission.id}"))
            self.stdout.write(f"   Status: {submission.run_status}")
            self.stdout.write(f"   Score: {submission.score}")
            if exec_result['first_error']:
                self.stdout.write(f"   Error type: {exec_result['first_error'].get('error_type')}")
                self.stdout.write(f"   Error message: {exec_result['first_error'].get('error_message')}")
        else:
            self.stdout.write(self.style.ERROR(f"Submission failed: {result['error']}"))

        # 4. Test dangerous code
        self.stdout.write("\n[Step 4] Test dangerous code...")
        dangerous_code = """import os
os.system('dir')"""

        result = services.execute_and_judge_submission(
            student=student,
            problem_id=problem.id,
            code_text=dangerous_code
        )

        if result['success']:
            submission = result['submission']
            self.stdout.write(self.style.SUCCESS(f"Dangerous code blocked: ID={submission.id}"))
            self.stdout.write(f"   Status: {submission.run_status}")
            if submission.error_type:
                self.stdout.write(f"   Error type: {submission.error_type}")
        else:
            self.stdout.write(self.style.ERROR(f"Submission failed: {result['error']}"))

        # 5. Get submission list
        self.stdout.write("\n[Step 5] Get submission list...")
        list_result = services.list_student_submissions(
            student=student,
            page=1,
            page_size=10
        )

        self.stdout.write(self.style.SUCCESS(f"Found {list_result['total']} submissions"))
        for sub in list_result['submissions'][:5]:
            self.stdout.write(f"   - ID {sub.id}: {sub.problem.title} - {sub.run_status} ({sub.score}%)")

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("Test completed!"))
        self.stdout.write("=" * 60)
