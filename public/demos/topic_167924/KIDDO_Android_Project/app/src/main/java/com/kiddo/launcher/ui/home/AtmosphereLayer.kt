package com.kiddo.launcher.ui.home

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun AtmosphereLayer(
    modifier: Modifier = Modifier,
) {
    val transition = rememberInfiniteTransition(label = "atmosphere")
    val drift by transition.animateFloat(
        initialValue = -8f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 5200),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "particle_drift",
    )

    Box(modifier = modifier.fillMaxSize()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        0.0f to Color(0x9A020A24),
                        0.28f to Color.Transparent,
                        0.74f to Color.Transparent,
                        1.0f to Color(0x8F010716),
                    ),
                ),
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.radialGradient(
                        listOf(Color.Transparent, Color(0x52050A21)),
                    ),
                ),
        )

        Image(
            painter = painterResource(LauncherResources.fogBand),
            contentDescription = null,
            modifier = Modifier
                .offset(x = (-40).dp + drift.dp, y = 480.dp)
                .size(width = 680.dp, height = 90.dp),
            contentScale = ContentScale.FillBounds,
        )
        Image(
            painter = painterResource(LauncherResources.fogBand),
            contentDescription = null,
            modifier = Modifier
                .offset(x = 640.dp - drift.dp, y = 330.dp)
                .size(width = 520.dp, height = 72.dp),
            contentScale = ContentScale.FillBounds,
        )

        ParticleImage(x = 338.dp + drift.dp, y = 132.dp, size = 44.dp)
        ParticleImage(x = 632.dp - drift.dp, y = 188.dp, size = 28.dp)
        ParticleImage(x = 930.dp + drift.dp, y = 288.dp, size = 36.dp)
        ParticleImage(x = 1072.dp - drift.dp, y = 622.dp, size = 24.dp)
    }
}

@Composable
private fun ParticleImage(
    x: androidx.compose.ui.unit.Dp,
    y: androidx.compose.ui.unit.Dp,
    size: androidx.compose.ui.unit.Dp,
) {
    Image(
        painter = painterResource(LauncherResources.particle),
        contentDescription = null,
        modifier = Modifier
            .offset(x = x, y = y)
            .size(size),
        contentScale = ContentScale.Fit,
    )
}
