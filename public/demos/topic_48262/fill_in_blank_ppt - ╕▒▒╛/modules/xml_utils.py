"""XML工具模块 - 直接操作 OpenXML 实现 python-pptx 不支持的功能

包括：
- 文字透明（noFill）
- 下划线及下划线颜色（uFill）
- scheme color + lumMod/lumOff
- 点击触发动画（set visibility + fade）
"""
from lxml import etree
from pptx.util import Inches, Pt, Emu
from pptx.oxml.ns import qn
import copy

# 命名空间
NSMAP = {
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
}


def _make_element(tag: str, attrib: dict = None, children: list = None) -> etree._Element:
    """创建带命名空间的 XML 元素"""
    el = etree.SubElement(etree.Element("dummy"), qn(tag))
    if attrib:
        for k, v in attrib.items():
            el.set(k, str(v))
    if children:
        for child in children:
            el.append(child)
    # 从 dummy 中 detach
    el.getparent().remove(el)
    return el


def set_run_transparent(run):
    """设置 run 的文字为透明（noFill）"""
    rPr = run._r.find(qn('a:rPr'))
    if rPr is None:
        rPr = etree.SubElement(run._r, qn('a:rPr'))
        run._r.insert(0, rPr)

    # 移除已有的 solidFill
    for sf in rPr.findall(qn('a:solidFill')):
        rPr.remove(sf)

    # 添加 noFill（必须在 solidFill 之前，但在 schemeClr 等之后的位置取决于schema）
    # 实际位置：noFill 应该在 rPr 的子元素中
    no_fill = etree.SubElement(rPr, qn('a:noFill'))


def set_run_black(run):
    """设置 run 的文字为黑色（schemeClr tx1）"""
    rPr = run._r.find(qn('a:rPr'))
    if rPr is None:
        rPr = etree.SubElement(run._r, qn('a:rPr'))
        run._r.insert(0, rPr)

    # 移除已有的 solidFill / noFill
    for sf in rPr.findall(qn('a:solidFill')):
        rPr.remove(sf)
    for nf in rPr.findall(qn('a:noFill')):
        rPr.remove(nf)

    solid_fill = etree.SubElement(rPr, qn('a:solidFill'))
    scheme_clr = etree.SubElement(solid_fill, qn('a:schemeClr'))
    scheme_clr.set('val', 'tx1')


def set_run_underline_black(run):
    """设置 run 为单下划线 + 黑色下划线颜色"""
    rPr = run._r.find(qn('a:rPr'))
    if rPr is None:
        rPr = etree.SubElement(run._r, qn('a:rPr'))
        run._r.insert(0, rPr)

    # 设置下划线属性 u="sng"
    rPr.set('u', 'sng')

    # 设置文字为透明
    for sf in rPr.findall(qn('a:solidFill')):
        rPr.remove(sf)
    for nf in rPr.findall(qn('a:noFill')):
        rPr.remove(nf)
    etree.SubElement(rPr, qn('a:noFill'))

    # 设置下划线颜色（uFill）
    for uf in rPr.findall(qn('a:uFill')):
        rPr.remove(uf)

    u_fill = etree.SubElement(rPr, qn('a:uFill'))
    solid_fill = etree.SubElement(u_fill, qn('a:solidFill'))
    scheme_clr = etree.SubElement(solid_fill, qn('a:schemeClr'))
    scheme_clr.set('val', 'tx1')


def set_run_blue_answer(run):
    """设置 run 为蓝色答案文字（accent1 + lumMod 60000 + lumOff 40000）"""
    rPr = run._r.find(qn('a:rPr'))
    if rPr is None:
        rPr = etree.SubElement(run._r, qn('a:rPr'))
        run._r.insert(0, rPr)

    # 移除已有的 solidFill / noFill
    for sf in rPr.findall(qn('a:solidFill')):
        rPr.remove(sf)
    for nf in rPr.findall(qn('a:noFill')):
        rPr.remove(nf)

    # 添加蓝色填充
    solid_fill = etree.SubElement(rPr, qn('a:solidFill'))
    scheme_clr = etree.SubElement(solid_fill, qn('a:schemeClr'))
    scheme_clr.set('val', 'accent1')

    # 添加亮度调制
    lum_mod = etree.SubElement(scheme_clr, qn('a:lumMod'))
    lum_mod.set('val', '60000')

    lum_off = etree.SubElement(scheme_clr, qn('a:lumOff'))
    lum_off.set('val', '40000')


def set_shape_no_fill_no_line(shape):
    """设置 shape 无填充、无边框"""
    spPr = shape._element.find(qn('p:spPr'))
    if spPr is None:
        spPr = shape._element.find('.//' + qn('p:spPr'))
    if spPr is None:
        # 直接找 spPr
        for child in shape._element:
            if child.tag.endswith('}spPr'):
                spPr = child
                break

    if spPr is None:
        return

    # 移除已有填充
    for fill_tag in ['a:noFill', 'a:solidFill', 'a:gradFill', 'a:blipFill', 'a:pattFill', 'a:grpFill']:
        for el in spPr.findall(qn(fill_tag)):
            spPr.remove(el)

    # 添加无填充（位置必须在 ln 之前）
    no_fill = etree.SubElement(spPr, qn('a:noFill'))

    # 处理线条
    ln = spPr.find(qn('a:ln'))
    if ln is not None:
        spPr.remove(ln)

    ln = etree.SubElement(spPr, qn('a:ln'))
    ln_no_fill = etree.SubElement(ln, qn('a:noFill'))


def fix_shape_body_pr(shape, config: dict):
    """修复 AUTO_SHAPE 的 bodyPr，使其与基础文本框完全一致

    关键修复：
    1. 移除 anchor="ctr"（垂直居中），改为顶部对齐
    2. 设置 vert="horz"
    3. 统一边距（lIns=90000, tIns=46800, rIns=90000, bIns=46800）
    4. 设置 noAutofit
    """
    txBody = shape._element.find(qn('p:txBody'))
    if txBody is None:
        return

    bodyPr = txBody.find(qn('a:bodyPr'))
    if bodyPr is None:
        return

    # 清除所有属性，重新设置
    for attr in list(bodyPr.attrib.keys()):
        del bodyPr.attrib[attr]

    # 设置与参考PPT一致的属性
    bodyPr.set('vert', 'horz')
    bodyPr.set('lIns', '90000')
    bodyPr.set('tIns', '46800')
    bodyPr.set('rIns', '90000')
    bodyPr.set('bIns', '46800')
    bodyPr.set('rtlCol', '0')

    # 确保有 noAutofit
    for child in list(bodyPr):
        bodyPr.remove(child)
    etree.SubElement(bodyPr, qn('a:noAutofit'))

    # 添加 lstStyle 以确保段落格式一致
    lstStyle = txBody.find(qn('a:lstStyle'))
    if lstStyle is None:
        lstStyle = etree.SubElement(txBody, qn('a:lstStyle'))
    else:
        for child in list(lstStyle):
            lstStyle.remove(child)

    # 添加 lvl1pPr（与参考PPT一致）
    lvl1pPr = etree.SubElement(lstStyle, qn('a:lvl1pPr'))
    lvl1pPr.set('marL', '0')
    lvl1pPr.set('indent', '0')
    lvl1pPr.set('algn', 'l')
    lvl1pPr.set('defTabSz', '914400')
    lvl1pPr.set('rtl', '0')
    lvl1pPr.set('eaLnBrk', '1')
    lvl1pPr.set('fontAlgn', 'auto')
    lvl1pPr.set('latinLnBrk', '0')
    lvl1pPr.set('hangingPunct', '1')

    # 行间距
    lnSpc = etree.SubElement(lvl1pPr, qn('a:lnSpc'))
    spcPct = etree.SubElement(lnSpc, qn('a:spcPct'))
    spcPct.set('val', str(config.get("line_spacing_pct", 130) * 1000))

    # 段后间距
    spcAft = etree.SubElement(lvl1pPr, qn('a:spcAft'))
    spcPts = etree.SubElement(spcAft, qn('a:spcPts'))
    spcPts.set('val', str(config.get("space_after_pt", 1) * 100))

    # 默认字体
    defRPr = etree.SubElement(lvl1pPr, qn('a:defRPr'))
    defRPr.set('sz', str(config.get("font_size_pt", 32) * 100))
    defRPr.set('lang', 'zh-CN')
    defRPr.set('altLang', 'en-US')

    # 设置 latin 和 ea 字体
    latin = etree.SubElement(defRPr, qn('a:latin'))
    latin.set('typeface', config.get("body_font_name", "仓耳渔阳体 W02"))
    ea = etree.SubElement(defRPr, qn('a:ea'))
    ea.set('typeface', config.get("body_font_name", "仓耳渔阳体 W02"))


def set_shape_hidden(shape):
    """设置 shape 初始隐藏（通过 cNvPr 的 style 属性）"""
    # 在 nvSpPr/cNvPr 上不能直接设 visibility
    # 实际通过动画的 set 行为控制，这里只标记
    # 但我们需要在 shape 的 nvSpPr 中添加 nvPr 来标记初始状态
    pass  # 动画会处理 visibility


def add_click_fade_animation(slide, shape_ids: list, config: dict = None):
    """
    为一组 shape 添加点击触发淡入动画

    每个 shape 对应一个点击步骤：
    1. set visibility -> visible
    2. animEffect fade in (500ms)

    Args:
        slide: pptx Slide 对象
        shape_ids: list of (shape_id, para_idx) tuples
                   para_idx = 答案文字所在的段落索引（用于 pRg）
    """
    if not shape_ids:
        return

    # 获取 slide 的 XML 根元素
    sld = slide._element

    # 移除已有的 timing
    old_timing = sld.find(qn('p:timing'))
    if old_timing is not None:
        sld.remove(old_timing)

    # 构建 timing XML
    timing_xml = build_timing_xml(shape_ids, config)
    timing_el = etree.fromstring(timing_xml.encode('utf-8'))
    sld.append(timing_el)


def build_timing_xml(shape_specs: list, config: dict = None) -> str:
    """构建完整的动画 timing XML（与参考PPT结构完全一致）

    Args:
        shape_specs: list of (shape_id, para_idx) tuples
                     para_idx = 答案文字所在的段落索引
    """
    # ID 计数器，从3开始（1=tmRoot, 2=mainSeq）
    next_id = [3]

    def get_id():
        val = next_id[0]
        next_id[0] += 1
        return val

    # 为每个 shape 构建一个 par 节点（3层嵌套，与参考PPT一致）
    par_nodes = []
    for spec in shape_specs:
        if isinstance(spec, tuple):
            if len(spec) >= 2:
                shape_id, para_idx = spec[0], spec[1]
            else:
                shape_id, para_idx = spec[0], 0
        else:
            shape_id = spec
            para_idx = 0

        # 外层 par/cTn
        outer_cTn_id = get_id()
        # 中层 par/cTn
        mid_cTn_id = get_id()
        # 内层 par/cTn (包含 presetID, presetClass, nodeType)
        inner_cTn_id = get_id()
        # set 行为的 cTn
        set_cTn_id = get_id()
        # animEffect 的 cTn
        anim_cTn_id = get_id()

        # 段落范围：使用答案文字所在的段落索引
        para_st = para_idx
        para_end = para_idx

        par_xml = f"""<p:par>
  <p:cTn id="{outer_cTn_id}" fill="hold">
    <p:stCondLst>
      <p:cond delay="indefinite"/>
    </p:stCondLst>
    <p:childTnLst>
      <p:par>
        <p:cTn id="{mid_cTn_id}" fill="hold">
          <p:stCondLst>
            <p:cond delay="0"/>
          </p:stCondLst>
          <p:childTnLst>
            <p:par>
              <p:cTn id="{inner_cTn_id}" presetID="10" presetClass="entr" presetSubtype="0" fill="hold" grpId="0" nodeType="clickEffect">
                <p:stCondLst>
                  <p:cond delay="0"/>
                </p:stCondLst>
                <p:childTnLst>
                  <p:set>
                    <p:cBhvr>
                      <p:cTn id="{set_cTn_id}" dur="1" fill="hold">
                        <p:stCondLst>
                          <p:cond delay="0"/>
                        </p:stCondLst>
                      </p:cTn>
                      <p:tgtEl>
                        <p:spTgt spid="{shape_id}">
                          <p:txEl>
                            <p:pRg st="{para_st}" end="{para_end}"/>
                          </p:txEl>
                        </p:spTgt>
                      </p:tgtEl>
                      <p:attrNameLst>
                        <p:attrName>style.visibility</p:attrName>
                      </p:attrNameLst>
                    </p:cBhvr>
                    <p:to>
                      <p:strVal val="visible"/>
                    </p:to>
                  </p:set>
                  <p:animEffect transition="in" filter="fade">
                    <p:cBhvr>
                      <p:cTn id="{anim_cTn_id}" dur="500"/>
                      <p:tgtEl>
                        <p:spTgt spid="{shape_id}">
                          <p:txEl>
                            <p:pRg st="{para_st}" end="{para_end}"/>
                          </p:txEl>
                        </p:spTgt>
                      </p:tgtEl>
                    </p:cBhvr>
                  </p:animEffect>
                </p:childTnLst>
              </p:cTn>
            </p:par>
          </p:childTnLst>
        </p:cTn>
      </p:par>
    </p:childTnLst>
  </p:cTn>
</p:par>"""
        par_nodes.append(par_xml)

    pars_xml = '\n'.join(par_nodes)

    timing_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:timing xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:tnLst>
    <p:par>
      <p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot">
        <p:childTnLst>
          <p:seq concurrent="1" nextAc="seek">
            <p:cTn id="2" dur="indefinite" nodeType="mainSeq">
              <p:childTnLst>
                {pars_xml}
              </p:childTnLst>
            </p:cTn>
            <p:prevCondLst>
              <p:cond evt="onPrev" delay="0">
                <p:tgtEl><p:sldTgt/></p:tgtEl>
              </p:cond>
            </p:prevCondLst>
            <p:nextCondLst>
              <p:cond evt="onNext" delay="0">
                <p:tgtEl><p:sldTgt/></p:tgtEl>
              </p:cond>
            </p:nextCondLst>
          </p:seq>
        </p:childTnLst>
      </p:cTn>
    </p:par>
  </p:tnLst>
  <p:bldLst>
"""
    for spec in shape_specs:
        if isinstance(spec, tuple):
            shape_id = spec[0]
        else:
            shape_id = spec
        # 添加 build="p" 属性（与参考PPT一致）
        timing_xml += f'    <p:bldP spid="{shape_id}" grpId="0" build="p"/>\n'
    timing_xml += """  </p:bldLst>
</p:timing>"""

    return timing_xml


def split_text_by_blanks(text: str, blanks: list = None) -> list:
    """
    将文本按挖空词拆分为 segments

    优先使用 {{}} 标记精确定位挖空词（避免子串匹配和重复匹配问题）。
    如果文本中没有 {{}} 标记，则回退到字符串搜索。

    返回: [(text_segment, is_blank), ...]

    例如:
      text = "建设选择在{{河流峡谷}}处"
      返回: [("建设选择在", False), ("河流峡谷", True), ("处", False)]
    """
    import re

    # 检查文本中是否有 {{}} 标记
    if '{{' in text and '}}' in text:
        # 使用 {{}} 标记精确拆分
        # 注意：内层用非捕获组 (?:...) 避免双重捕获导致重复
        pattern = r'\{\{(?:[^}]+)\}\}'
        parts = re.split(f'({pattern})', text)

        result = []
        for part in parts:
            if not part:
                continue
            m = re.match(r'^\{\{([^}]+)\}\}$', part)
            if m:
                # 这是一个挖空词标记，提取内部文字
                result.append((m.group(1), True))
            else:
                # 普通文本
                result.append((part, False))
        return result

    # 回退：无标记时用字符串搜索（兼容旧代码）
    if not blanks:
        return [(text, False)]

    # 找到所有挖空词的位置
    positions = []
    for blank in blanks:
        start = 0
        while True:
            idx = text.find(blank, start)
            if idx == -1:
                break
            positions.append((idx, idx + len(blank), blank))
            start = idx + len(blank)

    if not positions:
        return [(text, False)]

    # 按位置排序
    positions.sort(key=lambda x: x[0])

    # 构建分段
    segments = []
    prev_end = 0

    for start, end, blank_text in positions:
        if start > prev_end:
            segments.append((text[prev_end:start], False))
        segments.append((blank_text, True))
        prev_end = end

    if prev_end < len(text):
        segments.append((text[prev_end:], False))

    return segments


def configure_run_font(run, config: dict, is_title: bool = False):
    """配置 run 的基本字体属性"""
    font = run.font
    font.size = Pt(config.get("font_size_pt", 32))

    if is_title:
        typeface = config.get("title_font_name", "仓耳与墨 W02")
    else:
        typeface = config.get("body_font_name", "仓耳渔阳体 W02")

    rPr = run._r.find(qn('a:rPr'))
    if rPr is None:
        rPr = etree.SubElement(run._r, qn('a:rPr'))
        run._r.insert(0, rPr)

    # 设置 latin 字体（先设置，避免 getter 报错）
    for existing_latin in rPr.findall(qn('a:latin')):
        rPr.remove(existing_latin)
    latin = etree.SubElement(rPr, qn('a:latin'))
    latin.set('typeface', typeface)

    # 设置 ea (East Asian) 字体
    for existing_ea in rPr.findall(qn('a:ea')):
        rPr.remove(existing_ea)
    ea = etree.SubElement(rPr, qn('a:ea'))
    ea.set('typeface', typeface)
