"""文档解析服务 - 提取 Word/PDF 中的公式区域

支持三种提取方式：
  1. 嵌入图片：PDF/Word 中直接嵌入的图片（截图等）
  2. OMML 公式：Word 原生公式编辑器输入的公式，转为 LaTeX
  3. 页面渲染：将整页渲染为图片后送入 VLM（兜底方案）
"""
import io
import os
import re
import xml.etree.ElementTree as ET
from typing import Optional


# ============================================================
# OMML → MathML 转换表（核心映射）
# 基于 Office OMML 规范，覆盖常用数学符号
# ============================================================

_OMML_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math'
_WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
_MATHML_NS = 'http://www.w3.org/1998/Math/MathML'


def _get_all_text(elem) -> str:
    """从 OMML 元素中提取所有文本内容（同时搜索 m:t 和 w:t 命名空间）"""
    texts = []
    # 数学命名空间的文本节点
    for t in elem.iter('{%s}t' % _OMML_NS):
        if t.text:
            texts.append(t.text)
    # Word 文本命名空间的文本节点（OMML 中常混用）
    for t in elem.iter('{%s}t' % _WORD_NS):
        if t.text:
            texts.append(t.text)
    return ''.join(texts)


def _get_text(elem) -> str:
    """兼容别名"""
    return _get_all_text(elem)

# OMML 标签 → MathML 标签 / 处理函数 映射
_FRACTION_MAP = {
    'lin': 'num',    # 分子
    'den': 'den',    # 分母
}

_RADICAL_MAP = {
    'deg': None,     # 根指数（√上方小字，可选）
    'e': 'base',     # 被开方数
}

_SUP_SUB_MAP = {
    'e': 'base',     # 底数
    'sup': 'sup',    # 上标
    'sub': 'sub',    # 下标
}

_ACCENT_MAP = {
    'acc': 'accent-char',  # 音调符号
    'e': 'base',
}

_BAR_MAP = {
    'e': 'base',
}

_BORDER_BOX_MAP = {
    'e': 'base',
}


def _get_text(elem) -> str:
    """从 OMML 元素中提取文本内容"""
    texts = []
    for t in elem.iter('{%s}t' % _OMML_NS):
        if t.text:
            texts.append(t.text)
    return ''.join(texts)


def _omml_to_mathml_fraction(elem) -> str:
    """分数 m:f → mfrac"""
    num = den = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'num':
            num = _convert_omml_child(child)
        elif tag == 'den':
            den = _convert_omml_child(child)
    # 分子/分母可能是复杂表达式，不包 mi
    return f'<mfrac>{num}{den}</mfrac>'


def _omml_to_mathml_radical(elem) -> str:
    """根号 m:rad → msqrt / mroot"""
    base = ''
    deg = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        content = _convert_omml_child(child)
        if tag == 'e':
            base = content
        elif tag == 'deg':
            deg = content

    if deg and deg.strip():
        return f'<mroot>{base}<mn>{deg}</mn></mroot>'
    return f'<msqrt>{base}</msqrt>'


def _omml_to_mathml_sSup(elem) -> str:
    """上标 m:sSup → msup"""
    base = sup = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        content = _convert_omml_child(child)
        if tag == 'e':
            base = content
        elif tag == 'sup':
            sup = content
    return f'<msup>{base}<mrow>{sup}</mrow></msup>'


def _omml_to_mathml_sSub(elem) -> str:
    """下标 m:sSub → msub"""
    base = sub = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        content = _convert_omml_child(child)
        if tag == 'e':
            base = content
        elif tag == 'sub':
            sub = content
    return f'<msub>{base}<mrow>{sub}</mrow></msub>'


def _omml_to_mathml_sSubSup(elem) -> str:
    """上下标 m:sSubSup → msubsup"""
    base = sub = sup = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        content = _convert_omml_child(child)
        if tag == 'e':
            base = content
        elif tag == 'sub':
            sub = content
        elif tag == 'sup':
            sup = content
    return f'<msubsup>{base}<mrow>{sub}</mrow><mrow>{sup}</mrow></msubsup>'


def _omml_to_mathml_func(elem) -> str:
    """函数 m:func → 函数名应用"""
    fname = fval = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'fName':
            fname = _get_text(child)
        elif tag == 'e':
            fval = _convert_omml_child(child)
    return f'<mrow><mi>{fname}</mi><mo>&ApplyFunction;</mo><mfenced>{fval}</mfenced></mrow>'


def _omml_to_mathml_nary(elem) -> str:
    """N元运算符（求和、积分等）m:nary"""
    sub = sup = base = chr_name = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'naryPr':
            chr_elem = child.find('{%s}chr' % _OMML_NS)
            if chr_elem is not None:
                chr_name = chr_elem.get('{%s}val' % _OMML_NS, '')
        elif tag == 'sub':
            sub = _convert_omml_child(child)
        elif tag == 'sup':
            sup = _convert_omml_child(child)
        elif tag == 'e':
            base = _convert_omml_child(child)

    # 映射运算符字符
    op_map = {
        '∑': '&sum;',
        '∏': '&prod;',
        '∫': '&int;',
        '∮': '&oint;',
        '⋃': '&bigcup;',
        '⋂': '&bigcap;',
        '⊕': '&oplus;',
        '⊗': '&otimes;',
    }
    op = op_map.get(chr_name, chr_name)

    return (
        f'<munderover><mo>{op}</mo>'
        f'<mrow>{sub}</mrow><mrow>{sup}</mrow></munderover>'
        f'<mrow>{base}</mrow>'
    )


def _omml_to_mathml_delim(elem) -> str:
    """分隔符（括号等）m:delim"""
    content_parts = []
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'e':
            content_parts.append(_convert_omml_child(child))

    delim_pr = elem.find('{%s}delimPr' % _OMML_NS)
    beg_char = '('
    end_char = ')'
    if delim_pr is not None:
        beg_elem = delim_pr.find('{%s}begChr' % _OMML_NS)
        end_elem = delim_pr.find('{%s}endChr' % _OMML_NS)
        if beg_elem is not None:
            beg_char = beg_elem.get('{%s}val' % _OMML_NS, '(')
        if end_elem is not None:
            end_char = end_elem.get('{%s}val' % _OMML_NS, ')')

    inner = ''.join(content_parts)
    return f'<mfenced open="{beg_char}" close="{end_char}">{inner}</mfenced>'


def _omml_to_mathml_accent(elem) -> str:
    """音调符号 m:acc"""
    base = acc = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'e':
            base = _convert_omml_child(child)
        elif tag == 'accPr':
            acc_elem = child.find('{%s}chr' % _OMML_NS)
            if acc_elem is not None:
                acc = acc_elem.get('{%s}val' % _OMML_NS, '^')
    return f'<mover accent="true"><mrow>{base}</mrow><mo>{acc}</mo></mover>'


def _omml_to_mathml_bar(elem) -> str:
    """上划线/下划线 m:bar"""
    base = ''
    bar_type = 'over'
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'e':
            base = _convert_omml_child(child)
        elif tag == 'barPr':
            pos = child.attrib.get('{%s}pos' % _OMML_NS, 'top')
            bar_type = 'top' if pos == 'top' else 'bot'

    if bar_type == 'over':
        return f'<mover><mrow>{base}</mrow><mo>&OverBar;</mo></mover>'
    return f'<munder><mrow>{base}</mrow><mo>&UnderBar;</mo></munder>'


def _omml_to_mathml_borderBox(elem) -> str:
    """边框盒子 m:borderBox"""
    base = ''
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'e':
            base = _convert_omml_child(child)
    return f'<menclose notation="box"><mrow>{base}</mrow></menclose>'


def _omml_to_mathml_eqArr(elem) -> str:
    """方程数组 m:eqArr"""
    rows = []
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'e':
            rows.append(_convert_omml_child(child))
    return '<mtable>' + ''.join(f'<mtr><mtd>{r}</mtd></mtr>' for r in rows) + '</mtable>'


def _omml_to_mathml_matrix(elem) -> str:
    """矩阵 m:m"""
    rows = []
    for child in elem:
        tag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
        if tag == 'mr':
            cells = []
            for gc in child:
                gtag = gc.tag.split('}')[-1] if '}' in gc.tag else gc.tag
                if gtag == 'e':
                    cells.append(_convert_omml_child(gc))
            rows.append('<mtd>' + '</mtd><mtd>'.join(cells) + '</mtd>')
    return '<mtable>' + ''.join(f'<mtr>{r}</mtr>' for r in rows) + '</mtable>'


# OMML 标签 → 转换函数 映射
_OMML_HANDLERS = {
    'f': _omml_to_mathml_fraction,
    'rad': _omml_to_mathml_radical,
    'sSup': _omml_to_mathml_sSup,
    'sSub': _omml_to_mathml_sSub,
    'sSubSup': _omml_to_mathml_sSubSup,
    'func': _omml_to_mathml_func,
    'nary': _omml_to_mathml_nary,
    'delim': _omml_to_mathml_delim,
    'acc': _omml_to_mathml_accent,
    'bar': _omml_to_mathml_bar,
    'borderBox': _omml_to_mathml_borderBox,
    'eqArr': _omml_to_mathml_eqArr,
    'm': _omml_to_mathml_matrix,
}


# 运算符集合（用于拆分混合文本）
_OPERATORS = set('=+-×÷·<>≤≥≠≈∞∂∇()[]{}.,;:')

# 希腊字母 Unicode → LaTeX 映射（在文本阶段直接转换，避免编码问题）
_GREEK_MAP = {
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
    'ε': '\\epsilon', 'ζ': '\\zeta', 'η': '\\eta', 'θ': '\\theta',
    'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu',
    'ν': '\\nu', 'ξ': '\\xi', 'π': '\\pi', 'ρ': '\\rho',
    'σ': '\\sigma', 'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\varphi',
    'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
    'Α': '\\Alpha', 'Β': '\\Beta', 'Γ': '\\Gamma', 'Δ': '\\Delta',
    'Θ': '\\Theta', 'Λ': '\\Lambda', 'Ξ': '\\Xi', 'Π': '\\Pi',
    'Σ': '\\Sigma', 'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega',
    'ϕ': '\\phi', 'ϑ': '\\vartheta', '∂': '\\partial', '∇': '\\nabla',
    '∞': '\\infty', '×': '\\times', '÷': '\\div', '·': '\\cdot', '±': '\\pm',
}


def _tokenize_text(text: str) -> str:
    """将混合文本拆分为 MathML token 序列（正则版本）

    OMML 文本节点常包含混合内容如 "=I+"、"1-"、"(1)"，
    需要按运算符/变量边界拆分为独立 token。
    """
    if not text:
        return ''

    # 构建正则模式：运算符 | 希腊字母 | 数字序列 | 普通字母序列
    op_chars = ''.join(re.escape(c) for c in sorted(_OPERATORS, key=len, reverse=True))
    greek_chars = ''.join(re.escape(c) for c in _GREEK_MAP.keys())
    pattern = f'([{re.escape(op_chars)}])|([{re.escape(greek_chars)}])|([0-9.,]+)|([a-zA-Z]+)'

    ml_parts = []
    for m in re.finditer(pattern, text):
        if m.group(1):  # 运算符
            ch = m.group(1)
            op_map = {
                '=': '=', '+': '+', '-': '-', '×': r'\times', '÷': r'\div',
                '·': r'\cdot', '<': '<', '>': '>', '(': '(', ')': ')',
                '[': '[', ']': ']', '{': r'\{', '}': r'\}', '.': '.', ',': ',',
                ';': ';', ':': ':', '≤': r'\leq', '≥': r'\geq',
                '≠': r'\neq', '≈': r'\approx',
            }
            ml_parts.append(f'<mo>{op_map.get(ch, ch)}</mo>')
        elif m.group(2):  # 希腊字母
            ch = m.group(2)
            ml_parts.append(f'<mi>{_GREEK_MAP[ch]}</mi>')
        elif m.group(3):  # 数字
            ml_parts.append(f'<mn>{m.group(3)}</mn>')
        else:  # 普通字母/标识符
            ml_parts.append(f'<mi>{m.group(4)}</mi>')

    return ''.join(ml_parts)


def _convert_omml_child(elem) -> str:
    """递归转换 OMML 子元素为 MathML 字符串"""
    tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag

    # 文本节点 — 使用 tokenizer 拆分混合内容
    if tag == 't':
        text = elem.text or ''
        return _tokenize_text(text)

    # 已知结构标签
    handler = _OMML_HANDLERS.get(tag)
    if handler:
        return handler(elem)

    # r (run): 包含文本和格式
    if tag == 'r':
        parts = []
        for child in elem:
            ctag = child.tag.split('}')[-1] if '}' in child.tag else child.tag
            if ctag == 't':
                text = child.text or ''
                parts.append(_tokenize_text(text))
            elif ctag != 'rPr':  # 处理内嵌的 func 等结构
                parts.append(_convert_omml_child(child))
        return '<mrow>' + ''.join(parts) + '</mrow>' if parts else ''

    # 容器标签：递归处理子元素
    if tag in ('num', 'den', 'deg', 'e', 'sup', 'sub', 'fName', 'acc', 'mr'):
        parts = []
        for child in elem:
            result = _convert_omml_child(child)
            if result:
                parts.append(result)
        content = ''.join(parts)
        # num/den 需要包裹为单个 mrow，确保 mfrac 等只有 2 个子元素
        if tag in ('num', 'den') and content:
            return f'<mrow>{content}</mrow>'
        return content

    # 未知/其他标签：递归处理子元素
    parts = []
    for child in elem:
        result = _convert_omml_child(child)
        if result:
            parts.append(result)
    return ''.join(parts)


def _omml_to_mathml(omml_xml_str: str) -> str:
    """将 OMML XML 字符串转换为 MathML"""
    try:
        root = ET.fromstring(omml_xml_str)
        # 找到 oMath 根元素
        math_elem = root
        if root.tag.endswith('oMath') or 'oMath' in root.tag:
            math_elem = root
        else:
            math_elem = root.find('.//{%soMath' % _OMML_NS)
            if math_elem is None:
                math_elem = root

        result = _convert_omml_child(math_elem)
        return f'<math xmlns="{_MATHML_NS}">{result}</math>'
    except Exception:
        return ''


# ============================================================
# MathML → LaTeX 转换
# ============================================================

_MATHML_ENTITIES = {
    '&sum;': r'\sum',
    '&prod;': r'\prod',
    '&int;': r'\int',
    '&oint;': r'\oint',
    '&bigcup;': r'\bigcup',
    '&bigcap;': r'\bigcap',
    '&oplus;': r'\oplus',
    '&otimes;': r'\otimes',
    '&infin;': r'\infty',
    '&partial;': r'\partial',
    '&nabla;': r'\nabla',
    '&forall;': r'\forall',
    '&exists;': r'\exists',
    '&in;': r'\in',
    '&notin;': r'\notin',
    '&subset;': r'\subset',
    '&subseteq;': r'\subseteq',
    '&supset;': r'\supset',
    '&supseteq;': r'\supseteq',
    '&cup;': r'\cup',
    '&cap;': r'\cap',
    '&land;': r'\land',
    '&lor;': r'\lor',
    '&neg;': r'\neg',
    '&Rightarrow;': r'\Rightarrow',
    '&Leftarrow;': r'\Leftarrow',
    '&Leftrightarrow;': r'\Leftrightarrow',
    '&leq;': r'\leq',
    '&geq;': r'\geq',
    '&neq;': r'\neq',
    '&approx;': r'\approx',
    '&equiv;': r'\equiv',
    '&sim;': r'\sim',
    '&times;': r'\times',
    '&divide;': r'\div',
    '&pm;': r'\pm',
    '&mp;': r'\mp',
    '&alpha;': r'\alpha',
    '&beta;': r'\beta',
    '&gamma;': r'\gamma',
    '&delta;': r'\delta',
    '&epsilon;': r'\epsilon',
    '&varepsilon;': r'\varepsilon',
    '&zeta;': r'\zeta',
    '&eta;': r'\eta',
    '&theta;': r'\theta',
    '&vartheta;': r'\vartheta',
    '&iota;': r'\iota',
    '&kappa;': r'\kappa',
    '&lambda;': r'\lambda',
    '&mu;': r'\mu',
    '&nu;': r'\nu',
    '&xi;': r'\xi',
    '&pi;': r'\pi',
    '&varpi;': r'\varpi',
    '&rho;': r'\rho',
    '&varrho;': r'\varrho',
    '&sigma;': r'\sigma',
    '&varsigma;': r'\varsigma',
    '&tau;': r'\tau',
    '&upsilon;': r'\upsilon',
    '&phi;': r'\phi',
    '&varphi;': r'\varphi',
    '&chi;': r'\chi',
    '&psi;': r'\psi',
    '&omega;': r'\omega',
    '&Gamma;': r'\Gamma',
    '&Delta;': r'\Delta',
    '&Theta;': r'\Theta',
    '&Lambda;': r'\Lambda',
    '&Xi;': r'\Xi',
    '&Pi;': r'\Pi',
    '&Sigma;': r'\Sigma',
    '&Upsilon;': r'\Upsilon',
    '&Phi;': r'\Phi',
    '&Psi;': r'\Psi',
    '&Omega;': r'\Omega',
    '&ApplyFunction;': '',
    '&OverBar;': r'\overline',
    '&UnderBar;': r'\underline',
}


def _mathml_to_latex(mathml_str: str) -> str:
    """将 MathML 转换为 LaTeX"""
    try:
        # 替换 XML 实体引用（ElementTree 不认识 MathML 实体）
        s = mathml_str
        for entity, char in {
            '&ApplyFunction;': '\u2061',
            '&InvisibleTimes;': '\u2062',
            '&InvisibleComma;': '\u2063',
        }.items():
            s = s.replace(entity, char)
        root = ET.fromstring(s)
        return _convert_mathml_node(root)
    except Exception:
        return ''


def _convert_mathml_node(elem) -> str:
    """递归转换 MathML 节点为 LaTeX"""
    tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag

    # 数学根元素
    if tag == 'math':
        children_latex = [_convert_mathml_node(c) for c in elem]
        return ''.join(children_latex)

    # 数字
    if tag == 'mn':
        return elem.text or ''

    # 标识符（变量/函数名）
    if tag == 'mi':
        # 如果有子元素（复杂内容），递归处理
        children = list(elem)
        if children:
            return ''.join(_convert_mathml_node(c) for c in children)
        text = (elem.text or '').strip()
        # 已是 LaTeX 命令（如 \theta），直接返回
        if text.startswith('\\'):
            return text
        # 已知数学函数名 → LaTeX 命令格式
        _MATH_FUNCS = {'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
                       'arcsin', 'arccos', 'arctan',
                       'sinh', 'cosh', 'tanh', 'log', 'ln', 'exp',
                       'lim', 'max', 'min', 'sup', 'inf'}
        if text in _MATH_FUNCS:
            return '\\' + text
        # 解析实体引用
        for entity, latex in _MATHML_ENTITIES.items():
            if text == entity.replace('&', '').replace(';',''):
                return latex
        return text

    # 运算符
    if tag == 'mo':
        text = (elem.text or '').strip()
        # 已是 LaTeX 命令（如 \times, \cdot），直接返回
        if text.startswith('\\'):
            return text
        # 实体引用
        if text in _MATHML_ENTITIES:
            return _MATHML_ENTITIES[text]
        # 特殊运算符映射
        op_map = {
            '=': '=',
            '+': '+',
            '-': '-',
            '\u00b7': r'\cdot',   # ·
            '\u00d7': r'\times',   # ×
            '\u00f7': r'\div',     # ÷
            '\u2264': r'\leq',     # ≤
            '\u2265': r'\geq',     # ≥
            '\u2260': r'\neq',     # ≠
            '\u2248': r'\approx',   # ≈
            '\u2208': r'\in',      # ∈
            '\u2229': r'\cap',      # ∩
            '\u222a': r'\cup',      # ∪
            '\u2282': r'\subset',   # ⊂
            '\u2286': r'\subseteq', # ⊆
            '\u2192': r'\rightarrow', # →
            '\u2190': r'\leftarrow', # ←
            '\u2194': r'\leftrightarrow', # ↔
            '\u21d2': r'\Rightarrow', # ⇒
            '\u21d0': r'\Leftarrow', # ⇐
            '\u21d4': r'\Leftrightarrow', # ⇔
            '\u2203': r'\exists',   # ∃
            '\u2200': r'\forall',   # ∀
            '\u2202': r'\partial',  # ∂
            '\u2207': r'\nabla',    # ∇
            '\u221e': r'\infty',    # ∞
            '\u222b': r'\int',      # ∫
            '\u2211': r'\sum',      # ∑
            '\u220f': r'\prod',     # ∏
            '\u22c5': r'\cdot',     # ⋅
            '\u2061': '',           # 应用函数（不可见）
        }
        if text in op_map:
            return op_map[text]
        return text

    # 行（分组）
    if tag == 'mrow':
        children = [_convert_mathml_node(c) for c in elem]
        result = ''.join(c for c in children if c)
        return result

    # 分数
    if tag == 'mfrac':
        children = list(elem)
        if len(children) >= 2:
            num = _convert_mathml_node(children[0])
            den = _convert_mathml_node(children[1])
            return r'\frac{' + num + '}{' + den + '}'
        return ''

    # 平方根
    if tag == 'msqrt':
        children = list(elem)
        if len(children) >= 1:
            base = _convert_mathml_node(children[0])
            return r'\sqrt{' + base + '}'
        return ''

    # n次方根
    if tag == 'mroot':
        children = list(elem)
        if len(children) >= 2:
            base = _convert_mathml_node(children[0])
            deg = _convert_mathml_node(children[1])
            return r'\sqrt[' + deg + ']{' + base + '}'
        return ''

    # 上标
    if tag == 'msup':
        children = list(elem)
        if len(children) >= 2:
            base = _convert_mathml_node(children[0])
            exp = _convert_mathml_node(children[1])
            return base + '^{' + exp + '}'
        return ''

    # 下标
    if tag == 'msub':
        children = list(elem)
        if len(children) >= 2:
            base = _convert_mathml_node(children[0])
            sub = _convert_mathml_node(children[1])
            return base + '_{' + sub + '}'
        return ''

    # 上下标
    if tag == 'msubsup':
        children = list(elem)
        if len(children) >= 3:
            base = _convert_mathml_node(children[0])
            sub = _convert_mathml_node(children[1])
            sup = _convert_mathml_node(children[2])
            return base + '_{' + sub + '}^{' + sup + '}'
        return ''

    # 上划线
    if tag == 'mover':
        children = list(elem)
        if len(children) >= 2:
            base = _convert_mathml_node(children[0])
            return r'\overline{' + base + '}'
        return ''

    # 下划线
    if tag == 'munder':
        children = list(elem)
        if len(children) >= 2:
            base = _convert_mathml_node(children[0])
            under = _convert_mathml_node(children[1])
            if under.startswith('\\') and not under.startswith(r'\sum') and not under.startswith(r'\prod') and not under.startswith(r'\int'):
                return r'\underline{' + base + '}'
            # 积分/求和的上下限
            return under + '_{' + base + '}'
        return ''

    # 上下都有限制（积分、求和等）
    if tag == 'munderover':
        children = list(elem)
        if len(children) >= 3:
            op = _convert_mathml_node(children[0])
            sub = _convert_mathml_node(children[1])
            sup = _convert_mathml_node(children[2])
            return op + '_{' + sub + '}^{' + sup + '}'
        return ''

    # 围栏（括号）
    if tag == 'mfenced':
        open_c = elem.get('open', '(')
        close_c = elem.get('close', ')')
        children = [_convert_mathml_node(c) for c in elem]
        inner = ''.join(c for c in children if c)

        bracket_map = {
            '(': r'\left(',
            ')': r'\right)',
            '[': r'\left[',
            ']': r'\right]',
            '{': r'\left\{',
            '}': r'\right\}',
            '|': r'\left|',
            '\u2016': r'\left\|',  # ‖
        }

        left = bracket_map.get(open_c, r'\left' + open_c)
        right = bracket_map.get(close_c, r'\right' + close_c)
        return left + inner + right

    # 表格（矩阵/方程组）
    if tag == 'mtable':
        rows = []
        for tr in elem:
            if tr.tag.endswith('tr') or tr.tag == 'tr':
                cells = []
                for td in tr:
                    if td.tag.endswith('td') or td.tag == 'td':
                        cell_text = _convert_mathml_node(td)
                        cells.append(cell_text)
                if cells:
                    rows.append(' & '.join(cells))
        if rows:
            return '\\begin{matrix}\n' + ' \\\\\n'.join(rows) + '\n\\end{matrix}'
        return ''

    # 单元格
    if tag in ('mtd', 'td', 'tr'):
        children = [_convert_mathml_node(c) for c in elem]
        return ''.join(c for c in children if c)

    # 包围框
    if tag == 'menclose':
        children = [_convert_mathml_node(c) for c in elem]
        inner = ''.join(c for c in children if c)
        notation = elem.get('notation', '')
        if notation == 'box':
            return r'\boxed{' + inner + '}'
        return inner

    # 空间
    if tag == 'mspace':
        width = elem.get('width', '')
        if 'thick' in width:
            return r'\;'
        elif 'med' in width:
            return r'\:'
        elif 'thin' in width:
            return r'\,'
        return ' '

    # 文本
    if tag == 'mtext':
        return elem.text or ''

    # 默认：递归处理子元素
    children = [_convert_mathml_node(c) for c in elem]
    return ''.join(c for c in children if c)


def _omml_to_latex(omml_xml_str: str) -> str:
    """OMML → MathML → LaTeX 完整管线"""
    mathml = _omml_to_mathml(omml_xml_str)
    if not mathml:
        return ''
    latex = _mathml_to_latex(mathml)
    return latex.strip()


# ============================================================
# 文档解析主逻辑
# ============================================================

def parse_pdf_images(pdf_bytes: bytes) -> list[bytes]:
    """解析 PDF，提取所有页面中的图片"""
    import fitz  # PyMuPDF

    images = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)

        for img_info in image_list:
            xref = img_info[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]

            if len(image_bytes) < 2048:
                continue

            width = base_image.get("width", 0)
            height = base_image.get("height", 0)
            if width > 0 and height > 0:
                if width < 50 or height < 50:
                    continue

            images.append(image_bytes)

    doc.close()
    return images


def parse_pdf_pages_as_images(pdf_bytes: bytes, max_pages: int = 20) -> list[bytes]:
    """将 PDF 页面渲染为图片（兜底方案）"""
    import fitz

    page_images = []
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages_to_render = min(len(doc), max_pages)

    for page_num in range(pages_to_render):
        page = doc[page_num]
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("jpeg")
        page_images.append(img_bytes)

    doc.close()
    return page_images


def parse_docx_formulas(docx_bytes: bytes) -> list[str]:
    """
    解析 Word 文档，提取 OMML 原生公式并转换为 LaTeX

    Returns:
        list[str]: LaTeX 公式列表
    """
    from docx import Document
    from lxml import etree

    doc = Document(io.BytesIO(docx_bytes))
    latex_formulas = []

    OMML_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math'

    # 遍历文档 body 中的所有 oMath 元素
    for omath in doc.element.body.iter('{%s}oMath' % OMML_NS):
        try:
            omml_xml = etree.tostring(omath, encoding='unicode')
            latex = _omml_to_latex(omml_xml)
            if latex and len(latex) > 2:  # 过滤空结果
                latex_formulas.append(latex)
        except Exception:
            continue

    return latex_formulas


def parse_docx_images(docx_bytes: bytes) -> list[bytes]:
    """解析 Word 文档，提取嵌入的图片"""
    from docx import Document

    images = []
    doc = Document(io.BytesIO(docx_bytes))

    for rel in doc.part.rels.values():
        if "image" in rel.reltype:
            try:
                image_bytes = rel.target_part.blob
                if len(image_bytes) >= 2048:
                    images.append(image_bytes)
            except Exception:
                continue

    return images


def parse_document(file_bytes: bytes, filename: str) -> dict:
    """
    解析文档，返回提取的公式候选

    Args:
        file_bytes: 文档字节内容
        filename: 文档文件名

    Returns:
        dict: {
            "document_name": str,
            "images": list[bytes],       # 需要VLM识别的图片
            "omml_latex": list[str],      # 直接得到的LaTeX（来自OMML）
            "method": str                 # 解析方式描述
        }
    """
    ext = os.path.splitext(filename)[1].lower()

    if ext == ".pdf":
        images = parse_pdf_images(file_bytes)
        method = "embedded_images"

        if len(images) == 0:
            images = parse_pdf_pages_as_images(file_bytes)
            method = "page_render"

        return {
            "document_name": filename,
            "images": images,
            "omml_latex": [],
            "method": method,
        }

    elif ext in (".docx", ".doc"):
        # 优先提取 OMML 公式（最精确）
        omml_latex = parse_docx_formulas(file_bytes)

        # 同时提取嵌入图片
        images = parse_docx_images(file_bytes)

        methods = []
        if omml_latex:
            methods.append(f"omml({len(omml_latex)}个公式)")
        if images:
            methods.append(f"embedded_images({len(images)}张)")

        method = ", ".join(methods) if methods else "none"

        return {
            "document_name": filename,
            "images": images,
            "omml_latex": omml_latex,
            "method": method,
        }

    else:
        raise ValueError(f"不支持的文件格式: {ext}，请上传 .pdf、.docx 或 .doc 文件")