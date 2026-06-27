/**
 * 工位回血卡 · 卡池数据
 * 完整 28 张：N 14 + R 8 + SR 4 + SSR 2
 * 字段说明：
 *   id: 唯一标识
 *   name: 卡牌中文名
 *   emoji: 卡面主图（系统 emoji）
 *   rarity: 'n' | 'r' | 'sr' | 'ssr'
 *   hp: 完成后获得的 HP
 *   dur: 倒计时秒数（建议执行时长）
 *   tags: 关联的状态标签
 *   desc: 任务描述
 *   hourRange?: [start, end][] 仅饭点限定卡
 */
export const CARD_POOL = [
  /* ---- N (14 张 · 基础日常) ---- */
  { id: 'water', name: '社畜补水卡', emoji: '💧', rarity: 'n', hp: 8, dur: 30, tags: ['sit', 'sleepy', 'brain'], desc: '走到饮水机旁，接一杯温水慢慢喝完' },
  { id: 'wrist', name: '手腕放松卡', emoji: '🤲', rarity: 'n', hp: 8, dur: 30, tags: ['sit', 'stress'], desc: '双手十指交叉，转动手腕各 10 圈' },
  { id: 'stretch', name: '伸懒腰卡', emoji: '🙆', rarity: 'n', hp: 8, dur: 30, tags: ['sit', 'neck', 'back'], desc: '双手举过头顶，向后弓 3 次' },
  { id: 'shoulder', name: '耸肩松绑卡', emoji: '💆', rarity: 'n', hp: 8, dur: 30, tags: ['neck', 'sit', 'stress'], desc: '耸肩 5 次，每次保持 3 秒后放下' },
  { id: 'blink', name: '眨眼保湿卡', emoji: '😌', rarity: 'n', hp: 8, dur: 30, tags: ['eye'], desc: '快速眨眼 20 次，然后闭眼休息 10 秒' },
  { id: 'cuptea', name: '泡杯热茶卡', emoji: '🍵', rarity: 'n', hp: 10, dur: 60, tags: ['mood', 'sleepy', 'stress'], desc: '起身泡一杯热茶，等水开的时候做几下深呼吸' },
  { id: 'standup', name: '原地起立卡', emoji: '🧍', rarity: 'n', hp: 8, dur: 30, tags: ['sit', 'back'], desc: '从椅子上站起来，伸展腰背 30 秒' },
  { id: 'ankle', name: '脚踝画圈卡', emoji: '🦶', rarity: 'n', hp: 8, dur: 45, tags: ['sit'], desc: '坐姿抬脚，左右脚各画 10 个圆圈' },
  { id: 'palmwash', name: '洗手回神卡', emoji: '🧼', rarity: 'n', hp: 8, dur: 45, tags: ['mood', 'sleepy', 'brain'], desc: '去洗手间认真洗个手，让冷水唤醒自己' },
  { id: 'window', name: '推窗换气卡', emoji: '🪟', rarity: 'n', hp: 10, dur: 30, tags: ['mood', 'meeting', 'brain'], desc: '打开窗户深呼吸 5 次，感受新鲜空气' },
  { id: 'mini', name: '小步走廊卡', emoji: '🚶', rarity: 'n', hp: 10, dur: 60, tags: ['sit', 'meeting', 'back'], desc: '走到走廊尽头再走回来' },
  { id: 'snack', name: '果干补能卡', emoji: '🍎', rarity: 'n', hp: 10, dur: 45, tags: ['sleepy', 'mood', 'hungry'], desc: '吃一小份水果或坚果，慢慢咀嚼' },
  { id: 'lumbar', name: '腰部回正卡', emoji: '🪑', rarity: 'n', hp: 10, dur: 45, tags: ['back', 'sit'], desc: '坐直，双手叉腰，向左右各侧弯 5 次' },
  { id: 'milk', name: '热饮补给卡', emoji: '☕', rarity: 'n', hp: 10, dur: 60, tags: ['hungry', 'sleepy', 'mood'], desc: '冲一杯热牛奶或燕麦，给胃一点温暖' },

  /* ---- R (8 张 · 稀有任务) ---- */
  { id: 'screen', name: '屏幕放生卡', emoji: '🖼️', rarity: 'r', hp: 14, dur: 60, tags: ['eye', 'brain'], desc: '离开屏幕，看向窗外最远处保持 20 秒' },
  { id: 'archive', name: '进度存档卡', emoji: '📝', rarity: 'r', hp: 14, dur: 90, tags: ['meeting', 'mood', 'brain', 'stress'], desc: '写下今天已完成和待完成的 3 件事' },
  { id: 'twentyfeet', name: '20-20-20卡', emoji: '👁️', rarity: 'r', hp: 14, dur: 20, tags: ['eye'], desc: '看向 6 米外的物体保持 20 秒（眼科黄金法则）' },
  { id: 'tidy', name: '桌面收纳卡', emoji: '🗂️', rarity: 'r', hp: 14, dur: 90, tags: ['mood', 'brain'], desc: '把桌面上的杂物归位，让视野清爽' },
  { id: 'music', name: '一首歌冥想', emoji: '🎧', rarity: 'r', hp: 16, dur: 180, tags: ['mood', 'meeting', 'stress'], desc: '戴上耳机，闭眼安静听 3 分钟音乐' },
  { id: 'lookfar', name: '抬头看天卡', emoji: '☁️', rarity: 'r', hp: 14, dur: 60, tags: ['eye', 'mood', 'brain'], desc: '走到窗边抬头看 30 秒天空' },
  { id: 'cardio', name: '原地小跳卡', emoji: '🏃', rarity: 'r', hp: 16, dur: 60, tags: ['sleepy', 'sit', 'stress'], desc: '原地小步跳 30 次，激活全身' },
  { id: 'lunchbreak', name: '正经吃饭卡', emoji: '🍱', rarity: 'r', hp: 18, dur: 120, tags: ['hungry', 'mood', 'stress'], hourRange: [[11.5, 13.5], [17.5, 19.5]], desc: '放下手机，专心把这顿饭吃 2 分钟（仅饭点出现）' },

  /* ---- SR (4 张 · 史诗组合) ---- */
  { id: 'unlock', name: '脖子解封卡', emoji: '🦒', rarity: 'sr', hp: 22, dur: 60, tags: ['neck', 'stress'], desc: '缓慢左右转头各 5 次，上下点头 5 次' },
  { id: 'breath', name: '呼吸回蓝卡', emoji: '🌬️', rarity: 'sr', hp: 25, dur: 90, tags: ['mood', 'meeting', 'stress', 'brain'], desc: '4-7-8 呼吸法：吸 4 秒 / 屏息 7 秒 / 呼 8 秒，循环 4 次' },
  { id: 'spine', name: '脊椎充电卡', emoji: '🧘', rarity: 'sr', hp: 22, dur: 75, tags: ['sit', 'neck', 'back'], desc: '双手举过头顶伸展，左右各侧弯 5 次' },
  { id: 'brainshake', name: '大脑摇晃卡', emoji: '🧠', rarity: 'sr', hp: 24, dur: 75, tags: ['brain', 'sleepy', 'stress'], desc: '闭眼用手指轻拍头皮 30 秒，再睁眼数 10 个红色物体' },

  /* ---- SSR (2 张 · 传说终极) ---- */
  { id: 'reboot', name: '人类重启卡', emoji: '✨', rarity: 'ssr', hp: 35, dur: 180, tags: ['sit', 'sleepy', 'meeting', 'back', 'stress'], desc: '站起来走动 + 5 次深呼吸 + 远眺，共 3 分钟' },
  { id: 'social', name: '摸鱼社交卡', emoji: '💬', rarity: 'ssr', hp: 35, dur: 120, tags: ['mood', 'meeting', 'stress', 'brain'], desc: '找同事聊 2 分钟非工作话题（吃喝玩乐皆可）' },

  /* ---- 扩充 · N · 普通（57 张 · DeepSeek 生成）---- */
  { id: 'eye_roll', name: '转转眼球卡', emoji: '👀', rarity: 'n', hp: 7, dur: 30, tags: ['eye', 'mood'], desc: '向上、右、下、左各看一遍，再反过来，让眼球画个完整的正方形，重复三次。' },
  { id: 'temple_press', name: '按揉太阳卡', emoji: '🤏', rarity: 'n', hp: 8, dur: 45, tags: ['stress', 'eye'], desc: '用食指指腹按住太阳穴，顺时针揉5圈再逆时针5圈，力度像在画隐形眼霜。' },
  { id: 'ear_rub', name: '搓搓耳朵卡', emoji: '👂', rarity: 'n', hp: 6, dur: 30, tags: ['relax', 'mood'], desc: '双手搓热后轻轻揉搓耳朵，从耳尖滑到耳垂，像在给耳朵做一次迷你SPA。' },
  { id: 'head_shake', name: '晃晃脑袋卡', emoji: '🙅', rarity: 'n', hp: 7, dur: 25, tags: ['neck', 'mood'], desc: '缓慢左右摇头，幅度像在说“不”，但心里默念“我可以”，来回10次。' },
  { id: 'face_tap', name: '拍拍脸颊卡', emoji: '✋', rarity: 'n', hp: 6, dur: 20, tags: ['mood', 'sleepy'], desc: '用指腹轻拍脸颊，从颧骨到下巴，想象是在唤醒冬眠的皮肤，拍20下。' },
  { id: 'tiger_mouth', name: '指压虎口卡', emoji: '🤏', rarity: 'n', hp: 9, dur: 40, tags: ['stress'], desc: '用拇指按压另一手的虎口，有酸胀感才对，保持10秒后换手，释放压力。' },
  { id: 'finger_wiggle', name: '动动手指卡', emoji: '🖐️', rarity: 'n', hp: 7, dur: 30, tags: ['sit', 'brain'], desc: '张开五指再迅速并拢，反复10次；然后每个手指轮流敲桌面，像在弹钢琴。' },
  { id: 'mint_gum', name: '含颗薄荷卡', emoji: '🍬', rarity: 'n', hp: 8, dur: 50, tags: ['hungry', 'mood'], desc: '取一颗薄荷糖放入口中，慢慢含化，让清凉从舌尖蔓延到整个口腔。' },
  { id: 'banana_bite', name: '吃口香蕉卡', emoji: '🍌', rarity: 'n', hp: 10, dur: 60, tags: ['hungry', 'mood'], desc: '剥一根香蕉，分成三口吃完，缓慢咀嚼，感受钾元素顺着食管滑进胃里。' },
  { id: 'yogurt_sip', name: '喝口酸奶卡', emoji: '🥛', rarity: 'n', hp: 8, dur: 30, tags: ['hungry', 'mood'], desc: '打开酸奶盖子，小抿一口，让酸甜在舌尖停留两秒再咽下，犒劳自己。' },
  { id: 'vitamin_c', name: '泡腾维C卡', emoji: '🍊', rarity: 'n', hp: 9, dur: 55, tags: ['sleepy', 'mood'], desc: '将一片维C泡腾片丢入水中，等它滋滋冒泡后一口口喝完，补充元气。' },
  { id: 'close_ears', name: '闭眼听声卡', emoji: '😌', rarity: 'n', hp: 6, dur: 30, tags: ['eye', 'mood'], desc: '闭上眼睛，专注听周围的声音——空调、键盘、远处交谈，持续30秒。' },
  { id: 'back_arch', name: '拱背伸展卡', emoji: '🐱', rarity: 'n', hp: 7, dur: 25, tags: ['back', 'sit'], desc: '坐在椅子上双手扶桌，慢慢弓起背部像一只生气的猫，保持5秒后放松。' },
  { id: 'waist_sway', name: '扭扭腰部卡', emoji: '💃', rarity: 'n', hp: 8, dur: 35, tags: ['back', 'sit'], desc: '双手叉腰，向左缓慢扭腰到极限，停2秒；再向右，各做10次。' },
  { id: 'leg_kick', name: '踢踢小腿卡', emoji: '🦵', rarity: 'n', hp: 7, dur: 30, tags: ['sit', 'sleepy'], desc: '在桌下交替抬起小腿向前踢出，像在踩隐形的自行车，做20下。' },
  { id: 'foot_shake', name: '抖抖脚丫卡', emoji: '🦶', rarity: 'n', hp: 6, dur: 20, tags: ['sit', 'relax'], desc: '双脚平放，快速抖动脚尖和脚跟，像在踩缝纫机，持续20秒。' },
  { id: 'hair_comb', name: '梳梳头发卡', emoji: '💇', rarity: 'n', hp: 8, dur: 35, tags: ['mood', 'relax'], desc: '十指插入头发，从额头梳到后脑勺，重复10次，顺便检查发际线。' },
  { id: 'sticky_note', name: '写写便签卡', emoji: '📝', rarity: 'n', hp: 7, dur: 30, tags: ['brain', 'mood', 'stress', 'relax'], desc: '在便签上写下此刻脑子里最烦的那件事，然后撕碎扔进垃圾桶。' },
  { id: 'desk_tidy', name: '扔张废纸卡', emoji: '🗑️', rarity: 'n', hp: 6, dur: 20, tags: ['brain', 'mood'], desc: '扫一眼桌面，挑出一张过期的便签或废纸，揉成团扔进垃圾桶，让视野少一点干扰。' },
  { id: 'mirror_walk', name: '模仿走路卡', emoji: '🚶', rarity: 'n', hp: 8, dur: 40, tags: ['mood', 'brain'], desc: '看窗外行人，模仿他们的走路节奏轻轻晃动身体，释放多余紧张感。' },
  { id: 'smell_coffee', name: '闻咖啡豆卡', emoji: '☕', rarity: 'n', hp: 6, dur: 30, tags: ['mood', 'sleepy'], desc: '打开咖啡罐深吸一口气，香气直冲鼻腔，瞬间提神醒脑。' },
  { id: 'thumb_press', name: '内关穴按压卡', emoji: '👍', rarity: 'n', hp: 7, dur: 35, tags: ['relax', 'mood'], desc: '伸出一只手手心向上，找到手腕横纹下三指处的内关穴，用另一手拇指按压10秒，换手再做一次，舒缓胸闷与焦躁。' },
  { id: 'song_guess', name: '猜歌名卡', emoji: '🎵', rarity: 'n', hp: 8, dur: 50, tags: ['mood', 'meeting'], desc: '戴上耳机听一首歌的前五秒，猜歌名，猜中给自己小奖励。' },
  { id: 'stare_ceiling', name: '数格子卡', emoji: '🔲', rarity: 'n', hp: 6, dur: 40, tags: ['eye', 'neck'], desc: '抬头看天花板，数出其中的方格或灯管数量，让眼睛和脖子都得到放松。' },
  { id: 'non_dom_writing', name: '左手写字卡', emoji: '✍️', rarity: 'n', hp: 9, dur: 55, tags: ['brain', 'sit'], desc: '用非惯用手写下你的名字，迫使大脑转换模式，激活新回路。' },
  { id: 'stretch_fingers', name: '手指开合卡', emoji: '🖐️', rarity: 'n', hp: 6, dur: 25, tags: ['sit', 'stress'], desc: '将手掌张开再用力握拳，重复十次，促进手部血液循环。' },
  { id: 'close_n_see', name: '闭眼想象卡', emoji: '🌅', rarity: 'n', hp: 8, dur: 50, tags: ['brain', 'relax'], desc: '闭眼想象自己站在海边，感受海风和阳光，持续三十秒再睁眼。' },
  { id: 'tap_forehead', name: '轻拍额头卡', emoji: '🤲', rarity: 'n', hp: 7, dur: 30, tags: ['relax', 'mood'], desc: '用指腹轻轻拍打额头和太阳穴，节奏轻柔，帮助清醒头脑。' },
  { id: 'hum_tune', name: '轻轻哼唱卡', emoji: '🎶', rarity: 'n', hp: 6, dur: 35, tags: ['mood', 'brain'], desc: '选一首简单的歌，用哼唱代替歌词，振动放松声带和心情。' },
  { id: 'heel_raise', name: '踮脚尖卡', emoji: '🦶', rarity: 'n', hp: 8, dur: 40, tags: ['back', 'sit'], desc: '坐在椅子上，双脚慢慢踮起脚尖再放下，重复十五次，促进腿部血液回流。' },
  { id: 'palm_rub', name: '摩擦手掌卡', emoji: '👏', rarity: 'n', hp: 6, dur: 20, tags: ['relax', 'sleepy'], desc: '双手快速对搓直到发热，然后轻敷在闭着的眼睛上，温暖又放松。' },
  { id: 'neck_roll', name: '脖颈转动卡', emoji: '🦒', rarity: 'n', hp: 9, dur: 35, tags: ['neck', 'sit'], desc: '慢慢将头向左转至极限停留5秒，再向右转，重复三次，感受颈部拉伸。' },
  { id: 'stretch_arms', name: '伸展双臂卡', emoji: '🙆', rarity: 'n', hp: 8, dur: 30, tags: ['back', 'sit'], desc: '双手在头顶交叉，掌心向上，用力伸展至极限，保持10秒后放下。' },
  { id: 'eye_press', name: '眼周按摩卡', emoji: '🤏', rarity: 'n', hp: 9, dur: 35, tags: ['eye', 'sit'], desc: '闭上眼睛，用食指指腹轻轻按压睛明穴和四白穴各5次，放松眼周。' },
  { id: 'nod_head', name: '点头放松卡', emoji: '🙇', rarity: 'n', hp: 7, dur: 30, tags: ['neck', 'relax'], desc: '缓慢而有节奏地上下点头5次，感受颈部肌肉的放松，重复3组' },
  { id: 'shrug_shoulder', name: '耸肩放松卡', emoji: '🤷', rarity: 'n', hp: 8, dur: 30, tags: ['neck', 'stress', 'back'], desc: '双肩同时快速向上耸起至耳朵，保持2秒后完全落下，重复5次' },
  { id: 'fist_release', name: '握拳释放卡', emoji: '✊', rarity: 'n', hp: 6, dur: 25, tags: ['relax', 'sit'], desc: '用力握紧拳头5秒，然后缓缓张开手指并抖动，重复4次' },
  { id: 'seat_forward_bend', name: '前屈拉伸卡', emoji: '🙇', rarity: 'n', hp: 8, dur: 45, tags: ['back', 'sit', 'relax'], desc: '坐着缓慢弯腰，双手伸向脚尖，保持15秒，感受大腿后侧和背部的拉伸' },
  { id: 'side_stretch', name: '侧腰拉伸卡', emoji: '🧘', rarity: 'n', hp: 7, dur: 30, tags: ['back', 'sit'], desc: '举起右手向左弯曲身体，保持10秒，换边，重复3组，感受侧腰被拉伸' },
  { id: 'alternate_heel_raise', name: '提踵静态卡', emoji: '🦶', rarity: 'n', hp: 7, dur: 30, tags: ['sit', 'back'], desc: '坐姿下双脚同时踮起脚尖保持5秒再放下，重复10次，强化小腿耐力的静态版本。' },
  { id: 'foot_swing', name: '晃脚放松卡', emoji: '🦵', rarity: 'n', hp: 7, dur: 25, tags: ['sit', 'relax'], desc: '坐姿下双脚离地，前后晃动脚踝，像踩自行车一样，持续20秒' },
  { id: 'hand_back_rub', name: '手背搓揉卡', emoji: '🤝', rarity: 'n', hp: 6, dur: 20, tags: ['sit', 'relax', 'mood'], desc: '用一只手的手掌搓揉另一只手的手背，交替进行，每只手搓10下' },
  { id: 'interlock_twist', name: '手指扣翻卡', emoji: '🤞', rarity: 'n', hp: 7, dur: 25, tags: ['sit', 'neck'], desc: '双手手指交叉相扣，手心朝外向前推，感受手指、手腕和肩颈连动拉伸，保持15秒' },
  { id: 'thumb_circle', name: '拇指画圈卡', emoji: '👍', rarity: 'n', hp: 6, dur: 20, tags: ['eye', 'sit'], desc: '双手竖起大拇指，在眼前缓慢顺时针画圈5次，再逆时针5次，锻炼手指与眼脑协调' },
  { id: 'gaze_green', name: '看绿放松卡', emoji: '🌿', rarity: 'n', hp: 7, dur: 30, tags: ['eye', 'mood', 'relax'], desc: '找到工位上任意绿色物品（杯子、植物、便签），专注观察其纹理30秒' },
  { id: 'lean_back_view', name: '后仰看天卡', emoji: '🙃', rarity: 'n', hp: 8, dur: 30, tags: ['neck', 'eye', 'relax'], desc: '坐姿向后仰头，眼睛看向天花板，保持5秒后缓慢复位，重复3次' },
  { id: 'calf_rub', name: '小腿揉捏卡', emoji: '🦵', rarity: 'n', hp: 7, dur: 30, tags: ['sit', 'back'], desc: '俯身用手揉捏小腿肚，从脚踝到膝盖方向，每条腿揉捏30秒' },
  { id: 'face_rub', name: '搓脸提神卡', emoji: '😶', rarity: 'n', hp: 7, dur: 25, tags: ['eye', 'relax', 'mood'], desc: '双手搓热后，从额头向脸颊向下按摩10次，速度快一些，唤醒面部肌肤' },
  { id: 'relax_jaw', name: '放松下巴卡', emoji: '😮', rarity: 'n', hp: 8, dur: 30, tags: ['relax', 'mood'], desc: '微微张开嘴巴，将下巴缓慢向左移、向右移各3次，再顺时针、逆时针画圈各3次' },
  { id: 'yawn_stretch', name: '打哈欠卡', emoji: '🥱', rarity: 'n', hp: 7, dur: 30, tags: ['mood', 'sleepy'], desc: '试着打一个夸张的哈欠，同时手臂向上伸展，脸部肌肉完全放松，会感到清醒许多。' },
  { id: 'knock_teeth', name: '叩齿养神卡', emoji: '🦷', rarity: 'n', hp: 6, dur: 20, tags: ['brain'], desc: '上下牙齿轻轻叩击36次，刺激牙周和头部穴位，有助于提神。' },
  { id: 'palm_face', name: '捂脸放松卡', emoji: '🙈', rarity: 'n', hp: 8, dur: 25, tags: ['relax', 'mood'], desc: '双手手掌轻轻捂住脸，完全黑暗几秒，深呼吸一次，放下时眨眨眼。' },
  { id: 'tiny_doodle', name: '画小画卡', emoji: '🎨', rarity: 'n', hp: 6, dur: 30, tags: ['brain', 'mood'], desc: '在便签纸上画一个简单的小表情或形状，不用精美，只为让大脑换个频道。' },
  { id: 'desk_tap', name: '敲桌节奏卡', emoji: '👊', rarity: 'n', hp: 7, dur: 30, tags: ['brain', 'relax'], desc: '用指关节在桌面上轻轻敲出一段简单的节奏，重复几次，让注意力从工作暂离。' },
  { id: 'knee_bounce', name: '抖腿活动卡', emoji: '🦵', rarity: 'n', hp: 6, dur: 25, tags: ['sit', 'sleepy'], desc: '坐在椅子上，抬起一条腿，小腿快速抖动30秒，换另一条，促进血液循环。' },
  { id: 'finger_snap', name: '弹指醒脑卡', emoji: '👆', rarity: 'n', hp: 7, dur: 20, tags: ['brain', 'stress'], desc: '用拇指和中指打一个响指，左右手各10次，注意力集中到声音上，瞬间清醒。' },
  { id: 'water_splash', name: '凉水拍脸卡', emoji: '💦', rarity: 'n', hp: 9, dur: 40, tags: ['mood', 'sleepy'], desc: '起身去洗手间，用凉水轻拍脸颊和手腕，凉爽感能快速驱散倦意。' },

  /* ---- 扩充 · R · 稀有（26 张 · DeepSeek 生成）---- */
  { id: 'jingming_press', name: '按揉睛明卡', emoji: '👁️', rarity: 'r', hp: 13, dur: 60, tags: ['eye', 'stress'], desc: '用双手拇指按揉内眼角上方的凹陷处（睛明穴），轻揉10圈后闭眼休息10秒。' },
  { id: 'nose_circle', name: '画圆放松卡', emoji: '👃', rarity: 'r', hp: 14, dur: 50, tags: ['neck', 'eye'], desc: '用鼻尖在空气中画一个完整的圆，先顺时针3圈再逆时针3圈，放松颈椎。' },
  { id: 'herbal_tea', name: '喝杯花茶卡', emoji: '🍵', rarity: 'r', hp: 15, dur: 90, tags: ['mood', 'relax'], desc: '取一包花茶放入杯中，倒入80°C热水，闻着花香小口慢饮，享受三分钟安静。' },
  { id: 'thigh_tap', name: '敲敲大腿卡', emoji: '👊', rarity: 'r', hp: 12, dur: 45, tags: ['sit', 'sleepy'], desc: '握空拳有节奏地敲打大腿外侧，从膝盖敲到大腿根，再返回，重复两遍。' },
  { id: 'hairline_press', name: '按压发际卡', emoji: '🤲', rarity: 'r', hp: 16, dur: 70, tags: ['relax', 'mood'], desc: '手指从额头中央向两侧按压发际线，每个点停留3秒，配合一次深呼吸。' },
  { id: 'wall_push', name: '推墙舒展卡', emoji: '🧱', rarity: 'r', hp: 14, dur: 70, tags: ['back', 'neck'], desc: '走到墙边，双手扶墙做推墙动作，拉伸背部和肩膀，保持二十秒。' },
  { id: 'candy_melt', name: '含糖果卡', emoji: '🍬', rarity: 'r', hp: 12, dur: 90, tags: ['hungry', 'mood'], desc: '含一颗硬糖在嘴里，不咬碎，让它慢慢融化，享受甜蜜的延时满足。' },
  { id: 'eye_gym', name: '眼球操卡', emoji: '👀', rarity: 'r', hp: 15, dur: 60, tags: ['eye', 'brain'], desc: '眼球先按顺时针转动十次，再逆时针十次，然后看远方十秒，缓解视疲劳。' },
  { id: 'laugh_sound', name: '大笑练习卡', emoji: '😂', rarity: 'r', hp: 16, dur: 50, tags: ['mood', 'relax'], desc: '假装接到好笑电话，发出三声“哈哈哈”，肌肉会带动真实情绪变好。' },
  { id: 'wiggle_toes', name: '脚趾跳舞卡', emoji: '🕺', rarity: 'r', hp: 12, dur: 55, tags: ['sit', 'mood'], desc: '脱掉鞋子，五个脚趾在鞋内或地面上做抓、放动作，像在跳舞一样。' },
  { id: 'walk_loop', name: '走廊漫步卡', emoji: '🚶', rarity: 'r', hp: 15, dur: 90, tags: ['mood', 'back'], desc: '离开工位沿走廊慢走一圈，同时反复握拳松开双手，促进血液循环。' },
  { id: 'praise_colleague', name: '同事赞美卡', emoji: '👏', rarity: 'r', hp: 13, dur: 60, tags: ['mood'], desc: '找到一位同事，真诚地夸赞他今日的一个优点或成果，注意语气要自然真挚' },
  { id: 'belly_rub', name: '揉腹助消化卡', emoji: '🤲', rarity: 'r', hp: 14, dur: 60, tags: ['hungry', 'relax', 'mood'], desc: '用掌心以肚脐为中心，顺时针轻柔按摩腹部20圈，促进肠道蠕动与放松' },
  { id: 'belly_warm', name: '暖腹放松卡', emoji: '🔥', rarity: 'r', hp: 13, dur: 50, tags: ['hungry', 'mood'], desc: '双手快速搓热，然后覆盖在腹部，闭眼感受温热传递，持续30秒' },
  { id: 'chest_expand', name: '扩胸舒展卡', emoji: '💪', rarity: 'r', hp: 14, dur: 45, tags: ['back', 'stress', 'mood'], desc: '双手在背后交握，尽力向后拉，同时挺胸抬头，保持15秒，深呼吸3次' },
  { id: 'back_tap_fist', name: '轻捶后背卡', emoji: '👊', rarity: 'r', hp: 15, dur: 50, tags: ['back', 'relax', 'sit'], desc: '用拳头轻轻捶打后背自己能够到的位置（腰或肩胛骨附近），左右各敲15下' },
  { id: 'one_leg_balance', name: '单腿平衡卡', emoji: '🧘', rarity: 'r', hp: 14, dur: 50, tags: ['back', 'mood', 'brain'], desc: '扶着椅子，单腿站立保持平衡，闭眼坚持15秒，换腿，重复2次' },
  { id: 'count_breath', name: '数息静心卡', emoji: '🕯️', rarity: 'r', hp: 16, dur: 60, tags: ['stress', 'relax', 'mood', 'brain'], desc: '吸气时默数1，呼气时默数2，从1数到10，循环2轮，专注在呼吸上' },
  { id: 'pencil_spin', name: '转笔放松卡', emoji: '🖊️', rarity: 'r', hp: 13, dur: 45, tags: ['sit', 'brain', 'relax'], desc: '用食指和拇指转动笔或手指间的物体，每次旋转一圈，左右手各转10次' },
  { id: 'hand_cream', name: '护手按摩卡', emoji: '🧴', rarity: 'r', hp: 14, dur: 60, tags: ['mood', 'relax'], desc: '取一点护手霜涂抹双手，从指尖到手腕缓慢按摩，同时深呼吸三次，放松又滋润。' },
  { id: 'close_eyes_listen', name: '闭眼聆听卡', emoji: '🙉', rarity: 'r', hp: 15, dur: 90, tags: ['mood', 'brain', 'relax'], desc: '闭眼，让耳朵捕捉周围三种声音——空调、键盘、人声，每个听3秒，回归当下。' },
  { id: 'neck_stretch_side', name: '侧颈拉伸卡', emoji: '↔️', rarity: 'r', hp: 16, dur: 60, tags: ['neck'], desc: '右手轻拉头部向左倾，保持20秒，感受右侧颈部拉伸，换边重复，共1分钟。' },
  { id: 'pencil_balance', name: '铅笔平衡卡', emoji: '✏️', rarity: 'r', hp: 13, dur: 45, tags: ['brain', 'mood'], desc: '将铅笔横放在手背上，试着保持平衡10秒不掉落，换手再来，小小挑战带来专注。' },
  { id: 'tea_bag_squeeze', name: '茶包挤压卡', emoji: '🫖', rarity: 'r', hp: 14, dur: 60, tags: ['mood', 'hungry'], desc: '泡好茶后，用勺子轻压茶包挤出汁液，重复几次，同时观察茶汤颜色变化，放松心情。' },
  { id: 'wrist_circle', name: '手腕画圆卡', emoji: '🔄', rarity: 'r', hp: 15, dur: 50, tags: ['eye', 'brain'], desc: '伸出手指在眼前画大圆，眼球跟随指尖转动，左右各5圈，缓解眼疲劳和手腕僵硬。' },
  { id: 'back_of_chair', name: '椅背靠压卡', emoji: '🪑', rarity: 'r', hp: 17, dur: 90, tags: ['back', 'sit'], desc: '身体靠向椅背，双手抱住椅背两侧，轻轻向后按压，感受背部拉伸，保持30秒。' },

  /* ---- 扩充 · SR · 史诗（11 张 · DeepSeek 生成）---- */
  { id: 'eye_yoga', name: '眼球瑜伽卡', emoji: '👀', rarity: 'sr', hp: 22, dur: 80, tags: ['eye', 'relax'], desc: '眼球依次向上、右、下、左看，每个方向停留2秒，再反向做一遍，循环三次。' },
  { id: 'heat_neck', name: '搓颈热敷卡', emoji: '🔥', rarity: 'sr', hp: 24, dur: 90, tags: ['neck', 'relax'], desc: '双手快速搓热，迅速捂住后颈，同时做耸肩和下沉动作，感受热量渗透肌肉。' },
  { id: 'three_min_med', name: '三分钟冥想卡', emoji: '🧘', rarity: 'sr', hp: 24, dur: 120, tags: ['relax', 'brain', 'mood'], desc: '坐在椅子上，闭眼，专注于呼吸，从1数到60，期间走神就重新计数。' },
  { id: 'countdown_sixty', name: '倒数六十卡', emoji: '🔢', rarity: 'sr', hp: 22, dur: 70, tags: ['brain', 'relax'], desc: '闭上眼睛，从60开始倒数，每个数字之间自然呼吸一次。如果中途走神，就从60重新开始。' },
  { id: 'brow_press', name: '眉心按压卡', emoji: '🧠', rarity: 'sr', hp: 22, dur: 70, tags: ['stress', 'brain', 'eye'], desc: '用拇指指腹按压两眉之间的印堂穴，顺时针揉按10圈，再逆时针10圈，缓解用脑疲劳' },
  { id: 'read_aloud', name: '朗读醒神卡', emoji: '📢', rarity: 'sr', hp: 24, dur: 80, tags: ['brain', 'mood', 'sleepy'], desc: '随意找面前的一段文字（屏幕或纸上），大声朗读1分钟，注意吐字清晰有节奏' },
  { id: 'mindful_bell', name: '正念铃声卡', emoji: '🔔', rarity: 'sr', hp: 26, dur: 90, tags: ['relax', 'mood', 'brain', 'meeting'], desc: '闭上眼睛，想象远方传来三次铃铛声，仔细听每一次回声消失，重复3轮' },
  { id: 'todo_priority', name: '待办梳理卡', emoji: '📋', rarity: 'sr', hp: 22, dur: 90, tags: ['brain', 'stress'], desc: '用一分钟在纸上写下明天最重要的三件事，完成后心中会更踏实。' },
  { id: 'gratitude_note', name: '感恩便签卡', emoji: '💌', rarity: 'sr', hp: 24, dur: 100, tags: ['mood', 'brain'], desc: '在便签上写一件工作中感激的小事，贴到电脑边，提醒自己积极的一面。' },
  { id: 'body_scan_mini', name: '身体扫描卡', emoji: '🧘', rarity: 'sr', hp: 25, dur: 120, tags: ['relax', 'mood'], desc: '从头到脚缓慢扫描身体各部位，觉察紧张的肌肉，并刻意放松它们，持续两分钟。' },
  { id: 'hand_meditation', name: '掌心冥想卡', emoji: '🙏', rarity: 'sr', hp: 23, dur: 100, tags: ['relax', 'mood'], desc: '双手合十放在胸口，闭眼感受掌心温度和心跳，停留一分钟，回归平静。' },

  /* ---- 扩充 · SSR · 传说（6 张 · DeepSeek 生成）---- */
  { id: 'mindful_walk', name: '正念行走卡', emoji: '🚶', rarity: 'ssr', hp: 30, dur: 180, tags: ['mood', 'back', 'relax'], desc: '起身走到办公室空走廊，每一步都感受脚底接触地面，行走三分钟，放空大脑。' },
  { id: 'vision_board', name: '愿景画板卡', emoji: '🎯', rarity: 'ssr', hp: 32, dur: 180, tags: ['brain', 'mood'], desc: '在便签纸上画出或写下你三个月后想达到的一个工作目标，贴在电脑角，加油。' },
  { id: 'affirmation_card', name: '自我肯定卡', emoji: '💪', rarity: 'ssr', hp: 28, dur: 150, tags: ['brain', 'mood', 'stress', 'relax'], desc: '写下或默念一句积极的自我肯定，比如“我有能力解决今天的问题”，重复三遍。' },
  { id: 'stretch_flow', name: '舒展流卡', emoji: '🧘‍♀️', rarity: 'ssr', hp: 38, dur: 300, tags: ['back', 'neck', 'sit', 'relax'], desc: '一套连续动作：手臂上举、侧弯、前屈、后仰，每个动作保持3个呼吸，让全身舒展五分钟。' },
  { id: 'journal_three', name: '三行日记卡', emoji: '✍️', rarity: 'ssr', hp: 30, dur: 150, tags: ['brain', 'mood', 'relax'], desc: '写下今天三件好事，不限大小，完成后会感到积极情绪积累，持续活跃。' },
  { id: 'deep_clean', name: '深度清洁卡', emoji: '🧽', rarity: 'ssr', hp: 28, dur: 180, tags: ['mood', 'relax'], desc: '用三分钟擦拭你的桌面、键盘、屏幕，打扫物理空间的同时也清理内心杂念。' },
];

/** 稀有度抽取权重（数值越大越容易抽到） */
export const RARITY_WEIGHT = { n: 65, r: 25, sr: 8, ssr: 2 };

/** 稀有度展示标签 */
export const RARITY_LABEL = { n: 'N · 普通', r: 'R · 稀有', sr: 'SR · 史诗', ssr: 'SSR · 传说' };

/** 状态标签人话映射
 *  stress = 时间紧迫的"赶 DDL"场景（推荐快速、可在碎片时间完成的小动作）
 *  relax  = 压力大想主动放松（推荐冥想、按摩、深呼吸等舒缓型动作）
 */
export const TAG_LABEL = {
  sit: '久坐', eye: '眼疲劳', neck: '肩颈',
  meeting: '会议', mood: '心情', sleepy: '困倦',
  back: '腰背酸', brain: '脑子卡壳', hungry: '饿肚子',
  stress: '赶 DDL', relax: '想放松',
};

/** 状态标签 emoji */
export const TAG_EMOJI = {
  sit: '🪑', eye: '👀', neck: '🦴',
  meeting: '🗣️', mood: '😮‍💨', sleepy: '😴',
  back: '🧱', brain: '🧠', hungry: '🍙',
  stress: '⏰', relax: '🌿',
};

/** 通过 id 查找卡牌 */
export function getCardById(id) {
  return CARD_POOL.find(c => c.id === id);
}
