"""
邻里智联 - 独居老人监测路由
包含独居老人标记、终端使用记录分析、长时间未使用自动预警等功能
"""

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import and_
from models import db, User, ElderlyMonitor, UsageRecord
from utils.auth import login_required, admin_required

elderly_bp = Blueprint('elderly', __name__, url_prefix='/api/elderly')


@elderly_bp.route('', methods=['GET'])
def get_elderly_list():
    """获取独居老人列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    is_alerted = request.args.get('is_alerted')
    is_monitored = request.args.get('is_monitored')
    
    # 先获取标记为独居老人的用户
    query = User.query.filter(User.is_elderly_alone == True)
    
    pagination = query.order_by(User.create_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    elderly_list = []
    for user in pagination.items:
        user_dict = user.to_dict()
        
        # 获取监测信息
        monitor = ElderlyMonitor.query.filter_by(user_id=user.id).first()
        if monitor:
            user_dict['monitor'] = monitor.to_dict()
            
            # 计算距上次活动时间
            if monitor.last_normal_activity:
                hours_since = (datetime.now() - monitor.last_normal_activity).total_seconds() / 3600
                user_dict['hours_since_activity'] = round(hours_since, 1)
                user_dict['is_long_inactive'] = hours_since > monitor.no_activity_threshold_hours
            else:
                user_dict['hours_since_activity'] = None
                user_dict['is_long_inactive'] = False
        else:
            user_dict['monitor'] = None
            user_dict['hours_since_activity'] = None
            user_dict['is_long_inactive'] = False
        
        elderly_list.append(user_dict)
    
    return jsonify({
        'code': 200,
        'data': {
            'items': elderly_list,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@elderly_bp.route('/<int:user_id>', methods=['GET'])
def get_elderly_detail(user_id):
    """获取独居老人详情"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    if not user.is_elderly_alone:
        return jsonify({'code': 400, 'msg': '该用户不是独居老人'}), 400
    
    user_dict = user.to_dict()
    
    # 获取监测信息
    monitor = ElderlyMonitor.query.filter_by(user_id=user.id).first()
    if monitor:
        user_dict['monitor'] = monitor.to_dict()
        
        # 计算距上次活动时间
        if monitor.last_normal_activity:
            hours_since = (datetime.now() - monitor.last_normal_activity).total_seconds() / 3600
            user_dict['hours_since_activity'] = round(hours_since, 1)
        else:
            user_dict['hours_since_activity'] = None
    else:
        user_dict['monitor'] = None
        user_dict['hours_since_activity'] = None
    
    # 获取最近的使用记录
    recent_usage = UsageRecord.query.filter_by(user_id=user.id).order_by(
        UsageRecord.create_time.desc()
    ).limit(10).all()
    user_dict['recent_usage'] = [r.to_dict() for r in recent_usage]
    
    # 获取最近的活动记录（用于分析）
    week_ago = datetime.now() - timedelta(days=7)
    recent_records = UsageRecord.query.filter(
        UsageRecord.user_id == user_id,
        UsageRecord.create_time >= week_ago
    ).order_by(UsageRecord.create_time.desc()).all()
    
    user_dict['weekly_usage_count'] = len(recent_records)
    
    return jsonify({
        'code': 200,
        'data': user_dict
    })


@elderly_bp.route('/monitor', methods=['POST'])
@admin_required
def create_or_update_monitor():
    """创建或更新独居老人监测配置"""
    data = request.get_json()
    user_id = data.get('user_id')
    
    if not user_id:
        return jsonify({'code': 400, 'msg': '用户ID不能为空'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    # 标记为独居老人
    user.is_elderly_alone = True
    
    # 创建或更新监测配置
    monitor = ElderlyMonitor.query.filter_by(user_id=user_id).first()
    
    if not monitor:
        monitor = ElderlyMonitor(user_id=user_id)
        db.session.add(monitor)
    
    if 'contact_name' in data:
        monitor.contact_name = data['contact_name']
    if 'contact_phone' in data:
        monitor.contact_phone = data['contact_phone']
    if 'contact_relation' in data:
        monitor.contact_relation = data['contact_relation']
    if 'no_activity_threshold_hours' in data:
        monitor.no_activity_threshold_hours = data['no_activity_threshold_hours']
    if 'check_interval_hours' in data:
        monitor.check_interval_hours = data['check_interval_hours']
    if 'is_monitored' in data:
        monitor.is_monitored = data['is_monitored']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '监测配置已保存',
        'data': monitor.to_dict()
    })


@elderly_bp.route('/monitor/<int:user_id>', methods=['PUT'])
@admin_required
def update_monitor_config(user_id):
    """更新监测配置"""
    monitor = ElderlyMonitor.query.filter_by(user_id=user_id).first()
    if not monitor:
        return jsonify({'code': 404, 'msg': '监测配置不存在'}), 404
    
    data = request.get_json()
    
    if 'contact_name' in data:
        monitor.contact_name = data['contact_name']
    if 'contact_phone' in data:
        monitor.contact_phone = data['contact_phone']
    if 'contact_relation' in data:
        monitor.contact_relation = data['contact_relation']
    if 'no_activity_threshold_hours' in data:
        monitor.no_activity_threshold_hours = data['no_activity_threshold_hours']
    if 'check_interval_hours' in data:
        monitor.check_interval_hours = data['check_interval_hours']
    if 'is_monitored' in data:
        monitor.is_monitored = data['is_monitored']
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '更新成功',
        'data': monitor.to_dict()
    })


@elderly_bp.route('/activity/record', methods=['POST'])
def record_activity():
    """记录老人活动（从终端自动调用）"""
    data = request.get_json()
    user_id = data.get('user_id')
    terminal_id = data.get('terminal_id')
    activity_type = data.get('activity_type', 'touch')
    
    if not user_id:
        return jsonify({'code': 400, 'msg': '用户ID不能为空'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    # 更新用户最后活跃时间
    user.last_active_time = datetime.now()
    
    # 记录使用
    usage_record = UsageRecord(
        user_id=user_id,
        terminal_id=terminal_id,
        terminal_location=data.get('terminal_location'),
        usage_type=activity_type,
        description=data.get('description')
    )
    db.session.add(usage_record)
    
    # 更新监测记录
    monitor = ElderlyMonitor.query.filter_by(user_id=user_id).first()
    if monitor:
        monitor.last_normal_activity = datetime.now()
        # 如果之前有预警，取消预警
        if monitor.is_alerted:
            monitor.is_alerted = False
            monitor.alert_time = None
            monitor.alert_reason = None
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '活动已记录'
    })


@elderly_bp.route('/check_inactive', methods=['POST'])
@admin_required
def check_inactive_elderly():
    """检查不活跃老人并发送预警"""
    now = datetime.now()
    
    # 获取所有正在监测的老人
    monitors = ElderlyMonitor.query.filter(
        ElderlyMonitor.is_monitored == True,
        ElderlyMonitor.is_alerted == False
    ).all()
    
    alerted_list = []
    
    for monitor in monitors:
        if monitor.last_normal_activity:
            hours_since = (now - monitor.last_normal_activity).total_seconds() / 3600
            
            if hours_since >= monitor.no_activity_threshold_hours:
                # 触发预警
                monitor.is_alerted = True
                monitor.alert_time = now
                monitor.alert_reason = f'超过{hours_since:.0f}小时无活动'
                
                user = User.query.get(monitor.user_id)
                if user:
                    alerted_list.append({
                        'user_id': user.id,
                        'user_name': user.name,
                        'phone': user.phone,
                        'contact_name': monitor.contact_name,
                        'contact_phone': monitor.contact_phone,
                        'contact_relation': monitor.contact_relation,
                        'hours_since_activity': round(hours_since, 1),
                        'threshold_hours': monitor.no_activity_threshold_hours
                    })
    
    db.session.commit()
    
    # 在实际项目中，这里应该发送短信或推送通知
    # 模拟发送预警
    for alert in alerted_list:
        print(f"预警: {alert['user_name']} 已超过{alert['hours_since_activity']}小时无活动")
    
    return jsonify({
        'code': 200,
        'msg': f'检查完成，产生 {len(alerted_list)} 条预警',
        'data': alerted_list
    })


@elderly_bp.route('/alerts', methods=['GET'])
def get_alerts():
    """获取所有预警列表"""
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 20, type=int)
    is_handled = request.args.get('is_handled')  # true/false
    
    query = ElderlyMonitor.query.filter(ElderlyMonitor.is_alerted == True)
    
    pagination = query.order_by(ElderlyMonitor.alert_time.desc()).paginate(
        page=page, per_page=page_size, error_out=False
    )
    
    alerts = []
    for monitor in pagination.items:
        alert_dict = monitor.to_dict()
        user = User.query.get(monitor.user_id)
        if user:
            alert_dict['user_name'] = user.name
            alert_dict['user_phone'] = user.phone
            alert_dict['user_building'] = user.building
            alert_dict['user_unit'] = user.unit
        alerts.append(alert_dict)
    
    return jsonify({
        'code': 200,
        'data': {
            'items': alerts,
            'total': pagination.total,
            'page': page,
            'page_size': page_size
        }
    })


@elderly_bp.route('/alerts/<int:alert_id>/handle', methods=['POST'])
@admin_required
def handle_alert(alert_id):
    """处理预警"""
    monitor = ElderlyMonitor.query.get(alert_id)
    if not monitor:
        return jsonify({'code': 404, 'msg': '预警不存在'}), 404
    
    if not monitor.is_alerted:
        return jsonify({'code': 400, 'msg': '该记录未触发预警'}), 400
    
    data = request.get_json()
    
    # 处理预警（取消预警状态）
    monitor.is_alerted = False
    monitor.alert_time = None
    monitor.alert_reason = None
    
    # 如果需要更新最后活动时间
    if data.get('update_last_activity'):
        monitor.last_normal_activity = datetime.now()
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '预警已处理',
        'data': monitor.to_dict()
    })


@elderly_bp.route('/usage_analysis/<int:user_id>', methods=['GET'])
def get_usage_analysis(user_id):
    """获取老人使用终端的行为分析"""
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    days = request.args.get('days', 7, type=int)
    start_date = datetime.now() - timedelta(days=days)
    
    # 获取使用记录
    records = UsageRecord.query.filter(
        UsageRecord.user_id == user_id,
        UsageRecord.create_time >= start_date
    ).order_by(UsageRecord.create_time.desc()).all()
    
    # 按日期统计
    daily_usage = {}
    for i in range(days):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        daily_usage[date] = 0
    
    for record in records:
        if record.create_time:
            date = record.create_time.strftime('%Y-%m-%d')
            if date in daily_usage:
                daily_usage[date] += 1
    
    # 按类型统计
    type_stats = {}
    for record in records:
        if record.usage_type:
            type_stats[record.usage_type] = type_stats.get(record.usage_type, 0) + 1
    
    # 按小时统计
    hour_stats = {str(h): 0 for h in range(24)}
    for record in records:
        if record.create_time:
            hour = record.create_time.hour
            hour_stats[str(hour)] += 1
    
    # 平均每日使用次数
    total_usage = len(records)
    avg_daily_usage = round(total_usage / days, 1)
    
    # 使用时段分析
    morning_usage = sum(hour_stats[str(h)] for h in range(6, 12))
    afternoon_usage = sum(hour_stats[str(h)] for h in range(12, 18))
    evening_usage = sum(hour_stats[str(h)] for h in range(18, 24))
    night_usage = sum(hour_stats[str(h)] for h in range(0, 6))
    
    return jsonify({
        'code': 200,
        'data': {
            'total_usage': total_usage,
            'avg_daily_usage': avg_daily_usage,
            'daily_usage': daily_usage,
            'type_stats': type_stats,
            'hour_stats': hour_stats,
            'period_analysis': {
                'morning': morning_usage,
                'afternoon': afternoon_usage,
                'evening': evening_usage,
                'night': night_usage
            },
            'records': [r.to_dict() for r in records[:20]]  # 最近20条记录
        }
    })


@elderly_bp.route('/mark', methods=['POST'])
@admin_required
def mark_elderly():
    """标记/取消标记独居老人"""
    data = request.get_json()
    user_id = data.get('user_id')
    is_elderly = data.get('is_elderly', True)
    
    if not user_id:
        return jsonify({'code': 400, 'msg': '用户ID不能为空'}), 400
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'code': 404, 'msg': '用户不存在'}), 404
    
    user.is_elderly_alone = is_elderly
    
    # 如果取消标记，同时关闭监测
    if not is_elderly:
        monitor = ElderlyMonitor.query.filter_by(user_id=user_id).first()
        if monitor:
            monitor.is_monitored = False
    
    db.session.commit()
    
    return jsonify({
        'code': 200,
        'msg': '操作成功',
        'data': user.to_dict()
    })
