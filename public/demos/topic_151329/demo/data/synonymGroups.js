/**
 * synonymGroups.js
 * 用途：同义词组数据，用于快速模式中 $[主词] 语法展开匹配。
 * 挂载到 window.SynonymGroups。
 * 每组包含主词(mainWord)和同义词列表(synonyms)，命中任一同义词即视为匹配该组。
 */
window.SynonymGroups = [
    {name:'钢管', mainWord:'钢管', synonyms:['无缝钢管','焊接钢管','镀锌钢管','合金钢管']},
    {name:'电缆', mainWord:'电缆', synonyms:['电力电缆','控制电缆','通讯电缆']},
    {name:'变送器', mainWord:'变送器', synonyms:['温度变送器','压力变送器','流量变送器']}
];
