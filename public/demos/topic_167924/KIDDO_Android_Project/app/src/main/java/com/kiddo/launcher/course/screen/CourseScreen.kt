package com.kiddo.launcher.course.screen

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.togetherWith
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.course.model.CourseChapter
import com.kiddo.launcher.course.model.CourseEvent
import com.kiddo.launcher.course.model.CourseUiState
import com.kiddo.launcher.course.model.KiddoCourse
import com.kiddo.launcher.course.viewmodel.CourseViewModel
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
import kotlin.math.min

private val CourseDesignWidth = 1280.dp
private val CourseDesignHeight = 800.dp

private fun Int.cdp(scale: Float): Dp = (this * scale).dp

@Composable
fun CourseScreen(
    viewModel: CourseViewModel,
    onBack: () -> Unit,
    onOpenVideo: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val uiState by viewModel.uiState.collectAsState()

    CourseContent(
        uiState = uiState,
        onEvent = viewModel::onEvent,
        onBack = onBack,
        onOpenVideo = onOpenVideo,
        modifier = modifier,
    )
}

@OptIn(ExperimentalAnimationApi::class)
@Composable
private fun CourseContent(
    uiState: CourseUiState,
    onEvent: (CourseEvent) -> Unit,
    onBack: () -> Unit,
    onOpenVideo: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val configuration = LocalConfiguration.current
    val scale = min(
        configuration.screenWidthDp / CourseDesignWidth.value,
        configuration.screenHeightDp / CourseDesignHeight.value,
    )
    val selectedCourse = uiState.courses.firstOrNull { it.id == uiState.selectedCourseId }
        ?: uiState.courses.firstOrNull()

    Box(
        modifier = modifier.fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        CourseBackground()
        Box(modifier = Modifier.size(CourseDesignWidth * scale, CourseDesignHeight * scale)) {
            CourseBoard(
                uiState = uiState,
                selectedCourse = selectedCourse,
                scale = scale,
                onEvent = onEvent,
                onBack = onBack,
                onOpenVideo = onOpenVideo,
            )
        }
    }
}

@Composable
private fun CourseBackground() {
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
                            Color(0xEE03081F),
                            Color(0xB3071740),
                            Color(0xEE050B2A),
                        ),
                    ),
                ),
        )
        Image(
            painter = painterResource(LauncherResources.glowBlue),
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.CenterStart)
                .size(720.dp)
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
                .blur(32.dp),
            alpha = 0.16f,
            contentScale = ContentScale.FillBounds,
        )
    }
}

@Composable
private fun CourseBoard(
    uiState: CourseUiState,
    selectedCourse: KiddoCourse?,
    scale: Float,
    onEvent: (CourseEvent) -> Unit,
    onBack: () -> Unit,
    onOpenVideo: () -> Unit,
) {
    Row(modifier = Modifier.fillMaxSize()) {
        ChapterDirectory(
            chapters = uiState.chapters,
            courses = uiState.courses,
            selectedCourseId = uiState.selectedCourseId,
            modifier = Modifier
                .offset(x = 18.cdp(scale), y = 24.cdp(scale))
                .size(width = 246.cdp(scale), height = 752.cdp(scale)),
            onEvent = onEvent,
            onBack = onBack,
            onOpenVideo = onOpenVideo,
        )
        CourseListPanel(
            courses = uiState.courses,
            chapters = uiState.chapters,
            selectedCourseId = uiState.selectedCourseId,
            modifier = Modifier
                .offset(x = 40.cdp(scale), y = 24.cdp(scale))
                .size(width = 548.cdp(scale), height = 752.cdp(scale)),
            onEvent = onEvent,
            onOpenVideo = onOpenVideo,
        )
        CourseDetailPanel(
            course = selectedCourse,
            modifier = Modifier
                .offset(x = 62.cdp(scale), y = 24.cdp(scale))
                .size(width = 366.cdp(scale), height = 752.cdp(scale)),
            onStart = { course ->
                onEvent(CourseEvent.SelectCourse(course.id))
                onOpenVideo()
            },
        )
    }
}

@Composable
private fun ChapterDirectory(
    chapters: List<CourseChapter>,
    courses: List<KiddoCourse>,
    selectedCourseId: String,
    modifier: Modifier = Modifier,
    onEvent: (CourseEvent) -> Unit,
    onBack: () -> Unit,
    onOpenVideo: () -> Unit,
) {
    StudyGlassPanel(modifier = modifier, radius = 30.dp, glow = StudyGlowPurple.copy(alpha = 0.28f)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
        ) {
            StudyMiniButton(
                text = "返回学习",
                accent = StudyGlowPurple,
                modifier = Modifier.fillMaxWidth(),
                onClick = onBack,
            )
            Spacer(modifier = Modifier.height(14.dp))
            Text("章节目录", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
            Text("KIDDO COURSE MAP", color = StudyGlowBlue, fontSize = 9.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(18.dp))
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                chapters.forEachIndexed { index, chapter ->
                    val accent = listOf(StudyGlowBlue, StudyGlowGreen, StudyGlowOrange, StudyGlowPink)[index % 4]
                    ChapterItem(
                        chapter = chapter,
                        courses = courses.filter { it.chapterId == chapter.id },
                        selectedCourseId = selectedCourseId,
                        accent = accent,
                        onToggle = { onEvent(CourseEvent.ToggleChapter(chapter.id)) },
                        onStart = { course ->
                            onEvent(CourseEvent.SelectCourse(course.id))
                            onOpenVideo()
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun ChapterItem(
    chapter: CourseChapter,
    courses: List<KiddoCourse>,
    selectedCourseId: String,
    accent: Color,
    onToggle: () -> Unit,
    onStart: (KiddoCourse) -> Unit,
) {
    Column {
        StudyPressable(onClick = onToggle) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(18.dp))
                    .background(Color.White.copy(alpha = 0.07f))
                    .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(18.dp))
                    .padding(horizontal = 12.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(accent),
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(chapter.title, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black)
                    Text(
                        chapter.subtitle,
                        color = StudyTextSecondary,
                        fontSize = 9.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(if (chapter.expanded) "v" else ">", color = accent, fontSize = 14.sp, fontWeight = FontWeight.Black)
            }
        }
        if (chapter.expanded) {
            Spacer(modifier = Modifier.height(8.dp))
            Column(
                modifier = Modifier.padding(start = 18.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                courses.forEach { course ->
                    val selected = course.id == selectedCourseId
                    StudyPressable(onClick = { onStart(course) }) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(14.dp))
                                .background(
                                    if (selected) accent.copy(alpha = 0.18f) else Color.White.copy(alpha = 0.04f),
                                )
                                .padding(horizontal = 10.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("0${courses.indexOf(course) + 1}", color = accent, fontSize = 9.sp, fontWeight = FontWeight.Black)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                course.title,
                                color = if (selected) StudyTextPrimary else StudyTextSecondary,
                                fontSize = 10.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun CourseListPanel(
    courses: List<KiddoCourse>,
    chapters: List<CourseChapter>,
    selectedCourseId: String,
    modifier: Modifier = Modifier,
    onEvent: (CourseEvent) -> Unit,
    onOpenVideo: () -> Unit,
) {
    val expandedChapterIds = chapters.filter { it.expanded }.map { it.id }.toSet()
    val visibleCourses = courses.filter { it.chapterId in expandedChapterIds }

    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowBlue.copy(alpha = 0.28f)) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
        ) {
            Row(verticalAlignment = Alignment.Bottom) {
                Column {
                    Text("课程列表", color = StudyTextPrimary, fontSize = 24.sp, fontWeight = FontWeight.Black)
                    Text("点击课程进入视频学习", color = StudyTextSecondary, fontSize = 11.sp)
                }
                Spacer(modifier = Modifier.weight(1f))
                Text("${visibleCourses.size} LESSONS", color = StudyGlowGreen, fontSize = 10.sp, fontWeight = FontWeight.Black)
            }
            Spacer(modifier = Modifier.height(16.dp))
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                items(visibleCourses, key = { it.id }) { course ->
                    val index = courses.indexOf(course)
                    CourseCard(
                        course = course,
                        accent = listOf(StudyGlowBlue, StudyGlowGreen, StudyGlowOrange, StudyGlowPink)[index % 4],
                        selected = course.id == selectedCourseId,
                        onClick = {
                            onEvent(CourseEvent.SelectCourse(course.id))
                            onOpenVideo()
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun CourseCard(
    course: KiddoCourse,
    accent: Color,
    selected: Boolean,
    onClick: () -> Unit,
) {
    StudyPressable(onClick = onClick) {
        StudyGlassPanel(
            modifier = Modifier
                .fillMaxWidth()
                .height(156.dp),
            radius = 26.dp,
            glow = if (selected) accent.copy(alpha = 0.36f) else accent.copy(alpha = 0.18f),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier
                        .size(width = 144.dp, height = 116.dp)
                        .clip(RoundedCornerShape(22.dp))
                        .background(accent.copy(alpha = 0.18f)),
                    contentAlignment = Alignment.Center,
                ) {
                    Image(
                        painter = painterResource(LauncherResources.glowBlue),
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize().blur(8.dp),
                        alpha = 0.36f,
                        colorFilter = ColorFilter.tint(accent),
                        contentScale = ContentScale.FillBounds,
                    )
                    Image(
                        painter = painterResource(course.coverRes),
                        contentDescription = course.title,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(10.dp),
                        contentScale = ContentScale.Fit,
                    )
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(course.title, color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.width(10.dp))
                        CourseChip(text = course.difficulty, accent = accent)
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(course.subtitle, color = StudyTextSecondary, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        CourseMetric("时间", "${course.studyTimeMinutes}分钟", StudyGlowBlue)
                        CourseMetric("完成", "${course.completionRate}%", StudyGlowGreen)
                        CourseMetric("奖励", "+${course.rewardPoints}", StudyGlowOrange)
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    StudyProgressBar(progress = course.completionRate / 100f, color = accent, width = 260.dp)
                }
            }
        }
    }
}

@Composable
private fun CourseDetailPanel(
    course: KiddoCourse?,
    modifier: Modifier = Modifier,
    onStart: (KiddoCourse) -> Unit,
) {
    StudyGlassPanel(modifier = modifier, radius = 32.dp, glow = StudyGlowGreen.copy(alpha = 0.26f)) {
        if (course == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("请选择课程", color = StudyTextSecondary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
            return@StudyGlassPanel
        }
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(18.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                RobotHead(modifier = Modifier.size(66.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("课程详情", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                    Text("AI STUDY PLAN", color = StudyGlowGreen, fontSize = 9.sp, fontWeight = FontWeight.Black)
                }
            }
            Spacer(modifier = Modifier.height(18.dp))
            Image(
                painter = painterResource(course.coverRes),
                contentDescription = course.title,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(168.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .background(StudyGlowBlue.copy(alpha = 0.12f))
                    .padding(12.dp),
                contentScale = ContentScale.Fit,
            )
            Spacer(modifier = Modifier.height(18.dp))
            Text(course.title, color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
            Text(course.subtitle, color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(14.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CourseChip(text = course.difficulty, accent = StudyGlowBlue)
                CourseChip(text = "${course.studyTimeMinutes}分钟", accent = StudyGlowGreen)
                CourseChip(text = "+${course.rewardPoints}积分", accent = StudyGlowOrange)
            }
            Spacer(modifier = Modifier.height(20.dp))
            DetailBlock(title = "课程简介", body = course.introduction, accent = StudyGlowBlue)
            Spacer(modifier = Modifier.height(14.dp))
            DetailBlock(title = "AI推荐", body = course.aiRecommendation, accent = StudyGlowPurple)
            Spacer(modifier = Modifier.weight(1f))
            StudyMiniButton(
                text = "开始学习",
                accent = StudyGlowGreen,
                modifier = Modifier.fillMaxWidth(),
                onClick = { onStart(course) },
            )
        }
    }
}

@Composable
private fun VideoLearningScreen(
    course: KiddoCourse,
    scale: Float,
    onBack: () -> Unit,
) {
    Row(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 18.cdp(scale), vertical = 24.cdp(scale)),
        horizontalArrangement = Arrangement.spacedBy(18.cdp(scale)),
    ) {
        StudyGlassPanel(
            modifier = Modifier
                .weight(1f)
                .fillMaxHeight(),
            radius = 34.dp,
            glow = StudyGlowBlue.copy(alpha = 0.34f),
        ) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StudyMiniButton(text = "返回课程", accent = StudyGlowPurple, onClick = onBack)
                    Spacer(modifier = Modifier.width(14.dp))
                    Column {
                        Text(course.title, color = StudyTextPrimary, fontSize = 24.sp, fontWeight = FontWeight.Black)
                        Text("VIDEO LEARNING", color = StudyGlowBlue, fontSize = 10.sp, fontWeight = FontWeight.Black)
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .clip(RoundedCornerShape(30.dp))
                        .background(Color(0xEE030816))
                        .border(1.dp, Color.White.copy(alpha = 0.16f), RoundedCornerShape(30.dp)),
                    contentAlignment = Alignment.Center,
                ) {
                    Image(
                        painter = painterResource(course.coverRes),
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(46.dp)
                            .scale(0.92f),
                        alpha = 0.72f,
                        contentScale = ContentScale.Fit,
                    )
                    Box(
                        modifier = Modifier
                            .size(104.dp)
                            .clip(CircleShape)
                            .background(StudyGlowBlue.copy(alpha = 0.24f))
                            .border(1.dp, Color.White.copy(alpha = 0.26f), CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text("PLAY", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    CourseMetric("难度", course.difficulty, StudyGlowBlue)
                    CourseMetric("时长", "${course.studyTimeMinutes}分钟", StudyGlowGreen)
                    CourseMetric("奖励", "+${course.rewardPoints}", StudyGlowOrange)
                }
            }
        }

        StudyGlassPanel(
            modifier = Modifier
                .width(340.cdp(scale))
                .fillMaxHeight(),
            radius = 32.dp,
            glow = StudyGlowPurple.copy(alpha = 0.28f),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(18.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    RobotHead(modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("AI陪学", color = StudyTextPrimary, fontSize = 21.sp, fontWeight = FontWeight.Black)
                        Text("实时提示与复盘", color = StudyTextSecondary, fontSize = 10.sp)
                    }
                }
                Spacer(modifier = Modifier.height(18.dp))
                DetailBlock(
                    title = "学习目标",
                    body = "看完视频后完成 5 道互动题，AI 会根据答题过程生成本节掌握报告。",
                    accent = StudyGlowGreen,
                )
                Spacer(modifier = Modifier.height(14.dp))
                DetailBlock(
                    title = "AI提示",
                    body = course.aiRecommendation,
                    accent = StudyGlowBlue,
                )
                Spacer(modifier = Modifier.height(14.dp))
                DetailBlock(
                    title = "本节奖励",
                    body = "完成课程可获得 +${course.rewardPoints} 积分，并点亮学习星球的一枚能量徽章。",
                    accent = StudyGlowOrange,
                )
            }
        }
    }
}

@Composable
private fun CourseMetric(
    label: String,
    value: String,
    accent: Color,
) {
    Column {
        Text(label, color = StudyTextSecondary, fontSize = 9.sp, fontWeight = FontWeight.Bold)
        Text(value, color = accent, fontSize = 13.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun CourseChip(
    text: String,
    accent: Color,
) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(14.dp))
            .background(accent.copy(alpha = 0.18f))
            .border(1.dp, accent.copy(alpha = 0.36f), RoundedCornerShape(14.dp))
            .padding(horizontal = 10.dp, vertical = 5.dp),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = accent, fontSize = 9.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun DetailBlock(
    title: String,
    body: String,
    accent: Color,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.06f))
            .border(1.dp, Color.White.copy(alpha = 0.10f), RoundedCornerShape(20.dp))
            .padding(14.dp),
    ) {
        Text(title, color = accent, fontSize = 12.sp, fontWeight = FontWeight.Black)
        Spacer(modifier = Modifier.height(6.dp))
        Text(body, color = StudyTextSecondary, fontSize = 11.sp, lineHeight = 17.sp)
    }
}
