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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kiddo.launcher.study.component.StudyGlassPanel
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun GrowthDiaryScreen(state: PartnerState) {
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        PartnerSectionTitle("成长日记", "自动记录学习、错题、互动和伙伴成长")
        state.diary.forEachIndexed { index, entry ->
            StudyGlassPanel(modifier = Modifier.fillMaxWidth(), radius = 20.dp, glow = if (index == 0) StudyGlowGreen.copy(alpha = 0.20f) else StudyGlowBlue.copy(alpha = 0.14f)) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        StatusPill(entry.tag, if (entry.tag == "错题") StudyGlowOrange else StudyGlowGreen)
                        Spacer(modifier = Modifier.weight(1f))
                        Text("成长记录 ${state.diary.size - index}", color = StudyTextSecondary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(entry.title, color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Black)
                    Text(entry.body, color = StudyTextSecondary, fontSize = 13.sp, lineHeight = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
