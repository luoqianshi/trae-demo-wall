"""
本地兜底验证：模拟 ai.js 中的本地兜底逻辑
- 数学计算器 (1+1)
- 字词典 (DICT)
- 古诗 (ARTICLES)
"""
import re, sys

# 模拟 DICT 和 ARTICLES
DICT = [
    {'pinyin': 'píng guǒ', 'meaning': '苹果', 'en': 'apple', 'example': '我喜欢吃苹果。', 'near': ['梨子','香蕉'], 'ant': []},
    {'pinyin': 'xué xí', 'meaning': '学习', 'en': 'study', 'example': '我们正在学习。', 'near': ['读书','用功'], 'ant': ['玩耍']},
    {'pinyin': 'ài', 'meaning': '爱', 'en': 'love', 'example': '我爱我的祖国。', 'near': ['喜爱','热爱'], 'ant': ['恨']},
]

ARTICLES = [
    {'title': '静夜思', 'author': '李白', 'text': '床前明月光...', 'translation': '明亮的月光...'},
    {'title': '悯农', 'author': '李绅', 'text': '锄禾日当午...', 'translation': '...'},
]

# 复制 ai.js 中的 _tryCalc
def _tryCalc(t):
    m = re.match(r'(-?\d+(?:\.\d+)?)\s*([\+\-\*\/×x÷%])\s*(-?\d+(?:\.\d+)?)', t)
    if not m:
        return None
    a = float(m.group(1))
    b = float(m.group(3))
    op = m.group(2)
    sym = op
    if op == 'x' or op == 'X':
        op = '*'; sym = '×'
    if op == '÷':
        op = '/'; sym = '÷'
    r = None
    if op == '+': r = a + b
    elif op == '-': r = a - b
    elif op == '*': r = a * b
    elif op == '/':
        if b == 0: return f'{a} 不能除以 0 哦'
        r = a / b
    elif op == '%': r = a % b
    if r is None: return None
    rs = str(r) if r == int(r) else f'{r:.4f}'.rstrip('0').rstrip('.')
    return f'{int(a) if a == int(a) else a} {sym} {int(b) if b == int(b) else b} = {rs}'

# 复制 ai.js 中的 _dictReply
def _dictReply(t):
    m = re.findall(r'[\u4e00-\u9fa5]{2,8}', t)
    if not m: return None
    for w in m:
        for d in DICT:
            if d['meaning'] == w or (d['meaning'] and d['meaning'].find(w) >= 0):
                out = f"{d['meaning']} [{d['pinyin']}] 英：{d['en']}\n例句：{d['example']}"
                if d.get('near'): out += f"\n近义词：{'、'.join(d['near'])}"
                if d.get('ant'): out += f"\n反义词：{'、'.join(d['ant'])}"
                return out
    return None

# 复制 ai.js 中的 _poemReply
def _poemReply(t):
    for a in ARTICLES:
        if t.find(a['title']) >= 0 or t.find(a['author']) >= 0:
            return f"《{a['title']}》{a['author']}：\n{a['text']}\n\n意思：{a['translation']}"
    return None

# 测试
print('=== 1. 数学计算器 ===')
for q in ['1+1', '12×5', '100/3', '5x5', '10-3', '苹果怎么写']:
    r = _tryCalc(q)
    print(f'  "{q}" -> {r if r else "(无匹配)"}')

print('\n=== 2. 字词典 ===')
for q in ['苹果', '苹果怎么写', '爱是什么', '学而不思则罔']:
    r = _dictReply(q)
    print(f'  "{q}" ->\n    {r if r else "(无匹配)"}')

print('\n=== 3. 古诗 ===')
for q in ['静夜思', '悯农', '李白的诗', '登鹳雀楼']:
    r = _poemReply(q)
    print(f'  "{q}" ->\n    {r if r else "(无匹配)"}')
