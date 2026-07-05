/**
 * ocr.js - OCR识别模块
 * 提供图片文字识别功能（MVP阶段使用模拟数据）
 */
const OCR = {
  /**
   * 识别图片中的文字
   * @param {string} imageData - 图片的base64数据
   * @returns {Promise<Object>} 识别结果
   */
  recognizeText(imageData) {
    return new Promise((resolve, reject) => {
      // 模拟OCR识别延迟
      setTimeout(() => {
        try {
          // MVP阶段返回模拟数据
          // 实际项目中这里应该调用真实的OCR API
          const mockResult = this._getMockResult();
          resolve(mockResult);
        } catch (error) {
          reject(error);
        }
      }, 1500); // 模拟1.5秒处理时间
    });
  },

  /**
   * 获取模拟OCR结果
   * @returns {Object} 模拟的识别结果
   * @private
   */
  _getMockResult() {
    // 模拟不同类型的医疗文档
    const mockResults = [
      {
        // 模拟门诊病历
        type: 'outpatient',
        text: '门诊病历\n\n患者：张三\n性别：男\n年龄：35岁\n\n主诉：发热、咳嗽3天\n\n现病史：患者3天前无明显诱因出现发热，体温最高38.5℃，伴咳嗽、咳痰，痰为白色粘痰，无咯血，无胸痛、呼吸困难，无恶心、呕吐。\n\n既往史：既往体健，否认高血压、糖尿病史，否认肝炎、结核病史。\n\n体格检查：T 38.2℃，P 88次/分，R 20次/分，BP 120/80mmHg\n神清，精神可，咽部充血，双侧扁桃体无肿大。双肺呼吸音粗，未闻及明显干湿性啰音。\n\n诊断：急性上呼吸道感染\n\n处理：\n1. 血常规、CRP检查\n2. 对症治疗：退热、止咳\n3. 多饮水，注意休息\n\n医师：李医生\n日期：2026-07-05',
        extractedData: {
          diagnosis: '急性上呼吸道感染',
          symptoms: '发热、咳嗽3天，体温最高38.5℃，伴咳嗽、咳痰，痰为白色粘痰',
          prescription: '血常规、CRP检查；对症治疗：退热、止咳；多饮水，注意休息',
          doctor: '李医生',
          visitDate: '2026-07-05',
          hospital: '',
          department: ''
        }
      },
      {
        // 模拟检查报告
        type: 'lab_report',
        text: '检验报告单\n\n姓名：张三\n性别：男\n年龄：35岁\n科室：内科\n\n检验项目：血常规\n\n检验结果：\n白细胞计数(WBC): 11.2×10^9/L ↑\n红细胞计数(RBC): 4.8×10^12/L\n血红蛋白(HGB): 145g/L\n血小板计数(PLT): 235×10^9/L\n中性粒细胞百分比(NEUT%): 78.5% ↑\n淋巴细胞百分比(LYMPH%): 15.2% ↓\n\n参考值范围：\nWBC: 4.0-10.0×10^9/L\nRBC: 4.0-5.5×10^12/L\nHGB: 120-160g/L\nPLT: 100-300×10^9/L\nNEUT%: 50-70%\nLYMPH%: 20-40%\n\n检验日期：2026-07-05\n报告日期：2026-07-05\n\n检验者：王技师\n审核者：张主任',
        extractedData: {
          diagnosis: '',
          symptoms: '',
          prescription: '血常规检查：白细胞计数11.2×10^9/L（偏高），中性粒细胞百分比78.5%（偏高），淋巴细胞百分比15.2%（偏低）',
          doctor: '',
          visitDate: '2026-07-05',
          hospital: '',
          department: '内科'
        }
      },
      {
        // 模拟处方单
        type: 'prescription',
        text: '处方\n\n姓名：张三\n性别：男\n年龄：35岁\n科室：内科\n诊断：急性上呼吸道感染\n\nRp:\n1. 对乙酰氨基酚片 0.5g×12片\n   用法：口服，每次1片，发热时服用，每日不超过4次\n\n2. 盐酸氨溴索片 30mg×24片\n   用法：口服，每次1片，每日3次\n\n3. 头孢克洛胶囊 0.25g×12粒\n   用法：口服，每次1粒，每日3次\n\n医师：李医生\n日期：2026-07-05',
        extractedData: {
          diagnosis: '急性上呼吸道感染',
          symptoms: '',
          prescription: '对乙酰氨基酚片0.5g×12片，口服，每次1片，发热时服用，每日不超过4次；盐酸氨溴索片30mg×24片，口服，每次1片，每日3次；头孢克洛胶囊0.25g×12粒，口服，每次1粒，每日3次',
          doctor: '李医生',
          visitDate: '2026-07-05',
          hospital: '',
          department: '内科'
        }
      }
    ];

    // 随机返回一个模拟结果
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  },

  /**
   * 将OCR结果填充到表单
   * @param {Object} extractedData - 提取的数据
   * @param {string} formType - 表单类型：'medical' 或 'treatment'
   */
  fillForm(extractedData, formType) {
    if (!extractedData) return;

    if (formType === 'medical') {
      // 填充看病记录表单
      if (extractedData.visitDate) {
        const visitDateInput = document.getElementById('visitDate');
        if (visitDateInput) visitDateInput.value = extractedData.visitDate;
      }
      if (extractedData.hospital) {
        const hospitalInput = document.getElementById('hospital');
        if (hospitalInput) hospitalInput.value = extractedData.hospital;
      }
      if (extractedData.department) {
        const departmentInput = document.getElementById('department');
        if (departmentInput) departmentInput.value = extractedData.department;
      }
      if (extractedData.doctor) {
        const doctorInput = document.getElementById('doctor');
        if (doctorInput) doctorInput.value = extractedData.doctor;
      }
      if (extractedData.diagnosis) {
        const diagnosisInput = document.getElementById('diagnosis');
        if (diagnosisInput) diagnosisInput.value = extractedData.diagnosis;
      }
      if (extractedData.symptoms) {
        const symptomsInput = document.getElementById('symptoms');
        if (symptomsInput) symptomsInput.value = extractedData.symptoms;
      }
      if (extractedData.prescription) {
        const prescriptionInput = document.getElementById('prescription');
        if (prescriptionInput) prescriptionInput.value = extractedData.prescription;
      }
    } else if (formType === 'treatment') {
      // 填充治疗记录表单
      if (extractedData.treatmentDate) {
        const treatmentDateInput = document.getElementById('treatmentDate');
        if (treatmentDateInput) treatmentDateInput.value = extractedData.treatmentDate;
      }
      if (extractedData.treatmentContent) {
        const treatmentContentInput = document.getElementById('treatmentContent');
        if (treatmentContentInput) treatmentContentInput.value = extractedData.treatmentContent;
      }
      if (extractedData.duration) {
        const durationInput = document.getElementById('duration');
        if (durationInput) durationInput.value = extractedData.duration;
      }
      if (extractedData.effect) {
        const effectInput = document.getElementById('effect');
        if (effectInput) effectInput.value = extractedData.effect;
      }
    }
  }
};
