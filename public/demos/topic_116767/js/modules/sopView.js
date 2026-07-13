var SopView = (function() {

    var timers = [];

    function addTimer(timerId) {
        timers.push(timerId);
        return timerId;
    }

    function clearAllTimers() {
        timers.forEach(function(t) {
            clearTimeout(t);
            clearInterval(t);
            cancelAnimationFrame(t);
        });
        timers = [];
    }

    function throttle(fn, delay) {
        var lastTime = 0;
        var timer = null;
        return function() {
            var now = Date.now();
            var context = this;
            var args = arguments;
            if (now - lastTime >= delay) {
                lastTime = now;
                fn.apply(context, args);
            } else {
                if (timer) clearTimeout(timer);
                timer = addTimer(setTimeout(function() {
                    lastTime = Date.now();
                    fn.apply(context, args);
                }, delay - (now - lastTime)));
            }
        };
    }

    var container = null;


    var el = {};


    function cacheElements() {
        el.topProgressFill = document.getElementById('sop-top-progress-fill');
        el.topProgressText = document.getElementById('sop-top-progress-text');
        el.topProgressPercent = document.getElementById('sop-top-progress-percent');
        el.topProgressStage = document.getElementById('sop-top-progress-stage');
        el.topProgressStep = document.getElementById('sop-top-progress-step');
        el.topProgressClickable = document.getElementById('sop-top-progress-clickable');
        el.stepNav = document.getElementById('sop-step-nav');
        el.stageContent = document.getElementById('sop-stage-content');
        el.completionSummary = document.getElementById('sop-completion-summary');
        el.stepCurrent = document.getElementById('sop-step-current');
        el.completeBtn = document.getElementById('sop-complete-btn');
        el.sidePanelOverlay = document.getElementById('sop-side-panel-overlay');
        el.sidePanel = document.getElementById('sop-side-panel');
        el.sidePanelTitle = document.getElementById('sop-side-panel-title');
        el.sidePanelBody = document.getElementById('sop-side-panel-body');
        el.sidePanelClose = document.getElementById('sop-side-panel-close');
        el.backHomeBtn = document.getElementById('sop-back-home');
        el.stepOverlay = document.getElementById('sop-step-overlay');
        el.stepOverview = document.getElementById('sop-step-overview');
        el.stepOverviewBody = document.getElementById('sop-step-overview-body');
        el.stepOverviewClose = document.getElementById('sop-step-overview-close');
        el.modeBadge = document.getElementById('sop-mode-badge');
        el.modeSwitchModal = document.getElementById('sop-mode-switch-modal');
        el.modeSwitchOverlay = document.getElementById('sop-mode-switch-modal-overlay');
        el.modeSwitchClose = document.getElementById('sop-mode-switch-modal-close');
        el.modeSwitchBody = document.getElementById('sop-mode-switch-modal-body');
        el.moreBtn = document.getElementById('sop-more-btn');
        el.moreSettings = document.getElementById('sop-more-settings');
        el.settingsBtn = document.getElementById('sop-settings-btn');
        el.delayBtn = document.getElementById('sop-delay-btn');
        el.delayModal = document.getElementById('sop-delay-modal');
        el.delayModalOverlay = document.getElementById('sop-delay-modal-overlay');
        el.delayModalBody = document.getElementById('sop-delay-modal-body');
        el.delayModalClose = document.getElementById('sop-delay-modal-close');
        el.delayCancelBtn = document.getElementById('sop-delay-cancel-btn');
        el.delayConfirmBtn = document.getElementById('sop-delay-confirm-btn');
        el.delayCustomInput = document.getElementById('sop-delay-custom-input');
        el.delayCustomDaysDiv = document.getElementById('sop-delay-custom-days');
        el.completeConfirmModal = document.getElementById('sop-complete-confirm-modal');
        el.completeConfirmOverlay = document.getElementById('sop-complete-confirm-modal-overlay');
        el.completeConfirmBody = document.getElementById('sop-complete-confirm-modal-body');
        el.completeConfirmClose = document.getElementById('sop-complete-confirm-modal-close');
        el.completeConfirmCancelBtn = document.getElementById('sop-complete-confirm-cancel');
        el.completeConfirmOkBtn = document.getElementById('sop-complete-confirm-ok');
        el.photoModal = document.getElementById('sop-photo-modal');
        el.photoModalClose = document.getElementById('sop-photo-modal-close');
        el.safetyBanner = document.getElementById('sop-safety-banner');
        el.safetyChecklist = document.getElementById('sop-safety-checklist');
        el.mobileNavToggle = document.getElementById('sop-mobile-nav-toggle');
        el.mobileNavDrawer = document.getElementById('sop-mobile-nav-drawer');
        el.mobileNavOverlay = document.getElementById('sop-mobile-nav-overlay');
        el.mobileNavContent = document.getElementById('sop-mobile-nav-content-inner');
        el.downloadAllBtn = document.getElementById('sop-download-all-btn');
    }

    function clearElementCache() {
        el = {};
    }


    var currentStepId = 'S1-1';


    var isMobile = false;


    var purchasedMaterials = {};


    var eventListenersBound = false;


    var throttledHandleResize = null;


    var checklistProgress = {};


    var expandedStepId = null;


    var expandedCompletedStepId = null;


    var aiResultOpen = {};


    var sidePanelOpen = null;


    var stepOverviewOpen = false;


    var moreMenuOpen = false;


    var delayModalOpen = false;


    var currentDelayStepId = null;


    var safetyChecklistState = {};


    var modeSwitchModalOpen = false;


    var selectedModeForSwitch = null;


    var collapsedNavStages = {};


    var mobileNavOpen = false;


    var stepPhotos = {};

    var deepTabStates = {};
    var deepFaqStates = {};
    var deepChecklistStates = {};

    var isAnalyzingFloorplan = false;
    var floorplanAnalyzingStep = null;


    var AI_TOOL_TYPES = {


        communication: { icon: '💬', name: '沟通话术' },


        inspection: { icon: '🔍', name: '拍照验工' },


        addon: { icon: '💰', name: '增项参考' },


        payment: { icon: '💳', name: '付款计算' },


        delay: { icon: '⏰', name: '工期预警' }


    };


    var STEP_AI_TOOLS = {
        'F-1': [
            { id: 'company-match', name: '装修公司智能匹配（示例效果）', icon: '🏢', desc: '根据需求推荐合适的装修公司参考', type: 'companyMatch', subtype: 'default' }
        ],
        'F-2': [
            { id: 'floorplan-analysis', name: '户型图智能分析（示例效果）', icon: '🏠', desc: '上传户型图，获取布局分析参考', type: 'floorplanAnalysis', subtype: 'default' },
            { id: 'communication-liangfang', name: '沟通话术模板（量房版）', icon: '💬', desc: '量房沟通的3种风格话术模板', type: 'communication', subtype: 'liangfang-goutong' }
        ],
        'F-3': [
            { id: 'floorplan-analysis', name: '户型图智能分析（示例效果）', icon: '🏠', desc: '上传户型图，获取布局分析参考', type: 'floorplanAnalysis', subtype: 'default' },
            { id: 'quote-audit', name: '报价智能审核（示例效果）', icon: '💰', desc: '输入报价信息，获取报价分析参考', type: 'quoteAudit', subtype: 'default' }
        ],
        'F-4': [
            { id: 'contract-risk', name: '合同风险扫描（示例效果）', icon: '📋', desc: '分析合同条款风险，提供参考建议', type: 'contractRisk', subtype: 'default' },
            { id: 'payment-calc', name: '付款计算器', icon: '💳', desc: '根据合同总价计算各期付款金额', type: 'paymentCalc', subtype: 'default' }
        ],
        'F-5': [
            { id: 'progress-overview', name: '装修进度概览', icon: '📊', desc: '预算消耗和工期进度一目了然', type: 'progressOverview', subtype: 'default', isSpecial: true },
            { id: 'material-inspection', name: '材料进场验收（首批辅材版）（示例效果）', icon: '📦', desc: '材料验收参考清单', type: 'materialInspection', subtype: 'default' },
            { id: 'communication-sifang-jiadi', name: '沟通话术模板（交底版）', icon: '💬', desc: '四方交底沟通的3种风格话术模板', type: 'communication', subtype: 'sifang-jiadi' }
        ],
        'F-10': [
            { id: 'water-electric-plan', name: '水电点位智能规划（示例效果）', icon: '⚡', desc: '基于户型和家电清单生成点位规划参考', type: 'waterElectricPlan', subtype: 'default' },
            { id: 'inspection-shuidian', name: '质量诊断（水电专项）（示例效果）', icon: '🔍', desc: '水电工程质量检测参考与评分', type: 'inspection', subtype: 'shuidian-zhuanxiang' },
            { id: 'communication-shuidian-yanshou', name: '沟通话术模板（水电验收版）', icon: '💬', desc: '水电验收沟通的3种风格话术模板', type: 'communication', subtype: 'shuidian-yanshou' }
        ],
        'F-12': [
            { id: 'material-inspection-tile', name: '材料进场验收（瓷砖版）（示例效果）', icon: '📦', desc: '瓷砖等材料进场验收参考', type: 'materialInspection', subtype: 'tile' },
            { id: 'inspection-niwa', name: '质量诊断（泥瓦专项）（示例效果）', icon: '🔍', desc: '泥瓦工程质量检测参考与评分', type: 'inspection', subtype: 'niwa-zhuanxiang' }
        ],
        'F-15': [
            { id: 'inspection-mugong', name: '质量诊断（木工专项）（示例效果）', icon: '🔍', desc: '木工工程质量检测参考与评分', type: 'inspection', subtype: 'mugong-zhuanxiang' }
        ],
        'F-18': [
            { id: 'inspection-youqi', name: '质量诊断（油漆专项）（示例效果）', icon: '🔍', desc: '油漆工程质量检测参考与评分', type: 'inspection', subtype: 'youqi-zhuanxiang' }
        ],
        'F-20': [
            { id: 'inspection-dingzhi', name: '质量诊断（定制柜专项）（示例效果）', icon: '🔍', desc: '定制柜安装质量检测参考与评分', type: 'inspection', subtype: 'dingzhi-heyan' }
        ],
        'F-23': [
            { id: 'final-settlement', name: '竣工结算智能对账（示例效果）', icon: '📋', desc: '自动计算结算价，识别常见结算问题参考', type: 'finalSettlement', subtype: 'default' },
            { id: 'air-quality', name: '全屋空气质量评估（示例效果）', icon: '🌬️', desc: '室内空气质量评估参考与建议', type: 'airQuality', subtype: 'default' },
            { id: 'inspection-jungong', name: '质量诊断（竣工综合检查）（示例效果）', icon: '🔍', desc: '整体装修质量全面检查参考与评分', type: 'inspection', subtype: 'jungong-zonghe' }
        ],
        'S-4': [
            { id: 'safety-notice', name: '生成安全责任告知书', icon: '📋', desc: '自装施工安全责任告知书生成', type: 'safetyTool', subtype: 'safety-notice' },
            { id: 'insurance-reminder', name: '提醒买工人意外险', icon: '🛡️', desc: '工人意外险购买提醒和推荐', type: 'safetyTool', subtype: 'insurance-reminder' }
        ],
        'S-7': [
            { id: 'safety-notice', name: '生成安全责任告知书', icon: '📋', desc: '自装施工安全责任告知书生成', type: 'safetyTool', subtype: 'safety-notice' },
            { id: 'insurance-reminder', name: '提醒买工人意外险', icon: '🛡️', desc: '工人意外险购买提醒和推荐', type: 'safetyTool', subtype: 'insurance-reminder' }
        ],
        'S-8': [
            { id: 'safety-notice', name: '生成安全责任告知书', icon: '📋', desc: '自装施工安全责任告知书生成', type: 'safetyTool', subtype: 'safety-notice' },
            { id: 'insurance-reminder', name: '提醒买工人意外险', icon: '🛡️', desc: '工人意外险购买提醒和推荐', type: 'safetyTool', subtype: 'insurance-reminder' }
        ]
    };

    var STEP_EXTRA_DATA = {
        'F-1': {
            notes: [
                '不要只看报价总价，要对比单价、材料品牌和工艺标准',
                '套餐公司要特别注意包含边界，很多套餐不含定制柜、吊顶、背景墙',
                '实地考察在建工地比看样板间更真实，看工艺、看管理、看卫生',
                '问清楚付款节点和比例，尽量争取压尾款，别一次性付太多',
                '口头承诺不算数，所有谈好的内容都要写进合同或补充协议里'
            ],
            pitfalls: [
                { title: '低价套餐陷阱', desc: '表面报价便宜，实际漏项严重，后期增项能加30%-50%。避坑：拿到报价单逐项核对，问清楚哪些不含，提前估算增项预算。' },
                { title: '样板间迷惑', desc: '样板间装得好不等于你家也能装好，很多样板间是找最好的工人做的。避坑：一定要看在建工地，最好突击去看，别让公司提前安排。' }
            ]
        },
        'F-2': {
            notes: [
                '量房时尽量在场，当场跟设计师沟通你的生活习惯和功能需求',
                '让设计师量全房尺寸，包括梁位、窗位、下水位置、层高、门洞大小',
                '老房一定要量墙面垂直度和地面平整度，这些直接影响后面施工费用',
                '提前确定大家电型号尺寸，特别是嵌入式家电的预留尺寸要精准',
                '拍照记录每个管道的走向和高度，特别是厨房卫生间的下水位置',
                '有特殊需求当场说清楚，比如扫地机器人基站、宠物用品区等'
            ],
            pitfalls: [
                { title: '免费设计陷阱', desc: '说是免费设计，其实设计费早就摊在工程款里了，设计质量也没保障。避坑：对比设计质量，别因为免费就将就，设计不好后期全是坑。' },
                { title: '量房数据不准', desc: '设计师量房马马虎虎，漏量梁位、管井，后期施工尺寸不对要加钱。避坑：自己也随手量几个关键尺寸复核，特别是定制区域的尺寸。' }
            ]
        },
        'F-3': {
            notes: [
                '设计方案要结合生活习惯，不要只看好不好看，要看好不好用',
                '水电点位要跟着家电走，先定家电再定插座开关位置',
                '收纳空间宁多勿少，但也要合理规划，别做了一堆用不上的柜子',
                '灯光设计很重要，主灯+辅助灯结合，别只靠一个大灯照亮全屋',
                '一定要看效果图和施工图，确认每个细节再签字'
            ],
            pitfalls: [
                { title: '盲目跟风网红设计', desc: '看了很多网红装修图，照着装完发现不实用，打扫麻烦还容易过时。避坑：先想清楚自己的生活习惯，实用永远排在好看前面。' },
                { title: '水电点位没留够', desc: '入住后发现插座不够用，到处插排乱糟糟，或者位置被家具挡住了。避坑：拿着家电清单一个个核对，每个空间多预留2-3个插座。' }
            ]
        },
        'F-4': {
            notes: [
                '不要只看总价，要看单价、材料品牌型号、施工工艺、包含项目',
                '对比报价要统一口径，确保每家报的是同样的项目和材料',
                '注意漏项：防水、找平、吊顶、背景墙、水电改造这些最容易漏',
                '问清楚增项规则：哪些算增项、增项单价多少、增项要不要签字',
                '管理费、设计费、垃圾清运费这些杂费也要算进去'
            ],
            pitfalls: [
                { title: '低价钓鱼报价', desc: '故意漏项报低价吸引签约，施工中再不断增项，最后总价超支很多。避坑：逐项核对报价单，问清楚每个项目含不含，大概估算增项预算。' },
                { title: '材料品牌模糊', desc: '报价只写"某某品牌或同档次"，实际用的是最便宜的型号或者杂牌。避坑：要求写清楚品牌、型号、规格，最好连系列都写上。' }
            ]
        },
        'F-5': {
            notes: [
                '合同越细越好，口头承诺全部要写进合同，别嫌麻烦',
                '付款节点要和验收挂钩，验收合格再付款，钱在手里才有主动权',
                '增项条款要写清楚：增项必须提前报价、业主签字确认后才能施工',
                '工期延误赔偿要写清楚，每天赔多少，最高赔多少',
                '质保条款要看清：哪些保、保多久、谁来修、响应时间',
                '签合同前再核对一遍报价单和图纸，确认没问题再签字'
            ],
            pitfalls: [
                { title: '合同猫腻多', desc: '合同条款模糊，很多细节没写清，出了问题扯不清楚。避坑：逐条看合同，不懂就问，重要的补充条款一定要写进去。' },
                { title: '付款比例不合理', desc: '首期款就要付60%-70%，钱都付了后面出问题很被动。避坑：争取按3331或4321比例付款，尾款压5%-10%。' }
            ]
        },
        'F-6': {
            notes: [
                '承重墙、剪力墙、配重墙、梁、柱一律不能动，不确定的先问物业',
                '成品保护要到位：入户门、燃气表、水表、电表、已有设施都要包好',
                '新建墙体底部砌3层小砖防潮，上面斜砌顶紧楼板防沉降开裂',
                '新旧墙体连接处要挂钢丝网，每边搭接不少于15cm，防止开裂',
                '拆改垃圾及时清运，保持现场整洁，也避免绊倒伤人',
                '老房拆改前最好做结构鉴定，特别是涉及墙体改动的'
            ],
            pitfalls: [
                { title: '违规拆改承重墙', desc: '为了空间大私自拆承重墙，违法不说，还严重影响结构安全。避坑：拆改前先看原始结构图，不确定的问物业或找专业机构鉴定。' },
                { title: '新建墙体开裂', desc: '新砌的墙没多久就裂了，特别是和老墙连接处。避坑：新旧墙挂网、放拉结筋，顶部斜砌，让工人按规范来。' }
            ]
        },
        'F-7': {
            notes: [
                '燃气改造必须由燃气公司施工，装修公司不能私自改',
                '燃气表不能包死，要留检修口，方便后期查表和维修',
                '燃气管道不能走地下、不能穿墙、不能包在橱柜里完全封死',
                '改造前先预约燃气公司，排队期可能1-2周，要提前安排',
                '改造完要做打压测试，确认不漏气再签字'
            ],
            pitfalls: [
                { title: '私自改燃气', desc: '让装修工人私自改燃气，省钱但危险，漏气后果不堪设想。避坑：一定要找燃气公司或有资质的单位来改，安全第一。' },
                { title: '燃气表包死', desc: '为了好看把燃气表完全包在柜子里，查表维修都要拆柜子。避坑：留检修口，做活动门板，方便后期维护。' }
            ]
        },
        'F-8': {
            notes: [
                '定制柜初尺可以在拆改后就量，提前排产能省7-10天工期',
                '初尺时要确定好格局：抽屉、隔板、挂衣区怎么分配',
                '要和设计师确认收口方式：和墙、和顶、和门套怎么衔接',
                '提前想好要不要加灯带、拉手样式、抽屉滑轨品牌这些细节',
                '初尺方案确认后可以先签合同排产，复尺后再最终确认'
            ],
            pitfalls: [
                { title: '复尺才下单耽误工期', desc: '等贴完砖再量尺下单，定制周期要1个月，白白浪费时间。避坑：拆改完就可以初尺排产，贴完砖复尺调整，能省不少时间。' },
                { title: '格局设计不合理', desc: '柜子做出来不好用，隔板太多挂衣区太少，或者抽屉位置不顺手。避坑：多想想自己的使用习惯，挂衣区宁多勿少，抽屉做在顺手的位置。' }
            ]
        },
        'F-9': {
            notes: [
                '中央空调、新风要在水电前完成管道预埋，不然后期要拆吊顶',
                '地暖要在水电后、泥瓦前铺设，顺序不能乱',
                '设备选型要匹配面积，别买小了不够用，也别买太大浪费钱',
                '出风口、回风口位置要和吊顶设计配合，别被龙骨挡住',
                '安装完要做压力测试，确认不漏再封吊顶',
                '要留好检修口，后期维修方便'
            ],
            pitfalls: [
                { title: '进场顺序错了', desc: '水电都做完了才想起来装中央空调，只能改管道或拆吊顶，损失好几万。避坑：开工前就要定好设备，和工长确认进场时间。' },
                { title: '选型不合适', desc: '空调买小了夏天不够凉，新风买小了换气效果差。避坑：让商家根据户型面积计算，不要自己拍脑袋选。' }
            ]
        },
        'F-10': {
            notes: [
                '水电点位要跟着家电走，拿着家电清单一个个核对位置',
                '水管走顶不走地，漏了能及时发现，维修也不用砸地砖',
                '强电弱电要分开，间距至少30cm，交叉处要包锡纸防干扰',
                '水管做完要做打压测试，8-10公斤压30分钟不掉压才算合格',
                '电路要做通断测试，每个开关插座都要试',
                '封槽前一定要拍照拍视频留底，以后打孔知道哪里有管线'
            ],
            pitfalls: [
                { title: '点位没留够或位置错了', desc: '入住后发现插座不够用，或者位置被家具挡住了，用不了。避坑：拿着家电清单一个个核对，每个空间多留2-3个备用插座。' },
                { title: '横槽开太长', desc: '墙上开长横槽，严重影响墙体结构安全。避坑：横槽不超过30cm，承重墙尽量不开横槽，走竖槽+地面。' }
            ]
        },
        'F-11': {
            notes: [
                '防水最少做两遍，第一遍干了再做第二遍，十字交叉刷',
                '卫生间墙面最少刷1.8米高，淋浴区最好刷到顶',
                '厨房、阳台也别忘了做防水，特别是有地漏的地方',
                '防水做完一定要做闭水试验，放5cm以上的水，48小时不漏水才算过',
                '闭水试验一定要去楼下看天花板漏不漏，只看自家没用',
                '贴完砖最好再做一次闭水，确认贴砖时没破坏防水层'
            ],
            pitfalls: [
                { title: '防水没做好漏水', desc: '卫生间漏水到楼下，赔了钱还得砸砖重做，劳民伤财。避坑：选好防水材料，按规范施工，闭水试验一定要做够48小时。' },
                { title: '只做地面不做墙面', desc: '只做地面防水，墙面刷得很低，时间长了墙对面发霉脱皮。避坑：淋浴区至少1.8米，其他区域至少30cm，轻体墙最好刷到顶。' }
            ]
        },
        'F-12': {
            notes: [
                '贴砖前要先泡水（瓷片砖），泡到不冒泡为止，防止后期空鼓',
                '贴砖厚度要均匀，一般1-2cm，太厚太薄都容易空',
                '墙砖压地砖还是地砖压墙砖？建议墙砖压地砖，缝隙在侧面更美观',
                '阳角最好做45度碰角，比用阳角条好看，但更考验工人手艺',
                '贴完砖用空鼓锤敲一遍，单块砖空鼓率不超过5%',
                '贴完砖要及时擦干净表面的水泥，干了就难擦了'
            ],
            pitfalls: [
                { title: '瓷砖空鼓脱落', desc: '瓷砖贴完没多久就空鼓，甚至掉下来，特别是墙砖。避坑：砖要泡水，砂浆要饱满，贴完要验收，空鼓超过5%就让工人返工。' },
                { title: '对缝不齐不平整', desc: '砖缝歪歪扭扭，表面高低不平，看着特别难受。避坑：找手艺好的瓦工，贴的过程中多去看，发现问题及时改。' }
            ]
        },
        'F-13': {
            notes: [
                '美缝要等瓷砖完全干透再做，一般贴完砖7天后比较合适',
                '美缝前要把砖缝清理干净，不能有灰尘和积水，不然粘不牢',
                '美缝颜色要选好，和瓷砖颜色接近的更耐看，反差大的更有个性',
                '柜子后面、洁具后面的地方可以先不做美缝，等安装完再补',
                '美缝做完要等完全固化（一般24小时）再碰，不然容易脏'
            ],
            pitfalls: [
                { title: '美缝脱落发霉', desc: '美缝做了没多久就掉了，或者卫生间的美缝发霉变黑。避坑：选质量好的美缝剂，施工前把缝清干净，卫生间选防霉型的。' },
                { title: '颜色选翻车', desc: '美缝颜色选得太跳，和瓷砖不搭，做完特别丑。避坑：买小样在砖上试，选和砖色接近的最保险，不会出错。' }
            ]
        },
        'F-14': {
            notes: [
                '复尺一定要等贴完砖、吊完顶再量，这时候尺寸最准',
                '复尺时要确认所有洞口尺寸：门洞、窗洞、开关插座位置',
                '和设计师再确认一遍格局和细节，复尺后改就麻烦了',
                '确认收口方式：和墙、顶、门套、踢脚线怎么衔接',
                '确认五金件品牌、拉手样式、灯带位置这些细节',
                '复尺确认后就可以正式下单生产了'
            ],
            pitfalls: [
                { title: '复尺出错装不上', desc: '复尺量错了，柜子做回来装不上，要么改柜子要么砸墙。避坑：复尺时最好自己也在场，关键尺寸自己量一遍核对。' },
                { title: '没考虑贴砖厚度', desc: '量尺时没算贴砖厚度，柜子做出来比实际小，缝隙很大。避坑：一定要等贴完砖再复尺，或者提前把贴砖厚度算进去。' }
            ]
        },
        'F-15': {
            notes: [
                '木工进场前要确认图纸，每个吊顶、背景墙的尺寸和造型',
                '吊顶龙骨要牢固，主龙骨间距不超过80cm，副龙骨不超过40cm',
                '石膏板接缝处要贴绷带或网格布，防止后期开裂',
                '自攻螺丝要点防锈漆，不然时间长了锈出来很难看',
                '吊顶里的管线要提前走好，灯线、浴霸线、空调管等',
                '定制柜和吊顶衔接的地方要提前沟通，留好尺寸'
            ],
            pitfalls: [
                { title: '吊顶开裂', desc: '入住没多久吊顶就裂了，特别是接缝处和转角处。避坑：龙骨要牢固，石膏板转角用整板裁L型，接缝处贴绷带防裂。' },
                { title: '尺寸和定制柜对不上', desc: '吊顶做完和定制柜尺寸对不上，要么有缝要么装不上。避坑：木工和定制设计师提前沟通，吊顶尺寸按定制柜的要求来。' }
            ]
        },
        'F-16': {
            notes: [
                '泥木验收是中期验收的重点，一定要仔细验，没问题再付中期款',
                '带个空鼓锤，墙面地砖都敲一遍，空鼓超过5%就要返工',
                '检查阴阳角是否垂直，用靠尺靠一靠，差太多让工人修',
                '检查吊顶是否牢固，有没有松动，龙骨间距是否规范',
                '核对所有尺寸，特别是定制区域的尺寸，错了赶紧改',
                '验收合格、所有增项确认签字后再付中期款'
            ],
            pitfalls: [
                { title: '没验收就付款', desc: '没仔细验收就把中期款付了，后面发现问题找工人就不积极了。避坑：验收合格再付款，钱在手里才有主动权。' },
                { title: '只看表面不看细节', desc: '看着挺好就过了，后面装定制柜才发现墙不直、顶不平。避坑：带工具去验，靠尺、空鼓锤都用上，别光用眼睛看。' }
            ]
        },
        'F-17': {
            notes: [
                '刮腻子前墙面要先找平，不平的地方要用石膏找平',
                '腻子一般刮2-3遍，每遍干了再刮下一遍，不能急',
                '砂纸打磨要仔细，打磨完用灯照着看，有没有不平的地方',
                '乳胶漆要选环保的，认准十环认证或更高级别的认证',
                '刷漆前要做好保护，地面、门窗、插座都要包好',
                '阴雨天、空气湿度大的时候不要刷漆，不容易干还容易发霉'
            ],
            pitfalls: [
                { title: '墙面开裂掉皮', desc: '入住没多久墙面就裂了，或者乳胶漆掉皮。避坑：基层要处理好，腻子要刮平打磨好，乳胶漆要按比例兑水。' },
                { title: '颜色选翻车', desc: '选色时看色卡挺好，刷完整面墙觉得太深或太浅。避坑：先刷小样在墙上，大面积看效果再决定，别只看色卡。' }
            ]
        },
        'F-18': {
            notes: [
                '油漆验收要看墙面平整度，用靠尺靠，误差不超过2mm',
                '看有没有流坠、疙瘩、刷纹，颜色均匀一致才算好',
                '阴阳角要顺直，用直角尺量一量',
                '检查有没有漏刷、透底的地方，特别是边角处',
                '油漆没干透不要安装定制柜，不然容易把漆膜粘掉',
                '验收合格再付油漆阶段的款项'
            ],
            pitfalls: [
                { title: '墙面不平整', desc: '灯光一照墙面坑坑洼洼，特别明显，看着很难受。避坑：打磨完用灯照着检查，发现不平及时补，别等刷完漆才发现。' },
                { title: '色差明显', desc: '同一面墙颜色深浅不一，或者和色卡差很多。避坑：同一面墙最好用同一桶漆，兑水比例要一致，刷完整体看效果。' }
            ]
        },
        'F-19': {
            notes: [
                '主材安装顺序要注意：一般先装门、再装柜、最后装地板',
                '安装前要做好成品保护，地面铺好保护垫，别刮花了',
                '每个主材到场都要验货：品牌、型号、颜色、数量对不对，有没有破损',
                '安装时最好在场，有问题当场提出来，省得后期扯皮',
                '安装完要检查：开关顺不顺畅、缝隙匀不均匀、牢不牢固',
                '有磕碰损坏当场说清楚，是修还是换，别等装完才发现'
            ],
            pitfalls: [
                { title: '安装顺序错了', desc: '先装地板再装门，把门碰坏了；或者先装柜再装门，门关不上。避坑：和工长确认好安装顺序，一般是先上门、再上柜、最后地板。' },
                { title: '安装磕碰不负责', desc: '安装时把墙面地面碰坏了，安装工人说不是他们的问题。避坑：安装前先检查现状，安装时人在旁边盯着，有问题当场说。' }
            ]
        },
        'F-20': {
            notes: [
                '定制柜安装前要再复一遍尺，确认墙体、地面、顶面的尺寸',
                '安装时要注意保护墙面和地面，特别是已贴好砖或刷好漆的地方',
                '柜体要调平，用水平仪测，不然后期门会歪、抽屉会卡',
                '五金件要检查：铰链、滑轨、拉手是不是约定的品牌，好不好用',
                '收口要美观，缝隙均匀，打胶要顺直',
                '装完要试：门能不能关严、抽屉顺不顺滑、有没异响'
            ],
            pitfalls: [
                { title: '尺寸不对装不上', desc: '柜子做回来尺寸不对，要么塞不进去，要么缝隙太大。避坑：复尺要准，安装前再核对一遍，错了赶紧让厂家改。' },
                { title: '安装工艺差', desc: '板子磕坏、缝隙不均、打胶难看，装完效果很糟。避坑：找安装手艺好的师傅，安装时人在场盯着，有问题当场改。' }
            ]
        },
        'F-21': {
            notes: [
                '木地板最好最后装，装完就进家具，减少磕碰概率',
                '铺地板前地面要找平，平整度误差不超过2mm',
                '地面要打扫干净，不然铺完踩上去会有沙子响',
                '地板要提前拆包在室内放2-3天，适应温湿度，防止后期变形',
                '铺的时候要留伸缩缝，墙边留8-12mm，防止热胀冷缩起拱',
                '地板铺完要保护好，不要直接在上面拖重物'
            ],
            pitfalls: [
                { title: '地板起拱响', desc: '地板铺完踩上去咯吱响，或者起拱变形。避坑：地面要平，留好伸缩缝，地板提前适应环境，铺完别马上大量走动。' },
                { title: '色差太大', desc: '铺完发现地板颜色深浅不一，差别很大。避坑：选的时候看清是天然色差还是质量问题，铺的时候把色差大的挑出来铺在家具底下。' }
            ]
        },
        'F-22': {
            notes: [
                '软装进场要注意顺序：先大件后小件，先固定后移动',
                '搬家具时要保护好墙面地面，特别是过道和转角处',
                '窗帘、灯具这些可以最后装，避免施工时落灰',
                '装饰画、挂件等墙面装饰，打孔前要确认墙里有没有管线',
                '绿植最后再买，先把味道散一散',
                '软装慢慢来，不用一次性买齐，住进去慢慢添更有生活气息'
            ],
            pitfalls: [
                { title: '尺寸买错放不进去', desc: '沙发买大了进不了门，或者放进去太挤，过道都走不了。避坑：买之前量好尺寸，包括电梯、楼道、门的尺寸，别光看家里的尺寸。' },
                { title: '风格不统一乱搭', desc: '看到什么都想买，买回来堆在一起风格混乱，看着特别乱。避坑：先定整体风格和主色调，大件家具先买，小件慢慢配。' }
            ]
        },
        'F-23': {
            notes: [
                '竣工验收要仔细，带着 checklist 一项一项验，别嫌麻烦',
                '水电要试：每个开关插座、每个水龙头、马桶冲水、地漏排水',
                '墙面地面看：有没有开裂、掉皮、空鼓，平整不平整',
                '门窗试：开关顺不顺畅，密封好不好，有没有异响',
                '所有家电、洁具、五金件都要试用一遍',
                '有问题列出来，让装修公司整改完再付尾款',
                '空气质量检测最好找专业机构，别买那种几十块的自测盒'
            ],
            pitfalls: [
                { title: '草草验收就签字', desc: '没仔细看就验收签字了，后面发现问题再找就麻烦了。避坑：花点时间慢慢验，带工具去，一项一项过，没问题再签字。' },
                { title: '甲醛超标就入住', desc: '装完急着入住，没做空气质量检测，甲醛超标影响健康。避坑：先通风一段时间，入住前做个检测，合格了再住，特别是有小孩的家庭。' }
            ]
        }
    };

    var expandedNotesPitfalls = {};

    var expandedAIToolCards = {};

    function getAIToolUsedStatus(toolConfig, stepId) {
        var progress = getProgress();
        var type = toolConfig.type;
        var subtype = toolConfig.subtype;

        switch (type) {
            case 'companyMatch':
                return progress.matchResults && progress.matchResults.companies && progress.matchResults.companies.length > 0;
            case 'floorplanAnalysis':
                return progress.floorplanAnalysis && progress.floorplanAnalysis[stepId];
            case 'quoteAudit':
                return progress.quoteAudit && progress.quoteAudit[stepId];
            case 'contractRisk':
                return progress.contractAudit && progress.contractAudit[stepId];
            case 'materialInspection':
                return progress.materialInspection && progress.materialInspection.records && progress.materialInspection.records.length > 0;
            case 'waterElectricPlan':
                return progress.pointPlan && progress.pointPlan[stepId];
            case 'inspection':
                return progress.aiResults && progress.aiResults[stepId] && progress.aiResults[stepId][subtype];
            case 'finalSettlement':
                return progress.finalSettlement && progress.finalSettlement.contractPrice > 0;
            case 'airQuality':
                return progress.airQuality && progress.airQuality.area > 0;
            case 'paymentCalc':
            case 'communication':
            case 'progressOverview':
            case 'safetyTool':
                return false;
            default:
                return false;
        }
    }

    function getAIToolSummary(toolConfig, stepId) {
        var progress = getProgress();
        var type = toolConfig.type;
        var subtype = toolConfig.subtype;

        switch (type) {
            case 'companyMatch':
                if (progress.matchResults && progress.matchResults.companies) {
                    var companies = progress.matchResults.companies;
                    var topScore = companies.length > 0 ? companies[0].matchScore : 0;
                    return '已匹配 ' + companies.length + ' 家公司 · 最高分 ' + topScore;
                }
                return '';
            case 'floorplanAnalysis':
                if (progress.floorplanAnalysis && progress.floorplanAnalysis[stepId]) {
                    return '综合评分 ' + progress.floorplanAnalysis[stepId].overallScore + ' 分';
                }
                return '';
            case 'quoteAudit':
                if (progress.quoteAudit && progress.quoteAudit[stepId]) {
                    return '合理性评分 ' + progress.quoteAudit[stepId].overallScore + ' 分';
                }
                return '';
            case 'contractRisk':
                if (progress.contractAudit && progress.contractAudit[stepId]) {
                    return '发现 ' + progress.contractAudit[stepId].risks.length + ' 条风险';
                }
                return '';
            case 'materialInspection':
                if (progress.materialInspection && progress.materialInspection.records) {
                    return '已验收 ' + progress.materialInspection.records.length + ' 项材料';
                }
                return '';
            case 'waterElectricPlan':
                if (progress.pointPlan && progress.pointPlan[stepId]) {
                    return '规划 ' + progress.pointPlan[stepId].totalPoints + ' 个点位';
                }
                return '';
            case 'inspection':
                if (progress.aiResults && progress.aiResults[stepId] && progress.aiResults[stepId][subtype]) {
                    var result = progress.aiResults[stepId][subtype];
                    return '质量评分 ' + result.score + ' 分';
                }
                return '';
            case 'finalSettlement':
                if (progress.finalSettlement && progress.finalSettlement.contractPrice > 0) {
                    var fsData = calculateSettlement();
                    return '总结算价 ¥' + formatMoney(fsData.finalPrice);
                }
                return '';
            case 'airQuality':
                if (progress.airQuality && progress.airQuality.level) {
                    var levelMap = { low: '优良', medium: '轻度污染', high: '中度污染' };
                    return '污染等级：' + (levelMap[progress.airQuality.level] || progress.airQuality.level);
                }
                return '';
            default:
                return '';
        }
    }

    function renderAIToolCardContent(toolConfig, stepId) {
        var type = toolConfig.type;
        var progress = getProgress();

        switch (type) {
            case 'companyMatch':
                return renderCompanyMatchCardContent(stepId);
            case 'floorplanAnalysis':
                return renderFloorplanAnalysisCardContent(stepId);
            case 'quoteAudit':
                return renderQuoteAuditCardContent(stepId);
            case 'contractRisk':
                return renderContractRiskCardContent(stepId);
            case 'materialInspection':
                return renderMaterialInspectionCardContent(stepId);
            case 'paymentCalc':
                return renderPaymentCalcCardContent(stepId);
            case 'communication':
                return renderCommunicationCardContent(toolConfig, stepId);
            case 'progressOverview':
                return renderProgressOverviewCardContent(stepId);
            case 'inspection':
                return renderInspectionCardContent(toolConfig, stepId);
            case 'waterElectricPlan':
                return renderWaterElectricPlanCardContent(toolConfig, stepId);
            case 'finalSettlement':
                return renderFinalSettlementCardContent(toolConfig, stepId);
            case 'airQuality':
                return renderAirQualityCardContent(toolConfig, stepId);
            case 'safetyTool':
                return renderSafetyToolCardContent(toolConfig, stepId);
            default:
                return '<div class="sop-ai-tool-card-content">暂无内容</div>';
        }
    }

    function renderCompanyMatchCardContent(stepId) {
        var matchData = getMatchResults();
        var hasResults = matchData && matchData.companies && matchData.companies.length > 0;
        var html = '<div class="sop-ait-card-content">';

        if (hasResults) {
            html += '<div class="sop-ait-match-summary">';
            html += '<div class="sop-ait-match-count">';
            html += '<span class="sop-ait-match-num">' + matchData.companies.length + '</span>';
            html += '<span class="sop-ait-match-label">家匹配公司</span>';
            html += '</div>';
            html += '<div class="sop-ait-match-top">';
            html += '<div class="sop-ait-match-top-label">最高分</div>';
            html += '<div class="sop-ait-match-top-score">' + matchData.companies[0].matchScore + '分</div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sop-ait-match-list">';
            for (var i = 0; i < Math.min(3, matchData.companies.length); i++) {
                var c = matchData.companies[i];
                html += '<div class="sop-ait-match-item">';
                html += '<span class="sop-ait-match-name">' + c.name + '</span>';
                html += '<span class="sop-ait-match-score">' + c.matchScore + '分</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-ai-match-results">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="open-ai-match-modal">重新匹配</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">✨</div>';
            html += '<div class="sop-ait-empty-text">还没有进行匹配</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-ai-match-modal">开始匹配</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderFloorplanAnalysisCardContent(stepId) {
        var progress = getProgress();
        var hasResult = progress.floorplanAnalysis && progress.floorplanAnalysis[stepId];
        var html = '<div class="sop-ait-card-content">';

        if (hasResult) {
            var result = progress.floorplanAnalysis[stepId];
            html += '<div class="sop-ait-score-section">';
            html += '<div class="sop-ait-score-circle">';
            html += '<span class="sop-ait-score-num">' + result.overallScore + '</span>';
            html += '<span class="sop-ait-score-label">综合评分</span>';
            html += '</div>';
            html += '<div class="sop-ait-score-summary">';
            html += '<div class="sop-ait-score-item"><span>优势</span><span class="sop-ait-score-value">' + result.advantages.length + '项</span></div>';
            html += '<div class="sop-ait-score-item"><span>建议</span><span class="sop-ait-score-value">' + result.suggestions.length + '条</span></div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-floorplan-result" data-step="' + stepId + '">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="floorplan-reupload" data-step="' + stepId + '">重新上传</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-upload-area" data-action="ait-floorplan-upload" data-step="' + stepId + '">';
            html += '<div class="sop-ait-upload-icon">📤</div>';
            html += '<div class="sop-ait-upload-title">点击上传平面布局图</div>';
            html += '<div class="sop-ait-upload-hint">支持 JPG、PNG 格式</div>';
            html += '</div>';
            html += '<input type="file" id="ait-floorplan-input-' + stepId + '" class="sop-floorplan-file-input" accept="image/*" style="display:none" data-step="' + stepId + '">';
            if (isAnalyzingFloorplan && floorplanAnalyzingStep === stepId) {
                html += '<div class="sop-ait-analyzing">';
                html += '<div class="sop-ait-analyzing-icon">🔄</div>';
                html += '<div class="sop-ait-analyzing-text">正在分析中...</div>';
                html += '</div>';
            }
        }

        html += '</div>';
        return html;
    }

    function renderQuoteAuditCardContent(stepId) {
        var progress = getProgress();
        var hasResult = progress.quoteAudit && progress.quoteAudit[stepId];
        var html = '<div class="sop-ait-card-content">';

        if (hasResult) {
            var result = progress.quoteAudit[stepId];
            html += '<div class="sop-ait-score-section">';
            html += '<div class="sop-ait-score-circle">';
            html += '<span class="sop-ait-score-num">' + result.overallScore + '</span>';
            html += '<span class="sop-ait-score-label">合理性评分</span>';
            html += '</div>';
            html += '<div class="sop-ait-score-summary">';
            html += '<div class="sop-ait-score-item"><span>单价</span><span class="sop-ait-score-value">' + result.unitPrice + '元/㎡</span></div>';
            html += '<div class="sop-ait-score-item"><span>漏项</span><span class="sop-ait-score-value">' + result.detectedOmissions.length + '项</span></div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-quote-audit" data-step="' + stepId + '">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="quote-audit-redo" data-step="' + stepId + '">重新审核</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">🔍</div>';
            html += '<div class="sop-ait-empty-text">还没有进行报价审核</div>';
            html += '<div class="sop-ait-empty-hint">分析漏项、价格异常、优化建议</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-quote-audit" data-step="' + stepId + '">开始报价审核</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderContractRiskCardContent(stepId) {
        var progress = getProgress();
        var hasResult = progress.contractAudit && progress.contractAudit[stepId];
        var html = '<div class="sop-ait-card-content">';

        if (hasResult) {
            var result = progress.contractAudit[stepId];
            html += '<div class="sop-ait-score-section">';
            html += '<div class="sop-ait-score-circle sop-risk-' + result.riskLevel + '">';
            html += '<span class="sop-ait-score-num">' + result.riskScore + '</span>';
            html += '<span class="sop-ait-score-label">风险评分</span>';
            html += '</div>';
            html += '<div class="sop-ait-score-summary">';
            html += '<div class="sop-ait-score-item"><span>风险等级</span><span class="sop-ait-score-value sop-risk-' + result.riskLevel + '">' + result.riskLevelText + '</span></div>';
            html += '<div class="sop-ait-score-item"><span>风险条款</span><span class="sop-ait-score-value">' + result.risks.length + '条</span></div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-contract-audit" data-step="' + stepId + '">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="contract-audit-redo" data-step="' + stepId + '">重新扫描</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">📋</div>';
            html += '<div class="sop-ait-empty-text">还没有进行风险扫描</div>';
            html += '<div class="sop-ait-empty-hint">分析付款方式、增项规则等风险</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-contract-audit" data-step="' + stepId + '">开始风险扫描</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderMaterialInspectionCardContent(stepId) {
        var mi = getMaterialInspection();
        var hasRecords = mi.records && mi.records.length > 0;
        var html = '<div class="sop-ait-card-content">';

        if (hasRecords) {
            html += '<div class="sop-ait-mi-summary">';
            html += '<div class="sop-ait-mi-count">';
            html += '<span class="sop-ait-mi-num">' + mi.records.length + '</span>';
            html += '<span class="sop-ait-mi-label">项已验收</span>';
            html += '</div>';
            html += '<div class="sop-ait-mi-stats">';
            var passCount = mi.records.filter(function(r) { return r.status === 'pass'; }).length;
            var warnCount = mi.records.filter(function(r) { return r.status === 'warning'; }).length;
            html += '<div class="sop-ait-mi-stat pass">通过 ' + passCount + ' 项</div>';
            html += '<div class="sop-ait-mi-stat warning">关注 ' + warnCount + ' 项</div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sop-ait-mi-list">';
            for (var i = 0; i < Math.min(3, mi.records.length); i++) {
                var r = mi.records[mi.records.length - 1 - i];
                var cat = MATERIAL_CATEGORIES[r.category] || { name: '其他', icon: '📦' };
                html += '<div class="sop-ait-mi-item">';
                html += '<span class="sop-ait-mi-cat">' + cat.icon + ' ' + r.name + '</span>';
                html += '<span class="sop-ait-mi-status sop-mi-status-' + r.status + '">' + (r.status === 'pass' ? '通过' : (r.status === 'warning' ? '关注' : '待验')) + '</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-material-inspection" data-step="' + stepId + '">查看全部</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="add-material-quick" data-step="' + stepId + '">快速添加</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">📦</div>';
            html += '<div class="sop-ait-empty-text">还没有验收记录</div>';
            html += '<div class="sop-ait-empty-hint">录入材料信息，自动比对标准规格</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-material-inspection" data-step="' + stepId + '">开始材料验收</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderPaymentCalcCardContent(stepId) {
        var html = '<div class="sop-ait-card-content">';
        html += '<div class="sop-ait-payment-form">';
        html += '<div class="sop-ait-payment-label">合同总价（元）</div>';
        html += '<div class="sop-ait-payment-input-row">';
        html += '<input type="number" class="sop-ait-payment-input" id="ait-payment-total-' + stepId + '" placeholder="请输入合同总价" />';
        html += '<button class="sop-ait-card-btn primary small" data-action="calc-payment" data-step="' + stepId + '">计算</button>';
        html += '</div>';
        html += '</div>';
        html += '<div class="sop-ait-payment-result" id="ait-payment-result-' + stepId + '" style="display:none;">';
        html += '<div class="sop-ait-payment-table">';
        html += '<div class="sop-ait-payment-row header">';
        html += '<div class="sop-ait-payment-cell">期次</div>';
        html += '<div class="sop-ait-payment-cell">比例</div>';
        html += '<div class="sop-ait-payment-cell">金额</div>';
        html += '<div class="sop-ait-payment-cell">节点</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="sop-ait-payment-tip">默认比例：首期60%、中期35%、尾款5%</div>';
        html += '</div>';
        return html;
    }

    function renderCommunicationCardContent(toolConfig, stepId) {
        var subtype = toolConfig.subtype || 'default';
        var template = getAIResult('communication', stepId, subtype);
        var html = '<div class="sop-ait-card-content">';

        if (template && template.versions) {
            html += '<div class="sop-ait-comm-title">' + template.title + '</div>';
            html += '<div class="sop-ait-comm-versions">';
            for (var i = 0; i < template.versions.length; i++) {
                var v = template.versions[i];
                html += '<div class="sop-ait-comm-version">';
                html += '<div class="sop-ait-comm-version-header">';
                html += '<span class="sop-ait-comm-version-name">' + v.name + '</span>';
                html += '<button class="sop-ait-comm-copy-btn" data-action="copy-comm-text" data-text="' + encodeURIComponent(v.content) + '">📋 复制</button>';
                html += '</div>';
                html += '<div class="sop-ait-comm-content">' + v.content + '</div>';
                html += '</div>';
            }
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderProgressOverviewCardContent(stepId) {
        var budgetSummary = getBudgetSummary();
        var scheduleData = calculateScheduleData();
        var bm = getBudgetMonitor();
        var spentPercent = Math.round(budgetSummary.percentUsed);
        var expenseCount = bm.expenses.length;

        var html = '<div class="sop-ait-card-content">';

        html += '<div class="sop-ait-progress-section">';
        html += '<div class="sop-ait-progress-item">';
        html += '<div class="sop-ait-progress-header">';
        html += '<span class="sop-ait-progress-icon">💰</span>';
        html += '<span class="sop-ait-progress-label">预算消耗</span>';
        html += '<span class="sop-ait-progress-percent">' + spentPercent + '%</span>';
        html += '</div>';
        html += '<div class="sop-ait-progress-bar">';
        html += '<div class="sop-ait-progress-fill budget" style="width:' + spentPercent + '%"></div>';
        html += '</div>';
        html += '<div class="sop-ait-progress-meta">';
        html += '<span>已支出 ¥' + formatMoney(budgetSummary.totalSpent) + '</span>';
        html += '<span>总预算 ¥' + formatMoney(budgetSummary.totalBudget) + '</span>';
        html += '</div>';
        html += '</div>';

        html += '<div class="sop-ait-progress-item">';
        html += '<div class="sop-ait-progress-header">';
        html += '<span class="sop-ait-progress-icon">⏰</span>';
        html += '<span class="sop-ait-progress-label">工期进度</span>';
        html += '<span class="sop-ait-progress-percent">' + Math.round(scheduleData.progressPercent) + '%</span>';
        html += '</div>';
        html += '<div class="sop-ait-progress-bar">';
        html += '<div class="sop-ait-progress-fill schedule" style="width:' + scheduleData.progressPercent + '%"></div>';
        html += '</div>';
        html += '<div class="sop-ait-progress-meta">';
        html += '<span>已进行 ' + scheduleData.elapsedDays + ' 天</span>';
        html += '<span>总工期 ' + scheduleData.totalDays + ' 天</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="sop-ait-progress-cards">';
        html += '<div class="sop-ait-progress-card">';
        html += '<div class="sop-ait-progress-card-num">' + (scheduleData.keyMilestones[0] ? scheduleData.keyMilestones[0].countdown + '天' : '--') + '</div>';
        html += '<div class="sop-ait-progress-card-label">距离水电验收</div>';
        html += '</div>';
        html += '<div class="sop-ait-progress-card">';
        html += '<div class="sop-ait-progress-card-num">' + budgetSummary.addonCount + ' 项</div>';
        html += '<div class="sop-ait-progress-card-label">增项记录</div>';
        html += '</div>';
        html += '<div class="sop-ait-progress-card">';
        html += '<div class="sop-ait-progress-card-num">' + expenseCount + ' 笔</div>';
        html += '<div class="sop-ait-progress-card-label">支出记录</div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="sop-ait-progress-tabs">';
        html += '<button class="sop-ait-progress-tab active" data-action="progress-tab-switch" data-tab="budget" data-step="' + stepId + '">预算明细</button>';
        html += '<button class="sop-ait-progress-tab" data-action="progress-tab-switch" data-tab="schedule" data-step="' + stepId + '">工期明细</button>';
        html += '</div>';

        html += '<div class="sop-ait-progress-detail" id="progress-detail-' + stepId + '-budget">';
        html += renderBudgetDetailContent(stepId);
        html += '</div>';

        html += '<div class="sop-ait-progress-detail" id="progress-detail-' + stepId + '-schedule" style="display:none;">';
        html += renderScheduleDetailContent(stepId);
        html += '</div>';

        html += '</div>';
        return html;
    }

    function renderBudgetDetailContent(stepId) {
        var summary = getBudgetSummary();
        var bm = getBudgetMonitor();

        var statusClass = summary.isOverBudget ? 'over' : (summary.isWarning ? 'warning' : 'normal');
        var statusText = summary.isOverBudget ? '已超支' : (summary.isWarning ? '预算紧张' : '预算充足');
        var statusColor = summary.isOverBudget ? '#c62828' : (summary.isWarning ? '#f57c00' : '#2e7d32');

        var categoryHtml = '';
        var catKeys = Object.keys(summary.categoryTotals);
        var catColors = {
            labor: '#e65100',
            material: '#f57c00',
            custom: '#ffa726',
            appliance: '#ffb74d',
            other: '#ffcc80'
        };
        for (var i = 0; i < catKeys.length; i++) {
            var key = catKeys[i];
            var catAmount = summary.categoryTotals[key];
            var catName = summary.categoryNames[key];
            var catPercent = summary.totalSpent > 0 ? (catAmount / summary.totalSpent * 100) : 0;
            var color = catColors[key] || '#ffcc80';
            categoryHtml += `
                <div class="sop-pd-category-item">
                    <div class="sop-pd-category-header">
                        <span class="sop-pd-category-name" style="color:${color}">● ${catName}</span>
                        <span class="sop-pd-category-amount">¥${formatMoney(catAmount)}</span>
                    </div>
                    <div class="sop-pd-category-bar">
                        <div class="sop-pd-category-fill" style="width:${catPercent.toFixed(1)}%; background-color:${color}"></div>
                    </div>
                    <div class="sop-pd-category-percent">占比 ${catPercent.toFixed(1)}%</div>
                </div>
            `;
        }

        var expensesHtml = '';
        if (bm.expenses.length > 0) {
            var sortedExpenses = bm.expenses.slice().sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
            for (var j = 0; j < sortedExpenses.length; j++) {
                var exp = sortedExpenses[j];
                var catName2 = summary.categoryNames[exp.category] || '其他';
                expensesHtml += `
                    <div class="sop-pd-expense-item">
                        <div class="sop-pd-expense-info">
                            <div class="sop-pd-expense-name">${exp.name}</div>
                            <div class="sop-pd-expense-meta">${catName2} · ${exp.date || ''}</div>
                        </div>
                        <div class="sop-pd-expense-amount">-¥${formatMoney(exp.amount)}</div>
                    </div>
                `;
            }
        } else {
            expensesHtml = '<div class="sop-pd-empty">暂无支出记录，点击"添加"开始记录</div>';
        }

        var addonsHtml = '';
        if (bm.addons.length > 0) {
            for (var k = 0; k < bm.addons.length; k++) {
                var addon = bm.addons[k];
                var analysis = analyzeAddonReasonableness(addon);
                addonsHtml += `
                    <div class="sop-pd-addon-item">
                        <div class="sop-pd-addon-header">
                            <span class="sop-pd-addon-name">${addon.name}</span>
                            <span class="sop-pd-addon-amount">+¥${formatMoney(addon.amount)}</span>
                        </div>
                        <div class="sop-pd-addon-reason">原因：${addon.reason || '未填写'}</div>
                        <div class="sop-pd-addon-analysis" style="color:${analysis.color}">
                            <span class="sop-pd-addon-tag" style="background-color:${analysis.color}20; color:${analysis.color}">${analysis.label}</span>
                            <span class="sop-pd-addon-signed">${addon.isSigned ? '✓ 已签字' : '✗ 未签字'}</span>
                        </div>
                        <div class="sop-pd-addon-advice">💡 ${analysis.advice}</div>
                    </div>
                `;
            }
        } else {
            addonsHtml = '<div class="sop-pd-empty">暂无增项记录</div>';
        }

        var html = `
            <div class="sop-pd-budget">
                <div class="sop-pd-section">
                    <div class="sop-pd-section-header">
                        <span class="sop-pd-section-title">📊 预算总览</span>
                        <button class="sop-pd-edit-btn" data-action="pd-edit-budget" data-step="${stepId}">编辑</button>
                    </div>
                    <div class="sop-pd-budget-summary">
                        <div class="sop-pd-budget-stat">
                            <div class="sop-pd-budget-stat-num">¥${formatMoney(summary.totalBudget)}</div>
                            <div class="sop-pd-budget-stat-label">总预算</div>
                        </div>
                        <div class="sop-pd-budget-stat">
                            <div class="sop-pd-budget-stat-num" style="color:${statusColor}">¥${formatMoney(summary.totalSpent)}</div>
                            <div class="sop-pd-budget-stat-label">已支出</div>
                        </div>
                        <div class="sop-pd-budget-stat">
                            <div class="sop-pd-budget-stat-num ${summary.isOverBudget ? 'sop-pd-over' : ''}">¥${formatMoney(Math.max(summary.remaining, 0))}</div>
                            <div class="sop-pd-budget-stat-label">${summary.isOverBudget ? '超支' : '剩余'}</div>
                        </div>
                    </div>
                    <div class="sop-pd-budget-status">
                        <span class="sop-pd-status-tag sop-pd-status-${statusClass}">${statusText}</span>
                        <span class="sop-pd-status-percent">${summary.percentUsed.toFixed(1)}%</span>
                    </div>
                    <div class="sop-pd-budget-bar">
                        <div class="sop-pd-budget-fill" style="width:${Math.min(summary.percentUsed, 100)}%; background-color:${statusColor}"></div>
                    </div>
                </div>

                <div class="sop-pd-section">
                    <div class="sop-pd-section-header">
                        <span class="sop-pd-section-title">💰 支出记录</span>
                        <button class="sop-pd-add-btn" data-action="pd-add-expense" data-step="${stepId}">+ 添加</button>
                    </div>
                    <div class="sop-pd-expense-list">
                        ${expensesHtml}
                    </div>
                </div>

                <div class="sop-pd-section">
                    <div class="sop-pd-section-header">
                        <span class="sop-pd-section-title">📋 增项管理</span>
                        <button class="sop-pd-add-btn" data-action="pd-add-addon" data-step="${stepId}">+ 添加</button>
                    </div>
                    <div class="sop-pd-addon-list">
                        ${addonsHtml}
                    </div>
                </div>

                <div class="sop-pd-section">
                    <div class="sop-pd-section-title">📈 分类支出占比</div>
                    <div class="sop-pd-category-list">
                        ${categoryHtml}
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    function renderScheduleDetailContent(stepId) {
        var data = calculateScheduleData();

        var statusClass = data.isDelayed ? 'delayed' : (data.progressPercent >= 100 ? 'done' : 'normal');
        var statusText = data.isDelayed ? '工期延误' : (data.progressPercent >= 100 ? '已竣工' : '正常进行');

        var stagesHtml = data.stages.map(function(stage, idx) {
            var isCurrent = idx === data.currentStageIndex;
            var isPast = idx < data.currentStageIndex;
            var stageClass = isCurrent ? 'current' : (isPast ? 'past' : 'future');
            return `
                <div class="sop-pd-stage sop-pd-stage-${stageClass}">
                    <div class="sop-pd-stage-icon">${stage.icon}</div>
                    <div class="sop-pd-stage-info">
                        <div class="sop-pd-stage-name">${stage.name}</div>
                        <div class="sop-pd-stage-days">${stage.days}天</div>
                    </div>
                    ${isCurrent ? '<div class="sop-pd-stage-badge">进行中</div>' : ''}
                    ${isPast ? '<div class="sop-pd-stage-check">✓</div>' : ''}
                </div>
            `;
        }).join('');

        var milestonesHtml = data.keyMilestones.map(function(m) {
            var isPast = m.countdown <= 0;
            return `
                <div class="sop-pd-milestone ${isPast ? 'past' : ''}">
                    <div class="sop-pd-milestone-info">
                        <div class="sop-pd-milestone-name">${m.name}</div>
                        <div class="sop-pd-milestone-date">${m.date.toLocaleDateString()}</div>
                    </div>
                    <div class="sop-pd-milestone-countdown ${isPast ? 'past' : ''}">
                        ${isPast ? '已完成' : m.countdown + '天后'}
                    </div>
                </div>
            `;
        }).join('');

        var nextTasksHtml = data.nextTasks.length > 0 ? data.nextTasks.map(function(task) {
            return `<div class="sop-pd-next-task">📌 ${task.name}</div>`;
        }).join('') : '<div class="sop-pd-next-task">🎉 恭喜！所有步骤已完成</div>';

        var startDateStr = data.startDate.toISOString().split('T')[0];

        var html = `
            <div class="sop-pd-schedule">
                <div class="sop-pd-section">
                    <div class="sop-pd-section-header">
                        <span class="sop-pd-section-title">⏰ 工期总览</span>
                        <span class="sop-pd-status-tag sop-pd-status-${statusClass}">${statusText}</span>
                    </div>
                    <div class="sop-pd-sched-summary">
                        <div class="sop-pd-sched-stat">
                            <div class="sop-pd-sched-stat-num">${data.totalDays}</div>
                            <div class="sop-pd-sched-stat-label">总工期（天）</div>
                        </div>
                        <div class="sop-pd-sched-stat">
                            <div class="sop-pd-sched-stat-num">${data.elapsedDays}</div>
                            <div class="sop-pd-sched-stat-label">已过（天）</div>
                        </div>
                        <div class="sop-pd-sched-stat">
                            <div class="sop-pd-sched-stat-num">${Math.round(data.progressPercent)}%</div>
                            <div class="sop-pd-sched-stat-label">当前进度</div>
                        </div>
                    </div>
                    <div class="sop-pd-sched-prediction">
                        <span>📅 预计完工：${data.predictedEndDate.toLocaleDateString()}</span>
                    </div>
                </div>

                <div class="sop-pd-section">
                    <div class="sop-pd-section-title">📊 阶段工期</div>
                    <div class="sop-pd-stages-list">
                        ${stagesHtml}
                    </div>
                </div>

                <div class="sop-pd-section">
                    <div class="sop-pd-section-title">⏳ 关键节点倒计时</div>
                    <div class="sop-pd-milestones-list">
                        ${milestonesHtml}
                    </div>
                </div>

                <div class="sop-pd-section">
                    <div class="sop-pd-section-title">📋 下一步准备</div>
                    <div class="sop-pd-next-list">
                        ${nextTasksHtml}
                    </div>
                </div>

                <div class="sop-pd-section">
                    <div class="sop-pd-section-title">⚙️ 工期设置</div>
                    <div class="sop-pd-sched-settings">
                        <div class="sop-pd-sched-setting">
                            <label>开工日期</label>
                            <input type="date" class="sop-pd-sched-input" id="pd-sched-start-${stepId}" value="${startDateStr}">
                        </div>
                        <div class="sop-pd-sched-setting">
                            <label>总工期（天）</label>
                            <input type="number" class="sop-pd-sched-input" id="pd-sched-days-${stepId}" value="${data.totalDays}" step="1">
                        </div>
                        <button class="sop-pd-sched-update-btn" data-action="pd-update-schedule" data-step="${stepId}">更新设置</button>
                    </div>
                </div>
            </div>
        `;

        return html;
    }

    function handleProgressTabSwitch(stepId, tab) {
        var card = document.querySelector('.sop-ai-tool-card[data-step="' + stepId + '"][data-tool="progress-overview"]');
        if (!card) return;

        var tabs = card.querySelectorAll('.sop-ait-progress-tab');
        tabs.forEach(function(t) {
            t.classList.remove('active');
        });
        var activeTab = card.querySelector('.sop-ait-progress-tab[data-tab="' + tab + '"]');
        if (activeTab) activeTab.classList.add('active');

        var budgetDetail = document.getElementById('progress-detail-' + stepId + '-budget');
        var scheduleDetail = document.getElementById('progress-detail-' + stepId + '-schedule');
        if (tab === 'budget') {
            if (budgetDetail) budgetDetail.style.display = 'block';
            if (scheduleDetail) scheduleDetail.style.display = 'none';
        } else {
            if (budgetDetail) budgetDetail.style.display = 'none';
            if (scheduleDetail) scheduleDetail.style.display = 'block';
        }
    }

    function refreshProgressOverviewCard(stepId) {
        var card = document.querySelector('.sop-ai-tool-card[data-step="' + stepId + '"][data-tool="progress-overview"]');
        if (!card) return;

        var body = card.querySelector('.sop-ai-tool-card-body');
        if (!body) return;

        var toolConfig = { id: 'progress-overview', type: 'progressOverview', subtype: 'default', isSpecial: true };
        body.innerHTML = renderAIToolCardContent(toolConfig, stepId);
    }

    function handlePdEditBudget(stepId) {
        var bm = getBudgetMonitor();
        var newBudget = prompt('请输入总预算金额（元）：', bm.totalBudget);
        if (newBudget !== null) {
            var num = parseFloat(newBudget);
            if (!isNaN(num) && num > 0) {
                bm.totalBudget = num;
                saveBudgetMonitor();
                refreshProgressOverviewCard(stepId);
                // 已迁移至步骤内AI工具卡片
                // updateBudgetFloatBtn();
                if (window.Toast && Toast.success) Toast.success('预算已更新');
            }
        }
    }

    function handlePdAddExpense(stepId) {
        var modalHtml = `
            <div class="sop-budget-modal-overlay" id="sop-pd-expense-modal-overlay">
                <div class="sop-budget-modal">
                    <div class="sop-budget-modal-header">
                        <span>添加支出</span>
                        <button class="sop-budget-modal-close" data-modal-close="pd-expense">×</button>
                    </div>
                    <div class="sop-budget-modal-body">
                        <div class="sop-budget-form-item">
                            <label>支出项目</label>
                            <input type="text" id="pd-expense-name" placeholder="如：首付款、瓷砖采购等">
                        </div>
                        <div class="sop-budget-form-item">
                            <label>金额（元）</label>
                            <input type="number" id="pd-expense-amount" placeholder="请输入金额">
                        </div>
                        <div class="sop-budget-form-item">
                            <label>分类</label>
                            <select id="pd-expense-category">
                                <option value="labor">人工费</option>
                                <option value="material">材料费</option>
                                <option value="custom">定制费</option>
                                <option value="appliance">家电费</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <div class="sop-budget-form-item">
                            <label>日期</label>
                            <input type="date" id="pd-expense-date" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    <div class="sop-budget-modal-footer">
                        <button class="sop-budget-btn-cancel" data-modal-close="pd-expense">取消</button>
                        <button class="sop-budget-btn-confirm" id="pd-expense-confirm">确认添加</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        var overlay = document.getElementById('sop-pd-expense-modal-overlay');
        if (overlay) {
            overlay.querySelectorAll('[data-modal-close="pd-expense"]').forEach(function(btn) {
                btn.addEventListener('click', function() { overlay.remove(); });
            });
            overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
        }

        var pdExpenseConfirmBtn = document.getElementById('pd-expense-confirm');
        if (pdExpenseConfirmBtn) {
            pdExpenseConfirmBtn.addEventListener('click', function() {
                var name = document.getElementById('pd-expense-name').value.trim();
                var amount = parseFloat(document.getElementById('pd-expense-amount').value);
                var category = document.getElementById('pd-expense-category').value;
                var date = document.getElementById('pd-expense-date').value;

                if (!name) { if (window.Toast) Toast.error('请输入支出项目'); return; }
                if (isNaN(amount) || amount <= 0) { if (window.Toast) Toast.error('请输入正确的金额'); return; }

                var bm = getBudgetMonitor();
                bm.expenses.push({
                    id: 'exp_' + Date.now(),
                    name: name,
                    amount: amount,
                    category: category,
                    date: date
                });
                saveBudgetMonitor();
                if (overlay) overlay.remove();
                refreshProgressOverviewCard(stepId);
                if (window.Toast && Toast.success) Toast.success('支出已添加');
            });
        }
    }

    function handlePdAddAddon(stepId) {
        var modalHtml = `
            <div class="sop-budget-modal-overlay" id="sop-pd-addon-modal-overlay">
                <div class="sop-budget-modal">
                    <div class="sop-budget-modal-header">
                        <span>录入增项</span>
                        <button class="sop-budget-modal-close" data-modal-close="pd-addon">×</button>
                    </div>
                    <div class="sop-budget-modal-body">
                        <div class="sop-budget-form-item">
                            <label>增项名称</label>
                            <input type="text" id="pd-addon-name" placeholder="如：防水升级、吊顶造型等">
                        </div>
                        <div class="sop-budget-form-item">
                            <label>增项原因</label>
                            <textarea id="pd-addon-reason" placeholder="请描述增项原因" rows="3"></textarea>
                        </div>
                        <div class="sop-budget-form-item">
                            <label>金额（元）</label>
                            <input type="number" id="pd-addon-amount" placeholder="请输入金额">
                        </div>
                        <div class="sop-budget-form-item">
                            <label class="sop-budget-checkbox-label">
                                <input type="checkbox" id="pd-addon-signed">
                                <span>已签字确认</span>
                            </label>
                        </div>
                        <div class="sop-budget-ai-hint">
                            💡 AI将自动判断增项合理性（必要/可选/恶意）
                        </div>
                    </div>
                    <div class="sop-budget-modal-footer">
                        <button class="sop-budget-btn-cancel" data-modal-close="pd-addon">取消</button>
                        <button class="sop-budget-btn-confirm" id="pd-addon-confirm">确认添加</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        var overlay = document.getElementById('sop-pd-addon-modal-overlay');
        if (overlay) {
            overlay.querySelectorAll('[data-modal-close="pd-addon"]').forEach(function(btn) {
                btn.addEventListener('click', function() { overlay.remove(); });
            });
            overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
        }

        var pdAddonConfirmBtn = document.getElementById('pd-addon-confirm');
        if (pdAddonConfirmBtn) {
            pdAddonConfirmBtn.addEventListener('click', function() {
                var name = document.getElementById('pd-addon-name').value.trim();
                var reason = document.getElementById('pd-addon-reason').value.trim();
                var amount = parseFloat(document.getElementById('pd-addon-amount').value);
                var isSigned = document.getElementById('pd-addon-signed').checked;

                if (!name) { if (window.Toast) Toast.error('请输入增项名称'); return; }
                if (isNaN(amount) || amount <= 0) { if (window.Toast) Toast.error('请输入正确的金额'); return; }

                var bm = getBudgetMonitor();
                bm.addons.push({
                    id: 'addon_' + Date.now(),
                    name: name,
                    reason: reason,
                    amount: amount,
                    isSigned: isSigned,
                    date: new Date().toISOString().split('T')[0]
                });
                saveBudgetMonitor();
                if (overlay) overlay.remove();
                refreshProgressOverviewCard(stepId);
                if (window.Toast && Toast.success) Toast.success('增项已添加');
            });
        }
    }

    function handlePdUpdateSchedule(stepId) {
        var st = getScheduleTracker();
        var startDate = document.getElementById('pd-sched-start-' + stepId).value;
        var totalDays = parseInt(document.getElementById('pd-sched-days-' + stepId).value);

        if (startDate) st.startDate = startDate;
        if (!isNaN(totalDays) && totalDays > 0) st.totalDays = totalDays;

        saveScheduleTracker();
        refreshProgressOverviewCard(stepId);
        if (window.Toast && Toast.success) Toast.success('工期设置已更新');
    }

    function renderInspectionCardContent(toolConfig, stepId) {
        var progress = getProgress();
        var subtype = toolConfig.subtype || 'default';
        var hasResult = progress.aiResults && progress.aiResults[stepId] && progress.aiResults[stepId][subtype];
        var template = getAIResult('inspection', stepId, subtype);
        var result = hasResult ? progress.aiResults[stepId][subtype] : template;

        var html = '<div class="sop-ait-card-content">';

        if (hasResult || template) {
            var data = result || template;
            var statusClass = data.statusClass || 'warning';
            var score = data.score || 85;
            var items = data.items || [];
            var suggestions = data.suggestions || '';
            var subtitle = data.subtitle || 'AI质检报告';
            var statusText = data.statusText || '轻微问题';

            html += '<div class="sop-ait-score-section">';
            html += '<div class="sop-ait-score-circle">';
            html += '<span class="sop-ait-score-num">' + score + '</span>';
            html += '<span class="sop-ait-score-label">质量评分</span>';
            html += '</div>';
            html += '<div class="sop-ait-score-summary">';
            html += '<div class="sop-ait-score-item"><span>' + subtitle + '</span></div>';
            html += '<div class="sop-ait-score-item"><span>状态</span><span class="sop-ait-score-value sop-status-' + statusClass + '">' + statusText + '</span></div>';
            html += '<div class="sop-ait-score-item"><span>检测项</span><span class="sop-ait-score-value">' + items.length + '项</span></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="sop-ait-inspection-items">';
            for (var i = 0; i < Math.min(3, items.length); i++) {
                var item = items[i];
                html += '<div class="sop-ai-inspection-item">';
                html += '<span class="sop-ai-inspection-item-name">' + item.name + '</span>';
                html += '<span class="sop-ai-inspection-item-score">' + item.score + '分</span>';
                html += '</div>';
                if (item.issue) {
                    html += '<div class="sop-ai-inspection-issue">⚠️ ' + item.issue + '</div>';
                }
            }
            html += '</div>';

            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-inspection-detail" data-step="' + stepId + '" data-subtype="' + subtype + '">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="reinspect" data-step="' + stepId + '" data-subtype="' + subtype + '">重新检测</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">🔍</div>';
            html += '<div class="sop-ait-empty-text">还没有进行质量检测</div>';
            html += '<div class="sop-ait-empty-hint">上传现场照片，获取质量分析参考</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="start-inspection" data-step="' + stepId + '" data-subtype="' + subtype + '">开始检测</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderWaterElectricPlanCardContent(toolConfig, stepId) {
        var progress = getProgress();
        var hasResult = progress.pointPlan && progress.pointPlan[stepId];
        var html = '<div class="sop-ait-card-content">';

        if (hasResult) {
            var result = progress.pointPlan[stepId];
            html += '<div class="sop-ait-score-section">';
            html += '<div class="sop-ait-score-circle">';
            html += '<span class="sop-ait-score-num">' + result.totalPoints + '</span>';
            html += '<span class="sop-ait-score-label">规划点位</span>';
            html += '</div>';
            html += '<div class="sop-ait-score-summary">';
            html += '<div class="sop-ait-score-item"><span>空间数量</span><span class="sop-ait-score-value">' + result.roomPoints.length + '个</span></div>';
            html += '<div class="sop-ait-score-item"><span>回路数量</span><span class="sop-ait-score-value">' + result.circuitCount + '路</span></div>';
            html += '<div class="sop-ait-score-item"><span>网络接口</span><span class="sop-ait-score-value">' + result.networkPorts + '个</span></div>';
            html += '</div>';
            html += '</div>';

            if (result.omissions && result.omissions.length > 0) {
                html += '<div class="sop-ait-mi-list">';
                html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text);">💡 易遗漏点位提醒</div>';
                for (var i = 0; i < Math.min(3, result.omissions.length); i++) {
                    var om = result.omissions[i];
                    html += '<div class="sop-ait-mi-item">';
                    html += '<span class="sop-ait-mi-cat">' + om.name + '</span>';
                    html += '</div>';
                }
                html += '</div>';
            }

            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-point-plan" data-step="' + stepId + '">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="regenerate-point-plan" data-step="' + stepId + '">重新生成</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">⚡</div>';
            html += '<div class="sop-ait-empty-text">还没有生成点位规划</div>';
            html += '<div class="sop-ait-empty-hint">输入户型和家电信息，获取点位规划参考</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="open-point-plan" data-step="' + stepId + '">开始规划</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderFinalSettlementCardContent(toolConfig, stepId) {
        var data = calculateSettlement();
        var html = '<div class="sop-ait-card-content">';

        if (data.contractPrice > 0) {
            html += '<div class="sop-ait-score-section">';
            html += '<div class="sop-ait-score-circle">';
            html += '<span class="sop-ait-score-num" style="font-size:20px;">¥' + formatMoney(data.finalPrice) + '</span>';
            html += '<span class="sop-ait-score-label">总结算价</span>';
            html += '</div>';
            html += '<div class="sop-ait-score-summary">';
            html += '<div class="sop-ait-score-item"><span>合同价</span><span class="sop-ait-score-value">¥' + formatMoney(data.contractPrice) + '</span></div>';
            html += '<div class="sop-ait-score-item"><span>增项</span><span class="sop-ait-score-value" style="color:var(--zhu-red);">+¥' + formatMoney(data.addonTotal) + '</span></div>';
            html += '<div class="sop-ait-score-item"><span>减项</span><span class="sop-ait-score-value" style="color:var(--zhu-green);">-¥' + formatMoney(data.deductionTotal) + '</span></div>';
            html += '</div>';
            html += '</div>';

            if (data.issues && data.issues.length > 0) {
                html += '<div class="sop-ait-mi-list">';
                html += '<div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--text);">🔍 智能问题识别（示例效果）</div>';
                for (var i = 0; i < Math.min(2, data.issues.length); i++) {
                    var issue = data.issues[i];
                    var icon = issue.type === 'error' ? '❌' : (issue.type === 'warning' ? '⚠️' : '💡');
                    html += '<div class="sop-ait-mi-item">';
                    html += '<span class="sop-ait-mi-cat">' + icon + ' ' + issue.text + '</span>';
                    html += '</div>';
                }
                html += '</div>';
            }

            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-final-settlement" data-step="' + stepId + '">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="copy-settlement-card" data-step="' + stepId + '">复制对账单</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">📋</div>';
            html += '<div class="sop-ait-empty-text">还没有结算数据</div>';
            html += '<div class="sop-ait-empty-hint">输入合同价和增减项，智能对账参考</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-final-settlement" data-step="' + stepId + '">开始对账</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderAirQualityCardContent(toolConfig, stepId) {
        var progress = getProgress();
        var aq = progress.airQuality || { area: 100, level: 'medium', materials: 'standard', furnitureCount: 5 };
        var hasData = aq.area > 0;
        var html = '<div class="sop-ait-card-content">';

        if (hasData) {
            var levelMap = {
                low: { label: '优良', color: '#27ae60', desc: '空气质量良好，可放心入住' },
                medium: { label: '轻度污染', color: '#f39c12', desc: '建议通风3-6个月后入住' },
                high: { label: '中度污染', color: '#e74c3c', desc: '建议治理后再入住' }
            };
            var levelInfo = levelMap[aq.level] || levelMap.medium;

            html += '<div class="sop-ait-score-section">';
            html += '<div class="sop-ait-score-circle" style="background: linear-gradient(135deg, ' + levelInfo.color + ' 0%, ' + levelInfo.color + 'cc 100%);">';
            html += '<span class="sop-ait-score-num" style="font-size:18px;">' + levelInfo.label + '</span>';
            html += '<span class="sop-ait-score-label">污染等级</span>';
            html += '</div>';
            html += '<div class="sop-ait-score-summary">';
            html += '<div class="sop-ait-score-item"><span>房屋面积</span><span class="sop-ait-score-value">' + aq.area + '㎡</span></div>';
            html += '<div class="sop-ait-score-item"><span>装修材料</span><span class="sop-ait-score-value">' + (aq.materials === 'standard' ? '普通' : '环保') + '</span></div>';
            html += '<div class="sop-ait-score-item"><span>家具数量</span><span class="sop-ait-score-value">' + aq.furnitureCount + '件</span></div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="sop-ai-inspection-suggestions">';
            html += '💡 ' + levelInfo.desc;
            html += '</div>';

            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-air-quality" data-step="' + stepId + '">查看详情</button>';
            html += '<button class="sop-ait-card-btn secondary" data-action="reassess-air-quality" data-step="' + stepId + '">重新评估</button>';
            html += '</div>';
        } else {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">🌬️</div>';
            html += '<div class="sop-ait-empty-text">还没有空气质量评估</div>';
            html += '<div class="sop-ait-empty-hint">输入房屋信息，AI评估室内空气质量</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="view-air-quality" data-step="' + stepId + '">开始评估</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderSafetyToolCardContent(toolConfig, stepId) {
        var subtype = toolConfig.subtype;
        var html = '<div class="sop-ait-card-content">';

        if (subtype === 'safety-notice') {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">📋</div>';
            html += '<div class="sop-ait-empty-text">安全责任告知书</div>';
            html += '<div class="sop-ait-empty-hint">生成施工安全责任告知书模板，可直接打印使用</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="generate-safety-notice" data-step="' + stepId + '">生成告知书</button>';
            html += '</div>';
        } else if (subtype === 'insurance-reminder') {
            html += '<div class="sop-ait-empty">';
            html += '<div class="sop-ait-empty-icon">🛡️</div>';
            html += '<div class="sop-ait-empty-text">工人意外险提醒</div>';
            html += '<div class="sop-ait-empty-hint">提醒购买工人意外险，保障施工安全</div>';
            html += '</div>';
            html += '<div class="sop-ait-card-actions">';
            html += '<button class="sop-ait-card-btn primary" data-action="show-insurance-reminder" data-step="' + stepId + '">查看提醒</button>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderAIToolCard(toolConfig, stepId) {
        var isUsed = getAIToolUsedStatus(toolConfig, stepId);
        var cardId = stepId + '-' + toolConfig.id;
        var isExpanded = expandedAIToolCards[cardId] || false;
        var isSpecial = toolConfig.isSpecial;

        var summary = getAIToolSummary(toolConfig, stepId);

        var actionHtml = '';
        if (isUsed) {
            actionHtml = '<span class="sop-ai-tool-card-status">已使用</span><span class="sop-ai-tool-card-expand-arrow">▼</span>';
        } else if (isSpecial) {
            actionHtml = '<span class="sop-ai-tool-card-expand-arrow">▼</span>';
        } else {
            actionHtml = '<button class="sop-ai-tool-card-btn" data-step="' + stepId + '" data-tool="' + toolConfig.id + '" data-action="ai-tool-experience">立即体验</button>';
        }

        var summaryHtml = summary ? '<div class="sop-ai-tool-card-summary">' + summary + '</div>' : '';

        var bodyHtml = '';
        if (isUsed || isSpecial) {
            bodyHtml = '<div class="sop-ai-tool-card-body">' + renderAIToolCardContent(toolConfig, stepId) + '</div>';
        }

        var cardClass = 'sop-ai-tool-card ' + (isExpanded ? 'expanded' : '') + (isSpecial ? ' sop-ai-tool-card-special' : '');

        return '<div class="' + cardClass + '" data-step="' + stepId + '" data-tool="' + toolConfig.id + '" data-action="ai-tool-toggle"><div class="sop-ai-tool-card-header"><div class="sop-ai-tool-card-icon">' + toolConfig.icon + '</div><div class="sop-ai-tool-card-info"><div class="sop-ai-tool-card-name">' + toolConfig.name + '</div><div class="sop-ai-tool-card-desc">' + toolConfig.desc + '</div>' + summaryHtml + '</div><div class="sop-ai-tool-card-action">' + actionHtml + '</div></div>' + bodyHtml + '</div>';
    }


    function getAIResult(type, stepId, subtype) {


        var templates = {


            communication: {


                'default': {


                    title: '沟通话术生成',


                    versions: [


                        { name: '温和版', content: '您好，麻烦您了。关于这个事情，我们想跟您沟通一下...有什么问题我们好好商量，大家互相理解，争取一个双方都满意的结果。' },


                        { name: '专业版', content: '您好，我们来沟通一下具体事宜。首先确认一下当前情况，然后明确双方的权责和时间节点，最后达成一致意见并书面确认。这样可以吗？' },


                        { name: '强硬版', content: '这个事情必须按合同和规范来，没有商量的余地。该是谁的责任就是谁的责任，该什么时候完成就什么时候完成。不然后果自负。' }


                    ]


                },

                'liangfang-goutong': {

                    title: '量房沟通话术',

                    versions: [

                        { name: '温和版', content: '设计师您好，今天麻烦您上门量房了。我们家的情况大概是这样的...平时工作比较忙，所以有些地方可能考虑不周，您有什么专业建议尽管提。有什么需要我们配合的您随时说，大家一起把方案定好。' },

                        { name: '专业版', content: '设计师您好，今天量房辛苦您了。我们的需求清单和家电尺寸都准备好了，您先看一下。重点关注几个地方：1. 承重墙和剪力墙位置麻烦确认一下；2. 梁位、管井、下沉深度这些数据麻烦记录准确；3. 定制柜对应的水电点位我们有初步想法，您帮忙看看合不合理；4. 我们比较在意收纳空间，您帮忙多规划一下。量完之后麻烦出2-3版平面布局方案供我们对比，谢谢。' },

                        { name: '强硬版', content: '设计师，量房一定要准确，差几毫米后期都可能出问题。所有数据都要记录清楚，特别是梁位、管井、门窗位置、下水位置这些。我们的需求都列在清单上了，方案要按我们的需求来，不要为了省空间乱改。还有，报价要透明，后期不能随便增项，所有改动必须我们签字确认。' }

                    ]

                },


                'sifang-jiadi': {


                    title: '四方交底沟通话术',


                    versions: [


                        { name: '温和版', content: '各位好，今天麻烦大家过来做四方交底。我们先过一遍整体方案和水电点位，有什么问题大家随时提，我们一起确认清楚，避免后期返工。大家看这样可以吗？' },


                        { name: '专业版', content: '各位师傅好，今天进行四方交底。议程如下：1. 确认施工图纸和工艺要求；2. 逐一核对水电点位，特别是嵌入式家电和定制柜对应位置；3. 明确成品保护范围和要求；4. 确认工期节点和衔接配合。请大家各抒己见，确认无误后签字确认。' },


                        { name: '强硬版', content: '大家注意，今天交底很重要，所有点位必须当场确认清楚。后面如果因为交底不清导致返工，责任由施工方承担。现在逐项核对，有问题马上提，不要等做完了再说。' }


                    ]


                },


                'ranqi-gongsi': {


                    title: '燃气公司沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，麻烦您了。我家想改一下燃气管道，位置都已经确定好了，您看怎么操作方便？有什么需要我们配合的您尽管说。' },


                        { name: '专业版', content: '师傅您好，我是XX小区业主，申请燃气管道改造。燃气灶位置在X处，热水器在X处，想请您帮忙改管。这是户型图，您看一下方案是否可行，费用大概多少，多久能做完？' },


                        { name: '强硬版', content: '师傅，我这燃气改造要得急，麻烦尽快安排施工。你们收费标准我都了解，按规定来就行，但活一定要做好，气密性测试必须做，安全第一。' }


                    ]


                },


                'dingzhi-shangjia': {


                    title: '定制商家沟通话术',


                    versions: [


                        { name: '温和版', content: '设计师您好，今天麻烦您上门测量。我们家的需求大概是这样的...您看有什么建议吗？方案方面麻烦您多费心，有什么想法随时跟我们沟通。' },


                        { name: '专业版', content: '设计师您好，今天初尺麻烦您了。我们的需求清单和家电尺寸都准备好了，您先看一下。重点关注几个地方：厨房的水电点位要和橱柜对应，衣柜的内部结构要按我们的需求来，还有收口的问题您帮忙考虑一下。测量完麻烦出一下深化方案和水电点位图，谢谢。' },


                        { name: '强硬版', content: '设计师，测量一定要准确，差几毫米都可能装不上。方案要按我们的需求来，不要为了省材料乱改结构。还有，报价要透明，后期不能随便增项，所有改动必须我们签字确认。' }


                    ]


                },


                'shuidian-yanshou': {


                    title: '水电验收沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅们辛苦了，水电做的挺快的。我们今天过来验收一下，有什么不懂的还请多指教。有小问题的话麻烦帮忙调整一下，谢谢啦。' },


                        { name: '专业版', content: '工长您好，今天水电验收。我们按以下程序来：1. 打压测试，8-10公斤稳压30分钟；2. 通断测试，相位检测；3. 核对所有点位位置和数量；4. 拍照录像留存走向图。麻烦您配合一下，验收没问题我们就签字确认。' },


                        { name: '强硬版', content: '水电是隐蔽工程，必须验收合格才能封槽。打压测试必须做，所有点位必须核对清楚，走向图必须拍照留存。有问题马上整改，整改完重新验收，不合格绝对不能封槽。' }


                    ]


                },


                'dingzhi-fuchi': {


                    title: '定制复尺沟通话术',


                    versions: [


                        { name: '温和版', content: '设计师您好，泥瓦完工了，麻烦您过来复尺一下。有什么需要我们配合的您随时说。复尺完麻烦尽快出最终方案，我们好确认下单。' },


                        { name: '专业版', content: '设计师您好，泥瓦已经完工了，墙面地面尺寸都固定了，请您过来精准复尺。复尺的时候我们在场，一起核对关键尺寸。花色、五金、内部结构我们再最后确认一遍，没问题就正式下单。生产周期麻烦也书面确认一下。' },


                        { name: '强硬版', content: '设计师，复尺一定要准确，差几毫米都可能装不上，这个责任我们担不起。所有尺寸都要复核清楚，方案最后确认一遍，下单了就不能改了。生产周期和交货时间也写清楚，别到时候耽误事。' }


                    ]


                },


                'shuidian-jiadi': {


                    title: '水电交底沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，今天麻烦您过来做水电交底。我们把需求和点位都列出来了，您看看有没有什么问题。有什么好的建议也请您提一下，我们一起把方案定好。' },


                        { name: '专业版', content: '师傅您好，今天水电交底。这是点位图和家电尺寸清单，我们一个个来核对。厨房、卫生间、客厅、卧室的点位都标清楚了，您看看有没有遗漏或者不合理的地方。确认好了我们就按这个来做。' },


                        { name: '强硬版', content: '师傅，水电点位很重要，一定要按我们的要求来做，不能图省事乱改。每个点位都确认清楚，封槽了再改可就麻烦了。还有，材料要用国标，不能偷工减料，这个我们会验收的。' }


                    ]


                },


                'fangshui-jiadi': {


                    title: '防水交底沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，防水就麻烦您多费心了。我们家卫生间用的多，可不能漏水。有什么需要注意的地方您也跟我们说说，我们也好配合。' },


                        { name: '专业版', content: '师傅您好，今天防水交底。要求是这样的：淋浴区刷到1.8米高，干区30公分，管根和阴阳角先做圆弧处理。横竖各刷一遍，薄涂多遍。闭水试验做48小时，到时候我们一起去楼下看。没问题吧？' },


                        { name: '强硬版', content: '师傅，防水一定要做好，漏水了可是大麻烦。必须按规范来：淋浴区1.8米，管根圆弧处理，闭水48小时。要是漏水了，返工和赔偿都得您负责，这个丑话说在前面。' }


                    ]


                },


                'niwa-jiadi': {


                    title: '泥瓦交底沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，贴砖就麻烦您了。我们买的砖您看看怎么样，有没有什么需要注意的。手艺上麻烦您多费心，我们也不懂，就全靠您了。' },


                        { name: '专业版', content: '师傅您好，今天泥瓦交底。几点要求跟您说一下：1. 贴砖前先排砖，尽量避免小条砖；2. 空鼓率控制在5%以内；3. 卫生间坡度1-2%，地漏在最低处；4. 建议墙压地工艺。您看这些要求能做到吧？' },


                        { name: '强硬版', content: '师傅，贴砖的要求我再说一遍：空鼓率不能超过5%，卫生间排水要顺畅，墙压地工艺。要是空鼓超标，我们会要求返工的，这个丑话说在前面。还有，砖要爱惜着用，别浪费太多。' }


                    ]


                }


            },


            inspection: {


                'default': {


                    score: 85, subtitle: 'AI质检报告', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '平整度', score: 85, issue: '局部有轻微不平整', suggestion: '建议用靠尺复测，误差超2mm需整改' },


                        { name: '垂直度', score: 88 },


                        { name: '外观质量', score: 86, issue: '少量瑕疵', suggestion: '细节处需加强处理' },


                        { name: '功能性', score: 90 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '整体质量良好，建议加强细节处理，重点关注阴阳角和收口部位。'


                },


                'xuqiu-yizhixing': {


                    score: 86, subtitle: '需求一致性校验', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '功能需求匹配度', score: 85, issue: '2个需求点未在方案中体现', suggestion: '建议与设计师确认遗漏的需求点' },


                        { name: '家电尺寸对应', score: 88, issue: '1处嵌入式家电尺寸未标注', suggestion: '补充家电尺寸到图纸' },


                        { name: '定制柜位置', score: 90 },


                        { name: '水电点位数量', score: 82, issue: '部分区域点位偏少', suggestion: '建议增加厨房和卧室插座数量' }


                    ],


                    standards: ['依据：GB 50096-2011《住宅设计规范》'],


                    suggestions: '方案整体框架合理，建议补充缺失的需求点和家电尺寸，确保后续施工不出错。'


                },


                'nuantong-zhuanxiang': {


                    score: 88, subtitle: '暖通专项检查', statusText: '合格', statusClass: 'pass',


                    items: [


                        { name: '管道安装', score: 90 },


                        { name: '打压测试', score: 95 },


                        { name: '保温处理', score: 82, issue: '局部保温不够严密', suggestion: '检查管道连接处保温是否完整' },


                        { name: '坡度合规', score: 85 },


                        { name: '固定牢固度', score: 88 }


                    ],


                    standards: ['依据：GB 50736-2012《民用建筑供暖通风与空气调节设计规范》', '依据：GB 50243-2016《通风与空调工程施工质量验收规范》'],


                    suggestions: '暖通工程整体合格，建议加强管道连接处的保温处理，确保无冷凝水隐患。'


                },


                'shuidian-zhuanxiang': {


                    score: 86, subtitle: '水电专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '布管规范', score: 85, issue: '局部强弱电间距不够', suggestion: '强弱电交叉处需包锡纸屏蔽' },


                        { name: '打压测试', score: 92 },


                        { name: '点位准确性', score: 88, issue: '2个插座位置偏差', suggestion: '核对家电尺寸，调整插座位置' },


                        { name: '回路分配', score: 82, issue: '厨房回路偏少', suggestion: '建议厨房至少4个回路' },


                        { name: '接地保护', score: 90 }


                    ],


                    standards: ['依据：GB 50303-2015《建筑电气工程施工质量验收规范》', '依据：GB 50242-2002《建筑给水排水及采暖工程施工质量验收规范》'],


                    suggestions: '水电工程整体合格，但需关注强弱电间距和回路分配，建议厨房增加独立回路。'


                },


                'fangshui-zhuanxiang': {


                    score: 90, subtitle: '防水专项检查', statusText: '合格', statusClass: 'pass',


                    items: [


                        { name: '涂刷高度', score: 95 },


                        { name: '管根处理', score: 88, issue: '1处管根圆弧不够顺滑', suggestion: '重新做圆弧处理' },


                        { name: '闭水试验', score: 92 },


                        { name: '防水层厚度', score: 85 },


                        { name: '止水坎', score: 90 }


                    ],


                    standards: ['依据：GB 50208-2011《地下防水工程质量验收规范》', '依据：JGJ 298-2013《住宅室内防水工程技术规范》'],


                    suggestions: '防水工程质量良好，建议加强管根和阴阳角的圆弧处理，确保万无一失。'


                },


                'niwa-zhuanxiang': {


                    score: 84, subtitle: '泥瓦专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '空鼓率', score: 80, issue: '空鼓率约8%，超标', suggestion: '超标空鼓砖需返工，空鼓率应≤5%' },


                        { name: '平整度', score: 86 },


                        { name: '排水坡度', score: 88 },


                        { name: '阴阳角', score: 82, issue: '2处阴阳角不直', suggestion: '使用阴阳角条找直' },


                        { name: '砖缝均匀度', score: 85 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》', '依据：JGJ/T 304-2013《住宅室内装饰装修工程质量验收标准》'],


                    suggestions: '泥瓦工程存在局部质量问题，特别是空鼓率超标，建议对超标空鼓砖进行返工处理。'


                },


                'mugong-zhuanxiang': {


                    score: 87, subtitle: '木工专项检查', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '龙骨牢固度', score: 90 },


                        { name: '石膏板拼接', score: 85, issue: '1处接缝未倒V型槽', suggestion: '补倒V型槽，防止开裂' },


                        { name: '转角处理', score: 88 },


                        { name: '平整度', score: 86 },


                        { name: '窗帘盒', score: 88 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '木工工程整体良好，建议加强石膏板接缝处理，确保防裂工艺到位。'


                },


                'youqi-zhuanxiang': {


                    score: 83, subtitle: '油漆专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '平整度', score: 80, issue: '局部误差超2mm', suggestion: '需重新打磨找平' },


                        { name: '涂刷均匀度', score: 85 },


                        { name: '色差', score: 88 },


                        { name: '阴阳角顺直', score: 82, issue: '2处阴阳角不够顺直', suggestion: '用阴阳角条辅助找直' },


                        { name: '无流挂', score: 86 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '油漆工程需加强平整度控制，建议用2米靠尺逐面检查，误差超2mm处需返工。'


                },


                'dingzhi-heyan': {


                    score: 89, subtitle: '定制柜核验', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '板材品牌', score: 95 },


                        { name: '五金配件', score: 90 },


                        { name: '安装牢固度', score: 88 },


                        { name: '门缝均匀度', score: 82, issue: '2扇门缝偏大', suggestion: '调整铰链，门缝控制在2-3mm' },


                        { name: '收口美观度', score: 85, issue: '1处收口缝隙偏大', suggestion: '用同色收口条处理' }


                    ],


                    standards: ['依据：GB/T 3324-2017《木家具通用技术条件》', '依据：QB/T 2531-2010《厨房家具》'],


                    suggestions: '定制柜整体质量良好，建议调整门缝均匀度和收口细节，提升整体美观度。'


                },


                'jungong-zonghe': {


                    score: 85, subtitle: '竣工综合检查', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '水电工程', score: 88 },


                        { name: '防水工程', score: 90 },


                        { name: '泥瓦工程', score: 84, issue: '局部空鼓需关注', suggestion: '对超标空鼓砖进行返工处理' },


                        { name: '木工工程', score: 86 },


                        { name: '油漆工程', score: 82, issue: '局部平整度需加强', suggestion: '用2米靠尺逐面检查，误差超2mm处需返工' },


                        { name: '定制安装', score: 87 },


                        { name: '清洁卫生', score: 80, issue: '部分区域清洁不到位', suggestion: '开荒保洁需加强细节处理' }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》', '依据：GB 50303-2015《建筑电气工程施工质量验收规范》'],


                    suggestions: '整体装修质量良好，建议重点关注泥瓦空鼓和油漆平整度问题，整改完成后再进行最终验收。'


                },


                'fucai-yanshou': {


                    score: 88, subtitle: '辅材验收检查', statusText: '合格', statusClass: 'pass',


                    items: [


                        { name: '水管品牌型号', score: 92 },


                        { name: '电线品牌型号', score: 90 },


                        { name: '水泥品牌标号', score: 85, issue: '部分水泥存放时间偏长', suggestion: '检查保质期，优先使用先进场的' },


                        { name: '石膏板品牌', score: 88 },


                        { name: '防水材料', score: 86 }


                    ],


                    standards: ['依据：合同约定材料清单'],


                    suggestions: '辅材品牌型号基本符合合同约定，建议检查材料保质期，存放时间过长的谨慎使用。'


                },


                'tuzhi-hegui': {


                    score: 84, subtitle: '图纸合规检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '承重墙标注', score: 80, issue: '部分承重墙未明确标注', suggestion: '务必确认承重墙位置，严禁拆改' },


                        { name: '水电点位图', score: 85 },


                        { name: '尺寸标注完整性', score: 82, issue: '部分关键尺寸缺失', suggestion: '补充定制区域和家电位置的精确尺寸' },


                        { name: '节点大样图', score: 88 }


                    ],


                    standards: ['依据：GB 50096-2011《住宅设计规范》'],


                    suggestions: '图纸基本齐全，但承重墙标注和部分尺寸需要补充完善，确认无误后再施工。'


                },


                'chaigai-zhuanxiang': {


                    score: 82, subtitle: '拆改专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '合规性', score: 78, issue: '需确认是否动承重墙', suggestion: '严格核对图纸，承重墙绝对不能拆' },


                        { name: '新建墙体工艺', score: 85, issue: '拉结筋间距偏大', suggestion: '拉结筋间距应≤50cm' },


                        { name: '挂网防裂', score: 88 },


                        { name: '垃圾清运', score: 90 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '拆改工程最需要关注安全，务必确认没有动承重墙。新建墙体的拉结筋间距需要调整。'


                }


            },


            addon: {


                'default': {


                    title: '增项合理性分析', isReasonable: 'pending', priceRange: '待评估', judgment: '需要更多信息才能判断',


                    details: [{ label: '项目名称', value: '待定' }, { label: '市场价格区间', value: '待查询' }, { label: '合理性判定', value: '需核实' }],


                    responseScript: '建议先让施工方提供详细报价单，包括材料品牌规格、工程量、单价等，再进行对比分析。',


                    tips: '增项三原则：1. 必须书面确认报价后再施工；2. 对比市场价避免被宰；3. 确认是否真的需要做。'


                },


                'taocan-louxiang': {


                    title: '套餐漏项识别', isReasonable: 'warning', priceRange: '通常漏项价值：5000-20000元', judgment: '低价套餐普遍存在漏项，需警惕',


                    details: [{ label: '常见漏项1', value: '定制柜不含或只含少量' }, { label: '常见漏项2', value: '水电改造只含部分点位' }, { label: '常见漏项3', value: '防水只含基础高度' }, { label: '常见漏项4', value: '吊顶造型额外收费' }, { label: '常见漏项5', value: '垃圾清运不含' }],


                    responseScript: '您好，关于套餐内容我有几个疑问想确认一下：1. 定制柜包含多少投影面积？超出部分怎么算？2. 水电点位包含多少个？增点怎么收费？3. 防水高度是多少？升级怎么收费？麻烦您把这些都写清楚，我好对比。',


                    tips: '低价套餐是引流手段，实际结算往往超预算30-50%。签合同前务必把所有可能的增项都问清楚，写进合同。'


                },


                'baojia-shenhe': {


                    title: '报价审核分析', isReasonable: 'warning', priceRange: '合理浮动区间：±10%', judgment: '报价存在几处需要关注的地方',


                    details: [{ label: '报价完整性', value: '85% - 部分项目描述模糊' }, { label: '单价合理性', value: '基本符合市场价' }, { label: '工程量准确性', value: '需现场复核' }, { label: '材料规格', value: '部分未明确品牌型号' }],


                    responseScript: '您好，报价我看了，有几个地方想再确认一下：1. 材料的具体品牌型号能不能写清楚？2. 工程量是预估还是实测？最后按实结算吗？3. 有没有可能产生的增项？麻烦您都列出来。',


                    tips: '报价审核三看：一看有没有漏项，二看单价是否合理，三看材料规格是否明确。模糊的地方一定要问清楚。'


                },


                'hetong-tiaokuan': {


                    title: '合同条款审核', isReasonable: 'warning', priceRange: '风险敞口：合同金额的10-30%', judgment: '部分条款需重点关注',


                    details: [{ label: '付款节点', value: '建议首期不超40%' }, { label: '工期延误', value: '需明确赔偿比例（建议0.1-0.3%/天）' }, { label: '增项规则', value: '必须先签字后施工' }, { label: '质保期限', value: '水电防水≥5年，基础≥2年' }, { label: '违约责任', value: '需对等，不能只约束业主' }],


                    responseScript: '您好，合同我看了，有几个条款想商量一下：1. 首期款比例能不能降到30%？2. 工期延误的赔偿比例能不能明确一下？3. 增项必须我们签字确认才能施工，这条能不能加上？都是为了双方都有保障嘛。',


                    tips: '合同是保护双方的，不是单方面约束业主的。不合理的条款一定要提出来修改，不要怕麻烦。'


                },


                'hetong-fuhe': {


                    title: '合同风险复核', isReasonable: 'warning', priceRange: '风险价值：合同金额的5-15%', judgment: '需复核常见合同陷阱',


                    details: [{ label: '模糊条款', value: '注意"按实际结算"等模糊表述' }, { label: '材料替换', value: '警惕"同等档次"等可替换条款' }, { label: '工期顺延', value: '注意不合理的工期顺延条款' }, { label: '免责条款', value: '检查施工方免责条款是否过多' }],


                    responseScript: '您好，合同我再仔细看了一下，还有几个地方想确认：1. 这个"同等档次材料"具体是指什么？能不能列几个品牌参考？2. 工期顺延的情况能不能明确一下，什么情况才算合理顺延？3. 这条免责条款是不是太宽泛了？',


                    tips: '签合同前一定要逐条细看，特别是小字和备注栏。有疑问马上提，不要稀里糊涂就签字。'


                },


                'fucai-heyan': {


                    title: '辅材核验参考', isReasonable: 'pass', priceRange: '市场价：5000-15000元', judgment: '辅材品牌基本符合常规标准',


                    details: [{ label: '水管', value: '伟星/日丰/金牛 - 市场价10-30元/米' }, { label: '电线', value: '熊猫/正泰/远东 - 市场价100-300元/卷' }, { label: '水泥', value: '海螺/南方 - 市场价20-30元/袋' }, { label: '石膏板', value: '可耐福/龙牌/泰山 - 市场价30-60元/张' }],


                    responseScript: '师傅，辅材进场了我来验一下。麻烦您把包装都留着，我核对一下品牌型号。都是合同里约定的品牌吧？别到时候用了别的我也不知道，大家按合同来都省心。',


                    tips: '辅材进场一定要验收，核对品牌型号，拍照留存。别小看辅材，质量差的辅材后患无穷。'


                },


                'dianwei-pipei': {


                    title: '点位匹配校验', isReasonable: 'warning', priceRange: '增点费用：150-300元/个', judgment: '需核对家电尺寸确认点位准确性',


                    details: [{ label: '厨房插座', value: '建议至少8个，含冰箱、烤箱、洗碗机等' }, { label: '卫生间插座', value: '建议3-4个，含吹风机、智能马桶等' }, { label: '卧室插座', value: '建议每边2个（床头+充电）' }, { label: '网络点位', value: '建议每个房间至少1个超六类网线' }],


                    responseScript: '工长，水电点位我们再核对一遍。我把家电尺寸都带来了，一个个对，别到时候装不上。还有，如果需要增加点位，怎么收费？先说好，别做完了再报价。',


                    tips: '水电点位一定要提前核对清楚，封槽后再改成本翻倍。宁可多留几个，也不要后期不够用。'


                },


                'zengxiang-cankao': {


                    title: '增项参考评估', isReasonable: 'pending', priceRange: '需根据具体项目评估', judgment: '请提供具体增项内容以便分析',


                    details: [{ label: '增项名称', value: '请填写' }, { label: '增项原因', value: '请填写（设计变更/现场情况/漏项等）' }, { label: '施工方报价', value: '请填写' }, { label: '市场价区间', value: '待查询' }],


                    responseScript: '您好，这个增项我有几个问题：1. 为什么会产生这个增项？是漏项还是设计变更？2. 价格怎么算的？能不能给我看一下明细？3. 不做行不行？有什么影响？麻烦您解释清楚我再考虑签不签字。',


                    tips: '面对增项三连问：为什么要做？凭什么这个价？不做行不行？想清楚了再签字。'


                },


                'bishui-panding': {


                    title: '闭水试验判定', isReasonable: 'pass', priceRange: '无需额外费用', judgment: '闭水试验是标配，不应额外收费',


                    details: [{ label: '闭水时长', value: '标准48小时，建议72小时更保险' }, { label: '蓄水深度', value: '不少于5cm' }, { label: '合格标准', value: '楼下无渗漏，水位无明显下降' }, { label: '责任划分', value: '防水施工方负责，不合格免费返工' }],


                    responseScript: '师傅，闭水试验一定要做够48小时，明天这个时间我们一起去楼下看看。楼下邻居的联系方式我有，到时候一起确认。如果漏水的话，麻烦你们免费返工，返工后重新做闭水，没问题吧？',


                    tips: '闭水试验是防水的最后一道防线，必须做够时间，必须去楼下确认，最好让楼下签字。'


                },


                'meifeng-baojia': {


                    title: '美缝报价参考', isReasonable: 'pass', priceRange: '市场价：15-40元/㎡（包工包料）', judgment: '美缝价格区间较大，按需选择',


                    details: [{ label: '普通美缝剂', value: '15-25元/㎡ - 适合预算有限' }, { label: '环氧彩砂', value: '30-60元/㎡ - 硬度高，适合卫生间厨房' }, { label: '聚脲美缝', value: '50-80元/㎡ - 耐黄变，适合客厅阳台' }, { label: '自购材料人工费', value: '8-15元/㎡ - 自己买材料更放心' }],


                    responseScript: '师傅，美缝我想再了解一下：1. 用的是什么品牌的美缝剂？什么价位的？2. 是包工包料吗？多少钱一平米？3. 质保多久？我自己买材料的话人工费多少？麻烦您报个实价。',


                    tips: '美缝价格差异大，关键看材料。建议卫生间厨房用好一点的，防霉防水很重要。'


                },


                'zhongqi-baguan': {


                    title: '中期验收把关', isReasonable: 'warning', priceRange: '中期款通常为总款的30-40%', judgment: '中期验收是关键节点，需严格把关',


                    details: [{ label: '验收内容', value: '泥瓦+木工+油漆全部完工项目' }, { label: '增项确认', value: '所有已发生增项必须全部签字确认' }, { label: '付款前提', value: '验收合格+增项确认=支付中期款' }, { label: '扣留比例', value: '建议扣留5-10%作为质保金' }],


                    responseScript: '工长，中期验收我们逐项来，有问题的地方记下来，整改完了再付款。还有，所有增项都列出来，我核对一下，该签的字我签，但没签字的我不认。中期款等验收合格了我再付，按合同来，没问题吧？',


                    tips: '中期验收是付款前的最后一道关卡，一定要验收合格再付款。钱在谁手里谁就有主动权。'


                },


                'jungong-jiesuan': {


                    title: '竣工结算对账', isReasonable: 'pass', priceRange: '结算款 = 合同价 + 增项 - 减项', judgment: '结算需逐项核对，避免多算',


                    details: [{ label: '合同总价', value: '按合同约定' }, { label: '增项合计', value: '需有业主签字确认的增项单' }, { label: '减项合计', value: '未做项目应相应扣除' }, { label: '质保金', value: '建议扣留5-10%，质保期满后支付' }],


                    responseScript: '您好，结算我们对一下账。首先合同总价是多少，然后增项有哪些（拿签字单出来），减项有哪些，最后算总账。还有质保金按合同留多少，质保期满了我再付。大家算清楚，明明白白的。',


                    tips: '结算一定要对账，不要施工方说多少就是多少。增项必须有你的签字，减项也要扣回来。'


                },


                'zhibao-liucun': {


                    title: '质保留存提醒', isReasonable: 'pass', priceRange: '质保金建议：5-10%', judgment: '质保是重要保障，务必留存好凭证',


                    details: [{ label: '水电防水', value: '≥5年（法规底线）' }, { label: '基础工程', value: '≥2年（法规底线）' }, { label: '定制柜体', value: '通常5年，以商家承诺为准' }, { label: '家电产品', value: '1-3年，以品牌保修政策为准' }],


                    responseScript: '您好，竣工验收了，质保的事情咱们确认一下：1. 水电防水质保5年，基础工程2年，没问题吧？2. 质保卡和竣工图麻烦给我一份；3. 定制柜的质保凭证也单独给我一下；4. 质保金按合同约定扣留，到期没问题我就付。',


                    tips: '质保凭证一定要留存好，口头承诺不算数。有问题在质保期内及时报修，不要拖。'


                },


                'louxiang-shibie': {


                    title: '漏项识别分析', isReasonable: 'warning', priceRange: '漏项风险价值：3000-15000元', judgment: '半包报价常见漏项需警惕',


                    details: [{ label: '常见漏项1', value: '打孔费（空调孔、烟机孔等）' }, { label: '常见漏项2', value: '垃圾清运费' }, { label: '常见漏项3', value: '成品保护费' }, { label: '常见漏项4', value: '材料搬运费/上楼费' }, { label: '常见漏项5', value: '防水高度升级费' }],


                    responseScript: '您好，报价我看了，有几个费用想问清楚：打孔费、垃圾清运费、成品保护费、材料上楼费这些都包含了吗？不会后期再加吧？麻烦您把所有可能的费用都列出来，我好心里有数。',


                    tips: '半包报价看似便宜，实则很多费用不含。签合同前一定要把所有费用都问清楚。'


                },


                'cunlian-liandong': {


                    title: '尺寸联动校验', isReasonable: 'warning', priceRange: '尺寸出错返工成本：2000-10000元', judgment: '尺寸联动是关键，必须多方确认',


                    details: [{ label: '家电尺寸', value: '嵌入式家电尺寸必须准确' }, { label: '定制柜尺寸', value: '需与家电尺寸、水电点位联动' }, { label: '瓷砖厚度', value: '影响定制柜复尺精度' }, { label: '吊顶高度', value: '影响定制柜高度和收口' }],


                    responseScript: '各位，尺寸的事情大家多费心，一定要准确。家电尺寸我提供了，定制柜的水电点位麻烦定制商家和施工方对接一下，别到时候对不上。复尺的时候也请大家都在场，确认没问题了再下单。',


                    tips: '尺寸是装修的命根子，一步错步步错。宁可多核对几遍，也不要出错返工。'


                },


                'zeren-bianjie': {


                    title: '责任边界判定', isReasonable: 'warning', priceRange: '责任不清易导致扯皮', judgment: '半包模式需明确各方责任边界',


                    details: [{ label: '施工方责任', value: '施工质量、辅材质量、施工安全' }, { label: '业主责任', value: '主材采购、设计确认、款项支付' }, { label: '主材商责任', value: '主材质量、安装质量、售后质保' }, { label: '交叉施工责任', value: '谁损坏谁负责，谁后做谁保护' }],


                    responseScript: '师傅，这个事情我们先把责任理清楚。这是主材的问题还是施工的问题？如果是施工的问题，你们负责整改；如果是材料的问题，我找商家。大家把责任划清楚，该谁的谁承担，别互相推诿。',


                    tips: '半包模式最容易扯皮，关键是责任要清晰。出了问题先找原因，再定责任，最后解决。'


                },


                'cizhuan-daohuo': {


                    title: '瓷砖到货验收', isReasonable: 'pass', priceRange: '瓷砖占主材预算的15-25%', judgment: '瓷砖到货必须验收，避免后期扯皮',


                    details: [{ label: '验收要点1', value: '核对型号、色号、数量是否与订单一致' }, { label: '验收要点2', value: '检查有无破损、缺角、色差' }, { label: '验收要点3', value: '抽检几片，尺寸误差是否在允许范围内' }, { label: '验收要点4', value: '保留包装箱和订单，方便后续补货' }],


                    responseScript: '师傅，瓷砖到了我来验一下。先点数量，再看有没有破损，再抽查几片看看尺寸和平整度。没问题我就签收，有问题的话麻烦您联系商家退换。补货的话一定要同色号的，不然有色差就麻烦了。',


                    tips: '瓷砖到货一定要当场验收，签字后再发现问题商家可能不认。有色差的砖一定不要用。'


                },


                'jiage-qujian': {


                    title: '价格区间参考', isReasonable: 'pass', priceRange: '因项目而异，需具体分析', judgment: '多对比几家，心里才有底',


                    details: [{ label: '参考渠道1', value: '线上平台（淘宝/京东/拼多多）' }, { label: '参考渠道2', value: '本地建材市场（多问几家）' }, { label: '参考渠道3', value: '邻居/朋友装修实际价格' }, { label: '参考渠道4', value: '建材团购/家博会' }],


                    responseScript: '老板，我先了解一下价格。你这个牌子的这款砖，最低价多少？我再去别家看看，合适的话我再回来。大家实诚点，给个实价，能做就做，不能做也没关系。',


                    tips: '买东西货比三家不吃亏。不要怕麻烦，多跑几家，多砍砍价，差价可能大到你想不到。'


                },


                'gongqi-paiqi': {


                    title: '工期排期优化', isReasonable: 'warning', priceRange: '合理工期：90-150天（视面积和复杂度）', judgment: '自装工期容易拖延，需合理规划',


                    details: [{ label: '拆改阶段', value: '7-15天' }, { label: '水电阶段', value: '10-20天' }, { label: '泥瓦阶段', value: '15-30天' }, { label: '木工阶段', value: '10-20天' }, { label: '油漆阶段', value: '15-25天' }, { label: '安装阶段', value: '15-30天' }],


                    responseScript: '师傅，我们先把工期定一下。你这边大概需要多少天？什么时间进场？什么时间完工？中间有没有什么需要我配合的？咱们尽量按计划来，别拖太久，我也好安排后面的事情。',


                    tips: '自装工期容易失控，关键是提前规划、及时衔接。每个工种进场前都要提前约好。'


                },


                'gongfei-qujian': {


                    title: '工费区间参考', isReasonable: 'pass', priceRange: '因地区和工艺而异', judgment: '工费占自装总预算的30-40%',


                    details: [{ label: '水电工', value: '300-500元/天 或 30-50元/㎡' }, { label: '泥瓦工', value: '400-600元/天 或 按平米计费' }, { label: '木工', value: '350-550元/天' }, { label: '油漆工', value: '300-500元/天' }, { label: '杂工/力工', value: '200-300元/天' }],


                    responseScript: '师傅，你这个活怎么收费？是按天算还是按平方算？大概总共多少钱？我再找两个师傅对比一下，价格合适就定了。你手艺怎么样？有没有之前做的工地我看看？',


                    tips: '找工人不要只看价格，手艺更重要。便宜的工人做坏了，返工成本更高。'


                },


                'cailiao-yongliang': {


                    title: '材料用量计算', isReasonable: 'pass', priceRange: '材料计算误差建议控制在5-10%', judgment: '准确计算材料用量，避免浪费或补货',


                    details: [{ label: '瓷砖用量', value: '建筑面积×铺贴系数（约0.7-0.8）' }, { label: '水电材料', value: '按点位估算，多预留10-15%' }, { label: '防水涂料', value: '2遍约2-3kg/㎡' }, { label: '腻子粉', value: '2-3遍约1-1.5kg/㎡/遍' }, { label: '乳胶漆', value: '1底2面约0.12-0.15L/㎡/遍' }],


                    responseScript: '师傅，你帮我算一下大概需要多少材料。我好一次性买齐，省得跑好几趟。多退少补的话，商家那边怎么说？用不完的能退吗？补货的话会不会有色差？',


                    tips: '材料宁多勿少（在可退货的前提下），补货容易有色差。买之前问清楚能不能退。'


                },


                'anquan-xunjian': {


                    title: '安全巡检提醒', isReasonable: 'warning', priceRange: '安全事故成本不可估量', judgment: '自装安全责任需自负，务必重视',


                    details: [{ label: '用电安全', value: '临时用电需规范，严禁乱拉乱接' }, { label: '用火安全', value: '施工现场严禁吸烟，动火需有人看管' }, { label: '高空作业', value: '窗户安装、外墙作业需系安全带' }, { label: '材料堆放', value: '不要集中堆放过重材料，避免楼板超载' }],


                    responseScript: '师傅们，安全的事情我再强调一下：工地上注意安全，用电用火都小心点。不要嫌麻烦，安全第一。有什么安全隐患及时告诉我，大家平平安安把活干完。',


                    tips: '安全无小事。自装的话安全责任主要在业主，一定要提醒工人注意安全。'


                },


                'linli-fengxian': {


                    title: '邻里风险预警', isReasonable: 'warning', priceRange: '邻里纠纷处理成本：难以估量', judgment: '自装需注意邻里关系，避免纠纷',


                    details: [{ label: '施工时间', value: '严格遵守物业规定的施工时间' }, { label: '噪音控制', value: '拆改、打钻等高噪音作业提前打招呼' }, { label: '垃圾清运', value: '及时清运，不要堆放在公共区域' }, { label: '漏水风险', value: '闭水试验务必通知楼下确认' }],


                    responseScript: '师傅，施工时间注意点，别太早也别太晚，按物业规定来。还有，拆改和打钻的时候动静大，麻烦提前跟邻居打个招呼，邻里关系搞好点，大家都方便。',


                    tips: '远亲不如近邻，装修搞好邻里关系很重要。多打个招呼，多道个歉，能避免很多麻烦。'


                }


            },


            payment: {


                'default': {


                    title: '付款节点计算', totalAmount: '示例：10万元',


                    nodes: [


                        { name: '首期款', percent: '30%', amount: '30,000元', trigger: '合同签订后', note: '建议不超过40%' },


                        { name: '中期款', percent: '35%', amount: '35,000元', trigger: '中期验收合格后', note: '以验收换付款' },


                        { name: '竣工款', percent: '25%', amount: '25,000元', trigger: '竣工验收合格后', note: '结算完成后支付' },


                        { name: '质保金', percent: '10%', amount: '10,000元', trigger: '质保期满后', note: '建议扣留10%' }


                    ],


                    riskWarning: '付款原则：以验收换付款，钱在谁手里谁有主动权。',


                    acceptanceChecklist: ['对应阶段工程已全部验收合格', '所有增项已签字确认', '已收到相应票据/收据']


                },


                'shouqi-kuan': {


                    title: '首期款计算', totalAmount: '按合同总价计算',


                    nodes: [{ name: '首期款', percent: '30%', amount: '合同总价×30%', trigger: '合同签订后3日内', note: '建议不超过30%，降低风险' }],


                    riskWarning: '首期款比例越低越好，建议选择平台资金托管，更有保障。',


                    acceptanceChecklist: ['合同已仔细阅读并签字', '合同附件齐全（图纸、报价、材料清单）', '付款方式已确认（优先选择平台托管）']


                },


                'zhongqi-kuan': {


                    title: '中期款计算', totalAmount: '按合同总价计算',


                    nodes: [{ name: '中期款', percent: '30-40%', amount: '合同总价×30-40%', trigger: '泥瓦+木工+油漆全部完工验收合格后', note: '验收合格后再支付' }],


                    riskWarning: '中期验收是关键节点，必须逐项验收合格，所有增项签字确认后再付款。',


                    acceptanceChecklist: ['泥瓦工程全部验收合格', '木工工程全部验收合格', '油漆工程全部验收合格', '所有已发生增项已签字确认', '实际完成工程量已核对']


                },


                'fukuan-jisuan': {


                    title: '付款计算参考', totalAmount: '示例：10万元',


                    nodes: [


                        { name: '首期款', percent: '30%', amount: '30,000元', trigger: '合同签订后', note: '建议不超过40%' },


                        { name: '中期款', percent: '35%', amount: '35,000元', trigger: '中期验收合格后', note: '以验收换付款' },


                        { name: '竣工款', percent: '25%', amount: '25,000元', trigger: '竣工验收合格后', note: '结算完成后支付' },


                        { name: '质保金', percent: '10%', amount: '10,000元', trigger: '质保期满后', note: '建议扣留10%' }


                    ],


                    riskWarning: '付款原则：以验收换付款，钱在谁手里谁有主动权。不要相信任何"先付款再干活"的理由。',


                    acceptanceChecklist: ['对应阶段工程已全部验收合格', '所有增项已签字确认', '已收到相应票据/收据', '工程资料已移交（如有）']


                }


            },


            delay: {


                'default': {


                    title: '工期智能预警', totalDays: '按合同约定', elapsedDays: '待统计', remainingDays: '待计算', status: 'normal', statusText: '正常',


                    delayList: [{ item: '待填写', reason: '待分析', delayDays: 0, suggestion: '暂无' }],


                    keyNodes: [


                        { name: '拆改完成', plannedDay: 15, actualDay: '待更新', status: 'pending' },


                        { name: '水电完成', plannedDay: 30, actualDay: '待更新', status: 'pending' },


                        { name: '泥瓦完成', plannedDay: 60, actualDay: '待更新', status: 'pending' },


                        { name: '竣工验收', plannedDay: 100, actualDay: '待更新', status: 'pending' }


                    ],


                    suggestions: '建议定期更新进度，及时发现延误风险。如果某个节点延误，及时调整后续计划。'


                }


            }


        };


        var typeTemplates = templates[type];


        if (!typeTemplates) return null;


        return typeTemplates[subtype] || typeTemplates['default'];


    }


    var AI_TOOL_TYPES = {


        communication: { icon: '💬', name: '沟通话术' },


        inspection: { icon: '🔍', name: '拍照验工' },


        addon: { icon: '💰', name: '增项参考' },


        payment: { icon: '💳', name: '付款计算' },


        delay: { icon: '⏰', name: '工期预警' }


    };


    function getAIResult(type, stepId, subtype) {


        var templates = {


            communication: {


                'default': {


                    title: '沟通话术生成',


                    versions: [


                        { name: '温和版', content: '您好，麻烦您了。关于这个事情，我们想跟您沟通一下...有什么问题我们好好商量，大家互相理解，争取一个双方都满意的结果。' },


                        { name: '专业版', content: '您好，我们来沟通一下具体事宜。首先确认一下当前情况，然后明确双方的权责和时间节点，最后达成一致意见并书面确认。这样可以吗？' },


                        { name: '强硬版', content: '这个事情必须按合同和规范来，没有商量的余地。该是谁的责任就是谁的责任，该什么时候完成就什么时候完成。不然后果自负。' }


                    ]


                },

                'liangfang-goutong': {

                    title: '量房沟通话术',

                    versions: [

                        { name: '温和版', content: '设计师您好，今天麻烦您上门量房了。我们家的情况大概是这样的...平时工作比较忙，所以有些地方可能考虑不周，您有什么专业建议尽管提。有什么需要我们配合的您随时说，大家一起把方案定好。' },

                        { name: '专业版', content: '设计师您好，今天量房辛苦您了。我们的需求清单和家电尺寸都准备好了，您先看一下。重点关注几个地方：1. 承重墙和剪力墙位置麻烦确认一下；2. 梁位、管井、下沉深度这些数据麻烦记录准确；3. 定制柜对应的水电点位我们有初步想法，您帮忙看看合不合理；4. 我们比较在意收纳空间，您帮忙多规划一下。量完之后麻烦出2-3版平面布局方案供我们对比，谢谢。' },

                        { name: '强硬版', content: '设计师，量房一定要准确，差几毫米后期都可能出问题。所有数据都要记录清楚，特别是梁位、管井、门窗位置、下水位置这些。我们的需求都列在清单上了，方案要按我们的需求来，不要为了省空间乱改。还有，报价要透明，后期不能随便增项，所有改动必须我们签字确认。' }

                    ]

                },


                'sifang-jiadi': {


                    title: '四方交底沟通话术',


                    versions: [


                        { name: '温和版', content: '各位好，今天麻烦大家过来做四方交底。我们先过一遍整体方案和水电点位，有什么问题大家随时提，我们一起确认清楚，避免后期返工。大家看这样可以吗？' },


                        { name: '专业版', content: '各位师傅好，今天进行四方交底。议程如下：1. 确认施工图纸和工艺要求；2. 逐一核对水电点位，特别是嵌入式家电和定制柜对应位置；3. 明确成品保护范围和要求；4. 确认工期节点和衔接配合。请大家各抒己见，确认无误后签字确认。' },


                        { name: '强硬版', content: '大家注意，今天交底很重要，所有点位必须当场确认清楚。后面如果因为交底不清导致返工，责任由施工方承担。现在逐项核对，有问题马上提，不要等做完了再说。' }


                    ]


                },


                'ranqi-gongsi': {


                    title: '燃气公司沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，麻烦您了。我家想改一下燃气管道，位置都已经确定好了，您看怎么操作方便？有什么需要我们配合的您尽管说。' },


                        { name: '专业版', content: '师傅您好，我是XX小区业主，申请燃气管道改造。燃气灶位置在X处，热水器在X处，想请您帮忙改管。这是户型图，您看一下方案是否可行，费用大概多少，多久能做完？' },


                        { name: '强硬版', content: '师傅，我这燃气改造要得急，麻烦尽快安排施工。你们收费标准我都了解，按规定来就行，但活一定要做好，气密性测试必须做，安全第一。' }


                    ]


                },


                'dingzhi-shangjia': {


                    title: '定制商家沟通话术',


                    versions: [


                        { name: '温和版', content: '设计师您好，今天麻烦您上门测量。我们家的需求大概是这样的...您看有什么建议吗？方案方面麻烦您多费心，有什么想法随时跟我们沟通。' },


                        { name: '专业版', content: '设计师您好，今天初尺麻烦您了。我们的需求清单和家电尺寸都准备好了，您先看一下。重点关注几个地方：厨房的水电点位要和橱柜对应，衣柜的内部结构要按我们的需求来，还有收口的问题您帮忙考虑一下。测量完麻烦出一下深化方案和水电点位图，谢谢。' },


                        { name: '强硬版', content: '设计师，测量一定要准确，差几毫米都可能装不上。方案要按我们的需求来，不要为了省材料乱改结构。还有，报价要透明，后期不能随便增项，所有改动必须我们签字确认。' }


                    ]


                },


                'shuidian-yanshou': {


                    title: '水电验收沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅们辛苦了，水电做的挺快的。我们今天过来验收一下，有什么不懂的还请多指教。有小问题的话麻烦帮忙调整一下，谢谢啦。' },


                        { name: '专业版', content: '工长您好，今天水电验收。我们按以下程序来：1. 打压测试，8-10公斤稳压30分钟；2. 通断测试，相位检测；3. 核对所有点位位置和数量；4. 拍照录像留存走向图。麻烦您配合一下，验收没问题我们就签字确认。' },


                        { name: '强硬版', content: '水电是隐蔽工程，必须验收合格才能封槽。打压测试必须做，所有点位必须核对清楚，走向图必须拍照留存。有问题马上整改，整改完重新验收，不合格绝对不能封槽。' }


                    ]


                },


                'dingzhi-fuchi': {


                    title: '定制复尺沟通话术',


                    versions: [


                        { name: '温和版', content: '设计师您好，泥瓦完工了，麻烦您过来复尺一下。有什么需要我们配合的您随时说。复尺完麻烦尽快出最终方案，我们好确认下单。' },


                        { name: '专业版', content: '设计师您好，泥瓦已经完工了，墙面地面尺寸都固定了，请您过来精准复尺。复尺的时候我们在场，一起核对关键尺寸。花色、五金、内部结构我们再最后确认一遍，没问题就正式下单。生产周期麻烦也书面确认一下。' },


                        { name: '强硬版', content: '设计师，复尺一定要准确，差几毫米都可能装不上，这个责任我们担不起。所有尺寸都要复核清楚，方案最后确认一遍，下单了就不能改了。生产周期和交货时间也写清楚，别到时候耽误事。' }


                    ]


                },


                'shuidian-jiadi': {


                    title: '水电交底沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，今天麻烦您过来做水电交底。我们把需求和点位都列出来了，您看看有没有什么问题。有什么好的建议也请您提一下，我们一起把方案定好。' },


                        { name: '专业版', content: '师傅您好，今天水电交底。这是点位图和家电尺寸清单，我们一个个来核对。厨房、卫生间、客厅、卧室的点位都标清楚了，您看看有没有遗漏或者不合理的地方。确认好了我们就按这个来做。' },


                        { name: '强硬版', content: '师傅，水电点位很重要，一定要按我们的要求来做，不能图省事乱改。每个点位都确认清楚，封槽了再改可就麻烦了。还有，材料要用国标，不能偷工减料，这个我们会验收的。' }


                    ]


                },


                'fangshui-jiadi': {


                    title: '防水交底沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，防水就麻烦您多费心了。我们家卫生间用的多，可不能漏水。有什么需要注意的地方您也跟我们说说，我们也好配合。' },


                        { name: '专业版', content: '师傅您好，今天防水交底。要求是这样的：淋浴区刷到1.8米高，干区30公分，管根和阴阳角先做圆弧处理。横竖各刷一遍，薄涂多遍。闭水试验做48小时，到时候我们一起去楼下看。没问题吧？' },


                        { name: '强硬版', content: '师傅，防水一定要做好，漏水了可是大麻烦。必须按规范来：淋浴区1.8米，管根圆弧处理，闭水48小时。要是漏水了，返工和赔偿都得您负责，这个丑话说在前面。' }


                    ]


                },


                'niwa-jiadi': {


                    title: '泥瓦交底沟通话术',


                    versions: [


                        { name: '温和版', content: '师傅您好，贴砖就麻烦您了。我们买的砖您看看怎么样，有没有什么需要注意的。手艺上麻烦您多费心，我们也不懂，就全靠您了。' },


                        { name: '专业版', content: '师傅您好，今天泥瓦交底。几点要求跟您说一下：1. 贴砖前先排砖，尽量避免小条砖；2. 空鼓率控制在5%以内；3. 卫生间坡度1-2%，地漏在最低处；4. 建议墙压地工艺。您看这些要求能做到吧？' },


                        { name: '强硬版', content: '师傅，贴砖的要求我再说一遍：空鼓率不能超过5%，卫生间排水要顺畅，墙压地工艺。要是空鼓超标，我们会要求返工的，这个丑话说在前面。还有，砖要爱惜着用，别浪费太多。' }


                    ]


                }


            },


            inspection: {


                'default': {


                    score: 85, subtitle: 'AI质检报告', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '平整度', score: 85, issue: '局部有轻微不平整', suggestion: '建议用靠尺复测，误差超2mm需整改' },


                        { name: '垂直度', score: 88 },


                        { name: '外观质量', score: 86, issue: '少量瑕疵', suggestion: '细节处需加强处理' },


                        { name: '功能性', score: 90 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '整体质量良好，建议加强细节处理，重点关注阴阳角和收口部位。'


                },


                'xuqiu-yizhixing': {


                    score: 86, subtitle: '需求一致性校验', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '功能需求匹配度', score: 85, issue: '2个需求点未在方案中体现', suggestion: '建议与设计师确认遗漏的需求点' },


                        { name: '家电尺寸对应', score: 88, issue: '1处嵌入式家电尺寸未标注', suggestion: '补充家电尺寸到图纸' },


                        { name: '定制柜位置', score: 90 },


                        { name: '水电点位数量', score: 82, issue: '部分区域点位偏少', suggestion: '建议增加厨房和卧室插座数量' }


                    ],


                    standards: ['依据：GB 50096-2011《住宅设计规范》'],


                    suggestions: '方案整体框架合理，建议补充缺失的需求点和家电尺寸，确保后续施工不出错。'


                },


                'nuantong-zhuanxiang': {


                    score: 88, subtitle: '暖通专项检查', statusText: '合格', statusClass: 'pass',


                    items: [


                        { name: '管道安装', score: 90 },


                        { name: '打压测试', score: 95 },


                        { name: '保温处理', score: 82, issue: '局部保温不够严密', suggestion: '检查管道连接处保温是否完整' },


                        { name: '坡度合规', score: 85 },


                        { name: '固定牢固度', score: 88 }


                    ],


                    standards: ['依据：GB 50736-2012《民用建筑供暖通风与空气调节设计规范》', '依据：GB 50243-2016《通风与空调工程施工质量验收规范》'],


                    suggestions: '暖通工程整体合格，建议加强管道连接处的保温处理，确保无冷凝水隐患。'


                },


                'shuidian-zhuanxiang': {


                    score: 86, subtitle: '水电专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '布管规范', score: 85, issue: '局部强弱电间距不够', suggestion: '强弱电交叉处需包锡纸屏蔽' },


                        { name: '打压测试', score: 92 },


                        { name: '点位准确性', score: 88, issue: '2个插座位置偏差', suggestion: '核对家电尺寸，调整插座位置' },


                        { name: '回路分配', score: 82, issue: '厨房回路偏少', suggestion: '建议厨房至少4个回路' },


                        { name: '接地保护', score: 90 }


                    ],


                    standards: ['依据：GB 50303-2015《建筑电气工程施工质量验收规范》', '依据：GB 50242-2002《建筑给水排水及采暖工程施工质量验收规范》'],


                    suggestions: '水电工程整体合格，但需关注强弱电间距和回路分配，建议厨房增加独立回路。'


                },


                'fangshui-zhuanxiang': {


                    score: 90, subtitle: '防水专项检查', statusText: '合格', statusClass: 'pass',


                    items: [


                        { name: '涂刷高度', score: 95 },


                        { name: '管根处理', score: 88, issue: '1处管根圆弧不够顺滑', suggestion: '重新做圆弧处理' },


                        { name: '闭水试验', score: 92 },


                        { name: '防水层厚度', score: 85 },


                        { name: '止水坎', score: 90 }


                    ],


                    standards: ['依据：GB 50208-2011《地下防水工程质量验收规范》', '依据：JGJ 298-2013《住宅室内防水工程技术规范》'],


                    suggestions: '防水工程质量良好，建议加强管根和阴阳角的圆弧处理，确保万无一失。'


                },


                'niwa-zhuanxiang': {


                    score: 84, subtitle: '泥瓦专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '空鼓率', score: 80, issue: '空鼓率约8%，超标', suggestion: '超标空鼓砖需返工，空鼓率应≤5%' },


                        { name: '平整度', score: 86 },


                        { name: '排水坡度', score: 88 },


                        { name: '阴阳角', score: 82, issue: '2处阴阳角不直', suggestion: '使用阴阳角条找直' },


                        { name: '砖缝均匀度', score: 85 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》', '依据：JGJ/T 304-2013《住宅室内装饰装修工程质量验收标准》'],


                    suggestions: '泥瓦工程存在局部质量问题，特别是空鼓率超标，建议对超标空鼓砖进行返工处理。'


                },


                'mugong-zhuanxiang': {


                    score: 87, subtitle: '木工专项检查', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '龙骨牢固度', score: 90 },


                        { name: '石膏板拼接', score: 85, issue: '1处接缝未倒V型槽', suggestion: '补倒V型槽，防止开裂' },


                        { name: '转角处理', score: 88 },


                        { name: '平整度', score: 86 },


                        { name: '窗帘盒', score: 88 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '木工工程整体良好，建议加强石膏板接缝处理，确保防裂工艺到位。'


                },


                'youqi-zhuanxiang': {


                    score: 83, subtitle: '油漆专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '平整度', score: 80, issue: '局部误差超2mm', suggestion: '需重新打磨找平' },


                        { name: '涂刷均匀度', score: 85 },


                        { name: '色差', score: 88 },


                        { name: '阴阳角顺直', score: 82, issue: '2处阴阳角不够顺直', suggestion: '用阴阳角条辅助找直' },


                        { name: '无流挂', score: 86 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '油漆工程需加强平整度控制，建议用2米靠尺逐面检查，误差超2mm处需返工。'


                },


                'dingzhi-heyan': {


                    score: 89, subtitle: '定制柜核验', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '板材品牌', score: 95 },


                        { name: '五金配件', score: 90 },


                        { name: '安装牢固度', score: 88 },


                        { name: '门缝均匀度', score: 82, issue: '2扇门缝偏大', suggestion: '调整铰链，门缝控制在2-3mm' },


                        { name: '收口美观度', score: 85, issue: '1处收口缝隙偏大', suggestion: '用同色收口条处理' }


                    ],


                    standards: ['依据：GB/T 3324-2017《木家具通用技术条件》', '依据：QB/T 2531-2010《厨房家具》'],


                    suggestions: '定制柜整体质量良好，建议调整门缝均匀度和收口细节，提升整体美观度。'


                },


                'jungong-zonghe': {


                    score: 85, subtitle: '竣工综合检查', statusText: '轻微问题', statusClass: 'warning',


                    items: [


                        { name: '水电工程', score: 88 },


                        { name: '防水工程', score: 90 },


                        { name: '泥瓦工程', score: 84, issue: '局部空鼓需关注', suggestion: '对超标空鼓砖进行返工处理' },


                        { name: '木工工程', score: 86 },


                        { name: '油漆工程', score: 82, issue: '局部平整度需加强', suggestion: '用2米靠尺逐面检查，误差超2mm处需返工' },


                        { name: '定制安装', score: 87 },


                        { name: '清洁卫生', score: 80, issue: '部分区域清洁不到位', suggestion: '开荒保洁需加强细节处理' }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》', '依据：GB 50303-2015《建筑电气工程施工质量验收规范》'],


                    suggestions: '整体装修质量良好，建议重点关注泥瓦空鼓和油漆平整度问题，整改完成后再进行最终验收。'


                },


                'fucai-yanshou': {


                    score: 88, subtitle: '辅材验收检查', statusText: '合格', statusClass: 'pass',


                    items: [


                        { name: '水管品牌型号', score: 92 },


                        { name: '电线品牌型号', score: 90 },


                        { name: '水泥品牌标号', score: 85, issue: '部分水泥存放时间偏长', suggestion: '检查保质期，优先使用先进场的' },


                        { name: '石膏板品牌', score: 88 },


                        { name: '防水材料', score: 86 }


                    ],


                    standards: ['依据：合同约定材料清单'],


                    suggestions: '辅材品牌型号基本符合合同约定，建议检查材料保质期，存放时间过长的谨慎使用。'


                },


                'tuzhi-hegui': {


                    score: 84, subtitle: '图纸合规检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '承重墙标注', score: 80, issue: '部分承重墙未明确标注', suggestion: '务必确认承重墙位置，严禁拆改' },


                        { name: '水电点位图', score: 85 },


                        { name: '尺寸标注完整性', score: 82, issue: '部分关键尺寸缺失', suggestion: '补充定制区域和家电位置的精确尺寸' },


                        { name: '节点大样图', score: 88 }


                    ],


                    standards: ['依据：GB 50096-2011《住宅设计规范》'],


                    suggestions: '图纸基本齐全，但承重墙标注和部分尺寸需要补充完善，确认无误后再施工。'


                },


                'chaigai-zhuanxiang': {


                    score: 82, subtitle: '拆改专项检查', statusText: '需关注', statusClass: 'warning',


                    items: [


                        { name: '合规性', score: 78, issue: '需确认是否动承重墙', suggestion: '严格核对图纸，承重墙绝对不能拆' },


                        { name: '新建墙体工艺', score: 85, issue: '拉结筋间距偏大', suggestion: '拉结筋间距应≤50cm' },


                        { name: '挂网防裂', score: 88 },


                        { name: '垃圾清运', score: 90 }


                    ],


                    standards: ['依据：GB 50210-2018《建筑装饰装修工程质量验收标准》'],


                    suggestions: '拆改工程最需要关注安全，务必确认没有动承重墙。新建墙体的拉结筋间距需要调整。'


                }


            },


            addon: {


                'default': {


                    title: '增项合理性分析', isReasonable: 'pending', priceRange: '待评估', judgment: '需要更多信息才能判断',


                    details: [{ label: '项目名称', value: '待定' }, { label: '市场价格区间', value: '待查询' }, { label: '合理性判定', value: '需核实' }],


                    responseScript: '建议先让施工方提供详细报价单，包括材料品牌规格、工程量、单价等，再进行对比分析。',


                    tips: '增项三原则：1. 必须书面确认报价后再施工；2. 对比市场价避免被宰；3. 确认是否真的需要做。'


                },


                'taocan-louxiang': {


                    title: '套餐漏项识别', isReasonable: 'warning', priceRange: '通常漏项价值：5000-20000元', judgment: '低价套餐普遍存在漏项，需警惕',


                    details: [{ label: '常见漏项1', value: '定制柜不含或只含少量' }, { label: '常见漏项2', value: '水电改造只含部分点位' }, { label: '常见漏项3', value: '防水只含基础高度' }, { label: '常见漏项4', value: '吊顶造型额外收费' }, { label: '常见漏项5', value: '垃圾清运不含' }],


                    responseScript: '您好，关于套餐内容我有几个疑问想确认一下：1. 定制柜包含多少投影面积？超出部分怎么算？2. 水电点位包含多少个？增点怎么收费？3. 防水高度是多少？升级怎么收费？麻烦您把这些都写清楚，我好对比。',


                    tips: '低价套餐是引流手段，实际结算往往超预算30-50%。签合同前务必把所有可能的增项都问清楚，写进合同。'


                },


                'baojia-shenhe': {


                    title: '报价审核分析', isReasonable: 'warning', priceRange: '合理浮动区间：±10%', judgment: '报价存在几处需要关注的地方',


                    details: [{ label: '报价完整性', value: '85% - 部分项目描述模糊' }, { label: '单价合理性', value: '基本符合市场价' }, { label: '工程量准确性', value: '需现场复核' }, { label: '材料规格', value: '部分未明确品牌型号' }],


                    responseScript: '您好，报价我看了，有几个地方想再确认一下：1. 材料的具体品牌型号能不能写清楚？2. 工程量是预估还是实测？最后按实结算吗？3. 有没有可能产生的增项？麻烦您都列出来。',


                    tips: '报价审核三看：一看有没有漏项，二看单价是否合理，三看材料规格是否明确。模糊的地方一定要问清楚。'


                },


                'hetong-tiaokuan': {


                    title: '合同条款审核', isReasonable: 'warning', priceRange: '风险敞口：合同金额的10-30%', judgment: '部分条款需重点关注',


                    details: [{ label: '付款节点', value: '建议首期不超40%' }, { label: '工期延误', value: '需明确赔偿比例（建议0.1-0.3%/天）' }, { label: '增项规则', value: '必须先签字后施工' }, { label: '质保期限', value: '水电防水≥5年，基础≥2年' }, { label: '违约责任', value: '需对等，不能只约束业主' }],


                    responseScript: '您好，合同我看了，有几个条款想商量一下：1. 首期款比例能不能降到30%？2. 工期延误的赔偿比例能不能明确一下？3. 增项必须我们签字确认才能施工，这条能不能加上？都是为了双方都有保障嘛。',


                    tips: '合同是保护双方的，不是单方面约束业主的。不合理的条款一定要提出来修改，不要怕麻烦。'


                },


                'hetong-fuhe': {


                    title: '合同风险复核', isReasonable: 'warning', priceRange: '风险价值：合同金额的5-15%', judgment: '需复核常见合同陷阱',


                    details: [{ label: '模糊条款', value: '注意"按实际结算"等模糊表述' }, { label: '材料替换', value: '警惕"同等档次"等可替换条款' }, { label: '工期顺延', value: '注意不合理的工期顺延条款' }, { label: '免责条款', value: '检查施工方免责条款是否过多' }],


                    responseScript: '您好，合同我再仔细看了一下，还有几个地方想确认：1. 这个"同等档次材料"具体是指什么？能不能列几个品牌参考？2. 工期顺延的情况能不能明确一下，什么情况才算合理顺延？3. 这条免责条款是不是太宽泛了？',


                    tips: '签合同前一定要逐条细看，特别是小字和备注栏。有疑问马上提，不要稀里糊涂就签字。'


                },


                'fucai-heyan': {


                    title: '辅材核验参考', isReasonable: 'pass', priceRange: '市场价：5000-15000元', judgment: '辅材品牌基本符合常规标准',


                    details: [{ label: '水管', value: '伟星/日丰/金牛 - 市场价10-30元/米' }, { label: '电线', value: '熊猫/正泰/远东 - 市场价100-300元/卷' }, { label: '水泥', value: '海螺/南方 - 市场价20-30元/袋' }, { label: '石膏板', value: '可耐福/龙牌/泰山 - 市场价30-60元/张' }],


                    responseScript: '师傅，辅材进场了我来验一下。麻烦您把包装都留着，我核对一下品牌型号。都是合同里约定的品牌吧？别到时候用了别的我也不知道，大家按合同来都省心。',


                    tips: '辅材进场一定要验收，核对品牌型号，拍照留存。别小看辅材，质量差的辅材后患无穷。'


                },


                'dianwei-pipei': {


                    title: '点位匹配校验', isReasonable: 'warning', priceRange: '增点费用：150-300元/个', judgment: '需核对家电尺寸确认点位准确性',


                    details: [{ label: '厨房插座', value: '建议至少8个，含冰箱、烤箱、洗碗机等' }, { label: '卫生间插座', value: '建议3-4个，含吹风机、智能马桶等' }, { label: '卧室插座', value: '建议每边2个（床头+充电）' }, { label: '网络点位', value: '建议每个房间至少1个超六类网线' }],


                    responseScript: '工长，水电点位我们再核对一遍。我把家电尺寸都带来了，一个个对，别到时候装不上。还有，如果需要增加点位，怎么收费？先说好，别做完了再报价。',


                    tips: '水电点位一定要提前核对清楚，封槽后再改成本翻倍。宁可多留几个，也不要后期不够用。'


                },


                'zengxiang-cankao': {


                    title: '增项参考评估', isReasonable: 'pending', priceRange: '需根据具体项目评估', judgment: '请提供具体增项内容以便分析',


                    details: [{ label: '增项名称', value: '请填写' }, { label: '增项原因', value: '请填写（设计变更/现场情况/漏项等）' }, { label: '施工方报价', value: '请填写' }, { label: '市场价区间', value: '待查询' }],


                    responseScript: '您好，这个增项我有几个问题：1. 为什么会产生这个增项？是漏项还是设计变更？2. 价格怎么算的？能不能给我看一下明细？3. 不做行不行？有什么影响？麻烦您解释清楚我再考虑签不签字。',


                    tips: '面对增项三连问：为什么要做？凭什么这个价？不做行不行？想清楚了再签字。'


                },


                'bishui-panding': {


                    title: '闭水试验判定', isReasonable: 'pass', priceRange: '无需额外费用', judgment: '闭水试验是标配，不应额外收费',


                    details: [{ label: '闭水时长', value: '标准48小时，建议72小时更保险' }, { label: '蓄水深度', value: '不少于5cm' }, { label: '合格标准', value: '楼下无渗漏，水位无明显下降' }, { label: '责任划分', value: '防水施工方负责，不合格免费返工' }],


                    responseScript: '师傅，闭水试验一定要做够48小时，明天这个时间我们一起去楼下看看。楼下邻居的联系方式我有，到时候一起确认。如果漏水的话，麻烦你们免费返工，返工后重新做闭水，没问题吧？',


                    tips: '闭水试验是防水的最后一道防线，必须做够时间，必须去楼下确认，最好让楼下签字。'


                },


                'meifeng-baojia': {


                    title: '美缝报价参考', isReasonable: 'pass', priceRange: '市场价：15-40元/㎡（包工包料）', judgment: '美缝价格区间较大，按需选择',


                    details: [{ label: '普通美缝剂', value: '15-25元/㎡ - 适合预算有限' }, { label: '环氧彩砂', value: '30-60元/㎡ - 硬度高，适合卫生间厨房' }, { label: '聚脲美缝', value: '50-80元/㎡ - 耐黄变，适合客厅阳台' }, { label: '自购材料人工费', value: '8-15元/㎡ - 自己买材料更放心' }],


                    responseScript: '师傅，美缝我想再了解一下：1. 用的是什么品牌的美缝剂？什么价位的？2. 是包工包料吗？多少钱一平米？3. 质保多久？我自己买材料的话人工费多少？麻烦您报个实价。',


                    tips: '美缝价格差异大，关键看材料。建议卫生间厨房用好一点的，防霉防水很重要。'


                },


                'zhongqi-baguan': {


                    title: '中期验收把关', isReasonable: 'warning', priceRange: '中期款通常为总款的30-40%', judgment: '中期验收是关键节点，需严格把关',


                    details: [{ label: '验收内容', value: '泥瓦+木工+油漆全部完工项目' }, { label: '增项确认', value: '所有已发生增项必须全部签字确认' }, { label: '付款前提', value: '验收合格+增项确认=支付中期款' }, { label: '扣留比例', value: '建议扣留5-10%作为质保金' }],


                    responseScript: '工长，中期验收我们逐项来，有问题的地方记下来，整改完了再付款。还有，所有增项都列出来，我核对一下，该签的字我签，但没签字的我不认。中期款等验收合格了我再付，按合同来，没问题吧？',


                    tips: '中期验收是付款前的最后一道关卡，一定要验收合格再付款。钱在谁手里谁就有主动权。'


                },


                'jungong-jiesuan': {


                    title: '竣工结算对账', isReasonable: 'pass', priceRange: '结算款 = 合同价 + 增项 - 减项', judgment: '结算需逐项核对，避免多算',


                    details: [{ label: '合同总价', value: '按合同约定' }, { label: '增项合计', value: '需有业主签字确认的增项单' }, { label: '减项合计', value: '未做项目应相应扣除' }, { label: '质保金', value: '建议扣留5-10%，质保期满后支付' }],


                    responseScript: '您好，结算我们对一下账。首先合同总价是多少，然后增项有哪些（拿签字单出来），减项有哪些，最后算总账。还有质保金按合同留多少，质保期满了我再付。大家算清楚，明明白白的。',


                    tips: '结算一定要对账，不要施工方说多少就是多少。增项必须有你的签字，减项也要扣回来。'


                },


                'zhibao-liucun': {


                    title: '质保留存提醒', isReasonable: 'pass', priceRange: '质保金建议：5-10%', judgment: '质保是重要保障，务必留存好凭证',


                    details: [{ label: '水电防水', value: '≥5年（法规底线）' }, { label: '基础工程', value: '≥2年（法规底线）' }, { label: '定制柜体', value: '通常5年，以商家承诺为准' }, { label: '家电产品', value: '1-3年，以品牌保修政策为准' }],


                    responseScript: '您好，竣工验收了，质保的事情咱们确认一下：1. 水电防水质保5年，基础工程2年，没问题吧？2. 质保卡和竣工图麻烦给我一份；3. 定制柜的质保凭证也单独给我一下；4. 质保金按合同约定扣留，到期没问题我就付。',


                    tips: '质保凭证一定要留存好，口头承诺不算数。有问题在质保期内及时报修，不要拖。'


                },


                'louxiang-shibie': {


                    title: '漏项识别分析', isReasonable: 'warning', priceRange: '漏项风险价值：3000-15000元', judgment: '半包报价常见漏项需警惕',


                    details: [{ label: '常见漏项1', value: '打孔费（空调孔、烟机孔等）' }, { label: '常见漏项2', value: '垃圾清运费' }, { label: '常见漏项3', value: '成品保护费' }, { label: '常见漏项4', value: '材料搬运费/上楼费' }, { label: '常见漏项5', value: '防水高度升级费' }],


                    responseScript: '您好，报价我看了，有几个费用想问清楚：打孔费、垃圾清运费、成品保护费、材料上楼费这些都包含了吗？不会后期再加吧？麻烦您把所有可能的费用都列出来，我好心里有数。',


                    tips: '半包报价看似便宜，实则很多费用不含。签合同前一定要把所有费用都问清楚。'


                },


                'cunlian-liandong': {


                    title: '尺寸联动校验', isReasonable: 'warning', priceRange: '尺寸出错返工成本：2000-10000元', judgment: '尺寸联动是关键，必须多方确认',


                    details: [{ label: '家电尺寸', value: '嵌入式家电尺寸必须准确' }, { label: '定制柜尺寸', value: '需与家电尺寸、水电点位联动' }, { label: '瓷砖厚度', value: '影响定制柜复尺精度' }, { label: '吊顶高度', value: '影响定制柜高度和收口' }],


                    responseScript: '各位，尺寸的事情大家多费心，一定要准确。家电尺寸我提供了，定制柜的水电点位麻烦定制商家和施工方对接一下，别到时候对不上。复尺的时候也请大家都在场，确认没问题了再下单。',


                    tips: '尺寸是装修的命根子，一步错步步错。宁可多核对几遍，也不要出错返工。'


                },


                'zeren-bianjie': {


                    title: '责任边界判定', isReasonable: 'warning', priceRange: '责任不清易导致扯皮', judgment: '半包模式需明确各方责任边界',


                    details: [{ label: '施工方责任', value: '施工质量、辅材质量、施工安全' }, { label: '业主责任', value: '主材采购、设计确认、款项支付' }, { label: '主材商责任', value: '主材质量、安装质量、售后质保' }, { label: '交叉施工责任', value: '谁损坏谁负责，谁后做谁保护' }],


                    responseScript: '师傅，这个事情我们先把责任理清楚。这是主材的问题还是施工的问题？如果是施工的问题，你们负责整改；如果是材料的问题，我找商家。大家把责任划清楚，该谁的谁承担，别互相推诿。',


                    tips: '半包模式最容易扯皮，关键是责任要清晰。出了问题先找原因，再定责任，最后解决。'


                },


                'cizhuan-daohuo': {


                    title: '瓷砖到货验收', isReasonable: 'pass', priceRange: '瓷砖占主材预算的15-25%', judgment: '瓷砖到货必须验收，避免后期扯皮',


                    details: [{ label: '验收要点1', value: '核对型号、色号、数量是否与订单一致' }, { label: '验收要点2', value: '检查有无破损、缺角、色差' }, { label: '验收要点3', value: '抽检几片，尺寸误差是否在允许范围内' }, { label: '验收要点4', value: '保留包装箱和订单，方便后续补货' }],


                    responseScript: '师傅，瓷砖到了我来验一下。先点数量，再看有没有破损，再抽查几片看看尺寸和平整度。没问题我就签收，有问题的话麻烦您联系商家退换。补货的话一定要同色号的，不然有色差就麻烦了。',


                    tips: '瓷砖到货一定要当场验收，签字后再发现问题商家可能不认。有色差的砖一定不要用。'


                },


                'jiage-qujian': {


                    title: '价格区间参考', isReasonable: 'pass', priceRange: '因项目而异，需具体分析', judgment: '多对比几家，心里才有底',


                    details: [{ label: '参考渠道1', value: '线上平台（淘宝/京东/拼多多）' }, { label: '参考渠道2', value: '本地建材市场（多问几家）' }, { label: '参考渠道3', value: '邻居/朋友装修实际价格' }, { label: '参考渠道4', value: '建材团购/家博会' }],


                    responseScript: '老板，我先了解一下价格。你这个牌子的这款砖，最低价多少？我再去别家看看，合适的话我再回来。大家实诚点，给个实价，能做就做，不能做也没关系。',


                    tips: '买东西货比三家不吃亏。不要怕麻烦，多跑几家，多砍砍价，差价可能大到你想不到。'


                },


                'gongqi-paiqi': {


                    title: '工期排期优化', isReasonable: 'warning', priceRange: '合理工期：90-150天（视面积和复杂度）', judgment: '自装工期容易拖延，需合理规划',


                    details: [{ label: '拆改阶段', value: '7-15天' }, { label: '水电阶段', value: '10-20天' }, { label: '泥瓦阶段', value: '15-30天' }, { label: '木工阶段', value: '10-20天' }, { label: '油漆阶段', value: '15-25天' }, { label: '安装阶段', value: '15-30天' }],


                    responseScript: '师傅，我们先把工期定一下。你这边大概需要多少天？什么时间进场？什么时间完工？中间有没有什么需要我配合的？咱们尽量按计划来，别拖太久，我也好安排后面的事情。',


                    tips: '自装工期容易失控，关键是提前规划、及时衔接。每个工种进场前都要提前约好。'


                },


                'gongfei-qujian': {


                    title: '工费区间参考', isReasonable: 'pass', priceRange: '因地区和工艺而异', judgment: '工费占自装总预算的30-40%',


                    details: [{ label: '水电工', value: '300-500元/天 或 30-50元/㎡' }, { label: '泥瓦工', value: '400-600元/天 或 按平米计费' }, { label: '木工', value: '350-550元/天' }, { label: '油漆工', value: '300-500元/天' }, { label: '杂工/力工', value: '200-300元/天' }],


                    responseScript: '师傅，你这个活怎么收费？是按天算还是按平方算？大概总共多少钱？我再找两个师傅对比一下，价格合适就定了。你手艺怎么样？有没有之前做的工地我看看？',


                    tips: '找工人不要只看价格，手艺更重要。便宜的工人做坏了，返工成本更高。'


                },


                'cailiao-yongliang': {


                    title: '材料用量计算', isReasonable: 'pass', priceRange: '材料计算误差建议控制在5-10%', judgment: '准确计算材料用量，避免浪费或补货',


                    details: [{ label: '瓷砖用量', value: '建筑面积×铺贴系数（约0.7-0.8）' }, { label: '水电材料', value: '按点位估算，多预留10-15%' }, { label: '防水涂料', value: '2遍约2-3kg/㎡' }, { label: '腻子粉', value: '2-3遍约1-1.5kg/㎡/遍' }, { label: '乳胶漆', value: '1底2面约0.12-0.15L/㎡/遍' }],


                    responseScript: '师傅，你帮我算一下大概需要多少材料。我好一次性买齐，省得跑好几趟。多退少补的话，商家那边怎么说？用不完的能退吗？补货的话会不会有色差？',


                    tips: '材料宁多勿少（在可退货的前提下），补货容易有色差。买之前问清楚能不能退。'


                },


                'anquan-xunjian': {


                    title: '安全巡检提醒', isReasonable: 'warning', priceRange: '安全事故成本不可估量', judgment: '自装安全责任需自负，务必重视',


                    details: [{ label: '用电安全', value: '临时用电需规范，严禁乱拉乱接' }, { label: '用火安全', value: '施工现场严禁吸烟，动火需有人看管' }, { label: '高空作业', value: '窗户安装、外墙作业需系安全带' }, { label: '材料堆放', value: '不要集中堆放过重材料，避免楼板超载' }],


                    responseScript: '师傅们，安全的事情我再强调一下：工地上注意安全，用电用火都小心点。不要嫌麻烦，安全第一。有什么安全隐患及时告诉我，大家平平安安把活干完。',


                    tips: '安全无小事。自装的话安全责任主要在业主，一定要提醒工人注意安全。'


                },


                'linli-fengxian': {


                    title: '邻里风险预警', isReasonable: 'warning', priceRange: '邻里纠纷处理成本：难以估量', judgment: '自装需注意邻里关系，避免纠纷',


                    details: [{ label: '施工时间', value: '严格遵守物业规定的施工时间' }, { label: '噪音控制', value: '拆改、打钻等高噪音作业提前打招呼' }, { label: '垃圾清运', value: '及时清运，不要堆放在公共区域' }, { label: '漏水风险', value: '闭水试验务必通知楼下确认' }],


                    responseScript: '师傅，施工时间注意点，别太早也别太晚，按物业规定来。还有，拆改和打钻的时候动静大，麻烦提前跟邻居打个招呼，邻里关系搞好点，大家都方便。',


                    tips: '远亲不如近邻，装修搞好邻里关系很重要。多打个招呼，多道个歉，能避免很多麻烦。'


                }


            },


            payment: {


                'default': {


                    title: '付款节点计算', totalAmount: '示例：10万元',


                    nodes: [


                        { name: '首期款', percent: '30%', amount: '30,000元', trigger: '合同签订后', note: '建议不超过40%' },


                        { name: '中期款', percent: '35%', amount: '35,000元', trigger: '中期验收合格后', note: '以验收换付款' },


                        { name: '竣工款', percent: '25%', amount: '25,000元', trigger: '竣工验收合格后', note: '结算完成后支付' },


                        { name: '质保金', percent: '10%', amount: '10,000元', trigger: '质保期满后', note: '建议扣留10%' }


                    ],


                    riskWarning: '付款原则：以验收换付款，钱在谁手里谁有主动权。',


                    acceptanceChecklist: ['对应阶段工程已全部验收合格', '所有增项已签字确认', '已收到相应票据/收据']


                },


                'shouqi-kuan': {


                    title: '首期款计算', totalAmount: '按合同总价计算',


                    nodes: [{ name: '首期款', percent: '30%', amount: '合同总价×30%', trigger: '合同签订后3日内', note: '建议不超过30%，降低风险' }],


                    riskWarning: '首期款比例越低越好，建议选择平台资金托管，更有保障。',


                    acceptanceChecklist: ['合同已仔细阅读并签字', '合同附件齐全（图纸、报价、材料清单）', '付款方式已确认（优先选择平台托管）']


                },


                'zhongqi-kuan': {


                    title: '中期款计算', totalAmount: '按合同总价计算',


                    nodes: [{ name: '中期款', percent: '30-40%', amount: '合同总价×30-40%', trigger: '泥瓦+木工+油漆全部完工验收合格后', note: '验收合格后再支付' }],


                    riskWarning: '中期验收是关键节点，必须逐项验收合格，所有增项签字确认后再付款。',


                    acceptanceChecklist: ['泥瓦工程全部验收合格', '木工工程全部验收合格', '油漆工程全部验收合格', '所有已发生增项已签字确认', '实际完成工程量已核对']


                },


                'fukuan-jisuan': {


                    title: '付款计算参考', totalAmount: '示例：10万元',


                    nodes: [


                        { name: '首期款', percent: '30%', amount: '30,000元', trigger: '合同签订后', note: '建议不超过40%' },


                        { name: '中期款', percent: '35%', amount: '35,000元', trigger: '中期验收合格后', note: '以验收换付款' },


                        { name: '竣工款', percent: '25%', amount: '25,000元', trigger: '竣工验收合格后', note: '结算完成后支付' },


                        { name: '质保金', percent: '10%', amount: '10,000元', trigger: '质保期满后', note: '建议扣留10%' }


                    ],


                    riskWarning: '付款原则：以验收换付款，钱在谁手里谁有主动权。不要相信任何"先付款再干活"的理由。',


                    acceptanceChecklist: ['对应阶段工程已全部验收合格', '所有增项已签字确认', '已收到相应票据/收据', '工程资料已移交（如有）']


                }


            },


            delay: {


                'default': {


                    title: '工期智能预警', totalDays: '按合同约定', elapsedDays: '待统计', remainingDays: '待计算', status: 'normal', statusText: '正常',


                    delayList: [{ item: '待填写', reason: '待分析', delayDays: 0, suggestion: '暂无' }],


                    keyNodes: [


                        { name: '拆改完成', plannedDay: 15, actualDay: '待更新', status: 'pending' },


                        { name: '水电完成', plannedDay: 30, actualDay: '待更新', status: 'pending' },


                        { name: '泥瓦完成', plannedDay: 60, actualDay: '待更新', status: 'pending' },


                        { name: '竣工验收', plannedDay: 100, actualDay: '待更新', status: 'pending' }


                    ],


                    suggestions: '建议定期更新进度，及时发现延误风险。如果某个节点延误，及时调整后续计划。'


                }


            }


        };


        var typeTemplates = templates[type];


        if (!typeTemplates) return null;


        return typeTemplates[subtype] || typeTemplates['default'];


    }


var MODE_STEPS = {


        full: [


        {


            id: 'F-1', stageIndex: 0, stepIndex: 0,


            title: '筛选装修公司+初步沟通',


            description: '对比筛选3-5家靠谱的装修公司，完成初步沟通和意向确认。',


            nianTip: '选装修公司可是头等大事呢，您知道怎么判断一家公司靠不靠谱吗？建议您多对比几家，实地看看工地和样板间，心里才有底哦~',


            aiTrigger: false,


            aiType: null,


                        aiTools: [


                {


                    "id": "taocan-louxiang",


                    "icon": "💰",


                    "name": "套餐漏项识别",


                    "type": "addon",


                    "subtype": "taocan-louxiang"


                }


            ],


materials: [


                { name: '需求清单', qty: '1份', price: '免费', brands: ['自行整理'], tips: '列出家庭成员生活习惯和功能需求', category: '资料清单' },


                { name: '户型图', qty: '1份', price: '免费', brands: ['开发商提供'], tips: '最好有原始结构图和承重墙图纸', category: '资料清单' },


                { name: '预算表', qty: '1份', price: '免费', brands: ['自行规划'], tips: '确定总预算区间，预留15-20%备用金', category: '资料清单' }


            ],


            materialCategory: '资料清单',


            riskWarning: '低价套餐常不含定制柜，后期增项重灾区',

            notes: [
                '不要只看报价总价，要对比单价、材料品牌和工艺标准',
                '套餐公司要特别注意包含边界，很多套餐不含定制柜、吊顶、背景墙',
                '实地考察在建工地比看样板间更真实，看工艺、看管理、看卫生',
                '问清楚付款节点和比例，尽量争取压尾款，别一次性付太多',
                '口头承诺不算数，所有谈好的内容都要写进合同或补充协议里'
            ],

            pitfalls: [
                { title: '低价套餐陷阱', desc: '表面报价便宜，实际漏项严重，后期增项能加30%-50%。避坑：拿到报价单逐项核对，问清楚哪些不含，提前估算增项预算。' },
                { title: '样板间迷惑', desc: '样板间装得好不等于你家也能装好，很多样板间是找最好的工人做的。避坑：一定要看在建工地，最好突击去看，别让公司提前安排。' }
            ],

            guide: {


                text: '怎么选到靠谱的装修公司？重点看这几点：①查资质：营业执照、建筑装饰资质证书要齐全；②看工地：实地考察在建工地的施工工艺和管理水平；③核报价：不要只看总价，要看单价、材料品牌规格和包含项目；④问清楚：全包套餐的包含边界，尤其是定制柜、吊顶、水电改造这些容易增项的地方。',


                notes: [


                    '查看营业执照、建筑装饰资质证书，确认是正规公司',


                    '要求看在建工地，现场考察施工工艺和管理水平',


                    '明确全包套餐包含哪些项目，特别是橱柜和定制柜',


                    '了解增项规则，问清楚哪些情况可能产生额外费用',


                    '不要只看总价，要看单价和材料品牌规格'


                ],


                checklist: [


                    '已对比3-5家装修公司',


                    '已考察门店和在建工地',


                    '已明确全包是否含橱柜及其他定制柜',


                    '已对齐包含/不含项目边界',


                    '已准备好需求清单、户型图和预算'


                ]


            },


            completionFeedback: {


                nianText: '太棒了！装修公司选好了，这第一步走得很稳~ 接下来就要约设计师上门量房了，您准备好了吗？',


                nextHint: '下一步：上门量房+初步方案，数据越准方案越靠谱'


            }


        },


        {


            id: 'F-2', stageIndex: 0, stepIndex: 1,


            title: '上门量房+初步方案',


            description: '预约设计师上门量房，获取平面布局图和初步报价。',


            nianTip: '量房这一步可关键了，您当天方便在场吗？有什么想法当场跟设计师说，效果会更好呢。量房数据越准，后面的方案就越靠谱哦~',


            aiTrigger: false,


            aiType: null,


            materials: [


                { name: '承重墙图纸', qty: '1份', price: '免费', brands: ['开发商/物业'], tips: '确认哪些墙绝对不能动', category: '资料清单' }


            ],


            materialCategory: '资料清单',


            riskWarning: '没预留定制柜位置，后期加塞破坏动线',

            notes: [
                '量房时尽量在场，当场跟设计师沟通你的生活习惯和功能需求',
                '让设计师量全房尺寸，包括梁位、窗位、下水位置、层高、门洞大小',
                '老房一定要量墙面垂直度和地面平整度，这些直接影响后面施工费用',
                '提前确定大家电型号尺寸，特别是嵌入式家电的预留尺寸要精准',
                '拍照记录每个管道的走向和高度，特别是厨房卫生间的下水位置',
                '有特殊需求当场说清楚，比如扫地机器人基站、宠物用品区等'
            ],

            pitfalls: [
                { title: '免费设计陷阱', desc: '说是免费设计，其实设计费早就摊在工程款里了，设计质量也没保障。避坑：对比设计质量，别因为免费就将就，设计不好后期全是坑。' },
                { title: '量房数据不准', desc: '设计师量房马马虎虎，漏量梁位、管井，后期施工尺寸不对要加钱。避坑：自己也随手量几个关键尺寸复核，特别是定制区域的尺寸。' }
            ],

            guide: {


                text: '量房当天一定要在场，重点关注这几点：①带上房屋原始结构图，对照确认承重墙和剪力墙位置；②量房数据要细：梁位、管井、下沉深度、门窗位置、管道走向都要记录；③平面布局图要提前规划好定制柜的位置，不然后期加塞会破坏动线；④有特殊需求当场沟通，避免后期反复修改。',


                notes: [


                    '带上房屋原始结构图，对照确认承重墙和剪力墙位置',


                    '量房要包含梁位、管井、下沉深度等细节数据',


                    '平面布局图要预留定制柜位置，提前规划收纳空间',


                    '拍照记录每个管道的走向和高度，特别是厨房卫生间',


                    '有特殊需求当场跟设计师沟通，避免后期反复修改'


                ],


                checklist: [


                    '设计师已上门量房',


                    '量房包含梁位、管井、下沉深度等数据',


                    '已获取平面布局图',


                    '平面布局已预留定制柜位置',


                    '已拿到初步报价'


                ]


            },


            completionFeedback: {


                nianText: '量房完成啦！平面布局图也出来了，家的样子开始有眉目了~ 接下来要深化方案和审核报价，这可是省钱的关键一步哦！',


                nextHint: '下一步：方案深化+报价审核+锁定家电型号'


            }


        },


        {


            id: 'F-3', stageIndex: 0, stepIndex: 2,


            title: '方案深化+报价审核+锁定家电型号',


            description: '细化全套施工图纸，审核报价，锁定嵌入式家电型号和定制需求。',


            nianTip: '方案深化和报价审核可要仔细看哦，漏项可是后期增项的重灾区呢。还有嵌入式家电的型号一定要早点定下来，不然后期水电留位错了，返工成本可高了，您说对吗？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "xuqiu-yizhixing",


                    "icon": "🔍",


                    "name": "需求一致性校验",


                    "type": "inspection",


                    "subtype": "xuqiu-yizhixing"


                },


                {


                    "id": "baojia-shenhe",


                    "icon": "💰",


                    "name": "报价审核",


                    "type": "addon",


                    "subtype": "baojia-shenhe"


                }


            ],


materials: [


                { name: '嵌入式家电型号', qty: '若干', price: '待定', brands: ['海尔', '西门子', '美的'], tips: '先锁定型号拿尺寸，无需付款，后期再买', category: '家电' },


                { name: '定制柜初步方案', qty: '1份', price: '免费', brands: ['定制商家'], tips: '确认功能分区和大致尺寸', category: '定制' },


                { name: '水电点位图', qty: '1份', price: '免费', brands: ['定制商家'], tips: '定制柜对应的水电位置', category: '图纸' },


                { name: '智能预埋图', qty: '1份', price: '免费', brands: ['智能家居商家'], tips: '智能家居需要预留的线路', category: '图纸' }


            ],


            materialCategory: '家电/定制/图纸',


            riskWarning: '不定家电尺寸，水电留位全错，返工成本极高',


            guide: {


                text: '这一步决定了后期会不会增项和返工，重点把关这几点：①图纸要齐：平面图、立面图、水电图、吊顶图、节点大样图一个都不能少；②报价要审：逐项核对有没有漏项、少报面积、低报单价，注意辅料品牌规格；③家电先定：嵌入式家电（冰箱、洗碗机、蒸烤箱等）先锁定型号拿尺寸，不用急着付款；④水电点位要和定制柜、智能家居需求对应上。',


                notes: [


                    '全套施工图纸包括：平面图、立面图、水电图、吊顶图、节点大样图等',


                    '报价审核要逐项核对，注意有没有漏项、少报面积、低报单价',


                    '嵌入式家电（冰箱、洗碗机、蒸烤箱等）先锁定型号拿尺寸，不用急着付款',


                    '定制柜功能分区和位置要初步确认，水电点位要对应',


                    '智能家居要提前规划，确定需要预埋哪些线路和底盒'


                ],


                checklist: [


                    '全套施工图纸齐全',


                    '报价无漏项，单价和数量合理',


                    '嵌入式家电型号已锁定，尺寸已给设计师',


                    '定制柜功能位置初步确认',


                    '智能家居预埋要求已确认'


                ]


            },


            completionFeedback: {


                nianText: '方案和报价都确认清楚了，家电尺寸也定好了，这一步做得真扎实~ 接下来就要签合同了，您知道签合同要注意哪些坑吗？',


                nextHint: '下一步：签合同+付首期款，AI帮您把关'


            }


        },


        {


            id: 'F-4', stageIndex: 0, stepIndex: 3,


            title: '签合同+付首期款',


            description: '签订正式装修施工合同，支付首期款，明确增项规则、工期、质保等关键条款。',


            nianTip: '签合同这一步可要睁大眼睛哦，付款方式和增项规则您都了解清楚了吗？建议首期款不要超过40%，还有平台资金托管了解一下，更有保障呢~',


            aiTrigger: true,


            aiType: 'contract',


                        aiTools: [


                {


                    "id": "hetong-tiaokuan",


                    "icon": "💰",


                    "name": "合同条款审核",


                    "type": "addon",


                    "subtype": "hetong-tiaokuan"


                },


                {


                    "id": "fukuan-jisuan",


                    "icon": "💳",


                    "name": "付款计算",


                    "type": "payment",


                    "subtype": "fukuan-jisuan"


                },


                {


                    "id": "hetong-fuhe",


                    "icon": "💰",


                    "name": "合同风险复核",


                    "type": "addon",


                    "subtype": "hetong-fuhe"


                }


            ],


materials: [


                { name: '首期款', qty: '≤40%', price: '总工程款×40%', brands: ['装修公司'], tips: '建议不超过40%，优先选择平台托管', category: '工程款' }


            ],


            materialCategory: '工程款',


            riskWarning: '平台资金托管渗透率93.5%，建议用托管付款',


            guide: {


                text: '合同是保护双方权益的法律文件，签之前务必逐条核对。重点关注：付款节点和比例、工期延误赔偿、材料品牌规格、增项流程、质保期限。定制柜增项明细一定要写入合同，避免后期扯皮。',


                notes: [


                    '首期款建议不超过40%，付款比例越低风险越小',


                    '优先选择平台资金托管，完工验收后平台才打款给装修公司',


                    '增项规则要明确：必须先签字确认报价，再施工，否则可以拒绝付款',


                    '工期要明确起止日期，延误赔偿比例要合理（建议每日0.1-0.3%）',


                    '质保期：水电防水≥5年，基础工程≥2年，这是法规底线',


                    '合同附件要盖骑缝章，包括图纸、报价单、材料清单'


                ],


                checklist: [


                    '已仔细阅读合同全部条款',


                    '合同附件（图纸、报价、材料清单）齐全且盖骑缝章',


                    '增项规则、工期、质保已明确',


                    '定制柜增项明细已写入合同',


                    '首期款比例≤40%，付款方式已确认'


                ]


            },


            completionFeedback: {


                nianText: '合同签好啦！首期款也付了，装修正式启动啦，想想都有点小激动呢~ 接下来要办物业手续和四方交底，您知道四方是哪四方吗？',


                nextHint: '下一步：物业手续+四方交底，开工前的最后准备'


            }


        },


        {


            id: 'F-5', stageIndex: 0, stepIndex: 4,


            title: '物业手续+四方交底',


            description: '办理施工许可证，进行业主、设计师、项目经理、监理四方交底，明确施工内容和水电点位。',


            nianTip: '开工前先把物业手续办了，别到时候被投诉停工哦~ 四方交底的时候一定要到场，有问题当面说清楚，特别是家电和定制柜对应的水电点位，确认好了再开工，您说对吗？',


            aiTrigger: false,


            aiType: null,


            aiTools: [


                {


                    "id": "sifang-jiadi",


                    "icon": "💬",


                    "name": "四方交底话术",


                    "type": "communication",


                    "subtype": "sifang-jiadi"


                },


                {


                    "id": "material-inspection",


                    "icon": "📦",


                    "name": "材料进场验收",


                    "type": "materialInspection",


                    "subtype": "default",


                    "description": "智能材料验收助手（示例效果）"


                }


            ],


materials: [


                { name: '施工图纸', qty: '全套', price: '免费', brands: ['装修公司'], tips: '包括平面、立面、水电等', category: '资料清单' },


                { name: '公司资质', qty: '1份', price: '免费', brands: ['装修公司'], tips: '物业备案需要', category: '资料清单' },


                { name: '首批辅材', qty: '1批', price: '待定', brands: ['装修公司'], tips: '水泥、沙子、电线、水管等', category: '辅材' }


            ],


            materialCategory: '资料/辅材',


            riskWarning: '交底不确认点位，后期做错扯皮',


            guide: {


                text: '开工前的最后一步，先去物业办施工许可证，交装修押金。然后四方交底：业主、设计师、项目经理、监理一起到现场，把施工内容、注意事项、水电点位都过一遍，特别是家电、定制柜、智能设备对应的水电点位，一定要当场复核确认，书面签字。',


                notes: [


                    '提前去物业办理施工许可证，了解施工时间要求和垃圾清运规定',


                    '四方交底：业主、设计师、项目经理、监理都要到场',


                    '交底内容要书面记录，各方签字确认，避免后期扯皮',


                    '重点复核家电、定制柜、智能家居对应的水电点位是否正确',


                    '确认成品保护范围和要求，特别是入户门、电梯等公共区域'


                ],


                checklist: [


                    '施工许可证已办理完成',


                    '四方交底已完成并书面签字',


                    '家电对应水电点位已复核',


                    '定制柜对应水电点位已复核',


                    '智能家居对应点位已复核'


                ]


            },


            completionFeedback: {


                nianText: '交底完成啦！一切准备就绪，马上就要开工了~ 接下来是成品保护和主体拆改，家的样子要开始变化了哦！',


                nextHint: '下一步：成品保护+主体拆改，正式开工！'


            }


        },


        {


            id: 'F-6', stageIndex: 1, stepIndex: 0,


            title: '成品保护+主体拆改',


            description: '做好入户门、燃气表等成品保护，根据设计图纸进行非承重墙拆除和新建墙体。',


            nianTip: '开工啦！首先要做好成品保护，入户门、燃气表都要包起来哦~ 拆改的时候一定要记住：承重墙绝对不能动！老房子的话还需要结构鉴定报告呢，安全第一，您说对吗？',


            aiTrigger: false,


            aiType: null,


            materials: [


                { name: '保护材料', qty: '1批', price: '200-500元', brands: ['装修配套'], tips: '保护膜、保护条、珍珠棉等', category: '辅材' },


                { name: '拆改辅材', qty: '1批', price: '500-1500元', brands: ['本地建材'], tips: '新建墙体用的砖、水泥、沙子等', category: '基础材料' }


            ],


            materialCategory: '基础材料',


            riskWarning: '承重墙严禁拆除，违法且危害结构安全',


            guide: {


                text: '拆改是施工第一步，先保护再拆改。入户门、燃气表、公共区域都要保护好。拆改的原则是：承重墙、剪力墙、配重墙、梁、柱一律不能动。新建墙体要挂网、放拉结筋，防止后期开裂。',


                notes: [


                    '成品保护：入户门、燃气表、水表、电表、已有设施都要保护好',


                    '承重墙绝对不能拆，不确定的先看图纸或问物业，老房需结构鉴定报告',


                    '新建墙体底部砌3层小砖，上面斜砌顶紧楼板',


                    '新旧墙体连接处挂钢丝网，每边搭接不少于15cm，防止开裂',


                    '拆改垃圾及时清运，保持现场整洁',


                    '拆改完成后要复核尺寸，特别是定制区域的墙体位置'


                ],


                checklist: [


                    '成品保护到位，入户门、燃气表等已保护',


                    '无违规拆改，承重墙未动',


                    '老房如有需要已提供结构鉴定报告',


                    '新建墙体已放置拉结筋并挂网',


                    '垃圾已清运，现场整洁'


                ]


            },


            completionFeedback: {


                nianText: '拆改完成啦！空间格局一下子就开阔了~ 接下来如果需要改燃气的话，要提前预约燃气公司哦，排队期挺长的呢！',


                nextHint: '下一步：燃气改造（如需要），记得提前预约'


            }


        },


        {


            id: 'F-7', stageIndex: 1, stepIndex: 1,


            title: '燃气改造（如需要）',


            description: '如需改动燃气管道或移表，向燃气公司申请，由燃气公司专业人员施工。',


            nianTip: '燃气改造可不能找装修工人私自改哦，必须由燃气公司来施工才安全合法呢。而且燃气公司排队期挺长的，要提前1-2周预约，别耽误工期哦~',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "ranqi-gongsi",


                    "icon": "💬",


                    "name": "燃气公司话术",


                    "type": "communication",


                    "subtype": "ranqi-gongsi"


                }


            ],


materials: [


                { name: '燃气公司预约', qty: '1次', price: '按实际收费', brands: ['当地燃气公司'], tips: '提前1-2周预约，排队期较长', category: '服务' }


            ],


            materialCategory: '服务',


            riskWarning: '必须由燃气公司施工，禁止私自改动',


            guide: {


                text: '燃气改造是高危项目，绝对不能私自改动，必须由燃气公司专业人员施工。如果需要改管或移表，提前1-2周向燃气公司申请预约，因为排队期比较长。改造完成后要验收，确保符合安全规范。',


                notes: [


                    '燃气改造必须由燃气公司施工，禁止装修工人私自改动，违法且危险',


                    '提前1-2周预约燃气公司，排队期较长，别耽误工期',


                    '改造前确定好燃气灶、热水器的位置，一次改到位',


                    '燃气管道不能包死，要留检修口，方便后期维护',


                    '改造完成后要做气密性测试，确保无泄漏'


                ],


                checklist: [


                    '已向燃气公司申请预约',


                    '由燃气公司专业人员施工',


                    '施工符合安全规范',


                    '已做气密性测试无泄漏',


                    '预留检修口方便后期维护'


                ]


            },


            completionFeedback: {


                nianText: '燃气改造完成啦！安全第一，这一步做得很到位~ 接下来拆改完就可以约定制商家上门初次测量了，可以提前排产省时间哦！',


                nextHint: '下一步：定制柜初次测量，提前排产省时间'


            }


        },


        {


            id: 'F-8', stageIndex: 1, stepIndex: 2,


            title: '定制柜初次测量',


            description: '拆改完成后，定制商家上门初次测量，出具深化方案，确认水电点位无误。',


            nianTip: '拆改完墙体位置就固定了，这时候可以约定制商家上门初尺啦~ 初尺准确的话可以提前排产，能节省7-10天时间呢，早点装完好入住，您说对吗？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "dingzhi-shangjia",


                    "icon": "💬",


                    "name": "定制商家话术",


                    "type": "communication",


                    "subtype": "dingzhi-shangjia"


                }


            ],


materials: [


                { name: '定制商家初测', qty: '1次', price: '免费/定金', brands: ['索菲亚', '欧派', '本地定制'], tips: '出深化方案和水电点位图', category: '定制' }


            ],


            materialCategory: '定制',


            riskWarning: '初尺可提前排产，节省7-10天',


            guide: {


                text: '拆改完成后墙体位置就固定了，这时候定制商家可以上门初次测量。初尺后可以出深化方案，确认水电点位，如果没问题还可以提前排产，节省7-10天的生产周期。不过要注意，初尺是估算，最终尺寸要等泥瓦完工后复尺。',


                notes: [


                    '拆改完成、墙体位置固定后再初尺，数据更准确',


                    '初尺后定制商家出深化方案，确认功能分区和内部结构',


                    '核对水电点位图，确保插座、开关位置与定制柜不冲突',


                    '初尺无误可以提前排产，节省7-10天生产周期',


                    '但要注意，最终下单以泥瓦完工后的复尺为准'


                ],


                checklist: [


                    '墙体位置已固定，拆改完成',


                    '定制商家已上门初尺',


                    '初步方案已确认',


                    '水电点位核对无误',


                    '如提前排产，已与商家确认复尺后再正式下单'


                ]


            },


            completionFeedback: {


                nianText: '初次测量完成啦！定制方案也有眉目了~ 接下来如果装中央空调、新风或地暖的话，要赶在水电前做哦，不然后期返工损失可大了！',


                nextHint: '下一步：暖通/空调隐蔽工程（如需要）'


            }


        },


        {


            id: 'F-9', stageIndex: 1, stepIndex: 3,


            title: '暖通/空调隐蔽工程（如需要）',


            description: '中央空调/风管机/新风管道预埋安装（水电前），地暖管道铺设（水电后、泥瓦前）。',


            nianTip: '中央空调和新风一定要在水电开槽前装好管道哦，不然后期吊顶返工损失好几万呢！地暖的话要等水电做完、泥瓦回填前铺。时间节点可别搞混了，您都记清楚了吗？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "nuantong-zhuanxiang",


                    "icon": "🔍",


                    "name": "暖通专项检查",


                    "type": "inspection",


                    "subtype": "nuantong-zhuanxiang"


                }


            ],


materials: [


                { name: '中央空调/风管机', qty: '1套', price: '1-5万', brands: ['格力', '美的', '大金'], tips: '水电前进场安装管道和主机', category: '家电' },


                { name: '新风系统', qty: '1套', price: '8千-3万', brands: ['松下', '霍尼韦尔', '远大'], tips: '水电前或同步完成管道铺设', category: '家电' },


                { name: '地暖设备', qty: '1套', price: '1.5-5万', brands: ['威能', '博世', '菲斯曼'], tips: '水电后进场，泥瓦回填前铺设', category: '家电' }


            ],


            materialCategory: '暖通设备',


            riskWarning: '中央空调/新风必须在水电前完成管道预埋，否则吊顶返工损失数万；地暖在水电后、泥瓦前铺设',


            guide: {


                text: '暖通设备的安装时间节点非常关键，搞错了后期返工损失很大。中央空调和风管机的管道、主机必须在水电开槽前完成，要和水电工现场配合定位。新风管道也要在水电前或同步完成，吊顶预埋要提前规划。地暖则是水电完成后、泥瓦回填前铺设。',


                notes: [


                    '中央空调/风管机：水电开槽前完成管道和主机安装，与水电工现场配合定位',


                    '新风系统：水电前或同步完成管道铺设，吊顶预埋需提前规划',


                    '地暖：水电完成后进场，分集水器和管道铺设，与泥瓦回填合并施工',


                    '所有设备的电源线、控制线要提前和水电工沟通，预留到位',


                    '管道铺设完成后要做打压测试，确认无渗漏'


                ],


                checklist: [


                    '中央空调/风管机管道/主机已安装（水电前完成）',


                    '新风管道已铺设（水电前或同步完成）',


                    '与水电工现场配合定位完毕',


                    '地暖分集水器/管道已铺设（水电后、泥瓦前）',


                    '打压测试通过，无渗漏'


                ]


            },


            completionFeedback: {


                nianText: '暖通隐蔽工程搞定啦！时间节点卡得很准，厉害~ 接下来就是最重要的水电改造了，隐蔽工程可不能马虎哦！',


                nextHint: '下一步：水电改造+隐蔽验收，最关键的隐蔽工程'


            }


        },


        {


            id: 'F-10', stageIndex: 1, stepIndex: 4,


            title: '水电改造+隐蔽验收',


            description: '水电布管、打压测试、通断测试，嵌入式家电水电位置精准对应，智能线路确认。',


            nianTip: '水电改造可是隐蔽工程中的重中之重哦，您知道为什么水管要走顶不走地吗？封槽后再改点位可就得砸墙砸砖了，成本翻倍都不止。所以验收一定要仔细，拍照留存走向图，您说对吗？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "fucai-heyan",


                    "icon": "💰",


                    "name": "辅材核验",


                    "type": "addon",


                    "subtype": "fucai-heyan"


                },


                {


                    "id": "dianwei-pipei",


                    "icon": "💰",


                    "name": "点位匹配",


                    "type": "addon",


                    "subtype": "dianwei-pipei"


                },


                {


                    "id": "shuidian-zhuanxiang",


                    "icon": "🔍",


                    "name": "水电专项检查",


                    "type": "inspection",


                    "subtype": "shuidian-zhuanxiang"


                },


                {


                    "id": "shuidian-yanshou",


                    "icon": "💬",


                    "name": "水电验收话术",


                    "type": "communication",


                    "subtype": "shuidian-yanshou"


                },


                {


                    "id": "zengxiang-cankao",


                    "icon": "💰",


                    "name": "增项参考",


                    "type": "addon",


                    "subtype": "zengxiang-cankao"


                }


            ],


materials: [


                { name: '水电辅材', qty: '1批', price: '5千-1.5万', brands: ['伟星', '日丰', '熊猫', '正泰'], tips: '水管、电线、穿线管、底盒等', category: '水电材料' }


            ],


            materialCategory: '水电材料',


            riskWarning: '水电封槽后改点位需砸墙砸砖，成本翻倍。拍照留存走向图',


            guide: {


                text: '水电改造是最重要的隐蔽工程，一旦封槽再改就麻烦了。水管走顶不走地，电路分路要合理。嵌入式家电的水电位置一定要精准对应，智能零火线、超六类网线、配线箱都要确认。完工后打压测试、通断测试都要做，拍照留存走向图。',


                notes: [


                    '打压测试：8-10公斤压力，稳压30分钟，压降不超过0.5公斤合格',


                    '强电弱电分管铺设，间距不少于30cm，交叉处包锡纸屏蔽',


                    '厨房至少4个回路：插座、照明、冰箱、烤箱/洗碗机',


                    '所有嵌入式家电的水电位置要精准对应，反复核对尺寸',


                    '智能家居确认零火线、超六类网线、配线箱位置',


                    '拍照和视频留存水电走向图，后期维修有用',


                    '封槽前一定要验收，确认没问题再封'


                ],


                checklist: [


                    '工艺达标，布管整齐规范',


                    '打压测试合格（8-10公斤，稳压30分钟）',


                    '通断测试合格，相位正确',


                    '嵌入式家电水电位置精准对应',


                    '智能零火线/超六类网线/配线箱已确认',


                    '已拍照留存水电走向图'


                ]


            },


            completionFeedback: {


                nianText: '水电验收通过啦！隐蔽工程搞定，这下心里踏实多了~ 接下来要做防水工程了，您知道闭水试验要做多久吗？',


                nextHint: '下一步：防水工程+闭水试验，不然后期漏水哭都来不及'


            }


        },


        {


            id: 'F-11', stageIndex: 2, stepIndex: 0,


            title: '防水工程+闭水试验',


            description: '防水涂刷、管根圆弧处理，48小时闭水试验，确保无渗漏。',


            nianTip: '防水这一步可不能马虎哦，淋浴区要刷到1.8米高呢，管根还要做圆弧处理。闭水试验一定要做够48小时，还要去楼下签字确认，不然后期漏水到楼下邻里纠纷可麻烦了，您说对吗？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "fangshui-zhuanxiang",


                    "icon": "🔍",


                    "name": "防水专项检查",


                    "type": "inspection",


                    "subtype": "fangshui-zhuanxiang"


                },


                {


                    "id": "bishui-panding",


                    "icon": "💰",


                    "name": "闭水判定",


                    "type": "addon",


                    "subtype": "bishui-panding"


                }


            ],


materials: [


                { name: '防水涂料', qty: '3-5桶', price: '200-400元/桶', brands: ['东方雨虹', '德高', '雷邦仕'], tips: '柔性防水涂料，抗沉降不开裂', category: '防水材料' }


            ],


            materialCategory: '防水材料',


            riskWarning: '防水渗漏是最高频邻里纠纷',


            guide: {


                text: '防水是重中之重，漏水不仅自己麻烦，还会影响楼下邻居。淋浴区刷1.8米高，其他墙面至少30cm，管根、阴阳角要做圆弧处理加强。闭水试验48小时，一定要去楼下查看确认无渗漏，最好让楼下业主签字。',


                notes: [


                    '淋浴区防水刷到1.8米高，干区墙面至少30cm',


                    '管根、阴阳角等重点部位先做圆弧处理，再刷防水加强',


                    '防水要横竖各刷一遍，薄涂多遍，不要一次刷太厚',


                    '闭水试验蓄水不少于5cm，48小时后去楼下查看',


                    '卫生间门口要做止水坎，防水往外延30cm',


                    '最好让楼下业主签字确认无渗漏，避免后期纠纷'


                ],


                checklist: [


                    '淋浴区防水高度1.8m，其他区域符合要求',


                    '管根已做圆弧处理',


                    '闭水48小时无渗漏',


                    '楼下已签字确认无渗漏',


                    '门口止水坎已做好'


                ]


            },


            completionFeedback: {


                nianText: '防水做好啦！闭水试验也通过了，这下再也不用担心漏水了~ 接下来泥瓦工进场贴瓷砖，您知道贴砖有哪些讲究吗？',


                nextHint: '下一步：泥瓦工程+瓷砖成品保护'


            }


        },


        {


            id: 'F-12', stageIndex: 2, stepIndex: 1,


            title: '泥瓦工程+瓷砖成品保护',


            description: '回填、找平、贴砖，检查空鼓率、排水坡度，瓷砖完工后铺设保护膜。',


            nianTip: '泥瓦工程可是面子工程呢，瓷砖贴得好不好一眼就能看出来。空鼓率不能超过5%，卫生间排水要顺畅，还要墙压地工艺哦。贴完砖一定要铺保护膜，不然后面施工刮花了可心疼了，您说对吗？',


            aiTrigger: false,


            aiType: null,


            aiTools: [


                {


                    "id": "niwa-zhuanxiang",


                    "icon": "🔍",


                    "name": "泥瓦专项检查",


                    "type": "inspection",


                    "subtype": "niwa-zhuanxiang"


                },


                {


                    "id": "zengxiang-cankao",


                    "icon": "💰",


                    "name": "增项参考",


                    "type": "addon",


                    "subtype": "zengxiang-cankao"


                },


                {


                    "id": "material-inspection-tile",


                    "icon": "📦",


                    "name": "材料进场验收",


                    "type": "materialInspection",


                    "subtype": "tile",


                    "description": "智能材料验收助手（示例效果）"


                }


            ],


materials: [


                { name: '泥瓦辅材', qty: '1批', price: '3千-8千', brands: ['海螺水泥', '本地河沙'], tips: '水泥、沙子、瓷砖胶等', category: '基础材料' },


                { name: '瓷砖', qty: '按需㎡', price: '80-300元/㎡', brands: ['东鹏', '马可波罗', '诺贝尔'], tips: '多买5-10%备用，避免补货有色差', category: '瓷砖' }


            ],


            materialCategory: '瓷砖/瓦工',


            riskWarning: '贴砖厚度影响定制柜尺寸',


            guide: {


                text: '泥瓦工程决定了空间的基础质感。贴砖前先排砖，避免小条砖；注意空鼓率≤5%；卫生间坡度要找好，倒水快速流走；建议墙压地工艺，更美观防水。瓷砖完工后一定要铺设保护膜，防止后续施工刮花。',


                notes: [


                    '贴砖前让师傅出排版图，尽量避免小于1/3的小条砖',


                    '空鼓率≤5%，单块砖边角空鼓不超过该砖面积的15%',


                    '卫生间地面坡度1-2%，地漏处最低，倒水测试排水速度',


                    '墙压地工艺：墙砖压地砖，更美观且防水效果更好',


                    '贴砖厚度要控制好，不然会影响定制柜的尺寸',


                    '瓷砖完工后马上铺保护膜，保护砖面不被刮花'


                ],


                checklist: [


                    '空鼓率≤5%',


                    '排水顺畅，坡度合理',


                    '墙压地工艺规范',


                    '瓷砖表面无破损、无色差',


                    '瓷砖完工已铺设保护膜'


                ]


            },


            completionFeedback: {


                nianText: '泥瓦工程完工啦！瓷砖贴得漂漂亮亮的，真好看~ 接下来明露区域可以做美缝了，不过要等砖缝干透才行哦！',


                nextHint: '下一步：美缝施工（明露区域），让瓷砖更美观'


            }


        },


        {


            id: 'F-13', stageIndex: 2, stepIndex: 2,


            title: '美缝施工（明露区域）',


            description: '全屋明露区域瓷砖美缝，泥瓦完工7-15天后砖缝干透再做。',


            nianTip: '美缝做得好，颜值提升一大截呢~ 不过要等泥瓦完工7-15天，砖缝干透了再做哦，不然容易起泡脱落。柜体贴墙的地方后面补缝就行，现在先把明露区域一次做完，您觉得呢？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "meifeng-baojia",


                    "icon": "💰",


                    "name": "美缝报价",


                    "type": "addon",


                    "subtype": "meifeng-baojia"


                }


            ],


materials: [


                { name: '美缝剂', qty: '15-25支', price: '30-100元/支', brands: ['德高', '皇氏工匠', '卓高'], tips: '选防霉型，卫生间厨房更耐用', category: '瓷砖' }


            ],


            materialCategory: '瓷砖/美缝',


            riskWarning: '美缝工具需伸入空间，柜体贴墙区域后续补缝',


            guide: {


                text: '美缝不仅美观，还能防霉防黑，让瓷砖更好打扫。注意要等泥瓦完工7-15天，砖缝完全干透了再做，不然美缝剂容易起泡脱落。明露区域一次做完，柜体贴墙的地方等定制柜安装完再补缝。',


                notes: [


                    '泥瓦完工7-15天后，砖缝干透再做美缝',


                    '美缝前要把缝清理干净，灰尘和杂物会影响粘结力',


                    '选防霉型美缝剂，卫生间厨房更耐用',


                    '明露区域一次完成，效果更整体',


                    '柜体贴墙区域先不做，等柜子装好后再补缝',


                    '美缝做完后要等完全固化再踩踏，一般24小时'


                ],


                checklist: [


                    '砖缝已干透（泥瓦完工7-15天）',


                    '明露区域美缝一次完成',


                    '美缝表面平整光滑，无气泡',


                    '颜色均匀，与瓷砖搭配协调',


                    '柜体贴墙区域预留后期补缝'


                ]


            },


            completionFeedback: {


                nianText: '美缝做好啦！瓷砖一下子就高级了，真好看~ 接下来泥瓦完工尺寸就固定了，可以约定制商家精准复尺下单了，这可是定制最关键的节点哦！',


                nextHint: '下一步：定制柜精准复尺+下单，零误差才能装得好'


            }


        },


        {


            id: 'F-14', stageIndex: 2, stepIndex: 3,


            title: '定制柜精准复尺+下单',


            description: '泥瓦完工后，定制商家复尺零误差，确认花色、五金、结构，正式下单生产。',


            nianTip: '复尺这一步可是定制最关键的节点哦，差个几毫米可能就装不上了呢。花色、五金、结构都要全部确认好，生产周期也要书面约定，板式一般30-45天。您都确认清楚了吗？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "dingzhi-fuchi",


                    "icon": "💬",


                    "name": "定制复尺话术",


                    "type": "communication",


                    "subtype": "dingzhi-fuchi"


                }


            ],


materials: [


                { name: '定制柜复尺下单', qty: '1次', price: '定金30-50%', brands: ['索菲亚', '欧派', '本地定制'], tips: '支付定金，正式下单生产', category: '定制' }


            ],


            materialCategory: '定制',


            riskWarning: '复尺出错导致安装不上，这是定制最关键节点',


            guide: {


                text: '泥瓦完工后墙面地面尺寸就固定了，这时候定制商家上门精准复尺，这是定制最关键的一步，复尺出错直接导致安装不上。复尺后要确认花色、五金、结构全部无误，然后正式下单生产，生产周期书面约定（板式30-45天）。',


                notes: [


                    '泥瓦完工、墙面地面尺寸固定后再复尺，确保零误差',


                    '复尺时最好业主在场，现场核对关键尺寸',


                    '花色、五金、内部结构全部确认，签确认单后再下单',


                    '生产周期书面约定：板式30-45天，实木可能更长',


                    '确认交货时间和安装时间，和装修进度衔接好',


                    '支付定金，保留好订单和收据'


                ],


                checklist: [


                    '墙面地面尺寸已固定，泥瓦完工',


                    '定制商家已复尺，零误差',


                    '花色已确认',


                    '五金已确认',


                    '结构已确认',


                    '生产周期已书面约定',


                    '已支付定金并保留订单'


                ]


            },


            completionFeedback: {


                nianText: '复尺完成，正式下单啦！接下来就等生产了~ 这期间木工也可以进场做吊顶和背景墙基层，两不耽误呢！',


                nextHint: '下一步：木工工程，吊顶造型搞起来'


            }


        },


        {


            id: 'F-15', stageIndex: 2, stepIndex: 4,


            title: '木工工程',


            description: '吊顶、背景墙基层、窗帘盒预埋，龙骨牢固，转角整板，防裂工艺。',


            nianTip: '木工进场啦，吊顶和造型都要做起来了~ 龙骨一定要牢固，转角要用整板，防止后期开裂。还有窗帘盒要记得预埋，电动窗帘的话电源和86盒也要留好哦，您都记下来了吗？',


            aiTrigger: false,


            aiType: null,


                        aiTools: [


                {


                    "id": "mugong-zhuanxiang",


                    "icon": "🔍",


                    "name": "木工专项检查",


                    "type": "inspection",


                    "subtype": "mugong-zhuanxiang"


                },


                {


                    "id": "zengxiang-cankao",


                    "icon": "💰",


                    "name": "增项参考",


                    "type": "addon",


                    "subtype": "zengxiang-cankao"


                }


            ],


materials: [


                { name: '木工辅材', qty: '1批', price: '5千-1.5万', brands: ['可耐福', '龙牌', '泰山'], tips: '龙骨、石膏板、板材等', category: '木工材料' }


            ],


            materialCategory: '木工材料',


            riskWarning: '定制柜和吊顶衔接尺寸提前沟通',


            guide: {


                text: '木工主要做吊顶、背景墙基层、窗帘盒这些。龙骨要牢固，间距符合规范；石膏板吊顶转角要用整板套割L型，防止后期开裂；窗帘盒要预埋，电动窗帘还要留电源和86盒。定制柜和吊顶衔接的尺寸要提前和定制商家沟通。',


                notes: [


                    '吊顶龙骨：主龙骨间距不大于80cm，副龙骨不大于40cm',


                    '石膏板转角整板套割L型，避免后期开裂',


                    '板缝倒V型槽，嵌缝膏补平后贴绷带防裂',


                    '窗帘盒预埋，尺寸要够（手动≥15cm，电动≥20cm）',


                    '电动窗帘预留电源和86盒，位置在窗帘盒旁边',


                    '定制柜和吊顶衔接的尺寸，提前和定制商家沟通确认'


                ],


                checklist: [


                    '龙骨安装牢固，间距规范',


                    '转角整板套割，防裂工艺到位',


                    '窗帘盒已预埋',


                    '电动窗帘电源+86盒已预留（如需要）',


                    '定制柜和吊顶衔接尺寸已沟通'


                ]


            },


            completionFeedback: {


                nianText: '木工完工啦！吊顶和造型都有模有样了，真不错~ 接下来油工进场刷墙，墙面颜值全靠这一步了哦！',


                nextHint: '下一步：油漆工程，墙面滑溜溜'


            }


        },


        {


            id: 'F-16', stageIndex: 2, stepIndex: 5,


            title: '油漆工程',


            description: '挂网、批腻子、刷乳胶漆，平整度≤2mm，一底两面无流挂。',


            nianTip: '油漆工程可是面子工程呢，墙面平不平、颜色匀不匀一眼就能看出来。平整度要≤2mm，一底两面不能少。阴雨天可别刷漆哦，还有油漆没干透不能装定制柜，不然容易受潮，您说对吗？',


            aiTrigger: false,


            aiType: null,


                        aiTools: [


                {


                    "id": "youqi-zhuanxiang",


                    "icon": "🔍",


                    "name": "油漆专项检查",


                    "type": "inspection",


                    "subtype": "youqi-zhuanxiang"


                },


                {


                    "id": "zengxiang-cankao",


                    "icon": "💰",


                    "name": "增项参考",


                    "type": "addon",


                    "subtype": "zengxiang-cankao"


                }


            ],


materials: [


                { name: '油漆辅材', qty: '1批', price: '3千-8千', brands: ['美巢', '立邦', '多乐士'], tips: '腻子、乳胶漆、阴阳角条等', category: '油漆材料' }


            ],


            materialCategory: '油漆材料',


            riskWarning: '阴雨天禁止刷漆；油漆未干透不能装定制柜',


            guide: {


                text: '油漆是面子工程，决定了墙面的最终效果。腻子刮2-3遍，每遍干透了再刮下一遍；打磨要平整，平整度≤2mm；底漆必须刷，面漆刷两遍，一底两面。阴雨天不要刷漆，湿度太大影响质量。油漆没干透不能装定制柜，不然容易受潮发霉。',


                notes: [


                    '新旧墙体、开槽处要挂网，防止后期开裂',


                    '腻子刮2-3遍，每遍都要等干透了再刮下一遍',


                    '打磨用320目以上砂纸，平整度≤2mm/2m靠尺',


                    '底漆必须刷：封闭基层、节省面漆、防止返碱',


                    '面漆刷两遍，一底两面，无流挂、无色差',


                    '阴雨天禁止刷漆，湿度太大',


                    '油漆完全干透后再装定制柜，防止受潮'


                ],


                checklist: [


                    '挂网防裂处理到位',


                    '平整度≤2mm',


                    '一底两面，涂刷均匀无流挂',


                    '色温统一，无色差开裂',


                    '阴雨天未施工'


                ]


            },


            completionFeedback: {


                nianText: '油漆完工啦！墙面滑溜溜的，颜色也好好看~ 接下来泥瓦、木工、油漆都做完了，就要中期验收付中期款了哦！',


                nextHint: '下一步：中期验收+付中期款，验收合格再付款'


            }


        },


        {


            id: 'F-17', stageIndex: 2, stepIndex: 6,


            title: '中期验收+付中期款',


            description: '泥瓦+木工+油漆全部完工后验收，检查全部硬装质量，确认增项签字，支付中期款。',


            nianTip: '中期验收很重要的，泥瓦、木工、油漆都要仔细检查一遍。有问题及时整改，整改好了再付中期款，以验收换付款，您说对吗？所有增项也要确认签字，不然后期结算扯皮就麻烦了~',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "zhongqi-baguan",


                    "icon": "💰",


                    "name": "中期验收把关",


                    "type": "addon",


                    "subtype": "zhongqi-baguan"


                },


                {


                    "id": "zhongqi-kuan",


                    "icon": "💳",


                    "name": "中期款计算",


                    "type": "payment",


                    "subtype": "zhongqi-kuan"


                }


            ],


materials: [


                { name: '中期款', qty: '1次', price: '按合同约定', brands: ['装修公司'], tips: '验收合格后再支付', category: '工程款' }


            ],


            materialCategory: '工程款',


            riskWarning: '以验收换付款，确认合格后再付',


            guide: {


                text: '中期验收是硬装完工后的重要节点，泥瓦、木工、油漆全部完工后进行。要逐项检查施工质量，有问题记录下来要求整改。所有增项必须全部签字确认，避免后期结算纠纷。验收合格后再支付中期款，记住：以验收换付款。',


                notes: [


                    '验收内容：泥瓦工程、木工工程、油漆工程全部项目',


                    '逐项检查，有问题书面记录，限期整改',


                    '所有增项必须全部签字确认，包括价格和工程量',


                    '核对实际完成工程量与报价是否一致',


                    '验收合格后再支付中期款，不要提前付',


                    '保留好验收记录和付款凭证'


                ],


                checklist: [


                    '泥瓦工程全部合格',


                    '木工工程全部合格',


                    '油漆工程全部合格',


                    '无违规增项',


                    '所有增项已签字确认',


                    '验收合格后已支付中期款'


                ]


            },


            completionFeedback: {


                nianText: '中期验收通过啦！硬装基本搞定，太棒了~ 接下来进入安装阶段，首先是集成吊顶和厨卫电器，家的样子越来越清晰了哦！',


                nextHint: '下一步：集成吊顶+厨卫电器安装'


            }


        },


        {


            id: 'F-18', stageIndex: 3, stepIndex: 0,


            title: '集成吊顶+厨卫电器安装',


            description: '安装厨房卫生间吊顶、浴霸、排气扇等，吊顶平整，电器功能正常，高度与橱柜匹配。',


            nianTip: '安装阶段开始啦，先装集成吊顶~ 吊顶要平整，电器功能要试一下。还有吊顶高度要和橱柜匹配哦，不然后期橱柜装上去缝隙太大就不好看了，您说对吗？',


            aiTrigger: false,


            aiType: null,


            materials: [


                { name: '集成吊顶', qty: '按需㎡', price: '100-300元/㎡', brands: ['友邦', '奥普', '法狮龙'], tips: '铝扣板吊顶，防潮易清洁', category: '吊顶' },


                { name: '浴霸/排气扇', qty: '1-2台', price: '500-2000元/台', brands: ['奥普', '松下', '欧普'], tips: '风暖型更舒适安全', category: '厨卫电器' }


            ],


            materialCategory: '吊顶/厨卫电器',


            riskWarning: '—',


            guide: {


                text: '集成吊顶安装要注意平整度，缝隙均匀。浴霸、排气扇等电器要安装牢固，功能测试正常。吊顶高度要和橱柜高度匹配，衔接自然。卫生间吊顶要预留检修口，方便后期维修。',


                notes: [


                    '吊顶安装平整，缝隙均匀，扣板无划痕变形',


                    '电器安装牢固，功能测试正常（取暖、照明、换气）',


                    '吊顶高度与橱柜高度匹配，衔接自然',


                    '卫生间预留检修口，方便后期维修',


                    '浴霸要装在淋浴区外面，避免直接对着人吹',


                    '排气扇管道要接到室外，不能只排在吊顶里'


                ],


                checklist: [


                    '吊顶安装平整',


                    '电器功能正常',


                    '吊顶高度与橱柜匹配',


                    '已预留检修口',


                    '排气管道已接至室外'


                ]


            },


            completionFeedback: {


                nianText: '吊顶和厨卫电器装好了~ 接下来装室内门和踢脚线，记得先装门后装定制柜哦，这样收口更好看！',


                nextHint: '下一步：室内门+踢脚线安装'


            }


        },


        {


            id: 'F-19', stageIndex: 3, stepIndex: 1,


            title: '室内门+踢脚线安装',


            description: '安装木门、门套、踢脚线，开合顺畅，缝隙均匀，先装门后装定制柜。',


            nianTip: '装门啦，家的感觉越来越浓了~ 门要开合顺畅，缝隙均匀才好看。还有哦，要先装门再装定制柜，这样门套和柜子的收口更自然美观，您记住这个顺序了吗？',


            aiTrigger: false,


            aiType: null,


            materials: [


                { name: '木门+门套', qty: '3-5樘', price: '1000-5000元/樘', brands: ['TATA', '欧派', '本地木门'], tips: '选实木复合的，性价比高', category: '门窗' },


                { name: '踢脚线', qty: '按需米', price: '15-50元/米', brands: ['同地板品牌', '木门同品牌'], tips: '选和地板或门同色系', category: '辅材' }


            ],


            materialCategory: '门窗/辅材',


            riskWarning: '定制柜要和门套收口',


            guide: {


                text: '室内门安装要注意垂直度，开合顺畅，缝隙均匀。门套要垂直，打胶均匀美观。踢脚线安装要平整，接缝严密。安装顺序很重要：先装门，后装定制柜，这样门套和柜子的收口更自然。',


                notes: [


                    '木门安装垂直，开合顺畅，无卡顿异响',


                    '门缝均匀，符合标准（2-3mm）',


                    '门套打胶均匀美观，无毛刺',


                    '踢脚线安装平整，接缝严密，阴阳角处理到位',


                    '安装顺序：先装门，后装定制柜，收口更自然',


                    '定制柜和门套衔接的地方，提前和定制商家沟通尺寸'


                ],


                checklist: [


                    '木门开合顺畅',


                    '缝隙均匀',


                    '门套安装垂直美观',


                    '踢脚线安装平整',


                    '先装门后装定制柜的顺序已确认'


                ]


            },


            completionFeedback: {


                nianText: '门和踢脚线都装好了，真好看~ 接下来就是全屋定制柜安装了，这可是收纳的重头戏，您期待吗？',


                nextHint: '下一步：全屋定制柜安装，收纳大升级'


            }


        },


        {


            id: 'F-20', stageIndex: 3, stepIndex: 2,


            title: '全屋定制柜安装',


            description: '定制柜送货安装、收口，核对板材/五金/花色与约定一致，安装牢固，柜体外露区域美缝修补。',


            nianTip: '定制柜终于到货安装啦，想想就激动~ 安装前先核对一下板材、五金、花色是不是和约定的一样，别送错了哦。安装时要保护好墙面地面，有磕碰当场修。柜体外露的地方还要补一下美缝，您说对吗？',


            aiTrigger: true,


            aiType: 'inspection',


                        aiTools: [


                {


                    "id": "dingzhi-heyan",


                    "icon": "🔍",


                    "name": "定制柜核验",


                    "type": "inspection",


                    "subtype": "dingzhi-heyan"


                }


            ],


materials: [


                { name: '定制柜送货安装', qty: '全屋', price: '按订单', brands: ['索菲亚', '欧派', '本地定制'], tips: '送货上门并安装', category: '定制' }


            ],


            materialCategory: '定制',


            riskWarning: '安装时保护墙面地面，磕碰当场修',


            guide: {


                text: '定制柜安装是大日子，安装前先验货：板材、五金、花色是不是和约定的一致。安装时注意保护墙面和地面，有磕碰当场修补。安装完要检查牢固度、门缝均匀、抽屉顺畅、收口美观。柜体外露区域的瓷砖美缝要补一下。',


                notes: [


                    '送货时先验货：板材品牌、花色、五金品牌与订单一致',


                    '安装前做好成品保护，避免磕碰墙面地面',


                    '安装牢固，柜体水平垂直，无晃动',


                    '柜门缝隙均匀，开合顺畅，阻尼有效',


                    '抽屉推拉顺滑，承重没问题',


                    '收口美观，缝隙均匀',


                    '柜体外露区域的瓷砖美缝要修补',


                    '有磕碰当场修补，别等安装完再说'


                ],


                checklist: [


                    '板材/五金/花色与约定一致',


                    '安装牢固',


                    '收口美观',


                    '柜门缝隙均匀，开合顺畅',


                    '抽屉推拉顺滑',


                    '柜体外露区域美缝已修补',


                    '墙面地面无磕碰损坏'


                ]


            },


            completionFeedback: {


                nianText: '定制柜装好啦！收纳空间一下子就有了，太棒了~ 接下来装木地板、卫浴和灯具，家马上就要成型了哦！',


                nextHint: '下一步：木地板+卫浴+灯具安装'


            }


        },


        {


            id: 'F-21', stageIndex: 3, stepIndex: 3,


            title: '木地板+卫浴+灯具安装',


            description: '依次安装地板、卫浴、灯具、五金，进场核对型号，安装功能正常。',


            nianTip: '安装进入收尾阶段啦~ 木地板要最后装，防止前面施工磕碰坏。进场的时候都核对一下型号，别送错了。安装完都试一下功能，确保正常使用，您说对吗？',


            aiTrigger: false,


            aiType: null,


            materials: [


                { name: '全包主材', qty: '1批', price: '按合同', brands: ['按合同约定'], tips: '地板、卫浴、灯具、五金等', category: '主材' }


            ],


            materialCategory: '全包主材',


            riskWarning: '木地板最后装防磕碰',


            guide: {


                text: '这一步安装项目比较多：木地板、卫浴洁具、灯具、五金挂件。注意木地板要最后装，防止前面施工磕碰损坏。所有材料进场时都核对一下型号和数量，安装完都测试一下功能是否正常。',


                notes: [


                    '木地板最后安装，防止磕碰损坏',


                    '地板安装前检查地面平整度，误差≤2mm',


                    '地板提前进场适应温湿度，铺的时候留伸缩缝',


                    '卫浴洁具进场核对型号，安装后测试冲水、排水、密封',


                    '灯具进场核对型号，安装后试亮，开关控制正确',


                    '五金挂件安装牢固，位置合理',


                    '所有安装项目完成后逐一测试功能'


                ],


                checklist: [


                    '进场已核对型号',


                    '木地板安装完成无空响',


                    '卫浴安装完成功能正常',


                    '灯具安装完成全部点亮',


                    '五金挂件安装牢固',


                    '木地板最后安装，无磕碰'


                ]


            },


            completionFeedback: {


                nianText: '地板、卫浴、灯具都装好了，家的样子完完整整啦！接下来做一下细节修补和开荒保洁，马上就能验收了哦~',


                nextHint: '下一步：细节修补+开荒保洁，干干净净'


            }


        },


        {


            id: 'F-22', stageIndex: 4, stepIndex: 0,


            title: '细节修补+开荒保洁',


            description: '修补施工中的磕碰瑕疵，全屋开荒清洁，确保修补无色差，全屋无残留。',


            nianTip: '装修嘛，难免有一些小磕碰小瑕疵，最后统一修补一下就完美了~ 开荒保洁建议找专业团队，效率高效果好。保洁完您再仔细检查一遍，确保干干净净的，您觉得呢？',


            aiTrigger: false,


            aiType: null,


            materials: [


                { name: '修补材料', qty: '1批', price: '少量', brands: ['同装修材料'], tips: '补漆、补缝材料等', category: '辅材' },


                { name: '开荒保洁服务', qty: '1次', price: '8-15元/㎡', brands: ['专业保洁公司'], tips: '按建筑面积算', category: '服务' }


            ],


            materialCategory: '保洁/修补',


            riskWarning: '—',


            guide: {


                text: '装修过程中难免有一些小磕碰、小瑕疵，最后统一修补一下。然后就是开荒保洁，这是入住前最彻底的一次清洁，建议找专业团队，工具齐全效率高。保洁完自己再检查一遍，特别是边角和柜子里面。',


                notes: [


                    '先做细节修补：墙面磕碰、瓷砖崩边、五金划痕等',


                    '修补要注意无色差，尽量和原色一致',


                    '开荒保洁重点：玻璃、瓷砖缝隙、柜子内外、窗台门缝、五金件',


                    '别让保洁用钢丝球擦瓷砖和玻璃，会留划痕',


                    '保洁完自己再检查一遍，特别是边角和柜子顶上',


                    '保洁后注意开窗通风'


                ],


                checklist: [


                    '细节修补完成，无色差',


                    '玻璃门窗清洁透亮无水印',


                    '地面墙面无残留污渍',


                    '柜子内外全部擦拭干净',


                    '五金件清洁光亮',


                    '全屋无装修残留'


                ]


            },


            completionFeedback: {


                nianText: '修补好了，也打扫干净啦！家变得亮堂堂的，真舒服~ 接下来就是竣工验收了，您准备好了吗？',


                nextHint: '下一步：竣工验收+结算+质保启动'


            }


        },


        {


            id: 'F-23', stageIndex: 4, stepIndex: 1,


            title: '竣工验收+结算+质保启动',


            description: '三方联合验收，结算尾款，交付竣工图和质保卡，定制柜单独索要质保凭证。',


            nianTip: '终于到竣工验收啦，恭喜恭喜！所有项目都要检查一遍，功能都试一下。有孕妇和宝宝的家庭，一定要做CMA空气质量检测哦，安全第一。还有水电防水质保≥5年，基础工程≥2年，这是法规底线呢，您都了解了吗？',


            aiTrigger: true,


            aiType: 'inspection',


            aiTools: [


                {


                    "id": "jungong-jiesuan-new",


                    "icon": "📋",


                    "name": "竣工结算对账",


                    "type": "finalSettlement",


                    "subtype": "default",


                    "description": "智能结算对账助手（示例效果）"


                },


                {


                    "id": "air-quality",


                    "icon": "🌬️",


                    "name": "空气质量评估",


                    "type": "airQuality",


                    "subtype": "default",


                    "description": "AI室内空气质量评估"


                },


                {


                    "id": "zhibao-liucun",


                    "icon": "🛡️",


                    "name": "质保留存",


                    "type": "addon",


                    "subtype": "zhibao-liucun"


                }


            ],


materials: [


                { name: '尾款', qty: '1次', price: '按合同约定', brands: ['装修公司'], tips: '验收合格后支付', category: '工程款' }


            ],


            materialCategory: '工程款',


            riskWarning: '水电防水≥5年，基础≥2年（法规底线）',


            guide: {


                text: '竣工验收是最后一关，三方（业主、装修公司、监理）联合验收。所有项目都要检查，所有功能都要测试。有问题的地方记录下来，整改完再签字。结算尾款前核对所有增减项。交付竣工图、质保卡，定制柜要单独索要质保凭证。有孕妇/婴幼儿的家庭，建议做CMA空气质量检测。',


                notes: [


                    '三方联合验收：业主、装修公司、监理',


                    '所有项目完工，功能正常，逐一测试',


                    '有问题书面记录，限期整改，整改完复验',


                    '结算前核对所有增减项，确认总金额',


                    '交付竣工图、质保卡、使用说明',


                    '定制柜单独索要质保凭证',


                    '质保期：水电防水≥5年，基础工程≥2年（法规底线）',


                    '有孕妇/婴幼儿必做CMA空气质量检测',


                    '验收合格、交接完成后再付尾款'


                ],


                checklist: [


                    '所有项目完工',


                    '功能全部正常',


                    '空气质量CMA检测（有孕妇/婴幼儿必做）',


                    '已交付竣工图',


                    '已交付质保卡',


                    '定制柜质保凭证已单独索要',


                    '结算完成，尾款已支付',


                    '质保已启动'


                ]


            },


            completionFeedback: {


                nianText: '恭喜您！竣工验收通过啦，装修圆满完成！从小管家陪着您一步步走过来，真的超有成就感~ 祝您在新家里开启美好生活，每天都开开心心的！以后有任何问题都可以来找我哦~',


                nextHint: '装修完成！开启你的美好生活吧~'


            }


        }


        ],


        half: [


        {


            "id": "H-1",


            "stageIndex": 0,


            "stepIndex": 0,


            "title": "筛选施工方+初步沟通",


            "description": "对比3家施工方，考察工地，明确半包范围，初步确认辅材品牌。",


            "nianTip": "半包模式选施工方可是头等大事呢~ 建议您至少对比3家，实地看看他们做的工地，不光看完工的，也要看在建的，施工工艺和现场管理水平一目了然哦~",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "需求清单",


                    "qty": "1份",


                    "price": "免费",


                    "brands": [


                        "自行整理"


                    ],


                    "tips": "列出家庭成员生活习惯和功能需求",


                    "category": "资料清单"


                },


                {


                    "name": "户型图",


                    "qty": "1份",


                    "price": "免费",


                    "brands": [


                        "开发商提供"


                    ],


                    "tips": "最好有原始结构图和承重墙图纸",


                    "category": "资料清单"


                }


            ],


            "materialCategory": "资料清单",


            "riskWarning": "施工方不主动留家电尺寸，必须自己提",


            "guide": {


                "text": "半包模式下，施工方只负责施工和辅材，主材由您自己采购。选施工方的时候，不仅要看报价，更要看工地质量、工人手艺和口碑。半包最考验施工方的管理水平，一定要多对比几家。",


                "notes": [


                    "建议至少对比3家施工方，不要只看价格",


                    "实地考察在建工地，看施工工艺和现场管理",


                    "明确半包包含的辅材品牌和规格，写进合同",


                    "主动提出家电和定制柜的尺寸要求，让施工方配合",


                    "了解施工方的增项规则和付款方式"


                ],


                "checklist": [


                    "已对比3家以上施工方",


                    "已考察在建工地和完工工地",


                    "已明确半包范围和辅材品牌",


                    "已准备好需求清单和户型图",


                    "已初步沟通家电尺寸预留要求"


                ]


            },


            "completionFeedback": {


                "nianText": "施工方筛选完成啦，这第一步走得很稳~ 接下来就要量房出方案和报价了，您准备好了吗？",


                "nextHint": "下一步：量房+方案+报价审核，仔细核对别漏项"


            }


        },


        {


            "id": "H-2",


            "stageIndex": 0,


            "stepIndex": 1,


            "title": "量房+方案+报价审核",


            "description": "施工方量房，出施工方案与报价，审核报价有无漏项，确认工艺和辅材标准。",


            "nianTip": "量房和报价审核这一步可关键了，漏项可是后期增项的重灾区呢~ 您要仔细核对每一项，特别是辅材的品牌和规格，还有定制柜和家电对应的水电位有没有预留哦~",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "户型图",


                    "qty": "1份",


                    "price": "免费",


                    "brands": [


                        "开发商提供"


                    ],


                    "tips": "原始结构图",


                    "category": "资料清单"


                },


                {


                    "name": "承重墙图纸",


                    "qty": "1份",


                    "price": "免费",


                    "brands": [


                        "开发商/物业"


                    ],


                    "tips": "确认哪些墙绝对不能动",


                    "category": "资料清单"


                }


            ],


            "materialCategory": "资料清单",


            "riskWarning": "",


            "guide": {


                "text": "施工方量房后会出施工方案和报价，这时候要仔细审核。报价要逐项核对，注意有没有漏项、少报面积、低报单价。辅材的品牌和规格要明确，最好写进合同。还要预留好定制柜和家电对应的水电位。",


                "notes": [


                    "量房数据要准确，特别是梁柱、管井、门窗位置",


                    "报价审核要逐项核对，注意漏项和少报数量",


                    "辅材品牌、型号、规格要明确，不能只写\"品牌材料\"",


                    "预留定制柜和嵌入式家电的水电位",


                    "施工工艺要明确，比如水电走顶还是走地"


                ],


                "checklist": [


                    "施工方已上门量房",


                    "已获取施工方案和报价",


                    "报价无明显漏项，工艺辅材已明确",


                    "已预留定制柜/家电对应水电位",


                    "承重墙图纸已确认"


                ]


            },


            "completionFeedback": {


                "nianText": "量房和报价都审核完啦，做得真仔细~ 接下来要定设计方案和锁定家电了，这可是半包最容易漏的环节哦！",


                "nextHint": "下一步：定设计方案+锁定家电+初选定制定制商家"


            }


        },


        {


            "id": "H-3",


            "stageIndex": 0,


            "stepIndex": 2,


            "title": "定设计方案+锁定家电+初选定制定制商家",


            "description": "确定平面方案，锁定嵌入式家电型号，初选定制商家，确认水电点位图。",


            "nianTip": "这一步可是半包最容易漏的环节呢！很多人以为半包就不用管家电和定制了，其实恰恰相反，水电点位全靠您自己把关。嵌入式家电一定要早点锁定型号，把尺寸给施工方，不然后期留错位返工成本可高了~",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "嵌入式家电型号",


                    "qty": "若干",


                    "price": "待定",


                    "brands": [


                        "海尔",


                        "西门子",


                        "美的"


                    ],


                    "tips": "先锁定型号拿尺寸，无需付款，后期再买",


                    "category": "家电"


                },


                {


                    "name": "定制商家初步对接",


                    "qty": "2-3家",


                    "price": "免费",


                    "brands": [


                        "索菲亚",


                        "欧派",


                        "本地定制"


                    ],


                    "tips": "对比方案和报价，初选商家",


                    "category": "定制"


                }


            ],


            "materialCategory": "家电/定制",


            "riskWarning": "这是半包最容易漏的环节",


            "guide": {


                "text": "半包模式下，设计方案、家电、定制柜都要您自己操心。平面方案确定后，一定要先锁定嵌入式家电的型号，把尺寸给施工方，这样水电位才能留准。同时初选2-3家定制商家，初步确认定制柜的位置和功能，水电点位图要结合家电尺寸一起确认。智能家居的预埋要求也要提前考虑。",


                "notes": [


                    "嵌入式家电（冰箱、洗碗机、蒸烤箱等）先锁定型号拿尺寸",


                    "定制柜位置和功能分区要初步确认",


                    "水电点位图要结合家电尺寸和定制柜位置一起确认",


                    "智能家居预埋要求要提前规划好",


                    "可以约2-3家定制商家同时对比方案和报价"


                ],


                "checklist": [


                    "平面设计方案已确定",


                    "嵌入式家电全部锁定型号，尺寸已提供",


                    "定制柜位置和功能已确认",


                    "水电点位图结合家电尺寸已确认",


                    "智能家居预埋要求已确认",


                    "已初选2-3家定制商家"


                ]


            },


            "completionFeedback": {


                "nianText": "设计方案定好了，家电也锁定了，定制商家也初选了，这一步做得太到位了~ 接下来就要签半包合同了，您知道签合同要注意哪些坑吗？",


                "nextHint": "下一步：签半包合同+付首期款，AI帮您把关"


            }


        },


        {


            "id": "H-4",


            "stageIndex": 0,


            "stepIndex": 3,


            "title": "签半包合同+付首期款",


            "description": "签订半包施工合同，支付首期款，明确辅材标准、工期、增项规则等权责。",


            "nianTip": "签合同这一步可要睁大眼睛哦~ 半包合同和全包不一样，很多主材是您自己买的，要分清楚哪些是施工方负责，哪些是您负责。还有辅材标准、工期、增项规则都要写清楚，不然后期扯皮就麻烦了~",


            "aiTrigger": true,


            "aiType": "contract",


            "materials": [


                {


                    "name": "首期款",


                    "qty": "30%",


                    "price": "总工程款×30%",


                    "brands": [


                        "施工方"


                    ],


                    "tips": "建议不超过30%，降低风险",


                    "category": "工程款"


                }


            ],


            "materialCategory": "工程款",


            "riskWarning": "定制/家电费用不在半包合同内",


            "guide": {


                "text": "半包合同要明确双方的权责划分：施工方负责什么、业主负责什么。辅材的品牌、型号、规格要写清楚，最好附材料清单。工期要明确起止日期，延误赔偿要合理。增项规则要明确，必须先签字确认报价再施工。定制柜和家电的费用不在半包合同内，要注意区分。",


                "notes": [


                    "明确半包范围：施工方负责什么、业主负责什么",


                    "辅材标准要详细：品牌、型号、规格、等级",


                    "工期明确起止日期，延误赔偿比例要合理",


                    "增项规则：先签字确认报价，再施工，否则可拒付",


                    "付款节点和比例要合理，首期款建议不超过30%",


                    "质保期：水电防水≥5年，基础工程≥2年"


                ],


                "checklist": [


                    "已仔细阅读合同全部条款",


                    "半包范围和权责划分已明确",


                    "辅材标准、工期、增项规则已明确",


                    "付款节点和比例已确认（首期≤30%）",


                    "质保期已明确（水电防水≥5年）",


                    "合同附件齐全并盖骑缝章"


                ]


            },


            "completionFeedback": {


                "nianText": "合同签好啦！首期款也付了，半包装修正式启动啦~ 接下来要办物业手续和交底，这一步可不能马虎哦！",


                "nextHint": "下一步：物业手续+交底+辅材验收"


            }


        },


        {


            "id": "H-5",


            "stageIndex": 1,


            "stepIndex": 0,


            "title": "物业手续+交底+辅材验收",


            "description": "办理施工许可证，进行交底，确认家电/定制/智能水电点位，验收首批辅材。",


            "nianTip": "开工前先把物业手续办了，别到时候被投诉停工哦~ 交底的时候您一定要到场，家电、定制柜、智能家居对应的水电点位都要当面确认清楚，辅材进场也要验收一下，看看是不是合同约定的品牌型号，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "施工图纸",


                    "qty": "全套",


                    "price": "免费",


                    "brands": [


                        "施工方"


                    ],


                    "tips": "包括平面、水电等图纸",


                    "category": "资料清单"


                },


                {


                    "name": "首批辅材",


                    "qty": "1批",


                    "price": "待定",


                    "brands": [


                        "按合同约定"


                    ],


                    "tips": "水泥、沙子、电线、水管等",


                    "category": "辅材"


                }


            ],


            "materialCategory": "资料/辅材",


            "riskWarning": "交底不确认后期做错扯皮",


            "guide": {


                "text": "开工前先去物业办施工许可证，交装修押金。然后交底：业主、施工负责人、工长一起到现场，把施工内容、注意事项、水电点位都过一遍。家电、定制柜、智能设备对应的水电点位一定要当场复核确认，最好书面记录签字。首批辅材进场时要验收，核对品牌型号是否和合同一致。",


                "notes": [


                    "提前去物业办理施工许可证，了解施工时间要求",


                    "交底时业主、施工负责人、工长都要到场",


                    "重点复核家电、定制柜、智能家居对应的水电点位",


                    "交底内容要书面记录，各方签字确认",


                    "首批辅材进场要验收，核对品牌型号"


                ],


                "checklist": [


                    "施工许可证已办理完成",


                    "交底已完成并书面签字确认",


                    "家电对应水电点位已现场确认",


                    "定制柜对应水电点位已现场确认",


                    "智能家居对应点位已现场确认",


                    "首批辅材已验收，品牌型号符合合同"


                ]


            },


            "completionFeedback": {


                "nianText": "交底完成啦！辅材也验收好了，马上就要开工了~ 接下来是主体拆改，家的样子要开始变化了哦！",


                "nextHint": "下一步：主体拆改，空间格局大变样"


            }


        },


        {


            "id": "H-6",


            "stageIndex": 1,


            "stepIndex": 1,


            "title": "主体拆改",


            "description": "墙体拆改、建渣清运，确保无违规拆改，拆完立刻约定制初尺。",


            "nianTip": "拆改的时候一定要记住：承重墙绝对不能动！拆下来的旧门窗、暖气片别让工人拿走，卖给收废品的还能回点血呢~ 还有哦，拆改完立刻约定制商家上门初尺，可以提前排产省时间，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "拆改施工+辅材",


                    "qty": "1项",


                    "price": "3000-8000元",


                    "brands": [


                        "施工方提供"


                    ],


                    "tips": "墙体拆改、建渣清运",


                    "category": "基础材料"


                }


            ],


            "materialCategory": "基础材料",


            "riskWarning": "拆完立刻约定制初尺",


            "guide": {


                "text": "主体拆改要严格按照设计图纸来，承重墙、剪力墙、配重墙一律不能动。拆改产生的建筑垃圾要及时清运，保持现场整洁。拆改完成后要复核尺寸，特别是定制区域的墙体位置。拆完立刻约定制商家上门初尺，可以提前排产，节省时间。",


                "notes": [


                    "承重墙绝对不能拆，不确定的先看图纸或问物业",


                    "新建墙体要挂网、放拉结筋，防止后期开裂",


                    "拆改垃圾及时清运，保持现场整洁",


                    "拆改完成后复核定制区域的墙体尺寸",


                    "拆完立刻约定制商家初尺，可提前排产"


                ],


                "checklist": [


                    "无违规拆改，承重墙未动",


                    "新建墙体工艺达标（拉结筋、挂网）",


                    "垃圾已清运，现场整洁",


                    "拆改后尺寸已复核",


                    "已预约定制商家初尺"


                ]


            },


            "completionFeedback": {


                "nianText": "拆改完成啦！空间格局一下子就开阔了~ 接下来如果需要改燃气的话，要提前预约燃气公司哦，排队期挺长的呢！",


                "nextHint": "下一步：燃气改造（如需要），记得提前预约"


            }


        },


        {


            "id": "H-7",


            "stageIndex": 1,


            "stepIndex": 2,


            "title": "燃气改造（如需要）",


            "description": "如需改动燃气管道或移表，向燃气公司申请，由燃气公司专业人员施工。",


            "nianTip": "燃气改造可不能找装修工人私自改哦，必须由燃气公司来施工才安全合法呢。而且燃气公司排队期挺长的，要提前1-2周预约，别耽误工期哦~",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "燃气公司预约",


                    "qty": "1次",


                    "price": "按实际收费",


                    "brands": [


                        "当地燃气公司"


                    ],


                    "tips": "提前1-2周预约，排队期较长",


                    "category": "服务"


                }


            ],


            "materialCategory": "服务",


            "riskWarning": "提前1-2周预约",


            "guide": {


                "text": "燃气改造是高危项目，绝对不能私自改动，必须由燃气公司专业人员施工。如果需要改管或移表，提前1-2周向燃气公司申请预约，因为排队期比较长。改造前确定好燃气灶、热水器的位置，一次改到位。改造完成后要验收，确保符合安全规范。",


                "notes": [


                    "燃气改造必须由燃气公司施工，禁止私自改动",


                    "提前1-2周预约，排队期较长，别耽误工期",


                    "改造前确定好燃气灶、热水器的位置",


                    "燃气管道不能包死，要留检修口",


                    "改造完成后做气密性测试，确保无泄漏"


                ],


                "checklist": [


                    "已向燃气公司申请预约",


                    "由燃气公司专业人员施工",


                    "施工符合安全规范",


                    "已做气密性测试无泄漏",


                    "预留检修口方便后期维护"


                ]


            },


            "completionFeedback": {


                "nianText": "燃气改造完成啦！安全第一，这一步做得很到位~ 接下来拆改完就可以约定制商家上门初次测量了，可以提前排产省时间哦！",


                "nextHint": "下一步：定制柜初次测量，提前排产省时间"


            }


        },


        {


            "id": "H-8",


            "stageIndex": 1,


            "stepIndex": 3,


            "title": "定制柜初次测量",


            "description": "拆改完成后，定制商家上门初次测量，出具深化方案，确认水电点位匹配。",


            "nianTip": "拆改完墙体位置就固定了，这时候可以约定制商家上门初尺啦~ 半包模式下您可以同时约好几家对比方案和报价，选最适合自己的。初尺准确的话可以提前排产，能节省不少时间呢，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "定制商家初测",


                    "qty": "2-3家",


                    "price": "免费/定金",


                    "brands": [


                        "索菲亚",


                        "欧派",


                        "本地定制"


                    ],


                    "tips": "出深化方案和水电点位图",


                    "category": "定制"


                }


            ],


            "materialCategory": "定制",


            "riskWarning": "可同时约多家对比方案报价",


            "guide": {


                "text": "拆改完成后墙体位置就固定了，这时候定制商家可以上门初次测量。初尺后可以出深化方案，确认水电点位和家电尺寸是否匹配。半包模式下可以同时约2-3家定制商家对比方案和报价。初尺无误可以提前排产，节省生产周期，但最终下单要等泥瓦完工后复尺。",


                "notes": [


                    "拆改完成、墙体位置固定后再初尺，数据更准确",


                    "可以同时约2-3家定制商家对比方案和报价",


                    "初尺后出深化方案，确认功能分区和内部结构",


                    "核对水电点位图，确保和定制柜、家电不冲突",


                    "初尺可提前排产，但最终下单以复尺为准"


                ],


                "checklist": [


                    "墙体位置已固定，拆改完成",


                    "定制商家已上门初尺",


                    "初步方案已确认",


                    "水电位置和定制柜/家电匹配",


                    "如提前排产，已确认复尺后正式下单"


                ]


            },


            "completionFeedback": {


                "nianText": "初次测量完成啦！定制方案也有眉目了~ 接下来如果装中央空调、新风或地暖的话，要赶在水电前做哦，不然后期返工损失可大了！",


                "nextHint": "下一步：暖通/空调安装（如需要）"


            }


        },


        {


            "id": "H-9",


            "stageIndex": 1,


            "stepIndex": 4,


            "title": "暖通/空调安装（如需要）",


            "description": "中央空调/风管机/新风管道预埋（水电前），地暖管道铺设（水电后、泥瓦前）。",


            "nianTip": "中央空调和新风一定要在水电开槽前装好管道哦，不然后期吊顶返工损失好几万呢！地暖的话要等水电做完、泥瓦回填前铺。时间节点可别搞混了，您都记清楚了吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "中央空调/风管机",


                    "qty": "1套",


                    "price": "1-5万",


                    "brands": [


                        "格力",


                        "美的",


                        "大金"


                    ],


                    "tips": "水电前进场安装管道和主机",


                    "category": "家电"


                },


                {


                    "name": "新风系统",


                    "qty": "1套",


                    "price": "8千-3万",


                    "brands": [


                        "松下",


                        "霍尼韦尔",


                        "远大"


                    ],


                    "tips": "水电前或同步完成管道铺设",


                    "category": "家电"


                },


                {


                    "name": "地暖设备",


                    "qty": "1套",


                    "price": "1.5-5万",


                    "brands": [


                        "威能",


                        "博世",


                        "菲斯曼"


                    ],


                    "tips": "水电后进场，泥瓦回填前铺设",


                    "category": "家电"


                }


            ],


            "materialCategory": "暖通设备",


            "riskWarning": "中央空调/新风必须在水电前完成，否则吊顶返工；地暖在水电后泥瓦前",


            "guide": {


                "text": "暖通设备的安装时间节点非常关键，搞错了后期返工损失很大。中央空调和风管机的管道、主机必须在水电开槽前完成，要和水电工现场配合定位。新风管道也要在水电前或同步完成。地暖则是水电完成后、泥瓦回填前铺设。所有设备的电源线、控制线要提前和水电工沟通预留。",


                "notes": [


                    "中央空调/风管机：水电开槽前完成管道和主机安装",


                    "新风系统：水电前或同步完成管道铺设",


                    "地暖：水电完成后进场，泥瓦回填前铺设",


                    "与水电工现场配合定位，确保点位准确",


                    "管道铺设完成后做打压测试，确认无渗漏"


                ],


                "checklist": [


                    "中央空调/风管机管道/主机已安装（水电前完成）",


                    "新风管道已铺设（水电前或同步完成）",


                    "与水电工现场配合定位完毕",


                    "地暖分集水器/管道已铺设（水电后、泥瓦前）",


                    "打压测试通过，无渗漏"


                ]


            },


            "completionFeedback": {


                "nianText": "暖通隐蔽工程搞定啦！时间节点卡得很准，厉害~ 接下来就是最重要的水电改造了，隐蔽工程可不能马虎哦！",


                "nextHint": "下一步：水电改造+隐蔽验收，最关键的隐蔽工程"


            }


        },


        {


            "id": "H-10",


            "stageIndex": 1,


            "stepIndex": 5,


            "title": "水电改造+隐蔽验收",


            "description": "水电布管、打压测试，所有家电/定制/智能水电精准对应，封槽前复核。",


            "nianTip": "水电改造可是隐蔽工程中的重中之重哦，半包模式下您可要多盯着点~ 所有家电、定制柜、智能设备的水电位置一定要精准对应，封槽前一定要对照家电尺寸再复核一遍，不然后期改点位可就得砸墙砸砖了，成本翻倍都不止，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "水电辅材",


                    "qty": "1批",


                    "price": "5千-1.5万",


                    "brands": [


                        "伟星",


                        "日丰",


                        "熊猫",


                        "正泰"


                    ],


                    "tips": "水管、电线、穿线管、底盒等",


                    "category": "水电材料"


                }


            ],


            "materialCategory": "水电材料",


            "riskWarning": "封槽前对照家电尺寸复核",


            "guide": {


                "text": "水电改造是最重要的隐蔽工程，半包模式下要特别注意。水管走顶不走地，电路分路要合理。所有嵌入式家电、定制柜、智能家居的水电位置一定要精准对应，反复核对尺寸。完工后打压测试、通断测试都要做，拍照留存走向图。封槽前一定要对照家电尺寸再复核一遍，确认无误再封槽。",


                "notes": [


                    "打压测试：8-10公斤压力，稳压30分钟，压降不超0.5公斤",


                    "强电弱电分管铺设，间距不少于30cm，交叉处包锡纸",


                    "所有家电/定制柜/智能设备的水电位置精准对应",


                    "封槽前对照家电尺寸再次复核",


                    "拍照和视频留存水电走向图，后期维修有用",


                    "通断测试合格，相位正确"


                ],


                "checklist": [


                    "工艺达标，布管整齐规范",


                    "打压测试合格（8-10公斤，稳压30分钟）",


                    "通断测试合格，相位正确",


                    "所有家电水电位置精准对应",


                    "定制柜水电位置精准对应",


                    "智能水电位置精准对应",


                    "封槽前已对照家电尺寸复核",


                    "已拍照留存水电走向图"


                ]


            },


            "completionFeedback": {


                "nianText": "水电验收通过啦！隐蔽工程搞定，这下心里踏实多了~ 接下来要做防水工程了，您知道闭水试验要做多久吗？",


                "nextHint": "下一步：防水+闭水试验，不然后期漏水哭都来不及"


            }


        },


        {


            "id": "H-11",


            "stageIndex": 2,


            "stepIndex": 0,


            "title": "防水+闭水试验",


            "description": "防水涂刷、管根圆弧处理，48小时闭水试验，通知楼下查看。",


            "nianTip": "防水这一步可不能马虎哦，淋浴区要刷到1.8米高呢，管根还要做圆弧处理。闭水试验一定要做够48小时，还要通知楼下邻居一起查看，不然后期漏水到楼下邻里纠纷可麻烦了，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "防水涂料",


                    "qty": "3-5桶",


                    "price": "200-400元/桶",


                    "brands": [


                        "东方雨虹",


                        "德高",


                        "雷邦仕"


                    ],


                    "tips": "柔性防水涂料，抗沉降不开裂",


                    "category": "防水材料"


                }


            ],


            "materialCategory": "防水材料",


            "riskWarning": "通知楼下查看",


            "guide": {


                "text": "防水是重中之重，漏水不仅自己麻烦，还会影响楼下邻居。淋浴区刷1.8米高，其他墙面至少30cm，管根、阴阳角要做圆弧处理加强。闭水试验48小时，一定要通知楼下邻居一起查看确认无渗漏，最好签字确认。卫生间门口要做止水坎，防水往外延30cm。",


                "notes": [


                    "淋浴区防水刷到1.8米高，干区墙面至少30cm",


                    "管根、阴阳角等重点部位先做圆弧处理加强",


                    "防水横竖各刷一遍，薄涂多遍，不要一次刷太厚",


                    "闭水试验蓄水不少于5cm，48小时后通知楼下查看",


                    "卫生间门口做止水坎，防水往外延30cm",


                    "最好让楼下业主签字确认无渗漏"


                ],


                "checklist": [


                    "淋浴区防水高度1.8m，其他区域符合要求",


                    "管根已做圆弧处理",


                    "闭水48小时无渗漏",


                    "已通知楼下查看确认",


                    "门口止水坎已做好"


                ]


            },


            "completionFeedback": {


                "nianText": "防水做好啦！闭水试验也通过了，这下再也不用担心漏水了~ 接下来泥瓦工进场贴瓷砖，您知道贴砖有哪些讲究吗？",


                "nextHint": "下一步：泥瓦工程+瓷砖保护，面子工程很重要"


            }


        },


        {


            "id": "H-12",


            "stageIndex": 2,


            "stepIndex": 1,


            "title": "泥瓦工程+瓷砖保护",


            "description": "贴砖+保护膜，检查空鼓率，瓷砖完工铺设保护膜，贴完约复尺。",


            "nianTip": "泥瓦工程可是面子工程呢，瓷砖贴得好不好一眼就能看出来。半包模式下瓷砖是您自己买的，送货的时候一定要验收一下数量和质量哦~ 空鼓率不能超过5%，贴完砖一定要铺保护膜，不然后面施工刮花了可心疼了，还有哦，贴完砖马上约定制商家复尺！",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "泥瓦辅材",


                    "qty": "1批",


                    "price": "3千-8千",


                    "brands": [


                        "海螺水泥",


                        "本地河沙"


                    ],


                    "tips": "水泥、沙子、瓷砖胶等",


                    "category": "基础材料"


                },


                {


                    "name": "瓷砖",


                    "qty": "按需㎡",


                    "price": "80-300元/㎡",


                    "brands": [


                        "东鹏",


                        "马可波罗",


                        "诺贝尔"


                    ],


                    "tips": "多买5-10%备用，避免补货有色差",


                    "category": "瓷砖"


                }


            ],


            "materialCategory": "瓷砖/瓦工",


            "riskWarning": "瓷砖贴完约复尺",


            "guide": {


                "text": "泥瓦工程决定了空间的基础质感。贴砖前先排砖，避免小条砖；注意空鼓率≤5%；卫生间坡度要找好，倒水快速流走。瓷砖是半包业主自己采购的，送货时要验收数量和质量。瓷砖完工后一定要铺设保护膜，防止后续施工刮花。贴完砖马上约定制商家复尺。",


                "notes": [


                    "瓷砖进场要验收：核对型号、数量、色号，检查有无破损",


                    "贴砖前让师傅出排版图，尽量避免小于1/3的小条砖",


                    "空鼓率≤5%，单块砖边角空鼓不超过该砖面积的15%",


                    "卫生间地面坡度1-2%，地漏处最低，倒水测试排水",


                    "瓷砖完工后马上铺保护膜，保护砖面不被刮花",


                    "贴完砖立刻约定制商家复尺"


                ],


                "checklist": [


                    "瓷砖进场已验收（型号、数量、质量）",


                    "空鼓率≤5%",


                    "排水顺畅，坡度合理",


                    "瓷砖表面无破损、无色差",


                    "瓷砖完工已铺设保护膜",


                    "已预约定制商家复尺"


                ]


            },


            "completionFeedback": {


                "nianText": "泥瓦工程完工啦！瓷砖贴得漂漂亮亮的，真好看~ 接下来明露区域可以做美缝了，不过要等砖缝干透才行哦！",


                "nextHint": "下一步：美缝施工（明露区域），让瓷砖更美观"


            }


        },


        {


            "id": "H-13",


            "stageIndex": 2,


            "stepIndex": 2,


            "title": "美缝施工（明露区域）",


            "description": "明露区域瓷砖美缝，砖缝干透后施工，柜体贴墙区域后续补缝。",


            "nianTip": "美缝做得好，颜值提升一大截呢~ 不过要等泥瓦完工7-15天，砖缝干透了再做哦，不然容易起泡脱落。半包模式下您可以找专门的美缝师傅，也可以自己买美缝剂做，柜体贴墙的地方后面补缝就行，您觉得呢？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "美缝剂",


                    "qty": "15-25支",


                    "price": "30-100元/支",


                    "brands": [


                        "德高",


                        "皇氏工匠",


                        "卓高"


                    ],


                    "tips": "选防霉型，卫生间厨房更耐用",


                    "category": "瓷砖"


                }


            ],


            "materialCategory": "瓷砖/美缝",


            "riskWarning": "",


            "guide": {


                "text": "美缝不仅美观，还能防霉防黑，让瓷砖更好打扫。注意要等泥瓦完工7-15天，砖缝完全干透了再做，不然美缝剂容易起泡脱落。明露区域一次做完，柜体贴墙的地方等定制柜安装完再补缝。半包模式下可以找专业美缝师傅，也可以自己动手。",


                "notes": [


                    "泥瓦完工7-15天后，砖缝干透再做美缝",


                    "美缝前要把缝清理干净，灰尘杂物会影响粘结力",


                    "选防霉型美缝剂，卫生间厨房更耐用",


                    "明露区域一次完成，效果更整体",


                    "柜体贴墙区域先不做，等柜子装好后再补缝",


                    "美缝做完后等完全固化再踩踏，一般24小时"


                ],


                "checklist": [


                    "砖缝已干透（泥瓦完工7-15天）",


                    "明露区域美缝一次完成",


                    "美缝表面平整光滑，无气泡",


                    "颜色均匀，与瓷砖搭配协调",


                    "柜体贴墙区域预留后期补缝"


                ]


            },


            "completionFeedback": {


                "nianText": "美缝做好啦！瓷砖一下子就高级了，真好看~ 接下来泥瓦完工尺寸就固定了，可以约定制商家精准复尺下单了，这可是定制最关键的节点哦！",


                "nextHint": "下一步：定制柜复尺+下单，零误差才能装得好"


            }


        },


        {


            "id": "H-14",


            "stageIndex": 2,


            "stepIndex": 3,


            "title": "定制柜复尺+下单",


            "description": "精准复尺零误差，确认花色、五金、结构，正式下单生产，生产周期书面约定。",


            "nianTip": "复尺这一步可是定制最关键的节点哦，差个几毫米可能就装不上了呢。半包模式下您要盯紧点，花色、五金、结构都要全部确认好，生产周期也要书面约定，板式一般30-45天，刚好和木工油漆并行，不耽误工期~",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "定制柜复尺下单",


                    "qty": "1次",


                    "price": "定金30-50%",


                    "brands": [


                        "索菲亚",


                        "欧派",


                        "本地定制"


                    ],


                    "tips": "支付定金，正式下单生产",


                    "category": "定制"


                }


            ],


            "materialCategory": "定制",


            "riskWarning": "板式30-45天，和木工油漆并行",


            "guide": {


                "text": "泥瓦完工后墙面地面尺寸就固定了，这时候定制商家上门精准复尺，这是定制最关键的一步，复尺出错直接导致安装不上。复尺后要确认花色、五金、结构全部无误，然后正式下单生产，生产周期书面约定（板式30-45天）。这个周期刚好和木工油漆并行，不会耽误总工期。",


                "notes": [


                    "泥瓦完工、墙面地面尺寸固定后再复尺，确保零误差",


                    "复尺时最好业主在场，现场核对关键尺寸",


                    "花色、五金、内部结构全部确认，签确认单后再下单",


                    "生产周期书面约定：板式30-45天，实木可能更长",


                    "确认交货时间和安装时间，和装修进度衔接好",


                    "支付定金，保留好订单和收据"


                ],


                "checklist": [


                    "墙面地面尺寸已固定，泥瓦完工",


                    "定制商家已复尺，零误差",


                    "花色已确认",


                    "五金已确认",


                    "结构已确认",


                    "生产周期已书面约定",


                    "已支付定金并保留订单"


                ]


            },


            "completionFeedback": {


                "nianText": "复尺完成，正式下单啦！接下来就等生产了~ 这期间木工也可以进场做吊顶，两不耽误呢！",


                "nextHint": "下一步：木工工程，吊顶造型搞起来"


            }


        },


        {


            "id": "H-15",


            "stageIndex": 2,


            "stepIndex": 4,


            "title": "木工工程",


            "description": "吊顶、窗帘盒预埋，龙骨牢固，转角整板，防裂工艺。",


            "nianTip": "木工进场啦，吊顶和造型都要做起来了~ 龙骨一定要牢固，转角要用整板，防止后期开裂。还有窗帘盒要记得预埋，电动窗帘的话电源和86盒也要留好哦，对了，吊顶和定制柜衔接的地方要提前跟定制商家沟通好尺寸，您都记下来了吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "木工辅材",


                    "qty": "1批",


                    "price": "5千-1.5万",


                    "brands": [


                        "可耐福",


                        "龙牌",


                        "泰山"


                    ],


                    "tips": "龙骨、石膏板、板材等",


                    "category": "木工材料"


                }


            ],


            "materialCategory": "木工材料",


            "riskWarning": "吊顶和定制柜衔接提前沟通",


            "guide": {


                "text": "木工主要做吊顶、背景墙基层、窗帘盒这些。龙骨要牢固，间距符合规范；石膏板吊顶转角要用整板套割L型，防止后期开裂；窗帘盒要预埋，电动窗帘还要留电源和86盒。定制柜和吊顶衔接的尺寸要提前和定制商家沟通，避免后期留缝太大或装不上。",


                "notes": [


                    "吊顶龙骨：主龙骨间距不大于80cm，副龙骨不大于40cm",


                    "石膏板转角整板套割L型，避免后期开裂",


                    "板缝倒V型槽，嵌缝膏补平后贴绷带防裂",


                    "窗帘盒预埋，尺寸要够（手动≥15cm，电动≥20cm）",


                    "电动窗帘预留电源和86盒，位置在窗帘盒旁边",


                    "定制柜和吊顶衔接的尺寸，提前和定制商家沟通确认"


                ],


                "checklist": [


                    "龙骨安装牢固，间距规范",


                    "转角整板套割，防裂工艺到位",


                    "窗帘盒已预埋",


                    "电动窗帘电源+86盒已预留（如需要）",


                    "定制柜和吊顶衔接尺寸已沟通"


                ]


            },


            "completionFeedback": {


                "nianText": "木工完工啦！吊顶和造型都有模有样了，真不错~ 接下来油工进场刷墙，墙面颜值全靠这一步了哦！",


                "nextHint": "下一步：油漆工程，墙面滑溜溜"


            }


        },


        {


            "id": "H-16",


            "stageIndex": 2,


            "stepIndex": 5,


            "title": "油漆工程",


            "description": "腻子、乳胶漆，平整度达标，漆面无瑕疵，阴雨天禁止刷漆。",


            "nianTip": "油漆工程可是面子工程呢，墙面平不平、颜色匀不匀一眼就能看出来。平整度要≤2mm，一底两面不能少。阴雨天可别刷漆哦，湿度太大影响质量。还有油漆没干透不能装定制柜，不然容易受潮，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "油漆辅材",


                    "qty": "1批",


                    "price": "3千-8千",


                    "brands": [


                        "美巢",


                        "立邦",


                        "多乐士"


                    ],


                    "tips": "腻子、乳胶漆、阴阳角条等",


                    "category": "油漆材料"


                }


            ],


            "materialCategory": "油漆材料",


            "riskWarning": "阴雨天禁止刷漆",


            "guide": {


                "text": "油漆是面子工程，决定了墙面的最终效果。腻子刮2-3遍，每遍干透了再刮下一遍；打磨要平整，平整度≤2mm；底漆必须刷，面漆刷两遍，一底两面。阴雨天不要刷漆，湿度太大影响质量。油漆没干透不能装定制柜，不然容易受潮发霉。",


                "notes": [


                    "新旧墙体、开槽处要挂网，防止后期开裂",


                    "腻子刮2-3遍，每遍都要等干透了再刮下一遍",


                    "打磨用320目以上砂纸，平整度≤2mm/2m靠尺",


                    "底漆必须刷：封闭基层、节省面漆、防止返碱",


                    "面漆刷两遍，一底两面，无流挂、无色差",


                    "阴雨天禁止刷漆，湿度太大",


                    "油漆完全干透后再装定制柜，防止受潮"


                ],


                "checklist": [


                    "挂网防裂处理到位",


                    "平整度≤2mm",


                    "一底两面，涂刷均匀无流挂",


                    "色温统一，无色差开裂",


                    "阴雨天未施工"


                ]


            },


            "completionFeedback": {


                "nianText": "油漆完工啦！墙面滑溜溜的，颜色也好好看~ 接下来泥瓦、木工、油漆都做完了，就要中期验收付中期款了哦！",


                "nextHint": "下一步：中期验收+付中期款，验收合格再付款"


            }


        },


        {


            "id": "H-17",


            "stageIndex": 2,


            "stepIndex": 6,


            "title": "中期验收+付中期款",


            "description": "基础硬装验收合格，检查全部施工质量，确认增项，支付中期款。",


            "nianTip": "中期验收很重要的，泥瓦、木工、油漆都要仔细检查一遍。半包模式下您要更上心，有问题及时整改，整改好了再付中期款，以验收换付款，您说对吗？所有增项也要确认签字，不然后期结算扯皮就麻烦了~",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "中期款",


                    "qty": "1次",


                    "price": "总工程款×30%",


                    "brands": [


                        "施工方"


                    ],


                    "tips": "验收合格后再支付",


                    "category": "工程款"


                }


            ],


            "materialCategory": "工程款",


            "riskWarning": "",


            "guide": {


                "text": "中期验收是硬装完工后的重要节点，泥瓦、木工、油漆全部完工后进行。要逐项检查施工质量，有问题记录下来要求整改。所有增项必须全部签字确认，避免后期结算纠纷。验收合格后再支付中期款，记住：以验收换付款。半包模式下中期款一般是30%左右。",


                "notes": [


                    "验收内容：泥瓦工程、木工工程、油漆工程全部项目",


                    "逐项检查，有问题书面记录，限期整改",


                    "所有增项必须全部签字确认，包括价格和工程量",


                    "核对实际完成工程量与报价是否一致",


                    "验收合格后再支付中期款，不要提前付",


                    "保留好验收记录和付款凭证"


                ],


                "checklist": [


                    "泥瓦工程全部合格",


                    "木工工程全部合格",


                    "油漆工程全部合格",


                    "无违规增项",


                    "所有增项已签字确认",


                    "验收合格后已支付中期款"


                ]


            },


            "completionFeedback": {


                "nianText": "中期验收通过啦！硬装基本搞定，太棒了~ 接下来进入安装阶段，首先是集成吊顶和厨卫电器，家的样子越来越清晰了哦！",


                "nextHint": "下一步：集成吊顶+厨卫电器"


            }


        },


        {


            "id": "H-18",


            "stageIndex": 3,


            "stepIndex": 0,


            "title": "集成吊顶+厨卫电器",


            "description": "安装厨房卫生间吊顶、电器，安装平整，功能正常，高度与橱柜匹配。",


            "nianTip": "安装阶段开始啦，先装集成吊顶~ 半包模式下这些都是您自己采购的，送货的时候记得验收一下型号哦。吊顶要平整，电器功能要试一下。还有吊顶高度要和橱柜匹配哦，提前跟定制橱柜的商家确认一下高度，不然后期橱柜装上去缝隙太大就不好看了，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "集成吊顶",


                    "qty": "按需㎡",


                    "price": "100-300元/㎡",


                    "brands": [


                        "友邦",


                        "奥普",


                        "法狮龙"


                    ],


                    "tips": "铝扣板吊顶，防潮易清洁",


                    "category": "吊顶"


                },


                {


                    "name": "浴霸/排气扇",


                    "qty": "1-2台",


                    "price": "500-2000元/台",


                    "brands": [


                        "奥普",


                        "松下",


                        "欧普"


                    ],


                    "tips": "风暖型更舒适安全",


                    "category": "厨卫电器"


                }


            ],


            "materialCategory": "吊顶/厨卫电器",


            "riskWarning": "提前和橱柜确认吊顶高度",


            "guide": {


                "text": "集成吊顶安装要注意平整度，缝隙均匀。浴霸、排气扇等电器要安装牢固，功能测试正常。吊顶高度要和橱柜高度匹配，衔接自然，最好提前和橱柜商家确认吊顶高度。卫生间吊顶要预留检修口，方便后期维修。半包模式下这些材料都是业主自己采购的，进场时要核对型号。",


                "notes": [


                    "吊顶安装平整，缝隙均匀，扣板无划痕变形",


                    "电器安装牢固，功能测试正常（取暖、照明、换气）",


                    "吊顶高度与橱柜高度匹配，提前和橱柜商家确认",


                    "卫生间预留检修口，方便后期维修",


                    "浴霸要装在淋浴区外面，避免直接对着人吹",


                    "排气扇管道要接到室外，不能只排在吊顶里"


                ],


                "checklist": [


                    "吊顶安装平整",


                    "电器功能正常",


                    "吊顶高度与橱柜匹配",


                    "已预留检修口",


                    "排气管道已接至室外"


                ]


            },


            "completionFeedback": {


                "nianText": "吊顶和厨卫电器装好了~ 接下来装室内门和踢脚线，记得先装门后装定制柜哦，这样收口更好看！",


                "nextHint": "下一步：室内门+踢脚线安装"


            }


        },


        {


            "id": "H-19",


            "stageIndex": 3,


            "stepIndex": 1,


            "title": "室内门+踢脚线",


            "description": "安装木门、踢脚线，开合顺畅，收口平整，先装门后装定制柜。",


            "nianTip": "装门啦，家的感觉越来越浓了~ 半包模式下木门也是您自己选的，安装前记得核对一下型号和颜色哦。门要开合顺畅，缝隙均匀才好看。还有哦，要先装门再装定制柜，这样门套和柜子的收口更自然美观，您记住这个顺序了吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "木门+门套",


                    "qty": "3-5樘",


                    "price": "1000-5000元/樘",


                    "brands": [


                        "TATA",


                        "欧派",


                        "本地木门"


                    ],


                    "tips": "选实木复合的，性价比高",


                    "category": "门窗"


                },


                {


                    "name": "踢脚线",


                    "qty": "按需米",


                    "price": "15-50元/米",


                    "brands": [


                        "同地板品牌",


                        "木门同品牌"


                    ],


                    "tips": "选和地板或门同色系",


                    "category": "辅材"


                }


            ],


            "materialCategory": "门窗/辅材",


            "riskWarning": "先装门后装定制柜",


            "guide": {


                "text": "室内门安装要注意垂直度，开合顺畅，缝隙均匀。门套要垂直，打胶均匀美观。踢脚线安装要平整，接缝严密。安装顺序很重要：先装门，后装定制柜，这样门套和柜子的收口更自然。半包模式下木门和踢脚线都是业主自己采购的，进场时要核对型号和颜色。",


                "notes": [


                    "木门安装垂直，开合顺畅，无卡顿异响",


                    "门缝均匀，符合标准（2-3mm）",


                    "门套打胶均匀美观，无毛刺",


                    "踢脚线安装平整，接缝严密，阴阳角处理到位",


                    "安装顺序：先装门，后装定制柜，收口更自然",


                    "定制柜和门套衔接的地方，提前和定制商家沟通尺寸"


                ],


                "checklist": [


                    "木门开合顺畅",


                    "缝隙均匀",


                    "门套安装垂直美观",


                    "踢脚线安装平整",


                    "先装门后装定制柜的顺序已确认"


                ]


            },


            "completionFeedback": {


                "nianText": "门和踢脚线都装好了，真好看~ 接下来就是全屋定制柜安装了，这可是收纳的重头戏，您期待吗？",


                "nextHint": "下一步：全屋定制柜安装，收纳大升级"


            }


        },


        {


            "id": "H-20",


            "stageIndex": 3,


            "stepIndex": 2,


            "title": "全屋定制柜安装",


            "description": "定制柜送货安装、收口，核对板材/五金/花色，安装牢固，外露区域美缝修补。",


            "nianTip": "定制柜终于到货安装啦，想想就激动~ 安装前先核对一下板材、五金、花色是不是和约定的一样，别送错了哦。安装时要保护好墙面地面，有磕碰当场修。柜体外露的地方还要补一下美缝，有问题当场改，别等安装完再说，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "定制柜送货安装",


                    "qty": "全屋",


                    "price": "按订单",


                    "brands": [


                        "索菲亚",


                        "欧派",


                        "本地定制"


                    ],


                    "tips": "送货上门并安装",


                    "category": "定制"


                }


            ],


            "materialCategory": "定制",


            "riskWarning": "有问题当场改",


            "guide": {


                "text": "定制柜安装是大日子，安装前先验货：板材、五金、花色是不是和约定的一致。安装时注意保护墙面和地面，有磕碰当场修补。安装完要检查牢固度、门缝均匀、抽屉顺畅、收口美观。柜体外露区域的瓷砖美缝要补一下。有问题当场提出当场改，别等安装完再说。",


                "notes": [


                    "送货时先验货：板材品牌、花色、五金品牌与订单一致",


                    "安装前做好成品保护，避免磕碰墙面地面",


                    "安装牢固，柜体水平垂直，无晃动",


                    "柜门缝隙均匀，开合顺畅，阻尼有效",


                    "抽屉推拉顺滑，承重没问题",


                    "收口美观，缝隙均匀",


                    "柜体外露区域的瓷砖美缝要修补",


                    "有磕碰当场修补，别等安装完再说"


                ],


                "checklist": [


                    "板材/五金/花色与约定一致",


                    "安装牢固",


                    "收口美观",


                    "柜门缝隙均匀，开合顺畅",


                    "抽屉推拉顺滑",


                    "柜体外露区域美缝已修补",


                    "墙面地面无磕碰损坏"


                ]


            },


            "completionFeedback": {


                "nianText": "定制柜装好啦！收纳空间一下子就有了，太棒了~ 接下来装木地板、卫浴和灯具，家马上就要成型了哦！",


                "nextHint": "下一步：木地板+卫浴+灯具安装"


            }


        },


        {


            "id": "H-21",


            "stageIndex": 3,


            "stepIndex": 3,


            "title": "木地板+卫浴+灯具安装",


            "description": "依次安装地板、卫浴、灯具、五金，进场核对型号，安装功能正常。",


            "nianTip": "安装进入收尾阶段啦~ 半包模式下这些都是您自己采购的，进场的时候都核对一下型号，别送错了。木地板要最后装，防止前面施工磕碰坏。安装完都试一下功能，确保正常使用，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "木地板",


                    "qty": "按需㎡",


                    "price": "100-400元/㎡",


                    "brands": [


                        "圣象",


                        "大自然",


                        "德尔"


                    ],


                    "tips": "实木复合性价比高，稳定性好",


                    "category": "地板"


                },


                {


                    "name": "卫浴洁具",


                    "qty": "1套",


                    "price": "3000-10000元",


                    "brands": [


                        "TOTO",


                        "科勒",


                        "九牧"


                    ],


                    "tips": "马桶、花洒、浴室柜等",


                    "category": "卫浴"


                },


                {


                    "name": "灯具",


                    "qty": "全屋",


                    "price": "2000-5000元",


                    "brands": [


                        "欧普",


                        "雷士",


                        "飞利浦"


                    ],


                    "tips": "客厅主灯、卧室灯、筒灯射灯等",


                    "category": "灯具"


                },


                {


                    "name": "五金挂件",


                    "qty": "若干",


                    "price": "500-2000元",


                    "brands": [


                        "九牧",


                        "箭牌",


                        "恒洁"


                    ],


                    "tips": "毛巾架、置物架、挂钩等",


                    "category": "五金"


                }


            ],


            "materialCategory": "主材",


            "riskWarning": "地板最后装防磕碰",


            "guide": {


                "text": "这一步安装项目比较多：木地板、卫浴洁具、灯具、五金挂件。半包模式下这些都是业主自己采购的，进场时要核对型号和数量。注意木地板要最后装，防止前面施工磕碰损坏。所有材料进场时都核对一下型号，安装完都测试一下功能是否正常。",


                "notes": [


                    "木地板最后安装，防止磕碰损坏",


                    "地板安装前检查地面平整度，误差≤2mm",


                    "地板提前进场适应温湿度，铺的时候留伸缩缝",


                    "卫浴洁具进场核对型号，安装后测试冲水、排水、密封",


                    "灯具进场核对型号，安装后试亮，开关控制正确",


                    "五金挂件安装牢固，位置合理",


                    "所有安装项目完成后逐一测试功能"


                ],


                "checklist": [


                    "进场已核对型号",


                    "木地板安装完成无空响",


                    "卫浴安装完成功能正常",


                    "灯具安装完成全部点亮",


                    "五金挂件安装牢固",


                    "木地板最后安装，无磕碰"


                ]


            },


            "completionFeedback": {


                "nianText": "地板、卫浴、灯具都装好了，家的样子完完整整啦！接下来做一下细节修补和清洁，马上就能验收了哦~",


                "nextHint": "下一步：细节修补+清洁，干干净净"


            }


        },


        {


            "id": "H-22",


            "stageIndex": 4,


            "stepIndex": 0,


            "title": "细节修补+清洁",


            "description": "修补施工中的磕碰瑕疵，清理现场，确保修补无色差，现场整洁。",


            "nianTip": "装修嘛，难免有一些小磕碰小瑕疵，最后统一修补一下就完美了~ 半包模式下要记住：谁装的谁负责修，哪里有问题就找对应的商家或工人。基础清洁做完后，您再仔细检查一遍，确保干干净净的，您觉得呢？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "修补+基础清洁",


                    "qty": "1次",


                    "price": "包含在工程款内",


                    "brands": [


                        "施工方"


                    ],


                    "tips": "施工方负责修补和基础清洁",


                    "category": "服务"


                }


            ],


            "materialCategory": "保洁/修补",


            "riskWarning": "谁装谁负责修",


            "guide": {


                "text": "装修过程中难免有一些小磕碰、小瑕疵，最后统一修补一下。半包模式下要注意：谁安装的谁负责修补，哪里有问题就找对应的商家或工人。施工方负责基础清洁和他们施工范围内的修补。保洁完自己再检查一遍，特别是边角和柜子里面。",


                "notes": [


                    "先做细节修补：墙面磕碰、瓷砖崩边、五金划痕等",


                    "修补要注意无色差，尽量和原色一致",


                    "记住：谁装的谁负责修，找对应的负责人",


                    "基础清洁由施工方负责，清理施工垃圾",


                    "保洁完自己再检查一遍，特别是边角和柜子顶上",


                    "保洁后注意开窗通风"


                ],


                "checklist": [


                    "细节修补完成，无色差",


                    "施工垃圾已清理",


                    "地面墙面无残留污渍",


                    "柜子内外已擦拭干净",


                    "五金件清洁光亮",


                    "现场整洁"


                ]


            },


            "completionFeedback": {


                "nianText": "修补好了，也打扫干净啦！家变得亮堂堂的，真舒服~ 接下来就是竣工验收了，您准备好了吗？",


                "nextHint": "下一步：竣工验收+结算+质保"


            }


        },


        {


            "id": "H-23",


            "stageIndex": 4,


            "stepIndex": 1,


            "title": "竣工验收+结算+质保",


            "description": "全屋验收，结算尾款，施工项目全部合格，定制/主材各自质保明确。",


            "nianTip": "终于到竣工验收啦，恭喜恭喜！半包模式下验收要注意：施工方负责的项目找施工方，定制柜找定制商家，主材找各自的供应商，质保也是分开的哦。有孕妇和宝宝的家庭，一定要做空气质量检测，安全第一。尾款要等验收合格了再付，您都了解了吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "尾款",


                    "qty": "1次",


                    "price": "总工程款×10%",


                    "brands": [


                        "施工方"


                    ],


                    "tips": "验收合格后支付",


                    "category": "工程款"


                }


            ],


            "materialCategory": "工程款",


            "riskWarning": "施工质保找施工方，定制质保找商家，分开对接",


            "guide": {


                "text": "竣工验收是最后一关，半包模式下要分别验收：施工项目找施工方验收，定制柜找定制商家验收，主材找各自的供应商验收。所有项目都要检查，所有功能都要测试。有问题的地方记录下来，整改完再签字。结算尾款前核对所有增减项。质保也是分开的：施工质保找施工方，定制质保找商家，主材质保找品牌。有孕妇/婴幼儿的家庭，建议做空气质量检测。",


                "notes": [


                    "施工项目验收：泥瓦、木工、油漆、水电等",


                    "定制柜单独验收，索要质保凭证",


                    "主材和家电单独验收，保留保修卡",


                    "所有项目完工，功能正常，逐一测试",


                    "有问题书面记录，限期整改，整改完复验",


                    "结算前核对所有增减项，确认总金额",


                    "施工质保：水电防水≥5年，基础工程≥2年",


                    "定制质保：找定制商家，确认质保年限",


                    "有孕妇/婴幼儿建议做空气质量检测",


                    "验收合格、交接完成后再付尾款"


                ],


                "checklist": [


                    "施工项目全部合格",


                    "定制柜验收合格",


                    "主材家电验收合格",


                    "功能全部正常",


                    "各项目质保已明确（施工/定制/主材分开）",


                    "结算完成，尾款已支付",


                    "质保已启动"


                ]


            },


            "completionFeedback": {


                "nianText": "恭喜您！竣工验收通过啦，半包装修圆满完成！从小管家陪着您一步步走过来，真的超有成就感~ 祝您在新家里开启美好生活，每天都开开心心的！以后有任何问题都可以来找我哦~",


                "nextHint": "装修完成！开启你的美好生活吧~"


            }


        }


        ],


        self: [


        {


            "id": "S-1",


            "stageIndex": 0,


            "stepIndex": 0,


            "title": "需求梳理+方案定稿",


            "description": "完成动线需求，出全套施工图，含定制柜位置、嵌入式家电尺寸、智能家居预埋图。",


            "nianTip": "自装模式可全靠您自己掌舵呢~ 第一步一定要把需求梳理清楚，方案定死了再开工，不然后期改来改去工期翻倍，钱包也受不了。全套施工图都要出齐：平面、吊顶、水电、立面、节点图，一个都不能少哦~",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "嵌入式家电型号",


                    "qty": "若干",


                    "price": "待定",


                    "brands": [


                        "海尔",


                        "西门子",


                        "美的"


                    ],


                    "tips": "先锁定型号拿尺寸，无需付款，后期再买",


                    "category": "家电"


                },


                {


                    "name": "全套施工图纸",


                    "qty": "1套",


                    "price": "50-150元/㎡",


                    "brands": [


                        "设计师/自行设计"


                    ],


                    "tips": "平面、吊顶、水电、立面、节点图",


                    "category": "图纸"


                }


            ],


            "materialCategory": "家电/图纸",


            "riskWarning": "方案不定死就开工=工期翻倍",


            "guide": {


                "text": "自装模式下，设计方案全靠您自己把关。一定要把需求梳理清楚，动线、功能、收纳都要考虑到。全套施工图要出齐：平面图、吊顶图、水电图、立面图、节点大样图。定制柜的位置、嵌入式家电的尺寸、智能家居的预埋图都要包含在内。方案定死了再开工，不然后期改来改去工期翻倍。",


                "notes": [


                    "梳理家庭成员生活习惯和功能需求",


                    "确定动线布局，确保使用顺畅",


                    "全套施工图纸齐全：平面、吊顶、水电、立面、节点图",


                    "定制柜位置和尺寸要标注清楚",


                    "嵌入式家电型号先锁定，尺寸标注在图纸上",


                    "智能家居预埋图要包含在内",


                    "方案定死再开工，避免边装边改"


                ],


                "checklist": [


                    "需求梳理完成",


                    "图纸齐全（平面/吊顶/水电/立面/节点图）",


                    "含定制柜位置和尺寸",


                    "含嵌入式家电尺寸",


                    "含智能家居预埋图",


                    "方案已定稿，准备开工"


                ]


            },


            "completionFeedback": {


                "nianText": "需求梳理完啦，方案也定稿了，这第一步走得很扎实~ 接下来要找各工种工人和排工期了，自装的工期规划可重要了！",


                "nextHint": "下一步：筛选各工种工人+排工期"


            }


        },


        {


            "id": "S-2",


            "stageIndex": 0,


            "stepIndex": 1,


            "title": "筛选各工种工人+排工期",


            "description": "找工长，看工地，谈价格，制定工期表，含定制测量/下单/安装节点。",


            "nianTip": "自装找工人可是个技术活呢~ 每个工种都要看过工地再定，不能只看报价。工期表一定要排好，特别是定制柜的测量、下单、安装节点，一定要算进去，不然后期等柜子等半个月，工期就拖了。您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "工期计划表",


                    "qty": "1份",


                    "price": "免费",


                    "brands": [


                        "自行制定"


                    ],


                    "tips": "含各工种进场时间和定制节点",


                    "category": "资料清单"


                }


            ],


            "materialCategory": "资料清单",


            "riskWarning": "工期表必须算进定制生产时间",


            "guide": {


                "text": "自装模式下，工人是自己找的，一定要筛选好。每个工种都要看过工地，了解工艺水平和口碑，再谈价格。工期表非常重要，要把每个工种的进场时间、施工周期都排好，特别是定制柜的初次测量、复尺、下单、安装节点，一定要算进工期里，不然后期等柜子会拖工期。",


                "notes": [


                    "每个工种都要看过工地，了解工艺水平",


                    "不要只看报价，低价往往意味着偷工减料",


                    "工期表要详细：各工种进场时间、施工周期",


                    "定制测量、复尺、下单、安装节点要算进工期",


                    "预留10-15天的缓冲时间，应对突发情况",


                    "确定好付款方式，按节点付款更有保障"


                ],


                "checklist": [


                    "已筛选各工种工人（水电、泥瓦、木工、油漆等）",


                    "每个工种都看过工地",


                    "工期表已制定",


                    "工期表含定制测量/下单/安装节点",


                    "付款方式已确认（按节点付款）"


                ]


            },


            "completionFeedback": {


                "nianText": "工人找好啦，工期也排好了，准备工作做得真充分~ 接下来办物业装修手续，马上就要开工了哦！",


                "nextHint": "下一步：办物业装修手续"


            }


        },


        {


            "id": "S-3",


            "stageIndex": 0,


            "stepIndex": 2,


            "title": "办物业装修手续",


            "description": "提交资料，办施工许可证，老房先确认电表容量。",


            "nianTip": "开工前先把物业手续办了，别到时候被投诉停工哦~ 老房子的话要特别注意，先确认一下电表容量够不够，不够的话要提前申请增容，不然后期家电多了跳闸可麻烦了。您都记下来了吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "身份证",


                    "qty": "1份",


                    "price": "免费",


                    "brands": [


                        "个人证件"


                    ],


                    "tips": "业主身份证",


                    "category": "资料清单"


                },


                {


                    "name": "购房合同",


                    "qty": "1份",


                    "price": "免费",


                    "brands": [


                        "开发商提供"


                    ],


                    "tips": "房产证或购房合同",


                    "category": "资料清单"


                },


                {


                    "name": "装修图纸",


                    "qty": "1套",


                    "price": "免费",


                    "brands": [


                        "自行准备"


                    ],


                    "tips": "平面布置图、水电图等",


                    "category": "资料清单"


                }


            ],


            "materialCategory": "资料清单",


            "riskWarning": "老房先确认电表容量",


            "guide": {


                "text": "开工前必须去物业办理装修手续，提交相关资料，办理施工许可证，交装修押金。新房和老房都要办，老房特别要注意确认电表容量，如果容量不够要提前申请增容，不然后期家电多了经常跳闸。还要了解物业的施工时间要求和垃圾清运规定。",


                "notes": [


                    "提前准备好身份证、购房合同、装修图纸",


                    "去物业办理施工许可证，交装修押金",


                    "了解施工时间要求，避免扰民被投诉",


                    "了解垃圾清运规定和费用",


                    "老房一定要确认电表容量，不够的话提前申请增容",


                    "了解承重墙、外立面等禁止改动的规定"


                ],


                "checklist": [


                    "已提交资料",


                    "已取得施工许可",


                    "已了解施工时间要求",


                    "已了解垃圾清运规定",


                    "老房已确认电表容量"


                ]


            },


            "completionFeedback": {


                "nianText": "物业手续办好啦，可以开工啦！想想还有点小激动呢~ 接下来主体拆改，空间格局马上就要大变样了哦！",


                "nextHint": "下一步：主体拆改，空间格局大变样"


            }


        },


        {


            "id": "S-4",


            "stageIndex": 1,


            "stepIndex": 0,


            "title": "主体拆改",


            "description": "拆墙、砌墙、清运建渣，无违规拆改，拆完立刻约定制初尺。",


            "nianTip": "拆改的时候一定要记住：承重墙绝对不能动！自装的话更要盯着点，别让工人图省事乱拆。拆下来的旧门窗、暖气片可以卖废品回点血~ 还有哦，拆改完立刻约定制商家上门初尺，可以提前排产省时间，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "水泥",


                    "qty": "10-20袋",


                    "price": "20-30元/袋",


                    "brands": [


                        "海螺",


                        "南方"


                    ],


                    "tips": "砌墙用",


                    "category": "基础材料"


                },


                {


                    "name": "沙子",


                    "qty": "1-2方",


                    "price": "100-200元/方",


                    "brands": [


                        "本地河沙"


                    ],


                    "tips": "砌墙用",


                    "category": "基础材料"


                },


                {


                    "name": "红砖/轻质砖",


                    "qty": "按需",


                    "price": "0.5-2元/块",


                    "brands": [


                        "本地建材"


                    ],


                    "tips": "新建墙体用",


                    "category": "基础材料"


                }


            ],


            "materialCategory": "基础材料",


            "riskWarning": "拆完立刻约定制初尺",


            "guide": {


                "text": "主体拆改要严格按照设计图纸来，承重墙、剪力墙、配重墙一律不能动。自装的话要特别盯着，别让工人乱拆。新建墙体要挂网、放拉结筋，防止后期开裂。拆改产生的建筑垃圾要及时清运，保持现场整洁。拆完立刻约定制商家上门初尺，可以提前排产。",


                "notes": [


                    "承重墙绝对不能拆，不确定的先看图纸或问物业",


                    "新建墙体要挂网、放拉结筋，防止后期开裂",


                    "拆改垃圾及时清运，保持现场整洁",


                    "拆改完成后复核定制区域的墙体尺寸",


                    "拆完立刻约定制商家初尺，可提前排产",


                    "旧门窗、暖气片等可以卖废品回点血"


                ],


                "checklist": [


                    "无违规拆改，承重墙未动",


                    "新建墙体工艺达标（拉结筋、挂网）",


                    "垃圾已清运，现场整洁",


                    "拆改后尺寸已复核",


                    "已预约定制商家初尺"


                ]


            },


            "completionFeedback": {


                "nianText": "拆改完成啦！空间格局一下子就开阔了~ 接下来如果需要改燃气的话，要提前预约燃气公司哦，排队期挺长的呢！",


                "nextHint": "下一步：燃气改造（如需要），记得提前预约"


            }


        },


        {


            "id": "S-5",


            "stageIndex": 1,


            "stepIndex": 1,


            "title": "燃气改造（如需要）",


            "description": "燃气公司改管，燃气公司施工，提前1-2周预约。",


            "nianTip": "燃气改造可不能找装修工人私自改哦，必须由燃气公司来施工才安全合法呢。而且燃气公司排队期挺长的，要提前1-2周预约，别耽误工期哦~",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "燃气公司预约",


                    "qty": "1次",


                    "price": "按实际收费",


                    "brands": [


                        "当地燃气公司"


                    ],


                    "tips": "提前1-2周预约，排队期较长",


                    "category": "服务"


                }


            ],


            "materialCategory": "服务",


            "riskWarning": "提前1-2周预约",


            "guide": {


                "text": "燃气改造是高危项目，绝对不能私自改动，必须由燃气公司专业人员施工。自装的话更要注意，千万别让工人图省事私自改管。如果需要改管或移表，提前1-2周向燃气公司申请预约。改造前确定好燃气灶、热水器的位置，一次改到位。",


                "notes": [


                    "燃气改造必须由燃气公司施工，禁止私自改动",


                    "提前1-2周预约，排队期较长，别耽误工期",


                    "改造前确定好燃气灶、热水器的位置",


                    "燃气管道不能包死，要留检修口",


                    "改造完成后做气密性测试，确保无泄漏"


                ],


                "checklist": [


                    "已向燃气公司申请预约",


                    "由燃气公司专业人员施工",


                    "施工符合安全规范",


                    "已做气密性测试无泄漏",


                    "预留检修口方便后期维护"


                ]


            },


            "completionFeedback": {


                "nianText": "燃气改造完成啦！安全第一，这一步做得很到位~ 接下来拆改完就可以约定制商家上门初次测量了，可以提前排产省时间哦！",


                "nextHint": "下一步：定制柜初次测量，提前排产省时间"


            }


        },


        {


            "id": "S-6",


            "stageIndex": 1,


            "stepIndex": 2,


            "title": "定制柜初次测量",


            "description": "定制商家上门初尺，初尺准确，水电位匹配家电，可约3家对比。",


            "nianTip": "拆改完墙体位置就固定了，这时候可以约定制商家上门初尺啦~ 自装的话您可以约3家对比，比比方案、比比价格，选最适合自己的。初尺准确的话可以提前排产，能节省不少时间呢，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "定制商家初测",


                    "qty": "3家",


                    "price": "免费/定金",


                    "brands": [


                        "索菲亚",


                        "欧派",


                        "本地定制"


                    ],


                    "tips": "对比方案和报价",


                    "category": "定制"


                }


            ],


            "materialCategory": "定制",


            "riskWarning": "可约3家对比",


            "guide": {


                "text": "拆改完成后墙体位置就固定了，这时候定制商家可以上门初次测量。自装模式下可以多约几家对比，建议约3家，比比方案、比比价格、比比服务。初尺后可以出深化方案，确认水电点位和家电尺寸是否匹配。初尺无误可以提前排产，节省生产周期，但最终下单要等泥瓦完工后复尺。",


                "notes": [


                    "拆改完成、墙体位置固定后再初尺，数据更准确",


                    "建议约3家定制商家对比方案和报价",


                    "初尺后出深化方案，确认功能分区和内部结构",


                    "核对水电点位图，确保和定制柜、家电不冲突",


                    "初尺可提前排产，但最终下单以复尺为准"


                ],


                "checklist": [


                    "墙体位置已固定，拆改完成",


                    "定制商家已上门初尺（建议3家对比）",


                    "初步方案已确认",


                    "水电位匹配家电尺寸",


                    "如提前排产，已确认复尺后正式下单"


                ]


            },


            "completionFeedback": {


                "nianText": "初次测量完成啦！定制方案也有眉目了~ 接下来如果装中央空调、新风或地暖的话，要赶在水电前做哦，不然后期返工损失可大了！",


                "nextHint": "下一步：暖通/空调安装（如需要）"


            }


        },


        {


            "id": "S-7",


            "stageIndex": 1,


            "stepIndex": 3,


            "title": "暖通/空调安装（如需要）",


            "description": "中央空调/风管机/新风管道预埋（水电前），地暖管道铺设（水电后、泥瓦前）。",


            "nianTip": "中央空调和新风一定要在水电开槽前装好管道哦，不然后期吊顶返工损失好几万呢！地暖的话要等水电做完、泥瓦回填前铺。自装的话时间节点更要卡准，您都记清楚了吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "中央空调/风管机",


                    "qty": "1套",


                    "price": "1-5万",


                    "brands": [


                        "格力",


                        "美的",


                        "大金"


                    ],


                    "tips": "水电前进场安装管道和主机",


                    "category": "家电"


                },


                {


                    "name": "新风系统",


                    "qty": "1套",


                    "price": "8千-3万",


                    "brands": [


                        "松下",


                        "霍尼韦尔",


                        "远大"


                    ],


                    "tips": "水电前或同步完成管道铺设",


                    "category": "家电"


                },


                {


                    "name": "地暖设备",


                    "qty": "1套",


                    "price": "1.5-5万",


                    "brands": [


                        "威能",


                        "博世",


                        "菲斯曼"


                    ],


                    "tips": "水电后进场，泥瓦回填前铺设",


                    "category": "家电"


                }


            ],


            "materialCategory": "暖通设备",


            "riskWarning": "中央空调/新风必须在水电前完成，否则吊顶返工；地暖在水电后泥瓦前",


            "guide": {


                "text": "暖通设备的安装时间节点非常关键，搞错了后期返工损失很大。中央空调和风管机的管道、主机必须在水电开槽前完成，要和水电工现场配合定位。新风管道也要在水电前或同步完成。地暖则是水电完成后、泥瓦回填前铺设。自装的话要自己协调好各方进场时间。",


                "notes": [


                    "中央空调/风管机：水电开槽前完成管道和主机安装",


                    "新风系统：水电前或同步完成管道铺设",


                    "地暖：水电完成后进场，泥瓦回填前铺设",


                    "与水电工现场配合定位，确保点位准确",


                    "管道铺设完成后做打压测试，确认无渗漏",


                    "自装要协调好各方进场时间，避免误工"


                ],


                "checklist": [


                    "中央空调/风管机管道/主机已安装（水电前完成）",


                    "新风管道已铺设（水电前或同步完成）",


                    "与水电工现场配合定位完毕",


                    "地暖分集水器/管道已铺设（水电后、泥瓦前）",


                    "打压测试通过，无渗漏"


                ]


            },


            "completionFeedback": {


                "nianText": "暖通隐蔽工程搞定啦！时间节点卡得很准，厉害~ 接下来就是最重要的水电改造了，隐蔽工程可不能马虎哦！",


                "nextHint": "下一步：水电改造，自装最考验手艺的一步"


            }


        },


        {


            "id": "S-8",


            "stageIndex": 1,


            "stepIndex": 4,


            "title": "水电改造",


            "description": "开槽、布管、打压，工艺达标，活络线，所有家电/定制/智能水电精准对应。",


            "nianTip": "水电改造可是自装最重要的环节呢~ 材料一定要自己买好的，别在这上面省钱。一定要做活络线，后期换线方便。所有家电、定制柜、智能设备的水电位置一定要精准对应，封槽前一定要拍照录像留存，不然后期想装个东西都不知道线在哪，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "电线",


                    "qty": "若干卷",


                    "price": "100-300元/卷",


                    "brands": [


                        "熊猫",


                        "正泰",


                        "远东"


                    ],


                    "tips": "国标铜芯线，BV线",


                    "category": "水电材料"


                },


                {


                    "name": "水管",


                    "qty": "若干米",


                    "price": "10-30元/米",


                    "brands": [


                        "伟星",


                        "日丰",


                        "金牛"


                    ],


                    "tips": "PPR热水管",


                    "category": "水电材料"


                },


                {


                    "name": "配件",


                    "qty": "若干",


                    "price": "500-2000元",


                    "brands": [


                        "同水管品牌"


                    ],


                    "tips": "接头、弯头、阀门、底盒等",


                    "category": "水电材料"


                }


            ],


            "materialCategory": "水电材料",


            "riskWarning": "封槽前拍照录像留存",


            "guide": {


                "text": "水电改造是自装最重要的隐蔽工程，材料一定要买好的。水管走顶不走地，电路分路要合理，一定要做活络线，后期检修换线方便。所有嵌入式家电、定制柜、智能家居的水电位置一定要精准对应。完工后打压测试、通断测试都要做，封槽前一定要拍照录像留存走向图，后期维修安装都有用。",


                "notes": [


                    "打压测试：8-10公斤压力，稳压30分钟，压降不超0.5公斤",


                    "强电弱电分管铺设，间距不少于30cm，交叉处包锡纸",


                    "所有家电/定制柜/智能设备的水电位置精准对应",


                    "一定要做活络线，后期换线方便",


                    "封槽前拍照录像留存水电走向图",


                    "通断测试合格，相位正确",


                    "电路分路要合理，厨房、空调、卫生间单独回路"


                ],


                "checklist": [


                    "工艺达标，布管整齐规范",


                    "打压测试合格（8-10公斤，稳压30分钟）",


                    "通断测试合格，相位正确",


                    "活络线工艺，后期可换线",


                    "所有家电水电位置精准对应",


                    "定制柜水电位置精准对应",


                    "智能水电位置精准对应",


                    "封槽前已拍照录像留存"


                ]


            },


            "completionFeedback": {


                "nianText": "水电改造完成啦！隐蔽工程搞定，这下心里踏实多了~ 接下来要做防水工程了，您知道闭水试验要做多久吗？",


                "nextHint": "下一步：防水+闭水，不然后期漏水哭都来不及"


            }


        },


        {


            "id": "S-9",


            "stageIndex": 1,


            "stepIndex": 5,


            "title": "防水+闭水",


            "description": "48小时闭水，防水达标无渗漏，通知楼下查看。",


            "nianTip": "防水这一步可不能马虎哦，淋浴区要刷到1.8米高呢，管根还要做圆弧处理。闭水试验一定要做够48小时，还要通知楼下邻居一起查看，不然后期漏水到楼下邻里纠纷可麻烦了，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "防水涂料",


                    "qty": "3-5桶",


                    "price": "200-400元/桶",


                    "brands": [


                        "东方雨虹",


                        "德高",


                        "雷邦仕"


                    ],


                    "tips": "柔性防水涂料，抗沉降不开裂",


                    "category": "防水材料"


                }


            ],


            "materialCategory": "防水材料",


            "riskWarning": "通知楼下查看",


            "guide": {


                "text": "防水是重中之重，漏水不仅自己麻烦，还会影响楼下邻居。淋浴区刷1.8米高，其他墙面至少30cm，管根、阴阳角要做圆弧处理加强。闭水试验48小时，一定要通知楼下邻居一起查看确认无渗漏，最好签字确认。卫生间门口要做止水坎，防水往外延30cm。",


                "notes": [


                    "淋浴区防水刷到1.8米高，干区墙面至少30cm",


                    "管根、阴阳角等重点部位先做圆弧处理加强",


                    "防水横竖各刷一遍，薄涂多遍，不要一次刷太厚",


                    "闭水试验蓄水不少于5cm，48小时后通知楼下查看",


                    "卫生间门口做止水坎，防水往外延30cm",


                    "最好让楼下业主签字确认无渗漏"


                ],


                "checklist": [


                    "淋浴区防水高度1.8m，其他区域符合要求",


                    "管根已做圆弧处理",


                    "闭水48小时无渗漏",


                    "已通知楼下查看确认",


                    "门口止水坎已做好"


                ]


            },


            "completionFeedback": {


                "nianText": "防水做好啦！闭水试验也通过了，这下再也不用担心漏水了~ 接下来泥瓦工进场贴瓷砖，您知道贴砖有哪些讲究吗？",


                "nextHint": "下一步：泥瓦工程，面子工程很重要"


            }


        },


        {


            "id": "S-10",


            "stageIndex": 2,


            "stepIndex": 0,


            "title": "泥瓦工程",


            "description": "贴砖+保护膜，空鼓率≤5%，铺设瓷砖保护膜，贴砖后约复尺。",


            "nianTip": "泥瓦工程可是面子工程呢，瓷砖贴得好不好一眼就能看出来。自装的话瓷砖是您自己选的，一定要买够量，多买5-10%备用，补货容易有色差哦~ 空鼓率不能超过5%，贴完砖一定要铺保护膜，还有哦，贴完砖马上约定制商家复尺！",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "瓷砖",


                    "qty": "按需㎡",


                    "price": "80-300元/㎡",


                    "brands": [


                        "东鹏",


                        "马可波罗",


                        "诺贝尔"


                    ],


                    "tips": "多买5-10%备用，避免补货有色差",


                    "category": "瓷砖"


                },


                {


                    "name": "陶粒",


                    "qty": "1-2方",


                    "price": "100-200元/方",


                    "brands": [


                        "本地建材"


                    ],


                    "tips": "卫生间回填用",


                    "category": "基础材料"


                },


                {


                    "name": "水泥沙子",


                    "qty": "1批",


                    "price": "1000-3000元",


                    "brands": [


                        "海螺水泥",


                        "本地河沙"


                    ],


                    "tips": "贴砖用",


                    "category": "基础材料"


                }


            ],


            "materialCategory": "瓷砖/瓦工",


            "riskWarning": "贴砖后约复尺",


            "guide": {


                "text": "泥瓦工程决定了空间的基础质感。贴砖前先排砖，避免小条砖；注意空鼓率≤5%；卫生间坡度要找好，倒水快速流走。瓷砖要多买5-10%备用，补货容易有色差。瓷砖完工后一定要铺设保护膜，防止后续施工刮花。贴完砖马上约定制商家复尺。",


                "notes": [


                    "瓷砖多买5-10%备用，补货容易有色差",


                    "贴砖前让师傅出排版图，尽量避免小于1/3的小条砖",


                    "空鼓率≤5%，单块砖边角空鼓不超过该砖面积的15%",


                    "卫生间地面坡度1-2%，地漏处最低，倒水测试排水",


                    "瓷砖完工后马上铺保护膜，保护砖面不被刮花",


                    "贴完砖立刻约定制商家复尺",


                    "卫生间回填要用陶粒，不要用建渣"


                ],


                "checklist": [


                    "瓷砖进场已验收（型号、数量、质量）",


                    "空鼓率≤5%",


                    "排水顺畅，坡度合理",


                    "瓷砖表面无破损、无色差",


                    "瓷砖完工已铺设保护膜",


                    "已预约定制商家复尺"


                ]


            },


            "completionFeedback": {


                "nianText": "泥瓦工程完工啦！瓷砖贴得漂漂亮亮的，真好看~ 接下来明露区域可以做美缝了，不过要等砖缝干透才行哦！",


                "nextHint": "下一步：美缝施工（明露区域），让瓷砖更美观"


            }


        },


        {


            "id": "S-11",


            "stageIndex": 2,


            "stepIndex": 1,


            "title": "美缝施工（明露区域）",


            "description": "明露区域美缝，砖缝干透后施工，柜体贴墙区域后续补缝。",


            "nianTip": "美缝做得好，颜值提升一大截呢~ 不过要等泥瓦完工7-15天，砖缝干透了再做哦，不然容易起泡脱落。自装的话美缝可以自己动手做，能省不少钱呢！柜体贴墙的地方后面补缝就行，您觉得呢？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "美缝剂",


                    "qty": "15-25支",


                    "price": "30-100元/支",


                    "brands": [


                        "德高",


                        "皇氏工匠",


                        "卓高"


                    ],


                    "tips": "选防霉型，卫生间厨房更耐用",


                    "category": "瓷砖"


                }


            ],


            "materialCategory": "瓷砖/美缝",


            "riskWarning": "",


            "guide": {


                "text": "美缝不仅美观，还能防霉防黑，让瓷砖更好打扫。注意要等泥瓦完工7-15天，砖缝完全干透了再做，不然美缝剂容易起泡脱落。明露区域一次做完，柜体贴墙的地方等定制柜安装完再补缝。自装的话美缝可以自己动手做，能省不少钱。",


                "notes": [


                    "泥瓦完工7-15天后，砖缝干透再做美缝",


                    "美缝前要把缝清理干净，灰尘杂物会影响粘结力",


                    "选防霉型美缝剂，卫生间厨房更耐用",


                    "明露区域一次完成，效果更整体",


                    "柜体贴墙区域先不做，等柜子装好后再补缝",


                    "美缝做完后等完全固化再踩踏，一般24小时",


                    "自装可以自己动手做美缝，省钱又有成就感"


                ],


                "checklist": [


                    "砖缝已干透（泥瓦完工7-15天）",


                    "明露区域美缝一次完成",


                    "美缝表面平整光滑，无气泡",


                    "颜色均匀，与瓷砖搭配协调",


                    "柜体贴墙区域预留后期补缝"


                ]


            },


            "completionFeedback": {


                "nianText": "美缝做好啦！瓷砖一下子就高级了，真好看~ 接下来泥瓦完工尺寸就固定了，可以约定制商家精准复尺下单了，这可是定制最关键的节点哦！",


                "nextHint": "下一步：定制柜复尺+下单，零误差才能装得好"


            }


        },


        {


            "id": "S-12",


            "stageIndex": 2,


            "stepIndex": 2,


            "title": "定制柜复尺+下单",


            "description": "精准复尺零误差，生产周期书面约定，确认方案付定金。",


            "nianTip": "复尺这一步可是定制最关键的节点哦，差个几毫米可能就装不上了呢。自装的话您要盯紧点，花色、五金、结构都要全部确认好，生产周期也要书面约定，板式一般30-45天，您可别忘啦~",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "定制柜复尺下单",


                    "qty": "1次",


                    "price": "定金30-50%",


                    "brands": [


                        "索菲亚",


                        "欧派",


                        "本地定制"


                    ],


                    "tips": "支付定金，正式下单生产",


                    "category": "定制"


                }


            ],


            "materialCategory": "定制",


            "riskWarning": "板式30-45天",


            "guide": {


                "text": "泥瓦完工后墙面地面尺寸就固定了，这时候定制商家上门精准复尺，这是定制最关键的一步，复尺出错直接导致安装不上。复尺后要确认花色、五金、结构全部无误，然后正式下单生产，生产周期书面约定（板式30-45天）。自装的话要自己跟进生产进度。",


                "notes": [


                    "泥瓦完工、墙面地面尺寸固定后再复尺，确保零误差",


                    "复尺时最好业主在场，现场核对关键尺寸",


                    "花色、五金、内部结构全部确认，签确认单后再下单",


                    "生产周期书面约定：板式30-45天，实木可能更长",


                    "确认交货时间和安装时间，和装修进度衔接好",


                    "支付定金，保留好订单和收据",


                    "自装要自己跟进生产进度，别耽误工期"


                ],


                "checklist": [


                    "墙面地面尺寸已固定，泥瓦完工",


                    "定制商家已复尺，零误差",


                    "花色已确认",


                    "五金已确认",


                    "结构已确认",


                    "生产周期已书面约定",


                    "已支付定金并保留订单"


                ]


            },


            "completionFeedback": {


                "nianText": "复尺完成，正式下单啦！接下来就等生产了~ 这期间木工也可以进场做吊顶，两不耽误呢！",


                "nextHint": "下一步：木工工程，吊顶造型搞起来"


            }


        },


        {


            "id": "S-13",


            "stageIndex": 2,


            "stepIndex": 3,


            "title": "木工工程",


            "description": "吊顶、窗帘盒预埋，工艺达标，窗帘盒预埋，吊顶和定制柜衔接提前沟通。",


            "nianTip": "木工进场啦，吊顶和造型都要做起来了~ 龙骨一定要牢固，转角要用整板，防止后期开裂。还有窗帘盒要记得预埋，电动窗帘的话电源和86盒也要留好哦，对了，吊顶和定制柜衔接的地方要提前跟定制商家沟通好尺寸，您都记下来了吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "龙骨",


                    "qty": "若干",


                    "price": "10-30元/根",


                    "brands": [


                        "可耐福",


                        "龙牌",


                        "泰山"


                    ],


                    "tips": "轻钢龙骨",


                    "category": "木工材料"


                },


                {


                    "name": "石膏板",


                    "qty": "若干张",


                    "price": "30-80元/张",


                    "brands": [


                        "可耐福",


                        "龙牌",


                        "泰山"


                    ],


                    "tips": "纸面石膏板",


                    "category": "木工材料"


                }


            ],


            "materialCategory": "木工材料",


            "riskWarning": "吊顶和定制柜衔接提前沟通",


            "guide": {


                "text": "木工主要做吊顶、背景墙基层、窗帘盒这些。龙骨要牢固，间距符合规范；石膏板吊顶转角要用整板套割L型，防止后期开裂；窗帘盒要预埋，电动窗帘还要留电源和86盒。定制柜和吊顶衔接的尺寸要提前和定制商家沟通，避免后期留缝太大或装不上。",


                "notes": [


                    "吊顶龙骨：主龙骨间距不大于80cm，副龙骨不大于40cm",


                    "石膏板转角整板套割L型，避免后期开裂",


                    "板缝倒V型槽，嵌缝膏补平后贴绷带防裂",


                    "窗帘盒预埋，尺寸要够（手动≥15cm，电动≥20cm）",


                    "电动窗帘预留电源和86盒，位置在窗帘盒旁边",


                    "定制柜和吊顶衔接的尺寸，提前和定制商家沟通确认"


                ],


                "checklist": [


                    "龙骨安装牢固，间距规范",


                    "转角整板套割，防裂工艺到位",


                    "窗帘盒已预埋",


                    "电动窗帘电源+86盒已预留（如需要）",


                    "定制柜和吊顶衔接尺寸已沟通"


                ]


            },


            "completionFeedback": {


                "nianText": "木工完工啦！吊顶和造型都有模有样了，真不错~ 接下来油工进场刷墙，墙面颜值全靠这一步了哦！",


                "nextHint": "下一步：油漆工程，墙面滑溜溜"


            }


        },


        {


            "id": "S-14",


            "stageIndex": 2,


            "stepIndex": 4,


            "title": "油漆工程",


            "description": "腻子、乳胶漆，平整度达标，高湿天气别刷漆。",


            "nianTip": "油漆工程可是面子工程呢，墙面平不平、颜色匀不匀一眼就能看出来。平整度要≤2mm，一底两面不能少。高湿天气可别刷漆哦，湿度太大影响质量。自装的话油漆材料一定要买好的，环保很重要，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "腻子粉",


                    "qty": "10-20袋",


                    "price": "30-80元/袋",


                    "brands": [


                        "美巢",


                        "立邦"


                    ],


                    "tips": "耐水腻子",


                    "category": "油漆材料"


                },


                {


                    "name": "乳胶漆",


                    "qty": "2-3桶",


                    "price": "300-1000元/桶",


                    "brands": [


                        "立邦",


                        "多乐士",


                        "芬琳"


                    ],


                    "tips": "一底两面，环保净味",


                    "category": "油漆材料"


                }


            ],


            "materialCategory": "油漆材料",


            "riskWarning": "高湿天气别刷漆",


            "guide": {


                "text": "油漆是面子工程，决定了墙面的最终效果。腻子刮2-3遍，每遍干透了再刮下一遍；打磨要平整，平整度≤2mm；底漆必须刷，面漆刷两遍，一底两面。高湿天气不要刷漆，湿度太大影响质量。自装的话油漆材料一定要选环保的，住得放心。",


                "notes": [


                    "新旧墙体、开槽处要挂网，防止后期开裂",


                    "腻子刮2-3遍，每遍都要等干透了再刮下一遍",


                    "打磨用320目以上砂纸，平整度≤2mm/2m靠尺",


                    "底漆必须刷：封闭基层、节省面漆、防止返碱",


                    "面漆刷两遍，一底两面，无流挂、无色差",


                    "高湿天气禁止刷漆，湿度太大",


                    "选环保净味漆，入住更放心"


                ],


                "checklist": [


                    "挂网防裂处理到位",


                    "平整度≤2mm",


                    "一底两面，涂刷均匀无流挂",


                    "色温统一，无色差开裂",


                    "高湿天气未施工"


                ]


            },


            "completionFeedback": {


                "nianText": "油漆完工啦！墙面滑溜溜的，颜色也好好看~ 接下来定制柜还在生产，您可以趁这段时间把主材都定好哦！",


                "nextHint": "下一步：跟进定制生产+定主材"


            }


        },


        {


            "id": "S-15",


            "stageIndex": 3,


            "stepIndex": 0,


            "title": "跟进定制生产+定主材",


            "description": "跟进定制进度，订购木门/地板/卫浴/灯具，提前约安装时间。",


            "nianTip": "定制柜生产的这段时间可别闲着哦~ 自装的话您要跟进定制生产进度，同时把木门、地板、卫浴、灯具这些主材都定好，提前约好安装时间，别等柜子到了主材还没下单，工期就拖了。您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "木门",


                    "qty": "3-5樘",


                    "price": "1000-5000元/樘",


                    "brands": [


                        "TATA",


                        "欧派",


                        "本地木门"


                    ],


                    "tips": "提前定制，生产周期30-45天",


                    "category": "门窗"


                },


                {


                    "name": "地板",


                    "qty": "按需㎡",


                    "price": "100-400元/㎡",


                    "brands": [


                        "圣象",


                        "大自然",


                        "德尔"


                    ],


                    "tips": "提前选好款式，确定安装时间",


                    "category": "地板"


                },


                {


                    "name": "卫浴洁具",


                    "qty": "1套",


                    "price": "3000-10000元",


                    "brands": [


                        "TOTO",


                        "科勒",


                        "九牧"


                    ],


                    "tips": "马桶、花洒、浴室柜等",


                    "category": "卫浴"


                },


                {


                    "name": "灯具",


                    "qty": "全屋",


                    "price": "2000-5000元",


                    "brands": [


                        "欧普",


                        "雷士",


                        "飞利浦"


                    ],


                    "tips": "客厅主灯、卧室灯、筒灯射灯等",


                    "category": "灯具"


                }


            ],


            "materialCategory": "主材",


            "riskWarning": "提前约安装时间",


            "guide": {


                "text": "定制柜生产周期一般30-45天，这段时间不能闲着。自装的话要主动跟进定制生产进度，避免延期。同时把木门、地板、卫浴、灯具、五金这些主材都订购好，因为很多主材也有生产周期。提前约好各项安装时间，衔接好工期，避免误工。",


                "notes": [


                    "定期跟进定制柜生产进度，避免延期",


                    "订购木门：生产周期30-45天，要提前定",


                    "订购地板、卫浴、灯具、五金等主材",


                    "提前约好各项安装时间，衔接好工期",


                    "主材进场前核对型号和数量",


                    "自装要自己协调好各工种和主材的进场时间"


                ],


                "checklist": [


                    "定制生产进度正常",


                    "木门已下单",


                    "地板已下单",


                    "卫浴已下单",


                    "灯具已下单",


                    "已提前约安装时间"


                ]


            },


            "completionFeedback": {


                "nianText": "主材都定好啦，定制进度也正常，准备工作做得真充分~ 接下来安装阶段开始了，先装集成吊顶和厨卫电器哦！",


                "nextHint": "下一步：集成吊顶+厨卫电器"


            }


        },


        {


            "id": "S-16",


            "stageIndex": 3,


            "stepIndex": 1,


            "title": "集成吊顶+厨卫电器",


            "description": "安装吊顶、电器，安装平整，功能正常。",


            "nianTip": "安装阶段开始啦，先装集成吊顶~ 自装的话这些都是您自己采购的，送货的时候记得验收一下型号哦。吊顶要平整，电器功能要试一下。有问题当场提出来，别等装完了再说，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "集成吊顶",


                    "qty": "按需㎡",


                    "price": "100-300元/㎡",


                    "brands": [


                        "友邦",


                        "奥普",


                        "法狮龙"


                    ],


                    "tips": "铝扣板吊顶，防潮易清洁",


                    "category": "吊顶"


                },


                {


                    "name": "浴霸/排气扇",


                    "qty": "1-2台",


                    "price": "500-2000元/台",


                    "brands": [


                        "奥普",


                        "松下",


                        "欧普"


                    ],


                    "tips": "风暖型更舒适安全",


                    "category": "厨卫电器"


                }


            ],


            "materialCategory": "吊顶/厨卫电器",


            "riskWarning": "",


            "guide": {


                "text": "集成吊顶安装要注意平整度，缝隙均匀。浴霸、排气扇等电器要安装牢固，功能测试正常。卫生间吊顶要预留检修口，方便后期维修。自装的话要自己盯安装质量，有问题当场提出来，及时整改。",


                "notes": [


                    "吊顶安装平整，缝隙均匀，扣板无划痕变形",


                    "电器安装牢固，功能测试正常（取暖、照明、换气）",


                    "卫生间预留检修口，方便后期维修",


                    "浴霸要装在淋浴区外面，避免直接对着人吹",


                    "排气扇管道要接到室外，不能只排在吊顶里",


                    "自装要盯紧安装质量，有问题当场提"


                ],


                "checklist": [


                    "吊顶安装平整",


                    "电器功能正常",


                    "已预留检修口",


                    "排气管道已接至室外"


                ]


            },


            "completionFeedback": {


                "nianText": "吊顶和厨卫电器装好了~ 接下来装室内门和踢脚线，记得先装门后装定制柜哦，这样收口更好看！",


                "nextHint": "下一步：室内门+踢脚线安装"


            }


        },


        {


            "id": "S-17",


            "stageIndex": 3,


            "stepIndex": 2,


            "title": "室内门+踢脚线",


            "description": "安装木门、踢脚线，开合顺畅，收口平整，先装门后装柜。",


            "nianTip": "装门啦，家的感觉越来越浓了~ 自装的话木门也是您自己选的，安装前记得核对一下型号和颜色哦。门要开合顺畅，缝隙均匀才好看。还有哦，要先装门再装定制柜，这样门套和柜子的收口更自然美观，您记住这个顺序了吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "木门+门套",


                    "qty": "3-5樘",


                    "price": "1000-5000元/樘",


                    "brands": [


                        "TATA",


                        "欧派",


                        "本地木门"


                    ],


                    "tips": "选实木复合的，性价比高",


                    "category": "门窗"


                },


                {


                    "name": "踢脚线",


                    "qty": "按需米",


                    "price": "15-50元/米",


                    "brands": [


                        "同地板品牌",


                        "木门同品牌"


                    ],


                    "tips": "选和地板或门同色系",


                    "category": "辅材"


                }


            ],


            "materialCategory": "门窗/辅材",


            "riskWarning": "先装门后装柜",


            "guide": {


                "text": "室内门安装要注意垂直度，开合顺畅，缝隙均匀。门套要垂直，打胶均匀美观。踢脚线安装要平整，接缝严密。安装顺序很重要：先装门，后装定制柜，这样门套和柜子的收口更自然。自装的话要盯好安装质量，有问题当场提。",


                "notes": [


                    "木门安装垂直，开合顺畅，无卡顿异响",


                    "门缝均匀，符合标准（2-3mm）",


                    "门套打胶均匀美观，无毛刺",


                    "踢脚线安装平整，接缝严密，阴阳角处理到位",


                    "安装顺序：先装门，后装定制柜，收口更自然",


                    "定制柜和门套衔接的地方，提前和定制商家沟通尺寸"


                ],


                "checklist": [


                    "木门开合顺畅",


                    "缝隙均匀",


                    "门套安装垂直美观",


                    "踢脚线安装平整",


                    "先装门后装定制柜的顺序已确认"


                ]


            },


            "completionFeedback": {


                "nianText": "门和踢脚线都装好了，真好看~ 接下来就是全屋定制柜安装了，这可是收纳的重头戏，您期待吗？",


                "nextHint": "下一步：全屋定制柜安装，收纳大升级"


            }


        },


        {


            "id": "S-18",


            "stageIndex": 3,


            "stepIndex": 3,


            "title": "全屋定制柜安装",


            "description": "定制柜送货安装、收口，板材/五金/花色一致，安装牢固，外露区域美缝修补。",


            "nianTip": "定制柜终于到货安装啦，想想就激动~ 安装前先核对一下板材、五金、花色是不是和约定的一样，别送错了哦。安装时要保护好墙面地面，有磕碰当场修。柜体外露的地方还要补一下美缝，有问题当场改，别等安装完再说，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "定制柜送货安装",


                    "qty": "全屋",


                    "price": "按订单",


                    "brands": [


                        "索菲亚",


                        "欧派",


                        "本地定制"


                    ],


                    "tips": "送货上门并安装",


                    "category": "定制"


                }


            ],


            "materialCategory": "定制",


            "riskWarning": "有问题当场改",


            "guide": {


                "text": "定制柜安装是大日子，安装前先验货：板材、五金、花色是不是和约定的一致。安装时注意保护墙面和地面，有磕碰当场修补。安装完要检查牢固度、门缝均匀、抽屉顺畅、收口美观。柜体外露区域的瓷砖美缝要补一下。有问题当场提出当场改，别等安装完再说。",


                "notes": [


                    "送货时先验货：板材品牌、花色、五金品牌与订单一致",


                    "安装前做好成品保护，避免磕碰墙面地面",


                    "安装牢固，柜体水平垂直，无晃动",


                    "柜门缝隙均匀，开合顺畅，阻尼有效",


                    "抽屉推拉顺滑，承重没问题",


                    "收口美观，缝隙均匀",


                    "柜体外露区域的瓷砖美缝要修补",


                    "有磕碰当场修补，别等安装完再说"


                ],


                "checklist": [


                    "板材/五金/花色与约定一致",


                    "安装牢固",


                    "收口美观",


                    "柜门缝隙均匀，开合顺畅",


                    "抽屉推拉顺滑",


                    "柜体外露区域美缝已修补",


                    "墙面地面无磕碰损坏"


                ]


            },


            "completionFeedback": {


                "nianText": "定制柜装好啦！收纳空间一下子就有了，太棒了~ 接下来装木地板、卫浴和灯具，家马上就要成型了哦！",


                "nextHint": "下一步：木地板+卫浴+灯具安装"


            }


        },


        {


            "id": "S-19",


            "stageIndex": 3,


            "stepIndex": 4,


            "title": "木地板+卫浴+灯具安装",


            "description": "依次安装，进场验收，功能正常，地板最后装。",


            "nianTip": "安装进入收尾阶段啦~ 自装的话这些都是您自己采购的，进场的时候都核对一下型号，别送错了。木地板要最后装，防止前面施工磕碰坏。安装完都试一下功能，确保正常使用，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "木地板",


                    "qty": "按需㎡",


                    "price": "100-400元/㎡",


                    "brands": [


                        "圣象",


                        "大自然",


                        "德尔"


                    ],


                    "tips": "实木复合性价比高，稳定性好",


                    "category": "地板"


                },


                {


                    "name": "卫浴洁具",


                    "qty": "1套",


                    "price": "3000-10000元",


                    "brands": [


                        "TOTO",


                        "科勒",


                        "九牧"


                    ],


                    "tips": "马桶、花洒、浴室柜等",


                    "category": "卫浴"


                },


                {


                    "name": "灯具",


                    "qty": "全屋",


                    "price": "2000-5000元",


                    "brands": [


                        "欧普",


                        "雷士",


                        "飞利浦"


                    ],


                    "tips": "客厅主灯、卧室灯、筒灯射灯等",


                    "category": "灯具"


                },


                {


                    "name": "五金挂件",


                    "qty": "若干",


                    "price": "500-2000元",


                    "brands": [


                        "九牧",


                        "箭牌",


                        "恒洁"


                    ],


                    "tips": "毛巾架、置物架、挂钩等",


                    "category": "五金"


                }


            ],


            "materialCategory": "主材",


            "riskWarning": "地板最后装",


            "guide": {


                "text": "这一步安装项目比较多：木地板、卫浴洁具、灯具、五金挂件。自装模式下这些都是业主自己采购的，进场时要核对型号和数量。注意木地板要最后装，防止前面施工磕碰损坏。所有材料进场时都核对一下型号，安装完都测试一下功能是否正常。",


                "notes": [


                    "木地板最后安装，防止磕碰损坏",


                    "地板安装前检查地面平整度，误差≤2mm",


                    "地板提前进场适应温湿度，铺的时候留伸缩缝",


                    "卫浴洁具进场核对型号，安装后测试冲水、排水、密封",


                    "灯具进场核对型号，安装后试亮，开关控制正确",


                    "五金挂件安装牢固，位置合理",


                    "所有安装项目完成后逐一测试功能"


                ],


                "checklist": [


                    "进场已核对型号",


                    "木地板安装完成无空响",


                    "卫浴安装完成功能正常",


                    "灯具安装完成全部点亮",


                    "五金挂件安装牢固",


                    "木地板最后安装，无磕碰"


                ]


            },


            "completionFeedback": {


                "nianText": "地板、卫浴、灯具都装好了，家的样子完完整整啦！接下来做一下美缝补缝和细节修补，马上就要完工了哦！",


                "nextHint": "下一步：美缝补缝+细节修补"


            }


        },


        {


            "id": "S-20",


            "stageIndex": 4,


            "stepIndex": 0,


            "title": "美缝补缝+细节修补",


            "description": "柜体遮挡区域补缝，补缝平整。",


            "nianTip": "定制柜装好了，柜体遮挡的地方之前没做美缝，现在要补一下哦~ 补缝要平整，和之前的美缝衔接自然。还有装修过程中难免有一些小磕碰小瑕疵，最后统一修补一下就完美了，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "美缝剂",


                    "qty": "2-5支",


                    "price": "30-100元/支",


                    "brands": [


                        "同之前美缝品牌"


                    ],


                    "tips": "和之前颜色一致",


                    "category": "瓷砖"


                }


            ],


            "materialCategory": "瓷砖/美缝",


            "riskWarning": "",


            "guide": {


                "text": "定制柜安装完成后，柜体遮挡的区域之前没做美缝，现在要补缝。补缝要注意和之前的美缝颜色一致，平整光滑。同时检查一下全屋，有什么小磕碰、小瑕疵的，统一修补一下。自装的话自己能动手的可以自己补，省点钱。",


                "notes": [


                    "柜体遮挡区域补缝，颜色和之前一致",


                    "补缝要平整光滑，衔接自然",


                    "检查全屋，修补小磕碰、小瑕疵",


                    "墙面、瓷砖、五金有问题的都修补一下",


                    "自装可以自己动手修补，省钱又有成就感"


                ],


                "checklist": [


                    "柜体遮挡区域美缝已补",


                    "补缝平整",


                    "颜色一致",


                    "细节修补完成"


                ]


            },


            "completionFeedback": {


                "nianText": "美缝补好了，细节也修补完啦，越来越完美了~ 接下来开荒保洁，把家打扫得干干净净的！",


                "nextHint": "下一步：开荒保洁+通风散味"


            }


        },


        {


            "id": "S-21",


            "stageIndex": 4,


            "stepIndex": 1,


            "title": "开荒保洁+通风散味",


            "description": "清洁、通风，无施工残留，空气质量检测（有孕妇/婴幼儿必做）。",


            "nianTip": "开荒保洁建议找专业团队来做，他们工具齐全，效率高效果好。保洁的时候您要在旁边盯着，别让他们用钢丝球擦瓷砖和玻璃，会刮花的。保洁完一定要多通风，有孕妇和宝宝的家庭，一定要做CMA空气质量检测哦，安全第一，您说对吗？",


            "aiTrigger": false,


            "aiType": null,


            "materials": [


                {


                    "name": "保洁服务",


                    "qty": "1次",


                    "price": "8-15元/㎡",


                    "brands": [


                        "专业保洁公司"


                    ],


                    "tips": "按建筑面积算",


                    "category": "服务"


                }


            ],


            "materialCategory": "服务",


            "riskWarning": "空气达标再入住",


            "guide": {


                "text": "开荒保洁是入住前最彻底的一次清洁，建议找专业团队，工具齐全效率高。保洁时要在旁边盯着，别让保洁用钢丝球擦瓷砖和玻璃，也别用强酸强碱清洁剂。保洁完要开窗通风散味。有孕妇/婴幼儿的家庭，一定要做CMA空气质量检测，达标了再入住。",


                "notes": [


                    "开荒保洁建议找专业团队，工具齐全效率高",


                    "保洁时盯着，别让用钢丝球擦瓷砖和玻璃",


                    "别让用强酸强碱清洁剂，会腐蚀表面",


                    "保洁重点：玻璃、瓷砖缝隙、柜子内外、窗台门缝",


                    "保洁完开窗通风散味",


                    "有孕妇/婴幼儿必做CMA空气质量检测",


                    "空气达标再入住，安全第一"


                ],


                "checklist": [


                    "无施工残留",


                    "玻璃门窗清洁透亮无水印",


                    "地面墙面无残留污渍",


                    "柜子内外全部擦拭干净",


                    "五金件清洁光亮",


                    "已开窗通风",


                    "有孕妇/婴幼儿已做空气质量检测"


                ]


            },


            "completionFeedback": {


                "nianText": "保洁做完啦，家变得亮堂堂的，真舒服~ 通风一段时间，空气达标了就可以入住啦！不过入住前别忘了做竣工验收哦！",


                "nextHint": "下一步：竣工验收+尾款结算"


            }


        },


        {


            "id": "S-22",


            "stageIndex": 4,


            "stepIndex": 2,


            "title": "竣工验收+尾款结算",


            "description": "逐项检查各工种完工质量，对照标准逐项验收，各工种尾款结算完毕。",


            "nianTip": "终于到竣工验收啦，恭喜恭喜！自装的话要逐项检查各工种的完工质量，对照标准一项一项来。有问题的地方让工人整改，整改好了再付尾款。记住：工人验收合格再付全款，钱在您手里您才有主动权，您说对吗？",


            "aiTrigger": true,


            "aiType": "inspection",


            "materials": [


                {


                    "name": "各工种尾款",


                    "qty": "若干",


                    "price": "按约定",


                    "brands": [


                        "各工种工人"


                    ],


                    "tips": "验收合格后支付",


                    "category": "工程款"


                }


            ],


            "materialCategory": "工程款",


            "riskWarning": "工人验收合格再付全款",


            "guide": {


                "text": "竣工验收是最后一关，自装模式下要逐项验收：水电、泥瓦、木工、油漆，每个工种都要对照标准检查。所有功能都要测试一遍。有问题的地方记录下来，限期整改，整改完复验。每个工种的尾款要等验收合格了再付，不要提前付清。保留好所有的收据和凭证。",


                "notes": [


                    "逐项验收：水电工程、泥瓦工程、木工工程、油漆工程",


                    "对照标准逐项检查，不要放过任何细节",


                    "所有功能都要测试，确保正常使用",


                    "有问题书面记录，限期整改，整改完复验",


                    "各工种验收合格后再付尾款",


                    "保留好所有收据、订单、保修卡",


                    "整理各商家的联系方式，后期维修用得上"


                ],


                "checklist": [


                    "对照标准逐项验收",


                    "水电工程合格",


                    "泥瓦工程合格",


                    "木工工程合格",


                    "油漆工程合格",


                    "功能全部正常",


                    "各工种尾款结算完毕",


                    "所有保修凭证已整理好"


                ]


            },


            "completionFeedback": {


                "nianText": "恭喜您！竣工验收通过啦，自装圆满完成！从小管家陪着您一步步走过来，真的超有成就感~ 您太厉害了，自己装出了一个梦想中的家！祝您在新家里开启美好生活，每天都开开心心的！以后有任何问题都可以来找我哦~",


                "nextHint": "装修完成！开启你的美好生活吧~"


            }


        }


        ]


    };


    var MODE_STAGES = {


        full: [


            { id: 1, title: '设计规划', icon: 'ruler' },


            { id: 2, title: '拆改水电', icon: 'hammer' },


            { id: 3, title: '泥木油漆', icon: 'paintbrush' },


            { id: 4, title: '安装阶段', icon: 'window' },


            { id: 5, title: '竣工收尾', icon: 'check' }


        ],


        half: [


            { id: 1, title: '设计规划', icon: 'ruler' },


            { id: 2, title: '拆改水电', icon: 'hammer' },


            { id: 3, title: '泥木油漆', icon: 'paintbrush' },


            { id: 4, title: '安装阶段', icon: 'window' },


            { id: 5, title: '竣工收尾', icon: 'check' }


        ],


        self: [


            { id: 1, title: '前期准备', icon: 'ruler' },


            { id: 2, title: '拆改水电', icon: 'hammer' },


            { id: 3, title: '泥木油漆', icon: 'paintbrush' },


            { id: 4, title: '安装阶段', icon: 'window' },


            { id: 5, title: '竣工收尾', icon: 'check' }


        ]


    };


    var PAYMENT_NODES = {


        full: [


            { name: '签约首期', percent: '20%-40%', step: '步骤4', content: '方案确认、合同签署' },


            { name: '水电验收', percent: '20%-25%', step: '步骤10后', content: '水电隐蔽工程验收合格' },


            { name: '中期验收', percent: '20%-25%', step: '步骤17', content: '泥瓦+木工+油漆全部合格' },


            { name: '竣工尾款', percent: '10%-15%', step: '步骤23', content: '全部完工+资料移交' },


            { name: '质保金', percent: '3%-5%', step: '—', content: '防水保修满5年后返还（单独约定，不得抵扣增项）' }


        ],


        half: [


            { name: '签约首期', percent: '30%', step: '步骤4', content: '合同签署' },


            { name: '水电验收', percent: '30%', step: '步骤10后', content: '水电隐蔽工程验收合格' },


            { name: '泥木验收', percent: '30%', step: '步骤17', content: '泥瓦+木工验收合格' },


            { name: '竣工尾款', percent: '10%', step: '步骤23', content: '全部完工验收' }


        ],


        self: [


            { name: '工人付款', percent: '进场≤20%生活费', step: '各工种进场', content: '进场付少量生活费，完工验收合格付全款' },


            { name: '材料付款', percent: '现货全款/定制30-50%定金', step: '采购时', content: '现货全款，定制类付30%-50%定金，安装验收合格付尾款' },


            { name: '设备付款', percent: '大促节点采购', step: '采购时', content: '大促节点采购控价，中央空调等先付定金，安装验收后付尾款' },


            { name: '安全提醒', percent: '—', step: '开工前', content: '建议购买短期意外险（约50-100元/人/月）和装修工程责任险' },


            { name: '质保留存', percent: '5%-10%质保金', step: '完工后', content: '建议各工种留存5%-10%作为质保金，满1年后无问题再结清。水电/防水要求书面质保承诺' }


        ]


    };


    var CONTRACT_TEXT = `


        <h4>住宅装饰装修工程施工合同</h4>


        <p>发包方（甲方）：__________ 身份证号：__________</p>


        <p>承包方（乙方）：XX装饰工程有限公司</p>


        <p><strong>第一条 工程概况</strong></p>


        <p>1.1 工程地点：__________</p>


        <p>1.2 工程内容及做法（详见施工图和预算书）</p>


        <p>1.3 工程承包方式：半包</p>


        <p>1.4 工期：自____年__月__日开工，至____年__月__日竣工，工期__天。</p>


        <p><strong>第二条 工程价款</strong></p>


        <p>2.1 工程总价款：人民币______元整（￥______）</p>


        <p>2.2 付款方式：</p>


        <p>（1）开工前支付60%，即______元</p>


        <p>（2）工程进度过半支付35%，即______元</p>


        <p>（3）竣工验收合格支付5%，即______元</p>


        <p><strong>第三条 质量要求</strong></p>


        <p>3.1 工程使用主要材料的品种、规格、名称，需经双方认可。</p>


        <p>3.2 工程质量标准：按照相关标准执行。</p>


        <p><strong>第四条 材料供应</strong></p>


        <p>4.1 乙方负责采购的材料应为合格产品。</p>


        <p>4.2 甲方提供的材料应按时供应到现场。</p>


        <p><strong>第五条 工程工期</strong></p>


        <p>5.1 因乙方原因造成工期延误，每日按工程款的0.1‰支付违约金。</p>


        <p><strong>第六条 质量保修</strong></p>


        <p>6.1 工程竣工后，乙方提供必要的保修服务。</p>


        <p><strong>第七条 其他事项</strong></p>


        <p>7.1 施工过程中如有增项，双方另行协商。</p>


        <p>7.2 本合同一式两份，双方各执一份。</p>


    `;


    var RISKS = [


        {


            id: 1,


            name: '工期延误违约金比例严重偏低',


            level: 'high',


            levelText: '高风险',


            position: '第五条 工程工期 第5.1款',


            problem: '每日违约金仅为工程款的0.1‰，按10万工程款计算每天仅10元，延误一个月才300元，对装修公司几乎没有约束力。',


            suggestion: '建议提高至每日0.3‰-0.5‰，并明确累计违约金上限不低于合同总价款的10%。同时增加因甲方原因延误的处理方式，权利义务对等。',


            highlightText: '每日按工程款的0.1‰支付违约金'


        },


        {


            id: 2,


            name: '材料供应约定模糊，存在以次充好风险',


            level: 'high',


            levelText: '高风险',


            position: '第四条 材料供应 第4.1款',


            problem: '仅约定"乙方负责采购的材料应为合格产品"，未明确品牌、型号、规格、等级、数量，也未约定材料进场验收程序和不合格材料的退换责任。',


            suggestion: '应在合同附件《材料清单明细表》中逐一列明材料品牌、型号、规格、等级、数量；约定材料进场时甲方验收签字后方可使用；不合格材料乙方需无偿退换并承担工期延误责任。',


            highlightText: '乙方负责采购的材料应为合格产品'


        },


        {


            id: 3,


            name: '付款节点对甲方不利，前期付款比例过高',


            level: 'medium-high',


            levelText: '中高风险',


            position: '第二条 工程价款 第2.2款',


            problem: '开工前即支付60%工程款，此时尚未产生任何实际工程量，甲方风险极大。若装修公司卷款跑路或施工质量不达标，甲方将非常被动。',


            suggestion: '建议调整为分4-5期付款：开工预付30%、水电验收合格付30%、瓦工木工完工付30%、竣工验收合格付5%、质保期满付5%（或竣工10%）。每笔付款前需经验收签字确认。',


            highlightText: '开工前支付60%'


        },


        {


            id: 4,


            name: '质量保修条款过于笼统，缺乏可执行性',


            level: 'medium',


            levelText: '中等风险',


            position: '第六条 质量保修 第6.1款',


            problem: '"必要的保修服务"表述模糊，未明确各分项工程的具体保修期限、保修范围、响应时间、免责条款等。出现纠纷时难以界定责任。',


            suggestion: '应明确约定：防水工程保修5年、水电管线工程保修2年、其他装修工程保修1年；保修期从竣工验收合格之日起计算；乙方需在接到报修后48小时内上门处理；非人为损坏免费维修。',


            highlightText: '提供必要的保修服务'


        },


        {


            id: 5,


            name: '工程增项无明确约定，易产生恶意增项纠纷',


            level: 'high',


            levelText: '高风险',


            position: '第七条 其他事项 第7.1款',


            problem: '"双方另行协商"等于没有约定，实践中装修公司常通过恶意增项加价获利。施工过程中甲方往往因赶工期而被迫接受不合理报价。',


            suggestion: '应明确约定：1）增项必须提前7天书面报甲方，附价格明细；2）增项单价参考预算书中同类项目单价；3）甲方签字确认后方可施工；4）未经确认的增项甲方有权拒绝付款；5）增项总金额不得超过合同总价的10%。',


            highlightText: '如有增项，双方另行协商'


        }


    ];


    var DECORATION_ENCYCLOPEDIA = [


        {


            stageIndex: 0,


            priceReference: '设计费 50-150元/㎡，设计+施工一体化可免设计费',


            durationReference: '7-15天，主要耗时在沟通和方案修改',


            materialSelection: '无，此阶段主要是设计',


            commonQuestions: [


                '设计不满意怎么办？',


                '签合同前要注意什么？',


                '预算怎么分配？'


            ]


        },


        {


            stageIndex: 1,


            priceReference: '水电改造 80-150元/㎡，拆墙 30-50元/㎡，防水 50-80元/㎡',


            durationReference: '15-25天，水电改造最耗时',


            materialSelection: '电线选BV线、水管选PPR管、防水材料选柔性防水',


            commonQuestions: [


                '水电改造怎么验收？',


                '防水怎么做？',


                '拆墙要注意什么？'


            ]


        },


        {


            stageIndex: 2,


            priceReference: '瓷砖 60-200元/㎡，地板 80-300元/㎡，橱柜 1500-4000元/延米',


            durationReference: '20-30天，瓷砖铺贴最耗时',


            materialSelection: '瓷砖选广东砖、地板选实木复合、橱柜选多层实木板',


            commonQuestions: [


                '瓷砖空鼓怎么办？',


                '地板安装要注意什么？',


                '橱柜怎么选？'


            ]


        },


        {


            stageIndex: 3,


            priceReference: '灯具 2000-5000元/套，洁具 3000-8000元/套，窗帘 30-80元/㎡',


            durationReference: '10-15天，家具安装最耗时',


            materialSelection: '灯具选可调光、洁具选虹吸式、窗帘选遮光布',


            commonQuestions: [


                '灯具怎么选？',


                '洁具怎么选？',


                '窗帘怎么选？'


            ]


        },


        {


            stageIndex: 4,


            priceReference: '开荒保洁 3-5元/㎡，甲醛治理 30-50元/㎡',


            durationReference: '3-5天，甲醛检测和治理最耗时',


            materialSelection: '无，此阶段主要是清洁和检测',


            commonQuestions: [


                '开荒保洁怎么做？',


                '甲醛怎么检测？',


                '搬家注意什么？'


            ]


        },


        {


            stageIndex: 5,


            priceReference: '无额外费用',


            durationReference: '1天',


            materialSelection: '无',


            commonQuestions: [


                '竣工验收要检查什么？',


                '质保期多久？',


                '后期维护注意什么？'


            ]


        }


    ];


    function getDecorationMode() {


        if (App && App.state && App.state.userData && App.state.userData.decorationMode) {


            return App.state.userData.decorationMode;


        }


        return 'full';


    }


    // 自装安全责任强制模块
    // 高危工种步骤：拆改(S-4)、暖通(S-7)、水电(S-8)
    function isHighRiskStep(stepId) {
        var mode = getDecorationMode();
        if (mode !== 'self') return false;
        var highRiskSteps = ['S-4', 'S-7', 'S-8'];
        return highRiskSteps.indexOf(stepId) !== -1;
    }


    function isSelfDecorationMode() {
        return getDecorationMode() === 'self';
    }


    function renderSafetyBanner() {
        if (!isSelfDecorationMode()) return '';
        var progress = getProgress();
        if (progress && progress.safetyBannerDismissed) return '';
        if (progress && progress.completedSteps && progress.completedSteps.length > 0) return '';
        return '<div class="sop-safety-banner" id="sop-safety-banner"><div class="sop-safety-banner-content"><span class="sop-safety-banner-icon">⚠️</span><div class="sop-safety-banner-text"><strong>自装安全提醒</strong>：装修过程中请注意施工安全，高危工种请工人购买意外险</div></div><button class="sop-safety-banner-close" id="sop-safety-banner-close">×</button></div>';
    }


    function dismissSafetyBanner() {
        var banner = document.getElementById('sop-safety-banner');
        if (banner) {
            banner.style.display = 'none';
        }
        // 保存到sopProgress中
        var progress = getProgress();
        if (progress) {
            progress.safetyBannerDismissed = true;
            saveProgress();
        }
    }


    function openModeSwitchModal() {
        var modal = document.getElementById('sop-mode-switch-modal');
        if (!modal) return;
        modeSwitchModalOpen = true;
        selectedModeForSwitch = null;
        renderModeSwitchModal();
        modal.classList.add('active');
    }


    function closeModeSwitchModal() {
        var modal = document.getElementById('sop-mode-switch-modal');
        if (!modal) return;
        modeSwitchModalOpen = false;
        selectedModeForSwitch = null;
        modal.classList.remove('active');
    }


    function renderModeSwitchModal() {
        var body = document.getElementById('sop-mode-switch-modal-body');
        if (!body) return;
        var currentMode = getDecorationMode();
        var currentProgress = getProgress();
        var hasProgress = currentProgress && currentProgress.completedSteps && currentProgress.completedSteps.length > 0;
        var targetMode = selectedModeForSwitch || currentMode;
        var modes = [
            { id: 'full', icon: '🏠', name: '全包装修', desc: '装修公司负责设计、主材、施工，省心省力', cardClass: 'sop-mode-card-full' },
            { id: 'half', icon: '🔨', name: '半包装修', desc: '装修公司负责施工和辅料，主材自己购买', cardClass: 'sop-mode-card-half' },
            { id: 'self', icon: '🛠️', name: '自装模式', desc: '全程自主管理，适合有时间且懂装修的用户', cardClass: 'sop-mode-card-self' }
        ];
        var html = '';
        if (hasProgress && targetMode !== currentMode) {
            html += '<div class="sop-mode-switch-warning">';
            html += '<span class="sop-mode-switch-warning-icon">⚠️</span>';
            html += '<div class="sop-mode-switch-warning-text">切换装修模式将清空当前进度。是否继续？</div>';
            html += '</div>';
        }
        html += '<div class="sop-mode-switch-cards">';
        modes.forEach(function(mode) {
            var isActive = mode.id === currentMode ? ' active' : '';
            var isSelected = mode.id === targetMode ? ' active' : '';
            html += '<div class="sop-mode-switch-card ' + mode.cardClass + isSelected + '" data-mode="' + mode.id + '">';
            html += '<div class="sop-mode-switch-card-icon">' + mode.icon + '</div>';
            html += '<div class="sop-mode-switch-card-info">';
            html += '<div class="sop-mode-switch-card-name">' + mode.name + (mode.id === currentMode ? '（当前）' : '') + '</div>';
            html += '<div class="sop-mode-switch-card-desc">' + mode.desc + '</div>';
            html += '</div>';
            html += '<div class="sop-mode-switch-card-check">✓</div>';
            html += '</div>';
        });
        html += '</div>';
        if (hasProgress && targetMode !== currentMode) {
            html += '<div class="sop-mode-switch-actions">';
            html += '<button class="btn-secondary" id="sop-mode-switch-btn-continue">继续上次</button>';
            html += '<button class="btn-primary" id="sop-mode-switch-btn-restart">重新开始</button>';
            html += '</div>';
        }
        body.innerHTML = html;
    }


    function switchDecorationMode(targetMode, keepProgress) {
        var currentMode = getDecorationMode();
        if (targetMode === currentMode) {
            closeModeSwitchModal();
            return;
        }
        // 如果不是保持进度，则重置进度
        if (!keepProgress) {
            App.state.sopProgress[targetMode] = {
                completedSteps: [],
                currentStep: targetMode === 'full' ? 'F-1' : (targetMode === 'half' ? 'H-1' : 'S-1'),
                currentStage: 0,
                stepPhotos: {},
                stepDelays: {},
                floorplanAnalysis: {},
                matchResults: null,
                safetyBannerDismissed: false
            };
        }
        // 更新当前模式
        App.state.userData.decorationMode = targetMode;
        // 关闭弹窗
        closeModeSwitchModal();
        // 重新渲染
        if (container) {
            render(container);
        }
        App.saveState(true);
    }


    function getSafetyChecklist(stepId) {
        var checklists = {
            'S-4': [
                '已确认无违规拆改承重墙',
                '新建墙体已放拉结筋',
                '现场已配备灭火器',
                '施工人员已购买意外险'
            ],
            'S-7': [
                '中央空调管道已打压测试通过',
                '新风系统已验收合格',
                '地暖打压测试通过无渗漏',
                '施工人员已购买意外险'
            ],
            'S-8': [
                '电线水管材料已验收合格',
                '打压测试通过（8-10公斤30分钟）',
                '已拍照留存水电走向图',
                '施工人员已购买意外险'
            ]
        };
        return checklists[stepId] || [];
    }


    function getSafetyChecklistState(stepId) {
        if (!safetyChecklistState[stepId]) {
            safetyChecklistState[stepId] = {};
        }
        return safetyChecklistState[stepId];
    }


    function toggleSafetyChecklistItem(stepId, index) {
        var state = getSafetyChecklistState(stepId);
        state[index] = !state[index];
        safetyChecklistState[stepId] = state;
        saveSafetyChecklistState();
        updateCompleteButtonState(stepId);
        renderSafetyChecklistUI(stepId);
    }


    function checkSafetyCompleted(stepId) {
        if (!isHighRiskStep(stepId)) return true;
        var checklist = getSafetyChecklist(stepId);
        var state = getSafetyChecklistState(stepId);
        for (var i = 0; i < checklist.length; i++) {
            if (!state[i]) return false;
        }
        return true;
    }


    function updateCompleteButtonState(stepId) {
        var btn = document.getElementById('sop-complete-btn');
        if (!btn) return;
        var allChecked = checkSafetyCompleted(stepId);
        if (allChecked) {
            btn.disabled = false;
            btn.style.opacity = '';
            btn.style.cursor = '';
        } else {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    }


    function renderSafetyChecklistUI(stepId) {
        var container = document.getElementById('sop-safety-checklist');
        if (!container) return;
        var checklist = getSafetyChecklist(stepId);
        var state = getSafetyChecklistState(stepId);
        var html = '<div class="sop-safety-checklist-container"><div class="sop-safety-checklist-title"><span class="sop-safety-checklist-icon">🔒</span><span>安全责任清单</span><span class="sop-safety-checklist-hint">（必须全部勾选才能完成步骤）</span></div>';
        for (var i = 0; i < checklist.length; i++) {
            var isChecked = state[i] ? 'checked' : '';
            html += '<div class="sop-safety-checklist-item ' + isChecked + '" data-index="' + i + '"><div class="sop-checklist-checkbox">' + (state[i] ? '✓' : '') + '</div><span class="sop-checklist-text">' + checklist[i] + '</span></div>';
        }
        html += '</div>';
        container.innerHTML = html;
        var items = container.querySelectorAll('.sop-safety-checklist-item');
        for (var j = 0; j < items.length; j++) {
            items[j].addEventListener('click', (function(idx) {
                return function() {
                    toggleSafetyChecklistItem(stepId, idx);
                };
            })(j));
        }
    }


    function renderSafetyReminderBar(stepId) {
        if (!isHighRiskStep(stepId)) return '';
        return '<div class="sop-safety-reminder-bar"><span class="sop-safety-reminder-icon">🔴</span><span class="sop-safety-reminder-text"><strong>高危工种</strong>：请确认以下安全责任</span></div>';
    }


    function generateSafetyNotice() {
        return '【自装安全责任告知书】\n\n一、施工安全责任\n1. 工人进场前需购买施工意外险，保险有效期需覆盖整个施工周期；\n2. 施工现场必须配备灭火器等消防器材；\n3. 严禁酒后作业、疲劳作业；\n4. 高空作业必须系好安全带；\n5. 特殊工种（电工、焊工等）需持证上岗。\n\n二、安全事故处理\n1. 发生安全事故，应立即启动应急救援预案；\n2. 第一时间拨打120急救电话；\n3. 及时通知业主和保险公司；\n4. 保留现场证据，配合调查处理。\n\n三、免责声明\n1. 因工人自身原因造成的安全事故，由施工方自行承担；\n2. 业主有权要求施工方提供保险证明；\n3. 未购买保险的施工人员禁止进场施工。\n\n业主签字：__________ 日期：__________\n施工负责人：__________ 日期：__________';
    }


    function generateInsuranceReminder() {
        return '【工人意外险购买提醒】\n\n尊敬的业主：\n\n自装模式下，施工安全责任由您自行承担。为保障双方权益，建议您：\n\n1. 要求所有进场施工人员购买「施工人员意外伤害保险」；\n2. 保险额度建议：每人≥30万元，医疗≥3万元；\n3. 保险有效期需覆盖该工种的整个施工周期；\n4. 保留保险单据复印件备查；\n\n推荐保险公司：\n-太平洋保险「装无忧」施工人员意外险\n-平安保险「建筑工程团体意外险」\n-人保财险「装修工程意外险」\n\n请工人进场前务必确认保险购买情况，安全第一！';
    }


    function getCurrentModeStages() {


        var mode = getDecorationMode();


        return MODE_STAGES[mode] || MODE_STAGES.full;


    }


    function getCurrentPaymentNodes() {


        var mode = getDecorationMode();


        return PAYMENT_NODES[mode] || PAYMENT_NODES.full;


    }


    function getCurrentModeSteps() {


        var mode = getDecorationMode();


        return MODE_STEPS[mode] || MODE_STEPS.full;


    }


    function getStepById(id) {


        var steps = getCurrentModeSteps();


        for (var i = 0; i < steps.length; i++) {


            if (steps[i].id === id) {


                return steps[i];


            }


        }


        return null;


    }

    // ========== 装修公司对比工具 ==========

    var COMPANY_COMPARE_KEY = 'sop_f1_company_comparison';
    var LEGACY_COMPANY_COMPARE_KEY = 'sop_f1_company_comparison';
    var MAX_COMPANIES = 5;
    var currentEditingCompanyId = null;
    var companyCompareModalOpen = false;
    var confirmModalCallback = null;
    var deletingCompanyId = null;
    var isAnalyzing = false;
    var analyzingCompanyName = '';
    var inputModalCallback = null;

    function getCompanyList() {
        var data = Storage.load(COMPANY_COMPARE_KEY);
        if (!data) {
            try {
                var legacyData = localStorage.getItem(LEGACY_COMPANY_COMPARE_KEY);
                if (legacyData) {
                    var parsed = JSON.parse(legacyData);
                    Storage.save(COMPANY_COMPARE_KEY, parsed);
                    localStorage.removeItem(LEGACY_COMPANY_COMPARE_KEY);
                    return parsed || [];
                }
            } catch (e) {
                console.error('[SopView] 迁移旧版公司对比数据失败:', e);
            }
            return [];
        }
        return data || [];
    }

    function saveCompanyList(list) {
        Storage.save(COMPANY_COMPARE_KEY, list);
    }

    function addCompany(data) {
        var list = getCompanyList();
        if (list.length >= MAX_COMPANIES) {
            return null;
        }
        var newCompany = {
            id: 'cmp_' + Date.now(),
            name: data.name || '未命名公司',
            price: data.price || '',
            duration: data.duration || '',
            qualification: data.qualification || '',
            reputation: data.reputation || 0,
            includes: data.includes || '',
            addonClarity: data.addonClarity || '',
            afterSales: data.afterSales || '',
            notes: data.notes || ''
        };
        list.push(newCompany);
        saveCompanyList(list);
        return newCompany;
    }

    function updateCompany(id, data) {
        var list = getCompanyList();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        list[i][key] = data[key];
                    }
                }
                list[i].id = id;
                saveCompanyList(list);
                return list[i];
            }
        }
        return null;
    }

    function removeCompany(id) {
        var list = getCompanyList();
        var newList = [];
        for (var i = 0; i < list.length; i++) {
            if (list[i].id !== id) {
                newList.push(list[i]);
            }
        }
        saveCompanyList(newList);
    }

    function clearAllCompanies() {
        saveCompanyList([]);
    }

    function hashString(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    function seededRandom(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function generateCompanyAnalysis(companyName) {
        var seed = hashString(companyName);
        var rand = function(offset) { return seededRandom(seed + offset); };

        var qualificationLevels = ['一级资质', '二级资质', '一级资质', '二级资质', '三级资质'];
        var qualification = qualificationLevels[Math.floor(rand(1) * qualificationLevels.length)];

        var priceBase = 8 + Math.floor(rand(2) * 8);
        var price = priceBase + '万';
        var pricePerSqm = (priceBase * 10000 / 100).toFixed(0) + '元/㎡';

        var durations = ['75天', '80天', '90天', '95天', '100天', '110天', '120天'];
        var duration = durations[Math.floor(rand(3) * durations.length)];

        var reputation = (3.5 + rand(4) * 1.5).toFixed(1);
        var repNum = parseFloat(reputation) || 0;
        if (repNum > 5) reputation = '5.0';

        var includeOptions = [
            '基础装修+主材+洁具+灯具',
            '硬装+定制柜+部分家电',
            '全包装修+全屋定制+软装搭配',
            '基础施工+辅材+主材代购',
            '整装套餐+家具+家电一站式'
        ];
        var includes = includeOptions[Math.floor(rand(5) * includeOptions.length)];

        var addonOptions = ['高', '中', '高', '中', '低'];
        var addonClarity = addonOptions[Math.floor(rand(6) * addonOptions.length)];

        var afterSalesOptions = ['2年整体质保+水电5年', '3年整体+水电6年', '2年质保+终身维护', '1年质保+有偿维修', '3年质保+水电10年'];
        var afterSales = afterSalesOptions[Math.floor(rand(7) * afterSalesOptions.length)];

        var serviceScopes = [
            '家装全案设计、硬装施工、软装搭配、全屋定制、智能家居',
            '住宅装修、别墅设计、旧房改造、局部翻新、软装设计',
            '全包套餐、半包施工、清包装修、主材代购、家具定制',
            '新房装修、老房改造、精装房升级、办公室装修、商铺装修',
            '高端家装、全案设计、园林景观、智能系统、软装配饰'
        ];
        var serviceScope = serviceScopes[Math.floor(rand(8) * serviceScopes.length)];

        var reviewTemplates = [
            '设计师很专业，方案改了3次都很耐心，施工团队工艺不错，瓦工贴砖很平整。增项不算多，基本都在预期内。',
            '整体满意，项目经理负责任，每周都会发工地进度。报价比较透明，签约前讲得很清楚。',
            '施工质量还可以，就是工期稍微拖了一周，不过售后响应很快，有问题都能及时解决。',
            '性价比很高，材料都是品牌的，工人手艺不错。设计师经验丰富，给了很多实用建议。',
            '朋友推荐过来的，确实没失望。从设计到施工全程不用太操心，落地效果和效果图差不多。'
        ];
        var reviews = [];
        var reviewCount = 3 + Math.floor(rand(9) * 3);
        for (var r = 0; r < reviewCount; r++) {
            reviews.push(reviewTemplates[Math.floor(rand(10 + r) * reviewTemplates.length)]);
        }

        var caseTemplates = [
            { area: '89㎡', type: '两居室', style: '现代简约', price: '9.8万' },
            { area: '120㎡', type: '三居室', style: '北欧风格', price: '15.6万' },
            { area: '140㎡', type: '四居室', style: '新中式', price: '22.5万' },
            { area: '95㎡', type: '两室改三室', style: '日式原木', price: '12.3万' },
            { area: '160㎡', type: '大平层', style: '轻奢风', price: '28.8万' },
            { area: '75㎡', type: '老房改造', style: 'ins风', price: '8.5万' }
        ];
        var cases = [];
        var caseCount = 2 + Math.floor(rand(20) * 3);
        for (var c = 0; c < caseCount; c++) {
            var idx = Math.floor(rand(21 + c) * caseTemplates.length);
            cases.push(caseTemplates[idx]);
        }

        var strengths = [
            '设计团队实力强，多次获行业奖项',
            '自有施工团队，不转包，质量有保障',
            '报价透明，无恶意增项',
            '材料供应链成熟，品牌选择多',
            '售后响应快，质保期长',
            '工期把控好，很少延期',
            '设计师经验丰富，方案落地性强',
            '客户口碑好，转介绍率高'
        ];
        var companyStrengths = [];
        var strengthCount = 3 + Math.floor(rand(30) * 2);
        var usedIdx = {};
        for (var s = 0; s < strengthCount; s++) {
            var sIdx = Math.floor(rand(31 + s) * strengths.length);
            if (!usedIdx[sIdx]) {
                usedIdx[sIdx] = true;
                companyStrengths.push(strengths[sIdx]);
            }
        }

        var weaknesses = [
            '高端设计师档期较满，需要提前预约',
            '套餐外可选材料品牌相对有限',
            '热门档期排队时间较长',
            '部分辅材品牌认知度一般',
            '异地施工能力有限'
        ];
        var companyWeaknesses = [];
        var weaknessCount = 1 + Math.floor(rand(40) * 2);
        var usedWIdx = {};
        for (var w = 0; w < weaknessCount; w++) {
            var wIdx = Math.floor(rand(41 + w) * weaknesses.length);
            if (!usedWIdx[wIdx]) {
                usedWIdx[wIdx] = true;
                companyWeaknesses.push(weaknesses[wIdx]);
            }
        }

        return {
            name: companyName,
            price: price,
            pricePerSqm: pricePerSqm,
            duration: duration,
            qualification: qualification,
            reputation: parseFloat(reputation) || 0,
            includes: includes,
            addonClarity: addonClarity,
            afterSales: afterSales,
            serviceScope: serviceScope,
            reviews: reviews,
            cases: cases,
            strengths: companyStrengths,
            weaknesses: companyWeaknesses,
            analyzed: true
        };
    }

    function generateFloorplanAnalysis(imageKey) {
        var seed = hashString(imageKey || 'floorplan_' + Date.now());
        var rand = function(offset) { return seededRandom(seed + offset); };

        var overallScore = Math.round(65 + rand(1) * 30);

        var dimensions = [
            { label: '布局合理性', score: Math.round(60 + rand(2) * 35), weight: 0.25 },
            { label: '空间利用率', score: Math.round(55 + rand(3) * 40), weight: 0.2 },
            { label: '功能分区', score: Math.round(65 + rand(4) * 30), weight: 0.2 },
            { label: '动线设计', score: Math.round(60 + rand(5) * 35), weight: 0.15 },
            { label: '采光通风', score: Math.round(55 + rand(6) * 40), weight: 0.1 },
            { label: '收纳规划', score: Math.round(50 + rand(7) * 45), weight: 0.1 }
        ];

        var advantages = [
            '客餐厅一体化设计，空间感强',
            '主卧带有独立卫生间，私密性好',
            '厨房采用U型布局，操作动线流畅',
            '客厅面宽充足，采光良好',
            '动静分区明确，居住舒适度高',
            '玄关设计合理，有过渡空间',
            '阳台面积大，可拓展空间多',
            '次卧面积适中，功能灵活'
        ];
        var selectedAdvantages = [];
        var advCount = 3 + Math.floor(rand(10) * 2);
        var usedAdv = {};
        for (var a = 0; a < advCount; a++) {
            var idx = Math.floor(rand(11 + a) * advantages.length);
            if (!usedAdv[idx]) {
                usedAdv[idx] = true;
                selectedAdvantages.push(advantages[idx]);
            }
        }

        var disadvantages = [
            '过道面积偏大，存在空间浪费',
            '次卧采光面较小，光线不足',
            '厨房离餐厅较远，传菜动线长',
            '卫生间为暗卫，通风条件差',
            '入户正对卧室门，私密性欠佳',
            '收纳空间不足，需额外规划',
            '餐厅面积偏小，大家庭使用局促',
            '阳台与客厅之间有横梁，影响层高感'
        ];
        var selectedDisadvantages = [];
        var disCount = 2 + Math.floor(rand(20) * 2);
        var usedDis = {};
        for (var d = 0; d < disCount; d++) {
            var didx = Math.floor(rand(21 + d) * disadvantages.length);
            if (!usedDis[didx]) {
                usedDis[didx] = true;
                selectedDisadvantages.push(disadvantages[didx]);
            }
        }

        var suggestions = [
            '建议在过道区域增设嵌入式收纳柜，提高空间利用率',
            '可考虑将厨房改为开放式，增加空间通透感',
            '主卧卫生间建议增加排风系统，改善通风条件',
            '次卧可采用榻榻米设计，增加收纳空间',
            '建议在入户处设置屏风或玄关柜，提升私密性',
            '餐厅可考虑卡座设计，节省空间的同时增加收纳',
            '阳台可改造为休闲区或工作区，拓展使用功能',
            '建议增加全屋智能系统布线预留，提升居住品质'
        ];
        var selectedSuggestions = [];
        var sugCount = 3 + Math.floor(rand(30) * 2);
        var usedSug = {};
        for (var s = 0; s < sugCount; s++) {
            var sidx = Math.floor(rand(31 + s) * suggestions.length);
            if (!usedSug[sidx]) {
                usedSug[sidx] = true;
                selectedSuggestions.push(suggestions[sidx]);
            }
        }

        var roomAnalysis = [
            { name: '客厅', area: (25 + rand(40) * 15).toFixed(1) + '㎡', score: Math.round(70 + rand(41) * 25), comment: '空间开阔，采光良好' },
            { name: '主卧', area: (14 + rand(42) * 8).toFixed(1) + '㎡', score: Math.round(65 + rand(43) * 30), comment: '带独立卫浴，私密性好' },
            { name: '次卧', area: (10 + rand(44) * 6).toFixed(1) + '㎡', score: Math.round(60 + rand(45) * 30), comment: '面积适中，可做多功能房' },
            { name: '厨房', area: (7 + rand(46) * 5).toFixed(1) + '㎡', score: Math.round(65 + rand(47) * 25), comment: 'U型布局，操作方便' },
            { name: '卫生间', area: (4 + rand(48) * 3).toFixed(1) + '㎡', score: Math.round(55 + rand(49) * 35), comment: '空间紧凑，功能齐全' },
            { name: '阳台', area: (6 + rand(50) * 5).toFixed(1) + '㎡', score: Math.round(70 + rand(51) * 25), comment: '面积宽敞，利用率高' }
        ];

        return {
            overallScore: overallScore,
            dimensions: dimensions,
            advantages: selectedAdvantages,
            disadvantages: selectedDisadvantages,
            suggestions: selectedSuggestions,
            roomAnalysis: roomAnalysis,
            analyzedAt: new Date().toLocaleString('zh-CN')
        };
    }

    function handleFloorplanUpload(stepId, file) {
        isAnalyzingFloorplan = true;
        floorplanAnalyzingStep = stepId;
        renderAllSteps();

        var reader = new FileReader();
        reader.onload = function(e) {
            var imageData = e.target.result;
            var imageKey = stepId + '_' + file.name + '_' + file.size;

            addTimer(setTimeout(function() {
                var analysis = generateFloorplanAnalysis(imageKey);
                analysis.imageData = imageData;
                analysis.imageName = file.name;
                var progress = getProgress();
                if (!progress.floorplanAnalysis) {
                    progress.floorplanAnalysis = {};
                }
                progress.floorplanAnalysis[stepId] = analysis;
                isAnalyzingFloorplan = false;
                floorplanAnalyzingStep = null;
                saveProgress();
                renderAllSteps();
            }, 2000));
        };
        reader.readAsDataURL(file);
    }

    function openFloorplanDetailModal(stepId) {
        var progress = getProgress();
        var analysis = progress.floorplanAnalysis && progress.floorplanAnalysis[stepId];
        if (!analysis) return;

        var modalId = 'sop-floorplan-detail-modal';
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        var dimsHtml = analysis.dimensions.map(function(d) {
            var barWidth = d.score;
            var barColor = d.score >= 80 ? '#4CAF50' : d.score >= 60 ? '#FF9800' : '#F44336';
            return `
                <div class="sop-floorplan-dim-item">
                    <div class="sop-floorplan-dim-header">
                        <span class="sop-floorplan-dim-label">${d.label}</span>
                        <span class="sop-floorplan-dim-score">${d.score}分</span>
                    </div>
                    <div class="sop-floorplan-dim-bar">
                        <div class="sop-floorplan-dim-bar-fill" style="width: ${barWidth}%; background: ${barColor};"></div>
                    </div>
                </div>
            `;
        }).join('');

        var roomsHtml = analysis.roomAnalysis.map(function(r) {
            var scoreColor = r.score >= 80 ? '#4CAF50' : r.score >= 60 ? '#FF9800' : '#F44336';
            return `
                <div class="sop-floorplan-room-item">
                    <div class="sop-floorplan-room-name">${r.name}</div>
                    <div class="sop-floorplan-room-area">${r.area}</div>
                    <div class="sop-floorplan-room-score" style="color: ${scoreColor};">${r.score}分</div>
                    <div class="sop-floorplan-room-comment">${r.comment}</div>
                </div>
            `;
        }).join('');

        var advHtml = analysis.advantages.map(function(a) {
            return `<div class="sop-floorplan-tag green">✓ ${a}</div>`;
        }).join('');

        var disHtml = analysis.disadvantages.map(function(d) {
            return `<div class="sop-floorplan-tag orange">⚠ ${d}</div>`;
        }).join('');

        var sugHtml = analysis.suggestions.map(function(s, i) {
            return `<div class="sop-floorplan-suggestion-item"><span class="sop-floorplan-suggestion-num">${i + 1}</span><span>${s}</span></div>`;
        }).join('');

        var modalHtml = `
            <div id="${modalId}" class="sop-floorplan-modal-overlay" data-action="close-floorplan-modal">
                <div class="sop-floorplan-modal" onclick="event.stopPropagation()">
                    <div class="sop-floorplan-modal-header">
                        <div class="sop-floorplan-modal-title">🏠 AI 平面布局图审核报告</div>
                        <button class="sop-floorplan-modal-close" data-action="close-floorplan-modal">×</button>
                    </div>
                    <div class="sop-floorplan-modal-body">
                        <div class="sop-floorplan-overall">
                            <div class="sop-floorplan-overall-score">
                                <div class="sop-floorplan-overall-num">${analysis.overallScore}</div>
                                <div class="sop-floorplan-overall-label">综合评分</div>
                            </div>
                            <div class="sop-floorplan-overall-info">
                                <div class="sop-floorplan-overall-item">
                                    <span class="sop-floorplan-overall-icon">📄</span>
                                    <span>${analysis.imageName || '平面布局图'}</span>
                                </div>
                                <div class="sop-floorplan-overall-item">
                                    <span class="sop-floorplan-overall-icon">🕐</span>
                                    <span>分析时间：${analysis.analyzedAt}</span>
                                </div>
                            </div>
                        </div>

                        <div class="sop-floorplan-section">
                            <div class="sop-floorplan-section-title">📊 六大维度评分</div>
                            <div class="sop-floorplan-dims">
                                ${dimsHtml}
                            </div>
                        </div>

                        <div class="sop-floorplan-section">
                            <div class="sop-floorplan-section-title">🏡 各空间分析</div>
                            <div class="sop-floorplan-rooms">
                                ${roomsHtml}
                            </div>
                        </div>

                        <div class="sop-floorplan-section">
                            <div class="sop-floorplan-section-title">✅ 布局优势</div>
                            <div class="sop-floorplan-tags">
                                ${advHtml}
                            </div>
                        </div>

                        <div class="sop-floorplan-section">
                            <div class="sop-floorplan-section-title">⚠️ 待优化点</div>
                            <div class="sop-floorplan-tags">
                                ${disHtml}
                            </div>
                        </div>

                        <div class="sop-floorplan-section">
                            <div class="sop-floorplan-section-title">💡 优化建议</div>
                            <div class="sop-floorplan-suggestions">
                                ${sugHtml}
                            </div>
                        </div>
                    </div>
                    <div class="sop-floorplan-modal-footer">
                        <button class="sop-floorplan-btn-secondary" data-action="close-floorplan-modal">关闭</button>
                        <button class="sop-floorplan-btn-primary" data-action="copy-floorplan-report" data-step="${stepId}">复制报告</button>
                    </div>
                </div>
            </div>
        `;

        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        var modalEl = tempDiv.firstElementChild;
        document.body.appendChild(modalEl);

        addTimer(requestAnimationFrame(function() {
            modalEl.classList.add('open');
        }));

        modalEl.addEventListener('click', function(e) {
            var closeTarget = e.target.closest('[data-action="close-floorplan-modal"]');
            if (closeTarget) {
                modalEl.classList.remove('open');
                addTimer(setTimeout(function() {
                    modalEl.remove();
                }, 250));
            }

            var copyBtn = e.target.closest('[data-action="copy-floorplan-report"]');
            if (copyBtn) {
                var sId = copyBtn.getAttribute('data-step');
                copyFloorplanReport(sId, copyBtn);
            }
        });

        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modalEl.classList.remove('open');
                setTimeout(function() {
                    modalEl.remove();
                }, 250);
                document.removeEventListener('keydown', escHandler);
            }
        });
    }

    function copyFloorplanReport(stepId, btn) {
        var progress = getProgress();
        var analysis = progress.floorplanAnalysis && progress.floorplanAnalysis[stepId];
        if (!analysis) return;

        var reportText = '🏠 AI 平面布局图审核报告\n';
        reportText += '═══════════════════════════\n\n';
        reportText += '【综合评分】' + analysis.overallScore + '分\n\n';
        reportText += '【六大维度评分】\n';
        analysis.dimensions.forEach(function(d) {
            reportText += '  • ' + d.label + '：' + d.score + '分\n';
        });
        reportText += '\n【布局优势】\n';
        analysis.advantages.forEach(function(a, i) {
            reportText += '  ' + (i + 1) + '. ' + a + '\n';
        });
        reportText += '\n【待优化点】\n';
        analysis.disadvantages.forEach(function(d, i) {
            reportText += '  ' + (i + 1) + '. ' + d + '\n';
        });
        reportText += '\n【优化建议】\n';
        analysis.suggestions.forEach(function(s, i) {
            reportText += '  ' + (i + 1) + '. ' + s + '\n';
        });
        reportText += '\n【各空间分析】\n';
        analysis.roomAnalysis.forEach(function(r) {
            reportText += '  • ' + r.name + '：' + r.area + '，' + r.score + '分 - ' + r.comment + '\n';
        });
        reportText += '\n分析时间：' + analysis.analyzedAt;

        navigator.clipboard.writeText(reportText).then(function() {
            var originalText = btn.textContent;
            btn.textContent = '已复制 ✓';
            btn.style.background = '#4CAF50';
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }).catch(function() {
            var textarea = document.createElement('textarea');
            textarea.value = reportText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            var originalText = btn.textContent;
            btn.textContent = '已复制 ✓';
            btn.style.background = '#4CAF50';
            setTimeout(function() {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        });
    }

    function generateQuoteAudit(totalPrice, area, includedItems) {
        var key = totalPrice + '_' + area + '_' + (includedItems || []).sort().join(',');
        var seed = hashString(key);
        var rand = function(offset) { return seededRandom(seed + offset); };

        var totalPriceNum = parseFloat(totalPrice) || 100000;
        var areaNum = parseFloat(area) || 100;
        var unitPrice = Math.round(totalPriceNum / areaNum);

        var baseScore = 60 + Math.floor(rand(1) * 35);

        var includedSet = {};
        (includedItems || []).forEach(function(item) { includedSet[item] = true; });

        var commonOmissions = [
            { name: '打孔费（空调孔、烟机孔等）', risk: 'high' },
            { name: '垃圾清运费', risk: 'high' },
            { name: '成品保护费', risk: 'medium' },
            { name: '材料搬运费/上楼费', risk: 'medium' },
            { name: '防水高度升级费', risk: 'medium' },
            { name: '厨卫包立管', risk: 'high' },
            { name: '窗台石/门槛石', risk: 'medium' },
            { name: '开关插座面板', risk: 'high' },
            { name: '灯具安装费', risk: 'medium' },
            { name: '开荒保洁费', risk: 'low' }
        ];

        var detectedOmissions = [];
        var omissionCount = 5 + Math.floor(rand(2) * 4);
        for (var i = 0; i < omissionCount && i < commonOmissions.length; i++) {
            var idx = Math.floor(rand(10 + i * 7) * commonOmissions.length);
            if (detectedOmissions.indexOf(commonOmissions[idx].name) === -1) {
                detectedOmissions.push(commonOmissions[idx]);
            }
        }

        var priceAnomalies = [];
        var anomalyCount = 2 + Math.floor(rand(3) * 3);
        var anomalyTypes = [
            { name: '水电改造单价', type: 'high', desc: '略高于市场价，建议核对工程量' },
            { name: '贴砖人工费', type: 'low', desc: '单价偏低，需确认是否包含倒角、拼花等工艺' },
            { name: '吊顶材料', type: 'high', desc: '石膏板品牌规格需明确，避免以次充好' },
            { name: '防水工程', type: 'low', desc: '单价偏低，需确认防水高度和涂刷遍数' },
            { name: '腻子乳胶漆', type: 'high', desc: '材料费偏高，建议确认品牌型号' },
            { name: '拆旧费用', type: 'high', desc: '拆旧费用偏高，建议核对项目明细' }
        ];
        for (var j = 0; j < anomalyCount && j < anomalyTypes.length; j++) {
            var aidx = Math.floor(rand(50 + j * 13) * anomalyTypes.length);
            if (priceAnomalies.indexOf(anomalyTypes[aidx].name) === -1) {
                priceAnomalies.push(anomalyTypes[aidx]);
            }
        }

        var allSuggestions = [
            '建议逐项核对报价明细，确认材料品牌型号和工程量',
            '水电改造建议按实收方，提前约定单价和封顶价格',
            '注意报价中是否有"按实际结算"等模糊表述',
            '建议对比2-3家报价，了解市场行情',
            '确认增项规则：所有增项必须提前签字确认',
            '防水工程需明确高度（淋浴区1.8米）和涂刷遍数',
            '建议扣留5-10%质保金，质保期满后再支付',
            '核对报价是否包含垃圾清运、成品保护等杂费'
        ];
        var suggestions = [];
        var sugCount = 3 + Math.floor(rand(4) * 3);
        for (var k = 0; k < sugCount && k < allSuggestions.length; k++) {
            var sidx = Math.floor(rand(100 + k * 17) * allSuggestions.length);
            if (suggestions.indexOf(allSuggestions[sidx]) === -1) {
                suggestions.push(allSuggestions[sidx]);
            }
        }

        var includedItemsText = (includedItems && includedItems.length > 0) ? includedItems.join('、') : '待确认';

        return {
            overallScore: baseScore,
            totalPrice: totalPriceNum,
            area: areaNum,
            unitPrice: unitPrice,
            includedItems: includedItems || [],
            includedItemsText: includedItemsText,
            priceLevel: unitPrice > 2000 ? '中高端' : (unitPrice > 1200 ? '中等' : '经济型'),
            detectedOmissions: detectedOmissions,
            priceAnomalies: priceAnomalies,
            suggestions: suggestions,
            analyzedAt: new Date().toLocaleString('zh-CN'),
            seed: seed
        };
    }

    function openQuoteAuditModal(stepId) {
        var progress = getProgress();
        var existingResult = progress.quoteAudit && progress.quoteAudit[stepId];

        var modalId = 'sop-quote-audit-modal';
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        var hasResult = !!existingResult;

        var modalHtml = `
            <div id="${modalId}" class="sop-quote-audit-modal-overlay" data-step="${stepId}">
                <div class="sop-quote-audit-modal">
                    <div class="sop-quote-audit-modal-header">
                        <div class="sop-quote-audit-modal-title">
                            <span class="sop-quote-audit-modal-icon">💰</span>
                            <span>报价智能审核（示例效果）</span>
                        </div>
                        <button class="sop-quote-audit-modal-close" data-action="quote-audit-close">×</button>
                    </div>
                    <div class="sop-quote-audit-modal-body">
        `;

        if (!hasResult) {
            modalHtml += `
                        <div class="sop-quote-audit-form">
                            <div class="sop-quote-audit-form-item">
                                <label class="sop-quote-audit-form-label">总报价（元）</label>
                                <input type="number" class="sop-quote-audit-form-input" id="quote-total-price" placeholder="请输入总报价，例如：150000" data-step="${stepId}">
                            </div>
                            <div class="sop-quote-audit-form-item">
                                <label class="sop-quote-audit-form-label">建筑面积（㎡）</label>
                                <input type="number" class="sop-quote-audit-form-input" id="quote-area" placeholder="请输入建筑面积，例如：100" data-step="${stepId}">
                            </div>
                            <div class="sop-quote-audit-form-item">
                                <label class="sop-quote-audit-form-label">包含项目</label>
                                <div class="sop-quote-audit-checkboxes">
                                    <label class="sop-quote-audit-checkbox-item">
                                        <input type="checkbox" value="基础装修" class="sop-quote-audit-checkbox" data-step="${stepId}">
                                        <span>基础装修</span>
                                    </label>
                                    <label class="sop-quote-audit-checkbox-item">
                                        <input type="checkbox" value="主材" class="sop-quote-audit-checkbox" data-step="${stepId}">
                                        <span>主材</span>
                                    </label>
                                    <label class="sop-quote-audit-checkbox-item">
                                        <input type="checkbox" value="定制柜" class="sop-quote-audit-checkbox" data-step="${stepId}">
                                        <span>定制柜</span>
                                    </label>
                                    <label class="sop-quote-audit-checkbox-item">
                                        <input type="checkbox" value="家电" class="sop-quote-audit-checkbox" data-step="${stepId}">
                                        <span>家电</span>
                                    </label>
                                    <label class="sop-quote-audit-checkbox-item">
                                        <input type="checkbox" value="灯具" class="sop-quote-audit-checkbox" data-step="${stepId}">
                                        <span>灯具</span>
                                    </label>
                                    <label class="sop-quote-audit-checkbox-item">
                                        <input type="checkbox" value="软装" class="sop-quote-audit-checkbox" data-step="${stepId}">
                                        <span>软装</span>
                                    </label>
                                </div>
                            </div>
                            <button class="sop-quote-audit-submit-btn" data-action="quote-audit-submit" data-step="${stepId}">
                                <span>🔍</span> 开始智能审核
                            </button>
                            <div class="sop-quote-audit-hint">
                                💡 提示：AI将基于您提供的信息进行报价合理性分析，仅供参考
                            </div>
                        </div>
            `;
        } else {
            modalHtml += renderQuoteAuditResult(existingResult, stepId);
        }

        modalHtml += `
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        addTimer(setTimeout(function() {
            var overlay = document.getElementById(modalId);
            if (overlay) {
                overlay.classList.add('open');
            }
        }, 10));

        var escHandler = function(e) {
            if (e.key === 'Escape') {
                closeQuoteAuditModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        var modalOverlay = document.getElementById(modalId);
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    closeQuoteAuditModal();
                    document.removeEventListener('keydown', escHandler);
                }
            });
        }
    }

    function renderQuoteAuditResult(result, stepId) {
        var scoreColor = result.overallScore >= 85 ? '#4CAF50' : (result.overallScore >= 70 ? '#FF9800' : '#F44336');

        var omissionsHtml = result.detectedOmissions.map(function(item) {
            var riskClass = item.risk === 'high' ? 'high' : (item.risk === 'medium' ? 'medium' : 'low');
            return `
                <div class="sop-quote-audit-omission-item sop-risk-${riskClass}">
                    <span class="sop-quote-audit-omission-icon">⚠️</span>
                    <span class="sop-quote-audit-omission-name">${item.name}</span>
                </div>
            `;
        }).join('');

        var anomaliesHtml = result.priceAnomalies.map(function(item) {
            var typeClass = item.type === 'high' ? 'high' : 'low';
            var typeText = item.type === 'high' ? '虚高' : '偏低';
            return `
                <div class="sop-quote-audit-anomaly-item">
                    <div class="sop-quote-audit-anomaly-header">
                        <span class="sop-quote-audit-anomaly-name">${item.name}</span>
                        <span class="sop-quote-audit-anomaly-type sop-anomaly-${typeClass}">${typeText}</span>
                    </div>
                    <div class="sop-quote-audit-anomaly-desc">${item.desc}</div>
                </div>
            `;
        }).join('');

        var suggestionsHtml = result.suggestions.map(function(s, i) {
            return `
                <div class="sop-quote-audit-suggestion-item">
                    <span class="sop-quote-audit-suggestion-num">${i + 1}</span>
                    <span class="sop-quote-audit-suggestion-text">${s}</span>
                </div>
            `;
        }).join('');

        return `
            <div class="sop-quote-audit-result">
                <div class="sop-quote-audit-overview">
                    <div class="sop-quote-audit-score">
                        <div class="sop-quote-audit-score-num" style="color: ${scoreColor};">${result.overallScore}</div>
                        <div class="sop-quote-audit-score-label">合理性评分</div>
                    </div>
                    <div class="sop-quote-audit-overview-info">
                        <div class="sop-quote-audit-overview-item">
                            <span class="sop-quote-audit-overview-label">总报价</span>
                            <span class="sop-quote-audit-overview-value">¥ ${result.totalPrice.toLocaleString()}</span>
                        </div>
                        <div class="sop-quote-audit-overview-item">
                            <span class="sop-quote-audit-overview-label">单价</span>
                            <span class="sop-quote-audit-overview-value">${result.unitPrice} 元/㎡</span>
                        </div>
                        <div class="sop-quote-audit-overview-item">
                            <span class="sop-quote-audit-overview-label">档次定位</span>
                            <span class="sop-quote-audit-overview-value">${result.priceLevel}</span>
                        </div>
                    </div>
                </div>

                <div class="sop-quote-audit-section">
                    <div class="sop-quote-audit-section-title">
                        <span class="sop-quote-audit-section-icon">📋</span>
                        <span>包含项目</span>
                    </div>
                    <div class="sop-quote-audit-included-items">${result.includedItemsText}</div>
                </div>

                <div class="sop-quote-audit-section">
                    <div class="sop-quote-audit-section-title">
                        <span class="sop-quote-audit-section-icon">🚨</span>
                        <span>漏项风险检测</span>
                        <span class="sop-quote-audit-section-badge">${result.detectedOmissions.length}项</span>
                    </div>
                    <div class="sop-quote-audit-omissions">
                        ${omissionsHtml}
                    </div>
                </div>

                <div class="sop-quote-audit-section">
                    <div class="sop-quote-audit-section-title">
                        <span class="sop-quote-audit-section-icon">📊</span>
                        <span>价格异常项</span>
                        <span class="sop-quote-audit-section-badge">${result.priceAnomalies.length}项</span>
                    </div>
                    <div class="sop-quote-audit-anomalies">
                        ${anomaliesHtml}
                    </div>
                </div>

                <div class="sop-quote-audit-section">
                    <div class="sop-quote-audit-section-title">
                        <span class="sop-quote-audit-section-icon">💡</span>
                        <span>优化建议</span>
                    </div>
                    <div class="sop-quote-audit-suggestions">
                        ${suggestionsHtml}
                    </div>
                </div>

                <div class="sop-quote-audit-footer">
                    <button class="sop-quote-audit-btn-secondary" data-action="quote-audit-reaudit" data-step="${stepId}">
                        重新审核
                    </button>
                    <button class="sop-quote-audit-btn-primary" data-action="quote-audit-copy" data-step="${stepId}">
                        复制报告
                    </button>
                </div>
            </div>
        `;
    }

    function handleQuoteAuditSubmit(stepId) {
        var totalPriceInput = document.getElementById('quote-total-price');
        var areaInput = document.getElementById('quote-area');
        var checkboxes = document.querySelectorAll('.sop-quote-audit-checkbox[data-step="' + stepId + '"]:checked');

        var totalPrice = totalPriceInput ? totalPriceInput.value : '';
        var area = areaInput ? areaInput.value : '';

        if (!totalPrice || !area) {
            alert('请填写总报价和建筑面积');
            return;
        }

        var includedItems = [];
        checkboxes.forEach(function(cb) {
            includedItems.push(cb.value);
        });

        var result = generateQuoteAudit(totalPrice, area, includedItems);

        var progress = getProgress();
        if (!progress.quoteAudit) {
            progress.quoteAudit = {};
        }
        progress.quoteAudit[stepId] = result;
        saveProgress();

        var modalBody = document.querySelector('#sop-quote-audit-modal .sop-quote-audit-modal-body');
        if (modalBody) {
            modalBody.innerHTML = renderQuoteAuditResult(result, stepId);
        }

        renderAllSteps();
    }

    function closeQuoteAuditModal() {
        var modal = document.getElementById('sop-quote-audit-modal');
        if (modal) {
            modal.classList.remove('open');
            addTimer(setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300));
        }
    }

    function handleQuoteAuditReaudit(stepId) {
        var progress = getProgress();
        if (progress.quoteAudit && progress.quoteAudit[stepId]) {
            delete progress.quoteAudit[stepId];
            saveProgress();
        }
        openQuoteAuditModal(stepId);
    }

    function copyQuoteAuditReport(stepId) {
        var progress = getProgress();
        var result = progress.quoteAudit && progress.quoteAudit[stepId];
        if (!result) return;

        var reportText = '💰 报价智能审核报告（示例效果）\n';
        reportText += '═══════════════════════════\n\n';
        reportText += '【合理性评分】' + result.overallScore + '分\n';
        reportText += '【总报价】¥ ' + result.totalPrice.toLocaleString() + '\n';
        reportText += '【建筑面积】' + result.area + ' ㎡\n';
        reportText += '【单价】' + result.unitPrice + ' 元/㎡\n';
        reportText += '【档次定位】' + result.priceLevel + '\n';
        reportText += '【包含项目】' + result.includedItemsText + '\n\n';
        reportText += '【漏项风险检测】\n';
        result.detectedOmissions.forEach(function(item, i) {
            reportText += '  ' + (i + 1) + '. ' + item.name + '（' + (item.risk === 'high' ? '高风险' : item.risk === 'medium' ? '中风险' : '低风险') + '）\n';
        });
        reportText += '\n【价格异常项】\n';
        result.priceAnomalies.forEach(function(item, i) {
            reportText += '  ' + (i + 1) + '. ' + item.name + '（' + (item.type === 'high' ? '虚高' : '偏低') + '）- ' + item.desc + '\n';
        });
        reportText += '\n【优化建议】\n';
        result.suggestions.forEach(function(s, i) {
            reportText += '  ' + (i + 1) + '. ' + s + '\n';
        });
        reportText += '\n分析时间：' + result.analyzedAt;

        navigator.clipboard.writeText(reportText).then(function() {
            var btn = document.querySelector('[data-action="quote-audit-copy"]');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = '已复制 ✓';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
        }).catch(function() {
            var textarea = document.createElement('textarea');
            textarea.value = reportText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            var btn = document.querySelector('[data-action="quote-audit-copy"]');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = '已复制 ✓';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
        });
    }

    function generateContractAudit(options) {
        var key = (options.paymentMethod || '') + '_' + (options.addonRule || '') + '_' + (options.period || '') + '_' + (options.warranty || '') + '_' + (options.liability || '');
        var seed = hashString(key);
        var rand = function(offset) { return seededRandom(seed + offset); };

        var paymentMethods = {
            '3331': '3331 付款（首期30%+中期30%+竣工30%+质保10%',
            '4321': '4321 付款（首期40%+中期30%+竣工20%+质保10%',
            '4222': '4222 付款（首期40%+中期20%+竣工20%+质保20%',
            '532': '532 付款（首期50%+中期30%+竣工20%）',
            '631': '631 付款（首期60%+中期30%+竣工10%）'
        };
        var addonRules = {
            'confirm-first': '先确认后施工（增项需业主签字确认后再施工',
            'monthly-settle': '按月结算（每月底结算当月增项）',
            'percent-limit': '按比例限制（增项不超过合同价5%）',
            'no-limit': '无明确约定（按实际结算）',
            'oral-only': '口头约定（无书面增项规则）'
        };
        var periods = {
            '90days': '90天标准工期',
            '120days': '120天常规工期',
            '150days': '150天宽松工期',
            '60days': '60天紧凑工期',
            'no-limit': '无明确工期约定'
        };
        var warranties = {
            'water5-base2': '水电5年+基础2年（国标）',
            'water10-base5': '水电10年+基础5年（延长质保）',
            'water3-base1': '水电3年+基础1年（缩短质保）',
            'all2years': '整体质保2年（无分类）',
            'oral-warranty': '口头承诺质保（无书面约定）'
        };
        var liabilities = {
            'equal': '双方对等违约责任',
            'owner-heavy': '业主责任偏重（施工方违约责任轻）',
            'contractor-heavy': '施工方责任偏重',
            'vague': '违约责任约定模糊',
            'no-liability': '无违约责任条款'
        };

        var baseScore = 70;

        var paymentScores = { '3331': 15, '4321': 10, '4222': 12, '532': 5, '631': 0 };
        var addonScores = { 'confirm-first': 15, 'monthly-settle': 10, 'percent-limit': 12, 'no-limit': 5, 'oral-only': 0 };
        var periodScores = { '90days': 10, '120days': 12, '150days': 15, '60days': 5, 'no-limit': 0 };
        var warrantyScores = { 'water5-base2': 10, 'water10-base5': 15, 'water3-base1': 3, 'all2years': 5, 'oral-warranty': 0 };
        var liabilityScores = { 'equal': 15, 'owner-heavy': 3, 'contractor-heavy': 12, 'vague': 5, 'no-liability': 0 };

        var score = baseScore;
        score += paymentScores[options.paymentMethod] || 0;
        score += addonScores[options.addonRule] || 0;
        score += periodScores[options.period] || 0;
        score += warrantyScores[options.warranty] || 0;
        score += liabilityScores[options.liability] || 0;
        score = Math.min(100, Math.max(10, score + Math.floor(rand(1) * 10 - 5)));

        var riskLevel = score >= 80 ? 'low' : (score >= 60 ? 'medium' : 'high');
        var riskLevelText = score >= 80 ? '低风险' : (score >= 60 ? '中风险' : '高风险');

        var riskTemplates = [
            { level: 'high', desc: '首期付款比例过高，业主资金风险较大', suggestion: '建议降低首期款比例至30-40%，降低资金风险' },
            { level: 'high', desc: '增项规则不明确，容易产生费用纠纷', suggestion: '明确约定增项流程：必须书面确认报价后再施工' },
            { level: 'high', desc: '工期无明确约定，延期风险高', suggestion: '明确工期天数及起止日期，约定延期赔偿标准' },
            { level: 'high', desc: '质保期低于国家标准', suggestion: '水电质保应不低于5年，基础工程不低于2年' },
            { level: 'high', desc: '违约责任不对等，业主维权困难', suggestion: '违约责任应对等约定，确保双方权益平衡' },
            { level: 'high', desc: '无延期赔偿条款', suggestion: '增加工期延误赔偿条款，建议0.1-0.3%/天' },
            { level: 'medium', desc: '中期款支付节点不够明确', suggestion: '明确中期款支付的验收标准和条件' },
            { level: 'medium', desc: '增项无比例上限约定', suggestion: '约定增项总额上限（建议不超过合同价5-10%）' },
            { level: 'medium', desc: '质保期内维修响应时间未约定', suggestion: '明确质保维修响应时间（建议24-48小时）' },
            { level: 'medium', desc: '材料品牌规格约定不详细', suggestion: '在合同附件中列明主要材料品牌型号清单' },
            { level: 'medium', desc: '验收标准未明确', suggestion: '约定各阶段验收标准和流程' },
            { level: 'low', desc: '付款节点建议增加资金托管选项', suggestion: '了解平台资金托管服务，更有保障' },
            { level: 'low', desc: '建议增加设计变更流程约定', suggestion: '明确设计变更的确认流程和费用计算方式' },
            { level: 'low', desc: '竣工结算方式可更细化', suggestion: '约定竣工结算的时限和流程' },
            { level: 'low', desc: '建议约定争议解决方式', suggestion: '明确争议解决途径（协商/调解/仲裁/诉讼）' }
        ];

        var risks = [];
        var highCount = 2 + Math.floor(rand(2) * 2);
        var mediumCount = 2 + Math.floor(rand(3) * 2);
        var lowCount = 2 + Math.floor(rand(4) * 2);

        var highRisks = riskTemplates.filter(function(r) { return r.level === 'high'; });
        var mediumRisks = riskTemplates.filter(function(r) { return r.level === 'medium'; });
        var lowRisks = riskTemplates.filter(function(r) { return r.level === 'low'; });

        for (var h = 0; h < highCount && h < highRisks.length; h++) {
            var hidx = Math.floor(rand(10 + h * 7) * highRisks.length) % highRisks.length;
            var hitem = highRisks[hidx % highRisks.length];
            if (risks.indexOf(hitem) === -1) {
                risks.push(hitem);
            }
        }
        for (var m = 0; m < mediumCount && m < mediumRisks.length; m++) {
            var midx = Math.floor(rand(30 + m * 11) * mediumRisks.length % mediumRisks.length);
            var mitem = mediumRisks[midx % mediumRisks.length];
            if (risks.indexOf(mitem) === -1) {
                risks.push(mitem);
            }
        }
        for (var l = 0; l < lowCount && l < lowRisks.length; l++) {
            var lidx = Math.floor(rand(50 + l * 13) * lowRisks.length) % lowRisks.length;
            var litem = lowRisks[lidx % lowRisks.length];
            if (risks.indexOf(litem) === -1) {
                risks.push(litem);
            }
        }

        return {
            riskScore: score,
            riskLevel: riskLevel,
            riskLevelText: riskLevelText,
            paymentMethod: paymentMethods[options.paymentMethod] || options.paymentMethod,
            addonRule: addonRules[options.addonRule] || options.addonRule,
            period: periods[options.period] || options.period,
            warranty: warranties[options.warranty] || options.warranty,
            liability: liabilities[options.liability] || options.liability,
            risks: risks,
            analyzedAt: new Date().toLocaleString('zh-CN'),
            seed: seed
        };
    }

    function openContractAuditModal(stepId) {
        var progress = getProgress();
        var existingResult = progress.contractAudit && progress.contractAudit[stepId];

        var modalId = 'sop-contract-audit-modal';
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        var hasResult = !!existingResult;

        var modalHtml = `
            <div id="${modalId}" class="sop-contract-audit-modal-overlay" data-step="${stepId}">
                <div class="sop-contract-audit-modal">
                    <div class="sop-contract-audit-modal-header">
                        <div class="sop-contract-audit-modal-title">
                            <span class="sop-contract-audit-modal-icon">📋</span>
                            <span>AI 合同风险扫描</span>
                        </div>
                        <button class="sop-contract-audit-modal-close" data-action="contract-audit-close">×</button>
                    </div>
                    <div class="sop-contract-audit-modal-body">
        `;

        if (!hasResult) {
            modalHtml += `
                        <div class="sop-contract-audit-form">
                            <div class="sop-contract-audit-tabs">
                                <div class="sop-contract-audit-tab active" data-tab="payment">付款方式</div>
                                <div class="sop-contract-audit-tab" data-tab="addon">增项规则</div>
                                <div class="sop-contract-audit-tab" data-tab="period">工期约定</div>
                                <div class="sop-contract-audit-tab" data-tab="warranty">质保条款</div>
                                <div class="sop-contract-audit-tab" data-tab="liability">违约责任</div>
                            </div>
                            <div class="sop-contract-audit-tab-content active" data-tab-content="payment">
                                <div class="sop-contract-audit-form-item">
                                    <label class="sop-contract-audit-form-label">选择付款方式</label>
                                    <div class="sop-contract-audit-options">
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-payment" value="3331" data-step="${stepId}">
                                            <span>3331 付款（首期30%+中期30%+竣工30%+质保10%）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-payment" value="4321" data-step="${stepId}">
                                            <span>4321 付款（首期40%+中期30%+竣工20%+质保10%）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-payment" value="4222" data-step="${stepId}">
                                            <span>4222 付款（首期40%+中期20%+竣工20%+质保20%）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-payment" value="532" data-step="${stepId}">
                                            <span>532 付款（首期50%+中期30%+竣工20%）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-payment" value="631" data-step="${stepId}">
                                            <span>631 付款（首期60%+中期30%+竣工10%）</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="sop-contract-audit-tab-content" data-tab-content="addon">
                                <div class="sop-contract-audit-form-item">
                                    <label class="sop-contract-audit-form-label">增项规则约定</label>
                                    <div class="sop-contract-audit-options">
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-addon" value="confirm-first" data-step="${stepId}">
                                            <span>先确认后施工（增项需业主签字确认后再施工）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-addon" value="monthly-settle" data-step="${stepId}">
                                            <span>按月结算（每月底结算当月增项）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-addon" value="percent-limit" data-step="${stepId}">
                                            <span>按比例限制（增项不超过合同价5%）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-addon" value="no-limit" data-step="${stepId}">
                                            <span>无明确约定（按实际结算）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-addon" value="oral-only" data-step="${stepId}">
                                            <span>口头约定（无书面增项规则）</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="sop-contract-audit-tab-content" data-tab-content="period">
                                <div class="sop-contract-audit-form-item">
                                    <label class="sop-contract-audit-form-label">工期约定</label>
                                    <div class="sop-contract-audit-options">
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-period" value="60days" data-step="${stepId}">
                                            <span>60天紧凑工期</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-period" value="90days" data-step="${stepId}">
                                            <span>90天标准工期</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-period" value="120days" data-step="${stepId}">
                                            <span>120天常规工期</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-period" value="150days" data-step="${stepId}">
                                            <span>150天宽松工期</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-period" value="no-limit" data-step="${stepId}">
                                            <span>无明确工期约定</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="sop-contract-audit-tab-content" data-tab-content="warranty">
                                <div class="sop-contract-audit-form-item">
                                    <label class="sop-contract-audit-form-label">质保条款</label>
                                    <div class="sop-contract-audit-options">
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-warranty" value="water10-base5" data-step="${stepId}">
                                            <span>水电10年+基础5年（延长质保）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-warranty" value="water5-base2" data-step="${stepId}">
                                            <span>水电5年+基础2年（国标）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-warranty" value="all2years" data-step="${stepId}">
                                            <span>整体质保2年（无分类）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-warranty" value="water3-base1" data-step="${stepId}">
                                            <span>水电3年+基础1年（缩短质保）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-warranty" value="oral-warranty" data-step="${stepId}">
                                            <span>口头承诺质保（无书面约定）</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div class="sop-contract-audit-tab-content" data-tab-content="liability">
                                <div class="sop-contract-audit-form-item">
                                    <label class="sop-contract-audit-form-label">违约责任</label>
                                    <div class="sop-contract-audit-options">
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-liability" value="equal" data-step="${stepId}">
                                            <span>双方对等违约责任</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-liability" value="contractor-heavy" data-step="${stepId}">
                                            <span>施工方责任偏重</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-liability" value="vague" data-step="${stepId}">
                                            <span>违约责任约定模糊</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-liability" value="owner-heavy" data-step="${stepId}">
                                            <span>业主责任偏重（施工方违约责任轻）</span>
                                        </label>
                                        <label class="sop-contract-audit-option">
                                            <input type="radio" name="contract-liability" value="no-liability" data-step="${stepId}">
                                            <span>无违约责任条款</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button class="sop-contract-audit-submit-btn" data-action="contract-audit-submit" data-step="${stepId}">
                                <span>🔍</span> 开始风险扫描
                            </button>
                            <div class="sop-contract-audit-hint">
                                💡 提示：请根据合同实际情况选择，AI将基于您的选择进行风险分析，仅供参考
                            </div>
                        </div>
            `;
        } else {
            modalHtml += renderContractAuditResult(existingResult, stepId);
        }

        modalHtml += `
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        addTimer(setTimeout(function() {
            var overlay = document.getElementById(modalId);
            if (overlay) {
                overlay.classList.add('open');
            }
        }, 10));

        var escHandler = function(e) {
            if (e.key === 'Escape') {
                closeContractAuditModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        var modalOverlay = document.getElementById(modalId);
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    closeContractAuditModal();
                    document.removeEventListener('keydown', escHandler);
                }
            });
        }
    }

    function renderContractAuditResult(result, stepId) {
        var scoreColor = result.riskLevel === 'low' ? '#4CAF50' : (result.riskLevel === 'medium' ? '#FF9800' : '#F44336');

        var risksHtml = result.risks.map(function(risk) {
            var levelClass = risk.level;
            var levelText = risk.level === 'high' ? '高风险' : (risk.level === 'medium' ? '中风险' : '低风险');
            return `
                <div class="sop-contract-audit-risk-item sop-risk-${levelClass}">
                    <div class="sop-contract-audit-risk-header">
                        <span class="sop-contract-audit-risk-desc">${risk.desc}</span>
                        <span class="sop-contract-audit-risk-level">${levelText}</span>
                    </div>
                    <div class="sop-contract-audit-risk-suggestion">
                        <strong>修改建议：</strong>${risk.suggestion}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="sop-contract-audit-result">
                <div class="sop-contract-audit-overview">
                    <div class="sop-contract-audit-score">
                        <div class="sop-contract-audit-score-num" style="color: ${scoreColor};">${result.riskScore}</div>
                        <div class="sop-contract-audit-score-label">风险评分（越低越安全）</div>
                    </div>
                    <div class="sop-contract-audit-overview-info">
                        <div class="sop-contract-audit-overview-item">
                            <span class="sop-contract-audit-overview-label">综合风险评级</span>
                            <span class="sop-contract-audit-overview-value sop-risk-${result.riskLevel}-text">${result.riskLevelText}</span>
                        </div>
                        <div class="sop-contract-audit-overview-item">
                            <span class="sop-contract-audit-overview-label">风险条款数</span>
                            <span class="sop-contract-audit-overview-value">${result.risks.length}条</span>
                        </div>
                    </div>
                </div>

                <div class="sop-contract-audit-section">
                    <div class="sop-contract-audit-section-title">
                        <span class="sop-contract-audit-section-icon">📝</span>
                        <span>合同关键信息摘要</span>
                    </div>
                    <div class="sop-contract-audit-summary">
                        <div class="sop-contract-audit-summary-item">
                            <span class="sop-contract-audit-summary-label">付款方式</span>
                            <span class="sop-contract-audit-summary-value">${result.paymentMethod}</span>
                        </div>
                        <div class="sop-contract-audit-summary-item">
                            <span class="sop-contract-audit-summary-label">增项规则</span>
                            <span class="sop-contract-audit-summary-value">${result.addonRule}</span>
                        </div>
                        <div class="sop-contract-audit-summary-item">
                            <span class="sop-contract-audit-summary-label">工期约定</span>
                            <span class="sop-contract-audit-summary-value">${result.period}</span>
                        </div>
                        <div class="sop-contract-audit-summary-item">
                            <span class="sop-contract-audit-summary-label">质保条款</span>
                            <span class="sop-contract-audit-summary-value">${result.warranty}</span>
                        </div>
                        <div class="sop-contract-audit-summary-item">
                            <span class="sop-contract-audit-summary-label">违约责任</span>
                            <span class="sop-contract-audit-summary-value">${result.liability}</span>
                        </div>
                    </div>
                </div>

                <div class="sop-contract-audit-section">
                    <div class="sop-contract-audit-section-title">
                        <span class="sop-contract-audit-section-icon">⚠️</span>
                        <span>风险条款清单</span>
                        <span class="sop-contract-audit-section-badge">${result.risks.length}条</span>
                    </div>
                    <div class="sop-contract-audit-risks">
                        ${risksHtml}
                    </div>
                </div>

                <div class="sop-contract-audit-footer">
                    <button class="sop-contract-audit-btn-secondary" data-action="contract-audit-reaudit" data-step="${stepId}">
                        重新扫描
                    </button>
                    <button class="sop-contract-audit-btn-primary" data-action="contract-audit-copy" data-step="${stepId}">
                        复制报告
                    </button>
                </div>
            </div>
        `;
    }

    function handleContractAuditSubmit(stepId) {
        var paymentInput = document.querySelector('input[name="contract-payment"]:checked');
        var addonInput = document.querySelector('input[name="contract-addon"]:checked');
        var periodInput = document.querySelector('input[name="contract-period"]:checked');
        var warrantyInput = document.querySelector('input[name="contract-warranty"]:checked');
        var liabilityInput = document.querySelector('input[name="contract-liability"]:checked');

        if (!paymentInput || !addonInput || !periodInput || !warrantyInput || !liabilityInput) {
            alert('请完成所有选项卡的选择');
            return;
        }

        var options = {
            paymentMethod: paymentInput.value,
            addonRule: addonInput.value,
            period: periodInput.value,
            warranty: warrantyInput.value,
            liability: liabilityInput.value
        };

        var result = generateContractAudit(options);

        var progress = getProgress();
        if (!progress.contractAudit) {
            progress.contractAudit = {};
        }
        progress.contractAudit[stepId] = result;
        saveProgress();

        var modalBody = document.querySelector('#sop-contract-audit-modal .sop-contract-audit-modal-body');
        if (modalBody) {
            modalBody.innerHTML = renderContractAuditResult(result, stepId);
        }

        renderAllSteps();
    }

    function closeContractAuditModal() {
        var modal = document.getElementById('sop-contract-audit-modal');
        if (modal) {
            modal.classList.remove('open');
            addTimer(setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300));
        }
    }

    function handleContractAuditReaudit(stepId) {
        var progress = getProgress();
        if (progress.contractAudit && progress.contractAudit[stepId]) {
            delete progress.contractAudit[stepId];
            saveProgress();
        }
        openContractAuditModal(stepId);
    }

    function copyContractAuditReport(stepId) {
        var progress = getProgress();
        var result = progress.contractAudit && progress.contractAudit[stepId];
        if (!result) return;

        var reportText = '📋 AI 合同风险扫描报告\n';
        reportText += '═══════════════════════════\n\n';
        reportText += '【风险评分】' + result.riskScore + '分（越低越安全）\n';
        reportText += '【综合风险评级】' + result.riskLevelText + '\n\n';
        reportText += '【合同关键信息摘要】\n';
        reportText += '  • 付款方式：' + result.paymentMethod + '\n';
        reportText += '  • 增项规则：' + result.addonRule + '\n';
        reportText += '  • 工期约定：' + result.period + '\n';
        reportText += '  • 质保条款：' + result.warranty + '\n';
        reportText += '  • 违约责任：' + result.liability + '\n\n';
        reportText += '【风险条款清单】\n';
        result.risks.forEach(function(risk, i) {
            var levelText = risk.level === 'high' ? '高风险' : (risk.level === 'medium' ? '中风险' : '低风险');
            reportText += '  ' + (i + 1) + '. [' + levelText + '] ' + risk.desc + '\n';
            reportText += '     修改建议：' + risk.suggestion + '\n';
        });
        reportText += '\n扫描时间：' + result.analyzedAt;

        navigator.clipboard.writeText(reportText).then(function() {
            var btn = document.querySelector('[data-action="contract-audit-copy"]');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = '已复制 ✓';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
        }).catch(function() {
            var textarea = document.createElement('textarea');
            textarea.value = reportText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            var btn = document.querySelector('[data-action="contract-audit-copy"]');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = '已复制 ✓';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
        });
    }

    function generatePointPlan(options) {
        var key = (options.houseType || '') + '_' + (options.roomCount || '') + '_' + (options.appliances || []).sort().join(',') + '_' + (options.smartDevices || []).sort().join(',');
        var seed = hashString(key);
        var rand = function(offset) { return seededRandom(seed + offset); };

        var roomCount = parseInt(options.roomCount) || 3;
        var appliances = options.appliances || [];
        var smartDevices = options.smartDevices || [];

        var basePoints = {
            living: { name: '客厅', count: 8, items: ['电视插座', '机顶盒插座', '路由器插座', '空调插座', '沙发两侧插座', '网线接口', '灯开关', '备用插座'] },
            bedroom: { name: '卧室', count: 6, items: ['床头两侧插座', '空调插座', '电视插座', '衣柜内插座', '灯开关', '网线接口'] },
            kitchen: { name: '厨房', count: 10, items: ['冰箱插座', '油烟机插座', '微波炉插座', '电饭煲插座', '电水壶插座', '洗碗机插座', '消毒柜插座', '净水器插座', '垃圾处理器插座', '备用插座'] },
            bathroom: { name: '卫生间', count: 5, items: ['热水器插座', '吹风机插座', '智能马桶插座', '浴霸开关', '镜前灯插座'] },
            balcony: { name: '阳台', count: 3, items: ['洗衣机插座', '烘干机插座', '备用插座'] }
        };

        var roomPoints = [];
        var totalPoints = 0;

        var livingCount = 1;
        roomPoints.push({
            room: '客厅',
            type: 'living',
            points: basePoints.living.count,
            items: basePoints.living.items.slice()
        });
        totalPoints += basePoints.living.count;

        var bedroomNum = Math.max(1, roomCount - 2);
        for (var b = 0; b < bedroomNum; b++) {
            var bedSuffix = bedroomNum > 1 ? ('（' + (b + 1) + '号卧室）') : '';
            roomPoints.push({
                room: '卧室' + bedSuffix,
                type: 'bedroom',
                points: basePoints.bedroom.count,
                items: basePoints.bedroom.items.slice()
            });
            totalPoints += basePoints.bedroom.count;
        }

        roomPoints.push({
            room: '厨房',
            type: 'kitchen',
            points: basePoints.kitchen.count,
            items: basePoints.kitchen.items.slice()
        });
        totalPoints += basePoints.kitchen.count;

        var bathroomNum = 1 + Math.floor(rand(1) * 2);
        if (roomCount >= 4) bathroomNum = 2;
        for (var ba = 0; ba < bathroomNum; ba++) {
            var bathSuffix = bathroomNum > 1 ? ('（' + (ba + 1) + '卫）') : '';
            roomPoints.push({
                room: '卫生间' + bathSuffix,
                type: 'bathroom',
                points: basePoints.bathroom.count,
                items: basePoints.bathroom.items.slice()
            });
            totalPoints += basePoints.bathroom.count;
        }

        roomPoints.push({
            room: '阳台',
            type: 'balcony',
            points: basePoints.balcony.count,
            items: basePoints.balcony.items.slice()
        });
        totalPoints += basePoints.balcony.count;

        var applianceExtraPoints = {
            '冰箱': { room: '厨房', item: '冰箱独立回路' },
            '洗衣机': { room: '阳台', item: '洗衣机专用插座' },
            '电视': { room: '客厅', item: '电视背景墙插座组' },
            '空调': { room: '客厅', item: '空调独立回路' },
            '热水器': { room: '卫生间', item: '热水器专用插座' },
            '油烟机': { room: '厨房', item: '油烟机专用插座' },
            '洗碗机': { room: '厨房', item: '洗碗机专用插座' },
            '智能马桶': { room: '卫生间', item: '智能马桶插座' }
        };

        appliances.forEach(function(app) {
            if (applianceExtraPoints[app]) {
                totalPoints += 1;
            }
        });

        var smartExtra = {
            '智能开关': 2,
            '智能窗帘': 2,
            '智能门锁': 1,
            '监控': 2
        };
        smartDevices.forEach(function(sd) {
            if (smartExtra[sd]) {
                totalPoints += smartExtra[sd];
            }
        });

        totalPoints += Math.floor(rand(2) * 5);

        var commonOmissions = [
            { name: '厨房小家电备用插座', desc: '电饭煲、电压力锅、破壁机等小电器插座容易遗漏' },
            { name: '床头USB充电插座', desc: '现在手机充电需求大，床头建议增加USB接口' },
            { name: '马桶旁智能插座', desc: '预留智能马桶插座，后期升级方便' },
            { name: '玄关感应灯线路', desc: '入户感应灯提升居住体验' },
            { name: '餐边柜插座', desc: '餐边柜放咖啡机、热水壶等需要插座' },
            { name: '阳台电动晾衣架电源', desc: '电动晾衣架需要预留电源' },
            { name: '电视柜内隐藏插座', desc: '路由器、光猫放在电视柜内更整洁' },
            { name: '衣柜内感应灯线路', desc: '开门自动亮灯，找衣服更方便' },
            { name: '厨房台下净水器插座', desc: '净水器、垃圾处理器都需要插座' },
            { name: '卫生间镜前灯插座', desc: '吹风机、电动牙刷等需要插座' },
            { name: '书房/办公区网线接口', desc: '台式机有线网络更稳定' },
            { name: '扫地机器人充电座插座', desc: '预留低位插座方便扫地机器人充电' }
        ];

        var omissions = [];
        var omissionCount = 8 + Math.floor(rand(3) * 4);
        for (var o = 0; o < omissionCount && o < commonOmissions.length; o++) {
            var oidx = Math.floor(rand(10 + o * 7) * commonOmissions.length) % commonOmissions.length;
            if (omissions.indexOf(commonOmissions[oidx]) === -1) {
                omissions.push(commonOmissions[oidx]);
            }
        }

        var specialAppliances = appliances.filter(function(a) {
            return ['冰箱', '洗衣机', '空调', '热水器', '油烟机', '洗碗机', '智能马桶'].indexOf(a) !== -1;
        });

        var circuitCount = 8 + Math.floor(rand(4) * 4);
        if (appliances.indexOf('空调') !== -1) circuitCount += 2;
        if (appliances.indexOf('冰箱') !== -1) circuitCount += 1;
        if (appliances.indexOf('热水器') !== -1) circuitCount += 1;

        var networkPorts = 2 + bedroomNum;
        if (smartDevices.length > 0) networkPorts += 2;

        var usbPorts = 2 + bedroomNum * 2;

        return {
            totalPoints: totalPoints,
            roomPoints: roomPoints,
            omissions: omissions,
            specialAppliances: specialAppliances,
            circuitCount: circuitCount,
            networkPorts: networkPorts,
            usbPorts: usbPorts,
            houseType: options.houseType || '',
            roomCount: roomCount,
            appliances: appliances,
            smartDevices: smartDevices,
            checkedItems: {},
            analyzedAt: new Date().toLocaleString('zh-CN'),
            seed: seed
        };
    }

    function openPointPlanModal(stepId) {
        var progress = getProgress();
        var existingResult = progress.pointPlan && progress.pointPlan[stepId];

        var modalId = 'sop-point-plan-modal';
        var existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.remove();
        }

        var hasResult = !!existingResult;

        var modalHtml = `
            <div id="${modalId}" class="sop-point-plan-modal-overlay" data-step="${stepId}">
                <div class="sop-point-plan-modal">
                    <div class="sop-point-plan-modal-header">
                        <div class="sop-point-plan-modal-title">
                            <span class="sop-point-plan-modal-icon">⚡</span>
                            <span>水电点位智能规划（示例效果）</span>
                        </div>
                        <button class="sop-point-plan-modal-close" data-action="point-plan-close">×</button>
                    </div>
                    <div class="sop-point-plan-modal-body">
        `;

        if (!hasResult) {
            modalHtml += `
                        <div class="sop-point-plan-form">
                            <div class="sop-point-plan-form-item">
                                <label class="sop-point-plan-form-label">户型类型</label>
                                <div class="sop-point-plan-options">
                                    <label class="sop-point-plan-option">
                                        <input type="radio" name="point-house-type" value="一室一厅" data-step="${stepId}">
                                        <span>一室一厅</span>
                                    </label>
                                    <label class="sop-point-plan-option">
                                        <input type="radio" name="point-house-type" value="两室一厅" data-step="${stepId}">
                                        <span>两室一厅</span>
                                    </label>
                                    <label class="sop-point-plan-option">
                                        <input type="radio" name="point-house-type" value="三室一厅" data-step="${stepId}">
                                        <span>三室一厅</span>
                                    </label>
                                    <label class="sop-point-plan-option">
                                        <input type="radio" name="point-house-type" value="三室两厅" data-step="${stepId}">
                                        <span>三室两厅</span>
                                    </label>
                                    <label class="sop-point-plan-option">
                                        <input type="radio" name="point-house-type" value="四室两厅" data-step="${stepId}">
                                        <span>四室两厅</span>
                                    </label>
                                </div>
                            </div>
                            <div class="sop-point-plan-form-item">
                                <label class="sop-point-plan-form-label">房间数量</label>
                                <select class="sop-point-plan-select" id="point-room-count" data-step="${stepId}">
                                    <option value="2">2室（1卧+1厅）</option>
                                    <option value="3" selected>3室（2卧+1厅）</option>
                                    <option value="4">4室（3卧+1厅）</option>
                                    <option value="5">5室（4卧+1厅）</option>
                                    <option value="6">6室及以上</option>
                                </select>
                            </div>
                            <div class="sop-point-plan-form-item">
                                <label class="sop-point-plan-form-label">常见家电（多选）</label>
                                <div class="sop-point-plan-checkboxes">
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="冰箱" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>冰箱</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="洗衣机" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>洗衣机</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="电视" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>电视</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="空调" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>空调</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="热水器" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>热水器</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="油烟机" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>油烟机</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="洗碗机" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>洗碗机</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="智能马桶" class="sop-point-plan-checkbox" data-step="${stepId}">
                                        <span>智能马桶</span>
                                    </label>
                                </div>
                            </div>
                            <div class="sop-point-plan-form-item">
                                <label class="sop-point-plan-form-label">智能家居（多选）</label>
                                <div class="sop-point-plan-checkboxes">
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="智能开关" class="sop-point-plan-smart-checkbox" data-step="${stepId}">
                                        <span>智能开关</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="智能窗帘" class="sop-point-plan-smart-checkbox" data-step="${stepId}">
                                        <span>智能窗帘</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="智能门锁" class="sop-point-plan-smart-checkbox" data-step="${stepId}">
                                        <span>智能门锁</span>
                                    </label>
                                    <label class="sop-point-plan-checkbox-item">
                                        <input type="checkbox" value="监控" class="sop-point-plan-smart-checkbox" data-step="${stepId}">
                                        <span>监控</span>
                                    </label>
                                </div>
                            </div>
                            <button class="sop-point-plan-submit-btn" data-action="point-plan-submit" data-step="${stepId}">
                                <span>⚡</span> 生成点位规划
                            </button>
                            <div class="sop-point-plan-hint">
                                💡 提示：AI将基于您的户型和家电清单生成点位规划建议，仅供参考
                            </div>
                        </div>
            `;
        } else {
            modalHtml += renderPointPlanResult(existingResult, stepId);
        }

        modalHtml += `
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        addTimer(setTimeout(function() {
            var overlay = document.getElementById(modalId);
            if (overlay) {
                overlay.classList.add('open');
            }
        }, 10));

        var escHandler = function(e) {
            if (e.key === 'Escape') {
                closePointPlanModal();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        var modalOverlay = document.getElementById(modalId);
        if (modalOverlay) {
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    closePointPlanModal();
                    document.removeEventListener('keydown', escHandler);
                }
            });
        }
    }

    function renderPointPlanResult(result, stepId) {
        var roomPointsHtml = result.roomPoints.map(function(rp) {
            var itemsHtml = rp.items.map(function(item, idx) {
                var itemKey = rp.room + '_' + idx;
                var isChecked = result.checkedItems && result.checkedItems[itemKey];
                return `
                    <div class="sop-point-plan-point-item ${isChecked ? 'checked' : ''}" data-step="${stepId}" data-point-key="${itemKey}">
                        <div class="sop-point-plan-point-checkbox">${isChecked ? '✓' : ''}</div>
                        <div class="sop-point-plan-point-name">${item}</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="sop-point-plan-room">
                    <div class="sop-point-plan-room-header">
                        <span class="sop-point-plan-room-name">${rp.room}</span>
                        <span class="sop-point-plan-room-count">${rp.points}个点位</span>
                    </div>
                    <div class="sop-point-plan-points">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        }).join('');

        var omissionsHtml = result.omissions.map(function(om, i) {
            return `
                <div class="sop-point-plan-omission-item">
                    <span class="sop-point-plan-omission-num">${i + 1}</span>
                    <div class="sop-point-plan-omission-content">
                        <div class="sop-point-plan-omission-name">${om.name}</div>
                        <div class="sop-point-plan-omission-desc">${om.desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        var specialAppliancesHtml = result.specialAppliances.length > 0 ? result.specialAppliances.map(function(app) {
            return `<div class="sop-point-plan-special-item">✓ ${app}专用点位已规划</div>`;
        }).join('') : '<div class="sop-point-plan-special-empty">无特殊家电点位</div>';

        return `
            <div class="sop-point-plan-result">
                <div class="sop-point-plan-overview">
                    <div class="sop-point-plan-total">
                        <div class="sop-point-plan-total-num">${result.totalPoints}</div>
                        <div class="sop-point-plan-total-label">总点位数量估算</div>
                    </div>
                    <div class="sop-point-plan-overview-info">
                        <div class="sop-point-plan-overview-item">
                            <span class="sop-point-plan-overview-label">户型</span>
                            <span class="sop-point-plan-overview-value">${result.houseType}</span>
                        </div>
                        <div class="sop-point-plan-overview-item">
                            <span class="sop-point-plan-overview-label">建议回路数</span>
                            <span class="sop-point-plan-overview-value">${result.circuitCount}路</span>
                        </div>
                        <div class="sop-point-plan-overview-item">
                            <span class="sop-point-plan-overview-label">网线接口</span>
                            <span class="sop-point-plan-overview-value">${result.networkPorts}个</span>
                        </div>
                        <div class="sop-point-plan-overview-item">
                            <span class="sop-point-plan-overview-label">USB建议</span>
                            <span class="sop-point-plan-overview-value">${result.usbPorts}个</span>
                        </div>
                    </div>
                </div>

                <div class="sop-point-plan-section">
                    <div class="sop-point-plan-section-title">
                        <span class="sop-point-plan-section-icon">🏠</span>
                        <span>按房间分类点位清单</span>
                    </div>
                    <div class="sop-point-plan-rooms">
                        ${roomPointsHtml}
                    </div>
                </div>

                <div class="sop-point-plan-section">
                    <div class="sop-point-plan-section-title">
                        <span class="sop-point-plan-section-icon">💡</span>
                        <span>常见遗漏提醒</span>
                        <span class="sop-point-plan-section-badge">${result.omissions.length}项</span>
                    </div>
                    <div class="sop-point-plan-omissions">
                        ${omissionsHtml}
                    </div>
                </div>

                <div class="sop-point-plan-section">
                    <div class="sop-point-plan-section-title">
                        <span class="sop-point-plan-section-icon">🔌</span>
                        <span>特殊家电点位核对</span>
                    </div>
                    <div class="sop-point-plan-special">
                        ${specialAppliancesHtml}
                    </div>
                </div>

                <div class="sop-point-plan-footer">
                    <button class="sop-point-plan-btn-secondary" data-action="point-plan-regenerate" data-step="${stepId}">
                        重新规划
                    </button>
                    <button class="sop-point-plan-btn-primary" data-action="point-plan-export" data-step="${stepId}">
                        导出清单
                    </button>
                </div>
            </div>
        `;
    }

    function handlePointPlanSubmit(stepId) {
        var houseTypeInput = document.querySelector('input[name="point-house-type"]:checked');
        var roomCountSelect = document.getElementById('point-room-count');
        var applianceCheckboxes = document.querySelectorAll('.sop-point-plan-checkbox[data-step="' + stepId + '"]:checked');
        var smartCheckboxes = document.querySelectorAll('.sop-point-plan-smart-checkbox[data-step="' + stepId + '"]:checked');

        if (!houseTypeInput) {
            alert('请选择户型类型');
            return;
        }

        var appliances = [];
        applianceCheckboxes.forEach(function(cb) {
            appliances.push(cb.value);
        });

        var smartDevices = [];
        smartCheckboxes.forEach(function(cb) {
            smartDevices.push(cb.value);
        });

        var options = {
            houseType: houseTypeInput.value,
            roomCount: roomCountSelect ? roomCountSelect.value : '3',
            appliances: appliances,
            smartDevices: smartDevices
        };

        var result = generatePointPlan(options);

        var progress = getProgress();
        if (!progress.pointPlan) {
            progress.pointPlan = {};
        }
        progress.pointPlan[stepId] = result;
        saveProgress();

        var modalBody = document.querySelector('#sop-point-plan-modal .sop-point-plan-modal-body');
        if (modalBody) {
            modalBody.innerHTML = renderPointPlanResult(result, stepId);
        }

        renderAllSteps();
    }

    function closePointPlanModal() {
        var modal = document.getElementById('sop-point-plan-modal');
        if (modal) {
            modal.classList.remove('open');
            addTimer(setTimeout(function() {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300));
        }
    }

    function handlePointPlanRegenerate(stepId) {
        var progress = getProgress();
        if (progress.pointPlan && progress.pointPlan[stepId]) {
            delete progress.pointPlan[stepId];
            saveProgress();
        }
        openPointPlanModal(stepId);
    }

    function handlePointPlanExport(stepId) {
        var progress = getProgress();
        var result = progress.pointPlan && progress.pointPlan[stepId];
        if (!result) return;

        var reportText = '⚡ 水电点位智能规划报告（示例效果）\n';
        reportText += '═══════════════════════════\n\n';
        reportText += '【总点位数量估算】' + result.totalPoints + '个\n';
        reportText += '【户型】' + result.houseType + '\n';
        reportText += '【建议回路数】' + result.circuitCount + '路\n';
        reportText += '【网线接口建议】' + result.networkPorts + '个\n';
        reportText += '【USB点位建议】' + result.usbPorts + '个\n\n';
        reportText += '【按房间分类点位清单】\n';
        result.roomPoints.forEach(function(rp) {
            reportText += '\n  ' + rp.room + '（' + rp.points + '个点位）：\n';
            rp.items.forEach(function(item) {
                reportText += '    • ' + item + '\n';
            });
        });
        reportText += '\n【常见遗漏提醒】\n';
        result.omissions.forEach(function(om, i) {
            reportText += '  ' + (i + 1) + '. ' + om.name + '\n';
            reportText += '     ' + om.desc + '\n';
        });
        reportText += '\n【特殊家电点位核对】\n';
        if (result.specialAppliances.length > 0) {
            result.specialAppliances.forEach(function(app) {
                reportText += '  ✓ ' + app + '专用点位已规划\n';
            });
        } else {
            reportText += '  无特殊家电点位\n';
        }
        reportText += '\n规划时间：' + result.analyzedAt;

        navigator.clipboard.writeText(reportText).then(function() {
            var btn = document.querySelector('[data-action="point-plan-export"]');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = '已导出 ✓';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
        }).catch(function() {
            var textarea = document.createElement('textarea');
            textarea.value = reportText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            var btn = document.querySelector('[data-action="point-plan-export"]');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = '已导出 ✓';
                setTimeout(function() {
                    btn.textContent = originalText;
                }, 2000);
            }
        });
    }

    function handlePointPlanItemClick(stepId, pointKey) {
        var progress = getProgress();
        var result = progress.pointPlan && progress.pointPlan[stepId];
        if (!result) return;

        if (!result.checkedItems) {
            result.checkedItems = {};
        }
        result.checkedItems[pointKey] = !result.checkedItems[pointKey];
        saveProgress();

        var modalBody = document.querySelector('#sop-point-plan-modal .sop-point-plan-modal-body');
        if (modalBody) {
            modalBody.innerHTML = renderPointPlanResult(result, stepId);
        }
    }

    function parsePriceToNumber(priceStr) {
        if (!priceStr) return 0;
        var num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (priceStr.indexOf('万') !== -1) {
            num = num * 10000;
        }
        return num || 0;
    }

    function parseDurationToDays(durationStr) {
        if (!durationStr) return 0;
        var num = parseFloat(durationStr.replace(/[^0-9.]/g, ''));
        if (durationStr.indexOf('月') !== -1) {
            num = num * 30;
        }
        return num || 0;
    }

    function parseAfterSalesToMonths(afterSalesStr) {
        if (!afterSalesStr) return 0;
        var num = parseFloat(afterSalesStr.replace(/[^0-9.]/g, ''));
        if (afterSalesStr.indexOf('年') !== -1) {
            num = num * 12;
        }
        return num || 0;
    }

    function calculateCompanyScore(company, allCompanies) {
        var score = 0;

        var priceScore = 0;
        var prices = allCompanies.map(function(c) { return parsePriceToNumber(c.price); }).filter(function(p) { return p > 0; });
        var companyPrice = parsePriceToNumber(company.price);
        if (prices.length > 0 && companyPrice > 0) {
            var minPrice = Math.min.apply(null, prices);
            var maxPrice = Math.max.apply(null, prices);
            if (maxPrice > minPrice) {
                priceScore = (1 - (companyPrice - minPrice) / (maxPrice - minPrice)) * 100;
            } else {
                priceScore = 100;
            }
        }
        score += priceScore * 0.25;

        var durationScore = 0;
        var durations = allCompanies.map(function(c) { return parseDurationToDays(c.duration); }).filter(function(d) { return d > 0; });
        var companyDuration = parseDurationToDays(company.duration);
        if (durations.length > 0 && companyDuration > 0) {
            var minDuration = Math.min.apply(null, durations);
            var maxDuration = Math.max.apply(null, durations);
            if (maxDuration > minDuration) {
                durationScore = (1 - (companyDuration - minDuration) / (maxDuration - minDuration)) * 100;
            } else {
                durationScore = 100;
            }
        }
        score += durationScore * 0.15;

        var qualScore = 0;
        var qual = company.qualification || '';
        if (qual.indexOf('一级') !== -1) qualScore = 100;
        else if (qual.indexOf('二级') !== -1) qualScore = 80;
        else if (qual.indexOf('三级') !== -1) qualScore = 60;
        else if (qual) qualScore = 40;
        score += qualScore * 0.15;

        var repScore = (company.reputation || 0) * 20;
        score += repScore * 0.20;

        var includesScore = 0;
        var includes = company.includes || '';
        if (includes) {
            var len = includes.length;
            includesScore = Math.min(100, len * 2);
        }
        score += includesScore * 0.10;

        var addonScore = 0;
        var addon = company.addonClarity || '';
        if (addon === '高') addonScore = 100;
        else if (addon === '中') addonScore = 70;
        else if (addon === '低') addonScore = 40;
        score += addonScore * 0.10;

        var afterSalesScore = 0;
        var afterSalesMonths = parseAfterSalesToMonths(company.afterSales);
        if (afterSalesMonths > 0) {
            afterSalesScore = Math.min(100, afterSalesMonths * 5);
        }
        score += afterSalesScore * 0.05;

        return Math.round(score);
    }

    function getCompanyScores(companies) {
        var scores = {};
        for (var i = 0; i < companies.length; i++) {
            scores[companies[i].id] = calculateCompanyScore(companies[i], companies);
        }
        return scores;
    }

    function getRecommendedCompanyId(companies) {
        if (companies.length === 0) return null;
        var scores = getCompanyScores(companies);
        var maxId = companies[0].id;
        var maxScore = scores[maxId];
        for (var i = 1; i < companies.length; i++) {
            if (scores[companies[i].id] > maxScore) {
                maxScore = scores[companies[i].id];
                maxId = companies[i].id;
            }
        }
        return maxId;
    }

    function renderStars(rating, size) {
        size = size || 'small';
        var starClass = size === 'big' ? 'sop-company-compare-form-star' : 'sop-company-compare-star';
        var html = '<div class="sop-company-compare-stars">';
        for (var i = 1; i <= 5; i++) {
            var active = i <= rating ? 'active' : 'inactive';
            html += '<span class="' + starClass + ' ' + active + '" data-rating="' + i + '">★</span>';
        }
        html += '</div>';
        return html;
    }

    function renderCompanyComparison(step) {
        var companies = getCompanyList();
        var scores = getCompanyScores(companies);
        var recommendedId = getRecommendedCompanyId(companies);

        var html = '';

        html += '<div class="sop-company-compare-section">';
        html += '<div class="sop-company-compare-header">';
        html += '<div class="sop-company-compare-title">';
        html += '<span class="sop-company-compare-title-icon">🏢</span>';
        html += '<span>装修公司对比</span>';
        html += '</div>';
        html += '<button class="sop-company-compare-add-btn" data-action="company-compare-add" ' + (companies.length >= MAX_COMPANIES ? 'disabled' : '') + '>';
        html += '<span>＋</span><span>添加公司</span>';
        html += '</button>';
        html += '</div>';

        if (companies.length === 0 && !isAnalyzing) {
            html += '<div class="sop-company-compare-empty">';
            html += '<div class="sop-company-compare-empty-icon">🏗️</div>';
            html += '<div>还没有添加装修公司，点击上方"添加公司"开始对比吧~</div>';
            html += '</div>';
        } else {
            if (isAnalyzing) {
                html += '<div class="sop-company-compare-analyzing">';
                html += '<div class="sop-company-compare-analyzing-icon">🔍</div>';
                html += '<div class="sop-company-compare-analyzing-title">正在智能分析</div>';
                html += '<div class="sop-company-compare-analyzing-name">"' + analyzingCompanyName + '"</div>';
                html += '<div class="sop-company-compare-analyzing-progress">';
                html += '<div class="sop-company-compare-analyzing-progress-bar"></div>';
                html += '</div>';
                html += '<div class="sop-company-compare-analyzing-text">';
                html += '正在从全网收集公司信息，包括资质、口碑、报价、案例等...';
                html += '</div>';
                html += '</div>';
            }
            html += '<div class="sop-company-compare-cards">';
            for (var i = 0; i < companies.length; i++) {
                var c = companies[i];
                var isRec = recommendedId === c.id;
                html += '<div class="sop-company-compare-card' + (isRec ? ' recommended' : '') + '" data-company-id="' + c.id + '">';
                html += '<div class="sop-company-compare-card-actions">';
                html += '<button class="sop-company-compare-card-edit-btn" data-action="company-compare-edit" data-company-id="' + c.id + '" title="编辑">✏️</button>';
                html += '<button class="sop-company-compare-card-delete-btn" data-action="company-compare-delete" data-company-id="' + c.id + '" title="删除">🗑️</button>';
                html += '</div>';
                html += '<div class="sop-company-compare-card-name">' + (c.name || '未命名') + '</div>';
                html += '<div class="sop-company-compare-card-score">';
                html += '<span class="sop-company-compare-card-score-num">' + scores[c.id] + '</span>';
                html += '<span class="sop-company-compare-card-score-label">分</span>';
                html += '</div>';
                html += renderStars(c.reputation, 'small');
                html += '</div>';
            }
            html += '</div>';

            if (companies.length >= 2) {
                var dimensions = [
                    { label: '报价', field: 'price' },
                    { label: '工期', field: 'duration' },
                    { label: '资质等级', field: 'qualification' },
                    { label: '口碑评分', field: 'reputation', isStars: true },
                    { label: '全包包含项', field: 'includes' },
                    { label: '增项透明度', field: 'addonClarity' },
                    { label: '售后保障', field: 'afterSales' }
                ];

                html += '<div class="sop-company-compare-table-wrapper">';
                html += '<table class="sop-company-compare-table">';
                html += '<thead><tr>';
                html += '<th>对比维度</th>';
                for (var j = 0; j < companies.length; j++) {
                    var isRec2 = recommendedId === companies[j].id;
                    html += '<th' + (isRec2 ? ' style="background: linear-gradient(135deg, #FFEEC7 0%, #FFE4A8 100%); color: #8B6F47;"' : '') + '>' + (companies[j].name || '未命名') + (isRec2 ? ' 👑' : '') + '</th>';
                }
                html += '</tr></thead>';
                html += '<tbody>';
                for (var d = 0; d < dimensions.length; d++) {
                    var dim = dimensions[d];
                    var isRec3 = recommendedId;
                    html += '<tr' + (recommendedId ? ' recommended' : '') + '>';
                    html += '<td class="dim-label">' + dim.label + '</td>';
                    for (var k = 0; k < companies.length; k++) {
                        var cmp = companies[k];
                        var val = cmp[dim.field];
                        var displayVal = val;
                        if (dim.isStars) {
                            displayVal = renderStars(val || 0, 'small');
                        }
                        html += '<td class="company-col editable-cell" data-action="company-compare-cell-edit" data-company-id="' + cmp.id + '" data-field="' + dim.field + '">';
                        html += displayVal || '<span style="color:#ccc;">—</span>';
                        html += '</td>';
                    }
                    html += '</tr>';
                }
                html += '</tbody>';
                html += '</table>';
                html += '</div>';
            }
        }

        html += '</div>';

        html += renderCompanyCompareModal();
        html += renderConfirmModal();
        html += renderInputModal();
        html += renderCompanyDetailModal();

        return html;
    }

    function renderConfirmModal() {
        var html = '<div class="sop-confirm-modal-overlay" id="sop-confirm-modal">';
        html += '<div class="sop-confirm-modal">';
        html += '<div class="sop-confirm-modal-header">';
        html += '<div class="sop-confirm-modal-title" id="sop-confirm-title">确认</div>';
        html += '</div>';
        html += '<div class="sop-confirm-modal-body">';
        html += '<div class="sop-confirm-modal-message" id="sop-confirm-message"></div>';
        html += '</div>';
        html += '<div class="sop-confirm-modal-footer">';
        html += '<button class="sop-confirm-modal-cancel-btn" data-action="confirm-cancel">取消</button>';
        html += '<button class="sop-confirm-modal-ok-btn" data-action="confirm-ok">确定</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    function renderInputModal() {
        var html = '<div class="sop-input-modal-overlay" id="sop-input-modal">';
        html += '<div class="sop-input-modal">';
        html += '<div class="sop-input-modal-header">';
        html += '<div class="sop-input-modal-title" id="sop-input-title">输入</div>';
        html += '</div>';
        html += '<div class="sop-input-modal-body">';
        html += '<div class="sop-input-modal-label" id="sop-input-label"></div>';
        html += '<input type="text" class="sop-input-modal-input" id="sop-input-field">';
        html += '</div>';
        html += '<div class="sop-input-modal-footer">';
        html += '<button class="sop-input-modal-cancel-btn" data-action="input-cancel">取消</button>';
        html += '<button class="sop-input-modal-ok-btn" data-action="input-ok">确定</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    function renderCompanyDetailModal() {
        var html = '<div class="sop-company-detail-modal-overlay" id="sop-company-detail-modal">';
        html += '<div class="sop-company-detail-modal">';
        html += '<div class="sop-company-detail-modal-header">';
        html += '<div class="sop-company-detail-modal-title" id="sop-company-detail-name">公司详情</div>';
        html += '<button class="sop-company-detail-modal-close" data-action="company-detail-close">×</button>';
        html += '</div>';
        html += '<div class="sop-company-detail-modal-body" id="sop-company-detail-body">';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    function openCompanyDetailModal(companyId) {
        var companies = getCompanyList();
        var company = null;
        for (var i = 0; i < companies.length; i++) {
            if (companies[i].id === companyId) {
                company = companies[i];
                break;
            }
        }
        if (!company) return;

        var modal = document.getElementById('sop-company-detail-modal');
        if (!modal) return;

        document.getElementById('sop-company-detail-name').textContent = company.name || '未命名';

        var body = document.getElementById('sop-company-detail-body');
        if (!body) return;

        var scores = getCompanyScores(companies);
        var score = scores[companyId] || 0;

        var html = '';

        html += '<div class="sop-company-detail-score-section">';
        html += '<div class="sop-company-detail-score-circle">';
        html += '<span class="sop-company-detail-score-num">' + score + '</span>';
        html += '<span class="sop-company-detail-score-label">综合评分</span>';
        html += '</div>';
        html += '<div class="sop-company-detail-basic-info">';
        html += '<div class="sop-company-detail-info-item">';
        html += '<span class="sop-company-detail-info-label">资质等级</span>';
        html += '<span class="sop-company-detail-info-value">' + (company.qualification || '—') + '</span>';
        html += '</div>';
        html += '<div class="sop-company-detail-info-item">';
        html += '<span class="sop-company-detail-info-label">参考报价</span>';
        html += '<span class="sop-company-detail-info-value highlight">' + (company.price || '—') + '</span>';
        html += '</div>';
        html += '<div class="sop-company-detail-info-item">';
        html += '<span class="sop-company-detail-info-label">预计工期</span>';
        html += '<span class="sop-company-detail-info-value">' + (company.duration || '—') + '</span>';
        html += '</div>';
        html += '<div class="sop-company-detail-info-item">';
        html += '<span class="sop-company-detail-info-label">口碑评分</span>';
        html += '<span class="sop-company-detail-info-value">' + renderStars(company.reputation, 'small') + '</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        html += '<div class="sop-company-detail-section">';
        html += '<div class="sop-company-detail-section-title">📋 服务范围</div>';
        html += '<div class="sop-company-detail-section-content">' + (company.serviceScope || '暂无信息') + '</div>';
        html += '</div>';

        html += '<div class="sop-company-detail-section">';
        html += '<div class="sop-company-detail-section-title">💰 价格体系</div>';
        html += '<div class="sop-company-detail-price-grid">';
        html += '<div class="sop-company-detail-price-item">';
        html += '<div class="sop-company-detail-price-label">套餐报价</div>';
        html += '<div class="sop-company-detail-price-value">' + (company.price || '—') + '</div>';
        html += '</div>';
        html += '<div class="sop-company-detail-price-item">';
        html += '<div class="sop-company-detail-price-label">单价参考</div>';
        html += '<div class="sop-company-detail-price-value">' + (company.pricePerSqm || '—') + '</div>';
        html += '</div>';
        html += '<div class="sop-company-detail-price-item">';
        html += '<div class="sop-company-detail-price-label">增项透明度</div>';
        html += '<div class="sop-company-detail-price-value">' + (company.addonClarity || '—') + '</div>';
        html += '</div>';
        html += '<div class="sop-company-detail-price-item">';
        html += '<div class="sop-company-detail-price-label">包含项目</div>';
        html += '<div class="sop-company-detail-price-value small">' + (company.includes || '—') + '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        if (company.strengths && company.strengths.length > 0) {
            html += '<div class="sop-company-detail-section">';
            html += '<div class="sop-company-detail-section-title">✨ 公司优势</div>';
            html += '<div class="sop-company-detail-tags">';
            for (var s = 0; s < company.strengths.length; s++) {
                html += '<span class="sop-company-detail-tag strength">' + company.strengths[s] + '</span>';
            }
            html += '</div>';
            html += '</div>';
        }

        if (company.weaknesses && company.weaknesses.length > 0) {
            html += '<div class="sop-company-detail-section">';
            html += '<div class="sop-company-detail-section-title">⚠️ 注意事项</div>';
            html += '<div class="sop-company-detail-tags">';
            for (var w = 0; w < company.weaknesses.length; w++) {
                html += '<span class="sop-company-detail-tag weakness">' + company.weaknesses[w] + '</span>';
            }
            html += '</div>';
            html += '</div>';
        }

        if (company.cases && company.cases.length > 0) {
            html += '<div class="sop-company-detail-section">';
            html += '<div class="sop-company-detail-section-title">🏠 过往案例</div>';
            html += '<div class="sop-company-detail-cases">';
            for (var c = 0; c < company.cases.length; c++) {
                var cs = company.cases[c];
                html += '<div class="sop-company-detail-case-item">';
                html += '<div class="sop-company-detail-case-area">' + cs.area + '</div>';
                html += '<div class="sop-company-detail-case-info">';
                html += '<div class="sop-company-detail-case-type">' + cs.type + ' · ' + cs.style + '</div>';
                html += '<div class="sop-company-detail-case-price">' + cs.price + '</div>';
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
        }

        if (company.reviews && company.reviews.length > 0) {
            html += '<div class="sop-company-detail-section">';
            html += '<div class="sop-company-detail-section-title">💬 客户评价</div>';
            html += '<div class="sop-company-detail-reviews">';
            for (var r = 0; r < company.reviews.length; r++) {
                html += '<div class="sop-company-detail-review-item">';
                html += '<div class="sop-company-detail-review-header">';
                html += '<div class="sop-company-detail-review-avatar">用' + (r + 1) + '</div>';
                html += '<div class="sop-company-detail-review-name">业主' + (r + 1) + '</div>';
                html += '</div>';
                html += '<div class="sop-company-detail-review-content">' + company.reviews[r] + '</div>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
        }

        html += '<div class="sop-company-detail-section">';
        html += '<div class="sop-company-detail-section-title">🛡️ 售后保障</div>';
        html += '<div class="sop-company-detail-section-content">' + (company.afterSales || '暂无信息') + '</div>';
        html += '</div>';

        body.innerHTML = html;
        modal.classList.add('open');
    }

    function closeCompanyDetailModal() {
        var modal = document.getElementById('sop-company-detail-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    }

    function renderCompanyCompareModal() {
        var html = '<div class="sop-company-compare-modal-overlay" id="sop-company-compare-modal">';
        html += '<div class="sop-company-compare-modal">';
        html += '<div class="sop-company-compare-modal-header">';
        html += '<div class="sop-company-compare-modal-title">编辑装修公司信息</div>';
        html += '<button class="sop-company-compare-modal-close" data-action="company-compare-modal-close">×</button>';
        html += '</div>';
        html += '<div class="sop-company-compare-modal-body">';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">公司名称</label>';
        html += '<input type="text" class="sop-company-compare-form-input" id="company-compare-name" placeholder="请输入公司名称">';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">报价</label>';
        html += '<input type="text" class="sop-company-compare-form-input" id="company-compare-price" placeholder="如：12.5万 或 800元/㎡">';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">工期</label>';
        html += '<input type="text" class="sop-company-compare-form-input" id="company-compare-duration" placeholder="如：90天 或 3个月">';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">资质等级</label>';
        html += '<select class="sop-company-compare-form-select" id="company-compare-qualification">';
        html += '<option value="">请选择</option>';
        html += '<option value="一级资质">一级资质</option>';
        html += '<option value="二级资质">二级资质</option>';
        html += '<option value="三级资质">三级资质</option>';
        html += '<option value="其他">其他</option>';
        html += '</select>';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">口碑评分</label>';
        html += '<div class="sop-company-compare-form-stars" id="company-compare-reputation-stars">';
        for (var s = 1; s <= 5; s++) {
            html += '<span class="sop-company-compare-form-star inactive" data-action="company-compare-rating" data-rating="' + s + '">★</span>';
        }
        html += '</div>';
        html += '<input type="hidden" id="company-compare-reputation" value="0">';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">全包包含项</label>';
        html += '<textarea class="sop-company-compare-form-textarea" id="company-compare-includes" placeholder="简要描述全包包含哪些项目，如：基础装修+主材+橱柜等"></textarea>';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">增项透明度</label>';
        html += '<select class="sop-company-compare-form-select" id="company-compare-addon-clarity">';
        html += '<option value="">请选择</option>';
        html += '<option value="高">高</option>';
        html += '<option value="中">中</option>';
        html += '<option value="低">低</option>';
        html += '</select>';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">售后保障</label>';
        html += '<input type="text" class="sop-company-compare-form-input" id="company-compare-after-sales" placeholder="如：2年质保 或 水电5年质保">';
        html += '</div>';

        html += '<div class="sop-company-compare-form-group">';
        html += '<label class="sop-company-compare-form-label">备注</label>';
        html += '<textarea class="sop-company-compare-form-textarea" id="company-compare-notes" placeholder="其他需要记录的信息"></textarea>';
        html += '</div>';

        html += '</div>';
        html += '<div class="sop-company-compare-modal-footer">';
        html += '<button class="sop-company-compare-modal-cancel-btn" data-action="company-compare-modal-close">取消</button>';
        html += '<button class="sop-company-compare-modal-save-btn" data-action="company-compare-save">保存</button>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    function openCompanyCompareModal(companyId) {
        currentEditingCompanyId = companyId || null;
        companyCompareModalOpen = true;

        var modal = document.getElementById('sop-company-compare-modal');
        if (!modal) return;

        modal.classList.add('open');

        var companies = getCompanyList();
        var company = null;
        if (companyId) {
            for (var i = 0; i < companies.length; i++) {
                if (companies[i].id === companyId) {
                    company = companies[i];
                    break;
                }
            }
        }

        document.getElementById('company-compare-name').value = company ? company.name : '';
        document.getElementById('company-compare-price').value = company ? company.price : '';
        document.getElementById('company-compare-duration').value = company ? company.duration : '';
        document.getElementById('company-compare-qualification').value = company ? company.qualification : '';
        document.getElementById('company-compare-includes').value = company ? company.includes : '';
        document.getElementById('company-compare-addon-clarity').value = company ? company.addonClarity : '';
        document.getElementById('company-compare-after-sales').value = company ? company.afterSales : '';
        document.getElementById('company-compare-notes').value = company ? company.notes : '';

        var rep = company ? company.reputation : 0;
        document.getElementById('company-compare-reputation').value = rep;
        updateModalStars(rep);
    }

    function closeCompanyCompareModal() {
        companyCompareModalOpen = false;
        currentEditingCompanyId = null;
        var modal = document.getElementById('sop-company-compare-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    }

    function openConfirmModal(title, message) {
        var modal = document.getElementById('sop-confirm-modal');
        if (!modal) return;
        document.getElementById('sop-confirm-title').textContent = title || '确认';
        document.getElementById('sop-confirm-message').textContent = message || '';
        modal.classList.add('open');
    }

    function closeConfirmModal() {
        var modal = document.getElementById('sop-confirm-modal');
        if (modal) {
            modal.classList.remove('open');
        }
        confirmModalCallback = null;
        deletingCompanyId = null;
    }

    function handleConfirmOk() {
        if (confirmModalCallback) {
            confirmModalCallback();
        }
        closeConfirmModal();
    }

    function handleConfirmCancel() {
        closeConfirmModal();
    }

    function openInputModal(title, label, placeholder, callback) {
        var modal = document.getElementById('sop-input-modal');
        if (!modal) return;
        document.getElementById('sop-input-title').textContent = title || '输入';
        document.getElementById('sop-input-label').textContent = label || '';
        var input = document.getElementById('sop-input-field');
        input.placeholder = placeholder || '';
        input.value = '';
        inputModalCallback = callback;
        modal.classList.add('open');
        setTimeout(function() { input.focus(); }, 100);
    }

    function closeInputModal() {
        var modal = document.getElementById('sop-input-modal');
        if (modal) {
            modal.classList.remove('open');
        }
        inputModalCallback = null;
    }

    function handleInputOk() {
        var input = document.getElementById('sop-input-field');
        var value = input ? input.value : '';
        if (inputModalCallback) {
            inputModalCallback(value);
        }
        closeInputModal();
    }

    function handleInputCancel() {
        closeInputModal();
    }

    function updateModalStars(rating) {
        var starsContainer = document.getElementById('company-compare-reputation-stars');
        if (!starsContainer) return;
        var stars = starsContainer.querySelectorAll('.sop-company-compare-form-star');
        for (var i = 0; i < stars.length; i++) {
            var starRating = parseInt(stars[i].getAttribute('data-rating')) || 0;
            if (starRating <= rating) {
                stars[i].classList.remove('inactive');
                stars[i].classList.add('active');
            } else {
                stars[i].classList.remove('active');
                stars[i].classList.add('inactive');
            }
        }
    }

    function handleCompanyCompareAdd() {
        var list = getCompanyList();
        if (list.length >= MAX_COMPANIES) {
            Toast.info('最多只能添加' + MAX_COMPANIES + '家装修公司');
            return;
        }
        if (isAnalyzing) {
            Toast.info('正在分析中，请稍候...');
            return;
        }
        openInputModal('添加装修公司', '请输入装修公司名称', '如：XX装饰、XX家装', function(name) {
            if (!name || !name.trim()) {
                Toast.info('请输入公司名称');
                return;
            }
            startCompanyAnalysis(name.trim());
        });
    }

    function startCompanyAnalysis(name) {
        var list = getCompanyList();
        for (var i = 0; i < list.length; i++) {
            if (list[i].name === name) {
                Toast.info('该公司已在对比列表中');
                return;
            }
        }
        isAnalyzing = true;
        analyzingCompanyName = name;
        renderAllSteps();
        setTimeout(function() {
            var analysis = generateCompanyAnalysis(name);
            var newCompany = addCompany(analysis);
            isAnalyzing = false;
            analyzingCompanyName = '';
            renderAllSteps();
            if (newCompany) {
                Toast.success('分析完成，已添加"' + name + '"');
            }
        }, 1500 + Math.random() * 500);
    }

    function handleCompanyCompareEdit(companyId) {
        openCompanyCompareModal(companyId);
    }

    function handleCompanyCompareDelete(companyId) {
        deletingCompanyId = companyId;
        confirmModalCallback = function() {
            if (deletingCompanyId) {
                removeCompany(deletingCompanyId);
                deletingCompanyId = null;
                renderAllSteps();
            }
        };
        openConfirmModal('确定要删除这家装修公司吗？', '删除后无法恢复，请确认');
    }

    function handleCompanyCompareSave() {
        var name = document.getElementById('company-compare-name').value.trim();
        if (!name) {
            Toast.info('请输入公司名称');
            return;
        }

        var data = {
            name: name,
            price: document.getElementById('company-compare-price').value.trim(),
            duration: document.getElementById('company-compare-duration').value.trim(),
            qualification: document.getElementById('company-compare-qualification').value,
            reputation: parseInt(document.getElementById('company-compare-reputation').value) || 0,
            includes: document.getElementById('company-compare-includes').value.trim(),
            addonClarity: document.getElementById('company-compare-addon-clarity').value,
            afterSales: document.getElementById('company-compare-after-sales').value.trim(),
            notes: document.getElementById('company-compare-notes').value.trim()
        };

        if (currentEditingCompanyId) {
            updateCompany(currentEditingCompanyId, data);
        } else {
            addCompany(data);
        }

        closeCompanyCompareModal();
        renderAllSteps();
    }

    function handleCompanyCompareRating(rating) {
        document.getElementById('company-compare-reputation').value = rating;
        updateModalStars(rating);
    }

    function handleCompanyCompareCellEdit(companyId, field) {
        openCompanyCompareModal(companyId);
    }

    // ========== 装修公司对比工具结束 ==========


    // ========== AI 装修公司智能匹配 ==========

    var aiMatchModalOpen = false;
    var aiMatchPreferences = {
        roomType: '',
        areaRange: '',
        budgetRange: '',
        style: '',
        specialNeeds: []
    };
    var aiMatchResults = [];
    var isGeneratingMatch = false;

    var MATCH_ROOM_TYPES = [
        { value: '1室', label: '一室' },
        { value: '2室', label: '两室' },
        { value: '3室', label: '三室' },
        { value: '4室+', label: '四室及以上' }
    ];

    var MATCH_AREA_RANGES = [
        { value: '60以下', label: '60㎡以下' },
        { value: '60-90', label: '60-90㎡' },
        { value: '90-120', label: '90-120㎡' },
        { value: '120-150', label: '120-150㎡' },
        { value: '150以上', label: '150㎡以上' }
    ];

    var MATCH_BUDGET_RANGES = [
        { value: '5-10万', label: '5-10万' },
        { value: '10-15万', label: '10-15万' },
        { value: '15-20万', label: '15-20万' },
        { value: '20-30万', label: '20-30万' },
        { value: '30万以上', label: '30万以上' }
    ];

    var MATCH_STYLES = [
        { value: '现代简约', label: '现代简约' },
        { value: '北欧', label: '北欧' },
        { value: '中式', label: '中式' },
        { value: '欧式', label: '欧式' },
        { value: '轻奢', label: '轻奢' }
    ];

    var MATCH_SPECIAL_NEEDS = [
        { value: 'elderly', label: '有老人', icon: '👴' },
        { value: 'children', label: '有小孩', icon: '👶' },
        { value: 'pets', label: '宠物家庭', icon: '🐾' },
        { value: 'smartHome', label: '智能家居', icon: '🏠' },
        { value: 'workspace', label: '工作间', icon: '💻' }
    ];

    var COMPANY_NAME_POOL = [
        '雅居装饰', '尚品家装', '绿居设计', '宜居空间', '家和装饰',
        '美居工坊', '悦享家装', '锦程装饰', '晟庭设计', '筑梦家装饰',
        '宏源家装', '艺居设计', '润家装饰', '铭品家装', '雅居乐装饰',
        '城市人家', '业之峰装饰', '东易日盛', '尚层装饰', '元洲装饰'
    ];

    var MATCH_REASON_TEMPLATES = {
        roomType: [
            '擅长{value}户型布局优化，空间利用率高',
            '有丰富的{value}户型装修经验，案例众多',
            '对{value}户型的动线规划有独到见解'
        ],
        areaRange: [
            '在{value}面积段的项目经验丰富',
            '熟悉{value}户型的材料用量把控，报价精准',
            '擅长{value}空间的功能分区设计'
        ],
        budgetRange: [
            '在{value}预算范围内性价比突出',
            '擅长{value}预算的成本控制与品质平衡',
            '{value}预算段的客户满意度高，增项少'
        ],
        style: [
            '{value}风格是其主打风格，设计师经验丰富',
            '做过大量{value}风格的案例，落地效果好',
            '对{value}风格的材料和软装搭配驾轻就熟'
        ],
        specialNeeds: {
            elderly: '注重适老化设计，防滑、扶手、夜间灯等细节考虑周全',
            children: '儿童房设计经验丰富，环保材料、圆角处理、安全防护到位',
            pets: '有宠物家庭装修经验，耐抓耐磨材料、宠物活动区规划合理',
            smartHome: '智能家居系统集成能力强，可提供全屋智能解决方案',
            workspace: '擅长居家工作空间设计，采光、隔音、人体工程学考虑周全'
        }
    };

    var STRENGTH_TAGS_POOL = [
        '设计实力强', '施工质量好', '报价透明', '工期准时', '售后完善',
        '材料环保', '工人手艺好', '项目经理负责', '增项少', '口碑好',
        '案例丰富', '设计师耐心', '性价比高', '服务周到', '质保期长'
    ];

    var RISK_WARNING_POOL = [
        '热门档期需提前预约',
        '高端设计师档期紧张',
        '部分特色材料需定制，周期较长',
        '异地施工费用略高',
        '旺季可能有小幅延期风险',
        '套餐外升级选项较多，需控制预算'
    ];

    function generateAiMatchKey() {
        var prefs = aiMatchPreferences;
        var key = prefs.roomType + '|' + prefs.areaRange + '|' + prefs.budgetRange + '|' + prefs.style + '|' + prefs.specialNeeds.sort().join(',');
        return key;
    }

    function getMatchResults() {
        var progress = getProgress();
        if (!progress.matchResults) {
            progress.matchResults = {
                preferences: null,
                companies: [],
                generatedAt: null
            };
        }
        return progress.matchResults;
    }

    function saveMatchResults(prefs, companies) {
        var progress = getProgress();
        progress.matchResults = {
            preferences: prefs,
            companies: companies,
            generatedAt: Date.now()
        };
        saveProgress();
    }

    function generateMatchedCompanies() {
        var key = generateAiMatchKey();
        var seed = hashString(key);
        var rand = function(offset) { return seededRandom(seed + offset); };

        var count = 3 + Math.floor(rand(0) * 3);
        var companies = [];
        var usedNames = {};

        for (var i = 0; i < count; i++) {
            var nameIdx;
            do {
                nameIdx = Math.floor(rand(100 + i * 17) * COMPANY_NAME_POOL.length);
            } while (usedNames[nameIdx]);
            usedNames[nameIdx] = true;
            var companyName = COMPANY_NAME_POOL[nameIdx];

            var baseScore = 60 + Math.floor(rand(200 + i * 13) * 36);

            var matchReasons = [];
            var prefs = aiMatchPreferences;

            if (prefs.roomType) {
                var reasonIdx = Math.floor(rand(300 + i * 7) * MATCH_REASON_TEMPLATES.roomType.length);
                matchReasons.push(MATCH_REASON_TEMPLATES.roomType[reasonIdx].replace('{value}', prefs.roomType));
                baseScore += 3 + Math.floor(rand(310 + i) * 5);
            }
            if (prefs.areaRange) {
                var reasonIdx2 = Math.floor(rand(400 + i * 11) * MATCH_REASON_TEMPLATES.areaRange.length);
                matchReasons.push(MATCH_REASON_TEMPLATES.areaRange[reasonIdx2].replace('{value}', prefs.areaRange + '㎡'));
                baseScore += 2 + Math.floor(rand(410 + i) * 4);
            }
            if (prefs.budgetRange) {
                var reasonIdx3 = Math.floor(rand(500 + i * 19) * MATCH_REASON_TEMPLATES.budgetRange.length);
                matchReasons.push(MATCH_REASON_TEMPLATES.budgetRange[reasonIdx3].replace('{value}', prefs.budgetRange));
                baseScore += 3 + Math.floor(rand(510 + i) * 4);
            }
            if (prefs.style) {
                var reasonIdx4 = Math.floor(rand(600 + i * 23) * MATCH_REASON_TEMPLATES.style.length);
                matchReasons.push(MATCH_REASON_TEMPLATES.style[reasonIdx4].replace('{value}', prefs.style));
                baseScore += 4 + Math.floor(rand(610 + i) * 5);
            }
            if (prefs.specialNeeds && prefs.specialNeeds.length > 0) {
                for (var s = 0; s < prefs.specialNeeds.length; s++) {
                    var need = prefs.specialNeeds[s];
                    if (MATCH_REASON_TEMPLATES.specialNeeds[need]) {
                        var needChance = rand(700 + i * 29 + s * 7);
                        if (needChance > 0.4) {
                            matchReasons.push(MATCH_REASON_TEMPLATES.specialNeeds[need]);
                            baseScore += 2 + Math.floor(rand(710 + i + s) * 3);
                        }
                    }
                }
            }

            var finalScore = Math.min(95, Math.max(60, baseScore));

            var tagCount = 3 + Math.floor(rand(800 + i * 31) * 3);
            var tags = [];
            var usedTags = {};
            for (var t = 0; t < tagCount; t++) {
                var tagIdx;
                do {
                    tagIdx = Math.floor(rand(900 + i * 37 + t * 5) * STRENGTH_TAGS_POOL.length);
                } while (usedTags[tagIdx]);
                usedTags[tagIdx] = true;
                tags.push(STRENGTH_TAGS_POOL[tagIdx]);
            }

            var riskCount = 1 + Math.floor(rand(1000 + i * 41) * 2);
            var risks = [];
            var usedRisks = {};
            for (var r = 0; r < riskCount; r++) {
                var riskIdx;
                do {
                    riskIdx = Math.floor(rand(1100 + i * 43 + r * 3) * RISK_WARNING_POOL.length);
                } while (usedRisks[riskIdx]);
                usedRisks[riskIdx] = true;
                risks.push(RISK_WARNING_POOL[riskIdx]);
            }

            var qualLevels = ['一级资质', '二级资质', '一级资质', '二级资质', '三级资质'];
            var qualification = qualLevels[Math.floor(rand(1200 + i * 47) * qualLevels.length)];

            var priceBase = 8 + Math.floor(rand(1300 + i * 53) * 18);
            var price = priceBase + '万';
            var pricePerSqm = (priceBase * 10000 / 100).toFixed(0) + '元/㎡';

            var durations = ['75天', '80天', '90天', '95天', '100天', '110天', '120天'];
            var duration = durations[Math.floor(rand(1400 + i * 59) * durations.length)];

            var reputation = (3.8 + rand(1500 + i * 61) * 1.2).toFixed(1);
            var repNum = parseFloat(reputation) || 0;
        if (repNum > 5) reputation = '5.0';

            var includeOptions = [
                '基础装修+主材+洁具+灯具',
                '硬装+定制柜+部分家电',
                '全包装修+全屋定制+软装搭配',
                '基础施工+辅材+主材代购',
                '整装套餐+家具+家电一站式'
            ];
            var includes = includeOptions[Math.floor(rand(1600 + i * 67) * includeOptions.length)];

            var addonOptions = ['高', '中', '高', '中', '低'];
            var addonClarity = addonOptions[Math.floor(rand(1700 + i * 71) * addonOptions.length)];

            var afterSalesOptions = ['2年整体质保+水电5年', '3年整体+水电6年', '2年质保+终身维护', '3年质保+水电10年'];
            var afterSales = afterSalesOptions[Math.floor(rand(1800 + i * 73) * afterSalesOptions.length)];

            companies.push({
                id: 'match_' + hashString(companyName + i) + '_' + i,
                name: companyName,
                matchScore: finalScore,
                matchReasons: matchReasons,
                strengthTags: tags,
                riskWarnings: risks,
                price: price,
                pricePerSqm: pricePerSqm,
                duration: duration,
                qualification: qualification,
                reputation: parseFloat(reputation) || 0,
                includes: includes,
                addonClarity: addonClarity,
                afterSales: afterSales,
                matched: true
            });
        }

        companies.sort(function(a, b) { return b.matchScore - a.matchScore; });

        return companies;
    }

    function addMatchedCompanyToCompare(matchedCompany) {
        var list = getCompanyList();
        if (list.length >= MAX_COMPANIES) {
            showToast('最多只能对比' + MAX_COMPANIES + '家公司');
            return false;
        }
        for (var i = 0; i < list.length; i++) {
            if (list[i].name === matchedCompany.name) {
                showToast('该公司已在对比列表中');
                return false;
            }
        }
        var newCompany = addCompany({
            name: matchedCompany.name,
            price: matchedCompany.price,
            duration: matchedCompany.duration,
            qualification: matchedCompany.qualification,
            reputation: matchedCompany.reputation,
            includes: matchedCompany.includes,
            addonClarity: matchedCompany.addonClarity,
            afterSales: matchedCompany.afterSales,
            notes: '智能匹配推荐（示例效果），匹配度' + matchedCompany.matchScore + '分'
        });
        if (newCompany) {
            showToast('已添加到对比列表');
            return true;
        }
        return false;
    }

    function renderAiMatchEntry() {
        var matchData = getMatchResults();
        var hasResults = matchData && matchData.companies && matchData.companies.length > 0;

        var html = '<div class="sop-ai-match-section">';
        html += '<div class="sop-ai-match-header">';
        html += '<div class="sop-ai-match-icon">🤖</div>';
        html += '<div class="sop-ai-match-info">';
        html += '<div class="sop-ai-match-title">智能匹配装修公司（示例效果）</div>';
        html += '<div class="sop-ai-match-desc">根据您的需求，推荐合适的装修公司参考</div>';
        html += '</div>';
        html += '</div>';

        if (hasResults) {
            html += '<div class="sop-ai-match-result-preview" data-action="view-ai-match-results">';
            html += '<div class="sop-ai-match-preview-count">';
            html += '<span class="sop-ai-match-preview-num">' + matchData.companies.length + '</span>';
            html += '<span class="sop-ai-match-preview-label">家匹配公司</span>';
            html += '</div>';
            html += '<div class="sop-ai-match-preview-scores">';
            for (var i = 0; i < Math.min(3, matchData.companies.length); i++) {
                html += '<div class="sop-ai-match-preview-item">';
                html += '<span class="sop-ai-match-preview-name">' + matchData.companies[i].name + '</span>';
                html += '<span class="sop-ai-match-preview-score">' + matchData.companies[i].matchScore + '分</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '<div class="sop-ai-match-view-btn">查看详情 →</div>';
            html += '</div>';
            html += '<button class="sop-ai-match-restart-btn" data-action="open-ai-match-modal">';
            html += '<span>🔄</span><span>重新匹配</span>';
            html += '</button>';
        } else {
            html += '<div class="sop-ai-match-entry" data-action="open-ai-match-modal">';
            html += '<div class="sop-ai-match-entry-icon">✨</div>';
            html += '<div class="sop-ai-match-entry-text">';
            html += '<div class="sop-ai-match-entry-title">开始匹配</div>';
            html += '<div class="sop-ai-match-entry-hint">选择偏好，为您推荐合适的装修公司参考</div>';
            html += '</div>';
            html += '<div class="sop-ai-match-entry-arrow">→</div>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function renderAiMatchModal() {
        var prefs = aiMatchPreferences;
        var showResults = aiMatchResults && aiMatchResults.length > 0;

        var html = '<div class="sop-ai-match-modal-overlay ' + (aiMatchModalOpen ? 'open' : '') + '" id="sop-ai-match-modal">';
        html += '<div class="sop-ai-match-modal">';
        html += '<div class="sop-ai-match-modal-header">';
        html += '<div class="sop-ai-match-modal-title">';
        html += '<span class="sop-ai-match-modal-title-icon">🤖</span>';
        html += '<span>' + (showResults ? '匹配结果（示例效果）' : '智能匹配（示例效果）') + '</span>';
        html += '</div>';
        html += '<button class="sop-ai-match-modal-close" data-action="close-ai-match-modal">×</button>';
        html += '</div>';
        html += '<div class="sop-ai-match-modal-body">';

        if (isGeneratingMatch) {
            html += '<div class="sop-ai-match-generating">';
            html += '<div class="sop-ai-match-generating-icon">🔄</div>';
            html += '<div class="sop-ai-match-generating-title">AI 正在为您匹配...</div>';
            html += '<div class="sop-ai-match-generating-text">正在分析您的需求并筛选最适合的装修公司</div>';
            html += '<div class="sop-ai-match-generating-progress">';
            html += '<div class="sop-ai-match-generating-bar"></div>';
            html += '</div>';
            html += '</div>';
        } else if (showResults) {
            html += '<div class="sop-ai-match-results">';
            for (var i = 0; i < aiMatchResults.length; i++) {
                var c = aiMatchResults[i];
                html += '<div class="sop-ai-match-result-card">';
                html += '<div class="sop-ai-match-result-header">';
                html += '<div class="sop-ai-match-result-name">' + c.name + '</div>';
                html += '<div class="sop-ai-match-result-score">';
                html += '<span class="sop-ai-match-result-score-num">' + c.matchScore + '</span>';
                html += '<span class="sop-ai-match-result-score-label">匹配度</span>';
                html += '</div>';
                html += '</div>';

                html += '<div class="sop-ai-match-result-section">';
                html += '<div class="sop-ai-match-result-section-title">匹配理由</div>';
                html += '<div class="sop-ai-match-reasons">';
                for (var r = 0; r < c.matchReasons.length; r++) {
                    html += '<div class="sop-ai-match-reason-item">';
                    html += '<span class="sop-ai-match-reason-icon">✓</span>';
                    html += '<span class="sop-ai-match-reason-text">' + c.matchReasons[r] + '</span>';
                    html += '</div>';
                }
                html += '</div>';
                html += '</div>';

                html += '<div class="sop-ai-match-result-section">';
                html += '<div class="sop-ai-match-result-section-title">优势标签</div>';
                html += '<div class="sop-ai-match-tags">';
                for (var t = 0; t < c.strengthTags.length; t++) {
                    html += '<span class="sop-ai-match-tag">' + c.strengthTags[t] + '</span>';
                }
                html += '</div>';
                html += '</div>';

                if (c.riskWarnings && c.riskWarnings.length > 0) {
                    html += '<div class="sop-ai-match-result-section">';
                    html += '<div class="sop-ai-match-result-section-title risk">风险预警</div>';
                    html += '<div class="sop-ai-match-risks">';
                    for (var w = 0; w < c.riskWarnings.length; w++) {
                        html += '<div class="sop-ai-match-risk-item">';
                        html += '<span class="sop-ai-match-risk-icon">⚠️</span>';
                        html += '<span class="sop-ai-match-risk-text">' + c.riskWarnings[w] + '</span>';
                        html += '</div>';
                    }
                    html += '</div>';
                    html += '</div>';
                }

                html += '<div class="sop-ai-match-result-footer">';
                html += '<div class="sop-ai-match-result-info">';
                html += '<span class="sop-ai-match-result-price">' + c.price + '</span>';
                html += '<span class="sop-ai-match-result-duration">' + c.duration + '</span>';
                html += '</div>';
                html += '<button class="sop-ai-match-add-btn" data-action="add-matched-company" data-match-index="' + i + '">';
                html += '<span>＋</span><span>加入对比</span>';
                html += '</button>';
                html += '</div>';

                html += '</div>';
            }
            html += '</div>';
        } else {
            html += '<div class="sop-ai-match-prefs">';

            html += '<div class="sop-ai-match-pref-group">';
            html += '<div class="sop-ai-match-pref-label">户型 <span class="sop-ai-match-pref-required">*</span></div>';
            html += '<div class="sop-ai-match-pref-options">';
            for (var r = 0; r < MATCH_ROOM_TYPES.length; r++) {
                var rt = MATCH_ROOM_TYPES[r];
                var isActive = prefs.roomType === rt.value;
                html += '<div class="sop-ai-match-pref-option ' + (isActive ? 'active' : '') + '" data-action="select-match-pref" data-pref-type="roomType" data-pref-value="' + rt.value + '">';
                html += rt.label;
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';

            html += '<div class="sop-ai-match-pref-group">';
            html += '<div class="sop-ai-match-pref-label">面积区间 <span class="sop-ai-match-pref-required">*</span></div>';
            html += '<div class="sop-ai-match-pref-options">';
            for (var a = 0; a < MATCH_AREA_RANGES.length; a++) {
                var ar = MATCH_AREA_RANGES[a];
                var isActive2 = prefs.areaRange === ar.value;
                html += '<div class="sop-ai-match-pref-option ' + (isActive2 ? 'active' : '') + '" data-action="select-match-pref" data-pref-type="areaRange" data-pref-value="' + ar.value + '">';
                html += ar.label;
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';

            html += '<div class="sop-ai-match-pref-group">';
            html += '<div class="sop-ai-match-pref-label">预算区间 <span class="sop-ai-match-pref-required">*</span></div>';
            html += '<div class="sop-ai-match-pref-options">';
            for (var b = 0; b < MATCH_BUDGET_RANGES.length; b++) {
                var br = MATCH_BUDGET_RANGES[b];
                var isActive3 = prefs.budgetRange === br.value;
                html += '<div class="sop-ai-match-pref-option ' + (isActive3 ? 'active' : '') + '" data-action="select-match-pref" data-pref-type="budgetRange" data-pref-value="' + br.value + '">';
                html += br.label;
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';

            html += '<div class="sop-ai-match-pref-group">';
            html += '<div class="sop-ai-match-pref-label">装修风格 <span class="sop-ai-match-pref-required">*</span></div>';
            html += '<div class="sop-ai-match-pref-options">';
            for (var s = 0; s < MATCH_STYLES.length; s++) {
                var st = MATCH_STYLES[s];
                var isActive4 = prefs.style === st.value;
                html += '<div class="sop-ai-match-pref-option ' + (isActive4 ? 'active' : '') + '" data-action="select-match-pref" data-pref-type="style" data-pref-value="' + st.value + '">';
                html += st.label;
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';

            html += '<div class="sop-ai-match-pref-group">';
            html += '<div class="sop-ai-match-pref-label">特殊需求 <span class="sop-ai-match-pref-hint">（可多选）</span></div>';
            html += '<div class="sop-ai-match-pref-options">';
            for (var n = 0; n < MATCH_SPECIAL_NEEDS.length; n++) {
                var sn = MATCH_SPECIAL_NEEDS[n];
                var isSelected = prefs.specialNeeds.indexOf(sn.value) > -1;
                html += '<div class="sop-ai-match-pref-option multi ' + (isSelected ? 'active' : '') + '" data-action="toggle-match-special" data-pref-value="' + sn.value + '">';
                html += '<span class="sop-ai-match-pref-option-icon">' + sn.icon + '</span>';
                html += '<span class="sop-ai-match-pref-option-text">' + sn.label + '</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';

            html += '</div>';
        }

        html += '</div>';

        if (!showResults && !isGeneratingMatch) {
            var canSubmit = prefs.roomType && prefs.areaRange && prefs.budgetRange && prefs.style;
            html += '<div class="sop-ai-match-modal-footer">';
            html += '<button class="sop-ai-match-cancel-btn" data-action="close-ai-match-modal">取消</button>';
            html += '<button class="sop-ai-match-submit-btn ' + (canSubmit ? '' : 'disabled') + '" data-action="submit-ai-match" ' + (canSubmit ? '' : 'disabled') + '>';
            html += '开始匹配';
            html += '</button>';
            html += '</div>';
        } else if (showResults) {
            html += '<div class="sop-ai-match-modal-footer">';
            html += '<button class="sop-ai-match-cancel-btn" data-action="close-ai-match-modal">关闭</button>';
            html += '<button class="sop-ai-match-restart-modal-btn" data-action="restart-ai-match">重新匹配</button>';
            html += '</div>';
        }

        html += '</div>';
        html += '</div>';
        return html;
    }

    function openAiMatchModal() {
        aiMatchModalOpen = true;
        var matchData = getMatchResults();
        if (matchData && matchData.preferences) {
            aiMatchPreferences = JSON.parse(JSON.stringify(matchData.preferences));
            aiMatchResults = matchData.companies || [];
        } else {
            aiMatchResults = [];
        }
        renderAllSteps();
    }

    function closeAiMatchModal() {
        aiMatchModalOpen = false;
        renderAllSteps();
    }

    function selectMatchPref(type, value) {
        aiMatchPreferences[type] = value;
        renderAiMatchModalOnly();
    }

    function toggleMatchSpecialNeed(value) {
        var idx = aiMatchPreferences.specialNeeds.indexOf(value);
        if (idx > -1) {
            aiMatchPreferences.specialNeeds.splice(idx, 1);
        } else {
            aiMatchPreferences.specialNeeds.push(value);
        }
        renderAiMatchModalOnly();
    }

    function submitAiMatch() {
        if (!aiMatchPreferences.roomType || !aiMatchPreferences.areaRange || !aiMatchPreferences.budgetRange || !aiMatchPreferences.style) {
            showToast('请填写所有必填项');
            return;
        }
        isGeneratingMatch = true;
        renderAiMatchModalOnly();

        addTimer(setTimeout(function() {
            aiMatchResults = generateMatchedCompanies();
            saveMatchResults(JSON.parse(JSON.stringify(aiMatchPreferences)), aiMatchResults);
            isGeneratingMatch = false;
            renderAllSteps();
        }, 2000));
    }

    function restartAiMatch() {
        aiMatchResults = [];
        isGeneratingMatch = false;
        renderAiMatchModalOnly();
    }

    function handleAddMatchedCompany(index) {
        var company = aiMatchResults[index];
        if (!company) return;
        var added = addMatchedCompanyToCompare(company);
        if (added) {
            renderAllSteps();
        }
    }

    function renderAiMatchModalOnly() {
        var oldModal = document.getElementById('sop-ai-match-modal');
        if (oldModal && oldModal.parentNode) {
            oldModal.parentNode.removeChild(oldModal);
        }
        var modalHtml = renderAiMatchModal();
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        var modalEl = tempDiv.firstElementChild;
        document.body.appendChild(modalEl);
        bindAiMatchModalEvents(modalEl);
    }

    function bindAiMatchModalEvents(modalEl) {
        if (!modalEl) return;
        modalEl.addEventListener('click', function(e) {
            var target = e.target;

            var closeBtn = target.closest('[data-action="close-ai-match-modal"]');
            if (closeBtn) {
                e.stopPropagation();
                closeAiMatchModal();
                return;
            }

            if (target === modalEl) {
                closeAiMatchModal();
                return;
            }

            var prefOption = target.closest('[data-action="select-match-pref"]');
            if (prefOption) {
                e.stopPropagation();
                var type = prefOption.getAttribute('data-pref-type');
                var value = prefOption.getAttribute('data-pref-value');
                selectMatchPref(type, value);
                return;
            }

            var specialOption = target.closest('[data-action="toggle-match-special"]');
            if (specialOption) {
                e.stopPropagation();
                var value2 = specialOption.getAttribute('data-pref-value');
                toggleMatchSpecialNeed(value2);
                return;
            }

            var submitBtn = target.closest('[data-action="submit-ai-match"]');
            if (submitBtn) {
                e.stopPropagation();
                submitAiMatch();
                return;
            }

            var restartBtn = target.closest('[data-action="restart-ai-match"]');
            if (restartBtn) {
                e.stopPropagation();
                restartAiMatch();
                return;
            }

            var addBtn = target.closest('[data-action="add-matched-company"]');
            if (addBtn) {
                e.stopPropagation();
                var idx = parseInt(addBtn.getAttribute('data-match-index'));
                handleAddMatchedCompany(idx);
                return;
            }
        });
    }

    function showToast(msg) {
        var toast = document.createElement('div');
        toast.className = 'sop-ai-match-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        addTimer(setTimeout(function() {
            toast.classList.add('show');
        }, 10));
        addTimer(setTimeout(function() {
            toast.classList.remove('show');
            addTimer(setTimeout(function() {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300));
        }, 2000));
    }

    // ========== AI 装修公司智能匹配结束 ==========


    function getProgress() {


        var mode = getDecorationMode();


        if (!App.state.sopProgress) {


            App.state.sopProgress = {


                full: { completedSteps: [], currentStep: 'F-1', currentStage: 0, stepPhotos: {}, stepDelays: {}, floorplanAnalysis: {}, quoteAudit: {}, contractAudit: {}, pointPlan: {}, matchResults: null, budgetMonitor: { totalBudget: 150000, expenses: [], addons: [] }, materialInspection: { records: [] }, scheduleTracker: { totalDays: 90, startDate: null, stageDurations: { prep: 15, plumbing: 15, tiling: 20, carpentry: 10, painting: 15, installation: 15 } }, finalSettlement: { contractPrice: 0, addons: [], deductions: [], payments: [], issues: [] }, airQuality: { area: 100, level: 'medium', materials: 'standard', furnitureCount: 5 } },


                half: { completedSteps: [], currentStep: 'H-1', currentStage: 0, stepPhotos: {}, stepDelays: {}, floorplanAnalysis: {}, quoteAudit: {}, contractAudit: {}, pointPlan: {}, matchResults: null, budgetMonitor: { totalBudget: 100000, expenses: [], addons: [] }, materialInspection: { records: [] }, scheduleTracker: { totalDays: 90, startDate: null, stageDurations: { prep: 15, plumbing: 15, tiling: 20, carpentry: 10, painting: 15, installation: 15 } }, finalSettlement: { contractPrice: 0, addons: [], deductions: [], payments: [], issues: [] }, airQuality: { area: 100, level: 'medium', materials: 'standard', furnitureCount: 5 } },


                self: { completedSteps: [], currentStep: 'S-1', currentStage: 0, stepPhotos: {}, stepDelays: {}, floorplanAnalysis: {}, quoteAudit: {}, contractAudit: {}, pointPlan: {}, matchResults: null, budgetMonitor: { totalBudget: 80000, expenses: [], addons: [] }, materialInspection: { records: [] }, scheduleTracker: { totalDays: 90, startDate: null, stageDurations: { prep: 15, plumbing: 15, tiling: 20, carpentry: 10, painting: 15, installation: 15 } }, finalSettlement: { contractPrice: 0, addons: [], deductions: [], payments: [], issues: [] }, airQuality: { area: 100, level: 'medium', materials: 'standard', furnitureCount: 5 } },


                settings: { paymentReminder: true, delayWarning: true, warrantyExpiry: true }


            };


        }


        if (!App.state.sopProgress[mode]) {


            App.state.sopProgress[mode] = {


                completedSteps: [],


                currentStep: mode === 'full' ? 'F-1' : (mode === 'half' ? 'H-1' : 'S-1'),


                currentStage: 0,


                stepPhotos: {},


                stepDelays: {}


            };


        }


        return App.state.sopProgress[mode];


    }


    function saveProgress() {


        App.saveState(true);


    }


    function loadPurchasedMaterials() {


        var mode = getDecorationMode();


        var progress = getProgress();


        if (progress && progress.purchasedMaterials) {


            purchasedMaterials = progress.purchasedMaterials;


        } else {


            purchasedMaterials = {};


        }


    }


    function savePurchasedMaterials() {


        var progress = getProgress();


        progress.purchasedMaterials = purchasedMaterials;


        saveProgress();


    }

    function formatMoney(amount) {
        return Math.round(amount).toLocaleString('zh-CN');
    }

    function getStepBudgetInfo(stepId) {
        if (!stepId) return { totalSpent: 0, expenses: [] };
        
        var budgetPlan = null;
        if (App && typeof App.getBudgetPlan === 'function') {
            budgetPlan = App.getBudgetPlan();
        } else if (App.state.userData && App.state.userData.budgetPlan) {
            budgetPlan = App.state.userData.budgetPlan;
        }
        
        if (!budgetPlan || !budgetPlan.stages) {
            return { totalSpent: 0, expenses: [] };
        }
        
        var totalSpent = 0;
        var stepExpenses = [];
        
        for (var i = 0; i < budgetPlan.stages.length; i++) {
            var stage = budgetPlan.stages[i];
            if (stage.expenses && stage.expenses.length > 0) {
                for (var j = 0; j < stage.expenses.length; j++) {
                    var exp = stage.expenses[j];
                    if (exp.stepId === stepId) {
                        totalSpent += exp.amount;
                        stepExpenses.push(exp);
                    }
                }
            }
        }
        
        return {
            totalSpent: totalSpent,
            expenses: stepExpenses
        };
    }


    function isStepCompleted(stepId) {


        var progress = getProgress();


        return progress.completedSteps.indexOf(stepId) !== -1;


    }


    function getStepStatus(stepId) {


        if (isStepCompleted(stepId)) return 'completed';


        if (getProgress().currentStep === stepId) return 'current';


        return 'upcoming';


    }


    function getTotalProgress() {


        var steps = getCurrentModeSteps();


        var total = steps.length;


        var completed = getProgress().completedSteps.length;


        return {


            total: total,


            completed: completed,


            percent: Math.round((completed / total) * 100)


        };


    }


    function isAllStepsCompleted() {
        var progress = getTotalProgress();
        return progress.completed >= progress.total && progress.total > 0;
    }


    function getStageProgress(stageIndex) {


        var steps = getCurrentModeSteps();


        var stageSteps = steps.filter(function(s) { return s.stageIndex === stageIndex; });


        var completed = stageSteps.filter(function(s) { return isStepCompleted(s.id); }).length;


        return {


            total: stageSteps.length,


            completed: completed,


            percent: stageSteps.length > 0 ? Math.round((completed / stageSteps.length) * 100) : 0


        };


    }


    function getMaterialProgress(step) {


        if (!step.materials || step.materials.length === 0) {


            return { total: 0, purchased: 0, percent: 0 };


        }


        var purchased = 0;


        step.materials.forEach(function(mat, idx) {


            var key = step.id + '_' + idx;


            if (purchasedMaterials[key]) {


                purchased++;


            }


        });


        return {


            total: step.materials.length,


            purchased: purchased,


            percent: step.materials.length > 0 ? Math.round((purchased / step.materials.length) * 100) : 0


        };

    }

    // 解析价格用于排序，返回数值（单位：万）
    function parsePriceForSort(priceStr) {
        if (!priceStr || priceStr === '免费' || priceStr === '待定' || priceStr === '按实际收费' || priceStr === '按合同约定' || priceStr === '定金30-50%') {
            return 0;
        }
        var str = String(priceStr);
        var match = str.match(/(\d+(?:\.\d+)?)/);
        if (match) {
            var num = parseFloat(match[1]);
            if (str.includes('万')) {
                return num * 10000;
            }
            return num;
        }
        return 0;
    }

    // 按价格从高到低排序材料
    function sortMaterialsByPrice(materials) {
        return materials.slice().sort(function(a, b) {
            return parsePriceForSort(b.price) - parsePriceForSort(a.price);
        });
    }

    // 复制材料清单
    function copyMaterialsList(stepId, category) {
        var step = getStepById(stepId);
        if (!step || !step.materials) return;

        var categoryMats = step.materials.filter(function(mat) {
            return mat.category === category;
        });
        var sortedMats = sortMaterialsByPrice(categoryMats);

        var text = category + '：\n';
        sortedMats.forEach(function(mat, idx) {
            text += (idx + 1) + '. ' + mat.name + ' × ' + mat.qty + '（' + mat.price + '）\n';
        });

        var allText = category + '（' + sortedMats.length + '项）\n';
        sortedMats.forEach(function(mat, idx) {
            allText += (idx + 1) + '. ' + mat.name + ' × ' + mat.qty + '（' + mat.price + '）\n';
            if (mat.tips) {
                allText += '   提示：' + mat.tips + '\n';
            }
        });

        navigator.clipboard.writeText(allText).then(function() {
            var btn = document.querySelector('[data-copy-category="' + category + '"][data-step-id="' + stepId + '"]');
            if (btn) {
                var originalText = btn.textContent;
                btn.textContent = '已复制!';
                btn.classList.add('copied');
                addTimer(setTimeout(function() {
                    btn.textContent = originalText;
                    btn.classList.remove('copied');
                }, 1500));
            }
        }).catch(function(err) {
            console.error('复制失败:', err);
        });
    }


    function getChecklistProgress(step) {


        if (!step.guide || !step.guide.checklist) {


            return { total: 0, checked: 0, percent: 0 };


        }


        var stepChecklist = checklistProgress[step.id] || {};


        var checked = 0;


        var total = step.guide.checklist.length;


        for (var i = 0; i < total; i++) {


            if (stepChecklist[i]) checked++;


        }


        return {


            total: total,


            checked: checked,


            percent: total > 0 ? Math.round((checked / total) * 100) : 0


        };


    }


    function loadChecklistProgress() {


        var progress = getProgress();


        if (progress && progress.checklistProgress) {


            checklistProgress = progress.checklistProgress;


        } else {


            checklistProgress = {};


        }


    }


    function saveChecklistProgress() {


        var progress = getProgress();


        progress.checklistProgress = checklistProgress;


        saveProgress();


    }


    function loadSafetyChecklistState() {


        var progress = getProgress();


        if (progress && progress.safetyChecklistState) {


            safetyChecklistState = progress.safetyChecklistState;


        } else {


            safetyChecklistState = {};


        }


    }


    function saveSafetyChecklistState() {


        var progress = getProgress();


        progress.safetyChecklistState = safetyChecklistState;


        saveProgress();


    }


    function ensureProgressInitialized() {


        var mode = getDecorationMode();


        var steps = getCurrentModeSteps();


        var stages = getCurrentModeStages();


        var validStepIds = steps.map(function(s) { return s.id; });


        if (!App.state.sopProgress) {


            App.state.sopProgress = {


                full: { completedSteps: [], currentStep: 'F-1', currentStage: 0, stepPhotos: {}, stepDelays: {}, floorplanAnalysis: {}, quoteAudit: {}, contractAudit: {}, pointPlan: {}, matchResults: null, budgetMonitor: { totalBudget: 150000, expenses: [], addons: [] }, materialInspection: { records: [] }, scheduleTracker: { totalDays: 90, startDate: null, stageDurations: { prep: 15, plumbing: 15, tiling: 20, carpentry: 10, painting: 15, installation: 15 } }, finalSettlement: { contractPrice: 0, addons: [], deductions: [], payments: [], issues: [] }, airQuality: { area: 100, level: 'medium', materials: 'standard', furnitureCount: 5 } },


                half: { completedSteps: [], currentStep: 'H-1', currentStage: 0, stepPhotos: {}, stepDelays: {}, floorplanAnalysis: {}, quoteAudit: {}, contractAudit: {}, pointPlan: {}, matchResults: null, budgetMonitor: { totalBudget: 100000, expenses: [], addons: [] }, materialInspection: { records: [] }, scheduleTracker: { totalDays: 90, startDate: null, stageDurations: { prep: 15, plumbing: 15, tiling: 20, carpentry: 10, painting: 15, installation: 15 } }, finalSettlement: { contractPrice: 0, addons: [], deductions: [], payments: [], issues: [] }, airQuality: { area: 100, level: 'medium', materials: 'standard', furnitureCount: 5 } },


                self: { completedSteps: [], currentStep: 'S-1', currentStage: 0, stepPhotos: {}, stepDelays: {}, floorplanAnalysis: {}, quoteAudit: {}, contractAudit: {}, pointPlan: {}, matchResults: null, budgetMonitor: { totalBudget: 80000, expenses: [], addons: [] }, materialInspection: { records: [] }, scheduleTracker: { totalDays: 90, startDate: null, stageDurations: { prep: 15, plumbing: 15, tiling: 20, carpentry: 10, painting: 15, installation: 15 } }, finalSettlement: { contractPrice: 0, addons: [], deductions: [], payments: [], issues: [] }, airQuality: { area: 100, level: 'medium', materials: 'standard', furnitureCount: 5 } },


                settings: { paymentReminder: true, delayWarning: true, warrantyExpiry: true }


            };


            saveProgress();


            return;


        }


        var modes = ['full', 'half', 'self'];


        for (var i = 0; i < modes.length; i++) {


            var m = modes[i];


            if (!App.state.sopProgress[m]) {


                App.state.sopProgress[m] = {


                    completedSteps: [],


                    currentStep: m === 'full' ? 'F-1' : (m === 'half' ? 'H-1' : 'S-1'),


                    currentStage: 0,


                    stepPhotos: {},


                    stepDelays: {}


                };


            }


        }


        var progress = App.state.sopProgress[mode];


        if (!progress) {


            progress = {


                completedSteps: [],


                currentStep: mode === 'full' ? 'F-1' : (mode === 'half' ? 'H-1' : 'S-1'),


                currentStage: 0,


                stepPhotos: {},


                stepDelays: {}


            };


            App.state.sopProgress[mode] = progress;


        }


        var modeSteps = mode === 'full' ? MODE_STEPS.full : (mode === 'half' ? MODE_STEPS.half : MODE_STEPS.self);


        var modeValidStepIds = modeSteps.map(function(s) { return s.id; });


        if (progress.completedSteps) {


            progress.completedSteps = progress.completedSteps.filter(function(id) {


                return modeValidStepIds.indexOf(id) !== -1;


            });


        } else {


            progress.completedSteps = [];


        }


        var defaultStep = mode === 'full' ? 'F-1' : (mode === 'half' ? 'H-1' : 'S-1');


        if (!progress.currentStep || modeValidStepIds.indexOf(progress.currentStep) === -1) {


            progress.currentStep = defaultStep;


            progress.currentStage = 0;


        }


        if (typeof progress.currentStage !== 'number' || progress.currentStage < 0 || progress.currentStage >= stages.length) {


            var currentStepObj = getStepById(progress.currentStep);


            progress.currentStage = currentStepObj ? currentStepObj.stageIndex : 0;


        }


        saveProgress();


    }


    function findNextStep(currentId) {


        var currentStep = getStepById(currentId);


        if (!currentStep) return null;


        var steps = getCurrentModeSteps();


        var nextStep = null;


        for (var i = 0; i < steps.length; i++) {


            if (steps[i].stageIndex === currentStep.stageIndex && steps[i].stepIndex === currentStep.stepIndex + 1) {


                nextStep = steps[i];


                break;


            }


        }


        if (!nextStep) {


            for (var j = 0; j < steps.length; j++) {


                if (steps[j].stageIndex === currentStep.stageIndex + 1 && steps[j].stepIndex === 0) {


                    nextStep = steps[j];


                    break;


                }


            }


        }


        return nextStep;


    }


    function findCurrentStep() {


        var progress = getProgress();


        return getStepById(progress.currentStep);


    }


    function render(containerEl) {


        container = containerEl;


        isMobile = window.innerWidth <= 900;


        ensureProgressInitialized();


        loadPurchasedMaterials();


        loadChecklistProgress();


        loadSafetyChecklistState();


        currentStepId = getProgress().currentStep;


        container.innerHTML = `


            <div class="sop-single-page">


                <header class="sop-top-bar">


                    <div class="sop-top-bar-inner">


                        <div class="sop-top-bar-left">


                            <button class="sop-top-bar-btn sop-back-btn" id="sop-back-home" title="返回首页">


                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">


                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>


                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>


                                </svg>


                            </button>


                            <span class="sop-mode-badge ${getModeClass()}" id="sop-mode-badge">${getModeLabel()}</span>


                        </div>


                        <div class="sop-top-bar-center">
                            <div class="sop-top-progress-enhanced" id="sop-top-progress-clickable">
                                <div class="sop-top-progress-info">
                                    <div class="sop-top-progress-stage" id="sop-top-progress-stage">${getCurrentStageTitle()}</div>
                                    <div class="sop-top-progress-step" id="sop-top-progress-step">${findCurrentStep() ? findCurrentStep().title : ''}</div>
                                </div>
                                <div class="sop-top-progress-bar-wrap">
                                    <div class="sop-top-progress-bar-large">
                                        <div class="sop-top-progress-fill-large" id="sop-top-progress-fill" style="width: 0%"></div>
                                    </div>
                                    <div class="sop-top-progress-meta">
                                        <span class="sop-top-progress-percent" id="sop-top-progress-percent">0%</span>
                                        <span class="sop-top-progress-count" id="sop-top-progress-text">0/23步</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div class="sop-top-bar-right">


                            <button class="sop-top-bar-btn sop-view-toggle-btn" id="sop-view-toggle-btn">完整模式</button>


                            <button class="sop-top-bar-btn sop-top-bar-btn-primary" data-panel="archive">档案</button>


                            <button class="sop-top-bar-btn sop-top-bar-btn-primary" data-panel="payment">付款</button>


                            <button class="sop-top-bar-btn" data-panel="warranty">质保</button>


                            <button class="sop-top-bar-btn" data-panel="setting">设置</button>


                        </div>


                    </div>


                </header>


                <div class="sop-step-overlay" id="sop-step-overlay"></div>


                <div class="sop-step-overview" id="sop-step-overview">


                    <div class="sop-step-overview-header">


                        <span class="sop-step-overview-title">全部步骤</span>


                        <button class="sop-step-overview-close" id="sop-step-overview-close">×</button>


                    </div>


                    <div class="sop-step-overview-body" id="sop-step-overview-body"></div>


                </div>


                ${renderSafetyBanner()}


                <main class="sop-steps-container" id="sop-steps-container">


                    <aside class="sop-step-nav" id="sop-step-nav">


                    </aside>


                    <div class="sop-stage-content" id="sop-stage-content">


                    </div>


                </main>

                <button class="sop-mobile-nav-toggle" id="sop-mobile-nav-toggle">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>

                <div class="sop-mobile-nav-drawer" id="sop-mobile-nav-drawer">
                    <div class="sop-mobile-nav-overlay" id="sop-mobile-nav-overlay"></div>
                    <div class="sop-mobile-nav-content" id="sop-mobile-nav-content-inner">
                    </div>
                </div>


                <div class="sop-completion-summary" id="sop-completion-summary" style="display: none;">

                </div>


                <div class="sop-side-panel-overlay" id="sop-side-panel-overlay"></div>


                <div class="sop-side-panel" id="sop-side-panel">


                    <div class="sop-side-panel-header">


                        <span class="sop-side-panel-title" id="sop-side-panel-title">档案</span>


                        <button class="sop-side-panel-close" id="sop-side-panel-close">×</button>


                    </div>


                    <div class="sop-side-panel-body" id="sop-side-panel-body"></div>


                </div>


                <div class="sop-celebration-overlay" id="sop-celebration-overlay" style="display: none;">


                    <canvas class="sop-celebration-canvas" id="sop-celebration-canvas"></canvas>


                    <div class="sop-celebration-content" id="sop-celebration-content" style="display:none;">


                        <div class="sop-celebration-nian">🎉</div>


                        <div class="sop-celebration-text">太棒了！</div>


                        <div class="sop-celebration-sub" id="sop-celebration-sub">这一步完成啦~</div>


                    </div>


                </div>


                <!-- 拍照上传弹窗 -->


                <div class="sop-photo-modal" id="sop-photo-modal">


                    <div class="sop-photo-modal-content">


                        <div class="sop-photo-modal-title">上传照片</div>


                        <div class="sop-photo-modal-options">


                            <div class="sop-photo-modal-option" data-action="take-photo">


                                <span class="sop-photo-modal-option-icon">📷</span>


                                <div class="sop-photo-modal-option-text">


                                    <div class="sop-photo-modal-option-title">拍照</div>


                                    <div class="sop-photo-modal-option-desc">使用相机拍摄照片</div>


                                </div>


                            </div>


                            <div class="sop-photo-modal-option" data-action="choose-photo">


                                <span class="sop-photo-modal-option-icon">🖼️</span>


                                <div class="sop-photo-modal-option-text">


                                    <div class="sop-photo-modal-option-title">从相册选择</div>


                                    <div class="sop-photo-modal-option-desc">从手机相册选择照片</div>


                                </div>


                            </div>


                        </div>


                        <button class="sop-photo-modal-close" id="sop-photo-modal-close">取消</button>


                    </div>


                </div>


                <!-- 延期弹窗 -->
                <div class="sop-delay-modal" id="sop-delay-modal">


                    <div class="sop-delay-modal-overlay" id="sop-delay-modal-overlay"></div>


                    <div class="sop-delay-modal-content">


                        <div class="sop-delay-modal-header">


                            <span class="sop-delay-modal-title">步骤延期</span>


                            <button class="sop-delay-modal-close" id="sop-delay-modal-close">×</button>


                        </div>


                        <div class="sop-delay-modal-body" id="sop-delay-modal-body">


                        </div>

                    </div>

                </div>

                <!-- 模式切换弹窗 -->
                <div class="sop-mode-switch-modal" id="sop-mode-switch-modal">
                    <div class="sop-mode-switch-modal-overlay" id="sop-mode-switch-modal-overlay"></div>
                    <div class="sop-mode-switch-modal-content">
                        <div class="sop-mode-switch-modal-header">
                            <span class="sop-mode-switch-modal-title">切换装修模式</span>
                            <button class="sop-mode-switch-modal-close" id="sop-mode-switch-modal-close">×</button>
                        </div>
                        <div class="sop-mode-switch-modal-body" id="sop-mode-switch-modal-body">
                        </div>
                    </div>
                </div>

                <!-- 完成确认弹窗 -->
                <div class="sop-complete-confirm-modal" id="sop-complete-confirm-modal">


                    <div class="sop-complete-confirm-modal-overlay" id="sop-complete-confirm-modal-overlay"></div>


                    <div class="sop-complete-confirm-modal-content">


                        <div class="sop-complete-confirm-modal-header">


                            <span class="sop-complete-confirm-modal-title">确定完成本步骤吗？</span>


                            <button class="sop-complete-confirm-modal-close" id="sop-complete-confirm-modal-close">×</button>


                        </div>


                        <div class="sop-complete-confirm-modal-body" id="sop-complete-confirm-modal-body">


                            <div class="sop-complete-confirm-desc">完成后可随时撤销哦~</div>


                            <div class="sop-complete-confirm-actions">
                                <button class="btn-secondary" id="sop-complete-confirm-cancel">再想想</button>
                                <button class="btn-primary" id="sop-complete-confirm-ok">确认完成</button>
                            </div>


                        </div>


                    </div>


                </div>

                <!-- 功能开发中提示 -->


                <div class="sop-dev-toast" id="sop-dev-toast">功能开发中</div>


            </div>


        `;


        eventListenersBound = false;
        stageEventsBound = false;


        cacheElements();


        renderAllSteps();

        renderCompletionSummary();

        updateTopProgress();

        updateTodayTodo();


        bindGlobalEvents();


        addTimer(setTimeout(function() {


            scrollToCurrentStep();


        }, 100));

        ensureAIChatBubble();


    }


    function getModeLabel() {


        var mode = getDecorationMode();


        return mode === 'full' ? '全包装修' : (mode === 'half' ? '半包装修' : '自装模式');


    }


    function getModeClass() {


        var mode = getDecorationMode();


        return mode === 'full' ? 'sop-mode-full' : (mode === 'half' ? 'sop-mode-half' : 'sop-mode-self');


    }


    var currentStageIndex = 0;


    function renderStepNav() {
        var navEl = el.stepNav || document.getElementById('sop-step-nav');
        if (!navEl) return;

        var stages = getCurrentModeStages();
        var steps = getCurrentModeSteps();
        var progress = getProgress();
        var currentStepObj = getStepById(progress.currentStep);
        var currentStageIndex = currentStepObj ? currentStepObj.stageIndex : 0;

        var html = '';

        html += '<div class="sop-step-nav-header">';
        html += '<div class="sop-step-nav-title"><span class="sop-step-nav-title-icon">📋</span><span>装修流程</span></div>';
        html += '<button class="sop-step-nav-overview-btn" id="sop-nav-overview-btn">全部步骤</button>';
        html += '</div>';

        for (var i = 0; i < stages.length; i++) {
            var stage = stages[i];
            var stageSteps = steps.filter(function(s) { return s.stageIndex === i; });
            var completedCount = 0;
            for (var j = 0; j < stageSteps.length; j++) {
                if (getStepStatus(stageSteps[j].id) === 'completed') {
                    completedCount++;
                }
            }
            var isCurrentStage = i === currentStageIndex;
            var isCompleted = completedCount === stageSteps.length && stageSteps.length > 0;
            var isCollapsed = collapsedNavStages[i] === true;

            if (isCurrentStage) {
                isCollapsed = false;
                collapsedNavStages[i] = false;
            }

            html += '<div class="sop-step-nav-stage ' + (isCurrentStage ? 'current' : '') + ' ' + (isCompleted ? 'completed' : '') + ' ' + (isCollapsed ? 'collapsed' : '') + '" data-stage-index="' + i + '">';
            html += '<div class="sop-step-nav-stage-header" data-action="toggle-stage">';
            html += '<div class="sop-step-nav-stage-icon">' + getStageIcon(stage.icon) + '</div>';
            html += '<div class="sop-step-nav-stage-info">';
            html += '<div class="sop-step-nav-stage-name">' + stage.title + '</div>';
            html += '<div class="sop-step-nav-stage-count">' + completedCount + '/' + stageSteps.length + ' 步</div>';
            html += '</div>';
            html += '<div class="sop-step-nav-stage-arrow">▼</div>';
            html += '</div>';

            html += '<div class="sop-step-nav-step-list">';
            for (var k = 0; k < stageSteps.length; k++) {
                var step = stageSteps[k];
                var stepStatus = getStepStatus(step.id);
                var isCurrentStep = stepStatus === 'current';
                var isStepCompleted = stepStatus === 'completed';

                var stepIcon = '';
                if (isStepCompleted) {
                    stepIcon = '✓';
                } else {
                    stepIcon = (k + 1);
                }

                var isLocked = stepStatus === 'upcoming';
                html += '<div class="sop-step-nav-step ' + stepStatus + (isLocked ? ' locked' : '') + '" data-step-id="' + step.id + '" data-action="nav-step">';
                html += '<div class="sop-step-nav-step-dot">' + stepIcon + '</div>';
                html += '<div class="sop-step-nav-step-name">' + step.title + '</div>';
                html += '</div>';
            }
            html += '</div>';

            html += '</div>';
        }

        navEl.innerHTML = html;
    }

    function getStageIcon(iconName) {
        var icons = {
            ruler: '📏',
            hammer: '🔨',
            paint: '🎨',
            window: '🪟',
            check: '✅'
        };
        return icons[iconName] || '📋';
    }


    function toggleNavStage(stageIndex) {
        if (collapsedNavStages[stageIndex]) {
            collapsedNavStages[stageIndex] = false;
        } else {
            collapsedNavStages[stageIndex] = true;
        }
        renderStepNav();
        renderMobileNavContent();
    }

    function handleNavStepClick(stepId) {
        closeMobileNavDrawer();
        gotoStep(stepId);
    }

    function renderMobileNavContent() {
        var mobileNavContent = el.mobileNavContent || document.getElementById('sop-mobile-nav-content-inner');
        if (!mobileNavContent) return;

        var stages = getCurrentModeStages();
        var steps = getCurrentModeSteps();
        var progress = getProgress();
        var currentStepObj = getStepById(progress.currentStep);
        var currentStageIndex = currentStepObj ? currentStepObj.stageIndex : 0;

        var html = '';
        html += '<div class="sop-mobile-nav-header">';
        html += '<div class="sop-mobile-nav-title">装修流程</div>';
        html += '<button class="sop-mobile-nav-close" id="sop-mobile-nav-close">×</button>';
        html += '</div>';
        html += '<div class="sop-mobile-nav-body">';

        for (var i = 0; i < stages.length; i++) {
            var stage = stages[i];
            var stageSteps = steps.filter(function(s) { return s.stageIndex === i; });
            var completedCount = 0;
            for (var j = 0; j < stageSteps.length; j++) {
                if (getStepStatus(stageSteps[j].id) === 'completed') {
                    completedCount++;
                }
            }
            var isCurrentStage = i === currentStageIndex;
            var isCompleted = completedCount === stageSteps.length && stageSteps.length > 0;
            var isCollapsed = collapsedNavStages[i] === true;
            if (isCurrentStage) isCollapsed = false;

            html += '<div class="sop-step-nav-stage ' + (isCurrentStage ? 'current' : '') + ' ' + (isCompleted ? 'completed' : '') + ' ' + (isCollapsed ? 'collapsed' : '') + '" data-mobile-stage-index="' + i + '">';
            html += '<div class="sop-step-nav-stage-header" data-action="toggle-mobile-stage">';
            html += '<div class="sop-step-nav-stage-icon">' + getStageIcon(stage.icon) + '</div>';
            html += '<div class="sop-step-nav-stage-info">';
            html += '<div class="sop-step-nav-stage-name">' + stage.title + '</div>';
            html += '<div class="sop-step-nav-stage-count">' + completedCount + '/' + stageSteps.length + ' 步</div>';
            html += '</div>';
            html += '<div class="sop-step-nav-stage-arrow">▼</div>';
            html += '</div>';

            html += '<div class="sop-step-nav-step-list">';
            for (var k = 0; k < stageSteps.length; k++) {
                var step = stageSteps[k];
                var stepStatus = getStepStatus(step.id);
                var stepIcon = stepStatus === 'completed' ? '✓' : (k + 1);
                var isLocked = stepStatus === 'upcoming';
                html += '<div class="sop-step-nav-step ' + stepStatus + (isLocked ? ' locked' : '') + '" data-step-id="' + step.id + '" data-action="nav-mobile-step">';
                html += '<div class="sop-step-nav-step-dot">' + stepIcon + '</div>';
                html += '<div class="sop-step-nav-step-name">' + step.title + '</div>';
                html += '</div>';
            }
            html += '</div>';
            html += '</div>';
        }

        html += '</div>';
        mobileNavContent.innerHTML = html;
    }

    function openMobileNavDrawer() {
        var drawer = document.getElementById('sop-mobile-nav-drawer');
        if (drawer) {
            drawer.classList.add('open');
            mobileNavOpen = true;
        }
    }

    function closeMobileNavDrawer() {
        var drawer = document.getElementById('sop-mobile-nav-drawer');
        if (drawer) {
            drawer.classList.remove('open');
            mobileNavOpen = false;
        }
    }

    function renderStageContent(stageIndex) {
        var contentEl = el.stageContent || document.getElementById('sop-stage-content');
        if (!contentEl) return;


        var steps = getCurrentModeSteps();
        var stageSteps = steps.filter(function(s) { return s.stageIndex === stageIndex; });


        var html = '';
        for (var i = 0; i < stageSteps.length; i++) {
            var step = stageSteps[i];
            var status = getStepStatus(step.id);
            html += renderStepCard(step, status);
        }


        contentEl.innerHTML = html;
        bindStepEvents();
    }


    function renderAllSteps() {
        var progress = getProgress();
        var currentStepObj = getStepById(progress.currentStep);
        if (currentStepObj) {
            currentStageIndex = currentStepObj.stageIndex;
        }
        renderStepNav();
        renderMobileNavContent();
        renderStageContent(currentStageIndex);
    }


    function renderCompletionSummary() {
        var summaryEl = el.completionSummary || document.getElementById('sop-completion-summary');
        if (!summaryEl) return;

        if (!isAllStepsCompleted()) {
            summaryEl.style.display = 'none';
            return;
        }

        summaryEl.style.display = 'block';

        var progress = getTotalProgress();
        var steps = getCurrentModeSteps();
        var paymentNodes = getCurrentPaymentNodes();

        var totalEstimatedDays = 0;
        for (var i = 0; i < steps.length; i++) {
            if (steps[i].estimateDays) {
                totalEstimatedDays += steps[i].estimateDays;
            }
        }

        var completedChecklist = 0;
        var totalChecklist = 0;
        for (var cid in checklistProgress) {
            var item = checklistProgress[cid];
            if (item && item.checked) completedChecklist++;
            if (item) totalChecklist++;
        }

        var warrantyItems = [
            { name: '水电防水工程', period: '5年', provider: '施工方' },
            { name: '基础装修工程', period: '2年', provider: '施工方' },
            { name: '定制柜体', period: '5年', provider: '定制商家' },
            { name: '瓷砖/地板', period: '1-3年', provider: '材料供应商' },
            { name: '五金配件', period: '1年', provider: '品牌方' },
            { name: '家电产品', period: '1-3年', provider: '品牌售后' }
        ];

        var html = '';
        html += '<div class="sop-completion-header">';
        html += '<div class="sop-completion-icon">🎉</div>';
        html += '<div class="sop-completion-title">竣工档案汇总</div>';
        html += '<div class="sop-completion-subtitle">全部步骤已标记完成</div>';
        html += '</div>';

        html += '<div class="sop-completion-stats">';

        html += '<div class="sop-completion-stat">';
        html += '<div class="sop-completion-stat-label">工期统计</div>';
        html += '<div class="sop-completion-stat-value">';
        html += '<span class="sop-completion-stat-num">' + totalEstimatedDays + '</span>天';
        html += '</div>';
        html += '<div class="sop-completion-stat-note">预计总工期</div>';
        html += '</div>';

        html += '<div class="sop-completion-stat">';
        html += '<div class="sop-completion-stat-label">步骤完成</div>';
        html += '<div class="sop-completion-stat-value">';
        html += '<span class="sop-completion-stat-num">' + progress.completed + '</span>/' + progress.total;
        html += '</div>';
        html += '<div class="sop-completion-stat-note">全部步骤已完成</div>';
        html += '</div>';

        html += '<div class="sop-completion-stat">';
        html += '<div class="sop-completion-stat-label">验收清单</div>';
        html += '<div class="sop-completion-stat-value">';
        html += '<span class="sop-completion-stat-num">' + completedChecklist + '</span>/' + totalChecklist;
        html += '</div>';
        html += '<div class="sop-completion-stat-note">验收项已完成</div>';
        html += '</div>';

        html += '</div>';

        html += '<div class="sop-completion-section">';
        html += '<div class="sop-completion-section-title">📦 全部资料打包下载</div>';
        html += '<button class="sop-completion-download-btn" id="sop-download-all-btn">';
        html += '<span>📥</span> 打包下载全部资料';
        html += '</button>';
        html += '<div class="sop-completion-section-note">包含合同、图纸、验收单、付款凭证等全部档案</div>';
        html += '</div>';

        html += '<div class="sop-completion-section">';
        html += '<div class="sop-completion-section-title">🛡️ 质保信息汇总</div>';
        html += '<div class="sop-warranty-summary-list">';
        for (var w = 0; w < warrantyItems.length; w++) {
            var item = warrantyItems[w];
            html += '<div class="sop-warranty-summary-item">';
            html += '<div class="sop-warranty-summary-name">' + item.name + '</div>';
            html += '<div class="sop-warranty-summary-period">' + item.period + '</div>';
            html += '<div class="sop-warranty-summary-provider">' + item.provider + '</div>';
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';

        html += '<div class="sop-completion-section">';
        html += '<div class="sop-completion-section-title">💳 付款信息总览</div>';
        html += '<div class="sop-payment-summary">';
        html += '<div class="sop-payment-summary-item">';
        html += '<span class="sop-payment-summary-label">付款节点</span>';
        html += '<span class="sop-payment-summary-value">' + paymentNodes.length + '个</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        // 自装安全档案板块
        if (isSelfDecorationMode()) {
            var highRiskStepsInProgress = [];
            var highRiskIds = ['S-4', 'S-7', 'S-8'];
            var stepsData = getCurrentModeSteps();
            for (var hs = 0; hs < stepsData.length; hs++) {
                if (highRiskIds.indexOf(stepsData[hs].id) !== -1) {
                    var hsCompleted = isStepCompleted(stepsData[hs].id);
                    highRiskStepsInProgress.push({
                        id: stepsData[hs].id,
                        title: stepsData[hs].title,
                        completed: hsCompleted
                    });
                }
            }
            html += '<div class="sop-completion-section">';
            html += '<div class="sop-completion-section-title">🛡️ 自装安全档案</div>';
            html += '<div class="sop-safety-archive-list">';
            for (var ha = 0; ha < highRiskStepsInProgress.length; ha++) {
                var haItem = highRiskStepsInProgress[ha];
                html += '<div class="sop-safety-archive-item ' + (haItem.completed ? 'completed' : '') + '">';
                html += '<span class="sop-safety-archive-icon">' + (haItem.completed ? '✓' : '○') + '</span>';
                html += '<span class="sop-safety-archive-title">' + haItem.title + '</span>';
                html += '<span class="sop-safety-archive-status">' + (haItem.completed ? '已完成' : '未完成') + '</span>';
                html += '</div>';
            }
            html += '</div>';
            html += '<div class="sop-safety-archive-tip">高危工种施工安全已归档，建议妥善保管工人保险凭证</div>';
            html += '</div>';
        }

        summaryEl.innerHTML = html;

        var downloadBtn = document.getElementById('sop-download-all-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function() {
                Toast.info('功能开发中');
            });
        }
    }


    function renderStepCard(step, status) {


        if (status === 'completed') {


            return renderCompletedStep(step);


        } else if (status === 'current') {


            return renderCurrentStep(step);


        } else {


            return renderUpcomingStep(step);


        }


    }


    function renderCompletedStep(step) {


        var isExpanded = expandedCompletedStepId === step.id;


        var stages = getCurrentModeStages();


        var stage = stages[step.stageIndex];


        return `


            <div class="sop-step-card sop-step-completed ${isExpanded ? 'expanded' : ''}" data-step-id="${step.id}" data-status="completed">


                <div class="sop-step-header" data-action="toggle-completed">


                    <div class="sop-step-header-left">


                        <div class="sop-step-circle completed">


                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">


                                <polyline points="20 6 9 17 4 12"></polyline>


                            </svg>


                        </div>


                        <div class="sop-step-title-wrap">


                            <div class="sop-step-stage">阶段${stage.id} · 第${step.stepIndex + 1}步</div>


                            <div class="sop-step-title">${step.title}</div>


                        </div>


                    </div>


                    <div class="sop-step-header-right">


                        <button class="sop-undo-btn" data-step-id="${step.id}" data-action="undo-step" title="撤销完成">撤销完成</button>


                        <span class="sop-step-expand-arrow">${isExpanded ? '▲' : '▼'}</span>


                    </div>


                </div>


                <div class="sop-step-body" ${isExpanded ? '' : 'style="display:none;"'}>


                    ${renderStepDetailContent(step, 'completed')}


                </div>


            </div>


        `;


    }


    function renderCurrentStep(step) {


        var stages = getCurrentModeStages();


        var stage = stages[step.stageIndex];


        var checklistProg = getChecklistProgress(step);


        var allChecked = checklistProg.total > 0 && checklistProg.checked === checklistProg.total;


        var safetyCompleted = checkSafetyCompleted(step.id);


        var canComplete = allChecked && safetyCompleted;


        var isHighRisk = isHighRiskStep(step.id);


        return `


            <div class="sop-step-card sop-step-current" data-step-id="${step.id}" data-status="current" id="sop-step-current">


                ${isHighRisk ? renderSafetyReminderBar(step.id) : ''}


                <div class="sop-step-header">


                    <div class="sop-step-header-left">


                        <div class="sop-step-circle current">


                            <span>${step.stepIndex + 1}</span>


                        </div>


                        <div class="sop-step-title-wrap">


                            <div class="sop-step-stage">阶段${stage.id}：${stage.title} · 第${step.stepIndex + 1}步</div>


                            <div class="sop-step-title">


                                ${step.title}


                                ${step.aiTrigger ? '<span class="sop-ai-badge-small">AI</span>' : ''}


                            </div>


                        </div>


                    </div>


                    <div class="sop-step-header-right">


                        <button class="btn-secondary sop-delay-btn" id="sop-delay-btn" data-step-id="${step.id}">


                            <span>⏰</span>


                            <span>延期 ▼</span>


                        </button>


                        <button class="btn-primary sop-complete-btn sop-complete-btn-enhanced" id="sop-complete-btn" ${canComplete ? '' : 'disabled style="opacity:0.5;cursor:not-allowed;"'}>


                            <span class="btn-icon">✓</span>


                            <span>完成这一步</span>


                        </button>


                    </div>


                </div>


                <div class="sop-step-body">


                    ${isHighRisk ? '<div id="sop-safety-checklist"></div>' : ''}


                    ${renderStepDetailContent(step, 'current')}


                </div>


            </div>


        `;


    }


    function renderUpcomingStep(step) {


        var isExpanded = expandedStepId === step.id;


        var stages = getCurrentModeStages();


        var stage = stages[step.stageIndex];


        return `


            <div class="sop-step-card sop-step-upcoming ${isExpanded ? 'expanded' : ''}" data-step-id="${step.id}" data-status="upcoming">


                <div class="sop-step-header" data-action="toggle-upcoming">


                    <div class="sop-step-header-left">


                        <div class="sop-step-circle upcoming">


                            <span>${step.stepIndex + 1}</span>


                        </div>


                        <div class="sop-step-title-wrap">


                            <div class="sop-step-stage">阶段${stage.id} · 第${step.stepIndex + 1}步</div>


                            <div class="sop-step-title">${step.title}</div>


                        </div>


                    </div>


                    <div class="sop-step-header-right">


                        <span class="sop-step-estimate">预计${getEstimateDays(step)}天</span>


                        <span class="sop-step-expand-arrow">${isExpanded ? '▲' : '▼'}</span>


                    </div>


                </div>


                <div class="sop-step-body" ${isExpanded ? '' : 'style="display:none;"'}>


                    ${renderStepDetailContent(step, 'upcoming')}


                    <div class="sop-upcoming-footer">


                        <button class="btn-secondary sop-upcoming-close-btn" data-action="close-upcoming">我知道了</button>


                    </div>


                </div>


            </div>


        `;


    }


    function getEstimateDays(step) {


        var estimates = { 0: 7, 1: 5, 2: 10, 3: 7, 4: 3 };


        return estimates[step.stageIndex] || 5;


    }


    function renderStepDetailContent(step, status) {

        var isF1Step = step.id === 'F-1';


        var checklistProg = getChecklistProgress(step);


        var allChecked = checklistProg.total > 0 && checklistProg.checked === checklistProg.total;


        var html = '';


        if (!isF1Step) {
            html += `

            <div class="sop-step-desc">


                <div class="sop-step-desc-icon">💡</div>


                <div class="sop-step-desc-text">${step.description}</div>


            </div>

        `;
        }

        var stepBudgetInfo = getStepBudgetInfo(step.id);
        if (stepBudgetInfo && (stepBudgetInfo.totalSpent > 0 || stepBudgetInfo.expenses.length > 0)) {
            html += `
                <div class="sop-step-budget-section">
                    <div class="sop-step-budget-header">
                        <span class="sop-step-budget-icon">💰</span>
                        <span class="sop-step-budget-title">本步支出</span>
                        <span class="sop-step-budget-amount">¥ ${formatMoney(stepBudgetInfo.totalSpent)}</span>
                    </div>
                    ${stepBudgetInfo.expenses.length > 0 ? `
                        <div class="sop-step-budget-expenses">
                            ${stepBudgetInfo.expenses.slice(0, 3).map(function(exp) {
                                return `
                                    <div class="sop-step-budget-expense-item">
                                        <span class="sop-step-budget-expense-category">${exp.category}</span>
                                        <span class="sop-step-budget-expense-amount">¥${formatMoney(exp.amount)}</span>
                                    </div>
                                `;
                            }).join('')}
                            ${stepBudgetInfo.expenses.length > 3 ? `
                                <div class="sop-step-budget-expense-more">还有 ${stepBudgetInfo.expenses.length - 3} 笔支出...</div>
                            ` : ''}
                    </div>
                    ` : ''}
            `;
        }


        if (!isF1Step && step.riskWarning && step.riskWarning !== '—' && step.riskWarning !== '') {


            html += `


                <div class="sop-risk-warning">


                    <div class="sop-risk-warning-icon">⚠️</div>


                    <div class="sop-risk-warning-content">


                        <div class="sop-risk-warning-title">本步最大坑</div>


                        <div class="sop-risk-warning-text">${step.riskWarning}</div>


                    </div>


                </div>


            `;


        }


        if (!isF1Step && step.nianTip) {


            html += `


                <div class="sop-nian-section">


                    <div class="sop-nian-avatar">${Icons.render('nian-happy')}</div>


                    <div class="sop-nian-bubble">


                        <div class="sop-nian-bubble-text">${step.nianTip}</div>


                    </div>


                </div>


            `;


        }

        if (isF1Step) {
            html += renderCompanyComparison(step);
        }


        var stepAITools = STEP_AI_TOOLS[step.id];
        if (stepAITools && stepAITools.length > 0) {
            html += '<div class="sop-section sop-ai-tools-section">';
            html += '<div class="sop-section-title"><span class="sop-section-title-icon">🛠️</span><span>AI 工具</span></div>';
            html += '<div class="sop-ai-tool-cards">';
            for (var ti = 0; ti < stepAITools.length; ti++) {
                html += renderAIToolCard(stepAITools[ti], step.id);
            }
            html += '</div>';
            html += '</div>';
        }


        var extraData = STEP_EXTRA_DATA[step.id];
        if (extraData && (extraData.notes && extraData.notes.length > 0 || extraData.pitfalls && extraData.pitfalls.length > 0)) {
            html += '<div class="sop-section sop-notes-pitfalls-section">';

            if (extraData.notes && extraData.notes.length > 0) {
                var notesExpanded = expandedNotesPitfalls[step.id + '_notes'] || false;
                html += `
                    <div class="sop-collapse-card ${notesExpanded ? 'expanded' : ''}" data-step="${step.id}" data-type="notes" data-action="toggle-notes-pitfalls">
                        <div class="sop-collapse-card-header">
                            <div class="sop-collapse-card-title">
                                <span class="sop-collapse-card-icon">⚠️</span>
                                <span>注意事项</span>
                                <span class="sop-collapse-card-count">${extraData.notes.length}条</span>
                            </div>
                            <div class="sop-collapse-card-arrow">▼</div>
                        </div>
                        <div class="sop-collapse-card-body">
                            <ul class="sop-notes-list">
                                ${extraData.notes.map(function(note) {
                                    return '<li class="sop-note-item">' + note + '</li>';
                                }).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            }

            if (extraData.pitfalls && extraData.pitfalls.length > 0) {
                var pitfallsExpanded = expandedNotesPitfalls[step.id + '_pitfalls'] || false;
                html += `
                    <div class="sop-collapse-card ${pitfallsExpanded ? 'expanded' : ''}" data-step="${step.id}" data-type="pitfalls" data-action="toggle-notes-pitfalls">
                        <div class="sop-collapse-card-header">
                            <div class="sop-collapse-card-title">
                                <span class="sop-collapse-card-icon">💡</span>
                                <span>避坑指南</span>
                                <span class="sop-collapse-card-count">${extraData.pitfalls.length}个常见坑</span>
                            </div>
                            <div class="sop-collapse-card-arrow">▼</div>
                        </div>
                        <div class="sop-collapse-card-body">
                            <div class="sop-pitfalls-list">
                                ${extraData.pitfalls.map(function(pitfall) {
                                    return `
                                        <div class="sop-pitfall-item">
                                            <div class="sop-pitfall-title">🚫 ${pitfall.title}</div>
                                            <div class="sop-pitfall-desc">${pitfall.desc}</div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }

            html += '</div>';
        }


        if (step.guide && step.guide.checklist && step.guide.checklist.length > 0) {


            var totalItems = step.guide.checklist.length;

            var stepPhotos = getProgress().stepPhotos[step.id] || {};
            var isReadOnly = isStepCompleted(step.id);

            html += `


                <div class="sop-section">


                    <div class="sop-checklist-header-enhanced">
                        <div class="sop-checklist-stats">
                            <div class="sop-checklist-stat-item">
                                <div class="sop-checklist-stat-value">${checklistProg.checked}/${checklistProg.total}</div>
                                <div class="sop-checklist-stat-label">验收清单</div>
                            </div>
                        </div>
                        ${!isReadOnly && checklistProg.checked < checklistProg.total ? '<button class="sop-checklist-mark-all-btn" data-step="' + step.id + '" data-action="mark-all-checklist">一键全部完成</button>' : ''}
                    </div>


                    <div class="sop-checklist-progress">


                        <div class="sop-checklist-progress-bar">


                            <div class="sop-checklist-progress-fill ${allChecked ? 'all-done' : ''}" style="width: ${checklistProg.percent}%"></div>


                        </div>


                    </div>


                    <div class="sop-checklist-list single-column">


            `;

            for (var ci = 0; ci < totalItems; ci++) {
                var itemText = step.guide.checklist[ci];
                var isChecked = checklistProgress[step.id] && checklistProgress[step.id][ci];
                var photos = stepPhotos[ci] || [];
                html += `


                                <div class="sop-checklist-item ${isChecked ? 'checked' : ''}" data-step="${step.id}" data-index="${ci}">


                                    <div class="sop-checklist-checkbox">


                                        ${isChecked ? '✓' : ''}


                                    </div>


                                    <div class="sop-checklist-text">${itemText}</div>


                                </div>


                                ${photos.length > 0 ? '<div class="sop-checklist-photos" data-step="' + step.id + '" data-index="' + ci + '">' + photos.map(function(p, pi) { return '<div class="sop-checklist-photo-thumb" data-step="' + step.id + '" data-index="' + ci + '" data-photo-index="' + pi + '"><img src="' + p + '" alt="照片"><span class="sop-checklist-photo-remove" data-step="' + step.id + '" data-index="' + ci + '" data-photo-index="' + pi + '">×</span></div>'; }).join('') + '</div>' : ''}


                `;
            }

            html += `


                    </div>


                </div>

            `;

        } else if (step.guide) {

            html += `

                <div class="sop-section">
                    <div class="sop-empty-checklist empty-state-mini">
                        <div class="empty-state">
                            <div class="empty-state-icon thinking">
                                ${Icons.render('nian-confused')}
                            </div>
                            <div class="empty-state-title">本步骤暂无验收项</div>
                            <div class="empty-state-desc">可以添加自定义验收项，或者直接标记完成~</div>
                        </div>
                    </div>
                </div>

            `;

        }


        if (!isF1Step && step.guide && step.guide.text) {


            html += `


                <div class="sop-section">


                    <div class="sop-section-title">


                        <span class="sop-section-title-icon">📝</span>


                        <span>操作说明</span>


                    </div>


                    <div class="sop-guide-text">${step.guide.text}</div>


                </div>


            `;


        }


        if (!isF1Step && step.guide && step.guide.notes && step.guide.notes.length > 0) {


            html += `


                <div class="sop-section">


                    <div class="sop-section-title">


                        <span class="sop-section-title-icon">📌</span>


                        <span>注意事项</span>


                    </div>


                    <div class="sop-notes-list">


            `;


            for (var j = 0; j < step.guide.notes.length; j++) {


                html += `


                    <div class="sop-note-item">


                        <span class="sop-note-bullet">${j + 1}</span>


                        <span class="sop-note-text">${step.guide.notes[j]}</span>


                    </div>


                `;


            }


            html += `


                    </div>


                </div>


            `;


        }


        if (step.materials && step.materials.length > 0) {


            var matProgress = getMaterialProgress(step);

            // 按category分组
            var categories = {};
            step.materials.forEach(function(mat, idx) {
                var cat = mat.category || '其他';
                if (!categories[cat]) {
                    categories[cat] = [];
                }
                categories[cat].push({ mat: mat, idx: idx });
            });

            // 计算每个分类的价格区间
            function getPriceRange(matList) {
                var prices = matList.map(function(item) {
                    return parsePriceForSort(item.mat.price);
                }).filter(function(p) { return p > 0; });

                if (prices.length === 0) return '';
                var max = Math.max.apply(null, prices);
                var min = Math.min.apply(null, prices);
                if (max === min) return '';
                // 转换为万单位显示
                if (max >= 10000) {
                    return (min / 10000).toFixed(min % 10000 === 0 ? 0 : 1) + '-' + (max / 10000).toFixed(0) + '万';
                }
                return min + '-' + max + '元';
            }

            html += `


                <div class="sop-section">


                    <div class="sop-section-title">


                        <span class="sop-section-title-icon">📦</span>


                        <span>${step.materialCategory || '采购/资料清单'}</span>


                        <span class="sop-section-badge">${matProgress.purchased}/${matProgress.total}</span>


                    </div>


                    <div class="sop-materials-list">


            `;

            // 按category排序输出，资料清单在前，其余按名称排序
            var categoryNames = Object.keys(categories);
            categoryNames.sort(function(a, b) {
                if (a === '资料清单') return -1;
                if (b === '资料清单') return 1;
                return a.localeCompare(b);
            });

            categoryNames.forEach(function(cat) {
                var catItems = categories[cat];
                var sortedItems = sortMaterialsByPrice(catItems);
                var priceRange = getPriceRange(sortedItems);

                html += `


                    <div class="sop-material-category">


                        <div class="sop-material-category-header">


                            <span class="sop-material-category-title">${cat}</span>


                            ${priceRange ? '<span class="sop-material-price-range">' + priceRange + '</span>' : ''}


                            <button class="sop-material-copy-btn" data-step-id="${step.id}" data-copy-category="${cat}">一键复制</button>


                        </div>


                        <div class="sop-material-category-items">


                `;

                sortedItems.forEach(function(item) {
                    var mat = item.mat;
                    var k = item.idx;
                    var matKey = step.id + '_' + k;
                    var isPurchased = purchasedMaterials[matKey];

                    html += `


                            <div class="sop-material-item ${isPurchased ? 'purchased' : ''}" data-step="${step.id}" data-mat-index="${k}">


                                <div class="sop-material-checkbox">


                                    ${isPurchased ? '✓' : ''}


                                </div>


                                <div class="sop-material-info">


                                    <div class="sop-material-name">${mat.name}</div>


                                    <div class="sop-material-meta">


                                        <span class="sop-material-qty">${mat.qty}</span>


                                        <span class="sop-material-price">${mat.price}</span>


                                    </div>


                                    <div class="sop-material-tips">${mat.tips || ''}</div>


                                </div>


                            </div>


                    `;
                });

                html += `


                        </div>


                    </div>


                `;
            });

            html += `


                    </div>


                </div>


            `;


        }


        var deepData = null;
        if (typeof SopData !== 'undefined') {
            deepData = SopData.getDeepData(step.id);
        }

        if (deepData) {
            html += '<div class="sop-section sop-deep-content-section">';

            var tabItems = [];
            if (deepData.realCase && deepData.realCase.length > 0) tabItems.push({ key: 'realCase', label: '真实案例', icon: '📖' });
            if (deepData.faq && deepData.faq.length > 0) tabItems.push({ key: 'faq', label: '常见问题', icon: '❓' });
            if (deepData.tips && deepData.tips.length > 0) tabItems.push({ key: 'tips', label: '过来人经验', icon: '💡' });
            if (deepData.checklist && deepData.checklist.length > 0) tabItems.push({ key: 'checklist', label: '验收清单', icon: '✅' });
            if (deepData.materials && deepData.materials.length > 0) tabItems.push({ key: 'materials', label: '材料选购', icon: '🛒' });
            if (deepData.duration) tabItems.push({ key: 'duration', label: '工期参考', icon: '⏰' });

            if (tabItems.length > 0) {
                var activeTab = deepTabStates[step.id] || tabItems[0].key;

                html += '<div class="sop-deep-tabs">';
                for (var ti = 0; ti < tabItems.length; ti++) {
                    var tab = tabItems[ti];
                    var isActive = tab.key === activeTab;
                    html += '<div class="sop-deep-tab-item ' + (isActive ? 'active' : '') + '" data-step="' + step.id + '" data-tab="' + tab.key + '" data-action="deep-tab-switch">';
                    html += '<span class="sop-deep-tab-icon">' + tab.icon + '</span>';
                    html += '<span class="sop-deep-tab-label">' + tab.label + '</span>';
                    html += '</div>';
                }
                html += '</div>';

                html += '<div class="sop-deep-tab-content">';

                if (deepData.realCase && deepData.realCase.length > 0 && activeTab === 'realCase') {
                    for (var ri = 0; ri < deepData.realCase.length; ri++) {
                        var rc = deepData.realCase[ri];
                        html += '<div class="sop-real-case-card">';
                        html += '<div class="sop-real-case-header">';
                        html += '<span class="sop-real-case-badge">案例</span>';
                        html += '<span class="sop-real-case-title">' + rc.title + '</span>';
                        html += '</div>';
                        html += '<div class="sop-real-case-body">';
                        html += '<p class="sop-real-case-desc">' + rc.desc + '</p>';
                        html += '<div class="sop-real-case-meta">';
                        if (rc.cost) {
                            html += '<div class="sop-real-case-meta-item">';
                            html += '<span class="sop-real-case-meta-label">💰 花费</span>';
                            html += '<span class="sop-real-case-meta-value">' + rc.cost + '</span>';
                            html += '</div>';
                        }
                        if (rc.duration) {
                            html += '<div class="sop-real-case-meta-item">';
                            html += '<span class="sop-real-case-meta-label">⏰ 时长</span>';
                            html += '<span class="sop-real-case-meta-value">' + rc.duration + '</span>';
                            html += '</div>';
                        }
                        html += '</div>';
                        if (rc.lesson) {
                            html += '<div class="sop-real-case-lesson">';
                            html += '<span class="sop-real-case-lesson-label">📝 经验教训</span>';
                            html += '<p class="sop-real-case-lesson-text">' + rc.lesson + '</p>';
                            html += '</div>';
                        }
                        html += '</div>';
                        html += '</div>';
                    }
                }

                if (deepData.faq && deepData.faq.length > 0 && activeTab === 'faq') {
                    html += '<div class="sop-faq-list">';
                    var stepFaqStates = deepFaqStates[step.id] || {};
                    for (var fi = 0; fi < deepData.faq.length; fi++) {
                        var faq = deepData.faq[fi];
                        var faqExpanded = !!stepFaqStates[fi];
                        html += '<div class="sop-faq-item ' + (faqExpanded ? 'expanded' : '') + '" data-step="' + step.id + '" data-index="' + fi + '" data-action="faq-toggle">';
                        html += '<div class="sop-faq-question">';
                        html += '<span class="sop-faq-q-icon">Q</span>';
                        html += '<span class="sop-faq-q-text">' + faq.q + '</span>';
                        html += '<span class="sop-faq-arrow">▼</span>';
                        html += '</div>';
                        html += '<div class="sop-faq-answer">';
                        html += '<span class="sop-faq-a-icon">A</span>';
                        html += '<span class="sop-faq-a-text">' + faq.a + '</span>';
                        html += '</div>';
                        html += '</div>';
                    }
                    html += '</div>';
                }

                if (deepData.tips && deepData.tips.length > 0 && activeTab === 'tips') {
                    html += '<div class="sop-tips-list">';
                    for (var ti2 = 0; ti2 < deepData.tips.length; ti2++) {
                        var tip = deepData.tips[ti2];
                        html += '<div class="sop-tip-card">';
                        html += '<span class="sop-tip-quote">"</span>';
                        html += '<p class="sop-tip-text">' + tip + '</p>';
                        html += '</div>';
                    }
                    html += '</div>';
                }

                if (deepData.checklist && deepData.checklist.length > 0 && activeTab === 'checklist') {
                    var deepCheckState = deepChecklistStates[step.id] || {};
                    var dcTotal = deepData.checklist.length;
                    var dcChecked = 0;
                    for (var dci = 0; dci < dcTotal; dci++) {
                        if (deepCheckState[dci]) dcChecked++;
                    }
                    var dcPercent = dcTotal > 0 ? Math.round((dcChecked / dcTotal) * 100) : 0;

                    html += '<div class="sop-deep-checklist-header">';
                    html += '<div class="sop-deep-checklist-progress">';
                    html += '<span class="sop-deep-checklist-count">' + dcChecked + '/' + dcTotal + '</span>';
                    html += '<span class="sop-deep-checklist-label">已完成</span>';
                    html += '</div>';
                    html += '</div>';
                    html += '<div class="sop-deep-checklist-progress-bar">';
                    html += '<div class="sop-deep-checklist-progress-fill" style="width:' + dcPercent + '%"></div>';
                    html += '</div>';
                    html += '<div class="sop-deep-checklist-items">';
                    for (var ci2 = 0; ci2 < dcTotal; ci2++) {
                        var ciChecked = !!deepCheckState[ci2];
                        html += '<div class="sop-deep-checklist-item ' + (ciChecked ? 'checked' : '') + '" data-step="' + step.id + '" data-index="' + ci2 + '" data-action="deep-checklist-toggle">';
                        html += '<div class="sop-deep-checklist-checkbox">' + (ciChecked ? '✓' : '') + '</div>';
                        html += '<span class="sop-deep-checklist-text">' + deepData.checklist[ci2] + '</span>';
                        html += '</div>';
                    }
                    html += '</div>';
                }

                if (deepData.materials && deepData.materials.length > 0 && activeTab === 'materials') {
                    html += '<div class="sop-deep-materials-list">';
                    for (var mi = 0; mi < deepData.materials.length; mi++) {
                        var mat = deepData.materials[mi];
                        html += '<div class="sop-deep-material-card">';
                        html += '<div class="sop-deep-material-header">';
                        html += '<span class="sop-deep-material-name">' + mat.name + '</span>';
                        if (mat.price) {
                            html += '<span class="sop-deep-material-price">' + mat.price + '</span>';
                        }
                        html += '</div>';
                        if (mat.desc) {
                            html += '<p class="sop-deep-material-desc">' + mat.desc + '</p>';
                        }
                        if (mat.tips) {
                            html += '<div class="sop-deep-material-tips">';
                            html += '<span class="sop-deep-material-tips-label">💡 选购要点</span>';
                            html += '<p class="sop-deep-material-tips-text">' + mat.tips + '</p>';
                            html += '</div>';
                        }
                        html += '</div>';
                    }
                    html += '</div>';
                }

                if (deepData.duration && activeTab === 'duration') {
                    html += '<div class="sop-deep-duration-card">';
                    html += '<div class="sop-deep-duration-main">';
                    html += '<span class="sop-deep-duration-icon">⏰</span>';
                    html += '<div class="sop-deep-duration-info">';
                    html += '<div class="sop-deep-duration-days">' + deepData.duration.days + '</div>';
                    html += '<div class="sop-deep-duration-label">预计工期</div>';
                    html += '</div>';
                    html += '</div>';
                    if (deepData.duration.factors && deepData.duration.factors.length > 0) {
                        html += '<div class="sop-deep-duration-section">';
                        html += '<div class="sop-deep-duration-section-title">📊 影响工期的因素</div>';
                        html += '<ul class="sop-deep-duration-factors">';
                        for (var fai = 0; fai < deepData.duration.factors.length; fai++) {
                            html += '<li>' + deepData.duration.factors[fai] + '</li>';
                        }
                        html += '</ul>';
                        html += '</div>';
                    }
                    if (deepData.duration.rush) {
                        html += '<div class="sop-deep-duration-section">';
                        html += '<div class="sop-deep-duration-section-title">⚡ 赶工建议</div>';
                        html += '<p class="sop-deep-duration-rush">' + deepData.duration.rush + '</p>';
                        html += '</div>';
                    }
                    html += '</div>';
                }

                html += '</div>';
            }

            html += '</div>';
        }


        return html;


    }


    function getCurrentStageTitle() {
        var currentStep = findCurrentStep();
        if (!currentStep) return '';
        var stages = getCurrentModeStages();
        var stage = stages[currentStep.stageIndex];
        return stage ? '阶段' + stage.id + '：' + stage.title : '';
    }


    function updateTopProgress() {


        var progress = getTotalProgress();
        var currentStep = findCurrentStep();
        var stages = getCurrentModeStages();
        var stage = currentStep ? stages[currentStep.stageIndex] : null;


        if (el.topProgressFill) el.topProgressFill.style.width = progress.percent + '%';
        if (el.topProgressText) el.topProgressText.textContent = progress.completed + '/' + progress.total + '步';
        if (el.topProgressPercent) el.topProgressPercent.textContent = Math.floor(progress.percent) + '%';
        if (el.topProgressStage && stage) el.topProgressStage.textContent = '阶段' + stage.id + '：' + stage.title;
        if (el.topProgressStep && currentStep) el.topProgressStep.textContent = currentStep.title;


    }


    function scrollToCurrentStep() {


        var currentStepEl = el.stepCurrent || document.getElementById('sop-step-current');


        if (currentStepEl) {


            currentStepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });


        }


    }


    function scrollToStep(stepId) {


        var stepEl = document.querySelector('.sop-step-card[data-step-id="' + stepId + '"]');


        if (stepEl) {


            stepEl.scrollIntoView({ behavior: 'smooth', block: 'start' });


        }


    }


    function toggleCompletedStep(stepId) {


        if (expandedCompletedStepId === stepId) {


            expandedCompletedStepId = null;


        } else {


            expandedCompletedStepId = stepId;


        }


        renderAllSteps();


    }


    function toggleUpcomingStep(stepId) {


        if (expandedStepId === stepId) {


            expandedStepId = null;


        } else {


            expandedStepId = stepId;


        }


        renderAllSteps();


    }


    function closeUpcomingStep(stepId) {


        if (expandedStepId === stepId) {


            expandedStepId = null;


            renderAllSteps();


        }


    }


    function fallbackCopy(text, btn) {

        var textArea = document.createElement('textarea');

        textArea.value = text;

        textArea.style.position = 'fixed';

        textArea.style.left = '-9999px';

        document.body.appendChild(textArea);

        textArea.focus();

        textArea.select();

        try {

            document.execCommand('copy');

            if (btn) {

                var originalText = btn.innerHTML;

                btn.innerHTML = '✅ 已复制';

                addTimer(setTimeout(function() {

                    btn.innerHTML = originalText;

                }, 2000));

            }

        } catch (e) {

            console.error('复制失败:', e);

            alert('复制失败，请手动复制');

        }

        document.body.removeChild(textArea);

    }


    function completeCurrentStep() {


        var step = getStepById(currentStepId);


        if (!step || isStepCompleted(currentStepId)) return;


        // 高危工种必须完成安全责任清单
        if (!checkSafetyCompleted(currentStepId)) {
            Toast.error('请先完成安全责任清单的全部勾选');
            return;
        }

        var completeBtn = document.getElementById('sop-complete-btn');
        if (completeBtn) {
            completeBtn.classList.add('sop-complete-btn-success');
        }

        var progress = getProgress();


        progress.completedSteps.push(currentStepId);


        var nextStep = findNextStep(currentStepId);


        if (nextStep) {


            progress.currentStep = nextStep.id;


            progress.currentStage = nextStep.stageIndex;


            currentStepId = nextStep.id;


        }


        saveProgress();


        expandedCompletedStepId = null;


        expandedStepId = null;


        renderAllSteps();

        updateTopProgress();

        updateTodayTodo();

        Toast.success('🎉 步骤已完成！继续加油~');

        var completedCount = progress.completedSteps.length;
        var isFirstStep = completedCount === 1;
        var isStageComplete = checkStageComplete(step.stageIndex);

        if (isFirstStep) {
            triggerMilestoneCelebration('first_step');
        }

        if (isStageComplete) {
            triggerMilestoneCelebration('stage_complete', { stageIndex: step.stageIndex });
            EventBus.emit(EventBus.EVENTS.SOP_STAGE_COMPLETE, {
                stageIndex: step.stageIndex
            });
        }

        addTimer(setTimeout(function() {

            scrollToCurrentStep();

        }, 300));


        EventBus.emit(EventBus.EVENTS.STEP_COMPLETED, {


            stepId: step.id,


            stepTitle: step.title,
            
            stageIndex: step.stageIndex


        });


    }

    function checkStageComplete(stageIndex) {
        var progress = getProgress();
        var steps = getCurrentModeSteps();
        var stageSteps = steps.filter(function(s) { return s.stageIndex === stageIndex; });
        var completedInStage = stageSteps.filter(function(s) {
            return progress.completedSteps.indexOf(s.id) !== -1;
        });
        return stageSteps.length > 0 && completedInStage.length === stageSteps.length;
    }

    function triggerMilestoneCelebration(type, options) {
        options = options || {};
        var celebrationEl = createCelebrationOverlay(type, options);
        if (!celebrationEl) return;

        document.body.appendChild(celebrationEl);

        var particlesCanvas = celebrationEl.querySelector('.celebration-particles-canvas');
        if (particlesCanvas && window.ParticleSystem) {
            ParticleSystem.init(particlesCanvas);
            var rect = particlesCanvas.getBoundingClientRect();
            var centerX = rect.width / 2;
            var centerY = rect.height / 2;

            if (type === 'first_step') {
                ParticleSystem.burst(centerX, centerY, 60, 'gold');
                addTimer(setTimeout(function() {
                    ParticleSystem.burst(centerX - 50, centerY - 30, 30, 'gold');
                    ParticleSystem.burst(centerX + 50, centerY - 30, 30, 'gold');
                }, 200));
            } else if (type === 'stage_complete') {
                ParticleSystem.burst(centerX, centerY, 80, 'gold');
                addTimer(setTimeout(function() {
                    ParticleSystem.burst(centerX - 80, centerY - 50, 40, 'bamboo');
                    ParticleSystem.burst(centerX + 80, centerY - 50, 40, 'bamboo');
                }, 150));
                addTimer(setTimeout(function() {
                    ParticleSystem.burst(centerX, centerY - 80, 50, 'gold');
                }, 300));
            }
        }

        addTimer(setTimeout(function() {
            if (celebrationEl && celebrationEl.parentNode) {
                celebrationEl.classList.add('celebration-leaving');
                addTimer(setTimeout(function() {
                    if (celebrationEl && celebrationEl.parentNode) {
                        celebrationEl.remove();
                    }
                }, 500));
            }
        }, type === 'stage_complete' ? 2500 : 2000));
    }

    function createCelebrationOverlay(type, options) {
        var overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';

        var title = '';
        var subtitle = '';
        var icon = '🎉';

        if (type === 'first_step') {
            title = '太棒了！';
            subtitle = '第一个装修步骤完成啦，继续加油~';
            icon = '🎯';
        } else if (type === 'stage_complete') {
            var stageNames = ['准备阶段', '拆改阶段', '水电阶段', '泥木阶段', '油漆阶段', '安装阶段', '软装阶段'];
            var stageName = stageNames[options.stageIndex] || ('第' + (options.stageIndex + 1) + '阶段');
            title = stageName + '完成！';
            subtitle = '恭喜完成一个完整阶段，家越来越像样了~';
            icon = '🏆';
        }

        overlay.innerHTML =
            '<canvas class="celebration-particles-canvas"></canvas>' +
            '<div class="celebration-content bounce-in">' +
                '<div class="celebration-icon">' + icon + '</div>' +
                '<div class="celebration-title">' + title + '</div>' +
                '<div class="celebration-subtitle">' + subtitle + '</div>' +
            '</div>';

        return overlay;
    }

    function undoStep(stepId) {


        var step = getStepById(stepId);


        if (!step) return;


        if (!isStepCompleted(stepId)) return;


        var progress = getProgress();


        progress.completedSteps = progress.completedSteps.filter(function(id) {


            return id !== stepId;


        });


        progress.currentStep = stepId;


        progress.currentStage = step.stageIndex;


        currentStepId = stepId;


        saveProgress();


        expandedCompletedStepId = null;


        expandedStepId = null;


        renderAllSteps();


        updateTopProgress();


        updateTodayTodo();


        Toast.success('已撤销，您可以继续修改~');


        addTimer(setTimeout(function() {


            scrollToCurrentStep();


        }, 300));


    }


    function openCompleteConfirmModal() {


        var modal = document.getElementById('sop-complete-confirm-modal');


        var overlay = document.getElementById('sop-complete-confirm-modal-overlay');


        if (!modal || !overlay) return;


        modal.classList.add('active');


        document.body.style.overflow = 'hidden';

        var content = modal.querySelector('.sop-complete-confirm-modal-content');
        if (content) {
            requestAnimationFrame(function() {
                var viewportHeight = window.innerHeight;
                content.style.maxHeight = Math.max(200, viewportHeight - 40) + 'px';
            });
        }

    }


    function closeCompleteConfirmModal() {


        var modal = document.getElementById('sop-complete-confirm-modal');


        if (modal) {


            modal.classList.remove('active');


            document.body.style.overflow = '';


        }


    }


    function openDelayModal(stepId) {


        currentDelayStepId = stepId;


        delayModalOpen = true;


        var modal = document.getElementById('sop-delay-modal');


        var overlay = document.getElementById('sop-delay-modal-overlay');


        var body = document.getElementById('sop-delay-modal-body');


        if (!modal || !overlay || !body) return;


        body.innerHTML = renderDelayModal(stepId);


        modal.classList.add('active');


        overlay.addEventListener('click', closeDelayModal);


        var closeBtn = document.getElementById('sop-delay-modal-close');


        if (closeBtn) {


            closeBtn.addEventListener('click', closeDelayModal);


        }


        bindDelayModalEvents(stepId);


    }


    function closeDelayModal() {


        delayModalOpen = false;


        currentDelayStepId = null;


        var modal = document.getElementById('sop-delay-modal');


        if (modal) {


            modal.classList.remove('active');


        }


    }


    function renderDelayModal(stepId) {


        var step = getStepById(stepId);


        if (!step) return '';


        var progress = getProgress();


        var existingDelay = progress.stepDelays[stepId];


        var affectedSteps = getAffectedSteps(stepId);


        var html = '';


        html += '<div class="sop-delay-section">';


        html += '<div class="sop-delay-step-name">当前步骤：' + step.title + '</div>';


        html += '</div>';


        html += '<div class="sop-delay-section">';


        html += '<div class="sop-delay-label">延期天数</div>';


        html += '<div class="sop-delay-days-options">';


        var daysOptions = [1, 3, 7, 14];


        for (var i = 0; i < daysOptions.length; i++) {


            var d = daysOptions[i];


            html += '<label class="sop-delay-radio">';


            html += '<input type="radio" name="delay-days" value="' + d + '" ' + (existingDelay && existingDelay.days === d ? 'checked' : '') + '>';


            html += '<span>' + d + '天</span>';


            html += '</label>';


        }


        html += '<label class="sop-delay-radio">';


        html += '<input type="radio" name="delay-days" value="custom" ' + (existingDelay && !daysOptions.includes(existingDelay.days) ? 'checked' : '') + '>';


        html += '<span>自定义</span>';


        html += '</label>';


        html += '</div>';


        html += '<div class="sop-delay-custom-days" id="sop-delay-custom-days" style="display:none;">';


        html += '<input type="number" id="sop-delay-custom-input" placeholder="输入天数" value="' + (existingDelay && !daysOptions.includes(existingDelay.days) ? existingDelay.days : '') + '">';


        html += '<span>天</span>';


        html += '</div>';


        html += '</div>';


        html += '<div class="sop-delay-section">';


        html += '<div class="sop-delay-label">延期原因</div>';


        html += '<div class="sop-delay-reason-options">';


        var reasons = [


            { value: 'weather', label: '天气' },


            { value: 'material', label: '材料' },


            { value: 'worker', label: '工人' },


            { value: 'other', label: '其他' }


        ];


        for (var j = 0; j < reasons.length; j++) {


            var r = reasons[j];


            html += '<label class="sop-delay-radio">';


            html += '<input type="radio" name="delay-reason" value="' + r.value + '" ' + (existingDelay && existingDelay.reason === r.value ? 'checked' : '') + '>';


            html += '<span>' + r.label + '</span>';


            html += '</label>';


        }


        html += '</div>';


        html += '</div>';


        if (affectedSteps.length > 0) {


            html += '<div class="sop-delay-section">';


            html += '<div class="sop-delay-affected-title">延期将影响以下步骤预计时间：</div>';


            html += '<div class="sop-delay-affected-list">';


            for (var k = 0; k < affectedSteps.length; k++) {


                var affStep = affectedSteps[k];


                html += '<div class="sop-delay-affected-item">';


                html += '<span class="sop-delay-affected-name">' + affStep.title + '</span>';


                html += '<span class="sop-delay-affected-estimate">' + getDelayedEstimate(affStep.id) + '</span>';


                html += '</div>';


            }


            html += '</div>';


            html += '</div>';


        }


        html += '<div class="sop-delay-actions">';


        html += '<button class="btn-secondary" id="sop-delay-cancel-btn">取消</button>';


        html += '<button class="btn-primary" id="sop-delay-confirm-btn">确认延期</button>';


        html += '</div>';


        return html;


    }


    function bindDelayModalEvents(stepId) {


        var customRadio = document.querySelector('input[name="delay-days"][value="custom"]');


        var customDaysDiv = document.getElementById('sop-delay-custom-days');


        var customInput = document.getElementById('sop-delay-custom-input');


        if (customRadio && customDaysDiv) {


            if (customRadio.checked) {


                customDaysDiv.style.display = 'flex';


            }


            customRadio.addEventListener('change', function() {


                if (this.checked) {


                    customDaysDiv.style.display = 'flex';


                }


            });


        }


        var otherRadios = document.querySelectorAll('input[name="delay-days"]:not([value="custom"])');


        otherRadios.forEach(function(radio) {


            radio.addEventListener('change', function() {


                if (this.checked) {


                    customDaysDiv.style.display = 'none';


                }


            });


        });


        var cancelBtn = document.getElementById('sop-delay-cancel-btn');


        if (cancelBtn) {


            cancelBtn.addEventListener('click', closeDelayModal);


        }


        var confirmBtn = document.getElementById('sop-delay-confirm-btn');


        if (confirmBtn) {


            confirmBtn.addEventListener('click', function() {


                var daysRadio = document.querySelector('input[name="delay-days"]:checked');


                var reasonRadio = document.querySelector('input[name="delay-reason"]:checked');


                if (!daysRadio || !reasonRadio) {


                    alert('请选择延期天数和原因');


                    return;


                }


                var days = daysRadio.value === 'custom' ? parseInt(customInput.value) : parseInt(daysRadio.value);


                if (daysRadio.value === 'custom' && (isNaN(days) || days < 1 || days > 365)) {


                    alert('请输入有效的天数（1-365）');


                    return;


                }


                var reason = reasonRadio.value;


                applyStepDelay(stepId, days, reason);


                closeDelayModal();


            });


        }


    }


    function applyStepDelay(stepId, days, reason) {


        var progress = getProgress();


        if (!progress.stepDelays) {


            progress.stepDelays = {};


        }


        progress.stepDelays[stepId] = {


            days: days,


            reason: reason,


            appliedAt: new Date().toISOString()


        };


        saveProgress();


        renderAllSteps();


        updateTopProgress();


        EventBus.emit('sop:stepDelayed', {


            stepId: stepId,


            days: days,


            reason: reason


        });


    }


    function getDelayedEstimate(stepId) {


        var step = getStepById(stepId);


        if (!step) return '';


        var progress = getProgress();


        var baseDate = new Date();


        var totalDelay = 0;


        var steps = getCurrentModeSteps();


        var stepIndex = -1;


        for (var i = 0; i < steps.length; i++) {


            if (steps[i].id === stepId) {


                stepIndex = i;


                break;


            }


        }


        for (var j = 0; j <= stepIndex; j++) {


            var sid = steps[j].id;


            if (progress.stepDelays && progress.stepDelays[sid]) {


                totalDelay += progress.stepDelays[sid].days;


            }


        }


        if (totalDelay === 0) return '';


        var delayedDate = new Date(baseDate);


        delayedDate.setDate(delayedDate.getDate() + totalDelay);


        return formatDate(delayedDate);


    }


    function getAffectedSteps(delayedStepId) {


        var progress = getProgress();


        var steps = getCurrentModeSteps();


        var delayedIndex = -1;


        for (var i = 0; i < steps.length; i++) {


            if (steps[i].id === delayedStepId) {


                delayedIndex = i;


                break;


            }


        }


        if (delayedIndex === -1) return [];


        var affected = [];


        for (var j = delayedIndex + 1; j < steps.length; j++) {


            var sid = steps[j].id;


            if (progress.stepDelays && progress.stepDelays[sid]) {


                affected.push(steps[j]);


            }


        }


        return affected;


    }


    function formatDate(date) {


        var month = date.getMonth() + 1;


        var day = date.getDate();


        return month + '月' + day + '日';


    }


    function handleChecklistToggle(stepId, index) {


        if (!checklistProgress[stepId]) {


            checklistProgress[stepId] = {};


        }


        checklistProgress[stepId][index] = !checklistProgress[stepId][index];


        saveChecklistProgress();


        renderAllSteps();


    }

    function handleMarkAllChecklist(stepId) {
        var step = getStepById(stepId);
        if (!step || !step.guide || !step.guide.checklist) return;

        if (!checklistProgress[stepId]) {
            checklistProgress[stepId] = {};
        }

        var total = step.guide.checklist.length;
        var allChecked = true;
        for (var i = 0; i < total; i++) {
            if (!checklistProgress[stepId][i]) {
                allChecked = false;
                break;
            }
        }

        if (allChecked) {
            for (var j = 0; j < total; j++) {
                checklistProgress[stepId][j] = false;
            }
        } else {
            for (var k = 0; k < total; k++) {
                checklistProgress[stepId][k] = true;
            }
        }

        saveChecklistProgress();
        renderAllSteps();
    }


    // 当前选择的拍照项


    var currentPhotoTarget = null;


    function handlePhotoBtnClick(stepId, index) {


        currentPhotoTarget = { stepId: stepId, index: index };


        openPhotoModal();


    }


    function openPhotoModal() {


        var modal = document.getElementById('sop-photo-modal');


        if (modal) {


            modal.classList.add('active');


        }


    }


    function closePhotoModal() {


        var modal = document.getElementById('sop-photo-modal');


        if (modal) {


            modal.classList.remove('active');


        }


        currentPhotoTarget = null;


    }


    function saveStepPhoto(stepId, index, photoData) {


        var progress = getProgress();


        if (!progress.stepPhotos) {


            progress.stepPhotos = {};


        }


        if (!progress.stepPhotos[stepId]) {


            progress.stepPhotos[stepId] = {};


        }


        if (!progress.stepPhotos[stepId][index]) {


            progress.stepPhotos[stepId][index] = [];


        }


        progress.stepPhotos[stepId][index].push(photoData);


        saveProgress();


    }


    function removeStepPhoto(stepId, index, photoIndex) {


        var progress = getProgress();


        if (progress.stepPhotos && progress.stepPhotos[stepId] && progress.stepPhotos[stepId][index]) {


            progress.stepPhotos[stepId][index].splice(photoIndex, 1);


            saveProgress();


            renderAllSteps();


        }


    }


    function handlePhotoOptionClick(action) {


        closePhotoModal();


        if (!currentPhotoTarget) return;


        // 前端模拟：显示"功能开发中"提示


        Toast.info('功能开发中，请稍后再试');


        // 实际实现时，这里会根据 action 调用相机或选择相册


        // take-photo: 调用 navigator.camera.getPicture


        // choose-photo: 调用 input type="file" 或 navigator.gallery


        // 这里模拟添加一个测试图片


        // var testPhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';


        // saveStepPhoto(currentPhotoTarget.stepId, currentPhotoTarget.index, testPhoto);


        // renderAllSteps();


    }


    function handleMaterialToggle(stepId, matIndex) {


        var key = stepId + '_' + matIndex;


        purchasedMaterials[key] = !purchasedMaterials[key];


        savePurchasedMaterials();


        renderAllSteps();


    }


    function openSidePanel(type) {


        sidePanelOpen = type;


        var overlay = document.getElementById('sop-side-panel-overlay');


        var panel = document.getElementById('sop-side-panel');


        var title = document.getElementById('sop-side-panel-title');


        var body = document.getElementById('sop-side-panel-body');


        var titles = { archive: '装修档案', payment: '付款节点', warranty: '质保信息' };


        if (title) title.textContent = titles[type] || '面板';


        if (body) {


            body.innerHTML = renderSidePanelContent(type);


        }


        if (overlay) overlay.classList.add('active');


        if (panel) panel.classList.add('open');


    }


    function closeSidePanel() {


        sidePanelOpen = null;


        var overlay = document.getElementById('sop-side-panel-overlay');


        var panel = document.getElementById('sop-side-panel');


        if (overlay) overlay.classList.remove('active');


        if (panel) panel.classList.remove('open');


    }


    function renderSidePanelContent(type) {


        if (type === 'payment') {


            var nodes = getCurrentPaymentNodes();


            var modeLabel = getModeLabel();


            var html = '<div class="sop-side-panel-hint">当前模式：<strong>' + modeLabel + '</strong></div>';


            html += '<div class="sop-payment-table">';


            html += '<div class="sop-payment-row sop-payment-row-header">';


            html += '<div class="sop-payment-cell">节点名称</div>';


            html += '<div class="sop-payment-cell">付款比例</div>';


            html += '<div class="sop-payment-cell">触发节点</div>';


            html += '<div class="sop-payment-cell">说明</div>';


            html += '</div>';


            for (var i = 0; i < nodes.length; i++) {


                var node = nodes[i];


                html += '<div class="sop-payment-row">';


                html += '<div class="sop-payment-cell sop-payment-name">' + node.name + '</div>';


                html += '<div class="sop-payment-cell sop-payment-percent">' + node.percent + '</div>';


                html += '<div class="sop-payment-cell sop-payment-step">' + node.step + '</div>';


                html += '<div class="sop-payment-cell sop-payment-content">' + node.content + '</div>';


                html += '</div>';


            }


            html += '</div>';


            return html;


        } else if (type === 'archive') {


            var steps = getCurrentModeSteps();


            var stages = getCurrentModeStages();


            var html = '';


            for (var s = 0; s < stages.length; s++) {


                var stage = stages[s];


                var stageSteps = steps.filter(function(st) { return st.stageIndex === s; });


                html += '<div class="sop-archive-stage">';


                html += '<div class="sop-archive-stage-title">阶段' + stage.id + '：' + stage.title + '</div>';


                html += '<div class="sop-archive-step-list">';


                for (var t = 0; t < stageSteps.length; t++) {


                    var st = stageSteps[t];


                    var hasMaterial = st.materials && st.materials.length > 0;


                    html += '<div class="sop-archive-step-item">';


                    html += '<div class="sop-archive-step-name">第' + (st.stepIndex + 1) + '步 · ' + st.title + '</div>';


                    if (hasMaterial) {


                        html += '<div class="sop-archive-step-count">' + st.materials.length + '份资料</div>';


                    } else {


                        html += '<div class="sop-archive-step-count">暂无资料</div>';


                    }


                    html += '</div>';


                }


                html += '</div></div>';


            }


            return html;


        } else if (type === 'warranty') {


            var warrantyItems = [


                { name: '水电防水工程', period: '5年', provider: '施工方' },


                { name: '基础装修工程', period: '2年', provider: '施工方' },


                { name: '定制柜体', period: '5年', provider: '定制商家' },


                { name: '瓷砖/地板', period: '1-3年', provider: '材料供应商' },


                { name: '五金配件', period: '1年', provider: '品牌方' },


                { name: '家电产品', period: '1-3年', provider: '品牌售后' }


            ];


            var html = '<div class="sop-warranty-list">';


            for (var w = 0; w < warrantyItems.length; w++) {


                var item = warrantyItems[w];


                html += '<div class="sop-warranty-item">';


                html += '<div class="sop-warranty-name">' + item.name + '</div>';


                html += '<div class="sop-warranty-period">' + item.period + '</div>';


                html += '<div class="sop-warranty-provider">' + item.provider + '</div>';


                html += '</div>';


            }


            html += '</div>';


            html += '<div class="sop-warranty-tip">💡 提示：质保期限和责任方因品牌和商家而异，具体以合同和保修卡为准。</div>';


            return html;


        } else if (type === 'setting') {


            return renderSettingsPanel();


        }


        return '<div>暂无内容</div>';


    }


    function renderSettingsPanel() {


        var settings = App.state.sopProgress.settings || {};


        var html = '<div class="sop-settings-section">';


        html += '<div class="sop-settings-title">消息提醒</div>';


        html += '<div class="sop-settings-list">';


        html += '<div class="sop-settings-item">';


        html += '<div class="sop-settings-item-info">';


        html += '<div class="sop-settings-item-name">付款提醒</div>';


        html += '<div class="sop-settings-item-desc">节点付款到期前提醒</div>';


        html += '</div>';


        html += '<label class="sop-toggle">';


        html += '<input type="checkbox" data-setting="paymentReminder" ' + (settings.paymentReminder ? 'checked' : '') + '>';


        html += '<span class="sop-toggle-slider"></span>';


        html += '</label>';


        html += '</div>';


        html += '<div class="sop-settings-item">';


        html += '<div class="sop-settings-item-info">';


        html += '<div class="sop-settings-item-name">延期预警</div>';


        html += '<div class="sop-settings-item-desc">步骤延期风险提醒</div>';


        html += '</div>';


        html += '<label class="sop-toggle">';


        html += '<input type="checkbox" data-setting="delayWarning" ' + (settings.delayWarning ? 'checked' : '') + '>';


        html += '<span class="sop-toggle-slider"></span>';


        html += '</label>';


        html += '</div>';


        html += '<div class="sop-settings-item">';


        html += '<div class="sop-settings-item-info">';


        html += '<div class="sop-settings-item-name">质保到期</div>';


        html += '<div class="sop-settings-item-desc">装修质保即将到期提醒</div>';


        html += '</div>';


        html += '<label class="sop-toggle">';


        html += '<input type="checkbox" data-setting="warrantyExpiry" ' + (settings.warrantyExpiry ? 'checked' : '') + '>';


        html += '<span class="sop-toggle-slider"></span>';


        html += '</label>';


        html += '</div>';


        html += '</div></div>';


        html += '<div class="sop-settings-section">';


        html += '<div class="sop-settings-title">账号信息</div>';


        html += '<div class="sop-settings-account">';


        html += '<div class="sop-settings-account-avatar">陈</div>';


        html += '<div class="sop-settings-account-info">';


        html += '<div class="sop-settings-account-name">陈先生</div>';


        html += '<div class="sop-settings-account-phone">138****8888</div>';


        html += '</div>';


        html += '</div>';


        html += '</div>';


        html += '<div class="sop-settings-section">';


        html += '<div class="sop-settings-title">其他</div>';


        html += '<div class="sop-settings-list">';


        html += '<div class="sop-settings-item sop-settings-item-link" id="sop-settings-help">';


        html += '<div class="sop-settings-item-name">帮助与反馈</div>';


        html += '<span class="sop-settings-arrow">›</span>';


        html += '</div>';


        html += '</div></div>';


        addTimer(setTimeout(function() {


            var helpBtn = document.getElementById('sop-settings-help');


            if (helpBtn) {


                helpBtn.addEventListener('click', function() {


                    Toast.info('功能开发中');


                });


            }


            var toggles = document.querySelectorAll('.sop-toggle input[data-setting]');


            toggles.forEach(function(toggle) {


                toggle.addEventListener('change', function() {


                    var key = this.getAttribute('data-setting');


                    var value = this.checked;


                    toggleSetting(key, value);


                });


            });


        }, 0));


        return html;


    }


    function toggleSetting(key, value) {


        if (!App.state.sopProgress.settings) {


            App.state.sopProgress.settings = {};


        }


        App.state.sopProgress.settings[key] = value;


        App.saveState();


    }


    function showDevToast(message) {


        var existing = document.querySelector('.sop-dev-toast');


        if (existing) {


            existing.classList.remove('active');


            addTimer(setTimeout(function() {


                existing.remove();


            }, 300));


        }


        var toast = document.createElement('div');


        toast.className = 'sop-dev-toast';


        toast.textContent = message;


        document.body.appendChild(toast);


        addTimer(setTimeout(function() {


            toast.classList.add('active');


        }, 10));


        addTimer(setTimeout(function() {


            toast.classList.remove('active');


            addTimer(setTimeout(function() {


                toast.remove();


            }, 300));


        }, 2000));


    }


    function handleGlobalKeydown(e) {
        if (e.key === 'Escape') {
            var modal = document.getElementById('sop-complete-confirm-modal');
            if (modal && modal.classList.contains('active')) {
                closeCompleteConfirmModal();
            }

            var inputModal = document.getElementById('sop-input-modal');
            if (inputModal && inputModal.classList.contains('open')) {
                closeInputModal();
            }

            var confirmModal = document.getElementById('sop-confirm-modal');
            if (confirmModal && confirmModal.classList.contains('open')) {
                closeConfirmModal();
            }

            var detailModal = document.getElementById('sop-company-detail-modal');
            if (detailModal && detailModal.classList.contains('open')) {
                closeCompanyDetailModal();
            }
        }

        if (e.key === 'Enter') {
            var inputModal = document.getElementById('sop-input-modal');
            if (inputModal && inputModal.classList.contains('open')) {
                var activeEl = document.activeElement;
                if (activeEl && activeEl.id === 'sop-input-field') {
                    handleInputOk();
                }
            }
        }
    }

    function bindGlobalEvents() {


        if (eventListenersBound) return;


        eventListenersBound = true;


        var backHomeBtn = document.getElementById('sop-back-home');


        if (backHomeBtn) {


            backHomeBtn.addEventListener('click', function() {


                if (window.App && typeof App.switchView === 'function') {


                    App.switchView('home');


                }


            });


        }


        var todayTodoBtn = document.getElementById('sop-today-todo-btn');


        if (todayTodoBtn) {


            todayTodoBtn.addEventListener('click', function() {


                scrollToCurrentStep();


            });


        }


        var topBarBtns = document.querySelectorAll('.sop-top-bar-btn[data-panel]');

        topBarBtns.forEach(function(btn) {


            btn.addEventListener('click', function() {


                var panelType = this.getAttribute('data-panel');


                openSidePanel(panelType);


            });


        });


        // 模式切换弹窗事件
        var modeBadge = document.getElementById('sop-mode-badge');

        if (modeBadge) {


            modeBadge.addEventListener('click', function() {


                openModeSwitchModal();


            });


        }


        var modeSwitchOverlay = document.getElementById('sop-mode-switch-modal-overlay');


        if (modeSwitchOverlay) {


            modeSwitchOverlay.addEventListener('click', closeModeSwitchModal);


        }


        var modeSwitchClose = document.getElementById('sop-mode-switch-modal-close');


        if (modeSwitchClose) {


            modeSwitchClose.addEventListener('click', closeModeSwitchModal);


        }


        var modeSwitchModal = document.getElementById('sop-mode-switch-modal');


        if (modeSwitchModal) {


            modeSwitchModal.addEventListener('click', function(e) {


                var target = e.target;


                // 模式卡片点击
                var card = target.closest('.sop-mode-switch-card');


                if (card) {


                    var mode = card.getAttribute('data-mode');


                    selectedModeForSwitch = mode;


                    renderModeSwitchModal();


                    return;


                }


                // 继续上次按钮
                if (target.id === 'sop-mode-switch-btn-continue') {


                    if (selectedModeForSwitch) {


                        switchDecorationMode(selectedModeForSwitch, true);


                    }


                    return;


                }


                // 重新开始按钮
                if (target.id === 'sop-mode-switch-btn-restart') {


                    if (selectedModeForSwitch) {


                        switchDecorationMode(selectedModeForSwitch, false);


                    }


                    return;


                }


            });


        }


        // 完成确认弹窗事件
        var completeConfirmOverlay = document.getElementById('sop-complete-confirm-modal-overlay');


        if (completeConfirmOverlay) {


            completeConfirmOverlay.addEventListener('click', closeCompleteConfirmModal);


        }


        var completeConfirmClose = document.getElementById('sop-complete-confirm-modal-close');


        if (completeConfirmClose) {


            completeConfirmClose.addEventListener('click', closeCompleteConfirmModal);


        }


        var completeConfirmCancel = document.getElementById('sop-complete-confirm-cancel');


        if (completeConfirmCancel) {


            completeConfirmCancel.addEventListener('click', closeCompleteConfirmModal);


        }


        var completeConfirmOk = document.getElementById('sop-complete-confirm-ok');


        if (completeConfirmOk) {


            completeConfirmOk.addEventListener('click', function() {


                closeCompleteConfirmModal();


                completeCurrentStep();


            });


        }


        // ESC键关闭完成确认弹窗
        document.addEventListener('keydown', handleGlobalKeydown);


        var overlay = document.getElementById('sop-side-panel-overlay');


        if (overlay) {


            overlay.addEventListener('click', closeSidePanel);


        }


        var closeBtn = document.getElementById('sop-side-panel-close');


        if (closeBtn) {


            closeBtn.addEventListener('click', closeSidePanel);


        }


        var progressClickable = document.getElementById('sop-top-progress-clickable');


        if (progressClickable) {


            progressClickable.style.cursor = 'pointer';


            progressClickable.addEventListener('click', function() {


                toggleStepOverview();


            });


        }


        var stepOverlay = document.getElementById('sop-step-overlay');


        if (stepOverlay) {


            stepOverlay.addEventListener('click', function() {


                toggleStepOverview(false);


            });


        }


        var stepOverviewClose = document.getElementById('sop-step-overview-close');


        if (stepOverviewClose) {


            stepOverviewClose.addEventListener('click', function() {


                toggleStepOverview(false);


            });


        }


        var moreBtn = document.getElementById('sop-more-btn');


        if (moreBtn) {


            moreBtn.addEventListener('click', function(e) {


                e.stopPropagation();


                toggleMoreMenu();


            });


        }


        var moreDropdownItems = document.querySelectorAll('.sop-more-dropdown-item[data-panel]');


        moreDropdownItems.forEach(function(item) {


            item.addEventListener('click', function() {


                var panelType = this.getAttribute('data-panel');


                openSidePanel(panelType);


                toggleMoreMenu(false);


            });


        });


        var settingsBtn = document.getElementById('sop-settings-btn');


        if (settingsBtn) {


            settingsBtn.addEventListener('click', function() {


                alert('设置功能开发中...');


            });


        }


        var moreSettings = document.getElementById('sop-more-settings');


        if (moreSettings) {


            moreSettings.addEventListener('click', function() {


                alert('设置功能开发中...');


                toggleMoreMenu(false);


            });


        }


        document.addEventListener('click', handleDocumentClick);


        if (!throttledHandleResize) {
            throttledHandleResize = throttle(handleResize, 150);
        }
        window.addEventListener('resize', throttledHandleResize);


    }


    function handleStepContentClick(e) {
        var target = e.target;

        var undoBtn = target.closest('.sop-undo-btn[data-action="undo-step"]');
        if (undoBtn) {
            e.stopPropagation();
            var stepId = undoBtn.getAttribute('data-step-id');
            if (stepId) {
                undoStep(stepId);
            }
            return;
        }

        var completedHeader = target.closest('.sop-step-completed .sop-step-header[data-action="toggle-completed"]');
        if (completedHeader) {
            var card = completedHeader.closest('.sop-step-card');
            if (card) {
                var stepId = card.getAttribute('data-step-id');
                toggleCompletedStep(stepId);
            }
            return;
        }

        var upcomingHeader = target.closest('.sop-step-upcoming .sop-step-header[data-action="toggle-upcoming"]');
        if (upcomingHeader) {
            var card = upcomingHeader.closest('.sop-step-card');
            if (card) {
                var stepId = card.getAttribute('data-step-id');
                toggleUpcomingStep(stepId);
            }
            return;
        }

        var closeUpcomingBtn = target.closest('.sop-upcoming-close-btn[data-action="close-upcoming"]');
        if (closeUpcomingBtn) {
            e.stopPropagation();
            var card = closeUpcomingBtn.closest('.sop-step-card');
            if (card) {
                var stepId = card.getAttribute('data-step-id');
                closeUpcomingStep(stepId);
            }
            return;
        }

        var completeBtn = target.closest('#sop-complete-btn');
        if (completeBtn) {
            if (!completeBtn.disabled) {
                openCompleteConfirmModal();
            }
            return;
        }

        if (target.id === 'sop-safety-banner-close') {
            dismissSafetyBanner();
            return;
        }

        var delayBtn = target.closest('#sop-delay-btn');
        if (delayBtn) {
            var stepId = delayBtn.getAttribute('data-step-id');
            if (stepId) {
                openDelayModal(stepId);
            }
            return;
        }

        var checklistItem = target.closest('.sop-checklist-item');
        if (checklistItem) {
            var stepId = checklistItem.getAttribute('data-step');
            var index = parseInt(checklistItem.getAttribute('data-index')) || 0;
            handleChecklistToggle(stepId, index);
            return;
        }

        var markAllBtn = target.closest('.sop-checklist-mark-all-btn[data-action="mark-all-checklist"]');
        if (markAllBtn) {
            e.stopPropagation();
            var stepId = markAllBtn.getAttribute('data-step');
            handleMarkAllChecklist(stepId);
            return;
        }

        var photoUploadEntry = target.closest('.sop-checklist-photo-upload-enhanced[data-action="checklist-photo-upload"]');
        if (photoUploadEntry) {
            if (target.closest('.sop-checklist-photo-upload-btn') || target === photoUploadEntry) {
                var stepId = photoUploadEntry.getAttribute('data-step');
                openPhotoModal(stepId, 0);
            }
            return;
        }

        var materialItem = target.closest('.sop-material-item');
        if (materialItem) {
            var stepId = materialItem.getAttribute('data-step');
            var matIndex = parseInt(materialItem.getAttribute('data-mat-index'));
            handleMaterialToggle(stepId, matIndex);
            return;
        }


        var newAIToolCardToggle = target.closest('.sop-ai-tool-card[data-action="ai-tool-toggle"]');
        if (newAIToolCardToggle) {
            e.stopPropagation();
            var stepId = newAIToolCardToggle.getAttribute('data-step');
            var toolId = newAIToolCardToggle.getAttribute('data-tool');
            var cardId = stepId + '-' + toolId;
            if (expandedAIToolCards[cardId]) {
                delete expandedAIToolCards[cardId];
                newAIToolCardToggle.classList.remove('expanded');
            } else {
                expandedAIToolCards[cardId] = true;
                newAIToolCardToggle.classList.add('expanded');
            }
            return;
        }

        var notesPitfallsToggle = target.closest('.sop-collapse-card[data-action="toggle-notes-pitfalls"]');
        if (notesPitfallsToggle) {
            e.stopPropagation();
            var stepId = notesPitfallsToggle.getAttribute('data-step');
            var type = notesPitfallsToggle.getAttribute('data-type');
            var key = stepId + '_' + type;
            if (expandedNotesPitfalls[key]) {
                delete expandedNotesPitfalls[key];
                notesPitfallsToggle.classList.remove('expanded');
            } else {
                expandedNotesPitfalls[key] = true;
                notesPitfallsToggle.classList.add('expanded');
            }
            return;
        }

        var deepTabItem = target.closest('[data-action="deep-tab-switch"]');
        if (deepTabItem) {
            e.stopPropagation();
            var stepId = deepTabItem.getAttribute('data-step');
            var tabKey = deepTabItem.getAttribute('data-tab');
            deepTabStates[stepId] = tabKey;
            renderAllSteps();
            return;
        }

        var faqItem = target.closest('[data-action="faq-toggle"]');
        if (faqItem) {
            e.stopPropagation();
            var stepId = faqItem.getAttribute('data-step');
            var faqIndex = parseInt(faqItem.getAttribute('data-index'));
            if (!deepFaqStates[stepId]) {
                deepFaqStates[stepId] = {};
            }
            if (deepFaqStates[stepId][faqIndex]) {
                delete deepFaqStates[stepId][faqIndex];
                faqItem.classList.remove('expanded');
            } else {
                deepFaqStates[stepId][faqIndex] = true;
                faqItem.classList.add('expanded');
            }
            return;
        }

        var deepChecklistItem = target.closest('[data-action="deep-checklist-toggle"]');
        if (deepChecklistItem) {
            e.stopPropagation();
            var stepId = deepChecklistItem.getAttribute('data-step');
            var checkIndex = parseInt(deepChecklistItem.getAttribute('data-index'));
            if (!deepChecklistStates[stepId]) {
                deepChecklistStates[stepId] = {};
            }
            if (deepChecklistStates[stepId][checkIndex]) {
                delete deepChecklistStates[stepId][checkIndex];
                deepChecklistItem.classList.remove('checked');
            } else {
                deepChecklistStates[stepId][checkIndex] = true;
                deepChecklistItem.classList.add('checked');
            }
            var progressBar = deepChecklistItem.parentElement.parentElement.querySelector('.sop-deep-checklist-progress-fill');
            var countEl = deepChecklistItem.parentElement.parentElement.querySelector('.sop-deep-checklist-count');
            if (progressBar && countEl) {
                var state = deepChecklistStates[stepId] || {};
                var items = deepChecklistItem.parentElement.querySelectorAll('.sop-deep-checklist-item');
                var total = items.length;
                var checked = 0;
                for (var k in state) {
                    if (state[k]) checked++;
                }
                var pct = total > 0 ? Math.round((checked / total) * 100) : 0;
                progressBar.style.width = pct + '%';
                countEl.textContent = checked + '/' + total;
            }
            return;
        }

        var aiToolExperienceBtn = target.closest('[data-action="ai-tool-experience"]');
        if (aiToolExperienceBtn) {
            e.stopPropagation();
            var stepId = aiToolExperienceBtn.getAttribute('data-step');
            var toolId = aiToolExperienceBtn.getAttribute('data-tool');
            Toast.info('AI工具功能开发中...');
            return;
        }

        var aiToolDetailBtn = target.closest('[data-action="ai-tool-detail"]');
        if (aiToolDetailBtn) {
            e.stopPropagation();
            var stepId = aiToolDetailBtn.getAttribute('data-step');
            var toolId = aiToolDetailBtn.getAttribute('data-tool');
            Toast.info('查看详情功能开发中...');
            return;
        }

        var aitFloorplanUpload = target.closest('[data-action="ait-floorplan-upload"]');
        if (aitFloorplanUpload) {
            e.stopPropagation();
            var stepId = aitFloorplanUpload.getAttribute('data-step');
            var fileInput = document.getElementById('ait-floorplan-input-' + stepId);
            if (fileInput) {
                fileInput.click();
            }
            return;
        }

        var aitViewFloorplanBtn = target.closest('[data-action="view-floorplan-result"]');
        if (aitViewFloorplanBtn) {
            e.stopPropagation();
            var stepId = aitViewFloorplanBtn.getAttribute('data-step');
            openFloorplanDetailModal(stepId);
            return;
        }

        var aitFloorplanReuploadBtn = target.closest('[data-action="floorplan-reupload"]');
        if (aitFloorplanReuploadBtn) {
            e.stopPropagation();
            var stepId = aitFloorplanReuploadBtn.getAttribute('data-step');
            var progress = getProgress();
            if (progress.floorplanAnalysis && progress.floorplanAnalysis[stepId]) {
                delete progress.floorplanAnalysis[stepId];
                saveProgress();
            }
            var fileInput = document.getElementById('ait-floorplan-input-' + stepId);
            if (fileInput) {
                fileInput.click();
            }
            return;
        }

        var aitOpenQuoteAuditBtn = target.closest('[data-action="open-quote-audit"]');
        if (aitOpenQuoteAuditBtn) {
            e.stopPropagation();
            var stepId = aitOpenQuoteAuditBtn.getAttribute('data-step');
            openQuoteAuditModal(stepId);
            return;
        }

        var aitQuoteAuditRedoBtn = target.closest('[data-action="quote-audit-redo"]');
        if (aitQuoteAuditRedoBtn) {
            e.stopPropagation();
            var stepId = aitQuoteAuditRedoBtn.getAttribute('data-step');
            var progress = getProgress();
            if (progress.quoteAudit && progress.quoteAudit[stepId]) {
                delete progress.quoteAudit[stepId];
                saveProgress();
            }
            openQuoteAuditModal(stepId);
            return;
        }

        var aitOpenContractAuditBtn = target.closest('[data-action="open-contract-audit"]');
        if (aitOpenContractAuditBtn) {
            e.stopPropagation();
            var stepId = aitOpenContractAuditBtn.getAttribute('data-step');
            openContractAuditModal(stepId);
            return;
        }

        var aitContractAuditRedoBtn = target.closest('[data-action="contract-audit-redo"]');
        if (aitContractAuditRedoBtn) {
            e.stopPropagation();
            var stepId = aitContractAuditRedoBtn.getAttribute('data-step');
            var progress = getProgress();
            if (progress.contractAudit && progress.contractAudit[stepId]) {
                delete progress.contractAudit[stepId];
                saveProgress();
            }
            openContractAuditModal(stepId);
            return;
        }

        var aitOpenMaterialInspectionBtn = target.closest('[data-action="open-material-inspection"]');
        if (aitOpenMaterialInspectionBtn) {
            e.stopPropagation();
            Toast.info('材料验收功能开发中...');
            return;
        }

        var aitAddMaterialQuickBtn = target.closest('[data-action="add-material-quick"]');
        if (aitAddMaterialQuickBtn) {
            e.stopPropagation();
            Toast.info('材料验收功能开发中...');
            return;
        }

        var aitCalcPaymentBtn = target.closest('[data-action="calc-payment"]');
        if (aitCalcPaymentBtn) {
            e.stopPropagation();
            var stepId = aitCalcPaymentBtn.getAttribute('data-step');
            var totalInput = document.getElementById('ait-payment-total-' + stepId);
            var resultDiv = document.getElementById('ait-payment-result-' + stepId);
            if (!totalInput || !resultDiv) return;
            
            var total = parseFloat(totalInput.value);
            if (isNaN(total) || total <= 0) {
                Toast.info('请输入有效的合同总价');
                return;
            }
            
            var paymentStages = [
                { name: '首期款', ratio: 0.60, node: '签合同后3日内' },
                { name: '中期款', ratio: 0.35, node: '瓦工完工、木工进场前' },
                { name: '尾款', ratio: 0.05, node: '竣工验收合格后' }
            ];
            
            var tableHtml = '<div class="sop-ait-payment-table">';
            tableHtml += '<div class="sop-ait-payment-row header">';
            tableHtml += '<div class="sop-ait-payment-cell">期次</div>';
            tableHtml += '<div class="sop-ait-payment-cell">比例</div>';
            tableHtml += '<div class="sop-ait-payment-cell">金额</div>';
            tableHtml += '<div class="sop-ait-payment-cell">节点</div>';
            tableHtml += '</div>';
            
            for (var i = 0; i < paymentStages.length; i++) {
                var stage = paymentStages[i];
                var amount = total * stage.ratio;
                tableHtml += '<div class="sop-ait-payment-row">';
                tableHtml += '<div class="sop-ait-payment-cell">' + stage.name + '</div>';
                tableHtml += '<div class="sop-ait-payment-cell">' + Math.round(stage.ratio * 100) + '%</div>';
                tableHtml += '<div class="sop-ait-payment-cell amount">¥' + formatMoney(amount) + '</div>';
                tableHtml += '<div class="sop-ait-payment-cell">' + stage.node + '</div>';
                tableHtml += '</div>';
            }
            
            tableHtml += '</div>';
            resultDiv.innerHTML = tableHtml;
            resultDiv.style.display = 'block';
            return;
        }

        var aitCopyCommBtn = target.closest('[data-action="copy-comm-text"]');
        if (aitCopyCommBtn) {
            e.stopPropagation();
            var encodedText = aitCopyCommBtn.getAttribute('data-text');
            var text = decodeURIComponent(encodedText);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    Toast.info('话术已复制到剪贴板');
                }).catch(function() {
                    Toast.info('复制失败，请手动复制');
                });
            } else {
                var textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    Toast.info('话术已复制到剪贴板');
                } catch (err) {
                    Toast.info('复制失败，请手动复制');
                }
                document.body.removeChild(textarea);
            }
            return;
        }

        // 已迁移至步骤内AI工具卡片
        // var aitOpenBudgetBtn = target.closest('[data-action="open-budget-monitor"]');
        // if (aitOpenBudgetBtn) {
        //     e.stopPropagation();
        //     openBudgetMonitor();
        //     return;
        // }
        // 
        // var aitOpenScheduleBtn = target.closest('[data-action="open-schedule-tracker"]');
        // if (aitOpenScheduleBtn) {
        //     e.stopPropagation();
        //     openScheduleTracker();
        //     return;
        // }

        var progressTabBtn = target.closest('[data-action="progress-tab-switch"]');
        if (progressTabBtn) {
            e.stopPropagation();
            var stepId = progressTabBtn.getAttribute('data-step');
            var tab = progressTabBtn.getAttribute('data-tab');
            handleProgressTabSwitch(stepId, tab);
            return;
        }

        var pdEditBudgetBtn = target.closest('[data-action="pd-edit-budget"]');
        if (pdEditBudgetBtn) {
            e.stopPropagation();
            var stepId = pdEditBudgetBtn.getAttribute('data-step');
            handlePdEditBudget(stepId);
            return;
        }

        var pdAddExpenseBtn = target.closest('[data-action="pd-add-expense"]');
        if (pdAddExpenseBtn) {
            e.stopPropagation();
            var stepId = pdAddExpenseBtn.getAttribute('data-step');
            handlePdAddExpense(stepId);
            return;
        }

        var pdAddAddonBtn = target.closest('[data-action="pd-add-addon"]');
        if (pdAddAddonBtn) {
            e.stopPropagation();
            var stepId = pdAddAddonBtn.getAttribute('data-step');
            handlePdAddAddon(stepId);
            return;
        }

        var pdUpdateScheduleBtn = target.closest('[data-action="pd-update-schedule"]');
        if (pdUpdateScheduleBtn) {
            e.stopPropagation();
            var stepId = pdUpdateScheduleBtn.getAttribute('data-step');
            handlePdUpdateSchedule(stepId);
            return;
        }

        var viewInspectionDetailBtn = target.closest('[data-action="view-inspection-detail"]');
        if (viewInspectionDetailBtn) {
            e.stopPropagation();
            var stepId = viewInspectionDetailBtn.getAttribute('data-step');
            var subtype = viewInspectionDetailBtn.getAttribute('data-subtype');
            Toast.info('质量诊断详情功能开发中...');
            return;
        }

        var startInspectionBtn = target.closest('[data-action="start-inspection"]');
        if (startInspectionBtn) {
            e.stopPropagation();
            var stepId = startInspectionBtn.getAttribute('data-step');
            var subtype = startInspectionBtn.getAttribute('data-subtype');
            var progress = getProgress();
            if (!progress.aiResults) {
                progress.aiResults = {};
            }
            if (!progress.aiResults[stepId]) {
                progress.aiResults[stepId] = {};
            }
            var template = getAIResult('inspection', stepId, subtype);
            if (template) {
                progress.aiResults[stepId][subtype] = JSON.parse(JSON.stringify(template));
                saveProgress();
                Toast.info('质量诊断完成');
                renderAllSteps();
            } else {
                Toast.info('质量诊断功能开发中...');
            }
            return;
        }

        var reinspectBtn = target.closest('[data-action="reinspect"]');
        if (reinspectBtn) {
            e.stopPropagation();
            var stepId = reinspectBtn.getAttribute('data-step');
            var subtype = reinspectBtn.getAttribute('data-subtype');
            var progress = getProgress();
            if (progress.aiResults && progress.aiResults[stepId] && progress.aiResults[stepId][subtype]) {
                delete progress.aiResults[stepId][subtype];
                saveProgress();
            }
            Toast.info('重新检测功能开发中...');
            return;
        }

        var openPointPlanBtn = target.closest('[data-action="open-point-plan"]');
        if (openPointPlanBtn) {
            e.stopPropagation();
            var stepId = openPointPlanBtn.getAttribute('data-step');
            openPointPlanModal(stepId);
            return;
        }

        var viewPointPlanBtn = target.closest('[data-action="view-point-plan"]');
        if (viewPointPlanBtn) {
            e.stopPropagation();
            var stepId = viewPointPlanBtn.getAttribute('data-step');
            openPointPlanModal(stepId);
            return;
        }

        var regeneratePointPlanBtn = target.closest('[data-action="regenerate-point-plan"]');
        if (regeneratePointPlanBtn) {
            e.stopPropagation();
            var stepId = regeneratePointPlanBtn.getAttribute('data-step');
            var progress = getProgress();
            if (progress.pointPlan && progress.pointPlan[stepId]) {
                delete progress.pointPlan[stepId];
                saveProgress();
            }
            openPointPlanModal(stepId);
            return;
        }

        var viewFinalSettlementBtn = target.closest('[data-action="view-final-settlement"]');
        if (viewFinalSettlementBtn) {
            e.stopPropagation();
            var stepId = viewFinalSettlementBtn.getAttribute('data-step');
            gotoStep('F-23');
            Toast.info('已跳转到竣工结算页面');
            return;
        }

        var copySettlementCardBtn = target.closest('[data-action="copy-settlement-card"]');
        if (copySettlementCardBtn) {
            e.stopPropagation();
            var data = calculateSettlement();
            var summaryText = '结算对账单\n\n' +
                '合同价：¥' + formatMoney(data.contractPrice) + '\n' +
                '增项合计：+¥' + formatMoney(data.addonTotal) + '\n' +
                '减项合计：-¥' + formatMoney(data.deductionTotal) + '\n' +
                '——————————\n' +
                '总结算价：¥' + formatMoney(data.finalPrice) + '\n\n' +
                '已付款合计：¥' + formatMoney(data.paymentTotal) + '\n' +
                '—— 此对账单由AI生成，仅供参考 ——';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(summaryText).then(function() {
                    Toast.info('对账单已复制到剪贴板');
                }).catch(function() {
                    Toast.info('复制失败，请手动复制');
                });
            } else {
                var textarea = document.createElement('textarea');
                textarea.value = summaryText;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    Toast.info('对账单已复制到剪贴板');
                } catch (err) {
                    Toast.info('复制失败，请手动复制');
                }
                document.body.removeChild(textarea);
            }
            return;
        }

        var viewAirQualityBtn = target.closest('[data-action="view-air-quality"]');
        if (viewAirQualityBtn) {
            e.stopPropagation();
            var stepId = viewAirQualityBtn.getAttribute('data-step');
            gotoStep('F-23');
            Toast.info('已跳转到空气质量评估页面');
            return;
        }

        var reassessAirQualityBtn = target.closest('[data-action="reassess-air-quality"]');
        if (reassessAirQualityBtn) {
            e.stopPropagation();
            Toast.info('重新评估功能开发中...');
            return;
        }

        var generateSafetyNoticeBtn = target.closest('[data-action="generate-safety-notice"]');
        if (generateSafetyNoticeBtn) {
            e.stopPropagation();
            var noticeText = generateSafetyNotice();
            alert(noticeText);
            return;
        }

        var showInsuranceReminderBtn = target.closest('[data-action="show-insurance-reminder"]');
        if (showInsuranceReminderBtn) {
            e.stopPropagation();
            var reminderText = generateInsuranceReminder();
            alert(reminderText);
            return;
        }


        // 已迁移至步骤内AI工具卡片
        // var budgetFloatBtn = target.closest('.sop-budget-float-btn');
        // if (budgetFloatBtn) {
        //     e.stopPropagation();
        //     openBudgetMonitor();
        //     return;
        // }
        // 
        // var budgetCloseBtn = target.closest('.sop-budget-close-btn');
        // if (budgetCloseBtn) {
        //     e.stopPropagation();
        //     closeBudgetMonitor();
        //     return;
        // }
        // 
        // var budgetMask = target.closest('.sop-budget-mask');
        // if (budgetMask) {
        //     e.stopPropagation();
        //     closeBudgetMonitor();
        //     return;
        // }

        // 已迁移至步骤内AI工具卡片
        // var budgetTab = target.closest('.sop-budget-tab');
        // if (budgetTab) {
        //     e.stopPropagation();
        //     var tab = budgetTab.getAttribute('data-tab');
        //     switchBudgetTab(tab);
        //     return;
        // }
        // 
        // var addExpenseBtn = target.closest('[data-action="add-expense"]');
        // if (addExpenseBtn) {
        //     e.stopPropagation();
        //     showAddExpenseModal();
        //     return;
        // }
        // 
        // var addAddonBtn = target.closest('[data-action="add-addon"]');
        // if (addAddonBtn) {
        //     e.stopPropagation();
        //     showAddAddonModal();
        //     return;
        // }
        // 
        // var editBudgetBtn = target.closest('[data-action="edit-budget"]');
        // if (editBudgetBtn) {
        //     e.stopPropagation();
        //     showEditBudgetModal();
        //     return;
        // }
        // 
        // var modalCancelBtn = target.closest('.sop-budget-modal-cancel');
        // if (modalCancelBtn) {
        //     e.stopPropagation();
        //     var modal = target.closest('.sop-budget-modal-mask');
        //     if (modal) {
        //         modal.style.display = 'none';
        //     }
        //     return;
        // }
        // 
        // var submitExpenseBtn = target.closest('[data-action="submit-expense"]');
        // if (submitExpenseBtn) {
        //     e.stopPropagation();
        //     submitExpense();
        //     return;
        // }

        // 已迁移至步骤内AI工具卡片
        // var submitAddonBtn = target.closest('[data-action="submit-addon"]');
        // if (submitAddonBtn) {
        //     e.stopPropagation();
        //     submitAddon();
        //     return;
        // }
        // 
        // var submitBudgetBtn = target.closest('[data-action="submit-budget"]');
        // if (submitBudgetBtn) {
        //     e.stopPropagation();
        //     submitBudgetEdit();
        //     return;
        // }

        var copyBtn = target.closest('.sop-ai-copy-btn');
        if (copyBtn) {
            var stepId = copyBtn.getAttribute('data-step');
            var toolId = copyBtn.getAttribute('data-tool-id');
            handleCopyAIContent(stepId, toolId, copyBtn);
            return;
        }

        var regenerateBtn = target.closest('.sop-ai-regenerate-btn');
        if (regenerateBtn) {
            var stepId = regenerateBtn.getAttribute('data-step');
            var toolId = regenerateBtn.getAttribute('data-tool-id');
            handleRegenerateAI(stepId, toolId, regenerateBtn);
            return;
        }

        var floorplanUpload = target.closest('[data-action="floorplan-upload"]');
        if (floorplanUpload) {
            e.stopPropagation();
            var stepId = floorplanUpload.getAttribute('data-step');
            var fileInput = document.getElementById('floorplan-file-input-' + stepId);
            if (fileInput) {
                fileInput.click();
            }
            return;
        }

        var floorplanResult = target.closest('[data-action="view-floorplan-result"]');
        if (floorplanResult) {
            e.stopPropagation();
            var stepId = floorplanResult.getAttribute('data-step');
            openFloorplanDetailModal(stepId);
            return;
        }

        var quoteAuditSection = target.closest('[data-action="open-quote-audit"]');
        if (quoteAuditSection) {
            e.stopPropagation();
            var stepId = quoteAuditSection.getAttribute('data-step');
            openQuoteAuditModal(stepId);
            return;
        }

        var quoteAuditClose = target.closest('[data-action="quote-audit-close"]');
        if (quoteAuditClose) {
            e.stopPropagation();
            closeQuoteAuditModal();
            return;
        }

        var quoteAuditSubmit = target.closest('[data-action="quote-audit-submit"]');
        if (quoteAuditSubmit) {
            e.stopPropagation();
            var stepId = quoteAuditSubmit.getAttribute('data-step');
            handleQuoteAuditSubmit(stepId);
            return;
        }

        var quoteAuditReaudit = target.closest('[data-action="quote-audit-reaudit"]');
        if (quoteAuditReaudit) {
            e.stopPropagation();
            var stepId = quoteAuditReaudit.getAttribute('data-step');
            handleQuoteAuditReaudit(stepId);
            return;
        }

        var quoteAuditCopy = target.closest('[data-action="quote-audit-copy"]');
        if (quoteAuditCopy) {
            e.stopPropagation();
            var stepId = quoteAuditCopy.getAttribute('data-step');
            copyQuoteAuditReport(stepId);
            return;
        }

        var contractAuditEntry = target.closest('[data-action="open-contract-audit"]');
        if (contractAuditEntry) {
            e.stopPropagation();
            var stepId = contractAuditEntry.getAttribute('data-step');
            openContractAuditModal(stepId);
            return;
        }

        var contractAuditClose = target.closest('[data-action="contract-audit-close"]');
        if (contractAuditClose) {
            e.stopPropagation();
            closeContractAuditModal();
            return;
        }

        var contractAuditSubmit = target.closest('[data-action="contract-audit-submit"]');
        if (contractAuditSubmit) {
            e.stopPropagation();
            var stepId = contractAuditSubmit.getAttribute('data-step');
            handleContractAuditSubmit(stepId);
            return;
        }

        var contractAuditReaudit = target.closest('[data-action="contract-audit-reaudit"]');
        if (contractAuditReaudit) {
            e.stopPropagation();
            var stepId = contractAuditReaudit.getAttribute('data-step');
            handleContractAuditReaudit(stepId);
            return;
        }

        var contractAuditCopy = target.closest('[data-action="contract-audit-copy"]');
        if (contractAuditCopy) {
            e.stopPropagation();
            var stepId = contractAuditCopy.getAttribute('data-step');
            copyContractAuditReport(stepId);
            return;
        }

        var contractAuditTab = target.closest('.sop-contract-audit-tab');
        if (contractAuditTab) {
            e.stopPropagation();
            var tabName = contractAuditTab.getAttribute('data-tab');
            var modal = contractAuditTab.closest('.sop-contract-audit-modal');
            if (modal) {
                var tabs = modal.querySelectorAll('.sop-contract-audit-tab');
                tabs.forEach(function(t) { t.classList.remove('active'); });
                contractAuditTab.classList.add('active');
                var contents = modal.querySelectorAll('.sop-contract-audit-tab-content');
                contents.forEach(function(c) { c.classList.remove('active'); });
                var content = modal.querySelector('[data-tab-content="' + tabName + '"]');
                if (content) {
                    content.classList.add('active');
                }
            }
            return;
        }

        var pointPlanEntry = target.closest('[data-action="open-point-plan"]');
        if (pointPlanEntry) {
            e.stopPropagation();
            var stepId = pointPlanEntry.getAttribute('data-step');
            openPointPlanModal(stepId);
            return;
        }

        var pointPlanClose = target.closest('[data-action="point-plan-close"]');
        if (pointPlanClose) {
            e.stopPropagation();
            closePointPlanModal();
            return;
        }

        var pointPlanSubmit = target.closest('[data-action="point-plan-submit"]');
        if (pointPlanSubmit) {
            e.stopPropagation();
            var stepId = pointPlanSubmit.getAttribute('data-step');
            handlePointPlanSubmit(stepId);
            return;
        }

        var pointPlanRegenerate = target.closest('[data-action="point-plan-regenerate"]');
        if (pointPlanRegenerate) {
            e.stopPropagation();
            var stepId = pointPlanRegenerate.getAttribute('data-step');
            handlePointPlanRegenerate(stepId);
            return;
        }

        var pointPlanExport = target.closest('[data-action="point-plan-export"]');
        if (pointPlanExport) {
            e.stopPropagation();
            var stepId = pointPlanExport.getAttribute('data-step');
            handlePointPlanExport(stepId);
            return;
        }

        var pointPlanPointItem = target.closest('.sop-point-plan-point-item');
        if (pointPlanPointItem) {
            e.stopPropagation();
            var stepId = pointPlanPointItem.getAttribute('data-step');
            var pointKey = pointPlanPointItem.getAttribute('data-point-key');
            if (stepId && pointKey) {
                handlePointPlanItemClick(stepId, pointKey);
            }
            return;
        }

        var checklistPhotoBtn = target.closest('.sop-checklist-photo-btn');
        if (checklistPhotoBtn) {
            e.stopPropagation();
            var stepId = checklistPhotoBtn.getAttribute('data-step');
            var index = parseInt(checklistPhotoBtn.getAttribute('data-index')) || 0;
            handlePhotoBtnClick(stepId, index);
            return;
        }

        var photoRemoveBtn = target.closest('.sop-checklist-photo-remove');
        if (photoRemoveBtn) {
            e.stopPropagation();
            var stepId = photoRemoveBtn.getAttribute('data-step');
            var index = parseInt(photoRemoveBtn.getAttribute('data-index'));
            var photoIndex = parseInt(photoRemoveBtn.getAttribute('data-photo-index'));
            removeStepPhoto(stepId, index, photoIndex);
            return;
        }

        var aiPhotoBtn = target.closest('.sop-ai-photo-btn');
        if (aiPhotoBtn) {
            var stepId = aiPhotoBtn.getAttribute('data-step');
            var toolId = aiPhotoBtn.getAttribute('data-tool-id');
            var action = aiPhotoBtn.getAttribute('data-action');
            handleAIPhotoUpload(stepId, toolId, action);
            return;
        }

        var addCompanyBtn = target.closest('.sop-company-compare-add-btn[data-action="company-compare-add"]');
        if (addCompanyBtn) {
            e.stopPropagation();
            handleCompanyCompareAdd();
            return;
        }

        var editCompanyBtn = target.closest('.sop-company-compare-card-edit-btn[data-action="company-compare-edit"]');
        if (editCompanyBtn) {
            e.stopPropagation();
            var companyId = editCompanyBtn.getAttribute('data-company-id');
            handleCompanyCompareEdit(companyId);
            return;
        }

        var deleteCompanyBtn = target.closest('.sop-company-compare-card-delete-btn[data-action="company-compare-delete"]');
        if (deleteCompanyBtn) {
            e.stopPropagation();
            var companyId = deleteCompanyBtn.getAttribute('data-company-id');
            handleCompanyCompareDelete(companyId);
            return;
        }

        var cellEditBtn = target.closest('td[data-action="company-compare-cell-edit"]');
        if (cellEditBtn) {
            e.stopPropagation();
            var companyId = cellEditBtn.getAttribute('data-company-id');
            var field = cellEditBtn.getAttribute('data-field');
            handleCompanyCompareCellEdit(companyId, field);
            return;
        }

        var modalCloseBtn = target.closest('[data-action="company-compare-modal-close"]');
        if (modalCloseBtn) {
            e.stopPropagation();
            closeCompanyCompareModal();
            return;
        }

        var modalSaveBtn = target.closest('[data-action="company-compare-save"]');
        if (modalSaveBtn) {
            e.stopPropagation();
            handleCompanyCompareSave();
            return;
        }

        var ratingStar = target.closest('[data-action="company-compare-rating"]');
        if (ratingStar) {
            e.stopPropagation();
            var rating = parseInt(ratingStar.getAttribute('data-rating'));
            handleCompanyCompareRating(rating);
            return;
        }

        var modalOverlay = target.closest('#sop-company-compare-modal');
        if (modalOverlay && target === modalOverlay) {
            closeCompanyCompareModal();
            return;
        }

        var confirmOkBtn = target.closest('[data-action="confirm-ok"]');
        if (confirmOkBtn) {
            e.stopPropagation();
            handleConfirmOk();
            return;
        }

        var confirmCancelBtn = target.closest('[data-action="confirm-cancel"]');
        if (confirmCancelBtn) {
            e.stopPropagation();
            handleConfirmCancel();
            return;
        }

        var confirmOverlay = target.closest('#sop-confirm-modal');
        if (confirmOverlay && target === confirmOverlay) {
            closeConfirmModal();
            return;
        }

        var inputOkBtn = target.closest('[data-action="input-ok"]');
        if (inputOkBtn) {
            e.stopPropagation();
            handleInputOk();
            return;
        }

        var inputCancelBtn = target.closest('[data-action="input-cancel"]');
        if (inputCancelBtn) {
            e.stopPropagation();
            handleInputCancel();
            return;
        }

        var inputOverlay = target.closest('#sop-input-modal');
        if (inputOverlay && target === inputOverlay) {
            closeInputModal();
            return;
        }

        var detailCloseBtn = target.closest('[data-action="company-detail-close"]');
        if (detailCloseBtn) {
            e.stopPropagation();
            closeCompanyDetailModal();
            return;
        }

        var detailOverlay = target.closest('#sop-company-detail-modal');
        if (detailOverlay && target === detailOverlay) {
            closeCompanyDetailModal();
            return;
        }

        var companyCard = target.closest('.sop-company-compare-card');
        if (companyCard && !target.closest('.sop-company-compare-card-edit-btn') && !target.closest('.sop-company-compare-card-delete-btn')) {
            var companyId = companyCard.getAttribute('data-company-id');
            if (companyId) {
                openCompanyDetailModal(companyId);
                return;
            }
        }

        var openMatchModalBtn = target.closest('[data-action="open-ai-match-modal"]');
        if (openMatchModalBtn) {
            e.stopPropagation();
            openAiMatchModal();
            return;
        }

        var viewMatchResults = target.closest('[data-action="view-ai-match-results"]');
        if (viewMatchResults) {
            e.stopPropagation();
            openAiMatchModal();
            return;
        }

        var closeMatchModalBtn = target.closest('[data-action="close-ai-match-modal"]');
        if (closeMatchModalBtn) {
            e.stopPropagation();
            closeAiMatchModal();
            return;
        }

        var matchModalOverlay = target.closest('#sop-ai-match-modal');
        if (matchModalOverlay && target === matchModalOverlay) {
            closeAiMatchModal();
            return;
        }

        var matchCancelBtn = target.closest('[data-action="ai-match-cancel"]');
        if (matchCancelBtn) {
            e.stopPropagation();
            closeAiMatchModal();
            return;
        }

        var prefSelect = target.closest('[data-action="select-pref"]');
        if (prefSelect) {
            e.stopPropagation();
            var prefType = prefSelect.getAttribute('data-pref-type');
            var prefValue = prefSelect.getAttribute('data-pref-value');
            var isMulti = prefSelect.getAttribute('data-multi') === 'true';
            if (isMulti) {
                toggleSpecialNeed(prefValue);
            } else {
                setAiMatchPreference(prefType, prefValue);
            }
            renderAiMatchModal();
            return;
        }

        var startMatchBtn = target.closest('[data-action="start-ai-match"]');
        if (startMatchBtn) {
            e.stopPropagation();
            startAiMatch();
            return;
        }

        var restartMatchBtn = target.closest('[data-action="restart-ai-match"]');
        if (restartMatchBtn) {
            e.stopPropagation();
            restartAiMatch();
            return;
        }

        var addToCompareBtn = target.closest('[data-action="add-match-to-compare"]');
        if (addToCompareBtn) {
            e.stopPropagation();
            var index = parseInt(addToCompareBtn.getAttribute('data-index'), 10) || 0;
            addMatchCompanyToCompare(index);
            return;
        }

        var addMaterialBtn = target.closest('[data-action="add-material-record"]');
        if (addMaterialBtn) {
            e.stopPropagation();
            var stepId = addMaterialBtn.getAttribute('data-step');
            var toolId = addMaterialBtn.getAttribute('data-tool-id');
            handleAddMaterialRecord(stepId, toolId);
            return;
        }

        var miCategorySelect = target.closest('#mi-category');
        if (miCategorySelect) {
            handleCategoryChange();
            return;
        }

        var updateScheduleBtn = target.closest('[data-action="update-schedule"]');
        if (updateScheduleBtn) {
            e.stopPropagation();
            handleUpdateSchedule();
            return;
        }

        var updateContractPriceBtn = target.closest('[data-action="update-contract-price"]');
        if (updateContractPriceBtn) {
            e.stopPropagation();
            handleUpdateContractPrice();
            return;
        }

        var addSettleAddonBtn = target.closest('[data-action="add-settle-addon"]');
        if (addSettleAddonBtn) {
            e.stopPropagation();
            handleAddSettleItem('addon');
            return;
        }

        var addSettleDeductionBtn = target.closest('[data-action="add-settle-deduction"]');
        if (addSettleDeductionBtn) {
            e.stopPropagation();
            handleAddSettleItem('deduction');
            return;
        }

        var addSettlePaymentBtn = target.closest('[data-action="add-settle-payment"]');
        if (addSettlePaymentBtn) {
            e.stopPropagation();
            handleAddSettleItem('payment');
            return;
        }

        var copySettlementBtn = target.closest('[data-action="copy-settlement"]');
        if (copySettlementBtn) {
            e.stopPropagation();
            var text = copySettlementBtn.getAttribute('data-text');
            handleCopySettlement(text);
            return;
        }

        var settleTab = target.closest('.sop-settle-tab');
        if (settleTab) {
            e.stopPropagation();
            var tabName = settleTab.getAttribute('data-settle-tab');
            var tabs = document.querySelectorAll('.sop-settle-tab');
            tabs.forEach(function(t) { t.classList.remove('active'); });
            settleTab.classList.add('active');
            var contents = document.querySelectorAll('[data-settle-tab-content]');
            contents.forEach(function(c) { c.style.display = 'none'; });
            var targetContent = document.querySelector('[data-settle-tab-content="' + tabName + '"]');
            if (targetContent) targetContent.style.display = 'block';
            return;
        }

        var calcAirQualityBtn = target.closest('[data-action="calc-air-quality"]');
        if (calcAirQualityBtn) {
            e.stopPropagation();
            handleCalcAirQuality();
            return;
        }

        var schedCloseBtn = target.closest('#sop-sched-close');
        if (schedCloseBtn) {
            e.stopPropagation();
            closeScheduleTracker();
            return;
        }

        var schedOverlay = target.closest('.sop-sched-overlay');
        if (schedOverlay && target === schedOverlay) {
            e.stopPropagation();
            closeScheduleTracker();
            return;
        }
    }

    function handleCopyAIContent(stepId, toolId, btn) {
        var panelEl = document.getElementById('ai-result-' + stepId + '-' + toolId);
        if (!panelEl) return;
        var contentEl = panelEl.querySelector('.sop-ai-result-content');
        if (!contentEl) return;
        var text = contentEl.innerText || contentEl.textContent;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                var originalText = btn.innerHTML;
                btn.innerHTML = '✅ 已复制';
                addTimer(setTimeout(function() {
                    btn.innerHTML = originalText;
                }, 2000));
            }).catch(function() {
                fallbackCopy(text, btn);
            });
        } else {
            fallbackCopy(text, btn);
        }
    }

    function handleRegenerateAI(stepId, toolId, btn) {
        var originalText = btn.innerHTML;
        btn.innerHTML = '⏳ 生成中...';
        btn.disabled = true;
        addTimer(setTimeout(function() {
            btn.innerHTML = originalText;
            btn.disabled = false;
            renderAllSteps();
        }, 1500));
    }

    function handleAIPhotoUpload(stepId, toolId, action) {
        var fileInput = document.getElementById('file-input-' + stepId + '-' + toolId);
        if (!fileInput) return;
        if (action === 'take-photo') {
            fileInput.setAttribute('capture', 'environment');
        } else {
            fileInput.removeAttribute('capture');
        }
        fileInput.click();
    }

    function handleFileUpload(id, e) {
        var uploadingEl = document.getElementById('uploading-' + id);
        var photoUploadEl = document.getElementById('photo-upload-' + id);
        var resultEl = document.getElementById('inspection-result-' + id);

        if (uploadingEl && photoUploadEl) {
            photoUploadEl.querySelector('.sop-ai-photo-upload-options').style.display = 'none';
            uploadingEl.style.display = 'flex';
        }

        addTimer(setTimeout(function() {
            if (uploadingEl) {
                uploadingEl.style.display = 'none';
            }
            if (photoUploadEl) {
                photoUploadEl.style.display = 'none';
            }
            if (resultEl) {
                resultEl.style.display = 'block';
            }
        }, 2000));
    }


    var stageEventsBound = false;

    function bindStepEvents() {
        var stageContent = el.stageContent || document.getElementById('sop-stage-content');
        if (stageContent && !stageEventsBound) {
            stageContent.addEventListener('click', handleStepContentClick);
        }

        // 高危工种步骤：初始化安全责任清单UI
        if (isHighRiskStep(currentStepId)) {


            renderSafetyChecklistUI(currentStepId);


            updateCompleteButtonState(currentStepId);


        }

        var fileInputs = document.querySelectorAll('[id^="file-input-"]');


        fileInputs.forEach(function(input) {


            input.addEventListener('change', function(e) {


                var id = this.id.replace('file-input-', '');


                var uploadingEl = document.getElementById('uploading-' + id);


                var photoUploadEl = document.getElementById('photo-upload-' + id);


                var resultEl = document.getElementById('inspection-result-' + id);


                


                if (uploadingEl && photoUploadEl) {


                    photoUploadEl.querySelector('.sop-ai-photo-upload-options').style.display = 'none';


                    uploadingEl.style.display = 'flex';


                }


                


                addTimer(setTimeout(function() {


                    if (uploadingEl) {


                        uploadingEl.style.display = 'none';


                    }


                    if (photoUploadEl) {


                        photoUploadEl.style.display = 'none';


                    }


                    if (resultEl) {


                        resultEl.style.display = 'block';


                    }


                }, 2000));


            });


        });

        // 拍照弹窗选项事件
        var photoModalOptions = document.querySelectorAll('.sop-photo-modal-option');

        photoModalOptions.forEach(function(option) {

            option.addEventListener('click', function() {
                var action = this.getAttribute('data-action');
                handlePhotoOptionClick(action);
            });

        });

        // 平面布局图文件上传事件
        var floorplanFileInputs = document.querySelectorAll('.sop-floorplan-file-input');
        floorplanFileInputs.forEach(function(input) {
            input.addEventListener('change', function(e) {
                var stepId = this.getAttribute('data-step');
                var file = this.files && this.files[0];
                if (file && stepId) {
                    handleFloorplanUpload(stepId, file);
                }
            });
        });

        if (!stageEventsBound) {
        // 拍照弹窗关闭按钮事件
        var photoModalClose = document.getElementById('sop-photo-modal-close');

        if (photoModalClose) {

            photoModalClose.addEventListener('click', function() {
                closePhotoModal();
            });

        }

        // 拍照弹窗点击背景关闭
        var photoModal = document.getElementById('sop-photo-modal');

        if (photoModal) {

            photoModal.addEventListener('click', function(e) {
                if (e.target === photoModal) {
                    closePhotoModal();
                }
            });

        }

        // 步骤导航点击事件
        var navEl = document.getElementById('sop-step-nav');
        if (navEl) {
            navEl.addEventListener('click', function(e) {
                var stageHeader = e.target.closest('.sop-step-nav-stage-header[data-action="toggle-stage"]');
                if (stageHeader) {
                    var stageEl = stageHeader.closest('.sop-step-nav-stage');
                    if (stageEl) {
                        var stageIndex = parseInt(stageEl.dataset.stageIndex);
                        if (!isNaN(stageIndex)) {
                            toggleNavStage(stageIndex);
                        }
                    }
                    return;
                }

                var stepItem = e.target.closest('.sop-step-nav-step[data-action="nav-step"]');
                if (stepItem) {
                    var stepId = stepItem.dataset.stepId;
                    if (stepId) {
                        handleNavStepClick(stepId);
                    }
                    return;
                }

                var overviewBtn = e.target.closest('#sop-nav-overview-btn');
                if (overviewBtn) {
                    toggleStepOverview(true);
                    return;
                }
            });
        }

        // 移动端导航事件
        var mobileNavToggle = document.getElementById('sop-mobile-nav-toggle');
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', function() {
                openMobileNavDrawer();
            });
        }

        var mobileNavOverlay = document.getElementById('sop-mobile-nav-overlay');
        if (mobileNavOverlay) {
            mobileNavOverlay.addEventListener('click', function() {
                closeMobileNavDrawer();
            });
        }

        var mobileNavContent = document.getElementById('sop-mobile-nav-content-inner');
        if (mobileNavContent) {
            mobileNavContent.addEventListener('click', function(e) {
                var closeBtn = e.target.closest('#sop-mobile-nav-close');
                if (closeBtn) {
                    closeMobileNavDrawer();
                    return;
                }

                var stageHeader = e.target.closest('.sop-step-nav-stage-header[data-action="toggle-mobile-stage"]');
                if (stageHeader) {
                    var stageEl = stageHeader.closest('.sop-step-nav-stage');
                    if (stageEl) {
                        var stageIndex = parseInt(stageEl.dataset.mobileStageIndex);
                        if (!isNaN(stageIndex)) {
                            toggleNavStage(stageIndex);
                        }
                    }
                    return;
                }

                var stepItem = e.target.closest('.sop-step-nav-step[data-action="nav-mobile-step"]');
                if (stepItem) {
                    var stepId = stepItem.dataset.stepId;
                    if (stepId) {
                        handleNavStepClick(stepId);
                    }
                    return;
                }
            });
        }

            stageEventsBound = true;
        }
    }

    function handleResize() {


        var newIsMobile = window.innerWidth <= 900;


        if (newIsMobile !== isMobile) {


            isMobile = newIsMobile;


            renderAllSteps();


        }


    }


    function gotoStep(stepId) {


        var step = getStepById(stepId);


        if (!step) return;


        var status = getStepStatus(stepId);

        if (status === 'upcoming') {
            Toast.info('请按顺序完成前面的步骤哦~');
            return;
        }

        if (status === 'current') {


            scrollToStep(stepId);


            return;


        }


        if (status === 'completed') {


            expandedCompletedStepId = stepId;


            expandedStepId = null;


        } else {


            expandedStepId = stepId;


            expandedCompletedStepId = null;


        }


        currentStepId = stepId;


        var progress = getProgress();


        if (!isStepCompleted(stepId)) {


            progress.currentStep = stepId;


            progress.currentStage = step.stageIndex;


            saveProgress();


        }


        renderAllSteps();

        updateTopProgress();

        updateTodayTodo();


        addTimer(setTimeout(function() {

            scrollToStep(stepId);


        }, 50));


    }


    var eventUnsubscribers = [];

    function init(containerEl) {


        container = containerEl;


        subscribeEvents();

    }
    
    function subscribeEvents() {
        unsubscribeEvents();
        
        var unsub1 = EventBus.on(EventBus.EVENTS.BUDGET_UPDATED, function(data) {
            onBudgetUpdated(data);
        });
        eventUnsubscribers.push(unsub1);
        
        var unsub2 = EventBus.on(EventBus.EVENTS.MODE_CHANGED, function(data) {
            onModeChanged(data);
        });
        eventUnsubscribers.push(unsub2);
    }
    
    function unsubscribeEvents() {
        for (var i = 0; i < eventUnsubscribers.length; i++) {
            var unsub = eventUnsubscribers[i];
            if (typeof unsub === 'function') {
                unsub();
            }
        }
        eventUnsubscribers = [];
    }
    
    function onBudgetUpdated(data) {
        if (container && expandedStepId) {
            var stepDetailEl = document.getElementById('sop-step-detail');
            if (stepDetailEl) {
                var step = getStepById(expandedStepId);
                if (step) {
                    var status = getStepStatus(step.id);
                    stepDetailEl.innerHTML = renderStepDetailContent(step, status);
                    bindStepDetailEvents(step);
                }
            }
        }
    }
    
    function onModeChanged(data) {
        purchasedMaterials = {};
        checklistProgress = {};
        expandedStepId = null;
        expandedCompletedStepId = null;
        if (container && container.innerHTML) {
            render(container);
            initViewMode();
        }
    }


    function viewEnter(containerEl) {


        container = containerEl;


        render(containerEl);

        initViewMode();

        if (window.OnboardingTour && typeof OnboardingTour.start === 'function') {
            addTimer(setTimeout(function() {
                startSopOnboarding();
            }, 800));
        }

        // 悬浮按钮已停用 - 迁移至步骤内AI工具卡片
        // if (typeof renderBudgetFloatBtn === 'function') {
        //     renderBudgetFloatBtn();
        // }


    }

    function initViewMode() {
        var savedMode = Storage.load('sop_view_mode');
        var isSimple = savedMode === null ? true : savedMode === 'simple';
        applyViewMode(isSimple);
        bindViewModeToggle();
        bindSimpleModeInteractions();
    }

    function applyViewMode(isSimple) {
        var sopView = document.querySelector('.sop-single-page');
        var toggleBtn = document.getElementById('sop-view-toggle-btn');

        if (sopView) {
            if (isSimple) {
                sopView.classList.add('sop-simple-mode');
            } else {
                sopView.classList.remove('sop-simple-mode');
            }
        }

        if (toggleBtn) {
            toggleBtn.textContent = isSimple ? '完整模式' : '简洁模式';
        }
    }

    function toggleViewMode() {
        var sopView = document.querySelector('.sop-single-page');
        var isSimple = sopView && sopView.classList.contains('sop-simple-mode');
        var newIsSimple = !isSimple;

        Storage.save('sop_view_mode', newIsSimple ? 'simple' : 'full');
        applyViewMode(newIsSimple);
        if (newIsSimple) {
            bindSimpleModeInteractions();
        }
    }

    function bindViewModeToggle() {
        var toggleBtn = document.getElementById('sop-view-toggle-btn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleViewMode();
            });
        }
    }

    function bindSimpleModeInteractions() {
        var descEls = document.querySelectorAll('.sop-step-desc');
        descEls.forEach(function(el) {
            el.addEventListener('click', function(e) {
                if (e.target.closest('a, button')) return;
                el.classList.toggle('expanded');
            });
        });

        var aiToolSections = document.querySelectorAll('.sop-ai-tools-section');
        aiToolSections.forEach(function(section) {
            section.addEventListener('click', function(e) {
                if (e.target.closest('button, a, .sop-ai-tool-card')) return;
                section.classList.toggle('expanded');
            });
        });

        var completedSteps = document.querySelectorAll('.sop-step-card.sop-step-completed');
        completedSteps.forEach(function(card) {
            var header = card.querySelector('.sop-step-header');
            if (header) {
                header.addEventListener('click', function(e) {
                    if (e.target.closest('button, a')) return;
                    card.classList.toggle('expanded');
                });
            }
        });
    }


    function startSopOnboarding() {
        if (OnboardingTour.isCompleted('sop-first-visit')) {
            return;
        }

        var steps = [
            {
                target: '.sop-top-progress-enhanced',
                title: '装修进度一览',
                description: '这里查看整体装修进度和当前阶段，实时掌握装修节奏。',
                position: 'bottom',
                padding: 12
            },
            {
                target: '.sop-ai-toolbox-cards, .sop-ai-toolbox, .sop-step-card',
                title: 'AI 工具箱',
                description: 'AI 工具帮你搞定装修难题，从沟通话术到施工质检，全程把关。',
                position: 'top',
                padding: 16
            },
            {
                target: '.sop-checklist-header-enhanced, .sop-checklist-columns',
                title: '验收清单',
                description: '逐项验收，避免踩坑，每一步都清清楚楚，装修不踩坑。',
                position: 'top',
                padding: 12
            }
        ];

        OnboardingTour.start('sop-first-visit', steps);
    }


    function updateTodayTodo() {


        var todoText = document.getElementById('sop-today-todo-text');


        var currentStep = findCurrentStep();


        if (todoText && currentStep) {


            var stages = getCurrentModeStages();
            var stage = stages[currentStep.stageIndex];
            var stageTitle = stage ? stage.title : '';
            todoText.textContent = '今日待办：' + stageTitle + ' · ' + currentStep.title;


        }


    }


    function renderStepOverview() {


        var body = document.getElementById('sop-step-overview-body');


        if (!body) return;


        var steps = getCurrentModeSteps();



        var stages = getCurrentModeStages();



        var progress = getProgress();



        var isMobileView = window.innerWidth < 768;


        var html = '';


        html += '<div class="sop-timeline-section">';
        html += '<div class="sop-timeline-title"><span class="sop-timeline-title-icon">📍</span><span>装修进度时间线</span></div>';
        html += '<div class="sop-timeline">';
        for (var st = 0; st < stages.length; st++) {
            var stageTimeline = stages[st];
            var stageStepsTimeline = steps.filter(function(s) { return s.stageIndex === st; });
            var completedTimeline = 0;
            for (var sc = 0; sc < stageStepsTimeline.length; sc++) {
                if (getStepStatus(stageStepsTimeline[sc].id) === 'completed') {
                    completedTimeline++;
                }
            }
            var isStageCompleted = completedTimeline === stageStepsTimeline.length && stageStepsTimeline.length > 0;
            var isStageCurrent = st === (getStepById(progress.currentStep) ? getStepById(progress.currentStep).stageIndex : 0);
            var timelineStatus = isStageCompleted ? 'completed' : (isStageCurrent ? 'current' : 'upcoming');

            html += '<div class="sop-timeline-item ' + timelineStatus + '" data-timeline-stage="' + st + '">';
            html += '<div class="sop-timeline-dot">';
            html += isStageCompleted ? '✓' : (st + 1);
            html += '</div>';
            html += '<div class="sop-timeline-content">';
            html += '<div class="sop-timeline-stage-name">' + stageTimeline.title + '</div>';
            html += '<div class="sop-timeline-stage-info">' + completedTimeline + '/' + stageStepsTimeline.length + ' 步</div>';
            html += '</div>';
            if (st < stages.length - 1) {
                html += '<div class="sop-timeline-line ' + timelineStatus + '"></div>';
            }
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';


        html += '<div class="sop-gantt-section">';
        html += '<div class="sop-gantt-title"><span class="sop-gantt-title-icon">📊</span><span>工期进度甘特图</span></div>';
        html += '<div class="sop-gantt-chart">';
        var totalDays = 90;
        var ganttStageDays = [15, 20, 18, 15, 12, 10];
        var ganttStartDay = 0;

        for (var g = 0; g < stages.length; g++) {
            var ganttStage = stages[g];
            var ganttStageSteps = steps.filter(function(s) { return s.stageIndex === g; });
            var ganttCompleted = 0;
            for (var gc = 0; gc < ganttStageSteps.length; gc++) {
                if (getStepStatus(ganttStageSteps[gc].id) === 'completed') {
                    ganttCompleted++;
                }
            }
            var ganttProgress = ganttStageSteps.length > 0 ? (ganttCompleted / ganttStageSteps.length) : 0;
            var stageDays = ganttStageDays[g] || 15;
            var stageStartPercent = (ganttStartDay / totalDays) * 100;
            var stageWidthPercent = (stageDays / totalDays) * 100;
            var actualProgressWidth = stageWidthPercent * ganttProgress;

            html += '<div class="sop-gantt-row">';
            html += '<div class="sop-gantt-label">' + ganttStage.title + '</div>';
            html += '<div class="sop-gantt-bar-container">';
            html += '<div class="sop-gantt-bar-planned" style="left: ' + stageStartPercent + '%; width: ' + stageWidthPercent + '%;">';
            html += '<div class="sop-gantt-bar-actual" style="width: ' + (ganttProgress * 100) + '%;"></div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="sop-gantt-info">' + ganttCompleted + '/' + ganttStageSteps.length + '步</div>';
            html += '</div>';

            ganttStartDay += stageDays;
        }

        html += '<div class="sop-gantt-axis">';
        for (var ga = 0; ga <= 6; ga++) {
            var axisDay = Math.round((ga / 6) * totalDays);
            html += '<div class="sop-gantt-axis-tick" style="left: ' + ((ga / 6) * 100) + '%;">';
            html += '<div class="sop-gantt-axis-line"></div>';
            html += '<div class="sop-gantt-axis-label">第' + axisDay + '天</div>';
            html += '</div>';
        }
        html += '</div>';

        html += '</div>';
        html += '</div>';


        if (isMobileView) {


            for (var s = 0; s < stages.length; s++) {


                var stage = stages[s];


                var stageSteps = steps.filter(function(st) { return st.stageIndex === s; });


                html += '<div class="sop-overview-stage">';


                html += '<div class="sop-overview-stage-header">';


                html += '<span class="sop-overview-stage-title">阶段' + stage.id + '：' + stage.title + '</span>';


                html += '<span class="sop-overview-stage-count">' + stageSteps.length + '步</span>';


                html += '</div>';


                html += '<div class="sop-overview-step-list">';


                for (var t = 0; t < stageSteps.length; t++) {


                    var st = stageSteps[t];


                    var status = getStepStatus(st.id);


                    var statusClass = status === 'completed' ? 'completed' : (status === 'current' ? 'current' : 'upcoming');


                    var statusIcon = status === 'completed' ? '✓' : (status === 'current' ? '●' : '○');


                    html += '<div class="sop-overview-step-item ' + statusClass + '" data-step-id="' + st.id + '">';


                    html += '<span class="sop-overview-step-icon">' + statusIcon + '</span>';


                    html += '<span class="sop-overview-step-name">第' + (st.stepIndex + 1) + '步 · ' + st.title + '</span>';


                    html += '</div>';


                }


                html += '</div></div>';


            }


        } else {


            html += '<div class="sop-overview-list">';


            for (var i = 0; i < steps.length; i++) {


                var step = steps[i];


                var stepStatus = getStepStatus(step.id);


                var stepStatusClass = stepStatus === 'completed' ? 'completed' : (stepStatus === 'current' ? 'current' : 'upcoming');


                var stepNum = i + 1;


                html += '<div class="sop-overview-item ' + stepStatusClass + '" data-step-id="' + step.id + '">';


                html += '<div class="sop-overview-item-num">' + stepNum + '</div>';


                html += '<div class="sop-overview-item-info">';


                html += '<div class="sop-overview-item-title">' + step.title + '</div>';


                html += '<div class="sop-overview-item-stage">阶段' + (step.stageIndex + 1) + ' · ' + stages[step.stageIndex].title + '</div>';


                html += '</div>';


                html += '<div class="sop-overview-item-status">';


                if (stepStatus === 'completed') {


                    html += '<span class="sop-overview-status-dot completed"></span>已完成';


                } else if (stepStatus === 'current') {


                    html += '<span class="sop-overview-status-dot current"></span>进行中';


                } else {


                    html += '<span class="sop-overview-status-dot upcoming"></span>未开始';


                }


                html += '</div>';


                html += '</div>';


            }


            html += '</div>';


        }


        body.innerHTML = html;


        var stepItems = body.querySelectorAll('[data-step-id]');


        stepItems.forEach(function(item) {


            item.addEventListener('click', function() {


                var stepId = this.getAttribute('data-step-id');


                var status = getStepStatus(stepId);


                if (status === 'upcoming') {


                    Toast.info('请按顺序完成前面的步骤哦~');


                    return;


                }


                scrollToStep(stepId);


                toggleStepOverview(false);


            });


        });


        var timelineItems = body.querySelectorAll('[data-timeline-stage]');
        timelineItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var stageIndex = parseInt(this.getAttribute('data-timeline-stage'));
                var stageSteps = steps.filter(function(s) { return s.stageIndex === stageIndex; });
                if (stageSteps.length > 0) {
                    var firstStep = stageSteps[0];
                    var stepStatus = getStepStatus(firstStep.id);
                    if (stepStatus === 'upcoming') {
                        Toast.info('请按顺序完成前面的步骤哦~');
                        return;
                    }
                    scrollToStep(firstStep.id);
                    toggleStepOverview(false);
                }
            });
        });


    }


    function toggleStepOverview(show) {


        var overlay = document.getElementById('sop-step-overlay');


        var overview = document.getElementById('sop-step-overview');


        if (!overlay || !overview) return;


        if (typeof show === 'undefined') {


            show = !stepOverviewOpen;


        }


        stepOverviewOpen = show;


        if (show) {


            renderStepOverview();


            overlay.classList.add('active');


            overview.classList.add('open');


        } else {


            overlay.classList.remove('active');


            overview.classList.remove('open');


        }


    }


    function toggleMoreMenu(show) {


        var dropdown = document.getElementById('sop-more-dropdown');


        if (!dropdown) return;


        if (typeof show === 'undefined') {


            show = !moreMenuOpen;


        }


        moreMenuOpen = show;


        if (show) {


            dropdown.classList.add('open');


        } else {


            dropdown.classList.remove('open');


        }


    }

    function handleDocumentClick(e) {
        if (moreMenuOpen) {
            var moreWrapper = document.querySelector('.sop-more-menu-wrapper');
            if (moreWrapper && !moreWrapper.contains(e.target)) {
                toggleMoreMenu(false);
            }
        }

        var copyBtn = e.target.closest('.sop-material-copy-btn');
        if (copyBtn) {
            var stepId = copyBtn.getAttribute('data-step-id');
            var category = copyBtn.getAttribute('data-copy-category');
            copyMaterialsList(stepId, category);
        }
    }


    var aiChatDrawerOpen = false;


    var aiChatMessages = [];


    function ensureAIChatBubble() {


        var existing = document.getElementById('floating-butler');


        if (existing) return;


        if (window.FloatingButler && typeof FloatingButler.render === 'function') {
            FloatingButler.render(document.body, {
                emoji: 'nian-happy',
                tip: '问问AI',
                use3D: true,
                onClick: function() {
                    if (sidePanelOpen !== null) {


                        closeSidePanel();


                        addTimer(setTimeout(toggleAIChatDrawer, 300));


                    } else {


                        toggleAIChatDrawer();


                    }
                }
            });
        }


        var overlay = document.createElement('div');


        overlay.id = 'sop-ai-chat-overlay';


        overlay.className = 'sop-ai-chat-overlay';


        document.body.appendChild(overlay);


        overlay.addEventListener('click', closeAIChatDrawer);


        var drawer = document.createElement('div');


        drawer.id = 'sop-ai-chat-drawer';


        drawer.className = 'sop-ai-chat-drawer';


        drawer.innerHTML = renderAIChatDrawer();


        document.body.appendChild(drawer);


        var closeBtn = document.getElementById('sop-ai-chat-drawer-close-btn');


        if (closeBtn) {


            closeBtn.addEventListener('click', closeAIChatDrawer);


        }


        var sendBtn = document.getElementById('sop-ai-chat-send-btn');


        var input = document.getElementById('sop-ai-chat-input');


        if (sendBtn && input) {


            sendBtn.addEventListener('click', function() {


                var text = input.value.trim();


                if (text) {


                    sendAIChatMessage(text);


                    input.value = '';


                }


            });


            input.addEventListener('keypress', function(e) {


                if (e.key === 'Enter' && !e.shiftKey) {


                    e.preventDefault();


                    var text = input.value.trim();


                    if (text) {


                        sendAIChatMessage(text);


                        input.value = '';


                    }


                }


            });


        }


    }


    function toggleAIChatDrawer() {


        var overlay = document.getElementById('sop-ai-chat-overlay');


        var drawer = document.getElementById('sop-ai-chat-drawer');


        if (!overlay || !drawer) return;


        aiChatDrawerOpen = !aiChatDrawerOpen;


        if (aiChatDrawerOpen) {


            overlay.classList.add('active');


            drawer.classList.add('open');


            var messagesEl = document.getElementById('sop-ai-chat-messages');


            if (messagesEl && aiChatMessages.length === 0) {


                renderAIWelcomeMessage();


            }


            addTimer(setTimeout(function() {


                var input = document.getElementById('sop-ai-chat-input');


                if (input) input.focus();


            }, 300));


        } else {


            overlay.classList.remove('active');


            drawer.classList.remove('open');


        }


    }


    function closeAIChatDrawer() {


        var overlay = document.getElementById('sop-ai-chat-overlay');


        var drawer = document.getElementById('sop-ai-chat-drawer');


        if (!overlay || !drawer) return;


        aiChatDrawerOpen = false;


        overlay.classList.remove('active');


        drawer.classList.remove('open');


    }


    function closeAllOverlays() {


        closeAIChatDrawer();


        closeSidePanel();


        toggleStepOverview(false);


        toggleMoreMenu(false);


    }


    function renderAIChatDrawer() {


        return `


            <div class="sop-ai-chat-drawer-header">


                <div class="sop-ai-chat-drawer-title">


                    <span class="sop-ai-chat-drawer-title-icon">🤖</span>


                    <span>问问AI</span>


                    <span class="sop-ai-chat-drawer-title-badge">智能助手</span>


                </div>


                <button class="sop-ai-chat-drawer-close" id="sop-ai-chat-drawer-close-btn">×</button>


            </div>


            <div class="sop-ai-chat-messages" id="sop-ai-chat-messages"></div>


            <div class="sop-ai-chat-input-area">


                <input type="text" class="sop-ai-chat-input" id="sop-ai-chat-input" placeholder="输入问题，智能回答..." maxlength="500">


                <button class="sop-ai-chat-send-btn" id="sop-ai-chat-send-btn">


                    <span class="sop-ai-chat-send-btn-icon">➤</span>


                </button>


            </div>


        `;


    }


    function renderAIWelcomeMessage() {


        var messagesEl = document.getElementById('sop-ai-chat-messages');


        if (!messagesEl) return;


        var welcomeHtml = `


            <div class="sop-ai-chat-welcome">


                <div class="sop-ai-chat-welcome-icon">🤖</div>


                <div class="sop-ai-chat-welcome-text">


                    您好！我是您的装修小助手<br><br>


                    我可以帮您解答：<br>


                    • 装修流程和步骤问题<br>


                    • 材料选购建议<br>


                    • 施工验收标准<br>


                    • 工期和预算计算<br>


                    • 其他装修相关疑问<br><br>


                    请随时向我提问！


                </div>


            </div>


        `;


        messagesEl.innerHTML = welcomeHtml;


    }


    function sendAIChatMessage(text) {


        var messagesEl = document.getElementById('sop-ai-chat-messages');


        if (!messagesEl) return;


        var now = new Date();


        var timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');


        var userMsg = {


            type: 'user',


            text: text,


            time: timeStr


        };


        aiChatMessages.push(userMsg);


        renderAIMessages();


        var input = document.getElementById('sop-ai-chat-input');


        var sendBtn = document.getElementById('sop-ai-chat-send-btn');


        if (input) input.disabled = true;


        if (sendBtn) sendBtn.disabled = true;


        addTimer(setTimeout(function() {


            var reply = generateAIReply(text);


            var aiMsg = {


                type: 'ai',


                text: reply,


                time: timeStr


            };


            aiChatMessages.push(aiMsg);


            renderAIMessages();


            if (input) input.disabled = false;


            if (sendBtn) sendBtn.disabled = false;


            if (input) input.focus();


        }, 800 + Math.random() * 500));


    }


    function renderAIMessages() {


        var messagesEl = document.getElementById('sop-ai-chat-messages');


        if (!messagesEl) return;


        var html = '';


        for (var i = 0; i < aiChatMessages.length; i++) {


            var msg = aiChatMessages[i];


            var avatar = msg.type === 'ai' ? '🤖' : '👤';


            html += `


                <div class="sop-ai-chat-message ${msg.type}">


                    <div class="sop-ai-chat-message-avatar">${avatar}</div>


                    <div>


                        <div class="sop-ai-chat-message-content">${escapeHtml(msg.text)}</div>


                        <div class="sop-ai-chat-message-time">${msg.time}</div>


                    </div>


                </div>


            `;


        }


        messagesEl.innerHTML = html;


        messagesEl.scrollTop = messagesEl.scrollHeight;


    }


    function escapeHtml(text) {


        var div = document.createElement('div');


        div.textContent = text;


        return div.innerHTML;


    }


    function generateAIReply(userMessage) {


        var msg = userMessage.toLowerCase();


        var replies = {


            '水泥': [


                '水泥一般分为普通硅酸盐水泥和复合硅酸盐水泥。家装常用的是32.5或42.5普通硅酸盐水泥。不同品牌的水泥不能混用哦！',


                '水泥的凝固时间要注意，夏季一般2-4小时，冬季可能需要4-8小时。施工后要做好养护，避免开裂。'


            ],


            '防水': [


                '卫生间防水至少要做1.8米高，厨房防水做30cm高就够了。防水涂料要刷2-3遍，每遍要等干了再刷下一遍。',


                '防水做完一定要做闭水试验，蓄水24-48小时，确认楼下没有渗漏才算合格。这是非常重要的验收环节！'


            ],


            '电线': [


                '电线选择要注意看3C认证标识。照明用2.5平方毫米的，插座用4平方毫米的，大功率电器如空调要用6平方毫米的。',


                '电路改造要注意不能横向开槽（破坏结构），强弱电要分开（间距30cm以上），还要注意接地保护。'


            ],


            '工期|时间|多久': [


                '一般100平米的房子，全包装修工期在60-90天左右，半包可能需要90-120天。具体还要看施工项目多少。',


                '装修工期受很多因素影响：设计变更、材料供应、天气情况等。签订合同前要把工期条款写清楚，包含延期责任。'


            ],


            '预算|花多少钱|费用': [


                '装修预算建议按“轻工辅料+主材”的方式分配：轻工辅料约占总预算的40-50%，主材占50-60%。',


                '一定要留出总预算的10-15%作为备用金，装修过程中难免会有一些增项和意外情况。'


            ],


            '验收': [


                '验收时要注意：1.检查材料品牌规格是否与合同一致 2.检查施工质量 3.核对工程量 4.保留好隐蔽工程照片和记录。',


                '每个工序完成后都要亲自验收再付款。特别是水电改造、防水工程这些隐蔽工程，一旦覆盖出问题很难整改。'


            ],


            '甲醛|环保|味道': [


                '甲醛释放周期长，装修后建议通风3-6个月再入住。可以买甲醛检测盒或请专业机构检测，达标后再入住。',


                '选购材料时要看检测报告，选择E0级或E1级的环保材料。木质板材、胶水、油漆是甲醛主要来源。'


            ],


            '瓷砖': [


                '瓷砖选购要看吸水率，背面滴水扩散慢的说明密度高、质量好。还要注意色差问题，不同批次的瓷砖可能有色差。',


                '瓷砖铺贴前要泡水2小时以上，让砖充分吸水。铺贴后要勾缝处理，选择与整体风格搭配的美缝剂效果更好。'


            ],


            '地板': [


                '实木地板脚感好但需要保养，强化地板耐磨但脚感偏硬。实木复合地板是性价比不错的选择。',


                '地板安装前要确保地面平整干燥，铺装时记得留好伸缩缝（约8-12mm），避免热胀冷缩起拱。'


            ],


            '木工': [


                '木工施工要注意木材含水率，一般控制在8%-12%为宜。含水率太高容易变形开裂。',


                '现场制作柜子要注意封边处理，选择好的封边条可以减少甲醛释放，也更美观耐用。'


            ]


        };


        var matchedKeys = Object.keys(replies).filter(function(key) {


            return msg.indexOf(key) !== -1;


        });


        var defaultReplies = [


            '这个问题很好！装修过程中确实需要多了解相关知识。建议您可以查阅一下相关的装修攻略，或者咨询专业的装修师傅哦。',


            '您问的这个问题很专业呢！不同情况下处理方式可能不太一样，建议您结合实际情况来判断，或者咨询专业人士。',


            '装修确实是个复杂的过程，我建议您：1.多看装修案例找灵感 2.了解材料行情 3.找靠谱的施工团队 4.做好验收记录。您遇到的这个问题具体是什么情况呢？',


            '这个问题需要根据具体情况分析。一般来说，找有经验的工人、选用合格材料、做好验收可以避免大部分问题。还有什么我可以帮您解答的吗？',


            '好的，我明白了。您可以告诉我更多细节吗？比如是哪个阶段、什么材料、有什么问题等，这样我能给出更有针对性的建议。',


            '装修中遇到问题是常见的，关键是要找到靠谱的解决方案。您可以描述一下具体遇到了什么情况，我来帮您分析分析。',


            '您提到的这个问题，我的建议是先确认事实情况，然后对比多个方案再做决定。装修没有标准答案，适合自己的才是最好的。',


            '非常感谢您的提问！关于装修的具体问题，我建议您可以：1.查阅相关规范标准 2.咨询有经验的人士 3.与施工方充分沟通。有任何问题随时问我哦！',


            '明白了！装修是个系统工程，需要耐心和细心。您现在遇到的这个问题，一般的处理原则是...希望我的回答对您有帮助，还有问题欢迎继续问我！',


            '您问的这个问题涉及装修的细节部分。我的看法是：既要注重质量，也要控制成本，两者平衡才是最好的方案。有更多问题欢迎随时咨询！'


        ];


        var result;


        if (matchedKeys.length > 0) {


            var key = matchedKeys[0];


            var options = replies[key];


            result = options[Math.floor(Math.random() * options.length)];


        } else {


            result = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];


        }


        return result;


    }


    // 已迁移至步骤内AI工具卡片
    // var budgetMonitorOpen = false;


    function getBudgetMonitor() {
        var progress = getProgress();
        if (!progress.budgetMonitor) {
            progress.budgetMonitor = {
                totalBudget: 100000,
                expenses: [],
                addons: []
            };
            saveProgress();
        }
        return progress.budgetMonitor;
    }


    function saveBudgetMonitor() {
        saveProgress();
    }


    function getBudgetSummary() {
        var bm = getBudgetMonitor();
        var totalBudget = parseFloat(bm.totalBudget) || 0;
        var totalSpent = 0;
        var categoryTotals = {
            labor: 0,
            material: 0,
            custom: 0,
            appliance: 0,
            other: 0
        };
        var categoryNames = {
            labor: '人工费',
            material: '材料费',
            custom: '定制费',
            appliance: '家电费',
            other: '其他'
        };

        for (var i = 0; i < bm.expenses.length; i++) {
            var exp = bm.expenses[i];
            var expAmount = parseFloat(exp.amount) || 0;
            totalSpent += expAmount;
            var cat = exp.category || 'other';
            if (categoryTotals.hasOwnProperty(cat)) {
                categoryTotals[cat] += expAmount;
            } else {
                categoryTotals.other += expAmount;
            }
        }

        var addonTotal = 0;
        for (var j = 0; j < bm.addons.length; j++) {
            addonTotal += parseFloat(bm.addons[j].amount) || 0;
        }

        var remaining = totalBudget - totalSpent;
        var percentUsed = totalBudget > 0 ? (totalSpent / totalBudget * 100) : 0;
        var isOverBudget = remaining < 0;
        var isWarning = !isOverBudget && remaining < totalBudget * 0.2;

        return {
            totalBudget: totalBudget,
            totalSpent: totalSpent,
            remaining: remaining,
            percentUsed: percentUsed,
            isOverBudget: isOverBudget,
            isWarning: isWarning,
            categoryTotals: categoryTotals,
            categoryNames: categoryNames,
            addonTotal: addonTotal,
            addonCount: bm.addons.length
        };
    }


    function analyzeAddonReasonableness(addon) {
        var name = addon.name || '';
        var reason = addon.reason || '';
        var amount = addon.amount || 0;
        var bm = getBudgetMonitor();
        var totalBudget = bm.totalBudget || 100000;

        var ratio = totalBudget > 0 ? amount / totalBudget : 0;

        var maliciousKeywords = ['加价', '额外收费', '必须做', '不然后果自负', '强制', '规定要做'];
        var necessaryKeywords = ['安全', '防水', '承重', '规范要求', '国标', '必须', '隐患', '漏水', '漏电', '开裂'];
        var optionalKeywords = ['美观', '好看', '升级', '更好', '推荐', '建议', '可选'];

        var fullText = name + ' ' + reason;
        var maliciousScore = 0;
        var necessaryScore = 0;
        var optionalScore = 0;

        for (var i = 0; i < maliciousKeywords.length; i++) {
            if (fullText.indexOf(maliciousKeywords[i]) !== -1) maliciousScore += 2;
        }
        for (var j = 0; j < necessaryKeywords.length; j++) {
            if (fullText.indexOf(necessaryKeywords[j]) !== -1) necessaryScore += 2;
        }
        for (var k = 0; k < optionalKeywords.length; k++) {
            if (fullText.indexOf(optionalKeywords[k]) !== -1) optionalScore += 1;
        }

        if (ratio > 0.1) maliciousScore += 3;
        else if (ratio > 0.05) maliciousScore += 1;

        if (addon.isSigned) necessaryScore += 1;

        var result;
        if (maliciousScore >= 4 && necessaryScore < 3) {
            result = { type: 'malicious', label: '恶意增项', color: '#c62828', advice: '此增项存在恶意加价嫌疑，建议：1. 核对合同是否包含该项目 2. 拒绝未签字确认的增项 3. 向消协或住建部门投诉' };
        } else if (necessaryScore >= 3) {
            result = { type: 'necessary', label: '必要增项', color: '#2e7d32', advice: '此增项属于必要项目，建议：1. 确认价格合理性 2. 签字确认后再施工 3. 留存书面凭证' };
        } else if (optionalScore >= 2 || necessaryScore >= 1) {
            result = { type: 'optional', label: '可选增项', color: '#f57c00', advice: '此增项可做可不做，建议：1. 根据预算和需求决定 2. 货比三家确认价格 3. 不要被销售话术绑架' };
        } else {
            result = { type: 'pending', label: '待评估', color: '#9e9e9e', advice: '信息不足，建议：1. 要求施工方提供详细报价 2. 了解增项产生的具体原因 3. 确认是否真的需要做' };
        }

        return result;
    }


    function generateQualityReport(result, subtitle) {
        var report = '';
        report += '========================================\n';
        report += '         AI 质量验收报告\n';
        report += '========================================\n\n';
        report += '检查项目：' + (subtitle || 'AI质检报告') + '\n';
        report += '检查日期：' + new Date().toLocaleDateString('zh-CN') + '\n';
        report += '综合评分：' + result.score + '分\n';
        report += '质量等级：' + (result.qualityLevel || '良好') + '\n\n';

        report += '----------------------------------------\n';
        report += '              评分详情\n';
        report += '----------------------------------------\n\n';

        if (result.dimensions) {
            for (var i = 0; i < result.dimensions.length; i++) {
                var dim = result.dimensions[i];
                report += (i + 1) + '. ' + dim.name + '：' + dim.score + '分\n';
            }
        }

        report += '\n----------------------------------------\n';
        report += '              问题清单\n';
        report += '----------------------------------------\n\n';

        if (result.problemList && result.problemList.length > 0) {
            for (var j = 0; j < result.problemList.length; j++) {
                var p = result.problemList[j];
                report += '【问题' + (j + 1) + '】' + p.name + '\n';
                report += '  严重程度：' + p.severity + '\n';
                report += '  问题描述：' + p.desc + '\n';
                report += '  整改建议：' + p.suggestion + '\n';
                report += '  验收依据：' + p.standard + '\n\n';
            }
        } else {
            report += '未发现明显质量问题。\n\n';
        }

        report += '----------------------------------------\n';
        report += '              总结建议\n';
        report += '----------------------------------------\n\n';
        report += result.suggestions + '\n\n';

        if (result.standards && result.standards.length > 0) {
            report += '----------------------------------------\n';
            report += '              验收标准\n';
            report += '----------------------------------------\n\n';
            for (var k = 0; k < result.standards.length; k++) {
                report += result.standards[k] + '\n';
            }
        }

        report += '\n========================================\n';
        report += '    报告生成：智能质检系统（示例效果）\n';
        report += '    免责声明：本报告仅供参考，不作为\n';
        report += '    验收依据，具体以现场实际情况为准\n';
        report += '========================================\n';

        return report;
    }


    /* 已迁移至步骤内AI工具卡片
    function renderBudgetMonitorPanel() {
        var summary = getBudgetSummary();
        var bm = getBudgetMonitor();

        var statusClass = summary.isOverBudget ? 'over' : (summary.isWarning ? 'warning' : 'normal');
        var statusText = summary.isOverBudget ? '已超支' : (summary.isWarning ? '预算紧张' : '预算充足');
        var statusColor = summary.isOverBudget ? '#c62828' : (summary.isWarning ? '#f57c00' : '#2e7d32');

        var categoryHtml = '';
        var catKeys = Object.keys(summary.categoryTotals);
        for (var i = 0; i < catKeys.length; i++) {
            var key = catKeys[i];
            var catAmount = summary.categoryTotals[key];
            var catName = summary.categoryNames[key];
            var catPercent = summary.totalSpent > 0 ? (catAmount / summary.totalSpent * 100) : 0;
            var colors = {
                labor: '#e65100',
                material: '#f57c00',
                custom: '#ffa726fb',
                appliance: '#ffb74d',
                other: '#ffcc80'
            };
            var color = colors[key] || '#ffcc80';
            categoryHtml += `
                <div class="sop-budget-category-item">
                    <div class="sop-budget-category-header">
                        <span class="sop-budget-category-name" style="color:${color}">● ${catName}</span>
                        <span class="sop-budget-category-amount">¥${formatMoney(catAmount)}</span>
                    </div>
                    <div class="sop-budget-category-bar">
                        <div class="sop-budget-category-fill" style="width:${catPercent.toFixed(1)}%; background-color:${color}"></div>
                    </div>
                    <div class="sop-budget-category-percent">占比 ${catPercent.toFixed(1)}%</div>
                </div>
            `;
        }

        var expensesHtml = '';
        if (bm.expenses.length > 0) {
            var sortedExpenses = bm.expenses.slice().sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
            for (var j = 0; j < Math.min(sortedExpenses.length, 10); j++) {
                var exp = sortedExpenses[j];
                var catName2 = summary.categoryNames[exp.category] || '其他';
                expensesHtml += `
                    <div class="sop-budget-expense-item">
                        <div class="sop-budget-expense-info">
                            <div class="sop-budget-expense-name">${exp.name}</div>
                            <div class="sop-budget-expense-meta">${catName2} · ${exp.date || ''}</div>
                        </div>
                        <div class="sop-budget-expense-amount">-¥${formatMoney(exp.amount)}</div>
                    </div>
                `;
            }
        } else {
            expensesHtml = '<div class="sop-budget-empty">暂无支出记录，点击"添加支出"开始记录</div>';
        }

        var addonsHtml = '';
        if (bm.addons.length > 0) {
            for (var k = 0; k < bm.addons.length; k++) {
                var addon = bm.addons[k];
                var analysis = analyzeAddonReasonableness(addon);
                addonsHtml += `
                    <div class="sop-budget-addon-item">
                        <div class="sop-budget-addon-header">
                            <span class="sop-budget-addon-name">${addon.name}</span>
                            <span class="sop-budget-addon-amount">+¥${formatMoney(addon.amount)}</span>
                        </div>
                        <div class="sop-budget-addon-reason">原因：${addon.reason || '未填写'}</div>
                        <div class="sop-budget-addon-analysis" style="color:${analysis.color}">
                            <span class="sop-budget-addon-tag" style="background-color:${analysis.color}20; color:${analysis.color}">${analysis.label}</span>
                            <span class="sop-budget-addon-signed">${addon.isSigned ? '✓ 已签字' : '✗ 未签字'}</span>
                        </div>
                        <div class="sop-budget-addon-advice">💡 ${analysis.advice}</div>
                    </div>
                `;
            }
        } else {
            addonsHtml = '<div class="sop-budget-empty">暂无增项记录</div>';
        }

        var panelHtml = `
            <div class="sop-budget-monitor-panel">
                <div class="sop-budget-header">
                    <div class="sop-budget-header-top">
                        <div class="sop-budget-total-label">总预算</div>
                        <div class="sop-budget-total-amount">
                            ¥${formatMoney(summary.totalBudget)}
                            <button class="sop-budget-edit-btn" data-action="edit-budget">编辑</button>
                        </div>
                    </div>
                    <div class="sop-budget-progress-section">
                        <div class="sop-budget-progress-info">
                            <span>已支出 ¥${formatMoney(summary.totalSpent)}</span>
                            <span class="sop-budget-status sop-budget-status-${statusClass}">${statusText}</span>
                        </div>
                        <div class="sop-budget-progress-bar">
                            <div class="sop-budget-progress-fill" style="width:${Math.min(summary.percentUsed, 100)}%; background-color:${statusColor}"></div>
                        </div>
                        <div class="sop-budget-progress-detail">
                            <span>剩余 ¥${formatMoney(Math.max(summary.remaining, 0))}</span>
                            <span>${summary.percentUsed.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                ${summary.isWarning || summary.isOverBudget ? `
                    <div class="sop-budget-warning">
                        <span class="sop-budget-warning-icon">⚠️</span>
                        <span class="sop-budget-warning-text">
                            ${summary.isOverBudget ? '已超支 ¥' + formatMoney(Math.abs(summary.remaining)) + '，请严格控制支出！' : '剩余预算不足20%，请注意控制支出！'}
                        </span>
                    </div>
                ` : ''}

                <div class="sop-budget-tabs">
                    <button class="sop-budget-tab active" data-tab="overview">概览</button>
                    <button class="sop-budget-tab" data-tab="expenses">支出</button>
                    <button class="sop-budget-tab" data-tab="addons">增项</button>
                </div>

                <div class="sop-budget-tab-content" data-tab-content="overview">
                    <div class="sop-budget-section">
                        <div class="sop-budget-section-title">📊 分类支出占比</div>
                        <div class="sop-budget-category-list">
                            ${categoryHtml}
                        </div>
                    </div>
                    <div class="sop-budget-section">
                        <div class="sop-budget-section-title">💰 增项统计</div>
                        <div class="sop-budget-addon-summary">
                            <div class="sop-budget-addon-stat">
                                <div class="sop-budget-addon-stat-num">${summary.addonCount}</div>
                                <div class="sop-budget-addon-stat-label">增项数量</div>
                            </div>
                            <div class="sop-budget-addon-stat">
                                <div class="sop-budget-addon-stat-num">¥${formatMoney(summary.addonTotal)}</div>
                                <div class="sop-budget-addon-stat-label">增项总额</div>
                            </div>
                            <div class="sop-budget-addon-stat">
                                <div class="sop-budget-addon-stat-num">${summary.totalBudget > 0 ? (summary.addonTotal / summary.totalBudget * 100).toFixed(1) : 0}%</div>
                                <div class="sop-budget-addon-stat-label">占预算比例</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sop-budget-tab-content" data-tab-content="expenses" style="display:none">
                    <div class="sop-budget-actions">
                        <button class="sop-budget-add-btn" data-action="add-expense">+ 添加支出</button>
                    </div>
                    <div class="sop-budget-expense-list">
                        ${expensesHtml}
                    </div>
                </div>

                <div class="sop-budget-tab-content" data-tab-content="addons" style="display:none">
                    <div class="sop-budget-actions">
                        <button class="sop-budget-add-btn" data-action="add-addon">+ 录入增项</button>
                    </div>
                    <div class="sop-budget-addon-list">
                        ${addonsHtml}
                    </div>
                </div>
            </div>
        `;

        return panelHtml;
    }
    */


    /* 已迁移至步骤内AI工具卡片
    function openBudgetMonitor() {
        if (budgetMonitorOpen) return;
        budgetMonitorOpen = true;

        var overlay = document.getElementById('sop-budget-overlay');
        var panel = document.getElementById('sop-budget-panel');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sop-budget-overlay';
            overlay.className = 'sop-budget-overlay';
            document.body.appendChild(overlay);
        }

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'sop-budget-panel';
            panel.className = 'sop-budget-panel';
            panel.innerHTML = `
                <div class="sop-budget-panel-header">
                    <div class="sop-budget-panel-title">
                        <span class="sop-budget-panel-icon">📊</span>
                        预算监控
                    </div>
                    <button class="sop-budget-panel-close" id="sop-budget-close">×</button>
                </div>
                <div class="sop-budget-panel-body" id="sop-budget-panel-body"></div>
            `;
            document.body.appendChild(panel);
        }

        document.getElementById('sop-budget-panel-body').innerHTML = renderBudgetMonitorPanel();

        setTimeout(function() {
            overlay.classList.add('active');
            panel.classList.add('open');
        }, 10);

        bindBudgetMonitorEvents();
    }


    function closeBudgetMonitor() {
        if (!budgetMonitorOpen) return;
        budgetMonitorOpen = false;

        var overlay = document.getElementById('sop-budget-overlay');
        var panel = document.getElementById('sop-budget-panel');

        if (overlay) overlay.classList.remove('active');
        if (panel) panel.classList.remove('open');
    }
    */


    /* 已迁移至步骤内AI工具卡片
    function bindBudgetMonitorEvents() {
        var overlay = document.getElementById('sop-budget-overlay');
        var closeBtn = document.getElementById('sop-budget-close');
        var panel = document.getElementById('sop-budget-panel');

        if (overlay) {
            overlay.onclick = function(e) {
                if (e.target === overlay) closeBudgetMonitor();
            };
        }
        if (closeBtn) {
            closeBtn.onclick = closeBudgetMonitor;
        }

        if (panel) {
            var editBtn = panel.querySelector('[data-action="edit-budget"]');
            if (editBtn) {
                editBtn.onclick = function() {
                    var bm = getBudgetMonitor();
                    var newBudget = prompt('请输入总预算金额（元）：', bm.totalBudget);
                    if (newBudget !== null) {
                        var num = parseFloat(newBudget);
                        if (!isNaN(num) && num > 0) {
                            bm.totalBudget = num;
                            saveBudgetMonitor();
                            document.getElementById('sop-budget-panel-body').innerHTML = renderBudgetMonitorPanel();
                            bindBudgetMonitorEvents();
                            updateBudgetFloatBtn();
                            if (window.Toast && Toast.success) Toast.success('预算已更新');
                        }
                    }
                };
            }

            var addExpenseBtn = panel.querySelector('[data-action="add-expense"]');
            if (addExpenseBtn) {
                addExpenseBtn.onclick = function() {
                    showAddExpenseModal();
                };
            }

            var addAddonBtn = panel.querySelector('[data-action="add-addon"]');
            if (addAddonBtn) {
                addAddonBtn.onclick = function() {
                    showAddAddonModal();
                };
            }

            var tabs = panel.querySelectorAll('.sop-budget-tab');
            tabs.forEach(function(tab) {
                tab.onclick = function() {
                    var tabName = this.getAttribute('data-tab');
                    tabs.forEach(function(t) { t.classList.remove('active'); });
                    this.classList.add('active');
                    var contents = panel.querySelectorAll('.sop-budget-tab-content');
                    contents.forEach(function(c) { c.style.display = 'none'; });
                    var targetContent = panel.querySelector('[data-tab-content="' + tabName + '"]');
                    if (targetContent) targetContent.style.display = 'block';
                };
            });
        }
    }


    /* 已迁移至步骤内AI工具卡片
    function showAddExpenseModal() {
        var modalHtml = `
            <div class="sop-budget-modal-overlay" id="sop-expense-modal-overlay">
                <div class="sop-budget-modal">
                    <div class="sop-budget-modal-header">
                        <span>添加支出</span>
                        <button class="sop-budget-modal-close" data-modal-close="expense">×</button>
                    </div>
                    <div class="sop-budget-modal-body">
                        <div class="sop-budget-form-item">
                            <label>支出项目</label>
                            <input type="text" id="expense-name" placeholder="如：首付款、瓷砖采购等">
                        </div>
                        <div class="sop-budget-form-item">
                            <label>金额（元）</label>
                            <input type="number" id="expense-amount" placeholder="请输入金额">
                        </div>
                        <div class="sop-budget-form-item">
                            <label>分类</label>
                            <select id="expense-category">
                                <option value="labor">人工费</option>
                                <option value="material">材料费</option>
                                <option value="custom">定制费</option>
                                <option value="appliance">家电费</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <div class="sop-budget-form-item">
                            <label>日期</label>
                            <input type="date" id="expense-date" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    <div class="sop-budget-modal-footer">
                        <button class="sop-budget-btn-cancel" data-modal-close="expense">取消</button>
                        <button class="sop-budget-btn-confirm" id="expense-confirm">确认添加</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        var overlay = document.getElementById('sop-expense-modal-overlay');
        overlay.querySelectorAll('[data-modal-close="expense"]').forEach(function(btn) {
            btn.onclick = function() { overlay.remove(); };
        });
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

        document.getElementById('expense-confirm').onclick = function() {
            var name = document.getElementById('expense-name').value.trim();
            var amount = parseFloat(document.getElementById('expense-amount').value);
            var category = document.getElementById('expense-category').value;
            var date = document.getElementById('expense-date').value;

            if (!name) { if (window.Toast) Toast.error('请输入支出项目'); return; }
            if (isNaN(amount) || amount <= 0) { if (window.Toast) Toast.error('请输入正确的金额'); return; }

            var bm = getBudgetMonitor();
            bm.expenses.push({
                id: 'exp_' + Date.now(),
                name: name,
                amount: amount,
                category: category,
                date: date
            });
            saveBudgetMonitor();
            overlay.remove();
            document.getElementById('sop-budget-panel-body').innerHTML = renderBudgetMonitorPanel();
            bindBudgetMonitorEvents();
            updateBudgetFloatBtn();
            if (window.Toast && Toast.success) Toast.success('支出已添加');
        };
    }
    */


    /* 已迁移至步骤内AI工具卡片
    function showAddAddonModal() {
        var modalHtml = `
            <div class="sop-budget-modal-overlay" id="sop-addon-modal-overlay">
                <div class="sop-budget-modal">
                    <div class="sop-budget-modal-header">
                        <span>录入增项</span>
                        <button class="sop-budget-modal-close" data-modal-close="addon">×</button>
                    </div>
                    <div class="sop-budget-modal-body">
                        <div class="sop-budget-form-item">
                            <label>增项名称</label>
                            <input type="text" id="addon-name" placeholder="如：防水升级、吊顶造型等">
                        </div>
                        <div class="sop-budget-form-item">
                            <label>增项原因</label>
                            <textarea id="addon-reason" placeholder="请描述增项原因" rows="3"></textarea>
                        </div>
                        <div class="sop-budget-form-item">
                            <label>金额（元）</label>
                            <input type="number" id="addon-amount" placeholder="请输入金额">
                        </div>
                        <div class="sop-budget-form-item">
                            <label class="sop-budget-checkbox-label">
                                <input type="checkbox" id="addon-signed">
                                <span>已签字确认</span>
                            </label>
                        </div>
                        <div class="sop-budget-ai-hint">
                            💡 AI将自动判断增项合理性（必要/可选/恶意）
                        </div>
                    </div>
                    <div class="sop-budget-modal-footer">
                        <button class="sop-budget-btn-cancel" data-modal-close="addon">取消</button>
                        <button class="sop-budget-btn-confirm" id="addon-confirm">确认添加</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        var overlay = document.getElementById('sop-addon-modal-overlay');
        overlay.querySelectorAll('[data-modal-close="addon"]').forEach(function(btn) {
            btn.onclick = function() { overlay.remove(); };
        });
        overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

        document.getElementById('addon-confirm').onclick = function() {
            var name = document.getElementById('addon-name').value.trim();
            var reason = document.getElementById('addon-reason').value.trim();
            var amount = parseFloat(document.getElementById('addon-amount').value);
            var isSigned = document.getElementById('addon-signed').checked;

            if (!name) { if (window.Toast) Toast.error('请输入增项名称'); return; }
            if (isNaN(amount) || amount <= 0) { if (window.Toast) Toast.error('请输入正确的金额'); return; }

            var bm = getBudgetMonitor();
            bm.addons.push({
                id: 'addon_' + Date.now(),
                name: name,
                reason: reason,
                amount: amount,
                isSigned: isSigned,
                date: new Date().toISOString().split('T')[0]
            });
            saveBudgetMonitor();
            overlay.remove();
            document.getElementById('sop-budget-panel-body').innerHTML = renderBudgetMonitorPanel();
            bindBudgetMonitorEvents();
            updateBudgetFloatBtn();
            if (window.Toast && Toast.success) Toast.success('增项已添加');
        };
    }
    */


    /* 已迁移至步骤内AI工具卡片
    function updateBudgetFloatBtn() {
        var btn = document.getElementById('sop-budget-float-btn');
        if (!btn) return;
        var summary = getBudgetSummary();
        var statusClass = summary.isOverBudget ? 'over' : (summary.isWarning ? 'warning' : 'normal');
        btn.className = 'sop-budget-float-btn sop-budget-float-' + statusClass;
        var amountEl = btn.querySelector('.sop-budget-float-amount');
        if (amountEl) {
            amountEl.textContent = '¥' + formatMoney(summary.remaining);
        }
    }


    function renderBudgetFloatBtn() {
        if (document.getElementById('sop-budget-float-btn')) return;

        var summary = getBudgetSummary();
        var statusClass = summary.isOverBudget ? 'over' : (summary.isWarning ? 'warning' : 'normal');

        var btnHtml = `
            <button id="sop-budget-float-btn" class="sop-budget-float-btn sop-budget-float-${statusClass}">
                <span class="sop-budget-float-icon">💰</span>
                <span class="sop-budget-float-text">预算</span>
                <span class="sop-budget-float-amount">¥${formatMoney(summary.remaining)}</span>
            </button>
        `;
        document.body.insertAdjacentHTML('beforeend', btnHtml);

        document.getElementById('sop-budget-float-btn').onclick = openBudgetMonitor;
    }
    */


    function destroy() {

        clearAllTimers();

        if (throttledHandleResize) {
            window.removeEventListener('resize', throttledHandleResize);
        } else {
            window.removeEventListener('resize', handleResize);
        }
        document.removeEventListener('click', handleDocumentClick);
        document.removeEventListener('keydown', handleGlobalKeydown);


        var celebrationOverlay = document.getElementById('sop-celebration-overlay');


        if (celebrationOverlay) celebrationOverlay.remove();

        if (window.FloatingButler && typeof FloatingButler.destroy === 'function') {
            FloatingButler.destroy();
        }

        var aiOverlay = document.getElementById('sop-ai-chat-overlay');
        if (aiOverlay) aiOverlay.remove();

        var aiDrawer = document.getElementById('sop-ai-chat-drawer');
        if (aiDrawer) aiDrawer.remove();

        var schedOverlay = document.getElementById('sop-sched-overlay');
        if (schedOverlay) schedOverlay.remove();

        var schedPanel = document.getElementById('sop-sched-panel');
        if (schedPanel) schedPanel.remove();

        scheduleTrackerOpen = false;
        aiChatDrawerOpen = false;
        aiChatMessages = [];
        
        unsubscribeEvents();


        eventListenersBound = false;
        stageEventsBound = false;

        clearElementCache();

        container = null;

    }


    function safeRender(containerEl) {
        try {
            render(containerEl);
        } catch (e) {
            console.error('[SopView] render error:', e);
            if (window.App && App.showErrorState) {
                App.showErrorState(containerEl, {
                    title: 'SOP 流程页加载失败',
                    desc: '小管家在加载装修流程时遇到了一点小问题，请重试~',
                    primaryAction: '重试',
                    secondaryAction: '返回首页',
                    onPrimaryAction: function() {
                        safeRender(containerEl);
                    },
                    onSecondaryAction: function() {
                        if (App.switchView) {
                            App.switchView('home');
                        }
                    }
                });
            }
            if (window.Toast && Toast.error) {
                Toast.error('SOP 流程页加载出错了');
            }
        }
    }

    function safeInit(containerEl) {
        try {
            init(containerEl);
        } catch (e) {
            console.error('[SopView] init error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('页面初始化出错了');
            }
        }
    }

    function safeViewEnter(containerEl) {
        try {
            viewEnter(containerEl);
        } catch (e) {
            console.error('[SopView] viewEnter error:', e);
        }
    }

    var MATERIAL_CATEGORIES = {
        plumbing: { name: '水电材料', icon: '💧', standardItems: [
            { name: 'PPR水管', brand: '伟星/日丰/金牛', spec: '20mm*2.8mm', antiFake: '扫描管身二维码，查看官方防伪验证' },
            { name: '电线', brand: '熊猫/正泰/远东', spec: 'BV 2.5mm²/4mm²', antiFake: '检查绝缘层印刷清晰度，刮开防伪涂层查询' },
            { name: '穿线管', brand: '联塑/中财', spec: 'PVC Φ16/Φ20', antiFake: '检查管材壁厚均匀度，查看品牌标识' },
            { name: '底盒', brand: '正泰/德力西', spec: '86型', antiFake: '检查材质韧性，品牌logo清晰度' }
        ]},
        tiling: { name: '泥瓦材料', icon: '🧱', standardItems: [
            { name: '水泥', brand: '海螺/南方', spec: 'P.O 42.5', antiFake: '检查包装袋封口，拨打防伪电话' },
            { name: '瓷砖胶', brand: '德高/雨虹', spec: 'C1/C2级', antiFake: '扫描桶身二维码，验证产品溯源' },
            { name: '防水涂料', brand: '东方雨虹/德高', spec: 'K11/聚氨酯', antiFake: '查看产品合格证，扫码验证真伪' },
            { name: '瓷砖', brand: '东鹏/马可波罗/诺贝尔', spec: '按设计需求', antiFake: '检查包装箱色号一致，查看底标' }
        ]},
        carpentry: { name: '木工材料', icon: '🪵', standardItems: [
            { name: '石膏板', brand: '可耐福/龙牌/泰山', spec: '9.5mm/12mm', antiFake: '查看板材侧边喷码，核对防伪标识' },
            { name: '轻钢龙骨', brand: '可耐福/龙牌', spec: '50/75系列', antiFake: '检查镀锌层质量，品牌钢印' },
            { name: '木工板', brand: '兔宝宝/莫干山', spec: 'E0级 18mm', antiFake: '查看环保等级标识，扫描防伪码' },
            { name: '五金配件', brand: '海蒂诗/百隆', spec: '按需求', antiFake: '检查产品包装和刻印logo' }
        ]},
        painting: { name: '油漆材料', icon: '🎨', standardItems: [
            { name: '乳胶漆', brand: '立邦/多乐士/芬琳', spec: '面漆/底漆', antiFake: '查看桶身防伪标签，官网查询' },
            { name: '腻子粉', brand: '美巢/立邦', spec: '耐水型', antiFake: '检查包装袋防伪标识，扫码验证' },
            { name: '木器漆', brand: '华润/大宝', spec: '水性/油性', antiFake: '查看产品检测报告，核对批次号' }
        ]},
        custom: { name: '定制材料', icon: '🚪', standardItems: [
            { name: '定制柜体板材', brand: '索菲亚/欧派/尚品', spec: '颗粒板/多层板', antiFake: '查看板材防伪钢印，品牌授权书' },
            { name: '五金配件', brand: '百隆/海蒂诗/DTC', spec: '铰链/滑轨', antiFake: '检查产品刻印，核对授权证明' },
            { name: '门板', brand: '按定制品牌', spec: '模压/烤漆/PET', antiFake: '查看封边质量，品牌标识' }
        ]}
    };

    function getMaterialInspection() {
        var progress = getProgress();
        if (!progress.materialInspection) {
            progress.materialInspection = { records: [] };
            saveProgress();
        }
        return progress.materialInspection;
    }

    function saveMaterialInspection() {
        saveProgress();
    }

    function renderMaterialInspectionPanel(step, toolId) {
        var mi = getMaterialInspection();
        var subtype = (step.aiTools && step.aiTools.find(function(t) { return t.id === toolId; }) || {}).subtype || 'default';

        var categoryOptions = Object.keys(MATERIAL_CATEGORIES).map(function(key) {
            var cat = MATERIAL_CATEGORIES[key];
            return '<option value="' + key + '">' + cat.icon + ' ' + cat.name + '</option>';
        }).join('');

        var recordsHtml = '';
        if (mi.records.length > 0) {
            var sortedRecords = mi.records.slice().sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
            recordsHtml = sortedRecords.map(function(record) {
                var cat = MATERIAL_CATEGORIES[record.category] || { name: '其他', icon: '📦' };
                var statusClass = record.status === 'pass' ? 'pass' : (record.status === 'warning' ? 'warning' : 'pending');
                var statusText = record.status === 'pass' ? '验收通过' : (record.status === 'warning' ? '需关注' : '待验收');
                return `
                    <div class="sop-mi-record">
                        <div class="sop-mi-record-header">
                            <span class="sop-mi-record-cat">${cat.icon} ${cat.name}</span>
                            <span class="sop-mi-record-status sop-mi-status-${statusClass}">${statusText}</span>
                        </div>
                        <div class="sop-mi-record-name">${record.name}</div>
                        <div class="sop-mi-record-meta">
                            <span>品牌：${record.brand || '待填写'}</span>
                            <span>规格：${record.spec || '待填写'}</span>
                        </div>
                        <div class="sop-mi-record-meta">
                            <span>数量：${record.quantity || '待填写'}</span>
                            <span>日期：${record.date || '-'}</span>
                        </div>
                        ${record.notes ? '<div class="sop-mi-record-notes">备注：' + record.notes + '</div>' : ''}
                    </div>
                `;
            }).join('');
        } else {
            recordsHtml = '<div class="sop-ai-result-empty">暂无验收记录，点击下方按钮添加</div>';
        }

        return `
            <div class="sop-mi-panel">
                <div class="sop-mi-intro">
                    <div class="sop-mi-intro-icon">📦</div>
                    <div class="sop-mi-intro-text">
                        <div class="sop-mi-intro-title">AI材料进场智能验收</div>
                        <div class="sop-mi-intro-desc">录入材料信息，自动比对标准规格，提供真伪鉴别提示</div>
                    </div>
                </div>

                <div class="sop-mi-form">
                    <div class="sop-mi-form-title">📝 材料信息录入</div>
                    <div class="sop-mi-form-row">
                        <div class="sop-mi-form-item">
                            <label>材料分类</label>
                            <select id="mi-category">
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="sop-mi-form-item">
                            <label>材料名称</label>
                            <input type="text" id="mi-name" placeholder="如：PPR水管">
                        </div>
                    </div>
                    <div class="sop-mi-form-row">
                        <div class="sop-mi-form-item">
                            <label>品牌</label>
                            <input type="text" id="mi-brand" placeholder="如：伟星">
                        </div>
                        <div class="sop-mi-form-item">
                            <label>型号规格</label>
                            <input type="text" id="mi-spec" placeholder="如：20mm*2.8mm">
                        </div>
                    </div>
                    <div class="sop-mi-form-row">
                        <div class="sop-mi-form-item">
                            <label>数量</label>
                            <input type="text" id="mi-quantity" placeholder="如：100米 / 50袋">
                        </div>
                        <div class="sop-mi-form-item">
                            <label>进场日期</label>
                            <input type="date" id="mi-date" value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    <div class="sop-mi-form-item">
                        <label>验收备注</label>
                        <textarea id="mi-notes" rows="2" placeholder="记录验收情况、防伪验证结果等"></textarea>
                    </div>
                    <button class="sop-mi-add-btn" data-action="add-material-record" data-step="${step.id}" data-tool-id="${toolId}">
                        ✅ 添加验收记录
                    </button>
                </div>

                <div class="sop-mi-standards">
                    <div class="sop-mi-standards-title">📋 常见材料标准规格参考</div>
                    <div id="mi-standard-items" class="sop-mi-standard-list">
                        ${renderStandardItems('plumbing')}
                    </div>
                </div>

                <div class="sop-mi-records">
                    <div class="sop-mi-records-title">📁 验收记录存档 <span class="sop-mi-count">${mi.records.length}条</span></div>
                    <div class="sop-mi-records-list">
                        ${recordsHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function renderStandardItems(category) {
        var cat = MATERIAL_CATEGORIES[category];
        if (!cat) return '';
        return cat.standardItems.map(function(item) {
            return `
                <div class="sop-mi-standard-item">
                    <div class="sop-mi-standard-name">${item.name}</div>
                    <div class="sop-mi-standard-meta">
                        <span class="sop-mi-standard-brand">品牌：${item.brand}</span>
                        <span class="sop-mi-standard-spec">规格：${item.spec}</span>
                    </div>
                    <div class="sop-mi-standard-antifake">
                        <span class="sop-mi-antifake-label">🔍 防伪验证：</span>
                        <span class="sop-mi-antifake-text">${item.antiFake}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function handleAddMaterialRecord(stepId, toolId) {
        var category = document.getElementById('mi-category').value;
        var name = document.getElementById('mi-name').value.trim();
        var brand = document.getElementById('mi-brand').value.trim();
        var spec = document.getElementById('mi-spec').value.trim();
        var quantity = document.getElementById('mi-quantity').value.trim();
        var date = document.getElementById('mi-date').value;
        var notes = document.getElementById('mi-notes').value.trim();

        if (!name) {
            if (window.Toast && Toast.error) Toast.error('请输入材料名称');
            return;
        }

        var mi = getMaterialInspection();
        var status = 'pending';
        var cat = MATERIAL_CATEGORIES[category];
        if (cat && brand && spec) {
            var matched = cat.standardItems.some(function(item) {
                return item.brand.indexOf(brand) !== -1 || brand.indexOf(item.brand) !== -1;
            });
            status = matched ? 'pass' : 'warning';
        }

        mi.records.push({
            id: 'mi_' + Date.now(),
            category: category,
            name: name,
            brand: brand,
            spec: spec,
            quantity: quantity,
            date: date,
            notes: notes,
            status: status
        });

        saveMaterialInspection();
        if (window.Toast && Toast.success) Toast.success('验收记录已添加');

        var step = getStepById(stepId);
        if (step) {
            aiResultOpen[stepId] = toolId;
            renderCurrentStep();
        }
    }

    function handleCategoryChange() {
        var categorySelect = document.getElementById('mi-category');
        var standardContainer = document.getElementById('mi-standard-items');
        if (categorySelect && standardContainer) {
            standardContainer.innerHTML = renderStandardItems(categorySelect.value);
        }
    }

    function getScheduleTracker() {
        var progress = getProgress();
        if (!progress.scheduleTracker) {
            progress.scheduleTracker = {
                totalDays: 90,
                startDate: null,
                stageDurations: {
                    prep: 15,
                    plumbing: 15,
                    tiling: 20,
                    carpentry: 10,
                    painting: 15,
                    installation: 15
                }
            };
            saveProgress();
        }
        return progress.scheduleTracker;
    }

    function saveScheduleTracker() {
        saveProgress();
    }

    function calculateScheduleData() {
        var st = getScheduleTracker();
        var progress = getProgress();
        var steps = getCurrentModeSteps();
        var totalSteps = steps.length;
        var completedCount = progress.completedSteps ? progress.completedSteps.length : 0;
        var progressPercent = totalSteps > 0 ? (completedCount / totalSteps * 100) : 0;

        var totalDays = parseInt(st.totalDays) || 90;
        var stageDurations = st.stageDurations || {};
        var sd = {
            prep: parseInt(stageDurations.prep) || 15,
            plumbing: parseInt(stageDurations.plumbing) || 15,
            tiling: parseInt(stageDurations.tiling) || 20,
            carpentry: parseInt(stageDurations.carpentry) || 10,
            painting: parseInt(stageDurations.painting) || 15,
            installation: parseInt(stageDurations.installation) || 15
        };

        var startDate = st.startDate ? new Date(st.startDate) : new Date();
        var today = new Date();
        var elapsedDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        elapsedDays = Math.max(0, elapsedDays);

        var expectedProgress = totalDays > 0 ? (elapsedDays / totalDays * 100) : 0;
        expectedProgress = Math.min(100, expectedProgress);

        var isDelayed = progressPercent < expectedProgress - 10;
        var delayDays = 0;
        if (isDelayed) {
            var delayPercent = expectedProgress - progressPercent;
            delayDays = Math.round(delayPercent / 100 * totalDays);
        }

        var predictedEndDate = new Date(startDate);
        predictedEndDate.setDate(predictedEndDate.getDate() + totalDays + delayDays);

        var stages = [
            { key: 'prep', name: '前期准备', days: sd.prep, icon: '📋' },
            { key: 'plumbing', name: '水电工程', days: sd.plumbing, icon: '💧' },
            { key: 'tiling', name: '泥瓦工程', days: sd.tiling, icon: '🧱' },
            { key: 'carpentry', name: '木工工程', days: sd.carpentry, icon: '🪵' },
            { key: 'painting', name: '油漆工程', days: sd.painting, icon: '🎨' },
            { key: 'installation', name: '安装竣工', days: sd.installation, icon: '🏠' }
        ];

        var currentStep = findCurrentStep();
        var currentStageIndex = currentStep ? currentStep.stageIndex : 0;

        var nextTasks = [];
        if (currentStep) {
            var nextStepIdx = steps.findIndex(function(s) { return s.id === currentStep.id; }) + 1;
            for (var i = nextStepIdx; i < Math.min(nextStepIdx + 3, steps.length); i++) {
                if (steps[i]) {
                    nextTasks.push({ name: steps[i].title, step: steps[i].id });
                }
            }
        }

        var keyMilestones = [
            { name: '水电验收', stage: 1, daysOffset: sd.prep + sd.plumbing },
            { name: '泥瓦完工', stage: 2, daysOffset: sd.prep + sd.plumbing + sd.tiling },
            { name: '中期验收', stage: 3, daysOffset: sd.prep + sd.plumbing + sd.tiling + sd.carpentry },
            { name: '竣工验收', stage: 5, daysOffset: totalDays }
        ];

        keyMilestones.forEach(function(m) {
            var mDate = new Date(startDate);
            mDate.setDate(mDate.getDate() + m.daysOffset);
            m.date = mDate;
            m.countdown = Math.ceil((mDate - today) / (1000 * 60 * 60 * 24));
        });

        return {
            totalDays: totalDays,
            startDate: startDate,
            elapsedDays: elapsedDays,
            progressPercent: progressPercent,
            expectedProgress: expectedProgress,
            isDelayed: isDelayed,
            delayDays: delayDays,
            predictedEndDate: predictedEndDate,
            stages: stages,
            currentStageIndex: currentStageIndex,
            nextTasks: nextTasks,
            keyMilestones: keyMilestones
        };
    }

    /* 已迁移至步骤内AI工具卡片
    function renderScheduleTrackerPanel() {
        var data = calculateScheduleData();

        var statusClass = data.isDelayed ? 'delayed' : (data.progressPercent >= 100 ? 'done' : 'normal');
        var statusText = data.isDelayed ? '工期延误' : (data.progressPercent >= 100 ? '已竣工' : '正常进行');

        var stagesHtml = data.stages.map(function(stage, idx) {
            var isCurrent = idx === data.currentStageIndex;
            var isPast = idx < data.currentStageIndex;
            var stageClass = isCurrent ? 'current' : (isPast ? 'past' : 'future');
            return `
                <div class="sop-sched-stage sop-sched-${stageClass}">
                    <div class="sop-sched-stage-icon">${stage.icon}</div>
                    <div class="sop-sched-stage-info">
                        <div class="sop-sched-stage-name">${stage.name}</div>
                        <div class="sop-sched-stage-days">${stage.days}天</div>
                    </div>
                    ${isCurrent ? '<div class="sop-sched-stage-badge">进行中</div>' : ''}
                    ${isPast ? '<div class="sop-sched-stage-check">✓</div>' : ''}
                </div>
            `;
        }).join('');

        var milestonesHtml = data.keyMilestones.map(function(m) {
            var isPast = m.countdown <= 0;
            return `
                <div class="sop-sched-milestone ${isPast ? 'past' : ''}">
                    <div class="sop-sched-milestone-name">${m.name}</div>
                    <div class="sop-sched-milestone-date">${m.date.toLocaleDateString()}</div>
                    <div class="sop-sched-milestone-countdown ${isPast ? 'past' : ''}">
                        ${isPast ? '已完成' : m.countdown + '天后'}
                    </div>
                </div>
            `;
        }).join('');

        var nextTasksHtml = data.nextTasks.length > 0 ? data.nextTasks.map(function(task) {
            return `<div class="sop-sched-next-task">📌 ${task.name}</div>`;
        }).join('') : '<div class="sop-sched-next-task">🎉 恭喜！所有步骤已完成</div>';

        var startDateStr = data.startDate.toISOString().split('T')[0];

        return `
            <div class="sop-sched-panel">
                <div class="sop-sched-header sop-sched-${statusClass}">
                    <div class="sop-sched-header-icon">⏰</div>
                    <div class="sop-sched-header-info">
                        <div class="sop-sched-header-title">AI工期预测与智能提醒</div>
                        <div class="sop-sched-header-status">${statusText}</div>
                    </div>
                </div>

                <div class="sop-sched-settings">
                    <div class="sop-sched-setting-item">
                        <label>开工日期</label>
                        <input type="date" id="sched-start-date" value="${startDateStr}">
                    </div>
                    <div class="sop-sched-setting-item">
                        <label>总工期（天）</label>
                        <input type="number" id="sched-total-days" value="${data.totalDays}" step="1">
                    </div>
                    <button class="sop-sched-update-btn" data-action="update-schedule">更新设置</button>
                </div>

                <div class="sop-sched-summary">
                    <div class="sop-sched-summary-item">
                        <div class="sop-sched-summary-num">${data.elapsedDays}</div>
                        <div class="sop-sched-summary-label">已进行（天）</div>
                    </div>
                    <div class="sop-sched-summary-item">
                        <div class="sop-sched-summary-num">${data.totalDays}</div>
                        <div class="sop-sched-summary-label">总工期（天）</div>
                    </div>
                    <div class="sop-sched-summary-item">
                        <div class="sop-sched-summary-num">${Math.max(0, data.totalDays - data.elapsedDays)}</div>
                        <div class="sop-sched-summary-label">剩余（天）</div>
                    </div>
                </div>

                <div class="sop-sched-progress-section">
                    <div class="sop-sched-progress-info">
                        <span>实际进度：${data.progressPercent.toFixed(1)}%</span>
                        <span>预期进度：${data.expectedProgress.toFixed(1)}%</span>
                    </div>
                    <div class="sop-sched-progress-bar">
                        <div class="sop-sched-progress-actual" style="width: ${Math.min(data.progressPercent, 100)}%"></div>
                        <div class="sop-sched-progress-expected" style="left: ${Math.min(data.expectedProgress, 100)}%"></div>
                    </div>
                    <div class="sop-sched-progress-legend">
                        <span><span class="sop-sched-legend-dot actual"></span> 实际</span>
                        <span><span class="sop-sched-legend-dot expected"></span> 预期</span>
                    </div>
                </div>

                ${data.isDelayed ? `
                    <div class="sop-sched-warning">
                        ⚠️ 工期可能延误约 <strong>${data.delayDays}天</strong>，建议加强进度管理
                    </div>
                ` : ''}

                <div class="sop-sched-prediction">
                    <div class="sop-sched-prediction-label">📅 预测完工日期</div>
                    <div class="sop-sched-prediction-date">${data.predictedEndDate.toLocaleDateString()}</div>
                </div>

                <div class="sop-sched-stages">
                    <div class="sop-sched-section-title">📊 各阶段工期参考</div>
                    <div class="sop-sched-stages-list">
                        ${stagesHtml}
                    </div>
                </div>

                <div class="sop-sched-milestones">
                    <div class="sop-sched-section-title">⏳ 关键节点倒计时</div>
                    <div class="sop-sched-milestones-list">
                        ${milestonesHtml}
                    </div>
                </div>

                <div class="sop-sched-next">
                    <div class="sop-sched-section-title">📋 下一步准备</div>
                    <div class="sop-sched-next-list">
                        ${nextTasksHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function handleUpdateSchedule() {
        var st = getScheduleTracker();
        var startDate = document.getElementById('sched-start-date').value;
        var totalDays = parseInt(document.getElementById('sched-total-days').value);

        if (startDate) st.startDate = startDate;
        if (!isNaN(totalDays) && totalDays > 0) st.totalDays = totalDays;

        saveScheduleTracker();
        if (window.Toast && Toast.success) Toast.success('工期设置已更新');

        var bodyEl = document.querySelector('.sop-ai-result-content');
        if (bodyEl) {
            bodyEl.innerHTML = renderScheduleTrackerPanel();
            bindScheduleEvents();
        }
    }

    function bindScheduleEvents() {
        var updateBtn = document.querySelector('[data-action="update-schedule"]');
        if (updateBtn) {
            updateBtn.onclick = handleUpdateSchedule;
        }
    }
    */

    function getFinalSettlement() {
        var progress = getProgress();
        if (!progress.finalSettlement) {
            progress.finalSettlement = {
                contractPrice: 0,
                addons: [],
                deductions: [],
                payments: [],
                issues: []
            };
            saveProgress();
        }
        return progress.finalSettlement;
    }

    function saveFinalSettlement() {
        saveProgress();
    }

    var COMMON_SETTLEMENT_ISSUES = [
        { type: 'duplicate', name: '重复计费', desc: '同一项目在多处重复收费，如某区域贴砖既算面积又算项', check: '核对工程量清单，检查是否有重复计算的项目' },
        { type: 'unreasonable', name: '不合理收费', desc: '收费项目与合同约定不符或单价明显偏高', check: '对比合同报价单，对单价差异大的项目提出质疑' },
        { type: 'inflated', name: '工程量虚高', desc: '实际工程量远小于结算工程量', check: '现场复核主要项目工程量，如贴砖面积、吊顶长度等' },
        { type: 'undone', name: '未做项目收费', desc: '实际未施工的项目仍然计费', check: '逐项核对已完成项目，未做项目应扣除' },
        { type: 'material', name: '材料以次充好', desc: '实际使用材料品牌规格低于合同约定', check: '核对进场材料验收记录与合同约定是否一致' }
    ];

    function calculateSettlement() {
        var fs = getFinalSettlement();
        var contractPrice = parseFloat(fs.contractPrice) || 0;
        var addonTotal = fs.addons.reduce(function(sum, a) { return sum + (parseFloat(a.amount) || 0); }, 0);
        var deductionTotal = fs.deductions.reduce(function(sum, d) { return sum + (parseFloat(d.amount) || 0); }, 0);
        var paymentTotal = fs.payments.reduce(function(sum, p) { return sum + (parseFloat(p.amount) || 0); }, 0);
        var finalPrice = contractPrice + addonTotal - deductionTotal;
        var balance = finalPrice - paymentTotal;

        var issues = [];
        if (addonTotal > contractPrice * 0.1) {
            issues.push({ type: 'warning', text: '增项金额超过合同价10%，建议核实增项必要性' });
        }
        if (fs.payments.length > 0 && paymentTotal > finalPrice) {
            issues.push({ type: 'error', text: '已付款超过总结算价，请核对应退金额' });
        }
        if (contractPrice > 0 && addonTotal === 0 && deductionTotal === 0) {
            issues.push({ type: 'info', text: '暂无增项减项，建议仔细核对结算明细' });
        }

        var warrantyItems = [
            { name: '水电防水工程', period: '5年', from: '竣工验收之日', desc: '含给排水、强弱电、防水工程' },
            { name: '基础装修工程', period: '2年', from: '竣工验收之日', desc: '含泥瓦、木工、油漆等基础工程' },
            { name: '定制家具', period: '5年', from: '安装验收之日', desc: '以商家承诺为准，索取质保卡' },
            { name: '家电产品', period: '1-3年', from: '购买之日', desc: '以品牌官方保修政策为准' }
        ];

        return {
            contractPrice: contractPrice,
            addonTotal: addonTotal,
            deductionTotal: deductionTotal,
            paymentTotal: paymentTotal,
            finalPrice: finalPrice,
            balance: balance,
            issues: issues,
            warrantyItems: warrantyItems
        };
    }

    function renderFinalSettlementPanel() {
        var data = calculateSettlement();
        var fs = getFinalSettlement();

        var addonsHtml = fs.addons.length > 0 ? fs.addons.map(function(a, idx) {
            return `
                <div class="sop-settle-item">
                    <div class="sop-settle-item-name">${a.name || '增项' + (idx + 1)}</div>
                    <div class="sop-settle-item-amount positive">+¥${formatMoney(a.amount || 0)}</div>
                    ${a.reason ? '<div class="sop-settle-item-reason">原因：' + a.reason + '</div>' : ''}
                </div>
            `;
        }).join('') : '<div class="sop-settle-empty">暂无增项记录</div>';

        var deductionsHtml = fs.deductions.length > 0 ? fs.deductions.map(function(d, idx) {
            return `
                <div class="sop-settle-item">
                    <div class="sop-settle-item-name">${d.name || '减项' + (idx + 1)}</div>
                    <div class="sop-settle-item-amount negative">-¥${formatMoney(d.amount || 0)}</div>
                    ${d.reason ? '<div class="sop-settle-item-reason">原因：' + d.reason + '</div>' : ''}
                </div>
            `;
        }).join('') : '<div class="sop-settle-empty">暂无减项记录</div>';

        var paymentsHtml = fs.payments.length > 0 ? fs.payments.map(function(p, idx) {
            return `
                <div class="sop-settle-item">
                    <div class="sop-settle-item-name">${p.name || '付款' + (idx + 1)}</div>
                    <div class="sop-settle-item-amount">-¥${formatMoney(p.amount || 0)}</div>
                    <div class="sop-settle-item-reason">日期：${p.date || '-'}</div>
                </div>
            `;
        }).join('') : '<div class="sop-settle-empty">暂无付款记录</div>';

        var issuesHtml = data.issues.length > 0 ? data.issues.map(function(issue) {
            var icon = issue.type === 'error' ? '❌' : (issue.type === 'warning' ? '⚠️' : '💡');
            return `<div class="sop-settle-issue sop-settle-issue-${issue.type}">${icon} ${issue.text}</div>`;
        }).join('') : '<div class="sop-settle-empty">未发现明显问题</div>';

        var commonIssuesHtml = COMMON_SETTLEMENT_ISSUES.map(function(issue) {
            return `
                <div class="sop-settle-common-issue">
                    <div class="sop-settle-common-issue-title">🔍 ${issue.name}</div>
                    <div class="sop-settle-common-issue-desc">${issue.desc}</div>
                    <div class="sop-settle-common-issue-check">💡 检查方法：${issue.check}</div>
                </div>
            `;
        }).join('');

        var warrantyHtml = data.warrantyItems.map(function(item) {
            return `
                <div class="sop-settle-warranty-item">
                    <div class="sop-settle-warranty-name">🛡️ ${item.name}</div>
                    <div class="sop-settle-warranty-period">质保期：${item.period}</div>
                    <div class="sop-settle-warranty-from">起算：${item.from}</div>
                    <div class="sop-settle-warranty-desc">${item.desc}</div>
                </div>
            `;
        }).join('');

        var balanceClass = data.balance > 0 ? 'positive' : (data.balance < 0 ? 'negative' : 'zero');
        var balanceText = data.balance > 0 ? '应付尾款' : (data.balance < 0 ? '应退款项' : '账款两清');

        var summaryText = `结算对账单\n\n` +
            `合同价：¥${formatMoney(data.contractPrice)}\n` +
            `增项合计：+¥${formatMoney(data.addonTotal)}\n` +
            `减项合计：-¥${formatMoney(data.deductionTotal)}\n` +
            `——————————\n` +
            `总结算价：¥${formatMoney(data.finalPrice)}\n\n` +
            `已付款合计：¥${formatMoney(data.paymentTotal)}\n` +
            `${balanceText}：${data.balance >= 0 ? '' : '-'}¥${formatMoney(Math.abs(data.balance))}\n\n` +
            `—— 此对账单由AI生成，仅供参考 ——`;

        return `
            <div class="sop-settle-panel">
                <div class="sop-settle-header">
                    <div class="sop-settle-header-icon">📋</div>
                    <div class="sop-settle-header-info">
                        <div class="sop-settle-header-title">AI竣工结算智能对账</div>
                        <div class="sop-settle-header-subtitle">自动计算结算价，识别常见结算问题</div>
                    </div>
                </div>

                <div class="sop-settle-contract">
                    <div class="sop-settle-section-title">📝 合同信息</div>
                    <div class="sop-settle-contract-input">
                        <label>合同总价（元）</label>
                        <input type="number" id="settle-contract-price" value="${data.contractPrice || ''}" placeholder="请输入合同总价">
                        <button class="sop-settle-update-btn" data-action="update-contract-price">更新</button>
                    </div>
                </div>

                <div class="sop-settle-summary">
                    <div class="sop-settle-summary-row">
                        <span>合同价</span>
                        <span>¥${formatMoney(data.contractPrice)}</span>
                    </div>
                    <div class="sop-settle-summary-row">
                        <span>增项合计</span>
                        <span class="positive">+¥${formatMoney(data.addonTotal)}</span>
                    </div>
                    <div class="sop-settle-summary-row">
                        <span>减项合计</span>
                        <span class="negative">-¥${formatMoney(data.deductionTotal)}</span>
                    </div>
                    <div class="sop-settle-summary-row total">
                        <span>总结算价</span>
                        <span>¥${formatMoney(data.finalPrice)}</span>
                    </div>
                    <div class="sop-settle-summary-row">
                        <span>已付款</span>
                        <span>-¥${formatMoney(data.paymentTotal)}</span>
                    </div>
                    <div class="sop-settle-summary-row balance">
                        <span>${balanceText}</span>
                        <span class="${balanceClass}">${data.balance >= 0 ? '' : '-'}¥${formatMoney(Math.abs(data.balance))}</span>
                    </div>
                </div>

                <div class="sop-settle-tabs">
                    <button class="sop-settle-tab active" data-settle-tab="addons">增项 (${fs.addons.length})</button>
                    <button class="sop-settle-tab" data-settle-tab="deductions">减项 (${fs.deductions.length})</button>
                    <button class="sop-settle-tab" data-settle-tab="payments">付款 (${fs.payments.length})</button>
                </div>

                <div class="sop-settle-tab-content" data-settle-tab-content="addons">
                    <button class="sop-settle-add-btn" data-action="add-settle-addon">+ 添加增项</button>
                    <div class="sop-settle-list">${addonsHtml}</div>
                </div>

                <div class="sop-settle-tab-content" data-settle-tab-content="deductions" style="display:none">
                    <button class="sop-settle-add-btn" data-action="add-settle-deduction">+ 添加减项</button>
                    <div class="sop-settle-list">${deductionsHtml}</div>
                </div>

                <div class="sop-settle-tab-content" data-settle-tab-content="payments" style="display:none">
                    <button class="sop-settle-add-btn" data-action="add-settle-payment">+ 添加付款</button>
                    <div class="sop-settle-list">${paymentsHtml}</div>
                </div>

                <div class="sop-settle-issues">
                    <div class="sop-settle-section-title">🔍 AI智能问题识别</div>
                    <div class="sop-settle-issues-list">${issuesHtml}</div>
                </div>

                <div class="sop-settle-common-issues">
                    <div class="sop-settle-section-title">📋 5类常见结算问题</div>
                    <div class="sop-settle-common-issues-list">${commonIssuesHtml}</div>
                </div>

                <div class="sop-settle-warranty">
                    <div class="sop-settle-section-title">🛡️ 质保期限计算</div>
                    <div class="sop-settle-warranty-list">${warrantyHtml}</div>
                </div>

                <div class="sop-settle-actions">
                    <button class="sop-settle-copy-btn" data-action="copy-settlement" data-text="${encodeURIComponent(summaryText)}">
                        📋 复制结算对账单
                    </button>
                </div>
            </div>
        `;
    }

    function handleUpdateContractPrice() {
        var price = parseFloat(document.getElementById('settle-contract-price').value);
        if (isNaN(price) || price <= 0) {
            if (window.Toast && Toast.error) Toast.error('请输入有效的合同价格');
            return;
        }
        var fs = getFinalSettlement();
        fs.contractPrice = price;
        saveFinalSettlement();
        if (window.Toast && Toast.success) Toast.success('合同价已更新');
        refreshSettlementPanel();
    }

    function handleAddSettleItem(type) {
        var title = type === 'addon' ? '添加增项' : (type === 'deduction' ? '添加减项' : '添加付款');
        var name = prompt(title + '名称：');
        if (!name) return;
        var amountStr = prompt(title + '金额（元）：');
        var amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            if (window.Toast && Toast.error) Toast.error('请输入有效金额');
            return;
        }
        var reason = prompt('备注/原因（可选）：') || '';

        var fs = getFinalSettlement();
        var item = {
            id: type + '_' + Date.now(),
            name: name,
            amount: amount,
            reason: reason
        };
        if (type === 'payment') {
            item.date = new Date().toISOString().split('T')[0];
        }

        if (type === 'addon') fs.addons.push(item);
        else if (type === 'deduction') fs.deductions.push(item);
        else fs.payments.push(item);

        saveFinalSettlement();
        if (window.Toast && Toast.success) Toast.success('添加成功');
        refreshSettlementPanel();
    }

    function refreshSettlementPanel() {
        var bodyEl = document.querySelector('.sop-ai-result-content');
        if (bodyEl) {
            bodyEl.innerHTML = renderFinalSettlementPanel();
            bindSettlementEvents();
        }
    }

    function handleCopySettlement(textEncoded) {
        var text = decodeURIComponent(textEncoded);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                if (window.Toast && Toast.success) Toast.success('对账单已复制到剪贴板');
            }).catch(function() {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            if (window.Toast && Toast.success) Toast.success('对账单已复制');
        } catch (e) {
            if (window.Toast && Toast.error) Toast.error('复制失败，请手动复制');
        }
        document.body.removeChild(textarea);
    }

    function bindSettlementEvents() {
        var updatePriceBtn = document.querySelector('[data-action="update-contract-price"]');
        if (updatePriceBtn) updatePriceBtn.addEventListener('click', handleUpdateContractPrice);

        var addAddonBtn = document.querySelector('[data-action="add-settle-addon"]');
        if (addAddonBtn) addAddonBtn.addEventListener('click', function() { handleAddSettleItem('addon'); });

        var addDeductionBtn = document.querySelector('[data-action="add-settle-deduction"]');
        if (addDeductionBtn) addDeductionBtn.addEventListener('click', function() { handleAddSettleItem('deduction'); });

        var addPaymentBtn = document.querySelector('[data-action="add-settle-payment"]');
        if (addPaymentBtn) addPaymentBtn.addEventListener('click', function() { handleAddSettleItem('payment'); });

        var copyBtn = document.querySelector('[data-action="copy-settlement"]');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var text = this.getAttribute('data-text');
                handleCopySettlement(text);
            });
        }

        var tabs = document.querySelectorAll('.sop-settle-tab');
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var tabName = this.getAttribute('data-settle-tab');
                tabs.forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                var contents = document.querySelectorAll('[data-settle-tab-content]');
                contents.forEach(function(c) { c.style.display = 'none'; });
                var target = document.querySelector('[data-settle-tab-content="' + tabName + '"]');
                if (target) target.style.display = 'block';
            });
        });
    }

    function getAirQuality() {
        var progress = getProgress();
        if (!progress.airQuality) {
            progress.airQuality = {
                area: 100,
                level: 'medium',
                materials: 'standard',
                furnitureCount: 5
            };
            saveProgress();
        }
        return progress.airQuality;
    }

    function saveAirQuality() {
        saveProgress();
    }

    function calculateAirQuality() {
        var aq = getAirQuality();
        var area = aq.area || 100;
        var level = aq.level || 'medium';
        var materials = aq.materials || 'standard';
        var furnitureCount = aq.furnitureCount || 5;

        var baseScore = { low: 30, medium: 60, high: 85 }[level] || 60;

        var materialFactor = { standard: 1.0, eco: 0.6, premium: 0.4 }[materials] || 1.0;
        var furnitureFactor = 1 + (furnitureCount - 5) * 0.05;
        var areaFactor = area > 100 ? 0.9 : 1.0;

        var finalScore = Math.round(baseScore * materialFactor * furnitureFactor * areaFactor);
        finalScore = Math.max(10, Math.min(95, finalScore));

        var severity = finalScore >= 70 ? 'severe' : (finalScore >= 40 ? 'moderate' : 'mild');
        var severityText = { severe: '重度污染风险', moderate: '中度污染风险', mild: '轻度污染风险' }[severity];

        var ventilationMonths = { severe: 12, moderate: 6, mild: 3 }[severity];

        var plants = [
            { name: '绿萝', effect: '甲醛净化', difficulty: '易养护', icon: '🌿' },
            { name: '虎皮兰', effect: '夜间释氧', difficulty: '易养护', icon: '🌱' },
            { name: '常春藤', effect: '苯系物净化', difficulty: '中等', icon: '🍀' },
            { name: '龟背竹', effect: '甲醛+TVOC', difficulty: '中等', icon: '🌴' },
            { name: '吊兰', effect: '多种有害气体', difficulty: '易养护', icon: '🌾' }
        ];

        var purifierAdvice = {
            severe: '建议选购CADR值≥400m³/h的空气净化器，带活性炭滤网+HEPA滤网，24小时开启',
            moderate: '建议选购CADR值≥300m³/h的空气净化器，白天开启，夜间低档运行',
            mild: '可选购小型空气净化器辅助，或采用自然通风为主'
        }[severity];

        var serviceAdvice = {
            severe: '强烈建议聘请专业除醛公司进行治理，选择有CMA资质的机构',
            moderate: '可考虑专业除醛服务，重点处理定制家具区域',
            mild: '以通风和绿植为主，必要时可自行购买除醛产品'
        }[severity];

        var cmaPoints = Math.ceil(area / 50);
        cmaPoints = Math.max(1, Math.min(5, cmaPoints));

        return {
            score: finalScore,
            severity: severity,
            severityText: severityText,
            ventilationMonths: ventilationMonths,
            plants: plants,
            purifierAdvice: purifierAdvice,
            serviceAdvice: serviceAdvice,
            cmaPoints: cmaPoints,
            area: area,
            level: level,
            materials: materials,
            furnitureCount: furnitureCount
        };
    }

    function renderAirQualityPanel() {
        var data = calculateAirQuality();
        var aq = getAirQuality();

        var colorMap = {
            mild: { color: '#2e7d32', bg: 'rgba(46, 125, 50, 0.1)' },
            moderate: { color: '#f57c00', bg: 'rgba(245, 124, 0, 0.1)' },
            severe: { color: '#c62828', bg: 'rgba(198, 40, 40, 0.1)' }
        };
        var colors = colorMap[data.severity];

        var plantsHtml = data.plants.map(function(plant) {
            return `
                <div class="sop-aq-plant">
                    <div class="sop-aq-plant-icon">${plant.icon}</div>
                    <div class="sop-aq-plant-name">${plant.name}</div>
                    <div class="sop-aq-plant-effect">${plant.effect}</div>
                    <div class="sop-aq-plant-difficulty">${plant.difficulty}</div>
                </div>
            `;
        }).join('');

        return `
            <div class="sop-aq-panel">
                <div class="sop-aq-header" style="background: ${colors.bg}">
                    <div class="sop-aq-header-icon">🌬️</div>
                    <div class="sop-aq-header-info">
                        <div class="sop-aq-header-title">AI全屋空气质量评估</div>
                        <div class="sop-aq-header-subtitle">基于装修参数的甲醛/VOC污染风险估算</div>
                    </div>
                </div>

                <div class="sop-aq-disclaimer">
                    ⚠️ <strong>AI估算仅供参考，以实际检测为准</strong>。本评估基于常见装修材料和经验数据，
                    实际空气质量受材料批次、施工工艺、通风条件等多种因素影响，
                    建议入住前请CMA认证机构进行专业检测。
                </div>

                <div class="sop-aq-form">
                    <div class="sop-aq-form-title">🏠 房屋信息</div>
                    <div class="sop-aq-form-row">
                        <div class="sop-aq-form-item">
                            <label>房屋面积（㎡）</label>
                            <input type="number" id="aq-area" value="${data.area}" step="0.01">
                        </div>
                        <div class="sop-aq-form-item">
                            <label>主要材料类型</label>
                            <select id="aq-materials">
                                <option value="standard" ${data.materials === 'standard' ? 'selected' : ''}>普通标准</option>
                                <option value="eco" ${data.materials === 'eco' ? 'selected' : ''}>环保级</option>
                                <option value="premium" ${data.materials === 'premium' ? 'selected' : ''}>高端进口</option>
                            </select>
                        </div>
                    </div>
                    <div class="sop-aq-form-row">
                        <div class="sop-aq-form-item">
                            <label>装修档次</label>
                            <select id="aq-level">
                                <option value="low" ${data.level === 'low' ? 'selected' : ''}>简装（少量定制）</option>
                                <option value="medium" ${data.level === 'medium' ? 'selected' : ''}>精装（中等定制）</option>
                                <option value="high" ${data.level === 'high' ? 'selected' : ''}>豪装（大量定制）</option>
                            </select>
                        </div>
                        <div class="sop-aq-form-item">
                            <label>家具数量（件）</label>
                            <input type="number" id="aq-furniture" value="${data.furnitureCount}" step="1">
                        </div>
                    </div>
                    <button class="sop-aq-calc-btn" data-action="calc-air-quality">🔄 重新评估</button>
                </div>

                <div class="sop-aq-result">
                    <div class="sop-aq-score-section">
                        <div class="sop-aq-score-ring" style="background: conic-gradient(${colors.color} ${data.score}%, #e0e0e0 0%)">
                            <div class="sop-aq-score-inner">
                                <div class="sop-aq-score-num" style="color: ${colors.color}">${data.score}</div>
                                <div class="sop-aq-score-label">污染指数</div>
                            </div>
                        </div>
                        <div class="sop-aq-severity" style="color: ${colors.color}; background: ${colors.bg}">
                            ${data.severityText}
                        </div>
                    </div>
                </div>

                <div class="sop-aq-ventilation">
                    <div class="sop-aq-section-title">⏱️ 建议通风周期</div>
                    <div class="sop-aq-ventilation-box" style="border-color: ${colors.color}; background: ${colors.bg}">
                        <span class="sop-aq-ventilation-months">${data.ventilationMonths}个月</span>
                        <span class="sop-aq-ventilation-text">建议至少通风 ${data.ventilationMonths} 个月后入住</span>
                    </div>
                </div>

                <div class="sop-aq-plants">
                    <div class="sop-aq-section-title">🌿 绿植推荐</div>
                    <div class="sop-aq-plants-grid">
                        ${plantsHtml}
                    </div>
                </div>

                <div class="sop-aq-advice">
                    <div class="sop-aq-section-title">💨 空气净化器选型建议</div>
                    <div class="sop-aq-advice-text">${data.purifierAdvice}</div>
                </div>

                <div class="sop-aq-advice">
                    <div class="sop-aq-section-title">🏭 除醛服务建议</div>
                    <div class="sop-aq-advice-text">${data.serviceAdvice}</div>
                </div>

                <div class="sop-aq-cma">
                    <div class="sop-aq-section-title">🔬 CMA检测提醒</div>
                    <div class="sop-aq-cma-content">
                        <div class="sop-aq-cma-item">
                            <span class="sop-aq-cma-label">📍 建议检测点位：</span>
                            <span class="sop-aq-cma-value">${data.cmaPoints}个点（每50㎡一个点）</span>
                        </div>
                        <div class="sop-aq-cma-item">
                            <span class="sop-aq-cma-label">🗓️ 检测时机：</span>
                            <span class="sop-aq-cma-value">装修完工通风7天后，关闭门窗12小时以上检测</span>
                        </div>
                        <div class="sop-aq-cma-item">
                            <span class="sop-aq-cma-label">✅ 检测项目：</span>
                            <span class="sop-aq-cma-value">甲醛、苯、TVOC、氨、氡</span>
                        </div>
                        <div class="sop-aq-cma-item">
                            <span class="sop-aq-cma-label">🏢 机构选择：</span>
                            <span class="sop-aq-cma-value">选择具有CMA资质的第三方检测机构</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function handleCalcAirQuality() {
        var aq = getAirQuality();
        aq.area = parseFloat(document.getElementById('aq-area').value) || 100;
        aq.materials = document.getElementById('aq-materials').value;
        aq.level = document.getElementById('aq-level').value;
        aq.furnitureCount = parseInt(document.getElementById('aq-furniture').value) || 5;
        saveAirQuality();
        if (window.Toast && Toast.success) Toast.success('评估已更新');
        refreshAirQualityPanel();
    }

    function refreshAirQualityPanel() {
        var bodyEl = document.querySelector('.sop-ai-result-content');
        if (bodyEl) {
            bodyEl.innerHTML = renderAirQualityPanel();
            bindAirQualityEvents();
        }
    }

    function bindAirQualityEvents() {
        var calcBtn = document.querySelector('[data-action="calc-air-quality"]');
        if (calcBtn) calcBtn.addEventListener('click', handleCalcAirQuality);
    }

    // 已迁移至步骤内AI工具卡片
    // var scheduleTrackerOpen = false;

    /* 已迁移至步骤内AI工具卡片
    function openScheduleTracker() {
        if (scheduleTrackerOpen) return;
        scheduleTrackerOpen = true;

        var overlay = document.getElementById('sop-sched-overlay');
        var panel = document.getElementById('sop-sched-panel');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'sop-sched-overlay';
            overlay.className = 'sop-sched-overlay';
            document.body.appendChild(overlay);
        }

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'sop-sched-panel';
            panel.className = 'sop-sched-panel-outer';
            panel.innerHTML = `
                <div class="sop-budget-panel-header" style="background: linear-gradient(135deg, #e65100 0%, #f57c00 100%);">
                    <div class="sop-budget-header-title" style="color: white;">
                        <span style="margin-right: 8px;">⏰</span>工期预测
                    </div>
                    <button class="sop-budget-close-btn" id="sop-sched-close" style="color: white;">×</button>
                </div>
                <div class="sop-budget-body" id="sop-sched-body"></div>
            `;
            document.body.appendChild(panel);
        }

        document.getElementById('sop-sched-body').innerHTML = renderScheduleTrackerPanel();

        setTimeout(function() {
            overlay.classList.add('active');
            panel.classList.add('open');
        }, 10);

        bindScheduleTrackerEvents();
    }

    function closeScheduleTracker() {
        if (!scheduleTrackerOpen) return;
        scheduleTrackerOpen = false;

        var overlay = document.getElementById('sop-sched-overlay');
        var panel = document.getElementById('sop-sched-panel');

        if (overlay) overlay.classList.remove('active');
        if (panel) panel.classList.remove('open');
    }

    function bindScheduleTrackerEvents() {
        var overlay = document.getElementById('sop-sched-overlay');
        var closeBtn = document.getElementById('sop-sched-close');

        if (overlay) {
            overlay.onclick = function(e) {
                if (e.target === overlay) closeScheduleTracker();
            };
        }
        if (closeBtn) {
            closeBtn.onclick = closeScheduleTracker;
        }
        bindScheduleEvents();
    }
    */

    function safeGotoStep(stepId) {
        try {
            gotoStep(stepId);
        } catch (e) {
            console.error('[SopView] gotoStep error:', e);
            if (window.Toast && Toast.error) {
                Toast.error('跳转步骤失败');
            }
        }
    }

    return {


        render: safeRender,


        init: safeInit,


        destroy: destroy,


        viewEnter: safeViewEnter,


        gotoStep: safeGotoStep,


        get _STEPS() { return getCurrentModeSteps(); },


        get _STAGES() { return getCurrentModeStages(); }


    };
})();


