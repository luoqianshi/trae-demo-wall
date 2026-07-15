package com.kiddo.launcher.aipartner

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun PsychologyScreen(
    state: PartnerState,
    onRecordMood: (String) -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        PartnerSectionTitle("心理陪伴", "儿童情绪陪伴，不做医疗诊断")
        PartnerActionCard(
            title = "今天开心吗？",
            body = "记录开心的事情，让伙伴记住你的闪光时刻。",
            accent = StudyGlowGreen,
            onClick = { onRecordMood("开心") },
        )
        PartnerActionCard(
            title = "有点难过",
            body = "伙伴会陪你说说发生了什么，并提醒你可以找家长或老师。",
            accent = StudyGlowBlue,
            onClick = { onRecordMood("有点难过") },
        )
        PartnerActionCard(
            title = "需要鼓励",
            body = "当任务有点难时，伙伴会帮你把目标拆小。",
            accent = StudyGlowPink,
            onClick = { onRecordMood("需要鼓励") },
        )
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            StatusPill("心情 ${state.stats.mood}", StudyGlowOrange)
            StatusPill("亲密度 ${state.stats.intimacy}", StudyGlowPink)
        }
        Text(
            "记录会进入成长日记，形成长期陪伴报告。",
            color = StudyTextSecondary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}
