"""
可视化数据 API
- 历史走势 + 预测曲线叠加
- 误差分布分析
- Attention 权重可视化
- 多模型评估指标对比
"""
from flask import Blueprint, request, jsonify
from services.model_service import ModelService

visualize_bp = Blueprint("visualize", __name__)


@visualize_bp.route("/forecast", methods=["POST"])
def forecast_chart():
    """历史走势与预测曲线叠加数据"""
    payload = request.get_json(silent=True) or {}
    result = ModelService.get_forecast_data(payload)
    return jsonify({"code": 0, "data": result})


@visualize_bp.route("/error-distribution", methods=["POST"])
def error_chart():
    """预测误差分布（直方图 + 残差曲线）"""
    payload = request.get_json(silent=True) or {}
    result = ModelService.get_error_distribution(payload)
    return jsonify({"code": 0, "data": result})


@visualize_bp.route("/attention", methods=["POST"])
def attention_chart():
    """Attention 权重热力图数据"""
    payload = request.get_json(silent=True) or {}
    result = ModelService.get_attention_weights(payload)
    return jsonify({"code": 0, "data": result})


@visualize_bp.route("/metrics-compare", methods=["POST"])
def metrics_compare():
    """多模型评估指标并排对比"""
    payload = request.get_json(silent=True) or {}
    result = ModelService.get_metrics_comparison(payload)
    return jsonify({"code": 0, "data": result})
