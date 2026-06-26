import { getMockWeather, getTimeGreeting } from './time';

/**
 * 智能聊天回复引擎
 */
export class ChatEngine {
  /**
   * 根据用户输入生成智能回复
   */
  static generateResponse(userInput: string): string {
    const input = userInput.toLowerCase();
    
    // 1. 检查是否是问候语
    if (this.isGreeting(input)) {
      return this.handleGreeting();
    }
    
    // 2. 检查是否询问天气
    if (this.isWeatherQuery(input)) {
      return this.handleWeatherQuery();
    }
    
    // 3. 检查是否要听笑话
    if (this.isJokeRequest(input)) {
      return this.getJoke();
    }
    
    // 4. 检查是否是健康相关
    if (this.isHealthQuery(input)) {
      return this.handleHealthQuery(input);
    }
    
    // 5. 检查是否要听音乐
    if (this.isMusicRequest(input)) {
      return this.handleMusicRequest();
    }
    
    // 6. 检查是否提到吃药/提醒
    if (this.isReminderRequest(input)) {
      return this.handleReminder();
    }
    
    // 7. 检查是否提到儿女/家人
    if (this.isFamilyMention(input)) {
      return this.handleFamilyMention();
    }
    
    // 8. 检查是否询问时间
    if (this.isTimeQuery(input)) {
      return this.handleTimeQuery();
    }
    
    // 9. 默认回复
    return this.getDefaultResponse();
  }
  
  // --- 检查类型方法 ---
  private static isGreeting(input: string): boolean {
    return /你好|您好|早上好|下午好|晚上好|哈喽|hi|hello/.test(input);
  }
  
  private static isWeatherQuery(input: string): boolean {
    return /天气|气温|温度|下雨|晴天|阴天/.test(input);
  }
  
  private static isJokeRequest(input: string): boolean {
    return /笑话|讲个笑话|开心|好笑/.test(input);
  }
  
  private static isHealthQuery(input: string): boolean {
    return /健康|养生|吃药|身体|不舒服|生病|医院/.test(input);
  }
  
  private static isMusicRequest(input: string): boolean {
    return /音乐|听歌|歌曲|老歌|邓丽君|听歌/.test(input);
  }
  
  private static isReminderRequest(input: string): boolean {
    return /提醒|记一下|别忘了|吃药|喝水/.test(input);
  }
  
  private static isFamilyMention(input: string): boolean {
    return /儿子|女儿|孩子|孙子|孙女|家人|想/.test(input);
  }
  
  private static isTimeQuery(input: string): boolean {
    return /几点|时间|现在|日期/.test(input);
  }
  
  // --- 回复生成方法 ---
  private static handleGreeting(): string {
    const greetings = [
      `${getTimeGreeting()}！今天精神不错呀！`,
      '您好！见到您真高兴！',
      '叔叔阿姨好！今天想聊点什么？',
      '哎！您来了！今天天气挺好的！'
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  private static handleWeatherQuery(): string {
    const weather = getMockWeather();
    return `今天${weather.condition}，${weather.temp}度左右。${weather.tip}`;
  }
  
  private static getJoke(): string {
    const jokes = [
      '有一天，小明问爷爷：「爷爷，你年轻的时候有什么愿望？」爷爷说：「我最大的愿望就是能像现在一样，耳朵背一点，这样就听不到你奶奶唠叨了！」',
      '医生对老伯说：「你要少吃盐。」老伯问：「那我多吃糖行吗？」医生：「...」',
      '为什么老年人总喜欢在早上逛公园？因为那是唯一可以名正言顺跟年轻人抢地盘的地方！',
      '老张头学会了网购，第一次买东西就给差评：「这什么耳机呀，我戴助听器都听不清！」客服：「...」'
    ];
    return jokes[Math.floor(Math.random() * jokes.length)] + ' 😄';
  }
  
  private static handleHealthQuery(input: string): string {
    if (/吃药/.test(input)) {
      return '吃药要按时哦！最好设个闹钟提醒，或者让我提醒您！';
    }
    if (/不舒服|生病/.test(input)) {
      return '身体不舒服可要赶紧看医生哦！别硬扛着，需要帮您打电话给儿女吗？';
    }
    if (/养生/.test(input)) {
      return '说到养生啊，记住三点：多喝水、多运动、心情好！这样身体棒棒的！';
    }
    return '身体是革命的本钱！每天散散步、听听歌，比什么都强！';
  }
  
  private static handleMusicRequest(): string {
    const responses = [
      '好的！为您播放一首经典老歌！邓丽君的《甜蜜蜜》，希望您喜欢！🎵',
      '音乐来了！这首《小城故事》送给您！',
      '为您点播一首《月亮代表我的心》，经典永流传！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  private static handleReminder(): string {
    return '好的！我记住了！到时候我会提醒您的！您也可以去「家庭中心」设置正式的提醒哦！';
  }
  
  private static handleFamilyMention(): string {
    return '想他们了就打个电话吧！孩子们肯定也想着您呢！现在视频通话很方便的！';
  }
  
  private static handleTimeQuery(): string {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    return `现在是 ${timeStr}。${getTimeGreeting()}！`;
  }
  
  private static getDefaultResponse(): string {
    const responses = [
      '我明白了！您慢慢说，我听着呢！',
      '是呀！人老了，有些事情得慢慢来！',
      '您说的对！现在的生活多好啊！',
      '哈哈，真有意思！您年轻的时候肯定很有趣！',
      '别担心，一切都会好的！保持好心情最重要！',
      '嗯！您说得太对了！',
      '我理解！有时候确实会这样！'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
