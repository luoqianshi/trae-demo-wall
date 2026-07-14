"""解验证与反馈循环模块"""
import random
from typing import Dict, Any, List, Tuple

from backend.config import get_config


class SolutionValidator:
    """解的合理性验证器"""

    def validate(self, model: Dict[str, Any], solution: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        验证解的合理性
        返回: (是否通过, 错误列表)
        """
        errors = []

        # 1. 基本状态检查
        if solution.get("status") not in ["optimal", "feasible"]:
            errors.append(f"求解状态异常: {solution.get('status')}")

        # 2. 目标函数值检查
        obj_value = solution.get("objective_value")
        if obj_value is None:
            errors.append("解缺少目标函数值")
        elif obj_value < 0:
            # 某些问题目标值不应为负（如距离）
            model_type = model.get("model_name", "").lower()
            if any(k in model_type for k in ["距离", "路径", "vrp", "tsp", "成本", "时间"]):
                if obj_value < 0:
                    errors.append(f"目标函数值 {obj_value} 为负数，不符合物理意义")

        # 3. 路径/解结构检查
        routes = solution.get("routes", [])
        if routes:
            total_dist = sum(r.get("distance", 0) for r in routes)
            if abs(total_dist - obj_value) > 0.1:
                errors.append(f"路径总距离 {total_dist} 与目标值 {obj_value} 不一致")

            for i, route in enumerate(routes):
                nodes = route.get("nodes", [])
                if len(nodes) < 2:
                    errors.append(f"路线 {i+1} 节点数过少")
                if nodes and nodes[0] != "Depot":
                    errors.append(f"路线 {i+1} 未从 Depot 出发")
                if nodes and nodes[-1] != "Depot":
                    errors.append(f"路线 {i+1} 未回到 Depot")

        # 4. 求解时间合理性
        solve_time = solution.get("solve_time", 0)
        if solve_time > 300:
            errors.append(f"求解时间过长: {solve_time}s，建议更换算法")

        # 5. Gap 检查（启发式算法）
        gap = solution.get("gap", 0)
        if gap > 20:
            errors.append(f"解的质量较差，与最优解差距 {gap}%")
        elif gap > 10:
            errors.append(f"解的质量一般，与最优解差距 {gap}%")

        # 6. 模拟随机失败（用于演示反馈循环）
        # 有 5% 概率触发验证失败，演示反馈机制
        if random.random() < 0.05:
            errors.append("模拟验证：发现约束违反（车辆容量超限）")

        return len(errors) == 0, errors


class FeedbackLoop:
    """反馈循环控制器"""

    def __init__(self):
        self.validator = SolutionValidator()
        self.max_retries = get_config().system.max_validation_retries

    async def run(
        self,
        model: Dict[str, Any],
        algorithm_type: str,
        solve_func,
        fix_model_func,
        fix_algo_func,
    ) -> Dict[str, Any]:
        """
        执行求解-验证-反馈循环

        Args:
            model: 数学模型
            algorithm_type: 当前算法类型
            solve_func: 求解函数
            fix_model_func: 模型修正函数（LLM）
            fix_algo_func: 算法调整函数（LLM）

        Returns:
            最终结果，包含 solution 和是否需要用户介入
        """
        iteration = 0
        current_model = model
        current_algorithm = algorithm_type
        history = []

        while iteration <= self.max_retries:
            # 求解
            solution = await solve_func(current_model, current_algorithm)
            history.append({
                "iteration": iteration,
                "algorithm": current_algorithm,
                "solution": solution,
            })

            # 验证
            is_valid, errors = self.validator.validate(current_model, solution)

            if is_valid:
                return {
                    "success": True,
                    "solution": solution,
                    "model": current_model,
                    "algorithm": current_algorithm,
                    "iterations": iteration,
                    "history": history,
                    "need_user_input": False,
                }

            # 验证失败，进入反馈循环
            if iteration >= self.max_retries:
                # 超过最大重试次数，需要用户介入
                return {
                    "success": False,
                    "solution": solution,
                    "model": current_model,
                    "algorithm": current_algorithm,
                    "iterations": iteration,
                    "errors": errors,
                    "history": history,
                    "need_user_input": True,
                    "message": f"经过 {self.max_retries + 1} 次尝试仍未获得有效解，请检查问题描述或数据",
                }

            # 尝试修正
            # 50% 概率修正模型，50% 概率更换算法
            if iteration % 2 == 0:
                # 修正模型
                current_model = await fix_model_func(current_model, errors, iteration + 1)
            else:
                # 更换算法
                current_algorithm = await fix_algo_func(current_model, current_algorithm, errors, iteration + 1)

            iteration += 1

        # 理论上不会到达这里
        return {
            "success": False,
            "need_user_input": True,
            "message": "求解过程异常终止",
        }
