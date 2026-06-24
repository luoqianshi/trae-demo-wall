/**
 * 川南旅行规划助手 - 后端服务
 * 提供天气查询、地图搜索等API代理服务
 */

// 加载.env环境变量文件
require('dotenv').config();

const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Key 配置（从环境变量读取，保护 Key 安全）
const AMAP_KEY = process.env.AMAP_KEY || 'YOUR_AMAP_KEY_HERE';

// ==================== API 路由 ====================

/**
 * 搜索景点位置（调用高德地图 API）
 * 用于地图上标注景点位置
 */
app.get('/api/search-location', (req, res) => {
    const { name, city } = req.query;
    
    if (!name || !city) {
        return res.json({
            success: false,
            message: '请提供景点名称和城市'
        });
    }
    
    const query = encodeURIComponent(name);
    const url = `https://restapi.amap.com/v3/place/text?key=${AMAP_KEY}&keywords=${query}&city=${city}&citylimit=true`;
    
    https.get(url, (apiRes) => {
        let data = '';
        
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.status === '1' && result.pois && result.pois.length > 0) {
                    res.json({
                        success: true,
                        data: {
                            name: result.pois[0].name,
                            address: result.pois[0].address,
                            location: result.pois[0].location,
                            cityname: result.pois[0].cityname
                        }
                    });
                } else {
                    res.json({
                        success: false,
                        message: '未找到该地点'
                    });
                }
            } catch (e) {
                res.json({
                    success: false,
                    message: '解析数据失败'
                });
            }
        });
    }).on('error', (e) => {
        res.json({
            success: false,
            message: '请求高德API失败'
        });
    });
});

/**
 * 获取高德地图 JS API Key
 * 安全的 Key 提供方式，不直接暴露在前端代码中
 */
app.get('/api/map-key', (req, res) => {
    res.json({
        success: true,
        key: AMAP_KEY
    });
});

/**
 * 代理天气查询
 * 解决前端跨域问题和 Key 权限限制
 */
app.get('/api/weather', (req, res) => {
    const { cityCode } = req.query;
    
    if (!cityCode) {
        return res.json({
            success: false,
            message: '请提供城市编码'
        });
    }
    
    const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${AMAP_KEY}&city=${cityCode}&extensions=all`;
    
    https.get(url, (apiRes) => {
        let data = '';
        
        apiRes.on('data', (chunk) => {
            data += chunk;
        });
        
        apiRes.on('end', () => {
            try {
                const result = JSON.parse(data);
                res.json({
                    success: result.status === '1',
                    data: result
                });
            } catch (e) {
                res.json({
                    success: false,
                    message: '解析天气数据失败'
                });
            }
        });
    }).on('error', (e) => {
        res.json({
            success: false,
            message: '请求天气API失败'
        });
    });
});

// ==================== 启动服务器 ====================

const server = app.listen(PORT, () => {
    console.log(`🚀 川南旅行规划助手后端服务已启动`);
    console.log(`📍 访问地址：http://localhost:${PORT}`);
    console.log(`🔑 高德地图 API Key: ${AMAP_KEY === 'YOUR_AMAP_KEY_HERE' ? '未配置' : '已配置'}`);

    // 通知Electron主进程
    if (process.send) {
        process.send('server-ready');
    }
});

// 优雅关闭
process.on('SIGTERM', () => {
    server.close(() => {
        process.exit(0);
    });
});
