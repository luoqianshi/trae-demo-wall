"""
邻里智联 - 投诉举报路由
用户可提交对物品或其他用户的投诉，管理员可处理并执行处罚
"""

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from models import db, Complaint, User, SharedItem
from utils.auth import login_required, admin_required
from utils.generator import generate_order_no

complaint_bp = Blueprint('complaint', __name__, url_prefix='/api/complaints')
admin_complaint_bp = Blueprint('admin_complaint', __name__, url_prefix='/api/admin/complaints')


# ============ 用户端 ============

@complaint_bp.route('', methods=['GET'])
@login_required
def get_user_complaints():
    """获取当前用户的投诉列表"""
    from utils.auth import verify_token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    user_id = user_info.get('user_id') if user_info else None

    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    status = request.args.get('status')

    query = Complaint.query
    if user_id:
        query = query.filter(Complaint.reporter_id == user_id)
    if status:
        query = query.filter(Complaint.status == status)

    pagination = query.order_by(Complaint.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )

    return jsonify({
        'code': 200,
        'data': {
            'list': [c.to_dict() for c in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@complaint_bp.route('', methods=['POST'])
@login_required
def create_complaint():
    """用户提交投诉"""
    from utils.auth import verify_token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)

    data = request.get_json() or {}
    complaint_type = data.get('type')

    if complaint_type not in ['item', 'user']:
        return jsonify({'code': 400, 'msg': '无效的投诉类型'}), 400

    target_item_id = data.get('target_item_id')
    target_user_id = data.get('target_user_id')

    if complaint_type == 'item' and not target_item_id:
        return jsonify({'code': 400, 'msg': '请指定被投诉物品'}), 400
    if complaint_type == 'user' and not target_user_id:
        return jsonify({'code': 400, 'msg': '请指定被投诉用户'}), 400

    # 获取目标信息
    target_item_name = None
    target_user_name = None
    target_user_phone = None
    if complaint_type == 'item' and target_item_id:
        item = SharedItem.query.get(target_item_id)
        if item:
            target_item_name = item.title
            target_user_id = target_user_id or item.owner_id
            owner = User.query.get(item.owner_id)
            if owner:
                target_user_name = owner.name
                target_user_phone = owner.phone
    if complaint_type == 'user' and target_user_id:
        target = User.query.get(target_user_id)
        if target:
            target_user_name = target.name
            target_user_phone = target.phone

    reporter_id = user_info.get('user_id') if user_info else None
    reporter_name = None
    reporter_phone = None
    if reporter_id:
        reporter = User.query.get(reporter_id)
        if reporter:
            reporter_name = reporter.name
            reporter_phone = reporter.phone

    complaint = Complaint(
        complaint_no=generate_order_no('TS'),
        type=complaint_type,
        target_item_id=target_item_id,
        target_user_id=target_user_id,
        target_user_name=target_user_name,
        target_user_phone=target_user_phone,
        reason=data.get('reason', '其他'),
        reason_detail=data.get('reason_detail', ''),
        reporter_id=reporter_id,
        reporter_name=data.get('reporter_name') or reporter_name,
        reporter_phone=data.get('reporter_phone') or reporter_phone,
        status='pending',
        priority=data.get('priority', 'medium')
    )

    db.session.add(complaint)
    db.session.commit()

    return jsonify({
        'code': 200,
        'msg': '投诉提交成功',
        'data': complaint.to_dict()
    })


@complaint_bp.route('/<int:complaint_id>', methods=['GET'])
@login_required
def get_complaint_detail(complaint_id):
    """获取投诉详情"""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'code': 404, 'msg': '投诉不存在'}), 404
    return jsonify({'code': 200, 'data': complaint.to_dict()})


# ============ 管理端 ============

@admin_complaint_bp.route('/stats', methods=['GET', 'POST'])
@admin_required
def get_stats():
    """获取投诉统计"""
    total = Complaint.query.count()
    pending = Complaint.query.filter_by(status='pending').count()
    processing = Complaint.query.filter_by(status='processing').count()
    resolved = Complaint.query.filter_by(status='resolved').count()
    urgent = Complaint.query.filter(Complaint.priority.in_(['urgent', 'high'])).count()
    return jsonify({
        'code': 200,
        'data': {
            'total': total,
            'pending': pending,
            'processing': processing,
            'resolved': resolved,
            'rejected': Complaint.query.filter_by(status='rejected').count(),
            'urgent': urgent
        }
    })


@admin_complaint_bp.route('', methods=['GET', 'POST'])
@admin_required
def list_complaints():
    """获取投诉列表"""
    data = request.get_json() if request.method == 'POST' else {}
    data = data or {}
    status = data.get('status') or request.args.get('status')
    complaint_type = data.get('type') or request.args.get('type')
    keyword = data.get('keyword') or request.args.get('keyword')
    page = data.get('page', 1) if isinstance(data.get('page'), int) else 1
    page_size = data.get('page_size', 50) if isinstance(data.get('page_size'), int) else 50

    query = Complaint.query
    if status and status != 'all':
        query = query.filter(Complaint.status == status)
    if complaint_type and complaint_type != 'all':
        query = query.filter(Complaint.type == complaint_type)
    if keyword:
        kw = f'%{keyword}%'
        from sqlalchemy import or_
        query = query.filter(or_(
            Complaint.complaint_no.like(kw),
            Complaint.reason.like(kw),
            Complaint.reason_detail.like(kw),
            Complaint.target_user_name.like(kw),
            Complaint.reporter_name.like(kw)
        ))

    pagination = query.order_by(Complaint.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    complaints = []
    for c in pagination.items:
        cd = c.to_dict()
        # 补充目标物品名称
        if c.type == 'item' and c.target_item_id:
            item = SharedItem.query.get(c.target_item_id)
            if item and not cd.get('target_item_name'):
                cd['target_item_name'] = item.title
        complaints.append(cd)

    return jsonify({
        'code': 200,
        'data': {
            'list': complaints,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@admin_complaint_bp.route('/<int:complaint_id>', methods=['GET'])
@admin_required
def admin_complaint_detail(complaint_id):
    """管理员获取投诉详情"""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'code': 404, 'msg': '投诉不存在'}), 404
    cd = complaint.to_dict()
    if complaint.type == 'item' and complaint.target_item_id:
        item = SharedItem.query.get(complaint.target_item_id)
        if item:
            cd['target_item_name'] = item.title
    return jsonify({'code': 200, 'data': cd})


@admin_complaint_bp.route('/<int:complaint_id>/process', methods=['POST'])
@admin_required
def process_complaint(complaint_id):
    """标记为处理中"""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'code': 404, 'msg': '投诉不存在'}), 404
    data = request.get_json() or {}
    complaint.status = 'processing'
    complaint.handle_result = data.get('result') or complaint.handle_result
    complaint.handle_time = datetime.now()
    db.session.commit()
    return jsonify({'code': 200, 'msg': '已标记处理中'})


@admin_complaint_bp.route('/<int:complaint_id>/resolve', methods=['POST'])
@admin_required
def resolve_complaint(complaint_id):
    """处理投诉并执行处罚"""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'code': 404, 'msg': '投诉不存在'}), 404

    data = request.get_json() or {}
    result = data.get('result') or '已处理'
    punishment = data.get('punishment')
    operator = data.get('operator')

    complaint.status = 'resolved'
    complaint.handle_result = result
    complaint.handle_time = datetime.now()
    complaint.handled_by = operator

    if punishment and punishment.get('type') and punishment['type'] != 'none':
        ptype = punishment['type']
        preason = punishment.get('reason') or complaint.reason
        ban_days = punishment.get('ban_days')
        complaint.punishment_type = ptype
        complaint.punishment_reason = preason
        complaint.ban_days = ban_days

        # 对用户封号
        if ptype == 'ban_user' and complaint.target_user_id:
            user = User.query.get(complaint.target_user_id)
            if user:
                user.account_status = 'banned'
                user.ban_reason = preason
                user.banned_by = operator
                user.ban_time = datetime.now()
                if ban_days:
                    user.banned_until = datetime.now() + timedelta(days=int(ban_days))

        if ptype == 'permanent_ban' and complaint.target_user_id:
            user = User.query.get(complaint.target_user_id)
            if user:
                user.account_status = 'permanent_banned'
                user.ban_reason = preason
                user.banned_by = operator
                user.ban_time = datetime.now()

        # 对物品下架
        if ptype == 'remove_item' and complaint.target_item_id:
            item = SharedItem.query.get(complaint.target_item_id)
            if item:
                item.status = 'removed'
                item.remove_reason = preason
                item.removed_by = operator

        # 对物品禁发
        if ptype == 'ban_post' and complaint.target_item_id:
            item = SharedItem.query.get(complaint.target_item_id)
            if item:
                item.status = 'posting_ban'
                item.ban_reason = preason
                item.banned_by = operator
                if ban_days:
                    item.banned_until = datetime.now() + timedelta(days=int(ban_days))

    db.session.commit()
    return jsonify({'code': 200, 'msg': '投诉已处理并执行处罚'})


@admin_complaint_bp.route('/<int:complaint_id>/reject', methods=['POST'])
@admin_required
def reject_complaint(complaint_id):
    """驳回投诉"""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'code': 404, 'msg': '投诉不存在'}), 404
    data = request.get_json() or {}
    complaint.status = 'rejected'
    complaint.handle_result = data.get('result') or '投诉不成立'
    complaint.handle_time = datetime.now()
    db.session.commit()
    return jsonify({'code': 200, 'msg': '投诉已驳回'})


@admin_complaint_bp.route('/<int:complaint_id>', methods=['DELETE'])
@admin_required
def delete_complaint(complaint_id):
    """删除投诉记录"""
    complaint = Complaint.query.get(complaint_id)
    if not complaint:
        return jsonify({'code': 404, 'msg': '投诉不存在'}), 404
    db.session.delete(complaint)
    db.session.commit()
    return jsonify({'code': 200, 'msg': '删除成功'})


# ============ 管理端：处罚用户 & 物品 ============

@admin_complaint_bp.route('/users/<int:user_id>/ban', methods=['POST'])
@admin_required
def ban_user(user_id):
    """对用户进行封号"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    data = request.get_json() or {}
    permanent = data.get('permanent') or data.get('ban_days') == -1
    ban_days = data.get('ban_days') if not permanent else None
    reason = data.get('reason') or '违反社区规定'
    operator = data.get('operator')

    if permanent:
        user.account_status = 'permanent_banned'
    else:
        user.account_status = 'banned'
        if ban_days:
            user.banned_until = datetime.now() + timedelta(days=int(ban_days))

    user.ban_reason = reason
    user.banned_by = operator
    user.ban_time = datetime.now()
    db.session.commit()
    return jsonify({'code': 200, 'msg': '已封号', 'data': {'account_status': user.account_status, 'ban_days': ban_days}})


@admin_complaint_bp.route('/users/<int:user_id>/unban', methods=['POST'])
@admin_required
def unban_user(user_id):
    """解除用户封号"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    user.account_status = 'normal'
    user.ban_reason = None
    user.banned_until = None
    user.banned_by = None
    user.ban_time = None
    db.session.commit()
    return jsonify({'code': 200, 'msg': '已解除封号'})


@admin_complaint_bp.route('/users/<int:user_id>/ban-post', methods=['POST'])
@admin_required
def ban_user_post(user_id):
    """限制用户发布"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    data = request.get_json() or {}
    user.post_banned = True
    user.post_ban_reason = data.get('reason') or '违反发布规定'
    ban_days = data.get('ban_days', 14)
    if ban_days:
        user.post_banned_until = datetime.now() + timedelta(days=int(ban_days))
    db.session.commit()
    return jsonify({'code': 200, 'msg': '已限制发布'})


@admin_complaint_bp.route('/items/<int:item_id>/remove', methods=['POST'])
@admin_required
def remove_item(item_id):
    """下架物品"""
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    data = request.get_json() or {}
    item.status = 'removed'
    item.remove_reason = data.get('reason') or '管理员下架'
    item.removed_by = data.get('operator')
    db.session.commit()
    return jsonify({'code': 200, 'msg': '物品已下架'})


@admin_complaint_bp.route('/items/<int:item_id>/restore', methods=['POST'])
@admin_required
def restore_item(item_id):
    """恢复物品上架"""
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    item.status = 'available'
    item.remove_reason = None
    item.removed_by = None
    item.ban_reason = None
    item.banned_by = None
    item.banned_until = None
    db.session.commit()
    return jsonify({'code': 200, 'msg': '物品已恢复'})


@admin_complaint_bp.route('/items/<int:item_id>/ban-post', methods=['POST'])
@admin_required
def ban_item_post(item_id):
    """禁止发布物品"""
    item = SharedItem.query.get(item_id)
    if not item:
        return jsonify({'code': 404, 'msg': '物品不存在'}), 404
    data = request.get_json() or {}
    item.status = 'posting_ban'
    item.ban_reason = data.get('reason') or '违规发布'
    item.banned_by = data.get('operator')
    ban_days = data.get('ban_days', 14)
    if ban_days:
        item.banned_until = datetime.now() + timedelta(days=int(ban_days))
    db.session.commit()
    return jsonify({'code': 200, 'msg': '已禁止该物品发布'})
