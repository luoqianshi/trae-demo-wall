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
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun AIQuestionScreen(
    state: PartnerState,
    onAsk: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        PartnerSectionTitle("AI问答", "老师朋友式引导，不直接给答案")
        PartnerActionCard(
            title = "数学不会",
            body = "先圈出题目条件，再判断求整体、求部分，还是做比较。",
            accent = StudyGlowBlue,
            onClick = onAsk,
        )
        PartnerActionCard(
            title = "英语不会",
            body = "伙伴会先帮你找关键词和句子结构，再鼓励你试着表达。",
            accent = StudyGlowGreen,
            onClick = onAsk,
        )
        PartnerActionCard(
            title = "错题引导",
            body = "连接错题本，先问第一步，再生成同类练习。",
            accent = StudyGlowOrange,
            onClick = onAsk,
        )
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            StatusPill("知识力 ${state.stats.knowledge}", StudyGlowBlue)
            StatusPill("学习陪伴 ${state.today.studyCompanionCount}", StudyGlowPurple)
        }
        Text(
            "未来这里可接入真实 AI 接口；当前先保留儿童友好、引导式教学流程。",
            color = StudyTextSecondary,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
        )
    }
}
