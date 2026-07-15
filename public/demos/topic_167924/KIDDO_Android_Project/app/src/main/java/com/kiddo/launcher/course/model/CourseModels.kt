package com.kiddo.launcher.course.model

import androidx.annotation.DrawableRes

data class CourseChapter(
    val id: String,
    val title: String,
    val subtitle: String,
    val expanded: Boolean = true,
)

data class KiddoCourse(
    val id: String,
    val chapterId: String,
    val title: String,
    val subtitle: String,
    val difficulty: String,
    val studyTimeMinutes: Int,
    val completionRate: Int,
    val rewardPoints: Int,
    val introduction: String,
    val aiRecommendation: String,
    @DrawableRes val coverRes: Int,
)

data class CourseUiState(
    val chapters: List<CourseChapter> = emptyList(),
    val courses: List<KiddoCourse> = emptyList(),
    val selectedCourseId: String = "",
    val isVideoMode: Boolean = false,
)

sealed interface CourseEvent {
    data class ToggleChapter(val chapterId: String) : CourseEvent
    data class SelectCourse(val courseId: String) : CourseEvent
    data class StartCourse(val courseId: String) : CourseEvent
    data object BackToCourseList : CourseEvent
}
