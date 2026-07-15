package com.kiddo.launcher.study.navigation

sealed class StudyRoute(val route: String) {
    data object StudyHome : StudyRoute("study_home")
}
