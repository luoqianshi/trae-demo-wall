package com.kiddo.launcher.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun RelaxZone(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    KBuildingPortal(
        title = "休息区",
        subtitle = "RELAX",
        progressLabel = "护眼模式",
        progress = 0.52f,
        buildingRes = LauncherResources.restArea,
        accent = KGreen,
        modifier = modifier,
        onClick = onClick,
    )
}
