//! Tauri 命令模块
//! 按功能域拆分为独立子模块，保持高内聚低耦合

pub mod hash;
pub mod database;
pub mod scanner;
pub mod virtual_dir;
pub mod deletion;
pub mod classifier;
pub mod integration;
pub mod file_ops;
pub mod monitor;
pub mod tags;
pub mod recent_files;
pub mod batch;
pub mod file_edit;
pub mod data_io;