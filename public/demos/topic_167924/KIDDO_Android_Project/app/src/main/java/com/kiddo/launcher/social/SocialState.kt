package com.kiddo.launcher.social

import androidx.compose.ui.graphics.Color
import com.kiddo.launcher.study.component.StudyGlowBlue
import com.kiddo.launcher.study.component.StudyGlowGreen
import com.kiddo.launcher.study.component.StudyGlowOrange
import com.kiddo.launcher.study.component.StudyGlowPink
import com.kiddo.launcher.study.component.StudyGlowPurple

enum class SocialTab(val label: String) {
    Friends("好友"),
    Messages("留言"),
    Visitors("访客"),
}

data class FurnitureItem(
    val id: String,
    val name: String,
    val category: String,
    val mark: String,
    val comfort: Int,
    val accent: Color,
)

data class HomeSlot(
    val id: String,
    val name: String,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
)

data class FriendProfile(
    val name: String,
    val status: String,
    val lastVisit: String,
    val closeness: Int,
)

data class HomeMessage(
    val author: String,
    val body: String,
    val time: String,
)

data class VisitorRecord(
    val name: String,
    val action: String,
    val time: String,
)

data class SocialHomeState(
    val homeName: String,
    val homeLevel: Int,
    val comfort: Int,
    val todayVisitors: Int,
    val furniture: List<FurnitureItem>,
    val slots: List<HomeSlot>,
    val friends: List<FriendProfile>,
    val messages: List<HomeMessage>,
    val visitors: List<VisitorRecord>,
)

object SocialRepository {
    fun loadHome(): SocialHomeState = SocialHomeState(
        homeName = "小奇同学的云朵家园",
        homeLevel = 6,
        comfort = 86,
        todayVisitors = 3,
        furniture = listOf(
            FurnitureItem("sofa", "云朵沙发", "家具", "沙", 12, StudyGlowBlue),
            FurnitureItem("table", "圆圆茶几", "家具", "桌", 8, StudyGlowOrange),
            FurnitureItem("bookshelf", "故事书架", "家具", "书", 10, StudyGlowGreen),
            FurnitureItem("lamp", "星光台灯", "装饰", "灯", 7, StudyGlowPink),
            FurnitureItem("plant", "成长绿植", "装饰", "植", 9, StudyGlowGreen),
            FurnitureItem("carpet", "软软地毯", "装饰", "毯", 6, StudyGlowPurple),
            FurnitureItem("toybox", "积木玩具箱", "玩具", "玩", 11, StudyGlowOrange),
            FurnitureItem("music", "小小音乐盒", "玩具", "音", 8, StudyGlowPink),
        ),
        slots = listOf(
            HomeSlot("window-left", "窗边", 74, 92, 118, 70),
            HomeSlot("wall-right", "电视柜旁", 414, 108, 120, 78),
            HomeSlot("sofa-zone", "会客区", 120, 238, 170, 86),
            HomeSlot("table-zone", "茶几位", 294, 280, 112, 70),
            HomeSlot("rug-zone", "地毯位", 210, 382, 190, 68),
            HomeSlot("toy-zone", "玩具角", 474, 328, 116, 86),
        ),
        friends = listOf(
            FriendProfile("晴晴同学", "家园在线", "10:30 来访", 92),
            FriendProfile("星星同学", "正在学习", "昨天留言", 88),
            FriendProfile("阳阳同学", "可邀请", "两天前来访", 76),
            FriendProfile("糖糖同学", "建造中", "今天点赞", 81),
        ),
        messages = listOf(
            HomeMessage("晴晴同学", "你的云朵沙发好舒服，下次一起玩积木。", "10:32"),
            HomeMessage("星星同学", "我给你的绿植浇水啦，今天也要加油。", "昨天"),
            HomeMessage("AI伙伴", "家园越整洁，朋友来访时越开心。", "今天"),
        ),
        visitors = listOf(
            VisitorRecord("晴晴同学", "访问家园并点赞", "10:30"),
            VisitorRecord("糖糖同学", "查看家具摆放", "09:48"),
            VisitorRecord("星星同学", "留下鼓励留言", "昨天"),
        ),
    )
}
