package com.kiddo.launcher.study.repository

import com.kiddo.launcher.ui.LauncherResources
import com.kiddo.launcher.study.model.AiCourseRecommendation
import com.kiddo.launcher.study.model.RecentStudyItem
import com.kiddo.launcher.study.model.StudyHomeUiState
import com.kiddo.launcher.study.model.StudyStage
import com.kiddo.launcher.study.model.StudyStat
import com.kiddo.launcher.study.model.StudySubject

class StudyRepository {
    fun loadStudyHome(): StudyHomeUiState {
        return StudyHomeUiState(
            stats = listOf(
                StudyStat("今日学习", "75分钟", "目标 120 分钟"),
                StudyStat("连续学习", "12天", "保持成长能量"),
                StudyStat("总积分", "3280", "本周 +240"),
            ),
            stages = listOf(
                StudyStage(
                    id = "primary",
                    title = "小学",
                    subtitle = "6-12岁",
                    learnerCount = "1280人在线",
                    completionRate = 75,
                    buttonText = "开始学习",
                    imageRes = LauncherResources.studyTower,
                ),
                StudyStage(
                    id = "middle",
                    title = "初中",
                    subtitle = "12-15岁",
                    learnerCount = "860人在线",
                    completionRate = 48,
                    buttonText = "进入计划",
                    imageRes = LauncherResources.gamePark,
                ),
                StudyStage(
                    id = "high",
                    title = "高中",
                    subtitle = "15-18岁",
                    learnerCount = "520人在线",
                    completionRate = 32,
                    buttonText = "建立目标",
                    imageRes = LauncherResources.socialAi,
                ),
            ),
            subjects = listOf(
                StudySubject("chinese", "语文", "语"),
                StudySubject("math", "数学", "数"),
                StudySubject("english", "英语", "英"),
                StudySubject("physics", "物理", "物"),
                StudySubject("chemistry", "化学", "化"),
                StudySubject("biology", "生物", "生"),
                StudySubject("history", "历史", "史"),
                StudySubject("geography", "地理", "地"),
                StudySubject("politics", "政治", "政"),
                StudySubject("it", "信息技术", "信"),
            ),
            recommendations = listOf(
                AiCourseRecommendation(
                    title = "今天继续数学",
                    description = "AI建议完成分数乘法强化训练，再进入应用题关卡。",
                    tag = "AI推荐",
                    progress = 0.68f,
                ),
                AiCourseRecommendation(
                    title = "继续上次课程",
                    description = "上次学习到《小数除法》第 3 节，剩余约 18 分钟。",
                    tag = "未完成",
                    progress = 0.42f,
                ),
            ),
            recentItems = listOf(
                RecentStudyItem("最近观看", "数学 · 分数乘法动画课", "视频", 0.72f),
                RecentStudyItem("最近练习", "英语 · 高频单词闯关", "练习", 0.56f),
                RecentStudyItem("最近错题", "科学 · 光的三原色", "错题", 0.38f),
            ),
        )
    }
}
