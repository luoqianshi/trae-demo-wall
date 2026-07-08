"""
邻里智联 - 居民诉求路由
包含报修和政务咨询的管理
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Appeal, User
from utils.auth import login_required, admin_required
from utils.generator import generate_order_no

appeal_bp = Blueprint('appeal', __name__, url_prefix='/api/appeals')


@appeal_bp.route('', methods=['GET'])
@login_required
def get_appeals():
    """获取诉求列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')
    type_filter = request.args.get('type')
    category = request.args.get('category')
    building = request.args.get('building')
    
    query = Appeal.query
    
    if status:
        query = query.filter(Appeal.status == status)
    if type_filter:
        query = query.filter(Appeal.type == type_filter)
    if category:
        query = query.filter(Appeal.category == category)
    if building:
        query = query.filter(Appeal.building == building)
    
    pagination = query.order_by(Appeal.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [a.to_dict() for a in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@appeal_bp.route('/my', methods=['GET'])
@login_required
def get_my_appeals():
    """获取当前用户的诉求"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')
    
    query = Appeal.query.filter(Appeal.creator_id == user_info['user_id'])
    
    if status:
        query = query.filter(Appeal.status == status)
    
    pagination = query.order_by(Appeal.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [a.to_dict() for a in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@appeal_bp.route('/assigned', methods=['GET'])
@login_required
def get_assigned_appeals():
    """获取指派给自己的诉求"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')
    
    query = Appeal.query.filter(Appeal.assigned_to == user_info['user_id'])
    
    if status:
        query = query.filter(Appeal.status == status)
    
    pagination = query.order_by(Appeal.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [a.to_dict() for a in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@appeal_bp.route('/<int:appeal_id>', methods=['GET'])
@login_required
def get_appeal(appeal_id):
    """获取诉求详情"""
    appeal = Appeal.query.get(appeal_id)
    if not appeal:
        return jsonify({'code': 404, 'msg': '诉求不存在'}), 404
    
    return jsonify({
        'code': 200,
        'data': appeal.to_dict()
    })


@appeal_bp.route('', methods=['POST'])
@login_required
def create_appeal():
    """创建诉求"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    data = request.get_json()
    
    type_filter = data.get('type', 'repair')
    title = data.get('title')
    description = data.get('description')
    
    if not title:
        return jsonify({'code': 400, 'msg': '标题不能为空'}), 400
    
    # 确定类型前缀
    prefix = 'RP' if type_filter.startswith('repair') else 'AP'
    
    appeal = Appeal(
        appeal_no=generate_order_no(prefix),
        type=type_filter,
        category=data.get('category'),
        title=title,
        description=description,
        voice_url=data.get('voice_url'),
        location=data.get('location'),
        building=data.get('building'),
        unit=data.get('unit'),
        room=data.get('room'),
        status='pending',
        creator_id=user_info['user_id'],
        images=data.get('images')
    )
    
    db.session.add(appeal)
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '诉求提交成功',
        'data': appeal.to_dict()
    })


@appeal_bp.route('/<int:appeal_id>', methods=['PUT'])
@login_required
def update_appeal(appeal_id):
    """更新诉求"""
    appeal = Appeal.query.get(appeal_id)
    if not appeal:
        return jsonify({'code': 404, 'msg': '诉求不存在'}), 404
    
    data = request.get_json()
    
    if 'status' in data:
        appeal.status = data['status']
        if data['status'] == 'processing' and not appeal.handle_time:
            appeal.handle_time = datetime.now()
        elif data['status'] == 'completed':
            appeal.completion_time = datetime.now()
    
    if 'assigned_to' in data:
        appeal.assigned_to = data['assigned_to']
    if 'handle_result' in data:
        appeal.handle_result = data['handle_result']
    if 'images' in data:
        appeal.images = data['images']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '更新成功',
        'data': appeal.to_dict()
    })


@appeal_bp.route('/<int:appeal_id>/assign', methods=['POST'])
@admin_required
def assign_appeal(appeal_id):
    """指派诉求给网格员"""
    appeal = Appeal.query.get(appeal_id)
    if not appeal:
        return jsonify({'code': 404, 'msg': '诉求不存在'}), 404
    
    data = request.get_json()
    grid_admin_id = data.get('grid_admin_id')
    
    if not grid_admin_id:
        return jsonify({'code': 400, 'msg': '请指定网格员'}), 400
    
    grid_admin = User.query.get(grid_admin_id)
    if not grid_admin or grid_admin.role not in ['grid_admin', 'admin']:
        return jsonify({'code': 400, 'msg': '无效的网格员'}), 400
    
    appeal.assigned_to = grid_admin_id
    appeal.status = 'processing'
    appeal.handle_time = datetime.now()
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '指派成功',
        'data': appeal.to_dict()
    })


@appeal_bp.route('/<int:appeal_id>/complete', methods=['POST'])
@login_required
def complete_appeal(appeal_id):
    """处理完成诉求"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    appeal = Appeal.query.get(appeal_id)
    if not appeal:
        return jsonify({'code': 404, 'msg': '诉求不存在'}), 404
    
    if appeal.creator_id != user_info['user_id'] and appeal.assigned_to != user_info['user_id']:
        if user_info['role'] not in ['admin', 'grid_admin']:
            return jsonify({'code': 403, 'msg': '权限不足'}), 403
    
    data = request.get_json()
    
    appeal.status = 'completed'
    appeal.completion_time = datetime.now()
    appeal.handle_result = data.get('handle_result', '')
    
    if 'images' in data:
        appeal.images = data['images']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '诉求已处理完成',
        'data': appeal.to_dict()
    })


@appeal_bp.route('/categories', methods=['GET'])
def get_categories():
    """获取诉求分类"""
    categories = {
        'repair': {
            'name': '报修',
            'items': [
                {'code': 'repair_water', 'name': '水电维修'},
                {'code': 'repair_appliance', 'name': '家电维修'},
                {'code': 'repair_pipe', 'name': '管道维修'},
                {'code': 'repair_lock', 'name': '门锁维修'},
                {'code': 'repair_elevator', 'name': '电梯维修'}
            ]
        },
        'consult': {
            'name': '政务咨询',
            'items': [
                {'code': 'consult_social', 'name': '社保咨询'},
                {'code': 'consult_medical', 'name': '医保咨询'},
                {'code': 'consult_pension', 'name': '养老认证'},
                {'code': 'consult_housing', 'name': '公租房申请'},
                {'code': 'consult_id', 'name': '身份证办理'},
                {'code': 'consult_hukou', 'name': '户籍办理'}
            ]
        }
    }
    
    return jsonify({
        'code': 200,
        'data': categories
    })


@appeal_bp.route('/stats', methods=['GET'])
@login_required
def get_appeal_stats():
    """获取诉求统计"""
    from sqlalchemy import func
    
    # 按状态统计
    status_stats = db.session.query(
        Appeal.status,
        func.count(Appeal.id)
    ).group_by(Appeal.status).all()
    
    # 按类型统计
    type_stats = db.session.query(
        Appeal.type,
        func.count(Appeal.id)
    ).group_by(Appeal.type).all()
    
    # 按分类统计
    category_stats = db.session.query(
        Appeal.category,
        func.count(Appeal.id)
    ).filter(Appeal.category != None).group_by(Appeal.category).all()
    
    # 本月诉求数
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0)
    month_count = Appeal.query.filter(Appeal.create_time >= month_start).count()
    
    return jsonify({
        'code': 200,
        'data': {
            'by_status': {s: c for s, c in status_stats},
            'by_type': {t: c for t, c in type_stats},
            'by_category': {c: n for c, n in category_stats},
            'month_count': month_count,
            'total': sum(c for _, c in status_stats)
        }
    })
