//! AI FileManager Windows Shell Extension DLL
//!
//! 实现 COM 接口，为 Windows 资源管理器提供右键菜单集成
//!
//! 功能：
//! - 文件右键菜单："AI FileManager 管理"（打开文件管理）
//! - 目录右键菜单："AI FileManager 扫描目录"（扫描目录）
//! - 文件右键菜单："AI FileManager 计算哈希"（计算文件哈希）

#![cfg(target_os = "windows")]

use std::cell::RefCell;
use std::ffi::CStr;
use std::ffi::CString;
use windows::core::*;
use windows::Win32::Foundation::*;
use windows::Win32::System::Com::*;
use windows::Win32::System::LibraryLoader::*;
use windows::Win32::System::Ole::CF_HDROP;
use windows::Win32::System::Ole::ReleaseStgMedium;
use windows::Win32::System::Registry::*;
use windows::Win32::UI::Shell::*;
use windows::Win32::UI::Shell::Common::ITEMIDLIST;
use windows::Win32::UI::WindowsAndMessaging::*;
use windows::Win32::Storage::FileSystem::*;

// ===== GUID 定义 =====
// {A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
const CLSID_SHELL_EXT: GUID = GUID::from_u128(0xA1B2C3D4_E5F6_7890_ABCD_EF1234567890);

// ===== 全局状态 =====
static mut DLL_REF_COUNT: u32 = 0;

/// 将 &[u16] 宽字符串转换为 &[u8] 字节切片（用于注册表 API）
fn wide_as_bytes(wide: &[u16]) -> &[u8] {
    unsafe { std::slice::from_raw_parts(wide.as_ptr() as *const u8, wide.len() * 2) }
}

/// 将 Rust 字符串转为空终止的宽字符串 Vec<u16>
fn to_wide(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(std::iter::once(0)).collect()
}

// ===== ShellExtension 类 =====
/// 实现 IShellExtInit + IContextMenu（右键菜单）
#[implement(IShellExtInit, IContextMenu)]
struct ShellExtension {
    selected_file: RefCell<String>,
    is_directory: RefCell<bool>,
}

impl ShellExtension {
    fn new() -> Self {
        Self {
            selected_file: RefCell::new(String::new()),
            is_directory: RefCell::new(false),
        }
    }
}

// ===== IShellExtInit 接口实现（在生成的 _Impl 类型上） =====
impl IShellExtInit_Impl for ShellExtension_Impl {
    fn Initialize(
        &self,
        _pidl_folder: *const ITEMIDLIST,
        data_object: Option<&IDataObject>,
        _hkey_prog_id: HKEY,
    ) -> Result<()> {
        let this = self.get_impl();
        if let Some(data_obj) = data_object {
            unsafe {
                let format = FORMATETC {
                    cfFormat: CF_HDROP.0,
                    ptd: std::ptr::null_mut(),
                    dwAspect: DVASPECT_CONTENT.0,
                    lindex: -1,
                    tymed: TYMED_HGLOBAL.0 as u32,
                };

                if let Ok(mut medium) = data_obj.GetData(&format) {
                    let hdrop = HDROP(medium.u.hGlobal.0 as *mut std::ffi::c_void);
                    if !hdrop.is_invalid() {
                        let count = DragQueryFileA(hdrop, 0xFFFFFFFF, None);
                        if count > 0 {
                            let mut buffer = vec![0u8; MAX_PATH as usize];
                            DragQueryFileA(hdrop, 0, Some(&mut buffer));
                            let path = String::from_utf8_lossy(&buffer)
                                .trim_end_matches('\0')
                                .to_string();

                            *this.selected_file.borrow_mut() = path.clone();

                            if let Ok(cpath) = CString::new(path.as_str()) {
                                let attr = GetFileAttributesA(PCSTR(cpath.as_ptr() as *const u8));
                                *this.is_directory.borrow_mut() =
                                    attr != u32::MAX && attr & FILE_ATTRIBUTE_DIRECTORY.0 != 0;
                            }
                        }
                    }
                    ReleaseStgMedium(&raw mut medium);
                }
            }
        }
        Ok(())
    }
}

// ===== IContextMenu 接口实现 =====
impl IContextMenu_Impl for ShellExtension_Impl {
    fn QueryContextMenu(
        &self,
        menu: HMENU,
        _index_menu: u32,
        id_cmd_first: u32,
        _id_cmd_last: u32,
        u_flags: u32,
    ) -> Result<()> {
        let this = self.get_impl();
        if u_flags & CMF_VERBSONLY != 0 {
            return Err(Error::from(HRESULT(1)));
        }

        let mut items_added: u32 = 0;
        let is_dir = *this.is_directory.borrow();

        unsafe {
            let menu_str = if is_dir {
                "AI FileManager 扫描目录"
            } else {
                "AI FileManager 管理"
            };

            let menu_wide = to_wide(menu_str);
            AppendMenuW(
                menu,
                MF_STRING,
                (id_cmd_first + items_added) as usize,
                PCWSTR(menu_wide.as_ptr()),
            )?;
            items_added += 1;

            if !is_dir {
                let hash_wide = to_wide("AI FileManager 计算哈希");
                AppendMenuW(
                    menu,
                    MF_STRING,
                    (id_cmd_first + items_added) as usize,
                    PCWSTR(hash_wide.as_ptr()),
                )?;
                items_added += 1;
            }
        }

        if items_added == 0 {
            Err(Error::from(HRESULT(1)))
        } else {
            Err(Error::from(HRESULT(items_added as i32)))
        }
    }

    fn InvokeCommand(&self, info: *const CMINVOKECOMMANDINFO) -> Result<()> {
        let this = self.get_impl();
        unsafe {
            let cinfo = &*info;

            let cmd_id = if (cinfo.lpVerb.0 as usize) > 0xFFFF {
                let verb_str = CStr::from_ptr(cinfo.lpVerb.0 as *const i8);
                let verb = verb_str.to_string_lossy();
                match verb.as_ref() {
                    "manage" => 0,
                    "hash" => 1,
                    _ => return Err(Error::from(E_INVALIDARG)),
                }
            } else {
                cinfo.lpVerb.0 as u32
            };

            let selected = this.selected_file.borrow();
            if selected.is_empty() {
                return Err(Error::from(E_INVALIDARG));
            }

            let exe_path = get_exe_path();

            match cmd_id {
                0 => {
                    if let Some(exe) = &exe_path {
                        let _ = std::process::Command::new(exe)
                            .arg(&*selected)
                            .spawn();
                    }
                }
                1 => {
                    if let Some(exe) = &exe_path {
                        let _ = std::process::Command::new(exe)
                            .arg("--hash")
                            .arg(&*selected)
                            .spawn();
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }

    fn GetCommandString(
        &self,
        _id_cmd: usize,
        _u_type: u32,
        _reserved: *const u32,
        _command_string: PSTR,
        _cch_max: u32,
    ) -> Result<()> {
        Err(Error::from(E_INVALIDARG))
    }
}

// ===== COM 类工厂 =====
#[implement(IClassFactory)]
struct ShellExtClassFactory;

impl IClassFactory_Impl for ShellExtClassFactory_Impl {
    fn CreateInstance(
        &self,
        outer: Option<&IUnknown>,
        iid: *const GUID,
        object: *mut *mut std::ffi::c_void,
    ) -> Result<()> {
        unsafe {
            if outer.is_some() {
                return Err(Error::from(CLASS_E_NOAGGREGATION));
            }

            let ext = ShellExtension::new();
            let unknown: IUnknown = ext.into();
            unknown.query(iid, object).ok()
        }
    }

    fn LockServer(&self, _lock: BOOL) -> Result<()> {
        Ok(())
    }
}

// ===== DLL 导出函数 =====

#[no_mangle]
extern "system" fn DllMain(
    _dll_module: HINSTANCE,
    _call_reason: u32,
    _reserved: *mut std::ffi::c_void,
) -> BOOL {
    BOOL(1)
}

#[no_mangle]
extern "system" fn DllGetClassObject(
    rclsid: *const GUID,
    riid: *const GUID,
    ppv: *mut *mut std::ffi::c_void,
) -> HRESULT {
    unsafe {
        if rclsid.is_null() || riid.is_null() || ppv.is_null() {
            return E_INVALIDARG;
        }

        let clsid = *rclsid;
        if clsid != CLSID_SHELL_EXT {
            return CLASS_E_CLASSNOTAVAILABLE;
        }

        let factory: IClassFactory = ShellExtClassFactory.into();
        let unknown: &IUnknown = &factory;
        unknown.query(riid, ppv)
    }
}

#[no_mangle]
extern "system" fn DllCanUnloadNow() -> HRESULT {
    unsafe {
        if DLL_REF_COUNT == 0 {
            S_OK
        } else {
            S_FALSE
        }
    }
}

#[no_mangle]
extern "system" fn DllRegisterServer() -> HRESULT {
    unsafe {
        let dll_path = get_module_path();
        if dll_path.is_empty() {
            return HRESULT(E_FAIL.0);
        }

        let clsid_str = guid_to_string(&CLSID_SHELL_EXT);
        let clsid_reg_path = format!("CLSID\\{}", clsid_str);

        // 创建 CLSID 键
        let mut hkey_clsid = HKEY::default();
        let clsid_path_wide = to_wide(&clsid_reg_path);
        let _ = RegCreateKeyW(
            HKEY_CLASSES_ROOT,
            PCWSTR(clsid_path_wide.as_ptr()),
            &mut hkey_clsid,
        );

        // 设置默认值
        let default_wide = to_wide("AI FileManager Shell Extension");
        let _ = RegSetValueExW(
            hkey_clsid,
            PCWSTR(std::ptr::null()),
            0,
            REG_SZ,
            Some(wide_as_bytes(&default_wide)),
        );

        // 设置 InprocServer32
        let mut hkey_inproc = HKEY::default();
        let inproc_wide = to_wide("InprocServer32");
        let _ = RegCreateKeyW(
            hkey_clsid,
            PCWSTR(inproc_wide.as_ptr()),
            &mut hkey_inproc,
        );
        let dll_wide = to_wide(&dll_path);
        let _ = RegSetValueExW(
            hkey_inproc,
            PCWSTR(std::ptr::null()),
            0,
            REG_SZ,
            Some(wide_as_bytes(&dll_wide)),
        );

        // 设置线程模型
        let apt_wide = to_wide("Apartment");
        let threading_wide = to_wide("ThreadingModel");
        let _ = RegSetValueExW(
            hkey_inproc,
            PCWSTR(threading_wide.as_ptr()),
            0,
            REG_SZ,
            Some(wide_as_bytes(&apt_wide)),
        );

        let _ = RegCloseKey(hkey_inproc);
        let _ = RegCloseKey(hkey_clsid);

        // 注册到文件类型
        register_shell_extension(&clsid_str);

        S_OK
    }
}

#[no_mangle]
extern "system" fn DllUnregisterServer() -> HRESULT {
    unsafe {
        let clsid_str = guid_to_string(&CLSID_SHELL_EXT);

        let ext_reg_paths = [
            r"*\shellex\ContextMenuHandlers\AI_FileManager",
            r"Directory\shellex\ContextMenuHandlers\AI_FileManager",
        ];
        for path in &ext_reg_paths {
            if let Ok(cpath) = CString::new(*path) {
                let _ = RegDeleteTreeA(HKEY_CLASSES_ROOT, PCSTR(cpath.as_ptr() as *const u8));
            }
        }

        let clsid_reg_path = format!("CLSID\\{}", clsid_str);
        if let Ok(cpath) = CString::new(clsid_reg_path.as_str()) {
            let _ = RegDeleteTreeA(HKEY_CLASSES_ROOT, PCSTR(cpath.as_ptr() as *const u8));
        }

        S_OK
    }
}

// ===== 辅助函数 =====

unsafe fn register_shell_extension(clsid: &str) {
    let ext_reg_paths = [
        r"*\shellex\ContextMenuHandlers\AI_FileManager",
        r"Directory\shellex\ContextMenuHandlers\AI_FileManager",
    ];
    let clsid_wide = to_wide(clsid);

    for path in &ext_reg_paths {
        let mut hkey = HKEY::default();
        let path_wide = to_wide(path);
        let _ = RegCreateKeyW(
            HKEY_CLASSES_ROOT,
            PCWSTR(path_wide.as_ptr()),
            &mut hkey,
        );
        let _ = RegSetValueExW(
            hkey,
            PCWSTR(std::ptr::null()),
            0,
            REG_SZ,
            Some(wide_as_bytes(&clsid_wide)),
        );
        let _ = RegCloseKey(hkey);
    }
}

fn get_exe_path() -> Option<String> {
    let path = get_module_path();
    if path.is_empty() {
        None
    } else {
        Some(path)
    }
}

/// 获取当前 DLL 路径
fn get_module_path() -> String {
    unsafe {
        let mut buffer = vec![0u16; MAX_PATH as usize];
        let len = GetModuleFileNameW(None, &mut buffer);
        if len > 0 {
            let end = len as usize;
            buffer.truncate(end);
            String::from_utf16_lossy(&buffer)
        } else {
            String::new()
        }
    }
}

/// 将 GUID 格式化为字符串
fn guid_to_string(guid: &GUID) -> String {
    format!(
        "{{{:08X}-{:04X}-{:04X}-{:02X}{:02X}-{:02X}{:02X}{:02X}{:02X}{:02X}{:02X}}}",
        guid.data1, guid.data2, guid.data3, guid.data4[0], guid.data4[1],
        guid.data4[2], guid.data4[3], guid.data4[4], guid.data4[5], guid.data4[6], guid.data4[7],
    )
}