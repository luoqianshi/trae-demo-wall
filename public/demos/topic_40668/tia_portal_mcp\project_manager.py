from __future__ import annotations
import os
from . import _common

def _get_dir_info():
    """Lazy CLR import for DirectoryInfo (avoids module-level side effects)"""
    from System.IO import DirectoryInfo
    return DirectoryInfo

def project_create(project_path: str, project_name: str) -> dict:
    """Create a new TIA Portal project. Updates _common's singleton so subsequent tools work."""
    try:
        tia = _common.get_tia()
        if not os.path.exists(project_path):
            os.makedirs(project_path)
        DirectoryInfo = _get_dir_info()
        di = DirectoryInfo(project_path)
        _common._current_project = tia.Projects.Create(di, project_name)
        _common._current_project_path = os.path.join(project_path, project_name + ".ap16")
        _common._log(f"Created project: {_common._current_project_path}")
        return {"success": True, "project_name": project_name, "project_path": project_path}
    except Exception as e:
        return {"success": False, "error": str(e)}

def project_open(project_path: str) -> dict:
    """Open existing project. Delegates to _common.get_project() for singleton consistency."""
    try:
        project = _common.get_project(project_path)
        return {"success": True, "project_path": project_path, "project_name": project.Name, "mode": "WithoutUserInterface"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def project_open_gui(project_path: str, mode: str = "WithUserInterface") -> dict:
    """Open project with GUI attach mode. Use this when TIA Portal GUI is already running."""
    try:
        project = _common.get_project(project_path, mode=mode)
        return {
            "success": True,
            "project_path": project_path,
            "project_name": project.Name,
            "mode": mode,
            "note": "Attached to running TIA Portal GUI" if mode == "WithUserInterface" else "Headless mode"
        }
    except Exception as e:
        return {"success": False, "error": str(e), "mode": mode}

def project_save() -> dict:
    try:
        if _common._current_project is None:
            return {"success": False, "error": "No project is open"}
        _common._current_project.Save()
        return {"success": True, "message": "Project saved"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def project_get_info() -> dict:
    try:
        if _common._current_project is None:
            return {"success": False, "error": "No project is open"}
        devices = []
        for device in _common._current_project.Devices:
            device_info = {"name": device.Name}
            try:
                device_info["type_identifier"] = device.TypeIdentifier
            except Exception:
                pass
            devices.append(device_info)
        return {
            "success": True,
            "project_name": _common._current_project.Name,
            "devices": devices,
            "device_count": len(devices)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def project_close() -> dict:
    _common.close_project()
    return {"success": True, "message": "Project closed"}
