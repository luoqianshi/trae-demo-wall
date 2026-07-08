// ========== 示例数据 ==========
// 使用本地人像图片

function getMockData() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  return [
    // ======== 已团聚的案例 ========
    {
      id: 'mock-reunited-001',
      name: '小明',
      gender: '男',
      birthDate: '2016-03-15',
      missingDate: '2020-08-20',
      missingLocation: '广东省深圳市南山区',
      latitude: 22.5333,
      longitude: 113.9333,
      description: '失踪时身高约110cm，圆脸，右耳后有红色胎记，身穿蓝色短袖T恤和灰色短裤，脚穿白色运动鞋。于2020年8月20日下午在小区附近走失。',
      features: '圆脸，右耳后红色胎记',
      photos: ['images/xiaoming.webp'],
      contactName: '王先生',
      contactPhone: '13888888888',
      contactEmail: 'wang@example.com',
      status: 'reunited',
      createdAt: now - 365 * day,
      updatedAt: now - 30 * day,
      reunion: {
        date: '2024-02-15',
        location: '广东省广州市越秀区',
        latitude: 23.1291,
        longitude: 113.2644,
        reunitedPhotos: ['images/xiaoming_reunion.webp'],
        story: '经过志愿者和警方3年多的不懈努力，通过DNA比对和人脸识别技术，小明终于在广州被找到。在志愿者的帮助下，小明与失散多年的父母团聚，一家人相拥而泣，场面感人。社区的爱心人士纷纷送来祝福，希望小明能够健康快乐地成长。',
        missingDuration: 1275,
        keyCommentId: 'comment-001-key',
        familyMessage: '感谢所有帮助过我们的人，你们的每一次转发和留言，都是我们坚持下去的动力。特别感谢宝贝回家志愿者协会，没有你们的帮助，我们一家人不知道还要等多久才能团聚。'
      },
      comments: [
        { id: 'comment-001-key', nickname: '热心市民李', content: '好像在越秀区某小学附近见过一个长得像的孩子，大概是去年11月左右。', type: 'clue', createdAt: now - 90 * day },
        { id: 'comment-002', nickname: '志愿者001', content: '已同步到DNA数据库比对，请家属耐心等待。', type: 'normal', createdAt: now - 100 * day },
        { id: 'comment-003', nickname: '爱心妈妈', content: '太揪心了，帮你转发到我所有群里。', type: 'normal', createdAt: now - 300 * day }
      ]
    },
    {
      id: 'mock-reunited-002',
      name: '小雨',
      gender: '女',
      birthDate: '2012-07-08',
      missingDate: '2022-01-10',
      missingLocation: '四川省成都市武侯区',
      latitude: 30.6571,
      longitude: 104.0657,
      description: '身高140cm左右，长发，扎马尾辫。失踪时穿粉色羽绒服、蓝色牛仔裤。性格内向，说话声音较小。',
      features: '左眼角有一颗明显黑痣',
      photos: ['images/xiaoyu.webp'],
      contactName: '张女士',
      contactPhone: '13900139000',
      contactEmail: 'zhang@example.com',
      status: 'reunited',
      createdAt: now - 200 * day,
      updatedAt: now - 60 * day,
      reunion: {
        date: '2024-11-20',
        location: '四川省成都市温江区',
        latitude: 30.6938,
        longitude: 103.8398,
        reunitedPhotos: ['images/xiaoyu_reunion.webp'],
        story: '小雨在失踪近两年后，通过人脸识别系统在成都温江区被发现。被发现时正在一家餐馆工作，经过DNA比对确认身份后，小雨终于与泪流满面的父母团聚。',
        missingDuration: 710,
        keyCommentId: null,
        familyMessage: '感谢人脸识别技术，感谢每一位为寻找小雨付出努力的好心人，你们是我们家的恩人。'
      },
      comments: [
        { id: 'c2-001', nickname: '成都网友', content: '见过这个特征的女孩，在温江一个小吃店打零工。', type: 'clue', createdAt: now - 65 * day },
        { id: 'c2-002', nickname: '路人', content: '帮转，希望早日回家。', type: 'normal', createdAt: now - 150 * day }
      ]
    },
    {
      id: 'mock-reunited-003',
      name: '阿强',
      gender: '男',
      birthDate: '2008-11-20',
      missingDate: '2018-05-15',
      missingLocation: '河南省郑州市金水区',
      latitude: 34.7811,
      longitude: 113.6656,
      description: '失踪时身高约155cm，体型偏瘦，皮肤较白，会说河南口音。左臂有烫伤疤痕。',
      features: '左臂有明显烫伤疤痕',
      photos: ['images/aqiang.webp'],
      contactName: '李先生',
      contactPhone: '13700137000',
      contactEmail: 'li@example.com',
      status: 'reunited',
      createdAt: now - 800 * day,
      updatedAt: now - 15 * day,
      reunion: {
        date: '2025-01-10',
        location: '河南省洛阳市',
        latitude: 34.6197,
        longitude: 112.4540,
        reunitedPhotos: ['images/aqiang_reunion.webp'],
        story: '阿强失踪6年多后，在河南洛阳被一位好心的店主发现。店主看到寻亲信息后，觉得自己店里的一名员工很符合描述，于是联系了家属。经过DNA比对，确认了身份。',
        missingDuration: 2432,
        keyCommentId: null,
        familyMessage: '6年了，我们从来没有放弃过寻找。感谢那位好心的店主，也感谢平台让我们一家人重新团聚。'
      },
      comments: [
        { id: 'c3-001', nickname: '洛阳店主', content: '我店里有个员工很像照片里的人，左臂也有烫伤疤。', type: 'confirm', createdAt: now - 20 * day },
        { id: 'c3-002', nickname: '志愿者A', content: '请私信我具体联系方式，我们帮你确认。', type: 'normal', createdAt: now - 18 * day }
      ]
    },
    {
      id: 'mock-reunited-004',
      name: '小华',
      gender: '男',
      birthDate: '2014-02-12',
      missingDate: '2019-06-01',
      missingLocation: '湖南省长沙市岳麓区',
      latitude: 28.2284,
      longitude: 112.9388,
      description: '失踪时身高约90cm，圆脸，大眼睛，爱笑。身穿黄色小熊图案T恤，蓝色背带裤。',
      features: '右眼下方有小痣',
      photos: ['images/xiaohua.webp'],
      contactName: '陈先生',
      contactPhone: '13600136000',
      contactEmail: 'chen@example.com',
      status: 'reunited',
      createdAt: now - 1000 * day,
      updatedAt: now - 45 * day,
      reunion: {
        date: '2024-12-25',
        location: '湖南省长沙市岳麓区',
        latitude: 28.2284,
        longitude: 112.9388,
        reunitedPhotos: ['images/xiaohua_reunion.webp'],
        story: '小华在失踪5年半后，通过警方跨区域协作和DNA比对被找到。被发现时由一对没有子女的老夫妇抚养，生活条件尚可。经过法院协调，小华回到了亲生父母身边。',
        missingDuration: 2034,
        keyCommentId: null,
        familyMessage: '圣诞节是我们最难忘的一天，感谢所有好心人，感谢平台，你们给了我们最好的圣诞礼物。'
      },
      comments: [
        { id: 'c4-001', nickname: '老邻居', content: '记得这孩子，天天在楼下玩，希望早日回家。', type: 'normal', createdAt: now - 900 * day }
      ]
    },
    {
      id: 'mock-reunited-005',
      name: '晓燕',
      gender: '女',
      birthDate: '2010-09-05',
      missingDate: '2021-03-15',
      missingLocation: '江苏省南京市鼓楼区',
      latitude: 32.0603,
      longitude: 118.7969,
      description: '身高150cm左右，戴一副粉色边框眼镜，喜欢画画。失踪时背着蓝白相间的书包。',
      features: '鼻梁较高，笑起来有小酒窝',
      photos: ['images/xiaoyan.webp'],
      contactName: '吴女士',
      contactPhone: '13500135000',
      contactEmail: 'wu@example.com',
      status: 'reunited',
      createdAt: now - 350 * day,
      updatedAt: now - 100 * day,
      reunion: {
        date: '2025-02-01',
        location: '江苏省南京市江宁区',
        latitude: 31.9326,
        longitude: 118.8527,
        reunitedPhotos: ['images/xiaoyan_reunion.webp'],
        story: '晓燕因在学校受委屈后离家出走，被南京江宁区一位好心人收留。好心人看到网上的寻亲信息后，主动联系了家属。经过3年多的分离，晓燕终于与家人团聚。',
        missingDuration: 1419,
        keyCommentId: null,
        familyMessage: '女儿终于回家了，感谢那位好心收留的叔叔，感谢每一个为我们祈祷的人。'
      },
      comments: [
        { id: 'c5-001', nickname: '江宁居民', content: '好像在哪里见过这个孩子。', type: 'clue', createdAt: now - 110 * day }
      ]
    },

    // ======== 正在寻找中的案例 ========
    {
      id: 'mock-missing-001',
      name: '豆豆',
      gender: '男',
      birthDate: '2018-05-20',
      missingDate: '2025-01-05',
      missingLocation: '北京市海淀区中关村',
      latitude: 39.9847,
      longitude: 116.3107,
      description: '身高约95cm，短头发，皮肤较白。失踪时穿着红色羽绒服、深蓝色牛仔裤，脚穿黑色棉鞋。会说普通话，知道自己的名字。',
      features: '脖子上有一颗小黑痣',
      photos: ['images/doudou.webp'],
      contactName: '赵女士',
      contactPhone: '15811112222',
      contactEmail: 'zhao@example.com',
      status: 'missing',
      createdAt: now - 5 * day,
      updatedAt: now - 5 * day,
      comments: [
        { id: 'm1-001', nickname: '海淀居民', content: '前几天好像在地铁站看到过一个长得很像的孩子，当时以为是跟着妈妈的。', type: 'clue', createdAt: now - 3 * day },
        { id: 'm1-002', nickname: '好心人', content: '帮你转发，希望宝贝早日回家。', type: 'normal', createdAt: now - 2 * day }
      ]
    },
    {
      id: 'mock-missing-002',
      name: '朵朵',
      gender: '女',
      birthDate: '2015-12-10',
      missingDate: '2024-10-15',
      missingLocation: '上海市浦东新区陆家嘴',
      latitude: 31.2397,
      longitude: 121.4994,
      description: '身高约130cm，扎两个小辫子，会说上海话和普通话。失踪时穿粉色外套、白色毛衣和格子裙。',
      features: '右手上有一道小伤疤',
      photos: ['images/duoduo.webp'],
      contactName: '周先生',
      contactPhone: '15622223333',
      contactEmail: 'zhou@example.com',
      status: 'missing',
      createdAt: now - 18 * day,
      updatedAt: now - 18 * day,
      comments: [
        { id: 'm2-001', nickname: '浦东居民', content: '帮留意，太可怜了。', type: 'normal', createdAt: now - 15 * day }
      ]
    },
    {
      id: 'mock-missing-003',
      name: '阿伟',
      gender: '男',
      birthDate: '1995-06-15',
      missingDate: '2023-08-20',
      missingLocation: '浙江省杭州市西湖区',
      latitude: 30.2741,
      longitude: 120.1551,
      description: '成年人失踪，身高约175cm，体型中等，戴眼镜。失踪时穿灰色西装，据家属反映当时精神状态不佳。',
      features: '右手戴一块银色手表',
      photos: ['images/awei.webp'],
      contactName: '徐女士',
      contactPhone: '15733334444',
      contactEmail: 'xu@example.com',
      status: 'missing',
      createdAt: now - 80 * day,
      updatedAt: now - 80 * day,
      comments: []
    },
    {
      id: 'mock-missing-004',
      name: '小美',
      gender: '女',
      birthDate: '2017-01-25',
      missingDate: '2024-09-10',
      missingLocation: '湖北省武汉市武昌区',
      latitude: 30.5545,
      longitude: 114.3060,
      description: '身高约120cm，长发，喜欢穿裙子。失踪时穿白色连衣裙，佩戴粉色发夹。',
      features: '笑起来右侧有小酒窝',
      photos: ['images/xiaomei.webp'],
      contactName: '黄先生',
      contactPhone: '15844445555',
      contactEmail: 'huang@example.com',
      status: 'missing',
      createdAt: now - 60 * day,
      updatedAt: now - 60 * day,
      comments: [
        { id: 'm4-001', nickname: '武汉网友', content: '在黄鹤楼附近见过一个穿白裙子的小女孩。', type: 'clue', createdAt: now - 50 * day }
      ]
    },
    {
      id: 'mock-missing-005',
      name: '小宝',
      gender: '男',
      birthDate: '2019-11-08',
      missingDate: '2025-02-18',
      missingLocation: '陕西省西安市雁塔区',
      latitude: 34.2286,
      longitude: 108.9415,
      description: '年龄较小，身高约85cm。失踪时穿蓝色连体衣、灰色帽子，被一位女性牵走。',
      features: '头顶有两个发旋',
      photos: ['images/xiaobao.webp'],
      contactName: '马先生',
      contactPhone: '15955556666',
      contactEmail: 'ma@example.com',
      status: 'missing',
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
      comments: [
        { id: 'm5-001', nickname: '路人甲', content: '天哪，这么小的孩子！帮你扩散。', type: 'normal', createdAt: now - 1 * day },
        { id: 'm5-002', nickname: '西安志愿者', content: '已转发到西安本地寻人群，大家注意留意。', type: 'normal', createdAt: now - 1 * day }
      ]
    },
    {
      id: 'mock-missing-006',
      name: '婷婷',
      gender: '女',
      birthDate: '2005-03-22',
      missingDate: '2024-07-01',
      missingLocation: '山东省济南市历下区',
      latitude: 36.6512,
      longitude: 117.1201,
      description: '身高约160cm，高中生。因与家人吵架离家出走，未携带任何证件。当时穿校服。',
      features: '左耳佩戴小耳环',
      photos: ['images/tingting.webp'],
      contactName: '孙女士',
      contactPhone: '15666667777',
      contactEmail: 'sun@example.com',
      status: 'missing',
      createdAt: now - 100 * day,
      updatedAt: now - 100 * day,
      comments: [
        { id: 'm6-001', nickname: '济南居民', content: '孩子叛逆期，可能在同学家或网吧。', type: 'normal', createdAt: now - 95 * day }
      ]
    }
  ];
}
