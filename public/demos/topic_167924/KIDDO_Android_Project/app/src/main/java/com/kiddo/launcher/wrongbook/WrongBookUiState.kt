package com.kiddo.launcher.wrongbook

enum class WrongSubject(val title: String) {
    Math("数学"),
    Chinese("语文"),
    English("英语"),
    Physics("物理"),
    Chemistry("化学"),
}

enum class WrongQuestStatus(val label: String) {
    NEW("待挑战"),
    PRACTICING("挑战中"),
    MASTERING("即将完成"),
    MASTERED("已掌握"),
}

enum class ChallengeStage(val title: String, val targetMastery: Int) {
    Original("原题重做", 40),
    VariantOne("变式挑战 I", 60),
    VariantTwo("变式挑战 II", 80),
    Integrated("综合挑战", 100),
}

data class PracticeQuestion(
    val id: String,
    val prompt: String,
    val answer: String,
    val hint: String,
    val analysis: String,
    val stage: ChallengeStage,
)

data class WrongItem(
    val id: String,
    val originalQuestion: String,
    val userWrongAnswer: String,
    val correctAnswer: String,
    val knowledgePoint: String,
    val knowledgeIntro: String,
    val difficulty: String,
    val sourceCourse: String,
    val wrongReason: String,
    val wrongTime: Long,
    val aiHelpCount: Int,
    val masteryRate: Int,
    val challengeCount: Int,
    val wrongCount: Int,
    val subject: WrongSubject,
    val status: WrongQuestStatus,
    val currentStage: ChallengeStage,
    val currentPractice: PracticeQuestion,
    val completedIndependentStages: Set<ChallengeStage>,
    val lastPracticeTime: Long?,
)

data class GrowthReward(
    val growthExp: Int = 30,
    val learningCoins: Int = 12,
    val aiPartnerExp: Int = 18,
    val badgeName: String = "知识星徽章",
)

data class WrongBookUiState(
    val subjects: List<WrongSubject> = WrongSubject.entries,
    val selectedSubject: WrongSubject = WrongSubject.Math,
    val quests: List<WrongItem> = emptyList(),
    val selectedQuest: WrongItem? = null,
    val answerInput: String = "",
    val aiGuideMessage: String = "先观察题目给了哪些条件，我们从第一步开始。",
    val showFullAnalysis: Boolean = false,
    val lastAnswerCorrect: Boolean? = null,
    val completionCelebration: Boolean = false,
    val entertainmentLocked: Boolean = true,
    val reward: GrowthReward = GrowthReward(),
) {
    val visibleQuests: List<WrongItem>
        get() = quests.filter { it.subject == selectedSubject }

    val requiredQuestCount: Int
        get() = quests.count { it.status != WrongQuestStatus.MASTERED }
}
