#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
零件类型配置对话框 V2.0
- 按零件类型分组，用户可为每种零件类型填写多个字段
- 支持自动从PostgreSQL数据库查找code值填充
- 支持保存/加载用户配置
"""

import json
import os
from typing import Dict, List
from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QTableWidget, QTableWidgetItem, QHeaderView,
    QMessageBox, QScrollArea, QWidget, QGridLayout, QSlider
)
from PyQt5.QtCore import Qt


# 配置字段定义: (字段key, 显示名称, 占位符提示, 建议最小列宽)
CONFIG_FIELDS = [
    ('commodity_type_override', 'CommodityType', '如: PIPE, E90LR, TE...', 130),
    ('geometry_type_override', 'GeometryType', '如: STRAIGHT, ELBOW...', 120),
    ('symbol_definition', 'SymbolDefinition', '如: 90DegreeElbow,...', 150),
    ('geom_industry_std_override', 'GeomIndustryStd', '如: GB/T 8163, 70002...', 140),
    ('material_grade_override', 'MaterialGrade', '如: 100005, 70239...', 130),
    ('part_data_basis', 'PartDataBasis', '如: 1, 2...', 110),
    ('piping_point_basis', 'PipingPointBasis', '如: 1, 2...', 140),
    ('end_preparation_override', 'EndPreparation', '如: BW, RF, PE...', 130),
    ('end_standard', 'EndStandard', '如: 45820, GB/T 8163...', 120),
    ('flow_direction', 'FlowDirection', '如: 1, 2...', 120),
    ('face_to_center', 'FaceToCenter', '如: 1.5, 2.0...', 110),
]

# 配置文件保存路径
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'user_part_config.json')


class PartConfigDialog(QDialog):
    """零件类型配置对话框 V2.0"""

    def __init__(self, parts_dict: Dict[str, List], preset_config: Dict[str, Dict[str, str]] = None, parent=None):
        """
        :param parts_dict: 零件数据字典
        :param preset_config: 预填充的配置数据 {item_type: {field_key: value}}
        """
        super().__init__(parent)
        self.parts_dict = parts_dict
        self.preset_config = preset_config or {}
        self.config_map: Dict[str, Dict[str, str]] = {}  # item_type -> {field: value}
        self._table: QTableWidget = None

        self.setWindowTitle("配置零件类型字段")
        self.setMinimumSize(1500, 750)
        self.resize(1600, 800)
        self.setup_ui()
        self.load_data()

    def setup_ui(self):
        """设置界面"""
        layout = QVBoxLayout(self)

        # 说明标签
        info_label = QLabel(
            "请为每种零件类型填写对应的字段值。\n"
            "所有字段将用于PipingCatalog中对应零件类型的所有记录。\n"
            "留空表示使用自动查找的默认值。提示：可拖动表头边界调整列宽，可拖动行号边界调整行高。"
        )
        info_label.setStyleSheet("color: #666; padding: 5px;")
        layout.addWidget(info_label)

        # 表格
        self._table = QTableWidget()
        self._table.setColumnCount(1 + len(CONFIG_FIELDS))  # 零件类型 + 各字段
        self._table.setSelectionBehavior(QTableWidget.SelectRows)
        self._table.setAlternatingRowColors(True)

        # 设置表头
        headers = ["零件类型"]
        for field_key, display_name, placeholder, width in CONFIG_FIELDS:
            headers.append(display_name)
        self._table.setHorizontalHeaderLabels(headers)

        # 列宽设置
        self._table.horizontalHeader().setSectionResizeMode(QHeaderView.Interactive)
        self._table.horizontalHeader().setStretchLastSection(False)

        self._table.setColumnWidth(0, 160)
        font_metrics = self._table.horizontalHeader().fontMetrics()
        for col_idx, (field_key, display_name, placeholder, min_width) in enumerate(CONFIG_FIELDS, 1):
            text_width = font_metrics.horizontalAdvance(display_name) + 30
            actual_width = max(text_width, min_width)
            self._table.setColumnWidth(col_idx, actual_width)
            self._table.horizontalHeader().setMinimumSectionSize(actual_width)

        # 设置行高
        self._table.verticalHeader().setSectionResizeMode(QHeaderView.Interactive)
        self._table.verticalHeader().setDefaultSectionSize(28)

        self._table.setStyleSheet("""
            QTableWidget {
                border: 1px solid #ddd;
                gridline-color: #ddd;
            }
            QTableWidget::item {
                padding: 4px 8px;
            }
            QHeaderView::section {
                background-color: #f0f0f0;
                padding: 6px 8px;
                border: 1px solid #ddd;
                font-weight: bold;
                font-size: 12px;
            }
        """)

        layout.addWidget(self._table)

        # 按钮区域
        btn_layout = QHBoxLayout()

        self.auto_fill_btn = QPushButton("自动填充（从数据库查找code值）")
        self.auto_fill_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                font-size: 12px;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover { background-color: #1976D2; }
        """)
        self.auto_fill_btn.clicked.connect(self.auto_fill)

        self.clear_btn = QPushButton("清空所有")
        self.clear_btn.setStyleSheet("""
            QPushButton {
                background-color: #f44336;
                color: white;
                font-size: 12px;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover { background-color: #d32f2f; }
        """)
        self.clear_btn.clicked.connect(self.clear_all)

        self.cancel_btn = QPushButton("取消")
        self.cancel_btn.clicked.connect(self.reject)

        self.ok_btn = QPushButton("确定")
        self.ok_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                font-size: 12px;
                padding: 8px 20px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover { background-color: #45a049; }
        """)
        self.ok_btn.clicked.connect(self.on_ok)

        btn_layout.addWidget(self.auto_fill_btn)
        btn_layout.addWidget(self.clear_btn)
        btn_layout.addStretch()
        btn_layout.addWidget(self.cancel_btn)
        btn_layout.addWidget(self.ok_btn)
        layout.addLayout(btn_layout)

    def load_data(self):
        """加载零件类型列表到表格，并预填充上次保存的数据"""
        # 收集所有唯一的零件类型，保持零件列表中首次出现的原始顺序
        item_types = []
        for class_name, class_parts in self.parts_dict.items():
            for part in class_parts:
                item_type = part.item_type.strip().upper()
                if item_type not in item_types:
                    item_types.append(item_type)

        self._table.setRowCount(len(item_types))

        for row, item_type in enumerate(item_types):
            # 零件类型（只读）
            type_item = QTableWidgetItem(item_type)
            type_item.setFlags(type_item.flags() & ~Qt.ItemIsEditable)
            type_item.setBackground(Qt.lightGray)
            self._table.setItem(row, 0, type_item)

            # 各字段输入框
            for col_idx, (field_key, display_name, placeholder, width) in enumerate(CONFIG_FIELDS, 1):
                edit_item = QTableWidgetItem()
                edit_item.setTextAlignment(Qt.AlignCenter)
                # 预填充上次保存的数据
                preset_value = self.preset_config.get(item_type, {}).get(field_key, '')
                if preset_value:
                    edit_item.setText(str(preset_value))
                self._table.setItem(row, col_idx, edit_item)

    def auto_fill(self):
        """自动填充字段值

        查找优先级：
        1. CommodityType / SymbolDefinition 优先从对应JSON文件查找
        2. 其他字段从PostgreSQL数据库查找code值
        """
        # 加载JSON配置文件
        json_dir = os.path.dirname(os.path.abspath(__file__))
        commodity_type_json = {}
        symbol_definition_json = {}
        end_standard_json = {}
        try:
            ct_path = os.path.join(json_dir, 'CommodityType.json')
            if os.path.exists(ct_path):
                with open(ct_path, 'r', encoding='utf-8') as f:
                    commodity_type_json = json.load(f)
        except Exception as e:
            print(f"[警告] 加载CommodityType.json失败: {e}")
        try:
            sd_path = os.path.join(json_dir, 'SymbolDefinition.json')
            if os.path.exists(sd_path):
                with open(sd_path, 'r', encoding='utf-8') as f:
                    symbol_definition_json = json.load(f)
        except Exception as e:
            print(f"[警告] 加载SymbolDefinition.json失败: {e}")
        try:
            es_path = os.path.join(json_dir, 'EndStandard.json')
            if os.path.exists(es_path):
                with open(es_path, 'r', encoding='utf-8') as f:
                    end_standard_json = json.load(f)
        except Exception as e:
            print(f"[警告] 加载EndStandard.json失败: {e}")

        # 初始化数据库查找引擎（JSON未覆盖的字段使用数据库查找）
        lookup = None
        try:
            from code_lookup import AllCodeListsLookup
            lookup = AllCodeListsLookup()
        except Exception as e:
            print(f"[警告] 连接数据库失败: {e}")

        if lookup and not lookup._cache:
            QMessageBox.warning(self, "警告", "数据库中未加载到代码数据，请确认s3d_codelists数据库中已导入AllCodeLists数据")
            return

        filled = 0

        # 为每种零件类型，从其描述中提取信息
        type_to_info = {}
        for class_name, class_parts in self.parts_dict.items():
            for part in class_parts:
                item_type = part.item_type.strip().upper()
                if item_type not in type_to_info and hasattr(part, 'description_parts'):
                    type_to_info[item_type] = {
                        'standard': part.description_parts[0] if len(part.description_parts) > 0 else '',
                        'material': part.description_parts[1] if len(part.description_parts) > 1 else '',
                        'end_prep': part.description_parts[2] if len(part.description_parts) > 2 else part.ends,
                        'size_std': part.description_parts[3] if len(part.description_parts) > 3 else '',
                        'pipe_type': part.description_parts[4] if len(part.description_parts) > 4 else '',
                        'ends': part.ends if hasattr(part, 'ends') else '',
                    }

        for row in range(self._table.rowCount()):
            item_type = self._table.item(row, 0).text()
            info = type_to_info.get(item_type, {})

            for col_idx, (field_key, _, _, _) in enumerate(CONFIG_FIELDS, 1):
                cell = self._table.item(row, col_idx)
                if cell and not cell.text().strip():
                    value = ''

                    if field_key == 'commodity_type_override':
                        # 优先从 CommodityType.json 查找
                        ct_data = commodity_type_json.get(item_type, {})
                        if ct_data and 'commodity_type_override' in ct_data:
                            value = ct_data['commodity_type_override']
                        elif lookup:
                            # JSON中未找到，从数据库查找 PipingCommodityType
                            ct = lookup.find_commodity_type(item_type)
                            value = ct if ct else ''

                    elif field_key == 'symbol_definition':
                        # 优先从 SymbolDefinition.json 查找
                        sd_data = symbol_definition_json.get(item_type, {})
                        if sd_data and 'symbol_definition' in sd_data:
                            value = sd_data['symbol_definition']
                        elif lookup:
                            # JSON中未找到，从数据库查找 SymbolDefinition
                            # 注意：数据库中可能没有SymbolDefinition表，保持为空
                            pass

                    elif field_key == 'geom_industry_std_override' and info.get('standard'):
                        # 国标/行业标准 -> 查 GeometricIndustryStandard -> code值
                        if lookup:
                            code = lookup.find_geometric_industry_standard(info['standard'])
                            value = str(code) if code else ''

                    elif field_key == 'material_grade_override':
                        # MaterialGrade 默认值直接填1，不再从数据库查找
                        value = '1'

                    elif field_key == 'end_standard':
                        # 优先从 EndStandard.json 查找
                        es_data = end_standard_json.get(item_type, {})
                        if es_data and 'end_standard' in es_data:
                            value = es_data['end_standard']
                        elif info.get('standard') and lookup:
                            # JSON中未找到，从数据库查找 GeometricIndustryStandard
                            code = lookup.find_geometric_industry_standard(info['standard'])
                            value = str(code) if code else ''

                    elif field_key == 'end_preparation_override' and info.get('end_prep'):
                        # 端部形式 -> 查 EndPreparation -> code值
                        if lookup:
                            ep = lookup.find_end_preparation(info['end_prep'])
                            value = str(ep) if ep else ''

                    elif field_key == 'geometry_type_override':
                        # item_type -> 查 GeometryType -> code值
                        if lookup:
                            code = lookup.find_geometry_type(item_type)
                            value = str(code) if code else ''

                    if value:
                        cell.setText(value)
                        filled += 1

        # 显示查找错误
        if lookup and lookup.errors.has_errors():
            error_msg = lookup.errors.get_summary()
            print(f"[自动填充错误]\n{error_msg}")

        QMessageBox.information(self, "自动填充",
                                f"已自动填充 {filled} 个字段值")

    def clear_all(self):
        """清空所有输入"""
        reply = QMessageBox.question(self, "确认", "确定要清空所有已填写的值吗？",
                                     QMessageBox.Yes | QMessageBox.No)
        if reply == QMessageBox.Yes:
            for row in range(self._table.rowCount()):
                for col_idx in range(1, self._table.columnCount()):
                    cell = self._table.item(row, col_idx)
                    if cell:
                        cell.setText('')

    def on_ok(self):
        """点击确定，收集所有配置并保存"""
        self.config_map = {}
        for row in range(self._table.rowCount()):
            item_type = self._table.item(row, 0).text()
            row_config = {}
            for col_idx, (field_key, _, _, _) in enumerate(CONFIG_FIELDS, 1):
                cell = self._table.item(row, col_idx)
                if cell:
                    value = cell.text().strip()
                    if value:
                        row_config[field_key] = value
            if row_config:
                self.config_map[item_type] = row_config

        # 保存到配置文件
        self.save_config(self.config_map)
        self.accept()

    def get_config_map(self) -> Dict[str, Dict[str, str]]:
        """获取配置映射"""
        return self.config_map

    @staticmethod
    def load_saved_config() -> Dict[str, Dict[str, str]]:
        """从配置文件加载上次保存的配置"""
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[警告] 加载配置文件失败: {e}")
        return {}

    @staticmethod
    def save_config(config_map: Dict[str, Dict[str, str]]):
        """保存配置到文件"""
        try:
            with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                json.dump(config_map, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[警告] 保存配置文件失败: {e}")
