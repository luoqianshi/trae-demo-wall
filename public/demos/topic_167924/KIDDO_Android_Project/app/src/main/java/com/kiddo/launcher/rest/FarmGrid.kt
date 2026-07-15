package com.kiddo.launcher.rest

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

@Composable
fun FarmGrid(
    plots: List<FarmPlot>,
    selectedTool: FarmTool,
    onPlotClick: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        plots.chunked(3).forEach { rowPlots ->
            Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                rowPlots.forEach { plot ->
                    PlantCard(
                        plot = plot,
                        selectedTool = selectedTool,
                        onClick = { onPlotClick(plot.id) },
                        modifier = Modifier.weight(1f),
                    )
                }
            }
        }
    }
}
