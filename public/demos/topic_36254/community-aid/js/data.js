// 数据管理模块
window.CommunityAidData = (function() {
  const STORAGE_KEYS = {
    VOLUNTEERS: 'community_aid_volunteers',
    NEEDS: 'community_aid_needs',
    STORIES: 'community_aid_stories',
    SMILES: 'community_aid_smiles',
    REGISTERED_USERS: 'community_aid_registered_users',
    USER: 'community_aid_user'
  };

  // 数据版本：结构变更时升级，触发 localStorage 强制刷新
  var DATA_VERSION = 'v2';

  // 内嵌初始数据（fallback：当fetch失败时使用，如file://协议）
  const FALLBACK_DATA = {
    volunteers: [
      {"id": 1, "name": "张明华", "skill": "水电维修", "hours": 320, "phone": "13800138001", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E6%9A%96%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 2, "name": "李秀英", "skill": "家教辅导", "hours": 280, "phone": "13900139002", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E6%9A%96%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 3, "name": "王芳", "skill": "心理咨询", "hours": 410, "phone": "13700137003", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%BC%80%E6%9C%97%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 4, "name": "刘建国", "skill": "家政服务", "hours": 156, "phone": "13600136004", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E4%BA%B2%E5%88%87%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 5, "name": "陈丽娟", "skill": "医疗陪护", "hours": 365, "phone": "13500135005", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E6%9F%94%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 6, "name": "赵强", "skill": "法律咨询", "hours": 198, "phone": "13400134006", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E8%87%AA%E4%BF%A1%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 7, "name": "孙伟", "skill": "电脑维修", "hours": 240, "phone": "13300133007", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E7%88%BD%E6%9C%97%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 8, "name": "周敏", "skill": "烹饪", "hours": 175, "phone": "13200132008", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E7%94%9C%E7%BE%8E%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 9, "name": "吴海涛", "skill": "理发", "hours": 89, "phone": "13100131009", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%85%E7%88%BD%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 10, "name": "郑淑芬", "skill": "代购跑腿", "hours": 268, "phone": "13000130010", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B4%BB%E6%B3%BC%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 11, "name": "马晓东", "skill": "水电维修", "hours": 132, "phone": "13800138011", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E7%83%AD%E6%83%85%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 12, "name": "胡玉珍", "skill": "家教辅导", "hours": 305, "phone": "13900139012", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E8%AE%A4%E7%9C%9F%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 13, "name": "林文斌", "skill": "电脑维修", "hours": 64, "phone": "13700137013", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E7%81%BF%E7%83%82%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 14, "name": "高桂英", "skill": "家政服务", "hours": 220, "phone": "13600136014", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%96%84%E8%89%AF%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 15, "name": "罗志强", "skill": "医疗陪护", "hours": 478, "phone": "13500130015", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%9D%9A%E5%AE%9A%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 16, "name": "黄丽萍", "skill": "心理咨询", "hours": 145, "phone": "13400134016", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%92%8C%E8%94%BC%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 17, "name": "曾建华", "skill": "法律咨询", "hours": 92, "phone": "13300133017", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E7%94%B7%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B2%89%E7%A8%B3%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 18, "name": "谢美玲", "skill": "烹饪", "hours": 312, "phone": "13200132018", "avatar": "", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD18%E5%B2%81%E9%98%B3%E5%85%89%E5%A5%B3%E7%94%9F%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%B9%B8%E7%A6%8F%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"}
    ],
    needs: [
      {"id": 1, "type": "水电维修", "description": "厨房水龙头漏水，需要师傅上门维修", "time": "2026-06-15 09:30", "phone": "13800138001", "status": "pending"},
      {"id": 2, "type": "家教辅导", "description": "小学三年级数学辅导，周末上午两小时", "time": "2026-06-15 14:20", "phone": "13900139002", "status": "accepted"},
      {"id": 3, "type": "心理咨询", "description": "独居老人情绪低落，需要心理疏导陪伴", "time": "2026-06-16 10:00", "phone": "13700137003", "status": "pending"},
      {"id": 4, "type": "家政服务", "description": "行动不便，需要协助打扫卫生和做饭", "time": "2026-06-16 15:45", "phone": "13600136004", "status": "accepted"},
      {"id": 5, "type": "医疗陪护", "description": "老人去医院复查，需要人陪同照护", "time": "2026-06-17 08:15", "phone": "13500135005", "status": "pending"},
      {"id": 6, "type": "法律咨询", "description": "邻里纠纷问题，需要法律方面的建议", "time": "2026-06-17 13:30", "phone": "13400134006", "status": "pending"},
      {"id": 7, "type": "电脑维修", "description": "电脑无法开机，需要师傅上门检测维修", "time": "2026-06-18 09:00", "phone": "13300133007", "status": "accepted"},
      {"id": 8, "type": "代购跑腿", "description": "腿脚不便，需要帮忙采购生活用品和药品", "time": "2026-06-18 11:20", "phone": "13200132008", "status": "pending"},
      {"id": 9, "type": "水电维修", "description": "卫生间下水道堵塞，急需疏通处理", "time": "2026-06-18 16:00", "phone": "13100131009", "status": "pending"},
      {"id": 10, "type": "家政服务", "description": "需要协助清洗窗户和整理杂物", "time": "2026-06-19 09:45", "phone": "13000130010", "status": "pending"},
      {"id": 11, "type": "家教辅导", "description": "初二英语辅导，每周三次每次一小时", "time": "2026-06-19 14:30", "phone": "13800138011", "status": "accepted"},
      {"id": 12, "type": "医疗陪护", "description": "术后康复期，需要白天陪护照顾", "time": "2026-06-20 08:30", "phone": "13900139012", "status": "pending"},
      {"id": 13, "type": "理发", "description": "卧床老人需要上门理发服务", "time": "2026-06-20 15:00", "phone": "13700137013", "status": "pending"}
    ],
    stories: [
      {"id": 1, "title": "邻里互助暖人心", "content": "张师傅帮王奶奶修好了漏水的水管，王奶奶感动得热泪盈眶，连连称赞社区好邻居。", "author": "社区居委会", "date": "2026-06-10"},
      {"id": 2, "title": "志愿之星在身边", "content": "李秀英老师坚持三年为社区孩子免费辅导功课，孩子们的成绩都有了明显进步。", "author": "社区居委会", "date": "2026-06-11"},
      {"id": 3, "title": "爱心陪护显真情", "content": "罗志强师傅长期义务陪护社区独居老人就医，被大家亲切地称为老人的贴心人。", "author": "社区居委会", "date": "2026-06-12"},
      {"id": 4, "title": "巧手理发进家门", "content": "吴海涛师傅带着工具箱上门为行动不便的老人理发，手艺精湛态度热情，深受好评。", "author": "社区居委会", "date": "2026-06-13"},
      {"id": 5, "title": "法律援助解民忧", "content": "赵强律师为居民解答邻里纠纷法律问题，专业耐心的服务让矛盾得到圆满化解。", "author": "社区居委会", "date": "2026-06-14"},
      {"id": 6, "title": "温暖代购送上门", "content": "郑淑芬大姐风雨无阻为社区老人代购生活用品，用行动诠释了邻里守望相助的精神。", "author": "社区居委会", "date": "2026-06-15"},
      {"id": 7, "title": "心理疏导伴成长", "content": "王芳老师为社区青少年开展心理健康讲座，帮助孩子们树立积极乐观的生活态度。", "author": "社区居委会", "date": "2026-06-16"},
      {"id": 8, "title": "美食飘香聚邻里", "content": "谢美玲阿姨在社区美食节上大展厨艺，一道道家常菜拉近了邻里之间的距离。", "author": "社区居委会", "date": "2026-06-17"}
    ],
    smiles: [
      {"id": 1, "name": "王阿姨", "occupation": "环卫工人", "age": 58, "quote": "凌晨四点扫街，看见干净的路面就开心", "color": "#FF6B35", "size": "large", "story": "王阿姨负责社区三条街的保洁，凌晨四点就开始工作。她说看见居民走在干净的路面，心里就踏实。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E7%8E%AF%E5%8D%AB%E5%A5%B3%E5%B7%A5%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E6%9A%96%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 2, "name": "李师傅", "occupation": "快递员", "age": 42, "quote": "每一单快递都是一份信任，绝不能辜负", "color": "#4ECDC4", "size": "large", "story": "李师傅送快递八年，风雨无阻。有次为了送急救药品，冒雨骑行十公里，居民们都叫他'及时雨'。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E5%BF%AB%E9%80%92%E5%91%98%E5%B0%8F%E5%93%A5%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%8F%8B%E5%A5%BD%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 3, "name": "小张", "occupation": "外卖员", "age": 36, "quote": "再晚再累，也要把热乎饭送到你手上", "color": "#FFD700", "size": "medium", "story": "小张是90后外卖员，每天骑行上百公里。他说最幸福的事，是看见顾客接过餐时露出的笑容。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E5%A4%96%E5%8D%96%E9%AA%91%E6%89%8B%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E9%98%B3%E5%85%89%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 4, "name": "刘阿姨", "occupation": "保洁员", "age": 52, "quote": "擦干净的不只是地板，是大家的心情", "color": "#FF8E53", "size": "small", "story": "刘阿姨在写字楼做保洁十年，每天第一个到。她说把大厅擦得发亮，大家上班心情就好。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E4%BF%9D%E6%B4%81%E9%98%BF%E5%A7%A8%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%92%8C%E8%94%BC%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 5, "name": "老陈", "occupation": "建筑工人", "age": 55, "quote": "盖楼的人最懂，一块砖就是一份家的分量", "color": "#98D8C8", "size": "large", "story": "老陈干建筑二十多年，参与盖了十几栋楼。他常说，每块砖都关系着别人家，马虎不得。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E5%BB%BA%E7%AD%91%E5%B7%A5%E4%BA%BA%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%86%A8%E5%8E%9A%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 6, "name": "周师傅", "occupation": "厨师", "age": 50, "quote": "把每一道家常菜，都做出家的温暖味道", "color": "#F7DC6F", "size": "medium", "story": "周师傅在社区食堂掌勺十五年，最拿手红烧肉。他说看见老人们吃得香，比啥都高兴。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E5%8E%A8%E5%B8%88%E5%B8%88%E5%82%85%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E6%9A%96%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 7, "name": "赵师傅", "occupation": "保安", "age": 48, "quote": "守好这道门，就是守好整个小区的家", "color": "#FFB6B9", "size": "medium", "story": "赵师傅当保安十二年，认识小区每户人家。深夜巡逻时，他总多看几眼独居老人的窗户。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E4%BF%9D%E5%AE%89%E5%A4%A7%E5%8F%94%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%8F%AF%E9%9D%A0%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 8, "name": "孙姐", "occupation": "理发师", "age": 45, "quote": "剪出的是精神头，更是大家的好心情", "color": "#BB8FCE", "size": "small", "story": "孙姐开店二十年，每月免费给社区老人理发。她说老人们理完发照镜子时的笑容，是最美的风景。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E7%90%86%E5%8F%91%E5%B8%88%E5%A5%B3%E6%80%A7%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%BC%80%E6%9C%97%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 9, "name": "老吴", "occupation": "修鞋匠", "age": 62, "quote": "修好的不只是鞋，是大家脚下走过的路", "color": "#82E0AA", "size": "large", "story": "老吴修鞋三十年，摊位摆在小巷口。一双双旧鞋在他手里重获新生，街坊们都说他手艺有温度。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E4%BF%AE%E9%9E%8B%E8%80%81%E5%8C%A0%E4%BA%BA%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%85%88%E7%A5%A5%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 10, "name": "张大爷", "occupation": "废品回收员", "age": 64, "quote": "别人嫌脏嫌累的活，总得有人愿意干", "color": "#85C1E2", "size": "small", "story": "张大爷收废品二十年，走街串巷从不喊累。他说把废品分类好，也是给子孙留片干净地。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E5%BA%9F%E5%93%81%E5%9B%9E%E6%94%B6%E5%A4%A7%E7%88%B7%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%9C%B4%E5%AE%9E%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 11, "name": "马师傅", "occupation": "水电工", "age": 47, "quote": "通的是水管，暖的是千家万户的心", "color": "#FF6B35", "size": "medium", "story": "马师傅随叫随到，半夜抢修水管是常事。他说看见水流出来那一刻，再累也值了。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E6%B0%B4%E7%94%B5%E5%B7%A5%E5%B8%88%E5%82%85%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E8%83%BD%E5%B9%B2%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 12, "name": "老郑", "occupation": "煤气配送员", "age": 53, "quote": "扛上肩的是煤气罐，送进门的是温暖", "color": "#4ECDC4", "size": "medium", "story": "老郑送煤气十五年，爬楼无数。遇到独居老人，他总帮忙检查灶具才放心离开。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E7%85%A4%E6%B0%94%E9%85%8D%E9%80%81%E5%B8%88%E5%82%85%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E6%9A%96%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 13, "name": "钱师傅", "occupation": "绿化养护工", "age": 49, "quote": "今天种下的树，会长成孩子们的童年", "color": "#FFD700", "size": "small", "story": "钱师傅负责社区绿化，亲手栽下上百棵树。他说看见孩子们在树下玩耍，就觉得没白忙活。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E7%BB%BF%E5%8C%96%E5%85%BB%E6%8A%A4%E5%B7%A5%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E5%92%8C%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 14, "name": "陈大姐", "occupation": "菜市场摊主", "age": 51, "quote": "卖的是新鲜蔬菜，交的是一份实在心", "color": "#FF8E53", "size": "large", "story": "陈大姐卖菜二十年，从不缺斤少两。她记得老主顾的口味，总会留最新鲜的那把菜。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E8%8F%9C%E5%B8%82%E5%9C%BA%E5%A4%A7%E5%A7%90%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%8F%8B%E5%96%84%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 15, "name": "黄师傅", "occupation": "公交司机", "age": 56, "quote": "握紧手中的方向盘，护好一车人的平安", "color": "#98D8C8", "size": "medium", "story": "黄师傅开公交十八年，零事故。他说每天迎来送往，最盼的就是把每位乘客平安送到站。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E5%85%AC%E4%BA%A4%E5%8F%B8%E6%9C%BA%E5%B8%88%E5%82%85%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B2%89%E7%A8%B3%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 16, "name": "林阿姨", "occupation": "护工", "age": 46, "quote": "把病人当亲人照顾，也是在为自己积德", "color": "#F7DC6F", "size": "medium", "story": "林阿姨在医院做护工十年，照顾过上百位老人。她说把病人当亲人，心里才过得去。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E6%8A%A4%E5%B7%A5%E9%98%BF%E5%A7%A8%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E5%85%B3%E7%88%B1%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 17, "name": "吴姐", "occupation": "月嫂", "age": 43, "quote": "新生命的第一声啼哭，是世上最美的歌", "color": "#FFB6B9", "size": "small", "story": "吴姐做月嫂十二年，迎接过两百多个新生命。她说每次看见宝宝健康出生，再辛苦都值得。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E6%9C%88%E5%AB%82%E5%A5%B3%E6%80%A7%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%B8%A9%E6%9F%94%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"},
      {"id": 18, "name": "老高", "occupation": "通下水道师傅", "age": 60, "quote": "脏了我一个人，换来千万家的干净顺畅", "color": "#BB8FCE", "size": "large", "story": "老高通下水道二十多年，专治各种堵塞。他说再脏的活也得有人干，看见水流顺畅就满足。", "imageUrl": "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=%E4%B8%AD%E5%9B%BD%E4%B8%8B%E6%B0%B4%E9%81%93%E7%96%8F%E9%80%9A%E5%B8%88%E5%82%85%E7%9A%84%E7%9C%9F%E5%AE%9E%E4%BA%BA%E8%84%B8%E7%85%A7%E7%89%87%EF%BC%8C%E6%BB%A1%E8%B6%B3%E5%BE%AE%E7%AC%91%EF%BC%8C%E6%AD%A3%E9%9D%A2%E8%82%96%E5%83%8F%EF%BC%8C%E9%AB%98%E6%B8%85&image_size=square_hd"}
    ]
  };

  // 初始化数据：优先从JSON文件加载，fetch失败时使用内嵌数据
  async function initData() {
    let volunteers, needs, stories, smiles;
    
    try {
      // 尝试从JSON文件加载
      const [volunteersRes, needsRes, storiesRes, smilesRes] = await Promise.all([
        fetch('data/volunteers.json'),
        fetch('data/needs.json'),
        fetch('data/stories.json'),
        fetch('data/smiles.json')
      ]);
      volunteers = await volunteersRes.json();
      needs = await needsRes.json();
      stories = await storiesRes.json();
      smiles = await smilesRes.json();
    } catch (e) {
      // fetch失败（如file://协议），使用内嵌fallback数据
      console.warn('JSON文件加载失败，使用内嵌数据:', e.message);
      volunteers = FALLBACK_DATA.volunteers;
      needs = FALLBACK_DATA.needs;
      stories = FALLBACK_DATA.stories;
      smiles = FALLBACK_DATA.smiles;
    }

    // 数据版本检查：版本不匹配时强制刷新，版本匹配时仅补充缺失数据
    var storedVersion = localStorage.getItem('community_aid_data_version');
    if (storedVersion !== DATA_VERSION) {
      localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(volunteers));
      localStorage.setItem(STORAGE_KEYS.NEEDS, JSON.stringify(needs));
      localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
      localStorage.setItem(STORAGE_KEYS.SMILES, JSON.stringify(smiles));
      localStorage.setItem('community_aid_data_version', DATA_VERSION);
    } else {
      if (!localStorage.getItem(STORAGE_KEYS.VOLUNTEERS)) {
        localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(volunteers));
      }
      if (!localStorage.getItem(STORAGE_KEYS.NEEDS)) {
        localStorage.setItem(STORAGE_KEYS.NEEDS, JSON.stringify(needs));
      }
      if (!localStorage.getItem(STORAGE_KEYS.STORIES)) {
        localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SMILES)) {
        localStorage.setItem(STORAGE_KEYS.SMILES, JSON.stringify(smiles));
      }
    }
    return { volunteers: volunteers, needs: needs, stories: stories, smiles: smiles };
  }

  // 获取志愿者列表
  function getVolunteers() {
    const data = localStorage.getItem(STORAGE_KEYS.VOLUNTEERS);
    return data ? JSON.parse(data) : [];
  }

  // 获取需求列表
  function getNeeds() {
    const data = localStorage.getItem(STORAGE_KEYS.NEEDS);
    return data ? JSON.parse(data) : [];
  }

  // 获取故事列表
  function getStories() {
    const data = localStorage.getItem(STORAGE_KEYS.STORIES);
    return data ? JSON.parse(data) : [];
  }

  // 获取笑脸列表
  function getSmiles() {
    const data = localStorage.getItem(STORAGE_KEYS.SMILES);
    return data ? JSON.parse(data) : [];
  }

  // 添加志愿者
  function addVolunteer(volunteer) {
    var volunteers = getVolunteers();
    volunteer.id = volunteers.length > 0 ? Math.max.apply(null, volunteers.map(function(v) { return v.id; })) + 1 : 1;
    volunteer.hours = volunteer.hours || 0;
    volunteer.avatar = volunteer.avatar || '';
    // 记录创建者
    var user = getUser();
    volunteer.createdBy = user ? user.username : 'anonymous';
    volunteers.push(volunteer);
    localStorage.setItem(STORAGE_KEYS.VOLUNTEERS, JSON.stringify(volunteers));
    return volunteer;
  }

  // 添加需求
  function addNeed(need) {
    var needs = getNeeds();
    need.id = needs.length > 0 ? Math.max.apply(null, needs.map(function(n) { return n.id; })) + 1 : 1;
    need.status = need.status || 'pending';
    // 记录创建者
    var user = getUser();
    need.createdBy = user ? user.username : 'anonymous';
    needs.push(need);
    localStorage.setItem(STORAGE_KEYS.NEEDS, JSON.stringify(needs));
    return need;
  }

  // 获取我的志愿者
  function getMyVolunteers(username) {
    var volunteers = getVolunteers();
    return volunteers.filter(function(v) { return v.createdBy === username; });
  }

  // 获取我的需求
  function getMyNeeds(username) {
    var needs = getNeeds();
    return needs.filter(function(n) { return n.createdBy === username; });
  }

  // 接单（更新需求状态）
  function acceptNeed(id) {
    const needs = getNeeds();
    const need = needs.find(function(n) { return n.id === id; });
    if (need && need.status === 'pending') {
      need.status = 'accepted';
      need.acceptedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.NEEDS, JSON.stringify(needs));
      return true;
    }
    return false;
  }

  // 评价需求（完成后打分，状态变为 completed）
  function rateNeed(id, rating, comment) {
    const needs = getNeeds();
    const need = needs.find(function(n) { return n.id === id; });
    if (!need) return false;
    if (need.status !== 'accepted') return false;
    need.status = 'completed';
    need.rating = rating;
    need.comment = comment || '';
    need.ratedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.NEEDS, JSON.stringify(needs));
    return true;
  }

  // 注册用户
  function registerUser(username) {
    var users = getRegisteredUsers();
    if (users.indexOf(username) !== -1) {
      return { success: false, message: '该用户名已被注册，请更换' };
    }
    users.push(username);
    localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
    return { success: true, message: '注册成功！' };
  }

  // 获取已注册用户列表
  function getRegisteredUsers() {
    var data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
    return data ? JSON.parse(data) : [];
  }

  // 检查用户名是否已注册
  function isUserRegistered(username) {
    var users = getRegisteredUsers();
    return users.indexOf(username) !== -1;
  }

  // 用户登录
  function setUser(username) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ username: username, loginTime: Date.now() }));
  }

  // 获取当前用户
  function getUser() {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  }

  // 退出登录
  function clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  // 是否已登录
  function isLoggedIn() {
    return getUser() !== null;
  }

  // 重置数据（调试用）
  function resetData() {
    localStorage.removeItem(STORAGE_KEYS.VOLUNTEERS);
    localStorage.removeItem(STORAGE_KEYS.NEEDS);
    localStorage.removeItem(STORAGE_KEYS.STORIES);
    localStorage.removeItem(STORAGE_KEYS.SMILES);
    localStorage.removeItem(STORAGE_KEYS.REGISTERED_USERS);
  }

  return {
    initData: initData,
    getVolunteers: getVolunteers,
    getNeeds: getNeeds,
    getStories: getStories,
    getSmiles: getSmiles,
    addVolunteer: addVolunteer,
    addNeed: addNeed,
    acceptNeed: acceptNeed,
    rateNeed: rateNeed,
    getMyVolunteers: getMyVolunteers,
    getMyNeeds: getMyNeeds,
    registerUser: registerUser,
    getRegisteredUsers: getRegisteredUsers,
    isUserRegistered: isUserRegistered,
    setUser: setUser,
    getUser: getUser,
    clearUser: clearUser,
    isLoggedIn: isLoggedIn,
    resetData: resetData
  };
})();
