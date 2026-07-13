"""
材料等级表解析器 V2.0
根据V2.0 PRD要求解析Excel格式的材料等级表
"""

import pandas as pd
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class MaterialClassInfo:
    """材料等级基本信息"""
    class_name: str
    piping_material: str = ''
    flange_material: str = ''
    flange_rating: str = ''
    flange_face: str = ''
    valve_body_material: str = ''
    valve_trim_material: str = ''
    corrosion_allowance: float = 1.5
    design_temp: Optional[float] = None
    design_pressure: Optional[float] = None
    service: str = ''
    temp_pressure_basis: str = ''
    design_standard: str = ''


@dataclass
class PartItem:
    """零件条目"""
    item_type: str
    size_range: str
    rating: str
    ends: str
    description: str
    commodity_code: str
    notes: str = ''
    material_class: str = ''
    sizes: List[float] = field(default_factory=list)
    npd_unit_type: str = 'mm'  # 'mm' 或 'in'
    description_parts: List[str] = field(default_factory=list)  # 描述分解后的各部分
    # 用户手动输入的字段（按零件类型配置）
    commodity_type_override: str = ''      # CommodityType
    geometry_type_override: str = ''       # GeometryType
    symbol_definition: str = ''            # SymbolDefinition
    geom_industry_std_override: str = ''   # GeometricIndustryStandard
    material_grade_override: str = ''      # MaterialGrade
    part_data_basis: str = ''              # PartDataBasis
    piping_point_basis: str = ''           # PipingPointBasis
    end_preparation_override: str = ''     # EndPreparation
    end_standard: str = ''                 # EndStandard
    flow_direction: str = ''               # FlowDirection
    face_to_center: str = ''               # FacetoCenter


@dataclass
class BranchTableEntry:
    """分支表条目"""
    header_size: float
    branch_size: float
    branch_type: str


@dataclass
class SizeTableEntry:
    """尺寸表条目（壁厚等级）"""
    npd: float
    npd_unit_type: str
    schedule: str


class MaterialSpecParser:
    """材料等级表解析器 V2.0"""

    # 标准DN序列（mm单位）
    STANDARD_DN_MM = [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300, 350, 400, 450, 500, 600]

    # 标准NPS序列（in单位）
    STANDARD_NPS_IN = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 24.0]

    # NPS到DN的映射
    NPS_TO_DN = {
        0.5: 15, 0.75: 20, 1.0: 25, 1.25: 32, 1.5: 40,
        2.0: 50, 3.0: 80, 4.0: 100, 5.0: 125, 6.0: 150,
        8.0: 200, 10.0: 250, 12.0: 300, 14.0: 350, 16.0: 400,
        18.0: 450, 20.0: 500, 24.0: 600
    }

    # DN到NPS的映射
    DN_TO_NPS = {v: k for k, v in NPS_TO_DN.items()}

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.material_classes: Dict[str, MaterialClassInfo] = {}
        self.parts: Dict[str, List[PartItem]] = {}
        self.branch_tables: Dict[str, List[BranchTableEntry]] = {}
        self.size_tables: Dict[str, List[SizeTableEntry]] = {}
        self.temp_pressure_limits: Dict[str, Dict] = {}

    def parse(self) -> Dict[str, Any]:
        """解析材料等级表"""
        xl = pd.ExcelFile(self.file_path)
        sheet_names = xl.sheet_names

        # 解析Index工作表
        if 'Index' in sheet_names:
            self._parse_index('Index')

        # 解析每个材料等级工作表
        for sheet_name in sheet_names:
            if sheet_name not in ['Cover', 'Index']:
                self._parse_material_class(sheet_name)

        return {
            'material_classes': self.material_classes,
            'parts': self.parts,
            'branch_tables': self.branch_tables,
            'size_tables': self.size_tables,
            'temp_pressure_limits': self.temp_pressure_limits
        }

    def _parse_index(self, sheet_name: str):
        """解析Index工作表"""
        df = pd.read_excel(self.file_path, sheet_name=sheet_name, header=None)

        # 查找表头行和材料等级信息行
        header_row = None
        for idx, row in df.iterrows():
            row_values = [str(v).strip().upper() if pd.notna(v) else '' for v in row]
            if 'PIPING CLASS' in row_values or 'CLASS' in row_values:
                header_row = idx
                break

        if header_row is None:
            return

        # 解析数据行
        for idx in range(header_row + 1, len(df)):
            row = df.iloc[idx]
            row_values = row.dropna().tolist()
            if not row_values:
                continue

            # 获取材料等级名称（第1列，因为第0列为空）
            class_name = ''
            for col_idx in [1, 0, 2]:
                if col_idx < len(row) and pd.notna(row.iloc[col_idx]):
                    val = str(row.iloc[col_idx]).strip()
                    if val and val not in ['PIPING CLASS', 'CLASS', '']:
                        class_name = val
                        break

            if not class_name or len(class_name) < 3:
                continue

            # 提取各字段（Index工作表数据从第1列开始）
            service = str(row.iloc[2]) if len(row) > 2 and pd.notna(row.iloc[2]) else ''
            design_temp = float(row.iloc[3]) if len(row) > 3 and pd.notna(row.iloc[3]) else None
            design_pressure = float(row.iloc[4]) if len(row) > 4 and pd.notna(row.iloc[4]) else None
            piping_material = str(row.iloc[5]) if len(row) > 5 and pd.notna(row.iloc[5]) else ''
            flange_material = str(row.iloc[6]) if len(row) > 6 and pd.notna(row.iloc[6]) else ''
            flange_rating_face = str(row.iloc[7]) if len(row) > 7 and pd.notna(row.iloc[7]) else ''
            valve_body = str(row.iloc[8]) if len(row) > 8 and pd.notna(row.iloc[8]) else ''
            valve_trim = str(row.iloc[9]) if len(row) > 9 and pd.notna(row.iloc[9]) else ''
            ca = float(row.iloc[10]) if len(row) > 10 and pd.notna(row.iloc[10]) else 1.5

            # 解析压力等级和面型
            flange_rating = ''
            flange_face = ''
            if '&' in flange_rating_face:
                parts = flange_rating_face.split('&')
                flange_rating = parts[0].strip()
                flange_face = parts[1].strip()
            elif ' ' in flange_rating_face:
                # 如 "CL150 RF"
                parts = flange_rating_face.split()
                if len(parts) >= 2:
                    flange_rating = parts[0]
                    flange_face = parts[1]

            self.material_classes[class_name] = MaterialClassInfo(
                class_name=class_name,
                piping_material=piping_material,
                flange_material=flange_material,
                flange_rating=flange_rating,
                flange_face=flange_face,
                valve_body_material=valve_body,
                valve_trim_material=valve_trim,
                corrosion_allowance=ca,
                design_temp=design_temp,
                design_pressure=design_pressure,
                service=service
            )

    def _parse_material_class(self, sheet_name: str):
        """解析单个材料等级工作表"""
        df = pd.read_excel(self.file_path, sheet_name=sheet_name, header=None)

        # 提取材料等级基本信息
        class_info = self._extract_class_info(df, sheet_name)
        if class_info:
            self.material_classes[sheet_name] = class_info

        # 提取零件列表
        parts = self._extract_parts(df, sheet_name)
        self.parts[sheet_name] = parts

        # 提取尺寸表（壁厚等级）
        size_table = self._extract_size_table(df)
        if size_table:
            self.size_tables[sheet_name] = size_table

        # 提取温度压力限制
        temp_pressure = self._extract_temp_pressure(df)
        if temp_pressure:
            self.temp_pressure_limits[sheet_name] = temp_pressure

        # 提取分支表
        branch_table = self._extract_branch_table(df)
        if branch_table:
            self.branch_tables[sheet_name] = branch_table

    def _extract_class_info(self, df: pd.DataFrame, sheet_name: str) -> Optional[MaterialClassInfo]:
        """提取材料等级基本信息"""
        piping_material = ''
        flange_rating_face = ''
        valve_body = ''
        valve_trim = ''
        ca = 1.5
        service = ''
        design_standard = ''

        for idx, row in df.iterrows():
            row_values = row.dropna().tolist()
            if not row_values:
                continue

            first_col = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
            first_col_upper = first_col.upper()

            if 'PIPING MATERIAL' in first_col_upper:
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        piping_material = str(row.iloc[i])
                        break

            elif 'FLANGE RATING' in first_col_upper:
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        flange_rating_face = str(row.iloc[i])
                        break

            elif 'VALVE BODY MATERIAL' in first_col_upper:
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        valve_body = str(row.iloc[i])
                        break

            elif 'VALVE TRIM MATERIAL' in first_col_upper:
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        valve_trim = str(row.iloc[i])
                        break

            elif 'CORROSION ALLOWANCE' in first_col_upper:
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        try:
                            ca = float(row.iloc[i])
                        except:
                            pass
                        break

            elif 'SERVICE:' in first_col_upper or first_col_upper.startswith('SERVICE'):
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        service = str(row.iloc[i])
                        break

            elif 'DESIGN STANDARD' in first_col_upper:
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        design_standard = str(row.iloc[i])
                        break

        # 解析压力等级和面型
        flange_rating = ''
        flange_face = ''
        if '&' in flange_rating_face:
            parts = flange_rating_face.split('&')
            flange_rating = parts[0].strip()
            flange_face = parts[1].strip()
        elif ' ' in flange_rating_face:
            parts = flange_rating_face.split()
            if len(parts) >= 2:
                flange_rating = parts[0]
                flange_face = parts[1]

        return MaterialClassInfo(
            class_name=sheet_name,
            piping_material=piping_material,
            flange_material='',  # 从Index获取
            flange_rating=flange_rating,
            flange_face=flange_face,
            valve_body_material=valve_body,
            valve_trim_material=valve_trim,
            corrosion_allowance=ca,
            service=service,
            design_standard=design_standard
        )

    def _extract_parts(self, df: pd.DataFrame, sheet_name: str) -> List[PartItem]:
        """提取零件列表"""
        parts = []

        # 查找ITEMS标题行
        items_start_row = None
        for idx, row in df.iterrows():
            row_values = row.dropna().tolist()
            row_strs = [str(v).strip().upper() for v in row_values]
            if 'ITEMS' in row_strs or 'ITEM' in row_strs:
                items_start_row = idx
                break

        if items_start_row is None:
            return parts

        # 查找BRANCH TABLE的起始行（用于确定零件列表的结束位置）
        branch_start_row = None
        for idx, row in df.iterrows():
            row_values = row.dropna().tolist()
            row_strs = [str(v).strip().upper() for v in row_values]
            joined_str = ' '.join(row_strs)
            # 精确匹配BRANCH TABLE标题，避免REINFORCING PAD等包含BRANCH的单词被误匹配
            if 'BRANCH TABLE' in joined_str or joined_str == 'BRANCH':
                branch_start_row = idx
                break

        # 解析零件数据行（只解析ITEMS到BRANCH TABLE之间的内容）
        end_row = branch_start_row if branch_start_row is not None else len(df)

        for idx in range(items_start_row + 1, end_row):
            row = df.iloc[idx]
            row_values = row.dropna().tolist()
            if not row_values:
                continue

            first_col = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
            if not first_col or first_col == ',' or first_col.strip() == '':
                continue

            # 检查是否是分支表或温度压力表的开始
            first_upper = first_col.strip().upper()
            if first_upper == 'BRANCH TABLE' or first_upper.startswith('BRANCH TABLE'):
                break
            if 'TEMPERATURE' in first_upper or 'PRESSURE' in first_upper:
                break

            # 提取各列数据
            item_type = first_col.strip()

            # DN列（第3列，索引3）
            size_range = str(row.iloc[3]) if len(row) > 3 and pd.notna(row.iloc[3]) else ''

            # RATING列（第5列，索引5）
            rating = str(row.iloc[5]) if len(row) > 5 and pd.notna(row.iloc[5]) else ''

            # ENDS列（第7列，索引7）
            ends = str(row.iloc[7]) if len(row) > 7 and pd.notna(row.iloc[7]) else ''

            # DESCRIPTION列（第9列，索引9）
            description = str(row.iloc[9]) if len(row) > 9 and pd.notna(row.iloc[9]) else ''

            # COMM.CODE列（第17列，索引17）
            commodity_code = str(row.iloc[17]) if len(row) > 17 and pd.notna(row.iloc[17]) else ''

            # NOTES列（第21列，索引21）
            notes = str(row.iloc[21]) if len(row) > 21 and pd.notna(row.iloc[21]) else ''

            # 确定NpdUnitType（基于材料等级表的DN行）
            npd_unit_type = self._determine_npd_unit_type(size_range)

            # 解析尺寸范围
            sizes = self._parse_size_range(size_range, npd_unit_type)

            # 分解描述信息（按逗号分隔）
            description_parts = self._parse_description_parts(description)

            part = PartItem(
                item_type=item_type,
                size_range=size_range,
                rating=rating,
                ends=ends,
                description=description,
                commodity_code=commodity_code,
                notes=notes,
                material_class=sheet_name,
                sizes=sizes,
                npd_unit_type=npd_unit_type,
                description_parts=description_parts
            )
            parts.append(part)

        return parts

    def _parse_description_parts(self, description: str) -> List[str]:
        """智能分解描述信息，提取5个字段

        返回: [国标/行业标准, 材质, 端部形式, 尺寸规范标准, 管型]

        例如: "GB/T 8163 20, PE, SH/T 3405, SMLS"
        分解为: ["GB/T 8163", "20", "PE", "SH/T 3405", "SMLS"]
        """
        result = ['', '', '', '', '']

        if not description:
            return result

        # 按逗号分隔，并去除前后空格
        parts = [part.strip() for part in description.split(',')]
        parts = [part for part in parts if part]

        if not parts:
            return result

        # 第0步：处理第一个部分，提取 标准号 + 材质
        first_part = parts[0]

        # 提取标准号（从开头匹配）
        std_pattern = r'^(GB/T\s*\d+|GB\s*\d+|SH/T\s*\d+|SY/T\s*\d+|NB/T\s*\d+|JB/T\s*\d+|HG/T\s*\d+|DL/T\s*\d+|API\s*\d+[A-Z]?|ASME\s*B16\.\d+|ANSI\s*B16\.\d+)'
        std_match = re.match(std_pattern, first_part)
        if std_match:
            result[0] = std_match.group(1).strip()
            material_part = first_part[std_match.end():].strip()
            if material_part:
                result[1] = material_part
        else:
            # 没有标准号，整个第一部分当作材质
            result[1] = first_part

        # 第1步：处理剩余部分，归类到 端部形式、尺寸规范标准、管型
        remaining = parts[1:] if len(parts) > 1 else []

        # 端部形式关键词（按长度降序，避免短词优先匹配）
        end_prep_patterns = [
            r'\b(PBE|BLE|PSE|MNPT|FNPT)\b',           # 3-4字符优先
            r'\b(PE|BE|BW|SW|RF|FF|RTJ|NPT|THR)\b',    # 2-3字符
        ]

        # 尺寸规范标准模式（与标准号模式相同）
        dim_std_pattern = r'\b(GB/T\s*\d+|SH/T\s*\d+|SY/T\s*\d+|NB/T\s*\d+|JB/T\s*\d+|HG/T\s*\d+|ASME\s*B16\.\d+)'

        # 管型关键词
        pipe_type_patterns = [
            r'\b(SMLS|SEAMLESS)\b',   # 无缝管
            r'\b(WELD|WELDED|ERW|LSAW|SSAW|SAWL|HFW|EFW)\b',  # 焊接管
            r'\b(MFR|MANUFACTURER)\b',  # 制造
        ]

        for part in remaining:
            part_upper = part.upper()

            # 检查是否是端部形式
            is_end_prep = False
            for pattern in end_prep_patterns:
                if re.search(pattern, part):
                    if not result[2]:
                        result[2] = part
                    is_end_prep = True
                    break

            if is_end_prep:
                continue

            # 检查是否是尺寸规范标准
            dim_match = re.search(dim_std_pattern, part)
            if dim_match:
                if not result[3]:
                    result[3] = dim_match.group(1).strip()
                continue

            # 检查是否是管型
            is_pipe_type = False
            for pattern in pipe_type_patterns:
                if re.search(pattern, part_upper):
                    if not result[4]:
                        result[4] = part
                    is_pipe_type = True
                    break

            if is_pipe_type:
                continue

            # 其他不匹配的内容跳过

        return result

    def _determine_npd_unit_type(self, size_range: str) -> str:
        """
        确定NpdUnitType（mm或in）

        根据PRD V2.0 5.2.2:
        - 如果尺寸范围包含小数（如0.5~2），则为in
        - 如果尺寸范围为整数（如15~40），则为mm
        """
        size_range = size_range.strip()

        if not size_range:
            return 'mm'

        # 尝试提取数字
        numbers = re.findall(r'\d+\.?\d*', size_range)
        if not numbers:
            return 'mm'

        # 检查是否包含小数
        for num_str in numbers:
            if '.' in num_str:
                return 'in'

        # 检查数值大小：如果最大值小于等于2，可能是in
        try:
            vals = [float(n) for n in numbers]
            if max(vals) <= 2 and min(vals) < 1:
                return 'in'
        except:
            pass

        return 'mm'

    def _parse_size_range(self, size_range: str, unit_type: str = 'mm') -> List[float]:
        """
        解析尺寸范围字符串，按照V2.0规则展开

        Args:
            size_range: 尺寸范围字符串，如"15~40", "0.5~2", "DN50"
            unit_type: 'mm' 或 'in'

        Returns:
            展开后的尺寸列表
        """
        sizes = []
        size_range = size_range.strip()

        if not size_range:
            return sizes

        # 移除"DN"前缀
        size_range = size_range.replace('DN', '').replace('dn', '').strip()

        # 尝试匹配范围格式: 15~40, 0.5~2, .5~1.5
        match = re.match(r'^\.?(\d+(?:\.\d+)?)\s*[~\-]\s*\.?(\d+(?:\.\d+)?)$', size_range)
        if match:
            start_str = match.group(1)
            end_str = match.group(2)

            # 处理以点开头的尺寸
            if size_range.startswith('.'):
                start = float('0.' + start_str)
            else:
                start = float(start_str)

            if '.' in end_str and end_str.startswith('.'):
                end = float('0.' + end_str[1:])
            else:
                end = float(end_str)

            # 根据单位类型选择标准序列
            if unit_type == 'in':
                # in单位：使用NPS序列
                for nps in self.STANDARD_NPS_IN:
                    if start <= nps <= end:
                        sizes.append(nps)
            else:
                # mm单位：使用DN序列
                for dn in self.STANDARD_DN_MM:
                    if start <= dn <= end:
                        sizes.append(dn)

            return sizes

        # 尝试匹配单个尺寸
        match = re.match(r'^\.?(\d+(?:\.\d+)?)$', size_range)
        if match:
            num_str = match.group(1)
            if size_range.startswith('.'):
                sizes.append(float('0.' + num_str))
            else:
                sizes.append(float(num_str))
            return sizes

        # 尝试匹配螺栓尺寸: M14~M56
        match = re.match(r'^M(\d+)\s*[~\-]\s*M(\d+)$', size_range)
        if match:
            sizes.append(float(match.group(1)))
            sizes.append(float(match.group(2)))
            return sizes

        # 尝试匹配单个螺栓尺寸: M14
        match = re.match(r'^M(\d+)$', size_range)
        if match:
            sizes.append(float(match.group(1)))
            return sizes

        return sizes

    def _extract_size_table(self, df: pd.DataFrame) -> Optional[List[SizeTableEntry]]:
        """提取尺寸表（壁厚等级表）"""
        size_table = []

        # 查找尺寸表起始行（通常在ITEMS之后，包含"NPS"或"DN"的行）
        size_table_start = None
        for idx in range(len(df) - 1, -1, -1):
            row = df.iloc[idx]
            row_values = row.dropna().tolist()
            if not row_values:
                continue

            first_col = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
            first_upper = first_col.strip().upper()

            # 查找NPS或DN行
            if 'NPS' in first_upper or 'DN' in first_upper:
                size_table_start = idx
                break

        if size_table_start is None:
            return None

        # 解析尺寸表
        # 通常结构：NPS行 + Schedule行
        try:
            nps_row = df.iloc[size_table_start]

            # 查找Schedule行（在NPS行之后）
            schedule_row_idx = None
            for idx in range(size_table_start + 1, min(size_table_start + 5, len(df))):
                row = df.iloc[idx]
                first_col = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''
                if 'SCH' in first_col.upper() or 'SCHEDULE' in first_col.upper():
                    schedule_row_idx = idx
                    break

            if schedule_row_idx is not None:
                schedule_row = df.iloc[schedule_row_idx]

                # 解析各列
                for col_idx in range(1, len(nps_row)):
                    if pd.notna(nps_row.iloc[col_idx]):
                        try:
                            npd_val = float(nps_row.iloc[col_idx])
                            schedule_val = str(schedule_row.iloc[col_idx]) if col_idx < len(schedule_row) and pd.notna(schedule_row.iloc[col_idx]) else ''

                            # 确定单位类型
                            npd_unit_type = 'in' if npd_val < 30 else 'mm'

                            entry = SizeTableEntry(
                                npd=npd_val,
                                npd_unit_type=npd_unit_type,
                                schedule=schedule_val
                            )
                            size_table.append(entry)
                        except:
                            pass

        except Exception as e:
            pass

        return size_table if size_table else None

    def _extract_temp_pressure(self, df: pd.DataFrame) -> Optional[Dict]:
        """提取温度压力限制表"""
        temp_pressure = {}

        for idx, row in df.iterrows():
            row_values = row.dropna().tolist()
            if not row_values:
                continue

            first_col = str(row.iloc[0]) if pd.notna(row.iloc[0]) else ''

            if 'TEMP' in first_col.upper() and '℃' in first_col:
                temps = []
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        try:
                            temps.append(float(row.iloc[i]))
                        except:
                            pass
                temp_pressure['temperatures'] = temps

            elif 'MAX PRESSURE' in first_col.upper() or 'PRESSURE' in first_col.upper():
                pressures = []
                for i in range(1, len(row)):
                    if pd.notna(row.iloc[i]):
                        try:
                            pressures.append(float(row.iloc[i]))
                        except:
                            pass
                temp_pressure['pressures'] = pressures

        return temp_pressure if temp_pressure else None

    def _extract_branch_table(self, df: pd.DataFrame) -> Optional[List[BranchTableEntry]]:
        """提取分支表"""
        branch_table = []

        # 查找分支表起始行
        branch_start_row = None
        for idx, row in df.iterrows():
            row_values = row.dropna().tolist()
            row_strs = [str(v).strip().upper() for v in row_values]
            if 'BRANCH TABLE' in ' '.join(row_strs):
                branch_start_row = idx
                break

        if branch_start_row is None:
            return None

        # 解析分支表头尺寸行（通常是NPS值）
        header_sizes = []
        for idx in range(branch_start_row + 1, min(branch_start_row + 3, len(df))):
            row = df.iloc[idx]
            for i in range(len(row)):
                if pd.notna(row.iloc[i]):
                    try:
                        size = float(row.iloc[i])
                        header_sizes.append((i, size))
                    except:
                        pass

        # 解析分支表数据行
        for idx in range(branch_start_row + 2, len(df)):
            row = df.iloc[idx]
            row_values = row.dropna().tolist()
            if not row_values:
                continue

            try:
                branch_size = float(row.iloc[0])
            except:
                continue

            # 解析每列的分支类型
            for col_idx, header_size in header_sizes:
                if col_idx < len(row) and pd.notna(row.iloc[col_idx]):
                    branch_type = str(row.iloc[col_idx]).strip()
                    if branch_type and branch_type.upper() not in ['NAN', '']:
                        entry = BranchTableEntry(
                            header_size=header_size,
                            branch_size=branch_size,
                            branch_type=branch_type
                        )
                        branch_table.append(entry)

        return branch_table if branch_table else None

    def get_parts_by_type(self, class_name: str, part_type: str) -> List[PartItem]:
        """获取指定材料等级和类型的零件"""
        if class_name not in self.parts:
            return []

        return [p for p in self.parts[class_name] if p.item_type.upper() == part_type.upper()]

    def get_all_classes(self) -> List[str]:
        """获取所有材料等级名称"""
        return list(self.material_classes.keys())

    def get_class_info(self, class_name: str) -> Optional[MaterialClassInfo]:
        """获取材料等级信息"""
        return self.material_classes.get(class_name)

    def get_schedule_for_size(self, class_name: str, size: float, unit_type: str = 'mm') -> str:
        """
        获取指定尺寸的壁厚等级

        Args:
            class_name: 材料等级名称
            size: 尺寸值
            unit_type: 'mm' 或 'in'

        Returns:
            壁厚等级字符串，如'SCH40'
        """
        size_table = self.size_tables.get(class_name, [])

        for entry in size_table:
            if entry.npd_unit_type == unit_type:
                if abs(entry.npd - size) < 0.01:
                    return entry.schedule

        # 默认值
        if unit_type == 'in':
            if size <= 1.5:
                return 'SCH80'
            elif size <= 6.0:
                return 'SCH40'
            else:
                return 'SCH20'
        else:
            if size <= 40:
                return 'SCH80'
            elif size <= 150:
                return 'SCH40'
            else:
                return 'SCH20'


if __name__ == '__main__':
    # 测试解析器
    file_path = r'c:\Users\admin\Desktop\3D\0-S3D资料\1-20240321\资料\1-管道建库\Sheets\24019S3D材料建库\2-材料等级表\20260612-PIPING MATERIAL CLASS SPECIFICATIONS.xlsx'

    parser = MaterialSpecParser(file_path)
    result = parser.parse()

    print("=== 材料等级 ===")
    for name, info in result['material_classes'].items():
        print(f"\n{name}:")
        print(f"  管材材料: {info.piping_material}")
        print(f"  法兰材料: {info.flange_material}")
        print(f"  压力等级: {info.flange_rating}")
        print(f"  密封面: {info.flange_face}")
        print(f"  阀体材料: {info.valve_body_material}")
        print(f"  阀内件: {info.valve_trim_material}")
        print(f"  腐蚀余量: {info.corrosion_allowance}mm")
        print(f"  服务介质: {info.service}")

    print("\n=== 零件列表 ===")
    for class_name, parts in result['parts'].items():
        print(f"\n{class_name}:")
        for part in parts[:5]:  # 只显示前5个
            print(f"  {part.item_type}: {part.size_range} {part.rating} {part.ends}")
            print(f"    单位: {part.npd_unit_type}, 尺寸: {part.sizes}")
            print(f"    描述: {part.description}")
            print(f"    商品码: {part.commodity_code}")
