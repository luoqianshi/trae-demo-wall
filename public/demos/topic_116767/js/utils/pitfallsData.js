var PitfallsData = (function() {
    'use strict';

    var SEVERITY = {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low'
    };

    var SEVERITY_LABELS = {
        high: '高危',
        medium: '注意',
        low: '提醒'
    };

    var REGION_PITFALLS = {
        livingroom: [
            {
                id: 'livingroom-1',
                title: '插座位置不合理',
                description: '客厅插座数量不足或位置被沙发、电视柜挡住，入住后只能用插排凑合用，既不美观也不安全。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '装修过来人小王',
                        avatar: '👨',
                        content: '我家沙发两边都没留插座，手机充电只能拉个很长的插排，绊了好几次。后来在沙发旁边钻了明线，丑得要死！',
                        likes: 128,
                        verified: true
                    },
                    {
                        author: '设计师李工',
                        avatar: '👩‍🔧',
                        content: '做设计时一定要拿着家具尺寸图去核对插座位置，沙发3米长的话，插座要在沙发两头外面，别被挡住了。',
                        likes: 256,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-003',
                sopSteps: ['F-10'],
                tip: '宁多勿少，每个墙面至少2个插座'
            },
            {
                id: 'livingroom-2',
                title: '电视墙设计过度',
                description: '电视墙做了复杂的造型、灯带、护墙板，结果花了好几万，看久了还腻，换个风格都难。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '后悔药买不到',
                        avatar: '😅',
                        content: '我家电视墙做了大理石造型+灯带，花了3万，现在看各种土，想改都改不了，只能挂个大电视遮一遮。',
                        likes: 89,
                        verified: false
                    }
                ],
                knowledgeRef: 'design-001',
                sopSteps: ['F-15'],
                tip: '简单耐看才是王道，钱花在画质上更好'
            },
            {
                id: 'livingroom-3',
                title: '吊顶开裂',
                description: '吊顶做完没多久，接缝处就开裂了，修了又裂，很影响美观。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '家装监理老张',
                        avatar: '👴',
                        content: '吊顶开裂90%是因为工艺不到位：龙骨没固定牢、石膏板接缝没留V型槽、没贴牛皮纸/网格布。盯紧这几点基本不会裂。',
                        likes: 312,
                        verified: true
                    }
                ],
                knowledgeRef: 'prep-004',
                sopSteps: ['F-15'],
                tip: '轻钢龙骨+V型槽+贴网格布，三保险'
            },
            {
                id: 'livingroom-4',
                title: '地板色差大',
                description: '木地板铺完发现色差很大，有的深有的浅，看起来斑驳不堪。',
                severity: SEVERITY.LOW,
                experiences: [
                    {
                        author: '实木地板玩家',
                        avatar: '🪵',
                        content: '实木地板有色差是正常的，但色差太大就是商家把不同批次混着卖了。收货时开箱检查，色差大的直接拒收。',
                        likes: 67,
                        verified: false
                    }
                ],
                knowledgeRef: 'material-001',
                sopSteps: ['F-12'],
                tip: '铺之前把地板摊开挑一下，深浅搭配着铺'
            },
            {
                id: 'livingroom-5',
                title: '采光不足显压抑',
                description: '客厅采光不好，白天都要开灯，住起来很压抑。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '户型改造达人',
                        avatar: '💡',
                        content: '我把客厅和阳台之间的推拉门拆了，客厅瞬间亮了好多！如果不是承重墙，还可以考虑把厨房改成开放式的。',
                        likes: 198,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-005',
                sopSteps: ['F-6'],
                tip: '浅色系+反光材质+辅助光源，能救回不少'
            }
        ],

        bedroom: [
            {
                id: 'bedroom-1',
                title: '衣柜尺寸不合理',
                description: '衣柜深度不够、挂衣区太少、抽屉位置不对，用起来各种不顺手。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '收纳博主小美',
                        avatar: '👩',
                        content: '衣柜深度一定要60cm！我家第一套房子衣柜只有50cm深，挂衣服门都关不上。挂衣区要多，叠放区真的用得少。',
                        likes: 445,
                        verified: true
                    },
                    {
                        author: '定制柜踩坑王',
                        avatar: '😭',
                        content: '我家衣柜抽屉做在最下面，每次拿东西都要蹲下来，太不方便了。抽屉应该在腰部高度，用着最顺手。',
                        likes: 234,
                        verified: false
                    }
                ],
                knowledgeRef: 'design-004',
                sopSteps: ['F-8', 'F-14', 'F-19'],
                tip: '深度60cm、挂衣区占60%、抽屉在中间层'
            },
            {
                id: 'bedroom-2',
                title: '插座位置被挡',
                description: '床头插座被床头柜挡住了，或者高度不对，手机充电很不方便。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '夜猫子选手',
                        avatar: '📱',
                        content: '我家床头插座只留了30cm高，床头柜一放全挡住了！一定要算好床头柜高度，一般60-70cm高比较合适。',
                        likes: 367,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-003',
                sopSteps: ['F-10'],
                tip: '高度60-70cm，两边各2个插座+USB口'
            },
            {
                id: 'bedroom-3',
                title: '隔音效果差',
                description: '邻居说话、楼道走路声都能听见，晚上睡不好觉。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '睡眠浅的人',
                        avatar: '😴',
                        content: '我家挨着电梯井，晚上电梯嗡嗡响根本睡不着。后来加装了隔音棉+隔音门，好了很多。装修时就该考虑隔音的！',
                        likes: 156,
                        verified: false
                    }
                ],
                knowledgeRef: 'soft-002',
                sopSteps: ['F-16'],
                tip: '隔音门+隔音棉+厚窗帘，三重保障'
            },
            {
                id: 'bedroom-4',
                title: '空调直吹床头',
                description: '空调装在床头正上方，直吹人容易感冒，还有滴水隐患。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '空调安装师傅',
                        avatar: '🔧',
                        content: '空调最好装在床的侧面，不要正对床头。实在没办法的话，就装个挡风板，几块钱解决大问题。',
                        likes: 289,
                        verified: true
                    }
                ],
                knowledgeRef: 'prep-003',
                sopSteps: ['F-9'],
                tip: '装在侧面或对面墙，别直吹床头'
            },
            {
                id: 'bedroom-5',
                title: '主灯太亮刺眼',
                description: '卧室主灯瓦数太大，一开灯晃眼睛，完全没有温馨感。',
                severity: SEVERITY.LOW,
                experiences: [
                    {
                        author: '灯光设计师',
                        avatar: '💡',
                        content: '卧室千万别用又大又亮的吸顶灯！主灯选暖光、低亮度的，再加床头灯、灯带、筒灯等辅助光源，氛围才好。',
                        likes: 201,
                        verified: true
                    }
                ],
                knowledgeRef: 'soft-003',
                sopSteps: ['F-10', 'F-18'],
                tip: '无主灯设计+暖光+调光开关，幸福感爆棚'
            }
        ],

        kitchen: [
            {
                id: 'kitchen-1',
                title: '水电布局混乱',
                description: '厨房插座不够用、位置不合理，水电和橱柜设计没配合好，小电器只能拉插排。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '下厨达人阿花',
                        avatar: '👩‍🍳',
                        content: '我家厨房就4个插座，电饭锅、电水壶、微波炉、破壁机同时用根本不够！台面上方至少要留6-8个插座，带开关的那种。',
                        likes: 521,
                        verified: true
                    },
                    {
                        author: '橱柜设计师王哥',
                        avatar: '👨‍🔧',
                        content: '做橱柜前一定要先定好电器型号尺寸，水电点位根据橱柜设计来走，别先改完水电再做橱柜，十有八九对不上。',
                        likes: 378,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-003',
                sopSteps: ['F-10'],
                tip: '台面上方至少6个带开关插座，宁多勿少'
            },
            {
                id: 'kitchen-2',
                title: '收纳设计不足',
                description: '橱柜收纳空间不够、布局不合理，锅碗瓢盆没地方放，台面上堆得乱七八糟。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '收纳师林姐',
                        avatar: '📦',
                        content: '厨房收纳黄金原则：上墙+抽屉+拉篮。地柜用抽屉比柜门好用10倍，各种拉篮（碗篮、调味篮、转角拉篮）一定要装。',
                        likes: 445,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-004',
                sopSteps: ['F-8', 'F-19'],
                tip: '地柜尽量用抽屉，墙上装挂杆置物架'
            },
            {
                id: 'kitchen-3',
                title: '台面高度不合适',
                description: '台面太高架胳膊、太低弯腰累，做个饭腰酸背痛。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '家庭煮夫老李',
                        avatar: '👨',
                        content: '我身高175，台面做的80cm，切菜弯腰累得要死。应该按身高来：身高÷2+5cm，我家应该做92.5cm才对！',
                        likes: 312,
                        verified: false
                    }
                ],
                knowledgeRef: 'design-004',
                sopSteps: ['F-8'],
                tip: '身高÷2+5cm，洗菜区还可以再高5cm'
            },
            {
                id: 'kitchen-4',
                title: '防水没做到位',
                description: '厨房防水没做好，漏水到楼下，赔了钱还得返工。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '楼下受害者',
                        avatar: '💧',
                        content: '我家楼上厨房漏水，把我家吊顶泡坏了。厨房虽然不像卫生间那么多水，但洗菜池旁边还是容易渗水，防水至少做到30cm高。',
                        likes: 189,
                        verified: false
                    }
                ],
                knowledgeRef: 'prep-004',
                sopSteps: ['F-11'],
                tip: '地面满刷+墙面30cm高+水槽处1.2m高'
            },
            {
                id: 'kitchen-5',
                title: '油烟倒灌串味',
                description: '做饭时油烟排不出去，还经常闻到楼上楼下的菜味。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '油烟机安装工',
                        avatar: '🌀',
                        content: '油烟倒灌90%是因为止逆阀没装好或者根本没装。一定要装止逆阀，而且装完要测试一下，用打火机点张纸看看吸不吸。',
                        likes: 267,
                        verified: true
                    }
                ],
                knowledgeRef: 'soft-003',
                sopSteps: ['F-18', 'F-19'],
                tip: '止逆阀一定要装，选质量好的'
            }
        ],

        bathroom: [
            {
                id: 'bathroom-1',
                title: '防水工程不合格',
                description: '卫生间防水没做好，漏水到楼下，赔了钱还得砸砖重做，损失惨重。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '防水工人张师傅',
                        avatar: '🛠️',
                        content: '卫生间防水是重中之重：墙面至少刷1.8米，最好刷到顶；地面满刷，门口外翻30cm；刷2-3遍，每遍都要等干透；闭水试验一定要做48小时，去楼下看顶。',
                        likes: 567,
                        verified: true
                    },
                    {
                        author: '漏水受害者',
                        avatar: '😭',
                        content: '我家卫生间防水只刷了1米高，结果洗澡水溅到墙上，渗到隔壁卧室墙皮都掉了。千万别省这点钱，直接刷到顶！',
                        likes: 423,
                        verified: false
                    }
                ],
                knowledgeRef: 'prep-004',
                sopSteps: ['F-11'],
                tip: '墙面刷到顶+闭水48小时+门口挡水槛，一个都不能少'
            },
            {
                id: 'bathroom-2',
                title: '地漏位置不合理',
                description: '地漏不在最低点，地面积水排不出去，每次洗完澡都要扫水。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '瓦工李师傅',
                        avatar: '👷',
                        content: '地漏一定要在最低点，贴砖时要找好坡度，至少1%的坡度。可以先倒水试试，水往地漏流就对了，积水的话让工人返工。',
                        likes: 345,
                        verified: true
                    }
                ],
                knowledgeRef: 'prep-004',
                sopSteps: ['F-12'],
                tip: '贴完砖倒水测试，不积水才算合格'
            },
            {
                id: 'bathroom-3',
                title: '收纳空间不足',
                description: '卫生间瓶瓶罐罐太多，没地方放，台面上堆得乱糟糟。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '美妆博主Lily',
                        avatar: '💄',
                        content: '镜柜太香了！能藏起一堆瓶瓶罐罐，台面干干净净。还有壁龛，放洗浴用品正好，比置物架好打理多了。',
                        likes: 389,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-004',
                sopSteps: ['F-12', 'F-19'],
                tip: '镜柜+壁龛+台下盆抽屉，收纳翻倍'
            },
            {
                id: 'bathroom-4',
                title: '干湿分离没做好',
                description: '洗完澡整个卫生间都是水，湿漉漉的容易滑倒还容易发霉。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '洁癖患者',
                        avatar: '🧼',
                        content: '我家一开始只挂了浴帘，结果还是到处溅水。后来装了玻璃淋浴房，干爽多了。空间小的话可以用浴帘+挡水条，也比没有强。',
                        likes: 234,
                        verified: false
                    }
                ],
                knowledgeRef: 'design-001',
                sopSteps: ['F-12', 'F-18'],
                tip: '玻璃淋浴房>浴帘+挡水条>什么都没有'
            },
            {
                id: 'bathroom-5',
                title: '通风差易发霉',
                description: '卫生间没有窗户或者通风不好，洗完澡潮气散不出去，容易发霉有异味。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '暗卫改造达人',
                        avatar: '🌬️',
                        content: '我家是暗卫，装了普通排气扇根本没用。后来换成了大功率的风暖浴霸+排气扇一体机，洗完澡开半小时，干得快多了。',
                        likes: 178,
                        verified: true
                    }
                ],
                knowledgeRef: 'soft-003',
                sopSteps: ['F-18'],
                tip: '大功率排气扇+风暖+防霉玻璃胶'
            }
        ],

        entryway: [
            {
                id: 'entryway-1',
                title: '鞋柜设计不合理',
                description: '鞋柜深度不够、层板间距太大，鞋放不下或者浪费空间。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '鞋子控小敏',
                        avatar: '👟',
                        content: '我家鞋柜深度只有30cm，男鞋根本放不进去！鞋柜深度至少35cm，最好40cm。层板要做活动的，能调高度，放靴子什么的方便。',
                        likes: 432,
                        verified: true
                    },
                    {
                        author: '全屋定制老周',
                        avatar: '👨‍🔧',
                        content: '鞋柜底下留空放常穿的鞋，中间留空放钥匙包包，上面放换季的鞋。换鞋凳也很实用，尤其是有老人小孩的家庭。',
                        likes: 298,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-004',
                sopSteps: ['F-8', 'F-19'],
                tip: '深度35-40cm+活动层板+底部留空'
            },
            {
                id: 'entryway-2',
                title: '照明太暗',
                description: '玄关只有一个主灯，晚上回家黑乎乎的，找东西不方便。',
                severity: SEVERITY.LOW,
                experiences: [
                    {
                        author: '夜归人',
                        avatar: '🌙',
                        content: '我家装了感应灯带，人一靠近就亮，晚上回家不用摸黑找开关，幸福感爆棚。鞋柜底下和中间也可以装灯带。',
                        likes: 356,
                        verified: true
                    }
                ],
                knowledgeRef: 'soft-003',
                sopSteps: ['F-10', 'F-18'],
                tip: '感应灯+鞋柜灯带，实用又有氛围'
            },
            {
                id: 'entryway-3',
                title: '插座不足',
                description: '玄关没留插座，烘鞋器、吸尘器充电都不方便。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '居家达人',
                        avatar: '🏠',
                        content: '我家玄关留了2个插座，一个插烘鞋器，一个给扫地机器人充电，太实用了！还有USB口，出门前给手机充会儿电正好。',
                        likes: 189,
                        verified: false
                    }
                ],
                knowledgeRef: 'design-003',
                sopSteps: ['F-10'],
                tip: '至少2个插座，考虑烘鞋器+吸尘器'
            },
            {
                id: 'entryway-4',
                title: '空间利用不足',
                description: '玄关很小但东西很多，鞋子、外套、包包、钥匙堆得乱七八糟。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '小户型专家',
                        avatar: '🏠',
                        content: '玄关小就做薄柜+挂衣钩，15-20cm深的薄柜放拖鞋和常用鞋足够了。墙上装挂衣钩和置物架，利用垂直空间。',
                        likes: 267,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-001',
                sopSteps: ['F-8'],
                tip: '薄柜+挂衣钩+垂直收纳，小玄关也能很能装'
            }
        ],

        balcony: [
            {
                id: 'balcony-1',
                title: '防水没做好',
                description: '阳台漏水到楼下，特别是放洗衣机的阳台，漏水风险更大。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '阳台改造王',
                        avatar: '🌿',
                        content: '阳台防水一定要做！地面满刷，墙面至少30cm高。如果放洗衣机，水龙头旁边要刷1米高。而且阳台坡度要做好，水能快速排到地漏。',
                        likes: 289,
                        verified: true
                    }
                ],
                knowledgeRef: 'prep-004',
                sopSteps: ['F-11'],
                tip: '地面满刷+墙面30cm+地漏坡度，缺一不可'
            },
            {
                id: 'balcony-2',
                title: '晾衣设计不合理',
                description: '晾衣杆位置不对、高度不合适，晒衣服不方便，还挡光线。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '家居博主晴晴',
                        avatar: '☀️',
                        content: '电动晾衣架太香了！能升能降，晒被子不用举着杆子。装在阳台侧边，别装在正中间，不然挡光线还影响看风景。',
                        likes: 456,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-004',
                sopSteps: ['F-19'],
                tip: '电动晾衣架+侧边安装，实用不挡光'
            },
            {
                id: 'balcony-3',
                title: '插座没做防水',
                description: '阳台插座被雨水淋到，有安全隐患。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '电工老王',
                        avatar: '⚡',
                        content: '阳台插座一定要装防溅盒！尤其是洗衣机、热水器的插座。最好选带开关的，不用经常拔插头。露天阳台还要考虑IP等级。',
                        likes: 312,
                        verified: true
                    }
                ],
                knowledgeRef: 'design-003',
                sopSteps: ['F-10'],
                tip: '防溅盒+带开关+漏电保护，安全第一'
            },
            {
                id: 'balcony-4',
                title: '封装质量差',
                description: '阳台封装用了劣质铝材和玻璃，刮风下雨漏风漏雨，还不隔音。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '封阳台踩坑记',
                        avatar: '🪟',
                        content: '我家封阳台贪便宜选了小商家，结果台风天漏雨漏得一塌糊涂。找正规厂家，断桥铝+双层中空玻璃，五金也要选好的。',
                        likes: 278,
                        verified: false
                    }
                ],
                knowledgeRef: 'prep-004',
                sopSteps: ['F-6'],
                tip: '断桥铝+双层中空玻璃+品牌五金，别贪便宜'
            }
        ],

        study: [
            {
                id: 'study-1',
                title: '插座不够用',
                description: '书房电脑、显示器、音箱、台灯、充电器一大堆，插座根本不够用。',
                severity: SEVERITY.HIGH,
                experiences: [
                    {
                        author: '数码控阿杰',
                        avatar: '💻',
                        content: '我家书桌上至少要6个插座才够！电脑主机、显示器、路由器、台灯、手机充电、还有各种小电器。一定要多留，桌面上和桌下都要有。',
                        likes: 389,
                        verified: false
                    }
                ],
                knowledgeRef: 'design-003',
                sopSteps: ['F-10'],
                tip: '桌面至少4个+桌下至少2个，还可以加插排'
            },
            {
                id: 'study-2',
                title: '灯光设计不合理',
                description: '书房只有一个主灯，坐在书桌前写字，身体挡住光线，桌面暗暗的。',
                severity: SEVERITY.MEDIUM,
                experiences: [
                    {
                        author: '护眼专家',
                        avatar: '👓',
                        content: '书房不能只有一个主灯！要用主灯+台灯+屏幕挂灯的组合。台灯要选无频闪、护眼的，光线从侧面照过来，不直射屏幕。',
                        likes: 245,
                        verified: true
                    }
                ],
                knowledgeRef: 'soft-003',
                sopSteps: ['F-18'],
                tip: '主灯+护眼台灯+屏幕挂灯，三重照明'
            }
        ]
    };

    function getPitfallsByRegion(regionId) {
        return REGION_PITFALLS[regionId] || [];
    }

    function getPitfallById(pitfallId) {
        for (var regionId in REGION_PITFALLS) {
            if (REGION_PITFALLS.hasOwnProperty(regionId)) {
                var pitfalls = REGION_PITFALLS[regionId];
                for (var i = 0; i < pitfalls.length; i++) {
                    if (pitfalls[i].id === pitfallId) {
                        return pitfalls[i];
                    }
                }
            }
        }
        return null;
    }

    function getPitfallsBySopStep(stepId) {
        var result = [];
        for (var regionId in REGION_PITFALLS) {
            if (REGION_PITFALLS.hasOwnProperty(regionId)) {
                var pitfalls = REGION_PITFALLS[regionId];
                for (var i = 0; i < pitfalls.length; i++) {
                    var pitfall = pitfalls[i];
                    if (pitfall.sopSteps && pitfall.sopSteps.indexOf(stepId) !== -1) {
                        result.push({
                            regionId: regionId,
                            pitfall: pitfall
                        });
                    }
                }
            }
        }
        return result;
    }

    function getAllPitfalls() {
        var result = [];
        for (var regionId in REGION_PITFALLS) {
            if (REGION_PITFALLS.hasOwnProperty(regionId)) {
                var pitfalls = REGION_PITFALLS[regionId];
                for (var i = 0; i < pitfalls.length; i++) {
                    result.push({
                        regionId: regionId,
                        pitfall: pitfalls[i]
                    });
                }
            }
        }
        return result;
    }

    function getSeverityLabel(severity) {
        return SEVERITY_LABELS[severity] || severity;
    }

    function getTotalCount() {
        var count = 0;
        for (var regionId in REGION_PITFALLS) {
            if (REGION_PITFALLS.hasOwnProperty(regionId)) {
                count += REGION_PITFALLS[regionId].length;
            }
        }
        return count;
    }

    return {
        SEVERITY: SEVERITY,
        SEVERITY_LABELS: SEVERITY_LABELS,
        getPitfallsByRegion: getPitfallsByRegion,
        getPitfallById: getPitfallById,
        getPitfallsBySopStep: getPitfallsBySopStep,
        getAllPitfalls: getAllPitfalls,
        getSeverityLabel: getSeverityLabel,
        getTotalCount: getTotalCount
    };
})();
