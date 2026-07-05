<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
/* 重置所有元素的基本样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 确保html和body没有默认边距 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 确保根元素占满整个视口 */
#app {
  width: 100%;
  min-height: 100vh;
}
</style>