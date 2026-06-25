const industries = [
    { id: 'it', name: 'IT外包', icon: 'fa-laptop-code', color: 'bg-blue-500', tags: ['软件开发', '系统集成', '技术服务'], description: '软件外包服务销售培训' },
    { id: 'medical', name: '医疗器械', icon: 'fa-heartbeat', color: 'bg-green-500', tags: ['医疗设备', '耗材', '整体方案'], description: '医疗产品销售培训' },
    { id: 'education', name: '教育培训', icon: 'fa-graduation-cap', color: 'bg-purple-500', tags: ['职业培训', '学历提升', '企业内训'], description: '培训课程销售培训' },
    { id: 'construction', name: '装修设计', icon: 'fa-home', color: 'bg-orange-500', tags: ['家装', '工装', '设计施工'], description: '装修服务销售培训' },
    { id: 'insurance', name: '保险销售', icon: 'fa-shield-alt', color: 'bg-pink-500', tags: ['人寿保险', '财产保险', '团险'], description: '保险产品销售培训' }
];

function getCustomers() {
    const data = localStorage.getItem('customers');
    return data ? JSON.parse(data) : [];
}

function saveCustomers(customers) {
    localStorage.setItem('customers', JSON.stringify(customers));
}

function createCustomer(customerData) {
    const customers = getCustomers();
    const newCustomer = {
        id: Date.now().toString(),
        name: customerData.name,
        company: customerData.company || '',
        phone: customerData.phone || '',
        industry: customerData.industry,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requirement: '',
        answers: {},
        completeness: 0
    };
    customers.push(newCustomer);
    saveCustomers(customers);
    return newCustomer;
}

function updateCustomer(customerId, updates) {
    const customers = getCustomers();
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
        customers[index] = { ...customers[index], ...updates, updatedAt: new Date().toISOString() };
        saveCustomers(customers);
    }
}

function getCustomerById(customerId) {
    const customers = getCustomers();
    return customers.find(c => c.id === customerId);
}

function deleteCustomer(customerId) {
    const customers = getCustomers().filter(c => c.id !== customerId);
    saveCustomers(customers);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return `${minutes}分钟前`;
        }
        return `${hours}小时前`;
    } else if (days === 1) {
        return '昨天';
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }
}

function showCreateCustomerModal() {
    const content = `
        <div id="modal-overlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick="closeModal()">
            <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900">新增客户</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                <form id="customer-form">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">客户名称 *</label>
                        <input type="text" id="customer-name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="请输入客户名称" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                        <input type="text" id="customer-company" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="请输入公司名称">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                        <input type="tel" id="customer-phone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="请输入联系电话">
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-1">所属行业 *</label>
                        <select id="customer-industry" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            <option value="">请选择行业</option>
                            ${industries.map(i => `<option value="${i.id}">${i.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                            取消
                        </button>
                        <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg">
                            确认添加
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', content);
    document.getElementById('customer-form').addEventListener('submit', handleCreateCustomer);
}

function handleCreateCustomer(e) {
    e.preventDefault();
    const name = document.getElementById('customer-name').value;
    const company = document.getElementById('customer-company').value;
    const phone = document.getElementById('customer-phone').value;
    const industry = document.getElementById('customer-industry').value;
    
    createCustomer({ name, company, phone, industry });
    closeModal();
    showToast('客户添加成功', 'success');
    renderHomePage();
}

function editCustomer(customerId) {
    const customer = getCustomerById(customerId);
    if (!customer) return;
    
    const content = `
        <div id="modal-overlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick="closeModal()">
            <div class="bg-white rounded-xl p-6 w-full max-w-md mx-4" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900">编辑客户</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                <form id="customer-form">
                    <input type="hidden" id="customer-id" value="${customer.id}">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">客户名称 *</label>
                        <input type="text" id="customer-name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" value="${customer.name}" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">公司名称</label>
                        <input type="text" id="customer-company" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" value="${customer.company || ''}">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                        <input type="tel" id="customer-phone" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" value="${customer.phone || ''}">
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-1">所属行业 *</label>
                        <select id="customer-industry" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" required>
                            ${industries.map(i => `<option value="${i.id}" ${i.id === customer.industry ? 'selected' : ''}>${i.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" onclick="closeModal()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                            取消
                        </button>
                        <button type="submit" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg">
                            保存修改
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', content);
    document.getElementById('customer-form').addEventListener('submit', handleUpdateCustomer);
}

function handleUpdateCustomer(e) {
    e.preventDefault();
    const id = document.getElementById('customer-id').value;
    const name = document.getElementById('customer-name').value;
    const company = document.getElementById('customer-company').value;
    const phone = document.getElementById('customer-phone').value;
    const industry = document.getElementById('customer-industry').value;
    
    updateCustomer(id, { name, company, phone, industry });
    closeModal();
    showToast('客户信息已更新', 'success');
    renderHomePage();
}

function confirmDeleteCustomer(customerId) {
    const content = `
        <div id="modal-overlay" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick="closeModal()">
            <div class="bg-white rounded-xl p-6 w-full max-w-sm mx-4" onclick="event.stopPropagation()">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                        <i class="fa-solid fa-trash text-red-500 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">确认删除</h3>
                    <p class="text-gray-500">删除后无法恢复，确定要删除此客户吗？</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="closeModal()" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                        取消
                    </button>
                    <button onclick="doDeleteCustomer('${customerId}')" class="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
                        确认删除
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', content);
}

function doDeleteCustomer(customerId) {
    deleteCustomer(customerId);
    closeModal();
    showToast('客户已删除', 'success');
    renderHomePage();
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function selectCustomerForWork(customerId) {
    saveData('currentCustomerId', customerId);
    const customer = getCustomerById(customerId);
    if (customer) {
        saveData('selectedIndustry', customer.industry);
        saveData('customerRequirement', customer.requirement || '');
        saveData('userAnswers', customer.answers || {});
    }
    showToast('已切换到该客户', 'success');
    navigateTo('questioning');
}

const customerTypes = {
    it: [
        { id: 'enterprise', name: '企业客户', description: '有明确IT需求的企业', icon: 'fa-building' },
        { id: 'startup', name: '创业公司', description: '需要技术支持的初创企业', icon: 'fa-rocket' },
        { id: 'government', name: '政府机构', description: '政务信息化项目', icon: 'fa-landmark' }
    ],
    medical: [
        { id: 'hospital', name: '医院', description: '综合性医院或专科医院', icon: 'fa-hospital' },
        { id: 'clinic', name: '诊所', description: '小型诊所或门诊', icon: 'fa-stethoscope' },
        { id: 'pharmacy', name: '药店', description: '连锁药店或医疗器械经销商', icon: 'fa-pills' }
    ],
    education: [
        { id: 'career-change', name: '职场转行', description: '想转行的在职人员', icon: 'fa-briefcase' },
        { id: 'graduate', name: '应届毕业生', description: '刚毕业的大学生', icon: 'fa-graduation-cap' },
        { id: 'skill-upgrade', name: '在职提升', description: '想提升技能的在职人员', icon: 'fa-arrow-up' }
    ],
    construction: [
        { id: 'homeowner', name: '个人业主', description: '需要装修的业主', icon: 'fa-home' },
        { id: 'business', name: '企业客户', description: '商业空间装修需求', icon: 'fa-store' },
        { id: 'developer', name: '开发商', description: '房地产开发商', icon: 'fa-building' }
    ],
    insurance: [
        { id: 'family', name: '家庭客户', description: '需要保障的家庭', icon: 'fa-users' },
        { id: 'individual', name: '个人客户', description: '个人保障需求', icon: 'fa-user' },
        { id: 'enterprise', name: '企业团险', description: '企业员工保障计划', icon: 'fa-building' }
    ]
};

const questionBanks = {
    it: [
        {
            id: 1,
            question: '客户需要哪种IT服务？',
            type: 'multiple',
            options: ['软件开发', '系统集成', '技术支持', '运维服务', '云服务迁移'],
            aiReason: '了解客户核心需求，确定服务类型和报价基础。'
        },
        {
            id: 2,
            question: '客户企业规模是？',
            type: 'single',
            options: ['小微企业(50人以下)', '中小企业(50-200人)', '中大型企业(200-1000人)', '大型企业(1000人以上)'],
            aiReason: '企业规模影响需求复杂度和预算能力。'
        },
        {
            id: 3,
            question: '项目预期周期是多久？',
            type: 'single',
            options: ['1个月内', '1-3个月', '3-6个月', '6个月以上', '长期合作'],
            aiReason: '周期长短影响人力成本和报价策略。'
        },
        {
            id: 4,
            question: '客户是否有指定技术要求？',
            type: 'single',
            options: ['没有特殊要求', '指定技术栈', '需要兼容现有系统', '有特殊安全要求'],
            aiReason: '技术要求影响实施难度和成本。'
        },
        {
            id: 5,
            question: '客户预算范围是多少？',
            type: 'single',
            options: ['5万以下', '5-20万', '20-50万', '50-100万', '100万以上'],
            aiReason: '预算直接决定服务方案和服务深度。'
        },
        {
            id: 6,
            question: '客户之前是否有类似合作？',
            type: 'single',
            options: ['首次合作', '有过小项目合作', '长期合作客户', '正在洽谈中'],
            aiReason: '老客户更容易成单，新客户需要更多信任建立。'
        },
        {
            id: 7,
            question: '是否需要提供售后服务？',
            type: 'single',
            options: ['不需要', '基础质保(3个月)', '标准服务(6个月)', '年度维保', '长期运维'],
            aiReason: '售后服务是重要的增值服务项目。'
        },
        {
            id: 8,
            question: '决策人是谁？',
            type: 'single',
            options: ['老板/总经理', 'IT负责人', '部门经理', '项目负责人'],
            aiReason: '了解决策链有助于制定销售策略。'
        }
    ],
    medical: [
        {
            id: 1,
            question: '客户需要哪种医疗产品？',
            type: 'multiple',
            options: ['医疗设备', '医用耗材', '检验试剂', '手术器械', '整体解决方案'],
            aiReason: '产品类型决定报价基础和销售策略。'
        },
        {
            id: 2,
            question: '目标医院级别？',
            type: 'single',
            options: ['社区医院', '县级医院', '市级医院', '省级医院', '三甲医院'],
            aiReason: '医院级别影响采购流程和预算规模。'
        },
        {
            id: 3,
            question: '客户当前是否有同类产品？',
            type: 'single',
            options: ['首次采购', '更换品牌', '增加采购', '科室扩充'],
            aiReason: '了解竞品情况有助于制定差异化策略。'
        },
        {
            id: 4,
            question: '采购预算大概多少？',
            type: 'single',
            options: ['5万以下', '5-20万', '20-50万', '50-100万', '100万以上'],
            aiReason: '预算影响产品配置和方案设计。'
        },
        {
            id: 5,
            question: '是否有证照要求？',
            type: 'single',
            options: ['无特殊要求', '需要医疗器械证', '需要集中采购', '需要国产优先'],
            aiReason: '证照要求是医疗行业重要的合规门槛。'
        },
        {
            id: 6,
            question: '项目周期要求？',
            type: 'single',
            options: ['紧急(1个月内)', '正常(1-3个月)', '有充足时间', '长期采购计划'],
            aiReason: '周期影响备货和物流安排。'
        },
        {
            id: 7,
            question: '决策流程到了哪一步？',
            type: 'single',
            options: ['初步接触', '技术交流', '方案评估', '商务谈判', '等待招标'],
            aiReason: '了解销售阶段有助于把控成单节奏。'
        },
        {
            id: 8,
            question: '是否需要培训服务？',
            type: 'single',
            options: ['不需要', '基础操作培训', '临床应用培训', '原厂认证培训'],
            aiReason: '培训服务可以增加客户粘性和附加价值。'
        }
    ],
    education: [
        {
            id: 1,
            question: '您目前是做什么工作的？为什么想学习这个课程？',
            type: 'single',
            options: ['职场转行', '应届毕业生', '在职提升', '兴趣学习', '其他'],
            aiReason: '了解学员的职业背景和学习动机，有助于针对性推荐课程。'
        },
        {
            id: 2,
            question: '您学习这个课程的目标是什么？',
            type: 'multiple',
            options: ['想转行', '想升职', '想加薪', '提升技能', '获取证书'],
            aiReason: '明确学员目标，帮助制定个性化学习规划。'
        },
        {
            id: 3,
            question: '您之前有相关的基础吗？',
            type: 'single',
            options: ['零基础', '有一点基础', '有一定基础', '基础很好'],
            aiReason: '评估学员基础，推荐合适的课程难度和学习路径。'
        },
        {
            id: 4,
            question: '您每天能拿出多少时间学习？',
            type: 'single',
            options: ['1小时以下', '1-2小时', '2-4小时', '4小时以上'],
            aiReason: '了解学习时间，制定合理的学习计划。'
        },
        {
            id: 5,
            question: '您的预算大概是多少？',
            type: 'single',
            options: ['2000元以下', '2000-5000元', '5000-10000元', '10000-20000元', '2万以上'],
            aiReason: '根据预算推荐合适的课程方案和付款方式。'
        },
        {
            id: 6,
            question: '您希望什么时候开始学习？',
            type: 'single',
            options: ['越快越好', '1个月内', '3个月内', '半年内', '正在比较中'],
            aiReason: '了解学习紧迫性，促进决策。'
        },
        {
            id: 7,
            question: '您更倾向哪种学习方式？',
            type: 'single',
            options: ['线下面授', '线上网课', '混合式学习'],
            aiReason: '根据学习方式偏好推荐课程形式。'
        },
        {
            id: 8,
            question: '您最担心的是什么？',
            type: 'multiple',
            options: ['怕学不会', '怕太贵', '怕没时间', '怕没效果', '其他顾虑'],
            aiReason: '了解学员顾虑，提前做好异议处理准备。'
        }
    ],
    construction: [
        {
            id: 1,
            question: '客户需要哪种装修服务？',
            type: 'multiple',
            options: ['新房装修', '旧房翻新', '局部改造', '工装项目', '设计服务'],
            aiReason: '装修类型决定服务内容和报价策略。'
        },
        {
            id: 2,
            question: '装修面积大概多少？',
            type: 'single',
            options: ['50平以下', '50-100平', '100-200平', '200-500平', '500平以上'],
            aiReason: '面积是报价的基础依据。'
        },
        {
            id: 3,
            question: '装修预算是多少？',
            type: 'single',
            options: ['5万以下', '5-10万', '10-20万', '20-50万', '50万以上'],
            aiReason: '预算决定装修档次和材料选择。'
        },
        {
            id: 4,
            question: '客户是什么类型？',
            type: 'single',
            options: ['个人业主', '企业客户', '连锁门店', '房地产开发商', '政府机构'],
            aiReason: '客户类型影响谈判策略和付款方式。'
        },
        {
            id: 5,
            question: '预计什么时候开工？',
            type: 'single',
            options: ['越快越好', '1个月内', '3个月内', '半年内', '正在比较中'],
            aiReason: '了解时间节点有助于促进成单。'
        },
        {
            id: 6,
            question: '对装修风格有什么要求？',
            type: 'multiple',
            options: ['现代简约', '中式风格', '欧式风格', '工业风', '还没想好'],
            aiReason: '了解风格偏好有助于推荐设计方案。'
        },
        {
            id: 7,
            question: '之前是否有装修经历？',
            type: 'single',
            options: ['首次装修', '之前有过合作', '朋友推荐', '老客户复购'],
            aiReason: '老客户更容易成单，新客户需要更多信任建立。'
        },
        {
            id: 8,
            question: '付款方式偏好？',
            type: 'single',
            options: ['一次性付款', '分阶段付款', '先装修后付款', '灵活协商'],
            aiReason: '付款方式影响成单率和利润空间。'
        }
    ],
    insurance: [
        {
            id: 1,
            question: '客户需要哪种保险产品？',
            type: 'multiple',
            options: ['人寿保险', '健康保险', '意外保险', '财产保险', '车险', '团险'],
            aiReason: '保险类型决定产品方案和定价策略。'
        },
        {
            id: 2,
            question: '客户年龄阶段？',
            type: 'single',
            options: ['25岁以下', '25-35岁', '35-50岁', '50-60岁', '60岁以上'],
            aiReason: '年龄段影响产品推荐和健康告知。'
        },
        {
            id: 3,
            question: '客户的职业是？',
            type: 'single',
            options: ['企业主', '上班族', '自由职业', '公务员', '家庭主妇'],
            aiReason: '职业影响保险产品选择和核保标准。'
        },
        {
            id: 4,
            question: '预计年缴保费预算？',
            type: 'single',
            options: ['3000元以下', '3000-10000元', '10000-30000元', '30000-100000元', '10万以上'],
            aiReason: '保费预算决定保险方案设计。'
        },
        {
            id: 5,
            question: '家庭年收入大概多少？',
            type: 'single',
            options: ['10万以下', '10-30万', '30-50万', '50-100万', '100万以上'],
            aiReason: '年收入是制定保障方案的重要参考。'
        },
        {
            id: 6,
            question: '之前购买过保险吗？',
            type: 'single',
            options: ['从未购买', '买过一点点', '有保单需要整理', '老客户加保'],
            aiReason: '了解已有保障有助于方案设计和异议处理。'
        },
        {
            id: 7,
            question: '主要想解决什么问题？',
            type: 'multiple',
            options: ['疾病保障', '意外保障', '养老规划', '子女教育', '财富传承'],
            aiReason: '了解核心需求有助于精准推荐产品。'
        },
        {
            id: 8,
            question: '决策人是谁？',
            type: 'single',
            options: ['本人决定', '需要家人商量', '配偶决定', '需要多方沟通'],
            aiReason: '了解决策链有助于制定跟进策略。'
        }
    ]
};

const riskRules = {
    it: [
        { trigger: ['首次合作'], condition: '包含', risk: '新客户信任建立需要时间，建议安排充分的技术交流', level: 'medium' },
        { trigger: ['大型企业(1000人以上)'], condition: '包含', risk: '大型企业决策链长，建议提前了解组织架构和决策流程', level: 'high' },
        { trigger: ['100万以上'], condition: '包含', risk: '大额订单竞争激烈，需要突出公司实力和服务优势', level: 'high' },
        { trigger: ['有特殊安全要求'], condition: '包含', risk: '安全要求可能涉及等保测评，需要提前评估实施能力', level: 'medium' },
        { trigger: ['长期合作'], condition: '包含', risk: '长期合作需明确服务SLA和价格调整机制', level: 'medium' }
    ],
    medical: [
        { trigger: ['三甲医院'], condition: '包含', risk: '三甲医院采购流程长、门槛高，需要充分的资质准备', level: 'high' },
        { trigger: ['首次采购'], condition: '包含', risk: '新客户需要更多产品演示和成功案例支持', level: 'medium' },
        { trigger: ['需要集中采购'], condition: '包含', risk: '集中采购需要入供应商库，周期较长', level: 'medium' },
        { trigger: ['100万以上'], condition: '包含', risk: '大额采购通常需要招标，需提前准备资质文件', level: 'high' }
    ],
    education: [
        { trigger: ['大批量(200人以上)'], condition: '包含', risk: '大客户需要定制化方案和报价策略', level: 'high' },
        { trigger: ['首次接触'], condition: '包含', risk: '新客户需要更多专业咨询和体验服务', level: 'medium' },
        { trigger: ['5万以上'], condition: '包含', risk: '高客单价需要深度沟通和信任建立', level: 'high' }
    ],
    construction: [
        { trigger: ['工装项目'], condition: '包含', risk: '工装项目金额大、周期长，需要详细现场勘查', level: 'high' },
        { trigger: ['500平以上'], condition: '包含', risk: '大面积装修需要专业项目管理和施工团队', level: 'high' },
        { trigger: ['50万以上'], condition: '包含', risk: '大额订单需要公司资质和案例支撑', level: 'medium' },
        { trigger: ['需要小程序'], condition: '包含', risk: '小程序开发有额外的审核和适配要求', level: 'medium' }
    ],
    insurance: [
        { trigger: ['从未购买'], condition: '包含', risk: '新客户需要更多保险理念沟通和需求引导', level: 'medium' },
        { trigger: ['需要家人商量'], condition: '包含', risk: '家庭决策需要多方沟通，成交周期较长', level: 'medium' },
        { trigger: ['10万以上'], condition: '包含', risk: '高保费需要充分的需求分析和方案讲解', level: 'high' }
    ]
};

const pricingConfig = {
    baseValue: 10000,
    baseHourlyRate: 200,
    industryFactors: {
        it: 1.0,
        medical: 1.5,
        education: 0.8,
        construction: 1.2,
        insurance: 1.0
    },
    urgencyFactors: {
        '越快越好': 1.3,
        '1个月内': 1.2,
        '3个月内': 1.0,
        '半年内': 0.9,
        '正在比较中': 0.7
    },
    riskFactors: {
        low: 1.0,
        medium: 1.15,
        high: 1.3
    }
};

const featureModules = {
    it: [
        { name: '软件开发服务', basePrice: 80000, hours: 400, description: '根据需求定制开发，含设计、开发、测试' },
        { name: '系统集成服务', basePrice: 50000, hours: 250, description: '系统对接、数据迁移、集成测试' },
        { name: '技术支持服务', basePrice: 20000, hours: 100, description: '日常运维、故障响应、性能优化' },
        { name: '云服务迁移', basePrice: 60000, hours: 300, description: '评估、规划、迁移、验证' }
    ],
    medical: [
        { name: '医疗设备销售', basePrice: 150000, hours: 80, description: '设备供应、安装调试、售后保障' },
        { name: '耗材供应服务', basePrice: 30000, hours: 40, description: '持续供应、质量保障、物流配送' },
        { name: '整体解决方案', basePrice: 300000, hours: 150, description: '方案设计、设备选型、实施交付' }
    ],
    education: [
        { name: '职业资格证书培训', basePrice: 3000, hours: 40, description: '考前辅导、题库练习、证书获取' },
        { name: '企业内训服务', basePrice: 50000, hours: 80, description: '定制课程、现场授课、效果评估' },
        { name: '在线学习平台', basePrice: 20000, hours: 100, description: '平台使用、课程学习、进度跟踪' }
    ],
    construction: [
        { name: '家装服务', basePrice: 80000, hours: 160, description: '设计、施工、监理、售后' },
        { name: '工装项目', basePrice: 200000, hours: 400, description: '商业空间设计装修一体化服务' },
        { name: '设计服务', basePrice: 15000, hours: 30, description: '方案设计、效果图、施工图' }
    ],
    insurance: [
        { name: '人寿保险规划', basePrice: 5000, hours: 10, description: '保障分析、方案设计、产品匹配' },
        { name: '健康险方案', basePrice: 3000, hours: 8, description: '健康告知、产品对比、核保支持' },
        { name: '团险服务', basePrice: 10000, hours: 20, description: '员工保障方案、团体报价、服务跟进' }
    ]
};

const speechTemplates = {
    it: {
        '客户需要哪种IT服务？': {
            direct: '请问您需要哪方面的IT服务呢？是软件开发、系统集成还是技术支持？',
            polite: '想了解一下，您这边主要是想解决哪方面的技术需求呢？',
            guiding: '为了给您提供更精准的方案，想请教一下您主要关注哪些IT服务领域？'
        },
        '客户企业规模是？': {
            direct: '请问贵公司大概有多少人？',
            polite: '方便透露一下贵公司的规模吗？这样我可以更好地为您推荐方案。',
            guiding: '了解企业规模有助于我们制定更合适的方案，您公司目前大概有多少员工呢？'
        },
        '项目预期周期是多久？': {
            direct: '这个项目您希望多长时间完成？',
            polite: '关于项目周期，您这边有什么预期吗？',
            guiding: '为了合理安排资源，想了解一下您对项目周期的期望是怎样的？'
        },
        '客户是否有指定技术要求？': {
            direct: '技术方面有什么具体要求吗？',
            polite: '想确认一下，技术选型上是否有特定的要求或偏好？',
            guiding: '为了确保方案的兼容性，您对技术栈有什么特别要求吗？'
        },
        '客户预算范围是多少？': {
            direct: '预算大概在什么范围？',
            polite: '关于预算方面，方便透露一下大概范围吗？这样我可以推荐合适的方案。',
            guiding: '了解预算范围有助于我们制定性价比最高的方案，您这边大概的预算区间是多少呢？'
        },
        '客户之前是否有类似合作？': {
            direct: '之前有过类似项目合作经验吗？',
            polite: '想了解一下，之前是否有过类似的项目合作？',
            guiding: '了解过往合作情况有助于我们更好地服务您，之前有做过类似的项目吗？'
        },
        '是否需要提供售后服务？': {
            direct: '需要售后服务吗？',
            polite: '关于售后服务，您这边有什么需求吗？',
            guiding: '完善的售后是保障项目成功的关键，您希望我们提供哪些售后支持呢？'
        },
        '决策人是谁？': {
            direct: '这个项目的决策人是谁？',
            polite: '方便告知一下项目的决策人是谁吗？',
            guiding: '为了更好地推进项目，想了解一下决策流程和决策人是谁？'
        }
    },
    medical: {
        '客户需要哪种医疗产品？': {
            direct: '请问需要哪种医疗产品？',
            polite: '想了解一下，您主要关注哪类医疗产品呢？',
            guiding: '为了给您推荐合适的产品，想请教一下您的具体需求是？'
        },
        '客户机构类型是？': {
            direct: '您是医院还是诊所？',
            polite: '方便告知一下您的机构类型吗？',
            guiding: '了解机构类型有助于我们提供更精准的方案，您这边是医院还是诊所呢？'
        },
        '预算范围大概是？': {
            direct: '预算大概多少？',
            polite: '关于预算方面，方便透露一下大概范围吗？',
            guiding: '了解预算有助于我们推荐性价比最高的方案，您的预算区间大概是？'
        },
        '是否需要集中采购？': {
            direct: '需要集中采购吗？',
            polite: '想确认一下，是否需要走集中采购流程？',
            guiding: '了解采购方式有助于我们配合流程，您这边是集中采购还是单独采购？'
        },
        '之前是否采购过类似产品？': {
            direct: '之前采购过类似产品吗？',
            polite: '想了解一下，之前是否有过类似产品的采购经验？',
            guiding: '了解过往采购情况有助于我们更好地服务您，之前有采购过类似产品吗？'
        }
    },
    education: {
        '客户需要哪种培训服务？': {
            direct: '需要哪种培训服务？',
            polite: '想了解一下，您主要关注哪类培训服务呢？',
            guiding: '为了给您推荐合适的课程，想请教一下您的学习目标是？'
        },
        '预计培训人数？': {
            direct: '大概有多少人参加培训？',
            polite: '方便告知一下预计的培训人数吗？',
            guiding: '了解人数有助于我们安排课程和师资，大概有多少人参加呢？'
        },
        '培训预算是多少？': {
            direct: '培训预算大概多少？',
            polite: '关于预算方面，方便透露一下大概范围吗？',
            guiding: '了解预算有助于我们推荐最合适的方案，您的预算大概是？'
        },
        '是首次接触我们吗？': {
            direct: '之前了解过我们的课程吗？',
            polite: '想了解一下，之前是否接触过我们的培训课程？',
            guiding: '了解您的了解程度有助于我们更好地介绍，之前了解过我们吗？'
        }
    },
    construction: {
        '客户装修面积大概多大？': {
            direct: '装修面积大概多大？',
            polite: '方便告知一下装修面积吗？',
            guiding: '了解面积有助于我们估算报价，您的装修面积大概是多少呢？'
        },
        '是家装还是工装？': {
            direct: '是家装还是工装项目？',
            polite: '想了解一下，您这边是家装还是工装需求呢？',
            guiding: '了解项目类型有助于我们推荐合适的设计师，您是家装还是工装呢？'
        },
        '装修预算范围是？': {
            direct: '预算大概多少？',
            polite: '关于预算方面，方便透露一下大概范围吗？',
            guiding: '了解预算有助于我们制定合适的方案，您的装修预算大概是？'
        },
        '客户类型是？': {
            direct: '是个人业主还是企业客户？',
            polite: '想确认一下，您是个人业主还是企业客户呢？',
            guiding: '了解客户类型有助于我们提供更精准的服务，您是个人还是企业呢？'
        },
        '预计什么时候开工？': {
            direct: '想什么时候开工？',
            polite: '关于开工时间，您这边有什么计划吗？',
            guiding: '了解时间安排有助于我们协调资源，您希望什么时候开工呢？'
        },
        '对装修风格有什么要求？': {
            direct: '喜欢什么装修风格？',
            polite: '想了解一下，您对装修风格有什么偏好吗？',
            guiding: '为了设计出您满意的方案，您喜欢哪种装修风格呢？'
        },
        '之前是否有装修经历？': {
            direct: '之前装修过吗？',
            polite: '想了解一下，之前是否有过装修经历？',
            guiding: '了解过往装修经历有助于我们更好地服务您，之前装修过吗？'
        },
        '付款方式偏好？': {
            direct: '希望怎么付款？',
            polite: '关于付款方式，您有什么偏好吗？',
            guiding: '了解付款方式有助于我们制定合同，您偏好哪种付款方式呢？'
        }
    },
    insurance: {
        '客户需要哪种保险产品？': {
            direct: '需要哪种保险？',
            polite: '想了解一下，您主要关注哪类保险产品呢？',
            guiding: '为了给您推荐合适的保障方案，想请教一下您的需求是？'
        },
        '客户年龄阶段？': {
            direct: '您今年几岁了？',
            polite: '方便告知一下您的年龄吗？',
            guiding: '了解年龄有助于我们推荐合适的产品，您大概是哪个年龄段呢？'
        },
        '客户的职业是？': {
            direct: '您是做什么工作的？',
            polite: '想了解一下您的职业，可以吗？',
            guiding: '职业会影响保险方案的设计，您从事什么职业呢？'
        },
        '预计年缴保费预算？': {
            direct: '预算大概多少？',
            polite: '关于保费预算，方便透露一下大概范围吗？',
            guiding: '了解预算有助于我们制定合适的保障方案，您的年缴预算大概是？'
        },
        '家庭年收入大概多少？': {
            direct: '家庭年收入大概多少？',
            polite: '方便透露一下家庭年收入吗？',
            guiding: '了解收入情况有助于我们制定合理的保障计划，您的家庭年收入大概是？'
        },
        '之前购买过保险吗？': {
            direct: '之前买过保险吗？',
            polite: '想了解一下，之前是否购买过保险？',
            guiding: '了解已有保障有助于我们制定补充方案，之前买过保险吗？'
        },
        '主要想解决什么问题？': {
            direct: '主要想解决什么问题？',
            polite: '想了解一下，您最关心的保障需求是什么？',
            guiding: '为了给您定制最合适的方案，您主要想解决什么问题呢？'
        },
        '决策人是谁？': {
            direct: '谁来做决定？',
            polite: '方便告知一下谁是决策人吗？',
            guiding: '了解决策人有助于我们更好地沟通，谁来做最终决定呢？'
        }
    }
};

function extractKeyInfo(requirement) {
    const keywords = {
        service: ['开发', '软件', '系统', '技术', '外包', '运维', '集成'],
        scale: ['人', '员工', '规模', '人数'],
        budget: ['预算', '价格', '多少钱', '费用', '成本'],
        timeline: ['时间', '周期', '多久', '上线', '交付'],
        technology: ['技术', '语言', '框架', '系统', '平台']
    };
    
    const foundInfo = {};
    
    Object.keys(keywords).forEach(key => {
        keywords[key].forEach(word => {
            if (requirement.includes(word)) {
                foundInfo[key] = true;
            }
        });
    });
    
    return foundInfo;
}

function getNextQuestion(questions, userAnswers, requirement) {
    const extractedInfo = extractKeyInfo(requirement);
    const unanswered = questions.filter(q => !userAnswers[q.id] || userAnswers[q.id].length === 0);
    
    const priorityMap = {
        '客户需要哪种IT服务？': 10,
        '客户企业规模是？': 9,
        '客户预算范围是多少？': 8,
        '项目预期周期是多久？': 7,
        '客户是否有指定技术要求？': 6,
        '是否需要提供售后服务？': 5,
        '决策人是谁？': 4,
        '客户之前是否有类似合作？': 3,
        '客户需要哪种医疗产品？': 10,
        '客户机构类型是？': 9,
        '预算范围大概是？': 8,
        '客户需要哪种培训服务？': 10,
        '预计培训人数？': 9,
        '培训预算是多少？': 8,
        '客户装修面积大概多大？': 10,
        '是家装还是工装？': 9,
        '装修预算范围是？': 8,
        '客户类型是？': 7,
        '预计什么时候开工？': 6,
        '客户需要哪种保险产品？': 10,
        '客户年龄阶段？': 9,
        '客户的职业是？': 8,
        '预计年缴保费预算？': 7,
        '家庭年收入大概多少？': 6
    };
    
    return unanswered.sort((a, b) => {
        const priorityA = priorityMap[a.question] || 0;
        const priorityB = priorityMap[b.question] || 0;
        return priorityB - priorityA;
    });
}

function calculateRequirementCompleteness(questions, userAnswers, requirement) {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(userAnswers).filter(key => 
        userAnswers[key] && userAnswers[key].length > 0
    ).length;
    
    let completeness = (answeredQuestions / totalQuestions) * 100;
    
    if (requirement && requirement.length > 20) {
        completeness += 10;
    }
    
    if (requirement && requirement.length > 50) {
        completeness += 10;
    }
    
    return Math.min(100, Math.round(completeness));
}

function getMissingInfo(questions, userAnswers) {
    return questions.filter(q => !userAnswers[q.id] || userAnswers[q.id].length === 0)
                   .map(q => q.question);
}

function getSpeechTemplate(industry, question, type = 'polite') {
    const industryTemplates = speechTemplates[industry] || speechTemplates.it;
    const templates = industryTemplates[question];
    if (templates) {
        return templates[type] || templates.polite;
    }
    return question;
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadData(key, defaultValue = null) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `px-4 py-3 rounded-lg shadow-lg mb-2 flex items-center gap-2 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-gray-500 text-white'
    }`;
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function renderHomePage() {
    const customers = getCustomers();
    const currentCustomerId = loadData('currentCustomerId');
    
    const content = `
        <div class="max-w-6xl mx-auto">
            <section class="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-12 mb-12 text-white relative overflow-hidden">
                <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                <div class="relative z-10">
                    <h1 class="text-4xl font-bold mb-4">AI驱动的销售智能培训平台</h1>
                    <p class="text-white/90 text-lg mb-8 max-w-2xl">帮助各行业新销售快速掌握客户需求收集与报价技巧，通过智能追问引导完整采集客户需求，自动识别销售风险，生成专业产品方案</p>
                    <div class="flex flex-wrap gap-4">
                        <button onclick="navigateTo('industry')" class="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                            开始学习
                        </button>
                        <button onclick="quickDemo()" class="bg-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30">
                            快速演示
                        </button>
                    </div>
                </div>
            </section>

            <section class="bg-white rounded-xl p-6 shadow-md mb-8">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i class="fa-solid fa-users text-purple-600"></i>
                        <span>客户管理</span>
                    </h2>
                    <button onclick="showCreateCustomerModal()" class="btn-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <i class="fa-solid fa-plus"></i>
                        <span>新增客户</span>
                    </button>
                </div>
                
                ${customers.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${customers.map(customer => {
                            const industryName = industries.find(i => i.id === customer.industry)?.name || customer.industry;
                            return `
                            <div class="border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${currentCustomerId === customer.id ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:border-purple-200'}" 
                                 onclick="selectCustomerForWork('${customer.id}')">
                                <div class="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 class="font-semibold text-gray-900">${customer.name}</h3>
                                        <p class="text-sm text-gray-500">${customer.company || '未填写公司'}</p>
                                    </div>
                                    <div class="flex gap-1">
                                        <button onclick="event.stopPropagation(); editCustomer('${customer.id}')" class="p-1 hover:bg-gray-100 rounded" title="编辑">
                                            <i class="fa-solid fa-pencil text-gray-400"></i>
                                        </button>
                                        <button onclick="event.stopPropagation(); confirmDeleteCustomer('${customer.id}')" class="p-1 hover:bg-gray-100 rounded" title="删除">
                                            <i class="fa-solid fa-trash text-gray-400"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 text-sm">
                                    <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded">${industryName}</span>
                                    <span class="text-gray-400">|</span>
                                    <span class="text-gray-500">需求完整度: <strong>${customer.completeness}%</strong></span>
                                </div>
                                <div class="mt-3">
                                    <div class="w-full bg-gray-100 rounded-full h-1.5">
                                        <div class="h-1.5 rounded-full" style="width: ${customer.completeness}%; background: ${customer.completeness >= 80 ? '#10b981' : customer.completeness >= 50 ? '#f59e0b' : '#ef4444'}"></div>
                                    </div>
                                </div>
                                <p class="text-xs text-gray-400 mt-2">更新于 ${formatDate(customer.updatedAt)}</p>
                            </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <i class="fa-solid fa-users text-gray-400 text-2xl"></i>
                        </div>
                        <p class="text-gray-500 mb-4">暂无客户数据，点击上方按钮添加客户</p>
                        <button onclick="showCreateCustomerModal()" class="btn-primary text-white px-6 py-2 rounded-lg">
                            添加第一个客户
                        </button>
                    </div>
                `}
            </section>

            <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div class="bg-white rounded-xl p-6 shadow-md card-hover border border-gray-100">
                    <div class="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-4">
                        <i class="fa-solid fa-comments text-white text-xl"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">智能追问引擎</h3>
                    <p class="text-gray-500 text-sm">动态引导销售完整采集客户需求，智能补充关键信息</p>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-md card-hover border border-gray-100">
                    <div class="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-4">
                        <i class="fa-solid fa-shield-exclamation text-white text-xl"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">自动风险识别</h3>
                    <p class="text-gray-500 text-sm">实时识别客户潜在顾虑和销售风险，提前预警应对策略</p>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-md card-hover border border-gray-100">
                    <div class="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-4">
                        <i class="fa-solid fa-file-invoice text-white text-xl"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">多方案智能报价</h3>
                    <p class="text-gray-500 text-sm">生成省钱版、标准版、完整版三套报价方案</p>
                </div>
                <div class="bg-white rounded-xl p-6 shadow-md card-hover border border-gray-100">
                    <div class="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center mb-4">
                        <i class="fa-solid fa-file-check text-white text-xl"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">标准化文档生成</h3>
                    <p class="text-gray-500 text-sm">一键生成需求确认单和报价文档</p>
                </div>
            </section>

            <section class="bg-white rounded-xl p-8 shadow-md mb-12">
                <h2 class="text-2xl font-bold text-gray-900 mb-8 text-center">使用流程</h2>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div class="text-center">
                        <div class="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                            <span class="text-white font-bold text-2xl">1</span>
                        </div>
                        <h3 class="font-semibold text-gray-900 text-lg mb-2">选择行业</h3>
                        <p class="text-gray-500 text-sm">选择对应行业知识库，获取专业培训支持</p>
                        <div class="mt-4 flex justify-center">
                            <i class="fa-solid fa-arrow-down text-gray-300 md:hidden"></i>
                            <i class="fa-solid fa-arrow-right text-gray-300 hidden md:block"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                            <span class="text-white font-bold text-2xl">2</span>
                        </div>
                        <h3 class="font-semibold text-gray-900 text-lg mb-2">选择客户类型</h3>
                        <p class="text-gray-500 text-sm">选择模拟的客户类型，设置相应场景</p>
                        <div class="mt-4 flex justify-center">
                            <i class="fa-solid fa-arrow-down text-gray-300 md:hidden"></i>
                            <i class="fa-solid fa-arrow-right text-gray-300 hidden md:block"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                            <span class="text-white font-bold text-2xl">3</span>
                        </div>
                        <h3 class="font-semibold text-gray-900 text-lg mb-2">AI引导对话</h3>
                        <p class="text-gray-500 text-sm">智能引导提问，完整采集客户需求</p>
                        <div class="mt-4 flex justify-center">
                            <i class="fa-solid fa-arrow-down text-gray-300 md:hidden"></i>
                            <i class="fa-solid fa-arrow-right text-gray-300 hidden md:block"></i>
                        </div>
                    </div>
                    <div class="text-center">
                        <div class="w-20 h-20 rounded-full gradient-bg flex items-center justify-center mx-auto mb-4">
                            <span class="text-white font-bold text-2xl">4</span>
                        </div>
                        <h3 class="font-semibold text-gray-900 text-lg mb-2">生成方案</h3>
                        <p class="text-gray-500 text-sm">获取三套报价方案，一键生成文档</p>
                    </div>
                </div>
            </section>

            <section class="mb-12">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 text-center">行业知识库覆盖</h2>
                <p class="text-gray-500 text-center mb-8">针对不同行业知识，帮助新销售掌握客户需求收集分析与报价技巧</p>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    ${industries.map(industry => `
                        <div class="bg-white rounded-xl p-5 shadow-md card-hover cursor-pointer border border-gray-100" onclick="selectIndustryAndNavigate('${industry.id}')">
                            <div class="w-14 h-14 rounded-xl ${industry.color} flex items-center justify-center mb-3 mx-auto">
                                <i class="fa-solid ${industry.icon} text-white text-2xl"></i>
                            </div>
                            <h3 class="font-semibold text-gray-900 text-center mb-2">${industry.name}</h3>
                            <p class="text-xs text-gray-500 text-center">${industry.description}</p>
                        </div>
                    `).join('')}
                </div>
            </section>

            <section class="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white mb-12">
                <div class="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h3 class="text-xl font-semibold mb-2">准备好提升您的销售技能了吗？</h3>
                        <p class="text-gray-400">加入SalesCoach AI，让AI帮助您成为更专业的销售顾问</p>
                    </div>
                    <button onclick="navigateTo('industry')" class="btn-primary text-white px-8 py-3 rounded-lg font-semibold">
                        立即开始
                    </button>
                </div>
            </section>

            <footer class="text-center text-gray-400 text-sm py-8">
                <p>SalesCoach AI - AI驱动的销售智能培训平台</p>
                <p class="mt-1">帮助新销售快速掌握需求收集与报价技巧</p>
            </footer>
        </div>
    `;
    document.getElementById('page-container').innerHTML = content;
    document.getElementById('page-title').textContent = 'AI驱动的销售智能培训平台';
    document.getElementById('page-subtitle').textContent = '帮助新销售快速掌握需求收集与报价技巧';
}

function selectIndustryAndNavigate(industryId) {
    saveData('selectedIndustry', industryId);
    navigateTo('questioning');
}

function renderIndustryPage() {
    const selectedIndustry = loadData('selectedIndustry');
    const content = `
        <div class="max-w-4xl mx-auto">
            <div class="text-center mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">选择您的行业</h2>
                <p class="text-gray-600">系统将为您加载对应行业的完整销售知识体系和实战流程</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                ${industries.map(industry => `
                    <div id="industry-card-${industry.id}" class="bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:shadow-lg ${selectedIndustry === industry.id ? 'ring-2 ring-purple-500' : ''}" 
                         onclick="selectIndustry('${industry.id}', true)">
                        <div class="flex items-start gap-4">
                            <div class="w-14 h-14 rounded-xl ${industry.color} flex items-center justify-center flex-shrink-0">
                                <i class="fa-solid ${industry.icon} text-white text-2xl"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 mb-2">${industry.name}</h3>
                                <p class="text-sm text-gray-500 mb-3">${industry.description}</p>
                                <div class="flex flex-wrap gap-1">
                                    ${industry.tags.map(tag => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${tag}</span>`).join('')}
                                </div>
                                <div class="flex items-center justify-end mt-3">
                                    <input type="radio" name="industry" id="industry-${industry.id}" 
                                           ${selectedIndustry === industry.id ? 'checked' : ''} 
                                           onchange="selectIndustry('${industry.id}', false)"
                                           class="w-4 h-4 text-purple-600">
                                    <label for="industry-${industry.id}" class="ml-2 text-sm text-gray-600">选择</label>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="flex justify-center">
                <button id="industry-next-btn" ${selectedIndustry ? '' : 'disabled'} 
                        onclick="navigateTo('questioning')"
                        class="btn-primary text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                    开始需求采集
                </button>
            </div>
        </div>
    `;
    document.getElementById('page-container').innerHTML = content;
    document.getElementById('page-title').textContent = '选择行业知识库';
    document.getElementById('page-subtitle').textContent = '请选择您将要使用的行业知识库';
}

function selectIndustry(industryId, isClick) {
    saveData('selectedIndustry', industryId);
    document.getElementById('industry-next-btn').disabled = false;
    
    if (isClick) {
        const radioBtn = document.getElementById('industry-' + industryId);
        if (radioBtn) {
            radioBtn.checked = true;
        }
    }
    
    document.querySelectorAll('[id^="industry-card-"]').forEach(card => {
        card.classList.remove('ring-2', 'ring-purple-500');
    });
    
    const selectedCard = document.getElementById('industry-card-' + industryId);
    if (selectedCard) {
        selectedCard.classList.add('ring-2', 'ring-purple-500');
    }
    
    showToast('已选择行业知识库', 'success');
}

function renderCustomerPage() {
    const industry = loadData('selectedIndustry');
    const selectedCustomer = loadData('selectedCustomer');
    const customers = customerTypes[industry] || customerTypes.it;
    
    if (!industry) {
        navigateTo('industry');
        return;
    }

    const industryName = industries.find(i => i.id === industry)?.name || '';
    
    const content = `
        <div class="max-w-4xl mx-auto">
            <div class="text-center mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">选择客户类型</h2>
                <p class="text-gray-600">请选择您将要模拟的客户类型，系统将为您设置相应的模拟场景</p>
            </div>
            <div class="bg-white rounded-xl p-4 mb-6 flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <i class="fa-solid fa-industry text-purple-600"></i>
                </div>
                <div>
                    <p class="text-sm text-gray-500">当前行业</p>
                    <p class="font-medium text-gray-900">${industryName}</p>
                </div>
                <button onclick="navigateTo('industry')" class="ml-auto text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>返回修改</span>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                ${customers.map(customer => `
                    <div class="bg-white rounded-xl p-6 shadow-md cursor-pointer transition-all hover:shadow-lg ${selectedCustomer === customer.id ? 'ring-2 ring-purple-500' : ''}" 
                         onclick="selectCustomer('${customer.id}')">
                        <div class="text-center">
                            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-4">
                                <i class="fa-solid ${customer.icon} text-purple-600 text-2xl"></i>
                            </div>
                            <h3 class="font-semibold text-gray-900 mb-2">${customer.name}</h3>
                            <p class="text-sm text-gray-500">${customer.description}</p>
                            <div class="mt-4">
                                <input type="radio" name="customer" id="customer-${customer.id}" 
                                       ${selectedCustomer === customer.id ? 'checked' : ''} 
                                       class="w-4 h-4 text-purple-600">
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="flex justify-center gap-4">
                <button onclick="navigateTo('industry')" class="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                    上一步
                </button>
                <button id="customer-next-btn" ${selectedCustomer ? '' : 'disabled'} 
                        onclick="navigateTo('questioning')"
                        class="btn-primary text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                    开始模拟
                </button>
            </div>
        </div>
    `;
    document.getElementById('page-container').innerHTML = content;
    document.getElementById('page-title').textContent = '选择客户类型';
    document.getElementById('page-subtitle').textContent = '请选择您将要模拟的客户类型';
}

function selectCustomer(customerId) {
    saveData('selectedCustomer', customerId);
    document.getElementById('customer-next-btn').disabled = false;
    showToast('已选择客户类型', 'success');
}

function renderQuestioningPage() {
    const selectedIndustry = loadData('selectedIndustry') || 'it';
    const questions = questionBanks[selectedIndustry] || questionBanks.it;
    const userAnswers = loadData('userAnswers', {});
    const customerRequirement = loadData('customerRequirement', '');
    const currentCustomerId = loadData('currentCustomerId');
    const currentCustomer = currentCustomerId ? getCustomerById(currentCustomerId) : null;
    const customers = getCustomers();
    
    const answeredQuestions = Object.keys(userAnswers).filter(key => 
        userAnswers[key] && userAnswers[key].length > 0
    ).length;
    
    const risks = identifyRisks(selectedIndustry, userAnswers);
    const completeness = calculateRequirementCompleteness(questions, userAnswers, customerRequirement);
    const missingInfo = getMissingInfo(questions, userAnswers);
    const prioritizedQuestions = getNextQuestion(questions, userAnswers, customerRequirement);
    
    const suggestedReply = generateReply(customerRequirement, userAnswers, selectedIndustry);
    
    const industryName = industries.find(i => i.id === selectedIndustry)?.name || selectedIndustry;

    const content = `
        <div class="flex gap-6">
            <div class="flex-1">
                <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                            <i class="fa-solid fa-user text-purple-600"></i>
                            <span>客户信息</span>
                        </h3>
                        <button onclick="saveCustomerInfo()" class="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                            <i class="fa-solid fa-save"></i>
                            <span>保存</span>
                        </button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm text-gray-500 mb-1">客户名称 *</label>
                            <input type="text" id="customer-name-input" 
                                   class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="请输入客户名称"
                                   value="${currentCustomer?.name || ''}">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-500 mb-1">公司名称</label>
                            <input type="text" id="customer-company-input" 
                                   class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="请输入公司名称"
                                   value="${currentCustomer?.company || ''}">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-500 mb-1">联系电话</label>
                            <input type="tel" id="customer-phone-input" 
                                   class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                   placeholder="请输入联系电话"
                                   value="${currentCustomer?.phone || ''}">
                        </div>
                    </div>
                    <div class="mt-4 flex items-center gap-3">
                        <label class="text-sm text-gray-500">咨询服务:</label>
                        <select id="customer-industry-input" 
                                onchange="switchIndustry()"
                                class="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            ${industries.map(i => `<option value="${i.id}" ${i.id === selectedIndustry ? 'selected' : ''}>${i.name}</option>`).join('')}
                        </select>
                        <span class="text-xs text-gray-400">客户咨询的服务类型</span>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-sm text-gray-500">客户需求输入</span>
                        <span class="text-xs text-gray-400">请将客户的问题/需求粘贴到下方</span>
                    </div>
                    <textarea id="customer-requirement" 
                              class="w-full h-40 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="例如：客户说'我们公司需要开发一个电商平台，预算大概10万左右，希望能尽快上线'...">${customerRequirement}</textarea>
                    <div class="flex items-center justify-between mt-3">
                        <button onclick="saveRequirement()" class="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                            <i class="fa-solid fa-save"></i>
                            <span>保存需求</span>
                        </button>
                        <button onclick="analyzeRequirement()" class="btn-primary text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <span>分析需求</span>
                        </button>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                            <i class="fa-solid fa-chart-line text-blue-500"></i>
                            <span>需求完整度评估</span>
                        </h3>
                        <span class="text-lg font-bold ${completeness >= 80 ? 'text-green-600' : completeness >= 50 ? 'text-yellow-600' : 'text-red-600'}">${completeness}%</span>
                    </div>
                    <div class="w-full bg-gray-100 rounded-full h-3 mb-4">
                        <div class="h-3 rounded-full transition-all duration-500" style="width: ${completeness}%; background: ${completeness >= 80 ? 'linear-gradient(to right, #10b981, #059669)' : completeness >= 50 ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'linear-gradient(to right, #ef4444, #dc2626)'}"></div>
                    </div>
                    <p class="text-sm text-gray-600 mb-3">${completeness >= 80 ? '✓ 需求采集较为完整，可以准备报价方案' : completeness >= 50 ? '! 还需要补充一些关键信息' : '✕ 建议继续追问客户获取更多信息'}</p>
                    ${missingInfo.length > 0 ? `
                        <div class="bg-orange-50 rounded-lg p-3">
                            <p class="text-sm font-medium text-orange-800 mb-2">待确认信息：</p>
                            <ul class="text-xs text-orange-700 space-y-1">
                                ${missingInfo.slice(0, 3).map(info => `<li>• ${info}</li>`).join('')}
                                ${missingInfo.length > 3 ? `<li>• 还有 ${missingInfo.length - 3} 项待确认...</li>` : ''}
                            </ul>
                        </div>
                    ` : ''}
                </div>

                ${customerRequirement ? `
                    <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div class="flex items-center gap-2 mb-4">
                            <i class="fa-solid fa-message-circle text-purple-600"></i>
                            <h3 class="font-semibold text-gray-900">建议回复</h3>
                        </div>
                        <div class="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                                    <i class="fa-solid fa-robot text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <p class="text-gray-700">${suggestedReply}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <div class="bg-white rounded-xl shadow-md p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                            <i class="fa-solid fa-question-circle text-purple-500"></i>
                            <span>智能追问</span>
                        </h3>
                        <span class="text-sm text-gray-500">已采集 ${answeredQuestions} / ${questions.length}</span>
                    </div>
                    
                    <div class="w-full bg-gray-100 rounded-full h-2 mb-6">
                        <div class="progress-bar h-2 rounded-full" style="width: ${(answeredQuestions / questions.length) * 100}%"></div>
                    </div>

                    <div id="question-container" class="space-y-6">
                        ${prioritizedQuestions.map((q, index) => {
                            const isAnswered = userAnswers[q.id] && userAnswers[q.id].length > 0;
                            const templates = speechTemplates[selectedIndustry]?.[q.question];
                            return `
                                <div class="border rounded-lg p-4 ${isAnswered ? 'border-green-300 bg-green-50' : index === 0 ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center gap-2">
                                            <span class="w-6 h-6 rounded-full ${index === 0 && !isAnswered ? 'bg-purple-500' : 'gradient-bg'} flex items-center justify-center text-white text-xs font-medium">${index + 1}</span>
                                            <p class="font-medium text-gray-900">${q.question}</p>
                                            ${index === 0 && !isAnswered ? '<span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">建议优先</span>' : ''}
                                        </div>
                                        ${isAnswered ? '<span class="text-green-500 text-sm flex items-center gap-1"><i class="fa-solid fa-check"></i>已回答</span>' : ''}
                                    </div>
                                    ${!isAnswered && templates ? `
                                        <div class="mb-3 p-3 bg-blue-50 rounded-lg">
                                            <p class="text-xs text-blue-800 font-medium mb-2">💡 话术建议：</p>
                                            <div class="space-y-2">
                                                <button onclick="copyToClipboard('${templates.direct.replace(/'/g, "\\'")}')" class="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                                    <span class="text-blue-500">▸</span>
                                                    <span>${templates.direct}</span>
                                                    <i class="fa-solid fa-copy ml-auto text-blue-400"></i>
                                                </button>
                                                <button onclick="copyToClipboard('${templates.polite.replace(/'/g, "\\'")}')" class="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                                    <span class="text-blue-500">▸</span>
                                                    <span>${templates.polite}</span>
                                                    <i class="fa-solid fa-copy ml-auto text-blue-400"></i>
                                                </button>
                                                <button onclick="copyToClipboard('${templates.guiding.replace(/'/g, "\\'")}')" class="block w-full text-left text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                                    <span class="text-blue-500">▸</span>
                                                    <span>${templates.guiding}</span>
                                                    <i class="fa-solid fa-copy ml-auto text-blue-400"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ` : ''}
                                    <div class="flex flex-wrap gap-2">
                                        ${q.options.map((option, optIndex) => `
                                            <label class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input type="${q.type === 'multiple' ? 'checkbox' : 'radio'}" 
                                                       name="question-${q.id}" 
                                                       value="${option}"
                                                       ${(userAnswers[q.id] || []).includes(option) ? 'checked' : ''}
                                                       onchange="saveAnswer(${q.id}, '${option}', ${q.type === 'multiple'}); renderQuestioningPage()"
                                                       class="w-4 h-4 text-purple-600">
                                                <span class="text-sm text-gray-700">${option}</span>
                                            </label>
                                        `).join('')}
                                    </div>
                                    ${isAnswered ? `
                                        <div class="mt-3 p-2 bg-white rounded text-sm text-gray-600">
                                            <span class="font-medium">AI提示：</span>${q.aiReason}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div class="flex items-center justify-end mt-8">
                        <button onclick="calculateQuote(); navigateTo('quote')" 
                                ${answeredQuestions === 0 ? 'disabled' : ''}
                                class="btn-primary text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fa-solid fa-file-invoice-dollar"></i>
                            <span>生成产品方案</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="w-80">
                <div class="bg-white rounded-xl shadow-md p-4 sticky top-6">
                    <div class="flex items-center justify-between mb-3">
                        <h4 class="font-semibold text-gray-900 flex items-center gap-2">
                            <i class="fa-solid fa-users text-purple-600"></i>
                            <span>客户列表</span>
                        </h4>
                        <button onclick="createNewCustomerFromQuestioning()" class="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1">
                            <i class="fa-solid fa-plus"></i>
                            <span>新增</span>
                        </button>
                    </div>
                    
                    <div class="space-y-2 max-h-48 overflow-y-auto">
                        ${customers.length > 0 ? customers.map(customer => `
                            <div class="p-3 rounded-lg cursor-pointer transition-all ${currentCustomerId === customer.id ? 'bg-purple-100 border border-purple-300' : 'hover:bg-gray-50 border border-transparent'}" 
                                 onclick="switchToCustomer('${customer.id}')">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="font-medium text-gray-900 text-sm">${customer.name}</p>
                                        <p class="text-xs text-gray-500">${customer.company || '无公司'} | ${industries.find(i => i.id === customer.industry)?.name || customer.industry}</p>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-xs text-gray-500">${customer.completeness}%</p>
                                        <div class="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div class="h-full rounded-full" style="width: ${customer.completeness}%; background: ${customer.completeness >= 80 ? '#10b981' : customer.completeness >= 50 ? '#f59e0b' : '#ef4444'}"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('') : `
                            <p class="text-gray-400 text-sm text-center py-4">暂无客户</p>
                        `}
                    </div>
                    
                    ${currentCustomer ? `
                        <div class="mt-4 pt-3 border-t border-gray-100">
                            <button onclick="suspendCustomer()" class="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1">
                                <i class="fa-solid fa-pause"></i>
                                <span>挂起当前客户</span>
                            </button>
                        </div>
                    ` : ''}
                </div>

                <div class="bg-white rounded-xl shadow-md p-4 mt-4">
                    <h4 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-shield-warning text-red-500"></i>
                        <span>风险提示</span>
                    </h4>
                    <div class="space-y-2">
                        ${risks.length > 0 ? risks.map((risk, index) => `
                            <div class="${risk.level === 'high' ? 'risk-high' : 'risk-medium'} p-3 rounded">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-xs font-medium ${risk.level === 'high' ? 'text-red-700' : 'text-yellow-700'}">${risk.level === 'high' ? '高风险' : '中风险'}</span>
                                </div>
                                <p class="text-sm text-gray-700">${index + 1}. ${risk.risk}</p>
                            </div>
                        `).join('') : `
                            <p class="text-gray-400 text-sm text-center py-4">暂无风险提示</p>
                        `}
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-4 mt-4">
                    <h4 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-lightbulb text-yellow-500"></i>
                        <span>销售小贴士</span>
                    </h4>
                    <div class="space-y-3">
                        <p class="text-sm text-gray-600">
                            <strong>技巧1：</strong>尽量让客户提供详细的需求描述，这样可以更准确地估算报价。
                        </p>
                        <p class="text-sm text-gray-600">
                            <strong>技巧2：</strong>如果客户不确定某些细节，可以建议先做需求分析。
                        </p>
                        <p class="text-sm text-gray-600">
                            <strong>技巧3：</strong>预算范围是重要参考，可以帮助制定合适的报价策略。
                        </p>
                    </div>
                </div>

                <div class="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-md p-4 mt-4">
                    <h4 class="font-semibold text-white mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-comments"></i>
                        <span>下一步建议</span>
                    </h4>
                    <div class="text-white/90 text-sm space-y-2">
                        ${prioritizedQuestions.length > 0 && !userAnswers[prioritizedQuestions[0].id] ? `
                            <p>建议继续追问：<strong>${prioritizedQuestions[0].question}</strong></p>
                        ` : ''}
                        ${completeness < 80 ? `
                            <p>当前需求完整度：<strong>${completeness}%</strong>，建议继续采集</p>
                        ` : ''}
                        ${completeness >= 80 ? `
                            <p class="text-green-200">✓ 需求采集完整，可以准备报价</p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('page-container').innerHTML = content;
    document.getElementById('page-title').textContent = '智能追问 - ' + (currentCustomer ? currentCustomer.name : '未选择客户');
    document.getElementById('page-subtitle').textContent = 'AI帮助您完整采集客户需求并生成回复建议';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('话术已复制到剪贴板', 'success');
    }).catch(() => {
        showToast('复制失败，请手动复制', 'error');
    });
}

function generateReply(requirement, answers, industry) {
    if (!requirement) {
        return '请先输入客户需求，我将为您生成回复建议。';
    }
    
    const industryName = getIndustryName(industry);
    const answeredCount = Object.keys(answers).filter(key => answers[key] && answers[key].length > 0).length;
    
    let reply = `您好！感谢您的咨询。根据您提到的需求："${requirement}"\n\n`;
    reply += `我们是专业的${industryName}解决方案提供商，针对您的需求，我想了解以下信息以便为您提供更准确的报价：\n\n`;
    
    if (answeredCount > 0) {
        reply += `根据您已提供的信息，我们正在为您整理报价方案。\n\n`;
    }
    
    reply += `如果您有任何疑问，欢迎随时沟通！`;
    
    return reply;
}

function analyzeRequirement() {
    const requirement = document.getElementById('customer-requirement').value;
    saveData('customerRequirement', requirement);
    showToast('需求已分析，建议回复已生成', 'success');
    renderQuestioningPage();
}

function saveRequirement() {
    const requirement = document.getElementById('customer-requirement').value;
    saveData('customerRequirement', requirement);
    
    const currentCustomerId = loadData('currentCustomerId');
    if (currentCustomerId) {
        const questions = questionBanks[loadData('selectedIndustry')] || questionBanks.it;
        const userAnswers = loadData('userAnswers', {});
        const completeness = calculateRequirementCompleteness(questions, userAnswers, requirement);
        updateCustomer(currentCustomerId, { requirement, completeness });
    }
    
    showToast('需求已保存', 'success');
}

function saveAnswer(questionId, option, isMultiple) {
    const userAnswers = loadData('userAnswers', {});
    if (!userAnswers[questionId]) {
        userAnswers[questionId] = [];
    }
    if (isMultiple) {
        const index = userAnswers[questionId].indexOf(option);
        if (index > -1) {
            userAnswers[questionId].splice(index, 1);
        } else {
            userAnswers[questionId].push(option);
        }
    } else {
        userAnswers[questionId] = [option];
    }
    saveData('userAnswers', userAnswers);
    
    const currentCustomerId = loadData('currentCustomerId');
    if (currentCustomerId) {
        const questions = questionBanks[loadData('selectedIndustry')] || questionBanks.it;
        const requirement = loadData('customerRequirement', '');
        const completeness = calculateRequirementCompleteness(questions, userAnswers, requirement);
        updateCustomer(currentCustomerId, { answers: userAnswers, completeness });
    }
}

function saveCustomerInfo() {
    const name = document.getElementById('customer-name-input').value;
    const company = document.getElementById('customer-company-input').value;
    const phone = document.getElementById('customer-phone-input').value;
    const industry = document.getElementById('customer-industry-input').value;
    
    if (!name.trim()) {
        showToast('请输入客户名称', 'error');
        return;
    }
    
    saveData('selectedIndustry', industry);
    
    let currentCustomerId = loadData('currentCustomerId');
    
    if (currentCustomerId) {
        updateCustomer(currentCustomerId, { name, company, phone, industry });
        showToast('客户信息已更新', 'success');
    } else {
        const newCustomer = createCustomer({ name, company, phone, industry });
        saveData('currentCustomerId', newCustomer.id);
        showToast('客户已创建', 'success');
    }
    
    renderQuestioningPage();
}

function switchIndustry() {
    const industry = document.getElementById('customer-industry-input').value;
    const oldIndustry = loadData('selectedIndustry');
    
    if (industry !== oldIndustry) {
        saveData('selectedIndustry', industry);
        saveData('userAnswers', {});
        showToast('服务类型已切换，将使用对应服务的问题库', 'info');
        renderQuestioningPage();
    }
}

function switchToCustomer(customerId) {
    saveData('currentCustomerId', customerId);
    const customer = getCustomerById(customerId);
    if (customer) {
        saveData('selectedIndustry', customer.industry);
        saveData('customerRequirement', customer.requirement || '');
        saveData('userAnswers', customer.answers || {});
    }
    showToast('已切换到该客户', 'success');
    renderQuestioningPage();
}

function createNewCustomerFromQuestioning() {
    document.getElementById('customer-name-input').value = '';
    document.getElementById('customer-company-input').value = '';
    document.getElementById('customer-phone-input').value = '';
    saveData('currentCustomerId', null);
    saveData('customerRequirement', '');
    saveData('userAnswers', {});
    showToast('请填写新客户信息', 'info');
}

function suspendCustomer() {
    saveCustomerInfo();
    saveData('currentCustomerId', null);
    showToast('当前客户已挂起', 'success');
    renderQuestioningPage();
}

function identifyRisks(industry, answers) {
    const rules = riskRules[industry] || [];
    const risks = [];
    
    Object.values(answers).forEach(answerList => {
        rules.forEach(rule => {
            if (rule.trigger.some(t => answerList.includes(t))) {
                if (!risks.some(r => r.risk === rule.risk)) {
                    risks.push(rule);
                }
            }
        });
    });
    
    return risks;
}

function calculateQuote() {
    const industry = loadData('selectedIndustry');
    const answers = loadData('userAnswers', {});
    const modules = featureModules[industry] || featureModules.it;
    const config = pricingConfig;
    
    let industryFactor = config.industryFactors[industry] || 1.0;
    let urgencyFactor = 1.0;
    
    const questionBanksForIndustry = questionBanks[industry] || questionBanks.it;
    const urgencyQuestion = questionBanksForIndustry.find(q => q.question.includes('时间') || q.question.includes('周期') || q.question.includes('预算'));
    if (urgencyQuestion && answers[urgencyQuestion.id]) {
        urgencyFactor = config.urgencyFactors[answers[urgencyQuestion.id][0]] || 1.0;
    }
    
    const risks = identifyRisks(industry, answers);
    const highRiskCount = risks.filter(r => r.level === 'high').length;
    const mediumRiskCount = risks.filter(r => r.level === 'medium').length;
    let riskFactor = 1.0 + (highRiskCount * 0.1) + (mediumRiskCount * 0.05);
    
    const baseTotal = modules.reduce((sum, m) => sum + m.basePrice, 0);
    
    const quoteData = {
        modules: modules.map(m => ({
            ...m,
            subtotal: m.basePrice,
            finalCost: Math.round(m.basePrice * industryFactor * urgencyFactor * riskFactor)
        })),
        industryFactor,
        urgencyFactor,
        riskFactor,
        baseTotal,
        finalTotal: Math.round(baseTotal * industryFactor * urgencyFactor * riskFactor),
        risks: risks
    };

    const versions = {
        basic: {
            name: '基础方案',
            discount: 0.85,
            price: Math.round(quoteData.finalTotal * 0.85),
            description: '核心产品，满足基本需求',
            features: modules.slice(0, 1).map(m => m.name)
        },
        standard: {
            name: '标准方案',
            discount: 1.0,
            price: quoteData.finalTotal,
            description: '完整产品+优质服务，推荐选择',
            features: modules.slice(0, 2).map(m => m.name)
        },
        premium: {
            name: '尊享方案',
            discount: 1.15,
            price: Math.round(quoteData.finalTotal * 1.15),
            description: '全系列产品+VIP服务',
            features: modules.map(m => m.name)
        }
    };
    
    saveData('quoteData', { ...quoteData, versions });
}

function renderQuotePage() {
    const quoteData = loadData('quoteData', {});
    const industry = loadData('selectedIndustry');
    const modules = quoteData.modules || [];
    
    if (!quoteData.finalTotal) {
        return navigateTo('questioning');
    }

    const content = `
        <div class="flex gap-6">
            <div class="flex-1">
                <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 class="font-semibold text-gray-900 mb-4">基础功能报价明细</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b">
                                    <th class="text-left py-3 px-4 text-sm font-medium text-gray-600">功能模块</th>
                                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-600">工时（小时）</th>
                                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-600">单价（元）</th>
                                    <th class="text-right py-3 px-4 text-sm font-medium text-gray-600">小计（元）</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${modules.map((m, index) => `
                                    <tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="showPriceBreakdown(${index})">
                                        <td class="py-3 px-4 text-gray-700">${m.name}</td>
                                        <td class="text-right py-3 px-4 text-gray-600">${m.hours}</td>
                                        <td class="text-right py-3 px-4 text-gray-600">${pricingConfig.baseHourlyRate}</td>
                                        <td class="text-right py-3 px-4 font-medium text-gray-900">¥${m.finalCost.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h3 class="font-semibold text-gray-900 mb-4">调整系数</h3>
                    <div class="grid grid-cols-3 gap-4">
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-500 mb-1">行业系数</p>
                            <p class="font-semibold text-gray-900">${quoteData.industryFactor}x</p>
                            <p class="text-xs text-gray-400 mt-1">${getIndustryName(industry)}</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-500 mb-1">紧急度系数</p>
                            <p class="font-semibold text-gray-900">${quoteData.urgencyFactor}x</p>
                            <p class="text-xs text-gray-400 mt-1">工期影响</p>
                        </div>
                        <div class="bg-gray-50 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-500 mb-1">风险系数</p>
                            <p class="font-semibold text-gray-900">${quoteData.riskFactor.toFixed(2)}x</p>
                            <p class="text-xs text-gray-400 mt-1">${quoteData.risks.length}个风险点</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-md p-6">
                    <div class="flex items-center justify-between">
                        <span class="text-gray-600">最终报价</span>
                        <span class="text-3xl font-bold gradient-text">¥${quoteData.finalTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div class="w-96">
                <div class="bg-white rounded-xl shadow-md p-4 mb-4">
                    <h3 class="font-semibold text-gray-900 mb-4">选择报价方案</h3>
                    <div class="space-y-3">
                        ${Object.values(quoteData.versions || {}).map((version, key) => `
                            <div class="border-2 rounded-lg p-4 cursor-pointer transition-all ${key === 'standard' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}" 
                                 onclick="selectQuoteVersion('${key}')">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-semibold text-gray-900">${version.name}</span>
                                    <span class="text-xl font-bold ${key === 'standard' ? 'text-purple-600' : 'text-gray-900'}">¥${version.price.toLocaleString()}</span>
                                </div>
                                <p class="text-sm text-gray-500 mb-3">${version.description}</p>
                                <div class="flex flex-wrap gap-1">
                                    ${version.features.map(f => `<span class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">${f}</span>`).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="flex gap-3">
                    <button onclick="navigateTo('questioning')" class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>上一步</span>
                    </button>
                    <button onclick="navigateTo('document')" class="flex-1 btn-primary text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2">
                        <i class="fa-solid fa-file-text"></i>
                        <span>生成需求确认单</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('page-container').innerHTML = content;
    document.getElementById('page-title').textContent = '报价方案';
    document.getElementById('page-subtitle').textContent = '为您生成三套报价方案供选择';
}

function getIndustryName(industryId) {
    const industry = industries.find(i => i.id === industryId);
    return industry ? industry.name : 'IT外包';
}

function selectQuoteVersion(version) {
    saveData('selectedQuoteVersion', version);
    showToast(`已选择${version === 'basic' ? '省钱版' : version === 'standard' ? '标准版' : '完整版'}`, 'success');
}

function showPriceBreakdown(moduleIndex) {
    const quoteData = loadData('quoteData', {});
    const module = quoteData.modules[moduleIndex];
    
    const modalContent = `
        <div class="modal-overlay fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick="closeModal()">
            <div class="modal-content bg-white rounded-xl p-6 w-full max-w-lg" onclick="event.stopPropagation()">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-lg text-gray-900">价格拆解</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <p class="text-gray-600 mb-4">${module.name}</p>
                <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">基础工时</span>
                        <span class="text-gray-700">${module.hours} 小时</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">人力成本</span>
                        <span class="text-gray-700">¥${pricingConfig.baseHourlyRate}/小时</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">行业系数</span>
                        <span class="text-gray-700">${quoteData.industryFactor}x</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">紧急度系数</span>
                        <span class="text-gray-700">${quoteData.urgencyFactor}x</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500">风险系数</span>
                        <span class="text-gray-700">${quoteData.riskFactor.toFixed(2)}x</span>
                    </div>
                    <div class="border-t pt-3 mt-3">
                        <div class="flex justify-between font-semibold">
                            <span class="text-gray-900">最终价格</span>
                            <span class="text-purple-600">¥${module.finalCost.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p class="text-xs text-gray-500">
                        计算公式：基础工时 × 人力成本 × 行业系数 × 紧急度系数 × 风险系数
                    </p>
                </div>
            </div>
        </div>
    `;
    document.getElementById('modal-container').innerHTML = modalContent;
}

function closeModal() {
    document.getElementById('modal-container').innerHTML = '';
}

function renderDocumentPage() {
    const quoteData = loadData('quoteData', {});
    const industry = loadData('selectedIndustry');
    const userAnswers = loadData('userAnswers', {});
    const customerRequirement = loadData('customerRequirement', '');
    
    if (!quoteData.finalTotal) {
        return navigateTo('questioning');
    }

    const questions = questionBanks[industry] || questionBanks.it;
    const industryName = industries.find(i => i.id === industry)?.name || 'IT';
    
    const content = `
        <div class="max-w-4xl mx-auto">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold text-gray-900">销售方案建议书</h2>
                <div class="flex gap-3">
                    <button onclick="printDocument()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                        <i class="fa-solid fa-print"></i>
                        <span>打印</span>
                    </button>
                    <button onclick="downloadDocument()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                        <i class="fa-solid fa-download"></i>
                        <span>下载</span>
                    </button>
                    <button onclick="navigateTo('home')" class="btn-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                        <i class="fa-solid fa-home"></i>
                        <span>返回首页</span>
                    </button>
                </div>
            </div>

            <div id="document-content" class="bg-white rounded-xl shadow-lg p-8">
                <div class="text-center mb-8">
                    <h1 class="text-2xl font-bold text-gray-900 mb-2">${industryName}销售方案建议书</h1>
                    <p class="text-gray-500">SalesCoach AI 销售培训平台</p>
                </div>

                <div class="grid grid-cols-4 gap-4 mb-8 pb-6 border-b">
                    <div>
                        <p class="text-sm text-gray-500">客户需求</p>
                        <p class="font-medium text-gray-900">${customerRequirement ? customerRequirement.substring(0, 20) + '...' : '待填写'}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">行业类型</p>
                        <p class="font-medium text-gray-900">${industryName}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">日期</p>
                        <p class="font-medium text-gray-900">${new Date().toLocaleDateString('zh-CN')}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">编号</p>
                        <p class="font-medium text-gray-900">SC-${Date.now().toString().slice(-8)}</p>
                    </div>
                </div>

                <div class="mb-8">
                    <h3 class="font-semibold text-gray-900 mb-4">一、客户需求分析</h3>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-gray-700 mb-4">客户原始描述：</p>
                        <p class="text-gray-600 ml-4 mb-6">${customerRequirement || '暂无'}</p>
                        <p class="text-gray-700 mb-3">需求采集详情：</p>
                        <ul class="space-y-2 ml-4">
                            ${questions.map(q => {
                                const answer = userAnswers[q.id] || [];
                                return `<li class="flex items-start gap-2">
                                    <span class="text-purple-600">•</span>
                                    <span class="text-gray-600">${q.question}：${answer.join(', ') || '未回答'}</span>
                                </li>`;
                            }).join('')}
                        </ul>
                    </div>
                </div>

                <div class="mb-8">
                    <h3 class="font-semibold text-gray-900 mb-4">二、销售风险提示</h3>
                    <div class="space-y-2">
                        ${quoteData.risks && quoteData.risks.length > 0 ? 
                            quoteData.risks.map((risk, index) => `
                                <div class="${risk.level === 'high' ? 'risk-high' : 'risk-medium'} p-3 rounded-lg">
                                    <p class="text-sm text-gray-700"><span class="font-medium">风险${index + 1}：</span>${risk.risk}</p>
                                </div>
                            `).join('') : 
                            '<p class="text-gray-500 text-center py-4">暂无风险提示</p>'
                        }
                    </div>
                </div>

                <div class="mb-8">
                    <h3 class="font-semibold text-gray-900 mb-4">三、产品方案对比</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full border-collapse">
                            <thead>
                                <tr class="bg-gray-100">
                                    <th class="border border-gray-300 px-4 py-3 text-left text-sm font-medium">方案</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center text-sm font-medium">价格</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center text-sm font-medium">包含产品</th>
                                    <th class="border border-gray-300 px-4 py-3 text-center text-sm font-medium">推荐度</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.values(quoteData.versions || {}).map((version, key) => `
                                    <tr class="${key === 'standard' ? 'bg-purple-50' : ''}">
                                        <td class="border border-gray-300 px-4 py-3 font-medium">${version.name}</td>
                                        <td class="border border-gray-300 px-4 py-3 text-center font-semibold">¥${version.price.toLocaleString()}</td>
                                        <td class="border border-gray-300 px-4 py-3">
                                            <div class="flex flex-wrap gap-1 justify-center">
                                                ${version.features.map(f => `<span class="text-xs bg-gray-200 px-2 py-1 rounded">${f}</span>`).join('')}
                                            </div>
                                        </td>
                                        <td class="border border-gray-300 px-4 py-3 text-center">
                                            ${key === 'standard' ? '<span class="text-green-600">★★★</span>' : key === 'premium' ? '<span class="text-blue-600">★★</span>' : '<span class="text-gray-400">★</span>'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-8 pt-6 border-t">
                    <div>
                        <p class="text-sm text-gray-500 mb-2">客户确认</p>
                        <div class="h-20 border-b border-gray-300"></div>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500 mb-2">销售签字</p>
                        <div class="h-20 border-b border-gray-300"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('page-container').innerHTML = content;
    document.getElementById('page-title').textContent = '文档生成';
    document.getElementById('page-subtitle').textContent = '销售方案建议书预览';
}

function printDocument() {
    window.print();
}

function downloadDocument() {
    const content = document.getElementById('document-content').innerHTML;
    const html = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>需求确认单</title>
            <style>
                body { font-family: 'Inter', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .risk-high { background-color: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 12px; margin: 8px 0; border-radius: 4px; }
                .risk-medium { background-color: rgba(251, 191, 36, 0.1); border-left: 4px solid #fbbf24; padding: 12px; margin: 8px 0; border-radius: 4px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; }
                th { background-color: #f3f4f6; }
            </style>
        </head>
        <body>${content}</body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `需求确认单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('文档已下载', 'success');
}

function renderKnowledgePage() {
    const content = `
        <div class="max-w-5xl mx-auto">
            <div class="text-center mb-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-2">企业私有资料AI化管理</h2>
                <p class="text-gray-600">将企业的价格体系、服务体系、产品体系上传到系统，AI自动解析并赋能销售培训</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                    <div class="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                        <i class="fa-solid fa-tag text-blue-600 text-2xl"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">价格体系管理</h3>
                    <p class="text-gray-500 text-sm mb-4">上传企业的产品价格表、报价规则、折扣政策等资料</p>
                    <button onclick="uploadPriceSystem()" class="w-full py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
                        上传价格资料
                    </button>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
                    <div class="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                        <i class="fa-solid fa-headset text-green-600 text-2xl"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">服务体系管理</h3>
                    <p class="text-gray-500 text-sm mb-4">上传企业的服务流程、售后政策、客户服务标准等资料</p>
                    <button onclick="uploadServiceSystem()" class="w-full py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium">
                        上传服务资料
                    </button>
                </div>

                <div class="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
                    <div class="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                        <i class="fa-solid fa-box text-purple-600 text-2xl"></i>
                    </div>
                    <h3 class="font-semibold text-gray-900 mb-2">产品体系管理</h3>
                    <p class="text-gray-500 text-sm mb-4">上传企业的产品手册、功能介绍、技术参数等资料</p>
                    <button onclick="uploadProductSystem()" class="w-full py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium">
                        上传产品资料
                    </button>
                </div>
            </div>

            <div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white mb-8">
                <h3 class="font-semibold text-xl mb-4">AI处理流程</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="text-center">
                        <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                            <span class="font-bold">1</span>
                        </div>
                        <h4 class="font-medium mb-1">资料上传</h4>
                        <p class="text-white/80 text-sm">上传Excel、Word、PDF等格式文件</p>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                            <span class="font-bold">2</span>
                        </div>
                        <h4 class="font-medium mb-1">AI解析</h4>
                        <p class="text-white/80 text-sm">智能识别关键信息和业务规则</p>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                            <span class="font-bold">3</span>
                        </div>
                        <h4 class="font-medium mb-1">向量化存储</h4>
                        <p class="text-white/80 text-sm">转换为向量嵌入，便于智能检索</p>
                    </div>
                    <div class="text-center">
                        <div class="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                            <span class="font-bold">4</span>
                        </div>
                        <h4 class="font-medium mb-1">智能赋能</h4>
                        <p class="text-white/80 text-sm">应用于销售培训、智能追问、方案生成</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-8">
                <h3 class="font-semibold text-gray-900 mb-4">已上传的企业资料</h3>
                <div class="space-y-3">
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <i class="fa-solid fa-file-excel text-blue-600"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-900">产品价格表.xlsx</p>
                                <p class="text-sm text-gray-500">2024年最新价格体系 | 上传于 2024-01-15</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-lg">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button class="text-gray-400 hover:text-red-500 p-2 hover:bg-gray-200 rounded-lg">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <i class="fa-solid fa-file-word text-green-600"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-900">服务流程手册.docx</p>
                                <p class="text-sm text-gray-500">售后服务标准流程 | 上传于 2024-01-10</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-lg">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button class="text-gray-400 hover:text-red-500 p-2 hover:bg-gray-200 rounded-lg">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <i class="fa-solid fa-file-pdf text-purple-600"></i>
                            </div>
                            <div>
                                <p class="font-medium text-gray-900">产品白皮书.pdf</p>
                                <p class="text-sm text-gray-500">全系列产品介绍 | 上传于 2024-01-08</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-lg">
                                <i class="fa-solid fa-edit"></i>
                            </button>
                            <button class="text-gray-400 hover:text-red-500 p-2 hover:bg-gray-200 rounded-lg">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('page-container').innerHTML = content;
    document.getElementById('page-title').textContent = '培训原理';
    document.getElementById('page-subtitle').textContent = '企业私有资料AI化管理';
}

function uploadPriceSystem() {
    showToast('价格体系上传功能开发中...', 'info');
}

function uploadServiceSystem() {
    showToast('服务体系上传功能开发中...', 'info');
}

function uploadProductSystem() {
    showToast('产品体系上传功能开发中...', 'info');
}

function setKnowledgeMode(mode) {
    saveData('knowledgeMode', mode);
    renderKnowledgePage();
}

function navigateTo(page) {
    window.location.hash = page;
}

function quickDemo() {
    showToast('正在启动快速演示...', 'info');
    
    setTimeout(() => {
        saveData('selectedIndustry', 'education');
        saveData('selectedCustomer', 'career-change');
        saveData('customerRequirement', '我现在是一名行政，工作3年了，工资太低，想转行做前端开发');
        saveData('userAnswers', {
            1: ['职场转行'],
            2: ['想转行', '想加薪'],
            3: ['零基础'],
            4: ['2-4小时'],
            5: ['5000-10000元'],
            6: ['越快越好'],
            7: ['线下面授'],
            8: ['怕学不会', '怕太贵']
        });
        
        calculateQuote();
        
        setTimeout(() => {
            navigateTo('document');
            showToast('快速演示完成！', 'success');
        }, 500);
    }, 800);
}

function showGuide(step) {
    const guideSteps = [
        { target: '#quick-demo', title: '快速演示', description: '点击快速演示按钮，一键体验完整流程' },
        { target: '.nav-item[data-page="industry"]', title: '行业选择', description: '选择您所在的行业知识库' },
        { target: '.nav-item[data-page="knowledge"]', title: '知识库原理', description: '了解双层RAG知识库架构' }
    ];
    
    if (step >= guideSteps.length) {
        saveData('guideShown', true);
        document.getElementById('guide-overlay').remove();
        return;
    }
    
    const stepData = guideSteps[step];
    const target = document.querySelector(stepData.target);
    
    const overlay = document.createElement('div');
    overlay.id = 'guide-overlay';
    overlay.className = 'guide-overlay';
    overlay.innerHTML = `
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-6 max-w-md shadow-2xl">
            <div class="flex items-center justify-between mb-4">
                <h3 class="font-semibold text-gray-900">${stepData.title}</h3>
                <span class="text-sm text-gray-500">${step + 1} / ${guideSteps.length}</span>
            </div>
            <p class="text-gray-600 mb-6">${stepData.description}</p>
            <div class="flex justify-end gap-3">
                <button onclick="saveData('guideShown', true); document.getElementById('guide-overlay').remove();" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    跳过
                </button>
                <button onclick="document.getElementById('guide-overlay').remove(); showGuide(${step + 1});" class="btn-primary text-white px-4 py-2 rounded-lg">
                    下一步
                </button>
            </div>
        </div>
    `;
    
    if (target) {
        target.classList.add('ring-2', 'ring-purple-500', 'ring-offset-2');
        overlay.addEventListener('click', () => {
            target.classList.remove('ring-2', 'ring-purple-500', 'ring-offset-2');
        }, { once: true });
    }
    
    document.body.appendChild(overlay);
}

function initGuide() {
    const guideShown = loadData('guideShown');
    if (!guideShown) {
        setTimeout(() => showGuide(0), 1000);
    }
}

function initApp() {
    const page = window.location.hash.slice(1) || 'home';
    renderPage(page);
    
    window.addEventListener('hashchange', () => {
        const newPage = window.location.hash.slice(1) || 'home';
        renderPage(newPage);
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    document.getElementById('quick-demo').addEventListener('click', quickDemo);
    
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    
    initGuide();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (sidebar.classList.contains('sidebar-collapsed')) {
        sidebar.classList.remove('sidebar-collapsed');
        toggleBtn.innerHTML = '<i class="fa-solid fa-chevron-left text-gray-500"></i>';
    } else {
        sidebar.classList.add('sidebar-collapsed');
        toggleBtn.innerHTML = '<i class="fa-solid fa-chevron-right text-gray-500"></i>';
    }
}

function renderPage(page) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('sidebar-active');
    });
    
    const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (activeNav) {
        activeNav.classList.add('sidebar-active');
    }
    
    switch(page) {
        case 'home':
            renderHomePage();
            break;
        case 'industry':
            renderIndustryPage();
            break;
        case 'customer':
            renderCustomerPage();
            break;
        case 'questioning':
            renderQuestioningPage();
            break;
        case 'quote':
            renderQuotePage();
            break;
        case 'document':
            renderDocumentPage();
            break;
        case 'knowledge':
            renderKnowledgePage();
            break;
        default:
            renderHomePage();
    }
}

document.addEventListener('DOMContentLoaded', initApp);