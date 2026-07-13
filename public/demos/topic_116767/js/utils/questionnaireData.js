/**
 * 装修需求AI采集题库数据
 * 基于「装修需求AI采集题库_终版.md」
 */

var QUESTIONNAIRE_DATA = {
    // ========== 阶段一：前置评估层 ==========

    // 2.1 房屋基础信息
    houseBasic: {
        name: '房屋基础信息',
        questions: [
            // ========== 第一步：AI户型识别 + 人工校验 ==========
            {
                id: 'aiRecognitionIntro',
                question: '第一步：AI户型识别 + 人工校验',
                type: 'ai-recognition-intro',
                hint: '请上传您的户型图，我将自动识别房屋信息：建筑面积、套内面积、户型格局、墙体分布、门窗位置等。'
            },
            {
                id: 'aiRecognitionResult',
                question: '【AI户型识别结果】请人工校验以下信息是否准确：',
                type: 'ai-recognition-result',
                inputs: [
                    { id: 'buildingArea', label: '建筑面积', placeholder: '如：89', suffix: '㎡' },
                    { id: 'usableArea', label: '套内面积', placeholder: '如：72', suffix: '㎡' },
                    { id: 'layout', label: '户型格局', placeholder: '如：3室2厅2卫' },
                    { id: 'orientation', label: '房屋朝向', placeholder: '如：南北通透' },
                    { id: 'netHeight', label: '室内净层高', placeholder: '如：2.8', suffix: 'm' }
                ],
                recognitionData: {
                    buildingArea: '',
                    usableArea: '',
                    layout: '',
                    wallStructure: '',
                    doorWindow: '',
                    fluePipe: '',
                    sunkenArea: '',
                    orientation: '',
                    balconyLoggia: ''
                }
            },
            // ========== 房屋基本信息确认 ==========
            {
                id: 'houseType',
                question: '您的房屋性质是？',
                type: 'single',
                options: [
                    { id: 'normal', text: '普通住宅（70年产权，通燃气）' },
                    { id: 'apartment', text: '商住公寓（不通燃气，商水商电，40年产权）' },
                    { id: 'loft', text: 'LOFT/复式' }
                ]
            },
            {
                id: 'houseStatus',
                question: '您的房屋当前状态是？',
                type: 'single',
                extraQuestions: [
                    {
                        id: 'oldHouseElectric',
                        question: '水电计划怎么改？',
                        type: 'single',
                        options: [
                            { id: 'full', text: '全屋全换（推荐）' },
                            { id: 'partial', text: '局部改造' },
                            { id: 'keep', text: '保留不动' }
                        ]
                    },
                    {
                        id: 'oldHouseWindow',
                        question: '窗户是否更换？',
                        type: 'single',
                        options: [
                            { id: 'all', text: '全部更换' },
                            { id: 'part', text: '部分更换' },
                            { id: 'no', text: '不换' }
                        ]
                    },
                    {
                        id: 'oldHouseWall',
                        question: '墙面基层是否铲除到红砖？',
                        type: 'single',
                        options: [
                            { id: 'yes', text: '是' },
                            { id: 'partial', text: '只铲腻子层' },
                            { id: 'no', text: '不铲除' }
                        ]
                    }
                ],
                options: [
                    { id: 'rough', text: '全新毛坯房' },
                    { id: 'hardcover', text: '精装房全改' },
                    { id: 'old', text: '老房翻新（房龄10年以上）', trigger: 'showExtra' },
                    { id: 'partial', text: '局部改造' }
                ]
            },
            {
                id: 'houseHeight',
                question: '室内净层高约为？',
                type: 'single',
                options: [
                    { id: 'low', text: '2.7m及以下' },
                    { id: 'normal', text: '2.7-2.8m' },
                    { id: 'good', text: '2.8-2.9m' },
                    { id: 'high', text: '2.9m以上' }
                ]
            },
            {
                id: 'propertyRestrictions',
                question: '小区物业是否有以下限制？（可多选）',
                type: 'multi',
                options: [
                    { id: 'no_balcony', text: '不允许封阳台' },
                    { id: 'no_facade', text: '不允许改动外立面' },
                    { id: 'fixed_ac', text: '外机位固定，无法装中央空调' },
                    { id: 'time_limit', text: '施工时间严格受限' },
                    { id: 'none', text: '无以上限制' }
                ]
            },
            {
                id: 'houseDefects',
                question: '房屋现有哪些硬伤，希望通过装修改善？（可多选）',
                type: 'multi',
                options: [
                    { id: 'noise', text: '临街/临电梯，噪音大，需做隔音处理' },
                    { id: 'dark', text: '采光差，希望通过设计提亮空间' },
                    { id: 'ventilation', text: '通风差，需辅助通风/新风系统' },
                    { id: 'dark_kitchen', text: '暗卫/暗厨，需优化采光通风' },
                    { id: 'structure', text: '结构问题（墙体开裂、楼板沉降等）' },
                    { id: 'none', text: '暂无明显硬伤' }
                ]
            },
            {
                id: 'electricMeter',
                question: '入户电表容量约为？',
                type: 'single',
                options: [
                    { id: 'unknown', text: '不清楚（建议后续联系物业确认）' },
                    { id: 'small', text: '40A及以下（老房常见，大功率设备受限）' },
                    { id: 'medium', text: '60A' },
                    { id: 'large', text: '80A及以上' }
                ]
            },
            {
                id: 'entranceDoor',
                question: '入户门及搬运通道尺寸是否清楚？',
                type: 'single',
                options: [
                    { id: 'normal', text: '入户门宽度 ≥ 80cm，大型家具可正常进入' },
                    { id: 'narrow', text: '入户门较窄（< 80cm）或楼道转角局促，大型家具搬运困难' },
                    { id: 'unknown', text: '不清楚' }
                ]
            }
        ]
    },

    // 2.2 装修模式智能适配评估（7题，归一化加权评分）
    modeEvaluation: {
        name: '装修模式适配评估',
        questions: [
            {
                id: 'eval_time',
                question: '您每周能投入到装修对接、跑工地、采购材料的有效时间大概是？',
                type: 'single',
                weight: 25,
                options: [
                    { id: 'A', text: '工作日可随时到场，周末全天可投入（≥15小时）' },
                    { id: 'B', text: '周末有1-2天整块时间，工作日可线上对接（5-15小时）' },
                    { id: 'C', text: '只有周末少量时间，工作日基本没空（＜5小时）' }
                ]
            },
            {
                id: 'eval_knowledge',
                question: '您目前对装修流程、材料、工艺的了解程度是？',
                type: 'single',
                weight: 25,
                options: [
                    { id: 'A', text: '做过系统功课，清楚水电、防水等核心工序标准，能区分材料好坏' },
                    { id: 'B', text: '了解基础概念，能区分主材/辅材，看得懂基础报价单' },
                    { id: 'C', text: '完全新手，对装修流程、材料差异基本不了解' }
                ]
            },
            {
                id: 'eval_budget',
                question: '关于装修预算，您的想法更接近？',
                type: 'single',
                weight: 15,
                options: [
                    { id: 'A', text: '想极致控本，愿意花时间比价砍价，追求性价比最大化' },
                    { id: 'B', text: '有明确预算区间，希望核心主材自己把控档次，施工交给专业团队' },
                    { id: 'C', text: '希望总价固定、少增项，接受合理服务溢价，优先保证省心' }
                ]
            },
            {
                id: 'eval_effort',
                question: '您对装修过程的繁琐程度接受度如何？',
                type: 'single',
                weight: 15,
                options: [
                    { id: 'A', text: '不怕麻烦，自己对接各个环节更放心，能接受多方沟通成本' },
                    { id: 'B', text: '核心环节自己把控，基础施工交给施工方，不用事事亲力亲为' },
                    { id: 'C', text: '希望有统一负责人，出问题只找一方，尽量少介入细节' }
                ]
            },
            {
                id: 'eval_quality',
                question: '您对装修的个性化定制、材料工艺的要求程度是？',
                type: 'single',
                weight: 10,
                options: [
                    { id: 'A', text: '要求很高，每一种材料、每一处工艺细节都想自己选定、全程把控' },
                    { id: 'B', text: '有一定要求，主材和设计效果自己定，基础施工按国标执行即可' },
                    { id: 'C', text: '整体效果达标、材料靠谱就行，不需要极致个性化定制' }
                ]
            },
            {
                id: 'eval_afterSale',
                question: '您更在意售后责任的哪一点？',
                type: 'single',
                weight: 10,
                options: [
                    { id: 'A', text: '不在意多方对接，各品类材料自己找品牌售后也可以接受' },
                    { id: 'B', text: '施工问题找施工方，主材问题找商家，分开对接也能接受' },
                    { id: 'C', text: '希望整体装修有统一质保，出问题一家全权负责，责任清晰不扯皮' }
                ]
            },
            {
                id: 'eval_risk',
                question: '如果装修中出现施工失误、材料选错等问题，造成几千元的损失，您的接受度是？',
                type: 'single',
                weight: 10,
                options: [
                    { id: 'A', text: '可以接受，自己选择的自己承担' },
                    { id: 'B', text: '少量可以接受，损失太大不行' },
                    { id: 'C', text: '不太能接受，希望风险主要由施工方承担' }
                ]
            }
        ]
    },

    // ========== 阶段二：通用核心需求层 ==========

    // 3.1 家庭居住画像
    familyProfile: {
        name: '家庭居住画像',
        questions: [
            {
                id: 'familyMembers',
                question: '您家常住人口有几位？（可多选）',
                type: 'multi',
                extraBranches: {
                    elder: {
                        id: 'elderlyNeeds',
                        question: '以下适老化需求，哪些是必须的？（可多选）',
                        type: 'multi',
                        options: [
                            { id: 'threshold_free', text: '全屋无高差门槛（≤15mm），方便轮椅/助行器通行' },
                            { id: 'grab_bar', text: '卫生间安装安全扶手（便器/洗浴器旁应设扶手）' },
                            { id: 'night_light', text: '全屋起夜感应灯（卧室照度≥150lx，开关高度降至80-90cm）' },
                            { id: 'non_slip', text: '防滑地面处理（踏步高度≤150mm，宽度≥300mm，边缘装防滑条）' },
                            { id: 'bed_rail', text: '床边双侧扶手 + 紧急呼叫器预留' },
                            { id: 'none', text: '暂不需要特殊配置' }
                        ]
                    },
                    pregnant: {
                        id: 'maternityNeeds',
                        question: '母婴阶段，以下需求哪些是必须的？（可多选）',
                        type: 'multi',
                        options: [
                            { id: 'baby_room', text: '独立婴儿房或主卧预留婴儿床位置' },
                            { id: 'eco_upgrade', text: '全屋环保要求升级（板材ENF级 ≤0.025mg/m³，涂料零VOC优先）' },
                            { id: 'play_area', text: '客厅预留婴儿爬行/活动区（地面材质建议SPC石晶/柔光砖）' },
                            { id: 'baby_bath', text: '卫生间预留婴儿洗澡操作空间' },
                            { id: 'safety', text: '全屋圆角家具、防夹门设计' },
                            { id: 'none', text: '暂不需要特殊配置' }
                        ]
                    }
                },
                options: [
                    { id: 'young', text: '年轻人1-2位' },
                    { id: 'infant', text: '学龄前儿童' },
                    { id: 'child', text: '学龄儿童' },
                    { id: 'elder', text: '60岁以上老人' },
                    { id: 'pregnant', text: '孕期/备孕中' },
                    { id: 'other', text: '其他' }
                ]
            },
            {
                id: 'futureChanges',
                question: '未来3-5年，家庭人口可能发生什么变化？（可多选）',
                type: 'multi',
                options: [
                    { id: 'baby', text: '计划生育/添二胎' },
                    { id: 'elder_live', text: '老人会过来同住' },
                    { id: 'child_leave', text: '孩子长大独立居住' },
                    { id: 'stable', text: '基本无变化' }
                ]
            },
            {
                id: 'pet',
                question: '您家是否饲养宠物？',
                type: 'single',
                extraBranch: {
                    condition: ['cat', 'dog', 'other'],
                    question: '宠物相关需求，哪些需要考虑？（可多选）',
                    type: 'multi',
                    options: [
                        { id: 'pet_bowl', text: '宠物食盆/窝的固定摆放位' },
                        { id: 'litter', text: '猫砂盆/狗厕所专属位置（建议阳台独立柜体，全铝材质为佳）' },
                        { id: 'pet_storage', text: '宠物用品储物空间' },
                        { id: 'scratch', text: '防抓耐磨的家具/墙面材质' },
                        { id: 'none', text: '暂无特殊需求' }
                    ]
                },
                options: [
                    { id: 'none', text: '无宠物' },
                    { id: 'cat', text: '猫' },
                    { id: 'dog', text: '狗' },
                    { id: 'other', text: '其他宠物' }
                ]
            },
            {
                id: 'lifeScenes',
                question: '您家日常核心生活场景是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'cooking', text: '在家做饭频率高' },
                    { id: 'wfh', text: '经常居家办公/学习' },
                    { id: 'relax', text: '宅家休闲观影为主' },
                    { id: 'entertain', text: '经常招待朋友访客' },
                    { id: 'parenting', text: '以亲子活动为核心' }
                ]
            }
        ]
    },

    // 3.2.1 入户动线
    entryLine: {
        name: '入户动线',
        questions: [
            {
                id: 'entryProblems',
                question: '目前入户区最头疼的问题是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'shoes', text: '鞋子放不下，换季鞋没地方存' },
                    { id: 'clutter', text: '钥匙、口罩、快递杂物乱堆' },
                    { id: 'no_bench', text: '没有换鞋凳，换鞋不方便' },
                    { id: 'no_coat', text: '外套、包包没地方挂' }
                ]
            },
            {
                id: 'entryFunctions',
                question: '入户区必须有的功能是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'shoe_cabinet', text: '大容量鞋柜' },
                    { id: 'bench', text: '换鞋凳' },
                    { id: 'coat_area', text: '挂衣区' },
                    { id: 'storage', text: '随身物品收纳区' },
                    { id: 'express', text: '快递临时堆放区' }
                ]
            },
            {
                id: 'shoesCount',
                question: '【量化题】您家大概有多少双鞋？',
                type: 'input',
                inputs: [
                    { id: 'regular', placeholder: '常穿鞋（双）' },
                    { id: 'seasonal', placeholder: '换季鞋（双）' }
                ]
            },
            {
                id: 'entryPriority',
                question: '入户区需求对您的重要程度是？',
                type: 'single',
                options: [
                    { id: 'P0', text: '必须有，不解决会非常影响日常生活（P0校准）' },
                    { id: 'P1', text: '很想要，预算允许优先实现（P1校准）' },
                    { id: 'P2', text: '锦上添花，可有可无（P2校准）' }
                ]
            }
        ]
    },

    // 3.2.2 餐厨动线
    kitchenLine: {
        name: '餐厨动线',
        questions: [
            {
                id: 'cookingFrequency',
                question: '您家日常做饭频率与用餐人数？',
                type: 'single',
                skipIf: { field: 'cookingFrequency', skipValues: ['occasional', 'rare'] },
                options: [
                    { id: 'daily_2_3', text: '基本天天做，2-3人用餐' },
                    { id: 'daily_4_plus', text: '经常做，4人以上用餐' },
                    { id: 'occasional', text: '偶尔做饭，以简餐为主' },
                    { id: 'rare', text: '很少做饭，外卖为主' }
                ]
            },
            {
                id: 'kitchenProblems',
                question: '做饭时最困扰的问题是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'small_counter', text: '台面太小，备餐空间不够' },
                    { id: 'appliance_storage', text: '小家电太多，收纳麻烦' },
                    { id: 'fridge_far', text: '冰箱离操作台远，拿取绕路' },
                    { id: 'outlets', text: '插座不够，插线板乱拉' }
                ]
            },
            {
                id: 'kitchenFunctions',
                question: '必须有的餐厨功能是？（可多选）',
                type: 'multi',
                options: [
                    { id: '高低_counter', text: '高低台设计' },
                    { id: 'big_sink', text: '台下大单槽' },
                    { id: 'drawer_storage', text: '抽屉式收纳' },
                    { id: 'sideboard', text: '餐边柜' },
                    { id: 'appliance_counter', text: '小家电专属台面' }
                ]
            },
            {
                id: 'smallAppliances',
                question: '【量化题】日常高频使用的厨房小家电约有几个？',
                type: 'single',
                options: [
                    { id: 'less_3', text: '3个以内' },
                    { id: '3_5', text: '3-5个' },
                    { id: 'more_5', text: '5个以上' }
                ]
            },
            {
                id: 'builtInAppliances',
                question: '【嵌入式家电锁定题】以下嵌入式/固定安装类家电，您计划安装的是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'dishwasher', text: '洗碗机' },
                    { id: 'steam_oven', text: '嵌入式蒸烤箱' },
                    { id: 'integrated_stove', text: '集成灶' },
                    { id: 'built_in_fridge', text: '嵌入式冰箱（平嵌/零嵌）' },
                    { id: 'wall_washer', text: '壁挂洗衣机' },
                    { id: 'garbage_disposal', text: '垃圾处理器' },
                    { id: 'instant_water', text: '管线机/即热饮水机' },
                    { id: 'none', text: '暂无嵌入式家电需求' }
                ]
            },
            {
                id: 'kitchenPriority',
                question: '餐厨区需求对您的重要程度是？',
                type: 'single',
                options: [
                    { id: 'P0', text: '必须有（P0校准）' },
                    { id: 'P1', text: '很想要（P1校准）' },
                    { id: 'P2', text: '锦上添花（P2校准）' }
                ]
            }
        ]
    },

    // 3.2.3 起居动线（客厅+阳台）
    livingLine: {
        name: '起居动线',
        questions: [
            {
                id: 'livingCoreScene',
                question: '您家客厅最核心的使用场景是？',
                type: 'single',
                options: [
                    { id: 'movie', text: '家庭观影休闲' },
                    { id: 'parent_child', text: '亲子游戏活动区' },
                    { id: 'guest', text: '待客聊天为主' },
                    { id: 'office', text: '兼具办公/学习功能' }
                ]
            },
            {
                id: 'balconyFunction',
                question: '阳台核心功能定位是？',
                type: 'single',
                options: [
                    { id: 'laundry', text: '纯晾晒家政区' },
                    { id: 'relax', text: '休闲区（养花/喝茶）' },
                    { id: 'both', text: '家政+休闲结合' },
                    { id: 'merge', text: '并入客厅，拓展空间' },
                    { id: 'enclose', text: '需要封阳台（纳入室内空间）' }
                ]
            },
            {
                id: 'livingPriority',
                question: '起居区需求对您的重要程度是？',
                type: 'single',
                options: [
                    { id: 'P0', text: '必须有（P0校准）' },
                    { id: 'P1', text: '很想要（P1校准）' },
                    { id: 'P2', text: '锦上添花（P2校准）' }
                ]
            }
        ]
    },

    // 3.2.4 睡眠动线（卧室）
    bedroomLine: {
        name: '睡眠动线',
        questions: [
            {
                id: 'bedroomProblems',
                question: '卧室最在意的痛点是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'wardrobe', text: '衣柜不够用，衣服放不下' },
                    { id: 'outlets', text: '床头插座不够，充电不方便' },
                    { id: 'night_light', text: '起夜要摸黑找开关' },
                    { id: 'dressing', text: '没有梳妆区' }
                ]
            },
            {
                id: 'bedroomFeatures',
                question: '卧室必须有的配置是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'big_wardrobe', text: '到顶大容量衣柜' },
                    { id: 'bedside_outlets', text: '床头双控开关+双插座' },
                    { id: 'dressing', text: '梳妆台/梳妆区' },
                    { id: 'night_light', text: '起夜感应灯' }
                ]
            },
            {
                id: 'longClothes',
                question: '【量化题】长款挂衣（大衣、连衣裙）需求大概多少件？',
                type: 'single',
                options: [
                    { id: 'less_10', text: '10件以内' },
                    { id: '10_20', text: '10-20件' },
                    { id: 'more_20', text: '20件以上' }
                ]
            },
            {
                id: 'bedroomPriority',
                question: '卧室需求对您的重要程度是？',
                type: 'single',
                options: [
                    { id: 'P0', text: '必须有（P0校准）' },
                    { id: 'P1', text: '很想要（P1校准）' },
                    { id: 'P2', text: '锦上添花（P2校准）' }
                ]
            }
        ]
    },

    // 3.2.5 卫浴动线
    bathroomLine: {
        name: '卫浴动线',
        questions: [
            {
                id: 'bathroomConflict',
                question: '卫生间使用高峰是否有冲突？',
                type: 'single',
                options: [
                    { id: 'high', text: '早高峰经常抢，冲突明显' },
                    { id: 'occasional', text: '偶尔冲突，基本够用' },
                    { id: 'none', text: '多卫，完全无冲突' }
                ]
            },
            {
                id: 'bathroomFeatures',
                question: '卫生间必须有的配置是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'wet_dry', text: '干湿分离' },
                    { id: 'mirror_cabinet', text: '镜柜收纳' },
                    { id: 'smart_toilet', text: '智能马桶/预留插座' },
                    { id: 'towel_warmer', text: '电热毛巾架' },
                    { id: 'niche', text: '淋浴区壁龛' },
                    { id: 'wall_toilet', text: '壁挂马桶（需确认是否承重墙）' }
                ]
            },
            {
                id: 'bathroomPriority',
                question: '卫浴需求对您的重要程度是？',
                type: 'single',
                options: [
                    { id: 'P0', text: '必须有（P0校准）' },
                    { id: 'P1', text: '很想要（P1校准）' },
                    { id: 'P2', text: '锦上添花（P2校准）' }
                ]
            }
        ]
    },

    // 3.2.6 家政动线
    laundryLine: {
        name: '家政动线',
        questions: [
            {
                id: 'housekeepingFunctions',
                question: '必须有的家政功能是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'washer_dryer', text: '洗衣机+烘干机位（平放/叠放需提前确认）' },
                    { id: 'sink', text: '家政洗手池' },
                    { id: 'cleaning_storage', text: '清洁工具收纳柜' },
                    { id: 'ironing', text: '熨烫区' }
                ]
            }
        ]
    },

    // 3.3 全屋储物需求
    storage: {
        name: '全屋储物',
        questions: [
            {
                id: 'storageLevel',
                question: '您对全屋储物的需求程度是？',
                type: 'single',
                options: [
                    { id: 'extreme', text: '极致储物（能做柜子的地方都做，收纳优先）' },
                    { id: 'ample', text: '充裕型（每个空间充足储物，兼顾美观）' },
                    { id: 'basic', text: '基础刚需（够用就行，优先空间开阔）' }
                ]
            },
            {
                id: 'specialStorage',
                question: '以下特殊物品，需要专属储物空间的是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'luggage', text: '行李箱、换季被褥' },
                    { id: 'books', text: '书籍、文件资料' },
                    { id: 'collection', text: '手办、收藏品（需展示）' },
                    { id: 'sports', text: '运动器材' },
                    { id: 'toys', text: '儿童玩具' },
                    { id: 'cleaning', text: '清洁工具、家电配件' }
                ]
            },
            {
                id: 'storagePriority',
                question: '储物需求对您的重要程度是？',
                type: 'single',
                options: [
                    { id: 'P0', text: '必须有（P0校准）' },
                    { id: 'P1', text: '很想要（P1校准）' },
                    { id: 'P2', text: '锦上添花（P2校准）' }
                ]
            }
        ]
    },

    // 3.4 固定设备与水电点位需求
    equipment: {
        name: '固定设备与水电',
        questions: [
            {
                id: 'systemDevices',
                question: '以下全屋系统设备，计划安装的是？（可多选）',
                type: 'multi',
                extraBranch: {
                    condition: ['floor_heating'],
                    question: '水地暖/石墨烯电地暖？',
                    type: 'single',
                    options: [
                        { id: 'water', text: '水地暖（北方大面积建议）' },
                        { id: 'graphene', text: '石墨烯电地暖（南方局部改造建议，30分钟升温、无电磁辐射）' }
                    ]
                },
                options: [
                    { id: 'central_ac', text: '中央空调/风管机' },
                    { id: 'floor_heating', text: '地暖/暖气片（水地暖/石墨烯电地暖）' },
                    { id: 'fresh_air', text: '新风系统（建议选全热交换型，热回收率≥75%）' },
                    { id: 'water_purify', text: '全屋净水（前置过滤器→中央净水→中央软水→末端RO直饮）' },
                    { id: 'smart_home', text: '全屋智能家居' },
                    { id: 'none', text: '都不装，用普通挂机' }
                ]
            },
            {
                id: 'kitchenDevices',
                question: '厨房固定电器，需要预留位置/水电的是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'dishwasher', text: '洗碗机' },
                    { id: 'steam_oven', text: '嵌入式蒸烤箱' },
                    { id: 'garbage_disposal', text: '垃圾处理器' },
                    { id: 'instant_water', text: '管线机/即热饮水机' },
                    { id: 'integrated_stove', text: '集成灶' }
                ]
            },
            {
                id: 'bathroomDevices',
                question: '卫浴固定设备，需要预留的是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'smart_toilet', text: '智能马桶' },
                    { id: 'towel_warmer', text: '电热毛巾架' },
                    { id: 'wall_washer', text: '壁挂洗衣机' },
                    { id: 'bathtub', text: '浴缸' },
                    { id: 'thermostatic_shower', text: '恒温花洒' }
                ]
            },
            {
                id: 'specialOutlets',
                question: '特殊点位需要预留的是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'projector', text: '投影+幕布（预留电源+HDMI线，吊顶阶段预留幕布槽）' },
                    { id: 'robot', text: '扫地机器人基站（预留上下水+电源）' },
                    { id: 'electric_curtain', text: '电动窗帘电源（木工吊顶阶段预埋窗帘盒）' },
                    { id: 'desk_outlets', text: '书桌/电竞桌多插座' },
                    { id: 'monitor', text: '室内监控点位' }
                ]
            },
            {
                id: 'smartHomeSystem',
                question: '您是否计划安装全屋智能系统？',
                type: 'single',
                options: [
                    { id: 'huawei', text: '是，计划华为鸿蒙智家（PLC电力线通信，有电即有网）' },
                    { id: 'xiaomi', text: '是，计划小米米家（纯无线，入门5000-8000元）' },
                    { id: 'aqara', text: '是，计划Aqara绿米（Zigbee 3.0，适合苹果用户）' },
                    { id: 'other', text: '是，计划其他方案' },
                    { id: 'none', text: '暂不安装' }
                ]
            }
        ]
    },

    // 3.5 风格与视觉偏好
    style: {
        name: '风格与视觉',
        questions: [
            {
                id: 'atmosphere',
                question: '您整体喜欢的空间氛围是？',
                type: 'single',
                options: [
                    { id: 'minimal', text: '清爽明亮、简约干净（现代简约/北欧）' },
                    { id: 'natural', text: '温暖治愈、自然质感（原木/日式）' },
                    { id: 'luxury', text: '沉稳高级、有质感（意式极简/现代轻奢）' },
                    { id: 'vintage', text: '复古温馨、有氛围感（中古风/法式）' },
                    { id: 'chinese', text: '大气耐看（新中式）' }
                ]
            },
            {
                id: 'colors',
                question: '色彩偏好：整体更喜欢的色调是？',
                type: 'single',
                options: [
                    { id: 'light', text: '浅色系为主，明亮通透' },
                    { id: 'mixed', text: '深浅搭配，有层次' },
                    { id: 'dark', text: '深色系为主，沉稳高级' },
                    { id: 'colorful', text: '喜欢彩色点缀' }
                ]
            },
            {
                id: 'lighting',
                question: '灯光设计偏好？',
                type: 'single',
                options: [
                    { id: 'no_main', text: '无主灯设计（磁吸轨道灯+筒灯+灯带组合，漫反射柔光）' },
                    { id: 'main_aux', text: '主灯+辅助灯（简单实用，成本低）' },
                    { id: 'main_only', text: '只要主灯，越简单越好' }
                ]
            },
            {
                id: 'rejections',
                question: '【核心排斥项】以下元素明确不想要的是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'tile_wall', text: '瓷砖上墙' },
                    { id: 'complex_molding', text: '复杂繁琐造型' },
                    { id: 'glossy_tile', text: '亮面瓷砖/强反光材质' },
                    { id: 'dark_floor', text: '深色地板/深色门' },
                    { id: 'crystal', text: '水晶灯/华丽灯具' },
                    { id: 'other', text: '其他' }
                ]
            }
        ]
    },

    // 3.6 环保与健康要求
    eco: {
        name: '环保与健康',
        questions: [
            {
                id: 'ecoLevel',
                question: '您对装修环保的要求程度？',
                type: 'single',
                options: [
                    { id: 'very_high', text: '极高要求（板材ENF级 ≤0.025mg/m³，优先高环保材料）' },
                    { id: 'high', text: '高标准（板材E0级 ≤0.050mg/m³，符合GB 18580-2025强制标准）' },
                    { id: 'basic', text: '达标即可（板材E0级即可，国标强制底线）' }
                ]
            },
            {
                id: 'sensitiveGroups',
                question: '家中是否有环境敏感人群？（可多选）',
                type: 'multi',
                options: [
                    { id: 'pregnant_infant', text: '孕妇/婴幼儿' },
                    { id: 'elder', text: '老人' },
                    { id: 'allergy', text: '过敏体质人群' },
                    { id: 'none', text: '无' }
                ]
            }
        ]
    },

    // 3.7 工期要求
    timeline: {
        name: '工期要求',
        questions: [
            {
                id: 'startDate',
                question: '计划开工时间：____年____月',
                type: 'input',
                inputs: [
                    { id: 'year', placeholder: '年' },
                    { id: 'month', placeholder: '月' }
                ]
            },
            {
                id: 'moveInDate',
                question: '预期入住时间：____年____月',
                type: 'input',
                inputs: [
                    { id: 'year', placeholder: '年' },
                    { id: 'month', placeholder: '月' }
                ]
            },
            {
                id: 'strictDeadline',
                question: '是否有硬性工期要求？',
                type: 'single',
                options: [
                    { id: 'strict', text: '有，必须在____前完工' },
                    { id: 'flexible', text: '没有，保证质量优先' }
                ]
            }
        ]
    },

    // 3.8 全屋定制需求专项采集
    customCabinets: {
        name: '全屋定制',
        questions: [
            {
                id: 'cabinetTypes',
                question: '您计划定制的柜体有哪些？（可多选）',
                type: 'multi',
                options: [
                    { id: 'kitchen', text: '橱柜（全包通常含，半包/自装需自购）' },
                    { id: 'wardrobe', text: '衣柜（主卧/次卧）' },
                    { id: 'entry', text: '鞋柜+入户柜' },
                    { id: 'sideboard', text: '餐边柜' },
                    { id: 'balcony', text: '阳台柜（洗衣柜+收纳柜，建议全铝材质）' },
                    { id: 'bookshelf', text: '书柜/展示柜' },
                    { id: 'laundry', text: '家政柜' },
                    { id: 'other', text: '其他' }
                ]
            },
            {
                id: 'cabinetMaterial',
                question: '定制柜板材偏好？',
                type: 'single',
                options: [
                    { id: 'pet', text: 'PET饰面板（耐候性好、易清洁、色彩丰富，2026年主流）' },
                    { id: 'skin', text: '肤感膜（哑光触感高级，不耐高温和刮擦，厨房门板需评估）' },
                    { id: 'melamine', text: '三聚氰胺板（性价比高，耐久稳定）' },
                    { id: 'aluminum', text: '全铝柜（防潮/防火/零甲醛/可回收，阳台柜首选）' },
                    { id: 'other', text: '其他' }
                ]
            },
            {
                id: 'cabinetEco',
                question: '定制柜环保等级要求？',
                type: 'single',
                options: [
                    { id: 'enf', text: 'ENF级（≤0.025mg/m³，推荐最高等级）' },
                    { id: 'e0', text: 'E0级（≤0.050mg/m³，GB 18580-2025强制底线）' },
                    { id: 'no_requirement', text: '无特殊要求' }
                ]
            }
        ]
    },

    // ========== 阶段三：模式专属落地层 ==========

    // 4.1 全包装修专属采集题库
    fullPackage: {
        name: '全包装修专属',
        questions: [
            {
                id: 'fullPackageBudget',
                question: '您的硬装全包总预算区间是？',
                type: 'single',
                options: [
                    { id: 'less_10', text: '10万以内' },
                    { id: '10_15', text: '10-15万' },
                    { id: '15_20', text: '15-20万' },
                    { id: '20_30', text: '20-30万' },
                    { id: 'more_30', text: '30万以上' }
                ]
            },
            {
                id: 'addOnTolerance',
                question: '关于增项，您的接受度是？',
                type: 'single',
                options: [
                    { id: 'zero', text: '必须闭口合同，零增项，非我变更绝不加价' },
                    { id: '5_percent', text: '可接受少量合理增项，比例控制在合同总价5%以内' },
                    { id: 'flexible', text: '只要项目合理，增项也可以接受' }
                ]
            },
            {
                id: 'materialSelection',
                question: '主材选择方式，您更倾向？',
                type: 'single',
                options: [
                    { id: 'package', text: '在装修公司套餐清单内选择，省心为主' },
                    { id: '指定', text: '指定品牌型号，装修公司按清单采购' },
                    { id: 'partial', text: '有部分心仪品牌，其余由装修公司搭配' }
                ]
            },
            {
                id: 'serviceRequirements',
                question: '对服务的要求，以下哪些是必须的？（可多选）',
                type: 'multi',
                options: [
                    { id: 'designer', text: '设计师全程跟进方案落地' },
                    { id: 'supervision', text: '第三方监理全程验收' },
                    { id: 'weekly_update', text: '每周同步施工进度与现场照片' },
                    { id: 'project_manager', text: '专属项目经理对接' }
                ]
            },
            {
                id: 'acceptanceParticipation',
                question: '验收节点参与度？',
                type: 'single',
                options: [
                    { id: 'all', text: '每个隐蔽工程节点都到场验收' },
                    { id: 'key', text: '水电、防水、中期、竣工四个关键节点到场' },
                    { id: 'final', text: '只参加最终竣工验收，其余委托监理' }
                ]
            },
            {
                id: 'paymentMethod',
                question: '付款方式偏好？',
                type: 'single',
                options: [
                    { id: 'milestone', text: '按节点付款，预留质保金' },
                    { id: 'standard', text: '接受装修公司常规付款节点' },
                    { id: 'post_payment', text: '希望付款比例更偏向完工后支付' }
                ]
            },
            {
                id: 'warrantyExpectation',
                question: '对售后保修的预期？',
                type: 'single',
                options: [
                    { id: 'standard', text: '水电防水质保≥5年，基础工程≥2年，符合国标即可' },
                    { id: 'extended', text: '希望更长质保期，整体质保≥3年' },
                    { id: 'fast_response', text: '质保期内响应速度要快，24小时内上门' }
                ]
            }
        ]
    },

    // 4.2 半包装修专属采集题库
    halfPackage: {
        name: '半包装修专属',
        questions: [
            {
                id: 'halfPackageBudget',
                question: '您的半包预算（人工+辅材）区间是？',
                type: 'single',
                options: [
                    { id: 'less_5', text: '5万以内' },
                    { id: '5_8', text: '5-8万' },
                    { id: '8_12', text: '8-12万' },
                    { id: 'more_12', text: '12万以上' }
                ]
            },
            {
                id: 'selfPurchaseMaterials',
                question: '您计划自购的主材有哪些？（可多选）',
                type: 'multi',
                options: [
                    { id: 'tile', text: '瓷砖' },
                    { id: 'floor', text: '木地板' },
                    { id: 'door', text: '室内木门' },
                    { id: 'cabinet', text: '橱柜' },
                    { id: 'bathroom', text: '卫浴洁具' },
                    { id: 'ceiling', text: '集成吊顶' },
                    { id: 'switch_light', text: '开关灯具' },
                    { id: 'custom', text: '全屋定制柜' },
                    { id: 'balcony_enclose', text: '封阳台' }
                ]
            },
            {
                id: 'auxiliaryMaterial',
                question: '对辅材的品牌/等级要求是？',
                type: 'single',
                options: [
                    { id: '指定', text: '指定品牌型号（如电线、水管、腻子、乳胶漆）' },
                    { id: 'brand', text: '要求一线品牌，环保等级达标即可' },
                    { id: 'standard', text: '符合国标就行，不指定品牌' }
                ]
            },
            {
                id: 'craftRequirement',
                question: '对核心施工工艺的要求程度？',
                type: 'single',
                options: [
                    { id: 'high', text: '高标准，需明确工艺细节（水管走顶、全屋挂网、墙压地）' },
                    { id: 'standard', text: '符合国标施工规范即可' },
                    { id: 'normal', text: '按施工方常规工艺来' }
                ]
            },
            {
                id: 'purchaseRhythm',
                question: '采购节奏把控能力？',
                type: 'single',
                extraBranch: {
                    condition: ['delay'],
                    question: '如果主材延迟到场，您可接受的最长等待工期？',
                    type: 'single',
                    options: [
                        { id: '3days', text: '3天内' },
                        { id: '7days', text: '7天内' },
                        { id: '15days', text: '15天内' },
                        { id: 'flexible', text: '不影响，工期可顺延' }
                    ]
                },
                options: [
                    { id: 'plan_ahead', text: '可以提前做采购计划，按施工节点备好主材' },
                    { id: 'remind', text: '需要施工方提前提醒，基本能跟上节奏' },
                    { id: 'delay', text: '可能会拖延，需要施工方灵活配合' }
                ]
            },
            {
                id: 'supportNeeds',
                question: '是否需要施工方提供以下配合？（可多选）',
                type: 'multi',
                options: [
                    { id: 'material_acceptance', text: '主材进场验收配合' },
                    { id: 'installation_coordination', text: '主材安装现场对接' },
                    { id: 'size_list', text: '提供主材采购尺寸清单' },
                    { id: 'channel_recommendation', text: '推荐主材采购渠道' }
                ]
            },
            {
                id: 'paymentMethod',
                question: '付款方式偏好？',
                type: 'single',
                options: [
                    { id: 'milestone', text: '按工序节点付款，做完一项结一项' },
                    { id: 'standard', text: '常规节点付款' },
                    { id: 'other', text: '其他方式' }
                ]
            },
            {
                id: 'acceptanceParticipation',
                question: '辅材进场、隐蔽工程验收，您是否到场？',
                type: 'single',
                options: [
                    { id: 'all', text: '全部到场核对验收' },
                    { id: 'key', text: '关键节点到场' },
                    { id: 'photo', text: '拍照确认即可，不用到场' }
                ]
            }
        ]
    },

    // 4.3 自装模式专属采集题库
    selfBuild: {
        name: '自装模式专属',
        questions: [
            {
                id: 'budgetBreakdown',
                question: '您的装修总预算拆分预期是？（可填区间）',
                type: 'input',
                inputs: [
                    { id: 'labor', placeholder: '人工费用（万元）' },
                    { id: 'main_material', placeholder: '主材费用（万元）' },
                    { id: 'aux_material', placeholder: '辅材费用（万元）' },
                    { id: 'equipment', placeholder: '设备费用（万元）' }
                ]
            },
            {
                id: 'coreCraftStandards',
                question: '核心工序工艺标准，您明确要求的是？（可多选）',
                type: 'multi',
                options: [
                    { id: 'plumbing', text: '水电：水管走顶、强弱电屏蔽、活络线工艺、WAGO接线器' },
                    { id: 'waterproof', text: '防水：淋浴区1.8m高、管根阴阳角圆弧处理、48小时闭水试验' },
                    { id: 'tiling', text: '泥瓦：墙压地工艺、地漏回字排水、空鼓率≤5%' },
                    { id: 'carpentry', text: '木工：轻钢龙骨吊顶、转角整板切割、V型缝防裂' },
                    { id: 'painting', text: '油漆：全屋挂网、批刮2-3遍腻子、一底两面乳胶漆' }
                ]
            },
            {
                id: 'materialSelection',
                question: '主材选型偏好？',
                type: 'single',
                options: [
                    { id: '指定', text: '全部指定品牌型号，按清单采购' },
                    { id: 'budget_range', text: '定好材质与预算区间，现场对比选购' },
                    { id: 'cost_effective', text: '优先性价比，同价位选口碑最好的' }
                ]
            },
            {
                id: 'acceptanceMethod',
                question: '节点验收方式是？',
                type: 'single',
                options: [
                    { id: 'self', text: '自己全程验收，对照标准逐项核对' },
                    { id: 'third_party', text: '请第三方监理做关键节点验收' },
                    { id: 'casual', text: '主要靠工人自觉，大概检查即可' }
                ]
            },
            {
                id: 'teamCoordination',
                question: '施工团队对接方式？',
                type: 'single',
                options: [
                    { id: 'direct', text: '自己分别找各工种工长，直接对接' },
                    { id: 'foreman', text: '找一个总包工长，由工长对接各工种' },
                    { id: 'referral', text: '找熟人介绍的施工队' }
                ]
            },
            {
                id: 'paymentMethod',
                question: '付款方式偏好？',
                type: 'single',
                options: [
                    { id: 'pay_after_work', text: '按工种做完验收合格再付款' },
                    { id: 'partial_advance', text: '进场付一部分，完工结清' },
                    { id: 'other', text: '其他方式' }
                ]
            },
            {
                id: 'timelinePlan',
                question: '工期节点规划？',
                type: 'single',
                options: [
                    { id: 'strict', text: '有明确的各工序工期计划，严格按节点推进' },
                    { id: 'rough', text: '有大概工期，差不多就行' },
                    { id: 'none', text: '没有规划，顺其自然' }
                ]
            }
        ]
    }
};

var CORE_QUESTIONS = [
    {
        id: 'core_area',
        category: 'houseBasic',
        question: '您家房屋建筑面积大概是多少？',
        type: 'single',
        options: [
            { id: 'small', text: '60㎡以下' },
            { id: 'medium_small', text: '60-90㎡' },
            { id: 'medium', text: '90-120㎡' },
            { id: 'large', text: '120-150㎡' },
            { id: 'xlarge', text: '150㎡以上' }
        ]
    },
    {
        id: 'core_houseType',
        category: 'houseBasic',
        question: '您的房屋性质是？',
        type: 'single',
        options: [
            { id: 'normal', text: '普通住宅（70年产权，通燃气）' },
            { id: 'apartment', text: '商住公寓（不通燃气，40年产权）' },
            { id: 'loft', text: 'LOFT/复式' }
        ]
    },
    {
        id: 'core_houseStatus',
        category: 'houseBasic',
        question: '您的房屋当前状态是？',
        type: 'single',
        options: [
            { id: 'rough', text: '全新毛坯房' },
            { id: 'hardcover', text: '精装房全改' },
            { id: 'old', text: '老房翻新（房龄10年以上）' },
            { id: 'partial', text: '局部改造' }
        ]
    },
    {
        id: 'core_layout',
        category: 'houseBasic',
        question: '您家户型格局是？',
        type: 'single',
        options: [
            { id: '1room', text: '1室1厅' },
            { id: '2room', text: '2室1厅/2室2厅' },
            { id: '3room', text: '3室1厅/3室2厅' },
            { id: '4room', text: '4室及以上' }
        ]
    },
    {
        id: 'core_familyMembers',
        category: 'familyProfile',
        question: '您家常住人口有几位？',
        type: 'single',
        options: [
            { id: '1', text: '1人独居' },
            { id: '2', text: '2人（夫妻/情侣）' },
            { id: '3', text: '3人（三口之家）' },
            { id: '4plus', text: '4人及以上（多代同堂）' }
        ]
    },
    {
        id: 'core_lifeScene',
        category: 'familyProfile',
        question: '您家日常核心生活场景是？',
        type: 'single',
        options: [
            { id: 'cooking', text: '在家做饭频率高' },
            { id: 'wfh', text: '经常居家办公/学习' },
            { id: 'relax', text: '宅家休闲观影为主' },
            { id: 'parenting', text: '以亲子活动为核心' }
        ]
    },
    {
        id: 'core_specialNeeds',
        category: 'familyProfile',
        question: '家里是否有特殊需求需要考虑？（可多选）',
        type: 'multi',
        options: [
            { id: 'elder', text: '有老人（60岁以上）' },
            { id: 'child', text: '有小孩（学龄前/学龄期）' },
            { id: 'pregnant', text: '孕期/备孕中' },
            { id: 'pet', text: '饲养宠物' },
            { id: 'none', text: '暂无特殊需求' }
        ]
    },
    {
        id: 'core_atmosphere',
        category: 'style',
        question: '您整体喜欢的空间氛围是？',
        type: 'single',
        options: [
            { id: 'minimal', text: '清爽明亮、简约干净（现代简约/北欧）' },
            { id: 'natural', text: '温暖治愈、自然质感（原木/日式）' },
            { id: 'luxury', text: '沉稳高级、有质感（意式极简/轻奢）' },
            { id: 'vintage', text: '复古温馨、有氛围感（中古风/法式）' },
            { id: 'chinese', text: '大气耐看（新中式）' }
        ]
    },
    {
        id: 'core_colors',
        category: 'style',
        question: '色彩偏好：整体更喜欢的色调是？',
        type: 'single',
        options: [
            { id: 'light', text: '浅色系为主，明亮通透' },
            { id: 'mixed', text: '深浅搭配，有层次' },
            { id: 'dark', text: '深色系为主，沉稳高级' },
            { id: 'colorful', text: '喜欢彩色点缀' }
        ]
    },
    {
        id: 'core_decorationMode',
        category: 'modeEvaluation',
        question: '关于装修模式，您更倾向于哪种？',
        type: 'single',
        options: [
            { id: 'self', text: '自装（自己找工人买材料）' },
            { id: 'half', text: '半包（包工不包料，主材自购）' },
            { id: 'full', text: '全包（包工包料，省心省力）' }
        ]
    },
    {
        id: 'core_budget',
        category: 'budget',
        question: '您的装修总预算区间大概是？（按建筑面积计）',
        type: 'single',
        options: [
            { id: 'less_10', text: '10万以内' },
            { id: '10_20', text: '10-20万' },
            { id: '20_30', text: '20-30万' },
            { id: '30_50', text: '30-50万' },
            { id: 'more_50', text: '50万以上' }
        ]
    },
    {
        id: 'core_timeline',
        category: 'timeline',
        question: '您期望的装修完工时间是？',
        type: 'single',
        options: [
            { id: '3months', text: '3个月以内（越快越好）' },
            { id: '3_6months', text: '3-6个月' },
            { id: '6_12months', text: '6-12个月' },
            { id: 'flexible', text: '不急，保证质量优先' }
        ]
    }
];
