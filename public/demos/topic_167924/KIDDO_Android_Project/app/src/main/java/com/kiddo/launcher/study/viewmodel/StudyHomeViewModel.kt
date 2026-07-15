package com.kiddo.launcher.study.viewmodel

import androidx.lifecycle.ViewModel
import com.kiddo.launcher.study.model.StudyHomeEvent
import com.kiddo.launcher.study.model.StudyHomeUiState
import com.kiddo.launcher.study.repository.StudyRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class StudyHomeViewModel : ViewModel() {
    private val repository = StudyRepository()

    private val _uiState = MutableStateFlow(repository.loadStudyHome())
    val uiState: StateFlow<StudyHomeUiState> = _uiState.asStateFlow()

    fun onEvent(event: StudyHomeEvent) {
        when (event) {
            is StudyHomeEvent.SelectNav -> {
                _uiState.update { it.copy(selectedNavItem = event.title) }
                println("TODO: open study nav ${event.title}")
            }
            is StudyHomeEvent.SelectStage -> println("TODO: select stage ${event.id}")
            is StudyHomeEvent.StartStage -> println("TODO: start stage ${event.id}")
            is StudyHomeEvent.SelectSubject -> println("TODO: open subject ${event.id}")
            is StudyHomeEvent.SelectRecommendation -> println("TODO: open recommendation ${event.title}")
            is StudyHomeEvent.SelectRecent -> println("TODO: open recent ${event.title}")
        }
    }
}
