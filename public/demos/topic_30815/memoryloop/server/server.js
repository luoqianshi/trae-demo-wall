/**
 * Memory Loop Server
 * Zero-dependency local server (Node.js built-ins only)
 * Serves frontend + provides memory CRUD API
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.MEMORY_LOOP_PORT || 3721;
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(PLUGIN_ROOT, 'frontend');
const TEMPLATES_DIR = path.join(PLUGIN_ROOT, 'templates');

// Persisted state: recently opened projects
const STATE_FILE = path.join(PLUGIN_ROOT, 'server', '.state.json');

// ---------- State helpers ----------
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { recentProjects: [], currentProject: null };
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

let state = loadState();

// ---------- Path helpers ----------
function memoryDir(projectPath) {
  return path.join(projectPath, '.trae', 'memory');
}

function memoryFile(projectPath) {
  return path.join(memoryDir(projectPath), 'MEMORY.md');
}

function schemaFile(projectPath) {
  return path.join(memoryDir(projectPath), 'memory-schema.yaml');
}

function archiveFile(projectPath) {
  return path.join(memoryDir(projectPath), 'archive.md');
}

function isPathSafe(targetPath, basePath) {
  // Prevent path traversal outside the project
  const rel = path.relative(basePath, targetPath);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
}

// ---------- Token estimation ----------
function estimateTokens(text) {
  if (!text) return 0;
  // Rough: 1 token ≈ 4 chars for English, ≈ 1.5 chars for CJK
  // Mixed heuristic: count CJK chars separately
  const cjk = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const other = text.length - cjk;
  return Math.ceil(cjk / 1.5 + other / 4);
}

// ---------- List available drives (Windows) ----------
function listDrives() {
  const drives = [];
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    const drivePath = `${letter}:\\`;
    try {
      fs.accessSync(drivePath);
      drives.push({
        name: `${letter}:`,
        path: drivePath,
        isDirectory: true,
        isDrive: true,
      });
    } catch {
      // Drive not available, skip
    }
  }
  return drives;
}

// ---------- Safe home directory ----------
function getSafeHome() {
  const home = os.homedir();
  if (fs.existsSync(home)) return home;
  // Fallback: first available drive root
  const drives = listDrives();
  if (drives.length > 0) return drives[0].path;
  // Last resort: current working directory
  return process.cwd();
}

// ---------- Initialization ----------
function initializeProject(projectPath) {
  const dir = memoryDir(projectPath);
  const created = [];

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    created.push('directory');
  }

  if (!fs.existsSync(schemaFile(projectPath))) {
    const schemaTpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'memory-schema.yaml'), 'utf-8');
    fs.writeFileSync(schemaFile(projectPath), schemaTpl);
    created.push('schema');
  }

  if (!fs.existsSync(memoryFile(projectPath))) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const projectName = path.basename(projectPath);
    let tpl = fs.readFileSync(path.join(TEMPLATES_DIR, 'MEMORY.md.tpl'), 'utf-8');
    tpl = tpl
      .replace('{UPDATED_AT}', now)
      .replace('{PROJECT_CONTEXT}', `_Project: ${projectName}_`)
      .replace('{ACTIVE_GOALS}', '_No active goals yet_')
      .replace('{DECISIONS_LOG}', '_No decisions logged yet_')
      .replace('{GOTCHAS}', '_No gotchas recorded yet_')
      .replace('{COMPLETED}', '_No completed tasks yet_')
      .replace('{STATUS}', 'IN_PROGRESS | Awaiting first task');
    fs.writeFileSync(memoryFile(projectPath), tpl);
    created.push('memory');
  }

  if (!fs.existsSync(archiveFile(projectPath))) {
    fs.writeFileSync(archiveFile(projectPath), '# Archive\n\n_Compressed history will be appended here._\n');
    created.push('archive');
  }

  return created;
}

// ---------- Schema parsing (lightweight YAML) ----------
function parseSchema(yamlText) {
  // Lightweight parser for our specific schema structure
  const result = { hot_layer: { sections: [] }, compression: {} };
  let currentSection = null;
  let inSections = false;
  let inCompression = false;

  const lines = yamlText.split('\n');
  for (const line of lines) {
    if (line.startsWith('hot_layer:')) {
      inSections = true;
      inCompression = false;
      continue;
    }
    if (line.startsWith('compression:')) {
      inSections = false;
      inCompression = true;
      continue;
    }
    if (inSections && line.match(/^\s+- name:\s*"?(.+?)"?\s*$/)) {
      currentSection = { name: RegExp.$1, compressible: false, compress_strategy: 'summary' };
      result.hot_layer.sections.push(currentSection);
      continue;
    }
    if (inSections && currentSection && line.match(/^\s+description:\s*"?(.+?)"?\s*$/)) {
      currentSection.description = RegExp.$1;
      continue;
    }
    if (inSections && currentSection && line.match(/^\s+max_items:\s*(\d+)/)) {
      currentSection.max_items = parseInt(RegExp.$1);
      continue;
    }
    if (inSections && currentSection && line.match(/^\s+format:\s*"?(.+?)"?\s*$/)) {
      currentSection.format = RegExp.$1;
      continue;
    }
    if (inSections && currentSection && line.match(/^\s+compressible:\s*(true|false)/)) {
      currentSection.compressible = RegExp.$1 === 'true';
      continue;
    }
    if (inSections && currentSection && line.match(/^\s+compress_strategy:\s*"?(.+?)"?\s*$/)) {
      currentSection.compress_strategy = RegExp.$1;
      continue;
    }
    if (inCompression && line.match(/^\s+trigger_tokens:\s*(\d+)/)) {
      result.compression.trigger_tokens = parseInt(RegExp.$1);
      continue;
    }
    if (inCompression && line.match(/^\s+trigger_chars:\s*(\d+)/)) {
      result.compression.trigger_chars = parseInt(RegExp.$1);
      continue;
    }
    if (inCompression && line.match(/^\s+keep_recent_decisions:\s*(\d+)/)) {
      result.compression.keep_recent_decisions = parseInt(RegExp.$1);
      continue;
    }
    if (inCompression && line.match(/^\s+keep_recent_completed:\s*(\d+)/)) {
      result.compression.keep_recent_completed = parseInt(RegExp.$1);
      continue;
    }
  }
  return result;
}

// ---------- MEMORY.md parsing ----------
function parseMemory(mdText) {
  const sections = {};
  const parts = mdText.split(/^## /m);
  // First part is the header before any ## section
  sections._header = parts.shift() || '';

  for (const part of parts) {
    const newlineIdx = part.indexOf('\n');
    if (newlineIdx === -1) continue;
    const name = part.substring(0, newlineIdx).trim();
    const content = part.substring(newlineIdx + 1).trim();
    sections[name] = content;
  }
  return sections;
}

// ---------- HTTP helpers ----------
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function sendStatic(res, filePath, contentType) {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(data);
  } catch {
    sendJson(res, 404, { error: 'File not found' });
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({ raw: body });
      }
    });
  });
}

// ---------- API Routes ----------
async function handleApi(req, res, url) {
  const route = url.pathname;
  const method = req.method;

  // GET /api/state — current state
  if (route === '/api/state' && method === 'GET') {
    return sendJson(res, 200, state);
  }

  // POST /api/project/open — open a project
  if (route === '/api/project/open' && method === 'POST') {
    const body = await readBody(req);
    const projectPath = body.path ? path.resolve(body.path) : null;
    if (!projectPath || !fs.existsSync(projectPath)) {
      return sendJson(res, 400, { error: 'Invalid project path' });
    }
    const created = initializeProject(projectPath);
    state.currentProject = projectPath;
    state.recentProjects = [projectPath, ...state.recentProjects.filter(p => p !== projectPath)].slice(0, 10);
    saveState(state);
    return sendJson(res, 200, { projectPath, initialized: created, message: created.length ? `Initialized: ${created.join(', ')}` : 'Project opened' });
  }

  // GET /api/memory — get current project memory
  if (route === '/api/memory' && method === 'GET') {
    if (!state.currentProject) return sendJson(res, 400, { error: 'No project open' });
    try {
      const raw = fs.readFileSync(memoryFile(state.currentProject), 'utf-8');
      const sections = parseMemory(raw);
      const stats = {
        chars: raw.length,
        tokens: estimateTokens(raw),
      };
      return sendJson(res, 200, { raw, sections, stats, projectPath: state.currentProject });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // POST /api/memory — update memory
  if (route === '/api/memory' && method === 'POST') {
    if (!state.currentProject) return sendJson(res, 400, { error: 'No project open' });
    const body = await readBody(req);
    if (!body.raw) return sendJson(res, 400, { error: 'Missing raw content' });
    try {
      fs.writeFileSync(memoryFile(state.currentProject), body.raw);
      const sections = parseMemory(body.raw);
      const stats = { chars: body.raw.length, tokens: estimateTokens(body.raw) };
      return sendJson(res, 200, { ok: true, sections, stats });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // GET /api/schema
  if (route === '/api/schema' && method === 'GET') {
    if (!state.currentProject) return sendJson(res, 400, { error: 'No project open' });
    try {
      const raw = fs.readFileSync(schemaFile(state.currentProject), 'utf-8');
      const parsed = parseSchema(raw);
      return sendJson(res, 200, { raw, parsed });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // POST /api/schema
  if (route === '/api/schema' && method === 'POST') {
    if (!state.currentProject) return sendJson(res, 400, { error: 'No project open' });
    const body = await readBody(req);
    if (!body.raw) return sendJson(res, 400, { error: 'Missing raw content' });
    try {
      fs.writeFileSync(schemaFile(state.currentProject), body.raw);
      const parsed = parseSchema(body.raw);
      return sendJson(res, 200, { ok: true, parsed });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // GET /api/archive
  if (route === '/api/archive' && method === 'GET') {
    if (!state.currentProject) return sendJson(res, 400, { error: 'No project open' });
    try {
      const raw = fs.readFileSync(archiveFile(state.currentProject), 'utf-8');
      return sendJson(res, 200, { raw, chars: raw.length });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // POST /api/compress — trigger compression (returns guidance for agent)
  if (route === '/api/compress' && method === 'POST') {
    if (!state.currentProject) return sendJson(res, 400, { error: 'No project open' });
    try {
      const raw = fs.readFileSync(memoryFile(state.currentProject), 'utf-8');
      const schemaRaw = fs.readFileSync(schemaFile(state.currentProject), 'utf-8');
      const parsed = parseSchema(schemaRaw);
      const triggerTokens = parsed.compression.trigger_tokens || 3000;
      const triggerChars = parsed.compression.trigger_chars || 12000;
      const currentTokens = estimateTokens(raw);
      const needs = currentTokens > triggerTokens || raw.length > triggerChars;
      return sendJson(res, 200, {
        needsCompression: needs,
        currentTokens,
        triggerTokens,
        currentChars: raw.length,
        triggerChars,
        message: needs
          ? `Memory exceeds threshold (${currentTokens} > ${triggerTokens} tokens). Trigger memory-compressor agent.`
          : `Memory within threshold (${currentTokens} / ${triggerTokens} tokens). No compression needed.`,
      });
    } catch (e) {
      return sendJson(res, 500, { error: e.message });
    }
  }

  // GET /api/projects — list recent projects with memory status
  if (route === '/api/projects' && method === 'GET') {
    const projects = state.recentProjects.map(p => {
      const exists = fs.existsSync(memoryFile(p));
      let stats = null;
      if (exists) {
        try {
          const raw = fs.readFileSync(memoryFile(p), 'utf-8');
          stats = { chars: raw.length, tokens: estimateTokens(raw) };
        } catch {}
      }
      return {
        path: p,
        name: path.basename(p),
        hasMemory: exists,
        stats,
        lastModified: exists ? fs.statSync(memoryFile(p)).mtime : null,
      };
    });
    return sendJson(res, 200, { projects, current: state.currentProject });
  }

  // POST /api/initialize — initialize memory for a project
  if (route === '/api/initialize' && method === 'POST') {
    const body = await readBody(req);
    const projectPath = body.path ? path.resolve(body.path) : state.currentProject;
    if (!projectPath || !fs.existsSync(projectPath)) {
      return sendJson(res, 400, { error: 'Invalid project path' });
    }
    const created = initializeProject(projectPath);
    state.currentProject = projectPath;
    state.recentProjects = [projectPath, ...state.recentProjects.filter(p => p !== projectPath)].slice(0, 10);
    saveState(state);
    return sendJson(res, 200, { projectPath, initialized: created });
  }

  // GET /api/home — get user home directory for project browsing
  if (route === '/api/home' && method === 'GET') {
    return sendJson(res, 200, { home: getSafeHome() });
  }

  // POST /api/browse — list directory contents
  if (route === '/api/browse' && method === 'POST') {
    const body = await readBody(req);
    const rawPath = body.path;

    // Special "DRIVES" view — list all available drives (Windows)
    if (rawPath === 'DRIVES' || rawPath === '\\\\') {
      const drives = listDrives();
      return sendJson(res, 200, {
        path: 'DRIVES',
        isDrivesView: true,
        entries: drives,
      });
    }

    // Resolve path: use safe home if no path given
    const dir = rawPath ? path.resolve(rawPath) : getSafeHome();

    // If directory doesn't exist, fall back to DRIVES view
    if (!fs.existsSync(dir)) {
      const drives = listDrives();
      return sendJson(res, 200, {
        path: 'DRIVES',
        isDrivesView: true,
        entries: drives,
        fallback: true,
        fallbackReason: `Path not found: ${dir}`,
      });
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => !e.name.startsWith('.'))
        .map(e => ({
          name: e.name,
          path: path.join(dir, e.name),
          isDirectory: e.isDirectory(),
          hasMemory: e.isDirectory() && fs.existsSync(path.join(dir, e.name, '.trae', 'memory', 'MEMORY.md')),
        }))
        .sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
          return a.name.localeCompare(b.name);
        });

      // Detect if this is a drive root (e.g. C:\) — parent should go to DRIVES
      const isDriveRoot = /^[A-Za-z]:[\\/]$/.test(dir);
      return sendJson(res, 200, {
        path: dir,
        entries,
        isDriveRoot,
        parentPath: isDriveRoot ? 'DRIVES' : null,
      });
    } catch (e) {
      // On any read error, fall back to DRIVES view
      const drives = listDrives();
      return sendJson(res, 200, {
        path: 'DRIVES',
        isDrivesView: true,
        entries: drives,
        fallback: true,
        fallbackReason: e.message,
      });
    }
  }

  return sendJson(res, 404, { error: 'Not found', route });
}

// ---------- Static file serving ----------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, url) {
  let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
  const fullPath = path.join(FRONTEND_DIR, filePath);

  // Security: prevent path traversal
  if (!isPathSafe(fullPath, FRONTEND_DIR)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }

  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    // SPA fallback
    const index = path.join(FRONTEND_DIR, 'index.html');
    return sendStatic(res, index, 'text/html; charset=utf-8');
  }

  const ext = path.extname(fullPath);
  sendStatic(res, fullPath, MIME[ext] || 'application/octet-stream');
}

// ---------- Server ----------
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else {
      serveStatic(req, res, url);
    }
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => {
  console.log(`\n  Memory Loop server running at http://localhost:${PORT}\n`);
  console.log(`  Plugin root: ${PLUGIN_ROOT}`);
  console.log(`  Frontend:    ${FRONTEND_DIR}`);
  console.log(`  Templates:   ${TEMPLATES_DIR}\n`);
  if (state.currentProject) {
    console.log(`  Current project: ${state.currentProject}\n`);
  }
  console.log(`  Press Ctrl+C to stop.\n`);
});
