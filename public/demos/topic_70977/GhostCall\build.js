#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const SERVER_ENTRY = path.join(DIST, 'server-entry.js');
const BUNDLED_JS = path.join(DIST, 'bundle.js');
const SEA_CONFIG = path.join(DIST, 'sea-config.json');
const SEA_BLOB = path.join(DIST, 'sea-prep.blob');
const SEA_EXE = path.join(ROOT, 'ghostcall.exe');

// ─── Step 1: 创建 dist 目录 ───
if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

// ─── Step 2: 创建打包入口 — 将 index.html 和证书内嵌为字符串 ───
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
const serverSrc = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf-8');

// 替换 fs.readFileSync(...) 调用为内嵌字符串
const entryJs = serverSrc.replace(
  /fs\.readFileSync\(path\.join\(__dirname,\s*'index\.html'\),\s*'utf-8'\)/,
  `require('EMBEDDED_HTML')`
);

// 写入入口和 HTML 模块
fs.writeFileSync(path.join(DIST, 'embedded-html.js'), `module.exports = ${JSON.stringify(indexHtml)};\n`);

// 内嵌证书（SEA 模式下 certs/ 目录可能不存在）
const keyPath = path.join(ROOT, 'certs', 'key.pem');
const certPath = path.join(ROOT, 'certs', 'cert.pem');
// 首次打包时，如证书不存在则自动生成（调用 openssl）
if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('[build] 证书不存在，尝试自动生成...');
  try {
    fs.mkdirSync(path.join(ROOT, 'certs'), { recursive: true });
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`,
      { cwd: ROOT, stdio: 'pipe', shell: true, timeout: 15000 }
    );
    console.log('[build] 证书已生成');
  } catch (e) {
    console.log('[build] 证书生成失败（可能未安装 openssl），跳过内嵌');
  }
}
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const key = fs.readFileSync(keyPath, 'utf-8');
  const cert = fs.readFileSync(certPath, 'utf-8');
  fs.writeFileSync(path.join(DIST, 'embedded-certs.js'), `module.exports = { key: ${JSON.stringify(key)}, cert: ${JSON.stringify(cert)} };\n`);
  console.log('[build] 证书已内嵌');
}

fs.writeFileSync(SERVER_ENTRY, entryJs);

// ─── Step 3: 安装 esbuild（如果还没有）──
console.log('[build] 检查 esbuild...');
try {
  require('esbuild');
} catch {
  console.log('[build] 安装 esbuild...');
  execSync('npm install esbuild --save-dev', { cwd: ROOT, stdio: 'pipe', shell: true, timeout: 60000 });
}

// ─── Step 4: 用 esbuild 打包 ───
console.log('[build] esbuild 打包中...');
try {
  // 使用 esbuild API 进行更精确的控制
  const esbuild = require('esbuild');
  const alias = { 'EMBEDDED_HTML': path.join(DIST, 'embedded-html.js') };
  if (fs.existsSync(path.join(DIST, 'embedded-certs.js'))) {
    alias['EMBEDDED_CERTS'] = path.join(DIST, 'embedded-certs.js');
  }
  esbuild.buildSync({
    entryPoints: [SERVER_ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLED_JS,
    sourcemap: false,
    minify: false,
    alias,
    external: [],
    define: {},
    logLevel: 'info',
  });
  console.log('[build] esbuild 打包完成');
} catch (e) {
  console.error('[build] esbuild 失败:', e.message?.slice(0, 500));
  process.exit(1);
}

// ─── Step 5: 验证打包产物 ───
const bundleSize = fs.statSync(BUNDLED_JS).size;
console.log(`[build] bundle.js: ${(bundleSize / 1024).toFixed(0)} KB`);

// ─── Step 6: Node.js SEA 打包 ───
const nodeExe = process.execPath;
const nodeVersion = process.versions.node.split('.').map(Number);
console.log(`[build] Node.js: ${nodeExe} (v${process.versions.node})`);

if (nodeVersion[0] < 20) {
  console.log('[build] SEA 需要 Node.js 20+，跳过 SEA 打包');
  console.log(`[build] 完成！运行: node "${BUNDLED_JS}"`);
  process.exit(0);
}

// 生成 sea-config.json（使用相对路径，支持目录移动）
const seaConfig = {
  main: path.relative(ROOT, BUNDLED_JS).replace(/\\/g, '/'),
  output: path.relative(ROOT, SEA_BLOB).replace(/\\/g, '/'),
  disableExperimentalSEAWarning: true,
  useCodeCache: true,
};
const seaConfigPath = path.join(ROOT, 'sea-config.json');
fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));

// 生成 SEA blob
console.log('[build] 生成 SEA blob...');
try {
  execSync(
    `"${nodeExe}" --experimental-sea-config "${seaConfigPath}"`,
    { cwd: ROOT, stdio: 'pipe', shell: true, timeout: 30000 }
  );
  console.log('[build] SEA blob 已生成');

  // 复制 node.exe
  console.log('[build] 创建单文件 EXE...');
  fs.copyFileSync(nodeExe, SEA_EXE);

  // 使用 postject 注入 blob
  try {
    execSync(
      `npx postject "${SEA_EXE}" NODE_SEA_BLOB "${SEA_BLOB}" --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
      { stdio: 'pipe', shell: true, timeout: 30000 }
    );
    const sizeMB = (fs.statSync(SEA_EXE).size / 1024 / 1024).toFixed(1);
    console.log(`[build] 单文件 EXE: ${SEA_EXE} (${sizeMB} MB)`);
  } catch (e) {
    console.log('[build] postject 失败，尝试手动注入...');
    // 回退：使用 npx postject 已经失败，跳过
    console.log(`[build] SEA blob 已生成但注入失败。可手动使用 postject 注入。`);
    console.log(`[build] 仍可运行: node "${BUNDLED_JS}"`);
  }
} catch (e) {
  console.error('[build] SEA 失败:', e.stderr?.toString().slice(0, 300));
  console.log(`[build] 跳过 SEA 打包。仍可运行: node "${BUNDLED_JS}"`);
}

// 清理临时文件
try {
  fs.unlinkSync(SERVER_ENTRY);
  fs.unlinkSync(path.join(DIST, 'embedded-html.js'));
  fs.unlinkSync(path.join(DIST, 'embedded-certs.js'));
  fs.unlinkSync(path.join(ROOT, 'sea-config.json'));
  if (fs.existsSync(SEA_BLOB)) fs.unlinkSync(SEA_BLOB);
} catch {}

console.log('\n[build] 完成！');
console.log(`  开发运行: node server.js`);
console.log(`  打包运行: node "${BUNDLED_JS}"`);
if (fs.existsSync(SEA_EXE)) {
  console.log(`  单文件:   "${SEA_EXE}"`);
}
