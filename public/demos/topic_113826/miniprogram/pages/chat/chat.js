// miniprogram/pages/chat/chat.js
const { call } = require("../../utils/request.js");
const config = require("../../config.js");

Page({
  data: {
    animalId: "",
    animalName: "",
    animalSpecies: "",
    animalBreed: "",
    animalAge: "",
    animalGender: "",
    animalCity: "",
    animalDescription: "",
    publisherName: "",
    publisherAvatar: "",

    messages: [],
    inputText: "",
    isLoading: false,
    scrollTop: 0,
  },

  onLoad(options) {
    if (options) {
      const decode = (str) => (str ? decodeURIComponent(str) : "");

      this.setData({
        animalId: options.animalId || "",
        animalName: decode(options.animalName) || "小动物",
        animalSpecies: decode(options.animalSpecies) || "",
        animalBreed: decode(options.animalBreed) || "",
        animalAge: decode(options.animalAge) || "",
        animalGender: decode(options.animalGender) || "",
        animalCity: decode(options.animalCity) || "",
        animalDescription: decode(options.animalDescription) || "",
        publisherName: decode(options.publisherName) || "发布者",
        publisherAvatar:
          options.publisherAvatar ||
          `https://picsum.photos/seed/${decode(options.publisherName) || "pub"}/60`,
      });

      this.addWelcomeMessage();
    }
  },

  addWelcomeMessage() {
    const welcomeMsg = {
      id: "welcome_" + Date.now(),
      isSelf: false,
      content: `您好，我是${this.data.publisherName}，很高兴您对${this.data.animalName}感兴趣！请问有什么想了解的吗？`,
      time: this.formatTime(new Date()),
    };
    this.setData({
      messages: [welcomeMsg],
    });
    this.scrollToBottom();
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  sendMessage() {
    const text = this.data.inputText.trim();
    if (!text || this.data.isLoading) return;

    const userMsg = {
      id: "msg_" + Date.now(),
      isSelf: true,
      content: text,
      time: this.formatTime(new Date()),
    };

    this.setData({
      messages: [...this.data.messages, userMsg],
      inputText: "",
      isLoading: true,
    });

    this.scrollToBottom();
    this.callLLM(text);
  },

  callLLM(userText) {
    const prompt = this.buildSystemPrompt();

    if (!config.llm.apiKey || !config.llm.apiKey.trim()) {
      this.handleFallbackResponse(userText);
      return;
    }

    const messages = [
      { role: "system", content: prompt },
      ...this.data.messages.slice(-8).map((m) => ({
        role: m.isSelf ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: userText },
    ];

    wx.showLoading({ title: "正在回复...", mask: false });

    wx.request({
      url: config.llm.apiUrl,
      method: "POST",
      header: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      data: {
        model: config.llm.model,
        messages: messages,
        temperature: config.llm.temperature,
        max_tokens: config.llm.maxTokens,
      },
      success: (res) => {
        wx.hideLoading();
        if (
          res.statusCode === 200 &&
          res.data &&
          res.data.choices &&
          res.data.choices[0]
        ) {
          const replyContent = res.data.choices[0].message.content.trim();
          this.addReply(replyContent);
        } else {
          console.error("LLM API error:", res);
          this.handleFallbackResponse(userText);
        }
      },
      fail: (error) => {
        console.error("LLM call failed:", error);
        wx.hideLoading();
        this.handleFallbackResponse(userText);
      },
    });
  },

  buildSystemPrompt() {
    const {
      publisherName,
      animalName,
      animalSpecies,
      animalBreed,
      animalAge,
      animalGender,
      animalCity,
      animalDescription,
    } = this.data;

    let speciesText =
      animalSpecies === "dog"
        ? "小狗"
        : animalSpecies === "cat"
          ? "小猫"
          : "小动物";
    let genderText =
      animalGender === "male" ? "公" : animalGender === "female" ? "母" : "";

    return `你是一位热心的宠物救助志愿者，名字叫${publisherName}。正在为一只流浪${speciesText}寻找领养家庭。

【动物信息】
名字：${animalName}
品种：${animalBreed || "串串"}
年龄：${animalAge || "不详"}
性别：${genderText}
城市：${animalCity || "本地"}
描述：${animalDescription || "很可爱，期待有爱心的家庭"}

【回复规则】
1. 每次只回1条消息
2. 禁止场景或状态描述，直接对话
3. 匹配用户语言（中文/英文）
4. 回复简短，像微信聊天一样
5. 需要时可用emoji表情
6. 礼貌温和的性格，说话得体
7. 不要暴露身份，始终扮演${publisherName}`;
  },

  handleFallbackResponse(userText) {
    const fallbacks = [
      `你好呀~ ${this.data.animalName}很可爱的！😊`,
      `感谢关注~方便告诉我你的居住情况吗？`,
      `${this.data.animalName}已经绝育疫苗啦~健康棒棒哒！💉`,
      `很高兴你感兴趣~之前养过宠物吗？`,
      `它性格很温顺的~你放心哦！`,
      `有什么想了解的随时问我~`,
      `领养前需要确认下家人是否同意哦~`,
      `谢谢关心~祝你生活愉快！✨`,
    ];

    const randomReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];

    setTimeout(
      () => {
        this.addReply(randomReply);
      },
      800 + Math.random() * 1000,
    );
  },

  addReply(content) {
    const replyMsg = {
      id: "msg_" + Date.now(),
      isSelf: false,
      content: content,
      time: this.formatTime(new Date()),
    };

    this.setData({
      messages: [...this.data.messages, replyMsg],
      isLoading: false,
    });

    this.scrollToBottom();
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTop: 99999 });
    }, 100);
  },

  scrollTop() {
    this.setData({ scrollTop: 0 });
  },

  formatTime(date) {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  },
});
