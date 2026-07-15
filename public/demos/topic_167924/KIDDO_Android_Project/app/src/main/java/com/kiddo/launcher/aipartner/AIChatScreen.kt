package com.kiddo.launcher.aipartner

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
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
import com.kiddo.launcher.study.component.StudyPressable
import com.kiddo.launcher.study.component.StudyTextPrimary
import com.kiddo.launcher.study.component.StudyTextSecondary

@Composable
fun AIChatScreen(
    state: PartnerState,
    onBack: () -> Unit,
    onChat: () -> Unit,
    onAsk: () -> Unit,
    onRecordMood: (String) -> Unit,
) {
    var draft by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            StudyMiniButton("返回主页", StudyGlowPurple, onClick = onBack)
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("AI 对话", color = StudyTextPrimary, fontSize = 28.sp, fontWeight = FontWeight.Black)
                Text("聊天、学习问答和心情陪伴都在同一个对话框里", color = StudyGlowBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            StatusPill("儿童陪伴模式", StudyGlowGreen)
        }

        StudyGlassPanel(modifier = Modifier.fillMaxWidth().weight(1f), radius = 30.dp, glow = StudyGlowBlue.copy(alpha = 0.22f)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(22.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                ChatBubble(
                    speaker = state.partner.name,
                    text = if (state.activeMessage.isBlank()) {
                        "我已经孵化成功啦！以后学习、开心、不开心、题目不会，都可以在这里和我说。"
                    } else {
                        state.activeMessage
                    },
                    accent = StudyGlowBlue,
                    alignEnd = false,
                )
                ChatBubble(
                    speaker = "我",
                    text = "我想和你聊一聊今天的学习，也想让你陪我一下。",
                    accent = StudyGlowPurple,
                    alignEnd = true,
                )
                ChatBubble(
                    speaker = state.partner.name,
                    text = "可以。你可以直接输入，也可以点语音按钮说出来。我会先听你说，再陪你拆成小目标。",
                    accent = StudyGlowGreen,
                    alignEnd = false,
                )
            }
        }

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            DialogActionButton("日常聊天", "说说今天的小目标", StudyGlowPurple, Modifier.weight(1f), onChat)
            DialogActionButton("学习问答", "不会的题慢慢拆", StudyGlowBlue, Modifier.weight(1f), onAsk)
            DialogActionButton("心情陪伴", "开心难过都能说", StudyGlowPink, Modifier.weight(1f)) { onRecordMood("需要陪伴") }
        }

        ChatInputBar(
            value = draft,
            onValueChange = { draft = it },
            onVoice = { onRecordMood("语音陪伴") },
            onSend = {
                draft = ""
                onChat()
            },
        )
    }
}

@Composable
private fun ChatInputBar(
    value: String,
    onValueChange: (String) -> Unit,
    onVoice: () -> Unit,
    onSend: () -> Unit,
) {
    StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(82.dp), radius = 30.dp, glow = StudyGlowPurple.copy(alpha = 0.22f)) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 18.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(54.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(Color.White.copy(alpha = 0.10f))
                    .border(1.dp, Color.White.copy(alpha = 0.22f), RoundedCornerShape(22.dp))
                    .padding(horizontal = 18.dp),
                contentAlignment = Alignment.CenterStart,
            ) {
                if (value.isBlank()) {
                    Text("问问伙伴，或者说说今天发生了什么", color = StudyTextSecondary, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    singleLine = true,
                    textStyle = TextStyle(color = StudyTextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold),
                    modifier = Modifier.fillMaxWidth(),
                )
            }
            RoundIconButton(label = "🎙", accent = StudyGlowBlue, onClick = onVoice)
            RoundIconButton(label = "➤", accent = StudyGlowGreen, onClick = onSend)
        }
    }
}

@Composable
private fun RoundIconButton(
    label: String,
    accent: Color,
    onClick: () -> Unit,
) {
    StudyPressable(onClick = onClick) {
        Box(
            modifier = Modifier
                .size(54.dp)
                .clip(CircleShape)
                .background(accent.copy(alpha = 0.24f))
                .border(1.dp, accent.copy(alpha = 0.46f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(label, color = StudyTextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun ChatBubble(
    speaker: String,
    text: String,
    accent: Color,
    alignEnd: Boolean,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (alignEnd) Arrangement.End else Arrangement.Start,
    ) {
        Column(
            modifier = Modifier.widthIn(max = 680.dp),
            horizontalAlignment = if (alignEnd) Alignment.End else Alignment.Start,
        ) {
            Text(speaker, color = accent, fontSize = 12.sp, fontWeight = FontWeight.Black)
            Spacer(modifier = Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .clip(
                        RoundedCornerShape(
                            topStart = 24.dp,
                            topEnd = 24.dp,
                            bottomStart = if (alignEnd) 24.dp else 8.dp,
                            bottomEnd = if (alignEnd) 8.dp else 24.dp,
                        ),
                    )
                    .background(accent.copy(alpha = if (alignEnd) 0.24f else 0.16f))
                    .border(1.dp, accent.copy(alpha = 0.34f), RoundedCornerShape(24.dp))
                    .padding(horizontal = 20.dp, vertical = 15.dp),
            ) {
                Text(
                    text = text,
                    color = StudyTextPrimary,
                    fontSize = 18.sp,
                    lineHeight = 27.sp,
                    fontWeight = FontWeight.Bold,
                    textAlign = if (alignEnd) TextAlign.End else TextAlign.Start,
                )
            }
        }
    }
}

@Composable
private fun DialogActionButton(
    title: String,
    body: String,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    StudyPressable(modifier = modifier, onClick = onClick) {
        StudyGlassPanel(modifier = Modifier.fillMaxWidth().height(74.dp), radius = 24.dp, glow = accent.copy(alpha = 0.20f)) {
            Column(
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.Center,
            ) {
                Text(title, color = accent, fontSize = 16.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(3.dp))
                Text(body, color = StudyTextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
