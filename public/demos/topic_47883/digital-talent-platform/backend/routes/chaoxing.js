/**
 * 超星泛雅（学习通）系统对接路由
 * 实现OAuth2.0授权码模式单点登录
 * 支持教师/学生账号绑定、信息同步
 */

const express = require('express');
const crypto = require('crypto');
const db = require('../utils/db');
const { authenticate, generateToken } = require('../middleware/auth');

const router = express.Router();

// ===== 超星开放平台配置（实际部署时替换为真实配置）=====
const CHAOXING_CONFIG = {
  // 授权服务器地址
  authServer: process.env.CHAOXING_AUTH_SERVER || 'https://passport2.chaoxing.com',
  // API服务器地址
  apiServer: process.env.CHAOXING_API_SERVER || 'https://pan-ya.chaoxing.com',
  // 应用ID（向超星申请）
  clientId: process.env.CHAOXING_CLIENT_ID || 'your-client-id',
  // 应用密钥
  clientSecret: process.env.CHAOXING_CLIENT_SECRET || 'your-client-secret',
  // 授权回调地址
  redirectUri: process.env.CHAOXING_REDIRECT_URI || 'http://localhost:8080/callback.html',
  // 授权范围
  scope: 'user_info course_info class_info'
};

/**
 * GET /api/chaoxing/config
 * 获取超星对接配置（供前端使用）
 */
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      authServer: CHAOXING_CONFIG.authServer,
      clientId: CHAOXING_CONFIG.clientId,
      redirectUri: CHAOXING_CONFIG.redirectUri,
      scope: CHAOXING_CONFIG.scope
    }
  });
});

/**
 * GET /api/chaoxing/auth-url
 * 获取超星授权登录URL
 * 前端调用此接口获取跳转地址，引导用户到超星登录页
 */
router.get('/auth-url', (req, res) => {
  try {
    const { state: clientState, role } = req.query;

    // 生成随机state防止CSRF攻击
    const state = clientState || crypto.randomBytes(16).toString('hex');

    // 构建授权URL（超星OAuth2授权码模式）
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CHAOXING_CONFIG.clientId,
      redirect_uri: CHAOXING_CONFIG.redirectUri,
      scope: CHAOXING_CONFIG.scope,
      state: state
    });

    // 如果指定了角色，附加到state中
    const finalState = role ? `${state}:${role}` : state;
    params.set('state', finalState);

    const authUrl = `${CHAOXING_CONFIG.authServer}/oauth2/authorize?${params.toString()}`;

    res.json({
      success: true,
      data: {
        authUrl,
        state: finalState
      }
    });
  } catch (err) {
    console.error('生成授权URL失败:', err);
    res.status(500).json({ success: false, message: '生成授权链接失败' });
  }
});

/**
 * POST /api/chaoxing/callback
 * 超星授权回调处理
 * 超星用户登录成功后，会携带code和state重定向到此接口
 */
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: '缺少授权码' });
    }

    // ===== 步骤1：用授权码换取Access Token =====
    // 实际环境：向超星Token接口发送请求
    // const tokenRes = await fetch(`${CHAOXING_CONFIG.authServer}/oauth2/token`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'authorization_code',
    //     code,
    //     client_id: CHAOXING_CONFIG.clientId,
    //     client_secret: CHAOXING_CONFIG.clientSecret,
    //     redirect_uri: CHAOXING_CONFIG.redirectUri
    //   })
    // });
    // const tokenData = await tokenRes.json();

    // ===== 模拟超星Token响应（实际部署时替换为真实请求）=====
    const tokenData = await mockChaoxingTokenExchange(code);

    if (!tokenData.access_token) {
      return res.status(401).json({
        success: false,
        message: '获取超星Token失败',
        error: tokenData.error
      });
    }

    // ===== 步骤2：用Access Token获取用户信息 =====
    // 实际环境：向超星用户信息接口发送请求
    // const userRes = await fetch(`${CHAOXING_CONFIG.apiServer}/api/user/info`, {
    //   headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    // });
    // const cxUser = await userRes.json();

    // ===== 模拟超星用户信息（实际部署时替换为真实请求）=====
    const cxUser = await mockChaoxingUserInfo(tokenData.access_token);

    // 解析state获取角色信息
    const roleHint = state ? state.split(':')[1] : null;

    // ===== 步骤3：查找或创建本平台用户 =====
    let user = db.findOne('users', { chaoxingUid: cxUser.uid });

    if (user) {
      // 用户已存在，更新超星Token和用户信息
      db.update('users', user.id, {
        chaoxingToken: tokenData.access_token,
        chaoxingRefreshToken: tokenData.refresh_token,
        chaoxingTokenExpire: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        name: cxUser.name || user.name,
        avatar: cxUser.avatar || user.avatar,
        lastLoginAt: new Date().toISOString()
      });
    } else {
      // 新用户，自动注册
      const role = determineRole(cxUser, roleHint);
      const account = cxUser.studentId || cxUser.teacherId || cxUser.uid;

      user = db.insert('users', {
        role: role,
        account: account,
        password: '', // 超星登录用户不设本地密码
        name: cxUser.name || '超星用户',
        email: cxUser.email || '',
        phone: cxUser.phone || '',
        orgName: cxUser.schoolName || cxUser.orgName || '',
        orgCode: cxUser.schoolCode || '',
        studentId: cxUser.studentId || '',
        major: cxUser.major || cxUser.department || '',
        avatar: cxUser.avatar || '',
        // 超星关联信息
        chaoxingUid: cxUser.uid,
        chaoxingAccount: cxUser.account || '',
        chaoxingToken: tokenData.access_token,
        chaoxingRefreshToken: tokenData.refresh_token,
        chaoxingTokenExpire: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        chaoxingBoundAt: new Date().toISOString(),
        status: 'active'
      });
    }

    // ===== 步骤4：生成本平台JWT Token =====
    const token = generateToken({
      userId: user.id,
      role: user.role,
      account: user.account
    });

    res.json({
      success: true,
      message: '超星登录成功',
      data: {
        token,
        user: {
          id: user.id,
          role: user.role,
          account: user.account,
          name: user.name,
          email: user.email,
          phone: user.phone,
          orgName: user.orgName,
          studentId: user.studentId,
          major: user.major,
          avatar: user.avatar,
          chaoxingUid: user.chaoxingUid
        }
      }
    });
  } catch (err) {
    console.error('超星回调处理失败:', err);
    res.status(500).json({ success: false, message: '登录处理失败: ' + err.message });
  }
});

/**
 * POST /api/chaoxing/bind
 * 绑定超星账号到已有本地账号（需登录）
 */
router.post('/bind', authenticate, async (req, res) => {
  try {
    const { chaoxingUid, chaoxingAccount, chaoxingToken, chaoxingName } = req.body;

    if (!chaoxingUid) {
      return res.status(400).json({ success: false, message: '请提供超星用户ID' });
    }

    // 检查该超星账号是否已被其他用户绑定
    const existing = db.findOne('users', { chaoxingUid });
    if (existing && existing.id !== req.user.userId) {
      return res.status(409).json({
        success: false,
        message: '该超星账号已被其他用户绑定'
      });
    }

    // 更新当前用户的超星关联信息
    const updated = db.update('users', req.user.userId, {
      chaoxingUid,
      chaoxingAccount: chaoxingAccount || '',
      chaoxingToken: chaoxingToken || '',
      chaoxingBoundAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: '超星账号绑定成功',
      data: {
        id: updated.id,
        name: updated.name,
        chaoxingUid: updated.chaoxingUid,
        chaoxingBoundAt: updated.chaoxingBoundAt
      }
    });
  } catch (err) {
    console.error('绑定超星账号失败:', err);
    res.status(500).json({ success: false, message: '绑定失败' });
  }
});

/**
 * POST /api/chaoxing/unbind
 * 解绑超星账号（需登录）
 */
router.post('/unbind', authenticate, (req, res) => {
  try {
    const user = db.findById('users', req.user.userId);
    if (!user || !user.chaoxingUid) {
      return res.status(400).json({ success: false, message: '未绑定超星账号' });
    }

    // 如果用户没有设置本地密码，不允许解绑
    if (!user.password || user.password === '') {
      return res.status(400).json({
        success: false,
        message: '请先设置本地登录密码，再解绑超星账号'
      });
    }

    db.update('users', req.user.userId, {
      chaoxingUid: '',
      chaoxingAccount: '',
      chaoxingToken: '',
      chaoxingRefreshToken: '',
      chaoxingTokenExpire: '',
      chaoxingBoundAt: ''
    });

    res.json({ success: true, message: '超星账号已解绑' });
  } catch (err) {
    console.error('解绑超星账号失败:', err);
    res.status(500).json({ success: false, message: '解绑失败' });
  }
});

/**
 * GET /api/chaoxing/profile
 * 获取当前用户绑定的超星信息（需登录）
 */
router.get('/profile', authenticate, (req, res) => {
  const user = db.findById('users', req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }

  const isBound = !!user.chaoxingUid;

  res.json({
    success: true,
    data: {
      isBound,
      chaoxingUid: user.chaoxingUid || '',
      chaoxingAccount: user.chaoxingAccount || '',
      chaoxingBoundAt: user.chaoxingBoundAt || '',
      chaoxingTokenExpire: user.chaoxingTokenExpire || ''
    }
  });
});

/**
 * GET /api/chaoxing/courses
 * 从超星同步用户的课程/班级信息（需登录且已绑定）
 */
router.get('/courses', authenticate, async (req, res) => {
  try {
    const user = db.findById('users', req.user.userId);
    if (!user || !user.chaoxingUid) {
      return res.status(400).json({ success: false, message: '未绑定超星账号' });
    }

    // 实际环境：调用超星API获取课程列表
    // const coursesRes = await fetch(`${CHAOXING_CONFIG.apiServer}/api/course/list`, {
    //   headers: { 'Authorization': `Bearer ${user.chaoxingToken}` }
    // });
    // const courses = await coursesRes.json();

    // ===== 模拟超星课程数据（实际部署时替换为真实请求）=====
    const courses = mockChaoxingCourses(user.chaoxingUid, user.role);

    res.json({
      success: true,
      data: {
        courses,
        total: courses.length,
        syncAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('获取超星课程失败:', err);
    res.status(500).json({ success: false, message: '同步课程信息失败' });
  }
});

/**
 * POST /api/chaoxing/refresh-token
 * 刷新超星Access Token（需登录且已绑定）
 */
router.post('/refresh-token', authenticate, async (req, res) => {
  try {
    const user = db.findById('users', req.user.userId);
    if (!user || !user.chaoxingRefreshToken) {
      return res.status(400).json({ success: false, message: '未绑定超星账号或缺少刷新令牌' });
    }

    // 实际环境：向超星刷新Token接口发送请求
    // const refreshRes = await fetch(`${CHAOXING_CONFIG.authServer}/oauth2/token`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'refresh_token',
    //     refresh_token: user.chaoxingRefreshToken,
    //     client_id: CHAOXING_CONFIG.clientId,
    //     client_secret: CHAOXING_CONFIG.clientSecret
    //   })
    // });
    // const tokenData = await refreshRes.json();

    // ===== 模拟刷新Token（实际部署时替换为真实请求）=====
    const tokenData = {
      access_token: `cx_at_${crypto.randomBytes(16).toString('hex')}`,
      refresh_token: `cx_rt_${crypto.randomBytes(16).toString('hex')}`,
      expires_in: 7200
    };

    db.update('users', user.id, {
      chaoxingToken: tokenData.access_token,
      chaoxingRefreshToken: tokenData.refresh_token,
      chaoxingTokenExpire: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    });

    res.json({
      success: true,
      message: 'Token刷新成功',
      data: {
        expiresIn: tokenData.expires_in
      }
    });
  } catch (err) {
    console.error('刷新Token失败:', err);
    res.status(500).json({ success: false, message: 'Token刷新失败' });
  }
});

// ===== 模拟函数（实际部署时替换为真实超星API调用）=====

/**
 * 模拟超星Token交换
 */
async function mockChaoxingTokenExchange(code) {
  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 100));

  // 根据code生成一致的模拟数据（便于测试）
  const hash = crypto.createHash('md5').update(code).digest('hex');

  return {
    access_token: `cx_at_${hash.substring(0, 32)}`,
    refresh_token: `cx_rt_${hash.substring(16, 48)}`,
    expires_in: 7200,
    token_type: 'Bearer'
  };
}

/**
 * 模拟超星用户信息获取
 */
async function mockChaoxingUserInfo(accessToken) {
  await new Promise(r => setTimeout(r, 100));

  // 根据token生成一致的模拟用户数据
  const hash = crypto.createHash('md5').update(accessToken).digest('hex');
  const uid = `cx_${hash.substring(0, 12)}`;
  const isStudent = parseInt(hash.substring(0, 2), 16) % 2 === 0;

  if (isStudent) {
    return {
      uid,
      account: `stu_${hash.substring(0, 8)}`,
      name: `学生_${hash.substring(0, 4)}`,
      email: `stu_${hash.substring(0, 6)}@school.edu.cn`,
      phone: `138${hash.substring(0, 8)}`,
      studentId: `2024${hash.substring(0, 8)}`,
      schoolName: '泰山职业技术学院',
      schoolCode: 'TSZY',
      major: '计算机应用技术',
      department: '信息工程系',
      avatar: '',
      userType: 'student'
    };
  } else {
    return {
      uid,
      account: `tch_${hash.substring(0, 8)}`,
      name: `教师_${hash.substring(0, 4)}`,
      email: `tch_${hash.substring(0, 6)}@school.edu.cn`,
      phone: `139${hash.substring(0, 8)}`,
      teacherId: `T${hash.substring(0, 8).toUpperCase()}`,
      schoolName: '泰山职业技术学院',
      schoolCode: 'TSZY',
      department: '信息工程系',
      title: '讲师',
      avatar: '',
      userType: 'teacher'
    };
  }
}

/**
 * 模拟超星课程列表
 */
function mockChaoxingCourses(uid, role) {
  const courses = [];
  const baseCourses = [
    { id: 'cx_001', name: 'Web前端开发技术', courseCode: 'WEB101', teacher: '张教授', term: '2025-2026-2' },
    { id: 'cx_002', name: '数据库原理与应用', courseCode: 'DB102', teacher: '李教授', term: '2025-2026-2' },
    { id: 'cx_003', name: 'Python程序设计', courseCode: 'PY103', teacher: '王教授', term: '2025-2026-2' },
    { id: 'cx_004', name: '数字媒体技术', courseCode: 'DM104', teacher: '赵教授', term: '2025-2026-2' }
  ];

  // 根据uid的hash值决定显示哪些课程
  const hash = crypto.createHash('md5').update(uid).digest('hex');
  const count = 2 + (parseInt(hash.substring(0, 2), 16) % 3);

  for (let i = 0; i < Math.min(count, baseCourses.length); i++) {
    const course = { ...baseCourses[i] };
    if (role === 'teacher') {
      course.classCount = 3 + (parseInt(hash.substring(i * 2, i * 2 + 2), 16) % 5);
      course.studentCount = 30 + (parseInt(hash.substring(i * 2 + 4, i * 2 + 6), 16) % 40);
    } else {
      course.credit = 2 + (parseInt(hash.substring(i * 2, i * 2 + 2), 16) % 3);
      course.score = 60 + (parseInt(hash.substring(i * 2 + 4, i * 2 + 6), 16) % 40);
    }
    courses.push(course);
  }

  return courses;
}

/**
 * 根据超星用户类型判断本平台角色
 */
function determineRole(cxUser, roleHint) {
  if (roleHint && ['enterprise', 'teacher', 'student'].includes(roleHint)) {
    return roleHint;
  }
  if (cxUser.userType === 'teacher' || cxUser.teacherId) {
    return 'teacher';
  }
  if (cxUser.userType === 'student' || cxUser.studentId) {
    return 'student';
  }
  return 'student'; // 默认学生
}

module.exports = router;
