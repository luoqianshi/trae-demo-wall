package com.kiddo.launcher.aipartner

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyMiniButton
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun PartnerShopScreen(
    state: PartnerState,
    onBuy: (String) -> Unit,
    onUse: (String) -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(13.dp)) {
        PartnerSectionTitle("伙伴商城", "金币用于食物、药品、玩具和成长道具")
        StatusPill("当前金币 ${state.coin}", StudyGlowOrange)
        ShopCategory("背包", state.inventory.map { "${it.item.name} x${it.count}" }.ifEmpty { listOf("背包暂时是空的") }, StudyGlowGreen)
        state.inventory.firstOrNull()?.let { entry ->
            StudyMiniButton("使用 ${entry.item.name}", StudyGlowGreen, onClick = { onUse(entry.item.id) })
        }
        state.shopItems.forEach { item ->
            ShopItemCard(item = item, onBuy = { onBuy(item.id) })
        }
    }
}

@Composable
private fun ShopCategory(title: String, lines: List<String>, accent: androidx.compose.ui.graphics.Color) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 20.dp, glow = accent.copy(alpha = 0.16f)) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(title, color = accent, fontSize = 13.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(6.dp))
            lines.forEach { line ->
                Text(line, color = StudyTextSecondary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun ShopItemCard(item: PartnerItem, onBuy: () -> Unit) {
    val accent = when (item.category) {
        PartnerItemCategory.Food -> StudyGlowGreen
        PartnerItemCategory.Medicine -> StudyGlowBlue
        PartnerItemCategory.Toy -> StudyGlowPink
        PartnerItemCategory.Growth -> StudyGlowPurple
    }
    StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 20.dp, glow = accent.copy(alpha = 0.18f)) {
        Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(modifier = Modifier.weight(1f)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(item.name, color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
                    Text(item.category.label, color = accent, fontSize = 11.sp, fontWeight = FontWeight.Black)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Text(item.description, color = StudyTextSecondary, fontSize = 12.sp, lineHeight = 17.sp, fontWeight = FontWeight.Bold)
            }
            Column {
                Text("${item.price} 金币", color = StudyGlowOrange, fontSize = 13.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(8.dp))
                StudyMiniButton("购买", accent, onClick = onBuy)
            }
        }
    }
}
