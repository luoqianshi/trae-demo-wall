from flask import Blueprint, request, jsonify
from models import User, PointRecord, PointExchange, ExchangeGoods, db
from utils.auth import get_current_user, login_required, admin_required
from datetime import datetime


points_bp = Blueprint('points', __name__, url_prefix='/api/points')


def get_rule_display(rule_code):
    rule_map = {
        'register': '用户注册',
        'daily_checkin': '每日签到',
        'publish_item': '发布共享物品',
        'lend_item': '借出物品',
        'repair_feedback': '报修反馈',
        'help_others': '帮助邻居',
        'elderly_care': '关爱独居老人',
        'exchange_consume': '积分兑换',
    }
    return rule_map.get(rule_code, rule_code)


@points_bp.route('/rules', methods=['GET'])
def get_points_rules():
    try:
        rules = [
            {'code': 'register', 'name': '用户注册', 'points': 20, 'description': '新用户首次注册账号，一次性奖励积分'},
            {'code': 'daily_checkin', 'name': '每日签到', 'points': 2, 'description': '每天登录并签到，每日限1次'},
            {'code': 'publish_item', 'name': '发布共享物品', 'points': 5, 'description': '成功发布1条共享物品信息'},
            {'code': 'lend_item', 'name': '借出物品', 'points': 10, 'description': '成功将物品借给邻居并完成归还'},
            {'code': 'repair_feedback', 'name': '报修反馈', 'points': 5, 'description': '完成维修工单后提供反馈'},
            {'code': 'help_others', 'name': '帮助邻居', 'points': 15, 'description': '通过帮助邻居获得积分奖励'},
            {'code': 'elderly_care', 'name': '关爱独居老人', 'points': 20, 'description': '参与关爱独居老人活动'},
        ]
        return jsonify({'code': 0, 'msg': 'success', 'data': {'rules': rules, 'total_rules': len(rules)}})
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'获取积分规则失败：{str(e)}'}), 500


@points_bp.route('/records', methods=['GET'])
@login_required
def get_point_records():
    try:
        current_user = get_current_user()
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        record_type = request.args.get('type', 'all')

        query = PointRecord.query.filter_by(user_id=current_user.id)
        if record_type != 'all':
            query = query.filter_by(type=record_type)

        query = query.order_by(PointRecord.create_time.desc())
        total = query.count()
        records = query.offset((page - 1) * page_size).limit(page_size).all()

        return jsonify({
            'code': 0,
            'msg': 'success',
            'data': {
                'list': [r.to_dict() for r in records],
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
                'current_balance': current_user.points_balance,
                'total_earn': sum(r.points for r in PointRecord.query.filter_by(user_id=current_user.id, type='earn').all()),
                'total_spend': sum(r.points for r in PointRecord.query.filter_by(user_id=current_user.id, type='spend').all()),
            }
        })
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'获取积分记录失败：{str(e)}'}), 500


@points_bp.route('/earn', methods=['POST'])
@login_required
def earn_points():
    try:
        data = request.get_json()
        action = data.get('action', 'daily_checkin')
        description = data.get('description', get_rule_display(action))
        points_map = {'register': 20, 'daily_checkin': 2, 'publish_item': 5, 'lend_item': 10, 'repair_feedback': 5, 'help_others': 15, 'elderly_care': 20}
        points = points_map.get(action, 0)

        if points <= 0:
            return jsonify({'code': 400, 'msg': '无效的积分操作类型'}), 400

        current_user = get_current_user()

        if action == 'daily_checkin':
            today = datetime.now().date()
            existing = PointRecord.query.filter(PointRecord.user_id == current_user.id, PointRecord.action == 'daily_checkin').all()
            for r in existing:
                if r.create_time and r.create_time.date() == today:
                    return jsonify({'code': 400, 'msg': '今日已签到，请勿重复签到'}), 400

        record = PointRecord(user_id=current_user.id, type='earn', action=action, points=points, balance=current_user.points_balance + points, description=description)
        db.session.add(record)
        current_user.points_balance += points
        db.session.commit()

        return jsonify({'code': 0, 'msg': '积分获得成功', 'data': {'points': points, 'new_balance': current_user.points_balance, 'record': record.to_dict()}})
    except Exception as e:
        db.session.rollback()
        return jsonify({'code': 500, 'msg': f'积分获得失败：{str(e)}'}), 500


@points_bp.route('/goods', methods=['GET'])
def get_exchange_goods():
    try:
        category = request.args.get('category', '')
        query = ExchangeGoods.query.filter_by(is_active=True)
        if category:
            query = query.filter_by(category=category)
        goods = query.order_by(ExchangeGoods.points.asc()).all()
        categories = [
            {'code': 'gift', 'name': '礼品类'},
            {'code': 'daily', 'name': '日用品'},
            {'code': 'service', 'name': '服务类'},
            {'code': 'food', 'name': '食品类'},
        ]
        return jsonify({
            'code': 0,
            'msg': 'success',
            'data': {
                'goods': [g.to_dict() for g in goods],
                'categories': categories,
                'total': len(goods),
            }
        })
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'获取兑换商品失败：{str(e)}'}), 500


@points_bp.route('/exchange', methods=['POST'])
@login_required
def exchange_goods():
    try:
        data = request.get_json()
        goods_id = data.get('goods_id')
        quantity = int(data.get('quantity', 1))

        if not goods_id or quantity <= 0:
            return jsonify({'code': 400, 'msg': '请填写完整的兑换信息'}), 400

        goods = ExchangeGoods.query.get(goods_id)
        if not goods:
            return jsonify({'code': 404, 'msg': '商品不存在'}), 404
        if not goods.is_active:
            return jsonify({'code': 400, 'msg': '商品暂不可兑换'}), 400

        total_cost = goods.points * quantity
        current_user = get_current_user()

        if current_user.points_balance < total_cost:
            return jsonify({'code': 400, 'msg': f'积分不足，当前积分：{current_user.points_balance}，需：{total_cost}'}), 400

        if goods.stock < quantity:
            return jsonify({'code': 400, 'msg': f'库存不足，当前库存：{goods.stock}'}), 400

        exchange_no = f"EX{datetime.now().strftime('%Y%m%d%H%M%S')}{current_user.id:03d}"
        exchange = PointExchange(exchange_no=exchange_no, user_id=current_user.id, goods_id=goods.id, goods_name=goods.name, points_cost=total_cost, quantity=quantity, status='pending')
        db.session.add(exchange)

        record = PointRecord(user_id=current_user.id, type='spend', action='exchange_consume', points=total_cost, balance=current_user.points_balance - total_cost, description=f'兑换{goods.name}')
        db.session.add(record)

        current_user.points_balance -= total_cost
        goods.stock -= quantity
        db.session.commit()

        return jsonify({'code': 0, 'msg': '兑换成功', 'data': {'exchange_no': exchange_no, 'goods_name': goods.name, 'points_cost': total_cost, 'new_balance': current_user.points_balance}})
    except Exception as e:
        db.session.rollback()
        return jsonify({'code': 500, 'msg': f'兑换失败：{str(e)}'}), 500


@points_bp.route('/exchanges', methods=['GET'])
@login_required
def get_my_exchanges():
    try:
        current_user = get_current_user()
        status = request.args.get('status', '')
        query = PointExchange.query.filter_by(user_id=current_user.id)
        if status:
            query = query.filter_by(status=status)
        exchanges = query.order_by(PointExchange.create_time.desc()).all()
        return jsonify({'code': 0, 'msg': 'success', 'data': {'list': [e.to_dict() for e in exchanges], 'total': len(exchanges)}})
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'获取兑换记录失败：{str(e)}'}), 500


@points_bp.route('/all-records', methods=['GET'])
@admin_required
def get_all_records():
    try:
        page = int(request.args.get('page', 1))
        page_size = int(request.args.get('page_size', 20))
        user_id = request.args.get('user_id', '')
        record_type = request.args.get('type', 'all')

        query = PointRecord.query
        if user_id:
            query = query.filter_by(user_id=int(user_id))
        if record_type != 'all':
            query = query.filter_by(type=record_type)
        query = query.order_by(PointRecord.create_time.desc())

        total = query.count()
        records = query.offset((page - 1) * page_size).limit(page_size).all()
        users = User.query.with_entities(User.id, User.username).all()
        user_map = {u.id: u.username for u in users}

        for r in records:
            setattr(r, 'username', user_map.get(r.user_id, ''))

        return jsonify({
            'code': 0,
            'msg': 'success',
            'data': {
                'list': [r.to_dict() for r in records],
                'total': total,
                'page': page,
                'page_size': page_size,
                'total_pages': (total + page_size - 1) // page_size,
            }
        })
    except Exception as e:
        return jsonify({'code': 500, 'msg': f'获取记录失败：{str(e)}'}), 500
