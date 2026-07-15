package com.kiddo.launcher.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun StudyScreen() {
    EmptyRouteScreen(title = "Study")
}

@Composable
fun GameScreen() {
    EmptyRouteScreen(title = "Game")
}

@Composable
fun AIScreen() {
    EmptyRouteScreen(title = "AI")
}

@Composable
fun RestScreen() {
    EmptyRouteScreen(title = "Rest")
}

@Composable
fun SocialScreen() {
    EmptyRouteScreen(title = "Social")
}

@Composable
fun SettingsScreen() {
    EmptyRouteScreen(title = "Settings")
}

@Composable
private fun EmptyRouteScreen(title: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = title,
            color = MaterialTheme.colorScheme.onBackground,
            style = MaterialTheme.typography.headlineLarge,
        )
    }
}
