// ===== 案例数据模块 =====

const Cases = {
    dimensionNames: {
        direction: '方向感',
        certainty: '确定性',
        timing: '时间感',
        cost: '代价感'
    },
    
    dimensionColors: {
        direction: '#137aa8',
        certainty: '#2199d4',
        timing: '#f3952f',
        cost: '#0f7c4f'
    },
    
    questions: {
        direction: {
            dimension: '方向感',
            coreQuestion: '这条路是我的，还是别人的？',
            question: '如果完全不需要向任何人解释你的选择，你仍然会走这条路吗？',
            scaleMin: '完全不确定',
            scaleMax: '非常清晰',
            scaleDescriptions: {
                1: '不会。这条路更像是别人期待的，我是在回应他们',
                2: '偏向不会。好像更多是"应该走"而非"想走"',
                3: '不确定。一部分想走，一部分觉得"可能不该走"',
                4: '偏向会。虽然有点犹豫，但内心深处的方向是明确的',
                5: '会。即使没有任何人知道或认可，我依然会选择走这条路'
            },
            bodyPrompt: '当你想象"不需要向任何人解释"时，身体有变轻松还是变沉重？哪个部位？'
        },
        certainty: {
            dimension: '确定性',
            coreQuestion: '我知道怎么走吗？',
            question: '关于实现这个目标的具体路径，你现在能清晰地看到几步？',
            scaleMin: '无法承受',
            scaleMax: '完全能承受',
            scaleDescriptions: {
                1: '非常模糊。几乎不知道怎么走到那里，也不确定从哪开始',
                2: '比较模糊。只有初步想法，但缺少具体路径和可执行的方案',
                3: '部分清晰。知道大方向，但具体怎么走、需要什么资源还不明确',
                4: '比较清晰。能看清大致路线和主要步骤，少数环节还不确定',
                5: '非常清晰。我知道第一步做什么、第二步做什么，也知道卡住时找谁'
            },
            bodyPrompt: '当你试图想象具体步骤时，身体是向前倾的还是往后缩的？'
        },
        timing: {
            dimension: '时间感',
            coreQuestion: '没有反馈时，我能坚持吗？',
            question: '如果这个选择在接下来你认为较长的时间里，都不会出现明确的进展信号，你还会继续走吗？',
            scaleMin: '时机未到',
            scaleMax: '时机成熟',
            scaleDescriptions: {
                1: '很可能放弃。我无法接受长时间没有进展或确认的情况',
                2: '很可能放弃。我发现自己需要更及时的反馈和阶段性成果才能坚持',
                3: '不确定。要考虑其他机会的出现情况',
                4: '很可能继续。有坚持的意愿，但需要偶尔的小信号维持动力',
                5: '一定会继续。即使没有进展信号，我相信它值得等待和持续投入'
            },
            bodyPrompt: '当你想象"没有进展"时，身体哪个部位先有反应？是紧的、沉的，还是别的感受？',
            note: '"你认为较长的时间"在不同决策类型中对应的实际时长不同——副业可能是3-6个月，转行可能是1-2年。请根据你正在评估的具体决策自行代入相应尺度。'
        },
        cost: {
            dimension: '代价感',
            coreQuestion: '失败了，我能放过自己吗？',
            question: '如果这个选择最终没有达到你预期的结果，你更可能倾向于？',
            scaleMin: '不愿付出',
            scaleMax: '全力以赴',
            scaleDescriptions: {
                1: '完全倾向反复回想"当初要是……就好了"，感觉很难放过自己',
                2: '主要倾向反复回想和懊恼，较难主动转向下一步',
                3: '两种倾向都有。会懊恼，也会尝试理解原因，来回拉扯',
                4: '有些懊恼，但能较快转向"接下来怎么办"',
                5: '主要倾向寻找下一个方向。会复盘原因，但不会长时间自我责备'
            },
            bodyPrompt: '当你想象"失败"时，胸口或胃部有紧缩感吗？是有重量的，还是灼热的？'
        }
    },
    
    getDimensionOrder: function() {
        return ['direction', 'certainty', 'timing', 'cost'];
    },
    
    getDimensionColor: function(dimension) {
        return this.dimensionColors[dimension] || '#137aa8';
    },
    
    getCaseList: function() {
        return [
            {
                id: 'car-business',
                title: '车载经营决策',
                description: '是否将私家车改为网约车运营，增加收入来源',
                icon: '🚗',
                thumbnailColor: '#137aa8',
                tags: ['收入', '时间', '风险'],
                featured: true
            },
            {
                id: 'city-change',
                title: '换城市生活',
                description: '是否离开当前城市，去新的城市发展',
                icon: '🏙️',
                thumbnailColor: '#2199d4',
                tags: ['发展', '适应', '人脉']
            },
            {
                id: 'career-switch',
                title: '职业转型决策',
                description: '是否从当前行业转入FDE领域发展',
                icon: '💼',
                thumbnailColor: '#f3952f',
                tags: ['转型', '学习', '前景'],
                featured: true
            }
        ];
    },
    
    getCaseById: function(caseId) {
        return this.getCaseList().find(c => c.id === caseId);
    },
    
    externalData: {
        'car-business': {
            overallReport: '根据公开政策文件和行业报道，车载经营（后备箱集市/移动经营）的外部环境评估如下：\n- **方向感：4/5** —— 商务部等9部门2026年6月正式发文支持汽车后市场发展，政策明确转向"用汽车"全链条，趋势向上。\n- **确定性：3/5** —— 已有多个成功案例（郑州咖啡、上海后备箱市集等），但行业标准和盈利模式尚未定型，收入波动较大。\n- **时间感：4/5** —— 政策刚刚落地，40个试点城市先行先试，当前属于"中等偏早"的入场窗口期。\n- **代价感：4/5** —— 无需门店租金，仅需私家车+少量备货，成本可控；但收入不稳定，需承担一定波动风险。\n\n**外部环境总体判断：** 政策面明确支持，门槛低、时机适中，但模式和收入存在不确定性。适合低成本试错、快速验证的进入策略。',
            direction: {
                score: 4,
                reliability: '高可信',
                coreJudgment: '政策支持明确',
                assessment: '商务部等9部门2026年6月正式发文支持汽车后市场发展，政策明确转向"用汽车"全链条，趋势向上',
                evidence: [
                    { source: '商务部等9部门关于支持汽车后市场发展的指导意见（2026年6月）', content: '明确支持"后备箱经济"、"移动经营"等新型消费模式' },
                    { source: '中国汽车流通协会《2026年汽车后市场白皮书》', content: '预计汽车后市场规模将突破1.5万亿元' },
                    { source: '多地试点城市政策', content: '北京、上海、成都等40个城市已出台支持措施' }
                ]
            },
            certainty: {
                score: 3,
                reliability: '中可信',
                coreJudgment: '模式尚未定型',
                assessment: '已有多个成功案例（郑州咖啡、上海后备箱市集等），但行业标准和盈利模式尚未定型，收入波动较大',
                evidence: [
                    { source: '郑州"后备箱咖啡"模式', content: '月收入可达8000-15000元，但季节性明显' },
                    { source: '上海后备箱市集调研', content: '周末参与摊位平均日营收300-800元' },
                    { source: '行业专家分析', content: '盈利模式仍在探索，规模化复制难度较大' }
                ]
            },
            timing: {
                score: 4,
                reliability: '高可信',
                coreJudgment: '入场窗口期',
                assessment: '政策刚刚落地，40个试点城市先行先试，当前属于"中等偏早"的入场窗口期',
                evidence: [
                    { source: '商务部试点政策', content: '40个试点城市先行先试，政策红利期约1-2年' },
                    { source: '行业发展阶段分析', content: '当前处于早期探索阶段，竞争相对较小' },
                    { source: '消费趋势报告', content: '夜间经济、移动消费成为新增长点' }
                ]
            },
            cost: {
                score: 4,
                reliability: '高可信',
                coreJudgment: '成本可控',
                assessment: '无需门店租金，仅需私家车+少量备货，成本可控；但收入不稳定，需承担一定波动风险',
                evidence: [
                    { source: '典型成本测算', content: '启动资金约5000-10000元（备货+设备）' },
                    { source: '车辆损耗评估', content: '月均增加里程500-1000公里，油费+保养约800-1500元' },
                    { source: '保险成本', content: '需额外购买营运保险，年增加约3000-5000元' }
                ]
            }
        },
        'city-change': {
            overallReport: '根据公开人才流动报告和各城市政策文件，换城市决策的外部环境评估如下：\n- **方向感：4/5** —— 全国人才流动呈现"一线聚焦高端、新一线多点爆发"格局。成都、杭州、武汉等新一线城市需求井喷，地级市承接产业转移。\n- **确定性：3/5** —— 各城市路径清晰，但具体政策细节差异大。成都2026年密集出台人才新政（十条措施、优租行动等），补贴力度明确。\n- **时间感：4/5** —— 城市格局重塑窗口期，各城市抢人政策密集释放。成渝双城正加速一体化。\n- **代价感：3/5** —— 各地均有安居补贴和人才政策，但一线生活成本高、新一线性价比优，需根据个人收入预期综合权衡。\n\n**外部环境总体判断：** 新一线城市（尤其是成都、杭州）正处于政策红利密集期，一线城市适合追求天花板的人群，地级市适合追求性价比和稳定性的人群。关键在于你的能力结构与哪类城市的产业方向匹配。',
            direction: {
                score: 4,
                reliability: '高可信',
                coreJudgment: '人才流动趋势明确',
                assessment: '全国人才流动呈现"一线聚焦高端、新一线多点爆发"格局。成都、杭州、武汉等新一线城市需求井喷，地级市承接产业转移',
                evidence: [
                    { source: '36氪《2026人才迁徙地图》', content: '新一线城市人才净流入率连续3年上升' },
                    { source: '智联招聘《2026年人才市场报告》', content: '杭州、成都、武汉人才需求增速超30%' },
                    { source: '国家发改委城市竞争力报告', content: '区域经济一体化加速，人才流动呈现网络化特征' }
                ]
            },
            certainty: {
                score: 3,
                reliability: '中可信',
                coreJudgment: '路径清晰但差异大',
                assessment: '各城市路径清晰，但具体政策细节差异大。成都2026年密集出台人才新政（十条措施、优租行动等），补贴力度明确',
                evidence: [
                    { source: '成都"吸引集聚人才十条措施"（2026年6月27日）', content: '围绕59项举措全方位支持人才' },
                    { source: '成都市人才优租行动实施细则（2026年4月）', content: 'A/B类人才租金100%补贴，C类70%，D/E类50%' },
                    { source: '杭州"8+4"经济政策（2026年）', content: '投入515亿元，本科/硕士/博士应届生生活补贴分别为1万/3万/10万元' },
                    { source: '深圳人才引进政策', content: '提供最长15天免费住宿及住房补贴' },
                    { source: '北京青年人才公寓计划', content: '提供100万平米创业空间和1万套青年人才公寓' }
                ]
            },
            timing: {
                score: 4,
                reliability: '高可信',
                coreJudgment: '政策红利窗口期',
                assessment: '城市格局重塑窗口期，各城市抢人政策密集释放。成渝双城正加速一体化',
                evidence: [
                    { source: '成渝地区双城经济圈建设规划', content: '2026年进入实质性建设阶段，人才需求旺盛' },
                    { source: '各地2026年人才政策密集出台', content: '超20个城市发布人才引进新政' },
                    { source: '人口数据统计', content: '深圳2026年人口增量居全国前列' }
                ]
            },
            cost: {
                score: 3,
                reliability: '中可信',
                coreJudgment: '成本差异显著',
                assessment: '各地均有安居补贴和人才政策，但一线生活成本高、新一线性价比优，需根据个人收入预期综合权衡',
                evidence: [
                    { source: '麦可思研究院《2026年中国本科生就业报告》', content: '2025届本科毕业生平均月收入6435元' },
                    { source: '成都人才政策', content: '引进急需紧缺人才每人每月补贴最低800元，青年人才驿站房费"3免3减半"' },
                    { source: '杭州人才政策', content: 'A类人才最高800万元购房补贴' },
                    { source: '生活成本对比', content: '一线城市生活成本是新一线城市的1.5-2倍' }
                ]
            },
            cityComparison: {
                cities: ['一线城市', '杭州', '成都', '武汉/西安', '地级市'],
                salary: [100, 85, 70, 60, 45],
                costOfLiving: [100, 70, 55, 50, 35],
                policySupport: [60, 90, 85, 75, 50],
                careerOpportunity: [100, 80, 65, 55, 30]
            }
        },
        'career-switch': {
            overallReport: '根据主流互联网公司招聘信息和行业薪酬报告，转行前线部署工程师（FDE）的外部环境评估如下：\n- **方向感：4/5** —— FDE岗位需求旺盛，字节、阿里、腾讯、智谱华章等头部企业均在大规模招聘，属于AI时代的核心岗位。\n- **确定性：2/5** —— 岗位要求明确但门槛高，需兼具技术能力和业务理解，转型周期较长（3-6个月）。\n- **时间感：4/5** —— AI行业快速发展期，FDE作为连接技术与业务的关键角色，越早进入越有先发优势。\n- **代价感：2/5** —— 高回报伴随高门槛，学习成本高，初期收入可能下降，但成功转型后薪资涨幅显著。\n\n**外部环境总体判断：** FDE是AI时代的黄金赛道，薪资天花板高，但转型门槛也高。适合有编程基础或咨询/交付经验的人，通过3-6个月的集中学习实现转型。',
            direction: {
                score: 4,
                reliability: '高可信',
                coreJudgment: '岗位需求旺盛',
                assessment: 'FDE岗位需求旺盛，字节、阿里、腾讯、智谱华章等头部企业均在大规模招聘，属于AI时代的核心岗位',
                evidence: [
                    { source: '字节跳动招聘官网（2026年）', content: 'FDE岗位月薪3.5万-7万元，15薪，年薪最高105万元' },
                    { source: '阿里云智能招聘', content: 'FDE岗位月薪2万-5万元，16薪' },
                    { source: '蚂蚁数科招聘', content: 'B端FDE岗位月薪4万-6万元，15薪' },
                    { source: '智谱华章招聘', content: 'FDE负责人岗位月薪6万-8万元' },
                    { source: 'OpenAI招聘', content: 'FDE底薪21万美元起' }
                ]
            },
            certainty: {
                score: 2,
                reliability: '低可信',
                coreJudgment: '转型风险高',
                assessment: '岗位要求明确但门槛高，需兼具技术能力和业务理解，转型周期较长（3-6个月）',
                evidence: [
                    { source: '腾讯招聘官网（2026年6月）', content: 'FDE核心能力要求：本科及以上，计算机/AI/数学/物理等相关专业' },
                    { source: 'Michael Page FDE岗位要求（2026年6月）', content: '3年以上ToB项目交付/客户支撑经验，2年以上大模型深度应用经验' },
                    { source: '行业招聘标准', content: '需熟练Python/TypeScript/API开发，熟悉云环境（AWS/Azure/GCP）' },
                    { source: '岗位特性分析', content: '既是技术岗又是业务岗——需兼具"能写代码"和"能跟客户CEO谈ROI"的能力' }
                ]
            },
            timing: {
                score: 4,
                reliability: '高可信',
                coreJudgment: '越早越好',
                assessment: 'AI行业快速发展期，FDE作为连接技术与业务的关键角色，越早进入越有先发优势',
                evidence: [
                    { source: 'Perspective AI 2026年FDE薪酬调查', content: '资深FDE年薪中位数48.5万美元' },
                    { source: '行业发展趋势', content: 'AI应用落地加速，FDE需求持续增长' },
                    { source: '人才供给分析', content: '具备AI应用经验的FDE人才稀缺，市场供不应求' }
                ]
            },
            cost: {
                score: 2,
                reliability: '低可信',
                coreJudgment: '学习成本高',
                assessment: '高回报伴随高门槛，学习成本高，初期收入可能下降，但成功转型后薪资涨幅显著',
                evidence: [
                    { source: '转型周期评估', content: '零基础需6-12个月学习，有编程基础需3-6个月' },
                    { source: '学习路径', content: '需掌握Python/RAG/Agent/Prompt Engineering等核心技能' },
                    { source: '机会成本', content: '转型期间收入可能下降30%-50%' },
                    { source: '成功案例', content: '通过集中学习成功转型的案例，薪资涨幅可达50%-100%' }
                ]
            },
            salaryData: {
                companies: ['字节跳动', '阿里云', '蚂蚁数科', '智谱华章', 'OpenAI'],
                monthlySalary: [50, 35, 50, 70, 140],
                annualBonus: [15, 16, 15, 15, 14]
            }
        }
    },
    
    getDemoScores: function(caseId) {
        const scores = {
            'car-business': {
                direction: 3,
                certainty: 2,
                timing: 4,
                cost: 3
            },
            'city-change': {
                direction: 3,
                certainty: 2,
                timing: 3,
                cost: 2
            },
            'career-switch': {
                direction: 4,
                certainty: 2,
                timing: 3,
                cost: 2
            }
        };
        return scores[caseId] || { direction: 3, certainty: 3, timing: 3, cost: 3 };
    }
};

window.Cases = Cases;