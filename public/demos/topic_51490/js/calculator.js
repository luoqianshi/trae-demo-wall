/**
 * 二手车落地成本计算器模块
 * 使用 Canvas 绘制费用构成饼图，Strategy 模式切换计算策略
 */

const CalculatorModule = (() => {
  let calculatorContext = null;

  function init() {
    calculatorContext = new CalculatorContext();
  }

  function render(container) {
    if (!calculatorContext) init();

    container.innerHTML = `
      <div class="toolbox-panel active" id="calc-panel">
        <div class="calculator-container">
          <div class="calc-form">
            <h2>🧮 二手车落地成本计算器</h2>
            <p style="color:var(--gray-700);font-size:0.85rem;margin-bottom:1.5rem;">
              计算购车全部费用，含车价、税费、保险、上牌等。<br>
              <span class="badge badge-data">客观数据</span>
              <small style="color:var(--gray-500);">税费标准参考国家税务总局，更新于 2025年</small>
            </p>

            <div class="form-group">
              <label>车辆类型</label>
              <select id="calc-fuel-type">
                <option value="fuel">燃油车</option>
                <option value="nev">新能源车（纯电/插混）</option>
              </select>
            </div>

            <div class="form-group">
              <label>车辆成交价（元）</label>
              <input type="number" id="calc-price" placeholder="例如：80000" value="80000" min="0" step="1000">
              <div class="input-hint">与卖家谈好的裸车价格</div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>排量（L）</label>
                <select id="calc-displacement">
                  <option value="1.0">1.0L 及以下</option>
                  <option value="1.6" selected>1.0L-1.6L</option>
                  <option value="2.0">1.6L-2.0L</option>
                  <option value="2.5">2.0L-2.5L</option>
                  <option value="3.0">2.5L 以上</option>
                </select>
              </div>
              <div class="form-group">
                <label>所在城市</label>
                <select id="calc-city">
                  <option value="beijing">北京</option>
                  <option value="shanghai">上海</option>
                  <option value="guangzhou">广州</option>
                  <option value="shenzhen">深圳</option>
                  <option value="chengdu">成都</option>
                  <option value="hangzhou">杭州</option>
                  <option value="default" selected>其他城市</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>保险方案</label>
              <select id="calc-coverage">
                <option value="basic">基础版（交强险 + 三者50万）</option>
                <option value="standard" selected>标准版（交强险 + 三者100万 + 车损）</option>
                <option value="full">全面版（交强险 + 三者200万 + 车损 + 不计免赔等其他）</option>
              </select>
            </div>

            <button class="btn btn-primary" id="btn-calculate" style="width:100%;margin-top:0.5rem;">
              📊 计算总费用
            </button>
          </div>

          <div class="calc-result">
            <h2>费用明细</h2>
            <div class="total-price">
              <div class="total-label">预计落地总价</div>
              <div class="total-amount" id="total-amount">¥0</div>
              <div class="total-note">以上费用仅供参考，实际以当地政策为准</div>
            </div>

            <ul class="cost-breakdown" id="cost-breakdown"></ul>

            <canvas id="cost-chart" class="canvas-chart" width="300" height="300"></canvas>
          </div>
        </div>

        <div class="disclaimer" style="margin-top:1.5rem;">
          <strong>⚠️ 免责声明：</strong>本计算器提供的数据仅供参考，不构成任何购买建议。<br>
          实际费用可能因地区政策、保险公司报价、车辆具体情况等因素有所不同。<br>
          购置税标准参考《中华人民共和国车辆购置税法》，新能源车免征政策以国家最新公告为准。
        </div>
      </div>
    `;

    bindEvents(container);
    calculateAndRender(container);
  }

  function bindEvents(container) {
    container.querySelector('#btn-calculate').addEventListener('click', () => {
      calculateAndRender(container);
    });

    const fuelType = container.querySelector('#calc-fuel-type');
    const displacement = container.querySelector('#calc-displacement');
    if (fuelType && displacement) {
      fuelType.addEventListener('change', () => {
        displacement.closest('.form-row').style.opacity = fuelType.value === 'nev' ? '0.4' : '1';
        displacement.disabled = fuelType.value === 'nev';
        calculateAndRender(container);
      });
    }

    const autoCalcInputs = container.querySelectorAll('input, select');
    autoCalcInputs.forEach(input => {
      if (input.id !== 'btn-calculate') {
        input.addEventListener('change', () => calculateAndRender(container));
        if (input.type === 'number') {
          input.addEventListener('input', () => calculateAndRender(container));
        }
      }
    });
  }

  function calculateAndRender(container) {
    const price = parseFloat(container.querySelector('#calc-price')?.value) || 0;
    const displacement = parseFloat(container.querySelector('#calc-displacement')?.value) || 1.6;
    const city = container.querySelector('#calc-city')?.value || 'default';
    const coverage = container.querySelector('#calc-coverage')?.value || 'standard';
    const fuelType = container.querySelector('#calc-fuel-type')?.value || 'fuel';

    const result = calculatorContext.calculateTotal({
      price, displacement, city, coverage, fuelType
    });

    container.querySelector('#total-amount').textContent =
      `¥${result.total.toLocaleString('zh-CN')}`;

    const breakdownEl = container.querySelector('#cost-breakdown');
    breakdownEl.innerHTML = result.breakdown.map(item => `
      <li>
        <span class="cost-name">${item.name}</span>
        <span class="cost-value">¥${item.value.toLocaleString('zh-CN')}</span>
      </li>
    `).join('');

    drawPieChart(container.querySelector('#cost-chart'), result.breakdown, result.total);
  }

  function drawPieChart(canvas, breakdown, total) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = 300;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 110;
    const colors = [
      '#1a73e8', '#34a853', '#fbbc04', '#ea4335',
      '#8e24aa', '#00acc1', '#ff7043', '#9e9e9e'
    ];

    ctx.clearRect(0, 0, size, size);

    let startAngle = -Math.PI / 2;
    const filtered = breakdown.filter(item => item.value > 0);

    filtered.forEach((item, i) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();

      if (sliceAngle > 0.15) {
        const midAngle = startAngle + sliceAngle / 2;
        const labelR = radius * 0.65;
        const lx = cx + Math.cos(midAngle) * labelR;
        const ly = cy + Math.sin(midAngle) * labelR;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const pct = Math.round((item.value / total) * 100);
        ctx.fillText(`${pct}%`, lx, ly);
      }

      startAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.45, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.fillStyle = '#202124';
    ctx.font = 'bold 16px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`¥${(total / 10000).toFixed(1)}万`, cx, cy);

    const legendY = cy + radius + 25;
    const cols = 2;
    const itemWidth = size / cols;
    filtered.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const lx = col * itemWidth + 20;
      const ly = legendY + row * 22;

      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(lx, ly - 6, 10, 10);
      ctx.fillStyle = '#5f6368';
      ctx.font = '11px -apple-system, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.name, lx + 14, ly);
    });
  }

  return { render, init };
})();

window.CalculatorModule = CalculatorModule;