"""
嫌疑人系统 - 管理所有嫌疑人和对话
"""

class Suspect:
    """单个嫌疑人"""
    def __init__(self, id, name, role, description, is_killer=False):
        self.id = id
        self.name = name
        self.role = role
        self.description = description
        self.is_killer = is_killer
        self.interviewed = False
        self.dialogs = {}  # 话题 -> 对话内容
        self.clues_given = []  # 已经提供的线索
        
    def add_dialog(self, topic, content, unlock_condition=None):
        """添加对话内容"""
        self.dialogs[topic] = {
            "content": content,
            "unlock": unlock_condition,
            "used": False
        }
    
    def talk(self, topic, evidence_board=None):
        """与嫌疑人对话"""
        if topic not in self.dialogs:
            return f"{self.name}对这个话题没有什么可说的。"
        
        dialog = self.dialogs[topic]
        
        # 检查解锁条件
        if dialog["unlock"] and evidence_board:
            if not dialog["unlock"](evidence_board):
                return f"{self.name}看起来有所隐瞒，也许你需要先找到更多线索。"
        
        dialog["used"] = True
        self.interviewed = True
        return dialog["content"]
    
    def get_available_topics(self, evidence_board=None):
        """获取可对话的话题"""
        topics = []
        for topic, dialog in self.dialogs.items():
            if not dialog["used"]:
                if dialog["unlock"] is None or (evidence_board and dialog["unlock"](evidence_board)):
                    topics.append(topic)
        return topics


def init_suspects():
    """初始化所有嫌疑人"""
    suspects = {}
    
    # 怪盗 - 真凶
    thief = Suspect("thief", "怪盗", "别墅住户，艺术品大盗", 
                   "专偷艺术品的大盗，行事优雅，从不动粗。最近藏身在这栋别墅。", True)
    thief.add_dialog("身份", 
        "我？我只是一个喜欢艺术的人。那些画放在博物馆里积灰，不如让我来欣赏。",
        None)
    thief.add_dialog("案发当晚", 
        "张保安？他来找我……谈一些事情。我们发生了争执，然后他离开了。",
        None)
    thief.add_dialog("恶魔之书", 
        "《恶魔》？一本关于骄傲与毁灭的小说。我觉得……写得很好。",
        lambda eb: eb.evidences["demon_book"].found)
    thief.add_dialog("血字", 
        "'活该'？我……我不知道你在说什么。",
        lambda eb: eb.evidences["blood_writing"].found)
    thief.add_dialog("真相", 
        "好吧，我承认。他来勒索我，我……我失控了。但他不是无辜的！他害死过人，还冒充英雄！我偷的是画，他偷的是命！'活该'？是的，他活该！",
        lambda eb: eb.evidences["duty_record"].found and eb.evidences["newspaper"].found)
    suspects["thief"] = thief
    
    # 张老板
    boss = Suspect("boss", "张老板", "地下艺术品商人",
                  "怪盗的'下家'，专门收购来路不明的艺术品。")
    boss.add_dialog("身份",
        "我做的是正经生意，只是……有时候客人比较特殊。",
        None)
    boss.add_dialog("案发当晚",
        "我确实去过那栋别墅，但我是案发后去的。怪盗迟迟不交画，我去催他。到了之后发现……出了事。我害怕牵连，就离开了。",
        None)
    boss.add_dialog("烟蒂",
        "中华？我确实抽这个。但……那烟蒂可能是我之前留下的。",
        lambda eb: eb.evidences["cigarette"].found)
    boss.add_dialog("怪盗",
        "他这个人……太骄傲了。偷东西还要讲究'优雅'，简直有病。但我也没想到他会杀人。",
        lambda eb: eb.evidences["demon_book"].found)
    suspects["boss"] = boss
    
    # 李记者
    reporter = Suspect("reporter", "李记者", "社会新闻记者",
                      "正在调查城郊盗窃案的记者，想挖出大新闻。")
    reporter.add_dialog("身份",
        "我在追踪一个艺术品盗窃团伙的线索，那栋别墅很可疑。",
        None)
    reporter.add_dialog("案发当晚",
        "我在别墅外面监视，但案发时我没看到有人进出。大概……我在打瞌睡？",
        None)
    reporter.add_dialog("照片",
        "我的相机？里面有一些别墅的照片，但都是外景。我没进去过。",
        None)
    reporter.add_dialog("张保安",
        "那个保安？我见过他在别墅附近转悠，鬼鬼祟祟的。我还以为他也是来调查的。",
        None)
    suspects["reporter"] = reporter
    
    # 王医生
    doctor = Suspect("doctor", "王医生", "社区诊所医生",
                    "住在别墅区的医生，案发当晚出诊回来。")
    doctor.add_dialog("身份",
        "我是社区医生，最近……最近睡眠不太好，开了一些镇静药。",
        None)
    doctor.add_dialog("案发当晚",
        "我出诊回来，路过别墅，没注意到什么异常。我精神状态不太好，可能看漏了。",
        None)
    doctor.add_dialog("镇静药",
        "处方单？我……我最近失眠，所以开了些药。这……这和案件有什么关系？",
        None)
    doctor.add_dialog("看到的人",
        "等等……我好像看到一个人从别墅出来。穿着……黑色的衣服？但我没看清脸。我当时太困了，以为是幻觉。",
        lambda eb: eb.evidences["blood_writing"].found)
    suspects["doctor"] = doctor
    
    return suspects
