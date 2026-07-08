"""
邻里智联 社区治理一体化系统 - 数据模型
包含用户、工单、物品、通知等所有数据库模型
"""

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    """用户表 - 居民、网格员、管理员"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    phone = db.Column(db.String(20), unique=True, nullable=False, comment='手机号')
    password_hash = db.Column(db.String(255), nullable=False, comment='密码哈希')
    name = db.Column(db.String(50), comment='姓名')
    role = db.Column(db.String(20), default='resident', comment='角色: resident/grid_admin/admin')
    avatar = db.Column(db.String(255), comment='头像URL')
    address = db.Column(db.String(100), comment='住址')
    building = db.Column(db.String(20), comment='楼栋')
    unit = db.Column(db.String(10), comment='单元')
    room = db.Column(db.String(20), comment='房间号')
    is_elderly_alone = db.Column(db.Boolean, default=False, comment='是否独居老人')
    review_status = db.Column(db.String(20), default='approved', comment='审核状态: pending/approved/rejected')
    review_remark = db.Column(db.String(500), comment='审核备注/驳回原因')
    reviewed_by = db.Column(db.Integer, comment='审核人ID')
    review_time = db.Column(db.DateTime, comment='审核时间')
    points_balance = db.Column(db.Integer, default=0, comment='积分余额')
    last_active_time = db.Column(db.DateTime, comment='最后活跃时间')
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    is_active = db.Column(db.Boolean, default=True)

    # 处罚状态
    account_status = db.Column(db.String(20), default='normal', comment='账户状态: normal/banned/permanent_banned')
    ban_reason = db.Column(db.String(500), comment='封号原因')
    banned_until = db.Column(db.DateTime, comment='封号到期时间')
    banned_by = db.Column(db.Integer, comment='封号操作人')
    ban_time = db.Column(db.DateTime, comment='封号时间')
    post_banned = db.Column(db.Boolean, default=False, comment='是否禁止发布')
    post_ban_reason = db.Column(db.String(500), comment='禁发原因')
    post_banned_until = db.Column(db.DateTime, comment='禁发到期时间')

    # 关系
    workorders = db.relationship('WorkOrder', backref='creator', lazy='dynamic', foreign_keys='WorkOrder.creator_id')
    appeals = db.relationship('Appeal', backref='creator', lazy='dynamic', foreign_keys='Appeal.creator_id')
    owned_items = db.relationship('SharedItem', backref='owner', lazy='dynamic', foreign_keys='SharedItem.owner_id')
    borrowed_items = db.relationship('SharedItem', backref='borrower', lazy='dynamic', foreign_keys='SharedItem.borrower_id')
    points = db.relationship('PointRecord', backref='user', lazy='dynamic')
    usage_records = db.relationship('UsageRecord', backref='user', lazy='dynamic')
    exchanges = db.relationship('PointExchange', backref='user', lazy='dynamic')

    def to_dict(self):
        """转换为字典"""
        return {
            'id': self.id,
            'phone': self.phone,
            'name': self.name,
            'role': self.role,
            'avatar': self.avatar,
            'address': self.address,
            'building': self.building,
            'unit': self.unit,
            'room': self.room,
            'is_elderly_alone': self.is_elderly_alone,
            'review_status': self.review_status,
            'review_remark': self.review_remark,
            'points_balance': self.points_balance,
            'last_active_time': self.last_active_time.strftime('%Y-%m-%d %H:%M:%S') if self.last_active_time else None,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'is_active': self.is_active,
            'account_status': self.account_status,
            'ban_reason': self.ban_reason,
            'banned_until': self.banned_until.strftime('%Y-%m-%d %H:%M:%S') if self.banned_until else None,
            'banned_by': self.banned_by,
            'ban_time': self.ban_time.strftime('%Y-%m-%d %H:%M:%S') if self.ban_time else None,
            'post_banned': self.post_banned,
            'post_ban_reason': self.post_ban_reason,
            'post_banned_until': self.post_banned_until.strftime('%Y-%m-%d %H:%M:%S') if self.post_banned_until else None
        }


class WorkOrder(db.Model):
    """工单表 - 隐患工单和报修工单"""
    __tablename__ = 'workorders'

    id = db.Column(db.Integer, primary_key=True)
    order_no = db.Column(db.String(50), unique=True, nullable=False, comment='工单编号')
    type = db.Column(db.String(20), nullable=False, comment='类型: hazard/hazard杂物/hazard电动车/hazard高空抛物/repair/consult')
    category = db.Column(db.String(50), comment='分类')
    title = db.Column(db.String(200), nullable=False, comment='标题')
    description = db.Column(db.Text, comment='描述')
    location = db.Column(db.String(100), comment='位置')
    building = db.Column(db.String(20), comment='楼栋')
    floor = db.Column(db.String(10), comment='楼层')
    priority = db.Column(db.String(10), default='medium', comment='优先级: low/medium/high/urgent')
    status = db.Column(db.String(20), default='pending', comment='状态: pending/processing/completed/closed')
    
    # 关联用户
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='创建者ID')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), comment='指派给网格员ID')
    
    # 图片
    images = db.Column(db.Text, comment='抓拍图片JSON')
    capture_time = db.Column(db.DateTime, comment='抓拍时间')
    
    # 处理信息
    handle_time = db.Column(db.DateTime, comment='处理时间')
    completion_time = db.Column(db.DateTime, comment='完成时间')
    handle_result = db.Column(db.Text, comment='处理结果')
    
    # 评分
    rating = db.Column(db.Integer, comment='居民评分 1-5')
    feedback = db.Column(db.Text, comment='居民反馈')
    
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'order_no': self.order_no,
            'type': self.type,
            'category': self.category,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'building': self.building,
            'floor': self.floor,
            'priority': self.priority,
            'status': self.status,
            'creator_id': self.creator_id,
            'assigned_to': self.assigned_to,
            'images': self.images,
            'capture_time': self.capture_time.strftime('%Y-%m-%d %H:%M:%S') if self.capture_time else None,
            'handle_time': self.handle_time.strftime('%Y-%m-%d %H:%M:%S') if self.handle_time else None,
            'completion_time': self.completion_time.strftime('%Y-%m-%d %H:%M:%S') if self.completion_time else None,
            'handle_result': self.handle_result,
            'rating': self.rating,
            'feedback': self.feedback,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None
        }


class Appeal(db.Model):
    """居民诉求表 - 报修和政务咨询"""
    __tablename__ = 'appeals'

    id = db.Column(db.Integer, primary_key=True)
    appeal_no = db.Column(db.String(50), unique=True, nullable=False, comment='诉求编号')
    type = db.Column(db.String(20), nullable=False, comment='类型: repair/repair语音/repair文字/consult')
    category = db.Column(db.String(50), comment='分类: 水电维修/家电维修/管道维修/社保/医保/养老认证等')
    title = db.Column(db.String(200), nullable=False, comment='标题')
    description = db.Column(db.Text, comment='描述')
    voice_url = db.Column(db.String(255), comment='语音URL')
    
    location = db.Column(db.String(100), comment='位置')
    building = db.Column(db.String(20), comment='楼栋')
    unit = db.Column(db.String(10), comment='单元')
    room = db.Column(db.String(20), comment='房间号')
    
    status = db.Column(db.String(20), default='pending', comment='状态: pending/processing/completed/closed')
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='创建者ID')
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'), comment='指派给网格员ID')
    
    handle_time = db.Column(db.DateTime, comment='处理时间')
    completion_time = db.Column(db.DateTime, comment='完成时间')
    handle_result = db.Column(db.Text, comment='处理结果')
    
    images = db.Column(db.Text, comment='图片JSON')
    
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'appeal_no': self.appeal_no,
            'type': self.type,
            'category': self.category,
            'title': self.title,
            'description': self.description,
            'voice_url': self.voice_url,
            'location': self.location,
            'building': self.building,
            'unit': self.unit,
            'room': self.room,
            'status': self.status,
            'creator_id': self.creator_id,
            'assigned_to': self.assigned_to,
            'handle_time': self.handle_time.strftime('%Y-%m-%d %H:%M:%S') if self.handle_time else None,
            'completion_time': self.completion_time.strftime('%Y-%m-%d %H:%M:%S') if self.completion_time else None,
            'handle_result': self.handle_result,
            'images': self.images,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None
        }


class SharedItem(db.Model):
    """共享物品表"""
    __tablename__ = 'shared_items'

    id = db.Column(db.Integer, primary_key=True)
    item_no = db.Column(db.String(50), unique=True, nullable=False, comment='物品编号')
    title = db.Column(db.String(200), nullable=False, comment='物品名称')
    description = db.Column(db.Text, comment='描述')
    category = db.Column(db.String(50), nullable=False, comment='分类: tools/baby/electronics/books/parking/other')
    condition = db.Column(db.String(20), comment='新旧程度: 全新/几乎全新/轻微使用/一般/较旧')
    
    # 交易方式
    transaction_type = db.Column(db.String(20), default='lend', comment='交易类型: lend/rent/transfer/free')
    price = db.Column(db.Float, default=0, comment='价格/押金')
    deposit = db.Column(db.Float, default=0, comment='押金')
    
    images = db.Column(db.Text, comment='图片JSON')
    
    status = db.Column(db.String(20), default='available', comment='状态: available/reserved/rented/lent/transferred/unavailable/removed/posting_ban')
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='所有者ID')

    # 借用者
    borrower_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='借用者ID')
    borrow_time = db.Column(db.DateTime, comment='借用时间')
    return_time = db.Column(db.DateTime, comment='归还时间')

    views = db.Column(db.Integer, default=0, comment='浏览次数')

    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    # 处罚
    remove_reason = db.Column(db.String(500), comment='下架原因')
    removed_by = db.Column(db.Integer, comment='下架操作人')
    ban_reason = db.Column(db.String(500), comment='禁发原因')
    banned_by = db.Column(db.Integer, comment='禁发操作人')
    banned_until = db.Column(db.DateTime, comment='禁发到期时间')

    def to_dict(self):
        return {
            'id': self.id,
            'item_no': self.item_no,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'condition': self.condition,
            'transaction_type': self.transaction_type,
            'price': self.price,
            'deposit': self.deposit,
            'images': self.images,
            'status': self.status,
            'owner_id': self.owner_id,
            'owner_name': self.owner.name if self.owner else None,
            'borrower_id': self.borrower_id,
            'borrow_time': self.borrow_time.strftime('%Y-%m-%d %H:%M:%S') if self.borrow_time else None,
            'return_time': self.return_time.strftime('%Y-%m-%d %H:%M:%S') if self.return_time else None,
            'views': self.views,
            'remove_reason': self.remove_reason,
            'removed_by': self.removed_by,
            'ban_reason': self.ban_reason,
            'banned_by': self.banned_by,
            'banned_until': self.banned_until.strftime('%Y-%m-%d %H:%M:%S') if self.banned_until else None,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None
        }


class Notice(db.Model):
    """通知表"""
    __tablename__ = 'notices'

    id = db.Column(db.Integer, primary_key=True)
    notice_no = db.Column(db.String(50), unique=True, nullable=False, comment='通知编号')
    title = db.Column(db.String(200), nullable=False, comment='标题')
    content = db.Column(db.Text, comment='内容')
    type = db.Column(db.String(50), comment='类型: water/electricity/gas/security/fraud/event/other')
    
    # 推送范围
    scope = db.Column(db.String(20), default='all', comment='范围: all/building/unit/custom')
    target_buildings = db.Column(db.String(255), comment='目标楼栋')
    target_units = db.Column(db.String(255), comment='目标单元')
    target_rooms = db.Column(db.String(255), comment='目标房间')
    
    # 推送状态
    is_published = db.Column(db.Boolean, default=False, comment='是否发布')
    publish_time = db.Column(db.DateTime, comment='发布时间')
    publisher_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='发布者ID')
    
    # 附件
    attachments = db.Column(db.Text, comment='附件JSON')
    
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'notice_no': self.notice_no,
            'title': self.title,
            'content': self.content,
            'type': self.type,
            'scope': self.scope,
            'target_buildings': self.target_buildings,
            'target_units': self.target_units,
            'target_rooms': self.target_rooms,
            'is_published': self.is_published,
            'publish_time': self.publish_time.strftime('%Y-%m-%d %H:%M:%S') if self.publish_time else None,
            'publisher_id': self.publisher_id,
            'attachments': self.attachments,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None
        }


class NoticeRecord(db.Model):
    """通知推送记录表"""
    __tablename__ = 'notice_records'

    id = db.Column(db.Integer, primary_key=True)
    notice_id = db.Column(db.Integer, db.ForeignKey('notices.id'), comment='通知ID')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='用户ID')
    is_read = db.Column(db.Boolean, default=False, comment='是否已读')
    read_time = db.Column(db.DateTime, comment='阅读时间')
    
    create_time = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'notice_id': self.notice_id,
            'user_id': self.user_id,
            'is_read': self.is_read,
            'read_time': self.read_time.strftime('%Y-%m-%d %H:%M:%S') if self.read_time else None,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }


class PointRecord(db.Model):
    """积分记录表"""
    __tablename__ = 'point_records'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='用户ID')
    type = db.Column(db.String(20), nullable=False, comment='类型: earn/spend')
    action = db.Column(db.String(50), comment='动作: publish_item/lend_item/return_item/help_others/repair_feedback等')
    points = db.Column(db.Integer, nullable=False, comment='积分变动')
    balance = db.Column(db.Integer, comment='变动后余额')
    description = db.Column(db.String(200), comment='描述')
    
    related_id = db.Column(db.Integer, comment='关联ID (物品ID/工单ID等)')
    create_time = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'action': self.action,
            'points': self.points,
            'balance': self.balance,
            'description': self.description,
            'related_id': self.related_id,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }


class ElderlyMonitor(db.Model):
    """独居老人监测表"""
    __tablename__ = 'elderly_monitors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, comment='用户ID')
    
    # 基本信息
    contact_name = db.Column(db.String(50), comment='紧急联系人姓名')
    contact_phone = db.Column(db.String(20), comment='紧急联系人电话')
    contact_relation = db.Column(db.String(20), comment='紧急联系人关系')
    
    # 监测配置
    no_activity_threshold_hours = db.Column(db.Integer, default=24, comment='无活动阈值(小时)')
    check_interval_hours = db.Column(db.Integer, default=12, comment='检查间隔(小时)')
    
    # 状态
    is_monitored = db.Column(db.Boolean, default=True, comment='是否监测中')
    is_alerted = db.Column(db.Boolean, default=False, comment='是否已预警')
    alert_time = db.Column(db.DateTime, comment='预警时间')
    alert_reason = db.Column(db.String(200), comment='预警原因')
    
    # 上次正常活动时间
    last_normal_activity = db.Column(db.DateTime, comment='上次正常活动时间')
    
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'contact_relation': self.contact_relation,
            'no_activity_threshold_hours': self.no_activity_threshold_hours,
            'check_interval_hours': self.check_interval_hours,
            'is_monitored': self.is_monitored,
            'is_alerted': self.is_alerted,
            'alert_time': self.alert_time.strftime('%Y-%m-%d %H:%M:%S') if self.alert_time else None,
            'alert_reason': self.alert_reason,
            'last_normal_activity': self.last_normal_activity.strftime('%Y-%m-%d %H:%M:%S') if self.last_normal_activity else None,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None
        }


class UsageRecord(db.Model):
    """终端使用记录表"""
    __tablename__ = 'usage_records'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='用户ID')
    
    # 使用信息
    terminal_id = db.Column(db.String(50), comment='终端ID')
    terminal_location = db.Column(db.String(100), comment='终端位置')
    
    # 使用类型
    usage_type = db.Column(db.String(50), comment='使用类型: login/query/service/hazard_report/repair/share/notice')
    
    # 详细信息
    description = db.Column(db.String(200), comment='描述')
    duration = db.Column(db.Integer, comment='使用时长(秒)')
    
    create_time = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'terminal_id': self.terminal_id,
            'terminal_location': self.terminal_location,
            'usage_type': self.usage_type,
            'description': self.description,
            'duration': self.duration,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }


class PointRule(db.Model):
    """积分规则表"""
    __tablename__ = 'point_rules'

    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(50), unique=True, nullable=False, comment='动作标识')
    name = db.Column(db.String(100), comment='规则名称')
    points = db.Column(db.Integer, nullable=False, comment='积分')
    description = db.Column(db.String(200), comment='描述')
    is_active = db.Column(db.Boolean, default=True)
    
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'name': self.name,
            'points': self.points,
            'description': self.description,
            'is_active': self.is_active,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }


class PointExchange(db.Model):
    """积分兑换商品表"""
    __tablename__ = 'point_exchanges'

    id = db.Column(db.Integer, primary_key=True)
    exchange_no = db.Column(db.String(50), unique=True, nullable=False, comment='兑换单号')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='用户ID')
    goods_id = db.Column(db.Integer, db.ForeignKey('exchange_goods.id'), comment='商品ID')
    quantity = db.Column(db.Integer, default=1, comment='兑换数量')

    # 商品信息
    goods_name = db.Column(db.String(200), comment='商品名称')
    goods_image = db.Column(db.String(255), comment='商品图片')
    goods_description = db.Column(db.String(500), comment='商品描述')
    points_cost = db.Column(db.Integer, nullable=False, comment='消耗积分')

    # 配送信息
    contact_name = db.Column(db.String(50), comment='联系人')
    contact_phone = db.Column(db.String(20), comment='联系电话')
    delivery_address = db.Column(db.String(200), comment='配送地址')

    # 状态
    status = db.Column(db.String(20), default='pending', comment='状态: pending（待处理）/ processed（已处理）/ delivered（已配送）/ cancelled（已取消）')
    remark = db.Column(db.String(200), comment='备注')

    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'exchange_no': self.exchange_no,
            'user_id': self.user_id,
            'goods_id': self.goods_id,
            'quantity': self.quantity,
            'goods_name': self.goods_name,
            'goods_image': self.goods_image,
            'goods_description': self.goods_description,
            'points_cost': self.points_cost,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'delivery_address': self.delivery_address,
            'status': self.status,
            'remark': self.remark,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None
        }


class ExchangeGoods(db.Model):
    """可兑换商品表"""
    __tablename__ = 'exchange_goods'

    id = db.Column(db.Integer, primary_key=True)
    goods_no = db.Column(db.String(50), unique=True, nullable=False, comment='商品编号')
    name = db.Column(db.String(200), nullable=False, comment='商品名称')
    image = db.Column(db.String(255), comment='商品图片')
    description = db.Column(db.String(500), comment='商品描述')
    points = db.Column(db.Integer, nullable=False, comment='兑换所需积分')
    stock = db.Column(db.Integer, default=100, comment='库存')
    category = db.Column(db.String(50), comment='分类: daily（日用品）/ food（食品）/ service（服务）/ gift（礼品）')
    is_active = db.Column(db.Boolean, default=True, comment='是否上架')
    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'goods_no': self.goods_no,
            'name': self.name,
            'image': self.image,
            'description': self.description,
            'points': self.points,
            'stock': self.stock,
            'category': self.category,
            'is_active': self.is_active,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None
        }


class Complaint(db.Model):
    """投诉举报表"""
    __tablename__ = 'complaints'

    id = db.Column(db.Integer, primary_key=True)
    complaint_no = db.Column(db.String(50), unique=True, nullable=False, comment='投诉编号')
    type = db.Column(db.String(20), nullable=False, comment='投诉类型: item（物品）/ user（用户）')

    # 投诉对象 - 物品
    target_item_id = db.Column(db.Integer, db.ForeignKey('shared_items.id'), comment='被投诉物品ID')

    # 投诉对象 - 用户
    target_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='被投诉用户ID')
    target_user_name = db.Column(db.String(50), comment='被投诉用户姓名快照')
    target_user_phone = db.Column(db.String(20), comment='被投诉用户手机号快照')

    # 投诉信息
    reason = db.Column(db.String(100), comment='投诉原因: 虚假描述/违规收费/失信行为/不文明沟通/卫生问题/其他')
    reason_detail = db.Column(db.Text, comment='详细描述')
    reporter_id = db.Column(db.Integer, db.ForeignKey('users.id'), comment='投诉人ID')
    reporter_name = db.Column(db.String(50), comment='投诉人姓名')
    reporter_phone = db.Column(db.String(20), comment='投诉人电话')

    # 处理状态
    status = db.Column(db.String(20), default='pending', comment='状态: pending（待处理）/ processing（处理中）/ resolved（已处理）/ rejected（已驳回）')
    priority = db.Column(db.String(20), default='medium', comment='优先级: urgent/high/medium/low')

    # 处理结果
    handle_time = db.Column(db.DateTime, comment='处理时间')
    handle_result = db.Column(db.Text, comment='处理结果/回复说明')
    handled_by = db.Column(db.Integer, comment='处理人ID')

    # 处罚
    punishment_type = db.Column(db.String(30), comment='处罚类型: ban_user（临时封号）/ permanent_ban（永久封号）/ remove_item（下架物品）/ ban_post（禁止发布）/ none')
    punishment_reason = db.Column(db.String(500), comment='处罚说明')
    ban_days = db.Column(db.Integer, comment='封禁天数')

    create_time = db.Column(db.DateTime, default=datetime.now)
    update_time = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)

    def to_dict(self):
        return {
            'id': self.id,
            'complaint_no': self.complaint_no,
            'type': self.type,
            'target_item_id': self.target_item_id,
            'target_user_id': self.target_user_id,
            'target_user_name': self.target_user_name,
            'target_user_phone': self.target_user_phone,
            'reason': self.reason,
            'reason_detail': self.reason_detail,
            'reporter_id': self.reporter_id,
            'reporter_name': self.reporter_name,
            'reporter_phone': self.reporter_phone,
            'status': self.status,
            'priority': self.priority,
            'handle_time': self.handle_time.strftime('%Y-%m-%d %H:%M:%S') if self.handle_time else None,
            'handle_result': self.handle_result,
            'handled_by': self.handled_by,
            'punishment_type': self.punishment_type,
            'punishment_reason': self.punishment_reason,
            'ban_days': self.ban_days,
            'create_time': self.create_time.strftime('%Y-%m-%d %H:%M:%S') if self.create_time else None,
            'update_time': self.update_time.strftime('%Y-%m-%d %H:%M:%S') if self.update_time else None
        }
