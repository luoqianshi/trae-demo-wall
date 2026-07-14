use crate::ai::config::OllamaConfig;
use crate::ai::errors::OllamaError;
use reqwest::{Client, Error as ReqwestError, Response};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize)]
struct GenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
    options: Options,
    system: String,
}

#[derive(Debug, Serialize)]
struct Options {
    temperature: f32,
    top_p: f32,
    max_tokens: usize,
}

#[derive(Debug, Deserialize)]
struct GenerateResponse {
    model: String,
    response: String,
    done: bool,
    #[allow(dead_code)]
    context: Option<Vec<u64>>,
}

pub struct OllamaClient {
    client: Client,
    config: OllamaConfig,
}

impl OllamaClient {
    pub fn new(model: &str) -> Self {
        OllamaClient::with_config(OllamaConfig::new(model))
    }

    pub fn with_config(config: OllamaConfig) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_millis(config.timeout_ms))
            .build()
            .expect("Failed to create HTTP client");
        
        OllamaClient { client, config }
    }

    pub async fn generate(&self, prompt: &str) -> Result<String, OllamaError> {
        let system_prompt = Self::get_system_prompt();
        let request = GenerateRequest {
            model: self.config.model.clone(),
            prompt: prompt.to_string(),
            stream: false,
            options: Options {
                temperature: self.config.temperature,
                top_p: self.config.top_p,
                max_tokens: self.config.max_tokens,
            },
            system: system_prompt,
        };

        let url = format!("{}/api/generate", self.config.base_url);
        
        for attempt in 0..self.config.max_retries {
            match self.client.post(&url).json(&request).send().await {
                Ok(response) => {
                    match self.handle_response(response).await {
                        Ok(result) => return Ok(result),
                        Err(OllamaError::Timeout) if attempt < self.config.max_retries - 1 => {
                            continue;
                        }
                        Err(e) => return Err(e),
                    }
                }
                Err(e) => {
                    if attempt < self.config.max_retries - 1 {
                        continue;
                    }
                    return Err(self.map_reqwest_error(e));
                }
            }
        }
        
        Err(OllamaError::RetryExhausted)
    }

    pub async fn generate_streaming<F>(&self, prompt: &str, mut callback: F) -> Result<(), OllamaError>
        where F: FnMut(&str) -> bool
    {
        let system_prompt = Self::get_system_prompt();
        let request = GenerateRequest {
            model: self.config.model.clone(),
            prompt: prompt.to_string(),
            stream: true,
            options: Options {
                temperature: self.config.temperature,
                top_p: self.config.top_p,
                max_tokens: self.config.max_tokens,
            },
            system: system_prompt,
        };

        let url = format!("{}/api/generate", self.config.base_url);
        
        let response = self.client.post(&url).json(&request).send().await
            .map_err(|e| self.map_reqwest_error(e))?;

        let mut stream = response.bytes_stream();
        
        while let Some(chunk) = stream.next().await {
            let bytes = chunk.map_err(|e| OllamaError::NetworkError(e.to_string()))?;
            let text = String::from_utf8_lossy(&bytes);
            
            for line in text.lines() {
                if line.is_empty() {
                    continue;
                }
                
                match serde_json::from_str::<GenerateResponse>(line) {
                    Ok(parsed) => {
                        if !callback(&parsed.response) {
                            return Ok(());
                        }
                        if parsed.done {
                            return Ok(());
                        }
                    }
                    Err(e) => {
                        return Err(OllamaError::JsonParseError(e.to_string()));
                    }
                }
            }
        }
        
        Ok(())
    }

    pub fn set_model(&mut self, model: &str) {
        self.config.model = model.to_string();
    }

    pub async fn health_check(&self) -> Result<bool, OllamaError> {
        let url = format!("{}/api/models", self.config.base_url);
        
        match self.client.get(&url).send().await {
            Ok(response) => Ok(response.status().is_success()),
            Err(e) => Err(self.map_reqwest_error(e)),
        }
    }

    async fn handle_response(&self, response: Response) -> Result<String, OllamaError> {
        if !response.status().is_success() {
            let status = response.status().as_u16();
            let text = response.text().await.unwrap_or_default();
            
            if status == 404 {
                return Err(OllamaError::ModelNotFound(self.config.model.clone()));
            }
            
            return Err(OllamaError::ServerError(status, text));
        }

        let body = response.text().await
            .map_err(|e| OllamaError::IoError(e.to_string()))?;

        match serde_json::from_str::<GenerateResponse>(&body) {
            Ok(parsed) => Ok(parsed.response),
            Err(e) => Err(OllamaError::JsonParseError(e.to_string())),
        }
    }

    fn map_reqwest_error(&self, e: ReqwestError) -> OllamaError {
        if e.is_timeout() {
            OllamaError::Timeout
        } else if e.is_connect() {
            OllamaError::NetworkError("无法连接到 Ollama 服务".to_string())
        } else {
            OllamaError::NetworkError(e.to_string())
        }
    }

    fn get_system_prompt() -> String {
        include_str!("prompt_system.txt").to_string()
    }
}