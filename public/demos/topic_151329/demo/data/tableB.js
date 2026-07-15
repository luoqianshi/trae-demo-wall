/**
 * tableB.js
 * 用途：AB表匹配模式 —— B表数据（25行价格库）。
 * 挂载到 window.TableB。
 * B表为价格参考库，包含材料名称、规格、材质、价格及日期，用于与A表匹配计算价格。
 * 价格区间 1000-8000 元，日期范围 2026-01 至 2026-06。
 */
window.TableB = {
    columns:[
        {name:'行号', key:'rowIndex', numeric:true},
        {name:'材料名称', key:'name'},
        {name:'规格', key:'spec'},
        {name:'材质', key:'material'},
        {name:'分类码', key:'categoryCode'},
        {name:'价格(元)', key:'price', numeric:true},
        {name:'日期', key:'date'},
        {name:'合并文本', key:'mergedText'}
    ],
    rows:[
        // 无缝碳钢管 DN50 20# —— 3条
        {rowIndex:1, name:'无缝碳钢管', spec:'DN50', material:'20#', categoryCode:'无缝碳钢管', price:5200, date:'2026-05-15', mergedText:'无缝碳钢管 DN50 20#'},
        {rowIndex:2, name:'无缝碳钢管', spec:'DN50', material:'20#', categoryCode:'无缝碳钢管', price:5250, date:'2026-03-20', mergedText:'无缝碳钢管 DN50 20#'},
        {rowIndex:3, name:'无缝碳钢管', spec:'DN50', material:'20#', categoryCode:'无缝碳钢管', price:5180, date:'2026-06-01', mergedText:'无缝碳钢管 DN50 20#'},
        // 无缝碳钢管 DN100 20# —— 3条
        {rowIndex:4, name:'无缝碳钢管', spec:'DN100', material:'20#', categoryCode:'无缝碳钢管', price:4800, date:'2026-04-10', mergedText:'无缝碳钢管 DN100 20#'},
        {rowIndex:5, name:'无缝碳钢管', spec:'DN100', material:'20#', categoryCode:'无缝碳钢管', price:4850, date:'2026-02-18', mergedText:'无缝碳钢管 DN100 20#'},
        {rowIndex:6, name:'无缝碳钢管', spec:'DN100', material:'20#', categoryCode:'无缝碳钢管', price:4780, date:'2026-06-05', mergedText:'无缝碳钢管 DN100 20#'},
        // 无缝碳钢管 DN200 20# —— 2条
        {rowIndex:7, name:'无缝碳钢管', spec:'DN200', material:'20#', categoryCode:'无缝碳钢管', price:4500, date:'2026-05-08', mergedText:'无缝碳钢管 DN200 20#'},
        {rowIndex:8, name:'无缝碳钢管', spec:'DN200', material:'20#', categoryCode:'无缝碳钢管', price:4550, date:'2026-03-25', mergedText:'无缝碳钢管 DN200 20#'},
        // 合金钢管 DN150 15CrMo —— 2条
        {rowIndex:9, name:'合金钢管', spec:'DN150', material:'15CrMo', categoryCode:'合金钢管', price:7800, date:'2026-04-20', mergedText:'合金钢管 DN150 15CrMo'},
        {rowIndex:10, name:'合金钢管', spec:'DN150', material:'15CrMo', categoryCode:'合金钢管', price:7750, date:'2026-06-12', mergedText:'合金钢管 DN150 15CrMo'},
        // 镀锌钢管 DN80 Q235 —— 2条
        {rowIndex:11, name:'镀锌钢管', spec:'DN80', material:'Q235', categoryCode:'镀锌钢管', price:3800, date:'2026-05-22', mergedText:'镀锌钢管 DN80 Q235'},
        {rowIndex:12, name:'镀锌钢管', spec:'DN80', material:'Q235', categoryCode:'镀锌钢管', price:3750, date:'2026-02-10', mergedText:'镀锌钢管 DN80 Q235'},
        // 电力电缆 YJV-3*95 铜芯 —— 2条
        {rowIndex:13, name:'电力电缆', spec:'YJV-3*95', material:'铜芯', categoryCode:'电力电缆', price:6500, date:'2026-04-15', mergedText:'电力电缆 YJV-3*95 铜芯'},
        {rowIndex:14, name:'电力电缆', spec:'YJV-3*95', material:'铜芯', categoryCode:'电力电缆', price:6450, date:'2026-06-08', mergedText:'电力电缆 YJV-3*95 铜芯'},
        // 电力电缆 YJV-3*120 铜芯 —— 2条
        {rowIndex:15, name:'电力电缆', spec:'YJV-3*120', material:'铜芯', categoryCode:'电力电缆', price:7200, date:'2026-03-18', mergedText:'电力电缆 YJV-3*120 铜芯'},
        {rowIndex:16, name:'电力电缆', spec:'YJV-3*120', material:'铜芯', categoryCode:'电力电缆', price:7250, date:'2026-05-30', mergedText:'电力电缆 YJV-3*120 铜芯'},
        // 配电箱 GGD-800A —— 2条
        {rowIndex:17, name:'配电箱', spec:'GGD-800A', material:'', categoryCode:'配电箱', price:3500, date:'2026-04-05', mergedText:'配电箱 GGD-800A'},
        {rowIndex:18, name:'配电箱', spec:'GGD-800A', material:'', categoryCode:'配电箱', price:3450, date:'2026-06-20', mergedText:'配电箱 GGD-800A'},
        // 温度变送器 0-200℃ —— 2条
        {rowIndex:19, name:'温度变送器', spec:'0-200℃', material:'', categoryCode:'变送器', price:2800, date:'2026-03-10', mergedText:'温度变送器 0-200℃'},
        {rowIndex:20, name:'温度变送器', spec:'0-200℃', material:'', categoryCode:'变送器', price:2850, date:'2026-05-25', mergedText:'温度变送器 0-200℃'},
        // 电磁流量计 DN50 —— 2条
        {rowIndex:21, name:'电磁流量计', spec:'DN50', material:'', categoryCode:'流量计', price:4200, date:'2026-02-28', mergedText:'电磁流量计 DN50'},
        {rowIndex:22, name:'电磁流量计', spec:'DN50', material:'', categoryCode:'流量计', price:4250, date:'2026-06-15', mergedText:'电磁流量计 DN50'},
        // 电缆桥架 400*100 镀锌 —— 3条
        {rowIndex:23, name:'电缆桥架', spec:'400*100', material:'镀锌', categoryCode:'桥架', price:1500, date:'2026-01-20', mergedText:'电缆桥架 400*100 镀锌'},
        {rowIndex:24, name:'电缆桥架', spec:'400*100', material:'镀锌', categoryCode:'桥架', price:1550, date:'2026-04-18', mergedText:'电缆桥架 400*100 镀锌'},
        {rowIndex:25, name:'电缆桥架', spec:'400*100', material:'镀锌', categoryCode:'桥架', price:1480, date:'2026-06-10', mergedText:'电缆桥架 400*100 镀锌'}
    ]
};
