import { useEffect, useRef, useState } from "react";

const LOCAL_STREAM_URL = "http://127.0.0.1:8000/api/stream";

function isLoopbackHost(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost";
}

function shouldUseLocalBackendUrl(parsed) {
  return (
    isLoopbackHost(parsed.hostname) &&
    parsed.pathname === "/api/stream" &&
    parsed.port !== "8000"
  );
}

export function normalizeSocketUrl(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    return LOCAL_STREAM_URL;
  }

  const candidate = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  const parsed = new URL(candidate);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("服务地址必须是 http:// 或 https://");
  }

  if (!parsed.pathname || parsed.pathname === "/") {
    parsed.pathname = "/api/stream";
  }

  return parsed.toString();
}

export function getDefaultSocketUrl() {
  const envUrl = import.meta.env.VITE_QN_STREAM_URL;
  if (envUrl) {
    return normalizeSocketUrl(envUrl);
  }

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get("stream");
    if (queryUrl) {
      return normalizeSocketUrl(queryUrl);
    }

    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      const sameOriginStreamUrl = normalizeSocketUrl(`${window.location.origin}/api/stream`);
      const parsed = new URL(sameOriginStreamUrl);
      if (shouldUseLocalBackendUrl(parsed)) {
        return LOCAL_STREAM_URL;
      }
      return sameOriginStreamUrl;
    }
  }

  return LOCAL_STREAM_URL;
}

export function socketUrlToHttpUrl(streamUrl, path = "/api/health") {
  const parsed = new URL(streamUrl);
  parsed.pathname = path;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function getApiUrl(streamUrl, path) {
  const parsed = new URL(streamUrl);
  parsed.pathname = path;
  parsed.search = "";
  parsed.hash = "";
  return parsed.toString();
}

function getSentenceKey(payload) {
  return payload.sentenceId || payload.sentenceIndex || payload.timestamp || payload.text;
}

function buildRevisionEntry(payload) {
  return {
    kind: payload.isFinal ? "final" : "draft",
    revision: Number(payload.revision ?? 1),
    text: payload.finalText || payload.draftText || payload.displayText || payload.text || "",
    timestamp: Number(payload.timestamp || Date.now()),
  };
}

function estimateVolatility(record) {
  const settleDurationMs =
    record.finalizedAt && record.firstSeenAt
      ? Math.max(0, record.finalizedAt - record.firstSeenAt)
      : 0;

  return (
    Number(record.revisionCount || 0) >= 3 ||
    Number(record.sourceRevisionCount || 0) >= 4 ||
    settleDurationMs >= 5000
  );
}

function upsertSourceRecord(current, payload) {
  const sentenceKey = getSentenceKey(payload);
  const timestamp = Number(payload.timestamp || Date.now());
  const existing = current.find((item) => getSentenceKey(item) === sentenceKey);
  const nextItem = {
    ...existing,
    ...payload,
    firstSeenAt: existing?.firstSeenAt || timestamp,
    sourceFirstSeenAt: existing?.sourceFirstSeenAt || timestamp,
    sourceLastUpdatedAt: timestamp,
    sourceRevisionCount: Math.max(existing?.sourceRevisionCount || 0, Number(payload.revision ?? 1)),
    sourceText: payload.sourceText || payload.text || existing?.sourceText || "",
    draftText: existing?.draftText || "",
    finalText: existing?.finalText || "",
    lastUpdatedAt: Math.max(existing?.lastUpdatedAt || 0, timestamp),
  };
  nextItem.highVolatility = estimateVolatility(nextItem);
  const next = [
    ...current.filter((item) => getSentenceKey(item) !== sentenceKey),
    nextItem,
  ];
  next.sort((left, right) => (left.sentenceIndex ?? 0) - (right.sentenceIndex ?? 0));
  return next.slice(-120);
}

function upsertSubtitle(current, payload) {
  const sentenceKey = getSentenceKey(payload);
  const timestamp = Number(payload.timestamp || Date.now());
  const existing = current.find((item) => getSentenceKey(item) === sentenceKey);
  const nextHistory = [...(existing?.history || [])];
  const nextEntry = buildRevisionEntry(payload);
  const lastEntry = nextHistory[nextHistory.length - 1];
  if (
    !lastEntry ||
    lastEntry.kind !== nextEntry.kind ||
    lastEntry.revision !== nextEntry.revision ||
    lastEntry.text !== nextEntry.text
  ) {
    nextHistory.push(nextEntry);
  }

  const nextItem = {
    ...existing,
    ...payload,
    firstSeenAt: existing?.firstSeenAt || timestamp,
    firstDraftAt:
      existing?.firstDraftAt || (!payload.isFinal ? timestamp : existing?.firstDraftAt || timestamp),
    finalizedAt: payload.isFinal ? timestamp : existing?.finalizedAt || null,
    revisionCount: Math.max(existing?.revisionCount || 0, Number(payload.revision ?? 1)),
    sourceRevisionCount: Math.max(
      existing?.sourceRevisionCount || 0,
      Number(payload.sourceRevisionCount ?? existing?.sourceRevisionCount ?? 0)
    ),
    lastUpdatedAt: timestamp,
    sourceLastUpdatedAt: existing?.sourceLastUpdatedAt || timestamp,
    history: nextHistory.slice(-12),
  };
  nextItem.highVolatility = estimateVolatility(nextItem);
  const next = [
    ...current.filter((item) => getSentenceKey(item) !== sentenceKey),
    nextItem,
  ];
  next.sort((left, right) => (left.sentenceIndex ?? 0) - (right.sentenceIndex ?? 0));
  return next.slice(-120);
}

export function useWebSocket({ initialControls, socketUrl }) {
  const eventSourceRef = useRef(null);
  const reconnectRef = useRef(null);
  const everConnectedRef = useRef(false);
  const initialControlsRef = useRef(initialControls);
  const [reconnectToken, setReconnectToken] = useState(0);
  const [connectionState, setConnectionState] = useState("connecting");
  const [pipelineState, setPipelineState] = useState("idle");
  const [draftSubtitle, setDraftSubtitle] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [sourcePreview, setSourcePreview] = useState("");
  const [pipelineMetrics, setPipelineMetrics] = useState({
    draftBacklog: 0,
    finalBacklog: 0,
  });
  const [lastError, setLastError] = useState("");
  const [activeSocketUrl, setActiveSocketUrl] = useState(socketUrl);

  useEffect(() => {
    initialControlsRef.current = initialControls;
  }, [initialControls]);

  useEffect(() => {
    let active = true;
    setActiveSocketUrl(socketUrl);

    const connect = () => {
      if (!active) {
        return;
      }

      const eventSource = new EventSource(socketUrl);
      eventSourceRef.current = eventSource;
      setConnectionState("connecting");
      setLastError("");

      eventSource.addEventListener("open", () => {
        setConnectionState("connected");
        everConnectedRef.current = true;
        setLastError("");
        void sendControl({ action: "config", ...initialControlsRef.current }, socketUrl);
      });

      eventSource.addEventListener("message", (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "status") {
          const nextState = payload.state || "idle";
          setPipelineState(nextState);
          setPipelineMetrics({
            draftBacklog: Number(payload.draftBacklog || 0),
            finalBacklog: Number(payload.finalBacklog || 0),
          });
          if (nextState === "stopped" || nextState === "idle") {
            setDraftSubtitle(null);
            setSourcePreview("");
          }
          return;
        }

        if (payload.type === "source_update") {
          setSubtitles((current) => upsertSourceRecord(current, payload));
          setSourcePreview(payload.text || "");
          return;
        }

        if (payload.type === "preview_update") {
          setDraftSubtitle(payload);
          setSourcePreview(payload.sourceText || "");
          return;
        }

        if (payload.type === "subtitle_update") {
          setSubtitles((current) => upsertSubtitle(current, payload));
          if (payload.isFinal) {
            setDraftSubtitle((current) =>
              getSentenceKey(current || {}) === getSentenceKey(payload) ? null : current
            );
            setSourcePreview(payload.sourceText || "");
          } else {
            setDraftSubtitle(payload);
          }
          return;
        }

        if (payload.type === "error") {
          setLastError(payload.message || "未知错误");
        }
      });

      eventSource.addEventListener("heartbeat", () => {});

      eventSource.addEventListener("error", () => {
        if (!active) {
          return;
        }
        setConnectionState(everConnectedRef.current ? "connecting" : "disconnected");
        setPipelineState("idle");
        setLastError(
          everConnectedRef.current
            ? "SSE 正在重连，请稍候。"
            : "SSE 连接失败，请检查服务地址、证书或后端进程。"
        );
        eventSource.close();
        reconnectRef.current = window.setTimeout(connect, 1500);
      });
    };

    connect();

    return () => {
      active = false;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
      }
      eventSourceRef.current?.close();
    };
  }, [socketUrl, reconnectToken]);

  const postJson = async (path, payload, streamUrl = activeSocketUrl) => {
    const apiUrl = getApiUrl(streamUrl, path);
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  };

  const sendControl = async (payload, streamUrl = activeSocketUrl) => {
    try {
      return await postJson("/api/control", payload, streamUrl);
    } catch (error) {
      setLastError(
        error instanceof Error
          ? `发送控制指令失败: ${error.message}`
          : "发送控制指令失败。"
      );
      return null;
    }
  };

  const sendRealtimeStart = async (payload, streamUrl = activeSocketUrl) => {
    try {
      return await postJson("/api/realtime/start", payload, streamUrl);
    } catch (error) {
      setLastError(
        error instanceof Error
          ? `启动实时识别失败: ${error.message}`
          : "启动实时识别失败。"
      );
      return null;
    }
  };

  const sendRealtimeChunk = async (payload, streamUrl = activeSocketUrl) => {
    try {
      return await postJson("/api/realtime/chunk", payload, streamUrl);
    } catch (error) {
      if (error instanceof Error && error.message === "HTTP 202") {
        return { status: "ignored" };
      }
      setLastError(
        error instanceof Error
          ? `上传音频分片失败: ${error.message}`
          : "上传音频分片失败。"
      );
      return null;
    }
  };

  const sendRealtimePause = async (streamUrl = activeSocketUrl) => {
    try {
      return await postJson("/api/realtime/pause", {}, streamUrl);
    } catch (error) {
      setLastError(
        error instanceof Error
          ? `暂停实时识别失败: ${error.message}`
          : "暂停实时识别失败。"
      );
      return null;
    }
  };

  const sendRealtimeFinish = async (streamUrl = activeSocketUrl) => {
    try {
      return await postJson("/api/realtime/finish", {}, streamUrl);
    } catch (error) {
      setLastError(
        error instanceof Error
          ? `结束实时识别失败: ${error.message}`
          : "结束实时识别失败。"
      );
      return null;
    }
  };

  const getSessionSummary = async (payload, streamUrl = activeSocketUrl) => {
    try {
      return await postJson("/api/session/summary", payload, streamUrl);
    } catch (error) {
      setLastError(
        error instanceof Error
          ? `生成会后整理失败: ${error.message}`
          : "生成会后整理失败。"
      );
      return null;
    }
  };

  return {
    connectionState,
    pipelineState,
    draftSubtitle,
    subtitles,
    sourcePreview,
    pipelineMetrics,
    lastError,
    activeSocketUrl,
    reconnect: () => setReconnectToken((current) => current + 1),
    sendStart: (controls) => sendControl({ action: "start", ...controls }),
    sendPause: () => sendControl({ action: "pause" }),
    sendStop: () => sendControl({ action: "stop" }),
    sendConfig: (controls) => sendControl({ action: "config", ...controls }),
    sendCommand: sendControl,
    sendRealtimeStart,
    sendRealtimeChunk,
    sendRealtimePause,
    sendRealtimeFinish,
    getSessionSummary,
  };
}
