package com.kiddo.launcher.wrongbook

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun QuestCard(
    item: WrongItem,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val accent = when (item.status) {
        WrongQuestStatus.NEW -> StudyGlowOrange
        WrongQuestStatus.PRACTICING -> StudyGlowBlue
        WrongQuestStatus.MASTERING -> StudyGlowPurple
        WrongQuestStatus.MASTERED -> StudyGlowGreen
    }
    StudyPressable(onClick = onClick, modifier = modifier) {
        StudyGlassPanel(
            modifier = Modifier
                .fillMaxWidth()
                .border(
                    1.dp,
                    if (selected) accent.copy(alpha = 0.72f) else Color.White.copy(alpha = 0.10f),
                    RoundedCornerShape(22.dp),
                ),
            radius = 22.dp,
            glow = accent.copy(alpha = if (selected) 0.34f else 0.18f),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                KnowledgeProgressRing(progress = item.masteryRate, size = 72.dp)
                Column(modifier = Modifier.weight(1f)) {
                    Text(item.knowledgePoint, color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        QuestPill(item.status.label, accent)
                        QuestPill(item.currentStage.title, StudyGlowBlue)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        QuestMetric("错误", "${item.wrongCount}次")
                        QuestMetric("AI", "${item.aiHelpCount}次")
                        QuestMetric("挑战", "第${item.challengeCount + 1}关")
                    }
                    Text(
                        text = if (item.lastPracticeTime == null) "最近练习：等待首次挑战" else "最近练习：刚刚",
                        color = StudyTextSecondary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }
    }
}

@Composable
private fun QuestMetric(label: String, value: String) {
    Column {
        Text(label, color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text(value, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun QuestPill(text: String, accent: Color) {
    Text(
        text = text,
        color = StudyTextPrimary,
        fontSize = 10.sp,
        fontWeight = FontWeight.Black,
        modifier = Modifier
            .clip(RoundedCornerShape(99.dp))
            .background(accent.copy(alpha = 0.18f))
            .border(1.dp, accent.copy(alpha = 0.36f), RoundedCornerShape(99.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}
