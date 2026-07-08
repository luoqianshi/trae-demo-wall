import { useState, useEffect } from 'react';
import type { ProjectMeta, CostMeta, ReviewReport } from './types';
import { Header } from './components/Header';
import { ProjectForm } from './components/ProjectForm';
import { CostForm } from './components/CostForm';
import { TranscriptInput } from './components/TranscriptInput';
import { ReportPanel } from './components/ReportPanel';
import { ExportButtons } from './components/ExportButtons';
import { generateReport } from './utils/reportGenerator';
import { exportProjectLog, exportCommonIssues, exportSessionSummary } from './utils/exporter';
import { saveSession, loadSession, clearSession, getDefaultProjectMeta, getDefaultCostMeta } from './utils/storage';
import { sampleTranscript, sampleProjectMeta, sampleCostMeta } from './data/sampleTranscript';

function App() {
  const [project, setProject] = useState<ProjectMeta>(getDefaultProjectMeta());
  const [cost, setCost] = useState<CostMeta>(getDefaultCostMeta());
  const [transcript, setTranscript] = useState('');
  const [report, setReport] = useState<ReviewReport | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setProject(saved.projectMeta);
      setCost(saved.costMeta);
      setTranscript(saved.transcript);
      setReport(saved.report);
    }
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    saveSession(project, cost, transcript, report);
  }, [project, cost, transcript, report]);

  const handleGenerate = () => {
    if (!transcript.trim()) {
      alert('请先粘贴 AI 工作记录，或点击"载入示例"快速体验');
      return;
    }
    const newReport = generateReport(project, cost, transcript);
    setReport(newReport);
  };

  const handleLoadSample = () => {
    setProject(sampleProjectMeta);
    setCost(sampleCostMeta);
    setTranscript(sampleTranscript);
    setReport(null);
  };

  const handleClear = () => {
    if (confirm('确定要清空所有内容吗？')) {
      setProject(getDefaultProjectMeta());
      setCost(getDefaultCostMeta());
      setTranscript('');
      setReport(null);
      clearSession();
    }
  };

  const handleExportProjectLog = () => {
    if (report) {
      exportProjectLog(project, cost, report);
    }
  };

  const handleExportIssues = () => {
    if (report) {
      exportCommonIssues(report.issues);
    }
  };

  const handleExportJson = () => {
    exportSessionSummary(project, cost, transcript, report);
  };

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <div className="action-bar">
          <button className="btn btn-primary btn-large" onClick={handleGenerate}>
            🚀 生成复盘
          </button>
          <button className="btn btn-secondary" onClick={handleClear}>
            🗑️ 清空
          </button>
        </div>

        <div className="workspace">
          {/* Left Panel - Input */}
          <div className="panel input-panel">
            <ProjectForm project={project} onChange={setProject} />
            <CostForm cost={cost} onChange={setCost} />
            <TranscriptInput
              value={transcript}
              onChange={setTranscript}
              onLoadSample={handleLoadSample}
            />
          </div>

          {/* Right Panel - Output */}
          <div className="panel output-panel">
            <ExportButtons
              onExportProjectLog={handleExportProjectLog}
              onExportIssues={handleExportIssues}
              onExportJson={handleExportJson}
              disabled={!report}
            />
            <ReportPanel report={report} />
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>AgentTrace - AI Agent 工作复盘与成本分析系统 | TRAE AI 创造力大赛</p>
      </footer>
    </div>
  );
}

export default App;
