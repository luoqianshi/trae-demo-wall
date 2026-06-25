"""购物车构建器：每次新建的购物车彼此完全独立。"""


class Cart:
    """单个购物车：持有自己的一份商品列表。"""

    def __init__(self, items):
        self._items = items

    def add(self, item):
        self._items.append(item)

    def items(self):
        return list(self._items)  # 返回副本，避免外部直接改动内部状态

    def count(self):
        return len(self._items)


class CartBuilder:
    """购物车构建器：为每个新车准备商品列表。"""

    def new_cart(self, items=[]):
        return Cart(items)
