"""知识库引擎 - 加载、查询检查项"""
import json
import os
from typing import List, Dict, Optional

_KNOWLEDGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'knowledge')

class KnowledgeBase:
    def __init__(self, knowledge_dir: str = _KNOWLEDGE_DIR):
        self._knowledge_dir = knowledge_dir
        self._index: Optional[Dict] = None
        self._cache: Dict[str, Dict] = {}
        self._index_mtime: float = 0
        self._cache_mtime: Dict[str, float] = {}

    def _get_mtime(self, filepath: str) -> float:
        try:
            return os.path.getmtime(filepath)
        except OSError:
            return 0

    def _load_index(self) -> Dict:
        index_path = os.path.join(self._knowledge_dir, 'index.json')
        current_mtime = self._get_mtime(index_path)
        if self._index is None or current_mtime > self._index_mtime:
            with open(index_path, 'r', encoding='utf-8') as f:
                self._index = json.load(f)
            self._index_mtime = current_mtime
        return self._index

    def get_process_areas(self) -> List[Dict]:
        return self._load_index().get('process_areas', [])

    def load_process_area(self, pa_id: str) -> Optional[Dict]:
        filepath = os.path.join(self._knowledge_dir, f'{pa_id}.json')
        if not os.path.exists(filepath):
            return None
        current_mtime = self._get_mtime(filepath)
        if pa_id not in self._cache or current_mtime > self._cache_mtime.get(pa_id, 0):
            with open(filepath, 'r', encoding='utf-8') as f:
                self._cache[pa_id] = json.load(f)
            self._cache_mtime[pa_id] = current_mtime
        return self._cache[pa_id]

    def get_check_items(self, pa_id: str, target_level: int = 1) -> List[Dict]:
        data = self.load_process_area(pa_id)
        if not data:
            return []
        items = data.get('check_items', [])
        return [item for item in items if target_level in item.get('applicable_levels', [1])]

    def get_all_process_areas_data(self) -> Dict[str, Dict]:
        index = self._load_index()
        result = {}
        for pa in index['process_areas']:
            data = self.load_process_area(pa['id'])
            if data:
                result[pa['id']] = data
        return result