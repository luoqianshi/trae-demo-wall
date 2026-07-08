"""
邻里智联 - 认证路由
包含用户注册、登录、验证码等功能
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from models import db, User
from utils.auth import (
    generate_token, hash_password, verify_password, 
    generate_verification_code, store_verification_code, 
    verify_verification_code, login_required, admin_required
)

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册 - 新用户注册后默认为待审核状态"""
    data = request.get_json()
    
    phone = data.get('phone')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'resident')
    address = data.get('address')
    building = data.get('building')
    unit = data.get('unit')
    room = data.get('room')
    
    if not phone or not password:
        return jsonify({'code': 400, 'msg': '手机号和密码不能为空'}), 400
    
    # 检查手机号是否已注册
    existing_user = User.query.filter_by(phone=phone).first()
    if existing_user:
        return jsonify({'code': 400, 'msg': '该手机号已注册'}), 400
    
    # 检查是否是第一个用户
    user_count = User.query.count()
    if user_count == 0:
        review_status = 'approved'
    else:
        review_status = 'pending'
    
    # 创建用户
    user = User(
        phone=phone,
        password_hash=hash_password(password),
        name=name,
        role=role,
        address=address,
        building=building,
        unit=unit,
        room=room,
        review_status=review_status
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'code': 200, 
        'msg': '注册成功',
        'data': {
            'id': user.id,
            'phone': user.phone,
            'name': user.name,
            'role': user.role,
            'status': review_status
        }
    })


@auth_bp.route('/login', methods=['POST'])
def login():
    """密码登录 - 检查审核状态"""
    data = request.get_json()
    
    phone = data.get('phone')
    password = data.get('password')
    
    if not phone or not password:
        return jsonify({'code': 400, 'msg': '手机号和密码不能为空'}), 400
    
    user = User.query.filter_by(phone=phone).first()
    if not user:
        return jsonify({'code': 401, 'msg': '用户不存在'}), 401
    
    if not verify_password(password, user.password_hash):
        return jsonify({'code': 401, 'msg': '密码错误'}), 401
    
    if not user.is_active:
        return jsonify({'code': 403, 'msg': '账号已被禁用'}), 403
    
    # 返回审核状态 - 待审核和被驳回时返回状态信息
    if user.review_status == 'pending':
        return jsonify({
            'code': 200,
            'msg': '账号待审核',
            'data': {
                'status': 'pending',
                'message': '您的账号正在审核中，请耐心等待网格员审核'
            }
        })
    
    if user.review_status == 'rejected':
        return jsonify({
            'code': 200,
            'msg': '账号审核未通过',
            'data': {
                'status': 'rejected',
                'message': user.review_remark or '请完善资料后重新注册'
            }
        })
    
    # 更新最后活跃时间
    user.last_active_time = datetime.now()
    db.session.commit()
    
    token = generate_token(user.id, user.role)
    
    return jsonify({
        'code': 200,
        'msg': '登录成功',
        'data': {
            'token': token,
            'user': user.to_dict(),
            'status': 'approved'
        }
    })


@auth_bp.route('/login/password', methods=['POST'])
def login_by_password():
    """手机号密码登录 - 与 /login 相同"""
    return login()


@auth_bp.route('/login/code', methods=['POST'])
def login_by_code():
    """验证码登录"""
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')
    
    if not phone or not code:
        return jsonify({'code': 400, 'msg': '手机号和验证码不能为空'}), 400
    
    user = User.query.filter_by(phone=phone).first()
    if not user:
        # 自动创建新账号，待审核
        user = User(
            phone=phone,
            password_hash=hash_password(phone[-6:]),
            name=phone[-4:],
            role='resident',
            review_status='pending'
        )
        db.session.add(user)
        db.session.commit()
        return jsonify({
            'code': 200,
            'msg': '账号已创建，等待审核',
            'data': {
                'status': 'pending',
                'message': '您的账号已提交，等待网格员审核'
            }
        })
    
    if not user.is_active:
        return jsonify({'code': 403, 'msg': '账号已被禁用'}), 403
    
    if user.review_status == 'pending':
        return jsonify({
            'code': 200,
            'msg': '账号待审核',
            'data': {'status': 'pending', 'message': '您的账号正在审核中'}
        })
    
    if user.review_status == 'rejected':
        return jsonify({
            'code': 200,
            'msg': '账号审核未通过',
            'data': {'status': 'rejected', 'message': user.review_remark or '请完善资料后重新注册'}
        })
    
    user.last_active_time = datetime.now()
    db.session.commit()
    
    token = generate_token(user.id, user.role)
    
    return jsonify({
        'code': 200,
        'msg': '登录成功',
        'data': {
            'token': token,
            'user': user.to_dict(),
            'status': 'approved'
        }
    })


@auth_bp.route('/send_code', methods=['POST'])
def send_code():
    """发送验证码"""
    data = request.get_json()
    phone = data.get('phone')
    
    if not phone:
        return jsonify({'code': 400, 'msg': '手机号不能为空'}), 400
    
    # 生成验证码
    code = generate_verification_code()
    store_verification_code(phone, code)
    
    # 实际项目中这里应该调用短信网关发送验证码
    # 现在模拟发送成功
    print(f"验证码已发送至 {phone}: {code}")
    
    return jsonify({
        'code': 200,
        'msg': '验证码已发送',
        'data': {'code': code}  # 开发环境返回验证码方便测试
    })


@auth_bp.route('/verify_code', methods=['POST'])
def verify_code():
    """验证验证码"""
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')
    
    if not phone or not code:
        return jsonify({'code': 400, 'msg': '手机号和验证码不能为空'}), 400
    
    if verify_verification_code(phone, code):
        return jsonify({'code': 200, 'msg': '验证成功'})
    else:
        return jsonify({'code': 400, 'msg': '验证码错误或已过期'}), 400


@auth_bp.route('/sms_login', methods=['POST'])
def sms_login():
    """短信验证码登录"""
    data = request.get_json()
    phone = data.get('phone')
    code = data.get('code')
    
    if not phone or not code:
        return jsonify({'code': 400, 'msg': '手机号和验证码不能为空'}), 400
    
    if not verify_verification_code(phone, code):
        return jsonify({'code': 400, 'msg': '验证码错误或已过期'}), 400
    
    # 查找或创建用户
    user = User.query.filter_by(phone=phone).first()
    if not user:
        # 如果用户不存在，自动创建（首次短信登录）
        user = User(
            phone=phone,
            password_hash=hash_password(phone[-6:]),  # 默认密码为手机号后6位
            name=phone[-4:],
            role='resident'
        )
        db.session.add(user)
        db.session.commit()
    
    # 更新最后活跃时间
    user.last_active_time = datetime.now()
    db.session.commit()
    
    # 生成token
    token = generate_token(user.id, user.role)
    
    return jsonify({
        'code': 200,
        'msg': '登录成功',
        'data': {
            'token': token,
            'user': user.to_dict()
        }
    })


@auth_bp.route('/user_info', methods=['GET'])
@login_required
def get_user_info():
    """获取当前用户信息"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    user = User.query.get(user_info['user_id'])
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    return jsonify({
        'code': 200,
        'data': user.to_dict()
    })


@auth_bp.route('/update_profile', methods=['PUT'])
@login_required
def update_profile():
    """更新用户资料"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    user = User.query.get(user_info['user_id'])
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    data = request.get_json()
    
    # 允许更新的字段
    if 'name' in data:
        user.name = data['name']
    if 'avatar' in data:
        user.avatar = data['avatar']
    if 'address' in data:
        user.address = data['address']
    if 'building' in data:
        user.building = data['building']
    if 'unit' in data:
        user.unit = data['unit']
    if 'room' in data:
        user.room = data['room']
    if 'is_elderly_alone' in data:
        user.is_elderly_alone = data['is_elderly_alone']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '更新成功',
        'data': user.to_dict()
    })


@auth_bp.route('/change_password', methods=['POST'])
@login_required
def change_password():
    """修改密码"""
    from utils.auth import verify_token
    
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_info = verify_token(token)
    
    user = User.query.get(user_info['user_id'])
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    data = request.get_json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    
    if not verify_password(old_password, user.password_hash):
        return jsonify({'code': 400, 'msg': '原密码错误'}), 400
    
    user.password_hash = hash_password(new_password)
    db.session.commit()
    
    return jsonify({'code': 200, 'msg': '密码修改成功'})


# ==================== 管理员接口 ====================

@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """获取用户列表（管理员）"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    role = request.args.get('role')
    keyword = request.args.get('keyword')
    
    query = User.query
    
    if role:
        query = query.filter(User.role == role)
    if keyword:
        query = query.filter(
            db.or_(
                User.name.like(f'%{keyword}%'),
                User.phone.like(f'%{keyword}%'),
                User.address.like(f'%{keyword}%')
            )
        )
    
    pagination = query.order_by(User.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [u.to_dict() for u in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """更新用户信息（管理员）"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        user.name = data['name']
    if 'role' in data:
        user.role = data['role']
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'is_elderly_alone' in data:
        user.is_elderly_alone = data['is_elderly_alone']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '更新成功',
        'data': user.to_dict()
    })


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(user_id):
    """删除用户（管理员）"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    user.is_active = False
    db.session.commit()
    
    return jsonify({'code': 200, 'msg': '删除成功'})


# ==================== 账号审核接口 ====================

@auth_bp.route('/users/pending_review', methods=['GET'])
@admin_required
def get_pending_review_users():
    """获取待审核的用户列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    
    query = User.query.filter(User.review_status == 'pending')
    pagination = query.order_by(User.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    return jsonify({
        'code': 200,
        'data': {
            'items': [u.to_dict() for u in pagination.items],
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@auth_bp.route('/users/<int:user_id>/review', methods=['POST'])
@admin_required
def review_user(user_id):
    """审核用户账号"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    data = request.get_json()
    action = data.get('action')
    remark = data.get('remark', '')
    
    from utils.auth import verify_token
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    reviewer_info = verify_token(token)
    reviewer_id = reviewer_info.get('user_id') if reviewer_info else None
    
    if action == 'approve':
        user.review_status = 'approved'
        user.review_remark = remark or '审核通过'
        user.is_active = True
    elif action == 'reject':
        user.review_status = 'rejected'
        user.review_remark = remark or '信息不完整，请完善后重新注册'
    else:
        return jsonify({'code': 400, 'msg': '无效的审核操作'}), 400
    
    user.reviewed_by = reviewer_id
    user.review_time = datetime.now()
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '审核成功',
        'data': {'user_id': user.id, 'status': user.review_status}
    })


@auth_bp.route('/users/review_stats', methods=['GET'])
@admin_required
def get_review_stats():
    """获取审核统计"""
    pending = User.query.filter(User.review_status == 'pending').count()
    approved = User.query.filter(User.review_status == 'approved').count()
    rejected = User.query.filter(User.review_status == 'rejected').count()
    total = User.query.count()
    
    return jsonify({
        'code': 200,
        'data': {
            'total': total,
            'pending': pending,
            'approved': approved,
            'rejected': rejected
        }
    })
