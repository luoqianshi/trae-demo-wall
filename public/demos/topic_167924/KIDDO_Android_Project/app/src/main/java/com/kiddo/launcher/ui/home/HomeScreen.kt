package com.kiddo.launcher.ui.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.tooling.preview.Preview
import com.kiddo.launcher.ui.theme.KiddoLauncherTheme
import com.kiddo.launcher.viewmodel.HomeViewModel
import kotlin.math.min

@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onStudyClick: () -> Unit,
    onGameClick: () -> Unit,
    onSocialClick: () -> Unit,
    onRestClick: () -> Unit,
    onEggClick: () -> Unit,
    onTaskClick: () -> Unit,
    onBagClick: () -> Unit,
    onAchievementClick: () -> Unit,
    onSettingsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    viewModel.uiState.collectAsState()

    HomeContent(
        onStudyClick = onStudyClick,
        onGameClick = onGameClick,
        onSocialClick = onSocialClick,
        onRestClick = onRestClick,
        onEggClick = onEggClick,
        onTaskClick = onTaskClick,
        onBagClick = onBagClick,
        onAchievementClick = onAchievementClick,
        onSettingsClick = onSettingsClick,
        modifier = modifier,
    )
}

@Composable
private fun HomeContent(
    onStudyClick: () -> Unit,
    onGameClick: () -> Unit,
    onSocialClick: () -> Unit,
    onRestClick: () -> Unit,
    onEggClick: () -> Unit,
    onTaskClick: () -> Unit,
    onBagClick: () -> Unit,
    onAchievementClick: () -> Unit,
    onSettingsClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val configuration = LocalConfiguration.current
    val scale = min(
        configuration.screenWidthDp / HomeDesignWidth.value,
        configuration.screenHeightDp / HomeDesignHeight.value,
    )

    Box(
        modifier = modifier
            .fillMaxSize()
            .clipToBounds(),
        contentAlignment = Alignment.Center,
    ) {
        CityBackground()
        AtmosphereLayer()

        HomeWorldLayer(
            scale = scale,
            onStudyClick = onStudyClick,
            onGameClick = onGameClick,
            onSocialClick = onSocialClick,
            onRestClick = onRestClick,
            onEggClick = onEggClick,
            onTaskClick = onTaskClick,
            onBagClick = onBagClick,
            onAchievementClick = onAchievementClick,
            onSettingsClick = onSettingsClick,
        )
    }
}

@Composable
private fun HomeWorldLayer(
    scale: Float,
    onStudyClick: () -> Unit,
    onGameClick: () -> Unit,
    onSocialClick: () -> Unit,
    onRestClick: () -> Unit,
    onEggClick: () -> Unit,
    onTaskClick: () -> Unit,
    onBagClick: () -> Unit,
    onAchievementClick: () -> Unit,
    onSettingsClick: () -> Unit,
) {
    Box(
        modifier = Modifier.size(HomeDesignWidth * scale, HomeDesignHeight * scale),
    ) {
        InteractiveBuildings(
            scale = scale,
            onStudyClick = onStudyClick,
            onGameClick = onGameClick,
            onSocialClick = onSocialClick,
            onRestClick = onRestClick,
        )

        AIEggCenter(
            modifier = Modifier
                .offset(x = 482.ds(scale), y = 486.ds(scale))
                .size(width = 316.ds(scale), height = 246.ds(scale)),
            onClick = onEggClick,
        )

        KProfileHud(
            modifier = Modifier
                .offset(x = 24.ds(scale), y = 12.ds(scale))
                .size(width = 226.ds(scale), height = 72.ds(scale)),
        )

        GameHud(
            modifier = Modifier.offset(x = 412.ds(scale), y = 4.ds(scale)),
        )

        KGoalHud(
            modifier = Modifier
                .offset(x = 1030.ds(scale), y = 12.ds(scale))
                .size(width = 222.ds(scale), height = 124.ds(scale)),
        )

        FloatingNavigation(
            modifier = Modifier.offset(x = 902.ds(scale), y = 648.ds(scale)),
            onTaskClick = onTaskClick,
            onBagClick = onBagClick,
            onAchievementClick = onAchievementClick,
            onSettingsClick = onSettingsClick,
        )
    }
}

@Preview(widthDp = 1280, heightDp = 800, showBackground = true)
@Composable
private fun HomeScreenPreview() {
    KiddoLauncherTheme {
        HomeContent(
            onStudyClick = {},
            onGameClick = {},
            onSocialClick = {},
            onRestClick = {},
            onEggClick = {},
            onTaskClick = {},
            onBagClick = {},
            onAchievementClick = {},
            onSettingsClick = {},
        )
    }
}
