"""
AllCodeLists代码查找引擎 V4.0 - PostgreSQL数据库版本
基于s3d_codelists数据库中的code_entries表进行查询
"""

import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# 导入PostgreSQL驱动
import psycopg2
import psycopg2.extras


@dataclass
class CodeEntry:
    """代码条目"""
    short_description: str
    long_description: str
    codelist_number: int
    sort_order: int
    parent_short: str = ''
    parent_long: str = ''


class CodeLookupError:
    """代码查找错误记录"""
    def __init__(self):
        self.errors: List[Dict] = []

    def add_error(self, sheet_name: str, lookup_key: str, reason: str, context: str = ''):
        """添加错误记录"""
        self.errors.append({
            'sheet_name': sheet_name,
            'lookup_key': lookup_key,
            'reason': reason,
            'context': context
        })

    def get_errors(self) -> List[Dict]:
        return self.errors

    def has_errors(self) -> bool:
        return len(self.errors) > 0

    def clear(self):
        self.errors.clear()

    def get_summary(self) -> str:
        """获取错误汇总报告"""
        lines = []
        if self.errors:
            lines.append(f"共 {len(self.errors)} 个代码查找错误：")
            lines.append("")
            for err in self.errors:
                lines.append(f"  [{err['sheet_name']}] 查找 '{err['lookup_key']}' 失败")
                lines.append(f"    原因：{err['reason']}")
                if err['context']:
                    lines.append(f"    上下文：{err['context']}")
                lines.append("")
        return '\n'.join(lines)


# 数据库连接配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 's3d_codelists',
    'user': 'postgres',
    'password': 'm77777777',
}


class AllCodeListsLookup:
    """AllCodeLists代码查找引擎 V4.0 - PostgreSQL数据库版本

    从s3d_codelists数据库的code_entries表中查询代码，
    接口与文件版本完全兼容。
    """

    # 需要查询的关键工作表列表
    KEY_SHEETS = [
        'PipingCommodityType',
        'GeometryType',
        'MaterialsGrade',
        'EndPreparation',
        'GeometricIndustryStandard',
        'PressureRating',
        'DesignStandard',
        'CommodityOption',
        'SelectionBasis',
        'WeldType',
        'ScheduleThickness',
        'SupplyResponsibility',
        'PipingSpecStatus',
    ]

    def __init__(self, file_path: str = None):
        """初始化代码查找引擎
        
        file_path参数已废弃，仅保留以保持接口兼容性。
        现在直接从PostgreSQL数据库查询。
        """
        self._cache: Dict[str, Dict[str, CodeEntry]] = {}
        self.errors = CodeLookupError()
        self._conn = None
        self._connect_db()
        self._load_all_codelists()

    def _connect_db(self):
        """连接PostgreSQL数据库"""
        try:
            self._conn = psycopg2.connect(**DB_CONFIG)
        except Exception as e:
            print(f"[警告] 连接PostgreSQL数据库失败: {e}")
            print(f"  配置: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
            self._conn = None

    def _load_all_codelists(self):
        """从数据库加载所有代码列表到缓存"""
        if not self._conn:
            return

        for sheet_name in self.KEY_SHEETS:
            self._load_codelist(sheet_name)

    def _load_codelist(self, sheet_name: str):
        """从数据库加载单个代码表"""
        try:
            with self._conn.cursor() as cur:
                # 查询该工作表的所有条目
                cur.execute("""
                    SELECT short_description, long_description, code_number, sort_order,
                           parent_code, is_parent, level
                    FROM code_entries
                    WHERE sheet_name = %s
                    ORDER BY level, sort_order, code_number
                """, (sheet_name,))

                entries = {}
                for row in cur.fetchall():
                    sd, ld, cn, so, pc, is_parent, level = row
                    sd = str(sd).strip() if sd else ''
                    ld = str(ld).strip() if ld else ''
                    pc = str(pc).strip() if pc else ''

                    # code_number和sort_order可能是字符串，尝试转为整数
                    try:
                        cn_int = int(float(cn)) if cn else 0
                    except:
                        cn_int = 0
                    try:
                        so_int = int(float(so)) if so else 0
                    except:
                        so_int = 0

                    if sd and cn_int > 0:
                        entry = CodeEntry(
                            short_description=sd,
                            long_description=ld,
                            codelist_number=cn_int,
                            sort_order=so_int,
                            parent_short=pc,
                            parent_long=''
                        )
                        entries[sd.upper()] = entry
                        if ld:
                            entries[ld.upper()] = entry

                self._cache[sheet_name] = entries

        except Exception as e:
            print(f"[警告] 从数据库加载代码表 {sheet_name} 失败: {e}")
            self._cache[sheet_name] = {}

    def lookup(self, sheet_name: str, key: str, fuzzy: bool = False) -> Optional[CodeEntry]:
        """查找代码"""
        if sheet_name not in self._cache:
            return None

        entries = self._cache[sheet_name]
        key_upper = str(key).strip().upper()

        # 精确匹配
        if key_upper in entries:
            return entries[key_upper]

        # 模糊匹配
        if fuzzy:
            for k, entry in entries.items():
                if key_upper in k or k in key_upper:
                    return entry
            for k, entry in entries.items():
                if entry.long_description.upper() == key_upper:
                    return entry
                if key_upper in entry.long_description.upper():
                    return entry

        return None

    def lookup_code(self, sheet_name: str, key: str, fuzzy: bool = False) -> Optional[int]:
        """查找代码编号"""
        entry = self.lookup(sheet_name, key, fuzzy)
        return entry.codelist_number if entry else None

    def find_in_sheet(self, sheet_name: str, key: str, context: str = '') -> Optional[int]:
        """在指定代码表中查找代码"""
        if not key or not str(key).strip():
            return None

        result = self.lookup_code(sheet_name, key, fuzzy=False)
        if result is not None:
            return result

        result = self.lookup_code(sheet_name, key, fuzzy=True)
        if result is not None:
            return result

        self.errors.add_error(
            sheet_name=sheet_name,
            lookup_key=key,
            reason=f"AllCodeLists.{sheet_name}中没有'{key}'，请添加此代码",
            context=context
        )
        return None

    # =================================================================
    # 需要从AllCodeLists查找的字段
    # =================================================================

    def find_commodity_type(self, item_type: str) -> Optional[str]:
        """查找商品类型代码 (PipingCommodityType)"""
        if not item_type or not str(item_type).strip():
            return None
        entry = self.lookup('PipingCommodityType', item_type, fuzzy=True)
        if entry:
            return entry.short_description
        self.errors.add_error('PipingCommodityType', item_type,
                              f"AllCodeLists.PipingCommodityType中没有'{item_type}'，请添加")
        return None

    def find_geometry_type(self, item_type: str) -> Optional[int]:
        """查找几何形状代码 (GeometryType)"""
        if not item_type or not str(item_type).strip():
            return None
        entry = self.lookup('GeometryType', item_type, fuzzy=True)
        if entry:
            return entry.codelist_number
        self.errors.add_error('GeometryType', item_type,
                              f"AllCodeLists.GeometryType中没有'{item_type}'，请添加")
        return None

    def _extract_material_keywords(self, description: str) -> List[str]:
        """从描述中提取材质关键词"""
        keywords = []
        patterns = [
            r'\bA(\d{3})\s*([A-Z]{0,4})\b',  # A105, A216 WCB, A182 F316L
            r'\bQ(\d{3}[A-Z]?)\b',  # Q235B, Q245R, Q345R
            r'\b(304|304L|316|316L|321|347|316LN|316H)\b',  # 不锈钢
            r'\b(20|20G|20R)\b(?!\d)',  # 20号钢
            r'\b(12Cr1MoVG|15CrMoG|Cr5Mo|P91|P92|WB36)\b',  # 合金钢
            r'\b(L245|L360|L415|L450|L485|X42|X46|X52|X56|X60|X65|X70)\b',  # 管线钢
        ]
        for pattern in patterns:
            matches = re.findall(pattern, description.upper())
            for match in matches:
                if isinstance(match, tuple):
                    keyword = ''.join(match).strip()
                else:
                    keyword = match.strip()
                if keyword and keyword not in keywords:
                    keywords.append(keyword)
        return keywords

    def find_materials_grade(self, description: str) -> Optional[int]:
        """查找材料等级代码 (MaterialsGrade)
        从描述中提取材质关键词去查找，而非用整行描述查找
        """
        if not description or not str(description).strip():
            return None
        material_keywords = self._extract_material_keywords(description)
        for keyword in material_keywords:
            entry = self.lookup('MaterialsGrade', keyword, fuzzy=False)
            if entry:
                return entry.codelist_number
            entry = self.lookup('MaterialsGrade', keyword, fuzzy=True)
            if entry:
                return entry.codelist_number
        self.errors.add_error('MaterialsGrade', description,
                              f"AllCodeLists.MaterialsGrade中没有匹配'{description}'中的材质，请添加")
        return None

    def _extract_end_preparation_keywords(self, description: str) -> List[str]:
        """从描述中提取端部形式关键词"""
        keywords = []
        patterns = [
            r'\b(BW|B\.W\.|B/W)\b',
            r'\b(SW|S\.W\.|S/W)\b',
            r'\b(RF|R\.F\.|R/F)\b',
            r'\b(RTJ|R\.T\.J\.|R/T/J)\b',
            r'\b(FF|F\.F\.|F/F)\b',
            r'\b(NPT|N\.P\.T\.|N/P/T)\b',
            r'\b(BSPT|B\.S\.P\.T\.)\b',
            r'\b(PE|P\.E\.|P/E)\b',
            r'\b(BE|B\.E\.|B/E)\b',
            r'\b(THR|THREADED)\b',
            r'\b(FLGD|FLANGED)\b',
            r'\b(LJ|LAP\s+JOINT)\b',
            r'\b(SO|SLIP\s+ON)\b',
            r'\b(WN|WELD\s+NECK)\b',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, description, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    keyword = ''.join(match).strip()
                else:
                    keyword = match.strip()
                if keyword and keyword.upper() not in [k.upper() for k in keywords]:
                    keywords.append(keyword)
        return keywords

    def _map_end_preparation_alias(self, text: str) -> str:
        """端部形式别名映射"""
        alias_map = {
            'BW': 'BWE',
            'B.W.': 'BWE',
            'B/W': 'BWE',
            'SW': 'SWE',
            'S.W.': 'SWE',
            'S/W': 'SWE',
            'PE': 'PE',
            'BE': 'BE',
            'RF': 'RFFE',
            'FF': 'FFFE',
            'RTJ': 'RJFE',
            'NPT': 'MNPT',
            'THREADED': 'MNPT',
            'THR': 'MNPT',
        }
        return alias_map.get(text.upper(), text)

    def find_end_preparation(self, ends_or_description: str) -> Optional[int]:
        """查找端部准备代码 (EndPreparation)"""
        if not ends_or_description or not str(ends_or_description).strip():
            return None

        text = ends_or_description.strip().upper()

        if '/' in text:
            first_end = text.split('/')[0].strip()
            return self.find_end_preparation(first_end)

        entry = self.lookup('EndPreparation', text)
        if entry:
            return entry.codelist_number

        mapped_text = self._map_end_preparation_alias(text)
        if mapped_text != text:
            entry = self.lookup('EndPreparation', mapped_text)
            if entry:
                return entry.codelist_number

        end_prep_keywords = self._extract_end_preparation_keywords(ends_or_description)
        for keyword in end_prep_keywords:
            entry = self.lookup('EndPreparation', keyword, fuzzy=False)
            if entry:
                return entry.codelist_number
            mapped_keyword = self._map_end_preparation_alias(keyword)
            entry = self.lookup('EndPreparation', mapped_keyword, fuzzy=False)
            if entry:
                return entry.codelist_number
            entry = self.lookup('EndPreparation', keyword, fuzzy=True)
            if entry:
                return entry.codelist_number

        self.errors.add_error('EndPreparation', ends_or_description,
                              f"AllCodeLists.EndPreparation中没有'{ends_or_description}'，请添加")
        return None

    def _extract_standard_keywords(self, description: str) -> List[str]:
        """从描述中提取标准号"""
        keywords = []
        patterns = [
            r'\b(SH/T\s*\d+)\b',
            r'\b(GB/T\s*\d+)\b',
            r'\b(GB\s*\d+)\b',
            r'\b(SY/T\s*\d+)\b',
            r'\b(NB/T\s*\d+)\b',
            r'\b(API\s*\d+[A-Z]?)\b',
            r'\b(ASME\s*B16\.\d+)\b',
            r'\b(ANSI\s*B16\.\d+)\b',
            r'\b(HG/T\s*\d+)\b',
            r'\b(DL/T\s*\d+)\b',
            r'\b(JB/T\s*\d+)\b',
        ]
        for pattern in patterns:
            matches = re.findall(pattern, description, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    keyword = ''.join(match).strip()
                else:
                    keyword = match.strip()
                if keyword and keyword.upper() not in [k.upper() for k in keywords]:
                    keywords.append(keyword)
        return keywords

    def find_geometric_industry_standard(self, description: str) -> Optional[int]:
        """查找几何行业标准代码 (GeometricIndustryStandard)"""
        if not description or not str(description).strip():
            return None
        std_keywords = self._extract_standard_keywords(description)
        for keyword in std_keywords:
            entry = self.lookup('GeometricIndustryStandard', keyword, fuzzy=False)
            if entry:
                return entry.codelist_number
            entry = self.lookup('GeometricIndustryStandard', keyword, fuzzy=True)
            if entry:
                return entry.codelist_number
        self.errors.add_error('GeometricIndustryStandard', description,
                              f"AllCodeLists.GeometricIndustryStandard中没有匹配'{description}'中的标准号，请添加")
        return None

    def find_pressure_rating(self, rating: str) -> Optional[int]:
        """查找压力等级代码 (PressureRating)"""
        if not rating or not str(rating).strip():
            return None
        rating = rating.strip().upper()
        entry = self.lookup('PressureRating', rating)
        if entry:
            return entry.codelist_number
        self.errors.add_error('PressureRating', rating,
                              f"AllCodeLists.PressureRating中没有'{rating}'，请添加")
        return None

    def find_design_standard(self, description: str) -> Optional[int]:
        """查找设计标准代码 (DesignStandard)"""
        if not description or not str(description).strip():
            return None
        entry = self.lookup('DesignStandard', description, fuzzy=True)
        if entry:
            return entry.codelist_number
        self.errors.add_error('DesignStandard', description,
                              f"AllCodeLists.DesignStandard中没有'{description}'，请添加")
        return None

    def find_commodity_option(self, item_type: str) -> Optional[int]:
        """查找商品选项代码 (CommodityOption)"""
        if not item_type or not str(item_type).strip():
            return None
        entry = self.lookup('CommodityOption', item_type, fuzzy=True)
        if entry:
            return entry.codelist_number
        self.errors.add_error('CommodityOption', item_type,
                              f"AllCodeLists.CommodityOption中没有'{item_type}'，请添加")
        return None

    def find_selection_basis(self) -> int:
        """查找SelectionBasis"""
        entry = self.lookup('SelectionBasis', '1')
        if entry:
            return entry.codelist_number
        return 1

    def find_welding_requirement(self, short_code: str) -> Optional[int]:
        """查找焊接要求代码 - 从AllCodeLists.WeldType工作表查找"""
        entry = self.lookup('WeldType', short_code, fuzzy=True)
        if entry:
            return entry.codelist_number
        return None

    def find_schedule_thickness(self, schedule: str) -> Optional[str]:
        """查找壁厚等级"""
        if not schedule:
            return None
        entry = self.lookup('ScheduleThickness', schedule, fuzzy=True)
        if entry:
            return entry.short_description
        return None

    def find_supply_responsibility(self) -> Optional[int]:
        """查找供应责任"""
        entry = self.lookup('SupplyResponsibility', 'Contractor', fuzzy=True)
        if entry:
            return entry.codelist_number
        return None

    def find_piping_spec_status(self) -> Optional[str]:
        """查找PipingSpecStatus"""
        entry = self.lookup('PipingSpecStatus', 'W')
        if entry:
            return entry.short_description
        return 'W'

    # =================================================================
    # 不需要从AllCodeLists查找的字段（直接返回固定值或规则值）
    # =================================================================

    def get_fabrication_type(self, short_code: str) -> int:
        """获取制造类型代码"""
        fabrication_mapping = {
            'PIPE': 15, 'NIP': 15, 'OSG': 15, 'CPL': 15, 'CPLH': 15,
            'E45': 15, 'E45LR': 15, 'E90': 15, 'E90LR': 15, 'E90SR': 15,
            'RC': 15, 'RE': 15, 'TE': 15, 'TR': 15, 'CAP': 15, 'WEL': 15,
            'FWN': 20, 'FSW': 20, 'FBL': 20, 'BLSPO': 20, 'BLSPA': 20,
            'BOLT': 25,
            'GSW': 30,
            'GAT': 35, 'GLO': 35, 'CK': 35, 'BALL': 35, 'BFYLP': 35,
        }
        return fabrication_mapping.get(short_code, 15)

    def get_gasket_requirements(self, short_code: str, ends: str = '') -> int:
        """获取垫片要求代码"""
        gaskets_for_welded = ('PIPE', 'E45', 'E45LR', 'E90', 'E90LR', 'E90SR',
                              'TE', 'TR', 'RC', 'RE', 'CAP', 'WEL', 'OSG', 'CPL', 'CPLH')
        gaskets_for_flange = ('FWN', 'FSW', 'FBL', 'BLSPO', 'BLSPA', 'GSW', 'BOLT')

        if short_code in gaskets_for_welded:
            return 20
        elif short_code in gaskets_for_flange:
            return 5
        elif short_code in ('GAT', 'GLO', 'CK', 'BALL', 'BFYLP'):
            if ends and 'RF' in ends.upper():
                return 5
            else:
                return 20
        return 0

    def get_bolting_requirements(self, short_code: str) -> int:
        """获取螺栓要求代码"""
        welded_components = ('PIPE', 'E45', 'E45LR', 'E90', 'E90LR', 'E90SR',
                             'TE', 'TR', 'RC', 'RE', 'CAP', 'WEL', 'OSG', 'CPL', 'CPLH')
        flange_valve_components = ('FWN', 'FSW', 'FBL', 'BLSPO', 'BLSPA',
                                   'GAT', 'GLO', 'CK', 'BALL', 'BFYLP')

        if short_code in welded_components:
            return 35
        elif short_code in flange_valve_components:
            return 5
        return 0

    def get_welding_requirement(self, short_code: str) -> int:
        """获取焊接要求代码"""
        welded_components = ('PIPE', 'E45', 'E45LR', 'E90', 'E90LR', 'E90SR',
                             'TE', 'TR', 'RC', 'RE', 'OSG', 'CPL', 'CPLH')
        blind_valve_components = ('FBL', 'BLSPO', 'BLSPA',
                                  'GAT', 'GLO', 'CK', 'BALL', 'BFYLP')

        if short_code in welded_components:
            return 5
        elif short_code in blind_valve_components:
            return 50
        return 0

    def get_valve_operator_type(self, short_code: str) -> int:
        """获取阀门操作器类型代码"""
        valve_operator_mapping = {
            'GAT': 3,
            'GLO': 3,
            'CK': 3,
            'BALL': 9,
            'BFYLP': 17
        }
        return valve_operator_mapping.get(short_code, 331)


def create_code_lookup(allcodelists_path: str = None) -> AllCodeListsLookup:
    """创建代码查找引擎实例
    
    allcodelists_path参数已废弃，仅保留以保持接口兼容性。
    """
    return AllCodeListsLookup()
