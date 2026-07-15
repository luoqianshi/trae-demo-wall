const fs = require('fs');
const path = require('path');
const { parseMultipart } = require('./multipart');
const {
  getMediaDuration,
  runWhisper,
  parseSRT,
  parseSubtitleJSON,
  splitSentences,
  alignSentences,
  identifyAndBindPackagingPoints,
} = require('./media-utils');
const { renderTrack } = require('../renderer/render-track');
const { generateUUID } = require('../analyzer/src/utils/uuid');

const ROOT = path.join(__dirname, '..');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

// 内存会话：上传文件、字幕、对齐结果、包装点
const sessions = {};

function sendJSON(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function getSession(req) {
  const sid = req.headers['x-session-id'];
  return sessions[sid] || null;
}

function ensureSession(req) {
  const sid = req.headers['x-session-id'] || generateUUID();
  if (!sessions[sid]) {
    sessions[sid] = { id: sid, createdAt: Date.now() };
  }
  return sessions[sid];
}

async function handleUploadMedia(req, res) {
  try {
    const { files } = await parseMultipart(req, path.join(UPLOAD_DIR, 'media'));
    const file = files.media;
    if (!file) return sendJSON(res, 400, { status: 'error', error: '缺少 media 文件' });

    const session = ensureSession(req);
    session.mediaPath = file.path;
    session.mediaName = file.filename;
    session.duration = getMediaDuration(file.path);

    sendJSON(res, 200, {
      status: 'ok',
      sessionId: session.id,
      filename: file.filename,
      duration: session.duration,
    });
  } catch (err) {
    sendJSON(res, 500, { status: 'error', error: err.message });
  }
}

async function handleUploadScript(req, res) {
  try {
    const { fields, files } = await parseMultipart(req, path.join(UPLOAD_DIR, 'scripts'));
    const session = ensureSession(req);

    let text = '';
    if (fields.scriptText) {
      text = fields.scriptText;
    } else if (files.scriptFile) {
      text = fs.readFileSync(files.scriptFile.path, 'utf8');
    } else {
      return sendJSON(res, 400, { status: 'error', error: '缺少正式口播稿' });
    }

    session.scriptText = text.trim();
    sendJSON(res, 200, {
      status: 'ok',
      sessionId: session.id,
      wordCount: session.scriptText.length,
    });
  } catch (err) {
    sendJSON(res, 500, { status: 'error', error: err.message });
  }
}

async function handleUploadSubtitle(req, res) {
  try {
    const { files } = await parseMultipart(req, path.join(UPLOAD_DIR, 'subtitles'));
    const file = files.subtitleFile;
    if (!file) return sendJSON(res, 400, { status: 'error', error: '缺少字幕文件' });

    const ext = path.extname(file.filename).toLowerCase();
    const content = fs.readFileSync(file.path, 'utf8');
    let segments = [];

    if (ext === '.srt') {
      segments = parseSRT(content);
    } else if (ext === '.json') {
      segments = parseSubtitleJSON(JSON.parse(content));
    } else {
      return sendJSON(res, 400, { status: 'error', error: '仅支持 .srt 或 .json 字幕文件' });
    }

    const session = ensureSession(req);
    session.subtitleSegments = segments;

    sendJSON(res, 200, {
      status: 'ok',
      sessionId: session.id,
      segments,
      source: 'subtitle',
    });
  } catch (err) {
    sendJSON(res, 500, { status: 'error', error: err.message });
  }
}

async function handleTranscribe(req, res) {
  try {
    const session = getSession(req);
    if (!session || !session.mediaPath) {
      return sendJSON(res, 400, { status: 'error', error: '请先上传媒体文件' });
    }

    const outputDir = path.join(UPLOAD_DIR, 'whisper', session.id);
    const segments = await runWhisper(session.mediaPath, outputDir);
    session.subtitleSegments = segments;

    sendJSON(res, 200, {
      status: 'ok',
      sessionId: session.id,
      segments,
      source: 'whisper',
    });
  } catch (err) {
    sendJSON(res, 500, {
      status: 'error',
      error: err.message,
      hint: '可改用上传 .srt 或 .json 字幕文件继续后续流程',
    });
  }
}

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; if (body.length > 1024 * 1024) reject(new Error('请求体过大')); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('无效的 JSON 请求体'));
      }
    });
    req.on('error', reject);
  });
}

async function handleAlign(req, res) {
  try {
    const session = getSession(req);
    if (!session) return sendJSON(res, 400, { status: 'error', error: '会话不存在' });
    if (!session.scriptText) return sendJSON(res, 400, { status: 'error', error: '请先上传正式口播稿' });

    const body = await parseJSONBody(req);
    const kimiOptions = body.kimiEnabled && body.kimiApiKey
      ? { provider: 'kimi', apiKey: body.kimiApiKey, mode: body.kimiMode || 'rules-first' }
      : {};

    const segments = session.subtitleSegments || [];
    const sentences = splitSentences(session.scriptText);
    const aligned = alignSentences(sentences, segments);
    const packagingPoints = await identifyAndBindPackagingPoints(session.scriptText, aligned, kimiOptions);

    session.aligned = aligned;
    session.packagingPoints = packagingPoints;

    sendJSON(res, 200, {
      status: 'ok',
      sessionId: session.id,
      duration: session.duration || 0,
      aligned,
      packagingPoints: packagingPoints.map((p) => ({
        id: p.id,
        type: p.type,
        text: p.text,
        displayText: p.extractedData && p.extractedData.displayText ? p.extractedData.displayText : p.text,
        suggestedTemplate: p.suggestedTemplate,
        time: p.time,
        aligned: p.aligned,
        confidence: p.confidence,
      })),
      unaligned: {
        sentences: aligned.filter((s) => !s.aligned).map((s) => s.sentence),
        packagingPoints: packagingPoints.filter((p) => !p.aligned).map((p) => p.text),
      },
    });
  } catch (err) {
    sendJSON(res, 500, { status: 'error', error: err.message });
  }
}

async function handleRenderTrack(req, res) {
  try {
    const session = getSession(req);
    if (!session) return sendJSON(res, 400, { status: 'error', error: '会话不存在' });
    if (!session.packagingPoints || !session.duration) {
      return sendJSON(res, 400, { status: 'error', error: '请先完成对齐全息' });
    }

    const trackId = `track_${Date.now()}`;
    const result = await renderTrack(session.packagingPoints, session.duration, trackId);

    const fileName = path.basename(result.file);
    sendJSON(res, 200, {
      status: 'ok',
      sessionId: session.id,
      trackId,
      downloadUrl: `/output/track/${fileName}`,
      outputPath: result.file,
      verify: result,
    });
  } catch (err) {
    sendJSON(res, 500, { status: 'error', error: err.message });
  }
}

module.exports = {
  handleUploadMedia,
  handleUploadScript,
  handleUploadSubtitle,
  handleTranscribe,
  handleAlign,
  handleRenderTrack,
};
