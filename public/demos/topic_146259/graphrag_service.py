import re
import subprocess

import config


def is_available():
    return config.GRAPHRAG_ENABLED


def _ensure_dirs():
    config.GRAPHRAG_ROOT.mkdir(parents=True, exist_ok=True)
    (config.GRAPHRAG_ROOT / 'input').mkdir(exist_ok=True)


def _settings_path():
    return config.GRAPHRAG_ROOT / 'settings.yaml'


def _env_path():
    return config.GRAPHRAG_ROOT / '.env'


def ensure_project():
    """生成 GraphRAG 工程文件；无 OpenAI Key 时不生成"""
    if not is_available():
        return False
    _ensure_dirs()

    settings_content = f"""
encoding_model: cl100k_base
skip_workflows: []
llm:
  api_key: ${{GRAPHRAG_API_KEY}}
  type: openai_chat
  model: gpt-4o-mini
  model_supports_json: true
  api_base: https://api.openai.com/v1
  tokens_per_minute: 50_000
  requests_per_minute: 1_000
  thread_count: 50
  async_mode: threaded
  concurrent_requests: 25

embeddings:
  async_mode: threaded
  vector_store:
    type: lancedb
  llm:
    api_key: ${{GRAPHRAG_API_KEY}}
    type: openai_embedding
    model: text-embedding-3-small
    api_base: https://api.openai.com/v1
    tokens_per_minute: 350_000
    requests_per_minute: 2_000
    thread_count: 50
    concurrent_requests: 25

chunks:
  size: 300
  overlap: 100
  group_by_columns: [id]

input:
  type: file
  file_type: text
  base_dir: \"{config.GRAPHRAG_ROOT / 'input'}\"
  file_encoding: utf-8
  file_pattern: \".*\\.txt$\"

cache:
  type: file
  base_dir: \"{config.GRAPHRAG_ROOT / 'cache'}\"

storage:
  type: lancedb
  connection_string: \"{config.GRAPHRAG_ROOT / 'output' / 'lancedb'}\"

reporting:
  type: file
  base_dir: \"{config.GRAPHRAG_ROOT / 'output' / 'reports'}\"

entity_extraction:
  prompt: \"prompts/entity_extraction.txt\"
  entity_types: [错题, 知识点, 错因, 题目]
  max_gleanings: 0

summarize_descriptions:
  prompt: \"prompts/summarize_descriptions.txt\"
  max_length: 500

claim_extraction:
  enabled: false

community_reports:
  prompt: \"prompts/community_report.txt\"
  max_length: 2000
  max_input_length: 8000

cluster_graph:
  max_cluster_size: 10

embed_graph:
  enabled: false

umap:
  enabled: false

snapshots:
  graphml: false
  raw_entities: false
  top_level_nodes: false

search:
  max_results: 10
  llm:
    api_key: ${{GRAPHRAG_API_KEY}}
    type: openai_chat
    model: gpt-4o-mini
    api_base: https://api.openai.com/v1
    tokens_per_minute: 50_000
    requests_per_minute: 1_000
    thread_count: 50
    async_mode: threaded
    concurrent_requests: 25
"""
    with open(_settings_path(), 'w', encoding='utf-8') as f:
        f.write(settings_content.strip())

    with open(_env_path(), 'w', encoding='utf-8') as f:
        f.write(f'GRAPHRAG_API_KEY={config.OPENAI_API_KEY}\n')

    return True


def export_mistakes(mistakes):
    """将错题导出为 GraphRAG 输入文本"""
    _ensure_dirs()
    lines = []
    for m in mistakes:
        lines.append(f"--- 错题ID: {m['id']} ---")
        lines.append(f"题目：{m.get('title', '')}")
        lines.append(f"OCR文本：{m.get('ocrText', '')}")
        lines.append(f"知识点：{m.get('knowledge', '')}")
        lines.append(f"错因：{m.get('reason', '')}")
        lines.append(f"难度：{m.get('difficulty', '')}")
        lines.append('')
    input_file = config.GRAPHRAG_ROOT / 'input' / 'mistakes.txt'
    with open(input_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    return str(input_file)


def index():
    """重建 GraphRAG 索引"""
    if not is_available():
        return {'success': False, 'error': '未配置 OPENAI_API_KEY，无法使用 GraphRAG'}
    ensure_project()
    try:
        result = subprocess.run(
            ['graphrag', 'index', '--root', str(config.GRAPHRAG_ROOT)],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            print(f'[graphrag_service] index stderr: {result.stderr}')
            return {'success': False, 'error': result.stderr or '索引失败'}
        return {'success': True, 'output': result.stdout}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def find_similar(seed_text, exclude_ids=None, n=2):
    """调用 GraphRAG 查询与 seed_text 相似的错题，返回 id 列表"""
    if not is_available():
        return []
    ensure_project()
    exclude_ids = set(str(x) for x in (exclude_ids or []))
    query = (
        f"请推荐与以下错题最相似的 {n} 道题目，只返回错题ID列表（用逗号分隔），不要其他解释。\n\n"
        f"{seed_text}"
    )
    try:
        result = subprocess.run(
            ['graphrag', 'query', '--root', str(config.GRAPHRAG_ROOT), '--method', 'local', '--query', query],
            capture_output=True, text=True, timeout=120
        )
        output = result.stdout + result.stderr
        ids = []
        # 尝试从输出中提取数字ID
        for token in re.findall(r'\d+', output):
            if token not in exclude_ids:
                ids.append(int(token))
        return ids[:n]
    except Exception as e:
        print(f'[graphrag_service] find_similar failed: {e}')
        return []
