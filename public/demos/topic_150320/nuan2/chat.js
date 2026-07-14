document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    initSpeech();
    setTimeout(() => {
        typeTextInBubble('你好呀～ 我是暖岛喵 ☺️ 很高兴认识你！', 'greeting');
    }, 500);
});

const messagesContainer = document.getElementById('messagesContainer');
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const catMood = document.getElementById('catMood');
const catStatus = document.getElementById('catStatus');
const mainCat = document.getElementById('mainCat');
const catSpeechBubble = document.getElementById('catSpeechBubble');
const bubbleContent = document.getElementById('bubbleContent');

let isSpeaking = false;
let voicesLoaded = false;

function initSpeech() {
    initVoices();
}

function initVoices() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = function() {
            voicesLoaded = true;
            console.log('语音列表加载完成:', window.speechSynthesis.getVoices().length);
        };
        window.speechSynthesis.getVoices();
    }
}

function goBack() {
    window.location.href = 'index.html';
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text) return;

    addMessage('user', text);
    messageInput.value = '';
    scrollToBottom();
    setCatMood('thinking');

    setTimeout(() => {
        showTyping();
        setTimeout(() => {
            hideTyping();
            generateResponse(text);
        }, 1500 + Math.random() * 1000);
    }, 300);
}

function sendQuickMessage(message) {
    messageInput.value = message;
    sendMessage();
}

function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-avatar user-avatar">
                <i data-lucide="user"></i>
            </div>
            <div class="message-content">
                <p>${escapeHtml(text)}</p>
                <div class="message-time">${timeStr}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar ai-avatar">
                <svg viewBox="0 0 80 80" class="mini-cat">
                    <circle cx="40" cy="38" r="20" fill="#2D2D2D"/>
                    <polygon points="24,28 30,12 36,26" fill="#2D2D2D"/>
                    <polygon points="27,24 30,15 33,24" fill="#FFB7C5"/>
                    <polygon points="44,26 50,12 56,28" fill="#2D2D2D"/>
                    <polygon points="47,24 50,15 53,24" fill="#FFB7C5"/>
                    <circle cx="32" cy="36" r="4" fill="#FFD700"/>
                    <circle cx="48" cy="36" r="4" fill="#FFD700"/>
                    <circle cx="33" cy="35" r="1.5" fill="#000"/>
                    <circle cx="49" cy="35" r="1.5" fill="#000"/>
                    <circle cx="40" cy="44" r="2" fill="#FF6B8A"/>
                    <path d="M37 48 Q40 51 43 48" stroke="#FF6B8A" stroke-width="1.5" fill="none"/>
                    <circle cx="34" cy="42" r="3" fill="#FFB7C5" opacity="0.6"/>
                    <circle cx="46" cy="42" r="3" fill="#FFB7C5" opacity="0.6"/>
                </svg>
            </div>
            <div class="message-content">
                <p>${escapeHtml(text)}</p>
                <div class="message-time">${timeStr}</div>
            </div>
        `;
    }
    
    messagesList.appendChild(messageDiv);
    lucide.createIcons();
}

function showTyping() {
    catSpeechBubble.classList.add('visible');
    bubbleContent.innerHTML = `
        <div class="typing-dots">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    const mouth = mainCat.querySelector('.cat-mouth');
    if (mouth) {
        mouth.style.animation = 'mouthOpen 0.3s ease-in-out infinite';
    }
}

function hideTyping() {
    bubbleContent.innerHTML = '';
}

function typeTextInBubble(text, mood = 'happy') {
    catSpeechBubble.classList.add('visible');
    bubbleContent.innerHTML = '';
    
    let index = 0;
    const speed = 50;
    
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            bubbleContent.textContent += text.charAt(index);
            index++;
            scrollToBottom();
        } else {
            clearInterval(typeInterval);
            const mouth = mainCat.querySelector('.cat-mouth');
            if (mouth) {
                mouth.style.animation = '';
            }
            setTimeout(() => {
                addMessage('ai', text);
                scrollToBottom();
            }, 300);
            speakText(text, mood);
        }
    }, speed);
}

function scrollToBottom() {
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setCatMood(mood) {
    const moods = {
        happy: {
            emoji: '😊',
            status: '喵～ 好开心呀！',
            scale: 1.05,
            tailSpeed: '1s'
        },
        caring: {
            emoji: '🥺',
            status: '抱抱你～ 我陪着你',
            scale: 0.98,
            tailSpeed: '3s'
        },
        sleepy: {
            emoji: '😴',
            status: '困困的... zzz',
            scale: 0.95,
            tailSpeed: '4s'
        },
        thinking: {
            emoji: '🤔',
            status: '让我想想...',
            scale: 1,
            tailSpeed: '2s'
        },
        greeting: {
            emoji: '👋',
            status: '你好呀～',
            scale: 1.02,
            tailSpeed: '1.5s'
        },
        default: {
            emoji: '😊',
            status: '喵～ 我在听你说哦～',
            scale: 1,
            tailSpeed: '2s'
        }
    };

    const config = moods[mood] || moods.default;
    catMood.textContent = config.emoji;
    catStatus.textContent = config.status;
    mainCat.style.transform = `scale(${config.scale})`;
    
    const tail = mainCat.querySelector('.cat-tail');
    if (tail) {
        tail.style.animationDuration = config.tailSpeed;
    }
}

const responses = {
    emotional: [
        '抱抱你～辛苦了，我在这里陪着你 ❤️',
        '我理解你的感受，有时候生活确实会让人感到疲惫。但请记住，你已经很棒了！',
        '不要太苛责自己，每个人都有累的时候。好好休息一下吧～',
        '无论发生什么，我都会在这里倾听你的。想说什么都可以～',
        '你的感受很重要，不要把情绪憋在心里。我愿意做你的树洞！',
        '一切都会好起来的，相信自己，你比想象中更坚强！✨'
    ],
    greeting: [
        '早安呀！☀️ 新的一天也要元气满满哦～',
        '早安！今天天气不错，记得出门晒晒太阳～',
        '晚上好呀 🌙 今天过得怎么样？',
        '晚安～ 愿你有个甜甜的梦 💤',
        '午安！休息一下，给自己充充电吧～',
        '你好呀！很高兴见到你 ☺️'
    ],
    fun: [
        '哈哈，给你讲个笑话：为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25！🎃',
        '从前有只企鹅，它的肚子很大，大家都叫它"企鹅肚子"～🐧',
        '一只蜗牛爬树，爬了半天终于到顶了，它说："哎呀，原来是棵草！"🌿',
        '你知道为什么数学书总是很忧郁吗？因为它有太多的问题...📚',
        '给你讲个冷知识：北极熊的皮肤其实是黑色的！🐻‍❄️',
        '如果感到快乐你就拍拍手～如果感到快乐你就跺跺脚！🎉'
    ],
    advice: [
        '记得多喝水，保持充足的睡眠，身体是革命的本钱哦！💧',
        '每天给自己一点时间放松，可以试试冥想或者听听轻音乐～🎵',
        '多和朋友家人联系，不要让自己太孤单～👨‍👩‍👧',
        '遇到困难不要着急，慢慢来，一步一步总会解决的～🚶',
        '学会拒绝，不要为了迎合别人而委屈自己～❌',
        '每天记录一件开心的小事，生活会变得更美好～📝'
    ],
    story: [
        '从前，在一片温暖的森林里，住着一只小狐狸。它每天都会收集阳光，把它们装进玻璃瓶里。到了晚上，它就把阳光分给森林里需要温暖的小动物们...慢慢地，森林里的夜晚也变得温暖起来，所有的小动物都能安心地入睡了。🌙',
        '有一只小熊，它特别喜欢画画。但是它总是觉得自己画得不好。有一天，它在森林里发现了一面神奇的镜子，镜子里的小熊画得特别棒！原来，那只是一面普通的镜子，只是小熊终于相信了自己。从此，它的画越来越好了～🎨',
        '在大海的深处，住着一只小海豚。它有一个梦想：想要看看天空是什么样子的。于是它每天练习跳跃，一次又一次。终于有一天，它跳出了水面，看到了美丽的天空和飞翔的鸟儿。那一刻，它觉得所有的努力都是值得的～🐬',
        '从前有一颗小星星，它总是觉得自己不够亮。但是有一天晚上，一只迷路的小兔子看到了它的光芒，跟着它找到了回家的路。小星星这才明白，即使是微弱的光芒，也能照亮别人的路～⭐'
    ],
    default: [
        '我不太明白你说的是什么呢，可以再说一遍吗？',
        '这个话题很有趣呢，能多和我说说吗？',
        '谢谢你和我分享，我很开心！😊',
        '嗯，我在听～',
        '你说得对，确实是这样呢～',
        '让我想想...这个问题我需要好好思考一下～'
    ]
};

function generateResponse(text) {
    let response = '';
    let mood = 'default';
    
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('累') || lowerText.includes('疲惫') || lowerText.includes('压力') || 
        lowerText.includes('难过') || lowerText.includes('伤心') || lowerText.includes('心情不好') ||
        lowerText.includes('孤独') || lowerText.includes('孤单') || lowerText.includes('委屈')) {
        response = getRandomResponse(responses.emotional);
        mood = 'caring';
    } else if (lowerText.includes('早安') || lowerText.includes('早上好') || 
               lowerText.includes('午安') || lowerText.includes('晚安') || 
               lowerText.includes('晚上好') || lowerText.includes('你好')) {
        response = getRandomResponse(responses.greeting);
        mood = 'greeting';
    } else if (lowerText.includes('笑话') || lowerText.includes('搞笑') || 
               lowerText.includes('开心') || lowerText.includes('好玩') ||
               lowerText.includes('有趣')) {
        response = getRandomResponse(responses.fun);
        mood = 'happy';
    } else if (lowerText.includes('建议') || lowerText.includes('意见') || 
               lowerText.includes('怎么') || lowerText.includes('怎么办') ||
               lowerText.includes('应该')) {
        response = getRandomResponse(responses.advice);
        mood = 'thinking';
    } else if (lowerText.includes('故事') || lowerText.includes('睡前') || 
               lowerText.includes('睡不着')) {
        response = getRandomResponse(responses.story);
        mood = 'sleepy';
    } else {
        response = getRandomResponse(responses.default);
    }
    
    setCatMood(mood);
    typeTextInBubble(response, mood);
}

function getRandomResponse(array) {
    return array[Math.floor(Math.random() * array.length)];
}



function speakText(text, mood = 'happy') {
    if (!('speechSynthesis' in window)) {
        console.log('浏览器不支持语音合成');
        return;
    }
    
    window.speechSynthesis.cancel();
    isSpeaking = true;
    catStatus.textContent = '喵～ 我在说话呢～';
    
    const moodParams = {
        happy: { rate: 1.1, pitch: 1.2, volume: 1 },
        caring: { rate: 0.85, pitch: 0.9, volume: 0.9 },
        sleepy: { rate: 0.7, pitch: 0.8, volume: 0.7 },
        thinking: { rate: 0.95, pitch: 1.0, volume: 0.95 },
        greeting: { rate: 1.0, pitch: 1.1, volume: 1 },
        excited: { rate: 1.2, pitch: 1.3, volume: 1 },
        sad: { rate: 0.8, pitch: 0.8, volume: 0.85 },
        default: { rate: 0.95, pitch: 1.0, volume: 1 }
    };
    
    const params = moodParams[mood] || moodParams.default;
    
    const cuteText = addCutePhrases(text);
    
    const utterance = new SpeechSynthesisUtterance(cuteText);
    utterance.lang = 'zh-CN';
    utterance.rate = params.rate;
    utterance.pitch = params.pitch;
    utterance.volume = params.volume;
    
    const voices = window.speechSynthesis.getVoices();
    
    const cuteVoice = voices.find(v => v.lang.startsWith('zh') && 
        (v.name.includes('female') || v.name.includes('Female') || 
         v.name.includes('Lili') || v.name.includes('Xiaoxiao') ||
         v.name.includes('Yaoyao') || v.name.includes('Kangkang') ||
         v.name.includes('Meimei') || v.name.includes('Nannan'))) ||
        voices.find(v => v.lang.startsWith('zh-CN')) ||
        voices.find(v => v.lang.startsWith('zh'));
    
    if (cuteVoice) {
        utterance.voice = cuteVoice;
        console.log('使用语音:', cuteVoice.name);
    } else {
        console.log('未找到合适的中文语音，使用默认语音');
    }
    
    utterance.onend = function() {
        isSpeaking = false;
        catStatus.textContent = '喵～ 我在听你说哦～';
        console.log('语音播报结束');
    };
    
    utterance.onerror = function(event) {
        isSpeaking = false;
        catStatus.textContent = '喵～ 我在听你说哦～';
        console.error('语音播报错误:', event.error);
    };
    
    window.speechSynthesis.speak(utterance);
    console.log('开始语音播报:', cuteText);
}

function addCutePhrases(text) {
    const endings = ['哦～', '呢～', '呀～', '呢', '哦'];
    const randomEnding = endings[Math.floor(Math.random() * endings.length)];
    
    if (text.length <= 5) {
        return '喵～ ' + text + randomEnding;
    }
    
    if (text.endsWith('。') || text.endsWith('！') || text.endsWith('？')) {
        text = text.slice(0, -1);
    }
    
    if (text.length > 30) {
        return text + randomEnding;
    }
    
    return '喵～ ' + text + randomEnding;
}

window.speechSynthesis.onvoiceschanged = function() {
    console.log('语音列表更新');
};