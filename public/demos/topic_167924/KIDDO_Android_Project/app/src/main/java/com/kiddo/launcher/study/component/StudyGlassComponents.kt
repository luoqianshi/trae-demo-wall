package com.kiddo.launcher.study.component

import androidx.annotation.DrawableRes
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.model.AiCourseRecommendation
import com.kiddo.launcher.study.model.RecentStudyItem
import com.kiddo.launcher.study.model.StudyStage
import com.kiddo.launcher.study.model.StudySubject
import com.kiddo.launcher.study.model.StudyStat
import com.kiddo.launcher.ui.LauncherResources

val StudyGlowBlue = Color(0xFF55C8FF)
val StudyGlowPurple = Color(0xFFA56BFF)
val StudyGlowPink = Color(0xFFFF7DF0)
val StudyGlowGreen = Color(0xFF78F6A0)
val StudyGlowOrange = Color(0xFFFFBE63)
val StudyTextPrimary = Color.White
val StudyTextSecondary = Color(0xD8E7F3FF)
private val StudyGlassDeep = Color(0xB0061034)
private val StudyGlassMid = Color(0x8C0A1946)
private val StudyGlassStroke = Color.White.copy(alpha = 0.22f)

@Composable
fun StudyGlassPanel(
    modifier: Modifier = Modifier,
    radius: Dp = 24.dp,
    glow: Color = StudyGlowBlue.copy(alpha = 0.22f),
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = RoundedCornerShape(radius)
    Box(
        modifier = modifier
            .shadow(
                elevation = 18.dp,
                shape = shape,
                ambientColor = glow,
                spotColor = glow,
            )
            .background(
                brush = Brush.verticalGradient(
                    listOf(
                        Color.White.copy(alpha = 0.10f),
                        StudyGlassMid,
                        StudyGlassDeep,
                    ),
                ),
                shape = shape,
            )
            .border(1.dp, StudyGlassStroke, shape)
            .padding(1.dp),
        content = content,
    )
}

@Composable
fun StudyPressable(
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
    content: @Composable BoxScope.() -> Unit,
) {
    val interactionSource = remember { MutableInteractionSource() }
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) 0.96f else 1f, label = "study_press")

    Box(
        modifier = modifier
            .scale(scale)
            .clickable(
                interactionSource = interactionSource,
                indication = ripple(bounded = false),
                onClick = onClick,
            ),
        content = content,
    )
}

@Composable
fun StudyStatChip(
    stat: StudyStat,
    accent: Color,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 20.dp, glow = accent.copy(alpha = 0.30f)) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(accent.copy(alpha = 0.22f)),
                contentAlignment = Alignment.Center,
            ) {
                Box(
                    modifier = Modifier
                        .size(14.dp)
                        .clip(CircleShape)
                        .background(accent),
                )
            }
            Spacer(modifier = Modifier.width(10.dp))
            Column {
                Text(stat.title, color = StudyTextPrimary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                Text(stat.value, color = accent, fontSize = 22.sp, fontWeight = FontWeight.Black)
                Text(stat.description, color = StudyTextSecondary, fontSize = 8.sp)
            }
        }
    }
}

@Composable
fun StageBuildingCard(
    stage: StudyStage,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
    onStartClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        StudyGlassPanel(
            modifier = Modifier.fillMaxSize(),
            radius = 26.dp,
            glow = accent.copy(alpha = 0.34f),
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                Image(
                    painter = painterResource(LauncherResources.glowBlue),
                    contentDescription = null,
                    modifier = Modifier
                        .align(Alignment.Center)
                        .fillMaxSize()
                        .scale(1.2f)
                        .blur(12.dp),
                    contentScale = ContentScale.FillBounds,
                    alpha = 0.36f,
                    colorFilter = ColorFilter.tint(accent),
                )
                Image(
                    painter = painterResource(stage.imageRes),
                    contentDescription = stage.title,
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 8.dp)
                        .size(width = 150.dp, height = 104.dp),
                    contentScale = ContentScale.Fit,
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(14.dp),
                ) {
                    Text(stage.title, color = StudyTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
                    Text(stage.subtitle, color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(stage.learnerCount, color = StudyTextSecondary, fontSize = 9.sp)
                    Spacer(modifier = Modifier.height(6.dp))
                    StudyProgressBar(progress = stage.completionRate / 100f, color = accent, width = 116.dp)
                }
                StudyMiniButton(
                    text = stage.buttonText,
                    accent = accent,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(12.dp),
                    onClick = onStartClick,
                )
            }
        }
    }
}

@Composable
fun SubjectIcon(
    subject: StudySubject,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            StudyGlassPanel(
                modifier = Modifier.size(54.dp),
                radius = 18.dp,
                glow = accent.copy(alpha = 0.30f),
            ) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(subject.shortName, color = accent, fontSize = 18.sp, fontWeight = FontWeight.Black)
                }
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = subject.title,
                color = StudyTextSecondary,
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
            )
        }
    }
}

@Composable
fun AiRecommendationPanel(
    items: List<AiCourseRecommendation>,
    modifier: Modifier = Modifier,
    onClick: (AiCourseRecommendation) -> Unit,
) {
    StudyGlassPanel(modifier = modifier, radius = 28.dp, glow = StudyGlowPurple.copy(alpha = 0.34f)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RobotHead(modifier = Modifier.size(58.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("AI推荐课程", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    Text("今天继续数学", color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
            Spacer(modifier = Modifier.height(14.dp))
            items.forEachIndexed { index, item ->
                RecommendationItem(
                    item = item,
                    accent = if (index == 0) StudyGlowGreen else StudyGlowPink,
                    onClick = { onClick(item) },
                )
                if (index != items.lastIndex) Spacer(modifier = Modifier.height(10.dp))
            }
        }
    }
}

@Composable
private fun RecommendationItem(
    item: AiCourseRecommendation,
    accent: Color,
    onClick: () -> Unit,
) {
    StudyPressable(onClick = onClick) {
        StudyGlassPanel(
            modifier = Modifier.fillMaxWidth(),
            radius = 18.dp,
            glow = accent.copy(alpha = 0.22f),
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(item.title, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.weight(1f))
                    Text(item.tag, color = accent, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    item.description,
                    color = StudyTextSecondary,
                    fontSize = 10.sp,
                    lineHeight = 14.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(modifier = Modifier.height(8.dp))
                StudyProgressBar(progress = item.progress, color = accent, width = 176.dp)
            }
        }
    }
}

@Composable
fun RecentStudyPanel(
    items: List<RecentStudyItem>,
    modifier: Modifier = Modifier,
    onClick: (RecentStudyItem) -> Unit,
) {
    StudyGlassPanel(modifier = modifier, radius = 24.dp, glow = StudyGlowBlue.copy(alpha = 0.24f)) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text("最近学习课程", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(10.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items.forEachIndexed { index, item ->
                    RecentStudyCard(
                        item = item,
                        accent = listOf(StudyGlowBlue, StudyGlowGreen, StudyGlowOrange)[index % 3],
                        modifier = Modifier.weight(1f),
                        onClick = { onClick(item) },
                    )
                }
            }
        }
    }
}

@Composable
private fun RecentStudyCard(
    item: RecentStudyItem,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 18.dp, glow = accent.copy(alpha = 0.20f)) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(item.type, color = accent, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Text(item.title, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black)
                Text(
                    item.description,
                    color = StudyTextSecondary,
                    fontSize = 10.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(modifier = Modifier.height(8.dp))
                StudyProgressBar(progress = item.progress, color = accent, width = 116.dp)
            }
        }
    }
}

@Composable
fun StudyMiniButton(
    text: String,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(16.dp))
                .background(
                    Brush.horizontalGradient(
                        listOf(accent.copy(alpha = 0.92f), StudyGlowPurple.copy(alpha = 0.84f)),
                    ),
                )
                .border(1.dp, Color.White.copy(alpha = 0.24f), RoundedCornerShape(16.dp))
                .padding(horizontal = 14.dp, vertical = 8.dp),
            contentAlignment = Alignment.Center,
        ) {
            Text(text, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
fun StudyProgressBar(
    progress: Float,
    color: Color,
    width: Dp,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .size(width = width, height = 6.dp)
            .clip(RoundedCornerShape(6.dp))
            .background(Color.White.copy(alpha = 0.14f)),
    ) {
        Box(
            modifier = Modifier
                .fillMaxHeight()
                .width(width * progress.coerceIn(0f, 1f))
                .clip(RoundedCornerShape(6.dp))
                .background(color),
        )
    }
}

@Composable
fun RobotHead(modifier: Modifier = Modifier) {
    Box(modifier = modifier, contentAlignment = Alignment.Center) {
        Image(
            painter = painterResource(LauncherResources.glowBlue),
            contentDescription = null,
            modifier = Modifier.fillMaxSize().blur(8.dp),
            contentScale = ContentScale.FillBounds,
            alpha = 0.44f,
        )
        StudyGlassPanel(modifier = Modifier.fillMaxSize(), radius = 24.dp, glow = StudyGlowBlue.copy(alpha = 0.36f)) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("AI", color = StudyGlowBlue, fontSize = 16.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
fun StudySidebarRobot(modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        RobotHead(modifier = Modifier.size(72.dp))
        Spacer(modifier = Modifier.height(8.dp))
        Text("AI学习伙伴", color = StudyTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Black)
        Text("守护你的成长", color = StudyTextSecondary, fontSize = 9.sp, textAlign = TextAlign.Center)
    }
}
