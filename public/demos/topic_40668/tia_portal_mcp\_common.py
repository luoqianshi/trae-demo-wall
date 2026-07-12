"""V16 通用辅助函数 - 单例 TiaPortal + 僵尸进程清理（双保险）"""
import subprocess, time, sys

from ._tia_init import init_tia, get_eng

# Lazy CLR type references (imported on first use, not at module load)
_HwFeatures = None
_SW = None

def _get_hwfeatures():
    global _HwFeatures
    if _HwFeatures is None:
        import Siemens.Engineering.HW.Features as f
        _HwFeatures = f
    return _HwFeatures

def _get_sw():
    global _SW
    if _SW is None:
        import Siemens.Engineering.SW as s
        _SW = s
    return _SW

# Lazy-initialized eng reference (removed module-level side effects)
import threading
_eng_ref = None
_eng_lock = threading.Lock()

def _get_eng():
    global _eng_ref
    if _eng_ref is None:
        with _eng_lock:
            if _eng_ref is None:  # double-checked locking
                init_tia()
                _eng_ref = get_eng()
    return _eng_ref

# 全局 TiaPortal 单例 + 当前项目单例
_tia_instance = None
_current_project = None
_current_project_path = None

def _log(msg):
    """Print diagnostic log to stderr (visible in MCP server stderr)"""
    print(f"[TIA] {msg}", file=sys.stderr, flush=True)

def _kill_portal_processes():
    """Kill Siemens Portal processes:
    1) taskkill (fast)  2) WMIC (stronger fallback)"""
    killed_any = False
    for attempt in range(3):
        for exe in ['Portal.exe', 'FileStorage.Server.exe']:
            try:
                r = subprocess.run(
                    ['taskkill', '/f', '/im', exe],
                    capture_output=True, timeout=15, text=True
                )
                if r.returncode == 0:
                    killed_any = True
                elif "not found" not in r.stdout.lower() and "no tasks" not in r.stdout.lower():
                    pass  # No process to kill - normal
            except subprocess.TimeoutExpired:
                _log(f"taskkill {exe} timed out (attempt {attempt+1})")
            except Exception:
                pass
        time.sleep(3 * (attempt + 1))
    
    # Fallback: wmic (stronger than taskkill for protected processes)
    for exe in ['Portal.exe', 'FileStorage.Server.exe']:
        try:
            r = subprocess.run(
                ['wmic', 'process', 'where', f"name='{exe}'", 'delete'],
                capture_output=True, timeout=15, text=True
            )
            if "successful" in r.stdout.lower():
                killed_any = True
        except Exception:
            pass
    
    time.sleep(5)
    return killed_any

def _wmi_kill_portal():
    """WMIC-only kill (stronger fallback when taskkill fails)"""
    for exe in ['Portal.exe', 'FileStorage.Server.exe']:
        try:
            subprocess.run(
                ['wmic', 'process', 'where', f"name='{exe}'", 'delete'],
                capture_output=True, timeout=15
            )
            time.sleep(3)
        except Exception:
            pass

def get_tia(mode: str = "WithoutUserInterface"):
    """Return singleton TiaPortal instance. Creates once, reuses for entire server lifetime.
    
    Args:
        mode: "WithoutUserInterface" (default, headless) or "WithUserInterface" (attach to GUI)
              When "WithUserInterface" is used, attempts to attach to existing TIA Portal GUI.
    """
    global _tia_instance
    
    if _tia_instance is not None:
        try:
            _ = _tia_instance.Projects.Count
            return _tia_instance
        except Exception:
            _log("TiaPortal instance lost, recreating...")
            _tia_instance = None
    
    eng = _get_eng()
    
    # WithUserInterface mode: try to attach to existing GUI instance first
    if mode.lower() == "withuserinterface":
        try:
            _tia_instance = eng.TiaPortal(eng.TiaPortalMode.WithUserInterface)
            _log("Attached to existing TIA Portal GUI instance")
            return _tia_instance
        except Exception as e:
            _log(f"GUI attach failed: {str(e)[:100]}")
            # Do NOT fall back to headless or kill processes - user explicitly requested GUI mode
            raise RuntimeError(
                f"无法附加到 TIA Portal GUI 进程: {str(e)}\n"
                f"请确认:\n"
                f"  1. TIA Portal V16 GUI 已打开\n"
                f"  2. 没有其他无界面 TIA 实例占用 (关闭后重试)\n"
                f"  3. 如需无界面模式，请使用 project_open (mode=WithoutUserInterface)"
            )
    
    # WithoutUserInterface mode (default or fallback)
    # Kill orphans first
    _kill_portal_processes()
    
    last_error = None
    for attempt in range(5):
        try:
            _tia_instance = eng.TiaPortal(eng.TiaPortalMode.WithoutUserInterface)
            _log(f"Connected on attempt {attempt+1}")
            return _tia_instance
        except Exception as e:
            last_error = e
            err_msg = str(e).lower()
            
            if "access" in err_msg or "denied" in err_msg or "permission" in err_msg:
                _log(f"权限问题 (attempt {attempt+1}): try WMI kill")
                _wmi_kill_portal()
            elif "mutex" in err_msg or "locked" in err_msg or "already" in err_msg:
                _log(f"进程残留 (attempt {attempt+1}): force kill")
                _kill_portal_processes()
            else:
                _log(f"连接失败 attempt {attempt+1}: {str(e)[:100]}")
            
            time.sleep(8)
            _kill_portal_processes()
    
    raise RuntimeError(
        f"TIA Portal 连接失败（5次重试后）\n"
        f"最后错误: {last_error}\n"
        f"建议:\n"
        f"  1. 运行 scripts\\clean_tia.bat 清理残留进程\n"
        f"  2. 打开任务管理器确认无 Portal.exe / FileStorage.Server.exe\n"
        f"  3. 重启电脑后再试\n"
        f"  4. 确认 TIA Portal V16 已正确安装"
    )

def close_tia():
    """Dispose TiaPortal singleton (call on server shutdown)"""
    global _tia_instance, _current_project, _current_project_path
    if _tia_instance is not None:
        try:
            for p in list(_tia_instance.Projects):
                try:
                    p.Close()
                except Exception:
                    pass
        except Exception:
            pass
        try:
            _tia_instance.Dispose()
            _log("TiaPortal disposed")
        except Exception:
            pass
        _tia_instance = None
        _current_project = None
        _current_project_path = None

def get_project(project_path: str, mode: str = "WithoutUserInterface"):
    """Return singleton project. Reuses if already open with same path,
    otherwise opens new one. Avoids 2-minute cooldown.
    
    Args:
        mode: "WithoutUserInterface" or "WithUserInterface" (for GUI attach)
    """
    global _current_project, _current_project_path
    
    if _current_project is not None and _current_project_path == project_path:
        try:
            _ = _current_project.Name  # test if alive
            return _current_project
        except Exception:
            _current_project = None
    
    tia = get_tia(mode)
    from System.IO import FileInfo
    _current_project = tia.Projects.Open(FileInfo(project_path))
    _current_project_path = project_path
    _log(f"Opened project: {project_path} (mode={mode})")
    return _current_project

def close_project():
    """Close current project if open"""
    global _current_project, _current_project_path
    if _current_project is not None:
        try:
            _current_project.Close()
            _log("Project closed")
        except Exception:
            pass
        _current_project = None
        _current_project_path = None

def get_plc_software(project, plc_name: str = None):
    """V16: 通过 DeviceItem.GetService<SoftwareContainer>() 获取 PlcSoftware"""
    HwFeatures = _get_hwfeatures()
    SW = _get_sw()
    
    for device in project.Devices:
        items_to_check = list(device.DeviceItems)
        idx = 0
        while idx < len(items_to_check):
            item = items_to_check[idx]
            idx += 1
            try:
                svc = item.GetService[HwFeatures.SoftwareContainer]()
                if svc and svc.Software and isinstance(svc.Software, SW.PlcSoftware):
                    if plc_name is None or svc.Software.Name == plc_name:
                        return svc.Software
            except Exception:
                try:
                    item_type = item.GetType()
                    gsm = item_type.GetMethod("GetService")
                    if gsm and gsm.IsGenericMethodDefinition:
                        sc_clr_type = __import__('clr').GetClrType(HwFeatures.SoftwareContainer)
                        made = gsm.MakeGenericMethod(sc_clr_type)
                        svc = made.Invoke(item, None)
                        if svc and svc.Software and isinstance(svc.Software, SW.PlcSoftware):
                            if plc_name is None or svc.Software.Name == plc_name:
                                return svc.Software
                except Exception:
                    pass
            for sub in item.DeviceItems:
                items_to_check.append(sub)
    return None
