"""比赛画面过滤模块：检测球桌+球员+球同时存在才分析"""
from typing import List, Tuple
from engine.detection import Detection


class SceneFilter:
    """比赛画面过滤器

    判断一帧是否为有效比赛画面：
    - 同时检测到球桌(table) + 至少1个球员(player) + 球(ball)
    - 三个条件缺一不可，否则视为非比赛帧（如观众镜头、暂停等）
    """

    def __init__(self):
        """初始化场景过滤器"""
        pass

    def is_match_scene(self, detections: List[Detection]) -> Tuple[bool, str]:
        """判断当前帧是否为比赛画面

        Args:
            detections: 当前帧的所有检测结果

        Returns:
            (is_match, reason): 是否为比赛帧 + 原因说明
        """
        has_table = False
        has_player = False
        has_ball = False

        for det in detections:
            if det.class_name == "table":
                has_table = True
            elif det.class_name == "player":
                has_player = True
            elif det.class_name == "ball":
                has_ball = True

        # 三个条件必须同时满足
        if not has_table:
            return False, "未检测到球桌"
        if not has_player:
            return False, "未检测到球员"
        if not has_ball:
            return False, "未检测到球"

        return True, "比赛画面"

    def filter_frames(self, detections_list: List[List[Detection]]) -> List[Tuple[int, bool, str]]:
        """批量过滤帧

        Args:
            detections_list: 每帧的检测结果列表

        Returns:
            [(frame_index, is_match, reason), ...]
        """
        results = []
        for i, detections in enumerate(detections_list):
            is_match, reason = self.is_match_scene(detections)
            results.append((i, is_match, reason))
        return results
