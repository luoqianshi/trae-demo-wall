"""
邻里智联 - 编号生成工具
"""

import random
import string
from datetime import datetime


def generate_order_no(order_type: str = 'WO') -> str:
    """生成工单/诉求编号"""
    now = datetime.now()
    date_str = now.strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.digits, k=6))
    return f"{order_type}{date_str}{random_str}"


def generate_notice_no() -> str:
    """生成通知编号"""
    now = datetime.now()
    date_str = now.strftime('%Y%m%d')
    random_str = ''.join(random.choices(string.digits, k=4))
    return f"NT{date_str}{random_str}"


def generate_item_no() -> str:
    """生成物品编号"""
    now = datetime.now()
    random_str = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ITEM{now.strftime('%Y%m%d')}{random_str}"


def get_category_name(category: str) -> str:
    """获取分类中文名称"""
    categories = {
        # 隐患分类
        'hazard_stairs': '楼道杂物',
        'hazard_elevator': '电动车入梯',
        'hazard_fire': '消防通道堵塞',
        'hazard_throw': '高空抛物',
        # 报修分类
        'repair_water': '水电维修',
        'repair_appliance': '家电维修',
        'repair_pipe': '管道维修',
        'repair_lock': '门锁维修',
        'repair_elevator': '电梯维修',
        # 咨询分类
        'consult_social': '社保咨询',
        'consult_medical': '医保咨询',
        'consult_pension': '养老认证',
        'consult_housing': '公租房申请',
        'consult_id': '身份证办理',
        'consult_hukou': '户籍办理',
        # 物品分类
        'tools': '工具',
        'baby': '母婴用品',
        'electronics': '家电',
        'books': '书籍',
        'parking': '车位',
        'other': '其他',
        # 通知分类
        'water': '停水通知',
        'electricity': '停电通知',
        'gas': '停气通知',
        'security': '安全通知',
        'fraud': '反诈宣传',
        'event': '社区活动',
    }
    return categories.get(category, category)


def get_priority_name(priority: str) -> str:
    """获取优先级中文名称"""
    priorities = {
        'low': '低',
        'medium': '中',
        'high': '高',
        'urgent': '紧急'
    }
    return priorities.get(priority, priority)


def get_status_name(status: str) -> str:
    """获取状态中文名称"""
    statuses = {
        'pending': '待处理',
        'processing': '处理中',
        'completed': '已完成',
        'closed': '已关闭',
        'available': '可借/可领',
        'reserved': '已预约',
        'rented': '已租出',
        'lent': '已借出',
        'transferred': '已转让',
        'unavailable': '不可用'
    }
    return statuses.get(status, status)
