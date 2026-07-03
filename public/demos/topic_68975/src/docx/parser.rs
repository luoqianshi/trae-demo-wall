use quick_xml::events::Event;
use quick_xml::Reader;

use crate::error::Result;
use crate::model::{
    Document, DocumentMetadata, Indentation, Paragraph, ParagraphStyle, Run, RunStyle,
};

pub struct DocxParser;

impl DocxParser {
    pub fn parse_document(xml_content: &str) -> Result<Document> {
        let mut reader = Reader::from_str(xml_content);

        let mut paragraphs: Vec<Paragraph> = Vec::new();
        let mut buf = Vec::new();
        let mut in_body = false;
        let mut paragraph_index: usize = 0;

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    let name = e.name();
                    let name_bytes = name.as_ref();
                    if name_bytes == b"w:body" {
                        in_body = true;
                    } else if in_body && name_bytes == b"w:p" {
                        let paragraph = Self::parse_paragraph(&mut reader, paragraph_index)?;
                        paragraphs.push(paragraph);
                        paragraph_index += 1;
                    }
                }
                Ok(Event::End(ref e)) => {
                    let name = e.name();
                    if name.as_ref() == b"w:body" {
                        break;
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => {
                    return Err(crate::error::OffDiffError::Xml(format!(
                        "XML parsing error at position {}: {}",
                        reader.buffer_position(),
                        e
                    )));
                }
                _ => {}
            }
            buf.clear();
        }

        let metadata = DocumentMetadata {
            paragraph_count: paragraphs.len(),
        };

        Ok(Document {
            metadata,
            paragraphs,
        })
    }

    fn parse_paragraph(reader: &mut Reader<&[u8]>, index: usize) -> Result<Paragraph> {
        let mut runs: Vec<Run> = Vec::new();
        let mut buf = Vec::new();
        let mut depth = 1;
        let mut style_name: Option<String> = None;
        let mut alignment: Option<String> = None;
        let mut indentation: Option<Indentation> = None;

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    let name = e.name();
                    let name_bytes = name.as_ref();
                    if name_bytes == b"w:p" {
                        depth += 1;
                    } else if name_bytes == b"w:pPr" {
                        let (sn, al, ind) = Self::parse_paragraph_properties(reader)?;
                        style_name = sn;
                        alignment = al;
                        indentation = ind;
                    } else if name_bytes == b"w:r" {
                        let run = Self::parse_run(reader)?;
                        runs.push(run);
                    }
                }
                Ok(Event::End(ref e)) => {
                    let name = e.name();
                    if name.as_ref() == b"w:p" {
                        depth -= 1;
                        if depth == 0 {
                            break;
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => {
                    return Err(crate::error::OffDiffError::Xml(format!(
                        "XML parsing error at position {}: {}",
                        reader.buffer_position(),
                        e
                    )));
                }
                _ => {}
            }
            buf.clear();
        }

        let content: String = runs.iter().map(|r| r.text.as_str()).collect();

        Ok(Paragraph {
            index,
            content,
            style: ParagraphStyle {
                style_name,
                alignment,
                indentation,
                runs,
            },
        })
    }

    fn parse_paragraph_properties(
        reader: &mut Reader<&[u8]>,
    ) -> Result<(Option<String>, Option<String>, Option<Indentation>)> {
        let mut style_name: Option<String> = None;
        let mut alignment: Option<String> = None;
        let mut indent_left: Option<String> = None;
        let mut indent_right: Option<String> = None;
        let mut indent_first_line: Option<String> = None;
        let mut buf = Vec::new();
        let mut depth = 1;

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) | Ok(Event::Empty(ref e)) => {
                    let name = e.name();
                    let name_bytes = name.as_ref();
                    if name_bytes == b"w:pPr" {
                        depth += 1;
                    } else if name_bytes == b"w:pStyle" {
                        if let Some(val) = Self::get_attribute_val(e) {
                            style_name = Some(val);
                        }
                    } else if name_bytes == b"w:jc" {
                        if let Some(val) = Self::get_attribute_val(e) {
                            alignment = Some(val);
                        }
                    } else if name_bytes == b"w:ind" {
                        for attr in e.attributes().filter_map(|a| a.ok()) {
                            let key = attr.key.as_ref();
                            let value = String::from_utf8_lossy(attr.value.as_ref()).to_string();
                            match key {
                                b"w:left" => indent_left = Some(value),
                                b"w:right" => indent_right = Some(value),
                                b"w:firstLine" => indent_first_line = Some(value),
                                _ => {}
                            }
                        }
                    }
                }
                Ok(Event::End(ref e)) => {
                    let name = e.name();
                    if name.as_ref() == b"w:pPr" {
                        depth -= 1;
                        if depth == 0 {
                            break;
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => {
                    return Err(crate::error::OffDiffError::Xml(format!(
                        "XML parsing error at position {}: {}",
                        reader.buffer_position(),
                        e
                    )));
                }
                _ => {}
            }
            buf.clear();
        }

        let indentation =
            if indent_left.is_some() || indent_right.is_some() || indent_first_line.is_some() {
                Some(Indentation {
                    left: indent_left,
                    right: indent_right,
                    first_line: indent_first_line,
                })
            } else {
                None
            };

        Ok((style_name, alignment, indentation))
    }

    fn get_attribute_val(e: &quick_xml::events::BytesStart) -> Option<String> {
        for attr in e.attributes().filter_map(|a| a.ok()) {
            if attr.key.as_ref() == b"w:val" {
                return Some(String::from_utf8_lossy(attr.value.as_ref()).to_string());
            }
        }
        None
    }

    fn parse_run(reader: &mut Reader<&[u8]>) -> Result<Run> {
        let mut text_parts: Vec<String> = Vec::new();
        let mut buf = Vec::new();
        let mut depth = 1;
        let mut run_style = RunStyle {
            bold: None,
            italic: None,
            underline: None,
            font_size: None,
            font_name: None,
        };

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) => {
                    let name = e.name();
                    let name_bytes = name.as_ref();
                    if name_bytes == b"w:r" {
                        depth += 1;
                    } else if name_bytes == b"w:rPr" {
                        run_style = Self::parse_run_properties(reader)?;
                    } else if name_bytes == b"w:t" {
                        let preserve = e.attributes().filter_map(|a| a.ok()).any(|a| {
                            a.key.as_ref() == b"xml:space" && a.value.as_ref() == b"preserve"
                        });

                        match reader.read_event_into(&mut buf) {
                            Ok(Event::Text(text)) => {
                                let t = text.unescape().unwrap_or_default().to_string();
                                if preserve {
                                    text_parts.push(t);
                                } else {
                                    text_parts.push(t.trim_end().to_string());
                                }
                            }
                            Ok(Event::CData(text)) => {
                                let t = String::from_utf8_lossy(text.as_ref()).to_string();
                                if preserve {
                                    text_parts.push(t);
                                } else {
                                    text_parts.push(t.trim_end().to_string());
                                }
                            }
                            _ => {}
                        }
                    }
                }
                Ok(Event::End(ref e)) => {
                    let name = e.name();
                    if name.as_ref() == b"w:r" {
                        depth -= 1;
                        if depth == 0 {
                            break;
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => {
                    return Err(crate::error::OffDiffError::Xml(format!(
                        "XML parsing error at position {}: {}",
                        reader.buffer_position(),
                        e
                    )));
                }
                _ => {}
            }
            buf.clear();
        }

        let text = text_parts.concat();

        Ok(Run {
            text,
            style: run_style,
        })
    }

    fn parse_run_properties(reader: &mut Reader<&[u8]>) -> Result<RunStyle> {
        let mut bold: Option<bool> = None;
        let mut italic: Option<bool> = None;
        let mut underline: Option<bool> = None;
        let mut font_size: Option<String> = None;
        let mut font_name: Option<String> = None;
        let mut buf = Vec::new();
        let mut depth = 1;

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Start(ref e)) | Ok(Event::Empty(ref e)) => {
                    let name = e.name();
                    let name_bytes = name.as_ref();
                    if name_bytes == b"w:rPr" {
                        depth += 1;
                    } else if name_bytes == b"w:b" {
                        bold = Some(true);
                    } else if name_bytes == b"w:i" {
                        italic = Some(true);
                    } else if name_bytes == b"w:u" {
                        underline = Some(true);
                    } else if name_bytes == b"w:sz" {
                        if let Some(val) = Self::get_attribute_val(e) {
                            font_size = Some(val);
                        }
                    } else if name_bytes == b"w:rFonts" {
                        for attr in e.attributes().filter_map(|a| a.ok()) {
                            if attr.key.as_ref() == b"w:ascii" {
                                font_name =
                                    Some(String::from_utf8_lossy(attr.value.as_ref()).to_string());
                                break;
                            }
                        }
                    }
                }
                Ok(Event::End(ref e)) => {
                    let name = e.name();
                    if name.as_ref() == b"w:rPr" {
                        depth -= 1;
                        if depth == 0 {
                            break;
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => {
                    return Err(crate::error::OffDiffError::Xml(format!(
                        "XML parsing error at position {}: {}",
                        reader.buffer_position(),
                        e
                    )));
                }
                _ => {}
            }
            buf.clear();
        }

        Ok(RunStyle {
            bold,
            italic,
            underline,
            font_size,
            font_name,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn minimal_document_xml(paragraphs: &[&str]) -> String {
        let body: String = paragraphs
            .iter()
            .map(|p| {
                format!(
                    "<w:p><w:r><w:t xml:space=\"preserve\">{}</w:t></w:r></w:p>",
                    p
                )
            })
            .collect();

        format!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
{}
</w:body>
</w:document>"#,
            body
        )
    }

    #[test]
    fn test_parse_single_paragraph() {
        let xml = minimal_document_xml(&["Hello, World!"]);
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");

        assert_eq!(doc.metadata.paragraph_count, 1);
        assert_eq!(doc.paragraphs.len(), 1);
        assert_eq!(doc.paragraphs[0].index, 0);
        assert_eq!(doc.paragraphs[0].content, "Hello, World!");
        assert_eq!(doc.paragraphs[0].style.runs.len(), 1);
        assert_eq!(doc.paragraphs[0].style.runs[0].text, "Hello, World!");
    }

    #[test]
    fn test_parse_multiple_paragraphs() {
        let xml = minimal_document_xml(&["First paragraph", "Second paragraph", "Third paragraph"]);
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");

        assert_eq!(doc.metadata.paragraph_count, 3);
        assert_eq!(doc.paragraphs.len(), 3);
        assert_eq!(doc.paragraphs[0].index, 0);
        assert_eq!(doc.paragraphs[0].content, "First paragraph");
        assert_eq!(doc.paragraphs[1].index, 1);
        assert_eq!(doc.paragraphs[1].content, "Second paragraph");
        assert_eq!(doc.paragraphs[2].index, 2);
        assert_eq!(doc.paragraphs[2].content, "Third paragraph");
    }

    #[test]
    fn test_parse_empty_paragraph() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t xml:space="preserve">Before empty</w:t></w:r></w:p>
<w:p></w:p>
<w:p><w:r><w:t xml:space="preserve">After empty</w:t></w:r></w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");

        assert_eq!(doc.metadata.paragraph_count, 3);
        assert_eq!(doc.paragraphs.len(), 3);
        assert_eq!(doc.paragraphs[0].content, "Before empty");
        assert_eq!(doc.paragraphs[1].content, "");
        assert_eq!(doc.paragraphs[2].content, "After empty");
    }

    #[test]
    fn test_parse_multiple_runs_per_paragraph() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:r><w:t xml:space="preserve">Hello, </w:t></w:r>
  <w:r><w:t xml:space="preserve">World!</w:t></w:r>
</w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");

        assert_eq!(doc.metadata.paragraph_count, 1);
        assert_eq!(doc.paragraphs[0].content, "Hello, World!");
        assert_eq!(doc.paragraphs[0].style.runs.len(), 2);
        assert_eq!(doc.paragraphs[0].style.runs[0].text, "Hello, ");
        assert_eq!(doc.paragraphs[0].style.runs[1].text, "World!");
    }

    #[test]
    fn test_parse_preserve_whitespace() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t xml:space="preserve">   spaced   </w:t></w:r></w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");

        assert_eq!(doc.paragraphs[0].content, "   spaced   ");
    }

    #[test]
    fn test_parse_no_body_paragraphs() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body></w:body>
</w:document>"#;
        let doc = DocxParser::parse_document(xml).expect("Failed to parse");

        assert_eq!(doc.metadata.paragraph_count, 0);
        assert_eq!(doc.paragraphs.len(), 0);
    }

    #[test]
    fn test_parse_malformed_xml() {
        let xml = "<w:document><w:body><w:p><w:r><w:t>test</w:r></w:p></w:body></w:document>";
        let result = DocxParser::parse_document(xml);
        assert!(result.is_err());
        match result.unwrap_err() {
            crate::error::OffDiffError::Xml(_) => {}
            _ => panic!("Expected Xml error"),
        }
    }

    #[test]
    fn test_paragraph_style_name() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:pPr>
    <w:pStyle w:val="Heading1"/>
  </w:pPr>
  <w:r><w:t xml:space="preserve">Heading Text</w:t></w:r>
</w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");
        assert_eq!(doc.paragraphs.len(), 1);
        assert_eq!(
            doc.paragraphs[0].style.style_name,
            Some("Heading1".to_string())
        );
        assert_eq!(doc.paragraphs[0].content, "Heading Text");
    }

    #[test]
    fn test_paragraph_alignment() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:pPr>
    <w:jc w:val="center"/>
  </w:pPr>
  <w:r><w:t xml:space="preserve">Centered Text</w:t></w:r>
</w:p>
</w:body>
</w:document>"#.to_string();

        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");
        assert_eq!(doc.paragraphs.len(), 1);
        assert_eq!(
            doc.paragraphs[0].style.alignment,
            Some("center".to_string())
        );
        assert_eq!(doc.paragraphs[0].content, "Centered Text");
    }

    #[test]
    fn test_paragraph_indentation() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:pPr>
    <w:ind w:left="720" w:right="360" w:firstLine="720"/>
  </w:pPr>
  <w:r><w:t xml:space="preserve">Indented Text</w:t></w:r>
</w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");
        assert_eq!(doc.paragraphs.len(), 1);
        let indent = doc.paragraphs[0]
            .style
            .indentation
            .as_ref()
            .expect("Indentation should be present");
        assert_eq!(indent.left, Some("720".to_string()));
        assert_eq!(indent.right, Some("360".to_string()));
        assert_eq!(indent.first_line, Some("720".to_string()));
        assert_eq!(doc.paragraphs[0].content, "Indented Text");
    }

    #[test]
    fn test_run_bold_style() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:r>
    <w:rPr>
      <w:b/>
    </w:rPr>
    <w:t xml:space="preserve">Bold Text</w:t>
  </w:r>
</w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");
        assert_eq!(doc.paragraphs[0].style.runs.len(), 1);
        assert_eq!(doc.paragraphs[0].style.runs[0].style.bold, Some(true));
        assert_eq!(doc.paragraphs[0].style.runs[0].text, "Bold Text");
    }

    #[test]
    fn test_run_italic_style() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:r>
    <w:rPr>
      <w:i/>
    </w:rPr>
    <w:t xml:space="preserve">Italic Text</w:t>
  </w:r>
</w:p>
</w:body>
</w:document>"#.to_string();

        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");
        assert_eq!(doc.paragraphs[0].style.runs.len(), 1);
        assert_eq!(doc.paragraphs[0].style.runs[0].style.italic, Some(true));
        assert_eq!(doc.paragraphs[0].style.runs[0].text, "Italic Text");
    }

    #[test]
    fn test_run_bold_italic_mixed() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:r>
    <w:rPr>
      <w:b/>
      <w:i/>
    </w:rPr>
    <w:t xml:space="preserve">Bold Italic</w:t>
  </w:r>
</w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");
        assert_eq!(doc.paragraphs[0].style.runs.len(), 1);
        let run_style = &doc.paragraphs[0].style.runs[0].style;
        assert_eq!(run_style.bold, Some(true));
        assert_eq!(run_style.italic, Some(true));
        assert_eq!(doc.paragraphs[0].style.runs[0].text, "Bold Italic");
    }

    #[test]
    fn test_run_font_size_and_name() {
        let xml = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p>
  <w:r>
    <w:rPr>
      <w:sz w:val="24"/>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
    </w:rPr>
    <w:t xml:space="preserve">Styled Text</w:t>
  </w:r>
</w:p>
</w:body>
</w:document>"#.to_string();
        let doc = DocxParser::parse_document(&xml).expect("Failed to parse");
        assert_eq!(doc.paragraphs[0].style.runs.len(), 1);
        let run_style = &doc.paragraphs[0].style.runs[0].style;
        assert_eq!(run_style.font_size, Some("24".to_string()));
        assert_eq!(run_style.font_name, Some("Calibri".to_string()));
        assert_eq!(doc.paragraphs[0].style.runs[0].text, "Styled Text");
    }
}
