/**
 * quickRules.js
 * 用途：快速模式示例规则，8条，覆盖各种语法（与&、或|、非!、精确=、通配符*、正则regex:、同义词$[]、左边界`）。
 * 挂载到 window.QuickRules。
 * 注意：r6 的正则在 JS 字符串中 \\d 表示 \d；r8 用反引号 ` 标记左边界。
 */
window.QuickRules = [
    {id:'r1', name:'小口径无缝管', includeCondition:'无缝钢管 & DN50', excludeCondition:'', returnValue:'小口径无缝管', caseSensitive:false, isEnabled:true},
    {id:'r2', name:'金属管材', includeCondition:'钢管 | 铜管', excludeCondition:'', returnValue:'金属管材', caseSensitive:false, isEnabled:true},
    {id:'r3', name:'非电缆管道', includeCondition:'管道', excludeCondition:'电缆', returnValue:'非电缆管道', caseSensitive:false, isEnabled:true},
    {id:'r4', name:'DN200规格', includeCondition:'=DN200', excludeCondition:'', returnValue:'DN200规格', caseSensitive:false, isEnabled:true},
    {id:'r5', name:'无缝系列', includeCondition:'无缝*', excludeCondition:'', returnValue:'无缝系列', caseSensitive:false, isEnabled:true},
    {id:'r6', name:'含四位数字', includeCondition:'regex:\\d{4}', excludeCondition:'', returnValue:'含四位数字', caseSensitive:false, isEnabled:true},
    {id:'r7', name:'钢管类(同义词)', includeCondition:'$[钢管]', excludeCondition:'', returnValue:'钢管类', caseSensitive:false, isEnabled:true},
    {id:'r8', name:'边界测试321', includeCondition:'`321', excludeCondition:'', returnValue:'边界321', caseSensitive:false, isEnabled:true}
];
