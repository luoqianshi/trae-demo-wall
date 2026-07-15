package com.kiddo.launcher.aipartner

import androidx.annotation.DrawableRes

enum class PartnerLifeStage(val label: String) {
    Egg("AI蛋"),
    Hatchling("幼生伙伴"),
    Growing("成长伙伴"),
    Bonded("长期伙伴"),
}

enum class PartnerMood(val label: String) {
    Happy("开心"),
    Curious("好奇"),
    Sleepy("困倦"),
    NeedsCare("需要陪伴"),
    Studying("学习中"),
}

enum class PartnerTab(val label: String) {
    Companion("对话"),
    Interact("互动"),
    Diary("成长日记"),
    Shop("伙伴商城"),
}

enum class PartnerItemCategory(val label: String) {
    Food("食物"),
    Medicine("药品"),
    Toy("玩具"),
    Growth("成长道具"),
}

data class PartnerAvatar(
    val id: String,
    val name: String,
    val species: String,
    val personality: String,
    val favorite: String,
    @DrawableRes val imageRes: Int,
)

data class PartnerStats(
    val intimacy: Int,
    val growth: Int,
    val knowledge: Int,
    val vitality: Int,
    val mood: Int,
)

data class PartnerItem(
    val id: String,
    val name: String,
    val category: PartnerItemCategory,
    val description: String,
    val price: Int,
    val intimacyGain: Int = 0,
    val growthGain: Int = 0,
    val vitalityGain: Int = 0,
    val moodGain: Int = 0,
)

data class InventoryEntry(
    val item: PartnerItem,
    val count: Int,
)

data class GrowthDiaryEntry(
    val id: String,
    val title: String,
    val body: String,
    val tag: String,
)

data class PartnerInteractionSummary(
    val chatCount: Int,
    val studyCompanionCount: Int,
    val gameCount: Int,
)

data class HatchRequirement(
    val label: String,
    val current: Int,
    val target: Int,
) {
    val done: Boolean = current >= target
}

data class PartnerState(
    val eggProgress: Int,
    val hatched: Boolean,
    val partner: PartnerAvatar,
    val level: Int,
    val exp: Int,
    val expToNext: Int,
    val coin: Int,
    val lifeStage: PartnerLifeStage,
    val mood: PartnerMood,
    val stats: PartnerStats,
    val today: PartnerInteractionSummary,
    val hatchRequirements: List<HatchRequirement>,
    val shopItems: List<PartnerItem>,
    val inventory: List<InventoryEntry>,
    val diary: List<GrowthDiaryEntry>,
    val activeMessage: String,
)
