const http = require('http');
const mysql = require('mysql2/promise');

const BASE = 'http://127.0.0.1:18080/api';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const url = new URL(BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      }
    };
    const r = http.request(opts, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(chunks) });
        } catch {
          resolve({ status: res.statusCode, data: chunks });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

let passed = 0, failed = 0;
function assert(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${detail ? '- ' + detail : ''}`);
  }
}

async function main() {
  console.log('=== Phase 5 - 帧级创作工作台 API 测试 ===\n');

  const pool = mysql.createPool({
    host: 'localhost',
    port: 13306,
    user: 'root',
    password: 'root123',
    database: 'smart_video_analysis',
    waitForConnections: true,
    connectionLimit: 5
  });

  try {
    console.log('【0/8】健康检查');
    const health = await req('GET', '/health');
    assert('健康检查返回 200', health.status === 200);
    console.log();

    console.log('【1/8】用户注册登录');
    const ts = Date.now();
    const username = `frame_test_${ts}`;
    const reg = await req('POST', '/auth/register', { username, password: 'test123456', nickname: '帧级测试' });
    assert('注册成功', reg.status === 200 && reg.data.code === 200);

    const login = await req('POST', '/auth/login', { username, password: 'test123456' });
    assert('登录成功', login.status === 200 && login.data.code === 200);
    const token = login.data.data?.token || (typeof login.data.data === 'string' ? login.data.data : '');
    assert('获取 Token', !!token);
    console.log();

    console.log('【2/8】创建项目 + 注入已解析视频 + 关键帧');
    const projectRes = await req('POST', '/projects', { name: '帧级测试项目' }, token);
    assert('创建项目', projectRes.status === 200 && projectRes.data.code === 200);
    const project = projectRes.data.data;
    const projectId = project.id;
    const userId = project.userId;

    const conn = await pool.getConnection();
    const videoId = BigInt(Date.now()) + BigInt(200);
    const analysisId = BigInt(Date.now()) + BigInt(600);
    const frameIds = [];

    // 注入已解析视频（status=2 表示解析成功）
    await conn.query(
      `INSERT INTO t_video (id, project_id, user_id, filename, storage_path, bucket_name, file_size, duration, width, height, fps, format, status, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 2, 0)`,
      [videoId.toString(), projectId, userId, '测试视频.mp4', 'test/video.mp4', 'video-raw', 5242880, 120, 1920, 1080, 30.0, 'mp4']
    );

    // 注入解析结果
    await conn.query(
      `INSERT INTO t_video_analysis (id, video_id, transcript_json, summary, status, progress, is_deleted)
       VALUES (?, ?, ?, ?, 2, 100, 0)`,
      [analysisId.toString(), videoId.toString(), '[]', '测试视频摘要']
    );

    // 注入 6 个关键帧
    for (let i = 0; i < 6; i++) {
      const fid = BigInt(Date.now()) + BigInt(i * 1000 + 1000);
      frameIds.push(fid.toString());
      await conn.query(
        `INSERT INTO t_video_frame (id, video_id, analysis_id, frame_index, timestamp_ms, storage_path, bucket_name, scene_tags, prompt_text, is_key_frame, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
        [fid.toString(), videoId.toString(), analysisId.toString(), i, i * 20000, `frames/frame_${i}.jpg`, 'image-frames', `场景${i + 1},测试`, `第${i + 1}帧的提示词`]
      );
    }
    conn.release();
    assert('注入已解析视频', !!videoId);
    assert('注入 6 个关键帧', frameIds.length === 6);
    console.log();

    console.log('【3/8】ComfyUI 连接测试');
    const testRes = await req('POST', '/ai/comfyui/test', {}, token);
    assert('连接测试接口可访问', testRes.status === 200 && testRes.data.code === 200);
    const testResult = testRes.data.data;
    assert('返回连接状态字段', testResult && typeof testResult.connected === 'boolean');
    console.log(`  (info) ComfyUI 连接状态: ${testResult?.connected} - ${testResult?.message}`);
    console.log();

    console.log('【4/8】AI 服务配置管理');
    const saveCfg = await req('POST', '/ai/configs', {
      serviceType: 'COMFYUI',
      endpoint: 'http://localhost:8188',
      apiKey: 'test-key-123',
      enabled: 1,
      isDefault: 1
    }, token);
    assert('保存 ComfyUI 配置', saveCfg.status === 200 && saveCfg.data.code === 200);
    assert('返回配置 ID', !!saveCfg.data.data?.id);

    const getCfg = await req('GET', '/ai/configs/COMFYUI', null, token);
    assert('查询配置成功', getCfg.status === 200 && getCfg.data.code === 200);
    assert('配置 endpoint 正确', getCfg.data.data?.endpoint === 'http://localhost:8188');

    const listCfg = await req('GET', '/ai/configs', null, token);
    assert('配置列表非空', listCfg.status === 200 && Array.isArray(listCfg.data.data) && listCfg.data.data.length > 0);

    // 动态测试连接
    const testCustom = await req('POST', '/ai/comfyui/test-custom', { endpoint: 'http://localhost:8188', apiKey: 'test-key-123' }, token);
    assert('动态测试连接接口', testCustom.status === 200 && testCustom.data.code === 200);
    assert('返回 connected 字段', typeof testCustom.data.data?.connected === 'boolean');
    console.log();

    console.log('【5/8】帧提取接口');
    const extractRes = await req('POST', '/frame/extract', { videoId: videoId.toString() }, token);
    assert('帧提取成功', extractRes.status === 200 && extractRes.data.code === 200);
    const extractData = extractRes.data.data;
    assert('返回视频文件名', extractData?.videoFilename === '测试视频.mp4');
    assert('返回帧列表', Array.isArray(extractData?.frames) && extractData.frames.length === 6);
    assert('帧包含必要字段', extractData?.frames?.length > 0 && extractData.frames[0].frameId && extractData.frames[0].timestampMs !== undefined);
    assert('返回总数', extractData?.total === 6);
    console.log();

    console.log('【6/8】创建帧级创作任务（4 种模式）');
    const modes = [
      { mode: 'SINGLE_REDRAW', name: '单帧重绘', frameCount: 1 },
      { mode: 'START_END_FUSION', name: '首尾帧融合', frameCount: 2 },
      { mode: 'SEGMENT_REMAKE', name: '片段重制', frameCount: 1 },
      { mode: 'MULTI_SEGMENT_FUSION', name: '多片段融合', frameCount: 2 }
    ];
    const taskIds = [];

    for (const m of modes) {
      const sourceFrames = [];
      for (let i = 0; i < m.frameCount; i++) {
        sourceFrames.push({
          frameId: frameIds[i],
          frameIndex: i,
          timestampMs: i * 20000,
          storagePath: `frames/frame_${i}.jpg`
        });
      }
      const res = await req('POST', '/frame', {
        projectId,
        videoId: videoId.toString(),
        mode: m.mode,
        sourceFrames,
        params: {
          resolution: 512,
          steps: 20,
          cfg: 8,
          prompt: `测试 ${m.name} 提示词`,
          negativePrompt: 'low quality',
          seed: 42
        }
      }, token);
      assert(`创建 ${m.name} 任务`, res.status === 200 && res.data.code === 200);
      if (res.data.data?.id) taskIds.push(String(res.data.data.id));
    }
    assert('4 种模式任务全部创建', taskIds.length === 4);
    console.log();

    console.log('【7/8】轮询任务结果');
    let firstResult = null;
    for (let i = 0; i < 15; i++) {
      await wait(800);
      const res = await req('GET', `/frame/${taskIds[0]}/result`, null, token);
      if (res.status === 200 && res.data.code === 200) {
        firstResult = res.data.data;
        if (firstResult.status === 2 || firstResult.status === 3) {
          console.log(`  ✅ 轮询第 ${i + 1} 次 - 任务结束 (status=${firstResult.status})`);
          break;
        }
      }
    }
    assert('任务完成', firstResult && firstResult.status === 2);
    assert('返回 modeName', firstResult && !!firstResult.modeName);
    assert('返回 params', firstResult && !!firstResult.params);
    assert('返回 results 列表', firstResult && Array.isArray(firstResult.results) && firstResult.results.length > 0);
    if (firstResult?.results?.length > 0) {
      const r = firstResult.results[0];
      assert('结果包含 filename', !!r.filename);
      assert('结果包含 type', r.type === 'image' || r.type === 'video');
      assert('结果包含 storagePath', !!r.storagePath);
    }
    console.log();

    console.log('【8/8】任务列表 + 重新生成 + 未授权访问');
    const listRes = await req('GET', `/frame?projectId=${projectId}`, null, token);
    assert('获取任务列表', listRes.status === 200 && listRes.data.code === 200);
    assert('列表包含 4 个任务', Array.isArray(listRes.data.data) && listRes.data.data.length >= 4);

    const regenRes = await req('POST', `/frame/${taskIds[0]}/regenerate`, {}, token);
    assert('重新生成任务', regenRes.status === 200 && regenRes.data.code === 200);

    const noAuth = await req('GET', `/frame/${taskIds[0]}/result`, null, null);
    assert('未授权访问返回 401', noAuth.status === 401);

    const wrongUser = await req('POST', '/auth/register', { username: `frame_other_${ts}`, password: 'test123456', nickname: '其他用户' });
    const otherLogin = await req('POST', '/auth/login', { username: `frame_other_${ts}`, password: 'test123456' });
    const otherToken = otherLogin.data.data?.token || '';
    const crossAccess = await req('GET', `/frame/${taskIds[0]}/result`, null, otherToken);
    assert('跨用户访问返回 404', crossAccess.status === 200 && crossAccess.data.code === 404);
    console.log();

    console.log('=== 测试结果 ===');
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (e) {
    console.error('测试异常:', e);
    process.exit(1);
  }
}

main();
