"""Shared TIA Portal V16 initialization - DIRECT LOAD version (reliable)"""
import os, sys, clr, traceback

_initialized = False
_eng = None
_init_error = None

def init_tia():
    global _initialized, _eng, _init_error
    if _initialized:
        return True
    
    try:
        api_dir = r"D:\Program Files\Siemens\Automation\Portal V16\PublicAPI\V16"
        bin_pub = r"D:\Program Files\Siemens\Automation\Portal V16\Bin\PublicAPI"
        
        # Set PATH first - critical for native DLL resolution
        os.environ["PATH"] = bin_pub + ";" + api_dir + ";" + os.environ.get("PATH","")
        
        # Direct loading - proven to work
        clr.AddReference(os.path.join(api_dir, "Siemens.Engineering.dll"))
        clr.AddReference(os.path.join(bin_pub, "Siemens.Engineering.Contract.dll"))
        
        import Siemens.Engineering as eng
        _eng = eng
        _initialized = True
        return True
    except Exception as e:
        _init_error = traceback.format_exc()
        print("[TIA_INIT_ERR]", _init_error, file=sys.stderr)
        return False

def get_eng():
    global _eng, _init_error
    if _eng is None:
        if not init_tia():
            raise RuntimeError("TIA init failed: " + (_init_error or "unknown"))
    return _eng
