package com.kiddo.launcher.wrongbook

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class WrongBookViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(
        WrongBookUiState(
            quests = WrongBookRepository.items.value,
            selectedQuest = WrongBookRepository.items.value.firstOrNull(),
            entertainmentLocked = WrongBookRepository.entertainmentLocked(),
        ),
    )
    val uiState: StateFlow<WrongBookUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            WrongBookRepository.items.collect { quests ->
                _uiState.update { state ->
                    val selected = state.selectedQuest?.let { current ->
                        quests.firstOrNull { it.id == current.id }
                    } ?: quests.firstOrNull { it.subject == state.selectedSubject } ?: quests.firstOrNull()
                    state.copy(
                        quests = quests,
                        selectedQuest = selected,
                        entertainmentLocked = WrongBookRepository.entertainmentLocked(),
                    )
                }
            }
        }
    }

    fun selectSubject(subject: WrongSubject) {
        _uiState.update { state ->
            state.copy(
                selectedSubject = subject,
                selectedQuest = state.quests.firstOrNull { it.subject == subject },
                answerInput = "",
                lastAnswerCorrect = null,
                completionCelebration = false,
            )
        }
    }

    fun openQuest(questId: String) {
        _uiState.update { state ->
            state.copy(
                selectedQuest = state.quests.firstOrNull { it.id == questId },
                answerInput = "",
                lastAnswerCorrect = null,
                showFullAnalysis = false,
                completionCelebration = false,
                aiGuideMessage = "我们先看题目条件，不急着猜答案。你觉得第一步应该怎么算？",
            )
        }
    }

    fun updateAnswer(answer: String) {
        _uiState.update {
            it.copy(answerInput = answer, lastAnswerCorrect = null, completionCelebration = false)
        }
    }

    fun dismissCompletionCelebration() {
        _uiState.update { it.copy(completionCelebration = false) }
    }

    fun submitPracticeAnswer() {
        val quest = _uiState.value.selectedQuest ?: return
        val answer = _uiState.value.answerInput
        val correct = WrongBookRepository.submitIndependentAnswer(quest.id, answer)
        val updated = WrongBookRepository.items.value.firstOrNull { it.id == quest.id }
        _uiState.update { state ->
            state.copy(
                selectedQuest = updated,
                answerInput = "",
                lastAnswerCorrect = correct,
                completionCelebration = correct && updated?.status == WrongQuestStatus.MASTERED,
                aiGuideMessage = if (correct) {
                    if (updated?.status == WrongQuestStatus.MASTERED) {
                        "连续独立完成多个变式，知识点已掌握。娱乐权限恢复一部分，AI伙伴也获得成长经验。"
                    } else {
                        "这一步是独立完成的。系统已经生成下一道变式题，继续保持不看提示。"
                    }
                } else {
                    "这次还没有稳定掌握。掌握率会回退一点，我已经换一道同知识点题，请重新挑战。"
                },
            )
        }
    }

    fun requestAiHint() {
        val quest = _uiState.value.selectedQuest ?: return
        WrongBookRepository.requestAiHelp(quest.id)
        val updated = WrongBookRepository.items.value.firstOrNull { it.id == quest.id }
        _uiState.update { state ->
            state.copy(
                selectedQuest = updated,
                answerInput = "",
                showFullAnalysis = false,
                lastAnswerCorrect = null,
                completionCelebration = false,
                aiGuideMessage = "提示已记录。本轮不算独立掌握，我给你换一道同知识点题：先说出已知条件，再写第一步。",
            )
        }
    }

    fun explainKnowledge() {
        val quest = _uiState.value.selectedQuest ?: return
        WrongBookRepository.requestAiHelp(quest.id)
        val updated = WrongBookRepository.items.value.firstOrNull { it.id == quest.id }
        _uiState.update { state ->
            state.copy(
                selectedQuest = updated,
                showFullAnalysis = false,
                aiGuideMessage = "知识讲解：${quest.knowledgeIntro} 现在请你自己判断：题目是在求部分、求整体，还是做比较？",
            )
        }
    }

    fun analyzeReason() {
        val quest = _uiState.value.selectedQuest ?: return
        WrongBookRepository.requestAiHelp(quest.id)
        val updated = WrongBookRepository.items.value.firstOrNull { it.id == quest.id }
        _uiState.update { state ->
            state.copy(
                selectedQuest = updated,
                showFullAnalysis = false,
                aiGuideMessage = "错因分析：这道题容易把公式或关键词混在一起。我们先只做第一步：把题干变成算式。",
            )
        }
    }

    fun transferPractice() {
        val quest = _uiState.value.selectedQuest ?: return
        WrongBookRepository.requestAiHelp(quest.id)
        val updated = WrongBookRepository.items.value.firstOrNull { it.id == quest.id }
        _uiState.update { state ->
            state.copy(
                selectedQuest = updated,
                answerInput = "",
                showFullAnalysis = false,
                aiGuideMessage = "举一反三题已生成。注意：用过 AI 后，必须重新独立连续完成后才算掌握。",
            )
        }
    }

    fun revealAnswer() {
        val quest = _uiState.value.selectedQuest ?: return
        WrongBookRepository.revealAnswer(quest.id)
        val updated = WrongBookRepository.items.value.firstOrNull { it.id == quest.id }
        _uiState.update { state ->
            state.copy(
                selectedQuest = updated,
                showFullAnalysis = true,
                aiGuideMessage = "已查看完整解析，AI帮助次数 +1。系统会换题，直到你独立完成整条挑战链。",
            )
        }
    }
}
