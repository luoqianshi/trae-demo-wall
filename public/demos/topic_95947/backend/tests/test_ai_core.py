import sys
import unittest
import uuid
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/15")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("DEEPSEEK_API_KEY", "test-api-key")

import app.models  # noqa: F401 - ensure all SQLAlchemy models are registered
from app.core.database import Base
from app.models.merchant import Merchant
from app.services.ai_service import AIService
from app.services.ai_tools import AIToolRegistry


class AICoreTestCase(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)
        self.Session = sessionmaker(bind=engine)
        self.db = self.Session()
        self.merchant = Merchant(
            id=uuid.uuid4(),
            name="测试餐厅",
            type="正餐",
            industry="餐饮",
            region="测试城市",
            email="ai-test@example.com",
            password_hash="not-used",
            status=1,
        )
        self.db.add(self.merchant)
        self.db.commit()

    def tearDown(self):
        self.db.close()

    def test_daily_brief_guides_when_business_data_is_missing(self):
        brief = AIService.generate_daily_brief(self.db, self.merchant.id)

        self.assertFalse(brief["has_data"])
        self.assertIn("数据不足", brief["summary"])
        self.assertGreaterEqual(len(brief["next_steps"]), 1)

    def test_action_card_tool_creates_draft_only(self):
        result = AIToolRegistry.execute(
            self.db,
            self.merchant.id,
            "create_action_card_draft",
            {
                "title": "补齐近期经营数据",
                "problem": "缺少订单数据",
                "suggested_action": {
                    "title": "导入近 7 天订单",
                    "priority": "high",
                    "expected_impact": "让 AI 能识别销售波动",
                    "steps": ["导入订单", "重新诊断"],
                },
                "priority": "high",
            },
        )

        self.assertEqual(result["status"], "draft")
        self.assertTrue(result["requires_confirmation"])

    def test_confirmed_action_card_can_become_task(self):
        draft = AIToolRegistry.execute(
            self.db,
            self.merchant.id,
            "create_action_card_draft",
            {
                "title": "处理低库存",
                "suggested_action": {
                    "title": "创建补货任务",
                    "priority": "high",
                    "expected_impact": "减少缺货损失",
                    "steps": ["查看库存", "联系供应商"],
                },
            },
        )

        with self.assertRaises(ValueError):
            AIToolRegistry.execute(
                self.db,
                self.merchant.id,
                "create_task_after_confirm",
                {"card_id": draft["id"], "confirmed": False},
            )

        task = AIToolRegistry.execute(
            self.db,
            self.merchant.id,
            "create_task_after_confirm",
            {"card_id": draft["id"], "confirmed": True, "assignee": "店长"},
        )

        self.assertEqual(task["status"], "todo")
        self.assertEqual(task["assignee"], "店长")


if __name__ == "__main__":
    unittest.main()
