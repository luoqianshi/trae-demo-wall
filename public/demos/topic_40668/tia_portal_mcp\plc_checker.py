from __future__ import annotations
import sys, time, traceback
from ._common import get_plc_software, get_project
from typing import Optional, List, Dict

def _block_type_label(t):
    """Convert type name to human-readable label"""
    n = type(t).__name__
    if n == 'GlobalDB': return 'DB'
    if n == 'FC': return 'FC'
    if n == 'FB': return 'FB'
    if n == 'OB': return 'OB'
    return n


def plc_check(project_path: str, plc_name: str = None) -> dict:
    """Check PLC program: list blocks, external sources, and their IsConsistent status"""
    start_time = time.time()
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        blocks_info = []
        inconsistent_blocks = []
        
        for block in plc_software.BlockGroup.Blocks:
            info = {
                "name": block.Name,
                "type": type(block).__name__,
                "label": f"{_block_type_label(block)}{block.Number}",
                "number": block.Number,
                "is_consistent": block.IsConsistent,
                "programming_language": str(block.ProgrammingLanguage),
                "compile_date": str(block.CompileDate),
                "code_modified_date": str(block.CodeModifiedDate)
            }
            blocks_info.append(info)
            if not block.IsConsistent:
                inconsistent_blocks.append(block.Name)
        
        # 外部源信息
        external_sources = []
        for src in plc_software.ExternalSourceGroup.ExternalSources:
            external_sources.append(src.Name)
        
        elapsed = int((time.time() - start_time) * 1000)
        
        return {
            "success": True,
            "block_count": len(blocks_info),
            "consistent_count": sum(1 for b in blocks_info if b["is_consistent"]),
            "inconsistent_count": len(inconsistent_blocks),
            "blocks": blocks_info,
            "inconsistent_blocks": inconsistent_blocks,
            "has_inconsistencies": len(inconsistent_blocks) > 0,
            "external_sources": external_sources,
            "external_sources_count": len(external_sources),
            "check_duration_ms": elapsed,
            "note": "V16 Openness API 不支持远程编译，请在 TIA Portal UI 中按 Ctrl+F7 编译"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "trace": traceback.format_exc()}
