export const NOVEL_STATUS_OPTIONS = [
  { value: 'writing', label: '连载中' },
  { value: 'paused', label: '暂停' },
  { value: 'finished', label: '已完结' },
]

export const NOVEL_GENRE_OPTIONS = [
  '都市',
  '玄幻',
  '仙侠',
  '科幻',
  '悬疑',
  '历史',
  '奇幻',
  '武侠',
  '言情',
  '青春',
  '游戏',
  '同人',
]

export const OUTLINE_LEVEL_LABEL: Record<number, string> = {
  1: '卷',
  2: '章',
  3: '节',
}

export const OUTLINE_LEVEL_ICON: Record<number, string> = {
  1: '📚',
  2: '📖',
  3: '📄',
}

export const RELATION_TYPE_OPTIONS = [
  { value: 'family', label: '亲人' },
  { value: 'couple', label: '夫妻/恋人' },
  { value: 'master', label: '师徒' },
  { value: 'friend', label: '挚友' },
  { value: 'enemy', label: '敌对' },
  { value: 'superior', label: '上下级' },
  { value: 'colleague', label: '同僚' },
  { value: 'custom', label: '自定义' },
]

export const RELATION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  RELATION_TYPE_OPTIONS.map((o) => [o.value, o.label])
)

export const SETTING_CATEGORY_OPTIONS = [
  { value: 'location', label: '地点' },
  { value: 'organization', label: '组织' },
  { value: 'item', label: '物品' },
  { value: 'faction', label: '势力' },
  { value: 'custom', label: '其它' },
]

export const SETTING_CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  SETTING_CATEGORY_OPTIONS.map((o) => [o.value, o.label])
)

export const POLISH_INSTRUCTION_OPTIONS = [
  { value: '更生动流畅', label: '更生动流畅' },
  { value: '更简洁凝练', label: '更简洁凝练' },
  { value: '更书面正式', label: '更书面正式' },
  { value: '更口语自然', label: '更口语自然' },
  { value: '更有画面感', label: '更有画面感' },
]
