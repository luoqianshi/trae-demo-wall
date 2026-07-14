use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaConfig {
    pub model: String,
    pub base_url: String,
    pub timeout_ms: u64,
    pub max_retries: usize,
    pub temperature: f32,
    pub top_p: f32,
    pub max_tokens: usize,
}

impl Default for OllamaConfig {
    fn default() -> Self {
        OllamaConfig {
            model: env::var("TRAE_GEO_AI_MODEL").unwrap_or_else(|_| "qwen".to_string()),
            base_url: env::var("TRAE_GEO_AI_BASE_URL").unwrap_or_else(|_| "http://localhost:11434".to_string()),
            timeout_ms: env::var("TRAE_GEO_AI_TIMEOUT_MS").unwrap_or_else(|_| "60000".to_string()).parse().unwrap_or(60000),
            max_retries: env::var("TRAE_GEO_AI_MAX_RETRIES").unwrap_or_else(|_| "3".to_string()).parse().unwrap_or(3),
            temperature: env::var("TRAE_GEO_AI_TEMPERATURE").unwrap_or_else(|_| "0.1".to_string()).parse().unwrap_or(0.1),
            top_p: env::var("TRAE_GEO_AI_TOP_P").unwrap_or_else(|_| "0.9".to_string()).parse().unwrap_or(0.9),
            max_tokens: env::var("TRAE_GEO_AI_MAX_TOKENS").unwrap_or_else(|_| "2000".to_string()).parse().unwrap_or(2000),
        }
    }
}

impl OllamaConfig {
    pub fn new(model: &str) -> Self {
        OllamaConfig {
            model: model.to_string(),
            ..Default::default()
        }
    }

    pub fn with_base_url(model: &str, base_url: &str) -> Self {
        OllamaConfig {
            model: model.to_string(),
            base_url: base_url.to_string(),
            ..Default::default()
        }
    }
}