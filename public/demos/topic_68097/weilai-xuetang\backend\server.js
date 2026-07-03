import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { initDatabase } from './config/database.js'
import authRoutes from './routes/auth.js'
import classroomRoutes from './routes/classrooms.js'
import examRoutes from './routes/exams.js'
import courseRoutes from './routes/courses.js'
import path from 'path'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
})

const __dirname = process.cwd()

app.use(cors())
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/classrooms', classroomRoutes)
app.use('/api/exams', examRoutes)
app.use('/api/courses', courseRoutes)

app.use(express.static(path.join(__dirname, '../frontend/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'), { root: __dirname })
})

const classroomUsers = {}

io.on('connection', (socket) => {
  socket.on('join-classroom', (classroomId) => {
    socket.join(classroomId)
    if (!classroomUsers[classroomId]) {
      classroomUsers[classroomId] = []
    }
    const userData = {
      id: socket.id,
      username: socket.handshake.query.username,
      avatar: socket.handshake.query.avatar
    }
    classroomUsers[classroomId].push(userData)
    io.to(classroomId).emit('user-joined', { user: userData, users: classroomUsers[classroomId] })
  })

  socket.on('leave-classroom', (classroomId) => {
    socket.leave(classroomId)
    if (classroomUsers[classroomId]) {
      classroomUsers[classroomId] = classroomUsers[classroomId].filter(u => u.id !== socket.id)
      io.to(classroomId).emit('user-left', { userId: socket.id, users: classroomUsers[classroomId] })
    }
  })

  socket.on('start-exam', (data) => {
    io.to(data.classroomId).emit('exam-started', data)
  })

  socket.on('submit-exam', (data) => {
    io.to(data.classroomId).emit('exam-submitted', data)
  })

  socket.on('disconnect', () => {
    Object.keys(classroomUsers).forEach(classroomId => {
      classroomUsers[classroomId] = classroomUsers[classroomId].filter(u => u.id !== socket.id)
      io.to(classroomId).emit('user-left', { userId: socket.id, users: classroomUsers[classroomId] })
    })
  })
})

initDatabase().then(() => {
  httpServer.listen(3003, () => {
    console.log('Server running on port 3003')
  })
})