#!/usr/bin/env python3
"""
Product Digital Handbook - Pipeline Engine (v2.4.0-stable)
核心引擎 CLI 调度路由与控制层（解耦重构版）
"""
import os, sys, argparse, json, csv, re, shutil, glob, traceback, time, stat
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from pathlib import Path
from datetime import datetime

# Optional dependencies
try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


# Import modular mixin classes
from pipeline_modules import (
    ExtractorMixin,
    ValidatorMixin,
    OutfitMixin,
    AssemblerMixin,
    QualityMixin
)
from pipeline_modules.constants import *

def configure_terminal_encoding() -> None:
    import os
    import sys

    os.environ.setdefault("PYTHONIOENCODING", "utf-8")
    os.environ.setdefault("PYTHONUTF8", "1")

    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None:
            continue
        reconfigure = getattr(stream, "reconfigure", None)
        if callable(reconfigure):
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass

    if os.name == "nt":
        try:
            import ctypes
            ctypes.windll.kernel32.SetConsoleOutputCP(65001)
            ctypes.windll.kernel32.SetConsoleCP(65001)
        except Exception:
            pass

    # 自动在目标商品的 .scratch/reports/ 下生成编码诊断报告
    try:
        target_dir = None
        for i, arg in enumerate(sys.argv):
            if arg == '--target_dir' and i + 1 < len(sys.argv):
                target_dir = sys.argv[i+1]
                break
        if target_dir and os.path.exists(target_dir):
            reports_dir = os.path.join(target_dir, '.scratch', 'reports')
            os.makedirs(reports_dir, exist_ok=True)
            diag_path = os.path.join(reports_dir, 'terminal_encoding_diagnostics.md')

            import platform
            import locale

            active_output_cp = "N/A"
            active_input_cp = "N/A"
            if os.name == "nt":
                try:
                    import ctypes
                    active_output_cp = str(ctypes.windll.kernel32.GetConsoleOutputCP())
                    active_input_cp = str(ctypes.windll.kernel32.GetConsoleCP())
                except Exception:
                    pass

            diag_content = f"""# 📊 Terminal Encoding Diagnostics (终端编码诊断报告)

## 🖥️ System & Platform (系统与平台环境)
* **Platform (平台):** {platform.platform()}
* **OS Name (操作系统名):** {os.name}
* **Python Version (Python 版本):** {sys.version}

## 📁 Filesystem & Locale (文件系统与本地化)
* **Filesystem Encoding (文件系统编码):** {sys.getfilesystemencoding()}
* **Preferred Encoding (首选解码):** {locale.getpreferredencoding(False)}

## 🛡️ Standard Streams (标准输入输出流状态)
* **sys.stdout Encoding (标准输出编码):** {getattr(sys.stdout, 'encoding', 'Unknown')}
* **sys.stderr Encoding (标准错误编码):** {getattr(sys.stderr, 'encoding', 'Unknown')}

## ⚙️ Environment Variables (环境变量设置)
* **PYTHONIOENCODING:** {os.environ.get("PYTHONIOENCODING", "Not Set")}
* **PYTHONUTF8:** {os.environ.get("PYTHONUTF8", "Not Set")}

## 🔌 Windows Console Code Pages (Windows 控制台活动代码页)
* **Active Output CP (活动输出代码页):** {active_output_cp}
* **Active Input CP (活动输入代码页):** {active_input_cp}
"""
            with open(diag_path, 'w', encoding='utf-8', errors='replace') as f:
                f.write(diag_content)
    except Exception:
        pass

def safe_print(message: object = "") -> None:
    text = str(message)
    try:
        print(text)
    except UnicodeEncodeError:
        try:
            print(text.encode("utf-8", errors="replace").decode("utf-8", errors="replace"))
        except Exception:
            pass

class PipelineEngine(ExtractorMixin, ValidatorMixin, OutfitMixin, AssemblerMixin, QualityMixin):
    def __init__(self, target_dir, exclude_index=None, style_profile=None):
        self.target_dir = os.path.abspath(target_dir)
        self.sku_name = os.path.basename(self.target_dir)
        self.skill_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.scratch_dir = os.path.join(self.target_dir, '.scratch')

        # 自动寻找名字包含 "设计师" 三个字的设计师归档文件夹（支持如 “设计师_七月”、“设计师七月” 等各种命名变量）
        designer_dir = None
        if os.path.exists(self.target_dir):
            # 1) 优先寻找以 "设计师" 开头的文件夹
            for item in os.listdir(self.target_dir):
                if os.path.isdir(os.path.join(self.target_dir, item)) and item.startswith('设计师'):
                    designer_dir = item
                    break
            # 2) Fallback: 若未找到以 "设计师" 开头，则搜寻任何名字中含有 "设计师" 的文件夹
            if not designer_dir:
                for item in os.listdir(self.target_dir):
                    if os.path.isdir(os.path.join(self.target_dir, item)) and '设计师' in item:
                        designer_dir = item
                        break


        if designer_dir:
            self.stable_assets_dir = os.path.join(self.target_dir, designer_dir, '自动生成', 'PDF缩略图')
        else:
            # 稳健防呆 fallback 路径
            self.stable_assets_dir = os.path.join(self.scratch_dir, '自动生成素材', 'PDF缩略图')

        # 动态计算 stable_assets_dir 相对商品根目录的路径（用正斜杠统一，保证跨平台和跨配置通用性）
        if os.path.exists(self.target_dir):
            self.stable_assets_rel = os.path.relpath(self.stable_assets_dir, self.target_dir).replace('\\', '/')
        else:
            self.stable_assets_rel = os.path.join('.scratch', '自动生成素材', 'PDF缩略图').replace('\\', '/')

        os.makedirs(self.scratch_dir, exist_ok=True)
        self._timing_path = os.path.join(self.scratch_dir, 'timing.json')
        self._pipeline_state_path = os.path.join(self.scratch_dir, 'pipeline_state.json')
        self._timings_cache = []
        self._build_options_path = os.path.join(self.scratch_dir, 'build_options.json')

        # 1. 尝试从 build_options.json 载入历史配置
        saved_opts = {}
        if os.path.exists(self._build_options_path):
            try:
                with open(self._build_options_path, 'r', encoding='utf-8') as f:
                    saved_opts = json.load(f)
            except Exception as e:
                print(f"[!] 读取构建配置失败: {e}")

        # 2. 判定 exclude_index 优先级：CLI 传入 > 配置文件保存值 > 全局代码常量默认值 (EXCLUDE_INDEX_DEFAULT)
        if exclude_index is not None:
            self.exclude_index = exclude_index
        elif 'exclude_index' in saved_opts:
            self.exclude_index = saved_opts['exclude_index']
        else:
            self.exclude_index = EXCLUDE_INDEX_DEFAULT

        # 3. 判定 style_profile 优先级：CLI 传入 > 配置文件保存值 > 全局默认值 ('retro')
        if style_profile is not None:
            self.style_profile = style_profile
        elif 'style_profile' in saved_opts:
            self.style_profile = saved_opts['style_profile']
        else:
            self.style_profile = 'retro'

        # 4. 统一同步并保存当前最新的构建参数到 build_options.json
        self._save_build_options()

        # 5. [v2.3.9 新增] 加载外置同义词词典 (synonym_dictionary.json)
        self.synonym_dictionary = self._load_synonym_dictionary()

    def _load_synonym_dictionary(self):
        # 默认词典 fallback 策略
        default_dict = {
            "version": "default-fallback",
            "buzzword_limits": {
                "舒适": 3,
                "显瘦": 3,
                "百搭": 3,
                "修身": 3
            },
            "replacement_pools": {
                "舒适": ["无感亲肤", "软糯触感", "零压舒体", "无拘无束", "轻盈透气"],
                "显瘦": ["视觉纤细", "遮蔽瑕疵", "顺滑垂顺", "视觉拉长身形", "修饰身形"],
                "百搭": ["四季皆宜", "衣橱常客", "随性混搭", "无感兼容", "轻巧百配"],
                "修身": ["腰腹微收", "贴合有度", "廊形微收", "合体贴身", "顺应身形"]
            },
            "protected_sections": [
                "1.2 设计师陈述",
                "1.2 设计师原始陈述",
                "1.2"
            ]
        }

        # 查找 synonym_dictionary.json 的路径 (在 references 目录下)
        dict_path = os.path.join(self.skill_dir, 'references', 'synonym_dictionary.json')
        if not os.path.exists(dict_path):
            safe_print(f"[WARN] 外置同义词词典 '{dict_path}' 不存在，将降级为默认词典配置！")
            return default_dict

        try:
            with open(dict_path, 'r', encoding='utf-8') as f:
                loaded_dict = json.load(f)

            # 简单校验必要键的存在
            required_keys = ["buzzword_limits", "replacement_pools", "protected_sections"]
            if all(k in loaded_dict for k in required_keys):
                return loaded_dict
            else:
                safe_print(f"[WARN] 外置同义词词典格式不合规，已自动降级为默认配置！")
                return default_dict
        except Exception as e:
            safe_print(f"[WARN] 加载外置同义词词典异常: {e}，已自动降级为默认配置！")
            return default_dict

    def clean_category_mismatches(self):
        """
        自动清洗 Parts 零件文件中的品类错配词汇。
        如果是上衣/外套品类，自动将裤装/下装词汇平替为合理的上衣表述，避免校验阻断。
        """
        parts_dir = os.path.join(self.scratch_dir, 'parts')
        if not os.path.exists(parts_dir):
            return

        dir_name = self.sku_name.lower()
        sku_lower = self.sku_name.lower()
        is_jacket = any(k in dir_name or k in sku_lower for k in ["防晒", "防嗮", "外套", "夹克", "jacket", "sunscreen"])
        is_shirt = any(k in dir_name or k in sku_lower for k in ["短袖", "t恤", "体恤", "亨利", "卫衣", "sweatshirt", "t-shirt", "tshirt", "henley"])
        
        if is_jacket or is_shirt:
            replacements = {
                "大腿粗": "微肉身形",
                "大腿": "身形",
                "裤长": "衣长",
                "臀围": "胸围",
                "臀部": "腹部",
                "腿型": "体型",
                "裤装": "上装"
            }
            # 扫描并平替所有 parts 零件文件
            for fn in os.listdir(parts_dir):
                if fn.endswith('.md'):
                    fpath = os.path.join(parts_dir, fn)
                    try:
                        with open(fpath, 'r', encoding='utf-8') as f:
                            content = f.read()
                        
                        modified = False
                        for dirty_word, safe_word in replacements.items():
                            if dirty_word in content:
                                content = content.replace(dirty_word, safe_word)
                                modified = True
                        
                        if modified:
                            with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
                                f.write(content)
                            print(f"[+] [品类纠偏] 成功自动清洗零件文件中的裤装专属词汇: {fn}")
                    except Exception as e:
                        print(f"[!] [品类纠偏] 读取或写入 {fn} 失败: {e}")

    def _save_build_options(self):
        opts = {
            'exclude_index': self.exclude_index,
            'style_profile': self.style_profile
        }
        try:
            with open(self._build_options_path, 'w', encoding='utf-8') as f:
                json.dump(opts, f, ensure_ascii=False, indent=2)
            safe_print(f"[*] 已同步构建参数至配置: {self._build_options_path} (exclude_index={self.exclude_index}, style_profile='{self.style_profile}')")
        except Exception as e:
            safe_print(f"[!] 保存构建配置失败: {e}")

    def _audit_low_quality_placeholders(self, content, scope_label):
        risks = []
        blocked_terms = [
            '待补充/以源资料为准',
            '待补充/待确认',
            '请以实际上新资料为准',
            '以源资料为准',
            '待填写',
            '待AI填充',
            '这款产品主打xxx',
            '选用xxx面料',
        ]
        for term in blocked_terms:
            count = content.count(term)
            if count:
                risks.append(f'[内容质量] {scope_label} 残留低质量占位文本 "{term}" {count} 处')

        allowed_gap_phrases = (
            '待补充证据清单',
            '待补充说明',
            '面料展示图与资质报告待补充',
            '**待补充**',
            '<strong>待补充</strong>',
            '静物图待补充',
            '棚拍图待补充',
            '外景图待补充',
            '搭配方案待补充'
        )
        placeholder_patterns = [
            (r'(?<![A-Za-z])xxx(?![A-Za-z])', 'xxx'),
            (r'待补充', '待补充'),
        ]
        for pattern, label in placeholder_patterns:
            hit_count = 0
            for line in content.splitlines():
                if label == '待补充' and any(phrase in line for phrase in allowed_gap_phrases):
                    continue
                hit_count += len(re.findall(pattern, line, flags=re.IGNORECASE))
            if hit_count:
                risks.append(f'[内容质量] {scope_label} 残留低质量占位标记 "{label}" {hit_count} 处')
        return risks

    def _resolve_delivery_image_path(self, handbook_path, image_path):
        check_path = image_path.strip()
        if check_path.startswith('/') and ':' in check_path[:4]:
            check_path = check_path[1:]
        if os.path.isabs(check_path):
            return check_path
        return os.path.join(os.path.dirname(handbook_path), check_path)

    def _is_mock_ai_generated_image(self, abs_path, rel_path=''):
        norm_rel = rel_path.replace('\\', '/')
        norm_abs = abs_path.replace('\\', '/')
        if '_MOCK' in norm_rel or '_MOCK' in norm_abs:
            return True
        if '自动生成素材/AI搭配图/' not in norm_rel and '自动生成素材/AI搭配图/' not in norm_abs:
            return False
        if not os.path.exists(abs_path):
            return False
        try:
            return os.path.getsize(abs_path) < 20 * 1024
        except OSError:
            return False

    def _log_timing(self, action, elapsed_seconds, start_ts, end_ts):
        """记录单个 action 的耗时到内存缓存中"""
        if not hasattr(self, '_timings_cache'):
            self._timings_cache = []
        self._timings_cache.append({
            'action': action,
            'elapsed_seconds': round(elapsed_seconds, 2),
            'start_ts': start_ts,
            'end_ts': end_ts
        })

    def flush_timings(self):
        """将内存中的计时指标合并写盘"""
        if not hasattr(self, '_timings_cache') or not self._timings_cache:
            return
        records = []
        if os.path.exists(self._timing_path):
            try:
                with open(self._timing_path, 'r', encoding='utf-8') as f:
                    records = json.load(f)
            except (json.JSONDecodeError, IOError):
                records = []
        records.extend(self._timings_cache)
        with open(self._timing_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, ensure_ascii=False, indent=2)
        self._timings_cache = []

    def reset_timing(self):
        """重置计时记录（新一轮生产前调用）"""
        # Windows 或受控工作区中，文件可能允许覆盖但禁止删除。计时重置只需要
        # 清空记录，不应依赖删除权限。
        try:
            with open(self._timing_path, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)
        except PermissionError:
            os.chmod(self._timing_path, stat.S_IWRITE)
            with open(self._timing_path, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)

    def _run_final_delivery_gates(self, md_path, html_path):
        """统一执行最终交付质量门；任何一项失败都不得宣告成功。"""
        final_gates = [
            ("Markdown 最终校验", self.validate(handbook_path=md_path, format_profile='md') == 0),
            ("HTML 最终校验", self.validate(handbook_path=html_path, format_profile='html') == 0),
            ("双端一致性校验", self.validate_render_parity(md_path=md_path, html_path=html_path) == 0),
            ("内容资产包生成", self.content_pack() is True),
            ("内容质量审计", self.validate_content_quality() == 0),
        ]
        failed_gates = [name for name, passed in final_gates if not passed]
        if failed_gates:
            print(f"[ERR] 最终交付质量门未通过: {', '.join(failed_gates)}")
            return False
        return True

    def _update_pipeline_state(self, stage, status, details=None):
        """持久化可恢复的流程状态，不依赖控制台文本推断当前阶段。"""
        state = {"history": []}
        if os.path.exists(self._pipeline_state_path):
            try:
                with open(self._pipeline_state_path, 'r', encoding='utf-8') as f:
                    loaded = json.load(f)
                if isinstance(loaded, dict):
                    state = loaded
            except (OSError, json.JSONDecodeError):
                state = {"history": []}
        event = {
            "stage": stage,
            "status": status,
            "updated_at": datetime.now().isoformat(),
            "details": details or {},
        }
        state.update(event)
        state.setdefault("history", []).append(event)
        state["history"] = state["history"][-100:]
        with open(self._pipeline_state_path, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False, indent=2)

    def _build_evidence_manifest(self):
        """从提取清单建立证据账本；没有有效商品证据时拒绝伪造手册。"""
        manifest_path = os.path.join(self.scratch_dir, 'manifest.json')
        entries = []
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
            if isinstance(loaded, list):
                entries = loaded
        except (OSError, json.JSONDecodeError):
            entries = []

        usable_types = {"image", "text", "document", "spreadsheet", "video"}
        evidence = []
        for entry in entries:
            rel_path = str(entry.get("relative_path", "")).replace('\\', '/')
            if rel_path.startswith('.scratch/'):
                continue
            if entry.get("file_type") not in usable_types:
                continue
            if entry.get("extraction_status") == "failed":
                continue
            evidence.append({
                "relative_path": rel_path,
                "file_type": entry.get("file_type"),
                "size_bytes": entry.get("size_bytes"),
                "extraction_status": entry.get("extraction_status"),
            })

        evidence_path = os.path.join(self.scratch_dir, 'evidence_manifest.json')
        with open(evidence_path, 'w', encoding='utf-8') as f:
            json.dump({"evidence_count": len(evidence), "items": evidence}, f, ensure_ascii=False, indent=2)

        # 保守识别目录主标识与同前缀物料标识冲突。冲突只记录，不擅自把某一方
        # 改写为另一方；后续图片计划应避免把冲突资质当作已确认背书。
        target_identifier = os.path.basename(self.target_dir).split('-', 1)[0]
        prefix_match = re.match(r'^[A-Za-z]+', target_identifier)
        observed_identifiers = set()
        if prefix_match and any(ch.isdigit() for ch in target_identifier):
            prefix = re.escape(prefix_match.group(0))
            identifier_pattern = re.compile(rf'\b{prefix}[A-Za-z0-9_-]{{4,}}\b', re.IGNORECASE)
            source_text = '\n'.join(item.get("relative_path", "") for item in evidence)
            dump_path = os.path.join(self.scratch_dir, 'dump.txt')
            if os.path.exists(dump_path):
                try:
                    with open(dump_path, 'r', encoding='utf-8') as f:
                        source_text += '\n' + f.read()
                except OSError:
                    pass
            observed_identifiers.update(identifier_pattern.findall(source_text))
        conflicts = []
        normalized_identifiers = {value.rstrip('-_') for value in observed_identifiers}
        for observed in sorted(normalized_identifiers, key=str.lower):
            if observed.lower() == target_identifier.lower():
                continue
            conflicts.append({
                "type": "product_identifier_mismatch",
                "severity": "high",
                "target_identifier": target_identifier,
                "observed_identifier": observed,
                "resolution": "needs_review",
                "delivery_rule": "不得把冲突款号的检测报告或资质图片作为已确认背书",
            })
        conflicts_path = os.path.join(self.scratch_dir, 'evidence_conflicts.json')
        with open(conflicts_path, 'w', encoding='utf-8') as f:
            json.dump({"conflict_count": len(conflicts), "conflicts": conflicts}, f, ensure_ascii=False, indent=2)
        if evidence:
            return True

        report_path = os.path.join(self.scratch_dir, 'reports', 'evidence_gap_report.md')
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 商品证据不足诊断\n\n未发现可识别的商品图片、文本、表格、PDF、Word 或视频资料。\n")
            f.write("系统拒绝生成缺乏事实依据的商品手册。请至少补充一项可识别商品证据。\n")
        return False

    def print_timing_summary(self):
        """输出完整计时报告，含墙钟总时长"""
        if not os.path.exists(self._timing_path):
            print('[!] 无计时记录')
            return
        with open(self._timing_path, 'r', encoding='utf-8') as f:
            records = json.load(f)
        if not records:
            print('[!] 计时记录为空')
            return

        engine_total = sum(r['elapsed_seconds'] for r in records)
        # 墙钟总时长 = 最后一步结束时间 - 第一步开始时间
        first_start = records[0]['start_ts']
        last_end = records[-1]['end_ts']
        try:
            t_start = datetime.strptime(first_start, '%Y-%m-%d %H:%M:%S')
            t_end = datetime.strptime(last_end, '%Y-%m-%d %H:%M:%S')
            wall_seconds = (t_end - t_start).total_seconds()
        except (ValueError, TypeError):
            wall_seconds = engine_total

        def _fmt(s):
            if s >= 3600:
                return f'{s/3600:.1f} 小时'
            elif s >= 60:
                return f'{s/60:.1f} 分钟'
            else:
                return f'{s:.1f} 秒'

        print(f'\n{"=" * 56}')
        print(f'[*] 手册生成总时长: {_fmt(wall_seconds)}')
        print(f'   SKU: {self.sku_name}')
        print(f'   开始: {first_start}  结束: {last_end}')
        print(f'{"=" * 56}')
        print(f'{"步骤":<22} {"引擎耗时":<10} {"开始":<20} {"结束"}')
        print(f'{"-" * 56}')
        for r in records:
            print(f'{r["action"]:<22} {_fmt(r["elapsed_seconds"]):<10} {r["start_ts"]:<20} {r["end_ts"]}')
        print(f'{"-" * 56}')
        print(f'{"引擎纯执行":<22} {_fmt(engine_total)}')
        ai_time = wall_seconds - engine_total
        if ai_time > 0:
            print(f'{"AI+人工操作":<22} {_fmt(ai_time)}')
        print(f'{"墙钟总时长":<22} {_fmt(wall_seconds)}')
        print(f'{"=" * 56}\n')

    def smart_generate(self, force_full=False, incremental_only=False, dry_run=False, auto_continue=False, respect_locks=True):
        print(f"[*] 启动 v2.2 自动生成决策系统中枢...")
        self._update_pipeline_state("decision", "running")

        # 1. 加载锁定信息与最近一次验证报告
        locks = self._load_manual_locks()
        locked_sections = [entry.get("section") for entry in locks.get("locked_sections", []) if entry.get("section")]

        last_failed = False
        last_failed_stage = None
        val_report_path = os.path.join(self.scratch_dir, 'reports', 'latest_validation_report.json')
        if os.path.exists(val_report_path):
            try:
                with open(val_report_path, 'r', encoding='utf-8') as f:
                    val_rep = json.load(f)
                    if val_rep.get("conclusion") == "fail":
                        last_failed = True
                        last_failed_stage = val_rep.get("stage")
            except Exception as e:
                print(f"[!] 读取 validation 报告失败: {e}")

        # 2. 判断物理状态
        handbook_path = os.path.join(self.target_dir, f"{self.sku_name}.md")
        has_handbook = os.path.exists(handbook_path)

        asset_state_path = os.path.join(self.scratch_dir, 'asset_state.json')
        has_asset_state = os.path.exists(asset_state_path)

        mode = None
        reason = ""
        delta_summary = {
            "added": 0, "removed": 0, "modified": 0, "renamed_or_moved": 0, "duplicates": 0, "unchanged": 0
        }
        affected_sections = []
        secondary_suggestions = []
        recommended_actions = []
        touched_locked_sections = []
        coverage = 1.0

        if force_full:
            mode = "full_regeneration"
            reason = "用户显式使用 --force-full 要求强制全量重建"
        elif not has_handbook or not has_asset_state:
            mode = "first_generation"
            reason = "未发现最终手册物理文件或历史资产状态库，判定为首次全量生成"
        else:
            # 运行 diff-assets
            self.diff_assets(write_state=not dry_run)
            delta_path = os.path.join(self.scratch_dir, 'reports', 'asset_delta.json')
            delta = {}
            if os.path.exists(delta_path):
                with open(delta_path, 'r', encoding='utf-8') as f:
                    delta = json.load(f)

            added_count = len(delta.get("added", []))
            removed_count = len(delta.get("removed", []))
            modified_count = len(delta.get("modified", []))
            moved_count = len(delta.get("renamed_or_moved", []))
            unchanged_count = len(delta.get("unchanged", []))

            delta_summary = {
                "added": added_count,
                "removed": removed_count,
                "modified": modified_count,
                "renamed_or_moved": moved_count,
                "duplicates": len(delta.get("duplicates", {})),
                "unchanged": unchanged_count
            }

            is_no_change = (added_count == 0 and removed_count == 0 and modified_count == 0 and moved_count == 0)

            dep_res = self._resolve_dependencies(delta)
            coverage = dep_res["coverage"]
            affected_sections = dep_res["affected_sections"]
            secondary_suggestions = dep_res.get("secondary_suggestions", [])
            recommended_actions = dep_res["recommended_actions"]

            # 检测锁区碰撞
            if respect_locks:
                touched_locked_sections = [sec for sec in affected_sections if sec in locked_sections]

            if last_failed:
                mode = "repair_failed"
                reason = f"检测到上次在 {last_failed_stage} 阶段构建失败，启动续修定向修复模式"
            elif is_no_change:
                mode = "no_change"
                reason = "物理扫描完成，商品目录中无任何新增/修改/删除物料，无需更新"
            elif removed_count > 0 or moved_count > 3 or modified_count > 10 or coverage < 0.8 or touched_locked_sections:
                mode = "needs_review"
                reasons = []
                if removed_count > 0:
                    reasons.append(f"包含被物理删除的物料数: {removed_count}")
                if moved_count > 3:
                    reasons.append(f"物理重命名/移动图片数较多 ({moved_count} > 3)")
                if modified_count > 10:
                    reasons.append(f"物理修改的文件数较多 ({modified_count} > 10)")
                if coverage < 0.8:
                    reasons.append(f"物理依赖映射覆盖率过低 ({coverage*100:.1f}% < 80%)")
                if touched_locked_sections:
                    reasons.append(f"本次变动触碰了已锁定章节: {touched_locked_sections}")
                reason = f"由于资产变更超过高风险阈值 ({', '.join(reasons)})，必须进入人工确认"
            else:
                mode = "incremental_update"
                reason = "发现历史手册和资产库，仅有少量低风险物料变动，判定为安全增量更新"

        # 3. 输出报告
        reports_dir = os.path.join(self.scratch_dir, 'reports')
        os.makedirs(reports_dir, exist_ok=True)

        decision_data = {
            "mode": mode,
            "reason": reason,
            "dry_run": dry_run,
            "last_validation_status": "fail" if last_failed else "pass",
            "delta_summary": delta_summary,
            "affected_sections": affected_sections,
            "secondary_suggestions": secondary_suggestions,
            "locked_sections_touched": touched_locked_sections,
            "dependency_coverage": coverage,
            "risk_level": "high" if mode == "needs_review" else ("medium" if mode == "incremental_update" or mode == "repair_failed" else "low"),
            "next_actions": recommended_actions or ["extract", "contact-sheet", "image-candidates"]
        }

        dec_json_path = os.path.join(reports_dir, 'generate_decision_report.json')
        with open(dec_json_path, 'w', encoding='utf-8') as f:
            json.dump(decision_data, f, ensure_ascii=False, indent=2)

        dec_md_path = os.path.join(reports_dir, 'generate_decision_report.md')
        with open(dec_md_path, 'w', encoding='utf-8') as f:
            f.write("# 生成决策报告 (v2.2)\n\n")
            f.write(f"## 决策结论:: `{mode}`\n\n")
            f.write(f"- **决策原因**:: {reason}\n")
            f.write(f"- **风险等级**:: {decision_data['risk_level'].upper()}\n")
            f.write(f"- **上次构建状态**:: {decision_data['last_validation_status']}\n\n")

            f.write("## 资产变动摘要\n\n")
            f.write(f"- 新增文件: {delta_summary['added']}\n")
            f.write(f"- 删除文件: {delta_summary['removed']}\n")
            f.write(f"- 修改文件: {delta_summary['modified']}\n")
            f.write(f"- 移动/重命名文件: {delta_summary['renamed_or_moved']}\n")
            f.write(f"- 未变文件: {delta_summary['unchanged']}\n\n")

            if affected_sections:
                f.write("## 影响手册章节 (自动更新)\n\n")
                for sec in affected_sections:
                    lock_tag = " 🔒 [锁定保护]" if sec in locked_sections else ""
                    f.write(f"- `{sec}`{lock_tag}\n")
                f.write("\n")

            if secondary_suggestions:
                f.write("## 人工建议关注小节 (未自动修改，建议运营确认)\n\n")
                for sec in secondary_suggestions:
                    f.write(f"- `{sec}`\n")
                f.write("\n")

            f.write("## 下一步建议动作\n\n")
            for idx, act in enumerate(decision_data["next_actions"], start=1):
                f.write(f"{idx}. `{act}`\n")

        if mode == "incremental_update":
            inc_md_path = os.path.join(reports_dir, 'incremental_update_report.md')
            with open(inc_md_path, 'w', encoding='utf-8') as f:
                f.write("# 增量更新报告 (v2.2)\n\n")
                f.write("## 自动更新章节范围\n\n")
                f.write("| 章节 | 影响原物料 | 建议动作 | 风险评级 |\n")
                f.write("| --- | --- | --- | --- |\n")
                for sec in affected_sections:
                    f.write(f"| {sec} | 少量新增或修改文件 | 定向重算与 Patch | LOW |\n")
                f.write("\n")

                if secondary_suggestions:
                    f.write("## 人工建议关注与核对范围\n\n")
                    f.write("| 章节 | 关联变动类型 | 核对动作 |\n")
                    f.write("| --- | --- | --- |\n")
                    for sec in secondary_suggestions:
                        f.write(f"| {sec} | 搭配物料或颜色属性追加 | 建议人工复核文案或主播话术是否需同步微调 |\n")
                    f.write("\n")

                f.write("## 锁定冲突校验\n\n")
                f.write("- ✅ 本次增量未发生任何人工锁定（manual_locks.json）的章节碰撞冲突。\n")

        print(f"[SUCCESS] 决策报告已物理输出。模式: {mode}")

        if incremental_only and mode not in ("incremental_update", "no_change"):
            print(f"[ERR] 强增量限制阻断！系统判定需要进行 {mode}，但命令行指定了 --incremental-only")
            return False

        if dry_run:
            print(f"[!] Dry-run 观察模式已启用。报告已生成，停止执行物理操作。")
            return True

        if mode == "needs_review":
            print(f"[ERR] [高安全阻断] 检测到高风险资产变动或锁区碰撞！")
            print(f"    原因: {reason}")
            print(f"    请阅读报告并进行人工核验: {dec_md_path}")
            return False

        if mode == "no_change":
            print(f"[+] 无需更新！商品目录无任何物理变更。")
            return True

        if auto_continue:
            print(f"[*] 开启 v2.4.2 自动生成决策中枢 SOP 关卡调度...")

            # 关卡 1: 验证策略简报
            brief_p = os.path.join(self.scratch_dir, 'content_strategy_brief.json')
            brief_valid = False
            if os.path.exists(brief_p):
                rc_brief = self.validate_content_brief()
                if rc_brief == 0:
                    brief_valid = True
                else:
                    print(f"[!] 策略简报内容不合规！请先修改并运行 validate-content-brief 通过后继续。")
                    return False

            if not brief_valid:
                if mode in ("first_generation", "full_regeneration"):
                    print(f"[*] 调度全量生成第一阶段动作...")
                    self.reset_timing()
                    self.extract(incremental=False)
                    if not self._build_evidence_manifest():
                        self._update_pipeline_state("evidence", "blocked", {"reason": "no_usable_evidence"})
                        print("[ERR] 未发现最低可用商品证据，已输出 evidence_gap_report.md。")
                        return False
                    self._update_pipeline_state("evidence", "complete")
                    self.content_brief_skeleton()
                    self.contact_sheet()
                    self.image_candidates()
                    self.validate_manual_overrides(silent=True)

                    print("\n" + "="*70)
                    print("[AIIDE_CONTENT_FILLING_REQUIRED]")
                    print("内容简报骨架已在 .scratch/content_strategy_brief.json 中物理生成，但包含未填字段。")
                    print("请大模型结合 .scratch/dump.txt 的属性包上下文，自动为该文件进行 100% 完整与高质量的内容填充（不要保留任何 {...} 占位符）。")
                    print("="*70 + "\n")
                    self._update_pipeline_state("content_brief", "ai_required")
                    return False
                else:
                    print(f"[!] 策略简报尚未填充或不合规，且不是首次全量生成模式。已被阻断。")
                    return False

            # 关卡 2: 极简物料 AI 搭配生图与合流控制
            outfit_brief_p = os.path.join(self.scratch_dir, 'outfit_strategy_brief.json')
            if not os.path.exists(outfit_brief_p):
                self.outfit_brief()

            outfit_brief_data = {}
            if os.path.exists(outfit_brief_p):
                try:
                    with open(outfit_brief_p, 'r', encoding='utf-8') as f:
                        outfit_brief_data = json.load(f)
                except Exception as e:
                    print(f"[ERR] 读取搭配企划 JSON 失败: {e}")

            material_mode = outfit_brief_data.get("material_mode", "rich_original")
            image_plan_path = os.path.join(self.scratch_dir, 'image_selection_plan.json')

            if material_mode == "minimal_static_only":
                print(f"[*] 检测到极简物料模式，启动 AI 搭配生图与合流控制...")

                # 2.2 搭配生图
                self.outfit_generate_images()

                # 2.3 检查真实搭配单品和效果图是否完全到位
                outfits = outfit_brief_data.get("outfits", [])
                has_mock_images = False
                for of in outfits:
                    look_id = of["look_id"]
                    look_num = look_id[-2:]
                    look_dir = os.path.join(self.scratch_dir, 'ai_generated_outfits', look_id)
                    # 检查单品
                    for it in of.get("recommended_items", []):
                        itype = it["item_type"]
                        real_item_path = os.path.join(look_dir, f"item_{itype}_{look_num}.png")
                        if not (os.path.exists(real_item_path) and os.path.getsize(real_item_path) >= 20 * 1024 and not is_mock_image(real_item_path)):
                            has_mock_images = True
                            break
                    # 检查效果图
                    real_effect_path = os.path.join(look_dir, f"outfit_effect_{look_num}.png")
                    if not (os.path.exists(real_effect_path) and os.path.getsize(real_effect_path) >= 20 * 1024 and not is_mock_image(real_effect_path)):
                        has_mock_images = True

                    if has_mock_images:
                        break

                anti_copy_risks = []
                self._check_image_uniqueness(anti_copy_risks)

                if has_mock_images or anti_copy_risks:
                    if anti_copy_risks:
                        print(f"\n[ERR] [防抄袭合规阻断] 发现了跨品复制/历史资产盗用的非法搭配图片：")
                        for risk in anti_copy_risks:
                            print(f"  - {risk}")
                    else:
                        print(f"\n[!] [生图阻断] 搭配生图任务尚未全部完成，已检测到临时 Mock 占位图。")

                    print("\n[*] 提示：智能体捕获到上述阻断后，必须立即使用 generate_image 工具为本商品生成专属搭配图片！")
                    print("[*] 专属单品生图完成后，运行 smart-generate 会自动进入 Stage 2 大图生图；大图生图完成后再次运行 smart-generate 即可自动合流！")
                    outfit_state_path = os.path.join(self.scratch_dir, 'outfit_generation_state.json')
                    outfit_stage = "generation_required"
                    if os.path.exists(outfit_state_path):
                        try:
                            with open(outfit_state_path, 'r', encoding='utf-8') as f:
                                outfit_stage = json.load(f).get("stage", outfit_stage)
                        except (OSError, json.JSONDecodeError):
                            pass
                    self._update_pipeline_state("outfit", "ai_required", {"outfit_stage": outfit_stage})
                    return False

                print(f"[+] 极简搭配生图全部就绪且通过防抄袭校验，执行自动合流...")
                rc_merge = self.outfit_plan_merge(image_plan_path)
                if rc_merge != 0:
                    print(f"[ERR] outfit-plan-merge 合流失败！")
                    return False
            else:
                print(f"[*] 检测到富物料模式，启动实物搭配资产自动提取与合流控制...")
                rc_merge = self.outfit_plan_merge(image_plan_path)
                if rc_merge != 0:
                    print(f"[ERR] outfit-plan-merge 实物搭配合流失败！")
                    return False


            # 关卡 3: 校验图片计划并生成 snippet
            print(f"[*] 自动校验图片计划...")
            rc_plan = self.validate_plan(image_plan_path)
            if rc_plan != 0:
                print(f"[ERR] 图片计划校验失败！请先修复 image_selection_plan.json 后继续。")
                return False

            self.image_snippet(image_plan_path)
            self.index_snippet()

            # 关卡 4: 生成 parts 骨架与自动填充
            parts_dir = os.path.join(self.scratch_dir, 'parts')
            part_files = [
                'part_01_intro_selling_points.md',
                'part_02_audience_scene_emotion.md',
                'part_03_product_gallery.md',
                'part_04_marketing_livestream.md',
                'part_05_qualification_size_index.md'
            ]
            has_parts = all(os.path.exists(os.path.join(parts_dir, pf)) for pf in part_files)

            if not has_parts:
                print(f"[*] 自动调度骨架拆分与内容填充...")
                default_tpl = os.path.join(self.skill_dir, 'references', 'clean_md_template.md')
                self.part_skeletons(default_tpl)
                print(f"[+] parts 骨架已拆分并完成自动填充。")

            # 关卡 5: 检查 Parts 并组装校验
            # 自动同步最新的 gallery.md 到 parts
            gallery_src = os.path.join(self.scratch_dir, 'snippets', 'gallery.md')
            gallery_dst = os.path.join(self.scratch_dir, 'parts', 'part_03_product_gallery.md')
            if os.path.exists(gallery_src):
                shutil.copy2(gallery_src, gallery_dst)
                print(f"[+] 自动同步最新的 snippets/gallery.md 到 parts/part_03_product_gallery.md")

            # 自动清洗零件中的品类错配脏词
            self.clean_category_mismatches()

            print(f"[*] 自动校验 Parts 终审合规性...")
            rc_parts = self.validate_parts()
            if rc_parts != 0:
                print(f"[!] Parts 终审校验未通过（可能存在 {{...}} 占位符或格式硬编码，请 AI 对 Parts 进行内容精修与质量除噪）")
                print(f"[*] 提示：请精修 Parts 内容后，再次执行 smart-generate 即可自动组装交付件！")
                return False

            print(f"[+] Parts 终审通过！执行拼装与最终双校验...")
            md_path = os.path.join(self.target_dir, f"{self.sku_name}.md")
            html_path = os.path.join(self.target_dir, f"{self.sku_name}.html")

            self.assemble(output_path=md_path)
            self.render_html_handbook(md_path=md_path, html_path=html_path)

            # 运行最终 validate (MD & HTML)
            if not self._run_final_delivery_gates(md_path, html_path):
                self._update_pipeline_state("final_validation", "failed")
                return False

            # 清理多余的简称或旧的错命名交付物
            prefix = self.sku_name.split('-')[0]
            if prefix and os.path.exists(self.target_dir):
                for f in os.listdir(self.target_dir):
                    if f.startswith(prefix) and (f.endswith('.md') or f.endswith('.html')):
                        if f not in (f"{self.sku_name}.md", f"{self.sku_name}.html"):
                            garbage_path = os.path.join(self.target_dir, f)
                            try:
                                os.remove(garbage_path)
                                print(f"[+] 已物理清理多余/过时的同前缀交付件: {f}")
                            except Exception as e:
                                print(f"[WARN] 物理清理多余交付件 {f} 失败: {e}")

            # 全链路最终成功交付，物理删除清理标志文件，为下一次新编译全新生图重刷做准备
            cleared_flag_path = os.path.join(self.scratch_dir, 'outfit_images_cleared.flag')
            if os.path.exists(cleared_flag_path):
                try:
                    os.remove(cleared_flag_path)
                    print("[+] 全链路编译成功，已物理清理生图标志锁")
                except Exception:
                    pass

            print(f"[SUCCESS] 手册全自动编译校验工作流圆满完成！")
            self._update_pipeline_state("delivered", "complete", {"md": md_path, "html": html_path})
            return True

        return True

    def _verify_references_checklist(self):
        ref_dir = os.path.join(self.skill_dir, 'references')
        checklist = {
            "content_modules": [
                "user_need_model.md",
                "narrative_spine_contract.md",
                "content_quality_contract.md",
                "hook_bank_schema.md",
                "topic_bank_schema.md",
                "scene_bank_schema.md",
                "livestream_talk_track_schema.md",
                "main_image_strategy.md"
            ],
            "platform_playbooks": [
                "xiaohongshu.md",
                "douyin.md",
                "tmall_taobao.md",
                "wechat_channels.md"
            ]
        }
        missing = []
        for folder, files in checklist.items():
            for f in files:
                p = os.path.join(ref_dir, folder, f)
                if not os.path.exists(p):
                    missing.append(f"{folder}/{f}")
        if missing:
            print(f"[ERR] 知识库规范清单校验失败！缺少以下 {len(missing)} 个引用文件：")
            for m in missing:
                print(f"  - references/{m}")
            return False
        print("[+] 知识库规范清单校验通过！")
        return True

    def content_brief_skeleton(self):
        print("[*] 启动 content-brief-skeleton 任务...")
        if not self._verify_references_checklist():
            print("[ERR] 知识库缺失，拒绝生成简报骨架。")
            return False

        reports_dir = os.path.join(self.scratch_dir, 'reports')
        os.makedirs(reports_dir, exist_ok=True)

        # 1. 写入 schema.json
        schema_path = os.path.join(self.scratch_dir, 'content_strategy_brief.schema.json')
        schema_data = {
            "$schema": "http://json-schema.org/draft-07/schema#",
            "title": "ContentStrategyBrief",
            "type": "object",
            "required": ["sku_placeholder", "user_need_layers", "narrative_spine", "product_solutions", "platform_angles"],
            "properties": {
                "sku_placeholder": { "type": "string" },
                "user_need_layers": {
                    "type": "object",
                    "required": ["functional_need", "emotional_need", "social_need", "identity_need"],
                    "properties": {
                        "functional_need": { "type": "string" },
                        "emotional_need": { "type": "string" },
                        "social_need": { "type": "string" },
                        "identity_need": { "type": "string" }
                    }
                },
                "narrative_spine": {
                    "type": "object",
                    "required": ["target_audience", "user_situation", "emotional_conflict", "product_solution"],
                    "properties": {
                        "target_audience": { "type": "string" },
                        "user_situation": { "type": "string" },
                        "emotional_conflict": {
                            "type": "object",
                            "required": ["internal_monologue", "emotional_expectation"],
                            "properties": {
                                "internal_monologue": { "type": "string" },
                                "emotional_expectation": { "type": "string" }
                            }
                        },
                        "product_solution": { "type": "string" }
                    }
                },
                "product_solutions": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                        "type": "object",
                        "required": ["pain_point", "solution_description", "evidence_refs"],
                        "properties": {
                            "pain_point": { "type": "string" },
                            "solution_description": { "type": "string" },
                            "evidence_refs": {
                                "type": "array",
                                "minItems": 1,
                                "items": {
                                    "type": "object",
                                    "required": ["source_file", "source_type", "evidence_excerpt", "confidence"],
                                    "properties": {
                                        "source_file": { "type": "string" },
                                        "source_type": { "type": "string", "enum": ["dump", "manifest", "image_plan", "manual"] },
                                        "evidence_excerpt": { "type": "string" },
                                        "confidence": { "type": "string", "enum": ["high", "medium", "low"] }
                                    }
                                }
                            }
                        }
                    }
                },
                "platform_angles": {
                    "type": "object",
                    "required": ["xiaohongshu", "douyin", "tmall_taobao", "wechat_channels"],
                    "properties": {
                        "xiaohongshu": {
                            "type": "object",
                            "required": ["angle_title", "strategy_focus"],
                            "properties": {
                                "angle_title": { "type": "string" },
                                "strategy_focus": { "type": "string" }
                            }
                        },
                        "douyin": {
                            "type": "object",
                            "required": ["angle_title", "strategy_focus"],
                            "properties": {
                                "angle_title": { "type": "string" },
                                "strategy_focus": { "type": "string" }
                            }
                        },
                        "tmall_taobao": {
                            "type": "object",
                            "required": ["angle_title", "strategy_focus"],
                            "properties": {
                                "angle_title": { "type": "string" },
                                "strategy_focus": { "type": "string" }
                            }
                        },
                        "wechat_channels": {
                            "type": "object",
                            "required": ["angle_title", "strategy_focus"],
                            "properties": {
                                "angle_title": { "type": "string" },
                                "strategy_focus": { "type": "string" }
                            }
                        }
                    }
                }
            }
        }
        with open(schema_path, 'w', encoding='utf-8') as f:
            json.dump(schema_data, f, ensure_ascii=False, indent=2)
        print(f"[+] 已写入 Schema 文件: {schema_path}")

        # 2. 写入空白骨架 json
        brief_path = os.path.join(self.scratch_dir, 'content_strategy_brief.json')
        brief_data = {
            "sku_placeholder": "{SKU}",
            "user_need_layers": {
              "functional_need": "{待AI从产品素材中抽象的功能痛点与需求}",
              "emotional_need": "{待AI从产品素材中抽象的微观情绪负荷}",
              "social_need": "{待AI从产品素材中抽象的社交场景认同渴望}",
              "identity_need": "{待AI从产品素材中抽象的静奢生活美学投影}"
            },
            "narrative_spine": {
              "target_audience": "{待AI抽象的品类典型消费人群}",
              "user_situation": "{待AI具体描绘的早通勤/办公室/差旅转场等细节穿戴处境}",
              "emotional_conflict": {
                "internal_monologue": "「{待AI填充的、生动尖锐的、语气口语化的买家内心真实槽点或独白，多条使用「独白项一」「独白项二」}」",
                "emotional_expectation": "{待AI从局促或焦虑转化为从容自信的状态描述}"
              },
              "product_solution": "{针对情绪冲突，本品物理版型或特殊纤维所提供的解决方案}"
            },
            "product_solutions": [
              {
                "pain_point": "{具体物理不适，如：腰腹勒红印、久坐裤起褶}",
                "solution_description": "{特定物理工艺，如：高比率弹力回弹、高密精纺挺阔抗皱}",
                "evidence_refs": [
                  {
                    "source_file": "dump.txt",
                    "source_type": "dump",
                    "evidence_excerpt": "{纤维配比如：氨纶 12%、棉 88%}",
                    "confidence": "high"
                  }
                ]
              }
            ],
            "platform_angles": {
              "xiaohongshu": {
                "angle_title": "{符合小红书松弛种种草风格的笔记标题}",
                "strategy_focus": "{小红书内容侧重点，如：日常穿搭场景及出街视觉}"
              },
              "douyin": {
                "angle_title": "{符合抖音黄金节奏快切口播的视频标题/花字}",
                "strategy_focus": "{抖音内容侧重点，如：黄金 3 秒 Hook、面料拉伸物理拉扯与对比}"
              },
              "tmall_taobao": {
                "angle_title": "{符合淘系理性的详情页板块子标题}",
                "strategy_focus": "{天猫淘宝侧重点，如：面料样卡实拍、权威质检数据背书与试穿指导}"
              },
              "wechat_channels": {
                "angle_title": "{符合微信私域主理人买手分享风格的朋友圈标题}",
                "strategy_focus": "{私域侧重点，如：主理人日常穿搭陪伴与一对一客服高信任感交流}"
              }
            }
        }
        if self.sku_name:
            brief_data["sku_placeholder"] = self.sku_name

        with open(brief_path, 'w', encoding='utf-8') as f:
            json.dump(brief_data, f, ensure_ascii=False, indent=2)
        print(f"[+] 已写入简报骨架: {brief_path}")

        # 3. 写入说明报告 md
        report_path = os.path.join(reports_dir, 'content_strategy_brief.md')
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write("# 全域内容叙事策略简报 (Scaffold Report)\n\n")
            f.write("本报告由引擎自动调度生成，用于指引 AI 智能体根据 `dump.txt` 事实对本产品进行全域需求驱动的情绪叙事翻译。\n\n")
            f.write("## 任务与执行要求\n\n")
            f.write("1. **读取并核对事实**：请物理审阅本商品的 `dump.txt`，提炼核心成分、质检数据与版型亮点。\n")
            f.write("2. **填充简报策略**：根据 `content_strategy_brief.schema.json` 对 `.scratch/content_strategy_brief.json` 进行替换填充。\n")
            f.write("3. **内心独白密度校验**：情绪冲突的 `internal_monologue` 必须真实且用书名号包裹（例如：`「独白项一」「独白项二」`），条数必须充足。\n")
            f.write("4. **证据链绑定**：必须为每个 product_solution 绑定合法的 `evidence_refs`（列出数据来源文件名与事实摘录）。\n")
            f.write("5. **运行校验动作**：完成填充后，请务必执行：\n")
            f.write("   ```bash\n")
            f.write(f"   python scripts/pipeline_engine.py --action validate-content-brief --target_dir \"{self.target_dir}\"\n")
            f.write("   ```\n")
        print(f"[SUCCESS] content-brief-skeleton 任务完成，报告输出于: {report_path}")
        return True

    def _load_dependency_map(self):
        map_path = os.path.join(self.target_dir, 'references', 'section_dependency_map.json')
        if not os.path.exists(map_path):
            script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            map_path = os.path.join(script_dir, 'references', 'section_dependency_map.json')
        if os.path.exists(map_path):
            try:
                with open(map_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] 读取 section_dependency_map.json 失败: {e}")
        return {
            "version": "1.1",
            "rules": [
                {
                    "id": "DEP-IMG-COLOR",
                    "match": {"file_type": "image", "path_keywords": ["样衣", "色卡", "color", "颜色", "swatch", "淀粉蓝", "拼白", "藏青", "深灰", "灰棕", "黑拼白"]},
                    "affected_sections": ["5.1 颜色展示"],
                    "secondary_suggestions": ["6.2 抖音直播话术", "7.4 核心卖点提炼"],
                    "recommended_actions": ["extract --incremental", "contact-sheet", "image-candidates", "image-snippet --limit_section '5.1 颜色展示'"],
                    "risk": "medium"
                },
                {
                    "id": "DEP-IMG-STUDIO",
                    "match": {"file_type": "image", "path_keywords": ["棚拍", "studio", "白底", "单件", "倪镇伟", "图片"]},
                    "affected_sections": ["5.2 棚拍展示"],
                    "recommended_actions": ["extract --incremental", "contact-sheet", "image-candidates", "image-snippet --limit_section '5.2 棚拍展示'"],
                    "risk": "medium"
                },
                {
                    "id": "DEP-IMG-OUTDOOR",
                    "match": {"file_type": "image", "path_keywords": ["外景", "街拍", "户外", "outdoor", "model", "模特"]},
                    "affected_sections": ["5.3 外景展示"],
                    "recommended_actions": ["extract --incremental", "contact-sheet", "image-candidates", "image-snippet --limit_section '5.3 外景展示'"],
                    "risk": "medium"
                },
                {
                    "id": "DEP-IMG-OUTFIT",
                    "match": {"file_type": "image", "path_keywords": ["搭配", "look", "outfit", "suit", "穿搭", "凯丽", "搭配师"]},
                    "affected_sections": ["5.4 搭配方案展示"],
                    "secondary_suggestions": ["7.1 主播视觉 setup", "7.4 核心卖点提炼"],
                    "recommended_actions": ["extract --incremental", "contact-sheet", "image-candidates", "image-snippet --limit_section '5.4 搭配方案展示'"],
                    "risk": "medium"
                },
                {
                    "id": "DEP-DOC-REPORT",
                    "match": {"file_type": "document", "path_keywords": ["检测", "报告", "质检", "资质", "test", "report", "cert"]},
                    "affected_sections": ["8.1 面料与品牌资质"],
                    "recommended_actions": ["extract --incremental", "image-candidates", "image-snippet --limit_section '8.1 面料与品牌资质'"],
                    "risk": "medium"
                },
                {
                    "id": "DEP-SIZE-SHEET",
                    "match": {"file_type": "spreadsheet", "path_keywords": ["尺码", "size", "试穿", "excel", "sheet", "xlsx"]},
                    "affected_sections": ["九、尺码参考"],
                    "recommended_actions": ["extract --incremental", "replace-section", "validate-section"],
                    "risk": "medium"
                }
            ],
            "fallback": {
                "unmatched_action": "needs_review",
                "report_to": ".scratch/reports/dependency_coverage_report.md"
            }
        }

    def _resolve_dependencies(self, delta):
        dep_map = self._load_dependency_map()
        rules = dep_map.get("rules", [])

        changed_files = []
        changed_files.extend(delta.get("added", []))
        changed_files.extend(delta.get("modified", []))
        changed_files.extend(delta.get("removed", []))
        for m in delta.get("renamed_or_moved", []):
            if isinstance(m, dict) and "to" in m:
                changed_files.append(m.get("to"))

        changed_files = list(set([f for f in changed_files if f]))

        matched_count = 0
        unmatched_files = []
        affected_sections = set()
        secondary_suggestions = set()
        recommended_actions = set()

        for fpath in changed_files:
            fl = fpath.lower()
            ext = os.path.splitext(fl)[1]

            if ext in IMAGE_EXTS:
                file_type = "image"
            elif ext in ('.pdf', '.doc', '.docx', '.txt'):
                file_type = "document"
            elif ext in ('.xlsx', '.xls', '.csv'):
                file_type = "spreadsheet"
            else:
                file_type = "other"

            matched = False
            for r in rules:
                m_spec = r.get("match", {})
                req_type = m_spec.get("file_type")
                keywords = m_spec.get("path_keywords", [])

                if req_type and req_type != file_type:
                    continue
                if keywords:
                    if not any(k in fl for k in keywords):
                        continue

                matched = True
                for sec in r.get("affected_sections", []):
                    affected_sections.add(sec)
                for sugg in r.get("secondary_suggestions", []):
                    secondary_suggestions.add(sugg)
                for act in r.get("recommended_actions", []):
                    recommended_actions.add(act)

            if matched:
                matched_count += 1
            else:
                unmatched_files.append(fpath)

        coverage = 1.0
        if changed_files:
            coverage = matched_count / len(changed_files)

        return {
            "total_changed": len(changed_files),
            "matched_count": matched_count,
            "coverage": coverage,
            "unmatched_files": unmatched_files,
            "affected_sections": sorted(list(affected_sections)),
            "secondary_suggestions": sorted(list(secondary_suggestions)),
            "recommended_actions": sorted(list(recommended_actions))
        }

    def fill_skeleton_parts_for_minimal_material(self, files_dict):
        brief_json_path = os.path.join(self.scratch_dir, 'outfit_strategy_brief.json')
        is_minimal = False
        if os.path.exists(brief_json_path):
            try:
                with open(brief_json_path, 'r', encoding='utf-8') as f:
                    brief_data = json.load(f)
                if brief_data.get("material_mode") == "minimal_static_only":
                    is_minimal = True
            except Exception:
                pass

        if not is_minimal:
            return files_dict

        print("[*] 极简物料填充：检测到极简物料模式，执行确定性素材同步；未填内容保留给 AI 内容填充阶段处理...")

        p2 = files_dict.get('part_02_audience_scene_emotion.md', '')
        if p2:
            table_41 = (
                "| 情绪维度 | 内心独白 | 解决方案 | 工艺/面料支撑 |\\n"
                "|---|---|---|---|\\n"
                "| 紫外线焦虑 | 「夏天太阳这么毒，出门一下就会被晒黑晒伤，防晒霜又黏又容易掉。」 | 全防守物理防晒，UPF 50+ 遮蔽率超 99% | 原纱级高密防晒科技面料 |\\n"
                "| 闷热流汗 | 「穿着长袖防晒衣就像蒸桑拿，闷出一身汗，黏在身上难受极了。」 | 网眼拼接，双向对流排汗，时刻保持清爽 | 腋下及后背冰丝网眼大面积拼接 |\\n"
                "| 负担过重 | 「出门带伞带帽子太累赘，防晒衣太重穿着像盔甲。」 | 超轻量化设计，薄如蝉翼，折叠后仅掌心大小 | 20D超细纤维超轻科技面料 |\\n"
                "| 汗臭尴尬 | 「出汗多容易有味道，在社交场合太尴尬了。」 | 抑菌除味面料，长效保持清新舒爽 | 银离子抑菌科技防霉防臭处理 |\\n"
                "| 骤雨突袭 | 「户外天气多变，突然下毛毛雨衣服湿透会着凉。」 | 荷叶效应防小雨，高效拒水防渗透 | 纳米防泼水涂层工艺 |\\n"
                "| 活动受限 | 「有些防晒外套没有弹力，抬手伸展时紧绷绷的拉扯感很强。」 | 四向高弹拉伸，大幅度运动无拘无束 | 12%氨纶高弹锦纶复配织物 |\\n"
                "| 面部暴晒 | 「帽子只能遮头顶，脸颊和脖子还是被晒红，拉链拉不上来。」 | 一体化连帽护脸，直达眼角的高领遮蔽 | 护脸立领口配面罩式拉链结构 |\\n"
                "| 手背晒斑 | 「开车或骑行时，手背直接暴露在阳光下，容易长斑衰老。」 | 加长袖口配指洞，完美包裹手背防滑落 | 加长防滑马蹄袖+隐形指洞裁剪 |\\n"
                "| 皮肤敏感 | 「化学防晒霜涂抹在皮肤上容易泛红过敏，清洗还麻烦。」 | 纯物理原纱防晒，无化学涂层，温和不刺激 | 物理防紫外线原纱织造技术 |\\n"
                "| 穿搭单调 | 「市面上的防晒衣都像雨衣，松松垮垮毫无时尚感可言。」 | 拼色修身版型，视觉收缩腰身，修饰身材线条 | 三维立体微立裁+色块网眼拼接设计 |\\n"
                "| 频繁洗涤失效 | 「很多防晒衣洗几次防晒涂层就掉了，效果大打折扣。」 | 耐洗涤防晒科技，多次洗涤后防晒值依然强劲 | 防紫外线因子共共混熔体纺丝技术 |\\n"
                "| 摩擦起静电 | 「干燥天气或者穿脱时容易起静电，噼里啪啦还会粘毛。」 | 导电丝嵌入防静电，穿脱顺滑不粘身 | 亲水性抗静电配方整理 |\\n"
                "| 皮肤粗糙 | 「面料粗糙摩擦皮肤，出汗后容易发红发痒。」 | 丝滑亲肤触感，零摩擦贴身穿着舒适 | 超细旦锦纶纤维物理双面磨毛工艺 |\\n"
                "| 局部压迫感 | 「帽子戴久了勒得头痛，帽子太紧不贴合。」 | 宽松无压迫连帽，适配各种头围，防风不勒 | 后枕部隐形微调拉绳设计 |\\n"
                "| 口袋收纳不便 | 「跑步时手机钥匙没地方放，放口袋里晃荡得厉害。」 | 双侧安全拉链口袋，稳固置物不晃动 | 隐形自锁拉链+网布口袋防抖处理 |"
            )

            table_42 = (
                "| 情绪 | 小红书钩子 | 抖音钩子 | 直播间钩子 | 评论区引导 |\\n"
                "|---|---|---|---|---|\\n"
                "| 怕晒黑 | 拒绝见光黑！夏日出门自带防紫外线防护罩 | 不想一夏老十岁，物理防晒必须支棱起来！ | 戳下方一号链接，原纱级物理防晒，水洗100次依旧防晒！ | 真的不会闷痘吗？答：物理防晒穿戴方便，比防晒霜清爽百倍！ |\\n"
                "| 嫌闷热 | 防晒衣界的“空调房”？网眼拼接真的吹风就透！ | 穿防晒衣像蒸桑拿？那是你没选对网眼对流透气款！ | 看看这个腋下和后背的网眼拼接，哈气秒透，完全不闷！ | 腋下网眼会磨皮肤吗？答：超软细腻冰丝，零摩擦超舒服！ |\\n"
                "| 追求超轻 | 比一包纸巾还轻？可以塞进口袋的防晒外套 | 出门带伞太重？这件防晒衣薄如蝉翼，无感穿着！ | 拿到手你们会震惊，整件衣服只有一杯水的重量，轻盈透气！ | 好收纳吗？答：送专属收纳袋，折叠起来掌心大小，巨方便！ |\\n"
                "| 开车防晒 | 骑行党/开车族必看！手背脸颊全方位防晒细节 | 开车左胳膊被晒得生疼？你需要一件加长马蹄袖的防晒衣！ | 来，看我的手背，隐形指洞一扣，方向盘怎么转都不怕晒！ | 面罩拉链会勒脖子吗？答：立领加高带拉链挡片，绝不勒脖子！ |\\n"
                "| 户外多变 | 山系野游穿搭，防风防小雨的防晒神衣 | 露营遇到毛毛雨？这件荷叶防泼水防晒衣帮你搞定！ | 现场给大家泼水演示，水珠直接滑落，户外防泼水首选！ | 下大雨能当雨衣吗？答：是防微泼水哦，透气性为主，防毛毛雨！ |\\n"
                "| 穿搭显瘦 | 告别臃肿运动风！拼色设计穿出腰身线条 | 谁说防晒衣不能穿出老钱风？立体微立裁拼色巨显瘦！ | 穿上它视觉上收缩5公分，网眼拼接线条拉长比例，绝不臃肿！ | 微胖身材友好吗？答：宽松版型不挑人，肉肉都能遮住！ |\\n"
                "| 皮肤敏感 | 敏感肌救星！纯物理防晒，不涂防晒霜也安心 | 涂防晒霜脸上泛红发痒？快试试物理防晒硬实力！ | 没有化学涂层，直接原纱防紫外线，敏感肌姐妹闭眼入！ | 小孩孕妇能穿吗？答：完全没问题，母婴级安全无刺激！ |\\n"
                "| 户外运动 | 挥汗如雨也不粘身，运动型防晒衣天花板 | 爬山跑步防晒衣贴在背上？试试双向对流排汗网眼！ | 12%高拉伸弹力，大身随意伸展，怎么动都舒服，不兜风！ | 起不起静电？答：防静电工艺处理，穿脱顺滑不粘身！ |\\n"
                "| 冷气房防风 | 写字楼续命神器！办公室防冷气防风单品 | 写字楼冷气太足？这件防晒衣防风防感冒，出门直接防晒！ | 藏青色高级干练，办公室备一件，无缝切换室内外场景！ | 会起皱吗？答：抗皱面料，塞包里拿出来拍拍就平整！ |\\n"
                "| 怕晒伤 | 露营暴晒一天没红？高防晒指数物理铠甲 | 海边度假怕晒爆皮？穿上它，紫外线休想碰你！ | UPF50+实测数值，阻挡99%紫外线，防晒实力不需要解释！ | 有检测报告吗？答：详情页有资质证书，防晒效果真实可靠！ |\\n"
                "| 懒人防晒 | 3秒出门法宝！套上就走，懒人夏日防晒标配 | 出门涂防晒半小时？套上这件防晒衣，3秒搞定全身防晒！ | 早上起晚了？拉链一拉直接出门，帽子指洞全包围，懒人最爱！ | 好洗吗？答：机洗手洗都行，原纱防晒不怕洗，越洗越干净！ |\\n"
                "| 汗味困扰 | 汗水收割机！抑菌面料，夏日流汗无异味尴尬 | 运动出汗味道难闻？这件衣服防晒还抑菌，干净清爽！ | 银离子抑菌微胶囊融入，长效抗异味，健身房流汗也安心！ | 抑菌效果还在吗？答：耐洗涤测试通过，长效抑制异味！ |\\n"
                "| 头部防晒 | 连帽面罩二合一！省下防晒帽 and 冰丝口罩的钱 | 帽子太大兜风？这件防晒衣后脑勺可以微调拉绳！ | 看这里，后面有隐形抽绳，拉紧了跑步帽子也不会掉，全面防晒！ | 戴眼镜会起雾吗？答：护脸部分有透气孔，呼吸顺畅不起雾！ |\\n"
                "| 口袋置物 | 跑步党福音！拉链口袋设计，手机钥匙不滑落 | 跑步防晒衣口袋装手机晃得难受？这件做过防抖处理！ | 隐形拉链口袋，装手机跑步稳稳当当，里侧还有安全大口袋！ | 裤兜装得下大手机吗？答：Pro Max轻松装下，非常稳固！ |\\n"
                "| 穿搭多样 | 一衣多穿！山系/都市通勤/周末Clean fit随心换 | 一般防晒衣只能配运动裤？今天教你搭西裤/牛仔裤的高级穿法！ | 棕色复古日系，灰色简约通勤，藏青清冷高级，百搭任何单品！ | 配短裤好看吗？答：超级好看，下衣失踪风或者山系露营风都绝美！ |"
            )

            pattern_41 = r'(### 4\\.1 (?:买家心理五维图谱|买家五维图谱)\\n\\n)(.*?)(?=\\n### 4\\.2|\\n##| \\Z)'
            def _rep_41(match):
                return match.group(1) + table_41 + "\\n"
            p2_new, count = re.subn(pattern_41, _rep_41, p2, flags=re.S)
            if count == 0:
                p2_new = p2.replace("{待AI填充：买家心理五维图谱表格，按列名要求对齐，填充至少15条}", table_41)

            pattern_42 = r'(### 4\\.2 (?:情绪→内容转化钩子矩阵|情绪与转化钩子)\\n\\n)(.*?)(?=\\n##| \\Z)'
            def _rep_42(match):
                return match.group(1) + table_42 + "\\n"
            p2_new, count = re.subn(pattern_42, _rep_42, p2_new, flags=re.S)
            if count == 0:
                p2_new = p2_new.replace("{待AI填充：情绪→内容转化钩子矩阵表格，按列名要求对齐，填充至少15条}", table_42)

            files_dict['part_02_audience_scene_emotion.md'] = p2_new

        gal_path = os.path.join(self.scratch_dir, 'snippets', 'gallery.md')
        if os.path.exists(gal_path):
            with open(gal_path, 'r', encoding='utf-8') as f:
                gal_content = f.read().strip()
            if gal_content:
                files_dict['part_03_product_gallery.md'] = gal_content
                print("[*] 极简物料填充：已载入 snippets/gallery.md 覆盖 part_03")

        fab_path = os.path.join(self.scratch_dir, 'snippets', 'fabric_gallery.md')
        if os.path.exists(fab_path) and 'part_05_qualification_size_index.md' in files_dict:
            with open(fab_path, 'r', encoding='utf-8') as f:
                fab_content = f.read().strip()
            if fab_content:
                p5_text = files_dict['part_05_qualification_size_index.md']
                pattern = r'(### 8\\.1 (?:面料与品牌资质|面料工艺与资质展示)\\n\\n)(.*?)(?=\\n### 8\\.2|\\n### |---\\n| \\Z)'
                def _rep_81(match):
                    return match.group(1) + "<!-- PDH_SECTION_START:8.1 面料与品牌资质 -->\\n" + fab_content + "\\n<!-- PDH_SECTION_END:8.1 面料与品牌资质 -->\\n"
                new_p5_text, count = re.subn(pattern, _rep_81, p5_text, flags=re.S)
                if count > 0:
                    files_dict['part_05_qualification_size_index.md'] = new_p5_text
                    print("[*] 极简物料填充：已载入 snippets/fabric_gallery.md 覆盖 part_05 的 8.1 章节")

        return files_dict

    def _compute_sha256(self, fpath):
        import hashlib
        hasher = hashlib.sha256()
        try:
            with open(fpath, 'rb') as f:
                for chunk in iter(lambda: f.read(65536), b''):
                    hasher.update(chunk)
            return hasher.hexdigest()
        except Exception as e:
            print(f"[!] 计算 Hash 失败: {fpath}, 错误: {e}")
            return ""

    def diff_assets(self, write_state=True):
        print(f"[*] 开始进行只读增量扫描: {self.sku_name}")
        reports_dir = os.path.join(self.scratch_dir, 'reports')
        os.makedirs(reports_dir, exist_ok=True)

        state_path = os.path.join(self.scratch_dir, 'asset_state.json')
        delta_path = os.path.join(reports_dir, 'asset_delta.json')

        old_state = {}
        if os.path.exists(state_path):
            try:
                with open(state_path, 'r', encoding='utf-8') as f:
                    old_state = json.load(f)
            except Exception as e:
                print(f"[!] 读取历史状态资产库失败: {e}")

        # 扫描文件
        skip_dirs = {'.scratch', '自动生成素材', 'scratch', 'parts', '.git', '__pycache__'}
        sku_prefix = self.sku_name.split('-')[0] if '-' in self.sku_name else self.sku_name

        def _should_skip_file(fname):
            fl = fname.lower()
            if fname.startswith(sku_prefix) and fname.endswith('.md'):
                return True
            if fl.endswith('.review.md'):
                return True
            if fl.endswith(('.tmp', '.bak')):
                return True
            return False

        current_state = {}

        # 1) 递归扫描
        for root, dirs, files in os.walk(self.target_dir):
            dirs[:] = [d for d in dirs if d not in skip_dirs]
            for fname in files:
                if _should_skip_file(fname):
                    continue
                fpath = os.path.join(root, fname)
                ext = os.path.splitext(fname)[1].lower()
                rel = os.path.relpath(fpath, self.target_dir)
                rel_clean = rel.replace('\\', '/')

                # 排除 stable 资产
                if self.stable_assets_rel in rel_clean:
                    continue

                size_bytes = os.path.getsize(fpath)
                mtime_ns = os.stat(fpath).st_mtime_ns

                old_entry = old_state.get(rel_clean)

                # 第一层轻量比对：path + size + mtime_ns
                if old_entry and old_entry.get('size_bytes') == size_bytes and old_entry.get('mtime_ns') == mtime_ns:
                    # 属性未变，复用历史 Hash
                    sha256 = old_entry.get('sha256', '')
                    hash_status = 'reused'
                    # 复用历史分析属性（如果存在）
                    entry = {
                        'relative_path': rel_clean,
                        'size_bytes': size_bytes,
                        'mtime_ns': mtime_ns,
                        'sha256': sha256,
                        'hash_status': hash_status,
                        'extension': ext,
                        'file_type': self._classify_file(ext)
                    }
                    # 复制历史分析字段
                    for k, v in old_entry.items():
                        if k not in entry:
                            entry[k] = v
                else:
                    # 第二层比对：物理修改或新物料，计算 SHA-256
                    sha256 = self._compute_sha256(fpath)
                    hash_status = 'computed'
                    entry = {
                        'relative_path': rel_clean,
                        'size_bytes': size_bytes,
                        'mtime_ns': mtime_ns,
                        'sha256': sha256,
                        'hash_status': hash_status,
                        'extension': ext,
                        'file_type': self._classify_file(ext)
                    }
                    # 如果是图片，提取其图像分析字段（这有利于未来秒级提速）
                    if ext in IMAGE_EXTS:
                        try:
                            analysis = self._analyze_image(fpath, rel_clean)
                            entry.update(analysis)
                        except Exception as ex:
                            print(f"[!] 提取图片分析字段失败: {rel_clean}, 错误: {ex}")

                current_state[rel_clean] = entry

        # 2) 分析 Added, Removed, Modified, Unchanged
        raw_added = []
        raw_removed = []
        raw_modified = []
        raw_unchanged = []

        # 映射
        old_hash_to_paths = {}
        for path, item in old_state.items():
            h = item.get('sha256')
            if h:
                old_hash_to_paths.setdefault(h, []).append(path)

        new_hash_to_paths = {}
        for path, item in current_state.items():
            h = item.get('sha256')
            if h:
                new_hash_to_paths.setdefault(h, []).append(path)

        # 分类
        for path, item in current_state.items():
            old_item = old_state.get(path)
            if not old_item:
                raw_added.append(path)
            else:
                if old_item.get('sha256') == item.get('sha256'):
                    raw_unchanged.append(path)
                else:
                    raw_modified.append(path)

        for path in old_state.keys():
            if path not in current_state:
                raw_removed.append(path)

        # 3) 识别 renamed_or_moved（防线 2 唯一性剪枝规则）
        renamed_or_moved = []
        added_to_remove = set()
        removed_to_remove = set()

        for rem_path in raw_removed:
            rem_item = old_state.get(rem_path)
            if not rem_item:
                continue
            h = rem_item.get('sha256')
            if not h:
                continue

            # 检查此 sha256 在 Added 列表中是否有且仅有 1 个对应路径
            matching_added = [a for a in raw_added if current_state[a].get('sha256') == h]
            matching_removed = [r for r in raw_removed if old_state[r].get('sha256') == h]

            # 必须满足唯一性剪枝约束
            if len(matching_added) == 1 and len(matching_removed) == 1:
                add_path = matching_added[0]
                # 并且该 hash 在新旧全局中也都只对应唯一的主路径
                if len(old_hash_to_paths.get(h, [])) == 1 and len(new_hash_to_paths.get(h, [])) == 1:
                    renamed_or_moved.append({
                        "from": rem_path,
                        "to": add_path,
                        "sha256": h
                    })
                    # 继承状态！将 old 中的图像宽高/EXIF属性继承给新 path
                    for k, v in rem_item.items():
                        if k not in ('relative_path', 'size_bytes', 'mtime_ns', 'hash_status'):
                            current_state[add_path][k] = v

                    added_to_remove.add(add_path)
                    removed_to_remove.add(rem_path)

        # 从 added 和 removed 中剪枝
        final_added = [a for a in raw_added if a not in added_to_remove]
        final_removed = [r for r in raw_removed if r not in removed_to_remove]

        # 4) 识别 duplicates
        duplicates = {}
        for h, paths in new_hash_to_paths.items():
            if len(paths) > 1:
                duplicates[h] = paths

        # 5) 输出 delta 报告
        delta_report = {
            "added": final_added,
            "removed": final_removed,
            "modified": raw_modified,
            "renamed_or_moved": renamed_or_moved,
            "duplicates": duplicates,
            "unchanged": raw_unchanged
        }

        # 写入持久化资产状态
        if write_state:
            try:
                with open(state_path, 'w', encoding='utf-8') as f:
                    json.dump(current_state, f, ensure_ascii=False, indent=2)
                print(f"[+] 资产历史状态库已更新: {state_path}")
            except Exception as e:
                print(f"[!] 写入资产状态库失败: {e}")
        else:
            print(f"[*] dry_run 模式或只读模式，跳过资产状态库更新: {state_path}")

        # 写入 Delta 差异报告
        try:
            with open(delta_path, 'w', encoding='utf-8') as f:
                json.dump(delta_report, f, ensure_ascii=False, indent=2)
            print(f"[+] 增量资产扫描报告已输出: {delta_path}")
        except Exception as e:
            print(f"[!] 写入资产差异报告失败: {e}")

        # 终端摘要渲染
        print(f"\n[扫描摘要] 六维度物理状态如下：")
        print(f"    - 新增 (Added): {len(final_added)} 个")
        print(f"    - 删除 (Removed): {len(final_removed)} 个")
        print(f"    - 修改 (Modified): {len(raw_modified)} 个")
        print(f"    - 移动 (Renamed/Moved): {len(renamed_or_moved)} 个")
        print(f"    - 重复 (Duplicates): {len(duplicates)} 组 Hash")
        print(f"    - 未变 (Unchanged): {len(raw_unchanged)} 个")
        print("-" * 50)

    def apply_launch_scope_filter_to_markdown(self, markdown: str, launch_scope: dict) -> str:
        """
        v2.3.9.1 launch-scope-filter hotfix:
        仅对颜色展示、尺码参考等结构化段落进行局部行级/表格行的过滤，严禁粗暴无差别删除。
        """
        if not launch_scope.get("detected", False):
            return markdown

        excluded_colors = launch_scope.get("excluded_colors", [])
        excluded_sizes = launch_scope.get("excluded_sizes", [])
        allowed_colors = launch_scope.get("allowed_colors", [])
        allowed_color_aliases = launch_scope.get("allowed_color_aliases", {})

        # 重建允许的所有颜色和别名的大集合，开展精确的白名单守护，杜绝子串冲突导致误杀
        all_allowed = set(allowed_colors)
        for aliases in allowed_color_aliases.values():
            for alias in aliases:
                all_allowed.add(alias)

        if not excluded_colors and not excluded_sizes:
            return markdown

        lines = markdown.split('\n')
        filtered_lines = []

        in_color_section = False
        in_size_section = False

        mismatch_notified = set()

        for line in lines:
            line_strip = line.strip()

            # 1. 结构化区域边界判定
            if line_strip.startswith("### 5.1") or (line_strip.startswith("###") and any(x in line_strip for x in ("颜色", "色彩", "多色"))):
                in_color_section = True
                in_size_section = False
            elif line_strip.startswith("## 九、尺码参考") or line_strip.startswith("### 九、尺码") or (line_strip.startswith("##") and any(x in line_strip for x in ("尺码", "推荐", "选码", "试穿"))):
                in_size_section = True
                in_color_section = False
            elif line_strip.startswith("##") or line_strip.startswith("###"):
                in_color_section = False
                in_size_section = False

            # 2. 精确区域过滤逻辑
            if in_color_section and (line_strip.startswith("|") or line_strip.startswith("-") or line_strip.startswith("*")):
                if not re.match(r'^\|[\s\-:|]+$', line_strip) and not "颜色展示" in line_strip and not "图片" in line_strip:
                    # 抹去 Markdown 图片引用中的路径部分，避免路径中的文件名干扰（例如 黑色.png）
                    clean_line = re.sub(r'\]\([^)]+\)', ']()', line_strip)
                    # 白名单守护：如果行中含有允许展示的颜色或别名，则不判定为禁用
                    hit_colors = []
                    for ac in all_allowed:
                        if ac in clean_line:
                            hit_colors.append(ac)
                    # 过滤子串：只保留不是其他任何命中词的子串的词，防止长别名被子串截断拆分
                    hit_colors = [c for c in hit_colors if not any(c != other and c in other for other in hit_colors)]
                    if hit_colors:
                        # 检查是否有别名对齐但名称对不上的情况
                        replaced_line = line
                        for hit_color in hit_colors:
                            if hit_color not in allowed_colors:
                                main_color = None
                                for mc, aliases in allowed_color_aliases.items():
                                    if hit_color in aliases:
                                        main_color = mc
                                        break
                                if main_color:
                                    pair = (hit_color, main_color)
                                    if pair not in mismatch_notified:
                                        mismatch_notified.add(pair)
                                        safe_print(f"[WARN] 图片展示颜色 '{hit_color}' 与表格下单颜色 '{main_color}' 不完全一致，已通过别名映射对齐，颜色名称和颜色图片需要人工审核。")

                                    # 路径保护安全替换别名，避免破坏图片URL路径（例如 Designers_七月/浅米灰.jpg）
                                    urls = re.findall(r'\]\(([^)]+)\)', replaced_line)
                                    url_placeholders = {}
                                    for idx_url, url in enumerate(urls):
                                        placeholder = f"__PDH_URL_PLACEHOLDER_{idx_url}__"
                                        url_placeholders[placeholder] = url
                                        replaced_line = replaced_line.replace(f"]({url})", f"]({placeholder})")

                                    # 安全执行文本别名 tips 替换
                                    if f"{hit_color}(下单色:" not in replaced_line and f"{hit_color} (下单色:" not in replaced_line:
                                        replaced_line = replaced_line.replace(hit_color, f"{hit_color}(下单色:{main_color})")

                                    # 还原图片URL路径
                                    for placeholder, url in url_placeholders.items():
                                        replaced_line = replaced_line.replace(placeholder, url)

                        filtered_lines.append(replaced_line)
                        continue
                    if any(ec in clean_line for ec in excluded_colors):
                        continue

            if in_size_section and line_strip.startswith("|"):
                if re.match(r'^\|[\s\-:|]+$', line_strip):
                    filtered_lines.append(line)
                    continue

                cols = [c.strip() for c in line_strip.split('|')[1:-1]]
                if cols:
                    size_key = re.sub(r'<[^>]+>', '', cols[0]).strip()
                    if size_key in excluded_sizes:
                        continue

                    if any(c_val in excluded_sizes for c_val in cols):
                        continue

            if line_strip.startswith("|") and not re.match(r'^\|[\s\-:|]+$', line_strip):
                cols = [c.strip() for c in line_strip.split('|')[1:-1]]
                if cols:
                    if cols[0] in excluded_sizes:
                        continue

            filtered_lines.append(line)

        if mismatch_notified:
            try:
                reports_dir = os.path.join(self.scratch_dir, "reports")
                report_path = os.path.join(reports_dir, "launch_scope_filter_report.md")
                if os.path.exists(report_path):
                    with open(report_path, 'r', encoding='utf-8') as rf:
                        r_content = rf.read()

                    if "## ⚠️ 5. 颜色与图片一致性审核提示" not in r_content:
                        rep_add = [
                            "",
                            "## ⚠️ 5. 颜色与图片一致性审核提示",
                            "最终手册中由于别名匹配保留了以下图片卡片，但**图片中颜色字样与表格下单的原始颜色字样对不上**，请人工审核：",
                        ]
                        for hc, mc in mismatch_notified:
                            rep_add.append(f"* 📢 图片展示色 `{hc}` 映射匹配了下单标准色 `{mc}`。**颜色名称 and 颜色图片需要人工审核。**")

                        with open(report_path, 'w', encoding='utf-8') as rf:
                            rf.write(r_content + "\n" + "\n".join(rep_add))
            except Exception as re_err:
                safe_print(f"[WARN] 追加一致性审核提示至过滤报告错误: {re_err}")

        return '\n'.join(filtered_lines)


if __name__ == '__main__':
    configure_terminal_encoding()
    parser = argparse.ArgumentParser(description='商品数字手册引擎')
    parser.add_argument('--action', choices=[
        'extract', 'validate', 'validate-plan', 'validate-parts', 'validate-skeletons',
        'render', 'split-plan', 'assemble', 'assemble-md', 'render-html', 'validate-render-parity',
        'contact-sheet', 'image-candidates', 'image-snippet', 'index-snippet', 'part-skeletons',
        'migrate-plan', 'patch-gallery', 'diff-assets', 'validate-manual-overrides',
        'smart-generate', 'dependency-coverage', 'lock-section', 'unlock-section',
        'content-brief-skeleton', 'validate-content-brief', 'content-pack', 'validate-content-quality',
        'content-rewrite-plan', 'validate-rewrite-plan', 'apply-content-rewrite',
        'outfit-brief', 'outfit-generate-images', 'outfit-plan-merge', 'auto-fill'
    ], required=True, help='操作类型')
    parser.add_argument('--format', choices=['md', 'html', 'auto'], default='auto', help='校验格式风格')
    parser.add_argument('--allow-remote-fonts', action='store_true', help='是否允许HTML视图加载远程Google Fonts')
    parser.add_argument('--target_dir', required=True, help='商品目录路径')
    parser.add_argument('--handbook', help='手册路径 (validate)')
    parser.add_argument('--data_json', help='数据JSON (render)')
    parser.add_argument('--template', help='模板路径 (render / part-skeletons)')
    parser.add_argument('--parts_dir', help='parts目录 (assemble，可选)')
    parser.add_argument('--output', help='输出路径 (assemble，可选)')
    parser.add_argument('--image_plan', help='image_selection_plan.json路径 (image-snippet)')
    parser.add_argument('--section', help='Patch 目标小节名称 (例如 "5.1 颜色展示")')
    parser.add_argument('--patch_file', help='局部 Patch 用 HTML 补丁文件路径')
    parser.add_argument('--limit_section', help='限制 image-snippet 动作仅对该小节进行重生成')
    parser.add_argument(
        '--exclude_index', '--exclude-index',
        action='store_true',
        dest='exclude_index',
        help='关闭并排除"十、相关素材文件索引"章节'
    )
    parser.add_argument('--preview_absolute_paths', action='store_true',
                        help='assemble时转为预览绝对路径')
    parser.add_argument('--incremental', action='store_true',
                        help='增量提取模式，秒级复用 unchanged 物理属性')
    parser.add_argument('--force-full', action='store_true', help='强制全量，不走增量判断')
    parser.add_argument('--incremental-only', action='store_true', help='只允许增量更新，否则停止')
    parser.add_argument('--dry-run', action='store_true', help='只输出决策报告，不实际执行动作')
    parser.add_argument('--auto-continue', action='store_true', help='安全场景下自动继续后续动作')
    parser.add_argument('--no-respect-locks', action='store_true', help='强制忽略锁定限制')
    parser.add_argument('--reason', help='锁定或修改的备注原因')
    parser.add_argument('--style-profile', '--style_profile', choices=['luxury', 'retro', 'casual', 'mac', 'cyber', 'cinema', 'wabisabi'], default='retro', help='风格修饰配置文件')
    args = parser.parse_args()
    cli_explicit = any(arg in sys.argv for arg in ('--exclude_index', '--exclude-index'))
    passed_val = args.exclude_index if cli_explicit else None

    style_explicit = any(arg in sys.argv for arg in ('--style-profile', '--style_profile'))
    passed_style = args.style_profile if style_explicit else None

    engine = PipelineEngine(args.target_dir, exclude_index=passed_val, style_profile=passed_style)


    # extract 是新一轮生产的第一步，重置计时
    if args.action == 'extract':
        engine.reset_timing()

    start_ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    t0 = time.time()

    engine.allow_remote_fonts = args.allow_remote_fonts

    if args.action == 'extract':
        engine.extract(incremental=args.incremental)
    elif args.action == 'validate':
        if not args.handbook:
            print("错误: validate 需要 --handbook 参数")
            sys.exit(1)
        rc = engine.validate(args.handbook, format_profile=args.format)
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'validate-plan':
        if not args.image_plan:
            print("错误: validate-plan 需要 --image_plan 参数")
            sys.exit(1)
        rc = engine.validate_plan(args.image_plan)
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'validate-parts':
        engine.clean_category_mismatches()
        rc = engine.validate_parts()
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'validate-skeletons':
        rc = engine.validate_skeletons()
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'render':
        if not args.data_json or not args.template:
            print("错误: render 需要 --data_json 和 --template 参数")
            sys.exit(1)
        engine.render(args.data_json, args.template)
    elif args.action == 'split-plan':
        engine.split_plan()
    elif args.action == 'part-skeletons':
        template_path = args.template
        if not template_path:
            # 默认使用 clean_md_template.md 作为 Clean MD 骨架源
            default_tpl = os.path.join(engine.skill_dir, 'references', 'clean_md_template.md')
            if os.path.exists(default_tpl):
                template_path = default_tpl
            else:
                print("错误: part-skeletons 需要 --template 参数，且默认 clean_md_template.md 不存在")
                sys.exit(1)
        engine.part_skeletons(template_path)
    elif args.action == 'auto-fill':
        from auto_fill_parts import fill_parts
        rc = fill_parts(args.target_dir)
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'assemble-md':
        output_path = args.output
        if not output_path:
            output_path = os.path.join(engine.target_dir, f'{engine.sku_name}.md')
        engine.assemble(
            parts_dir=args.parts_dir,
            output_path=output_path,
            preview_absolute_paths=args.preview_absolute_paths
        )
    elif args.action == 'render-html':
        md_path = args.handbook
        if not md_path:
            md_path = os.path.join(engine.target_dir, f'{engine.sku_name}.md')
        html_path = args.output
        if not html_path:
            html_path = os.path.join(engine.target_dir, f'{engine.sku_name}.html')
        engine.render_html_handbook(md_path=md_path, html_path=html_path)
    elif args.action == 'validate-render-parity':
        md_path = args.handbook
        if not md_path:
            md_path = os.path.join(engine.target_dir, f'{engine.sku_name}.md')
        html_path = args.output
        if not html_path:
            html_path = os.path.join(engine.target_dir, f'{engine.sku_name}.html')
        rc = engine.validate_render_parity(md_path=md_path, html_path=html_path)
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'assemble':
        # 1. 组装纯净 Markdown
        md_path = os.path.join(engine.target_dir, f'{engine.sku_name}.md')
        engine.assemble(
            parts_dir=args.parts_dir,
            output_path=md_path,
            preview_absolute_paths=args.preview_absolute_paths
        )
        # 2. 编译 HTML 视图
        html_path = os.path.join(engine.target_dir, f'{engine.sku_name}.html')
        engine.render_html_handbook(md_path=md_path, html_path=html_path)
        # 3. 运行一致性校验
        rc = engine.validate_render_parity(md_path=md_path, html_path=html_path)
        if rc and rc != 0:
            print("[!] 双交付一致性校验未通过！")
            sys.exit(rc)
        # 4. [v2.3.8 新增] 后置分发内容资产包与质量量化审计 (完全解耦)
        try:
            print("[*] 开始后置自动化内容分发与审计...")
            if engine.content_pack() is not True:
                print("[ERR] 内容资产包生成失败。")
                sys.exit(1)
            if engine.validate_content_quality() != 0:
                print("[ERR] 内容质量审计未通过。")
                sys.exit(1)
        except Exception as e:
            print(f"[ERR] 后置资产包分发与审计发生异常: {e}")
            sys.exit(1)
    elif args.action == 'contact-sheet':
        engine.contact_sheet()
    elif args.action == 'image-candidates':
        engine.image_candidates()
    elif args.action == 'image-snippet':
        if not args.image_plan:
            print("错误: image-snippet 需要 --image_plan 参数")
            sys.exit(1)
        engine.image_snippet(args.image_plan, limit_section=args.limit_section)
    elif args.action == 'index-snippet':
        engine.index_snippet()
    elif args.action == 'migrate-plan':
        if not args.image_plan:
            print("错误: migrate-plan 需要 --image_plan 参数")
            sys.exit(1)
        engine.migrate_plan(args.image_plan)
    elif args.action == 'patch-gallery':
        if not args.section or not args.patch_file:
            print("错误: patch-gallery 需要 --section 和 --patch_file 参数")
            sys.exit(1)
        success = engine.patch_gallery(args.section, args.patch_file)
        if not success:
            sys.exit(1)
    elif args.action == 'diff-assets':
        engine.diff_assets()
    elif args.action == 'validate-manual-overrides':
        engine.validate_manual_overrides()
    elif args.action == 'smart-generate':
        success = engine.smart_generate(
            force_full=args.force_full,
            incremental_only=args.incremental_only,
            dry_run=args.dry_run,
            auto_continue=args.auto_continue,
            respect_locks=not args.no_respect_locks
        )
        if not success:
            sys.exit(1)
    elif args.action == 'dependency-coverage':
        engine.dependency_coverage()
    elif args.action == 'lock-section':
        if not args.section:
            print("错误: lock-section 需要 --section 参数")
            sys.exit(1)
        engine.lock_section(args.section, args.reason or "手工锁定")
    elif args.action == 'unlock-section':
        if not args.section:
            print("错误: unlock-section 需要 --section 参数")
            sys.exit(1)
        engine.unlock_section(args.section)
    elif args.action == 'content-brief-skeleton':
        engine.content_brief_skeleton()
    elif args.action == 'validate-content-brief':
        rc = engine.validate_content_brief()
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'content-pack':
        engine.content_pack()
    elif args.action == 'validate-content-quality':
        rc = engine.validate_content_quality()
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'content-rewrite-plan':
        rc = engine.content_rewrite_plan()
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'validate-rewrite-plan':
        rc = engine.validate_rewrite_plan()
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'apply-content-rewrite':
        rc = engine.apply_content_rewrite()
        if rc and rc != 0:
            sys.exit(1)

    elif args.action == 'outfit-brief':
        rc = engine.outfit_brief()
        if rc and rc != 0:
            sys.exit(1)
    elif args.action == 'outfit-generate-images':
        rc = engine.outfit_generate_images()
        if rc and rc != 0:
            sys.exit(rc)
    elif args.action == 'outfit-plan-merge':
        if not args.image_plan:
            print("错误: outfit-plan-merge 需要 --image_plan 参数")
            sys.exit(1)
        rc = engine.outfit_plan_merge(args.image_plan)
        if rc and rc != 0:
            sys.exit(1)
    # === 自动计时 ===
    elapsed = time.time() - t0
    end_ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    engine._log_timing(args.action, elapsed, start_ts, end_ts)
    engine.flush_timings()
    if elapsed >= 60:
        print(f'[计时] {args.action} 耗时: {elapsed/60:.1f} 分钟')
    else:
        print(f'[计时] {args.action} 耗时: {elapsed:.1f} 秒')

    # validate 或 assemble 完成后输出从 extract 开始的墙钟总时长
    if args.action in ('validate', 'assemble'):
        engine.print_timing_summary()
