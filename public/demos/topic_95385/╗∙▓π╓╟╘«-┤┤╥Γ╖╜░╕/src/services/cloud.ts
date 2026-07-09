export function callFunction(name: string, data?: any): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockResponse(name, data))
    }, 500)
  })
}

function mockResponse(name: string, data?: any): any {
  switch (name) {
    case 'getPolicies':
      return {
        policies: [
          { id: '1', title: '城乡居民养老保险政策解读', category: '社保', createTime: '2024-01-15', summary: '详细解读城乡居民养老保险的参保条件、缴费标准、待遇领取等内容', tags: ['养老保险', '城乡居民'], views: 1280 },
          { id: '2', title: '就业援助政策实施细则', category: '就业', createTime: '2024-01-12', summary: '明确就业困难人员认定标准、援助措施、补贴政策等', tags: ['就业援助', '困难人员'], views: 856 },
          { id: '3', title: '义务教育学生资助管理办法', category: '教育', createTime: '2024-01-10', summary: '规范义务教育阶段学生资助工作，保障家庭经济困难学生接受教育', tags: ['教育资助', '义务教育'], views: 2134 },
          { id: '4', title: '农村危房改造补助政策', category: '住房', createTime: '2024-01-08', summary: '农村危房改造的申请条件、补助标准、审批流程', tags: ['危房改造', '农村'], views: 1567 },
          { id: '5', title: '农业支持保护补贴政策', category: '农业', createTime: '2024-01-05', summary: '农业支持保护补贴的发放对象、标准和方式', tags: ['农业补贴', '三农'], views: 987 },
          { id: '6', title: '城乡低保申请条件及流程', category: '民政', createTime: '2024-01-03', summary: '城乡居民最低生活保障制度的申请条件、审核流程、保障标准', tags: ['低保', '民政'], views: 3421 }
        ],
        total: 50
      }
    case 'getPolicyDetail':
      const policyDetails: Record<string, any> = {
        '1': {
          id: '1',
          title: '城乡居民养老保险政策解读',
          category: '社保',
          createTime: '2024-01-15',
          content: `## 一、参保条件

凡年满16周岁（不含在校学生），非国家机关和事业单位工作人员及不属于职工基本养老保险制度覆盖范围的城乡居民，可以在户籍地参加城乡居民养老保险。

## 二、缴费标准

城乡居民养老保险缴费标准设为每年200元、300元、400元、500元、600元、700元、800元、900元、1000元、1500元、2000元、3000元12个档次。参保人员自主选择缴费档次，多缴多得。

## 三、待遇领取

### 领取条件
1. 年满60周岁
2. 累计缴费满15年
3. 未领取国家规定的基本养老保障待遇

### 待遇计算
月养老金=基础养老金+个人账户养老金

基础养老金由中央和地方政府确定标准并全额支付给符合条件的参保人。

个人账户养老金=个人账户全部储存额÷139

## 四、政府补贴

政府对参保人员缴费给予补贴，补贴标准不低于每人每年30元。对选择较高档次标准缴费的，适当增加补贴金额。`,
          tags: ['养老保险', '城乡居民'],
          views: 1280
        },
        '2': {
          id: '2',
          title: '就业援助政策实施细则',
          category: '就业',
          createTime: '2024-01-12',
          content: `## 一、就业困难人员认定

就业困难人员包括：
1. 大龄失业人员（女性年满40周岁、男性年满50周岁）
2. 残疾人
3. 零就业家庭成员
4. 失地农民
5. 农村低保家庭成员

## 二、援助措施

### 岗位补贴
对吸纳就业困难人员的用人单位给予岗位补贴，补贴标准为当地最低工资标准的50%。

### 社保补贴
对用人单位和灵活就业的就业困难人员给予社会保险补贴。

### 职业培训补贴
对就业困难人员参加职业技能培训的，给予培训补贴。

## 三、申请流程

1. 个人申请
2. 社区初审
3. 街道审核
4. 公示认定`,
          tags: ['就业援助', '困难人员'],
          views: 856
        }
      }
      return { policy: policyDetails[data?.id] || policyDetails['1'] }
    case 'createQARecord':
      return {
        record: {
          question: data?.question || '',
          answer: generateAIAnswer(data?.question || '')
        }
      }
    case 'getQARecords':
      return {
        records: [
          { question: '城乡居民养老保险怎么办理？', answer: '城乡居民养老保险可以在户籍地的社区服务中心或乡镇社保所办理，需要携带身份证、户口本和照片。', createTime: '2024-01-14' }
        ]
      }
    case 'getFavorites':
      return {
        favorites: [
          { id: 'f1', policyId: '1', policy: { title: '城乡居民养老保险政策解读', createTime: '2024-01-15' } },
          { id: 'f2', policyId: '3', policy: { title: '义务教育学生资助管理办法', createTime: '2024-01-10' } }
        ]
      }
    case 'login':
      return {
        userInfo: {
          nickname: '基层工作者',
          role: 'community'
        }
      }
    default:
      return {}
  }
}

function generateAIAnswer(question: string): string {
  const questionLower = question.toLowerCase()
  
  if (questionLower.includes('养老') || questionLower.includes('社保')) {
    return '城乡居民养老保险可以在户籍地的社区服务中心或乡镇社保所办理。需要携带身份证、户口本和一寸照片2张。目前缴费标准设为每年200元至3000元共12个档次，多缴多得。年满60周岁、累计缴费满15年即可领取养老金。'
  }
  
  if (questionLower.includes('就业') || questionLower.includes('工作')) {
    return '就业援助政策面向就业困难人员，包括大龄失业人员、残疾人、零就业家庭成员等。符合条件的人员可以享受岗位补贴、社保补贴和职业培训补贴。申请需向当地公共就业服务机构提出。'
  }
  
  if (questionLower.includes('教育') || questionLower.includes('学生') || questionLower.includes('资助')) {
    return '义务教育学生资助包括免学杂费、免教科书费和生活补助。家庭经济困难的学生可以向学校提出申请，经过审核公示后即可享受相应资助政策。'
  }
  
  if (questionLower.includes('危房') || questionLower.includes('住房') || questionLower.includes('改造')) {
    return '农村危房改造补助政策面向农村低保户、五保户等困难群体。申请人需向村委会提出书面申请，经过民主评议、审核公示后组织实施。补助标准根据危房等级确定。'
  }
  
  if (questionLower.includes('低保') || questionLower.includes('救助')) {
    return '城乡低保申请需满足家庭人均收入低于当地最低生活保障标准。申请流程：个人向社区提出申请→社区初审→街道审核→公示→审批。保障金按月发放。'
  }
  
  if (questionLower.includes('农业') || questionLower.includes('补贴') || questionLower.includes('三农')) {
    return '农业支持保护补贴包括耕地地力保护补贴和适度规模经营补贴。补贴对象为拥有耕地承包经营权的种地农民。补贴资金通过一卡通发放。'
  }
  
  if (questionLower.includes('医疗') || questionLower.includes('医保')) {
    return '城乡居民医疗保险每年集中参保缴费，缴费时间一般为每年9月至12月。参保后可以享受门诊和住院医疗费用报销。特殊人群可以享受政府资助参保政策。'
  }
  
  if (questionLower.includes('办理') || questionLower.includes('流程') || questionLower.includes('怎么')) {
    return '您可以在"办事指引"页面查看详细的办事流程和所需材料。如果找不到您需要的内容，请告诉我具体想办理什么业务，我来帮您解答。'
  }
  
  return '感谢您的咨询！关于基层服务相关的政策问题，您可以在政策库中搜索相关文件，或在办事指引中查看详细流程。如果您有具体问题，欢迎继续提问！'
}