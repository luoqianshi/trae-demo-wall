const o={recommend_gift:{keywords:["礼物","生日","推荐","送","选什么","买什么"],redirect:"/wishes"},plan_travel:{keywords:["旅行","规划","去哪","旅游","行程","度假"],redirect:"/travel"},add_reminder:{keywords:["提醒","生日","纪念日","考试","家长会","通知"],redirect:"/reminders"},record_moment:{keywords:["记录","时刻","分享","今天","日记","照片"],redirect:"/moments"},manage_wish:{keywords:["心愿","想要","目标","梦想","愿望"],redirect:"/wishes"},record_growth:{keywords:["打卡","学习","运动","阅读","成长","进步"],redirect:"/growth"},query_data:{keywords:["多少","统计","记录","天数","进度","报告"]},view_moments:{keywords:["看看","时刻","动态","新鲜事"],redirect:"/moments"},view_growth:{keywords:["成长树","打卡记录","查看进度"],redirect:"/growth"},birthday_prepare:{keywords:["生日快到了","过生日","生日准备","准备生日"],isChain:!0,chainSkills:["add_reminder","recommend_gift","manage_wish"],redirect:"/wishes"},travel_plan_full:{keywords:["规划旅行","计划旅行","安排旅行"],isChain:!0,chainSkills:["plan_travel"],redirect:"/travel"},generate_story:{keywords:["故事","周报","生成故事","家庭故事","总结"],redirect:"/story"},record_mood:{keywords:["心情","情绪","打卡心情","今天心情"],redirect:"/mood"},view_time_capsule:{keywords:["时光胶囊","胶囊","开启","封存"],redirect:"/time-capsule"}},d={recognizeIntent(s){for(const[t,e]of Object.entries(o))if(e.keywords.some(r=>s.includes(r)))return{intent:t,confidence:.9,params:{},redirect:e.redirect,isChain:e.isChain,chainSkills:e.chainSkills};return{intent:"general",confidence:.5,params:{}}},async executeSkill(s,t,e){switch(s){case"recommend_gift":return this.recommendGift(t,e);case"plan_travel":return this.planTravel(t,e);case"add_reminder":return this.addReminder(t,e);case"record_moment":return this.recordMoment(t,e);case"manage_wish":return this.manageWish(t,e);case"record_growth":return this.recordGrowth(t,e);case"query_data":return this.queryData(t,e);case"view_moments":return this.viewMoments(t,e);case"view_growth":return this.viewGrowth(t,e);case"birthday_prepare":return this.birthdayPrepare(t,e);case"travel_plan_full":return this.travelPlanFull(t,e);case"generate_story":return this.generateStory(t,e);case"record_mood":return this.recordMood(t,e);case"view_time_capsule":return this.viewTimeCapsule(t,e);default:return this.getGeneralResponse(t)}},async executeSkillChain(s,t,e){const r=[];for(const i of s){const n=await this.executeSkill(i,t,e);r.push(n),await new Promise(a=>setTimeout(a,300))}return r},async recommendGift(s,t){return await new Promise(e=>setTimeout(e,800)),{skill:"recommend_gift",status:"success",data:{recipient:"妈妈",recommendations:[{id:"1",name:"智能保温杯",price:299,category:"健康生活",emoji:"🥤"},{id:"2",name:"香薰蜡烛礼盒",price:199,category:"生活美学",emoji:"🕯️"},{id:"3",name:"定制首饰",price:459,category:"珠宝饰品",emoji:"💍"}]},suggestion:`我为您推荐了几款礼物：

🥤 智能保温杯 - ¥299
🕯️ 香薰蜡烛礼盒 - ¥199
💍 定制首饰 - ¥459

需要我帮您查看更多推荐，还是直接添加到心愿清单？`,redirect:"/wishes"}},async planTravel(s,t){return await new Promise(e=>setTimeout(e,800)),{skill:"plan_travel",status:"success",data:{destinations:[{id:"1",name:"上海迪士尼",duration:2,budget:2e3,tags:["亲子","乐园"]},{id:"2",name:"桂林阳朔",duration:3,budget:1500,tags:["自然","放松"]},{id:"3",name:"北京故宫",duration:2,budget:1800,tags:["文化","历史"]}]},suggestion:"好的！我来帮您规划旅行~ 您可以试试随机抽签功能，让命运决定您的下一次目的地！",redirect:"/travel"}},async addReminder(s,t){return await new Promise(e=>setTimeout(e,600)),{skill:"add_reminder",status:"success",data:{title:"妈妈生日",date:"2024-06-30",type:"birthday",remindDays:[7,3,1]},suggestion:"提醒已添加！我会在7天、3天、1天前准时提醒您~",redirect:"/reminders"}},async recordMoment(s,t){return await new Promise(e=>setTimeout(e,600)),{skill:"record_moment",status:"success",data:{content:s,publisher:"爸爸"},suggestion:"时刻已记录！其他家庭成员可以看到并互动~",redirect:"/moments"}},async manageWish(s,t){return await new Promise(e=>setTimeout(e,600)),{skill:"manage_wish",status:"success",data:{action:"add",wish:{title:"想要一台Switch",owner:"小宝",emoji:"🎮",targetAmount:1e3}},suggestion:"心愿已添加！全家可以一起努力实现~",redirect:"/wishes"}},async recordGrowth(s,t){return await new Promise(e=>setTimeout(e,600)),{skill:"record_growth",status:"success",data:{type:"study",content:"完成数学作业",duration:60,contributor:"小宝"},suggestion:"打卡成功！成长树又长出了一片新叶子~ 🌿",redirect:"/growth"}},async queryData(s,t){return await new Promise(e=>setTimeout(e,500)),{skill:"query_data",status:"success",data:{queryType:"moments_count",result:3,period:"today",description:"今天已经记录了3条家庭时刻"},suggestion:"今天已经记录了3条家庭时刻，连续打卡16天，心愿完成率68%。继续保持！"}},async viewMoments(s,t){return await new Promise(e=>setTimeout(e,300)),{skill:"view_moments",status:"success",data:{},suggestion:"好的，带您查看最新的家庭时刻~",redirect:"/moments"}},async viewGrowth(s,t){return await new Promise(e=>setTimeout(e,300)),{skill:"view_growth",status:"success",data:{},suggestion:"好的，带您查看家庭成长树~",redirect:"/growth"}},async birthdayPrepare(s,t){return await new Promise(e=>setTimeout(e,500)),{skill:"birthday_prepare",status:"success",data:{chain:["add_reminder","recommend_gift","manage_wish"],steps:[{skill:"add_reminder",description:"创建生日提醒",status:"pending"},{skill:"recommend_gift",description:"推荐生日礼物",status:"pending"},{skill:"manage_wish",description:"添加到心愿清单",status:"pending"}]},suggestion:`🎉 好的！我来帮您准备生日~ 正在为您执行以下任务：

📅 第一步：创建生日提醒（7天/3天/1天前提醒）
🎁 第二步：推荐适合的生日礼物
💝 第三步：将礼物添加到心愿清单

请稍候，正在处理中...`,redirect:"/wishes"}},async travelPlanFull(s,t){return await new Promise(e=>setTimeout(e,500)),{skill:"travel_plan_full",status:"success",data:{chain:["plan_travel"],steps:[{skill:"plan_travel",description:"推荐旅行目的地",status:"pending"}]},suggestion:"✈️ 好的！我来帮您规划旅行~ 正在推荐合适的目的地，请稍候...",redirect:"/travel"}},async generateStory(s,t){await new Promise(i=>setTimeout(i,1500));const e=[{title:"本周家庭温馨时刻",content:`📅 周一，爸爸带小宝去公园放风筝，小宝第一次成功放飞了他的奥特曼风筝，开心得蹦蹦跳跳！

🎨 周二晚上，全家人一起在家画画，妈妈画了一幅全家福，每个人都有专属的颜色。

📚 周三，小宝完成了一周的阅读打卡，累计阅读3本绘本，成长树又长出了新叶子！

🎂 周四是妈妈的生日，爸爸偷偷准备了惊喜蛋糕，全家人一起唱生日歌，温暖又幸福。

❤️ 这一周，我们一起创造了很多美好的回忆，继续保持这份爱的记录吧！`,period:"本周",sourceMoments:["mom1","mom2","mom3"]},{title:"家庭成长小故事",content:`🌱 小宝最近学习特别认真，每天坚持完成作业后还会主动复习。有一天他说："妈妈，我要像小树一样快快长大！"

👨‍👩‍👧 周末我们去了郊外野餐，爸爸负责搭帐篷，妈妈准备美食，小宝在旁边帮忙捡柴火。阳光洒在草地上，温暖又惬意。

🎯 我们的心愿清单又完成了一项——小宝的自行车终于买回来了！他兴奋地练习了一下午，虽然摔倒了几次，但依然坚持着。`,period:"本月",sourceMoments:["mom4","mom5"]},{title:"爱的时光机",content:`⏰ 翻开记忆的相册，小宝从蹒跚学步到现在能跑能跳，每一天都充满惊喜。

💞 爸爸妈妈的爱情也在岁月中慢慢沉淀，从相识到相知，从两人世界到三口之家。

🌟 未来还很长，让我们继续用爱编织属于我们的故事，每一天都值得被记录。`,period:"本年度",sourceMoments:["mom6"]}],r=e[Math.floor(Math.random()*e.length)];return{skill:"generate_story",status:"success",data:r,suggestion:`📖 故事生成完成！

**${r.title}**

${r.content}

快去故事页面查看更多精彩内容~`,redirect:"/story"}},async recordMood(s,t){await new Promise(i=>setTimeout(i,600));const e=[{mood:"happy",emoji:"😄",description:"开心"},{mood:"excited",emoji:"🎉",description:"兴奋"},{mood:"calm",emoji:"😌",description:"平静"},{mood:"tired",emoji:"😴",description:"疲惫"},{mood:"sad",emoji:"😢",description:"难过"},{mood:"anxious",emoji:"😰",description:"焦虑"}],r=e[Math.floor(Math.random()*e.length)];return{skill:"record_mood",status:"success",data:{mood:r.mood,emoji:r.emoji,description:r.description,note:s},suggestion:`心情已记录！${r.emoji} ${r.description}

家庭情绪天气会根据大家的心情生成每日报告哦~`,redirect:"/mood"}},async viewTimeCapsule(s,t){return await new Promise(e=>setTimeout(e,300)),{skill:"view_time_capsule",status:"success",data:{},suggestion:"📦 好的，带您查看家庭时光胶囊~ 看看有没有可以开启的惊喜！",redirect:"/time-capsule"}},async getGeneralResponse(s){return await new Promise(t=>setTimeout(t,500)),{skill:"general",status:"success",data:{},suggestion:`您好！我是家映AI助手，可以帮您推荐礼物、规划旅行、添加提醒、记录时刻。请问有什么我可以帮您的吗？

💡 试试这些：
- 帮我推荐生日礼物
- 规划周末旅行
- 添加重要提醒
- 记录今天的时刻`}},generateMessage(s){return{id:Date.now().toString(),role:"agent",content:s.suggestion,skill:s.skill,timestamp:new Date().toISOString()}}};export{d as a};
