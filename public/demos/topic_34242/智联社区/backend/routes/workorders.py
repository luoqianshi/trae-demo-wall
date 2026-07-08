"""
邻里智联 - 工单路由
包含AI隐患工单和报修工单的管理
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, WorkOrder, User, UsageRecord
from utils.auth import login_required, admin_required
from utils.generator import generate_order_no

workorder_bp = Blueprint('workorder', __name__, url_prefix='/api/workorders')


@workorder_bp.route('', methods=['GET'])
@login_required
def get_workorders():
    """获取工单列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')
    type_filter = request.args.get('type')
    priority = request.args.get('priority')
    building = request.args.get('building')
    
    query = WorkOrder.query
    
    if status:
        query = query.filter(WorkOrder.status == status)
    if type_filter:
        query = query.filter(WorkOrder.type == type_filter)
    if priority:
        query = query.filter(WorkOrder.priority == priority)
    if building:
        query = query.filter(WorkOrder.building == building)
    
    pagination = query.order_by(WorkOrder.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [w.to_dict() for w in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@workorder_bp.route('/my', methods=['GET'])
@login_required
def get_my_workorders():
    """获取当前用户创建的工单"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')
    
    query = WorkOrder.query.filter(WorkOrder.creator_id == user_info['user_id'])
    
    if status:
        query = query.filter(WorkOrder.status == status)
    
    pagination = query.order_by(WorkOrder.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [w.to_dict() for w in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@workorder_bp.route('/assigned', methods=['GET'])
@login_required
def get_assigned_workorders():
    """获取指派给自己的工单"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')
    
    query = WorkOrder.query.filter(WorkOrder.assigned_to == user_info['user_id'])
    
    if status:
        query = query.filter(WorkOrder.status == status)
    
    pagination = query.order_by(WorkOrder.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [w.to_dict() for w in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@workorder_bp.route('/<int:workorder_id>', methods=['GET'])
@login_required
def get_workorder(workorder_id):
    """获取工单详情"""
    workorder = WorkOrder.query.get(workorder_id)
    if not workorder:
        return jsonify({'code': 404, 'msg': '工单不存在'}), 404
    
    return jsonify({
        'code': 200,
        'data': workorder.to_dict()
    })


@workorder_bp.route('', methods=['POST'])
@login_required
def create_workorder():
    """创建工单"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    data = request.get_json()
    
    type_filter = data.get('type')
    title = data.get('title')
    description = data.get('description')
    
    if not title:
        return jsonify({'code': 400, 'msg': '标题不能为空'}), 400
    
    # 确定工单类型前缀
    type_prefix_map = {
        'hazard': 'HZ',
        'hazard_stairs': 'HZ',
        'hazard_elevator': 'HZ',
        'hazard_fire': 'HZ',
        'hazard_throw': 'HZ',
        'repair': 'RP',
        'consult': 'AP'
    }
    prefix = type_prefix_map.get(type_filter, 'WO')
    
    workorder = WorkOrder(
        order_no=generate_order_no(prefix),
        type=type_filter,
        category=data.get('category'),
        title=title,
        description=description,
        location=data.get('location'),
        building=data.get('building'),
        floor=data.get('floor'),
        priority=data.get('priority', 'medium'),
        status='pending',
        creator_id=user_info['user_id'],
        images=data.get('images'),
        capture_time=datetime.now() if data.get('capture_time') else None
    )
    
    db.session.add(workorder)
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '创建成功',
        'data': workorder.to_dict()
    })


@workorder_bp.route('/hazard/auto', methods=['POST'])
@admin_required
def create_hazard_workorder():
    """AI自动创建隐患工单（从触屏终端触发）"""
    data = request.get_json()
    
    hazard_type = data.get('hazard_type')  # stairs/elevator/fire/throw
    location = data.get('location')
    building = data.get('building')
    floor = data.get('floor')
    image_url = data.get('image_url')
    
    type_map = {
        'stairs': ('hazard_stairs', '楼道杂物'),
        'elevator': ('hazard_elevator', '电动车入梯'),
        'fire': ('hazard_fire', '消防通道堵塞'),
        'throw': ('hazard_throw', '高空抛物')
    }
    
    if hazard_type not in type_map:
        return jsonify({'code': 400, 'msg': '无效的隐患类型'}), 400
    
    type_code, type_name = type_map[hazard_type]
    
    workorder = WorkOrder(
        order_no=generate_order_no('HZ'),
        type=type_code,
        category=hazard_type,
        title=f'【AI检测】{type_name}',
        description=data.get('description', f'AI自动检测到{hazard_type}隐患'),
        location=location,
        building=building,
        floor=floor,
        priority=data.get('priority', 'high'),
        status='pending',
        creator_id=data.get('creator_id', 1),
        images=image_url,
        capture_time=datetime.now()
    )
    
    db.session.add(workorder)
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '隐患工单已创建',
        'data': workorder.to_dict()
    })


@workorder_bp.route('/<int:workorder_id>', methods=['PUT'])
@login_required
def update_workorder(workorder_id):
    """更新工单"""
    workorder = WorkOrder.query.get(workorder_id)
    if not workorder:
        return jsonify({'code': 404, 'msg': '工单不存在'}), 404
    
    data = request.get_json()
    
    if 'status' in data:
        workorder.status = data['status']
        
        # 状态变更时的处理
        if data['status'] == 'processing' and not workorder.handle_time:
            workorder.handle_time = datetime.now()
        elif data['status'] == 'completed':
            workorder.completion_time = datetime.now()
    
    if 'assigned_to' in data:
        workorder.assigned_to = data['assigned_to']
    if 'priority' in data:
        workorder.priority = data['priority']
    if 'handle_result' in data:
        workorder.handle_result = data['handle_result']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '更新成功',
        'data': workorder.to_dict()
    })


@workorder_bp.route('/<int:workorder_id>/assign', methods=['POST'])
@admin_required
def assign_workorder(workorder_id):
    """指派工单给网格员"""
    workorder = WorkOrder.query.get(workorder_id)
    if not workorder:
        return jsonify({'code': 404, 'msg': '工单不存在'}), 404
    
    data = request.get_json()
    grid_admin_id = data.get('grid_admin_id')
    
    if not grid_admin_id:
        return jsonify({'code': 400, 'msg': '请指定网格员'}), 400
    
    grid_admin = User.query.get(grid_admin_id)
    if not grid_admin or grid_admin.role not in ['grid_admin', 'admin']:
        return jsonify({'code': 400, 'msg': '无效的网格员'}), 400
    
    workorder.assigned_to = grid_admin_id
    workorder.status = 'processing'
    workorder.handle_time = datetime.now()
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '指派成功',
        'data': workorder.to_dict()
    })


@workorder_bp.route('/<int:workorder_id>/complete', methods=['POST'])
@login_required
def complete_workorder(workorder_id):
    """处理完成工单"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    workorder = WorkOrder.query.get(workorder_id)
    if not workorder:
        return jsonify({'code': 404, 'msg': '工单不存在'}), 404
    
    # 验证权限（创建者或管理员或被指派人可以完成）
    if workorder.creator_id != user_info['user_id'] and workorder.assigned_to != user_info['user_id']:
        if user_info['role'] not in ['admin', 'grid_admin']:
            return jsonify({'code': 403, 'msg': '权限不足'}), 403
    
    data = request.get_json()
    
    workorder.status = 'completed'
    workorder.completion_time = datetime.now()
    workorder.handle_result = data.get('handle_result', '')
    
    if 'images' in data:
        workorder.images = data['images']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '工单已完成',
        'data': workorder.to_dict()
    })


@workorder_bp.route('/<int:workorder_id>/rate', methods=['POST'])
@login_required
def rate_workorder(workorder_id):
    """评价工单"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    workorder = WorkOrder.query.get(workorder_id)
    if not workorder:
        return jsonify({'code': 404, 'msg': '工单不存在'}), 404
    
    # 只有创建者可以评价
    if workorder.creator_id != user_info['user_id']:
        return jsonify({'code': 403, 'msg': '只能评价自己的工单'}), 403
    
    if workorder.status != 'completed':
        return jsonify({'code': 400, 'msg': '只能评价已完成的工单'}), 400
    
    data = request.get_json()
    
    workorder.rating = data.get('rating', 5)
    workorder.feedback = data.get('feedback', '')
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '评价成功',
        'data': workorder.to_dict()
    })


@workorder_bp.route('/stats', methods=['GET'])
@login_required
def get_workorder_stats():
    """获取工单统计"""
    from sqlalchemy import func
    
    # 按状态统计
    status_stats = db.session.query(
        WorkOrder.status, 
        func.count(WorkOrder.id)
    ).group_by(WorkOrder.status).all()
    
    # 按类型统计
    type_stats = db.session.query(
        WorkOrder.type,
        func.count(WorkOrder.id)
    ).group_by(WorkOrder.type).all()
    
    # 按优先级统计
    priority_stats = db.session.query(
        WorkOrder.priority,
        func.count(WorkOrder.id)
    ).group_by(WorkOrder.priority).all()
    
    # 本月工单数
    from datetime import datetime
    month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0)
    month_count = WorkOrder.query.filter(WorkOrder.create_time >= month_start).count()
    
    return jsonify({
        'code': 200,
        'data': {
            'by_status': {s: c for s, c in status_stats},
            'by_type': {t: c for t, c in type_stats},
            'by_priority': {p: c for p, c in priority_stats},
            'month_count': month_count,
            'total': sum(c for _, c in status_stats)
        }
    })
