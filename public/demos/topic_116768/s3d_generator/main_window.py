"""
S3D建库数据生成器 - PyQt桌面应用主窗口 V3.0
根据V3.0要求重构UI，移除模板目录选择，使用内置模板
"""

import sys
import os
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QLineEdit, QFileDialog,
    QTableWidget, QTableWidgetItem, QProgressBar,
    QTextEdit, QMessageBox, QGroupBox, QSplitter,
    QHeaderView, QComboBox, QTabWidget, QStatusBar,
    QCheckBox, QListWidget, QListWidgetItem, QDialog,
    QDialogButtonBox, QGridLayout
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from PyQt5.QtGui import QFont, QIcon

from material_spec_parser import MaterialSpecParser
from s3d_data_generator import S3DDataGenerator
from code_lookup import AllCodeListsLookup
from config import OUTPUT_DIR, OUTPUT_FILES
from part_config_dialog import PartConfigDialog, CONFIG_FIELDS


class GenerateWorker(QThread):
    """后台生成工作线程"""
    progress_signal = pyqtSignal(int, str)
    finished_signal = pyqtSignal(bool, str, dict)
    log_signal = pyqtSignal(str)

    def __init__(self, spec_file: str, output_dir: str,
                 selected_classes: list,
                 part_config_map: dict = None):
        super().__init__()
        self.spec_file = spec_file
        self.output_dir = output_dir
        self.selected_classes = selected_classes
        self.part_config_map = part_config_map or {}

    def run(self):
        try:
            self.progress_signal.emit(10, "正在解析材料等级表...")
            self.log_signal.emit("开始解析材料等级表...")

            # 解析材料等级表
            parser = MaterialSpecParser(self.spec_file)
            result = parser.parse()

            # 应用用户配置的字段值
            if self.part_config_map:
                total_fields = 0
                for class_name, class_parts in parser.parts.items():
                    for part in class_parts:
                        item_type_upper = part.item_type.strip().upper()
                        if item_type_upper in self.part_config_map:
                            for field_key, value in self.part_config_map[item_type_upper].items():
                                if hasattr(part, field_key):
                                    setattr(part, field_key, value)
                                    total_fields += 1
                self.log_signal.emit(f"应用零件字段配置: {len(self.part_config_map)} 种类型, {total_fields} 个字段")

            self.progress_signal.emit(30, "正在初始化代码查找引擎...")
            self.log_signal.emit("初始化AllCodeLists代码查找引擎...")

            # 生成S3D数据（使用内置模板，代码查询从PostgreSQL数据库自动进行）
            generator = S3DDataGenerator(self.output_dir)

            self.progress_signal.emit(50, "正在生成PipingCatalog和SPC数据...")
            self.log_signal.emit("开始生成S3D数据文件（使用内置模板）...")

            output_files = generator.generate_all(parser, self.selected_classes)

            self.progress_signal.emit(90, "正在生成汇总报告...")
            self.log_signal.emit("生成汇总报告...")

            # 输出警告和错误
            for warning in generator.get_warnings():
                self.log_signal.emit(f"[警告] {warning}")

            for error in generator.get_errors():
                self.log_signal.emit(f"[错误] {error}")

            self.progress_signal.emit(100, "生成完成!")
            self.log_signal.emit("生成完成!")

            self.finished_signal.emit(True, "数据生成成功!", output_files)

        except Exception as e:
            self.log_signal.emit(f"[错误] {str(e)}")
            self.finished_signal.emit(False, str(e), {})


class MainWindow(QMainWindow):
    """主窗口 V3.0 - 无需模板目录选择"""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("S3D建库数据自动生成软件 V3.0")
        self.setGeometry(100, 100, 1400, 900)

        # 文件路径
        self.spec_file = ""
        self.output_dir = OUTPUT_DIR

        # 数据
        self.parser = None
        self.material_classes = []
        self.code_lookup = None

        self.init_ui()

    def init_ui(self):
        """初始化UI"""
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)
        main_layout.setSpacing(10)
        main_layout.setContentsMargins(10, 10, 10, 10)

        # === 文件配置区域 ===
        file_group = QGroupBox("文件配置")
        file_layout = QGridLayout(file_group)

        # 材料等级表
        file_layout.addWidget(QLabel("材料等级表:"), 0, 0)
        self.spec_file_edit = QLineEdit()
        self.spec_file_edit.setPlaceholderText("请选择材料等级表Excel文件...")
        self.spec_file_edit.setReadOnly(True)
        file_layout.addWidget(self.spec_file_edit, 0, 1)
        spec_browse_btn = QPushButton("浏览...")
        spec_browse_btn.clicked.connect(self.browse_spec_file)
        file_layout.addWidget(spec_browse_btn, 0, 2)

        # 输出目录
        file_layout.addWidget(QLabel("输出目录:"), 1, 0)
        self.output_dir_edit = QLineEdit()
        self.output_dir_edit.setText(self.output_dir)
        self.output_dir_edit.setReadOnly(True)
        file_layout.addWidget(self.output_dir_edit, 1, 1)
        output_browse_btn = QPushButton("浏览...")
        output_browse_btn.clicked.connect(self.browse_output_dir)
        file_layout.addWidget(output_browse_btn, 1, 2)

        # 说明标签
        note_label = QLabel("提示: 本软件使用内置模板字段定义，代码查询从PostgreSQL数据库自动进行")
        note_label.setStyleSheet("color: #666; font-style: italic;")
        file_layout.addWidget(note_label, 2, 0, 1, 3)

        main_layout.addWidget(file_group)

        # === 操作区域 ===
        operation_layout = QHBoxLayout()

        self.parse_btn = QPushButton("解析材料等级表")
        self.parse_btn.setStyleSheet("""
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
        self.parse_btn.clicked.connect(self.parse_spec)
        operation_layout.addWidget(self.parse_btn)

        self.config_btn = QPushButton("配置零件字段")
        self.config_btn.setEnabled(False)
        self.config_btn.setStyleSheet("""
            QPushButton {
                background-color: #FF9800;
                color: white;
                font-size: 12px;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover { background-color: #F57C00; }
            QPushButton:disabled { background-color: #cccccc; }
        """)
        self.config_btn.clicked.connect(self.open_part_config_dialog)
        operation_layout.addWidget(self.config_btn)

        self.generate_btn = QPushButton("生成S3D数据")
        self.generate_btn.setEnabled(False)
        self.generate_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                font-size: 12px;
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
            }
            QPushButton:hover { background-color: #45a049; }
            QPushButton:disabled { background-color: #cccccc; }
        """)
        self.generate_btn.clicked.connect(self.generate_data)
        operation_layout.addWidget(self.generate_btn)

        self.preview_btn = QPushButton("预览数据")
        self.preview_btn.setEnabled(False)
        self.preview_btn.clicked.connect(self.preview_data)
        operation_layout.addWidget(self.preview_btn)

        operation_layout.addStretch()

        main_layout.addLayout(operation_layout)

        # === 分割器 ===
        splitter = QSplitter(Qt.Vertical)

        # === 材料等级选择区域 ===
        class_widget = QWidget()
        class_layout = QVBoxLayout(class_widget)
        class_layout.setContentsMargins(0, 0, 0, 0)

        # 标签和按钮行
        class_header_layout = QHBoxLayout()
        class_label = QLabel("材料等级列表（请选择要生成的材料等级）")
        class_label.setFont(QFont("Microsoft YaHei", 10, QFont.Bold))
        class_header_layout.addWidget(class_label)

        # 添加全选/全不选按钮
        self.select_all_btn = QPushButton("全选")
        self.select_all_btn.setMaximumWidth(60)
        self.select_all_btn.clicked.connect(self.select_all_classes)
        class_header_layout.addWidget(self.select_all_btn)

        self.deselect_all_btn = QPushButton("全不选")
        self.deselect_all_btn.setMaximumWidth(60)
        self.deselect_all_btn.clicked.connect(self.deselect_all_classes)
        class_header_layout.addWidget(self.deselect_all_btn)

        class_layout.addLayout(class_header_layout)

        self.class_list = QListWidget()
        self.class_list.setSelectionMode(QListWidget.MultiSelection)
        self.class_list.setMaximumHeight(150)
        class_layout.addWidget(self.class_list)

        splitter.addWidget(class_widget)

        # === 材料等级信息表格 ===
        info_widget = QWidget()
        info_layout = QVBoxLayout(info_widget)
        info_layout.setContentsMargins(0, 0, 0, 0)

        info_label = QLabel("材料等级详细信息")
        info_label.setFont(QFont("Microsoft YaHei", 10, QFont.Bold))
        info_layout.addWidget(info_label)

        self.info_table = QTableWidget()
        self.info_table.setColumnCount(9)
        self.info_table.setHorizontalHeaderLabels([
            "材料等级", "服务介质", "设计温度", "设计压力",
            "管材材料", "压力等级", "密封面", "阀体材料", "腐蚀余量"
        ])
        self.info_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        info_layout.addWidget(self.info_table)

        splitter.addWidget(info_widget)

        # === 零件列表区域 ===
        parts_widget = QWidget()
        parts_layout = QVBoxLayout(parts_widget)
        parts_layout.setContentsMargins(0, 0, 0, 0)

        parts_label = QLabel("零件列表")
        parts_label.setFont(QFont("Microsoft YaHei", 10, QFont.Bold))
        parts_layout.addWidget(parts_label)

        self.parts_table = QTableWidget()
        self.parts_table.setColumnCount(11)
        self.parts_table.setHorizontalHeaderLabels([
            "材料等级", "零件类型", "尺寸范围", "单位", "压力等级",
            "端部", "国标 / 行业标准", "材质", "尺寸规范标准", "管型", "COMM.CODE"
        ])
        self.parts_table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        parts_layout.addWidget(self.parts_table)

        splitter.addWidget(parts_widget)

        # === 日志区域 ===
        log_widget = QWidget()
        log_layout = QVBoxLayout(log_widget)
        log_layout.setContentsMargins(0, 0, 0, 0)

        log_label = QLabel("操作日志")
        log_label.setFont(QFont("Microsoft YaHei", 10, QFont.Bold))
        log_layout.addWidget(log_label)

        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        log_layout.addWidget(self.log_text)

        splitter.addWidget(log_widget)
        splitter.setSizes([120, 200, 250, 200])

        main_layout.addWidget(splitter, 1)

        # === 进度条 ===
        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        main_layout.addWidget(self.progress_bar)

        # === 状态栏 ===
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("就绪")

    def browse_spec_file(self):
        """浏览材料等级表文件"""
        file_path, _ = QFileDialog.getOpenFileName(
            self, "选择材料等级表", "",
            "Excel Files (*.xlsx *.xls);;All Files (*)"
        )
        if file_path:
            self.spec_file = file_path
            self.spec_file_edit.setText(file_path)
            self.log(f"已选择材料等级表: {file_path}")



    def browse_output_dir(self):
        """浏览输出目录"""
        dir_path = QFileDialog.getExistingDirectory(self, "选择输出目录", self.output_dir)
        if dir_path:
            self.output_dir = dir_path
            self.output_dir_edit.setText(dir_path)
            self.log(f"已设置输出目录: {dir_path}")

    def parse_spec(self):
        """解析材料等级表"""
        if not self.spec_file:
            QMessageBox.warning(self, "警告", "请先选择材料等级表文件!")
            return

        try:
            self.log("开始解析材料等级表...")
            self.status_bar.showMessage("正在解析...")

            self.parser = MaterialSpecParser(self.spec_file)
            result = self.parser.parse()

            self.material_classes = list(result['material_classes'].keys())

            # 更新材料等级列表
            self.update_class_list(result['material_classes'])

            # 更新信息表格
            self.update_info_table(result['material_classes'])

            # 更新零件表格
            self.update_parts_table(result['parts'])

            self.generate_btn.setEnabled(True)
            self.preview_btn.setEnabled(True)
            self.config_btn.setEnabled(True)

            self.log(f"解析完成! 发现 {len(self.material_classes)} 个材料等级")
            self.status_bar.showMessage(f"解析完成: {len(self.material_classes)} 个材料等级")

        except Exception as e:
            QMessageBox.critical(self, "错误", f"解析失败: {str(e)}")
            self.log(f"解析失败: {str(e)}")
            self.status_bar.showMessage("解析失败")

    def update_class_list(self, material_classes: dict):
        """更新材料等级列表"""
        self.class_list.clear()
        for name in sorted(material_classes.keys()):
            item = QListWidgetItem(name)
            item.setFlags(item.flags() | Qt.ItemIsUserCheckable)
            item.setCheckState(Qt.Checked)
            self.class_list.addItem(item)

    def select_all_classes(self):
        """全选所有材料等级"""
        for i in range(self.class_list.count()):
            item = self.class_list.item(i)
            item.setCheckState(Qt.Checked)
        self.log("已全选所有材料等级")

    def deselect_all_classes(self):
        """取消选择所有材料等级"""
        for i in range(self.class_list.count()):
            item = self.class_list.item(i)
            item.setCheckState(Qt.Unchecked)
        self.log("已取消选择所有材料等级")

    def update_info_table(self, material_classes: dict):
        """更新材料等级信息表格"""
        self.info_table.setRowCount(len(material_classes))

        for row, (name, info) in enumerate(sorted(material_classes.items())):
            self.info_table.setItem(row, 0, QTableWidgetItem(name))
            self.info_table.setItem(row, 1, QTableWidgetItem(info.service))
            self.info_table.setItem(row, 2, QTableWidgetItem(str(info.design_temp) if info.design_temp else ''))
            self.info_table.setItem(row, 3, QTableWidgetItem(str(info.design_pressure) if info.design_pressure else ''))
            self.info_table.setItem(row, 4, QTableWidgetItem(info.piping_material))
            self.info_table.setItem(row, 5, QTableWidgetItem(info.flange_rating))
            self.info_table.setItem(row, 6, QTableWidgetItem(info.flange_face))
            self.info_table.setItem(row, 7, QTableWidgetItem(info.valve_body_material))
            self.info_table.setItem(row, 8, QTableWidgetItem(str(info.corrosion_allowance)))

    def update_parts_table(self, parts: dict):
        """更新零件表格 - 按逗号分解描述信息到多列"""
        all_parts = []
        for class_name, class_parts in parts.items():
            for part in class_parts:
                all_parts.append((class_name, part))

        self.parts_table.setRowCount(len(all_parts))

        for row, (class_name, part) in enumerate(all_parts):
            self.parts_table.setItem(row, 0, QTableWidgetItem(class_name))
            self.parts_table.setItem(row, 1, QTableWidgetItem(part.item_type))
            self.parts_table.setItem(row, 2, QTableWidgetItem(part.size_range))
            self.parts_table.setItem(row, 3, QTableWidgetItem(part.npd_unit_type))
            self.parts_table.setItem(row, 4, QTableWidgetItem(part.rating))
            self.parts_table.setItem(row, 5, QTableWidgetItem(part.ends))

            # 智能分解描述信息到4个展示字段（跳过端部形式）
            desc_parts = part.description_parts if hasattr(part, 'description_parts') and len(part.description_parts) >= 5 else ['', '', '', '', '']
            # desc_parts: [0]国标/行业标准, [1]材质, [2]端部形式(跳过), [3]尺寸规范标准, [4]管型
            display_fields = [desc_parts[0], desc_parts[1], desc_parts[3], desc_parts[4]]
            for col_idx, val in enumerate(display_fields):
                self.parts_table.setItem(row, 6 + col_idx, QTableWidgetItem(val))

            # COMM.CODE 列
            self.parts_table.setItem(row, 10, QTableWidgetItem(part.commodity_code))

    def open_part_config_dialog(self):
        """打开零件字段配置对话框（自动加载上次保存的数据）"""
        if not self.parser or not self.parser.parts:
            QMessageBox.warning(self, "警告", "请先解析材料等级表!")
            return

        # 加载上次保存的配置
        preset_config = PartConfigDialog.load_saved_config()
        if preset_config:
            self.log(f"已加载上次保存的零件字段配置")

        dialog = PartConfigDialog(self.parser.parts, preset_config, self)
        if dialog.exec_() == QDialog.Accepted:
            # 保存用户配置的字段值到每个零件
            config_map = dialog.get_config_map()
            field_count = 0
            for class_name, class_parts in self.parser.parts.items():
                for part in class_parts:
                    item_type_upper = part.item_type.strip().upper()
                    if item_type_upper in config_map:
                        for field_key, value in config_map[item_type_upper].items():
                            if hasattr(part, field_key):
                                setattr(part, field_key, value)
                                field_count += 1
            self.log_text.append(f"零件字段配置已保存，共 {field_count} 个字段")

    def generate_data(self):
        """生成S3D数据"""
        if not self.parser:
            QMessageBox.warning(self, "警告", "请先解析材料等级表!")
            return

        if not self.output_dir:
            QMessageBox.warning(self, "警告", "请设置输出目录!")
            return

        # 获取选中的材料等级
        selected_classes = []
        for i in range(self.class_list.count()):
            item = self.class_list.item(i)
            if item.checkState() == Qt.Checked:
                selected_classes.append(item.text())

        if not selected_classes:
            QMessageBox.warning(self, "警告", "请至少选择一个材料等级!")
            return

        # 确认生成
        reply = QMessageBox.question(
            self, "确认生成",
            f"将为以下 {len(selected_classes)} 个材料等级生成S3D数据:\n"
            f"{', '.join(selected_classes)}\n\n是否继续?",
            QMessageBox.Yes | QMessageBox.No
        )

        if reply == QMessageBox.No:
            return

        # 禁用按钮
        self.generate_btn.setEnabled(False)
        self.parse_btn.setEnabled(False)
        self.progress_bar.setVisible(True)
        self.progress_bar.setValue(0)

        # 收集用户配置的所有字段值
        part_config_map = {}
        if self.parser and self.parser.parts:
            for class_name, class_parts in self.parser.parts.items():
                for part in class_parts:
                    item_type_upper = part.item_type.strip().upper()
                    if item_type_upper not in part_config_map:
                        part_config_map[item_type_upper] = {}
                    for field_key, _, _, _ in CONFIG_FIELDS:
                        if hasattr(part, field_key):
                            value = getattr(part, field_key)
                            if value and str(value).strip():
                                part_config_map[item_type_upper][field_key] = str(value).strip()

        # 启动后台线程
        self.worker = GenerateWorker(
            self.spec_file, self.output_dir,
            selected_classes,
            part_config_map
        )
        self.worker.progress_signal.connect(self.update_progress)
        self.worker.finished_signal.connect(self.generation_finished)
        self.worker.log_signal.connect(self.log)
        self.worker.start()

    def update_progress(self, value: int, message: str):
        """更新进度"""
        self.progress_bar.setValue(value)
        self.status_bar.showMessage(message)

    def generation_finished(self, success: bool, message: str, output_files: dict):
        """生成完成回调"""
        self.generate_btn.setEnabled(True)
        self.parse_btn.setEnabled(True)
        self.progress_bar.setVisible(False)

        if success:
            self.log("=" * 50)
            self.log("生成完成!")
            self.log(f"输出目录: {self.output_dir}")
            self.log("生成的文件:")
            for fpath, desc in output_files.items():
                self.log(f"  {desc}: {os.path.basename(fpath)}")
            self.log("=" * 50)

            detail_msg = f"S3D数据生成成功!\n\n输出目录: {self.output_dir}\n\n"
            detail_msg += f"共生成 {len(output_files)} 个文件\n"

            QMessageBox.information(self, "完成", detail_msg)
            self.status_bar.showMessage("生成完成")
        else:
            QMessageBox.critical(self, "错误", f"生成失败: {message}")
            self.log(f"生成失败: {message}")
            self.status_bar.showMessage("生成失败")

    def preview_data(self):
        """预览数据"""
        if not self.parser:
            return

        dialog = QDialog(self)
        dialog.setWindowTitle("数据预览")
        dialog.setGeometry(150, 150, 1200, 700)

        layout = QVBoxLayout(dialog)

        tab_widget = QTabWidget()

        # 材料等级页
        class_tab = QWidget()
        class_layout = QVBoxLayout(class_tab)
        class_preview = QTableWidget()
        class_preview.setColumnCount(9)
        class_preview.setHorizontalHeaderLabels([
            "材料等级", "服务介质", "设计温度", "设计压力",
            "管材材料", "压力等级", "密封面", "阀体材料", "腐蚀余量"
        ])

        if self.parser:
            classes = self.parser.material_classes
            class_preview.setRowCount(len(classes))
            for row, (name, info) in enumerate(sorted(classes.items())):
                class_preview.setItem(row, 0, QTableWidgetItem(name))
                class_preview.setItem(row, 1, QTableWidgetItem(info.service))
                class_preview.setItem(row, 2, QTableWidgetItem(str(info.design_temp) if info.design_temp else ''))
                class_preview.setItem(row, 3, QTableWidgetItem(str(info.design_pressure) if info.design_pressure else ''))
                class_preview.setItem(row, 4, QTableWidgetItem(info.piping_material))
                class_preview.setItem(row, 5, QTableWidgetItem(info.flange_rating))
                class_preview.setItem(row, 6, QTableWidgetItem(info.flange_face))
                class_preview.setItem(row, 7, QTableWidgetItem(info.valve_body_material))
                class_preview.setItem(row, 8, QTableWidgetItem(str(info.corrosion_allowance)))

        class_layout.addWidget(class_preview)
        tab_widget.addTab(class_tab, "材料等级")

        # 零件统计页
        stats_tab = QWidget()
        stats_layout = QVBoxLayout(stats_tab)
        stats_text = QTextEdit()
        stats_text.setReadOnly(True)

        if self.parser:
            stats = []
            for class_name, parts in sorted(self.parser.parts.items()):
                stats.append(f"材料等级: {class_name}")
                stats.append(f"  零件数量: {len(parts)}")
                part_types = {}
                for part in parts:
                    part_types[part.item_type] = part_types.get(part.item_type, 0) + 1
                for ptype, count in sorted(part_types.items()):
                    stats.append(f"    {ptype}: {count}")
                stats.append("")

            stats_text.setText("\n".join(stats))

        stats_layout.addWidget(stats_text)
        tab_widget.addTab(stats_tab, "零件统计")

        # 尺寸表页
        size_tab = QWidget()
        size_layout = QVBoxLayout(size_tab)
        size_text = QTextEdit()
        size_text.setReadOnly(True)

        if self.parser:
            size_info = []
            for class_name, size_table in sorted(self.parser.size_tables.items()):
                size_info.append(f"材料等级: {class_name}")
                for entry in size_table:
                    size_info.append(f"  NPD: {entry.npd} {entry.npd_unit_type} -> {entry.schedule}")
                size_info.append("")

            size_text.setText("\n".join(size_info))

        size_layout.addWidget(size_text)
        tab_widget.addTab(size_tab, "尺寸表")

        layout.addWidget(tab_widget)

        close_btn = QPushButton("关闭")
        close_btn.clicked.connect(dialog.close)
        layout.addWidget(close_btn)

        dialog.exec_()

    def log(self, message: str):
        """添加日志"""
        from datetime import datetime
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.log_text.append(f"[{timestamp}] {message}")


def main():
    """主函数"""
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    font = QFont("Microsoft YaHei", 9)
    app.setFont(font)

    window = MainWindow()
    window.show()

    sys.exit(app.exec_())


if __name__ == '__main__':
    main()
