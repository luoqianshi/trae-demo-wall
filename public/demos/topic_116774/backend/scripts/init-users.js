/**
 * 数据库初始化脚本 - 用户数据
 * 创建日期: 2026-07-11
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User');

const saltRounds = 10;

const users = [
  {
    username: 'admin',
    email: 'admin@wisdomflow.com',
    password: 'admin123',
    real_name: '管理员',
    role: 'admin',
    department: 'IT部门',
    position: '系统管理员',
    expertise_tags: JSON.stringify(['系统管理', '数据库', '安全']),
    contribution_points: 0,
    status: 'active'
  },
  {
    username: 'expert_zhang',
    email: 'zhang@wisdomflow.com',
    password: 'expert123',
    real_name: '张明',
    role: 'expert',
    department: '研发部',
    position: '高级工程师',
    expertise_tags: JSON.stringify(['Java', 'Spring Boot', '微服务', '架构设计']),
    contribution_points: 580,
    status: 'active'
  },
  {
    username: 'expert_li',
    email: 'li@wisdomflow.com',
    password: 'expert123',
    real_name: '李华',
    role: 'expert',
    department: '产品部',
    position: '产品总监',
    expertise_tags: JSON.stringify(['产品设计', '用户体验', '需求分析']),
    contribution_points: 420,
    status: 'active'
  },
  {
    username: 'employee_wang',
    email: 'wang@wisdomflow.com',
    password: 'employee123',
    real_name: '王芳',
    role: 'employee',
    department: '研发部',
    position: '前端工程师',
    expertise_tags: JSON.stringify(['Vue', 'React', 'TypeScript']),
    contribution_points: 150,
    status: 'active'
  },
  {
    username: 'employee_chen',
    email: 'chen@wisdomflow.com',
    password: 'employee123',
    real_name: '陈强',
    role: 'employee',
    department: '运维部',
    position: '运维工程师',
    expertise_tags: JSON.stringify(['Linux', 'Docker', 'Kubernetes']),
    contribution_points: 80,
    status: 'active'
  },
  {
    username: 'employee_liu',
    email: 'liu@wisdomflow.com',
    password: 'employee123',
    real_name: '刘洋',
    role: 'employee',
    department: '市场部',
    position: '市场专员',
    expertise_tags: JSON.stringify(['数据分析', '市场调研']),
    contribution_points: 45,
    status: 'active'
  },
  {
    username: 'user',
    email: 'user@wisdomflow.com',
    password: 'user123',
    real_name: '普通用户',
    role: 'employee',
    department: '综合部',
    position: '职员',
    expertise_tags: JSON.stringify(['文档处理']),
    contribution_points: 20,
    status: 'active'
  }
];

async function initUsers() {
  try {
    await sequelize.sync();

    for (const userData of users) {
      const existingUser = await User.findOne({ where: { username: userData.username } });

      if (!existingUser) {
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);
        await User.create({
          ...userData,
          password_hash: passwordHash
        });
        console.log(`✅ 创建用户: ${userData.username} (${userData.real_name})`);
      } else {
        console.log(`⚠️ 用户已存在: ${userData.username}`);
      }
    }

    console.log('\n🎉 用户数据初始化完成！');

    const count = await User.count();
    console.log(`📊 当前数据库用户总数: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    process.exit(1);
  }
}

initUsers();