package com.kiddo.launcher.video.screen

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.question.model.AnswerResult
import com.kiddo.launcher.question.model.QuestionItem
import com.kiddo.launcher.question.model.QuestionType
import com.kiddo.launcher.question.model.QuestionUiState
import com.kiddo.launcher.question.viewmodel.QuestionViewModel
import com.kiddo.launcher.study.component.RobotHead
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
fun QuestionScreen(
    viewModel: QuestionViewModel,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsState()

    QuestionContent(
        uiState = uiState,
        onBack = onBack,
        onType = viewModel::selectType,
        onAnswer = viewModel::updateAnswer,
        onSubmit = viewModel::submitAnswer,
        onAskAi = viewModel::askAiAnalysis,
        onGenerateSimilar = viewModel::generateSimilarQuestion,
        modifier = modifier,
    )
}

@Composable
private fun QuestionContent(
    uiState: QuestionUiState,
    onBack: () -> Unit,
    onType: (QuestionType) -> Unit,
    onAnswer: (String) -> Unit,
    onSubmit: () -> Unit,
    onAskAi: () -> Unit,
    onGenerateSimilar: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        QuestionBackground()
        StudyGlassPanel(
            modifier = Modifier.size(width = 1120.dp, height = 710.dp),
            radius = 34.dp,
            glow = StudyGlowBlue.copy(alpha = 0.34f),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalArrangement = Arrangement.spacedBy(22.dp),
            ) {
                QuestionMainCard(
                    uiState = uiState,
                    modifier = Modifier.weight(1f),
                    onBack = onBack,
                    onType = onType,
                    onAnswer = onAnswer,
                    onSubmit = onSubmit,
                    onGenerateSimilar = onGenerateSimilar,
                )
                AiQuestionPanel(
                    uiState = uiState,
                    modifier = Modifier
                        .width(320.dp)
                        .fillMaxHeight(),
                    onAskAi = onAskAi,
                    onGenerateSimilar = onGenerateSimilar,
                    onBack = onBack,
                )
            }
        }

        if (uiState.result == AnswerResult.Correct) {
            CelebrationOverlay()
        }
    }
}

@Composable
private fun QuestionMainCard(
    uiState: QuestionUiState,
    modifier: Modifier = Modifier,
    onBack: () -> Unit,
    onType: (QuestionType) -> Unit,
    onAnswer: (String) -> Unit,
    onSubmit: () -> Unit,
    onGenerateSimilar: () -> Unit,
) {
    Column(modifier = modifier.fillMaxHeight()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            StudyMiniButton(text = "返回视频", accent = StudyGlowPurple, onClick = onBack)
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("随堂答题", color = StudyTextPrimary, fontSize = 28.sp, fontWeight = FontWeight.Black)
                Text("AI 随机暂停题 · 独立答对才完成", color = StudyGlowBlue, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
            WrongLockBadge(uiState.unresolvedWrongCount)
        }
        Spacer(modifier = Modifier.height(18.dp))
        TypeTabs(selected = uiState.selectedType, onType = onType)
        Spacer(modifier = Modifier.height(18.dp))
        StudyGlassPanel(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            radius = 30.dp,
            glow = when (uiState.result) {
                AnswerResult.Correct -> StudyGlowGreen.copy(alpha = 0.36f)
                AnswerResult.Wrong, AnswerResult.AiAssistedNeedsPractice -> StudyGlowOrange.copy(alpha = 0.34f)
                AnswerResult.Idle -> StudyGlowBlue.copy(alpha = 0.24f)
            },
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(22.dp),
            ) {
                Text(
                    text = uiState.current.type.title,
                    color = StudyGlowGreen,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Black,
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = uiState.current.prompt,
                    color = StudyTextPrimary,
                    fontSize = 25.sp,
                    lineHeight = 34.sp,
                    fontWeight = FontWeight.Black,
                )
                Spacer(modifier = Modifier.height(20.dp))
                AnswerInputArea(
                    question = uiState.current,
                    answerInput = uiState.answerInput,
                    result = uiState.result,
                    onAnswer = onAnswer,
                )
                Spacer(modifier = Modifier.weight(1f))
                ResultMessage(uiState = uiState)
                Spacer(modifier = Modifier.height(14.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StudyMiniButton(
                        text = "提交答案",
                        accent = StudyGlowBlue,
                        onClick = onSubmit,
                    )
                    if (uiState.result == AnswerResult.Wrong || uiState.result == AnswerResult.AiAssistedNeedsPractice) {
                        StudyMiniButton(
                            text = "生成同类题",
                            accent = StudyGlowOrange,
                            onClick = onGenerateSimilar,
                        )
                    }
                    if (uiState.result == AnswerResult.Correct) {
                        StudyMiniButton(
                            text = "继续课程",
                            accent = StudyGlowGreen,
                            onClick = onBack,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TypeTabs(
    selected: QuestionType,
    onType: (QuestionType) -> Unit,
) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        QuestionType.entries.forEach { type ->
            val active = type == selected
            StudyPressable(onClick = { onType(type) }) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (active) StudyGlowBlue.copy(alpha = 0.26f) else Color.White.copy(alpha = 0.06f))
                        .border(
                            1.dp,
                            if (active) StudyGlowBlue.copy(alpha = 0.54f) else Color.White.copy(alpha = 0.12f),
                            RoundedCornerShape(18.dp),
                        )
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(type.title, color = if (active) StudyTextPrimary else StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
private fun AnswerInputArea(
    question: QuestionItem,
    answerInput: String,
    result: AnswerResult,
    onAnswer: (String) -> Unit,
) {
    when (question.type) {
        QuestionType.Choice, QuestionType.TrueFalse -> {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                question.options.forEach { option ->
                    AnswerOption(
                        text = option,
                        selected = answerInput == option,
                        correct = result != AnswerResult.Idle && option == question.answer,
                        onClick = { onAnswer(option) },
                    )
                }
            }
        }
        QuestionType.FillBlank, QuestionType.Calculation -> {
            OutlinedTextField(
                value = answerInput,
                onValueChange = onAnswer,
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text("输入答案，例如 1/3 或 6/5", color = StudyTextSecondary)
                },
                singleLine = true,
                textStyle = androidx.compose.ui.text.TextStyle(
                    color = StudyTextPrimary,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Black,
                ),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.White.copy(alpha = 0.08f),
                    unfocusedContainerColor = Color.White.copy(alpha = 0.05f),
                    focusedIndicatorColor = StudyGlowBlue,
                    unfocusedIndicatorColor = Color.White.copy(alpha = 0.18f),
                    cursorColor = StudyGlowBlue,
                ),
            )
        }
    }
}

@Composable
private fun ResultMessage(uiState: QuestionUiState) {
    when (uiState.result) {
        AnswerResult.Idle -> {
            Text(uiState.aiTip, color = StudyTextSecondary, fontSize = 13.sp, lineHeight = 20.sp)
        }
        AnswerResult.Correct -> {
            Text("回答正确！已独立完成，错题状态可标记为已完成。", color = StudyGlowGreen, fontSize = 16.sp, fontWeight = FontWeight.Black)
        }
        AnswerResult.Wrong -> {
            Text("回答错误。已写入错题本，并进入 AI 解析流程。", color = StudyGlowOrange, fontSize = 16.sp, fontWeight = FontWeight.Black)
        }
        AnswerResult.AiAssistedNeedsPractice -> {
            Text("AI 帮助后完成不算独立掌握，已生成同类题，请继续独立作答。", color = StudyGlowOrange, fontSize = 16.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun AiQuestionPanel(
    uiState: QuestionUiState,
    modifier: Modifier = Modifier,
    onAskAi: () -> Unit,
    onGenerateSimilar: () -> Unit,
    onBack: () -> Unit,
) {
    StudyGlassPanel(modifier = modifier, radius = 28.dp, glow = StudyGlowPurple.copy(alpha = 0.28f)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            RobotHead(modifier = Modifier.size(84.dp))
            Spacer(modifier = Modifier.height(14.dp))
            Text("AI机器人", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
            Text("实时提示 · 错题闭环", color = StudyGlowBlue, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))
            AiInfoBlock("实时提示", uiState.aiTip, StudyGlowBlue)
            Spacer(modifier = Modifier.height(12.dp))
            AnimatedVisibility(visible = uiState.aiAnalysisVisible) {
                AiInfoBlock("AI解析", uiState.current.explanation, StudyGlowOrange)
            }
            Spacer(modifier = Modifier.height(12.dp))
            AiInfoBlock(
                title = "休息区解锁",
                body = if (uiState.unresolvedWrongCount > 0) {
                    "还有 ${uiState.unresolvedWrongCount} 道错题未独立解决，休息功能区暂不解锁。"
                } else {
                    "当前没有未解决错题，休息功能区可正常解锁。"
                },
                accent = if (uiState.unresolvedWrongCount > 0) StudyGlowOrange else StudyGlowGreen,
            )
            Spacer(modifier = Modifier.weight(1f))
            StudyMiniButton(
                text = "提问AI解析",
                accent = StudyGlowPurple,
                modifier = Modifier.fillMaxWidth(),
                onClick = onAskAi,
            )
            Spacer(modifier = Modifier.height(10.dp))
            StudyMiniButton(
                text = "生成同类题",
                accent = StudyGlowOrange,
                modifier = Modifier.fillMaxWidth(),
                onClick = onGenerateSimilar,
            )
            Spacer(modifier = Modifier.height(10.dp))
            StudyMiniButton(
                text = "继续课程",
                accent = StudyGlowGreen,
                modifier = Modifier.fillMaxWidth(),
                onClick = onBack,
            )
        }
    }
}

@Composable
private fun AiInfoBlock(
    title: String,
    body: String,
    accent: Color,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.06f))
            .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(20.dp))
            .padding(13.dp),
    ) {
        Text(title, color = accent, fontSize = 12.sp, fontWeight = FontWeight.Black)
        Spacer(modifier = Modifier.height(6.dp))
        Text(body, color = StudyTextSecondary, fontSize = 11.sp, lineHeight = 17.sp)
    }
}

@Composable
private fun WrongLockBadge(count: Int) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(16.dp))
            .background(if (count > 0) StudyGlowOrange.copy(alpha = 0.18f) else StudyGlowGreen.copy(alpha = 0.16f))
            .border(1.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(16.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
    ) {
        Text(
            text = if (count > 0) "未解决错题 $count" else "错题清零",
            color = if (count > 0) StudyGlowOrange else StudyGlowGreen,
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
        )
    }
}

@Composable
private fun CelebrationOverlay() {
    val transition = rememberInfiniteTransition(label = "celebration")
    val pulse by transition.animateFloat(
        initialValue = 0.92f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 720),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "pulse",
    )
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        StudyGlassPanel(
            modifier = Modifier
                .padding(top = 32.dp)
                .size(width = 420.dp, height = 96.dp)
                .scale(pulse),
            radius = 28.dp,
            glow = StudyGlowGreen.copy(alpha = 0.48f),
        ) {
            Row(
                modifier = Modifier.fillMaxSize().padding(horizontal = 22.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(CircleShape)
                        .background(StudyGlowGreen),
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text("庆祝动画：独立答对！", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun QuestionBackground() {
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
                        listOf(Color(0xF0040922), Color(0xC60A1742), Color(0xF0050A24)),
                    ),
                ),
        )
        Image(
            painter = painterResource(LauncherResources.glowPink),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.TopEnd)
                .size(640.dp)
                .blur(28.dp),
            alpha = 0.16f,
            contentScale = ContentScale.FillBounds,
        )
    }
}

@Composable
private fun AnswerOption(
    text: String,
    selected: Boolean,
    correct: Boolean,
    onClick: () -> Unit,
) {
    val accent = when {
        correct -> StudyGlowGreen
        selected -> StudyGlowBlue
        else -> Color.White.copy(alpha = 0.20f)
    }
    StudyPressable(onClick = onClick) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(if (selected || correct) accent.copy(alpha = 0.18f) else Color.White.copy(alpha = 0.06f))
                .border(1.dp, accent.copy(alpha = 0.45f), RoundedCornerShape(22.dp))
                .padding(horizontal = 18.dp, vertical = 15.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(14.dp)
                    .clip(CircleShape)
                    .background(accent),
            )
            Spacer(modifier = Modifier.width(14.dp))
            Text(text, color = StudyTextPrimary, fontSize = 19.sp, fontWeight = FontWeight.Black)
        }
    }
}
