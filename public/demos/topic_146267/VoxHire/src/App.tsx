import { useEffect, useRef, useState } from "react";
import { BarChart3, ChevronRight, FileText, History, KeyRound, Mic, Play, PlugZap, RotateCcw, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { demoQuestions, demoReport, demoTranscript } from "./demo";
import { createSession, extractPdf, generateReport, mirrorTranscript, testLlmConnection } from "./services/api";
import { SpeechGatewayClient } from "./services/realtime";
import { recentInterviews, saveInterview, type StoredInterview } from "./storage";
import type { AppMode, InterviewReport, SessionCreated, SetupData, TranscriptEntry, View } from "./types";
import { InterviewerAvatar } from "./components/InterviewerAvatar";

const initialSetup: SetupData = { role: "后端工程师", experienceYears: 3, skills: "Python, FastAPI, MySQL", resumeText: "", jobDescription: "" };
const gatewayUrl = import.meta.env.VITE_SPEECH_GATEWAY_URL ?? "ws://127.0.0.1:8765/v1/realtime";

function modeLabel(mode: AppMode) { return mode === "demo" ? "演示数据模式" : "本地语音模式"; }

function scoreTone(score: number) { return score >= 8 ? "strong" : score >= 6 ? "steady" : "focus"; }

export default function App() {
  const [mode, setMode] = useState<AppMode>("demo");
  const [view, setView] = useState<View>("setup");
  const [setup, setSetup] = useState<SetupData>(initialSetup);
  const [llmStatus, setLlmStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [testingLlm, setTestingLlm] = useState(false);
  const [session, setSession] = useState<SessionCreated | null>(null);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [history, setHistory] = useState<StoredInterview[]>([]);
  const [gatewayStatus, setGatewayStatus] = useState<"ready" | "listening" | "thinking" | "speaking" | "error">("ready");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [completedRounds, setCompletedRounds] = useState(0);
  const gateway = useRef<SpeechGatewayClient | null>(null);
  const waitingForInterviewer = useRef(false);
  const initialAssistantResponseReceived = useRef(false);

  useEffect(() => { recentInterviews().then(setHistory).catch(() => undefined); }, []);
  useEffect(() => () => gateway.current?.close(), []);

  async function startInterview() {
    setNotice("");
    setIsLoading(true);
    try {
      if (mode === "demo") {
        setSession({ session_id: "demo-session", gateway_instructions: "", questions: demoQuestions });
        setEntries([{ role: "assistant", text: demoQuestions[0] }]);
      } else {
        const nextSession = await createSession(setup);
        setSession(nextSession);
        // Show the first question immediately. The gateway response replaces this
        // placeholder once the interviewer's actual welcome has been generated.
        setEntries([{ role: "assistant", text: nextSession.questions[0] }]);
        const client = new SpeechGatewayClient(gatewayUrl, nextSession.gateway_instructions, {
          onStatus: (status) => setGatewayStatus(status === "connecting" ? "thinking" : status),
          onTranscript: (entry) => {
            if (entry.role === "user") {
              if (waitingForInterviewer.current) return;
              waitingForInterviewer.current = true;
              setEntries((previous) => [...previous, entry]);
            } else if (!waitingForInterviewer.current && !initialAssistantResponseReceived.current) {
              initialAssistantResponseReceived.current = true;
              setEntries((previous) => [{ role: "assistant", text: entry.text }, ...previous.slice(1)]);
            } else if (waitingForInterviewer.current) {
              waitingForInterviewer.current = false;
              setCompletedRounds((count) => Math.min(5, count + 1));
              setEntries((previous) => [...previous, entry]);
            }
            void mirrorTranscript(nextSession.session_id, [entry]).catch(() => undefined);
          },
          onError: (message) => { setGatewayStatus("error"); setNotice(message); },
        });
        gateway.current = client;
        await client.connect();
      }
      setDemoIndex(0);
      setCompletedRounds(0);
      waitingForInterviewer.current = false;
      initialAssistantResponseReceived.current = false;
      setView("interview");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "启动失败，请确认本地服务已运行");
    } finally { setIsLoading(false); }
  }

  async function verifyLlm() {
    setTestingLlm(true);
    setLlmStatus(null);
    try {
      const result = await testLlmConnection();
      setLlmStatus(result);
    } catch (error) {
      setLlmStatus({ ok: false, message: error instanceof Error ? error.message : "连接测试失败" });
    } finally { setTestingLlm(false); }
  }

  function advanceDemo() {
    if (demoIndex >= demoQuestions.length) return;
    const answer = demoTranscript[demoIndex * 2 + 1];
    const nextQuestion = demoQuestions[demoIndex + 1];
    setEntries((previous) => [...previous, answer, ...(nextQuestion ? [{ role: "assistant" as const, text: nextQuestion }] : [])]);
    setDemoIndex((index) => index + 1);
    setCompletedRounds((count) => Math.min(5, count + 1));
  }

  async function finishInterview() {
    if (!session) return;
    setIsLoading(true);
    try {
      const nextReport = mode === "demo" ? demoReport : await generateReport(session.session_id, entries);
      setReport(nextReport);
      const stored: StoredInterview = {
        id: `${session.session_id}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        setup: { role: setup.role, experienceYears: setup.experienceYears, skills: setup.skills },
        transcript: entries,
        report: nextReport,
      };
      await saveInterview(stored);
      setHistory((previous) => [stored, ...previous]);
      gateway.current?.close();
      gateway.current = null;
      setView("report");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "报告生成失败");
    } finally { setIsLoading(false); }
  }

  async function onPdfChange(file?: File) {
    if (!file) return;
    setIsLoading(true);
    try {
      const resumeText = await extractPdf(file);
      setSetup((value) => ({ ...value, resumeText }));
      setNotice("PDF 内容已提取，仅用于本次面试。");
    }
    catch (error) { setNotice(error instanceof Error ? error.message : "PDF 读取失败"); }
    finally { setIsLoading(false); }
  }

  function reset() {
    gateway.current?.close();
    gateway.current = null;
    setEntries([]); setReport(null); setSession(null); setDemoIndex(0); setCompletedRounds(0); setNotice(""); setView("setup"); setGatewayStatus("ready");
    waitingForInterviewer.current = false;
    initialAssistantResponseReceived.current = false;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={reset}><span className="brand-mark"><Sparkles size={17} /></span><span>VoxHire</span></button>
        <div className="topbar-meta"><span className={`mode-chip ${mode}`}><span />{modeLabel(mode)}</span><span className="privacy"><ShieldCheck size={15} />资料仅用于当前会话</span></div>
      </header>
      {notice && <div className="notice">{notice}<button onClick={() => setNotice("")}>关闭</button></div>}
      {view === "setup" && <SetupView mode={mode} setMode={setMode} setup={setup} setSetup={setSetup} llmStatus={llmStatus} testingLlm={testingLlm} onTestLlm={verifyLlm} onPdf={onPdfChange} onStart={startInterview} loading={isLoading} history={history} onOpenHistory={(item) => { setReport(item.report); setEntries(item.transcript); setView("report"); }} />}
      {view === "interview" && <InterviewView mode={mode} setup={setup} session={session!} entries={entries} progress={completedRounds} status={gatewayStatus} demoIndex={demoIndex} loading={isLoading} onHold={(held) => gateway.current?.setCapturing(held)} onDemoAdvance={advanceDemo} onFinish={finishInterview} />}
      {view === "report" && report && <ReportView report={report} setup={setup} onRestart={reset} />}
    </main>
  );
}

function SetupView({ mode, setMode, setup, setSetup, llmStatus, testingLlm, onTestLlm, onPdf, onStart, loading, history, onOpenHistory }: { mode: AppMode; setMode: (value: AppMode) => void; setup: SetupData; setSetup: (value: SetupData) => void; llmStatus: { ok: boolean; message: string } | null; testingLlm: boolean; onTestLlm: () => void; onPdf: (file?: File) => void; onStart: () => void; loading: boolean; history: StoredInterview[]; onOpenHistory: (item: StoredInterview) => void }) {
  const update = <K extends keyof SetupData>(key: K, value: SetupData[K]) => setSetup({ ...setup, [key]: value });
  return <section className="setup-layout">
    <div className="setup-intro"><p className="eyebrow">AI 语音模拟面试</p><h1>把每一次回答，变成下一次更从容的表达。</h1><p className="lede">围绕你的岗位、简历与目标职位，完成一场 5 题技术面试，并获得可执行的七维复盘。</p><div className="mode-switch" role="group"><button className={mode === "demo" ? "active" : ""} onClick={() => setMode("demo")}><Play size={15} />演示数据模式</button><button className={mode === "live" ? "active" : ""} onClick={() => setMode("live")}><Mic size={15} />本地语音模式</button></div><p className="mode-help">{mode === "demo" ? "无需启动模型，可完整体验页面流程与样例报告。" : "连接本机 speech-to-speech 网关，音频不会上传到第三方语音服务。"}</p></div>
    <div className="setup-form" aria-label="面试设置">
      <div className="form-heading"><div><p className="eyebrow">面试设置</p><h2>定制本场练习</h2></div><span>约 10 分钟</span></div>
      <label>目标岗位<input value={setup.role} onChange={(event) => update("role", event.target.value)} /></label>
      <div className="two-columns"><label>工作年限<select value={setup.experienceYears} onChange={(event) => update("experienceYears", Number(event.target.value))}>{[0, 1, 2, 3, 5, 8, 10].map((value) => <option key={value} value={value}>{value === 0 ? "应届 / 0 年" : `${value} 年`}</option>)}</select></label><label>核心技术栈<input value={setup.skills} onChange={(event) => update("skills", event.target.value)} placeholder="Python, FastAPI" /></label></div>
      <label>职位描述（JD）<textarea value={setup.jobDescription} onChange={(event) => update("jobDescription", event.target.value)} placeholder="粘贴职位职责与任职要求，可选" rows={3} /></label>
      <label>简历内容（可选）<textarea value={setup.resumeText} onChange={(event) => update("resumeText", event.target.value)} placeholder="粘贴简历内容，或上传 PDF" rows={4} /></label>
      <label className="upload"><input type="file" accept="application/pdf" onChange={async (event) => onPdf(event.target.files?.[0])} /><Upload size={16} />上传 PDF 简历<span>不保存原文件</span></label>
      <section className="llm-debug">
        <div className="llm-debug-heading"><div><p className="eyebrow">LLM 调试</p><h3>OpenAI 兼容接口</h3></div><KeyRound size={18} /></div>
        <button className="debug-action" type="button" onClick={onTestLlm} disabled={testingLlm}><PlugZap size={15} />{testingLlm ? "正在测试..." : "测试连通性"}</button>
        {llmStatus && <p className={`llm-result ${llmStatus.ok ? "success" : "failure"}`}>{llmStatus.message}</p>}
        <p className="llm-hint">读取根目录 .env 中的 API 地址、模型名和密钥；网页不会显示或保存密钥。</p>
      </section>
      <button className="primary-action" onClick={onStart} disabled={loading || !setup.role || !setup.skills}>{loading ? "正在准备..." : "开始模拟面试"}<ChevronRight size={18} /></button>
    </div>
    {history.length > 0 && <aside className="history-strip"><div><p className="eyebrow">本机历史</p><h2>最近复盘</h2></div>{history.slice(0, 3).map((item) => <button key={item.id} onClick={() => onOpenHistory(item)}><History size={17} /><span>{item.setup.role}<small>{new Date(item.createdAt).toLocaleDateString("zh-CN")}</small></span><strong>{item.report.overall_score}</strong></button>)}</aside>}
  </section>;
}

function InterviewView({ mode, setup, session, entries, progress, status, demoIndex, loading, onHold, onDemoAdvance, onFinish }: { mode: AppMode; setup: SetupData; session: SessionCreated; entries: TranscriptEntry[]; progress: number; status: "ready" | "listening" | "thinking" | "speaking" | "error"; demoIndex: number; loading: boolean; onHold: (value: boolean) => void; onDemoAdvance: () => void; onFinish: () => void }) {
  const question = [...entries].reverse().find((item) => item.role === "assistant")?.text ?? session.questions[0];
  const statusCopy = { ready: "准备就绪", listening: "正在聆听", thinking: "正在分析", speaking: "正在提问", error: "连接异常" }[status];
  return <section className="interview-layout">
    <aside className="interview-sidebar"><p className="eyebrow">当前模拟</p><h2>{setup.role}</h2><p>{setup.experienceYears} 年经验 · {setup.skills}</p><div className="progress-card"><div><span>完成进度</span><strong>{progress} / 5</strong></div><div className="progress-track"><span style={{ width: `${progress * 20}%` }} /></div></div><ol>{session.questions.map((item, index) => <li key={item} className={index < progress ? "done" : index === progress ? "current" : ""}><span>{index + 1}</span><p>{["开场了解", "技术基础", "技术基础", "项目深挖", "系统设计"][index]}</p></li>)}</ol><button className="finish-link" onClick={onFinish} disabled={loading || progress === 0}>结束并生成报告<BarChart3 size={16} /></button></aside>
    <div className="interview-stage"><div className="stage-top"><div><p className="eyebrow">VoxHire 面试官</p><h1>林知远</h1></div><span className={`status status-${status}`}><i />{statusCopy}</span></div><div className="avatar-stage"><InterviewerAvatar status={status} /></div><div className="question-panel"><span>当前问题</span><p>{question}</p></div>
      {mode === "demo" ? <div className="voice-control demo-control"><button className="voice-button" onClick={onDemoAdvance} disabled={demoIndex >= 5}><Play size={25} /></button><div><strong>{demoIndex >= 5 ? "样例回答已完成" : "提交示例回答"}</strong><span>演示模式使用内置转写内容</span></div></div> : <div className="voice-control"><button className="voice-button" disabled={status !== "ready" || progress >= 5} onPointerDown={() => onHold(true)} onPointerUp={() => onHold(false)} onPointerLeave={() => onHold(false)}><Mic size={25} /></button><div><strong>{status === "ready" ? "按住说话，松开结束录音" : "等待面试官完成本轮交流"}</strong><span>{status === "ready" ? "松开后提交整段回答" : "收到下一题后可继续回答"}</span></div></div>}
    </div>
    <aside className="transcript-panel"><div><p className="eyebrow">实时记录</p><h2>面试对话</h2></div><div className="transcript-list">{entries.map((entry, index) => <article className={entry.role} key={`${entry.role}-${index}`}><span>{entry.role === "assistant" ? "面试官" : "你"}</span><p>{entry.text}</p></article>)}</div></aside>
  </section>;
}

function ReportView({ report, setup, onRestart }: { report: InterviewReport; setup: SetupData; onRestart: () => void }) {
  return <section className="report-layout"><header className="report-header"><div><p className="eyebrow">面试复盘报告</p><h1>{setup.role} · 能力评估</h1><p>{report.summary}</p></div><button className="secondary-action" onClick={onRestart}><RotateCcw size={16} />再来一场</button></header><div className="report-overview"><div className="score-ring"><span>{report.overall_score}</span><small>/ 100</small></div><div><p className="eyebrow">综合建议</p><h2>{report.recommendation}</h2><p>报告依据本场问答生成，已保存在当前浏览器。</p></div></div><div className="dimension-grid">{report.dimensions.map((dimension) => <article className="dimension" key={dimension.key}><div><span>{dimension.label}</span><strong className={scoreTone(dimension.score)}>{dimension.score}<small>/10</small></strong></div><p>{dimension.evidence}</p><footer><Sparkles size={14} />{dimension.suggestion}</footer></article>)}</div><div className="report-footer"><FileText size={18} /><span>下一次练习建议：围绕“{report.dimensions.reduce((lowest, item) => item.score < lowest.score ? item : lowest).label}”准备一个可量化的项目案例。</span></div></section>;
}
