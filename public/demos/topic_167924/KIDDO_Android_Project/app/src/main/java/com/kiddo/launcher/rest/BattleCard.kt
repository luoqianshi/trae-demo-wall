package com.kiddo.launcher.rest

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun BattleCard(
    entry: BattleEntry,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = if (entry.id == "npc") StudyGlowGreen else StudyGlowBlue
    StudyPressable(modifier = modifier, onClick = onClick) {
        StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 24.dp, glow = accent.copy(alpha = 0.24f)) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(
                    modifier = Modifier
                        .size(62.dp)
                        .clip(CircleShape)
                        .background(accent.copy(alpha = 0.18f))
                        .border(1.dp, accent.copy(alpha = 0.36f), CircleShape),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text(if (entry.id == "npc") "练" else "友", color = accent, fontSize = 22.sp, fontWeight = FontWeight.Black)
                }
                Spacer(modifier = Modifier.width(14.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(entry.title, color = StudyTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
                    Text(entry.subtitle, color = StudyTextSecondary, fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.Bold)
                }
                Text(
                    entry.tag,
                    color = StudyGlowOrange,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier
                        .clip(RoundedCornerShape(99.dp))
                        .background(StudyGlowOrange.copy(alpha = 0.14f))
                        .border(1.dp, StudyGlowOrange.copy(alpha = 0.32f), RoundedCornerShape(99.dp))
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                )
            }
        }
    }
}

@Composable
fun FutureRuleCard(
    notes: List<String>,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.fillMaxHeight(), radius = 24.dp, glow = StudyGlowOrange.copy(alpha = 0.18f)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("未来规则", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
            notes.forEach { note ->
                Text("• $note", color = StudyTextSecondary, fontSize = 12.sp, lineHeight = 17.sp, fontWeight = FontWeight.Bold)
            }
            Text(
                "本阶段只开放页面，不启动真正战斗。",
                color = Color.White.copy(alpha = 0.72f),
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}
