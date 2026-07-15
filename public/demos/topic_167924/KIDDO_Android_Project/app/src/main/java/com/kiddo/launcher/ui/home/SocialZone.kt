package com.kiddo.launcher.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun SocialZone(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    KBuildingPortal(
        title = "生活区",
        subtitle = "云朵家园",
        progressLabel = "伙伴在线",
        progress = 0.86f,
        buildingRes = LauncherResources.socialAi,
        accent = KPink,
        modifier = modifier,
        onClick = onClick,
    )
}
