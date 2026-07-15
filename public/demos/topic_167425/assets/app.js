(function () {
  var state = { platform: 'jd', scenario: 'broken', script: 'merchant' };
  var uploadedFiles = [];
  var platforms = {
    jd: { name: '京东', hint: '京东 · 售后服务', tone: '强调订单、物流和商品照片，先走售后服务单。' },
    taobao: { name: '淘宝', hint: '淘宝 · 退款/售后', tone: '强调协商记录和凭证，必要时申请平台介入。' },
    pdd: { name: '拼多多', hint: '拼多多 · 售后/官方客服', tone: '表达要更直接，突出商品问题和退款诉求。' },
    douyin: { name: '抖音', hint: '抖音 · 订单售后', tone: '补充视频或开箱证明，适合说明直播/短视频商品差异。' },
    xhs: { name: '小红书', hint: '小红书 · 订单售后', tone: '突出笔记/商品页描述与实物差异，保留页面截图。' }
  };
  var scenarios = {
    broken: {
      title: '运输破损，优先退货退款',
      score: 86,
      risk: '证据充分 · 建议先联系商家',
      summary: '当前材料足以支持首轮售后沟通。建议提交破损照片、外包装照片与订单信息，并要求商家确认退货运费承担方式。',
      needText: '商品破损，影响正常使用',
      checklist: ['商品破损照片 3 张', '外包装挤压照片', '订单截图与订单号', '物流面单或签收记录', '与商家沟通记录'],
      timeline: [['已完成', '识别问题类型并整理材料', '现在'], ['待处理', '向店铺客服发送退货退款诉求', '10 分钟内'], ['待处理', '若未回复，准备平台介入材料', '24 小时后']]
    },
    wrong: {
      title: '货不对版，先固定页面证据',
      score: 78,
      risk: '需要补充商品页截图',
      summary: '建议保存商品详情页、直播间承诺或笔记描述截图，再对比实物差异，优先申请退货退款或差价补偿。',
      needText: '实物与页面描述不一致',
      checklist: ['实物照片或视频', '商品详情页截图', '规格参数截图', '订单截图', '客服承诺记录'],
      timeline: [['已完成', '生成页面与实物对比清单', '现在'], ['待处理', '向商家说明差异并提出诉求', '10 分钟内'], ['待处理', '商家拒绝后提交平台介入', '24 小时后']]
    },
    missing: {
      title: '少件漏发，优先要求补发或退款',
      score: 82,
      risk: '建议补充开箱照片',
      summary: '少件问题需要说明应收件数、实收件数和缺失内容。若商品价值较小，可优先选择补发；若影响使用，可申请退款。',
      needText: '包裹内缺少配件或商品',
      checklist: ['开箱照片或视频', '商品清单截图', '实收物品合照', '订单截图', '物流重量记录'],
      timeline: [['已完成', '核对商品清单与缺失项', '现在'], ['待处理', '向商家提出补发或退款', '10 分钟内'], ['待处理', '超过承诺时间后升级平台', '48 小时后']]
    },
    delay: {
      title: '商家拖延，准备平台介入',
      score: 90,
      risk: '建议升级处理',
      summary: '已存在多轮沟通但商家未给明确处理时间，建议整理聊天时间线，并向平台客服提交介入申请。',
      needText: '商家长时间不处理售后',
      checklist: ['完整聊天记录', '首次申请售后时间', '商家承诺截图', '订单与物流信息', '当前退款/售后状态截图'],
      timeline: [['已完成', '整理商家拖延证据时间线', '现在'], ['待处理', '发送最后一次明确处理时限', '立即'], ['待处理', '到点未处理则申请平台介入', '今晚 20:00']]
    }
  };
  var scriptTitles = { merchant: '发送给店铺客服', platform: '发送给平台客服', evidence: '证据材料说明' };
  function $(id) { return document.getElementById(id); }
  function activeNode(selector, attr, value) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.classList.toggle('active', el.getAttribute(attr) === value);
    });
  }
  function selectedNeedText() {
    var map = { refund: '退货退款', exchange: '换货补发', compensation: '仅退款或补偿', intervention: '申请平台介入' };
    return map[$('need').value] || '退货退款';
  }
  function uploadedEvidenceItems() {
    return uploadedFiles.map(function (file) {
      var type = file.type.indexOf('image/') === 0 ? '已上传照片' : '已上传视频';
      return type + '：' + file.name;
    });
  }
  function evidenceList() {
    return scenarios[state.scenario].checklist.concat(uploadedEvidenceItems());
  }
  function renderUploads() {
    var preview = $('photoPreview');
    var helper = $('uploadHelper');
    var chips = $('fileChips');
    if (!preview || !helper || !chips) return;
    if (!uploadedFiles.length) {
      preview.innerHTML = '<div class="photo-empty">还没有上传文件，先用下方预置材料生成方案。</div>';
      helper.textContent = '已预置常见材料，也可以上传真实凭证增强 Demo 可信度。';
    } else {
      preview.innerHTML = uploadedFiles.map(function (file) {
        if (file.type.indexOf('image/') === 0) {
          return '<div class="photo-thumb"><img src="' + URL.createObjectURL(file) + '" alt="' + file.name + '"><small>' + file.name + '</small></div>';
        }
        return '<div class="photo-thumb">视频凭证<small>' + file.name + '</small></div>';
      }).join('');
      helper.textContent = '已上传 ' + uploadedFiles.length + ' 个凭证文件，AI 已同步纳入材料包和话术。';
    }
    var base = ['商品照片 3 张', '外包装照片', '订单截图', '客服聊天记录'];
    var uploaded = uploadedFiles.map(function (file) { return file.name; });
    chips.innerHTML = base.concat(uploaded).map(function (name) {
      return '<span class="file-chip">' + name + '</span>';
    }).join('');
  }
  function scriptText(type) {
    var p = platforms[state.platform];
    var s = scenarios[state.scenario];
    var order = $('orderName').value.trim() || '当前订单';
    var desc = $('description').value.trim();
    var evidence = evidenceList();
    if (type === 'merchant') {
      return '你好，我的订单【' + order + '】遇到“' + s.needText + '”问题，诉求是【' + selectedNeedText() + '】。\n\n目前我已准备：' + evidence.slice(0, 6).join('、') + '。问题描述：' + desc + '\n\n请协助尽快处理，并明确是否需要退回商品、退货地址、运费承担方式和预计处理时间。';
    }
    if (type === 'platform') {
      return '平台客服你好，我在【' + p.name + '】的订单【' + order + '】售后处理不顺利，问题为“' + s.needText + '”。\n\n我已与商家沟通并准备好相关证据：' + evidence.join('、') + '。希望平台协助判断责任并推进【' + selectedNeedText() + '】。' + p.tone;
    }
    return '证据说明：\n1. 商品/订单：' + order + '\n2. 问题类型：' + s.needText + '\n3. 用户诉求：' + selectedNeedText() + '\n4. 核心材料：' + evidence.join('；') + '\n5. 补充说明：' + desc;
  }
  function render() {
    var p = platforms[state.platform];
    var s = scenarios[state.scenario];
    $('platformHint').textContent = p.hint;
    $('riskLabel').textContent = s.risk;
    $('score').textContent = s.score;
    $('summaryTitle').textContent = s.title;
    $('summaryText').textContent = s.summary + ' ' + p.tone;
    $('scriptTitle').textContent = scriptTitles[state.script];
    $('scriptText').textContent = scriptText(state.script);
    $('checklist').innerHTML = evidenceList().map(function (item) {
      return '<div class="check-item"><span>' + item + '</span><small>已准备</small></div>';
    }).join('');
    $('timeline').innerHTML = s.timeline.map(function (item, index) {
      var cls = index === 0 ? 'time-step' : 'time-step pending';
      return '<div class="' + cls + '"><i class="time-dot"></i><div><strong>' + item[1] + '</strong><span>' + item[0] + '</span></div><em>' + item[2] + '</em></div>';
    }).join('');
    activeNode('.platform-btn', 'data-platform', state.platform);
    activeNode('.scenario', 'data-case', state.scenario);
    activeNode('.tab', 'data-script', state.script);
  }
  document.querySelectorAll('.platform-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { state.platform = btn.getAttribute('data-platform'); render(); });
  });
  document.querySelectorAll('.scenario').forEach(function (btn) {
    btn.addEventListener('click', function () { state.scenario = btn.getAttribute('data-case'); render(); });
  });
  document.querySelectorAll('.tab').forEach(function (btn) {
    btn.addEventListener('click', function () { state.script = btn.getAttribute('data-script'); render(); });
  });
  ['need', 'orderName', 'description'].forEach(function (id) {
    $(id).addEventListener('input', render);
    $(id).addEventListener('change', render);
  });
  $('generateBtn').addEventListener('click', render);
  $('photoInput').addEventListener('change', function (event) {
    uploadedFiles = Array.prototype.slice.call(event.target.files || []);
    renderUploads();
    render();
  });
  $('copyBtn').addEventListener('click', function () {
    navigator.clipboard && navigator.clipboard.writeText($('scriptText').textContent);
    $('copyBtn').textContent = '已复制';
    setTimeout(function () { $('copyBtn').textContent = '复制话术'; }, 1200);
  });
  renderUploads();
  render();
})();
