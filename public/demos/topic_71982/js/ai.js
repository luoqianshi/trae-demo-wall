/**
 * ai.js - AI智能整理模块
 * 使用DeepSeek API进行医疗文本解析
 */
const AI = {
  // DeepSeek API配置
  // TODO: 请将以下配置替换为你的真实API密钥
  API_KEY: 'sk-69a1ab4bee0d4815bf6a8963864269ec',
  BASE_URL: 'https://api.deepseek.com/v1/chat/completions',
  MODEL: 'deepseek-chat',

  /**
   * 调用DeepSeek API解析医疗文本
   * @param {string} text - 用户输入的医疗描述文本
   * @returns {Promise<Object>} 解析后的结构化数据
   */
  async organizeMedicalRecord(text) {
    if (!text || !text.trim()) {
      return this.getEmptyResult();
    }

    // 检查API配置
    if (this.API_KEY === 'YOUR_DEEPSEEK_API_KEY') {
      console.warn('DeepSeek API未配置，使用正则表达式解析');
      return this._regexParse(text);
    }

    try {
      const systemPrompt = '你是一个医疗信息整理助手。你的任务是将用户的医疗描述文本解析为结构化JSON数据。请严格按照指定的JSON格式返回，只返回JSON，不要有任何其他内容。';

      const userPrompt = `请将以下医疗描述文本解析为结构化数据：

${text}

请按照以下JSON格式返回解析结果，只返回JSON，不要有其他内容：
{
  "visitDate": "就诊日期，格式YYYY-MM-DD，如果无法识别则为空字符串",
  "hospital": "医院名称，如果无法识别则为空字符串",
  "department": "科室名称，如果无法识别则为空字符串",
  "doctor": "医生姓名，如果无法识别则为空字符串",
  "diagnosis": "诊断结果，如果无法识别则为空字符串",
  "symptoms": "症状描述，如果无法识别则为空字符串",
  "prescription": "处方/用药信息，如果无法识别则为空字符串",
  "cost": "费用金额（数字），如果无法识别则为空字符串",
  "notes": "备注/医嘱信息，如果无法识别则为空字符串"
}`;

      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'API调用失败');
      }

      // 解析返回的JSON
      const resultText = data.choices[0].message.content;
      let result;

      try {
        result = JSON.parse(resultText);
      } catch (e) {
        // 如果解析失败，尝试提取JSON部分
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('无法解析AI返回结果');
        }
      }

      return {
        visitDate: result.visitDate || '',
        hospital: result.hospital || '',
        department: result.department || '',
        doctor: result.doctor || '',
        diagnosis: result.diagnosis || '',
        symptoms: result.symptoms || '',
        prescription: result.prescription || '',
        cost: result.cost || '',
        notes: result.notes || ''
      };

    } catch (error) {
      console.error('DeepSeek AI解析失败:', error);
      // 降级到正则表达式解析
      return this._regexParse(text);
    }
  },

  /**
   * 正则表达式解析（降级方案）
   * @param {string} text - 输入文本
   * @returns {Object} 解析结果
   * @private
   */
  _regexParse(text) {
    const result = this.getEmptyResult();
    const trimmed = text.trim();

    // 提取日期
    const datePattern1 = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
    const dateMatch1 = trimmed.match(datePattern1);
    if (dateMatch1) {
      result.visitDate = dateMatch1[1].replace(/\//g, '-');
    }

    if (!result.visitDate) {
      const datePattern2 = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
      const dateMatch2 = trimmed.match(datePattern2);
      if (dateMatch2) {
        const month = dateMatch2[2].padStart(2, '0');
        const day = dateMatch2[3].padStart(2, '0');
        result.visitDate = `${dateMatch2[1]}-${month}-${day}`;
      }
    }

    // 提取医院
    const hospitalPattern = /([^\s,，。.！!？?；;、]{2,10}(?:医院|诊所|卫生中心|卫生院|门诊部|中心))/;
    const hospitalMatch = trimmed.match(hospitalPattern);
    if (hospitalMatch) {
      result.hospital = hospitalMatch[1];
    }

    // 提取科室
    const deptPattern = /([\u4e00-\u9fa5]{1,4}(?:内科|外科|儿科|妇科|产科|骨科|眼科|耳鼻喉科|口腔科|皮肤科|神经科|精神科|肿瘤科|急诊科|中医科|康复科|泌尿科|心血管科|呼吸科|消化科|内分泌科|血液科|风湿免疫科|感染科|肝胆科|肾内科|普外科|心外科|胸外科|神经外科|整形外科|肛肠科))/;
    const deptMatch = trimmed.match(deptPattern);
    if (deptMatch) {
      result.department = deptMatch[1];
    }

    // 提取医生
    const doctorPattern = /([\u4e00-\u9fa5]{2,4}(?:医生|主任|大夫|教授|医师))/;
    const doctorMatch = trimmed.match(doctorPattern);
    if (doctorMatch) {
      result.doctor = doctorMatch[1].replace(/(医生|主任|大夫|教授|医师)$/, '');
    }

    // 提取诊断
    const diagPattern1 = /诊断(?:为|：|:)\s*([^\s,，。.]+?)(?:[，,。.！!]|$)/;
    const diagMatch1 = trimmed.match(diagPattern1);
    if (diagMatch1) {
      result.diagnosis = diagMatch1[1].trim();
    }

    if (!result.diagnosis) {
      const diagPattern2 = /患(?:有|了)([^\s,，。.！!？?]+?)(?:[，,。.！!？?\s]|$)/;
      const diagMatch2 = trimmed.match(diagPattern2);
      if (diagMatch2) {
        result.diagnosis = diagMatch2[1].trim();
      }
    }

    // 提取症状
    const symptomPattern1 = /症状(?:为|：|:)\s*([^\s,，。.]+?)(?:[，,。.！!]|$)/;
    const symptomMatch1 = trimmed.match(symptomPattern1);
    if (symptomMatch1) {
      result.symptoms = symptomMatch1[1].trim();
    }

    if (!result.symptoms) {
      const symptomPattern2 = /(?:主要)?表现(?:为|：|:)\s*([^\s,，。.]+?)(?:[，,。.！!]|$)/;
      const symptomMatch2 = trimmed.match(symptomPattern2);
      if (symptomMatch2) {
        result.symptoms = symptomMatch2[1].trim();
      }
    }

    // 提取处方
    const rxPattern1 = /(?:开药|处方|用药|服用|药方)(?:为|：|:)?\s*([^\s,，。.！!？?]+?)(?:[，,。.！!？?\s]|$)/;
    const rxMatch1 = trimmed.match(rxPattern1);
    if (rxMatch1) {
      result.prescription = rxMatch1[1].trim();
    }

    if (!result.prescription) {
      const rxPattern2 = /(?:处方|用药)(?:为|：|:)\s*([^\n]+?)(?:\n|$)/;
      const rxMatch2 = trimmed.match(rxPattern2);
      if (rxMatch2) {
        result.prescription = rxMatch2[1].trim();
      }
    }

    // 提取费用
    const costPattern1 = /(?:费用|花费|金额|总共|共计)(?:为|：|:)?\s*(\d+(?:\.\d{1,2})?)\s*(?:元|块)/;
    const costMatch1 = trimmed.match(costPattern1);
    if (costMatch1) {
      result.cost = parseFloat(costMatch1[1]);
    }

    if (result.cost === '') {
      const costPattern2 = /(\d+(?:\.\d{1,2})?)\s*元/;
      const costMatch2 = trimmed.match(costPattern2);
      if (costMatch2) {
        result.cost = parseFloat(costMatch2[1]);
      }
    }

    // 提取备注
    const notesPattern = /(?:备注|注意|医嘱|嘱咐)(?:为|：|:)?\s*([^\n]+?)(?:\n|$)/;
    const notesMatch = trimmed.match(notesPattern);
    if (notesMatch) {
      result.notes = notesMatch[1].trim();
    }

    return result;
  },

  /**
   * 获取空结果对象
   * @returns {Object} 空结果
   */
  getEmptyResult() {
    return {
      visitDate: '',
      hospital: '',
      department: '',
      doctor: '',
      diagnosis: '',
      symptoms: '',
      prescription: '',
      cost: '',
      notes: ''
    };
  }
};
