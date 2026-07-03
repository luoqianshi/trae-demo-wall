import { db } from '../config/database.js'

export const createClassroom = (req, res) => {
  const { name, theme, maxUsers } = req.body
  
  db.run(
    'INSERT INTO classrooms (name, theme, maxUsers, createdBy) VALUES (?, ?, ?, ?)',
    [name, theme || 'beach', maxUsers || 10, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ message: '服务器错误' })
      
      db.run(
        'INSERT INTO classroom_users (classroomId, userId) VALUES (?, ?)',
        [this.lastID, req.user.id],
        () => {
          res.status(201).json({ id: this.lastID, name, theme, maxUsers, message: '教室创建成功' })
        }
      )
    }
  )
}

export const getClassrooms = (req, res) => {
  db.all('SELECT * FROM classrooms ORDER BY createdAt DESC', (err, classrooms) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    
    const promises = classrooms.map(classroom => {
      return new Promise((resolve) => {
        db.get(
          'SELECT COUNT(*) as count FROM classroom_users WHERE classroomId = ?',
          [classroom.id],
          (err, result) => {
            classroom.userCount = result?.count || 0
            resolve(classroom)
          }
        )
      })
    })
    
    Promise.all(promises).then(() => {
      res.json(classrooms)
    })
  })
}

export const getClassroomById = (req, res) => {
  db.get('SELECT * FROM classrooms WHERE id = ?', [req.params.id], (err, classroom) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    if (!classroom) return res.status(404).json({ message: '教室不存在' })
    
    db.get(
      'SELECT COUNT(*) as count FROM classroom_users WHERE classroomId = ?',
      [req.params.id],
      (err, result) => {
        classroom.userCount = result?.count || 0
        res.json(classroom)
      }
    )
  })
}

export const getClassroomUsers = (req, res) => {
  db.all(
    'SELECT u.id, u.username, u.avatar FROM classroom_users cu JOIN users u ON cu.userId = u.id WHERE cu.classroomId = ?',
    [req.params.id],
    (err, users) => {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.json(users)
    }
  )
}

export const joinClassroom = (req, res) => {
  db.get('SELECT * FROM classrooms WHERE id = ?', [req.params.id], (err, classroom) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    if (!classroom) return res.status(404).json({ message: '教室不存在' })
    
    db.get(
      'SELECT COUNT(*) as count FROM classroom_users WHERE classroomId = ?',
      [req.params.id],
      (err, result) => {
        if (result?.count >= classroom.maxUsers) {
          return res.status(400).json({ message: '教室已满' })
        }
        
        db.run(
          'INSERT OR IGNORE INTO classroom_users (classroomId, userId) VALUES (?, ?)',
          [req.params.id, req.user.id],
          function(err) {
            if (err) return res.status(500).json({ message: '服务器错误' })
            if (this.changes === 0) {
              return res.status(400).json({ message: '已在教室中' })
            }
            res.json({ message: '加入成功' })
          }
        )
      }
    )
  })
}

export const leaveClassroom = (req, res) => {
  db.run(
    'DELETE FROM classroom_users WHERE classroomId = ? AND userId = ?',
    [req.params.id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.json({ message: '离开成功' })
    }
  )
}

export const deleteClassroom = (req, res) => {
  db.run('DELETE FROM classroom_users WHERE classroomId = ?', [req.params.id], () => {
    db.run('DELETE FROM classrooms WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.json({ message: '删除成功' })
    })
  })
}