import { db } from '../config/database.js'
import axios from 'axios'

export const createExam = (req, res) => {
  const { title, questions, duration, classroomId } = req.body
  
  db.run(
    'INSERT INTO exams (title, questions, duration, classroomId, createdBy) VALUES (?, ?, ?, ?, ?)',
    [title, JSON.stringify(questions), duration || 60, classroomId, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.status(201).json({ id: this.lastID, title, duration, message: '考试创建成功' })
    }
  )
}

export const getExams = (req, res) => {
  db.all('SELECT * FROM exams ORDER BY createdAt DESC', (err, exams) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    exams.forEach(exam => {
      exam.questions = JSON.parse(exam.questions || '[]')
    })
    res.json(exams)
  })
}

export const getExamById = (req, res) => {
  db.get('SELECT * FROM exams WHERE id = ?', [req.params.id], (err, exam) => {
    if (err) return res.status(500).json({ message: '服务器错误' })
    if (!exam) return res.status(404).json({ message: '考试不存在' })
    exam.questions = JSON.parse(exam.questions || '[]')
    res.json(exam)
  })
}

export const submitExam = (req, res) => {
  const { answers } = req.body
  
  db.run(
    'INSERT INTO exam_submissions (examId, userId, answers) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, JSON.stringify(answers)],
    function(err) {
      if (err) return res.status(500).json({ message: '服务器错误' })
      res.json({ id: this.lastID, message: '提交成功' })
    }
  )
}

export const getExamSubmissions = (req, res) => {
  db.all(
    'SELECT es.*, u.username FROM exam_submissions es JOIN users u ON es.userId = u.id WHERE es.examId = ?',
    [req.params.id],
    (err, submissions) => {
      if (err) return res.status(500).json({ message: '服务器错误' })
      submissions.forEach(submission => {
        submission.answers = JSON.parse(submission.answers || '[]')
        submission.feedback = submission.feedback ? JSON.parse(submission.feedback) : null
      })
      res.json(submissions)
    }
  )
}

export const gradeExam = async (req, res) => {
  try {
    const exam = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM exams WHERE id = ?', [req.params.id], (err, exam) => {
        if (err) reject(err)
        else resolve(exam)
      })
    })
    
    const submissions = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM exam_submissions WHERE examId = ?', [req.params.id], (err, subs) => {
        if (err) reject(err)
        else resolve(subs)
      })
    })
    
    for (const submission of submissions) {
      if (submission.score > 0) continue
      
      const examData = {
        questions: JSON.parse(exam.questions || '[]'),
        answers: JSON.parse(submission.answers || '[]')
      }
      
      let score = 0
      let feedback = []
      
      for (let index = 0; index < examData.questions.length; index++) {
        const q = examData.questions[index]
        const userAnswer = examData.answers[index]
        const isCorrect = userAnswer && userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase()
        
        let explanation = ''
        if (isCorrect) {
          score += Math.round(100 / examData.questions.length)
          explanation = '回答正确！🎉'
        } else {
          explanation = await generateAIExplanation(q, userAnswer)
        }
        
        feedback.push({
          question: q.question,
          userAnswer: userAnswer || '',
          correctAnswer: q.answer,
          isCorrect,
          explanation
        })
      }
      
      await new Promise((resolve) => {
        db.run(
          'UPDATE exam_submissions SET score = ?, feedback = ? WHERE id = ?',
          [score, JSON.stringify(feedback), submission.id],
          () => resolve()
        )
      })
    }
    
    res.json({ message: '批卷完成' })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
}

const generateAIExplanation = async (question, userAnswer) => {
  try {
    const prompt = `
题目：${question.question}
用户答案：${userAnswer || '未作答'}
正确答案：${question.answer}
解析参考：${question.explanation || ''}

请作为一名AI老师，针对这道题给出详细的错题讲解。要求：
1. 指出用户的错误在哪里
2. 解释正确答案为什么正确
3. 提供通俗易懂的知识点讲解
4. 语气友好鼓励
5. 字数控制在100字以内
`
    
    const apiKey = process.env.DEEPSEEK_API_KEY || ''
    
    if (!apiKey) {
      return `回答错误。正确答案是：${question.answer}。${question.explanation || ''}`
    }
    
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: '你是一位耐心的AI老师，擅长讲解各种知识，语气友好鼓励。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    )
    
    return response.data.choices[0].message.content
  } catch (err) {
    console.error('AI explanation error:', err)
    return `回答错误。正确答案是：${question.answer}。${question.explanation || ''}`
  }
}