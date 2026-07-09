export default function createQARecord(params: { question: string }) {
  const mockAnswers: Record<string, string> = {
    '社保': '您好！关于社保相关问题，您可以关注"城乡居民基本养老保险政策"，基础养老金标准已提高至每人每月200元。',
    '就业': '您好！就业援助月活动正在开展，您可以前往当地就业服务中心咨询，或关注我们的政策库获取最新招聘信息。',
    '教育': '您好！义务教育阶段家庭经济困难学生可申请资助，寄宿生小学每生每年1000元，初中每生每年1250元。',
    '医疗': '您好！关于医疗保障问题，您可以查看"城乡居民医保政策"相关内容，了解报销比例和缴费标准。',
    '住房': '您好！农村危房改造正在进行中，C级危房每户补助1.5万元，D级危房每户补助3万元。',
    '补贴': '您好！农业支持保护补贴标准为每亩不低于120元，通过"一卡通"直接发放到补贴对象手中。'
  }
  
  let answer = '您好！感谢您的咨询。我正在为您查询相关政策信息，请稍候...\n\n根据您的问题，建议您查看政策库中的相关内容，或直接联系当地政务服务中心获取更详细的解答。'
  
  for (const [key, value] of Object.entries(mockAnswers)) {
    if (params.question.includes(key)) {
      answer = value
      break
    }
  }
  
  return {
    record: {
      id: 'qa_' + Date.now(),
      question: params.question,
      answer,
      createTime: new Date().toISOString()
    }
  }
}