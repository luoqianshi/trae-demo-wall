const onboardingPage = {
  currentStep: 0,
  totalSteps: 4,
  formData: {
    height: '',
    weight: '',
    age: '',
    gender: '',
    occupation: '',
    systolic: '',
    diastolic: '',
    fastingGlucose: '',
    postprandialGlucose: '',
    hba1c: '',
    totalCholesterol: '',
    triglycerides: '',
    hdl: '',
    ldl: '',
    uricAcid: '',
    waist: '',
    diseases: [],
    dietPreference: '',
    wakeTime: '07:00',
    sleepTime: '23:00',
    exerciseFrequency: '',
  },

  steps: [
    {
      title: '基本信息',
      desc: '让我们了解你的基本身体数据'
    },
    {
      title: '体检指标',
      desc: '录入关键体检数据，用于AI精准分析'
    },
    {
      title: '生活习惯',
      desc: '了解你的日常习惯，给出更好建议'
    },
    {
      title: '分析确认',
      desc: '确认信息后生成你的专属健康方案'
    }
  ],

  dietOptions: [
    { value: 'balanced', icon: '\u{1F35A}', text: '均衡饮食' },
    { value: 'vegetarian', icon: '\u{1F96C}', text: '素食' },
    { value: 'low_carb', icon: '\u{1F951}', text: '低碳水' },
    { value: 'high_protein', icon: '\u{1F969}', text: '高蛋白' },
    { value: 'mediterranean', icon: '\u{1FAD2}', text: '地中海饮食' },
    { value: 'light', icon: '\u{1F963}', text: '清淡饮食' },
  ],

  exerciseOptions: [
    { value: 'never', icon: '\u{1F6CB}', text: '基本不运动' },
    { value: '1_2', icon: '\u{1F6B6}', text: '每周1-2次' },
    { value: '3_4', icon: '\u{1F3C3}', text: '每周3-4次' },
    { value: '5_plus', icon: '\u{1F4AA}', text: '每天运动' },
    { value: 'professional', icon: '\u{1F3CB}', text: '专业训练' },
    { value: 'yoga', icon: '\u{1F9D8}', text: '瑜伽/拉伸' },
  ],

  diseaseOptions: [
    { value: 'hypertension', text: '高血压' },
    { value: 'diabetes', text: '糖尿病' },
    { value: 'hyperlipidemia', text: '高血脂' },
    { value: 'heart_disease', text: '心脏病' },
    { value: 'none', text: '无' },
  ],

  render() {
    const app = document.getElementById('app');
    const step = this.steps[this.currentStep];
    app.innerHTML = `
      <div class="page no-nav">
        <div class="page-header">
          <h1>${step.title}</h1>
          <div class="subtitle">${step.desc}</div>
        </div>
        <div class="steps-indicator">
          ${Array.from({ length: this.totalSteps }, (_, i) => {
            let cls = 'step-dot';
            if (i === this.currentStep) cls += ' active';
            else if (i < this.currentStep) cls += ' done';
            return `<div class="${cls}"></div>`;
          }).join('')}
        </div>
        <div class="section" id="onboarding-content"></div>
        <div class="section btn-group" id="onboarding-actions"></div>
      </div>
    `;
    this.renderStep();
  },

  renderStep() {
    const content = document.getElementById('onboarding-content');
    const actions = document.getElementById('onboarding-actions');

    switch (this.currentStep) {
      case 0: this.renderBasicInfo(content); break;
      case 1: this.renderHealthMetrics(content); break;
      case 2: this.renderLifestyle(content); break;
      case 3: this.renderAnalysisConfirm(content); break;
    }

    actions.innerHTML = `
      ${this.currentStep > 0 ? '<button class="btn btn-secondary" id="prev-btn">上一步</button>' : ''}
      ${this.currentStep < this.totalSteps - 1
        ? '<button class="btn btn-primary" id="next-btn">下一步</button>'
        : '<button class="btn btn-primary" id="submit-btn">确认并生成方案</button>'}
    `;

    if (document.getElementById('prev-btn')) {
      document.getElementById('prev-btn').addEventListener('click', () => {
        this.saveStepData();
        this.currentStep--;
        this.render();
      });
    }

    if (document.getElementById('next-btn')) {
      document.getElementById('next-btn').addEventListener('click', () => {
        if (this.validateStep()) {
          this.saveStepData();
          this.currentStep++;
          this.render();
        }
      });
    }

    if (document.getElementById('submit-btn')) {
      document.getElementById('submit-btn').addEventListener('click', () => {
        if (this.validateStep()) {
          this.saveStepData();
          this.submit();
        }
      });
    }
  },

  renderBasicInfo(container) {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">性别</label>
        <div class="options-grid">
          <div class="option-item ${this.formData.gender === 'male' ? 'selected' : ''}" data-field="gender" data-value="male">
            <span class="option-icon">\u{1F468}</span>
            <span class="option-text">男</span>
          </div>
          <div class="option-item ${this.formData.gender === 'female' ? 'selected' : ''}" data-field="gender" data-value="female">
            <span class="option-icon">\u{1F469}</span>
            <span class="option-text">女</span>
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">年龄</label>
        <input class="form-input" type="number" id="ob-age" placeholder="请输入年龄" min="1" max="120" value="${this.formData.age}">
        <div class="form-error" id="error-age"></div>
      </div>
      <div class="form-group">
        <label class="form-label">身高 (cm)</label>
        <input class="form-input" type="number" id="ob-height" placeholder="请输入身高" min="50" max="250" value="${this.formData.height}">
        <div class="form-error" id="error-height"></div>
      </div>
      <div class="form-group">
        <label class="form-label">体重 (kg)</label>
        <input class="form-input" type="number" id="ob-weight" placeholder="请输入体重" min="20" max="300" value="${this.formData.weight}">
        <div class="form-error" id="error-weight"></div>
      </div>
      <div class="form-group">
        <label class="form-label">职业</label>
        <input class="form-input" type="text" id="ob-occupation" placeholder="请输入职业（如：程序员、教师）" value="${this.formData.occupation}">
      </div>
    `;

    container.querySelectorAll('.option-item').forEach(item => {
      item.addEventListener('click', () => {
        const field = item.dataset.field;
        const value = item.dataset.value;
        this.formData[field] = value;
        container.querySelectorAll(`.option-item[data-field="${field}"]`).forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  },

  renderHealthMetrics(container) {
    const row = (id, label, placeholder, value, hint) => `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <input class="form-input" type="number" step="0.1" id="${id}" placeholder="${placeholder}" value="${value}">
        <div class="form-error" id="error-${id}"></div>
        <div style="font-size:11px;color:var(--text-light);margin-top:4px;">参考范围: ${hint}</div>
      </div>
    `;

    container.innerHTML = `
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">\u{1FA78} 血压 (mmHg)</div>
        <div style="display:flex;gap:12px;">
          ${row('ob-systolic', '收缩压', '120', this.formData.systolic, '90-120')}
          ${row('ob-diastolic', '舒张压', '80', this.formData.diastolic, '60-80')}
        </div>
      </div>
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">\u{1F948} 血糖</div>
        ${row('ob-fasting-glucose', '空腹血糖 (mmol/L)', '5.6', this.formData.fastingGlucose, '3.9-6.1')}
        ${row('ob-postprandial-glucose', '餐后血糖 (mmol/L)', '6.7', this.formData.postprandialGlucose, '<7.8')}
        ${row('ob-hba1c', '糖化血红蛋白 (%)', '5.5', this.formData.hba1c, '4-6')}
      </div>
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">\u{1F9C0} 血脂 (mmol/L)</div>
        <div style="display:flex;gap:12px;">
          ${row('ob-total-cholesterol', '总胆固醇', '4.5', this.formData.totalCholesterol, '<5.2')}
          ${row('ob-triglycerides', '甘油三酯', '1.2', this.formData.triglycerides, '<1.7')}
        </div>
        <div style="display:flex;gap:12px;margin-top:12px;">
          ${row('ob-hdl', 'HDL', '1.2', this.formData.hdl, '>=1.0')}
          ${row('ob-ldl', 'LDL', '2.8', this.formData.ldl, '<3.4')}
        </div>
      </div>
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">\u{1F9A0} 其他指标</div>
        <div style="display:flex;gap:12px;">
          ${row('ob-uric-acid', '尿酸 (\u03BCmol/L)', '350', this.formData.uricAcid, '男<420 女<360')}
          ${row('ob-waist', '腰围 (cm)', '80', this.formData.waist, '男<85 女<80')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">基础疾病（可多选）</label>
        <div class="options-grid">
          ${this.diseaseOptions.map(d => `
            <div class="option-item ${this.formData.diseases.includes(d.value) ? 'selected' : ''}" data-disease="${d.value}">
              <span class="option-text">${d.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.option-item[data-disease]').forEach(item => {
      item.addEventListener('click', () => {
        const value = item.dataset.disease;
        if (value === 'none') {
          this.formData.diseases = ['none'];
          container.querySelectorAll('.option-item[data-disease]').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');
        } else {
          this.formData.diseases = this.formData.diseases.filter(d => d !== 'none');
          container.querySelector('.option-item[data-disease="none"]')?.classList.remove('selected');

          if (this.formData.diseases.includes(value)) {
            this.formData.diseases = this.formData.diseases.filter(d => d !== value);
            item.classList.remove('selected');
          } else {
            this.formData.diseases.push(value);
            item.classList.add('selected');
          }
        }
      });
    });
  },

  renderLifestyle(container) {
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">饮食偏好</label>
        <div class="options-grid">
          ${this.dietOptions.map(d => `
            <div class="option-item ${this.formData.dietPreference === d.value ? 'selected' : ''}" data-diet="${d.value}">
              <span class="option-icon">${d.icon}</span>
              <span class="option-text">${d.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">起床时间</label>
        <input class="form-input" type="time" id="ob-wake" value="${this.formData.wakeTime}">
      </div>
      <div class="form-group">
        <label class="form-label">睡觉时间</label>
        <input class="form-input" type="time" id="ob-sleep" value="${this.formData.sleepTime}">
      </div>
      <div class="form-group">
        <label class="form-label">运动频率</label>
        <div class="options-grid">
          ${this.exerciseOptions.map(e => `
            <div class="option-item ${this.formData.exerciseFrequency === e.value ? 'selected' : ''}" data-exercise="${e.value}">
              <span class="option-icon">${e.icon}</span>
              <span class="option-text">${e.text}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.option-item[data-diet]').forEach(item => {
      item.addEventListener('click', () => {
        this.formData.dietPreference = item.dataset.diet;
        container.querySelectorAll('.option-item[data-diet]').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
      });
    });

    container.querySelectorAll('.option-item[data-exercise]').forEach(item => {
      item.addEventListener('click', () => {
        this.formData.exerciseFrequency = item.dataset.exercise;
        container.querySelectorAll('.option-item[data-exercise]').forEach(el => el.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  },

  renderAnalysisConfirm(container) {
    const bmi = this.calcBMI();
    const bmiText = bmi ? `${bmi} (${this.bmiLabel(bmi)})` : '--';
    const bpText = (this.formData.systolic && this.formData.diastolic) ? `${this.formData.systolic}/${this.formData.diastolic}` : '--';

    container.innerHTML = `
      <div class="card" style="margin:0 0 12px;">
        <div class="card-title">\u{1F4CB} 信息摘要</div>
        <div style="font-size:14px;color:var(--text-secondary);line-height:1.8;">
          <p><strong>性别:</strong> ${this.formData.gender === 'male' ? '男' : (this.formData.gender === 'female' ? '女' : '--')}</p>
          <p><strong>年龄:</strong> ${this.formData.age || '--'} 岁</p>
          <p><strong>身高/体重:</strong> ${this.formData.height || '--'} cm / ${this.formData.weight || '--'} kg</p>
          <p><strong>BMI:</strong> ${bmiText}</p>
          <p><strong>血压:</strong> ${bpText} mmHg</p>
          <p><strong>基础疾病:</strong> ${this.formData.diseases.length > 0 && !this.formData.diseases.includes('none') ? this.formData.diseases.map(d => {
            const map = { hypertension: '高血压', diabetes: '糖尿病', hyperlipidemia: '高血脂', heart_disease: '心脏病' };
            return map[d] || d;
          }).join('、') : '无'}</p>
          <p><strong>饮食偏好:</strong> ${this.dietOptions.find(d => d.value === this.formData.dietPreference)?.text || '--'}</p>
          <p><strong>运动频率:</strong> ${this.exerciseOptions.find(e => e.value === this.formData.exerciseFrequency)?.text || '--'}</p>
        </div>
      </div>
      <div style="background:var(--warning-bg);border-radius:var(--radius-sm);padding:12px;font-size:13px;color:var(--accent-dark);line-height:1.6;">
        \u{1F4A1} AI将根据以上信息为您生成专属健康方案，包括饮食计划和运动建议。
      </div>
    `;
  },

  calcBMI() {
    const h = parseFloat(this.formData.height);
    const w = parseFloat(this.formData.weight);
    if (!h || !w) return null;
    return (w / ((h / 100) ** 2)).toFixed(1);
  },

  bmiLabel(bmi) {
    const v = parseFloat(bmi);
    if (v < 18.5) return '偏瘦';
    if (v < 24) return '正常';
    if (v < 28) return '偏胖';
    return '肥胖';
  },

  validateStep() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error'));

    if (this.currentStep === 0) {
      let valid = true;
      const age = document.getElementById('ob-age')?.value;
      const height = document.getElementById('ob-height')?.value;
      const weight = document.getElementById('ob-weight')?.value;

      if (!this.formData.gender) {
        showToast('请选择性别', 'error');
        valid = false;
      }
      if (!age || age < 1 || age > 120) {
        const g = document.getElementById('ob-age')?.closest('.form-group');
        if (g) g.classList.add('error');
        const e = document.getElementById('error-age');
        if (e) e.textContent = '请输入有效年龄（1-120）';
        valid = false;
      }
      if (!height || height < 50 || height > 250) {
        const g = document.getElementById('ob-height')?.closest('.form-group');
        if (g) g.classList.add('error');
        const e = document.getElementById('error-height');
        if (e) e.textContent = '请输入有效身高（50-250cm）';
        valid = false;
      }
      if (!weight || weight < 20 || weight > 300) {
        const g = document.getElementById('ob-weight')?.closest('.form-group');
        if (g) g.classList.add('error');
        const e = document.getElementById('error-weight');
        if (e) e.textContent = '请输入有效体重（20-300kg）';
        valid = false;
      }
      return valid;
    }
    return true;
  },

  saveStepData() {
    if (this.currentStep === 0) {
      this.formData.age = document.getElementById('ob-age')?.value || '';
      this.formData.height = document.getElementById('ob-height')?.value || '';
      this.formData.weight = document.getElementById('ob-weight')?.value || '';
      this.formData.occupation = document.getElementById('ob-occupation')?.value || '';
    } else if (this.currentStep === 1) {
      this.formData.systolic = document.getElementById('ob-systolic')?.value || '';
      this.formData.diastolic = document.getElementById('ob-diastolic')?.value || '';
      this.formData.fastingGlucose = document.getElementById('ob-fasting-glucose')?.value || '';
      this.formData.postprandialGlucose = document.getElementById('ob-postprandial-glucose')?.value || '';
      this.formData.hba1c = document.getElementById('ob-hba1c')?.value || '';
      this.formData.totalCholesterol = document.getElementById('ob-total-cholesterol')?.value || '';
      this.formData.triglycerides = document.getElementById('ob-triglycerides')?.value || '';
      this.formData.hdl = document.getElementById('ob-hdl')?.value || '';
      this.formData.ldl = document.getElementById('ob-ldl')?.value || '';
      this.formData.uricAcid = document.getElementById('ob-uric-acid')?.value || '';
      this.formData.waist = document.getElementById('ob-waist')?.value || '';
    } else if (this.currentStep === 2) {
      this.formData.wakeTime = document.getElementById('ob-wake')?.value || '07:00';
      this.formData.sleepTime = document.getElementById('ob-sleep')?.value || '23:00';
    }
  },

  async submit() {
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = '提交中...';

    try {
      // 1. 保存基础资料
      const profileResult = await api.updateProfile({
        height: this.formData.height,
        weight: this.formData.weight,
        age: this.formData.age,
        gender: this.formData.gender,
        occupation: this.formData.occupation,
        bloodPressure: this.formData.systolic && this.formData.diastolic ? `${this.formData.systolic}/${this.formData.diastolic}` : '',
        bloodLipid: this.formData.totalCholesterol ? 'has_data' : '',
        bloodSugar: this.formData.fastingGlucose ? 'has_data' : '',
        diseases: this.formData.diseases,
        dietPreference: this.formData.dietPreference,
        wakeTime: this.formData.wakeTime,
        sleepTime: this.formData.sleepTime,
        exerciseFrequency: this.formData.exerciseFrequency,
      });

      if (profileResult.code !== 0) {
        throw new Error(profileResult.message || '保存基础信息失败');
      }

      // 2. 保存体检指标（转换为后端期望的 metrics 数组格式）
      var metricsArray = [];
      var fd = this.formData;
      if (fd.systolic || fd.diastolic) {
        metricsArray.push({ metric_type: 'blood_pressure', value: { systolic: parseFloat(fd.systolic)||0, diastolic: parseFloat(fd.diastolic)||0 } });
      }
      if (fd.fastingGlucose || fd.postprandialGlucose) {
        metricsArray.push({ metric_type: 'blood_sugar', value: { fasting: parseFloat(fd.fastingGlucose)||0, postprandial: parseFloat(fd.postprandialGlucose)||0 } });
      }
      if (fd.hba1c) {
        metricsArray.push({ metric_type: 'hba1c', value: { value: parseFloat(fd.hba1c) } });
      }
      if (fd.totalCholesterol || fd.triglycerides || fd.hdl || fd.ldl) {
        metricsArray.push({ metric_type: 'blood_lipid', value: { total_cholesterol: parseFloat(fd.totalCholesterol)||0, triglycerides: parseFloat(fd.triglycerides)||0, hdl: parseFloat(fd.hdl)||0, ldl: parseFloat(fd.ldl)||0 } });
      }
      if (fd.uricAcid) {
        metricsArray.push({ metric_type: 'uric_acid', value: { value: parseFloat(fd.uricAcid) } });
      }
      if (fd.waist) {
        metricsArray.push({ metric_type: 'waist', value: { value: parseFloat(fd.waist) } });
      }
      if (fd.height && fd.weight) {
        metricsArray.push({ metric_type: 'bmi', value: { height: parseFloat(fd.height), weight: parseFloat(fd.weight) } });
      }

      if (metricsArray.length > 0) {
        const metricsResult = await api.submitMetrics({ metrics: metricsArray });
        if (metricsResult.code !== 0) {
          console.warn('体检指标保存失败:', metricsResult.message);
        }
      }

      // 3. 生成方案
      const planResult = await api.generatePlan();
      if (planResult.code !== 0) {
        throw new Error(planResult.message || '生成方案失败');
      }

      localStorage.removeItem('guestMode');
      showToast('方案生成成功！', 'success');
      setTimeout(() => {
        window.location.hash = '#/plan';
      }, 800);
    } catch (err) {
      showToast(err.message || '操作失败，请重试', 'error');
      btn.disabled = false;
      btn.textContent = '确认并生成方案';
    }
  }
};
