use thiserror::Error;

#[derive(Error, Debug, Clone)]
pub enum OllamaError {
    #[error("网络错误: {0}")]
    NetworkError(String),

    #[error("请求超时")]
    Timeout,

    #[error("重试次数耗尽")]
    RetryExhausted,

    #[error("响应无效: {0}")]
    InvalidResponse(String),

    #[error("服务器错误: {0} - {1}")]
    ServerError(u16, String),

    #[error("模型未找到: {0}")]
    ModelNotFound(String),

    #[error("JSON 解析失败: {0}")]
    JsonParseError(String),

    #[error("IO 错误: {0}")]
    IoError(String),
}

#[derive(Error, Debug, Clone)]
pub enum ParseError {
    #[error("JSON 语法错误: {0}")]
    JsonSyntaxError(String),

    #[error("缺少必需字段: {0}")]
    MissingField(String),

    #[error("字段类型错误: {0}")]
    TypeError(String),

    #[error("未知操作类型: {0}")]
    UnknownOperationType(String),

    #[error("未知基本体类型: {0}")]
    UnknownPrimitiveType(String),

    #[error("未知布尔操作: {0}")]
    UnknownBooleanOp(String),
}

#[derive(Error, Debug, Clone)]
pub enum ValidationError {
    #[error("数值范围错误: {0}")]
    RangeError(String),

    #[error("数组长度错误: {0}")]
    ArrayLengthError(String),

    #[error("目标对象不存在: {0}")]
    TargetNotFound(String),

    #[error("参数验证失败: {0}")]
    ParamValidationFailed(String),
}

#[derive(Error, Debug, Clone)]
pub enum OrchestratorError {
    #[error("Ollama 错误: {0}")]
    Ollama(#[from] OllamaError),

    #[error("解析错误: {0}")]
    Parse(#[from] ParseError),

    #[error("验证错误: {0}")]
    Validation(#[from] ValidationError),

    #[error("引擎执行错误: {0}")]
    Engine(String),

    #[error("配置错误: {0}")]
    Config(String),
}