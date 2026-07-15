package com.kiddo.launcher.ui.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween

object KiddoAnimation {
    val EnterEasing = CubicBezierEasing(0.2f, 0.0f, 0.0f, 1.0f)
    val BuildingEnter = tween<Float>(durationMillis = 520, easing = EnterEasing)
    val BuildingScale = tween<Float>(durationMillis = 560, easing = EnterEasing)
    const val EggPulseDurationMillis = 1_200
}
