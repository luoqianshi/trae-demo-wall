"""列表分页器：总页数须把最后不足一页的零头算进去。"""


class Paginator:
    """按固定每页条数对数据集分页。"""

    def __init__(self, page_size):
        if page_size <= 0:
            raise ValueError("page_size must be positive")
        self.page_size = page_size

    def page_count(self, total):
        if total <= 0:
            return 0
        return total // self.page_size

    def slice(self, items, page):
        # page 为 1 起始；页号越界返回空列表。
        if page < 1:
            return []
        start = (page - 1) * self.page_size
        if start >= len(items):
            return []
        end = start + self.page_size
        return items[start:end]

    def last_page_size(self, total):
        # 最后一页条数：除不尽取余数，整除则为满页。
        if total <= 0:
            return 0
        rem = total % self.page_size
        return rem if rem != 0 else self.page_size
