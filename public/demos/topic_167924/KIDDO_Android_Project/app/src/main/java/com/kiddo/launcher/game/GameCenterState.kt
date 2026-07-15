package com.kiddo.launcher.game

import androidx.annotation.DrawableRes
import com.kiddo.launcher.model.HomeUiState
import com.kiddo.launcher.ui.LauncherResources

enum class GameCategory(val title: String) {
    Racing("竞速"),
    Puzzle("休闲"),
    Building("创造"),
    Adventure("动作"),
    Strategy("竞技"),
}

enum class EntertainmentType(val title: String) {
    Video("视频娱乐"),
    Music("音乐"),
    Animation("动画"),
}

data class GameCenterItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: GameCategory,
    @DrawableRes val imageRes: Int,
    val popularity: String,
    val packageName: String,
)

data class EntertainmentItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val type: EntertainmentType,
    @DrawableRes val imageRes: Int,
    val packageName: String,
)

data class GameCenterState(
    val todayEntertainmentMinutes: Int,
    val maxEntertainmentMinutes: Int,
    val usedEntertainmentMinutes: Int,
    val learningFinished: Int,
    val learningTotal: Int,
    val unresolvedWrongCount: Int,
    val games: List<GameCenterItem>,
    val entertainment: List<EntertainmentItem>,
) {
    val learningComplete: Boolean = learningFinished >= learningTotal
    val wrongBookComplete: Boolean = unresolvedWrongCount == 0
    val unlocked: Boolean = learningComplete && wrongBookComplete
    val remainingMinutes: Int = (todayEntertainmentMinutes - usedEntertainmentMinutes).coerceAtLeast(0)
}

object GameCenterRepository {
    fun load(
        homeState: HomeUiState,
        unresolvedWrongCount: Int,
    ): GameCenterState {
        val maxMinutes = 45
        val earnedMinutes = (homeState.todayTaskFinished * 10).coerceIn(0, maxMinutes)
        val usedMinutes = (earnedMinutes * homeState.gameUnlocked).toInt().coerceIn(0, earnedMinutes)

        return GameCenterState(
            todayEntertainmentMinutes = earnedMinutes,
            maxEntertainmentMinutes = maxMinutes,
            usedEntertainmentMinutes = usedMinutes,
            learningFinished = homeState.todayTaskFinished,
            learningTotal = homeState.todayTaskTotal,
            unresolvedWrongCount = unresolvedWrongCount,
            games = gameItems(),
            entertainment = entertainmentItems(),
        )
    }

    private fun gameItems(): List<GameCenterItem> = listOf(
        GameCenterItem(
            id = "honor-of-kings",
            title = "王者荣耀",
            subtitle = "腾讯 MOBA",
            category = GameCategory.Strategy,
            imageRes = LauncherResources.appHonorOfKings,
            popularity = "已接入",
            packageName = "com.tencent.tmgp.sgame",
        ),
        GameCenterItem(
            id = "peace-elite",
            title = "和平精英",
            subtitle = "腾讯战术竞技",
            category = GameCategory.Adventure,
            imageRes = LauncherResources.appPeaceElite,
            popularity = "已接入",
            packageName = "com.tencent.tmgp.pubgmhd",
        ),
        GameCenterItem(
            id = "egg-party",
            title = "蛋仔派对",
            subtitle = "网易派对闯关",
            category = GameCategory.Puzzle,
            imageRes = LauncherResources.appEggParty,
            popularity = "已接入",
            packageName = "com.netease.party",
        ),
        GameCenterItem(
            id = "delta-force",
            title = "三角洲行动",
            subtitle = "第一人称搜打撤",
            category = GameCategory.Adventure,
            imageRes = LauncherResources.appDeltaForce,
            popularity = "已接入",
            packageName = "com.tencent.tmgp.dfm",
        ),
    )

    private fun entertainmentItems(): List<EntertainmentItem> = listOf(
        EntertainmentItem(
            id = "bilibili",
            title = "哔哩哔哩",
            subtitle = "视频与动画",
            type = EntertainmentType.Video,
            imageRes = LauncherResources.appBilibili,
            packageName = "tv.danmaku.bili",
        ),
        EntertainmentItem(
            id = "douyin",
            title = "抖音",
            subtitle = "短视频娱乐",
            type = EntertainmentType.Video,
            imageRes = LauncherResources.appDouyin,
            packageName = "com.ss.android.ugc.aweme",
        ),
        EntertainmentItem(
            id = "netease-music",
            title = "网易云音乐",
            subtitle = "音乐放松",
            type = EntertainmentType.Music,
            imageRes = LauncherResources.appNeteaseMusic,
            packageName = "com.netease.cloudmusic",
        ),
    )
}
