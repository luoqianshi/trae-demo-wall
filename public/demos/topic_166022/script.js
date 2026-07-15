document.addEventListener('DOMContentLoaded', () => {
    let selectedRelation = '';
    let currentPet = 'cat';

    const relationCards = document.querySelectorAll('.relation-card');
    const customRelationInput = document.getElementById('custom-relation');
    const customBtn = document.querySelector('.custom-btn');
    const selectedRelationDiv = document.getElementById('selected-relation');
    const relationNameSpan = document.querySelector('.relation-name');

    const uploadArea = document.getElementById('upload-area');
    const uploadInput = document.getElementById('upload-input');
    const previewArea = document.getElementById('preview-area');
    const previewImg = document.getElementById('preview-img');
    const removeBtn = document.getElementById('remove-img');
    const analysisResult = document.getElementById('analysis-result');

    const styleTabs = document.querySelectorAll('.style-tab');
    const answerList = document.getElementById('answer-list');

    const petBtns = document.querySelectorAll('.pet-btn');
    const emojiGrid = document.getElementById('emoji-grid');

    const generateBtn = document.getElementById('generate-btn');
    const toast = document.getElementById('toast');

    relationCards.forEach(card => {
        card.addEventListener('click', () => {
            relationCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedRelation = card.dataset.relation;
            relationNameSpan.textContent = selectedRelation;
            selectedRelationDiv.style.display = 'flex';
        });
    });

    customBtn.addEventListener('click', () => {
        const customVal = customRelationInput.value.trim();
        if (customVal) {
            relationCards.forEach(c => c.classList.remove('active'));
            selectedRelation = customVal;
            relationNameSpan.textContent = selectedRelation;
            selectedRelationDiv.style.display = 'flex';
            customRelationInput.value = '';
        }
    });

    uploadArea.addEventListener('click', () => {
        uploadInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    });

    uploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    });

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewArea.style.display = 'block';
            uploadArea.style.display = 'none';
            
            setTimeout(() => {
                analysisResult.style.display = 'block';
                showToast('AI分析完成！');
            }, 1500);
        };
        reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', () => {
        previewArea.style.display = 'none';
        analysisResult.style.display = 'none';
        uploadArea.style.display = 'block';
        uploadInput.value = '';
    });

    const answers = {
        '温柔': [
            '别担心，我理解你的想法。或许我们可以换一种方式来沟通？',
            '嗯嗯，我明白你的意思了，我们慢慢商量～',
            '我觉得你的想法很有道理，我们可以试试看！'
        ],
        '搞笑': [
            '哈哈，这个问题嘛...我们先喝杯奶茶冷静一下！',
            '我觉得这事吧，主要是天气太热了影响发挥～',
            '别慌别慌，你的小可爱来拯救世界了！'
        ],
        '诚恳': [
            '我认真想了想，确实是我考虑不周，对不起。',
            '谢谢你的坦诚，我会认真反思并改进的。',
            '你的意见很重要，我会仔细考虑并做出调整。'
        ],
        '委婉': [
            '或许我们可以从另一个角度来看待这个问题？',
            '不知道你有没有考虑过，也许还有其他可能性？',
            '我有一个小小的想法，不知道你是否愿意听一下？'
        ]
    };

    styleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            styleTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const style = tab.dataset.style;
            updateAnswers(style);
        });
    });

    function updateAnswers(style) {
        const styleAnswers = answers[style];
        answerList.innerHTML = styleAnswers.map(text => `
            <div class="answer-card">
                <p class="answer-text">${text}</p>
                <button class="copy-btn" data-text="${text}">复制</button>
            </div>
        `).join('');
        
        attachCopyEvents();
    }

    const petConfig = {
        cat: {
            colors: { face: '#FFFFFF', stroke: '#2C2C2C', inner: '#E0E0E0', cheek: '#F0DDDD', nose: '#2C2C2C', accent: '#CCC' }
        },
        dog: {
            colors: { face: '#F4C088', stroke: '#C87838', inner: '#E8A868', cheek: '#F4A88A', nose: '#5C3A1A', accent: '#FFD27A' }
        }
    };

    const emotionConfig = {
        hello:      { label: '打招呼',  anim: 'anim-wave',    catText: '嗨～',    dogText: '你好呀!' },
        agree:      { label: '同意',    anim: 'anim-nod',     catText: '好叭',    dogText: '好滴~' },
        thank:      { label: '感谢道歉', anim: 'anim-bow',     catText: '谢啦',    dogText: '谢谢你!' },
        speechless: { label: '无语',    anim: 'anim-blink',   catText: '……',     dogText: '啊这' },
        sarcastic:  { label: '阴阳怪气', anim: 'anim-tilt',    catText: '哦？',    dogText: '嗯哼~' },
        lazy:       { label: '懒得解释', anim: 'anim-breathe', catText: '懒得理',  dogText: '好困啊' },
        angry:      { label: '怼人',    anim: 'anim-shake',   catText: '哼!',    dogText: '汪汪!' },
        happy:      { label: '狂喜',    anim: 'anim-bounce',  catText: '嘿嘿',    dogText: '太棒啦!' },
        forgive:    { label: '求原谅',  anim: 'anim-wobble',  catText: '别生气',  dogText: '对不起嘛' }
    };

    function generatePetSVG(pet, emotion) {
        const c = petConfig[pet].colors;
        const isCat = pet === 'cat';
        const sw = 2.5;

        let ears;
        if (isCat) {
            ears = `
                <path d="M28 32 L22 10 L42 24 Z" fill="${c.face}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
                <path d="M72 32 L78 10 L58 24 Z" fill="${c.face}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="round"/>
                <path d="M30 28 L26 16 L37 24 Z" fill="${c.inner}"/>
                <path d="M70 28 L74 16 L63 24 Z" fill="${c.inner}"/>
            `;
        } else {
            ears = `
                <ellipse cx="24" cy="40" rx="11" ry="18" fill="${c.inner}" stroke="${c.stroke}" stroke-width="${sw}"/>
                <ellipse cx="76" cy="40" rx="11" ry="18" fill="${c.inner}" stroke="${c.stroke}" stroke-width="${sw}"/>
                <ellipse cx="24" cy="42" rx="6" ry="12" fill="${c.face}" opacity="0.5"/>
                <ellipse cx="76" cy="42" rx="6" ry="12" fill="${c.face}" opacity="0.5"/>
            `;
        }

        let eyes = '';
        switch(emotion) {
            case 'hello':
            case 'agree':
                eyes = `
                    <path d="M35 48 Q40 43 45 48" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
                    <path d="M55 48 Q60 43 65 48" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
                `;
                break;
            case 'thank':
                eyes = `
                    <path d="M35 46 Q40 51 45 46" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
                    <path d="M55 46 Q60 51 65 46" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
                `;
                break;
            case 'speechless':
                eyes = `
                    <circle cx="40" cy="48" r="2.5" fill="${c.stroke}"/>
                    <circle cx="60" cy="48" r="2.5" fill="${c.stroke}"/>
                `;
                break;
            case 'sarcastic':
                eyes = `
                    <circle cx="40" cy="48" r="3" fill="${c.stroke}"/>
                    <path d="M55 48 Q60 45 65 48" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>
                `;
                break;
            case 'lazy':
                eyes = `
                    <path d="M35 47 L45 49" stroke="${c.stroke}" stroke-width="${sw}" stroke-linecap="round"/>
                    <path d="M55 49 L65 47" stroke="${c.stroke}" stroke-width="${sw}" stroke-linecap="round"/>
                `;
                break;
            case 'angry':
                eyes = `
                    <path d="M33 42 L44 47" stroke="${c.stroke}" stroke-width="${sw}" stroke-linecap="round"/>
                    <path d="M67 42 L56 47" stroke="${c.stroke}" stroke-width="${sw}" stroke-linecap="round"/>
                    <circle cx="40" cy="50" r="2.5" fill="${c.stroke}"/>
                    <circle cx="60" cy="50" r="2.5" fill="${c.stroke}"/>
                `;
                break;
            case 'happy':
                eyes = `
                    <path d="M40 43 L42 47 L46 48 L42 49 L40 53 L38 49 L34 48 L38 47 Z" fill="${c.stroke}"/>
                    <path d="M60 43 L62 47 L66 48 L62 49 L60 53 L58 49 L54 48 L58 47 Z" fill="${c.stroke}"/>
                `;
                break;
            case 'forgive':
                eyes = `
                    <ellipse cx="40" cy="48" rx="4" ry="5" fill="${c.stroke}"/>
                    <ellipse cx="60" cy="48" rx="4" ry="5" fill="${c.stroke}"/>
                    <circle cx="41.5" cy="46" r="1.5" fill="white"/>
                    <circle cx="61.5" cy="46" r="1.5" fill="white"/>
                `;
                break;
        }

        let mouth = '';
        switch(emotion) {
            case 'hello':
                mouth = `<path d="M43 58 Q50 65 57 58" stroke="${c.stroke}" stroke-width="${sw}" fill="${c.inner}" stroke-linecap="round" stroke-linejoin="round"/>`;
                break;
            case 'agree':
                mouth = `<path d="M44 59 Q50 63 56 59" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
                break;
            case 'thank':
                mouth = `<path d="M45 59 Q50 62 55 59" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
                break;
            case 'speechless':
                mouth = `<line x1="45" y1="60" x2="55" y2="60" stroke="${c.stroke}" stroke-width="${sw}" stroke-linecap="round"/>`;
                break;
            case 'sarcastic':
                mouth = `<path d="M44 61 Q50 61 56 58" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
                break;
            case 'lazy':
                mouth = `<ellipse cx="50" cy="60" rx="3" ry="2" fill="${c.stroke}"/>`;
                break;
            case 'angry':
                mouth = `<path d="M43 62 Q50 55 57 62" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
                break;
            case 'happy':
                mouth = `<path d="M41 56 Q50 68 59 56 Z" fill="${c.stroke}" stroke="${c.stroke}" stroke-width="${sw}" stroke-linejoin="round"/><path d="M50 56 Q50 62 50 62" stroke="${c.face}" stroke-width="1.5"/>`;
                break;
            case 'forgive':
                mouth = `<path d="M43 61 Q47 58 50 61 Q53 58 57 61" stroke="${c.stroke}" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
                break;
        }

        let accessories = '';
        switch(emotion) {
            case 'happy':
                accessories = `
                    <text x="18" y="18" font-size="10" fill="${c.accent}" font-weight="bold">✦</text>
                    <text x="76" y="20" font-size="8" fill="${c.accent}" font-weight="bold">✦</text>
                    <text x="82" y="36" font-size="6" fill="${c.accent}" font-weight="bold">✦</text>
                `;
                break;
            case 'angry':
                accessories = `
                    <path d="M28 34 L33 28 M33 34 L28 28" stroke="#E07070" stroke-width="2" stroke-linecap="round"/>
                    <path d="M72 34 L67 28 M67 34 L72 28" stroke="#E07070" stroke-width="2" stroke-linecap="round"/>
                `;
                break;
            case 'forgive':
                accessories = `
                    <path d="M34 56 Q31 60 34 63 Q37 60 34 56 Z" fill="#A8D0E8" opacity="0.7"/>
                    <path d="M66 56 Q63 60 66 63 Q69 60 66 56 Z" fill="#A8D0E8" opacity="0.7"/>
                `;
                break;
            case 'thank':
                accessories = `
                    <path d="M22 30 Q18 26 22 24 Q26 26 22 30 Z" fill="#F4A0B0" opacity="0.6" transform="rotate(-20 22 27)"/>
                `;
                break;
            case 'hello':
                accessories = `
                    <circle cx="84" cy="58" r="7" fill="${c.face}" stroke="${c.stroke}" stroke-width="2"/>
                    <path d="M84 54 L84 62" stroke="${c.stroke}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
                `;
                break;
            case 'lazy':
                accessories = `
                    <text x="72" y="22" font-size="14" fill="${c.accent}" opacity="0.5">z</text>
                    <text x="78" y="16" font-size="10" fill="${c.accent}" opacity="0.4">z</text>
                `;
                break;
        }

        const cheeks = `
            <ellipse cx="30" cy="56" rx="5" ry="3.5" fill="${c.cheek}" opacity="0.5"/>
            <ellipse cx="70" cy="56" rx="5" ry="3.5" fill="${c.cheek}" opacity="0.5"/>
        `;

        const whiskers = isCat ? `
            <line x1="16" y1="53" x2="28" y2="54" stroke="${c.stroke}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
            <line x1="16" y1="57" x2="28" y2="57" stroke="${c.stroke}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
            <line x1="84" y1="53" x2="72" y2="54" stroke="${c.stroke}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
            <line x1="84" y1="57" x2="72" y2="57" stroke="${c.stroke}" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
        ` : '';

        const nose = isCat
            ? `<path d="M46 52 L54 52 L50 56 Z" fill="${c.nose}"/>`
            : `<ellipse cx="50" cy="54" rx="4" ry="3" fill="${c.nose}"/>`;

        return `
            <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
                ${ears}
                <ellipse cx="50" cy="50" rx="30" ry="27" fill="${c.face}" stroke="${c.stroke}" stroke-width="${sw}"/>
                ${cheeks}
                ${whiskers}
                ${nose}
                ${eyes}
                ${mouth}
                ${accessories}
            </svg>
        `;
    }

    petBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            petBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPet = btn.dataset.pet;
            updateEmojis(currentPet);
        });
    });

    function updateEmojis(pet) {
        const themeClass = pet === 'cat' ? 'cat-theme' : 'dog-theme';

        document.getElementById('cat-preview').innerHTML = generatePetSVG('cat', 'hello');
        document.getElementById('dog-preview').innerHTML = generatePetSVG('dog', 'hello');

        emojiGrid.innerHTML = Object.entries(emotionConfig).map(([type, cfg]) => {
            const text = pet === 'cat' ? cfg.catText : cfg.dogText;
            return `
                <div class="emoji-card" data-type="${type}">
                    <div class="sticker-area ${themeClass}">
                        <div class="sticker-svg ${cfg.anim}">${generatePetSVG(pet, type)}</div>
                        <span class="sticker-text">${text}</span>
                    </div>
                    <span class="emoji-label">${cfg.label}</span>
                    <button class="emoji-copy-btn" data-text="${text}">复制</button>
                </div>
            `;
        }).join('');

        attachEmojiCopyEvents();
    }

    function attachCopyEvents() {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const text = btn.dataset.text;
                copyToClipboard(text);
            });
        });
    }

    function attachEmojiCopyEvents() {
        document.querySelectorAll('.emoji-copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = btn.dataset.text;
                copyToClipboard(text);
            });
        });

        document.querySelectorAll('.emoji-card').forEach(card => {
            card.addEventListener('click', () => {
                const btn = card.querySelector('.emoji-copy-btn');
                if (btn) {
                    const text = btn.dataset.text;
                    copyToClipboard(text);
                }
            });
        });
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('复制成功！');
        } catch (err) {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('复制成功！');
        }
    }

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    }

    generateBtn.addEventListener('click', () => {
        if (!selectedRelation) {
            showToast('请先定义关系');
            return;
        }
        
        showToast('正在生成...');
        
        setTimeout(() => {
            analysisResult.style.display = 'block';
            updateAnswers('温柔');
            updateEmojis(currentPet);
            showToast('生成完成！');
        }, 1000);
    });

    attachCopyEvents();
    updateEmojis('cat');
});