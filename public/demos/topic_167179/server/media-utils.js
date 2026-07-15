const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const CONFIG = require('../renderer/config');
const { analyzeScript } = require('./analyze-adapter');

const TRANSFORM_DIR = '/Users/hutianwei/Documents/trae motion/transform';
const FFMPEG_BIN_DIR = path.dirname(CONFIG.ffmpegPath);
const PYTHON = path.join(TRANSFORM_DIR, 'venv', 'bin', 'python');
const TRANSCRIBE = path.join(TRANSFORM_DIR, 'transcribe.py');
const ALIGN_THRESHOLD = 0.4;

/**
 * 获取媒体时长（秒）
 */
function getMediaDuration(filePath) {
  const cmd = `"${CONFIG.ffprobePath}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const out = execSync(cmd, { encoding: 'utf8' });
  return parseFloat(out.trim()) || 0;
}

/**
 * 调用 transform 目录下的 Whisper 脚本做语音识别
 * 自动把本机 ffmpeg 目录加入 PATH
 */
function runWhisper(mediaPath, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const env = {
    ...process.env,
    PATH: `${FFMPEG_BIN_DIR}${path.delimiter}${process.env.PATH || ''}`,
    PYTHONIOENCODING: 'utf-8',
  };

  const args = [
    TRANSCRIBE,
    mediaPath,
    '--model', 'tiny',
    '--language', 'zh',
    '--format', 'json',
    '--output-dir', outputDir,
  ];

  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON, args, { env, cwd: TRANSFORM_DIR });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Whisper 识别失败 (code=${code}): ${stderr || stdout}`));
      }
      const baseName = path.basename(mediaPath, path.extname(mediaPath));
      const jsonPath = path.join(outputDir, `${baseName}.json`);
      if (!fs.existsSync(jsonPath)) {
        return reject(new Error('Whisper 未生成 JSON 输出'));
      }
      const result = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      resolve(normalizeSegments(result.segments || result));
    });
  });
}

/**
 * 解析 SRT 字幕
 */
function parseSRT(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const segments = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].trim() === '') { i++; continue; }
    i++; // 序号行
    if (i >= lines.length) break;
    const timeLine = lines[i];
    const m = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
    i++;
    if (!m) continue;
    const textLines = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i].trim());
      i++;
    }
    segments.push({
      start: parseSRTTime(m[1]),
      end: parseSRTTime(m[2]),
      text: textLines.join(' '),
    });
    i++;
  }
  return segments;
}

function parseSRTTime(t) {
  const m = t.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 3600 +
         parseInt(m[2], 10) * 60 +
         parseInt(m[3], 10) +
         parseInt(m[4], 10) / 1000;
}

/**
 * 解析 JSON 字幕：支持 Whisper 完整结果或直接 segments 数组
 */
function parseSubtitleJSON(obj) {
  if (Array.isArray(obj)) return normalizeSegments(obj);
  if (obj && Array.isArray(obj.segments)) return normalizeSegments(obj.segments);
  if (obj && Array.isArray(obj.results)) return normalizeSegments(obj.results);
  return [];
}

function normalizeSegments(segments) {
  return segments.map((s) => ({
    start: typeof s.start === 'number' ? s.start : 0,
    end: typeof s.end === 'number' ? s.end : 0,
    text: (s.text || '').trim(),
  })).filter((s) => s.text);
}

/**
 * 将正式口播稿拆成句子
 */
function splitSentences(script) {
  const matches = script.match(/[^。！？；\n]+[。！？；]?/g);
  if (!matches) return [];
  return matches.map((s) => s.trim()).filter((s) => s.length > 0);
}

function normalizeText(text) {
  return text.replace(/\s+/g, '').replace(/[，,。.！？；、：:；""''（）()【】]/g, '').toLowerCase();
}

/**
 * 最长公共子序列长度
 */
function lcsLength(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0 || n === 0) return 0;
  const prev = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const curr = new Array(n + 1).fill(0);
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        curr[j] = prev[j - 1] + 1;
      } else {
        curr[j] = Math.max(prev[j], curr[j - 1]);
      }
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

function similarity(a, b) {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na.length === 0 || nb.length === 0) return 0;
  const lcs = lcsLength(na, nb);
  return lcs / Math.max(na.length, nb.length);
}

/**
 * 将正式稿句子与语音识别/字幕片段对齐
 */
function alignSentences(sentences, segments) {
  if (!segments || segments.length === 0) {
    return sentences.map((sentence) => ({
      sentence,
      start: null,
      end: null,
      score: 0,
      segmentIndex: null,
      aligned: false,
    }));
  }

  let lastSegIdx = 0;
  const aligned = sentences.map((sentence) => {
    let bestIdx = -1;
    let bestScore = -1;
    for (let i = lastSegIdx; i < segments.length; i++) {
      const score = similarity(sentence, segments[i].text);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestScore >= ALIGN_THRESHOLD) {
      lastSegIdx = bestIdx;
      return {
        sentence,
        start: segments[bestIdx].start,
        end: segments[bestIdx].end,
        score: bestScore,
        segmentIndex: bestIdx,
        aligned: true,
      };
    }

    return {
      sentence,
      start: null,
      end: null,
      score: bestScore,
      segmentIndex: null,
      aligned: false,
    };
  });

  // 同一段被多个连续句子命中时，按句子长度在段内均分时间
  let i = 0;
  while (i < aligned.length) {
    const segIdx = aligned[i].segmentIndex;
    if (segIdx === null) { i++; continue; }
    let j = i;
    while (j < aligned.length && aligned[j].segmentIndex === segIdx) j++;
    const group = aligned.slice(i, j);
    const seg = segments[segIdx];
    const totalLen = group.reduce((sum, s) => sum + s.sentence.length, 0);
    let acc = 0;
    group.forEach((s) => {
      const ratio = totalLen > 0 ? acc / totalLen : 0;
      s.start = seg.start + (seg.end - seg.start) * ratio;
      acc += s.sentence.length;
    });
    i = j;
  }

  return aligned;
}

/**
 * 基于正式稿识别包装点，并把每个点绑定到句子时间
 */
async function identifyAndBindPackagingPoints(scriptText, alignedSentences, options = {}) {
  const analysis = await analyzeScript(scriptText, { maxResults: 50, ...options });
  const results = analysis.results || [];

  // 计算每个句子在正式稿中的字符起止位置
  let offset = 0;
  const sentenceRanges = alignedSentences.map((s) => {
    const start = scriptText.indexOf(s.sentence, offset);
    const end = start >= 0 ? start + s.sentence.length : offset;
    if (start >= 0) offset = end;
    return { start, end };
  });

  return results.map((r) => {
    const pointStart = r.startIndex || 0;
    // 找到包含该包装点起始位置的句子
    let sentenceIdx = -1;
    for (let i = 0; i < sentenceRanges.length; i++) {
      if (pointStart >= sentenceRanges[i].start && pointStart < sentenceRanges[i].end) {
        sentenceIdx = i;
        break;
      }
    }

    const time = sentenceIdx >= 0 && alignedSentences[sentenceIdx].aligned
      ? alignedSentences[sentenceIdx].start
      : null;

    return {
      ...r,
      time,
      sentenceIndex: sentenceIdx,
      aligned: time !== null,
    };
  });
}

module.exports = {
  getMediaDuration,
  runWhisper,
  parseSRT,
  parseSubtitleJSON,
  splitSentences,
  alignSentences,
  identifyAndBindPackagingPoints,
};
