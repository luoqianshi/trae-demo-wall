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
    const req = http.request(opts, (res) => {
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
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
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
  console.log('=== Phase 4 - 多视频融合创作 API 测试 ===\n');

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
    console.log('【0/6】健康检查');
    const health = await req('GET', '/health');
    assert('健康检查返回 200', health.status === 200);
    console.log();

    console.log('【1/6】用户注册登录');
    const ts = Date.now();
    const username = `fusion_test_${ts}`;
    const reg = await req('POST', '/auth/register', { username, password: 'test123456', nickname: '融合测试' });
    assert('注册成功', reg.status === 200 && reg.data.code === 200);

    const login = await req('POST', '/auth/login', { username, password: 'test123456' });
    assert('登录成功', login.status === 200 && login.data.code === 200);
    const token = login.data.data?.token || (typeof login.data.data === 'string' ? login.data.data : '');
    assert('获取 Token', !!token);
    console.log();

    console.log('【2/6】创建项目 + 注入已解析视频');
    const projectRes = await req('POST', '/projects', { name: '融合测试项目' }, token);
    assert('创建项目', projectRes.status === 200 && projectRes.data.code === 200);
    const project = projectRes.data.data;
    const projectId = project.id;
    const userId = project.userId;

    const conn = await pool.getConnection();
    const videoIds = [];
    const analysisIds = [];
    const videoNames = ['产品宣传片.mp4', '技术讲解视频.mp4', '客户案例.mp4'];

    for (let i = 0; i < 3; i++) {
      const vid = BigInt(Date.now()) + BigInt(i * 1000 + 100);
      const aid = BigInt(Date.now()) + BigInt(i * 1000 + 500);
      videoIds.push(vid.toString());
      analysisIds.push(aid.toString());

      await conn.query(
        `INSERT INTO t_video (id, project_id, user_id, filename, storage_path, bucket_name, file_size, duration, width, height, fps, format, status, is_deleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 3, 0)`,
        [vid.toString(), projectId, userId, videoNames[i], `test/video_${i}.mp4`, 'video-raw', 1024 * 1024 * (i + 1), 60 + i * 30, 1920, 1080, 30.0, 'mp4']
      );

      const transcript = JSON.stringify([
        { startTime: 0, endTime: 15, text: `这是${videoNames[i]}的第一段转写内容` },
        { startTime: 15, endTime: 30, text: '第二段转写，包含核心信息' },
        { startTime: 30, endTime: 45, text: '第三段，深入讲解细节' },
        { startTime: 45, endTime: 60, text: '总结与展望' }
      ]);

      await conn.query(
        `INSERT INTO t_video_analysis (id, video_id, transcript_json, summary, status, progress, is_deleted)
         VALUES (?, ?, ?, ?, 2, 100, 0)`,
        [aid.toString(), vid.toString(), transcript, `${videoNames[i]}的内容摘要，涵盖产品介绍、技术原理和应用场景。`]
      );
    }
    conn.release();

    assert('注入 3 个已解析视频', videoIds.length === 3);
    console.log();

    console.log('【3/6】创建融合任务');
    const fusionRes = await req('POST', '/fusion', {
      projectId,
      videoIds: videoIds.slice(0, 2),
      fusionMode: 'SCRIPT_COMPLEMENT'
    }, token);
    assert('创建融合任务', fusionRes.status === 200 && fusionRes.data.code === 200);
    const fusionTask = fusionRes.data.data;
    const fusionId = fusionTask.id;
    assert('返回任务 ID', !!fusionId);
    console.log();

    console.log('【4/6】轮询融合结果');
    let fusionResult = null;
    for (let i = 0; i < 10; i++) {
      await wait(800);
      const res = await req('GET', `/fusion/${fusionId}/result`, null, token);
      if (res.status === 200 && res.data.code === 200) {
        fusionResult = res.data.data;
        if (fusionResult.status === 2) {
          console.log(`  ✅ 轮询第 ${i + 1} 次 - 生成完成`);
          break;
        }
      }
    }
    assert('融合任务成功', fusionResult && fusionResult.status === 2);
    assert('有脚本大纲', fusionResult && !!fusionResult.scriptOutline && fusionResult.scriptOutline.length > 50);
    assert('有镜头建议', fusionResult && Array.isArray(fusionResult.shotSuggestions) && fusionResult.shotSuggestions.length > 0);
    assert('标注来源视频', fusionResult && Array.isArray(fusionResult.sourceVideos) && fusionResult.sourceVideos.length >= 2);
    if (fusionResult?.shotSuggestions?.length > 0) {
      const shot = fusionResult.shotSuggestions[0];
      assert('镜头包含必要字段', shot.shotType && shot.description && shot.sourceVideoName && shot.tags);
    }
    console.log();

    console.log('【5/6】三种融合模式');
    const modes = ['SCRIPT_COMPLEMENT', 'SHOT_STYLE', 'CONTENT_RESTRUCTURE'];
    const modeResults = [];
    for (const mode of modes) {
      const res = await req('POST', '/fusion', {
        projectId,
        videoIds: videoIds,
        fusionMode: mode
      }, token);
      assert(`${mode} 创建成功`, res.status === 200 && res.data.code === 200);

      for (let i = 0; i < 10; i++) {
        await wait(500);
        const r = await req('GET', `/fusion/${res.data.data.id}/result`, null, token);
        if (r.status === 200 && r.data.code === 200 && (r.data.data.status === 2 || r.data.data.status === 3)) {
          modeResults.push(r.data.data);
          break;
        }
      }
    }
    assert('三种模式都生成成功', modeResults.length === 3 && modeResults.every(r => r.status === 2));
    const outlines = modeResults.map(r => r.scriptOutline?.substring(0, 30));
    assert('三种模式输出内容不同', new Set(outlines).size === 3);
    console.log();

    console.log('【6/6】其他接口');
    const listRes = await req('GET', `/fusion?projectId=${projectId}`, null, token);
    assert('任务列表查询', listRes.status === 200 && listRes.data.code === 200);
    assert('列表包含融合任务', Array.isArray(listRes.data.data) && listRes.data.data.length >= 3);

    const regenRes = await req('POST', `/fusion/${fusionId}/regenerate`, null, token);
    assert('重新生成', regenRes.status === 200 && regenRes.data.code === 200);

    const noAuthRes = await req('GET', `/fusion/${fusionId}/result`);
    assert('未授权返回 401', noAuthRes.status === 401);
    console.log();

    console.log('【清理】');
    await pool.query('DELETE FROM t_fusion_task WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM t_video_frame WHERE video_id IN (SELECT id FROM t_video WHERE user_id = ?)', [userId]);
    await pool.query('DELETE FROM t_video_analysis WHERE video_id IN (SELECT id FROM t_video WHERE user_id = ?)', [userId]);
    await pool.query('DELETE FROM t_video WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM t_project WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM t_user WHERE username = ?', [username]);
    console.log('  ✅ 测试数据已清理');

  } catch (e) {
    console.log('  ❌ 测试异常:', e.message);
    failed++;
  } finally {
    await pool.end();
  }

  console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
