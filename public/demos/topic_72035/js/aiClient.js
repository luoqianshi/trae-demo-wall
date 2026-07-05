// ============================================
// AI Client — LLM API wrapper + Prompt engineering
// ============================================

const AIClient = {
  _client: null,
  _config: null,

  // Load config from DB and create client
  async _ensureClient() {
    if (this._config) return this._client;

    this._config = await DB.getConfig();

    if (!this._config.apiKey) {
      throw new Error('请先在「设置」中配置大模型 API Key');
    }

    this._client = {
      baseUrl: this._config.apiBaseUrl.replace(/\/$/, ''),
      apiKey: this._config.apiKey,
      model: this._config.modelName,
      maxTokens: this._config.maxTokens || 4096,
      temperature: this._config.temperature || 0.3,
    };

    return this._client;
  },

  // Reset client (called when config changes)
  reset() {
    this._client = null;
    this._config = null;
  },

  // Core: call chat completion API
  async chat(messages, options = {}) {
    const client = await this._ensureClient();

    const body = {
      model: options.model || client.model,
      messages,
      max_tokens: options.maxTokens || client.maxTokens,
      temperature: options.temperature ?? client.temperature,
    };

    // Some providers support JSON mode
    if (options.jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    let response;
    try {
      response = await fetch(`${client.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${client.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new Error(`网络请求失败：${err.message}（请检查网络连接或 API 地址）`);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      let errMsg = `API 错误 (${response.status})`;

      if (response.status === 401) {
        errMsg = 'API Key 无效或已过期，请检查设置';
      } else if (response.status === 429) {
        errMsg = '请求频率过高，请稍后重试';
      } else if (response.status === 400 && errText.includes('token')) {
        errMsg = '输入内容过长，请精简简历文本后重试';
      } else if (errText) {
        try {
          const errJson = JSON.parse(errText);
          errMsg = `${errMsg}：${errJson.error?.message || errJson.msg || errText.substring(0, 100)}`;
        } catch {
          errMsg = `${errMsg}：${errText.substring(0, 100)}`;
        }
      }

      throw new Error(errMsg);
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('API 返回为空，请重试');
    }

    return data.choices[0].message.content;
  },

  // ============================================
  // Extract structured info from resume text
  // ============================================
  async extractResume(resumeText, onProgress) {
    if (onProgress) onProgress({ message: 'AI 正在分析简历内容...' });

    // Truncate if too long (keep first 6000 chars)
    const truncated = resumeText.length > 6000
      ? resumeText.substring(0, 6000) + '\n...（内容已截断）'
      : resumeText;

    const prompt = `你是一位专业的 HR 简历解析助手。请从以下简历文本中提取结构化信息，并以 JSON 格式返回。

简历文本：
"""
${truncated}
"""

请提取以下字段（如无法确定则设为 null 或空数组），返回严格的 JSON：
{
  "name": "姓名",
  "phone": "手机号",
  "email": "邮箱",
  "education": [
    {
      "school": "学校名称",
      "major": "专业",
      "degree": "学历层次：本科/硕士/博士/大专",
      "graduationYear": "毕业年份，如 2027"
    }
  ],
  "skills": ["技能1", "技能2"],
  "projects": [
    {
      "name": "项目名称",
      "description": "项目简述",
      "techStack": ["技术1", "技术2"]
    }
  ],
  "internships": [
    {
      "company": "实习公司",
      "position": "实习岗位",
      "duration": "时间段",
      "description": "简述"
    }
  ],
  "expectedPositions": ["期望岗位1"],
  "expectedCities": ["期望城市1"],
  "expectedSalary": "期望薪资，如 25-35w"
}

注意：
1. 只返回 JSON 对象，不要包含 markdown 代码块标记或任何解释文字
2. 确保 JSON 格式合法，可直接被 JSON.parse 解析
3. 如果简历文本非中文，请用中文输出提取结果
4. 技能和期望岗位要尽量具体（如 "Python"、"数据分析"、"Java后端"）`;

    const raw = await this.chat([
      { role: 'system', content: '你是一位专业的 HR 简历解析助手，只返回 JSON 格式数据。' },
      { role: 'user', content: prompt },
    ], { temperature: 0.1, jsonMode: true });

    return this._parseJSON(raw);
  },

  // ============================================
  // Match resume against a batch of jobs
  // ============================================
  async matchJobs(resumeInfo, userPreferences, jobs, onProgress) {
    if (!jobs || jobs.length === 0) return [];

    if (onProgress) onProgress({ message: `AI 正在评估 ${jobs.length} 个岗位的匹配度...` });

    // Build resume summary (compact to save tokens)
    const resumeSummary = this._buildResumeSummary(resumeInfo);
    const prefSummary = this._buildPreferenceSummary(userPreferences);
    const jobsSummary = jobs.map((j, i) =>
      `${i + 1}. 公司：${j.companyName} | 类型：${j.companyType || '未知'} | 行业：${j.industry || '未知'} | 岗位：${j.positionName || '未知'} | 地点：${j.location || '未知'} | 专业要求：${j.majorRequirement || '未明确'} | 笔试：${j.examInfo || '未知'}`
    ).join('\n');

    const prompt = `你是一位资深校招顾问，正在帮一位应届毕业生匹配最合适的校招岗位。

【求职者简历信息】
${resumeSummary}

【求职者偏好条件】
${prefSummary}

【待评估的岗位列表】
${jobsSummary}

请认真分析每个岗位与求职者的匹配程度。评估时请严格按以下维度打分，并对不同岗位给出有区分度的分数（不要所有岗位都给相似的分数）：

1. 专业对口度（30%）：岗位所需专业与求职者专业/研究方向是否对口。完全对口给满分，相关给中等分，不相关给低分。
2. 技能匹配度（30%）：岗位所需技能与求职者掌握技能的重合度。技能高度重合给满分，部分匹配给中等分，不匹配给低分。
3. 地域偏好（20%）：岗位地点是否在求职者期望城市/偏好城市中。完全匹配给满分，不匹配给低分。
4. 企业类型偏好（10%）：企业类型是否符合求职者偏好的企业类型。
5. 整体适配度（10%）：综合考量求职者的发展方向、实习经历与岗位的契合度。

重要要求：
- 分数要有区分度！不要所有岗位都给 70-80 分。真正匹配的岗位给 85+，一般匹配的给 60-75，不匹配的给 40-55。
- matchReason 要具体说明匹配或不匹配的原因，如"专业对口（计算机科学），技能高度匹配（Python/SQL），北京在期望城市中" 或 "专业不完全对口（岗位需要电子工程），技能匹配度低"
- 仔细阅读每个岗位的具体信息，不要笼统评估

返回严格的 JSON 数组（不要包含 markdown 标记）：
[
  {
    "index": 1,
    "companyName": "公司名称",
    "positionName": "岗位名称",
    "matchScore": 0到100的整数,
    "starRating": 1到5的整数,
    "matchReason": "50字以内的具体匹配理由"
  }
]

matchScore 与 starRating 对应：90-100→5星, 80-89→4星, 65-79→3星, 50-64→2星, <50→1星
请确保返回的数组长度与岗位列表数量一致。只返回 JSON，不要任何解释。`;

    const raw = await this.chat([
      { role: 'system', content: '你是一位资深校招顾问，擅长精准匹配求职者与岗位。你给出的评分有高度区分度，不会所有岗位都给相似分数。只返回 JSON 格式数据。' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3, jsonMode: false, maxTokens: 4096 });

    const results = this._parseJSON(raw);

    // Ensure it's an array
    if (!Array.isArray(results)) {
      throw new Error('AI 返回格式异常，请重试');
    }

    // Map results back to job IDs
    return results.map((r) => {
      const job = jobs[r.index - 1] || jobs.find(j => j.companyName === r.companyName);
      return {
        id: job ? job.id : null,
        companyName: r.companyName,
        positionName: r.positionName,
        matchScore: Math.max(0, Math.min(100, parseInt(r.matchScore) || 0)),
        starRating: Math.max(1, Math.min(5, parseInt(r.starRating) || 1)),
        matchReason: r.matchReason || '',
      };
    }).filter(r => r.id);
  },

  // ============================================
  // Search company intelligence (salary, reviews, interview)
  // ============================================
  async searchCompanyIntel(companyName, positionName, onProgress) {
    if (onProgress) onProgress({ message: `正在搜索 ${companyName} 的企业情报...` });

    const prompt = `你是一位资深校招信息分析师，请提供关于「${companyName}」公司「${positionName}」岗位的详细校招情报。

请尽可能详细地回答以下各方面，基于你所知的公开信息（如脉脉、牛客网、知乎、OfferShow、看准网、Boss直聘等平台的公开讨论和数据）：

【薪资待遇】
- 校招年薪范围（总包，包含基本工资+奖金+股票/期权+签字费等），如 25-35w/年
- 薪资构成明细（基本工资占比、年终奖月数、股票归属周期等）
- 与同行业相比的水平（偏高/中等/偏低）
- 不同学历的薪资差异（如硕士 vs 本科）

【网友评价】（至少提供 3-5 条，涵盖正面和负面）
- 工作强度和加班情况（如是否 996、加班频率）
- 团队氛围和管理风格
- 技术成长和晋升空间
- 福利待遇（餐补、住房、保险等）
- 稳定性和裁员风险

【面试经验】（至少提供 2-3 条）
- 面试流程（几轮、每轮形式）
- 常考知识点和题型
- 面试难度评价
- 面试到 offer 的周期

【企业概况】
- 企业规模（员工数、营收量级）
- 主营业务和行业地位
- 近年发展状况（融资/上市/扩张/收缩）
- 校招 HC 规模（大致招聘人数）

请以 JSON 格式返回，结构如下：
{
  "salaryInfo": {
    "range": "年薪总包范围，如 25-35w",
    "details": "薪资构成详细说明（基本工资、年终奖、股票等）",
    "comparison": "与同行业相比的水平",
    "educationDiff": "不同学历的薪资差异",
    "source": "信息来源",
    "updatedAt": "信息大致时间"
  },
  "reviews": [
    {
      "source": "信息来源平台，如 脉脉/牛客/知乎",
      "content": "详细的评价内容（100字以内）",
      "sentiment": "positive 或 neutral 或 negative",
      "tags": ["标签，如 加班多、氛围好、薪资高、晋升快"]
    }
  ],
  "interviewExperiences": [
    {
      "source": "来源平台",
      "summary": "面试流程和体验详细描述",
      "difficulty": "简单 或 中等 或 困难",
      "duration": "面试到offer的周期"
    }
  ],
  "companyOverview": {
    "scale": "企业规模",
    "business": "主营业务和行业地位",
    "development": "近年发展状况",
    "hcScale": "校招HC规模"
  }
}

要求：
1. 只返回 JSON，不要包含任何 markdown 标记或解释文字
2. 信息要具体、详细，不要泛泛而谈。例如薪资要给出具体数字，评价要描述具体现象
3. 如确实不了解某项信息，设为 null，不要编造
4. 评价要客观，同时涵盖优点和缺点
5. 如果该公司不是知名企业，可以基于其行业、规模、地区给出同类企业的参考信息，并标注"基于同行业参考"`;

    const raw = await this.chat([
      { role: 'system', content: '你是一位资深校招信息分析师，精通互联网、金融、制造业等各行业校招薪资和评价。你提供的信息详细具体、数据准确、客观全面。只返回 JSON 格式数据。' },
      { role: 'user', content: prompt },
    ], { temperature: 0.4, jsonMode: true, maxTokens: 4096 });

    return this._parseJSON(raw);
  },

  // ============================================
  // Helpers
  // ============================================

  _buildResumeSummary(info) {
    const parts = [];

    if (info.name) parts.push(`姓名：${info.name}`);

    if (info.education && info.education.length > 0) {
      const edu = info.education.map(e =>
        `${e.school} ${e.major} ${e.degree} ${e.graduationYear || ''}`
      ).join('；');
      parts.push(`学历：${edu}`);
    }

    if (info.skills && info.skills.length > 0) {
      parts.push(`技能：${info.skills.join('、')}`);
    }

    if (info.projects && info.projects.length > 0) {
      const proj = info.projects.map(p =>
        `${p.name}（${(p.techStack || []).join('/')})`
      ).join('；');
      parts.push(`项目：${proj}`);
    }

    if (info.internships && info.internships.length > 0) {
      const intern = info.internships.map(i =>
        `${i.company} ${i.position}`
      ).join('；');
      parts.push(`实习：${intern}`);
    }

    if (info.expectedPositions && info.expectedPositions.length > 0) {
      parts.push(`期望岗位：${info.expectedPositions.join('、')}`);
    }

    if (info.expectedCities && info.expectedCities.length > 0) {
      parts.push(`期望城市：${info.expectedCities.join('、')}`);
    }

    return parts.join('\n');
  },

  _buildPreferenceSummary(pref) {
    if (!pref) return '无特殊偏好';
    const parts = [];
    if (pref.preferredCompanyTypes && pref.preferredCompanyTypes.length > 0) {
      parts.push(`偏好企业类型：${pref.preferredCompanyTypes.join('、')}`);
    }
    if (pref.preferredCities && pref.preferredCities.length > 0) {
      parts.push(`偏好城市：${pref.preferredCities.join('、')}`);
    }
    if (pref.preferredIndustries && pref.preferredIndustries.length > 0) {
      parts.push(`偏好行业：${pref.preferredIndustries.join('、')}`);
    }
    if (pref.minSalary) {
      parts.push(`最低期望薪资：${pref.minSalary}w`);
    }
    if (pref.avoidOvertime) {
      parts.push('排斥高强度加班');
    }
    if (pref.otherRequirements) {
      parts.push(`其他要求：${pref.otherRequirements}`);
    }
    return parts.length > 0 ? parts.join('\n') : '无特殊偏好';
  },

  // Robust JSON parsing — handles markdown code blocks, extra text
  _parseJSON(raw) {
    if (!raw) throw new Error('AI 返回为空');

    let text = raw.trim();

    // Remove markdown code block wrappers
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      text = codeBlockMatch[1].trim();
    }

    // Try direct parse
    try {
      return JSON.parse(text);
    } catch (e1) {
      // Try to find JSON object or array in text
      const objMatch = text.match(/\{[\s\S]*\}/);
      const arrMatch = text.match(/\[[\s\S]*\]/);

      if (arrMatch) {
        try {
          return JSON.parse(arrMatch[0]);
        } catch {}
      }

      if (objMatch) {
        try {
          return JSON.parse(objMatch[0]);
        } catch {}
      }

      // Last resort: try to fix common issues
      try {
        // Remove trailing commas
        const fixed = text.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(fixed);
      } catch (e2) {
        throw new Error('AI 返回的 JSON 格式无法解析，请重试');
      }
    }
  },
};
