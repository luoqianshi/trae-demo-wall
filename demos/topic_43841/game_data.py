"""
恶魔的代价 - 游戏数据定义
包含所有游戏静态数据：证据、嫌疑人、关联结果、场景、介绍/结局文本、指认要求。
"""

# 证据数据（13条）
# 字段说明：id由字典key表示，name=名称，description=描述，location=所在场景，
#           is_key=是否关键证据，related=可关联的其他证据id列表
EVIDENCES = {
    "blood_east": {
        "name": "东边血迹",
        "description": "东边的墙壁上有喷溅状血迹，说明受害者在这里受到攻击，血液呈放射状分布。",
        "location": "crime_scene",
        "is_key": True,
        "related": ["blood_south", "blood_west", "footprints"]
    },
    "blood_south": {
        "name": "南边血迹",
        "description": "南边的地板上有大量血迹，这是出血量最大的位置，可能是第一击的位置。",
        "location": "crime_scene",
        "is_key": True,
        "related": ["blood_east", "blood_west", "footprints"]
    },
    "blood_west": {
        "name": "西边血迹",
        "description": "西边的地板上有拖拽痕迹和血迹，受害者可能在这里最终倒下。",
        "location": "crime_scene",
        "is_key": True,
        "related": ["blood_east", "blood_south", "footprints"]
    },
    "footprints": {
        "name": "杂乱脚印",
        "description": "地面上有三种不同的脚印：怪盗的皮鞋印、张保安的胶鞋印，还有第三种陌生的皮鞋印。部分脚印与血迹重叠。",
        "location": "crime_scene",
        "is_key": True,
        "related": ["blood_east", "blood_south", "blood_west", "transfer_phone", "cigarette"]
    },
    "demon_book": {
        "name": "《恶魔》之书",
        "description": "桌上有一本封面烫金写着'恶魔'的小说，扉页有笔记：'优雅即尊严'。书页间夹着一张画展邀请函。",
        "location": "crime_scene",
        "is_key": True,
        "related": ["blood_writing"]
    },
    "transfer_phone": {
        "name": "转账手机",
        "description": "桌上有一部手机，屏幕显示转账页面，上面写着'转钱'两个字。指纹被擦拭过。",
        "location": "crime_scene",
        "is_key": True,
        "related": ["footprints"]
    },
    "blood_writing": {
        "name": "血字'活该'",
        "description": "北墙（门边）上用血写着'活该'两个字，字迹潦草但有力，是用受害者手指写的。",
        "location": "crime_scene",
        "is_key": True,
        "related": ["demon_book", "newspaper"]
    },
    "window": {
        "name": "开启的窗户",
        "description": "二楼窗户开着，但没有使用痕迹。怪盗平时从这里出入，但今晚没有。",
        "location": "crime_scene",
        "is_key": False,
        "related": []
    },
    "cigarette": {
        "name": "中华烟蒂",
        "description": "院门口有一根中华牌香烟的烟蒂，张老板常抽这个牌子。",
        "location": "crime_scene",
        "is_key": False,
        "related": ["footprints"]
    },
    "painting": {
        "name": "名画",
        "description": "地下室暗格中有一幅完好的名画，怪盗没有带走它。",
        "location": "basement",
        "is_key": False,
        "related": []
    },
    "duty_record": {
        "name": "值班记录复印件",
        "description": "地下室名画旁边有一份值班记录复印件，显示张保安当晚在值班室睡觉，没有响应紧急呼叫。",
        "location": "basement",
        "is_key": True,
        "related": ["newspaper", "maintenance"]
    },
    "newspaper": {
        "name": "旧剪报",
        "description": "书桌抽屉里有一张三年前的剪报，报道张保安是'英雄保安'。怪盗在边上批注：'英雄？'",
        "location": "study",
        "is_key": True,
        "related": ["duty_record", "blood_writing"]
    },
    "maintenance": {
        "name": "维修记录",
        "description": "小区物业办公室的维修记录显示，老人死亡当晚紧急呼叫铃正常，没有故障。",
        "location": "office",
        "is_key": True,
        "related": ["duty_record"]
    }
}

# 嫌疑人数据（4人）
# 字段说明：id由字典key表示，name=姓名，role=身份，description=描述，
#           is_killer=是否为真凶，dialogs=对话话题（content=内容，unlock=解锁条件证据id）
SUSPECTS = {
    "thief": {
        "name": "怪盗",
        "role": "别墅住户，艺术品大盗",
        "description": "专偷艺术品的大盗，行事优雅，从不动粗。最近藏身在这栋别墅。",
        "is_killer": True,
        "dialogs": {
            "身份": {
                "content": "我？我只是一个喜欢艺术的人。那些画放在博物馆里积灰，不如让我来欣赏。",
                "unlock": None
            },
            "案发当晚": {
                "content": "张保安？他来找我……谈一些事情。我们发生了争执，然后他离开了。",
                "unlock": None
            },
            "恶魔之书": {
                "content": "《恶魔》？一本关于骄傲与毁灭的小说。我觉得……写得很好。",
                "unlock": "demon_book"
            },
            "血字": {
                "content": "'活该'？我……我不知道你在说什么。",
                "unlock": "blood_writing"
            },
            "真相": {
                "content": "好吧，我承认。他来勒索我，我……我失控了。但他不是无辜的！他害死过人，还冒充英雄！我偷的是画，他偷的是命！'活该'？是的，他活该！",
                "unlock": ["duty_record", "newspaper"]
            }
        }
    },
    "boss": {
        "name": "张老板",
        "role": "地下艺术品商人",
        "description": "怪盗的'下家'，专门收购来路不明的艺术品。",
        "is_killer": False,
        "dialogs": {
            "身份": {
                "content": "我做的是正经生意，只是……有时候客人比较特殊。",
                "unlock": None
            },
            "案发当晚": {
                "content": "我确实去过那栋别墅，但我是案发后去的。怪盗迟迟不交画，我去催他。到了之后发现……出了事。我害怕牵连，就离开了。",
                "unlock": None
            },
            "烟蒂": {
                "content": "中华？我确实抽这个。但……那烟蒂可能是我之前留下的。",
                "unlock": "cigarette"
            },
            "怪盗": {
                "content": "他这个人……太骄傲了。偷东西还要讲究'优雅'，简直有病。但我也没想到他会杀人。",
                "unlock": "demon_book"
            }
        }
    },
    "reporter": {
        "name": "李记者",
        "role": "社会新闻记者",
        "description": "正在调查城郊盗窃案的记者，想挖出大新闻。",
        "is_killer": False,
        "dialogs": {
            "身份": {
                "content": "我在追踪一个艺术品盗窃团伙的线索，那栋别墅很可疑。",
                "unlock": None
            },
            "案发当晚": {
                "content": "我在别墅外面监视，但案发时我没看到有人进出。大概……我在打瞌睡？",
                "unlock": None
            },
            "照片": {
                "content": "我的相机？里面有一些别墅的照片，但都是外景。我没进去过。",
                "unlock": None
            },
            "张保安": {
                "content": "那个保安？我见过他在别墅附近转悠，鬼鬼祟祟的。我还以为他也是来调查的。",
                "unlock": None
            }
        }
    },
    "doctor": {
        "name": "王医生",
        "role": "社区诊所医生",
        "description": "住在别墅区的医生，案发当晚出诊回来。",
        "is_killer": False,
        "dialogs": {
            "身份": {
                "content": "我是社区医生，最近……最近睡眠不太好，开了一些镇静药。",
                "unlock": None
            },
            "案发当晚": {
                "content": "我出诊回来，路过别墅，没注意到什么异常。我精神状态不太好，可能看漏了。",
                "unlock": None
            },
            "镇静药": {
                "content": "处方单？我……我最近失眠，所以开了些药。这……这和案件有什么关系？",
                "unlock": None
            },
            "看到的人": {
                "content": "等等……我好像看到一个人从别墅出来。穿着……黑色的衣服？但我没看清脸。我当时太困了，以为是幻觉。",
                "unlock": "blood_writing"
            }
        }
    }
}

# 关联结果（10组）
# key格式为 "id1+id2" 字符串，value为关联推理文本
CONNECTION_RESULTS = {
    "blood_east+blood_south": "东边和南边的血迹都是喷溅状，说明受害者在这两个位置都受到攻击，存在追逐过程。",
    "blood_east+blood_west": "东边的喷溅血迹和西边的拖拽痕迹表明，受害者从东边被追逐到西边。",
    "blood_south+blood_west": "南边是第一击的位置，西边是尸体最终位置，受害者被追逐后倒地。",
    "footprints+blood_east": "脚印和血迹重叠，说明凶手在追逐过程中多次攻击受害者。",
    "demon_book+blood_writing": "《恶魔》书中的'优雅即尊严'笔记，与'活该'血字的傲慢语气一致，都是怪盗的作风。",
    "transfer_phone+footprints": "手机上的'转钱'和杂乱的脚印表明，张保安来勒索时发生了激烈冲突。",
    "cigarette+footprints": "中华烟蒂和第三种脚印匹配，说明张老板案发后来过现场。",
    "newspaper+duty_record": "三年前的报道说张保安是英雄，但真正的值班记录显示他在睡觉，张保安在撒谎！",
    "duty_record+maintenance": "值班记录和维修记录都证明，张保安当晚失职，老人的死他有责任。",
    "blood_writing+newspaper": "'活该'不只是嘲讽勒索，怪盗知道张保安的秘密——这个'英雄'其实害死过人。",
}

# 场景描述
SCENES = {
    "crime_scene": {
        "name": "案发现场 - 别墅客厅",
        "description": "你来到了案发现场。空气中弥漫着血腥味。"
    },
    "basement": {
        "name": "地下室",
        "description": "地下室昏暗潮湿，你发现了暗格。"
    },
    "study": {
        "name": "书房",
        "description": "书房整洁，与客厅的凌乱形成对比。"
    },
    "office": {
        "name": "物业办公室",
        "description": "物业办公室里堆满了文件。"
    },
    "interview": {
        "name": "审问嫌疑人",
        "description": "审讯室中，灯光昏暗。"
    },
    "board": {
        "name": "证据板",
        "description": "将所有线索整理关联，推理真相。"
    }
}

# 介绍文本（6页）
INTRO_PAGES = [
    "城郊一栋老旧别墅中发生了一起命案。",
    "受害者张保安，被人发现死在别墅客厅中。",
    "现场凌乱，血迹分布不均，墙上留有血字'活该'。",
    "嫌疑人就在以下四人之中：\n怪盗 - 别墅住户，艺术品大盗\n张老板 - 地下艺术品商人\n李记者 - 社会新闻记者\n王医生 - 社区诊所医生",
    "你的任务是调查现场、收集线索、审问嫌疑人，最终找出真凶。",
    "按回车键开始调查..."
]

# 结局文本（7页）
ENDING_PAGES = [
    "你成功揭开了真相。",
    "怪盗承认了自己的罪行。",
    "他的一生追求'优雅的恶魔'，最终却沦为最庸俗的杀人犯。",
    "张保安的虚伪被揭露，但他已经付出了生命的代价。",
    "'活该'——这两个字是怪盗对张保安的审判，也是对自己命运的嘲讽。",
    "案件结束了，但人性的复杂，永远没有答案。",
    "【游戏结束】"
]

# 指认要求
# required_evidences: 指认前必须收集的所有证据id
# required_connections: 指认前必须建立的关联组（至少满足其中一组）
ACCUSE_REQUIREMENTS = {
    "required_evidences": [
        "blood_east", "blood_south", "blood_west", "footprints",
        "demon_book", "blood_writing", "transfer_phone"
    ],
    "required_connections": [
        ["demon_book", "blood_writing"],
        ["transfer_phone", "footprints"]
    ]
}

# 汇总为完整的游戏数据字典，供 API 端点统一返回
GAME_DATA = {
    "evidences": EVIDENCES,
    "suspects": SUSPECTS,
    "connection_results": CONNECTION_RESULTS,
    "scenes": SCENES,
    "intro_pages": INTRO_PAGES,
    "ending_pages": ENDING_PAGES,
    "accuse_requirements": ACCUSE_REQUIREMENTS,
}
