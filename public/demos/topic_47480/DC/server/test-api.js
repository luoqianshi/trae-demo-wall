const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';
const APP_KEY = 'test_app_key_001';
const APP_SECRET = 'test_secret_key_abcdef123456';

function generateSignature(method, path, timestamp, nonce, body) {
    const bodyStr = body ? JSON.stringify(body) : '';
    const bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex').toLowerCase();

    const stringToSign = [
        method.toUpperCase(),
        path.split('?')[0],
        timestamp,
        nonce,
        bodyHash
    ].join('\n');

    const signature = crypto
        .createHmac('sha256', APP_SECRET)
        .update(stringToSign)
        .digest('hex')
        .toLowerCase();

    return signature;
}

function generateNonce() {
    return crypto.randomBytes(16).toString('hex');
}

function getHeaders(method, path, body) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = generateNonce();
    const signature = generateSignature(method, path, timestamp, nonce, body);

    return {
        'Content-Type': 'application/json',
        'X-App-Key': APP_KEY,
        'X-Timestamp': timestamp,
        'X-Nonce': nonce,
        'X-Signature': signature,
        'X-Device-Id': 'test_device_001'
    };
}

async function testHealth() {
    console.log('\n=== 测试 1: 健康检查 ===');
    try {
        const res = await axios.get(`${BASE_URL}/health`);
        console.log('✅ 健康检查成功:', res.data);
    } catch (e) {
        console.log('❌ 健康检查失败:', e.message);
    }
}

async function testStats() {
    console.log('\n=== 测试 2: 系统状态 ===');
    try {
        const res = await axios.get(`${BASE_URL}/stats`);
        console.log('✅ 系统状态获取成功:');
        console.log('  - 总上报数:', res.data.data.total_reports);
        console.log('  - 降级级别:', res.data.data.degrade.current_level);
        console.log('  - WAF拦截数:', res.data.data.waf.blocked_count);
    } catch (e) {
        console.log('❌ 系统状态获取失败:', e.message);
    }
}

async function testLocationReport() {
    console.log('\n=== 测试 3: 紧急位置上报 ===');
    const path = '/v1/emergency/location/report';
    const body = {
        call_session_id: 'test_session_' + Date.now(),
        emergency_type: 'police',
        caller_number: '138****8888',
        caller_number_hash: crypto.createHash('sha256').update('13800138000').digest('hex'),
        callee_number: '110',
        device_id: 'test_device_001',
        device_type: 'android',
        os_version: 'Android 14',
        sdk_version: '2.1.0',
        location: {
            latitude: 39.9087,
            longitude: 116.3975,
            accuracy: 25.5,
            provider: 'fused',
            timestamp: Math.floor(Date.now() / 1000)
        },
        altitude: 45.2,
        bearing: 135.5,
        speed: 0.0,
        network_type: '5g',
        carrier: 'cmcc',
        battery_level: 65
    };

    try {
        const headers = getHeaders('POST', path, body);
        const res = await axios.post(BASE_URL + path, body, { headers });
        console.log('✅ 位置上报成功:');
        console.log('  - 上报ID:', res.data.data.report_id);
        console.log('  - 调度状态:', res.data.data.dispatch_status);
        console.log('  - 预计送达:', res.data.data.estimated_arrival_seconds + '秒');
        return body.call_session_id;
    } catch (e) {
        console.log('❌ 位置上报失败:', e.response ? e.response.data : e.message);
        return null;
    }
}

async function testLocationQuery(sessionId) {
    console.log('\n=== 测试 4: 位置查询 ===');
    const path = `/v1/emergency/location/query?call_session_id=${sessionId}`;

    try {
        const headers = getHeaders('GET', path, null);
        const res = await axios.get(BASE_URL + path, { headers });
        console.log('✅ 位置查询成功:');
        console.log('  - 紧急类型:', res.data.data.emergency_type);
        console.log('  - 状态:', res.data.data.status);
        console.log('  - 地址:', res.data.data.address);
        console.log('  - 坐标:', res.data.data.location.latitude + ', ' + res.data.data.location.longitude);
    } catch (e) {
        console.log('❌ 位置查询失败:', e.response ? e.response.data : e.message);
    }
}

async function testCallStatusSync(sessionId) {
    console.log('\n=== 测试 5: 通话状态同步 ===');
    const path = '/v1/emergency/call/status';
    const body = {
        call_session_id: sessionId,
        caller_number: '13800138000',
        callee_number: '110',
        status: 'connected',
        event_time: Math.floor(Date.now() / 1000),
        operator: 'cmcc',
        call_center_id: 'bj_110_center_01',
        agent_id: 'agent_007'
    };

    try {
        const headers = getHeaders('POST', path, body);
        const res = await axios.post(BASE_URL + path, body, { headers });
        console.log('✅ 通话状态同步成功:', res.data.data);
    } catch (e) {
        console.log('❌ 通话状态同步失败:', e.response ? e.response.data : e.message);
    }
}

async function testSignatureInvalid() {
    console.log('\n=== 测试 6: 签名验证（错误签名应被拒绝） ===');
    const path = '/v1/emergency/location/query?call_session_id=test';

    try {
        const res = await axios.get(BASE_URL + path, {
            headers: {
                'X-App-Key': APP_KEY,
                'X-Timestamp': Math.floor(Date.now() / 1000),
                'X-Nonce': generateNonce(),
                'X-Signature': 'invalid_signature_12345'
            }
        });
        console.log('❌ 错误签名居然通过了！这是一个BUG');
    } catch (e) {
        if (e.response && e.response.status === 401) {
            console.log('✅ 错误签名被正确拦截:', e.response.data.message);
        } else {
            console.log('⚠️  返回了其他错误:', e.response ? e.response.data : e.message);
        }
    }
}

async function testRateLimit() {
    console.log('\n=== 测试 7: 限流测试（快速请求应被限流） ===');
    const path = '/v1/statistics/overview';
    const headers = getHeaders('GET', path, null);

    let blocked = false;
    const promises = [];

    for (let i = 0; i < 30; i++) {
        promises.push(
            axios.get(BASE_URL + path, { headers: { ...headers, 'X-Nonce': generateNonce() } })
                .catch(e => {
                    if (e.response && e.response.status === 429) {
                        blocked = true;
                    }
                    return e;
                })
        );
    }

    await Promise.all(promises);

    if (blocked) {
        console.log('✅ 限流机制生效，部分请求被正确限流（429）');
    } else {
        console.log('⚠️  30次请求都通过了，可能限流阈值设置较高或测试次数不足');
    }
}

async function testWAF() {
    console.log('\n=== 测试 8: WAF防护（SQL注入应被拦截） ===');
    const path = '/v1/emergency/location/report';
    const body = {
        call_session_id: "' OR 1=1 --",
        emergency_type: "police",
        caller_number_hash: "test",
        location: { latitude: 39.9, longitude: 116.4, accuracy: 10, provider: "gps", timestamp: 123 }
    };

    try {
        const headers = getHeaders('POST', path, body);
        await axios.post(BASE_URL + path, body, { headers });
        console.log('❌ SQL注入居然通过了！WAF可能有问题');
    } catch (e) {
        if (e.response && e.response.status === 403) {
            console.log('✅ WAF正确拦截了SQL注入攻击:', e.response.data.message);
        } else {
            console.log('⚠️  返回了其他错误:', e.response ? e.response.data : e.message);
        }
    }
}

async function testDegrade() {
    console.log('\n=== 测试 9: 降级管理 ===');
    try {
        const res = await axios.get(`${BASE_URL}/stats`);
        console.log('✅ 当前降级级别:', res.data.data.degrade.current_level);
        console.log('   级别说明:', res.data.data.degrade.level_name);
    } catch (e) {
        console.log('❌ 获取降级状态失败:', e.message);
    }
}

async function testHistory() {
    console.log('\n=== 测试 10: 历史记录查询 ===');
    const path = '/v1/emergency/history/list?page=1&page_size=10';

    try {
        const headers = getHeaders('GET', path, null);
        const res = await axios.get(BASE_URL + path, { headers });
        console.log('✅ 历史记录查询成功:');
        console.log('  - 总数:', res.data.data.total);
        console.log('  - 当前页:', res.data.data.page + '/' + res.data.data.total_pages);
        console.log('  - 本页数量:', res.data.data.list.length);
    } catch (e) {
        console.log('❌ 历史记录查询失败:', e.response ? e.response.data : e.message);
    }
}

async function runAllTests() {
    console.log('========================================');
    console.log('  秒达定位 API 测试套件');
    console.log('  包含: 功能测试 + 安全测试 + DDoS防护测试');
    console.log('========================================');

    await testHealth();
    await testStats();

    const sessionId = await testLocationReport();

    if (sessionId) {
        await testLocationQuery(sessionId);
        await testCallStatusSync(sessionId);
    }

    await testSignatureInvalid();
    await testRateLimit();
    await testWAF();
    await testDegrade();
    await testHistory();

    console.log('\n========================================');
    console.log('  测试完成');
    console.log('========================================\n');
}

runAllTests().catch(console.error);
