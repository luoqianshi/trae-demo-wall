/* ==========================================
   AI Companion - AI陪伴
========================================== */

class AIGame {

    constructor() {
        this.modal = document.getElementById("aiModal");
        this.messagesDiv = document.getElementById("aiMessages");
        this.input = document.getElementById("aiInput");
        this.sendBtn = document.getElementById("aiSend");
        this.typingDiv = document.getElementById("aiTyping");
        this.quickReplies = document.querySelectorAll(".ai-quick");
        
        this.responses = {
            greetings: [
                "很高兴见到你！😊 今天有什么特别的事情发生吗？",
                "嘿！我在这里陪你聊天呢～有什么想分享的？",
                "欢迎来到解压实验室的AI角落！🌙 放松下来，我们聊聊天吧。"
            ],
            tired: [
                "辛苦了！💪 累的时候允许自己休息是很重要的。你最近是不是太忙了？",
                "抱抱你 🤗 每个人都有疲惫的时候，这很正常。要不要试试深呼吸？",
                "累了就歇一歇吧。记住：你不是机器，不需要一直运转。✨"
            ],
            joke: [
                "为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25 😂 哈哈！",
                "有一天0跟8在街上吵架，0说：「胖就胖呗，还系什么腰带！」😆",
                "问：什么动物最没有方向感？答：麋鹿（迷路）！🦌 哈哈哈～"
            ],
            anxiety: [
                "焦虑是一种很常见的情绪。试着深呼吸——吸气4秒，屏息4秒，呼气6秒。🌬️",
                "当你感到焦虑时，可以试试「5-4-3-2-1」法：说出5个你能看到的东西、4个能摸到的、3个能听到的、2个能闻到的、1个你能尝到的。",
                "焦虑就像云，它会来也会走。你现在感受到的一切都是暂时的。☁️→☀️"
            ],
            encourage: [
                "你比自己想象的更强大！💪 回顾一下你已经克服的那些困难吧。",
                "每一次跌倒都是为了更好地站起来。我相信你！🌟",
                "记住：星星在最黑暗的夜空中最闪耀。你就是那颗星！⭐",
                "你已经走了很远了，给自己一些掌声吧 👏 你做得很好！"
            ],
            default: [
                "我在认真听你说呢～继续说吧，我在这里 🎧",
                "嗯嗯，我理解你的感受。还有更多想说的吗？💭",
                "谢谢你愿意和我分享这些。你的感受很重要 ✨",
                "听起来你有很多想法呢。慢慢说，我不着急～"
            ]
        };
        
        this.bindEvents();
    }

    bindEvents() {
        if (this.sendBtn) {
            this.sendBtn.addEventListener("click", () => this.sendMessage());
        }
        
        if (this.input) {
            this.input.addEventListener("keypress", (e) => {
                if (e.key === "Enter") this.sendMessage();
            });
        }
        
        this.quickReplies.forEach(btn => {
            btn.addEventListener("click", () => {
                const msg = btn.getAttribute("data-msg");
                this.sendMessage(msg);
            });
        });
    }

    open() {
        if (this.modal) {
            this.modal.classList.add("show");
            this.input.value = "";
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove("show");
        }
    }

    getResponse(text) {
        const t = text.toLowerCase();
        
        if (t.includes("累") || t.includes("疲惫")) return this.getRandom(this.responses.tired);
        if (t.includes("笑话") || t.includes("好笑") || t.includes("开心")) return this.getRandom(this.responses.joke);
        if (t.includes("焦虑") || t.includes("担心") || t.includes("紧张") || t.includes("害怕")) return this.getRandom(this.responses.anxiety);
        if (t.includes("鼓励") || t.includes("加油") || t.includes("没信心") || t.includes("不行")) return this.getRandom(this.responses.encourage);
        if (t.includes("你好") || t.includes("嗨") || t.includes("hi") || t.includes("hello")) return this.getRandom(this.responses.greetings);
        
        return this.getRandom(this.responses.default);
    }

    getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    addMessage(text, isUser) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `ai-message ${isUser ? "ai-user" : "ai-bot"}`;
        msgDiv.textContent = text;
        this.messagesDiv.appendChild(msgDiv);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }

    sendMessage(text) {
        const inputText = text || this.input.value.trim();
        
        if (!inputText) return;
        
        this.addMessage(inputText, true);
        this.input.value = "";
        
        this.typingDiv.style.display = "block";
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
        
        setTimeout(() => {
            this.typingDiv.style.display = "none";
            const response = this.getResponse(inputText);
            this.addMessage(response, false);
        }, 800 + Math.random() * 1200);
    }
}

const aiGame = new AIGame();

GameManager.register("ai", {
    open() {
        aiGame.open();
    },
    close() {
        aiGame.close();
    }
});

document.getElementById("closeAi")?.addEventListener("click", () => {
    GameManager.close();
});