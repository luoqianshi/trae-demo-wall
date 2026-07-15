package com.kiddo.launcher.ui.home

import androidx.annotation.DrawableRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun KProfileHud(
    modifier: Modifier = Modifier,
) {
    KGlassPanel(modifier = modifier, radius = 28.dp) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Image(
                painter = painterResource(LauncherResources.avatar),
                contentDescription = "avatar",
                modifier = Modifier
                    .size(50.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop,
            )
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text("小奇同学", color = KTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("等级 12", color = KTextPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.width(8.dp))
                    KMiniProgress(progress = 0.62f, width = 72.dp, color = KGlowBlue)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("1250/2000", color = KTextSecondary, fontSize = 8.sp)
                }
            }
        }
    }
}

@Composable
fun KHudMetric(
    title: String,
    value: String,
    @DrawableRes iconRes: Int,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    KGlassPanel(modifier = modifier, radius = 18.dp, glow = tint.copy(alpha = 0.28f)) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Image(
                painter = painterResource(iconRes),
                contentDescription = title,
                modifier = Modifier.size(32.dp),
                contentScale = ContentScale.Fit,
            )
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(title, color = KTextPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                Text(value, color = tint, fontSize = 22.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
fun KGoalHud(
    modifier: Modifier = Modifier,
) {
    KGlassPanel(modifier = modifier, radius = 20.dp) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("今日目标", color = KTextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.weight(1f))
                Text("↗", color = KTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
            KGoalLine("学习时长", "120/180分钟", KGlowBlue)
            KGoalLine("觉醒任务", "3/5", KGreen)
            KGoalLine("知识闯关", "2/3", KOrange)
        }
    }
}

@Composable
private fun KGoalLine(
    title: String,
    value: String,
    color: Color,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .clip(CircleShape)
                .background(color),
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(title, color = KTextSecondary, fontSize = 10.sp)
        Spacer(modifier = Modifier.width(6.dp))
        Text(value, color = KTextPrimary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun KMiniProgress(
    progress: Float,
    width: androidx.compose.ui.unit.Dp,
    color: Color,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .size(width = width, height = 6.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(Color.White.copy(alpha = 0.14f)),
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(width * progress.coerceIn(0f, 1f))
                .clip(RoundedCornerShape(6.dp))
                .background(color),
        )
    }
}
