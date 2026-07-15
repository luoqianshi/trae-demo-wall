const { execSync } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const plugins = [
  'cordova-plugin-camera',
  'cordova-plugin-media-capture',
  'cordova-plugin-geolocation',
  'cordova-plugin-vibration',
  'cordova-plugin-statusbar',
  'cordova-plugin-device',
  'cordova-plugin-dialogs',
  'cordova-plugin-network-information',
  'cordova-plugin-tts',
  'cordova-plugin-speechrecognition',
  'cordova-plugin-ble-central',
  'cordova-plugin-background-mode',
  'cordova-plugin-file',
  'cordova-plugin-file-transfer',
  'cordova-plugin-sms',
  'call-number'
];

console.log('=== 安装Cordova插件 ===\n');
console.log(`项目目录: ${PROJECT_ROOT}\n`);

let successCount = 0;
let failCount = 0;

for (const plugin of plugins) {
  try {
    console.log(`安装中: ${plugin}...`);
    execSync(`cordova plugin add ${plugin}`, {
      cwd: PROJECT_ROOT,
      stdio: 'pipe'
    });
    console.log(`  ✓ ${plugin} 安装成功`);
    successCount++;
  } catch (e) {
    console.log(`  ✗ ${plugin} 安装失败: ${e.message.split('\n')[0]}`);
    failCount++;
  }
}

console.log(`\n=== 安装完成 ===`);
console.log(`成功: ${successCount}, 失败: ${failCount}`);
console.log(`总计: ${plugins.length} 个插件`);
