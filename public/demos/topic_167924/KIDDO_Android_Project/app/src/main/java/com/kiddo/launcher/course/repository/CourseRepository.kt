package com.kiddo.launcher.course.repository

import com.kiddo.launcher.course.model.CourseChapter
import com.kiddo.launcher.course.model.CourseUiState
import com.kiddo.launcher.course.model.KiddoCourse
import com.kiddo.launcher.ui.LauncherResources

class CourseRepository {
    fun loadCourses(): CourseUiState {
        val chapters = listOf(
            CourseChapter("fraction", "第一章 分数乘法", "理解分数与整数、分数相乘"),
            CourseChapter("decimal", "第二章 小数除法", "掌握估算、竖式与应用题"),
            CourseChapter("geometry", "第三章 图形空间", "面积、体积和空间想象训练", expanded = false),
            CourseChapter("application", "第四章 应用题挑战", "把知识用于真实场景", expanded = false),
        )
        val courses = listOf(
            KiddoCourse(
                id = "fraction-01",
                chapterId = "fraction",
                title = "分数乘法动画课",
                subtitle = "用披萨切片理解分数相乘",
                difficulty = "基础",
                studyTimeMinutes = 18,
                completionRate = 72,
                rewardPoints = 120,
                introduction = "通过 2.5D 动画和互动例题，让孩子理解分数乘法的意义，再进入短练习巩固。",
                aiRecommendation = "AI 建议先完成这节课，当前掌握度较高，适合用 18 分钟补齐最后几个易错点。",
                coverRes = LauncherResources.studyTower,
            ),
            KiddoCourse(
                id = "fraction-02",
                chapterId = "fraction",
                title = "分数乘法闯关练习",
                subtitle = "10 道递进题，自动生成讲解",
                difficulty = "进阶",
                studyTimeMinutes = 22,
                completionRate = 46,
                rewardPoints = 180,
                introduction = "题目会根据答题速度和错因动态调整，帮助孩子从计算熟练度进入应用理解。",
                aiRecommendation = "最近错在通分和约分，建议开启 AI 陪练模式，每 3 题复盘一次。",
                coverRes = LauncherResources.aiEgg,
            ),
            KiddoCourse(
                id = "decimal-01",
                chapterId = "decimal",
                title = "小数除法第 3 节",
                subtitle = "从估算到竖式的完整路径",
                difficulty = "基础",
                studyTimeMinutes = 16,
                completionRate = 42,
                rewardPoints = 100,
                introduction = "延续上次学习进度，先用估算判断答案范围，再一步步拆解竖式。",
                aiRecommendation = "这是未完成课程，建议今天继续学习，完成后可解锁应用题星球。",
                coverRes = LauncherResources.gamePark,
            ),
            KiddoCourse(
                id = "decimal-02",
                chapterId = "decimal",
                title = "小数除法生活应用",
                subtitle = "购物、速度和平均数场景",
                difficulty = "挑战",
                studyTimeMinutes = 28,
                completionRate = 15,
                rewardPoints = 240,
                introduction = "把小数除法放进真实生活问题，让孩子在场景中理解算式含义。",
                aiRecommendation = "建议在完成基础课后进入，本节会重点检查单位换算和结果解释。",
                coverRes = LauncherResources.socialAi,
            ),
            KiddoCourse(
                id = "geometry-01",
                chapterId = "geometry",
                title = "长方体体积实验室",
                subtitle = "拖拽积木理解体积公式",
                difficulty = "进阶",
                studyTimeMinutes = 20,
                completionRate = 0,
                rewardPoints = 160,
                introduction = "通过可视化积木堆叠，理解长、宽、高和体积之间的关系。",
                aiRecommendation = "空间想象力训练适合安排在数学主课后，建议作为今日加分课程。",
                coverRes = LauncherResources.restArea,
            ),
        )
        return CourseUiState(
            chapters = chapters,
            courses = courses,
            selectedCourseId = courses.first().id,
        )
    }
}
