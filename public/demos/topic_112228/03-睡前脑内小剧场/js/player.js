/* ========================================
   播放器页面脚本
   ======================================== */

let isPlaying = false
let playInterval = null
let currentStyle = '童话'
let speechUtterance = null
let speechRate = 0.85
let speechPitch = 1.0
let speechVoice = null
let availableVoices = []
let totalChars = 0
let readChars = 0
let playStartTime = 0
let totalDuration = 300

const sampleStories = [
  { title: '周一加班后的便利店', style: '治愈', icon: '🏪', preview: '便利店阿姨多送了一根烤肠...', day: 30, mon: '6月' },
  { title: '雨中的共享雨伞', style: '童话', icon: '☂️', preview: '陌生人借给我的那把蓝色雨伞...', day: 29, mon: '6月' },
  { title: '窗台上的多肉开花了', style: '自然', icon: '🌱', preview: '养了三个月的小惊喜...', day: 28, mon: '6月' },
  { title: '地铁上让座的小女孩', style: '治愈', icon: '👧', preview: '那个扎羊角辫的甜甜笑容...', day: 27, mon: '6月' }
]

document.addEventListener('DOMContentLoaded', () => {
  if (!App.requireLogin()) return

  initParticles()
  initCursorGlow()
  initInput()
  initVoices()
  loadDiary()

  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = initVoices
  }
})

function initVoices() {
  if (!window.speechSynthesis) return
  availableVoices = window.speechSynthesis.getVoices()
  const chineseVoice = availableVoices.find(v => v.lang.startsWith('zh') || v.lang.includes('CN'))
  if (chineseVoice) {
    speechVoice = chineseVoice
  }
}

function initInput() {
  const input = document.getElementById('storyInput')
  const charCount = document.getElementById('charCount')
  input.addEventListener('input', () => {
    charCount.textContent = input.value.length
  })
}

function selectStyle(el) {
  document.querySelectorAll('.style-card').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
  currentStyle = el.dataset.style
}

function selectTimer(el) {
  document.querySelectorAll('.timer-chip').forEach(c => c.classList.remove('active'))
  el.classList.add('active')
}

function goPage(id) {
  if (isPlaying && id !== 'page-player') {
    stopSpeech()
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.getElementById(id).classList.add('active')
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'))
  const map = { 'page-home': 0, 'page-player': 1, 'page-diary': 2 }
  if (map[id] !== undefined) {
    document.querySelectorAll('.tab-item')[map[id]].classList.add('active')
  }
}

function goHome() {
  stopSpeech()
  window.location.href = '../index.html'
}

function generateStory() {
  const input = document.getElementById('storyInput')
  const text = input.value.trim()
  if (!text) {
    alert('请输入今天发生的一件小事~')
    return
  }

  goPage('page-gen')
  let w = 0
  const steps = ['构思故事大纲...', '提取今日情绪关键词...', '润色叙事与节奏...', '生成舒缓背景音...']
  const bar = document.getElementById('gen-progress')
  const status = document.getElementById('gen-status')
  let i = 0
  const iv = setInterval(() => {
    w += 25
    bar.style.width = w + '%'
    if (i < steps.length) {
      status.textContent = steps[i]
      i++
    }
    if (w >= 100) {
      clearInterval(iv)
      setTimeout(() => {
        updatePlayerContent(text)
        goPage('page-player')
      }, 600)
    }
  }, 600)
}

function generateStoryText(inputText) {
  const styleTexts = {
    '童话': `
      <p>在云朵上面，有一个只有巴掌大的小王国，叫做"瞌睡镇"。镇上的居民都是小拇指那么大的精灵，他们每天的工作，就是收集人类白天的故事，纺成梦的丝线。</p>
      <p>今天，瞌睡镇的纺梦师小洛翻到了你的那一页日记。她歪着头读了好几遍："${inputText}……嗯，这个故事有意思。"</p>
      <p>小洛从柜子里翻出一把月光织成的纺锤，开始纺线。她一边纺，一边嘟囔："这里要加一点勇敢，那里要加一点糖……对了，结局要软软的，像棉花糖一样。"</p>
      <p>纺着纺着，隔壁的老蟾蜍阿吉探进头来："小洛，又在加班呀？""嘘——"小洛压低声音，"这根线要送给一个今晚很累的人，得仔细点。"</p>
      <p>阿吉点点头，慢吞吞地从口袋里掏出一把星星碎片，撒在丝线上。"加了这个，梦境会有薄荷味的清凉。"丝线瞬间亮了起来，变成了一条银色的小河。</p>
      <p>小洛把纺好的梦装进一个萤火虫灯笼里，交给了风。风"呼"地一下，把灯笼吹向了你的方向。穿过云层，穿过星光，穿过城市的灯火，最后，轻轻地，落在了你的枕头边。</p>
      <p>灯笼打开了。银色的丝线绕着你转了一圈，然后慢慢变成了一层柔软的光，像被子一样盖在你身上。</p>
      <p>小洛在云朵上打了个哈欠，趴在纺车旁边睡着了。阿吉给她盖了一片云彩当被子，小声说："晚安，小洛。晚安，远方的人。"</p>
    `,
    '白噪音': `
      <p>你有没有想过，每一滴雨落下来的时候，都在说一句话？只是它们说话太快了，我们听不清。</p>
      <p>今晚，雨下得格外慢。好像它们知道，有人在等一句睡前的话。</p>
      <p>第一滴雨落在窗台上，它说："${inputText}"——哦，原来今天你经历了这样的事。雨滴想了想，又加了一句："没关系，明天又是新的。"</p>
      <p>第二滴雨追了上来，落在第一滴旁边。它什么也没说，只是轻轻拍了拍第一滴的肩膀。两滴雨汇在一起，变成了一条细细的小溪，顺着窗台往下流。</p>
      <p>第三滴、第四滴、第五滴……越来越多的雨落下来。它们互相讲着今天各自看到的故事。有的雨从大海那边飞来，带着咸咸的风的味道；有的雨从森林里来，叶子上还粘着一只打盹的蜗牛。</p>
      <p>远处，海浪一下一下地拍着岸。那是大海在呼吸，一呼一吸，很慢很慢。海浪其实是雨的故乡，所有的雨最终都要回到海里去。</p>
      <p>雨声渐渐变得密了，像一层厚厚的毯子，把城市裹了起来。窗外的灯光变得模糊，像是水彩画化开了一样。</p>
      <p>你听到雨声变成了一个声音，很远又很近，像是在耳边轻轻说："睡吧，今天的事，交给我们了。我们帮你把它变成明天的露水。"</p>
      <p>雨还在下，越来越轻，越来越慢。像是整个世界，都和你一起，慢慢睡着了。</p>
    `,
    '科幻': `
      <p>飞船日志，星际历2847年，船员编号007——也就是你——的个人记录。</p>
      <p>今天的航行异常平静。在穿过半人马座星云的时候，你做了一件事：${inputText}。AI助手"小星"把这件事记录了下来，还难得地发表了一句评论："根据我的数据库，这是本航段最有人情味的一条记录。"</p>
      <p>你笑了。在太空里待久了，"人情味"这个词反而变得珍贵起来。</p>
      <p>小星突然把灯光调暗了一点。"检测到船员心率下降，建议进入休息模式。要不要我讲个故事？"</p>
      <p>"你还会讲故事？""我学了三万年的故事。"小星的声音变得很温柔，"很久以前，在地球还是蓝色的时候，有一个古老的传说……"</p>
      <p>小星讲了一个关于大海的故事。它说大海里有一种生物叫鲸鱼，它们在深海里唱歌，歌声能穿过整个海洋。鲸鱼的一生只唱一首歌，但那首歌可以持续几十年。</p>
      <p>"后来呢？"你问。"后来……鲸鱼学会了把歌传给下一代。一条鲸鱼把歌教给另一条，传了一百年，两百年。有些歌到现在还在海里游荡，只是没有人听了。"</p>
      <p>你看着舷窗外。星云像一条发光的河流，缓缓地从飞船旁边流过去。那些星星，有些已经死了几亿年，但它们的光还在宇宙里旅行，像鲸鱼的歌一样。</p>
      <p>小星把冬眠舱的温度调高了0.3度。"晚安，007。我把你今天的记录，编进了一首歌里。等我们到达新世界的时候，放给你听。"</p>
      <p>你闭上眼睛，在星辰大海中，慢慢沉入了冬眠。飞船继续向前飞着，安静地，像一条在深海里歌唱的鲸鱼。</p>
    `,
    '自然': `
      <p>今天的森林，来了一位不速之客——是一只迷路的小鹿，身上还带着露水的味道。</p>
      <p>它踩着小碎步，从灌木丛里探出头来，正好撞见了今天的事：${inputText}。小鹿歪着头看了你一眼，又赶紧缩了回去，只露出两只毛茸茸的耳朵。</p>
      <p>森林里的老橡树看见了这一幕，沙沙地笑了。"别怕，"老橡树用风一样的声音说，"这个人不会伤害你的。"</p>
      <p>小鹿犹豫了一下，又探出头。这次它胆子大了些，往前走了两步，鼻子里呼出的气在冷空气中变成了一小团白雾。</p>
      <p>这时候，头顶传来一阵窸窸窣窣的声音。原来是一只松鼠，正抱着一颗橡果从树洞里探出头来。"喂，"松鼠小声喊，"你那颗橡果是不是从我仓库里偷的？"</p>
      <p>小鹿无辜地摇了摇头。松鼠嘟囔了一句"可疑"，又缩回去了。老橡树又笑了，树枝上的积雪被抖落了一些，"簌簌"地掉在小鹿头上。小鹿抖了抖耳朵，一脸嫌弃。</p>
      <p>远处的溪流在石头间唱着歌，一只翠鸟"嗖"地掠过水面，叼走了一条小鱼。天边的云变成了粉色和橙色，太阳正在森林背后慢慢沉下去。</p>
      <p>小鹿在老橡树下蜷起身子，把头埋进前腿里。松鼠也抱着橡果睡着了。老橡树轻轻摇了摇树枝，像是在说："都睡吧，我守着你们。"</p>
      <p>月光洒下来，给森林盖了一层银色的薄被。溪流的声音越来越轻，像是也在哄自己入睡。一切都安静了下来，只剩风在树叶间低低地哼着歌。</p>
      <p>晚安，森林。晚安，远方的人。</p>
    `,
    '悬疑': `
      <p>这是一个只有十二秒的故事。而你，恰好有十二秒的时间来听完它。</p>
      <p>第一秒：你合上日记本，上面写着今天的事——${inputText}。你觉得有什么地方不对劲，但说不上来。</p>
      <p>第二秒：你发现窗台上多了一样东西。一只纸折的千纸鹤。你不记得自己折过。</p>
      <p>第三秒：你拿起来，翻到背面，上面有一行小字，写着——"别回头。"</p>
      <p>第四秒：你当然会回头。但身后什么也没有，只有窗帘被风吹起来了一角。</p>
      <p>第五秒：你又看向千纸鹤。字迹变了。现在写的是——"我说了别回头。"</p>
      <p>第六秒：你开始觉得好笑。这一定是有人在开玩笑。你把千纸鹤放在枕头边，准备睡觉。</p>
      <p>第七秒：灯灭了。不是停电，是千纸鹤自己……把灯关了？你听见翅膀扇动的声音。一只纸做的鹤，在你房间里飞。</p>
      <p>第八秒：千纸鹤落在你肩膀上，很轻，像一片雪。它在你耳边小声说："别怕。我是来替你守夜的。"</p>
      <p>第九秒："有些秘密白天不能说，"千纸鹤的声音很温柔，"所以我只能晚上来。今天的那些事，我都帮你收走了。它们现在在我的翅膀里，折成了很小很小的纸条。"</p>
      <p>第十秒："明天早上你醒来的时候，我会变成一只普通的纸鹤。但今晚，我替你看着。"</p>
      <p>第十一秒：你感觉到肩膀上的重量消失了。千纸鹤飞到了窗台上，面朝窗外站着，像一个站岗的士兵。</p>
      <p>第十二秒：你闭上眼睛。房间里很安静，但你知道有什么东西在守着你。那些白天解不开的谜题，今晚不用想了。有人替你看着呢。</p>
      <p>……好了，十二秒到了。故事讲完了。你可以睡了。晚安。</p>
    `,
    '治愈': `
      <p>今天这个故事的主角，是你。但不是白天的那个你——那个赶地铁、回消息、对着电脑屏幕叹气的你。是晚上的你。卸了妆、换了睡衣、窝在被子里，只想听个人说说话的你。</p>
      <p>今天你经历了一件事：${inputText}。你可能觉得这不算什么大事，但我想认真地告诉你——它很重要。</p>
      <p>你知道为什么吗？因为在宇宙138亿年的时间里，在地球46亿年的时间里，在你这几十年的人生里，这件事只发生过这一次。只有你，在这个时间，这个地点，经历了它。</p>
      <p>所以我想把它好好收起来。就像小时候收集糖纸一样，把它展平，夹在日记本里。</p>
      <p>我想起了一个故事。有一个人每天往罐子里丢一颗豆子，开心的事丢白色，难过的事丢黑色。到了年底倒出来数，发现白色的总是比黑色的多。</p>
      <p>不是因为开心的事真的比较多，而是因为，那些当时觉得难过的事，后来想想，好像也没那么糟。有些黑豆放久了，竟然慢慢变成了白色。</p>
      <p>今天这件事，你以后想起来，可能会笑，可能会叹气，也可能会想不起来。但没关系。它今天真实地发生了，被你真实地感受到了，这就够了。</p>
      <p>好了，把今天叠好，放在枕头边吧。深呼吸——吸气，一二三。呼气，一二三。肩膀放松下来。手臂沉下去。眼睛……慢慢闭上。</p>
      <p>你知道吗，在你听这个故事的时候，全世界有几百万人也在听故事、也在慢慢入睡。你们互不认识，但此刻，你们一起在做同一件事——好好休息。</p>
      <p>你今天做得很好了。真的。明天的事，交给明天的你吧。今晚，你只需要做一件事——好好睡一觉。</p>
      <p>晚安。</p>
    `
  }
  return styleTexts[currentStyle] || styleTexts['治愈']
}

function updatePlayerContent(inputText) {
  const titleEl = document.getElementById('playerTitle')
  const subEl = document.getElementById('playerSub')
  const iconEl = document.getElementById('coverIcon')
  const textEl = document.getElementById('storyText')

  const styleIcons = {
    '童话': '🧚',
    '白噪音': '🌊',
    '科幻': '🚀',
    '自然': '🏔️',
    '悬疑': '🎭',
    '治愈': '💖'
  }

  const shortTitle = inputText.length > 10 ? inputText.substring(0, 10) + '...' : inputText
  titleEl.textContent = shortTitle
  subEl.textContent = currentStyle + '风格 · 5 分钟'
  iconEl.textContent = styleIcons[currentStyle] || '🌙'

  const storyHtml = generateStoryText(inputText)
  textEl.innerHTML = storyHtml

  const plainText = textEl.textContent.replace(/\s+/g, '')
  totalChars = plainText.length
  totalDuration = Math.max(180, Math.floor(totalChars / speechRate / 4))
  readChars = 0

  const bar = document.getElementById('playProgress')
  bar.style.width = '0%'
  document.getElementById('currentTime').textContent = '00:00'
  isPlaying = false
  document.getElementById('playBtn').textContent = '▶'
}

function togglePlay() {
  const btn = document.getElementById('playBtn')

  if (isPlaying) {
    pauseSpeech()
  } else {
    startSpeech()
  }
}

function startSpeech() {
  const textEl = document.getElementById('storyText')
  const fullText = textEl.textContent.trim()

  if (!fullText) return

  if (!window.speechSynthesis) {
    alert('您的浏览器不支持语音朗读功能')
    return
  }

  if (speechUtterance && window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
    isPlaying = true
    document.getElementById('playBtn').textContent = '⏸'
    startProgressSync()
    return
  }

  window.speechSynthesis.cancel()

  speechUtterance = new SpeechSynthesisUtterance(fullText)
  if (speechVoice) speechUtterance.voice = speechVoice
  speechUtterance.rate = speechRate
  speechUtterance.pitch = speechPitch
  speechUtterance.lang = 'zh-CN'

  speechUtterance.onstart = () => {
    isPlaying = true
    document.getElementById('playBtn').textContent = '⏸'
    playStartTime = Date.now()
    startProgressSync()
  }

  speechUtterance.onend = () => {
    isPlaying = false
    document.getElementById('playBtn').textContent = '▶'
    stopProgressSync()
    const bar = document.getElementById('playProgress')
    bar.style.width = '100%'
    document.getElementById('currentTime').textContent = formatTime(totalDuration)
    readChars = totalChars
  }

  speechUtterance.onerror = () => {
    isPlaying = false
    document.getElementById('playBtn').textContent = '▶'
    stopProgressSync()
  }

  window.speechSynthesis.speak(speechUtterance)
}

function pauseSpeech() {
  if (window.speechSynthesis && speechUtterance) {
    window.speechSynthesis.pause()
    isPlaying = false
    document.getElementById('playBtn').textContent = '▶'
    stopProgressSync()
  }
}

function stopSpeech() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
  isPlaying = false
  speechUtterance = null
  stopProgressSync()
}

function startProgressSync() {
  stopProgressSync()
  playInterval = setInterval(() => {
    if (!isPlaying) return
    const elapsed = (Date.now() - playStartTime + (readChars / totalChars) * totalDuration * 1000) / 1000
    const progress = Math.min(100, (elapsed / totalDuration) * 100)
    const bar = document.getElementById('playProgress')
    bar.style.width = progress + '%'
    document.getElementById('currentTime').textContent = formatTime(Math.floor(elapsed))
  }, 500)
}

function stopProgressSync() {
  if (playInterval) {
    clearInterval(playInterval)
    playInterval = null
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function setSpeechRate(rate) {
  speechRate = rate
  document.querySelectorAll('.rate-chip').forEach(chip => {
    chip.classList.remove('active')
    const chipRate = parseFloat(chip.getAttribute('onclick').match(/\d+(\.\d+)?/)[0])
    if (Math.abs(chipRate - rate) < 0.01) {
      chip.classList.add('active')
    }
  })
  if (isPlaying && window.speechSynthesis) {
    stopSpeech()
    startSpeech()
  }
}

function saveToDiary() {
  stopSpeech()
  const title = document.getElementById('playerTitle').textContent
  const style = currentStyle
  const preview = document.querySelector('.story-text p').textContent.substring(0, 30) + '...'

  const today = new Date()
  const story = {
    title,
    style,
    preview,
    icon: '🌙',
    day: today.getDate(),
    mon: (today.getMonth() + 1) + '月',
    savedAt: Date.now()
  }

  const saved = JSON.parse(localStorage.getItem('sleep_theater_diary') || '[]')
  saved.unshift(story)
  localStorage.setItem('sleep_theater_diary', JSON.stringify(saved))

  alert('已保存到故事日记！')
  loadDiary()
}

function loadDiary() {
  const listEl = document.getElementById('diaryList')
  const saved = JSON.parse(localStorage.getItem('sleep_theater_diary') || '[]')
  const allStories = [...saved, ...sampleStories.slice(0, 4 - saved.length)]

  listEl.innerHTML = allStories.map((s, i) => `
    <div class="diary-item" onclick="playFromDiary(${i})">
      <div class="diary-date">
        <div class="d-day">${s.day}</div>
        <div class="d-mon">${s.mon}</div>
      </div>
      <div class="diary-info">
        <div class="diary-title">${s.title}</div>
        <div class="diary-preview">${s.style} · ${s.preview}</div>
      </div>
      <div class="diary-play">▶</div>
    </div>
  `).join('')
}

function playFromDiary(index) {
  const saved = JSON.parse(localStorage.getItem('sleep_theater_diary') || '[]')
  const allStories = [...saved, ...sampleStories.slice(0, 4 - saved.length)]
  const story = allStories[index]
  if (!story) return

  currentStyle = story.style
  document.getElementById('playerTitle').textContent = story.title
  document.getElementById('playerSub').textContent = story.style + '风格 · 5 分钟'
  document.getElementById('coverIcon').textContent = story.icon || '🌙'

  const storyHtml = generateStoryText(story.title)
  document.getElementById('storyText').innerHTML = storyHtml

  const plainText = document.getElementById('storyText').textContent.replace(/\s+/g, '')
  totalChars = plainText.length
  totalDuration = Math.max(180, Math.floor(totalChars / speechRate / 4))
  readChars = 0

  const bar = document.getElementById('playProgress')
  bar.style.width = '0%'
  document.getElementById('currentTime').textContent = '00:00'
  isPlaying = false
  document.getElementById('playBtn').textContent = '▶'

  goPage('page-player')
}

window.addEventListener('beforeunload', () => {
  stopSpeech()
})
