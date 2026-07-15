package com.kiddo.launcher.video.viewmodel

import androidx.lifecycle.ViewModel
import com.kiddo.launcher.video.model.VideoPlayerUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlin.random.Random

class VideoPlayerViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(
        VideoPlayerUiState(
            aiPauseProgress = Random.nextFloat().coerceIn(0.30f, 0.68f),
        ),
    )
    val uiState: StateFlow<VideoPlayerUiState> = _uiState.asStateFlow()

    fun onPlaybackTick() {
        _uiState.update { state ->
            if (!state.isPlaying || state.showAiQuestion || state.progress >= 1f) {
                state
            } else {
                val nextProgress = (state.progress + 0.012f * state.playbackSpeed).coerceAtMost(1f)
                if (!state.questionTriggered && nextProgress >= state.aiPauseProgress) {
                    state.copy(
                        progress = nextProgress,
                        isPlaying = false,
                        showAiQuestion = true,
                        questionTriggered = true,
                    )
                } else {
                    state.copy(progress = nextProgress)
                }
            }
        }
    }

    fun togglePlay() {
        _uiState.update { it.copy(isPlaying = !it.isPlaying, showAiQuestion = false) }
    }

    fun cycleSpeed() {
        _uiState.update { state ->
            val nextSpeed = when (state.playbackSpeed) {
                1.0f -> 1.25f
                1.25f -> 1.5f
                else -> 1.0f
            }
            state.copy(playbackSpeed = nextSpeed)
        }
    }

    fun toggleSubtitles() {
        _uiState.update { it.copy(subtitlesEnabled = !it.subtitlesEnabled) }
    }

    fun addNote() {
        _uiState.update { it.copy(notesCount = it.notesCount + 1) }
    }

    fun toggleFavorite() {
        _uiState.update { it.copy(favorite = !it.favorite) }
    }

    fun dismissAiQuestion() {
        _uiState.update { it.copy(showAiQuestion = false, isPlaying = true) }
    }

    fun pauseForAssistant() {
        _uiState.update { it.copy(isPlaying = false) }
    }

    fun resumeFromAssistant() {
        _uiState.update { it.copy(isPlaying = true) }
    }
}
