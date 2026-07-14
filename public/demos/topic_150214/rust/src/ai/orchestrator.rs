use crate::ai::client::OllamaClient;
use crate::ai::errors::OrchestratorError;
use crate::ai::parser::{InstructionParser, ModelingInstruction};
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

pub type Handle = u64;

pub struct GeoEngineHandle {
    entities: HashMap<String, Handle>,
    next_handle: Handle,
}

impl GeoEngineHandle {
    pub fn new() -> Self {
        GeoEngineHandle {
            entities: HashMap::new(),
            next_handle: 1,
        }
    }

    pub fn create_primitive(&mut self, name: &str) -> Handle {
        let handle = self.next_handle;
        self.next_handle += 1;
        self.entities.insert(name.to_string(), handle);
        handle
    }

    pub fn get_handle(&self, name: &str) -> Option<Handle> {
        self.entities.get(name).copied()
    }
}

pub struct AiOrchestrator {
    client: OllamaClient,
    engine: Arc<Mutex<GeoEngineHandle>>,
    history: Arc<Mutex<Vec<ConversationEntry>>>,
}

pub struct ConversationEntry {
    pub user_input: String,
    pub llm_response: String,
    pub instruction: ModelingInstruction,
    pub result_handle: Handle,
    pub timestamp: DateTime<Utc>,
}

impl AiOrchestrator {
    pub fn new(model: &str) -> Result<Self, OrchestratorError> {
        Ok(AiOrchestrator {
            client: OllamaClient::new(model),
            engine: Arc::new(Mutex::new(GeoEngineHandle::new())),
            history: Arc::new(Mutex::new(Vec::new())),
        })
    }

    pub fn with_client(client: OllamaClient) -> Self {
        AiOrchestrator {
            client,
            engine: Arc::new(Mutex::new(GeoEngineHandle::new())),
            history: Arc::new(Mutex::new(Vec::new())),
        }
    }

    pub async fn generate_model(&self, user_input: &str) -> Result<Handle, OrchestratorError> {
        let llm_response = self.client.generate(user_input).await
            .map_err(OrchestratorError::Ollama)?;

        let instruction = InstructionParser::parse(&llm_response)
            .map_err(OrchestratorError::Parse)?;

        InstructionParser::validate(&instruction)
            .map_err(OrchestratorError::Validation)?;

        let handle = self.execute_instruction(&instruction)
            .map_err(OrchestratorError::Engine)?;

        let entry = ConversationEntry {
            user_input: user_input.to_string(),
            llm_response,
            instruction: instruction.clone(),
            result_handle: handle,
            timestamp: Utc::now(),
        };

        self.history.lock().unwrap().push(entry);

        Ok(handle)
    }

    pub async fn generate_model_streaming<F>(&self, user_input: &str, callback: F) -> Result<Handle, OrchestratorError>
        where F: FnMut(&str) -> bool
    {
        self.client.generate_streaming(user_input, callback).await
            .map_err(OrchestratorError::Ollama)?;

        Ok(0)
    }

    fn execute_instruction(&self, instruction: &ModelingInstruction) -> Result<Handle, String> {
        let mut engine = self.engine.lock().unwrap();
        let mut last_handle: Handle = 0;

        for op in &instruction.operations {
            match op {
                crate::ai::parser::ModelingOperation::CreatePrimitive { primitive_type, params } => {
                    let name = &params.name;
                    last_handle = engine.create_primitive(name);
                },
                crate::ai::parser::ModelingOperation::Transform { target, .. } => {
                    if engine.get_handle(target).is_none() {
                        return Err(format!("目标对象不存在: {}", target));
                    }
                },
                crate::ai::parser::ModelingOperation::Boolean { target, tool, .. } => {
                    if engine.get_handle(target).is_none() {
                        return Err(format!("目标对象不存在: {}", target));
                    }
                    if engine.get_handle(tool).is_none() {
                        return Err(format!("工具对象不存在: {}", tool));
                    }
                },
                crate::ai::parser::ModelingOperation::Fillet { target, .. } => {
                    if engine.get_handle(target).is_none() {
                        return Err(format!("目标对象不存在: {}", target));
                    }
                },
                crate::ai::parser::ModelingOperation::Chamfer { target, .. } => {
                    if engine.get_handle(target).is_none() {
                        return Err(format!("目标对象不存在: {}", target));
                    }
                },
                crate::ai::parser::ModelingOperation::Hole { target, .. } => {
                    if engine.get_handle(target).is_none() {
                        return Err(format!("目标对象不存在: {}", target));
                    }
                },
                crate::ai::parser::ModelingOperation::Shell { target, .. } => {
                    if engine.get_handle(target).is_none() {
                        return Err(format!("目标对象不存在: {}", target));
                    }
                },
                _ => {},
            }
        }

        Ok(last_handle)
    }

    pub fn get_history(&self) -> Vec<ConversationEntry> {
        self.history.lock().unwrap().clone()
    }

    pub async fn health_check(&self) -> Result<bool, OrchestratorError> {
        self.client.health_check().await
            .map_err(OrchestratorError::Ollama)
    }

    pub fn set_model(&mut self, model: &str) {
        self.client.set_model(model);
    }
}