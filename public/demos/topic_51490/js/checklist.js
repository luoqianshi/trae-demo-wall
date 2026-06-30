/**
 * 现场看车避坑 Checklist 模块
 * 支持离线保存（localStorage），进度追踪
 */

const ChecklistModule = (() => {
  const CHECKLIST_KEY = 'ucbg_checklist';

  const defaultChecklist = [
    {
      id: 'exterior',
      title: '外观检查',
      icon: '🚗',
      items: [
        { id: 'ext-1', text: '检查车身漆面是否有色差，各角度光线观察', note: '重点看车门、翼子板接缝处' },
        { id: 'ext-2', text: '检查车身缝隙是否均匀，左右对称', note: '不均匀可能发生过事故' },
        { id: 'ext-3', text: '检查所有玻璃生产日期是否一致', note: '日期应在车辆出厂前' },
        { id: 'ext-4', text: '检查轮胎磨损程度和生产日期', note: '4条轮胎日期应接近' },
        { id: 'ext-5', text: '检查大灯是否有发黄、进水起雾', note: '两侧大灯新旧程度应一致' },
        { id: 'ext-6', text: '检查车门铰链螺丝是否有拆卸痕迹', note: '原厂螺丝有漆封标记' },
        { id: 'ext-7', text: '检查前后保险杠是否有修复痕迹', note: '观察螺丝和卡扣' },
        { id: 'ext-8', text: '检查车顶是否有凹陷、修复痕迹', note: '车顶修复是大事故信号' }
      ]
    },
    {
      id: 'interior',
      title: '内饰检查',
      icon: '💺',
      items: [
        { id: 'int-1', text: '检查座椅磨损程度是否与里程表匹配', note: '严重磨损但里程低 = 调表嫌疑' },
        { id: 'int-2', text: '检查方向盘、档把、踏板磨损情况', note: '这些部件磨损无法隐藏' },
        { id: 'int-3', text: '检查安全带生产日期是否与车辆出厂日期匹配', note: '日期不符说明更换过（事故）' },
        { id: 'int-4', text: '检查仪表盘是否有故障灯亮起', note: '通电自检后所有灯应熄灭' },
        { id: 'int-5', text: '检查空调制冷/制热、出风口切换', note: '各档位都要试' },
        { id: 'int-6', text: '检查音响、中控屏、倒车影像功能', note: '逐个测试所有功能键' },
        { id: 'int-7', text: '检查天窗开合是否顺畅、有无漏水痕迹', note: '看顶棚有无水渍' },
        { id: 'int-8', text: '检查备胎、千斤顶、三角牌是否齐全', note: '随车工具容易被忽略' }
      ]
    },
    {
      id: 'engine',
      title: '发动机舱检查',
      icon: '🔧',
      items: [
        { id: 'eng-1', text: '检查发动机有无漏油痕迹', note: '重点看缸盖、油底壳接缝' },
        { id: 'eng-2', text: '检查机油尺，机油颜色和液位', note: '发黑正常，但不应有乳化' },
        { id: 'eng-3', text: '检查冷却液液位和颜色', note: '冷却液壶内不应有油花' },
        { id: 'eng-4', text: '检查刹车油液位和颜色', note: '刹车油应清亮透明' },
        { id: 'eng-5', text: '检查电瓶状态和接线柱腐蚀情况', note: '观察电瓶观察窗颜色' },
        { id: 'eng-6', text: '检查发动机舱内螺丝是否有拆卸痕迹', note: '翼子板、水箱框架螺丝' },
        { id: 'eng-7', text: '检查皮带是否有裂纹、老化', note: '启动后听有无异响' },
        { id: 'eng-8', text: '闻发动机舱有无异味（汽油、焦糊味）', note: '任何异常气味都要警惕' }
      ]
    },
    {
      id: 'chassis',
      title: '底盘检查',
      icon: '🔩',
      items: [
        { id: 'chs-1', text: '检查底盘是否有严重锈蚀', note: '海边城市用车要特别注意' },
        { id: 'chs-2', text: '检查减震器是否漏油', note: '4根减震器都要看' },
        { id: 'chs-3', text: '检查排气管是否有锈穿、破损', note: '启动后听排气声音' },
        { id: 'chs-4', text: '检查半轴防尘套是否破损漏油', note: '破损会导致半轴损坏' },
        { id: 'chs-5', text: '检查底盘是否有碰撞修复痕迹', note: '看纵梁有无变形、焊接' },
        { id: 'chs-6', text: '检查刹车片/刹车盘磨损程度', note: '刹车盘边缘台阶高度' }
      ]
    },
    {
      id: 'testdrive',
      title: '试驾检查',
      icon: '🏁',
      items: [
        { id: 'td-1', text: '冷车启动，观察启动是否顺畅', note: '多次打火才启动 = 问题' },
        { id: 'td-2', text: '怠速时观察方向盘和座椅是否抖动', note: '异常抖动可能是机脚胶老化' },
        { id: 'td-3', text: '行驶中方向盘是否跑偏', note: '平直路面松开方向盘测试' },
        { id: 'td-4', text: '加速时发动机响应是否平顺', note: '顿挫、无力需警惕' },
        { id: 'td-5', text: '刹车时是否有异响、抖动', note: '高速刹车抖动 = 刹车盘变形' },
        { id: 'td-6', text: '过减速带时底盘是否有异响', note: '咯吱声可能是胶套老化' },
        { id: 'td-7', text: '变速箱换挡是否平顺', note: '自动挡注意顿挫，手动挡注意打齿' },
        { id: 'td-8', text: '方向盘打死时有无异响', note: '咯噔声可能是球笼损坏' }
      ]
    },
    {
      id: 'documents',
      title: '手续检查',
      icon: '📋',
      items: [
        { id: 'doc-1', text: '检查机动车登记证书（大绿本）', note: '看过户次数、使用性质' },
        { id: 'doc-2', text: '检查行驶证，核对车架号、发动机号', note: '与实车必须一致' },
        { id: 'doc-3', text: '检查交强险保单有效期', note: '过期需重新购买' },
        { id: 'doc-4', text: '检查车辆是否在抵押状态', note: '抵押车不能过户' },
        { id: 'doc-5', text: '查询4S店维修保养记录', note: '可用第三方App查询' },
        { id: 'doc-6', text: '查询出险记录', note: '重大事故通常有保险记录' },
        { id: 'doc-7', text: '检查是否还有未处理的违章', note: '有违章无法过户' },
        { id: 'doc-8', text: '确认车辆排放标准', note: '国四以下很多城市限迁' }
      ]
    }
  ];

  function loadData() {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(data));
    } catch (e) {
      ComponentFactory.createToast('保存失败，请检查浏览器存储空间');
    }
  }

  function isChecked(itemId) {
    const data = loadData();
    return !!data[itemId];
  }

  function toggleItem(itemId) {
    const data = loadData();
    data[itemId] = !data[itemId];
    saveData(data);
    return data[itemId];
  }

  function getProgress() {
    const data = loadData();
    let total = 0;
    let checked = 0;
    defaultChecklist.forEach(group => {
      group.items.forEach(item => {
        total++;
        if (data[item.id]) checked++;
      });
    });
    return { checked, total, percentage: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }

  function getGroupProgress(groupId) {
    const data = loadData();
    const group = defaultChecklist.find(g => g.id === groupId);
    if (!group) return { checked: 0, total: 0, percentage: 0 };
    let checked = 0;
    group.items.forEach(item => {
      if (data[item.id]) checked++;
    });
    return { checked, total: group.items.length, percentage: Math.round((checked / group.items.length) * 100) };
  }

  function resetAll() {
    localStorage.removeItem(CHECKLIST_KEY);
  }

  function exportData() {
    const data = loadData();
    const progress = getProgress();
    const exportObj = {
      exportTime: new Date().toISOString(),
      progress,
      items: defaultChecklist.map(group => ({
        group: group.title,
        items: group.items.map(item => ({
          text: item.text,
          checked: !!data[item.id],
          note: item.note
        }))
      }))
    };
    return JSON.stringify(exportObj, null, 2);
  }

  function render(container) {
    const data = loadData();
    const progress = getProgress();

    container.innerHTML = `
      <div class="checklist-container">
        <h2 style="font-size:1.4rem;font-weight:700;margin-bottom:1rem;">📋 现场看车避坑 Checklist</h2>
        <p style="color:var(--gray-700);font-size:0.9rem;margin-bottom:1.5rem;">
          逐项检查，完成全部项目可大幅降低买到问题车的风险。<br>
          <small style="color:var(--gray-500);">数据自动保存到浏览器本地，不会上传到服务器。</small>
        </p>

        <div class="checklist-progress">
          <span style="font-weight:600;">总体进度</span>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" style="width:${progress.percentage}%"></div>
          </div>
          <span class="progress-text">${progress.checked}/${progress.total} (${progress.percentage}%)</span>
        </div>

        <div id="checklist-groups"></div>

        <div class="checklist-actions">
          <button class="btn btn-success" id="btn-check-all">✅ 全部完成</button>
          <button class="btn btn-outline" id="btn-reset">🔄 重置全部</button>
          <button class="btn btn-outline" id="btn-export">📤 导出结果</button>
        </div>

        <div class="disclaimer" style="margin-top:1.5rem;">
          <strong>⚠️ 免责声明：</strong>本 Checklist 基于经验整理，仅供参考。<br>
          实际车况以专业第三方检测机构出具的检测报告为准。建议购车前委托独立检测机构进行全面检测。
        </div>
      </div>
    `;

    const groupsContainer = container.querySelector('#checklist-groups');

    defaultChecklist.forEach(group => {
      const gp = getGroupProgress(group.id);
      const groupEl = document.createElement('div');
      groupEl.className = 'checklist-group';
      groupEl.innerHTML = `
        <div class="checklist-group-header" data-group="${group.id}">
          <span>${group.icon} ${group.title}</span>
          <span class="group-progress">${gp.checked}/${gp.total}</span>
        </div>
        <div class="checklist-group-body">
          ${group.items.map(item => {
            const checked = isChecked(item.id);
            return `
              <div class="checklist-item ${checked ? 'checked' : ''}" data-id="${item.id}">
                <input type="checkbox" ${checked ? 'checked' : ''} id="chk-${item.id}">
                <label for="chk-${item.id}">${item.text}</label>
                <span class="note">${item.note}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
      groupsContainer.appendChild(groupEl);
    });

    container.querySelectorAll('.checklist-item').forEach(itemEl => {
      const checkbox = itemEl.querySelector('input[type="checkbox"]');
      const itemId = itemEl.dataset.id;
      checkbox.addEventListener('change', () => {
        const checked = toggleItem(itemId);
        itemEl.classList.toggle('checked', checked);
        updateProgress(container);
      });
    });

    container.querySelector('#btn-check-all').addEventListener('click', () => {
      defaultChecklist.forEach(group => {
        group.items.forEach(item => {
          const data = loadData();
          if (!data[item.id]) {
            data[item.id] = true;
            saveData(data);
          }
        });
      });
      render(container);
      ComponentFactory.createToast('✅ 全部项目已标记完成！');
    });

    container.querySelector('#btn-reset').addEventListener('click', () => {
      if (confirm('确定要重置所有检查项吗？此操作不可恢复！')) {
        resetAll();
        render(container);
        ComponentFactory.createToast('已重置全部检查项');
      }
    });

    container.querySelector('#btn-export').addEventListener('click', () => {
      const json = exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `二手车检查清单_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      ComponentFactory.createToast('📤 检查结果已导出');
    });
  }

  function updateProgress(container) {
    const progress = getProgress();
    const fill = container.querySelector('.progress-bar-fill');
    const text = container.querySelector('.progress-text');
    if (fill) fill.style.width = `${progress.percentage}%`;
    if (text) text.textContent = `${progress.checked}/${progress.total} (${progress.percentage}%)`;

    defaultChecklist.forEach(group => {
      const gp = getGroupProgress(group.id);
      const header = container.querySelector(`[data-group="${group.id}"] .group-progress`);
      if (header) header.textContent = `${gp.checked}/${gp.total}`;
    });
  }

  return { render, getProgress, resetAll, exportData, isChecked, toggleItem };
})();

window.ChecklistModule = ChecklistModule;