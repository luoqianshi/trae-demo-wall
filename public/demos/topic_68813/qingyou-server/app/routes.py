"""API 路由定义（FastAPI APIRouter）"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import City, CityAlias, Activity, Plan
from app.planner import generate_plan
from app.seed import MOODS, ENERGIES, INTERESTS, SLOTS, GROUPS, TRANSPORTS, TIME_DEFAULTS
from app.schemas import MatchCityRequest, GeneratePlanRequest, SavePlanRequest
from app.weather_service import get_beijing_time

api_bp = APIRouter()


@api_bp.get('/health')
def health():
    """健康检查"""
    return {'status': 'ok', 'service': 'qingyou-server'}


@api_bp.get('/time')
def get_time():
    """返回当前北京时间，供前端获取准确时间"""
    return get_beijing_time()


@api_bp.get('/meta')
def get_meta(db: Session = Depends(get_db)):
    """返回前端初始化所需的元数据：心情、体力、兴趣、时段、城市列表、城市别称"""
    cities = [c.name for c in db.query(City).order_by(City.id).all()]

    # 构建城市别称映射 {城市名: [别称...]}
    aliases = {}
    for ca in db.query(CityAlias).all():
        aliases.setdefault(ca.city_name, []).append(ca.alias)

    return {
        'moods': MOODS,
        'energies': ENERGIES,
        'interests': INTERESTS,
        'slots': SLOTS,
        'cities': cities,
        'cityAliases': aliases,
        'groups': GROUPS,
        'transports': TRANSPORTS,
        'timeDefaults': TIME_DEFAULTS,
    }


@api_bp.post('/match-city')
def match_city(req: MatchCityRequest, db: Session = Depends(get_db)):
    """
    根据用户输入的地名，匹配到已收录城市。
    支持精确匹配、拼音/别称匹配、子串匹配。
    """
    raw = (req.input or '').strip()
    low = raw.lower()

    if not raw:
        return {'matched': None}

    cities = [c.name for c in db.query(City).all()]

    for city in cities:
        # 精确匹配
        if raw == city:
            return {'matched': city}
        # 别称匹配（不区分大小写）
        city_aliases = [a.alias for a in
                        db.query(CityAlias).filter_by(city_name=city).all()]
        if any(a.lower() == low for a in city_aliases):
            return {'matched': city}
        # 子串匹配
        if city in raw:
            return {'matched': city}
        if any(a in raw for a in city_aliases):
            return {'matched': city}

    return {'matched': None}


@api_bp.post('/plan/generate')
def plan_generate(req: GeneratePlanRequest, db: Session = Depends(get_db)):
    """
    生成游玩方案（规则引擎在后端运行）。
    必填三件套：city(出发地) + group(人数构成) + days/depart_time/return_time(时间预算)
    选填增强：interests / mood / energy / budget_ceiling / transport
    """
    # 必填校验
    if not req.city:
        raise HTTPException(status_code=400, detail='请选择出发地')
    if not req.group:
        raise HTTPException(status_code=400, detail='请选择人数构成')
    if req.days < 1 or req.days > 3:
        raise HTTPException(status_code=400, detail='天数需在 1-3 之间')

    plan = generate_plan(
        db,
        city=req.city,
        group=req.group,
        days=req.days,
        depart_time=req.depart_time,
        return_time=req.return_time,
        interests=req.interests,
        mood=req.mood,
        energy=req.energy,
        budget_ceiling=req.budget_ceiling,
        transport=req.transport,
    )
    return plan


@api_bp.get('/plans')
def list_plans(db: Session = Depends(get_db)):
    """获取已保存的方案列表"""
    plans = db.query(Plan).order_by(Plan.created_at.desc()).all()
    return [p.to_dict() for p in plans]


@api_bp.post('/plans', status_code=201)
def save_plan(req: SavePlanRequest, db: Session = Depends(get_db)):
    """
    保存一个方案。
    必填三件套：city + group + days；选填增强：interests/mood/energy/budget_ceiling/transport
    """
    plan = Plan(
        mood=req.mood,
        energy=req.energy,
        days=req.days,
        interests=req.interests,
        city=req.city,
        plan_data=req.plan_data,
        group=req.group,
        depart_time=req.depart_time,
        return_time=req.return_time,
        budget_ceiling=req.budget_ceiling,
        transport=req.transport,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    return plan.to_dict()


@api_bp.get('/plans/{plan_id}')
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """获取单个已保存方案"""
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail='方案不存在')
    return plan.to_dict()


@api_bp.delete('/plans/{plan_id}')
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    """删除已保存方案"""
    plan = db.get(Plan, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail='方案不存在')
    db.delete(plan)
    db.commit()
    return {'message': '已删除'}
