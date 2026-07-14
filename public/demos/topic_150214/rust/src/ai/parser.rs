use crate::ai::errors::{ParseError, ValidationError};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelingInstruction {
    pub operations: Vec<ModelingOperation>,
    pub units: String,
    #[serde(default = "default_version")]
    pub version: String,
}

fn default_version() -> String {
    "1.0".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum ModelingOperation {
    #[serde(rename = "create_primitive")]
    CreatePrimitive {
        primitive_type: String,
        params: PrimitiveParams,
    },
    #[serde(rename = "transform")]
    Transform {
        target: String,
        params: TransformParams,
    },
    #[serde(rename = "boolean")]
    Boolean {
        operation: String,
        target: String,
        tool: String,
    },
    #[serde(rename = "fillet")]
    Fillet {
        target: String,
        edges: Vec<String>,
        radius: f64,
    },
    #[serde(rename = "chamfer")]
    Chamfer {
        target: String,
        edges: Vec<String>,
        distance: f64,
    },
    #[serde(rename = "hole")]
    Hole {
        target: String,
        params: HoleParams,
    },
    #[serde(rename = "extrude")]
    Extrude {
        sketch: String,
        height: f64,
        #[serde(default = "default_direction")]
        direction: Vec<f64>,
    },
    #[serde(rename = "revolve")]
    Revolve {
        sketch: String,
        angle: f64,
        #[serde(default = "default_axis")]
        axis: Vec<f64>,
        #[serde(default = "default_origin")]
        origin: Vec<f64>,
    },
    #[serde(rename = "shell")]
    Shell {
        target: String,
        thickness: f64,
        #[serde(default = "default_remove_faces")]
        remove_faces: Vec<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrimitiveParams {
    pub name: String,
    pub dimensions: Vec<f64>,
    #[serde(default = "default_position")]
    pub position: Vec<f64>,
    #[serde(default = "default_rotation")]
    pub rotation: Vec<f64>,
    #[serde(default = "default_scale")]
    pub scale: Vec<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformParams {
    #[serde(default = "default_position")]
    pub translate: Vec<f64>,
    #[serde(default = "default_rotation")]
    pub rotate: Vec<f64>,
    #[serde(default = "default_scale")]
    pub scale: Vec<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HoleParams {
    pub position: Vec<f64>,
    #[serde(default = "default_direction")]
    pub direction: Vec<f64>,
    pub diameter: f64,
    #[serde(default = "default_depth")]
    pub depth: f64,
}

fn default_position() -> Vec<f64> {
    vec![0.0, 0.0, 0.0]
}

fn default_rotation() -> Vec<f64> {
    vec![0.0, 0.0, 0.0]
}

fn default_scale() -> Vec<f64> {
    vec![1.0, 1.0, 1.0]
}

fn default_direction() -> Vec<f64> {
    vec![0.0, 0.0, 1.0]
}

fn default_axis() -> Vec<f64> {
    vec![0.0, 1.0, 0.0]
}

fn default_origin() -> Vec<f64> {
    vec![0.0, 0.0, 0.0]
}

fn default_depth() -> f64 {
    0.0
}

fn default_remove_faces() -> Vec<String> {
    Vec::new()
}

pub struct InstructionParser;

impl InstructionParser {
    pub fn parse(json_str: &str) -> Result<ModelingInstruction, ParseError> {
        let value: Value = serde_json::from_str(json_str)
            .map_err(|e| ParseError::JsonSyntaxError(e.to_string()))?;

        let obj = value.as_object()
            .ok_or_else(|| ParseError::JsonSyntaxError("根元素必须是对象".to_string()))?;

        let operations = obj.get("operations")
            .ok_or_else(|| ParseError::MissingField("operations".to_string()))?
            .as_array()
            .ok_or_else(|| ParseError::TypeError("operations 必须是数组".to_string()))?;

        let units = obj.get("units")
            .ok_or_else(|| ParseError::MissingField("units".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("units 必须是字符串".to_string()))?
            .to_string();

        let version = obj.get("version")
            .and_then(|v| v.as_str())
            .unwrap_or("1.0")
            .to_string();

        let mut parsed_ops = Vec::new();
        
        for op in operations {
            parsed_ops.push(Self::parse_operation(op)?);
        }

        Ok(ModelingInstruction {
            operations: parsed_ops,
            units,
            version,
        })
    }

    fn parse_operation(value: &Value) -> Result<ModelingOperation, ParseError> {
        let obj = value.as_object()
            .ok_or_else(|| ParseError::TypeError("操作必须是对象".to_string()))?;

        let op_type = obj.get("type")
            .ok_or_else(|| ParseError::MissingField("type".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("type 必须是字符串".to_string()))?;

        match op_type {
            "create_primitive" => Self::parse_create_primitive(obj),
            "transform" => Self::parse_transform(obj),
            "boolean" => Self::parse_boolean(obj),
            "fillet" => Self::parse_fillet(obj),
            "chamfer" => Self::parse_chamfer(obj),
            "hole" => Self::parse_hole(obj),
            "extrude" => Self::parse_extrude(obj),
            "revolve" => Self::parse_revolve(obj),
            "shell" => Self::parse_shell(obj),
            _ => Err(ParseError::UnknownOperationType(op_type.to_string())),
        }
    }

    fn parse_create_primitive(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let primitive_type = obj.get("primitive_type")
            .ok_or_else(|| ParseError::MissingField("primitive_type".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("primitive_type 必须是字符串".to_string()))?
            .to_string();

        let params_value = obj.get("params")
            .ok_or_else(|| ParseError::MissingField("params".to_string()))?;

        let params: PrimitiveParams = serde_json::from_value(params_value.clone())
            .map_err(|e| ParseError::TypeError(format!("params 解析失败: {}", e)))?;

        Ok(ModelingOperation::CreatePrimitive { primitive_type, params })
    }

    fn parse_transform(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let target = obj.get("target")
            .ok_or_else(|| ParseError::MissingField("target".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("target 必须是字符串".to_string()))?
            .to_string();

        let params_value = obj.get("params")
            .ok_or_else(|| ParseError::MissingField("params".to_string()))?;

        let params: TransformParams = serde_json::from_value(params_value.clone())
            .map_err(|e| ParseError::TypeError(format!("params 解析失败: {}", e)))?;

        Ok(ModelingOperation::Transform { target, params })
    }

    fn parse_boolean(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let operation = obj.get("operation")
            .ok_or_else(|| ParseError::MissingField("operation".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("operation 必须是字符串".to_string()))?
            .to_string();

        let target = obj.get("target")
            .ok_or_else(|| ParseError::MissingField("target".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("target 必须是字符串".to_string()))?
            .to_string();

        let tool = obj.get("tool")
            .ok_or_else(|| ParseError::MissingField("tool".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("tool 必须是字符串".to_string()))?
            .to_string();

        Ok(ModelingOperation::Boolean { operation, target, tool })
    }

    fn parse_fillet(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let target = obj.get("target")
            .ok_or_else(|| ParseError::MissingField("target".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("target 必须是字符串".to_string()))?
            .to_string();

        let edges = obj.get("edges")
            .ok_or_else(|| ParseError::MissingField("edges".to_string()))?
            .as_array()
            .ok_or_else(|| ParseError::TypeError("edges 必须是数组".to_string()))?
            .iter()
            .map(|e| e.as_str().ok_or_else(|| ParseError::TypeError("edge 必须是字符串".to_string())).map(|s| s.to_string()))
            .collect::<Result<Vec<String>, ParseError>>()?;

        let radius = obj.get("radius")
            .ok_or_else(|| ParseError::MissingField("radius".to_string()))?
            .as_f64()
            .ok_or_else(|| ParseError::TypeError("radius 必须是数字".to_string()))?;

        Ok(ModelingOperation::Fillet { target, edges, radius })
    }

    fn parse_chamfer(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let target = obj.get("target")
            .ok_or_else(|| ParseError::MissingField("target".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("target 必须是字符串".to_string()))?
            .to_string();

        let edges = obj.get("edges")
            .ok_or_else(|| ParseError::MissingField("edges".to_string()))?
            .as_array()
            .ok_or_else(|| ParseError::TypeError("edges 必须是数组".to_string()))?
            .iter()
            .map(|e| e.as_str().ok_or_else(|| ParseError::TypeError("edge 必须是字符串".to_string())).map(|s| s.to_string()))
            .collect::<Result<Vec<String>, ParseError>>()?;

        let distance = obj.get("distance")
            .ok_or_else(|| ParseError::MissingField("distance".to_string()))?
            .as_f64()
            .ok_or_else(|| ParseError::TypeError("distance 必须是数字".to_string()))?;

        Ok(ModelingOperation::Chamfer { target, edges, distance })
    }

    fn parse_hole(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let target = obj.get("target")
            .ok_or_else(|| ParseError::MissingField("target".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("target 必须是字符串".to_string()))?
            .to_string();

        let params_value = obj.get("params")
            .ok_or_else(|| ParseError::MissingField("params".to_string()))?;

        let params: HoleParams = serde_json::from_value(params_value.clone())
            .map_err(|e| ParseError::TypeError(format!("params 解析失败: {}", e)))?;

        Ok(ModelingOperation::Hole { target, params })
    }

    fn parse_extrude(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let sketch = obj.get("sketch")
            .ok_or_else(|| ParseError::MissingField("sketch".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("sketch 必须是字符串".to_string()))?
            .to_string();

        let height = obj.get("height")
            .ok_or_else(|| ParseError::MissingField("height".to_string()))?
            .as_f64()
            .ok_or_else(|| ParseError::TypeError("height 必须是数字".to_string()))?;

        let direction = obj.get("direction")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|e| e.as_f64()).collect())
            .unwrap_or_else(default_direction);

        Ok(ModelingOperation::Extrude { sketch, height, direction })
    }

    fn parse_revolve(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let sketch = obj.get("sketch")
            .ok_or_else(|| ParseError::MissingField("sketch".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("sketch 必须是字符串".to_string()))?
            .to_string();

        let angle = obj.get("angle")
            .ok_or_else(|| ParseError::MissingField("angle".to_string()))?
            .as_f64()
            .ok_or_else(|| ParseError::TypeError("angle 必须是数字".to_string()))?;

        let axis = obj.get("axis")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|e| e.as_f64()).collect())
            .unwrap_or_else(default_axis);

        let origin = obj.get("origin")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|e| e.as_f64()).collect())
            .unwrap_or_else(default_origin);

        Ok(ModelingOperation::Revolve { sketch, angle, axis, origin })
    }

    fn parse_shell(obj: &serde_json::Map<String, Value>) -> Result<ModelingOperation, ParseError> {
        let target = obj.get("target")
            .ok_or_else(|| ParseError::MissingField("target".to_string()))?
            .as_str()
            .ok_or_else(|| ParseError::TypeError("target 必须是字符串".to_string()))?
            .to_string();

        let thickness = obj.get("thickness")
            .ok_or_else(|| ParseError::MissingField("thickness".to_string()))?
            .as_f64()
            .ok_or_else(|| ParseError::TypeError("thickness 必须是数字".to_string()))?;

        let remove_faces = obj.get("remove_faces")
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter().filter_map(|e| e.as_str()).map(|s| s.to_string()).collect())
            .unwrap_or_else(default_remove_faces);

        Ok(ModelingOperation::Shell { target, thickness, remove_faces })
    }

    pub fn validate(instruction: &ModelingInstruction) -> Result<(), ValidationError> {
        let valid_units = ["mm", "cm", "m", "inch", "ft"];
        if !valid_units.contains(&instruction.units.as_str()) {
            return Err(ValidationError::ParamValidationFailed(format!("无效单位: {}", instruction.units)));
        }

        for (i, op) in instruction.operations.iter().enumerate() {
            Self::validate_operation(op, i)?;
        }

        Ok(())
    }

    fn validate_operation(op: &ModelingOperation, index: usize) -> Result<(), ValidationError> {
        match op {
            ModelingOperation::CreatePrimitive { primitive_type, params } => {
                let valid_types = ["box", "sphere", "cylinder", "cone", "tetrahedron", "octahedron"];
                if !valid_types.contains(&primitive_type.as_str()) {
                    return Err(ValidationError::ParamValidationFailed(
                        format!("操作 {}: 无效基本体类型: {}", index, primitive_type)
                    ));
                }

                if params.dimensions.is_empty() || params.dimensions.len() > 3 {
                    return Err(ValidationError::ArrayLengthError(
                        format!("操作 {}: dimensions 长度必须为1-3", index)
                    ));
                }

                for (j, dim) in params.dimensions.iter().enumerate() {
                    if *dim <= 0.0 {
                        return Err(ValidationError::RangeError(
                            format!("操作 {}: dimensions[{}] 必须大于0", index, j)
                        ));
                    }
                }

                if params.position.len() != 3 {
                    return Err(ValidationError::ArrayLengthError(
                        format!("操作 {}: position 长度必须为3", index)
                    ));
                }

                if params.scale.len() != 3 {
                    return Err(ValidationError::ArrayLengthError(
                        format!("操作 {}: scale 长度必须为3", index)
                    ));
                }
            },
            ModelingOperation::Boolean { operation, .. } => {
                let valid_ops = ["union", "difference", "intersection"];
                if !valid_ops.contains(&operation.as_str()) {
                    return Err(ValidationError::ParamValidationFailed(
                        format!("操作 {}: 无效布尔操作: {}", index, operation)
                    ));
                }
            },
            ModelingOperation::Fillet { radius, .. } => {
                if *radius <= 0.0 {
                    return Err(ValidationError::RangeError(
                        format!("操作 {}: radius 必须大于0", index)
                    ));
                }
            },
            ModelingOperation::Chamfer { distance, .. } => {
                if *distance <= 0.0 {
                    return Err(ValidationError::RangeError(
                        format!("操作 {}: distance 必须大于0", index)
                    ));
                }
            },
            ModelingOperation::Hole { params, .. } => {
                if params.diameter <= 0.0 {
                    return Err(ValidationError::RangeError(
                        format!("操作 {}: diameter 必须大于0", index)
                    ));
                }
                if params.position.len() != 3 {
                    return Err(ValidationError::ArrayLengthError(
                        format!("操作 {}: position 长度必须为3", index)
                    ));
                }
            },
            ModelingOperation::Shell { thickness, .. } => {
                if *thickness <= 0.0 {
                    return Err(ValidationError::RangeError(
                        format!("操作 {}: thickness 必须大于0", index)
                    ));
                }
            },
            _ => {},
        }

        Ok(())
    }
}