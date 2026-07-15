package com.kiddo.launcher.rest

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
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
import com.kiddo.launcher.study.component.StudyMiniButton
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun RestHome(
    viewModel: RestViewModel,
    onExitToLauncher: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.remainingSeconds) {
        if (state.remainingSeconds <= 0) onExitToLauncher()
    }

    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        if (state.page == RestPage.Farm) {
            FarmScreen(
                state = state,
                onBack = viewModel::openHome,
                onSelectTool = viewModel::selectTool,
                onSelectPlant = viewModel::selectPlant,
                onPlotClick = viewModel::tapPlot,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            RestParkBackground()
            StudyGlassPanel(
                modifier = Modifier.size(width = 1148.dp, height = 714.dp),
                radius = 34.dp,
                glow = StudyGlowGreen.copy(alpha = 0.30f),
            ) {
                Box(modifier = Modifier.fillMaxSize().padding(22.dp)) {
                    when (state.page) {
                        RestPage.Home -> RestHomeContent(
                            state = state,
                            onOpenFarm = viewModel::openFarm,
                            onOpenBattle = viewModel::openBattle,
                            onExitToLauncher = onExitToLauncher,
                        )
                        RestPage.Farm -> Unit
                        RestPage.Battle -> BattleHome(
                            state = state,
                            onBack = viewModel::openHome,
                            onEntryClick = viewModel::openBattleEntry,
                            onCloseWaiting = viewModel::closeWaiting,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RestHomeContent(
    state: RestUiState,
    onOpenFarm: () -> Unit,
    onOpenBattle: () -> Unit,
    onExitToLauncher: () -> Unit,
) {
    if (!state.unlocked) {
        RestLockedContent(state = state, onExitToLauncher = onExitToLauncher)
        return
    }

    Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        RestHeader(state)
        Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
            RestMiniGamePortal(
                title = "种植小屋",
                subtitle = "照顾9块小菜地，收获金币和伙伴经验",
                label = "主玩法",
                imageRes = LauncherResources.restArea,
                accent = StudyGlowGreen,
                onClick = onOpenFarm,
                modifier = Modifier.weight(1f).fillMaxHeight(),
            )
            RestMiniGamePortal(
                title = "AI伙伴对战",
                subtitle = "训练馆页面已开放，战斗系统未来接入",
                label = "预留",
                imageRes = state.partner.imageRes,
                accent = StudyGlowBlue,
                onClick = onOpenBattle,
                modifier = Modifier.weight(1f).fillMaxHeight(),
            )
        }
        RestFooter(state = state, onExitToLauncher = onExitToLauncher)
    }
}

@Composable
private fun RestHeader(state: RestUiState) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(92.dp), radius = 30.dp, glow = StudyGlowGreen.copy(alpha = 0.20f)) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text("治愈休息公园", color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
                Text("短暂恢复注意力，休息结束继续学习", color = StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Black)
            }
            RestPill("今日休息 ${state.todayRestTimeText}", StudyGlowBlue)
            Spacer(modifier = Modifier.width(12.dp))
            RestPill("剩余 ${state.remainingTimeText}", StudyGlowGreen)
            Spacer(modifier = Modifier.width(12.dp))
            val reason = state.unlockReasons.firstOrNull()?.title ?: "学习达标"
            RestPill(reason, StudyGlowOrange)
        }
    }
}

@Composable
private fun RestMiniGamePortal(
    title: String,
    subtitle: String,
    label: String,
    imageRes: Int,
    accent: Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        StudyGlassPanel(modifier = Modifier.fillMaxSize(), radius = 32.dp, glow = accent.copy(alpha = 0.26f)) {
            Box(modifier = Modifier.fillMaxSize()) {
                Image(
                    painter = painterResource(LauncherResources.glowBlue),
                    contentDescription = null,
                    modifier = Modifier.align(Alignment.Center).fillMaxSize().blur(16.dp),
                    contentScale = ContentScale.FillBounds,
                    colorFilter = ColorFilter.tint(accent),
                    alpha = 0.18f,
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(18.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(accent.copy(alpha = 0.18f))
                        .border(1.dp, accent.copy(alpha = 0.38f), RoundedCornerShape(99.dp))
                        .padding(horizontal = 12.dp, vertical = 7.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(label, color = accent, fontSize = 11.sp, fontWeight = FontWeight.Black)
                }
                Image(
                    painter = painterResource(imageRes),
                    contentDescription = title,
                    modifier = Modifier.align(Alignment.Center).size(width = 250.dp, height = 190.dp),
                    contentScale = ContentScale.Fit,
                )
                Column(modifier = Modifier.align(Alignment.BottomStart).padding(24.dp)) {
                    Text(title, color = StudyTextPrimary, fontSize = 34.sp, fontWeight = FontWeight.Black)
                    Text(subtitle, color = StudyTextSecondary, fontSize = 14.sp, lineHeight = 19.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(14.dp))
                    StudyMiniButton("进入", accent, onClick = onClick)
                }
            }
        }
    }
}

@Composable
private fun RestFooter(
    state: RestUiState,
    onExitToLauncher: () -> Unit,
) {
    Row(modifier = Modifier.fillMaxWidth().height(116.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        CoinRewardPanel(reward = state.latestReward, todayCoins = state.todayCoins, modifier = Modifier.weight(0.86f).fillMaxHeight())
        StudyGlassPanel(modifier = Modifier.weight(1f).fillMaxHeight(), radius = 24.dp, glow = StudyGlowBlue.copy(alpha = 0.18f)) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("今日休息记录", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                state.restRecords.take(3).forEach { record ->
                    Text(record, color = StudyTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
        StudyGlassPanel(modifier = Modifier.width(186.dp).fillMaxHeight(), radius = 24.dp, glow = StudyGlowPurple.copy(alpha = 0.18f)) {
            Column(
                modifier = Modifier.fillMaxSize().padding(14.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("准备好了吗", color = StudyTextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
                Text("回到学习城市", color = StudyTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(10.dp))
                StudyMiniButton("返回学习", StudyGlowPurple, onClick = onExitToLauncher)
            }
        }
    }
}

@Composable
private fun RestLockedContent(
    state: RestUiState,
    onExitToLauncher: () -> Unit,
) {
    Row(modifier = Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(18.dp), verticalAlignment = Alignment.CenterVertically) {
        StudyGlassPanel(modifier = Modifier.weight(1f).height(430.dp), radius = 34.dp, glow = StudyGlowOrange.copy(alpha = 0.24f)) {
            Column(
                modifier = Modifier.fillMaxSize().padding(28.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Text("休息公园暂未开放", color = StudyTextPrimary, fontSize = 36.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
                Spacer(modifier = Modifier.height(12.dp))
                Text("完成学习目标后，这里会开放约10分钟。", color = StudyTextSecondary, fontSize = 15.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                Spacer(modifier = Modifier.height(22.dp))
                StudyMiniButton("返回学习", StudyGlowPurple, onClick = onExitToLauncher)
            }
        }
        StudyGlassPanel(modifier = Modifier.weight(1f).height(430.dp), radius = 34.dp, glow = StudyGlowGreen.copy(alpha = 0.20f)) {
            Column(modifier = Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("开放条件", color = StudyTextPrimary, fontSize = 26.sp, fontWeight = FontWeight.Black)
                RestConditionLine("连续学习40分钟", done = state.unlockReasons.contains(RestUnlockReason.StudyMinutes))
                RestConditionLine("完成指定学习任务", done = state.unlockReasons.contains(RestUnlockReason.StudyTask))
                RestConditionLine("完成错题本当前挑战", done = state.unlockReasons.contains(RestUnlockReason.WrongBook))
                Spacer(modifier = Modifier.weight(1f))
                Text("满足其中一种就能进入。休息是为了恢复注意力，不是一直玩。", color = StudyTextSecondary, fontSize = 13.sp, lineHeight = 18.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun RestConditionLine(text: String, done: Boolean) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(14.dp)
                .clip(CircleShape)
                .background(if (done) StudyGlowGreen else StudyGlowOrange),
        )
        Spacer(modifier = Modifier.width(10.dp))
        Text(text, color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
fun RestPill(text: String, accent: Color, modifier: Modifier = Modifier) {
    Text(
        text = text,
        color = accent,
        fontSize = 12.sp,
        fontWeight = FontWeight.Black,
        modifier = modifier
            .clip(RoundedCornerShape(99.dp))
            .background(accent.copy(alpha = 0.14f))
            .border(1.dp, accent.copy(alpha = 0.32f), RoundedCornerShape(99.dp))
            .padding(horizontal = 12.dp, vertical = 7.dp),
    )
}

@Composable
private fun BoxScope.RestParkBackground() {
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
                        Color(0xD9112F42),
                        Color(0xC6135B48),
                        Color(0xEE071B2C),
                    ),
                ),
            ),
    )
    Image(
        painter = painterResource(LauncherResources.particle),
        contentDescription = null,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Crop,
        alpha = 0.16f,
    )
    Box(
        modifier = Modifier
            .align(Alignment.BottomStart)
            .offset(x = (-80).dp, y = 28.dp)
            .size(width = 520.dp, height = 160.dp)
            .clip(CircleShape)
            .background(StudyGlowGreen.copy(alpha = 0.18f)),
    )
    Box(
        modifier = Modifier
            .align(Alignment.BottomEnd)
            .offset(x = 90.dp, y = 42.dp)
            .size(width = 460.dp, height = 140.dp)
            .clip(CircleShape)
            .background(StudyGlowBlue.copy(alpha = 0.13f)),
    )
    Box(
        modifier = Modifier
            .align(Alignment.TopEnd)
            .offset(x = 38.dp, y = (-42).dp)
            .size(220.dp)
            .clip(CircleShape)
            .background(StudyGlowPink.copy(alpha = 0.10f))
            .blur(8.dp),
    )
}
