//! 文件哈希计算模块
//! 支持 MD5 和 SHA256 双重哈希计算，用于文件指纹识别

use anyhow::Result;
use sha2::Digest;
use std::fs::File;
use std::io::Read;
use std::path::Path;

/// 文件哈希结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileHashes {
    pub md5: String,
    pub sha256: String,
}

/// 哈希计算器
pub struct HashCalculator {
    chunk_size: usize,
}

impl Default for HashCalculator {
    fn default() -> Self {
        Self { chunk_size: 8192 } // 8KB 缓冲区
    }
}

impl HashCalculator {
    /// 创建新的哈希计算器
    pub fn new() -> Self {
        Self::default()
    }

    /// 设置分块大小（字节）
    #[allow(dead_code)]
    pub fn with_chunk_size(mut self, chunk_size: usize) -> Self {
        self.chunk_size = chunk_size;
        self
    }

    /// 计算文件的双重哈希（MD5 + SHA256）
    pub fn calculate_hashes(&self, path: &Path) -> Result<FileHashes> {
        let mut file = File::open(path)?;
        let mut md5_hasher = md5::Context::new();
        let mut sha256_hasher = sha2::Sha256::new();
        let mut buffer = vec![0u8; self.chunk_size];

        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            md5_hasher.consume(&buffer[..bytes_read]);
            sha2::Digest::update(&mut sha256_hasher, &buffer[..bytes_read]);
        }

        let md5_hash = format!("{:x}", md5_hasher.compute());
        let sha256_hash = format!("{:x}", sha2::Digest::finalize(sha256_hasher));

        Ok(FileHashes {
            md5: md5_hash,
            sha256: sha256_hash,
        })
    }

    /// 仅计算 SHA256 哈希（快速校验用）
    #[allow(dead_code)]
    pub fn calculate_sha256(&self, path: &Path) -> Result<String> {
        let mut file = File::open(path)?;
        let mut hasher = sha2::Sha256::new();
        let mut buffer = [0u8; 8192];

        loop {
            let bytes_read = file.read(&mut buffer)?;
            if bytes_read == 0 {
                break;
            }
            sha2::Digest::update(&mut hasher, &buffer[..bytes_read]);
        }

        Ok(format!("{:x}", sha2::Digest::finalize(hasher)))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_calculate_hashes() {
        let dir = std::env::temp_dir().join("ai_filemanager_test");
        std::fs::create_dir_all(&dir).unwrap();
        let test_file = dir.join("test_hash.txt");
        std::fs::write(&test_file, b"Hello, AI FileManager!").unwrap();

        let calculator = HashCalculator::new();
        let hashes = calculator.calculate_hashes(&test_file).unwrap();

        assert!(!hashes.md5.is_empty());
        assert!(!hashes.sha256.is_empty());
        assert_eq!(hashes.md5.len(), 32);
        assert_eq!(hashes.sha256.len(), 64);

        std::fs::remove_file(&test_file).unwrap();
    }

    #[test]
    fn test_large_file() {
        let dir = std::env::temp_dir().join("ai_filemanager_test");
        std::fs::create_dir_all(&dir).unwrap();
        let test_file = dir.join("test_large.bin");

        let mut f = std::fs::File::create(&test_file).unwrap();
        let data = vec![0xABu8; 1024 * 1024]; // 1MB
        f.write_all(&data).unwrap();
        drop(f);

        let calculator = HashCalculator::new();
        let hashes = calculator.calculate_hashes(&test_file).unwrap();

        assert_eq!(hashes.md5.len(), 32);
        assert_eq!(hashes.sha256.len(), 64);

        std::fs::remove_file(&test_file).unwrap();
    }
}