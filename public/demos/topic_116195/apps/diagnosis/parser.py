"""
LLM输出解析器和Schema校验器
负责从LLM输出中提取JSON并验证结构
"""
import json
import re
from typing import Dict, Any, Optional, List, Tuple
import logging

logger = logging.getLogger(__name__)


class DiagnosisSchema:
    """
    诊断输出Schema定义
    定义诊断结果的标准结构，支持多种诊断类型
    """

    # 错误诊断类型的必需字段
    ERROR_REQUIRED_FIELDS = ["errors", "explanation"]

    # 代码解释类型的必需字段
    EXPLAIN_REQUIRED_FIELDS = ["overall_function", "step_by_step"]

    # 质量评估类型的必需字段
    QUALITY_REQUIRED_FIELDS = ["total_score", "readability", "maintainability"]

    # 代码补全类型的必需字段
    COMPLETE_REQUIRED_FIELDS = ["missing_parts", "completion_hints"]

    # 旧版本兼容：必需字段
    LEGACY_REQUIRED_FIELDS = [
        "error_type",
        "root_cause",
        "fix_suggestions",
    ]

    # 可选字段
    OPTIONAL_FIELDS = [
        "error_location",
        "knowledge_points",
        "next_step",
        "confidence",
        "warnings",
        "suggestions",
    ]

    @classmethod
    def validate(cls, data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        验证诊断数据是否符合Schema

        支持4种诊断类型：error, explain, quality, complete
        以及旧版本格式的兼容

        Args:
            data: 待验证的数据

        Returns:
            (is_valid, error_message): 是否有效，错误信息
        """
        # 检测诊断类型并验证对应字段
        if "errors" in data:
            # 错误诊断类型
            for field in cls.ERROR_REQUIRED_FIELDS:
                if field not in data:
                    return False, f"Missing required field for error diagnosis: {field}"
            return True, None

        elif "overall_function" in data:
            # 代码解释类型
            for field in cls.EXPLAIN_REQUIRED_FIELDS:
                if field not in data:
                    return False, f"Missing required field for explain diagnosis: {field}"
            return True, None

        elif "total_score" in data:
            # 质量评估类型
            for field in cls.QUALITY_REQUIRED_FIELDS:
                if field not in data:
                    return False, f"Missing required field for quality diagnosis: {field}"
            return True, None

        elif "missing_parts" in data:
            # 代码补全类型
            for field in cls.COMPLETE_REQUIRED_FIELDS:
                if field not in data:
                    return False, f"Missing required field for complete diagnosis: {field}"
            return True, None

        else:
            # 无法识别的类型：仅在明确是旧版本格式时做严格校验
            # 有些模型会返回半结构化结果（例如只包含root_cause），此处放宽处理
            if "error_type" in data:
                for field in cls.LEGACY_REQUIRED_FIELDS:
                    if field not in data:
                        return False, f"Missing required field: {field}"

                # 检查fix_suggestions是否为空
                if not data.get("fix_suggestions"):
                    return False, "fix_suggestions cannot be empty"
            else:
                logger.warning(f"Unknown diagnosis format, accepting as-is. Keys: {list(data.keys())}")

        # 检查confidence范围（如果存在）
        if "confidence" in data:
            confidence = data["confidence"]
            if not isinstance(confidence, (int, float)):
                return False, f"confidence must be a number, got {type(confidence)}"
            if not (0 <= confidence <= 1):
                return False, f"confidence must be between 0 and 1, got {confidence}"

        return True, None

    @classmethod
    def fill_defaults(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        填充默认值

        Args:
            data: 原始数据

        Returns:
            Dict: 填充默认值后的数据
        """
        result = data.copy()

        # 添加confidence默认值（如果不存在）
        if "confidence" not in result:
            result["confidence"] = 0.8

        return result


class DiagnosisParser:
    """
    诊断结果解析器
    从LLM输出中提取并解析JSON格式的诊断结果
    """

    @staticmethod
    def parse(llm_output: str) -> Dict[str, Any]:
        """
        解析LLM输出

        Args:
            llm_output: LLM的原始输出文本

        Returns:
            Dict: 解析后的诊断数据

        Raises:
            ValueError: 解析失败时抛出
        """
        try:
            # 尝试多种解析策略
            json_data = None

            # 策略1: 直接解析（假设输出就是纯JSON）
            try:
                json_data = json.loads(llm_output)
                logger.info("Parsed JSON using strategy 1: direct parse")
            except json.JSONDecodeError:
                pass

            # 策略2: 提取代码块中的JSON（```json ... ```）
            if json_data is None:
                json_data = DiagnosisParser._extract_from_code_block(llm_output)
                if json_data:
                    logger.info("Parsed JSON using strategy 2: code block extraction")

            # 策略3: 使用正则提取JSON对象（{...}）
            if json_data is None:
                json_data = DiagnosisParser._extract_json_object(llm_output)
                if json_data:
                    logger.info("Parsed JSON using strategy 3: regex extraction")

            # 如果所有策略都失败
            if json_data is None:
                raise ValueError("Failed to extract JSON from LLM output")

            # 验证Schema
            is_valid, error_msg = DiagnosisSchema.validate(json_data)
            if not is_valid:
                logger.warning(f"Schema validation failed: {error_msg}")
                # 尝试修复
                json_data = DiagnosisParser._try_fix_schema(json_data)
                # 再次验证
                is_valid, error_msg = DiagnosisSchema.validate(json_data)
                if not is_valid:
                    raise ValueError(f"Schema validation failed: {error_msg}")

            # 填充默认值
            json_data = DiagnosisSchema.fill_defaults(json_data)

            logger.info("Successfully parsed and validated diagnosis result")
            return json_data

        except Exception as e:
            logger.error(f"Failed to parse LLM output: {str(e)}")
            raise ValueError(f"Failed to parse diagnosis result: {str(e)}")

    @staticmethod
    def _extract_from_code_block(text: str) -> Optional[Dict[str, Any]]:
        """
        从代码块中提取JSON

        Args:
            text: 原始文本

        Returns:
            Optional[Dict]: 提取的JSON数据，失败返回None
        """
        # 匹配 ```json ... ``` 或 ``` ... ```
        patterns = [
            r'```json\s*\n(.*?)\n```',
            r'```\s*\n(.*?)\n```',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                json_str = match.group(1).strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue

        return None

    @staticmethod
    def _extract_json_object(text: str) -> Optional[Dict[str, Any]]:
        """
        使用正则提取JSON对象

        Args:
            text: 原始文本

        Returns:
            Optional[Dict]: 提取的JSON数据，失败返回None
        """
        # 查找第一个完整的JSON对象 {...}
        start_idx = text.find('{')
        if start_idx == -1:
            return None

        # 使用栈匹配括号
        stack = []
        for i in range(start_idx, len(text)):
            char = text[i]
            if char == '{':
                stack.append(char)
            elif char == '}':
                stack.pop()
                if not stack:
                    # 找到完整的JSON对象
                    json_str = text[start_idx:i+1]
                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        return None

        return None

    @staticmethod
    def _try_fix_schema(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        尝试修复不符合Schema的数据

        Args:
            data: 原始数据

        Returns:
            Dict: 修复后的数据
        """
        fixed_data = data.copy()

        # 旧版本格式修复
        if "fix_suggestions" in fixed_data and isinstance(fixed_data["fix_suggestions"], str):
            fixed_data["fix_suggestions"] = [fixed_data["fix_suggestions"]]

        if "knowledge_points" in fixed_data and isinstance(fixed_data["knowledge_points"], str):
            fixed_data["knowledge_points"] = [fixed_data["knowledge_points"]]

        if "confidence" in fixed_data and isinstance(fixed_data["confidence"], str):
            try:
                fixed_data["confidence"] = float(fixed_data["confidence"])
            except ValueError:
                fixed_data["confidence"] = 0.8

        # 确保旧版本必需字段存在
        if "error_type" in fixed_data and "root_cause" not in fixed_data:
            fixed_data["root_cause"] = "无法确定错误原因"
        if "error_type" in fixed_data and ("fix_suggestions" not in fixed_data or not fixed_data["fix_suggestions"]):
            fixed_data["fix_suggestions"] = ["请检查代码逻辑"]

        return fixed_data


def parse_diagnosis_result(llm_output: str) -> Dict[str, Any]:
    """
    解析诊断结果的便捷函数

    Args:
        llm_output: LLM输出文本

    Returns:
        Dict: 解析后的诊断数据

    Raises:
        ValueError: 解析失败时抛出
    """
    return DiagnosisParser.parse(llm_output)
