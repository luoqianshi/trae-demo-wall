package com.kiddo.launcher.wrongbook

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
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
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary
import kotlinx.coroutines.delay

@Composable
fun WrongBookDetail(
    viewModel: WrongBookViewModel,
    questId: String?,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    LaunchedEffect(questId) {
        if (questId != null) {
            viewModel.openQuest(questId)
        }
    }
    val uiState by viewModel.uiState.collectAsState()
    WrongBookDetailContent(
        uiState = uiState,
        onBack = onBack,
        onAnswer = viewModel::updateAnswer,
        onSubmit = viewModel::submitPracticeAnswer,
        onHint = viewModel::requestAiHint,
        onLecture = viewModel::explainKnowledge,
        onReason = viewModel::analyzeReason,
        onTransfer = viewModel::transferPractice,
        onRevealAnswer = viewModel::revealAnswer,
        onCelebrationFinished = viewModel::dismissCompletionCelebration,
        modifier = modifier,
    )
}

@Composable
private fun WrongBookDetailContent(
    uiState: WrongBookUiState,
    onBack: () -> Unit,
    onAnswer: (String) -> Unit,
    onSubmit: () -> Unit,
    onHint: () -> Unit,
    onLecture: () -> Unit,
    onReason: () -> Unit,
    onTransfer: () -> Unit,
    onRevealAnswer: () -> Unit,
    onCelebrationFinished: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var assistantOpen by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(uiState.completionCelebration) {
        if (uiState.completionCelebration) {
            delay(1_600)
            onCelebrationFinished()
            onBack()
        }
    }

    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        WrongBookBackground()
        StudyGlassPanel(
            modifier = Modifier.size(width = 1136.dp, height = 714.dp),
            radius = 34.dp,
            glow = StudyGlowBlue.copy(alpha = 0.32f),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(22.dp),
                horizontalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                OriginalInfoPanel(
                    quest = uiState.selectedQuest,
                    onBack = onBack,
                    modifier = Modifier
                        .width(300.dp)
                        .fillMaxHeight(),
                )
                LearningPracticePanel(
                    uiState = uiState,
                    onAnswer = onAnswer,
                    onSubmit = onSubmit,
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight(),
                )
            }
        }
        FloatingAssistantDock(
            opened = assistantOpen,
            quest = uiState.selectedQuest,
            message = uiState.aiGuideMessage,
            showFullAnalysis = uiState.showFullAnalysis,
            onToggle = { assistantOpen = !assistantOpen },
            onDismiss = { assistantOpen = false },
            onHint = onHint,
            onLecture = onLecture,
            onReason = onReason,
            onTransfer = onTransfer,
            onRevealAnswer = onRevealAnswer,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 72.dp, bottom = 44.dp),
        )
        if (uiState.completionCelebration) {
            QuestCompleteOverlay()
        }
    }
}

@Composable
private fun OriginalInfoPanel(
    quest: WrongItem?,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 30.dp, glow = StudyGlowOrange.copy(alpha = 0.22f)) {
        Column(
            modifier = Modifier
                .fillMaxHeight()
                .padding(18.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            StudyMiniButton("返回任务板", StudyGlowPurple, onClick = onBack)
            Spacer(modifier = Modifier.height(16.dp))
            Text("原题信息", color = StudyTextPrimary, fontSize = 25.sp, fontWeight = FontWeight.Black)
            Text("错误不是终点，是成长任务入口", color = StudyGlowOrange, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))
            if (quest == null) {
                Text("请选择一个错题任务。", color = StudyTextSecondary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                return@Column
            }
            KnowledgeProgressRing(progress = quest.masteryRate, size = 92.dp)
            Spacer(modifier = Modifier.height(12.dp))
            InfoBlock("题目", quest.originalQuestion)
            InfoBlock("错误答案", quest.userWrongAnswer, StudyGlowOrange)
            InfoBlock("正确答案", quest.correctAnswer, StudyGlowGreen)
            InfoBlock("错误原因", quest.wrongReason)
            InfoBlock("知识点介绍", quest.knowledgeIntro)
            InfoBlock("课程来源", quest.sourceCourse, StudyGlowBlue)
            InfoBlock("当前状态", "${quest.status.label} · ${quest.currentStage.title}", StudyGlowPurple)
        }
    }
}

@Composable
private fun LearningPracticePanel(
    uiState: WrongBookUiState,
    onAnswer: (String) -> Unit,
    onSubmit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val quest = uiState.selectedQuest
    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowGreen.copy(alpha = 0.22f)) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("错题挑战", color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
                    Text("独立完成挑战链，才算真正掌握", color = StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Black)
                }
                if (quest != null) {
                    StageLadder(quest)
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
            if (quest == null) {
                Text("暂无错题任务。", color = StudyTextSecondary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                return@Column
            }
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 28.dp, glow = StudyGlowBlue.copy(alpha = 0.22f)) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(quest.currentStage.title, color = StudyGlowBlue, fontSize = 13.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text(
                        text = quest.currentPractice.prompt,
                        color = StudyTextPrimary,
                        fontSize = 24.sp,
                        lineHeight = 32.sp,
                        fontWeight = FontWeight.Black,
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    Text("先独立完成；需要提示时，点右下角 AI 助手。", color = StudyTextSecondary, fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = uiState.answerInput,
                onValueChange = onAnswer,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("输入你的独立答案", color = StudyTextSecondary) },
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    focusedTextColor = StudyTextPrimary,
                    unfocusedTextColor = StudyTextPrimary,
                    focusedContainerColor = Color.White.copy(alpha = 0.08f),
                    unfocusedContainerColor = Color.White.copy(alpha = 0.06f),
                    focusedIndicatorColor = StudyGlowBlue,
                    unfocusedIndicatorColor = Color.White.copy(alpha = 0.16f),
                ),
            )
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                StudyMiniButton("提交挑战", StudyGlowGreen, onClick = onSubmit)
                ResultBadge(uiState.lastAnswerCorrect)
            }
            Spacer(modifier = Modifier.height(18.dp))
            MasteryRulePanel(quest)
        }
    }
}

@Composable
private fun FloatingAssistantDock(
    opened: Boolean,
    quest: WrongItem?,
    message: String,
    showFullAnalysis: Boolean,
    onToggle: () -> Unit,
    onDismiss: () -> Unit,
    onHint: () -> Unit,
    onLecture: () -> Unit,
    onReason: () -> Unit,
    onTransfer: () -> Unit,
    onRevealAnswer: () -> Unit,
    modifier: Modifier = Modifier,
) {
    if (opened) {
        AIHintPanel(
            quest = quest,
            message = message,
            showFullAnalysis = showFullAnalysis,
            onHint = onHint,
            onLecture = onLecture,
            onReason = onReason,
            onTransfer = onTransfer,
            onRevealAnswer = onRevealAnswer,
            onDismiss = onDismiss,
            modifier = modifier.size(width = 320.dp, height = 455.dp),
        )
    } else {
        StudyPressable(modifier = modifier, onClick = onToggle) {
            StudyGlassPanel(
                modifier = Modifier.size(width = 206.dp, height = 76.dp),
                radius = 28.dp,
                glow = StudyGlowPurple.copy(alpha = 0.42f),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    RobotHead(modifier = Modifier.size(58.dp))
                    Column {
                        Text("AI 助手", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                        Text(
                            text = if (opened) "点击收起解析" else "遇到困难再问我",
                            color = StudyTextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StageLadder(quest: WrongItem) {
    Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
        ChallengeStage.entries.forEach { stage ->
            val done = stage in quest.completedIndependentStages
            val active = stage == quest.currentStage && quest.status != WrongQuestStatus.MASTERED
            Box(
                modifier = Modifier
                    .size(18.dp)
                    .clip(CircleShape)
                    .background(
                        when {
                            done -> StudyGlowGreen
                            active -> StudyGlowBlue
                            else -> Color.White.copy(alpha = 0.16f)
                        },
                    )
                    .border(1.dp, Color.White.copy(alpha = 0.22f), CircleShape),
            )
        }
    }
}

@Composable
private fun MasteryRulePanel(quest: WrongItem) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 24.dp, glow = StudyGlowPurple.copy(alpha = 0.18f)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("掌握标准", color = StudyGlowPurple, fontSize = 13.sp, fontWeight = FontWeight.Black)
            RuleLine("1. 原题重新做，完全独立正确", ChallengeStage.Original in quest.completedIndependentStages)
            RuleLine("2. 第一道同类题独立正确", ChallengeStage.VariantOne in quest.completedIndependentStages)
            RuleLine("3. 第二道同类题独立正确", ChallengeStage.VariantTwo in quest.completedIndependentStages)
            RuleLine("4. 第三道综合题独立正确", ChallengeStage.Integrated in quest.completedIndependentStages)
            Text("过程中再次出错，掌握率会下降并重新挑战。", color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun RuleLine(text: String, done: Boolean) {
    Text(
        text = "${if (done) "✓" else "•"} $text",
        color = if (done) StudyGlowGreen else StudyTextSecondary,
        fontSize = 13.sp,
        fontWeight = FontWeight.Bold,
    )
}

@Composable
private fun ResultBadge(correct: Boolean?) {
    val text = when (correct) {
        true -> "独立正确，生成下一关"
        false -> "未掌握，换题重试"
        null -> "等待提交"
    }
    val color = when (correct) {
        true -> StudyGlowGreen
        false -> StudyGlowOrange
        null -> StudyGlowBlue
    }
    Text(
        text = text,
        color = color,
        fontSize = 13.sp,
        fontWeight = FontWeight.Black,
        modifier = Modifier
            .clip(RoundedCornerShape(99.dp))
            .background(color.copy(alpha = 0.14f))
            .border(1.dp, color.copy(alpha = 0.36f), RoundedCornerShape(99.dp))
            .padding(horizontal = 12.dp, vertical = 8.dp),
    )
}

@Composable
private fun InfoBlock(title: String, body: String, accent: Color = StudyTextSecondary) {
    Spacer(modifier = Modifier.height(12.dp))
    Text(title, color = StudyGlowBlue, fontSize = 11.sp, fontWeight = FontWeight.Black)
    Text(body, color = accent, fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold)
}

@Composable
private fun QuestCompleteOverlay() {
    val transition = rememberInfiniteTransition()
    val scale by transition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(tween(720), RepeatMode.Reverse),
    )
    AnimatedVisibility(visible = true) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xAA030716)),
            contentAlignment = Alignment.Center,
        ) {
            StudyGlassPanel(
                modifier = Modifier
                    .size(width = 390.dp, height = 210.dp)
                    .scale(scale),
                radius = 34.dp,
                glow = StudyGlowGreen.copy(alpha = 0.55f),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(26.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                ) {
                    Text("🏆", fontSize = 44.sp)
                    Text("错题任务完成", color = StudyTextPrimary, fontSize = 31.sp, fontWeight = FontWeight.Black)
                    Text("发光奖励已结算，娱乐权限可恢复", color = StudyGlowGreen, fontSize = 14.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}
