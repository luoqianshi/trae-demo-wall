"""批量记录解析器：逐条解析为非负整数，坏记录如实登记到 errors。"""


class BatchResult:
    """解析结果：成功值列表 + 失败记录列表，并提供计数。"""

    def __init__(self, results, errors):
        self.results = results
        self.errors = errors  # 每项为 (下标, 原始值, 原因字符串)

    @property
    def ok_count(self):
        return len(self.results)

    @property
    def error_count(self):
        return len(self.errors)


class BatchParser:
    """批处理解析器：单条失败不影响整批，且失败必须被登记。"""

    def _parse_one(self, raw):
        # 解析单条：要求是非负整数的十进制表示，否则抛异常。
        value = int(raw)          # 非数字 / None 会抛 ValueError / TypeError
        if value < 0:
            raise ValueError("负数不被接受")
        return value

    def parse(self, records):
        results = []
        errors = []
        for index, raw in enumerate(records):
            try:
                results.append(self._parse_one(raw))
            except Exception as exc:
                # 关键：捕获后必须如实登记失败记录，不能静默跳过，
                # 以保证 ok_count + error_count == len(records) 且错误可上报。
                errors.append((index, raw, str(exc)))
        return BatchResult(results, errors)
