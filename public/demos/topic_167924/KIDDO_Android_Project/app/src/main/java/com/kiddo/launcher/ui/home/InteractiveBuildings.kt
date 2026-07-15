package com.kiddo.launcher.ui.home

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size

@Composable
fun InteractiveBuildings(
    scale: Float,
    onStudyClick: () -> Unit,
    onGameClick: () -> Unit,
    onSocialClick: () -> Unit,
    onRestClick: () -> Unit,
) {
    LauncherSceneNodes.home.forEach { node ->
        KBuildingPortal(
            title = node.title,
            subtitle = node.subtitle,
            progressLabel = node.progressLabel,
            progress = node.progress,
            buildingRes = node.imageRes,
            accent = node.accent,
            locked = node.locked,
            labelOffsetY = node.labelOffsetY,
            modifier = Modifier
                .offsetNode(node, scale),
            onClick = when (node.id) {
                LauncherSceneNodeId.Study -> onStudyClick
                LauncherSceneNodeId.Game -> onGameClick
                LauncherSceneNodeId.Social -> onSocialClick
                LauncherSceneNodeId.Relax -> onRestClick
            },
        )
    }
}

private fun Modifier.offsetNode(
    node: LauncherSceneNode,
    scale: Float,
): Modifier = this
    .offset(x = node.x.ds(scale), y = node.y.ds(scale))
    .size(width = node.width.ds(scale), height = node.height.ds(scale))
