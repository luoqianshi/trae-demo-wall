export interface ActionSuggestion {
  id: string
  type: 'calendar' | 'reply' | 'location' | 'purchase' | 'reminder'
  title: string
  description: string
  payload: Record<string, string>
}

const COMMITMENT_KEYWORDS = ['买', '采购', '下单', '陪', '去', '逛', '约', '提醒', '记得']

export function extractCommitments(text: string): string[] {
  return text
    .split(/[。！？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5 && COMMITMENT_KEYWORDS.some((kw) => s.includes(kw)))
    .slice(0, 3)
}

export function suggestActions(text: string): ActionSuggestion[] {
  const commitments = extractCommitments(text)
  const actions: ActionSuggestion[] = []

  for (const c of commitments) {
    const lower = c.toLowerCase()

    // 购买类：买/采购/下单 → 查看购买建议
    if (lower.includes('买') || lower.includes('采购') || lower.includes('下单')) {
      actions.push({
        id: `purchase-${actions.length}`,
        type: 'purchase',
        title: '查看购买建议',
        description: c,
        payload: { item: c },
      })
    }

    // 日程类：陪/去/逛/约/提醒/记得 → 加入提醒
    if (lower.includes('陪') || lower.includes('去') || lower.includes('逛') || lower.includes('约') || lower.includes('提醒') || lower.includes('记得')) {
      actions.push({
        id: `reminder-${actions.length}`,
        type: 'reminder',
        title: '加入待办提醒',
        description: c,
        payload: { title: c },
      })
    }

    // 日历类：所有承诺都可以加入日历
    actions.push({
      id: `calendar-${actions.length}`,
      type: 'calendar',
      title: '加入日历提醒',
      description: c,
      payload: { title: c },
    })
  }

  return actions.slice(0, 4)
}

/**
 * 执行场景卡片动作
 *
 * 设计原则：
 * - location 类型不再跳转百度地图（之前会把"带一诺去参赛"误搜地图，毫无意义）
 * - reminder 类型：复制到剪贴板，方便用户粘贴到待办软件
 * - calendar 类型：复制到剪贴板，格式为"提醒：XXX"
 * - purchase 类型：跳转京东搜索（仅当确实是购物场景时触发）
 * - reply 类型：复制回复内容到剪贴板
 */
export function executeAction(action: ActionSuggestion): void {
  if (action.type === 'purchase') {
    const q = encodeURIComponent(action.payload.item || action.description)
    window.open(`https://www.jd.com/Search?keyword=${q}`, '_blank')
  } else if (action.type === 'calendar') {
    void navigator.clipboard.writeText(`提醒：${action.payload.title || action.description}`)
  } else if (action.type === 'reminder') {
    void navigator.clipboard.writeText(`待办：${action.payload.title || action.description}`)
  } else if (action.type === 'reply') {
    void navigator.clipboard.writeText(action.payload.text || action.description)
  } else if (action.type === 'location') {
    // location 类型不再跳转外部地图，改为复制到剪贴板
    void navigator.clipboard.writeText(`地点相关：${action.payload.keyword || action.description}`)
  }
}
