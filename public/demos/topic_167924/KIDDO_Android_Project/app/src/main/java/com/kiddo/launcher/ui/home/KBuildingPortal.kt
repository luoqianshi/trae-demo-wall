package com.kiddo.launcher.ui.home

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun KBuildingPortal(
    title: String,
    subtitle: String,
    progressLabel: String,
    progress: Float,
    @DrawableRes buildingRes: Int,
    modifier: Modifier = Modifier,
    accent: Color = KGlowBlue,
    locked: Boolean = false,
    labelOffsetY: Dp = 0.dp,
    onClick: () -> Unit,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val pressScale by animateFloatAsState(if (pressed) 0.96f else 1f, label = "portal_press")
    val transition = rememberInfiniteTransition(label = "portal_float")
    val floatY by transition.animateFloat(
        initialValue = -4f,
        targetValue = 4f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2400),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "portal_float_y",
    )
    val pulse by transition.animateFloat(
        initialValue = 0.72f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "portal_pulse",
    )

    Box(
        modifier = modifier
            .scale(pressScale)
            .clickable(
                interactionSource = interactionSource,
                indication = ripple(bounded = false),
                onClick = onClick,
            ),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(LauncherResources.glowBlue),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxSize()
                .scale(1.18f * pulse)
                .blur(10.dp),
            contentScale = ContentScale.FillBounds,
            alpha = 0.52f,
            colorFilter = ColorFilter.tint(accent.copy(alpha = 0.86f)),
        )

        Image(
            painter = painterResource(buildingRes),
            contentDescription = title,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Fit,
        )

        if (locked) {
            Image(
                painter = painterResource(LauncherResources.locked),
                contentDescription = "locked",
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(48.dp),
                contentScale = ContentScale.Fit,
            )
        }

        PortalLabel(
            title = title,
            subtitle = subtitle,
            progressLabel = progressLabel,
            progress = progress,
            accent = accent,
            modifier = Modifier
                .align(Alignment.TopCenter)
                .offset(y = labelOffsetY + floatY.dp),
        )
    }
}

@Composable
private fun PortalLabel(
    title: String,
    subtitle: String,
    progressLabel: String,
    progress: Float,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    KGlassPanel(
        modifier = modifier.width(142.dp),
        radius = 16.dp,
        glow = accent.copy(alpha = 0.34f),
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = title,
                color = KTextPrimary,
                fontSize = 17.sp,
                fontWeight = FontWeight.Black,
                maxLines = 1,
                textAlign = TextAlign.Center,
            )
            Text(
                text = subtitle,
                color = KTextSecondary,
                fontSize = 8.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                textAlign = TextAlign.Center,
            )
            Spacer(modifier = Modifier.height(6.dp))
            KPortalProgress(
                progress = progress,
                color = accent,
                label = progressLabel,
            )
        }
    }
}

@Composable
private fun KPortalProgress(
    progress: Float,
    color: Color,
    label: String,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(width = 98.dp, height = 5.dp)
                .background(Color.White.copy(alpha = 0.14f), RoundedCornerShape(5.dp)),
        ) {
            Box(
                modifier = Modifier
                    .fillMaxHeight()
                    .width(98.dp * progress.coerceIn(0f, 1f))
                    .background(color, RoundedCornerShape(5.dp)),
            )
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = label,
            color = KTextSecondary,
            fontSize = 8.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
        )
    }
}
