/* ===================================================
   银发助手 · 产品原型交互逻辑
   =================================================== */

// ---------- 教程数据 ----------
// illu 现在是一个示意图对象：
//   scene: 屏幕场景（desktop/home/chat/plus-menu/pay/settings/album/ taxi/hospital）
//   focus: 高亮位置（top-right/bottom-left/bottom-right/center/ bottom-center/left-column/…）
//   focusText: 高亮圈内的按钮文字
//   tag: 顶部小标签说明这是什么界面
const tutorials = {
  'wechat-video': {
    title: '微信视频通话',
    steps: [
      {
        illu: { scene: 'home', focus: 'bottom-left-row', focusText: '通讯录', tag: '微信首页' },
        title: '打开微信，找到联系人',
        desc: '点击手机桌面上的"微信"图标打开应用。在微信首页，点击底部的"通讯录"按钮，找到您要视频通话的亲人朋友。'
      },
      {
        illu: { scene: 'chat-plus', focus: 'bottom-right', focusText: '＋', tag: '聊天窗口' },
        title: '点击"+"号，选择"视频通话"',
        desc: '进入聊天窗口后，点击右下角的"+"按钮。在弹出的菜单中，选择"视频通话"。微信会立即开始呼叫对方。'
      },
      {
        illu: { scene: 'video-call', focus: 'center', focusText: '对方头像', tag: '视频通话中' },
        title: '等待对方接听，开始聊天',
        desc: '对方接听后，您就能看到TA了。屏幕下方有"挂断"和"静音"按钮。想挂断时，按红色按钮即可。'
      }
    ]
  },
  'font-size': {
    title: '调整字体大小',
    steps: [
      {
        illu: { scene: 'desktop', focus: 'center-grid', focusText: '设置', tag: '手机桌面' },
        title: '打开手机"设置"',
        desc: '找到手机桌面上的"设置"图标（通常是齿轮样式），点击打开。向上滑动屏幕，找到"显示"或"显示与亮度"选项。'
      },
      {
        illu: { scene: 'settings-font', focus: 'center-slider', focusText: '字体大小', tag: '显示设置' },
        title: '找到"字体大小"',
        desc: '在"显示"页面中，点击"字体大小"选项。屏幕上会出现一个滑动条，您可以左右拖动来预览不同大小的效果。'
      }
    ]
  },
  'pay': {
    title: '微信付款',
    steps: [
      {
        illu: { scene: 'home', focus: 'top-right-plus', focusText: '＋', tag: '微信首页' },
        title: '打开微信"收付款"',
        desc: '在微信首页，点击右上角的"+"号。在弹出的菜单中选择"收付款"。系统会提示您打开付款码。'
      },
      {
        illu: { scene: 'pay-code', focus: 'center', focusText: '付款码', tag: '收付款' },
        title: '出示付款码给商家扫码',
        desc: '把屏幕上的条形码和二维码对准商家的扫码枪。商家扫码后，会直接从您的零钱或绑定的银行卡扣款。'
      },
      {
        illu: { scene: 'pay-success', focus: 'center', focusText: '支付成功', tag: '结果确认' },
        title: '确认支付金额',
        desc: '支付完成后，微信会显示"支付成功"页面。请确认金额是否正确。如无问题，点击"完成"即可。'
      },
      {
        illu: { scene: 'warn-red', focus: 'center', focusText: '⚠️ 勿泄露', tag: '安全提醒' },
        title: '小提示：保护好付款码',
        desc: '付款码不要随意拍照发给他人。遇到陌生电话索要付款码的，一律挂断并拨打110报警。'
      }
    ]
  },
  'photo': {
    title: '发送照片给家人',
    steps: [
      {
        illu: { scene: 'chat-plus', focus: 'bottom-right', focusText: '＋', tag: '聊天窗口' },
        title: '打开聊天窗口，点击"+"',
        desc: '进入与家人的聊天窗口。点击右下角的"+"号，在弹出的菜单中选择"图片"。'
      },
      {
        illu: { scene: 'album', focus: 'top-left-photo', focusText: '✓', tag: '相册选择' },
        title: '勾选要发送的照片',
        desc: '在相册中勾选您想要发送的照片（可多选）。确认无误后，点击右下角的"发送"按钮。'
      },
      {
        illu: { scene: 'chat-sent', focus: 'right-bubble', focusText: '图片消息', tag: '发送完成' },
        title: '照片发送完成',
        desc: '照片会立即发送给对方。对方打开微信就能看到您发来的照片啦！'
      }
    ]
  },
  'taxi': {
    title: '网上打车',
    steps: [
      {
        illu: { scene: 'wechat-search', focus: 'top-search', focusText: '搜索', tag: '微信搜索' },
        title: '打开打车小程序',
        desc: '在微信首页搜索"滴滴出行"或"高德打车"，进入相应小程序。首次使用需要授权获取位置信息。'
      },
      {
        illu: { scene: 'taxi-input', focus: 'top-input', focusText: '您要去哪儿', tag: '打车小程序' },
        title: '输入目的地',
        desc: '在"您要去哪儿"输入框中输入目的地名称，系统会自动匹配附近地点。选择正确的目的地即可。'
      },
      {
        illu: { scene: 'taxi-call', focus: 'bottom-button', focusText: '呼叫车辆', tag: '选择车型' },
        title: '呼叫车辆，等待接驾',
        desc: '选择车型（经济型/舒适型），点击"呼叫"。司机接单后，屏幕会显示车牌和预计到达时间。'
      }
    ]
  },
  'fraud-sms': {
    title: '识别诈骗短信',
    steps: [
      {
        illu: { scene: 'wechat-search', focus: 'top-search', focusText: '短信', tag: '手机短信' },
        title: '收到可疑短信先别慌',
        desc: '看到"中奖""积分兑换""账户异常"等短信，不要激动，更不要点击里面的任何链接。先停下来想一想。'
      },
      {
        illu: { scene: 'warn-red', focus: 'center', focusText: '⚠️ 不要点', tag: '安全提醒' },
        title: '三不原则：不点、不回、不信',
        desc: '不点击短信里的链接，不回复短信，不相信短信内容。正规机构不会通过短信让您点击链接操作。'
      },
      {
        illu: { scene: 'warn-red', focus: 'center', focusText: '📞 110', tag: '求助渠道' },
        title: '拿不准就问家人或报警',
        desc: '如果拿不准短信是真是假，先问问家里的年轻人。也可以拨打110报警电话咨询，警察会帮您判断。'
      }
    ]
  },
  'hospital': {
    title: '网上挂号',
    steps: [
      {
        illu: { scene: 'wechat-search', focus: 'top-search', focusText: '搜索医院', tag: '微信搜索' },
        title: '搜索医院',
        desc: '在微信中搜索您要去的医院官方小程序，或使用"京医通""健康160"等挂号服务平台。'
      },
      {
        illu: { scene: 'hospital-dept', focus: 'left-column', focusText: '眼科', tag: '选择科室' },
        title: '选择科室和医生',
        desc: '进入"预约挂号"，选择您要就诊的科室（如内科、眼科），再选择具体医生和就诊时间。'
      },
      {
        illu: { scene: 'hospital-pay', focus: 'bottom-button', focusText: '支付挂号费', tag: '确认预约' },
        title: '完成支付，按时就诊',
        desc: '确认挂号信息并支付费用。就诊当日提前15分钟到达医院取号即可。'
      }
    ]
  }
};

// ---------- 前置条件数据 ----------
// required: 必须满足，不满足则无法使用
// recommended: 建议完成，可显著提升安全性或体验
// howTo: "如何完成"的详细步骤（点击展开）
const prerequisites = {
  'pay': {
    required: [
      {
        icon: '🪪',
        title: '完成微信实名认证',
        desc: '未实名则无法使用收付款功能。',
        howTo: [
          '① 打开微信 → 点击底部"我"',
          '② 点击"服务"（旧版叫"支付"）',
          '③ 点击右上角"钱包"',
          '④ 点击"身份信息" → 上传身份证正反面照片',
          '⑤ 按提示完成人脸识别即可'
        ]
      },
      {
        icon: '💳',
        title: '绑定一张本人银行卡',
        desc: '需绑定储蓄卡或信用卡以完成支付。',
        howTo: [
          '① 打开微信 → "我" → "服务" → "钱包"',
          '② 点击"银行卡" → "添加银行卡"',
          '③ 输入持卡人姓名（必须与实名一致）',
          '④ 输入银行卡号（可拍照自动识别）',
          '⑤ 输入银行预留手机号，接收短信验证码即可绑定'
        ]
      }
    ],
    recommended: [
      {
        icon: '🔐',
        title: '设置6位数支付密码',
        desc: '保护支付安全，首次支付前系统会强制要求。',
        howTo: [
          '① 在"钱包"中点击"支付设置"',
          '② 选择"修改支付密码"或"设置支付密码"',
          '③ 输入一个6位数字（不要用生日、手机号）',
          '④ 建议写在随身卡片上，以防忘记锁号'
        ]
      },
      {
        icon: '📱',
        title: '确保手机可正常收短信',
        desc: '大额支付会触发短信验证，需接收验证码。',
        howTo: [
          '① 打开手机短信App，确认信号正常',
          '② 发送一条测试短信到家人号码，验证可收发',
          '③ 如长期未收到短信，联系运营商客服（10086/10010）'
        ]
      }
    ],
    warning: '⚠️ 注意：付款码仅限本人使用，切勿拍照发给陌生人！遇到自称"客服/公安"要求您报付款码或验证码的，一律挂断并拨打 110。'
  },
  'taxi': {
    required: [
      {
        icon: '📍',
        title: '允许微信获取您的位置',
        desc: '打车必须知道您在哪里才能派单。',
        howTo: [
          '① 打开手机"设置" → "隐私与安全"',
          '② 点击"定位服务"或"位置信息"',
          '③ 找到"微信"，选择"使用App时允许"',
          '④ 也可在首次使用打车小程序时，弹窗选"允许"'
        ]
      },
      {
        icon: '💳',
        title: '微信支付可正常扣款',
        desc: '行程结束后需在线支付车费。',
        howTo: [
          '① 打开微信 → "我" → "服务" → "钱包"',
          '② 查看"零钱"是否有足够余额',
          '③ 确认已至少绑定1张银行卡（储蓄卡优先）',
          '④ 如需从银行卡扣款，请确保卡内余额充足'
        ]
      }
    ],
    recommended: [
      {
        icon: '📞',
        title: '在打车小程序中设置紧急联系人',
        desc: '发生意外时，平台可自动通知家人。',
        howTo: [
          '① 打开"滴滴出行"或"高德打车"小程序',
          '② 点击左上角头像 → "安全中心"',
          '③ 选择"紧急联系人"',
          '④ 添加1-2位家人手机号（建议子女）'
        ]
      },
      {
        icon: '🔔',
        title: '开启"行程自动分享"',
        desc: '上车后行程信息自动同步给家人，更安心。',
        howTo: [
          '① 在打车小程序的"设置"中找到"行程分享"',
          '② 选择"自动分享给紧急联系人"',
          '③ 设置分享时段（建议：全天）',
          '④ 上车后家人会收到含车牌号的短信'
        ]
      }
    ],
    warning: '🚗 上车前请核对：① 车牌颜色（绿/蓝/黄）是否一致 ② 车牌号后3位是否一致 ③ 司机相貌与平台照片相符。有任何疑问请先别上车，拨打平台客服电话。'
  },
  'hospital': {
    required: [
      {
        icon: '📇',
        title: '准备好医保卡（或医保电子凭证）',
        desc: '医保用户挂号、缴费必须出示。',
        howTo: [
          '① 打开微信 → 搜索"国家医保服务平台"小程序',
          '② 首次使用需实名认证 + 人脸识别',
          '③ 打开后会显示"医保电子凭证"（二维码）',
          '④ 医院窗口或自助机扫码即可使用'
        ]
      },
      {
        icon: '👤',
        title: '在目标医院完成就诊人登记',
        desc: '每家医院需首次登记患者信息。',
        howTo: [
          '① 搜索医院官方小程序（例如"XX医院"）',
          '② 点击"添加就诊人"',
          '③ 输入姓名、身份证号、手机号',
          '④ 首次需本人人脸识别确认后即可挂号'
        ]
      }
    ],
    recommended: [
      {
        icon: '💳',
        title: '确认挂号费支付方式',
        desc: '不同医院支持不同方式，提前了解可省时间。',
        howTo: [
          '① 在医院小程序或官网查看"支付方式"',
          '② 常见支持：微信支付、支付宝、医保卡、现金',
          '③ 建议微信支付绑定医保卡，可一站式扣除',
          '④ 备少量现金，应对机器故障场景'
        ]
      },
      {
        icon: '🧾',
        title: '准备好既往病历和检查报告',
        desc: '带上过去的病历、化验单、影像片（CT/核磁）。',
        howTo: [
          '① 整理所有纸质病历，按时间排序',
          '② 把CT/MRI/彩超胶片装入塑料袋，避免折损',
          '③ 把目前正在服用的药品名称（或药盒）记下',
          '④ 如曾做过手术，最好写下手术名称和日期'
        ]
      }
    ],
    warning: '🏥 提示：首次去陌生医院，建议由家人陪同。如独自一人，提前在导航App中搜索路线，注意医院分院区（东院/西院等），避免走错。'
  },
  'wechat-video': {
    required: [
      {
        icon: '✅',
        title: '确认对方已加为微信好友',
        desc: '视频通话仅支持微信好友间使用。',
        howTo: [
          '① 打开微信首页，看联系人列表中是否有对方',
          '② 如没有，点击右上角"+" → "添加朋友"',
          '③ 输入对方手机号或微信号搜索',
          '④ 发送好友请求，等对方通过后即可视频'
        ]
      }
    ],
    recommended: [
      {
        icon: '📶',
        title: '在WiFi或良好4G/5G环境',
        desc: '视频耗流量，WiFi更稳更省。',
        howTo: [
          '① 手机下拉状态栏，看WiFi图标是否显示',
          '② 打开任意网页测试是否能正常访问',
          '③ 无WiFi时确保手机信号≥2格（信号弱会卡顿）',
          '④ 如在境外，请先开通国际漫游或连接WiFi'
        ]
      },
      {
        icon: '🔊',
        title: '检查手机音量已开启',
        desc: '确保能听清对方声音。',
        howTo: [
          '① 按手机左侧"+"音量键3-5次',
          '② 屏幕出现音量条，调至中间偏上',
          '③ 不要按到"静音"键（会出现斜杠铃铛图标）',
          '④ 通话时可再按侧边键实时调节'
        ]
      }
    ],
    warning: null
  },
  'font-size': {
    required: [
      {
        icon: '🔓',
        title: '记得手机解锁密码或指纹',
        desc: '调整设置前必须解锁屏幕。',
        howTo: [
          '① 按一下手机侧边电源键点亮屏幕',
          '② 输入解锁密码或把手指放在指纹识别区',
          '③ 如忘记密码，需要联系手机品牌客服重置',
          '④ 建议把密码写在纸上，并放在固定位置'
        ]
      }
    ],
    recommended: [
      {
        icon: '👓',
        title: '在光线充足处操作',
        desc: '屏幕太小字看不清，明亮环境可减少眼睛疲劳。',
        howTo: [
          '① 选择靠窗位置，避免强光直射屏幕',
          '② 戴上常用老花镜',
          '③ 调整手机角度，屏幕略低于视线',
          '④ 操作10分钟后远眺休息30秒'
        ]
      }
    ],
    warning: null
  },
  'photo': {
    required: [
      {
        icon: '📸',
        title: '允许微信访问您的照片相册',
        desc: '否则无法选择图片发送。',
        howTo: [
          '① 打开手机"设置"',
          '② 找到"微信"或"照片/相册/隐私"',
          '③ 将权限设为"允许访问所有照片"或"添加照片时允许"',
          '④ 设置完重启微信即可生效'
        ]
      }
    ],
    recommended: [
      {
        icon: '💾',
        title: '确保手机有足够存储空间',
        desc: '发送前照片会被压缩，仍需少量可用空间。',
        howTo: [
          '① 打开手机"设置" → "存储"或"存储空间"',
          '② 查看"可用空间"，建议至少保留 1GB',
          '③ 如空间不足，可删除旧照片、视频或不常用App',
          '④ 也可把照片同步到"微信收藏"或云端释放空间'
        ]
      }
    ],
    warning: null
  }
};

// ---------- 问题匹配 ----------
function matchTutorial(question) {
  const q = question.toLowerCase();
  if (q.includes('视频') || q.includes('打视频') || q.includes('通话')) return 'wechat-video';
  if (q.includes('字体') || q.includes('调大') || q.includes('字大') || q.includes('太小')) return 'font-size';
  if (q.includes('付款') || q.includes('付钱') || q.includes('买东西') || q.includes('扫码')) return 'pay';
  if (q.includes('照片') || q.includes('发图') || q.includes('图片') || q.includes('孙子')) return 'photo';
  if (q.includes('打车') || q.includes('滴滴') || q.includes('出租车')) return 'taxi';
  if (q.includes('挂号') || q.includes('看病') || q.includes('医院')) return 'hospital';
  if (q.includes('短信') || q.includes('中奖') || q.includes('陌生')) return 'fraud-sms';
  return null;
}

// ---------- 意图识别（更强，区分跳转/教程/设置）----------
function matchIntent(text) {
  const q = text.toLowerCase();

  // 跳转页面类
  if (q.includes('社区') || q.includes('搭子') || q.includes('朋友') || q.includes('找人') ||
      q.includes('聊天') || q.includes('分享生活') || q.includes('广场舞')) {
    return { type: 'page', target: 'community', ico: '👥', desc: '老年社区' };
  }
  if (q.includes('技巧') || q.includes('广场') || q.includes('热门') || q.includes('学习') ||
      q.includes('教程')) {
    return { type: 'page', target: 'plaza', ico: '🎡', desc: '技巧' };
  }
  if (q.includes('防骗') || q.includes('诈骗') || q.includes('骗子') || q.includes('养老钱') ||
      q.includes('公安') || q.includes('诈骗电话')) {
    return { type: 'page', target: 'plaza-fraud', ico: '🛡️', desc: '防骗提醒（在技巧里）' };
  }
  if (q.includes('首页') || q.includes('主页') || q.includes('回到家') || q.includes('回首页')) {
    return { type: 'page', target: 'home', ico: '🏠', desc: '首页' };
  }
  if (q.includes('我的') || q.includes('个人') || q.includes('设置') || q.includes('账户')) {
    return { type: 'page', target: 'me', ico: '👤', desc: '我的页面' };
  }

  // 具体教程类
  if (q.includes('中奖') || q.includes('陌生短信') || q.includes('诈骗短信')) {
    return { type: 'tip', target: 'fraud-sms', ico: '🛡️', desc: '识别诈骗短信教程' };
  }
  if (q.includes('视频') || q.includes('打视频') || q.includes('通话')) {
    return { type: 'tip', target: 'wechat-video', ico: '📹', desc: '微信视频通话教程' };
  }
  if (q.includes('字体') || q.includes('调大') || q.includes('字大') || q.includes('放大字')) {
    return { type: 'tip', target: 'font-size', ico: '🔍', desc: '调整字体大小教程' };
  }
  if (q.includes('付款') || q.includes('付钱') || q.includes('买东西') || q.includes('扫码支付')) {
    return { type: 'tip', target: 'pay', ico: '💰', desc: '微信付款教程' };
  }
  if (q.includes('照片') || q.includes('发图') || q.includes('发照片') || q.includes('发图片')) {
    return { type: 'tip', target: 'photo', ico: '🖼️', desc: '发送照片教程' };
  }
  if (q.includes('打车') || q.includes('滴滴') || q.includes('出租车')) {
    return { type: 'tip', target: 'taxi', ico: '🚖', desc: '网上打车教程' };
  }
  if (q.includes('挂号') || q.includes('看病') || q.includes('医院')) {
    return { type: 'tip', target: 'hospital', ico: '🏥', desc: '网上挂号教程' };
  }

  // 设置类
  if (q.includes('大字体') || q.includes('大字') || q.includes('特大')) {
    return { type: 'setting', target: 'large-font', ico: '🔤', desc: '切换大字体模式' };
  }

  return null;
}

// ---------- 语音确认弹窗 ----------
let pendingIntent = null;

function showConfirmModal(voiceText, intent) {
  pendingIntent = intent;
  document.getElementById('confirm-voice').textContent = '"' + voiceText + '"';
  document.getElementById('confirm-question').textContent =
    '您是想进入「' + intent.desc + '」吗？';
  document.getElementById('confirm-modal').classList.add('show');
}

function hideConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('show');
  pendingIntent = null;
}

function executeIntent() {
  if (!pendingIntent) return;
  const intent = pendingIntent;
  hideConfirmModal();

  if (intent.type === 'page') {
    if (intent.target === 'plaza-fraud') {
      // 特殊：跳转到广场并提示防骗
      switchPage('plaza');
      setTimeout(() => {
        showToast('🛡️ 已为您跳转到技巧，可查看"防骗知识"分类');
      }, 300);
    } else {
      switchPage(intent.target);
    }
  } else if (intent.type === 'tip') {
    loadTutorial(intent.target);
    switchPage('tutorial');
  } else if (intent.type === 'setting') {
    if (intent.target === 'large-font') {
      document.body.classList.add('large-font');
      showToast('✅ 已切换为大字体模式');
    }
  }
}

// ---------- 真实语音识别（Web Speech API，免费） ----------
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
let voiceRecognition = null;
let voiceRecogSupported = !!SpeechRecognitionAPI;
let voiceRecogResult = '';
let voiceRecogCallback = null;

function initVoiceRecognition() {
  if (!voiceRecogSupported) return;
  voiceRecognition = new SpeechRecognitionAPI();
  voiceRecognition.lang = 'zh-CN';
  voiceRecognition.continuous = false;
  voiceRecognition.interimResults = false;
  voiceRecognition.maxAlternatives = 1;

  voiceRecognition.onresult = function(event) {
    voiceRecogResult = event.results[0][0].transcript;
  };

  voiceRecognition.onerror = function(event) {
    console.warn('语音识别错误:', event.error);
    voiceRecogResult = '';
  };

  voiceRecognition.onend = function() {
    if (voiceRecogCallback) {
      const cb = voiceRecogCallback;
      voiceRecogCallback = null;
      cb(voiceRecogResult);
      voiceRecogResult = '';
    }
  };
}

function startRecognition(onEndCallback) {
  if (!voiceRecogSupported || !voiceRecognition) {
    onEndCallback('');
    return false;
  }
  voiceRecogResult = '';
  voiceRecogCallback = onEndCallback;
  try {
    voiceRecognition.start();
    return true;
  } catch (e) {
    console.warn('语音识别启动失败:', e);
    voiceRecogCallback = null;
    onEndCallback('');
    return false;
  }
}

function stopRecognition() {
  if (!voiceRecogSupported || !voiceRecognition) return;
  try { voiceRecognition.stop(); } catch (e) {}
}

// ---------- 语音导航：真实识别 + 确认 ----------
function startVoiceNav() {
  const btn = document.getElementById('voice-nav-btn');
  btn.classList.add('active');
  if (navigator.vibrate) navigator.vibrate(30);
  startRecognition(function() {});
}

function endVoiceNav() {
  const btn = document.getElementById('voice-nav-btn');
  if (!btn.classList.contains('active')) return;
  btn.classList.remove('active');

  stopRecognition();
  showToast('正在识别…');

  setTimeout(() => {
    let recogText = voiceRecogResult;
    voiceRecogResult = '';

    // 浏览器不支持或没识别到，降级为随机演示
    if (!recogText) {
      const demos = ['去老年社区', '看看防骗提醒', '调大字体', '微信视频怎么打', '打开技巧', '微信付款教程'];
      recogText = demos[Math.floor(Math.random() * demos.length)];
    }

    const intent = matchIntent(recogText);
    if (intent) {
      switchPage('ask');
      showConfirmModal(recogText, intent);
    } else {
      // 没匹配到意图，但识别到了文字，直接当问题问AI
      switchPage('ask');
      simulateAsk(recogText);
    }
  }, 500);
}

// ---------- 直接点击提示芯片 ----------
function triggerIntentByChip(key) {
  const map = {
    community: { text: '去老年社区', intent: matchIntent('去老年社区') },
    plaza: { text: '看看技巧', intent: matchIntent('看看技巧') },
    fraud: { text: '防骗提醒', intent: matchIntent('防骗提醒') },
    font: { text: '调大字体', intent: matchIntent('调大字体') },
    video: { text: '微信视频怎么打', intent: matchIntent('微信视频怎么打') },
  };
  const item = map[key];
  if (item && item.intent) {
    showConfirmModal(item.text, item.intent);
  }
}

// ---------- 状态 ----------
let currentTip = 'wechat-video';
let currentStep = 0;
let voiceHoldTimer = null;
let isSpeaking = false;

// ---------- 工具函数 ----------
function showToast(msg, duration = 1800) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), duration);
}

function switchPage(pageId) {
  // 页面切换
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  // 登录页隐藏底部Tab和侧边导航
  const bottomTab = document.querySelector('.bottom-tab');
  const sideNav = document.querySelector('.side-nav');
  const isLogin = pageId === 'login';
  if (bottomTab) bottomTab.style.display = isLogin ? 'none' : '';
  if (sideNav) sideNav.style.display = isLogin ? 'none' : '';

  // 左侧导航同步
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  // 底部Tab同步
  document.querySelectorAll('.tab-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  // 更新右侧信息
  updateInfoPanel(pageId);
}

function updateInfoPanel(pageId) {
  const info = {
    'home': { title: '首页 · 个性化推荐', body: '展示用户头像、4个快捷入口和热门技巧推荐，采用"主动发现+被动问答"双模设计。签到卡片让每日学习成为习惯。' },
    'daily-task': { title: '每日学习任务 · 学一学答一题', body: '每天推荐一个实用小知识（如防骗、微信操作、手机使用）。学习后答对一题即可完成当日签到，连续30天获得奖励。温和的游戏化激励，让学习变轻松。' },
    'ask': { title: '语音提问 · AI识别', body: '点击上方示例可快速模拟常见问题。实际产品中，用户按住中间大按钮说话，系统通过腾讯云ASR识别，由大模型匹配知识库。' },
    'tutorial': { title: '步骤教程 · 分步引导', body: '每步配一张示意图+大字号说明+语音播报。用户看完一步再操作，降低认知负担。遇到困难可一键呼叫子女。' },
    'plaza': { title: '技巧广场 · 内容沉淀', body: '用户学习过的技巧可以被收藏和分享。子女也可在这里创作适合长辈的内容，形成"数字反哺"闭环。防骗内容已作为分类融入广场，不再单独设入口。' },
    'community': { title: '银发社区 · 交友互助', body: '关注老年群体社交需求。可分享日常生活（动态广场）、找同龄朋友组队出游（找搭子）、参与兴趣活动（合唱团、广场舞等）。温暖、可信的社区氛围。' },
    'me': { title: '我的 · 个性化设置', body: '学习记录、收藏、字体大小设置等集中管理。可一键切换"大字体模式"，视力友好。' }
  };
  const data = info[pageId];
  if (data) {
    document.getElementById('info-title').textContent = data.title;
    document.getElementById('info-body').textContent = data.body;
  }
}

// ---------- 教程加载 ----------
function loadTutorial(tipKey) {
  const tip = tutorials[tipKey];
  if (!tip) return;
  currentTip = tipKey;
  currentStep = 0;
  renderStep();
  renderPreCheckBanner(tipKey);
  document.getElementById('tutorial-title').textContent = tip.title;
}

// 渲染教程页前置条件横幅
function renderPreCheckBanner(tipKey) {
  const pre = prerequisites[tipKey];
  const banner = document.getElementById('precheck-banner');
  const body = document.getElementById('precheck-banner-body');
  const toggleBtn = document.getElementById('precheck-toggle');
  const head = banner.querySelector('.precheck-banner-head');

  if (!pre || (!pre.required && !pre.recommended)) {
    banner.style.display = 'none';
    return;
  }
  banner.style.display = 'block';

  // 默认收起状态
  body.classList.remove('open');
  body.style.display = 'none';
  if (toggleBtn) toggleBtn.textContent = '展开 ▾';

  const totalReq = (pre.required || []).length;
  let html = '';

  // 必须完成
  if (pre.required && pre.required.length) {
    html += `<div class="banner-section"><div class="banner-section-title"><span class="dot" style="background:#D94A4A"></span>必须完成（${totalReq}项，否则无法正常使用）</div>`;
    pre.required.forEach((item, idx) => {
      html += buildBannerRow(item, 'req');
    });
    html += `</div>`;
  }

  // 建议完成
  if (pre.recommended && pre.recommended.length) {
    html += `<div class="banner-section"><div class="banner-section-title"><span class="dot" style="background:#3A7D6E"></span>建议完成（${pre.recommended.length}项，提升安全与体验）</div>`;
    pre.recommended.forEach((item, idx) => {
      html += buildBannerRow(item, 'rec');
    });
    html += `</div>`;
  }

  // 安全提醒
  if (pre.warning) {
    html += `<div class="banner-warning">${pre.warning}</div>`;
  }

  body.innerHTML = html;

  // 绑定展开/收起事件
  if (toggleBtn) {
    toggleBtn.onclick = function(e) {
      e.stopPropagation();
      const isOpen = body.classList.toggle('open');
      body.style.display = isOpen ? 'block' : 'none';
      toggleBtn.textContent = isOpen ? '收起 ▴' : '展开 ▾';
    };
  }

  // 点击整个头部也可以展开/收起
  if (head) {
    head.onclick = function() {
      const isOpen = body.classList.toggle('open');
      body.style.display = isOpen ? 'block' : 'none';
      if (toggleBtn) toggleBtn.textContent = isOpen ? '收起 ▴' : '展开 ▾';
    };
  }

  // 绑定每个条件的状态切换和步骤展开
  const rows = body.querySelectorAll('.banner-row');
  rows.forEach(row => {
    const stateBtn = row.querySelector('.banner-state');
    const howToggle = row.querySelector('.banner-howto-toggle');
    const howBody = row.querySelector('.banner-howto-body');

    if (stateBtn) {
      stateBtn.onclick = (e) => {
        e.stopPropagation();
        row.classList.toggle('done');
        const circle = stateBtn.querySelector('.state-circle');
        if (circle) circle.textContent = row.classList.contains('done') ? '✓' : '○';
        updateBannerProgress();
      };
    }
    if (howToggle && howBody) {
      howToggle.onclick = (e) => {
        e.stopPropagation();
        const isOpen = howBody.style.display === 'block';
        howBody.style.display = isOpen ? 'none' : 'block';
        howToggle.textContent = isOpen ? '▾ 如何完成：' + howToggle.dataset.title : '▴ 收起';
      };
    }
  });

  // 顶部进度
  updateBannerProgress();
}

function buildBannerRow(item, type) {
  let html = `
    <div class="banner-row" data-type="${type}">
      <button class="banner-state" type="button">
        <span class="state-circle">○</span>
      </button>
      <div class="banner-body">
        <div class="banner-head">
          <span class="banner-icon">${item.icon}</span>
          <div class="banner-text-wrap">
            <div class="banner-text-title">${item.title}</div>
            <div class="banner-text-desc">${item.desc}</div>
          </div>
        </div>
  `;
  if (item.howTo && item.howTo.length) {
    html += `<button class="banner-howto-toggle" type="button" data-title="${item.title}">▾ 如何完成：${item.title}</button>
             <div class="banner-howto-body" style="display:none">
               <div class="howto-label">按以下步骤操作：</div>`;
    item.howTo.forEach(step => {
      html += `<div class="howto-step">${step}</div>`;
    });
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

// 更新横幅顶部进度（按已完成的"必须条件"计算）
function updateBannerProgress() {
  const banner = document.getElementById('precheck-banner');
  if (!banner) return;
  const rows = banner.querySelectorAll('.banner-row[data-type="req"]');
  const total = rows.length;
  let done = 0;
  rows.forEach(r => { if (r.classList.contains('done')) done++; });
  const percent = total ? Math.round((done / total) * 100) : 0;

  // 更新横幅顶部的状态文字
  let statusEl = document.getElementById('banner-status');
  if (!statusEl) {
    // 首次创建
    statusEl = document.createElement('div');
    statusEl.id = 'banner-status';
    statusEl.className = 'banner-status';
    const head = banner.querySelector('.precheck-banner-head');
    if (head) head.insertBefore(statusEl, head.querySelector('.precheck-banner-toggle'));
  }
  if (total === 0) {
    statusEl.innerHTML = `<span class="banner-status-ok">✓ 无需额外条件</span>`;
  } else if (percent === 100) {
    statusEl.innerHTML = `<span class="banner-status-ok">✓ 已完成 ${done}/${total}，可开始教程</span>`;
  } else {
    statusEl.innerHTML = `<span class="banner-status-warn">⚠ 已完成 ${done}/${total}（请先确认）</span>`;
  }
}

// ---------- 手机示意图渲染 ----------
// 给一个步骤的 illu 对象，画出模拟手机界面 + 高亮圈
function renderIllu(illu) {
  if (!illu) return '';
  if (typeof illu === 'string') return illu; // 兼容旧的纯文字

  const { scene, focus, focusText, tag } = illu;
  const focusHTML = renderFocusRing(focus, focusText);
  const screenHTML = renderScreen(scene);

  return `
    <div class="illu-phone">
      <div class="illu-status">
        <span>9:41</span>
        <span class="illu-status-right">📶 🔋</span>
      </div>
      <div class="illu-tag">${tag || ''}</div>
      <div class="illu-screen illu-screen-${scene}">
        ${screenHTML}
        ${focusHTML}
      </div>
    </div>
  `;
}

// 高亮圆圈：根据 focus 位置放置
function renderFocusRing(focus, text) {
  const pos = FOCUS_POS[focus] || FOCUS_POS.center;
  return `
    <div class="illu-focus" style="${pos.style}">
      <div class="illu-focus-ring"></div>
      <div class="illu-focus-label">${text || ''}</div>
      <div class="illu-arrow">👆</div>
    </div>
  `;
}

// 高亮圈的预设位置（相对手机屏）
const FOCUS_POS = {
  'center':        { style: 'left:50%; top:50%; transform:translate(-50%,-50%);' },
  'top-right':     { style: 'right:14px; top:50px;' },
  'top-right-plus':{ style: 'right:18px; top:12px;' },
  'top-search':    { style: 'left:50%; top:18px; transform:translateX(-50%);' },
  'top-input':     { style: 'left:50%; top:58px; transform:translateX(-50%);' },
  'bottom-right':  { style: 'right:18px; bottom:18px;' },
  'bottom-left':   { style: 'left:18px; bottom:18px;' },
  'bottom-left-row':{ style: 'left:32%; bottom:12px; transform:translateX(-50%);' },
  'bottom-center': { style: 'left:50%; bottom:18px; transform:translateX(-50%);' },
  'bottom-button': { style: 'left:50%; bottom:28px; transform:translateX(-50%);' },
  'center-grid':   { style: 'left:30%; top:40%; transform:translate(-50%,-50%);' },
  'center-slider': { style: 'left:50%; top:55%; transform:translate(-50%,-50%);' },
  'top-left-photo':{ style: 'left:28px; top:28px;' },
  'left-column':   { style: 'left:18px; top:50%; transform:translateY(-50%);' },
  'right-bubble':  { style: 'right:14px; top:50%; transform:translateY(-50%);' },
};

// 各种场景的简化界面
function renderScreen(scene) {
  switch (scene) {
    case 'desktop':
      return `
        <div class="illu-desktop">
          ${['微信','相机','短信','设置','地图','音乐','相册','电话']
            .map((n,i)=>`<div class="illu-desk-icon ${n==='设置'?'is-target':''}">
              <div class="illu-desk-ico">${['💬','📷','✉️','⚙️','🗺️','🎵','🖼️','📞'][i]}</div>
              <div class="illu-desk-name">${n}</div>
            </div>`).join('')}
        </div>`;
    case 'home':
      return `
        <div class="illu-wx-home">
          <div class="illu-wx-top">
            <span>微信</span>
            <span class="illu-wx-plus">＋</span>
          </div>
          <div class="illu-wx-list">
            <div class="illu-wx-row"><div class="illu-wx-avatar">👩</div>
              <div><div class="illu-wx-name">女儿</div><div class="illu-wx-msg">妈妈，吃饭了吗？</div></div>
            </div>
            <div class="illu-wx-row"><div class="illu-wx-avatar">👨</div>
              <div><div class="illu-wx-name">儿子</div><div class="illu-wx-msg">周末回家</div></div>
            </div>
            <div class="illu-wx-row"><div class="illu-wx-avatar">👵</div>
              <div><div class="illu-wx-name">老姐妹群</div><div class="illu-wx-msg">[图片]</div></div>
            </div>
          </div>
          <div class="illu-wx-tab">
            <div>💬 微信</div><div>👥 通讯录</div><div>🔍 发现</div><div>👤 我的</div>
          </div>
        </div>`;
    case 'chat-plus':
      return `
        <div class="illu-chat">
          <div class="illu-chat-head">女儿 <span class="illu-dot">●●●</span></div>
          <div class="illu-bubble left">妈妈，视频一下？</div>
          <div class="illu-bubble right">好，等我一下</div>
          <div class="illu-chat-input">
            <input disabled placeholder="按住 说话" />
            <div class="illu-chat-plus">＋</div>
          </div>
        </div>`;
    case 'video-call':
      return `
        <div class="illu-video">
          <div class="illu-video-avatar">👩</div>
          <div class="illu-video-name">女儿</div>
          <div class="illu-video-status">正在呼叫…</div>
          <div class="illu-video-btns">
            <div class="illu-video-btn">🎤</div>
            <div class="illu-video-btn red">📞</div>
            <div class="illu-video-btn">🔊</div>
          </div>
        </div>`;
    case 'pay-code':
      return `
        <div class="illu-pay">
          <div class="illu-pay-title">向商家付款</div>
          <div class="illu-barcode">││││││ ││││││ ││││││</div>
          <div class="illu-qrcode">
            <div>■□■□■□■</div>
            <div>□■□■□■□</div>
            <div>■□■■□□■</div>
            <div>□■□■□■□</div>
            <div>■□■□■□■</div>
          </div>
          <div class="illu-pay-amt">付款方式：零钱</div>
        </div>`;
    case 'pay-success':
      return `
        <div class="illu-success">
          <div class="illu-success-check">✓</div>
          <div class="illu-success-amt">¥ 32.00</div>
          <div class="illu-success-text">支付成功</div>
          <div class="illu-success-done">完成</div>
        </div>`;
    case 'warn-red':
      return `
        <div class="illu-warn">
          <div class="illu-warn-ico">⚠️</div>
          <div class="illu-warn-title">安全提醒</div>
          <div class="illu-warn-line">请勿把付款码截图发给他人</div>
          <div class="illu-warn-line">遇到可疑电话请拨打 110</div>
        </div>`;
    case 'settings-font':
      return `
        <div class="illu-settings">
          <div class="illu-set-row">🔔  通知</div>
          <div class="illu-set-row">🔅  显示与亮度</div>
          <div class="illu-set-row target">
            <span>🔠  字体大小</span>
          </div>
          <div class="illu-set-row">🌙  深色模式</div>
          <div class="illu-set-row">
            <span>字体预览 — 标准</span>
            <div class="illu-slider">
              <span>小</span><div class="illu-slider-dot"></div><span>大</span>
            </div>
          </div>
        </div>`;
    case 'album':
      return `
        <div class="illu-album">
          <div class="illu-ph target">🌼<span class="check">✓</span></div>
          <div class="illu-ph">🏞️</div>
          <div class="illu-ph">🌺</div>
          <div class="illu-ph">🌊</div>
          <div class="illu-ph">🍜</div>
          <div class="illu-ph">🏛️</div>
          <div class="illu-ph">🌻</div>
          <div class="illu-ph">🐶</div>
          <div class="illu-ph">🌸</div>
          <div class="illu-ph">🗻</div>
          <div class="illu-ph">🎋</div>
          <div class="illu-ph">🐱</div>
        </div>`;
    case 'chat-sent':
      return `
        <div class="illu-chat">
          <div class="illu-chat-head">女儿</div>
          <div class="illu-bubble left">妈妈，好看吗？</div>
          <div class="illu-bubble-ph right">🌼</div>
          <div class="illu-bubble-ph right">🌸</div>
          <div class="illu-chat-input">
            <input disabled placeholder="按住 说话" />
          </div>
        </div>`;
    case 'wechat-search':
      return `
        <div class="illu-search">
          <div class="illu-search-top">
            <span>🔙</span>
            <div class="illu-search-box">🔍  搜索</div>
          </div>
          <div class="illu-search-row">🕓  滴滴出行</div>
          <div class="illu-search-row">🕓  某某医院</div>
          <div class="illu-search-row">🏷️  小程序：挂号</div>
          <div class="illu-search-row">🏷️  小程序：健康160</div>
        </div>`;
    case 'taxi-input':
      return `
        <div class="illu-taxi">
          <div class="illu-taxi-from">📍 我的位置 <span>（当前位置）</span></div>
          <div class="illu-taxi-to">📍 <span class="illu-taxi-input-hl">您要去哪儿？</span></div>
          <div class="illu-taxi-sugg">
            <div>🏨  人民广场</div>
            <div>🏥  中心医院</div>
            <div>🚉  火车站</div>
            <div>🏠  家</div>
          </div>
          <div class="illu-map">
            🚗 🚗 🚗
            <div class="illu-map-road"></div>
            🚕 🚕 🚕
          </div>
        </div>`;
    case 'taxi-call':
      return `
        <div class="illu-taxi">
          <div class="illu-taxi-from">📍 当前位置</div>
          <div class="illu-taxi-to">📍 中心医院</div>
          <div class="illu-taxi-cars">
            <div class="illu-taxi-car">🚕  经济型 <span class="illu-taxi-car-amt">¥ 18</span></div>
            <div class="illu-taxi-car selected">🚗  舒适型 <span class="illu-taxi-car-amt">¥ 25</span></div>
          </div>
          <div class="illu-taxi-call-btn">呼叫车辆</div>
        </div>`;
    case 'hospital-dept':
      return `
        <div class="illu-hospital">
          <div class="illu-hospital-top">某某医院 · 预约挂号</div>
          <div class="illu-hospital-body">
            <div class="illu-hospital-col">
              <div class="illu-dept">内科</div>
              <div class="illu-dept target">眼科</div>
              <div class="illu-dept">骨科</div>
              <div class="illu-dept">皮肤科</div>
            </div>
            <div class="illu-hospital-doc">
              <div class="illu-doc-row">
                <div class="illu-doc-head">👨‍⚕️ 王医生</div>
                <div class="illu-doc-info">主任 · 周一全天</div>
              </div>
              <div class="illu-doc-row">
                <div class="illu-doc-head">👩‍⚕️ 李医生</div>
                <div class="illu-doc-info">副主任 · 周二下午</div>
              </div>
            </div>
          </div>
        </div>`;
    case 'hospital-pay':
      return `
        <div class="illu-hospital">
          <div class="illu-hospital-top">确认挂号信息</div>
          <div class="illu-pay-detail">
            <div class="illu-pay-row">患者：王阿姨</div>
            <div class="illu-pay-row">科室：眼科</div>
            <div class="illu-pay-row">医生：王医生</div>
            <div class="illu-pay-row">时间：6月20日 上午</div>
            <div class="illu-pay-row total">费用：¥ 50.00</div>
          </div>
          <div class="illu-hospital-pay-btn">立即支付 · 50元</div>
        </div>`;
    default:
      return `<div class="illu-empty">示例操作图</div>`;
  }
}

function renderStep() {
  const tip = tutorials[currentTip];
  const step = tip.steps[currentStep];
  document.getElementById('step-illu').innerHTML = renderIllu(step.illu);
  document.getElementById('step-title').textContent = step.title;
  document.getElementById('step-desc').textContent = step.desc;
  document.getElementById('cur-step').textContent = currentStep + 1;
  document.getElementById('total-step').textContent = tip.steps.length;

  const percent = ((currentStep + 1) / tip.steps.length) * 100;
  document.getElementById('progress-fill').style.width = percent + '%';

  // 按钮状态
  document.getElementById('btn-prev').disabled = currentStep === 0;
  const nextBtn = document.getElementById('btn-next');
  if (currentStep === tip.steps.length - 1) {
    nextBtn.textContent = '✅ 已完成';
  } else {
    nextBtn.textContent = '下一步 ›';
  }
}

function showLoginGuide() {
  const modal = document.getElementById('login-guide-modal');
  if (modal) modal.classList.add('show');
}

function closeLoginGuide() {
  const modal = document.getElementById('login-guide-modal');
  if (modal) modal.classList.remove('show');
}

function goToLogin() {
  closeLoginGuide();
  switchPage('login');
}

// ---------- 登录态管理（模拟注册登录后自动接入AI） ----------
function isLoggedIn() {
  return localStorage.getItem('sl_user') === '1';
}

function getUserInfo() {
  return {
    name: localStorage.getItem('sl_user_name') || '李淑芬',
    phone: localStorage.getItem('sl_user_phone') || '135****2867',
    plan: localStorage.getItem('sl_user_plan') || '智能版'
  };
}

function initLoginState() {
  // 演示用：默认已登录，方便直接演示
  if (localStorage.getItem('sl_user') === null) {
    localStorage.setItem('sl_user', '1');
  }
  updateLoginUI();
}

function updateLoginUI() {
  const info = getUserInfo();
  const nameEl = document.getElementById('me-user-name');
  const phoneEl = document.getElementById('me-user-phone');
  if (nameEl) nameEl.textContent = info.name;
  if (phoneEl) phoneEl.textContent = info.phone;

  const aiStatus = document.getElementById('ai-sub-status');
  if (aiStatus) {
    aiStatus.textContent = isLoggedIn() ? info.plan + ' · 已开通' : '未开通';
  }
}

function doLogin() {
  const phoneInput = document.getElementById('login-phone');
  const codeInput = document.getElementById('login-code');
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const code = codeInput ? codeInput.value.trim() : '';

  if (!phone || phone.length < 6) {
    showToast('请输入正确的手机号');
    return;
  }
  if (!code) {
    showToast('请输入验证码');
    return;
  }

  showToast('登录成功，AI服务已自动开通～');
  localStorage.setItem('sl_user', '1');
  localStorage.setItem('sl_user_phone', phone);
  localStorage.setItem('sl_user_name', '李淑芬');
  localStorage.setItem('sl_user_plan', '智能版');

  setTimeout(() => {
    updateLoginUI();
    switchPage('home');
  }, 800);
}

function doLogout() {
  localStorage.removeItem('sl_user');
  showToast('已退出登录');
  setTimeout(() => {
    updateLoginUI();
    switchPage('login');
  }, 500);
}

function sendVerifyCode() {
  const phoneInput = document.getElementById('login-phone');
  const phone = phoneInput ? phoneInput.value.trim() : '';
  if (!phone || phone.length < 6) {
    showToast('请先输入手机号');
    return;
  }
  showToast('验证码已发送（演示版任意输入即可）');
  const codeBtn = document.getElementById('send-code-btn');
  if (codeBtn) {
    codeBtn.disabled = true;
    codeBtn.textContent = '60秒后重发';
    let n = 60;
    const timer = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(timer);
        codeBtn.disabled = false;
        codeBtn.textContent = '获取验证码';
      } else {
        codeBtn.textContent = n + '秒后重发';
      }
    }, 1000);
  }
}

// ---------- AI对话模块 ----------
const AI_CONFIG = {
  model: 'deepseek-chat',
  apiUrl: 'https://api.deepseek.com/chat/completions',
  systemPrompt: `你是"银发助手"的AI智能助手，专门为中老年人服务。请遵守以下规则：
1. 回答要通俗易懂，用词简单，避免专业术语
2. 语气要亲切、有耐心，像对家里长辈说话一样
3. 回答要条理清晰，分点说明，每步讲清楚
4. 字体相关、手机操作、生活技巧类问题要详细解答
5. 涉及健康、医疗、理财等重要事项，提醒咨询专业人士
6. 如果用户问的是微信视频、付款、发照片、打车、挂号等手机操作教程类问题，请在回答开头明确标注【教程类】，然后简要回答，最后引导用户查看分步教程
7. 每次回答控制在200字以内，不要太长`,
  maxTokens: 500,
  temperature: 0.7
};

let chatHistory = [];
let aiSpeakingEnabled = true;
let aiSpeechRate = 1;

function getApiKey() {
  const personalKey = localStorage.getItem('ai_api_key');
  if (personalKey && personalKey.trim()) return personalKey.trim();
  return null;
}

function saveApiKey() {
  const input = document.getElementById('ai-api-key');
  if (!input) return;
  const key = input.value.trim();
  if (key) {
    localStorage.setItem('ai_api_key', key);
    showToast('✅ API密钥已保存');
  } else {
    localStorage.removeItem('ai_api_key');
    showToast('已清除API密钥');
  }
}

function toggleAiSpeak() {
  const toggle = document.getElementById('ai-speak-toggle');
  if (toggle) {
    aiSpeakingEnabled = toggle.checked;
    localStorage.setItem('ai_speak_enabled', aiSpeakingEnabled ? '1' : '0');
    showToast(aiSpeakingEnabled ? '🔊 已开启朗读' : '🔇 已关闭朗读');
  }
}

function changeSpeed(delta) {
  const rates = [0.6, 0.8, 1, 1.2, 1.4];
  const labels = ['很慢', '慢', '正常', '快', '很快'];
  let idx = rates.indexOf(aiSpeechRate);
  idx = Math.max(0, Math.min(rates.length - 1, idx + delta));
  aiSpeechRate = rates[idx];
  localStorage.setItem('ai_speak_rate', aiSpeechRate.toString());
  const txt = document.getElementById('ai-speed-text');
  if (txt) txt.textContent = labels[idx];
}

function loadAiSettings() {
  const speakEnabled = localStorage.getItem('ai_speak_enabled');
  if (speakEnabled !== null) {
    aiSpeakingEnabled = speakEnabled === '1';
    const toggle = document.getElementById('ai-speak-toggle');
    if (toggle) toggle.checked = aiSpeakingEnabled;
  }
  const rate = localStorage.getItem('ai_speak_rate');
  if (rate) {
    aiSpeechRate = parseFloat(rate);
    const rates = [0.6, 0.8, 1, 1.2, 1.4];
    const labels = ['很慢', '慢', '正常', '快', '很快'];
    const idx = rates.indexOf(aiSpeechRate);
    const txt = document.getElementById('ai-speed-text');
    if (txt && idx >= 0) txt.textContent = labels[idx];
  }
  const keyInput = document.getElementById('ai-api-key');
  const savedKey = localStorage.getItem('ai_api_key');
  if (keyInput && savedKey) keyInput.value = savedKey;
}

async function callDeepSeekAI(message) {
  // 检查登录态：未登录时弹出登录引导
  if (!isLoggedIn()) {
    showLoginGuide();
    return {
      success: false,
      fallback: true,
      text: ''
    };
  }

  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      success: false,
      fallback: true,
      text: generateFallbackAnswer(message)
    };
  }

  try {
    const messages = [
      { role: 'system', content: AI_CONFIG.systemPrompt },
      ...chatHistory.slice(-6),
      { role: 'user', content: message }
    ];

    const response = await fetch(AI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: messages,
        max_tokens: AI_CONFIG.maxTokens,
        temperature: AI_CONFIG.temperature,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error('API请求失败: ' + response.status);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    chatHistory.push({ role: 'user', content: message });
    chatHistory.push({ role: 'assistant', content: reply });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    return { success: true, text: reply };
  } catch (err) {
    console.error('AI调用失败:', err);
    return {
      success: false,
      fallback: true,
      text: generateFallbackAnswer(message)
    };
  }
}

function generateFallbackAnswer(question) {
  const q = question.toLowerCase();
  const tutorialKey = matchTutorial(question);

  if (tutorialKey) {
    const t = tutorials[tutorialKey];
    return `【教程类】好的，我来教您"${t.title}"。\n\n简单来说，大致分几步：\n1. 先打开对应的应用\n2. 找到对应的功能入口\n3. 按照提示操作就可以了\n\n详细的图文教程，您可以点击下面的卡片一步步跟着学～`;
  }

  if (q.includes('你好') || q.includes('您好') || q.includes('在吗')) {
    return '您好呀！我是银发助手小银～ 有什么我能帮您的吗？您可以问我手机怎么用、生活小技巧、或者防骗知识都行！';
  }
  if (q.includes('谢谢') || q.includes('感谢')) {
    return '不客气！能帮到您我很高兴～ 以后有什么问题随时问我就行！';
  }
  if (q.includes('防骗') || q.includes('诈骗') || q.includes('骗子')) {
    return '【防骗提醒】\n\n爷爷奶奶要记住：\n1. 凡是让您转账、汇钱的，都是骗子！\n2. 凡是说您"涉嫌犯罪"的，都是诈骗！\n3. 凡是要验证码的，一律不给！\n4. 陌生链接不点击，陌生电话不轻信\n\n有疑问就找家人，或者打110问警察叔叔。';
  }

  return '这个问题我来想想... \n\n您的问题我已经记下来了。如果是手机操作的问题，您可以试试说"微信视频怎么打"、"怎么付款"这类具体的问题，我可以一步步教您。\n\n要是有急事，建议您问问家里的年轻人，或者打客服电话确认一下哦！';
}

function isTutorialQuestion(answer) {
  return answer.includes('【教程类】') || answer.includes('教程类');
}

function speakText(text) {
  if (!aiSpeakingEnabled) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = aiSpeechRate;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

// ---------- 对话交互 ----------
function addChatBubble(text, type = 'bot', withTip = null, isHtml = false) {
  const area = document.getElementById('chat-area');
  if (!area) return null;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + type;
  if (isHtml) {
    bubble.innerHTML = text;
  } else {
    bubble.textContent = text;
  }
  if (withTip) {
    const tipLink = document.createElement('span');
    tipLink.className = 'bubble-tip';
    tipLink.textContent = '👉 点我查看分步教程';
    tipLink.onclick = () => {
      loadTutorial(withTip);
      switchPage('tutorial');
    };
    bubble.appendChild(tipLink);
  }
  area.appendChild(bubble);
  area.scrollTop = area.scrollHeight;
  return bubble;
}

function addTypingBubble() {
  const html = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  return addChatBubble(html, 'bot', null, true);
}

async function simulateAsk(question) {
  addChatBubble(question, 'user');

  const typingBubble = addTypingBubble();

  const result = await callDeepSeekAI(question);

  if (typingBubble) {
    typingBubble.remove();
  }

  const answer = result.text;

  // 未登录时不显示回答内容
  if (!answer) {
    if (typingBubble) typingBubble.remove();
    return;
  }

  const cleanAnswer = answer.replace(/【教程类】/g, '').trim();

  const tutorialKey = matchTutorial(question);
  const isTutorial = isTutorialQuestion(answer) || tutorialKey;

  if (isTutorial && tutorialKey) {
    addChatBubbleWithTutorialButton(cleanAnswer, tutorialKey);
    setTimeout(() => addPreCheckCard(tutorialKey), 400);
  } else {
    addChatBubble(cleanAnswer, 'bot');
  }

  setAiStatus('speaking');
  speakText(cleanAnswer);
  setTimeout(() => { setAiStatus('idle'); }, cleanAnswer.length * 100 + 1000);

  updateAiStats();

  const voiceTxt = document.getElementById('voice-text');
  if (voiceTxt) voiceTxt.textContent = '按住 说话';
}

function addChatBubbleWithTutorialButton(text, tutorialKey) {
  const area = document.getElementById('chat-area');
  if (!area) return null;
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble bot';
  bubble.textContent = text;

  const tutorialBtn = document.createElement('button');
  tutorialBtn.className = 'tutorial-action-btn';
  tutorialBtn.innerHTML = '<span>📖</span><span>查看分步教程</span>';
  tutorialBtn.onclick = () => {
    loadTutorial(tutorialKey);
    switchPage('tutorial');
  };
  bubble.appendChild(tutorialBtn);

  area.appendChild(bubble);
  area.scrollTop = area.scrollHeight;
  return bubble;
}

// 生成"前置条件检测"卡片
function addPreCheckCard(key) {
  const pre = prerequisites[key];
  if (!pre) return;
  
  const area = document.getElementById('chat-area');
  if (!area) return;

  // 创建卡片容器
  const card = document.createElement('div');
  card.className = 'chat-bubble bot precheck-card';

  // 顶部标题
  card.innerHTML = `
    <div class="precheck-head">
      <span class="precheck-ico">📋</span>
      <div class="precheck-title">在开始之前，请先确认这些条件</div>
    </div>
  `;

  // 添加必须完成项
  if (pre.required && pre.required.length) {
    const reqSection = document.createElement('div');
    reqSection.className = 'precheck-section';
    reqSection.innerHTML = '<div class="precheck-section-title"><span class="dot red"></span>必须完成（否则无法使用）</div>';
    
    pre.required.forEach(item => {
      const row = document.createElement('div');
      row.className = 'precheck-row';
      row.innerHTML = `
        <button class="precheck-state" onclick="togglePreCheck(this)">
          <span class="state-circle">○</span>
        </button>
        <div class="precheck-content">
          <span class="precheck-icon">${item.icon}</span>
          <div>
            <div class="precheck-title-item">${item.title}</div>
            <div class="precheck-desc">${item.desc}</div>
          </div>
        </div>
        ${item.howTo ? `
          <button class="howto-toggle" onclick="toggleHowTo(this)">
            ▾ 如何完成这一步
          </button>
          <div class="howto-body" style="display:none">
            <div class="howto-label">操作步骤：</div>
            ${item.howTo.map(step => `<div class="howto-step">${step}</div>`).join('')}
          </div>
        ` : ''}
      `;
      reqSection.appendChild(row);
    });
    card.appendChild(reqSection);
  }

  // 添加建议完成项
  if (pre.recommended && pre.recommended.length) {
    const recSection = document.createElement('div');
    recSection.className = 'precheck-section recommended';
    recSection.innerHTML = '<div class="precheck-section-title"><span class="dot green"></span>建议完成（提升安全与体验）</div>';
    
    pre.recommended.forEach(item => {
      const row = document.createElement('div');
      row.className = 'precheck-row';
      row.innerHTML = `
        <button class="precheck-state" onclick="togglePreCheck(this)">
          <span class="state-circle">○</span>
        </button>
        <div class="precheck-content">
          <span class="precheck-icon">${item.icon}</span>
          <div>
            <div class="precheck-title-item">${item.title}</div>
            <div class="precheck-desc">${item.desc}</div>
          </div>
        </div>
      `;
      recSection.appendChild(row);
    });
    card.appendChild(recSection);
  }

  // 添加安全提醒
  if (pre.warning) {
    const warning = document.createElement('div');
    warning.className = 'precheck-warning';
    warning.textContent = pre.warning;
    card.appendChild(warning);
  }

  // 添加底部按钮
  const footer = document.createElement('div');
  footer.className = 'precheck-footer';
  footer.innerHTML = `
    <button class="precheck-btn" onclick="goToTutorial('${key}')">
      <span>我已确认，开始查看教程</span>
      <span class="precheck-btn-ico">✅</span>
    </button>
    <div class="precheck-skip" onclick="goToTutorial('${key}')">
      直接跳过 ›
    </div>
  `;
  card.appendChild(footer);

  area.appendChild(card);
  area.scrollTop = area.scrollHeight;
}

// 切换前置条件完成状态
function togglePreCheck(btn) {
  const row = btn.parentElement;
  row.classList.toggle('done');
  const circle = btn.querySelector('.state-circle');
  circle.textContent = row.classList.contains('done') ? '✓' : '○';
}

// 切换"如何完成"展开状态
function toggleHowTo(btn) {
  const body = btn.nextElementSibling;
  const isOpen = body.style.display === 'block';
  body.style.display = isOpen ? 'none' : 'block';
  btn.textContent = isOpen ? '▾ 如何完成这一步' : '▴ 收起';
}

// 跳转到教程
function goToTutorial(key) {
  loadTutorial(key);
  switchPage('tutorial');
}

// ---------- 语音按钮（按住说话 → 松开识别 → 显示确认） ----------

function setAiStatus(status) {
  const dot = document.getElementById('ai-status-dot');
  const text = document.getElementById('ai-status-text');
  if (!dot || !text) return;

  dot.classList.remove('idle', 'listening', 'thinking', 'speaking');
  dot.classList.add(status);

  const statusMap = {
    idle: '空闲',
    listening: '识别中',
    thinking: '思考中',
    speaking: '回答中'
  };
  text.textContent = statusMap[status] || status;
}

function startVoiceHold() {
  if (!isLoggedIn()) {
    showLoginGuide();
    return;
  }

  const btn = document.getElementById('voice-btn');
  const wave = document.getElementById('voice-wave');
  const ico = document.getElementById('voice-ico');
  const txt = document.getElementById('voice-text');
  if (!btn || btn.classList.contains('listening')) return;

  btn.classList.add('active', 'listening');
  wave.style.display = 'flex';
  ico.style.display = 'none';
  txt.textContent = '松开 识别';
  setAiStatus('listening');

  // 震动反馈
  if (navigator.vibrate) navigator.vibrate(30);

  // 开始真实语音识别
  startRecognition(function() {});

  // 超时保护：8秒后自动结束
  clearTimeout(voiceHoldTimer);
  voiceHoldTimer = setTimeout(() => {
    endVoiceHold();
  }, 8000);
}

function endVoiceHold() {
  const btn = document.getElementById('voice-btn');
  if (!btn) return;
  if (!btn.classList.contains('listening')) return;

  clearTimeout(voiceHoldTimer);
  stopRecognition();

  btn.classList.remove('active', 'listening');
  const wave = document.getElementById('voice-wave');
  const ico = document.getElementById('voice-ico');
  const txt = document.getElementById('voice-text');
  if (wave) wave.style.display = 'none';
  if (ico) ico.style.display = 'block';
  if (txt) txt.textContent = '正在识别…';
  setAiStatus('thinking');

  // 取真实识别结果，没识别到则降级为随机演示
  let q = voiceRecogResult;
  voiceRecogResult = '';
  if (!q) {
    const demos = ['微信视频怎么打', '字体怎么调大', '怎么付款买东西', '照片怎么发家人'];
    q = demos[Math.floor(Math.random() * demos.length)];
  }
  setTimeout(() => simulateAsk(q), 400);
}

// ---------- 朗读功能 ----------
function speakCurrentStep() {
  if (!('speechSynthesis' in window)) {
    showToast('当前浏览器不支持语音播报');
    return;
  }
  const btn = document.getElementById('speak-btn');
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    btn.classList.remove('speaking');
    btn.textContent = '🔊 读给我听';
    return;
  }
  const tip = tutorials[currentTip];
  const step = tip.steps[currentStep];
  const text = `${step.title}。${step.desc}`;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'zh-CN';
  utter.rate = 0.9;
  utter.pitch = 1;
  utter.onend = () => {
    isSpeaking = false;
    btn.classList.remove('speaking');
    btn.textContent = '🔊 读给我听';
  };
  isSpeaking = true;
  btn.classList.add('speaking');
  btn.textContent = '⏹ 停止朗读';
  window.speechSynthesis.speak(utter);
}

// ---------- 签到功能 ----------
const CHECKIN_TOTAL = 30; // 连续签到 30 天送一盒鸡蛋

function getCheckinData() {
  try {
    const raw = localStorage.getItem('checkin_data');
    return raw ? JSON.parse(raw) : { streak: 12, lastDate: null, checkedToday: false };
  } catch (e) {
    return { streak: 12, lastDate: null, checkedToday: false };
  }
}

function saveCheckinData(data) {
  try {
    localStorage.setItem('checkin_data', JSON.stringify(data));
  } catch (e) {}
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function renderCheckin() {
  const data = getCheckinData();
  const today = todayStr();

  // 如果今天第一次加载且昨天没签，重置连续天数（但保留一个合理默认）
  if (data.lastDate && data.lastDate !== today && data.lastDate !== yesterdayStr()) {
    data.streak = Math.max(0, data.streak);
  }
  data.checkedToday = data.lastDate === today;

  const count = Math.min(data.streak, CHECKIN_TOTAL);
  const remain = Math.max(CHECKIN_TOTAL - count, 0);
  const percent = (count / CHECKIN_TOTAL) * 100;

  document.getElementById('checkin-count').textContent = count;
  document.getElementById('checkin-remain').textContent = remain;
  document.getElementById('checkin-progress-bar').style.width = percent + '%';

  const btn = document.getElementById('checkin-btn');
  const btnText = document.getElementById('checkin-btn-text');
  if (data.checkedToday) {
    btn.classList.add('done');
    btnText.textContent = '今日已签到 ✓';
    btn.disabled = true;
  } else {
    btn.classList.remove('done');
    btnText.textContent = '今日学习签到';
    btn.disabled = false;
  }
}

function doCheckin() {
  const data = getCheckinData();
  const today = todayStr();

  if (data.lastDate === today) {
    showToast('今天已经签过啦，明天再来～');
    return;
  }

  // 防止重复快速点击
  const btn = document.getElementById('checkin-btn');
  if (btn && btn.disabled) return;
  if (btn) {
    btn.disabled = true;
    btn.classList.add('checking');
    btn.querySelector('.checkin-btn-text').textContent = '正在打开…';
  }

  // 跳转到每日学习任务页面（防诈骗课程）
  switchPage('daily-task');

  // 重置答题状态
  const options = document.querySelectorAll('.daily-option');
  options.forEach(o => { o.classList.remove('selected', 'show-correct', 'show-wrong'); });
  const submit = document.getElementById('daily-submit-btn');
  if (submit) { submit.disabled = true; submit.textContent = '请先选择一个答案'; }
  const result = document.getElementById('daily-result');
  if (result) result.style.display = 'none';

  // 恢复按钮状态（回到首页时会重新渲染）
  if (btn) {
    btn.disabled = false;
    btn.classList.remove('checking');
  }
}

// 答完题后的实际签到
function completeCheckinAfterQuiz() {
  const data = getCheckinData();
  const today = todayStr();

  if (data.lastDate === today) {
    renderCheckin();
    switchPage('home');
    showToast('今天已经签过啦，明天再来～');
    return;
  }

  if (data.lastDate === yesterdayStr()) {
    data.streak = (data.streak || 0) + 1;
  } else {
    data.streak = 1;
  }
  data.lastDate = today;
  data.checkedToday = true;
  saveCheckinData(data);

  const count = Math.min(data.streak, CHECKIN_TOTAL);
  renderCheckin();

  setTimeout(() => {
    switchPage('home');
    setTimeout(() => {
      showCheckinCelebration();
    }, 300);
    if (count >= CHECKIN_TOTAL) {
      showToast('🎉 恭喜您连续签到 30 天，鸡蛋已放入账户！');
    } else {
      showToast(`✓ 签到成功！已连续签到 ${count} 天，加油～`);
    }
  }, 1200);
}

// 签到庆祝动画
function showCheckinCelebration() {
  const card = document.getElementById('checkin-card');
  if (!card) return;

  // 卡片弹跳动画
  card.classList.add('celebrate');
  setTimeout(() => card.classList.remove('celebrate'), 600);

  // 飘浮表情
  const emoji = document.createElement('div');
  emoji.className = 'checkin-burst';
  emoji.textContent = '🎉';
  card.style.position = 'relative';
  card.appendChild(emoji);
  setTimeout(() => emoji.remove(), 1000);

  // 重新触发进度条动画
  const progressBar = document.getElementById('checkin-progress-bar');
  if (progressBar) {
    const data = getCheckinData();
    const cnt = Math.min(data.streak, CHECKIN_TOTAL);
    const percent = (cnt / CHECKIN_TOTAL) * 100;
    progressBar.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        progressBar.style.width = percent + '%';
      });
    });
  }
}

// ---------- 初始化绑定 ----------
function initApp() {
  // 签到功能
  renderCheckin();
  const cbtn = document.getElementById('checkin-btn');
  if (cbtn) {
    cbtn.onclick = doCheckin;
  }

  // 每日学习任务：答案选择
  let selectedValue = null;
  document.querySelectorAll('.daily-option').forEach(opt => {
    opt.onclick = function() {
      document.querySelectorAll('.daily-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedValue = opt.dataset.value;
      const submit = document.getElementById('daily-submit-btn');
      if (submit) { submit.disabled = false; submit.textContent = '✓ 提交答案并签到'; }
    };
  });

  // 提交按钮
  const submitBtn = document.getElementById('daily-submit-btn');
  if (submitBtn) {
    submitBtn.onclick = function() {
      if (!selectedValue) {
        showToast('请先选择一个答案');
        return;
      }
      const correctEl = document.querySelector('.daily-option.correct');
      const correctValue = correctEl ? correctEl.dataset.value : 'C';
      const isCorrect = selectedValue === correctValue;

      document.querySelectorAll('.daily-option').forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === correctValue) {
          opt.classList.add('show-correct');
        } else if (opt.dataset.value === selectedValue) {
          opt.classList.add('show-wrong');
        }
      });

      const result = document.getElementById('daily-result');
      const rTitle = document.getElementById('daily-result-title');
      const rSub = document.getElementById('daily-result-sub');
      const rIco = document.getElementById('daily-result-ico');
      if (result) result.style.display = 'flex';

      if (isCorrect) {
        rIco.textContent = '✓';
        rTitle.textContent = '回答正确！太棒啦';
        rSub.textContent = '正在为您完成签到，稍等片刻…';
        submitBtn.disabled = true;
        submitBtn.textContent = '签到中…';
        completeCheckinAfterQuiz();
      } else {
        rIco.textContent = '✕';
        rTitle.textContent = '再想想看～';
        rSub.textContent = '请重新考虑一下，正确答案是 C：不点击、不回复陌生短信';
        submitBtn.textContent = '再选一次试试';
        // 3 秒后允许重新选择
        setTimeout(() => {
          document.querySelectorAll('.daily-option').forEach(opt => {
            opt.classList.remove('show-correct', 'show-wrong');
          });
          if (result) result.style.display = 'none';
          selectedValue = null;
          submitBtn.disabled = true;
          submitBtn.textContent = '请先选择一个答案';
        }, 3500);
      }
    };
  }

  // 更新日期显示
  const dateEl = document.getElementById('daily-date');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  // 导航项点击
  document.querySelectorAll('[data-page]').forEach(el => {
    el.onclick = function() {
      const page = el.dataset.page;
      switchPage(page);
    };
  });

  // 首页/广场卡片点击
  document.querySelectorAll('[data-tip]').forEach(card => {
    card.onclick = function() {
      const key = card.dataset.tip;
      if (tutorials[key]) {
        loadTutorial(key);
        switchPage('tutorial');
      } else {
        showToast('该内容正在完善中...');
      }
    };
  });

  // 示例标签点击
  document.querySelectorAll('.example-tag').forEach(tag => {
    tag.onclick = function() {
      simulateAsk(tag.dataset.question);
    };
  });

  // 语音按钮（按住说话 → 松开识别）
  const voiceBtn = document.getElementById('voice-btn');
  if (voiceBtn) {
    voiceBtn.onmousedown = function(e) { e.preventDefault(); startVoiceHold(); };
    voiceBtn.onmouseup = function(e) { e.preventDefault(); endVoiceHold(); };
    voiceBtn.onmouseleave = function(e) {
      if (voiceBtn.classList.contains('listening')) endVoiceHold();
    };
    voiceBtn.ontouchstart = function(e) { e.preventDefault(); startVoiceHold(); };
    voiceBtn.ontouchend = function(e) {
      e.preventDefault();
      endVoiceHold();
    };
    voiceBtn.ontouchmove = function(e) {
      const rect = voiceBtn.getBoundingClientRect();
      const touch = e.changedTouches[0];
      if (touch.clientX < rect.left || touch.clientX > rect.right ||
          touch.clientY < rect.top || touch.clientY > rect.bottom) {
        endVoiceHold();
      }
    };
  }

  // 步骤控制
  const btnPrev = document.getElementById('btn-prev');
  if (btnPrev) {
    btnPrev.onclick = function() {
      if (currentStep > 0) {
        currentStep--;
        renderStep();
      }
    };
  }
  const btnNext = document.getElementById('btn-next');
  if (btnNext) {
    btnNext.onclick = function() {
      const total = tutorials[currentTip].steps.length;
      if (currentStep < total - 1) {
        currentStep++;
        renderStep();
      } else {
        showToast('🎉 恭喜您完成学习！');
        setTimeout(() => switchPage('home'), 1200);
      }
    };
  }

  // 朗读按钮
  const speakBtn = document.getElementById('speak-btn');
  if (speakBtn) speakBtn.onclick = speakCurrentStep;

  // 呼叫子女
  const btnCall = document.getElementById('btn-call');
  if (btnCall) {
    btnCall.onclick = function() {
      showToast('📞 正在呼叫您的女儿...');
    };
  }

  // 防骗卡片按钮
  document.querySelectorAll('.scam-btn').forEach(btn => {
    btn.onclick = function() {
      showToast('完整案例即将上线，敬请关注');
    };
  });

  // 分类标签
  document.querySelectorAll('.cat-tag').forEach(tag => {
    tag.onclick = function() {
      document.querySelectorAll('.cat-tag').forEach(t => t.classList.remove('active'));
      tag.classList.add('active');
    };
  });

  // 社区Tab切换
  document.querySelectorAll('.community-tab').forEach(tab => {
    tab.onclick = function() {
      document.querySelectorAll('.community-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    };
  });

  // 广场防骗横幅点击
  document.querySelectorAll('.safe-banner').forEach(banner => {
    banner.onclick = function() {
      showToast('点击防骗内容卡片了解详细案例');
    };
  });

  // 语音导航按钮
  const voiceNavBtn = document.getElementById('voice-nav-btn');
  if (voiceNavBtn) {
    voiceNavBtn.onmousedown = function(e) { e.preventDefault(); startVoiceNav(); };
    voiceNavBtn.onmouseup = function(e) { e.preventDefault(); endVoiceNav(); };
    voiceNavBtn.onmouseleave = function() {
      if (voiceNavBtn.classList.contains('active')) endVoiceNav();
    };
    voiceNavBtn.ontouchstart = function(e) { e.preventDefault(); startVoiceNav(); };
    voiceNavBtn.ontouchend = function(e) { e.preventDefault(); endVoiceNav(); };
  }

  // 提示芯片
  document.querySelectorAll('.voice-nav-hint-chip').forEach(chip => {
    chip.onclick = function() {
      triggerIntentByChip(chip.dataset.intent);
    };
  });

  // 确认弹窗按钮
  const cNo = document.getElementById('confirm-no');
  const cYes = document.getElementById('confirm-yes');
  if (cNo) cNo.onclick = function() {
    hideConfirmModal();
    showToast('好的，您可以再按一次语音按钮');
  };
  if (cYes) cYes.onclick = executeIntent;

  // 字体大小切换
  const rowFont = document.getElementById('row-font');
  if (rowFont) {
    rowFont.onclick = function() {
      document.body.classList.toggle('large-font');
      const isLarge = document.body.classList.contains('large-font');
      const fontStatus = document.getElementById('font-status');
      if (fontStatus) fontStatus.textContent = isLarge ? '特大 ·›' : '标准 ·›';
      showToast(isLarge ? '已切换为特大字体' : '已切换为标准字体');
    };
  }

  // 右侧演示按钮
  document.querySelectorAll('.demo-btn').forEach(btn => {
    btn.onclick = function() {
      const demo = btn.dataset.demo;
      if (demo === 'voice') {
        switchPage('ask');
        setTimeout(() => {
          const q = ['微信视频怎么打', '怎么付款买东西', '照片怎么发家人'][Math.floor(Math.random() * 3)];
          simulateAsk(q);
        }, 400);
      } else if (demo === 'tutorial') {
        loadTutorial('wechat-video');
        switchPage('tutorial');
      } else if (demo === 'font') {
        document.body.classList.toggle('large-font');
        const isLarge = document.body.classList.contains('large-font');
        const fontStatus = document.getElementById('font-status');
        if (fontStatus) fontStatus.textContent = isLarge ? '特大 ·›' : '标准 ·›';
        showToast(isLarge ? '已切换为特大字体' : '已切换为标准字体');
      }
    };
  });

  // AI设置页面跳转
  const aiSubRow = document.getElementById('ai-sub-row');
  if (aiSubRow) {
    aiSubRow.onclick = function() { switchPage('ai-setting'); };
  }
  const rowAiSetting = document.getElementById('row-ai-setting');
  if (rowAiSetting) {
    rowAiSetting.onclick = function() { switchPage('ai-setting'); };
  }

  // 退出登录
  const rowLogout = document.getElementById('row-logout');
  if (rowLogout) {
    rowLogout.onclick = doLogout;
  }

  // 加载AI设置
  loadAiSettings();

  // 初始化语音识别
  initVoiceRecognition();

  // 初始化登录态
  initLoginState();

  // 加载AI统计
  loadAiStats();

  // 初始化默认教程
  loadTutorial('wechat-video');
}

// 演示模式 - 自动走一遍核心功能
function startDemoMode() {
  var steps = [
    { page: 'home', msg: '首页·个性化推荐+每日签到' },
    { page: 'ask', msg: '语音提问·AI智能问答' },
    { page: 'tutorial', msg: '步骤教程·分步图文+语音播报' },
    { page: 'plaza', msg: '技巧广场·内容沉淀' },
    { page: 'community', msg: '银发社区·交友互助' },
    { page: 'me', msg: '个人中心·学习记录' }
  ];
  var i = 0;
  showToast('🎬 银发助手核心功能演示');
  var timer = setInterval(function() {
    if (i >= steps.length) {
      clearInterval(timer);
      showToast('✅ 演示结束！可自由探索');
      return;
    }
    switchPage(steps[i].page);
    showToast(steps[i].msg, 1200);
    i++;
  }, 2000);
}

function updateAiStats() {
  let count = parseInt(localStorage.getItem('ai_total_count') || '128');
  count += 1;
  localStorage.setItem('ai_total_count', count.toString());
  const totalEl = document.getElementById('ai-total-count') || document.getElementById('stat-total-count');
  if (totalEl) totalEl.textContent = count;

  const todayKey = 'ai_today_' + new Date().toDateString();
  let todayCount = parseInt(localStorage.getItem(todayKey) || '3');
  todayCount += 1;
  localStorage.setItem(todayKey, todayCount.toString());
  const todayEl = document.getElementById('ai-today-count') || document.getElementById('stat-today-count');
  if (todayEl) todayEl.textContent = todayCount;
}

function loadAiStats() {
  const count = parseInt(localStorage.getItem('ai_total_count') || '128');
  const totalEl = document.getElementById('ai-total-count') || document.getElementById('stat-total-count');
  if (totalEl) totalEl.textContent = count;

  const todayKey = 'ai_today_' + new Date().toDateString();
  const todayCount = parseInt(localStorage.getItem(todayKey) || '3');
  const todayEl = document.getElementById('ai-today-count') || document.getElementById('stat-today-count');
  if (todayEl) todayEl.textContent = todayCount;
}

// ---------- 自动演示功能 ----------
let autoDemoTimer = null;
let isDemoing = false;

function startAutoDemo() {
  if (isDemoing) return;
  isDemoing = true;

  const btn = document.getElementById('auto-demo-btn');
  if (btn) {
    btn.textContent = '演示中...';
    btn.classList.add('demoing');
  }

  const pages = ['home', 'ask', 'tutorial', 'plaza', 'community', 'me'];
  let idx = 0;

  function showNext() {
    if (!isDemoing) return;

    switchPage(pages[idx]);

    idx++;
    if (idx < pages.length) {
      autoDemoTimer = setTimeout(showNext, 2000);
    } else {
      stopAutoDemo();
    }
  }

  showNext();
}

function stopAutoDemo() {
  isDemoing = false;
  clearTimeout(autoDemoTimer);

  const btn = document.getElementById('auto-demo-btn');
  if (btn) {
    btn.textContent = '开始自动演示';
    btn.classList.remove('demoing');
  }
}

// 页面切换时停止演示
const originalSwitchPage = switchPage;
switchPage = function(pageId) {
  if (isDemoing && pageId !== 'login') {
    stopAutoDemo();
  }
  originalSwitchPage(pageId);
};

// DOM加载完成后执行（兼容DOMContentLoaded和已加载情况）
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
