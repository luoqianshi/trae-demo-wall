package com.kiddo.launcher.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun GameHud(
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        KHudMetric("今日学习", "75%", LauncherResources.task, KGreen)
        KHudMetric("游戏权限", "40%", LauncherResources.bag, KOrange)
        KHudMetric("AI成长", "60%", LauncherResources.aiEgg, KPink)
    }
}
