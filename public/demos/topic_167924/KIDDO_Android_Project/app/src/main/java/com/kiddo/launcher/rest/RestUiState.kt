package com.kiddo.launcher.rest

enum class RestPage {
    Home,
    Farm,
    Battle,
}

enum class RestUnlockReason(val title: String, val description: String) {
    StudyMinutes("连续学习达标", "已连续学习 40 分钟，可以进入治愈公园"),
    StudyTask("学习任务达标", "今日学习任务已完成，可以短暂恢复注意力"),
    WrongBook("错题挑战达标", "错题挑战已清理，可以进入休息时间"),
}

enum class FarmTool(val label: String) {
    Plant("种植"),
    Water("浇水"),
    Fertilize("施肥"),
    Harvest("收获"),
}

enum class PlantType(
    val label: String,
    val shortLabel: String,
    val growSeconds: Int,
    val coinReward: Int,
    val expReward: Int,
) {
    Carrot("胡萝卜", "胡", 75, 8, 5),
    Tomato("番茄", "番", 95, 10, 6),
    Corn("玉米", "玉", 120, 12, 8),
    Strawberry("草莓", "莓", 105, 14, 7),
    Pumpkin("南瓜", "瓜", 150, 18, 10),
}

data class FarmPlot(
    val id: Int,
    val plant: PlantType? = null,
    val remainingSeconds: Int = 0,
    val watered: Boolean = false,
    val fertilized: Boolean = false,
) {
    val empty: Boolean = plant == null
    val mature: Boolean = plant != null && remainingSeconds <= 0

    fun stageLabel(): String {
        val currentPlant = plant ?: return "空土地"
        if (mature) return "成熟啦"
        val progress = 1f - (remainingSeconds.toFloat() / currentPlant.growSeconds.toFloat()).coerceIn(0f, 1f)
        return when {
            progress < 0.34f -> "小芽"
            progress < 0.70f -> "长高中"
            else -> "快成熟"
        }
    }

    fun remainingLabel(): String {
        if (plant == null) return "可种植"
        if (mature) return "可收获"
        val minutes = remainingSeconds / 60
        val seconds = remainingSeconds % 60
        return "%02d:%02d".format(minutes, seconds)
    }
}

data class CoinReward(
    val coins: Int,
    val exp: Int,
    val bonusName: String? = null,
)

data class PartnerBattleSnapshot(
    val name: String = "AI伙伴",
    val level: Int = 1,
    val hp: Int = 80,
    val intimacy: Int = 60,
    val skills: List<String> = listOf("专注光环", "鼓励护盾", "知识闪光"),
    val imageRes: Int,
)

data class BattleEntry(
    val id: String,
    val title: String,
    val subtitle: String,
    val tag: String,
)

data class RestUiState(
    val page: RestPage = RestPage.Home,
    val unlocked: Boolean = false,
    val unlockReasons: List<RestUnlockReason> = emptyList(),
    val todayRestSeconds: Int = 0,
    val remainingSeconds: Int = 10 * 60,
    val todayCoins: Int = 0,
    val restRecords: List<String> = emptyList(),
    val selectedTool: FarmTool = FarmTool.Plant,
    val selectedPlant: PlantType = PlantType.Carrot,
    val plots: List<FarmPlot> = List(9) { FarmPlot(it) },
    val latestReward: CoinReward? = null,
    val partner: PartnerBattleSnapshot,
    val battleEntries: List<BattleEntry> = emptyList(),
    val waitingMessage: String? = null,
) {
    val remainingTimeText: String
        get() = "%02d:%02d".format(remainingSeconds / 60, remainingSeconds % 60)

    val todayRestTimeText: String
        get() = "%02d:%02d".format(todayRestSeconds / 60, todayRestSeconds % 60)
}
