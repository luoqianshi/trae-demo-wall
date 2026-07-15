package com.kiddo.launcher.ui.home

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun AIEggCenter(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val pressScale by animateFloatAsState(if (pressed) 0.95f else 1f, label = "egg_press")
    val transition = rememberInfiniteTransition(label = "egg_pulse")
    val pulse by transition.animateFloat(
        initialValue = 0.88f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(1800),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "egg_pulse_scale",
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
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .size(width = 210.dp, height = 72.dp)
                .scale(pulse)
                .blur(22.dp)
                .background(
                    Brush.radialGradient(
                        listOf(KPink.copy(alpha = 0.58f), KGlowBlue.copy(alpha = 0.32f), Color.Transparent),
                    ),
                    CircleShape,
                ),
        )

        Image(
            painter = painterResource(LauncherResources.aiEgg),
            contentDescription = "AI蛋孵化中心",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Fit,
        )

        KGlassPanel(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .width(176.dp),
            radius = 18.dp,
            glow = KPink.copy(alpha = 0.34f),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("AI蛋孵化中心", color = KTextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
                Text("EGG HATCHING", color = KTextSecondary, fontSize = 8.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Box(
                    modifier = Modifier
                        .size(width = 112.dp, height = 5.dp)
                        .background(Color.White.copy(alpha = 0.14f), RoundedCornerShape(5.dp)),
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxHeight()
                            .width(67.dp)
                            .background(KPink, RoundedCornerShape(5.dp)),
                    )
                }
                Text("孵化值 60%", color = KTextSecondary, fontSize = 8.sp, textAlign = TextAlign.Center)
            }
        }
    }
}
