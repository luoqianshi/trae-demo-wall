"""订单状态机：按转移表严格推进，合法必通、非法必拒。"""


class OrderStateMachine:
    """订单生命周期状态机：仅做规则判定与推进，不持有具体订单。"""

    # 转移表：{源状态: {事件: 目标状态}}。未列出的组合一律非法。
    _TRANSITIONS = {
        "pending": {"pay": "paid", "cancel": "cancelled"},
        # 已支付未发货：可发货，也可取消退款。
        "paid": {"ship": "shipped", "cancel": "cancelled"},
        "shipped": {"deliver": "delivered"},
        # delivered / cancelled 为终态，无任何出边。
        "delivered": {},
        "cancelled": {},
    }

    def can(self, state, event):
        return event in self._TRANSITIONS.get(state, {})

    def apply(self, state, event):
        table = self._TRANSITIONS.get(state, {})
        if event not in table:
            raise ValueError(f"非法转移：状态 {state} 不接受事件 {event}")
        return table[event]

    def run(self, events):
        # 从 pending 出发依次应用事件，返回最终状态。
        state = "pending"
        for event in events:
            state = self.apply(state, event)
        return state
