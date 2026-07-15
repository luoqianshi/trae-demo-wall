package com.kiddo.launcher.study.model

import androidx.annotation.DrawableRes

data class StudyStage(
    val id: String,
    val title: String,
    val subtitle: String,
    val learnerCount: String,
    val completionRate: Int,
    val buttonText: String,
    @DrawableRes val imageRes: Int,
)

data class StudySubject(
    val id: String,
    val title: String,
    val shortName: String,
)

data class StudyStat(
    val title: String,
    val value: String,
    val description: String,
)

data class AiCourseRecommendation(
    val title: String,
    val description: String,
    val tag: String,
    val progress: Float,
)

data class RecentStudyItem(
    val title: String,
    val description: String,
    val type: String,
    val progress: Float,
)

data class StudyHomeUiState(
    val studentName: String = "小奇同学",
    val level: String = "等级 12",
    val selectedNavItem: String = "学习中心",
    val stats: List<StudyStat> = emptyList(),
    val stages: List<StudyStage> = emptyList(),
    val subjects: List<StudySubject> = emptyList(),
    val recommendations: List<AiCourseRecommendation> = emptyList(),
    val recentItems: List<RecentStudyItem> = emptyList(),
)

sealed interface StudyHomeEvent {
    data class SelectNav(val title: String) : StudyHomeEvent
    data class SelectStage(val id: String) : StudyHomeEvent
    data class StartStage(val id: String) : StudyHomeEvent
    data class SelectSubject(val id: String) : StudyHomeEvent
    data class SelectRecommendation(val title: String) : StudyHomeEvent
    data class SelectRecent(val title: String) : StudyHomeEvent
}
