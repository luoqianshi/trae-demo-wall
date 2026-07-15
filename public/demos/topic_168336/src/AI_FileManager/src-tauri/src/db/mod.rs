//! 数据库模块
//! 基于 SQLite 的文件元数据、虚拟目录、删除记录管理
//!
//! 子模块：
//! - schema: 表结构定义与初始化
//! - file_metadata: 文件元数据模型与操作
//! - virtual_dir: 虚拟目录模型与操作
//! - deletion: 删除记录与队列管理

pub mod schema;
pub mod file_metadata;
pub mod virtual_dir;
pub mod deletion;
pub mod tags;
pub mod recent_files;

pub use file_metadata::FileMetadata;
pub use file_metadata::PaginatedFiles;
pub use virtual_dir::VirtualDirectory;
pub use deletion::{DeletionRecord, DeleteQueueItem};
pub use tags::Tag;

use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

/// 数据库管理器
pub struct Database {
    pub(crate) conn: Mutex<Connection>,
    pub db_path: String,
}

impl Database {
    /// 打开或创建数据库
    pub fn open(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::open(path)?;
        let db = Self {
            conn: Mutex::new(conn),
            db_path: path.to_string_lossy().to_string(),
        };
        db.initialize()?;
        Ok(db)
    }

    /// 创建内存数据库（用于测试）
    #[allow(dead_code)]
    pub fn open_in_memory() -> Result<Self, Box<dyn std::error::Error>> {
        let conn = Connection::open_in_memory()?;
        let db = Self {
            conn: Mutex::new(conn),
            db_path: ":memory:".to_string(),
        };
        db.initialize()?;
        Ok(db)
    }

    /// 初始化数据库表结构
    fn initialize(&self) -> Result<(), Box<dyn std::error::Error>> {
        let conn = self.conn.lock().unwrap();
        schema::create_tables(&conn)?;
        Ok(())
    }
}