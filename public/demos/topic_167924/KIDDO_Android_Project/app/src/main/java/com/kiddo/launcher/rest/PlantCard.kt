package com.kiddo.launcher.rest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyProgressBar
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun PlantCard(
    plot: FarmPlot,
    selectedTool: FarmTool,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = plot.plant?.accentColor() ?: Color(0xFF8BE6A8)
    val progress = plot.progress()
    StudyPressable(modifier = modifier, onClick = onClick) {
        StudyGlassPanel(
            modifier = Modifier.fillMaxSize(),
            radius = 18.dp,
            glow = accent.copy(alpha = 0.22f),
        ) {
            Box(modifier = Modifier.fillMaxSize().padding(10.dp)) {
                Box(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .fillMaxWidth()
                        .height(48.dp)
                        .clip(RoundedCornerShape(18.dp))
                        .background(Color(0xFF6C4B2E).copy(alpha = 0.58f))
                        .border(1.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(18.dp)),
                )
                Column(
                    modifier = Modifier.fillMaxSize(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.SpaceBetween,
                ) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = if (plot.empty) "空地" else plot.plant!!.label,
                            color = StudyTextPrimary,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Black,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            text = selectedTool.label,
                            color = accent,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(58.dp)
                            .clip(CircleShape)
                            .background(accent.copy(alpha = if (plot.empty) 0.10f else 0.22f))
                            .border(1.dp, accent.copy(alpha = 0.35f), CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            text = plot.plant?.shortLabel ?: "+",
                            color = if (plot.empty) StudyTextSecondary else accent,
                            fontSize = if (plot.empty) 28.sp else 24.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center,
                        )
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(plot.stageLabel(), color = accent, fontSize = 11.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(4.dp))
                        StudyProgressBar(progress = progress, color = accent, width = 82.dp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(plot.remainingLabel(), color = StudyTextSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                    }
                }
                if (plot.watered) MiniCareDot("水", StudyGlowBlue, Modifier.align(Alignment.BottomStart))
                if (plot.fertilized) MiniCareDot("肥", StudyGlowOrange, Modifier.align(Alignment.BottomEnd))
            }
        }
    }
}

@Composable
private fun MiniCareDot(text: String, color: Color, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(24.dp)
            .clip(CircleShape)
            .background(color.copy(alpha = 0.20f))
            .border(1.dp, color.copy(alpha = 0.36f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = color, fontSize = 9.sp, fontWeight = FontWeight.Black)
    }
}

fun PlantType.accentColor(): Color = when (this) {
    PlantType.Carrot -> StudyGlowOrange
    PlantType.Tomato -> StudyGlowPink
    PlantType.Corn -> StudyGlowBlue
    PlantType.Strawberry -> StudyGlowPurple
    PlantType.Pumpkin -> StudyGlowGreen
}

private fun FarmPlot.progress(): Float {
    val currentPlant = plant ?: return 0f
    if (mature) return 1f
    return 1f - (remainingSeconds.toFloat() / currentPlant.growSeconds.toFloat()).coerceIn(0f, 1f)
}
