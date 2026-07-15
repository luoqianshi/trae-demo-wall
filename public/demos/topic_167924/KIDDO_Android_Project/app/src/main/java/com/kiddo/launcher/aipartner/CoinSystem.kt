package com.kiddo.launcher.aipartner

object CoinSystem {
    const val STUDY_TASK_REWARD = 25
    const val WRONGBOOK_REWARD = 35
    const val DAILY_TASK_REWARD = 45
    const val MINI_GAME_REWARD = 12
    const val REST_FARM_BASE_REWARD = 8

    fun canSpend(current: Int, amount: Int): Boolean = current >= amount

    fun earn(current: Int, amount: Int): Int = (current + amount).coerceAtLeast(0)

    fun spend(current: Int, amount: Int): Int = (current - amount).coerceAtLeast(0)
}
