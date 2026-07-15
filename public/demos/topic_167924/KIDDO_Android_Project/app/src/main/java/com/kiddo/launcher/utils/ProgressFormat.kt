package com.kiddo.launcher.utils

import kotlin.math.roundToInt

fun Float.toPercentText(): String = "${(coerceIn(0f, 1f) * 100).roundToInt()}%"
