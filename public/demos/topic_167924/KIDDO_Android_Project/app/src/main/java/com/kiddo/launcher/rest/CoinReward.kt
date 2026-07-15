package com.kiddo.launcher.rest

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPurple
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun CoinRewardPanel(
    reward: CoinReward?,
    todayCoins: Int,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.fillMaxWidth(), radius = 22.dp, glow = StudyGlowOrange.copy(alpha = 0.20f)) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("今日获得金币", color = StudyTextPrimary, fontSize = 15.sp, fontWeight = FontWeight.Black)
                Text("+$todayCoins", color = StudyGlowOrange, fontSize = 20.sp, fontWeight = FontWeight.Black)
            }
            if (reward == null) {
                Text("照顾植物后，金币会进入AI伙伴商城。", color = StudyTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            } else {
                Text("刚刚收获：金币 +${reward.coins}，伙伴经验 +${reward.exp}", color = StudyGlowGreen, fontSize = 12.sp, fontWeight = FontWeight.Black)
                reward.bonusName?.let {
                    Text("额外获得：$it", color = StudyGlowPurple, fontSize = 12.sp, fontWeight = FontWeight.Black)
                }
            }
        }
    }
}
