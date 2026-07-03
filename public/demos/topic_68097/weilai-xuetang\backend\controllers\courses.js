import { db } from '../config/database.js'

export const getCourses = (req, res) => {
  db.all('SELECT * FROM courses ORDER BY level, createdAt', (err, courses) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    
    const promises = courses.map(course => {
      return new Promise((resolve) => {
        db.get(
          'SELECT COUNT(*) as count FROM user_courses WHERE courseId = ?',
          [course.id],
          (err, result) => {
            course.studentCount = result?.count || 0
            resolve(course)
          }
        )
      })
    })
    
    Promise.all(promises).then(() => {
      res.json(courses)
    })
  })
}

export const getCourseById = (req, res) => {
  db.get('SELECT * FROM courses WHERE id = ?', [req.params.id], (err, course) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    if (!course) return res.status(404).json({ message: '课程不存在' })
    
    db.get(
      'SELECT COUNT(*) as count FROM user_courses WHERE courseId = ?',
      [req.params.id],
      (err, result) => {
        course.studentCount = result?.count || 0
        res.json(course)
      }
    )
  })
}

export const getCourseSections = (req, res) => {
  db.all(
    'SELECT * FROM course_sections WHERE courseId = ? ORDER BY orderNum',
    [req.params.id],
    (err, sections) => {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.json(sections)
    }
  )
}

export const enrollCourse = (req, res) => {
  db.run(
    'INSERT OR IGNORE INTO user_courses (userId, courseId) VALUES (?, ?)',
    [req.user.id, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ message: '服务器错误' })
      if (this.changes === 0) {
        return res.status(400).json({ message: '已选修该课程' })
      }
      res.json({ message: '选课成功' })
    }
  )
}

export const getUserCourses = (req, res) => {
  db.all(
    'SELECT uc.*, c.title, c.description, c.level, c.coverImage FROM user_courses uc JOIN courses c ON uc.courseId = c.id WHERE uc.userId = ?',
    [req.user.id],
    (err, courses) => {
      if (err) return res.status(500).json({ message: '服务器错误' })
      
      const promises = courses.map(course => {
        return new Promise((resolve) => {
          db.get(
            'SELECT COUNT(*) as total FROM course_sections WHERE courseId = ?',
            [course.courseId],
            (err, result) => {
              course.totalSections = result?.total || 0
              resolve(course)
            }
          )
        })
      })
      
      Promise.all(promises).then(() => {
        res.json(courses)
      })
    }
  )
}

export const updateProgress = (req, res) => {
  const { sectionId, completed } = req.body
  
  db.run(
    'UPDATE user_courses SET progress = ?, completed = ? WHERE userId = ? AND courseId = ?',
    [req.body.progress || 0, completed ? 1 : 0, req.user.id, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.json({ message: '进度更新成功' })
    }
  )
}

export const getCertificates = (req, res) => {
  db.all(
    'SELECT uc.*, c.title, c.description FROM user_courses uc JOIN courses c ON uc.courseId = c.id WHERE uc.userId = ? AND uc.completed = 1',
    [req.user.id],
    (err, certificates) => {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.json(certificates)
    }
  )
}