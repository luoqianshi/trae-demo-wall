# -*- coding: utf-8 -*-
"""
弦音工坊 - 乐器数据与文化科普模块
定义五种乐器（小提琴、古琴、二胡、琵琶、古筝）的详细数据，
包括音域、文化信息、非遗身份等。
"""

INSTRUMENTS = {
    "violin": {
        "id": "violin",
        "name": "小提琴",
        "name_en": "Violin",
        "category": "西洋弦乐器",
        "icon": "🎻",
        "color": "#8B4513",
        "bg_gradient": "linear-gradient(135deg, #D4A574 0%, #8B6914 100%)",
        "tagline": "西洋弦乐之王",
        "short_desc": "音域宽广，表现力极强，被誉为「乐器皇后」",
        "history": "小提琴起源于16世纪的意大利，是西方古典音乐中最核心的弦乐器。经过四百余年的发展，小提琴以其优美音色和丰富表现力成为交响乐团的灵魂。",
        "technique": "演奏技巧包括揉弦、颤音、拨弦、双音、和弦、泛音、跳弓、连弓等，可表现从温柔到激昂的各种情感。",
        "range": {"min": 55, "max": 96, "label": "G3 - E6（约四个八度）"},
        "repertoire": ["四季（维瓦尔第）", "流浪者之歌（萨拉萨蒂）", "梁祝（何占豪·陈钢）"],
        "heritage": False,
        "heritage_year": None,
        "heritage_type": None,
        "sound_desc": "温暖而富有穿透力，弓弦摩擦产生的持续音色具有人声般的歌唱性",
        "midi_program": 41,
    },
    "guqin": {
        "id": "guqin",
        "name": "古琴",
        "name_en": "Guqin",
        "category": "中国弹拨乐器",
        "icon": "琴",  # 古琴特有emoji标识
        "color": "#2C1810",
        "bg_gradient": "linear-gradient(135deg, #3E2723 0%, #1B0F0A 100%)",
        "tagline": "三千年的文人雅乐",
        "short_desc": "中国最古老的弹拨乐器之一，承载着三千年的华夏文明",
        "history": "古琴，亦称七弦琴，是中国最古老的弹拨乐器之一，至今已有三千余年历史。2003年，古琴艺术被联合国教科文组织列入「人类非物质文化遗产代表作名录」。伯牙子期「高山流水」的知音故事就源于古琴。",
        "technique": "右手拨弦有八种基本指法（擘、托、抹、挑、勾、剔、摘、打），左手按弦可做吟、猱、绰、注等装饰音，营造独特的韵味。",
        "range": {"min": 39, "max": 76, "label": "C2 - D5（约四个八度，七根弦）"},
        "repertoire": ["高山流水", "广陵散", "梅花三弄", "平沙落雁"],
        "heritage": True,
        "heritage_year": 2003,
        "heritage_type": "人类非物质文化遗产代表作名录",
        "sound_desc": "低沉浑厚中带有空灵，泛音清澈如玉珠落盘，按弦滑音如同人的叹息",
        "midi_program": 24,
    },
    "erhu": {
        "id": "erhu",
        "name": "二胡",
        "name_en": "Erhu",
        "category": "中国拉弦乐器",
        "icon": "🎼",  # 二胡 - 拉弦乐器用乐谱图标
        "color": "#4A0E0E",
        "bg_gradient": "linear-gradient(135deg, #5D1E1E 0%, #2A0808 100%)",
        "tagline": "最接近人声的中国乐器",
        "short_desc": "仅两根弦却千变万化，以悲怆柔美著称于世",
        "history": "二胡始于唐代，至今已有一千多年历史。它由唐代的「奚琴」演变而来，是中国民族管弦乐队中的主要拉弦乐器。二胡音色接近人声，善于表达深沉、哀婉的情感，在民族音乐中占有不可替代的地位。",
        "technique": "运弓技巧丰富，包括顿弓、跳弓、颤弓、拨弦等；左手按弦有揉弦、滑音、颤音等，使二胡具有极强的表现力和歌唱性。",
        "range": {"min": 48, "max": 84, "label": "D3 - D6（约三个八度）"},
        "repertoire": ["二泉映月（华彦钧）", "赛马（黄海怀）", "江河水"],
        "heritage": True,
        "heritage_year": None,
        "heritage_type": "国家级非物质文化遗产（二胡制作技艺）",
        "sound_desc": "柔美而略带哀怨，最接近人声的音色，擅长表达细腻深沉的情感",
        "midi_program": 42,
    },
    "pipa": {
        "id": "pipa",
        "name": "琵琶",
        "name_en": "Pipa",
        "category": "中国弹拨乐器",
        "icon": "💫",  # 琵琶 - 弹拨乐器的华丽感
        "color": "#8B0000",
        "bg_gradient": "linear-gradient(135deg, #B22222 0%, #4A0000 100%)",
        "tagline": "大珠小珠落玉盘",
        "short_desc": "中国弹拨乐器之王，既能金戈铁马又能珠落玉盘",
        "history": "琵琶在中国已有两千多年的历史，最早可追溯至秦汉时期。白居易在《琵琶行》中写下「大珠小珠落玉盘」的千古名句。琵琶是唐代最为流行的乐器之一，后经丝绸之路传入日本、朝鲜等地，影响深远。",
        "technique": "右手有轮指、弹挑、滚、扫、撇等技法；左手有吟、揉、推、挽等。琵琶既能演奏温柔细腻的文曲，也能演奏慷慨激昂的武曲。",
        "range": {"min": 42, "max": 84, "label": "A2 - D6（约三个半八度，四根弦）"},
        "repertoire": ["十面埋伏", "春江花月夜", "阳春白雪"],
        "heritage": True,
        "heritage_year": None,
        "heritage_type": "国家级非物质文化遗产（琵琶艺术）",
        "sound_desc": "既有金属般的明亮颗粒感，又能发出柔和温暖的音色，刚柔并济",
        "midi_program": 24,
    },
    "guzheng": {
        "id": "guzheng",
        "name": "古筝",
        "name_en": "Guzheng",
        "category": "中国弹拨乐器",
        "icon": "🎵",  # 古筝 - 流水般的音色
        "color": "#C4A35A",
        "bg_gradient": "linear-gradient(135deg, #D4A853 0%, #8B7332 100%)",
        "tagline": "东方钢琴的优雅",
        "short_desc": "二十一弦上的东方韵味，音色清丽典雅",
        "history": "古筝起源于战国时期的秦国，距今已有两千五百余年历史，是中国最古老、最具代表性的弹拨乐器之一。古筝音域宽广、音色优美，既可独奏也可重奏，在民族乐队中常担任重要角色。近年来古筝也成为跨界音乐的宠儿。",
        "technique": "右手拨弦，基本指法有勾、托、抹、打、劈、剔、挑、花指等；左手按弦可做按音、滑音、颤音。现代筝曲还发展了双手演奏、快速指序等新技法。",
        "range": {"min": 41, "max": 88, "label": "G1 - D7（约四个八度，二十一根弦）"},
        "repertoire": ["渔舟唱晚", "高山流水", "寒鸦戏水", "战台风"],
        "heritage": True,
        "heritage_year": None,
        "heritage_type": "国家级非物质文化遗产（古筝艺术）",
        "sound_desc": "清丽空灵如流水潺潺，低音浑厚有力，高音明亮如银铃，余韵悠长",
        "midi_program": 24,
    },
}


def get_instrument(instrument_id: str) -> dict:
    """获取指定乐器的完整数据"""
    return INSTRUMENTS.get(instrument_id)


def get_all_instruments() -> list:
    """获取所有乐器的列表"""
    return list(INSTRUMENTS.values())


def get_heritage_instruments() -> list:
    """获取非遗乐器列表"""
    return [inst for inst in INSTRUMENTS.values() if inst["heritage"]]


def get_instruments_list() -> list:
    """获取乐器简要列表（用于前端展示）"""
    result = []
    for inst in INSTRUMENTS.values():
        result.append({
            "id": inst["id"],
            "name": inst["name"],
            "name_en": inst["name_en"],
            "category": inst["category"],
            "icon": inst["icon"],
            "color": inst["color"],
            "bg_gradient": inst["bg_gradient"],
            "tagline": inst["tagline"],
            "short_desc": inst["short_desc"],
            "heritage": inst["heritage"],
        })
    return result
