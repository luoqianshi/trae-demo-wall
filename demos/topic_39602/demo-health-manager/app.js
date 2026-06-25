/**
 * AI 家庭健康管家 - 完整应用逻辑
 * 支持：家庭成员管理、用药提醒、健康档案、报告解读、药品识别、健康趋势、紧急功能、设置管理、药品冲突检测、家庭健康共享
 */

// ===== 数据存储（按家庭名称隔离） =====
const Storage = {
    _prefix: 'health_',
    _getPrefix() {
        const familyName = AppState.familyName || 'default';
        return this._prefix + familyName + '_';
    },
    get(key) {
        try {
            const prefix = this._getPrefix();
            return JSON.parse(localStorage.getItem(prefix + key));
        } catch {
            return null;
        }
    },
    set(key, value) {
        const prefix = this._getPrefix();
        localStorage.setItem(prefix + key, JSON.stringify(value));
    },
    remove(key) {
        const prefix = this._getPrefix();
        localStorage.removeItem(prefix + key);
    }
};

// ===== 应用状态 =====
const AppState = {
    familyName: '',
    members: [],
    currentMemberId: null,
    medicines: [],
    healthRecords: {},
    checkups: {},
    reports: [],
    healthMetrics: {},
    emergencyContact: null,
    settings: {},
    vaccineRecords: {} // 疫苗接种记录：{ memberId: { '疫苗名称': true } }
};

// ===== 药品数据库（支持名称、关键词、别名匹配） =====
const MedicineDB = {
    '阿司匹林': {
        keywords: ['阿司匹林', 'aspirin', '肠溶片', '拜阿司匹灵', '阿西美辛'],
        generic: '阿司匹林肠溶片',
        usage: '用于缓解轻度或中度疼痛，如牙痛、头痛、神经痛，也用于感冒发热及风湿病。具有抗血小板聚集作用，可用于预防心脑血管疾病。',
        dosage: '口服，成人一次 100mg，一日 1 次，建议饭后服用',
        sideEffects: '胃肠道反应如恶心、呕吐、上腹部不适或疼痛，偶有过敏反应',
        contraindication: '对本品过敏者、活动性消化性溃疡患者、严重肝肾功能衰竭患者、血友病或血小板减少症患者禁用',
        precautions: '饭后服用可减少胃部刺激；避免饮酒；手术前应告知医生正在服用本品；有出血倾向者慎用'
    },
    '氨氯地平': {
        keywords: ['氨氯地平', 'amlodipine', '络活喜', '降压药', '苯磺酸氨氯地平', '马来酸氨氯地平'],
        generic: '苯磺酸氨氯地平片',
        usage: '用于治疗高血压、慢性稳定性心绞痛及变异型心绞痛',
        dosage: '口服，通常起始剂量一次 5mg，一日 1 次，最大剂量不超过 10mg/日',
        sideEffects: '常见头痛、水肿、疲劳、恶心、腹痛、嗜睡；少见心悸、眩晕、面部潮红',
        contraindication: '对二氢吡啶类药物过敏者禁用；严重低血压患者禁用',
        precautions: '肝功能受损者慎用；避免突然停药；用药期间监测血压；与柚子汁同服可能增加血药浓度'
    },
    '二甲双胍': {
        keywords: ['二甲双胍', 'metformin', '格华止', '迪化唐锭', '美迪康', '降糖药'],
        generic: '盐酸二甲双胍片',
        usage: '用于 2 型糖尿病的治疗，尤其适用于肥胖患者。可单独使用或与其他降糖药联合使用。',
        dosage: '口服，成人一次 0.5g，一日 2-3 次，餐中或餐后服用，最大日剂量不超过 2.55g',
        sideEffects: '胃肠道反应较常见，如腹泻、恶心、呕吐、腹胀、食欲减退；长期使用可能影响维生素B12吸收',
        contraindication: '严重肾功能不全（eGFR<30）、严重感染、酸中毒、严重肝病、心力衰竭患者禁用；酗酒者禁用',
        precautions: '定期检查肾功能和肝功能；避免饮酒；造影检查前应暂停用药；老年患者应减量使用'
    },
    '维生素C': {
        keywords: ['维生素C', 'vitamin c', 'vc', '维C', '抗坏血酸', '力度伸'],
        generic: '维生素C片（抗坏血酸）',
        usage: '用于预防和治疗维生素C缺乏症（坏血病），也可用于急慢性传染性疾病及紫癜的辅助治疗',
        dosage: '口服，一次 100-200mg，一日 3 次；用于坏血病时一次 300-600mg，一日 1 次',
        sideEffects: '长期大量服用（每日超过 1g）可能引起腹泻、皮肤发红、头痛、尿频、恶心呕吐',
        contraindication: '对本品过敏者禁用；痛风患者慎用；草酸盐结石患者慎用',
        precautions: '不宜长期过量服用；突然停药可能出现反跳性坏血病；与碱性药物合用可能失效'
    },
    '阿托伐他汀': {
        keywords: ['阿托伐他汀', 'atorvastatin', '立普妥', '阿乐', '降脂药', '他汀'],
        generic: '阿托伐他汀钙片',
        usage: '用于高胆固醇血症、混合型高脂血症以及冠心病和脑中风的防治',
        dosage: '口服，起始剂量一次 10mg，一日 1 次，晚餐时服用，最大剂量不超过 80mg/日',
        sideEffects: '常见便秘、胃肠胀气、消化不良、腹痛；少见肌肉疼痛、乏力、肝酶升高',
        contraindication: '活动性肝病、不明原因肝酶持续升高者禁用；妊娠期和哺乳期妇女禁用',
        precautions: '用药前及用药期间定期检查肝功能；出现不明原因肌肉疼痛应及时就医；避免大量饮酒'
    },
    '奥美拉唑': {
        keywords: ['奥美拉唑', 'omeprazole', '洛赛克', '奥克', '质子泵抑制剂', '胃药'],
        generic: '奥美拉唑肠溶胶囊',
        usage: '用于胃溃疡、十二指肠溃疡、反流性食管炎、卓-艾综合征等胃酸相关疾病',
        dosage: '口服，一次 20mg，一日 1-2 次，晨起吞服或早晚各一次，不可咀嚼',
        sideEffects: '常见头痛、腹泻、恶心、呕吐、腹胀；长期使用可能引起维生素B12缺乏、低镁血症',
        contraindication: '对本品过敏者禁用；严重肾功能不全者慎用',
        precautions: '肠溶制剂应整粒吞服；长期使用需监测血镁和维生素B12水平；与氯吡格雷合用可能降低后者疗效'
    },
    '布洛芬': {
        keywords: ['布洛芬', 'ibuprofen', '芬必得', '美林', '止痛药', '退烧药', '消炎痛'],
        generic: '布洛芬缓释胶囊',
        usage: '用于缓解轻至中度疼痛如头痛、关节痛、偏头痛、牙痛、肌肉痛、神经痛、痛经，也用于普通感冒或流行性感冒引起的发热',
        dosage: '口服，成人一次 0.3-0.4g，每 4-6 小时一次，一日最大剂量不超过 2.4g',
        sideEffects: '胃肠道反应如胃烧灼感、消化不良、胃痛、恶心；少见头晕、嗜睡、皮疹',
        contraindication: '对本品或其他非甾体抗炎药过敏者禁用；活动性消化性溃疡患者禁用；严重肝肾功能不全者禁用',
        precautions: '饭后服用可减少胃部刺激；避免与其他非甾体抗炎药合用；用药期间避免饮酒；心血管疾病患者慎用'
    },
    '头孢克肟': {
        keywords: ['头孢克肟', 'cefixime', '世福素', '头孢', '抗生素', '消炎药'],
        generic: '头孢克肟分散片',
        usage: '用于敏感菌所致的咽炎、扁桃体炎、急性支气管炎、肺炎、中耳炎、尿路感染等',
        dosage: '口服，成人一次 100mg，一日 2 次；严重感染可增至一次 200mg，一日 2 次',
        sideEffects: '常见腹泻、恶心、腹痛、皮疹；少见肝功能异常、白细胞减少；偶见过敏性休克',
        contraindication: '对头孢菌素类抗生素过敏者禁用；对青霉素过敏者慎用',
        precautions: '用药期间及停药后 7 天内禁止饮酒；肾功能不全者应减量；长期使用可能引起菌群失调'
    },
    '硝苯地平': {
        keywords: ['硝苯地平', 'nifedipine', '心痛定', '拜新同', '降压药', '钙通道阻滞剂'],
        generic: '硝苯地平控释片',
        usage: '用于治疗高血压、慢性稳定性心绞痛',
        dosage: '口服，一次 30mg，一日 1 次，整片吞服不可掰开',
        sideEffects: '常见头痛、面部潮红、心悸、踝部水肿、头晕；少见牙龈增生、肝功能异常',
        contraindication: '心源性休克患者禁用；妊娠期妇女禁用；与利福平合用禁忌',
        precautions: '控释片应整片吞服不可咀嚼或掰开；用药期间监测血压和心率；突然停药可能引起反跳性高血压'
    },
    '格列美脲': {
        keywords: ['格列美脲', 'glimepiride', '亚莫利', '迪北', '降糖药', '磺脲类'],
        generic: '格列美脲片',
        usage: '用于 2 型糖尿病的治疗，通过刺激胰岛β细胞分泌胰岛素降低血糖',
        dosage: '口服，起始剂量一次 1mg，一日 1 次，早餐前服用，最大日剂量不超过 6mg',
        sideEffects: '常见低血糖、恶心、呕吐、腹泻、腹痛；少见肝功能异常、皮疹、瘙痒',
        contraindication: '1 型糖尿病患者禁用；糖尿病酮症酸中毒患者禁用；严重肝肾功能不全者禁用；妊娠期禁用',
        precautions: '用药期间规律进餐，避免漏餐导致低血糖；定期监测血糖；老年患者应从小剂量开始'
    },
    '缬沙坦': {
        keywords: ['缬沙坦', 'valsartan', '代文', '降压药', 'ARB', '沙坦'],
        generic: '缬沙坦胶囊',
        usage: '用于治疗轻中度原发性高血压，可单独使用或与其他降压药联合使用',
        dosage: '口服，一次 80mg，一日 1 次，最大剂量可增至 320mg/日',
        sideEffects: '常见头晕、头痛、乏力；少见咳嗽（较ACEI类少见）、腹泻、恶心；罕见血管性水肿',
        contraindication: '对本品过敏者禁用；妊娠期和哺乳期妇女禁用；严重胆道梗阻患者禁用',
        precautions: '用药期间监测血压和血钾；与利尿剂合用时首剂可能引起低血压；肾功能不全者需调整剂量'
    },
    '阿卡波糖': {
        keywords: ['阿卡波糖', 'acarbose', '拜糖平', '卡博平', '降糖药', 'α糖苷酶抑制剂'],
        generic: '阿卡波糖片',
        usage: '用于 2 型糖尿病的治疗，通过抑制肠道α-糖苷酶延缓碳水化合物吸收，降低餐后血糖',
        dosage: '口服，起始剂量一次 50mg，一日 3 次，随第一口主食嚼服，最大剂量一次 100mg，一日 3 次',
        sideEffects: '常见胃肠胀气、肠鸣音、腹泻、腹痛；偶见皮疹、黄疸；罕见肠梗阻',
        contraindication: '对本品过敏者禁用；严重肾功能不全者禁用；肠梗阻患者禁用；妊娠期禁用',
        precautions: '必须与第一口主食同时嚼服；出现低血糖时应口服葡萄糖纠正，食用蔗糖无效；定期监测肝功能'
    }
};

// ===== 药品冲突规则库 =====
const DrugConflictRules = [
    {
        drugs: ['阿司匹林', '布洛芬'],
        level: 'high',
        reason: '两者均为非甾体抗炎药，合用会显著增加胃肠道出血和溃疡风险'
    },
    {
        drugs: ['阿司匹林', '阿托伐他汀'],
        level: 'low',
        reason: '一般可合用，但需监测肝功能，两者均经肝脏代谢'
    },
    {
        drugs: ['氨氯地平', '硝苯地平'],
        level: 'high',
        reason: '同属钙通道阻滞剂，合用会导致血压过度下降，增加低血压风险'
    },
    {
        drugs: ['二甲双胍', '格列美脲'],
        level: 'medium',
        reason: '合用可增强降糖效果，但低血糖风险增加，需密切监测血糖'
    },
    {
        drugs: ['二甲双胍', '阿卡波糖'],
        level: 'low',
        reason: '合用可增强降糖效果，一般安全，但胃肠道反应可能加重'
    },
    {
        drugs: ['奥美拉唑', '头孢克肟'],
        level: 'low',
        reason: '奥美拉唑降低胃酸可能影响头孢克肟吸收，建议间隔2小时服用'
    },
    {
        drugs: ['布洛芬', '头孢克肟'],
        level: 'medium',
        reason: '布洛芬可能掩盖感染症状，影响医生对病情的判断'
    },
    {
        drugs: ['缬沙坦', '氨氯地平'],
        level: 'low',
        reason: '合用可增强降压效果，常见联合用药方案，需监测血压和血钾'
    },
    {
        drugs: ['格列美脲', '阿卡波糖'],
        level: 'low',
        reason: '合用可增强降糖效果，需注意低血糖风险'
    }
];

// ===== 模拟体检报告数据 =====
const MockReportData = {
    items: [
        { name: '血压', value: '135/85', unit: 'mmHg', range: '90-140/60-90', status: 'warning', desc: '收缩压略高，建议低盐饮食，适量运动' },
        { name: '空腹血糖', value: '6.2', unit: 'mmol/L', range: '3.9-6.1', status: 'warning', desc: '略高于正常值，建议复查并控制饮食' },
        { name: '总胆固醇', value: '5.1', unit: 'mmol/L', range: '2.8-5.2', status: 'normal', desc: '在正常范围内，继续保持' },
        { name: '甘油三酯', value: '1.8', unit: 'mmol/L', range: '0.56-1.7', status: 'warning', desc: '略高，建议减少油脂摄入，增加运动' },
        { name: '尿酸', value: '420', unit: 'μmol/L', range: '208-428', status: 'normal', desc: '在正常范围内' },
        { name: '谷丙转氨酶', value: '45', unit: 'U/L', range: '0-40', status: 'warning', desc: '轻度升高，建议避免饮酒，注意休息' }
    ],
    summary: '您的体检结果显示血压和血糖略高，建议：\n\n1）低盐低脂饮食\n2）每周至少运动3次，每次30分钟\n3）3个月后复查血压和血糖\n4）避免饮酒和熬夜\n\n如有不适请及时就医。'
};

// ===== 工具函数 =====
const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    formatDate(date) {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    getToday() {
        return this.formatDate(new Date());
    },
    calculateAge(birthdate) {
        const birth = new Date(birthdate);
        const today = new Date();
        const diffTime = today - birth;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        // 小于1个月显示天数
        if (diffDays < 30) {
            return `${diffDays}天`;
        }

        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        if (today.getDate() < birth.getDate()) {
            months--;
        }
        if (months < 0) {
            years--;
            months += 12;
        }
        if (years < 6) {
            return `${years}岁${months}个月`;
        }
        return `${years}岁`;
    },
    getTimeLabel(time) {
        const map = { 'morning': '早晨', 'noon': '中午', 'evening': '晚上', 'before-bed': '睡前' };
        return map[time] || time;
    },
    showToast(message, icon = '') {
        const toast = document.getElementById('global-toast');
        const text = document.getElementById('global-toast-text');
        text.textContent = (icon ? icon + ' ' : '') + message;
        toast.style.display = 'flex';
        setTimeout(() => { toast.style.display = 'none'; }, 2500);
    },
    formatTime(hour, minute) {
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    },
    getCurrentTimeStr() {
        const now = new Date();
        return this.formatTime(now.getHours(), now.getMinutes());
    }
};

// ===== 页面导航 =====
const Navigation = {
    currentPage: 'login-page',

    goTo(pageId) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        this.currentPage = pageId;
        window.scrollTo(0, 0);
    },

    goBack() {
        this.goTo('main-page');
    }
};

// ===== 家庭成员管理 =====
const MemberManager = {
    init() {
        // 注意：init时不加载数据，等enterApp时根据家庭名称加载
        // 避免登录前加载错误的数据

        // 绑定事件
        document.getElementById('btn-enter').addEventListener('click', () => this.enterApp());
        document.getElementById('btn-add-member-tab').addEventListener('click', () => this.showAddModal());
        document.getElementById('btn-confirm-member').addEventListener('click', () => this.addMember());
        document.getElementById('btn-cancel-member').addEventListener('click', () => this.hideAddModal());

        // 头像选择
        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
            });
        });

        // 关闭弹窗
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });
    },

    enterApp() {
        const name = document.getElementById('family-name').value.trim();
        if (!name) {
            Utils.showToast('请输入家庭名称');
            return;
        }
        AppState.familyName = name;
        document.getElementById('display-family-name').textContent = name;

        // 加载该家庭的数据
        this.loadFamilyData();

        // 如果没有成员，添加默认成员
        if (AppState.members.length === 0) {
            this.addDefaultMembers();
        }

        this.renderMemberTabs();
        this.loadMemberData(AppState.members[0].id);
        Navigation.goTo('main-page');
        this.updateOverview();
        FamilyHealthShare.render();
    },

    loadFamilyData() {
        const members = Storage.get('members');
        AppState.members = members || [];

        const medicines = Storage.get('medicines');
        AppState.medicines = medicines || [];

        const healthRecords = Storage.get('healthRecords');
        AppState.healthRecords = healthRecords || {};

        const checkups = Storage.get('checkups');
        AppState.checkups = checkups || {};

        const healthMetrics = Storage.get('healthMetrics');
        AppState.healthMetrics = healthMetrics || {};

        const reports = Storage.get('reports');
        AppState.reports = reports || [];

        const emergencyContact = Storage.get('emergencyContact');
        AppState.emergencyContact = emergencyContact || null;

        // 加载疫苗接种记录
        VaccineManager.loadRecords();
    },

    addDefaultMembers() {
        AppState.members = [
            { id: Utils.generateId(), name: '爷爷', relation: 'grandfather', gender: 'male', birthdate: '1955-01-01', avatar: '👴' },
            { id: Utils.generateId(), name: '奶奶', relation: 'grandmother', gender: 'female', birthdate: '1958-03-15', avatar: '👵' },
            { id: Utils.generateId(), name: '爸爸', relation: 'self', gender: 'male', birthdate: '1980-06-20', avatar: '👨' }
        ];
        Storage.set('members', AppState.members);

        // 初始化默认健康档案
        AppState.members.forEach(m => {
            if (!AppState.healthRecords[m.id]) {
                AppState.healthRecords[m.id] = {
                    bloodType: '',
                    height: '',
                    weight: '',
                    diseases: m.relation === 'grandfather' ? ['高血压', '糖尿病'] : [],
                    allergies: []
                };
            }
            if (!AppState.checkups[m.id]) {
                AppState.checkups[m.id] = [];
            }
            if (!AppState.healthMetrics[m.id]) {
                AppState.healthMetrics[m.id] = [];
            }
        });

        // 添加默认用药
        AppState.medicines = [
            { id: Utils.generateId(), memberId: AppState.members[0].id, name: '降压药', dosage: '每日1次，每次1片', times: ['morning'], timeDetails: { morning: '08:00' }, notes: '饭后服用，忌饮酒', startDate: '2024-01-01', endDate: '', completed: false },
            { id: Utils.generateId(), memberId: AppState.members[0].id, name: '阿司匹林', dosage: '每日1次，每次1片', times: ['evening'], timeDetails: { evening: '20:00' }, notes: '睡前服用', startDate: '2024-01-01', endDate: '', completed: false },
            { id: Utils.generateId(), memberId: AppState.members[1].id, name: '维生素C', dosage: '每日2次，每次1片', times: ['morning', 'evening'], timeDetails: { morning: '08:30', evening: '19:00' }, notes: '餐后服用', startDate: '2024-01-01', endDate: '', completed: false }
        ];

        // 添加默认体检记录
        AppState.checkups[AppState.members[0].id] = [
            { date: '2026-05-15', hospital: '市第一人民医院', result: '血压偏高，血糖正常，建议控制饮食' }
        ];

        // 添加默认健康指标
        AppState.healthMetrics[AppState.members[0].id] = [
            { date: '2026-06-01', weight: 70, height: 170, systolic: 135, diastolic: 85, bloodSugar: 6.2, heartRate: 72 },
            { date: '2026-06-10', weight: 69.5, height: 170, systolic: 132, diastolic: 82, bloodSugar: 6.0, heartRate: 70 }
        ];
    },

    renderMemberTabs() {
        const list = document.getElementById('member-list');
        list.innerHTML = AppState.members.map(m => `
            <div class="member-tab ${m.id === AppState.currentMemberId ? 'active' : ''}" data-id="${m.id}">
                <span class="avatar">${m.avatar}</span>
                <span class="name">${m.name}</span>
                <span class="btn-delete-member" data-id="${m.id}" title="删除成员">✕</span>
            </div>
        `).join('');

        list.querySelectorAll('.member-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                // 如果点击的是删除按钮，不触发切换
                if (e.target.classList.contains('btn-delete-member')) return;
                const id = tab.dataset.id;
                this.loadMemberData(id);
            });
        });

        // 绑定删除按钮事件
        list.querySelectorAll('.btn-delete-member').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                this.confirmDeleteMember(id);
            });
        });
    },

    confirmDeleteMember(memberId) {
        const member = AppState.members.find(m => m.id === memberId);
        if (!member) return;

        if (confirm(`确定要删除成员「${member.name}」吗？\n\n删除后将同时删除该成员的所有健康档案、用药记录和体检记录，此操作不可恢复。`)) {
            this.deleteMember(memberId);
        }
    },

    deleteMember(memberId) {
        // 删除成员
        AppState.members = AppState.members.filter(m => m.id !== memberId);
        Storage.set('members', AppState.members);

        // 删除相关数据
        delete AppState.healthRecords[memberId];
        delete AppState.checkups[memberId];
        delete AppState.healthMetrics[memberId];
        AppState.medicines = AppState.medicines.filter(m => m.memberId !== memberId);

        Storage.set('healthRecords', AppState.healthRecords);
        Storage.set('checkups', AppState.checkups);
        Storage.set('healthMetrics', AppState.healthMetrics);
        Storage.set('medicines', AppState.medicines);

        // 如果删除的是当前选中成员，切换到第一个
        if (AppState.currentMemberId === memberId) {
            AppState.currentMemberId = AppState.members[0]?.id || null;
        }

        this.renderMemberTabs();
        if (AppState.currentMemberId) {
            this.loadMemberData(AppState.currentMemberId);
        } else {
            this.updateOverview();
        }

        Utils.showToast(`成员已删除`);
    },

    loadMemberData(memberId) {
        AppState.currentMemberId = memberId;
        this.renderMemberTabs();
        this.updateOverview();
        this.renderMedicineList();
        this.renderRecentRecords();
        FamilyHealthShare.render();
    },

    showAddModal() {
        document.getElementById('modal-add-member').classList.add('show');
    },

    hideAddModal() {
        document.getElementById('modal-add-member').classList.remove('show');
        // 清空表单
        document.getElementById('member-name').value = '';
        document.getElementById('member-relation').value = '';
        document.getElementById('member-birthdate').value = '';
    },

    addMember() {
        const name = document.getElementById('member-name').value.trim();
        const relation = document.getElementById('member-relation').value;
        const gender = document.querySelector('input[name="member-gender"]:checked')?.value;
        const birthdate = document.getElementById('member-birthdate').value;
        const avatar = document.querySelector('.avatar-option.selected')?.dataset.avatar || '👤';

        if (!name || !relation || !gender || !birthdate) {
            Utils.showToast('请填写完整信息');
            return;
        }

        const member = {
            id: Utils.generateId(),
            name,
            relation,
            gender,
            birthdate,
            avatar
        };

        AppState.members.push(member);
        Storage.set('members', AppState.members);

        // 初始化健康档案
        AppState.healthRecords[member.id] = {
            bloodType: '',
            height: '',
            weight: '',
            diseases: [],
            allergies: []
        };
        AppState.checkups[member.id] = [];
        AppState.healthMetrics[member.id] = [];

        this.renderMemberTabs();
        this.loadMemberData(member.id);
        this.hideAddModal();
        Utils.showToast('添加成功');
    },

    updateOverview() {
        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!member) return;

        document.getElementById('today-date').textContent = Utils.getToday();

        // 显示生日和年龄
        const birthInfoEl = document.getElementById('member-birth-info');
        const birthdateDisplayEl = document.getElementById('member-birthdate-display');
        const ageDisplayEl = document.getElementById('member-age-display');
        if (member.birthdate) {
            birthInfoEl.style.display = 'flex';
            birthdateDisplayEl.textContent = member.birthdate;
            const ageText = Utils.calculateAge(member.birthdate);
            ageDisplayEl.textContent = ageText;
        } else {
            birthInfoEl.style.display = 'none';
        }

        // 疫苗接种推荐（6岁以下显示）
        const vaccineItemEl = document.getElementById('vaccine-overview-item');
        const vaccineStatusEl = document.getElementById('vaccine-status');
        if (member.birthdate && VaccineManager.shouldShow(member.birthdate)) {
            vaccineItemEl.style.display = 'block';
            const upcoming = VaccineManager.getUpcoming(member.birthdate);
            if (upcoming && upcoming.isDueNow) {
                vaccineStatusEl.innerHTML = `<span style="color:#ef4444;font-weight:600;">🔔 需接种</span>`;
            } else if (upcoming) {
                vaccineStatusEl.textContent = `${upcoming.daysUntil}天后`;
            } else {
                vaccineStatusEl.textContent = '已完成';
            }
        } else {
            vaccineItemEl.style.display = 'none';
        }

        const todayMedicines = AppState.medicines.filter(m =>
            m.memberId === member.id && !m.completed
        );
        const completedMedicines = AppState.medicines.filter(m =>
            m.memberId === member.id && m.completed
        );

        document.getElementById('today-medicine-count').textContent = `${todayMedicines.length} 项`;
        document.getElementById('today-completed-count').textContent = `${completedMedicines.length} 项`;

        const record = AppState.healthRecords[member.id];
        document.getElementById('health-record-status').textContent =
            record && (record.diseases.length > 0 || record.bloodType) ? '已建立' : '待完善';

        // 显示健康评分
        const scoreEl = document.getElementById('health-score');
        if (scoreEl) {
            const score = HealthScoreCalculator.calculate(member.id);
            scoreEl.textContent = score;
        }

        // 显示用药完成率
        const rateEl = document.getElementById('medicine-completion-rate');
        if (rateEl) {
            const rate = MedicineCompletionRate.calculate(member.id);
            rateEl.textContent = rate + '%';
        }
    },

    renderMedicineList() {
        const list = document.getElementById('medicine-list');
        const memberMedicines = AppState.medicines.filter(m => m.memberId === AppState.currentMemberId && !m.completed);

        if (memberMedicines.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💊</div>
                    <p>今日用药已完成</p>
                    <p style="font-size:12px">好好休息</p>
                </div>
            `;
            return;
        }

        // 按时间点分组
        const timeOrder = ['morning', 'noon', 'evening', 'before-bed'];
        const timeGroups = {};

        memberMedicines.forEach(m => {
            m.times.forEach(t => {
                if (!timeGroups[t]) timeGroups[t] = [];
                timeGroups[t].push(m);
            });
        });

        // 获取当前时间判断哪些时间点的药该吃了
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeValue = currentHour * 60 + currentMinute;

        // 时间点对应的时间值（分钟）
        const timeThresholds = {
            'morning': 8 * 60,
            'noon': 12 * 60,
            'evening': 19 * 60,
            'before-bed': 21 * 60
        };

        let html = '';

        timeOrder.forEach(timeKey => {
            if (!timeGroups[timeKey] || timeGroups[timeKey].length === 0) return;

            const timeLabel = Utils.getTimeLabel(timeKey);
            const timeValue = timeThresholds[timeKey];
            const isOverdue = currentTimeValue >= timeValue;
            const isNear = currentTimeValue >= timeValue - 30 && currentTimeValue < timeValue;

            let groupClass = 'time-group';
            let groupTitle = timeLabel;

            if (isOverdue) {
                groupClass += ' time-group-overdue';
                groupTitle += ' 🔴 该吃药了';
            } else if (isNear) {
                groupClass += ' time-group-near';
                groupTitle += ' ⏰ 即将到点';
            } else {
                groupTitle += ' ⏳ 未到时间';
            }

            html += `<div class="${groupClass}">`;
            html += `<div class="time-group-title">${groupTitle}</div>`;

            timeGroups[timeKey].forEach(m => {
                const timeDetail = m.timeDetails && m.timeDetails[timeKey] ? m.timeDetails[timeKey] : '';
                html += `
                    <div class="medicine-item" data-id="${m.id}">
                        <button class="medicine-checkbox" data-id="${m.id}" type="button" aria-label="标记为已服用"></button>
                        <div class="medicine-info">
                            <div class="medicine-name">${m.name}</div>
                            <div>
                                <span class="medicine-time-tag">${timeLabel}${timeDetail ? ' ' + timeDetail : ''}</span>
                                <span class="medicine-dosage">${m.dosage}</span>
                            </div>
                        </div>
                        <span class="medicine-status pending">待服</span>
                    </div>
                `;
            });

            html += '</div>';
        });

        list.innerHTML = html;

        // 绑定 checkbox 点击事件
        list.querySelectorAll('.medicine-checkbox').forEach(cb => {
            cb.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                MedicineManager.toggleComplete(cb.dataset.id);
            });
        });

        // 绑定整行点击事件 - 语音播报提醒
        list.querySelectorAll('.medicine-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.medicine-checkbox')) return;

                const medicineId = item.dataset.id;
                const medicine = AppState.medicines.find(m => m.id === medicineId);
                if (medicine) {
                    MedicineReminder.speakReminder(medicine);
                }
            });
        });
    },

    renderRecentRecords() {
        const list = document.getElementById('recent-records');
        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!member) return;

        const records = [];

        // 添加用药记录
        const memberMedicines = AppState.medicines.filter(m => m.memberId === member.id);
        memberMedicines.forEach(m => {
            records.push({
                icon: '💊',
                title: `${m.name} ${m.completed ? '已服用' : '待服用'}`,
                desc: m.dosage,
                date: m.startDate
            });
        });

        // 添加体检记录
        const checkups = AppState.checkups[member.id] || [];
        checkups.forEach(c => {
            records.push({
                icon: '📋',
                title: `体检：${c.hospital}`,
                desc: c.result,
                date: c.date
            });
        });

        // 按日期排序，取最近5条
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        const recent = records.slice(0, 5);

        if (recent.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <p>暂无健康记录</p>
                </div>
            `;
            return;
        }

        list.innerHTML = recent.map(r => `
            <div class="record-item">
                <span class="record-icon">${r.icon}</span>
                <div class="record-content">
                    <div class="record-title">${r.title}</div>
                    <div class="record-desc">${r.desc}</div>
                    <div class="record-date">${r.date}</div>
                </div>
            </div>
        `).join('');
    }
};

// ===== 用药管理 =====
const MedicineManager = {
    _selectedReminderTimes: [],

    init() {
        document.querySelectorAll('.feature-card[data-feature="medicine"]').forEach(card => {
            card.addEventListener('click', () => this.showAddPage());
        });
        document.getElementById('btn-add-medicine').addEventListener('click', () => this.showAddPage());
        document.getElementById('btn-save-medicine').addEventListener('click', () => this.saveMedicine());

        // AI 智能添加入口
        document.getElementById('ai-add-section').addEventListener('click', () => {
            IdentifyManager.enterFromMedicinePage();
        });

        // 长期 checkbox 切换
        const longTermCheckbox = document.getElementById('medicine-long-term');
        const endDateInput = document.getElementById('medicine-end-date');
        if (longTermCheckbox && endDateInput) {
            longTermCheckbox.addEventListener('change', () => {
                endDateInput.disabled = longTermCheckbox.checked;
                if (longTermCheckbox.checked) {
                    endDateInput.value = '';
                }
            });
        }

        // 提醒时间多选
        const reminderTimeSelect = document.getElementById('medicine-reminder-time');
        const customTimeInput = document.getElementById('medicine-custom-time');
        if (reminderTimeSelect) {
            reminderTimeSelect.addEventListener('change', () => {
                const value = reminderTimeSelect.value;
                if (!value) return;

                if (value === 'custom') {
                    customTimeInput.style.display = 'block';
                    customTimeInput.focus();
                } else {
                    customTimeInput.style.display = 'none';
                    if (!this._selectedReminderTimes.includes(value)) {
                        this._selectedReminderTimes.push(value);
                        this.renderReminderTimeTags();
                    }
                    reminderTimeSelect.value = '';
                }
            });
        }

        if (customTimeInput) {
            customTimeInput.addEventListener('change', () => {
                const value = customTimeInput.value;
                if (value && !this._selectedReminderTimes.includes(value)) {
                    this._selectedReminderTimes.push(value);
                    this.renderReminderTimeTags();
                }
                customTimeInput.style.display = 'none';
                customTimeInput.value = '';
                reminderTimeSelect.value = '';
            });
        }

        // 服用时间联动 - 根据勾选自动推荐提醒时间
        document.querySelectorAll('.medicine-time').forEach(cb => {
            cb.addEventListener('change', () => this.syncReminderTimes());
        });

        // 返回按钮
        document.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => Navigation.goBack());
        });
    },

    renderReminderTimeTags() {
        const container = document.getElementById('reminder-time-tags');
        if (!container) return;
        container.innerHTML = this._selectedReminderTimes.map((t, i) => `
            <span class="selected-tag">${t}<span class="tag-remove" data-index="${i}">✕</span></span>
        `).join('');

        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this._selectedReminderTimes.splice(index, 1);
                this.renderReminderTimeTags();
            });
        });
    },

    syncReminderTimes() {
        const checkedTimes = Array.from(document.querySelectorAll('.medicine-time:checked')).map(cb => cb.value);
        const timeMap = {
            'morning': ['08:00'],
            'noon': ['12:00'],
            'evening': ['19:00'],
            'before-bed': ['21:00']
        };

        // 根据服用时间自动添加对应的提醒时间
        checkedTimes.forEach(period => {
            const times = timeMap[period] || [];
            times.forEach(t => {
                if (!this._selectedReminderTimes.includes(t)) {
                    this._selectedReminderTimes.push(t);
                }
            });
        });

        // 如果取消勾选，移除对应时间
        const allMappedTimes = ['06:00','07:00','08:00','09:00','12:00','13:00','18:00','19:00','20:00','21:00','22:00'];
        const shouldKeep = new Set();
        checkedTimes.forEach(period => {
            (timeMap[period] || []).forEach(t => shouldKeep.add(t));
        });

        this._selectedReminderTimes = this._selectedReminderTimes.filter(t => {
            if (!allMappedTimes.includes(t)) return true; // 保留自定义时间
            return shouldKeep.has(t);
        });

        this.renderReminderTimeTags();
    },

    showAddPage() {
        // 重置表单
        document.getElementById('medicine-name').value = '';
        document.getElementById('medicine-dosage').value = '';
        document.querySelectorAll('.medicine-time').forEach(cb => cb.checked = false);
        document.querySelectorAll('.medicine-time-detail').forEach(input => input.value = '');
        document.getElementById('medicine-notes').value = '';
        document.getElementById('medicine-start-date').value = Utils.getToday();
        document.getElementById('medicine-end-date').value = '';
        document.getElementById('medicine-end-date').disabled = false;
        document.getElementById('medicine-long-term').checked = false;
        document.getElementById('medicine-custom-time').style.display = 'none';
        document.getElementById('medicine-custom-time').value = '';
        this._selectedReminderTimes = [];
        this.renderReminderTimeTags();

        Navigation.goTo('medicine-page');
    },

    fillFromAI(medicine) {
        document.getElementById('medicine-name').value = medicine.name;
        document.getElementById('medicine-dosage').value = medicine.dosage;
        document.getElementById('medicine-notes').value = medicine.precautions;
        document.getElementById('medicine-start-date').value = Utils.getToday();
        document.getElementById('medicine-end-date').value = '';
        document.getElementById('medicine-end-date').disabled = false;
        document.getElementById('medicine-long-term').checked = false;
        document.querySelectorAll('.medicine-time').forEach(cb => {
            cb.checked = cb.value === 'morning';
        });
    },

    saveMedicine() {
        const name = document.getElementById('medicine-name').value.trim();
        const dosage = document.getElementById('medicine-dosage').value.trim();
        const times = Array.from(document.querySelectorAll('.medicine-time:checked')).map(cb => cb.value);
        const notes = document.getElementById('medicine-notes').value.trim();
        const startDate = document.getElementById('medicine-start-date').value;
        const isLongTerm = document.getElementById('medicine-long-term').checked;
        const endDate = isLongTerm ? '长期' : document.getElementById('medicine-end-date').value;

        if (!name || !dosage || times.length === 0) {
            Utils.showToast('请填写完整信息');
            return;
        }

        // 药品冲突检测
        const conflicts = DrugConflictChecker.checkConflicts(name, AppState.currentMemberId);
        if (conflicts.length > 0) {
            const conflictMsgs = conflicts.map(c => `与「${c.existingDrug}」${c.level === 'high' ? '严重冲突' : c.level === 'medium' ? '中度冲突' : '轻度冲突'}：${c.reason}`).join('\n');
            if (!confirm(`检测到药品冲突：\n${conflictMsgs}\n\n是否仍要添加？`)) {
                return;
            }
        }

        // 收集精确时间
        const timeDetails = {};
        times.forEach(t => {
            const detailInput = document.querySelector(`.medicine-time-detail[data-time="${t}"]`);
            timeDetails[t] = detailInput ? detailInput.value : '';
        });

        const medicine = {
            id: Utils.generateId(),
            memberId: AppState.currentMemberId,
            name,
            dosage,
            times,
            timeDetails,
            reminderTimes: [...this._selectedReminderTimes],
            notes,
            startDate,
            endDate,
            completed: false
        };

        AppState.medicines.push(medicine);
        Storage.set('medicines', AppState.medicines);

        Navigation.goBack();
        MemberManager.updateOverview();
        MemberManager.renderMedicineList();
        FamilyHealthShare.render();
        Utils.showToast('添加成功');
    },

    toggleComplete(medicineId) {
        const medicine = AppState.medicines.find(m => m.id === medicineId);
        if (medicine) {
            medicine.completed = !medicine.completed;
            Storage.set('medicines', AppState.medicines);
            MemberManager.renderMedicineList();
            MemberManager.updateOverview();
            FamilyHealthShare.render();
        }
    },

    deleteMedicine(medicineId) {
        AppState.medicines = AppState.medicines.filter(m => m.id !== medicineId);
        Storage.set('medicines', AppState.medicines);
        MemberManager.renderMedicineList();
        MemberManager.updateOverview();
        FamilyHealthShare.render();
        Utils.showToast('已删除');
    }
};

// ===== 健康档案 =====
const RecordManager = {
    _tempDiseases: [],
    _tempAllergies: [],

    init() {
        document.querySelectorAll('.feature-card[data-feature="record"]').forEach(card => {
            card.addEventListener('click', () => this.showRecordPage());
        });
        document.getElementById('btn-edit-record').addEventListener('click', () => this.showEditModal());
        document.getElementById('btn-save-record').addEventListener('click', () => this.saveRecord());
        document.getElementById('btn-cancel-edit').addEventListener('click', () => {
            document.getElementById('modal-edit-record').classList.remove('show');
        });
        document.getElementById('btn-add-checkup').addEventListener('click', () => this.showCheckupModal());
        document.getElementById('btn-save-checkup').addEventListener('click', () => this.saveCheckup());
        document.getElementById('btn-cancel-checkup').addEventListener('click', () => {
            document.getElementById('modal-add-checkup').classList.remove('show');
        });

        // 添加健康指标按钮 - 跳转到健康趋势页面
        const healthMetricBtn = document.getElementById('btn-add-health-metric');
        if (healthMetricBtn) {
            healthMetricBtn.addEventListener('click', () => {
                TrendsManager.showTrendsPage();
            });
        }

        // 病史选择器
        const diseaseSelect = document.getElementById('edit-disease-select');
        if (diseaseSelect) {
            diseaseSelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (!value) return;
                if (!this._tempDiseases.includes(value)) {
                    this._tempDiseases.push(value);
                    this.renderDiseaseTags();
                }
                e.target.value = '';
            });
        }

        // 过敏选择器
        const allergySelect = document.getElementById('edit-allergy-select');
        if (allergySelect) {
            allergySelect.addEventListener('change', (e) => {
                const value = e.target.value;
                if (!value) return;
                if (!this._tempAllergies.includes(value)) {
                    this._tempAllergies.push(value);
                    this.renderAllergyTags();
                }
                e.target.value = '';
            });
        }
    },

    renderDiseaseTags() {
        const container = document.getElementById('disease-tags-container');
        if (!container) return;
        container.innerHTML = this._tempDiseases.map((d, i) => `
            <span class="selected-tag">${d}<span class="tag-remove" data-index="${i}" data-type="disease">✕</span></span>
        `).join('');

        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this._tempDiseases.splice(index, 1);
                this.renderDiseaseTags();
            });
        });
    },

    renderAllergyTags() {
        const container = document.getElementById('allergy-tags-container');
        if (!container) return;
        container.innerHTML = this._tempAllergies.map((a, i) => `
            <span class="selected-tag">${a}<span class="tag-remove" data-index="${i}" data-type="allergy">✕</span></span>
        `).join('');

        container.querySelectorAll('.tag-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this._tempAllergies.splice(index, 1);
                this.renderAllergyTags();
            });
        });
    },

    showRecordPage() {
        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!member) return;

        const record = AppState.healthRecords[member.id] || {};

        document.getElementById('record-name').textContent = member.name;
        document.getElementById('record-gender').textContent = member.gender === 'male' ? '男' : '女';
        document.getElementById('record-age').textContent = Utils.calculateAge(member.birthdate);
        document.getElementById('record-blood').textContent = record.bloodType || '未知';
        document.getElementById('record-height').textContent = record.height ? record.height + ' cm' : '-';
        document.getElementById('record-weight').textContent = record.weight ? record.weight + ' kg' : '-';

        // 计算BMI
        if (record.height && record.weight) {
            const h = parseFloat(record.height) / 100;
            const w = parseFloat(record.weight);
            const bmi = (w / (h * h)).toFixed(1);
            document.getElementById('record-bmi').textContent = bmi;
        } else {
            document.getElementById('record-bmi').textContent = '-';
        }

        // 渲染病史 - 有记录才显示区域
        const diseaseSection = document.getElementById('section-disease');
        const diseaseList = document.getElementById('disease-list');
        const diseases = record.diseases || [];
        if (diseases.length > 0) {
            diseaseSection.style.display = 'block';
            diseaseList.innerHTML = diseases.map(d => `<span class="tag">${d}</span>`).join('');
        } else {
            diseaseSection.style.display = 'none';
        }

        // 渲染过敏 - 有记录才显示区域
        const allergySection = document.getElementById('section-allergy');
        const allergyList = document.getElementById('allergy-list');
        const allergies = record.allergies || [];
        if (allergies.length > 0) {
            allergySection.style.display = 'block';
            allergyList.innerHTML = allergies.map(a => `<span class="tag allergy">${a}</span>`).join('');
        } else {
            allergySection.style.display = 'none';
        }

        // 渲染体检记录
        const checkupList = document.getElementById('checkup-list');
        const checkups = AppState.checkups[member.id] || [];
        checkupList.innerHTML = checkups.map(c => `
            <div class="checkup-item">
                <div class="checkup-date">${c.date}</div>
                <div class="checkup-hospital">${c.hospital}</div>
                <div class="checkup-result">${c.result}</div>
            </div>
        `).join('') || '<span style="color:#bbb;font-size:13px">暂无记录</span>';

        // 渲染健康指标记录
        const healthMetricsList = document.getElementById('health-metrics-list');
        const metrics = AppState.healthMetrics[member.id] || [];
        if (metrics.length > 0) {
            healthMetricsList.innerHTML = metrics.map(m => {
                const parts = [];
                if (m.weight) parts.push(`体重 ${m.weight}kg`);
                if (m.height) parts.push(`身高 ${m.height}cm`);
                if (m.systolic && m.diastolic) parts.push(`血压 ${m.systolic}/${m.diastolic}`);
                if (m.bloodSugar) parts.push(`血糖 ${m.bloodSugar}`);
                if (m.heartRate) parts.push(`心率 ${m.heartRate}`);
                return `<div class="health-metric-item"><span class="metric-date">${m.date}</span><span class="metric-values">${parts.join(' · ')}</span></div>`;
            }).join('');
        } else {
            healthMetricsList.innerHTML = '<span style="color:#bbb;font-size:13px">暂无记录</span>';
        }

        Navigation.goTo('record-page');
    },

    showEditModal() {
        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        const record = AppState.healthRecords[member.id] || {};

        document.getElementById('edit-blood-type').value = record.bloodType || '';
        document.getElementById('edit-height').value = record.height || '';
        document.getElementById('edit-weight').value = record.weight || '';

        this._tempDiseases = [...(record.diseases || [])];
        this._tempAllergies = [...(record.allergies || [])];
        this.renderDiseaseTags();
        this.renderAllergyTags();

        document.getElementById('modal-edit-record').classList.add('show');
    },

    saveRecord() {
        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        const bloodType = document.getElementById('edit-blood-type').value;
        const height = document.getElementById('edit-height').value;
        const weight = document.getElementById('edit-weight').value;
        const diseases = [...this._tempDiseases];
        const allergies = [...this._tempAllergies];

        AppState.healthRecords[member.id] = { bloodType, height, weight, diseases, allergies };
        Storage.set('healthRecords', AppState.healthRecords);

        document.getElementById('modal-edit-record').classList.remove('show');
        this.showRecordPage();
        Utils.showToast('保存成功');
    },

    showCheckupModal() {
        document.getElementById('checkup-date').value = Utils.getToday();
        document.getElementById('checkup-hospital').value = '';
        document.getElementById('checkup-result').value = '';
        document.getElementById('modal-add-checkup').classList.add('show');
    },

    saveCheckup() {
        const date = document.getElementById('checkup-date').value;
        const hospital = document.getElementById('checkup-hospital').value.trim();
        const result = document.getElementById('checkup-result').value.trim();

        if (!date || !hospital) {
            Utils.showToast('请填写完整信息');
            return;
        }

        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!AppState.checkups[member.id]) {
            AppState.checkups[member.id] = [];
        }

        AppState.checkups[member.id].unshift({ date, hospital, result });
        Storage.set('checkups', AppState.checkups);

        document.getElementById('modal-add-checkup').classList.remove('show');
        this.showRecordPage();
        Utils.showToast('添加成功');
    }
};

// ===== 报告解读 =====
const ReportManager = {
    init() {
        document.querySelectorAll('.feature-card[data-feature="report"]').forEach(card => {
            card.addEventListener('click', () => Navigation.goTo('report-page'));
        });

        const uploadArea = document.getElementById('report-upload-area');
        const fileInput = document.getElementById('report-file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'report'));

        document.getElementById('btn-analyze-report').addEventListener('click', () => this.analyzeReport());
    },

    handleFileSelect(e, type) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (type === 'report') {
                document.getElementById('report-image').src = event.target.result;
                document.getElementById('report-upload-area').style.display = 'none';
                document.getElementById('report-preview').style.display = 'block';
                document.getElementById('report-result').style.display = 'none';
            } else {
                document.getElementById('identify-image').src = event.target.result;
                document.getElementById('identify-upload-area').style.display = 'none';
                document.getElementById('identify-preview').style.display = 'block';
                document.getElementById('identify-result').style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    },

    analyzeReport() {
        Utils.showToast('AI 正在分析中...', '🤖');

        setTimeout(() => {
            const itemsContainer = document.getElementById('report-items');
            itemsContainer.innerHTML = MockReportData.items.map(item => `
                <div class="report-item ${item.status}">
                    <div class="report-item-name">${item.name}</div>
                    <div class="report-item-value">${item.value} <span style="font-size:14px;color:#888">${item.unit}</span></div>
                    <div class="report-item-range">参考范围：${item.range} ${item.unit}</div>
                    <div class="report-item-desc">${item.desc}</div>
                </div>
            `).join('');

            const summaryEl = document.getElementById('report-summary');
            summaryEl.textContent = MockReportData.summary;
            document.getElementById('report-date').textContent = Utils.getToday();

            document.getElementById('report-preview').style.display = 'none';
            document.getElementById('report-result').style.display = 'block';

            Utils.showToast('分析完成');
        }, 1500);
    }
};

// ===== 药品识别（AI 图片分析） =====
const IdentifyManager = {
    currentMedicine: null,
    currentImageSrc: null,
    fromMedicinePage: false,

    init() {
        document.querySelectorAll('.feature-card[data-feature="identify"]').forEach(card => {
            card.addEventListener('click', () => this.enterIdentifyPage());
        });

        const uploadArea = document.getElementById('identify-upload-area');
        const fileInput = document.getElementById('identify-file-input');

        uploadArea.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                this.currentImageSrc = event.target.result;
                this.startAIAnalysis(event.target.result);
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        });

        document.getElementById('btn-speak-info').addEventListener('click', () => this.speakMedicineInfo());
        document.getElementById('btn-add-to-medicine').addEventListener('click', () => this.addToMedicineList());
        document.getElementById('btn-retry-identify').addEventListener('click', () => this.resetPage());
        document.getElementById('btn-re-identify').addEventListener('click', () => this.resetPage());
    },

    enterIdentifyPage() {
        this.fromMedicinePage = false;
        this.resetPage();
        Navigation.goTo('identify-page');
    },

    enterFromMedicinePage() {
        this.fromMedicinePage = true;
        this.resetPage();
        Navigation.goTo('identify-page');
    },

    resetPage() {
        this.currentMedicine = null;
        this.currentImageSrc = null;
        document.getElementById('identify-upload-area').style.display = 'block';
        document.getElementById('identify-loading').style.display = 'none';
        document.getElementById('identify-not-medicine').style.display = 'none';
        document.getElementById('identify-result').style.display = 'none';
        document.getElementById('identify-preview-inline').style.display = 'none';
        document.getElementById('confidence-fill').style.width = '0%';
        document.getElementById('loading-progress-fill').style.width = '0%';
    },

    startAIAnalysis(imageSrc) {
        document.getElementById('identify-upload-area').style.display = 'none';
        document.getElementById('identify-not-medicine').style.display = 'none';
        document.getElementById('identify-result').style.display = 'none';
        document.getElementById('identify-loading').style.display = 'block';
        document.getElementById('loading-progress-fill').style.width = '5%';
        document.getElementById('loading-step-text').textContent = '正在启动 OCR 引擎，首次使用需下载语言包（约 10MB）...';

        this.analyzeImageForMedicine(imageSrc).then(result => {
            document.getElementById('loading-progress-fill').style.width = '100%';

            setTimeout(() => {
                document.getElementById('identify-loading').style.display = 'none';

                if (result.isMedicine) {
                    this.showMedicineResult(result);
                } else {
                    this.showNotMedicineResult();
                }
            }, 400);
        });
    },

    async analyzeImageForMedicine(imageSrc) {
        document.getElementById('loading-step-text').textContent = '正在初始化 OCR 引擎...';
        document.getElementById('loading-progress-fill').style.width = '10%';

        try {
            const result = await Tesseract.recognize(
                imageSrc,
                'chi_sim+eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            const progress = Math.round(m.progress * 100);
                            document.getElementById('loading-progress-fill').style.width = (10 + progress * 0.85) + '%';
                            document.getElementById('loading-step-text').textContent = `正在识别文字... ${progress}%`;
                        } else if (m.status === 'loading language traineddata') {
                            document.getElementById('loading-step-text').textContent = '正在加载语言模型...';
                        }
                    }
                }
            );

            const recognizedText = result.data.text || '';
            console.log('OCR 识别结果:', recognizedText);

            return this.analyzeRecognizedText(recognizedText);

        } catch (error) {
            console.error('OCR 识别失败:', error);
            return {
                isMedicine: false,
                confidence: 0,
                error: 'OCR 识别失败'
            };
        }
    },

    analyzeRecognizedText(text) {
        if (!text || text.trim().length < 2) {
            return { isMedicine: false, confidence: 0 };
        }

        const normalizedText = text.toLowerCase().replace(/\s+/g, '');

        const medicineKeywords = [
            '片', '胶囊', '颗粒', '丸', '注射液', '口服液', '软膏', '栓剂',
            '国药准字', '批准文号', '规格', '用法', '用量', '不良反应',
            'tablet', 'capsule', 'injection', 'mg', 'ml', ' pharmaceutical',
            '制药', '药业', '医药', '药业公司', '制药厂',
            '适应症', '禁忌', '注意事项', '生产日期', '有效期',
            '成分', '性状', '贮藏', '包装'
        ];

        let keywordMatchCount = 0;
        for (const keyword of medicineKeywords) {
            if (normalizedText.includes(keyword.toLowerCase())) {
                keywordMatchCount++;
            }
        }

        if (keywordMatchCount === 0 && text.length < 10) {
            return { isMedicine: false, confidence: 20 };
        }

        const matchResult = this.searchMedicineInText(text);

        if (matchResult) {
            return {
                isMedicine: true,
                confidence: matchResult.confidence,
                medicine: matchResult.medicine
            };
        }

        if (keywordMatchCount >= 2) {
            return {
                isMedicine: true,
                confidence: 50,
                medicine: this.createUnknownMedicine(text)
            };
        }

        return { isMedicine: false, confidence: 30 };
    },

    searchMedicineInText(text) {
        const normalizedText = text.toLowerCase().replace(/\s+/g, '');
        let bestMatch = null;
        let bestScore = 0;

        for (const [name, data] of Object.entries(MedicineDB)) {
            const keywords = data.keywords || [name];
            let score = 0;

            for (const keyword of keywords) {
                const normalizedKeyword = keyword.toLowerCase().trim();

                if (normalizedText.includes(normalizedKeyword)) {
                    score = Math.max(score, 60 + normalizedKeyword.length * 2);
                }

                if (this.fuzzyMatch(normalizedText, normalizedKeyword)) {
                    score = Math.max(score, 40);
                }
            }

            if (data.generic && normalizedText.includes(data.generic.toLowerCase().replace(/\s+/g, ''))) {
                score += 30;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = { name, ...data };
            }
        }

        if (bestMatch && bestScore >= 40) {
            return {
                medicine: bestMatch,
                confidence: Math.min(99, Math.round(bestScore))
            };
        }
        return null;
    },

    fuzzyMatch(text, keyword) {
        if (keyword.length < 2) return false;

        let textIndex = 0;
        for (let i = 0; i < keyword.length; i++) {
            const char = keyword[i];
            const foundIndex = text.indexOf(char, textIndex);
            if (foundIndex === -1) {
                const similarChars = this.getSimilarChars(char);
                let found = false;
                for (const simChar of similarChars) {
                    const simIndex = text.indexOf(simChar, textIndex);
                    if (simIndex !== -1) {
                        textIndex = simIndex + 1;
                        found = true;
                        break;
                    }
                }
                if (!found) return false;
            } else {
                textIndex = foundIndex + 1;
            }
        }
        return true;
    },

    getSimilarChars(char) {
        const similarMap = {
            '氨': ['安', '胺'],
            '氯': ['绿', '录'],
            '地': ['的', '底'],
            '平': ['萍', '坪'],
            '苯': ['本', '笨'],
            '磺': ['黄', '磺'],
            '酸': ['酸'],
            '片': ['片'],
            '阿': ['啊'],
            '斯': ['思', '丝'],
            '匹': ['皮'],
            '林': ['林'],
            '维': ['维', '唯'],
            '生': ['生'],
            '素': ['素'],
            'c': ['c', 'c'],
            '托': ['拖'],
            '伐': ['阀'],
            '他': ['它', '她'],
            '汀': ['丁'],
            '奥': ['澳', '傲'],
            '美': ['美'],
            '拉': ['啦'],
            '唑': ['坐', '座'],
            '布': ['布'],
            '洛': ['落'],
            '芬': ['分'],
            '头': ['头'],
            '孢': ['包', '孢'],
            '克': ['克'],
            '肟': ['亏', '污'],
            '硝': ['销', '消'],
            '苯': ['本'],
            '格': ['格'],
            '列': ['列'],
            '美': ['美'],
            '脲': ['尿', '脲'],
            '缬': ['鞋', '携'],
            '沙': ['沙'],
            '坦': ['坦'],
            '阿': ['阿'],
            '卡': ['卡'],
            '波': ['波'],
            '糖': ['糖'],
            '二': ['二'],
            '甲': ['甲'],
            '双': ['双'],
            '胍': ['瓜']
        };
        return similarMap[char] || [];
    },

    createUnknownMedicine(text) {
        const nameMatch = text.match(/([\u4e00-\u9fa5]{2,8})(?:片|胶囊|颗粒|丸)/);
        const name = nameMatch ? nameMatch[0] : '未知药品';

        return {
            name: name,
            generic: name,
            usage: '请查看说明书或咨询医生',
            dosage: '请遵医嘱',
            sideEffects: '请查看说明书',
            contraindication: '请查看说明书',
            precautions: '请遵医嘱使用'
        };
    },

    showMedicineResult(result) {
        this.currentMedicine = result.medicine;

        if (this.currentImageSrc) {
            document.getElementById('identify-image').src = this.currentImageSrc;
            document.getElementById('identify-preview-inline').style.display = 'block';
        }

        document.getElementById('identified-name').textContent = result.medicine.name;
        document.getElementById('identified-generic').textContent = result.medicine.generic;
        document.getElementById('identified-usage').textContent = result.medicine.usage;
        document.getElementById('identified-dosage').textContent = result.medicine.dosage;
        document.getElementById('identified-side-effects').textContent = result.medicine.sideEffects;
        document.getElementById('identified-contraindication').textContent = result.medicine.contraindication;
        document.getElementById('identified-precautions').textContent = result.medicine.precautions;

        const confidenceFill = document.getElementById('confidence-fill');
        const confidenceValue = document.getElementById('confidence-value');
        confidenceValue.textContent = result.confidence + '%';
        setTimeout(() => { confidenceFill.style.width = result.confidence + '%'; }, 100);

        if (result.confidence >= 80) {
            confidenceFill.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
            confidenceValue.style.color = '#4caf50';
        } else if (result.confidence >= 50) {
            confidenceFill.style.background = 'linear-gradient(90deg, #ff9800, #ffc107)';
            confidenceValue.style.color = '#ff9800';
        } else {
            confidenceFill.style.background = 'linear-gradient(90deg, #f44336, #ff5722)';
            confidenceValue.style.color = '#f44336';
        }

        document.getElementById('identify-result').style.display = 'block';

        this.addToMedicineDB(result.medicine);

        this.speakText(`识别成功！这是${result.medicine.name}，${result.medicine.generic}。${result.medicine.usage}。`);
    },

    showNotMedicineResult() {
        document.getElementById('identify-not-medicine').style.display = 'block';
        this.speakText('未识别到药品，这张图片中不包含药品信息，请重新拍摄药品包装或说明书。');
    },

    addToMedicineDB(medicine) {
        if (!MedicineDB[medicine.name]) {
            MedicineDB[medicine.name] = {
                keywords: [medicine.name],
                generic: medicine.generic,
                usage: medicine.usage,
                dosage: medicine.dosage,
                sideEffects: medicine.sideEffects,
                contraindication: medicine.contraindication,
                precautions: medicine.precautions
            };
            const customDB = Storage.get('customMedicineDB') || {};
            customDB[medicine.name] = MedicineDB[medicine.name];
            Storage.set('customMedicineDB', customDB);
            Utils.showToast('新药品已自动加入数据库');
        }
    },

    speakText(text) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
        }
    },

    speakMedicineInfo() {
        if (!this.currentMedicine) return;

        const text = `${this.currentMedicine.name}，${this.currentMedicine.generic}。${this.currentMedicine.usage}。用法用量：${this.currentMedicine.dosage}。注意事项：${this.currentMedicine.precautions}`;
        this.speakText(text);
        Utils.showToast('正在语音播报...', '🔊');
    },

    addToMedicineList() {
        if (!this.currentMedicine) return;

        this.addToMedicineDB(this.currentMedicine);

        if (this.fromMedicinePage) {
            MedicineManager.fillFromAI(this.currentMedicine);
            Navigation.goTo('medicine-page');
            Utils.showToast('药品信息已自动填入，请确认后保存');
        } else {
            const medicine = {
                id: Utils.generateId(),
                memberId: AppState.currentMemberId,
                name: this.currentMedicine.name,
                dosage: this.currentMedicine.dosage,
                times: ['morning'],
                timeDetails: { morning: '08:00' },
                notes: this.currentMedicine.precautions,
                startDate: Utils.getToday(),
                endDate: '',
                completed: false
            };

            AppState.medicines.push(medicine);
            Storage.set('medicines', AppState.medicines);

            Navigation.goBack();
            MemberManager.updateOverview();
            MemberManager.renderMedicineList();
            FamilyHealthShare.render();
            Utils.showToast('已添加到用药清单');
        }
    }
};

// ===== 用药提醒语音播报 =====
const MedicineReminder = {
    speakReminder(medicine) {
        if (!medicine) return;

        const now = new Date();
        const currentHour = now.getHours();
        let timeDesc = '';

        if (currentHour >= 5 && currentHour < 11) {
            timeDesc = '早晨';
        } else if (currentHour >= 11 && currentHour < 14) {
            timeDesc = '中午';
        } else if (currentHour >= 14 && currentHour < 20) {
            timeDesc = '晚上';
        } else {
            timeDesc = '睡前';
        }

        const text = `提醒：${timeDesc}该吃药了！请服用${medicine.name}，${medicine.dosage}。${medicine.notes ? '注意事项：' + medicine.notes : ''}`;

        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);

            Utils.showToast(`🔊 ${timeDesc}该吃药了：${medicine.name}`);
        } else {
            Utils.showToast(`${timeDesc}该吃药了：${medicine.name}`);
        }
    }
};

// ===== 设置管理 =====
const SettingsManager = {
    VERSION: '2.0.0',

    init() {
        document.querySelectorAll('.feature-card[data-feature="settings"]').forEach(card => {
            card.addEventListener('click', () => this.showSettingsPage());
        });

        const page = document.getElementById('settings-page');
        if (page) {
            page.querySelectorAll('.btn-back').forEach(btn => {
                btn.addEventListener('click', () => Navigation.goBack());
            });
        }

        const exportBtn = document.getElementById('btn-export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const importBtn = document.getElementById('btn-import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.addEventListener('change', (e) => this.importData(e));
                input.click();
            });
        }

        const clearBtn = document.getElementById('btn-clear-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllData());
        }

        const setContactBtn = document.getElementById('btn-set-emergency-contact');
        if (setContactBtn) {
            setContactBtn.addEventListener('click', () => this.showEmergencyContactModal());
        }

        const saveContactBtn = document.getElementById('btn-save-emergency-contact');
        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', () => {
                SOSManager.saveContact();
                this.renderEmergencyContact();
            });
        }
    },

    showSettingsPage() {
        const versionEl = document.getElementById('settings-version');
        if (versionEl) {
            versionEl.textContent = this.VERSION;
        }
        this.renderEmergencyContact();
        Navigation.goTo('settings-page');
    },

    renderEmergencyContact() {
        SOSManager.renderContactInfo();
    },

    showEmergencyContactModal() {
        const modal = document.getElementById('modal-emergency-contact');
        if (modal) {
            const nameInput = document.getElementById('emergency-contact-name');
            const phoneInput = document.getElementById('emergency-contact-phone');
            if (AppState.emergencyContact) {
                if (nameInput) nameInput.value = AppState.emergencyContact.name || '';
                if (phoneInput) phoneInput.value = AppState.emergencyContact.phone || '';
            } else {
                if (nameInput) nameInput.value = '';
                if (phoneInput) phoneInput.value = '';
            }
            modal.classList.add('show');
        } else {
            const name = prompt('紧急联系人姓名:', AppState.emergencyContact?.name || '');
            if (name === null) return;
            const phone = prompt('紧急联系人电话:', AppState.emergencyContact?.phone || '');
            if (phone === null) return;

            if (!name.trim() || !phone.trim()) {
                Utils.showToast('请填写完整信息');
                return;
            }

            AppState.emergencyContact = { name: name.trim(), phone: phone.trim() };
            Storage.set('emergencyContact', AppState.emergencyContact);
            SOSManager.renderContactInfo();
            Utils.showToast('紧急联系人已保存');
        }
    },

    exportData() {
        const data = {
            familyName: AppState.familyName,
            members: AppState.members,
            medicines: AppState.medicines,
            healthRecords: AppState.healthRecords,
            checkups: AppState.checkups,
            healthMetrics: AppState.healthMetrics,
            emergencyContact: AppState.emergencyContact,
            customMedicineDB: Storage.get('customMedicineDB') || {},
            exportDate: new Date().toISOString(),
            version: this.VERSION
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-manager-backup-${Utils.getToday()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        Utils.showToast('数据导出成功');
    },

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (!confirm('导入数据将覆盖现有数据，是否继续？')) {
                    e.target.value = '';
                    return;
                }

                if (data.members) {
                    AppState.members = data.members;
                    Storage.set('members', data.members);
                }
                if (data.medicines) {
                    AppState.medicines = data.medicines;
                    Storage.set('medicines', data.medicines);
                }
                if (data.healthRecords) {
                    AppState.healthRecords = data.healthRecords;
                    Storage.set('healthRecords', data.healthRecords);
                }
                if (data.checkups) {
                    AppState.checkups = data.checkups;
                    Storage.set('checkups', data.checkups);
                }
                if (data.healthMetrics) {
                    AppState.healthMetrics = data.healthMetrics;
                    Storage.set('healthMetrics', data.healthMetrics);
                }
                if (data.emergencyContact) {
                    AppState.emergencyContact = data.emergencyContact;
                    Storage.set('emergencyContact', data.emergencyContact);
                }
                if (data.customMedicineDB) {
                    Storage.set('customMedicineDB', data.customMedicineDB);
                    Object.assign(MedicineDB, data.customMedicineDB);
                }
                if (data.familyName) {
                    AppState.familyName = data.familyName;
                }

                MemberManager.renderMemberTabs();
                if (AppState.members.length > 0) {
                    MemberManager.loadMemberData(AppState.members[0].id);
                }
                FamilyHealthShare.render();

                Utils.showToast('数据导入成功');
            } catch (err) {
                Utils.showToast('数据导入失败：文件格式错误');
                console.error('Import error:', err);
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    },

    clearAllData() {
        if (!confirm('确定要清除所有数据吗？此操作不可恢复！')) {
            return;
        }
        if (!confirm('再次确认：所有家庭成员、用药记录、健康档案将被永久删除！')) {
            return;
        }

        const keys = [
            'health_members', 'health_medicines', 'health_records',
            'health_checkups', 'health_metrics', 'health_emergency_contact',
            'health_custom_medicine_db', 'health_settings'
        ];
        keys.forEach(k => localStorage.removeItem(k));

        AppState.familyName = '';
        AppState.members = [];
        AppState.currentMemberId = null;
        AppState.medicines = [];
        AppState.healthRecords = {};
        AppState.checkups = {};
        AppState.healthMetrics = {};
        AppState.emergencyContact = null;

        Navigation.goTo('login-page');
        Utils.showToast('所有数据已清除');
    }
};

// ===== 健康趋势 =====
const TrendsManager = {
    chart: null,
    currentMetric: 'weight',

    init() {
        document.querySelectorAll('.feature-card[data-feature="trends"]').forEach(card => {
            card.addEventListener('click', () => this.showTrendsPage());
        });

        const page = document.getElementById('trends-page');
        if (page) {
            page.querySelectorAll('.btn-back').forEach(btn => {
                btn.addEventListener('click', () => Navigation.goBack());
            });
        }

        const addBtn = document.getElementById('btn-add-trend-record');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.showAddMetricModal());
        }

        document.querySelectorAll('.trend-metric-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const metric = e.currentTarget.dataset.metric;
                if (metric) this.switchMetric(metric);
            });
        });

        // 添加健康指标弹窗事件
        const saveMetricBtn = document.getElementById('btn-save-metric');
        if (saveMetricBtn) {
            saveMetricBtn.addEventListener('click', () => this.saveMetricFromModal());
        }

        const cancelMetricBtn = document.getElementById('btn-cancel-metric');
        if (cancelMetricBtn) {
            cancelMetricBtn.addEventListener('click', () => this.hideAddMetricModal());
        }

        const closeMetricBtn = document.getElementById('btn-close-add-metric');
        if (closeMetricBtn) {
            closeMetricBtn.addEventListener('click', () => this.hideAddMetricModal());
        }
    },

    showTrendsPage() {
        Navigation.goTo('trends-page');
        this.switchMetric(this.currentMetric);
    },

    switchMetric(metricType) {
        this.currentMetric = metricType;

        document.querySelectorAll('.trend-metric-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.metric === metricType);
        });

        this.renderChart();
        this.updateStats();
    },

    renderChart() {
        const canvas = document.getElementById('health-trend-chart');
        if (!canvas) return;

        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!member) return;

        const metrics = AppState.healthMetrics[member.id] || [];
        if (metrics.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const sorted = [...metrics].sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = sorted.map(m => m.date);

        let datasets = [];
        if (this.currentMetric === 'weight') {
            datasets = [{
                label: '体重 (kg)',
                data: sorted.map(m => m.weight),
                borderColor: '#4caf50',
                backgroundColor: '#4caf5020',
                fill: true,
                tension: 0.3
            }];
        } else if (this.currentMetric === 'blood-pressure') {
            datasets = [
                {
                    label: '收缩压 (mmHg)',
                    data: sorted.map(m => m.systolic),
                    borderColor: '#f44336',
                    backgroundColor: '#f4433620',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: '舒张压 (mmHg)',
                    data: sorted.map(m => m.diastolic),
                    borderColor: '#2196f3',
                    backgroundColor: '#2196f320',
                    fill: true,
                    tension: 0.3
                }
            ];
        } else if (this.currentMetric === 'blood-sugar') {
            datasets = [{
                label: '血糖 (mmol/L)',
                data: sorted.map(m => m.bloodSugar),
                borderColor: '#ff9800',
                backgroundColor: '#ff980020',
                fill: true,
                tension: 0.3
            }];
        } else if (this.currentMetric === 'heart-rate') {
            datasets = [{
                label: '心率 (bpm)',
                data: sorted.map(m => m.heartRate),
                borderColor: '#9c27b0',
                backgroundColor: '#9c27b020',
                fill: true,
                tension: 0.3
            }];
        }

        const ctx = canvas.getContext('2d');
        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    },

    updateStats() {
        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!member) return;

        const metrics = AppState.healthMetrics[member.id] || [];
        const sorted = [...metrics].sort((a, b) => new Date(a.date) - new Date(a.date));

        const latestEl = document.getElementById('trend-latest');
        const averageEl = document.getElementById('trend-average');
        const changeEl = document.getElementById('trend-change');

        if (sorted.length === 0) {
            if (latestEl) latestEl.textContent = '-';
            if (averageEl) averageEl.textContent = '-';
            if (changeEl) changeEl.textContent = '-';
            return;
        }

        const latest = sorted[sorted.length - 1];
        let values = [];
        let latestValue = null;

        if (this.currentMetric === 'weight') {
            values = sorted.map(m => m.weight).filter(v => v != null);
            latestValue = latest.weight;
        } else if (this.currentMetric === 'blood-pressure') {
            values = sorted.map(m => m.systolic).filter(v => v != null);
            latestValue = latest.systolic;
        } else if (this.currentMetric === 'blood-sugar') {
            values = sorted.map(m => m.bloodSugar).filter(v => v != null);
            latestValue = latest.bloodSugar;
        } else if (this.currentMetric === 'heart-rate') {
            values = sorted.map(m => m.heartRate).filter(v => v != null);
            latestValue = latest.heartRate;
        }

        if (latestEl) latestEl.textContent = latestValue != null ? latestValue : '-';

        if (averageEl) {
            const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : '-';
            averageEl.textContent = avg;
        }

        if (changeEl) {
            if (values.length >= 2) {
                const change = (values[values.length - 1] - values[0]).toFixed(1);
                const sign = change > 0 ? '+' : '';
                changeEl.textContent = `${sign}${change}`;
            } else {
                changeEl.textContent = '-';
            }
        }
    },

    showAddMetricModal() {
        document.getElementById('metric-date').value = Utils.getToday();
        document.getElementById('metric-weight').value = '';
        document.getElementById('metric-height').value = '';
        document.getElementById('metric-systolic').value = '';
        document.getElementById('metric-diastolic').value = '';
        document.getElementById('metric-blood-sugar').value = '';
        document.getElementById('metric-heart-rate').value = '';
        document.getElementById('modal-add-metric').classList.add('show');
    },

    hideAddMetricModal() {
        document.getElementById('modal-add-metric').classList.remove('show');
    },

    saveMetricFromModal() {
        const date = document.getElementById('metric-date').value;
        const weight = parseFloat(document.getElementById('metric-weight').value) || null;
        const height = parseFloat(document.getElementById('metric-height').value) || null;
        const systolic = parseFloat(document.getElementById('metric-systolic').value) || null;
        const diastolic = parseFloat(document.getElementById('metric-diastolic').value) || null;
        const bloodSugar = parseFloat(document.getElementById('metric-blood-sugar').value) || null;
        const heartRate = parseFloat(document.getElementById('metric-heart-rate').value) || null;

        this.saveMetric(date, weight, height, systolic, diastolic, bloodSugar, heartRate);
        this.hideAddMetricModal();
    },

    saveMetric(date, weight, height, systolic, diastolic, bloodSugar, heartRate) {
        if (!date) {
            Utils.showToast('请输入日期');
            return;
        }

        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!member) return;

        if (!AppState.healthMetrics[member.id]) {
            AppState.healthMetrics[member.id] = [];
        }

        const existingIndex = AppState.healthMetrics[member.id].findIndex(m => m.date === date);
        const metric = { date, weight, height, systolic, diastolic, bloodSugar, heartRate };

        if (existingIndex >= 0) {
            AppState.healthMetrics[member.id][existingIndex] = metric;
        } else {
            AppState.healthMetrics[member.id].push(metric);
        }

        Storage.set('healthMetrics', AppState.healthMetrics);

        this.renderChart();
        this.updateStats();
        MemberManager.updateOverview();
        Utils.showToast('保存成功');
    }
};

// ===== 紧急功能 =====
const SOSManager = {
    init() {
        const sosBtn = document.getElementById('btn-sos');
        if (sosBtn) {
            sosBtn.addEventListener('click', () => this.showSOSModal());
        }
    },

    showSOSModal() {
        if (!AppState.emergencyContact) {
            if (confirm('尚未设置紧急联系人，是否前往设置？')) {
                Navigation.goTo('settings-page');
            }
            return;
        }

        const { name, phone } = AppState.emergencyContact;
        if (confirm(`紧急联系人：${name}\n电话：${phone}\n\n是否立即拨打？`)) {
            this.callEmergency();
        }
    },

    saveContact() {
        const nameInput = document.getElementById('emergency-contact-name');
        const phoneInput = document.getElementById('emergency-contact-phone');
        const name = nameInput ? nameInput.value.trim() : '';
        const phone = phoneInput ? phoneInput.value.trim() : '';

        if (!name || !phone) {
            Utils.showToast('请填写完整信息');
            return;
        }

        AppState.emergencyContact = { name, phone };
        Storage.set('emergencyContact', AppState.emergencyContact);
        this.renderContactInfo();
        Utils.showToast('紧急联系人已保存');
    },

    renderContactInfo() {
        const displayEl = document.getElementById('emergency-contact-display');
        if (!displayEl) return;

        if (AppState.emergencyContact) {
            displayEl.innerHTML = `
                <div class="contact-card">
                    <div class="contact-name">${AppState.emergencyContact.name}</div>
                    <div class="contact-phone">${AppState.emergencyContact.phone}</div>
                </div>
            `;
        } else {
            displayEl.innerHTML = '<p style="color:#bbb;font-size:13px">尚未设置紧急联系人</p>';
        }
    },

    callEmergency() {
        if (!AppState.emergencyContact || !AppState.emergencyContact.phone) {
            Utils.showToast('请先设置紧急联系人');
            return;
        }
        window.location.href = `tel:${AppState.emergencyContact.phone}`;
    }
};

// ===== 药品冲突检测 =====
const DrugConflictChecker = {
    checkConflicts(newDrugName, memberId) {
        const conflicts = [];
        const memberMedicines = AppState.medicines.filter(m => m.memberId === memberId && !m.completed);

        for (const rule of DrugConflictRules) {
            const newDrugMatch = rule.drugs.find(d =>
                newDrugName.includes(d) || d.includes(newDrugName)
            );
            if (!newDrugMatch) continue;

            for (const existing of memberMedicines) {
                const existingMatch = rule.drugs.find(d =>
                    existing.name.includes(d) || d.includes(existing.name)
                );
                if (existingMatch && existingMatch !== newDrugMatch) {
                    conflicts.push({
                        existingDrug: existing.name,
                        newDrug: newDrugName,
                        level: rule.level,
                        reason: rule.reason
                    });
                }
            }
        }

        return conflicts;
    },

    checkAllConflicts(memberId) {
        const conflicts = [];
        const memberMedicines = AppState.medicines.filter(m => m.memberId === memberId && !m.completed);

        for (let i = 0; i < memberMedicines.length; i++) {
            for (let j = i + 1; j < memberMedicines.length; j++) {
                const drugA = memberMedicines[i].name;
                const drugB = memberMedicines[j].name;

                for (const rule of DrugConflictRules) {
                    const matchA = rule.drugs.find(d => drugA.includes(d) || d.includes(drugA));
                    const matchB = rule.drugs.find(d => drugB.includes(d) || d.includes(drugB));
                    if (matchA && matchB && matchA !== matchB) {
                        conflicts.push({
                            drugA: drugA,
                            drugB: drugB,
                            level: rule.level,
                            reason: rule.reason
                        });
                    }
                }
            }
        }

        return conflicts;
    }
};

// ===== 家庭健康共享 =====
const FamilyHealthShare = {
    render() {
        const container = document.getElementById('family-health-share');
        if (!container) return;

        if (AppState.members.length === 0) {
            container.innerHTML = '';
            return;
        }

        const html = AppState.members.map(member => {
            const memberMedicines = AppState.medicines.filter(m => m.memberId === member.id);
            const total = memberMedicines.length;
            const completed = memberMedicines.filter(m => m.completed).length;
            const pending = total - completed;
            const isActive = member.id === AppState.currentMemberId;

            let statusColor = '#4caf50';
            if (pending > 0) statusColor = '#ff9800';
            if (pending > 2) statusColor = '#f44336';

            return `
                <div class="family-member-summary ${isActive ? 'active' : ''}" data-id="${member.id}">
                    <span class="family-member-avatar">${member.avatar}</span>
                    <div class="family-member-info">
                        <div class="family-member-name">${member.name}</div>
                        <div class="family-member-status">
                            ${total > 0
                                ? `<span style="color:${statusColor}">今日用药 ${completed}/${total}</span>`
                                : '<span style="color:#bbb">无用药计划</span>'
                            }
                        </div>
                    </div>
                    ${pending > 0 ? `<span class="family-member-pending">${pending}</span>` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        container.querySelectorAll('.family-member-summary').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.id;
                MemberManager.loadMemberData(id);
            });
        });
    }
};

// ===== 用药完成率统计 =====
const MedicineCompletionRate = {
    calculate(memberId) {
        const memberMedicines = AppState.medicines.filter(m => m.memberId === memberId);
        if (memberMedicines.length === 0) return 100;
        const completed = memberMedicines.filter(m => m.completed).length;
        return Math.round((completed / memberMedicines.length) * 100);
    }
};

// ===== 健康评分计算 =====
const HealthScoreCalculator = {
    calculate(memberId) {
        let score = 60;

        const record = AppState.healthRecords[memberId] || {};
        if (record.bloodType) score += 5;
        if (record.height && record.weight) score += 5;
        if (record.diseases && record.diseases.length > 0) score += 5;

        const completionRate = MedicineCompletionRate.calculate(memberId);
        score += Math.round(completionRate * 0.2);

        const metrics = AppState.healthMetrics[memberId] || [];
        if (metrics.length > 0) {
            score += Math.min(10, metrics.length);
        }

        const checkups = AppState.checkups[memberId] || [];
        if (checkups.length > 0) score += 5;

        return Math.min(100, score);
    }
};

// ===== 疫苗接种管理 =====
const VaccineManager = {
    // 国家免疫规划疫苗时间表（月龄/年龄 -> 疫苗列表）
    schedule: [
        { ageMonths: 0, ageLabel: '出生时', vaccines: ['乙肝疫苗第1剂', '卡介苗'] },
        { ageMonths: 1, ageLabel: '1月龄', vaccines: ['乙肝疫苗第2剂'] },
        { ageMonths: 2, ageLabel: '2月龄', vaccines: ['脊灰灭活疫苗第1剂'] },
        { ageMonths: 3, ageLabel: '3月龄', vaccines: ['脊灰灭活疫苗第2剂', '百白破疫苗第1剂'] },
        { ageMonths: 4, ageLabel: '4月龄', vaccines: ['脊灰减毒活疫苗第3剂', '百白破疫苗第2剂'] },
        { ageMonths: 5, ageLabel: '5月龄', vaccines: ['百白破疫苗第3剂'] },
        { ageMonths: 6, ageLabel: '6月龄', vaccines: ['乙肝疫苗第3剂', 'A群流脑多糖疫苗第1剂'] },
        { ageMonths: 8, ageLabel: '8月龄', vaccines: ['麻腮风疫苗第1剂', '乙脑减毒活疫苗第1剂'] },
        { ageMonths: 9, ageLabel: '9月龄', vaccines: ['A群流脑多糖疫苗第2剂'] },
        { ageMonths: 18, ageLabel: '18月龄', vaccines: ['百白破疫苗第4剂', '麻腮风疫苗第2剂', '甲肝减毒活疫苗第1剂'] },
        { ageMonths: 24, ageLabel: '2岁', vaccines: ['乙脑减毒活疫苗第2剂'] },
        { ageMonths: 36, ageLabel: '3岁', vaccines: ['A群C群流脑多糖疫苗第1剂'] },
        { ageMonths: 48, ageLabel: '4岁', vaccines: ['脊灰减毒活疫苗第4剂'] },
        { ageMonths: 72, ageLabel: '6岁', vaccines: ['白破疫苗', 'A群C群流脑多糖疫苗第2剂'] }
    ],

    // 计算从出生日期到今天的月龄
    getAgeInMonths(birthdate) {
        const birth = new Date(birthdate);
        const today = new Date();
        let months = (today.getFullYear() - birth.getFullYear()) * 12;
        months += today.getMonth() - birth.getMonth();
        if (today.getDate() < birth.getDate()) {
            months--;
        }
        return months;
    },

    // 是否显示疫苗模块（6岁以下）
    shouldShow(birthdate) {
        const ageMonths = this.getAgeInMonths(birthdate);
        return ageMonths < 72; // 6岁 = 72个月
    },

    // 获取即将接种的疫苗
    getUpcoming(birthdate) {
        const ageMonths = this.getAgeInMonths(birthdate);

        // 找到下一个应该接种的疫苗
        for (const item of this.schedule) {
            if (item.ageMonths > ageMonths) {
                const daysUntil = Math.ceil((item.ageMonths - ageMonths) * 30.44);
                return {
                    ...item,
                    daysUntil,
                    isDueNow: false
                };
            } else if (item.ageMonths === ageMonths) {
                return {
                    ...item,
                    daysUntil: 0,
                    isDueNow: true
                };
            }
        }

        return null; // 所有疫苗已完成
    },

    // 获取所有疫苗接种计划（用于弹窗显示）
    getAllSchedule(birthdate) {
        const ageMonths = this.getAgeInMonths(birthdate);
        const memberId = AppState.currentMemberId;
        const records = AppState.vaccineRecords[memberId] || {};

        return this.schedule.map(item => {
            // 检查该年龄段的所有疫苗是否都已手动标记为已完成
            const allVaccinesCompleted = item.vaccines.every(v => records[v] === true);
            const isPastAge = item.ageMonths < ageMonths;
            const isCurrentAge = item.ageMonths === ageMonths;

            let status;
            if (allVaccinesCompleted) {
                status = '已完成';
            } else if (isPastAge || isCurrentAge) {
                status = '需接种';
            } else {
                status = '待接种';
            }

            return {
                ...item,
                status,
                vaccines: item.vaccines.map(v => ({
                    name: v,
                    completed: records[v] === true
                }))
            };
        });
    },

    // 渲染疫苗接种弹窗
    renderVaccineModal(birthdate) {
        const schedule = this.getAllSchedule(birthdate);
        const listEl = document.getElementById('vaccine-schedule-list');
        if (!listEl) return;

        listEl.innerHTML = schedule.map((item, index) => {
            const statusClass = item.status === '已完成' ? 'vaccine-done' :
                               item.status === '需接种' ? 'vaccine-due' : 'vaccine-pending';
            const statusIcon = item.status === '已完成' ? '✅' :
                              item.status === '需接种' ? '🔔' : '⏳';
            const isClickable = item.status === '需接种';
            const clickAttr = isClickable ? `onclick="VaccineManager.markVaccineComplete(${index})" style="cursor:pointer;"` : '';
            const clickHint = isClickable ? '<span style="font-size:11px;color:#dc2626;margin-left:4px;">(点击标记完成)</span>' : '';

            return `
                <div class="vaccine-schedule-item ${statusClass}" ${clickAttr} data-index="${index}">
                    <div class="vaccine-schedule-age">${item.ageLabel}</div>
                    <div class="vaccine-schedule-vaccines">
                        ${item.vaccines.map(v => {
                            const doneClass = v.completed ? 'vaccine-tag-done' : '';
                            return `<span class="vaccine-tag ${doneClass}">${v.completed ? '✅ ' : ''}${v.name}</span>`;
                        }).join('')}
                    </div>
                    <div class="vaccine-schedule-status">${statusIcon} ${item.status}${clickHint}</div>
                </div>
            `;
        }).join('');
    },

    // 标记疫苗接种完成
    markVaccineComplete(scheduleIndex) {
        const member = AppState.members.find(m => m.id === AppState.currentMemberId);
        if (!member || !member.birthdate) return;

        const schedule = this.getAllSchedule(member.birthdate);
        const item = schedule[scheduleIndex];
        if (!item || item.status !== '需接种') return;

        if (!confirm(`确认「${member.name}」已完成以下疫苗接种？\n\n${item.vaccines.map(v => '• ' + v.name).join('\n')}\n\n点击确定标记为已完成。`)) {
            return;
        }

        // 初始化该成员的疫苗记录
        if (!AppState.vaccineRecords[member.id]) {
            AppState.vaccineRecords[member.id] = {};
        }

        // 标记该年龄段所有疫苗为已完成
        item.vaccines.forEach(v => {
            AppState.vaccineRecords[member.id][v.name] = true;
        });

        // 保存到本地存储
        Storage.set('vaccineRecords', AppState.vaccineRecords);

        // 重新渲染弹窗
        this.renderVaccineModal(member.birthdate);

        // 更新概览卡片
        MemberManager.updateOverview();

        Utils.showToast('疫苗接种记录已更新 ✅');
    },

    // 加载疫苗记录
    loadRecords() {
        const records = Storage.get('vaccineRecords');
        if (records) {
            AppState.vaccineRecords = records;
        }
    }
};

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
    // 注意：数据在登录时根据家庭名称加载，这里不预先加载
    // 避免不同家庭数据混淆

    // 初始化所有 Manager
    MemberManager.init();
    MedicineManager.init();
    RecordManager.init();
    ReportManager.init();
    IdentifyManager.init();
    SettingsManager.init();
    TrendsManager.init();
    SOSManager.init();

    // BMI 计算器
    document.querySelectorAll('.feature-card[data-feature="bmi"]').forEach(card => {
        card.addEventListener('click', () => Navigation.goTo('bmi-page'));
    });

    const bmiPage = document.getElementById('bmi-page');
    if (bmiPage) {
        bmiPage.querySelectorAll('.btn-back').forEach(btn => {
            btn.addEventListener('click', () => Navigation.goBack());
        });
    }

    const bmiCalcBtn = document.getElementById('btn-calculate-bmi');
    if (bmiCalcBtn) {
        bmiCalcBtn.addEventListener('click', () => {
            const height = parseFloat(document.getElementById('bmi-height').value);
            const weight = parseFloat(document.getElementById('bmi-weight').value);

            if (!height || !weight || height <= 0 || weight <= 0) {
                Utils.showToast('请输入有效的身高和体重');
                return;
            }

            const heightM = height / 100;
            const bmi = (weight / (heightM * heightM)).toFixed(1);

            let category, statusClass, advice, markerPercent;
            if (bmi < 18.5) {
                category = '偏瘦';
                statusClass = 'underweight';
                advice = '您的体重偏轻，建议适当增加营养摄入，多吃富含蛋白质的食物，配合适量运动增强体质。';
                markerPercent = Math.max(5, (bmi / 18.5) * 18.5);
            } else if (bmi < 24) {
                category = '正常';
                statusClass = 'normal';
                advice = '恭喜！您的体重在正常范围内，请继续保持均衡饮食和规律运动。';
                markerPercent = 18.5 + ((bmi - 18.5) / 5.5) * 5.5;
            } else if (bmi < 28) {
                category = '偏胖';
                statusClass = 'overweight';
                advice = '您的体重略微超标，建议控制饮食热量，增加有氧运动，每周至少运动3次。';
                markerPercent = 24 + ((bmi - 24) / 4) * 4;
            } else {
                category = '肥胖';
                statusClass = 'obese';
                advice = '您的体重已属于肥胖范围，建议咨询医生制定减重计划，注意饮食控制和规律运动。';
                markerPercent = Math.min(95, 28 + ((bmi - 28) / 10) * 10);
            }

            document.getElementById('bmi-value').textContent = bmi;
            const categoryEl = document.getElementById('bmi-category');
            categoryEl.textContent = category;
            categoryEl.className = 'bmi-result-status ' + statusClass;

            document.getElementById('bmi-marker').style.left = markerPercent + '%';
            document.getElementById('bmi-advice').textContent = advice;
            document.getElementById('bmi-result').style.display = 'block';
        });
    }

    // 疫苗接种弹窗事件
    const vaccineItem = document.getElementById('vaccine-overview-item');
    if (vaccineItem) {
        vaccineItem.addEventListener('click', () => {
            const member = AppState.members.find(m => m.id === AppState.currentMemberId);
            if (member && member.birthdate) {
                document.getElementById('vaccine-child-age').textContent =
                    `当前年龄：${Utils.calculateAge(member.birthdate)}`;
                VaccineManager.renderVaccineModal(member.birthdate);
                document.getElementById('modal-vaccine').classList.add('show');
            }
        });
    }

    const closeVaccineBtn = document.getElementById('btn-close-vaccine');
    if (closeVaccineBtn) {
        closeVaccineBtn.addEventListener('click', () => {
            document.getElementById('modal-vaccine').classList.remove('show');
        });
    }

    // 今日用药详情弹窗
    const overviewMedicine = document.getElementById('overview-today-medicine');
    if (overviewMedicine) {
        overviewMedicine.addEventListener('click', () => {
            const member = AppState.members.find(m => m.id === AppState.currentMemberId);
            if (!member) return;

            const allMedicines = AppState.medicines.filter(m => m.memberId === member.id);
            const container = document.getElementById('medicine-detail-list');

            if (allMedicines.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">💊</div>
                        <p>暂无用药记录</p>
                        <p style="font-size:12px">点击"添加"开始记录</p>
                    </div>
                `;
            } else {
                const timeLabels = { morning: '早晨', noon: '中午', evening: '晚上', 'before-bed': '睡前' };
                container.innerHTML = allMedicines.map(m => {
                    const timeTexts = m.times.map(t => timeLabels[t] || t).join('、');
                    const statusClass = m.completed ? 'completed' : 'pending';
                    const statusText = m.completed ? '✅ 已完成' : '⏳ 待服用';
                    const reminderTimes = m.reminderTimes && m.reminderTimes.length > 0
                        ? m.reminderTimes.join('、') : '';

                    return `
                        <div class="medicine-detail-item">
                            <div class="medicine-detail-header">
                                <span class="medicine-detail-name">${m.name}</span>
                                <span class="medicine-detail-status ${statusClass}">${statusText}</span>
                            </div>
                            <div class="medicine-detail-body">
                                <span class="medicine-detail-tag"><span class="tag-icon">🕐</span>${timeTexts}</span>
                                <span class="medicine-detail-tag"><span class="tag-icon">💊</span>${m.dosage}</span>
                                ${reminderTimes ? `<span class="medicine-detail-tag"><span class="tag-icon">⏰</span>${reminderTimes}</span>` : ''}
                                <span class="medicine-detail-tag"><span class="tag-icon">📅</span>${m.startDate}</span>
                                ${m.endDate ? `<span class="medicine-detail-tag"><span class="tag-icon">📌</span>至 ${m.endDate}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('');
            }

            document.getElementById('modal-medicine-detail').classList.add('show');
        });
    }

    const closeMedDetailBtn = document.getElementById('btn-close-medicine-detail');
    if (closeMedDetailBtn) {
        closeMedDetailBtn.addEventListener('click', () => {
            document.getElementById('modal-medicine-detail').classList.remove('show');
        });
    }
});
