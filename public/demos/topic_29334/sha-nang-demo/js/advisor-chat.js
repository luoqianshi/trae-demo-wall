// 沙囊AI - 参谋对话模块

const AdvisorChat = {
  messages: [],
  dialogData: [],
  
  render(dialogData) {
    this.dialogData = dialogData;
    this.messages = [];
    
    return `
      <div class="advisor-section fade-in-up" style="animation-delay:0.6s">
        <div class="advisor-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          追问AI参谋
        </div>
        <div class="advisor-chat" id="advisorChat"></div>
        <div class="advisor-questions" id="advisorQuestions">
          ${dialogData.map((d, i) => `
            <button class="advisor-question-btn" data-index="${i}">${d.q}</button>
          `).join('')}
        </div>
        <div class="advisor-input-area">
          <input type="text" class="advisor-input" id="advisorInput" placeholder="输入你的问题..." />
          <button class="advisor-send-btn" id="advisorSend">发送</button>
        </div>
      </div>
    `;
  },
  
  bindEvents(dialogData) {
    this.dialogData = dialogData;
    
    // 预设问题点击
    document.getElementById('advisorQuestions').addEventListener('click', (e) => {
      if (e.target.classList.contains('advisor-question-btn')) {
        const idx = parseInt(e.target.dataset.index);
        this.askQuestion(idx);
      }
    });
    
    // 发送按钮
    document.getElementById('advisorSend').addEventListener('click', () => {
      this.sendCustomQuestion();
    });
    
    // 回车发送
    document.getElementById('advisorInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendCustomQuestion();
      }
    });
  },
  
  askQuestion(idx) {
    const data = this.dialogData[idx];
    if (!data) return;
    
    // 禁用按钮
    document.querySelectorAll('.advisor-question-btn').forEach(btn => {
      btn.disabled = true;
    });
    
    // 添加用户问题
    this.addMessage('user', data.q);
    
    // 模拟AI思考
    setTimeout(() => {
      this.addMessage('ai', data.a);
      
      // 重新启用按钮
      document.querySelectorAll('.advisor-question-btn').forEach(btn => {
        btn.disabled = false;
      });
    }, 1000);
  },
  
  sendCustomQuestion() {
    const input = document.getElementById('advisorInput');
    const question = input.value.trim();
    if (!question) return;
    
    // 添加用户问题
    this.addMessage('user', question);
    input.value = '';
    
    // 模拟AI回复
    setTimeout(() => {
      const response = this.generateResponse(question);
      this.addMessage('ai', response);
    }, 1200);
  },
  
  addMessage(type, text) {
    const chat = document.getElementById('advisorChat');
    const msg = document.createElement('div');
    msg.className = `advisor-message ${type}`;
    
    if (type === 'ai') {
      // 打字机效果
      msg.textContent = '';
      chat.appendChild(msg);
      this.typewriter(msg, text, 25);
    } else {
      msg.textContent = text;
      chat.appendChild(msg);
    }
    
    // 滚动到底部
    chat.scrollTop = chat.scrollHeight;
  },
  
  typewriter(el, text, speed) {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
        // 滚动到底部
        const chat = document.getElementById('advisorChat');
        chat.scrollTop = chat.scrollHeight;
      } else {
        clearInterval(timer);
      }
    }, speed);
  },
  
  generateResponse(question) {
    // 简单的关键词匹配回复
    const keywords = [
      { keys: ['钱', '资金', '成本', '价格', '贵', '便宜'], response: '资金是决策的重要约束，但不是唯一约束。建议从三个角度评估：① 这笔钱花出去，最坏情况下能否承受？ ② 有没有更低成本的替代方案？ ③ 如果不花这笔钱，机会成本是多少？' },
      { keys: ['风险', '危险', '怕', '担心', '安全'], response: '风险无法消除，只能管理。建议做一张\"风险矩阵\"：列出所有可能的风险，按\"发生概率\"和\"影响程度\"打分。优先处理高概率高影响的风险，对低概率低影响的风险可以暂时接受。' },
      { keys: ['时间', '多久', '什么时候', '期限', ' deadline'], response: '时间压力会影响决策质量。如果 deadline 很紧，建议：① 先做一个\"最小可行决策\"，先动起来再迭代； ② 明确哪些信息是\"必须有\"的，哪些是\"最好有\"的； ③ 设定一个\"决策截止点\"，到了就决策，不再拖延。' },
      { keys: ['团队', '员工', '人', '招聘', '离职'], response: '团队是企业的核心资产。建议从两个维度评估：① 现有团队的技能覆盖度和士气状态； ② 如果需要扩张，招聘和培养新员工的周期和成本。记住：人不是机器，扩张过快可能导致文化稀释和管理失控。' },
      { keys: ['竞争', '对手', '市场', '行业', '趋势'], response: '竞争环境是外部不可控因素。建议：① 客观评估竞争对手的真实实力，不要高估也不要低估； ② 寻找差异化定位，避免正面价格战； ③ 关注行业长期趋势，而非短期波动。蓝海永远存在，关键是找到它。' }
    ];
    
    for (const kw of keywords) {
      if (kw.keys.some(k => question.includes(k))) {
        return kw.response;
      }
    }
    
    // 默认回复
    const defaults = [
      '这是一个很好的问题。在做这个决策时，建议你先问自己三个问题：① 这个决策的核心约束是什么？ ② 如果一年后回头看，什么因素会是最重要的？ ③ 有没有一个\"最小成本验证\"的方法？',
      '我注意到你的问题很有深度。决策的难点往往不在于\"选A还是选B\"，而在于\"你真正想要的是什么\"。建议先明确你的长期目标，再倒推当前决策的最优解。',
      '这个问题没有标准答案，但有一个思考框架可以帮到你：把决策拆分为\"必须做的\"、\"应该做的\"、\"可以做的\"三个层次。优先保证\"必须做的\"，再考虑\"应该做的\"，最后才是\"可以做的\"。'
    ];
    
    return defaults[Math.floor(Math.random() * defaults.length)];
  },
  
  clear() {
    this.messages = [];
    this.dialogData = [];
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AdvisorChat };
}
