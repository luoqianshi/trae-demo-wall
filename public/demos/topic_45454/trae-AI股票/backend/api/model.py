"""
模型训练与预测 API
- 支持模型：线性回归 / 随机森林 / LSTM / GRU / Bi-LSTM / Attention
- 参数调节：时间步长、训练轮次、学习率、批量大小、隐藏层、Dropout
- 预设模板：快速验证 / 标准预测 / 高精度分析
"""
from flask import Blueprint, request, jsonify
from services.model_service import ModelService

model_bp = Blueprint("model", __name__)


@model_bp.route("/list", methods=["GET"])
def list_models():
    """获取可用模型列表"""
    return jsonify({
        "code": 0,
        "data": [
            {"id": "linear", "name": "线性回归", "type": "传统机器学习"},
            {"id": "random_forest", "name": "随机森林", "type": "传统机器学习"},
            {"id": "lstm", "name": "LSTM", "type": "深度学习"},
            {"id": "gru", "name": "GRU", "type": "深度学习"},
            {"id": "bilstm", "name": "Bi-LSTM", "type": "深度学习"},
            {"id": "attention", "name": "Attention-LSTM", "type": "深度学习"},
        ],
    })


@model_bp.route("/presets", methods=["GET"])
def list_presets():
    """获取参数预设模板"""
    return jsonify({
        "code": 0,
        "data": [
            {"id": "quick", "name": "快速验证",
             "params": {"time_step": 10, "epochs": 20, "learning_rate": 0.01,
                        "batch_size": 64, "hidden_units": 32, "dropout": 0.1}},
            {"id": "standard", "name": "标准预测",
             "params": {"time_step": 30, "epochs": 50, "learning_rate": 0.001,
                        "batch_size": 32, "hidden_units": 64, "dropout": 0.2}},
            {"id": "high_precision", "name": "高精度分析",
             "params": {"time_step": 60, "epochs": 100, "learning_rate": 0.0005,
                        "batch_size": 16, "hidden_units": 128, "dropout": 0.3}},
        ],
    })


@model_bp.route("/train", methods=["POST"])
def train_model():
    """训练模型并返回预测结果与评估指标"""
    payload = request.get_json(silent=True) or {}
    model_id = payload.get("model_id", "lstm")
    train_path = payload.get("train_path")
    test_path = payload.get("test_path")
    params = payload.get("params", {})

    if not train_path:
        return jsonify({"code": 400, "msg": "缺少训练数据路径"}), 400

    try:
        result = ModelService.train_and_predict(
            model_id=model_id,
            train_path=train_path,
            test_path=test_path,
            params=params,
        )
        return jsonify({"code": 0, "msg": "训练完成", "data": result})
    except Exception as e:
        return jsonify({"code": 500, "msg": f"训练失败: {str(e)}"}), 500


@model_bp.route("/compare", methods=["POST"])
def compare_models():
    """多模型对比评估"""
    payload = request.get_json(silent=True) or {}
    model_ids = payload.get("model_ids", ["linear", "lstm"])
    train_path = payload.get("train_path")
    test_path = payload.get("test_path")
    params = payload.get("params", {})

    results = []
    for mid in model_ids:
        try:
            r = ModelService.train_and_predict(mid, train_path, test_path, params)
            r["model_id"] = mid
            results.append(r)
        except Exception as e:
            results.append({"model_id": mid, "error": str(e)})

    return jsonify({"code": 0, "data": results})
