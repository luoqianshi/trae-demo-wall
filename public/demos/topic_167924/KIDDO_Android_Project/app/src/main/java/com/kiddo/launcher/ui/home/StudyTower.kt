package com.kiddo.launcher.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun StudyTower(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    KBuildingPortal(
        title = "学习区",
        subtitle = "STUDY",
        progressLabel = "今日进度 75%",
        progress = 0.75f,
        buildingRes = LauncherResources.studyTower,
        accent = KGlowBlue,
        modifier = modifier,
        labelOffsetY = 4.dp,
        onClick = onClick,
    )
}
