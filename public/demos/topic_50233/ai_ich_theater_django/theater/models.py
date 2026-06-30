from django.db import models


class Theme(models.Model):
    """非遗主题"""
    slug = models.CharField(max_length=50, unique=True, verbose_name="标识符")
    name = models.CharField(max_length=50, verbose_name="名称")
    emoji = models.CharField(max_length=10, verbose_name="图标")
    tag = models.CharField(max_length=50, verbose_name="标签")
    desc = models.TextField(verbose_name="描述")
    duration = models.CharField(max_length=20, verbose_name="时长")
    image = models.CharField(max_length=100, verbose_name="图片路径")
    card_title = models.CharField(max_length=100, verbose_name="卡片标题")
    order = models.IntegerField(default=0, verbose_name="排序")

    class Meta:
        verbose_name = "非遗主题"
        verbose_name_plural = "非遗主题"
        ordering = ["order"]

    def __str__(self):
        return f"{self.emoji} {self.name}"


class Scene(models.Model):
    """剧情场景"""
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name="scenes", verbose_name="所属主题")
    scene_id = models.IntegerField(verbose_name="场景编号")
    title = models.CharField(max_length=100, verbose_name="标题")
    narration = models.TextField(verbose_name="旁白")
    dialogue = models.TextField(verbose_name="对话")

    class Meta:
        verbose_name = "剧情场景"
        verbose_name_plural = "剧情场景"
        ordering = ["theme", "scene_id"]
        unique_together = ["theme", "scene_id"]

    def __str__(self):
        return f"{self.theme.name} - {self.title}"


class Choice(models.Model):
    """分支选项"""
    scene = models.ForeignKey(Scene, on_delete=models.CASCADE, related_name="choices", verbose_name="所属场景")
    text = models.CharField(max_length=200, verbose_name="选项文本")
    next_scene_id = models.IntegerField(verbose_name="下一场景编号")
    letter = models.CharField(max_length=1, verbose_name="选项字母")

    class Meta:
        verbose_name = "分支选项"
        verbose_name_plural = "分支选项"
        ordering = ["scene", "letter"]

    def __str__(self):
        return f"{self.scene.title} → [{self.letter}] {self.text[:30]}"


class CardSummary(models.Model):
    """作品卡片摘要"""
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE, related_name="card_summaries", verbose_name="所属主题")
    path_key = models.CharField(max_length=10, verbose_name="路径键")
    summary = models.TextField(verbose_name="摘要文本")

    class Meta:
        verbose_name = "卡片摘要"
        verbose_name_plural = "卡片摘要"
        unique_together = ["theme", "path_key"]

    def __str__(self):
        return f"{self.theme.name} - {self.path_key}"