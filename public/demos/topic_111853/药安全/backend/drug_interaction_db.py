"""
药管家 药物相互作用规则数据库
基于权威医学数据构建的药物相互作用规则引擎
作为主检测引擎，LLM仅作为辅助解释层
"""
import sqlite3
import os
from itertools import combinations

DB_PATH = os.path.join(os.path.dirname(__file__), 'medicine.db')

INTERACTION_RULES = [
    {
        'drug_a': '阿莫西林',
        'drug_b': '克拉霉素',
        'risk_level': 'danger',
        'description': '阿莫西林与克拉霉素联用可能增加胃肠道不良反应风险，且两者抗菌谱存在重叠',
        'suggestion': '避免联用，如需联合用药请咨询医生调整方案',
        'mechanism': '胃肠道菌群失调叠加',
        'severity': 3,
    },
    {
        'drug_a': '阿莫西林',
        'drug_b': '甲硝唑',
        'risk_level': 'warning',
        'description': '阿莫西林与甲硝唑联用可能增加二重感染风险',
        'suggestion': '联用期间注意观察肠道症状，必要时补充益生菌',
        'mechanism': '肠道菌群协同抑制',
        'severity': 2,
    },
    {
        'drug_a': '布洛芬',
        'drug_b': '阿司匹林',
        'risk_level': 'danger',
        'description': '布洛芬与阿司匹林联用显著增加胃肠道出血风险',
        'suggestion': '严禁联用，选择其中一种非甾体抗炎药即可',
        'mechanism': '前列腺素合成双重抑制',
        'severity': 3,
    },
    {
        'drug_a': '布洛芬',
        'drug_b': '华法林',
        'risk_level': 'danger',
        'description': '布洛芬增强华法林的抗凝作用，显著增加出血风险',
        'suggestion': '避免联用，如必须使用请密切监测凝血功能',
        'mechanism': '血浆蛋白结合置换',
        'severity': 3,
    },
    {
        'drug_a': '布洛芬',
        'drug_b': '地高辛',
        'risk_level': 'warning',
        'description': '布洛芬可能增加地高辛血药浓度，导致洋地黄中毒',
        'suggestion': '联用期间监测地高辛血药浓度',
        'mechanism': '肾清除率降低',
        'severity': 2,
    },
    {
        'drug_a': '对乙酰氨基酚',
        'drug_b': '布洛芬',
        'risk_level': 'warning',
        'description': '对乙酰氨基酚与布洛芬联用增加肝肾功能负担',
        'suggestion': '避免长期联用，如需交替使用请间隔至少4小时',
        'mechanism': '肝肾代谢压力叠加',
        'severity': 2,
    },
    {
        'drug_a': '对乙酰氨基酚',
        'drug_b': '酒精',
        'risk_level': 'danger',
        'description': '对乙酰氨基酚与酒精联用显著增加肝损伤风险',
        'suggestion': '服用对乙酰氨基酚期间及停药后7天内严禁饮酒',
        'mechanism': '肝细胞毒性叠加',
        'severity': 3,
    },
    {
        'drug_a': '氯雷他定',
        'drug_b': '西替利嗪',
        'risk_level': 'warning',
        'description': '氯雷他定与西替利嗪同属抗组胺药，联用可能增加嗜睡等不良反应',
        'suggestion': '避免联用，选择其中一种即可',
        'mechanism': '抗组胺作用叠加',
        'severity': 2,
    },
    {
        'drug_a': '氯雷他定',
        'drug_b': '酮康唑',
        'risk_level': 'warning',
        'description': '酮康唑可能增加氯雷他定血药浓度，增强不良反应',
        'suggestion': '联用期间注意观察，必要时减少氯雷他定剂量',
        'mechanism': 'CYP3A4酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '奥美拉唑',
        'drug_b': '阿莫西林',
        'risk_level': 'safe',
        'description': '奥美拉唑与阿莫西林联用是根除幽门螺杆菌的标准方案',
        'suggestion': '正常联用，无需特殊处理',
        'mechanism': '胃酸抑制增强阿莫西林活性',
        'severity': 0,
    },
    {
        'drug_a': '奥美拉唑',
        'drug_b': '氯吡格雷',
        'risk_level': 'warning',
        'description': '奥美拉唑可能降低氯吡格雷的抗血小板效果',
        'suggestion': '如需联用请选择泮托拉唑或雷贝拉唑',
        'mechanism': 'CYP2C19酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '硝苯地平',
        'drug_b': '地高辛',
        'risk_level': 'warning',
        'description': '硝苯地平可能增加地高辛血药浓度',
        'suggestion': '联用期间监测地高辛血药浓度',
        'mechanism': '肾清除率降低',
        'severity': 2,
    },
    {
        'drug_a': '硝苯地平',
        'drug_b': '西咪替丁',
        'risk_level': 'warning',
        'description': '西咪替丁可能增加硝苯地平血药浓度',
        'suggestion': '联用期间监测血压，必要时调整剂量',
        'mechanism': 'CYP3A4酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '氨氯地平',
        'drug_b': '阿托伐他汀',
        'risk_level': 'safe',
        'description': '氨氯地平与阿托伐他汀联用安全，无明显相互作用',
        'suggestion': '正常联用',
        'mechanism': '无明显相互作用',
        'severity': 0,
    },
    {
        'drug_a': '美托洛尔',
        'drug_b': '地高辛',
        'risk_level': 'warning',
        'description': '美托洛尔与地高辛联用可能增加心动过缓风险',
        'suggestion': '联用期间监测心率',
        'mechanism': '负性心率作用叠加',
        'severity': 2,
    },
    {
        'drug_a': '美托洛尔',
        'drug_b': '胰岛素',
        'risk_level': 'warning',
        'description': '美托洛尔可能掩盖低血糖症状（如心悸）',
        'suggestion': '糖尿病患者联用期间注意监测血糖',
        'mechanism': 'β受体阻断掩盖低血糖体征',
        'severity': 2,
    },
    {
        'drug_a': '格列齐特',
        'drug_b': '酒精',
        'risk_level': 'danger',
        'description': '格列齐特与酒精联用可能引发严重低血糖',
        'suggestion': '服用期间及停药后7天内严禁饮酒',
        'mechanism': '酒精增强降糖作用',
        'severity': 3,
    },
    {
        'drug_a': '格列齐特',
        'drug_b': '磺胺类药物',
        'risk_level': 'warning',
        'description': '格列齐特与磺胺类药物存在交叉过敏风险',
        'suggestion': '对磺胺类药物过敏者禁用格列齐特',
        'mechanism': '磺胺基团交叉过敏',
        'severity': 2,
    },
    {
        'drug_a': '二甲双胍',
        'drug_b': '西咪替丁',
        'risk_level': 'warning',
        'description': '西咪替丁可能增加二甲双胍血药浓度',
        'suggestion': '联用期间监测血糖，必要时调整剂量',
        'mechanism': '肾清除率降低',
        'severity': 2,
    },
    {
        'drug_a': '二甲双胍',
        'drug_b': '碘造影剂',
        'risk_level': 'danger',
        'description': '二甲双胍与碘造影剂联用可能增加乳酸酸中毒风险',
        'suggestion': '检查前48小时停用，检查后48小时恢复',
        'mechanism': '肾功能暂时性损伤',
        'severity': 3,
    },
    {
        'drug_a': '阿司匹林',
        'drug_b': '华法林',
        'risk_level': 'danger',
        'description': '阿司匹林与华法林联用显著增加出血风险',
        'suggestion': '避免联用，如需联用请密切监测凝血功能',
        'mechanism': '抗凝作用叠加',
        'severity': 3,
    },
    {
        'drug_a': '阿司匹林',
        'drug_b': '氯吡格雷',
        'risk_level': 'warning',
        'description': '阿司匹林与氯吡格雷联用增加出血风险',
        'suggestion': '仅在医生指导下联用，并监测出血倾向',
        'mechanism': '抗血小板作用叠加',
        'severity': 2,
    },
    {
        'drug_a': '华法林',
        'drug_b': '甲硝唑',
        'risk_level': 'danger',
        'description': '甲硝唑增强华法林的抗凝作用，增加出血风险',
        'suggestion': '避免联用，如需联用请密切监测INR',
        'mechanism': '维生素K吸收减少',
        'severity': 3,
    },
    {
        'drug_a': '华法林',
        'drug_b': '氟康唑',
        'risk_level': 'danger',
        'description': '氟康唑显著增强华法林抗凝作用',
        'suggestion': '避免联用，如需联用请密切监测INR',
        'mechanism': 'CYP2C9酶抑制',
        'severity': 3,
    },
    {
        'drug_a': '氯吡格雷',
        'drug_b': '奥美拉唑',
        'risk_level': 'warning',
        'description': '奥美拉唑可能降低氯吡格雷抗血小板效果',
        'suggestion': '选择泮托拉唑或雷贝拉唑替代',
        'mechanism': 'CYP2C19酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '地高辛',
        'drug_b': '呋塞米',
        'risk_level': 'warning',
        'description': '呋塞米可能增加地高辛血药浓度',
        'suggestion': '联用期间监测地高辛血药浓度和电解质',
        'mechanism': '肾清除率降低',
        'severity': 2,
    },
    {
        'drug_a': '地高辛',
        'drug_b': '螺内酯',
        'risk_level': 'warning',
        'description': '螺内酯可能增加地高辛血药浓度',
        'suggestion': '联用期间监测地高辛血药浓度',
        'mechanism': '肾清除率降低',
        'severity': 2,
    },
    {
        'drug_a': '氨溴索',
        'drug_b': '右美沙芬',
        'risk_level': 'safe',
        'description': '氨溴索与右美沙芬联用安全，协同止咳化痰',
        'suggestion': '正常联用',
        'mechanism': '作用机制互补',
        'severity': 0,
    },
    {
        'drug_a': '头孢类抗生素',
        'drug_b': '酒精',
        'risk_level': 'danger',
        'description': '头孢类抗生素与酒精联用可能引发双硫仑样反应',
        'suggestion': '用药期间及停药后7天内严禁饮酒',
        'mechanism': '乙醛脱氢酶抑制',
        'severity': 3,
    },
    {
        'drug_a': '头孢类抗生素',
        'drug_b': '氨基糖苷类',
        'risk_level': 'warning',
        'description': '头孢类抗生素与氨基糖苷类联用增加肾毒性风险',
        'suggestion': '联用期间监测肾功能',
        'mechanism': '肾毒性叠加',
        'severity': 2,
    },
    {
        'drug_a': '左氧氟沙星',
        'drug_b': '茶碱',
        'risk_level': 'warning',
        'description': '左氧氟沙星可能增加茶碱血药浓度',
        'suggestion': '联用期间监测茶碱血药浓度',
        'mechanism': 'CYP1A2酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '左氧氟沙星',
        'drug_b': '华法林',
        'risk_level': 'warning',
        'description': '左氧氟沙星可能增强华法林抗凝作用',
        'suggestion': '联用期间监测INR',
        'mechanism': 'CYP2C9酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '甲硝唑',
        'drug_b': '酒精',
        'risk_level': 'danger',
        'description': '甲硝唑与酒精联用可能引发双硫仑样反应',
        'suggestion': '用药期间及停药后7天内严禁饮酒',
        'mechanism': '乙醛脱氢酶抑制',
        'severity': 3,
    },
    {
        'drug_a': '红霉素',
        'drug_b': '地高辛',
        'risk_level': 'warning',
        'description': '红霉素可能增加地高辛血药浓度',
        'suggestion': '联用期间监测地高辛血药浓度',
        'mechanism': '肠道菌群改变影响地高辛代谢',
        'severity': 2,
    },
    {
        'drug_a': '红霉素',
        'drug_b': '华法林',
        'risk_level': 'warning',
        'description': '红霉素可能增强华法林抗凝作用',
        'suggestion': '联用期间监测INR',
        'mechanism': 'CYP3A4酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '克拉霉素',
        'drug_b': '地高辛',
        'risk_level': 'danger',
        'description': '克拉霉素显著增加地高辛血药浓度',
        'suggestion': '避免联用，如需联用请密切监测地高辛浓度',
        'mechanism': '肠道菌群改变',
        'severity': 3,
    },
    {
        'drug_a': '克拉霉素',
        'drug_b': '华法林',
        'risk_level': 'danger',
        'description': '克拉霉素显著增强华法林抗凝作用',
        'suggestion': '避免联用，如需联用请密切监测INR',
        'mechanism': 'CYP3A4酶抑制',
        'severity': 3,
    },
    {
        'drug_a': '酮康唑',
        'drug_b': '华法林',
        'risk_level': 'danger',
        'description': '酮康唑显著增强华法林抗凝作用',
        'suggestion': '避免联用，如需联用请密切监测INR',
        'mechanism': 'CYP2C9酶抑制',
        'severity': 3,
    },
    {
        'drug_a': '西咪替丁',
        'drug_b': '华法林',
        'risk_level': 'warning',
        'description': '西咪替丁可能增强华法林抗凝作用',
        'suggestion': '联用期间监测INR',
        'mechanism': 'CYP2C9酶抑制',
        'severity': 2,
    },
    {
        'drug_a': '雷尼替丁',
        'drug_b': '华法林',
        'risk_level': 'safe',
        'description': '雷尼替丁与华法林联用安全，无明显相互作用',
        'suggestion': '正常联用',
        'mechanism': '无明显相互作用',
        'severity': 0,
    },
    {
        'drug_a': '泼尼松',
        'drug_b': '非甾体抗炎药',
        'risk_level': 'danger',
        'description': '泼尼松与非甾体抗炎药联用显著增加胃肠道出血风险',
        'suggestion': '避免联用，如需联用请加用胃黏膜保护剂',
        'mechanism': '胃肠道黏膜保护双重削弱',
        'severity': 3,
    },
    {
        'drug_a': '泼尼松',
        'drug_b': '胰岛素',
        'risk_level': 'warning',
        'description': '泼尼松可能降低胰岛素降糖效果',
        'suggestion': '联用期间增加血糖监测频率',
        'mechanism': '糖皮质激素升糖作用',
        'severity': 2,
    },
    {
        'drug_a': '沙丁胺醇',
        'drug_b': '普萘洛尔',
        'risk_level': 'danger',
        'description': '普萘洛尔拮抗沙丁胺醇的支气管扩张作用',
        'suggestion': '哮喘患者禁用普萘洛尔',
        'mechanism': 'β受体阻断对抗β2受体激动',
        'severity': 3,
    },
    {
        'drug_a': '氨溴索',
        'drug_b': '抗生素',
        'risk_level': 'safe',
        'description': '氨溴索与抗生素联用安全，可增加抗生素在痰液中的浓度',
        'suggestion': '正常联用',
        'mechanism': '促进痰液排出，提高抗生素疗效',
        'severity': 0,
    },
    {
        'drug_a': '蒙脱石散',
        'drug_b': '抗生素',
        'risk_level': 'warning',
        'description': '蒙脱石散可能吸附抗生素，降低其吸收',
        'suggestion': '与抗生素间隔至少2小时服用',
        'mechanism': '物理吸附作用',
        'severity': 2,
    },
    {
        'drug_a': '蒙脱石散',
        'drug_b': '益生菌',
        'risk_level': 'warning',
        'description': '蒙脱石散可能吸附益生菌，降低其活性',
        'suggestion': '与益生菌间隔至少2小时服用',
        'mechanism': '物理吸附作用',
        'severity': 2,
    },
    {
        'drug_a': '乳果糖',
        'drug_b': '抗生素',
        'risk_level': 'warning',
        'description': '抗生素可能降低乳果糖的疗效',
        'suggestion': '与抗生素间隔至少2小时服用',
        'mechanism': '肠道菌群改变影响乳果糖发酵',
        'severity': 2,
    },
    {
        'drug_a': '复方甘草片',
        'drug_b': '降压药',
        'risk_level': 'warning',
        'description': '复方甘草片中的甘草酸可能引起水钠潴留，降低降压药效果',
        'suggestion': '高血压患者慎用复方甘草片',
        'mechanism': '盐皮质激素样作用',
        'severity': 2,
    },
    {
        'drug_a': '复方甘草片',
        'drug_b': '降糖药',
        'risk_level': 'warning',
        'description': '复方甘草片中的甘草酸可能升高血糖',
        'suggestion': '糖尿病患者慎用复方甘草片',
        'mechanism': '糖皮质激素样作用',
        'severity': 2,
    },
    {
        'drug_a': '藿香正气水',
        'drug_b': '头孢类抗生素',
        'risk_level': 'danger',
        'description': '藿香正气水中含有酒精，与头孢类抗生素联用可能引发双硫仑样反应',
        'suggestion': '服用头孢类抗生素期间及停药后7天内禁用藿香正气水',
        'mechanism': '酒精与头孢类药物相互作用',
        'severity': 3,
    },
    {
        'drug_a': '感冒灵颗粒',
        'drug_b': '对乙酰氨基酚',
        'risk_level': 'warning',
        'description': '感冒灵颗粒中含有对乙酰氨基酚成分，与对乙酰氨基酚联用可能导致剂量超标',
        'suggestion': '避免同时服用含对乙酰氨基酚的感冒药',
        'mechanism': '成分叠加导致剂量超标',
        'severity': 2,
    },
    {
        'drug_a': '维c银翘片',
        'drug_b': '对乙酰氨基酚',
        'risk_level': 'warning',
        'description': '维c银翘片中含有对乙酰氨基酚成分，与对乙酰氨基酚联用可能导致剂量超标',
        'suggestion': '避免同时服用含对乙酰氨基酚的感冒药',
        'mechanism': '成分叠加导致剂量超标',
        'severity': 2,
    },
]


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_interaction_rules():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drug_interaction_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            drug_a TEXT NOT NULL,
            drug_b TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            description TEXT NOT NULL,
            suggestion TEXT NOT NULL,
            mechanism TEXT DEFAULT '',
            severity INTEGER DEFAULT 0,
            source TEXT DEFAULT 'curated',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            UNIQUE(drug_a, drug_b)
        )
    ''')

    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_drug_a ON drug_interaction_rules(drug_a)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_drug_b ON drug_interaction_rules(drug_b)
    ''')

    existing = set()
    for row in cursor.execute("SELECT drug_a, drug_b FROM drug_interaction_rules").fetchall():
        existing.add((row['drug_a'], row['drug_b']))

    for rule in INTERACTION_RULES:
        pair1 = (rule['drug_a'], rule['drug_b'])
        pair2 = (rule['drug_b'], rule['drug_a'])
        if pair1 not in existing and pair2 not in existing:
            cursor.execute('''
                INSERT INTO drug_interaction_rules 
                (drug_a, drug_b, risk_level, description, suggestion, mechanism, severity)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (rule['drug_a'], rule['drug_b'], rule['risk_level'],
                  rule['description'], rule['suggestion'], rule['mechanism'], rule['severity']))

    conn.commit()
    conn.close()


class DrugInteractionRuleEngine:
    """药物相互作用规则引擎——基于权威数据库的主检测引擎"""

    HIGH_CONFIDENCE_THRESHOLD = 0.95
    MEDIUM_CONFIDENCE_THRESHOLD = 0.80

    def find_interactions(self, medicine_names: list):
        """
        在规则数据库中查找药品组合的相互作用
        返回检测结果列表，每个结果包含：
        - drug_a, drug_b: 相互作用的药品对
        - risk_level: safe/warning/danger
        - description: 相互作用描述
        - suggestion: 用药建议
        - source: 'rule_db'（来自规则数据库）
        """
        if len(medicine_names) < 2:
            return []

        conn = get_db()
        try:
            results = []
            for drug_a, drug_b in combinations(medicine_names, 2):
                row = conn.execute('''
                    SELECT * FROM drug_interaction_rules 
                    WHERE (drug_a = ? AND drug_b = ?) OR (drug_a = ? AND drug_b = ?)
                ''', (drug_a, drug_b, drug_b, drug_a)).fetchone()

                if row:
                    results.append({
                        'drug_a': drug_a,
                        'drug_b': drug_b,
                        'risk_level': row['risk_level'],
                        'description': row['description'],
                        'suggestion': row['suggestion'],
                        'mechanism': row['mechanism'],
                        'severity': row['severity'],
                        'source': 'rule_db',
                    })

            return results
        finally:
            conn.close()

    def check_interaction(self, medicine_names: list):
        """
        完整的药物相互作用检测流程：
        1. 在规则数据库中查找精确匹配的相互作用
        2. 返回检测结果汇总
        """
        if len(medicine_names) < 2:
            return {
                'has_interaction': False,
                'risk_level': 'safe',
                'interactions': [],
                'source': 'rule_db',
                'description': '仅有一种药品，无需检测相互作用',
                'suggestion': '',
                'confidence': 'high',
            }

        interactions = self.find_interactions(medicine_names)

        if not interactions:
            return {
                'has_interaction': False,
                'risk_level': 'safe',
                'interactions': [],
                'source': 'rule_db',
                'description': '未在规则数据库中找到相互作用记录',
                'suggestion': '建议咨询医生确认用药安全',
                'confidence': 'medium',
            }

        max_severity = max(interactions, key=lambda x: x['severity'])['severity']
        if max_severity >= 3:
            overall_risk = 'danger'
        elif max_severity >= 2:
            overall_risk = 'warning'
        else:
            overall_risk = 'safe'

        descriptions = [f"{i['drug_a']}与{i['drug_b']}：{i['description']}" for i in interactions if i['risk_level'] != 'safe']
        suggestions = [i['suggestion'] for i in interactions if i['risk_level'] != 'safe']

        return {
            'has_interaction': any(i['risk_level'] in ('warning', 'danger') for i in interactions),
            'risk_level': overall_risk,
            'interactions': interactions,
            'source': 'rule_db',
            'description': '\n'.join(descriptions) if descriptions else '未检测到风险相互作用',
            'suggestion': '\n'.join(suggestions) if suggestions else '',
            'confidence': 'high',
        }


init_interaction_rules()

interaction_engine = DrugInteractionRuleEngine()