package com.kiddo.launcher.ui.home

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

internal val HomeDesignWidth = 1280.dp
internal val HomeDesignHeight = 800.dp

internal fun Int.ds(scale: Float): Dp = (this * scale).dp
