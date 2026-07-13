import config

try:
    import chromadb
    from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
    CHROMADB_AVAILABLE = True
except Exception:
    CHROMADB_AVAILABLE = False

_client = None
_collection = None


def _get_client():
    global _client
    if _client is None:
        if not CHROMADB_AVAILABLE:
            raise RuntimeError('ChromaDB 不可用')
        _client = chromadb.PersistentClient(path=str(config.CHROMA_PATH))
    return _client


def _get_collection():
    global _collection
    if _collection is None:
        client = _get_client()
        _collection = client.get_or_create_collection(
            name='mistakes',
            embedding_function=DefaultEmbeddingFunction(),
            metadata={'hnsw:space': 'cosine'}
        )
    return _collection


def _doc_text(mistake):
    return (
        f"错题ID: {mistake['id']}\n"
        f"题目: {mistake.get('title', '')}\n"
        f"OCR文本: {mistake.get('ocrText', '')}\n"
        f"知识点: {mistake.get('knowledge', '')}\n"
        f"错因: {mistake.get('reason', '')}\n"
        f"难度: {mistake.get('difficulty', '')}"
    )


def _metadata(mistake):
    return {
        'id': str(mistake['id']),
        'studentId': mistake.get('studentId', ''),
        'knowledge': mistake.get('knowledge', ''),
        'reason': mistake.get('reason', ''),
        'difficulty': str(mistake.get('difficulty', 0)),
        'createdAt': mistake.get('createdAt', '')
    }


def is_available():
    return CHROMADB_AVAILABLE


def upsert_mistake(mistake):
    try:
        collection = _get_collection()
        collection.upsert(
            ids=[str(mistake['id'])],
            documents=[_doc_text(mistake)],
            metadatas=[_metadata(mistake)]
        )
        return True
    except Exception as e:
        print(f'[vector_store] upsert failed: {e}')
        return False


def delete_mistake(mistake_id):
    try:
        collection = _get_collection()
        collection.delete(ids=[str(mistake_id)])
        return True
    except Exception as e:
        print(f'[vector_store] delete failed: {e}')
        return False


def query_by_filters(student_id, knowledge=None, reason=None, difficulty=0):
    """按 metadata 过滤，返回所有满足条件的 id 列表"""
    try:
        collection = _get_collection()
        conditions = [{'studentId': {'$eq': student_id}}]
        if knowledge:
            conditions.append({'knowledge': {'$eq': knowledge}})
        if reason:
            conditions.append({'reason': {'$eq': reason}})
        if difficulty:
            conditions.append({'difficulty': {'$eq': str(difficulty)}})

        where = conditions[0] if len(conditions) == 1 else {'$and': conditions}
        results = collection.get(where=where, include=['metadatas'])
        ids = []
        for mid, meta in zip(results.get('ids', []), results.get('metadatas', [])):
            if meta:
                ids.append(int(mid))
        return ids
    except Exception as e:
        print(f'[vector_store] filter query failed: {e}')
        return []


def query_similar(text, student_id, exclude_ids=None, n=2):
    """按文本相似度搜索，返回 (id 列表, 调试信息)"""
    exclude_ids = set(str(x) for x in (exclude_ids or []))
    debug = {
        'inputText': text,
        'studentId': student_id,
        'excludeIds': list(exclude_ids),
        'n': n
    }
    try:
        collection = _get_collection()
        where = {'studentId': {'$eq': student_id}}
        n_results = max(n * 3, 10)
        debug['where'] = where
        debug['nResults'] = n_results

        results = collection.query(
            query_texts=[text],
            where=where,
            n_results=n_results,
            include=['metadatas', 'distances']
        )

        raw_ids = results.get('ids', [[]])[0]
        raw_distances = results.get('distances', [[]])[0]
        raw_metadatas = results.get('metadatas', [[]])[0]

        debug['rawResults'] = [
            {
                'id': mid,
                'distance': float(dist) if dist is not None else None,
                'metadata': meta
            }
            for mid, meta, dist in zip(raw_ids, raw_metadatas, raw_distances)
        ]

        ids = []
        for mid, meta in zip(raw_ids, raw_metadatas):
            if mid not in exclude_ids and meta and meta.get('studentId') == student_id:
                ids.append(int(mid))
                if len(ids) >= n:
                    break

        debug['selectedIds'] = ids
        return ids, debug
    except Exception as e:
        print(f'[vector_store] similar query failed: {e}')
        import traceback
        traceback.print_exc()
        debug['error'] = str(e)
        return [], debug


def init_with_mistakes(mistakes):
    """批量初始化：清空集合并重新写入所有错题"""
    try:
        client = _get_client()
        try:
            client.delete_collection('mistakes')
        except Exception:
            pass
        global _collection
        _collection = None
        collection = _get_collection()
        if mistakes:
            collection.upsert(
                ids=[str(m['id']) for m in mistakes],
                documents=[_doc_text(m) for m in mistakes],
                metadatas=[_metadata(m) for m in mistakes]
            )
        return True
    except Exception as e:
        print(f'[vector_store] init failed: {e}')
        return False
