package com.kiddo.launcher.rest

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyMiniButton
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun FarmScreen(
    state: RestUiState,
    onBack: () -> Unit,
    onSelectTool: (FarmTool) -> Unit,
    onSelectPlant: (PlantType) -> Unit,
    onPlotClick: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize().background(Color(0xFF8EDAF7))) {
        Image(
            painter = painterResource(LauncherResources.farmHouseDemo),
            contentDescription = "种植小屋演示",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Fit,
        )
        Box(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = 18.dp, top = 18.dp)
                .size(width = 250.dp, height = 112.dp)
                .clickable(onClick = onBack),
        )
    }
}

@Composable
private fun FarmTopBar(state: RestUiState) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(78.dp), radius = 26.dp, glow = StudyGlowBlue.copy(alpha = 0.20f)) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("小屋计时", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.width(14.dp))
            RestPill("剩余 ${state.remainingTimeText}", StudyGlowGreen)
            Spacer(modifier = Modifier.width(10.dp))
            RestPill("当前工具 ${state.selectedTool.label}", StudyGlowOrange)
            Spacer(modifier = Modifier.weight(1f))
            Text("成熟后点收获，奖励会进入AI伙伴成长系统", color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun PlantPicker(
    selectedPlant: PlantType,
    onSelectPlant: (PlantType) -> Unit,
) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowGreen.copy(alpha = 0.18f)) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("选择种子", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
            PlantType.entries.forEach { plant ->
                val active = plant == selectedPlant
                StudyPressable(onClick = { onSelectPlant(plant) }) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (active) plant.accentColor().copy(alpha = 0.20f) else Color.White.copy(alpha = 0.06f))
                            .border(1.dp, plant.accentColor().copy(alpha = if (active) 0.42f else 0.12f), RoundedCornerShape(16.dp))
                            .padding(horizontal = 12.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            modifier = Modifier.size(28.dp).clip(CircleShape).background(plant.accentColor().copy(alpha = 0.20f)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(plant.shortLabel, color = plant.accentColor(), fontSize = 13.sp, fontWeight = FontWeight.Black)
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(plant.label, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black)
                            Text("+${plant.coinReward} 金币 · +${plant.expReward} 经验", color = StudyTextSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun FarmToolBar(
    selectedTool: FarmTool,
    onSelectTool: (FarmTool) -> Unit,
) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(82.dp), radius = 28.dp, glow = StudyGlowPurple.copy(alpha = 0.22f)) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            FarmTool.entries.forEach { tool ->
                ToolButton(
                    tool = tool,
                    active = tool == selectedTool,
                    onClick = { onSelectTool(tool) },
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun ToolButton(
    tool: FarmTool,
    active: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = when (tool) {
        FarmTool.Plant -> StudyGlowGreen
        FarmTool.Water -> StudyGlowBlue
        FarmTool.Fertilize -> StudyGlowOrange
        FarmTool.Harvest -> StudyGlowPink
    }
    StudyPressable(modifier = modifier, onClick = onClick) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .clip(RoundedCornerShape(18.dp))
                .background(if (active) accent.copy(alpha = 0.26f) else Color.White.copy(alpha = 0.06f))
                .border(1.dp, accent.copy(alpha = if (active) 0.46f else 0.16f), RoundedCornerShape(18.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(tool.label, color = if (active) accent else StudyTextSecondary, fontSize = 15.sp, fontWeight = FontWeight.Black)
        }
    }
}
