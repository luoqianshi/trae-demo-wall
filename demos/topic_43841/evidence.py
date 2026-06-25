"""
证据系统 - 管理所有线索和证据关联
"""

class Evidence:
    """单个证据"""
    def __init__(self, id, name, description, location, is_key=False):
        self.id = id
        self.name = name
        self.description = description
        self.location = location  # 所在场景
        self.is_key = is_key      # 是否关键证据
        self.found = False        # 是否已被发现
        self.examined = False     # 是否已详细检查
        self.related_evidence = []  # 关联的证据ID
        
    def find(self):
        """发现证据"""
        if not self.found:
            self.found = True
            return f"【发现线索】{self.name}: {self.description}"
        return None
    
    def examine(self):
        """详细检查证据"""
        self.examined = True
        return self.get_detail()
    
    def get_detail(self):
        """获取详细描述"""
        return self.description
    
    def add_related(self, evidence_id):
        """添加关联证据"""
        if evidence_id not in self.related_evidence:
            self.related_evidence.append(evidence_id)


class EvidenceBoard:
    """证据板 - 管理所有证据和关联推理"""
    def __init__(self):
        self.evidences = {}  # id -> Evidence
        self.connections = []  # 已建立的关联
        self.discovered_clues = []  # 已发现的线索记录
        
    def add_evidence(self, evidence):
        """添加证据到系统"""
        self.evidences[evidence.id] = evidence
        
    def find_evidence(self, evidence_id, location):
        """在场景中查找证据"""
        if evidence_id in self.evidences:
            ev = self.evidences[evidence_id]
            if ev.location == location and not ev.found:
                result = ev.find()
                if result:
                    self.discovered_clues.append(evidence_id)
                return result
        return None
    
    def get_found_evidences(self):
        """获取所有已发现的证据"""
        return [ev for ev in self.evidences.values() if ev.found]
    
    def connect(self, ev_id1, ev_id2):
        """尝试关联两个证据"""
        if ev_id1 not in self.evidences or ev_id2 not in self.evidences:
            return False, "证据不存在"
        
        ev1 = self.evidences[ev_id1]
        ev2 = self.evidences[ev_id2]
        
        if not ev1.found or not ev2.found:
            return False, "还有证据未发现"
        
        # 检查是否有关联关系
        if ev_id2 in ev1.related_evidence or ev_id1 in ev2.related_evidence:
            connection = (ev_id1, ev_id2)
            if connection not in self.connections and (ev_id2, ev_id1) not in self.connections:
                self.connections.append(connection)
                return True, self._get_connection_result(ev_id1, ev_id2)
        
        return False, "这两条线索似乎没有直接关联"
    
    def _get_connection_result(self, ev_id1, ev_id2):
        """获取关联结果描述"""
        # 根据证据组合返回不同的推理结果
        connections = {
            ("blood_east", "blood_south"): "东边和南边的血迹都是喷溅状，说明受害者在这两个位置都受到攻击，存在追逐过程。",
            ("blood_east", "blood_west"): "东边的喷溅血迹和西边的拖拽痕迹表明，受害者从东边被追逐到西边。",
            ("blood_south", "blood_west"): "南边是第一击的位置，西边是尸体最终位置，受害者被追逐后倒地。",
            ("footprints", "blood_east"): "脚印和血迹重叠，说明凶手在追逐过程中多次攻击受害者。",
            ("demon_book", "blood_writing"): "《恶魔》书中的'优雅即尊严'笔记，与'活该'血字的傲慢语气一致，都是怪盗的作风。",
            ("transfer_phone", "footprints"): "手机上的'转钱'和杂乱的脚印表明，张保安来勒索时发生了激烈冲突。",
            ("cigarette", "footprints"): "中华烟蒂和第三种脚印匹配，说明张老板案发后来过现场。",
            ("newspaper", "duty_record"): "三年前的报道说张保安是英雄，但真正的值班记录显示他在睡觉，张保安在撒谎！",
            ("duty_record", "maintenance"): "值班记录和维修记录都证明，张保安当晚失职，老人的死他有责任。",
            ("blood_writing", "newspaper"): "'活该'不只是嘲讽勒索，怪盗知道张保安的秘密——这个'英雄'其实害死过人。",
        }
        
        key = (ev_id1, ev_id2)
        if key not in connections:
            key = (ev_id2, ev_id1)
        
        return connections.get(key, "发现了新的关联，但还需要更多线索。")
    
    def check_solve(self, suspect_name):
        """检查是否成功指认凶手"""
        if suspect_name != "怪盗":
            return False, "不对，证据指向的另有其人。再仔细看看线索之间的关联。"
        
        # 检查是否发现了足够的证据
        required = ["blood_east", "blood_south", "blood_west", "footprints", 
                   "demon_book", "blood_writing", "transfer_phone"]
        found_required = all(self.evidences[ev_id].found for ev_id in required)
        
        if not found_required:
            missing = [self.evidences[ev_id].name for ev_id in required if not self.evidences[ev_id].found]
            return False, f"证据还不够充分。你还没有调查：{', '.join(missing)}"
        
        # 检查关键关联是否建立
        key_connections = [
            ("demon_book", "blood_writing"),
            ("transfer_phone", "footprints"),
        ]
        
        has_key_connection = any(
            (c in self.connections or (c[1], c[0]) in self.connections) 
            for c in key_connections
        )
        
        if not has_key_connection:
            return False, "你发现了证据，但还没有理清它们之间的关系。试着在证据板上关联线索。"
        
        return True, "没错！怪盗就是凶手。被勒索的愤怒，加上对张保安虚伪的厌恶，让他冲动杀人。"


# 初始化所有证据
def init_evidences():
    """初始化案件的所有证据"""
    board = EvidenceBoard()
    
    # 血迹线索
    board.add_evidence(Evidence(
        "blood_east", "东边血迹", 
        "东边的墙壁上有喷溅状血迹，说明受害者在这里受到攻击，血液呈放射状分布。",
        "crime_scene", True
    ))
    
    board.add_evidence(Evidence(
        "blood_south", "南边血迹", 
        "南边的地板上有大量血迹，这是出血量最大的位置，可能是第一击的位置。",
        "crime_scene", True
    ))
    
    board.add_evidence(Evidence(
        "blood_west", "西边血迹", 
        "西边的地板上有拖拽痕迹和血迹，受害者可能在这里最终倒下。",
        "crime_scene", True
    ))
    
    # 脚印
    board.add_evidence(Evidence(
        "footprints", "杂乱脚印", 
        "地面上有三种不同的脚印：怪盗的皮鞋印、张保安的胶鞋印，还有第三种陌生的皮鞋印。部分脚印与血迹重叠。",
        "crime_scene", True
    ))
    
    # 桌上物品
    board.add_evidence(Evidence(
        "demon_book", "《恶魔》之书", 
        "桌上有一本封面烫金写着'恶魔'的小说，扉页有笔记：'优雅即尊严'。书页间夹着一张画展邀请函。",
        "crime_scene", True
    ))
    
    board.add_evidence(Evidence(
        "transfer_phone", "转账手机", 
        "桌上有一部手机，屏幕显示转账页面，上面写着'转钱'两个字。指纹被擦拭过。",
        "crime_scene", True
    ))
    
    # 血字
    board.add_evidence(Evidence(
        "blood_writing", "血字'活该'", 
        "北墙（门边）上用血写着'活该'两个字，字迹潦草但有力，是用受害者手指写的。",
        "crime_scene", True
    ))
    
    # 其他现场线索
    board.add_evidence(Evidence(
        "window", "开启的窗户", 
        "二楼窗户开着，但没有使用痕迹。怪盗平时从这里出入，但今晚没有。",
        "crime_scene", False
    ))
    
    board.add_evidence(Evidence(
        "cigarette", "中华烟蒂", 
        "院门口有一根中华牌香烟的烟蒂，张老板常抽这个牌子。",
        "crime_scene", False
    ))
    
    # 地下室线索
    board.add_evidence(Evidence(
        "painting", "名画", 
        "地下室暗格中有一幅完好的名画，怪盗没有带走它。",
        "basement", False
    ))
    
    # 怪盗房间线索
    board.add_evidence(Evidence(
        "newspaper", "旧剪报", 
        "书桌抽屉里有一张三年前的剪报，报道张保安是'英雄保安'。怪盗在边上批注：'英雄？'",
        "study", True
    ))
    
    board.add_evidence(Evidence(
        "duty_record", "值班记录复印件", 
        "地下室名画旁边有一份值班记录复印件，显示张保安当晚在值班室睡觉，没有响应紧急呼叫。",
        "basement", True
    ))
    
    # 外部线索
    board.add_evidence(Evidence(
        "maintenance", "维修记录", 
        "小区物业办公室的维修记录显示，老人死亡当晚紧急呼叫铃正常，没有故障。",
        "office", True
    ))
    
    # 设置关联关系
    board.evidences["blood_east"].add_related("blood_south")
    board.evidences["blood_east"].add_related("blood_west")
    board.evidences["blood_east"].add_related("footprints")
    board.evidences["blood_south"].add_related("blood_west")
    board.evidences["blood_south"].add_related("footprints")
    board.evidences["blood_west"].add_related("footprints")
    board.evidences["demon_book"].add_related("blood_writing")
    board.evidences["transfer_phone"].add_related("footprints")
    board.evidences["cigarette"].add_related("footprints")
    board.evidences["newspaper"].add_related("duty_record")
    board.evidences["duty_record"].add_related("maintenance")
    board.evidences["blood_writing"].add_related("newspaper")
    
    return board
