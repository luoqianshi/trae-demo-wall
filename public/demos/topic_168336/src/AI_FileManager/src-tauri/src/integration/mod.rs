//! 系统集成模块
//! 提供跨平台文件管理器集成能力
//!
//! 支持的平台：
//! - Windows: Shell Extension (COM 组件)，右键菜单集成
//! - Linux: inotify 文件系统事件监听 + 文件管理器插件
//! - macOS: 规划中
//!
//! 当前实现为接口抽象层，具体平台集成需要在编译时按平台启用

use serde::{Deserialize, Serialize};

/// 系统集成状态
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IntegrationStatus {
    /// 是否已集成到文件管理器
    pub integrated: bool,
    /// 支持的平台特性
    pub shell_extension: bool,
    pub file_monitor: bool,
    pub context_menu: bool,
    /// 平台名称
    pub platform: String,
}

/// 文件管理器操作类型
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FileManagerAction {
    Delete,
    Move,
    Copy,
    Rename,
    Unknown,
}

/// 文件管理器事件
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileManagerEvent {
    pub action: FileManagerAction,
    pub source_path: String,
    pub target_path: Option<String>,
}

/// 系统集成管理器
pub struct IntegrationManager {
    platform: String,
}

impl IntegrationManager {
    /// 创建系统集成管理器
    pub fn new() -> Self {
        let platform = if cfg!(target_os = "windows") {
            "windows".to_string()
        } else if cfg!(target_os = "linux") {
            "linux".to_string()
        } else if cfg!(target_os = "macos") {
            "macos".to_string()
        } else {
            "unknown".to_string()
        };

        Self { platform }
    }

    /// 获取当前平台
    #[allow(dead_code)]
    pub fn platform(&self) -> &str {
        &self.platform
    }

    /// 检查是否已集成
    pub fn check_integration(&self) -> IntegrationStatus {
        IntegrationStatus {
            integrated: self.is_integrated(),
            shell_extension: cfg!(target_os = "windows"),
            file_monitor: true, // notify crate 已支持
            context_menu: cfg!(target_os = "windows"),
            platform: self.platform.clone(),
        }
    }

    /// 安装系统集成（注册 Shell Extension 等）
    pub fn install(&self) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            self.install_windows_shell_extension()?;
        }

        #[cfg(target_os = "linux")]
        {
            self.install_linux_inotify_service()?;
        }

        #[cfg(target_os = "macos")]
        {
            return Err("macOS 集成暂未实现".to_string());
        }

        Ok(())
    }

    /// 卸载系统集成
    pub fn uninstall(&self) -> Result<(), String> {
        #[cfg(target_os = "windows")]
        {
            self.uninstall_windows_shell_extension()?;
        }

        #[cfg(target_os = "linux")]
        {
            self.uninstall_linux_inotify_service()?;
        }

        Ok(())
    }

    /// 检查是否已集成到系统
    fn is_integrated(&self) -> bool {
        #[cfg(target_os = "windows")]
        {
            // 检查注册表中是否存在 Shell Extension 键
            self.check_windows_registry()
        }

        #[cfg(target_os = "linux")]
        {
            // 检查服务文件是否存在
            self.check_linux_service()
        }

        #[cfg(not(any(target_os = "windows", target_os = "linux")))]
        false
    }

    // ---- Windows 集成 ----

    /// 安装 Windows Shell Extension
    #[cfg(target_os = "windows")]
    fn install_windows_shell_extension(&self) -> Result<(), String> {
        // Shell Extension 需要编译为单独的 DLL 并通过 regsvr32 注册
        // 这里记录安装步骤，实际注册由外部脚本完成
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("无法获取可执行文件路径: {}", e))?;
        let install_dir = exe_path.parent().unwrap_or(std::path::Path::new("."));

        // 创建注册表脚本
        let reg_content = format!(
            r#"Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\*\shell\AI_FileManager]
@="AI FileManager 管理"
"Icon"="{exe}\\ai_filemanager.exe,0"

[HKEY_CLASSES_ROOT\*\shell\AI_FileManager\command]
@="\\"{exe}\\ai_filemanager.exe\\" \\"%1\\""

[HKEY_CLASSES_ROOT\Directory\shell\AI_FileManager]
@="AI FileManager 扫描目录"
"Icon"="{exe}\\ai_filemanager.exe,0"

[HKEY_CLASSES_ROOT\Directory\shell\AI_FileManager\command]
@="\\"{exe}\\ai_filemanager.exe\\" \\"%1\\""
"#,
            exe = install_dir.to_string_lossy()
        );

        let reg_path = install_dir.join("install_shell_ext.reg");
        std::fs::write(&reg_path, reg_content)
            .map_err(|e| format!("无法写入注册表脚本: {}", e))?;

        // 提示用户运行注册表脚本
        println!("Windows Shell Extension 注册表脚本已生成: {:?}", reg_path);
        println!("请以管理员身份运行该文件以完成注册。");

        Ok(())
    }

    /// 卸载 Windows Shell Extension
    #[cfg(target_os = "windows")]
    fn uninstall_windows_shell_extension(&self) -> Result<(), String> {
        // 通过删除注册表键来卸载
        let reg_content = r#"Windows Registry Editor Version 5.00

[-HKEY_CLASSES_ROOT\*\shell\AI_FileManager]
[-HKEY_CLASSES_ROOT\Directory\shell\AI_FileManager]
"#;

        let exe_path = std::env::current_exe()
            .map_err(|e| format!("无法获取可执行文件路径: {}", e))?;
        let install_dir = exe_path.parent().unwrap_or(std::path::Path::new("."));
        let reg_path = install_dir.join("uninstall_shell_ext.reg");
        std::fs::write(&reg_path, reg_content)
            .map_err(|e| format!("无法写入卸载脚本: {}", e))?;

        println!("Windows Shell Extension 卸载脚本已生成: {:?}", reg_path);
        println!("请以管理员身份运行该文件以完成卸载。");

        Ok(())
    }

    /// 检查 Windows 注册表中是否存在 Shell Extension
    #[cfg(target_os = "windows")]
    fn check_windows_registry(&self) -> bool {
        // 使用 reg query 命令检查
        let output = std::process::Command::new("reg")
            .args([
                "query",
                "HKEY_CLASSES_ROOT\\*\\shell\\AI_FileManager",
            ])
            .output();

        match output {
            Ok(out) => out.status.success(),
            Err(_) => false,
        }
    }

    // ---- Linux 集成 ----

    /// 安装 Linux inotify 服务
    #[cfg(target_os = "linux")]
    fn install_linux_inotify_service(&self) -> Result<(), String> {
        let exe_path = std::env::current_exe()
            .map_err(|e| format!("无法获取可执行文件路径: {}", e))?;

        // 创建 systemd 服务文件
        let service_content = format!(
            r#"[Unit]
Description=AI FileManager Watcher Service
After=network.target

[Service]
Type=simple
ExecStart={exe} --watch
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
"#,
            exe = exe_path.to_string_lossy()
        );

        let service_path = std::path::Path::new("/etc/systemd/system/ai-filemanager.service");
        // 尝试写入（需要 root 权限）
        match std::fs::write(&service_path, &service_content) {
            Ok(_) => {
                println!("systemd 服务文件已创建: {:?}", service_path);
                let _ = std::process::Command::new("systemctl")
                    .args(["daemon-reload"])
                    .status();
                let _ = std::process::Command::new("systemctl")
                    .args(["enable", "ai-filemanager.service"])
                    .status();
                let _ = std::process::Command::new("systemctl")
                    .args(["start", "ai-filemanager.service"])
                    .status();
                Ok(())
            }
            Err(_) => {
                // 没有 root 权限，生成服务文件供用户手动安装
                let local_path = std::path::Path::new("ai-filemanager.service");
                std::fs::write(local_path, &service_content)
                    .map_err(|e| format!("无法写入服务文件: {}", e))?;
                println!("请以 root 权限执行以下命令安装服务：");
                println!("  sudo cp ai-filemanager.service /etc/systemd/system/");
                println!("  sudo systemctl daemon-reload");
                println!("  sudo systemctl enable ai-filemanager.service");
                println!("  sudo systemctl start ai-filemanager.service");
                Ok(())
            }
        }
    }

    /// 卸载 Linux inotify 服务
    #[cfg(target_os = "linux")]
    fn uninstall_linux_inotify_service(&self) -> Result<(), String> {
        let _ = std::process::Command::new("systemctl")
            .args(["stop", "ai-filemanager.service"])
            .status();
        let _ = std::process::Command::new("systemctl")
            .args(["disable", "ai-filemanager.service"])
            .status();

        let service_path = std::path::Path::new("/etc/systemd/system/ai-filemanager.service");
        if service_path.exists() {
            std::fs::remove_file(service_path)
                .map_err(|e| format!("无法删除服务文件: {}", e))?;
            let _ = std::process::Command::new("systemctl")
                .args(["daemon-reload"])
                .status();
        }

        Ok(())
    }

    /// 检查 Linux 服务是否已安装
    #[cfg(target_os = "linux")]
    fn check_linux_service(&self) -> bool {
        std::path::Path::new("/etc/systemd/system/ai-filemanager.service").exists()
    }
}

impl Default for IntegrationManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_platform_detection() {
        let manager = IntegrationManager::new();
        let platform = manager.platform();
        #[cfg(target_os = "windows")]
        assert_eq!(platform, "windows");
        #[cfg(target_os = "linux")]
        assert_eq!(platform, "linux");
    }

    #[test]
    fn test_integration_status() {
        let manager = IntegrationManager::new();
        let status = manager.check_integration();
        // 平台相关特性应在编译时正确设置
        #[cfg(target_os = "windows")]
        assert!(status.shell_extension);
        #[cfg(not(target_os = "windows"))]
        assert!(!status.shell_extension);
    }
}