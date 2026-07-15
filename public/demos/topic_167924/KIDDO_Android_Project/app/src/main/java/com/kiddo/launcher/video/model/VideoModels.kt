package com.kiddo.launcher.video.model

data class VideoPlayerUiState(
    val courseTitle: String = "分数乘法动画课",
    val chapterTitle: String = "第一章 分数乘法 · 第 1 节",
    val progress: Float = 0.18f,
    val playbackSpeed: Float = 1.0f,
    val subtitlesEnabled: Boolean = true,
    val notesCount: Int = 2,
    val favorite: Boolean = false,
    val isPlaying: Boolean = true,
    val showAiQuestion: Boolean = false,
    val aiQuestion: String = "如果 2/3 个披萨再取其中的 1/2，最后是多少个完整披萨？",
    val aiPauseProgress: Float = 0.38f,
    val questionTriggered: Boolean = false,
)
