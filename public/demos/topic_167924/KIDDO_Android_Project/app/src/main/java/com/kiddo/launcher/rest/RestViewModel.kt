package com.kiddo.launcher.rest

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.kiddo.launcher.aipartner.CoinSystem
import com.kiddo.launcher.aipartner.PartnerRepository
import com.kiddo.launcher.aipartner.PartnerState
import com.kiddo.launcher.model.HomeUiState
import com.kiddo.launcher.wrongbook.WrongBookRepository
import com.kiddo.launcher.wrongbook.WrongQuestStatus
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

class RestViewModel : ViewModel() {
    private val timerManager = TimerManager(viewModelScope)
    private var harvestCount = 0

    private val _uiState = MutableStateFlow(seedState())
    val uiState: StateFlow<RestUiState> = _uiState.asStateFlow()

    init {
        startTimerIfUnlocked()
        observePartner()
        observeWrongBook()
    }

    fun openHome() {
        _uiState.update { it.copy(page = RestPage.Home, waitingMessage = null) }
    }

    fun openFarm() {
        if (_uiState.value.unlocked) {
            _uiState.update { it.copy(page = RestPage.Farm, waitingMessage = null) }
        }
    }

    fun openBattle() {
        if (_uiState.value.unlocked) {
            _uiState.update { it.copy(page = RestPage.Battle, waitingMessage = null) }
        }
    }

    fun selectTool(tool: FarmTool) {
        _uiState.update { it.copy(selectedTool = tool) }
    }

    fun selectPlant(plant: PlantType) {
        _uiState.update { it.copy(selectedPlant = plant, selectedTool = FarmTool.Plant) }
    }

    fun tapPlot(plotId: Int) {
        when (_uiState.value.selectedTool) {
            FarmTool.Plant -> plant(plotId)
            FarmTool.Water -> water(plotId)
            FarmTool.Fertilize -> fertilize(plotId)
            FarmTool.Harvest -> harvest(plotId)
        }
    }

    fun openBattleEntry(entry: BattleEntry) {
        _uiState.update {
            it.copy(waitingMessage = "${entry.title} 功能开发中")
        }
    }

    fun closeWaiting() {
        _uiState.update { it.copy(waitingMessage = null) }
    }

    private fun seedState(): RestUiState {
        val homeState = HomeUiState()
        val reasons = unlockReasons(homeState, WrongBookRepository.unresolvedCount())
        return RestUiState(
            unlocked = reasons.isNotEmpty(),
            unlockReasons = reasons,
            partner = PartnerRepository.state.value.toBattleSnapshot(),
            battleEntries = BattleRepository.trainingEntries(),
            restRecords = listOf("上午专注学习后开放一次", "种植小屋等待照料"),
        )
    }

    private fun startTimerIfUnlocked() {
        if (!_uiState.value.unlocked) return
        timerManager.start(
            seconds = _uiState.value.remainingSeconds,
            onTick = { remaining ->
                _uiState.update { current ->
                    current.copy(
                        remainingSeconds = remaining,
                        todayRestSeconds = (10 * 60 - remaining).coerceAtLeast(0),
                        plots = tickPlots(current.plots),
                    )
                }
            },
            onFinish = {
                _uiState.update { it.copy(remainingSeconds = 0, page = RestPage.Home) }
            },
        )
    }

    private fun observePartner() {
        viewModelScope.launch {
            PartnerRepository.state.collectLatest { partner ->
                _uiState.update { it.copy(partner = partner.toBattleSnapshot()) }
            }
        }
    }

    private fun observeWrongBook() {
        viewModelScope.launch {
            WrongBookRepository.items.collectLatest { items ->
                val reasons = unlockReasons(HomeUiState(), items.count { it.status != WrongQuestStatus.MASTERED })
                val wasLocked = !_uiState.value.unlocked
                _uiState.update { it.copy(unlocked = reasons.isNotEmpty(), unlockReasons = reasons) }
                if (wasLocked && reasons.isNotEmpty()) startTimerIfUnlocked()
            }
        }
    }

    private fun unlockReasons(homeState: HomeUiState, unresolvedWrongCount: Int): List<RestUnlockReason> = buildList {
        if (homeState.todayStudyMinutes >= 40) add(RestUnlockReason.StudyMinutes)
        if (homeState.todayTaskFinished >= homeState.todayTaskTotal) add(RestUnlockReason.StudyTask)
        if (unresolvedWrongCount == 0) add(RestUnlockReason.WrongBook)
    }

    private fun tickPlots(plots: List<FarmPlot>): List<FarmPlot> = plots.map { plot ->
        if (plot.plant != null && !plot.mature) {
            plot.copy(remainingSeconds = (plot.remainingSeconds - 1).coerceAtLeast(0))
        } else {
            plot
        }
    }

    private fun plant(plotId: Int) {
        _uiState.update { current ->
            current.copy(
                plots = current.plots.map { plot ->
                    if (plot.id == plotId && plot.empty) {
                        FarmPlot(
                            id = plot.id,
                            plant = current.selectedPlant,
                            remainingSeconds = current.selectedPlant.growSeconds,
                        )
                    } else {
                        plot
                    }
                },
                latestReward = null,
            )
        }
    }

    private fun water(plotId: Int) {
        _uiState.update { current ->
            current.copy(
                plots = current.plots.map { plot ->
                    if (plot.id == plotId && plot.plant != null && !plot.mature) {
                        plot.copy(
                            remainingSeconds = (plot.remainingSeconds - 20).coerceAtLeast(0),
                            watered = true,
                        )
                    } else {
                        plot
                    }
                },
            )
        }
    }

    private fun fertilize(plotId: Int) {
        _uiState.update { current ->
            current.copy(
                plots = current.plots.map { plot ->
                    if (plot.id == plotId && plot.plant != null && !plot.mature) {
                        plot.copy(
                            remainingSeconds = (plot.remainingSeconds - 35).coerceAtLeast(0),
                            fertilized = true,
                        )
                    } else {
                        plot
                    }
                },
            )
        }
    }

    private fun harvest(plotId: Int) {
        val plot = _uiState.value.plots.firstOrNull { it.id == plotId } ?: return
        val plant = plot.plant ?: return
        if (!plot.mature) return

        harvestCount += 1
        val bonusItemId = if (harvestCount % 3 == 0) "energy-fruit" else null
        val bonusName = if (bonusItemId == null) null else "AI伙伴食物"
        val reward = CoinReward(
            coins = plant.coinReward + CoinSystem.REST_FARM_BASE_REWARD,
            exp = plant.expReward,
            bonusName = bonusName,
        )
        PartnerRepository.recordRestReward(
            coins = reward.coins,
            exp = reward.exp,
            bonusItemId = bonusItemId,
            diaryTitle = "收获${plant.label}",
        )

        _uiState.update { current ->
            current.copy(
                todayCoins = current.todayCoins + reward.coins,
                latestReward = reward,
                restRecords = (listOf("种植小屋收获${plant.label}，金币 +${reward.coins}") + current.restRecords).take(4),
                plots = current.plots.map { item ->
                    if (item.id == plotId) FarmPlot(item.id) else item
                },
            )
        }
    }

    private fun PartnerState.toBattleSnapshot(): PartnerBattleSnapshot = PartnerBattleSnapshot(
        name = partner.name,
        level = level,
        hp = stats.vitality,
        intimacy = stats.intimacy,
        skills = listOf("专注光环", "鼓励护盾", "知识闪光"),
        imageRes = partner.imageRes,
    )

    override fun onCleared() {
        timerManager.stop()
        super.onCleared()
    }
}
