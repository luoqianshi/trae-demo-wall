import bcrypt from 'bcryptjs'
import { db } from '../config/database.js'
import { generateToken } from '../middleware/auth.js'

export const register = (req, res) => {
  const { username, password, email, role } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' })
  }
  
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    
    db.run(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hash, email || '', role || 'student'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ message: '用户名已存在' })
          }
          return res.status(500).json({ message: '服务器错误' })
        }
        res.status(201).json({ 
          id: this.lastID, 
          username, 
          role: role || 'student',
          message: '注册成功' 
        })
      }
    )
  })
}

export const login = (req, res) => {
  const { username, password } = req.body
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    if (!user) return res.status(400).json({ message: '用户名或密码错误' })
    
    bcrypt.compare(password, user.password, (err, match) => {
      if (err) return res.status(500).json({ message: '服务器错误' })
      if (!match) return res.status(400).json({ message: '用户名或密码错误' })
      
      const token = generateToken(user)
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          avatar: user.avatar
        }
      })
    })
  })
}

export const getUserInfo = (req, res) => {
  db.get('SELECT id, username, role, email, avatar FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    res.json(user)
  })
}