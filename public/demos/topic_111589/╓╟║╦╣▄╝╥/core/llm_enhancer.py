"""LLM 增强器 - 对模糊项做深度语义分析（支持配置热加载）"""
import json
import os
from typing import Dict, List, Optional

_CONFIG_CACHE = None
_CONFIG_MTIME = 0

def _get_llm_config() -> Dict:
    """读取 LLM 配置（带缓存失效检测）"""
    global _CONFIG_CACHE, _CONFIG_MTIME
    config_file = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads', 'config.json')
    try:
        mtime = os.path.getmtime(config_file)
        if _CONFIG_CACHE is None or mtime > _CONFIG_MTIME:
            with open(config_file, 'r', encoding='utf-8') as f:
                _CONFIG_CACHE = json.load(f)
            _CONFIG_MTIME = mtime
    except (FileNotFoundError, OSError, json.JSONDecodeError):
        _CONFIG_CACHE = {}
    return _CONFIG_CACHE or {}

class LLMEnhancer:
    def is_configured(self) -> bool:
        config = _get_llm_config()
        return bool(config.get('api_key'))

    def enhance(self, item: Dict, document_content: str) -> Optional[str]:
        """对单个检查项进行 LLM 深度分析"""
        if not self.is_configured():
            return None
        if item['result'] == '符合':
            return None

        prompt = self._build_prompt(item, document_content)
        return self._call_llm(prompt)

    def batch_enhance(self, results: List[Dict], document_content: str) -> List[Dict]:
        """批量增强"""
        if not self.is_configured():
            return results

        for item in results:
            if item['result'] == '符合':
                continue
            analysis = self.enhance(item, document_content)
            if analysis and not analysis.startswith('[LLM'):
                item['ai_analysis'] = analysis
                item['rule_based'] = False
        return results

    def _build_prompt(self, item: Dict, document_content: str) -> str:
        """构建提示词"""
        excerpt = document_content[:3000]
        return f"""你是一个ASPICE审核专家。请对以下检查项进行深度分析：

检查项：{item['check_item']}
标准条款：{item['standard_ref']}
当前判定：{item['result']}
规则匹配证据：{item.get('evidence', '')}

文档内容（相关片段）：
{excerpt}

请以以下格式输出：

判定：[符合/待确认/不符合]
缺失内容：[具体缺失了什么]
改进建议：[具体的改进建议，至少2条]
风险等级：[高/中/低]

请用简洁的中文回答。"""

    def _call_llm(self, prompt: str) -> Optional[str]:
        """调用 LLM API"""
        config = _get_llm_config()
        api_url = config.get('api_url', 'https://api.deepseek.com/v1').rstrip('/')
        api_key = config.get('api_key', '')
        model = config.get('model', 'deepseek-chat')
        temperature = float(config.get('temperature', 0.3))

        if not api_key:
            return None

        try:
            import requests
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            payload = {
                'model': model,
                'messages': [
                    {'role': 'system', 'content': '你是一个ASPICE审核专家，精通ASPICE V4.0和ISO 26262标准。请输出结构化分析结果。'},
                    {'role': 'user', 'content': prompt}
                ],
                'temperature': temperature,
                'max_tokens': 800
            }
            # 兼容不同 API 格式
            chat_url = f'{api_url}/chat/completions' if '/chat/completions' not in api_url else f'{api_url}'
            resp = requests.post(chat_url, headers=headers, json=payload, timeout=60)
            if resp.status_code == 200:
                result = resp.json()
                content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
                return content.strip() if content else None
            else:
                error_body = resp.text[:200]
                return f'[LLM调用失败: HTTP {resp.status_code} - {error_body}]'
        except Exception as e:
            return f'[LLM调用异常: {str(e)}]'