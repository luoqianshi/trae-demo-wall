"""
诊断模块数据模型
记录LLM诊断结果和缓存信息
"""
import json
from django.db import models
from django.contrib.auth.models import User
from apps.problems.models import Problem
from apps.submissions.models import Submission
import hashlib


class DiagnosisRecord(models.Model):
    """
    诊断记录模型
    存储LLM诊断结果、来源、延迟等信息
    """

    # 诊断状态选择
    STATUS_CHOICES = [
        ('pending', '待诊断'),
        ('processing', '诊断中'),
        ('success', '成功'),
        ('fallback', '降级'),
        ('failed', '失败'),
    ]

    # 诊断来源选择
    SOURCE_CHOICES = [
        ('llm', 'LLM生成'),
        ('template', '规则模板'),
        ('cache', '缓存命中'),
    ]

    # 关联提交记录（必填）
    # CASCADE: 提交删除时，诊断记录也删除
    submission = models.ForeignKey(
        Submission,
        on_delete=models.CASCADE,
        related_name='diagnoses',
        verbose_name='关联提交'
    )

    # 关联题目（必填）
    # PROTECT: 题目被删除前，必须先删除所有诊断记录
    problem = models.ForeignKey(
        Problem,
        on_delete=models.PROTECT,
        related_name='diagnoses',
        verbose_name='关联题目'
    )

    # 关联学生（必填）
    # CASCADE: 学生删除时，诊断记录也删除
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='diagnoses',
        verbose_name='关联学生'
    )

    # 代码哈希值（用于缓存）
    # 使用MD5或SHA256，长度64字符足够
    code_hash = models.CharField(
        max_length=64,
        verbose_name='代码哈希',
        help_text='用于诊断缓存的代码哈希值',
        db_index=True  # 添加索引，便于缓存查询
    )

    # 错误类型（可选）
    error_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='错误类型',
        help_text='Python错误类型（如NameError）'
    )

    # 诊断状态（必填）
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='诊断状态',
        db_index=True
    )

    # 诊断内容（必填）
    diagnosis_text = models.TextField(
        verbose_name='诊断内容',
        help_text='LLM或模板生成的诊断建议'
    )

    # 诊断来源（必填）
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default='template',
        verbose_name='诊断来源',
        db_index=True  # 添加索引，便于统计分析
    )

    # LLM提供商（可选）
    provider = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='LLM提供商',
        help_text='如ollama、openai等'
    )

    # 模型名称（可选）
    model_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='模型名称',
        help_text='如qwen2.5-coder:7b'
    )

    # Prompt版本号（可选）
    prompt_version = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Prompt版本',
        help_text='用于论文实验复现'
    )

    # Schema版本号（可选）
    schema_version = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Schema版本',
        help_text='诊断输出结构版本'
    )

    # 响应延迟（毫秒）
    latency_ms = models.IntegerField(
        default=0,
        verbose_name='响应延迟(ms)',
        help_text='诊断生成耗时（毫秒）'  )

    # 错误信息（可选）
    error_message = models.TextField(
        blank=True,
        null=True,
        verbose_name='错误信息',
        help_text='诊断失败时的错误信息'
    )

    # 结构化诊断数据（JSON格式存储为文本）
    # 格式：{"root_cause": "...", "fix_suggestions": [...], "knowledge_points": [...], ...}
    diagnosis_payload = models.TextField(
        blank=True,
        null=True,
        verbose_name='结构化诊断数据',
        help_text='JSON格式的结构化诊断结果'
    )

    # 创建时间（自动设置）
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='创建时间',
        db_index=True  # 添加索引，便于按时间排序
    )

    class Meta:
        db_table = 'diagnosis_record'
        verbose_name = '诊断记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']  # 默认按创建时间倒序
        indexes = [
            # 组合索引：题目 + 错误类型 + 创建时间（统计常见错误）
            models.Index(fields=['problem', 'error_type', '-created_at']),
            # 组合索引：学生 + 题目（查询学生某题的诊断历史）
            models.Index(fields=['student', 'problem', '-created_at']),
            # 组合索引：代码哈希 + 错误类型（缓存查询）
            models.Index(fields=['code_hash', 'error_type']),
        ]

    def __str__(self):
        return f"{self.student.username} - {self.problem.title} ({self.get_source_display()})"

    @property
    def is_from_llm(self):
        """判断是否来自LLM"""
        return self.source == 'llm'

    @property
    def is_from_cache(self):
        """判断是否来自缓存"""
        return self.source == 'cache'

    @property
    def is_from_template(self):
        """判断是否来自模板"""
        return self.source == 'template'

    @property
    def is_success(self):
        """判断诊断是否成功"""
        return self.status == 'success'

    @property
    def is_fallback(self):
        """判断是否降级"""
        return self.status == 'fallback'

    @property
    def diagnosis_data(self):
        """获取结构化诊断数据（自动解析JSON）"""
        if not self.diagnosis_payload:
            return {}
        try:
            return json.loads(self.diagnosis_payload)
        except json.JSONDecodeError:
            return {}

    @diagnosis_data.setter
    def diagnosis_data(self, value):
        """设置结构化诊断数据（自动转换为JSON）"""
        if value:
            self.diagnosis_payload = json.dumps(value, ensure_ascii=False)
        else:
            self.diagnosis_payload = None

    @staticmethod
    def generate_code_hash(code_text, error_type=''):
        """
        生成代码哈希值
        使用SHA256算法，结合代码和错误类型
        """
        content = f"{code_text}:{error_type}"
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    @classmethod
    def find_cached_diagnosis(cls, code_hash, error_type):
        """
        查找缓存的诊断记录
        返回最近的一条匹配记录
        """
        return cls.objects.filter(
            code_hash=code_hash,
            error_type=error_type
        ).order_by('-created_at').first()

    def get_diagnosis_preview(self, max_length=100):
        """获取诊断内容预览（前N个字符）"""
        if len(self.diagnosis_text) <= max_length:
            return self.diagnosis_text
        return self.diagnosis_text[:max_length] + '...'
