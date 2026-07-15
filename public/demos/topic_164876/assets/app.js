/**
 * 导游证考试智能助手 - 核心应用逻辑
 * 依赖全局变量: KNOWLEDGE_DATA, QUESTION_BANK
 */

(function() {
  'use strict';

  // ==================== 工具函数 ====================
  const Utils = {
    formatDate(date) {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    daysUntil(targetDate) {
      const target = new Date(targetDate);
      const today = new Date();
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    },

    shuffleArray(arr) {
      const array = [...arr];
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    getRandomItems(arr, count) {
      if (count >= arr.length) {
        return this.shuffleArray(arr);
      }
      const shuffled = this.shuffleArray(arr);
      return shuffled.slice(0, count);
    }
  };

  // ==================== 1. 数据管理模块 ====================
  const DataManager = {
    saveData(key, value) {
      try {
        localStorage.setItem(`tour_guide_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('保存数据失败:', e);
        return false;
      }
    },

    loadData(key, defaultValue) {
      try {
        const item = localStorage.getItem(`tour_guide_${key}`);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error('加载数据失败:', e);
        return defaultValue;
      }
    },

    clearData() {
      try {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('tour_guide_')) {
            localStorage.removeItem(key);
          }
        });
        return true;
      } catch (e) {
        console.error('清除数据失败:', e);
        return false;
      }
    },

    // 初始化默认数据
    initDefaultData() {
      if (!this.loadData('userProfile', null)) {
        this.saveData('userProfile', {
          name: '',
          examDate: '2026-11-21',
          dailyAvailableMinutes: 120,
          weakSubjects: []
        });
      }
      if (!this.loadData('studyProgress', null)) {
        this.saveData('studyProgress', {});
      }
      if (!this.loadData('wrongAnswers', null)) {
        this.saveData('wrongAnswers', []);
      }
      if (!this.loadData('quizHistory', null)) {
        this.saveData('quizHistory', []);
      }
      if (!this.loadData('studyLog', null)) {
        this.saveData('studyLog', []);
      }
    }
  };

  // ==================== 2. 学习规划模块 ====================
  const StudyPlanner = {
    generatePlan(examDate, dailyMinutes, progressData) {
      const remainingDays = Utils.daysUntil(examDate);
      const today = new Date();
      const plan = [];

      // 获取所有科目和权重
      const subjects = KNOWLEDGE_DATA.subjects || [];
      const totalWeight = subjects.reduce((sum, s) => sum + (s.weight || 1), 0);

      // 计算每个科目的总可用时间
      subjects.forEach(subject => {
        const completedChapters = (subject.chapters || []).filter(ch => 
          progressData[ch.id]?.completed
        ).length;
        const totalChapters = subject.chapters?.length || 0;
        const progress = totalChapters > 0 ? completedChapters / totalChapters : 0;
        const remainingWeight = (subject.weight || 1) * (1 - progress);
        subject.assignedMinutes = Math.round((remainingWeight / totalWeight) * dailyMinutes * remainingDays);
      });

      // 分配每日任务
      for (let i = 0; i < remainingDays; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = Utils.formatDate(currentDate);
        
        const dailyTasks = this._getDailyTasks(subjects, dailyMinutes, progressData);
        plan.push({
          date: dateStr,
          subjects: [...new Set(dailyTasks.tasks.map(t => t.subjectId))],
          chapters: dailyTasks.tasks.map(t => t.chapterId),
          tasks: dailyTasks.tasks.map(t => t.description),
          estimatedMinutes: dailyTasks.totalMinutes
        });
      }

      return plan;
    },

    _getDailyTasks(subjects, dailyMinutes, progressData) {
      let remainingMinutes = dailyMinutes;
      const tasks = [];

      // 优先分配给未完成的薄弱章节
      const sortedSubjects = [...subjects].sort((a, b) => b.assignedMinutes - a.assignedMinutes);
      
      sortedSubjects.forEach(subject => {
        if (remainingMinutes <= 0) return;
        
        const availableChapters = (subject.chapters || []).filter(ch => 
          !progressData[ch.id]?.completed
        );

        availableChapters.forEach(chapter => {
          if (remainingMinutes <= 0) return;
          const chapterMinutes = Math.min(chapter.estimatedMinutes || 30, remainingMinutes);
          tasks.push({
            subjectId: subject.id,
            chapterId: chapter.id,
            description: `学习${subject.name} - ${chapter.title}`,
            estimatedMinutes: chapterMinutes
          });
          remainingMinutes -= chapterMinutes;
        });
      });

      // 如果还有剩余时间，添加复习任务
      if (remainingMinutes > 0 && tasks.length > 0) {
        tasks.push({
          subjectId: 'review',
          chapterId: 'daily-review',
          description: '复习今日所学内容+错题练习',
          estimatedMinutes: remainingMinutes
        });
      }

      return { tasks, totalMinutes: dailyMinutes - remainingMinutes };
    },

    getTodayPlan() {
      const userProfile = DataManager.loadData('userProfile', null);
      const studyProgress = DataManager.loadData('studyProgress', {});
      
      if (!userProfile) return null;
      
      const allPlans = this.generatePlan(
        userProfile.examDate,
        userProfile.dailyAvailableMinutes,
        studyProgress
      );
      
      const todayStr = Utils.formatDate(new Date());
      return allPlans.find(p => p.date === todayStr) || allPlans[0];
    },

    getWeeklyPlan() {
      const userProfile = DataManager.loadData('userProfile', null);
      const studyProgress = DataManager.loadData('studyProgress', {});
      
      if (!userProfile) return [];
      
      const allPlans = this.generatePlan(
        userProfile.examDate,
        userProfile.dailyAvailableMinutes,
        studyProgress
      );
      
      const today = new Date();
      const weekLater = new Date(today);
      weekLater.setDate(today.getDate() + 7);
      
      return allPlans.filter(p => {
        const planDate = new Date(p.date);
        return planDate >= today && planDate <= weekLater;
      });
    }
  };

  // ==================== 3. 刷题引擎 ====================
  const QuizEngine = {
    getQuestionsBySubject(subjectId, count) {
      const questions = QUESTION_BANK.filter(q => q.subjectId === subjectId);
      return Utils.getRandomItems(questions, count);
    },

    getQuestionsByChapter(chapterId, count) {
      const questions = QUESTION_BANK.filter(q => q.chapterId === chapterId);
      return Utils.getRandomItems(questions, count);
    },

    getMockExam() {
      // 真实考试配比: 单选60% + 多选20% + 判断20%，共50题
      const singleCount = Math.round(50 * 0.6); // 30题
      const multipleCount = Math.round(50 * 0.2); // 10题
      const judgeCount = 50 - singleCount - multipleCount; // 10题

      const singleQuestions = Utils.getRandomItems(
        QUESTION_BANK.filter(q => q.type === 'single'),
        singleCount
      );
      const multipleQuestions = Utils.getRandomItems(
        QUESTION_BANK.filter(q => q.type === 'multiple'),
        multipleCount
      );
      const judgeQuestions = Utils.getRandomItems(
        QUESTION_BANK.filter(q => q.type === 'judge'),
        judgeCount
      );

      return Utils.shuffleArray([
        ...singleQuestions,
        ...multipleQuestions,
        ...judgeQuestions
      ]);
    },

    getWrongQuestions() {
      const wrongAnswers = DataManager.loadData('wrongAnswers', []);
      return wrongAnswers.map(wa => {
        const question = QUESTION_BANK.find(q => q.id === wa.questionId);
        return { ...question, userAnswer: wa.userAnswer, reviewed: wa.reviewed };
      }).filter(q => q);
    },

    checkAnswer(questionId, userAnswer) {
      const question = QUESTION_BANK.find(q => q.id === questionId);
      if (!question) {
        return { correct: false, correctAnswer: null, explanation: '题目不存在' };
      }

      let correct = false;
      if (question.type === 'multiple') {
        // 多选题需要排序后比较
        const userSorted = Array.isArray(userAnswer) ? [...userAnswer].sort().join(',') : '';
        const correctSorted = [...question.correctAnswer].sort().join(',');
        correct = userSorted === correctSorted;
      } else {
        correct = userAnswer === question.correctAnswer;
      }

      // 保存错题
      if (!correct) {
        const wrongAnswers = DataManager.loadData('wrongAnswers', []);
        wrongAnswers.push({
          questionId,
          userAnswer,
          timestamp: Date.now(),
          reviewed: false
        });
        DataManager.saveData('wrongAnswers', wrongAnswers);
      }

      // 记录答题历史
      const quizHistory = DataManager.loadData('quizHistory', []);
      quizHistory.push({
        date: Utils.formatDate(new Date()),
        subject: question.subjectId,
        score: correct ? 1 : 0,
        total: 1,
        type: 'practice'
      });
      DataManager.saveData('quizHistory', quizHistory);

      return {
        correct,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '暂无解析'
      };
    },

    getQuestionsByDifficulty(difficulty, count) {
      // difficulty: 1-5, 5最难
      const questions = QUESTION_BANK.filter(q => q.difficulty === difficulty);
      return Utils.getRandomItems(questions, count);
    },

    getWeakAreaQuestions(count = 20) {
      const weakSubjects = WrongAnswerAnalyzer.getWeakSubjects();
      let questions = [];

      if (weakSubjects.length > 0) {
        // 从薄弱科目中抽题
        weakSubjects.forEach(ws => {
          const subjectQuestions = QUESTION_BANK.filter(q => q.subjectId === ws.subjectId);
          questions = questions.concat(subjectQuestions);
        });
      } else {
        // 如果没有薄弱科目，从错题中抽
        questions = this.getWrongQuestions();
      }

      if (questions.length === 0) {
        // 如果还是没有，随机抽题
        questions = QUESTION_BANK;
      }

      return Utils.getRandomItems(questions, Math.min(count, questions.length));
    }
  };

  // ==================== 4. 错题分析模块 ====================
  const WrongAnswerAnalyzer = {
    getWrongAnswerStats() {
      const wrongAnswers = DataManager.loadData('wrongAnswers', []);
      const bySubject = {};
      
      wrongAnswers.forEach(wa => {
        const question = QUESTION_BANK.find(q => q.id === wa.questionId);
        if (question) {
          const subjectId = question.subjectId;
          if (!bySubject[subjectId]) {
            bySubject[subjectId] = 0;
          }
          bySubject[subjectId]++;
        }
      });

      // 找出常见错误类型
      const mistakeTypes = {};
      wrongAnswers.forEach(wa => {
        const question = QUESTION_BANK.find(q => q.id === wa.questionId);
        if (question && question.category) {
          if (!mistakeTypes[question.category]) {
            mistakeTypes[question.category] = 0;
          }
          mistakeTypes[question.category]++;
        }
      });

      const commonMistakes = Object.entries(mistakeTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      return {
        total: wrongAnswers.length,
        bySubject,
        commonMistakes,
        unreviewed: wrongAnswers.filter(wa => !wa.reviewed).length
      };
    },

    getWeakSubjects() {
      const stats = this.getWrongAnswerStats();
      const totalQuestionsBySubject = {};
      
      // 统计每个科目总题数
      QUESTION_BANK.forEach(q => {
        const subjectId = q.subjectId;
        if (!totalQuestionsBySubject[subjectId]) {
          totalQuestionsBySubject[subjectId] = 0;
        }
        totalQuestionsBySubject[subjectId]++;
      });

      return Object.entries(stats.bySubject)
        .map(([subjectId, wrongCount]) => {
          const totalCount = totalQuestionsBySubject[subjectId] || wrongCount;
          const errorRate = wrongCount / totalCount;
          const subject = KNOWLEDGE_DATA.subjects?.find(s => s.id === subjectId);
          return {
            subjectId,
            subjectName: subject?.name || subjectId,
            wrongCount,
            totalCount,
            errorRate
          };
        })
        .sort((a, b) => b.errorRate - a.errorRate);
    },

    getKnowledgeGaps() {
      const wrongAnswers = DataManager.loadData('wrongAnswers', []);
      const categoryErrors = {};

      wrongAnswers.forEach(wa => {
        const question = QUESTION_BANK.find(q => q.id === wa.questionId);
        if (question && question.category) {
          if (!categoryErrors[question.category]) {
            categoryErrors[question.category] = 0;
          }
          categoryErrors[question.category]++;
        }
      });

      return Object.entries(categoryErrors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, errorCount: count }));
    },

    markAsReviewed(questionId) {
      const wrongAnswers = DataManager.loadData('wrongAnswers', []);
      const updated = wrongAnswers.map(wa => {
        if (wa.questionId === questionId) {
          return { ...wa, reviewed: true };
        }
        return wa;
      });
      DataManager.saveData('wrongAnswers', updated);
      return true;
    }
  };

  // ==================== 5. 面试模拟模块 ====================
  const InterviewSimulator = {
    topics: [
      { type: '讲解', title: '请讲解北京故宫太和殿', keywords: ['故宫', '太和殿', '皇帝', '金銮殿', '最高', '建筑', '礼制', '中和', '保和'] },
      { type: '讲解', title: '请讲解八达岭长城', keywords: ['长城', '八达岭', '明长城', '北京', '居庸关', '雄伟', '防御', '秦始皇'] },
      { type: '讲解', title: '请讲解杭州西湖', keywords: ['西湖', '杭州', '断桥', '雷峰塔', '西湖十景', '白居易', '苏轼', '文化遗产'] },
      { type: '讲解', title: '请讲解西安兵马俑', keywords: ['兵马俑', '西安', '秦始皇', '陵墓', '陶俑', '世界遗产', '考古', '秦朝'] },
      { type: '讲解', title: '请讲解桂林漓江', keywords: ['桂林', '漓江', '山水', '喀斯特', '阳朔', '甲天下', '坐船', '风景'] },
      { type: '讲解', title: '请讲解安徽黄山', keywords: ['黄山', '奇松', '怪石', '云海', '温泉', '迎客松', '五岳', '安徽'] },
      { type: '讲解', title: '请讲解苏州园林', keywords: ['苏州', '园林', '江南', '假山', '亭台楼阁', '造园艺术', '世界遗产', '文人'] },
      { type: '讲解', title: '请讲解四川九寨沟', keywords: ['九寨沟', '四川', '阿坝', '水景', '湖泊', '瀑布', '藏族', '自然保护区'] }
    ],

    emergencyQuestions: [
      { type: '应变', title: '游客在游览过程中突然晕倒，你应该怎么办？', keywords: ['冷静', '呼救', '平卧', '通风', '求助医生', '联系旅行社', '照顾其他游客', '记录'] },
      { type: '应变', title: '游客不慎丢失了护照和行李，你如何处理？', keywords: ['安慰', '报案', '联系派出所', '联系航空公司', '通知使馆', '补办手续', '协助', '记录'] },
      { type: '应变', title: '旅游大巴在高速路上抛锚了，距离目的地还有很远，你怎么办？', keywords: ['报警', '联系救援', '疏散游客到安全区域', '联系旅行社调车', '安抚游客', '安排休息', '通报情况'] },
      { type: '应变', title: '游客之间发生了激烈争吵甚至打架，你如何处理？', keywords: ['劝阻', '隔离', '了解原因', '调解', '劝解', '维护秩序', '报告', '记录'] },
      { type: '应变', title: '抵达饭店后游客发现自己的行李不见了，你怎么办？', keywords: ['寻找', '问行李员', '问机场', '问前一站', '帮找', '安慰', '准备必要物品', '记录'] },
      { type: '应变', title: '游客对餐厅饭菜非常不满意，集体抗议要求换餐厅，你怎么办？', keywords: ['倾听', '道歉', '联系餐厅改进', '沟通解释', '协调', '汇报旅行社', '安抚', '解决'] },
      { type: '应变', title: '天气突变发生洪水，道路被阻断，你如何应对？', keywords: ['转移', '高地', '安全区域', '报警', '联系救援', '清点人数', '安抚', '等待救援'] }
    ],

    standardQuestions: [
      { type: '规范', title: '一篇完整的欢迎词应该包括哪些内容？', keywords: ['欢迎', '自我介绍', '司机', '行程介绍', '祝愿', '提醒', '注意事项', '欢迎词'] },
      { type: '规范', title: '送团前导游员需要做好哪些准备工作？', keywords: ['确认交通', '确认行程', '提醒游客', '结清账目', '归还物品', '总结', '征求意见', '送别'] },
      { type: '规范', title: '导游接站服务主要包括哪些工作内容？', keywords: ['提前抵达', '认找旅游团', '核实人数', '集合登车', '介绍行程', '欢迎词', '提醒', '接站'] },
      { type: '规范', title: '导游人员在带团过程中如何预防游客走失？', keywords: ['提醒', '告知', '记信息', '时刻清点人数', '集中活动', '提前说明', '掉队', '预防'] },
      { type: '规范', title: '导游讲解时常用的讲解方法有哪些？', keywords: ['分段讲解', '突出重点', '触景生情', '虚实结合', '问答法', '制造悬念', '类比法', '总结'] }
    ],

    getRandomInterviewTopic() {
      return Utils.getRandomItems(this.topics, 1)[0];
    },

    getRandomEmergencyQuestion() {
      return Utils.getRandomItems(this.emergencyQuestions, 1)[0];
    },

    getRandomStandardQuestion() {
      return Utils.getRandomItems(this.standardQuestions, 1)[0];
    },

    rateAnswer(questionType, answer, duration) {
      let question;
      let keywords = [];
      
      switch (questionType) {
        case '讲解':
          question = this.topics.find(t => t.title === answer) || this.getRandomInterviewTopic();
          keywords = question.keywords;
          break;
        case '应变':
          question = this.emergencyQuestions.find(q => q.title === answer) || this.getRandomEmergencyQuestion();
          keywords = question.keywords;
          break;
        case '规范':
          question = this.standardQuestions.find(q => q.title === answer) || this.getRandomStandardQuestion();
          keywords = question.keywords;
          break;
        default:
          return { score: 0, feedback: '未知题目类型', suggestions: [] };
      }

      // 关键词匹配度评分
      const answerLower = answer.toLowerCase();
      const matchedKeywords = keywords.filter(k => 
        answerLower.includes(k.toLowerCase())
      );
      const keywordScore = (matchedKeywords.length / keywords.length) * 70;

      // 根据回答长度评估完整性
      const words = answer.trim().split(/\s+/).length;
      let lengthScore = 0;
      if (words >= 100) {
        lengthScore = 20;
      } else if (words >= 50) {
        lengthScore = 15;
      } else if (words >= 20) {
        lengthScore = 8;
      } else {
        lengthScore = 3;
      }

      // 根据时长调整
      let timeScore = 0;
      if (questionType === '讲解') {
        // 讲解建议2-5分钟
        if (duration >= 120 && duration <= 300) {
          timeScore = 10;
        } else if (duration >= 60 && duration <= 400) {
          timeScore = 5;
        }
      } else {
        // 问答建议30秒-2分钟
        if (duration >= 30 && duration <= 120) {
          timeScore = 10;
        } else if (duration >= 20 && duration <= 180) {
          timeScore = 5;
        }
      }

      const totalScore = Math.round(keywordScore + lengthScore + timeScore);
      const clampedScore = Math.max(0, Math.min(100, totalScore));

      // 生成反馈和建议
      let feedback = '';
      const suggestions = [];

      if (clampedScore >= 80) {
        feedback = '回答非常优秀！要点完整，逻辑清晰。';
      } else if (clampedScore >= 60) {
        feedback = '回答良好，但还有提升空间。';
        if (matchedKeywords.length < keywords.length * 0.7) {
          suggestions.push('可以增加更多专业知识点');
        }
      } else if (clampedScore >= 40) {
        feedback = '回答基本合格，但要点不全。';
        suggestions.push('建议多背诵关键要点');
        suggestions.push('增加回答的完整性和逻辑性');
      } else {
        feedback = '需要加强练习，掌握答题要点。';
        suggestions.push('认真学习相关规范要求');
        suggestions.push('多进行模拟练习');
        suggestions.push('重点记忆核心答题步骤');
      }

      if (duration < 30 && questionType !== '讲解') {
        suggestions.push('回答过于仓促，建议展开阐述你的思路');
      } else if (duration > 300 && questionType !== '讲解') {
        suggestions.push('回答偏长，注意简洁突出要点');
      }

      // 添加未覆盖知识点建议
      const missingKeywords = keywords.filter(k => !matchedKeywords.includes(k));
      if (missingKeywords.length > 0 && missingKeywords.length <= 5) {
        suggestions.push(`还可以提到这些要点：${missingKeywords.join('、')}`);
      }

      return {
        score: clampedScore,
        feedback,
        suggestions
      };
    },

    getInterviewQuestions() {
      return [
        ...this.topics,
        ...this.emergencyQuestions,
        ...this.standardQuestions
      ];
    }
  };

  // ==================== 6. 学习分析模块 ====================
  const StudyAnalyzer = {
    getSubjectMastery() {
      const studyProgress = DataManager.loadData('studyProgress', {});
      const subjects = KNOWLEDGE_DATA.subjects || [];
      const result = [];

      subjects.forEach(subject => {
        const chapters = subject.chapters || [];
        if (chapters.length === 0) {
          result.push({
            subjectId: subject.id,
            subjectName: subject.name,
            mastery: 0
          });
          return;
        }

        let totalScore = 0;
        let completedCount = 0;

        chapters.forEach(chapter => {
          const progress = studyProgress[chapter.id];
          if (progress) {
            totalScore += progress.score || 0;
            completedCount++;
          }
        });

        const mastery = completedCount > 0 
          ? Math.round(totalScore / completedCount) 
          : 0;

        result.push({
          subjectId: subject.id,
          subjectName: subject.name,
          mastery,
          totalChapters: chapters.length,
          completedChapters: completedCount
        });
      });

      return result;
    },

    getChapterProgress() {
      const studyProgress = DataManager.loadData('studyProgress', {});
      const result = [];

      KNOWLEDGE_DATA.subjects?.forEach(subject => {
        subject.chapters?.forEach(chapter => {
          const progress = studyProgress[chapter.id] || { completed: false, score: 0, timeSpent: 0 };
          result.push({
            chapterId: chapter.id,
            chapterName: chapter.title,
            subjectId: subject.id,
            subjectName: subject.name,
            completed: progress.completed,
            score: progress.score || 0,
            timeSpent: progress.timeSpent || 0
          });
        });
      });

      return result;
    },

    getScoreTrend(days = 30) {
      const quizHistory = DataManager.loadData('quizHistory', []);
      const trend = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = Utils.formatDate(date);
        
        const dayQuizzes = quizHistory.filter(qh => qh.date === dateStr);
        if (dayQuizzes.length > 0) {
          const totalScore = dayQuizzes.reduce((sum, qh) => sum + qh.score, 0);
          const totalQuestions = dayQuizzes.reduce((sum, qh) => sum + qh.total, 0);
          const avgScore = totalQuestions > 0 ? (totalScore / totalQuestions) * 100 : 0;
          trend.push({ date: dateStr, averageScore: Math.round(avgScore), totalQuestions });
        } else {
          trend.push({ date: dateStr, averageScore: null, totalQuestions: 0 });
        }
      }

      return trend;
    },

    getEstimatedScore() {
      const masteryData = this.getSubjectMastery();
      if (masteryData.length === 0) return 0;

      // 加权计算
      let totalWeightedScore = 0;
      let totalWeight = 0;

      masteryData.forEach(m => {
        const subject = KNOWLEDGE_DATA.subjects.find(s => s.id === m.subjectId);
        const weight = subject?.weight || 1;
        totalWeightedScore += m.mastery * weight;
        totalWeight += weight;
      });

      const estimatedScore = Math.round(totalWeightedScore / totalWeight);
      
      // 根据错题率调整
      const stats = WrongAnswerAnalyzer.getWrongAnswerStats();
      const totalQuestions = QUESTION_BANK.length;
      if (totalQuestions > 0 && stats.total > 0) {
        const errorRate = stats.total / totalQuestions;
        // 错误率越高，预估分数越低
        return Math.round(estimatedScore * (1 - errorRate * 0.3));
      }

      return estimatedScore;
    },

    getRecommendations() {
      const recommendations = [];
      const masteryData = this.getSubjectMastery();
      const weakSubjects = WrongAnswerAnalyzer.getWeakSubjects();
      const wrongStats = WrongAnswerAnalyzer.getWrongAnswerStats();
      const knowledgeGaps = WrongAnswerAnalyzer.getKnowledgeGaps();

      // 建议1: 薄弱科目重点学习
      if (weakSubjects.length > 0) {
        const topWeak = weakSubjects[0];
        recommendations.push({
          type: 'priority',
          title: `重点加强「${topWeak.subjectName}」`,
          description: `该科目错误率达到${Math.round(topWeak.errorRate * 100)}%，建议多花时间复习知识点并针对性刷题`
        });
      }

      // 建议2: 复习错题
      if (wrongStats.unreviewed > 0) {
        recommendations.push({
          type: 'action',
          title: `复习${wrongStats.unreviewed}道未复习错题`,
          description: '错题是最好的复习资料，及时复习能避免重复犯错'
        });
      }

      // 建议3: 知识缺口
      if (knowledgeGaps.length > 0) {
        recommendations.push({
          type: 'knowledge',
          title: `重点补全「${knowledgeGaps[0].category}」知识点`,
          description: '该知识点错误率最高，建议回归教材重新学习'
        });
      }

      // 建议4: 根据掌握度给出
      const lowMastery = masteryData.filter(m => m.mastery < 50);
      lowMastery.slice(0, 2).forEach(m => {
        recommendations.push({
          type: 'study',
          title: `完成「${m.subjectName}」剩余${m.totalChapters - m.completedChapters}个章节`,
          description: '该科目整体掌握度偏低，建议按计划完成学习'
        });
      });

      // 默认建议
      if (recommendations.length === 0) {
        recommendations.push({
          type: 'general',
          title: '保持每日学习节奏',
          description: '你目前学习状况良好，保持每天练习即可'
        });
      }

      return recommendations;
    },

    getRadarData() {
      const masteryData = this.getSubjectMastery();
      return masteryData.map(m => ({
        subject: m.subjectName,
        value: m.mastery
      }));
    }
  };

  // ==================== 导出到全局 ====================
  window.App = {
    DataManager,
    StudyPlanner,
    QuizEngine,
    WrongAnswerAnalyzer,
    InterviewSimulator,
    StudyAnalyzer,
    Utils
  };

  // 初始化默认数据
  DataManager.initDefaultData();

  console.log('导游证考试智能助手已加载');

})();