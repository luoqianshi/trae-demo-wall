/**
 * 导游资格证考试知识图谱数据
 * ============================================
 * 基于全国导游人员资格考试大纲（最新版）整理
 * 包含：考试结构、四科章节知识点、面试评分标准、高频考点标记
 *
 * 全局变量：window.KNOWLEDGE_DATA
 */
(function () {
  'use strict';

  // ============================================================
  // 1. 考试结构数据
  // ============================================================
  var examStructure = {
    /** 笔试部分 */
    writtenExams: [
      {
        id: 'paper-1',
        name: '试卷一',
        fullName: '科目一 + 科目二 合卷',
        subjects: [
          { id: 'subj-law', name: '政策与法律法规', weight: 50, description: '单项选择题、多项选择题、判断题' },
          { id: 'subj-guide', name: '导游业务', weight: 50, description: '单项选择题、多项选择题、判断题' }
        ],
        totalScore: 100,
        duration: 90,
        durationUnit: '分钟',
        questionTypes: ['单项选择题', '多项选择题', '判断题']
      },
      {
        id: 'paper-2',
        name: '试卷二',
        fullName: '科目三 + 科目四 合卷',
        subjects: [
          { id: 'subj-national', name: '全国导游基础知识', weight: 50, description: '单项选择题、多项选择题、判断题' },
          { id: 'subj-local', name: '地方导游基础知识', weight: 50, description: '单项选择题、多项选择题、判断题' }
        ],
        totalScore: 100,
        duration: 90,
        durationUnit: '分钟',
        questionTypes: ['单项选择题', '多项选择题', '判断题']
      }
    ],

    /** 面试部分 */
    oralExam: {
      id: 'oral',
      name: '现场考试（面试）',
      fullName: '科目五 导游服务能力',
      totalScore: 100,
      duration: 15,
      durationUnit: '分钟/人',
      description: '采用模拟导游讲解 + 现场问答形式进行，考查考生的导游服务综合能力。'
    },

    /** 整体考试说明 */
    summary: {
      totalWrittenScore: 200,
      totalOralScore: 100,
      qualificationLine: '笔试和面试均达到合格线方可取得导游资格证，合格线由文化和旅游部统一划定。',
      examFrequency: '每年一次，一般在11月举行笔试，笔试后分批进行面试。',
      certificateValidity: '导游资格证终身有效，取得后须与旅行社签订劳动合同或在导游行业组织注册，方可申领导游证。'
    }
  };

  // ============================================================
  // 2. 四科详细章节数据
  // ============================================================
  var subjects = [
    // ---------------------------------------------------------
    // 科目一：政策与法律法规
    // ---------------------------------------------------------
    {
      id: 'subj-law',
      name: '政策与法律法规',
      fullName: '科目一 政策与法律法规',
      weight: 50,
      description: '考查考生对党和国家的大政方针、旅游业发展方针政策、法律法规及相关规定的了解、熟悉和掌握程度。',
      chapters: [
        {
          id: 'law-ch1',
          name: '习近平新时代中国特色社会主义思想',
          weight: 8,
          topics: [
            { id: 'law-ch1-t1', name: '习近平新时代中国特色社会主义思想的时代背景与核心要义' },
            { id: 'law-ch1-t2', name: '"五位一体"总体布局和"四个全面"战略布局' },
            { id: 'law-ch1-t3', name: '新发展理念与高质量发展' },
            { id: 'law-ch1-t4', name: '习近平关于文化和旅游工作的重要论述' },
            { id: 'law-ch1-t5', name: '社会主义核心价值观与文化旅游融合发展' }
          ]
        },
        {
          id: 'law-ch2',
          name: '旅游法基础知识',
          weight: 12,
          topics: [
            { id: 'law-ch2-t1', name: '《中华人民共和国旅游法》的立法宗旨与基本原则' },
            { id: 'law-ch2-t2', name: '旅游者的权利与义务' },
            { id: 'law-ch2-t3', name: '旅游经营与旅游服务合同' },
            { id: 'law-ch2-t4', name: '旅游安全与旅游监督管理' },
            { id: 'law-ch2-t5', name: '旅游纠纷处理与法律责任' }
          ]
        },
        {
          id: 'law-ch3',
          name: '合同法与旅游服务合同',
          weight: 10,
          topics: [
            { id: 'law-ch3-t1', name: '《中华人民共和国民法典》合同编概述' },
            { id: 'law-ch3-t2', name: '合同的订立、效力与履行' },
            { id: 'law-ch3-t3', name: '合同的变更、转让与终止' },
            { id: 'law-ch3-t4', name: '违约责任与缔约过失责任' },
            { id: 'law-ch3-t5', name: '旅游服务合同（包价旅游合同、组团合同）的特殊规定' }
          ]
        },
        {
          id: 'law-ch4',
          name: '消费者权益保护法与旅游消费者权益',
          weight: 8,
          topics: [
            { id: 'law-ch4-t1', name: '《中华人民共和国消费者权益保护法》立法宗旨与适用范围' },
            { id: 'law-ch4-t2', name: '消费者的九大权利' },
            { id: 'law-ch4-t3', name: '经营者的义务与法律责任' },
            { id: 'law-ch4-t4', name: '旅游消费争议的解决途径' },
            { id: 'law-ch4-t5', name: '旅游欺诈与消费陷阱的防范' }
          ]
        },
        {
          id: 'law-ch5',
          name: '旅行社条例与旅行社管理',
          weight: 10,
          topics: [
            { id: 'law-ch5-t1', name: '《旅行社条例》与《旅行社条例实施细则》' },
            { id: 'law-ch5-t2', name: '旅行社的设立条件与许可制度' },
            { id: 'law-ch5-t3', name: '旅行社经营规范与质量保证金制度' },
            { id: 'law-ch5-t4', name: '旅行社责任保险与旅游安全' },
            { id: 'law-ch5-t5', name: '在线旅游经营服务管理相关规定' }
          ]
        },
        {
          id: 'law-ch6',
          name: '导游人员管理条例与导游管理',
          weight: 10,
          topics: [
            { id: 'law-ch6-t1', name: '《导游人员管理条例》及其实施办法' },
            { id: 'law-ch6-t2', name: '导游资格的取得与导游证管理' },
            { id: 'law-ch6-t3', name: '导游的执业规则与执业保障' },
            { id: 'law-ch6-t4', name: '导游的职责、权利与义务' },
            { id: 'law-ch6-t5', name: '导游违规行为的法律责任与处罚' }
          ]
        },
        {
          id: 'law-ch7',
          name: '旅游安全与旅游保险法律法规',
          weight: 6,
          topics: [
            { id: 'law-ch7-t1', name: '《旅游安全管理办法》' },
            { id: 'law-ch7-t2', name: '旅游突发事件的分类与处理' },
            { id: 'law-ch7-t3', name: '旅游经营者的安全保障义务' },
            { id: 'law-ch7-t4', name: '旅游保险（旅行社责任险、旅游意外险）' }
          ]
        },
        {
          id: 'law-ch8',
          name: '旅游纠纷处理与相关法律法规',
          weight: 6,
          topics: [
            { id: 'law-ch8-t1', name: '《旅游投诉处理办法》与投诉处理程序' },
            { id: 'law-ch8-t2', name: '旅游仲裁与旅游诉讼' },
            { id: 'law-ch8-t3', name: '《中华人民共和国出入境管理法》相关条款' },
            { id: 'law-ch8-t4', name: '《中华人民共和国环境保护法》与生态旅游' }
          ]
        }
      ]
    },

    // ---------------------------------------------------------
    // 科目二：导游业务
    // ---------------------------------------------------------
    {
      id: 'subj-guide',
      name: '导游业务',
      fullName: '科目二 导游业务',
      weight: 50,
      description: '考查考生对导游服务性质、特点、地位和作用的认识，对导游人员职责、职业道德、服务规范、服务技能、应变能力、语言表达能力和文明旅游引导等知识的掌握程度。',
      chapters: [
        {
          id: 'guide-ch1',
          name: '导游服务概述',
          weight: 8,
          topics: [
            { id: 'guide-ch1-t1', name: '导游服务的产生与发展' },
            { id: 'guide-ch1-t2', name: '导游服务的性质、特点与原则' },
            { id: 'guide-ch1-t3', name: '导游服务的地位与作用' },
            { id: 'guide-ch1-t4', name: '导游人员的分类与职责' },
            { id: 'guide-ch1-t5', name: '导游职业道德与行为规范' }
          ]
        },
        {
          id: 'guide-ch2',
          name: '导游服务程序与服务规范',
          weight: 14,
          topics: [
            { id: 'guide-ch2-t1', name: '地陪导游服务程序（接团准备、接站、入住、行程、送站）' },
            { id: 'guide-ch2-t2', name: '全陪导游服务程序（全程陪同、联络协调、安全监督）' },
            { id: 'guide-ch2-t3', name: '出境领队服务程序与规范' },
            { id: 'guide-ch2-t4', name: '散客导游服务程序' },
            { id: 'guide-ch2-t5', name: '景区景点导游服务规范' }
          ]
        },
        {
          id: 'guide-ch3',
          name: '导游带团技能与讲解技巧',
          weight: 12,
          topics: [
            { id: 'guide-ch3-t1', name: '导游带团的特点与原则' },
            { id: 'guide-ch3-t2', name: '导游组织协调能力与团队管理技巧' },
            { id: 'guide-ch3-t3', name: '导游讲解的常用方法（概述法、分段法、问答法、类比法等）' },
            { id: 'guide-ch3-t4', name: '导游讲解的语言艺术与表达技巧' },
            { id: 'guide-ch3-t5', name: '不同游客类型的接待技巧与个性化服务' }
          ]
        },
        {
          id: 'guide-ch4',
          name: '旅游突发事件处理',
          weight: 12,
          topics: [
            { id: 'guide-ch4-t1', name: '旅游安全事故的处理（交通事故、火灾、食物中毒等）' },
            { id: 'guide-ch4-t2', name: '游客突发疾病与死亡的处理' },
            { id: 'guide-ch4-t3', name: '游客走失、财物丢失的处理' },
            { id: 'guide-ch4-t4', name: '旅游延误、变更与取消的处理' },
            { id: 'guide-ch4-t5', name: '自然灾害与公共卫生事件的应急处理' }
          ]
        },
        {
          id: 'guide-ch5',
          name: '导游语言表达与人际沟通',
          weight: 8,
          topics: [
            { id: 'guide-ch5-t1', name: '导游语言的基本要求与特点' },
            { id: 'guide-ch5-t2', name: '导游口头表达技巧（语音、语调、语速、节奏）' },
            { id: 'guide-ch5-t3', name: '导游态势语言与表情管理' },
            { id: 'guide-ch5-t4', name: '导游的人际沟通与游客心理把握' },
            { id: 'guide-ch5-t5', name: '跨文化沟通与涉外接待礼仪' }
          ]
        },
        {
          id: 'guide-ch6',
          name: '游客投诉处理与满意度管理',
          weight: 8,
          topics: [
            { id: 'guide-ch6-t1', name: '游客投诉的原因与心理分析' },
            { id: 'guide-ch6-t2', name: '投诉处理的原则与程序' },
            { id: 'guide-ch6-t3', name: '投诉处理技巧与沟通策略' },
            { id: 'guide-ch6-t4', name: '游客满意度提升与服务质量改进' }
          ]
        },
        {
          id: 'guide-ch7',
          name: '导游服务相关知识',
          weight: 6,
          topics: [
            { id: 'guide-ch7-t1', name: '出入境知识（护照、签证、海关、边检）' },
            { id: 'guide-ch7-t2', name: '交通知识（航空、铁路、水路、公路）' },
            { id: 'guide-ch7-t3', name: '货币与保险知识' },
            { id: 'guide-ch7-t4', name: '邮电通信与卫生常识' }
          ]
        },
        {
          id: 'guide-ch8',
          name: '文明旅游与文明引导',
          weight: 6,
          topics: [
            { id: 'guide-ch8-t1', name: '文明旅游的政策法规与行业标准' },
            { id: 'guide-ch8-t2', name: '导游在文明旅游引导中的职责' },
            { id: 'guide-ch8-t3', name: '常见不文明旅游行为及引导方法' },
            { id: 'guide-ch8-t4', name: '中国公民出境旅游文明行为指南' }
          ]
        }
      ]
    },

    // ---------------------------------------------------------
    // 科目三：全国导游基础知识
    // ---------------------------------------------------------
    {
      id: 'subj-national',
      name: '全国导游基础知识',
      fullName: '科目三 全国导游基础知识',
      weight: 50,
      description: '考查考生对中国共产党成立以来领导中国人民在革命、建设、改革和新时代的重大成就，中国旅游业发展概况，中国历史文化知识，中国民族民俗知识，中国宗教文化知识，中国古代建筑与园林知识，中国饮食文化知识，中国风物特产知识等的掌握程度。',
      chapters: [
        {
          id: 'nat-ch1',
          name: '中国历史常识',
          weight: 10,
          topics: [
            { id: 'nat-ch1-t1', name: '中国古代重要历史阶段与朝代更替' },
            { id: 'nat-ch1-t2', name: '中国历史上的重大事件与著名人物' },
            { id: 'nat-ch1-t3', name: '中国古代科技文化成就（四大发明、天文历法、医药学等）' },
            { id: 'nat-ch1-t4', name: '中国近现代史纲要与中国共产党百年奋斗历程' },
            { id: 'nat-ch1-t5', name: '中国历史文化名城与文化遗产保护' }
          ]
        },
        {
          id: 'nat-ch2',
          name: '中国民族民俗',
          weight: 8,
          topics: [
            { id: 'nat-ch2-t1', name: '中国民族概况与分布特点' },
            { id: 'nat-ch2-t2', name: '汉族传统节日与民俗文化' },
            { id: 'nat-ch2-t3', name: '主要少数民族（蒙古族、藏族、回族、壮族、苗族、维吾尔族等）的民俗与文化' },
            { id: 'nat-ch2-t4', name: '少数民族节庆活动与禁忌' }
          ]
        },
        {
          id: 'nat-ch3',
          name: '中国宗教文化',
          weight: 8,
          topics: [
            { id: 'nat-ch3-t1', name: '中国宗教概况与宗教政策' },
            { id: 'nat-ch3-t2', name: '佛教文化（传入与发展、主要宗派、名山古刹、重要佛事活动）' },
            { id: 'nat-ch3-t3', name: '道教文化（起源与发展、主要派别、名山宫观、道教神仙体系）' },
            { id: 'nat-ch3-t4', name: '伊斯兰教与基督教在中国的传播与发展' },
            { id: 'nat-ch3-t5', name: '宗教建筑的艺术特征与文化内涵' }
          ]
        },
        {
          id: 'nat-ch4',
          name: '中国古代建筑',
          weight: 10,
          topics: [
            { id: 'nat-ch4-t1', name: '中国古代建筑的基本特征与分类' },
            { id: 'nat-ch4-t2', name: '中国古代建筑的重要类型（宫殿、坛庙、陵墓、古城、民居）' },
            { id: 'nat-ch4-t3', name: '中国古代建筑的等级制度与营造法式' },
            { id: 'nat-ch4-t4', name: '中国现存著名古建筑（故宫、天坛、长城、大雁塔等）' },
            { id: 'nat-ch4-t5', name: '中国古桥、古塔、石窟与石刻艺术' }
          ]
        },
        {
          id: 'nat-ch5',
          name: '中国古典园林',
          weight: 8,
          topics: [
            { id: 'nat-ch5-t1', name: '中国古典园林的起源与发展演变' },
            { id: 'nat-ch5-t2', name: '中国古典园林的分类（皇家园林、私家园林、寺观园林、自然园林）' },
            { id: 'nat-ch5-t3', name: '中国古典园林的构景要素与造园手法' },
            { id: 'nat-ch5-t4', name: '中国著名古典园林（颐和园、拙政园、留园、承德避暑山庄等）' },
            { id: 'nat-ch5-t5', name: '中国古典园林的文化意蕴与审美特征' }
          ]
        },
        {
          id: 'nat-ch6',
          name: '中国饮食文化',
          weight: 8,
          topics: [
            { id: 'nat-ch6-t1', name: '中国烹饪文化的发展历程与主要特点' },
            { id: 'nat-ch6-t2', name: '中国八大菜系及其代表菜品' },
            { id: 'nat-ch6-t3', name: '中国茶文化（茶类、茶艺、茶道、茶俗）' },
            { id: 'nat-ch6-t4', name: '中国酒文化（酒类、酒史、酒俗、名酒）' },
            { id: 'nat-ch6-t5', name: '地方特色饮食与传统筵席文化' }
          ]
        },
        {
          id: 'nat-ch7',
          name: '中国风物特产',
          weight: 8,
          topics: [
            { id: 'nat-ch7-t1', name: '中国陶瓷文化（景德镇瓷器、宜兴紫砂等）' },
            { id: 'nat-ch7-t2', name: '中国织绣工艺（云锦、苏绣、湘绣、蜀绣、粤绣）' },
            { id: 'nat-ch7-t3', name: '中国传统工艺美术（景泰蓝、漆器、玉雕、木雕等）' },
            { id: 'nat-ch7-t4', name: '中国文房四宝与书画艺术' },
            { id: 'nat-ch7-t5', name: '中国名优特产与地方特色商品' }
          ]
        },
        {
          id: 'nat-ch8',
          name: '中国旅游业概况',
          weight: 6,
          topics: [
            { id: 'nat-ch8-t1', name: '中国旅游业发展历程与成就' },
            { id: 'nat-ch8-t2', name: '旅游市场格局与旅游消费趋势' },
            { id: 'nat-ch8-t3', name: '"一带一路"旅游合作与文旅融合' },
            { id: 'nat-ch8-t4', name: '智慧旅游与旅游新业态' }
          ]
        }
      ]
    },

    // ---------------------------------------------------------
    // 科目四：地方导游基础知识
    // ---------------------------------------------------------
    {
      id: 'subj-local',
      name: '地方导游基础知识',
      fullName: '科目四 地方导游基础知识',
      weight: 50,
      description: '考查考生对中国各省（自治区、直辖市、特别行政区）的基本概况、旅游资源、民俗文化、特色产业、旅游发展现状等知识的掌握程度。',
      chapters: [
        {
          id: 'local-ch1',
          name: '华北地区各省市概况',
          weight: 12,
          topics: [
            { id: 'local-ch1-t1', name: '北京市概况（地理、历史、文化、旅游资源）' },
            { id: 'local-ch1-t2', name: '天津市概况与旅游特色' },
            { id: 'local-ch1-t3', name: '河北省概况（承德避暑山庄、北戴河等）' },
            { id: 'local-ch1-t4', name: '山西省概况（五台山、云冈石窟、平遥古城等）' },
            { id: 'local-ch1-t5', name: '内蒙古自治区概况（草原文化、那达慕等）' }
          ]
        },
        {
          id: 'local-ch2',
          name: '东北地区各省概况',
          weight: 8,
          topics: [
            { id: 'local-ch2-t1', name: '辽宁省概况（沈阳故宫、大连海滨等）' },
            { id: 'local-ch2-t2', name: '吉林省概况（长白山、雾凇、朝鲜族文化等）' },
            { id: 'local-ch2-t3', name: '黑龙江省概况（冰雪旅游、五大连池、北极村等）' }
          ]
        },
        {
          id: 'local-ch3',
          name: '华东地区各省市概况',
          weight: 14,
          topics: [
            { id: 'local-ch3-t1', name: '上海市概况（都市旅游、外滩、迪士尼等）' },
            { id: 'local-ch3-t2', name: '江苏省概况（苏州园林、南京明孝陵、扬州等）' },
            { id: 'local-ch3-t3', name: '浙江省概况（西湖、千岛湖、乌镇、普陀山等）' },
            { id: 'local-ch3-t4', name: '安徽省概况（黄山、宏村西递、徽州文化等）' },
            { id: 'local-ch3-t5', name: '福建省概况（武夷山、鼓浪屿、土楼等）' },
            { id: 'local-ch3-t6', name: '江西省概况（庐山、景德镇、婺源、三清山等）' },
            { id: 'local-ch3-t7', name: '山东省概况（泰山、曲阜三孔、青岛等）' }
          ]
        },
        {
          id: 'local-ch4',
          name: '中南地区各省概况',
          weight: 12,
          topics: [
            { id: 'local-ch4-t1', name: '河南省概况（少林寺、龙门石窟、殷墟等）' },
            { id: 'local-ch4-t2', name: '湖北省概况（黄鹤楼、武当山、三峡等）' },
            { id: 'local-ch4-t3', name: '湖南省概况（张家界、凤凰古城、韶山等）' },
            { id: 'local-ch4-t4', name: '广东省概况（广州塔、丹霞山、华侨城等）' },
            { id: 'local-ch4-t5', name: '广西壮族自治区概况（桂林山水、漓江、北海等）' },
            { id: 'local-ch4-t6', name: '海南省概况（天涯海角、三亚、自贸港等）' }
          ]
        },
        {
          id: 'local-ch5',
          name: '西南地区各省市概况',
          weight: 12,
          topics: [
            { id: 'local-ch5-t1', name: '重庆市概况（山城景观、火锅文化、大足石刻等）' },
            { id: 'local-ch5-t2', name: '四川省概况（九寨沟、峨眉山、都江堰、大熊猫等）' },
            { id: 'local-ch5-t3', name: '贵州省概况（黄果树瀑布、荔波、西江千户苗寨等）' },
            { id: 'local-ch5-t4', name: '云南省概况（丽江古城、大理、石林、西双版纳等）' },
            { id: 'local-ch5-t5', name: '西藏自治区概况（布达拉宫、大昭寺、纳木错等）' }
          ]
        },
        {
          id: 'local-ch6',
          name: '西北地区各省区概况',
          weight: 10,
          topics: [
            { id: 'local-ch6-t1', name: '陕西省概况（兵马俑、大雁塔、华山、延安等）' },
            { id: 'local-ch6-t2', name: '甘肃省概况（敦煌莫高窟、嘉峪关、张掖丹霞等）' },
            { id: 'local-ch6-t3', name: '青海省概况（青海湖、塔尔寺、可可西里等）' },
            { id: 'local-ch6-t4', name: '宁夏回族自治区概况（沙湖、西夏王陵、沙坡头等）' },
            { id: 'local-ch6-t5', name: '新疆维吾尔自治区概况（天山、喀纳斯、吐鲁番等）' }
          ]
        },
        {
          id: 'local-ch7',
          name: '港澳台地区概况',
          weight: 6,
          topics: [
            { id: 'local-ch7-t1', name: '香港特别行政区概况（维多利亚港、迪士尼、太平山等）' },
            { id: 'local-ch7-t2', name: '澳门特别行政区概况（大三巴牌坊、博彩旅游、美食文化等）' },
            { id: 'local-ch7-t3', name: '台湾省概况（日月潭、阿里山、台北故宫博物院等）' }
          ]
        },
        {
          id: 'local-ch8',
          name: '中国世界遗产与A级景区',
          weight: 10,
          topics: [
            { id: 'local-ch8-t1', name: '中国世界遗产总览（文化遗产、自然遗产、双遗产、文化景观）' },
            { id: 'local-ch8-t2', name: '世界文化遗产代表项目（长城、故宫、兵马俑、莫高窟等）' },
            { id: 'local-ch8-t3', name: '世界自然遗产与双遗产（九寨沟、张家界、黄山、泰山等）' },
            { id: 'local-ch8-t4', name: '中国5A级旅游景区分布与代表' },
            { id: 'local-ch8-t5', name: '红色旅游经典景区与爱国主义教育基地' }
          ]
        },
        {
          id: 'local-ch9',
          name: '旅游产品与旅游新业态',
          weight: 6,
          topics: [
            { id: 'local-ch9-t1', name: '旅游产品类型（观光旅游、度假旅游、专项旅游等）' },
            { id: 'local-ch9-t2', name: '乡村旅游与乡村振兴' },
            { id: 'local-ch9-t3', name: '研学旅游与工业旅游' },
            { id: 'local-ch9-t4', name: '康养旅游与生态旅游' },
            { id: 'local-ch9-t5', name: '夜间经济与文旅消费新场景' }
          ]
        }
      ]
    }
  ];

  // ============================================================
  // 3. 面试评分标准数据
  // ============================================================
  var interviewRubric = {
    examName: '科目五 导游服务能力（现场考试）',
    totalScore: 100,
    description: '面试采用模拟导游讲解与现场问答相结合的方式，全面考查考生的导游服务综合能力。',
    dimensions: [
      {
        id: 'rubric-1',
        name: '景点讲解',
        weight: 45,
        score: 45,
        keyPoints: [
          '讲解内容准确、完整，符合考试指定景点范围',
          '讲解思路清晰，逻辑性强，结构合理',
          '讲解语言生动形象，富有感染力',
          '能运用多种讲解方法，重点突出',
          '知识面广，能应答相关的延伸问题'
        ]
      },
      {
        id: 'rubric-2',
        name: '语言表达',
        weight: 20,
        score: 20,
        keyPoints: [
          '普通话标准，语音语调自然',
          '语速适中，节奏感好',
          '用词准确、得体，无语法错误',
          '表达流畅，无明显停顿或重复',
          '能根据内容调整语气和情感'
        ]
      },
      {
        id: 'rubric-3',
        name: '导游服务规范',
        weight: 10,
        score: 10,
        keyPoints: [
          '熟悉导游服务流程与规范',
          '掌握导游各环节的服务标准',
          '了解导游职业道德与行为规范',
          '能正确处理导游服务中的常见问题'
        ]
      },
      {
        id: 'rubric-4',
        name: '应变能力',
        weight: 10,
        score: 10,
        keyPoints: [
          '面对突发问题反应迅速、冷静',
          '能合理分析问题原因并给出解决方案',
          '处理方式符合法律法规和行业规范',
          '兼顾游客利益与旅行社利益',
          '思路开阔，有备选方案'
        ]
      },
      {
        id: 'rubric-5',
        name: '综合知识',
        weight: 5,
        score: 5,
        keyPoints: [
          '了解旅游行业相关法律法规',
          '掌握旅游地理、历史文化等基础知识',
          '关注旅游行业热点与发展动态',
          '回答问题时知识面广、准确度高'
        ]
      },
      {
        id: 'rubric-6',
        name: '礼仪礼貌',
        weight: 10,
        score: 10,
        keyPoints: [
          '着装整洁得体，仪表端庄大方',
          '举止文明，态度亲切自然',
          '礼貌用语使用恰当',
          '具有良好的职业形象和服务意识',
          '注意眼神交流与肢体语言'
        ],
        note: '此项贯穿整个面试过程，从考生进入考场开始即纳入评分'
      }
    ]
  };

  // ============================================================
  // 4. 高频考点标记数据
  // ============================================================
  var hotTopics = [
    // 政策与法律法规
    {
      id: 'hot-law-1',
      subjectId: 'subj-law',
      name: '旅游法的立法宗旨与旅游者权利义务',
      relatedChapters: ['law-ch2'],
      frequency: '高',
      examTips: '常以选择题和判断题形式考查，须熟记旅游者的权利（知情权、自主选择权、公平交易权等）和义务。'
    },
    {
      id: 'hot-law-2',
      subjectId: 'subj-law',
      name: '旅行社经营规范与质量保证金制度',
      relatedChapters: ['law-ch5'],
      frequency: '高',
      examTips: '质量保证金缴纳标准、使用条件、补足期限是高频考点，注意区分不同经营范围的旅行社。'
    },
    {
      id: 'hot-law-3',
      subjectId: 'subj-law',
      name: '导游执业规则与违规处罚',
      relatedChapters: ['law-ch6'],
      frequency: '高',
      examTips: '导游证分类、不得私自承揽业务、不得擅自变更行程等禁令及相应处罚力度是重点。'
    },
    {
      id: 'hot-law-4',
      subjectId: 'subj-law',
      name: '旅游服务合同的订立与履行',
      relatedChapters: ['law-ch3'],
      frequency: '高',
      examTips: '包价旅游合同的内容、变更和解除条件、违约责任划分是案例分析题常考方向。'
    },
    {
      id: 'hot-law-5',
      subjectId: 'subj-law',
      name: '消费者权益保护与旅游消费纠纷',
      relatedChapters: ['law-ch4'],
      frequency: '中',
      examTips: '消费者九大权利在旅游场景中的具体体现，以及解决争议的五种途径。'
    },
    {
      id: 'hot-law-6',
      subjectId: 'subj-law',
      name: '旅游安全与突发事件处理的法律责任',
      relatedChapters: ['law-ch7'],
      frequency: '中',
      examTips: '旅游经营者的安全保障义务、安全风险提示制度、突发事件报告制度。'
    },
    {
      id: 'hot-law-7',
      subjectId: 'subj-law',
      name: '习近平新时代中国特色社会主义思想核心要义',
      relatedChapters: ['law-ch1'],
      frequency: '中',
      examTips: '重点掌握"五位一体"、"四个全面"、新发展理念、习近平关于文旅工作的重要论述。'
    },

    // 导游业务
    {
      id: 'hot-guide-1',
      subjectId: 'subj-guide',
      name: '地陪导游服务程序',
      relatedChapters: ['guide-ch2'],
      frequency: '高',
      examTips: '地陪服务全程（准备-接站-入住-行程-送站-善后）各环节的操作规范和时间节点必须掌握。'
    },
    {
      id: 'hot-guide-2',
      subjectId: 'subj-guide',
      name: '旅游突发事件的处理流程',
      relatedChapters: ['guide-ch4'],
      frequency: '高',
      examTips: '交通事故、食物中毒、游客走失、财物丢失等常见突发事件的应急处理程序，案例分析题常考。'
    },
    {
      id: 'hot-guide-3',
      subjectId: 'subj-guide',
      name: '导游讲解方法与技巧',
      relatedChapters: ['guide-ch3'],
      frequency: '高',
      examTips: '概述法、分段讲解法、突出重点法、问答法、类比法等常用讲解方法的特点与运用场景。'
    },
    {
      id: 'hot-guide-4',
      subjectId: 'subj-guide',
      name: '全陪导游服务程序与职责',
      relatedChapters: ['guide-ch2'],
      frequency: '中',
      examTips: '全陪与地陪的职责区别、全陪在各站的协调监督职责、全程服务规范。'
    },
    {
      id: 'hot-guide-5',
      subjectId: 'subj-guide',
      name: '游客投诉处理',
      relatedChapters: ['guide-ch6'],
      frequency: '中',
      examTips: '投诉心理分析、投诉处理原则（耐心倾听、不辩解、及时处理等）、不同投诉类型的应对策略。'
    },
    {
      id: 'hot-guide-6',
      subjectId: 'subj-guide',
      name: '导游职业道德与行为规范',
      relatedChapters: ['guide-ch1'],
      frequency: '中',
      examTips: '导游职业道德的主要内容、文明导游规范、"十不准"等行为禁令。'
    },
    {
      id: 'hot-guide-7',
      subjectId: 'subj-guide',
      name: '出境领队服务规范',
      relatedChapters: ['guide-ch2'],
      frequency: '中',
      examTips: '出境旅游领队的职责、出入境手续办理、境外突发事件处理、游客文明旅游引导。'
    },

    // 全国导游基础知识
    {
      id: 'hot-nat-1',
      subjectId: 'subj-national',
      name: '中国古代建筑特征与等级制度',
      relatedChapters: ['nat-ch4'],
      frequency: '高',
      examTips: '古建筑的基本特征（木构架、庭院式布局等）、等级制度（屋顶形式、开间数、彩画等）、著名古建筑案例。'
    },
    {
      id: 'hot-nat-2',
      subjectId: 'subj-national',
      name: '中国古典园林的构景手法与代表园林',
      relatedChapters: ['nat-ch5'],
      frequency: '高',
      examTips: '借景、对景、框景、漏景、障景等构景手法，皇家园林与私家园林的对比，四大名园的特点。'
    },
    {
      id: 'hot-nat-3',
      subjectId: 'subj-national',
      name: '中国八大菜系与饮食文化',
      relatedChapters: ['nat-ch6'],
      frequency: '高',
      examTips: '八大菜系的名称、代表菜品、口味特点、发源地，以及茶文化、酒文化的分类与代表。'
    },
    {
      id: 'hot-nat-4',
      subjectId: 'subj-national',
      name: '中国宗教文化（佛教与道教）',
      relatedChapters: ['nat-ch3'],
      frequency: '高',
      examTips: '佛教四大名山、道教四大名山、佛教诸神体系、道教神仙谱系、宗教建筑特征。'
    },
    {
      id: 'hot-nat-5',
      subjectId: 'subj-national',
      name: '中国民族民俗与少数民族文化',
      relatedChapters: ['nat-ch2'],
      frequency: '中',
      examTips: '汉族传统节日、少数民族的分布、主要少数民族的民俗特色（服饰、饮食、节庆、禁忌）。'
    },
    {
      id: 'hot-nat-6',
      subjectId: 'subj-national',
      name: '中国历史重要事件与科技文化成就',
      relatedChapters: ['nat-ch1'],
      frequency: '中',
      examTips: '朝代更替口诀、四大发明、重要历史人物、中国近现代史重要节点。'
    },
    {
      id: 'hot-nat-7',
      subjectId: 'subj-national',
      name: '中国陶瓷与工艺美术',
      relatedChapters: ['nat-ch7'],
      frequency: '中',
      examTips: '景德镇四大名瓷、宜兴紫砂、四大名绣、三大名锦、文房四宝的代表产地与特点。'
    },

    // 地方导游基础知识
    {
      id: 'hot-local-1',
      subjectId: 'subj-local',
      name: '中国世界遗产的分布与特征',
      relatedChapters: ['local-ch8'],
      frequency: '高',
      examTips: '世界文化遗产/自然遗产/双遗产/文化景观的区分，各省世界遗产的分布，最新列入项目。'
    },
    {
      id: 'hot-local-2',
      subjectId: 'subj-local',
      name: '华东地区重点旅游城市与景区',
      relatedChapters: ['local-ch3'],
      frequency: '高',
      examTips: '上海、南京、杭州、苏州、黄山、武夷山、庐山、泰山等核心旅游资源的特色与地位。'
    },
    {
      id: 'hot-local-3',
      subjectId: 'subj-local',
      name: '西南地区旅游资源与少数民族文化',
      relatedChapters: ['local-ch5'],
      frequency: '高',
      examTips: '四川九寨沟、云南丽江古城、西藏布达拉宫、重庆大足石刻等，以及西南少数民族文化特色。'
    },
    {
      id: 'hot-local-4',
      subjectId: 'subj-local',
      name: '西北地区丝绸之路文化与旅游资源',
      relatedChapters: ['local-ch6'],
      frequency: '中',
      examTips: '陕西兵马俑、敦煌莫高窟、丝绸之路世界遗产、西北民族风情与特色美食。'
    },
    {
      id: 'hot-local-5',
      subjectId: 'subj-local',
      name: '华北地区古都文化与旅游资源',
      relatedChapters: ['local-ch1'],
      frequency: '中',
      examTips: '北京故宫与胡同文化、山西晋商文化与古建筑、内蒙古草原文化、河北承德避暑山庄。'
    },
    {
      id: 'hot-local-6',
      subjectId: 'subj-local',
      name: '5A级旅游景区与红色旅游',
      relatedChapters: ['local-ch8', 'local-ch9'],
      frequency: '中',
      examTips: '5A级景区的评定标准与分布规律、红色旅游经典景区（井冈山、延安、西柏坡、韶山等）。'
    },
    {
      id: 'hot-local-7',
      subjectId: 'subj-local',
      name: '港澳台旅游特色与主要景点',
      relatedChapters: ['local-ch7'],
      frequency: '中',
      examTips: '香港迪士尼与海洋公园、澳门历史城区与博彩文化、台湾日月潭与阿里山的基本概况。'
    },
    {
      id: 'hot-local-8',
      subjectId: 'subj-local',
      name: '乡村旅游与旅游新业态',
      relatedChapters: ['local-ch9'],
      frequency: '中',
      examTips: '乡村振兴背景下的乡村旅游发展、研学旅游、康养旅游、夜间经济等新业态的特点。'
    }
  ];

  // ============================================================
  // 导出为全局变量
  // ============================================================
  window.KNOWLEDGE_DATA = {
    /** 版本信息 */
    version: '1.0.0',
    updatedAt: '2026-07-09',

    /** 考试结构信息 */
    examStructure: examStructure,

    /** 四科详细章节知识点 */
    subjects: subjects,

    /** 面试评分标准 */
    interviewRubric: interviewRubric,

    /** 高频考点标记 */
    hotTopics: hotTopics,

    /** 辅助方法 */
    methods: {
      /**
       * 根据科目ID获取科目数据
       * @param {string} subjectId
       * @returns {object|undefined}
       */
      getSubjectById: function (subjectId) {
        return subjects.find(function (s) { return s.id === subjectId; });
      },

      /**
       * 根据章节ID获取章节数据（跨科目搜索）
       * @param {string} chapterId
       * @returns {object|undefined}
       */
      getChapterById: function (chapterId) {
        for (var i = 0; i < subjects.length; i++) {
          var chapters = subjects[i].chapters;
          for (var j = 0; j < chapters.length; j++) {
            if (chapters[j].id === chapterId) {
              return chapters[j];
            }
          }
        }
        return undefined;
      },

      /**
       * 获取指定科目的所有高频考点
       * @param {string} subjectId
       * @returns {Array}
       */
      getHotTopicsBySubject: function (subjectId) {
        return hotTopics.filter(function (t) { return t.subjectId === subjectId; });
      },

      /**
       * 获取指定频率等级的高频考点
       * @param {string} frequency - '高' 或 '中'
       * @returns {Array}
       */
      getHotTopicsByFrequency: function (frequency) {
        return hotTopics.filter(function (t) { return t.frequency === frequency; });
      },

      /**
       * 获取面试评分维度列表
       * @returns {Array}
       */
      getInterviewRubricDimensions: function () {
        return interviewRubric.dimensions;
      }
    }
  };
})();