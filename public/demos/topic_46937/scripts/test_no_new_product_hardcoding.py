import os
import re
import json
import unittest
import ast

WORKSPACE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL_MD_PATH = os.path.join(WORKSPACE, "SKILL.md")
REFERENCES_DIR = os.path.join(WORKSPACE, "references")
ALLOWLIST_PATH = os.path.join(REFERENCES_DIR, "known_product_hardcoding_allowlist.json")
SCRIPTS_DIR = os.path.join(WORKSPACE, "scripts")

TECH_ABBREVS = {
    "upf", "d", "cpu", "gpu", "os", "toc", "js", "api", "url", "uri", "bom", "xml", "dom", "png", "jpg", "jpeg", "gif", "svg", "pdf", "zip", "tar"
}

# SKU pattern: e.g. AF262K016
SKU_PATTERN = re.compile(r'\b([A-Z]{1,4}[0-9]{2,}[A-Za-z0-9_-]*)\b')

# Designer / Matchmaker / Photo / Video patterns: e.g. 搭配师-凯丽
DESIGNER_PATTERN = re.compile(r'((?:搭配师|设计师|图片|种草视频)-[^\s"\'#\),\]\}\-\/\\\.]{1,30})')

def load_allowlist_full():
    if not os.path.exists(ALLOWLIST_PATH):
        return {}, []
    try:
        with open(ALLOWLIST_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get("allowed_skus", {}), data.get("allowed_designers_and_matchmakers", [])
    except Exception as e:
        print(f"[WARNING] Failed to load allowlist: {e}")
        return {}, []

def scan_text_for_violations(text, filename="text"):
    """
    Scans text for unauthorized SKUs and unauthorized designers/path segments.
    Returns:
        violations (list of strings describing the violations)
        warnings (list of warnings for allowed historical configurations)
    """
    allowed_skus, allowed_designers = load_allowlist_full()

    violations = []
    warnings = []

    scan_payloads = [text]
    if str(filename).lower().endswith(".py"):
        try:
            tree = ast.parse(text)

            def static_string(node):
                if isinstance(node, ast.Constant) and isinstance(node.value, str):
                    return node.value
                if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
                    left = static_string(node.left)
                    right = static_string(node.right)
                    if left is not None and right is not None:
                        return left + right
                return None

            for node in ast.walk(tree):
                value = static_string(node)
                if value:
                    scan_payloads.append(value)
        except SyntaxError:
            pass

    combined_text = "\n".join(scan_payloads)

    # 1. SKU Scan
    found_skus = SKU_PATTERN.findall(combined_text)
    for raw_sku in found_skus:
        sku = raw_sku.rstrip('-_')
        if not sku:
            continue
        # Ignore false positives like hex colors, versions, etc.
        if sku.lower() in ["html", "css", "gold", "silver", "bronze", "fail", "sha256", "utf-8", "json", "radar", "radar_chart"] or sku.lower() in TECH_ABBREVS:
            continue
        if sku.lower().startswith('upf'):
            continue
        if all(c in '0123456789ABCDEFabcdef' for c in sku):
            continue
        if sku.lower().startswith('v') and sku[1:].isdigit():
            continue

        if sku in allowed_skus:
            cleanup_ver = allowed_skus[sku].get("target_cleanup_version", "unknown")
            warnings.append(f"[{filename}] Whitelisted SKU: '{sku}' (Reason: {allowed_skus[sku]['reason']}, Target: {cleanup_ver})")
        else:
            violations.append(f"Unauthorized SKU: '{sku}'")

    # 2. Designer / Path Scan
    found_designers = DESIGNER_PATTERN.findall(combined_text)
    for item in found_designers:
        # Check if this designer path is in the allowed list
        if item in allowed_designers:
            warnings.append(f"[{filename}] Whitelisted designer/path segment: '{item}'")
        else:
            violations.append(f"Unauthorized designer/path segment: '{item}'")

    return list(set(violations)), list(set(warnings))

def run_firewall_audit():
    """
    Runs firewall scan on SKILL.md and all files in references/ (except allowed whitelist JSON itself).
    Returns True if passed, False otherwise.
    """
    all_passed = True

    # Files to audit
    files_to_audit = []

    if os.path.exists(SKILL_MD_PATH):
        files_to_audit.append(SKILL_MD_PATH)

    if os.path.exists(REFERENCES_DIR):
        for root, dirs, files in os.walk(REFERENCES_DIR):
            for file in files:
                full_path = os.path.join(root, file)
                # Ignore the allowlist JSON itself to prevent self-reference block
                if os.path.abspath(full_path) == os.path.abspath(ALLOWLIST_PATH):
                    continue
                # Audit only standard text files
                if file.endswith(('.md', '.json', '.yaml', '.yml', '.txt', '.html', '.css')):
                    files_to_audit.append(full_path)

    if os.path.exists(SCRIPTS_DIR):
        for root, dirs, files in os.walk(SCRIPTS_DIR):
            if "__pycache__" in root:
                continue
            for file in files:
                full_path = os.path.join(root, file)
                # Exclude test files
                if file.startswith("test_") and file.endswith(".py"):
                    continue
                if file.endswith(".py"):
                    files_to_audit.append(full_path)

    print(f"=== Running Hardcoding Firewall Scan on {len(files_to_audit)} files ===")

    for filepath in files_to_audit:
        rel_path = os.path.relpath(filepath, WORKSPACE)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception as e:
            print(f"[ERROR] Failed to read {rel_path}: {e}")
            all_passed = False
            continue

        violations, warnings = scan_text_for_violations(content, rel_path)

        for w in warnings:
            print(f"[ALLOWLIST WARNING] {w}")

        if violations:
            print(f"[FIREWALL BLOCK] Violations found in {rel_path}:")
            for v in violations:
                print(f"  - {v}")
            all_passed = False

    if all_passed:
        print("[FIREWALL PASS] All checked files are free of unauthorized hardcodings.")
    else:
        print("[FIREWALL FAIL] Unauthorized hardcodings were blocked by the firewall.")

    return all_passed


class AntiHardcodingFirewallTests(unittest.TestCase):
    """
    Unit tests ensuring the firewall behaves exactly under three classes of test cases.
    """

    def test_positive_block(self):
        """1. 正向拦截测试: Deliberately block unauthorized new SKUs."""
        unauthorized_text = "Adding a new brand product with SKU: AF2026T999 to global zone."
        violations, _ = scan_text_for_violations(unauthorized_text, "test_file")
        self.assertTrue(any("AF2026T999" in v for v in violations), "Firewall failed to block a new unauthorized SKU!")

    def test_allow_existing(self):
        """2. 历史债务容忍测试: Verify that existing whitelisted SKUs pass with a warning."""
        whitelisted_text = "Processing historical SKU: AF262K016 which has Rule 24b debt."
        violations, warnings = scan_text_for_violations(whitelisted_text, "test_file")
        # Ensure no SKU violations (designer violations are not checked since none present)
        sku_violations = [v for v in violations if "SKU" in v]
        self.assertEqual(len(sku_violations), 0, "Firewall blocked a whitelisted historical SKU!")
        self.assertTrue(any("AF262K016" in w for w in warnings), "Firewall did not emit warning for historical SKU!")

    def test_false_positive_safe(self):
        """3. 误杀安全性测试: Ensure CSS hex values, versions, and standard words are not blocked."""
        safe_css_text = "body { background: #FAFAFA; color: #FFFFFF; font-size: 14px; } Version v231 stable."
        violations, _ = scan_text_for_violations(safe_css_text, "test_file")
        self.assertEqual(len(violations), 0, f"Firewall misidentified false positives: {violations}")

    def test_split_string_hardcoding_is_blocked(self):
        source = 'sku = "ZX" + "260" + "A001"'
        violations, _ = scan_text_for_violations(source, "example.py")
        self.assertTrue(any("ZX260A001" in item for item in violations))

    def test_unauthorized_designer_block(self):
        """4. 搭配师/设计师拦截测试: Block unauthorized designer paths."""
        unauthorized_designer_text = "Copying files from 搭配师-张三/搭配1/ to target directory."
        violations, _ = scan_text_for_violations(unauthorized_designer_text, "test_file")
        self.assertTrue(any("搭配师-张三" in v for v in violations), "Firewall failed to block unauthorized designer path!")

    def test_authorized_designer_pass(self):
        """5. 搭配师/设计师允许测试: Allow authorized designer paths with warning."""
        authorized_designer_text = "Using assets from 搭配师-凯丽/搭配1/户外.png"
        violations, warnings = scan_text_for_violations(authorized_designer_text, "test_file")
        designer_violations = [v for v in violations if "搭配师-" in v or "设计师-" in v]
        self.assertEqual(len(designer_violations), 0, "Firewall blocked whitelisted designer path!")
        self.assertTrue(any("搭配师-凯丽" in w for w in warnings), "Firewall did not emit warning for whitelisted designer!")

    def test_firewall_audit_all_files(self):
        """6. 全局文件审计测试: Ensure run_firewall_audit() returns True for the workspace."""
        self.assertTrue(run_firewall_audit(), "Firewall audit failed on one or more files in the workspace!")

if __name__ == "__main__":
    import sys

    # 1. Run global file auditing
    skill_passed = run_firewall_audit()

    # 2. Run unit tests
    print("\n=== STEP 2: Running Assertions Suite ===")
    suite = unittest.TestLoader().loadTestsFromTestCase(AntiHardcodingFirewallTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if not skill_passed or not result.wasSuccessful():
        sys.exit(1)
    else:
        sys.exit(0)
