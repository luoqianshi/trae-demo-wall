const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

function resolveBinary(name, envName, localFallback) {
  if (process.env[envName]) return process.env[envName];

  try {
    return execFileSync('which', [name], { encoding: 'utf8' }).trim();
  } catch (_) {
    return fs.existsSync(localFallback) ? localFallback : name;
  }
}

const TRAE_FFMPEG_DIR = '/Users/hutianwei/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/vm/tools/opt/ffmpeg/8.1.2/bin';

const CONFIG = {
  root: ROOT,
  width: 1080,
  height: 1700,
  fps: 25,
  defaultDuration: 3.0,

  ffmpegPath: resolveBinary('ffmpeg', 'FFMPEG_PATH', path.join(TRAE_FFMPEG_DIR, 'ffmpeg')),
  ffprobePath: resolveBinary('ffprobe', 'FFPROBE_PATH', path.join(TRAE_FFMPEG_DIR, 'ffprobe')),

  chromePath: (() => {
    const p = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    return fs.existsSync(p) ? p : undefined;
  })(),

  themes: {
    amber: { primary: '#f59e0b', primaryGlow: 'rgba(245,158,11,0.15)', accent: '#f59e0b', text: '#ffffff', muted: '#9ca3af' },
    blue: { primary: '#3b82f6', primaryGlow: 'rgba(59,130,246,0.15)', accent: '#3b82f6', text: '#ffffff', muted: '#9ca3af' }
  },

  getTemplateDir(templateId) {
    return path.join(ROOT, 'templates', templateId);
  },

  outputRoot: path.join(ROOT, 'output'),

  getDistDir(templateId) {
    return path.join(ROOT, 'output', templateId);
  },

  getOutputPath(templateId, suffix = 'sample') {
    return path.join(ROOT, 'output', templateId, `${suffix}.mov`);
  }
};

module.exports = CONFIG;
