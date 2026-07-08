"""
邻里智联 - 社区治理一体化系统 Demo版
后端API服务主应用
"""

import os
import sys
import random
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS

from models import (
    db, User, PointRule, PointRecord,
    WorkOrder, SharedItem, Appeal,
    Notice, NoticeRecord, ElderlyMonitor,
    UsageRecord, PointExchange, ExchangeGoods, Complaint
)
from routes import (
    auth_bp, workorder_bp, appeal_bp,
    share_bp, notice_bp, dashboard_bp, elderly_bp, points_bp,
    complaint_bp, admin_complaint_bp
)
from config import config_by_name, get_database_uri


def create_mysql_database():
    """创建MySQL数据库（仅MySQL，无SQLite fallback）"""
    try:
        import pymysql
        cfg = get_database_uri()
        connection = pymysql.connect(
            host=cfg['host'], port=cfg['port'],
            user=cfg['user'], password=cfg['password'],
            charset='utf8mb4'
        )
        with connection.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{cfg['db_name']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        connection.close()
        return True
    except ImportError:
        print("  ✗ PyMySQL 未安装，请执行: pip install pymysql cryptography")
        sys.exit(1)
    except Exception as e:
        print(f"  ✗ MySQL连接失败: {e}")
        print(f"  ✗ 请确保 MySQL 服务已启动，用户 {cfg['user']} 有权访问")
        sys.exit(1)


def create_app(config_name=None):
    """创建 Flask 应用"""
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)

    print("\n╔═══════════════════════════════════════════════════════╗")
    print("║       邻里智联社区治理一体化系统  Demo版              ║")
    print("╚═══════════════════════════════════════════════════════╝")
    print("\n[1/3] 初始化 MySQL 数据库连接...")
    create_mysql_database()

    if config_name not in config_by_name:
        config_name = 'development'
    app.config.from_object(config_by_name[config_name])

    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    db.init_app(app)

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(workorder_bp, url_prefix='/api/workorders')
    app.register_blueprint(appeal_bp, url_prefix='/api/appeals')
    app.register_blueprint(share_bp, url_prefix='/api/shares')
    app.register_blueprint(notice_bp, url_prefix='/api/notices')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(elderly_bp, url_prefix='/api/elderly')
    app.register_blueprint(points_bp, url_prefix='/api/points')
    app.register_blueprint(complaint_bp, url_prefix='/api/complaints')
    app.register_blueprint(admin_complaint_bp, url_prefix='/api/admin/complaints')

    print("[2/3] 创建数据表并加载示例数据...")
    with app.app_context():
        db.drop_all()
        db.create_all()
        init_default_data()

    @app.route('/')
    def index():
        return jsonify({
            'name': '邻里智联社区治理一体化系统',
            'version': '1.0.0-Demo',
            'description': '老旧小区AI便民共享治理一体化终端API服务',
            'database': 'MySQL (neighbor_community)',
            'endpoints': {
                'auth': '/api/auth',
                'workorders': '/api/workorders',
                'appeals': '/api/appeals',
                'shares': '/api/shares',
                'notices': '/api/notices',
                'points': '/api/points',
                'dashboard': '/api/dashboard',
                'elderly': '/api/elderly',
                'complaints': '/api/complaints',
                'admin_complaints': '/api/admin/complaints'
            }
        })

    @app.route('/health')
    def health():
        try:
            from sqlalchemy import text
            db.session.execute(text("SELECT 1"))
            db_status = 'connected'
        except Exception:
            db_status = 'disconnected'
        return jsonify({'status': 'healthy', 'database': db_status,
                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')})

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'code': 400, 'msg': '请求参数错误'}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'code': 404, 'msg': '资源不存在'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'code': 500, 'msg': '服务器内部错误'}), 500

    print("[3/3] 启动完成 ✓")
    return app


def init_default_data():
    """初始化示例数据"""
    from utils.auth import hash_password
    now = datetime.now()

    # === 1. 用户 ===
    if User.query.count() == 0:
        users_data = [
            {'phone': '13800138000', 'pwd': 'admin123', 'name': '系统管理员', 'role': 'admin', 'address': '社区服务中心', 'building': None, 'unit': None, 'room': None, 'is_elderly_alone': False, 'points_balance': 0},
            {'phone': '13800138001', 'pwd': 'grid123', 'name': '张网格员', 'role': 'grid_admin', 'address': '1号网格', 'building': '1', 'unit': '1', 'room': '101', 'is_elderly_alone': False, 'points_balance': 0},
            {'phone': '13800138002', 'pwd': 'grid123', 'name': '李网格员', 'role': 'grid_admin', 'address': '2号网格', 'building': '2', 'unit': '1', 'room': '201', 'is_elderly_alone': False, 'points_balance': 0},
            {'phone': '13800138003', 'pwd': '123456', 'name': '王女士', 'role': 'resident', 'address': '1号楼2单元302', 'building': '1', 'unit': '2', 'room': '302', 'is_elderly_alone': False, 'points_balance': 180},
            {'phone': '13800138004', 'pwd': '123456', 'name': '赵先生', 'role': 'resident', 'address': '3号楼1单元501', 'building': '3', 'unit': '1', 'room': '501', 'is_elderly_alone': False, 'points_balance': 95},
            {'phone': '13800138005', 'pwd': '123456', 'name': '孙女士', 'role': 'resident', 'address': '4号楼2单元203', 'building': '4', 'unit': '2', 'room': '203', 'is_elderly_alone': False, 'points_balance': 220},
            {'phone': '13800138006', 'pwd': '123456', 'name': '周先生', 'role': 'resident', 'address': '5号楼3单元402', 'building': '5', 'unit': '3', 'room': '402', 'is_elderly_alone': False, 'points_balance': 50},
            {'phone': '13800138007', 'pwd': '123456', 'name': '吴女士', 'role': 'resident', 'address': '2号楼1单元601', 'building': '2', 'unit': '1', 'room': '601', 'is_elderly_alone': False, 'points_balance': 120},
            {'phone': '13800138008', 'pwd': '123456', 'name': '陈大爷', 'role': 'resident', 'address': '1号楼1单元101', 'building': '1', 'unit': '1', 'room': '101', 'is_elderly_alone': True, 'points_balance': 30},
            {'phone': '13800138009', 'pwd': '123456', 'name': '刘奶奶', 'role': 'resident', 'address': '3号楼2单元102', 'building': '3', 'unit': '2', 'room': '102', 'is_elderly_alone': True, 'points_balance': 15},
            {'phone': '13800138010', 'pwd': '123456', 'name': '杨大爷', 'role': 'resident', 'address': '4号楼1单元103', 'building': '4', 'unit': '1', 'room': '103', 'is_elderly_alone': True, 'points_balance': 60},
        ]
        for u in users_data:
            user = User(
                phone=u['phone'],
                password_hash=hash_password(u['pwd']),
                name=u['name'],
                role=u['role'],
                address=u.get('address'),
                building=u.get('building'),
                unit=u.get('unit'),
                room=u.get('room'),
                is_elderly_alone=u.get('is_elderly_alone', False),
                points_balance=u.get('points_balance', 0),
                review_status='approved',
                last_active_time=now - timedelta(hours=random.randint(1, 72))
            )
            db.session.add(user)
        db.session.commit()
        print(f"  ✓ 用户数据: {len(users_data)} 人（管理员1，网格员2，居民5，独居老人3）")

    # 缓存用户ID
    user_map = {}
    for u in User.query.all():
        user_map[u.phone] = u.id
    admin_id = user_map.get('13800138000')
    grid1_id = user_map.get('13800138001')
    grid2_id = user_map.get('13800138002')
    r1, r2, r3, r4, r5 = user_map.get('13800138003'), user_map.get('13800138004'), user_map.get('13800138005'), user_map.get('13800138006'), user_map.get('13800138007')
    e1, e2, e3 = user_map.get('13800138008'), user_map.get('13800138009'), user_map.get('13800138010')

    # === 2. 积分规则 ===
    if PointRule.query.count() == 0:
        rules = [
            {'action': 'register', 'name': '首次注册', 'points': 20, 'description': '新用户首次注册奖励'},
            {'action': 'publish_item', 'name': '发布物品', 'points': 5, 'description': '在邻里共享发布闲置物品'},
            {'action': 'lend_item', 'name': '借出物品', 'points': 10, 'description': '物品被邻居借用并完成'},
            {'action': 'return_item', 'name': '归还物品', 'points': 5, 'description': '按时归还借用物品'},
            {'action': 'repair_feedback', 'name': '报修反馈', 'points': 5, 'description': '对维修服务进行评价反馈'},
            {'action': 'help_others', 'name': '帮助他人', 'points': 15, 'description': '主动帮助邻居解决问题'},
            {'action': 'daily_checkin', 'name': '每日签到', 'points': 2, 'description': '每日登录签到奖励'},
            {'action': 'elderly_care', 'name': '关爱老人', 'points': 20, 'description': '帮助独居老人完成事项'},
        ]
        for rule in rules:
            db.session.add(PointRule(**rule))
        db.session.commit()
        print(f"  ✓ 积分规则: {len(rules)} 条")

    # === 3. 工单（20条）===
    if WorkOrder.query.count() == 0:
        workorders_data = [
            {'order_no': f'WO{now.strftime("%Y%m%d")}0001', 'type': 'repair', 'category': '水电维修', 'title': '厨房水龙头漏水', 'description': '厨房水龙头持续滴水，已接水桶，影响正常使用', 'location': '1号楼2单元302', 'building': '1', 'floor': '3', 'priority': 'high', 'status': 'completed', 'creator_id': r1, 'assigned_to': grid1_id, 'handle_result': '已更换阀芯，测试正常', 'rating': 5, 'feedback': '师傅很专业', 'create_time': now - timedelta(days=5)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0002', 'type': 'repair', 'category': '照明维修', 'title': '楼道感应灯不亮', 'description': '3号楼1单元楼道感应灯已三天不亮', 'location': '3号楼1单元', 'building': '3', 'floor': '1', 'priority': 'medium', 'status': 'pending', 'creator_id': r2, 'assigned_to': grid1_id, 'create_time': now - timedelta(days=2)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0003', 'type': 'repair', 'category': '门窗维修', 'title': '窗户玻璃裂缝', 'description': '客厅窗户有一道明显裂缝', 'location': '4号楼2单元203', 'building': '4', 'floor': '2', 'priority': 'medium', 'status': 'processing', 'creator_id': r3, 'assigned_to': grid2_id, 'handle_time': now - timedelta(hours=3), 'create_time': now - timedelta(days=3)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0004', 'type': 'hazard', 'category': '消防隐患', 'title': '楼道堆积杂物', 'description': '5号楼3单元楼道转角堆积大量纸箱，影响通行', 'location': '5号楼3单元楼道', 'building': '5', 'floor': '3', 'priority': 'urgent', 'status': 'completed', 'creator_id': r4, 'assigned_to': grid1_id, 'handle_result': '已联系住户清理完毕', 'rating': 5, 'create_time': now - timedelta(days=4)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0005', 'type': 'hazard', 'category': '电动车违规', 'title': '电动车飞线充电', 'description': '发现从4楼家中拉线到楼下充电', 'location': '4号楼2单元楼下', 'building': '4', 'floor': '2', 'priority': 'urgent', 'status': 'processing', 'creator_id': r3, 'assigned_to': grid2_id, 'handle_time': now - timedelta(hours=1), 'create_time': now - timedelta(days=1)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0006', 'type': 'hazard', 'category': '高空坠物', 'title': '外墙支架松动', 'description': '2号楼外墙的空调外机支架晃动', 'location': '2号楼外墙', 'building': '2', 'floor': '4', 'priority': 'urgent', 'status': 'pending', 'creator_id': r5, 'assigned_to': grid1_id, 'create_time': now - timedelta(days=1)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0007', 'type': 'repair', 'category': '水电维修', 'title': '卫生间下水堵塞', 'description': '卫生间洗手池下水很慢，有反味', 'location': '1号楼2单元302', 'building': '1', 'floor': '3', 'priority': 'medium', 'status': 'pending', 'creator_id': r1, 'assigned_to': grid2_id, 'create_time': now - timedelta(hours=10)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0008', 'type': 'repair', 'category': '电梯维修', 'title': '电梯按钮失灵', 'description': '2号楼电梯3层按钮按下无反应', 'location': '2号楼电梯', 'building': '2', 'floor': '3', 'priority': 'high', 'status': 'pending', 'creator_id': r2, 'assigned_to': grid1_id, 'create_time': now - timedelta(hours=8)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0009', 'type': 'consult', 'category': '物业咨询', 'title': '物业费缴纳时间', 'description': '想咨询今年物业费缴纳时间和方式', 'location': '', 'building': '', 'floor': '', 'priority': 'low', 'status': 'completed', 'creator_id': r4, 'assigned_to': grid2_id, 'handle_result': '已通过电话告知，可通过微信公众号或支付宝缴费', 'rating': 5, 'feedback': '解答清晰', 'create_time': now - timedelta(days=6)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0010', 'type': 'repair', 'category': '墙体维修', 'title': '阳台外墙脱落', 'description': '阳台外墙体有小块脱落迹象', 'location': '5号楼3单元402', 'building': '5', 'floor': '4', 'priority': 'high', 'status': 'processing', 'creator_id': r4, 'assigned_to': grid1_id, 'handle_time': now - timedelta(hours=6), 'create_time': now - timedelta(days=2)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0011', 'type': 'repair', 'category': '照明维修', 'title': '小区东门路灯不亮', 'description': '小区东门的3盏路灯已经一周不亮', 'location': '小区东门', 'building': '', 'floor': '', 'priority': 'high', 'status': 'completed', 'creator_id': r5, 'assigned_to': grid2_id, 'handle_result': '已联系市政维修人员更换LED灯', 'rating': 4, 'feedback': '处理及时', 'create_time': now - timedelta(days=7)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0012', 'type': 'hazard', 'category': '楼道杂物', 'title': '地下车库堆积杂物', 'description': '地下车库B1层角落有住户长期堆放旧家具和自行车', 'location': '地下车库B1层', 'building': '', 'floor': '', 'priority': 'medium', 'status': 'processing', 'creator_id': r3, 'assigned_to': grid1_id, 'handle_time': now - timedelta(hours=4), 'create_time': now - timedelta(days=3)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0013', 'type': 'repair', 'category': '水电维修', 'title': '暖气不热', 'description': '客厅暖气温度不够', 'location': '3号楼2单元102', 'building': '3', 'floor': '1', 'priority': 'high', 'status': 'completed', 'creator_id': r2, 'assigned_to': grid2_id, 'handle_result': '已清洗暖气管道，温度恢复正常', 'rating': 5, 'create_time': now - timedelta(days=8)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0014', 'type': 'repair', 'category': '家电维修', 'title': '单元门禁失灵', 'description': '5号楼3单元门禁刷卡无反应', 'location': '5号楼3单元', 'building': '5', 'floor': '3', 'priority': 'high', 'status': 'pending', 'creator_id': r4, 'assigned_to': grid1_id, 'create_time': now - timedelta(hours=12)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0015', 'type': 'consult', 'category': '物业咨询', 'title': '停车位分配咨询', 'description': '想咨询小区地下停车位分配情况', 'location': '', 'building': '', 'floor': '', 'priority': 'low', 'status': 'completed', 'creator_id': r1, 'assigned_to': grid2_id, 'handle_result': '已提供车位分配表', 'rating': 4, 'create_time': now - timedelta(days=10)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0016', 'type': 'repair', 'category': '门窗维修', 'title': '入户门锁损坏', 'description': '入户门锁损坏，开关不顺畅', 'location': '2号楼1单元601', 'building': '2', 'floor': '6', 'priority': 'high', 'status': 'completed', 'creator_id': r5, 'assigned_to': grid1_id, 'handle_result': '已更换新锁', 'rating': 5, 'feedback': '效率高', 'create_time': now - timedelta(days=5)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0017', 'type': 'hazard', 'category': '电动车违规', 'title': '电动车楼道停放', 'description': '4号楼2单元楼道有电动车停放', 'location': '4号楼2单元楼道', 'building': '4', 'floor': '2', 'priority': 'urgent', 'status': 'processing', 'creator_id': r3, 'assigned_to': grid2_id, 'handle_time': now - timedelta(hours=2), 'create_time': now - timedelta(hours=24)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0018', 'type': 'repair', 'category': '照明维修', 'title': '地下车库灯不亮', 'description': '地下车库B2层多盏灯不亮', 'location': '地下车库B2层', 'building': '', 'floor': '', 'priority': 'medium', 'status': 'pending', 'creator_id': r2, 'assigned_to': grid1_id, 'create_time': now - timedelta(hours=15)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0019', 'type': 'repair', 'category': '水电维修', 'title': '屋顶漏水', 'description': '下雨时屋顶有漏水情况', 'location': '5号楼3单元601', 'building': '5', 'floor': '6', 'priority': 'urgent', 'status': 'pending', 'creator_id': r4, 'assigned_to': grid2_id, 'create_time': now - timedelta(days=1)},
            {'order_no': f'WO{now.strftime("%Y%m%d")}0020', 'type': 'consult', 'category': '物业咨询', 'title': '社区活动咨询', 'description': '想咨询近期社区活动安排', 'location': '', 'building': '', 'floor': '', 'priority': 'low', 'status': 'completed', 'creator_id': r1, 'assigned_to': grid1_id, 'handle_result': '已提供活动安排表', 'rating': 5, 'feedback': '服务很好', 'create_time': now - timedelta(days=9)},
        ]
        for wo in workorders_data:
            db.session.add(WorkOrder(**wo))
        db.session.commit()
        print(f"  ✓ 工单数据: {len(workorders_data)} 条")

    # === 4. 共享物品（20条）===
    if SharedItem.query.count() == 0:
        items = [
            {'item_no': 'TOOL-001', 'title': '电动螺丝刀套装', 'category': 'tools', 'description': '博世品牌，九成新', 'condition': '几乎全新', 'transaction_type': 'lend', 'price': 0, 'deposit': 50, 'status': 'available', 'owner_id': r1, 'views': 45},
            {'item_no': 'TOOL-002', 'title': '家用梯子（三步）', 'category': 'tools', 'description': '铝合金三步折叠梯', 'condition': '几乎全新', 'transaction_type': 'lend', 'price': 0, 'deposit': 30, 'status': 'lent', 'owner_id': r2, 'borrower_id': r3, 'borrow_time': now - timedelta(days=2), 'views': 32},
            {'item_no': 'TOOL-003', 'title': '电钻套装', 'category': 'tools', 'description': '家用冲击钻，带全套钻头', 'condition': '轻微使用', 'transaction_type': 'lend', 'price': 0, 'deposit': 80, 'status': 'available', 'owner_id': r4, 'views': 67},
            {'item_no': 'BABY-001', 'title': '婴儿推车', 'category': 'baby', 'description': '好孩子品牌，可平躺', 'condition': '轻微使用', 'transaction_type': 'transfer', 'price': 200, 'deposit': 0, 'status': 'available', 'owner_id': r3, 'views': 89},
            {'item_no': 'BABY-002', 'title': '儿童自行车（12寸）', 'category': 'baby', 'description': '12寸儿童自行车，带辅助轮', 'condition': '几乎全新', 'transaction_type': 'lend', 'price': 0, 'deposit': 150, 'status': 'available', 'owner_id': r4, 'views': 56},
            {'item_no': 'BABY-003', 'title': '儿童积木玩具', 'category': 'baby', 'description': '大颗粒积木套装，约200块', 'condition': '几乎全新', 'transaction_type': 'free', 'price': 0, 'deposit': 0, 'status': 'available', 'owner_id': r5, 'views': 41},
            {'item_no': 'BABY-004', 'title': '婴儿学步车', 'category': 'baby', 'description': '可调节高度学步车', 'condition': '轻微使用', 'transaction_type': 'lend', 'price': 0, 'deposit': 80, 'status': 'lent', 'owner_id': r1, 'borrower_id': r2, 'borrow_time': now - timedelta(days=5), 'views': 33},
            {'item_no': 'ELEC-001', 'title': '立式电风扇', 'category': 'electronics', 'description': '美的品牌，三档调速', 'condition': '一般', 'transaction_type': 'lend', 'price': 0, 'deposit': 50, 'status': 'available', 'owner_id': r2, 'views': 72},
            {'item_no': 'ELEC-002', 'title': '电熨斗', 'category': 'electronics', 'description': '飞利浦蒸汽电熨斗', 'condition': '轻微使用', 'transaction_type': 'lend', 'price': 0, 'deposit': 40, 'status': 'available', 'owner_id': r3, 'views': 25},
            {'item_no': 'ELEC-003', 'title': '空气净化器', 'category': 'electronics', 'description': '小米空气净化器', 'condition': '几乎全新', 'transaction_type': 'rent', 'price': 50, 'deposit': 200, 'status': 'available', 'owner_id': r4, 'views': 105},
            {'item_no': 'ELEC-004', 'title': '电动剃须刀', 'category': 'electronics', 'description': '飞利浦三刀头', 'condition': '轻微使用', 'transaction_type': 'transfer', 'price': 100, 'deposit': 0, 'status': 'available', 'owner_id': r5, 'views': 38},
            {'item_no': 'ELEC-005', 'title': '加湿器', 'category': 'electronics', 'description': '家用加湿器，大容量', 'condition': '几乎全新', 'transaction_type': 'lend', 'price': 0, 'deposit': 30, 'status': 'available', 'owner_id': r1, 'views': 19},
            {'item_no': 'BOOK-001', 'title': '《三国演义》珍藏版', 'category': 'books', 'description': '人民文学出版社版本', 'condition': '轻微使用', 'transaction_type': 'lend', 'price': 0, 'deposit': 20, 'status': 'available', 'owner_id': r3, 'views': 54},
            {'item_no': 'BOOK-002', 'title': '《哈利波特》全集', 'category': 'books', 'description': '中文正版全集7本', 'condition': '轻微使用', 'transaction_type': 'lend', 'price': 0, 'deposit': 100, 'status': 'lent', 'owner_id': r4, 'borrower_id': r1, 'borrow_time': now - timedelta(days=7), 'views': 88},
            {'item_no': 'BOOK-003', 'title': '儿童绘本套装', 'category': 'books', 'description': '经典儿童绘本20本', 'condition': '几乎全新', 'transaction_type': 'free', 'price': 0, 'deposit': 0, 'status': 'available', 'owner_id': r5, 'views': 62},
            {'item_no': 'PARK-001', 'title': '地下车位出租', 'category': 'parking', 'description': 'B1层12号车位，月租', 'condition': '几乎全新', 'transaction_type': 'rent', 'price': 300, 'deposit': 500, 'status': 'available', 'owner_id': r2, 'views': 150},
            {'item_no': 'OTHR-001', 'title': '折叠桌椅套装', 'category': 'other', 'description': '户外休闲折叠桌椅一套', 'condition': '几乎全新', 'transaction_type': 'lend', 'price': 0, 'deposit': 100, 'status': 'available', 'owner_id': r1, 'views': 47},
            {'item_no': 'OTHR-002', 'title': '羽毛球拍套装', 'category': 'other', 'description': '两支羽毛球拍+三只羽毛球', 'condition': '几乎全新', 'transaction_type': 'lend', 'price': 0, 'deposit': 50, 'status': 'available', 'owner_id': r3, 'views': 35},
            {'item_no': 'OTHR-003', 'title': '烧烤炉', 'category': 'other', 'description': '家用便携式烧烤炉', 'condition': '轻微使用', 'transaction_type': 'lend', 'price': 0, 'deposit': 80, 'status': 'available', 'owner_id': r4, 'views': 91},
            {'item_no': 'ELEC-006', 'title': '吸尘器', 'category': 'electronics', 'description': '手持推杆二合一吸尘器', 'condition': '一般', 'transaction_type': 'lend', 'price': 0, 'deposit': 100, 'status': 'available', 'owner_id': r5, 'views': 28},
        ]
        for item in items:
            db.session.add(SharedItem(**item))
        db.session.commit()
        print(f"  ✓ 共享物品: {len(items)} 条")

    # === 5. 社区通知（15条）===
    if Notice.query.count() == 0:
        notices = [
            {'notice_no': 'NT-001', 'title': '关于明日停水的通知', 'type': 'water', 'content': '因市政管网改造工程，明日8:00-18:00全小区停水，请提前储水备用。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=1)},
            {'notice_no': 'NT-002', 'title': '春节期间物业服务安排', 'type': 'other', 'content': '春节期间物业管理处安排值班人员在岗，日常维修、快递代收等服务正常运营。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=3)},
            {'notice_no': 'NT-003', 'title': '谨防电信诈骗', 'type': 'other', 'content': '近期有居民反映接到冒充物业人员上门收费、冒充公安局要求转账等诈骗电话。请提高警惕。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=2)},
            {'notice_no': 'NT-004', 'title': '垃圾分类新要求', 'type': 'other', 'content': '根据最新政策要求，小区垃圾投放时间调整为：早7:00-9:00，晚18:00-20:00。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=4)},
            {'notice_no': 'NT-005', 'title': '电梯年度检修安排', 'type': 'other', 'content': '下周一至周三对全小区电梯进行年度检修保养。每天检修2部电梯。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=5)},
            {'notice_no': 'NT-006', 'title': '小区健身器材更新通知', 'type': 'event', 'content': '小区健身广场的6件旧健身器材将于下月初更新为全新器材，届时将有开幕仪式和免费健康义诊。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=6)},
            {'notice_no': 'NT-007', 'title': '物业费缴纳提醒', 'type': 'other', 'content': '2025年度物业费缴纳即将开始，缴费时间为1月15日-3月31日。', 'publisher_id': admin_id, 'is_published': False},
            {'notice_no': 'NT-008', 'title': '关于夏季用电安全提醒', 'type': 'other', 'content': '夏季高温，用电量增大，请注意用电安全，避免在同一插座上同时使用多个大功率电器。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=8)},
            {'notice_no': 'NT-009', 'title': '社区邻里节活动通知', 'type': 'event', 'content': '本月末将举办社区邻里节活动，包括邻里聚餐、儿童文艺表演、便民服务等。欢迎参与！', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=10)},
            {'notice_no': 'NT-010', 'title': '小区监控系统升级通知', 'type': 'other', 'content': '小区监控系统将于本周六进行升级维护，期间部分监控可能暂时无法正常工作。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=12)},
            {'notice_no': 'NT-011', 'title': '燃气安全检查通知', 'type': 'other', 'content': '燃气公司将于下周对小区所有住户进行燃气安全免费检查。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=15)},
            {'notice_no': 'NT-012', 'title': '小区绿化养护通知', 'type': 'other', 'content': '本周将对小区绿化进行秋季修剪和病虫害防治，期间会使用少量农药，请关好门窗。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=18)},
            {'notice_no': 'NT-013', 'title': '电动车充电安全宣传', 'type': 'other', 'content': '严禁电动车进楼入户、飞线充电等行为，严重威胁居民安全。请自觉将电动车停放在指定充电区域。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=20)},
            {'notice_no': 'NT-014', 'title': '社区志愿服务招募通知', 'type': 'event', 'content': '社区正在招募志愿者，服务内容包括：独居老人关爱、环境维护、儿童辅导等。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=22)},
            {'notice_no': 'NT-015', 'title': '冬季供暖准备通知', 'type': 'other', 'content': '供暖季即将来临，物业将对全小区供暖管道进行试压检查，请家中留人配合。', 'publisher_id': admin_id, 'is_published': True, 'publish_time': now - timedelta(days=25)},
        ]
        for n in notices:
            db.session.add(Notice(**n))
        db.session.commit()
        print(f"  ✓ 社区通知: {len(notices)} 条")

    # === 6. 居民诉求（15条）===
    if Appeal.query.count() == 0:
        appeals = [
            {'appeal_no': 'AP-001', 'type': 'consult', 'title': '邻居装修扰民', 'description': '3号楼303室装修从早上6点就开始了，严重影响休息', 'creator_id': r1, 'building': '3', 'unit': '3', 'room': '303', 'status': 'processing', 'assigned_to': grid1_id, 'create_time': now - timedelta(hours=5)},
            {'appeal_no': 'AP-002', 'type': 'consult', 'title': '建议增设充电桩', 'description': '小区电动车越来越多，目前的充电桩经常排队，建议在其他楼前也增设', 'creator_id': r2, 'building': '5', 'unit': '2', 'room': '502', 'status': 'completed', 'assigned_to': grid2_id, 'handle_result': '已收到您的建议，正在与电力公司沟通增加充电桩方案', 'handle_time': now - timedelta(hours=20), 'completion_time': now - timedelta(hours=18)},
            {'appeal_no': 'AP-003', 'type': 'consult', 'title': '社保缴纳政策咨询', 'description': '想咨询灵活就业人员社保缴纳的最新政策', 'creator_id': r3, 'building': '4', 'unit': '2', 'room': '203', 'status': 'completed', 'assigned_to': grid1_id, 'handle_result': '已为您联系社区社保工作人员，可携带身份证到社区服务中心详细咨询', 'handle_time': now - timedelta(hours=48), 'completion_time': now - timedelta(hours=45)},
            {'appeal_no': 'AP-004', 'type': 'consult', 'title': '小区流浪猫问题', 'description': '最近发现小区内流浪猫数量增多，楼道里经常能看到它们的粪便', 'creator_id': r4, 'building': '4', 'unit': '3', 'room': '402', 'status': 'pending', 'assigned_to': grid2_id, 'create_time': now - timedelta(hours=10)},
            {'appeal_no': 'AP-005', 'type': 'consult', 'title': '建议增加儿童游乐区', 'description': '小区里的小朋友很多，现在的游乐设施比较旧也比较少', 'creator_id': r5, 'building': '2', 'unit': '1', 'room': '601', 'status': 'pending', 'assigned_to': grid1_id, 'create_time': now - timedelta(hours=15)},
            {'appeal_no': 'AP-006', 'type': 'consult', 'title': '感谢网格员的热心服务', 'description': '上周家里老人身体不适，正好碰到网格员小张，他非常热心地帮忙联系医生', 'creator_id': r1, 'building': '1', 'unit': '2', 'room': '302', 'status': 'completed', 'assigned_to': grid2_id, 'handle_result': '感谢您的认可，我们将继续努力', 'handle_time': now - timedelta(days=2), 'completion_time': now - timedelta(days=2)},
            {'appeal_no': 'AP-007', 'type': 'consult', 'title': '居住证办理咨询', 'description': '我是刚搬来的租户，想咨询办理居住证需要准备什么材料', 'creator_id': r2, 'building': '3', 'unit': '1', 'room': '501', 'status': 'processing', 'assigned_to': grid1_id, 'handle_time': now - timedelta(hours=8)},
            {'appeal_no': 'AP-008', 'type': 'repair', 'title': '楼道照明灯损坏', 'description': '2号楼1单元楼道照明灯多盏灯不亮', 'creator_id': r3, 'building': '2', 'unit': '1', 'room': '203', 'status': 'completed', 'assigned_to': grid2_id, 'handle_result': '已更换新的LED灯', 'handle_time': now - timedelta(days=1), 'completion_time': now - timedelta(days=1)},
            {'appeal_no': 'AP-009', 'type': 'consult', 'title': '公共区域卫生问题', 'description': '小区健身广场卫生状况不佳，希望能加强打扫', 'creator_id': r4, 'building': '5', 'unit': '3', 'room': '402', 'status': 'processing', 'assigned_to': grid1_id, 'handle_time': now - timedelta(hours=12)},
            {'appeal_no': 'AP-010', 'type': 'repair', 'title': '小区门禁系统', 'description': '5号楼3单元的门禁系统经常失灵', 'creator_id': r5, 'building': '5', 'unit': '3', 'room': '601', 'status': 'pending', 'assigned_to': grid2_id, 'create_time': now - timedelta(hours=18)},
            {'appeal_no': 'AP-011', 'type': 'consult', 'title': '建议增设快递柜', 'description': '现在快递越来越多，建议在小区增设智能快递柜', 'creator_id': r1, 'building': '1', 'unit': '2', 'room': '302', 'status': 'processing', 'assigned_to': grid2_id, 'handle_result': '正在与快递公司洽谈合作，预计下月安装', 'handle_time': now - timedelta(hours=30)},
            {'appeal_no': 'AP-012', 'type': 'consult', 'title': '医保报销咨询', 'description': '想咨询医保报销的具体流程和所需材料', 'creator_id': r2, 'building': '3', 'unit': '1', 'room': '501', 'status': 'completed', 'assigned_to': grid1_id, 'handle_result': '已提供医保报销指南', 'handle_time': now - timedelta(days=3), 'completion_time': now - timedelta(days=3)},
            {'appeal_no': 'AP-013', 'type': 'repair', 'title': '楼道墙面脱落', 'description': '4号楼2单元楼道墙面有脱落现象', 'creator_id': r3, 'building': '4', 'unit': '2', 'room': '203', 'status': 'pending', 'assigned_to': grid2_id, 'create_time': now - timedelta(days=2)},
            {'appeal_no': 'AP-014', 'type': 'consult', 'title': '老年人活动咨询', 'description': '想咨询小区有没有老年人的活动组织', 'creator_id': r4, 'building': '5', 'unit': '3', 'room': '402', 'status': 'completed', 'assigned_to': grid1_id, 'handle_result': '小区有老年合唱团和太极班，欢迎参加', 'handle_time': now - timedelta(days=4), 'completion_time': now - timedelta(days=4)},
            {'appeal_no': 'AP-015', 'type': 'consult', 'title': '小区树木修剪咨询', 'description': '2号楼前的树木长得太茂盛，影响室内采光', 'creator_id': r5, 'building': '2', 'unit': '1', 'room': '601', 'status': 'pending', 'assigned_to': grid2_id, 'create_time': now - timedelta(days=1)},
        ]
        for a in appeals:
            db.session.add(Appeal(**a))
        db.session.commit()
        print(f"  ✓ 居民诉求: {len(appeals)} 条")

    # === 7. 积分记录（每用户至少5条）===
    if PointRecord.query.count() == 0:
        user_points = {
            r1: [('register', 20, '首次注册奖励'), ('publish_item', 5, '发布电动螺丝刀'), ('lend_item', 10, '借出物品给邻居'), ('repair_feedback', 5, '报修反馈奖励'), ('daily_checkin', 2, '每日签到'), ('help_others', 15, '帮助邻居取快递'), ('elderly_care', 20, '帮助陈大爷'), ('daily_checkin', 2, '每日签到'), ('publish_item', 5, '发布折叠桌椅')],
            r2: [('register', 20, '首次注册奖励'), ('lend_item', 10, '借出家用梯子'), ('repair_feedback', 5, '报修反馈'), ('help_others', 15, '帮助邻居'), ('daily_checkin', 2, '每日签到'), ('publish_item', 5, '发布电风扇')],
            r3: [('register', 20, '首次注册奖励'), ('publish_item', 5, '发布婴儿推车'), ('daily_checkin', 2, '每日签到'), ('lend_item', 10, '借出物品'), ('help_others', 15, '帮助邻居'), ('elderly_care', 20, '关爱独居老人'), ('repair_feedback', 5, '报修反馈')],
            r4: [('register', 20, '首次注册奖励'), ('lend_item', 10, '借物归还'), ('publish_item', 5, '发布物品'), ('help_others', 15, '帮助邻居'), ('daily_checkin', 2, '每日签到')],
            r5: [('register', 20, '首次注册奖励'), ('publish_item', 5, '发布物品'), ('lend_item', 10, '借出物品'), ('repair_feedback', 5, '报修反馈'), ('daily_checkin', 2, '每日签到'), ('help_others', 15, '帮助邻居')],
            e1: [('register', 20, '首次注册奖励'), ('daily_checkin', 2, '每日签到')],
            e2: [('register', 20, '首次注册奖励'), ('daily_checkin', 2, '每日签到')],
            e3: [('register', 20, '首次注册奖励'), ('daily_checkin', 2, '每日签到'), ('help_others', 15, '帮助邻居')],
        }
        total_points = 0
        for uid, records in user_points.items():
            points_sum = 0
            for i, (action, points, desc) in enumerate(records):
                points_sum += points
                db.session.add(PointRecord(
                    user_id=uid, type='earn', action=action,
                    points=points, balance=points_sum,
                    description=desc,
                    create_time=now - timedelta(hours=random.randint(5, 720))
                ))
            total_points += len(records)
        db.session.commit()
        print(f"  ✓ 积分记录: {total_points} 条")

    # === 8. 独居老人监测（3位，含1个预警状态）===
    if ElderlyMonitor.query.count() == 0:
        monitors = [
            {'user_id': e1, 'contact_name': '陈小明（儿子）', 'contact_phone': '13900139001', 'contact_relation': '儿子', 'no_activity_threshold_hours': 48, 'check_interval_hours': 12, 'is_monitored': True, 'is_alerted': False, 'alert_time': None, 'alert_reason': None, 'last_normal_activity': now - timedelta(hours=5)},
            {'user_id': e2, 'contact_name': '王小丽（女儿）', 'contact_phone': '13900139002', 'contact_relation': '女儿', 'no_activity_threshold_hours': 48, 'check_interval_hours': 12, 'is_monitored': True, 'is_alerted': True, 'alert_time': now - timedelta(hours=2), 'alert_reason': '超过50小时无活动记录', 'last_normal_activity': now - timedelta(hours=52)},
            {'user_id': e3, 'contact_name': '杨小刚（儿子）', 'contact_phone': '13900139003', 'contact_relation': '儿子', 'no_activity_threshold_hours': 48, 'check_interval_hours': 12, 'is_monitored': True, 'is_alerted': False, 'alert_time': None, 'alert_reason': None, 'last_normal_activity': now - timedelta(hours=10)},
        ]
        for m in monitors:
            db.session.add(ElderlyMonitor(**m))
        db.session.commit()
        print(f"  ✓ 独居老人监测: {len(monitors)} 位（其中1位预警状态）")

    # === 9. 可兑换商品 ===
    if ExchangeGoods.query.count() == 0:
        goods = [
            {'goods_no': 'GIFT-001', 'name': '社区定制雨伞', 'image': '', 'description': '印有社区Logo的精美晴雨两用伞', 'points': 50, 'stock': 50, 'category': 'gift', 'is_active': True},
            {'goods_no': 'GIFT-002', 'name': '环保购物袋套装', 'image': '', 'description': '3件套环保购物袋，可折叠收纳', 'points': 30, 'stock': 100, 'category': 'gift', 'is_active': True},
            {'goods_no': 'GIFT-003', 'name': '社区定制水杯', 'image': '', 'description': '500ml不锈钢保温杯，保温保冷两用', 'points': 80, 'stock': 30, 'category': 'gift', 'is_active': True},
            {'goods_no': 'GIFT-004', 'name': '精美笔记本', 'image': '', 'description': 'A5精装笔记本，100页道林纸', 'points': 20, 'stock': 200, 'category': 'gift', 'is_active': True},
            {'goods_no': 'DAILY-001', 'name': '洗衣液补充装', 'image': '', 'description': '2L装家用洗衣液补充袋', 'points': 60, 'stock': 80, 'category': 'daily', 'is_active': True},
            {'goods_no': 'DAILY-002', 'name': '抽纸10包装', 'image': '', 'description': '原生木浆抽纸，10包装', 'points': 40, 'stock': 100, 'category': 'daily', 'is_active': True},
            {'goods_no': 'DAILY-003', 'name': '洗洁精套装', 'image': '', 'description': '食品级洗洁精2瓶套装', 'points': 35, 'stock': 100, 'category': 'daily', 'is_active': True},
            {'goods_no': 'SERVICE-001', 'name': '家政服务优惠券', 'image': '', 'description': '50元家政服务优惠券，可抵清洁服务', 'points': 100, 'stock': 50, 'category': 'service', 'is_active': True},
            {'goods_no': 'SERVICE-002', 'name': '老年理发服务券', 'image': '', 'description': '社区便民理发券，仅限老年人使用', 'points': 30, 'stock': 100, 'category': 'service', 'is_active': True},
            {'goods_no': 'FOOD-001', 'name': '社区有机蔬菜包', 'image': '', 'description': '3kg当季有机蔬菜组合包', 'points': 120, 'stock': 40, 'category': 'food', 'is_active': True},
            {'goods_no': 'FOOD-002', 'name': '邻里节活动入场券', 'image': '', 'description': '社区邻里节活动双人入场券', 'points': 15, 'stock': 200, 'category': 'food', 'is_active': True},
        ]
        for g in goods:
            db.session.add(ExchangeGoods(**g))
        db.session.commit()
        print(f"  ✓ 可兑换商品: {len(goods)} 项")

    print(f"\n  ✓ 邻里智联社区治理一体化系统 Demo版 - 示例数据加载完成 ✓\n")


app = create_app()


if __name__ == '__main__':
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║        邻里智联社区治理一体化系统  Demo版                  ║
║        Neighbor Smart Community System                     ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📱 测试账号：                                             ║
║     管理员：  13800138000 / admin123                       ║
║     网格员：  13800138001 / grid123                        ║
║     网格员：  13800138002 / grid123                        ║
║     居民1：   13800138003 / 123456                         ║
║     居民2：   13800138004 / 123456                         ║
║     居民3：   13800138005 / 123456                         ║
║     居民4：   13800138006 / 123456                         ║
║     居民5：   13800138007 / 123456                         ║
║     陈大爷：  13800138008 / 123456（独居老人）             ║
║     刘奶奶：  13800138009 / 123456（独居老人·预警）       ║
║     杨大爷：  13800138010 / 123456（独居老人）             ║
║                                                           ║
║  🛢️ 数据库： MySQL (neighbor_community)                      ║
║  🌐 API服务： http://127.0.0.1:5000                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    app.run(host='0.0.0.0', port=5000, debug=True)




