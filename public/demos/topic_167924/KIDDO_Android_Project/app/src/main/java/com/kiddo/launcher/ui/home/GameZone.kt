package com.kiddo.launcher.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun GameZone(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    KBuildingPortal(
        title = "游戏区",
        subtitle = "GAME",
        progressLabel = "完成学习后解锁",
        progress = 0.40f,
        buildingRes = LauncherResources.gamePark,
        accent = KOrange,
        locked = true,
        modifier = modifier,
        onClick = onClick,
    )
}
