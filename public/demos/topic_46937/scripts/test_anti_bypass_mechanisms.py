# -*- coding: utf-8 -*-
import os
import re
import json
import shutil
import hashlib
import unittest
import uuid
from PIL import Image

from scripts.pipeline_engine import PipelineEngine
from scripts.pipeline_modules.constants import is_mock_image
from scripts.pipeline_modules.assembler import AssemblerMixin

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_DIR = os.path.join(WORKSPACE, ".scratch", "test_anti_bypass_tmp")

class AntiBypassAndSanitizerTests(unittest.TestCase):
    def setUp(self):
        shutil.rmtree(TEST_DIR, ignore_errors=True)
        os.makedirs(TEST_DIR, exist_ok=True)

    def tearDown(self):
        shutil.rmtree(TEST_DIR, ignore_errors=True)

    def _create_color_image(self, path, colors_num=1, size=(600, 800)):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img = Image.new('RGB', size, color=(240, 240, 240))
        if colors_num > 1:
            pixels = img.load()
            for i in range(min(colors_num, size[0] * size[1])):
                x = i % size[0]
                y = i // size[0]
                r = (i & 0xFF)
                g = ((i >> 8) & 0xFF)
                b = ((i >> 16) & 0xFF)
                if (r, g, b) == (123, 234, 123):
                    r = 124
                pixels[x, y] = (r, g, b)
        img.save(path, format='PNG')
        return path

    def _create_gradient_image_large(self, path, size=(1000, 1000)):
        # 增大尺寸至 1000x1000 并增加渐变复杂度以确保 PNG 无损压缩后大小稳定大于 20KB
        os.makedirs(os.path.dirname(path), exist_ok=True)
        img = Image.new('RGB', size)
        pixels = img.load()
        for x in range(size[0]):
            for y in range(size[1]):
                r = (x * 255 // size[0]) & 0xFF
                g = (y * 255 // size[1]) & 0xFF
                b = ((x + y) * 255 // (size[0] + size[1])) & 0xFF
                if (r, g, b) == (123, 234, 123):
                    r = 124
                pixels[x, y] = (r, g, b)
        img.save(path, format='PNG')
        return path

    def test_is_mock_image_by_color_count(self):
        # 1. 颜色数少于 150 的极端单调图被判定为 mock
        monocolor_path = os.path.join(TEST_DIR, "mono.png")
        self._create_color_image(monocolor_path, colors_num=100)
        self.assertTrue(is_mock_image(monocolor_path))

        # 2. 颜色数在 150-1000 之间，不在 5.1/8.1/excel_images 路径，尺寸为 600x800，被判定为 mock
        medium_mock_path = os.path.join(TEST_DIR, "medium_mock.png")
        self._create_color_image(medium_mock_path, colors_num=500)
        self.assertTrue(is_mock_image(medium_mock_path))

        # 3. 颜色数在 150-1000 之间，但是包含在特殊豁免路径中 (如 5.1 颜色展示)，应该放行
        exempt_path = os.path.join(TEST_DIR, "5.1 \u989c\u8272\u5c55\u793a", "exempt.png")
        self._create_color_image(exempt_path, colors_num=500)
        self.assertFalse(is_mock_image(exempt_path))

        # 4. 颜色数大于 1000 的丰富图，应该放行
        rich_path = os.path.join(TEST_DIR, "rich.png")
        self._create_color_image(rich_path, colors_num=1200)
        self.assertFalse(is_mock_image(rich_path))

    def test_anti_bypass_hash_defense(self):
        # 1. 创建基准干净图片
        base_img_path = os.path.join(TEST_DIR, "base.png")
        self._create_color_image(base_img_path, colors_num=50)

        # 2. 创建两个物理哈希不同、但图片像素完全一致的作弊文件（尾部追加不同字节）
        corrupted_path_1 = os.path.join(TEST_DIR, "corrupted_1.png")
        corrupted_path_2 = os.path.join(TEST_DIR, "corrupted_2.png")

        shutil.copy2(base_img_path, corrupted_path_1)
        shutil.copy2(base_img_path, corrupted_path_2)

        with open(corrupted_path_1, "ab") as f:
            f.write(b"trash_payload_123_abc")

        with open(corrupted_path_2, "ab") as f:
            f.write(b"different_trash_payload_456_def_longer_bytes")

        m1 = hashlib.md5()
        with open(corrupted_path_1, "rb") as f:
            m1.update(f.read())
        raw_hash_1 = m1.hexdigest()

        m2 = hashlib.md5()
        with open(corrupted_path_2, "rb") as f:
            m2.update(f.read())
        raw_hash_2 = m2.hexdigest()

        self.assertNotEqual(raw_hash_1, raw_hash_2)

        # 3. 提取 validator.py 中的 get_file_md5 算法并验证
        def get_file_md5(filepath):
            import io
            try:
                with Image.open(filepath) as img:
                    img_clean = img.convert('RGB')
                    buf = io.BytesIO()
                    img_clean.save(buf, format='PNG')
                    return hashlib.md5(buf.getvalue()).hexdigest()
            except Exception:
                hasher = hashlib.md5()
                try:
                    with open(filepath, 'rb') as f:
                        for chunk in iter(lambda: f.read(4096), b''):
                            hasher.update(chunk)
                    return hasher.hexdigest()
                except Exception:
                    return None

        clean_hash_1 = get_file_md5(corrupted_path_1)
        clean_hash_2 = get_file_md5(corrupted_path_2)
        self.assertEqual(clean_hash_1, clean_hash_2)

    def test_check_image_uniqueness_integration(self):
        # 1. 在项目测试沙箱中创建独立商品库，禁止接触用户真实商品目录。
        prod_root = os.path.join(TEST_DIR, "product_root")
        os.makedirs(prod_root, exist_ok=True)
        other_prod_dir = os.path.join(prod_root, "fake_prod_other_test")
        other_outfit_dir = os.path.join(other_prod_dir, ".scratch", "ai_generated_outfits")
        os.makedirs(other_outfit_dir, exist_ok=True)

        # 2. 在 fake_prod_other_test 目录中存入一个大图 (使用大尺寸渐变，物理大小确保 >= 20KB)，追加干扰尾部
        other_img_path = os.path.join(other_outfit_dir, "look_01_effect.png")
        self._create_gradient_image_large(other_img_path, size=(1000, 1000))

        self.assertGreaterEqual(os.path.getsize(other_img_path), 20 * 1024)
        with open(other_img_path, "ab") as f:
            f.write(b"other_trash_123")

        # 3. 创建当前商品运行实例，命名规避 "test_tmp" 与 "regression_test" 词汇以躲过跳过条件
        current_prod_dir = os.path.join(prod_root, "fake_prod_current_run")
        os.makedirs(current_prod_dir, exist_ok=True)
        self.addCleanup(lambda: shutil.rmtree(current_prod_dir, ignore_errors=True))

        engine = PipelineEngine(current_prod_dir)
        old_product_root = os.environ.get("PDH_PRODUCT_ROOT")
        os.environ["PDH_PRODUCT_ROOT"] = prod_root
        self.addCleanup(
            lambda: os.environ.__setitem__("PDH_PRODUCT_ROOT", old_product_root)
            if old_product_root is not None else os.environ.pop("PDH_PRODUCT_ROOT", None)
        )
        current_outfit_dir = os.path.join(engine.scratch_dir, "ai_generated_outfits")
        os.makedirs(current_outfit_dir, exist_ok=True)

        # 4. 在当前商品中拷入同样的图片，但追加不同的干扰尾部
        current_img_path = os.path.join(current_outfit_dir, "look_01_effect.png")
        self._create_gradient_image_large(current_img_path, size=(1000, 1000))
        with open(current_img_path, "ab") as f:
            f.write(b"current_different_trash_456")

        # 5. 校验
        risks = []
        engine._check_image_uniqueness(risks)

        # 6. 断言 risks 中触发了跨品图片冲突警告
        self.assertGreater(len(risks), 0)
        joined_risks = "\n".join(risks)
        self.assertIn("\u8de8\u54c1\u56fe\u7247\u590d\u5236\u62e6\u622a", joined_risks)
        self.assertIn("fake_prod_other_test", joined_risks)

    def test_dynamic_buzzword_sanitizer(self):
        class TestAssembler(AssemblerMixin):
            def __init__(self):
                self.skill_dir = WORKSPACE
                self.sku_name = "AF26SS006q-\u4e85\u5229\u4fee\u8eab\u77ed\u8896"
                self.target_dir = os.path.join(WORKSPACE, ".scratch", "test_sanitizer_target")
                self.scratch_dir = os.path.join(self.target_dir, ".scratch")

        assembler = TestAssembler()

        # 1. 测试频次不超过 3 时的豁免保留逻辑 (使用 Unicode 转义)
        text_under_limit = "## \u7ae0\u8282\u4e00\n\u8fd9\u6b3e\u77ed\u8896\u7a3f\u8d77\u6765\u8d55\u7ea7\u8212\u9002\uff0c\u526a\u88c1\u5341\u5206\u4fee\u8eab\uff0c\u6574\u4f53\u975e\u5e38\u767e\u642d\u3002"
        res_md = assembler.sanitize_handbook_text(text_under_limit, is_html=False)
        self.assertEqual(res_md, text_under_limit)

        # 2. 测试频次超过 3 时的平替逻辑（非 HTML 模式）
        # 同一章节内出现 5 次 "修身"，前 3 次应保留，第 4, 5 次应被平替
        text_over_limit = "## \u7ae0\u8282\u4e8c\n\u4fee\u8eab\u7248\u578b\uff0c\u5e26\u6765\u4fee\u8eab\u6548\u679c\uff0c\u8fd9\u4ef6\u4fee\u8eabT\u6064\u771f\u7684\u662f\u4e3a\u4e46\u4fee\u8eab\u800c\u8bbe\u8ba1\u7684\uff0c\u6781\u5176\u4fee\u8eab\u3002"
        res_md_over = assembler.sanitize_handbook_text(text_over_limit, is_html=False)

        # 统计 "修身" 出现的频次
        counts_res = len(re.findall("\u4fee\u8eab", res_md_over))
        self.assertEqual(counts_res, 3)

        # 3. 测试 HTML 模式下的 span 标签包裹及 data-tooltip 注入
        res_html_over = assembler.sanitize_handbook_text(text_over_limit, is_html=True)
        self.assertIn("<span class='pdh-replaced-term'", res_html_over)
        self.assertIn("data-tooltip=", res_html_over)
        self.assertIn("原词“\u4fee\u8eab”", res_html_over)

        # 4. 测试特例保护逻辑（商品名不被平替）
        text_with_sku = "## \u7ae0\u8282\u4e09\n\u5546\u54c1\u662fAF26SS006q-\u4e85\u5229\u4fee\u8eab\u77ed\u8896\u3002\u4fee\u8eab\u526a\u88c1\uff0c\u4fee\u8eab\u9816\u53e3\uff0c\u4fee\u8eab\u8896\u53e3\uff0c\u771f\u7684\u662f\u6781\u5176\u4fee\u8eab\uff0c\u4fee\u8eab\u5230\u6781\u81f4\u3002"
        res_sku_md = assembler.sanitize_handbook_text(text_with_sku, is_html=False)
        self.assertIn("AF26SS006q-\u4e85\u5229\u4fee\u8eab\u77ed\u8896", res_sku_md)

        sku_occurrences = len(re.findall("\u4fee\u8eab", res_sku_md))
        self.assertEqual(sku_occurrences, 4)

    def test_outfit_generation_checks_prerequisites_before_cleanup(self):
        product_dir = os.path.join(TEST_DIR, f"missing_brief_{uuid.uuid4().hex}")
        engine = PipelineEngine(product_dir)
        scratch_image = os.path.join(engine.scratch_dir, "ai_generated_outfits", "look_01", "existing.png")
        stable_image = os.path.join(product_dir, "自动生成素材", "AI搭配图", "existing.png")
        for path in (scratch_image, stable_image):
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "wb") as f:
                f.write(b"valid-existing-asset")

        self.assertEqual(engine.outfit_generate_images(), 1)
        self.assertTrue(os.path.exists(scratch_image))
        self.assertTrue(os.path.exists(stable_image))

    def test_outfit_generation_requires_items_before_look(self):
        product_dir = os.path.join(TEST_DIR, f"two_stage_{uuid.uuid4().hex}")
        engine = PipelineEngine(product_dir)
        brief = {
            "outfits": [{
                "look_id": "look_01",
                "selected_product_color": "测试色",
                "recommended_items": [{"item_type": "bottom", "item_name": "测试下装"}],
                "image_generation_prompts": {
                    "flatlay_item_bottom_prompt_zh": "平铺下装",
                    "flatlay_item_bottom_prompt_en": "flat lay bottom",
                    "outfit_effect_prompt_zh": "完整平铺搭配",
                    "outfit_effect_prompt_en": "complete flat lay outfit",
                },
            }]
        }
        brief_path = os.path.join(engine.scratch_dir, "outfit_strategy_brief.json")
        with open(brief_path, "w", encoding="utf-8") as f:
            json.dump(brief, f, ensure_ascii=False)

        self.assertEqual(engine.outfit_generate_images(), 2)
        state_path = os.path.join(engine.scratch_dir, "outfit_generation_state.json")
        with open(state_path, "r", encoding="utf-8") as f:
            stage_one = json.load(f)
        self.assertEqual(stage_one["stage"], "items_required")
        self.assertEqual([task["type"] for task in stage_one["tasks"]], ["item_bottom"])

        item_path = os.path.join(engine.scratch_dir, "ai_generated_outfits", "look_01", "item_bottom_01.png")
        self._create_gradient_image_large(item_path)
        product_image = os.path.join(product_dir, "测试色.png")
        self._create_gradient_image_large(product_image)
        with open(os.path.join(engine.scratch_dir, "manifest.json"), "w", encoding="utf-8") as f:
            json.dump([{
                "file_type": "image",
                "asset_origin": "source",
                "filename": "测试色.png",
                "absolute_path": product_image,
            }], f, ensure_ascii=False)
        self.assertEqual(engine.outfit_generate_images(), 2)
        with open(state_path, "r", encoding="utf-8") as f:
            stage_two = json.load(f)
        self.assertEqual(stage_two["stage"], "looks_required")
        self.assertEqual([task["type"] for task in stage_two["tasks"]], ["outfit_effect"])
        self.assertIn(item_path, stage_two["tasks"][0]["image_paths"])
        self.assertIn(product_image, stage_two["tasks"][0]["image_paths"])

if __name__ == "__main__":
    unittest.main()
