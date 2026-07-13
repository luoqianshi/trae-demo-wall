"""
题目管理模块数据模型
定义编程题目的数据结构，包含测试用例
"""
import json
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Problem(models.Model):
    """
    编程题目模型
    存储题目标题、描述、难度、测试用例等信息
    合并了原作业（Assignment）的功能
    """

    # 难度选择
    DIFFICULTY_CHOICES = [
        ('easy', '简单'),
        ('medium', '中等'),
        ('hard', '困难'),
    ]

    # 题目标题（必填）
    title = models.CharField(
        max_length=200,
        verbose_name='题目标题',
        help_text='题目的简短标题'
    )

    # 题目描述（必填）
    description = models.TextField(
        verbose_name='题目描述',
        help_text='详细的题目要求和说明'
    )

    # 难度等级（必填）
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        default='easy',
        verbose_name='难度等级',
        db_index=True  # 添加索引，便于按难度筛选
    )

    # 测试用例（JSON格式存储为文本）
    # 格式：[{"input": "5", "output": "True", "description": "测试说明"}]
    # 使用TextField存储JSON字符串，兼容所有SQLite版本
    # Django 4.2的JSONField在Windows SQLite上可能不支持，使用TextField更稳定
    test_cases_json = models.TextField(
        default='[]',
        verbose_name='测试用例',
        help_text='JSON格式的测试用例列表'
    )

    # 创建者（教师）
    # SET_NULL: 教师删除后题目保留，但创建者设为NULL
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_problems',
        verbose_name='创建者'
    )

    # 所属班级（可选，多对多关系）
    # 如果为空，表示公共题目（所有学生可见）
    # 如果指定班级，只有该班级学生可见
    classes = models.ManyToManyField(
        'teacher.Class',
        related_name='problems',
        blank=True,
        verbose_name='所属班级',
        help_text='指定哪些班级可以看到此题目，留空表示所有学生可见'
    )

    # 截止时间（可选）
    deadline = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='截止时间',
        help_text='题目提交截止日期'
    )

    # 题目说明（可选）
    instructions = models.TextField(
        blank=True,
        null=True,
        verbose_name='题目说明',
        help_text='详细的题目要求和说明'
    )

    # 是否发布
    is_published = models.BooleanField(
        default=True,
        verbose_name='是否发布',
        help_text='只有发布的题目学生才能看到'
    )

    # LLM 逻辑正确时的加分幅度（百分比）
    llm_logic_bonus = models.IntegerField(
        default=30,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='LLM 逻辑加分（百分比）',
        help_text='当 LLM 判定逻辑正确时，在原始得分上额外加分的幅度，不超过 100'
    )

    # 创建时间（自动设置）
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='创建时间',
        db_index=True  # 添加索引，便于按时间排序
    )

    # 更新时间（自动更新）
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新时间'
    )

    class Meta:
        db_table = 'problem'
        verbose_name = '编程题目'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']  # 默认按创建时间倒序
        indexes = [
            # 组合索引：难度 + 创建时间
            models.Index(fields=['difficulty', '-created_at']),
            models.Index(fields=['is_published', '-created_at']),
            models.Index(fields=['deadline']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_difficulty_display()})"

    @property
    def test_cases(self):
        """获取测试用例列表（自动解析JSON）"""
        try:
            data = json.loads(self.test_cases_json) if self.test_cases_json else []
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                return [data]
            return []
        except (json.JSONDecodeError, TypeError, ValueError):
            return []

    @test_cases.setter
    def test_cases(self, value):
        """设置测试用例列表（自动转换为JSON）"""
        self.test_cases_json = json.dumps(value, ensure_ascii=False)

    @property
    def test_cases_count(self):
        """获取测试用例数量"""
        return len(self.test_cases)

    @property
    def is_overdue(self):
        """判断题目是否已过期"""
        if not self.deadline:
            return False
        from django.utils import timezone
        return timezone.now() > self.deadline

    @property
    def class_names(self):
        """获取所属班级名称列表"""
        return [c.name for c in self.classes.all()]

    def get_test_cases(self):
        """获取测试用例列表"""
        return self.test_cases

    def add_test_case(self, input_data, output_data, description=''):
        """添加测试用例"""
        cases = self.test_cases
        cases.append({
            'input': input_data,
            'output': output_data,
            'description': description
        })
        self.test_cases = cases
        self.save()
