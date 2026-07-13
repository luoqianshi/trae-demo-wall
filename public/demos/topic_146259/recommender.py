import vector_store
import graphrag_service


def _mistake_by_id(mistakes, mid):
    for m in mistakes:
        if m['id'] == mid:
            return m
    return None


def manual_recommend(mistakes, student_id, knowledge, reason, difficulty, count):
    """手动选择推荐：至少填知识或错因之一；按 createdAt 升序返回"""
    if not knowledge and not reason:
        return {'success': False, 'error': '请至少选择知识点或错因之一'}

    if not vector_store.is_available():
        # 降级：直接在内存数据中过滤
        filtered = [m for m in mistakes if m.get('studentId') == student_id]
        if knowledge:
            filtered = [m for m in filtered if m.get('knowledge') == knowledge]
        if reason:
            filtered = [m for m in filtered if m.get('reason') == reason]
        if difficulty:
            filtered = [m for m in filtered if m.get('difficulty') == difficulty]
        filtered.sort(key=lambda x: x.get('createdAt', '') or '9999-12-31')
        return {'success': True, 'mode': 'manual', 'graphragUsed': False, 'questions': filtered[:count]}

    ids = vector_store.query_by_filters(student_id, knowledge, reason, difficulty)
    id_set = set(ids)
    filtered = [m for m in mistakes if m['id'] in id_set and m.get('studentId') == student_id]
    filtered.sort(key=lambda x: x.get('createdAt', '') or '9999-12-31')
    return {'success': True, 'mode': 'manual', 'graphragUsed': False, 'questions': filtered[:count]}


def auto_recommend(mistakes, student_id, count):
    """自动推荐：选最远错题作为种子题，使用 GraphRAG + 向量数据库找 1-2 道相似题"""
    pool = [m for m in mistakes if m.get('studentId') == student_id]
    pool.sort(key=lambda x: x.get('createdAt', '') or '9999-12-31')

    results = []
    used = set()
    graphrag_used = False
    vector_used = False
    debug_log = []

    while len(results) < count and len(used) < len(pool):
        # 选择最久未复习（createdAt 最早）的错题作为种子题
        seed = None
        for m in pool:
            if m['id'] not in used:
                seed = m
                break
        if not seed:
            break

        seed_copy = dict(seed)
        seed_copy['recommendType'] = 'seed'
        results.append(seed_copy)
        used.add(seed['id'])

        need = min(2, count - len(results))
        if need <= 0:
            break

        seed_doc = (
            f"错题ID: {seed['id']}\n"
            f"题目: {seed.get('title', '')}\n"
            f"OCR文本: {seed.get('ocrText', '')}\n"
            f"知识点: {seed.get('knowledge', '')}\n"
            f"错因: {seed.get('reason', '')}"
        )

        similar_ids = []
        graphrag_available = graphrag_service.is_available()

        print(f'[recommender] 种子题 ID={seed["id"]}, 题目={seed.get("title", "")[:40]}')
        print(f'[recommender] 需要找 {need} 道相似题，已用 ID={used}')

        # 优先使用 GraphRAG 找相似题
        if graphrag_available:
            print('[recommender] 尝试使用 GraphRAG 找相似题...')
            similar_ids = graphrag_service.find_similar(seed_doc, used, n=need)
            if similar_ids:
                graphrag_used = True
                print(f'[recommender] GraphRAG 返回相似题 IDs: {similar_ids}')
            else:
                print('[recommender] GraphRAG 未返回结果，将回退到 ChromaDB')

        vector_debug = None
        # GraphRAG 不可用时，使用 ChromaDB 向量相似度
        if not similar_ids and vector_store.is_available():
            print('[recommender] 使用 ChromaDB 向量相似度找相似题...')
            similar_ids, vector_debug = vector_store.query_similar(seed_doc, student_id, used, n=need)
            if similar_ids:
                vector_used = True
                print(f'[recommender] ChromaDB 返回相似题 IDs: {similar_ids}')

        step_similar = []
        for sid in similar_ids:
            if len(results) >= count:
                break
            m = _mistake_by_id(pool, sid)
            if m and m['id'] not in used:
                m_copy = dict(m)
                m_copy['recommendType'] = 'similar'
                results.append(m_copy)
                used.add(m['id'])
                step_similar.append(m['id'])

        debug_log.append({
            'seedId': seed['id'],
            'seedTitle': seed.get('title', '')[:60],
            'seedDoc': seed_doc,
            'need': need,
            'graphragAvailable': graphrag_available,
            'graphragUsed': len(similar_ids) > 0 and graphrag_available,
            'vectorUsed': vector_used,
            'vectorDebug': vector_debug,
            'similarIds': step_similar
        })

    return {
        'success': True,
        'mode': 'auto',
        'graphragUsed': graphrag_used,
        'vectorUsed': vector_used,
        'debug': debug_log,
        'questions': results
    }
