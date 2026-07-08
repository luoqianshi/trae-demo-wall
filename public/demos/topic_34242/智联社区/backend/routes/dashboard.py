"""
邻里智联 - 数据看板路由
包含隐患统计、诉求统计、居民活跃度、独居老人监测状态等
"""

from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from sqlalchemy import func, and_
from models import db, User, WorkOrder, Appeal, SharedItem, Notice, ElderlyMonitor, UsageRecord

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')


@dashboard_bp.route('/stats', methods=['GET'])
def get_overall_stats():
    """获取整体统计数据"""
    
    # 用户统计
    total_users = User.query.filter(User.is_active == True).count()
    resident_count = User.query.filter(User.is_active == True, User.role == 'resident').count()
    grid_admin_count = User.query.filter(User.is_active == True, User.role == 'grid_admin').count()
    
    # 工单统计
    total_workorders = WorkOrder.query.count()
    pending_workorders = WorkOrder.query.filter(WorkOrder.status == 'pending').count()
    processing_workorders = WorkOrder.query.filter(WorkOrder.status == 'processing').count()
    completed_workorders = WorkOrder.query.filter(WorkOrder.status == 'completed').count()
    
    # 诉求统计
    total_appeals = Appeal.query.count()
    pending_appeals = Appeal.query.filter(Appeal.status == 'pending').count()
    
    # 共享物品统计
    total_shared_items = SharedItem.query.count()
    available_items = SharedItem.query.filter(SharedItem.status == 'available').count()
    
    # 通知统计
    total_notices = Notice.query.filter(Notice.is_published == True).count()
    
    # 独居老人统计
    elderly_count = User.query.filter(User.is_active == True, User.is_elderly_alone == True).count()
    monitored_elderly = ElderlyMonitor.query.filter(ElderlyMonitor.is_monitored == True).count()
    alerted_elderly = ElderlyMonitor.query.filter(ElderlyMonitor.is_alerted == True).count()
    
    return jsonify({
        'code': 200,
        'data': {
            'users': {
                'total': total_users,
                'residents': resident_count,
                'grid_admins': grid_admin_count
            },
            'workorders': {
                'total': total_workorders,
                'pending': pending_workorders,
                'processing': processing_workorders,
                'completed': completed_workorders,
                'completion_rate': round(completed_workorders / total_workorders * 100, 1) if total_workorders > 0 else 0
            },
            'appeals': {
                'total': total_appeals,
                'pending': pending_appeals
            },
            'shared_items': {
                'total': total_shared_items,
                'available': available_items
            },
            'notices': {
                'total': total_notices
            },
            'elderly': {
                'total': elderly_count,
                'monitored': monitored_elderly,
                'alerted': alerted_elderly
            }
        }
    })


@dashboard_bp.route('/workorder_stats', methods=['GET'])
def get_workorder_stats():
    """获取工单详细统计"""
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
    
    # 按楼栋统计
    building_stats = db.session.query(
        WorkOrder.building,
        func.count(WorkOrder.id)
    ).filter(WorkOrder.building != None).group_by(WorkOrder.building).all()
    
    # 本月趋势
    today = datetime.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0)
    daily_stats = []
    
    for i in range(30):
        day_start = month_start + timedelta(days=i)
        if day_start > today:
            break
        day_end = day_start + timedelta(days=1)
        count = WorkOrder.query.filter(
            WorkOrder.create_time >= day_start,
            WorkOrder.create_time < day_end
        ).count()
        daily_stats.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'count': count
        })
    
    return jsonify({
        'code': 200,
        'data': {
            'by_status': {s: c for s, c in status_stats},
            'by_type': {t: c for t, c in type_stats},
            'by_priority': {p: c for p, c in priority_stats},
            'by_building': {b: c for b, c in building_stats},
            'daily_trend': daily_stats
        }
    })


@dashboard_bp.route('/appeal_stats', methods=['GET'])
def get_appeal_stats():
    """获取诉求详细统计"""
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
    
    # 按楼栋统计
    building_stats = db.session.query(
        Appeal.building,
        func.count(Appeal.id)
    ).filter(Appeal.building != None).group_by(Appeal.building).all()
    
    return jsonify({
        'code': 200,
        'data': {
            'by_status': {s: c for s, c in status_stats},
            'by_type': {t: c for t, c in type_stats},
            'by_category': {c: n for c, n in category_stats},
            'by_building': {b: c for b, c in building_stats}
        }
    })


@dashboard_bp.route('/activity_stats', methods=['GET'])
def get_activity_stats():
    """获取居民活跃度统计"""
    today = datetime.now()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # 日活跃用户
    daily_active = User.query.filter(
        User.last_active_time >= today.replace(hour=0, minute=0, second=0)
    ).count()
    
    # 周活跃用户
    weekly_active = User.query.filter(
        User.last_active_time >= week_ago
    ).count()
    
    # 月活跃用户
    monthly_active = User.query.filter(
        User.last_active_time >= month_ago
    ).count()
    
    # 总用户数
    total_users = User.query.filter(User.is_active == True, User.role == 'resident').count()
    
    # 每日活跃趋势
    daily_stats = []
    for i in range(14):
        day_start = (today - timedelta(days=i)).replace(hour=0, minute=0, second=0)
        day_end = day_start + timedelta(days=1)
        count = User.query.filter(
            User.last_active_time >= day_start,
            User.last_active_time < day_end
        ).count()
        daily_stats.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'count': count
        })
    
    daily_stats.reverse()
    
    # 活跃时段分布
    usage_records = UsageRecord.query.filter(
        UsageRecord.create_time >= week_ago
    ).all()
    
    hour_distribution = {str(h): 0 for h in range(24)}
    for record in usage_records:
        if record.create_time:
            hour = record.create_time.hour
            hour_distribution[str(hour)] += 1
    
    return jsonify({
        'code': 200,
        'data': {
            'daily_active': daily_active,
            'weekly_active': weekly_active,
            'monthly_active': monthly_active,
            'total_users': total_users,
            'active_rate': round(monthly_active / total_users * 100, 1) if total_users > 0 else 0,
            'daily_trend': daily_stats,
            'hour_distribution': hour_distribution
        }
    })


@dashboard_bp.route('/elderly_stats', methods=['GET'])
def get_elderly_stats():
    """获取独居老人监测统计"""
    # 独居老人总数
    total_elderly = User.query.filter(
        User.is_active == True,
        User.is_elderly_alone == True
    ).count()
    
    # 正在监测的
    monitored = ElderlyMonitor.query.filter(
        ElderlyMonitor.is_monitored == True
    ).count()
    
    # 已预警的
    alerted = ElderlyMonitor.query.filter(
        ElderlyMonitor.is_alerted == True
    ).count()
    
    # 按预警原因统计
    alert_reason_stats = db.session.query(
        ElderlyMonitor.alert_reason,
        func.count(ElderlyMonitor.id)
    ).filter(
        ElderlyMonitor.is_alerted == True,
        ElderlyMonitor.alert_reason != None
    ).group_by(ElderlyMonitor.alert_reason).all()
    
    # 长期未活动老人（超过设定阈值）
    now = datetime.now()
    long_inactive = []
    
    monitors = ElderlyMonitor.query.filter(
        ElderlyMonitor.is_monitored == True
    ).all()
    
    for monitor in monitors:
        if monitor.last_normal_activity:
            hours_since = (now - monitor.last_normal_activity).total_seconds() / 3600
            if hours_since > monitor.no_activity_threshold_hours:
                user = User.query.get(monitor.user_id)
                if user:
                    long_inactive.append({
                        'user_id': user.id,
                        'user_name': user.name,
                        'phone': user.phone,
                        'hours_since_activity': round(hours_since, 1),
                        'threshold_hours': monitor.no_activity_threshold_hours
                    })
    
    return jsonify({
        'code': 200,
        'data': {
            'total_elderly': total_elderly,
            'monitored': monitored,
            'alerted': alerted,
            'long_inactive_count': len(long_inactive),
            'long_inactive_list': long_inactive[:10],  # 最多显示10条
            'alert_reasons': {r: c for r, c in alert_reason_stats}
        }
    })


@dashboard_bp.route('/shared_items_stats', methods=['GET'])
def get_shared_items_stats():
    """获取共享物品统计"""
    # 按状态统计
    status_stats = db.session.query(
        SharedItem.status,
        func.count(SharedItem.id)
    ).group_by(SharedItem.status).all()
    
    # 按分类统计
    category_stats = db.session.query(
        SharedItem.category,
        func.count(SharedItem.id)
    ).group_by(SharedItem.category).all()
    
    # 按交易类型统计
    transaction_stats = db.session.query(
        SharedItem.transaction_type,
        func.count(SharedItem.id)
    ).group_by(SharedItem.transaction_type).all()
    
    # 浏览量排行
    top_viewed = SharedItem.query.order_by(
        SharedItem.views.desc()
    ).limit(10).all()
    
    return jsonify({
        'code': 200,
        'data': {
            'by_status': {s: c for s, c in status_stats},
            'by_category': {c: n for c, n in category_stats},
            'by_transaction_type': {t: n for t, n in transaction_stats},
            'top_viewed': [{'id': item.id, 'title': item.title, 'views': item.views} for item in top_viewed]
        }
    })


@dashboard_bp.route('/overview', methods=['GET'])
def get_overview():
    """获取数据看板概览（简化的汇总数据）"""
    today = datetime.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0)
    
    # 今日数据
    today_workorders = WorkOrder.query.filter(
        WorkOrder.create_time >= today.replace(hour=0, minute=0, second=0)
    ).count()
    
    today_appeals = Appeal.query.filter(
        Appeal.create_time >= today.replace(hour=0, minute=0, second=0)
    ).count()
    
    today_notices = Notice.query.filter(
        Notice.publish_time >= today.replace(hour=0, minute=0, second=0)
    ).count()
    
    # 本月数据
    month_workorders = WorkOrder.query.filter(
        WorkOrder.create_time >= month_start
    ).count()
    
    month_appeals = Appeal.query.filter(
        Appeal.create_time >= month_start
    ).count()
    
    month_shared_items = SharedItem.query.filter(
        SharedItem.create_time >= month_start
    ).count()
    
    # 待处理
    pending_workorders = WorkOrder.query.filter(
        WorkOrder.status.in_(['pending', 'processing'])
    ).count()
    
    pending_appeals = Appeal.query.filter(
        Appeal.status.in_(['pending', 'processing'])
    ).count()
    
    # 独居老人预警
    elderly_alerts = ElderlyMonitor.query.filter(
        ElderlyMonitor.is_alerted == True
    ).count()
    
    return jsonify({
        'code': 200,
        'data': {
            'today': {
                'workorders': today_workorders,
                'appeals': today_appeals,
                'notices': today_notices
            },
            'month': {
                'workorders': month_workorders,
                'appeals': month_appeals,
                'shared_items': month_shared_items
            },
            'pending': {
                'workorders': pending_workorders,
                'appeals': pending_appeals
            },
            'alerts': {
                'elderly_alerts': elderly_alerts
            }
        }
    })
