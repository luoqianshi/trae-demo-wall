use std::path::PathBuf;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum OffDiffError {
    #[error("File not found: {path}\n  Check that the file path is correct.")]
    FileNotFound { path: PathBuf },

    #[error("IO error while accessing '{path}': {source}")]
    Io {
        path: PathBuf,
        source: std::io::Error,
    },

    #[error("Failed to read ZIP archive: {path}\n  The file may not be a valid .docx file.")]
    InvalidZip { path: PathBuf },

    #[error("ZIP archive error: {0}")]
    Zip(#[from] zip::result::ZipError),

    #[error("XML parsing error: {0}")]
    Xml(String),

    #[error(
        "Missing required part '{part}' in document: {path}\n  The .docx file may be corrupted."
    )]
    MissingPart { part: String, path: PathBuf },

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
}

impl OffDiffError {
    pub fn from_io_with_path(source: std::io::Error, path: &std::path::Path) -> Self {
        if source.kind() == std::io::ErrorKind::NotFound {
            OffDiffError::FileNotFound {
                path: path.to_path_buf(),
            }
        } else {
            OffDiffError::Io {
                path: path.to_path_buf(),
                source,
            }
        }
    }
}

pub type Result<T> = std::result::Result<T, OffDiffError>;
