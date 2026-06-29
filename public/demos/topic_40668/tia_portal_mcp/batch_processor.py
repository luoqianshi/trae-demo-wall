from __future__ import annotations
from ._common import get_plc_software, get_project
from typing import List, Dict

def _find_block(blocks, name):
    """Find block by name using for-in enumeration (V16 compatible)"""
    for b in blocks:
        if b.Name == name:
            return b
    return None

def blocks_batch_compile(project_path: str, block_names: List[str], plc_name: str = None) -> dict:
    """V16 Openness API does NOT support remote compilation.
    This tool exists only for API compatibility; it always returns failure with guidance."""
    return {
        "success": False,
        "error": "V16 Openness API 不支持远程编译",
        "suggestion": "请在 TIA Portal GUI 中按 Ctrl+F7 编译，然后用 plc_check 检查结果",
        "blocks_requested": block_names
    }

def blocks_batch_copy(project_path: str, block_mappings: List[Dict], plc_name: str = None) -> dict:
    """Batch copy blocks with new names"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        results = []
        for mapping in block_mappings:
            source_name = mapping.get("source")
            target_name = mapping.get("target")
            
            source_block = _find_block(plc_software.BlockGroup.Blocks, source_name)
            if source_block is None:
                results.append({
                    "source": source_name,
                    "target": target_name,
                    "success": False,
                    "error": "Source block not found"
                })
                continue
            
            try:
                new_block = plc_software.BlockGroup.Blocks.AddCopy(source_block, target_name)
                results.append({
                    "source": source_name,
                    "target": target_name,
                    "success": True
                })
            except Exception as e:
                results.append({
                    "source": source_name,
                    "target": target_name,
                    "success": False,
                    "error": str(e)
                })
        
        project.Save()
        
        success_count = sum(1 for r in results if r["success"])
        return {
            "success": success_count == len(block_mappings),
            "total": len(block_mappings),
            "succeeded": success_count,
            "failed": len(block_mappings) - success_count,
            "results": results
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def blocks_batch_delete(project_path: str, block_names: List[str], plc_name: str = None) -> dict:
    """Batch delete blocks"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        results = []
        for block_name in block_names:
            block = _find_block(plc_software.BlockGroup.Blocks, block_name)
            if block is None:
                results.append({
                    "block_name": block_name,
                    "success": False,
                    "error": "Block not found"
                })
                continue
            
            try:
                block.Delete()
                results.append({
                    "block_name": block_name,
                    "success": True
                })
            except Exception as e:
                results.append({
                    "block_name": block_name,
                    "success": False,
                    "error": str(e)
                })
        
        project.Save()
        
        success_count = sum(1 for r in results if r["success"])
        return {
            "success": success_count == len(block_names),
            "total": len(block_names),
            "succeeded": success_count,
            "failed": len(block_names) - success_count,
            "results": results
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def block_delete(project_path: str, block_name: str, plc_name: str = None) -> dict:
    """Delete a single block AND its external source (more thorough than batch delete)"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        deleted_block = False
        deleted_source = False
        
        # 1. Delete block
        for b in list(plc_software.BlockGroup.Blocks):
            if b.Name == block_name:
                b.Delete()
                deleted_block = True
                break
        
        # 2. Delete external source
        for src in list(plc_software.ExternalSourceGroup.ExternalSources):
            if src.Name == block_name:
                src.Delete()
                deleted_source = True
                break
        
        project.Save()
        
        return {
            "success": True,
            "block_name": block_name,
            "block_deleted": deleted_block,
            "external_source_deleted": deleted_source
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
