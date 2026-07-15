package com.kiddo.launcher.aipartner

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun AIPartnerDetail(
    state: PartnerState,
    modifier: Modifier = Modifier,
) {
    StudyGlassPanel(modifier = modifier.fillMaxWidth(), radius = 24.dp, glow = StudyGlowBlue.copy(alpha = 0.18f)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("伙伴档案", color = StudyTextPrimary, fontSize = 18.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(10.dp))
            DetailLine("名字", state.partner.name, StudyGlowBlue)
            DetailLine("性格", state.partner.personality, StudyGlowPink)
            DetailLine("喜好", state.partner.favorite, StudyGlowOrange)
            DetailLine("阶段", state.lifeStage.label, StudyGlowGreen)
        }
    }
}

@Composable
private fun DetailLine(label: String, value: String, accent: androidx.compose.ui.graphics.Color) {
    Text(label, color = accent, fontSize = 11.sp, fontWeight = FontWeight.Black)
    Text(value, color = StudyTextSecondary, fontSize = 13.sp, lineHeight = 18.sp, fontWeight = FontWeight.Bold)
    Spacer(modifier = Modifier.height(8.dp))
}
