// ========== Social Decoder Demo 数据 ==========
// 4 个高质量案例，覆盖职场、面试、客户、多轮聊天

const cases = [
  
  // ========== 案例 1：职场 ==========
  {
    id: 'work',
    name: '职场',
    mode: 'single',
    input: '老板：这个方案再完善一下',
    result: {
      summary: '这是一段典型的职场上下级沟通。老板使用委婉表达，暗示对当前方案不完全满意，希望你继续优化。情绪偏保守，存在一定的沟通误解风险。建议采用专业、积极的方式回应，明确下一步行动计划。',
      scene_analysis: {
        scene: '职场',
        confidence: 91,
        confidence_reason: '检测到明确的职场角色称呼（老板）和工作相关词汇（方案），上下文高度一致',
        evidence_chain: [
          { detection: '老板', inference: '判断为上下级关系，存在信息不对称' },
          { detection: '方案', inference: '讨论内容为工作任务，属于正式沟通场合' },
          { detection: '再完善一下', inference: '属于委婉的负面反馈，有改进空间' }
        ]
      },
      emotion_analysis: {
        emotion: '焦虑',
        score: 78,
        intensity: 65,
        reason: '对方使用委婉表达，暗示对当前方案不完全满意',
        confidence_reason: '检测到委婉表达和保守措辞，情绪偏中性偏负面',
        evidence_chain: [
          { detection: '再完善一下', inference: '对方有更高期望，当前未达到' },
          { detection: '委婉语气', inference: '情绪偏保守，未直接表达不满' }
        ]
      },
      intent_analysis: {
        surface_meaning: '让你把方案再修改完善',
        true_meaning: '老板对当前方案不满意，希望你重新修改后再提交，可能需要较大调整',
        confidence: 85,
        confidence_reason: '检测到典型的职场委婉表达模式，解读可信度高',
        evidence_chain: [
          { detection: '再完善一下', inference: '不是简单修改，而是需要较大调整' },
          { detection: '没有直接否定', inference: '老板给你留了面子，但实际要求较高' },
          { detection: '上级对下级说话', inference: '话语权不对等，需要重视' }
        ]
      },
      risk_analysis: {
        score: 62,
        level: '中风险',
        reason: '存在沟通误解风险，如果简单修改可能达不到老板预期',
        confidence_reason: '检测到委婉拒绝的典型特征，结合职场上下级关系判断',
        evidence_chain: [
          { detection: '委婉表达', inference: '真实意图可能被隐藏' },
          { detection: '未明确说明修改方向', inference: '存在理解偏差风险' },
          { detection: '上下级关系', inference: '信息不对等增加沟通难度' }
        ]
      },
      reply_suggestions: {
        professional: '好的老板，我理解您的意思。我会重新梳理方案框架，重点优化XX部分，明天下午给您一个新版本，您看可以吗？',
        high_eq: '收到老板反馈！我马上调整，争取做到您满意的效果。请问您觉得哪个部分需要重点优化呢？我好针对性修改~',
        simple: '好的老板，我马上改。'
      },
      advice: '老板说"再完善一下"通常意味着对方案有较大的不满意，但又不想直接打击你。建议：1）主动询问具体修改方向；2）给出明确的修改时间表；3）下次提交时附上修改说明。'
    }
  },
  
  // ========== 案例 2：面试 ==========
  {
    id: 'interview',
    name: '面试',
    mode: 'single',
    input: '面试官：回去等通知吧',
    result: {
      summary: '这是面试场景中的经典婉拒信号。"回去等通知"意味着你可能不是最佳人选，但对方保留了礼貌和余地。不要抱太大希望，但也不必完全绝望，可以同步准备其他机会。',
      scene_analysis: {
        scene: '面试',
        confidence: 88,
        confidence_reason: '检测到明确的面试场景词汇（面试官）和典型的面试结束语',
        evidence_chain: [
          { detection: '面试官', inference: '正式面试场合，角色关系明确' },
          { detection: '回去等通知', inference: '面试结束语，常见于婉拒' }
        ]
      },
      emotion_analysis: {
        emotion: '中性',
        score: 65,
        intensity: 40,
        reason: '面试官语气专业中性，没有明显情绪倾向',
        confidence_reason: '职业化的表达方式，难以判断真实态度',
        evidence_chain: [
          { detection: '等通知', inference: '官方表达，不带个人情绪' }
        ]
      },
      intent_analysis: {
        surface_meaning: '让你先回去，等待公司后续通知',
        true_meaning: '委婉表达"可能不适合"，暗示你大概率不会进入下一轮',
        confidence: 82,
        confidence_reason: '"回去等通知"在面试场景中九成以上是婉拒信号',
        evidence_chain: [
          { detection: '回去等通知', inference: '没有当场录用意向，属于婉拒' },
          { detection: '没有追问', inference: '面试官没有进一步沟通意愿' },
          { detection: '标准结束语', inference: '对方使用职业化表达，保持距离' }
        ]
      },
      risk_analysis: {
        score: 45,
        level: '中风险',
        reason: '沟通本身风险不高，但可能错失这个机会',
        confidence_reason: '委婉拒绝信号明确，需要做好心理准备',
        evidence_chain: [
          { detection: '婉拒信号', inference: '这类表达后续录用概率较低' },
          { detection: '未明确反馈', inference: '无法从话语中判断真正原因' }
        ]
      },
      reply_suggestions: {
        professional: '好的，谢谢您的时间。期待您的好消息，如果有任何问题可以随时联系我。',
        high_eq: '非常感谢您今天的面试机会！期待能收到好消息，也祝贵公司招聘顺利～',
        simple: '好的，谢谢。'
      },
      advice: '遇到这种情况，建议：1）不要抱太大希望，但也不要放弃其他机会；2）可以礼貌询问后续流程时间；3）继续面试其他公司；4）复盘这次面试，思考改进点。'
    }
  },
  
  // ========== 案例 3：客户 ==========
  {
    id: 'client',
    name: '客户',
    mode: 'single',
    input: '客户：这个报价我们再考虑一下',
    result: {
      summary: '这是一个典型的客户观望信号。对方没有直接拒绝，但也没有明确意向。可能是价格因素，也可能是需要内部讨论。建议主动跟进，了解真实顾虑。',
      scene_analysis: {
        scene: '客户',
        confidence: 85,
        confidence_reason: '检测到商务场景关键词（报价），沟通目的明确',
        evidence_chain: [
          { detection: '客户', inference: '商务合作关系，利益导向' },
          { detection: '报价', inference: '涉及价格和合作条件' },
          { detection: '再考虑一下', inference: '典型的观望或拖延表达' }
        ]
      },
      emotion_analysis: {
        emotion: '不确定',
        score: 58,
        intensity: 35,
        reason: '对方态度中性偏犹豫，可能有顾虑但未明确表达',
        confidence_reason: '观望语气背后可能有多种原因',
        evidence_chain: [
          { detection: '再考虑一下', inference: '有顾虑但不想直接说明' }
        ]
      },
      intent_analysis: {
        surface_meaning: '需要时间考虑这个报价',
        true_meaning: '可能觉得价格偏高，或需要内部讨论，尚未决定是否合作',
        confidence: 78,
        confidence_reason: '商务场景中的典型观望表达',
        evidence_chain: [
          { detection: '再考虑一下', inference: '不是明确的拒绝，是争取时间' },
          { detection: '未讨价还价', inference: '对方还没进入实质谈判' },
          { detection: '未提具体问题', inference: '顾虑可能不止价格一方面' }
        ]
      },
      risk_analysis: {
        score: 35,
        level: '低风险',
        reason: '客户态度积极，合作可能性较大',
        confidence_reason: '对方未拒绝说明有意向跟进',
        evidence_chain: [
          { detection: '未直接拒绝', inference: '对方仍有合作意向' },
          { detection: '未提出异议', inference: '顾虑暂未表达，需主动跟进' }
        ]
      },
      reply_suggestions: {
        professional: '完全理解，这个决定需要慎重考虑。如果方便的话，可以约个时间详细聊聊？或者您有任何疑问随时联系我。',
        high_eq: '好的！不着急，您慢慢考虑～如果有任何问题或者想进一步了解，随时找我，我很乐意帮忙！😊',
        simple: '好的，您考虑好了联系我。'
      },
      advice: '面对这种观望信号：1）不要急于催促，给对方时间；2）主动询问是否有顾虑；3）提供更多信息或优惠；4）设定跟进时间节点，主动联系。'
    }
  },
  
  // ========== 案例 4：多轮聊天 ==========
  {
    id: 'conversation',
    name: '多轮聊天',
    mode: 'conversation',
    input: `老板：这个方案再完善一下
员工：好的，请问具体是哪个部分需要调整？
老板：主要是预算部分，再压缩一下
员工：明白了，我重新核算一下成本
老板：嗯，明天之前给我新方案`,
    result: {
      summary: '这是一段完整的职场上下级沟通对话。从老板提出意见，到员工主动询问，再到老板给出具体方向，最后员工确认执行。对话节奏良好，沟通清晰，是一个相对健康的职场对话。',
      scene_analysis: {
        scene: '职场',
        confidence: 94,
        confidence_reason: '检测到明确的职场角色（老板、员工）和工作场景（方案、预算）',
        evidence_chain: [
          { detection: '老板/员工', inference: '明确的上下级关系' },
          { detection: '方案/预算/成本', inference: '典型的工作讨论内容' }
        ]
      },
      emotion_analysis: {
        emotion: '中性',
        score: 62,
        intensity: 45,
        reason: '整段对话语气平稳，双方情绪稳定',
        confidence_reason: '对话中无明显情绪波动词汇',
        evidence_chain: [
          { detection: '语气平稳', inference: '双方都保持专业态度' }
        ]
      },
      intent_analysis: {
        surface_meaning: '老板要求优化方案中的预算部分',
        true_meaning: '老板对整体方案认可，只针对预算有更高要求，希望员工能体现成本意识',
        confidence: 88,
        confidence_reason: '结合多轮对话上下文，意图清晰',
        evidence_chain: [
          { detection: '老板明确指出预算', inference: '问题聚焦，意图明确' },
          { detection: '员工主动确认', inference: '沟通有效，双方理解一致' }
        ]
      },
      risk_analysis: {
        score: 28,
        level: '低风险',
        reason: '沟通顺畅，双方配合良好，风险较低',
        confidence_reason: '多轮对话表明双方沟通渠道畅通',
        evidence_chain: [
          { detection: '员工主动询问', inference: '信息不对称被及时弥补' },
          { detection: '老板给出具体方向', inference: '反馈明确，减少误解' }
        ]
      },
      reply_suggestions: {
        professional: '收到，我今天重新梳理成本结构，明天上午10点前发您新版方案，包含详细预算明细和优化空间分析。',
        high_eq: '好的老板！预算这块我马上重新核算，争取在保证质量的前提下把成本压下来～有结果第一时间汇报！',
        simple: '好的，明天给您。'
      },
      advice: '这段对话是一个良好的职场沟通范例：1）老板提出问题不过于模糊；2）员工主动确认细节；3）老板给出具体方向；4）员工承诺完成时间。建议学习这种高效沟通模式。'
    }
  }
  
];
