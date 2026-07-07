const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/v1/statistics/overview',
    method: 'GET',
    headers: {
        'X-App-Key': 'test_app_key_001',
        'X-Timestamp': Math.floor(Date.now() / 1000),
        'X-Nonce': 'test_nonce_rate_limit',
        'X-Signature': 'fake_signature_for_test',
        'X-Device-Id': 'test_device_001'
    }
};

let successCount = 0;
let rateLimitedCount = 0;
let otherErrorCount = 0;

function sendRequest(i) {
    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            if (res.statusCode === 429) {
                rateLimitedCount++;
            } else if (res.statusCode === 200) {
                successCount++;
            } else {
                otherErrorCount++;
            }
            res.resume();
            resolve();
        });
        req.on('error', (e) => {
            otherErrorCount++;
            resolve();
        });
        req.end();
    });
}

async function runTest() {
    console.log('开始限流测试，发送 30 个请求...');
    const promises = [];
    for (let i = 0; i < 30; i++) {
        promises.push(sendRequest(i));
    }
    await Promise.all(promises);

    console.log(`结果: 成功=${successCount}, 被限流=${rateLimitedCount}, 其他错误=${otherErrorCount}`);
    
    if (rateLimitedCount > 0) {
        console.log('✅ 限流机制正常工作');
    } else {
        console.log('❌ 限流机制未触发');
    }
}

runTest();
