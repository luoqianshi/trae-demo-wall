from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, List, Any
from ..database import get_db

router = APIRouter(prefix="/analysis", tags=["数据分析"])

@router.get("/trends")
def get_warning_trends(
    days: int = 30
):
    """获取预警趋势数据"""
    # 模拟趋势数据
    trends = []
    now = datetime.now()
    for i in range(days):
        date = (now - timedelta(days=days - i - 1)).strftime("%Y-%m-%d")
        trends.append({
            "date": date,
            "fire": 10 + (i % 10),
            "flood": 5 + (i % 8),
            "earthquake": 2 + (i % 3),
            "typhoon": 1 + (i % 5),
            "landslide": 3 + (i % 4)
        })
    return {"trends": trends, "period": f"最近{days}天"}

@router.get("/risk-assessment")
def get_risk_assessment():
    """获取风险评估数据"""
    # 模拟风险评估数据
    return {
        "overall": {
            "level": "high",
            "score": 72,
            "description": "整体风险较高，需加强监测"
        },
        "regions": [
            {
                "name": "西南地区",
                "level": "critical",
                "score": 85,
                "main_risks": ["fire", "landslide"]
            },
            {
                "name": "华南地区",
                "level": "high",
                "score": 72,
                "main_risks": ["typhoon", "flood"]
            },
            {
                "name": "西北地区",
                "level": "medium",
                "score": 55,
                "main_risks": ["drought"]
            },
            {
                "name": "华北地区",
                "level": "low",
                "score": 35,
                "main_risks": []
            },
            {
                "name": "华东地区",
                "level": "medium",
                "score": 48,
                "main_risks": ["flood"]
            }
        ],
        "predictions": [
            {
                "type": "fire",
                "probability": 78,
                "trend": "increasing",
                "description": "未来一周火灾风险持续升高"
            },
            {
                "type": "flood",
                "probability": 55,
                "trend": "stable",
                "description": "部分地区需关注洪涝风险"
            },
            {
                "type": "typhoon",
                "probability": 33,
                "trend": "decreasing",
                "description": "台风风险逐渐降低"
            }
        ]
    }

@router.get("/statistics/overview")
def get_statistics_overview():
    """获取统计概览"""
    return {
        "total_warnings": 156,
        "active_warnings": 23,
        "total_devices": 578,
        "online_devices": 553,
        "today_alerts": 12,
        "critical_alerts": 3,
        "data_collected": 1284567,
        "coverage_rate": 98.5
    }

@router.get("/statistics/device-performance")
def get_device_performance():
    """获取设备性能统计"""
    return {
        "uptime": 99.8,
        "response_time": 125,  # ms
        "data_accuracy": 99.2,
        "coverage": {
            "total": 578,
            "covered": 565,
            "rate": 97.8
        },
        "performance_by_type": [
            {"type": "温湿度传感器", "count": 130, "online_rate": 98.5},
            {"type": "水位传感器", "count": 57, "online_rate": 98.2},
            {"type": "地震传感器", "count": 32, "online_rate": 100},
            {"type": "火灾探测器", "count": 92, "online_rate": 96.7},
            {"type": "风速传感器", "count": 31, "online_rate": 90.3},
            {"type": "监控摄像头", "count": 250, "online_rate": 98.0}
        ]
    }

@router.get("/predictions")
def get_predictions():
    """获取灾害预测"""
    return {
        "predictions": [
            {
                "type": "洪水",
                "probability": 78,
                "risk_level": "high",
                "affected_areas": ["浙江", "安徽", "江苏"],
                "time_range": "未来48小时"
            },
            {
                "type": "滑坡",
                "probability": 45,
                "risk_level": "medium",
                "affected_areas": ["四川", "重庆", "云南"],
                "time_range": "未来72小时"
            },
            {
                "type": "火灾",
                "probability": 62,
                "risk_level": "high",
                "affected_areas": ["云南", "四川", "贵州"],
                "time_range": "未来一周"
            },
            {
                "type": "台风",
                "probability": 33,
                "risk_level": "low",
                "affected_areas": ["广东", "福建"],
                "time_range": "未来5天"
            },
            {
                "type": "地震",
                "probability": 12,
                "risk_level": "low",
                "affected_areas": ["西藏", "新疆"],
                "time_range": "未来一周"
            },
            {
                "type": "泥石流",
                "probability": 55,
                "risk_level": "medium",
                "affected_areas": ["四川", "云南"],
                "time_range": "未来48小时"
            }
        ]
    }

@router.get("/warnings/by-region")
def get_warnings_by_region():
    """获取按区域分组的预警统计"""
    return {
        "southwest": {
            "name": "西南地区",
            "warnings": 45,
            "critical": 8,
            "devices": 156,
            "online_rate": 97.4
        },
        "southeast": {
            "name": "东南地区",
            "warnings": 38,
            "critical": 5,
            "devices": 142,
            "online_rate": 98.2
        },
        "northwest": {
            "name": "西北地区",
            "warnings": 25,
            "critical": 3,
            "devices": 98,
            "online_rate": 95.9
        },
        "north": {
            "name": "华北地区",
            "warnings": 18,
            "critical": 2,
            "devices": 82,
            "online_rate": 99.1
        },
        "east": {
            "name": "华东地区",
            "warnings": 22,
            "critical": 4,
            "devices": 65,
            "online_rate": 98.5
        },
        "central": {
            "name": "华中地区",
            "warnings": 15,
            "critical": 1,
            "devices": 35,
            "online_rate": 97.1
        }
    }