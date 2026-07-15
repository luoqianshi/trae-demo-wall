import type { DouyinVideo, FraudDetectResult, FraudRiskLevel } from '@/types'

export const FRAUD_KEYWORDS: { word: string; level: FraudRiskLevel; points: number }[] = [
  { word: '刷单', level: 'high', points: 40 },
  { word: '垫付本金', level: 'high', points: 45 },
  { word: '高额回报', level: 'high', points: 35 },
  { word: '保本高收益', level: 'high', points: 40 },
  { word: '养老理财', level: 'high', points: 35 },
  { word: '养老金账户', level: 'high', points: 45 },
  { word: '保健品', level: 'medium', points: 20 },
  { word: '特效药', level: 'high', points: 40 },
  { word: '治愈率100%', level: 'high', points: 50 },
  { word: '包治百病', level: 'high', points: 45 },
  { word: '仅限今日', level: 'medium', points: 20 },
  { word: '最后一天', level: 'medium', points: 20 },
  { word: '点击链接领取', level: 'high', points: 40 },
  { word: '验证码', level: 'medium', points: 25 },
  { word: '转账', level: 'high', points: 45 },
  { word: '加微信', level: 'medium', points: 20 },
  { word: 'QQ群', level: 'medium', points: 20 },
  { word: '内部名额', level: 'high', points: 35 },
  { word: '国家补贴', level: 'high', points: 40 },
  { word: '以房养老', level: 'high', points: 45 },
  { word: '免费领', level: 'low', points: 10 },
  { word: '0元购', level: 'medium', points: 20 },
  { word: '投资返利', level: 'high', points: 40 },
  { word: '会员费', level: 'medium', points: 25 }
]

export function mockDetectFraud(video: DouyinVideo): Promise<FraudDetectResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const text = `${video.title} ${video.description} ${video.subtitle.join(' ')}`
      let score = 0
      const matched: typeof FRAUD_KEYWORDS = []
      for (const kw of FRAUD_KEYWORDS) {
        if (text.includes(kw.word)) {
          matched.push(kw)
          score += kw.points
        }
      }

      let riskLevel: FraudRiskLevel = 'safe'
      let isRisk = false
      let riskDescription = ''
      let suggestion = ''

      if (score >= 80) {
        riskLevel = 'high'; isRisk = true
        riskDescription = '检测到高度可疑的诈骗内容！该视频极可能属于刷单返利、养老理财或虚假保健品诈骗。'
        suggestion = '请立即停止观看，切勿点击任何链接或提供个人信息。如已损失钱财，请拨打 96110 报警。'
      } else if (score >= 40) {
        riskLevel = 'medium'; isRisk = true
        riskDescription = '检测到存在一定风险的内容，包含诱导消费、夸大宣传等可疑话术。'
        suggestion = '请保持警惕，不要轻易相信"高收益""特效药"等说法，有疑问先咨询子女。'
      } else if (score >= 15) {
        riskLevel = 'low'; isRisk = true
        riskDescription = '该视频存在轻微可疑关键词，请注意辨别真伪。'
        suggestion = '建议通过官方渠道核实信息，不要冲动消费或转账。'
      } else {
        riskLevel = 'safe'
        isRisk = false
        riskDescription = '暂未检测到明显的诈骗风险，内容相对安全。'
        suggestion = '保持健康的上网习惯，如遇到可疑内容请随时检测。'
      }

      resolve({
        isRisk,
        riskLevel,
        matchedKeywords: matched.map(m => m.word),
        riskDescription,
        suggestion,
        score: Math.min(score, 100)
      })
    }, 1600)
  })
}
