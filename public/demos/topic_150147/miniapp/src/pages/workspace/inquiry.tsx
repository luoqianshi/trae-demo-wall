import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { View, Text, Textarea, Input, Picker } from '@tarojs/components';
import { pblAPI } from '../../services/api';
import './index.css';

const phaseLabels: Record<string, string> = {
  inquiry: '启动探究', research: '深入调研', creation: '创作实践',
  revision: '反馈修订', showcase: '成果展示',
};

export default function Inquiry() {
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('kwl');
  const [kwl, setKwl] = useState<any>({});
  const [currentPhase, setCurrentPhase] = useState('inquiry');
  const [kwlForm, setKwlForm] = useState({ k: '', w: '', l: '' });
  const [ntkQuestions, setNtkQuestions] = useState<any[]>([]);
  const [ntkForm, setNtkForm] = useState({ question: '', category: 'general' });
  const [showNtkForm, setShowNtkForm] = useState(false);
  const [researchNotes, setResearchNotes] = useState<any[]>([]);
  const [noteForm, setNoteForm] = useState({ title: '', content: '', resource_type: 'article' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params;
    const wid = params?.workspaceId ? Number(params.workspaceId) : null;
    const cid = params?.campId ? Number(params.campId) : null;
    if (wid) setWorkspaceId(wid);
    if (cid) loadWorkspacePhase(cid);
    if (cid) loadNTK(cid);
    if (cid) loadResearchNotes(cid);
  }, []);

  const loadWorkspacePhase = async (cid: number) => {
    try {
      const res: any = await pblAPI.getWorkspace(cid);
      if (res.code === 0) {
        const ws = res.data.workspace || res.data;
        setCurrentPhase(ws.current_phase || 'inquiry');
        setWorkspaceId(ws.id);
        loadKWL(ws.id);
      }
    } catch { /* ignore */ }
  };

  const loadKWL = async (wid: number) => {
    try {
      const res: any = await pblAPI.getKWL(wid);
      if (res.code === 0) {
        const map: any = {};
        (res.data || []).forEach((e: any) => { map[e.phase] = e; });
        setKwl(map);
        const current = map[currentPhase] || {};
        setKwlForm({ k: current.k_column || '', w: current.w_column || '', l: current.l_column || '' });
      }
    } catch { /* ignore */ }
  };

  const loadNTK = async (cid: number) => {
    try {
      const res: any = await pblAPI.getWorkspace(cid);
      if (res.code === 0) {
        const ws = res.data.workspace || res.data;
        const ntkRes: any = await pblAPI.getNTK(ws.id);
        if (ntkRes.code === 0) setNtkQuestions(ntkRes.data || []);
      }
    } catch { /* ignore */ }
  };

  const loadResearchNotes = async (cid: number) => {
    setLoading(true);
    try {
      const res: any = await pblAPI.getWorkspace(cid);
      if (res.code === 0) {
        const ws = res.data.workspace || res.data;
        const notesRes: any = await pblAPI.getResearchNotes(ws.id);
        if (notesRes.code === 0) setResearchNotes(notesRes.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleKwlSave = async () => {
    if (!workspaceId) return;
    try {
      await pblAPI.saveKWL(workspaceId, { phase: currentPhase, ...kwlForm });
      Taro.showToast({ title: '已保存', icon: 'success' });
      loadKWL(workspaceId);
    } catch { Taro.showToast({ title: '保存失败', icon: 'none' }); }
  };

  const handleNtkSubmit = async () => {
    if (!workspaceId || !ntkForm.question.trim()) {
      Taro.showToast({ title: '请输入问题', icon: 'none' });
      return;
    }
    try {
      await pblAPI.createNTK(workspaceId, ntkForm);
      Taro.showToast({ title: '问题已添加', icon: 'success' });
      setNtkForm({ question: '', category: 'general' });
      setShowNtkForm(false);
      loadNTK(workspaceId);
    } catch { Taro.showToast({ title: '添加失败', icon: 'none' }); }
  };

  const handleNoteSubmit = async () => {
    if (!workspaceId || !noteForm.title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    try {
      await pblAPI.createResearchNote(workspaceId, noteForm);
      Taro.showToast({ title: '笔记已添加', icon: 'success' });
      setNoteForm({ title: '', content: '', resource_type: 'article' });
      setShowNoteForm(false);
      loadResearchNotes(workspaceId);
    } catch { Taro.showToast({ title: '添加失败', icon: 'none' }); }
  };

  const resourceTypeLabels: Record<string, string> = {
    article: '文章', video: '视频', interview: '访谈', data: '数据', book: '书籍', website: '网站', other: '其他',
  };

  return (
    <View className="container">
      <Text className="page-title">探究板</Text>

      {/* 标签切换 */}
      <View className="tabs">
        <View className={`tab ${activeTab === 'kwl' ? 'active' : ''}`} onClick={() => setActiveTab('kwl')}>
          <Text>KWL表</Text>
        </View>
        <View className={`tab ${activeTab === 'ntk' ? 'active' : ''}`} onClick={() => setActiveTab('ntk')}>
          <Text>问题板</Text>
        </View>
        <View className={`tab ${activeTab === 'research' ? 'active' : ''}`} onClick={() => setActiveTab('research')}>
          <Text>研究笔记</Text>
        </View>
      </View>

      {/* KWL表 */}
      {activeTab === 'kwl' && (
        <View className="card">
          <View className="card-header">
            <Text className="card-title">KWL表 - {phaseLabels[currentPhase] || currentPhase}阶段</Text>
          </View>
          <View className="kwl-section">
            <Text className="kwl-label">K - 我已经知道的 (Know)</Text>
            <Textarea className="kwl-textarea" value={kwlForm.k}
              onInput={(e) => setKwlForm({ ...kwlForm, k: (e as any).detail.value })}
              placeholder="写下你关于这个主题已经知道的知识..." />
          </View>
          <View className="kwl-section">
            <Text className="kwl-label">W - 我想知道的 (Want to know)</Text>
            <Textarea className="kwl-textarea" value={kwlForm.w}
              onInput={(e) => setKwlForm({ ...kwlForm, w: (e as any).detail.value })}
              placeholder="写下你想知道的问题..." />
          </View>
          <View className="kwl-section">
            <Text className="kwl-label">L - 我学到的 (Learned)</Text>
            <Textarea className="kwl-textarea" value={kwlForm.l}
              onInput={(e) => setKwlForm({ ...kwlForm, l: (e as any).detail.value })}
              placeholder="写下你在这个阶段学到的新知识..." />
          </View>
          <View className="btn-primary" onClick={handleKwlSave}>
            <Text className="btn-text">保存KWL</Text>
          </View>
        </View>
      )}

      {/* 问题板 */}
      {activeTab === 'ntk' && (
        <View className="card">
          <View className="card-header flex-between">
            <Text className="card-title">需要知道的问题 ({ntkQuestions.length})</Text>
            <View className="btn-small" onClick={() => setShowNtkForm(!showNtkForm)}>
              <Text className="btn-small-text">+ 提问</Text>
            </View>
          </View>

          {showNtkForm && (
            <View className="form-card">
              <Input className="form-input" value={ntkForm.question}
                onInput={(e) => setNtkForm({ ...ntkForm, question: (e as any).detail.value })}
                placeholder="输入你的问题..." />
              <Picker mode="selector" range={['通用', '技术', '资源', '流程', '反思']}
                onChange={(e) => {
                  const cats = ['general', 'technical', 'resource', 'process', 'reflection'];
                  setNtkForm({ ...ntkForm, category: cats[Number((e as any).detail.value)] });
                }}>
                <View className="picker">类别：{ntkForm.category}</View>
              </Picker>
              <View className="btn-primary" onClick={handleNtkSubmit}>
                <Text className="btn-text">提交问题</Text>
              </View>
            </View>
          )}

          {ntkQuestions.length === 0 ? (
            <Text className="empty-hint">还没有问题，点击"+ 提问"开始</Text>
          ) : (
            ntkQuestions.map((q: any) => (
              <View key={q.id} className="ntk-item">
                <View className="ntk-header">
                  <Text className="ntk-question">Q: {q.question}</Text>
                  <View className={`ntk-status ${q.status}`}>
                    <Text>{q.status === 'open' ? '待研究' : q.status === 'researching' ? '研究中' : '已解答'}</Text>
                  </View>
                </View>
                {q.answer && (
                  <View className="ntk-answer">
                    <Text className="ntk-answer-label">A: </Text>
                    <Text>{q.answer}</Text>
                  </View>
                )}
                <Text className="ntk-meta">{q.asker_name} - {q.created_at}</Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* 研究笔记 */}
      {activeTab === 'research' && (
        <View className="card">
          <View className="card-header flex-between">
            <Text className="card-title">研究笔记 ({researchNotes.length})</Text>
            <View className="btn-small" onClick={() => setShowNoteForm(!showNoteForm)}>
              <Text className="btn-small-text">+ 笔记</Text>
            </View>
          </View>

          {showNoteForm && (
            <View className="form-card">
              <Input className="form-input" value={noteForm.title}
                onInput={(e) => setNoteForm({ ...noteForm, title: (e as any).detail.value })}
                placeholder="笔记标题" />
              <Textarea className="kwl-textarea" value={noteForm.content}
                onInput={(e) => setNoteForm({ ...noteForm, content: (e as any).detail.value })}
                placeholder="笔记内容..." />
              <Picker mode="selector" range={['文章', '视频', '访谈', '数据', '书籍', '网站', '其他']}
                onChange={(e) => {
                  const types = ['article', 'video', 'interview', 'data', 'book', 'website', 'other'];
                  setNoteForm({ ...noteForm, resource_type: types[Number((e as any).detail.value)] });
                }}>
                <View className="picker">类型：{resourceTypeLabels[noteForm.resource_type]}</View>
              </Picker>
              <View className="btn-primary" onClick={handleNoteSubmit}>
                <Text className="btn-text">保存笔记</Text>
              </View>
            </View>
          )}

          {researchNotes.length === 0 ? (
            <Text className="empty-hint">还没有研究笔记，点击"+ 笔记"开始记录</Text>
          ) : (
            researchNotes.map((note: any) => (
              <View key={note.id} className="note-item">
                <View className="note-header">
                  <Text className="note-title">{note.title}</Text>
                  <View className="note-type-tag">
                    <Text>{resourceTypeLabels[note.resource_type] || note.resource_type}</Text>
                  </View>
                </View>
                {note.content && <Text className="note-content">{note.content}</Text>}
                <Text className="note-meta">{note.created_at}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}