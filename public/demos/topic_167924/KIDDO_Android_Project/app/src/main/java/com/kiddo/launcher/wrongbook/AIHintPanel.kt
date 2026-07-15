package com.kiddo.launcher.wrongbook

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.RobotHead
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyMiniButton
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun AIHintPanel(
    quest: WrongItem?,
    message: String,
    showFullAnalysis: Boolean,
    onHint: () -> Unit,
    onLecture: () -> Unit,
    onReason: () -> Unit,
    onTransfer: () -> Unit,
    onRevealAnswer: () -> Unit,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.fillMaxHeight(), radius = 30.dp, glow = StudyGlowPurple.copy(alpha = 0.30f)) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .padding(18.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                RobotHead(modifier = Modifier.size(66.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text("AI 助手", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                    Text("先引导思路，再按需查看解析", color = StudyGlowBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
                StudyMiniButton("收起", StudyGlowPurple, onClick = onDismiss)
            }

            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowBlue.copy(alpha = 0.20f)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("助手回应", color = StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(message, color = StudyTextPrimary, fontSize = 16.sp, lineHeight = 23.sp, fontWeight = FontWeight.Bold)
                }
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    StudyMiniButton("逐步提示", StudyGlowBlue, modifier = Modifier.weight(1f), onClick = onHint)
                    StudyMiniButton("知识讲解", StudyGlowGreen, modifier = Modifier.weight(1f), onClick = onLecture)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    StudyMiniButton("思维引导", StudyGlowPurple, modifier = Modifier.weight(1f), onClick = onHint)
                    StudyMiniButton("错因分析", StudyGlowOrange, modifier = Modifier.weight(1f), onClick = onReason)
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    StudyMiniButton("举一反三", StudyGlowPink, modifier = Modifier.weight(1f), onClick = onTransfer)
                    StudyMiniButton("查看答案", StudyGlowOrange, modifier = Modifier.weight(1f), onClick = onRevealAnswer)
                }
            }

            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowOrange.copy(alpha = 0.18f)) {
                Column(modifier = Modifier.padding(15.dp)) {
                    Text("使用提醒", color = StudyGlowOrange, fontSize = 12.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "点提示、讲解或查看答案会记录一次 AI 帮助；掌握仍以独立完成挑战链为准。",
                        color = StudyTextSecondary,
                        fontSize = 12.sp,
                        lineHeight = 18.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            Spacer(modifier = Modifier.weight(1f))
            if (showFullAnalysis && quest != null) {
                Text("完整解析：${quest.currentPractice.analysis}", color = StudyTextPrimary, fontSize = 13.sp, lineHeight = 19.sp, fontWeight = FontWeight.Bold)
                Text("答案：${quest.currentPractice.answer}", color = StudyGlowGreen, fontSize = 13.sp, fontWeight = FontWeight.Black)
            } else {
                Text("需要完整解析时，可主动查看答案。", color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
