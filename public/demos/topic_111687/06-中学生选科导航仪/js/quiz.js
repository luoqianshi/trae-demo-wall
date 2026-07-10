var currentQ = 1;
var answers = [];

/* 各题选项对应的五维加分
   维度：logic(逻辑) memory(记忆) handsOn(动手) expression(表达) spatial(空间)
   每题4个选项，每个选项对应不同维度加分，总分为100分制
*/
var questionScores = [
  /* Q1: 你更喜欢以下哪种活动？ */
  [
    { text: '拆解玩具/电器，研究内部结构', scores: { logic: 15, memory: 5, handsOn: 20, expression: 3, spatial: 12 } },
    { text: '阅读小说或写故事', scores: { logic: 5, memory: 18, handsOn: 3, expression: 20, spatial: 8 } },
    { text: '解数学题或玩数独', scores: { logic: 22, memory: 10, handsOn: 5, expression: 5, spatial: 10 } },
    { text: '观察植物、动物或自然现象', scores: { logic: 10, memory: 12, handsOn: 10, expression: 5, spatial: 20 } }
  ],
  /* Q2: 遇到难题时，你通常怎么解决？ */
  [
    { text: '查找公式，逻辑推导', scores: { logic: 20, memory: 8, handsOn: 5, expression: 5, spatial: 8 } },
    { text: '联想生活实例，类比理解', scores: { logic: 10, memory: 15, handsOn: 8, expression: 12, spatial: 8 } },
    { text: '画图、做实验验证', scores: { logic: 12, memory: 8, handsOn: 18, expression: 5, spatial: 15 } },
    { text: '查找历史案例或文献', scores: { logic: 8, memory: 20, handsOn: 3, expression: 12, spatial: 5 } }
  ],
  /* Q3: 以下哪个学科你学得最轻松？ */
  [
    { text: '物理 / 数学', scores: { logic: 22, memory: 6, handsOn: 10, expression: 4, spatial: 13 } },
    { text: '语文 / 英语', scores: { logic: 6, memory: 20, handsOn: 4, expression: 22, spatial: 5 } },
    { text: '化学 / 生物', scores: { logic: 14, memory: 14, handsOn: 18, expression: 5, spatial: 8 } },
    { text: '历史 / 地理', scores: { logic: 8, memory: 18, handsOn: 5, expression: 14, spatial: 18 } }
  ],
  /* Q4: 你未来更向往的职业方向？ */
  [
    { text: '工程师 / 程序员 / 科学家', scores: { logic: 22, memory: 8, handsOn: 15, expression: 6, spatial: 12 } },
    { text: '医生 / 药师 / 生物研究员', scores: { logic: 15, memory: 16, handsOn: 18, expression: 5, spatial: 8 } },
    { text: '律师 / 记者 / 教师', scores: { logic: 12, memory: 16, handsOn: 4, expression: 22, spatial: 6 } },
    { text: '设计师 / 艺术家 / 心理咨询师', scores: { logic: 6, memory: 12, handsOn: 10, expression: 15, spatial: 22 } }
  ],
  /* Q5: 你更擅长记忆还是推理？ */
  [
    { text: '推理 — 喜欢找规律、做证明', scores: { logic: 22, memory: 6, handsOn: 8, expression: 6, spatial: 10 } },
    { text: '记忆 — 背东西快、细节记得牢', scores: { logic: 6, memory: 22, handsOn: 5, expression: 15, spatial: 6 } },
    { text: '两者均衡', scores: { logic: 12, memory: 14, handsOn: 8, expression: 10, spatial: 10 } },
    { text: '都不突出，但动手能力很强', scores: { logic: 8, memory: 8, handsOn: 22, expression: 6, spatial: 14 } }
  ],
  /* Q6: 你最不能接受以下哪种情况？（反向题：不擅长的维度减分） */
  [
    { text: '大量背诵历史年代和政治条文', scores: { logic: 10, memory: 2, handsOn: 8, expression: 10, spatial: 12 } },
    { text: '复杂的物理公式推导', scores: { logic: 2, memory: 12, handsOn: 8, expression: 12, spatial: 10 } },
    { text: '繁琐的化学实验步骤', scores: { logic: 10, memory: 10, handsOn: 2, expression: 10, spatial: 12 } },
    { text: '写长篇论述和分析文章', scores: { logic: 10, memory: 12, handsOn: 8, expression: 2, spatial: 12 } }
  ]
];

function showQ(n){
  document.querySelectorAll('.question-wrap').forEach(function(el){ el.classList.remove('active'); });
  document.getElementById('q'+n).classList.add('active');
  document.getElementById('progressBar').style.width = Math.round((n/6)*100) + '%';
  currentQ = n;
}

function nextQ(n, el){
  el.parentElement.querySelectorAll('.q-option').forEach(function(o){ o.classList.remove('selected'); });
  el.classList.add('selected');
  answers[currentQ-1] = el.textContent;
  setTimeout(function(){ showQ(n); }, 300);
}

function prevQ(n){
  showQ(n);
}

/* 根据答案计算五维能力值 */
function calculateScores() {
  var scores = { logic: 0, memory: 0, handsOn: 0, expression: 0, spatial: 0 };
  var dims = ['logic', 'memory', 'handsOn', 'expression', 'spatial'];

  for (var i = 0; i < answers.length && i < questionScores.length; i++) {
    var answer = answers[i];
    var options = questionScores[i];
    for (var j = 0; j < options.length; j++) {
      if (options[j].text === answer) {
        for (var k = 0; k < dims.length; k++) {
          scores[dims[k]] += options[j].scores[dims[k]];
        }
        break;
      }
    }
  }

  /* 控制在 30-95 分区间，避免出现0分或满分 */
  for (var m = 0; m < dims.length; m++) {
    var dim = dims[m];
    scores[dim] = Math.round(scores[dim] * 0.85 + 30);
    if (scores[dim] > 95) scores[dim] = 95;
    if (scores[dim] < 30) scores[dim] = 30;
  }

  return scores;
}

/* 生成能力画像描述 */
function generateProfile(scores) {
  var strengths = [];
  var weaknesses = [];
  var dimLabels = { logic: '逻辑', memory: '记忆', handsOn: '动手', expression: '表达', spatial: '空间' };
  var dims = ['logic', 'memory', 'handsOn', 'expression', 'spatial'];

  dims.sort(function(a, b) { return scores[b] - scores[a]; });

  strengths.push(dimLabels[dims[0]]);
  strengths.push(dimLabels[dims[1]]);
  weaknesses.push(dimLabels[dims[4]]);
  weaknesses.push(dimLabels[dims[3]]);

  var desc = strengths[0] + '与' + strengths[1] + '能力突出';
  if (scores[dims[0]] > 85) {
    desc += '，极具天赋优势';
  } else {
    desc += '，属于优势学科方向';
  }

  if (scores[dims[4]] < 50) {
    desc += '。' + weaknesses[0] + '与' + weaknesses[1] + '相对薄弱，可通过针对性训练提升。';
  } else {
    desc += '。各维度发展均衡，建议结合兴趣选择最适合的组合。';
  }

  return desc;
}

function finish(el){
  el.parentElement.querySelectorAll('.q-option').forEach(function(o){ o.classList.remove('selected'); });
  el.classList.add('selected');
  answers[currentQ-1] = el.textContent;

  /* 计算并保存能力画像 */
  var scores = calculateScores();
  var profile = generateProfile(scores);
  localStorage.setItem('abilityScores', JSON.stringify(scores));
  localStorage.setItem('abilityProfile', profile);
  localStorage.setItem('quizCompleted', 'true');

  setTimeout(function(){ location.href = 'result.html'; }, 500);
}
