/**
 * 本草灵枢 · 穴位与经络数据库
 * 包含 14 正经 + 经外奇穴，共 80+ 常用穴位
 */
const MERIDIANS_DATA = [
  { id: 1, name: '手太阴肺经', code: 'LU', points: 11, description: '起于中焦，下络大肠，还循胃口，上膈属肺。从肺系横出腋下，沿上肢内侧前缘下行至拇指末端。', color: '#E5C84A' },
  { id: 2, name: '手阳明大肠经', code: 'LI', points: 20, description: '起于食指末端，沿上肢外侧前缘上行，经肩、颈至鼻翼旁。', color: '#D4842A' },
  { id: 3, name: '足阳明胃经', code: 'ST', points: 45, description: '起于鼻翼旁，下行沿面颈、胸腹、下肢前外侧至第二趾末端。', color: '#C9A227' },
  { id: 4, name: '足太阴脾经', code: 'SP', points: 21, description: '起于足大趾内侧端，沿下肢内侧上行入腹，属脾络胃。', color: '#5A9B6E' },
  { id: 5, name: '手少阴心经', code: 'HT', points: 9, description: '起于心中，出属心系，下络小肠，其支者沿上肢内侧后缘下行至小指末端。', color: '#B83A3A' },
  { id: 6, name: '手太阳小肠经', code: 'SI', points: 19, description: '起于小指外侧端，沿上肢外侧后缘上行，经肩胛绕行至耳前。', color: '#C95A5A' },
  { id: 7, name: '足太阳膀胱经', code: 'BL', points: 67, description: '起于目内眦，上额交巅，沿头项下行，经背腰臀部沿下肢后侧至小趾外侧端。', color: '#4A6B5A' },
  { id: 8, name: '足少阴肾经', code: 'KI', points: 27, description: '起于足小趾下，斜向足心，沿下肢内侧后缘上行入腹，属肾络膀胱。', color: '#2D5A4A' },
  { id: 9, name: '手厥阴心包经', code: 'PC', points: 9, description: '起于胸中，出属心包络，其支者沿上肢内侧中线下行至中指末端。', color: '#8B5A2B' },
  { id: 10, name: '手少阳三焦经', code: 'TE', points: 23, description: '起于无名指末端，沿上肢外侧中线上行，经肩颈至耳后绕行至目外眦。', color: '#A67B4D' },
  { id: 11, name: '足少阳胆经', code: 'GB', points: 44, description: '起于目外眦，上抵额角，下耳后，循颈至肩，沿胁肋下行至下肢外侧至第四趾末端。', color: '#3D7A64' },
  { id: 12, name: '足厥阴肝经', code: 'LR', points: 14, description: '起于足大趾爪甲后，沿下肢内侧中线上行入腹，属肝络胆。', color: '#6B8E5A' },
  { id: 13, name: '任脉', code: 'RN', points: 24, description: '起于小腹内，下出会阴，沿腹胸正中上行至颏部。', color: '#6B5A8C' },
  { id: 14, name: '督脉', code: 'DU', points: 29, description: '起于小腹内，下出会阴，沿脊柱正中上行至头面。', color: '#4A3A5A' },
  { id: 15, name: '经外奇穴', code: 'EX', points: 0, description: '不归属于十四正经的穴位，临床经验效穴。', color: '#8B6B9C' }
];

const ACUPOINTS_DATA = [
  // ===== 手太阴肺经 (LU) =====
  { id: 1, name: '中府', code: 'LU1', meridian: '手太阴肺经', location: '胸前壁外上方，前正中线旁开6寸，平第1肋间隙处', indication: '咳嗽，气喘，胸痛，肩背痛', method: '向外斜刺或平刺0.5-0.8寸', category: '胸腹部' },
  { id: 2, name: '尺泽', code: 'LU5', meridian: '手太阴肺经', location: '肘横纹中，肱二头肌腱桡侧凹陷处', indication: '咳嗽，气喘，咯血，潮热，咽喉肿痛', method: '直刺0.8-1.2寸', category: '上肢部' },
  { id: 3, name: '列缺', code: 'LU7', meridian: '手太阴肺经', location: '桡骨茎突上方，腕横纹上1.5寸', indication: '头痛，颈项强痛，咳嗽，气喘，咽喉痛', method: '向上斜刺0.3-0.5寸', category: '上肢部' },
  { id: 4, name: '太渊', code: 'LU9', meridian: '手太阴肺经', location: '腕掌侧横纹桡侧，桡动脉搏动处', indication: '咳嗽，气喘，咳血，胸痛，无脉症', method: '避开桡动脉直刺0.3-0.5寸', category: '上肢部' },
  { id: 5, name: '鱼际', code: 'LU10', meridian: '手太阴肺经', location: '第1掌骨中点桡侧，赤白肉际处', indication: '咳嗽，咯血，咽喉肿痛，发热', method: '直刺0.5-0.8寸', category: '上肢部' },
  { id: 6, name: '少商', code: 'LU11', meridian: '手太阴肺经', location: '拇指末节桡侧，指甲根角旁0.1寸', indication: '咽喉肿痛，鼻衄，高热，昏迷', method: '浅刺0.1寸或点刺出血', category: '上肢部' },

  // ===== 手阳明大肠经 (LI) =====
  { id: 7, name: '合谷', code: 'LI4', meridian: '手阳明大肠经', location: '第1、2掌骨间，第2掌骨桡侧中点处', indication: '头痛，牙痛，咽喉痛，面瘫，发热，感冒', method: '直刺0.5-1寸，孕妇禁针', category: '上肢部' },
  { id: 8, name: '曲池', code: 'LI11', meridian: '手阳明大肠经', location: '肘横纹外侧端，屈肘取穴', indication: '发热，高血压，荨麻疹，湿疹，咽喉肿痛', method: '直刺1-1.5寸', category: '上肢部' },
  { id: 9, name: '肩髃', code: 'LI15', meridian: '手阳明大肠经', location: '肩部，三角肌上，肩峰前下方凹陷处', indication: '肩臂疼痛，肩关节周围炎，上肢瘫痪', method: '直刺或向下斜刺0.8-1.5寸', category: '上肢部' },
  { id: 10, name: '迎香', code: 'LI20', meridian: '手阳明大肠经', location: '鼻翼旁开0.5寸，鼻唇沟中', indication: '鼻塞，鼻衄，面瘫，面痒，胆道蛔虫症', method: '斜刺或平刺0.3-0.5寸', category: '头面部' },

  // ===== 足阳明胃经 (ST) =====
  { id: 11, name: '四白', code: 'ST2', meridian: '足阳明胃经', location: '目正视，瞳孔直下，眶下孔凹陷处', indication: '面瘫，面肌痉挛，眼睑下垂，近视', method: '直刺或斜刺0.3-0.5寸', category: '头面部' },
  { id: 12, name: '地仓', code: 'ST4', meridian: '足阳明胃经', location: '口角旁开0.4寸', indication: '面瘫，流涎，面肌痉挛', method: '斜刺或平刺0.5-0.8寸', category: '头面部' },
  { id: 13, name: '下关', code: 'ST7', meridian: '足阳明胃经', location: '耳前方，颧弓下缘凹陷处', indication: '牙痛，面痛，下颌关节炎，耳聋耳鸣', method: '直刺0.5-1寸', category: '头面部' },
  { id: 14, name: '天枢', code: 'ST25', meridian: '足阳明胃经', location: '脐中旁开2寸', indication: '腹痛，腹胀，便秘，腹泻，月经不调', method: '直刺1-1.5寸', category: '胸腹部' },
  { id: 15, name: '足三里', code: 'ST36', meridian: '足阳明胃经', location: '犊鼻下3寸，胫骨前缘外一横指', indication: '胃痛，呕吐，腹胀，腹泻，消化不良，强身保健', method: '直刺1-2寸', category: '下肢部' },
  { id: 16, name: '丰隆', code: 'ST40', meridian: '足阳明胃经', location: '外踝尖上8寸，胫骨前缘外二横指', indication: '痰多咳嗽，眩晕，头痛，下肢痿痹', method: '直刺1-1.5寸', category: '下肢部' },
  { id: 17, name: '内庭', code: 'ST44', meridian: '足阳明胃经', location: '足背第2、3趾间，趾蹼缘后方赤白肉际处', indication: '牙痛，咽喉痛，胃痛，腹胀', method: '直刺或斜刺0.3-0.5寸', category: '下肢部' },

  // ===== 足太阴脾经 (SP) =====
  { id: 18, name: '三阴交', code: 'SP6', meridian: '足太阴脾经', location: '内踝尖上3寸，胫骨内侧缘后际', indication: '月经不调，痛经，不孕，失眠，消化不良', method: '直刺1-1.5寸，孕妇禁针', category: '下肢部' },
  { id: 19, name: '阴陵泉', code: 'SP9', meridian: '足太阴脾经', location: '胫骨内侧髁后下方凹陷处', indication: '腹胀，水肿，小便不利，膝痛', method: '直刺1-2寸', category: '下肢部' },
  { id: 20, name: '血海', code: 'SP10', meridian: '足太阴脾经', location: '髌骨内上缘上2寸，股内侧肌内侧缘', indication: '月经不调，痛经，荨麻疹，湿疹', method: '直刺1-1.5寸', category: '下肢部' },

  // ===== 手少阴心经 (HT) =====
  { id: 21, name: '极泉', code: 'HT1', meridian: '手少阴心经', location: '腋窝正中，腋动脉搏动处', indication: '心痛，心悸，胸闷，肩臂疼痛', method: '避开动脉直刺0.5-1寸', category: '上肢部' },
  { id: 22, name: '神门', code: 'HT7', meridian: '手少阴心经', location: '腕掌侧横纹尺侧端，尺侧腕屈肌腱桡侧凹陷', indication: '失眠，心悸，健忘，癫痫，焦虑', method: '直刺0.3-0.5寸', category: '上肢部' },
  { id: 23, name: '少府', code: 'HT8', meridian: '手少阴心经', location: '手掌面，第4、5掌骨间，握拳时小指尖处', indication: '心悸，胸痛，小便不利，遗尿', method: '直刺0.3-0.5寸', category: '上肢部' },

  // ===== 足太阳膀胱经 (BL) =====
  { id: 24, name: '睛明', code: 'BL1', meridian: '足太阳膀胱经', location: '目内眦旁0.1寸', indication: '近视，目赤肿痛，流泪，夜盲', method: '嘱患者闭目，浅刺0.1-0.3寸', category: '头面部' },
  { id: 25, name: '攒竹', code: 'BL2', meridian: '足太阳膀胱经', location: '眉头凹陷处，眶上切迹处', indication: '头痛，目眩，面瘫，眼睑下垂', method: '平刺或斜刺0.3-0.5寸', category: '头面部' },
  { id: 26, name: '风门', code: 'BL12', meridian: '足太阳膀胱经', location: '第2胸椎棘突下，旁开1.5寸', indication: '感冒，咳嗽，发热，项强', method: '斜刺0.5-0.8寸', category: '背腰部' },
  { id: 27, name: '肺俞', code: 'BL13', meridian: '足太阳膀胱经', location: '第3胸椎棘突下，旁开1.5寸', indication: '咳嗽，气喘，咯血，盗汗', method: '斜刺0.5-0.8寸', category: '背腰部' },
  { id: 28, name: '心俞', code: 'BL15', meridian: '足太阳膀胱经', location: '第5胸椎棘突下，旁开1.5寸', indication: '心悸，失眠，健忘，心痛', method: '斜刺0.5-0.8寸', category: '背腰部' },
  { id: 29, name: '肝俞', code: 'BL18', meridian: '足太阳膀胱经', location: '第9胸椎棘突下，旁开1.5寸', indication: '胁痛，目赤，眩晕，月经不调', method: '斜刺0.5-0.8寸', category: '背腰部' },
  { id: 30, name: '脾俞', code: 'BL20', meridian: '足太阳膀胱经', location: '第11胸椎棘突下，旁开1.5寸', indication: '腹胀，腹泻，水肿，食欲不振', method: '斜刺0.5-0.8寸', category: '背腰部' },
  { id: 31, name: '肾俞', code: 'BL23', meridian: '足太阳膀胱经', location: '第2腰椎棘突下，旁开1.5寸', indication: '腰痛，遗精，阳痿，月经不调，耳鸣', method: '直刺0.5-1寸', category: '背腰部' },
  { id: 32, name: '委中', code: 'BL40', meridian: '足太阳膀胱经', location: '腘窝横纹中点', indication: '腰背痛，下肢痿痹，腹痛，急性吐泻', method: '直刺1-1.5寸或刺出血', category: '下肢部' },
  { id: 33, name: '承山', code: 'BL57', meridian: '足太阳膀胱经', location: '腓肠肌肌腹下方凹陷处', indication: '腰腿痛，小腿抽筋，便秘，痔疮', method: '直刺1-2寸', category: '下肢部' },
  { id: 34, name: '昆仑', code: 'BL60', meridian: '足太阳膀胱经', location: '外踝尖与跟腱之间凹陷处', indication: '头痛，项强，腰腿痛，难产', method: '直刺0.5-1寸，孕妇禁针', category: '下肢部' },

  // ===== 足少阴肾经 (KI) =====
  { id: 35, name: '涌泉', code: 'KI1', meridian: '足少阴肾经', location: '足底前1/3与后2/3交点，蜷足时足前缘凹陷处', indication: '头晕，失眠，便秘，高血压，急救', method: '直刺0.5-1寸', category: '下肢部' },
  { id: 36, name: '太溪', code: 'KI3', meridian: '足少阴肾经', location: '内踝尖与跟腱之间凹陷处', indication: '腰痛，耳鸣，遗精，月经不调，足跟痛', method: '直刺0.5-1寸', category: '下肢部' },

  // ===== 手厥阴心包经 (PC) =====
  { id: 37, name: '曲泽', code: 'PC3', meridian: '手厥阴心包经', location: '肘横纹中，肱二头肌腱尺侧凹陷处', indication: '心悸，心痛，胃痛，呕吐', method: '直刺1-1.5寸或刺出血', category: '上肢部' },
  { id: 38, name: '内关', code: 'PC6', meridian: '手厥阴心包经', location: '腕横纹上2寸，掌长肌腱与桡侧腕屈肌腱之间', indication: '心悸，胸闷，胃痛，恶心呕吐，失眠', method: '直刺0.5-1寸', category: '上肢部' },
  { id: 39, name: '劳宫', code: 'PC8', meridian: '手厥阴心包经', location: '掌心，第2、3掌骨之间偏第3掌骨，握拳屈指中指尖处', indication: '口疮，口臭，心悸，中风昏迷', method: '直刺0.3-0.5寸', category: '上肢部' },

  // ===== 手少阳三焦经 (TE) =====
  { id: 40, name: '外关', code: 'TE5', meridian: '手少阳三焦经', location: '腕背横纹上2寸，桡骨与尺骨之间', indication: '发热，头痛，耳鸣，目赤肿痛，上肢痿痹', method: '直刺0.5-1寸', category: '上肢部' },
  { id: 41, name: '支沟', code: 'TE6', meridian: '手少阳三焦经', location: '腕背横纹上3寸，桡骨与尺骨之间', indication: '便秘，胁肋痛，耳鸣耳聋', method: '直刺0.5-1寸', category: '上肢部' },
  { id: 42, name: '翳风', code: 'TE17', meridian: '手少阳三焦经', location: '耳垂后方，乳突前下方凹陷处', indication: '面瘫，耳鸣耳聋，牙关紧闭', method: '直刺0.8-1.2寸', category: '头面部' },

  // ===== 足少阳胆经 (GB) =====
  { id: 43, name: '风池', code: 'GB20', meridian: '足少阳胆经', location: '项后枕骨下，胸锁乳突肌与斜方肌之间凹陷处', indication: '头痛，眩晕，感冒，颈项强痛，高血压', method: '向鼻尖方向斜刺0.8-1.2寸', category: '头颈部' },
  { id: 44, name: '肩井', code: 'GB21', meridian: '足少阳胆经', location: '大椎穴与肩峰连线中点', indication: '肩背痛，颈项强痛，乳痈，难产', method: '直刺0.5-0.8寸，不可深刺', category: '背腰部' },
  { id: 45, name: '环跳', code: 'GB30', meridian: '足少阳胆经', location: '股骨大转子最凸点与骶管裂孔连线外1/3与内2/3交点', indication: '腰腿痛，坐骨神经痛，下肢痿痹', method: '直刺2-3寸', category: '下肢部' },
  { id: 46, name: '阳陵泉', code: 'GB34', meridian: '足少阳胆经', location: '腓骨小头前下方凹陷处', indication: '胁痛，膝痛，下肢痿痹，黄疸', method: '直刺1-1.5寸', category: '下肢部' },
  { id: 47, name: '悬钟', code: 'GB39', meridian: '足少阳胆经', location: '外踝尖上3寸，腓骨前缘', indication: '颈项强痛，胸胁胀痛，下肢痿痹', method: '直刺0.5-1寸', category: '下肢部' },

  // ===== 足厥阴肝经 (LR) =====
  { id: 48, name: '行间', code: 'LR2', meridian: '足厥阴肝经', location: '足背第1、2趾间，趾蹼缘后方赤白肉际处', indication: '头痛，目赤，胁痛，月经不调', method: '直刺0.5-0.8寸', category: '下肢部' },
  { id: 49, name: '太冲', code: 'LR3', meridian: '足厥阴肝经', location: '足背第1、2跖骨间，跖骨结合部前凹陷处', indication: '头痛眩晕，目赤肿痛，胁痛，月经不调', method: '直刺0.5-0.8寸', category: '下肢部' },

  // ===== 任脉 (RN) =====
  { id: 50, name: '中极', code: 'RN3', meridian: '任脉', location: '前正中线上，脐下4寸', indication: '遗尿，小便不利，遗精，月经不调', method: '直刺1-1.5寸，孕妇禁针', category: '胸腹部' },
  { id: 51, name: '关元', code: 'RN4', meridian: '任脉', location: '前正中线上，脐下3寸', indication: '遗精，阳痿，月经不调，腹痛，保健强壮', method: '直刺1-1.5寸，孕妇禁针', category: '胸腹部' },
  { id: 52, name: '气海', code: 'RN6', meridian: '任脉', location: '前正中线上，脐下1.5寸', indication: '腹痛，腹泻，遗尿，遗精，气虚乏力', method: '直刺1-1.5寸，孕妇慎用', category: '胸腹部' },
  { id: 53, name: '神阙', code: 'RN8', meridian: '任脉', location: '脐窝中央', indication: '腹痛，腹泻，脱肛，中风脱证', method: '禁针，艾灸为主', category: '胸腹部' },
  { id: 54, name: '中脘', code: 'RN12', meridian: '任脉', location: '前正中线上，脐上4寸', indication: '胃痛，腹胀，呕吐，消化不良', method: '直刺1-1.5寸', category: '胸腹部' },
  { id: 55, name: '膻中', code: 'RN17', meridian: '任脉', location: '前正中线上，平第4肋间隙', indication: '胸闷，胸痛，乳汁不足，咳嗽气喘', method: '平刺0.3-0.5寸', category: '胸腹部' },

  // ===== 督脉 (DU) =====
  { id: 56, name: '腰阳关', code: 'DU3', meridian: '督脉', location: '后正中线上，第4腰椎棘突下', indication: '腰骶痛，下肢痿痹，遗精，月经不调', method: '向上斜刺0.5-1寸', category: '背腰部' },
  { id: 57, name: '命门', code: 'DU4', meridian: '督脉', location: '后正中线上，第2腰椎棘突下', indication: '腰痛，遗精，阳痿，带下，手足冰冷', method: '向上斜刺0.5-1寸', category: '背腰部' },
  { id: 58, name: '至阳', code: 'DU9', meridian: '督脉', location: '后正中线上，第7胸椎棘突下', indication: '黄疸，胸胁胀痛，背痛', method: '向上斜刺0.5-1寸', category: '背腰部' },
  { id: 59, name: '大椎', code: 'DU14', meridian: '督脉', location: '后正中线上，第7颈椎棘突下', indication: '发热，感冒，咳嗽，项强，癫痫', method: '斜刺0.5-1寸', category: '头颈部' },
  { id: 60, name: '百会', code: 'DU20', meridian: '督脉', location: '头顶正中，两耳尖直上连线中点', indication: '头痛，眩晕，失眠，中风，脱肛', method: '平刺0.5-0.8寸', category: '头面部' },
  { id: 61, name: '水沟（人中）', code: 'DU26', meridian: '督脉', location: '面部，人中沟上1/3与中1/3交点处', indication: '昏迷，晕厥，中暑，面瘫，急救', method: '向上斜刺0.3-0.5寸', category: '头面部' },

  // ===== 经外奇穴 (EX) =====
  { id: 62, name: '四神聪', code: 'EX-HN1', meridian: '经外奇穴', location: '百会前后左右各1寸，共4穴', indication: '失眠，健忘，头痛，眩晕', method: '平刺0.5-0.8寸', category: '头面部' },
  { id: 63, name: '印堂', code: 'EX-HN3', meridian: '经外奇穴', location: '两眉头连线中点', indication: '头痛，眩晕，失眠，鼻衄', method: '平刺0.3-0.5寸', category: '头面部' },
  { id: 64, name: '太阳', code: 'EX-HN5', meridian: '经外奇穴', location: '眉梢与目外眦之间向后约1寸凹陷处', indication: '头痛，目赤肿痛，面瘫', method: '直刺或斜刺0.3-0.5寸', category: '头面部' },
  { id: 65, name: '安眠', code: 'EX-HN22', meridian: '经外奇穴', location: '翳风与风池连线中点', indication: '失眠，头痛，眩晕', method: '直刺0.5-1寸', category: '头颈部' },
  { id: 66, name: '十宣', code: 'EX-UE11', meridian: '经外奇穴', location: '十指尖端，距指甲0.1寸处', indication: '昏迷，晕厥，高热，中暑，急救', method: '点刺出血', category: '上肢部' },

  // ===== 补充常用穴位 =====
  { id: 67, name: '孔最', code: 'LU6', meridian: '手太阴肺经', location: '尺泽与太渊连线上，腕横纹上7寸', indication: '咯血，咳嗽，气喘，咽喉肿痛', method: '直刺0.5-1寸', category: '上肢部' },
  { id: 68, name: '经渠', code: 'LU8', meridian: '手太阴肺经', location: '桡骨茎突内侧，腕横纹上1寸，桡动脉桡侧凹陷处', indication: '咳嗽，气喘，胸痛，咽喉肿痛', method: '避开桡动脉直刺0.3-0.5寸', category: '上肢部' },
  { id: 69, name: '手三里', code: 'LI10', meridian: '手阳明大肠经', location: '阳溪与曲池连线上，曲池下2寸', indication: '牙痛颊肿，上肢不遂，肩臂疼痛', method: '直刺0.8-1.2寸', category: '上肢部' },
  { id: 70, name: '偏历', code: 'LI6', meridian: '手阳明大肠经', location: '屈肘，阳溪与曲池连线上，腕横纹上3寸', indication: '鼻衄，目赤，耳鸣，口眼歪斜', method: '直刺或斜刺0.5-0.8寸', category: '上肢部' },
  { id: 71, name: '上巨虚', code: 'ST37', meridian: '足阳明胃经', location: '犊鼻下6寸，足三里下3寸', indication: '肠鸣，腹痛，腹泻，便秘，下肢痿痹', method: '直刺1-2寸', category: '下肢部' },
  { id: 72, name: '下巨虚', code: 'ST39', meridian: '足阳明胃经', location: '犊鼻下9寸，上巨虚下3寸', indication: '小腹痛，腹泻，痢疾，下肢痿痹', method: '直刺1-1.5寸', category: '下肢部' },
  { id: 73, name: '梁丘', code: 'ST34', meridian: '足阳明胃经', location: '髂前上棘与髌底外侧端连线上，髌底上2寸', indication: '急性胃痛，膝肿痛，下肢不遂', method: '直刺1-1.5寸', category: '下肢部' },
  { id: 74, name: '公孙', code: 'SP4', meridian: '足太阴脾经', location: '足内侧缘，第1跖骨基底前下方凹陷处', indication: '胃痛，呕吐，腹痛，腹泻，痢疾', method: '直刺0.5-1寸', category: '下肢部' },
  { id: 75, name: '商丘', code: 'SP5', meridian: '足太阴脾经', location: '内踝前下方凹陷处，舟骨结节与内踝尖连线中点', indication: '腹胀，腹泻，便秘，踝关节疼痛', method: '直刺0.3-0.5寸', category: '下肢部' },
  { id: 76, name: '少海', code: 'HT3', meridian: '手少阴心经', location: '肘横纹尺侧端与肱骨内上髁之间凹陷处', indication: '心痛，肘臂痛，瘰疬，头项痛', method: '直刺0.5-1寸', category: '上肢部' },
  { id: 77, name: '通里', code: 'HT5', meridian: '手少阴心经', location: '腕横纹上1寸，尺侧腕屈肌腱桡侧缘', indication: '心悸，怔忡，舌强不语，腕臂痛', method: '直刺0.3-0.5寸', category: '上肢部' },
  { id: 78, name: '阴郄', code: 'HT6', meridian: '手少阴心经', location: '腕横纹上0.5寸，尺侧腕屈肌腱桡侧缘', indication: '心痛，惊悸，盗汗，吐血，衄血', method: '直刺0.3-0.5寸', category: '上肢部' },
  { id: 79, name: '胃俞', code: 'BL21', meridian: '足太阳膀胱经', location: '第12胸椎棘突下，旁开1.5寸', indication: '胃脘痛，呕吐，腹胀，肠鸣', method: '斜刺0.5-0.8寸', category: '背腰部' },
  { id: 80, name: '大肠俞', code: 'BL25', meridian: '足太阳膀胱经', location: '第4腰椎棘突下，旁开1.5寸', indication: '腰腿痛，腹泻，便秘，痢疾', method: '直刺0.8-1.2寸', category: '背腰部' },
  { id: 81, name: '次髎', code: 'BL32', meridian: '足太阳膀胱经', location: '第2骶后孔中', indication: '腰骶痛，下肢痿痹，月经不调，痛经', method: '直刺1-1.5寸', category: '背腰部' },
  { id: 82, name: '膏肓', code: 'BL43', meridian: '足太阳膀胱经', location: '第4胸椎棘突下，旁开3寸', indication: '咳嗽，气喘，肺痨，健忘，遗精', method: '斜刺0.5-0.8寸', category: '背腰部' },
  { id: 83, name: '照海', code: 'KI6', meridian: '足少阴肾经', location: '内踝尖直下凹陷处', indication: '咽喉干燥，失眠，嗜卧，惊恐不宁', method: '直刺0.5-0.8寸', category: '下肢部' },
  { id: 84, name: '复溜', code: 'KI7', meridian: '足少阴肾经', location: '太溪上2寸，跟腱前缘', indication: '水肿，盗汗，自汗，腹胀，腹泻', method: '直刺0.5-1寸', category: '下肢部' },
  { id: 85, name: '间使', code: 'PC5', meridian: '手厥阴心包经', location: '腕横纹上3寸，掌长肌腱与桡侧腕屈肌腱之间', indication: '心痛，心悸，胃痛，呕吐，癫狂痫', method: '直刺0.5-1寸', category: '上肢部' },
  { id: 86, name: '大陵', code: 'PC7', meridian: '手厥阴心包经', location: '腕掌侧横纹中点，掌长肌腱与桡侧腕屈肌腱之间', indication: '心痛，心悸，胃痛，呕吐，失眠', method: '直刺0.3-0.5寸', category: '上肢部' },
  { id: 87, name: '中渚', code: 'TE3', meridian: '手少阳三焦经', location: '手背第4、5掌骨间，掌指关节后凹陷处', indication: '头痛，耳鸣，耳聋，咽喉肿痛', method: '直刺0.3-0.5寸', category: '上肢部' },
  { id: 88, name: '肩髎', code: 'TE14', meridian: '手少阳三焦经', location: '肩部，肩峰后下方凹陷处', indication: '肩臂疼痛，肩关节活动受限', method: '直刺1-1.5寸', category: '上肢部' },
  { id: 89, name: '光明', code: 'GB37', meridian: '足少阳胆经', location: '外踝尖上5寸，腓骨前缘', indication: '目视不明，夜盲，目痛，乳胀痛', method: '直刺1-1.5寸', category: '下肢部' },
  { id: 90, name: '丘墟', code: 'GB40', meridian: '足少阳胆经', location: '外踝前下方，趾长伸肌腱外侧凹陷处', indication: '胸胁胀痛，踝关节疼痛，下肢痿痹', method: '直刺0.5-0.8寸', category: '下肢部' }
];

// 穴位部位分类
const ACUPOINT_CATEGORIES = ['全部', '头面部', '头颈部', '上肢部', '下肢部', '胸腹部', '背腰部'];

// 九种体质
const CONSTITUTIONS_DATA = [
  {
    id: 1, name: '平和质', description: '体形匀称健壮，面色润泽，精力充沛，睡眠良好，患病较少',
    features: ['面色红润', '精力充沛', '睡眠良好', '胃纳佳', '二便正常'],
    advice: '保持规律生活，饮食均衡，适量运动，四季养生。',
    diet: '饮食均衡，不偏食。可适量食用五谷杂粮、蔬菜水果。',
    exercise: '适合各类运动，如太极、跑步、游泳等。'
  },
  {
    id: 2, name: '气虚质', description: '肌肉松软不实，气短懒言，容易疲乏，易感冒',
    features: ['气短懒言', '容易疲乏', '声音低弱', '易出汗', '易感冒'],
    advice: '宜益气健脾，避免过度劳累，保持充足睡眠。',
    diet: '多食益气健脾之品：山药、黄芪、党参、大枣、鸡肉。',
    exercise: '宜柔缓运动：散步、太极、八段锦，不宜剧烈运动。'
  },
  {
    id: 3, name: '阳虚质', description: '肌肉不健壮，畏寒怕冷，手足不温，喜热饮食',
    features: ['畏寒怕冷', '手足不温', '喜热饮食', '精神不振', '面色柔白'],
    advice: '宜温阳驱寒，注意保暖，避免生冷食物。',
    diet: '多食温阳之品：羊肉、牛肉、韭菜、生姜、核桃。',
    exercise: '宜和缓运动：慢跑、太极，冬季避免户外寒凉。'
  },
  {
    id: 4, name: '阴虚质', description: '体形偏瘦，手足心热，口燥咽干，喜冷饮',
    features: ['手足心热', '口燥咽干', '鼻微干', '喜冷饮', '大便干燥'],
    advice: '宜滋阴润燥，避免熬夜，少食辛辣。',
    diet: '多食滋阴之品：银耳、百合、梨、枸杞、麦冬、鸭肉。',
    exercise: '宜中小强度运动：游泳、太极，避免大汗淋漓。'
  },
  {
    id: 5, name: '痰湿质', description: '体形肥胖，腹部松软，面部油脂较多，口黏腻',
    features: ['面部油脂多', '多汗且黏', '胸闷痰多', '口黏腻', '喜食肥甘'],
    advice: '宜化痰祛湿，控制饮食，加强运动。',
    diet: '多食健脾化痰之品：薏苡仁、白萝卜、冬瓜、海带、陈皮。',
    exercise: '宜持续有氧运动：快走、慢跑、游泳，循序渐进。'
  },
  {
    id: 6, name: '湿热质', description: '面垢油光，易生痤疮，口苦口干，身重困倦',
    features: ['面垢油光', '易生痤疮', '口苦口干', '身重困倦', '大便黏滞'],
    advice: '宜清热利湿，居住环境宜干燥通风。',
    diet: '多食清热利湿之品：绿豆、苦瓜、冬瓜、薏苡仁、绿茶。',
    exercise: '宜中高强度运动：跑步、球类，夏季避开暑热。'
  },
  {
    id: 7, name: '血瘀质', description: '肤色晦暗，色素沉着，易有瘀斑，口唇暗淡',
    features: ['肤色晦暗', '色素沉着', '容易出现瘀斑', '口唇暗淡', '健忘'],
    advice: '宜活血化瘀，保持心情舒畅，适当运动。',
    diet: '多食活血之品：山楂、桃仁、红花、当归、玫瑰花茶。',
    exercise: '宜有氧运动促进气血运行：跑步、跳舞、太极剑。'
  },
  {
    id: 8, name: '气郁质', description: '体形偏瘦，情绪低沉，容易紧张，多愁善感',
    features: ['情绪低沉', '容易紧张', '多愁善感', '容易受到惊吓', '胸闷叹气'],
    advice: '宜疏肝解郁，保持心情愉悦，多参加社交活动。',
    diet: '多食疏肝解郁之品：玫瑰花、菊花、佛手、橙皮、小麦。',
    exercise: '宜群体运动：跑步、登山、游泳，配合冥想放松。'
  },
  {
    id: 9, name: '特禀质', description: '过敏体质，常见哮喘、荨麻疹，对花粉等过敏',
    features: ['过敏体质', '哮喘', '荨麻疹', '花粉过敏', '先天禀赋异常'],
    advice: '避免接触过敏原，增强体质，饮食清淡。',
    diet: '饮食清淡均衡，避免易过敏食物。可适当补充益气固表之品。',
    exercise: '宜适度运动增强体质，避免在过敏原环境中运动。'
  }
];

// 二十四节气养生
const SOLAR_TERMS_DATA = [
  { id: 1, name: '立春', season: '春', advice: '万物复苏，宜养肝。多吃辛甘发散之品，如葱、香菜、花生。早睡早起，舒展身体。' },
  { id: 2, name: '雨水', season: '春', advice: '降水增多，湿气渐重。宜健脾祛湿，食薏苡仁、赤小豆。注意保暖防寒。' },
  { id: 3, name: '惊蛰', season: '春', advice: '蛰虫始振，阳气升发。宜清淡饮食，多吃绿叶蔬菜。避免酸涩收敛之品。' },
  { id: 4, name: '春分', season: '春', advice: '阴阳平衡，宜调肝养肝。食菠菜、芹菜养肝，韭菜助阳气。' },
  { id: 5, name: '清明', season: '春', advice: '天气转暖，宜踏青舒肝。饮菊花茶清肝明目，食山药健脾。' },
  { id: 6, name: '谷雨', season: '春', advice: '雨生百谷，湿气加重。宜健脾化湿，食薏苡仁、扁豆。避免寒凉。' },
  { id: 7, name: '立夏', season: '夏', advice: '阳气渐旺，宜养心安神。食莲子、百合养心，避免大汗伤气。' },
  { id: 8, name: '小满', season: '夏', advice: '湿热渐盛，宜清热利湿。食绿豆、冬瓜、苦瓜。避免油腻辛辣。' },
  { id: 9, name: '芒种', season: '夏', advice: '湿气加重，宜化湿健脾。多食薏苡仁、赤小豆。午间小憩养心。' },
  { id: 10, name: '夏至', season: '夏', advice: '阳气最旺，宜养心防暑。食西瓜、绿豆汤解暑，忌过食寒凉伤脾。' },
  { id: 11, name: '小暑', season: '夏', advice: '暑热渐盛，宜清暑益气。饮酸梅汤、荷叶粥。避免烈日下运动。' },
  { id: 12, name: '大暑', season: '夏', advice: '一年最热，宜消暑解热。食苦瓜、莲子芯清热。注意祛湿。' },
  { id: 13, name: '立秋', season: '秋', advice: '秋始干燥，宜润肺生津。食梨、银耳、蜂蜜润燥。早卧早起。' },
  { id: 14, name: '处暑', season: '秋', advice: '暑气止，秋凉至。宜滋阴润肺。食百合、莲藕、芝麻。避免辛辣伤阴。' },
  { id: 15, name: '白露', season: '秋', advice: '秋燥明显，宜润燥养肺。食梨、蜂蜜、杏仁。注意早晚保暖。' },
  { id: 16, name: '秋分', season: '秋', advice: '阴阳各半，宜平衡阴阳。食核桃、龙眼、芝麻。适度秋冻。' },
  { id: 17, name: '寒露', season: '秋', advice: '气温骤降，宜养阴防燥。食山药、银耳、百合。足部注意保暖。' },
  { id: 18, name: '霜降', season: '秋', advice: '秋末将冬，宜温补脾胃。食柿子、栗子、羊肉。避免寒凉伤胃。' },
  { id: 19, name: '立冬', season: '冬', advice: '冬始进补，宜温补肾阳。食羊肉、牛肉、桂圆。早卧晚起。' },
  { id: 20, name: '小雪', season: '冬', advice: '天渐寒冷，宜温阳补肾。食核桃、板栗、羊肉。注意头部保暖。' },
  { id: 21, name: '大雪', season: '冬', advice: '严寒将至，宜进补养藏。食羊肉、当归、生姜。适度进补不过量。' },
  { id: 22, name: '冬至', season: '冬', advice: '阴极阳生，宜温补阳气。食羊肉汤、饺子。早卧晚起，必待日光。' },
  { id: 23, name: '小寒', season: '冬', advice: '寒气最盛之一，宜温补肾阳。食羊肉、牛肉、桂圆。注意防寒保暖。' },
  { id: 24, name: '大寒', season: '冬', advice: '一年至寒，宜大补肾阳。食黑芝麻、核桃、羊肉。迎接春季养藏交替。' }
];
