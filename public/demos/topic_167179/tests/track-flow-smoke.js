/**
 * 完整包装轨流程冒烟测试
 * 1. 启动 MVP 服务
 * 2. 上传测试视频、正式口播稿
 * 3. 调用 Whisper 识别
 * 4. 对齐并识别包装点
 * 5. 导出完整透明包装轨
 * 6. 验证输出 MOV 时长、分辨率、透明通道
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const server = require('../server/index.js');

const PORT = 18080;
const HOST = '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;

const TEST_MEDIA = '/Users/hutianwei/Documents/trae motion/transform/smoke-test/chinese-speech.mp4';
const FFPROBE = '/Users/hutianwei/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/vm/tools/opt/ffmpeg/8.1.2/bin/ffprobe';

const SCRIPT_TEXT = '大家好，这是一次快讯包装生成器的语音识别测试，今天将为大家带来一段新节目。';

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  await new Promise((resolve) => server.listen(PORT, HOST, resolve));
  console.log(`\n🚀 测试服务已启动: ${BASE}`);

  let sessionId = null;

  try {
    // 1. 上传媒体
    console.log('\n[1/5] 上传测试视频...');
    const mediaBlob = new Blob([fs.readFileSync(TEST_MEDIA)]);
    const mediaForm = new FormData();
    mediaForm.append('media', mediaBlob, 'chinese-speech.mp4');

    const mediaRes = await fetch(`${BASE}/api/track/upload-media`, {
      method: 'POST',
      body: mediaForm,
    });
    const mediaData = await mediaRes.json();
    if (mediaData.status !== 'ok') throw new Error(mediaData.error);
    sessionId = mediaData.sessionId;
    console.log(`  ✅ 视频时长: ${mediaData.duration.toFixed(2)}s`);

    // 2. 上传正式稿
    console.log('\n[2/5] 上传正式口播稿...');
    const scriptForm = new FormData();
    scriptForm.append('scriptText', SCRIPT_TEXT);
    const scriptRes = await fetch(`${BASE}/api/track/upload-script`, {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId },
      body: scriptForm,
    });
    const scriptData = await scriptRes.json();
    if (scriptData.status !== 'ok') throw new Error(scriptData.error);
    console.log(`  ✅ 文稿字数: ${scriptData.wordCount}`);

    // 3. Whisper 识别
    console.log('\n[3/5] Whisper 语音识别（tiny 模型）...');
    const transcribeRes = await fetch(`${BASE}/api/track/transcribe`, {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId },
    });
    const transcribeData = await transcribeRes.json();
    if (transcribeData.status !== 'ok') throw new Error(transcribeData.error);
    console.log(`  ✅ 识别到 ${transcribeData.segments.length} 个片段`);
    console.log(`     文本: ${transcribeData.segments[0].text.slice(0, 40)}...`);

    // 4. 对齐与识别
    console.log('\n[4/5] 对齐时间并识别包装点...');
    const alignRes = await fetch(`${BASE}/api/track/align`, {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId },
    });
    const alignData = await alignRes.json();
    if (alignData.status !== 'ok') throw new Error(alignData.error);
    const alignedCount = alignData.aligned.filter((s) => s.aligned).length;
    console.log(`  ✅ ${alignedCount}/${alignData.aligned.length} 句已对齐`);
    console.log(`  ✅ 识别到 ${alignData.packagingPoints.length} 个包装点`);
    alignData.packagingPoints.forEach((p) => {
      console.log(`     [${p.type}] ${p.text.slice(0, 24)}... @ ${p.time?.toFixed(2) ?? '未对齐'}s`);
    });

    // 5. 导出完整包装轨
    console.log('\n[5/5] 导出完整透明包装轨...');
    const renderRes = await fetch(`${BASE}/api/track/render`, {
      method: 'POST',
      headers: { 'X-Session-Id': sessionId },
    });
    const renderData = await renderRes.json();
    if (renderData.status !== 'ok') throw new Error(renderData.error);
    console.log(`  ✅ 导出成功: ${renderData.outputPath}`);

    // 6. 验证输出
    console.log('\n[verify] 验证输出 MOV...');
    const cmd = `"${FFPROBE}" -v error -select_streams v:0 -show_entries stream=width,height,duration,pix_fmt,codec_name -of json "${renderData.outputPath}"`;
    const probeOut = execSync(cmd, { encoding: 'utf8' });
    const probe = JSON.parse(probeOut);
    const stream = probe.streams[0];
    console.log(`  Resolution: ${stream.width}x${stream.height}`);
    console.log(`  Duration: ${parseFloat(stream.duration).toFixed(2)}s`);
    console.log(`  Pixel format: ${stream.pix_fmt}`);
    console.log(`  Codec: ${stream.codec_name}`);

    const hasAlpha = stream.pix_fmt && (stream.pix_fmt.includes('a') || stream.pix_fmt.includes('yuva'));
    const durationMatch = Math.abs(parseFloat(stream.duration) - mediaData.duration) < 0.5;
    if (!hasAlpha) throw new Error('输出 MOV 缺少透明通道');
    if (!durationMatch) throw new Error('输出时长与媒体时长不匹配');
    console.log('\n🎉 完整包装轨流程测试全部通过');
  } catch (err) {
    console.error('\n❌ 测试失败:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    console.log('\n👋 测试服务已关闭');
  }
}

main();
