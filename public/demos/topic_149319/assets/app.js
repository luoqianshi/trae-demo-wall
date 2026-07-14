/**
 * 荣归 - 前端交互逻辑
 * 配套后端: ronggui_multi_agent.py (LangGraph多Agent系统)
 */

// ============================================================
// 配置（与后端 .env 对应）
// ============================================================
const API_BASE = 'http://localhost:8000';  // 后端API地址
const API_ENDPOINT = '/api/match';          // 匹配接口

// ============================================================
// 示例数据
// ============================================================
const EXAMPLES = {
  comms: `李明，男，30岁，退伍军人。
服役部队：某集团军通信团
服役时间：2014年-2024年（10年）
军衔：四级军士长
岗位：通信技师/通信班长

主要经历：
- 负责野战通信系统的规划、部署和维护
- 精通短波/超短波/卫星通信设备操作
- 带领12人通信班，完成5次重大演习通信保障
- 持有通信技师高级职业资格证书
- 熟悉光纤熔接、网络布线、无线电频率管理
- 主导完成某型通信装备技术革新，获军队科技进步三等奖
- 优秀士官4次，三等功2次`,

  armor: `王强，男，32岁，退伍军人。
服役部队：某合成旅装甲营
服役时间：2012年-2024年（12年）
军衔：三级军士长
岗位：装甲车车长/驾驶技师

主要经历：
- 驾驶各型装甲车辆累计行驶8000+小时
- 精通96A主战坦克、04A步战车驾驶与操作
- 带领车组完成实弹射击、跨区演习等重大任务20余次
- 持有装甲车驾驶一级证书、机械维修高级证书
- 熟悉柴油发动机维修、液压系统维护、履带底盘保养
- 培养装甲车驾驶员60余人，合格率98%
- 荣立二等功1次、三等功3次`,

  medic: `陈静，女，27岁，退伍军人。
服役部队：某战区总医院
服役时间：2017年-2024年（7年）
军衔：上士
岗位：战地救护员/护理技师

主要经历：
- 负责野战医疗所的急救护理和伤员转运
- 精通创伤急救、心肺复苏、止血包扎等战地救护技能
- 参与抗震救灾、抗洪抢险等卫勤保障任务6次
- 持有护士执业资格证、急救员证书
- 熟悉药品管理、医疗器械操作、卫生防疫
- 护理伤病员累计2000余人次，零差错
- 优秀士官3次，嘉奖5次`
};

// ============================================================
// 示例填充
// ============================================================
function fillExample(type) {
  const textarea = document.getElementById('resumeInput');
  textarea.value = EXAMPLES[type] || '';
  textarea.focus();
}

// ============================================================
// Tab切换
// ============================================================
function switchTab(tabName) {
  document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

  event.target.classList.add('active');
  document.getElementById('tab-' + tabName).classList.add('active');
}

// ============================================================
// 步骤动画
// ============================================================
function setStepActive(stepNum) {
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('step-' + i);
    el.classList.remove('active', 'done');
    if (i < stepNum) el.classList.add('done');
    else if (i === stepNum) el.classList.add('active');
  }
}

function setAllStepsDone() {
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById('step-' + i);
    el.classList.remove('active');
    el.classList.add('done');
  }
}

// ============================================================
// 主流程：开始匹配
// ============================================================
async function startMatching() {
  const input = document.getElementById('resumeInput').value.trim();
  if (!input) {
    alert('请先输入您的军人履历信息');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  const processingSection = document.getElementById('processingSection');
  const resultsSection = document.getElementById('resultsSection');
  const apiStatus = document.getElementById('apiStatus');

  // 重置UI
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<div class="processing-spinner" style="width:16px;height:16px;border-width:2px;"></div> 处理中...';
  processingSection.classList.add('active');
  resultsSection.classList.remove('active');
  apiStatus.textContent = '处理中...';

  // 模拟步骤动画（如果后端不支持流式输出）
  let stepTimer = setInterval(() => {
    const activeStep = document.querySelector('.agent-step.active');
    if (activeStep) {
      const num = parseInt(activeStep.id.split('-')[1]);
      if (num < 6) setStepActive(num + 1);
    } else {
      setStepActive(1);
    }
  }, 2000);

  try {
    // 调用后端API
    const response = await fetch(API_BASE + API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume: input })
    });

    clearInterval(stepTimer);

    if (!response.ok) {
      throw new Error('后端返回错误: ' + response.status);
    }

    const data = await response.json();

    // 完成所有步骤
    setAllStepsDone();
    apiStatus.textContent = '匹配完成';

    // 渲染结果
    setTimeout(() => {
      processingSection.classList.remove('active');
      resultsSection.classList.add('active');
      renderResults(data);
    }, 800);

  } catch (error) {
    clearInterval(stepTimer);
    console.error('匹配失败:', error);
    apiStatus.textContent = '连接失败，使用演示数据';

    // 后端未启动时，使用演示数据
    setTimeout(() => {
      setAllStepsDone();
      processingSection.classList.remove('active');
      resultsSection.classList.add('active');
      renderResults(getDemoData());
    }, 1500);
  }

  // 恢复按钮
  submitBtn.disabled = false;
  submitBtn.innerHTML = '<svg viewBox="0 0 18 18" fill="none"><path d="M9 16A7 7 0 109 2a7 7 0 000 14z" stroke="currentColor" stroke-width="1.5"/><path d="M7 7l4 2-4 2V7z" fill="currentColor"/></svg> 开始匹配';
}

// ============================================================
// 渲染结果
// ============================================================
function renderResults(data) {
  renderResume(data.resume || {});
  renderJobs(data.recommendations || []);
  renderSummary(data.summary || {});
}

// 渲染简历
function renderResume(resume) {
  const el = document.getElementById('resumeResult');
  el.innerHTML = `
    <div class="resume-header">
      <div class="resume-target">${resume.target_position || '通信工程师'}</div>
      <div class="resume-name">${resume.name || '退伍军人'}</div>
    </div>
    <div class="resume-block">
      <div class="resume-block-title">个人简介</div>
      <p>${resume.professional_summary || '具有10年军事通信系统管理经验的高级技术士官，精通野战通信网络规划与部署，具备丰富的团队管理和应急保障经验。'}</p>
    </div>
    <div class="resume-block">
      <div class="resume-block-title">核心技能</div>
      <div class="skill-tags">
        ${(resume.core_skills || ['通信系统规划与部署', '光纤熔接与网络布线', '无线电频率管理', '团队管理（12人）', '应急通信保障', '设备维护与技术革新']).map(s =>
          `<span class="skill-tag">${s}</span>`
        ).join('')}
      </div>
    </div>
    <div class="resume-block">
      <div class="resume-block-title">工作经历</div>
      ${(resume.work_experience || [
        { title: '通信班长/高级通信技师', period: '2014-2024', highlights: ['带领12人团队完成5次重大演习通信保障', '主导通信装备技术革新，获军队科技进步三等奖', '管理价值2000万+的通信装备资产'] }
      ]).map(exp => `
        <div class="experience-item">
          <div class="exp-title">${exp.title}</div>
          <div class="exp-period">${exp.period}</div>
          <ul class="exp-highlights">
            ${exp.highlights.map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </div>
    ${resume.certifications ? `
    <div class="resume-block">
      <div class="resume-block-title">证书荣誉</div>
      <div class="skill-tags">
        ${resume.certifications.map(c => `<span class="skill-tag">${c}</span>`).join('')}
      </div>
    </div>` : ''}
    ${resume.self_evaluation ? `
    <div class="resume-block">
      <div class="resume-block-title">自我评价</div>
      <p>${resume.self_evaluation}</p>
    </div>` : ''}
  `;
}

// 渲染岗位推荐
function renderJobs(jobs) {
  const el = document.getElementById('jobsGrid');

  if (!jobs.length) {
    el.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem;">暂无推荐数据</p>';
    return;
  }

  el.innerHTML = jobs.map((job, i) => {
    const rankClass = i === 0 ? '' : i === 1 ? ' rank-2' : ' rank-3';
    return `
    <div class="job-card">
      <div class="job-card-top">
        <span class="job-rank${rankClass}">第${job.rank || i + 1}名</span>
        <span class="job-source">${job.source === 'web' ? '🌐 全网' : '📦 知识库'}</span>
      </div>
      <div class="job-title">${job.title || '未知岗位'}</div>
      <div class="job-company">${job.company || '未知公司'}</div>
      <div class="job-meta">
        <span>📍 ${job.location || '未知'}</span>
        <span>💰 ${job.salary || '面议'}</span>
      </div>
      <div class="job-scores">
        <div class="score-item">
          <div class="score-value">${job.overall_score || job.skill_match || 0}</div>
          <div class="score-label">综合</div>
          <div class="score-bar"><div class="score-bar-fill" style="width:${job.overall_score || job.skill_match || 0}%"></div></div>
        </div>
        <div class="score-item">
          <div class="score-value">${job.skill_match || 0}</div>
          <div class="score-label">技能匹配</div>
          <div class="score-bar"><div class="score-bar-fill" style="width:${job.skill_match || 0}%"></div></div>
        </div>
        <div class="score-item">
          <div class="score-value">${job.experience_transfer || 0}</div>
          <div class="score-label">经验迁移</div>
          <div class="score-bar"><div class="score-bar-fill" style="width:${job.experience_transfer || 0}%"></div></div>
        </div>
        <div class="score-item">
          <div class="score-value">${job.growth_potential || 0}</div>
          <div class="score-label">发展潜力</div>
          <div class="score-bar"><div class="score-bar-fill" style="width:${job.growth_potential || 0}%"></div></div>
        </div>
      </div>
      ${job.match_reason ? `<div class="job-reason">${job.match_reason}</div>` : ''}
      ${job.interview_tips ? `<div class="job-tips">面试建议：${job.interview_tips}</div>` : ''}
      ${job.skill_gap && job.skill_gap !== '无' ? `<div class="job-tips">需补充：${job.skill_gap}</div>` : ''}
    </div>`;
  }).join('');
}

// 渲染总结
function renderSummary(summary) {
  const el = document.getElementById('summaryCard');
  el.innerHTML = `
    <div class="summary-block">
      <div class="summary-block-title">总体评价</div>
      <p>${summary.overall_advice || '该退伍军人具备扎实的通信专业技能和管理经验，技能可迁移性强，建议优先投向通信工程师、网络运维等方向。'}</p>
    </div>
    <div class="summary-block">
      <div class="summary-block-title">技能提升建议</div>
      <p>${summary.skill_upgrade || '建议考取华为HCIA/HCIP认证、学习云平台运维（AWS/阿里云），补充项目管理知识（PMP），进一步提升市场竞争力。'}</p>
    </div>
    <div class="summary-block">
      <div class="summary-block-title">数据来源说明</div>
      <p>本次推荐数据来源于军地映射知识库（高置信度）和招聘JD数据库。部分岗位信息来自全网搜索补充（仅供参考）。建议优先选择知识库匹配的岗位。</p>
    </div>
  `;
}

// ============================================================
// 演示数据（后端未启动时使用）
// ============================================================
function getDemoData() {
  return {
    resume: {
      name: '李明',
      target_position: '通信工程师 / 网络运维主管',
      professional_summary: '具有10年军事通信系统管理经验的高级技术士官，精通野战通信网络规划与部署，具备丰富的团队管理和应急保障经验。主导过通信装备技术革新项目，拥有出色的问题解决能力和跨部门协作经验。',
      core_skills: ['通信系统规划与部署', '光纤熔接与网络布线', '无线电频率管理', '团队管理（12人）', '应急通信保障', '设备维护与技术革新'],
      work_experience: [
        {
          title: '通信班长 / 高级通信技师',
          period: '2014年 - 2024年 | 某集团军通信团',
          highlights: [
            '带领12人通信班，完成5次重大军事演习通信保障任务',
            '主导某型通信装备技术革新，获军队科技进步三等奖',
            '管理价值2000万+的通信装备资产，完好率保持99%以上',
            '精通短波/超短波/卫星通信设备，持有通信技师高级职业资格证书'
          ]
        }
      ],
      certifications: ['通信技师高级职业资格证书', '优秀士官×4', '三等功×2', '军队科技进步三等奖'],
      self_evaluation: '10年军旅生涯锤炼了严谨的工作作风和强大的执行力。善于在高压环境下快速决策，具备优秀的团队管理和跨部门协调能力。渴望将军事通信经验转化为民用领域价值。'
    },
    recommendations: [
      {
        rank: 1, title: '高级通信工程师', company: '中国移动通信集团',
        location: '北京', salary: '25K-35K', source: 'vector_db',
        skill_match: 95, experience_transfer: 92, growth_potential: 88, overall_score: 92,
        match_reason: '军事通信经验与运营商核心业务高度契合，团队管理能力突出',
        skill_gap: '需补充5G核心网、SDN/NFV知识',
        interview_tips: '重点展示大型通信保障项目的管理经验和技术能力'
      },
      {
        rank: 2, title: '网络运维主管', company: '华为技术有限公司',
        location: '深圳', salary: '30K-45K', source: 'vector_db',
        skill_match: 88, experience_transfer: 90, growth_potential: 92, overall_score: 90,
        match_reason: '网络部署与运维经验直接可迁移，管理经验丰富',
        skill_gap: '需学习华为设备体系和ITIL流程',
        interview_tips: '强调应急保障能力和零差错的运维记录'
      },
      {
        rank: 3, title: '弱电工程项目经理', company: '中建三局',
        location: '武汉', salary: '20K-30K', source: 'vector_db',
        skill_match: 85, experience_transfer: 88, growth_potential: 80, overall_score: 84,
        match_reason: '光纤熔接、网络布线经验直接对口，项目管理能力强',
        skill_gap: '需考取建造师证书',
        interview_tips: '展示大型项目通信保障的组织协调能力'
      },
      {
        rank: 4, title: '无线电频率管理工程师', company: '国家无线电监测中心',
        location: '北京', salary: '18K-25K', source: 'vector_db',
        skill_match: 92, experience_transfer: 85, growth_potential: 75, overall_score: 83,
        match_reason: '军事无线电管理经验稀缺性高，专业对口度极高',
        skill_gap: '需补充民用频段管理法规知识',
        interview_tips: '突出频率管理的专业深度和实战经验'
      },
      {
        rank: 5, title: '应急通信保障主管', company: '中国应急管理部',
        location: '北京', salary: '15K-22K', source: 'web',
        skill_match: 90, experience_transfer: 95, growth_potential: 70, overall_score: 82,
        match_reason: '军事应急通信经验完美匹配，体制内工作稳定',
        skill_gap: '无',
        interview_tips: '重点展示抗灾救援中的通信保障经历'
      }
    ],
    summary: {
      overall_advice: '李明同志具备10年通信领域深厚积累，技能可迁移性极强。建议优先投向通信运营商和设备商的技术管理岗位，同时关注应急管理和无线电管理等稀缺方向。',
      skill_upgrade: '建议考取华为HCIP认证、学习5G/SDN新技术、补充项目管理知识（PMP），可显著提升市场竞争力。'
    }
  };
}
