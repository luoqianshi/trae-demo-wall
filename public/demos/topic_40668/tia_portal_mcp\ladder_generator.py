from __future__ import annotations
from ._common import get_plc_software, get_project, _get_eng as _common_get_eng
from typing import List, Dict

def _get_eng():
    """Use _common's lazy _get_eng (single source of truth)"""
    return _common_get_eng()

def ladder_generate(project_path: str, block_name: str, networks: List[Dict], plc_name: str = None) -> dict:
    """V16 Openness API cannot programmatically populate ladder diagram networks.
    Creates an empty FB block with LAD language. Networks must be drawn manually in GUI.
    
    For programmatic block creation with logic, use blocks_update_external_source with SCL files instead.
    """
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        # Create empty FB block with Ladder Diagram language
        e = _get_eng()
        try:
            new_block = plc_software.Blocks.Create(
                e.PlcBlockType.FunctionBlock,
                block_name,
                e.ProgrammingLanguage.LadderDiagram
            )
        except Exception:
            # Fallback: create as FBD
            new_block = plc_software.Blocks.Create(
                e.PlcBlockType.FunctionBlock,
                block_name,
                e.ProgrammingLanguage.Fbd
            )
        
        project.Save()
        
        return {
            "success": True,
            "block_name": block_name,
            "block_type": type(new_block).__name__,
            "network_count": 0,
            "warning": "V16 API cannot populate ladder networks programmatically. Block is empty. Use SCL (blocks_update_external_source) for programmatic logic.",
            "suggestion": "Use blocks_update_external_source with .scl file to create blocks with actual logic"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def ladder_validate(ladder_logic: Dict) -> dict:
    """Validate ladder logic structure"""
    errors = []
    warnings = []
    
    if "networks" not in ladder_logic:
        errors.append("Missing 'networks' key in ladder logic definition")
        return {"valid": False, "errors": errors, "warnings": warnings}
    
    networks = ladder_logic["networks"]
    if not isinstance(networks, list):
        errors.append("'networks' must be a list")
        return {"valid": False, "errors": errors, "warnings": warnings}
    
    for i, network in enumerate(networks):
        if "rungs" not in network:
            errors.append(f"Network {i+1} missing 'rungs' key")
        else:
            for j, rung in enumerate(network["rungs"]):
                if "elements" not in rung:
                    errors.append(f"Network {i+1}, Rung {j+1} missing 'elements' key")
                else:
                    has_coil = any(e.get("type") == "coil" for e in rung["elements"])
                    if not has_coil:
                        warnings.append(f"Network {i+1}, Rung {j+1} has no coil (output)")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings
    }