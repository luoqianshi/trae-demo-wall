const stepConfig = [
  { id: 1, title: "选场景", desc: "根据当前环境匹配风格" },
  { id: 2, title: "选对象&姿势", desc: "按对象筛出最合适模板" },
  { id: 3, title: "拍照指导", desc: "拆解动作、角度和站位" },
  { id: 4, title: "拍后复盘", desc: "按模板化规则给建议" },
];

const scenes = [
  {
    id: "street",
    title: "街拍",
    subtitle: "随性自然",
    accent: "#6575f6",
    cardImage: "SceneStreetCard.webp",
    layoutTip: "人物放在右侧三分线，脚靠近画面底部，前方留出行走方向。",
    cameraTip: "手机降到腰部附近，略微仰拍，使用 1x 或 2x 都可以。",
  },
  {
    id: "cafe",
    title: "咖啡店",
    subtitle: "生活氛围",
    accent: "#9d694f",
    cardImage: "SceneCafeCard.webp",
    layoutTip: "让窗户或桌面形成背景线，人物脸部靠近柔和光源。",
    cameraTip: "相机与桌面保持平行，别从正上方压着拍人。",
  },
  {
    id: "park",
    title: "海边/公园",
    subtitle: "自由明亮",
    accent: "#2eaa98",
    cardImage: "SceneParkCard.webp",
    layoutTip: "天空或草地占三分之一，人物不要卡在背景交界线中间。",
    cameraTip: "退远一点拍全身，保留环境，避免背景线切到头部。",
  },
  {
    id: "architecture",
    title: "楼梯/建筑",
    subtitle: "高级线条",
    accent: "#54658e",
    cardImage: "SceneArchitectureCard.webp",
    layoutTip: "利用楼梯、墙面、柱子做引导线，让线条指向人物。",
    cameraTip: "镜头略低，人物脚贴底边，建筑线保持水平或垂直。",
  },
  {
    id: "mirror",
    title: "镜子自拍",
    subtitle: "日常精致",
    accent: "#8758d4",
    cardImage: "SceneMirrorCard.webp",
    layoutTip: "镜子边框要完整，人物站在镜子一侧，留出穿搭空间。",
    cameraTip: "手机别离脸太近，镜头稍微向下，保持垂直线不歪。",
  },
  {
    id: "travel",
    title: "旅行打卡",
    subtitle: "纪念风景",
    accent: "#ff8b4e",
    cardImage: "SceneTravelCard.webp",
    layoutTip: "地标和人物都要清楚，人物占画面 40%-60%，不要只拍成到此一游。",
    cameraTip: "先找干净背景，再让人物进入画面，地标放在人物侧后方。",
  },
];

const subjects = [
  { id: "woman", title: "单人女生", icon: "SubjectGirlIcon.webp" },
  { id: "man", title: "单人男生", icon: "SubjectBoyIcon.webp" },
  { id: "couple", title: "情侣", icon: "SubjectCoupleIcon.webp" },
  { id: "duo", title: "双人", icon: "SubjectFriendsIcon.webp" },
];

const poseLibrary = {
  woman: [
    {
      id: "look-back",
      title: "回头看镜头",
      tags: ["自然出片", "显瘦"],
      hint: "身体微侧，回头轻笑",
      quickTips: ["身体微侧", "回头轻笑", "手机略低"],
      details: {
        身体: "身体微侧 30 度，肩膀放松，保留一点行走方向。",
        双手: "一只手自然垂落，另一只手可以轻扶包带或整理头发。",
        脚步: "前脚轻轻迈出，脚尖朝画面外侧，重心不要压死。",
        眼神: "回头看镜头，嘴角轻笑，眼神不要太用力。",
        拍摄: "拍摄者站在身后侧方，手机略低，连拍捕捉回头瞬间。",
      },
      steps: ["先站进参考位置", "肩膀朝前，头再慢慢回", "下巴轻收一点", "喊口令连拍回头瞬间"],
      asset: {
        themedStem: "GirlLookBack",
        streetCard: "HomeHeroPhoto.webp",
        streetGuide: "ReferenceLookBackPortrait.webp",
      },
    },
    {
      id: "walk-forward",
      title: "向前走一步",
      tags: ["显腿长", "街拍感"],
      hint: "前脚向前，手机放低",
      quickTips: ["前脚向前", "脚贴底线", "开启连拍"],
      details: {
        身体: "身体朝前自然走，肩颈放松，别刻意挺胸。",
        双手: "双手自然摆动，或一手扶包制造生活感。",
        脚步: "前脚迈向镜头，脚靠近画面底部会更显腿长。",
        眼神: "看镜头旁边一点点，像正在经过街角。",
        拍摄: "手机放到腰部附近，略微仰拍，并开启连拍。",
      },
      steps: ["站进轮廓后再起步", "前脚迈向镜头方向", "手机放低轻微仰拍", "按住连拍挑最自然的一帧"],
      asset: {
        themedStem: "GirlWalkForward",
        streetCard: "PoseWalkForwardCard.webp",
        streetGuide: "PoseWalkForwardPhotoGuide.webp",
      },
    },
    {
      id: "hold-bag",
      title: "扶包歪头",
      tags: ["甜美", "松弛感"],
      hint: "一手扶包，头轻轻偏",
      quickTips: ["扶包带", "头轻偏", "肩膀放松"],
      details: {
        身体: "身体正面微侧，头轻轻偏向一侧，肩膀自然下沉。",
        双手: "一手扶包带，另一只手放在身侧或轻碰头发。",
        脚步: "一脚站稳，另一脚轻点地，避免双脚并排僵硬。",
        眼神: "看镜头，表情甜一点但不要过度用力。",
        拍摄: "镜头保持胸口高度，背景留干净，适合半身和七分身。",
      },
      steps: ["先让包进入画面中心", "头轻轻偏一侧", "肩膀下沉不要耸肩", "拍半身或七分身最稳"],
      asset: {
        themedStem: "GirlHoldBag",
        streetCard: "PoseHoldBagCard.webp",
        streetGuide: "PoseHoldBagPhotoGuide.webp",
      },
    },
    {
      id: "lean-rail",
      title: "靠栏杆侧身",
      tags: ["氛围感", "高级"],
      hint: "肩膀放松，眼神看远处",
      quickTips: ["侧身靠栏", "看向远处", "利用引导线"],
      details: {
        身体: "身体侧向栏杆或边缘结构，重心轻轻靠过去，背不要塌。",
        双手: "一手轻扶支撑物，另一只手自然放松或拿道具。",
        脚步: "靠镜头的腿微微前伸，膝盖放松，脚尖别绷太直。",
        眼神: "看向远处或画面留白方向，情绪更松弛。",
        拍摄: "让栏杆、桌边、镜框或楼梯成为引导线，人物放三分线更高级。",
      },
      steps: ["先找可以借力的边线", "身体只轻靠，不要整个人贴上去", "手部动作尽量轻", "构图时保留线条方向"],
      asset: {
        themedStemByScene: {
          cafe: "GirlLeanCounter",
          architecture: "GirlLeanStairs",
          mirror: "GirlLeanFrame",
          park: "GirlLeanRail",
          travel: "GirlLeanRail",
        },
        streetCard: "PoseLeanRailCard.webp",
        streetGuide: "PoseLeanRailCard.webp",
      },
    },
  ],
  man: [
    {
      id: "man-pocket",
      title: "侧身插兜",
      tags: ["显高", "自然"],
      hint: "身体侧一点，手别太满",
      quickTips: ["侧身 45 度", "前脚靠前", "头顶少留空"],
      details: {
        身体: "身体侧 45 度，重心放后脚，肩颈放松。",
        双手: "靠镜头一侧插兜，另一只手自然下垂或整理外套。",
        脚步: "前脚稍微朝镜头方向探出，腿部线条会更利落。",
        眼神: "看镜头旁边或留白方向，比直勾勾看镜头更松弛。",
        拍摄: "拍摄者蹲低一点，会更显腿长和气场。",
      },
      steps: ["身体先转 45 度", "一只手插兜即可", "肩膀放松不要端着", "镜头略低更显身材比例"],
      asset: {
        themedStem: "ManPocket",
        streetCard: "PoseManPocketCard.webp",
        streetGuide: "PoseManPocketPhotoGuide.webp",
      },
    },
    {
      id: "man-walk-forward",
      title: "自然向前走",
      tags: ["街拍", "轻动态"],
      hint: "往前迈步，按住连拍",
      quickTips: ["向前迈步", "手机放低", "按住连拍"],
      details: {
        身体: "身体朝前自然走，肩颈放松，不要僵硬摆拍。",
        双手: "手臂自然摆动，也可以一只手整理外套下摆。",
        脚步: "靠镜头的脚往前迈，脚靠近画面底部更显腿长。",
        眼神: "看前方或看镜头旁边，像真的经过街角。",
        拍摄: "手机放在腰部附近，略微仰拍，按住连拍。",
      },
      steps: ["先走出半步再拍", "步伐自然不要刻意跨大步", "镜头放低微微仰拍", "多拍几张挑动态最好的一帧"],
      asset: {
        themedStem: "ManWalkForward",
        streetCard: "PoseManWalkForwardCard.webp",
        streetGuide: "PoseManWalkForwardPhotoGuide.webp",
      },
    },
    {
      id: "man-lean-wall",
      title: "靠墙放松站",
      tags: ["氛围", "干净"],
      hint: "借墙线，动作别太满",
      quickTips: ["轻靠墙面", "一脚放松", "利用线条"],
      details: {
        身体: "身体轻靠墙或结构面，背部不要完全塌下去。",
        双手: "一只手自然垂落，另一只手可以轻碰领口或口袋。",
        脚步: "一脚站稳，另一脚微微弯曲，重心看起来更自然。",
        眼神: "看向远处或者墙面延伸方向，画面更有情绪。",
        拍摄: "让墙面、台阶、镜框成为背景几何线条，画面更利落。",
      },
      steps: ["先找到干净的背景面", "身体只轻靠一点", "脚步错开不要平着站", "构图时让线条保持正"],
      asset: {
        themedStemByScene: {
          cafe: "ManLeanCounter",
          architecture: "ManLeanStairs",
          mirror: "ManLeanFrame",
          park: "ManLeanRail",
          travel: "ManLeanWall",
        },
        streetCard: "PoseManLeanWallCard.webp",
        streetGuide: "PoseManLeanWallPhotoGuide.webp",
      },
    },
    {
      id: "man-look-back",
      title: "回头看镜头",
      tags: ["故事感", "耐看"],
      hint: "边走边回头，动作留白",
      quickTips: ["边走边回头", "整理外套", "喊口令拍"],
      details: {
        身体: "边走边回头，肩膀侧一点，动作不要停死。",
        双手: "一只手整理外套或包带，另一只手自然下垂。",
        脚步: "前脚先迈出去，再做回头动作更顺。",
        眼神: "回头看镜头，表情轻松一点，不要太用力。",
        拍摄: "拍摄者站在身后侧方，喊口令的同时连拍。",
      },
      steps: ["身体先往前走", "听到口令再回头", "手部轻微整理衣服", "从后侧方抓拍最自然"],
      asset: {
        themedStem: "ManLookBack",
        streetCard: "PoseManLookBackCard.webp",
        streetGuide: "PoseManLookBackPhotoGuide.webp",
      },
    },
  ],
  couple: [
    {
      id: "couple-hand-walk",
      title: "牵手往前走",
      tags: ["自然甜", "互动感"],
      hint: "两个人靠近，同步向前",
      quickTips: ["牵手靠近", "同步向前", "手机放低"],
      details: {
        身体: "两个人肩膀都朝前，身体微微靠近，中间不要隔太开。",
        双手: "内侧手自然牵住，外侧手放松摆动或拿包。",
        脚步: "一起迈出靠镜头的脚，方向一致比完全同步更重要。",
        眼神: "一起看前方，或者一个看镜头、一个看对方。",
        拍摄: "拍摄者退后半步，手机放低连拍，保留前方留白。",
      },
      steps: ["先让两人站近一点", "从牵手开始慢慢往前走", "拍摄者边退边拍", "连拍里挑互动最自然的一张"],
      asset: {
        themedStem: "CoupleHandWalk",
        streetCard: "PoseCoupleHandWalkCard.webp",
        streetGuide: "PoseCoupleHandWalkPhotoGuide.webp",
      },
    },
    {
      id: "couple-forehead",
      title: "额头轻轻靠",
      tags: ["亲密感", "氛围"],
      hint: "靠近但别用力挤",
      quickTips: ["脸靠近", "手轻扶", "背景干净"],
      details: {
        身体: "两个人面对面站近一点，肩膀自然下沉，不要耸肩。",
        双手: "一方轻扶对方手臂或肩膀，另一方手自然放在身侧。",
        脚步: "脚尖略微朝向彼此，重心靠近但身体不要挤变形。",
        眼神: "闭眼微笑或低头看对方，表情越松越自然。",
        拍摄: "适合半身拍摄，镜头与眼睛同高，背景保持干净。",
      },
      steps: ["两人先靠近站位", "额头轻轻碰一下即可", "手只做轻微辅助", "半身构图最稳定"],
      asset: {
        themedStem: "CoupleForehead",
        streetCard: "PoseCoupleForeheadCard.webp",
        streetGuide: "PoseCoupleForeheadPhotoGuide.webp",
      },
    },
    {
      id: "couple-look-back",
      title: "一起回头笑",
      tags: ["互动感", "故事性"],
      hint: "身体往前，听口令回头",
      quickTips: ["一起回头", "轻轻笑", "身后侧拍"],
      details: {
        身体: "两个人身体都朝前走，肩膀侧向镜头 30 度。",
        双手: "可以牵手，也可以一个人扶对方手臂制造互动。",
        脚步: "前脚迈出，脚靠近画面底部，身体保持同一方向。",
        眼神: "一起回头看镜头，笑得轻一点，不要用力瞪镜头。",
        拍摄: "拍摄者站在身后侧方，喊一声再连拍回头瞬间。",
      },
      steps: ["先开始往前走", "听到口令同时回头", "两个人动作不要完全一样", "从后侧方拍故事感更强"],
      asset: {
        themedStem: "CoupleLookBack",
        streetCard: "PoseCoupleLookBackCard.webp",
        streetGuide: "PoseCoupleLookBackPhotoGuide.webp",
      },
    },
    {
      id: "couple-shoulder",
      title: "并肩靠近站",
      tags: ["日常感", "不尴尬"],
      hint: "一人前半步，层次更好",
      quickTips: ["靠近站", "前后错开", "七分身"],
      details: {
        身体: "两个人并肩站，一人稍微靠前半步，画面更有层次。",
        双手: "内侧手可以轻靠对方背后或牵手，外侧手自然放松。",
        脚步: "一前一后错开站，不要双脚完全并排。",
        眼神: "一起看镜头，或一个看镜头、一个看对方。",
        拍摄: "适合七分身构图，让两个人都贴近画面中线。",
      },
      steps: ["先并肩靠近站稳", "一人前半步制造层次", "手部做轻互动", "七分身比全身更不容易乱"],
      asset: {
        themedStem: "CoupleShoulder",
        streetCard: "PoseCoupleShoulderCard.webp",
        streetGuide: "PoseCoupleShoulderPhotoGuide.webp",
      },
    },
  ],
  duo: [
    {
      id: "duo-side-walk",
      title: "并排往前走",
      tags: ["姐妹感", "轻动态"],
      hint: "方向一致，别走成一条直线",
      quickTips: ["并排靠近", "步伐同向", "手机略低"],
      details: {
        身体: "两个人并排往前，肩膀靠近但不要紧贴。",
        双手: "可以挽手、搭手臂，或者一个人扶包制造变化。",
        脚步: "一起往前走，步子不用完全同步，但要同方向。",
        眼神: "看前方或互看都可以，重点是放松。",
        拍摄: "镜头略低，按住连拍，选脚步和表情最自然的一张。",
      },
      steps: ["先靠近并排站", "一起往前走一小段", "互动动作不要太多", "连续拍摄更容易出片"],
      asset: {
        themedStem: "DuoSideWalk",
        streetCard: "PoseDuoSideWalkCard.webp",
        streetGuide: "PoseDuoSideWalkPhotoGuide.webp",
      },
    },
    {
      id: "duo-back-to-back",
      title: "背靠背站",
      tags: ["酷感", "简洁"],
      hint: "背轻靠，脚步错开",
      quickTips: ["轻轻靠", "脚步错开", "拍七分身"],
      details: {
        身体: "两个人背轻轻靠住，肩膀放松，不要挺得过直。",
        双手: "手自然下垂或一人插兜，一人扶手臂，形成差异。",
        脚步: "脚步错开，画面看起来更不僵硬。",
        眼神: "一个看镜头，一个看侧边，会更有层次。",
        拍摄: "七分身最稳，既能交代姿态，也不会太空。",
      },
      steps: ["两人先背靠轻贴", "脚步前后错开", "一个看镜头一个看侧边", "保持画面中线稳定"],
      asset: {
        themedStem: "DuoBackToBack",
        streetCard: "PoseDuoBackToBackCard.webp",
        streetGuide: "PoseDuoBackToBackPhotoGuide.webp",
      },
    },
    {
      id: "duo-staggered",
      title: "一前一后站",
      tags: ["层次感", "耐看"],
      hint: "前后错位，内侧手互动",
      quickTips: ["一前一后", "肩膀错开", "两人都入框"],
      details: {
        身体: "一人前一人后，肩膀错开，让层次自然形成。",
        双手: "内侧手可以轻搭肩或扶背，外侧手放松。",
        脚步: "前面的人站稳，后面的人稍微偏半步，不要完全挡住。",
        眼神: "一个看镜头，一个看对方或侧前方，画面更活。",
        拍摄: "适合七分身，让两个人都完整入框。",
      },
      steps: ["先确定前后站位", "后面的人稍微偏一点", "手部做轻微互动", "注意不要互相遮挡脸部"],
      asset: {
        themedStem: "DuoStaggered",
        streetCard: "PoseDuoStaggeredCard.webp",
        streetGuide: "PoseDuoStaggeredPhotoGuide.webp",
      },
    },
    {
      id: "duo-look-back",
      title: "一起回头看",
      tags: ["故事感", "抓拍感"],
      hint: "先走，再一起回头",
      quickTips: ["一起回头", "身后侧拍", "轻轻笑"],
      details: {
        身体: "两个人身体都朝前走，回头动作同时发生。",
        双手: "可以挽手，也可以保持自然摆动，让动作更像抓拍。",
        脚步: "脚步方向一致，靠镜头的脚往前更好看。",
        眼神: "听到口令一起回头，眼神轻松，笑意不要太满。",
        拍摄: "拍摄者站在后侧方，连拍捕捉最自然的回头瞬间。",
      },
      steps: ["先开始往前走", "口令一到再回头", "手部维持自然摆动", "多拍几张挑最自然的回头"],
      asset: {
        themedStem: "DuoLookBack",
        streetCard: "PoseDuoLookBackCard.webp",
        streetGuide: "PoseDuoLookBackPhotoGuide.webp",
      },
    },
  ],
};

const state = {
  currentStep: 1,
  sceneId: "street",
  subjectId: "woman",
  poseId: "look-back",
  reviewSeed: 1,
};

const dom = {
  stepper: document.querySelector("#stepper"),
  sceneGrid: document.querySelector("#scene-grid"),
  subjectTabs: document.querySelector("#subject-tabs"),
  poseGrid: document.querySelector("#pose-grid"),
  detailList: document.querySelector("#detail-list"),
  stepList: document.querySelector("#step-list"),
  quickTips: document.querySelector("#quick-tips"),
  guideImage: document.querySelector("#guide-image"),
  guideTitle: document.querySelector("#guide-title"),
  guideHint: document.querySelector("#guide-hint"),
  poseThumb: document.querySelector("#pose-thumb"),
  poseTitle: document.querySelector("#pose-title"),
  poseTags: document.querySelector("#pose-tags"),
  selectedSceneBadge: document.querySelector("#selected-scene-badge"),
  sceneTipBadge: document.querySelector("#scene-tip-badge"),
  subjectSummary: document.querySelector("#subject-summary"),
  scoreList: document.querySelector("#score-list"),
  totalScore: document.querySelector("#total-score"),
};

function getScene() {
  return scenes.find((scene) => scene.id === state.sceneId) || scenes[0];
}

function getSubject() {
  return subjects.find((subject) => subject.id === state.subjectId) || subjects[0];
}

function getPoseList() {
  return poseLibrary[state.subjectId] || poseLibrary.woman;
}

function getPose() {
  return getPoseList().find((pose) => pose.id === state.poseId) || getPoseList()[0];
}

function assetPath(fileName) {
  return `./assets/ios/${fileName}`;
}

function getThemedPrefix(sceneId) {
  switch (sceneId) {
    case "cafe":
      return "PoseCafe";
    case "park":
      return "PosePark";
    case "architecture":
      return "PoseArchitecture";
    case "mirror":
      return "PoseMirror";
    case "travel":
      return "PoseTravel";
    default:
      return "";
  }
}

function resolveStem(pose, sceneId) {
  if (pose.asset.themedStemByScene) {
    return pose.asset.themedStemByScene[sceneId] || pose.asset.themedStemByScene.travel;
  }

  return pose.asset.themedStem;
}

function getPoseCardImage(pose, sceneId) {
  if (sceneId === "street") {
    return pose.asset.streetCard;
  }

  return `${getThemedPrefix(sceneId)}${resolveStem(pose, sceneId)}Card.webp`;
}

function getPoseGuideImage(pose, sceneId) {
  if (sceneId === "street") {
    return pose.asset.streetGuide || pose.asset.streetCard;
  }

  return `${getThemedPrefix(sceneId)}${resolveStem(pose, sceneId)}PhotoGuide.webp`;
}

function ensurePoseExists() {
  const list = getPoseList();
  if (!list.some((item) => item.id === state.poseId)) {
    state.poseId = list[0].id;
  }
}

function renderStepper() {
  dom.stepper.innerHTML = stepConfig
    .map(
      (step) => `
        <div class="step-item ${step.id === state.currentStep ? "is-active" : ""}">
          <div class="step-no">${step.id}</div>
          <p class="step-title">${step.title}</p>
          <p class="step-desc">${step.desc}</p>
        </div>
      `
    )
    .join("");
}

function renderScenes() {
  dom.sceneGrid.innerHTML = scenes
    .map(
      (scene) => `
        <button class="scene-card ${scene.id === state.sceneId ? "is-selected" : ""}" data-scene-id="${scene.id}" type="button">
          <img class="scene-cover" src="${assetPath(scene.cardImage)}" alt="${scene.title}" />
        </button>
      `
    )
    .join("");
}

function renderSubjects() {
  dom.subjectTabs.innerHTML = subjects
    .map(
      (subject) => `
        <button class="subject-tab ${subject.id === state.subjectId ? "is-selected" : ""}" data-subject-id="${subject.id}" type="button">
          <img src="${assetPath(subject.icon)}" alt="${subject.title}" />
          <span>${subject.title}</span>
        </button>
      `
    )
    .join("");
}

function renderPoses() {
  const list = getPoseList();
  const scene = getScene();

  dom.poseGrid.innerHTML = list
    .map((pose) => {
      const image = assetPath(getPoseCardImage(pose, scene.id));
      return `
        <button class="pose-card ${pose.id === state.poseId ? "is-selected" : ""}" data-pose-id="${pose.id}" type="button">
          <img src="${image}" alt="${pose.title}" />
          <div class="pose-copy">
            <h4>${pose.title}</h4>
            <p>${pose.hint}</p>
            <div class="tag-row">
              ${pose.tags.map((tag) => `<span class="quick-chip">${tag}</span>`).join("")}
            </div>
          </div>
        </button>
      `;
    })
    .join("");
}

function renderGuide() {
  const scene = getScene();
  const subject = getSubject();
  const pose = getPose();
  const cardImage = assetPath(getPoseCardImage(pose, scene.id));
  const guideImage = assetPath(getPoseGuideImage(pose, scene.id));

  dom.selectedSceneBadge.textContent = `${scene.title} · ${subject.title} · ${pose.title}`;
  dom.sceneTipBadge.textContent = `${scene.title} 场景优先强调 ${scene.layoutTip.slice(0, 10)}...`;
  dom.subjectSummary.textContent = `当前对象：${subject.title}`;
  dom.guideTitle.textContent = pose.title;
  dom.guideHint.textContent = pose.hint;
  dom.poseThumb.src = cardImage;
  dom.poseThumb.alt = `${pose.title} 卡片`;
  dom.guideImage.src = guideImage;
  dom.guideImage.alt = `${pose.title} 引导图`;
  dom.guideImage.onerror = () => {
    dom.guideImage.src = cardImage;
  };
  dom.poseTitle.textContent = pose.title;
  dom.poseTags.textContent = `${scene.title} · ${subject.title} · ${pose.tags.join(" / ")}`;

  dom.detailList.innerHTML = Object.entries(pose.details)
    .map(
      ([key, value]) => `
        <dt>${key}</dt>
        <dd>${value}</dd>
      `
    )
    .join("");

  dom.stepList.innerHTML = pose.steps.map((item) => `<li>${item}</li>`).join("");
  dom.quickTips.innerHTML = pose.quickTips.map((item) => `<span class="quick-chip">${item}</span>`).join("");
}

function hashScore(seedBase, offset, min, max) {
  const range = max - min + 1;
  const raw = Math.abs(Math.sin(seedBase * (offset + 1) * 11.17) * 1000);
  return min + (Math.floor(raw) % range);
}

function buildScores() {
  const scene = getScene();
  const pose = getPose();
  const seedBase = scene.id.length * 7 + pose.id.length * 13 + state.reviewSeed * 17;

  return [
    {
      title: "构图",
      score: hashScore(seedBase, 1, 4, 5),
      suggestion: scene.layoutTip,
    },
    {
      title: "姿势",
      score: hashScore(seedBase, 2, 3, 5),
      suggestion: `保持「${pose.title}」的身体方向，手部动作再放松一点会更自然。`,
    },
    {
      title: "镜头",
      score: hashScore(seedBase, 3, 3, 5),
      suggestion: scene.cameraTip,
    },
    {
      title: "氛围",
      score: hashScore(seedBase, 4, 4, 5),
      suggestion: pose.details.拍摄,
    },
  ];
}

function renderReview() {
  const scores = buildScores();
  const total = Math.round((scores.reduce((sum, item) => sum + item.score, 0) / (scores.length * 5)) * 100);

  dom.totalScore.textContent = String(total);
  dom.scoreList.innerHTML = scores
    .map((item) => {
      const stars = `${"★".repeat(item.score)}${"☆".repeat(5 - item.score)}`;
      return `
        <article class="score-item">
          <div class="score-row">
            <strong>${item.title}</strong>
            <span class="score-stars">${stars}</span>
          </div>
          <div>${item.suggestion}</div>
        </article>
      `;
    })
    .join("");
}

function renderAll() {
  ensurePoseExists();
  renderStepper();
  renderScenes();
  renderSubjects();
  renderPoses();
  renderGuide();
  renderReview();
}

function setStep(step) {
  state.currentStep = step;
  renderStepper();
}

function scrollToId(id) {
  const target = id === "top" ? document.body : document.getElementById(id);
  if (!target) return;

  const top = id === "top" ? 0 : target.getBoundingClientRect().top + window.scrollY - 18;
  window.scrollTo({ top, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const sceneButton = event.target.closest("[data-scene-id]");
  if (sceneButton) {
    state.sceneId = sceneButton.dataset.sceneId;
    setStep(1);
    renderAll();
    return;
  }

  const subjectButton = event.target.closest("[data-subject-id]");
  if (subjectButton) {
    state.subjectId = subjectButton.dataset.subjectId;
    state.poseId = getPoseList()[0].id;
    setStep(2);
    renderAll();
    return;
  }

  const poseButton = event.target.closest("[data-pose-id]");
  if (poseButton) {
    state.poseId = poseButton.dataset.poseId;
    setStep(3);
    renderAll();
    scrollToId("guide-section");
    return;
  }

  const navButton = event.target.closest("[data-scroll-target]");
  if (navButton) {
    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.classList.toggle("active", button === navButton);
    });
    scrollToId(navButton.dataset.scrollTarget);
  }
});

document.querySelector("#start-experience").addEventListener("click", () => {
  setStep(1);
  scrollToId("experience");
});

document.querySelector("#jump-guide").addEventListener("click", () => {
  setStep(3);
  scrollToId("guide-section");
});

document.querySelector("#jump-review").addEventListener("click", () => {
  setStep(4);
  scrollToId("review-section");
});

document.querySelector("#refresh-review").addEventListener("click", () => {
  state.reviewSeed += 1;
  setStep(4);
  renderReview();
});

renderAll();
