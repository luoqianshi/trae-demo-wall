package com.kiddo.launcher.wrongbook

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
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
fun WrongBookHome(
    viewModel: WrongBookViewModel,
    onBack: () -> Unit,
    onOpenQuest: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsState()
    WrongBookHomeContent(
        uiState = uiState,
        onBack = onBack,
        onSubject = viewModel::selectSubject,
        onOpenQuest = {
            viewModel.openQuest(it)
            onOpenQuest(it)
        },
        modifier = modifier,
    )
}

@Composable
private fun WrongBookHomeContent(
    uiState: WrongBookUiState,
    onBack: () -> Unit,
    onSubject: (WrongSubject) -> Unit,
    onOpenQuest: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        WrongBookBackground()
        StudyGlassPanel(
            modifier = Modifier.size(width = 1136.dp, height = 714.dp),
            radius = 34.dp,
            glow = StudyGlowPurple.copy(alpha = 0.30f),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                SubjectRail(
                    uiState = uiState,
                    onBack = onBack,
                    onSubject = onSubject,
                    modifier = Modifier
                        .width(220.dp)
                        .fillMaxHeight(),
                )
                QuestBoard(
                    uiState = uiState,
                    onOpenQuest = onOpenQuest,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                )
                GrowthGatePanel(
                    uiState = uiState,
                    modifier = Modifier
                        .width(290.dp)
                        .fillMaxHeight(),
                )
            }
        }
    }
}

@Composable
private fun SubjectRail(
    uiState: WrongBookUiState,
    onBack: () -> Unit,
    onSubject: (WrongSubject) -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 30.dp, glow = StudyGlowBlue.copy(alpha = 0.22f)) {
        Column(modifier = Modifier.padding(18.dp)) {
            StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
            Spacer(modifier = Modifier.height(18.dp))
            Text("错题本", color = StudyTextPrimary, fontSize = 27.sp, fontWeight = FontWeight.Black)
            Text("AI 智能错题成长系统", color = StudyGlowBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(20.dp))
            uiState.subjects.forEach { subject ->
                val selected = subject == uiState.selectedSubject
                StudyPressable(onClick = { onSubject(subject) }) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(18.dp))
                            .background(if (selected) StudyGlowBlue.copy(alpha = 0.22f) else Color.White.copy(alpha = 0.06f))
                            .border(1.dp, if (selected) StudyGlowBlue.copy(alpha = 0.52f) else Color.White.copy(alpha = 0.10f), RoundedCornerShape(18.dp))
                            .padding(14.dp),
                    ) {
                        Text(subject.title, color = if (selected) StudyTextPrimary else StudyTextSecondary, fontSize = 15.sp, fontWeight = FontWeight.Black)
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
            }
        }
    }
}

@Composable
private fun QuestBoard(
    uiState: WrongBookUiState,
    onOpenQuest: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowGreen.copy(alpha = 0.22f)) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("错题任务板", color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
                    Text("学习任务，不是错题列表", color = StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Black)
                }
                QuestSummary(uiState)
            }
            Spacer(modifier = Modifier.height(18.dp))
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                uiState.visibleQuests.forEach { item ->
                    QuestCard(
                        item = item,
                        selected = uiState.selectedQuest?.id == item.id,
                        onClick = { onOpenQuest(item.id) },
                    )
                }
                if (uiState.visibleQuests.isEmpty()) {
                    Text("当前学科没有必修错题任务。", color = StudyTextSecondary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun QuestSummary(uiState: WrongBookUiState) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        SummaryChip("待完成", "${uiState.requiredQuestCount}", StudyGlowOrange)
        SummaryChip("娱乐", if (uiState.entertainmentLocked) "锁定" else "解锁", if (uiState.entertainmentLocked) StudyGlowOrange else StudyGlowGreen)
    }
}

@Composable
private fun GrowthGatePanel(uiState: WrongBookUiState, modifier: Modifier = Modifier) {
    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowPink.copy(alpha = 0.22f)) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text("成长权限", color = StudyTextPrimary, fontSize = 25.sp, fontWeight = FontWeight.Black)
            Text("错题任务完成后恢复娱乐权限", color = StudyGlowPink, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(18.dp))
            GateRow("游戏区", uiState.entertainmentLocked)
            GateRow("休息区", uiState.entertainmentLocked)
            GateRow("AI伙伴成长", false)
            GateRow("学习金币", false)
            Spacer(modifier = Modifier.height(18.dp))
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 24.dp, glow = StudyGlowGreen.copy(alpha = 0.22f)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("完成奖励", color = StudyGlowGreen, fontSize = 13.sp, fontWeight = FontWeight.Black)
                    Text("+${uiState.reward.growthExp} 成长经验", color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text("+${uiState.reward.learningCoins} 学习金币", color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text("+${uiState.reward.aiPartnerExp} 伙伴经验值", color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    Text(uiState.reward.badgeName, color = StudyGlowOrange, fontSize = 15.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
private fun GateRow(title: String, locked: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
        Text(if (locked) "锁定" else "开放", color = if (locked) StudyGlowOrange else StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun SummaryChip(label: String, value: String, accent: Color) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(18.dp))
            .background(accent.copy(alpha = 0.14f))
            .border(1.dp, accent.copy(alpha = 0.32f), RoundedCornerShape(18.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(label, color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        Text(value, color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
fun WrongBookBackground() {
    Image(
        painter = painterResource(LauncherResources.background),
        contentDescription = null,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Crop,
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xEE03081F),
                        Color(0xC0071740),
                        Color(0xEE050B2A),
                    ),
                ),
            ),
    )
}
