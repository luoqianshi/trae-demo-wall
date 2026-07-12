const quizData = {
  primary: [
    {
      question: '孟母为了教育孟子，曾经搬过几次家？',
      options: ['一次', '两次', '三次', '四次'],
      answer: 2,
      explain: '孟母三迁的故事讲述了孟母为了给孟子创造良好的学习环境，先后搬了三次家，最终定居在学校附近。'
    },
    {
      question: '孔子的故乡是哪里？',
      options: ['北京', '曲阜', '洛阳', '西安'],
      answer: 1,
      explain: '孔子名丘，字仲尼，出生于鲁国陬邑，即今天的山东省曲阜市。'
    },
    {
      question: '《论语》是记录谁的言行的书？',
      options: ['孟子', '孔子及其弟子', '老子', '庄子'],
      answer: 1,
      explain: '《论语》是孔子弟子及再传弟子记录孔子及其弟子言行的语录体散文集。'
    },
    {
      question: '孔子说"学而时习之"中的"习"是什么意思？',
      options: ['学习', '复习、练习', '习惯', '习俗'],
      answer: 1,
      explain: '"学而时习之"的意思是学习了知识，然后按时复习和练习，这样不是很快乐吗？'
    },
    {
      question: '孔子有多少位弟子？',
      options: ['72位', '3000位', '3000弟子，72贤人', '108位'],
      answer: 2,
      explain: '孔子有弟子三千，其中贤者七十二人，被称为"七十二贤人"。'
    },
    {
      question: '"三人行，必有我师焉"是谁说的？',
      options: ['孟子', '孔子', '荀子', '曾子'],
      answer: 1,
      explain: '这句话出自《论语·述而》，是孔子说的，意思是三个人一起走路，其中必定有人可以做我的老师。'
    },
    {
      question: '孔子最喜欢的弟子是谁？',
      options: ['子路', '子贡', '颜回', '曾子'],
      answer: 2,
      explain: '颜回是孔子最得意的弟子，以德行著称，孔子称赞他"一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐"。'
    },
    {
      question: '"岁寒，然后知松柏之后凋也"这句话告诉我们什么道理？',
      options: ['冬天很冷', '松柏很坚强', '只有经过考验才能看出品质', '要多植树'],
      answer: 2,
      explain: '这句话比喻只有经过严峻的考验，才能看出一个人的品质和节操。'
    },
    {
      question: '《三字经》的第一句是什么？',
      options: ['人之初，性本善', '昔孟母，择邻处', '养不教，父之过', '玉不琢，不成器'],
      answer: 0,
      explain: '《三字经》开篇第一句是"人之初，性本善"，意思是人刚出生时，本性都是善良的。'
    },
    {
      question: '孔子曾经担任过什么官职？',
      options: ['皇帝', '宰相', '大司寇', '将军'],
      answer: 2,
      explain: '孔子在鲁国曾担任大司寇，负责司法事务，摄相事，参与国家管理。'
    }
  ],
  middle: [
    {
      question: '"己所不欲，勿施于人"体现了孔子的什么思想？',
      options: ['仁', '义', '礼', '智'],
      answer: 0,
      explain: '这句话体现了孔子"仁"的核心思想，是处理人际关系的重要准则，意思是自己不想要的，不要强加给别人。'
    },
    {
      question: '孔子"三十而立"中的"立"指的是什么？',
      options: ['站立', '成家立业', '确立人生志向和道德修养', '做官'],
      answer: 2,
      explain: '"三十而立"指的是三十岁时确立了自己的人生志向和道德修养，能够独立思考和行事。'
    },
    {
      question: '"知之为知之，不知为不知，是知也"这句话强调了什么？',
      options: ['要谦虚', '要诚实', '要勤奋', '要智慧'],
      answer: 1,
      explain: '这句话强调对待知识要诚实，知道就是知道，不知道就是不知道，这才是真正的智慧。'
    },
    {
      question: '孔子周游列国的目的是什么？',
      options: ['旅游', '寻找弟子', '推行自己的政治主张', '躲避战乱'],
      answer: 2,
      explain: '孔子周游列国十四年，希望得到各国君主的重用，推行自己"仁政"和"礼治"的政治主张。'
    },
    {
      question: '《论语》中"君子"和"小人"的主要区别是什么？',
      options: ['地位高低', '品德修养', '财富多少', '学问深浅'],
      answer: 1,
      explain: '在《论语》中，"君子"指品德高尚、遵守礼仪的人，"小人"指品德低下、追求私利的人，主要区别在于品德修养。'
    },
    {
      question: '"君子坦荡荡，小人长戚戚"是什么意思？',
      options: ['君子高大，小人矮小', '君子心胸宽广，小人忧愁不安', '君子有钱，小人贫穷', '君子勇敢，小人胆小'],
      answer: 1,
      explain: '这句话的意思是君子心胸宽广、光明磊落，小人则常常忧愁不安、患得患失。'
    },
    {
      question: '孔子所说的"六艺"指的是什么？',
      options: ['诗、书、礼、乐、易、春秋', '礼、乐、射、御、书、数', '琴、棋、书、画、诗、词', '仁、义、礼、智、信、勇'],
      answer: 1,
      explain: '孔子所说的"六艺"是指礼、乐、射、御、书、数六种基本技能，是古代儒家要求学生掌握的六种基本才能。'
    },
    {
      question: '"学而不思则罔，思而不学则殆"说明了什么道理？',
      options: ['学习不重要', '思考不重要', '学习和思考要相结合', '学习比思考重要'],
      answer: 2,
      explain: '这句话说明学习和思考必须相结合，只学习不思考会迷惑，只思考不学习会危险。'
    },
    {
      question: '孔子为什么要"删诗"？',
      options: ['诗歌太多', '整理和规范《诗经》', '不喜欢某些诗', '听从国君命令'],
      answer: 1,
      explain: '孔子对《诗经》进行了整理和编辑，删去重复的篇章，使《诗经》成为一部体系完整的诗歌总集。'
    },
    {
      question: '"克己复礼为仁"中的"复礼"是什么意思？',
      options: ['恢复周礼', '重复礼节', '复习礼仪', '复制礼物'],
      answer: 0,
      explain: '"克己复礼为仁"意思是克制自己的欲望，使言行都符合周礼的规范，这就是仁。'
    }
  ],
  high: [
    {
      question: '孔子"仁"的思想在当代社会有什么现实意义？',
      options: ['没有意义', '有助于构建和谐社会', '只适用于古代', '会限制个人自由'],
      answer: 1,
      explain: '孔子"仁"的思想强调仁爱、宽容、和谐，对于当代社会构建和谐人际关系、促进社会稳定具有重要的现实意义。'
    },
    {
      question: '孟子"性善论"与荀子"性恶论"的根本区别是什么？',
      options: ['一个说人性善，一个说人性恶', '一个强调后天教育，一个强调先天本性', '一个是儒家，一个是法家', '没有区别'],
      answer: 0,
      explain: '孟子认为人性本善，人的善良是天生的；荀子认为人性本恶，人的善良是通过后天教育和学习获得的。'
    },
    {
      question: '"中庸之道"的核心思想是什么？',
      options: ['不偏不倚，恰到好处', '中间路线', '平庸无为', '折中妥协'],
      answer: 0,
      explain: '中庸之道的核心是"不偏不倚，恰到好处"，强调做事要把握分寸，避免极端，追求适度和平衡。'
    },
    {
      question: '孔子思想中"礼"的本质是什么？',
      options: ['礼仪形式', '社会秩序和规范', '礼貌待人', '礼物交换'],
      answer: 1,
      explain: '孔子思想中的"礼"不仅指礼仪形式，更重要的是指社会秩序、等级制度和道德规范，是维护社会稳定的基础。'
    },
    {
      question: '"天命"思想在孔子哲学中的地位是什么？',
      options: ['核心地位', '次要地位', '否定地位', '神秘地位'],
      answer: 1,
      explain: '孔子相信天命，但并不迷信，他强调"尽人事，听天命"，认为人应该努力做好自己的事情，同时接受命运的安排。'
    },
    {
      question: '孔子"正名"思想的实质是什么？',
      options: ['纠正名字', '维护等级名分', '统一名称', '重视名声'],
      answer: 1,
      explain: '"正名"的实质是维护社会的等级名分和秩序，使每个人都按照自己的身份和职责行事，即"君君、臣臣、父父、子子"。'
    },
    {
      question: '《论语》的文学价值主要体现在哪里？',
      options: ['辞藻华丽', '语言简练，意蕴深远', '篇幅宏大', '情节曲折'],
      answer: 1,
      explain: '《论语》的文学价值在于其语言简练、意蕴深远，善于通过简短的对话展现人物性格和深刻的思想。'
    },
    {
      question: '儒家思想对中国传统文化的影响表现在哪些方面？',
      options: ['政治、伦理、教育', '科技、军事、经济', '艺术、音乐、舞蹈', '饮食、服饰、建筑'],
      answer: 0,
      explain: '儒家思想深刻影响了中国的政治制度、伦理道德、教育体系等多个方面，是中国传统文化的核心。'
    },
    {
      question: '"知行合一"的思想最早由谁提出？',
      options: ['孔子', '孟子', '王阳明', '朱熹'],
      answer: 2,
      explain: '"知行合一"是明代思想家王阳明提出的重要思想，强调知识和实践的统一。'
    },
    {
      question: '孔子思想与现代教育理念有哪些契合之处？',
      options: ['因材施教', '应试教育', '精英教育', '功利教育'],
      answer: 0,
      explain: '孔子"因材施教"的教育理念与现代教育强调个性化、差异化教学的理念高度契合。'
    }
  ]
};

let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let currentAge = 'primary';
let isAnswering = false;

function selectQuizAge(age) {
  currentAge = age;
  document.querySelectorAll('.mode-chip').forEach(chip => chip.classList.remove('active'));
  document.querySelector(`[data-age="${age}"]`).classList.add('active');
  resetQuiz();
}

function getQuestions() {
  let questions = [];
  if (currentAge === 'all') {
    questions = [...quizData.primary, ...quizData.middle, ...quizData.high];
  } else {
    questions = [...quizData[currentAge]];
  }
  return questions.sort(() => Math.random() - 0.5).slice(0, 6);
}

function resetQuiz() {
  currentQuestions = getQuestions();
  currentIndex = 0;
  score = 0;
  isAnswering = false;
  renderQuiz();
}

function renderQuiz() {
  const container = document.getElementById('quiz-body');
  const progressText = document.getElementById('quiz-progress-text');
  const scoreText = document.getElementById('quiz-score-text');
  
  if (progressText) progressText.textContent = `第 ${currentIndex + 1} 题 / 共 ${currentQuestions.length} 题`;
  if (scoreText) scoreText.textContent = `得分：${score}`;
  
  if (!container) return;
  
  if (currentIndex >= currentQuestions.length) {
    renderResult();
    return;
  }
  
  const question = currentQuestions[currentIndex];
  const optionsHtml = question.options.map((opt, idx) => `
    <div class="quiz-option" onclick="selectAnswer(${idx})">
      <span class="opt-label">${['甲', '乙', '丙', '丁'][idx]}</span>
      <span>${opt}</span>
    </div>
  `).join('');
  
  container.innerHTML = `
    <div class="quiz-question">${question.question}</div>
    <div class="quiz-options">${optionsHtml}</div>
    <div class="quiz-explanation" id="quiz-explanation"></div>
    <div class="quiz-actions" style="display:none;" id="quiz-actions">
      <button class="btn btn-ghost" onclick="resetQuiz()">重新开始</button>
      <button class="btn btn-primary" onclick="nextQuestion()">下一题 →</button>
    </div>
  `;
  
  isAnswering = false;
}

function selectAnswer(idx) {
  if (isAnswering) return;
  isAnswering = true;
  
  const question = currentQuestions[currentIndex];
  const options = document.querySelectorAll('.quiz-option');
  const explanation = document.getElementById('quiz-explanation');
  const actions = document.getElementById('quiz-actions');
  
  options.forEach((opt, i) => {
    if (i === question.answer) {
      opt.classList.add('correct');
    } else if (i === idx && i !== question.answer) {
      opt.classList.add('wrong');
    }
    opt.style.pointerEvents = 'none';
  });
  
  if (idx === question.answer) {
    score += Math.floor(100 / currentQuestions.length);
    document.getElementById('quiz-score-text').textContent = `得分：${score}`;
  }
  
  explanation.textContent = question.explain;
  explanation.classList.add('show');
  
  setTimeout(() => {
    actions.style.display = 'flex';
  }, 500);
}

function nextQuestion() {
  currentIndex++;
  renderQuiz();
}

function renderResult() {
  const container = document.getElementById('quiz-body');
  const progressText = document.getElementById('quiz-progress-text');
  const scoreText = document.getElementById('quiz-score-text');
  
  if (progressText) progressText.textContent = '答题完成';
  if (scoreText) scoreText.textContent = `最终得分：${score}`;
  
  let resultTitle = '';
  let resultDesc = '';
  
  if (score >= 90) {
    resultTitle = '博学鸿儒';
    resultDesc = '您对儒家文化有深入的理解，不愧为饱学之士！';
  } else if (score >= 70) {
    resultTitle = '知书达理';
    resultDesc = '您对儒家文化有较好的掌握，继续努力！';
  } else if (score >= 60) {
    resultTitle = '初学有成';
    resultDesc = '您已经入门儒家文化，再接再厉！';
  } else {
    resultTitle = '童蒙启智';
    resultDesc = '千里之行，始于足下。多读书，多学习！';
  }
  
  container.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-score">${score}</div>
      <h3>${resultTitle}</h3>
      <p>${resultDesc}</p>
      <div style="margin-top: 24px; display: flex; gap: 16px; justify-content: center;">
        <button class="btn btn-ghost" onclick="resetQuiz()">再试一次</button>
        <button class="btn btn-primary" onclick="selectQuizAge('all')">挑战混合题</button>
      </div>
    </div>
  `;
}

function toggleAddQuestion() {
  const panel = document.getElementById('add-q-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

function addQuestion() {
  const age = document.getElementById('new-q-age').value;
  const title = document.getElementById('new-q-title').value;
  const opt0 = document.getElementById('new-q-opt0').value;
  const opt1 = document.getElementById('new-q-opt1').value;
  const opt2 = document.getElementById('new-q-opt2').value;
  const opt3 = document.getElementById('new-q-opt3').value;
  const answer = parseInt(document.getElementById('new-q-answer').value);
  const explain = document.getElementById('new-q-explain').value;
  
  if (!title || !opt0 || !opt1 || !opt2 || !opt3) {
    alert('请填写完整题目信息');
    return;
  }
  
  const newQuestion = {
    question: title,
    options: [opt0, opt1, opt2, opt3],
    answer: answer,
    explain: explain || '暂无解析'
  };
  
  quizData[age].push(newQuestion);
  toggleAddQuestion();
  alert('题目添加成功！');
}

function clearCustom() {
}

document.addEventListener('DOMContentLoaded', () => {
  resetQuiz();
});

window.selectQuizAge = selectQuizAge;
window.selectAnswer = selectAnswer;
window.nextQuestion = nextQuestion;
window.resetQuiz = resetQuiz;
window.toggleAddQuestion = toggleAddQuestion;
window.addQuestion = addQuestion;