from __future__ import annotations
from ._common import get_project
from typing import Dict

def device_scan(project_path: str) -> dict:
    """Scan and list all devices in a project"""
    try:
        project = get_project(project_path)
        
        devices = []
        for device in project.Devices:
            devices.append({
                "name": device.Name,
                "type": str(device.DeviceType) if hasattr(device, 'DeviceType') else "Unknown",
                "items_count": len(device.DeviceItems) if hasattr(device, 'DeviceItems') else 0
            })
        
        return {"success": True, "devices": devices, "count": len(devices)}
    except Exception as e:
        return {"success": False, "error": str(e)}

def device_get_structure(project_path: str) -> dict:
    """Generate device tree structure"""
    try:
        project = get_project(project_path)
        
        def get_device_tree(device) -> dict:
            """Build device tree recursively (device is a TIA Portal device object)"""
            item = {
                "name": device.Name,
                "type": str(device.DeviceType) if hasattr(device, 'DeviceType') else "Unknown",
                "modules": []
            }
            
            if hasattr(device, 'DeviceItems'):
                for sub_item in device.DeviceItems:
                    item["modules"].append({
                        "name": sub_item.Name,
                        "type": str(sub_item.DeviceType) if hasattr(sub_item, 'DeviceType') else "Unknown"
                    })
            
            return item
        
        device_tree = []
        for device in project.Devices:
            device_tree.append(get_device_tree(device))
        
        return {"success": True, "device_tree": device_tree}
    except Exception as e:
        return {"success": False, "error": str(e)}

def device_get_properties(project_path: str, device_name: str = None) -> dict:
    """Get device properties (model, firmware, order number)"""
    try:
        project = get_project(project_path)
        
        devices_info = []
        for device in project.Devices:
            if device_name is None or device.Name == device_name:
                props = {
                    "name": device.Name,
                    "type": str(device.DeviceType) if hasattr(device, 'DeviceType') else "Unknown",
                }
                
                # Try to get extended properties
                if hasattr(device, 'Properties'):
                    for prop in device.Properties:
                        if prop.Name in ["ArticleNumber", "FirmwareVersion", "HardwareIdentifier"]:
                            props[prop.Name] = str(prop.Value) if prop.Value else ""
                
                devices_info.append(props)
                
                if device_name:
                    break
        
        return {"success": True, "devices": devices_info}
    except Exception as e:
        return {"success": False, "error": str(e)}
