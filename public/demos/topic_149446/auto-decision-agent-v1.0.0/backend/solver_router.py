"""算法路由与模拟求解模块"""
import random
import time
import asyncio
from typing import Dict, Any, List

from backend.config import get_config


class SimulatedSolver:
    """模拟求解器 - 用于 demo 演示"""

    def __init__(self):
        cfg = get_config().system
        self.delay_min = cfg.simulate_delay_min
        self.delay_max = cfg.simulate_delay_max

    async def _simulate_delay(self):
        """模拟求解耗时"""
        delay = random.uniform(self.delay_min, self.delay_max)
        await asyncio.sleep(delay)

    async def solve_exact(self, model: Dict[str, Any]) -> Dict[str, Any]:
        """模拟精确算法求解"""
        await self._simulate_delay()

        scale = model.get("_scale_info", {})
        n = scale.get("estimated_nodes", 10)

        # 模拟精确求解结果
        obj_value = round(random.uniform(n * 10, n * 50), 2)
        solve_time = round(random.uniform(0.5, 5.0), 2)

        return {
            "status": "optimal",
            "objective_value": obj_value,
            "solve_time": solve_time,
            "gap": 0.0,
            "algorithm": "branch_and_bound",
            "detail": f"精确算法（分支定界）求得最优解，目标值 {obj_value}",
            "routes": self._generate_mock_routes(n, obj_value),
        }

    async def solve_alns(self, model: Dict[str, Any]) -> Dict[str, Any]:
        """模拟 ALNS 求解"""
        await self._simulate_delay()

        scale = model.get("_scale_info", {})
        n = scale.get("estimated_nodes", 10)

        obj_value = round(random.uniform(n * 12, n * 55), 2)
        solve_time = round(random.uniform(1.0, 8.0), 2)
        gap = round(random.uniform(0.5, 5.0), 2)

        return {
            "status": "feasible",
            "objective_value": obj_value,
            "solve_time": solve_time,
            "gap": gap,
            "algorithm": "ALNS",
            "detail": f"ALNS 求得近似最优解，目标值 {obj_value}，与最优解差距约 {gap}%",
            "routes": self._generate_mock_routes(n, obj_value),
        }

    async def solve_genetic(self, model: Dict[str, Any]) -> Dict[str, Any]:
        """模拟遗传算法求解"""
        await self._simulate_delay()

        scale = model.get("_scale_info", {})
        n = scale.get("estimated_nodes", 10)

        obj_value = round(random.uniform(n * 15, n * 60), 2)
        solve_time = round(random.uniform(2.0, 15.0), 2)
        gap = round(random.uniform(1.0, 8.0), 2)

        return {
            "status": "feasible",
            "objective_value": obj_value,
            "solve_time": solve_time,
            "gap": gap,
            "algorithm": "GeneticAlgorithm",
            "detail": f"遗传算法求得可行解，目标值 {obj_value}，与最优解差距约 {gap}%",
            "routes": self._generate_mock_routes(n, obj_value),
        }

    async def solve_astar(self, model: Dict[str, Any]) -> Dict[str, Any]:
        """模拟 A* 求解"""
        await self._simulate_delay()

        scale = model.get("_scale_info", {})
        n = scale.get("estimated_nodes", 10)

        obj_value = round(random.uniform(n * 8, n * 45), 2)
        solve_time = round(random.uniform(0.2, 3.0), 2)

        return {
            "status": "optimal",
            "objective_value": obj_value,
            "solve_time": solve_time,
            "gap": 0.0,
            "algorithm": "AStar",
            "detail": f"A* 算法求得最优路径，目标值 {obj_value}",
            "routes": self._generate_mock_routes(n, obj_value),
        }

    def _generate_mock_routes(self, n: int, total_distance: float) -> List[Dict[str, Any]]:
        """生成模拟路径结果"""
        if n <= 0:
            n = 5

        # 假设有 2-4 条路线
        num_routes = min(max(2, n // 5 + 1), 4)
        routes = []
        remaining = total_distance

        for i in range(num_routes):
            route_nodes = random.randint(2, max(3, n // num_routes + 1))
            node_list = ["Depot"] + [f"C{random.randint(1, n)}" for _ in range(route_nodes)] + ["Depot"]
            # 去重但保留顺序
            seen = set()
            unique_nodes = []
            for node in node_list:
                if node == "Depot" or node not in seen:
                    unique_nodes.append(node)
                    seen.add(node)
            if unique_nodes[-1] != "Depot":
                unique_nodes.append("Depot")

            if i == num_routes - 1:
                dist = round(remaining, 2)
            else:
                dist = round(remaining * random.uniform(0.2, 0.4), 2)
            remaining -= dist

            routes.append({
                "route_id": i + 1,
                "nodes": unique_nodes,
                "distance": dist,
            })

        return routes


class SolverRouter:
    """算法路由器"""

    def __init__(self):
        self.solver = SimulatedSolver()

    async def solve(self, model: Dict[str, Any], algorithm_type: str) -> Dict[str, Any]:
        """根据算法类型路由到对应求解器"""
        algorithm_type = algorithm_type.lower()

        if algorithm_type == "exact":
            result = await self.solver.solve_exact(model)
        elif algorithm_type == "alns":
            result = await self.solver.solve_alns(model)
        elif algorithm_type == "genetic":
            result = await self.solver.solve_genetic(model)
        elif algorithm_type == "astar":
            result = await self.solver.solve_astar(model)
        else:
            # 默认使用 ALNS
            result = await self.solver.solve_alns(model)

        result["algorithm_type"] = algorithm_type
        return result
