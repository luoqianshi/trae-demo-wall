const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Enable WAL mode and foreign keys
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDatabase() {
  // Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'public',
      institution TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  await run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      requirements TEXT DEFAULT '',
      location TEXT DEFAULT '',
      image TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      creator_id INTEGER NOT NULL,
      external_url TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add external_url column if table exists but column missing (migration)
  try {
    await run(`ALTER TABLE projects ADD COLUMN external_url TEXT DEFAULT ''`);
  } catch (e) {
    // Column already exists, ignore
  }

  // Participations table
  await run(`
    CREATE TABLE IF NOT EXISTS participations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      contribution TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(user_id, project_id)
    )
  `);

  // Seed data
  await seedData();

  console.log('数据库初始化完成');
}

async function seedData() {
  const hashedPassword = bcrypt.hashSync('demo123', 10);

  // Create demo users
  await run(
    'INSERT OR IGNORE INTO users (email, password_hash, name, role, institution) VALUES (?, ?, ?, ?, ?)',
    ['scientist@demo.com', hashedPassword, '张博士', 'scientist', '中国科学院']
  );
  await run(
    'INSERT OR IGNORE INTO users (email, password_hash, name, role, institution) VALUES (?, ?, ?, ?, ?)',
    ['public@demo.com', hashedPassword, '李明', 'public', '']
  );

  // Create official system user for external projects
  await run(
    'INSERT OR IGNORE INTO users (email, password_hash, name, role, institution) VALUES (?, ?, ?, ?, ?)',
    ['official@csinchina.org', bcrypt.hashSync('system_official_2024', 10), '官方收录', 'scientist', '科学公民 (CSinChina)']
  );

  const scientist = await get("SELECT id FROM users WHERE email = 'scientist@demo.com'");
  const official = await get("SELECT id FROM users WHERE email = 'official@csinchina.org'");

  // Check if we already have seeded data
  const count = await get('SELECT COUNT(*) as count FROM projects');

  if (count.count === 0) {
    // Demo projects (platform internal projects)
    const demoProjects = [
      { title: '城市鸟类多样性调查', description: '本项目旨在通过公众参与，记录城市中不同区域的鸟类种类和数量。参与者只需在户外观察鸟类，通过手机拍照并上传记录即可。数据将用于研究城市生态系统中鸟类分布规律。', category: '鸟类学', requirements: '手机或相机，可安装鸟类识别App', location: '全国各城市', status: 'active', external_url: '' },
      { title: '星空光污染监测计划', description: '通过公众拍摄夜空照片，上传至平台，我们将利用这些数据绘制全国光污染地图。参与者在晴朗夜晚用手机拍摄星空即可。', category: '天文学', requirements: '智能手机，晴朗夜晚', location: '全国', status: 'active', external_url: '' },
      { title: '春季植物物候观测', description: '记录春季植物发芽、开花、结果的时间点，帮助科学家研究气候变化对植物生长周期的影响。', category: '生态与生物多样性', requirements: '可拍照设备，对植物有兴趣', location: '全国各地', status: 'active', external_url: '' },
      { title: '蝴蝶多样性监测', description: '在各地公园、花园等区域记录蝴蝶种类和数量，为昆虫多样性保护提供数据支持。', category: '昆虫学', requirements: '手机拍照，蝴蝶图鉴手册', location: '各地公园及绿地', status: 'active', external_url: '' },
      { title: '海岸线垃圾调查', description: '组织志愿者定期清理海岸线垃圾并记录垃圾种类和数量，为海洋环境保护提供数据。', category: '海洋科学', requirements: '手套、垃圾袋、记录表', location: '沿海城市', status: 'active', external_url: '' },
      { title: '空气质量公众监测', description: '利用便携式空气质量检测设备，收集不同区域的空气质量数据，补充官方监测站的数据空白。', category: '气候变化', requirements: '空气质量检测设备（可选）', location: '全国各城市', status: 'active', external_url: '' }
    ];

    for (const p of demoProjects) {
      await run(
        'INSERT INTO projects (title, description, category, requirements, location, status, creator_id, external_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [p.title, p.description, p.category, p.requirements, p.location, p.status, scientist.id, p.external_url]
      );
    }

    console.log('演示数据已创建');
  }

  // Check if real citizen science projects are already seeded
  const realCount = await get("SELECT COUNT(*) as count FROM projects WHERE creator_id = ?", [official.id]);
  if (realCount.count === 0) {
    // Real citizen science projects from the overview
    const realProjects = [
      {
        title: 'PSP 公众超新星搜寻',
        description: 'Popular Supernova Project（PSP）是国内首个以公众参与为核心的天文搜寻项目。注册用户超3万人，公众可通过比对望远镜图像发现超新星候选体，为恒星演化研究贡献力量。',
        category: '天文学',
        requirements: '电脑/手机访问官网，学习图像比对方法',
        location: '线上参与',
        status: 'active',
        external_url: 'https://nadc.china-vo.org/psp/',
        created_at: '2015-01-01'
      },
      {
        title: 'LENSFINDER 引力透镜搜寻',
        description: '国家天文科学数据中心与上海科技馆联合发起的引力透镜搜寻项目。公众通过识别天文图像中的引力透镜现象，帮助天文学家研究暗物质分布与宇宙演化。支持网页端和微信小程序参与。',
        category: '天文学',
        requirements: '电脑/手机访问官网，或微信小程序搜索"引力透镜搜寻LENSFINDER"',
        location: '线上参与',
        status: 'active',
        external_url: 'https://nadc.china-vo.org/lensfinder/',
        created_at: '2023-01-01'
      },
      {
        title: '火流星上报系统',
        description: '国家天文科学数据中心主导的公众火流星监测项目。公众可上报观测到的火流星信息，协助建立全国火流星数据库，为陨石搜寻和太阳系小天体研究提供线索。',
        category: '天文学',
        requirements: '访问火流星监测网网站，提交观测报告',
        location: '全国',
        status: 'active',
        external_url: 'http://bolide.lamost.org/',
        created_at: '2023-01-01'
      },
      {
        title: '中国观鸟记录中心',
        description: '昆明市朱雀鸟类研究所运营的专业观鸟数据平台。累计超207万篇报告、2818万余次鸟种记录，约覆盖全国鸟种94%。支持网页记录和APP下载，是鸟类多样性监测的重要工具。',
        category: '生物多样性',
        requirements: '访问官网注册，或下载官方APP',
        location: '全国',
        status: 'active',
        external_url: 'https://www.birdreport.cn/',
        created_at: '2014-01-01'
      },
      {
        title: '生物记 APP',
        description: '中科院动物研究所生物多样性信息学研究组开发的自然观察与记录APP。帮助公众记录身边的动植物，构建开放的生物多样性数据库，支持物种识别与分布地图功能。',
        category: '生物多样性',
        requirements: '各大应用商店搜索"生物记"下载APP',
        location: '全国',
        status: 'active',
        external_url: '',
        created_at: '2018-01-01'
      },
      {
        title: '中国自然观察',
        description: '山水自然保护中心等机构联合发起的自然观察与数据平台。累计190万+条物种数据，被评为COP15"生物多样性100+全球典型案例"。支持网站与手机应用记录物种分布。',
        category: '生物多样性',
        requirements: '访问官网了解参与方式，支持网页和手机应用',
        location: '全国',
        status: 'active',
        external_url: 'https://www.shanshui.org/sub_project/995/',
        created_at: '2014-01-01'
      },
      {
        title: '我的自然百宝箱',
        description: '上海自然博物馆主办的公众自然观察与教育活动。线上线下累计参与超470万人次，被评为生态环境部"生物多样性优秀案例"。数据收集入口为微信小程序"听见万物"。',
        category: '自然博物',
        requirements: '微信小程序搜索"听见万物"参与',
        location: '以上海为主，全国可参与',
        status: 'active',
        external_url: '',
        created_at: '2016-01-01'
      },
      {
        title: '上海貉口普查',
        description: '上海市林业总站、复旦大学与山水自然保护中心联合开展的城市野生哺乳动物调查。3-4年间累计参与超1000人次，核心建议已纳入《上海市野生动物保护条例》。每年春夏季招募志愿者。',
        category: '生物多样性',
        requirements: '关注山水自然保护中心官网资讯栏目，查看年度招募公告',
        location: '上海市',
        status: 'active',
        external_url: 'https://www.shanshui.org/information/4948/',
        created_at: '2022-01-01'
      },
      {
        title: '全国鸟撞公民科学项目',
        description: '昆山杜克大学联合多家机构发起的全国防鸟撞行动网络。逾6900名志愿者覆盖186个城市，通过调查记录鸟类与建筑玻璃碰撞事件，推动鸟类友好建筑改造。被评为COP15"生物多样性100+全球典型案例"。',
        category: '生物多样性',
        requirements: '关注"防鸟撞行动网络"公众号/小程序，通过招募文章扫码参与',
        location: '全国186个城市',
        status: 'active',
        external_url: '',
        created_at: '2019-01-01'
      },
      {
        title: '路杀生物调查',
        description: '南京大学动物行为与保护实验室发起的公众调查项目。志愿者记录道路上死亡的野生动物信息，帮助科学家了解人兽冲突热点与交通对野生动物的影响。',
        category: '生物多样性',
        requirements: '关注南京大学动物行为与保护实验室相关推文，扫码进入小程序上报',
        location: '全国',
        status: 'active',
        external_url: '',
        created_at: '2020-01-01'
      },
      {
        title: '中国繁殖鸟类调查（CBBS）',
        description: '中山大学刘阳团队与成都大熊猫繁育研究基地阙品甲团队联合发起的城市繁殖鸟类监测网络。首年覆盖广州、深圳、成都、北京、上海5城，由质兰基金会资助。',
        category: '生物多样性',
        requirements: '访问质兰基金会项目页了解详情，或关注各城市观鸟组织招募信息',
        location: '广州、深圳、成都、北京、上海',
        status: 'active',
        external_url: 'https://www.izhilan.cn/project.jsp?id=1615',
        created_at: '2025-01-01'
      },
      {
        title: '声景中国',
        description: '中科院动物研究所牵头，联合多家单位共建的自然声景数据库。一期在55家保护区布设超100台设备，采集98万+条声景记录。入选联合国"2024—2033年科学促进可持续发展国际十年"计划。',
        category: '声景/生态',
        requirements: '访问声景中国数据库官网，可浏览和下载声景数据',
        location: '全国55家保护区',
        status: 'active',
        external_url: 'https://soc.especies.cn/',
        created_at: '2022-01-01'
      },
      {
        title: '河流守望者',
        description: '地方环保机构与志愿者团队发起的河流生态监测行动。湘江流域曾设置141个监测点、200名志愿者，通过水质检测、垃圾清理等方式守护河流生态。多为线下组织活动，建议根据所在流域检索当地项目。',
        category: '生态环境',
        requirements: '根据所在流域检索当地"河流守望者"或"河湖守望"项目最新链接',
        location: '各流域',
        status: 'active',
        external_url: '',
        created_at: '2008-01-01'
      },
      {
        title: '守护海岸线',
        description: '上海仁渡海洋公益发展中心与深圳市红树林湿地保护基金会等联合发起的海岸线垃圾清理与监测项目。2020年前后在全国51个城市90个监测点开展，数千人次参与，累计记录垃圾数百万件。',
        category: '海洋环境',
        requirements: '访问仁渡海洋官网了解项目介绍与参与信息',
        location: '沿海51个城市',
        status: 'active',
        external_url: 'http://www.renduocean.org/',
        created_at: '2014-01-01'
      },
      {
        title: '中国慢性病前瞻性研究（CKB）',
        description: '中国医学科学院、北京大学与英国牛津大学等联合开展的大规模慢性病流行病学研究。自2004年启动，已募集512,723名参与者，产生大量高水平研究成果。',
        category: '公共卫生',
        requirements: '访问官方网站了解项目介绍、进展和成果',
        location: '全国10个地区',
        status: 'active',
        external_url: 'https://ckbiobank.pku.edu.cn/',
        created_at: '2004-01-01'
      }
    ];

    for (const p of realProjects) {
      await run(
        'INSERT INTO projects (title, description, category, requirements, location, status, creator_id, external_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.title, p.description, p.category, p.requirements, p.location, p.status, official.id, p.external_url, p.created_at]
      );
    }

    console.log('真实公民科学项目数据已导入');
  }
}

module.exports = { db, run, get, all, initDatabase };
