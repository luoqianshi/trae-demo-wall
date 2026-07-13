"""
创建样例数据的管理命令
用于快速初始化测试数据

使用方法:
python manage.py create_sample_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.problems.models import Problem
import json


class Command(BaseCommand):
    help = '创建样例题目和测试用户'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('开始创建样例数据...'))

        # 1. 创建测试用户
        self.create_users()

        # 2. 创建样例题目
        self.create_problems()

        self.stdout.write(self.style.SUCCESS('\n样例数据创建完成！'))
        self.stdout.write(self.style.WARNING('\n测试账号信息:'))
        self.stdout.write('  学生账号: student1 / password123')
        self.stdout.write('  教师账号: teacher1 / password123')

    def create_users(self):
        """创建测试用户"""
        # 创建学生用户
        if not User.objects.filter(username='student1').exists():
            student = User.objects.create_user(
                username='student1',
                email='student1@example.com',
                password='password123',
                first_name='张',
                last_name='三'
            )
            self.stdout.write(f'  ✓ 创建学生用户: {student.username}')
        else:
            self.stdout.write('  - 学生用户已存在: student1')

        # 创建教师用户
        if not User.objects.filter(username='teacher1').exists():
            teacher = User.objects.create_user(
                username='teacher1',
                email='teacher1@example.com',
                password='password123',
                first_name='李',
                last_name='老师',
                is_staff=True
            )
            self.stdout.write(f'  ✓ 创建教师用户: {teacher.username}')
        else:
            self.stdout.write('  - 教师用户已存在: teacher1')

    def create_problems(self):
        """创建样例题目"""
        teacher = User.objects.filter(is_staff=True).first()

        problems_data = [
            {
                'title': '判断偶数',
                'description': '编写一个程序，判断输入的整数是否为偶数。\n\n输入说明：一个整数 n\n\n输出说明：如果 n 是偶数，输出 True；如果 n 是奇数，输出 False',
                'difficulty': 'easy',
                'test_cases': [
                    {'input': '4', 'output': 'True', 'description': '正偶数'},
                    {'input': '7', 'output': 'False', 'description': '正奇数'},
                    {'input': '0', 'output': 'True', 'description': '零是偶数'},
                ]
            },
            {
                'title': '判断闰年',
                'description': '编写一个程序，判断输入的年份是否为闰年。\n\n闰年规则：\n1. 能被4整除但不能被100整除\n2. 能被400整除',
                'difficulty': 'easy',
                'test_cases': [
                    {'input': '2000', 'output': 'True', 'description': '能被400整除'},
                    {'input': '1900', 'output': 'False', 'description': '能被100整除但不能被400整除'},
                    {'input': '2024', 'output': 'True', 'description': '能被4整除'},
                ]
            },
            {
                'title': '计算阶乘',
                'description': '编写一个程序，计算输入整数的阶乘。\n\n阶乘定义：n! = n × (n-1) × ... × 1\n特别地，0! = 1',
                'difficulty': 'medium',
                'test_cases': [
                    {'input': '0', 'output': '1', 'description': '0的阶乘'},
                    {'input': '5', 'output': '120', 'description': '5的阶乘'},
                ]
            },
        ]

        for data in problems_data:
            if Problem.objects.filter(title=data['title']).exists():
                self.stdout.write(f'  - 题目已存在: {data["title"]}')
                continue

            problem = Problem.objects.create(
                title=data['title'],
                description=data['description'],
                difficulty=data['difficulty'],
                test_cases_json=json.dumps(data['test_cases'], ensure_ascii=False),
                created_by=teacher
            )
            self.stdout.write(f'  ✓ 创建题目: {problem.title}')
