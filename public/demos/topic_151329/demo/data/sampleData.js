/**
 * sampleData.js
 * 用途：快速模式示例数据，20行工程造价材料描述。
 * 挂载到 window.SampleData，包含列定义(columns)和数据行(rows)。
 * mergedText 字段是所有字段拼接的文本，用于规则匹配。
 */
window.SampleData = {
    // 列定义
    columns: [
        {name: '行号', key: 'rowIndex', width: 50, numeric: true},
        {name: '材料名称', key: 'name', width: 200},
        {name: '规格型号', key: 'spec', width: 150},
        {name: '材质', key: 'material', width: 100},
        {name: '单位', key: 'unit', width: 60},
        {name: '分类码', key: 'categoryCode', width: 150},
        {name: '管表号', key: 'pipeSchedule', width: 80},
        {name: '合并文本', key: 'mergedText', width: 300}
    ],
    // 数据行（mergedText 是所有字段拼接的文本，用于匹配）
    rows: [
        {rowIndex:1, name:'无缝碳钢管', spec:'DN50', material:'20#', unit:'吨', categoryCode:'P2201_a12_无缝碳钢管', pipeSchedule:'SCH40', mergedText:'单位:吨,规格:DN50,材质:20#GB/T8163,分类码:P2201_a12_无缝碳钢管,管表号:SCH40'},
        {rowIndex:2, name:'无缝碳钢管', spec:'DN100', material:'20#', unit:'吨', categoryCode:'P2201_a12_无缝碳钢管', pipeSchedule:'SCH60', mergedText:'单位:吨,规格:DN100,材质:20#GB/T8163,分类码:P2201_a12_无缝碳钢管,管表号:SCH60'},
        {rowIndex:3, name:'无缝碳钢管', spec:'DN200', material:'20#', unit:'吨', categoryCode:'P2201_a12_无缝碳钢管', pipeSchedule:'SCH60', mergedText:'单位:吨,规格:DN200,材质:20#GB/T8163,分类码:P2201_a12_无缝碳钢管,管表号:SCH60'},
        {rowIndex:4, name:'合金钢管', spec:'DN150', material:'15CrMo', unit:'吨', categoryCode:'P2202_b05_合金钢管', pipeSchedule:'SCH80', mergedText:'单位:吨,规格:DN150,材质:15CrMo,分类码:P2202_b05_合金钢管,管表号:SCH80'},
        {rowIndex:5, name:'镀锌钢管', spec:'DN80', material:'Q235', unit:'米', categoryCode:'P2203_c01_镀锌钢管', pipeSchedule:'SCH20', mergedText:'单位:米,规格:DN80,材质:Q235,分类码:P2203_c01_镀锌钢管,管表号:SCH20'},
        {rowIndex:6, name:'直缝焊接钢管', spec:'DN300', material:'Q345', unit:'米', categoryCode:'P2204_d02_焊接钢管', pipeSchedule:'SCH40', mergedText:'单位:米,规格:DN300,材质:Q345,分类码:P2204_d02_焊接钢管,管表号:SCH40'},
        {rowIndex:7, name:'电力电缆', spec:'YJV-3*95', material:'铜芯', unit:'米', categoryCode:'E1001_电力电缆', pipeSchedule:'', mergedText:'单位:米,规格:YJV-3*95,材质:铜芯,分类码:E1001_电力电缆'},
        {rowIndex:8, name:'电力电缆', spec:'YJV-3*120', material:'铜芯', unit:'米', categoryCode:'E1001_电力电缆', pipeSchedule:'', mergedText:'单位:米,规格:YJV-3*120,材质:铜芯,分类码:E1001_电力电缆'},
        {rowIndex:9, name:'配电箱', spec:'GGD-800A', material:'', unit:'台', categoryCode:'E2002_配电箱', pipeSchedule:'', mergedText:'单位:台,规格:GGD-800A,分类码:E2002_配电箱'},
        {rowIndex:10, name:'电缆桥架', spec:'400*100', material:'镀锌', unit:'米', categoryCode:'E3003_桥架', pipeSchedule:'', mergedText:'单位:米,规格:400*100,材质:镀锌,分类码:E3003_桥架,名称:电缆桥架'},
        {rowIndex:11, name:'LED灯具', spec:'100W', material:'', unit:'套', categoryCode:'E4004_灯具', pipeSchedule:'', mergedText:'单位:套,规格:100W,分类码:E4004_灯具,名称:LED灯具'},
        {rowIndex:12, name:'温度变送器', spec:'0-200℃', material:'', unit:'台', categoryCode:'I1001_变送器', pipeSchedule:'', mergedText:'单位:台,规格:0-200℃,分类码:I1001_变送器,名称:温度变送器'},
        {rowIndex:13, name:'电磁流量计', spec:'DN50', material:'', unit:'台', categoryCode:'I2002_流量计', pipeSchedule:'', mergedText:'单位:台,规格:DN50,分类码:I2002_流量计,名称:电磁流量计'},
        {rowIndex:14, name:'无缝碳钢管', spec:'DN321', material:'20#', unit:'吨', categoryCode:'P2201_a12_无缝碳钢管', pipeSchedule:'SCH40', mergedText:'单位:吨,规格:DN321,材质:20#,分类码:P2201_a12_无缝碳钢管,管表号:SCH40'},
        {rowIndex:15, name:'混凝土', spec:'C30', material:'', unit:'立方米', categoryCode:'C1001_混凝土', pipeSchedule:'', mergedText:'单位:立方米,规格:C30,分类码:C1001_混凝土,名称:混凝土'},
        {rowIndex:16, name:'钢筋', spec:'HRB400 Φ25', material:'', unit:'吨', categoryCode:'C2002_钢筋', pipeSchedule:'', mergedText:'单位:吨,规格:HRB400 Φ25,分类码:C2002_钢筋,名称:钢筋'},
        {rowIndex:17, name:'法兰', spec:'DN100 RF', material:'20#', unit:'片', categoryCode:'P3001_法兰', pipeSchedule:'', mergedText:'单位:片,规格:DN100 RF,材质:20#,分类码:P3001_法兰,名称:法兰'},
        {rowIndex:18, name:'阀门', spec:'Z41H-16C DN150', material:'铸钢', unit:'台', categoryCode:'P4001_阀门', pipeSchedule:'', mergedText:'单位:台,规格:Z41H-16C DN150,材质:铸钢,分类码:P4001_阀门,名称:阀门'},
        {rowIndex:19, name:'电缆桥架', spec:'200*60', material:'玻璃钢', unit:'米', categoryCode:'E3003_桥架', pipeSchedule:'', mergedText:'单位:米,规格:200*60,材质:玻璃钢,分类码:E3003_桥架,名称:电缆桥架'},
        {rowIndex:20, name:'压力变送器', spec:'0-1.6MPa', material:'', unit:'台', categoryCode:'I1001_变送器', pipeSchedule:'', mergedText:'单位:台,规格:0-1.6MPa,分类码:I1001_变送器,名称:压力变送器'}
    ]
};
