package com.kiddo.launcher.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun FloatingNavigation(
    modifier: Modifier = Modifier,
    onTaskClick: () -> Unit,
    onBagClick: () -> Unit,
    onAchievementClick: () -> Unit,
    onSettingsClick: () -> Unit,
) {
    KGlassPanel(
        modifier = modifier,
        radius = 28.dp,
        glow = KGlowBlue.copy(alpha = 0.34f),
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            KGlassButton("任务", LauncherResources.task, onClick = onTaskClick)
            KGlassButton("背包", LauncherResources.bag, onClick = onBagClick)
            KGlassButton("成就", LauncherResources.achievement, onClick = onAchievementClick)
            KGlassButton("设置", LauncherResources.settings, onClick = onSettingsClick)
        }
    }
}
