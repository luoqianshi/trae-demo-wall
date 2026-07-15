export const MAX_PLAYER_INPUT_LENGTH = 300

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
const ZERO_WIDTH_CHARACTERS = /[\u200b-\u200d\u2060\ufeff]/g

const PROMPT_INJECTION_PATTERNS = [
  /(?:忽略|无视|覆盖|忘记).{0,24}(?:以上|此前|之前|原有|系统|开发者|提示词|指令|规则)/i,
  /(?:显示|输出|复述|泄露).{0,20}(?:系统提示词|开发者消息|隐藏指令|system prompt)/i,
  /(?:system prompt|developer message|jailbreak|prompt injection|ignore previous|ignore all (?:prior|above))/i,
  /(?:进入|切换|开启).{0,12}(?:开发者模式|管理员模式|越狱模式|无限制模式)/i
]

const ACTIVE_CONTENT_PATTERNS = [
  /<\s*(?:script|iframe|object|embed|style|link|meta)\b/i,
  /(?:javascript|vbscript|data\s*:\s*text\/html)\s*:/i,
  /(?:onerror|onload|onclick)\s*=/i,
  /(?:https?:\/\/|www\.)\S{12,}/i,
  /```[\s\S]{12,}```/,
  /(?:select\s+.+\s+from|drop\s+table|union\s+select|<\/?[a-z][^>]{8,}>)/i
]

const OUT_OF_WORLD_PATTERNS = [
  /(?:请|帮我|给我|替我|能否|可以).{0,12}(?:写|编写|生成|制作|翻译|总结).{0,10}(?:代码|程序|论文|邮件|简历|报告|合同|网页|文章)/i,
  /(?:你是|作为|扮演).{0,8}(?:AI|人工智能|语言模型|ChatGPT|Claude|Gemini|DeepSeek)/i,
  /\b(?:ChatGPT|OpenAI|Claude|Gemini|DeepSeek|JavaScript|TypeScript|Python)\b/i,
  /(?:解答|求解|计算).{0,10}(?:数学题|方程|微积分|概率题)/i,
  /(?:分析|预测|推荐).{0,10}(?:股票|基金|比特币|加密货币)/i
]

function normalizedText(value) {
  if (typeof value !== 'string') return ''
  return value
    .normalize('NFKC')
    .replace(CONTROL_CHARACTERS, '')
    .replace(ZERO_WIDTH_CHARACTERS, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isCharacterSpam(text) {
  if (/(.)\1{15,}/u.test(text)) return true
  if (/[A-Za-z0-9+/]{100,}={0,2}/.test(text)) return true

  const characters = Array.from(text)
  if (characters.length < 24) return false
  const meaningfulCount = characters.filter((character) => /[\p{L}\p{N}]/u.test(character)).length
  return meaningfulCount / characters.length < 0.22
}

export function inspectPlayerInput(value) {
  const text = normalizedText(value)
  if (!text) return { accepted: false, category: 'empty', text: '' }
  if (Array.from(text).length > MAX_PLAYER_INPUT_LENGTH) {
    return { accepted: false, category: 'too_long', text: text.slice(0, MAX_PLAYER_INPUT_LENGTH) }
  }
  if (PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(text))) {
    return { accepted: false, category: 'prompt_injection', text }
  }
  if (ACTIVE_CONTENT_PATTERNS.some((pattern) => pattern.test(text))) {
    return { accepted: false, category: 'active_content', text }
  }
  if (isCharacterSpam(text)) {
    return { accepted: false, category: 'spam', text }
  }
  if (OUT_OF_WORLD_PATTERNS.some((pattern) => pattern.test(text))) {
    return { accepted: false, category: 'off_topic', text }
  }
  return { accepted: true, category: 'ok', text }
}

export function createGuardedReply(npcName = '对方', category = 'off_topic') {
  if (category === 'too_long') {
    return `${npcName}抬手打断了你：“慢点说，挑要紧的。”`
  }
  if (category === 'spam' || category === 'active_content' || category === 'empty') {
    return `${npcName}警惕地看着你，没有回应这串古怪的内容。`
  }
  return `${npcName}皱起眉头：“我听不懂你在说什么。要问就问村里的事。”`
}

export function executeWithInputGuard(value, onAccepted) {
  const inspection = inspectPlayerInput(value)
  if (!inspection.accepted) return { inspection, executed: false, result: undefined }
  return {
    inspection,
    executed: true,
    result: onAccepted(inspection.text)
  }
}
