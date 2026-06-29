import { useState, useEffect, useMemo } from 'react';
import { getFormulas, deleteFormula, FormulaItem } from '../services/api';
import './MyLibraryPage.css';

function MyLibraryPage() {
  const [formulas, setFormulas] = useState<FormulaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const loadFormulas = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page: 1, page_size: 50 };
      if (search) params.search = search;
      if (selectedTag) params.tag = selectedTag;
      const data = await getFormulas(params);
      setFormulas(data);
    } catch (err: any) {
      setError(err.message || '加载失败');
      setFormulas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFormulas();
  }, [search, selectedTag]);

  // 按文档来源分组
  const groupedFormulas = useMemo(() => {
    const groups: Record<string, FormulaItem[]> = {};
    for (const f of formulas) {
      const key = f.source_paper_title || '未分类';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    return groups;
  }, [formulas]);

  const docNames = Object.keys(groupedFormulas);

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定删除此公式？')) return;
    try {
      await deleteFormula(id);
      setFormulas((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setError(err.message || '删除失败');
    }
  };

  const allTags = Array.from(
    new Set(formulas.flatMap((f) => f.tags))
  );

  const renderFormulaCard = (formula: FormulaItem) => (
    <div key={formula.id} className="formula-item">
      <div className="formula-preview">
        <pre><code>{formula.latex_code}</code></pre>
      </div>
      <div className="formula-meta">
        {formula.tags.length > 0 && (
          <div className="formula-tags">
            {formula.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="formula-date">
          {new Date(formula.created_at).toLocaleDateString('zh-CN')}
        </div>
      </div>
      <div className="formula-actions">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigator.clipboard.writeText(formula.latex_code)}
        >
          复制
        </button>
        <button
          className="btn btn-secondary btn-sm btn-danger"
          onClick={() => handleDelete(formula.id)}
        >
          删除
        </button>
      </div>
    </div>
  );

  return (
    <div className="library-page">
      <div className="container">
        <div className="library-header">
          <h1 className="page-title">我的公式库</h1>
          <span className="formula-count">{formulas.length} 个公式 · {docNames.length} 个文档</span>
        </div>

        <div className="library-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="搜索公式、论文标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {allTags.length > 0 && (
            <div className="tag-filters">
              <button
                className={`tag-btn ${!selectedTag ? 'active' : ''}`}
                onClick={() => setSelectedTag(null)}
              >
                全部
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-btn ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="error-banner">{error}</div>
        )}

        {loading ? (
          <div className="loading-indicator">
            <div className="spinner" />
            <p>加载中...</p>
          </div>
        ) : formulas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>暂无公式</h3>
            <p>上传公式图片开始识别，或保存识别结果到公式库</p>
          </div>
        ) : (
          <div className="doc-groups">
            {docNames.map((docName) => {
              const items = groupedFormulas[docName];
              const isCollapsed = collapsedGroups.has(docName);
              return (
                <div key={docName} className="doc-group">
                  <div
                    className="doc-group-header"
                    onClick={() => toggleGroup(docName)}
                  >
                    <div className="doc-group-title-row">
                      <span className={`doc-group-icon ${isCollapsed ? 'collapsed' : ''}`}>▶</span>
                      <span className="doc-group-name">{docName}</span>
                      <span className="doc-group-count">{items.length} 个公式</span>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div className="doc-group-content">
                      {items.map(renderFormulaCard)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyLibraryPage;