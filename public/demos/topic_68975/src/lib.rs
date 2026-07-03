pub mod cli;
pub mod docx;
pub mod error;
pub mod model;

#[cfg(feature = "wasm")]
pub mod wasm;

use std::path::Path;

use crate::docx::{DocxParser, DocxReader};
use crate::error::{OffDiffError, Result};
use crate::model::Document;

pub fn process_docx(input_path: &Path) -> Result<Document> {
    let mut reader = DocxReader::open(input_path)?;
    let xml_content = reader.read_document_xml()?;
    let doc = DocxParser::parse_document(&xml_content)?;
    Ok(doc)
}

pub fn output_json(doc: &Document, output: Option<&Path>) -> Result<()> {
    match output {
        Some(path) => {
            let file = std::fs::File::create(path)
                .map_err(|e| OffDiffError::from_io_with_path(e, path))?;
            serde_json::to_writer_pretty(file, doc)?;
        }
        None => {
            let stdout = std::io::stdout();
            let handle = stdout.lock();
            serde_json::to_writer_pretty(handle, doc)?;
        }
    }
    Ok(())
}

pub fn run(cli: cli::Cli) -> Result<()> {
    match cli.command {
        cli::Command::Parse { input, output } => {
            let doc = process_docx(&input)?;
            output_json(&doc, output.as_deref())?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use zip::write::FileOptions;
    use zip::ZipWriter;

    fn create_minimal_docx(paragraphs: &[&str]) -> Vec<u8> {
        let body: String = paragraphs
            .iter()
            .map(|p| {
                format!(
                    "<w:p><w:r><w:t xml:space=\"preserve\">{}</w:t></w:r></w:p>",
                    p
                )
            })
            .collect();

        let document_xml = format!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
{}
</w:body>
</w:document>"#,
            body
        );

        let content_types_xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"#;

        let rels_xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"#;

        let mut buf = Vec::new();
        {
            let mut zip = ZipWriter::new(std::io::Cursor::new(&mut buf));
            let options: FileOptions<'_, ()> =
                FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

            zip.start_file("[Content_Types].xml", options)
                .unwrap();
            zip.write_all(content_types_xml.as_bytes()).unwrap();

            zip.start_file("_rels/.rels", options).unwrap();
            zip.write_all(rels_xml.as_bytes()).unwrap();

            zip.start_file("word/document.xml", options)
                .unwrap();
            zip.write_all(document_xml.as_bytes()).unwrap();

            zip.finish().unwrap();
        }
        buf
    }

    fn temp_dir_path() -> std::path::PathBuf {
        let mut dir = std::env::temp_dir();
        let unique = format!("offdiff-test-{}-{}", std::process::id(), rand_suffix());
        dir.push(unique);
        std::fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn rand_suffix() -> u64 {
        use std::time::{SystemTime, UNIX_EPOCH};
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos() as u64
    }

    #[test]
    fn test_process_docx_end_to_end() {
        let docx_bytes = create_minimal_docx(&["Hello, World!", "Second paragraph"]);
        let temp_dir = temp_dir_path();
        let docx_path = temp_dir.join("test.docx");
        std::fs::write(&docx_path, &docx_bytes).unwrap();

        let doc = process_docx(&docx_path).expect("Failed to process docx");
        assert_eq!(doc.metadata.paragraph_count, 2);
        assert_eq!(doc.paragraphs.len(), 2);
        assert_eq!(doc.paragraphs[0].content, "Hello, World!");
        assert_eq!(doc.paragraphs[1].content, "Second paragraph");

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_output_json_to_file() {
        let doc = Document {
            metadata: crate::model::DocumentMetadata { paragraph_count: 1 },
            paragraphs: vec![crate::model::Paragraph {
                index: 0,
                content: "Test".to_string(),
                style: crate::model::ParagraphStyle {
                    style_name: None,
                    alignment: None,
                    indentation: None,
                    runs: vec![crate::model::Run {
                        text: "Test".to_string(),
                        style: crate::model::RunStyle {
                            bold: Some(true),
                            italic: None,
                            underline: None,
                            font_size: None,
                            font_name: None,
                        },
                    }],
                },
            }],
        };

        let temp_dir = temp_dir_path();
        let output_path = temp_dir.join("output.json");

        output_json(&doc, Some(&output_path)).expect("Failed to output JSON");

        let json_content = std::fs::read_to_string(&output_path).unwrap();
        let deserialized: Document =
            serde_json::from_str(&json_content).expect("Failed to deserialize");
        assert_eq!(deserialized.metadata.paragraph_count, 1);
        assert_eq!(deserialized.paragraphs[0].content, "Test");
        assert_eq!(
            deserialized.paragraphs[0].style.runs[0].style.bold,
            Some(true)
        );

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_run_with_parse_command() {
        let docx_bytes = create_minimal_docx(&["E2E Test"]);
        let temp_dir = temp_dir_path();
        let docx_path = temp_dir.join("test.docx");
        let json_path = temp_dir.join("output.json");
        std::fs::write(&docx_path, &docx_bytes).unwrap();

        let cli = cli::Cli {
            command: cli::Command::Parse {
                input: docx_path.clone(),
                output: Some(json_path.clone()),
            },
        };

        run(cli).expect("run() failed");

        let json_content = std::fs::read_to_string(&json_path).unwrap();
        assert!(json_content.contains("E2E Test"));
        assert!(json_content.contains("\"paragraph_count\""));

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_error_file_not_found() {
        let temp_dir = temp_dir_path();
        let nonexistent_path = temp_dir.join("nonexistent.docx");

        let result = process_docx(&nonexistent_path);
        assert!(result.is_err());

        let err = result.unwrap_err();
        match &err {
            crate::error::OffDiffError::FileNotFound { path } => {
                assert_eq!(path, &nonexistent_path);
            }
            _ => panic!("Expected FileNotFound error, got: {:?}", err),
        }

        let err_msg = format!("{}", err);
        assert!(err_msg.contains("File not found"));
        assert!(err_msg.contains("Check that the file path is correct"));

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_error_invalid_zip_file() {
        let temp_dir = temp_dir_path();
        let fake_docx_path = temp_dir.join("fake.docx");
        std::fs::write(&fake_docx_path, b"This is not a ZIP file at all").unwrap();

        let result = process_docx(&fake_docx_path);
        assert!(result.is_err());

        let err = result.unwrap_err();
        match &err {
            crate::error::OffDiffError::InvalidZip { path } => {
                assert_eq!(path, &fake_docx_path);
            }
            _ => panic!("Expected InvalidZip error, got: {:?}", err),
        }

        let err_msg = format!("{}", err);
        assert!(err_msg.contains("Failed to read ZIP archive"));
        assert!(err_msg.contains("may not be a valid .docx file"));

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_error_missing_document_xml() {
        let temp_dir = temp_dir_path();
        let docx_path = temp_dir.join("missing_part.docx");

        let mut buf = Vec::new();
        {
            let mut zip = zip::ZipWriter::new(std::io::Cursor::new(&mut buf));
            let options: zip::write::FileOptions<'_, ()> = zip::write::FileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated);

            zip.start_file("[Content_Types].xml", options)
                .unwrap();
            zip.write_all(b"<Types></Types>").unwrap();

            zip.finish().unwrap();
        }
        std::fs::write(&docx_path, &buf).unwrap();

        let result = process_docx(&docx_path);
        assert!(result.is_err());

        let err = result.unwrap_err();
        match &err {
            crate::error::OffDiffError::MissingPart { part, path } => {
                assert_eq!(part, "word/document.xml");
                assert_eq!(path, &docx_path);
            }
            _ => panic!("Expected MissingPart error, got: {:?}", err),
        }

        let err_msg = format!("{}", err);
        assert!(err_msg.contains("Missing required part"));
        assert!(err_msg.contains("word/document.xml"));
        assert!(err_msg.contains("may be corrupted"));

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_error_malformed_xml_in_docx() {
        let temp_dir = temp_dir_path();
        let docx_path = temp_dir.join("bad_xml.docx");

        let bad_document_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t>Unclosed tags
</w:body>
</w:document>"#;

        let mut buf = Vec::new();
        {
            let mut zip = zip::ZipWriter::new(std::io::Cursor::new(&mut buf));
            let options: zip::write::FileOptions<'_, ()> = zip::write::FileOptions::default()
                .compression_method(zip::CompressionMethod::Deflated);

            zip.start_file("[Content_Types].xml", options)
                .unwrap();
            zip.write_all(b"<Types></Types>").unwrap();

            zip.start_file("word/document.xml", options)
                .unwrap();
            zip.write_all(bad_document_xml.as_bytes()).unwrap();

            zip.finish().unwrap();
        }
        std::fs::write(&docx_path, &buf).unwrap();

        let result = process_docx(&docx_path);
        assert!(result.is_err());

        let err = result.unwrap_err();
        match &err {
            crate::error::OffDiffError::Xml(msg) => {
                assert!(msg.contains("XML parsing error"));
            }
            _ => panic!("Expected Xml error, got: {:?}", err),
        }

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_error_output_json_file_not_found() {
        let doc = Document {
            metadata: crate::model::DocumentMetadata { paragraph_count: 0 },
            paragraphs: vec![],
        };

        let temp_dir = temp_dir_path();
        let invalid_path = temp_dir.join("nonexistent_dir").join("output.json");

        let result = output_json(&doc, Some(&invalid_path));
        assert!(result.is_err());

        let err = result.unwrap_err();
        match &err {
            crate::error::OffDiffError::FileNotFound { path } => {
                assert_eq!(path, &invalid_path);
            }
            _ => panic!("Expected FileNotFound error, got: {:?}", err),
        }

        let err_msg = format!("{}", err);
        assert!(err_msg.contains("File not found"));

        std::fs::remove_dir_all(&temp_dir).ok();
    }

    #[test]
    fn test_error_display_file_not_found_contains_path() {
        let path = std::path::PathBuf::from("/tmp/test.docx");
        let err = crate::error::OffDiffError::FileNotFound { path: path.clone() };
        let msg = format!("{}", err);
        assert!(msg.contains("/tmp/test.docx"));
    }

    #[test]
    fn test_error_display_invalid_zip_contains_path() {
        let path = std::path::PathBuf::from("/tmp/bad.docx");
        let err = crate::error::OffDiffError::InvalidZip { path: path.clone() };
        let msg = format!("{}", err);
        assert!(msg.contains("/tmp/bad.docx"));
    }

    #[test]
    fn test_error_display_missing_part_contains_path_and_part() {
        let path = std::path::PathBuf::from("/tmp/corrupt.docx");
        let err = crate::error::OffDiffError::MissingPart {
            part: "word/document.xml".to_string(),
            path: path.clone(),
        };
        let msg = format!("{}", err);
        assert!(msg.contains("/tmp/corrupt.docx"));
        assert!(msg.contains("word/document.xml"));
    }
}
