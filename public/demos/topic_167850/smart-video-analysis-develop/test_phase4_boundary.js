const http = require('http');
const mysql = require('mysql2/promise');

const BASE = 'http://127.0.0.1:18080/api';

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1',
      port: 18080,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      }
    };
    const r = http.request(opts, (res) => {
      let c = '';
      res.on('data', (d) => c += d);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(c) });
        } catch {
          resolve({ status: res.statusCode, data: c });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
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
  console.log('=== Phase 4 - 边界情况测试 ===\n');

  const pool = mysql.createPool({
    host: 'localhost',
    port: 13306,
    user: 'root',
    password: 'root123',
    database: 'smart_video_analysis',
    waitForConnections: true,
    connectionLimit: 5
  });

  const ts = Date.now();
  const username = `boundary_${ts}`;
  let token, projectId, userId;

  try {
    console.log('【准备】注册用户和项目');
    await req('POST', '/auth/register', { username, password: 'test123456' });
    const login = await req('POST', '/auth/login', { username, password: 'test123456' });
    token = login.data.data.token;

    const proj = await req('POST', '/projects', { name: '边界测试项目' }, token);
    projectId = proj.data.data.id;
    userId = proj.data.data.userId;
    console.log('  ✅ 准备完成\n');

    console.log('【1/6】视频数量不足');
    const r1 = await req('POST', '/fusion', {
      projectId,
      videoIds: [],
      fusionMode: 'SCRIPT_COMPLEMENT'
    }, token);
    assert('空视频列表返回 400', (r1.status === 200 && r1.data.code === 400) || r1.status === 400, `实际: status=${r1.status}`);

    const r1b = await req('POST', '/fusion', {
      projectId,
      videoIds: ['1'],
      fusionMode: 'SCRIPT_COMPLEMENT'
    }, token);
    assert('1个视频返回 400', (r1b.status === 200 && r1b.data.code === 400) || r1b.status === 400, `实际: status=${r1b.status}`);
    console.log();

    console.log('【2/6】视频数量超过上限');
    const r2 = await req('POST', '/fusion', {
      projectId,
      videoIds: ['1', '2', '3', '4', '5'],
      fusionMode: 'SCRIPT_COMPLEMENT'
    }, token);
    assert('5个视频返回 400', (r2.status === 200 && r2.data.code === 400) || r2.status === 400, `实际: status=${r2.status}`);
    console.log();

    console.log('【3/6】未解析视频');
    const conn = await pool.getConnection();
    const unparsedVid = (BigInt(ts) + 100n).toString();
    await conn.query(
      `INSERT INTO t_video (id,project_id,user_id,filename,storage_path,bucket_name,file_size,duration,status,is_deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [unparsedVid, projectId, userId, 'unparsed.mp4', 'p/u.mp4', 'video-raw', 1000, 60, 1, 0]
    );
    const parsedVid1 = (BigInt(ts) + 200n).toString();
    const parsedAid1 = (BigInt(ts) + 300n).toString();
    await conn.query(
      `INSERT INTO t_video (id,project_id,user_id,filename,storage_path,bucket_name,file_size,duration,status,is_deleted)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [parsedVid1, projectId, userId, 'parsed.mp4', 'p/p.mp4', 'video-raw', 1000, 60, 3, 0]
    );
    await conn.query(
      `INSERT INTO t_video_analysis (id,video_id,transcript_json,summary,status,progress,is_deleted)
       VALUES (?,?,?,?,?,?,?)`,
      [parsedAid1, parsedVid1, '[]', 'summary', 2, 100, 0]
    );
    conn.release();

    const r3 = await req('POST', '/fusion', {
      projectId,
      videoIds: [unparsedVid, parsedVid1],
      fusionMode: 'SCRIPT_COMPLEMENT'
    }, token);
    assert('混合未解析视频返回 400', (r3.status === 200 && r3.data.code === 400) || r3.status === 400, `实际: status=${r3.status}`);
    console.log();

    console.log('【4/6】不存在的视频ID');
    const r4 = await req('POST', '/fusion', {
      projectId,
      videoIds: ['9999999999999', parsedVid1],
      fusionMode: 'SCRIPT_COMPLEMENT'
    }, token);
    assert('不存在的视频返回 400', (r4.status === 200 && r4.data.code === 400) || r4.status === 400, `实际: status=${r4.status}`);
    console.log();

    console.log('【5/6】无效的融合模式');
    const r5 = await req('POST', '/fusion', {
      projectId,
      videoIds: [parsedVid1, parsedVid1],
      fusionMode: 'INVALID_MODE'
    }, token);
    assert('无效模式仍然生成结果', r5.status === 200 && r5.data.code === 200, '模式校验（当前不校验，默认走默认分支）');
    console.log();

    console.log('【6/6】访问他人任务');
    const successTask = await req('POST', '/fusion', {
      projectId,
      videoIds: [parsedVid1, parsedVid1],
      fusionMode: 'SCRIPT_COMPLEMENT'
    }, token);
    const taskId = successTask.data.data.id;

    const user2 = await req('POST', '/auth/register', { username: username + '_2', password: 'test123456' });
    const login2 = await req('POST', '/auth/login', { username: username + '_2', password: 'test123456' });
    const token2 = login2.data.data.token;

    const r6 = await req('GET', `/fusion/${taskId}/result`, null, token2);
    assert('访问他人任务返回 404', (r6.status === 200 && r6.data.code === 404) || r6.status === 404, `实际: status=${r6.status}`);
    console.log();

    console.log('【清理】');
    await pool.query('DELETE FROM t_fusion_task WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM t_video_analysis WHERE video_id IN (SELECT id FROM t_video WHERE user_id = ?)', [userId]);
    await pool.query('DELETE FROM t_video WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM t_project WHERE user_id = ?', [userId]);
    await pool.query('DELETE FROM t_user WHERE username LIKE ?', [username + '%']);
    console.log('  ✅ 测试数据已清理');

  } catch (e) {
    console.log('  ❌ 测试异常:', e.message);
    console.log(e.stack);
    failed++;
  } finally {
    await pool.end();
  }

  console.log(`\n=== 边界测试结果: ${passed} 通过, ${failed} 失败 ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
