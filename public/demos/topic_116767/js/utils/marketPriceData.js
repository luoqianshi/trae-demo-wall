var MarketPriceData = (function() {
    'use strict';

    var CATEGORIES = {
        plumbing: '水电改造',
        tiling: '泥瓦工程',
        carpentry: '木工工程',
        painting: '油漆工程',
        mainMaterials: '主材类',
        softDecoration: '软装类',
        labor: '人工费用'
    };

    var PRICE_DATA = [
        {
            id: 'plumbing-1',
            name: '水电改造（全改）',
            category: 'plumbing',
            unit: '㎡',
            priceLow: 80,
            priceMid: 120,
            priceHigh: 180,
            priceUnit: '元/㎡',
            factors: ['房屋面积', '改造复杂度', '材料品牌', '城市等级', '是否开槽'],
            tips: ['优先选国标电线和PPR水管', '水电走顶便于维修', '强弱电间距至少30cm', '做完一定要拍走向图']
        },
        {
            id: 'plumbing-2',
            name: '水电改造（局部改）',
            category: 'plumbing',
            unit: '㎡',
            priceLow: 40,
            priceMid: 60,
            priceHigh: 90,
            priceUnit: '元/㎡',
            factors: ['改动范围', '原有线路状况', '材料品牌', '施工难度'],
            tips: ['局部改要注意新旧线路连接', '建议更换老旧入户线', '插座回路单独走', '卫生间等电位要接好']
        },
        {
            id: 'plumbing-3',
            name: '强电箱更换',
            category: 'plumbing',
            unit: '个',
            priceLow: 500,
            priceMid: 800,
            priceHigh: 1500,
            priceUnit: '元/个',
            factors: ['回路数量', '品牌档次', '是否含漏电保护', '安装难度'],
            tips: ['正泰、德力西性价比高', '施耐德、ABB品质好', '至少8个回路', '空调、厨房单独回路']
        },
        {
            id: 'plumbing-4',
            name: '弱电布线',
            category: 'plumbing',
            unit: '项',
            priceLow: 1000,
            priceMid: 2000,
            priceHigh: 4000,
            priceUnit: '元/项',
            factors: ['点位数量', '线材类型', '是否穿管', '施工难度'],
            tips: ['超六类网线是标配', '每个房间至少一个网口', '电视线可以省了用网络电视', '弱电箱要留电源']
        },
        {
            id: 'tiling-1',
            name: '贴墙砖（普通）',
            category: 'tiling',
            unit: '㎡',
            priceLow: 50,
            priceMid: 70,
            priceHigh: 100,
            priceUnit: '元/㎡（人工）',
            factors: ['砖的规格', '铺贴方式', '墙面平整度', '是否要碰角'],
            tips: ['贴砖前墙面要拉毛', '瓷砖要泡水（除了仿古砖）', '留缝2-3mm美缝更好看', '空鼓率不能超过5%']
        },
        {
            id: 'tiling-2',
            name: '贴地砖（普通）',
            category: 'tiling',
            unit: '㎡',
            priceLow: 45,
            priceMid: 60,
            priceHigh: 85,
            priceUnit: '元/㎡（人工）',
            factors: ['砖的规格', '铺贴方式', '地面平整度', '是否要拼花'],
            tips: ['地砖要干铺法更平整', '卫生间坡度要找好', '铺贴完24小时不能踩', '美缝要等砖干透再做']
        },
        {
            id: 'tiling-3',
            name: '贴大砖（600x1200以上）',
            category: 'tiling',
            unit: '㎡',
            priceLow: 80,
            priceMid: 120,
            priceHigh: 180,
            priceUnit: '元/㎡（人工）',
            factors: ['砖的尺寸', '铺贴方式', '是否薄贴', '墙面找平难度'],
            tips: ['大砖建议薄贴法', '必须用瓷砖胶', '墙面要先找平', '工人手艺很重要']
        },
        {
            id: 'tiling-4',
            name: '防水工程',
            category: 'tiling',
            unit: '㎡',
            priceLow: 40,
            priceMid: 60,
            priceHigh: 100,
            priceUnit: '元/㎡',
            factors: ['防水材料', '涂刷遍数', '墙面高度', '施工难度'],
            tips: ['卫生间墙面至少刷1.8米', '厨房刷30cm高', '闭水试验至少48小时', '门口要做挡水槛']
        },
        {
            id: 'tiling-5',
            name: '包立管',
            category: 'tiling',
            unit: '根',
            priceLow: 200,
            priceMid: 350,
            priceHigh: 500,
            priceUnit: '元/根',
            factors: ['管道数量', '包管方式', '是否贴砖', '层高'],
            tips: ['红砖包管最结实', '隔音棉要包好', '检修口要留好', '贴砖要和墙面统一']
        },
        {
            id: 'carpentry-1',
            name: '石膏板吊顶（平面）',
            category: 'carpentry',
            unit: '㎡',
            priceLow: 80,
            priceMid: 120,
            priceHigh: 180,
            priceUnit: '元/㎡',
            factors: ['吊顶高度', '是否造型', '龙骨材质', '石膏板品牌'],
            tips: ['轻钢龙骨比木龙骨好', '石膏板选龙牌或可耐福', '接缝要贴牛皮纸防裂', '转角要用整板切割']
        },
        {
            id: 'carpentry-2',
            name: '石膏线',
            category: 'carpentry',
            unit: 'm',
            priceLow: 15,
            priceMid: 25,
            priceHigh: 40,
            priceUnit: '元/米',
            factors: ['线条宽度', '花纹复杂度', '材质（石膏/PU）', '安装高度'],
            tips: ['简约风选素面线条', '欧式风可以选花纹款', 'PU线比石膏线轻', '安装要对角拼花']
        },
        {
            id: 'carpentry-3',
            name: '定制衣柜（颗粒板）',
            category: 'carpentry',
            unit: '㎡',
            priceLow: 600,
            priceMid: 900,
            priceHigh: 1400,
            priceUnit: '元/㎡（投影）',
            factors: ['板材品牌', '五金配件', '门型款式', '是否含安装'],
            tips: ['选E0级或ENF级板材', '铰链选海蒂诗或百隆', '挂衣区要多', '抽屉在中间最顺手']
        },
        {
            id: 'carpentry-4',
            name: '定制衣柜（多层实木板）',
            category: 'carpentry',
            unit: '㎡',
            priceLow: 900,
            priceMid: 1300,
            priceHigh: 2000,
            priceUnit: '元/㎡（投影）',
            factors: ['木材种类', '环保等级', '五金品牌', '门型工艺'],
            tips: ['多层板防潮比颗粒板好', '衣柜深度要60cm', '背板用9mm就够', '见光板要加钱']
        },
        {
            id: 'carpentry-5',
            name: '定制橱柜',
            category: 'carpentry',
            unit: '延米',
            priceLow: 1200,
            priceMid: 2000,
            priceHigh: 3500,
            priceUnit: '元/延米',
            factors: ['柜体材质', '台面材质', '五金配件', '品牌档次'],
            tips: ['石英石台面是标配', '地柜用多层板防潮', '拉篮要装碗篮和调味篮', '水槽台下盆更好打理']
        },
        {
            id: 'painting-1',
            name: '墙面乳胶漆（含腻子）',
            category: 'painting',
            unit: '㎡',
            priceLow: 25,
            priceMid: 40,
            priceHigh: 70,
            priceUnit: '元/㎡（人工+辅材）',
            factors: ['墙面状况', '腻子遍数', '乳胶漆档次', '是否调色'],
            tips: ['腻子至少两遍', '底漆一定要刷', '选净味或儿童漆', '颜色要选比色卡浅一度']
        },
        {
            id: 'painting-2',
            name: '墙面乳胶漆（仅人工）',
            category: 'painting',
            unit: '㎡',
            priceLow: 12,
            priceMid: 18,
            priceHigh: 30,
            priceUnit: '元/㎡',
            factors: ['墙面平整度', '施工难度', '是否有造型', '城市等级'],
            tips: ['喷漆比刷漆均匀但费漆', '滚涂性价比最高', '阴阳角要找直', '完工后要通风']
        },
        {
            id: 'painting-3',
            name: '壁纸铺贴',
            category: 'painting',
            unit: '㎡',
            priceLow: 15,
            priceMid: 25,
            priceHigh: 40,
            priceUnit: '元/㎡（人工）',
            factors: ['壁纸类型', '墙面基础', '拼花难度', '是否对花'],
            tips: ['壁纸要选环保的', '基膜一定要刷', '无纺布性价比最高', '墙布更耐用但贵']
        },
        {
            id: 'painting-4',
            name: '艺术漆/微水泥',
            category: 'painting',
            unit: '㎡',
            priceLow: 150,
            priceMid: 250,
            priceHigh: 400,
            priceUnit: '元/㎡',
            factors: ['工艺类型', '材料品牌', '施工难度', '效果要求'],
            tips: ['微水泥适合极简风', '艺术漆质感更强', '一定要先看样板', '找专业团队施工']
        },
        {
            id: 'mainMaterials-1',
            name: '瓷砖（中档）',
            category: 'mainMaterials',
            unit: '㎡',
            priceLow: 80,
            priceMid: 150,
            priceHigh: 250,
            priceUnit: '元/㎡',
            factors: ['品牌', '规格', '产地', '工艺'],
            tips: ['广东砖质量普遍更好', '玻化砖耐磨适合客厅', '厨卫选防滑砖', '别买太便宜的辐射可能超标']
        },
        {
            id: 'mainMaterials-2',
            name: '实木复合地板',
            category: 'mainMaterials',
            unit: '㎡',
            priceLow: 150,
            priceMid: 250,
            priceHigh: 400,
            priceUnit: '元/㎡',
            factors: ['表层厚度', '品牌', '木材种类', '是否含安装'],
            tips: ['表层3mm以上性价比高', '圣象、大自然是一线', '锁扣比平扣好', '安装前地面要平整']
        },
        {
            id: 'mainMaterials-3',
            name: '实木地板',
            category: 'mainMaterials',
            unit: '㎡',
            priceLow: 300,
            priceMid: 500,
            priceHigh: 800,
            priceUnit: '元/㎡',
            factors: ['木材种类', '品牌', '规格', '工艺'],
            tips: ['番龙眼、圆盘豆性价比高', '橡木、柚木更贵', '要打龙骨安装', '每年要打蜡保养']
        },
        {
            id: 'mainMaterials-4',
            name: '室内木门（中档）',
            category: 'mainMaterials',
            unit: '樘',
            priceLow: 1000,
            priceMid: 1800,
            priceHigh: 3000,
            priceUnit: '元/樘',
            factors: ['材质', '品牌', '五金配件', '是否含安装'],
            tips: ['TATA、梦天是一线', '实木复合门性价比最高', '门锁选静音的', '要注意门套材质']
        },
        {
            id: 'mainMaterials-5',
            name: '卫生间洁具三件套',
            category: 'mainMaterials',
            unit: '套',
            priceLow: 2000,
            priceMid: 5000,
            priceHigh: 10000,
            priceUnit: '元/套',
            factors: ['品牌', '材质', '功能', '款式'],
            tips: ['九牧、恒洁性价比高', '科勒、TOTO是高端', '马桶选虹吸式', '花洒选恒温款']
        },
        {
            id: 'mainMaterials-6',
            name: '厨房水槽+龙头',
            category: 'mainMaterials',
            unit: '套',
            priceLow: 500,
            priceMid: 1200,
            priceHigh: 2500,
            priceUnit: '元/套',
            factors: ['材质', '品牌', '尺寸', '功能'],
            tips: ['304不锈钢是标配', '大单槽比双槽好用', '台下盆更好打理', '抽拉龙头很实用']
        },
        {
            id: 'softDecoration-1',
            name: '客厅沙发（三人位）',
            category: 'softDecoration',
            unit: '套',
            priceLow: 2000,
            priceMid: 5000,
            priceHigh: 12000,
            priceUnit: '元/套',
            factors: ['材质', '品牌', '尺寸', '功能'],
            tips: ['布艺沙发性价比高', '真皮沙发更显档次', '乳胶坐垫更舒服', '尺寸要量好电梯能不能进']
        },
        {
            id: 'softDecoration-2',
            name: '餐桌椅（一桌四椅）',
            category: 'softDecoration',
            unit: '套',
            priceLow: 1500,
            priceMid: 3500,
            priceHigh: 8000,
            priceUnit: '元/套',
            factors: ['材质', '品牌', '尺寸', '风格'],
            tips: ['岩板餐桌好打理', '实木餐桌更有质感', '椅子要试坐舒服', '高度要和餐桌匹配']
        },
        {
            id: 'softDecoration-3',
            name: '床+床垫（1.8米）',
            category: 'softDecoration',
            unit: '套',
            priceLow: 2000,
            priceMid: 6000,
            priceHigh: 15000,
            priceUnit: '元/套',
            factors: ['材质', '品牌', '尺寸', '功能'],
            tips: ['床垫比床架重要', '弹簧床垫选独立袋的', '乳胶床垫更贴合', '一定要试躺再买']
        },
        {
            id: 'softDecoration-4',
            name: '全屋窗帘',
            category: 'softDecoration',
            unit: '套',
            priceLow: 2000,
            priceMid: 5000,
            priceHigh: 10000,
            priceUnit: '元/全屋',
            factors: ['材质', '品牌', '尺寸', '工艺'],
            tips: ['客厅选遮光性好的', '卧室选全遮光的', '纱帘很实用', '罗马杆比轨道好看']
        },
        {
            id: 'labor-1',
            name: '拆除工',
            category: 'labor',
            unit: '天',
            priceLow: 280,
            priceMid: 350,
            priceHigh: 450,
            priceUnit: '元/天',
            factors: ['城市等级', '拆除难度', '是否含清运', '工作时长'],
            tips: ['找专业拆除队', '承重墙不能拆', '拆除前要关水电', '垃圾要及时清运']
        },
        {
            id: 'labor-2',
            name: '水电工',
            category: 'labor',
            unit: '天',
            priceLow: 350,
            priceMid: 420,
            priceHigh: 550,
            priceUnit: '元/天',
            factors: ['城市等级', '技术水平', '工作内容', '是否包辅料'],
            tips: ['要找持证电工', '水路要打压试验', '电路要摇表测绝缘', '施工完要画走向图']
        },
        {
            id: 'labor-3',
            name: '瓦工',
            category: 'labor',
            unit: '天',
            priceLow: 400,
            priceMid: 480,
            priceHigh: 600,
            priceUnit: '元/天',
            factors: ['城市等级', '技术水平', '铺贴难度', '是否包辅料'],
            tips: ['瓦工手艺很重要', '贴完要检查空鼓', '阴阳角要找直', '碰角比阳角线好看']
        },
        {
            id: 'labor-4',
            name: '木工',
            category: 'labor',
            unit: '天',
            priceLow: 380,
            priceMid: 450,
            priceHigh: 580,
            priceUnit: '元/天',
            factors: ['城市等级', '技术水平', '工作内容', '是否包辅料'],
            tips: ['定制家具比现场做效果好', '现场做要注意板材环保', '收口工艺很考验手艺', '五金要买好的']
        },
        {
            id: 'labor-5',
            name: '油工',
            category: 'labor',
            unit: '天',
            priceLow: 320,
            priceMid: 400,
            priceHigh: 520,
            priceUnit: '元/天',
            factors: ['城市等级', '技术水平', '墙面状况', '是否包辅料'],
            tips: ['油工要找细心的', '阴阳角要用靠尺', '砂纸要打磨到位', '乳胶漆要兑水适中']
        }
    ];

    function getAllPrices() {
        return PRICE_DATA.slice();
    }

    function getByCategory(category) {
        if (!category) return [];
        var result = [];
        for (var i = 0; i < PRICE_DATA.length; i++) {
            if (PRICE_DATA[i].category === category) {
                result.push(PRICE_DATA[i]);
            }
        }
        return result;
    }

    function getPriceById(id) {
        if (!id) return null;
        for (var i = 0; i < PRICE_DATA.length; i++) {
            if (PRICE_DATA[i].id === id) {
                return PRICE_DATA[i];
            }
        }
        return null;
    }

    function searchPrices(keyword) {
        if (!keyword) return PRICE_DATA.slice();
        var lowerKeyword = String(keyword).toLowerCase();
        var result = [];
        for (var i = 0; i < PRICE_DATA.length; i++) {
            var item = PRICE_DATA[i];
            var nameMatch = item.name.toLowerCase().indexOf(lowerKeyword) !== -1;
            var categoryName = CATEGORIES[item.category] || '';
            var categoryMatch = categoryName.toLowerCase().indexOf(lowerKeyword) !== -1;
            if (nameMatch || categoryMatch) {
                result.push(item);
            }
        }
        return result;
    }

    function getCategoryName(categoryId) {
        return CATEGORIES[categoryId] || categoryId;
    }

    function getAllCategories() {
        var result = [];
        for (var key in CATEGORIES) {
            if (CATEGORIES.hasOwnProperty(key)) {
                result.push({
                    id: key,
                    name: CATEGORIES[key]
                });
            }
        }
        return result;
    }

    function matchPriceByName(name) {
        if (!name) return null;
        var lowerName = String(name).toLowerCase();
        var bestMatch = null;
        var bestScore = 0;
        
        for (var i = 0; i < PRICE_DATA.length; i++) {
            var item = PRICE_DATA[i];
            var itemName = item.name.toLowerCase();
            var score = 0;
            
            if (itemName === lowerName) {
                score = 100;
            } else if (itemName.indexOf(lowerName) !== -1 || lowerName.indexOf(itemName) !== -1) {
                score = 50;
            }
            
            var keywords = item.name.split(/[（）()\s]+/);
            for (var j = 0; j < keywords.length; j++) {
                var kw = keywords[j].toLowerCase();
                if (kw && lowerName.indexOf(kw) !== -1 && kw.length >= 2) {
                    score = Math.max(score, 30);
                }
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = item;
            }
        }
        
        return bestScore >= 30 ? bestMatch : null;
    }

    function getPriceStatus(unitPrice, priceItem) {
        if (!priceItem || !unitPrice) return 'normal';
        if (unitPrice > priceItem.priceHigh) {
            return 'high';
        } else if (unitPrice < priceItem.priceLow) {
            return 'low';
        } else {
            return 'normal';
        }
    }

    return {
        CATEGORIES: CATEGORIES,
        getAllPrices: getAllPrices,
        getByCategory: getByCategory,
        getPriceById: getPriceById,
        searchPrices: searchPrices,
        getCategoryName: getCategoryName,
        getAllCategories: getAllCategories,
        matchPriceByName: matchPriceByName,
        getPriceStatus: getPriceStatus
    };
})();
