/**
 * TempVault V2 – 后端服务
 * 技术栈：Node.js + Express
 * 数据存储：内存 + JSON 文件持久化
 * 安全设计：服务端仅存储密文，无法读取凭证明文内容
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ===== 数据存储 =====
const DATA_FILE = path.join(__dirname, 'data', 'vaults.json');
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 加载数据
function loadVaults() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('加载数据失败，使用空数据:', e.message);
  }
  return {};
}

// 保存数据
function saveVaults(vaults) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(vaults, null, 2), 'utf8');
  } catch (e) {
    console.error('保存数据失败:', e.message);
  }
}

// 生成安全 token
function generateToken() {
  return crypto.randomBytes(16).toString('hex'); // 32 字符
}

// ===== API 路由 =====

/**
 * POST /api/vaults
 * 创建凭证包裹
 * Body: { ciphertext, iv, title, note, expirySeconds, maxViews, burnAfterReading, noCopy }
 * 服务端只接收密文，不接触明文
 */
app.post('/api/vaults', (req, res) => {
  try {
    const {
      ciphertext,
      iv,
      title,
      note,
      expirySeconds = 3600,
      maxViews = 1,
      burnAfterReading = true,
      noCopy = false
    } = req.body;

    if (!ciphertext || !iv) {
      return res.status(400).json({ error: '缺少加密数据' });
    }

    const token = generateToken();
    const now = Date.now();

    const vault = {
      token,
      ciphertext,       // Base64 编码的密文
      iv,               // Base64 编码的初始化向量
      title: title || '未命名凭证',
      note: note || '',
      createdAt: now,
      expiresAt: now + (parseInt(expirySeconds) || 3600) * 1000,
      maxViews: Math.max(1, parseInt(maxViews) || 1),
      remainingViews: Math.max(1, parseInt(maxViews) || 1),
      burnAfterReading: !!burnAfterReading,
      noCopy: !!noCopy,
      viewLogs: [],
      destroyedAt: null
    };

    const vaults = loadVaults();
    vaults[token] = vault;
    saveVaults(vaults);

    console.log(`[创建] ${vault.title} | token: ${token.substring(0, 8)}... | 过期: ${new Date(vault.expiresAt).toLocaleString()}`);

    res.json({
      success: true,
      token: vault.token,
      shareUrl: `/view/${vault.token}`,
      expiresAt: vault.expiresAt,
      maxViews: vault.maxViews,
      burnAfterReading: vault.burnAfterReading
    });
  } catch (e) {
    console.error('创建失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/vaults/:token
 * 获取凭证信息（仅元数据 + 密文，不含明文）
 * 用于接收者打开链接时请求
 */
app.get('/api/vaults/:token', (req, res) => {
  try {
    const vaults = loadVaults();
    const vault = vaults[req.params.token];

    if (!vault) {
      return res.status(404).json({ error: '凭证不存在' });
    }

    const now = Date.now();

    // 检查状态
    let status = 'active';
    if (vault.destroyedAt) {
      status = 'destroyed';
    } else if (now > vault.expiresAt) {
      status = 'expired';
    } else if (vault.remainingViews <= 0) {
      status = 'expired';
    } else if (vault.viewLogs.length > 0) {
      status = 'viewed';
    }

    // 如果已销毁或过期，不返回密文
    if (status === 'destroyed' || status === 'expired') {
      return res.json({
        success: true,
        status,
        title: vault.title,
        createdAt: vault.createdAt,
        expiresAt: vault.expiresAt,
        maxViews: vault.maxViews,
        remainingViews: vault.remainingViews,
        burnAfterReading: vault.burnAfterReading,
        noCopy: vault.noCopy,
        viewLogs: vault.viewLogs,
        viewLogCount: vault.viewLogs.length,
        destroyedAt: vault.destroyedAt
        // 不返回 ciphertext 和 iv
      });
    }

    // 未过期/未销毁，返回密文用于前端解密
    res.json({
      success: true,
      status,
      title: vault.title,
      note: vault.note,
      ciphertext: vault.ciphertext,
      iv: vault.iv,
      createdAt: vault.createdAt,
      expiresAt: vault.expiresAt,
      maxViews: vault.maxViews,
      remainingViews: vault.remainingViews,
      burnAfterReading: vault.burnAfterReading,
      noCopy: vault.noCopy,
      viewLogCount: vault.viewLogs.length
    });
  } catch (e) {
    console.error('查询失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * POST /api/vaults/:token/view
 * 记录一次查看访问
 * Body: { ip }（可选）
 */
app.post('/api/vaults/:token/view', (req, res) => {
  try {
    const vaults = loadVaults();
    const vault = vaults[req.params.token];

    if (!vault) {
      return res.status(404).json({ error: '凭证不存在' });
    }

    const now = Date.now();

    // 已销毁或过期，不允许查看
    if (vault.destroyedAt || now > vault.expiresAt || vault.remainingViews <= 0) {
      return res.json({ success: false, status: 'destroyed' });
    }

    // 记录访问日志
    const ip = req.body.ip || 'unknown';
    vault.viewLogs.push({
      time: now,
      ip: ip,
      userAgent: req.get('User-Agent') ? req.get('User-Agent').substring(0, 100) : 'unknown'
    });

    // 扣减剩余次数
    vault.remainingViews--;

    // 阅后即焚：立即销毁
    if (vault.burnAfterReading) {
      vault.destroyedAt = now;
      vault.remainingViews = 0;
      console.log(`[销毁-阅后即焚] ${vault.title} | token: ${vault.token.substring(0, 8)}...`);
    }

    vaults[vault.token] = vault;
    saveVaults(vaults);

    console.log(`[查看] ${vault.title} | 剩余: ${vault.remainingViews}/${vault.maxViews} | 状态: ${vault.burnAfterReading ? '已销毁' : '正常'}`);

    res.json({
      success: true,
      remainingViews: vault.remainingViews,
      destroyed: !!vault.destroyedAt
    });
  } catch (e) {
    console.error('记录查看失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * POST /api/vaults/:token/destroy
 * 手动销毁凭证
 */
app.post('/api/vaults/:token/destroy', (req, res) => {
  try {
    const vaults = loadVaults();
    const vault = vaults[req.params.token];

    if (!vault) {
      return res.status(404).json({ error: '凭证不存在' });
    }

    vault.destroyedAt = Date.now();
    vault.remainingViews = 0;
    vaults[vault.token] = vault;
    saveVaults(vaults);

    console.log(`[销毁-手动] ${vault.title} | token: ${vault.token.substring(0, 8)}...`);

    res.json({ success: true, destroyedAt: vault.destroyedAt });
  } catch (e) {
    console.error('销毁失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * POST /api/vaults/:token/simulate-expire
 * 模拟过期（Demo 专用，方便评审测试）
 */
app.post('/api/vaults/:token/simulate-expire', (req, res) => {
  try {
    const vaults = loadVaults();
    const vault = vaults[req.params.token];

    if (!vault) {
      return res.status(404).json({ error: '凭证不存在' });
    }

    vault.expiresAt = Date.now() - 1000; // 设为 1 秒前过期
    vaults[vault.token] = vault;
    saveVaults(vaults);

    console.log(`[模拟过期] ${vault.title} | token: ${vault.token.substring(0, 8)}...`);

    res.json({ success: true, expiresAt: vault.expiresAt });
  } catch (e) {
    console.error('模拟过期失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * GET /api/vaults
 * 获取所有凭证列表（管理页用）
 */
app.get('/api/vaults', (req, res) => {
  try {
    const vaults = loadVaults();
    const now = Date.now();

    const list = Object.values(vaults)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(v => {
        let status = 'active';
        if (v.destroyedAt) status = 'destroyed';
        else if (now > v.expiresAt) status = 'expired';
        else if (v.remainingViews <= 0) status = 'expired';
        else if (v.viewLogs.length > 0) status = 'viewed';

        return {
          token: v.token,
          title: v.title,
          note: v.note,
          createdAt: v.createdAt,
          expiresAt: v.expiresAt,
          maxViews: v.maxViews,
          remainingViews: v.remainingViews,
          burnAfterReading: v.burnAfterReading,
          noCopy: v.noCopy,
          status,
          viewLogs: v.viewLogs,
          viewLogCount: v.viewLogs.length,
          destroyedAt: v.destroyedAt
        };
      });

    res.json({ success: true, vaults: list });
  } catch (e) {
    console.error('列表查询失败:', e);
    res.status(500).json({ error: '服务器错误' });
  }
});

/**
 * DELETE /api/vaults
 * 清除所有凭证数据（Demo 重置用）
 */
app.delete('/api/vaults', (req, res) => {
  try {
    saveVaults({});
    console.log('[清除] 所有凭证数据已清除');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 所有其他路由返回前端 SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== 启动 =====
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   TempVault V2 – 临时凭证安全分享       ║');
  console.log('║   服务已启动                             ║');
  console.log(`║   地址: http://localhost:${PORT}             ║`);
  console.log('║   Demo 环境 · 请勿输入真实密码           ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
