"""
诊断服务编排层
串联完整的诊断流程：上下文构建 → LLM调用 → 结果解析 → 数据持久化
"""
import time
import logging
from typing import Dict, Any, Optional
from django.conf import settings
from apps.submissions.models import Submission
from .models import DiagnosisRecord
from .llm_client import LLMException, LLMTimeoutException
from .ollama_client import OllamaClient
from .prompt_template import (
    DiagnosisPromptTemplate,
    DiagnosisContextBuilder,
    get_prompt_version,
    get_schema_version
)
from .parser import parse_diagnosis_result
from .fallback_template import get_fallback_diagnosis

logger = logging.getLogger(__name__)


class DiagnosisService:
    """
    诊断服务类
    负责完整的诊断流程编排
    """

    def __init__(self):
        """初始化诊断服务"""
        # 从配置中读取LLM参数
        self.ollama_base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')
        self.ollama_model = getattr(settings, 'OLLAMA_MODEL', 'qwen2.5-coder:7b')
        self.ollama_timeout = getattr(settings, 'OLLAMA_TIMEOUT', 30)

        # 初始化LLM客户端
        self.llm_client = OllamaClient(
            base_url=self.ollama_base_url,
            model=self.ollama_model,
            timeout=self.ollama_timeout,
            max_retries=2
        )

    def diagnose(self, submission_id: int, force_new: bool = False, diagnosis_type: str = 'error') -> DiagnosisRecord:
        """
        执行诊断

        Args:
            submission_id: 提交记录ID
            force_new: 是否强制生成新诊断（忽略缓存）
            diagnosis_type: 诊断类型（error/explain/quality/complete）

        Returns:
            DiagnosisRecord: 诊断记录对象

        Raises:
            ValueError: 提交记录不存在时抛出
        """
        try:
            # 1. 获取提交记录
            try:
                submission = Submission.objects.select_related('problem', 'student').get(id=submission_id)
            except Submission.DoesNotExist:
                raise ValueError(f"Submission {submission_id} not found")

            logger.info(f"Starting diagnosis for submission {submission_id}")

            # 2. 检查缓存（如果不强制生成新诊断）
            if not force_new:
                cached_diagnosis = self._check_cache(submission)
                if cached_diagnosis:
                    logger.info(f"Cache hit for submission {submission_id}")
                    return cached_diagnosis

            # 3. 创建初始诊断记录
            diagnosis_record = DiagnosisRecord.objects.create(
                submission=submission,
                problem=submission.problem,
                student=submission.student,
                code_hash=DiagnosisRecord.generate_code_hash(
                    submission.code_text,
                    submission.error_type or ''
                ),
                error_type=submission.error_type or '',
                status='processing',
                source='llm',
                provider='ollama',
                model_name=self.ollama_model,
                prompt_version=get_prompt_version(),
                schema_version=get_schema_version(),
                diagnosis_text='',  # 初始为空
            )

            # 4. 构建诊断上下文
            try:
                context = DiagnosisContextBuilder.build_context(submission)
            except Exception as e:
                logger.error(f"Failed to build context: {str(e)}")
                return self._handle_failure(diagnosis_record, f"Context build failed: {str(e)}")

            # 5. 尝试LLM诊断
            try:
                diagnosis_data = self._diagnose_with_llm(context, diagnosis_type)
                diagnosis_record = self._save_success_diagnosis(diagnosis_record, diagnosis_data)
                logger.info(f"LLM diagnosis success for submission {submission_id}")
                return diagnosis_record

            except (LLMException, LLMTimeoutException) as e:
                # LLM失败，降级到模板
                logger.warning(f"LLM diagnosis failed, falling back to template: {str(e)}")
                return self._fallback_to_template(diagnosis_record, submission, str(e))

            except Exception as e:
                # 其他异常
                logger.error(f"Unexpected error during diagnosis: {str(e)}", exc_info=True)
                return self._handle_failure(diagnosis_record, f"Unexpected error: {str(e)}")

        except Exception as e:
            logger.error(f"Diagnosis failed for submission {submission_id}: {str(e)}", exc_info=True)
            raise

    def _check_cache(self, submission: Submission) -> Optional[DiagnosisRecord]:
        """检查诊断缓存"""
        code_hash = DiagnosisRecord.generate_code_hash(
            submission.code_text,
            submission.error_type or ''
        )

        cached = DiagnosisRecord.find_cached_diagnosis(code_hash, submission.error_type or '')

        if cached and cached.status == 'success':
            # 创建新的诊断记录（复用缓存内容）
            new_diagnosis = DiagnosisRecord.objects.create(
                submission=submission,
                problem=submission.problem,
                student=submission.student,
                code_hash=code_hash,
                error_type=submission.error_type or '',
                status='success',
                source='cache',
                provider=cached.provider,
                model_name=cached.model_name,
                prompt_version=cached.prompt_version,
                schema_version=cached.schema_version,
                diagnosis_text=cached.diagnosis_text,
                diagnosis_payload=cached.diagnosis_payload,
                latency_ms=0,
            )
            return new_diagnosis

        return None

    def _diagnose_with_llm(self, context: Dict[str, Any], diagnosis_type: str = 'error') -> Dict[str, Any]:
        """使用LLM进行诊断"""
        # 构建Prompt
        system_prompt = DiagnosisPromptTemplate.get_system_prompt(diagnosis_type)
        user_prompt = DiagnosisPromptTemplate.build_user_prompt(context, diagnosis_type)

        # 调用LLM
        response = self.llm_client.generate(
            prompt=user_prompt,
            system_prompt=system_prompt,
            temperature=0.7,
            max_tokens=1000
        )

        # 解析结果
        diagnosis_data = parse_diagnosis_result(response.text)
        diagnosis_data['_latency_ms'] = response.latency_ms
        diagnosis_data['_model'] = response.model

        return diagnosis_data

    def _save_success_diagnosis(self, diagnosis_record: DiagnosisRecord,
                                diagnosis_data: Dict[str, Any]) -> DiagnosisRecord:
        """保存成功的诊断结果"""
        latency_ms = diagnosis_data.pop('_latency_ms', 0)
        model = diagnosis_data.pop('_model', None)

        diagnosis_text = self._format_diagnosis_text(diagnosis_data)

        diagnosis_record.status = 'success'
        diagnosis_record.diagnosis_text = diagnosis_text
        diagnosis_record.diagnosis_data = diagnosis_data
        diagnosis_record.latency_ms = latency_ms
        if model:
            diagnosis_record.model_name = model
        diagnosis_record.save()

        return diagnosis_record

    def _fallback_to_template(self, diagnosis_record: DiagnosisRecord,
                              submission: Submission, error_msg: str) -> DiagnosisRecord:
        """降级到模板诊断"""
        diagnosis_data = get_fallback_diagnosis(
            error_type=submission.error_type,
            error_message=submission.error_trace,
            code=submission.code_text
        )

        diagnosis_text = self._format_diagnosis_text(diagnosis_data)

        diagnosis_record.status = 'fallback'
        diagnosis_record.source = 'template'
        diagnosis_record.provider = None
        diagnosis_record.model_name = None
        diagnosis_record.diagnosis_text = diagnosis_text
        diagnosis_record.diagnosis_data = diagnosis_data
        diagnosis_record.error_message = error_msg
        diagnosis_record.latency_ms = 0
        diagnosis_record.save()

        return diagnosis_record

    def _handle_failure(self, diagnosis_record: DiagnosisRecord, error_msg: str) -> DiagnosisRecord:
        """处理诊断失败"""
        diagnosis_record.status = 'failed'
        diagnosis_record.error_message = error_msg
        diagnosis_record.diagnosis_text = "诊断服务暂时不可用，请稍后重试"
        diagnosis_record.save()

        return diagnosis_record

    def _format_diagnosis_text(self, diagnosis_data: Dict[str, Any]) -> str:
        """
        格式化诊断数据为文本
        支持4种诊断类型：error, explain, quality, complete
        """
        lines = []

        # 检测诊断类型并格式化
        if 'errors' in diagnosis_data:
            # 错误诊断类型
            lines.append("【错误诊断】")

            if diagnosis_data.get('errors'):
                lines.append("\n【发现的错误】")
                for idx, error in enumerate(diagnosis_data['errors'], 1):
                    lines.append(f"\n{idx}. 第{error.get('line', '?')}行 - {error.get('type', '未知错误')}")
                    lines.append(f"   问题：{error.get('message', '无描述')}")
                    if error.get('hint'):
                        lines.append(f"   提示：{error.get('hint')}")

            if diagnosis_data.get('warnings'):
                lines.append("\n【警告】")
                for idx, warning in enumerate(diagnosis_data['warnings'], 1):
                    lines.append(f"{idx}. 第{warning.get('line', '?')}行：{warning.get('message', '无描述')}")
                    if warning.get('suggestion'):
                        lines.append(f"   建议：{warning.get('suggestion')}")

            if diagnosis_data.get('suggestions'):
                lines.append("\n【改进建议】")
                for idx, suggestion in enumerate(diagnosis_data['suggestions'], 1):
                    lines.append(f"{idx}. {suggestion}")

            if diagnosis_data.get('explanation'):
                lines.append(f"\n【总结】\n{diagnosis_data['explanation']}")

        elif 'overall_function' in diagnosis_data:
            # 代码解释类型
            lines.append("【代码解释】")

            if diagnosis_data.get('overall_function'):
                lines.append(f"\n【整体功能】\n{diagnosis_data['overall_function']}")

            if diagnosis_data.get('step_by_step'):
                lines.append("\n【执行流程】")
                for step in diagnosis_data['step_by_step']:
                    lines.append(f"• {step}")

            if diagnosis_data.get('key_logic'):
                lines.append(f"\n【关键逻辑】\n{diagnosis_data['key_logic']}")

            if diagnosis_data.get('important_variables'):
                lines.append("\n【重要变量】")
                for var_name, description in diagnosis_data['important_variables'].items():
                    lines.append(f"• {var_name}: {description}")

            if diagnosis_data.get('analogy'):
                lines.append(f"\n【类比说明】\n{diagnosis_data['analogy']}")

            if diagnosis_data.get('knowledge_points'):
                lines.append(f"\n【涉及知识点】\n{', '.join(diagnosis_data['knowledge_points'])}")

        elif 'total_score' in diagnosis_data:
            # 质量评估类型
            lines.append("【代码质量评估】")

            lines.append(f"\n【总分】{diagnosis_data.get('total_score', 0)}/100")

            if diagnosis_data.get('readability'):
                r = diagnosis_data['readability']
                lines.append(f"\n【可读性】{r.get('score', 0)}/40")
                lines.append(f"{r.get('comment', '无评价')}")

            if diagnosis_data.get('maintainability'):
                m = diagnosis_data['maintainability']
                lines.append(f"\n【可维护性】{m.get('score', 0)}/30")
                lines.append(f"{m.get('comment', '无评价')}")

            if diagnosis_data.get('performance'):
                p = diagnosis_data['performance']
                lines.append(f"\n【性能】{p.get('score', 0)}/20")
                lines.append(f"{p.get('comment', '无评价')}")

            if diagnosis_data.get('style'):
                s = diagnosis_data['style']
                lines.append(f"\n【规范性】{s.get('score', 0)}/10")
                lines.append(f"{s.get('comment', '无评价')}")

            if diagnosis_data.get('strengths'):
                lines.append("\n【优点】")
                for idx, strength in enumerate(diagnosis_data['strengths'], 1):
                    lines.append(f"{idx}. {strength}")

            if diagnosis_data.get('issues'):
                lines.append("\n【存在问题】")
                for idx, issue in enumerate(diagnosis_data['issues'], 1):
                    lines.append(f"{idx}. {issue}")

            if diagnosis_data.get('suggestions'):
                lines.append("\n【改进建议】")
                for idx, suggestion in enumerate(diagnosis_data['suggestions'], 1):
                    lines.append(f"{idx}. {suggestion}")

        elif 'missing_parts' in diagnosis_data:
            # 代码补全类型
            lines.append("【代码补全建议】")

            if diagnosis_data.get('missing_parts'):
                lines.append("\n【缺失部分】")
                for idx, part in enumerate(diagnosis_data['missing_parts'], 1):
                    if isinstance(part, dict):
                        lines.append(f"\n{idx}. {part.get('type', '未知类型')}")
                        lines.append(f"   位置：{part.get('location', '未指定')}")
                        lines.append(f"   描述：{part.get('description', '无描述')}")
                        lines.append(f"   影响：{part.get('impact', '无说明')}")
                    else:
                        lines.append(f"{idx}. {part}")

            if diagnosis_data.get('completion_hints'):
                lines.append("\n【补全提示】")
                for hint in diagnosis_data['completion_hints']:
                    if isinstance(hint, dict):
                        lines.append(f"\n步骤{hint.get('step', '?')}：{hint.get('hint', '无提示')}")
                        if hint.get('example_structure'):
                            lines.append(f"示例：{hint.get('example_structure')}")
                    else:
                        lines.append(f"• {hint}")

            if diagnosis_data.get('suggested_structure'):
                lines.append(f"\n【建议结构】\n{diagnosis_data['suggested_structure']}")

            if diagnosis_data.get('knowledge_points'):
                lines.append(f"\n【需要掌握】\n{', '.join(diagnosis_data['knowledge_points'])}")

            if diagnosis_data.get('next_step'):
                lines.append(f"\n【下一步】\n{diagnosis_data['next_step']}")

        else:
            # 旧版本格式兼容
            if diagnosis_data.get('error_type'):
                lines.append(f"【错误类型】{diagnosis_data['error_type']}")

            if diagnosis_data.get('root_cause'):
                lines.append(f"\n【错误原因】\n{diagnosis_data['root_cause']}")

            if diagnosis_data.get('error_location'):
                lines.append(f"\n【错误位置】\n{diagnosis_data['error_location']}")

            if diagnosis_data.get('fix_suggestions'):
                lines.append("\n【修改建议】")
                for idx, suggestion in enumerate(diagnosis_data['fix_suggestions'], 1):
                    lines.append(f"{idx}. {suggestion}")

            if diagnosis_data.get('knowledge_points'):
                lines.append(f"\n【涉及知识点】\n{', '.join(diagnosis_data['knowledge_points'])}")

            if diagnosis_data.get('next_step'):
                lines.append(f"\n【下一步】\n{diagnosis_data['next_step']}")

        return '\n'.join(lines)

    def check_llm_health(self) -> bool:
        """检查LLM服务健康状态"""
        return self.llm_client.check_health()


# 全局服务实例
_diagnosis_service = None


def get_diagnosis_service() -> DiagnosisService:
    """获取诊断服务单例"""
    global _diagnosis_service
    if _diagnosis_service is None:
        _diagnosis_service = DiagnosisService()
    return _diagnosis_service
