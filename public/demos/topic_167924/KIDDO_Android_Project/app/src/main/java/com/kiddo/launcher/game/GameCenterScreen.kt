package com.kiddo.launcher.game

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.model.HomeUiState
import com.kiddo.launcher.repository.LauncherRepository
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyMiniButton
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyProgressBar
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary
import com.kiddo.launcher.ui.LauncherResources
import com.kiddo.launcher.wrongbook.WrongBookRepository
import com.kiddo.launcher.wrongbook.WrongQuestStatus

@Composable
fun GameCenterScreen(
    onBack: () -> Unit,
    onOpenWrongBook: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val wrongItems by WrongBookRepository.items.collectAsState()
    val homeState by remember { LauncherRepository().observeHomeState() }.collectAsState(initial = HomeUiState())
    val state = GameCenterRepository.load(
        homeState = homeState,
        unresolvedWrongCount = wrongItems.count { it.status != WrongQuestStatus.MASTERED },
    )

    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        GameCenterBackground()
        StudyGlassPanel(
            modifier = Modifier.size(width = 1148.dp, height = 714.dp),
            radius = 34.dp,
            glow = StudyGlowPurple.copy(alpha = 0.34f),
        ) {
            Row(modifier = Modifier.fillMaxSize().padding(22.dp), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                GameSideRail(onBack = onBack, state = state, modifier = Modifier.width(196.dp))
                GameMainHall(
                    state = state,
                    onOpenWrongBook = onOpenWrongBook,
                    modifier = Modifier.weight(1f),
                )
            }
        }
    }
}

@Composable
private fun GameSideRail(
    onBack: () -> Unit,
    state: GameCenterState,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.fillMaxSize(), radius = 30.dp, glow = StudyGlowBlue.copy(alpha = 0.22f)) {
        Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
            Column {
                Text("娱乐中心", color = StudyTextPrimary, fontSize = 27.sp, fontWeight = FontWeight.Black)
                Text("游戏和休息应用", color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            LockStatusBadge(unlocked = state.unlocked)
            GameConditionLine("学习任务", "${state.learningFinished}/${state.learningTotal}", state.learningComplete)
            GameConditionLine("错题本", if (state.unresolvedWrongCount == 0) "已清零" else "剩 ${state.unresolvedWrongCount} 道", state.wrongBookComplete)
            Spacer(modifier = Modifier.weight(1f))
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 24.dp, glow = StudyGlowOrange.copy(alpha = 0.18f)) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("今日娱乐", color = StudyGlowOrange, fontSize = 13.sp, fontWeight = FontWeight.Black)
                    Text("${state.remainingMinutes} 分钟可用", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                    Text("已使用 ${state.usedEntertainmentMinutes} 分钟", color = StudyTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun GameMainHall(
    state: GameCenterState,
    onOpenWrongBook: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        GameTopBar(state)
        StudyGlassPanel(modifier = Modifier.fillMaxWidth().weight(1f), radius = 30.dp, glow = StudyGlowBlue.copy(alpha = 0.20f)) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp).verticalScroll(rememberScrollState())) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("游戏应用", color = StudyTextPrimary, fontSize = 26.sp, fontWeight = FontWeight.Black)
                        Text("学习完成后可进入游戏", color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    StatusPill("已开放", StudyGlowGreen)
                }
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    state.games.forEach { item ->
                        GameCard(
                            item = item,
                            locked = !state.unlocked,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
                Spacer(modifier = Modifier.height(20.dp))
                Text("休息应用", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                Text("休息时使用的视频和音乐应用", color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    state.entertainment.forEach { item ->
                        EntertainmentCard(
                            item = item,
                            locked = !state.unlocked,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                UnlockFooter(state = state, onOpenWrongBook = onOpenWrongBook)
            }
        }
    }
}

@Composable
private fun GameTopBar(state: GameCenterState) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(74.dp), radius = 26.dp, glow = StudyGlowPurple.copy(alpha = 0.24f)) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("今日娱乐时间", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.width(18.dp))
            StudyProgressBar(
                progress = state.usedEntertainmentMinutes.toFloat() / state.maxEntertainmentMinutes,
                color = if (state.unlocked) StudyGlowGreen else StudyGlowOrange,
                width = 310.dp,
            )
            Spacer(modifier = Modifier.width(18.dp))
            Text("已使用 ${state.usedEntertainmentMinutes} 分钟", color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.weight(1f))
            Text("剩余 ${state.remainingMinutes} 分钟", color = if (state.unlocked) StudyGlowGreen else StudyGlowOrange, fontSize = 20.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun GameCard(
    item: GameCenterItem,
    locked: Boolean,
    modifier: Modifier = Modifier,
) {
    val accent = when (item.category) {
        GameCategory.Racing -> StudyGlowBlue
        GameCategory.Puzzle -> StudyGlowGreen
        GameCategory.Building -> StudyGlowOrange
        GameCategory.Adventure -> StudyGlowPink
        GameCategory.Strategy -> StudyGlowPurple
    }
    StudyPressable(modifier = modifier, onClick = {}) {
        StudyGlassPanel(modifier = Modifier.height(218.dp), radius = 24.dp, glow = accent.copy(alpha = 0.24f)) {
            Box(modifier = Modifier.fillMaxSize()) {
                Image(
                    painter = painterResource(LauncherResources.glowBlue),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize().blur(10.dp),
                    contentScale = ContentScale.FillBounds,
                    colorFilter = ColorFilter.tint(accent),
                    alpha = 0.18f,
                )
                Column(modifier = Modifier.fillMaxSize().padding(14.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.fillMaxWidth().height(104.dp), contentAlignment = Alignment.Center) {
                        Image(
                            painter = painterResource(item.imageRes),
                            contentDescription = item.title,
                            modifier = Modifier.size(96.dp).clip(RoundedCornerShape(24.dp)),
                            contentScale = ContentScale.Fit,
                            alpha = 1f,
                        )
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(item.title, color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(item.subtitle, color = StudyTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Spacer(modifier = Modifier.weight(1f))
                    StudyMiniButton("打开", StudyGlowGreen, onClick = {})
                }
            }
        }
    }
}

@Composable
private fun EntertainmentCard(
    item: EntertainmentItem,
    locked: Boolean,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.height(132.dp), radius = 24.dp, glow = StudyGlowPurple.copy(alpha = 0.18f)) {
        Row(modifier = Modifier.fillMaxSize().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(width = 98.dp, height = 76.dp).clip(RoundedCornerShape(22.dp)).background(StudyGlowBlue.copy(alpha = 0.18f)),
                contentAlignment = Alignment.Center,
            ) {
                Image(
                    painter = painterResource(item.imageRes),
                    contentDescription = item.title,
                    modifier = Modifier.fillMaxSize().padding(6.dp),
                    contentScale = ContentScale.Fit,
                    alpha = 1f,
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(item.title, color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
                Text(item.subtitle, color = StudyTextSecondary, fontSize = 11.sp, lineHeight = 15.sp, fontWeight = FontWeight.Bold, maxLines = 2)
            }
            StudyMiniButton("打开", StudyGlowGreen, onClick = {})
        }
    }
}

@Composable
private fun UnlockFooter(
    state: GameCenterState,
    onOpenWrongBook: () -> Unit,
) {
    StudyGlassPanel(
        modifier = Modifier.fillMaxWidth().height(78.dp),
        radius = 26.dp,
        glow = if (state.unlocked) StudyGlowGreen.copy(alpha = 0.26f) else StudyGlowOrange.copy(alpha = 0.24f),
    ) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp), verticalAlignment = Alignment.CenterVertically) {
            LockStatusBadge(unlocked = state.unlocked)
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = if (state.unlocked) "学习完成，娱乐区已自动解锁" else "学习不足，娱乐区暂时锁定",
                    color = if (state.unlocked) StudyGlowGreen else StudyGlowOrange,
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Black,
                )
                Text(
                    text = if (state.unlocked) {
                        "请合理使用今日娱乐时间，休息后继续成长。"
                    } else {
                        "完成今日学习任务，并清理错题本后自动开放。"
                    },
                    color = StudyTextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                )
            }
            if (!state.wrongBookComplete) {
                StudyMiniButton("去错题本", StudyGlowOrange, onClick = onOpenWrongBook)
            }
        }
    }
}

@Composable
private fun GameConditionLine(title: String, value: String, done: Boolean) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier.size(10.dp).clip(CircleShape).background(if (done) StudyGlowGreen else StudyGlowOrange),
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(title, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
        Text(value, color = if (done) StudyGlowGreen else StudyGlowOrange, fontSize = 12.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun LockStatusBadge(unlocked: Boolean) {
    val accent = if (unlocked) StudyGlowGreen else StudyGlowOrange
    Text(
        text = if (unlocked) "已解锁" else "已锁定",
        color = accent,
        fontSize = 13.sp,
        fontWeight = FontWeight.Black,
        modifier = Modifier
            .clip(RoundedCornerShape(99.dp))
            .background(accent.copy(alpha = 0.14f))
            .border(1.dp, accent.copy(alpha = 0.34f), RoundedCornerShape(99.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

@Composable
private fun StatusPill(text: String, accent: Color) {
    Text(
        text = text,
        color = accent,
        fontSize = 11.sp,
        fontWeight = FontWeight.Black,
        modifier = Modifier
            .clip(RoundedCornerShape(99.dp))
            .background(accent.copy(alpha = 0.14f))
            .border(1.dp, accent.copy(alpha = 0.34f), RoundedCornerShape(99.dp))
            .padding(horizontal = 10.dp, vertical = 6.dp),
    )
}

@Composable
private fun LockOverlay(size: androidx.compose.ui.unit.Dp = 42.dp) {
    Box(
        modifier = Modifier
            .size(size)
            .clip(CircleShape)
            .background(Color(0xAA050A1E))
            .border(1.dp, StudyGlowOrange.copy(alpha = 0.46f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text("锁", color = StudyGlowOrange, fontSize = 13.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun GameCenterBackground() {
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
                        Color(0xF0040820),
                        Color(0xD40B1038),
                        Color(0xF0060927),
                    ),
                ),
            ),
    )
}
