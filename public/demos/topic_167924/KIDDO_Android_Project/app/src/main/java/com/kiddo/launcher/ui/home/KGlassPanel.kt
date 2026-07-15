package com.kiddo.launcher.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

internal val KGlassBlue = Color(0x8C0A1946)
internal val KGlassBlueDeep = Color(0xA0061034)
internal val KGlassStroke = Color.White.copy(alpha = 0.20f)
internal val KGlowBlue = Color(0xFF55C8FF)
internal val KGlowPurple = Color(0xFFA56BFF)
internal val KTextPrimary = Color.White
internal val KTextSecondary = Color(0xCFE4F2FF)
internal val KGreen = Color(0xFF78F6A0)
internal val KOrange = Color(0xFFFFBE63)
internal val KPink = Color(0xFFFF7DF0)

@Composable
fun KGlassPanel(
    modifier: Modifier = Modifier,
    radius: Dp = 24.dp,
    glow: Color = KGlowBlue.copy(alpha = 0.28f),
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = RoundedCornerShape(radius)
    Box(
        modifier = modifier
            .shadow(
                elevation = 18.dp,
                shape = shape,
                ambientColor = glow,
                spotColor = glow,
            )
            .background(
                brush = Brush.verticalGradient(
                    listOf(
                        Color.White.copy(alpha = 0.08f),
                        KGlassBlue,
                        KGlassBlueDeep,
                    ),
                ),
                shape = shape,
            )
            .border(1.dp, KGlassStroke, shape)
            .padding(1.dp),
        content = content,
    )
}
