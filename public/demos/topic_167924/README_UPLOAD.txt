KIDDO奇都 - 比赛上传精简包说明

本压缩包保留内容：
1. Android 项目核心源码：app/src、Gradle 配置、Manifest、Compose 页面、资源文件。
2. 作品介绍 HTML：kiddo_competition_intro_standalone.html，已内嵌图片，文件小于 20MB。
3. 项目必要的构建配置：settings.gradle.kts、build.gradle.kts、gradle.properties、app/build.gradle.kts、gradle/libs.versions.toml。

为满足 20MB 上传限制，已排除内容：
1. app/build、.gradle、.idea、.kotlin 等本地缓存和编译产物。
2. Android 模拟器、SDK、命令行工具压缩包。
3. 历史截图、旧 RAR/ZIP、备用 HTML、过程素材。
4. 异常过大的 gradle-wrapper.jar。评审如需运行，可用 Android Studio 打开工程并重新同步 Gradle。

额外压缩说明：
上传包内部分较大的 Android PNG 资源已转换为同名 WebP 资源，资源名保持不变，Android 可继续通过相同的 R.drawable 名称引用。原始工程文件未被修改。

推荐查看：
competition/kiddo_competition_intro_light.html
