package com.kiddo.launcher.question.viewmodel

import androidx.lifecycle.ViewModel
import com.kiddo.launcher.question.model.AnswerResult
import com.kiddo.launcher.question.model.QuestionBank
import com.kiddo.launcher.question.model.QuestionItem
import com.kiddo.launcher.question.model.QuestionType
import com.kiddo.launcher.question.model.QuestionUiState
import com.kiddo.launcher.wrongbook.WrongBookRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class QuestionViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(
        QuestionUiState(unresolvedWrongCount = WrongBookRepository.unresolvedCount()),
    )
    val uiState: StateFlow<QuestionUiState> = _uiState.asStateFlow()

    fun selectType(type: QuestionType) {
        _uiState.value = QuestionUiState(
            current = QuestionBank.firstOf(type),
            selectedType = type,
            unresolvedWrongCount = WrongBookRepository.unresolvedCount(),
        )
    }

    fun updateAnswer(answer: String) {
        _uiState.update {
            it.copy(
                answerInput = answer,
                result = AnswerResult.Idle,
                aiAnalysisVisible = false,
            )
        }
    }

    fun submitAnswer() {
        _uiState.update { state ->
            val normalizedInput = normalize(state.answerInput)
            val normalizedAnswer = normalize(state.current.answer)
            val correct = normalizedInput == normalizedAnswer

            when {
                correct && !state.usedAiHelp -> {
                    WrongBookRepository.submitIndependentAnswer(state.current.id, state.answerInput)
                    state.copy(
                        result = AnswerResult.Correct,
                        aiTip = "独立完成，很棒！如果这题曾进入错题本，系统会把它推进到下一道变式挑战。",
                        unresolvedWrongCount = WrongBookRepository.unresolvedCount(),
                    )
                }
                correct && state.usedAiHelp -> {
                    val nextRound = state.similarRound + 1
                    val similar = QuestionBank.similarFrom(state.current, nextRound)
                    recordWrong(state.current, state.answerInput, "使用 AI 帮助后答对，需要重新独立完成同类题。")
                    WrongBookRepository.requestAiHelp(state.current.id)
                    state.copy(
                        current = similar,
                        answerInput = "",
                        result = AnswerResult.AiAssistedNeedsPractice,
                        aiAnalysisVisible = true,
                        usedAiHelp = false,
                        similarRound = nextRound,
                        aiTip = "这次用过 AI，不算独立掌握。我已经生成同类题，独立答对后才会推进错题本任务。",
                        unresolvedWrongCount = WrongBookRepository.unresolvedCount(),
                    )
                }
                else -> {
                    recordWrong(state.current, state.answerInput, state.current.explanation)
                    state.copy(
                        result = AnswerResult.Wrong,
                        aiAnalysisVisible = true,
                        usedAiHelp = true,
                        aiTip = "这道题已写入错题本任务。系统会要求原题重做、变式题和综合题连续独立完成，未解决前娱乐区保持锁定。",
                        unresolvedWrongCount = WrongBookRepository.unresolvedCount(),
                    )
                }
            }
        }
    }

    fun askAiAnalysis() {
        val current = _uiState.value.current
        WrongBookRepository.requestAiHelp(current.id)
        _uiState.update {
            it.copy(
                aiAnalysisVisible = true,
                usedAiHelp = true,
                aiTip = "AI 引导：先找关键词，再写第一步算式。注意，使用 AI 后会重新生成练习题，需要之后独立完成。",
                unresolvedWrongCount = WrongBookRepository.unresolvedCount(),
            )
        }
    }

    fun generateSimilarQuestion() {
        _uiState.update { state ->
            val nextRound = state.similarRound + 1
            val similar = QuestionBank.similarFrom(state.current, nextRound)
            state.copy(
                current = similar,
                answerInput = "",
                result = AnswerResult.Idle,
                aiAnalysisVisible = false,
                usedAiHelp = false,
                similarRound = nextRound,
                aiTip = "已生成同类题。这次请独立完成，答对后错题本才会继续推进掌握链。",
                unresolvedWrongCount = WrongBookRepository.unresolvedCount(),
            )
        }
    }

    private fun recordWrong(question: QuestionItem, answer: String, reason: String) {
        WrongBookRepository.recordWrongQuestion(
            questionId = question.id,
            title = question.prompt,
            reason = reason,
            userWrongAnswer = answer.ifBlank { "未作答" },
            correctAnswer = question.answer,
            knowledgePoint = knowledgePointFor(question),
            difficulty = difficultyFor(question.type),
            sourceCourse = "视频学习 · AI 随堂练习",
        )
    }

    private fun knowledgePointFor(question: QuestionItem): String = when {
        question.prompt.contains("分数") || question.prompt.contains("/") -> "分数乘法"
        question.prompt.contains("面积") -> "长方形面积"
        else -> "${question.type.title}核心知识点"
    }

    private fun difficultyFor(type: QuestionType): String = when (type) {
        QuestionType.Choice -> "基础"
        QuestionType.TrueFalse -> "基础"
        QuestionType.FillBlank -> "进阶"
        QuestionType.Calculation -> "挑战"
    }

    private fun normalize(value: String): String = value
        .trim()
        .replace(" ", "")
        .replace("（", "(")
        .replace("）", ")")
        .lowercase()
}
