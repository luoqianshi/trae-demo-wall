"""
恶魔的代价 - Web版本
使用Flask提供网页界面，在浏览器中 playable
"""
from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# 游戏数据存储
class GameState:
    def __init__(self):
        self.reset()
    
    def reset(self):
        """重置游戏状态"""
        self.current_scene = "title"
        self.found_evidences = []
        self.examined_evidences = []
        self.connections = []
        self.interviewed_suspects = {}
        self.used_dialogs = {}
        self.current_suspect = None
        self.message = ""
        self.game_over = False
        
        # 初始化证据
        self.evidences = {
            "blood_east": {
                "name": "东边血迹",
                "description": "东边的墙壁上有喷溅状血迹，说明受害者在这里受到攻击，血液呈放射状分布。",
                "location": "crime_scene",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["blood_south", "blood_west", "footprints"]
            },
            "blood_south": {
                "name": "南边血迹",
                "description": "南边的地板上有大量血迹，这是出血量最大的位置，可能是第一击的位置。",
                "location": "crime_scene",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["blood_east", "blood_west", "footprints"]
            },
            "blood_west": {
                "name": "西边血迹",
                "description": "西边的地板上有拖拽痕迹和血迹，受害者可能在这里最终倒下。",
                "location": "crime_scene",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["blood_east", "blood_south", "footprints"]
            },
            "footprints": {
                "name": "杂乱脚印",
                "description": "地面上有三种不同的脚印：怪盗的皮鞋印、张保安的胶鞋印，还有第三种陌生的皮鞋印。部分脚印与血迹重叠。",
                "location": "crime_scene",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["blood_east", "blood_south", "blood_west", "transfer_phone", "cigarette"]
            },
            "demon_book": {
                "name": "《恶魔》之书",
                "description": "桌上有一本封面烫金写着'恶魔'的小说，扉页有笔记：'优雅即尊严'。书页间夹着一张画展邀请函。",
                "location": "crime_scene",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["blood_writing"]
            },
            "transfer_phone": {
                "name": "转账手机",
                "description": "桌上有一部手机，屏幕显示转账页面，上面写着'转钱'两个字。指纹被擦拭过。",
                "location": "crime_scene",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["footprints"]
            },
            "blood_writing": {
                "name": "血字'活该'",
                "description": "北墙（门边）上用血写着'活该'两个字，字迹潦草但有力，是用受害者手指写的。",
                "location": "crime_scene",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["demon_book", "newspaper"]
            },
            "window": {
                "name": "开启的窗户",
                "description": "二楼窗户开着，但没有使用痕迹。怪盗平时从这里出入，但今晚没有。",
                "location": "crime_scene",
                "is_key": False,
                "found": False,
                "examined": False,
                "related": []
            },
            "cigarette": {
                "name": "中华烟蒂",
                "description": "院门口有一根中华牌香烟的烟蒂，张老板常抽这个牌子。",
                "location": "crime_scene",
                "is_key": False,
                "found": False,
                "examined": False,
                "related": ["footprints"]
            },
            "painting": {
                "name": "名画",
                "description": "地下室暗格中有一幅完好的名画，怪盗没有带走它。",
                "location": "basement",
                "is_key": False,
                "found": False,
                "examined": False,
                "related": []
            },
            "duty_record": {
                "name": "值班记录复印件",
                "description": "地下室名画旁边有一份值班记录复印件，显示张保安当晚在值班室睡觉，没有响应紧急呼叫。",
                "location": "basement",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["newspaper", "maintenance"]
            },
            "newspaper": {
                "name": "旧剪报",
                "description": "书桌抽屉里有一张三年前的剪报，报道张保安是'英雄保安'。怪盗在边上批注：'英雄？'",
                "location": "study",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["duty_record", "blood_writing"]
            },
            "maintenance": {
                "name": "维修记录",
                "description": "小区物业办公室的维修记录显示，老人死亡当晚紧急呼叫铃正常，没有故障。",
                "location": "office",
                "is_key": True,
                "found": False,
                "examined": False,
                "related": ["duty_record"]
            }
        }
        
        # 嫌疑人对话
        self.suspects = {
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
        
        # 关联结果
        self.connection_results = {
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

# 全局游戏状态
game_state = GameState()

@app.route('/')
def index():
    """主页面"""
    return render_template('game.html')

@app.route('/api/reset', methods=['POST'])
def reset_game():
    """重置游戏"""
    game_state.reset()
    return jsonify({"status": "ok", "scene": game_state.current_scene})

@app.route('/api/state')
def get_state():
    """获取当前游戏状态"""
    return jsonify({
        "scene": game_state.current_scene,
        "found_evidences": game_state.found_evidences,
        "connections": game_state.connections,
        "interviewed": game_state.interviewed_suspects,
        "message": game_state.message,
        "game_over": game_state.game_over
    })

@app.route('/api/scene/<scene_name>')
def change_scene(scene_name):
    """切换场景"""
    valid_scenes = ["title", "intro", "crime_scene", "basement", "study", "office", "interview", "board", "ending"]
    if scene_name in valid_scenes:
        game_state.current_scene = scene_name
        return jsonify({"status": "ok", "scene": scene_name})
    return jsonify({"status": "error", "message": "无效场景"})

@app.route('/api/investigate', methods=['POST'])
def investigate():
    """调查线索"""
    data = request.json
    ev_id = data.get('evidence_id')
    location = data.get('location')
    action = data.get('action', 'look')  # look or examine
    
    if ev_id not in game_state.evidences:
        return jsonify({"status": "error", "message": "线索不存在"})
    
    ev = game_state.evidences[ev_id]
    
    if action == 'look':
        if not ev['found']:
            if ev['location'] == location:
                ev['found'] = True
                game_state.found_evidences.append(ev_id)
                game_state.message = f"【发现线索】{ev['name']}: {ev['description']}"
                return jsonify({"status": "ok", "found": True, "message": game_state.message})
            else:
                return jsonify({"status": "error", "message": "这个线索不在这里"})
        else:
            return jsonify({"status": "ok", "found": True, "message": f"你已经调查过{ev['name']}了。"})
    
    elif action == 'examine':
        if ev['found']:
            ev['examined'] = True
            game_state.examined_evidences.append(ev_id)
            game_state.message = ev['description']
            return jsonify({"status": "ok", "message": game_state.message})
        else:
            return jsonify({"status": "error", "message": "你还没有发现这个线索，先调查一下。"})
    
    return jsonify({"status": "error", "message": "无效操作"})

@app.route('/api/evidences/<location>')
def get_evidences(location):
    """获取某个地点的线索列表"""
    evidences = []
    for ev_id, ev in game_state.evidences.items():
        if ev['location'] == location:
            evidences.append({
                "id": ev_id,
                "name": ev['name'],
                "found": ev['found'],
                "is_key": ev['is_key']
            })
    return jsonify({"status": "ok", "evidences": evidences})

@app.route('/api/suspects')
def get_suspects():
    """获取嫌疑人列表"""
    suspects = []
    for s_id, s in game_state.suspects.items():
        suspects.append({
            "id": s_id,
            "name": s['name'],
            "role": s['role'],
            "description": s['description'],
            "interviewed": s_id in game_state.interviewed_suspects
        })
    return jsonify({"status": "ok", "suspects": suspects})

@app.route('/api/suspect/<suspect_id>/topics')
def get_topics(suspect_id):
    """获取嫌疑人可对话的话题"""
    if suspect_id not in game_state.suspects:
        return jsonify({"status": "error", "message": "嫌疑人不存在"})
    
    suspect = game_state.suspects[suspect_id]
    topics = []
    
    for topic, dialog in suspect['dialogs'].items():
        key = f"{suspect_id}_{topic}"
        if key not in game_state.used_dialogs:
            unlock = dialog['unlock']
            if unlock is None:
                available = True
            elif isinstance(unlock, list):
                available = all(ev in game_state.found_evidences for ev in unlock)
            else:
                available = unlock in game_state.found_evidences
            
            topics.append({
                "topic": topic,
                "available": available
            })
    
    return jsonify({"status": "ok", "topics": topics})

@app.route('/api/suspect/<suspect_id>/talk', methods=['POST'])
def talk(suspect_id):
    """与嫌疑人对话"""
    data = request.json
    topic = data.get('topic')
    
    if suspect_id not in game_state.suspects:
        return jsonify({"status": "error", "message": "嫌疑人不存在"})
    
    suspect = game_state.suspects[suspect_id]
    
    if topic not in suspect['dialogs']:
        return jsonify({"status": "error", "message": "话题不存在"})
    
    dialog = suspect['dialogs'][topic]
    key = f"{suspect_id}_{topic}"
    
    # 检查解锁条件
    unlock = dialog['unlock']
    if unlock is not None:
        if isinstance(unlock, list):
            if not all(ev in game_state.found_evidences for ev in unlock):
                return jsonify({"status": "error", "message": f"{suspect['name']}看起来有所隐瞒，也许你需要先找到更多线索。"})
        else:
            if unlock not in game_state.found_evidences:
                return jsonify({"status": "error", "message": f"{suspect['name']}看起来有所隐瞒，也许你需要先找到更多线索。"})
    
    game_state.used_dialogs[key] = True
    game_state.interviewed_suspects[suspect_id] = True
    game_state.message = dialog['content']
    
    return jsonify({
        "status": "ok",
        "suspect": suspect['name'],
        "topic": topic,
        "content": dialog['content']
    })

@app.route('/api/connect', methods=['POST'])
def connect_evidence():
    """关联两个证据"""
    data = request.json
    ev_id1 = data.get('ev1')
    ev_id2 = data.get('ev2')
    
    if ev_id1 not in game_state.evidences or ev_id2 not in game_state.evidences:
        return jsonify({"status": "error", "message": "线索不存在"})
    
    ev1 = game_state.evidences[ev_id1]
    ev2 = game_state.evidences[ev_id2]
    
    if not ev1['found'] or not ev2['found']:
        return jsonify({"status": "error", "message": "还有线索未发现"})
    
    if ev_id1 == ev_id2:
        return jsonify({"status": "error", "message": "不能关联同一个线索"})
    
    # 检查是否有关联关系
    if ev_id2 not in ev1['related'] and ev_id1 not in ev2['related']:
        return jsonify({"status": "error", "message": "这两条线索似乎没有直接关联"})
    
    # 检查是否已经关联过
    conn1 = (ev_id1, ev_id2)
    conn2 = (ev_id2, ev_id1)
    if conn1 in game_state.connections or conn2 in game_state.connections:
        return jsonify({"status": "error", "message": "这两个线索已经关联过了"})
    
    game_state.connections.append(conn1)
    
    # 获取关联结果
    result = game_state.connection_results.get(conn1) or game_state.connection_results.get(conn2)
    if result:
        game_state.message = result
        return jsonify({"status": "ok", "message": result})
    
    return jsonify({"status": "ok", "message": "发现了新的关联，但还需要更多线索。"})

@app.route('/api/accuse', methods=['POST'])
def accuse():
    """指认凶手"""
    data = request.json
    suspect_name = data.get('suspect')
    
    if suspect_name != "怪盗":
        game_state.message = "不对，证据指向的另有其人。再仔细看看线索之间的关联。"
        return jsonify({"status": "error", "message": game_state.message})
    
    # 检查是否发现了足够的证据
    required = ["blood_east", "blood_south", "blood_west", "footprints", 
                "demon_book", "blood_writing", "transfer_phone"]
    missing = [ev_id for ev_id in required if ev_id not in game_state.found_evidences]
    
    if missing:
        missing_names = [game_state.evidences[ev_id]['name'] for ev_id in missing]
        game_state.message = f"证据还不够充分。你还没有调查：{', '.join(missing_names)}"
        return jsonify({"status": "error", "message": game_state.message})
    
    # 检查关键关联是否建立
    key_connections = [
        ("demon_book", "blood_writing"),
        ("transfer_phone", "footprints"),
    ]
    
    has_key = False
    for c in key_connections:
        if c in game_state.connections or (c[1], c[0]) in game_state.connections:
            has_key = True
            break
    
    if not has_key:
        game_state.message = "你发现了证据，但还没有理清它们之间的关系。试着在证据板上关联线索。"
        return jsonify({"status": "error", "message": game_state.message})
    
    game_state.message = "没错！怪盗就是凶手。被勒索的愤怒，加上对张保安虚伪的厌恶，让他冲动杀人。"
    game_state.game_over = True
    game_state.current_scene = "ending"
    
    return jsonify({"status": "ok", "message": game_state.message, "game_over": True})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
