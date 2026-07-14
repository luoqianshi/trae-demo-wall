/* FocusPaw Demo — Interactive Logic */
(function() {
  'use strict';

  /* ============================================================
   * COLOR CONSTANTS
   * ============================================================ */
  var C = {
    teal: '#4FD1C5',      /* LinguaVerse cyan-blue brand */
    pink: '#F0ABFC',      /* soft magenta for hearts/blush on dark */
    amber: '#FBBF24',     /* warm amber for stars/sparkles */
    dark: '#050816',      /* deep OLED black */
    purple: '#A78BFA',    /* LinguaVerse violet brand */
    white: '#E0E7FF',     /* light text on dark */
    dim: '#475569',       /* slate dim for dark circles */
  };

  /* ============================================================
   * MULTILINGUAL HELPER — returns string for current language
   * ============================================================ */
  function tr(obj) {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    var lang = (window.i18n && window.i18n.getLang()) || 'zh-CN';
    return obj[lang] || obj['zh-CN'] || '';
  }

  /* Track current expression and filter for languagechange re-render */
  var currentExprId = 1;
  var currentFilter = 'all';

  /* ============================================================
   * EYE HELPERS — each returns SVG string, coords in 104x70 space
   * Left eye ~ (32,26)  Right eye ~ (72,26)
   * ============================================================ */
  function eyeSquint(cx, cy) {
    return '<path d="M' + (cx-9) + ',' + (cy+2) + ' Q' + cx + ',' + (cy-5) + ' ' + (cx+9) + ',' + (cy+2) + '" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  function eyeWide(cx, cy, pdx, pdy) {
    pdx = pdx || 0; pdy = pdy || 0;
    return '<circle cx="' + cx + '" cy="' + cy + '" r="8" fill="none" stroke="' + C.teal + '" stroke-width="2"/>' +
           '<circle cx="' + (cx+pdx) + '" cy="' + (cy+pdy) + '" r="3.5" fill="' + C.teal + '"/>';
  }
  function eyeDot(cx, cy) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + C.teal + '"/>';
  }
  function eyeClosed(cx, cy) {
    return '<path d="M' + (cx-8) + ',' + cy + ' Q' + cx + ',' + (cy+4) + ' ' + (cx+8) + ',' + cy + '" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  function eyeStar(cx, cy) {
    var s = 7, pts = [];
    for (var i = 0; i < 5; i++) {
      var a = (i * 144 - 90) * Math.PI / 180;
      pts.push((cx + s * Math.cos(a)).toFixed(1) + ',' + (cy + s * Math.sin(a)).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + C.amber + '"/>';
  }
  function eyeHeart(cx, cy) {
    return '<path d="M' + cx + ',' + (cy+6) + ' C' + (cx-8) + ',' + (cy-2) + ' ' + (cx-8) + ',' + (cy-8) + ' ' + (cx-3) + ',' + (cy-6) +
           ' C' + (cx-1) + ',' + (cy-4) + ' ' + cx + ',' + (cy-3) + ' ' + cx + ',' + (cy-2) +
           ' C' + cx + ',' + (cy-3) + ' ' + (cx+1) + ',' + (cy-4) + ' ' + (cx+3) + ',' + (cy-6) +
           ' C' + (cx+8) + ',' + (cy-8) + ' ' + (cx+8) + ',' + (cy-2) + ' ' + cx + ',' + (cy+6) + ' Z" fill="' + C.pink + '"/>';
  }
  function eyeSpiral(cx, cy) {
    return '<path d="M' + (cx-6) + ',' + (cy-4) + ' L' + (cx+6) + ',' + (cy+4) + '" stroke="' + C.teal + '" stroke-width="2.5" stroke-linecap="round"/>' +
           '<path d="M' + (cx-6) + ',' + (cy+4) + ' L' + (cx+6) + ',' + (cy-4) + '" stroke="' + C.teal + '" stroke-width="2.5" stroke-linecap="round"/>';
  }
  function eyeWinkClosed(cx, cy) {
    return '<path d="M' + (cx-8) + ',' + cy + ' Q' + cx + ',' + (cy-4) + ' ' + (cx+8) + ',' + cy + '" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  function eyeDetermined(cx, cy, dir) {
    dir = dir || 1;
    return '<path d="M' + (cx-8) + ',' + (cy-3*dir) + ' L' + (cx+8) + ',' + (cy+3*dir) + '" stroke="' + C.teal + '" stroke-width="3" stroke-linecap="round"/>' +
           '<circle cx="' + cx + '" cy="' + cy + '" r="2.5" fill="' + C.teal + '"/>';
  }
  function eyeTired(cx, cy) {
    return '<path d="M' + (cx-8) + ',' + (cy-2) + ' Q' + cx + ',' + (cy+1) + ' ' + (cx+8) + ',' + (cy-2) + '" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
           '<ellipse cx="' + cx + '" cy="' + (cy+6) + '" rx="9" ry="3" fill="' + C.dim + '" opacity="0.5"/>';
  }
  function eyeHalf(cx, cy) {
    return '<path d="M' + (cx-8) + ',' + (cy-1) + ' Q' + cx + ',' + (cy+2) + ' ' + (cx+8) + ',' + (cy-1) + '" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
           '<path d="M' + (cx-8) + ',' + (cy-1) + ' Q' + cx + ',' + (cy-6) + ' ' + (cx+8) + ',' + (cy-1) + '" stroke="' + C.teal + '" stroke-width="1.5" fill="none" opacity="0.35" stroke-linecap="round"/>';
  }
  function eyeSurprised(cx, cy) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="9" fill="none" stroke="' + C.teal + '" stroke-width="2.5"/>' +
           '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + C.teal + '"/>';
  }
  function eyeLooking(cx, cy, dx, dy) {
    dx = dx || 0; dy = dy || 0;
    return '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="none" stroke="' + C.teal + '" stroke-width="2"/>' +
           '<circle cx="' + (cx+dx) + '" cy="' + (cy+dy) + '" r="3" fill="' + C.teal + '"/>';
  }

  /* ============================================================
   * MOUTH HELPERS — mouth center ~ (52,48)
   * ============================================================ */
  function mouthSmile() {
    return '<path d="M44,46 Q52,54 60,46" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  function mouthBigSmile() {
    return '<path d="M40,44 Q52,58 64,44" stroke="' + C.teal + '" stroke-width="2.5" fill="' + C.teal + '" fill-opacity="0.1" stroke-linecap="round"/>';
  }
  function mouthFrown() {
    return '<path d="M44,52 Q52,46 60,52" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  function mouthOpen() {
    return '<ellipse cx="52" cy="50" rx="5" ry="7" fill="' + C.teal + '" fill-opacity="0.15" stroke="' + C.teal + '" stroke-width="2"/>';
  }
  function mouthFlat() {
    return '<line x1="45" y1="50" x2="59" y2="50" stroke="' + C.teal + '" stroke-width="2.5" stroke-linecap="round"/>';
  }
  function mouthO() {
    return '<circle cx="52" cy="50" r="4" fill="none" stroke="' + C.teal + '" stroke-width="2"/>';
  }
  function mouthWavy() {
    return '<path d="M42,50 Q46,46 50,50 Q54,54 58,50 Q60,48 62,50" stroke="' + C.teal + '" stroke-width="2" fill="none" stroke-linecap="round"/>';
  }
  function mouthTongue() {
    return '<path d="M44,46 Q52,54 60,46" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
           '<ellipse cx="52" cy="55" rx="3" ry="4" fill="' + C.pink + '"/>';
  }
  function mouthSmirk() {
    return '<path d="M46,50 Q52,52 60,46" stroke="' + C.teal + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>';
  }
  function mouthWide() {
    return '<ellipse cx="52" cy="50" rx="8" ry="6" fill="' + C.teal + '" fill-opacity="0.15" stroke="' + C.teal + '" stroke-width="2"/>';
  }

  /* ============================================================
   * ACCESSORY HELPERS
   * ============================================================ */
  function accBlush() {
    return '<circle cx="20" cy="38" r="5" fill="' + C.pink + '" opacity="0.3"/><circle cx="84" cy="38" r="5" fill="' + C.pink + '" opacity="0.3"/>';
  }
  function accTears() {
    return '<path d="M28,30 Q26,40 28,44 Q30,40 28,30" fill="' + C.teal + '" opacity="0.6"/>' +
           '<path d="M76,30 Q74,40 76,44 Q78,40 76,30" fill="' + C.teal + '" opacity="0.6"/>';
  }
  function accSparkles() {
    return '<text x="12" y="18" fill="' + C.amber + '" font-size="8" font-family="sans-serif">✦</text>' +
           '<text x="88" y="20" fill="' + C.amber + '" font-size="8" font-family="sans-serif">✦</text>';
  }
  function accHearts() {
    return '<text x="10" y="20" fill="' + C.pink + '" font-size="9" font-family="sans-serif">♥</text>' +
           '<text x="88" y="18" fill="' + C.pink + '" font-size="9" font-family="sans-serif">♥</text>';
  }
  function accSweat() {
    return '<path d="M82,18 Q80,24 82,28 Q84,24 82,18" fill="' + C.teal + '" opacity="0.5"/>';
  }
  function accQuestion() {
    return '<text x="82" y="20" fill="' + C.amber + '" font-size="10" font-family="monospace" font-weight="bold">?</text>';
  }
  function accZzz() {
    return '<text x="78" y="14" fill="' + C.teal + '" font-size="7" opacity="0.7" font-family="sans-serif">z</text>' +
           '<text x="84" y="9" fill="' + C.teal + '" font-size="9" opacity="0.5" font-family="sans-serif">z</text>';
  }
  function accSunglasses() {
    return '<rect x="18" y="20" width="28" height="12" rx="3" fill="' + C.dark + '" stroke="' + C.teal + '" stroke-width="1"/>' +
           '<rect x="58" y="20" width="28" height="12" rx="3" fill="' + C.dark + '" stroke="' + C.teal + '" stroke-width="1"/>' +
           '<line x1="46" y1="26" x2="58" y2="26" stroke="' + C.teal + '" stroke-width="1.5"/>';
  }
  function accLightning() {
    return '<path d="M50,6 L46,16 L50,16 L48,24 L54,12 L50,12 L52,6" fill="' + C.amber + '"/>';
  }
  function accMoon() {
    return '<path d="M88,10 a5,5 0 1,0 5,5 a7,7 0 1,1 -5,-5" fill="' + C.amber + '" opacity="0.8"/>';
  }
  function accConfetti() {
    return '<rect x="14" y="8" width="3" height="3" fill="' + C.pink + '" transform="rotate(20 15 9)"/>' +
           '<rect x="86" y="6" width="3" height="3" fill="' + C.amber + '" transform="rotate(45 87 7)"/>' +
           '<rect x="22" y="4" width="2" height="4" fill="' + C.teal + '" transform="rotate(60 23 6)"/>' +
           '<rect x="78" y="12" width="3" height="3" fill="' + C.purple + '" transform="rotate(30 79 13)"/>';
  }
  function accDarkCircles() {
    return '<ellipse cx="32" cy="34" rx="9" ry="3.5" fill="' + C.dim + '" opacity="0.4"/>' +
           '<ellipse cx="72" cy="34" rx="9" ry="3.5" fill="' + C.dim + '" opacity="0.4"/>';
  }

  /* ============================================================
   * 28 EXPRESSIONS
   * ============================================================ */
  var EXPRESSIONS = [
    // --- Focus (7) ---
    { id:1,  name:{'zh-CN':'专注眯眼','en':'Focus Squint','ja':'集中細目','ko':'집중 가늘게'}, cat:'focus', desc:{'zh-CN':'检测到持续专注状态，喵咪眯起眼睛静静陪伴你。','en':'Detected sustained focus — kitty squints, quietly keeping you company.','ja':'持続的な集中を検知、猫が目を細めて静かに寄り添います。','ko':'지속적인 집중 감지, 냥이가 눈을 가늘게 뜨고 조용히 곁에 있어요.'}, svg: eyeSquint(32,26)+eyeSquint(72,26)+mouthSmile() },
    { id:2,  name:{'zh-CN':'走神瞪视','en':'Distracted Stare','ja':'注意散漫凝視','ko':'디스트랙션 응시'}, cat:'focus', desc:{'zh-CN':'检测到目光游离，喵咪瞪大眼睛提醒你回到任务。','en':'Detected wandering gaze — kitty stares wide-eyed, reminding you to return to your task.','ja':'視線の遊離を検知、猫が目を見開いてタスクに戻るよう促します。','ko':'시선 이탈 감지, 냥이가 눈을 크게 뜨고 다시 집중하라고 해요.'}, svg: eyeWide(32,26,-2,0)+eyeWide(72,26,2,0)+mouthO() },
    { id:3,  name:{'zh-CN':'深度心流','en':'Deep Flow','ja':'深いフロー','ko':'깊은 몰입'}, cat:'focus', desc:{'zh-CN':'你已进入深度心流状态，喵咪安心闭目为你守护。','en':'You\'ve entered deep flow — kitty closes its eyes, peacefully guarding you.','ja':'深い没入状態に突入、猫が安心して目を閉じて守ってくれます。','ko':'깊은 몰입 상태 진입, 냥이가 안심하고 눈을 감고 지켜줘요.'}, svg: eyeClosed(32,26)+eyeClosed(72,26)+mouthSmile()+accSparkles() },
    { id:4,  name:{'zh-CN':'专注凝视','en':'Focused Gaze','ja':'集中凝視','ko':'집중 응시'}, cat:'focus', desc:{'zh-CN':'检测到高度集中，喵咪目光如炬与你并肩作战。','en':'Detected high concentration — kitty\'s piercing gaze fights alongside you.','ja':'高い集中を検知、猫が灼熱の眼差しで共に戦います。','ko':'고도의 집중 감지, 냥이가 타오르는 눈빛으로 함께 싸워요.'}, svg: eyeDetermined(32,26,-1)+eyeDetermined(72,26,1)+mouthFlat() },
    { id:5,  name:{'zh-CN':'即将完成','en':'Almost There','ja':'完成間近','ko':'완성 임박'}, cat:'focus', desc:{'zh-CN':'专注任务接近尾声，喵咪眼中闪烁期待星光。','en':'Focus task nearing the end — kitty\'s eyes sparkle with anticipation.','ja':'集中タスクが終盤に、猫の目に期待の星がきらめきます。','ko':'집중 작업이 막바지, 냥이 눈에 기대의 별이 반짝여요.'}, svg: eyeStar(32,26)+eyeStar(72,26)+mouthBigSmile() },
    { id:6,  name:{'zh-CN':'加油打气','en':'Cheer Up','ja':'応援','ko':'응원'}, cat:'focus', desc:{'zh-CN':'专注遇到瓶颈，喵咪为你加油打气不要放弃。','en':'Hit a bottleneck — kitty cheers you on, don\'t give up.','ja':'集中の壁にぶつかり、猫が応援して諦めないよう励まします。','ko':'집중의 한계에 도달, 냥이가 응원하며 포기 말라고 해요.'}, svg: eyeDetermined(32,26,1)+eyeDetermined(72,26,-1)+mouthOpen()+accSparkles() },
    { id:7,  name:{'zh-CN':'走神拉回','en':'Back on Track','ja':'引き戻し','ko':'다시 집중'}, cat:'focus', desc:{'zh-CN':'走神被检测到，喵咪惊讶提醒你快回来专注。','en':'Distraction detected — kitty looks surprised, urging you back to focus.','ja':'注意散漫を検知、猫が驚いて集中に戻るよう促します。','ko':'디스트랙션 감지, 냥이가 놀라며 다시 집중하라고 해요.'}, svg: eyeSurprised(32,26)+eyeSurprised(72,26)+mouthO()+accSweat() },

    // --- Rest (7) ---
    { id:8,  name:{'zh-CN':'休息伸懒腰','en':'Rest Stretch','ja':'休憩伸び','ko':'휴식 스트레칭'}, cat:'rest', desc:{'zh-CN':'专注结束，喵咪陪你一起伸个大大的懒腰。','en':'Focus session over — kitty joins you for a big stretch.','ja':'集中終了、猫と一緒に大きく伸びをします。','ko':'집중 종료, 냥이와 함께 크게 기지개를 켜요.'}, svg: eyeClosed(32,26)+eyeClosed(72,26)+mouthWide() },
    { id:9,  name:{'zh-CN':'困倦打哈欠','en':'Sleepy Yawn','ja':'眠気あくび','ko':'졸린 하품'}, cat:'rest', desc:{'zh-CN':'夜深了，喵咪也困了，陪你打个大哈欠。','en':'It\'s late — kitty is sleepy too, yawning along with you.','ja':'夜更け、猫も眠くなり一緒に大きなあくびを。','ko':'늦은 밤, 냥이도 졸려서 함께 큰 하품을 해요.'}, svg: eyeHalf(32,26)+eyeHalf(72,26)+mouthOpen() },
    { id:10, name:{'zh-CN':'冷静闭目','en':'Calm Closed Eyes','ja':'冷静閉眼','ko':'차분한 감기'}, cat:'rest', desc:{'zh-CN':'短暂休息中，喵咪闭目养神等你回来。','en':'Short break — kitty rests its eyes, waiting for your return.','ja':'短い休憩中、猫が目を閉じてエネルギーを蓄えます。','ko':'짧은 휴식 중, 냥이가 눈을 감고 쉬며 돌아오길 기다려요.'}, svg: eyeClosed(32,26)+eyeClosed(72,26)+mouthSmile() },
    { id:11, name:{'zh-CN':'满足微笑','en':'Content Smile','ja':'満足スマイル','ko':'만족 미소'}, cat:'rest', desc:{'zh-CN':'完成一次专注会话，喵咪露出满足微笑。','en':'Completed a focus session — kitty shows a satisfied smile.','ja':'集中セッション完了、猫が満足そうに微笑みます。','ko':'집중 세션 완료, 냥이가 만족스럽게 미소 지어요.'}, svg: eyeSquint(32,26)+eyeSquint(72,26)+mouthSmile()+accBlush() },
    { id:12, name:{'zh-CN':'美味舔嘴','en':'Tasty Lick','ja':'美味しい舐め','ko':'맛있는 핥기'}, cat:'rest', desc:{'zh-CN':'休息时间到，喵咪舔舔嘴提醒你吃点东西。','en':'Break time — kitty licks its lips, reminding you to grab a bite.','ja':'休憩タイム、猫が舌なめずりして何か食べるよう促します。','ko':'휴식 시간, 냥이가 혀를 쓱 핥으며 뭔가 먹으라고 해요.'}, svg: eyeSquint(32,26)+eyeSquint(72,26)+mouthTongue() },
    { id:13, name:{'zh-CN':'晚安月亮','en':'Goodnight Moon','ja':'おやすみ月','ko':'굿나잇 달'}, cat:'rest', desc:{'zh-CN':'深夜了，喵咪月亮守护，轻轻对你说晚安。','en':'Late at night — kitty guards with the moon, softly wishing you goodnight.','ja':'深夜、猫が月と共に守り、そっとおやすみを言います。','ko':'깊은 밤, 냥이가 달과 함께 지키며 조용히 잘 자라고 해요.'}, svg: eyeClosed(32,26)+eyeClosed(72,26)+mouthSmile()+accZzz()+accMoon() },
    { id:14, name:{'zh-CN':'充电中','en':'Recharging','ja':'充電中','ko':'충전 중'}, cat:'rest', desc:{'zh-CN':'电量不足，喵咪闪着闪电提醒你该充电休息了。','en':'Low battery — kitty flashes lightning, reminding you to recharge.','ja':'バッテリー不足、猫が稲妻を光らせて休むよう促します。','ko':'배터리 부족, 냥이가 번개를 번쩍이며 쉬라고 해요.'}, svg: eyeHalf(32,26)+eyeHalf(72,26)+mouthFlat()+accLightning() },

    // --- Emotion (8) ---
    { id:15, name:{'zh-CN':'开心笑','en':'Happy Laugh','ja':'ハッピー笑い','ko':'해피 웃음'}, cat:'emotion', desc:{'zh-CN':'今天专注表现很棒，喵咪开心地大笑起来。','en':'Great focus today — kitty bursts into happy laughter.','ja':'今日の集中は素晴らしい、猫が嬉しそうに大笑い。','ko':'오늘 집중 훌륭해요, 냥이가 행복하게 크게 웃어요.'}, svg: eyeSquint(32,26)+eyeSquint(72,26)+mouthBigSmile() },
    { id:16, name:{'zh-CN':'害羞脸红','en':'Shy Blush','ja':'恥ずかし赤面','ko':'부끄러운 발그레'}, cat:'emotion', desc:{'zh-CN':'被夸奖啦，喵咪害羞得脸都红了。','en':'Got praised — kitty blushes all the way to its ears.','ja':'褒められて、猫が恥ずかしくて顔を赤らめます。','ko':'칭찬받았어요, 냥이가 부끄러워 얼굴이 빨개져요.'}, svg: eyeClosed(32,28)+eyeClosed(72,28)+mouthSmirk()+accBlush() },
    { id:17, name:{'zh-CN':'生气鼓腮','en':'Angry Puff','ja':'怒り頬膨らみ','ko':'화난 볼 부풀기'}, cat:'emotion', desc:{'zh-CN':'又走神了！喵咪鼓起腮帮子表示不满。','en':'Distracted again! Kitty puffs its cheeks in displeasure.','ja':'また注意散漫！猫が頬を膨らませて不満を示します。','ko':'또 디스트랙션! 냥이가 볼을 부풀리며 불만을 보여요.'}, svg: eyeDetermined(32,26,-1)+eyeDetermined(72,26,-1)+mouthFlat() },
    { id:18, name:{'zh-CN':'惊讶圆眼','en':'Surprised Round Eyes','ja':'驚き丸目','ko':'놀란 동그란 눈'}, cat:'emotion', desc:{'zh-CN':'检测到突然中断，喵咪惊讶地瞪圆了眼。','en':'Sudden interruption detected — kitty\'s eyes go wide in surprise.','ja':'突然の中断を検知、猫が驚いて目を丸くします。','ko':'갑작스런 중단 감지, 냥이가 놀라 눈을 동그랗게 떠요.'}, svg: eyeSurprised(32,26)+eyeSurprised(72,26)+mouthO() },
    { id:19, name:{'zh-CN':'得意眨眼','en':'Smug Wink','ja':'得意ウィンク','ko':'뽐내는 윙크'}, cat:'emotion', desc:{'zh-CN':'完成目标啦，喵咪得意地对你眨眨眼。','en':'Goal achieved — kitty smugly winks at you.','ja':'目標達成、猫が得意げにウィンクします。','ko':'목표 달성, 냥이가 뽐내듯 윙크해요.'}, svg: eyeDot(32,26)+eyeWinkClosed(72,26)+mouthSmirk() },
    { id:20, name:{'zh-CN':'撒娇蹭蹭','en':'Cuddle Rub','ja':'甘え擦り付け','ko':'애교 부비부비'}, cat:'emotion', desc:{'zh-CN':'你捏了捏爪子，喵咪撒娇蹭蹭你的手心。','en':'You squeezed the paw — kitty nuzzles your palm affectionately.','ja':'爪を握ると、猫が甘えて手のひらにすり寄ります。','ko':'발을 꼬집자, 냥이가 애교 부리며 손바닥에 비벼요.'}, svg: eyeSquint(32,26)+eyeSquint(72,26)+mouthBigSmile()+accHearts() },
    { id:21, name:{'zh-CN':'流泪委屈','en':'Tearful Grievance','ja':'涙委屈','ko':'눈물 억울함'}, cat:'emotion', desc:{'zh-CN':'专注目标没完成，喵咪委屈得流下了眼泪。','en':'Focus goal unmet — kitty sheds tears of grievance.','ja':'集中目標未達成、猫が悔しくて涙を流します。','ko':'집중 목표 미달성, 냥이가 억울해서 눈물을 흘려요.'}, svg: eyeHalf(32,26)+eyeHalf(72,26)+mouthWavy()+accTears() },
    { id:22, name:{'zh-CN':'心心眼','en':'Heart Eyes','ja':'ハート目','ko':'하트 눈'}, cat:'emotion', desc:{'zh-CN':'超长专注达成！喵咪满眼都是爱你的心心。','en':'Ultra-long focus achieved! Kitty\'s eyes are full of hearts for you.','ja':'超長時間集中達成！猫の目が愛のハートでいっぱい。','ko':'초장시간 집중 달성! 냥이 눈에 사랑 하트가 가득해요.'}, svg: eyeHeart(32,26)+eyeHeart(72,26)+mouthBigSmile() },

    // --- Special (6) ---
    { id:23, name:{'zh-CN':'好奇歪头','en':'Curious Tilt','ja':'好奇傾き','ko':'호기심 갸웃'}, cat:'special', desc:{'zh-CN':'检测到新任务，喵咪好奇地歪了歪头。','en':'New task detected — kitty tilts its head curiously.','ja':'新しいタスクを検知、猫が好奇心で首を傾げます。','ko':'새 작업 감지, 냥이가 호기심에 고개를 갸웃해요.'}, svg: eyeLooking(32,26,0,-2)+eyeLooking(72,26,0,-2)+mouthO()+accQuestion() },
    { id:24, name:{'zh-CN':'晕眩转圈','en':'Dizzy Spiral','ja':'めまい螺旋','ko':'어지러운 나선'}, cat:'special', desc:{'zh-CN':'专注太久脑子转不动了，喵咪也晕了。','en':'Focused too long — brain won\'t turn, kitty is dizzy too.','ja':'長時間集中で脳が回らない、猫も目が回ります。','ko':'너무 오래 집중해 머리가 안 돌아가, 냥이도 어지러워요.'}, svg: eyeSpiral(32,26)+eyeSpiral(72,26)+mouthWavy() },
    { id:25, name:{'zh-CN':'疑惑问号','en':'Confused Question','ja':'疑問はてな','ko':'의문 물음표'}, cat:'special', desc:{'zh-CN':'你在干嘛呢？喵咪头上冒出了问号。','en':'What are you doing? A question mark pops above kitty\'s head.','ja':'何してるの？猫の頭に疑問符が浮かびます。','ko':'뭐 해요? 냥이 머리 위에 물음표가 떠올라요.'}, svg: eyeDot(32,26)+eyeLooking(72,26,0,-2)+mouthO()+accQuestion() },
    { id:26, name:{'zh-CN':'酷酷墨镜','en':'Cool Sunglasses','ja':'クールサングラス','ko':'쿨 선글라스'}, cat:'special', desc:{'zh-CN':'周末专注模式开启，喵咪戴上墨镜酷酷的。','en':'Weekend focus mode on — kitty puts on shades, looking cool.','ja':'週末集中モード起動、猫がサングラスでクールに。','ko':'주말 집중 모드 시작, 냥이가 선글라스 끼고 쿨해요.'}, svg: accSunglasses()+mouthSmirk() },
    { id:27, name:{'zh-CN':'庆祝撒花','en':'Celebration Confetti','ja':'お祝い紙吹雪','ko':'축하 컨페티'}, cat:'special', desc:{'zh-CN':'里程碑达成！喵咪为你撒花庆祝。','en':'Milestone reached! Kitty showers you with confetti.','ja':'マイルストーン達成！猫が紙吹雪でお祝いします。','ko':'마일스톤 달성! 냥이가 컨페티로 축하해요.'}, svg: eyeStar(32,26)+eyeStar(72,26)+mouthOpen()+accConfetti() },
    { id:28, name:{'zh-CN':'疲惫黑眼圈','en':'Exhausted Dark Circles','ja':'疲労目の下クマ','ko':'지친 다크서클'}, cat:'special', desc:{'zh-CN':'连续高强度专注，喵咪也熬出了黑眼圈。','en':'Back-to-back intense focus — kitty has dark circles too.','ja':'連続ハード集中、猫にも目の下クマが。','ko':'연속 고강도 집중, 냥이도 다크서클이 생겼어요.'}, svg: eyeTired(32,26)+eyeTired(72,26)+mouthFlat()+accDarkCircles() },
  ];

  /* ============================================================
   * EXPRESSION RENDERING
   * ============================================================ */
  function makeFaceSvg(exprSvg, w, h) {
    w = w || 104; h = h || 70;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">' + exprSvg + '</svg>';
  }

  function renderExpressionOnCat(exprId) {
    var expr = EXPRESSIONS.find(function(e) { return e.id === exprId; });
    if (!expr) return;
    currentExprId = exprId;
    var oledFace = document.getElementById('oledFace');
    oledFace.innerHTML = '<svg x="108" y="135" width="104" height="70" viewBox="0 0 104 70" xmlns="http://www.w3.org/2000/svg">' + expr.svg + '</svg>';
    // Update info panel
    document.getElementById('exprName').textContent = tr(expr.name);
    document.getElementById('exprDesc').textContent = tr(expr.desc);
    // Update gallery active state
    document.querySelectorAll('.expr-card').forEach(function(card) {
      card.classList.toggle('active', parseInt(card.dataset.id) === exprId);
    });
  }

  /* ============================================================
   * EXPRESSION GALLERY
   * ============================================================ */
  function renderGallery(filter) {
    filter = filter || 'all';
    currentFilter = filter;
    var grid = document.getElementById('exprGrid');
    var html = '';
    EXPRESSIONS.forEach(function(expr) {
      if (filter !== 'all' && expr.cat !== filter) return;
      html += '<div class="expr-card" data-id="' + expr.id + '" data-cat="' + expr.cat + '">' +
              '<div class="mini-oled">' + makeFaceSvg(expr.svg) + '</div>' +
              '<div class="ename">' + tr(expr.name) + '</div>' +
              '<div class="enum">No.' + String(expr.id).padStart(2, '0') + '</div>' +
              '</div>';
    });
    grid.innerHTML = html;
    // Click handlers
    grid.querySelectorAll('.expr-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var id = parseInt(card.dataset.id);
        renderExpressionOnCat(id);
        // Scroll to cat demo
        document.getElementById('interact').scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Cat animation
        catBounce();
        var expr = EXPRESSIONS.find(function(e){return e.id===id;});
        logAction(i18n.t('log.expr.preview').replace('{name}', tr(expr.name)));
      });
    });
  }

  /* ============================================================
   * CAT INTERACTION
   * ============================================================ */
  var currentMode = 0; // 0=focus, 1=rest, 2=companion
  var modes = [
    { name: {'zh-CN':'专注模式','en':'Focus Mode','ja':'集中モード','ko':'집중 모드'}, icon: '🎯', bg: 'rgba(167,139,250,0.15)', defaultExpr: 1 },
    { name: {'zh-CN':'休息模式','en':'Rest Mode','ja':'休憩モード','ko':'휴식 모드'}, icon: '☕', bg: 'rgba(79,209,197,0.15)', defaultExpr: 10 },
    { name: {'zh-CN':'陪伴模式','en':'Companion Mode','ja':'陪伴モード','ko':'동반 모드'}, icon: '💜', bg: 'rgba(129,140,248,0.15)', defaultExpr: 20 },
  ];
  var focusActive = false;

  function catBounce() {
    var cat = document.getElementById('catSvg');
    cat.classList.add('bounce');
    setTimeout(function() { cat.classList.remove('bounce'); }, 500);
  }
  function catShake() {
    var cat = document.getElementById('catSvg');
    cat.classList.add('shake');
    setTimeout(function() { cat.classList.remove('shake'); }, 400);
  }

  function logAction(text) {
    var log = document.getElementById('actionLog');
    var now = new Date();
    var time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    var item = document.createElement('div');
    item.className = 'log-item fade-in';
    item.innerHTML = '<span class="log-time">' + time + '</span><span class="log-text">' + text + '</span>';
    log.insertBefore(item, log.firstChild);
    // Keep max 6 items
    while (log.children.length > 6) log.removeChild(log.lastChild);
  }

  function switchMode() {
    currentMode = (currentMode + 1) % modes.length;
    var mode = modes[currentMode];
    document.getElementById('modeName').textContent = tr(mode.name);
    var iconEl = document.getElementById('modeIcon');
    iconEl.textContent = mode.icon;
    iconEl.style.background = mode.bg;
    renderExpressionOnCat(mode.defaultExpr);
    catBounce();
    logAction(i18n.t('log.mode.switch').replace('{mode}', tr(mode.name)));
  }

  function toggleFocus() {
    focusActive = !focusActive;
    if (focusActive) {
      renderExpressionOnCat(1); // 专注眯眼
      catBounce();
      logAction(i18n.t('log.focus.on'));
    } else {
      renderExpressionOnCat(11); // 满足微笑
      catShake();
      logAction(i18n.t('log.focus.off'));
    }
  }

  function pawResponse(side) {
    var responses = [
      { expr: 20, key: 'log.paw.1' },
      { expr: 15, key: 'log.paw.2' },
      { expr: 19, key: 'log.paw.3' },
    ];
    var r = responses[Math.floor(Math.random() * responses.length)];
    renderExpressionOnCat(r.expr);
    catBounce();
    logAction(i18n.t(r.key));
  }

  function setupCatInteractions() {
    document.getElementById('zoneEarLeft').addEventListener('click', toggleFocus);
    document.getElementById('zoneEarRight').addEventListener('click', toggleFocus);
    document.getElementById('zoneBelly').addEventListener('click', switchMode);
    document.getElementById('zonePawLeft').addEventListener('click', function() { pawResponse('left'); });
    document.getElementById('zonePawRight').addEventListener('click', function() { pawResponse('right'); });

    // Zone label hints on hover
    var labels = { 'ear-left': 'labelEar', 'ear-right': 'labelEar', 'belly': 'labelBelly', 'paw-left': 'labelPaw', 'paw-right': 'labelPaw' };
    Object.keys(labels).forEach(function(zone) {
      var el = document.querySelector('[data-zone="' + zone + '"]');
      var label = document.getElementById(labels[zone]);
      if (el && label) {
        el.addEventListener('mouseenter', function() { label.classList.add('show'); });
        el.addEventListener('mouseleave', function() { label.classList.remove('show'); });
      }
    });

    // Initial tutorial: show all labels briefly
    setTimeout(function() {
      document.querySelectorAll('.zone-label').forEach(function(l) { l.classList.add('show'); });
      setTimeout(function() {
        document.querySelectorAll('.zone-label').forEach(function(l) { l.classList.remove('show'); });
      }, 3000);
    }, 800);
  }

  /* ============================================================
   * FOCUS TIMER
   * ============================================================ */
  var focusTimer = {
    running: false,
    remaining: 25 * 60, // 25 minutes in seconds
    score: 0,
    state: 'idle', // idle, light, deep, distract
    interval: null,
    distractTimer: null,
  };

  var focusStates = {
    idle:    { label: {'zh-CN':'待机中','en':'Idle','ja':'待機中','ko':'대기 중'}, color: 'var(--muted)', scoreRange: [0, 10] },
    light:   { label: {'zh-CN':'轻度专注','en':'Light Focus','ja':'軽い集中','ko':'가벼운 집중'}, color: 'var(--accent2)', scoreRange: [11, 50] },
    deep:    { label: {'zh-CN':'深度专注','en':'Deep Focus','ja':'深い集中','ko':'깊은 집중'}, color: 'var(--accent)', scoreRange: [51, 100] },
    distract:{ label: {'zh-CN':'走神了！','en':'Distracted!','ja':'注意散漫！','ko':'디스트랙션!'}, color: 'var(--accent3)', scoreRange: [0, 100] },
    rest:    { label: {'zh-CN':'休息中','en':'Resting','ja':'休憩中','ko':'휴식 중'}, color: 'var(--teal)', scoreRange: [0, 100] },
  };

  function updateFocusDisplay() {
    // Score
    document.getElementById('focusScore').textContent = focusTimer.score;
    // Ring
    var circumference = 534; // 2 * PI * 85
    var offset = circumference - (focusTimer.score / 100) * circumference;
    document.getElementById('focusRing').style.strokeDashoffset = offset;
    // State label
    var stateInfo = focusStates[focusTimer.state];
    var stateLabel = document.getElementById('focusStateLabel');
    stateLabel.textContent = tr(stateInfo.label);
    stateLabel.style.color = stateInfo.color;
    stateLabel.style.borderColor = stateInfo.color;
    // Timer display
    var m = Math.floor(focusTimer.remaining / 60);
    var s = focusTimer.remaining % 60;
    document.getElementById('focusTimer').textContent =
      String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    // Sync expression with state
    if (focusTimer.running) {
      if (focusTimer.state === 'deep') renderExpressionOnCat(3); // 深度心流
      else if (focusTimer.state === 'light') renderExpressionOnCat(1); // 专注眯眼
      else if (focusTimer.state === 'distract') renderExpressionOnCat(7); // 走神拉回
    }
  }

  function updateTimeline() {
    var bar = document.getElementById('timelineBar');
    var colors = {
      deep: '#A78BFA',
      light: '#4FD1C5',
      distract: '#818CF8',
      rest: 'rgba(255,255,255,0.1)',
    };
    var labels = {
      deep: i18n.t('tl.label.deep'),
      light: i18n.t('tl.label.light'),
      distract: i18n.t('tl.label.distract'),
      rest: i18n.t('tl.label.rest'),
    };
    // Generate 25 random segments
    var states = ['deep','light','light','deep','deep','light','distract','light','deep','deep',
                  'light','rest','light','deep','deep','light','distract','deep','light','deep',
                  'deep','light','rest','light','deep'];
    var html = '';
    states.forEach(function(s) {
      html += '<div class="tl-seg" style="background:' + colors[s] + '" title="' + tr(focusStates[s].label) + '">' + labels[s] + '</div>';
    });
    bar.innerHTML = html;
  }

  function startFocus() {
    if (focusTimer.running) {
      // Pause
      focusTimer.running = false;
      clearInterval(focusTimer.interval);
      clearTimeout(focusTimer.distractTimer);
      document.getElementById('focusStartBtn').textContent = i18n.t('focus.btn.continue');
      focusTimer.state = 'idle';
      renderExpressionOnCat(11); // 满足微笑
      updateFocusDisplay();
      logAction(i18n.t('log.focus.pause'));
      return;
    }
    focusTimer.running = true;
    document.getElementById('focusStartBtn').textContent = i18n.t('focus.btn.pause');
    logAction(i18n.t('log.focus.start'));
    catBounce();

    // Main timer loop
    focusTimer.interval = setInterval(function() {
      if (focusTimer.remaining > 0) focusTimer.remaining--;
      // Increase score over time
      if (focusTimer.state !== 'distract') {
        focusTimer.score = Math.min(100, focusTimer.score + 1);
        if (focusTimer.score > 50 && focusTimer.state !== 'deep') {
          focusTimer.state = 'deep';
          logAction(i18n.t('log.focus.deep').replace('{score}', focusTimer.score));
        } else if (focusTimer.score > 10 && focusTimer.score <= 50 && focusTimer.state !== 'light') {
          focusTimer.state = 'light';
        }
      }
      if (focusTimer.remaining === 0) {
        // Session complete
        clearInterval(focusTimer.interval);
        focusTimer.running = false;
        focusTimer.state = 'idle';
        document.getElementById('focusStartBtn').textContent = i18n.t('focus.btn.start');
        renderExpressionOnCat(27); // 庆祝撒花
        catBounce();
        logAction(i18n.t('log.focus.complete'));
      }
      updateFocusDisplay();
    }, 1000);

    // Random distraction events
    function scheduleDistraction() {
      var delay = 15000 + Math.random() * 25000; // 15-40s
      focusTimer.distractTimer = setTimeout(function() {
        if (!focusTimer.running) return;
        if (focusTimer.score > 20) {
          focusTimer.state = 'distract';
          focusTimer.score = Math.max(0, focusTimer.score - 15);
          renderExpressionOnCat(7); // 走神拉回
          catShake();
          logAction(i18n.t('log.focus.distract'));
          updateFocusDisplay();
          // Recover after 3 seconds
          setTimeout(function() {
            if (focusTimer.running) {
              focusTimer.state = focusTimer.score > 50 ? 'deep' : 'light';
              updateFocusDisplay();
            }
          }, 3000);
        }
        scheduleDistraction();
      }, delay);
    }
    scheduleDistraction();
  }

  function resetFocus() {
    clearInterval(focusTimer.interval);
    clearTimeout(focusTimer.distractTimer);
    focusTimer.running = false;
    focusTimer.remaining = 25 * 60;
    focusTimer.score = 0;
    focusTimer.state = 'idle';
    document.getElementById('focusStartBtn').textContent = i18n.t('focus.btn.start');
    renderExpressionOnCat(10); // 冷静闭目
    updateFocusDisplay();
    logAction(i18n.t('log.focus.reset'));
  }

  /* ============================================================
   * VIBRATION DEMO
   * ============================================================ */
  var currentPattern = 'gentle';

  function setupVibration() {
    // Pattern selection
    document.querySelectorAll('.vibe-pattern').forEach(function(p) {
      p.addEventListener('click', function() {
        document.querySelectorAll('.vibe-pattern').forEach(function(x) { x.classList.remove('active'); });
        p.classList.add('active');
        currentPattern = p.dataset.pattern;
      });
    });

    // Test button
    document.getElementById('vibeTestBtn').addEventListener('click', function() {
      var device = document.getElementById('vibeDevice');
      var wave1 = document.getElementById('vibeWave1');
      var wave2 = document.getElementById('vibeWave2');

      device.classList.add('vibrating');
      wave1.classList.add('active');

      var duration = 800;
      if (currentPattern === 'gentle') duration = 600;
      else if (currentPattern === 'rhythm') duration = 1200;
      else if (currentPattern === 'strong') duration = 1500;

      // Rhythm pattern: pulse waves
      if (currentPattern === 'rhythm') {
        setTimeout(function() { wave2.classList.add('active'); }, 400);
      }

      setTimeout(function() {
        device.classList.remove('vibrating');
      }, duration);

      // Reset waves
      setTimeout(function() {
        wave1.classList.remove('active');
        wave2.classList.remove('active');
      }, 900);

      var patternNames = {
        gentle: i18n.t('vibe.pattern.gentle'),
        rhythm: i18n.t('vibe.pattern.rhythm'),
        strong: i18n.t('vibe.pattern.strong'),
      };
      logAction(i18n.t('log.vibe.test').replace('{pattern}', patternNames[currentPattern]));
    });

    // Sedentary slider
    var slider = document.getElementById('sedentarySlider');
    slider.addEventListener('input', function() {
      document.getElementById('sedentaryVal').textContent = slider.value + ' 分钟';
      document.getElementById('reminderPreview').textContent =
        i18n.t('vibe.sedentary.reminder').replace('{min}', slider.value);
    });

    // Vibration strength
    var strength = document.getElementById('vibeStrength');
    strength.addEventListener('input', function() {
      document.getElementById('vibeStrengthVal').textContent = strength.value + '%';
    });

    // Toggles
    document.getElementById('nightModeToggle').addEventListener('click', function() {
      this.classList.toggle('on');
    });
    document.getElementById('focusModeToggle').addEventListener('click', function() {
      this.classList.toggle('on');
    });
  }

  /* ============================================================
   * AI ENCOURAGEMENT
   * ============================================================ */
  var aiMode = 'daily';
  var aiHistory = [];

  var aiTemplates = {
    daily: {
      'zh-CN': [
        '今天的你，比昨天多专注了 23 分钟。每一个微小进步，都在通向更好的自己。加油，我在你身边 🐾',
        '早安！新的一天开始了。上一次你专注了 2 小时 15 分，今天挑战 3 小时怎么样？',
        '你已经连续专注 7 天啦！坚持是最了不起的超能力，今天也要元气满满哦！',
        '昨天你在上午 9-11 点效率最高，今天也把最重要的任务放在这个时段吧～',
        '别忘了，完成比完美更重要。先专注 25 分钟，开始了就已经赢了一半！',
        '本周专注总时长已超过 20 小时，你正在打败 92% 的用户。保持这个节奏！',
      ],
      'en': [
        'Today you focused 23 minutes more than yesterday. Every tiny step leads to a better you. Keep going, I\'m right here 🐾',
        'Good morning! A new day begins. Last time you focused 2h 15m — how about challenging 3 hours today?',
        'You\'ve focused 7 days in a row! Persistence is the greatest superpower — stay energetic today!',
        'Yesterday you were most productive 9-11 AM. Put your most important task in that slot today~',
        'Don\'t forget, done is better than perfect. Focus for 25 minutes — starting means you\'ve already won half!',
        'This week\'s total focus exceeded 20 hours — you\'re beating 92% of users. Keep this pace!',
      ],
      'ja': [
        '今日のあなたは昨日より23分多く集中しました。小さな進歩がより良い自分へ。応援します、そばにいます 🐾',
        'おはよう！新しい一日が始まりました。前回は2時間15分集中 — 今日は3時間に挑戦しませんか？',
        '7日連続集中達成！継続は最も素晴らしい超能力、今日も元気いっぱいで！',
        '昨日は午前9-11時が最も効率的でした。今日も重要なタスクをこの時間帯に〜',
        '忘れないで、完成は完璧より大事。まず25分集中 — 始めれば半分勝ったも同然！',
        '今週の合計集中時間は20時間超 — ユーザーの92%に勝ってます。このペースで！',
      ],
      'ko': [
        '오늘의 당신은 어제보다 23분 더 집중했어요. 작은 진전이 더 나은 자신으로. 응원해요, 곁에 있어요 🐾',
        '좋은 아침! 새로운 하루가 시작됐어요. 지난번 2시간 15분 집중 — 오늘 3시간에 도전할까요?',
        '7일 연속 집중 달성! 꾸준함은 최고의 초능력, 오늘도 활기차게!',
        '어제는 오전 9-11시가 가장 효율적이었어요. 오늘도 중요한 작업을 이 시간대에~',
        '잊지 마세요, 완수가 완벽보다 중요해요. 먼저 25분 집중 — 시작하면 반이나 이긴 거예요!',
        '이번 주 총 집중 시간 20시간 돌파 — 사용자 92%를 이기고 있어요. 이 페이스로!',
      ],
    },
    night: {
      'zh-CN': [
        '已经 23:42 了，今晚你已经专注了 3 小时。身体是革命的本钱，该休息啦，明天继续～ 🌙',
        '深夜的灯光下，你的努力很美。但喵喵心疼你了，放下手头的事，好好睡一觉吧。',
        '今晚你完成了 4 个专注会话，表现超棒！但现在大脑需要充电了，晚安，好梦 🌟',
        '夜深了，世界安静下来，你还在坚持。这份执着很珍贵，但也请善待自己，去睡吧～',
        '连续 3 天深夜专注了，你的努力我都看在眼里。今天到此为止吧，明天还有很多时间。',
      ],
      'en': [
        'It\'s 23:42 — you\'ve focused 3 hours tonight. Health comes first, time to rest. Tomorrow continues~ 🌙',
        'Under the late-night light, your effort is beautiful. But kitty worries about you — put it down and sleep well.',
        'You completed 4 focus sessions tonight, amazing! But your brain needs recharging now. Goodnight, sweet dreams 🌟',
        'It\'s late, the world is quiet, and you\'re still going. That dedication is precious — but be kind to yourself, sleep~',
        '3 late-night focus sessions in a row — I see all your effort. Let\'s stop for today, there\'s plenty of time tomorrow.',
      ],
      'ja': [
        '23:42になりました、今夜は3時間集中しました。健康が第一、休む時間です。明日は続けよう〜 🌙',
        '深夜の灯光の下、あなたの努力は美しい。でも猫が心配、手を止めてよく眠りましょう。',
        '今夜は4セッション完了、素晴らしい！でも脳は充電が必要です。おやすみ、良い夢を 🌟',
        '夜更け、世界は静かになり、あなたはまだ頑張っている。その執着は尊い — でも自分を労わって、寝よう〜',
        '3日連続深夜集中、あなたの努力は全部見てます。今日はここまで、明日はまだ時間があります。',
      ],
      'ko': [
        '23:42됐어요, 오늘 밤 3시간 집중했어요. 건강이 먼저, 쉴 시간이에요. 내일 계속해요~ 🌙',
        '심야의 조명 아래, 당신의 노력은 아름다워요. 하지만 냥이가 걱정돼요, 내려놓고 푹 자요.',
        '오늘 밤 4세션 완료, 대단해요! 하지만 뇌는 충전이 필요해요. 잘 자요, 좋은 꿈 꿔요 🌟',
        '늦은 밤, 세상은 조용한데 아직 하고 있군요. 그 집착은 소중해요 — 하지만 자신을 아끼고, 자요~',
        '3일 연속 심야 집중, 당신의 노력 다 봤어요. 오늘은 여기까지, 내일은 시간이 많아요.',
      ],
    },
    distract: {
      'zh-CN': [
        '嘿！你走神了哦～深呼吸 3 秒，把注意力拉回来。你能做到的，我在看着你 💪',
        '检测到你已经走神 2 分钟了。没关系，喝口水伸个懒腰，我们重新开始专注！',
        '走神是正常的，大脑也需要休息。但现在该回来啦，还有 15 分钟就完成目标了！',
        '嗡嗡～专注小卫士提醒你：任务还在等你哦。调整坐姿，重新聚焦，你可以的！',
        '你刚才专注了 18 分钟很棒！现在走神了一下没关系，深呼吸，我们继续～',
      ],
      'en': [
        'Hey! You\'re distracted~ Take 3 deep breaths and pull your focus back. You\'ve got this, I\'m watching you 💪',
        'You\'ve been distracted for 2 minutes. No worries — sip some water, stretch, and let\'s restart!',
        'Distraction is normal, your brain needs breaks too. But it\'s time to come back — just 15 minutes to your goal!',
        'Buzz~ Focus Guardian reminds you: your task is waiting. Adjust your posture, refocus — you can do it!',
        '18 minutes of focus just now, great! A little distraction is fine — breathe deep, let\'s continue~',
      ],
      'ja': [
        'ねえ！注意散漫だよ〜3秒深呼吸して集中を戻して。できるよ、見てるから 💪',
        '2分間注意散漫を検知。大丈夫 — 水を飲んで伸びをして、もう一度集中しましょう！',
        '注意散漫は正常、脳も休憩が必要。でも戻る時間です — あと15分で目標達成！',
        'ブーン〜集中ガードがリマインド：タスクが待ってるよ。姿勢を正して、再集中 — できる！',
        'さっき18分集中、素晴らしい！少し散漫になっても大丈夫 — 深呼吸して、続けよう〜',
      ],
      'ko': [
        '잠깐! 디스트랙션이에요~ 3초 심호흡하고 집중을 돌려요. 할 수 있어요, 지켜보고 있어요 💪',
        '2분간 디스트랙션 감지. 괜찮아요 — 물 마시고 스트레칭하고, 다시 집중해요!',
        '디스트랙션은 정상, 뇌도 쉬어야 해요. 하지만 돌아올 시간이에요 — 15분만 더 하면 목표 달성!',
        '붕붕~ 집중 가드가 알려요: 작업이 기다리고 있어요. 자세 고치고, 다시 집중 — 할 수 있어요!',
        '방금 18분 집중, 대단해요! 잠깐 디스트랙션 괜찮아요 — 심호흡하고, 계속해요~',
      ],
    },
  };

  function generateAI() {
    var lang = (window.i18n && window.i18n.getLang()) || 'zh-CN';
    var templates = aiTemplates[aiMode][lang] || aiTemplates[aiMode]['zh-CN'];
    var text = templates[Math.floor(Math.random() * templates.length)];
    var aiText = document.getElementById('aiText');
    aiText.classList.add('fade');
    setTimeout(function() {
      aiText.textContent = text;
      aiText.classList.remove('fade');
    }, 300);

    // Update meta
    var modeLabels = { daily: i18n.t('ai.mode.daily'), night: i18n.t('ai.mode.night'), distract: i18n.t('ai.mode.distract') };
    document.getElementById('aiMode').textContent = modeLabels[aiMode];
    var now = new Date();
    document.getElementById('aiTime').textContent =
      String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');

    // Add to history
    var time = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    aiHistory.unshift({ time: time, text: text });
    renderAIHistory();
    logAction(i18n.t('log.ai.generate').replace('{mode}', modeLabels[aiMode]));
  }

  function renderAIHistory() {
    var container = document.getElementById('aiHistory');
    var html = '';
    aiHistory.slice(0, 4).forEach(function(item) {
      html += '<div class="ah-item"><span class="ah-time">' + item.time + '</span><span>' + item.text.substring(0, 40) + '...</span></div>';
    });
    container.innerHTML = html;
  }

  function setupAI() {
    document.querySelectorAll('.ai-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.ai-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        aiMode = tab.dataset.mode;
      });
    });
    document.getElementById('aiGenerateBtn').addEventListener('click', generateAI);
    document.getElementById('aiSaveBtn').addEventListener('click', function() {
      logAction(i18n.t('log.ai.save'));
    });
  }

  /* ============================================================
   * COMPANION APP
   * ============================================================ */
  var badges = [
    { name: {'zh-CN':'初次专注','en':'First Focus','ja':'初回集中','ko':'첫 집중'}, icon: '🌱', unlocked: true },
    { name: {'zh-CN':'坚持7天','en':'7-Day Streak','ja':'7日継続','ko':'7일 연속'}, icon: '📅', unlocked: true },
    { name: {'zh-CN':'深度心流','en':'Deep Flow','ja':'深いフロー','ko':'깊은 몰입'}, icon: '🌊', unlocked: true },
    { name: {'zh-CN':'早鸟选手','en':'Early Bird','ja':'朝型選手','ko':'얼리버드'}, icon: '🐦', unlocked: true },
    { name: {'zh-CN':'夜猫英雄','en':'Night Owl Hero','ja':'夜型ヒーロー','ko':'올빼미 영웅'}, icon: '🦉', unlocked: true },
    { name: {'zh-CN':'百分专注','en':'Perfect Focus','ja':'100点集中','ko':'100점 집중'}, icon: '💯', unlocked: true },
    { name: {'zh-CN':'百日坚持','en':'100-Day Streak','ja':'百日継続','ko':'백일 연속'}, icon: '🏆', unlocked: true },
    { name: {'zh-CN':'效率大师','en':'Efficiency Master','ja':'効率マスター','ko':'효율 마스터'}, icon: '⚡', unlocked: true },
    { name: {'zh-CN':'不走神达人','en':'Distraction-Free Pro','ja':'注意散漫ゼロ達人','ko':'디스트랙션 제로 달인'}, icon: '🎯', unlocked: true },
    { name: {'zh-CN':'马拉松选手','en':'Marathon Runner','ja':'マラソンランナー','ko':'마라톤 러너'}, icon: '🏃', unlocked: false },
    { name: {'zh-CN':'连续30天','en':'30-Day Streak','ja':'30日連続','ko':'30일 연속'}, icon: '🔥', unlocked: false },
    { name: {'zh-CN':'深夜守护者','en':'Late Night Guardian','ja':'深夜の守護者','ko':'심야 수호자'}, icon: '🌙', unlocked: false },
    { name: {'zh-CN':'清晨第一人','en':'Early Riser','ja':'早朝一番乗り','ko':'새벽 1인'}, icon: '🌅', unlocked: false },
    { name: {'zh-CN':'专注100小时','en':'100-Hour Focus','ja':'100時間集中','ko':'100시간 집중'}, icon: '⏰', unlocked: false },
    { name: {'zh-CN':'完美一周','en':'Perfect Week','ja':'完璧な一週','ko':'완벽한 일주일'}, icon: '✨', unlocked: false },
    { name: {'zh-CN':'心流大师','en':'Flow Master','ja':'フローマスター','ko':'몰입 마스터'}, icon: '🧘', unlocked: false },
    { name: {'zh-CN':'自律王者','en':'Discipline King','ja':'自律の王','ko':'자율의 왕'}, icon: '👑', unlocked: false },
    { name: {'zh-CN':'不走神30天','en':'30 Days Distraction-Free','ja':'30日注意散漫ゼロ','ko':'30일 디스트랙션 제로'}, icon: '🛡️', unlocked: false },
    { name: {'zh-CN':'早起30天','en':'30-Day Early Riser','ja':'30日早起き','ko':'30일 일찍 기상'}, icon: '⏰', unlocked: false },
    { name: {'zh-CN':'专注365天','en':'365-Day Focus','ja':'365日集中','ko':'365일 집중'}, icon: '🌟', unlocked: false },
    { name: {'zh-CN':'效率之神','en':'Efficiency God','ja':'効率の神','ko':'효율의 신'}, icon: '🌈', unlocked: false },
    { name: {'zh-CN':'万小时定律','en':'10,000 Hours','ja':'1万時間の法則','ko':'만 시간의 법칙'}, icon: '💎', unlocked: false },
    { name: {'zh-CN':'传奇专注者','en':'Legendary Focuser','ja':'伝説の集中家','ko':'전설의 집중러'}, icon: '🎖️', unlocked: false },
    { name: {'zh-CN':'心情喵之友','en':'Mood Meow Friend','ja':'ムードミャオの友','ko':'무드냥의 친구'}, icon: '🐾', unlocked: false },
  ];

  var themes = [
    { name: {'zh-CN':'薰衣草梦境','en':'Lavender Dream','ja':'ラベンダードリーム','ko':'라벤더 드림'}, price: {'zh-CN':'免费','en':'Free','ja':'無料','ko':'무료'}, colors: ['#A78BFA','#8B5CF6'], owned: true },
    { name: {'zh-CN':'蜜桃乌龙','en':'Peach Oolong','ja':'ピーチ烏龍','ko':'피치 우롱'}, price: '¥6', colors: ['#FFB84D','#FF6B9D'], owned: true },
    { name: {'zh-CN':'薄荷森林','en':'Mint Forest','ja':'ミントフォレスト','ko':'민트 포레스트'}, price: '¥6', colors: ['#5EEAD4','#34D399'], owned: false },
    { name: {'zh-CN':'星空银河','en':'Starry Galaxy','ja':'星空ギャラクシー','ko':'별빛 갤럭시'}, price: '¥12', colors: ['#1a1a2e','#8B5CF6'], owned: false },
    { name: {'zh-CN':'草莓牛奶','en':'Strawberry Milk','ja':'苺ミルク','ko':'딸기우유'}, price: '¥6', colors: ['#FF6B9D','#FFB0D0'], owned: false },
    { name: {'zh-CN':'极光之夜','en':'Aurora Night','ja':'オーロラナイト','ko':'오로라 나이트'}, price: '¥12', colors: ['#5EEAD4','#8B5CF6'], owned: false },
  ];

  function renderBadges() {
    var grid = document.getElementById('badgeGrid');
    var html = '';
    badges.forEach(function(b) {
      html += '<div class="badge-item ' + (b.unlocked ? 'unlocked' : 'locked') + '">' +
              '<div class="b-icon">' + (b.unlocked ? b.icon : '🔒') + '</div>' +
              '<div class="b-name">' + tr(b.name) + '</div>' +
              '</div>';
    });
    grid.innerHTML = html;
  }

  function renderThemes() {
    var list = document.getElementById('themeList');
    var html = '';
    themes.forEach(function(t) {
      var gradient = 'linear-gradient(135deg, ' + t.colors[0] + ', ' + t.colors[1] + ')';
      var btnClass = t.owned ? 'owned' : 'buy';
      var btnText = t.owned ? i18n.t('theme.owned') : tr(t.price);
      html += '<div class="theme-card">' +
              '<div class="tc-swatch" style="background:' + gradient + '"></div>' +
              '<div class="tc-info"><div class="tc-name">' + tr(t.name) + '</div>' +
              '<div class="tc-price">' + (t.owned ? i18n.t('theme.owned') : tr(t.price)) + '</div></div>' +
              '<button class="tc-btn ' + btnClass + '">' + btnText + '</button>' +
              '</div>';
    });
    list.innerHTML = html;
  }

  function switchAppScreen(screenName) {
    document.querySelectorAll('.app-screen').forEach(function(s) { s.classList.remove('active'); });
    document.getElementById('screen-' + screenName).classList.add('active');
    document.querySelectorAll('.phone-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.screen === screenName); });
    document.querySelectorAll('.app-feat').forEach(function(f) { f.classList.toggle('active', f.dataset.screen === screenName); });
  }

  function setupApp() {
    // Tab bar clicks
    document.querySelectorAll('.phone-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        switchAppScreen(tab.dataset.screen);
      });
    });
    // Feature list clicks
    document.querySelectorAll('.app-feat').forEach(function(feat) {
      feat.addEventListener('click', function() {
        switchAppScreen(feat.dataset.screen);
      });
    });
    renderBadges();
    renderThemes();
  }

  /* ============================================================
   * PHONE CLOCK
   * ============================================================ */
  function updatePhoneClock() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('phoneClock').textContent = h + ':' + m;
  }

  /* ============================================================
   * EXPRESSION FILTER
   * ============================================================ */
  function setupExprFilter() {
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderGallery(btn.dataset.cat);
      });
    });
  }

  /* ============================================================
   * AUTO EXPRESSION CYCLE (subtle life-like behavior)
   * ============================================================ */
  function startAutoExpressionCycle() {
    var idleExpressions = [10, 15, 23, 12]; // 冷静闭目, 开心笑, 好奇歪头, 美味舔嘴
    var idx = 0;
    setInterval(function() {
      if (!focusTimer.running && currentMode !== 0) {
        // Only cycle in non-focus mode
        renderExpressionOnCat(idleExpressions[idx % idleExpressions.length]);
        idx++;
      }
    }, 8000);
  }

  /* ============================================================
   * INIT
   * ============================================================ */
  function init() {
    // Render initial expression
    renderExpressionOnCat(1); // 专注眯眼
    // Render gallery
    renderGallery('all');
    // Setup interactions
    setupCatInteractions();
    setupExprFilter();
    setupVibration();
    setupAI();
    setupApp();
    // Focus timer
    document.getElementById('focusStartBtn').addEventListener('click', startFocus);
    document.getElementById('focusResetBtn').addEventListener('click', resetFocus);
    updateFocusDisplay();
    updateTimeline();
    // Phone clock
    updatePhoneClock();
    setInterval(updatePhoneClock, 60000);
    // Auto expression cycle for life-like behavior
    startAutoExpressionCycle();
    // Initial log
    setTimeout(function() {
      logAction(i18n.t('log.ready'));
    }, 500);

    // Listen for language changes to re-render dynamic content
    document.addEventListener('languagechange', function(e) {
      // Re-render dynamic content
      renderExpressionOnCat(currentExprId || 1);
      renderGallery(currentFilter || 'all');
      if (typeof currentMode !== 'undefined') {
        var mode = modes[currentMode];
        document.getElementById('modeName').textContent = tr(mode.name);
      }
      updateFocusDisplay();
      updateTimeline();
      renderBadges();
      renderThemes();
      renderAIHistory();
      // Update focus button text
      var startBtn = document.getElementById('focusStartBtn');
      if (startBtn) {
        if (focusTimer.running) {
          startBtn.textContent = i18n.t('focus.btn.pause');
        } else if (focusTimer.remaining < 25 * 60 && focusTimer.remaining > 0) {
          startBtn.textContent = i18n.t('focus.btn.continue');
        } else {
          startBtn.textContent = i18n.t('focus.btn.start');
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
