"""
S3D建库数据生成器 V3.0
基于内置模板字段定义，直接生成PipingCatalog和SPC输出文件
无需外部模板文件
"""

import os
import time
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass

# 导入Excel处理库
import xlwt

from config import (
    PART_TYPE_MAPPING, END_PREPARATION_MAPPING, END_STANDARD_MAPPING,
    MATERIAL_GRADE_MAPPING, PRESSURE_RATING_MAPPING, SCHEDULE_MAPPING,
    NPS_TO_DN, DN_TO_NPS,
    COMMODITY_CODE_PREFIX, FABRICATION_TYPE_MAPPING,
    VALVE_OPERATOR_MAPPING, DEFAULT_VALUES, OUTPUT_FILES,
    PIPING_CATALOG_TEMPLATES, SPC_TEMPLATES
)
from material_spec_parser import MaterialSpecParser, PartItem, MaterialClassInfo
from code_lookup import AllCodeListsLookup


class S3DDataGenerator:
    """S3D建库数据生成器 V3.1 - PostgreSQL数据库版本"""

    def __init__(self, output_dir: str, allcodelists_path: str = None):
        """
        初始化数据生成器
        
        allcodelists_path参数已废弃，仅保留以保持接口兼容性。
        代码查询现在直接从PostgreSQL数据库(s3d_codelists)进行。
        """
        self.output_dir = output_dir
        self.code_lookup = None
        try:
            self.code_lookup = AllCodeListsLookup()
        except Exception as e:
            print(f"[警告] 初始化代码查找引擎失败: {e}")

        os.makedirs(output_dir, exist_ok=True)
        self.generated_files: List[str] = []
        self.summary_data: List[Dict] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []

    def generate_all(self, parser: MaterialSpecParser, selected_classes: List[str] = None) -> Dict[str, str]:
        """
        生成所有材料等级的S3D数据
        """
        output_files = {}
        classes = selected_classes if selected_classes else parser.get_all_classes()

        for class_name in classes:
            class_info = parser.get_class_info(class_name)
            parts = parser.parts.get(class_name, [])

            if not class_info or not parts:
                self.warnings.append(f"材料等级 {class_name} 没有数据，跳过")
                continue

            try:
                # 清除之前的代码查找错误
                if self.code_lookup:
                    self.code_lookup.errors.clear()

                # 生成PipingCatalog
                pc_file = self._generate_piping_catalog(class_name, class_info, parts, parser)
                if pc_file:
                    output_files[pc_file] = f"{class_name} - PipingCatalog"

                # 生成SPC
                spc_file = self._generate_spc(class_name, class_info, parts, parser)
                if spc_file:
                    output_files[spc_file] = f"{class_name} - SPC"

                # 收集代码查找错误
                if self.code_lookup:
                    for err in self.code_lookup.errors.get_errors():
                        msg = f"[代码查找错误][{err['sheet_name']}] 查找 '{err['lookup_key']}' 失败: {err['reason']}"
                        if msg not in self.errors:
                            self.errors.append(msg)

            except Exception as e:
                self.errors.append(f"生成 {class_name} 失败: {str(e)}")
                import traceback
                traceback.print_exc()

        return output_files

    def _generate_piping_catalog(self, class_name: str, class_info: MaterialClassInfo,
                                 parts: List[PartItem], parser: MaterialSpecParser) -> Optional[str]:
        """生成PipingCatalog输出文件 - 使用内置模板"""

        output_file = os.path.join(self.output_dir, f"{class_name}_{OUTPUT_FILES['piping_catalog']}")

        # 创建新的工作簿
        wb = xlwt.Workbook()
        sheet_names = []  # 维护工作表名称列表

        # 按S3D类型分组处理零件
        parts_by_type = self._group_parts_by_type(parts)

        total_rows = 0

        for s3d_type, type_parts in parts_by_type.items():
            # 检查是否有对应的内置模板
            if s3d_type not in PIPING_CATALOG_TEMPLATES:
                self.warnings.append(f"工作表 {s3d_type} 没有内置模板定义，跳过")
                continue

            template = PIPING_CATALOG_TEMPLATES[s3d_type]
            fields = template['fields']

            # 创建工作表
            ws = wb.add_sheet(s3d_type)
            sheet_names.append(s3d_type)

            # 写入表头结构
            # Row 0: "! Back to Index"
            ws.write(0, 0, "! Back to Index")

            # Row 1-3: Definition行
            row = 1
            if 'PartClassType' in template:
                ws.write(row, 0, "PartClassType")
                ws.write(row, 1, template['PartClassType'])
                row += 1

            if 'SymbolDefinition' in template:
                ws.write(row, 0, "SymbolDefinition")
                ws.write(row, 1, template['SymbolDefinition'])
                row += 1

            if 'UserClassName' in template:
                ws.write(row, 0, "UserClassName")
                ws.write(row, 1, template['UserClassName'])
                row += 1

            if 'OccClassName' in template:
                ws.write(row, 0, "OccClassName")
                ws.write(row, 1, template['OccClassName'])
                row += 1

            if 'SymbolIcon' in template:
                ws.write(row, 0, "SymbolIcon")
                ws.write(row, 1, template['SymbolIcon'])
                row += 1

            # Row 4: "CommodityPart"
            ws.write(row, 0, "CommodityPart")
            row += 1

            # Row 5: 空行
            row += 1

            # Row 6: "Head" - 字段名行
            ws.write(row, 0, "Head")
            for col, field_name in enumerate(fields):
                ws.write(row, col + 1, field_name)
            row += 1

            # Row 7: "Start" 标记
            ws.write(row, 0, "Start")
            row += 1

            # 收集数据行
            all_data_rows = []
            for part in type_parts:
                for size in part.sizes:
                    row_data = self._create_piping_catalog_row(
                        s3d_type, part, size, class_info, class_name, parser, fields
                    )
                    all_data_rows.append(row_data)
                    total_rows += 1

            # 写入数据行
            for row_idx, row_data in enumerate(all_data_rows):
                excel_row = row + row_idx
                for col, field_name in enumerate(fields):
                    if field_name in row_data:
                        ws.write(excel_row, col + 1, row_data[field_name])

        # 添加"Back to Index"工作表
        self._add_index_sheet(wb, sheet_names)

        # 保存工作簿
        wb.save(output_file)

        self.generated_files.append(output_file)
        self.summary_data.append({
            '材料等级': class_name,
            '文件类型': 'PipingCatalog',
            '生成记录数': total_rows,
            '输出路径': output_file,
        })

        return output_file

    def _add_index_sheet(self, wb, sheet_names):
        """添加索引工作表"""
        ws = wb.add_sheet("Back to Index")
        ws.write(0, 0, "!BackToIndex!")
        ws.write(1, 0, "ClassName")
        ws.write(1, 1, "CommodityPart")
        ws.write(1, 2, "Description")

        row = 2
        for sheet_name in sheet_names:
            ws.write(row, 0, sheet_name)
            ws.write(row, 1, sheet_name)
            ws.write(row, 2, f"Commodity Part - {sheet_name}")
            row += 1

    def _generate_spc(self, class_name: str, class_info: MaterialClassInfo,
                      parts: List[PartItem], parser: MaterialSpecParser) -> Optional[str]:
        """生成SPC输出文件 - 使用内置模板"""

        output_file = os.path.join(self.output_dir, f"{class_name}_{OUTPUT_FILES['spc']}")

        # 创建新的工作簿
        wb = xlwt.Workbook()
        sheet_names = []  # 维护工作表名称列表

        total_rows = 0

        # 1. PipingMaterialsClassData
        row_count = self._create_piping_materials_class_sheet(wb, class_name, class_info)
        total_rows += row_count
        sheet_names.append('PipingMaterialsClassData')

        # 2. PipingCommodityFilter
        row_count = self._create_piping_commodity_filter_sheet(wb, class_name, class_info, parts, parser)
        total_rows += row_count
        sheet_names.append('PipingCommodityFilter')

        # 3. PipingCommodityMatlControlData
        row_count = self._create_piping_commodity_matl_control_sheet(wb, class_name, class_info, parts, parser)
        total_rows += row_count
        sheet_names.append('PipingCommodityMatlControlData')

        # 4. PipeBranch
        row_count = self._create_pipe_branch_sheet(wb, class_name, parser)
        total_rows += row_count
        sheet_names.append('PipeBranch')

        # 5. PipeNominalDiameters
        row_count = self._create_pipe_nominal_diameters_sheet(wb, class_name, parser)
        total_rows += row_count
        sheet_names.append('PipeNominalDiameters')

        # 6. BendAngles
        row_count = self._create_bend_angles_sheet(wb, class_name, parts)
        total_rows += row_count
        sheet_names.append('BendAngles')

        # 添加索引工作表
        self._add_spc_index_sheet(wb, sheet_names)

        # 保存工作簿
        wb.save(output_file)

        self.generated_files.append(output_file)
        self.summary_data.append({
            '材料等级': class_name,
            '文件类型': 'SPC',
            '生成记录数': total_rows,
            '输出路径': output_file,
        })

        return output_file

    def _add_spc_index_sheet(self, wb, sheet_names):
        """添加SPC索引工作表"""
        ws = wb.add_sheet("Back to Index")
        ws.write(0, 0, "!BackToIndex!")
        ws.write(1, 0, "ClassName")
        ws.write(1, 1, "CommodityPart")
        ws.write(1, 2, "Description")

        row = 2
        for sheet_name in sheet_names:
            ws.write(row, 0, sheet_name)
            ws.write(row, 1, sheet_name)
            ws.write(row, 2, f"SPC Data - {sheet_name}")
            row += 1

    def _create_piping_materials_class_sheet(self, wb, class_name: str, class_info: MaterialClassInfo) -> int:
        """创建PipingMaterialsClassData工作表"""
        ws = wb.add_sheet('PipingMaterialsClassData')

        template = SPC_TEMPLATES['PipingMaterialsClassData']
        fields = template['fields']

        # 写入表头
        for col, field_name in enumerate(fields):
            ws.write(0, col, field_name)

        # 写入数据
        row_data = {}

        if 'SpecName' in fields:
            row_data['SpecName'] = class_name
        if 'MaterialsOfConstructionClass' in fields:
            row_data['MaterialsOfConstructionClass'] = class_name
        if 'MaterialsDescription' in fields:
            row_data['MaterialsDescription'] = class_info.service
        if 'FluidService' in fields:
            row_data['FluidService'] = class_info.service
        if 'DesignStandard' in fields:
            if self.code_lookup and class_info.design_standard:
                design_std = self.code_lookup.find_design_standard(class_info.design_standard)
                if design_std is not None:
                    row_data['DesignStandard'] = design_std
            # 如果找不到，不填写（让S3D系统使用默认值）
        if 'PipingSpecStatus' in fields:
            # PipingSpecStatus: 从AllCodeLists.PipingSpecStatus查找
            if self.code_lookup:
                ps = self.code_lookup.find_piping_spec_status()
                if ps is not None:
                    row_data['PipingSpecStatus'] = ps
                else:
                    row_data['PipingSpecStatus'] = 'W'
            else:
                row_data['PipingSpecStatus'] = 'W'
        if 'Responsibility' in fields:
            row_data['Responsibility'] = 'C'
        if 'MaterialsType' in fields:
            row_data['MaterialsType'] = 'NA'

        for col, field_name in enumerate(fields):
            if field_name in row_data:
                ws.write(1, col, row_data[field_name])

        return 1

    def _create_piping_commodity_filter_sheet(self, wb, class_name: str, class_info: MaterialClassInfo,
                                              parts: List[PartItem], parser: MaterialSpecParser) -> int:
        """创建PipingCommodityFilter工作表"""
        ws = wb.add_sheet('PipingCommodityFilter')

        template = SPC_TEMPLATES['PipingCommodityFilter']
        fields = template['fields']

        # 写入表头
        for col, field_name in enumerate(fields):
            ws.write(0, col, field_name)

        # 生成数据行
        data_rows = self._generate_piping_commodity_filter_data(class_name, class_info, parts, parser)

        for row_idx, row_data in enumerate(data_rows):
            for col, field_name in enumerate(fields):
                if field_name in row_data:
                    ws.write(row_idx + 1, col, row_data[field_name])

        return len(data_rows)

    def _create_piping_commodity_matl_control_sheet(self, wb, class_name: str, class_info: MaterialClassInfo,
                                                     parts: List[PartItem], parser: MaterialSpecParser) -> int:
        """创建PipingCommodityMatlControlData工作表"""
        ws = wb.add_sheet('PipingCommodityMatlControlData')

        template = SPC_TEMPLATES['PipingCommodityMatlControlData']
        fields = template['fields']

        # 写入表头
        for col, field_name in enumerate(fields):
            ws.write(0, col, field_name)

        # 生成数据行
        data_rows = self._generate_piping_commodity_matl_control_data(class_name, class_info, parts, parser)

        for row_idx, row_data in enumerate(data_rows):
            for col, field_name in enumerate(fields):
                if field_name in row_data:
                    ws.write(row_idx + 1, col, row_data[field_name])

        return len(data_rows)

    def _create_pipe_branch_sheet(self, wb, class_name: str, parser: MaterialSpecParser) -> int:
        """创建PipeBranch工作表"""
        ws = wb.add_sheet('PipeBranch')

        template = SPC_TEMPLATES['PipeBranch']
        fields = template['fields']

        # 写入表头
        for col, field_name in enumerate(fields):
            ws.write(0, col, field_name)

        # 生成数据行
        data_rows = self._generate_pipe_branch_data(class_name, parser)

        for row_idx, row_data in enumerate(data_rows):
            for col, field_name in enumerate(fields):
                if field_name in row_data:
                    ws.write(row_idx + 1, col, row_data[field_name])

        return len(data_rows)

    def _create_pipe_nominal_diameters_sheet(self, wb, class_name: str, parser: MaterialSpecParser) -> int:
        """创建PipeNominalDiameters工作表"""
        ws = wb.add_sheet('PipeNominalDiameters')

        template = SPC_TEMPLATES['PipeNominalDiameters']
        fields = template['fields']

        # 写入表头
        for col, field_name in enumerate(fields):
            ws.write(0, col, field_name)

        # 生成数据行
        data_rows = self._generate_pipe_nominal_diameters_data(class_name, parser)

        for row_idx, row_data in enumerate(data_rows):
            for col, field_name in enumerate(fields):
                if field_name in row_data:
                    ws.write(row_idx + 1, col, row_data[field_name])

        return len(data_rows)

    def _create_bend_angles_sheet(self, wb, class_name: str, parts: List[PartItem]) -> int:
        """创建BendAngles工作表"""
        ws = wb.add_sheet('BendAngles')

        template = SPC_TEMPLATES['BendAngles']
        fields = template['fields']

        # 写入表头
        for col, field_name in enumerate(fields):
            ws.write(0, col, field_name)

        # 生成数据行
        data_rows = self._generate_bend_angles_data(class_name, parts)

        for row_idx, row_data in enumerate(data_rows):
            for col, field_name in enumerate(fields):
                if field_name in row_data:
                    ws.write(row_idx + 1, col, row_data[field_name])

        return len(data_rows)

    def _group_parts_by_type(self, parts: List[PartItem]) -> Dict[str, List[PartItem]]:
        """按S3D类型分组零件"""
        groups = {}
        for part in parts:
            s3d_type = self._get_s3d_type(part.item_type)
            if s3d_type:
                if s3d_type not in groups:
                    groups[s3d_type] = []
                groups[s3d_type].append(part)
        return groups

    def _get_s3d_type(self, item_type: str) -> Optional[str]:
        """获取零件对应的S3D类型

        注意：BRANCH（支管）类型的零件不映射到PipingCatalog工作表
        """
        item_type_clean = item_type.strip().upper()

        # 跳过支管类型零件（不显示在PipingCatalog中）
        branch_keywords = ['BRANCH', 'LATERAL', 'STUB', 'NIPO', 'LATrolet', 
                           'SWEEPOLET', 'WELDOLET-BRANCH', 'BRANCH-']
        for keyword in branch_keywords:
            if keyword in item_type_clean:
                return None

        for key, value in PART_TYPE_MAPPING.items():
            if key.upper() == item_type_clean:
                return value['sheet_name']

        # 模糊匹配
        if 'PIPE' in item_type_clean and 'ELBOW' not in item_type_clean:
            return 'PipeStock'
        elif 'ELBOW' in item_type_clean:
            if '45' in item_type_clean:
                return '45DegElbow'
            elif 'SR' in item_type_clean:
                return '90DegSRElbow'
            else:
                return '90DegLRElbow'
        elif 'REDUCER' in item_type_clean or 'REDUC' in item_type_clean:
            if 'ECC' in item_type_clean:
                return 'EccentricReducer'
            else:
                return 'ConcentricReducer'
        elif 'TEE' in item_type_clean:
            if 'RED' in item_type_clean:
                return 'ReducingTee'
            else:
                return 'Tee'
        elif 'CAP' in item_type_clean:
            return 'Cap'
        elif 'WELDOLET' in item_type_clean:
            return 'Weldolet'
        elif 'FLANGE' in item_type_clean:
            if 'BLIND' in item_type_clean:
                return 'BlindFlange'
            elif 'WN' in item_type_clean or 'WELD' in item_type_clean:
                return 'WeldNeckFlange'
            elif 'SW' in item_type_clean:
                return 'SocketweldFlange'
            else:
                return 'WeldNeckFlange'
        elif 'BLANK' in item_type_clean or 'SPECTACLE' in item_type_clean or 'FIGURE' in item_type_clean:
            return 'SpectacleBlind'

        return None

    def _resolve_user_value(self, user_value: str, lookup_method=None) -> Any:
        """解析用户输入的值
        - 纯数字 -> 直接转为整数
        - 文本 -> 尝试用lookup_method查找代码，找不到则返回原文本
        """
        if not user_value:
            return None
        try:
            return int(user_value)
        except ValueError:
            if lookup_method and self.code_lookup:
                code = lookup_method(user_value)
                if code is not None:
                    return code
            return user_value

    def _create_piping_catalog_row(self, s3d_type: str, part: PartItem, size: float,
                                   class_info: MaterialClassInfo, class_name: str,
                                   parser: MaterialSpecParser, fields: List[str]) -> Dict[str, Any]:
        """创建PipingCatalog数据行"""
        row = {}

        # 使用code_lookup获取代码（严格版本：找不到返回None，不填默认值）
        # 从分解后的description_parts中查找对应字段：
        # [0]国标/行业标准 → GeometricIndustryStandard
        # [1]材质 → MaterialsGrade
        # [2]端部形式 → EndPreparation
        desc_parts = part.description_parts if hasattr(part, 'description_parts') and len(part.description_parts) >= 5 else ['', '', '', '', '']
        standard_text = desc_parts[0] if desc_parts else ''
        material_text = desc_parts[1] if len(desc_parts) > 1 else ''
        end_prep_text = desc_parts[2] if len(desc_parts) > 2 else part.ends

        if self.code_lookup:
            commodity_type = self.code_lookup.find_commodity_type(part.item_type)
            geometry_type = self.code_lookup.find_geometry_type(part.item_type)
            material_grade = self.code_lookup.find_materials_grade(material_text)
            end_prep = self.code_lookup.find_end_preparation(end_prep_text)
            geom_std = self.code_lookup.find_geometric_industry_standard(standard_text)
            pressure_rating = self.code_lookup.find_pressure_rating(part.rating) if part.rating else None
        else:
            commodity_type = None
            geometry_type = None
            material_grade = None
            end_prep = None
            geom_std = None
            pressure_rating = None

        # ========== 应用用户覆盖值 ==========
        # CommodityType
        if hasattr(part, 'commodity_type_override') and part.commodity_type_override.strip():
            commodity_type = self._resolve_user_value(
                part.commodity_type_override.strip(),
                self.code_lookup.find_commodity_type if self.code_lookup else None
            )

        # GeometryType
        if hasattr(part, 'geometry_type_override') and part.geometry_type_override.strip():
            geometry_type = self._resolve_user_value(
                part.geometry_type_override.strip(),
                self.code_lookup.find_geometry_type if self.code_lookup else None
            )

        # EndPreparation
        if hasattr(part, 'end_preparation_override') and part.end_preparation_override.strip():
            end_prep = self._resolve_user_value(
                part.end_preparation_override.strip(),
                self.code_lookup.find_end_preparation if self.code_lookup else None
            )

        # GeometricIndustryStandard
        if hasattr(part, 'geom_industry_std_override') and part.geom_industry_std_override.strip():
            geom_std = self._resolve_user_value(
                part.geom_industry_std_override.strip(),
                self.code_lookup.find_geometric_industry_standard if self.code_lookup else None
            )

        # MaterialGrade - 用户覆盖值
        if hasattr(part, 'material_grade_override') and part.material_grade_override.strip():
            material_grade = self._resolve_user_value(
                part.material_grade_override.strip(),
                self.code_lookup.find_materials_grade if self.code_lookup else None
            )

        # 基本字段 - 只有找到代码才填写
        if 'IndustryCommodityCode' in fields:
            row['IndustryCommodityCode'] = part.commodity_code if part.commodity_code else self._generate_commodity_code(commodity_type or '', size, class_name)

        if 'CommodityType' in fields and commodity_type is not None:
            row['CommodityType'] = commodity_type

        if 'GeometryType' in fields and geometry_type is not None:
            row['GeometryType'] = geometry_type

        if 'MaterialGrade' in fields and material_grade is not None:
            row['MaterialGrade'] = material_grade

        if 'GeometricIndustryStandard' in fields and geom_std is not None:
            row['GeometricIndustryStandard'] = geom_std

        # SymbolDefinition - 用户直接输入
        if 'SymbolDefinition' in fields:
            if hasattr(part, 'symbol_definition') and part.symbol_definition.strip():
                row['SymbolDefinition'] = part.symbol_definition.strip()

        # PartDataBasis - 用户直接输入
        if 'PartDataBasis' in fields:
            if hasattr(part, 'part_data_basis') and part.part_data_basis.strip():
                row['PartDataBasis'] = self._resolve_user_value(part.part_data_basis.strip())

        # PipingPointBasis - 用户直接输入
        if 'PipingPointBasis' in fields:
            if hasattr(part, 'piping_point_basis') and part.piping_point_basis.strip():
                row['PipingPointBasis'] = self._resolve_user_value(part.piping_point_basis.strip())

        # FlowDirection - 用户直接输入
        if 'FlowDirection' in fields:
            if hasattr(part, 'flow_direction') and part.flow_direction.strip():
                row['FlowDirection'] = self._resolve_user_value(part.flow_direction.strip())

        # FaceToCenter - 用户直接输入
        if 'FaceToCenter' in fields:
            if hasattr(part, 'face_to_center') and part.face_to_center.strip():
                row['FaceToCenter'] = self._resolve_user_value(part.face_to_center.strip())

        # 端部准备（多端口）
        if end_prep is not None:
            for i in [1, 2, 3]:
                key = f'EndPreparation[{i}]'
                if key in fields:
                    row[key] = end_prep

        # 端部标准（多端口）- 优先使用用户手动输入的值
        end_std_value = None
        if hasattr(part, 'end_standard') and part.end_standard.strip():
            end_std_value = self._resolve_user_value(
                part.end_standard.strip(),
                self.code_lookup.find_geometric_industry_standard if self.code_lookup else None
            )
        elif geom_std is not None:
            end_std_value = geom_std

        if end_std_value is not None:
            for i in [1, 2, 3]:
                key = f'EndStandard[{i}]'
                if key in fields:
                    row[key] = end_std_value

        # 壁厚等级
        schedule = self._get_schedule(size, class_name, part.npd_unit_type, parser)
        for i in [1, 2, 3]:
            key = f'ScheduleThickness[{i}]'
            if key in fields:
                row[key] = schedule

        # 压力等级（多端口）
        if part.rating:
            for i in [1, 2, 3]:
                key = f'PressureRating[{i}]'
                if key in fields:
                    row[key] = pressure_rating

        # Npd 和 NpdUnitType
        npd_unit = part.npd_unit_type

        if s3d_type == 'PipeStock':
            npd = size
            for key in ['Npd[1]:Primary', 'Npd[1]']:
                if key in fields:
                    row[key] = npd
                    break
            for key in ['NpdUnitType[1]', 'NpdUnitType[1]:Primary']:
                if key in fields:
                    row[key] = 'in'
                    break
            for key in ['Npd[2]:Secondary', 'Npd[2]']:
                if key in fields:
                    row[key] = npd
                    break
            for key in ['NpdUnitType[2]', 'NpdUnitType[2]:Secondary']:
                if key in fields:
                    row[key] = 'in'
                    break

        elif s3d_type in ('Tee', 'ReducingTee'):
            npd_val = size if npd_unit == 'mm' else NPS_TO_DN.get(size, size * 25)

            for key in ['Npd[1]:Primary', 'Npd[1]']:
                if key in fields:
                    row[key] = npd_val
                    break
            for key in ['NpdUnitType[1]', 'NpdUnitType[1]:Primary']:
                if key in fields:
                    row[key] = npd_unit
                    break

            for key in ['Npd[2]:Primary', 'Npd[2]']:
                if key in fields:
                    row[key] = npd_val
                    break
            for key in ['NpdUnitType[2]', 'NpdUnitType[2]:Primary']:
                if key in fields:
                    row[key] = npd_unit
                    break

            if s3d_type == 'Tee':
                branch_npd = npd_val
            else:
                branch_npd = self._get_branch_size(parser, class_name, size)

            for key in ['Npd[3]:Secondary', 'Npd[3]']:
                if key in fields:
                    row[key] = branch_npd
                    break
            for key in ['NpdUnitType[3]', 'NpdUnitType[3]:Secondary']:
                if key in fields:
                    row[key] = npd_unit
                    break
        else:
            npd_val = size if npd_unit == 'mm' else NPS_TO_DN.get(size, size * 25)

            for key in ['Npd[1]', 'Npd[1]:Primary']:
                if key in fields:
                    row[key] = npd_val
                    break
            for key in ['NpdUnitType[1]', 'NpdUnitType[1]:Primary']:
                if key in fields:
                    row[key] = npd_unit
                    break

            for key in ['Npd[2]', 'Npd[2]:Secondary']:
                if key in fields:
                    row[key] = npd_val
                    break
            for key in ['NpdUnitType[2]', 'NpdUnitType[2]:Secondary']:
                if key in fields:
                    row[key] = npd_unit
                    break

        # 弯头特殊处理
        if 'BendAngle' in fields:
            if s3d_type == '45DegElbow':
                row['BendAngle'] = '45deg'
            elif 'Elbow' in s3d_type:
                row['BendAngle'] = '90deg'

        if 'BendRadiusMultiplier' in fields:
            if 'SR' in s3d_type:
                row['BendRadiusMultiplier'] = 1.0
            elif 'Elbow' in s3d_type:
                row['BendRadiusMultiplier'] = 1.5

        # 阀门特殊处理
        if 'ValveTrim' in fields:
            row['ValveTrim'] = class_info.valve_trim_material

        # 通用默认值
        if 'GraphicalRepresentationOrNot' in fields and 'GraphicalRepresentationOrNot' not in row:
            row['GraphicalRepresentationOrNot'] = 1
        if 'PartDataBasis' in fields and 'PartDataBasis' not in row:
            row['PartDataBasis'] = 1

        return row

    def _generate_piping_commodity_filter_data(self, class_name: str, class_info: MaterialClassInfo,
                                               parts: List[PartItem], parser: MaterialSpecParser) -> List[Dict]:
        """生成PipingCommodityFilter数据行列表 - V3.0 PRD规范"""
        data_rows = []

        commodity_groups = self._group_by_commodity_code(parts)

        for commodity_code, group in commodity_groups.items():
            part = group['part']
            s3d_type = group['s3d_type']
            sizes = sorted(set(group['sizes']))

            if not sizes:
                continue

            # 获取CommodityType代码（如PIPE, E90, FWN等）
            short_code = self._get_short_code(s3d_type, part)
            if short_code is None:
                # 如果找不到ShortCode，跳过此零件
                continue

            row_data = {}
            row_data['SpecName'] = class_name
            row_data['ShortCode'] = short_code

            # OptionCode: 从AllCodeLists.CommodityOption中查找
            if self.code_lookup:
                option_code = self.code_lookup.find_commodity_option(part.item_type)
                if option_code is not None:
                    row_data['OptionCode'] = option_code
            # 如果找不到OptionCode，不填写（让S3D系统使用默认值）

            row_data['FirstSizeFrom'] = min(sizes)
            row_data['FirstSizeTo'] = max(sizes)
            row_data['FirstSizeUnits'] = part.npd_unit_type

            # 第二尺寸处理 - 根据PRD V3.0 第二尺寸填写规则表
            second_size_result = self._calculate_second_size(s3d_type, sizes, part, class_name, parser)
            if second_size_result:
                row_data['SecondSizeFrom'] = second_size_result['from']
                row_data['SecondSizeTo'] = second_size_result['to']
                row_data['SecondSizeUnits'] = part.npd_unit_type

            row_data['CommodityCode'] = commodity_code

            # FirstSizeSchedule规则 (PRD V3.0 5.3.2):
            # - Piping: 从尺寸表查找壁厚等级
            # - 法兰/阀门: 不填写
            # - 其他类型: 填写MATCH
            if short_code == 'PIPE' or short_code == 'Piping':
                schedule = self._get_schedule(sizes[0], class_name, part.npd_unit_type, parser)
                if self.code_lookup:
                    schedule_desc = self.code_lookup.find_schedule_thickness(schedule)
                    if schedule_desc:
                        row_data['FirstSizeSchedule'] = schedule_desc
                    else:
                        row_data['FirstSizeSchedule'] = schedule  # 找不到就用原始值
                else:
                    row_data['FirstSizeSchedule'] = schedule
            elif short_code in ('FWN', 'FSW', 'FBL', 'GAT', 'GLO', 'CK', 'BALL', 'BFYLP'):
                # 法兰和阀门类不填写FirstSizeSchedule
                pass
            else:
                row_data['FirstSizeSchedule'] = 'MATCH'

            # SecondSizeSchedule规则 (PRD V3.0 5.3.2):
            # - Piping/Cap/阀门类: 不填写
            # - 其他类型: 填写MATCH
            if 'SecondSizeFrom' in row_data:
                if short_code in ('PIPE', 'Piping', 'CAP', 'GAT', 'GLO', 'CK', 'BALL', 'BFYLP'):
                    pass  # 不填写
                else:
                    row_data['SecondSizeSchedule'] = 'MATCH'

            # SelectionBasis: 从AllCodeLists.SelectionBasis查找
            if self.code_lookup:
                sb = self.code_lookup.find_selection_basis()
                if sb is not None:
                    row_data['SelectionBasis'] = sb
                else:
                    row_data['SelectionBasis'] = 1
            else:
                row_data['SelectionBasis'] = 1

            data_rows.append(row_data)

        return data_rows

    def _get_short_code(self, s3d_type: str, part: PartItem) -> Optional[str]:
        """获取ShortCode（CommodityType代码）

        严格在AllCodeLists.PipingCommodityType中查找
        找不到返回None
        """
        if self.code_lookup:
            result = self.code_lookup.find_commodity_type(part.item_type)
            if result:
                # 培训文档：管道的ShortCode为"Piping"而非"Pipe"
                if s3d_type == 'PipeStock' and result == 'PIPE':
                    return 'Piping'
                return result

        return None

    def _calculate_second_size(self, s3d_type: str, sizes: List[float], part: PartItem,
                                class_name: str, parser: MaterialSpecParser) -> Optional[Dict]:
        """
        计算第二尺寸 - 根据PRD V3.0 第二尺寸填写规则表

        规则:
        - 异径管(Reducer): SecondSize = FirstSize的上一个尺寸
        - 支管台(Weldolet): SecondSize = FirstSize的上一个尺寸
        - 异径三通(ReducingTee): SecondSize = FirstSize的上一个尺寸
        - 管箍(HalfCoupling): SecondSize = FirstSize的上一个尺寸
        - 异径短节(SwagedNipple): SecondSize = FirstSize的上一个尺寸
        - 等径类(阀门,法兰,三通,等径管,管帽,弯头,管子): 不填写
        """
        short_code = self._get_short_code(s3d_type, part)

        # 等径类不填写第二尺寸
        equal_size_types = ('PIPE', 'TE', 'FWN', 'FSW', 'FBL', 'BLSPO',
                            'GAT', 'GLO', 'CK', 'BALL', 'BFYLP',
                            'E45', 'E45LR', 'E90', 'E90LR', 'E90SR', 'CAP')
        if short_code in equal_size_types:
            return None

        # 需要填写第二尺寸的类型
        reducer_types = ('RC', 'RE', 'TR', 'CPL', 'CPLH', 'OSG', 'WEL', 'BLSPA')

        if short_code in reducer_types and len(sizes) >= 1:
            # 获取"上一个尺寸"
            prev_size = self._get_previous_size(sizes[0], part.npd_unit_type, class_name, parser)
            if prev_size:
                return {'from': prev_size, 'to': prev_size}

        return None

    def _get_previous_size(self, current_size: float, unit_type: str,
                           class_name: str, parser: MaterialSpecParser) -> Optional[float]:
        """获取当前尺寸的上一个标准尺寸"""
        # 标准尺寸序列（英寸）
        standard_inch_sizes = [0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]
        # 标准尺寸序列（mm）
        standard_mm_sizes = [6, 8, 10, 15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200,
                            250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000]

        if unit_type == 'in':
            sizes = standard_inch_sizes
        else:
            sizes = standard_mm_sizes

        try:
            idx = sizes.index(current_size)
            if idx > 0:
                return sizes[idx - 1]
        except ValueError:
            # 当前尺寸不在标准列表中，尝试找最近的较小尺寸
            for i, s in enumerate(sizes):
                if s > current_size and i > 0:
                    return sizes[i - 1]

        return None

    def _generate_piping_commodity_matl_control_data(self, class_name: str, class_info: MaterialClassInfo,
                                                     parts: List[PartItem], parser: MaterialSpecParser) -> List[Dict]:
        """生成PipingCommodityMatlControlData数据行列表 - V3.0 PRD规范"""
        data_rows = []

        commodity_groups = self._group_by_commodity_code(parts)

        for commodity_code, group in commodity_groups.items():
            part = group['part']
            s3d_type = group['s3d_type']
            sizes = sorted(set(group['sizes']))

            if not sizes:
                continue

            short_code = self._get_short_code(s3d_type, part)
            if short_code is None:
                # 如果找不到ShortCode，跳过此零件
                continue

            row_data = {}
            row_data['ContractorCommodityCode'] = commodity_code
            row_data['IndustryCommodityCode'] = commodity_code
            row_data['FirstSizeFrom'] = min(sizes)
            row_data['FirstSizeTo'] = max(sizes)
            row_data['FirstSizeUnits'] = part.npd_unit_type

            # 第二尺寸处理
            second_size_result = self._calculate_second_size(s3d_type, sizes, part, class_name, parser)
            if second_size_result:
                row_data['SecondSizeFrom'] = second_size_result['from']
                row_data['SecondSizeTo'] = second_size_result['to']
                row_data['SecondSizeUnits'] = part.npd_unit_type

            row_data['ShortMaterialDescription'] = part.description
            row_data['LongMaterialDescription'] = part.description

            # FabricationType: 固定值规则，不需要从AllCodeLists查找
            if self.code_lookup:
                row_data['FabricationType'] = self.code_lookup.get_fabrication_type(short_code)

            # SupplyResponsibility: 从AllCodeLists.SupplyResponsibility查找
            if self.code_lookup:
                sr = self.code_lookup.find_supply_responsibility()
                if sr is not None:
                    row_data['SupplyResponsibility'] = sr
                else:
                    row_data['SupplyResponsibility'] = 2
            else:
                row_data['SupplyResponsibility'] = 2
            row_data['ReportingType'] = 5
            row_data['QuantityOfReportableParts'] = 1

            # GasketRequirements: 固定值规则，不需要从AllCodeLists查找
            if self.code_lookup:
                row_data['GasketRequirements'] = self.code_lookup.get_gasket_requirements(short_code, part.ends)

            # BoltingRequirements: 固定值规则，不需要从AllCodeLists查找
            if self.code_lookup:
                row_data['BoltingRequirements'] = self.code_lookup.get_bolting_requirements(short_code)

            # WeldingRequirement: 从AllCodeLists.WeldType查找
            if self.code_lookup:
                weld_req = self.code_lookup.find_welding_requirement(short_code)
                if weld_req is not None:
                    row_data['WeldingRequirement'] = weld_req
                else:
                    # 找不到使用固定值规则作为fallback
                    row_data['WeldingRequirement'] = self.code_lookup.get_welding_requirement(short_code)

            # 阀门操作器类型: 固定值规则，不需要从AllCodeLists查找
            if 'Valve' in s3d_type and self.code_lookup:
                row_data['ValveOperatorType'] = self.code_lookup.get_valve_operator_type(short_code)

                # ValveOperatorCatalogPartNumber格式: 如GAT-Bolted-150-3
                rating_code = self._extract_rating_code(part.rating)
                operator_type_code = self.code_lookup.get_valve_operator_type(short_code)
                row_data['ValveOperatorCatalogPartNumber'] = f"{short_code}-Bolted-{rating_code}-{operator_type_code}"

            data_rows.append(row_data)

        return data_rows

    def _get_fabrication_type(self, short_code: str) -> int:
        """
        获取制造类型代码 - 根据PRD V3.0 5.3.3
        管材管件=15，法兰=20，螺栓=25，垫片=30，阀门=35
        """
        fabrication_mapping = {
            # 管材管件
            'PIPE': 15, 'NIP': 15, 'OSG': 15, 'CPL': 15, 'CPLH': 15,
            'E45': 15, 'E45LR': 15, 'E90': 15, 'E90LR': 15, 'E90SR': 15,
            'RC': 15, 'RE': 15, 'TE': 15, 'TR': 15, 'CAP': 15, 'WEL': 15,
            # 法兰
            'FWN': 20, 'FSW': 20, 'FBL': 20, 'BLSPO': 20, 'BLSPA': 20,
            # 螺栓
            'BOLT': 25,
            # 垫片
            'GSW': 30,
            # 阀门
            'GAT': 35, 'GLO': 35, 'CK': 35, 'BALL': 35, 'BFYLP': 35,
        }
        return fabrication_mapping.get(short_code, 15)

    def _extract_rating_code(self, rating: str) -> str:
        """从RATING字段提取压力等级代码（如CL150 -> 150）"""
        if not rating:
            return '0'
        rating = rating.upper()
        # 提取数字部分
        import re
        match = re.search(r'(\d+)', rating)
        if match:
            return match.group(1)
        return '0'

    def _generate_pipe_branch_data(self, class_name: str, parser: MaterialSpecParser) -> List[Dict]:
        """生成PipeBranch数据行列表"""
        data_rows = []

        branch_table = parser.branch_tables.get(class_name, [])
        if not branch_table:
            return data_rows

        for entry in branch_table:
            row_data = {}
            row_data['SpecName'] = class_name
            row_data['HeaderSize'] = entry.header_size
            row_data['BranchSize'] = entry.branch_size
            row_data['AngleLow'] = DEFAULT_VALUES['AngleLow']
            row_data['AngleHigh'] = DEFAULT_VALUES['AngleHigh']
            row_data['HdrSizeNPDUnitType'] = 'mm'
            row_data['BrSizeNPDUnitType'] = 'mm'
            if entry.header_size == entry.branch_size:
                row_data['ShortCode'] = 'Lateral'
            else:
                row_data['ShortCode'] = 'Reducing Branch Lateral'
            data_rows.append(row_data)

        return data_rows

    def _generate_pipe_nominal_diameters_data(self, class_name: str, parser: MaterialSpecParser) -> List[Dict]:
        """生成PipeNominalDiameters数据行列表"""
        data_rows = []

        size_table = parser.size_tables.get(class_name, [])
        if not size_table:
            return data_rows

        for entry in size_table:
            row_data = {}
            row_data['SpecName'] = class_name
            row_data['Npd'] = entry.npd
            row_data['NpdUnitType'] = entry.npd_unit_type
            data_rows.append(row_data)

        return data_rows

    def _generate_bend_angles_data(self, class_name: str, parts: List[PartItem]) -> List[Dict]:
        """生成BendAngles数据行列表"""
        data_rows = []

        elbow_parts = [p for p in parts if 'ELBOW' in p.item_type.upper()]
        if not elbow_parts:
            return data_rows

        all_sizes = set()
        for part in elbow_parts:
            for size in part.sizes:
                all_sizes.add((size, part.npd_unit_type))

        for size, unit_type in sorted(all_sizes):
            row_data = {}
            row_data['SpecName'] = class_name
            row_data['Npd'] = size
            row_data['NpdUnitType'] = unit_type
            row_data['BendAngle'] = '90deg'
            data_rows.append(row_data)

        return data_rows

    def _group_by_commodity_code(self, parts: List[PartItem]) -> Dict[str, Dict]:
        """按commodity_code分组零件"""
        groups = {}
        for part in parts:
            s3d_type = self._get_s3d_type(part.item_type)
            if not s3d_type:
                continue

            commodity_code = part.commodity_code if part.commodity_code else self._generate_commodity_code(
                PART_TYPE_MAPPING.get(part.item_type.strip().upper(), {}).get('commodity_type', ''),
                part.sizes[0] if part.sizes else 0,
                part.material_class
            )

            if commodity_code not in groups:
                groups[commodity_code] = {
                    'part': part,
                    's3d_type': s3d_type,
                    'sizes': [],
                }
            groups[commodity_code]['sizes'].extend(part.sizes)

        return groups

    def _get_material_grade(self, description: str) -> int:
        """获取材料等级代码"""
        description = description.upper()

        for pattern, code in MATERIAL_GRADE_MAPPING.items():
            if pattern.upper() in description:
                if pattern == '20' and 'GB/T 8163' not in description and 'GB/T 3274' not in description:
                    continue
                return code

        return 162

    def _get_geometric_standard(self, description: str) -> int:
        """获取几何行业标准代码"""
        description = description.upper()

        for pattern, code in END_STANDARD_MAPPING.items():
            if pattern.upper() in description:
                return code

        return 4501

    def _get_schedule(self, size: float, class_name: str, unit_type: str, parser: MaterialSpecParser) -> str:
        """获取壁厚等级"""
        schedule = parser.get_schedule_for_size(class_name, size, unit_type)
        return SCHEDULE_MAPPING.get(schedule, schedule)

    def _get_branch_size(self, parser: MaterialSpecParser, class_name: str, header_size: float) -> float:
        """从分支表获取异径三通的支管尺寸"""
        branch_table = parser.branch_tables.get(class_name, [])
        if branch_table:
            for entry in branch_table:
                if entry.header_size == header_size and 'TR' in entry.branch_type.upper():
                    return entry.branch_size
            for entry in branch_table:
                if entry.header_size == header_size:
                    return entry.branch_size

        return header_size * 0.5

    def _generate_commodity_code(self, commodity_type: str, size: float, class_name: str) -> str:
        """生成商品编码 - 保证唯一性"""
        if not commodity_type:
            commodity_type = 'UNK'
        # 格式: {ShortCode}-{材料等级}-{尺寸}
        size_str = str(int(size)) if size == int(size) else str(size)
        return f"{commodity_type}-{class_name}-{size_str}"

    def get_summary(self) -> List[Dict]:
        """获取生成汇总"""
        return self.summary_data

    def get_errors(self) -> List[str]:
        """获取错误列表"""
        return self.errors

    def get_warnings(self) -> List[str]:
        """获取警告列表"""
        return self.warnings


if __name__ == '__main__':
    # 测试生成器
    spec_file = r'c:\Users\admin\Desktop\3D\0-S3D资料\1-20240321\资料\1-管道建库\Sheets\24019S3D材料建库\2-材料等级表\20260612-PIPING MATERIAL CLASS SPECIFICATIONS.xlsx'
    output_dir = r'c:\Users\admin\Desktop\3D\0-S3D资料\1-20240321\资料\1-管道建库\Sheets\s3d_generator\output_v3'

    parser = MaterialSpecParser(spec_file)
    parser.parse()

    generator = S3DDataGenerator(output_dir)
    output_files = generator.generate_all(parser, ['A01AB1'])

    print("=== 生成的文件 ===")
    for fpath, desc in output_files.items():
        print(f"{desc}: {fpath}")

    print("\n=== 汇总报告 ===")
    for item in generator.get_summary():
        print(item)

    if generator.get_errors():
        print("\n=== 错误 ===")
        for err in generator.get_errors():
            print(f"  {err}")

    if generator.get_warnings():
        print("\n=== 警告 ===")
        for warn in generator.get_warnings():
            print(f"  {warn}")
