"""
邻里智联 - 通知路由
包含社区通知发布、批量推送等功能
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, Notice, NoticeRecord, User
from utils.auth import login_required, admin_required
from utils.generator import generate_notice_no

notice_bp = Blueprint('notice', __name__, url_prefix='/api/notices')


@notice_bp.route('', methods=['GET'])
def get_notices():
    """获取通知列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    notice_type = request.args.get('type')
    scope = request.args.get('scope')
    is_published = request.args.get('is_published', 'true')
    
    query = Notice.query
    
    if is_published == 'true':
        query = query.filter(Notice.is_published == True)
    
    if notice_type:
        query = query.filter(Notice.type == notice_type)
    if scope:
        query = query.filter(Notice.scope == scope)
    
    pagination = query.order_by(Notice.publish_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [n.to_dict() for n in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@notice_bp.route('/my', methods=['GET'])
@login_required
def get_my_notices():
    """获取推送给我的通知"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    user = User.query.get(user_info['user_id'])
    
    # 获取用户收到的通知记录
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    
    # 查找推送给该用户的所有通知
    query = Notice.query.filter(
        Notice.is_published == True,
        db.or_(
            Notice.scope == 'all',
            Notice.scope == None,
            # 根据楼栋、单元筛选
            db.and_(
                Notice.scope.in_(['building', 'unit']),
                Notice.target_buildings.like(f'%{user.building}%') if user.building else False
            )
        )
    )
    
    pagination = query.order_by(Notice.publish_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    notices = []
    for notice in pagination.items:
        notice_dict = notice.to_dict()
        # 检查是否已读
        record = NoticeRecord.query.filter_by(
            notice_id=notice.id,
            user_id=user_info['user_id']
        ).first()
        notice_dict['is_read'] = record.is_read if record else False
        notices.append(notice_dict)
    
    return jsonify({
        'code': 200,
        'data': {
            'items': notices,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@notice_bp.route('/unread', methods=['GET'])
@login_required
def get_unread_notices():
    """获取未读通知数量"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    user = User.query.get(user_info['user_id'])
    
    # 获取所有已发布通知
    notices = Notice.query.filter(Notice.is_published == True).all()
    
    unread_count = 0
    for notice in notices:
        # 检查是否推送给该用户
        if notice.scope != 'all' and user.building:
            if notice.scope == 'building' and notice.target_buildings:
                if user.building not in notice.target_buildings:
                    continue
            elif notice.scope == 'unit' and notice.target_units:
                if user.unit not in notice.target_units:
                    continue
        
        # 检查是否已读
        record = NoticeRecord.query.filter_by(
            notice_id=notice.id,
            user_id=user_info['user_id']
        ).first()
        
        if not record or not record.is_read:
            unread_count += 1
    
    return jsonify({
        'code': 200,
        'data': {'unread_count': unread_count}
    })


@notice_bp.route('/<int:notice_id>', methods=['GET'])
def get_notice(notice_id):
    """获取通知详情"""
    notice = Notice.query.get(notice_id)
    if not notice:
        return jsonify({'code': 404, 'msg': '通知不存在'}), 404
    
    notice_dict = notice.to_dict()
    
    # 添加发布者信息
    if notice.publisher_id:
        publisher = User.query.get(notice.publisher_id)
        if publisher:
            notice_dict['publisher_name'] = publisher.name
    
    return jsonify({
        'code': 200,
        'data': notice_dict
    })


@notice_bp.route('', methods=['POST'])
@admin_required
def create_notice():
    """创建通知"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    data = request.get_json()
    
    title = data.get('title')
    if not title:
        return jsonify({'code': 400, 'msg': '标题不能为空'}), 400
    
    notice = Notice(
        notice_no=generate_notice_no(),
        title=title,
        content=data.get('content'),
        type=data.get('type', 'other'),
        scope=data.get('scope', 'all'),
        target_buildings=data.get('target_buildings'),
        target_units=data.get('target_units'),
        target_rooms=data.get('target_rooms'),
        publisher_id=user_info['user_id'],
        attachments=data.get('attachments')
    )
    
    db.session.add(notice)
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '创建成功',
        'data': notice.to_dict()
    })


@notice_bp.route('/<int:notice_id>', methods=['PUT'])
@admin_required
def update_notice(notice_id):
    """更新通知"""
    notice = Notice.query.get(notice_id)
    if not notice:
        return jsonify({'code': 404, 'msg': '通知不存在'}), 404
    
    data = request.get_json()
    
    if 'title' in data:
        notice.title = data['title']
    if 'content' in data:
        notice.content = data['content']
    if 'type' in data:
        notice.type = data['type']
    if 'scope' in data:
        notice.scope = data['scope']
    if 'target_buildings' in data:
        notice.target_buildings = data['target_buildings']
    if 'target_units' in data:
        notice.target_units = data['target_units']
    if 'target_rooms' in data:
        notice.target_rooms = data['target_rooms']
    if 'attachments' in data:
        notice.attachments = data['attachments']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '更新成功',
        'data': notice.to_dict()
    })


@notice_bp.route('/<int:notice_id>/publish', methods=['POST'])
@admin_required
def publish_notice(notice_id):
    """发布通知"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    notice = Notice.query.get(notice_id)
    if not notice:
        return jsonify({'code': 404, 'msg': '通知不存在'}), 404
    
    if notice.is_published:
        return jsonify({'code': 400, 'msg': '通知已发布'}), 400
    
    notice.is_published = True
    notice.publish_time = datetime.now()
    
    # 创建推送记录（推送给所有用户或指定范围用户）
    if notice.scope == 'all':
        users = User.query.filter(User.is_active == True).all()
    elif notice.scope == 'building' and notice.target_buildings:
        buildings = notice.target_buildings.split(',')
        users = User.query.filter(
            User.is_active == True,
            User.building.in_(buildings)
        ).all()
    elif notice.scope == 'unit' and notice.target_units:
        units = notice.target_units.split(',')
        users = User.query.filter(
            User.is_active == True,
            User.unit.in_(units)
        ).all()
    else:
        users = []
    
    for user in users:
        record = NoticeRecord(
            notice_id=notice.id,
            user_id=user.id
        )
        db.session.add(record)
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': f'发布成功，已推送至 {len(users)} 位用户',
        'data': notice.to_dict()
    })


@notice_bp.route('/<int:notice_id>', methods=['DELETE'])
@admin_required
def delete_notice(notice_id):
    """删除通知"""
    notice = Notice.query.get(notice_id)
    if not notice:
        return jsonify({'code': 404, 'msg': '通知不存在'}), 404
    
    # 删除相关推送记录
    NoticeRecord.query.filter_by(notice_id=notice_id).delete()
    
    db.session.delete(notice)
    db.session.commit()
    
    return jsonify({'code': 200, 'msg': '删除成功'})


@notice_bp.route('/<int:notice_id>/read', methods=['POST'])
@login_required
def mark_as_read(notice_id):
    """标记通知为已读"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    notice = Notice.query.get(notice_id)
    if not notice:
        return jsonify({'code': 404, 'msg': '通知不存在'}), 404
    
    record = NoticeRecord.query.filter_by(
        notice_id=notice_id,
        user_id=user_info['user_id']
    ).first()
    
    if not record:
        record = NoticeRecord(
            notice_id=notice_id,
            user_id=user_info['user_id']
        )
        db.session.add(record)
    
    record.is_read = True
    record.read_time = datetime.now()
    
    db.session.commit()
    
    return jsonify({'code': 200, 'msg': '已标记为已读'})


@notice_bp.route('/types', methods=['GET'])
def get_notice_types():
    """获取通知类型"""
    types = [
        {'code': 'water', 'name': '停水通知', 'icon': '💧'},
        {'code': 'electricity', 'name': '停电通知', 'icon': '⚡'},
        {'code': 'gas', 'name': '停气通知', 'icon': '🔥'},
        {'code': 'security', 'name': '安全通知', 'icon': '🔒'},
        {'code': 'fraud', 'name': '反诈宣传', 'icon': '⚠️'},
        {'code': 'event', 'name': '社区活动', 'icon': '🎉'},
        {'code': 'other', 'name': '其他通知', 'icon': '📢'}
    ]
    
    return jsonify({
        'code': 200,
        'data': types
    })


@notice_bp.route('/batch_push', methods=['POST'])
@admin_required
def batch_push():
    """批量推送通知"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    data = request.get_json()
    
    notice_ids = data.get('notice_ids', [])
    user_ids = data.get('user_ids', [])
    
    if not notice_ids:
        return jsonify({'code': 400, 'msg': '请选择要推送的通知'}), 400
    
    pushed_count = 0
    
    for notice_id in notice_ids:
        notice = Notice.query.get(notice_id)
        if not notice:
            continue
        
        if user_ids:
            # 推送给指定用户
            for user_id in user_ids:
                existing = NoticeRecord.query.filter_by(
                    notice_id=notice_id,
                    user_id=user_id
                ).first()
                
                if not existing:
                    record = NoticeRecord(
                        notice_id=notice_id,
                        user_id=user_id
                    )
                    db.session.add(record)
                    pushed_count += 1
        else:
            # 推送给所有活跃用户
            users = User.query.filter(User.is_active == True).all()
            for user in users:
                existing = NoticeRecord.query.filter_by(
                    notice_id=notice_id,
                    user_id=user.id
                ).first()
                
                if not existing:
                    record = NoticeRecord(
                        notice_id=notice_id,
                        user_id=user.id
                    )
                    db.session.add(record)
                    pushed_count += 1
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': f'推送成功，共推送 {pushed_count} 条记录'
    })


@notice_bp.route('/records', methods=['GET'])
@admin_required
def get_notice_records():
    """获取通知推送记录"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    notice_id = request.args.get('notice_id', type=int)
    
    query = NoticeRecord.query
    
    if notice_id:
        query = query.filter(NoticeRecord.notice_id == notice_id)
    
    pagination = query.order_by(NoticeRecord.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    records = []
    for record in pagination.items:
        record_dict = record.to_dict()
        user = User.query.get(record.user_id)
        if user:
            record_dict['user_name'] = user.name
            record_dict['user_phone'] = user.phone
        notice = Notice.query.get(record.notice_id)
        if notice:
            record_dict['notice_title'] = notice.title
        records.append(record_dict)
    
    return jsonify({
        'code': 200,
        'data': {
            'items': records,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })
