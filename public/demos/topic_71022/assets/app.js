class App {
  constructor() {
    this.userState = { ...MOCK_DATA.initialUserState };
    this.levels = JSON.parse(JSON.stringify(MOCK_DATA.levels));
    this.currentQuiz = null;
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizAnswers = [];
    this.init();
  }

  init() {
    this.bindNavEvents();
    this.bindTabEvents();
    this.bindPlanetEvents();
    this.bindQuizEvents();
    this.bindDonationEvents();
    this.renderHome();
    this.renderPlanet();
    this.renderLibrary();
    this.renderLeaderboard();
    this.renderDonations();
    this.updateStats();
  }

  bindNavEvents() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const page = e.target.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`page-${page}`).classList.add('active');
      });
    });
  }

  bindTabEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const container = e.target.closest('.library-tabs, .leaderboard-tabs');
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        const tab = e.target.dataset.tab;
        const contentClass = container.classList.contains('library-tabs') ? 'tab-content' : 'leaderboard-content';
        container.parentElement.querySelectorAll(`.${contentClass}`).forEach(c => c.classList.remove('active'));
        container.parentElement.querySelector(`#${container.classList.contains('library-tabs') ? 'tab-' : 'leaderboard-'}${tab}`).classList.add('active');
      });
    });
  }

  bindPlanetEvents() {
    document.getElementById('btn-plant').addEventListener('click', () => this.plantTree());
    document.getElementById('btn-water').addEventListener('click', () => this.waterTree());
    document.getElementById('btn-fertilize').addEventListener('click', () => this.fertilizeTree());
    document.getElementById('close-quiz').addEventListener('click', () => this.closeQuiz());
    document.getElementById('btn-quiz-next').addEventListener('click', () => this.nextQuestion());
    document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
  }

  bindQuizEvents() {
    document.getElementById('levels-grid').addEventListener('click', (e) => {
      const levelBtn = e.target.closest('.level-btn');
      if (levelBtn) {
        const levelId = levelBtn.dataset.level;
        this.startQuiz(levelId);
      }
    });
  }

  bindDonationEvents() {
    document.getElementById('projects-grid').addEventListener('click', (e) => {
      const donateBtn = e.target.closest('.donate-btn');
      if (donateBtn) {
        const projectId = parseInt(donateBtn.dataset.project);
        this.donate(projectId);
      }
    });
  }

  updateStats() {
    document.getElementById('home-prosperity').textContent = this.userState.prosperity;
    document.getElementById('home-trees').textContent = this.userState.trees.length;
    document.getElementById('home-donations').textContent = this.userState.donations.reduce((sum, d) => sum + d.amount, 0) / 100;
    document.getElementById('home-streak').textContent = this.userState.streak;
    document.getElementById('my-prosperity').textContent = this.userState.prosperity;
    document.getElementById('donation-energy').textContent = this.userState.prosperity;
    document.getElementById('planet-level').textContent = Math.floor(this.userState.prosperity / 500) + 1;
    this.updateRank();
  }

  updateRank() {
    const leaderboard = [...MOCK_DATA.leaderboard.personal];
    leaderboard.push({ id: 'me', name: '我的微光', avatar: '👤', prosperity: this.userState.prosperity });
    leaderboard.sort((a, b) => b.prosperity - a.prosperity);
    const myRank = leaderboard.findIndex(item => item.id === 'me') + 1;
    document.getElementById('my-rank').textContent = myRank;
  }

  renderHome() {
    this.renderActions();
    this.renderAchievements();
    this.renderChallenge();
  }

  renderActions() {
    const container = document.getElementById('action-grid');
    container.innerHTML = MOCK_DATA.actions.map(action => {
      const isCompleted = this.userState.todayCheckins.includes(action.id);
      return `
        <div class="action-card">
          <div class="action-icon">${action.icon}</div>
          <div class="action-name">${action.name}</div>
          <div class="action-score">+${action.score} 繁荣度</div>
          <button class="action-btn ${isCompleted ? 'completed' : ''}" 
                  ${isCompleted ? 'disabled' : ''}
                  data-action="${action.id}"
                  data-score="${action.score}"
                  onclick="app.checkin('${action.id}', ${action.score})">
            ${isCompleted ? '✅ 已完成' : '打卡'}
          </button>
        </div>
      `;
    }).join('');
  }

  checkin(actionId, score) {
    if (this.userState.todayCheckins.includes(actionId)) return;
    this.userState.todayCheckins.push(actionId);
    this.userState.prosperity += score;
    this.userState.totalCheckins++;
    this.userState.streak++;
    this.updateChallengeProgress();
    this.checkAchievements();
    this.renderActions();
    this.updateStats();
    this.showToast('🎉', `打卡成功！获得 ${score} 繁荣度`);
  }

  updateChallengeProgress() {
    const challenge = MOCK_DATA.challenges.find(c => c.id === this.userState.currentChallenge.id);
    if (challenge) {
      this.userState.currentChallenge.progress++;
      if (this.userState.currentChallenge.progress >= challenge.target) {
        this.userState.prosperity += challenge.reward;
        this.showToast('🏆', `挑战完成！获得 ${challenge.reward} 繁荣度奖励`);
        const nextChallenge = MOCK_DATA.challenges[Math.floor(Math.random() * MOCK_DATA.challenges.length)];
        this.userState.currentChallenge = { id: nextChallenge.id, progress: 0 };
      }
      this.renderChallenge();
      this.updateStats();
    }
  }

  renderAchievements() {
    const container = document.getElementById('achievement-grid');
    container.innerHTML = MOCK_DATA.achievements.map(achievement => {
      const isUnlocked = this.userState.achievements.includes(achievement.id);
      const progress = this.getAchievementProgress(achievement);
      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon">${isUnlocked ? achievement.icon : '🔒'}</div>
          <div class="achievement-name">${achievement.name}</div>
          ${!isUnlocked && progress < 100 ? `<div class="achievement-progress">进度: ${progress}%</div>` : ''}
        </div>
      `;
    }).join('');
  }

  getAchievementProgress(achievement) {
    const condition = achievement.condition;
    if (condition.checkins) return Math.min(100, Math.floor((this.userState.totalCheckins / condition.checkins) * 100));
    if (condition.streak) return Math.min(100, Math.floor((this.userState.streak / condition.streak) * 100));
    if (condition.trees) return Math.min(100, Math.floor((this.userState.trees.length / condition.trees) * 100));
    if (condition.actionTypes) return Math.min(100, Math.floor((this.userState.todayCheckins.length / condition.actionTypes) * 100));
    if (condition.prosperity) return Math.min(100, Math.floor((this.userState.prosperity / condition.prosperity) * 100));
    if (condition.donations) return Math.min(100, Math.floor((this.userState.donations.length / condition.donations) * 100));
    if (condition.donationAmount) {
      const totalDonated = this.userState.donations.reduce((sum, d) => sum + d.amount, 0);
      return Math.min(100, Math.floor((totalDonated / condition.donationAmount) * 100));
    }
    if (condition.quizLevels) return Math.min(100, Math.floor((this.userState.completedLevels.length / condition.quizLevels) * 100));
    return 0;
  }

  checkAchievements() {
    MOCK_DATA.achievements.forEach(achievement => {
      if (this.userState.achievements.includes(achievement.id)) return;
      const condition = achievement.condition;
      let unlocked = false;
      if (condition.checkins && this.userState.totalCheckins >= condition.checkins) unlocked = true;
      if (condition.streak && this.userState.streak >= condition.streak) unlocked = true;
      if (condition.trees && this.userState.trees.length >= condition.trees) unlocked = true;
      if (condition.actionTypes && this.userState.todayCheckins.length >= condition.actionTypes) unlocked = true;
      if (condition.prosperity && this.userState.prosperity >= condition.prosperity) unlocked = true;
      if (condition.donations && this.userState.donations.length >= condition.donations) unlocked = true;
      if (condition.donationAmount) {
        const totalDonated = this.userState.donations.reduce((sum, d) => sum + d.amount, 0);
        if (totalDonated >= condition.donationAmount) unlocked = true;
      }
      if (condition.quizLevels && this.userState.completedLevels.length >= condition.quizLevels) unlocked = true;
      if (unlocked) {
        this.userState.achievements.push(achievement.id);
        this.showToast('🏅', `恭喜解锁成就：${achievement.name}`);
      }
    });
    this.renderAchievements();
  }

  renderChallenge() {
    const container = document.getElementById('challenge-card');
    const challenge = MOCK_DATA.challenges.find(c => c.id === this.userState.currentChallenge.id);
    if (!challenge) return;
    const progress = this.userState.currentChallenge.progress;
    const percentage = Math.min(100, Math.floor((progress / challenge.target) * 100));
    container.innerHTML = `
      <div class="challenge-header">
        <div class="challenge-name">${challenge.name}</div>
        <div class="challenge-reward">奖励: ${challenge.reward} 繁荣度</div>
      </div>
      <div class="challenge-progress-bar">
        <div class="challenge-progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="challenge-progress-text">${challenge.description} · ${progress}/${challenge.target}</div>
    `;
  }

  renderPlanet() {
    const container = document.getElementById('tree-list');
    container.innerHTML = this.userState.trees.map(tree => {
      const species = TREE_SPECIES[tree.species];
      const stageIndex = this.getStageIndex(tree.stage);
      return `
        <div class="tree-card">
          <div class="tree-header">
            <div class="tree-icon">${species.icon}</div>
            <div class="tree-stage">${species.stages[stageIndex]}</div>
          </div>
          <div class="tree-progress-bar">
            <div class="tree-progress-fill" style="width: ${tree.progress}%"></div>
          </div>
          <div class="tree-progress-text">成长进度: ${tree.progress}%</div>
        </div>
      `;
    }).join('');
  }

  getStageIndex(stage) {
    const stages = ['seed', 'sprout', 'sapling', 'tree', 'blooming', 'ancient'];
    return stages.indexOf(stage);
  }

  plantTree() {
    if (this.userState.prosperity < 100) {
      this.showToast('⚠️', '繁荣度不足，需要100繁荣度种植新树');
      return;
    }
    this.userState.prosperity -= 100;
    const species = Object.keys(TREE_SPECIES)[Math.floor(Math.random() * Object.keys(TREE_SPECIES).length)];
    this.userState.trees.push({
      id: Date.now(),
      species,
      stage: 'seed',
      progress: 0,
      plantedAt: new Date().toISOString().split('T')[0],
    });
    this.renderPlanet();
    this.updateStats();
    this.checkAchievements();
    this.showToast('🌱', '成功种植一棵新树！');
  }

  waterTree() {
    if (this.userState.trees.length === 0) {
      this.showToast('⚠️', '还没有树木，请先种植');
      return;
    }
    const randomTree = this.userState.trees[Math.floor(Math.random() * this.userState.trees.length)];
    this.updateTreeProgress(randomTree, 5);
    this.showToast('💧', `给${TREE_SPECIES[randomTree.species].name}浇水，成长+5%`);
  }

  fertilizeTree() {
    if (this.userState.trees.length === 0) {
      this.showToast('⚠️', '还没有树木，请先种植');
      return;
    }
    if (this.userState.prosperity < 20) {
      this.showToast('⚠️', '繁荣度不足，需要20繁荣度施肥');
      return;
    }
    this.userState.prosperity -= 20;
    const randomTree = this.userState.trees[Math.floor(Math.random() * this.userState.trees.length)];
    this.updateTreeProgress(randomTree, 15);
    this.showToast('🌿', `给${TREE_SPECIES[randomTree.species].name}施肥，成长+15%`);
  }

  updateTreeProgress(tree, gain) {
    tree.progress = Math.min(100, tree.progress + gain);
    if (tree.progress >= 100) {
      const stages = ['seed', 'sprout', 'sapling', 'tree', 'blooming', 'ancient'];
      const currentIndex = stages.indexOf(tree.stage);
      if (currentIndex < stages.length - 1) {
        tree.stage = stages[currentIndex + 1];
        tree.progress = 0;
        this.showToast('🌳', `${TREE_SPECIES[tree.species].name}升级了！`);
      }
    }
    this.renderPlanet();
    this.updateStats();
    this.checkAchievements();
  }

  renderLibrary() {
    const container = document.getElementById('levels-grid');
    container.innerHTML = this.levels.map(level => {
      const isCompleted = this.userState.completedLevels.includes(level.id);
      return `
        <div class="level-card ${level.unlocked ? '' : 'locked'}">
          <div class="level-header">
            <div class="level-icon">${level.icon}</div>
            <div class="level-difficulty ${level.difficulty}">${DIFFICULTY_LABELS[level.difficulty]}</div>
          </div>
          <div class="level-name">${level.name}</div>
          <div class="level-desc">${level.description}</div>
          <div class="level-stats">
            <span>题目: ${level.questionCount}</span>
            <span>奖励: ${level.rewardScore}</span>
          </div>
          <button class="level-btn" 
                  ${level.unlocked ? '' : 'disabled'}
                  data-level="${level.id}">
            ${isCompleted ? '已完成' : (level.unlocked ? '开始挑战' : '🔒 未解锁')}
          </button>
        </div>
      `;
    }).join('');
    this.renderWrongList();
  }

  renderWrongList() {
    const container = document.getElementById('wrong-list');
    if (this.userState.wrongQuestions.length === 0) {
      container.innerHTML = '<p class="empty-message">暂无错题，继续保持！</p>';
      return;
    }
    container.innerHTML = this.userState.wrongQuestions.map(q => `
      <div class="wrong-item">
        <div class="wrong-question">${q.text}</div>
        <div class="wrong-answer">你的答案: ${q.options[q.yourAnswer]}</div>
        <div class="correct-answer">正确答案: ${q.options[q.correctIndex]}</div>
        <div class="explanation">${q.explanation}</div>
      </div>
    `).join('');
  }

  startQuiz(levelId) {
    const level = this.levels.find(l => l.id === levelId);
    if (!level || !level.unlocked) return;
    const difficultyMap = { easy: 1, medium: 2, hard: 3, expert: 4 };
    const difficulty = difficultyMap[level.difficulty];
    const questions = MOCK_DATA.questions
      .filter(q => q.difficulty === difficulty)
      .slice(0, level.questionCount);
    this.currentQuiz = { levelId, questions };
    this.quizIndex = 0;
    this.quizScore = 0;
    this.quizAnswers = [];
    document.getElementById('quiz-modal').classList.remove('hidden');
    document.getElementById('quiz-title').textContent = level.name;
    document.getElementById('total-questions').textContent = questions.length;
    this.renderQuestion();
  }

  renderQuestion() {
    const question = this.currentQuiz.questions[this.quizIndex];
    document.getElementById('current-question').textContent = this.quizIndex + 1;
    document.getElementById('question-text').textContent = question.text;
    document.getElementById('options-list').innerHTML = question.options.map((opt, idx) => `
      <button class="option-btn" data-index="${idx}" onclick="app.selectOption(${idx})">
        ${String.fromCharCode(65 + idx)}. ${opt}
      </button>
    `).join('');
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('question-card').classList.remove('hidden');
  }

  selectOption(index) {
    const question = this.currentQuiz.questions[this.quizIndex];
    document.querySelectorAll('.option-btn').forEach((btn, idx) => {
      btn.classList.remove('selected');
      if (idx === question.correctIndex) btn.classList.add('correct');
      if (idx === index && idx !== question.correctIndex) btn.classList.add('incorrect');
    });
    this.quizAnswers.push({ ...question, yourAnswer: index });
    if (index === question.correctIndex) {
      this.quizScore++;
    } else {
      if (!this.userState.wrongQuestions.find(q => q.id === question.id)) {
        this.userState.wrongQuestions.push({ ...question, yourAnswer: index });
      }
    }
    document.getElementById('question-card').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    const isCorrect = index === question.correctIndex;
    document.getElementById('result-icon').textContent = isCorrect ? '✅' : '❌';
    document.getElementById('result-text').textContent = isCorrect ? '回答正确！' : '回答错误';
    document.getElementById('result-score').textContent = isCorrect ? '' : `解析: ${question.explanation}`;
    const btn = document.getElementById('btn-quiz-next');
    btn.textContent = this.quizIndex < this.currentQuiz.questions.length - 1 ? '下一题' : '完成挑战';
  }

  nextQuestion() {
    if (this.quizIndex < this.currentQuiz.questions.length - 1) {
      this.quizIndex++;
      this.renderQuestion();
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz() {
    const level = this.levels.find(l => l.id === this.currentQuiz.levelId);
    const totalQuestions = this.currentQuiz.questions.length;
    const passed = this.quizScore >= totalQuestions * level.passRate;
    if (passed) {
      this.userState.prosperity += level.rewardScore;
      this.userState.completedLevels.push(level.id);
      this.unlockNextLevel(level.id);
      this.showToast('🏆', `挑战成功！获得 ${level.rewardScore} 繁荣度`);
    } else {
      this.showToast('💪', `挑战失败，正确 ${this.quizScore}/${totalQuestions}，继续加油！`);
    }
    this.closeQuiz();
    this.renderLibrary();
    this.updateStats();
    this.checkAchievements();
  }

  unlockNextLevel(currentLevelId) {
    const levelOrder = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levelOrder.indexOf(currentLevelId);
    if (currentIndex < levelOrder.length - 1) {
      const nextLevel = this.levels.find(l => l.id === levelOrder[currentIndex + 1]);
      if (nextLevel) nextLevel.unlocked = true;
    }
  }

  closeQuiz() {
    document.getElementById('quiz-modal').classList.add('hidden');
    this.currentQuiz = null;
  }

  renderLeaderboard() {
    this.renderPersonalLeaderboard();
    this.renderTeamLeaderboard();
  }

  renderPersonalLeaderboard() {
    const container = document.getElementById('personal-list');
    container.innerHTML = MOCK_DATA.leaderboard.personal.map(item => `
      <div class="rank-item">
        <div class="rank-position-num ${this.getRankClass(item.rank)}">${item.rank}</div>
        <div class="rank-item-avatar">${item.avatar}</div>
        <div class="rank-item-info">
          <div class="rank-item-name">${item.name}</div>
          <div class="rank-item-score">繁荣度</div>
        </div>
        <div class="rank-item-value">${item.prosperity}</div>
      </div>
    `).join('');
  }

  renderTeamLeaderboard() {
    const container = document.getElementById('team-list');
    container.innerHTML = MOCK_DATA.leaderboard.teams.map(item => `
      <div class="rank-item">
        <div class="rank-position-num ${this.getRankClass(item.rank)}">${item.rank}</div>
        <div class="rank-item-avatar">👥</div>
        <div class="rank-item-info">
          <div class="rank-item-name">${item.name}</div>
          <div class="rank-item-score">成员: ${item.members}人</div>
        </div>
        <div class="rank-item-value">${item.prosperity}</div>
      </div>
    `).join('');
  }

  getRankClass(rank) {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'other';
  }

  renderDonations() {
    const container = document.getElementById('projects-grid');
    container.innerHTML = MOCK_DATA.projects.map(project => {
      const percentage = Math.min(100, Math.floor((project.currentAmount / project.targetAmount) * 100));
      return `
        <div class="project-card">
          <div class="project-icon">${project.icon}</div>
          <div class="project-name">${project.name}</div>
          <div class="project-desc">${project.description}</div>
          <div class="project-progress-bar">
            <div class="project-progress-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="project-progress-text">已完成 ${percentage}% · ${project.currentAmount}/${project.targetAmount}</div>
          <button class="donate-btn" data-project="${project.id}">捐赠</button>
        </div>
      `;
    }).join('');
    this.renderDonationHistory();
  }

  renderDonationHistory() {
    const container = document.getElementById('history-list');
    if (this.userState.donations.length === 0) {
      container.innerHTML = '<p class="empty-message">暂无捐赠记录</p>';
      return;
    }
    container.innerHTML = this.userState.donations.map(donation => {
      const project = MOCK_DATA.projects.find(p => p.id === donation.projectId);
      return `
        <div class="history-item">
          <div class="history-info">
            <div class="history-project">${project ? project.name : '未知项目'}</div>
            <div class="history-date">${donation.date}</div>
          </div>
          <div class="history-amount">-${donation.amount} 繁荣度</div>
        </div>
      `;
    }).join('');
  }

  donate(projectId) {
    const project = MOCK_DATA.projects.find(p => p.id === projectId);
    if (!project) return;
    let amount = 0;
    if (project.id === 1) amount = 100;
    else if (project.id === 2) amount = 80;
    else amount = 50;
    if (this.userState.prosperity < amount) {
      this.showToast('⚠️', `繁荣度不足，需要${amount}繁荣度`);
      return;
    }
    this.userState.prosperity -= amount;
    this.userState.donations.push({
      projectId,
      amount,
      date: new Date().toISOString().split('T')[0],
    });
    project.currentAmount = Math.min(project.targetAmount, project.currentAmount + amount);
    this.renderDonations();
    this.updateStats();
    this.checkAchievements();
    this.showToast('❤️', `成功捐赠 ${amount} 繁荣度给 ${project.name}！`);
  }

  showToast(icon, message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-icon').textContent = icon;
    document.getElementById('toast-message').textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
}

const app = new App();