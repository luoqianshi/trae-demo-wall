"""购物车构建器：每次新建的购物车彼此完全独立。"""


class Cart:
    """单个购物车：持有自己独立的一份商品列表。"""

    def __init__(self, items):
        # 直接持有传入的列表引用；由 CartBuilder 负责保证传入的是独立副本。
        self._items = items

    def add(self, item):
        self._items.append(item)

    def items(self):
        return list(self._items)  # 返回副本，避免外部直接改动内部状态

    def count(self):
        return len(self._items)


class CartBuilder:
    """购物车构建器：负责为每个新车准备一份独立的商品列表。"""

    def new_cart(self, items=None):
        # 关键：默认参数用 None，再在内部新建列表，避免多次调用复用同一列表对象；
        # 传入 items 时也复制一份，确保每个购物车持有独立副本，互不串味。
        if items is None:
            items = []
        return Cart(list(items))
