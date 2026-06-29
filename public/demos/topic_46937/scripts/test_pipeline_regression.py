import unittest
import os
import sys
import shutil
import uuid
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from scripts.pipeline_engine import PipelineEngine
from scripts.auto_fill_parts import fill_parts

class TestPipelineRegression(unittest.TestCase):
    def setUp(self):
        self.test_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), "..", ".scratch", "test_tmp",
            f"pipeline_regression_{uuid.uuid4().hex}"
        )
        os.makedirs(self.test_dir, exist_ok=True)
        # Create dummy structure
        os.makedirs(os.path.join(self.test_dir, ".scratch"), exist_ok=True)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_pipeline_engine_initialization(self):
        """Verify PipelineEngine correctly inherits all mixins and initializes."""
        engine = PipelineEngine(self.test_dir)
        self.assertEqual(engine.target_dir, os.path.abspath(self.test_dir))
        self.assertEqual(engine.sku_name, os.path.basename(self.test_dir))

        # Check mixin method availability
        self.assertTrue(callable(getattr(engine, "extract", None)))
        self.assertTrue(callable(getattr(engine, "validate", None)))
        self.assertTrue(callable(getattr(engine, "outfit_brief", None)))
        self.assertTrue(callable(getattr(engine, "assemble", None)))
        self.assertTrue(callable(getattr(engine, "validate_content_quality", None)))

    def test_pipeline_engine_timing(self):
        """Verify that the engine's timing registration behaves properly."""
        engine = PipelineEngine(self.test_dir)
        engine.reset_timing()
        engine._log_timing("test_stage", 1.5, "2026-06-19 20:00:00", "2026-06-19 20:00:01")
        engine.flush_timings()

        timing_file = os.path.join(self.test_dir, ".scratch", "timing.json")
        self.assertTrue(os.path.exists(timing_file))

    def test_final_delivery_gates_block_any_failure(self):
        engine = PipelineEngine(self.test_dir)
        engine.validate = lambda handbook_path, format_profile='auto': 1 if format_profile == 'html' else 0
        engine.validate_render_parity = lambda md_path=None, html_path=None: 0
        engine.content_pack = lambda: True
        engine.validate_content_quality = lambda: 0
        self.assertFalse(engine._run_final_delivery_gates("output.md", "output.html"))

    def test_final_delivery_gates_pass_only_when_all_succeed(self):
        engine = PipelineEngine(self.test_dir)
        engine.validate = lambda handbook_path, format_profile='auto': 0
        engine.validate_render_parity = lambda md_path=None, html_path=None: 0
        engine.content_pack = lambda: True
        engine.validate_content_quality = lambda: 0
        self.assertTrue(engine._run_final_delivery_gates("output.md", "output.html"))

    def test_evidence_manifest_blocks_empty_product(self):
        engine = PipelineEngine(self.test_dir)
        self.assertFalse(engine._build_evidence_manifest())
        report = os.path.join(engine.scratch_dir, "reports", "evidence_gap_report.md")
        self.assertTrue(os.path.exists(report))

    def test_evidence_manifest_accepts_minimum_source_evidence(self):
        engine = PipelineEngine(self.test_dir)
        manifest_path = os.path.join(engine.scratch_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump([{
                "relative_path": "product.png",
                "file_type": "image",
                "size_bytes": 1024,
                "extraction_status": "ok",
            }], f)
        self.assertTrue(engine._build_evidence_manifest())

    def test_evidence_manifest_records_identifier_conflicts(self):
        product_dir = os.path.join(self.test_dir, "ZX260A001-product")
        engine = PipelineEngine(product_dir)
        manifest_path = os.path.join(engine.scratch_dir, "manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump([{
                "relative_path": "ZX260B002-source.xlsx",
                "file_type": "spreadsheet",
                "size_bytes": 1024,
                "extraction_status": "ok",
            }], f)
        self.assertTrue(engine._build_evidence_manifest())
        conflicts_path = os.path.join(engine.scratch_dir, "evidence_conflicts.json")
        with open(conflicts_path, "r", encoding="utf-8") as f:
            conflicts = json.load(f)
        self.assertEqual(conflicts["conflict_count"], 1)
        self.assertEqual(conflicts["conflicts"][0]["observed_identifier"], "ZX260B002-source")

        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump([{
                "relative_path": "ZX260A001-商品资料.xlsx",
                "file_type": "spreadsheet",
                "size_bytes": 1024,
                "extraction_status": "ok",
            }], f, ensure_ascii=False)
        self.assertTrue(engine._build_evidence_manifest())
        with open(conflicts_path, "r", encoding="utf-8") as f:
            normalized = json.load(f)
        self.assertEqual(normalized["conflict_count"], 0)

    def test_legacy_auto_fill_fails_closed_without_modifying_parts(self):
        parts_dir = os.path.join(self.test_dir, ".scratch", "parts")
        os.makedirs(parts_dir, exist_ok=True)
        part_path = os.path.join(parts_dir, "part_01_intro_selling_points.md")
        original = "用户或 AI 已生成的真实内容"
        with open(part_path, "w", encoding="utf-8") as f:
            f.write(original)

        self.assertEqual(fill_parts(self.test_dir), 2)
        with open(part_path, "r", encoding="utf-8") as f:
            self.assertEqual(f.read(), original)
        report_path = os.path.join(
            self.test_dir, ".scratch", "reports", "auto_fill_blocked.json"
        )
        with open(report_path, "r", encoding="utf-8") as f:
            report = json.load(f)
        self.assertEqual(report["status"], "blocked")
        self.assertFalse(report["parts_modified"])

if __name__ == "__main__":
    unittest.main()
