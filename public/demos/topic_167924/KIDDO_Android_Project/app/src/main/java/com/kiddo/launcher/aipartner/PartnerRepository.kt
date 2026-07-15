package com.kiddo.launcher.aipartner

import com.kiddo.launcher.ui.LauncherResources
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

object PartnerRepository {
    private var totalExp: Int = 520
    private var completedStudyTasks: Int = 3
    private var completedWrongBookQuests: Int = 1
    private var cumulativeInteractions: Int = 8

    private val _state = MutableStateFlow(seedState())
    val state: StateFlow<PartnerState> = _state.asStateFlow()

    fun recordStudyTask(title: String = "完成学习任务") {
        completedStudyTasks += 1
        cumulativeInteractions += 1
        addReward(
            exp = 40,
            coin = CoinSystem.STUDY_TASK_REWARD,
            growth = 5,
            knowledge = 7,
            diaryTitle = title,
            diaryBody = "你完成了学习任务，伙伴获得学习经验和成长金币。",
            tag = "学习",
        )
    }

    fun recordWrongBookQuest(title: String = "解决错题本任务") {
        completedWrongBookQuests += 1
        cumulativeInteractions += 1
        addReward(
            exp = 55,
            coin = CoinSystem.WRONGBOOK_REWARD,
            growth = 8,
            knowledge = 10,
            diaryTitle = title,
            diaryBody = "你把一道错题推进到独立掌握，伙伴的知识力提升了。",
            tag = "错题",
        )
    }

    fun interactWithPartner() {
        cumulativeInteractions += 1
        _state.update { current ->
            rebuild(
                current.copy(
                    stats = current.stats.copy(
                        intimacy = GrowthSystem.clampStat(current.stats.intimacy + 4),
                        mood = GrowthSystem.clampStat(current.stats.mood + 5),
                    ),
                    today = current.today.copy(chatCount = current.today.chatCount + 1),
                    activeMessage = "我在这里！今天也一起把小目标点亮吧。",
                    diary = addDiary(current, "轻轻互动", "你摸了摸伙伴，它开心地绕着你转了一圈。", "互动"),
                ),
            )
        }
    }

    fun chat() {
        cumulativeInteractions += 1
        _state.update { current ->
            rebuild(
                current.copy(
                    stats = current.stats.copy(
                        intimacy = GrowthSystem.clampStat(current.stats.intimacy + 3),
                        mood = GrowthSystem.clampStat(current.stats.mood + 3),
                    ),
                    today = current.today.copy(chatCount = current.today.chatCount + 1),
                    activeMessage = "我发现你最近数学更稳定了。今天想先完成哪个小任务？",
                    diary = addDiary(current, "伙伴主动聊天", "伙伴提醒你回顾今日学习目标，并给了一个小小鼓励。", "聊天"),
                ),
            )
        }
    }

    fun askLearningQuestion() {
        cumulativeInteractions += 1
        _state.update { current ->
            rebuild(
                current.copy(
                    stats = current.stats.copy(
                        knowledge = GrowthSystem.clampStat(current.stats.knowledge + 4),
                        intimacy = GrowthSystem.clampStat(current.stats.intimacy + 2),
                    ),
                    today = current.today.copy(studyCompanionCount = current.today.studyCompanionCount + 1),
                    activeMessage = "我们先找题目条件，不急着猜答案。你觉得第一步应该算什么？",
                    diary = addDiary(current, "AI问答陪伴", "伙伴用引导式提问陪你拆解了一道学习问题。", "问答"),
                ),
            )
        }
    }

    fun recordMood(moodText: String = "今天还不错") {
        cumulativeInteractions += 1
        _state.update { current ->
            rebuild(
                current.copy(
                    stats = current.stats.copy(
                        intimacy = GrowthSystem.clampStat(current.stats.intimacy + 4),
                        mood = GrowthSystem.clampStat(current.stats.mood + 7),
                    ),
                    activeMessage = "谢谢你告诉我你的心情。我会记住今天的感受，慢慢陪你变勇敢。",
                    diary = addDiary(current, "今日心情", "你记录了心情：$moodText。伙伴认真听完，并给出温柔回应。", "心情"),
                ),
            )
        }
    }

    fun playMiniGame() {
        cumulativeInteractions += 1
        _state.update { current ->
            rebuild(
                current.copy(
                    coin = CoinSystem.earn(current.coin, CoinSystem.MINI_GAME_REWARD),
                    stats = current.stats.copy(
                        intimacy = GrowthSystem.clampStat(current.stats.intimacy + 3),
                        vitality = GrowthSystem.clampStat(current.stats.vitality - 3),
                        mood = GrowthSystem.clampStat(current.stats.mood + 6),
                    ),
                    today = current.today.copy(gameCount = current.today.gameCount + 1),
                    activeMessage = "小游戏完成！休息之后，我们再去点亮新的学习星星。",
                    diary = addDiary(current, "休息小游戏", "你和伙伴玩了一局小游戏，获得成长金币。", "游戏"),
                ),
            )
        }
    }

    fun playWithPartner() {
        playMiniGame()
    }

    fun feedPartner() {
        _state.update { current ->
            val food = current.inventory.firstOrNull { it.item.category == PartnerItemCategory.Food }
            if (food != null) {
                return@update rebuild(
                    current.copy(
                        inventory = consumeInventory(current.inventory, food.item.id),
                        stats = current.stats.copy(
                            intimacy = GrowthSystem.clampStat(current.stats.intimacy + food.item.intimacyGain + 2),
                            growth = GrowthSystem.clampStat(current.stats.growth + food.item.growthGain),
                            vitality = GrowthSystem.clampStat(current.stats.vitality + food.item.vitalityGain + 5),
                            mood = GrowthSystem.clampStat(current.stats.mood + food.item.moodGain + 3),
                        ),
                        activeMessage = "谢谢你的${food.item.name}！我感觉能量满满，等会儿继续陪你学习。",
                        diary = addDiary(current, "喂食${food.item.name}", "你给伙伴准备了喜欢的食物，亲密度和活力都提升了。", "喂食"),
                    ),
                )
            }
            current.copy(activeMessage = "背包里还没有食物。可以先去伙伴商城，用休息和学习获得的金币换一点小点心。")
        }
    }

    fun healPartner() {
        _state.update { current ->
            val medicine = current.inventory.firstOrNull { it.item.category == PartnerItemCategory.Medicine }
            if (medicine != null) {
                return@update rebuild(
                    current.copy(
                        inventory = consumeInventory(current.inventory, medicine.item.id),
                        stats = current.stats.copy(
                            vitality = GrowthSystem.clampStat(current.stats.vitality + medicine.item.vitalityGain + 8),
                            mood = GrowthSystem.clampStat(current.stats.mood + medicine.item.moodGain + 2),
                            intimacy = GrowthSystem.clampStat(current.stats.intimacy + medicine.item.intimacyGain + 1),
                        ),
                        activeMessage = "${medicine.item.name}用好啦，我现在舒服多了。谢谢你照顾我！",
                        diary = addDiary(current, "治疗${medicine.item.name}", "你使用药品照顾伙伴，伙伴状态恢复了。", "治疗"),
                    ),
                )
            }
            current.copy(activeMessage = "背包里还没有药品。如果伙伴有点累，可以去伙伴商城准备一点护理道具。")
        }
    }

    fun recordRestReward(
        coins: Int,
        exp: Int,
        bonusItemId: String? = null,
        diaryTitle: String = "休息小屋收获",
    ) {
        totalExp += exp
        cumulativeInteractions += 1
        _state.update { current ->
            val bonusItem = bonusItemId?.let { id -> current.shopItems.firstOrNull { it.id == id } }
            rebuild(
                current.copy(
                    coin = CoinSystem.earn(current.coin, coins),
                    inventory = if (bonusItem == null) current.inventory else addInventory(current.inventory, bonusItem),
                    stats = current.stats.copy(
                        intimacy = GrowthSystem.clampStat(current.stats.intimacy + 2),
                        growth = GrowthSystem.clampStat(current.stats.growth + 3),
                        vitality = GrowthSystem.clampStat(current.stats.vitality + 2),
                        mood = GrowthSystem.clampStat(current.stats.mood + 4),
                    ),
                    today = current.today.copy(gameCount = current.today.gameCount + 1),
                    activeMessage = "休息小屋收获完成，金币 +$coins，伙伴经验 +$exp。休息后我们继续学习吧。",
                    diary = addDiary(
                        current = current,
                        title = diaryTitle,
                        body = if (bonusItem == null) {
                            "你在休息时间照顾植物，获得了伙伴成长金币。"
                        } else {
                            "你在休息时间照顾植物，还为伙伴带回了新的补给。"
                        },
                        tag = "休息",
                    ),
                ),
            )
        }
    }

    fun hatchNow() {
        _state.update { current ->
            rebuild(
                current.copy(
                    eggProgress = 100,
                    hatched = true,
                    activeMessage = "${current.partner.name} 诞生了！它会记住你的努力，并陪你一起成长。",
                    diary = addDiary(current, "AI伙伴诞生", "AI蛋裂开，${current.partner.name} 成为了你的长期学习伙伴。", "孵化"),
                ),
            )
        }
    }

    fun buyItem(itemId: String) {
        _state.update { current ->
            val item = current.shopItems.firstOrNull { it.id == itemId } ?: return@update current
            if (!CoinSystem.canSpend(current.coin, item.price)) {
                current.copy(activeMessage = "金币还不够。完成学习任务或错题本任务可以获得更多金币。")
            } else {
                current.copy(
                    coin = CoinSystem.spend(current.coin, item.price),
                    inventory = addInventory(current.inventory, item),
                    activeMessage = "${item.name} 已放入伙伴背包。",
                    diary = addDiary(current, "购买${item.name}", "你用成长金币为伙伴准备了 ${item.name}。", "商城"),
                )
            }
        }
    }

    fun useItem(itemId: String) {
        _state.update { current ->
            val entry = current.inventory.firstOrNull { it.item.id == itemId } ?: return@update current
            val item = entry.item
            rebuild(
                current.copy(
                    inventory = consumeInventory(current.inventory, itemId),
                    stats = current.stats.copy(
                        intimacy = GrowthSystem.clampStat(current.stats.intimacy + item.intimacyGain),
                        growth = GrowthSystem.clampStat(current.stats.growth + item.growthGain),
                        vitality = GrowthSystem.clampStat(current.stats.vitality + item.vitalityGain),
                        mood = GrowthSystem.clampStat(current.stats.mood + item.moodGain),
                    ),
                    activeMessage = "${current.partner.name} 使用了 ${item.name}，状态变好了。",
                    diary = addDiary(current, "使用${item.name}", "伙伴获得了新的照顾，亲密关系继续成长。", "背包"),
                ),
            )
        }
    }

    private fun addReward(
        exp: Int,
        coin: Int,
        growth: Int,
        knowledge: Int,
        diaryTitle: String,
        diaryBody: String,
        tag: String,
    ) {
        totalExp += exp
        _state.update { current ->
            rebuild(
                current.copy(
                    coin = CoinSystem.earn(current.coin, coin),
                    stats = current.stats.copy(
                        growth = GrowthSystem.clampStat(current.stats.growth + growth),
                        knowledge = GrowthSystem.clampStat(current.stats.knowledge + knowledge),
                        vitality = GrowthSystem.clampStat(current.stats.vitality - 2),
                    ),
                    today = current.today.copy(studyCompanionCount = current.today.studyCompanionCount + 1),
                    activeMessage = "学习奖励到账：经验值 +$exp，金币 +$coin。伙伴也变强了一点。",
                    diary = addDiary(current, diaryTitle, diaryBody, tag),
                ),
            )
        }
    }

    private fun rebuild(state: PartnerState): PartnerState {
        val level = GrowthSystem.levelFor(totalExp)
        val exp = GrowthSystem.expInLevel(totalExp)
        val hatched = state.hatched || hatchProgress() >= 100
        return state.copy(
            eggProgress = hatchProgress(),
            hatched = hatched,
            level = level,
            exp = exp,
            expToNext = GrowthSystem.expToNext(level),
            lifeStage = GrowthSystem.lifeStage(level, hatched),
            mood = GrowthSystem.moodFor(state.stats),
            hatchRequirements = requirements(),
        )
    }

    private fun seedState(): PartnerState {
        val partner = PartnerAvatar(
            id = "electric-fox",
            name = "小电狐",
            species = "电光伙伴",
            personality = "好奇、敏捷、喜欢鼓励别人",
            favorite = "星星糖和数学闯关",
            imageRes = LauncherResources.partnerElectricFox,
        )
        val level = GrowthSystem.levelFor(totalExp)
        val exp = GrowthSystem.expInLevel(totalExp)
        val stats = PartnerStats(
            intimacy = 62,
            growth = 58,
            knowledge = 66,
            vitality = 74,
            mood = 72,
        )
        val hatched = hatchProgress() >= 100
        return PartnerState(
            eggProgress = hatchProgress(),
            hatched = hatched,
            partner = partner,
            level = level,
            exp = exp,
            expToNext = GrowthSystem.expToNext(level),
            coin = 155,
            lifeStage = GrowthSystem.lifeStage(level, hatched),
            mood = GrowthSystem.moodFor(stats),
            stats = stats,
            today = PartnerInteractionSummary(chatCount = 3, studyCompanionCount = 2, gameCount = 1),
            hatchRequirements = requirements(),
            shopItems = ItemSystem.shopItems(),
            inventory = listOf(
                InventoryEntry(ItemSystem.shopItems().first { it.id == "energy-fruit" }, 2),
                InventoryEntry(ItemSystem.shopItems().first { it.id == "star-candy" }, 1),
            ),
            diary = listOf(
                GrowthDiaryEntry("diary-1", "数学任务完成", "今天小伙伴陪你完成了 3 道数学题。", "学习"),
                GrowthDiaryEntry("diary-2", "错题推进", "你坚持重做错题，让伙伴获得了新的知识力。", "错题"),
                GrowthDiaryEntry("diary-3", "伙伴升级", "你的坚持让伙伴接近下一次成长。", "成长"),
            ),
            activeMessage = "今天也一起成长吧。完成学习任务可以给我补充孵化能量。",
        )
    }

    private fun hatchProgress(): Int {
        val taskPart = (completedStudyTasks * 12).coerceAtMost(45)
        val wrongPart = (completedWrongBookQuests * 18).coerceAtMost(35)
        val interactPart = (cumulativeInteractions * 3).coerceAtMost(20)
        return (taskPart + wrongPart + interactPart).coerceIn(0, 100)
    }

    private fun requirements(): List<HatchRequirement> = listOf(
        HatchRequirement("学习任务", completedStudyTasks, 5),
        HatchRequirement("错题本任务", completedWrongBookQuests, 2),
        HatchRequirement("累计互动", cumulativeInteractions, 12),
    )

    private fun addDiary(current: PartnerState, title: String, body: String, tag: String): List<GrowthDiaryEntry> {
        val entry = GrowthDiaryEntry(
            id = "diary-${System.currentTimeMillis()}",
            title = title,
            body = body,
            tag = tag,
        )
        return (listOf(entry) + current.diary).take(20)
    }

    private fun addInventory(inventory: List<InventoryEntry>, item: PartnerItem): List<InventoryEntry> {
        val existing = inventory.firstOrNull { it.item.id == item.id }
        return if (existing == null) {
            inventory + InventoryEntry(item, 1)
        } else {
            inventory.map { entry ->
                if (entry.item.id == item.id) entry.copy(count = entry.count + 1) else entry
            }
        }
    }

    private fun consumeInventory(inventory: List<InventoryEntry>, itemId: String): List<InventoryEntry> {
        return inventory.mapNotNull { entry ->
            when {
                entry.item.id != itemId -> entry
                entry.count > 1 -> entry.copy(count = entry.count - 1)
                else -> null
            }
        }
    }
}
