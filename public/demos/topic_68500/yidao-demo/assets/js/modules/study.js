/**
 * 易道 App - 易经书院模块
 */

const StudyModule = {
  currentLessonIndex: 0,
  
  render() {
    const container = document.getElementById('page-study');
    if (!container) return;
    
    container.innerHTML = `
      <div class="study-container">
        <h2 style="text-align:center;">易经书院</h2>
        <p style="text-align:center; color:var(--color-text-muted); margin-bottom:32px;">系统化学习，从入门到精通</p>
        
        <div class="course-grid" id="courseGrid">
          ${this.renderCourses()}
        </div>
      </div>
      
      <div class="modal-overlay" id="courseModal">
        <div class="modal study-modal">
          <div class="modal-header">
            <h3 id="courseTitle"></h3>
            <button class="modal-close" onclick="StudyModule.closeModal()">×</button>
          </div>
          <div class="modal-body" id="courseBody"></div>
        </div>
      </div>
    `;
    
    this.addStyles();
  },
  
  renderCourses() {
    return COURSES.map(course => {
      const lessonCount = course.lessons.length;
      return `
        <div class="course-card" onclick="StudyModule.openCourse('${course.id}')">
          <div class="course-badge">${course.levelIndex}</div>
          <div class="course-level">${course.level}</div>
          <h4>${course.title}</h4>
          <p>${course.description.substring(0, 50)}...</p>
          <div class="course-meta">
            <span>${course.duration}分钟</span>
            <span>${lessonCount}节课</span>
          </div>
        </div>
      `;
    }).join('');
  },
  
  openCourse(courseId) {
    const course = COURSES.find(c => c.id === courseId);
    if (!course) return;
    
    this.currentLessonIndex = 0;
    
    const modal = document.getElementById('courseModal');
    modal.classList.add('visible');
    
    document.getElementById('courseTitle').textContent = course.title;
    this.renderLesson(course);
  },
  
  renderLesson(course) {
    const lesson = course.lessons[this.currentLessonIndex];
    const totalLessons = course.lessons.length;
    const body = document.getElementById('courseBody');
    
    body.innerHTML = `
      <!-- 课时导航 -->
      <div class="lesson-nav">
        <span class="lesson-indicator">第 ${this.currentLessonIndex + 1} 节 / 共 ${totalLessons} 节</span>
        <div class="lesson-dots">
          ${course.lessons.map((_, i) => `
            <span class="lesson-dot ${i === this.currentLessonIndex ? 'active' : ''} ${i < this.currentLessonIndex ? 'done' : ''}" 
                  onclick="StudyModule.goToLesson('${course.id}', ${i})"></span>
          `).join('')}
        </div>
        <div class="lesson-arrows">
          <button class="btn btn-ghost btn-sm" ${this.currentLessonIndex === 0 ? 'disabled' : ''} 
                  onclick="StudyModule.goToLesson('${course.id}', ${this.currentLessonIndex - 1})">
            <i class="fas fa-chevron-left"></i> 上一节
          </button>
          <button class="btn btn-ghost btn-sm" ${this.currentLessonIndex >= totalLessons - 1 ? 'disabled' : ''} 
                  onclick="StudyModule.goToLesson('${course.id}', ${this.currentLessonIndex + 1})">
            下一节 <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
      
      <!-- 课时标题 -->
      <h4 class="lesson-title">${lesson.title}</h4>
      
      <!-- 课时内容 -->
      <div class="lesson-content">
        ${lesson.content}
      </div>
      
      <!-- 课后测验 -->
      <div class="quiz-section">
        <h4><i class="fas fa-pen"></i> 课后测验</h4>
        ${lesson.quiz.map((q, qi) => `
          <div class="quiz-item" id="quiz-${qi}">
            <p class="quiz-question">${qi + 1}. ${q.question}</p>
            <div class="quiz-options">
              ${q.options.map((opt, oi) => `
                <button class="btn btn-ghost quiz-opt" 
                        onclick="StudyModule.answerQuiz('${course.id}', ${qi}, ${oi}, ${q.answer})">
                  ${String.fromCharCode(65 + oi)}. ${opt}
                </button>
              `).join('')}
            </div>
            <div class="quiz-result" id="quizResult-${qi}"></div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  goToLesson(courseId, index) {
    const course = COURSES.find(c => c.id === courseId);
    if (!course || index < 0 || index >= course.lessons.length) return;
    this.currentLessonIndex = index;
    this.renderLesson(course);
  },
  
  answerQuiz(courseId, quizIndex, selected, correct) {
    const resultEl = document.getElementById(`quizResult-${quizIndex}`);
    const quizItem = document.getElementById(`quiz-${quizIndex}`);
    
    // 禁用该题所有选项
    quizItem.querySelectorAll('.quiz-opt').forEach((btn, i) => {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
      if (i === correct) {
        btn.style.background = 'var(--color-success)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--color-success)';
      } else if (i === selected && selected !== correct) {
        btn.style.background = 'var(--color-error)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--color-error)';
      }
    });
    
    if (selected === correct) {
      resultEl.innerHTML = '<p style="color:var(--color-success); margin-top:8px;"><i class="fas fa-check-circle"></i> 正确！</p>';
    } else {
      resultEl.innerHTML = `<p style="color:var(--color-error); margin-top:8px;"><i class="fas fa-times-circle"></i> 不正确，正确答案是 ${String.fromCharCode(65 + correct)}</p>`;
    }
  },
  
  closeModal() {
    const modal = document.getElementById('courseModal');
    if (modal) modal.classList.remove('visible');
  },
  
  addStyles() {
    const styles = `
      .study-container {
        max-width: 900px;
        margin: 0 auto;
      }
      
      .course-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
      }
      
      .course-card {
        background: var(--color-bg-card);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 20px;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .course-card:hover {
        border-color: var(--color-primary);
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);
      }
      
      .course-badge {
        width: 32px;
        height: 32px;
        background: var(--color-primary-dark);
        color: var(--color-bg);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;
        font-weight: 700;
        font-size: 0.9rem;
      }
      
      .course-level {
        font-size: 0.8rem;
        color: var(--color-text-muted);
        margin-bottom: 8px;
      }
      
      .course-card h4 {
        font-size: 1rem;
        color: var(--color-secondary);
        margin-bottom: 8px;
      }
      
      .course-card p {
        font-size: 0.85rem;
        color: var(--color-text-light);
        line-height: 1.5;
      }
      
      .course-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        font-size: 0.8rem;
        color: var(--color-text-muted);
      }
      
      /* 弹窗增强 */
      .study-modal {
        max-width: 720px;
        width: 95%;
        max-height: 85vh;
      }
      
      .study-modal .modal-body {
        padding: 0;
        max-height: calc(85vh - 70px);
        overflow-y: auto;
      }
      
      /* 课时导航 */
      .lesson-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        background: var(--color-bg-card);
        border-bottom: 1px solid var(--color-border);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      
      .lesson-indicator {
        font-size: 0.85rem;
        color: var(--color-text-muted);
        white-space: nowrap;
      }
      
      .lesson-dots {
        display: flex;
        gap: 8px;
      }
      
      .lesson-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--color-border);
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .lesson-dot.active {
        background: var(--color-primary);
        box-shadow: var(--shadow-glow);
        transform: scale(1.3);
      }
      
      .lesson-dot.done {
        background: var(--color-success);
      }
      
      .lesson-arrows {
        display: flex;
        gap: 8px;
      }
      
      .lesson-arrows button:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      
      /* 课时标题 */
      .lesson-title {
        text-align: center;
        padding: 20px 24px 12px;
        color: var(--color-secondary);
        font-size: 1.2rem;
        border-bottom: 1px solid var(--color-border-light);
        margin: 0;
      }
      
      /* 课时内容 - 居中显示 */
      .lesson-content {
        padding: 24px 32px;
        text-align: left;
        max-width: 640px;
        margin: 0 auto;
        line-height: 1.8;
        color: var(--color-text);
      }
      
      .lesson-content h3 {
        color: var(--color-secondary);
        font-size: 1.1rem;
        margin-top: 28px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--color-border-light);
      }
      
      .lesson-content h3:first-child {
        margin-top: 0;
      }
      
      .lesson-content p {
        margin-bottom: 12px;
        color: var(--color-text-light);
      }
      
      .lesson-content strong {
        color: var(--color-text);
      }
      
      .lesson-content ul {
        padding-left: 20px;
        margin-bottom: 16px;
      }
      
      .lesson-content ul li {
        margin-bottom: 8px;
        color: var(--color-text-light);
        line-height: 1.7;
      }
      
      .lesson-content ul li strong {
        color: var(--color-text);
      }
      
      /* 测验区域 */
      .quiz-section {
        padding: 20px 32px 28px;
        background: var(--color-bg-card);
        border-top: 1px solid var(--color-border);
        max-width: 640px;
        margin: 0 auto;
      }
      
      .quiz-section h4 {
        color: var(--color-secondary);
        margin-bottom: 16px;
        font-size: 1rem;
      }
      
      .quiz-item {
        margin-bottom: 20px;
      }
      
      .quiz-item:last-child {
        margin-bottom: 0;
      }
      
      .quiz-question {
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--color-text);
      }
      
      .quiz-options {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      
      .quiz-opt {
        font-size: 0.9rem !important;
        padding: 10px 14px !important;
        text-align: left !important;
        justify-content: flex-start !important;
      }
      
      .quiz-result {
        margin-top: 8px;
      }
      
      /* 响应式 */
      @media (max-width: 768px) {
        .course-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .lesson-content {
          padding: 20px 16px;
        }
        
        .quiz-section {
          padding: 16px;
        }
        
        .quiz-options {
          grid-template-columns: 1fr;
        }
        
        .lesson-arrows {
          display: none;
        }
      }
      
      @media (max-width: 480px) {
        .course-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    if (!document.getElementById('study-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'study-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }
};
