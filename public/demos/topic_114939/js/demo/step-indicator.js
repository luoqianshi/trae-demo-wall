const esc = window.escapeHtml;
function updateStepIndicator() {
  const steps = window.quickDemoMode ? window.quickDemoSteps : window.autoDemoSteps;
  const indicator = document.getElementById('demoStepIndicator');
  
  if (!indicator) return;

  const progress = ((window.autoDemoIndex) / steps.length) * 100;
  const stepNames = steps.map((s, i) => `
    <span class="step-name ${i === window.autoDemoIndex ? 'active' : ''}" onclick="jumpToStep(${i})">
      ${i + 1}. ${esc(s.name)}
    </span>
  `).join('');

  indicator.innerHTML = `
    <div class="step-progress">
      <div class="step-progress-bar" style="width: ${progress}%;"></div>
    </div>
    <div class="step-info">
      <span class="step-current">第 ${window.autoDemoIndex + 1} 步</span>
      <span class="step-total">/ 共 ${steps.length} 步</span>
    </div>
    <div class="step-names">${stepNames}</div>
  `;
}

window.jumpToStep = function(index) {
  window.autoDemoIndex = index;
  runDemoStep(false);
};

window.updateStepCount = function() {
  updateStepIndicator();
};