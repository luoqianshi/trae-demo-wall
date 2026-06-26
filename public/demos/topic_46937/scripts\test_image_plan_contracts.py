import json
import os
import shutil
import uuid
import unittest

from scripts.pipeline_engine import PipelineEngine


WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_WORKSPACE = os.path.join(WORKSPACE, ".scratch", "test_tmp")


class ImagePlanContractTests(unittest.TestCase):
    def _make_engine(self):
        case_dir = os.path.join(TEST_WORKSPACE, f"image_plan_contract_{uuid.uuid4().hex}")
        os.makedirs(case_dir, exist_ok=True)
        self.addCleanup(lambda: shutil.rmtree(case_dir, ignore_errors=True))
        engine = PipelineEngine(case_dir)
        os.makedirs(os.path.join(engine.scratch_dir, "contact_sheets"), exist_ok=True)
        return engine

    def _write_json(self, path, data):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _risk_text(self, report):
        chunks = []
        for risk in report.get("risks", []):
            if isinstance(risk, dict):
                chunks.append(json.dumps(risk, ensure_ascii=False))
            else:
                chunks.append(str(risk))
        return "\n".join(chunks)

    def _base_plan(self):
        return {
            "5.1 颜色展示": {"items": [], "excluded_candidates": []},
            "5.2 棚拍展示": {"items": [], "excluded_candidates": []},
            "5.3 外景展示": {},
            "5.4 搭配方案展示": [],
        }

    def test_validate_plan_rejects_non_static_color_image(self):
        engine = self._make_engine()
        self._write_json(
            os.path.join(engine.scratch_dir, "contact_sheets", "contact_sheet_index.json"),
            [{"id": "c1", "filename": "棕色模特图.jpg", "relative_path": "棕色模特图.jpg", "system_flags": []}],
        )
        plan = self._base_plan()
        plan["5.1 颜色展示"]["items"] = [{
            "id": "c1",
            "original_path": "棕色模特图.jpg",
            "confirmed_by_original_image": True,
            "review_basis": "original_image",
            "visual_judgement": "这是一张包含真人穿着效果的颜色参考图",
            "confirmed_no_model": True,
            "confirmed_product_still_or_color_card": True,
        }]
        plan_path = os.path.join(engine.scratch_dir, "image_selection_plan.json")
        self._write_json(plan_path, plan)

        risk_count = engine.validate_plan(plan_path)
        self.assertGreater(risk_count, 0)
        report_path = os.path.join(engine.scratch_dir, "reports", "validate_plan_report.json")
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        joined = self._risk_text(report)
        self.assertIn("5.1静物", joined)
        self.assertIn("非静物关键词", joined)

    def test_image_snippet_materializes_ai_generated_images(self):
        engine = self._make_engine()
        ai_rel = ".scratch/ai_generated_outfits/look_01/outfit_effect_01.png"
        ai_abs = os.path.join(engine.target_dir, ai_rel)
        os.makedirs(os.path.dirname(ai_abs), exist_ok=True)
        with open(ai_abs, "wb") as f:
            f.write(b"fake image bytes")
        self._write_json(
            os.path.join(engine.scratch_dir, "contact_sheets", "contact_sheet_index.json"),
            [
                {"id": "c1", "filename": "color.jpg", "relative_path": "color.jpg", "system_flags": []},
                {"id": "o1", "filename": "outfit_effect_01.png", "relative_path": ai_rel, "system_flags": ["ai_generated"]},
            ],
        )
        plan = self._base_plan()
        plan["5.1 颜色展示"]["items"] = [{
            "id": "c1",
            "original_path": "color.jpg",
            "confirmed_by_original_image": True,
            "review_basis": "original_image",
            "visual_judgement": "产品平铺静物色彩图，清楚展示本品颜色和廓形",
            "confirmed_no_model": True,
            "confirmed_product_still_or_color_card": True,
        }]
        plan["5.4 搭配方案展示"] = [{
            "name": "平铺搭配",
            "description": "以本品静物图为核心生成的平铺搭配。",
            "effect_image": {
                "id": "o1",
                "original_path": ai_rel,
                "confirmed_by_original_image": True,
                "review_basis": "original_image",
                "visual_judgement": "AI生成平铺搭配效果图，画面围绕产品静物展开",
                "confirmed_outfit_effect": True,
                "visual_type": "outfit_flatlay",
                "reference_image_ids": ["c1"],
                "asset_origin": "ai_generated",
                "generation_prompt": "flat lay outfit board, top-down view, no model",
            },
            "items": [],
            "excluded_candidates": [],
        }]
        plan_path = os.path.join(engine.scratch_dir, "image_selection_plan.json")
        self._write_json(plan_path, plan)

        engine.image_snippet(plan_path)
        gallery_path = os.path.join(engine.scratch_dir, "snippets", "gallery.md")
        with open(gallery_path, "r", encoding="utf-8") as f:
            gallery = f.read()
        self.assertIn("自动生成素材/AI搭配图/o1.png", gallery)
        self.assertNotIn(".scratch/ai_generated_outfits", gallery)

    def test_validate_plan_requires_flatlay_prompt_and_static_reference(self):
        engine = self._make_engine()
        self._write_json(
            os.path.join(engine.scratch_dir, "contact_sheets", "contact_sheet_index.json"),
            [
                {"id": "c1", "filename": "color.jpg", "relative_path": "color.jpg", "system_flags": []},
                {"id": "o1", "filename": "outfit.jpg", "relative_path": "outfit.jpg", "system_flags": []},
            ],
        )
        plan = self._base_plan()
        plan["5.1 颜色展示"]["items"] = [{
            "id": "c1",
            "original_path": "color.jpg",
            "confirmed_by_original_image": True,
            "review_basis": "original_image",
            "visual_judgement": "产品平铺静物色彩图，清楚展示本品颜色和廓形",
            "confirmed_no_model": True,
            "confirmed_product_still_or_color_card": True,
        }]
        plan["5.4 搭配方案展示"] = [{
            "name": "通勤搭配",
            "candidate_count": 1,
            "selected_count": 0,
            "excluded_count": 0,
            "items": [],
            "excluded_candidates": [],
            "effect_image": {
                "id": "o1",
                "original_path": "outfit.jpg",
                "confirmed_by_original_image": True,
                "review_basis": "original_image",
                "visual_judgement": "AI搭配效果图，展示整套搭配但未说明引用来源",
                "confirmed_outfit_effect": True,
                "asset_origin": "ai_generated",
                "visual_type": "single_outfit_photo",
                "generation_prompt": "fashion outfit photo with model",
            },
        }]
        plan_path = os.path.join(engine.scratch_dir, "image_selection_plan.json")
        self._write_json(plan_path, plan)

        risk_count = engine.validate_plan(plan_path)
        self.assertGreater(risk_count, 0)
        report_path = os.path.join(engine.scratch_dir, "reports", "validate_plan_report.json")
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        joined = self._risk_text(report)
        self.assertIn("5.4平铺", joined)
        self.assertIn("5.4提示词", joined)
        self.assertIn("5.4引用", joined)

    def test_image_snippet_writes_explicit_missing_reference_notice(self):
        engine = self._make_engine()
        self._write_json(os.path.join(engine.scratch_dir, "contact_sheets", "contact_sheet_index.json"), [])
        self._write_json(
            os.path.join(engine.scratch_dir, "image_candidates.json"),
            {"5.1 颜色展示": {"candidate_ids": ["c1"]}},
        )
        plan_path = os.path.join(engine.scratch_dir, "image_selection_plan.json")
        self._write_json(plan_path, self._base_plan())

        engine.image_snippet(plan_path)
        gallery_path = os.path.join(engine.scratch_dir, "snippets", "gallery.md")
        with open(gallery_path, "r", encoding="utf-8") as f:
            gallery = f.read()
        self.assertIn("缺少对应图片引用", gallery)
        self.assertIn("产品静物/色卡图", gallery)

    def test_low_quality_placeholder_text_is_blocked(self):
        engine = self._make_engine()
        risks = engine._audit_low_quality_placeholders(
            "核心卖点待补充/以源资料为准，设计师原文写着这款产品主打xxx。",
            "part_01_intro_selling_points.md",
        )
        joined = self._risk_text({"risks": risks})
        self.assertIn("低质量占位文本", joined)
        self.assertIn("待补充/以源资料为准", joined)
        self.assertIn("xxx", joined)

    def test_allowed_evidence_gap_notice_is_not_blocked(self):
        engine = self._make_engine()
        risks = engine._audit_low_quality_placeholders(
            "> ⚠️ 面料展示图与资质报告待补充\n\n待补充证据清单：检测报告原件。",
            "part_05_qualification_size_index.md",
        )
        self.assertEqual([], risks)


if __name__ == "__main__":
    unittest.main()
