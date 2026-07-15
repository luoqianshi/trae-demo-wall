package com.kiddo.launcher.rest

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

class TimerManager(
    private val scope: CoroutineScope,
) {
    private var job: Job? = null

    fun start(
        seconds: Int,
        onTick: (Int) -> Unit,
        onFinish: () -> Unit,
    ) {
        job?.cancel()
        job = scope.launch {
            var remaining = seconds
            onTick(remaining)
            while (isActive && remaining > 0) {
                delay(1_000)
                remaining -= 1
                onTick(remaining)
            }
            if (remaining <= 0) onFinish()
        }
    }

    fun stop() {
        job?.cancel()
        job = null
    }
}
