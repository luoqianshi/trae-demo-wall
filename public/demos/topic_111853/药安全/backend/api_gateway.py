"""
药管家 外部 API 网关
封装外部药品知识库 API 调用，支持超时控制、缓存、降级
"""
import time
import requests
from config import config


class DrugInfoCache:
    """药品信息简单内存缓存"""

    def __init__(self):
        self._cache = {}

    def get(self, key: str):
        entry = self._cache.get(key)
        if entry and (time.time() - entry["ts"]) < config.DRUG_INFO_CACHE_HOURS * 3600:
            return entry["data"]
        return None

    def set(self, key: str, data):
        self._cache[key] = {"ts": time.time(), "data": data}

    def clear(self):
        self._cache.clear()


drug_cache = DrugInfoCache()


class APIGateway:
    """外部 API 调用网关"""

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "YaoGuanJia/2.0",
            "Accept": "application/json",
        })

    def fetch_drug_info(self, drug_name: str):
        """
        从外部药品知识库获取药品详细信息
        降级策略：API 不可用时返回空，不阻塞主流程
        """
        cache_key = drug_name.strip().lower()
        cached = drug_cache.get(cache_key)
        if cached is not None:
            return {"success": True, "data": cached, "source": "cache"}

        if not config.DRUG_API_KEY:
            return {"success": False, "error": "药品 API 未配置", "source": "none"}

        try:
            resp = self.session.get(
                f"{config.DRUG_API_BASE_URL}/drugs/search",
                params={"name": drug_name, "limit": 1},
                headers={"Authorization": f"Bearer {config.DRUG_API_KEY}"},
                timeout=config.DRUG_API_TIMEOUT,
            )
            if resp.status_code == 200:
                data = resp.json()
                drug_cache.set(cache_key, data)
                return {"success": True, "data": data, "source": "api"}
            elif resp.status_code == 404:
                return {"success": False, "error": "未找到该药品信息", "source": "api"}
            else:
                return {"success": False, "error": f"API 返回错误: {resp.status_code}", "source": "api"}
        except requests.Timeout:
            return {"success": False, "error": "药品 API 请求超时", "source": "none"}
        except requests.ConnectionError:
            return {"success": False, "error": "药品 API 连接失败", "source": "none"}
        except Exception as e:
            return {"success": False, "error": str(e), "source": "none"}

    def search_drug_info(self, drug_name: str):
        """
        搜索药品信息（增强版 — 当外部 API 不可用时，返回标准化提示）
        """
        result = self.fetch_drug_info(drug_name)
        if result["success"]:
            return result

        # 降级：返回空结果，标记为不可用
        return {
            "success": False,
            "error": result.get("error", "服务暂不可用"),
            "source": "degraded",
            "data": {
                "name": drug_name,
                "indications": "",
                "usage_dosage": "",
                "adverse_reactions": "",
                "contraindications": "",
                "storage": "",
                "approval_number": "",
            },
        }


# 全局单例
api_gateway = APIGateway()