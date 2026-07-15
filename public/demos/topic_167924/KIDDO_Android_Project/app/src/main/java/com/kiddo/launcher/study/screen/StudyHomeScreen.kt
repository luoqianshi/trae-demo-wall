package com.kiddo.launcher.study.screen

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.AiRecommendationPanel
import com.kiddo.launcher.study.component.RecentStudyPanel
import com.kiddo.launcher.study.component.RobotHead
import com.kiddo.launcher.study.component.StageBuildingCard
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyMiniButton
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudySidebarRobot
import com.kiddo.launcher.study.component.StudyStatChip
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary
import com.kiddo.launcher.study.component.SubjectIcon
import com.kiddo.launcher.study.model.StudyHomeEvent
import com.kiddo.launcher.study.model.StudyHomeUiState
import com.kiddo.launcher.study.viewmodel.StudyHomeViewModel
import com.kiddo.launcher.ui.LauncherResources
import kotlin.math.min

private val StudyDesignWidth = 1280.dp
private val StudyDesignHeight = 800.dp

private fun Int.sdp(scale: Float): Dp = (this * scale).dp

@Composable
fun StudyHomeScreen(
    viewModel: StudyHomeViewModel,
    onOpenCourse: () -> Unit,
    onOpenWrongBook: () -> Unit = {},
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsState()

    StudyHomeContent(
        uiState = uiState,
        onEvent = viewModel::onEvent,
        onOpenCourse = onOpenCourse,
        onOpenWrongBook = onOpenWrongBook,
        onBack = onBack,
        modifier = modifier,
    )
}

@Composable
private fun StudyHomeContent(
    uiState: StudyHomeUiState,
    onEvent: (StudyHomeEvent) -> Unit,
    onOpenCourse: () -> Unit,
    onOpenWrongBook: () -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val configuration = LocalConfiguration.current
    val scale = min(
        configuration.screenWidthDp / StudyDesignWidth.value,
        configuration.screenHeightDp / StudyDesignHeight.value,
    )

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        StudyBackground()
        Box(modifier = Modifier.size(StudyDesignWidth * scale, StudyDesignHeight * scale)) {
            StudySidebar(
                uiState = uiState,
                modifier = Modifier
                    .offset(x = 18.sdp(scale), y = 22.sdp(scale))
                    .size(width = 168.sdp(scale), height = 754.sdp(scale)),
                onEvent = onEvent,
                onBack = onBack,
            )

            StudyTopStats(
                uiState = uiState,
                modifier = Modifier.offset(x = 216.sdp(scale), y = 24.sdp(scale)),
                scale = scale,
            )

            StudyMainPanel(
                uiState = uiState,
                modifier = Modifier
                    .offset(x = 216.sdp(scale), y = 112.sdp(scale))
                    .size(width = 710.sdp(scale), height = 664.sdp(scale)),
                onEvent = onEvent,
                onOpenCourse = onOpenCourse,
                onOpenWrongBook = onOpenWrongBook,
            )

            AiRecommendationPanel(
                items = uiState.recommendations,
                modifier = Modifier
                    .offset(x = 948.sdp(scale), y = 112.sdp(scale))
                    .size(width = 312.sdp(scale), height = 318.sdp(scale)),
                onClick = {
                    onEvent(StudyHomeEvent.SelectRecommendation(it.title))
                    onOpenCourse()
                },
            )

            StudyRightStatus(
                modifier = Modifier
                    .offset(x = 948.sdp(scale), y = 442.sdp(scale))
                    .size(width = 312.sdp(scale), height = 136.sdp(scale)),
            )

            RecentStudyPanel(
                items = uiState.recentItems,
                modifier = Modifier
                    .offset(x = 948.sdp(scale), y = 596.sdp(scale))
                    .size(width = 312.sdp(scale), height = 180.sdp(scale)),
                onClick = {
                    onEvent(StudyHomeEvent.SelectRecent(it.title))
                    onOpenCourse()
                },
            )
        }
    }
}

@Composable
private fun StudyBackground() {
    Box(modifier = Modifier.fillMaxSize()) {
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
                            Color(0xDD020A24),
                            Color(0x99091942),
                            Color(0xE006102A),
                        ),
                    ),
                ),
        )
        Image(
            painter = painterResource(LauncherResources.glowBlue),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.Center)
                .size(760.dp)
                .blur(28.dp),
            alpha = 0.22f,
            contentScale = ContentScale.FillBounds,
        )
        Image(
            painter = painterResource(LauncherResources.glowPink),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(620.dp)
                .blur(28.dp),
            alpha = 0.16f,
            contentScale = ContentScale.FillBounds,
        )
    }
}

@Composable
private fun StudySidebar(
    uiState: StudyHomeUiState,
    modifier: Modifier = Modifier,
    onEvent: (StudyHomeEvent) -> Unit,
    onBack: () -> Unit,
) {
    val navItems = listOf("学习中心", "AI助手", "错题本", "学习记录", "设置")
    StudyGlassPanel(modifier = modifier, radius = 30.dp, glow = StudyGlowPurple.copy(alpha = 0.26f)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            StudyMiniButton(
                text = "返回主页",
                accent = StudyGlowPurple,
                modifier = Modifier.fillMaxWidth(),
                onClick = onBack,
            )
            Spacer(modifier = Modifier.height(12.dp))
            Image(
                painter = painterResource(LauncherResources.avatar),
                contentDescription = "avatar",
                modifier = Modifier
                    .size(66.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop,
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(uiState.studentName, color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
            Text(uiState.level, color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(22.dp))
            navItems.forEach { item ->
                StudyNavItem(
                    title = item,
                    selected = uiState.selectedNavItem == item,
                    onClick = { onEvent(StudyHomeEvent.SelectNav(item)) },
                )
                Spacer(modifier = Modifier.height(10.dp))
            }
            Spacer(modifier = Modifier.weight(1f))
            StudySidebarRobot(modifier = Modifier.fillMaxWidth())
        }
    }
}

@Composable
private fun StudyNavItem(
    title: String,
    selected: Boolean,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = Modifier.fillMaxWidth(), onClick = onClick) {
        val accent = if (selected) StudyGlowBlue else Color.White.copy(alpha = 0.18f)
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(18.dp))
                .background(
                    if (selected) {
                        Brush.horizontalGradient(listOf(StudyGlowBlue.copy(alpha = 0.32f), StudyGlowPurple.copy(alpha = 0.18f)))
                    } else {
                        Brush.horizontalGradient(listOf(Color.White.copy(alpha = 0.06f), Color.White.copy(alpha = 0.03f)))
                    },
                )
                .padding(horizontal = 12.dp, vertical = 11.dp),
        ) {
            Text(title, color = if (selected) StudyTextPrimary else StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Box(
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(accent),
            )
        }
    }
}

@Composable
private fun StudyTopStats(
    uiState: StudyHomeUiState,
    modifier: Modifier = Modifier,
    scale: Float,
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(14.sdp(scale)),
    ) {
        val colors = listOf(StudyGlowGreen, StudyGlowBlue, StudyGlowOrange)
        uiState.stats.forEachIndexed { index, stat ->
            StudyStatChip(
                stat = stat,
                accent = colors[index % colors.size],
                modifier = Modifier.size(width = 220.sdp(scale), height = 74.sdp(scale)),
            )
        }
    }
}

@Composable
private fun StudyMainPanel(
    uiState: StudyHomeUiState,
    modifier: Modifier = Modifier,
    onEvent: (StudyHomeEvent) -> Unit,
    onOpenCourse: () -> Unit,
    onOpenWrongBook: () -> Unit,
) {
    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowBlue.copy(alpha = 0.26f)) {
        when (uiState.selectedNavItem) {
            "AI助手" -> StudyAiAssistantPage(onOpenCourse = onOpenCourse)
            "错题本" -> StudyWrongBookPage(onOpenWrongBook = onOpenWrongBook)
            "学习记录" -> StudyRecordPage(uiState = uiState)
            "设置" -> StudySettingPage()
            else -> StudyCenterPage(
                uiState = uiState,
                onEvent = onEvent,
                onOpenCourse = onOpenCourse,
            )
        }
    }
}

@Composable
private fun StudyCenterPage(
    uiState: StudyHomeUiState,
    onEvent: (StudyHomeEvent) -> Unit,
    onOpenCourse: () -> Unit,
) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
        ) {
            Row(verticalAlignment = Alignment.Bottom) {
                Column {
                    Text("选择学习阶段", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                    Text("让 AI 根据年级自动规划成长路线", color = StudyTextSecondary, fontSize = 11.sp)
                }
                Spacer(modifier = Modifier.weight(1f))
                Text("KIDDO STUDY CENTER", color = StudyGlowBlue, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                val colors = listOf(StudyGlowBlue, StudyGlowGreen, StudyGlowOrange)
                uiState.stages.forEachIndexed { index, stage ->
                    StageBuildingCard(
                        stage = stage,
                        accent = colors[index % colors.size],
                        modifier = Modifier
                            .weight(1f)
                            .height(196.dp),
                        onClick = {
                            onEvent(StudyHomeEvent.SelectStage(stage.id))
                            onOpenCourse()
                        },
                        onStartClick = {
                            onEvent(StudyHomeEvent.StartStage(stage.id))
                            onOpenCourse()
                        },
                    )
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
            Text("选择学科", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
            Text("进入对应学科星球，完成今日任务", color = StudyTextSecondary, fontSize = 10.sp)
            Spacer(modifier = Modifier.height(12.dp))
            SubjectGrid(
                subjects = uiState.subjects,
                onEvent = onEvent,
                onOpenCourse = onOpenCourse,
            )
        }
}

@Composable
private fun StudyAiAssistantPage(
    onOpenCourse: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            RobotHead(modifier = Modifier.size(88.dp))
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("AI学习助手", color = StudyTextPrimary, fontSize = 28.sp, fontWeight = FontWeight.Black)
                Text("遇到不会的地方，先引导思路，再陪你继续学。", color = StudyGlowBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
            StudyMiniButton("继续课程", StudyGlowGreen, onClick = onOpenCourse)
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            StudyActionCard("讲一讲", "把今天的知识点变成小故事", StudyGlowBlue, Modifier.weight(1f))
            StudyActionCard("练一练", "根据薄弱点生成小练习", StudyGlowGreen, Modifier.weight(1f))
            StudyActionCard("问一问", "只提示思路，不直接给答案", StudyGlowPurple, Modifier.weight(1f))
        }
        StudyGlassPanel(modifier = Modifier.fillMaxWidth().weight(1f), radius = 26.dp, glow = StudyGlowBlue.copy(alpha = 0.18f)) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("小K老师说", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                Text("今天建议先完成数学星球的分数练习，再去错题本清理一题。这样AI伙伴会获得更多成长能量。", color = StudyTextSecondary, fontSize = 15.sp, lineHeight = 22.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.weight(1f))
                Text("学习 → 掌握 → 伙伴成长", color = StudyGlowGreen, fontSize = 14.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun StudyWrongBookPage(
    onOpenWrongBook: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("错题能量站", color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
        Text("不是惩罚，是把没掌握的地方变成成长任务。", color = StudyGlowOrange, fontSize = 13.sp, fontWeight = FontWeight.Black)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            StudyActionCard("待清理", "2 个小任务", StudyGlowOrange, Modifier.weight(1f))
            StudyActionCard("掌握进度", "60%", StudyGlowGreen, Modifier.weight(1f))
            StudyActionCard("伙伴奖励", "+35 金币", StudyGlowPurple, Modifier.weight(1f))
        }
        StudyGlassPanel(modifier = Modifier.fillMaxWidth().weight(1f), radius = 26.dp, glow = StudyGlowOrange.copy(alpha = 0.18f)) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("推荐挑战", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                Text("分数乘法核心题", color = StudyGlowOrange, fontSize = 17.sp, fontWeight = FontWeight.Black)
                Text("先独立完成，再让AI讲解错因。独立掌握后会解锁更多休息与成长奖励。", color = StudyTextSecondary, fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.weight(1f))
                StudyMiniButton("开始挑战", StudyGlowOrange, onClick = onOpenWrongBook)
            }
        }
    }
}

@Composable
private fun StudyRecordPage(uiState: StudyHomeUiState) {
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("学习记录", color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
        Text("记录每一次认真学习，给孩子看得见的成长感。", color = StudyGlowGreen, fontSize = 13.sp, fontWeight = FontWeight.Black)
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            uiState.stats.forEachIndexed { index, stat ->
                val accent = listOf(StudyGlowGreen, StudyGlowBlue, StudyGlowOrange)[index % 3]
                StudyActionCard(stat.title, stat.value, accent, Modifier.weight(1f))
            }
        }
        StudyGlassPanel(modifier = Modifier.fillMaxWidth().weight(1f), radius = 26.dp, glow = StudyGlowGreen.copy(alpha = 0.18f)) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("最近完成", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                uiState.recentItems.forEach { item ->
                    Text("${item.type} · ${item.title}", color = StudyTextSecondary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun StudySettingPage() {
    Column(modifier = Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("学习设置", color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
        Text("这里先展示儿童学习机的学习节奏设置，后续可接入家长端。", color = StudyGlowPurple, fontSize = 13.sp, fontWeight = FontWeight.Black)
        StudyActionCard("今日目标", "120 分钟", StudyGlowGreen, Modifier.fillMaxWidth())
        StudyActionCard("AI讲解模式", "先提示，再讲解", StudyGlowBlue, Modifier.fillMaxWidth())
        StudyActionCard("休息节奏", "学习达标后开放10分钟", StudyGlowOrange, Modifier.fillMaxWidth())
        StudyGlassPanel(modifier = Modifier.fillMaxWidth().weight(1f), radius = 26.dp, glow = StudyGlowPurple.copy(alpha = 0.18f)) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                Text("更多设置开发中", color = StudyTextPrimary, fontSize = 24.sp, fontWeight = FontWeight.Black)
                Text("当前保持儿童端安全、简洁、少打扰。", color = StudyTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun StudyActionCard(
    title: String,
    value: String,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.height(112.dp), radius = 24.dp, glow = accent.copy(alpha = 0.20f)) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.Center) {
            Text(title, color = StudyTextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(8.dp))
            Text(value, color = accent, fontSize = 14.sp, lineHeight = 19.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun SubjectGrid(
    subjects: List<com.kiddo.launcher.study.model.StudySubject>,
    onEvent: (StudyHomeEvent) -> Unit,
    onOpenCourse: () -> Unit,
) {
    val colors = listOf(StudyGlowBlue, StudyGlowPink, StudyGlowGreen, StudyGlowOrange, StudyGlowPurple)
    subjects.chunked(5).forEachIndexed { rowIndex, rowItems ->
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            rowItems.forEachIndexed { index, subject ->
                SubjectIcon(
                    subject = subject,
                    accent = colors[(rowIndex * 5 + index) % colors.size],
                    modifier = Modifier.width(112.dp),
                    onClick = {
                        onEvent(StudyHomeEvent.SelectSubject(subject.id))
                        onOpenCourse()
                    },
                )
            }
        }
        if (rowIndex == 0) Spacer(modifier = Modifier.height(14.dp))
    }
}

@Composable
private fun StudyRightStatus(
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 24.dp, glow = StudyGlowGreen.copy(alpha = 0.24f)) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            RobotHead(modifier = Modifier.size(82.dp))
            Spacer(modifier = Modifier.width(14.dp))
            Column {
                Text("AI机器人推荐", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "今天继续数学，完成上次课程后可解锁新的星球练习。",
                    color = StudyTextSecondary,
                    fontSize = 11.sp,
                    lineHeight = 16.sp,
                )
            }
        }
    }
}
