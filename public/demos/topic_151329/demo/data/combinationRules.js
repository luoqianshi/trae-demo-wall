/**
 * combinationRules.js
 * 用途：组合规则，10条，移植自 combination_rules.csv。
 * 挂载到 window.CombinationRules。
 * 用于高级模式第三层"组合规则匹配"，基于已抽取的特征生成输出标签(Output)、
 * 冲突告警(Conflict)或默认值补齐(Default)。
 * ruleType 取值：Output（输出）、Conflict（冲突校验）、Default（默认补齐）。
 */
window.CombinationRules = [
    {id:'r001', name:'无缝碳钢管DN50清单', disciplineId:'d001', condition:'分类码=无缝碳钢管 & 尺寸=DN50', ruleType:'Output', outputLabel:'清单编码', outputValue:'03-2-3054', warningMessage:'', priority:20, isEnabled:true},
    {id:'r002', name:'无缝碳钢管DN100清单', disciplineId:'d001', condition:'分类码=无缝碳钢管 & 尺寸=DN100', ruleType:'Output', outputLabel:'清单编码', outputValue:'03-2-3055', warningMessage:'', priority:20, isEnabled:true},
    {id:'r003', name:'合金钢管清单', disciplineId:'d001', condition:'分类码=合金钢管', ruleType:'Output', outputLabel:'清单编码', outputValue:'03-2-3101', warningMessage:'', priority:20, isEnabled:true},
    {id:'r004', name:'低压高压冲突校验', disciplineId:'d001', condition:'分类码=低压管 & 管表号=SCH160', ruleType:'Conflict', outputLabel:'异常警告', outputValue:'', warningMessage:'低压分类配高压等级，数据异常', priority:30, isEnabled:true},
    {id:'r005', name:'无缝管材质默认补齐', disciplineId:'d001', condition:'!材质 & 分类码=无缝碳钢管', ruleType:'Default', outputLabel:'材质', outputValue:'20#', warningMessage:'', priority:15, isEnabled:true},
    {id:'r006', name:'定额章节生成', disciplineId:'d001', condition:'分类码=无缝碳钢管 & 材质=20# & 尺寸=DN50', ruleType:'Output', outputLabel:'定额章节', outputValue:'干粉煤气化P>>碳钢P>>P_CS无缝>>Sch40-100>>无特殊要求>>2-3054', warningMessage:'', priority:25, isEnabled:true},
    {id:'r007', name:'电缆清单', disciplineId:'d002', condition:'分类码=电力电缆', ruleType:'Output', outputLabel:'清单编码', outputValue:'04-1-1001', warningMessage:'', priority:20, isEnabled:true},
    {id:'r008', name:'配电箱清单', disciplineId:'d002', condition:'分类码=配电箱', ruleType:'Output', outputLabel:'清单编码', outputValue:'04-2-2001', warningMessage:'', priority:20, isEnabled:true},
    {id:'r009', name:'仪表变送器清单', disciplineId:'d003', condition:'分类码=变送器', ruleType:'Output', outputLabel:'清单编码', outputValue:'05-1-3001', warningMessage:'', priority:20, isEnabled:true},
    {id:'r010', name:'通用材质推断', disciplineId:'', condition:'!材质 & 分类码=无缝碳钢管', ruleType:'Default', outputLabel:'材质', outputValue:'20#', warningMessage:'', priority:10, isEnabled:true}
];
