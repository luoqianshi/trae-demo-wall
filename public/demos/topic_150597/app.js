/*
  《星梦岐境》HTML 版 · 主程序
  包含：路由管理 + 全局音频 + 四个页面逻辑 + 二十八星宿剧本数据
  wx API → Web API 转换：
    wx.vibrateShort()        → navigator.vibrate(30)
    wx.showToast()           → 自定义 toast
    wx.showLoading()         → 自定义 loading
    wx.createCanvasContext   → 标准 Canvas 2D API
    wx.canvasToTempFilePath  → canvas.toDataURL()
    wx.saveImageToPhotosAlbum → 创建下载链接
*/

(function () {
  'use strict';

  // ========== 二十八星宿疗愈剧本数据 ==========
  // 自动从《星梦岐境·二十八宿疗愈总卷》解析生成
  const scripts = {
    '角宿': {
      id: '001', name: '角宿', title: '万物生发', group: '东方青龙',
      intro: '《天官书》载：“角为天门，主万物生发。”角宿属木，乃苍龙之首，主春生之气。',
      medicine: '《素问》云：“春三月，此谓发陈。”春季养肝，贵在疏泄条达，宽衣缓带，以使志生。',
      scene: '青阳谷·初生境。晨雾幽谷，万年古木抽出嫩芽，枝蔓如龙角蜿蜒。灵兽青蛟盘于古木，象征“生发”之纯粹。',
      npc: '“春气萌动，子之肝木，可曾舒展？莫让尘俗之锁，困住心中生机。且入这青阳谷，随老夫，宽衣缓带，吐故纳新。”',
      interactions: [
        { name: '舒展', action: '双手按住屏幕两侧向外缓慢滑动', feedback: '枯枝绽放新绿，冰雪消融', zen: '形舒则气畅，心宽则木荣。' },
        { name: '听生', action: '轻触青蛟，保持三息', feedback: '青蛟化作点点绿意融入屏幕', zen: '生机不在外求，而在心念一转。' },
        { name: '迎风', action: '跟随屏幕光晕，深呼吸一次', feedback: '晨雾散去，朝阳跃出', zen: '借一缕春风，吹散心头郁结。' },
      ],
      ending: '“春木已荣，心结已解。去吧，带着这破土而出的生机，去迎你生命中的每一个清晨。”'
    },
    '亢宿': {
      id: '002', name: '亢宿', title: '平抑肝阳', group: '东方青龙',
      intro: '《天官书》云：“亢为疏庙，主天下疾疫。”亢宿属金，乃苍龙之颈。金克木，阳气初盛而易亢，人易肝阳上亢，急躁易怒。',
      medicine: '肝体阴而用阳，阳亢则伤阴。养生当以“柔”克“刚”，滋阴潜阳，忌大怒大悲。',
      scene: '流金崖·息怒台。悬崖之上，赤色气流如龙颈般紧绷。灵兽赤龙盘旋崖顶，周身烈焰，正需清凉抚慰。',
      npc: '“子眉间紧锁，肝阳上越，如这流金崖上之风，狂躁难平。且上这息怒台，随老夫，以柔克刚，平息这无明之火。”',
      interactions: [
        { name: '抚鳞', action: '指尖轻触赤龙逆鳞，缓缓下移', feedback: '赤色气流渐转为柔和蓝光，风声化为水声', zen: '逆鳞不可触，唯有心软可解。' },
        { name: '观流', action: '凝视崖下云海，保持静默', feedback: '云海翻涌渐息，化作明镜', zen: '风过无痕，怒过无心。' },
        { name: '饮泉', action: '长按屏幕，汲取崖下清泉', feedback: '清泉化作甘露，滴入眉心', zen: '以柔水养刚木，方得长久。' },
      ],
      ending: '“刚极易折，柔则长存。将这崖上清泉藏于心间，日后若生嗔念，便饮一口，自会清凉。”'
    },
    '氐宿': {
      id: '003', name: '氐宿', title: '万物之根', group: '东方青龙',
      intro: '《天官书》载：“氐为天根，主后妃之府。”氐宿属土，乃苍龙之胸腹。土为万物之母，主承载与根基。',
      medicine: '《素问》云：“脾为后天之本。”养脾当以“思”为戒，宜静心安神，使气血生化有源，固本培元。',
      scene: '厚土渊·归根洞。大地深处，暖光微明，巨大树根盘根错节。灵兽玄貉蜷于树根之下，象征“藏”与“根”。',
      npc: '“子思虑过重，如浮萍无根，脾胃失和。且入这厚土渊，随老夫，将纷乱思绪，尽数埋入这厚土之中，固本培元。”',
      interactions: [
        { name: '埋念', action: '将屏幕上的落叶拖入泥土', feedback: '落叶化作养分，暖光微亮', zen: '万物归于土，烦恼亦如是。' },
        { name: '听根', action: '贴近屏幕，聆听大地心跳', feedback: '低沉的“咚、咚”声，如母亲心跳', zen: '根在，则心安。' },
        { name: '归根', action: '深呼吸，感受气息下沉丹田', feedback: '玄貉微微睁眼，目光柔和', zen: '气沉则根固，神安则体健。' },
      ],
      ending: '“根深方能叶茂，心定始得身安。带着这厚土的温暖，回到你的世界，步履自会沉稳。”'
    },
    '房宿': {
      id: '004', name: '房宿', title: '温养气血', group: '东方青龙',
      intro: '《天官书》云：“房为天府，主车驾。”房宿属日，乃苍龙之腹，主明堂布政。人易气血亏虚，神疲乏力。',
      medicine: '“气血者，人之神也。”养气血当以“温”为主，忌食生冷，宜静卧养神，以充形体。',
      scene: '丹房谷·温玉池。幽谷深处，一池温玉之水，热气氤氲。灵兽玉兔通体莹白，手持玉杵捣药，象征“温养”。',
      npc: '“子面色苍白，气血两虚，如这冬日枯木。且入这丹房谷，沐这温玉之水。随老夫，以天地之阳，温养子之气血。”',
      interactions: [
        { name: '沐阳', action: '双手捧起池中温水，轻敷面部', feedback: '暖流遍布全身，面色微红', zen: '阳气至，则阴寒散。' },
        { name: '捣药', action: '轻触玉兔玉杵，随节奏点击', feedback: '药香弥漫，化作点点金光', zen: '一杵一息，皆是滋养。' },
        { name: '藏阳', action: '闭目，感受体内暖意', feedback: '金光汇聚于丹田，化作暖阳', zen: '阳气内藏，百病不生。' },
      ],
      ending: '“气血充盈，则神明自生。带着这温玉池的暖意，去抵御世间的风寒。”'
    },
    '心宿': {
      id: '005', name: '心宿', title: '清心降火', group: '东方青龙',
      intro: '东方苍龙七宿之“心宿”（心月狐）。心宿属火，主神明。当值之时，人易心火旺盛、烦躁失眠。',
      medicine: '《素问》云：“心者，君主之官，神明出焉。”核心养生理念为“清心降火，安神定志”，以静水养之，以清风拂之。',
      scene: '青丘幻境·心月潭。赤色心月悬于幽暗竹林之上，潭水深邃。灵兽心火狐通体雪白，眉心赤色印记，静卧青石。',
      npc: '“子夜踏月而来，眉间隐有焦灼之色。今心宿当值，君之神明，似被红尘烈火所扰。且随老夫步入这心月潭畔，观月，抚心。”',
      interactions: [
        { name: '观心', action: '凝视潭中倒映的赤色心月，保持静默三息', feedback: '赤月倒影柔和，化作清凉水波', zen: '心如潭水，火如落叶。凝视，非为执念，乃为放下。' },
        { name: '抚狐', action: '指尖轻触灵狐眉心赤色印记', feedback: '印记化作柔和白光，顺着指尖流入', zen: '你触碰的，并非灵兽，而是你心底本自具足的清凉。' },
        { name: '吐浊', action: '跟随屏幕光晕的收缩与舒张，完成一次深呼吸', feedback: '光晕化作萤火飘散，赤月转为皎洁银白', zen: '浊气随萤火而去，清气伴月光而归。' },
      ],
      ending: '“夜已深，心火已平。这青丘幻境，不过是君心之一隅。去吧，带着这份宁静，回到你的世界。愿君今夜，好梦无扰。”'
    },
    '尾宿': {
      id: '006', name: '尾宿', title: '潜藏蓄势', group: '东方青龙',
      intro: '《天官书》载：“尾为九子，主后宫之属。”尾宿属火，乃苍龙之尾。火主藏，人当收敛精气，潜藏蓄势。',
      medicine: '《素问》云：“冬三月，此谓闭藏。”冬季养肾，贵在“藏”。忌大汗淋漓，宜静卧养精。',
      scene: '玄冥渊·蛰龙窟。深渊之底，万籁俱寂，黑龙盘卧冰层之下。灵兽玄龟背负星辰，静卧龙尾之侧，象征“潜藏”。',
      npc: '“冬气闭藏，子之精气，可曾内守？莫要妄动，耗散真元。且入这玄冥渊，随老夫，收敛神气，潜藏蓄势。”',
      interactions: [
        { name: '敛神', action: '双手向内滑动，将画面中的星光聚拢', feedback: '星光化作一点，沉入渊底', zen: '神不外驰，精自内守。' },
        { name: '听蛰', action: '轻触玄龟，保持静默', feedback: '极微弱的心跳声，如大地呼吸', zen: '静极生动，藏中有生。' },
        { name: '蓄势', action: '深呼吸，感受气息下沉', feedback: '黑龙尾尖微动，冰层下泛起微光', zen: '蓄势待发，静待春雷。' },
      ],
      ending: '“藏，非为退缩，乃为来日之勃发。带着这份沉静的力量，去迎接你的春天。”'
    },
    '箕宿': {
      id: '007', name: '箕宿', title: '祛风除湿', group: '东方青龙',
      intro: '《天官书》云：“箕为敖客，主口舌。”箕宿属水，乃苍龙之尾摆动生风。人易感风邪，湿气内困。',
      medicine: '“风为百病之长，湿为阴邪。”养生当以“祛风除湿”为要，宜微汗出，以通经络。',
      scene: '长风谷·祛湿径。山谷中，微风拂过，草木摇曳，湿气氤氲。灵兽风豹通体银白，奔跑时带起清风，象征“通达”。',
      npc: '“子身重如裹，乃风邪湿困之象。且入这长风谷，借这清风，祛你体内之湿。随老夫，微汗出，经络通，身自轻。”',
      interactions: [
        { name: '迎风', action: '双手向上滑动，感受清风拂面', feedback: '雾气渐散，草木轻摇', zen: '风过则湿去，心宽则体轻。' },
        { name: '通络', action: '指尖沿屏幕上的经络线滑动', feedback: '微光流动，如暖流过体', zen: '通则不痛，痛则不通。' },
        { name: '微汗', action: '深呼吸，感受毛孔微张', feedback: '风豹轻啸，化作清风带走周身沉重', zen: '微汗出，邪自去。' },
      ],
      ending: '“风去湿除，身轻如燕。带着这长谷的清风，去吹散你生命中的阴霾。”'
    },
    '斗宿': {
      id: '008', name: '斗宿', title: '藏风聚气', group: '北方玄武',
      intro: '《天官书》载：“南斗为庙，主寿。”斗宿属木，乃玄武之蛇首。天地闭藏，人当藏风聚气，固本培元。',
      medicine: '《素问》云：“肾者主蛰，封藏之本。”冬气通肾，宜早卧晚起，收敛神气，以护肾精。',
      scene: '玄渊·沉星潭。幽暗寒潭，水面如墨，倒映微弱星芒。灵兽墨蛟静卧潭底，象征“蛰伏”。',
      npc: '“冬水凝寒，子之肾精，可曾封藏？莫向外驰求，且入这玄渊，随老夫，敛神内守，藏风聚气。”',
      interactions: [
        { name: '沉星', action: '指尖轻触水面星芒，缓缓下按', feedback: '星芒沉入水底，化作微光', zen: '星沉渊底，神归其舍。' },
        { name: '听蛰', action: '贴近屏幕，静听水底微响', feedback: '极低沉的“嗡”声，如大地心跳', zen: '蛰伏非死寂，乃生机暗藏。' },
        { name: '聚气', action: '双手环抱屏幕，向内轻拢', feedback: '水波微聚，墨蛟尾尖轻摆', zen: '气聚则精固，神凝则根安。' },
      ],
      ending: '“藏，是冬的慈悲。带着这份沉静的力量，去守护你生命中的每一滴精微。”'
    },
    '牛宿': {
      id: '009', name: '牛宿', title: '坚韧沉稳', group: '北方玄武',
      intro: '《天官书》云：“牵牛为牺牲，主关梁。”牛宿属金，乃玄武之前肢。人易感寒湿，筋骨沉重。',
      medicine: '“寒主收引，易伤阳气。”冬养当以“温”为要，使气血温煦，筋骨舒展。',
      scene: '霜岩·温玉窟。寒霜岩壁深处，一穴暖光微明。灵兽玄牛静卧暖玉之上，象征“承载”。',
      npc: '“寒湿侵体，子之气血，可曾温煦？且入这霜岩，沐这暖玉之光。随老夫，以天地之温，养子之坚韧。”',
      interactions: [
        { name: '抚寒', action: '指尖轻触霜岩，缓缓下移', feedback: '霜痕渐融，暖光微亮', zen: '寒极生温，心柔则坚。' },
        { name: '承露', action: '双手捧起暖光，轻敷胸口', feedback: '暖流遍布，呼吸渐深', zen: '一息一暖，皆是滋养。' },
        { name: '温养', action: '闭目，感受体内暖意', feedback: '玄牛微微睁眼，目光柔和', zen: '温养气血，如牛负重，静而不移。' },
      ],
      ending: '“坚韧非刚硬，乃柔中带温。带着这份暖意，去抵御世间的风霜。”'
    },
    '女宿': {
      id: '010', name: '女宿', title: '柔顺包容', group: '北方玄武',
      intro: '《天官书》载：“须女为布帛，主嫁娶。”女宿属土，乃玄武之龟甲。人易情志郁结，当柔顺包容。',
      medicine: '“肺主悲，肾主恐，情志过极则伤阴。”冬养当以“润”为要，使阴液充盈，情志平和。',
      scene: '幽泽·润心池。幽暗沼泽深处，一池碧水如镜。灵兽玄龟静浮水面，象征“包容”。',
      npc: '“情志郁结，子之阴液，可曾充盈？且入这幽泽，沐这润心之水。随老夫，以水之柔，化子之郁。”',
      interactions: [
        { name: '观镜', action: '凝视水面月影，保持静默', feedback: '月影渐柔，水波微漾', zen: '心如止水，影自清明。' },
        { name: '抚润', action: '指尖轻触水面，缓缓划过', feedback: '水波化作点点莹光，融入指尖', zen: '水润万物，亦润心田。' },
        { name: '包容', action: '深呼吸，感受气息下沉', feedback: '玄龟微微抬头，目光柔和', zen: '包容非退让，乃心宽如泽。' },
      ],
      ending: '“柔，是水的智慧。带着这份包容，去化解生命中的每一丝郁结。”'
    },
    '虚宿': {
      id: '011', name: '虚宿', title: '虚怀若谷', group: '北方玄武',
      intro: '《天官书》云：“虚为北陆，主死丧。”虚宿属日，乃玄武之躯干。人易思虑过度，当虚怀若谷。',
      medicine: '“思伤脾，过思则气结。”冬养当以“空”为要，宜静坐冥想，使心神空明。',
      scene: '空谷·忘机崖。幽暗山谷深处，一崖悬空，四周寂静。灵兽玄鸟静栖崖顶，象征“空明”。',
      npc: '“思虑过重，子之心神，可曾空明？且入这空谷，忘机崖上，随老夫，虚怀若谷，静心冥想。”',
      interactions: [
        { name: '忘机', action: '双手轻按屏幕，缓缓下压', feedback: '崖边雾气渐散，玄鸟微微抬头', zen: '放下执念，方见空明。' },
        { name: '听空', action: '贴近屏幕，静听山谷微响', feedback: '极微弱的风声，如呼吸般自然', zen: '空非虚无，乃万有之基。' },
        { name: '冥想', action: '闭目，感受气息与风同频', feedback: '玄鸟展翅，化作清风拂过心田', zen: '心若空谷，风自往来。' },
      ],
      ending: '“空，是心的留白。带着这份空明，去容纳生命中的每一缕清风。”'
    },
    '危宿': {
      id: '012', name: '危宿', title: '居安思危', group: '北方玄武',
      intro: '《天官书》载：“危为盖屋，主宗庙。”危宿属月，乃玄武之蛇尾。人易心神不宁，当收敛心神。',
      medicine: '“惊则气乱，恐则气下。”冬养当以“安”为要，宜静心安神，使气机平稳。',
      scene: '危崖·守心台。幽暗悬崖之上，一平台悬空，风声呼啸中有一处暖光。灵兽玄蛇盘于崖顶，象征“守护”。',
      npc: '“心神不宁，子之气机，可曾平稳？且上这危崖，守心台上，随老夫，居安思危，收敛心神。”',
      interactions: [
        { name: '守心', action: '指尖轻触暖光，缓缓下按', feedback: '暖光渐稳，风声渐弱', zen: '心有所守，外风不侵。' },
        { name: '听危', action: '贴近屏幕，静听风声', feedback: '风声渐柔，化作呼吸般节奏', zen: '危中藏安，静极生慧。' },
        { name: '归舍', action: '深呼吸，感受气息下沉', feedback: '玄蛇微微抬头，目光柔和', zen: '神归其舍，气自平稳。' },
      ],
      ending: '“安，是心的归处。带着这份沉静，去守护你生命中的每一寸安宁。”'
    },
    '室宿': {
      id: '013', name: '室宿', title: '安身立命', group: '北方玄武',
      intro: '《天官书》云：“营室为清庙，主土工。”室宿属火，乃玄武之蛇身。人易阳气不足，当温煦阳气。',
      medicine: '“阳虚则寒，温煦失职。”冬养当以“温”为要，宜静卧养阳，使阳气内守。',
      scene: '玄宫·温阳殿。幽暗宫殿深处，一殿暖光微明。灵兽玄猪静卧暖玉之上，象征“温煦”。',
      npc: '“阳气不足，子之身命，可曾温煦？且入这玄宫，沐这温阳之光。随老夫，安身立命，温煦阳气。”',
      interactions: [
        { name: '沐阳', action: '双手捧起暖光，轻敷胸口', feedback: '暖流遍布，呼吸渐深', zen: '阳气至，则阴寒散。' },
        { name: '安身', action: '指尖轻触暖玉，缓缓下移', feedback: '暖玉微温，玄猪微微抬头', zen: '身安则心定，心定则命固。' },
        { name: '温煦', action: '闭目，感受体内暖意', feedback: '暖光汇聚丹田，化作暖阳', zen: '温煦阳气，如日中天，身自安泰。' },
      ],
      ending: '“温，是冬的馈赠。带着这份暖意，去安顿你生命中的每一寸光阴。”'
    },
    '壁宿': {
      id: '014', name: '壁宿', title: '坚固屏障', group: '北方玄武',
      intro: '《天官书》载：“东壁为文章，主图书。”壁宿属水，乃玄武之龟尾。人易心神散乱，当坚固屏障。',
      medicine: '《素问》云：“心藏神，脾藏意。”神散则意乱，志不坚则神不宁。冬养当以“定”为要，忌心神外驰，宜静心安神，使志意坚固，如壁立千仞，外邪不侵，神有所归。',
      scene: '玄壁·守神阁。幽暗的绝壁之上，一阁悬空，四壁如铁，唯有阁中微光如豆，在寒风中摇曳却不灭。四周寂静无声，唯有壁间刻痕在微光下若隐若现。灵兽玄貐（yù），通体玄黑，形如狸猫而额有白纹，静卧于阁顶梁上，双目微阖，象征“守护”与“定志”。',
      npc: '“心神散乱，如风中残烛，子之志意，可曾坚固？且入这玄壁，守神阁上，看那玄貐安守。随老夫，筑壁于心，坚固屏障，安神定志。”',
      interactions: [
        { name: '筑壁', action: '双手轻按屏幕两侧，缓缓向外推，如推门亦如筑墙', feedback: '微光渐聚，在屏幕中央化作一面半透明的光壁，将外界风雪隔绝', zen: '心有所壁，外邪不侵；意有所守，神自安宁。' },
        { name: '守神', action: '指尖轻触光壁，缓缓下移，如抚琴弦', feedback: '光壁微温，玄貐在梁上微微抬头，目光柔和而坚定', zen: '神有所守，志自坚固；壁立千仞，无欲则刚。' },
        { name: '定志', action: '深呼吸，感受气息与光壁同频，一呼一吸，如筑墙夯土', feedback: '玄貐化作一阵微风，拂过心田，光壁随之隐入体内', zen: '志定则神安，神安则身泰；壁在心头，风雨何惧。' },
      ],
      ending: '“定，是心的屏障。带着这份坚固，去守护你生命中的每一缕神光。任凭世间风雨，我自壁立千仞。”'
    },
    '奎宿': {
      id: '015', name: '奎宿', title: '文运初开', group: '西方白虎',
      intro: '《天官书》载：“奎曰沟渎，主以兵禁暴。”奎宿属木，乃西方白虎之尾，主天之武库与文章。金气初动，人当收敛浮躁，以静水养文心。',
      medicine: '《素问》云：“秋三月，此谓容平。”秋气初至，肺气渐收。此时养生，贵在“收”与“静”，宜敛神静坐，使志安宁，以缓秋刑。',
      scene: '洗砚池·墨香径。秋风微凉，池水如墨，水面浮着几片落叶，宛如未干的墨痕。灵兽青狼目光如洗，静立于池边，象征“沉静”与“文运”。',
      npc: '“秋风起，心浮气躁，文思难聚。且入这洗砚池，看那青狼静立。随老夫，敛神静气，以水养心，文运自开。”',
      interactions: [
        { name: '洗砚', action: '指尖轻触水面，缓缓划过', feedback: '墨痕渐散，水面清明', zen: '洗去浮尘，心自清明。' },
        { name: '观狼', action: '凝视青狼，保持静默', feedback: '青狼微微低头，目光柔和', zen: '静观其变，文思自生。' },
        { name: '敛神', action: '深呼吸，感受气息下沉', feedback: '水面微漾，落叶轻沉', zen: '神敛则心静，心静则文生。' },
      ],
      ending: '“静，是文的根基。带着这份清明，去书写你生命中的每一页篇章。”'
    },
    '娄宿': {
      id: '016', name: '娄宿', title: '聚众成林', group: '西方白虎',
      intro: '《天官书》云：“娄为聚众，主苑牧。”娄宿属金，乃白虎之身。金主肃杀，人易思绪纷乱，当聚众成林，理清思绪，以金之刚毅，斩断纷扰。',
      medicine: '“肺主气，司呼吸。”秋养当以“理”为要，忌思绪纷乱，宜静坐冥想，使气机条达，思绪如林，井然有序。',
      scene: '金风林·理心径。秋风拂过，枯叶纷飞，林木萧疏，却有一种肃穆的秩序感。灵兽金犬目光如炬，静立于林间，象征“秩序”与“守护”。',
      npc: '“思绪纷乱，如这秋风落叶。且入这金风林，看那金犬静守。随老夫，聚众成林，理清思绪。”',
      interactions: [
        { name: '拂叶', action: '双手轻拂屏幕，将落叶扫向两侧', feedback: '枯叶纷飞，露出清晰的林间小径', zen: '拂去纷扰，路自清晰。' },
        { name: '观林', action: '凝视林木，保持静默', feedback: '林木微摇，金犬微微抬头', zen: '林有秩序，心亦如是。' },
        { name: '理气', action: '深呼吸，感受气息与风同频', feedback: '金犬轻啸，化作一阵清风，拂过心田', zen: '理气则心定，心定则思清。' },
      ],
      ending: '“序，是心的秩序。带着这份清晰，去整理你生命中的每一缕思绪。”'
    },
    '胃宿': {
      id: '017', name: '胃宿', title: '海纳百川', group: '西方白虎',
      intro: '《天官书》载：“胃为天仓，主食廪。”胃宿属土，乃白虎之腹。土主信，人易脾胃不和，当海纳百川，健脾和胃，以土之厚德，承载万物。',
      medicine: '“脾为后天之本，气血生化之源。”秋养当以“和”为要，忌饮食不节，宜静心安神，使脾胃调和，气血充盈。',
      scene: '天仓谷·和胃池。幽谷深处，一池碧水如镜，倒映着几株枯树。灵兽玄雉静立于池边，象征“包容”与“滋养”。',
      npc: '“脾胃不和，心亦难安。且入这天仓谷，沐这和胃之水。随老夫，海纳百川，健脾和胃。”',
      interactions: [
        { name: '纳水', action: '双手捧起池水，轻敷胸口', feedback: '暖流遍布，呼吸渐深', zen: '纳百川，心自宽广。' },
        { name: '观雉', action: '凝视玄雉，保持静默', feedback: '玄雉微微低头，目光柔和', zen: '包容万物，脾自和。' },
        { name: '和气', action: '深呼吸，感受气息下沉', feedback: '水面微漾，玄雉轻鸣', zen: '气和则脾健，脾健则身安。' },
      ],
      ending: '“和，是心的滋养。带着这份包容，去接纳你生命中的每一缕气息。”'
    },
    '昴宿': {
      id: '018', name: '昴宿', title: '明察秋毫', group: '西方白虎',
      intro: '《天官书》云：“昴曰髦头，主狱事。”昴宿属日，乃白虎之胸。日主明，人易浊气内困，当明察秋毫，涤荡浊气，以日之光明，照见本心。',
      medicine: '“肺主皮毛，开窍于鼻。”秋养当以“清”为要，忌浊气内困，宜静心安神，使肺气清肃，浊气尽涤。',
      scene: '昴日台·涤尘径。高台之上，晨光微明，几缕薄雾缭绕，却有一种清透的明亮。灵兽金乌静立于台顶，象征“光明”与“涤荡”。',
      npc: '“浊气内困，心亦难明。且上这昴日台，沐这涤尘之光。随老夫，明察秋毫，涤荡浊气。”',
      interactions: [
        { name: '涤尘', action: '指尖轻触薄雾，缓缓划过', feedback: '薄雾渐散，晨光微明', zen: '涤去浊气，心自清明。' },
        { name: '观乌', action: '凝视金乌，保持静默', feedback: '金乌微微抬头，目光如炬', zen: '明察秋毫，浊自尽涤。' },
        { name: '清气', action: '深呼吸，感受气息与光同频', feedback: '金乌轻鸣，化作一阵清风，拂过心田', zen: '气清则肺肃，肺肃则身轻。' },
      ],
      ending: '“明，是心的光芒。带着这份清透，去照见你生命中的每一缕本真。”'
    },
    '毕宿': {
      id: '019', name: '毕宿', title: '肃杀收敛', group: '西方白虎',
      intro: '《天官书》载：“毕曰罕车，为边兵，主弋猎。”毕宿属月，乃白虎之口。月主肃，人易肺气不降，当肃杀收敛，润肺防燥，以月之清冷，收敛神气。',
      medicine: '“肺为娇脏，喜润恶燥。”秋养当以“润”为要，忌燥邪伤肺，宜静心安神，使肺气清润，神气内敛。',
      scene: '毕月潭·润心径。幽潭深处，月光如水，水面浮着几片落叶。灵兽玄乌静立于潭边，象征“收敛”与“润泽”。',
      npc: '“肺气不降，心亦难安。且入这毕月潭，沐这润心之光。随老夫，肃杀收敛，润肺防燥。”',
      interactions: [
        { name: '润心', action: '指尖轻触水面，缓缓划过', feedback: '水面微漾，月光柔和', zen: '润以养肺，心自安宁。' },
        { name: '观乌', action: '凝视玄乌，保持静默', feedback: '玄乌微微低头，目光柔和', zen: '收敛神气，肺自清润。' },
        { name: '敛气', action: '深呼吸，感受气息下沉', feedback: '水面微漾，玄乌轻鸣', zen: '气敛则肺润，肺润则身安。' },
      ],
      ending: '“润，是心的滋养。带着这份清润，去守护你生命中的每一缕气息。”'
    },
    '觜宿': {
      id: '020', name: '觜宿', title: '微言大义', group: '西方白虎',
      intro: '《天官书》云：“觜为虎首，主收敛。”觜宿属火，乃白虎之首。火主明，人易心神不宁，当微言大义，静心倾听，以火之光明，照见本心。',
      medicine: '“心主神明，开窍于舌。”秋养当以“静”为要，忌心神不宁，宜静心安神，使心神安宁，言语有度。',
      scene: '觜火林·静心径。幽林深处，几缕微光闪烁，宛如未干的墨痕。灵兽火猴静立于林间，象征“倾听”与“智慧”。',
      npc: '“心神不宁，言语失度。且入这觜火林，看那火猴静立。随老夫，微言大义，静心倾听。”',
      interactions: [
        { name: '倾听', action: '贴近屏幕，静听林间微响', feedback: '极微弱的风声，如呼吸般自然', zen: '静心倾听，言自有力。' },
        { name: '观猴', action: '凝视火猴，保持静默', feedback: '火猴微微抬头，目光柔和', zen: '微言大义，心自安宁。' },
        { name: '静心', action: '深呼吸，感受气息与光同频', feedback: '火猴轻鸣，化作一阵清风，拂过心田', zen: '心静则言慎，言慎则神安。' },
      ],
      ending: '“静，是心的智慧。带着这份安宁，去倾听你生命中的每一缕微言。”'
    },
    '参宿': {
      id: '021', name: '参宿', title: '万物齐整', group: '西方白虎',
      intro: '《天官书》载：“参为白虎之胸，主杀伐。”参宿属水，乃白虎之心。水主智，人易阴阳失调，当万物齐整，调和阴阳，以水之柔韧，调和万物。',
      medicine: '“阴阳者，天地之道也。”秋养当以“和”为要，忌阴阳失调，宜静心安神，使阴阳调和，身安命固。',
      scene: '参水潭·和合径。幽潭深处，水面如镜，水面浮着几片落叶。灵兽玄猿静立于潭边，象征“调和”与“智慧”。',
      npc: '“阴阳失调，心亦难安。且入这参水潭，沐这和合之光。随老夫，万物齐整，调和阴阳。”',
      interactions: [
        { name: '调和', action: '双手轻按水面，缓缓下压', feedback: '水面微漾，落叶轻沉', zen: '调和阴阳，心自安宁。' },
        { name: '观猿', action: '凝视玄猿，保持静默', feedback: '玄猿微微抬头，目光柔和', zen: '万物齐整，身自安泰。' },
        { name: '和气', action: '深呼吸，感受气息与光同频', feedback: '玄猿轻鸣，化作一阵清风，拂过心田', zen: '气和则阴阳调，阴阳调则身安。' },
      ],
      ending: '“和，是心的智慧。带着这份调和，去安顿你生命中的每一缕气息。”'
    },
    '井宿': {
      id: '022', name: '井宿', title: '源源不绝', group: '南方朱雀',
      intro: '《天官书》载：“东井为水事，主水泉。”井宿属木，乃朱雀之首，形如八角水井。夏气蒸腾，人易心火旺盛、津液耗损，当引甘泉以清热，源源不绝以生津。',
      medicine: '《素问》云：“夏三月，此谓蕃秀。”夏气通心，易耗气伤津。养生当以“清”与“润”为要，宜静心寡欲，饮甘泉以滋五脏，使津液充盈，心火自降。',
      scene: '朱明泉·八角井。盛夏幽谷，清泉自八角石井中汩汩涌出，水面浮动着点点萤火，热气与凉意交织。灵兽青鸾通体碧蓝，静立于井栏之上，象征“清凉”与“不绝”。',
      npc: '“夏火炎炎，子之津液，可曾枯竭？且入这朱明泉，饮这八角井中之水。随老夫，清热生津，源源不绝。”',
      interactions: [
        { name: '汲泉', action: '指尖轻触水面，缓缓上提', feedback: '清泉化作点点水珠，跃入屏幕', zen: '一掬清泉，涤尽烦热。' },
        { name: '观鸾', action: '凝视青鸾，保持静默', feedback: '青鸾微微低头，尾羽轻摇', zen: '心静自凉，泉涌不息。' },
        { name: '生津', action: '深呼吸，感受清凉入喉', feedback: '水珠化作甘霖，落入心田', zen: '津生则火降，心润则神安。' },
      ],
      ending: '“清，是夏的慈悲。带着这份甘泉，去浇灌你生命中的每一寸焦渴。”'
    },
    '鬼宿': {
      id: '023', name: '鬼宿', title: '幽冥深邃', group: '南方朱雀',
      intro: '《天官书》云：“舆鬼，鬼祠事也。”鬼宿属金，乃朱雀之目。金主肃，当值之时，人易心神不宁、阴霾内困，当以光明驱散幽冥，以正念涤荡阴霾。',
      medicine: '“心藏神，神不安则寐不宁。”夏养当以“定”为要，忌心神浮越，宜静心安神，使神有所归，阴霾自散。',
      scene: '幽冥谷·明灯台。幽暗的峡谷深处，一盏孤灯摇曳，四周雾气缭绕，却有一线光明穿透迷雾。灵兽玄鸦通体玄黑，双目如星，静立于灯台之上，象征“洞察”与“驱散”。',
      npc: '“心神不宁，阴霾内困。且入这幽冥谷，看那玄鸦守灯。随老夫，以正念驱散幽冥，以光明涤荡阴霾。”',
      interactions: [
        { name: '拨雾', action: '双手轻拂屏幕，将雾气拨向两侧', feedback: '雾气渐散，明灯更亮', zen: '雾散则明现，心定则神安。' },
        { name: '观鸦', action: '凝视玄鸦，保持静默', feedback: '玄鸦微微抬头，目光如炬', zen: '洞察幽微，阴霾自散。' },
        { name: '驱阴', action: '深呼吸，感受光明入体', feedback: '明灯化作点点星光，融入心田', zen: '光至则阴退，神归则心宁。' },
      ],
      ending: '“明，是心的灯塔。带着这份光明，去照亮你生命中的每一处幽暗。”'
    },
    '柳宿': {
      id: '024', name: '柳宿', title: '柔韧如丝', group: '南方朱雀',
      intro: '《天官书》载：“柳为鸟注，主草木。”柳宿属土，乃朱雀之喙。土主信，当值之时，人易筋骨僵硬、情志郁结，当以柔韧舒展筋骨，以丝缕化解郁结。',
      medicine: '“肝主筋，喜条达而恶抑郁。”夏养当以“舒”为要，忌情志郁结，宜舒展筋骨，使气机条达，情志畅然。',
      scene: '垂丝谷·柔风径。盛夏幽谷，万千柳丝垂落，随风轻摇，宛如绿色的瀑布，柔韧而富有生机。灵兽翠鸟通体翠绿，静立于柳枝之上，象征“柔韧”与“舒展”。',
      npc: '“筋骨僵硬，情志郁结。且入这垂丝谷，看那翠鸟栖柳。随老夫，以柔韧舒展筋骨，以丝缕化解郁结。”',
      interactions: [
        { name: '抚柳', action: '指尖轻触柳丝，缓缓下移', feedback: '柳丝轻摇，化作点点绿意', zen: '柔能克刚，舒则郁解。' },
        { name: '观鸟', action: '凝视翠鸟，保持静默', feedback: '翠鸟微微抬头，目光柔和', zen: '心柔则筋舒，情畅则志达。' },
        { name: '舒展', action: '深呼吸，感受气息与风同频', feedback: '柳丝轻舞，翠鸟轻鸣', zen: '气舒则筋柔，筋柔则身安。' },
      ],
      ending: '“柔，是生命的韧性。带着这份舒展，去化解你生命中的每一丝郁结。”'
    },
    '星宿': {
      id: '025', name: '星宿', title: '光华璀璨', group: '南方朱雀',
      intro: '《天官书》云：“七星，颈也，主急事。”星宿属日，乃朱雀之颈。日主明，当值之时，人易心火上炎、目赤肿痛，当以光华明目，以璀璨清心。',
      medicine: '“肝开窍于目，心主神明。”夏养当以“清”为要，忌心火上炎，宜静心安神，使心火下降，目自清明。',
      scene: '星华台·明心池。盛夏夜空，繁星璀璨，倒映于幽潭之中，水面如镜，光华流转。灵兽朱雀通体赤金，静立于台顶，象征“光明”与“清心”。',
      npc: '“心火上炎，目赤神昏。且上这星华台，沐这明心之光。随老夫，以光华明目，以璀璨清心。”',
      interactions: [
        { name: '仰星', action: '双手轻按屏幕，缓缓上推', feedback: '星光渐亮，水面清明', zen: '仰望星空，心自高远。' },
        { name: '观雀', action: '凝视朱雀，保持静默', feedback: '朱雀微微抬头，目光如炬', zen: '光华璀璨，心自清明。' },
        { name: '清心', action: '深呼吸，感受清凉入体', feedback: '星光化作甘露，落入心田', zen: '心清则目明，目明则神安。' },
      ],
      ending: '“明，是心的光芒。带着这份璀璨，去照亮你生命中的每一寸迷茫。”'
    },
    '张宿': {
      id: '026', name: '张宿', title: '张弛有度', group: '南方朱雀',
      intro: '《天官书》载：“张为素，主厨膳。”张宿属月，乃朱雀之翼。月主柔，当值之时，人易脾胃不和、张弛失度，当以调和脾胃，以张弛有度应天时。',
      medicine: '“脾为后天之本，主运化。”夏养当以“和”为要，忌饮食不节，宜静心安神，使脾胃调和，张弛有度。',
      scene: '素月谷·和胃池。盛夏幽谷，一轮素月高悬，月光如水，倒映于池中，水面浮着几片荷叶。灵兽玄鹤通体玄黑，静立于池边，象征“调和”与“张弛”。',
      npc: '“脾胃不和，张弛失度。且入这素月谷，沐这和胃之光。随老夫，张弛有度，调和脾胃。”',
      interactions: [
        { name: '观月', action: '凝视素月，保持静默', feedback: '月光渐柔，水面微漾', zen: '月有圆缺，张弛有度。' },
        { name: '抚鹤', action: '指尖轻触玄鹤，缓缓下移', feedback: '玄鹤微微低头，目光柔和', zen: '心和则脾健，脾健则身安。' },
        { name: '调和', action: '深呼吸，感受气息与光同频', feedback: '月光化作点点莹光，融入心田', zen: '气调则脾胃和，脾胃和则身泰。' },
      ],
      ending: '“和，是心的节奏。带着这份张弛，去安顿你生命中的每一寸光阴。”'
    },
    '翼宿': {
      id: '027', name: '翼宿', title: '展翅高飞', group: '南方朱雀',
      intro: '《天官书》云：“翼为羽翮，主远客。”翼宿属火，乃朱雀之翼。火主升，当值之时，人易肺气不宣、情志抑郁，当以展翅高飞宣发肺气，以升发之气化解抑郁。',
      medicine: '“肺主气，司呼吸。”夏养当以“宣”为要，忌情志抑郁，宜舒展胸怀，使肺气宣发，情志畅然。',
      scene: '凌霄崖·宣肺径。盛夏高崖，长风浩荡，云海翻涌，宛如展翅之翼，气象万千。灵兽大鹏通体赤金，静立于崖顶，象征“升发”与“宣畅”。',
      npc: '“肺气不宣，情志抑郁。且上这凌霄崖，看那大鹏展翅。随老夫，展翅高飞，宣发肺气。”',
      interactions: [
        { name: '展翅', action: '双手向两侧滑动，模拟展翅', feedback: '云海翻涌，长风浩荡', zen: '展翅则气宣，气宣则郁解。' },
        { name: '观鹏', action: '凝视大鹏，保持静默', feedback: '大鹏微微抬头，目光如炬', zen: '心高则气畅，气畅则情舒。' },
        { name: '宣发', action: '深呼吸，感受气息与风同频', feedback: '大鹏轻啸，化作一阵清风，拂过心田', zen: '气宣则肺畅，肺畅则身轻。' },
      ],
      ending: '“升，是心的翅膀。带着这份舒展，去拥抱你生命中的每一缕长风。”'
    },
    '轸宿': {
      id: '028', name: '轸宿', title: '悲悯万物', group: '南方朱雀',
      intro: '《天官书》载：“轸为车，主风。”轸宿属水，乃朱雀之尾。水主智，当值之时，人易心绪不宁、悲悯过度，当以平复心绪，以悲悯之心化解执念。',
      medicine: '“心主神明，悲则气消。”夏养当以“平”为要，忌悲悯过度，宜静心安神，使心绪平和，悲悯有度。',
      scene: '悲风谷·平心台。盛夏幽谷，微风拂过，草木轻摇，却有一种悲悯的宁静，宛如万物在低语。灵兽玄龟通体玄黑，静立于台顶，象征“悲悯”与“平和”。',
      npc: '“心绪不宁，悲悯过度。且入这悲风谷，看那玄龟安守。随老夫，平复心绪，以悲悯化解执念。”',
      interactions: [
        { name: '听风', action: '贴近屏幕，静听微风', feedback: '风声渐柔，草木轻摇', zen: '风过无痕，悲过无心。' },
        { name: '观龟', action: '凝视玄龟，保持静默', feedback: '玄龟微微抬头，目光柔和', zen: '悲悯有度，心自平和。' },
        { name: '平心', action: '深呼吸，感受气息与风同频', feedback: '玄龟轻鸣，化作一阵微风，拂过心田', zen: '心平则绪宁，绪宁则神安。' },
      ],
      ending: '“平，是心的慈悲。带着这份悲悯，去安顿你生命中的每一缕心绪。”'
    },
  };

  // ========== 二十八星宿列表数据（按四象分组） ==========
  const constellationData = {
    '东方青龙': [
      { name: '角宿', desc: '万物生发' },
      { name: '亢宿', desc: '阳气初盛' },
      { name: '氐宿', desc: '万物之根' },
      { name: '房宿', desc: '明堂布政' },
      { name: '心宿', desc: '清心降火' },
      { name: '尾宿', desc: '潜藏蓄势' },
      { name: '箕宿', desc: '风动云起' }
    ],
    '南方朱雀': [
      { name: '井宿', desc: '源源不绝' },
      { name: '鬼宿', desc: '幽冥深邃' },
      { name: '柳宿', desc: '柔韧如丝' },
      { name: '星宿', desc: '光华璀璨' },
      { name: '张宿', desc: '张弛有度' },
      { name: '翼宿', desc: '展翅高飞' },
      { name: '轸宿', desc: '悲悯万物' }
    ],
    '西方白虎': [
      { name: '奎宿', desc: '文运初开' },
      { name: '娄宿', desc: '聚众成林' },
      { name: '胃宿', desc: '海纳百川' },
      { name: '昴宿', desc: '明察秋毫' },
      { name: '毕宿', desc: '肃杀收敛' },
      { name: '觜宿', desc: '微言大义' },
      { name: '参宿', desc: '万物齐整' }
    ],
    '北方玄武': [
      { name: '斗宿', desc: '藏风聚气' },
      { name: '牛宿', desc: '坚韧沉稳' },
      { name: '女宿', desc: '柔顺包容' },
      { name: '虚宿', desc: '虚怀若谷' },
      { name: '危宿', desc: '居安思危' },
      { name: '室宿', desc: '安身立命' },
      { name: '壁宿', desc: '坚固屏障' }
    ]
  };

  // ========== 四象入口数据 ==========
  const fourSymbols = [
    { name: '东方青龙', desc: '万物生发', img: 'images/symbols/青龙.png' },
    { name: '南方朱雀', desc: '光华璀璨', img: 'images/symbols/朱雀.png' },
    { name: '西方白虎', desc: '肃杀收敛', img: 'images/symbols/白虎.png' },
    { name: '北方玄武', desc: '藏风聚气', img: 'images/symbols/玄武.png' }
  ];

  // ========== 工具函数 ==========
  function $(id) { return document.getElementById(id); }

  // wx.vibrateShort() → navigator.vibrate(30)
  function vibrateShort() {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  }

  // wx.showToast() → 自定义 toast
  function showToast(title) {
    var toast = $('toast');
    toast.textContent = title;
    toast.classList.add('show');
    setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }

  // wx.showLoading() → 自定义 loading
  function showLoading(title) {
    var loading = $('loading');
    loading.querySelector('.loading-text').textContent = title;
    loading.classList.add('show');
  }

  function hideLoading() {
    $('loading').classList.remove('show');
  }

  // ========== 全局音频管理（单例，跨页面不中断） ==========
  var audioCtx = null;

  function initAudio() {
    if (audioCtx) return;
    audioCtx = new Audio('audio/guqin.mp3');
    audioCtx.loop = true;
    audioCtx.volume = 0.3;
    // 尝试自动播放，若被浏览器拦截则在首次交互时播放
    var playPromise = audioCtx.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        function startAudio() {
          audioCtx.play();
          document.removeEventListener('click', startAudio);
          document.removeEventListener('touchstart', startAudio);
        }
        document.addEventListener('click', startAudio);
        document.addEventListener('touchstart', startAudio);
      });
    }
  }

  // 播放全局音频（若已在播放则不重复启动）
  function playGlobalAudio() {
    if (audioCtx && audioCtx.paused) {
      audioCtx.play().catch(function () {});
    }
  }

  // ========== 路由管理（show/hide section + 页面栈） ==========
  var pageStack = ['prologue'];
  var navParams = {};
  var pageInited = { prologue: true };

  function getPageEl(page) {
    var map = {
      'prologue': 'page-prologue',
      'index': 'page-index',
      'list': 'page-list',
      'story': 'page-story'
    };
    return $(map[page]);
  }

  function showPage(page) {
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      pages[i].classList.remove('active');
    }
    var el = getPageEl(page);
    if (el) el.classList.add('active');
  }

  // navigateTo：压栈并初始化新页面
  function navigateTo(page, params) {
    pageStack.push(page);
    navParams = params || {};
    showPage(page);
    if (!pageInited[page]) {
      pageInited[page] = true;
    }
    initPage(page, params);
  }

  // redirectTo：替换栈顶
  function redirectTo(page, params) {
    pageStack[pageStack.length - 1] = page;
    navParams = params || {};
    showPage(page);
    initPage(page, params);
  }

  // navigateBack：弹栈，不重新初始化
  function navigateBack() {
    if (pageStack.length > 1) {
      pageStack.pop();
      var page = pageStack[pageStack.length - 1];
      showPage(page);
    }
  }

  // 初始化各页面
  function initPage(page, params) {
    if (page === 'index') {
      indexPage.init();
    } else if (page === 'list') {
      listPage.init(params && params.group);
    } else if (page === 'story') {
      storyPage.init(params && params.name);
    }
  }

  // ========== 生成随机星点装饰 ==========
  function generateStars(container) {
    container.innerHTML = '';
    for (var i = 0; i < 60; i++) {
      var star = document.createElement('div');
      star.className = 'bg-star';
      var size = Math.random() * 2 + 1; // 1~3px
      star.style.left = (Math.random() * 100) + '%';
      star.style.top = (Math.random() * 100) + '%';
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.animationDelay = (Math.random() * 5) + 's';
      star.style.animationDuration = (Math.random() * 3 + 2) + 's';
      container.appendChild(star);
    }
  }

  // ========== 逐字浮现通用工具（序言页用） ==========
  function createCharSpans(container, text, className) {
    container.innerHTML = '';
    var chars = Array.from(text);
    var spans = [];
    for (var i = 0; i < chars.length; i++) {
      var span = document.createElement('span');
      span.className = className || 'char-item';
      span.textContent = chars[i];
      container.appendChild(span);
      spans.push(span);
    }
    return spans;
  }

  // ============================================================
  // ========== Page 1: 序言页 ==========
  // ============================================================
  var prologue = {
    PART1_TEXT: "《素问》云：'人与天地相参也，与日月相应也。'天地有二十八宿，人有二十四经脉。星宿流转，四时更迭，人身之气血亦随之生、长、收、藏。",
    PART2_TEXT: "《星梦岐境》集二十八宿之灵韵，融岐黄养生之大道，化作二十八方疗愈之境。无论春之生发、夏之长养，抑或秋之收敛、冬之闭藏，皆有一境可安子之神明。且随老夫，步入这星梦岐境，循星轨，调阴阳，寻回身心之大自在。",
    CHAR_INTERVAL: 300,
    PAUSE_BETWEEN: 2000,

    charTimer: null,
    part1Spans: [],
    part2Spans: [],
    allTextShown: false,
    hasNavigated: false,

    init: function () {
      var self = this;
      this.allTextShown = false;
      this.hasNavigated = false;

      // 初始化两段文字
      this.part1Spans = createCharSpans($('prologue-part1'), this.PART1_TEXT, 'char-item');
      this.part2Spans = createCharSpans($('prologue-part2'), this.PART2_TEXT, 'char-item');
      $('prologue-part2').style.display = 'none';
      $('prologue-hint').classList.remove('show');

      // 页面点击：跳过动画或无操作
      $('page-prologue').addEventListener('click', function () {
        self.onPageTap();
      });

      // 步入梦境按钮
      $('prologue-hint').addEventListener('click', function (e) {
        e.stopPropagation();
        self.onEnterTap();
      });

      // 延迟启动第一段
      setTimeout(function () { self._startPart1(); }, 500);
    },

    // 第一段逐字浮现
    _startPart1: function () {
      var self = this;
      var index = 0;
      var total = this.part1Spans.length;

      this.charTimer = setInterval(function () {
        if (index >= total) {
          clearInterval(self.charTimer);
          self.charTimer = null;
          // 停留2秒后开始第二段
          setTimeout(function () { self._startPart2(); }, self.PAUSE_BETWEEN);
          return;
        }
        self.part1Spans[index].classList.add('show');
        index++;
      }, this.CHAR_INTERVAL);
    },

    // 第二段逐字浮现 + 第一段逐字消失
    _startPart2: function () {
      var self = this;
      $('prologue-part2').style.display = '';

      var p2Index = 0;
      var p1FadeIndex = 0;
      var p2Total = this.part2Spans.length;
      var p1Total = this.part1Spans.length;

      this.charTimer = setInterval(function () {
        // 第二段逐字出现
        if (p2Index < p2Total) {
          self.part2Spans[p2Index].classList.add('show');
          p2Index++;
        }
        // 同时第一段逐字消失
        if (p1FadeIndex < p1Total) {
          self.part1Spans[p1FadeIndex].classList.remove('show');
          p1FadeIndex++;
        }
        // 全部完成
        if (p2Index >= p2Total && p1FadeIndex >= p1Total) {
          clearInterval(self.charTimer);
          self.charTimer = null;
          setTimeout(function () {
            self.allTextShown = true;
            $('prologue-hint').classList.add('show');
          }, 800);
        }
      }, this.CHAR_INTERVAL);
    },

    // 点击屏幕：如果文字未显示完，跳过动画
    onPageTap: function () {
      if (this.allTextShown) return;
      this._skipAnimation();
    },

    // 跳过逐字动画，立即显示全部文字
    _skipAnimation: function () {
      if (this.charTimer) {
        clearInterval(this.charTimer);
        this.charTimer = null;
      }
      // 第一段全部可见
      for (var i = 0; i < this.part1Spans.length; i++) {
        this.part1Spans[i].classList.add('show');
      }
      // 第二段全部可见
      $('prologue-part2').style.display = '';
      for (var j = 0; j < this.part2Spans.length; j++) {
        this.part2Spans[j].classList.add('show');
      }
      this.allTextShown = true;
      $('prologue-hint').classList.add('show');
    },

    // 点击"步入梦境"：跳转首页
    onEnterTap: function () {
      if (this.hasNavigated) return;
      this.hasNavigated = true;
      if (this.charTimer) {
        clearInterval(this.charTimer);
        this.charTimer = null;
      }
      redirectTo('index', {});
    }
  };

  // ============================================================
  // ========== Page 2: 四象首页 ==========
  // ============================================================
  var indexPage = {
    selectedIndex: -1,
    inited: false,

    init: function () {
      var self = this;

      // 确保全局古琴音频继续播放
      playGlobalAudio();

      // 生成星点
      generateStars($('index-stars'));

      // 仅首次渲染四象网格并绑定事件
      if (!this.inited) {
        this.inited = true;
        this._renderGrid();

        // 点击四象入口：首次点击选中，再次点击跳转
        $('symbol-grid').addEventListener('click', function (e) {
          var entry = e.target.closest('.symbol-entry');
          if (!entry) return;
          var index = parseInt(entry.dataset.index, 10);
          var group = entry.dataset.group;
          self.onSymbolTap(index, group);
        });
      }
    },

    _renderGrid: function () {
      var grid = $('symbol-grid');
      grid.innerHTML = '';
      for (var i = 0; i < fourSymbols.length; i++) {
        var item = fourSymbols[i];
        var entry = document.createElement('div');
        entry.className = 'symbol-entry';
        entry.dataset.index = i;
        entry.dataset.group = item.name;

        var img = document.createElement('img');
        img.className = 'symbol-img';
        img.src = item.img;
        img.alt = '';

        var name = document.createElement('span');
        name.className = 'symbol-name';
        name.textContent = item.name;

        var divider = document.createElement('div');
        divider.className = 'entry-divider';

        var desc = document.createElement('span');
        desc.className = 'symbol-desc';
        desc.textContent = item.desc;

        entry.appendChild(img);
        entry.appendChild(name);
        entry.appendChild(divider);
        entry.appendChild(desc);
        grid.appendChild(entry);
      }
    },

    onSymbolTap: function (index, group) {
      if (this.selectedIndex === index) {
        // 已选中状态再点击 → 跳转
        navigateTo('list', { group: group });
      } else {
        // 首次点击 → 选中
        this.selectedIndex = index;
        this._updateSelection();
      }
    },

    _updateSelection: function () {
      var entries = $('symbol-grid').querySelectorAll('.symbol-entry');
      for (var i = 0; i < entries.length; i++) {
        entries[i].classList.toggle('entry-active', i === this.selectedIndex);
      }
    }
  };

  // ============================================================
  // ========== Page 3: 星宿列表页 ==========
  // ============================================================
  var listPage = {
    groupName: '',
    currentIndex: 0,
    constellations: [],
    inited: false,

    init: function (group) {
      var self = this;

      // 确保全局古琴音频继续播放
      playGlobalAudio();

      // 生成星点
      generateStars($('list-stars'));

      // 设置四象名称
      this.groupName = group || '';
      $('list-group-title').textContent = this.groupName;

      // 加载该四象下的7个星宿
      var list = constellationData[this.groupName] || [];
      this.constellations = [];
      for (var i = 0; i < list.length; i++) {
        this.constellations.push({
          name: list[i].name,
          desc: list[i].desc,
          img: 'images/constellations/' + list[i].name + '.png'
        });
      }

      this.currentIndex = 0;
      this._renderList();

      // 绑定事件（仅一次）
      if (!this.inited) {
        this.inited = true;

        // 返回按钮
        $('list-back-btn').addEventListener('click', function () {
          self.onBack();
        });

        // 步入此境按钮
        $('list-enter-btn').addEventListener('click', function () {
          self.onEnter();
        });

        // swiper 滚动监听：更新当前索引
        var swiper = $('constellation-swiper');
        var scrollRAF = null;
        swiper.addEventListener('scroll', function () {
          if (scrollRAF) cancelAnimationFrame(scrollRAF);
          scrollRAF = requestAnimationFrame(function () {
            var idx = Math.round(swiper.scrollTop / swiper.clientHeight);
            if (idx !== self.currentIndex && idx >= 0 && idx < self.constellations.length) {
              self.currentIndex = idx;
              self._updateSelection();
            }
          });
        });
      }

      // 重置滚动位置
      $('constellation-swiper').scrollTop = 0;
      this._updateSelection();
    },

    _renderList: function () {
      var swiper = $('constellation-swiper');
      swiper.innerHTML = '';
      for (var i = 0; i < this.constellations.length; i++) {
        var item = this.constellations[i];
        var el = document.createElement('div');
        el.className = 'constellation-item';
        el.dataset.index = i;

        var img = document.createElement('img');
        img.className = 'constellation-img';
        img.src = item.img;
        img.alt = '';

        var name = document.createElement('span');
        name.className = 'constellation-name';
        name.textContent = item.name;

        var desc = document.createElement('span');
        desc.className = 'constellation-desc';
        desc.textContent = item.desc;

        el.appendChild(img);
        el.appendChild(name);
        el.appendChild(desc);

        // 点击星宿卡片直接选中
        (function (index, self) {
          el.addEventListener('click', function () {
            self.currentIndex = index;
            self._updateSelection();
            var swiperEl = $('constellation-swiper');
            swiperEl.scrollTo({ top: index * swiperEl.clientHeight, behavior: 'smooth' });
          });
        })(i, this);

        swiper.appendChild(el);
      }
    },

    _updateSelection: function () {
      var items = $('constellation-swiper').querySelectorAll('.constellation-item');
      for (var i = 0; i < items.length; i++) {
        items[i].classList.toggle('item-active', i === this.currentIndex);
      }
    },

    onBack: function () {
      navigateBack();
    },

    onEnter: function () {
      var current = this.constellations[this.currentIndex];
      if (!current) return;
      navigateTo('story', { name: current.name });
    }
  };

  // ============================================================
  // ========== Page 4: 故事交互页 ==========
  // ============================================================
  // 单字浮现间隔（ms）
  var CHAR_INTERVAL = 300;
  // 段落之间停顿（ms）
  var SEGMENT_GAP = 1200;
  // 反馈停留时长（ms）
  var FEEDBACK_DELAY = 2500;
  // 交互淡出过渡（ms）
  var INTERACTION_FADE = 700;

  var storyPage = {
    script: null,
    currentStep: 1,
    timers: [],
    rippleTimers: [],
    step1Done: false,
    step2Done: false,
    step4Done: false,
    saving: false,
    interactionIndex: 0,
    showBreathRing: false,
    showFeedback: false,
    inited: false,

    init: function (name) {
      var self = this;

      // 清理之前的定时器
      this._clearAllTimers();

      // 重置状态
      this.currentStep = 1;
      this.step1Done = false;
      this.step2Done = false;
      this.step4Done = false;
      this.saving = false;
      this.showBreathRing = false;
      this.showFeedback = false;
      this.interactionIndex = 0;

      // 确保全局古琴音频继续播放
      playGlobalAudio();

      // 加载剧本
      this.script = scripts[name] || scripts['心宿'];

      // 重置所有步骤 DOM
      this._resetSteps();

      // 设置星宿名称和标题
      $('story-name').textContent = this.script.name;
      $('story-title').textContent = this.script.title;

      // 绑定事件（仅一次）
      if (!this.inited) {
        this.inited = true;

        // 页面点击分发（Step 1 / Step 2 / Step 4）
        $('page-story').addEventListener('click', function () {
          self.onPageTap();
        });

        // 呼吸光圈点击
        $('breath-area').addEventListener('click', function (e) {
          e.stopPropagation();
          var rect = this.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          self.onBreathTap(x, y);
        });

        // 保存手札按钮
        $('save-btn').addEventListener('click', function (e) {
          e.stopPropagation();
          self.onSaveCard();
        });
      }

      // 设置 Step 1 为活跃
      this._setStep(1);

      // 延迟启动 Step 1
      this._schedule(500, function () { self._startStep1(); });
    },

    _resetSteps: function () {
      // 隐藏所有步骤
      for (var i = 1; i <= 4; i++) {
        $('step-' + i).classList.remove('active');
      }
      // 清空字符容器
      $('step1-intro').innerHTML = '';
      $('step1-medicine').innerHTML = '';
      $('step2-scene').innerHTML = '';
      $('step2-npc').innerHTML = '';
      $('step2-npc').classList.remove('ready');
      $('step1-hint').classList.remove('show');
      $('step2-hint').classList.remove('show');
      $('interaction-name').innerHTML = '';
      $('interaction-action').innerHTML = '';
      $('breath-area').classList.remove('show', 'burst');
      $('interaction-feedback').classList.remove('show');
      $('ripples-layer').innerHTML = '';
      $('step4-ending').innerHTML = '';
      $('save-btn').classList.remove('show');
      $('back-hint').classList.remove('show');
      $('interaction').classList.remove('visible');
    },

    _setStep: function (step) {
      this.currentStep = step;
      for (var i = 1; i <= 4; i++) {
        $('step-' + i).classList.toggle('active', i === step);
      }
    },

    // 统一的 setTimeout 调度
    _schedule: function (delay, fn) {
      var t = setTimeout(fn, delay);
      this.timers.push(t);
      return t;
    },

    _clearAllTimers: function () {
      if (this.timers && this.timers.length) {
        for (var i = 0; i < this.timers.length; i++) {
          clearTimeout(this.timers[i]);
        }
        this.timers = [];
      }
      if (this.rippleTimers && this.rippleTimers.length) {
        for (var j = 0; j < this.rippleTimers.length; j++) {
          clearTimeout(this.rippleTimers[j]);
        }
        this.rippleTimers = [];
      }
    },

    // 逐字浮现：将文本拆为字符 span，按间隔逐字添加 show 类
    _typewriter: function (containerId, text, interval, className, onComplete) {
      var container = $(containerId);
      container.innerHTML = '';
      var chars = Array.from(text);
      var spans = [];
      var self = this;
      for (var i = 0; i < chars.length; i++) {
        var span = document.createElement('span');
        span.className = className || 'char-item';
        span.textContent = chars[i];
        container.appendChild(span);
        spans.push(span);
      }
      for (var j = 0; j < chars.length; j++) {
        (function (idx) {
          self._schedule(idx * interval, function () {
            spans[idx].classList.add('show');
            if (idx === chars.length - 1 && onComplete) onComplete();
          });
        })(j);
      }
    },

    // 跳过动画：立即让某段字符全部可见
    _completeChars: function (containerId) {
      var container = $(containerId);
      var spans = container.querySelectorAll('.char-item, .name-char');
      for (var i = 0; i < spans.length; i++) {
        spans[i].classList.add('show');
      }
    },

    // ========== Step 1: 星宿引子 ==========
    _startStep1: function () {
      var self = this;
      var s = this.script;
      // 引子先逐字浮现
      this._typewriter('step1-intro', s.intro, CHAR_INTERVAL, 'char-item', function () {
        // 引子完成后，停顿显示中医归旨
        self._schedule(SEGMENT_GAP, function () {
          self._typewriter('step1-medicine', s.medicine, CHAR_INTERVAL, 'char-item', function () {
            self.step1Done = true;
            self._schedule(400, function () { $('step1-hint').classList.add('show'); });
          });
        });
      });
    },

    _onStep1Tap: function () {
      var self = this;
      if (!this.step1Done) {
        // 文字未浮现完：跳过动画
        this._clearAllTimers();
        this._completeChars('step1-intro');
        this._completeChars('step1-medicine');
        this.step1Done = true;
        $('step1-hint').classList.add('show');
        return;
      }
      this._goStep2();
    },

    _goStep2: function () {
      this._setStep(2);
      this._startStep2();
    },

    // ========== Step 2: 场景风貌 ==========
    _startStep2: function () {
      var self = this;
      var s = this.script;
      // 场景风貌逐字浮现
      this._typewriter('step2-scene', s.scene, CHAR_INTERVAL, 'char-item', function () {
        // 场景完成后，停顿显示 NPC 开场白
        self._schedule(SEGMENT_GAP, function () {
          $('step2-npc').classList.add('ready');
          self._typewriter('step2-npc', s.npc, CHAR_INTERVAL, 'char-item npc-char', function () {
            self.step2Done = true;
            self._schedule(400, function () { $('step2-hint').classList.add('show'); });
          });
        });
      });
    },

    _onStep2Tap: function () {
      if (!this.step2Done) {
        this._clearAllTimers();
        this._completeChars('step2-scene');
        this._completeChars('step2-npc');
        this.step2Done = true;
        $('step2-npc').classList.add('ready');
        $('step2-hint').classList.add('show');
        return;
      }
      this._goStep3();
    },

    _goStep3: function () {
      this._setStep(3);
      this._startInteraction(0);
    },

    // ========== Step 3: 轻交互 ==========
    _startInteraction: function (index) {
      var self = this;
      var interactions = this.script.interactions;
      if (!interactions || index >= interactions.length) {
        this._goStep4();
        return;
      }
      var item = interactions[index];

      // 重置交互状态
      this.showBreathRing = false;
      this.showFeedback = false;
      $('interaction-name').innerHTML = '';
      $('interaction-action').innerHTML = '';
      $('breath-area').classList.remove('show', 'burst');
      $('interaction-feedback').classList.remove('show');
      $('ripples-layer').innerHTML = '';

      // 设置序号
      $('interaction-index').textContent = '其' + (index + 1);

      // 淡入交互容器
      $('interaction').classList.remove('visible');
      this._schedule(50, function () { $('interaction').classList.add('visible'); });

      // 交互名称逐字（短词，间隔稍快）
      this._typewriter('interaction-name', item.name, 150, 'name-char', function () {
        // 动作指引逐字
        self._typewriter('interaction-action', item.action, CHAR_INTERVAL, 'char-item', function () {
          // 显示呼吸光圈，等待用户触摸
          self._schedule(300, function () {
            self.showBreathRing = true;
            $('breath-area').classList.add('show');
          });
        });
      });
    },

    // 触摸呼吸光圈：触发爆发 + 涟漪 + 反馈
    onBreathTap: function (x, y) {
      var self = this;
      if (!this.showBreathRing || this.showFeedback) return;

      // 生成涟漪
      this._spawnRipple(x, y);

      // 爆发动画
      $('breath-area').classList.add('burst');
      vibrateShort();

      var item = this.script.interactions[this.interactionIndex];

      // 光圈爆发后淡入反馈与禅意
      this._schedule(350, function () {
        $('feedback-text').textContent = item.feedback;
        $('zen-text').textContent = item.zen;
        $('interaction-feedback').classList.add('show');
        self.showFeedback = true;
      });

      // 停留 2.5s 后进入下一个交互
      this._schedule(350 + FEEDBACK_DELAY, function () {
        self._nextInteraction();
      });
    },

    _nextInteraction: function () {
      var self = this;
      // 淡出当前交互
      $('interaction').classList.remove('visible');
      this.showBreathRing = false;
      this.showFeedback = false;
      var next = this.interactionIndex + 1;
      this._schedule(INTERACTION_FADE, function () {
        self.interactionIndex = next;
        self._startInteraction(next);
      });
    },

    // 在触摸点生成扩散涟漪
    _spawnRipple: function (x, y) {
      var ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      $('ripples-layer').appendChild(ripple);
      var t = setTimeout(function () {
        if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      }, 1200);
      this.rippleTimers.push(t);
    },

    _goStep4: function () {
      this._setStep(4);
      this._startStep4();
    },

    // ========== Step 4: 结语 ==========
    _startStep4: function () {
      var self = this;
      var s = this.script;
      this._typewriter('step4-ending', s.ending, CHAR_INTERVAL, 'char-item', function () {
        self.step4Done = true;
        self._schedule(500, function () {
          $('save-btn').classList.add('show');
          $('back-hint').classList.add('show');
        });
      });
    },

    // 页面点击分发（Step 1 / Step 2 / Step 4 推进）
    onPageTap: function () {
      if (this.currentStep === 1) {
        this._onStep1Tap();
      } else if (this.currentStep === 2) {
        this._onStep2Tap();
      } else if (this.currentStep === 4 && this.step4Done) {
        // 结语显示完毕，轻触返回星座列表页
        this._goBack();
      }
    },

    // 返回上一页（星座列表页）
    _goBack: function () {
      this._clearAllTimers();
      navigateBack();
    },

    // ========== 保存手札 ==========
    onSaveCard: function () {
      if (this.saving) return;
      this.saving = true;
      var self = this;
      showLoading('正在生成手札');

      setTimeout(function () {
        try {
          self._drawCard();
          var canvas = $('card-canvas');
          var dataUrl = canvas.toDataURL('image/png');
          hideLoading();

          // 创建下载链接
          var link = document.createElement('a');
          link.download = '星梦岐境-' + self.script.name + '.png';
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showToast('手札已保存');
        } catch (err) {
          hideLoading();
          console.error('[story] save card failed:', err);
          showToast('生成手札失败');
        }
        self.saving = false;
      }, 300);
    },

    // 使用 Canvas 2D 绘制手札图片（玄底月白，宋体楷体）
    _drawCard: function () {
      var canvas = $('card-canvas');
      var ctx = canvas.getContext('2d');
      var s = this.script;
      var W = 600;
      var H = 900;

      // 玄色背景
      ctx.fillStyle = '#1C1C1C';
      ctx.fillRect(0, 0, W, H);

      // 顶部柔和光晕
      var halo = ctx.createRadialGradient(W / 2, 160, 10, W / 2, 160, 250);
      halo.addColorStop(0, 'rgba(240,240,240,0.10)');
      halo.addColorStop(1, 'rgba(240,240,240,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, W, 300);

      // 内边框
      ctx.strokeStyle = 'rgba(240,240,240,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, W - 80, H - 80);

      // 标题：星宿 · 标题
      ctx.fillStyle = '#F0F0F0';
      ctx.textAlign = 'center';
      ctx.font = '46px "Songti SC", "STSong", serif';
      ctx.fillText(s.name + ' · ' + s.title, W / 2, 150);

      // 四象分组
      ctx.font = '22px "Songti SC", serif';
      ctx.fillStyle = 'rgba(240,240,240,0.5)';
      ctx.fillText(s.group, W / 2, 192);

      // 分隔线
      ctx.strokeStyle = 'rgba(240,240,240,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(120, 232);
      ctx.lineTo(W - 120, 232);
      ctx.stroke();

      // 正文：引子（按字数换行）
      ctx.textAlign = 'left';
      ctx.fillStyle = '#F0F0F0';
      ctx.font = '26px "Kaiti SC", "STKaiti", serif';
      var y = 296;
      var introLines = this._wrapText(s.intro, 18);
      for (var i = 0; i < introLines.length; i++) {
        ctx.fillText(introLines[i], 70, y);
        y += 44;
      }

      // 结语
      y += 28;
      ctx.fillStyle = 'rgba(240,240,240,0.78)';
      ctx.font = '24px "Kaiti SC", "STKaiti", serif';
      var endingLines = this._wrapText(s.ending, 20);
      for (var j = 0; j < endingLines.length; j++) {
        ctx.fillText(endingLines[j], 70, y);
        y += 42;
      }

      // 落款
      ctx.textAlign = 'center';
      ctx.font = '22px "Songti SC", serif';
      ctx.fillStyle = 'rgba(240,240,240,0.4)';
      ctx.fillText('—— 星梦岐境 ——', W / 2, H - 112);

      // 日期
      ctx.font = '18px "Songti SC", serif';
      ctx.fillStyle = 'rgba(240,240,240,0.3)';
      ctx.fillText(this._formatDate(new Date()), W / 2, H - 78);
    },

    // 按字符数换行
    _wrapText: function (text, maxLen) {
      var chars = Array.from(text);
      var lines = [];
      var line = '';
      for (var i = 0; i < chars.length; i++) {
        var c = chars[i];
        if (c === '\n') {
          lines.push(line);
          line = '';
          continue;
        }
        line += c;
        if (Array.from(line).length >= maxLen) {
          lines.push(line);
          line = '';
        }
      }
      if (line) lines.push(line);
      return lines;
    },

    _formatDate: function (d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return y + '年' + m + '月' + day + '日';
    }
  };

  // ========== 初始化 ==========
  document.addEventListener('DOMContentLoaded', function () {
    // 初始化全局音频（页面加载即播放）
    initAudio();
    // 启动序言页
    prologue.init();
  });

})();
