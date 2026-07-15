/**
 * funnelResults.js
 * 用途：预计算的三层解析结果（漏斗式），用于高级模式演示。
 * 挂载到 window.FunnelResults。
 * 不实现真实引擎，直接展示预设结果，与 sampleData.js 的数据行一一对应。
 * 每条结果包含：专业路由(discipline)、特征抽取(features)、组合规则输出(combinations)、
 * 告警(warnings)、推断(inferences)。
 */
window.FunnelResults = [
    // 第1行：无缝碳钢管 DN50 20# SCH40 → 工艺管道，清单03-2-3054 + 定额章节
    {
        row:1, inputText:'单位:吨,规格:DN50,材质:20#GB/T8163,分类码:P2201_a12_无缝碳钢管,管表号:SCH40',
        discipline:{name:'工艺管道', code:'03', matched:true},
        features:[
            {name:'CategoryCode', value:'无缝碳钢管'},
            {name:'Material', value:'20#'},
            {name:'Size', value:'DN50'},
            {name:'PipeSchedule', value:'SCH40'}
        ],
        combinations:[
            {label:'清单编码', value:'03-2-3054'},
            {label:'定额章节', value:'干粉煤气化P>>碳钢P>>P_CS无缝>>Sch40-100>>无特殊要求>>2-3054'}
        ],
        warnings:[],
        inferences:[]
    },
    // 第2行：无缝碳钢管 DN100 20# SCH60 → 工艺管道，清单03-2-3055
    {
        row:2, inputText:'单位:吨,规格:DN100,材质:20#GB/T8163,分类码:P2201_a12_无缝碳钢管,管表号:SCH60',
        discipline:{name:'工艺管道', code:'03', matched:true},
        features:[
            {name:'CategoryCode', value:'无缝碳钢管'},
            {name:'Material', value:'20#'},
            {name:'Size', value:'DN100'},
            {name:'PipeSchedule', value:'SCH60'}
        ],
        combinations:[
            {label:'清单编码', value:'03-2-3055'}
        ],
        warnings:[],
        inferences:[]
    },
    // 第3行：无缝碳钢管 DN200 20# SCH60 → 工艺管道，清单03-2-3056
    {
        row:3, inputText:'单位:吨,规格:DN200,材质:20#GB/T8163,分类码:P2201_a12_无缝碳钢管,管表号:SCH60',
        discipline:{name:'工艺管道', code:'03', matched:true},
        features:[
            {name:'CategoryCode', value:'无缝碳钢管'},
            {name:'Material', value:'20#'},
            {name:'Size', value:'DN200'},
            {name:'PipeSchedule', value:'SCH60'}
        ],
        combinations:[
            {label:'清单编码', value:'03-2-3056'}
        ],
        warnings:[],
        inferences:[]
    },
    // 第4行：合金钢管 DN150 15CrMo SCH80 → 工艺管道，清单03-2-3101
    {
        row:4, inputText:'单位:吨,规格:DN150,材质:15CrMo,分类码:P2202_b05_合金钢管,管表号:SCH80',
        discipline:{name:'工艺管道', code:'03', matched:true},
        features:[
            {name:'CategoryCode', value:'合金钢管'},
            {name:'Material', value:'15CrMo'},
            {name:'Size', value:'DN150'},
            {name:'PipeSchedule', value:'SCH80'}
        ],
        combinations:[
            {label:'清单编码', value:'03-2-3101'}
        ],
        warnings:[],
        inferences:[]
    },
    // 第5行：镀锌钢管 DN80 Q235 SCH20 → 工艺管道，无清单编码命中，特征已抽取
    {
        row:5, inputText:'单位:米,规格:DN80,材质:Q235,分类码:P2203_c01_镀锌钢管,管表号:SCH20',
        discipline:{name:'工艺管道', code:'03', matched:true},
        features:[
            {name:'CategoryCode', value:'镀锌钢管'},
            {name:'Material', value:'Q235'},
            {name:'Size', value:'DN80'},
            {name:'PipeSchedule', value:'SCH20'}
        ],
        combinations:[],
        warnings:[],
        inferences:[
            {label:'提示', value:'无匹配的组合规则，建议补充镀锌钢管清单编码规则'}
        ]
    },
    // 第7行：电力电缆 YJV-3*95 铜芯 → 电气，清单04-1-1001
    {
        row:7, inputText:'单位:米,规格:YJV-3*95,材质:铜芯,分类码:E1001_电力电缆',
        discipline:{name:'电气', code:'04', matched:true},
        features:[
            {name:'CategoryCode', value:'电力电缆'},
            {name:'Material', value:'铜芯'},
            {name:'Spec', value:'YJV-3*95'}
        ],
        combinations:[
            {label:'清单编码', value:'04-1-1001'}
        ],
        warnings:[],
        inferences:[]
    },
    // 第9行：配电箱 GGD-800A → 电气，清单04-2-2001
    {
        row:9, inputText:'单位:台,规格:GGD-800A,分类码:E2002_配电箱',
        discipline:{name:'电气', code:'04', matched:true},
        features:[
            {name:'CategoryCode', value:'配电箱'},
            {name:'Spec', value:'GGD-800A'}
        ],
        combinations:[
            {label:'清单编码', value:'04-2-2001'}
        ],
        warnings:[],
        inferences:[]
    },
    // 第10行：电缆桥架 400*100 镀锌 → 电气，注意专业路由可能误判
    {
        row:10, inputText:'单位:米,规格:400*100,材质:镀锌,分类码:E3003_桥架,名称:电缆桥架',
        discipline:{name:'电气', code:'04', matched:true},
        features:[
            {name:'CategoryCode', value:'桥架'},
            {name:'Material', value:'镀锌'},
            {name:'Spec', value:'400*100'}
        ],
        combinations:[],
        warnings:[
            {level:'warning', message:'电缆桥架含"电缆"字眼，可能被专业路由误判为电缆类；实际按分类码应为电气桥架，请人工复核专业归属'}
        ],
        inferences:[]
    },
    // 第12行：温度变送器 0-200℃ → 仪表，清单05-1-3001
    {
        row:12, inputText:'单位:台,规格:0-200℃,分类码:I1001_变送器,名称:温度变送器',
        discipline:{name:'仪表', code:'05', matched:true},
        features:[
            {name:'CategoryCode', value:'变送器'},
            {name:'Name', value:'温度变送器'},
            {name:'Spec', value:'0-200℃'}
        ],
        combinations:[
            {label:'清单编码', value:'05-1-3001'}
        ],
        warnings:[],
        inferences:[]
    },
    // 第15行：混凝土 C30 → 土建，无组合规则命中，仅特征抽取
    {
        row:15, inputText:'单位:立方米,规格:C30,分类码:C1001_混凝土,名称:混凝土',
        discipline:{name:'土建', code:'01', matched:true},
        features:[
            {name:'CategoryCode', value:'混凝土'},
            {name:'Spec', value:'C30'},
            {name:'Unit', value:'立方米'}
        ],
        combinations:[],
        warnings:[],
        inferences:[
            {label:'提示', value:'土建专业暂无组合规则配置，仅完成特征抽取'}
        ]
    }
];
