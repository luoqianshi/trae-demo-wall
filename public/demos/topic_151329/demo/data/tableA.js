/**
 * tableA.js
 * 用途：AB表匹配模式 —— A表数据（10行待匹配材料）。
 * 挂载到 window.TableA。
 * A表为待查价材料清单，通过合并文本(mergedText)与B表价格库进行匹配。
 */
window.TableA = {
    columns:[
        {name:'行号', key:'rowIndex', numeric:true},
        {name:'材料名称', key:'name'},
        {name:'规格', key:'spec'},
        {name:'材质', key:'material'},
        {name:'分类码', key:'categoryCode'},
        {name:'合并文本', key:'mergedText'}
    ],
    rows:[
        {rowIndex:1, name:'无缝碳钢管', spec:'DN50', material:'20#', categoryCode:'无缝碳钢管', mergedText:'无缝碳钢管 DN50 20#'},
        {rowIndex:2, name:'无缝碳钢管', spec:'DN100', material:'20#', categoryCode:'无缝碳钢管', mergedText:'无缝碳钢管 DN100 20#'},
        {rowIndex:3, name:'无缝碳钢管', spec:'DN200', material:'20#', categoryCode:'无缝碳钢管', mergedText:'无缝碳钢管 DN200 20#'},
        {rowIndex:4, name:'合金钢管', spec:'DN150', material:'15CrMo', categoryCode:'合金钢管', mergedText:'合金钢管 DN150 15CrMo'},
        {rowIndex:5, name:'镀锌钢管', spec:'DN80', material:'Q235', categoryCode:'镀锌钢管', mergedText:'镀锌钢管 DN80 Q235'},
        {rowIndex:6, name:'电力电缆', spec:'YJV-3*95', material:'铜芯', categoryCode:'电力电缆', mergedText:'电力电缆 YJV-3*95 铜芯'},
        {rowIndex:7, name:'电力电缆', spec:'YJV-3*120', material:'铜芯', categoryCode:'电力电缆', mergedText:'电力电缆 YJV-3*120 铜芯'},
        {rowIndex:8, name:'配电箱', spec:'GGD-800A', material:'', categoryCode:'配电箱', mergedText:'配电箱 GGD-800A'},
        {rowIndex:9, name:'温度变送器', spec:'0-200℃', material:'', categoryCode:'变送器', mergedText:'温度变送器 0-200℃'},
        {rowIndex:10, name:'电磁流量计', spec:'DN50', material:'', categoryCode:'流量计', mergedText:'电磁流量计 DN50'}
    ]
};
