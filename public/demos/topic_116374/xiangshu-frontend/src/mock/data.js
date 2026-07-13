// Mock 数据集中出口：模拟后端返回
// 后续对接真实接口后，可整体替换为 api 调用

// 当前家庭档案
export const mockArchive = {
  id: 1,
  familyName: '陈家',
  surname: '陈',
  village: '湖南张家界·田家村',
  description: '陈氏家族世代居于田家村，至今已传八代。家中保存有百年地契、老照片百余张。',
  memberCount: 6,
  photoCount: 3,
  oralCount: 2,
  documentCount: 3
}

// 家族成员（6 人，3 代）
export const mockMembers = [
  { id: 1, name: '陈永福', gender: 1, birthYear: '1942', deathYear: '', parentId: null, spouseName: '李秀英', description: '田家村老支书，一生为村里修路引水，德高望重。' },
  { id: 2, name: '李秀英', gender: 2, birthYear: '1945', deathYear: '', parentId: null, spouseName: '陈永福', description: '勤俭持家，养育四个子女，是村里公认的贤惠人。' },
  { id: 3, name: '陈建国', gender: 1, birthYear: '1968', deathYear: '', parentId: 1, spouseName: '王芳', description: '村小校长，承父业扎根乡村教育三十年。' },
  { id: 4, name: '陈建平', gender: 1, birthYear: '1972', deathYear: '', parentId: 1, spouseName: '张丽', description: '在外务工，逢年过节才回村，是典型的"打工一代"。' },
  { id: 5, name: '陈建红', gender: 2, birthYear: '1975', deathYear: '', parentId: 1, spouseName: '刘强', description: '嫁到邻村，逢年过节回娘家探望父母。' },
  { id: 6, name: '陈小明', gender: 1, birthYear: '1995', deathYear: '', parentId: 3, spouseName: '', description: '省城做软件开发，是家族里第一个大学生。' }
]

// 老照片（3 张）
export const mockPhotos = [
  { id: 1, fileName: '爷爷年轻时的照片', photoYear: '1965', peopleNames: '陈永福', description: '爷爷年轻时在县城照相馆拍的第一张照片。', isRestored: false, isColored: false },
  { id: 2, fileName: '全家福', photoYear: '1985', peopleNames: '陈永福、李秀英及子女', description: '1985年春节拍摄的全家福。', isRestored: true, isColored: true },
  { id: 3, fileName: '老屋前的合影', photoYear: '1978', peopleNames: '陈永福、陈建国', description: '老屋翻新前在门口拍的合影。', isRestored: false, isColored: false }
]

// 照片占位 Lucide 图标，按 id 取
export const photoIcons = ['lucide:user', 'lucide:users', 'lucide:home']

// 口述历史（2 条）
export const mockOralHistories = [
  {
    id: 1,
    tellerName: '陈永福',
    tellerAge: 82,
    title: '田家村的变化',
    transcript: '我记得我刚当村支书那会儿，村里连一条像样的路都没有。下大雨的时候，泥路能没过小腿肚。后来我带着大家修了第一条石子路，那时候全村人都出动了，连七八十岁的老人都来搬石头……那是1970年的事了，一晃五十多年了。',
    summary: '回忆了田家村三十年来的变化'
  },
  {
    id: 2,
    tellerName: '李秀英',
    tellerAge: 79,
    title: '那些年做过的饭',
    transcript: '那时候家里穷，孩子多，粮食紧。我把红薯切成丝当饭吃，把野菜剁碎了掺在米里。孩子们都说我做的红薯饭香，其实是没别的吃。过年才舍得蒸一锅白米饭，孩子们围着灶台转，那种眼神我这辈子忘不了。',
    summary: '讲述了贫困年代的家庭生活'
  }
]

// 文档（3 份）
export const mockDocuments = [
  { id: 1, docType: '地契', title: '清光绪年间田契', docYear: '1897', description: '光绪二十三年地契，记载陈家先祖购置水田三亩之事。' },
  { id: 2, docType: '家谱', title: '陈氏家谱（手抄本）', docYear: '1982', description: '手抄本家谱，记录陈氏一世至八世谱系。' },
  { id: 3, docType: '奖状', title: '陈永福同志优秀共产党员', docYear: '1985', description: '县委颁发，表彰陈永福同志在乡村建设中的贡献。' }
]

// OCR 模拟识别文本，按文档类型映射
export const mockOcrText = {
  地契: '立契人陈文远，今置得水田三亩，坐落田家村东，四至分明，价银二十两整，恐后无凭，立此契为证。光绪二十三年 月 日。',
  家谱: '陈氏一世祖讳文远，自江西迁居田家村，传至八世。二世祖讳仁和，三世祖讳国梁，四世祖讳元庆……',
  奖状: '陈永福同志，在1985年度乡村建设工作中成绩显著，被评为优秀共产党员，特发此状，以资鼓励。中共田家村支部委员会。',
  书信: '父亲大人膝下：儿在外一切安好，勿念。城里天气湿热，不比家乡。儿已申请探亲假，腊月可归……儿 建平叩上。'
}

// 探索档案（3 个）
export const mockExploreArchives = [
  { id: 1, familyName: '陈家', village: '湖南张家界·田家村', description: '八代传承，百年地契见证家族变迁' },
  { id: 2, familyName: '王家', village: '贵州黔东南·苗寨村', description: '苗族文化世家，刺绣技艺世代相传' },
  { id: 3, familyName: '李家', village: '云南元阳·梯田村', description: '梯田农耕家族，守护千年稻作文化' }
]

// 首页数据统计
export const mockHomeStats = {
  archiveCount: 328,
  photoCount: 1742,
  oralCount: 596
}
