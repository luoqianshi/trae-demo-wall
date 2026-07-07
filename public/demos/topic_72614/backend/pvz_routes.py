# -*- coding: utf-8 -*-
"""
PVZ游戏路由蓝图（独立运行版）
提供PVZ游戏的API接口和页面路由

与主程序版本的区别：
- 移除密码授权（独立运行无需密码保护）
- 直接渲染游戏页面
"""

from flask import Blueprint, render_template, request, jsonify

from .pvz_save import SaveManager
from .pvz_data import get_all_plants, get_zombie_data, get_relic_data


# 创建蓝图
pvz_bp = Blueprint('pvz', __name__, url_prefix='/pvz')

# 存档管理器实例
save_manager = SaveManager()


@pvz_bp.route('/pvz_game')
def pvz_game():
    """渲染PVZ游戏页面（独立运行版，无需密码授权）"""
    return render_template('pvz_game.html')


@pvz_bp.route('/saves', methods=['GET'])
def list_saves():
    """列出所有存档"""
    saves = save_manager.list_saves()
    return jsonify({'success': True, 'saves': saves})


@pvz_bp.route('/save', methods=['POST'])
def save_game():
    """保存游戏存档"""
    data = request.get_json(silent=True) or {}
    slot = data.get('slot')
    name = data.get('name', '')
    game_data = data.get('data', {})

    if slot is None:
        return jsonify({'success': False, 'error': '缺少存档槽位'}), 400

    if not isinstance(slot, int) and not (isinstance(slot, str) and slot.isdigit()):
        return jsonify({'success': False, 'error': '存档槽位必须为整数'}), 400

    slot = int(slot)
    save_payload = dict(game_data)
    save_payload['name'] = name or f'存档 {slot}'

    result = save_manager.save_game(slot, save_payload)
    if result['success']:
        return jsonify(result)
    return jsonify(result), 500


@pvz_bp.route('/save/<int:slot>', methods=['GET'])
def load_game(slot):
    """加载存档"""
    save_data = save_manager.load_game(slot)
    if save_data is None:
        return jsonify({'success': False, 'error': '存档不存在'}), 404
    return jsonify({'success': True, 'save': save_data})


@pvz_bp.route('/save/<int:slot>', methods=['DELETE'])
def delete_save(slot):
    """删除存档"""
    result = save_manager.delete_save(slot)
    if result['success']:
        return jsonify(result)
    return jsonify(result), 404


@pvz_bp.route('/plants', methods=['GET'])
def get_plants():
    """获取所有植物数据"""
    plants = get_all_plants()
    return jsonify({'success': True, 'plants': plants, 'count': len(plants)})


@pvz_bp.route('/zombies', methods=['GET'])
def get_zombies():
    """获取僵尸数据"""
    zombies = get_zombie_data()
    return jsonify({'success': True, 'zombies': zombies})


@pvz_bp.route('/relics', methods=['GET'])
def get_relics():
    """获取遗物数据"""
    relics = get_relic_data()
    return jsonify({'success': True, 'relics': relics})
