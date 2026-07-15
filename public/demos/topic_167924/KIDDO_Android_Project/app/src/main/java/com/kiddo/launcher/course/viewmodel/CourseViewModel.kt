package com.kiddo.launcher.course.viewmodel

import androidx.lifecycle.ViewModel
import com.kiddo.launcher.course.model.CourseEvent
import com.kiddo.launcher.course.model.CourseUiState
import com.kiddo.launcher.course.repository.CourseRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class CourseViewModel : ViewModel() {
    private val repository = CourseRepository()

    private val _uiState = MutableStateFlow(repository.loadCourses())
    val uiState: StateFlow<CourseUiState> = _uiState.asStateFlow()

    fun onEvent(event: CourseEvent) {
        when (event) {
            is CourseEvent.ToggleChapter -> {
                _uiState.update { state ->
                    state.copy(
                        chapters = state.chapters.map { chapter ->
                            if (chapter.id == event.chapterId) {
                                chapter.copy(expanded = !chapter.expanded)
                            } else {
                                chapter
                            }
                        },
                    )
                }
            }
            is CourseEvent.SelectCourse -> {
                _uiState.update { it.copy(selectedCourseId = event.courseId) }
            }
            is CourseEvent.StartCourse -> {
                _uiState.update {
                    it.copy(
                        selectedCourseId = event.courseId,
                        isVideoMode = true,
                    )
                }
            }
            CourseEvent.BackToCourseList -> {
                _uiState.update { it.copy(isVideoMode = false) }
            }
        }
    }
}
