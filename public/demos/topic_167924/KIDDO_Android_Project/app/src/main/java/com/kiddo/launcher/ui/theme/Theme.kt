package com.kiddo.launcher.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val KiddoColorScheme = darkColorScheme(
    primary = KiddoSun,
    onPrimary = KiddoInk,
    secondary = KiddoAqua,
    onSecondary = KiddoInk,
    tertiary = KiddoCoral,
    onTertiary = KiddoWhite,
    background = KiddoNight,
    onBackground = KiddoWhite,
    surface = KiddoPanelDark,
    onSurface = KiddoWhite,
    surfaceVariant = KiddoPanel,
    onSurfaceVariant = KiddoInk,
    outline = Color.White.copy(alpha = 0.34f),
)

@Composable
fun KiddoLauncherTheme(
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = KiddoColorScheme,
        typography = KiddoTypography,
        content = content,
    )
}
