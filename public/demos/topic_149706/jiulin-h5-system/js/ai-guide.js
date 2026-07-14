// AI 指引逻辑
(function() {
  function init() {
    JLCommon.renderBottomNav(3);
    renderSamples();
  }

  function renderSamples() {
    const container = document.getElementById('sample-tags');
    container.innerHTML = JLData.aiSamples.map(sample => 
      `<span class="sample-tag" onclick="fillSample('${sample}')">${sample}</span>`
    ).join('');
  }

  window.fillSample = function(text) {
    document.getElementById('ai-input').value = text;
  };

  window.getAIGuidance = function() {
    const input = document.getElementById('ai-input').value.trim();
    if (!input) {
      JLCommon.alert('请先描述症状', '提示');
      return;
    }

    const response = analyzeInput(input);
    renderResult(response);
  };

  function analyzeInput(input) {
    if (input.includes('心脏骤停') || input.includes('没有呼吸') || input.includes('无意识')) {
      return JLData.aiResponses['心脏骤停'];
    }
    if (input.includes('昏迷') || input.includes('晕倒') || input.includes('叫不醒')) {
      return JLData.aiResponses['昏迷'];
    }
    if (input.includes('卡住') || input.includes('异物') || input.includes('喉咙')) {
      return JLData.aiResponses['异物'];
    }
    if (input.includes('出血') || input.includes('流血')) {
      return JLData.aiResponses['出血'];
    }
    if (input.includes('摔倒') || input.includes('骨折')) {
      return JLData.aiResponses['摔倒'];
    }
    return JLData.defaultAIResponse;
  }

  function renderResult(response) {
    const result = document.getElementById('ai-result');
    result.innerHTML = `
      <div class="ai-card">
        <div class="ai-card-title">${response.title}</div>
        ${response.steps.map((step, i) => `
          <div class="ai-step">
            <div class="ai-step-num">${i + 1}</div>
            <div class="ai-step-content">
              <h4>${step.title}</h4>
              <p>${step.desc}</p>
            </div>
          </div>
        `).join('')}
        <div class="ai-warning">
          <h4>⚠️ 注意事项</h4>
          <ul>
            ${response.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    result.style.display = 'block';
    result.scrollIntoView({ behavior: 'smooth' });
  }

  init();
})();
