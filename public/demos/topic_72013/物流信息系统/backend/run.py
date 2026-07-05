#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
物流信息管理系统 - Flask 后端 API
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import bcrypt
import csv
from io import StringIO
import os

# ==================== 配置 ====================
class Config:
    SECRET_KEY = 'lims_secret_key_2024'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URI') or 'sqlite:///lims.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'jwt_secret_key_2024'

# ==================== 应用初始化 ====================
app = Flask(__name__, static_folder='../.trae', static_url_path='')
app.config.from_object(Config)
db = SQLAlchemy(app)
CORS(app)

# ==================== 数据库模型 ====================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(100))
    role = db.Column(db.String(20), default='operator')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Warehouse(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(255))
    manager = db.Column(db.String(50))
    phone = db.Column(db.String(20))
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Goods(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    barcode = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    unit = db.Column(db.String(20), default='件')
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouse.id'))
    stock_quantity = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    warehouse = db.relationship('Warehouse', backref='goods_list')

class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_no = db.Column(db.String(50), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey('warehouse.id'))
    goods_id = db.Column(db.Integer, db.ForeignKey('goods.id'))
    goods_name = db.Column(db.String(100))
    quantity = db.Column(db.Integer, nullable=False)
    remark = db.Column(db.String(255))
    order_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='orders')
    warehouse = db.relationship('Warehouse', backref='orders')
    goods = db.relationship('Goods', backref='orders')

class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user = db.Column(db.String(50))
    message = db.Column(db.String(500))
    time = db.Column(db.DateTime, default=datetime.utcnow)

# ==================== 工具函数 ====================
def generate_token(user_id, username, role):
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

def add_log(user, message):
    log = Log(user=user, message=message)
    db.session.add(log)
    db.session.commit()

# ==================== 页面路由 ====================
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# ==================== 认证接口 ====================
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = User(
        username=data['username'],
        email=data.get('email'),
        password=hashed_password,
        role='operator'
    )
    db.session.add(user)
    db.session.commit()
    add_log(data['username'], '用户注册')
    return jsonify({'id': user.id, 'username': user.username, 'role': user.role}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not bcrypt.checkpw(data['password'].encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    token = generate_token(user.id, user.username, user.role)
    add_log(user.username, '用户登录')
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        }
    })

# ==================== 仓库接口 ====================
@app.route('/api/warehouses', methods=['GET'])
def get_warehouses():
    warehouses = Warehouse.query.all()
    return jsonify([{
        'id': w.id,
        'name': w.name,
        'address': w.address,
        'manager': w.manager,
        'phone': w.phone,
        'status': w.status,
        'createdAt': w.created_at.isoformat()
    } for w in warehouses])

@app.route('/api/warehouses', methods=['POST'])
def create_warehouse():
    data = request.get_json()
    warehouse = Warehouse(
        name=data['name'],
        address=data.get('address', ''),
        manager=data.get('manager', ''),
        phone=data.get('phone', ''),
        status=data.get('status', 'active')
    )
    db.session.add(warehouse)
    db.session.commit()
    add_log('系统', f'添加仓库: {data["name"]}')
    return jsonify({'id': warehouse.id, 'name': warehouse.name}), 201

@app.route('/api/warehouses/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def warehouse_detail(id):
    warehouse = Warehouse.query.get_or_404(id)
    
    if request.method == 'GET':
        return jsonify({
            'id': warehouse.id,
            'name': warehouse.name,
            'address': warehouse.address,
            'manager': warehouse.manager,
            'phone': warehouse.phone,
            'status': warehouse.status,
            'createdAt': warehouse.created_at.isoformat()
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        warehouse.name = data.get('name', warehouse.name)
        warehouse.address = data.get('address', warehouse.address)
        warehouse.manager = data.get('manager', warehouse.manager)
        warehouse.phone = data.get('phone', warehouse.phone)
        warehouse.status = data.get('status', warehouse.status)
        db.session.commit()
        add_log('系统', f'更新仓库: {warehouse.name}')
        return jsonify({'message': '仓库已更新'})
    
    elif request.method == 'DELETE':
        name = warehouse.name
        db.session.delete(warehouse)
        db.session.commit()
        add_log('系统', f'删除仓库: {name}')
        return jsonify({'message': '仓库已删除'})

# ==================== 货物接口 ====================
@app.route('/api/goods', methods=['GET'])
def get_goods():
    barcode = request.args.get('barcode')
    name = request.args.get('name')
    warehouse_id = request.args.get('warehouse_id')
    category = request.args.get('category')
    
    query = Goods.query
    
    if barcode:
        query = query.filter(Goods.barcode == barcode)
    if name:
        query = query.filter(Goods.name.like(f'%{name}%'))
    if warehouse_id:
        query = query.filter(Goods.warehouse_id == warehouse_id)
    if category:
        query = query.filter(Goods.category == category)
    
    goods_list = query.all()
    return jsonify([{
        'id': g.id,
        'barcode': g.barcode,
        'name': g.name,
        'category': g.category,
        'unit': g.unit,
        'warehouseId': g.warehouse_id,
        'warehouseName': g.warehouse.name if g.warehouse else None,
        'stockQuantity': g.stock_quantity,
        'createdAt': g.created_at.isoformat()
    } for g in goods_list])

@app.route('/api/goods', methods=['POST'])
def create_goods():
    data = request.get_json()
    if Goods.query.filter_by(barcode=data['barcode']).first():
        return jsonify({'error': '条码已存在'}), 400
    
    goods = Goods(
        barcode=data['barcode'],
        name=data['name'],
        category=data.get('category', '其他'),
        unit=data.get('unit', '件'),
        warehouse_id=data.get('warehouseId'),
        stock_quantity=data.get('stockQuantity', 0)
    )
    db.session.add(goods)
    db.session.commit()
    add_log('系统', f'添加货物: {data["name"]}')
    return jsonify({'id': goods.id, 'name': goods.name}), 201

@app.route('/api/goods/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def goods_detail(id):
    goods = Goods.query.get_or_404(id)
    
    if request.method == 'GET':
        return jsonify({
            'id': goods.id,
            'barcode': goods.barcode,
            'name': goods.name,
            'category': goods.category,
            'unit': goods.unit,
            'warehouseId': goods.warehouse_id,
            'stockQuantity': goods.stock_quantity,
            'createdAt': goods.created_at.isoformat()
        })
    
    elif request.method == 'PUT':
        data = request.get_json()
        goods.name = data.get('name', goods.name)
        goods.category = data.get('category', goods.category)
        goods.unit = data.get('unit', goods.unit)
        goods.warehouse_id = data.get('warehouseId', goods.warehouse_id)
        goods.stock_quantity = data.get('stockQuantity', goods.stock_quantity)
        db.session.commit()
        add_log('系统', f'更新货物: {goods.name}')
        return jsonify({'message': '货物已更新'})
    
    elif request.method == 'DELETE':
        name = goods.name
        db.session.delete(goods)
        db.session.commit()
        add_log('系统', f'删除货物: {name}')
        return jsonify({'message': '货物已删除'})

@app.route('/api/goods/barcode/<barcode>', methods=['GET'])
def get_goods_by_barcode(barcode):
    goods = Goods.query.filter_by(barcode=barcode).first()
    if not goods:
        return jsonify({'error': '未找到货物'}), 404
    return jsonify({
        'id': goods.id,
        'barcode': goods.barcode,
        'name': goods.name,
        'category': goods.category,
        'unit': goods.unit,
        'warehouseId': goods.warehouse_id,
        'stockQuantity': goods.stock_quantity
    })

# ==================== 入库出库接口 ====================
@app.route('/api/goods/inbound', methods=['POST'])
def inbound_goods():
    data = request.get_json()
    goods = Goods.query.get(data['goodsId'])
    if not goods:
        return jsonify({'error': '货物不存在'}), 404
    
    goods.stock_quantity += data['quantity']
    
    order = Order(
        order_no='RK' + str(int(datetime.now().timestamp())),
        user_id=data['userId'],
        warehouse_id=data.get('warehouseId'),
        goods_id=goods.id,
        goods_name=goods.name,
        quantity=data['quantity'],
        remark=data.get('remark', ''),
        order_type='inbound',
        status='completed'
    )
    db.session.add(order)
    db.session.commit()
    add_log('系统', f'入库: {goods.name} x {data["quantity"]}')
    return jsonify({'message': '入库成功', 'stock': goods.stock_quantity})

@app.route('/api/goods/outbound', methods=['POST'])
def outbound_goods():
    data = request.get_json()
    goods = Goods.query.get(data['goodsId'])
    if not goods:
        return jsonify({'error': '货物不存在'}), 404
    if goods.stock_quantity < data['quantity']:
        return jsonify({'error': '库存不足', 'available': goods.stock_quantity}), 400
    
    goods.stock_quantity -= data['quantity']
    
    order = Order(
        order_no='CK' + str(int(datetime.now().timestamp())),
        user_id=data['userId'],
        goods_id=goods.id,
        goods_name=goods.name,
        quantity=data['quantity'],
        order_type='outbound',
        status='completed'
    )
    db.session.add(order)
    db.session.commit()
    add_log('系统', f'出库: {goods.name} x {data["quantity"]}')
    return jsonify({'message': '出库成功', 'stock': goods.stock_quantity})

# ==================== 订单接口 ====================
@app.route('/api/orders', methods=['GET'])
def get_orders():
    order_type = request.args.get('orderType')
    status = request.args.get('status')
    
    query = Order.query
    
    if order_type:
        query = query.filter(Order.order_type == order_type)
    if status:
        query = query.filter(Order.status == status)
    
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([{
        'id': o.id,
        'orderNo': o.order_no,
        'userId': o.user_id,
        'username': o.user.username if o.user else None,
        'warehouseId': o.warehouse_id,
        'warehouseName': o.warehouse.name if o.warehouse else None,
        'goodsId': o.goods_id,
        'goodsName': o.goods_name,
        'quantity': o.quantity,
        'remark': o.remark,
        'orderType': o.order_type,
        'status': o.status,
        'createdAt': o.created_at.isoformat()
    } for o in orders])

# ==================== 用户接口 ====================
@app.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': u.id,
        'username': u.username,
        'email': u.email,
        'role': u.role,
        'createdAt': u.created_at.isoformat()
    } for u in users])

@app.route('/api/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = User.query.get_or_404(id)
    username = user.username
    db.session.delete(user)
    db.session.commit()
    add_log('系统', f'删除用户: {username}')
    return jsonify({'message': '用户已删除'})

# ==================== 日志接口 ====================
@app.route('/api/logs', methods=['GET'])
def get_logs():
    logs = Log.query.order_by(Log.time.desc()).limit(50).all()
    return jsonify([{
        'id': l.id,
        'user': l.user,
        'message': l.message,
        'time': l.time.isoformat()
    } for l in logs])

# ==================== 统计接口 ====================
@app.route('/api/stats', methods=['GET'])
def get_stats():
    return jsonify({
        'warehouses': Warehouse.query.count(),
        'goods': Goods.query.count(),
        'stock': sum(g.stock_quantity for g in Goods.query.all()),
        'orders': Order.query.count()
    })

# ==================== 导出接口 ====================
@app.route('/api/export/<type>', methods=['GET'])
def export_data(type):
    if type == 'goods':
        goods_list = Goods.query.all()
        rows = [['条码', '名称', '分类', '单位', '仓库', '库存', '创建时间']]
        for g in goods_list:
            rows.append([
                g.barcode,
                g.name,
                g.category,
                g.unit,
                g.warehouse.name if g.warehouse else '',
                g.stock_quantity,
                g.created_at.strftime('%Y-%m-%d')
            ])
    elif type == 'warehouses':
        warehouses = Warehouse.query.all()
        rows = [['名称', '地址', '负责人', '电话', '状态', '创建时间']]
        for w in warehouses:
            rows.append([
                w.name,
                w.address,
                w.manager,
                w.phone,
                '启用' if w.status == 'active' else '禁用',
                w.created_at.strftime('%Y-%m-%d')
            ])
    else:
        orders = Order.query.all()
        rows = [['订单号', '类型', '货物', '数量', '状态', '时间']]
        for o in orders:
            rows.append([
                o.order_no,
                '入库' if o.order_type == 'inbound' else '出库',
                o.goods_name,
                o.quantity,
                o.status,
                o.created_at.strftime('%Y-%m-%d')
            ])
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerows(rows)
    
    from flask import make_response
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = f'attachment; filename={type}_export.csv'
    return response

# ==================== 数据导入接口 ====================
@app.route('/api/import/goods', methods=['POST'])
def import_goods():
    data = request.get_json()
    if not data or not isinstance(data, list):
        return jsonify({'error': '无效的数据格式'}), 400
    
    imported = 0
    for item in data:
        if not item.get('barcode') or not item.get('name'):
            continue
        if Goods.query.filter_by(barcode=item['barcode']).first():
            continue
        goods = Goods(
            barcode=item['barcode'],
            name=item['name'],
            category=item.get('category', '其他'),
            unit=item.get('unit', '件'),
            warehouse_id=item.get('warehouseId'),
            stock_quantity=item.get('stockQuantity', 0)
        )
        db.session.add(goods)
        imported += 1
    
    db.session.commit()
    add_log('系统', f'导入货物: {imported} 条')
    return jsonify({'message': f'成功导入 {imported} 条记录', 'imported': imported})

# ==================== 初始化数据 ====================
def init_database():
    """初始化数据库和示例数据"""
    with app.app_context():
        db.drop_all()
        db.create_all()
        
        # 创建管理员
        admin_password = bcrypt.hashpw('123456'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = User(username='admin', email='admin@lims.com', password=admin_password, role='admin')
        db.session.add(admin)
        
        # 创建仓库
        warehouse1 = Warehouse(
            name='北京总仓',
            address='北京市朝阳区某某路123号',
            manager='张三',
            phone='13800138001',
            status='active'
        )
        warehouse2 = Warehouse(
            name='上海分仓',
            address='上海市浦东新区某某街456号',
            manager='李四',
            phone='13800138002',
            status='active'
        )
        db.session.add_all([warehouse1, warehouse2])
        db.session.commit()
        
        # 创建货物
        goods_data = [
            ('6901234567890', '小米手机', '电子产品', '台', 1, 100),
            ('6902345678901', '华为平板', '电子产品', '台', 1, 50),
            ('6903456789012', '男士T恤', '服装', '件', 2, 200),
            ('6904567890123', '运动鞋', '服装', '双', 2, 80),
            ('6905678901234', '办公电脑', '电子产品', '台', 1, 30),
        ]
        for data in goods_data:
            goods = Goods(
                barcode=data[0], name=data[1], category=data[2],
                unit=data[3], warehouse_id=data[4], stock_quantity=data[5]
            )
            db.session.add(goods)
        
        db.session.commit()
        print('=' * 50)
        print('数据库初始化完成!')
        print('默认账号: admin / 123456')
        print('=' * 50)

# ==================== 启动 ====================
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == '--init':
        init_database()
    else:
        print('=' * 50)
        print('物流信息管理系统 - BS架构')
        print('访问地址: http://localhost:5000')
        print('首次运行请使用: python run.py --init')
        print('=' * 50)
        app.run(debug=True, host='0.0.0.0', port=5000)
