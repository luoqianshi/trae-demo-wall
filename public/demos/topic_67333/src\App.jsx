import { useState, useEffect, createContext, useContext } from 'react'
import { storage } from './utils/storage'
import { generateDiagnosis, generateGuideSteps, generateVariationQuestions, generateReviewPlan } from './utils/aiMock'
import { buildDoubaoOCRPrompt, callDoubaoForQuestionOCR, callDoubaoForDiagnosis, callDoubaoForGuideSteps, callDoubaoForVariationQuestions } from './utils/doubaoOCR'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import WrongQuestionEntry from './pages/WrongQuestionEntry'
import WrongQuestionList from './pages/WrongQuestionList'
import WrongQuestionDetail from './pages/WrongQuestionDetail'
import ReviewPlan from './pages/ReviewPlan'
import LearningProfile from './pages/LearningProfile'
import Settings from './pages/Settings'
import WrongQuestionPrint from './pages/WrongQuestionPrint'
import './App.css'

export const AppContext = createContext()

const SAMPLE_WRONG_QUESTION = {
  id: 'sample-1',
  sourceType: 'manual',
  subject: '数学',
  knowledgePoint: '平面向量坐标运算',
  questionText: '已知向量 a = (2, -1)，b = (1, 3)，求 2a - b 的坐标。',
  wrongAnswer: '(3, -5)',
  confusion: '我不确定数乘和减法顺序是不是弄错了。',
  errorTags: ['公式不会选', '计算错误'],
  extractionStatus: '已确认',
  confirmedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  diagnosis: {
    causeType: '公式选择错误 + 计算过程不稳定',
    possibleReasons: ['对向量数乘分配律理解不清晰', '计算时符号处理有误'],
    reviewSuggestion: '建议复习向量数乘的分配律：(k+l)a = ka + la, k(a+b) = ka + kb',
    recommendedTraining: '变式训练：对比 (2a - b) 与 2(a-b) 的差异'
  },
  guideSteps: [
    '识别核心知识点：平面向量的坐标运算与数乘分配律',
    '圈出已知条件：a = (2, -1)，b = (1, 3)，求 2a - b',
    '先做数乘：2a = 2×(2, -1) = (4, -2)',
    '再做减法：(4, -2) - (1, 3) = (4-1, -2-3) = (3, -5)',
    '检查答案：你写的是 (3, -5)，但正确结果是 (3, -5)... 等等，让我重新算'
  ],
  variationQuestions: [
    {
      id: 'v1',
      type: '基础巩固',
      question: '已知 a = (1, 2)，b = (3, -1)，求 3a - b 的坐标。',
      answer: '(0, 7)',
      explanation: '3a = (3, 6)，3a - b = (3-3, 6-(-1)) = (0, 7)',
      userStatus: '未完成'
    },
    {
      id: 'v2',
      type: '方法辨析',
      question: '判断 2a - b 和 2(a - b) 是否一定相同，并说明理由。',
      answer: '不相同。因为 2(a-b) = 2a - 2b，与 2a - b 不同（除非 b=0）',
      explanation: '关键在于：减法不满足分配律，k(a-b) = ka - kb，但 a-b 不能分配给系数',
      userStatus: '未完成'
    },
    {
      id: 'v3',
      type: '进阶训练',
      question: '已知 2a - b = (5, 1)，a = (2, 3)，求 b。',
      answer: 'b = (-1, 5)',
      explanation: '由 2a - b = (5,1) 得 b = 2a - (5,1) = (4,6) - (5,1) = (-1, 5)',
      userStatus: '未完成'
    }
  ],
  reviewPlan: [
    { id: 'r1', reviewDate: new Date().toISOString().split('T')[0], taskType: '当天订正', status: '已完成', createdAt: new Date().toISOString() },
    { id: 'r2', reviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], taskType: '3天后复测', status: '未完成', createdAt: new Date().toISOString() },
    { id: 'r3', reviewDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], taskType: '7天后综合复习', status: '未完成', createdAt: new Date().toISOString() },
    { id: 'r4', reviewDate: '考前', taskType: '考前复习', status: '未完成', createdAt: new Date().toISOString() }
  ],
  status: '已诊断',
  progress: 20,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
}

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [wrongQuestions, setWrongQuestions] = useState([])
  const [reviewTasks, setReviewTasks] = useState([])
  const [theme, setTheme] = useState('light')
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  useEffect(() => {
    const savedQuestions = storage.getWrongQuestions()
    const savedTasks = storage.getReviewTasks()
    const savedTheme = storage.getTheme()

    if (savedQuestions.length === 0) {
      storage.saveWrongQuestions([SAMPLE_WRONG_QUESTION])
      setWrongQuestions([SAMPLE_WRONG_QUESTION])
    } else {
      setWrongQuestions(savedQuestions)
    }

    if (savedTasks.length === 0) {
      storage.saveReviewTasks(SAMPLE_WRONG_QUESTION.reviewPlan)
      setReviewTasks(SAMPLE_WRONG_QUESTION.reviewPlan)
    } else {
      setReviewTasks(savedTasks)
    }

    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const addWrongQuestion = (question) => {
    const newQuestions = [...wrongQuestions, question]
    setWrongQuestions(newQuestions)
    storage.saveWrongQuestions(newQuestions)
    if (question.reviewPlan) {
      const newTasks = [...reviewTasks, ...question.reviewPlan]
      setReviewTasks(newTasks)
      storage.saveReviewTasks(newTasks)
    }
  }

  const updateWrongQuestion = (id, updates) => {
    const newQuestions = wrongQuestions.map(q => 
      q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
    )
    setWrongQuestions(newQuestions)
    storage.saveWrongQuestions(newQuestions)
  }

  const deleteWrongQuestion = (id) => {
    const newQuestions = wrongQuestions.filter(q => q.id !== id)
    setWrongQuestions(newQuestions)
    storage.saveWrongQuestions(newQuestions)
    const newTasks = reviewTasks.filter(t => t.wrongQuestionId !== id)
    setReviewTasks(newTasks)
    storage.saveReviewTasks(newTasks)
  }

  const updateReviewTask = (id, status) => {
    const newTasks = reviewTasks.map(t => 
      t.id === id ? { ...t, status } : t
    )
    setReviewTasks(newTasks)
    storage.saveReviewTasks(newTasks)
  }

  const deleteReviewTask = (id) => {
    const newTasks = reviewTasks.filter(t => t.id !== id)
    setReviewTasks(newTasks)
    storage.saveReviewTasks(newTasks)
  }

  const clearAllData = () => {
    setWrongQuestions([])
    setReviewTasks([])
    storage.clearAll()
  }

  const exportData = () => {
    return storage.exportData()
  }

  const importData = (data) => {
    storage.importData(data)
    setWrongQuestions(storage.getWrongQuestions())
    setReviewTasks(storage.getReviewTasks())
  }

  const navigateTo = (page, questionId = null) => {
    if (questionId) {
      const question = wrongQuestions.find(q => q.id === questionId)
      setSelectedQuestion(question)
    }
    setCurrentPage(page)
  }

  const processImageOCR = async (imageFile) => {
    return await callDoubaoForQuestionOCR(imageFile)
  }

  const runAIDiagnosis = async (question) => {
    let diagnosis, guideSteps, variationQuestions

    const aiDiagnosis = await callDoubaoForDiagnosis(question)
    if (aiDiagnosis) {
      diagnosis = aiDiagnosis
    } else {
      diagnosis = generateDiagnosis(question)
    }

    const aiGuideSteps = await callDoubaoForGuideSteps(question, diagnosis)
    if (aiGuideSteps && aiGuideSteps.length > 0) {
      guideSteps = aiGuideSteps
    } else {
      guideSteps = generateGuideSteps(question, diagnosis)
    }

    const aiVariations = await callDoubaoForVariationQuestions(question, diagnosis)
    if (aiVariations && aiVariations.length > 0) {
      variationQuestions = aiVariations.map((v, i) => ({
        ...v,
        id: `v-${Date.now()}-${i}`,
        userStatus: '未完成'
      }))
    } else {
      variationQuestions = generateVariationQuestions(question, diagnosis)
    }

    const reviewPlan = generateReviewPlan(question)

    const updates = {
      diagnosis,
      guideSteps,
      variationQuestions,
      reviewPlan,
      status: '已诊断',
      progress: 20
    }

    updateWrongQuestion(question.id, updates)
    return updates
  }

  const regenerateVariations = async (questionId) => {
    const question = wrongQuestions.find(q => q.id === questionId)
    if (!question) return null

    const diagnosis = question.diagnosis || generateDiagnosis(question)
    const aiVariations = await callDoubaoForVariationQuestions(question, diagnosis)

    let variationQuestions
    if (aiVariations && aiVariations.length > 0) {
      variationQuestions = aiVariations.map((v, i) => ({
        ...v,
        id: `v-${Date.now()}-${i}`,
        userStatus: '未完成'
      }))
    } else {
      variationQuestions = generateVariationQuestions(question, diagnosis)
    }

    updateWrongQuestion(questionId, { variationQuestions })
    return variationQuestions
  }

  const advanceStatus = (questionId) => {
    const question = wrongQuestions.find(q => q.id === questionId)
    if (!question) return

    const statusFlow = ['未诊断', '已诊断', '引导中', '变式训练中', '待复测', '已掌握']
    const progressFlow = [0, 20, 40, 60, 80, 100]
    const currentIndex = statusFlow.indexOf(question.status)

    if (currentIndex < statusFlow.length - 1) {
      const newStatus = statusFlow[currentIndex + 1]
      const newProgress = progressFlow[currentIndex + 1]
      updateWrongQuestion(questionId, { status: newStatus, progress: newProgress })
    }
  }

  const toggleVariationStatus = (questionId, variationId, isCorrect) => {
    const question = wrongQuestions.find(q => q.id === questionId)
    if (!question || !question.variationQuestions) return

    const updatedVariations = question.variationQuestions.map(v =>
      v.id === variationId ? { ...v, userStatus: isCorrect ? '会做' : '还不会' } : v
    )

    const correctCount = updatedVariations.filter(v => v.userStatus === '会做').length

    let newStatus = question.status
    let newProgress = question.progress

    if (correctCount >= 2) {
      newStatus = '待复测'
      newProgress = 80
    } else {
      newStatus = '变式训练中'
      newProgress = 60
    }

    updateWrongQuestion(questionId, { 
      variationQuestions: updatedVariations,
      status: newStatus,
      progress: newProgress
    })
  }

  const value = {
    wrongQuestions,
    reviewTasks,
    theme,
    setTheme,
    selectedQuestion,
    addWrongQuestion,
    updateWrongQuestion,
    deleteWrongQuestion,
    updateReviewTask,
    deleteReviewTask,
    clearAllData,
    exportData,
    importData,
    navigateTo,
    processImageOCR,
    runAIDiagnosis,
    regenerateVariations,
    advanceStatus,
    toggleVariationStatus,
    generateReviewPlan,
    buildDoubaoOCRPrompt
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />
      case 'entry':
        return <WrongQuestionEntry />
      case 'list':
        return <WrongQuestionList />
      case 'detail':
        return <WrongQuestionDetail />
      case 'review':
        return <ReviewPlan />
      case 'profile':
        return <LearningProfile />
      case 'settings':
        return <Settings />
      case 'print':
        return <WrongQuestionPrint />
      default:
        return <Home />
    }
  }

  return (
    <AppContext.Provider value={value}>
      <div className="app-container">
        <Sidebar currentPage={currentPage} onNavigate={navigateTo} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </AppContext.Provider>
  )
}

export default App
