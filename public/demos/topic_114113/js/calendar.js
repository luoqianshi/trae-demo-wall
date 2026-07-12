var Calendar = {
    SHEN_XIAO: ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪'],
    JIE_QI: ['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'],
    SHI_CHEN: ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'],
    SHI_CHEN_TIME: ['23:00-01:00', '01:00-03:00', '03:00-05:00', '05:00-07:00', '07:00-09:00', '09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00', '21:00-23:00'],
    FANG_WEI: ['东', '东南', '南', '西南', '西', '西北', '北', '东北'],
    
    YI_JI_MAP: {
        '嫁娶': { icon: '💍', desc: '结婚、订婚吉利' },
        '纳采': { icon: '💍', desc: '提亲、定婚' },
        '订盟': { icon: '🤝', desc: '签订盟约' },
        '祭祀': { icon: '🕯️', desc: '拜神、祭祖' },
        '祈福': { icon: '🙏', desc: '祈求平安福气' },
        '求嗣': { icon: '👶', desc: '求子、求后代' },
        '开光': { icon: '✨', desc: '佛像、物品开光' },
        '出行': { icon: '🚗', desc: '出门、旅游' },
        '搬家': { icon: '🏠', desc: '搬新家' },
        '移徙': { icon: '🏠', desc: '搬家、迁徙' },
        '入宅': { icon: '🏠', desc: '搬进新居' },
        '安床': { icon: '🛏️', desc: '安放床铺' },
        '拆卸': { icon: '🔨', desc: '拆旧房、装修' },
        '修造': { icon: '🔨', desc: '修缮、建造' },
        '动土': { icon: '⛏️', desc: '破土动工' },
        '破土': { icon: '⛏️', desc: '开挖地基' },
        '安葬': { icon: '⚰️', desc: '下葬、安葬' },
        '破土安葬': { icon: '⚰️', desc: '下葬、安葬' },
        '开业': { icon: '🎊', desc: '开店、开张' },
        '开张': { icon: '🎊', desc: '新店开业' },
        '开市': { icon: '🎊', desc: '做生意开门' },
        '立券': { icon: '📄', desc: '签合同、立字据' },
        '交易': { icon: '💰', desc: '做买卖、交易' },
        '纳财': { icon: '💰', desc: '收钱、进财' },
        '纳畜': { icon: '🐑', desc: '买牲口、养宠物' },
        '牧养': { icon: '🐑', desc: '放牧、饲养' },
        '伐木': { icon: '🪓', desc: '砍树、伐木' },
        '作梁': { icon: '🏗️', desc: '建造房梁' },
        '行丧': { icon: '🙏', desc: '办丧事' },
        '除服': { icon: '🙏', desc: '脱去丧服' },
        '成服': { icon: '🙏', desc: '穿丧服' },
        '开光': { icon: '✨', desc: '神佛像开光' },
        '上梁': { icon: '🏗️', desc: '安装房梁' },
        '竖柱': { icon: '🏗️', desc: '立柱子' },
        '栽种': { icon: '🌱', desc: '种树、种菜' },
        '纳婿': { icon: '💍', desc: '招女婿' },
        '裁衣': { icon: '✂️', desc: '裁剪衣服' },
        '冠笄': { icon: '🎓', desc: '成年礼' },
        '会亲友': { icon: '👨👩👧👦', desc: '聚会、访友' },
        '理发': { icon: '💇', desc: '剪头发' },
        '沐浴': { icon: '🛁', desc: '洗澡、净身' },
        '扫舍': { icon: '🧹', desc: '打扫房间' },
        '修饰垣墙': { icon: '🧱', desc: '修补墙壁' },
        '平治道涂': { icon: '🛣️', desc: '修路' },
        '掘井': { icon: '⛲', desc: '挖水井' },
        '开仓': { icon: '📦', desc: '开仓库' },
        '出货': { icon: '📦', desc: '运货物' },
        '读书': { icon: '📚', desc: '学习、读书' },
        '入学': { icon: '🎒', desc: '上学、入学' },
        '求人': { icon: '🙋', desc: '请求别人帮忙' },
        '结婚': { icon: '💍', desc: '举行婚礼' },
        '装修': { icon: '🔨', desc: '房屋装修' },
        '开工': { icon: '🎊', desc: '开始工作' },
        '旅游': { icon: '✈️', desc: '外出旅游' },
        '乔迁': { icon: '🏠', desc: '搬到新家' },
        '上坟': { icon: '🙏', desc: '扫墓、祭祖' }
    },

    GIRI_TYPES: [
        { key: 'jiaqu', name: '嫁娶/结婚', icon: '💍' },
        { key: 'banjia', name: '搬家/入宅', icon: '🏠' },
        { key: 'kaiye', name: '开业/开工', icon: '🎊' },
        { key: 'chuxing', name: '出行/旅游', icon: '🚗' },
        { key: 'dongtu', name: '动土/装修', icon: '🔨' },
        { key: 'jisi', name: '祭祀/上坟', icon: '🕯️' },
        { key: 'anchuang', name: '安床/乔迁', icon: '🛏️' }
    ],

    GIRI_KEYWORDS: {
        'jiaqu': ['嫁娶', '结婚', '纳采', '订盟', '纳婿'],
        'banjia': ['搬家', '移徙', '入宅', '乔迁'],
        'kaiye': ['开业', '开张', '开市', '开工', '立券', '交易'],
        'chuxing': ['出行', '旅游'],
        'dongtu': ['动土', '修造', '装修', '破土', '拆卸'],
        'jisi': ['祭祀', '祈福', '上坟', '行丧'],
        'anchuang': ['安床', '上梁', '竖柱', '作梁']
    },

    PENG_ZU: {
        '甲': '甲不开仓财物耗散', '乙': '乙不栽植千株不长', '丙': '丙不修灶必见灾殃',
        '丁': '丁不剃头头必生疮', '戊': '戊不受田田主不祥', '己': '己不破券二比并亡',
        '庚': '庚不经络织机虚张', '辛': '辛不合酱主人不尝', '壬': '壬不决水更难提防',
        '癸': '癸不词讼理弱敌强', '子': '子不问卜自惹祸殃', '丑': '丑不冠带主不还乡',
        '寅': '寅不祭祀神鬼不尝', '卯': '卯不穿井水泉不香', '辰': '辰不哭泣必主重丧',
        '巳': '巳不远行财物伏藏', '午': '午不苫盖屋主更张', '未': '未不服药毒气入肠',
        '申': '申不安床鬼祟入房', '酉': '酉不会客醉坐颠狂', '戌': '戌不吃犬作怪上床',
        '亥': '亥不嫁娶不利新郎'
    },

    TAI_SHEN: [
        '占门碓外东南', '占门碓外东南', '占门碓外东北', '占门碓外东北',
        '占门碓外正南', '占门碓外正南', '占门碓外正北', '占门碓外正北',
        '占门碓外正东', '占门碓外正东', '占门碓外正西', '占门碓外正西',
        '房床厕外东南', '房床厕外东南', '房床厕外东北', '房床厕外东北',
        '房床厕外正南', '房床厕外正南', '房床厕外正北', '房床厕外正北',
        '房床厕外正东', '房床厕外正东', '房床厕外正西', '房床厕外正西',
        '仓库炉外东南', '仓库炉外东南', '仓库炉外东北', '仓库炉外东北',
        '仓库炉外正南', '仓库炉外正南', '仓库炉外正北', '仓库炉外正北',
        '仓库炉外正东', '仓库炉外正东', '仓库炉外正西', '仓库炉外正西',
        '厨灶门外东南', '厨灶门外东南', '厨灶门外东北', '厨灶门外东北',
        '厨灶门外正南', '厨灶门外正南', '厨灶门外正北', '厨灶门外正北',
        '厨灶门外正东', '厨灶门外正东', '厨灶门外正西', '厨灶门外正西'
    ],

    getAlmanac: function(date) {
        var solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
        var lunar = solar.getLunar();
        
        var dayGan = lunar.getDayGan ? lunar.getDayGan() : '';
        var dayZhi = lunar.getDayZhi ? lunar.getDayZhi() : '';
        var yearGan = lunar.getYearGan ? lunar.getYearGan() : '';
        var yearZhi = lunar.getYearZhi ? lunar.getYearZhi() : '';
        
        var yi = [];
        var ji = [];
        if (lunar.getDayYi) {
            try { yi = lunar.getDayYi(); } catch(e) { yi = []; }
        }
        if (lunar.getDayJi) {
            try { ji = lunar.getDayJi(); } catch(e) { ji = []; }
        }
        
        var yiList = yi && yi.length > 0 ? yi : ['诸事不宜'];
        var jiList = ji && ji.length > 0 ? ji : ['诸事不宜'];
        
        var chong = lunar.getDayChong ? lunar.getDayChong() : '';
        var sha = lunar.getDaySha ? lunar.getDaySha() : '';
        
        var jieqi = '';
        if (lunar.getJieQi) {
            try { jieqi = lunar.getJieQi(); } catch(e) { jieqi = ''; }
        }
        
        var festival = '';
        if (lunar.getFestivals) {
            try {
                var festivals = lunar.getFestivals();
                festival = festivals && festivals.length > 0 ? festivals[0] : '';
            } catch(e) { festival = ''; }
        }
        
        var wuxingGan = LunarUtil && LunarUtil.WU_XING_GAN && dayGan ? LunarUtil.WU_XING_GAN[dayGan] : '';
        var wuxingZhi = LunarUtil && LunarUtil.WU_XING_ZHI && dayZhi ? LunarUtil.WU_XING_ZHI[dayZhi] : '';
        var wuxing = (wuxingGan || '') + (wuxingZhi || '');
        
        var nayin = '';
        if (lunar.getDayNaYin) {
            try { nayin = lunar.getDayNaYin(); } catch(e) { nayin = ''; }
        }
        
        var pengzuGan = this.PENG_ZU[dayGan] || '';
        var pengzuZhi = this.PENG_ZU[dayZhi] || '';
        var pengzu = pengzuGan && pengzuZhi ? pengzuGan + ' ' + pengzuZhi : (pengzuGan || pengzuZhi || '');
        
        var taishenIndex = (yearGan.charCodeAt(0) - '甲'.charCodeAt(0)) * 12 + (yearZhi.charCodeAt(0) - '子'.charCodeAt(0));
        var taishen = this.TAI_SHEN[taishenIndex % 48] || '仓库床外东北';
        
        var shengxiao = this.SHEN_XIAO[(yearZhi.charCodeAt(0) - '子'.charCodeAt(0)) % 12];
        
        var caishen = this.getCaiShen(dayZhi);
        var xishen = this.getXishen(dayZhi);
        var fushen = this.getFuShen(dayGan);
        
        var dayShiChen = this.getShiChen(dayGan);
        
        var lunarYear = lunar.getYearInGanZhi ? lunar.getYearInGanZhi() : '';
        var lunarMonth = lunar.getMonthInChinese ? lunar.getMonthInChinese() : '';
        if (lunarMonth && !lunarMonth.includes('月')) {
            lunarMonth += '月';
        }
        var lunarDay = lunar.getDayInChinese ? lunar.getDayInChinese() : '';
        
        return {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            week: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
            lunarYear: lunarYear,
            lunarMonth: lunarMonth,
            lunarDay: lunarDay,
            lunarMonthDay: lunarMonth + lunarDay,
            ganzhi: yearGan + yearZhi + '年 ' + dayGan + dayZhi + '日',
            shengxiao: shengxiao,
            yi: yiList,
            ji: jiList,
            chong: chong,
            sha: sha,
            chongsha: '冲' + chong + '煞' + sha,
            jieqi: jieqi || '',
            festival: festival || '',
            wuxing: wuxing,
            nayin: nayin,
            pengzu: pengzu,
            taishen: taishen,
            caishen: caishen,
            xishen: xishen,
            fushen: fushen,
            shiChen: dayShiChen
        };
    },

    getCaiShen: function(dayZhi) {
        var caiShenMap = {
            '子': '正东', '丑': '正南', '寅': '东北', '卯': '正东',
            '辰': '东南', '巳': '正南', '午': '西南', '未': '西南',
            '申': '正西', '酉': '西北', '戌': '正北', '亥': '东北'
        };
        return caiShenMap[dayZhi] || '正东';
    },

    getXishen: function(dayZhi) {
        var xiShenMap = {
            '子': '西北', '丑': '西南', '寅': '正南', '卯': '东南',
            '辰': '东北', '巳': '东南', '午': '正南', '未': '西南',
            '申': '西北', '酉': '西南', '戌': '东北', '亥': '西北'
        };
        return xiShenMap[dayZhi] || '正南';
    },

    getFuShen: function(dayGan) {
        var fuShenMap = {
            '甲': '东北', '乙': '西北', '丙': '西南', '丁': '西南',
            '戊': '东南', '己': '东南', '庚': '西北', '辛': '西南',
            '壬': '东北', '癸': '东南'
        };
        return fuShenMap[dayGan] || '西北';
    },

    getShiChen: function(dayGan) {
        var ganIndex = '甲乙丙丁戊己庚辛壬癸'.indexOf(dayGan);
        var shiChenList = [];
        
        for (var i = 0; i < 12; i++) {
            var shiGanIndex = (ganIndex * 2 + i) % 10;
            var shiGan = '甲乙丙丁戊己庚辛壬癸'[shiGanIndex];
            var shiZhi = '子丑寅卯辰巳午未申酉戌亥'[i];
            
            var isJi = this.isShiChenJi(shiGan, shiZhi);
            
            shiChenList.push({
                name: this.SHI_CHEN[i],
                time: this.SHI_CHEN_TIME[i],
                ganzhi: shiGan + shiZhi,
                isJi: isJi,
                yi: this.getShiChenYi(this.SHI_CHEN[i])
            });
        }
        
        return shiChenList;
    },

    isShiChenJi: function(gan, zhi) {
        var jiPairs = [
            '子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥'
        ];
        return jiPairs.indexOf(zhi) !== -1;
    },

    getShiChenYi: function(shiChen) {
        var yiMap = {
            '子时': '祈福、祭祀', '丑时': '修造、安葬', '寅时': '出行、求财',
            '卯时': '祭祀、祈福', '辰时': '交易、出行', '巳时': '祭祀、祈福',
            '午时': '祭祀、祈福', '未时': '修造、安葬', '申时': '求财、交易',
            '酉时': '祭祀、祈福', '戌时': '修造、安葬', '亥时': '祈福、祭祀'
        };
        return yiMap[shiChen] || '诸事皆宜';
    },

    searchGiri: function(typeKey, months) {
        var today = new Date();
        var results = [];
        var keywords = this.GIRI_KEYWORDS[typeKey] || [];
        
        for (var m = 0; m < months; m++) {
            var targetDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
            var daysInMonth = new Date(today.getFullYear(), today.getMonth() + m + 1, 0).getDate();
            
            for (var d = 1; d <= daysInMonth; d++) {
                var date = new Date(today.getFullYear(), today.getMonth() + m, d);
                var almanac = this.getAlmanac(date);
                
                var isGood = false;
                for (var k = 0; k < keywords.length; k++) {
                    if (almanac.yi.indexOf(keywords[k]) !== -1) {
                        isGood = true;
                        break;
                    }
                }
                
                results.push({
                    date: date,
                    solar: date.getMonth() + 1 + '月' + date.getDate() + '日',
                    lunar: almanac.lunarMonthDay,
                    ganzhi: almanac.ganzhi,
                    yi: almanac.yi.slice(0, 3).join('、'),
                    ji: almanac.ji.slice(0, 2).join('、'),
                    chongsha: almanac.chongsha,
                    isGood: isGood
                });
            }
        }
        
        return results.sort(function(a, b) {
            return a.date.getTime() - b.date.getTime();
        });
    },

    getYijiInfo: function(keyword) {
        for (var key in this.YI_JI_MAP) {
            if (keyword.indexOf(key) !== -1 || key.indexOf(keyword) !== -1) {
                return this.YI_JI_MAP[key];
            }
        }
        return { icon: '📋', desc: '相关事宜' };
    },

    getFangweiPosition: function(fangwei) {
        var positions = {
            '北': { x: 100, y: 18 },
            '南': { x: 100, y: 182 },
            '东': { x: 182, y: 100 },
            '西': { x: 18, y: 100 },
            '东北': { x: 40, y: 40 },
            '西北': { x: 40, y: 160 },
            '东南': { x: 160, y: 40 },
            '西南': { x: 160, y: 160 }
        };
        return positions[fangwei] || { x: 100, y: 100 };
    },

    getDayDiff: function(date1, date2) {
        return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
    }
};