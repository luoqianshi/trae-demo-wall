"""
提交与评测模块数据模型
记录学生代码提交和运行结果
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.problems.models import Problem


class Submission(models.Model):
    """
    代码提交记录模型
    存储学生提交的代码、运行状态、错误信息等
    """

    # 运行状态选择
    RUN_STATUS_CHOICES = [
        ('pending', '待运行'),
        ('success', '运行成功'),
        ('fail', '测试失败'),
        ('error', '运行错误'),
    ]

    # 提交学生（必填）
    # CASCADE: 学生删除时，提交记录也删除
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='submissions',
        verbose_name='提交学生'
    )

    # 关联题目（必填）
    # PROTECT: 题目被删除前，必须先删除所有提交记录（保护历史数据）
    problem = models.ForeignKey(
        Problem,
        on_delete=models.PROTECT,
        related_name='submissions',
        verbose_name='关联题目'
    )

    # 提交的代码（必填）
    code_text = models.TextField(
        verbose_name='提交代码',
        help_text='学生提交的Python代码'
    )

    # 运行状态（必填）
    run_status = models.CharField(
        max_length=20,
        choices=RUN_STATUS_CHOICES,
        default='pending',
        verbose_name='运行状态',
        db_index=True  # 添加索引，便于按状态筛选
    )

    # 得分（0-100）
    score = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='得分',
        help_text='测试用例通过率得分（0-100）'
    )

    # 标准输出（可选）
    stdout_text = models.TextField(
        blank=True,
        null=True,
        verbose_name='标准输出',
        help_text='程序运行的标准输出内容'
    )

    # 错误类型（可选）
    # 如：NameError, SyntaxError, IndentationError等
    error_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='错误类型',
        help_text='Python错误类型（如NameError）'
    )

    # 错误堆栈（可选）
    error_trace = models.TextField(
        blank=True,
        null=True,
        verbose_name='错误堆栈',
        help_text='完整的错误堆栈信息'
    )

    # 教师评分（可选，0-100）
    teacher_score = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='教师评分',
        help_text='教师给出的评分（0-100）'
    )

    # 教师评语（可选）
    teacher_comment = models.TextField(
        blank=True,
        default='',
        verbose_name='教师评语',
        help_text='教师对代码的评价和建议'
    )

    # 提交时间（自动设置）
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='提交时间',
        db_index=True  # 添加索引，便于按时间排序
    )

    class Meta:
        db_table = 'submission'
        verbose_name = '代码提交记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']  # 默认按提交时间倒序
        indexes = [
            # 组合索引：学生 + 题目 + 提交时间（常用查询路径）
            models.Index(fields=['student', 'problem', '-created_at']),
            # 组合索引：题目 + 运行状态（教师查看题目提交情况）
            models.Index(fields=['problem', 'run_status']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.problem.title} ({self.get_run_status_display()})"

    @property
    def is_success(self):
        """判断是否运行成功"""
        return self.run_status == 'success'

    @property
    def is_fail(self):
        """判断是否测试失败"""
        return self.run_status == 'fail'

    @property
    def is_error(self):
        """判断是否运行错误"""
        return self.run_status == 'error'

    @property
    def has_error(self):
        """判断是否有错误信息"""
        return bool(self.error_type or self.error_trace)

    def get_code_preview(self, max_length=100):
        """获取代码预览（前N个字符）"""
        if len(self.code_text) <= max_length:
            return self.code_text
        return self.code_text[:max_length] + '...'
