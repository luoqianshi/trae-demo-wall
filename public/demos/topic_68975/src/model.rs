use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub metadata: DocumentMetadata,
    pub paragraphs: Vec<Paragraph>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentMetadata {
    pub paragraph_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Paragraph {
    pub index: usize,
    pub content: String,
    pub style: ParagraphStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParagraphStyle {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alignment: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub indentation: Option<Indentation>,
    pub runs: Vec<Run>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Indentation {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub left: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub right: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_line: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Run {
    pub text: String,
    pub style: RunStyle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunStyle {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bold: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub italic: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub underline: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_name: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json;

    #[test]
    fn test_document_serialization() {
        let run1 = Run {
            text: "Hello, ".to_string(),
            style: RunStyle {
                bold: Some(true),
                italic: None,
                underline: None,
                font_size: Some("24".to_string()),
                font_name: Some("Calibri".to_string()),
            },
        };

        let run2 = Run {
            text: "World!".to_string(),
            style: RunStyle {
                bold: None,
                italic: Some(true),
                underline: Some(false),
                font_size: Some("24".to_string()),
                font_name: Some("Calibri".to_string()),
            },
        };

        let para1 = Paragraph {
            index: 0,
            content: "Hello, World!".to_string(),
            style: ParagraphStyle {
                style_name: Some("Heading1".to_string()),
                alignment: Some("center".to_string()),
                indentation: Some(Indentation {
                    left: Some("720".to_string()),
                    right: None,
                    first_line: Some("360".to_string()),
                }),
                runs: vec![run1, run2],
            },
        };

        let para2 = Paragraph {
            index: 1,
            content: "This is a normal paragraph.".to_string(),
            style: ParagraphStyle {
                style_name: Some("Normal".to_string()),
                alignment: Some("left".to_string()),
                indentation: None,
                runs: vec![Run {
                    text: "This is a normal paragraph.".to_string(),
                    style: RunStyle {
                        bold: None,
                        italic: None,
                        underline: None,
                        font_size: Some("22".to_string()),
                        font_name: Some("Calibri".to_string()),
                    },
                }],
            },
        };

        let doc = Document {
            metadata: DocumentMetadata { paragraph_count: 2 },
            paragraphs: vec![para1, para2],
        };

        let json = serde_json::to_string_pretty(&doc).expect("Failed to serialize");

        assert!(json.contains("\"metadata\""));
        assert!(json.contains("\"paragraph_count\""));
        assert!(json.contains("\"paragraphs\""));
        assert!(json.contains("\"index\""));
        assert!(json.contains("\"content\""));
        assert!(json.contains("\"style\""));
        assert!(json.contains("\"style_name\""));
        assert!(json.contains("\"runs\""));
        assert!(json.contains("\"text\""));
        assert!(json.contains("Hello, World!"));
        assert!(json.contains("This is a normal paragraph."));

        let deserialized: Document = serde_json::from_str(&json).expect("Failed to deserialize");
        assert_eq!(deserialized.metadata.paragraph_count, 2);
        assert_eq!(deserialized.paragraphs.len(), 2);
        assert_eq!(deserialized.paragraphs[0].index, 0);
        assert_eq!(deserialized.paragraphs[1].index, 1);
        assert_eq!(deserialized.paragraphs[0].content, "Hello, World!");
        assert_eq!(deserialized.paragraphs[0].style.runs.len(), 2);
        assert_eq!(
            deserialized.paragraphs[0].style.runs[0].style.bold,
            Some(true)
        );
    }
}
