package com.kiddo.launcher.model

import androidx.annotation.DrawableRes
import com.kiddo.launcher.R

data class HomeUiState(
    val userName: String = "小奇同学",
    val avatarLevel: Int = 12,
    val studyProgress: Float = 0.75f,
    val gameUnlocked: Float = 0.40f,
    val aiEggProgress: Float = 0.60f,
    val todayStudyMinutes: Int = 120,
    val targetStudyMinutes: Int = 180,
    val todayTaskFinished: Int = 3,
    val todayTaskTotal: Int = 5,
    val buildings: List<LauncherBuilding> = LauncherBuilding.defaults(),
)

data class LauncherBuilding(
    val id: LauncherBuildingId,
    val title: String,
    val subtitle: String,
    @DrawableRes val imageRes: Int,
) {
    companion object {
        fun defaults(): List<LauncherBuilding> = listOf(
            LauncherBuilding(
                id = LauncherBuildingId.Study,
                title = "学习区",
                subtitle = "STUDY",
                imageRes = R.drawable.kiddo_25d_study_tower,
            ),
            LauncherBuilding(
                id = LauncherBuildingId.Game,
                title = "游戏区",
                subtitle = "GAME",
                imageRes = R.drawable.kiddo_25d_game_zone,
            ),
            LauncherBuilding(
                id = LauncherBuildingId.SocialAI,
                title = "生活区",
                subtitle = "云朵家园",
                imageRes = R.drawable.kiddo_25d_social_zone,
            ),
            LauncherBuilding(
                id = LauncherBuildingId.Rest,
                title = "休息区",
                subtitle = "RELAX",
                imageRes = R.drawable.kiddo_25d_relax_zone,
            ),
        )
    }
}

enum class LauncherBuildingId {
    Study,
    Game,
    SocialAI,
    Rest,
}
