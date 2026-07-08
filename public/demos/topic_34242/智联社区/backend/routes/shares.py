"""
邻里智联 - 邻里共享路由
包含闲置物品发布、租借/转让匹配、积分体系等功能
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, SharedItem, User, PointRecord, PointRule
from utils.auth import login_required, admin_required
from utils.generator import generate_item_no

share_bp = Blueprint('share', __name__, url_prefix='/api/shares')


def init_point_rules():
    """初始化积分规则"""
    rules = [
        {'action': 'publish_item', 'name': '发布物品', 'points': 5, 'description': '发布共享物品'},
        {'action': 'lend_item', 'name': '借出物品', 'points': 10, 'description': '物品被借用并完成'},
        {'action': 'return_item', 'name': '归还物品', 'points': 5, 'description': '按时归还物品'},
        {'action': 'help_others', 'name': '帮助他人', 'points': 15, 'description': '帮助其他居民'},
        {'action': 'repair_feedback', 'name': '报修反馈', 'points': 5, 'description': '对维修服务评价'},
        {'action': 'share_positive', 'name': '正能量分享', 'points': 10, 'description': '分享正能量内容'},
    ]
    
    for rule_data in rules:
        existing = PointRule.query.filter_by(action=rule_data['action']).first()
        if not existing:
            rule = PointRule(**rule_data)
            db.session.add(rule)
    
    db.session.commit()


@share_bp.route('', methods=['GET'])
def get_items():
    """获取共享物品列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    category = request.args.get('category')
    transaction_type = request.args.get('transaction_type')
    status = request.args.get('status', 'available')
    keyword = request.args.get('keyword')
    
    query = SharedItem.query.filter(SharedItem.status == status)
    
    if category:
        query = query.filter(SharedItem.category == category)
    if transaction_type:
        query = query.filter(SharedItem.transaction_type == transaction_type)
    if keyword:
        query = query.filter(
            db.or_(
                SharedItem.title.like(f'%{keyword}%'),
                SharedItem.description.like(f'%{keyword}%')
            )
        )
    
    pagination = query.order_by(SharedItem.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    items = []
    for item in pagination.items:
        item_dict = item.to_dict()
        # 添加所有者信息
        owner = User.query.get(item.owner_id)
        if owner:
            item_dict['owner_name'] = owner.name
            item_dict['owner_phone'] = owner.phone
        items.append(item_dict)
    
    return jsonify({
        'code': 200,
        'data': {
            'items': items,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@share_bp.route('/my', methods=['GET'])
@login_required
def get_my_items():
    """获取我发布的物品"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')
    
    query = SharedItem.query.filter(SharedItem.owner_id == user_info['user_id'])
    
    if status:
        query = query.filter(SharedItem.status == status)
    
    pagination = query.order_by(SharedItem.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [item.to_dict() for item in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@share_bp.route('/borrowed', methods=['GET'])
@login_required
def get_borrowed_items():
    """获取我借用的物品"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    
    query = SharedItem.query.filter(SharedItem.borrower_id == user_info['user_id'])
    
    pagination = query.order_by(SharedItem.borrow_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [item.to_dict() for item in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@share_bp.route('/<int:item_id>', methods=['GET'])
def get_item(item_id):
    """获取物品详情"""
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    
    # 增加浏览次数
    item.views += 1
    db.session.commit()
    
    item_dict = item.to_dict()
    
    # 添加所有者信息
    owner = User.query.get(item.owner_id)
    if owner:
        item_dict['owner_name'] = owner.name
        item_dict['owner_phone'] = owner.phone
        item_dict['owner_building'] = owner.building
        item_dict['owner_unit'] = owner.unit
    
    # 如果有借用者，添加借用者信息
    if item.borrower_id:
        borrower = User.query.get(item.borrower_id)
        if borrower:
            item_dict['borrower_name'] = borrower.name
    
    return jsonify({
        'code': 200,
        'data': item_dict
    })


@share_bp.route('', methods=['POST'])
@login_required
def create_item():
    """发布共享物品"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    data = request.get_json()
    
    title = data.get('title')
    if not title:
        return jsonify({'code': 400, 'msg': '物品名称不能为空'}), 400
    
    category = data.get('category')
    if not category:
        return jsonify({'code': 400, 'msg': '请选择分类'}), 400
    
    item = SharedItem(
        item_no=generate_item_no(),
        title=title,
        description=data.get('description'),
        category=category,
        condition=data.get('condition', '一般'),
        transaction_type=data.get('transaction_type', 'lend'),
        price=data.get('price', 0),
        deposit=data.get('deposit', 0),
        images=data.get('images'),
        status='available',
        owner_id=user_info['user_id']
    )
    
    db.session.add(item)
    
    # 添加积分记录
    init_point_rules()
    publish_rule = PointRule.query.filter_by(action='publish_item').first()
    if publish_rule:
        point_record = PointRecord(
            user_id=user_info['user_id'],
            type='earn',
            action='publish_item',
            points=publish_rule.points,
            description=f'发布物品: {title}',
            related_id=item.id
        )
        db.session.add(point_record)
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '发布成功',
        'data': item.to_dict()
    })


@share_bp.route('/<int:item_id>', methods=['PUT'])
@login_required
def update_item(item_id):
    """更新物品信息"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    
    # 验证所有权
    if item.owner_id != user_info['user_id']:
        return jsonify({'code': 403, 'msg': '无权操作'}), 403
    
    if item.status != 'available':
        return jsonify({'code': 400, 'msg': '当前状态不允许修改'}), 400
    
    data = request.get_json()
    
    if 'title' in data:
        item.title = data['title']
    if 'description' in data:
        item.description = data['description']
    if 'category' in data:
        item.category = data['category']
    if 'condition' in data:
        item.condition = data['condition']
    if 'transaction_type' in data:
        item.transaction_type = data['transaction_type']
    if 'price' in data:
        item.price = data['price']
    if 'deposit' in data:
        item.deposit = data['deposit']
    if 'images' in data:
        item.images = data['images']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '更新成功',
        'data': item.to_dict()
    })


@share_bp.route('/<int:item_id>', methods=['DELETE'])
@login_required
def delete_item(item_id):
    """删除物品"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    
    if item.owner_id != user_info['user_id']:
        return jsonify({'code': 403, 'msg': '无权操作'}), 403
    
    if item.status not in ['available', 'unavailable']:
        return jsonify({'code': 400, 'msg': '当前状态不允许删除'}), 400
    
    item.status = 'unavailable'
    db.session.commit()
    
    return jsonify({'code': 200, 'msg': '删除成功'})


@share_bp.route('/<int:item_id>/reserve', methods=['POST'])
@login_required
def reserve_item(item_id):
    """预约物品"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    
    if item.status != 'available':
        return jsonify({'code': 400, 'msg': '物品不可预约'}), 400
    
    if item.owner_id == user_info['user_id']:
        return jsonify({'code': 400, 'msg': '不能预约自己的物品'}), 400
    
    item.status = 'reserved'
    item.borrower_id = user_info['user_id']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '预约成功',
        'data': item.to_dict()
    })


@share_bp.route('/<int:item_id>/borrow', methods=['POST'])
@login_required
def borrow_item(item_id):
    """借用物品（确认借出）"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    
    if item.status != 'reserved':
        return jsonify({'code': 400, 'msg': '物品状态不正确'}), 400
    
    item.status = 'lent' if item.transaction_type == 'lend' else 'rented'
    item.borrow_time = datetime.now()
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '借出成功',
        'data': item.to_dict()
    })


@share_bp.route('/<int:item_id>/return', methods=['POST'])
@login_required
def return_item(item_id):
    """归还物品"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    
    if item.status not in ['lent', 'rented']:
        return jsonify({'code': 400, 'msg': '物品状态不正确'}), 404
    
    if item.borrower_id != user_info['user_id']:
        return jsonify({'code': 403, 'msg': '你不是借用者'}), 403
    
    item.status = 'available'
    item.borrower_id = None
    item.return_time = datetime.now()
    
    # 添加积分记录（按时归还）
    init_point_rules()
    return_rule = PointRule.query.filter_by(action='return_item').first()
    if return_rule:
        point_record = PointRecord(
            user_id=user_info['user_id'],
            type='earn',
            action='return_item',
            points=return_rule.points,
            description=f'归还物品: {item.title}',
            related_id=item.id
        )
        db.session.add(point_record)
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '归还成功',
        'data': item.to_dict()
    })


@share_bp.route('/<int:item_id>/transfer', methods=['POST'])
@login_required
def transfer_item(item_id):
    """转让/送出物品"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    data = request.get_json()
    borrower_id = data.get('borrower_id')
    
    if not borrower_id:
        return jsonify({'code': 400, 'msg': '请指定接收者'}), 400
    
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    
    if item.owner_id != user_info['user_id']:
        return jsonify({'code': 403, 'msg': '你不是所有者'}), 403
    
    item.status = 'transferred'
    item.borrower_id = borrower_id
    item.borrow_time = datetime.now()
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '转让成功',
        'data': item.to_dict()
    })


@share_bp.route('/categories', methods=['GET'])
def get_categories():
    """获取物品分类"""
    categories = [
        {'code': 'tools', 'name': '工具', 'icon': '🔧'},
        {'code': 'baby', 'name': '母婴用品', 'icon': '👶'},
        {'code': 'electronics', 'name': '家电', 'icon': '📺'},
        {'code': 'books', 'name': '书籍', 'icon': '📚'},
        {'code': 'parking', 'name': '车位', 'icon': '🚗'},
        {'code': 'other', 'name': '其他', 'icon': '📦'}
    ]
    
    return jsonify({
        'code': 200,
        'data': categories
    })


@share_bp.route('/points/my', methods=['GET'])
@login_required
def get_my_points():
    """获取我的积分"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    # 计算总积分
    earn_points = db.session.query(db.func.sum(PointRecord.points)).filter(
        PointRecord.user_id == user_info['user_id'],
        PointRecord.type == 'earn'
    ).scalar() or 0
    
    spend_points = db.session.query(db.func.sum(PointRecord.points)).filter(
        PointRecord.user_id == user_info['user_id'],
        PointRecord.type == 'spend'
    ).scalar() or 0
    
    total_points = earn_points - spend_points
    
    # 获取积分记录
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    
    pagination = PointRecord.query.filter(
        PointRecord.user_id == user_info['user_id']
    ).order_by(PointRecord.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'total_points': total_points,
            'earn_points': earn_points,
            'spend_points': spend_points,
            'records': [r.to_dict() for r in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@share_bp.route('/points/rules', methods=['GET'])
def get_point_rules():
    """获取积分规则"""
    init_point_rules()
    rules = PointRule.query.filter(PointRule.is_active == True).all()
    
    return jsonify({
        'code': 200,
        'data': [r.to_dict() for r in rules]
    })


@share_bp.route('/stats', methods=['GET'])
def get_share_stats():
    """获取共享统计"""
    from sqlalchemy import func
    
    # 按分类统计
    category_stats = db.session.query(
        SharedItem.category,
        func.count(SharedItem.id)
    ).filter(SharedItem.status == 'available').group_by(SharedItem.category).all()
    
    # 按交易类型统计
    transaction_stats = db.session.query(
        SharedItem.transaction_type,
        func.count(SharedItem.id)
    ).filter(SharedItem.status == 'available').group_by(SharedItem.transaction_type).all()
    
    # 今日新增
    today_start = datetime.now().replace(hour=0, minute=0, second=0)
    today_count = SharedItem.query.filter(SharedItem.create_time >= today_start).count()
    
    # 总数
    total_available = SharedItem.query.filter(SharedItem.status == 'available').count()
    
    return jsonify({
        'code': 200,
        'data': {
            'by_category': {c: n for c, n in category_stats},
            'by_transaction_type': {t: n for t, n in transaction_stats},
            'today_count': today_count,
            'total_available': total_available
        }
    })
