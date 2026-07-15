package com.kiddo.launcher.navigation

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.kiddo.launcher.aipartner.AIPartnerHome
import com.kiddo.launcher.course.screen.CourseScreen
import com.kiddo.launcher.course.viewmodel.CourseViewModel
import com.kiddo.launcher.game.GameCenterScreen
import com.kiddo.launcher.question.viewmodel.QuestionViewModel
import com.kiddo.launcher.rest.RestHome
import com.kiddo.launcher.rest.RestViewModel
import com.kiddo.launcher.social.SocialHomeScreen
import com.kiddo.launcher.study.screen.StudyHomeScreen
import com.kiddo.launcher.study.viewmodel.StudyHomeViewModel
import com.kiddo.launcher.video.screen.QuestionScreen
import com.kiddo.launcher.video.screen.VideoPlayerScreen
import com.kiddo.launcher.video.viewmodel.VideoPlayerViewModel
import com.kiddo.launcher.ui.screen.AIScreen
import com.kiddo.launcher.ui.home.HomeScreen
import com.kiddo.launcher.ui.screen.SettingsScreen
import com.kiddo.launcher.ui.screen.StudyScreen
import com.kiddo.launcher.viewmodel.HomeViewModel
import com.kiddo.launcher.wrongbook.WrongBookDetail
import com.kiddo.launcher.wrongbook.WrongBookHome
import com.kiddo.launcher.wrongbook.WrongBookViewModel

@Composable
fun KiddoNavHost(
    modifier: Modifier = Modifier,
) {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = KiddoRoute.Home.route,
        modifier = modifier,
    ) {
        composable(KiddoRoute.Home.route) {
            val viewModel: HomeViewModel = viewModel()
            HomeScreen(
                viewModel = viewModel,
                onStudyClick = {
                    navController.navigate(KiddoRoute.StudyHome.route)
                },
                onGameClick = {
                    navController.navigate(KiddoRoute.Game.route)
                },
                onSocialClick = {
                    navController.navigate(KiddoRoute.Social.route)
                },
                onRestClick = {
                    navController.navigate(KiddoRoute.Rest.route)
                },
                onEggClick = {
                    navController.navigate(KiddoRoute.AIPartner.route)
                },
                onSettingsClick = {
                    println("TODO: open Settings")
                },
                onTaskClick = { navController.navigate(KiddoRoute.WrongBookHome.route) },
                onBagClick = { println("TODO: open Bag") },
                onAchievementClick = { println("TODO: open Achievement") },
            )
        }
        composable(KiddoRoute.Study.route) {
            val viewModel: StudyHomeViewModel = viewModel()
            StudyHomeScreen(
                viewModel = viewModel,
                onOpenCourse = {
                    navController.navigate(KiddoRoute.Course.route)
                },
                onOpenWrongBook = {
                    navController.navigate(KiddoRoute.WrongBookHome.route)
                },
                onBack = {
                    navController.popBackStack(KiddoRoute.Home.route, inclusive = false)
                },
            )
        }
        composable(KiddoRoute.StudyHome.route) {
            val viewModel: StudyHomeViewModel = viewModel()
            StudyHomeScreen(
                viewModel = viewModel,
                onOpenCourse = {
                    navController.navigate(KiddoRoute.Course.route)
                },
                onOpenWrongBook = {
                    navController.navigate(KiddoRoute.WrongBookHome.route)
                },
                onBack = {
                    navController.popBackStack(KiddoRoute.Home.route, inclusive = false)
                },
            )
        }
        composable(KiddoRoute.Course.route) {
            val viewModel: CourseViewModel = viewModel()
            CourseScreen(
                viewModel = viewModel,
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.StudyHome.route)
                    }
                },
                onOpenVideo = {
                    navController.navigate(KiddoRoute.VideoPlayer.route)
                },
            )
        }
        composable(KiddoRoute.VideoPlayer.route) {
            val viewModel: VideoPlayerViewModel = viewModel()
            VideoPlayerScreen(
                viewModel = viewModel,
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.Course.route)
                    }
                },
                onOpenQuestion = {
                    navController.navigate(KiddoRoute.Question.route)
                },
            )
        }
        composable(KiddoRoute.Question.route) {
            val viewModel: QuestionViewModel = viewModel()
            QuestionScreen(
                viewModel = viewModel,
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.VideoPlayer.route)
                    }
                },
            )
        }
        composable(KiddoRoute.WrongBookHome.route) {
            val viewModel: WrongBookViewModel = viewModel()
            WrongBookHome(
                viewModel = viewModel,
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.Home.route)
                    }
                },
                onOpenQuest = { questId ->
                    navController.navigate(KiddoRoute.WrongBookDetail.createRoute(questId))
                },
            )
        }
        composable(
            route = KiddoRoute.WrongBookDetail.route,
            arguments = listOf(navArgument("questId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val viewModel: WrongBookViewModel = viewModel()
            WrongBookDetail(
                viewModel = viewModel,
                questId = backStackEntry.arguments?.getString("questId"),
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.WrongBookHome.route)
                    }
                },
            )
        }
        composable(KiddoRoute.Game.route) {
            GameCenterScreen(
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.Home.route)
                    }
                },
                onOpenWrongBook = {
                    navController.navigate(KiddoRoute.WrongBookHome.route)
                },
            )
        }
        composable(KiddoRoute.AIPartner.route) {
            AIPartnerHome(
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.Home.route)
                    }
                },
            )
        }
        composable(KiddoRoute.AI.route) { AIScreen() }
        composable(KiddoRoute.Rest.route) {
            val viewModel: RestViewModel = viewModel()
            RestHome(
                viewModel = viewModel,
                onExitToLauncher = {
                    navController.popBackStack(KiddoRoute.Home.route, inclusive = false)
                },
            )
        }
        composable(KiddoRoute.Social.route) {
            SocialHomeScreen(
                onBack = {
                    if (!navController.popBackStack()) {
                        navController.navigate(KiddoRoute.Home.route)
                    }
                },
            )
        }
        composable(KiddoRoute.Settings.route) { SettingsScreen() }
    }
}
