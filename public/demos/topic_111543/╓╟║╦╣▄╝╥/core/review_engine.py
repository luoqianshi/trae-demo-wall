"""审核编排器 - 串联整个审核流程"""
import uuid
import datetime
from typing import Dict, List, Optional
from core.knowledge_base import KnowledgeBase
from core.document_parser import DocumentParser
from core.rule_matcher import RuleMatcher
from core.llm_enhancer import LLMEnhancer

class ReviewEngine:
    def __init__(self, kb: KnowledgeBase, parser: DocumentParser, matcher: RuleMatcher):
        self.kb = kb
        self.parser = parser
        self.matcher = matcher
        self.llm = LLMEnhancer()

    def create_session(self, project_name: str, project_domain: str,
                       target_level: str, process_areas: List[str],
                       files: List[Dict], use_llm: bool = False) -> Dict:
        """创建审核会话"""
        level = int(target_level.replace('Level ', '')) if 'Level' in target_level else 1
        session_id = str(uuid.uuid4())

        # 加载所有选中过程域的检查项
        check_items = []
        for pa_id in process_areas:
            items = self.kb.get_check_items(pa_id, level)
            check_items.extend(items)

        session = {
            'session_id': session_id,
            'project_name': project_name,
            'project_domain': project_domain,
            'target_level': target_level,
            'process_areas': process_areas,
            'created_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'status': 'pending',
            'progress': 0,
            'current_file': '-',
            'message': '等待开始',
            'files': files,
            'check_items': check_items,
            'results': [],
            'summary': {'pass': 0, 'pending': 0, 'fail': 0, 'risk': 0},
            'use_llm': use_llm
        }
        return session

    def run_review(self, session: Dict, progress_callback=None) -> Dict:
        """执行审核流程"""
        # 文件解析 + 规则匹配 + (可选) LLM 增强
        total_steps = len(session['files']) + 2 if session.get('use_llm') else len(session['files']) + 1
        current_step = 0

        # 1. 解析文档
        combined_content = ''
        for f in session['files']:
            current_step += 1
            progress = int(current_step / total_steps * 80)
            session['progress'] = progress
            session['current_file'] = f['name']
            session['message'] = f'正在解析 {f["name"]}...'
            if progress_callback:
                progress_callback(session)

            parsed = self.parser.parse_file(f['path'])
            combined_content += f'\n--- {f["name"]} ---\n{parsed.get("content", "")}'

        # 2. 规则匹配
        session['message'] = '正在执行规则匹配...'
        session['current_file'] = '规则引擎'
        if progress_callback:
            progress_callback(session)

        session['results'] = self.matcher.batch_match(session['check_items'], combined_content)

        # 3. LLM 增强 (可选)
        if session.get('use_llm') and self.llm.is_configured():
            current_step += 1
            session['message'] = '正在执行 AI 深度分析...'
            session['current_file'] = 'AI 引擎'
            if progress_callback:
                progress_callback(session)
            progress = int(current_step / total_steps * 100)
            session['progress'] = progress
            session['results'] = self.llm.batch_enhance(session['results'], combined_content)

        # 4. 统计汇总
        session['summary'] = self._calculate_summary(session['results'])

        session['progress'] = 100
        session['status'] = 'completed'
        session['message'] = '审核完成'
        if progress_callback:
            progress_callback(session)

        return session

    def _calculate_summary(self, results: List[Dict]) -> Dict:
        summary = {'pass': 0, 'pending': 0, 'fail': 0, 'risk': 0}
        for r in results:
            if r['result'] == '符合':
                summary['pass'] += 1
            elif r['result'] == '待确认':
                summary['pending'] += 1
            else:
                summary['fail'] += 1
                if r.get('severity') == 'high':
                    summary['risk'] += 1
        return summary

    def get_report(self, session: Dict) -> Dict:
        """生成审核报告数据结构"""
        return {
            'project_name': session['project_name'],
            'process_area': ', '.join(session['process_areas']),
            'target_level': session['target_level'],
            'review_time': session['created_at'],
            'doc_count': len(session['files']),
            'summary': session['summary'],
            'items': session['results']
        }