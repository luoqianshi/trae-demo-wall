/**
 * 成长漂流瓶 — 数据库模块
 * 使用 better-sqlite3 操作 SQLite 数据库
 * 使用 bcryptjs 做密码哈希
 */
const path = require('path'); // 引入 path 模块，用于处理文件路径
const fs = require('fs'); // 引入 fs 模块，用于文件系统操作
const Database = require('better-sqlite3'); // 引入 better-sqlite3，操作 SQLite 数据库
const bcrypt = require('bcryptjs'); // 引入 bcryptjs，用于密码哈希

// 数据库文件路径
const DATA_DIR = path.join(__dirname, 'data'); // 数据目录路径
const DB_PATH = path.join(DATA_DIR, 'growth_bottle.db'); // 数据库文件完整路径

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) { // 如果数据目录不存在
    fs.mkdirSync(DATA_DIR, { recursive: true }); // 递归创建数据目录
}

// 初始化数据库连接
const db = new Database(DB_PATH); // 创建数据库实例

// 启用 WAL 模式提升性能
db.pragma('journal_mode = WAL'); // 启用 WAL 日志模式
db.pragma('foreign_keys = ON'); // 启用外键约束

/**
 * 初始化数据库表
 */
function initDatabase() {
    // 用户表
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            nickname TEXT,
            avatar TEXT,
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            bio TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 密码重置令牌表
    db.exec(`
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 今日任务表
    db.exec(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            category TEXT DEFAULT '其他',
            frequency TEXT DEFAULT '每日',
            reminder_time TEXT,
            status INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            show_in_ocean INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 打卡记录表
    db.exec(`
        CREATE TABLE IF NOT EXISTS checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            task_id INTEGER,
            date TEXT NOT NULL,
            note TEXT DEFAULT '',
            image TEXT,
            mood TEXT,
            published INTEGER DEFAULT 0,
            bottle_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 漂流瓶表
    db.exec(`
        CREATE TABLE IF NOT EXISTS bottles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            author_name TEXT,
            author_avatar TEXT,
            content TEXT NOT NULL,
            image TEXT,
            mood TEXT,
            tag TEXT,
            likes_count INTEGER DEFAULT 0,
            comments_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'normal',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 漂流瓶点赞表（联合唯一索引 bottle_id + user_id）
    db.exec(`
        CREATE TABLE IF NOT EXISTS bottle_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bottle_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_bottle_likes_unique ON bottle_likes(bottle_id, user_id);
    `);

    // 漂流瓶评论表
    db.exec(`
        CREATE TABLE IF NOT EXISTS bottle_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bottle_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            user_name TEXT,
            user_avatar TEXT,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 挑战表
    db.exec(`
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            duration_days INTEGER DEFAULT 21,
            category TEXT DEFAULT '生活',
            icon TEXT DEFAULT 'Trophy',
            color TEXT DEFAULT '#4CAF50',
            difficulty TEXT DEFAULT 'normal',
            participants_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ongoing',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 挑战参与者表
    db.exec(`
        CREATE TABLE IF NOT EXISTS challenge_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            progress INTEGER DEFAULT 0,
            current_day INTEGER DEFAULT 1,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            last_checkin_date TEXT,
            status TEXT DEFAULT 'in_progress',
            FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_participant_unique ON challenge_participants(challenge_id, user_id);
    `);

    // 挑战打卡记录表（每次打卡一条记录，可追溯）
    db.exec(`
        CREATE TABLE IF NOT EXISTS challenge_checkins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            checkin_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            day_no INTEGER DEFAULT 1,
            FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_checkin_unique ON challenge_checkins(challenge_id, user_id, date(checkin_at));
        CREATE INDEX IF NOT EXISTS idx_challenge_checkins_challenge ON challenge_checkins(challenge_id, day_no);
        CREATE INDEX IF NOT EXISTS idx_challenge_checkins_user ON challenge_checkins(user_id, challenge_id);
    `);

    // 挑战营友动态表（用户打卡完成自动发送动态）
    db.exec(`
        CREATE TABLE IF NOT EXISTS challenge_moments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            challenge_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_challenge_moments_created ON challenge_moments(created_at DESC);
    `);

    // 挑战营友动态点赞表
    db.exec(`
        CREATE TABLE IF NOT EXISTS challenge_moment_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            moment_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (moment_id) REFERENCES challenge_moments(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_moment_like_unique ON challenge_moment_likes(moment_id, user_id);
    `);

    // 时间胶囊表
    db.exec(`
        CREATE TABLE IF NOT EXISTS capsules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT DEFAULT '',
            voice_note TEXT,
            open_date TEXT NOT NULL,
            status TEXT DEFAULT 'sealed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            opened_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 消息表
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT DEFAULT 'system',
            title TEXT,
            content TEXT,
            sender_name TEXT,
            sender_avatar TEXT,
            is_read INTEGER DEFAULT 0,
            link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 徽章定义表
    db.exec(`
        CREATE TABLE IF NOT EXISTS badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            icon TEXT DEFAULT 'Award',
            color TEXT DEFAULT '#FFD700',
            condition_type TEXT,
            condition_value TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 用户徽章表（联合唯一索引 user_id + badge_id）
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_badges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            badge_id INTEGER NOT NULL,
            earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_unique ON user_badges(user_id, badge_id);
    `);

    // 专注记录表
    db.exec(`
        CREATE TABLE IF NOT EXISTS focus_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            duration_minutes INTEGER NOT NULL,
            task_name TEXT,
            completed INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 周统计表
    db.exec(`
        CREATE TABLE IF NOT EXISTS weekly_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            week_start TEXT NOT NULL,
            total_checkins INTEGER DEFAULT 0,
            total_tasks INTEGER DEFAULT 0,
            total_focus_minutes INTEGER DEFAULT 0,
            total_bottles INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_stats_unique ON weekly_stats(user_id, week_start);
    `);

    // 漂流瓶收藏表（联合唯一索引 bottle_id + user_id）
    db.exec(`
        CREATE TABLE IF NOT EXISTS bottle_favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            bottle_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (bottle_id) REFERENCES bottles(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_bottle_favorites_unique ON bottle_favorites(bottle_id, user_id);
    `);

    // 意见反馈表
    db.exec(`
        CREATE TABLE IF NOT EXISTS feedbacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            contact TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id, created_at DESC);
    `);

    // 用户搭子关系表（记录结伴关系，双向存储）
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_partners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            partner_id INTEGER NOT NULL,
            status TEXT DEFAULT 'accepted',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (partner_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_user_partners_unique ON user_partners(user_id, partner_id);
    `);

    // 任务点赞表（漂流海洋任务的点赞）
    db.exec(`
        CREATE TABLE IF NOT EXISTS task_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_task_likes_unique ON task_likes(task_id, user_id);
    `);

    // 任务评论表（漂流海洋任务的评论）
    db.exec(`
        CREATE TABLE IF NOT EXISTS task_comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            user_name TEXT,
            user_avatar TEXT,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id, created_at DESC);
    `);

    // 数据库迁移：为 tasks 表添加新字段（如果不存在）
    try {
        const columns = db.prepare("PRAGMA table_info(tasks)").all(); // 获取 tasks 表的列信息
        // 需要添加的新字段列表
        const newColumns = [
            { name: 'show_in_ocean', type: 'INTEGER DEFAULT 0' },           // 是否在漂流海洋展示
            { name: 'description', type: 'TEXT DEFAULT ""' },               // 任务描述
            { name: 'task_date', type: 'TEXT' },                            // 任务日期 YYYY-MM-DD
            { name: 'completion_note', type: 'TEXT DEFAULT ""' },           // 完成感受
            { name: 'completion_images', type: 'TEXT' },                    // 完成时图片链接（JSON 数组）
            { name: 'is_cancelled', type: 'INTEGER DEFAULT 0' },            // 是否取消
            { name: 'is_deleted', type: 'INTEGER DEFAULT 0' }               // 是否删除（软删除）
        ];
        newColumns.forEach(function(col) { // 遍历新字段
            const hasCol = columns.some(function(c) { return c.name === col.name; }); // 检查字段是否存在
            if (!hasCol) { // 如果不存在
                db.exec('ALTER TABLE tasks ADD COLUMN ' + col.name + ' ' + col.type); // 添加字段
                console.log('✅ 已为 tasks 表添加 ' + col.name + ' 字段'); // 输出提示
            }
        });
    } catch (e) { // 捕获异常
        console.warn('迁移 tasks 表失败:', e.message); // 输出警告
    }

    // 数据库迁移：为 challenge_participants 表添加 status 字段（如果不存在）
    try {
        const cpColumns = db.prepare("PRAGMA table_info(challenge_participants)").all(); // 获取列信息
        const hasStatus = cpColumns.some(function(c) { return c.name === 'status'; }); // 检查 status 字段
        if (!hasStatus) {
            db.exec("ALTER TABLE challenge_participants ADD COLUMN status TEXT DEFAULT 'in_progress'"); // 添加 status 字段
            console.log('✅ 已为 challenge_participants 表添加 status 字段'); // 输出提示
        }
    } catch (e) { // 捕获异常
        console.warn('迁移 challenge_participants 表失败:', e.message); // 输出警告
    }

    // 数据库迁移：为 users 表添加 gender/birthday/city 字段（如果不存在）
    try {
        const userColumns = db.prepare("PRAGMA table_info(users)").all(); // 获取 users 表列信息
        const userNewCols = [
            { name: 'gender', type: "TEXT DEFAULT 'secret'" },          // 性别：male/female/secret
            { name: 'birthday', type: 'TEXT' },                          // 生日 YYYY-MM-DD
            { name: 'city', type: 'TEXT' }                               // 所在城市
        ];
        userNewCols.forEach(function(col) {
            const hasCol = userColumns.some(function(c) { return c.name === col.name; });
            if (!hasCol) {
                db.exec('ALTER TABLE users ADD COLUMN ' + col.name + ' ' + col.type);
                console.log('✅ 已为 users 表添加 ' + col.name + ' 字段');
            }
        });
    } catch (e) {
        console.warn('迁移 users 表失败:', e.message);
    }

    // 数据库迁移：为 messages 表添加 icon/image 字段（如果不存在）
    try {
        const msgColumns = db.prepare("PRAGMA table_info(messages)").all(); // 获取 messages 表列信息
        const msgNewCols = [
            { name: 'icon', type: 'TEXT' },         // 消息图标（lucide 图标名）
            { name: 'image', type: 'TEXT' }          // 右侧缩略图 URL
        ];
        msgNewCols.forEach(function(col) {
            const hasCol = msgColumns.some(function(c) { return c.name === col.name; });
            if (!hasCol) {
                db.exec('ALTER TABLE messages ADD COLUMN ' + col.name + ' ' + col.type);
                console.log('✅ 已为 messages 表添加 ' + col.name + ' 字段');
            }
        });
    } catch (e) {
        console.warn('迁移 messages 表失败:', e.message);
    }

    // 数据库迁移：为 badges 表添加 image/category 字段（如果不存在）
    try {
        const badgeColumns = db.prepare("PRAGMA table_info(badges)").all(); // 获取 badges 表列信息
        const badgeNewCols = [
            { name: 'image', type: 'TEXT' },           // 徽章图片 URL
            { name: 'category', type: "TEXT DEFAULT '探索'" }  // 徽章分类：坚持/内容/探索/限定
        ];
        badgeNewCols.forEach(function(col) {
            const hasCol = badgeColumns.some(function(c) { return c.name === col.name; });
            if (!hasCol) {
                db.exec('ALTER TABLE badges ADD COLUMN ' + col.name + ' ' + col.type);
                console.log('✅ 已为 badges 表添加 ' + col.name + ' 字段');
            }
        });
    } catch (e) {
        console.warn('迁移 badges 表失败:', e.message);
    }

    // 每日任务统计表
    db.exec(`
        CREATE TABLE IF NOT EXISTS daily_task_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            task_date TEXT NOT NULL,
            total_tasks INTEGER DEFAULT 0,
            completed_tasks INTEGER DEFAULT 0,
            published_bottles INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (user_id, task_date)
        );
    `);

    // 用户等级表（汇总用户总经验和等级）
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_levels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            total_xp INTEGER DEFAULT 0,
            current_level INTEGER DEFAULT 1,
            daily_xp_cap INTEGER DEFAULT 200,
            today_xp_gained INTEGER DEFAULT 0,
            today_date TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    `);

    // 等级配置表（每个等级的称号、图标、所需经验）
    db.exec(`
        CREATE TABLE IF NOT EXISTS level_config (
            level INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT DEFAULT '#4ACD8B',
            required_xp INTEGER NOT NULL DEFAULT 0,
            description TEXT DEFAULT '',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 成长值获取经验表（任务描述、完成条件、完成经验值）
    db.exec(`
        CREATE TABLE IF NOT EXISTS growth_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            category TEXT DEFAULT 'daily',
            condition_type TEXT NOT NULL,
            condition_value TEXT,
            xp_reward INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // 经验关联表（用户与成长值获取经验表的关联，可追溯）
    db.exec(`
        CREATE TABLE IF NOT EXISTS user_growth_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            growth_task_id INTEGER NOT NULL,
            xp_gained INTEGER NOT NULL DEFAULT 0,
            source_type TEXT,
            source_id INTEGER,
            note TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (growth_task_id) REFERENCES growth_tasks(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_user_growth_logs_user ON user_growth_logs(user_id, created_at);
    `);

    // 检查是否有默认用户，没有则创建一个测试账号
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count; // 查询用户数量
    if (userCount === 0) { // 如果没有用户
        createUser('demo', '123456', { // 创建默认测试账号
            email: 'demo@example.com', // 邮箱
            nickname: '演示账号' // 昵称
        });
        console.log('✅ 已创建默认测试账号: demo / 123456'); // 输出提示
    }

    // 创建默认挑战数据
    const challengeCount = db.prepare('SELECT COUNT(*) as count FROM challenges').get().count; // 查询挑战数量
    if (challengeCount === 0) { // 如果没有挑战数据
        const defaultChallenges = [ // 默认挑战列表
            { title: '21天早起计划', description: '每天早上6点起床，开启高效一天', duration_days: 21, category: '生活', icon: 'Sunrise', color: '#FF9800', difficulty: 'normal', status: 'ongoing' },
            { title: '30天阅读挑战', description: '每天阅读30分钟，培养阅读习惯', duration_days: 30, category: '学习', icon: 'BookOpen', color: '#2196F3', difficulty: 'normal', status: 'ongoing' },
            { title: '7天运动打卡', description: '连续7天运动，唤醒身体活力', duration_days: 7, category: '运动', icon: 'Dumbbell', color: '#F44336', difficulty: 'easy', status: 'ongoing' },
            { title: '14天冥想练习', description: '每天冥想10分钟，平静内心', duration_days: 14, category: '生活', icon: 'Brain', color: '#9C27B0', difficulty: 'easy', status: 'ongoing' },
            { title: '21天写作挑战', description: '每天写300字，记录成长', duration_days: 21, category: '爱好', icon: 'PenLine', color: '#4CAF50', difficulty: 'normal', status: 'ongoing' },
            { title: '30天早睡计划', description: '每天11点前入睡，养护身心', duration_days: 30, category: '生活', icon: 'Moon', color: '#3F51B5', difficulty: 'hard', status: 'upcoming' }
        ];
        const insertChallenge = // 插入挑战的预处理语句
    db.prepare(`
            INSERT INTO challenges (title, description, duration_days, category, icon, color, difficulty, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertMany = db.transaction((challenges) => { // 使用事务批量插入
            for (const c of challenges) { // 遍历挑战列表
                insertChallenge.run(c.title, c.description, c.duration_days, c.category, c.icon, c.color, c.difficulty, c.status); // 执行插入
            }
        });
        insertMany(defaultChallenges); // 执行批量插入
        console.log('✅ 已创建默认挑战数据'); // 输出提示
    }

    // 创建默认徽章数据
    const badgeCount = db.prepare('SELECT COUNT(*) as count FROM badges').get().count; // 查询徽章数量
    if (badgeCount === 0) { // 如果没有徽章数据
        const defaultBadges = [ // 默认徽章列表（含图片和分类）
            { name: '初次打卡', description: '完成第一次打卡', icon: 'check-circle-2', color: '#4CAF50', condition_type: 'checkin_count', condition_value: '1', image: './assets/image_15_yi19x4.jpg', category: '坚持' },
            { name: '七日航海家', description: '连续打卡7天', icon: 'flame', color: '#FF9800', condition_type: 'checkin_streak', condition_value: '7', image: './assets/image_15_yi19x4.jpg', category: '坚持' },
            { name: '月之潮汐', description: '连续打卡30天', icon: 'trophy', color: '#FFD700', condition_type: 'checkin_streak_30', condition_value: '30', image: './assets/image_17_yi19x4.jpg', category: '坚持' },
            { name: '百日星辰', description: '连续打卡100天', icon: 'crown', color: '#FFD700', condition_type: 'checkin_streak_100', condition_value: '100', image: '', category: '坚持' },
            { name: '漂流瓶使者', description: '发布10个漂流瓶', icon: 'send', color: '#4ACD8B', condition_type: 'bottle_count', condition_value: '10', image: '', category: '内容' },
            { name: '首个漂流瓶', description: '发布第一个漂流瓶', icon: 'send', color: '#2196F3', condition_type: 'bottle_count_1', condition_value: '1', image: '', category: '内容' },
            { name: '捞起第一瓶', description: '首次捞起漂流瓶', icon: 'glass-water', color: '#FF8A80', condition_type: 'scoop_count', condition_value: '1', image: '', category: '探索' },
            { name: '海洋之声', description: '获得50个赞', icon: 'heart', color: '#E91E63', condition_type: 'likes_received', condition_value: '50', image: '', category: '内容' },
            { name: '挑战达人', description: '完成一个挑战', icon: 'award', color: '#9C27B0', condition_type: 'challenge_completed', condition_value: '1', image: '', category: '限定' },
            { name: '专注新手', description: '完成第一次专注', icon: 'timer', color: '#00BCD4', condition_type: 'focus_count', condition_value: '1', image: '', category: '探索' },
            { name: '专注大师', description: '累计专注1000分钟', icon: 'target', color: '#F44336', condition_type: 'focus_minutes', condition_value: '1000', image: '', category: '探索' },
            { name: '午夜航行者', description: '23:00后打卡', icon: 'moon', color: '#B4A7FF', condition_type: 'late_checkin', condition_value: '1', image: './assets/image_18_yi19x4.jpg', category: '限定' },
            { name: '黎明先锋', description: '06:00前打卡', icon: 'sunrise', color: '#FFB84D', condition_type: 'early_checkin', condition_value: '1', image: './assets/image_19_yi19x4.jpg', category: '限定' },
            { name: '引路人', description: '被"我也要做"20次', icon: 'compass', color: '#4ACD8B', condition_type: 'join_count', condition_value: '20', image: '', category: '内容' },
            { name: '时间旅人', description: '创建一个时间胶囊', icon: 'gift', color: '#3F51B5', condition_type: 'capsule_count', condition_value: '1', image: '', category: '探索' },
            { name: '社交达人', description: '收到10个点赞', icon: 'heart', color: '#E91E63', condition_type: 'likes_received_10', condition_value: '10', image: '', category: '内容' }
        ];
        const insertBadge = // 插入徽章的预处理语句
    db.prepare(`
            INSERT INTO badges (name, description, icon, color, condition_type, condition_value, image, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertMany = db.transaction((badges) => { // 使用事务批量插入
            for (const b of badges) { // 遍历徽章列表
                insertBadge.run(b.name, b.description, b.icon, b.color, b.condition_type, b.condition_value, b.image, b.category); // 执行插入
            }
        });
        insertMany(defaultBadges); // 执行批量插入
        console.log('✅ 已创建默认徽章数据'); // 输出提示
    }

    // 迁移：将旧的 PascalCase 图标名转为 Lucide 识别的 kebab-case（仅影响已有数据）
    const iconMap = { // PascalCase -> kebab-case 映射表
        'CheckCircle': 'check-circle-2',
        'Flame': 'flame',
        'Trophy': 'trophy',
        'Crown': 'crown',
        'Send': 'send',
        'GlassWater': 'glass-water',
        'Heart': 'heart',
        'Award': 'award',
        'Timer': 'timer',
        'Target': 'target',
        'Moon': 'moon',
        'Sunrise': 'sunrise',
        'Compass': 'compass',
        'Gift': 'gift'
    };
    Object.keys(iconMap).forEach(function(oldName) { // 遍历映射表
        const result = db.prepare("UPDATE badges SET icon = ? WHERE icon = ?").run(iconMap[oldName], oldName); // 更新
        if (result.changes > 0) console.log('✅ 徽章图标迁移: ' + oldName + ' -> ' + iconMap[oldName] + ' (' + result.changes + ' 条)'); // 输出
    });

    // 迁移：同步徽章名称/图片/分类到设计稿（按 condition_type 匹配，仅更新缺失或旧数据）
    const designBadges = [ // 设计稿徽章数据（按 condition_type 唯一匹配）
        { name: '初次打卡', description: '完成第一次打卡', icon: 'check-circle-2', color: '#4CAF50', condition_type: 'checkin_count', condition_value: '1', image: './assets/image_15_yi19x4.jpg', category: '坚持' },
        { name: '七日航海家', description: '连续打卡7天', icon: 'flame', color: '#FF9800', condition_type: 'checkin_streak', condition_value: '7', image: './assets/image_15_yi19x4.jpg', category: '坚持' },
        { name: '月之潮汐', description: '连续打卡30天', icon: 'trophy', color: '#FFD700', condition_type: 'checkin_streak_30', condition_value: '30', image: './assets/image_17_yi19x4.jpg', category: '坚持' },
        { name: '百日星辰', description: '连续打卡100天', icon: 'crown', color: '#FFD700', condition_type: 'checkin_streak_100', condition_value: '100', image: '', category: '坚持' },
        { name: '漂流瓶使者', description: '发布10个漂流瓶', icon: 'send', color: '#4ACD8B', condition_type: 'bottle_count', condition_value: '10', image: '', category: '内容' },
        { name: '首个漂流瓶', description: '发布第一个漂流瓶', icon: 'send', color: '#2196F3', condition_type: 'bottle_count_1', condition_value: '1', image: '', category: '内容' },
        { name: '捞起第一瓶', description: '首次捞起漂流瓶', icon: 'glass-water', color: '#FF8A80', condition_type: 'scoop_count', condition_value: '1', image: '', category: '探索' },
        { name: '海洋之声', description: '获得50个赞', icon: 'heart', color: '#E91E63', condition_type: 'likes_received', condition_value: '50', image: '', category: '内容' },
        { name: '挑战达人', description: '完成一个挑战', icon: 'award', color: '#9C27B0', condition_type: 'challenge_completed', condition_value: '1', image: '', category: '限定' },
        { name: '专注新手', description: '完成第一次专注', icon: 'timer', color: '#00BCD4', condition_type: 'focus_count', condition_value: '1', image: '', category: '探索' },
        { name: '专注大师', description: '累计专注1000分钟', icon: 'target', color: '#F44336', condition_type: 'focus_minutes', condition_value: '1000', image: '', category: '探索' },
        { name: '午夜航行者', description: '23:00后打卡', icon: 'moon', color: '#B4A7FF', condition_type: 'late_checkin', condition_value: '1', image: './assets/image_18_yi19x4.jpg', category: '限定' },
        { name: '黎明先锋', description: '06:00前打卡', icon: 'sunrise', color: '#FFB84D', condition_type: 'early_checkin', condition_value: '1', image: './assets/image_19_yi19x4.jpg', category: '限定' },
        { name: '引路人', description: '被"我也要做"20次', icon: 'compass', color: '#4ACD8B', condition_type: 'join_count', condition_value: '20', image: '', category: '内容' },
        { name: '时间旅人', description: '创建一个时间胶囊', icon: 'gift', color: '#3F51B5', condition_type: 'capsule_count', condition_value: '1', image: '', category: '探索' },
        { name: '社交达人', description: '收到10个点赞', icon: 'heart', color: '#E91E63', condition_type: 'likes_received_10', condition_value: '10', image: '', category: '内容' }
    ];
    // 检测旧数据（名字与设计稿不符的记录），按 condition_type 更新或插入
    const existingBadges = db.prepare('SELECT id, name, condition_type FROM badges').all(); // 查询所有徽章
    let migratedCount = 0; // 迁移计数
    designBadges.forEach(function(design) { // 遍历设计稿
        const existing = existingBadges.find(function(b) { return b.condition_type === design.condition_type; }); // 按 condition_type 查找
        if (existing) {
            // 已存在：更新名称/描述/图标/颜色/图片/分类
            db.prepare('UPDATE badges SET name=?, description=?, icon=?, color=?, image=?, category=? WHERE id=?')
                .run(design.name, design.description, design.icon, design.color, design.image, design.category, existing.id);
            if (existing.name !== design.name || !existing.image) migratedCount++; // 需要迁移的记录
        } else {
            // 不存在：插入
            db.prepare('INSERT INTO badges (name, description, icon, color, condition_type, condition_value, image, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
                .run(design.name, design.description, design.icon, design.color, design.condition_type, design.condition_value, design.image, design.category);
            migratedCount++; // 新增计数
        }
    });
    if (migratedCount > 0) console.log('✅ 徽章数据已同步到设计稿 (' + migratedCount + ' 条)'); // 输出

    // 清理：删除名称不在设计稿中的旧徽章（及其 user_badges 关联）
    const designNames = designBadges.map(function(b) { return b.name; }); // 设计稿名称集合
    const staleBadges = db.prepare('SELECT id, name FROM badges').all().filter(function(b) { return designNames.indexOf(b.name) === -1; }); // 查找旧徽章
    if (staleBadges.length > 0) { // 存在旧徽章
        const staleIds = staleBadges.map(function(b) { return b.id; }); // ID 列表
        const placeholders = staleIds.map(function() { return '?'; }).join(','); // 占位符
        db.prepare('DELETE FROM user_badges WHERE badge_id IN (' + placeholders + ')').run(...staleIds); // 删除关联
        db.prepare('DELETE FROM badges WHERE id IN (' + placeholders + ')').run(...staleIds); // 删除徽章
        console.log('✅ 已清理 ' + staleBadges.length + ' 个旧徽章: ' + staleBadges.map(function(b) { return b.name; }).join(', ')); // 输出
    }

    // 为 demo 用户授予一些徽章（种子数据）
    const userBadgeCount = db.prepare('SELECT COUNT(*) as count FROM user_badges').get().count; // 查询用户徽章数量
    if (userBadgeCount === 0) { // 如果没有用户徽章数据
        const demoUserForBadge = getUserByUsername('demo'); // 获取 demo 用户
        if (demoUserForBadge) { // demo 用户存在
            const allBadges = db.prepare('SELECT id FROM badges').all(); // 获取所有徽章
            // 为 demo 用户授予前 6 个徽章
            const grantIds = allBadges.slice(0, 6).map(function(b) { return b.id; }); // 取前6个
            const grantStmt = db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)'); // 插入语句
            grantIds.forEach(function(bid) { // 遍历徽章ID
                grantStmt.run(demoUserForBadge.id, bid); // 授予徽章
            });
            console.log('✅ 已为 demo 用户授予 ' + grantIds.length + ' 个徽章'); // 输出提示
        }
    }

    // 创建默认消息种子数据（为 demo 用户创建示例消息）
    const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count; // 查询消息数量
    if (msgCount === 0) { // 如果没有消息数据
        const demoUser = getUserByUsername('demo'); // 获取 demo 用户
        if (demoUser) { // demo 用户存在
            const defaultMessages = [ // 默认消息列表
                { user_id: demoUser.id, type: 'interact', title: '阿橙赞了你的漂流瓶', content: '练了30分钟口语', sender_name: '阿橙', sender_avatar: '', icon: 'heart', image: '', is_read: 0 },
                { user_id: demoUser.id, type: 'system', title: '解锁成就：七日航海家', content: '连续 7 天，你已经比大多数人更近了', sender_name: '', sender_avatar: '', icon: 'award', image: '', is_read: 0 },
                { user_id: demoUser.id, type: 'partner', title: '你已成功匹配搭子「薄荷」', content: '你们都喜欢早起和背单词', sender_name: '薄荷', sender_avatar: '', icon: 'users', image: '', is_read: 0 },
                { user_id: demoUser.id, type: 'interact', title: '大鱼评论了你的漂流瓶', content: '太厉害了！坚持了30天', sender_name: '大鱼', sender_avatar: '', icon: 'message-circle', image: '', is_read: 1 },
                { user_id: demoUser.id, type: 'challenge', title: '21天早起计划：今日还未打卡', content: '你的挑战营友都在等你打卡呢', sender_name: '', sender_avatar: '', icon: 'bell', image: '', is_read: 1, link: 'challenge-detail.html?id=1' }
            ];
            const insertMsg = db.prepare(`
                INSERT INTO messages (user_id, type, title, content, sender_name, sender_avatar, icon, image, is_read, link)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const insertMsgMany = db.transaction((msgs) => { // 事务批量插入
                for (const m of msgs) { // 遍历消息列表
                    insertMsg.run(m.user_id, m.type, m.title, m.content, m.sender_name, m.sender_avatar, m.icon, m.image, m.is_read, m.link || null); // 执行插入
                }
            });
            insertMsgMany(defaultMessages); // 执行批量插入
            console.log('✅ 已创建默认消息种子数据'); // 输出提示
        }
    }

    // 创建默认等级配置数据（10 个等级，满级需 73000 XP，约一年每日满经验可达）
    const levelConfigCount = db.prepare('SELECT COUNT(*) as count FROM level_config').get().count; // 查询等级配置数量
    if (levelConfigCount === 0) { // 如果没有等级配置数据
        const defaultLevelConfig = [ // 默认等级配置列表
            { level: 1, title: '小贝壳', icon: 'shell', color: '#4ACD8B', required_xp: 0, description: '初入海洋的小贝壳，开始成长之旅' },
            { level: 2, title: '蓝海螺', icon: 'snail', color: '#4ACD8B', required_xp: 500, description: '听到海洋声音的蓝海螺' },
            { level: 3, title: '海马骑士', icon: 'fish', color: '#4ACD8B', required_xp: 1500, description: '骑鱼畅游的海马骑士' },
            { level: 4, title: '珊瑚宝宝', icon: 'flower-2', color: '#4ACD8B', required_xp: 3000, description: '绽放色彩的珊瑚宝宝' },
            { level: 5, title: '珊瑚礁建筑师', icon: 'building', color: '#4ACD8B', required_xp: 5000, description: '建造海底家园的建筑师' },
            { level: 6, title: '深海探索者', icon: 'compass', color: '#4ACD8B', required_xp: 10000, description: '探索深海奥秘的冒险家' },
            { level: 7, title: '海星探险家', icon: 'star', color: '#4ACD8B', required_xp: 20000, description: '收集星光的探险家' },
            { level: 8, title: '鲸鱼守护者', icon: 'waves', color: '#4ACD8B', required_xp: 35000, description: '守护海洋巨兽的卫士' },
            { level: 9, title: '海洋领航员', icon: 'ship', color: '#4ACD8B', required_xp: 55000, description: '引领航向的领航员' },
            { level: 10, title: '海洋守护者', icon: 'crown', color: '#FFD700', required_xp: 73000, description: '海洋的终极守护者' }
        ];
        const insertLevelConfig = db.prepare(`
            INSERT INTO level_config (level, title, icon, color, required_xp, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        const insertLevelMany = db.transaction((configs) => { // 事务批量插入
            for (const c of configs) { // 遍历配置
                insertLevelConfig.run(c.level, c.title, c.icon, c.color, c.required_xp, c.description); // 执行插入
            }
        });
        insertLevelMany(defaultLevelConfig); // 执行批量插入
        console.log('✅ 已创建默认等级配置数据'); // 输出提示
    }

    // 创建默认成长值获取经验任务数据
    const growthTaskCount = db.prepare('SELECT COUNT(*) as count FROM growth_tasks').get().count; // 查询成长任务数量
    if (growthTaskCount === 0) { // 如果没有成长任务数据
        const defaultGrowthTasks = [ // 默认成长任务列表
            // 每日任务
            { title: '今日完成一项任务', description: '完成今日任意一项任务', category: 'daily', condition_type: 'daily_task_complete', condition_value: '1', xp_reward: 10 },
            { title: '发布漂流瓶', description: '发布一个漂流瓶到海洋', category: 'daily', condition_type: 'daily_publish_bottle', condition_value: '1', xp_reward: 20 },
            { title: '点一个赞', description: '给他人的漂流瓶点赞', category: 'daily', condition_type: 'daily_like', condition_value: '1', xp_reward: 5 },
            { title: '触发"我也要做"', description: '在他人漂流瓶上点击"我也要做"', category: 'daily', condition_type: 'daily_imitate', condition_value: '1', xp_reward: 15 },
            // 累计签到任务
            { title: '连续签到1天', description: '连续打卡1天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '1', xp_reward: 10 },
            { title: '连续签到3天', description: '连续打卡3天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '3', xp_reward: 30 },
            { title: '连续签到7天', description: '连续打卡7天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '7', xp_reward: 50 },
            { title: '连续签到14天', description: '连续打卡14天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '14', xp_reward: 100 },
            { title: '连续签到30天', description: '连续打卡30天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '30', xp_reward: 200 },
            { title: '连续签到60天', description: '连续打卡60天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '60', xp_reward: 400 },
            { title: '连续签到90天', description: '连续打卡90天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '90', xp_reward: 600 },
            { title: '连续签到180天', description: '连续打卡180天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '180', xp_reward: 1200 },
            { title: '连续签到360天', description: '连续打卡360天', category: 'cumulative', condition_type: 'checkin_streak', condition_value: '360', xp_reward: 2400 }
        ];
        const insertGrowthTask = db.prepare(`
            INSERT INTO growth_tasks (title, description, category, condition_type, condition_value, xp_reward, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `);
        const insertGrowthMany = db.transaction((tasks) => { // 事务批量插入
            for (const t of tasks) { // 遍历任务
                insertGrowthTask.run(t.title, t.description, t.category, t.condition_type, t.condition_value, t.xp_reward); // 执行插入
            }
        });
        insertGrowthMany(defaultGrowthTasks); // 执行批量插入
        console.log('✅ 已创建默认成长任务数据'); // 输出提示
    }

    console.log('✅ 数据库初始化完成'); // 输出完成提示
}

/**
 * 创建用户
 * @param {string} username 用户名
 * @param {string} password 密码（明文）
 * @param {object} extra 额外信息
 * @returns {object} 创建的用户对象
 */
function createUser(username, password, extra = {}) {
    const passwordHash = bcrypt.hashSync(password, 10); // 哈希密码
    const nickname = extra.nickname || username; // 昵称默认为用户名
    const email = extra.email || null; // 邮箱
    const avatar = extra.avatar || './assets/image_1_r4t3u4.jpg'; // 默认头像

    // 插入用户预处理语句
    const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash, nickname, avatar)
        VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(username, email, passwordHash, nickname, avatar); // 执行插入
    const userId = result.lastInsertRowid; // 用户 ID

    // 同时创建用户等级记录（默认等级 1，总经验 0，每日上限 200）
    db.prepare(`
        INSERT INTO user_levels (user_id, total_xp, current_level, daily_xp_cap, today_xp_gained, today_date)
        VALUES (?, 0, 1, 200, 0, ?)
    `).run(userId, new Date().toISOString().split('T')[0]); // 创建等级记录

    return getUserById(userId); // 返回创建的用户
}

/**
 * 根据 ID 获取用户
 * @param {number} id 用户 ID
 * @returns {object|null} 用户对象
 */
function getUserById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null; // 查询并返回用户
}

/**
 * 根据用户名获取用户
 * @param {string} username 用户名
 * @returns {object|null} 用户对象
 */
function getUserByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username) || null; // 查询并返回用户
}

/**
 * 根据邮箱获取用户
 * @param {string} email 邮箱
 * @returns {object|null} 用户对象
 */
function getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) || null; // 查询并返回用户
}

/**
 * 验证用户密码
 * @param {string} username 用户名
 * @param {string} password 密码
 * @returns {object|null} 验证成功返回用户对象，否则返回 null
 */
function verifyUser(username, password) {
    const user = getUserByUsername(username); // 获取用户
    if (!user) return null; // 用户不存在

    const isValid = bcrypt.compareSync(password, user.password_hash); // 校验密码
    if (!isValid) return null; // 密码错误

    // 移除密码字段
    const { password_hash, ...safeUser } = user; // 解构去除密码
    return safeUser; // 返回安全用户
}

/**
 * 更新用户密码
 * @param {number} userId 用户 ID
 * @param {string} newPassword 新密码
 * @returns {boolean} 是否成功
 */
function updatePassword(userId, newPassword) {
    const passwordHash = bcrypt.hashSync(newPassword, 10); // 哈希新密码
    const stmt = // 更新密码预处理语句
    db.prepare(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    `);
    const result = stmt.run(passwordHash, userId); // 执行更新
    return result.changes > 0; // 返回是否成功
}

/**
 * 根据用户名或邮箱更新密码（忘记密码用）
 * @param {string} identifier 用户名或邮箱
 * @param {string} newPassword 新密码
 * @returns {boolean} 是否成功
 */
function resetPasswordByIdentifier(identifier, newPassword) {
    let user = getUserByUsername(identifier); // 先按用户名查
    if (!user) { // 没找到
        user = getUserByEmail(identifier); // 再按邮箱查
    }
    if (!user) return false; // 都没找到

    return updatePassword(user.id, newPassword); // 更新密码
}

/**
 * 更新用户信息
 * @param {number} userId 用户 ID
 * @param {object} updates 要更新的字段
 * @returns {boolean} 是否成功
 */
function updateUser(userId, updates) {
    const allowedFields = ['nickname', 'email', 'avatar', 'bio', 'level', 'xp', 'gender', 'birthday', 'city']; // 允许更新的字段
    const setClauses = []; // SET 子句列表
    const values = []; // 参数值列表

    for (const field of allowedFields) { // 遍历允许字段
        if (updates[field] !== undefined) { // 如果提供了该字段
            setClauses.push(`${field} = ?`); // 添加 SET 子句
            values.push(updates[field]); // 添加参数
        }
    }

    if (setClauses.length === 0) return false; // 没有字段需要更新

    setClauses.push('updated_at = CURRENT_TIMESTAMP'); // 添加更新时间
    values.push(userId); // 添加用户 ID

    const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`; // 构造 SQL
    const result = db.prepare(sql).run(...values); // 执行更新
    return result.changes > 0; // 返回是否成功
}

/**
 * 获取安全的用户信息（不含密码）
 * @param {object} user 用户对象
 * @returns {object} 安全用户对象
 */
function sanitizeUser(user) {
    if (!user) return null; // 用户为空
    const { password_hash, ...safeUser } = user; // 去除密码字段
    return safeUser; // 返回安全用户
}

// ==================== 今日任务 tasks CRUD ====================

/**
 * 创建任务
 * @param {object} task 任务对象
 * @returns {object} 创建的任务
 */
function createTask(task) {
    const stmt = // 插入任务预处理语句
    db.prepare(`
        INSERT INTO tasks (user_id, title, description, category, frequency, reminder_time, sort_order, show_in_ocean, task_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        task.user_id,
        task.title,
        task.description || '',                       // 任务描述
        task.category || '其他',
        task.frequency || '每日',
        task.reminder_time || null,
        task.sort_order || 0,
        task.show_in_ocean || 0,
        task.task_date || new Date().toISOString().split('T')[0]  // 任务日期，默认今天
    );
    // 创建任务后更新每日统计（任务总数+1）
    const created = getTaskById(result.lastInsertRowid);
    if (created && created.task_date) {
        updateDailyTaskStats(created.user_id, created.task_date);
    }
    return created; // 返回创建的任务
}

/**
 * 根据用户 ID 获取任务列表（排除已删除的）
 * @param {number} userId 用户 ID
 * @returns {Array} 任务列表
 */
function getTasksByUserId(userId) {
    return db.prepare('SELECT * FROM tasks WHERE user_id = ? AND is_deleted = 0 ORDER BY sort_order ASC, created_at DESC').all(userId); // 查询并返回
}

/**
 * 获取漂流海洋中展示的任务（show_in_ocean = 1 且未删除）
 * 关联 users 表获取作者信息（昵称、头像）
 * @param {number} page 页码（从 1 开始）
 * @param {number} pageSize 每页数量
 * @returns {{list: Array, total: number}} 任务列表和总数
 */
function getOceanTasks(page = 1, pageSize = 20, currentUserId = null) {
    const offset = (page - 1) * pageSize; // 计算偏移量
    // 查询漂流海洋任务列表，关联用户、点赞数、评论数
    const list = db.prepare(`
        SELECT t.id, t.user_id, t.title, t.description, t.category, t.frequency,
               t.status, t.completion_note, t.completion_images, t.task_date,
               t.created_at, t.completed_at,
               u.nickname AS author_name, u.avatar AS author_avatar,
               (SELECT COUNT(*) FROM task_likes tl WHERE tl.task_id = t.id) AS like_count,
               (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
               ${currentUserId ? ', (SELECT 1 FROM task_likes tl2 WHERE tl2.task_id = t.id AND tl2.user_id = ?) AS is_liked' : ''}
        FROM tasks t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.show_in_ocean = 1 AND t.is_deleted = 0
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
    `); // 查询漂流海洋任务列表
    const params = currentUserId ? [currentUserId, pageSize, offset] : [pageSize, offset]; // 参数列表
    const rows = list.all(...params); // 执行查询
    // 将 is_liked 转换为布尔值
    rows.forEach(function(row) { if ('is_liked' in row) row.is_liked = !!row.is_liked; });
    const total = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE show_in_ocean = 1 AND is_deleted = 0").get().count; // 总数
    return { list: rows, total }; // 返回列表和总数
}

/**
 * 根据日期获取任务列表
 * @param {number} userId 用户 ID
 * @param {string} date 日期 YYYY-MM-DD
 * @returns {Array} 任务列表
 */
function getTasksByDate(userId, date) {
    return db.prepare(`
        SELECT * FROM tasks
        WHERE user_id = ? AND task_date = ?
        AND is_cancelled = 0 AND is_deleted = 0
        ORDER BY sort_order ASC, created_at DESC
    `).all(userId, date) || [];
}

/**
 * 获取用户某月所有有任务的日期（用于日历打卡点）
 * @param {number} userId 用户 ID
 * @param {number} year 年
 * @param {number} month 月（0-11）
 * @returns {Array} 日期数组 [{date: 'YYYY-MM-DD', count: N}]
 */
function getTaskDatesByMonth(userId, year, month) {
    const monthStr = String(month + 1).padStart(2, '0'); // 月份字符串
    const prefix = year + '-' + monthStr + '-'; // 前缀 YYYY-MM-
    const rows = db.prepare(`
        SELECT task_date as date, COUNT(*) as count FROM tasks
        WHERE user_id = ? AND task_date LIKE ?
        AND is_deleted = 0
        GROUP BY task_date
    `).all(userId, prefix + '%');
    return rows || [];
}

/**
 * 根据 ID 获取任务
 * @param {number} id 任务 ID
 * @returns {object|undefined} 任务对象
 */
function getTaskById(id) {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id); // 查询并返回
}

/**
 * 更新任务
 * @param {number} id 任务 ID
 * @param {object} updates 要更新的字段
 * @returns {boolean} 是否成功
 */
function updateTask(id, updates) {
    const allowedFields = ['title', 'description', 'category', 'frequency', 'reminder_time', 'status', 'sort_order', 'show_in_ocean', 'task_date', 'completion_note', 'completion_images', 'is_cancelled', 'is_deleted']; // 允许更新的字段
    const setClauses = []; // SET 子句列表
    const values = []; // 参数值列表

    for (const field of allowedFields) { // 遍历允许字段
        if (updates[field] !== undefined) { // 如果提供了该字段
            setClauses.push(`${field} = ?`); // 添加 SET 子句
            values.push(updates[field]); // 添加参数
        }
    }

    if (setClauses.length === 0) return false; // 没有字段需要更新
    values.push(id); // 添加任务 ID

    const sql = `UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`; // 构造 SQL
    const result = db.prepare(sql).run(...values); // 执行更新
    // 如果影响任务状态或日期，更新对应每日统计
    if (result.changes > 0) {
        const task = getTaskById(id);
        if (task && task.task_date) {
            updateDailyTaskStats(task.user_id, task.task_date);
        }
    }
    return result.changes > 0; // 返回是否成功
}

/**
 * 删除任务
 * @param {number} id 任务 ID
 * @returns {boolean} 是否成功
 */
function deleteTask(id) {
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id); // 执行删除
    return result.changes > 0; // 返回是否成功
}

/**
 * 切换任务状态（待完成 <-> 已完成）
 * @param {number} id 任务 ID
 * @returns {object|undefined} 更新后的任务
 */
function toggleTaskStatus(id) {
    const task = getTaskById(id); // 获取任务
    if (!task) return undefined; // 任务不存在
    if (task.status === 1) return task; // 已完成任务不允许撤回，直接返回
    // 标记为已完成
    db.prepare('UPDATE tasks SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run(1, id); // 更新状态和完成时间
    // 完成任务后更新每日统计（完成数+1）
    const updated = getTaskById(id);
    if (updated && updated.task_date) {
        updateDailyTaskStats(updated.user_id, updated.task_date);
    }
    return updated; // 返回更新后的任务
}

/**
 * 获取用户今日任务（每日任务 + 一次任务 + 今日是周几对应的每周任务）
 * @param {number} userId 用户 ID
 * @returns {Array} 今日任务列表
 */
function getTodayTasks(userId) {
    // 查询今日任务（按 task_date 过滤，排除已取消和已删除的任务）
    const today = new Date().toISOString().split('T')[0]; // 今日日期 YYYY-MM-DD
    return db.prepare(`
        SELECT * FROM tasks
        WHERE user_id = ?
        AND task_date = ?
        AND is_cancelled = 0
        AND is_deleted = 0
        ORDER BY sort_order ASC, created_at DESC
    `).all(userId, today) || [];
}

// ==================== 打卡记录 checkins CRUD ====================

/**
 * 创建打卡记录
 * @param {object} checkin 打卡对象
 * @returns {object} 创建的打卡记录
 */
function createCheckin(checkin) {
    const stmt = // 插入打卡预处理语句
    db.prepare(`
        INSERT INTO checkins (user_id, task_id, date, note, image, mood, published, bottle_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        checkin.user_id,
        checkin.task_id || null,
        checkin.date,
        checkin.note || '',
        checkin.image || null,
        checkin.mood || null,
        checkin.published || 0,
        checkin.bottle_id || null
    );
    return db.prepare('SELECT * FROM checkins WHERE id = ?').get(result.lastInsertRowid); // 返回创建的记录
}

/**
 * 根据用户 ID 获取打卡记录
 * @param {number} userId 用户 ID
 * @param {number} limit 限制条数
 * @returns {Array} 打卡记录列表
 */
function getCheckinsByUserId(userId, limit = 100) {
    return db.prepare('SELECT * FROM checkins WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit); // 查询并返回
}

/**
 * 根据日期获取打卡记录
 * @param {number} userId 用户 ID
 * @param {string} date 日期 YYYY-MM-DD
 * @returns {Array} 打卡记录列表
 */
function getCheckinsByDate(userId, date) {
    return db.prepare('SELECT * FROM checkins WHERE user_id = ? AND date = ? ORDER BY created_at DESC').all(userId, date); // 查询并返回
}

/**
 * 获取打卡历史记录
 * @param {number} userId 用户 ID
 * @param {number} days 最近天数
 * @returns {Array} 打卡历史列表
 */
function getCheckinHistory(userId, days = 30) {
    // 查询最近若干天打卡记录
    return db.prepare(`
        SELECT * FROM checkins 
        WHERE user_id = ? 
        AND date >= date('now', ?) 
        ORDER BY date DESC, created_at DESC
    `).all(userId, `-${days} days`);
}

/**
 * 获取打卡连续天数
 * @param {number} userId 用户 ID
 * @returns {number} 连续打卡天数
 */
function getCheckinStreak(userId) {
    const rows = // 获取所有打卡日期去重
    db.prepare(`
        SELECT DISTINCT date FROM checkins WHERE user_id = ? ORDER BY date DESC
    `).all(userId);
    if (rows.length === 0) return 0; // 没有打卡记录

    let streak = 0; // 连续天数
    let current = new Date(); // 当前日期
    for (const row of rows) { // 遍历打卡日期
        const checkinDate = new Date(row.date); // 打卡日期
        const diffDays = Math.floor((new Date(current.toDateString()) - new Date(checkinDate.toDateString())) / (1000 * 60 * 60 * 24)); // 计算差值
        if (diffDays === 0 || diffDays === streak) { // 是连续的
            if (diffDays === 0) { // 第一次匹配当天
                streak = 1; // 从1开始
                current = checkinDate; // 更新当前
            } else { // 后续连续
                streak += 1; // 增加
                current = checkinDate; // 更新当前
            }
        } else { // 不连续
            break; // 结束
        }
    }
    return streak; // 返回连续天数
}

// ==================== 漂流瓶 bottles CRUD ====================

/**
 * 创建漂流瓶
 * @param {object} bottle 漂流瓶对象
 * @returns {object} 创建的漂流瓶
 */
function createBottle(bottle) {
    const stmt = // 插入漂流瓶预处理语句
    db.prepare(`
        INSERT INTO bottles (user_id, author_name, author_avatar, content, image, mood, tag)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        bottle.user_id,
        bottle.author_name || null,
        bottle.author_avatar || null,
        bottle.content,
        bottle.image || null,
        bottle.mood || null,
        bottle.tag || null
    );
    return getBottleById(result.lastInsertRowid); // 返回创建的漂流瓶
}

/**
 * 获取漂流瓶列表（分页）
 * @param {number} page 页码
 * @param {number} pageSize 每页数量
 * @returns {object} { list, total } 漂流瓶列表和总数
 */
function getBottles(page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize; // 计算偏移量
    const list = // 查询漂流瓶列表
    db.prepare(`
        SELECT * FROM bottles WHERE status = 'normal' 
        ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(pageSize, offset);
    const total = db.prepare("SELECT COUNT(*) as count FROM bottles WHERE status = 'normal'").get().count; // 总数
    return { list, total }; // 返回列表和总数
}

/**
 * 根据 ID 获取漂流瓶
 * @param {number} id 漂流瓶 ID
 * @returns {object|undefined} 漂流瓶对象
 */
function getBottleById(id) {
    return db.prepare('SELECT * FROM bottles WHERE id = ?').get(id); // 查询并返回
}

/**
 * 根据用户 ID 获取漂流瓶列表
 * @param {number} userId 用户 ID
 * @returns {Array} 漂流瓶列表
 */
function getBottlesByUserId(userId) {
    return db.prepare('SELECT * FROM bottles WHERE user_id = ? ORDER BY created_at DESC').all(userId); // 查询并返回
}

/**
 * 移除漂流瓶（设置状态为 removed）
 * @param {number} id 漂流瓶 ID
 * @returns {boolean} 是否成功
 */
function removeBottle(id) {
    const result = db.prepare("UPDATE bottles SET status = 'removed' WHERE id = ?").run(id); // 更新状态
    return result.changes > 0; // 返回是否成功
}

/**
 * 点赞数 +1
 * @param {number} bottleId 漂流瓶 ID
 * @returns {boolean} 是否成功
 */
function incrementBottleLikes(bottleId) {
    const result = db.prepare('UPDATE bottles SET likes_count = likes_count + 1 WHERE id = ?').run(bottleId); // 加1
    return result.changes > 0; // 返回是否成功
}

/**
 * 点赞数 -1（不低于0）
 * @param {number} bottleId 漂流瓶 ID
 * @returns {boolean} 是否成功
 */
function decrementBottleLikes(bottleId) {
    const result = db.prepare('UPDATE bottles SET likes_count = MAX(likes_count - 1, 0) WHERE id = ?').run(bottleId); // 减1不小于0
    return result.changes > 0; // 返回是否成功
}

// ==================== 漂流瓶点赞 bottle_likes CRUD ====================

/**
 * 切换点赞状态（已赞则取消，未赞则点赞）
 * @param {number} bottleId 漂流瓶 ID
 * @param {number} userId 用户 ID
 * @returns {boolean} 是否点赞（true=已点赞，false=已取消）
 */
function toggleLike(bottleId, userId) {
    const existing = db.prepare('SELECT id FROM bottle_likes WHERE bottle_id = ? AND user_id = ?').get(bottleId, userId); // 查询是否已点赞
    if (existing) { // 已点赞，取消
        db.prepare('DELETE FROM bottle_likes WHERE id = ?').run(existing.id); // 删除记录
        decrementBottleLikes(bottleId); // 点赞数 -1
        return false; // 返回已取消
    } else { // 未点赞
        db.prepare('INSERT INTO bottle_likes (bottle_id, user_id) VALUES (?, ?)').run(bottleId, userId); // 插入记录
        incrementBottleLikes(bottleId); // 点赞数 +1
        return true; // 返回已点赞
    }
}

/**
 * 判断用户是否已点赞
 * @param {number} bottleId 漂流瓶 ID
 * @param {number} userId 用户 ID
 * @returns {boolean} 是否已点赞
 */
function isLiked(bottleId, userId) {
    const row = db.prepare('SELECT id FROM bottle_likes WHERE bottle_id = ? AND user_id = ?').get(bottleId, userId); // 查询
    return !!row; // 返回是否存在
}

/**
 * 获取漂流瓶的点赞列表
 * @param {number} bottleId 漂流瓶 ID
 * @returns {Array} 点赞列表
 */
function getLikesByBottleId(bottleId) {
    return db.prepare('SELECT * FROM bottle_likes WHERE bottle_id = ? ORDER BY created_at DESC').all(bottleId); // 查询并返回
}

// ==================== 漂流瓶评论 bottle_comments CRUD ====================

/**
 * 创建评论
 * @param {object} comment 评论对象
 * @returns {object} 创建的评论
 */
function createComment(comment) {
    const stmt = // 插入评论预处理语句
    db.prepare(`
        INSERT INTO bottle_comments (bottle_id, user_id, user_name, user_avatar, content)
        VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        comment.bottle_id,
        comment.user_id,
        comment.user_name || null,
        comment.user_avatar || null,
        comment.content
    );
    // 评论数 +1
    db.prepare('UPDATE bottles SET comments_count = comments_count + 1 WHERE id = ?').run(comment.bottle_id); // 更新评论数
    return db.prepare('SELECT * FROM bottle_comments WHERE id = ?').get(result.lastInsertRowid); // 返回创建的评论
}

/**
 * 根据漂流瓶 ID 获取评论列表
 * @param {number} bottleId 漂流瓶 ID
 * @returns {Array} 评论列表
 */
function getCommentsByBottleId(bottleId) {
    return db.prepare('SELECT * FROM bottle_comments WHERE bottle_id = ? ORDER BY created_at ASC').all(bottleId); // 查询并返回
}

// ==================== 挑战 challenges CRUD ====================

/**
 * 创建挑战
 * @param {object} challenge 挑战对象
 * @returns {object} 创建的挑战
 */
function createChallenge(challenge) {
    const stmt = // 插入挑战预处理语句
    db.prepare(`
        INSERT INTO challenges (title, description, duration_days, category, icon, color, difficulty, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        challenge.title,
        challenge.description || '',
        challenge.duration_days || 21,
        challenge.category || '生活',
        challenge.icon || 'Trophy',
        challenge.color || '#4CAF50',
        challenge.difficulty || 'normal',
        challenge.status || 'ongoing'
    );
    return getChallengeById(result.lastInsertRowid); // 返回创建的挑战
}

/**
 * 获取所有挑战
 * @returns {Array} 挑战列表
 */
function getChallenges() {
    return db.prepare('SELECT * FROM challenges ORDER BY created_at DESC').all(); // 查询并返回
}

/**
 * 根据 ID 获取挑战
 * @param {number} id 挑战 ID
 * @returns {object|undefined} 挑战对象
 */
function getChallengeById(id) {
    return db.prepare('SELECT * FROM challenges WHERE id = ?').get(id); // 查询并返回
}

/**
 * 获取进行中的挑战
 * @returns {Array} 挑战列表
 */
function getOngoingChallenges() {
    return db.prepare("SELECT * FROM challenges WHERE status = 'ongoing' ORDER BY created_at DESC").all(); // 查询并返回
}

/**
 * 挑战参与人数 +1
 * @param {number} challengeId 挑战 ID
 * @returns {boolean} 是否成功
 */
function incrementParticipants(challengeId) {
    const result = db.prepare('UPDATE challenges SET participants_count = participants_count + 1 WHERE id = ?').run(challengeId); // 加1
    return result.changes > 0; // 返回是否成功
}

// ==================== 挑战参与者 challenge_participants CRUD ====================

/**
 * 加入挑战
 * @param {number} challengeId 挑战 ID
 * @param {number} userId 用户 ID
 * @returns {object} 参与记录
 */
function joinChallenge(challengeId, userId) {
    const existing = getParticipant(challengeId, userId); // 查询已有参与记录
    if (existing) { // 已存在参与记录
        if (existing.status === 'in_progress') { // 进行中，无需重复加入
            return existing; // 直接返回
        }
        // 已完成或已失败，允许重新参与：重置记录，开始时间为当天
        db.prepare(`
            UPDATE challenge_participants
            SET progress = 0, current_day = 1, joined_at = CURRENT_TIMESTAMP,
                completed_at = NULL, last_checkin_date = NULL, status = 'in_progress'
            WHERE id = ?
        `).run(existing.id); // 重置参与记录
        return getParticipant(challengeId, userId); // 返回重置后的记录
    }
    // 无记录，新建
    db.prepare(`
        INSERT INTO challenge_participants (challenge_id, user_id, status)
        VALUES (?, ?, 'in_progress')
    `).run(challengeId, userId); // 插入新记录
    incrementParticipants(challengeId); // 参与人数 +1
    return getParticipant(challengeId, userId); // 返回参与记录
}

/**
 * 获取参与者记录
 * @param {number} challengeId 挑战 ID
 * @param {number} userId 用户 ID
 * @returns {object|undefined} 参与记录
 */
function getParticipant(challengeId, userId) {
    return db.prepare('SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ?').get(challengeId, userId); // 查询并返回
}

/**
 * 根据挑战 ID 获取参与者列表
 * @param {number} challengeId 挑战 ID
 * @returns {Array} 参与者列表
 */
function getParticipantsByChallengeId(challengeId) {
    return db.prepare('SELECT * FROM challenge_participants WHERE challenge_id = ? ORDER BY joined_at DESC').all(challengeId); // 查询并返回
}

/**
 * 根据用户 ID 获取已加入的挑战列表（带打卡天数和今日打卡状态）
 * @param {number} userId 用户 ID
 * @returns {Array} 参与记录列表
 */
function getChallengesByUserId(userId) {
    const today = new Date().toISOString().slice(0, 10); // 今日日期 YYYY-MM-DD
    // 先检测并更新失败的挑战（漏打卡）
    checkAndUpdateFailedChallenges(userId);
    // 联表查询用户参与的挑战，打卡次数按当前参与记录（joined_at 之后）计算
    return db.prepare(`
        SELECT cp.*,
               c.title, c.description, c.duration_days, c.category, c.icon, c.color, c.difficulty, c.status AS challenge_status,
               (SELECT COUNT(*) FROM challenge_checkins cc
                WHERE cc.challenge_id = cp.challenge_id AND cc.user_id = cp.user_id
                AND date(cc.checkin_at) >= date(cp.joined_at)) AS checkin_count,
               (SELECT 1 FROM challenge_checkins cc WHERE cc.challenge_id = cp.challenge_id AND cc.user_id = cp.user_id AND date(cc.checkin_at) = ? LIMIT 1) AS checked_in_today
        FROM challenge_participants cp
        JOIN challenges c ON cp.challenge_id = c.id
        WHERE cp.user_id = ?
        ORDER BY cp.joined_at DESC
    `).all(today, userId);
}

/**
 * 更新参与者进度
 * @param {number} challengeId 挑战 ID
 * @param {number} userId 用户 ID
 * @param {number} progress 进度 0-100
 * @param {number} currentDay 当前天数
 * @param {string} lastCheckinDate 最近打卡日期
 * @returns {boolean} 是否成功
 */
function updateParticipantProgress(challengeId, userId, progress, currentDay, lastCheckinDate) {
    const challenge = getChallengeById(challengeId); // 获取挑战
    const completedAt = challenge && progress >= 100 ? new Date().toISOString() : null; // 进度100%则标记完成时间
    const status = progress >= 100 ? 'success' : 'in_progress'; // 状态：完成或进行中
    const result = // 更新进度
    db.prepare(`
        UPDATE challenge_participants
        SET progress = ?, current_day = ?, last_checkin_date = ?, completed_at = COALESCE(?, completed_at), status = ?
        WHERE challenge_id = ? AND user_id = ?
    `).run(progress, currentDay, lastCheckinDate, completedAt, status, challengeId, userId);
    return result.changes > 0; // 返回是否成功
}

/**
 * 获取挑战排行榜（按打卡次数降序，Top 10）
 * @param {number} challengeId 挑战 ID
 * @param {number} limit 限制条数，默认 10
 * @returns {Array} 排行榜列表
 */
function getChallengeRanking(challengeId, limit = 10) {
    // 按打卡次数降序排名（每个用户对该挑战的打卡总次数）
    return db.prepare(`
        SELECT cc.user_id,
               u.username, u.nickname, u.avatar,
               COUNT(cc.id) AS checkin_count,
               MAX(cc.checkin_at) AS last_checkin_at
        FROM challenge_checkins cc
        JOIN users u ON cc.user_id = u.id
        WHERE cc.challenge_id = ?
        GROUP BY cc.user_id
        ORDER BY checkin_count DESC, last_checkin_at ASC
        LIMIT ?
    `).all(challengeId, limit);
}

// ==================== 挑战打卡 challenge_checkins CRUD ====================

/**
 * 检查用户今日是否已对该挑战打卡
 * @param {number} userId 用户 ID
 * @param {number} challengeId 挑战 ID
 * @returns {boolean} 是否已打卡
 */
function hasCheckedInChallengeToday(userId, challengeId) {
    const today = new Date().toISOString().slice(0, 10); // 今日日期
    const row = db.prepare(`
        SELECT 1 FROM challenge_checkins
        WHERE user_id = ? AND challenge_id = ? AND date(checkin_at) = ?
        LIMIT 1
    `).get(userId, challengeId, today); // 查询
    return !!row; // 返回是否已打卡
}

/**
 * 获取用户对某挑战的打卡次数
 * @param {number} userId 用户 ID
 * @param {number} challengeId 挑战 ID
 * @returns {number} 打卡次数
 */
function getChallengeCheckinCount(userId, challengeId) {
    const row = db.prepare(`
        SELECT COUNT(*) AS cnt FROM challenge_checkins
        WHERE user_id = ? AND challenge_id = ?
    `).get(userId, challengeId); // 查询计数
    return row ? row.cnt : 0; // 返回次数
}

/**
 * 获取用户对某挑战的打卡记录列表
 * @param {number} userId 用户 ID
 * @param {number} challengeId 挑战 ID
 * @returns {Array} 打卡记录列表
 */
function getChallengeCheckinRecords(userId, challengeId) {
    return db.prepare(`
        SELECT * FROM challenge_checkins
        WHERE user_id = ? AND challenge_id = ?
        ORDER BY checkin_at ASC
    `).all(userId, challengeId); // 查询并返回
}

/**
 * 挑战打卡（核心函数：插入打卡记录、更新进度、自动发送营友动态）
 * @param {number} userId 用户 ID
 * @param {number} challengeId 挑战 ID
 * @returns {object} 打卡结果
 */
function checkinChallenge(userId, challengeId) {
    // 1. 校验是否已加入
    const participant = getParticipant(challengeId, userId); // 查询参与记录
    if (!participant) {
        return { success: false, message: '尚未加入该挑战' }; // 未加入
    }
    // 2. 校验挑战状态（已完成或失败的需重新参加）
    if (participant.status === 'success') {
        return { success: false, message: '挑战已完成，请重新参加' }; // 已完成
    }
    if (participant.status === 'failed') {
        return { success: false, message: '挑战已失败，请重新参加' }; // 已失败
    }
    // 3. 校验今日是否已打卡
    if (hasCheckedInChallengeToday(userId, challengeId)) {
        return { success: false, message: '今日已打卡' }; // 当日重复
    }
    const challenge = getChallengeById(challengeId); // 获取挑战
    if (!challenge) {
        return { success: false, message: '挑战不存在' }; // 挑战不存在
    }
    // 4. 计算新的天数（按当前参与记录 joined_at 之后的打卡次数 + 1）
    const currentCountRow = db.prepare(`
        SELECT COUNT(*) AS cnt FROM challenge_checkins
        WHERE user_id = ? AND challenge_id = ? AND date(checkin_at) >= date(?)
    `).get(userId, challengeId, participant.joined_at); // 查询当前参与记录的打卡次数
    const currentCount = currentCountRow ? currentCountRow.cnt : 0; // 当前次数
    const newDay = currentCount + 1; // 新天数
    const progress = Math.min(Math.round((newDay / challenge.duration_days) * 100), 100); // 进度百分比
    const today = new Date().toISOString().slice(0, 10); // 今日日期
    // 5. 插入打卡记录
    db.prepare(`
        INSERT INTO challenge_checkins (user_id, challenge_id, day_no)
        VALUES (?, ?, ?)
    `).run(userId, challengeId, newDay); // 插入记录
    // 6. 更新参与者进度和状态
    updateParticipantProgress(challengeId, userId, progress, newDay, today); // 更新进度
    // 7. 自动发送营友动态
    const content = '第' + newDay + '天完成了「' + challenge.title + '」挑战打卡！'; // 动态内容
    createChallengeMoment(userId, challengeId, content); // 发送动态
    // 8. 返回结果
    return {
        success: true,
        message: '打卡成功',
        data: {
            day_no: newDay, // 当前天数
            progress: progress, // 进度
            completed: progress >= 100, // 是否完成整个挑战
            challenge_title: challenge.title // 挑战标题
        }
    };
}

/**
 * 获取挑战详情（含用户参与状态和打卡信息）
 * @param {number} challengeId 挑战 ID
 * @param {number} userId 用户 ID
 * @returns {object} 挑战详情对象
 */
function getChallengeDetail(challengeId, userId) {
    const challenge = getChallengeById(challengeId); // 获取挑战
    if (!challenge) return null; // 不存在
    // 先检测并更新失败的挑战（漏打卡）
    if (userId) checkAndUpdateFailedChallenges(userId);
    const result = { ...challenge }; // 复制挑战信息
    if (userId) { // 如果传了用户 ID
        const participant = getParticipant(challengeId, userId); // 查询参与记录
        result.joined = !!participant && participant.status === 'in_progress'; // 是否已加入且进行中
        result.participant = participant || null; // 参与记录
        // 打卡次数按当前参与记录（joined_at 之后）计算
        if (participant) {
            const row = db.prepare(`
                SELECT COUNT(*) AS cnt FROM challenge_checkins
                WHERE user_id = ? AND challenge_id = ? AND date(checkin_at) >= date(?)
            `).get(userId, challengeId, participant.joined_at); // 查询当前打卡次数
            result.checkin_count = row ? row.cnt : 0; // 设置打卡次数
        } else {
            result.checkin_count = 0; // 无参与记录
        }
        result.checked_in_today = hasCheckedInChallengeToday(userId, challengeId); // 今日是否打卡
    } else {
        result.joined = false; // 未加入
        result.participant = null; // 无参与记录
        result.checkin_count = 0; // 打卡次数 0
        result.checked_in_today = false; // 今日未打卡
    }
    return result; // 返回详情
}

/**
 * 获取用户往期挑战（status = 'success' 或 'failed'）
 * @param {number} userId 用户 ID
 * @returns {Array} 往期挑战列表
 */
function getCompletedChallengesByUserId(userId) {
    // 先检测并更新失败的挑战（漏打卡）
    checkAndUpdateFailedChallenges(userId);
    // 查询所有已完成或已失败的挑战（不含进行中）
    return db.prepare(`
        SELECT cp.*,
               c.title, c.description, c.duration_days, c.category, c.icon, c.color, c.difficulty, c.status AS challenge_status,
               (SELECT COUNT(*) FROM challenge_checkins cc WHERE cc.challenge_id = cp.challenge_id AND cc.user_id = cp.user_id AND date(cc.checkin_at) >= date(cp.joined_at)) AS checkin_count
        FROM challenge_participants cp
        JOIN challenges c ON cp.challenge_id = c.id
        WHERE cp.user_id = ? AND cp.status IN ('success', 'failed')
        ORDER BY cp.completed_at DESC, cp.joined_at DESC
    `).all(userId); // 查询往期挑战
}

/**
 * 获取用户挑战统计（成功次数和失败次数）
 * @param {number} userId 用户 ID
 * @returns {object} { success_count, failed_count }
 */
function getChallengeStatsByUserId(userId) {
    // 先检测并更新失败的挑战
    checkAndUpdateFailedChallenges(userId);
    const row = db.prepare(`
        SELECT
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS success_count,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed_count
        FROM challenge_participants
        WHERE user_id = ? AND status IN ('success', 'failed')
    `).get(userId); // 查询统计
    return {
        success_count: row && row.success_count ? row.success_count : 0, // 成功次数
        failed_count: row && row.failed_count ? row.failed_count : 0 // 失败次数
    };
}

/**
 * 检测并更新失败的挑战（漏打卡则失败）
 * 规则：如果 joined_at 在今天之前，且 last_checkin_date 为空或早于昨天，则标记为失败
 * @param {number} userId 用户 ID
 */
function checkAndUpdateFailedChallenges(userId) {
    const today = new Date().toISOString().slice(0, 10); // 今日日期 YYYY-MM-DD
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10); // 昨天日期
    // 查询所有进行中的挑战
    const inProgress = db.prepare(`
        SELECT * FROM challenge_participants
        WHERE user_id = ? AND status = 'in_progress'
    `).all(userId); // 查询进行中挑战
    inProgress.forEach(function(p) {
        const joinedDate = p.joined_at ? p.joined_at.slice(0, 10) : today; // 参与日期
        let shouldFail = false; // 是否应标记失败
        if (joinedDate < today) { // 参与日期在今天之前
            if (!p.last_checkin_date) { // 从未打卡
                shouldFail = true; // 标记失败
            } else if (p.last_checkin_date < yesterday) { // 最后打卡日期早于昨天（漏打卡）
                shouldFail = true; // 标记失败
            }
        }
        if (shouldFail) { // 需要标记失败
            db.prepare(`
                UPDATE challenge_participants
                SET status = 'failed', completed_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(p.id); // 更新状态为失败
        }
    });
}

// ==================== 挑战营友动态 challenge_moments CRUD ====================

/**
 * 创建挑战营友动态
 * @param {number} userId 用户 ID
 * @param {number} challengeId 挑战 ID
 * @param {string} content 动态内容
 * @returns {object} 创建的动态
 */
function createChallengeMoment(userId, challengeId, content) {
    const result = db.prepare(`
        INSERT INTO challenge_moments (user_id, challenge_id, content)
        VALUES (?, ?, ?)
    `).run(userId, challengeId, content); // 插入动态
    return db.prepare('SELECT * FROM challenge_moments WHERE id = ?').get(result.lastInsertRowid); // 返回动态
}

/**
 * 获取挑战营友动态列表（含用户信息、点赞数、当前用户是否点赞）
 * @param {number} limit 限制条数
 * @param {number} offset 偏移量
 * @param {number} currentUserId 当前用户 ID（可选，用于判断是否已点赞）
 * @param {number} challengeId 挑战 ID（可选，筛选特定挑战的动态）
 * @returns {Array} 动态列表
 */
function getChallengeMoments(limit = 20, offset = 0, currentUserId, challengeId) {
    let sql = `
        SELECT cm.*,
               u.username, u.nickname, u.avatar,
               c.title AS challenge_title, c.icon AS challenge_icon, c.color AS challenge_color,
               (SELECT COUNT(*) FROM challenge_moment_likes cml WHERE cml.moment_id = cm.id) AS like_count
    `;
    if (currentUserId) {
        sql += `, (SELECT 1 FROM challenge_moment_likes cml WHERE cml.moment_id = cm.id AND cml.user_id = ? LIMIT 1) AS liked`;
    } else {
        sql += `, 0 AS liked`;
    }
    sql += ` FROM challenge_moments cm
             JOIN users u ON cm.user_id = u.id
             JOIN challenges c ON cm.challenge_id = c.id`;
    const params = [];
    if (currentUserId) params.push(currentUserId); // 当前用户 ID
    if (challengeId) {
        sql += ` WHERE cm.challenge_id = ?`; // 筛选挑战
        params.push(challengeId);
    }
    sql += ` ORDER BY cm.created_at DESC LIMIT ? OFFSET ?`; // 按时间倒序
    params.push(limit, offset);
    return db.prepare(sql).all(...params); // 查询并返回
}

/**
 * 切换挑战动态点赞状态（点赞/取消点赞）
 * @param {number} userId 用户 ID
 * @param {number} momentId 动态 ID
 * @returns {object} { liked, likeCount }
 */
function toggleChallengeMomentLike(userId, momentId) {
    // 检查是否已点赞
    const existing = db.prepare('SELECT 1 FROM challenge_moment_likes WHERE moment_id = ? AND user_id = ?').get(momentId, userId); // 查询
    if (existing) {
        // 已点赞，取消
        db.prepare('DELETE FROM challenge_moment_likes WHERE moment_id = ? AND user_id = ?').run(momentId, userId); // 删除
    } else {
        // 未点赞，添加
        db.prepare('INSERT INTO challenge_moment_likes (moment_id, user_id) VALUES (?, ?)').run(momentId, userId); // 插入
    }
    // 查询最新点赞数
    const row = db.prepare('SELECT COUNT(*) AS cnt FROM challenge_moment_likes WHERE moment_id = ?').get(momentId); // 计数
    return { liked: !existing, likeCount: row ? row.cnt : 0 }; // 返回状态
}

// ==================== 时间胶囊 capsules CRUD ====================

/**
 * 创建时间胶囊
 * @param {object} capsule 胶囊对象
 * @returns {object} 创建的胶囊
 */
function createCapsule(capsule) {
    const stmt = // 插入胶囊预处理语句
    db.prepare(`
        INSERT INTO capsules (user_id, title, content, voice_note, open_date)
        VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        capsule.user_id,
        capsule.title,
        capsule.content || '',
        capsule.voice_note || null,
        capsule.open_date
    );
    return getCapsuleById(result.lastInsertRowid); // 返回创建的胶囊
}

/**
 * 根据用户 ID 获取胶囊列表
 * @param {number} userId 用户 ID
 * @returns {Array} 胶囊列表
 */
function getCapsulesByUserId(userId) {
    return db.prepare('SELECT * FROM capsules WHERE user_id = ? ORDER BY open_date ASC, created_at DESC').all(userId); // 查询并返回
}

/**
 * 根据 ID 获取胶囊
 * @param {number} id 胶囊 ID
 * @returns {object|undefined} 胶囊对象
 */
function getCapsuleById(id) {
    return db.prepare('SELECT * FROM capsules WHERE id = ?').get(id); // 查询并返回
}

/**
 * 开启胶囊
 * @param {number} id 胶囊 ID
 * @returns {object|undefined} 更新后的胶囊
 */
function openCapsule(id) {
    db.prepare("UPDATE capsules SET status = 'opened', opened_at = CURRENT_TIMESTAMP WHERE id = ?").run(id); // 更新状态
    return getCapsuleById(id); // 返回更新后的胶囊
}

/**
 * 获取可开启的胶囊（开启日期已到且未开启）
 * @param {number} userId 用户 ID
 * @returns {Array} 胶囊列表
 */
function getOpenableCapsules(userId) {
    // 查询可开启的胶囊
    return db.prepare(`
        SELECT * FROM capsules
        WHERE user_id = ? AND status = 'sealed' AND open_date <= date('now')
        ORDER BY open_date ASC
    `).all(userId);
}

/**
 * 删除时间胶囊（仅允许创建者删除自己的胶囊）
 * @param {number} id 胶囊 ID
 * @param {number} userId 当前用户 ID（用于权限校验）
 * @returns {object} 删除结果 { success: boolean, deleted: number }
 */
function deleteCapsule(id, userId) {
    // 先校验胶囊归属权，确保用户只能删除自己的胶囊
    const capsule = db.prepare('SELECT id, user_id FROM capsules WHERE id = ?').get(id); // 查询胶囊
    if (!capsule) {
        return { success: false, deleted: 0, error: '胶囊不存在' }; // 胶囊不存在
    }
    if (capsule.user_id !== userId) {
        return { success: false, deleted: 0, error: '无权删除该胶囊' }; // 无权删除
    }
    const result = db.prepare('DELETE FROM capsules WHERE id = ? AND user_id = ?').run(id, userId); // 执行删除
    return { success: result.changes > 0, deleted: result.changes }; // 返回删除结果
}

// ==================== 消息 messages CRUD ====================

/**
 * 创建消息
 * @param {object} message 消息对象
 * @returns {object} 创建的消息
 */
function createMessage(message) {
    const stmt = // 插入消息预处理语句
    db.prepare(`
        INSERT INTO messages (user_id, type, title, content, sender_name, sender_avatar, icon, image, link)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        message.user_id,
        message.type || 'system',
        message.title || null,
        message.content || null,
        message.sender_name || null,
        message.sender_avatar || null,
        message.icon || null,
        message.image || null,
        message.link || null
    );
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid); // 返回创建的消息
}

/**
 * 根据用户 ID 获取消息列表
 * @param {number} userId 用户 ID
 * @param {number} limit 限制条数
 * @returns {Array} 消息列表
 */
function getMessagesByUserId(userId, limit = 100) {
    return db.prepare('SELECT * FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit); // 查询并返回
}

/**
 * 标记消息为已读
 * @param {number} id 消息 ID
 * @returns {boolean} 是否成功
 */
function markMessageRead(id) {
    const result = db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(id); // 更新状态
    return result.changes > 0; // 返回是否成功
}

/**
 * 标记用户所有消息为已读
 * @param {number} userId 用户 ID
 * @returns {boolean} 是否成功
 */
function markAllRead(userId) {
    const result = db.prepare('UPDATE messages SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId); // 批量更新
    return result.changes > 0; // 返回是否成功
}

/**
 * 获取未读消息数量
 * @param {number} userId 用户 ID
 * @returns {number} 未读数量
 */
function getUnreadCount(userId) {
    return db.prepare('SELECT COUNT(*) as count FROM messages WHERE user_id = ? AND is_read = 0').get(userId).count; // 查询并返回
}

/**
 * 根据消息类型获取消息
 * @param {number} userId 用户 ID
 * @param {string} type 消息类型
 * @returns {Array} 消息列表
 */
function getMessagesByType(userId, type) {
    return db.prepare('SELECT * FROM messages WHERE user_id = ? AND type = ? ORDER BY created_at DESC').all(userId, type); // 查询并返回
}

// ==================== 徽章 badges CRUD ====================

/**
 * 创建徽章
 * @param {object} badge 徽章对象
 * @returns {object} 创建的徽章
 */
function createBadge(badge) {
    const stmt = // 插入徽章预处理语句
    db.prepare(`
        INSERT INTO badges (name, description, icon, color, condition_type, condition_value)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        badge.name,
        badge.description || '',
        badge.icon || 'Award',
        badge.color || '#FFD700',
        badge.condition_type || null,
        badge.condition_value || null
    );
    return getBadgeById(result.lastInsertRowid); // 返回创建的徽章
}

/**
 * 获取所有徽章
 * @returns {Array} 徽章列表
 */
function getBadges() {
    return db.prepare('SELECT * FROM badges ORDER BY created_at ASC').all(); // 查询并返回
}

/**
 * 根据 ID 获取徽章
 * @param {number} id 徽章 ID
 * @returns {object|undefined} 徽章对象
 */
function getBadgeById(id) {
    return db.prepare('SELECT * FROM badges WHERE id = ?').get(id); // 查询并返回
}

// ==================== 用户徽章 user_badges CRUD ====================

/**
 * 授予用户徽章
 * @param {number} userId 用户 ID
 * @param {number} badgeId 徽章 ID
 * @returns {object|null} 授予记录（已拥有则返回 null）
 */
function awardBadge(userId, badgeId) {
    if (hasBadge(userId, badgeId)) return null; // 已拥有则返回 null
    const stmt = // 插入用户徽章预处理语句
    db.prepare(`
        INSERT INTO user_badges (user_id, badge_id)
        VALUES (?, ?)
    `);
    stmt.run(userId, badgeId); // 执行插入
    return db.prepare('SELECT * FROM user_badges WHERE user_id = ? AND badge_id = ?').get(userId, badgeId); // 返回授予记录
}

/**
 * 获取用户拥有的徽章列表
 * @param {number} userId 用户 ID
 * @returns {Array} 徽章列表
 */
function getUserBadges(userId) {
    // 联表查询用户徽章（含 image 和 category 字段）
    return db.prepare(`
        SELECT ub.*, b.name, b.description, b.icon, b.color, b.condition_type, b.condition_value, b.image, b.category
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?
        ORDER BY ub.earned_at DESC
    `).all(userId);
}

/**
 * 判断用户是否拥有徽章
 * @param {number} userId 用户 ID
 * @param {number} badgeId 徽章 ID
 * @returns {boolean} 是否拥有
 */
function hasBadge(userId, badgeId) {
    const row = db.prepare('SELECT id FROM user_badges WHERE user_id = ? AND badge_id = ?').get(userId, badgeId); // 查询
    return !!row; // 返回是否存在
}

// ==================== 专注记录 focus_sessions CRUD ====================

/**
 * 创建专注记录
 * @param {object} session 专注记录对象
 * @returns {object} 创建的记录
 */
function createFocusSession(session) {
    const stmt = // 插入专注记录预处理语句
    db.prepare(`
        INSERT INTO focus_sessions (user_id, duration_minutes, task_name, completed)
        VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run( // 执行插入
        session.user_id,
        session.duration_minutes,
        session.task_name || null,
        session.completed || 0
    );
    return db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(result.lastInsertRowid); // 返回创建的记录
}

/**
 * 根据用户 ID 获取专注记录
 * @param {number} userId 用户 ID
 * @param {number} limit 限制条数
 * @returns {Array} 专注记录列表
 */
function getFocusSessionsByUserId(userId, limit = 100) {
    return db.prepare('SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?').all(userId, limit); // 查询并返回
}

/**
 * 获取专注统计（总时长、总次数、完成次数）
 * @param {number} userId 用户 ID
 * @returns {object} 统计结果
 */
function getFocusStats(userId) {
    // 查询专注统计
    return db.prepare(`
        SELECT 
            COUNT(*) as total_sessions,
            COALESCE(SUM(duration_minutes), 0) as total_minutes,
            COALESCE(SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END), 0) as completed_sessions
        FROM focus_sessions 
        WHERE user_id = ?
    `).get(userId);
}

// ==================== 周统计 weekly_stats CRUD ====================

/**
 * 创建或更新周统计
 * @param {object} stats 统计对象
 * @returns {object} 统计记录
 */
function createOrUpdateWeeklyStats(stats) {
    const stmt = // 插入或更新预处理语句
    db.prepare(`
        INSERT INTO weekly_stats (user_id, week_start, total_checkins, total_tasks, total_focus_minutes, total_bottles)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, week_start) DO UPDATE SET
            total_checkins = excluded.total_checkins,
            total_tasks = excluded.total_tasks,
            total_focus_minutes = excluded.total_focus_minutes,
            total_bottles = excluded.total_bottles
    `);
    stmt.run( // 执行插入或更新
        stats.user_id,
        stats.week_start,
        stats.total_checkins || 0,
        stats.total_tasks || 0,
        stats.total_focus_minutes || 0,
        stats.total_bottles || 0
    );
    return db.prepare('SELECT * FROM weekly_stats WHERE user_id = ? AND week_start = ?').get(stats.user_id, stats.week_start); // 返回统计记录
}

/**
 * 获取用户周统计
 * @param {number} userId 用户 ID
 * @param {number} weeks 最近周数
 * @returns {Array} 周统计列表
 */
function getWeeklyStats(userId, weeks = 8) {
    // 查询最近若干周的统计
    return db.prepare(`
        SELECT * FROM weekly_stats 
        WHERE user_id = ? 
        ORDER BY week_start DESC 
        LIMIT ?
    `).all(userId, weeks);
}

// ==================== 每日任务统计 daily_task_stats CRUD ====================

/**
 * 更新每日任务统计（根据实际任务表重新计算）
 * @param {number} userId 用户 ID
 * @param {string} date 日期 YYYY-MM-DD
 * @returns {object} 统计记录
 */
function updateDailyTaskStats(userId, date) {
    // 统计该日任务总数和已完成数（排除已取消和已删除）
    const stats = db.prepare(`
        SELECT
            COUNT(*) as total_tasks,
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as completed_tasks
        FROM tasks
        WHERE user_id = ? AND task_date = ?
        AND is_cancelled = 0 AND is_deleted = 0
    `).get(userId, date);
    // 统计该日发布的漂流瓶数（从 bottles 表按 created_at 日期统计）
    const bottleStats = db.prepare(`
        SELECT COUNT(*) as published_bottles FROM bottles
        WHERE user_id = ? AND DATE(created_at) = ?
    `).get(userId, date);
    // 插入或更新统计记录（UPSERT）
    db.prepare(`
        INSERT INTO daily_task_stats (user_id, task_date, total_tasks, completed_tasks, published_bottles, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, task_date) DO UPDATE SET
            total_tasks = excluded.total_tasks,
            completed_tasks = excluded.completed_tasks,
            published_bottles = excluded.published_bottles,
            updated_at = CURRENT_TIMESTAMP
    `).run(
        userId,
        date,
        stats.total_tasks || 0,
        stats.completed_tasks || 0,
        bottleStats.published_bottles || 0
    );
    return db.prepare('SELECT * FROM daily_task_stats WHERE user_id = ? AND task_date = ?').get(userId, date);
}

/**
 * 获取某日任务统计
 * @param {number} userId 用户 ID
 * @param {string} date 日期 YYYY-MM-DD
 * @returns {object|undefined} 统计记录
 */
function getDailyTaskStats(userId, date) {
    return db.prepare('SELECT * FROM daily_task_stats WHERE user_id = ? AND task_date = ?').get(userId, date);
}

/**
 * 获取某月每日任务统计（用于日历和统计）
 * @param {number} userId 用户 ID
 * @param {number} year 年
 * @param {number} month 月（0-11）
 * @returns {Array} 统计列表
 */
function getMonthlyDailyStats(userId, year, month) {
    const monthStr = String(month + 1).padStart(2, '0'); // 月份字符串
    const prefix = year + '-' + monthStr + '-'; // 前缀
    return db.prepare(`
        SELECT * FROM daily_task_stats
        WHERE user_id = ? AND task_date LIKE ?
        ORDER BY task_date ASC
    `).all(userId, prefix + '%') || [];
}

/**
 * 获取本周每日任务统计
 * @param {number} userId 用户 ID
 * @returns {Array} 统计列表
 */
function getWeeklyDailyStats(userId) {
    const today = new Date(); // 今天
    const dayOfWeek = (today.getDay() + 6) % 7; // 周一=0
    const monday = new Date(today); // 本周一
    monday.setDate(today.getDate() - dayOfWeek); // 设置为周一
    const sunday = new Date(monday); // 本周日
    sunday.setDate(monday.getDate() + 6); // 设置为周日
    const startStr = monday.toISOString().split('T')[0]; // 起始日期
    const endStr = sunday.toISOString().split('T')[0]; // 结束日期
    return db.prepare(`
        SELECT * FROM daily_task_stats
        WHERE user_id = ? AND task_date >= ? AND task_date <= ?
        ORDER BY task_date ASC
    `).all(userId, startStr, endStr) || [];
}

// ==================== 等级系统相关 ====================

/**
 * 获取用户等级信息（含等级配置）
 * @param {number} userId 用户 ID
 * @returns {object|null} 用户等级信息
 */
function getUserLevel(userId) {
    // 确保用户有等级记录（老用户可能没有）
    const existing = db.prepare('SELECT * FROM user_levels WHERE user_id = ?').get(userId);
    if (!existing) { // 老用户没有等级记录，自动创建
        db.prepare(`
            INSERT INTO user_levels (user_id, total_xp, current_level, daily_xp_cap, today_xp_gained, today_date)
            VALUES (?, 0, 1, 200, 0, ?)
        `).run(userId, new Date().toISOString().split('T')[0]);
    }
    // 查询用户等级 + 当前等级配置 + 下一等级配置
    return db.prepare(`
        SELECT ul.*,
               lc.title as current_title, lc.icon as current_icon, lc.color as current_color, lc.description as current_desc,
               lc2.level as next_level, lc2.title as next_title, lc2.icon as next_icon, lc2.required_xp as next_required_xp
        FROM user_levels ul
        LEFT JOIN level_config lc ON ul.current_level = lc.level
        LEFT JOIN level_config lc2 ON lc2.level = ul.current_level + 1
        WHERE ul.user_id = ?
    `).get(userId) || null;
}

/**
 * 获取所有等级配置
 * @returns {Array} 等级配置列表
 */
function getAllLevelConfigs() {
    return db.prepare('SELECT * FROM level_config ORDER BY level ASC').all();
}

/**
 * 获取所有成长任务
 * @param {string} category 分类（daily/cumulative，不传则全部）
 * @returns {Array} 成长任务列表
 */
function getGrowthTasks(category) {
    if (category) { // 按分类查询
        return db.prepare('SELECT * FROM growth_tasks WHERE is_active = 1 AND category = ? ORDER BY id ASC').all(category);
    }
    return db.prepare('SELECT * FROM growth_tasks WHERE is_active = 1 ORDER BY category ASC, id ASC').all();
}

/**
 * 根据 condition_type 获取成长任务
 * @param {string} conditionType 条件类型
 * @returns {object|null} 成长任务
 */
function getGrowthTaskByCondition(conditionType) {
    return db.prepare('SELECT * FROM growth_tasks WHERE condition_type = ? AND is_active = 1').get(conditionType) || null;
}

/**
 * 检查用户今日是否已达经验上限
 * @param {number} userId 用户 ID
 * @returns {boolean} true 表示已达上限
 */
function isDailyXpCapReached(userId) {
    const today = new Date().toISOString().split('T')[0]; // 今日日期
    const record = db.prepare('SELECT * FROM user_levels WHERE user_id = ?').get(userId);
    if (!record) return false; // 无记录，未达上限
    // 如果 today_date 不是今天，重置 today_xp_gained
    if (record.today_date !== today) { // 跨天重置
        db.prepare('UPDATE user_levels SET today_xp_gained = 0, today_date = ? WHERE user_id = ?').run(today, userId);
        return false; // 重置后未达上限
    }
    return (record.today_xp_gained || 0) >= (record.daily_xp_cap || 200); // 比较今日已得与上限
}

/**
 * 记录用户获得经验（核心函数，含每日上限校验）
 * @param {number} userId 用户 ID
 * @param {number} growthTaskId 成长任务 ID
 * @param {number} xpGained 获得的经验值
 * @param {string} sourceType 来源类型（task/bottle/like/checkin 等）
 * @param {number} sourceId 来源 ID
 * @param {string} note 备注
 * @returns {object} 结果对象 { awarded, xpGained, newTotalXp, newLevel, levelUp }
 */
function awardXp(userId, growthTaskId, xpGained, sourceType, sourceId, note) {
    const today = new Date().toISOString().split('T')[0]; // 今日日期

    // 确保用户等级记录存在
    let record = db.prepare('SELECT * FROM user_levels WHERE user_id = ?').get(userId);
    if (!record) { // 不存在则创建
        db.prepare(`
            INSERT INTO user_levels (user_id, total_xp, current_level, daily_xp_cap, today_xp_gained, today_date)
            VALUES (?, 0, 1, 200, 0, ?)
        `).run(userId, today);
        record = db.prepare('SELECT * FROM user_levels WHERE user_id = ?').get(userId);
    }

    // 跨天重置今日经验
    if (record.today_date !== today) { // 跨天
        db.prepare('UPDATE user_levels SET today_xp_gained = 0, today_date = ? WHERE user_id = ?').run(today, userId);
        record.today_xp_gained = 0; // 更新本地变量
        record.today_date = today; // 更新本地变量
    }

    // 检查每日上限
    const remaining = (record.daily_xp_cap || 200) - (record.today_xp_gained || 0); // 今日剩余可获
    const actualGained = Math.min(xpGained, Math.max(0, remaining)); // 实际可获经验（不超过剩余）

    if (actualGained <= 0) { // 已达上限，不发放经验
        // 仍记录日志（xp_gained = 0），便于追溯
        db.prepare(`
            INSERT INTO user_growth_logs (user_id, growth_task_id, xp_gained, source_type, source_id, note)
            VALUES (?, ?, 0, ?, ?, ?)
        `).run(userId, growthTaskId, sourceType, sourceId, note || '已达每日上限');
        return { awarded: false, xpGained: 0, reason: 'daily_cap_reached' };
    }

    // 记录经验日志
    db.prepare(`
        INSERT INTO user_growth_logs (user_id, growth_task_id, xp_gained, source_type, source_id, note)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, growthTaskId, actualGained, sourceType, sourceId, note || null);

    // 更新用户总经验和今日经验
    const newTotalXp = (record.total_xp || 0) + actualGained; // 新总经验
    db.prepare(`
        UPDATE user_levels SET total_xp = ?, today_xp_gained = today_xp_gained + ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
    `).run(newTotalXp, actualGained, userId);

    // 根据总经验重新计算等级（取最高满足条件的等级）
    const newLevelRow = db.prepare(`
        SELECT level FROM level_config WHERE required_xp <= ? ORDER BY level DESC LIMIT 1
    `).get(newTotalXp);
    const newLevel = newLevelRow ? newLevelRow.level : 1; // 新等级
    const levelUp = newLevel > (record.current_level || 1); // 是否升级

    // 更新用户等级
    if (newLevel !== record.current_level) { // 等级变化才更新
        db.prepare('UPDATE user_levels SET current_level = ? WHERE user_id = ?').run(newLevel, userId);
    }

    // 同步更新 users 表的 level 和 xp 字段（保持一致性）
    db.prepare('UPDATE users SET level = ?, xp = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newLevel, newTotalXp, userId);

    return {
        awarded: true, // 是否发放了经验
        xpGained: actualGained, // 实际获得经验
        newTotalXp: newTotalXp, // 新总经验
        newLevel: newLevel, // 新等级
        levelUp: levelUp // 是否升级
    };
}

/**
 * 获取用户经验日志
 * @param {number} userId 用户 ID
 * @param {number} limit 限制条数
 * @param {number} offset 偏移量
 * @returns {Array} 经验日志列表
 */
function getUserGrowthLogs(userId, limit, offset) {
    const lim = limit || 50; // 默认 50 条
    const off = offset || 0; // 默认 0
    return db.prepare(`
        SELECT ugl.*, gt.title as task_title, gt.category as task_category, gt.icon as task_icon
        FROM user_growth_logs ugl
        LEFT JOIN growth_tasks gt ON ugl.growth_task_id = gt.id
        WHERE ugl.user_id = ?
        ORDER BY ugl.created_at DESC
        LIMIT ? OFFSET ?
    `).all(userId, lim, off) || [];
}

/**
 * 获取用户今日已获经验
 * @param {number} userId 用户 ID
 * @returns {number} 今日已获经验
 */
function getTodayXpGained(userId) {
    const today = new Date().toISOString().split('T')[0]; // 今日日期
    const record = db.prepare('SELECT * FROM user_levels WHERE user_id = ?').get(userId);
    if (!record) return 0; // 无记录
    if (record.today_date !== today) return 0; // 跨天，今日未获经验
    return record.today_xp_gained || 0;
}

/**
 * 根据成长任务的 condition_type 发放经验
 * @param {number} userId 用户 ID
 * @param {string} conditionType 条件类型（如 daily_task_complete、daily_publish_bottle 等）
 * @param {string} sourceType 来源类型
 * @param {number} sourceId 来源 ID
 * @param {string} note 备注
 * @returns {object|null} 发放结果，若任务不存在返回 null
 */
function awardXpByCondition(userId, conditionType, sourceType, sourceId, note) {
    const growthTask = getGrowthTaskByCondition(conditionType); // 查找成长任务
    if (!growthTask) return null; // 任务不存在
    return awardXp(userId, growthTask.id, growthTask.xp_reward, sourceType, sourceId, note);
}

// ==================== 漂流瓶收藏 ====================

/**
 * 收藏漂流瓶
 * @param {number} userId 用户 ID
 * @param {number} bottleId 漂流瓶 ID
 * @returns {object} 收藏结果
 */
function addBottleFavorite(userId, bottleId) {
    try {
        db.prepare('INSERT INTO bottle_favorites (user_id, bottle_id) VALUES (?, ?)').run(userId, bottleId);
        return { success: true, favorited: true };
    } catch (e) {
        // 已收藏过（联合唯一索引冲突），按已收藏处理
        return { success: true, favorited: true };
    }
}

/**
 * 取消收藏漂流瓶
 * @param {number} userId 用户 ID
 * @param {number} bottleId 漂流瓶 ID
 * @returns {object} 取消结果
 */
function removeBottleFavorite(userId, bottleId) {
    db.prepare('DELETE FROM bottle_favorites WHERE user_id = ? AND bottle_id = ?').run(userId, bottleId);
    return { success: true, favorited: false };
}

/**
 * 切换收藏状态
 * @param {number} userId 用户 ID
 * @param {number} bottleId 漂流瓶 ID
 * @returns {object} 切换结果
 */
function toggleBottleFavorite(userId, bottleId) {
    const exist = db.prepare('SELECT id FROM bottle_favorites WHERE user_id = ? AND bottle_id = ?').get(userId, bottleId);
    if (exist) {
        db.prepare('DELETE FROM bottle_favorites WHERE user_id = ? AND bottle_id = ?').run(userId, bottleId);
        return { success: true, favorited: false };
    }
    db.prepare('INSERT INTO bottle_favorites (user_id, bottle_id) VALUES (?, ?)').run(userId, bottleId);
    return { success: true, favorited: true };
}

/**
 * 检查是否已收藏
 * @param {number} userId 用户 ID
 * @param {number} bottleId 漂流瓶 ID
 * @returns {boolean} 是否已收藏
 */
function isBottleFavorited(userId, bottleId) {
    const row = db.prepare('SELECT id FROM bottle_favorites WHERE user_id = ? AND bottle_id = ?').get(userId, bottleId);
    return !!row;
}

/**
 * 获取用户收藏的漂流瓶列表（含发布者信息；即使被发布者取消也保留，前端置灰）
 * @param {number} userId 用户 ID
 * @returns {Array} 漂流瓶列表（按收藏时间倒序）
 */
function getBottleFavoritesByUserId(userId) {
    return db.prepare(`
        SELECT b.*, u.username AS author_username, u.nickname AS author_nickname, u.avatar AS author_avatar,
               bf.created_at AS favorited_at,
               (SELECT COUNT(*) FROM bottle_likes bl WHERE bl.bottle_id = b.id) AS like_count
        FROM bottle_favorites bf
        JOIN bottles b ON bf.bottle_id = b.id
        LEFT JOIN users u ON b.user_id = u.id
        WHERE bf.user_id = ?
        ORDER BY bf.created_at DESC
    `).all(userId);
}

/**
 * 获取用户收藏的漂流瓶数量
 * @param {number} userId 用户 ID
 * @returns {number} 收藏数量
 */
function getBottleFavoriteCount(userId) {
    const row = db.prepare('SELECT COUNT(*) AS count FROM bottle_favorites WHERE user_id = ?').get(userId);
    return row ? row.count : 0;
}

// ==================== 意见反馈 ====================

/**
 * 创建意见反馈
 * @param {number} userId 用户 ID
 * @param {string} content 反馈内容
 * @param {string} contact 联系方式
 * @returns {object} 创建的反馈
 */
function createFeedback(userId, content, contact) {
    const result = db.prepare('INSERT INTO feedbacks (user_id, content, contact) VALUES (?, ?, ?)').run(userId, content, contact || '');
    return db.prepare('SELECT * FROM feedbacks WHERE id = ?').get(result.lastInsertRowid);
}

/**
 * 获取用户反馈列表
 * @param {number} userId 用户 ID
 * @returns {Array} 反馈列表
 */
function getFeedbacksByUserId(userId) {
    return db.prepare('SELECT * FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC').all(userId);
}

// ==================== 挑战打卡全记录（用于往年今日） ====================

/**
 * 获取用户所有挑战打卡记录（带挑战标题）
 * @param {number} userId 用户 ID
 * @returns {Array} 打卡记录列表（按时间倒序）
 */
function getAllChallengeCheckinsByUserId(userId) {
    return db.prepare(`
        SELECT cc.*, c.title AS challenge_title, c.duration_days AS challenge_duration
        FROM challenge_checkins cc
        LEFT JOIN challenges c ON cc.challenge_id = c.id
        WHERE cc.user_id = ?
        ORDER BY cc.checkin_at DESC
    `).all(userId);
}

/**
 * 获取搭子匹配列表（排除当前用户，包含等级、任务、打卡天数）
 * @param {number} excludeUserId 排除的用户 ID（当前用户）
 * @returns {Array} 搭子列表
 */
function getPartners(excludeUserId) {
    // 查询所有用户（排除当前用户），关联等级表获取等级信息
    const users = db.prepare(`
        SELECT u.id, u.username, u.nickname, u.avatar, u.bio,
               ul.current_level, lc.title as level_title
        FROM users u
        LEFT JOIN user_levels ul ON u.id = ul.user_id
        LEFT JOIN level_config lc ON ul.current_level = lc.level
        WHERE u.id != ?
        ORDER BY ul.total_xp DESC
    `).all(excludeUserId || 0);

    // 任务分类到搭子类型的映射
    const typeMap = {
        '学习': '学习', '读书': '学习', '英语': '学习', '背单词': '学习',
        '技能': '技能', '编程': '技能', '吉他': '技能', '练字': '技能',
        '运动': '运动', '健身': '运动', '跑步': '运动', '晨跑': '运动',
        '生活': '生活', '冥想': '生活', '日记': '生活', '散步': '生活',
        '早起': '早起'
    };

    // 为每个用户获取任务和打卡天数
    return users.map(function(user) {
        const tasks = getTasksByUserId(user.id);  // 获取用户任务
        const taskTitles = tasks.slice(0, 3).map(function(t) { return t.title; });  // 取前 3 个任务标题
        const streak = getCheckinStreak(user.id);  // 获取连续打卡天数

        // 根据任务分类推断搭子类型
        var type = '任意';
        if (tasks.length > 0) {
            var categoryCount = {};  // 分类计数
            tasks.forEach(function(t) {
                var cat = t.category || '其他';  // 任务分类
                categoryCount[cat] = (categoryCount[cat] || 0) + 1;  // 计数
            });
            // 找出最常见的分类
            var topCategory = Object.keys(categoryCount).reduce(function(a, b) {
                return categoryCount[a] > categoryCount[b] ? a : b;
            });
            type = typeMap[topCategory] || '任意';  // 映射到搭子类型
        }

        return {
        id: user.id,
        name: user.nickname || user.username || '匿名用户',  // 昵称
        avatar: user.avatar || '',  // 头像
        level: user.current_level || 1,  // 等级
        levelName: user.level_title || '小贝壳',  // 等级名称
        tasks: taskTitles,  // 任务标题列表
        streak: streak,  // 连续打卡天数
        type: type  // 搭子类型
    };
    });
}

/**
 * 接受结伴（双向存储搭子关系）
 * @param {number} userId 当前用户 ID
 * @param {number} partnerId 搭子用户 ID
 * @returns {boolean} 是否成功
 */
function acceptPartner(userId, partnerId) {
    if (userId === partnerId) return false; // 不能和自己结伴
    try {
        // 双向插入（A→B 和 B→A），使用 INSERT OR IGNORE 避免重复
        db.prepare('INSERT OR IGNORE INTO user_partners (user_id, partner_id, status) VALUES (?, ?, ?)').run(userId, partnerId, 'accepted'); // A→B
        db.prepare('INSERT OR IGNORE INTO user_partners (user_id, partner_id, status) VALUES (?, ?, ?)').run(partnerId, userId, 'accepted'); // B→A
        return true; // 成功
    } catch (err) {
        console.error('接受结伴失败:', err); // 记录错误
        return false; // 失败
    }
}

/**
 * 获取用户的搭子列表
 * @param {number} userId 用户 ID
 * @returns {Array} 搭子列表（含昵称、头像、等级、共同任务、连续打卡天数、结伴天数）
 */
function getMyPartners(userId) {
    // 查询搭子关系，关联用户表和等级表
    const partners = db.prepare(`
        SELECT u.id, u.username, u.nickname, u.avatar, u.bio,
               ul.current_level, lc.title as level_title,
               up.created_at as partnered_at
        FROM user_partners up
        LEFT JOIN users u ON up.partner_id = u.id
        LEFT JOIN user_levels ul ON u.id = ul.user_id
        LEFT JOIN level_config lc ON ul.current_level = lc.level
        WHERE up.user_id = ? AND up.status = 'accepted'
        ORDER BY up.created_at DESC
    `).all(userId); // 查询搭子列表

    return partners.map(function(p) {
        const tasks = getTasksByUserId(p.id); // 获取搭子的任务
        const taskTitles = tasks.slice(0, 3).map(function(t) { return t.title; }); // 前 3 个任务
        const streak = getCheckinStreak(p.id); // 连续打卡天数
        // 计算结伴天数
        var partneredDays = 0;
        if (p.partnered_at) {
            var d = new Date(String(p.partnered_at).replace(' ', 'T') + 'Z'); // 兼容 UTC
            if (!isNaN(d)) {
                partneredDays = Math.max(1, Math.floor((Date.now() - d.getTime()) / 86400000) + 1); // 结伴天数
            }
        }
        return {
            id: p.id,
            name: p.nickname || p.username || '匿名用户',
            avatar: p.avatar || '',
            level: p.current_level || 1,
            levelName: p.level_title || '小贝壳',
            tasks: taskTitles,
            streak: streak,
            partneredDays: partneredDays
        };
    });
}

/**
 * 检查两个用户是否已结伴
 * @param {number} userId 用户 ID
 * @param {number} partnerId 搭子 ID
 * @returns {boolean} 是否已结伴
 */
function isPartner(userId, partnerId) {
    const row = db.prepare('SELECT id FROM user_partners WHERE user_id = ? AND partner_id = ? AND status = ?').get(userId, partnerId, 'accepted'); // 查询
    return !!row; // 返回是否已结伴
}

/**
 * 移除搭子关系（双向删除）
 * @param {number} userId 当前用户 ID
 * @param {number} partnerId 搭子用户 ID
 * @returns {boolean} 是否成功
 */
function removePartner(userId, partnerId) {
    try {
        // 双向删除（A→B 和 B→A）
        db.prepare('DELETE FROM user_partners WHERE user_id = ? AND partner_id = ?').run(userId, partnerId); // 删除 A→B
        db.prepare('DELETE FROM user_partners WHERE user_id = ? AND partner_id = ?').run(partnerId, userId); // 删除 B→A
        return true; // 成功
    } catch (err) {
        console.error('移除搭子失败:', err); // 记录错误
        return false; // 失败
    }
}

/**
 * 查询待处理的搭子申请（检查是否已向对方发送过未读申请）
 * @param {number} toUserId 接收方用户 ID
 * @param {number} fromUserId 发送方用户 ID
 * @returns {object|null} 已存在的申请消息
 */
function getPendingPartnerRequest(toUserId, fromUserId) {
    // 查询 messages 表中 type='partner' 且 link 包含申请标识且未读的消息
    const linkPattern = 'partner_request:fromUserId:' + fromUserId;  // 申请标识
    return db.prepare(`
        SELECT * FROM messages
        WHERE user_id = ? AND type = 'partner' AND link = ? AND is_read = 0
        ORDER BY created_at DESC LIMIT 1
    `).get(toUserId, linkPattern); // 查询并返回
}

// ==================== 任务点赞与评论 ====================

/**
 * 切换任务点赞（已赞则取消，未赞则点赞）
 * @param {number} taskId 任务 ID
 * @param {number} userId 用户 ID
 * @returns {{ liked: boolean, likesCount: number }}
 */
function toggleTaskLike(taskId, userId) {
    const existing = db.prepare('SELECT id FROM task_likes WHERE task_id = ? AND user_id = ?').get(taskId, userId); // 查询是否已赞
    if (existing) {
        // 已赞 → 取消点赞
        db.prepare('DELETE FROM task_likes WHERE id = ?').run(existing.id); // 删除
        const likesCount = db.prepare('SELECT COUNT(*) as count FROM task_likes WHERE task_id = ?').get(taskId).count; // 点赞数
        return { liked: false, likesCount }; // 返回未赞状态
    } else {
        // 未赞 → 点赞
        db.prepare('INSERT INTO task_likes (task_id, user_id) VALUES (?, ?)').run(taskId, userId); // 插入
        const likesCount = db.prepare('SELECT COUNT(*) as count FROM task_likes WHERE task_id = ?').get(taskId).count; // 点赞数
        return { liked: true, likesCount }; // 返回已赞状态
    }
}

/**
 * 检查用户是否已点赞某任务
 * @param {number} taskId 任务 ID
 * @param {number} userId 用户 ID
 * @returns {boolean}
 */
function isTaskLiked(taskId, userId) {
    const row = db.prepare('SELECT id FROM task_likes WHERE task_id = ? AND user_id = ?').get(taskId, userId); // 查询
    return !!row; // 返回是否已赞
}

/**
 * 获取任务的点赞数
 * @param {number} taskId 任务 ID
 * @returns {number}
 */
function getTaskLikeCount(taskId) {
    return db.prepare('SELECT COUNT(*) as count FROM task_likes WHERE task_id = ?').get(taskId).count; // 返回点赞数
}

/**
 * 创建任务评论
 * @param {object} comment { task_id, user_id, user_name, user_avatar, content }
 * @returns {object} 创建的评论
 */
function createTaskComment(comment) {
    const result = db.prepare(`
        INSERT INTO task_comments (task_id, user_id, user_name, user_avatar, content)
        VALUES (?, ?, ?, ?, ?)
    `).run(comment.task_id, comment.user_id, comment.user_name, comment.user_avatar, comment.content); // 插入评论
    return db.prepare('SELECT * FROM task_comments WHERE id = ?').get(result.lastInsertRowid); // 返回评论
}

/**
 * 获取任务评论列表
 * @param {number} taskId 任务 ID
 * @returns {Array} 评论列表
 */
function getTaskComments(taskId) {
    return db.prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at DESC').all(taskId); // 按时间倒序
}

/**
 * 获取任务评论数
 * @param {number} taskId 任务 ID
 * @returns {number}
 */
function getTaskCommentCount(taskId) {
    return db.prepare('SELECT COUNT(*) as count FROM task_comments WHERE task_id = ?').get(taskId).count; // 返回评论数
}

// 导出模块
module.exports = {
    db, // 数据库实例
    initDatabase, // 初始化数据库
    // 用户认证相关
    createUser, // 创建用户
    getUserById, // 根据 ID 获取用户
    getUserByUsername, // 根据用户名获取用户
    getUserByEmail, // 根据邮箱获取用户
    verifyUser, // 验证用户
    updatePassword, // 更新密码
    resetPasswordByIdentifier, // 通过标识符重置密码
    updateUser, // 更新用户信息
    sanitizeUser, // 清洗用户信息
    getPartners, // 获取搭子匹配列表（真实用户数据）
    acceptPartner, // 接受结伴（双向存储搭子关系）
    getMyPartners, // 获取用户搭子列表
    isPartner, // 检查是否已结伴
    removePartner, // 移除搭子关系（双向删除）
    getPendingPartnerRequest, // 查询待处理的搭子申请
    // 任务点赞与评论
    toggleTaskLike, // 切换任务点赞
    isTaskLiked, // 检查是否已点赞任务
    getTaskLikeCount, // 获取任务点赞数
    createTaskComment, // 创建任务评论
    getTaskComments, // 获取任务评论列表
    getTaskCommentCount, // 获取任务评论数
    // 任务相关
    createTask, // 创建任务
    getTasksByUserId, // 根据用户 ID 获取任务
    getOceanTasks, // 获取漂流海洋任务（show_in_ocean=1）
    getTaskById, // 根据 ID 获取任务
    updateTask, // 更新任务
    deleteTask, // 删除任务
    toggleTaskStatus, // 切换任务状态
    getTodayTasks, // 获取今日任务
    getTasksByDate, // 根据日期获取任务
    getTaskDatesByMonth, // 获取某月有任务的日期
    // 每日任务统计相关
    updateDailyTaskStats, // 更新每日任务统计
    getDailyTaskStats, // 获取某日任务统计
    getMonthlyDailyStats, // 获取某月每日统计
    getWeeklyDailyStats, // 获取本周每日统计
    // 打卡相关
    createCheckin, // 创建打卡
    getCheckinsByUserId, // 根据用户 ID 获取打卡
    getCheckinsByDate, // 根据日期获取打卡
    getCheckinHistory, // 获取打卡历史
    getCheckinStreak, // 获取打卡连续天数
    // 漂流瓶相关
    createBottle, // 创建漂流瓶
    getBottles, // 获取漂流瓶列表（分页）
    getBottleById, // 根据 ID 获取漂流瓶
    getBottlesByUserId, // 根据用户 ID 获取漂流瓶
    removeBottle, // 移除漂流瓶
    incrementBottleLikes, // 点赞数+1
    decrementBottleLikes, // 点赞数-1
    // 漂流瓶点赞相关
    toggleLike, // 切换点赞
    isLiked, // 是否已点赞
    getLikesByBottleId, // 获取点赞列表
    // 漂流瓶评论相关
    createComment, // 创建评论
    getCommentsByBottleId, // 获取评论列表
    // 挑战相关
    createChallenge, // 创建挑战
    getChallenges, // 获取所有挑战
    getChallengeById, // 根据 ID 获取挑战
    getOngoingChallenges, // 获取进行中的挑战
    incrementParticipants, // 参与人数+1
    // 挑战参与者相关
    joinChallenge, // 加入挑战
    getParticipant, // 获取参与记录
    getParticipantsByChallengeId, // 根据挑战 ID 获取参与者
    getChallengesByUserId, // 根据用户 ID 获取挑战（带打卡次数和今日打卡状态）
    updateParticipantProgress, // 更新参与者进度
    getChallengeRanking, // 获取挑战排行榜（按打卡次数降序）
    // 挑战打卡相关
    hasCheckedInChallengeToday, // 检查今日是否已打卡
    getChallengeCheckinCount, // 获取用户对某挑战的打卡次数
    getChallengeCheckinRecords, // 获取用户对某挑战的打卡记录
    checkinChallenge, // 挑战打卡（核心函数）
    getChallengeDetail, // 获取挑战详情（含用户参与状态和打卡信息）
    getCompletedChallengesByUserId, // 获取用户往期挑战（成功和失败）
    getChallengeStatsByUserId, // 获取用户挑战统计（成功次数和失败次数）
    checkAndUpdateFailedChallenges, // 检测并更新失败的挑战
    // 挑战营友动态相关
    createChallengeMoment, // 创建挑战营友动态
    getChallengeMoments, // 获取挑战动态列表
    toggleChallengeMomentLike, // 切换挑战动态点赞
    // 时间胶囊相关
    createCapsule, // 创建胶囊
    getCapsulesByUserId, // 根据用户 ID 获取胶囊
    getCapsuleById, // 根据 ID 获取胶囊
    openCapsule, // 开启胶囊
    getOpenableCapsules, // 获取可开启的胶囊
    deleteCapsule, // 删除胶囊（需校验归属权）
    // 消息相关
    createMessage, // 创建消息
    getMessagesByUserId, // 根据用户 ID 获取消息
    markMessageRead, // 标记消息已读
    markAllRead, // 标记全部已读
    getUnreadCount, // 获取未读数量
    getMessagesByType, // 根据类型获取消息
    // 徽章相关
    createBadge, // 创建徽章
    getBadges, // 获取所有徽章
    getBadgeById, // 根据 ID 获取徽章
    // 用户徽章相关
    awardBadge, // 授予徽章
    getUserBadges, // 获取用户徽章
    hasBadge, // 是否拥有徽章
    // 专注记录相关
    createFocusSession, // 创建专注记录
    getFocusSessionsByUserId, // 根据用户 ID 获取专注记录
    getFocusStats, // 获取专注统计
    // 周统计相关
    createOrUpdateWeeklyStats, // 创建或更新周统计
    getWeeklyStats, // 获取周统计
    // 等级系统相关
    getUserLevel, // 获取用户等级信息
    getAllLevelConfigs, // 获取所有等级配置
    getGrowthTasks, // 获取所有成长任务
    getGrowthTaskByCondition, // 根据条件类型获取成长任务
    isDailyXpCapReached, // 检查今日是否已达经验上限
    awardXp, // 发放经验（核心函数）
    awardXpByCondition, // 根据条件类型发放经验
    getUserGrowthLogs, // 获取用户经验日志
    getTodayXpGained, // 获取今日已获经验
    // 漂流瓶收藏相关
    addBottleFavorite, // 收藏漂流瓶
    removeBottleFavorite, // 取消收藏
    toggleBottleFavorite, // 切换收藏
    isBottleFavorited, // 是否已收藏
    getBottleFavoritesByUserId, // 获取用户收藏列表
    getBottleFavoriteCount, // 获取收藏数量
    // 意见反馈相关
    createFeedback, // 创建反馈
    getFeedbacksByUserId, // 获取用户反馈列表
    // 挑战打卡全记录
    getAllChallengeCheckinsByUserId // 获取用户所有挑战打卡记录
};
