"""规则匹配器 - 基于关键词匹配的检查项判定（含改进建议）"""
from typing import List, Dict

class RuleMatcher:
    """基于关键词匹配的规则引擎，纯本地运行，无需网络"""

    def match(self, check_item: Dict, document_content: str) -> Dict:
        """对单个检查项执行规则匹配"""
        key_elements = check_item.get('key_elements', [])
        if not key_elements:
            return self._make_result(check_item, '符合', [], [], 1.0)

        matched = []
        missing = []
        content_lower = document_content.lower()

        for kw in key_elements:
            if kw.lower() in content_lower:
                matched.append(kw)
            else:
                missing.append(kw)

        total = len(key_elements)
        match_count = len(matched)
        ratio = match_count / total if total > 0 else 0

        if ratio >= 1.0:
            result = '符合'
            confidence = 1.0
        elif ratio >= 0.3:  # 放宽阈值：只要匹配30%以上就算"待确认"
            result = '待确认'
            confidence = round(ratio, 2)
        elif match_count > 0:  # 只要匹配了至少1个关键词，也归为"待确认"
            result = '待确认'
            confidence = round(ratio, 2)
        else:
            result = '不符合'
            confidence = 0.0

        return self._make_result(check_item, result, matched, missing, confidence)

    def _make_result(self, item: Dict, result: str, matched: List[str],
                     missing: List[str], confidence: float) -> Dict:
        suggestion = self._build_suggestion(item.get('check_item', ''), result, matched, missing)
        return {
            'id': item.get('id', ''),
            'check_item': item.get('check_item', ''),
            'standard_ref': item.get('standard_ref', ''),
            'severity': item.get('severity', 'medium'),
            'result': result,
            'confidence': confidence,
            'matched_keywords': matched,
            'missing_keywords': missing,
            'evidence': self._build_evidence(matched, missing),
            'suggestion': suggestion,
            'rule_based': True,
            'ai_analysis': None
        }

    def _build_evidence(self, matched: List[str], missing: List[str]) -> str:
        parts = []
        if matched:
            parts.append(f'已覆盖: {", ".join(matched)}')
        if missing:
            parts.append(f'未覆盖: {", ".join(missing)}')
        return '; '.join(parts) if parts else '未检测到相关要素'

    def _build_suggestion(self, check_item: str, result: str,
                          matched: List[str], missing: List[str]) -> str:
        """根据匹配结果生成改进建议"""
        if result == '符合':
            return '检查项已满足要求，无需改进。'
        if not missing:
            return '部分要素已覆盖，建议补充缺失内容以确保完整性。'

        suggestions = []
        for kw in missing:
            suggestions.append(f'建议补充"{kw}"相关内容')

        if result == '不符合':
            suggestions.append(f'当前文档未覆盖"{check_item}"相关要素，请参考标准要求补充必要内容。')

        return '; '.join(suggestions[:5])

    def batch_match(self, check_items: List[Dict], document_content: str) -> List[Dict]:
        """批量匹配多个检查项"""
        return [self.match(item, document_content) for item in check_items]