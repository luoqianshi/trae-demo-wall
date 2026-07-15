package com.kiddo.launcher.social

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.aipartner.PartnerRepository
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
fun SocialHomeScreen(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    SocialHomeDemo(onBack = onBack, modifier = modifier)
}

@Composable
private fun SocialHomeDemo(
    onBack: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(modifier = modifier.fillMaxSize()) {
        Image(
            painter = painterResource(LauncherResources.socialHomeDemo),
            contentDescription = "云朵家园生活区演示",
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop,
        )
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0x22000000),
                            Color.Transparent,
                            Color(0x33000000),
                        ),
                    ),
                ),
        )
        Row(
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(start = 24.dp, top = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
        }
    }
}

@Composable
private fun HomeTopHud(
    state: SocialHomeState,
    partnerName: String,
    onBack: () -> Unit,
    onMailbox: () -> Unit,
) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(70.dp), radius = 24.dp, glow = StudyGlowPurple.copy(alpha = 0.18f)) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(state.homeName, color = StudyTextPrimary, fontSize = 24.sp, fontWeight = FontWeight.Black)
                Text("$partnerName 的家园正在开放", color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            TopIconButton("邀请", StudyGlowGreen) {}
            Spacer(modifier = Modifier.width(8.dp))
            TopIconButton("信箱", StudyGlowOrange, onMailbox)
            Spacer(modifier = Modifier.width(8.dp))
            TopIconButton("访问", StudyGlowBlue) {}
        }
    }
}

@Composable
private fun HomeSideHud(
    state: SocialHomeState,
    notice: String,
    onInvite: () -> Unit,
    onVisit: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.fillMaxHeight(), radius = 24.dp, glow = StudyGlowBlue.copy(alpha = 0.18f)) {
        Column(modifier = Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("我的家园", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
            MiniStat("等级", "第 ${state.homeLevel} 级", StudyGlowGreen)
            MiniStat("舒适", "${state.comfort}%", StudyGlowOrange)
            MiniStat("访客", "${state.todayVisitors} 位", StudyGlowPink)
            StudyMiniButton("邀请好友", StudyGlowGreen, onClick = onInvite)
            StudyMiniButton("访问家园", StudyGlowBlue, onClick = onVisit)
            Spacer(modifier = Modifier.weight(1f))
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 18.dp, glow = StudyGlowPink.copy(alpha = 0.14f)) {
                Text(
                    text = notice,
                    color = StudyTextSecondary,
                    fontSize = 10.sp,
                    lineHeight = 15.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(10.dp),
                )
            }
        }
    }
}

@Composable
private fun HomeScenePanel(
    state: SocialHomeState,
    placements: Map<String, String>,
    selectedFurnitureId: String,
    partnerImageRes: Int,
    partnerName: String,
    onMailbox: () -> Unit,
    onSlotClick: (HomeSlot) -> Unit,
) {
    StudyGlassPanel(modifier = Modifier.fillMaxSize(), radius = 26.dp, glow = StudyGlowOrange.copy(alpha = 0.24f)) {
        Box(modifier = Modifier.fillMaxSize().padding(12.dp), contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(26.dp))
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                Color(0xFFFFE59A).copy(alpha = 0.82f),
                                Color(0xFFFFB38B).copy(alpha = 0.62f),
                                Color(0xFF8C5B4A).copy(alpha = 0.78f),
                            ),
                        ),
                    )
                    .border(1.dp, Color.White.copy(alpha = 0.24f), RoundedCornerShape(26.dp)),
            ) {
                GameRoomBase()
                state.slots.forEach { slot ->
                    PlacementSlot(
                        slot = slot,
                        item = placements[slot.id]?.let { id -> state.furniture.firstOrNull { it.id == id } },
                        selected = placements[slot.id] == selectedFurnitureId,
                        onClick = { onSlotClick(slot) },
                    )
                }
                MailboxProp(
                    messages = state.messages.size,
                    onClick = onMailbox,
                    modifier = Modifier.align(Alignment.BottomEnd).offset(x = (-54).dp, y = (-106).dp),
                )
                Image(
                    painter = painterResource(partnerImageRes),
                    contentDescription = partnerName,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .offset(x = (-18).dp, y = (-52).dp)
                        .size(width = 132.dp, height = 132.dp),
                    contentScale = ContentScale.Fit,
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 12.dp)
                        .clip(RoundedCornerShape(99.dp))
                        .background(Color(0xAA4A2D63))
                        .border(1.dp, Color.White.copy(alpha = 0.24f), RoundedCornerShape(99.dp))
                        .padding(horizontal = 18.dp, vertical = 8.dp),
                ) {
                    Text("云朵家园", color = StudyTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

@Composable
private fun BoxScope.GameRoomBase() {
    Box(
        modifier = Modifier
            .align(Alignment.TopCenter)
            .fillMaxWidth()
            .fillMaxHeight(0.70f)
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFFFFF4A5).copy(alpha = 0.42f),
                        Color(0xFFFFB897).copy(alpha = 0.42f),
                        Color(0xFFBE7B5F).copy(alpha = 0.36f),
                    ),
                ),
            ),
    )
    repeat(5) { index ->
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .offset(x = (index * 176).dp, y = (-84).dp)
                .size(width = 150.dp, height = 18.dp)
                .clip(RoundedCornerShape(50))
                .background(Color(0xFFB27355).copy(alpha = 0.18f)),
        )
    }
    Box(
        modifier = Modifier
            .align(Alignment.BottomCenter)
            .fillMaxWidth()
            .height(130.dp)
            .background(Color(0xFF7D4A36).copy(alpha = 0.72f)),
    )
    repeat(7) { index ->
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .offset(x = (index * 132).dp, y = (-26).dp)
                .size(width = 112.dp, height = 4.dp)
                .background(Color(0xFF3C241C).copy(alpha = 0.22f)),
        )
    }
    DoorProp(modifier = Modifier.align(Alignment.BottomStart).offset(x = 38.dp, y = (-118).dp))
    ClockProp(modifier = Modifier.align(Alignment.TopStart).offset(x = 206.dp, y = 34.dp))
    WindowProp(modifier = Modifier.align(Alignment.TopCenter).offset(x = 100.dp, y = 48.dp))
    BoardProp(modifier = Modifier.align(Alignment.TopEnd).offset(x = (-58).dp, y = 58.dp))
    MushroomProp(modifier = Modifier.align(Alignment.Center).offset(x = 20.dp, y = 4.dp))
}

@Composable
private fun PlacementSlot(
    slot: HomeSlot,
    item: FurnitureItem?,
    selected: Boolean,
    onClick: () -> Unit,
) {
    val scaleX = 1.26f
    val scaleY = 1.10f
    val accent = item?.accent ?: StudyGlowBlue
    Box(
        modifier = Modifier
            .offset(x = (slot.x * scaleX).dp, y = (slot.y * scaleY + 14).dp)
            .size(width = (slot.width * scaleX).dp, height = (slot.height * scaleY).dp)
            .clip(RoundedCornerShape(18.dp))
            .background(if (item == null) Color.White.copy(alpha = 0.05f) else accent.copy(alpha = 0.17f))
            .border(
                width = if (selected) 2.dp else 1.dp,
                color = if (selected) StudyGlowOrange else Color.White.copy(alpha = 0.15f),
                shape = RoundedCornerShape(18.dp),
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        if (item == null) {
            Text(slot.name, color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
        } else {
            FurnitureBlock(item = item, large = slot.width > 130)
        }
    }
}

@Composable
private fun FurnitureBlock(item: FurnitureItem, large: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(
            modifier = Modifier
                .size(if (large) 52.dp else 42.dp)
                .clip(RoundedCornerShape(15.dp))
                .background(item.accent.copy(alpha = 0.28f))
                .border(1.dp, item.accent.copy(alpha = 0.46f), RoundedCornerShape(15.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(item.mark, color = StudyTextPrimary, fontSize = if (large) 22.sp else 17.sp, fontWeight = FontWeight.Black)
        }
        Text(item.name, color = StudyTextPrimary, fontSize = 10.sp, fontWeight = FontWeight.Black, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun FurnitureDock(
    furniture: List<FurnitureItem>,
    selectedFurnitureId: String,
    onSelect: (FurnitureItem) -> Unit,
) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(82.dp), radius = 24.dp, glow = StudyGlowOrange.copy(alpha = 0.18f)) {
        Row(modifier = Modifier.fillMaxSize().padding(horizontal = 14.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("家具", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black, modifier = Modifier.width(62.dp))
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                furniture.forEach { item ->
                    FurnitureChip(
                        item = item,
                        selected = item.id == selectedFurnitureId,
                        modifier = Modifier.weight(1f),
                        onClick = { onSelect(item) },
                    )
                }
            }
        }
    }
}

@Composable
private fun FurnitureChip(
    item: FurnitureItem,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(15.dp))
                    .background(item.accent.copy(alpha = if (selected) 0.36f else 0.14f))
                    .border(
                        width = if (selected) 2.dp else 1.dp,
                        color = if (selected) StudyGlowOrange else Color.White.copy(alpha = 0.18f),
                        shape = RoundedCornerShape(15.dp),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(item.mark, color = item.accent, fontSize = 16.sp, fontWeight = FontWeight.Black)
            }
            Text(item.name, color = StudyTextSecondary, fontSize = 9.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }
}

@Composable
private fun CompactCommunityHud(
    state: SocialHomeState,
    onMailbox: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.fillMaxHeight(), radius = 24.dp, glow = StudyGlowGreen.copy(alpha = 0.16f)) {
        Column(modifier = Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("好友", color = StudyTextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Black)
            state.friends.take(3).forEach { friend ->
                CompactFriend(friend)
            }
            StudyMiniButton("打开信箱 ${state.messages.size}", StudyGlowOrange, onClick = onMailbox)
            Text("访客记录", color = StudyGlowPink, fontSize = 14.sp, fontWeight = FontWeight.Black)
            Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                state.visitors.forEach { visitor ->
                    Text("${visitor.name} ${visitor.time}", color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                }
            }
        }
    }
}

@Composable
private fun CompactFriend(friend: FriendProfile) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 18.dp, glow = StudyGlowGreen.copy(alpha = 0.12f)) {
        Row(modifier = Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            AvatarDot(friend.name.take(1), StudyGlowGreen)
            Spacer(modifier = Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(friend.name, color = StudyTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Black, maxLines = 1)
                Text(friend.status, color = StudyGlowGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold, maxLines = 1)
            }
        }
    }
}

@Composable
private fun MailboxOverlay(
    messages: List<HomeMessage>,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.size(width = 292.dp, height = 400.dp), radius = 26.dp, glow = StudyGlowOrange.copy(alpha = 0.30f)) {
        Column(modifier = Modifier.fillMaxSize().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("信箱", color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                StudyMiniButton("收起", StudyGlowPurple, onClick = onClose)
            }
            Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                messages.forEach { message ->
                    MessageCard(message)
                }
            }
        }
    }
}

@Composable
private fun MessageCard(message: HomeMessage) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 18.dp, glow = StudyGlowOrange.copy(alpha = 0.14f)) {
        Column(modifier = Modifier.padding(11.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(message.author, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f))
                Text(message.time, color = StudyGlowOrange, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
            Text(message.body, color = StudyTextSecondary, fontSize = 11.sp, lineHeight = 16.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun MiniStat(title: String, value: String, accent: Color) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 18.dp, glow = accent.copy(alpha = 0.14f)) {
        Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Text(value, color = accent, fontSize = 18.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun TopIconButton(text: String, accent: Color, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(width = 64.dp, height = 42.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(accent.copy(alpha = 0.16f))
            .border(1.dp, accent.copy(alpha = 0.38f), RoundedCornerShape(18.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = accent, fontSize = 12.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun AvatarDot(text: String, accent: Color) {
    Box(
        modifier = Modifier
            .size(34.dp)
            .clip(CircleShape)
            .background(accent.copy(alpha = 0.22f))
            .border(1.dp, accent.copy(alpha = 0.44f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text(text, color = StudyTextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun DoorProp(modifier: Modifier = Modifier) {
    Box(modifier = modifier.size(width = 96.dp, height = 146.dp), contentAlignment = Alignment.BottomCenter) {
        Box(
            modifier = Modifier
                .size(width = 82.dp, height = 128.dp)
                .clip(RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp, bottomStart = 14.dp, bottomEnd = 14.dp))
                .background(Brush.verticalGradient(listOf(Color(0xFF8E4C34), Color(0xFF4B1F28))))
                .border(3.dp, Color(0xFFB67949), RoundedCornerShape(topStart = 48.dp, topEnd = 48.dp, bottomStart = 14.dp, bottomEnd = 14.dp)),
        )
        Box(modifier = Modifier.offset(x = 20.dp, y = (-48).dp).size(8.dp).clip(CircleShape).background(StudyGlowOrange))
    }
}

@Composable
private fun ClockProp(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(74.dp)
            .clip(CircleShape)
            .background(Color(0xFFE8B66D).copy(alpha = 0.78f))
            .border(3.dp, Color(0xFF83513A), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text("◷", color = Color(0xFF3D2A38), fontSize = 30.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun WindowProp(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(width = 96.dp, height = 104.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(Color(0xFF83D8FF).copy(alpha = 0.42f))
            .border(5.dp, Color(0xFF6B412F), RoundedCornerShape(18.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Text("景", color = StudyGlowGreen, fontSize = 26.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun BoardProp(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(width = 118.dp, height = 72.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(Color(0xFF234D3A).copy(alpha = 0.88f))
            .border(4.dp, Color(0xFF9E6A42), RoundedCornerShape(12.dp)),
        contentAlignment = Alignment.Center,
    ) {
        Text("好好学习\n天天向上", color = Color.White, fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
    }
}

@Composable
private fun MushroomProp(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(44.dp)
            .clip(CircleShape)
            .background(StudyGlowOrange.copy(alpha = 0.42f))
            .border(1.dp, StudyGlowOrange.copy(alpha = 0.52f), CircleShape),
        contentAlignment = Alignment.Center,
    ) {
        Text("菇", color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun MailboxProp(messages: Int, onClick: () -> Unit, modifier: Modifier = Modifier) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        Box(modifier = Modifier.size(width = 86.dp, height = 94.dp), contentAlignment = Alignment.BottomCenter) {
            Box(
                modifier = Modifier
                    .size(width = 72.dp, height = 58.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(StudyGlowOrange.copy(alpha = 0.80f))
                    .border(2.dp, Color(0xFF5C3A2F), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Text("信", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
            }
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(28.dp)
                    .clip(CircleShape)
                    .background(StudyGlowPink)
                    .border(1.dp, Color.White.copy(alpha = 0.50f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text("$messages", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Black)
            }
        }
    }
}

@Composable
private fun SocialBackground() {
    Image(
        painter = painterResource(LauncherResources.background),
        contentDescription = null,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Crop,
    )
    Image(
        painter = painterResource(LauncherResources.glowPink),
        contentDescription = null,
        modifier = Modifier.fillMaxSize().scale(1.2f).blur(18.dp),
        contentScale = ContentScale.FillBounds,
        colorFilter = ColorFilter.tint(StudyGlowOrange),
        alpha = 0.10f,
    )
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xEE05081E),
                        Color(0xCC17113C),
                        Color(0xF0060927),
                    ),
                ),
            ),
    )
}
