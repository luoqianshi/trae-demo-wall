package com.kiddo.launcher.video.screen

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
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
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyProgressBar
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary
import com.kiddo.launcher.ui.LauncherResources
import com.kiddo.launcher.video.model.VideoPlayerUiState
import com.kiddo.launcher.video.viewmodel.VideoPlayerViewModel
import kotlinx.coroutines.delay
import kotlin.math.min

private val VideoDesignWidth = 1280.dp
private val VideoDesignHeight = 800.dp

private fun Int.vdp(scale: Float): Dp = (this * scale).dp

@Composable
fun VideoPlayerScreen(
    viewModel: VideoPlayerViewModel,
    onBack: () -> Unit,
    onOpenQuestion: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isPlaying, uiState.showAiQuestion, uiState.progress, uiState.playbackSpeed) {
        if (uiState.isPlaying && !uiState.showAiQuestion && uiState.progress < 1f) {
            delay(700)
            viewModel.onPlaybackTick()
        }
    }

    VideoPlayerContent(
        uiState = uiState,
        onBack = onBack,
        onPlayToggle = viewModel::togglePlay,
        onSpeed = viewModel::cycleSpeed,
        onSubtitles = viewModel::toggleSubtitles,
        onNote = viewModel::addNote,
        onFavorite = viewModel::toggleFavorite,
        onAsk = {
            viewModel.pauseForAssistant()
            onOpenQuestion()
        },
        onPauseExplain = viewModel::pauseForAssistant,
        onSummary = viewModel::pauseForAssistant,
        onPractice = onOpenQuestion,
        onContinue = viewModel::dismissAiQuestion,
        onOpenQuestion = onOpenQuestion,
        modifier = modifier,
    )
}

@Composable
private fun VideoPlayerContent(
    uiState: VideoPlayerUiState,
    onBack: () -> Unit,
    onPlayToggle: () -> Unit,
    onSpeed: () -> Unit,
    onSubtitles: () -> Unit,
    onNote: () -> Unit,
    onFavorite: () -> Unit,
    onAsk: () -> Unit,
    onPauseExplain: () -> Unit,
    onSummary: () -> Unit,
    onPractice: () -> Unit,
    onContinue: () -> Unit,
    onOpenQuestion: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val configuration = LocalConfiguration.current
    val scale = min(
        configuration.screenWidthDp / VideoDesignWidth.value,
        configuration.screenHeightDp / VideoDesignHeight.value,
    )

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        VideoBackground()
        Row(
            modifier = Modifier
                .size(VideoDesignWidth * scale, VideoDesignHeight * scale)
                .padding(horizontal = 18.vdp(scale), vertical = 22.vdp(scale)),
            horizontalArrangement = Arrangement.spacedBy(18.vdp(scale)),
        ) {
            StudyGlassPanel(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxHeight(),
                radius = 34.dp,
                glow = StudyGlowBlue.copy(alpha = 0.34f),
            ) {
                Column(modifier = Modifier.fillMaxSize().padding(18.dp)) {
                    VideoHeader(uiState = uiState, onBack = onBack)
                    Spacer(modifier = Modifier.height(16.dp))
                    PlayerSurface(uiState = uiState, onPlayToggle = onPlayToggle)
                    Spacer(modifier = Modifier.height(14.dp))
                    PlayerControls(
                        uiState = uiState,
                        onSpeed = onSpeed,
                        onSubtitles = onSubtitles,
                        onNote = onNote,
                        onFavorite = onFavorite,
                    )
                }
            }

            AiAssistantPanel(
                modifier = Modifier
                    .width(338.vdp(scale))
                    .fillMaxHeight(),
                onAsk = onAsk,
                onPauseExplain = onPauseExplain,
                onSummary = onSummary,
                onPractice = onPractice,
            )
        }

        if (uiState.showAiQuestion) {
            AiQuestionPopup(
                question = uiState.aiQuestion,
                onContinue = onContinue,
                onOpenQuestion = onOpenQuestion,
            )
        }
    }
}

@Composable
private fun VideoBackground() {
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
                            Color(0xF0040922),
                            Color(0xC6081640),
                            Color(0xF0050A24),
                        ),
                    ),
                ),
        )
        Image(
            painter = painterResource(LauncherResources.glowBlue),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.CenterStart)
                .size(700.dp)
                .blur(30.dp),
            alpha = 0.18f,
            contentScale = ContentScale.FillBounds,
        )
        Image(
            painter = painterResource(LauncherResources.glowPink),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(620.dp)
                .blur(30.dp),
            alpha = 0.14f,
            contentScale = ContentScale.FillBounds,
        )
    }
}

@Composable
private fun VideoHeader(
    uiState: VideoPlayerUiState,
    onBack: () -> Unit,
) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        StudyMiniButton(text = "返回课程", accent = StudyGlowPurple, onClick = onBack)
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(uiState.courseTitle, color = StudyTextPrimary, fontSize = 25.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(4.dp))
            Text(uiState.chapterTitle, color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text("学习进度 ${(uiState.progress * 100).toInt()}%", color = StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(7.dp))
            StudyProgressBar(progress = uiState.progress, color = StudyGlowGreen, width = 220.dp)
        }
    }
}

@Composable
private fun PlayerSurface(
    uiState: VideoPlayerUiState,
    onPlayToggle: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
            .clip(RoundedCornerShape(32.dp))
            .background(Color(0xF1030716))
            .border(1.dp, Color.White.copy(alpha = 0.16f), RoundedCornerShape(32.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Image(
            painter = painterResource(LauncherResources.studyTower),
            contentDescription = null,
            modifier = Modifier
                .fillMaxSize()
                .padding(52.dp),
            alpha = 0.62f,
            colorFilter = ColorFilter.tint(StudyGlowBlue.copy(alpha = 0.84f)),
            contentScale = ContentScale.Fit,
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .fillMaxWidth()
                .height(86.dp)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, Color.Black.copy(alpha = 0.62f)),
                    ),
                ),
        )
        StudyPressable(onClick = onPlayToggle) {
            Box(
                modifier = Modifier
                    .size(112.dp)
                    .clip(CircleShape)
                    .background(StudyGlowBlue.copy(alpha = 0.24f))
                    .border(1.dp, Color.White.copy(alpha = 0.28f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(if (uiState.isPlaying) "PAUSE" else "PLAY", color = StudyTextPrimary, fontSize = 17.sp, fontWeight = FontWeight.Black)
            }
        }
        Text(
            text = if (uiState.subtitlesEnabled) "字幕：把 2/3 再平均取一半，可以用乘法表示为 2/3 x 1/2。" else "",
            color = StudyTextSecondary,
            fontSize = 14.sp,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 24.dp),
        )
    }
}

@Composable
private fun PlayerControls(
    uiState: VideoPlayerUiState,
    onSpeed: () -> Unit,
    onSubtitles: () -> Unit,
    onNote: () -> Unit,
    onFavorite: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        ControlButton(
            title = "播放速度",
            value = "${uiState.playbackSpeed}x",
            accent = StudyGlowBlue,
            modifier = Modifier.weight(1f),
            onClick = onSpeed,
        )
        ControlButton(
            title = "字幕",
            value = if (uiState.subtitlesEnabled) "已开启" else "已关闭",
            accent = StudyGlowGreen,
            modifier = Modifier.weight(1f),
            onClick = onSubtitles,
        )
        ControlButton(
            title = "笔记",
            value = "${uiState.notesCount}条",
            accent = StudyGlowOrange,
            modifier = Modifier.weight(1f),
            onClick = onNote,
        )
        ControlButton(
            title = "收藏",
            value = if (uiState.favorite) "已收藏" else "未收藏",
            accent = StudyGlowPink,
            modifier = Modifier.weight(1f),
            onClick = onFavorite,
        )
    }
}

@Composable
private fun AiAssistantPanel(
    modifier: Modifier = Modifier,
    onAsk: () -> Unit,
    onPauseExplain: () -> Unit,
    onSummary: () -> Unit,
    onPractice: () -> Unit,
) {
    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowPurple.copy(alpha = 0.30f)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RobotHead(modifier = Modifier.size(68.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("AI机器人助手", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                    Text("边看边问，自动暂停", color = StudyTextSecondary, fontSize = 10.sp)
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
            AssistantAction("举手提问", "我没听懂，立刻问 AI", StudyGlowBlue, onAsk)
            Spacer(modifier = Modifier.height(12.dp))
            AssistantAction("暂停讲解", "停在当前画面，拆解知识点", StudyGlowGreen, onPauseExplain)
            Spacer(modifier = Modifier.height(12.dp))
            AssistantAction("知识总结", "生成本节 3 条重点", StudyGlowOrange, onSummary)
            Spacer(modifier = Modifier.height(12.dp))
            AssistantAction("生成练习", "根据当前片段出题", StudyGlowPink, onPractice)
            Spacer(modifier = Modifier.weight(1f))
            Text(
                text = "播放过程中 AI 会在关键节点随机暂停，提出一道理解题，答对后继续学习。",
                color = StudyTextSecondary,
                fontSize = 11.sp,
                lineHeight = 17.sp,
            )
        }
    }
}

@Composable
private fun ControlButton(
    title: String,
    value: String,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .background(Color.White.copy(alpha = 0.07f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(20.dp))
                .padding(horizontal = 14.dp, vertical = 12.dp),
        ) {
            Text(title, color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(5.dp))
            Text(value, color = accent, fontSize = 14.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun AssistantAction(
    title: String,
    subtitle: String,
    accent: Color,
    onClick: () -> Unit,
) {
    StudyPressable(onClick = onClick) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(Color.White.copy(alpha = 0.07f))
                .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(22.dp))
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(12.dp)
                    .clip(CircleShape)
                    .background(accent),
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(title, color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
                Text(subtitle, color = StudyTextSecondary, fontSize = 10.sp)
            }
        }
    }
}

@Composable
private fun AiQuestionPopup(
    question: String,
    onContinue: () -> Unit,
    onOpenQuestion: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.48f)),
        contentAlignment = Alignment.Center,
    ) {
        StudyGlassPanel(
            modifier = Modifier.size(width = 520.dp, height = 300.dp),
            radius = 32.dp,
            glow = StudyGlowOrange.copy(alpha = 0.40f),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                RobotHead(modifier = Modifier.size(70.dp))
                Spacer(modifier = Modifier.height(12.dp))
                Text("AI随机暂停", color = StudyGlowOrange, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    question,
                    color = StudyTextPrimary,
                    fontSize = 19.sp,
                    lineHeight = 28.sp,
                    textAlign = TextAlign.Center,
                )
                Spacer(modifier = Modifier.weight(1f))
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    StudyMiniButton(text = "继续播放", accent = StudyGlowBlue, onClick = onContinue)
                    StudyMiniButton(text = "进入答题", accent = StudyGlowGreen, onClick = onOpenQuestion)
                }
            }
        }
    }
}
