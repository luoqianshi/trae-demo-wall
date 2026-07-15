package com.kiddo.launcher.rest

import androidx.compose.foundation.Image
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
import com.kiddo.launcher.study.component.StudyProgressBar
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun BattleHome(
    state: RestUiState,
    onBack: () -> Unit,
    onEntryClick: (BattleEntry) -> Unit,
    onCloseWaiting: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize()) {
        Row(modifier = Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            PartnerTrainingPanel(state.partner, onBack, Modifier.width(430.dp).fillMaxSize())
            Column(modifier = Modifier.weight(1f).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(86.dp), radius = 28.dp, glow = StudyGlowBlue.copy(alpha = 0.20f)) {
                    Row(modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("AI伙伴训练馆", color = StudyTextPrimary, fontSize = 28.sp, fontWeight = FontWeight.Black)
                            Text("现在只展示页面，未来会开放自动回合制对战", color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Black)
                        }
                        RestPill("休息剩余 ${state.remainingTimeText}", StudyGlowGreen)
                    }
                }
                Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Column(modifier = Modifier.weight(1.15f), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        state.battleEntries.forEach { entry ->
                            BattleCard(entry = entry, onClick = { onEntryClick(entry) })
                        }
                        TrainingHintCard()
                    }
                    FutureRuleCard(notes = BattleRepository.futureRuleNotes(), modifier = Modifier.weight(0.85f))
                }
            }
        }

        state.waitingMessage?.let { message ->
            WaitingOverlay(message = message, onClose = onCloseWaiting)
        }
    }
}

@Composable
private fun PartnerTrainingPanel(
    partner: PartnerBattleSnapshot,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowPurple.copy(alpha = 0.28f)) {
        Column(modifier = Modifier.fillMaxSize().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                StudyMiniButton("返回休息区", StudyGlowPurple, onClick = onBack)
                Spacer(modifier = Modifier.weight(1f))
                RestPill("伙伴等级 ${partner.level}", StudyGlowOrange)
            }
            Spacer(modifier = Modifier.height(18.dp))
            Box(
                modifier = Modifier
                    .size(230.dp)
                    .clip(CircleShape)
                    .background(StudyGlowGreen.copy(alpha = 0.13f))
                    .border(1.dp, StudyGlowGreen.copy(alpha = 0.30f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Image(
                    painter = painterResource(partner.imageRes),
                    contentDescription = partner.name,
                    modifier = Modifier.size(190.dp),
                    contentScale = ContentScale.Fit,
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(partner.name, color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
            Text("儿童训练馆档案", color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(18.dp))
            BattleStat("生命值", partner.hp, StudyGlowGreen)
            BattleStat("亲密度", partner.intimacy, StudyGlowPink)
            Spacer(modifier = Modifier.height(14.dp))
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowBlue.copy(alpha = 0.16f)) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("技能", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    partner.skills.forEach { skill ->
                        Text(skill, color = StudyTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
private fun BattleStat(label: String, value: Int, accent: Color) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black)
            Text("$value/100", color = accent, fontSize = 13.sp, fontWeight = FontWeight.Black)
        }
        Spacer(modifier = Modifier.height(6.dp))
        StudyProgressBar(progress = value / 100f, color = accent, width = 350.dp)
        Spacer(modifier = Modifier.height(10.dp))
    }
}

@Composable
private fun TrainingHintCard() {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 24.dp, glow = StudyGlowGreen.copy(alpha = 0.18f)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("训练提醒", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text("这里不是手动战斗游戏。未来对战会由AI伙伴自动完成，孩子只负责坚持学习、照顾伙伴和保持好状态。", color = StudyTextSecondary, fontSize = 13.sp, lineHeight = 18.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun WaitingOverlay(
    message: String,
    onClose: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xB0051024)),
        contentAlignment = Alignment.Center,
    ) {
        StudyGlassPanel(modifier = Modifier.size(width = 380.dp, height = 210.dp), radius = 30.dp, glow = StudyGlowOrange.copy(alpha = 0.34f)) {
            Column(
                modifier = Modifier.fillMaxSize().padding(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text(message, color = StudyTextPrimary, fontSize = 28.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(10.dp))
                Text("训练馆接口已保留，后续可接入自动回合制系统。", color = StudyTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(18.dp))
                StudyMiniButton("知道啦", StudyGlowGreen, onClick = onClose)
            }
        }
    }
}
