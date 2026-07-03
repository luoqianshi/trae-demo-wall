use wasm_bindgen::prelude::*;

use crate::docx::DocxParser;
use crate::model::Document;

#[wasm_bindgen]
pub fn parse_docx(data: &[u8]) -> Result<JsValue, JsValue> {
    let document_xml = read_document_xml_from_bytes(data)
        .map_err(|e| JsValue::from_str(&e))?;

    let doc = DocxParser::parse_document(&document_xml)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let js_value = serde_wasm_bindgen::to_value(&doc)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))?;

    Ok(js_value)
}

fn read_document_xml_from_bytes(data: &[u8]) -> std::result::Result<String, String> {
    use std::io::Cursor;
    use std::io::Read;
    use zip::ZipArchive;

    let cursor = Cursor::new(data);
    let mut archive = ZipArchive::new(cursor)
        .map_err(|_| "Failed to read ZIP archive. The file may not be a valid .docx file.".to_string())?;

    let mut file = archive.by_name("word/document.xml")
        .map_err(|_| "Missing required part 'word/document.xml' in document. The .docx file may be corrupted.".to_string())?;

    let mut content = String::new();
    file.read_to_string(&mut content)
        .map_err(|e| format!("Failed to read document.xml: {}", e))?;

    Ok(content)
}
