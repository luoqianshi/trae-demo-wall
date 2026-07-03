use std::fs::File;
use std::io::Read;
use std::path::{Path, PathBuf};
use zip::ZipArchive;

use crate::error::{OffDiffError, Result};

pub struct DocxReader {
    path: PathBuf,
    archive: ZipArchive<File>,
}

impl DocxReader {
    pub fn open(path: &Path) -> Result<Self> {
        let file = File::open(path).map_err(|e| OffDiffError::from_io_with_path(e, path))?;
        let archive = ZipArchive::new(file).map_err(|_| OffDiffError::InvalidZip {
            path: path.to_path_buf(),
        })?;
        Ok(DocxReader {
            path: path.to_path_buf(),
            archive,
        })
    }

    pub fn read_document_xml(&mut self) -> Result<String> {
        match self.read_part("word/document.xml") {
            Ok(content) => Ok(content),
            Err(OffDiffError::Zip(zip::result::ZipError::FileNotFound)) => {
                Err(OffDiffError::MissingPart {
                    part: "word/document.xml".to_string(),
                    path: self.path.clone(),
                })
            }
            Err(e) => Err(e),
        }
    }

    pub fn read_styles_xml(&mut self) -> Result<Option<String>> {
        match self.read_part("word/styles.xml") {
            Ok(content) => Ok(Some(content)),
            Err(OffDiffError::Zip(zip::result::ZipError::FileNotFound)) => Ok(None),
            Err(e) => Err(e),
        }
    }

    fn read_part(&mut self, name: &str) -> Result<String> {
        let mut file = self.archive.by_name(name)?;
        let mut content = String::new();
        file.read_to_string(&mut content)
            .map_err(|e| OffDiffError::from_io_with_path(e, &self.path))?;
        Ok(content)
    }
}
