"""
教师模块数据模型
定义班级、学生分配、作业等数据结构
"""
from django.db import models
from django.contrib.auth.models import User
from apps.problems.models import Problem
import random
import string


def generate_class_code():
    """生成唯一的班级代码"""
    while True:
        # 生成6位随机字母数字组合
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        # 检查是否已存在
        if not Class.objects.filter(code=code).exists():
            return code


class Class(models.Model):
    """
    班级模型
    用于组织和管理学生
    """

    # 班级名称（必填）
    name = models.CharField(
        max_length=100,
        verbose_name='班级名称',
        help_text='例如：2024级计算机1班'
    )

    # 班级代码（用于学生加入班级）
    code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='班级代码',
        help_text='学生通过此代码加入班级',
        default=generate_class_code
    )

    # 班级描述（可选）
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='班级描述',
        help_text='班级的详细说明'
    )

    # 班主任/任课教师（可选）
    teacher = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='teaching_classes',
        verbose_name='任课教师',
        limit_choices_to={'is_staff': True}
    )

    # 学年（可选）
    academic_year = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='学年',
        help_text='例如：2024-2025'
    )

    # 学期（可选）
    semester = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='学期',
        help_text='例如：第一学期'
    )

    # 是否激活
    is_active = models.BooleanField(
        default=True,
        verbose_name='是否激活',
        help_text='未激活的班级不会在前端显示'
    )

    # 创建时间
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='创建时间'
    )

    # 更新时间
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新时间'
    )

    class Meta:
        db_table = 'class'
        verbose_name = '班级'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['teacher', 'is_active']),
            models.Index(fields=['academic_year', 'semester']),
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return self.name

    @property
    def student_count(self):
        """获取班级学生数量"""
        return self.students.count()


class ClassStudent(models.Model):
    """
    班级学生关联模型
    多对多关系：一个班级可以有多个学生，一个学生可以在多个班级
    """

    # 关联班级
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='students',
        verbose_name='班级'
    )

    # 关联学生
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='enrolled_classes',
        verbose_name='学生',
        limit_choices_to={'is_staff': False}
    )

    # 加入时间
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='加入时间'
    )

    # 备注
    note = models.TextField(
        blank=True,
        null=True,
        verbose_name='备注'
    )

    class Meta:
        db_table = 'class_student'
        verbose_name = '班级学生'
        verbose_name_plural = verbose_name
        ordering = ['joined_at']
        unique_together = [['class_obj', 'student']]  # 同一学生不能重复加入同一班级
        indexes = [
            models.Index(fields=['class_obj', 'student']),
        ]

    def __str__(self):
        return f"{self.class_obj.name} - {self.student.username}"


class Assignment(models.Model):
    """
    作业模型
    教师创建作业，关联题目和班级
    """

    # 作业标题（必填）
    title = models.CharField(
        max_length=200,
        verbose_name='作业标题',
        help_text='作业的简短标题'
    )

    # 作业描述（可选）
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='作业描述',
        help_text='作业的详细说明'
    )

    # 所属班级（必填）
    class_obj = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name='assignments',
        verbose_name='所属班级'
    )

    # 关联题目（多对多）
    problems = models.ManyToManyField(
        Problem,
        related_name='assignments',
        verbose_name='关联题目',
        help_text='作业包含的题目列表'
    )

    # 创建教师（必填）
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_assignments',
        verbose_name='创建教师',
        limit_choices_to={'is_staff': True}
    )

    # 截止时间（可选）
    deadline = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='截止时间',
        help_text='作业提交截止日期'
    )

    # 作业说明（可选）
    instructions = models.TextField(
        blank=True,
        null=True,
        verbose_name='作业说明',
        help_text='详细的作业要求和说明'
    )

    # 是否发布
    is_published = models.BooleanField(
        default=False,
        verbose_name='是否发布',
        help_text='只有发布的作业学生才能看到'
    )

    # 创建时间
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='创建时间'
    )

    # 更新时间
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新时间'
    )

    class Meta:
        db_table = 'assignment'
        verbose_name = '作业'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['class_obj', 'is_published']),
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['deadline']),
        ]

    def __str__(self):
        return f"{self.title} - {self.class_obj.name}"

    @property
    def problem_count(self):
        """获取作业题目数量"""
        return self.problems.count()

    @property
    def is_overdue(self):
        """判断作业是否已过期"""
        if not self.deadline:
            return False
        from django.utils import timezone
        return timezone.now() > self.deadline
