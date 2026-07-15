package com.kiddo.launcher.ui.home

import androidx.annotation.DrawableRes
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kiddo.launcher.ui.LauncherResources

enum class LauncherSceneNodeId {
    Study,
    Game,
    Social,
    Relax,
}

data class LauncherSceneNode(
    val id: LauncherSceneNodeId,
    val title: String,
    val subtitle: String,
    val progressLabel: String,
    val progress: Float,
    @DrawableRes val imageRes: Int,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val accent: Color,
    val locked: Boolean = false,
    val labelOffsetY: Dp = 0.dp,
)

object LauncherSceneNodes {
    val home = listOf(
        LauncherSceneNode(
            id = LauncherSceneNodeId.Game,
            title = "游戏区",
            subtitle = "GAME",
            progressLabel = "完成学习后解锁",
            progress = 0.40f,
            imageRes = LauncherResources.gamePark,
            x = 24,
            y = 246,
            width = 470,
            height = 316,
            accent = KOrange,
            locked = true,
            labelOffsetY = 36.dp,
        ),
        LauncherSceneNode(
            id = LauncherSceneNodeId.Study,
            title = "学习区",
            subtitle = "STUDY",
            progressLabel = "今日进度 75%",
            progress = 0.75f,
            imageRes = LauncherResources.studyTower,
            x = 494,
            y = -44,
            width = 356,
            height = 624,
            accent = KGlowBlue,
            labelOffsetY = 172.dp,
        ),
        LauncherSceneNode(
            id = LauncherSceneNodeId.Social,
            title = "生活区",
            subtitle = "云朵家园",
            progressLabel = "伙伴在家",
            progress = 0.86f,
            imageRes = LauncherResources.socialAi,
            x = 820,
            y = 214,
            width = 400,
            height = 394,
            accent = KPink,
            labelOffsetY = 58.dp,
        ),
        LauncherSceneNode(
            id = LauncherSceneNodeId.Relax,
            title = "休息区",
            subtitle = "RELAX",
            progressLabel = "护眼模式",
            progress = 0.52f,
            imageRes = LauncherResources.restArea,
            x = 52,
            y = 536,
            width = 308,
            height = 230,
            accent = KGreen,
            labelOffsetY = 34.dp,
        ),
    )
}
