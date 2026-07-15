package com.kiddo.launcher.aipartner

import androidx.compose.foundation.Image
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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.scale
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
import com.kiddo.launcher.study.component.StudyProgressBar
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun AIEggScreen(
    state: PartnerState,
    onBack: () -> Unit,
    onStudyTask: () -> Unit,
    onWrongBookQuest: () -> Unit,
    onInteract: () -> Unit,
    onHatch: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(
        modifier = modifier.size(width = 1128.dp, height = 704.dp),
        radius = 34.dp,
        glow = StudyGlowBlue.copy(alpha = 0.34f),
    ) {
        Row(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalArrangement = Arrangement.spacedBy(20.dp)) {
            StudyGlassPanel(modifier = Modifier.width(476.dp).fillMaxHeight(), radius = 30.dp, glow = StudyGlowPurple.copy(alpha = 0.24f)) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Image(
                        painter = painterResource(LauncherResources.glowPink),
                        contentDescription = null,
                        modifier = Modifier.size(390.dp).blur(18.dp),
                        contentScale = ContentScale.FillBounds,
                        colorFilter = ColorFilter.tint(StudyGlowPink),
                        alpha = 0.42f,
                    )
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("AI孵化中心", color = StudyTextPrimary, fontSize = 34.sp, fontWeight = FontWeight.Black)
                        Text("你的长期伙伴正在形成", color = StudyGlowBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(28.dp))
                        Image(
                            painter = painterResource(LauncherResources.aiEgg),
                            contentDescription = "AI蛋",
                            modifier = Modifier.size(330.dp).scale(1.08f),
                            contentScale = ContentScale.Fit,
                        )
                        Spacer(modifier = Modifier.height(18.dp))
                        Text("${state.eggProgress}%", color = StudyTextPrimary, fontSize = 46.sp, fontWeight = FontWeight.Black)
                        Text("孵化进度", color = StudyGlowGreen, fontSize = 14.sp, fontWeight = FontWeight.Black)
                    }
                }
            }

            Column(modifier = Modifier.weight(1f).fillMaxHeight(), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
                    Spacer(modifier = Modifier.weight(1f))
                    StatusPill("金币 ${state.coin}", StudyGlowOrange)
                    Spacer(modifier = Modifier.width(10.dp))
                    StatusPill("经验值 ${state.exp}/${state.expToNext}", StudyGlowBlue)
                }

                StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 28.dp, glow = StudyGlowGreen.copy(alpha = 0.20f)) {
                    Column(modifier = Modifier.padding(22.dp)) {
                        Text("距离孵化", color = StudyTextPrimary, fontSize = 30.sp, fontWeight = FontWeight.Black)
                        Text("完成学习、错题与互动，AI蛋会吸收成长能量。", color = StudyTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Spacer(modifier = Modifier.height(18.dp))
                        StudyProgressBar(progress = state.eggProgress / 100f, color = StudyGlowGreen, width = 472.dp)
                        Spacer(modifier = Modifier.height(18.dp))
                        state.hatchRequirements.forEach { requirement ->
                            RequirementRow(requirement)
                            Spacer(modifier = Modifier.height(10.dp))
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    PartnerActionCard(
                        title = "学习任务",
                        body = "获得经验值和金币，为AI蛋补充学习能量。",
                        accent = StudyGlowBlue,
                        modifier = Modifier.weight(1f),
                        onClick = onStudyTask,
                    )
                    PartnerActionCard(
                        title = "错题本任务",
                        body = "独立解决错题，孵化能量提升更快。",
                        accent = StudyGlowOrange,
                        modifier = Modifier.weight(1f),
                        onClick = onWrongBookQuest,
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    PartnerActionCard(
                        title = "轻触互动",
                        body = "累计互动会让AI蛋更熟悉你。",
                        accent = StudyGlowPink,
                        modifier = Modifier.weight(1f),
                        onClick = onInteract,
                    )
                    PartnerActionCard(
                        title = if (state.eggProgress >= 100) "开始孵化" else "孵化准备中",
                        body = if (state.eggProgress >= 100) "AI蛋裂开，伙伴诞生。" else "继续完成任务，进度到 100% 后孵化。",
                        accent = StudyGlowGreen,
                        modifier = Modifier.weight(1f),
                        onClick = {
                            if (state.eggProgress >= 100) onHatch()
                        },
                    )
                }
                Text(
                    text = state.activeMessage,
                    color = StudyTextSecondary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }
    }
}

@Composable
private fun RequirementRow(requirement: HatchRequirement) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        MiniDot(if (requirement.done) StudyGlowGreen else StudyGlowBlue)
        Spacer(modifier = Modifier.width(10.dp))
        Text(requirement.label, color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
        Spacer(modifier = Modifier.weight(1f))
        Text("${requirement.current}/${requirement.target}", color = if (requirement.done) StudyGlowGreen else StudyTextSecondary, fontSize = 14.sp, fontWeight = FontWeight.Black)
    }
}
