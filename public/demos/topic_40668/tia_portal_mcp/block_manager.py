from __future__ import annotations
import os, traceback
from ._common import get_plc_software, get_project, _get_eng as _common_get_eng
from typing import Optional, List

def _get_eng():
    """Use _common's lazy _get_eng (single source of truth)"""
    return _common_get_eng()

def _find_block(blocks, name):
    """Find block by name using for-in enumeration (V16 compatible)"""
    for b in blocks:
        if b.Name == name:
            return b
    return None

def block_export(project_path: str, block_name: str, output_dir: str, plc_name: str = None) -> dict:
    """Export a single block to XML file"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        eng = _get_eng()
        from System.IO import FileInfo as FInfo
        
        # V16: use for-in enumeration, Export(FileInfo, ExportOptions)
        for b in plc_software.BlockGroup.Blocks:
            if b.Name == block_name:
                output_path = f"{output_dir}\\{block_name}.xml"
                # 重试机制：最多3次
                last_error = None
                for attempt in range(3):
                    try:
                        b.Export(FInfo(output_path), eng.ExportOptions.WithDefaults)
                        return {"success": True, "output_path": output_path}
                    except Exception as e:
                        last_error = str(e)
                        import time
                        time.sleep(2)
                return {"success": False, "error": f"Export failed after 3 retries: {last_error}"}
        
        return {"success": False, "error": f"Block {block_name} not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def blocks_export_all(project_path: str, output_dir: str, plc_name: str = None) -> dict:
    """Export all blocks from a project with detailed error reporting"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        eng = _get_eng()
        from System.IO import FileInfo as FInfo
        os.makedirs(output_dir, exist_ok=True)
        
        exported_blocks = []
        failed_blocks = []
        
        for b in plc_software.BlockGroup.Blocks:
            try:
                output_path = os.path.join(output_dir, f"{b.Name}.xml")
                b.Export(FInfo(output_path), eng.ExportOptions.WithDefaults)
                exported_blocks.append(b.Name)
            except Exception as e:
                failed_blocks.append({"block": b.Name, "error": str(e)[:200]})
        
        return {
            "success": len(failed_blocks) == 0,
            "exported_count": len(exported_blocks),
            "failed_count": len(failed_blocks),
            "blocks": exported_blocks,
            "failed_blocks": failed_blocks
        }
    except Exception as e:
        return {"success": False, "error": str(e), "trace": traceback.format_exc()}

def block_import(project_path: str, block_xml_path: str, plc_name: str = None) -> dict:
    """Import a block from XML file"""
    try:
        # 参数校验
        if not os.path.exists(block_xml_path):
            return {"success": False, "error": f"XML file not found: {block_xml_path}"}
        if not block_xml_path.lower().endswith('.xml'):
            return {"success": False, "error": f"File must be .xml: {block_xml_path}"}
        
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        # ImportOptions.None = 0 (V16: import without overwriting existing)
        plc_software.BlockGroup.Blocks.Import(block_xml_path, 0)
        
        project.Save()
        return {"success": True, "message": f"Block imported from {block_xml_path}", "import_options": "None(0)"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def blocks_update_external_source(project_path: str, block_name: str, scl_file_path: str, plc_name: str = None) -> dict:
    """Delete old block/external source, create new from SCL file, generate blocks (V16)"""
    stage = "initial"
    try:
        # 检查 SCL 文件存在
        if not os.path.exists(scl_file_path):
            return {"success": False, "error": f"SCL file not found: {scl_file_path}", "stage": "check_file"}
        
        project = get_project(project_path)
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found", "stage": "get_plc"}
        
        # 1. 删除已有块
        stage = "delete_block"
        for b in list(plc_software.BlockGroup.Blocks):
            if b.Name == block_name:
                b.Delete()
                break
        
        # 2. 删除已有外部源
        stage = "delete_external_source"
        for src in list(plc_software.ExternalSourceGroup.ExternalSources):
            if src.Name == block_name:
                src.Delete()
                break
        
        # 3. 从 SCL 文件创建新外部源
        stage = "create_external_source"
        new_src = plc_software.ExternalSourceGroup.ExternalSources.CreateFromFile(
            block_name, scl_file_path
        )
        
        # 4. 生成块（V16 无参数版本）
        stage = "generate_blocks"
        new_src.GenerateBlocksFromSource()
        
        # 5. 保存
        stage = "save"
        project.Save()
        
        # 6. 验证
        stage = "verify"
        for b in plc_software.BlockGroup.Blocks:
            if b.Name == block_name:
                return {
                    "success": True,
                    "block_name": block_name,
                    "block_number": b.Number,
                    "block_type": type(b).__name__,
                    "is_consistent": b.IsConsistent,
                    "stage": "done"
                }
        
        return {"success": True, "block_name": block_name, "stage": "post_verify", "note": "Block created but not found in re-check"}
    
    except Exception as e:
        return {"success": False, "error": str(e), "stage": stage}

def blocks_recompile_all(project_path: str, scl_dir: str, plc_name: str = None,
                         build_order: list = None) -> dict:
    """One-click rebuild of ALL SCL source files in a directory.
    
    Args:
        scl_dir: Directory containing .scl and .db files
        build_order: Optional list of (block_name, filename) tuples to control build order.
                     If None, auto-discovers all .scl/.db files and builds DBs first, then FCs, then OBs.
    """
    # Auto-discover SCL files if no build_order provided
    if build_order is None:
        discovered = []
        for fname in sorted(os.listdir(scl_dir)):
            fpath = os.path.join(scl_dir, fname)
            if os.path.isfile(fpath) and fname.lower().endswith(('.scl', '.db')):
                # Derive block name from filename (strip extension and FCx_/OB1_ prefix)
                block_name = os.path.splitext(fname)[0]
                # Remove common prefixes like FC1_, FC2_, OB1_
                import re
                block_name = re.sub(r'^(FC\d+_|OB\d+_)', '', block_name)
                discovered.append((block_name, fpath))
        
        # Sort: .db files first, then .scl files, OB last
        def _sort_key(item):
            fname = os.path.basename(item[1]).lower()
            if fname.endswith('.db'): return (0, fname)
            if 'ob' in fname: return (2, fname)
            return (1, fname)
        
        discovered.sort(key=_sort_key)
        scl_files = discovered
    else:
        # Use provided build order
        scl_files = [(name, os.path.join(scl_dir, fname)) for name, fname in build_order]
    
    if not scl_files:
        return {"success": False, "error": f"No .scl or .db files found in {scl_dir}"}
    
    results = []
    all_success = True
    
    for idx, (name, path) in enumerate(scl_files):
        if not os.path.exists(path):
            results.append({
                "block_name": name, "success": False, "stage": "file_not_found",
                "error": f"SCL file not found: {path}"
            })
            all_success = False
            continue
        
        r = blocks_update_external_source(project_path, name, path, plc_name)
        results.append({
            "block_name": name,
            "scl_file": path,
            "success": r.get("success", False),
            "is_consistent": r.get("is_consistent", False),
            "block_number": r.get("block_number"),
            "stage": r.get("stage", "unknown"),
            "error": r.get("error", None)
        })
        if not r.get("success"):
            all_success = False
        
        # 每 3 块强制保存一次，避免事务过大
        if (idx + 1) % 3 == 0:
            try:
                from ._common import get_project
                proj = get_project(project_path)
                proj.Save()
            except Exception:
                pass
    
    # 最终一致性检查
    try:
        project = get_project(project_path)
        plc_software = get_plc_software(project, plc_name)
        final_blocks = []
        if plc_software:
            for b in plc_software.BlockGroup.Blocks:
                final_blocks.append({
                    "name": b.Name,
                    "number": b.Number,
                    "type": type(b).__name__,
                    "is_consistent": b.IsConsistent
                })
    except Exception:
        final_blocks = []
    
    consistent_count = sum(1 for b in final_blocks if b["is_consistent"])
    expected_count = len(scl_files)
    
    return {
        "success": all_success and len(final_blocks) == expected_count and consistent_count == expected_count,
        "total": expected_count,
        "block_count_after": len(final_blocks),
        "consistent_count": consistent_count,
        "inconsistent_count": len(final_blocks) - consistent_count,
        "results": results,
        "final_blocks": final_blocks,
        "discovered_files": [os.path.basename(p) for _, p in scl_files]
    }
