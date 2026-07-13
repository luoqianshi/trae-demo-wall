#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
EndStandard配置对话框
按零件类型分组，用户可为每种零件类型填写对应的EndStandard值
"""

from typing import Dict, List, Optional
from PyQt5.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QTableWidget, QTableWidgetItem, QHeaderView,
    QMessageBox, QGroupBox, QScrollArea, QWidget, QGridLayout
)
from PyQt5.QtCore import Qt


class EndStandardDialog(QDialog):
    """EndStandard配置对话框"""

    def __init__(self, parts_dict: Dict[str, List], code_lookup=None, parent=None):
        super().__init__(parent)
        self.parts_dict = parts_dict
        self.code_lookup = code_lookup
        self.endstandard_map: Dict[str, str] = {}  # item_type_upper -> end_standard_value
        self._input_fields: Dict[str, QLineEdit] = {}  # item_type_upper -> QLineEdit

        self.setWindowTitle("配置EndStandard")
        self.setMinimumSize(600, 500)
        self.setup_ui()
        self.load_data()

    def setup_ui(self):
        """设置界面"""
        layout = QVBoxLayout(self)

        # 说明标签
        info_label = QLabel(
            "请为每种零件类型填写对应的EndStandard值。\n"
            "EndStandard将用于PipingCatalog中对应零件类型的所有记录。\n"
            "例如：PIPE对应PipeStock工作表，ELBOW对应90DegLRElbow工作表等。"
        )
        info_label.setStyleSheet("color: #666; padding: 5px;")
        layout.addWidget(info_label)

        # 滚动区域（零件类型较多时）
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll_content = QWidget()
        self.grid_layout = QGridLayout(scroll_content)
        scroll.setWidget(scroll_content)
        layout.addWidget(scroll)

        # 按钮区域
        btn_layout = QHBoxLayout()

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

        self.cancel_btn = QPushButton("取消")
        self.cancel_btn.clicked.connect(self.reject)

        # 自动填充按钮（从描述中查找默认值）
        self.auto_fill_btn = QPushButton("自动填充（从描述查找）")
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

        btn_layout.addWidget(self.auto_fill_btn)
        btn_layout.addStretch()
        btn_layout.addWidget(self.cancel_btn)
        btn_layout.addWidget(self.ok_btn)
        layout.addLayout(btn_layout)

    def load_data(self):
        """加载零件类型列表"""
        # 收集所有唯一的零件类型
        item_types = set()
        for class_name, class_parts in self.parts_dict.items():
            for part in class_parts:
                item_types.add(part.item_type.strip().upper())

        # 按字母顺序排序
        sorted_types = sorted(item_types)

        # 创建输入字段
        self.grid_layout.addWidget(QLabel("<b>零件类型</b>"), 0, 0)
        self.grid_layout.addWidget(QLabel("<b>EndStandard值</b>"), 0, 1)
        self.grid_layout.addWidget(QLabel("<b>示例/说明</b>"), 0, 2)

        row = 1
        for item_type in sorted_types:
            # 零件类型标签
            type_label = QLabel(item_type)
            type_label.setStyleSheet("padding: 5px;")
            self.grid_layout.addWidget(type_label, row, 0)

            # 输入框
            line_edit = QLineEdit()
            line_edit.setPlaceholderText("如: GB/T 8163, SH/T 3405, ASME B16.5...")
            line_edit.setMinimumWidth(200)
            self._input_fields[item_type] = line_edit
            self.grid_layout.addWidget(line_edit, row, 1)

            # 说明标签
            desc = self._get_type_description(item_type)
            desc_label = QLabel(desc)
            desc_label.setStyleSheet("color: #999; font-size: 11px; padding: 5px;")
            self.grid_layout.addWidget(desc_label, row, 2)

            row += 1

        # 设置列拉伸
        self.grid_layout.setColumnStretch(0, 0)
        self.grid_layout.setColumnStretch(1, 1)
        self.grid_layout.setColumnStretch(2, 2)

    def _get_type_description(self, item_type: str) -> str:
        """获取零件类型的说明"""
        type_upper = item_type.upper()
        mapping = {
            'PIPE': '对应PipeStock工作表',
            'ELBOW': '对应90DegLRElbow/90DegSRElbow/45DegElbow工作表',
            'REDUCER': '对应ConcentricReducer/EccentricReducer工作表',
            'TEE': '对应Tee/ReducingTee工作表',
            'FLANGE': '对应WeldNeckFlange/BlindFlange/SocketweldFlange工作表',
            'VALVE': '对应GateValve/GlobeValve/BallValve/CheckValve工作表',
            'GASKET': '对应SpiralWoundGasket工作表',
            'BOLT': '对应StudBolt工作表',
            'CAP': '对应Cap工作表',
            'NIPPLE': '对应PipeStock工作表',
            'COUPLING': '对应Coupling工作表',
            'UNION': '对应Union工作表',
            'PLUG': '对应Plug工作表',
            'SPECTACLE': '对应SpectacleBlind工作表',
            'WELDOLET': '对应Weldolet工作表',
        }
        for key, desc in mapping.items():
            if key in type_upper:
                return desc
        return ''

    def auto_fill(self):
        """自动从描述中查找默认值"""
        if not self.code_lookup:
            QMessageBox.warning(self, "警告", "未加载AllCodeLists，无法自动查找")
            return

        # 为每种零件类型，从其描述中提取标准号作为默认值
        type_to_standard = {}
        for class_name, class_parts in self.parts_dict.items():
            for part in class_parts:
                item_type = part.item_type.strip().upper()
                if item_type not in type_to_standard and hasattr(part, 'description_parts'):
                    standard_text = part.description_parts[0] if part.description_parts else ''
                    if standard_text:
                        type_to_standard[item_type] = standard_text

        # 填充到输入框
        filled_count = 0
        for item_type, standard in type_to_standard.items():
            if item_type in self._input_fields:
                edit = self._input_fields[item_type]
                if not edit.text().strip():  # 只填充空值
                    edit.setText(standard)
                    filled_count += 1

        QMessageBox.information(self, "自动填充", f"已为 {filled_count} 种零件类型填充默认值")

    def on_ok(self):
        """点击确定"""
        self.endstandard_map = {}
        for item_type, line_edit in self._input_fields.items():
            value = line_edit.text().strip()
            if value:
                self.endstandard_map[item_type] = value

        self.accept()

    def get_endstandard_map(self) -> Dict[str, str]:
        """获取EndStandard配置映射"""
        return self.endstandard_map
