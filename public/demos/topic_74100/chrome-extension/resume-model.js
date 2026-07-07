/**
 * 简历数据模型 & 字段定义
 * 统一管理所有简历字段、下拉选项valueMap、以及多模板profile
 */

// ============================================================
// 一、完整字段定义（含扩展字段）
// ============================================================

const RESUME_FIELDS = {
  // ---- 个人基础信息 ----
  name:            { label: '姓名',           category: 'basic',      type: 'text' },
  gender:          { label: '性别',           category: 'basic',      type: 'select',
    options: ['男', '女'] },
  birth:           { label: '出生年月',       category: 'basic',      type: 'month' },
  age:             { label: '年龄',           category: 'basic',      type: 'text' },
  birthplace:      { label: '出生地',         category: 'basic',      type: 'text' },
  ethnicity:       { label: '民族',           category: 'basic',      type: 'select',
    options: ['汉族', '蒙古族', '回族', '藏族', '维吾尔族', '苗族', '彝族', '壮族', '其他'] },
  height:          { label: '身高(cm)',       category: 'basic',      type: 'text' },
  weight:          { label: '体重(kg)',       category: 'basic',      type: 'text' },
  marital_status:  { label: '婚姻状况',       category: 'basic',      type: 'select',
    options: ['未婚', '已婚', '离异', '丧偶'] },
  phone:           { label: '手机号码',       category: 'basic',      type: 'tel' },
  email:           { label: '电子邮箱',       category: 'basic',      type: 'email' },

  // ---- 身份证件 ----
  id_type:         { label: '证件类型',       category: 'id',         type: 'select',
    options: ['身份证', '护照', '港澳居民来往内地通行证', '台湾居民来往大陆通行证', '其他'] },
  id_number:       { label: '身份证号码',     category: 'id',         type: 'text' },

  // ---- 政治面貌 ----
  political_status:{ label: '政治面貌',       category: 'political',  type: 'select',
    options: ['中共党员', '中共预备党员', '共青团员', '群众', '民主党派'] },
  party_join_date: { label: '入党/团时间',    category: 'political',  type: 'month' },

  // ---- 籍贯/生源/户口 ----
  native_place:    { label: '籍贯',           category: 'origin',     type: 'text' },
  student_source:  { label: '生源地',         category: 'origin',     type: 'text' },
  hukou_location:  { label: '户口所在地',     category: 'origin',     type: 'text' },
  hukou_type:      { label: '户口类型',       category: 'origin',     type: 'select',
    options: ['农业户口', '非农业户口', '居民户口'] },

  // ---- 居住信息 ----
  location:        { label: '现居城市',       category: 'residence',  type: 'text' },
  current_residence:{ label: '目前居住地',    category: 'residence',  type: 'text' },
  mailing_address: { label: '通信地址',       category: 'residence',  type: 'textarea' },

  // ---- 求职意向 ----
  target_city:     { label: '目标城市',       category: 'job_intent', type: 'text' },
  expected_salary: { label: '期望薪资',       category: 'job_intent', type: 'text' },
  job_status:      { label: '求职状态',       category: 'job_intent', type: 'select',
    options: ['在校生', '应届生', '在职-暂不离职', '在职-考虑机会', '已离职-随时到岗'] },
  available_date:  { label: '到岗时间',       category: 'job_intent', type: 'select',
    options: ['随时到岗', '一周内', '两周内', '一个月内', '待定'] },

  // ---- 紧急联系人 ----
  emergency_contact:       { label: '紧急联系人',       category: 'emergency',  type: 'text' },
  emergency_phone:         { label: '紧急联系方式',     category: 'emergency',  type: 'tel' },
  emergency_relationship:  { label: '紧急联系人关系',   category: 'emergency',  type: 'select',
    options: ['父亲', '母亲', '配偶', '兄弟姐妹', '子女', '朋友', '其他'] },

  // ---- 教育经历 ----
  school:          { label: '学校',           category: 'education',  type: 'text' },
  degree:          { label: '学历',           category: 'education',  type: 'select',
    options: ['博士', '硕士', '本科', '大专', '高中', '其他'] },
  major:           { label: '专业',           category: 'education',  type: 'text' },
  graduation:      { label: '毕业时间',       category: 'education',  type: 'month' },
  gpa:             { label: 'GPA',            category: 'education',  type: 'text' },
  class_rank:      { label: '成绩排名',       category: 'education',  type: 'select',
    options: ['前20%', '前30%', '前50%', '其他'] },
  english_level:   { label: '英语等级',       category: 'education',  type: 'select',
    options: ['CET-4', 'CET-6', 'TEM-4', 'TEM-8', 'IELTS', 'TOEFL', '无'] },
  study_mode:      { label: '学习形式',       category: 'education',  type: 'select',
    options: ['全日制', '非全日制', '成人高考', '自考', '网络教育', '开放大学'] },
  school_country:  { label: '学校国别',       category: 'education',  type: 'select',
    options: ['中国大陆', '中国香港', '中国澳门', '中国台湾', '美国', '英国', '澳大利亚', '加拿大'] },
  is_211:          { label: '是否211院校',    category: 'education',  type: 'radio',
    options: ['是', '否'] },
  is_985:          { label: '是否985院校',    category: 'education',  type: 'radio',
    options: ['是', '否'] },
  is_key_university:{ label: '是否重点大学',   category: 'education',  type: 'radio',
    options: ['是', '否'] },
  has_internship:  { label: '是否有实习',     category: 'education',  type: 'radio',
    options: ['有', '无'] },
  courses:         { label: '主修课程',       category: 'education',  type: 'textarea' },

  // ---- 实习经历 ----
  intern_company:   { label: '实习公司',      category: 'internship', type: 'text' },
  intern_position:  { label: '实习职位',      category: 'internship', type: 'text' },
  intern_duration:  { label: '实习时间',      category: 'internship', type: 'text' },
  intern_desc:      { label: '实习描述',      category: 'internship', type: 'textarea' },

  // ---- 项目经历 ----
  project_name:     { label: '项目名称',      category: 'project',    type: 'text' },
  project_role:     { label: '项目角色',      category: 'project',    type: 'text' },
  project_duration: { label: '项目时间',      category: 'project',    type: 'text' },
  project_desc:     { label: '项目描述',      category: 'project',    type: 'textarea' },

  // ---- 校园实践/荣誉 ----
  campus_activities:{ label: '校内活动/社会实践', category: 'campus', type: 'textarea' },
  awards_honors:    { label: '奖励荣誉',      category: 'campus',     type: 'textarea' },

  // ---- 家庭情况 ----
  family_info:      { label: '家庭情况',      category: 'family',     type: 'textarea' },

  // ---- 技能/证书 ----
  skills:           { label: '专业技能',      category: 'skills',     type: 'textarea' },
  languages:        { label: '语言能力',      category: 'skills',     type: 'textarea' },
  certificates:     { label: '证书/资质',     category: 'skills',     type: 'textarea' },

  // ---- 自我评价 ----
  self_eval:        { label: '自我评价',      category: 'self_eval',  type: 'textarea' },
};

// ============================================================
// 二、下拉字段 valueMap — 用于填充页面 <select> 时的智能匹配
// ============================================================
// 格式：存储值 → [页面可能出现的各种表述]
// 填充时，遍历 valueMap 中每个 key 的所有别名，匹配 <option> 文本

const FIELD_VALUE_MAP = {
  gender: {
    '男': ['男', '男性', '先生', 'male'],
    '女': ['女', '女性', '女士', 'female'],
  },
  marital_status: {
    '未婚': ['未婚', '单身', '无配偶'],
    '已婚': ['已婚', '已婚（有子女）', '已婚（无子女）', '有配偶'],
    '离异': ['离异', '离婚'],
    '丧偶': ['丧偶'],
  },
  id_type: {
    '身份证': ['身份证', '居民身份证', '二代身份证', 'ID Card', '中国大陆身份证'],
    '护照': ['护照', 'Passport'],
    '港澳居民来往内地通行证': ['港澳居民来往内地通行证', '港澳通行证', '回乡证'],
    '台湾居民来往大陆通行证': ['台湾居民来往大陆通行证', '台胞证'],
    '其他': ['其他', '其它', 'Other'],
  },
  ethnicity: {
    '汉族': ['汉族', '汉', 'Hans', 'Han'],
    '蒙古族': ['蒙古族', '蒙古'],
    '回族': ['回族', '回'],
    '藏族': ['藏族', '藏'],
    '维吾尔族': ['维吾尔族', '维吾尔'],
    '苗族': ['苗族', '苗'],
    '彝族': ['彝族', '彝'],
    '壮族': ['壮族', '壮'],
    '其他': ['其他', '其它'],
  },
  political_status: {
    '中共党员': ['中共党员', '党员', '中共正式党员', '共产党员'],
    '中共预备党员': ['中共预备党员', '预备党员'],
    '共青团员': ['共青团员', '团员', '共青团'],
    '群众': ['群众', '普通群众', '一般群众'],
    '民主党派': ['民主党派', '民盟', '民建', '民进', '农工党', '致公党', '九三学社', '台盟'],
  },
  hukou_type: {
    '农业户口': ['农业户口', '农村户口', '农业'],
    '非农业户口': ['非农业户口', '城镇户口', '非农业', '城镇'],
    '居民户口': ['居民户口', '居民'],
  },
  degree: {
    '博士': ['博士', '博士研究生', '博士及以上', '博士学历', 'PhD', 'Ph.D', 'Doctor'],
    '硕士': ['硕士', '硕士研究生', '硕士学历', 'Master', 'MS', 'MA', 'MSc'],
    'MBA': ['MBA', '工商管理硕士'],
    'EMBA': ['EMBA', '高级工商管理硕士'],
    '本科': ['本科', '大学本科', '本科（学士）', '本科学历', '学士', 'Bachelor', 'BA', 'BS', 'BSc'],
    '大专': ['大专', '专科', '大学专科', '大专学历'],
    '高中': ['高中', '高中及以下', '中专', '高中以下'],
    '其他': ['其他', '其它'],
  },
  job_status: {
    '在校生': ['在校生', '在校学生', '在读', '在校'],
    '应届生': ['应届生', '应届毕业生', '应届'],
    '在职-暂不离职': ['在职-暂不离职', '在职', '在职不考虑机会', '暂不考虑'],
    '在职-考虑机会': ['在职-考虑机会', '在职看机会', '观望中', '看机会'],
    '已离职-随时到岗': ['已离职-随时到岗', '已离职', '离职', '随时到岗', '待业'],
  },
  available_date: {
    '随时到岗': ['随时到岗', '随时', '立即上岗', '即时到岗'],
    '一周内': ['一周内', '1周内', '7天内', '一周以内'],
    '两周内': ['两周内', '2周内', '14天内'],
    '一个月内': ['一个月内', '1个月内', '30天内', '一月以内'],
    '待定': ['待定', '面议', '待确认'],
  },
  emergency_relationship: {
    '父亲': ['父亲', '爸爸', '父', '爸'],
    '母亲': ['母亲', '妈妈', '母', '妈'],
    '配偶': ['配偶', '夫妻', '丈夫', '妻子', '爱人'],
    '兄弟姐妹': ['兄弟姐妹', '兄弟', '姐妹', '兄', '弟', '姐', '妹'],
    '子女': ['子女', '儿子', '女儿', '子', '女'],
    '朋友': ['朋友', '好友', '友人'],
    '其他': ['其他', '其它', '亲戚', '亲属'],
  },
  english_level: {
    'CET-4': ['CET-4', 'CET4', '大学英语四级', '英语四级', '四级', '4级'],
    'CET-6': ['CET-6', 'CET6', '大学英语六级', '英语六级', '六级', '6级'],
    'TEM-4': ['TEM-4', 'TEM4', '专业四级', '专四'],
    'TEM-8': ['TEM-8', 'TEM8', '专业八级', '专八'],
    'IELTS': ['IELTS', '雅思'],
    'TOEFL': ['TOEFL', '托福'],
    '无': ['无', '不限', '未参加', '无要求', '一般'],
  },
  study_mode: {
    '全日制': ['全日制', '统招全日制', '普通全日制', '全脱产'],
    '非全日制': ['非全日制', '在职', '业余', '不脱产'],
    '成人高考': ['成人高考', '成考', '成人教育'],
    '自考': ['自考', '自学考试'],
    '网络教育': ['网络教育', '远程教育', '网教'],
    '开放大学': ['开放大学', '电大', '国家开放大学'],
  },
  school_country: {
    '中国大陆': ['中国大陆', '中国', '国内', '内地', 'China', 'CN'],
    '中国香港': ['中国香港', '香港', 'Hong Kong'],
    '中国澳门': ['中国澳门', '澳门', 'Macau'],
    '中国台湾': ['中国台湾', '台湾', 'Taiwan'],
    '美国': ['美国', 'USA', 'US', 'America'],
    '英国': ['英国', 'UK', 'Britain', 'United Kingdom', 'England'],
    '澳大利亚': ['澳大利亚', '澳洲', 'Australia'],
    '加拿大': ['加拿大', 'Canada'],
  },
  is_211: {
    '是': ['是', 'yes', 'Yes', 'Y', 'true', 'True'],
    '否': ['否', 'no', 'No', 'N', 'false', 'False', '不是'],
  },
  is_985: {
    '是': ['是', 'yes', 'Yes', 'Y', 'true', 'True'],
    '否': ['否', 'no', 'No', 'N', 'false', 'False', '不是'],
  },
  is_key_university: {
    '是': ['是', 'yes', 'Yes', 'Y', 'true', 'True'],
    '否': ['否', 'no', 'No', 'N', 'false', 'False', '不是'],
  },
  class_rank: {
    '前20%': ['前20%', '20%', '前20', 'top20%'],
    '前30%': ['前30%', '30%', '前30', 'top30%'],
    '前50%': ['前50%', '50%', '前50', 'top50%'],
    '其他': ['其他', '其它', 'other'],
  },
  has_internship: {
    '有': ['有', '是', 'yes', 'Yes', '有实习', '有实习经历'],
    '无': ['无', '否', 'no', 'No', '无实习', '没有', '无实习经历'],
  },
};

// ============================================================
// 三、默认简历模板（2个固定预置模板，可在此基础上新增/删除自定义模板）
// ============================================================

const DEFAULT_PROFILES = {
  profile_1: {
    id: 'profile_1',
    name: '简历1',
    type: 'resume',           // 'resume' | 'form'
    isPreset: true,           // 预置模板不可删除
    createdAt: Date.now(),
    fields: {
      name: '',
      phone: '',
      email: '',
      gender: '',
      birth: '',
      age: '',
      birthplace: '',
      ethnicity: '',
      height: '',
      weight: '',
      marital_status: '',
      id_type: '',
      id_number: '',
      political_status: '',
      party_join_date: '',
      native_place: '',
      student_source: '',
      hukou_location: '',
      hukou_type: '',
      location: '',
      current_residence: '',
      mailing_address: '',
      target_city: '',
      expected_salary: '',
      job_status: '',
      available_date: '',
      emergency_contact: '',
      emergency_phone: '',
      emergency_relationship: '',
      school: '',
      degree: '',
      major: '',
      graduation: '',
      gpa: '',
      class_rank: '',
      english_level: '',
      study_mode: '',
      school_country: '',
      is_211: '',
      is_985: '',
      is_key_university: '',
      has_internship: '',
      courses: '',
      intern_company_1: '',
      intern_position_1: '',
      intern_duration_1: '',
      intern_desc_1: '',
      project_name_1: '',
      project_role_1: '',
      project_duration_1: '',
      project_desc_1: '',
      campus_activities: '',
      awards_honors: '',
      family_info: '',
      skills: '',
      languages: '',
      certificates: '',
      self_eval: '',
      experience: '',
      project: '',
    },
  },
  profile_2: {
    id: 'profile_2',
    name: '简历2',
    type: 'resume',
    isPreset: true,
    createdAt: Date.now(),
    fields: {
      name: '',
      phone: '',
      email: '',
      gender: '',
      birth: '',
      age: '',
      birthplace: '',
      ethnicity: '',
      height: '',
      weight: '',
      marital_status: '',
      id_type: '',
      id_number: '',
      political_status: '',
      party_join_date: '',
      native_place: '',
      student_source: '',
      hukou_location: '',
      hukou_type: '',
      location: '',
      current_residence: '',
      mailing_address: '',
      target_city: '',
      expected_salary: '',
      job_status: '',
      available_date: '',
      emergency_contact: '',
      emergency_phone: '',
      emergency_relationship: '',
      school: '',
      degree: '',
      major: '',
      graduation: '',
      gpa: '',
      class_rank: '',
      english_level: '',
      study_mode: '',
      school_country: '',
      is_211: '',
      is_985: '',
      is_key_university: '',
      has_internship: '',
      courses: '',
      intern_company_1: '',
      intern_position_1: '',
      intern_duration_1: '',
      intern_desc_1: '',
      project_name_1: '',
      project_role_1: '',
      project_duration_1: '',
      project_desc_1: '',
      campus_activities: '',
      awards_honors: '',
      family_info: '',
      skills: '',
      languages: '',
      certificates: '',
      self_eval: '',
      experience: '',
      project: '',
    },
  },
};

// ============================================================
// 四、Profile 管理器
// ============================================================

const ProfileManager = {
  STORAGE_KEY_PROFILES: 'resumeProfiles',
  STORAGE_KEY_ACTIVE: 'activeProfileId',
  STORAGE_KEY_LEGACY: 'resumeData', // 向后兼容旧版

  /**
   * 加载所有 Profiles
   */
  async loadAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY_PROFILES, this.STORAGE_KEY_ACTIVE], (result) => {
        let profiles = result[this.STORAGE_KEY_PROFILES];
        let needsUpdate = false;
        if (!profiles || Object.keys(profiles).length === 0) {
          profiles = JSON.parse(JSON.stringify(DEFAULT_PROFILES));
          needsUpdate = true;
        } else {
          // 旧数据补全 type/isPreset 字段
          for (const id of Object.keys(profiles)) {
            if (profiles[id].type === undefined) {
              profiles[id].type = 'resume';
              needsUpdate = true;
            }
            if (profiles[id].isPreset === undefined) {
              profiles[id].isPreset = (id === 'profile_1' || id === 'profile_2');
              needsUpdate = true;
            }
          }
        }
        const activeId = result[this.STORAGE_KEY_ACTIVE] || 'profile_1';
        if (needsUpdate) {
          chrome.storage.local.set({
            [this.STORAGE_KEY_PROFILES]: profiles,
            [this.STORAGE_KEY_ACTIVE]: activeId,
          });
        }
        resolve(profiles);
      });
    });
  },

  /**
   * 获取当前激活的 Profile
   */
  async getActive() {
    const profiles = await this.loadAll();
    const result = await new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY_ACTIVE], (r) => resolve(r));
    });
    const activeId = result[this.STORAGE_KEY_ACTIVE] || 'profile_1';
    const profile = profiles[activeId] || profiles['profile_1'];
    return { ...profile, fields: { ...profile.fields } };
  },

  /**
   * 更新指定 Profile
   */
  async update(profileId, fields) {
    const profiles = await this.loadAll();
    if (!profiles[profileId]) throw new Error(`Profile ${profileId} not found`);
    profiles[profileId].fields = { ...profiles[profileId].fields, ...fields };
    profiles[profileId].updatedAt = Date.now();
    await new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY_PROFILES]: profiles }, resolve);
    });
    return profiles[profileId];
  },

  /**
   * 切换激活的 Profile
   */
  async setActive(profileId) {
    await new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY_ACTIVE]: profileId }, resolve);
    });
  },

  /**
   * 重命名 Profile
   */
  async rename(profileId, newName) {
    const profiles = await this.loadAll();
    if (!profiles[profileId]) throw new Error(`Profile ${profileId} not found`);
    profiles[profileId].name = newName;
    profiles[profileId].updatedAt = Date.now();
    await new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY_PROFILES]: profiles }, resolve);
    });
  },

  /**
   * 创建新 Profile
   * @param {string} name - 模板名称
   * @param {string} type - 'resume' | 'form'
   * @param {object} fields - 初始字段值（可选）
   */
  async create(name, type = 'form', fields = {}) {
    const profiles = await this.loadAll();
    const id = `profile_${Date.now()}`;
    profiles[id] = {
      id,
      name,
      type,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fields: { ...fields },
    };
    await new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY_PROFILES]: profiles }, resolve);
    });
    return profiles[id];
  },

  /**
   * 删除 Profile（预置模板不可删除）
   */
  async delete(profileId) {
    const profiles = await this.loadAll();
    if (!profiles[profileId]) throw new Error(`Profile ${profileId} not found`);
    if (profiles[profileId].isPreset) throw new Error('预置模板不可删除');
    delete profiles[profileId];
    await new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY_PROFILES]: profiles }, resolve);
    });
    // 同步删除该 profile 的 customSchema
    try { await CustomSchemaManager.clear(profileId); } catch (e) { /* ignore */ }
    // 如果删的是 active，切换到 profile_1
    const activeResult = await new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY_ACTIVE], resolve);
    });
    if (activeResult[this.STORAGE_KEY_ACTIVE] === profileId) {
      await this.setActive('profile_1');
    }
    return { success: true };
  },

  /**
   * 复制 Profile（预置/自定义都可复制）
   */
  async duplicate(profileId) {
    const profiles = await this.loadAll();
    if (!profiles[profileId]) throw new Error(`Profile ${profileId} not found`);
    const src = profiles[profileId];
    const newId = `profile_${Date.now()}`;
    profiles[newId] = {
      id: newId,
      name: `${src.name} 副本`,
      type: src.type,
      isPreset: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      fields: JSON.parse(JSON.stringify(src.fields)),
    };
    await new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY_PROFILES]: profiles }, resolve);
    });
    // 同步复制 customSchema
    try {
      const srcSchema = await CustomSchemaManager.load(profileId);
      if (srcSchema && (srcSchema.sections.length > 0 || Object.keys(srcSchema.fields).length > 0)) {
        await CustomSchemaManager.save(newId, srcSchema);
      }
    } catch (e) { /* ignore */ }
    return profiles[newId];
  },

  /**
   * 向后兼容：从旧版 resumeData 迁移到新格式
   */
  async migrateFromLegacy() {
    const result = await new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY_LEGACY, this.STORAGE_KEY_PROFILES], (r) => resolve(r));
    });
    const legacyData = result[this.STORAGE_KEY_LEGACY];
    const existingProfiles = result[this.STORAGE_KEY_PROFILES];

    if (legacyData && Object.keys(legacyData).length > 0) {
      // 如果 profile_1 尚未被用户修改过（仍是默认值），则用旧数据合并
      if (existingProfiles && existingProfiles.profile_1) {
        const p1 = existingProfiles.profile_1;
        const isDefault = (p1.fields.name === DEFAULT_PROFILES.profile_1.fields.name &&
                           p1.fields.school === DEFAULT_PROFILES.profile_1.fields.school);
        if (isDefault) {
          p1.fields = { ...p1.fields, ...legacyData };
          await new Promise((resolve) => {
            chrome.storage.local.set({ [this.STORAGE_KEY_PROFILES]: existingProfiles }, resolve);
          });
          console.log('[ProfileManager] 已从旧版 resumeData 迁移到 profile_1');
          // 迁移后清除旧数据
          chrome.storage.local.remove(this.STORAGE_KEY_LEGACY);
        }
      }
    }
  },

  /**
   * 获取用于填充页面的字段值（兼容旧版 content-script 调用）
   */
  async getFillData() {
    const profile = await this.getActive();
    return profile.fields;
  },
};

// ============================================================
// 五、自定义字段/栏目 Schema 管理器
// ============================================================
// 按 profileId 索引存储自定义字段元数据和自定义栏目
// 结构: { [profileId]: { sections: [...], fields: {...} } }

const CustomSchemaManager = {
  STORAGE_KEY: 'customSchema',

  /**
   * 加载指定 profile 的自定义 schema
   */
  async load(profileId) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const all = result[this.STORAGE_KEY] || {};
        const schema = all[profileId] || { sections: [], fields: {} };
        if (!Array.isArray(schema.sections)) schema.sections = [];
        if (!schema.fields || typeof schema.fields !== 'object') schema.fields = {};
        resolve(JSON.parse(JSON.stringify(schema)));
      });
    });
  },

  /**
   * 保存指定 profile 的自定义 schema
   */
  async save(profileId, schema) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const all = result[this.STORAGE_KEY] || {};
        all[profileId] = schema;
        chrome.storage.local.set({ [this.STORAGE_KEY]: all }, () => resolve(true));
      });
    });
  },

  /**
   * 清除指定 profile 的自定义 schema
   */
  async clear(profileId) {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        const all = result[this.STORAGE_KEY] || {};
        delete all[profileId];
        chrome.storage.local.set({ [this.STORAGE_KEY]: all }, () => resolve(true));
      });
    });
  },

  /**
   * 添加自定义字段
   * @param {string} profileId
   * @param {object} fieldMeta - { key, label, type, section, options, keywords }
   */
  async addField(profileId, fieldMeta) {
    const schema = await this.load(profileId);
    const key = fieldMeta.key || `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    schema.fields[key] = {
      label: fieldMeta.label || '未命名字段',
      type: fieldMeta.type || 'text',
      section: fieldMeta.section || 'other',
      options: Array.isArray(fieldMeta.options) ? fieldMeta.options : [],
      keywords: Array.isArray(fieldMeta.keywords) ? fieldMeta.keywords : [],
      isCustom: true,
      order: fieldMeta.order !== undefined ? fieldMeta.order : Object.keys(schema.fields).length + 100,
    };
    await this.save(profileId, schema);
    return { key, field: schema.fields[key] };
  },

  /**
   * 更新自定义字段
   */
  async updateField(profileId, fieldKey, updates) {
    const schema = await this.load(profileId);
    if (!schema.fields[fieldKey]) throw new Error(`Field ${fieldKey} not found`);
    schema.fields[fieldKey] = { ...schema.fields[fieldKey], ...updates };
    await this.save(profileId, schema);
  },

  /**
   * 删除自定义字段
   */
  async removeField(profileId, fieldKey) {
    const schema = await this.load(profileId);
    delete schema.fields[fieldKey];
    await this.save(profileId, schema);
  },

  /**
   * 添加自定义栏目
   */
  async addSection(profileId, sectionMeta) {
    const schema = await this.load(profileId);
    const id = sectionMeta.id || `section_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    schema.sections.push({
      id,
      name: sectionMeta.name || '自定义栏目',
      isCustom: true,
      order: sectionMeta.order !== undefined ? sectionMeta.order : schema.sections.length + 100,
    });
    await this.save(profileId, schema);
    return { id, section: schema.sections[schema.sections.length - 1] };
  },

  /**
   * 删除自定义栏目（同时删除该栏目下的所有自定义字段）
   */
  async removeSection(profileId, sectionId) {
    const schema = await this.load(profileId);
    schema.sections = schema.sections.filter(s => s.id !== sectionId);
    for (const key of Object.keys(schema.fields)) {
      if (schema.fields[key].section === sectionId) {
        delete schema.fields[key];
      }
    }
    await this.save(profileId, schema);
  },

  /**
   * 重命名自定义栏目
   */
  async renameSection(profileId, sectionId, newName) {
    const schema = await this.load(profileId);
    const section = schema.sections.find(s => s.id === sectionId);
    if (section) {
      section.name = newName;
      await this.save(profileId, schema);
    }
  },
};

// ============================================================
// 六、导出
// ============================================================

if (typeof window !== 'undefined') {
  window.RESUME_FIELDS = RESUME_FIELDS;
  window.FIELD_VALUE_MAP = FIELD_VALUE_MAP;
  window.DEFAULT_PROFILES = DEFAULT_PROFILES;
  window.ProfileManager = ProfileManager;
  window.CustomSchemaManager = CustomSchemaManager;
}

// Service Worker 环境（background.js）通过 importScripts 加载，无 window 对象
if (typeof self !== 'undefined' && !self.RESUME_FIELDS) {
  self.RESUME_FIELDS = RESUME_FIELDS;
  self.FIELD_VALUE_MAP = FIELD_VALUE_MAP;
  self.DEFAULT_PROFILES = DEFAULT_PROFILES;
  self.ProfileManager = ProfileManager;
  self.CustomSchemaManager = CustomSchemaManager;
}