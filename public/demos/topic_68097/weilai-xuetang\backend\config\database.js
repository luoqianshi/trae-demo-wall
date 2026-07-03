import sqlite3 from 'sqlite3'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '../database.db')

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err)
  }
})

export const initDatabase = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS user_courses`)
      db.run(`DROP TABLE IF EXISTS course_sections`)
      db.run(`DROP TABLE IF EXISTS courses`)
      db.run(`DROP TABLE IF EXISTS exam_submissions`)
      db.run(`DROP TABLE IF EXISTS exams`)
      db.run(`DROP TABLE IF EXISTS classroom_users`)
      db.run(`DROP TABLE IF EXISTS classrooms`)
      db.run(`DROP TABLE IF EXISTS users`)

      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'student',
          avatar TEXT,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.run(`
        CREATE TABLE classrooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          theme TEXT DEFAULT 'beach',
          maxUsers INTEGER DEFAULT 10,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          createdBy INTEGER,
          FOREIGN KEY (createdBy) REFERENCES users(id)
        )
      `)

      db.run(`
        CREATE TABLE classroom_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          classroomId INTEGER,
          userId INTEGER,
          joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (classroomId) REFERENCES classrooms(id),
          FOREIGN KEY (userId) REFERENCES users(id),
          UNIQUE(classroomId, userId)
        )
      `)

      db.run(`
        CREATE TABLE exams (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          questions TEXT,
          duration INTEGER DEFAULT 60,
          classroomId INTEGER,
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
          createdBy INTEGER,
          FOREIGN KEY (classroomId) REFERENCES classrooms(id),
          FOREIGN KEY (createdBy) REFERENCES users(id)
        )
      `)

      db.run(`
        CREATE TABLE exam_submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          examId INTEGER,
          userId INTEGER,
          answers TEXT,
          score INTEGER DEFAULT 0,
          feedback TEXT,
          submittedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (examId) REFERENCES exams(id),
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `)

      db.run(`
        CREATE TABLE courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL UNIQUE,
          description TEXT,
          level TEXT DEFAULT 'beginner',
          category TEXT DEFAULT 'ai',
          coverImage TEXT,
          status TEXT DEFAULT 'available',
          createdAt TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `)

      db.run(`
        CREATE TABLE course_sections (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          courseId INTEGER,
          title TEXT NOT NULL,
          content TEXT,
          orderNum INTEGER DEFAULT 0,
          FOREIGN KEY (courseId) REFERENCES courses(id)
        )
      `)

      db.run(`
        CREATE TABLE user_courses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER,
          courseId INTEGER,
          progress INTEGER DEFAULT 0,
          completed INTEGER DEFAULT 0,
          enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id),
          FOREIGN KEY (courseId) REFERENCES courses(id),
          UNIQUE(userId, courseId)
        )
      `)

      db.run(`
        INSERT OR IGNORE INTO users (username, password, role) 
        VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'admin')
      `)

      db.run(`
        INSERT OR IGNORE INTO users (username, password, role) 
        VALUES ('teacher1', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'teacher')
      `)

      db.run(`
        INSERT OR IGNORE INTO users (username, password, role) 
        VALUES ('student1', '$2a$10$N9qo8uLOickgx2ZMRZoMye.IjzqAKL9xL5jvMFVdNJHvGCgTq/VEq', 'student')
      `)

      db.run(`
        INSERT INTO courses (title, description, level, category, coverImage) 
        VALUES ('AI智能课程', '从零基础开始了解人工智能的基本概念、发展历程以及与大语言模型的交互技巧', 'beginner', 'ai', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AI%20education%20concept%20illustration%20with%20neural%20network%20and%20brain&image_size=landscape_16_9')
      `)

      db.run(`
        INSERT INTO courses (title, description, level, category, coverImage, status) 
        VALUES ('AI进阶应用', '学习生成式AI原理、提示词工程及大模型实战项目开发', 'intermediate', 'ai', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=generative%20AI%20creative%20content%20generation%20artificial%20intelligence&image_size=landscape_16_9', 'upcoming')
      `)

      db.run(`
        INSERT INTO courses (title, description, level, category, coverImage) 
        VALUES ('文化课', '涵盖大学语文、高等数学等基础文化课程，提升综合素质', 'beginner', 'culture', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literature%20classroom%20books%20traditional%20chinese%20style&image_size=landscape_16_9')
      `)

      db.run(`
        INSERT INTO courses (title, description, level, category, coverImage) 
        VALUES ('外语与人文', '英语口语训练及西方哲学思想学习，拓宽国际视野', 'intermediate', 'culture', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=english%20learning%20language%20study%20conversation%20practice&image_size=landscape_16_9')
      `)

      db.run(`
        INSERT INTO course_sections (courseId, title, content, orderNum)
        VALUES (1, 'AI基础概念', '人工智能（Artificial Intelligence，简称AI）是计算机科学的一个分支，致力于研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统。', 1)
      `)

      db.run(`
        INSERT INTO course_sections (courseId, title, content, orderNum)
        VALUES (1, 'AI应用领域', 'AI可以进行图像识别、语音识别、自然语言处理、自动驾驶、智能推荐等多种任务，已经广泛应用于各个领域。', 2)
      `)

      db.run(`
        INSERT INTO course_sections (courseId, title, content, orderNum)
        VALUES (1, '大语言模型入门', '大语言模型是一种基于深度学习的人工智能模型，通过学习海量文本数据来理解和生成人类语言。', 3)
      `)

      db.run(`
        INSERT INTO course_sections (courseId, title, content, orderNum)
        VALUES (3, '大学语文', '提高文学素养和写作能力，学习经典文学作品和写作技巧。', 1)
      `)

      db.run(`
        INSERT INTO course_sections (courseId, title, content, orderNum)
        VALUES (3, '高等数学基础', '学习微积分、线性代数等数学知识，为专业学习打下坚实基础。', 2)
      `)

      db.run(`
        INSERT INTO course_sections (courseId, title, content, orderNum)
        VALUES (4, '英语口语训练', '提升英语听说能力，掌握日常对话和学术交流技巧。', 1)
      `)

      console.log('Database initialized')
      resolve()
    })
  })
}

export { db }