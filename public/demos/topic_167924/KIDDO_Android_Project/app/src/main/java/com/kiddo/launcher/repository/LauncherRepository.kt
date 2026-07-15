package com.kiddo.launcher.repository

import com.kiddo.launcher.model.HomeUiState
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

class LauncherRepository {
    private val homeState = MutableStateFlow(HomeUiState())

    fun observeHomeState(): Flow<HomeUiState> = homeState.asStateFlow()
}
