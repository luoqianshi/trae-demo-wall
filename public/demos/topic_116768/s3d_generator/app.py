#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
S3D建库数据自动生成软件 - Web版本 (Flask后端)
V1.0 - 基于原有PyQt业务逻辑，提供REST API和HTML界面
"""

import os
import sys
import json
import shutil
import traceback
from datetime import datetime
from functools import wraps
from pathlib import Path

from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

# 导入原有业务模块
from material_spec_parser import MaterialSpecParser, PartItem, MaterialClassInfo
from s3d_data_generator import S3DDataGenerator
from code_lookup import AllCodeListsLookup
from config import OUTPUT_DIR, OUTPUT_FILES

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB

# 全局状态
app_state = {
    'spec_file': None,
    'output_dir': OUTPUT_DIR,
    'parser': None,
    'material_classes': [],
    'part_config_map': {},
    'logs': []
}

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# =============================================================================
# 辅助函数
# =============================================================================

def log_message(msg):
    """记录日志"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    entry = f"[{timestamp}] {msg}"
    app_state['logs'].append(entry)
    print(entry)
    return entry

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'xlsx', 'xls'}

def part_item_to_dict(part):
    """将PartItem转换为字典"""
    return {
        'item_type': part.item_type,
        'size_range': part.size_range,
        'rating': part.rating,
        'ends': part.ends,
        'description': part.description,
        'commodity_code': part.commodity_code,
        'notes': part.notes,
        'sizes': part.sizes,
        'npd_unit_type': part.npd_unit_type,
        'description_parts': part.description_parts,
        'commodity_type_override': part.commodity_type_override,
        'geometry_type_override': part.geometry_type_override,
        'symbol_definition': part.symbol_definition,
        'geom_industry_std_override': part.geom_industry_std_override,
        'material_grade_override': part.material_grade_override,
        'part_data_basis': part.part_data_basis,
        'piping_point_basis': part.piping_point_basis,
        'end_preparation_override': part.end_preparation_override,
        'end_standard': part.end_standard,
        'flow_direction': part.flow_direction,
        'face_to_center': part.face_to_center,
    }

def class_info_to_dict(info):
    """将MaterialClassInfo转换为字典"""
    return {
        'class_name': info.class_name,
        'service': info.service,
        'design_temp': info.design_temp,
        'design_pressure': info.design_pressure,
        'piping_material': info.piping_material,
        'flange_rating': info.flange_rating,
        'flange_face': info.flange_face,
        'valve_body_material': info.valve_body_material,
        'corrosion_allowance': info.corrosion_allowance,
        'design_standard': info.design_standard,
    }

# =============================================================================
# 页面路由
# =============================================================================

@app.route('/')
def index():
    """主页面"""
    return render_template('index.html')

# =============================================================================
# API路由 - 文件与解析
# =============================================================================

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """上传材料等级表文件"""
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': '未选择文件'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': '未选择文件'})

    if not allowed_file(file.filename):
        return jsonify({'success': False, 'message': '仅支持 .xlsx 和 .xls 文件'})

    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        app_state['spec_file'] = filepath
        log_message(f"已上传材料等级表: {filename}")

        return jsonify({'success': True, 'message': f'上传成功: {filename}', 'filename': filename})
    except Exception as e:
        log_message(f"上传失败: {str(e)}")
        return jsonify({'success': False, 'message': f'上传失败: {str(e)}'})


@app.route('/api/parse', methods=['POST'])
def parse_spec():
    """解析材料等级表"""
    if not app_state['spec_file']:
        return jsonify({'success': False, 'message': '请先上传材料等级表'})

    try:
        log_message("开始解析材料等级表...")
        parser = MaterialSpecParser(app_state['spec_file'])
        result = parser.parse()

        app_state['parser'] = parser
        app_state['material_classes'] = list(result['material_classes'].keys())

        # 构建响应数据
        classes_data = {}
        for name, info in result['material_classes'].items():
            classes_data[name] = class_info_to_dict(info)

        parts_data = {}
        for class_name, class_parts in result['parts'].items():
            parts_data[class_name] = [part_item_to_dict(p) for p in class_parts]

        log_message(f"解析完成! 发现 {len(classes_data)} 个材料等级")

        return jsonify({
            'success': True,
            'message': f'解析完成: {len(classes_data)} 个材料等级',
            'classes': classes_data,
            'parts': parts_data,
        })
    except Exception as e:
        traceback_str = traceback.format_exc()
        log_message(f"解析失败: {str(e)}")
        print(traceback_str)
        return jsonify({'success': False, 'message': f'解析失败: {str(e)}', 'traceback': traceback_str})


# =============================================================================
# API路由 - 配置
# =============================================================================

@app.route('/api/config/autofill', methods=['POST'])
def autofill_config():
    """自动填充零件配置"""
    data = request.get_json()
    parts_dict = data.get('parts', {})

    if not parts_dict:
        return jsonify({'success': False, 'message': '无零件数据'})

    try:
        # 加载JSON配置文件
        json_dir = os.path.dirname(os.path.abspath(__file__))
        commodity_type_json = {}
        symbol_definition_json = {}
        end_standard_json = {}

        for name, default in [('CommodityType.json', {}), ('SymbolDefinition.json', {}), ('EndStandard.json', {})]:
            path = os.path.join(json_dir, name)
            if os.path.exists(path):
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        default = json.load(f)
                except Exception:
                    pass
            if name == 'CommodityType.json':
                commodity_type_json = default
            elif name == 'SymbolDefinition.json':
                symbol_definition_json = default
            elif name == 'EndStandard.json':
                end_standard_json = default

        # 初始化数据库查找
        lookup = None
        try:
            lookup = AllCodeListsLookup()
        except Exception as e:
            log_message(f"[警告] 数据库连接失败: {e}")

        # 收集零件类型信息
        type_to_info = {}
        for class_name, class_parts in parts_dict.items():
            for part in class_parts:
                item_type = part.get('item_type', '').strip().upper()
                if item_type and item_type not in type_to_info:
                    dp = part.get('description_parts', ['', '', '', '', ''])
                    type_to_info[item_type] = {
                        'standard': dp[0] if len(dp) > 0 else '',
                        'material': dp[1] if len(dp) > 1 else '',
                        'end_prep': dp[2] if len(dp) > 2 else part.get('ends', ''),
                        'size_std': dp[3] if len(dp) > 3 else '',
                        'pipe_type': dp[4] if len(dp) > 4 else '',
                        'ends': part.get('ends', ''),
                    }

        config_map = {}
        config_fields = [
            'commodity_type_override', 'geometry_type_override', 'symbol_definition',
            'geom_industry_std_override', 'material_grade_override', 'part_data_basis',
            'piping_point_basis', 'end_preparation_override', 'end_standard',
            'flow_direction', 'face_to_center'
        ]

        for item_type, info in type_to_info.items():
            row_config = {}

            # CommodityType - 优先从JSON
            ct_data = commodity_type_json.get(item_type, {})
            if ct_data and 'commodity_type_override' in ct_data:
                row_config['commodity_type_override'] = ct_data['commodity_type_override']
            elif lookup:
                ct = lookup.find_commodity_type(item_type)
                if ct:
                    row_config['commodity_type_override'] = ct

            # SymbolDefinition - 优先从JSON
            sd_data = symbol_definition_json.get(item_type, {})
            if sd_data and 'symbol_definition' in sd_data:
                row_config['symbol_definition'] = sd_data['symbol_definition']

            # EndStandard - 优先从JSON
            es_data = end_standard_json.get(item_type, {})
            if es_data and 'end_standard' in es_data:
                row_config['end_standard'] = es_data['end_standard']
            elif info.get('standard') and lookup:
                code = lookup.find_geometric_industry_standard(info['standard'])
                if code:
                    row_config['end_standard'] = str(code)

            # MaterialGrade - 默认1
            row_config['material_grade_override'] = '1'

            # GeomIndustryStd
            if info.get('standard') and lookup:
                code = lookup.find_geometric_industry_standard(info['standard'])
                if code:
                    row_config['geom_industry_std_override'] = str(code)

            # EndPreparation
            if info.get('end_prep') and lookup:
                ep = lookup.find_end_preparation(info['end_prep'])
                if ep:
                    row_config['end_preparation_override'] = str(ep)

            # GeometryType
            if lookup:
                code = lookup.find_geometry_type(item_type)
                if code:
                    row_config['geometry_type_override'] = str(code)

            if row_config:
                config_map[item_type] = row_config

        log_message(f"自动填充完成: {len(config_map)} 种零件类型")
        return jsonify({'success': True, 'config': config_map})

    except Exception as e:
        traceback_str = traceback.format_exc()
        log_message(f"自动填充失败: {str(e)}")
        return jsonify({'success': False, 'message': str(e), 'traceback': traceback_str})


@app.route('/api/config/save', methods=['POST'])
def save_config():
    """保存用户配置到JSON文件"""
    data = request.get_json()
    config_map = data.get('config', {})

    try:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'user_part_config.json')
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config_map, f, ensure_ascii=False, indent=2)

        app_state['part_config_map'] = config_map
        log_message(f"配置已保存: {len(config_map)} 种零件类型")
        return jsonify({'success': True, 'message': '配置保存成功'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'保存失败: {str(e)}'})


@app.route('/api/config/load', methods=['GET'])
def load_config():
    """加载用户配置"""
    try:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'user_part_config.json')
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            app_state['part_config_map'] = config
            return jsonify({'success': True, 'config': config})
        return jsonify({'success': True, 'config': {}})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})


# =============================================================================
# API路由 - 生成
# =============================================================================

@app.route('/api/generate', methods=['POST'])
def generate_data():
    """生成S3D数据"""
    data = request.get_json()
    selected_classes = data.get('selected_classes', [])
    output_dir = data.get('output_dir', app_state['output_dir'])

    if not app_state['parser']:
        return jsonify({'success': False, 'message': '请先解析材料等级表'})

    if not selected_classes:
        return jsonify({'success': False, 'message': '请至少选择一个材料等级'})

    try:
        log_message("开始生成S3D数据...")

        # 应用用户配置到parser中的零件
        config_map = app_state.get('part_config_map', {})
        if config_map:
            for class_name, class_parts in app_state['parser'].parts.items():
                for part in class_parts:
                    item_type_upper = part.item_type.strip().upper()
                    if item_type_upper in config_map:
                        for field_key, value in config_map[item_type_upper].items():
                            if hasattr(part, field_key):
                                setattr(part, field_key, value)
            log_message(f"应用零件字段配置: {len(config_map)} 种类型")

        # 生成数据
        generator = S3DDataGenerator(output_dir)
        output_files = generator.generate_all(app_state['parser'], selected_classes)

        # 收集警告和错误
        for warning in generator.get_warnings():
            log_message(f"[警告] {warning}")

        for error in generator.get_errors():
            log_message(f"[错误] {error}")

        files_list = []
        for fpath, desc in output_files.items():
            files_list.append({
                'path': fpath,
                'desc': desc,
                'basename': os.path.basename(fpath)
            })

        log_message(f"生成完成! 共 {len(files_list)} 个文件")

        return jsonify({
            'success': True,
            'message': f'生成完成: {len(files_list)} 个文件',
            'files': files_list,
            'output_dir': output_dir
        })

    except Exception as e:
        traceback_str = traceback.format_exc()
        log_message(f"生成失败: {str(e)}")
        return jsonify({'success': False, 'message': str(e), 'traceback': traceback_str})


# =============================================================================
# API路由 - 日志与下载
# =============================================================================

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """获取日志"""
    return jsonify({'logs': app_state['logs']})


@app.route('/api/download/<path:filename>')
def download_file(filename):
    """下载生成的文件"""
    directory = app_state.get('output_dir', OUTPUT_DIR)
    return send_from_directory(directory, filename, as_attachment=True)


@app.route('/api/output_dir', methods=['POST'])
def set_output_dir():
    """设置输出目录"""
    data = request.get_json()
    output_dir = data.get('output_dir', OUTPUT_DIR)
    app_state['output_dir'] = output_dir
    os.makedirs(output_dir, exist_ok=True)
    log_message(f"输出目录: {output_dir}")
    return jsonify({'success': True, 'output_dir': output_dir})


# =============================================================================
# 启动
# =============================================================================

if __name__ == '__main__':
    print("=" * 60)
    print("S3D建库数据自动生成软件 - Web版本")
    print("=" * 60)
    print(f"请打开浏览器访问: http://127.0.0.1:5000")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=False)
