package com.kiddo.launcher.aipartner

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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
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

@Composable
fun AIPartnerHome(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by PartnerRepository.state.collectAsState()

    Box(modifier = modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        PartnerBackground()
        if (!state.hatched) {
            AIEggScreen(
                state = state,
                onBack = onBack,
                onStudyTask = PartnerRepository::recordStudyTask,
                onWrongBookQuest = PartnerRepository::recordWrongBookQuest,
                onInteract = PartnerRepository::interactWithPartner,
                onHatch = PartnerRepository::hatchNow,
            )
        } else {
            PartnerHomeContent(state = state, onBack = onBack)
        }
    }
}

@Composable
private fun PartnerHomeContent(
    state: PartnerState,
    onBack: () -> Unit,
) {
    var selectedTab by rememberSaveable { mutableStateOf(PartnerTab.Companion) }

    StudyGlassPanel(
        modifier = Modifier.size(width = 1148.dp, height = 714.dp),
        radius = 34.dp,
        glow = StudyGlowPurple.copy(alpha = 0.34f),
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(22.dp)) {
            when (selectedTab) {
                PartnerTab.Companion,
                PartnerTab.Interact -> PartnerInteractionPanel(
                    state = state,
                    selectedTab = selectedTab,
                    onBack = onBack,
                    modifier = Modifier.fillMaxSize().padding(bottom = 76.dp),
                )
                PartnerTab.Diary,
                PartnerTab.Shop -> Row(
                    modifier = Modifier.fillMaxSize().padding(bottom = 76.dp),
                    horizontalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    PartnerDisplayPanel(
                        state = state,
                        onBack = onBack,
                        onInteract = PartnerRepository::interactWithPartner,
                        modifier = Modifier.width(390.dp).fillMaxHeight(),
                    )
                    PartnerInteractionPanel(
                        state = state,
                        selectedTab = selectedTab,
                        onBack = onBack,
                        modifier = Modifier.weight(1f).fillMaxHeight(),
                    )
                }
            }

            PartnerBottomTabs(
                selected = selectedTab,
                onSelect = { selectedTab = it },
                modifier = Modifier.align(Alignment.BottomCenter),
            )
        }
    }
}

@Composable
private fun PartnerDisplayPanel(
    state: PartnerState,
    onBack: () -> Unit,
    onInteract: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 30.dp, glow = StudyGlowBlue.copy(alpha = 0.26f)) {
        Box(modifier = Modifier.fillMaxSize()) {
            Image(
                painter = painterResource(LauncherResources.glowBlue),
                contentDescription = null,
                modifier = Modifier.align(Alignment.Center).size(320.dp).blur(16.dp),
                contentScale = ContentScale.FillBounds,
                colorFilter = ColorFilter.tint(StudyGlowBlue),
                alpha = 0.42f,
            )
            Column(
                modifier = Modifier.fillMaxSize().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
                    Spacer(modifier = Modifier.weight(1f))
                    StatusPill(state.mood.label, StudyGlowGreen)
                }
                Spacer(modifier = Modifier.height(18.dp))
                Text(state.partner.name, color = StudyTextPrimary, fontSize = 34.sp, fontWeight = FontWeight.Black)
                Text(state.partner.species, color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(10.dp))
                StudyPressable(onClick = onInteract) {
                    Box(modifier = Modifier.fillMaxWidth().height(240.dp), contentAlignment = Alignment.Center) {
                        Image(
                            painter = painterResource(state.partner.imageRes),
                            contentDescription = state.partner.name,
                            modifier = Modifier.size(230.dp).scale(1.05f),
                            contentScale = ContentScale.Fit,
                        )
                    }
                }
                Text(
                    text = state.activeMessage,
                    color = StudyTextSecondary,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
                Spacer(modifier = Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    StatusPill(state.partner.personality, StudyGlowPink)
                    StatusPill("喜好 ${state.partner.favorite}", StudyGlowOrange)
                }
                Spacer(modifier = Modifier.height(14.dp))
                StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowGreen.copy(alpha = 0.18f)) {
                    Column(modifier = Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("${state.lifeStage.label} Lv.${state.level}", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                            Spacer(modifier = Modifier.weight(1f))
                            Text("金币 ${state.coin}", color = StudyGlowOrange, fontSize = 16.sp, fontWeight = FontWeight.Black)
                        }
                        StudyProgressBar(progress = state.exp.toFloat() / state.expToNext, color = StudyGlowBlue, width = 314.dp)
                        StatBar("亲密度", state.stats.intimacy, StudyGlowPink, width = 314.dp)
                        StatBar("活力", state.stats.vitality, StudyGlowOrange, width = 314.dp)
                        StatBar("心情", state.stats.mood, StudyGlowPurple, width = 314.dp)
                    }
                }
            }
        }
    }
}

@Composable
private fun PartnerGrowthPanel(
    state: PartnerState,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 30.dp, glow = StudyGlowGreen.copy(alpha = 0.22f)) {
        Column(
            modifier = Modifier.fillMaxHeight().padding(18.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text("成长信息", color = StudyTextPrimary, fontSize = 27.sp, fontWeight = FontWeight.Black)
            Text("${state.lifeStage.label} · 等级 ${state.level}", color = StudyGlowGreen, fontSize = 13.sp, fontWeight = FontWeight.Black)
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowBlue.copy(alpha = 0.18f)) {
                Column(modifier = Modifier.padding(15.dp)) {
                    Text("经验值 ${state.exp}/${state.expToNext}", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    Spacer(modifier = Modifier.height(8.dp))
                    StudyProgressBar(progress = state.exp.toFloat() / state.expToNext, color = StudyGlowBlue, width = 222.dp)
                    Spacer(modifier = Modifier.height(10.dp))
                    Text("金币 ${state.coin}", color = StudyGlowOrange, fontSize = 20.sp, fontWeight = FontWeight.Black)
                }
            }
            StatBar("亲密度", state.stats.intimacy, StudyGlowPink)
            StatBar("成长值", state.stats.growth, StudyGlowGreen)
            StatBar("知识力", state.stats.knowledge, StudyGlowBlue)
            StatBar("活力", state.stats.vitality, StudyGlowOrange)
            StatBar("心情", state.stats.mood, StudyGlowPurple)
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowPurple.copy(alpha = 0.18f)) {
                Column(modifier = Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    Text("今日成长", color = StudyGlowPurple, fontSize = 13.sp, fontWeight = FontWeight.Black)
                    Text("聊天 ${state.today.chatCount} 次", color = StudyTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("学习陪伴 ${state.today.studyCompanionCount} 次", color = StudyTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("小游戏 ${state.today.gameCount} 次", color = StudyTextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
private fun PartnerInteractionPanel(
    state: PartnerState,
    selectedTab: PartnerTab,
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier, radius = 30.dp, glow = StudyGlowOrange.copy(alpha = 0.18f)) {
        Box(modifier = Modifier.fillMaxSize().padding(18.dp)) {
            when (selectedTab) {
                PartnerTab.Companion -> AIChatScreen(
                    state = state,
                    onBack = onBack,
                    onChat = PartnerRepository::chat,
                    onAsk = PartnerRepository::askLearningQuestion,
                    onRecordMood = PartnerRepository::recordMood,
                )
                PartnerTab.Interact -> PartnerCareScreen(
                    state = state,
                    onBack = onBack,
                    onTouch = PartnerRepository::interactWithPartner,
                    onFeed = PartnerRepository::feedPartner,
                    onPlay = PartnerRepository::playWithPartner,
                    onHeal = PartnerRepository::healPartner,
                )
                PartnerTab.Diary -> GrowthDiaryScreen(state = state)
                PartnerTab.Shop -> PartnerShopScreen(
                    state = state,
                    onBuy = PartnerRepository::buyItem,
                    onUse = PartnerRepository::useItem,
                )
            }
        }
    }
}

@Composable
private fun PartnerCareScreen(
    state: PartnerState,
    onBack: () -> Unit,
    onTouch: () -> Unit,
    onFeed: () -> Unit,
    onPlay: () -> Unit,
    onHeal: () -> Unit,
) {
    Row(modifier = Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
        StudyGlassPanel(modifier = Modifier.weight(1f).fillMaxHeight(), radius = 28.dp, glow = StudyGlowBlue.copy(alpha = 0.22f)) {
            Box(modifier = Modifier.fillMaxSize()) {
                Image(
                    painter = painterResource(LauncherResources.glowBlue),
                    contentDescription = null,
                    modifier = Modifier.align(Alignment.Center).size(360.dp).blur(18.dp),
                    contentScale = ContentScale.FillBounds,
                    colorFilter = ColorFilter.tint(StudyGlowBlue),
                    alpha = 0.36f,
                )
                Column(
                    modifier = Modifier.fillMaxSize().padding(22.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
                        Spacer(modifier = Modifier.weight(1f))
                        StatusPill(state.mood.label, StudyGlowGreen)
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(state.partner.name, color = StudyTextPrimary, fontSize = 36.sp, fontWeight = FontWeight.Black)
                    Text("${state.partner.species} · ${state.lifeStage.label} Lv.${state.level}", color = StudyGlowBlue, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Box(modifier = Modifier.fillMaxWidth().weight(1f), contentAlignment = Alignment.Center) {
                        Image(
                            painter = painterResource(state.partner.imageRes),
                            contentDescription = state.partner.name,
                            modifier = Modifier.size(310.dp).scale(1.06f),
                            contentScale = ContentScale.Fit,
                        )
                    }
                    PartnerCareStatusPanel(state = state)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = state.activeMessage,
                        color = StudyTextSecondary,
                        fontSize = 15.sp,
                        lineHeight = 21.sp,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        StatusPill("金币 ${state.coin}", StudyGlowOrange)
                        StatusPill("喜好 ${state.partner.favorite}", StudyGlowPink)
                        StatusPill(state.partner.personality, StudyGlowPurple)
                    }
                }
            }
        }
        StudyGlassPanel(modifier = Modifier.width(330.dp).fillMaxHeight(), radius = 28.dp, glow = StudyGlowGreen.copy(alpha = 0.20f)) {
            Column(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("伙伴互动", color = StudyTextPrimary, fontSize = 28.sp, fontWeight = FontWeight.Black)
                Text("用休息和学习获得的金币照顾伙伴。", color = StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                CareActionCard("摸摸", "轻轻互动，提升亲密度和心情。", StudyGlowBlue, onTouch)
                CareActionCard("喂食", "使用背包食物，恢复活力。", StudyGlowGreen, onFeed)
                CareActionCard("玩耍", "短暂游戏互动，增加开心值。", StudyGlowOrange, onPlay)
                CareActionCard("治疗", "使用药品，照顾疲惫状态。", StudyGlowPurple, onHeal)
                Spacer(modifier = Modifier.weight(1f))
                StatBar("亲密度", state.stats.intimacy, StudyGlowPink, width = 286.dp)
                StatBar("活力", state.stats.vitality, StudyGlowOrange, width = 286.dp)
                StatBar("心情", state.stats.mood, StudyGlowPurple, width = 286.dp)
            }
        }
    }
}

@Composable
private fun PartnerCareStatusPanel(state: PartnerState) {
    val hunger = (100 - state.stats.vitality).coerceIn(0, 100)
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 24.dp, glow = StudyGlowPurple.copy(alpha = 0.18f)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp), modifier = Modifier.fillMaxWidth()) {
                CareStatusBar("心情", state.stats.mood, StudyGlowPurple, Modifier.weight(1f))
                CareStatusBar("健康", state.stats.vitality, StudyGlowGreen, Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp), modifier = Modifier.fillMaxWidth()) {
                CareStatusBar("饥饿", hunger, StudyGlowOrange, Modifier.weight(1f))
                CareStatusBar("经验", state.exp * 100 / state.expToNext, StudyGlowBlue, Modifier.weight(1f), "${state.exp}/${state.expToNext}")
            }
        }
    }
}

@Composable
private fun CareStatusBar(
    label: String,
    value: Int,
    accent: Color,
    modifier: Modifier = Modifier,
    valueText: String = "$value",
) {
    Column(modifier = modifier) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(label, color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.weight(1f))
            Text(valueText, color = accent, fontSize = 12.sp, fontWeight = FontWeight.Black)
        }
        Spacer(modifier = Modifier.height(6.dp))
        StudyProgressBar(progress = value.coerceIn(0, 100) / 100f, color = accent, width = 240.dp)
    }
}

@Composable
private fun CareActionCard(
    title: String,
    body: String,
    accent: Color,
    onClick: () -> Unit,
) {
    StudyPressable(onClick = onClick) {
        StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(92.dp), radius = 22.dp, glow = accent.copy(alpha = 0.20f)) {
            Column(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 12.dp), verticalArrangement = Arrangement.Center) {
                Text(title, color = accent, fontSize = 19.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(5.dp))
                Text(body, color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 2)
            }
        }
    }
}

@Composable
private fun PartnerBottomTabs(
    selected: PartnerTab,
    onSelect: (PartnerTab) -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.size(width = 680.dp, height = 60.dp), radius = 26.dp, glow = StudyGlowBlue.copy(alpha = 0.26f)) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            PartnerTab.entries.forEach { tab ->
                val active = tab == selected
                StudyPressable(modifier = Modifier.weight(1f), onClick = { onSelect(tab) }) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(RoundedCornerShape(18.dp))
                            .background(if (active) StudyGlowPurple.copy(alpha = 0.34f) else Color.White.copy(alpha = 0.06f))
                            .border(1.dp, Color.White.copy(alpha = if (active) 0.28f else 0.12f), RoundedCornerShape(18.dp)),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(tab.label, color = if (active) StudyTextPrimary else StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Black)
                    }
                }
            }
        }
    }
}

@Composable
fun PartnerSectionTitle(title: String, subtitle: String) {
    Column {
        Text(title, color = StudyTextPrimary, fontSize = 25.sp, fontWeight = FontWeight.Black)
        Text(subtitle, color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun PartnerActionCard(
    title: String,
    body: String,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 22.dp, glow = accent.copy(alpha = 0.20f)) {
            Column(modifier = Modifier.padding(15.dp)) {
                Text(title, color = accent, fontSize = 14.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(8.dp))
                Text(body, color = StudyTextPrimary, fontSize = 15.sp, lineHeight = 21.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun StatusPill(text: String, accent: Color) {
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
fun StatBar(label: String, value: Int, accent: Color, width: Dp = 222.dp) {
    Column {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(label, color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.weight(1f))
            Text("$value", color = accent, fontSize = 13.sp, fontWeight = FontWeight.Black)
        }
        Spacer(modifier = Modifier.height(7.dp))
        StudyProgressBar(progress = value / 100f, color = accent, width = width)
    }
}

@Composable
fun MiniDot(accent: Color) {
    Box(
        modifier = Modifier
            .size(9.dp)
            .clip(CircleShape)
            .background(accent),
    )
}

@Composable
fun PartnerBackground() {
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
                        Color(0xCC0B1748),
                        Color(0xF0050928),
                    ),
                ),
            ),
    )
}
