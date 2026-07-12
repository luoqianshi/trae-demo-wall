import { useEffect, useMemo, useRef, useState } from "react";

import { SubtitleOverlay } from "./components/SubtitleOverlay.jsx";
import { ExportTab } from "./components/export/ExportTab.jsx";
import { BottomNav } from "./components/layout/BottomNav.jsx";
import { NoticeStack } from "./components/layout/NoticeStack.jsx";
import { EmptyState } from "./components/shared/EmptyState.jsx";
import { GlossaryChips } from "./components/shared/GlossaryChips.jsx";
import { RevisionTrack } from "./components/shared/RevisionTrack.jsx";
import { StatusPill } from "./components/shared/StatusPill.jsx";
import {
  APP_TABS,
  EXPORT_FORMATS,
  EXPORT_RANGES,
  LANGUAGE_PAIRS,
  REVIEW_ROLES,
  SCENE_TEMPLATES,
  SCREEN_ROLE_VIEWS,
} from "./config/constants.js";
import {
  ARCHIVE_STORAGE_KEY,
  CHUNK_FLUSH_INTERVAL_MS,
  REVIEW_SENTENCE_PATTERN,
  STORAGE_KEY,
  controlDefaults,
} from "./config/defaults.js";
import {
  bytesToBase64,
  buildAudioConstraints,
  downsampleBuffer,
  flattenChunks,
  floatTo16BitPCM,
} from "./utils/audio.js";
import { createSessionArchive, readStoredArchives } from "./utils/archive.js";
import { calculateConfidenceScore, getConfidenceState } from "./utils/confidence.js";
import { buildSessionDigest, getArchivedRoleView } from "./utils/digest.js";
import { renderFinalDiff } from "./utils/diff.js";
import { buildExportContent, downloadTextFile } from "./utils/export.js";
import { formatClock, textDirection } from "./utils/format.js";
import { mergeGlossary, parseGlossary } from "./utils/glossary.js";
import {
  buildRevisionStats,
  buildSessionSummary,
  buildTimelineEntry,
  getPipelineQueueSummary,
  renderHistoryLabel,
} from "./utils/timeline.js";
import {
  getDefaultSocketUrl,
  normalizeSocketUrl,
  socketUrlToHttpUrl,
  useWebSocket,
} from "./hooks/useWebSocket.js";

function readStoredSocketUrl() {
  if (typeof window === "undefined") {
    return getDefaultSocketUrl();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return getDefaultSocketUrl();
  }

  try {
    const normalized = normalizeSocketUrl(stored);
    const parsed = new URL(normalized);
    if (
      (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
      parsed.pathname === "/api/stream" &&
      parsed.port !== "8000"
    ) {
      return getDefaultSocketUrl();
    }
    return normalized;
  } catch {
    return getDefaultSocketUrl();
  }
}

function getCurrentPair(controls) {
  return (
    LANGUAGE_PAIRS.find(
      (pair) =>
        pair.sourceLang === controls.sourceLang && pair.targetLang === controls.targetLang
    ) || LANGUAGE_PAIRS[0]
  );
}

function getSceneTemplate(templateId) {
  return SCENE_TEMPLATES.find((item) => item.id === templateId) || SCENE_TEMPLATES[0];
}

export default function App() {
  const mode = window.qnDesktop?.getMode?.() || "control";
  const [controls, setControls] = useState(controlDefaults);
  const [sceneTemplateId, setSceneTemplateId] = useState(controlDefaults.sceneTemplateId);
  const [activeTab, setActiveTab] = useState(APP_TABS[0].id);
  const [activeRoleView, setActiveRoleView] = useState(SCREEN_ROLE_VIEWS[0].id);
  const [socketUrl] = useState(readStoredSocketUrl);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechState, setSpeechState] = useState("idle");
  const [speechMessage, setSpeechMessage] = useState("");
  const [listeningHint, setListeningHint] = useState("");
  const [glossaryDraft, setGlossaryDraft] = useState("");
  const [liveGlossaryDraft, setLiveGlossaryDraft] = useState("");
  const [displayMode, setDisplayMode] = useState("bilingual");
  const [displayDraftVisible, setDisplayDraftVisible] = useState(true);
  const [displayHighContrast, setDisplayHighContrast] = useState(false);
  const [subtitleModalOpen, setSubtitleModalOpen] = useState(false);
  const [archivedSessions, setArchivedSessions] = useState(readStoredArchives);
  const [selectedArchiveId, setSelectedArchiveId] = useState("");
  const [reviewRoleId, setReviewRoleId] = useState(REVIEW_ROLES[0].id);
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS[0].id);
  const [exportRange, setExportRange] = useState(EXPORT_RANGES[0].id);
  const [exportSource, setExportSource] = useState("current");
  const [exportMessage, setExportMessage] = useState("");
  const [sessionSummaryData, setSessionSummaryData] = useState(null);
  const [sessionSummaryState, setSessionSummaryState] = useState("idle");
  const [focusedSentenceId, setFocusedSentenceId] = useState("");
  const [manualSourceText, setManualSourceText] = useState("");
  const [deepseekApiKeyDraft, setDeepseekApiKeyDraft] = useState("");
  const [adminTokenDraft, setAdminTokenDraft] = useState("");
  const [deepseekApiKeySaving, setDeepseekApiKeySaving] = useState(false);
  const [deepseekConfigStatus, setDeepseekConfigStatus] = useState({
    configured: false,
    apiKeyPreview: "",
  });
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const processorNodeRef = useRef(null);
  const chunkTimerRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputSampleRateRef = useRef(48000);
  const sendingChunkRef = useRef(false);
  const chunkUploadPromiseRef = useRef(null);
  const {
    connectionState,
    pipelineState,
    draftSubtitle,
    subtitles,
    sourcePreview,
    pipelineMetrics,
    lastError,
    reconnect,
    sendConfig,
    sendCommand,
    sendRealtimeStart,
    sendRealtimeChunk,
    sendRealtimePause,
    sendRealtimeFinish,
    getSessionSummary,
  } = useWebSocket({ initialControls: controls, socketUrl });

  const currentPair = useMemo(() => getCurrentPair(controls), [controls]);
  const sceneTemplate = useMemo(() => getSceneTemplate(sceneTemplateId), [sceneTemplateId]);
  const canSendCommands = connectionState === "connected";
  const isSessionActive = ["listening", "processing", "paused"].includes(pipelineState);

  const timelineEntries = useMemo(
    () =>
      subtitles
        .map((item) => buildTimelineEntry(item))
        .sort((left, right) => left.sentenceIndex - right.sentenceIndex),
    [subtitles]
  );

  const latestTimelineEntry = timelineEntries[timelineEntries.length - 1] || null;
  const activeDraftTranslation =
    draftSubtitle?.draftText || draftSubtitle?.displayText || draftSubtitle?.text || "";
  const activeFinalTranslation =
    latestTimelineEntry?.finalText || latestTimelineEntry?.displayText || "";
  const activeSourceText =
    sourcePreview || draftSubtitle?.sourceText || latestTimelineEntry?.sourceText || "";
  const sessionSummary = useMemo(() => buildSessionSummary(timelineEntries), [timelineEntries]);
  const revisionStats = useMemo(() => buildRevisionStats(timelineEntries), [timelineEntries]);
  const confidenceSummary = useMemo(() => {
    const scoredEntries = timelineEntries.map((entry) => ({
      ...entry,
      confidence: calculateConfidenceScore(entry, controls.glossary),
    }));
    const averageScore =
      scoredEntries.reduce((sum, entry) => sum + entry.confidence.score, 0) /
        Math.max(scoredEntries.length, 1) || 0;
    return {
      entries: scoredEntries,
      averageScore: Math.round(averageScore),
      highConfidence: scoredEntries.filter((entry) => entry.confidence.score >= 85).length,
      risky: scoredEntries.filter((entry) => entry.confidence.score < 50).length,
    };
  }, [timelineEntries, controls.glossary]);
  const sessionDigest = useMemo(
    () => buildSessionDigest(timelineEntries, revisionStats, controls.glossary),
    [timelineEntries, revisionStats, controls.glossary]
  );
  const activeDigest = sessionSummaryData || sessionDigest;
  const selectedArchive = useMemo(
    () => archivedSessions.find((item) => item.id === selectedArchiveId) || archivedSessions[0] || null,
    [archivedSessions, selectedArchiveId]
  );
  const hasSelectedArchive = Boolean(selectedArchiveId);
  const activeScreenRoleView = SCREEN_ROLE_VIEWS.some((item) => item.id === activeRoleView)
    ? activeRoleView
    : SCREEN_ROLE_VIEWS[0].id;
  const exportArchive = exportSource === "archive" ? selectedArchive : null;
  const exportTimelineSource = exportArchive?.timelineEntries || confidenceSummary.entries;
  const exportDigestSource = exportArchive?.digest || activeDigest;
  const exportSessionLabel = exportArchive
    ? `${exportArchive.sceneTemplateName} · ${exportArchive.pairLabel}`
    : `${sceneTemplate.name} · ${currentPair.short}`;
  const exportSourceLabel = exportArchive ? "历史归档会话" : "当前会话";
  const archivedRoleView = useMemo(
    () => getArchivedRoleView(reviewRoleId, selectedArchive),
    [reviewRoleId, selectedArchive]
  );
  const reviewSessionName = hasSelectedArchive && selectedArchive ? selectedArchive.sceneTemplateName : sceneTemplate.name;
  const reviewPairLabel = hasSelectedArchive && selectedArchive ? selectedArchive.pairLabel : currentPair.short;
  const reviewSummarySource = hasSelectedArchive && selectedArchive ? selectedArchive.summary : sessionSummary;
  const reviewVolatileCount = hasSelectedArchive && selectedArchive ? selectedArchive.summary.volatile : sessionSummary.volatile;
  const reviewDigestSource = hasSelectedArchive && selectedArchive ? selectedArchive.digest : activeDigest;
  const reviewEntries = hasSelectedArchive ? archivedRoleView.items : confidenceSummary.entries.slice(-6).reverse();
  const currentConfidence = useMemo(
    () => getConfidenceState(draftSubtitle ? buildTimelineEntry(draftSubtitle) : latestTimelineEntry),
    [draftSubtitle, latestTimelineEntry]
  );
  const queueSummary = useMemo(
    () =>
      getPipelineQueueSummary({
        pipelineState,
        pipelineMetrics,
        timelineEntries,
        draftSubtitle,
        latestTimelineEntry,
      }),
    [pipelineState, pipelineMetrics, timelineEntries, draftSubtitle, latestTimelineEntry]
  );
  const liveKickerText =
    speechState === "listening"
      ? "监听中"
      : speechState === "paused"
        ? "已暂停"
        : speechState === "ending"
          ? "正在结束"
          : speechState === "preparing"
            ? "准备中"
            : pipelineState === "processing"
              ? "处理中"
              : pipelineState === "listening"
                ? "同传中"
                : "待开始";

  const focusTimelineSentence = (sentenceNumber) => {
    setActiveTab("view");
    const target = timelineEntries.find((entry) => entry.sentenceIndex + 1 === sentenceNumber);
    if (!target) {
      setExportMessage(`当前时间轴里还没有句子 #${sentenceNumber}。`);
      return;
    }
    setFocusedSentenceId(target.sentenceId);
    window.setTimeout(() => {
      document.getElementById(`timeline-${target.sentenceId}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 40);
    setExportMessage(`已定位到时间轴中的句子 #${sentenceNumber}，可直接复核。`);
  };

  const handleTodoNavigate = (item) => {
    const matched = String(item || "").match(REVIEW_SENTENCE_PATTERN);
    if (!matched) {
      setExportMessage("这条待办是摘要提示，不对应单独句子。请结合时间轴和修订统计查看。");
      return;
    }
    focusTimelineSentence(Number(matched[1]));
  };

  useEffect(() => {
    let cancelled = false;

    const loadSessionSummary = async () => {
      if (!timelineEntries.length) {
        setSessionSummaryData(null);
        setSessionSummaryState("idle");
        return;
      }

      setSessionSummaryState("loading");
      const response = await getSessionSummary({
        sourceLang: controls.sourceLang,
        targetLang: controls.targetLang,
        sceneTemplateId,
        glossary: controls.glossary,
        transcript: confidenceSummary.entries.map((entry) => ({
          sentenceId: entry.sentenceId,
          sentenceIndex: entry.sentenceIndex,
          sourceText: entry.sourceText,
          finalText: entry.finalText,
          displayText: entry.displayText,
          highVolatility: entry.highVolatility,
          confidenceScore: entry.confidence.score,
        })),
      });

      if (cancelled) {
        return;
      }

      if (response) {
        setSessionSummaryData(response);
        setSessionSummaryState(response.provider || "ready");
      } else {
        setSessionSummaryData(null);
        setSessionSummaryState("fallback");
      }
    };

    void loadSessionSummary();

    return () => {
      cancelled = true;
    };
  }, [
    controls.glossary,
    controls.sourceLang,
    controls.targetLang,
    sceneTemplateId,
    timelineEntries,
    confidenceSummary.entries,
    getSessionSummary,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(archivedSessions));
  }, [archivedSessions]);

  useEffect(() => {
    const loadDeepseekConfig = async () => {
      try {
        const response = await fetch(socketUrlToHttpUrl(socketUrl, "/api/deepseek/config"));
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setDeepseekConfigStatus({
          configured: Boolean(data.configured),
          apiKeyPreview: data.apiKeyPreview || "",
        });
      } catch {
        // 后端可能未启动，静默忽略
      }
    };

    loadDeepseekConfig();
  }, [socketUrl]);

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      Boolean(window.AudioContext || window.webkitAudioContext);
    setSpeechSupported(supported);
    if (!supported) {
      setSpeechMessage("当前浏览器不支持网页录音，请使用支持麦克风采集的浏览器。");
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAudioCapture();
    };
  }, []);

  const stopAudioCapture = () => {
    if (chunkTimerRef.current) {
      window.clearInterval(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    processorNodeRef.current?.disconnect?.();
    sourceNodeRef.current?.disconnect?.();
    if (audioContextRef.current?.state && audioContextRef.current.state !== "closed") {
      void audioContextRef.current.close();
    }
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    processorNodeRef.current = null;
    sourceNodeRef.current = null;
    audioContextRef.current = null;
    mediaStreamRef.current = null;
  };

  const flushAudioChunk = async () => {
    if (sendingChunkRef.current) {
      if (!chunkUploadPromiseRef.current) {
        return false;
      }
      await chunkUploadPromiseRef.current;
    }

    const merged = flattenChunks(audioChunksRef.current);
    if (!merged.length) {
      return false;
    }

    sendingChunkRef.current = true;
    audioChunksRef.current = [];
    try {
      const uploadPromise = (async () => {
        const downsampled = downsampleBuffer(merged, inputSampleRateRef.current, 16000);
        const pcmBytes = floatTo16BitPCM(downsampled);
        const audioBase64 = bytesToBase64(pcmBytes);
        const response = await sendRealtimeChunk({ audioBase64 });
        return Boolean(response);
      })();
      chunkUploadPromiseRef.current = uploadPromise;
      return await uploadPromise;
    } finally {
      chunkUploadPromiseRef.current = null;
      sendingChunkRef.current = false;
    }
  };

  const updateControls = (partial) => {
    const next = { ...controls, ...partial };
    setControls(next);
    sendConfig(next);
  };

  const applyPair = (pair) => {
    updateControls({
      sourceLang: pair.sourceLang,
      targetLang: pair.targetLang,
    });
  };

  const applySceneTemplate = (templateId) => {
    const nextTemplate = getSceneTemplate(templateId);
    const nextPair =
      LANGUAGE_PAIRS.find((item) => item.id === nextTemplate.pairId) || LANGUAGE_PAIRS[0];
    setSceneTemplateId(templateId);
    setDisplayDraftVisible(nextTemplate.draftIntensity !== "soft");
    updateControls({
      sourceLang: nextPair.sourceLang,
      targetLang: nextPair.targetLang,
      sceneTemplateId: templateId,
    });
  };

  const handleGlossaryApply = async () => {
    const glossary = parseGlossary(glossaryDraft);
    updateControls({ glossary });
    const response = await sendCommand({
      action: "config",
      sourceLang: controls.sourceLang,
      targetLang: controls.targetLang,
      ttsEnabled: controls.ttsEnabled,
      recordEnabled: controls.recordEnabled,
      glossary,
      sceneTemplateId,
    });
    if (response) {
      setGlossaryDraft(glossary.join("\n"));
      setExportMessage(`已注入 ${glossary.length} 个关键词。`);
    }
  };

  const saveDeepseekConfig = async () => {
    const apiKey = deepseekApiKeyDraft.trim();
    const adminToken = adminTokenDraft.trim();
    if (!apiKey || !adminToken) {
      setExportMessage("请同时填写 DeepSeek API Key 和管理员 Token。");
      return;
    }

    setDeepseekApiKeySaving(true);
    try {
      const response = await fetch(socketUrlToHttpUrl(socketUrl, "/api/deepseek/config"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setDeepseekConfigStatus({
        configured: Boolean(data.configured),
        apiKeyPreview: data.apiKeyPreview || "",
      });
      setDeepseekApiKeyDraft("");
      setAdminTokenDraft("");
      setExportMessage("DeepSeek API Key 已保存，后续翻译将调用真实模型。");
    } catch (error) {
      setExportMessage(
        error instanceof Error ? `保存 Key 失败：${error.message}` : "保存 Key 失败。"
      );
    } finally {
      setDeepseekApiKeySaving(false);
    }
  };

  const handleLiveGlossaryApply = async () => {
    const mergedGlossary = mergeGlossary(controls.glossary, parseGlossary(liveGlossaryDraft));
    updateControls({ glossary: mergedGlossary });
    const response = await sendCommand({
      action: "config",
      sourceLang: controls.sourceLang,
      targetLang: controls.targetLang,
      ttsEnabled: controls.ttsEnabled,
      recordEnabled: controls.recordEnabled,
      glossary: mergedGlossary,
      sceneTemplateId,
    });
    if (response) {
      setGlossaryDraft(mergedGlossary.join("\n"));
      setLiveGlossaryDraft("");
      setExportMessage(`会中新增关键词已生效，当前共 ${mergedGlossary.length} 个。`);
    }
  };

  const handleToggleTts = () => {
    updateControls({ ttsEnabled: !controls.ttsEnabled });
  };

  const handleToggleRecord = () => {
    updateControls({ recordEnabled: !controls.recordEnabled });
  };

  const startAudioCapture = async () => {
    if (!speechSupported) {
      setSpeechMessage("当前浏览器不支持网页录音，请更换环境后重试。");
      return;
    }

    if (!window.isSecureContext) {
      setSpeechMessage("当前页面不是安全上下文，无法稳定调用麦克风。");
      return;
    }

    try {
      stopAudioCapture();
      setSpeechMessage("");
      setListeningHint("正在请求麦克风权限...");
      setSpeechState("preparing");
      audioChunksRef.current = [];
      sendingChunkRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: buildAudioConstraints(sceneTemplateId),
      });
      mediaStreamRef.current = stream;

      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextCtor();
      audioContextRef.current = audioContext;
      inputSampleRateRef.current = audioContext.sampleRate;

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      processor.onaudioprocess = (event) => {
        const channelData = event.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(channelData));
        setListeningHint(`监听中 · ${sceneTemplate.name} · ${sceneTemplate.micStrategy}`);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      const started = await sendRealtimeStart({
        sourceLang: controls.sourceLang,
        targetLang: controls.targetLang,
        ttsEnabled: controls.ttsEnabled,
        recordEnabled: controls.recordEnabled,
        glossary: controls.glossary,
        sceneTemplateId,
      });
      if (!started) {
        throw new Error("realtime start failed");
      }

      chunkTimerRef.current = window.setInterval(() => {
        void flushAudioChunk();
      }, CHUNK_FLUSH_INTERVAL_MS);

      setSpeechState("listening");
      setListeningHint("已开始连续监听，当前句会先给快速预览，稳定后转为 Final。");
    } catch {
      setSpeechState("error");
      setSpeechMessage("麦克风启动失败，请检查权限和设备后重试。");
      setListeningHint("");
      stopAudioCapture();
    }
  };

  const startMockSession = async () => {
    if (!canSendCommands) {
      return;
    }
    setSpeechState("listening");
    setListeningHint("已启动模拟演示，使用内置脚本推流。");
    await sendCommand({
      action: "start",
      sourceLang: controls.sourceLang,
      targetLang: controls.targetLang,
      ttsEnabled: controls.ttsEnabled,
      recordEnabled: controls.recordEnabled,
      glossary: controls.glossary,
      sceneTemplateId,
      useMock: true,
    });
  };

  const sendManualSpeech = async () => {
    const text = manualSourceText.trim();
    if (!text || !canSendCommands) {
      return;
    }
    await sendCommand({
      action: "speech",
      sourceText: text,
      isFinal: true,
    });
    setManualSourceText("");
  };

  const pauseAudioCapture = async () => {
    setSpeechState("paused");
    setListeningHint("暂停上传，等待当前语音收尾...");
    stopAudioCapture();
    await flushAudioChunk();
    await sendRealtimePause();
  };

  const stopRecordingSession = async () => {
    setSpeechState("ending");
    stopAudioCapture();
    setListeningHint("正在停止会话并等待最终定稿...");
    await flushAudioChunk();
    await sendRealtimeFinish();
    const archive = createSessionArchive({
      sceneTemplate,
      controls,
      timelineEntries: confidenceSummary.entries,
      sessionSummary,
      revisionStats,
      confidenceSummary,
      digest: activeDigest,
    });
    setArchivedSessions((current) => [archive, ...current].slice(0, 12));
    setSelectedArchiveId(archive.id);
    setSpeechState("idle");
    setListeningHint("");
    setExportMessage(`已归档会话《${archive.sceneTemplateName}》，可进入协同回看。`);
  };

  const handleExport = () => {
    const content = buildExportContent(exportFormat, exportRange, exportTimelineSource);
    const filename = `qn-live-${exportFormat}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.txt`;
    downloadTextFile(filename, content || "当前没有可导出的内容。");
    setExportMessage(
      `已导出 ${EXPORT_FORMATS.find((item) => item.id === exportFormat)?.name} · ${exportSourceLabel}。`
    );
  };

  if (mode === "overlay") {
    return (
      <div className="overlay-shell">
        <SubtitleOverlay
          pipelineState={pipelineState}
          connectionState={connectionState}
          draftSubtitle={draftSubtitle}
          subtitles={timelineEntries.slice(-3)}
        />
      </div>
    );
  }

  const statusText =
    connectionState === "connected"
      ? isSessionActive
        ? pipelineState === "paused"
          ? "暂停流"
          : pipelineState === "processing"
            ? "持续处理中"
            : pipelineState === "listening"
              ? "开始监听"
              : "实时连接中"
        : "已就绪"
      : connectionState === "connecting"
        ? "连接中"
        : "连接已断开";

  return (
    <main className="app-shell">
      <NoticeStack
        notices={[
          { id: "last-error", tone: "error", message: lastError },
          { id: "speech-message", tone: "warn", message: speechMessage },
          { id: "listening-hint", tone: "info", message: listeningHint },
          { id: "export-message", tone: "success", message: exportMessage },
        ]}
      />

      <section className="workspace-grid tabbed-shell">
        {activeTab === "live" ? (
          <>
            <section className="hero-panel app-topbar">
              <div className="hero-copy">
                <p className="eyebrow">QN Live</p>
                <h1>实时同传</h1>
                <p className="hero-description">
                  {sceneTemplate.name} · {currentPair.short}
                </p>
              </div>

              <div className="hero-meta compact">
                <article className="hero-stat">
                  <span>状态</span>
                  <strong>{statusText}</strong>
                  <small>{currentPair.short}</small>
                </article>
                <article className="hero-stat">
                  <span>记录</span>
                  <strong>{sessionSummary.total}</strong>
                  <small>当前会话</small>
                </article>
                <article className="hero-stat">
                  <span>定稿</span>
                  <strong>{sessionSummary.finalized}</strong>
                  <small>可用于回看和导出</small>
                </article>
              </div>
            </section>

            <section className="panel launch-panel">
              <div className="panel-head">
                <div>
                  <p className="panel-kicker">设置</p>
                  <h2>语言、场景与关键词</h2>
                </div>
                <StatusPill tone={canSendCommands ? "online" : "offline"}>{connectionState}</StatusPill>
              </div>

              <details className="settings-drawer">
                <summary>
                  <span>{currentPair.short}</span>
                  <small>{sceneTemplate.name}</small>
                </summary>

                <div className="compact-select-stack">
                  <label className="text-field slim">
                    <span>翻译方向</span>
                    <select
                      value={currentPair.id}
                      onChange={(event) => {
                        const nextPair =
                          LANGUAGE_PAIRS.find((item) => item.id === event.target.value) || LANGUAGE_PAIRS[0];
                        applyPair(nextPair);
                      }}
                    >
                      {LANGUAGE_PAIRS.map((pair) => (
                        <option key={pair.id} value={pair.id}>
                          {pair.short}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-field slim">
                    <span>使用场景</span>
                    <select
                      value={sceneTemplateId}
                      onChange={(event) => applySceneTemplate(event.target.value)}
                    >
                      {SCENE_TEMPLATES.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="text-field">
                  <span>关键词</span>
                  <textarea
                    value={glossaryDraft}
                    onChange={(event) => setGlossaryDraft(event.target.value)}
                    placeholder="输入人名、品牌名、项目名、缩写、术语"
                  />
                </label>

                <div className="action-row">
                  <button type="button" className="secondary-button" onClick={handleGlossaryApply}>
                    保存关键词
                  </button>
                </div>

                <div className="divider" />

                <div className="deepseek-config">
                  <label className="text-field slim">
                    <span>DeepSeek API Key</span>
                    <small>
                      {deepseekConfigStatus.configured
                        ? `已配置：${deepseekConfigStatus.apiKeyPreview}`
                        : "未配置，将使用原文 fallback"}
                    </small>
                    <input
                      type="password"
                      value={deepseekApiKeyDraft}
                      onChange={(event) => setDeepseekApiKeyDraft(event.target.value)}
                      placeholder="sk-..."
                    />
                  </label>

                  <label className="text-field slim">
                    <span>管理员 Token</span>
                    <input
                      type="password"
                      value={adminTokenDraft}
                      onChange={(event) => setAdminTokenDraft(event.target.value)}
                      placeholder="QN_ADMIN_TOKEN"
                    />
                  </label>

                  <div className="action-row">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={deepseekApiKeySaving || !deepseekApiKeyDraft.trim() || !adminTokenDraft.trim()}
                      onClick={saveDeepseekConfig}
                    >
                      {deepseekApiKeySaving ? "保存中..." : "保存 Key"}
                    </button>
                  </div>
                </div>
              </details>
            </section>

            <section className="panel control-panel">
              <div className="panel-head">
                <div>
                  <p className="panel-kicker">{liveKickerText}</p>
                  <h2>同传控制</h2>
                </div>
                <div className="toggle-row">
                  <button
                    type="button"
                    className={`mini-toggle ${controls.recordEnabled ? "active" : ""}`}
                    onClick={handleToggleRecord}
                  >
                    录音 {controls.recordEnabled ? "开" : "关"}
                  </button>
                  <button
                    type="button"
                    className={`mini-toggle ${controls.ttsEnabled ? "active" : ""}`}
                    onClick={handleToggleTts}
                  >
                    播报 {controls.ttsEnabled ? "开" : "关"}
                  </button>
                </div>
              </div>

              <div className="compact-live-status">
                <span>{queueSummary.label}</span>
                <span>已记录 {timelineEntries.length} 句</span>
                <span>{currentConfidence.label}</span>
              </div>

              <div className="glossary-action manual-speech-action">
                <input
                  type="text"
                  value={manualSourceText}
                  onChange={(event) => setManualSourceText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      sendManualSpeech();
                    }
                  }}
                  placeholder="输入源文，按回车发送"
                />
                <button
                  type="button"
                  className="secondary-button"
                  disabled={!canSendCommands || !manualSourceText.trim()}
                  onClick={sendManualSpeech}
                >
                  发送
                </button>
              </div>

              <button type="button" className="secondary-button subtitle-modal-trigger" onClick={() => setSubtitleModalOpen(true)}>
                查看实时字幕
              </button>

              <section className="glossary-panel compact-glossary">
                <div className="glossary-head">
                  <div>
                    <span>会中动态关键词增强</span>
                    <strong>新增词即时影响后续翻译</strong>
                  </div>
                  <small>当前 {controls.glossary.length} 个</small>
                </div>
                <div className="glossary-action">
                  <input
                    type="text"
                    value={liveGlossaryDraft}
                    onChange={(event) => setLiveGlossaryDraft(event.target.value)}
                    placeholder="追加临时出现的人名、项目名、术语"
                  />
                  <button type="button" className="secondary-button" onClick={handleLiveGlossaryApply}>
                    会中追加
                  </button>
                </div>
                <GlossaryChips items={controls.glossary} />
              </section>

              <div className="control-footer">
                <div className="session-metrics">
                  <span>平均定稿时延 {sessionSummary.averageDelay ? `${(sessionSummary.averageDelay / 1000).toFixed(1)}s` : "--"}</span>
                  <span>已定稿 {sessionSummary.finalized}/{sessionSummary.total}</span>
                </div>
                <div className="transport-row">
                  <button
                    type="button"
                    className="primary-button"
                    disabled={!canSendCommands || !speechSupported || isSessionActive}
                    onClick={startAudioCapture}
                  >
                    开始
                  </button>
                  <button
                    type="button"
                    className="transport-button"
                    disabled={!canSendCommands || isSessionActive}
                    onClick={startMockSession}
                  >
                    模拟演示
                  </button>
                  <button type="button" className="transport-button" onClick={pauseAudioCapture}>
                    暂停
                  </button>
                  <button type="button" className="transport-button danger" onClick={stopRecordingSession}>
                    停止
                  </button>
                  <button type="button" className="transport-button ghost" onClick={reconnect}>
                    重连
                  </button>
                </div>
              </div>
            </section>

            {subtitleModalOpen ? (
              <div className="modal-backdrop" role="presentation" onClick={() => setSubtitleModalOpen(false)}>
                <section
                  className="subtitle-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="subtitle-modal-title"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="modal-head">
                    <div>
                      <p className="panel-kicker">实时字幕</p>
                      <h2 id="subtitle-modal-title">字幕预览</h2>
                    </div>
                    <button type="button" className="mini-toggle" onClick={() => setSubtitleModalOpen(false)}>
                      关闭
                    </button>
                  </div>

                  <div className="stage-grid control-stage-grid">
                    <article className="subtitle-card draft">
                      <div className="subtitle-topline">
                        <span>草稿</span>
                        <small>快速预览</small>
                      </div>
                      <p dir={textDirection(controls.targetLang)}>
                        {activeDraftTranslation || "等待新的草稿字幕..."}
                      </p>
                    </article>

                    <article className="subtitle-card final">
                      <div className="subtitle-topline">
                        <span>定稿</span>
                        <small>{latestTimelineEntry?.finalizedAt ? formatClock(latestTimelineEntry.finalizedAt) : "等待中"}</small>
                      </div>
                      <p dir={textDirection(controls.targetLang)}>
                        {activeFinalTranslation || "最终字幕会在句子稳定后出现"}
                      </p>
                    </article>
                  </div>
                </section>
              </div>
            ) : null}
          </>
        ) : null}

        {activeTab === "view" ? (
          <>
            <section className="panel role-panel">
              <div className="panel-head">
                <div>
                  <p className="panel-kicker">查看</p>
                  <h2>展示与记录</h2>
                </div>
              </div>

            <div className="screen-toolbar">
              <label className="text-field slim">
                <span>显示模式</span>
                <select value={activeScreenRoleView} onChange={(event) => setActiveRoleView(event.target.value)}>
                  {SCREEN_ROLE_VIEWS.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="screen-summary">
                <span>当前句 #{latestTimelineEntry ? latestTimelineEntry.sentenceIndex + 1 : "--"}</span>
                <span>总句数 {sessionSummary.total}</span>
                <span>已定稿 {sessionSummary.finalized}</span>
                <span>待确认 {revisionStats.reviewSentences}</span>
              </div>
            </div>

            <div className="role-surface">
              {activeScreenRoleView === "display" ? (
                <div className={`role-preview display-preview ${displayHighContrast ? "high-contrast" : ""}`}>
                  <div className="display-controls">
                    <button
                      type="button"
                      className={`mini-toggle ${displayMode === "bilingual" ? "active" : ""}`}
                      onClick={() => setDisplayMode("bilingual")}
                    >
                      双语
                    </button>
                    <button
                      type="button"
                      className={`mini-toggle ${displayMode === "targetOnly" ? "active" : ""}`}
                      onClick={() => setDisplayMode("targetOnly")}
                    >
                      仅译文
                    </button>
                    <button
                      type="button"
                      className={`mini-toggle ${displayDraftVisible ? "active" : ""}`}
                      onClick={() => setDisplayDraftVisible((value) => !value)}
                    >
                      草稿 {displayDraftVisible ? "显示" : "隐藏"}
                    </button>
                    <button
                      type="button"
                      className={`mini-toggle ${displayHighContrast ? "active" : ""}`}
                      onClick={() => setDisplayHighContrast((value) => !value)}
                    >
                      高对比
                    </button>
                  </div>
                  {displayMode === "bilingual" ? (
                    <p className="display-source" dir={textDirection(controls.sourceLang)}>
                      {activeSourceText || "源语将显示在这里"}
                    </p>
                  ) : null}
                  <div className="display-final" dir={textDirection(controls.targetLang)}>
                    {activeFinalTranslation || activeDraftTranslation || "投屏端将突出显示可读字幕"}
                  </div>
                  {displayDraftVisible ? (
                    <div className="display-draft">
                      {activeDraftTranslation || "草稿字幕等待中"}
                    </div>
                  ) : (
                    <div className="display-draft muted">草稿已隐藏，只展示更稳定的内容。</div>
                  )}
                </div>
              ) : null}

              {activeScreenRoleView === "observer" ? (
                <div className="role-preview observer-preview">
                  {timelineEntries.slice(-4).reverse().map((entry) => (
                    <article key={entry.sentenceId} className="observer-item">
                      <p>{entry.draftText || entry.displayText}</p>
                      <strong>{entry.finalText ? renderFinalDiff(entry.draftText, entry.finalText) : "待定稿"}</strong>
                      <small>{entry.finalText ? "已定稿" : "整理中"}</small>
                    </article>
                  ))}
                </div>
              ) : null}

              {activeScreenRoleView === "record" ? (
                <div className="role-preview record-preview">
                  <div className="record-header">
                    <span>记录端聚焦完整时间轴</span>
                    <strong>{timelineEntries.length} 条句子记录</strong>
                  </div>
                  <div className="record-points">
                    <span>首次出现</span>
                    <span>最近更新</span>
                    <span>定稿时间</span>
                  </div>
                  <div className="session-metrics compact">
                    <span>已记录 {timelineEntries.length}</span>
                    <span>已定稿 {sessionSummary.finalized}</span>
                  </div>
                  <div className="timeline-list record-timeline-list compact">
                    {timelineEntries.length ? (
                      timelineEntries.map((entry) => (
                        <article
                          id={`timeline-record-${entry.sentenceId}`}
                          key={entry.sentenceId}
                          className={`timeline-card ${entry.highVolatility ? "volatile" : ""} ${
                            focusedSentenceId === entry.sentenceId ? "focused" : ""
                          }`}
                        >
                          <div className="timeline-head">
                            <strong>#{entry.sentenceIndex + 1}</strong>
                            <div className="timeline-badges">
                              <span className={`timeline-badge ${entry.isFinal ? "final" : "live"}`}>
                                {entry.isFinal ? "已定稿" : "整理中"}
                              </span>
                              {entry.highVolatility ? <span className="timeline-badge risk">需确认</span> : null}
                            </div>
                          </div>
                          <p className="timeline-source" dir={textDirection(entry.sourceLang)}>
                            {entry.sourceText || "原文等待中"}
                          </p>
                          <p className="timeline-target" dir={textDirection(entry.targetLang)}>
                            {entry.finalText
                              ? renderFinalDiff(entry.draftText, entry.finalText)
                              : entry.displayText || "译文等待中"}
                          </p>
                          <RevisionTrack
                            history={entry.history}
                            formatTimestamp={formatClock}
                            renderLabel={renderHistoryLabel}
                          />
                          <div className="timeline-meta">
                            <span>首次出现 {formatClock(entry.firstSeenAt)}</span>
                            <span>最近更新 {formatClock(entry.latestUpdatedAt)}</span>
                            <span>定稿 {formatClock(entry.finalizedAt)}</span>
                          </div>
                          <p className={`timeline-confidence ${getConfidenceState(entry).tone}`}>
                            {getConfidenceState(entry).label} · {getConfidenceState(entry).detail}
                          </p>
                        </article>
                      ))
                    ) : (
                      <EmptyState title="暂无时间轴记录" description="开始同传后，这里会沉淀完整逐句记录。" />
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </section>
            <section className="panel timeline-panel">
              <div className="panel-head">
                <div>
                  <p className="panel-kicker">逐句内容</p>
                  <h2>原文与译文</h2>
                </div>
                <small className="panel-note">最新内容在前</small>
              </div>

              <div className="timeline-list compact">
                {timelineEntries.length ? (
                  timelineEntries
                    .slice()
                    .reverse()
                    .slice(0, 3)
                    .map((entry) => (
                      <article
                        id={`timeline-${entry.sentenceId}`}
                        key={entry.sentenceId}
                        className={`timeline-card ${entry.highVolatility ? "volatile" : ""} ${
                          focusedSentenceId === entry.sentenceId ? "focused" : ""
                        }`}
                      >
                        <div className="timeline-head">
                          <strong>#{entry.sentenceIndex + 1}</strong>
                          <div className="timeline-badges">
                            <span className={`timeline-badge ${entry.isFinal ? "final" : "live"}`}>
                              {entry.isFinal ? "已定稿" : "整理中"}
                            </span>
                            {entry.highVolatility ? <span className="timeline-badge risk">需确认</span> : null}
                          </div>
                        </div>
                        <p className="timeline-source" dir={textDirection(entry.sourceLang)}>
                          {entry.sourceText || "原文等待中"}
                        </p>
                        <p className="timeline-target" dir={textDirection(entry.targetLang)}>
                          {entry.finalText
                            ? renderFinalDiff(entry.draftText, entry.finalText)
                            : entry.displayText || "译文等待中"}
                        </p>
                        <div className="timeline-meta">
                          <span>首次出现 {formatClock(entry.firstSeenAt)}</span>
                          <span>定稿 {formatClock(entry.finalizedAt)}</span>
                        </div>
                        <p className={`timeline-confidence ${getConfidenceState(entry).tone}`}>
                          {getConfidenceState(entry).label} · {getConfidenceState(entry).detail}
                        </p>
                      </article>
                    ))
                ) : (
                  <EmptyState title="暂无时间轴记录" description="开始同传后，这里会逐句沉淀可信过程。" />
                )}
              </div>
            </section>

          </>
        ) : null}

        {activeTab === "review" ? (
          <section className="panel review-panel">
            <div className="panel-head">
              <div>
                <p className="panel-kicker">协同回看</p>
                <h2>历史会话复盘</h2>
              </div>
            </div>

            <div className="review-toolbar compact">
              <label className="text-field slim">
                <span>会话来源</span>
                <select value={selectedArchiveId} onChange={(event) => setSelectedArchiveId(event.target.value)}>
                  <option value="">当前会话</option>
                  {archivedSessions.length ? (
                    archivedSessions.map((archive) => (
                      <option key={archive.id} value={archive.id}>
                        {archive.sceneTemplateName} · {archive.pairLabel} · {formatClock(archive.createdAt)}
                      </option>
                    ))
                  ) : (
                    <option value="">暂无归档会话</option>
                  )}
                </select>
              </label>

              <label className="text-field slim">
                <span>查看方式</span>
                <select value={reviewRoleId} onChange={(event) => setReviewRoleId(event.target.value)}>
                  {REVIEW_ROLES.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedArchive || !hasSelectedArchive ? (
              <div className="review-surface">
                <div className="review-summary compact">
                  <article className="review-card">
                    <span>会话</span>
                    <strong>{reviewSessionName}</strong>
                    <p>{reviewPairLabel}</p>
                    <small>
                      已定稿 {reviewSummarySource.finalized}/{reviewSummarySource.total}
                    </small>
                  </article>
                  <article className="review-card">
                    <span>视角</span>
                    <strong>{REVIEW_ROLES.find((item) => item.id === reviewRoleId)?.name}</strong>
                    <p>{archivedRoleView.headline}</p>
                  </article>
                  <article className="review-card">
                    <span>待确认</span>
                    <strong>{reviewVolatileCount}</strong>
                    <p>建议人工确认的句子</p>
                  </article>
                </div>

                <div className="review-list compact">
                  {reviewEntries.length ? (
                    reviewEntries.map((entry) => (
                      <article key={`${hasSelectedArchive ? selectedArchive.id : "current"}-${entry.sentenceId}`} className="review-item">
                        <div className="timeline-head">
                          <strong>#{entry.sentenceIndex + 1}</strong>
                          <div className="timeline-badges">
                            <span className="timeline-badge final">
                              {entry.finalText ? "已定稿" : "整理中"}
                            </span>
                            {entry.highVolatility ? <span className="timeline-badge risk">需确认</span> : null}
                          </div>
                        </div>
                        <p className="timeline-source" dir={textDirection(entry.sourceLang)}>
                          {entry.sourceText}
                        </p>
                        <p className="timeline-target" dir={textDirection(entry.targetLang)}>
                          {entry.finalText ? renderFinalDiff(entry.draftText, entry.finalText) : entry.displayText}
                        </p>
                        <div className="timeline-meta">
                          <span>首次出现 {formatClock(entry.firstSeenAt)}</span>
                          <span>定稿 {formatClock(entry.finalizedAt)}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <EmptyState title="当前角色暂无匹配内容" description="停止一场会话后，这里会按角色组织历史结果。" />
                  )}
                </div>

                <div className="digest-grid review-digest-grid">
                  <article className="digest-card">
                    <span>历史摘要</span>
                    <strong>自动整理</strong>
                    {(reviewDigestSource.summary || []).map((item, index) => (
                      <p key={`archive-summary-${index}`}>{item}</p>
                    ))}
                  </article>
                  <article className="digest-card">
                    <span>角色关注术语</span>
                    <strong>重点词</strong>
                    <GlossaryChips
                      variant="correction"
                      items={(reviewDigestSource.topics || []).map((item) => ({
                        key: `archive-topic-${item}`,
                        label: item,
                      }))}
                    />
                  </article>
                  <article className="digest-card">
                    <span>会后待办</span>
                    <strong>{(reviewDigestSource.todo || []).length} 项</strong>
                    {(reviewDigestSource.todo || []).map((item, index) => (
                      <p key={`archive-todo-${index}`}>{item}</p>
                    ))}
                  </article>
                </div>
              </div>
            ) : (
              <EmptyState title="暂无可回看的归档会话" description="先完成并停止一场会话，系统会自动归档到这里。" />
            )}
          </section>
        ) : null}

        {activeTab === "export" ? (
          <ExportTab
            archivedSessions={archivedSessions}
            exportDigestSource={exportDigestSource}
            exportFormat={exportFormat}
            exportFormats={EXPORT_FORMATS}
            exportRange={exportRange}
            exportRanges={EXPORT_RANGES}
            exportSessionLabel={exportSessionLabel}
            exportSource={exportSource}
            exportSourceLabel={exportSourceLabel}
            exportTimelineSource={exportTimelineSource}
            formatClock={formatClock}
            onArchiveChange={setSelectedArchiveId}
            onExport={handleExport}
            onExportFormatChange={setExportFormat}
            onExportRangeChange={setExportRange}
            onExportSourceChange={setExportSource}
            onTodoNavigate={handleTodoNavigate}
            selectedArchiveId={selectedArchiveId}
          />
        ) : null}
      </section>

      <BottomNav tabs={APP_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
