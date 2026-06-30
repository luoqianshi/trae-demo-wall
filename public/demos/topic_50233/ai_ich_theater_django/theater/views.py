import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.templatetags.static import static
from .models import Theme, Scene, Choice, CardSummary


def index(request):
    """首页"""
    return render(request, "theater/index.html")


def themes(request):
    """主题选择页"""
    theme_list = Theme.objects.prefetch_related("scenes").all()
    return render(request, "theater/themes.html", {"theme_list": theme_list})


def drama(request, theme_slug):
    """互动短剧页"""
    theme = get_object_or_404(Theme, slug=theme_slug)
    scenes = Scene.objects.filter(theme=theme).order_by("scene_id")
    choices = Choice.objects.filter(scene__theme=theme).select_related("scene").order_by("scene__scene_id", "letter")

    # 构建场景数据（含选项）
    scenes_data = []
    for scene in scenes:
        scene_choices = [c for c in choices if c.scene_id == scene.id]
        scenes_data.append({
            "id": scene.scene_id,
            "title": scene.title,
            "narration": scene.narration,
            "dialogue": scene.dialogue,
            "choices": [
                {"text": c.text, "next": c.next_scene_id, "letter": c.letter}
                for c in scene_choices
            ],
        })

    # 卡片摘要
    card_summaries = {}
    for cs in CardSummary.objects.filter(theme=theme):
        card_summaries[cs.path_key] = cs.summary

    theme_data = {
        "id": theme.slug,
        "name": theme.name,
        "emoji": theme.emoji,
        "tag": theme.tag,
        "desc": theme.desc,
        "duration": theme.duration,
        "image": static(theme.image),
        "cardTitle": theme.card_title,
        "scenes": scenes_data,
        "cardSummary": card_summaries,
    }

    return render(request, "theater/drama.html", {
        "theme": theme,
        "theme_data_json": json.dumps(theme_data, ensure_ascii=False),
    })


def card(request, theme_slug):
    """作品卡片页"""
    theme = get_object_or_404(Theme, slug=theme_slug)
    path_key = request.GET.get("path", "default")
    summary = request.GET.get("summary", "你用自己的方式，走进了这项非遗技艺的世界。")

    return render(request, "theater/card.html", {
        "theme": theme,
        "path_key": path_key,
        "summary": summary,
    })


def about(request):
    """关于页"""
    return render(request, "theater/about.html")


def api_theme_data(request, theme_slug):
    """API: 获取主题完整数据"""
    theme = get_object_or_404(Theme, slug=theme_slug)
    scenes = Scene.objects.filter(theme=theme).order_by("scene_id")
    choices = Choice.objects.filter(scene__theme=theme).select_related("scene").order_by("scene__scene_id", "letter")

    scenes_data = []
    for scene in scenes:
        scene_choices = [c for c in choices if c.scene_id == scene.id]
        scenes_data.append({
            "id": scene.scene_id,
            "title": scene.title,
            "narration": scene.narration,
            "dialogue": scene.dialogue,
            "choices": [
                {"text": c.text, "next": c.next_scene_id, "letter": c.letter}
                for c in scene_choices
            ],
        })

    card_summaries = {}
    for cs in CardSummary.objects.filter(theme=theme):
        card_summaries[cs.path_key] = cs.summary

    return JsonResponse({
        "id": theme.slug,
        "name": theme.name,
        "emoji": theme.emoji,
        "tag": theme.tag,
        "desc": theme.desc,
        "duration": theme.duration,
        "image": static(theme.image),
        "cardTitle": theme.card_title,
        "scenes": scenes_data,
        "cardSummary": card_summaries,
    })