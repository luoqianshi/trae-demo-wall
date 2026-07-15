package com.kiddo.launcher.rest

object BattleRepository {
    fun trainingEntries(): List<BattleEntry> = listOf(
        BattleEntry(
            id = "npc",
            title = "挑战NPC",
            subtitle = "和训练馆里的小教练自动切磋",
            tag = "预留",
        ),
        BattleEntry(
            id = "player",
            title = "挑战玩家",
            subtitle = "未来可匹配其他小朋友的AI伙伴",
            tag = "未来",
        ),
    )

    fun futureRuleNotes(): List<String> = listOf(
        "自动回合制，孩子不用手动操作",
        "等级、成长值、亲密度和状态会影响胜负",
        "奖励只进入伙伴成长系统，不购买娱乐权限",
    )
}
