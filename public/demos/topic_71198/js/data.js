// ===== 导路 - 数据模块 =====

// 演示数据集
const demoDatasets = {
  nursing: [
    {name:'王思涵',sid:'2024030101',major:'护理',cls:'护理2401',enroll:'2024-09',attend:95,hw:92,avg:85,level:'normal',grades:[78,82,85,88,85],attTrend:[93,94,95,96,95],attendanceHistory:[93,94,95,96,95],scoreHistory:[78,82,85,88,85]},
    {name:'张浩然',sid:'2024030102',major:'护理',cls:'护理2401',enroll:'2024-09',attend:62,hw:55,avg:45,level:'red',grades:[50,48,42,40,45],attTrend:[70,65,60,58,62],attendanceHistory:[70,65,60,58,62],scoreHistory:[50,48,42,40,45]},
    {name:'刘俊杰',sid:'2024030201',major:'药学',cls:'药学2401',enroll:'2024-09',attend:74,hw:68,avg:55,level:'orange',grades:[60,58,54,52,55],attTrend:[78,76,74,72,74],attendanceHistory:[78,76,74,72,74],scoreHistory:[60,58,54,52,55]},
    {name:'陈雨婷',sid:'2024030202',major:'药学',cls:'药学2401',enroll:'2024-09',attend:88,hw:90,avg:78,level:'normal',grades:[72,75,78,80,78],attTrend:[85,86,88,89,88],attendanceHistory:[85,86,88,89,88],scoreHistory:[72,75,78,80,78]},
    {name:'赵明轩',sid:'2024030301',major:'临床医学',cls:'临床2401',enroll:'2024-09',attend:58,hw:42,avg:38,level:'red',grades:[45,40,38,35,38],attTrend:[65,60,55,50,58],attendanceHistory:[65,60,55,50,58],scoreHistory:[45,40,38,35,38]},
    {name:'孙晓燕',sid:'2024030302',major:'临床医学',cls:'临床2401',enroll:'2024-09',attend:82,hw:78,avg:62,level:'blue',grades:[58,60,62,65,62],attTrend:[80,81,82,83,82],attendanceHistory:[80,81,82,83,82],scoreHistory:[58,60,62,65,62]},
    {name:'周子豪',sid:'2024030401',major:'康复治疗',cls:'康复2401',enroll:'2024-09',attend:71,hw:65,avg:52,level:'orange',grades:[55,53,51,50,52],attTrend:[75,73,71,70,71],attendanceHistory:[75,73,71,70,71],scoreHistory:[55,53,51,50,52]},
    {name:'吴佳琪',sid:'2024030402',major:'康复治疗',cls:'康复2401',enroll:'2024-09',attend:96,hw:95,avg:91,level:'normal',grades:[85,88,90,92,91],attTrend:[94,95,96,96,96],attendanceHistory:[94,95,96,96,96],scoreHistory:[85,88,90,92,91]},
    {name:'李文博',sid:'2024030103',major:'护理',cls:'护理2401',enroll:'2024-09',attend:65,hw:60,avg:48,level:'red',grades:[52,50,46,44,48],attTrend:[72,68,65,62,65],attendanceHistory:[72,68,65,62,65],scoreHistory:[52,50,46,44,48]},
    {name:'黄雅琴',sid:'2024030203',major:'药学',cls:'药学2401',enroll:'2024-09',attend:85,hw:82,avg:68,level:'blue',grades:[62,65,68,70,68],attTrend:[82,83,85,86,85],attendanceHistory:[82,83,85,86,85],scoreHistory:[62,65,68,70,68]},
    {name:'杨志远',sid:'2024030303',major:'临床医学',cls:'临床2401',enroll:'2024-09',attend:92,hw:88,avg:82,level:'normal',grades:[76,79,82,84,82],attTrend:[90,91,92,93,92],attendanceHistory:[90,91,92,93,92],scoreHistory:[76,79,82,84,82]},
    {name:'林美玲',sid:'2024030403',major:'康复治疗',cls:'康复2401',enroll:'2024-09',attend:77,hw:72,avg:58,level:'orange',grades:[60,58,56,55,58],attTrend:[80,78,77,76,77],attendanceHistory:[80,78,77,76,77],scoreHistory:[60,58,56,55,58]},
    {name:'郑凯文',sid:'2024030104',major:'护理',cls:'护理2402',enroll:'2024-09',attend:68,hw:63,avg:51,level:'orange',grades:[55,53,50,48,51],attTrend:[74,72,70,68,68],attendanceHistory:[74,72,70,68,68],scoreHistory:[55,53,50,48,51]},
    {name:'何雨萱',sid:'2024030204',major:'药学',cls:'药学2402',enroll:'2024-09',attend:89,hw:86,avg:75,level:'normal',grades:[68,71,74,76,75],attTrend:[86,87,88,89,89],attendanceHistory:[86,87,88,89,89],scoreHistory:[68,71,74,76,75]},
    {name:'马天宇',sid:'2024030304',major:'临床医学',cls:'临床2402',enroll:'2024-09',attend:55,hw:40,avg:35,level:'red',grades:[42,38,35,32,35],attTrend:[62,58,55,50,55],attendanceHistory:[62,58,55,50,55],scoreHistory:[42,38,35,32,35]},
    {name:'徐梦瑶',sid:'2024030404',major:'康复治疗',cls:'康复2402',enroll:'2024-09',attend:84,hw:80,avg:66,level:'blue',grades:[60,62,64,66,66],attTrend:[82,83,84,85,84],attendanceHistory:[82,83,84,85,84],scoreHistory:[60,62,64,66,66]},
    {name:'胡嘉辉',sid:'2024030105',major:'护理',cls:'护理2402',enroll:'2024-09',attend:93,hw:91,avg:88,level:'normal',grades:[80,83,86,88,88],attTrend:[91,92,93,94,93],attendanceHistory:[91,92,93,94,93],scoreHistory:[80,83,86,88,88]},
    {name:'高诗涵',sid:'2024030205',major:'药学',cls:'药学2402',enroll:'2024-09',attend:76,hw:70,avg:56,level:'orange',grades:[58,56,54,53,56],attTrend:[78,77,76,75,76],attendanceHistory:[78,77,76,75,76],scoreHistory:[58,56,54,53,56]},
    {name:'罗逸飞',sid:'2024030305',major:'临床医学',cls:'临床2402',enroll:'2024-09',attend:87,hw:84,avg:72,level:'normal',grades:[65,68,71,74,72],attTrend:[84,85,87,88,87],attendanceHistory:[84,85,87,88,87],scoreHistory:[65,68,71,74,72]},
    {name:'谢心怡',sid:'2024030405',major:'康复治疗',cls:'康复2402',enroll:'2024-09',attend:60,hw:50,avg:42,level:'red',grades:[50,46,44,40,42],attTrend:[68,64,60,58,60],attendanceHistory:[68,64,60,58,60],scoreHistory:[50,46,44,40,42]}
  ],
  it: [
    {name:'陈浩宇',sid:'2024050101',major:'计算机应用',cls:'计应2401',enroll:'2024-09',attend:92,hw:88,avg:84,level:'normal',grades:[78,80,84,86,84],attTrend:[88,90,92,93,92],attendanceHistory:[88,90,92,93,92],scoreHistory:[78,80,84,86,84]},
    {name:'林子涵',sid:'2024050102',major:'计算机应用',cls:'计应2401',enroll:'2024-09',attend:58,hw:45,avg:38,level:'red',grades:[42,40,36,35,38],attTrend:[65,60,55,52,58],attendanceHistory:[65,60,55,52,58],scoreHistory:[42,40,36,35,38]},
    {name:'王雨桐',sid:'2024050201',major:'软件技术',cls:'软技2401',enroll:'2024-09',attend:85,hw:82,avg:72,level:'normal',grades:[65,68,72,75,72],attTrend:[82,83,85,86,85],attendanceHistory:[82,83,85,86,85],scoreHistory:[65,68,72,75,72]},
    {name:'李明辉',sid:'2024050202',major:'软件技术',cls:'软技2401',enroll:'2024-09',attend:70,hw:62,avg:52,level:'orange',grades:[55,53,50,48,52],attTrend:[75,73,70,68,70],attendanceHistory:[75,73,70,68,70],scoreHistory:[55,53,50,48,52]},
    {name:'张晓琳',sid:'2024050301',major:'网络技术',cls:'网技2401',enroll:'2024-09',attend:95,hw:94,avg:90,level:'normal',grades:[85,88,90,92,90],attTrend:[92,93,95,96,95],attendanceHistory:[92,93,95,96,95],scoreHistory:[85,88,90,92,90]},
    {name:'赵伟强',sid:'2024050302',major:'网络技术',cls:'网技2401',enroll:'2024-09',attend:63,hw:55,avg:46,level:'red',grades:[50,48,44,42,46],attTrend:[68,65,62,58,63],attendanceHistory:[68,65,62,58,63],scoreHistory:[50,48,44,42,46]},
    {name:'刘思琪',sid:'2024050103',major:'计算机应用',cls:'计应2402',enroll:'2024-09',attend:78,hw:75,avg:64,level:'blue',grades:[58,60,64,67,64],attTrend:[76,77,78,79,78],attendanceHistory:[76,77,78,79,78],scoreHistory:[58,60,64,67,64]},
    {name:'周子轩',sid:'2024050203',major:'软件技术',cls:'软技2402',enroll:'2024-09',attend:88,hw:85,avg:76,level:'normal',grades:[70,73,76,78,76],attTrend:[85,86,88,89,88],attendanceHistory:[85,86,88,89,88],scoreHistory:[70,73,76,78,76]},
    {name:'吴佳怡',sid:'2024050303',major:'网络技术',cls:'网技2402',enroll:'2024-09',attend:72,hw:68,avg:58,level:'orange',grades:[60,58,56,55,58],attTrend:[75,74,72,70,72],attendanceHistory:[75,74,72,70,72],scoreHistory:[60,58,56,55,58]},
    {name:'郑凯文',sid:'2024050104',major:'计算机应用',cls:'计应2402',enroll:'2024-09',attend:91,hw:89,avg:86,level:'normal',grades:[80,83,86,88,86],attTrend:[88,89,91,92,91],attendanceHistory:[88,89,91,92,91],scoreHistory:[80,83,86,88,86]},
    {name:'何雨萱',sid:'2024050204',major:'软件技术',cls:'软技2402',enroll:'2024-09',attend:67,hw:58,avg:48,level:'red',grades:[52,50,46,44,48],attTrend:[72,68,65,62,67],attendanceHistory:[72,68,65,62,67],scoreHistory:[52,50,46,44,48]},
    {name:'马天宇',sid:'2024050304',major:'网络技术',cls:'网技2402',enroll:'2024-09',attend:83,hw:80,avg:70,level:'blue',grades:[64,66,70,72,70],attTrend:[80,81,83,84,83],attendanceHistory:[80,81,83,84,83],scoreHistory:[64,66,70,72,70]},
    {name:'徐梦瑶',sid:'2024050105',major:'计算机应用',cls:'计应2403',enroll:'2024-09',attend:96,hw:95,avg:92,level:'normal',grades:[88,90,92,94,92],attTrend:[94,95,96,97,96],attendanceHistory:[94,95,96,97,96],scoreHistory:[88,90,92,94,92]},
    {name:'胡嘉辉',sid:'2024050205',major:'软件技术',cls:'软技2403',enroll:'2024-09',attend:74,hw:70,avg:60,level:'orange',grades:[62,60,58,57,60],attTrend:[76,75,74,72,74],attendanceHistory:[76,75,74,72,74],scoreHistory:[62,60,58,57,60]},
    {name:'高诗涵',sid:'2024050305',major:'网络技术',cls:'网技2403',enroll:'2024-09',attend:89,hw:87,avg:79,level:'normal',grades:[73,76,79,81,79],attTrend:[86,87,89,90,89],attendanceHistory:[86,87,89,90,89],scoreHistory:[73,76,79,81,79]}
  ],
  business: [
    {name:'张雅琪',sid:'2024060101',major:'会计',cls:'会计2401',enroll:'2024-09',attend:94,hw:92,avg:88,level:'normal',grades:[82,85,88,90,88],attTrend:[90,92,94,95,94],attendanceHistory:[90,92,94,95,94],scoreHistory:[82,85,88,90,88]},
    {name:'李志强',sid:'2024060102',major:'会计',cls:'会计2401',enroll:'2024-09',attend:60,hw:50,avg:42,level:'red',grades:[48,45,42,40,42],attTrend:[68,64,60,58,60],attendanceHistory:[68,64,60,58,60],scoreHistory:[48,45,42,40,42]},
    {name:'王雨薇',sid:'2024060201',major:'市场营销',cls:'营销2401',enroll:'2024-09',attend:87,hw:84,avg:76,level:'normal',grades:[70,73,76,78,76],attTrend:[84,85,87,88,87],attendanceHistory:[84,85,87,88,87],scoreHistory:[70,73,76,78,76]},
    {name:'赵子豪',sid:'2024060202',major:'市场营销',cls:'营销2401',enroll:'2024-09',attend:73,hw:66,avg:56,level:'orange',grades:[58,56,54,53,56],attTrend:[76,75,73,71,73],attendanceHistory:[76,75,73,71,73],scoreHistory:[58,56,54,53,56]},
    {name:'刘思颖',sid:'2024060301',major:'电子商务',cls:'电商2401',enroll:'2024-09',attend:91,hw:89,avg:85,level:'normal',grades:[79,82,85,87,85],attTrend:[88,89,91,92,91],attendanceHistory:[88,89,91,92,91],scoreHistory:[79,82,85,87,85]},
    {name:'陈俊杰',sid:'2024060302',major:'电子商务',cls:'电商2401',enroll:'2024-09',attend:56,hw:42,avg:35,level:'red',grades:[42,38,35,32,35],attTrend:[62,58,55,50,56],attendanceHistory:[62,58,55,50,56],scoreHistory:[42,38,35,32,35]},
    {name:'周雨萱',sid:'2024060103',major:'会计',cls:'会计2402',enroll:'2024-09',attend:80,hw:76,avg:66,level:'blue',grades:[60,62,66,69,66],attTrend:[78,79,80,81,80],attendanceHistory:[78,79,80,81,80],scoreHistory:[60,62,66,69,66]},
    {name:'吴佳琪',sid:'2024060203',major:'市场营销',cls:'营销2402',enroll:'2024-09',attend:93,hw:91,avg:87,level:'normal',grades:[81,84,87,89,87],attTrend:[89,90,93,94,93],attendanceHistory:[89,90,93,94,93],scoreHistory:[81,84,87,89,87]},
    {name:'郑伟强',sid:'2024060303',major:'电子商务',cls:'电商2402',enroll:'2024-09',attend:69,hw:62,avg:52,level:'orange',grades:[55,53,50,48,52],attTrend:[72,70,69,67,69],attendanceHistory:[72,70,69,67,69],scoreHistory:[55,53,50,48,52]},
    {name:'何雅婷',sid:'2024060104',major:'会计',cls:'会计2402',enroll:'2024-09',attend:85,hw:82,avg:74,level:'normal',grades:[68,71,74,76,74],attTrend:[82,83,85,86,85],attendanceHistory:[82,83,85,86,85],scoreHistory:[68,71,74,76,74]},
    {name:'马子轩',sid:'2024060204',major:'市场营销',cls:'营销2403',enroll:'2024-09',attend:77,hw:72,avg:62,level:'blue',grades:[56,58,62,65,62],attTrend:[74,75,77,78,77],attendanceHistory:[74,75,77,78,77],scoreHistory:[56,58,62,65,62]},
    {name:'徐梦琪',sid:'2024060304',major:'电子商务',cls:'电商2403',enroll:'2024-09',attend:90,hw:88,avg:82,level:'normal',grades:[76,79,82,84,82],attTrend:[86,87,90,91,90],attendanceHistory:[86,87,90,91,90],scoreHistory:[76,79,82,84,82]},
    {name:'胡志强',sid:'2024060105',major:'会计',cls:'会计2403',enroll:'2024-09',attend:65,hw:58,avg:48,level:'red',grades:[52,50,46,44,48],attTrend:[70,66,63,60,65],attendanceHistory:[70,66,63,60,65],scoreHistory:[52,50,46,44,48]},
    {name:'高雨桐',sid:'2024060205',major:'市场营销',cls:'营销2403',enroll:'2024-09',attend:82,hw:78,avg:68,level:'blue',grades:[62,64,68,71,68],attTrend:[78,79,82,83,82],attendanceHistory:[78,79,82,83,82],scoreHistory:[62,64,68,71,68]},
    {name:'罗佳怡',sid:'2024060305',major:'电子商务',cls:'电商2403',enroll:'2024-09',attend:95,hw:94,avg:91,level:'normal',grades:[87,89,91,93,91],attTrend:[92,93,95,96,95],attendanceHistory:[92,93,95,96,95],scoreHistory:[87,89,91,93,91]}
  ]
};

// 当前使用的数据集
let students = [];
let currentDataset = 'nursing';

function loadDataset(key) {
  if (!demoDatasets[key]) return;
  currentDataset = key;
  students = JSON.parse(JSON.stringify(demoDatasets[key]));
  // 重新计算level
  students.forEach(s => { s.level = getLevel(s); });
  // 保存到localStorage
  try {
    localStorage.setItem('daolu_dataset', key);
  } catch(e){}
}

function getLevel(s) {
  if (s.attend < 70 || s.avg < 50) return 'red';
  if (s.attend < 80 || s.avg < 60) return 'orange';
  if (s.attend < 90 || s.avg < 70) return 'blue';
  return 'normal';
}

const levelMap = { red: '红色预警', orange: '橙色预警', blue: '蓝色关注', normal: '正常' };
const badgeMap = { red: 'badge-red', orange: 'badge-orange', blue: 'badge-blue', normal: 'badge-green' };

// 尝试从localStorage恢复
function initData() {
  let saved = null;
  try {
    saved = localStorage.getItem('daolu_dataset');
  } catch(e) {}
  loadDataset(saved && demoDatasets[saved] ? saved : 'nursing');
  // 恢复自定义学生数据（如果有）
  try {
    var custom = localStorage.getItem('daolu_custom_students');
    if (custom) {
      var parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        students = parsed;
      }
    }
  } catch(e) {}
}

// 导出数据
function exportData() {
  const data = {
    students: students,
    dataset: currentDataset,
    exportTime: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '导路数据_' + new Date().toLocaleDateString() + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('success', '数据导出成功');
}

// 导入数据
function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.students && Array.isArray(data.students)) {
        students = data.students;
        if (data.dataset) currentDataset = data.dataset;
        renderTable('all');
        updateStats();
        showToast('success', '数据导入成功，共 ' + students.length + ' 条记录');
      } else {
        showToast('error', '数据格式不正确');
      }
    } catch(err) {
      showToast('error', '解析失败：' + err.message);
    }
  };
  reader.readAsText(file);
}

// ===== 成长档案数据 =====
const profileTemplates = {
  nursing: [
    {name:'王思涵',sid:'2024030101',meta:'2024030101 | 护理专业 | 护理2401班 | 2024年入学',initial:'王',radar:[85,95,92,78,80],grades:[78,82,85,88,85],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-10',content:'期末表现优秀，课堂参与积极，临床实践能力强，建议继续提升科研素养。'},{time:'2024-11-15',content:'期中成绩稳定上升，出勤表现优异，团队合作能力突出，被评为班级之星。'},{time:'2024-09-20',content:'入学适应良好，学习态度端正，建议多参加学术讲座拓展视野。'}],
     career:{direction:'临床护理 / 护理管理 / 专科护士（ICU/手术室）',certs:'护士执业资格证、护师资格证、专科护士培训证书',match:'三甲医院临床护士（匹配度92%）、社区护理中心（85%）、养老机构（78%）',path:'第一阶段：完成学业并考取护士执业资格证 → 第二阶段：进入三甲医院实习积累临床经验 → 第三阶段：选择专科方向深造（ICU/手术室/肿瘤护理） → 第四阶段：考取护师资格，向护理管理岗位发展'}},
    {name:'刘俊杰',sid:'2024030201',meta:'2024030201 | 药学专业 | 药学2401班 | 2024年入学',initial:'刘',radar:[55,74,68,60,65],grades:[60,58,54,52,55],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-08',content:'成绩有所下滑，需要加强基础课程学习，建议参加课后辅导。'},{time:'2024-11-10',content:'出勤率偏低，已进行一次谈话，了解到学习方法有问题，正在调整。'},{time:'2024-09-25',content:'入学初期表现一般，需要更多关注和引导，已安排学习伙伴。'}],
     career:{direction:'药店药剂师 / 医药代表 / 药品检验',certs:'执业药师资格证、医药商品购销员证、GSP培训证书',match:'连锁药店药剂师（匹配度75%）、医药公司销售（68%）、药品质检员（62%）',path:'第一阶段：稳定学业成绩，加强药物化学和药理学学习 → 第二阶段：考取医药商品购销员证，积累实践经验 → 第三阶段：毕业前备考执业药师资格证 → 第四阶段：根据兴趣选择药店药剂师或医药代表方向'}},
    {name:'陈雨婷',sid:'2024030202',meta:'2024030202 | 药学专业 | 药学2401班 | 2024年入学',initial:'陈',radar:[78,88,90,82,85],grades:[72,75,78,80,78],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-12',content:'学期整体表现良好，实验操作能力优秀，建议加强理论知识的系统性学习。'},{time:'2024-11-18',content:'期中成绩稳步提升，积极参与实验室工作，表现出了较强的专业兴趣。'},{time:'2024-09-22',content:'入学适应快，性格开朗，与同学相处融洽，建议发挥带头作用帮助后进同学。'}],
     career:{direction:'临床药师 / 药品研发 / 医药电商运营',certs:'执业药师资格证、临床药师培训证书、GCP证书',match:'医院临床药师（匹配度88%）、制药企业研发助理（82%）、医药电商平台（75%）',path:'第一阶段：保持优异成绩，重点学习临床药学和药物分析 → 第二阶段：参加药企实习，了解药品研发流程 → 第三阶段：考取执业药师资格证 → 第四阶段：攻读临床药师方向或进入制药企业从事研发工作'}}
  ],
  it: [
    {name:'陈浩宇',sid:'2024050101',meta:'2024050101 | 计算机应用 | 计应2401班 | 2024年入学',initial:'陈',radar:[82,92,88,85,80],grades:[78,80,84,86,84],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-10',content:'编程能力突出，项目实践完成度高，建议参加编程竞赛。'},{time:'2024-11-15',content:'期中项目展示优秀，团队协作能力强，被评为技术骨干。'},{time:'2024-09-20',content:'入学适应良好，对编程有浓厚兴趣，建议系统学习算法。'}],
     career:{direction:'前端开发 / 后端开发 / 全栈工程师',certs:'软件设计师、AWS/Azure认证、PMP',match:'互联网前端开发（匹配度90%）、Java后端开发（88%）、全栈工程师（85%）',path:'第一阶段：夯实编程基础，掌握主流框架 → 第二阶段：参与开源项目或企业实习 → 第三阶段：考取相关技术认证 → 第四阶段：进入互联网或软件企业'}},
    {name:'林子涵',sid:'2024050102',meta:'2024050102 | 计算机应用 | 计应2401班 | 2024年入学',initial:'林',radar:[42,58,48,45,50],grades:[42,40,36,35,38],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-08',content:'学习态度需改善，缺勤较多，已约谈并制定改进计划。'},{time:'2024-11-10',content:'期中成绩不理想，已安排学习伙伴帮扶。'},{time:'2024-09-25',content:'入学初期表现一般，需加强基础课程学习。'}],
     career:{direction:'IT运维 / 技术支持 / 网络管理',certs:'网络工程师、华为HCIA、软考初级',match:'企业IT运维（匹配度70%）、技术支持工程师（65%）、网络管理员（60%）',path:'第一阶段：稳定学业，补修薄弱课程 → 第二阶段：考取基础IT认证 → 第三阶段：参加企业实习 → 第四阶段：根据兴趣选择运维或技术支持方向'}},
    {name:'王雨桐',sid:'2024050201',meta:'2024050201 | 软件技术 | 软技2401班 | 2024年入学',initial:'王',radar:[72,85,82,78,75],grades:[65,68,72,75,72],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-12',content:'整体表现良好，项目文档编写规范，建议提升代码质量。'},{time:'2024-11-18',content:'期中表现稳定，团队合作积极，沟通能力优秀。'},{time:'2024-09-22',content:'入学适应快，学习态度端正，建议多参加技术分享。'}],
     career:{direction:'软件测试 / 产品经理 / 项目经理',certs:'软件测试工程师、PMP、NPDP',match:'软件测试工程师（匹配度85%）、产品经理助理（80%）、项目经理（75%）',path:'第一阶段：掌握软件测试方法论 → 第二阶段：参与实际项目测试 → 第三阶段：考取相关认证 → 第四阶段：向测试主管或产品方向发展'}}
  ],
  business: [
    {name:'张雅琪',sid:'2024060101',meta:'2024060101 | 会计 | 会计2401班 | 2024年入学',initial:'张',radar:[88,94,92,85,90],grades:[82,85,88,90,88],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-10',content:'会计核算能力突出，实训操作规范，建议备考初级会计职称。'},{time:'2024-11-15',content:'期中成绩优异，担任班级学习委员，组织能力强。'},{time:'2024-09-20',content:'入学表现优秀，数字敏感度高，建议参加会计技能竞赛。'}],
     career:{direction:'注册会计师 / 税务师 / 财务分析师',certs:'初级会计职称、CPA、税务师',match:'企业财务专员（匹配度95%）、会计师事务所审计助理（90%）、税务师事务所（85%）',path:'第一阶段：考取初级会计职称 → 第二阶段：进入企业或事务所实习 → 第三阶段：备考CPA → 第四阶段：向财务主管或审计经理发展'}},
    {name:'李志强',sid:'2024060102',meta:'2024060102 | 会计 | 会计2401班 | 2024年入学',initial:'李',radar:[42,60,50,48,45],grades:[48,45,42,40,42],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-08',content:'基础薄弱，缺勤较多，已制定补修计划和帮扶方案。'},{time:'2024-11-10',content:'期中成绩不理想，已安排一对一辅导。'},{time:'2024-09-25',content:'入学适应较慢，需加强基础会计知识学习。'}],
     career:{direction:'出纳 / 财务助理 / 收银主管',certs:'会计从业资格证、初级会计职称',match:'企业出纳（匹配度70%）、财务助理（65%）、收银主管（60%）',path:'第一阶段：补修基础课程，考取从业资格证 → 第二阶段：参加企业财务部门实习 → 第三阶段：考取初级职称 → 第四阶段：向财务专员发展'}},
    {name:'王雨薇',sid:'2024060201',meta:'2024060201 | 市场营销 | 营销2401班 | 2024年入学',initial:'王',radar:[76,87,84,80,78],grades:[70,73,76,78,76],labels:['第一周','第二周','第三周','第四周','第五周'],
     timeline:[{time:'2025-01-12',content:'营销策划能力突出，课堂展示表现优秀，建议参加营销大赛。'},{time:'2024-11-18',content:'期中表现良好，团队协作能力强，创意方案获奖。'},{time:'2024-09-22',content:'入学适应快，沟通能力强，建议多参加实践活动。'}],
     career:{direction:'市场专员 / 品牌策划 / 销售主管',certs:'营销师、电子商务师、PMP',match:'企业市场专员（匹配度88%）、品牌策划助理（85%）、销售主管（80%）',path:'第一阶段：掌握营销理论和工具 → 第二阶段：参加企业市场部实习 → 第三阶段：考取营销师资格 → 第四阶段：向市场经理或品牌总监发展'}}
  ]
};

let profiles = [];

function loadProfiles(datasetKey) {
  profiles = profileTemplates[datasetKey] || profileTemplates['nursing'];
}

// 职业画像数据
// ===== AI预测性干预 =====

// 基于简单线性回归预测下一周数据（最小二乘法）
function predictRisk(history) {
  var n = history.length;
  if (n < 2) return history[0] || 0;
  var sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (var i = 0; i < n; i++) {
    var x = i + 1;
    var y = history[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }
  var denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return history[n - 1];
  var a = (n * sumXY - sumX * sumY) / denominator; // 斜率
  var b = (sumY * sumXX - sumX * sumXY) / denominator; // 截距
  var predicted = a * (n + 1) + b; // 预测第n+1周
  return Math.max(0, Math.min(100, Math.round(predicted * 10) / 10));
}

// 计算风险评分（0-100分）
function calculateRiskScore(student) {
  var score = 0;
  var attHistory = student.attendanceHistory || student.attTrend || [];
  var scrHistory = student.scoreHistory || student.grades || [];

  // 出勤率趋势权重 30%：连续下降每周+15分
  var attTrendScore = 0;
  var attDeclineWeeks = 0;
  for (var i = 1; i < attHistory.length; i++) {
    if (attHistory[i] < attHistory[i - 1]) attDeclineWeeks++;
    else attDeclineWeeks = 0;
  }
  attTrendScore = Math.min(30, attDeclineWeeks * 15);

  // 成绩趋势权重 30%：连续下降每周+15分
  var scoreTrendScore = 0;
  var scoreDeclineWeeks = 0;
  for (var j = 1; j < scrHistory.length; j++) {
    if (scrHistory[j] < scrHistory[j - 1]) scoreDeclineWeeks++;
    else scoreDeclineWeeks = 0;
  }
  scoreTrendScore = Math.min(30, scoreDeclineWeeks * 15);

  // 当前出勤率权重 20%：<70% +20分，<80% +10分
  var attCurrentScore = 0;
  if (student.attend < 70) attCurrentScore = 20;
  else if (student.attend < 80) attCurrentScore = 10;

  // 当前成绩权重 20%：<50 +20分，<60 +10分
  var scoreCurrentScore = 0;
  if (student.avg < 50) scoreCurrentScore = 20;
  else if (student.avg < 60) scoreCurrentScore = 10;

  score = attTrendScore + scoreTrendScore + attCurrentScore + scoreCurrentScore;
  return Math.min(100, Math.max(0, Math.round(score)));
}

// 获取风险等级和颜色
function getRiskLevelInfo(score) {
  if (score >= 80) return { level: '极高风险', color: 'var(--red)', class: 'badge-red', colorCode: '#ef4444' };
  if (score >= 60) return { level: '高风险', color: 'var(--orange)', class: 'badge-orange', colorCode: '#f97316' };
  if (score >= 40) return { level: '中等风险', color: 'var(--blue)', class: 'badge-blue', colorCode: '#3b82f6' };
  return { level: '低风险', color: 'var(--green)', class: 'badge-green', colorCode: '#10b981' };
}

// 获取趋势箭头
function getTrendArrow(history) {
  if (history.length < 2) return '→';
  var slope = history[history.length - 1] - history[0];
  if (slope < -0.5) return '↓';
  if (slope > 0.5) return '↑';
  return '→';
}

// ===== 用户账号系统 =====
var users = [
  { id: 'admin', name: '系统管理员', role: 'admin', password: 'admin123', managedClasses: [] },
  { id: 'teacher001', name: '李老师', role: 'teacher', password: '123456', managedClasses: ['护理2401', '药学2401'] },
  { id: 'teacher002', name: '王老师', role: 'teacher', password: '123456', managedClasses: ['计应2401', '软技2401'] },
  { id: '2024030101', name: '王思涵', role: 'student', password: '123456', class: '护理2401', sid: '2024030101' },
  { id: '2024030201', name: '刘俊杰', role: 'student', password: '123456', class: '药学2401', sid: '2024030201' },
  { id: '2024030102', name: '张浩然', role: 'student', password: '123456', class: '护理2401', sid: '2024030102' },
  { id: '2024030202', name: '陈雨婷', role: 'student', password: '123456', class: '药学2401', sid: '2024030202' }
];

// 系统日志（模拟）
var systemLogs = [
  { time: '2025-01-15 09:23:15', user: '系统管理员', action: '登录系统', detail: 'IP: 192.168.1.100' },
  { time: '2025-01-15 08:45:32', user: '李老师', action: '生成谈心提纲', detail: '学生：张浩然' },
  { time: '2025-01-14 16:30:10', user: '李老师', action: '标记已关注', detail: '学生：赵明轩' },
  { time: '2025-01-14 14:12:05', user: '系统管理员', action: '添加用户', detail: '账号：teacher003' },
  { time: '2025-01-13 11:05:47', user: '王老师', action: '登录系统', detail: 'IP: 192.168.1.105' },
  { time: '2025-01-13 10:22:18', user: '李老师', action: '导出报告', detail: '月度育人报告' },
  { time: '2025-01-12 15:40:22', user: '系统管理员', action: '重置密码', detail: '账号：2024030101' },
  { time: '2025-01-12 09:15:33', user: '王思涵', action: '登录系统', detail: '学生端' }
];

// 导师推送给学生的指导意见
var studentGuidance = {};
// 尝试从localStorage恢复
try {
    var savedGuidance = localStorage.getItem('daolu_student_guidance');
    if (savedGuidance) {
        studentGuidance = JSON.parse(savedGuidance);
    }
} catch(e) {}

function saveGuidance() {
    try {
        localStorage.setItem('daolu_student_guidance', JSON.stringify(studentGuidance));
    } catch(e) {}
}

function addGuidance(sid, guidance) {
    if (!studentGuidance[sid]) {
        studentGuidance[sid] = [];
    }
    studentGuidance[sid].unshift(guidance);
    saveGuidance();
}

function markGuidanceRead(sid) {
    if (!studentGuidance[sid]) return;
    studentGuidance[sid].forEach(function(g) { g.read = true; });
    saveGuidance();
}

function getStudentGuidance(sid) {
    return studentGuidance[sid] || [];
}

const careerMap = {
  '护理': {directions: ['临床护士','社区护士','母婴护理师','养老护理专员'], skills: [
    {name:'临床操作能力', valKey: 'avg', offset: 10},
    {name:'沟通协调能力', valKey: 'hw', offset: 5},
    {name:'护理文书能力', valKey: 'avg', offset: 20, scale: 0.8},
    {name:'应急处理能力', valKey: 'attend', offset: 25, scale: 0.7}
  ]},
  '药学': {directions: ['临床药师','药品研发员','药房管理员','医药代表'], skills: [
    {name:'药品知识掌握', valKey: 'avg', offset: 8},
    {name:'实验操作能力', valKey: 'hw', offset: 5},
    {name:'药学服务能力', valKey: 'avg', offset: 20, scale: 0.75},
    {name:'法规合规意识', valKey: 'attend', offset: 30, scale: 0.65}
  ]},
  '临床医学': {directions: ['临床医师','医学影像技师','公共卫生专员','医学研究员'], skills: [
    {name:'临床诊断能力', valKey: 'avg', offset: 12},
    {name:'医患沟通能力', valKey: 'hw', offset: 8},
    {name:'病历书写能力', valKey: 'avg', offset: 15, scale: 0.85},
    {name:'急救处置能力', valKey: 'attend', offset: 20, scale: 0.75}
  ]},
  '康复治疗': {directions: ['康复治疗师','运动康复师','言语治疗师','儿童康复师'], skills: [
    {name:'康复评估能力', valKey: 'avg', offset: 10},
    {name:'治疗操作能力', valKey: 'hw', offset: 8},
    {name:'团队协作能力', valKey: 'attend', offset: 20, scale: 0.7},
    {name:'患者管理能力', valKey: 'avg', offset: 18, scale: 0.75}
  ]},
  '计算机应用': {directions: ['前端开发','后端开发','全栈工程师','UI设计师'], skills: [
    {name:'编程能力', valKey: 'avg', offset: 10},
    {name:'项目实践', valKey: 'hw', offset: 5},
    {name:'算法基础', valKey: 'avg', offset: 15, scale: 0.8},
    {name:'团队协作', valKey: 'attend', offset: 20, scale: 0.7}
  ]},
  '软件技术': {directions: ['Java开发','Python开发','移动开发','测试工程师'], skills: [
    {name:'编码能力', valKey: 'avg', offset: 10},
    {name:'框架应用', valKey: 'hw', offset: 8},
    {name:'系统设计', valKey: 'avg', offset: 12, scale: 0.85},
    {name:'代码质量', valKey: 'attend', offset: 18, scale: 0.75}
  ]},
  '网络技术': {directions: ['网络工程师','运维工程师','安全工程师','云计算工程师'], skills: [
    {name:'网络配置', valKey: 'avg', offset: 10},
    {name:'故障排查', valKey: 'hw', offset: 8},
    {name:'安全防护', valKey: 'avg', offset: 15, scale: 0.8},
    {name:'服务管理', valKey: 'attend', offset: 20, scale: 0.7}
  ]},
  '会计': {directions: ['财务专员','审计助理','税务师','成本会计'], skills: [
    {name:'核算能力', valKey: 'avg', offset: 10},
    {name:'财务软件', valKey: 'hw', offset: 5},
    {name:'税务知识', valKey: 'avg', offset: 15, scale: 0.8},
    {name:'合规意识', valKey: 'attend', offset: 25, scale: 0.65}
  ]},
  '市场营销': {directions: ['市场专员','品牌策划','销售主管','电商运营'], skills: [
    {name:'营销策划', valKey: 'avg', offset: 10},
    {name:'数据分析', valKey: 'hw', offset: 8},
    {name:'沟通谈判', valKey: 'avg', offset: 12, scale: 0.85},
    {name:'客户管理', valKey: 'attend', offset: 18, scale: 0.75}
  ]},
  '电子商务': {directions: ['电商运营','跨境电商','新媒体运营','供应链管理'], skills: [
    {name:'平台运营', valKey: 'avg', offset: 10},
    {name:'数据分析', valKey: 'hw', offset: 5},
    {name:'内容创作', valKey: 'avg', offset: 15, scale: 0.8},
    {name:'流量思维', valKey: 'attend', offset: 20, scale: 0.7}
  ]}
};
