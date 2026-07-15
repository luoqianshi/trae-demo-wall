package com.kiddo.launcher.ui.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import com.kiddo.launcher.ui.LauncherResources

@Composable
fun CityBackground(
    modifier: Modifier = Modifier,
) {
    Image(
        painter = painterResource(LauncherResources.background),
        contentDescription = null,
        modifier = modifier.fillMaxSize(),
        contentScale = ContentScale.Crop,
    )
}
