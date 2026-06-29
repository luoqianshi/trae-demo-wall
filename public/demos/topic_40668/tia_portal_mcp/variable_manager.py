from __future__ import annotations
from ._common import get_plc_software, get_project
import json

def variable_table_get(project_path: str, plc_name: str = None) -> dict:
    """Get all PLC variables"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        # V16: 通过 TagTableGroup 获取变量
        tag_group = plc_software.TagTableGroup
        variables = []
        for tag_table in tag_group.TagTables:
            try:
                for tag in tag_table.Tags:
                    variables.append({
                        "name": tag.Name,
                        "data_type": tag.DataTypeName if hasattr(tag, 'DataTypeName') else "Bool",
                        "address": tag.LogicalAddress if hasattr(tag, 'LogicalAddress') else ""
                    })
            except Exception:
                pass
        
        return {"success": True, "variables": variables, "count": len(variables)}
    except Exception as e:
        return {"success": False, "error": str(e)}

def variable_add(project_path: str, var_name: str, data_type: str, address: str, plc_name: str = None) -> dict:
    """Add a new PLC variable"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        # V16: 通过 TagTableGroup 添加变量
        tag_group = plc_software.TagTableGroup
        tag_table = None
        for tt in tag_group.TagTables:
            tag_table = tt
            break
        if tag_table is None:
            tag_table = tag_group.TagTables.Create("PLC 变量")
        
        new_tag = tag_table.Tags.Create(var_name, data_type, address)
        
        project.Save()
        return {"success": True, "message": f"Variable {var_name} added"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def variable_modify(project_path: str, var_name: str, data_type: str = None, address: str = None, plc_name: str = None) -> dict:
    """Modify an existing PLC variable's address or data type.
    V16 Openness: direct property modification is limited, so we delete and recreate."""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        # V16: 通过 TagTableGroup 查找变量 (for-in enumeration, NOT Tags.Find)
        tag_group = plc_software.TagTableGroup
        target_tag = None
        target_table = None
        for tt in tag_group.TagTables:
            for tag in tt.Tags:
                if tag.Name == var_name:
                    target_tag = tag
                    target_table = tt
                    break
            if target_tag:
                break
        
        if target_tag is None:
            return {"success": False, "error": f"Variable {var_name} not found"}
        
        # Read current values before deletion
        old_data_type = target_tag.DataTypeName if hasattr(target_tag, 'DataTypeName') else "Bool"
        old_address = target_tag.LogicalAddress if hasattr(target_tag, 'LogicalAddress') else ""
        
        # Determine new values (use provided or keep old)
        new_data_type = data_type if data_type is not None else old_data_type
        new_address = address if address is not None else old_address
        
        # Delete old tag
        target_tag.Delete()
        
        # Recreate with new values
        target_table.Tags.Create(var_name, new_data_type, new_address)
        
        project.Save()
        
        return {
            "success": True,
            "variable": var_name,
            "old_data_type": old_data_type,
            "new_data_type": new_data_type,
            "old_address": old_address,
            "new_address": new_address,
            "note": "Variable deleted and recreated (V16 Openness limitation)"
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def variable_delete(project_path: str, var_name: str, plc_name: str = None) -> dict:
    """Delete a PLC variable"""
    try:
        project = get_project(project_path)
        
        plc_software = get_plc_software(project, plc_name)
        if plc_software is None:
            return {"success": False, "error": "PLC not found"}
        
        # V16: 通过 TagTableGroup 查找并删除变量 (for-in enumeration, NOT Tags.Find)
        tag_group = plc_software.TagTableGroup
        target_tag = None
        for tt in tag_group.TagTables:
            for tag in tt.Tags:
                if tag.Name == var_name:
                    target_tag = tag
                    break
            if target_tag:
                break
        
        if target_tag is not None:
            target_tag.Delete()
            project.Save()
            return {"success": True, "message": f"Variable {var_name} deleted"}
        else:
            return {"success": False, "error": f"Variable {var_name} not found"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def variables_export(project_path: str, output_path: str, format: str = "json", plc_name: str = None) -> dict:
    """Export variables table to CSV or JSON"""
    try:
        result = variable_table_get(project_path, plc_name)
        if not result["success"]:
            return result
        
        variables = result["variables"]
        
        if format == "json":
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(variables, f, indent=2, ensure_ascii=False)
        elif format == "csv":
            import csv
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                if variables:
                    writer = csv.DictWriter(f, fieldnames=variables[0].keys())
                    writer.writeheader()
                    writer.writerows(variables)
        
        return {"success": True, "output_path": output_path, "count": len(variables)}
    except Exception as e:
        return {"success": False, "error": str(e)}