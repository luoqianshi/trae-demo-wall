package com.kiddo.launcher.aipartner

object GrowthSystem {
    fun expToNext(level: Int): Int = 360 + level * 120

    fun levelFor(totalExp: Int): Int {
        var level = 1
        var remaining = totalExp
        while (remaining >= expToNext(level)) {
            remaining -= expToNext(level)
            level += 1
        }
        return level
    }

    fun expInLevel(totalExp: Int): Int {
        var level = 1
        var remaining = totalExp
        while (remaining >= expToNext(level)) {
            remaining -= expToNext(level)
            level += 1
        }
        return remaining
    }

    fun lifeStage(level: Int, hatched: Boolean): PartnerLifeStage = when {
        !hatched -> PartnerLifeStage.Egg
        level < 5 -> PartnerLifeStage.Hatchling
        level < 12 -> PartnerLifeStage.Growing
        else -> PartnerLifeStage.Bonded
    }

    fun moodFor(stats: PartnerStats): PartnerMood = when {
        stats.vitality < 35 -> PartnerMood.Sleepy
        stats.mood < 40 -> PartnerMood.NeedsCare
        stats.knowledge > 70 -> PartnerMood.Studying
        stats.intimacy > 75 -> PartnerMood.Happy
        else -> PartnerMood.Curious
    }

    fun clampStat(value: Int): Int = value.coerceIn(0, 100)
}
