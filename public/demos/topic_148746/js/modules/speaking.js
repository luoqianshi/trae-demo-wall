const SpeakingModule = {
    currentMode: 'sentence',
    currentSentenceIndex: 0,
    sentences: [
        { english: "Hello! Nice to meet you.", chinese: "你好！很高兴认识你。" },
        { english: "How are you today?", chinese: "你今天好吗？" },
        { english: "I am fine, thank you.", chinese: "我很好，谢谢。" },
        { english: "What is your name?", chinese: "你叫什么名字？" },
        { english: "My name is Li Ming.", chinese: "我叫李明。" },
        { english: "I study at No.1 Middle School.", chinese: "我在第一中学学习。" },
        { english: "What is your favorite subject?", chinese: "你最喜欢的科目是什么？" },
        { english: "My favorite subject is English.", chinese: "我最喜欢的科目是英语。" },
        { english: "I have a happy family.", chinese: "我有一个幸福的家庭。" },
        { english: "Good morning, teacher!", chinese: "老师，早上好！" },
        { english: "How do you do?", chinese: "你好。" },
        { english: "See you tomorrow.", chinese: "明天见。" },
        { english: "Welcome to our school!", chinese: "欢迎来到我们学校！" },
        { english: "Have a good day!", chinese: "祝你有美好的一天！" },
        { english: "I'm sorry.", chinese: "对不起。" },
        { english: "That's okay.", chinese: "没关系。" },
        { english: "Excuse me.", chinese: "打扰一下。" },
        { english: "Here you are.", chinese: "给你。" },
        { english: "Thank you very much.", chinese: "非常感谢。" },
        { english: "You're welcome.", chinese: "不客气。" }
    ],
    dialogues: [],
    currentDialogueIndex: 0,
    currentDialogueLineIndex: 0,
    selectedRole: 0,
    isRecording: false,
    recognition: null,
    score: 0,

    async init() {
        Router.register('speaking', () => this.render());
        this.dialogues = (await API.getDialogues()).dialogues;
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
        }
    },

    render() {
        return `
            <div class="max-w-4xl mx-auto">
                <div class="flex justify-center mb-6">
                    <div class="flex bg-gray-100 rounded-xl p-1">
                        <button onclick="SpeakingModule.setMode('sentence')" class="px-6 py-2 rounded-lg transition-all ${this.currentMode === 'sentence' ? 'bg-white shadow-md text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-800'}">
                            <i class="fas fa-comment mr-2"></i>单句练习
                        </button>
                        <button onclick="SpeakingModule.setMode('dialogue')" class="px-6 py-2 rounded-lg transition-all ${this.currentMode === 'dialogue' ? 'bg-white shadow-md text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-800'}">
                            <i class="fas fa-comments mr-2"></i>对话练习
                        </button>
                    </div>
                </div>

                ${this.currentMode === 'sentence' ? this.renderSentencePractice() : this.renderDialoguePractice()}
            </div>
        `;
    },

    setMode(mode) {
        this.currentMode = mode;
        if (mode === 'dialogue') {
            this.currentDialogueLineIndex = 0;
        }
        document.getElementById('page-content').innerHTML = this.render();
    },

    renderSentencePractice() {
        const sentence = this.sentences[this.currentSentenceIndex];
        const total = this.sentences.length;

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold text-gray-800">单句口语练习</h2>
                    <span class="text-gray-500">第 ${this.currentSentenceIndex + 1} / ${total} 句</span>
                </div>

                <div class="bg-green-50 rounded-xl p-6 mb-6 text-center">
                    <button onclick="SpeakingModule.playSentence('${sentence.english}')" class="text-green-600 hover:text-green-700 mb-4">
                        <i class="fas fa-volume-up text-3xl"></i>
                    </button>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">${sentence.english}</h3>
                    <p class="text-gray-600">${sentence.chinese}</p>
                </div>

                <div class="text-center">
                    <button onclick="SpeakingModule.startRecording()" class="w-24 h-24 ${this.isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'} rounded-full flex items-center justify-center text-white mx-auto mb-4 hover:scale-105 transition-all">
                        <i class="fas ${this.isRecording ? 'fa-stop' : 'fa-microphone'} text-4xl"></i>
                    </button>
                    <p class="text-gray-500 mb-4">${this.isRecording ? '正在录音，请朗读句子...' : '点击麦克风开始录音'}</p>

                    <div id="speaking-result" class="min-h-[100px] bg-gray-50 rounded-xl p-4">
                        ${this.isRecording ? '<p class="text-gray-400">正在识别中...</p>' : '<p class="text-gray-400">你的朗读结果将显示在这里</p>'}
                    </div>
                </div>

                <div class="flex justify-between mt-6">
                    <button onclick="SpeakingModule.prevSentence()" class="btn-primary ${this.currentSentenceIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentSentenceIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left mr-2"></i>上一句
                    </button>
                    <button onclick="SpeakingModule.nextSentence()" class="btn-secondary ${this.currentSentenceIndex === total - 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentSentenceIndex === total - 1 ? 'disabled' : ''}>
                        下一句<i class="fas fa-chevron-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    renderDialoguePractice() {
        const dialogue = this.dialogues[this.currentDialogueIndex];
        const line = dialogue.content[this.currentDialogueLineIndex];
        const totalDialogues = this.dialogues.length;

        return `
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-xl font-bold text-gray-800">对话练习</h2>
                        <p class="text-gray-500">${dialogue.scene}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="text-gray-500">选择角色：</span>
                        ${dialogue.roles.map((role, idx) => `
                            <button onclick="SpeakingModule.selectRole(${idx})" class="px-4 py-2 rounded-lg transition-all ${this.selectedRole === idx ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}">
                                ${role}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="flex justify-between items-center mb-4">
                    <div class="flex space-x-2">
                        ${this.dialogues.map((d, idx) => `
                            <button onclick="SpeakingModule.selectDialogue(${idx})" class="w-8 h-8 rounded-lg transition-all ${idx === this.currentDialogueIndex ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}">
                                ${idx + 1}
                            </button>
                        `).join('')}
                    </div>
                    <span class="text-gray-500">对话 ${this.currentDialogueIndex + 1} / ${totalDialogues}</span>
                </div>

                <div class="bg-blue-50 rounded-xl p-6 mb-6">
                    <h3 class="text-lg font-bold text-gray-800 mb-4">${dialogue.title}</h3>
                    
                    <div class="space-y-4">
                        ${dialogue.content.slice(0, this.currentDialogueLineIndex + 1).map((item, idx) => {
                            const isMyTurn = item.role === dialogue.roles[this.selectedRole];
                            return `
                                <div class="flex ${isMyTurn ? 'justify-end' : 'justify-start'}">
                                    <div class="${isMyTurn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-xl px-4 py-3 max-w-md">
                                        <div class="font-semibold text-sm mb-1">${item.role}</div>
                                        <div>${item.text}</div>
                                        <div class="text-xs opacity-70 mt-1">${item.chinese}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                ${this.isMyTurn(line) ? this.renderRolePlay(line) : this.renderWaitTurn(line)}

                <div class="flex justify-between mt-6">
                    <button onclick="SpeakingModule.prevDialogue()" class="btn-primary ${this.currentDialogueIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentDialogueIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left mr-2"></i>上一个对话
                    </button>
                    <button onclick="SpeakingModule.nextDialogue()" class="btn-secondary ${this.currentDialogueIndex === totalDialogues - 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${this.currentDialogueIndex === totalDialogues - 1 ? 'disabled' : ''}>
                        下一个对话<i class="fas fa-chevron-right ml-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    isMyTurn(line) {
        const dialogue = this.dialogues[this.currentDialogueIndex];
        return line.role === dialogue.roles[this.selectedRole];
    },

    renderRolePlay(line) {
        return `
            <div class="text-center">
                <div class="bg-yellow-50 rounded-xl p-4 mb-4">
                    <p class="text-yellow-700 font-semibold">轮到你说话了！</p>
                    <p class="text-gray-600 mt-1">请朗读下面的句子：</p>
                </div>
                
                <button onclick="SpeakingModule.playSentence('${line.text}')" class="text-green-600 hover:text-green-700 mb-4">
                    <i class="fas fa-volume-up text-2xl"></i>
                </button>
                <h3 class="text-xl font-bold text-gray-800 mb-2">${line.text}</h3>
                <p class="text-gray-600">${line.chinese}</p>

                <button onclick="SpeakingModule.startDialogueRecording('${line.text}')" class="w-20 h-20 ${this.isRecording ? 'bg-red-500 animate-pulse' : 'bg-green-500'} rounded-full flex items-center justify-center text-white mx-auto mt-6 hover:scale-105 transition-all">
                    <i class="fas ${this.isRecording ? 'fa-stop' : 'fa-microphone'} text-3xl"></i>
                </button>
                <p class="text-gray-500 mt-2">${this.isRecording ? '正在录音...' : '点击麦克风开始录音'}</p>

                <div id="dialogue-result" class="min-h-[80px] bg-gray-50 rounded-xl p-4 mt-4">
                    ${this.isRecording ? '<p class="text-gray-400">正在识别中...</p>' : '<p class="text-gray-400">你的朗读结果将显示在这里</p>'}
                </div>
            </div>
        `;
    },

    renderWaitTurn(line) {
        return `
            <div class="text-center">
                <div class="bg-gray-100 rounded-xl p-4 mb-4">
                    <p class="text-gray-600">听对方说话：</p>
                </div>
                
                <button onclick="SpeakingModule.playSentence('${line.text}')" class="text-blue-600 hover:text-blue-700 mb-4">
                    <i class="fas fa-volume-up text-2xl"></i>
                </button>
                <h3 class="text-xl font-bold text-gray-800 mb-2">${line.text}</h3>
                <p class="text-gray-600">${line.chinese}</p>

                <button onclick="SpeakingModule.nextDialogueLine()" class="btn-primary mt-6">
                    <i class="fas fa-arrow-right mr-2"></i>继续对话
                </button>
            </div>
        `;
    },

    selectRole(roleIndex) {
        this.selectedRole = roleIndex;
        this.currentDialogueLineIndex = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },

    selectDialogue(index) {
        this.currentDialogueIndex = index;
        this.currentDialogueLineIndex = 0;
        document.getElementById('page-content').innerHTML = this.render();
    },

    nextDialogueLine() {
        const dialogue = this.dialogues[this.currentDialogueIndex];
        if (this.currentDialogueLineIndex < dialogue.content.length - 1) {
            this.currentDialogueLineIndex++;
        } else {
            if (this.currentDialogueIndex < this.dialogues.length - 1) {
                this.currentDialogueIndex++;
                this.currentDialogueLineIndex = 0;
            } else {
                alert('恭喜！你完成了所有对话练习！');
                Storage.addCoins(20);
                Storage.addExp(30);
                Storage.addBadge('speaking_master');
            }
        }
        document.getElementById('page-content').innerHTML = this.render();
    },

    playSentence(text) {
        API.speak(text);
    },

    startRecording() {
        if (!this.recognition) {
            alert('您的浏览器不支持语音识别功能');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            document.getElementById('page-content').innerHTML = this.render();
            return;
        }

        this.isRecording = true;
        document.getElementById('page-content').innerHTML = this.render();

        this.recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            this.showResult(result);
            this.isRecording = false;
            document.getElementById('page-content').innerHTML = this.render();
        };

        this.recognition.onerror = () => {
            this.isRecording = false;
            document.getElementById('page-content').innerHTML = this.render();
        };

        this.recognition.start();
    },

    startDialogueRecording(targetText) {
        if (!this.recognition) {
            alert('您的浏览器不支持语音识别功能');
            return;
        }

        if (this.isRecording) {
            this.recognition.stop();
            this.isRecording = false;
            document.getElementById('page-content').innerHTML = this.render();
            return;
        }

        this.isRecording = true;
        document.getElementById('page-content').innerHTML = this.render();

        this.recognition.onresult = (event) => {
            const result = event.results[0][0].transcript;
            this.showDialogueResult(result, targetText);
            this.isRecording = false;
            document.getElementById('page-content').innerHTML = this.render();
        };

        this.recognition.onerror = () => {
            this.isRecording = false;
            document.getElementById('page-content').innerHTML = this.render();
        };

        this.recognition.start();
    },

    showResult(result) {
        const sentence = this.sentences[this.currentSentenceIndex];
        const similarity = this.calculateSimilarity(result.toLowerCase(), sentence.english.toLowerCase());
        const percentage = Math.round(similarity * 100);

        Storage.updateDailyStats('speaking', 1);

        const resultDiv = document.getElementById('speaking-result');
        let colorClass = 'text-red-600';
        let message = '需要继续练习';

        if (percentage >= 80) {
            colorClass = 'text-green-600';
            message = '太棒了！发音很标准';
            Storage.addCoins(2);
            this.score++;
        } else if (percentage >= 60) {
            colorClass = 'text-yellow-600';
            message = '不错！继续加油';
            Storage.addCoins(1);
        }

        resultDiv.innerHTML = `
            <p class="text-gray-800 font-medium">你说的：${result}</p>
            <p class="text-gray-600 mt-2">正确答案：${sentence.english}</p>
            <div class="mt-3">
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <p class="${colorClass} font-semibold mt-2">匹配度：${percentage}% - ${message}</p>
            </div>
        `;
    },

    showDialogueResult(result, targetText) {
        const similarity = this.calculateSimilarity(result.toLowerCase(), targetText.toLowerCase());
        const percentage = Math.round(similarity * 100);

        Storage.updateDailyStats('speaking', 1);

        const resultDiv = document.getElementById('dialogue-result');
        let colorClass = 'text-red-600';
        let message = '需要继续练习';
        let canContinue = false;

        if (percentage >= 70) {
            colorClass = 'text-green-600';
            message = '说得很好！继续对话';
            Storage.addCoins(3);
            canContinue = true;
        } else if (percentage >= 50) {
            colorClass = 'text-yellow-600';
            message = '不错！再试一次或继续';
            Storage.addCoins(1);
            canContinue = true;
        }

        const continueBtn = canContinue ? `
            <button onclick="SpeakingModule.nextDialogueLine()" class="btn-primary mt-3">
                <i class="fas fa-arrow-right mr-2"></i>继续对话
            </button>
        ` : '';

        resultDiv.innerHTML = `
            <p class="text-gray-800 font-medium">你说的：${result}</p>
            <p class="text-gray-600 mt-2">正确答案：${targetText}</p>
            <div class="mt-3">
                <div class="w-full bg-gray-200 rounded-full h-3">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
                <p class="${colorClass} font-semibold mt-2">匹配度：${percentage}% - ${message}</p>
            </div>
            ${continueBtn}
        `;
    },

    calculateSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        const longerLength = longer.length;

        if (longerLength === 0) return 1.0;

        const distance = this.levenshteinDistance(longer, shorter);
        return (longerLength - distance) / longerLength;
    },

    levenshteinDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    },

    prevSentence() {
        if (this.currentSentenceIndex > 0) {
            this.currentSentenceIndex--;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },

    nextSentence() {
        if (this.currentSentenceIndex < this.sentences.length - 1) {
            this.currentSentenceIndex++;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },

    prevDialogue() {
        if (this.currentDialogueIndex > 0) {
            this.currentDialogueIndex--;
            this.currentDialogueLineIndex = 0;
            document.getElementById('page-content').innerHTML = this.render();
        }
    },

    nextDialogue() {
        if (this.currentDialogueIndex < this.dialogues.length - 1) {
            this.currentDialogueIndex++;
            this.currentDialogueLineIndex = 0;
            document.getElementById('page-content').innerHTML = this.render();
        }
    }
};