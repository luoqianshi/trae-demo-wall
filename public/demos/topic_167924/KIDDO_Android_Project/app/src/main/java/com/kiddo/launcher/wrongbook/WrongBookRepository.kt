package com.kiddo.launcher.wrongbook

import com.kiddo.launcher.aipartner.PartnerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

object WrongBookRepository {
    private val _items = MutableStateFlow(seedQuests())
    val items: StateFlow<List<WrongItem>> = _items.asStateFlow()

    fun recordWrongQuestion(
        questionId: String,
        title: String,
        reason: String,
        userWrongAnswer: String = "未记录",
        correctAnswer: String = "待核对",
        knowledgePoint: String = "分数乘法",
        difficulty: String = "基础",
        sourceCourse: String = "AI 随堂练习",
        subject: WrongSubject = WrongSubject.Math,
    ) {
        _items.update { current ->
            val existing = current.firstOrNull { it.id == questionId }
            if (existing == null) {
                val original = PracticeGenerator.originalFor(questionId, title, correctAnswer, reason)
                current + WrongItem(
                    id = questionId,
                    originalQuestion = title,
                    userWrongAnswer = userWrongAnswer,
                    correctAnswer = correctAnswer,
                    knowledgePoint = knowledgePoint,
                    knowledgeIntro = introFor(knowledgePoint),
                    difficulty = difficulty,
                    sourceCourse = sourceCourse,
                    wrongReason = reason,
                    wrongTime = System.currentTimeMillis(),
                    aiHelpCount = 0,
                    masteryRate = MasteryCalculator.initialMastery(),
                    challengeCount = 0,
                    wrongCount = 1,
                    subject = subject,
                    status = WrongQuestStatus.NEW,
                    currentStage = ChallengeStage.Original,
                    currentPractice = original,
                    completedIndependentStages = emptySet(),
                    lastPracticeTime = null,
                )
            } else {
                current.map { item ->
                    if (item.id == questionId) {
                        val mastery = MasteryCalculator.masteryAfterWrong(item.masteryRate)
                        item.copy(
                            userWrongAnswer = userWrongAnswer,
                            wrongReason = reason,
                            wrongTime = System.currentTimeMillis(),
                            wrongCount = item.wrongCount + 1,
                            masteryRate = mastery,
                            status = MasteryCalculator.statusFor(mastery),
                            completedIndependentStages = item.completedIndependentStages - item.currentStage,
                            currentPractice = PracticeGenerator.generate(item, item.currentStage, item.challengeCount + 1),
                            lastPracticeTime = System.currentTimeMillis(),
                        )
                    } else {
                        item
                    }
                }
            }
        }
    }

    fun submitIndependentAnswer(questId: String, answer: String): Boolean {
        var correct = false
        var masteredReward = false
        _items.update { current ->
            current.map { item ->
                if (item.id != questId) {
                    item
                } else {
                    correct = normalize(answer) == normalize(item.currentPractice.answer)
                    if (correct) {
                        val completed = item.completedIndependentStages + item.currentStage
                        val mastery = MasteryCalculator.masteryAfterIndependentSuccess(completed)
                        val nextStage = MasteryCalculator.nextStage(completed)
                        masteredReward = mastery >= 100 && item.status != WrongQuestStatus.MASTERED
                        item.copy(
                            masteryRate = mastery,
                            challengeCount = item.challengeCount + 1,
                            status = MasteryCalculator.statusFor(mastery),
                            currentStage = nextStage,
                            currentPractice = if (mastery >= 100) {
                                item.currentPractice
                            } else {
                                PracticeGenerator.generate(item, nextStage, item.challengeCount + 1)
                            },
                            completedIndependentStages = completed,
                            lastPracticeTime = System.currentTimeMillis(),
                        )
                    } else {
                        val mastery = MasteryCalculator.masteryAfterWrong(item.masteryRate)
                        item.copy(
                            masteryRate = mastery,
                            challengeCount = item.challengeCount + 1,
                            wrongCount = item.wrongCount + 1,
                            status = MasteryCalculator.statusFor(mastery),
                            currentPractice = PracticeGenerator.generate(item, item.currentStage, item.challengeCount + 1),
                            lastPracticeTime = System.currentTimeMillis(),
                        )
                    }
                }
            }
        }
        if (masteredReward) {
            PartnerRepository.recordWrongBookQuest()
        }
        return correct
    }

    fun requestAiHelp(questId: String): PracticeQuestion? {
        var nextPractice: PracticeQuestion? = null
        _items.update { current ->
            current.map { item ->
                if (item.id == questId) {
                    val regenerated = PracticeGenerator.generate(item, item.currentStage, item.challengeCount + item.aiHelpCount + 1)
                    nextPractice = regenerated
                    item.copy(
                        aiHelpCount = item.aiHelpCount + 1,
                        currentPractice = regenerated,
                        status = if (item.status == WrongQuestStatus.NEW) WrongQuestStatus.PRACTICING else item.status,
                    )
                } else {
                    item
                }
            }
        }
        return nextPractice
    }

    fun revealAnswer(questId: String) {
        requestAiHelp(questId)
    }

    fun markCompleted(questionId: String) {
        submitIndependentAnswer(questionId, items.value.firstOrNull { it.id == questionId }?.currentPractice?.answer.orEmpty())
    }

    fun unresolvedCount(): Int = _items.value.count { it.status != WrongQuestStatus.MASTERED }

    fun entertainmentLocked(): Boolean = unresolvedCount() > 0

    private fun normalize(value: String): String = value
        .trim()
        .replace(" ", "")
        .replace("（", "(")
        .replace("）", ")")
        .lowercase()

    private fun introFor(knowledgePoint: String): String = when {
        knowledgePoint.contains("分数") -> "分数题要先判断是取几份、平均分，还是求整体中的一部分，再决定用乘法或除法。"
        knowledgePoint.contains("面积") -> "面积表示平面图形占据的大小，长方形面积通常用长×宽计算。"
        else -> "先识别题目所属知识点，再把条件转成清晰的步骤。"
    }

    private fun seedQuests(): List<WrongItem> {
        val first = PracticeGenerator.originalFor(
            itemId = "quest-fraction-core",
            prompt = "如果 2/3 个披萨再取其中的 1/2，最后是多少个完整披萨？",
            answer = "1/3",
            reason = "把“取其中的一半”转成乘以 1/2，再约分。",
        )
        val second = PracticeGenerator.originalFor(
            itemId = "quest-area-core",
            prompt = "长方形长 8cm，宽 5cm，面积是多少？",
            answer = "40",
            reason = "面积不是周长，要使用长×宽。",
        )
        return listOf(
            WrongItem(
                id = "quest-fraction-core",
                originalQuestion = first.prompt,
                userWrongAnswer = "2/6",
                correctAnswer = first.answer,
                knowledgePoint = "分数乘法",
                knowledgeIntro = introFor("分数乘法"),
                difficulty = "基础",
                sourceCourse = "数学 · 分数乘法入门",
                wrongReason = first.analysis,
                wrongTime = System.currentTimeMillis(),
                aiHelpCount = 1,
                masteryRate = 20,
                challengeCount = 0,
                wrongCount = 1,
                subject = WrongSubject.Math,
                status = WrongQuestStatus.NEW,
                currentStage = ChallengeStage.Original,
                currentPractice = first,
                completedIndependentStages = emptySet(),
                lastPracticeTime = null,
            ),
            WrongItem(
                id = "quest-area-core",
                originalQuestion = second.prompt,
                userWrongAnswer = "26",
                correctAnswer = second.answer,
                knowledgePoint = "长方形面积",
                knowledgeIntro = introFor("面积"),
                difficulty = "基础",
                sourceCourse = "数学 · 图形面积",
                wrongReason = second.analysis,
                wrongTime = System.currentTimeMillis(),
                aiHelpCount = 0,
                masteryRate = 40,
                challengeCount = 1,
                wrongCount = 1,
                subject = WrongSubject.Math,
                status = WrongQuestStatus.PRACTICING,
                currentStage = ChallengeStage.VariantOne,
                currentPractice = PracticeGenerator.generate(
                    item = WrongItem(
                        id = "quest-area-core",
                        originalQuestion = second.prompt,
                        userWrongAnswer = "26",
                        correctAnswer = second.answer,
                        knowledgePoint = "长方形面积",
                        knowledgeIntro = introFor("面积"),
                        difficulty = "基础",
                        sourceCourse = "数学 · 图形面积",
                        wrongReason = second.analysis,
                        wrongTime = System.currentTimeMillis(),
                        aiHelpCount = 0,
                        masteryRate = 40,
                        challengeCount = 1,
                        wrongCount = 1,
                        subject = WrongSubject.Math,
                        status = WrongQuestStatus.PRACTICING,
                        currentStage = ChallengeStage.VariantOne,
                        currentPractice = second,
                        completedIndependentStages = setOf(ChallengeStage.Original),
                        lastPracticeTime = System.currentTimeMillis(),
                    ),
                    stage = ChallengeStage.VariantOne,
                    serial = 2,
                ),
                completedIndependentStages = setOf(ChallengeStage.Original),
                lastPracticeTime = System.currentTimeMillis(),
            ),
        )
    }
}
