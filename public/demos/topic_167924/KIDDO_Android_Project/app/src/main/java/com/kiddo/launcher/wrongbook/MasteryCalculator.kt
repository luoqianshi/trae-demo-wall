package com.kiddo.launcher.wrongbook

object MasteryCalculator {
    fun initialMastery(): Int = 20

    fun masteryAfterIndependentSuccess(completedStages: Set<ChallengeStage>): Int {
        val best = completedStages.maxOfOrNull { it.targetMastery } ?: initialMastery()
        return best.coerceIn(20, 100)
    }

    fun masteryAfterWrong(currentMastery: Int): Int {
        return (currentMastery - 20).coerceAtLeast(20)
    }

    fun statusFor(masteryRate: Int): WrongQuestStatus = when {
        masteryRate >= 100 -> WrongQuestStatus.MASTERED
        masteryRate >= 80 -> WrongQuestStatus.MASTERING
        masteryRate >= 40 -> WrongQuestStatus.PRACTICING
        else -> WrongQuestStatus.NEW
    }

    fun nextStage(completedStages: Set<ChallengeStage>): ChallengeStage {
        return ChallengeStage.entries.firstOrNull { it !in completedStages } ?: ChallengeStage.Integrated
    }
}
