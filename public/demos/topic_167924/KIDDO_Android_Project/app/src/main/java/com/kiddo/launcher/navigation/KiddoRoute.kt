package com.kiddo.launcher.navigation

sealed class KiddoRoute(val route: String) {
    data object Home : KiddoRoute("home")
    data object Study : KiddoRoute("study")
    data object StudyHome : KiddoRoute("study_home")
    data object Course : KiddoRoute("course")
    data object VideoPlayer : KiddoRoute("video_player")
    data object Question : KiddoRoute("question")
    data object WrongBookHome : KiddoRoute("wrongbook")
    data object WrongBookDetail : KiddoRoute("wrongbook/{questId}") {
        fun createRoute(questId: String): String = "wrongbook/$questId"
    }
    data object AIPartner : KiddoRoute("ai_partner")
    data object Game : KiddoRoute("game")
    data object AI : KiddoRoute("ai")
    data object Rest : KiddoRoute("rest")
    data object Social : KiddoRoute("social")
    data object Settings : KiddoRoute("settings")
}
