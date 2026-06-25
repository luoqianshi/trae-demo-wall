"""趣味点评：基于战力数据用模板自动生成"人话点评"。

让结果有性格、可传播；纯数据驱动，无主观打分。
"""
from __future__ import annotations

from .models import ModelScorecard, Rank


def make_comment(card: ModelScorecard) -> str:
    """根据战力卡数据生成一句趣味点评。"""
    highest = card.highest_rank
    avg = card.avg_elapsed

    # 找出"折戟"的段位：第一个未点亮的段位
    stumble: Rank | None = None
    for rank in Rank.ascending():
        if not card.rank_lit(rank):
            stumble = rank
            break

    if highest == Rank.KING:
        return f"一代宗师，三档通杀傲视群雄，平均 {avg:.1f} 秒结案。"

    if highest is None:
        # 连最低段位都没全过
        if stumble:
            return f"尚未站稳脚跟，卡在{stumble.label}门口，基本功还需打磨。"
        return "本轮颗粒无收，建议回炉重练。"

    speed = "手起刀落" if avg < 2 else ("沉稳" if avg < 5 else "略显迟缓")
    tail = f"但在{stumble.label}级题前折戟。" if stumble else "稳扎稳打。"
    return f"{highest.label}段位选手（{speed}，平均 {avg:.1f}s），逻辑处理扎实，{tail}"
