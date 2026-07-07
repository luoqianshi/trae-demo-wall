"""
恶魔的代价 - 无状态 Flask API 后端
所有验证逻辑为纯函数式，不持有任何游戏状态。
游戏状态由前端维护，后端仅提供数据查询和验证服务。
"""
from flask import Flask, jsonify, request, render_template
from game_data import (
    EVIDENCES,
    SUSPECTS,
    CONNECTION_RESULTS,
    SCENES,
    GAME_DATA,
    ACCUSE_REQUIREMENTS,
)

app = Flask(__name__)


# ─── 辅助函数 ───

def _make_connection_key(ev1: str, ev2: str) -> str:
    """生成关联查找用的统一key，确保两个id按字母序排列"""
    return "+".join(sorted([ev1, ev2]))


def _connection_exists(ev1: str, ev2: str, connections: list) -> bool:
    """检查某对证据是否已在已建立的关联列表中（支持正反序匹配）"""
    key = _make_connection_key(ev1, ev2)
    for conn in connections:
        if isinstance(conn, list):
            if _make_connection_key(conn[0], conn[1]) == key:
                return True
        elif isinstance(conn, str):
            if conn == key:
                return True
    return False


# ─── 页面路由 ───

@app.route("/")
def index():
    """返回前端单页应用"""
    return render_template("index.html")


# ─── API 端点 ───

@app.route("/api/game-data")
def get_game_data():
    """返回完整的游戏数据（证据、嫌疑人、关联、场景、介绍/结局文本、指认要求）"""
    return jsonify(GAME_DATA)


@app.route("/api/evidences/<location>")
def get_evidences(location):
    """返回指定场景中的线索列表，仅包含 id、name、is_key"""
    evidences = []
    for ev_id, ev in EVIDENCES.items():
        if ev["location"] == location:
            evidences.append({
                "id": ev_id,
                "name": ev["name"],
                "is_key": ev["is_key"],
            })
    return jsonify({"evidences": evidences})


@app.route("/api/suspects")
def get_suspects():
    """返回嫌疑人列表，仅包含 id、name、role、description"""
    suspects = []
    for s_id, s in SUSPECTS.items():
        suspects.append({
            "id": s_id,
            "name": s["name"],
            "role": s["role"],
            "description": s["description"],
        })
    return jsonify({"suspects": suspects})


@app.route("/api/validate/connect", methods=["POST"])
def validate_connect():
    """
    验证两条证据之间的关联合法性。

    请求体：
        ev1: 证据id1
        ev2: 证据id2
        found_evidences: 已发现的证据id列表
        connections: 已建立的关联列表（每个元素为 [ev1, ev2] 或 "ev1+ev2"）

    验证逻辑：
        1. 两条证据必须都已发现
        2. 两条证据之间必须存在 related 关系
        3. 该关联尚未被建立过
        4. 返回关联结果文本
    """
    data = request.get_json()
    ev1 = data.get("ev1")
    ev2 = data.get("ev2")
    found_evidences = data.get("found_evidences", [])
    connections = data.get("connections", [])

    # 检查证据是否存在
    if ev1 not in EVIDENCES or ev2 not in EVIDENCES:
        return jsonify({"success": False, "message": "线索不存在"})

    # 检查两条证据是否都已发现
    if ev1 not in found_evidences or ev2 not in found_evidences:
        return jsonify({"success": False, "message": "还有线索未发现"})

    # 不能关联同一个线索
    if ev1 == ev2:
        return jsonify({"success": False, "message": "不能关联同一个线索"})

    # 检查两条证据之间是否有 related 关系
    if ev2 not in EVIDENCES[ev1]["related"] and ev1 not in EVIDENCES[ev2]["related"]:
        return jsonify({"success": False, "message": "这两条线索似乎没有直接关联"})

    # 检查是否已经关联过
    if _connection_exists(ev1, ev2, connections):
        return jsonify({"success": False, "message": "这两个线索已经关联过了"})

    # 查找关联结果文本
    key = _make_connection_key(ev1, ev2)
    result = CONNECTION_RESULTS.get(key, "发现了新的关联，但还需要更多线索。")

    return jsonify({"success": True, "message": result})


@app.route("/api/validate/accuse", methods=["POST"])
def validate_accuse():
    """
    验证指认凶手的合法性。

    请求体：
        suspect_name: 被指认的嫌疑人姓名
        found_evidences: 已发现的证据id列表
        connections: 已建立的关联列表（每个元素为 [ev1, ev2] 或 "ev1+ev2"）

    验证逻辑：
        1. suspect_name 必须为 "怪盗"
        2. found_evidences 必须包含所有 required_evidences
        3. connections 必须包含 required_connections 中的至少一组
    """
    data = request.get_json()
    suspect_name = data.get("suspect_name")
    found_evidences = data.get("found_evidences", [])
    connections = data.get("connections", [])

    # 检查指认对象是否正确
    if suspect_name != "怪盗":
        return jsonify({
            "success": False,
            "message": "不对，证据指向的另有其人。再仔细看看线索之间的关联。",
            "game_over": False,
        })

    # 检查是否收集了所有必需证据
    required = ACCUSE_REQUIREMENTS["required_evidences"]
    missing = [ev_id for ev_id in required if ev_id not in found_evidences]
    if missing:
        missing_names = [EVIDENCES[ev_id]["name"] for ev_id in missing]
        return jsonify({
            "success": False,
            "message": f"证据还不够充分。你还没有调查：{', '.join(missing_names)}",
            "game_over": False,
        })

    # 检查是否建立了至少一组关键关联
    key_connections = ACCUSE_REQUIREMENTS["required_connections"]
    has_key = any(
        _connection_exists(pair[0], pair[1], connections)
        for pair in key_connections
    )
    if not has_key:
        return jsonify({
            "success": False,
            "message": "你发现了证据，但还没有理清它们之间的关系。试着在证据板上关联线索。",
            "game_over": False,
        })

    # 指认成功
    return jsonify({
        "success": True,
        "message": "没错！怪盗就是凶手。被勒索的愤怒，加上对张保安虚伪的厌恶，让他冲动杀人。",
        "game_over": True,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
