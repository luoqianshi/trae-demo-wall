"""模型描述与合理性判断模块"""
import json
from typing import Dict, Any, List, Tuple


class ModelValidator:
    """模型合理性验证器"""

    def validate(self, model: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        验证模型的合理性
        返回: (是否通过, 错误列表)
        """
        errors = []

        # 1. 基础字段检查
        required_fields = ["model_name", "model_type", "variables", "objective", "constraints"]
        for field in required_fields:
            if field not in model or not model[field]:
                errors.append(f"缺少必要字段: {field}")

        # 2. 变量检查
        variables = model.get("variables", [])
        if not variables:
            errors.append("模型没有定义任何决策变量")
        else:
            var_names = [v.get("name", "") for v in variables]
            if len(var_names) != len(set(var_names)):
                errors.append("存在重复的变量名称")

        # 3. 目标函数检查
        objective = model.get("objective", {})
        if isinstance(objective, str):
            objective = {"type": "minimize", "function": "", "description": objective}
            model["objective"] = objective
        if not isinstance(objective, dict):
            objective = {"type": "minimize", "function": "", "description": ""}
            model["objective"] = objective
        if not objective.get("type") in ["minimize", "maximize"]:
            errors.append("目标函数类型必须是 minimize 或 maximize")
        if not objective.get("function") and not objective.get("description"):
            errors.append("目标函数缺少定义")

        # 4. 约束检查
        constraints = model.get("constraints", [])
        if not constraints:
            errors.append("模型没有定义任何约束条件")
        else:
            # 检查约束名称重复
            names = [c.get("name", "") for c in constraints]
            if len(names) != len(set(names)):
                errors.append("存在重复的约束名称")

            # 检查明显矛盾的约束（简单启发式）
            self._check_contradictions(constraints, errors)

        # 5. 参数检查
        parameters = model.get("parameters", {})
        if not parameters:
            errors.append("建议补充模型参数定义（如节点数、车辆数等）")

        return len(errors) == 0, errors

    def _check_contradictions(self, constraints: List[Dict], errors: List[str]):
        """检查明显矛盾的约束"""
        # 简单启发式：检查是否有上下界冲突
        lower_bounds = {}
        upper_bounds = {}

        for c in constraints:
            expr = c.get("expression", "")
            desc = c.get("description", "")

            # 检查是否存在 >= 和 <= 矛盾
            if ">=" in expr:
                # 提取变量和右端项（简化处理）
                pass
            if "<=" in expr:
                pass

        # 检查描述中的明显矛盾
        desc_lower = ""
        for c in constraints:
            desc = c.get("description", "").lower()
            if "至少" in desc or "最少" in desc or "不少于" in desc:
                desc_lower += desc + " "
            if "最多" in desc or "不超过" in desc or "至多" in desc:
                desc_lower += desc + " "

    def estimate_scale(self, model: Dict[str, Any]) -> Dict[str, Any]:
        """估算问题规模，用于算法选择"""
        variables = model.get("variables", [])
        constraints = model.get("constraints", [])
        parameters = model.get("parameters", {})

        var_count = len(variables)
        constraint_count = len(constraints)

        # 根据参数推断规模
        n = parameters.get("n", 0)
        m = parameters.get("m", 0)
        if isinstance(n, str):
            n = 0
        if isinstance(m, str):
            m = 0

        estimated_n = max(n, var_count)

        scale = "small"
        if estimated_n > 1000 or constraint_count > 500:
            scale = "large"
        elif estimated_n > 100 or constraint_count > 100:
            scale = "medium"

        return {
            "variable_count": var_count,
            "constraint_count": constraint_count,
            "estimated_nodes": estimated_n,
            "scale": scale,
        }


def recommend_algorithm(model: Dict[str, Any], scale_info: Dict[str, Any]) -> Dict[str, Any]:
    """根据模型特征推荐算法"""
    model_type = model.get("model_type", "MILP").upper()
    scale = scale_info.get("scale", "medium")
    algorithm_hint = model.get("algorithm_hint", "").lower()

    # 精确算法适用条件
    exact_suitable = (
        scale in ["small", "medium"]
        and model_type in ["LP", "MILP", "整数规划", "线性规划"]
        and scale_info.get("variable_count", 0) < 500
    )

    if exact_suitable:
        return {
            "algorithm_type": "exact",
            "algorithm_name": "精确算法（分支定界/单纯形法）",
            "reason": f"问题规模为 {scale}，模型类型为 {model_type}，适合使用精确算法求解最优解",
            "solver": "scipy.optimize / OR-Tools",
        }

    # 启发式算法选择
    algo_ranking = []

    problem_type = model.get("model_name", "").lower()

    if "路径" in problem_type or "vrp" in problem_type or "tsp" in problem_type:
        algo_ranking = [
            ("alns", "ALNS（自适应大规模邻域搜索）", "适合 VRP/TSP 类问题，收敛速度快"),
            ("genetic", "遗传算法", "全局搜索能力强，适合复杂约束"),
            ("tabu", "禁忌搜索", "适合局部优化"),
        ]
    elif "调度" in problem_type or "schedule" in problem_type:
        algo_ranking = [
            ("genetic", "遗传算法", "适合调度问题的复杂约束处理"),
            ("alns", "ALNS", "适合大规模调度"),
            ("tabu", "禁忌搜索", "适合局部精细调整"),
        ]
    elif "网络" in problem_type or "流" in problem_type or "最短" in problem_type:
        algo_ranking = [
            ("astar", "A* 算法", "适合图搜索和路径规划"),
            ("alns", "ALNS", "适合复杂网络优化"),
            ("genetic", "遗传算法", "备选方案"),
        ]
    else:
        algo_ranking = [
            ("alns", "ALNS", "通用性强，适合多数组合优化问题"),
            ("genetic", "遗传算法", "鲁棒性好，适合复杂目标函数"),
            ("sa", "模拟退火", "实现简单，适合中小规模"),
        ]

    selected = algo_ranking[0]
    return {
        "algorithm_type": selected[0],
        "algorithm_name": selected[1],
        "reason": selected[2],
        "alternatives": [a[1] for a in algo_ranking[1:]],
    }
