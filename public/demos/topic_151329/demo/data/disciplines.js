/**
 * disciplines.js
 * 用途：专业词典，8大专业，移植自 disciplines.csv。
 * 挂载到 window.Disciplines。
 * 用于高级模式第一层"专业路由"，根据材料描述匹配对应专业，按优先级(priority)排序。
 */
window.Disciplines = [
    {id:'d001', code:'03', name:'工艺管道', includeCondition:'管道|管件|法兰|阀门|弯头|三通|异径管', excludeCondition:'电缆|电线|配电箱', priority:20, isEnabled:true, description:'工艺管道专业'},
    {id:'d002', code:'04', name:'电气', includeCondition:'电缆|电线|配电|灯具|开关|插座|桥架', excludeCondition:'管道|阀门', priority:20, isEnabled:true, description:'电气专业'},
    {id:'d003', code:'05', name:'仪表', includeCondition:'仪表|变送器|调节阀|传感器|流量计|压力计', excludeCondition:'', priority:15, isEnabled:true, description:'仪表专业'},
    {id:'d004', code:'01', name:'土建', includeCondition:'混凝土|钢筋|模板|脚手架|砌体|抹灰', excludeCondition:'', priority:15, isEnabled:true, description:'土建专业'},
    {id:'d005', code:'02', name:'工艺设备', includeCondition:'反应器|换热器|塔器|容器|泵|压缩机', excludeCondition:'', priority:15, isEnabled:true, description:'工艺设备专业'},
    {id:'d006', code:'06', name:'电信', includeCondition:'电话|广播|监控|对讲|巡检', excludeCondition:'', priority:10, isEnabled:true, description:'电信专业'},
    {id:'d007', code:'07', name:'暖通', includeCondition:'空调|通风|风机|风管|散热器', excludeCondition:'', priority:10, isEnabled:true, description:'暖通专业'},
    {id:'d008', code:'08', name:'消防', includeCondition:'消防|喷淋|灭火|火警|烟感', excludeCondition:'', priority:10, isEnabled:true, description:'消防专业'}
];
