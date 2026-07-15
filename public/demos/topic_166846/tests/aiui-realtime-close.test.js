const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

function loadPageDefinition(wx) {
  const file = path.join(__dirname, '..', 'pages', 'index', 'index.ink');
  const source = fs.readFileSync(file, 'utf8');
  const setupMatch = source.match(/<script setup>([\s\S]*?)<\/script>/);
  assert.ok(setupMatch, 'index.ink must contain a script setup block');

  const executable = setupMatch[1]
    .replace(/import\s+wx\s+from\s+['"]wx['"];?/, '')
    .replace(/import\s+\{[\s\S]*?\}\s+from\s+['"]\.\.\/\.\.\/lib\/backend-config\.js['"];?/, '')
    .replace(/import\s+\{\s*LanguageModel\s*\}\s+from\s+['"]language-model['"];?/, '')
    .replace('export default {', 'return {');

  const factory = new Function(
    'wx',
    'LanguageModel',
    'buildBackendHttpUrl',
    'buildBackendWebSocketUrl',
    'isBackendConfigured',
    executable
  );

  return factory(
    wx,
    {},
    () => '',
    () => '',
    () => false
  );
}

function createHarness() {
  const recorderCallbacks = {};
  const sent = [];
  let closeCount = 0;

  const recorder = {
    onStart(callback) { recorderCallbacks.start = callback; },
    onFrameRecorded(callback) { recorderCallbacks.frame = callback; },
    onStop(callback) { recorderCallbacks.stop = callback; },
    onError(callback) { recorderCallbacks.error = callback; },
    async stop() {
      if (recorderCallbacks.stop) recorderCallbacks.stop({ tempFilePath: '' });
    }
  };

  const wx = {
    media: { getRecorderManager: () => recorder },
    connectSocket: () => null
  };
  const definition = loadPageDefinition(wx);
  const page = {
    ...definition,
    data: { ...definition.data },
    setData(update) { Object.assign(this.data, update); }
  };

  page.realtimeSocket = {
    send(payload) { sent.push(JSON.parse(payload)); },
    close() { closeCount += 1; }
  };
  page.realtimeSocketOpen = true;
  page.realtimeSessionReady = true;
  page.realtimeRecording = true;
  page.realtimeRecorderStarting = false;
  page.realtimeFinishing = false;
  page.realtimeFinishEventSent = false;
  page.realtimeFinishTimer = null;
  page.pendingAudioFrames = ['frame'];
  page.eventCounter = 0;
  page.bindRecorder();

  return {
    page,
    sent,
    getCloseCount: () => closeCount
  };
}

test('graceful finish sends one event and waits for session.finished', async () => {
  const harness = createHarness();

  await harness.page.finishRealtimeTranslation();

  assert.equal(
    harness.sent.filter((event) => event.type === 'session.finish').length,
    1
  );
  assert.equal(harness.getCloseCount(), 0);
  assert.equal(harness.page.realtimeFinishing, true);

  harness.page.handleRealtimeMessage(JSON.stringify({ type: 'session.finished' }));

  assert.equal(harness.getCloseCount(), 1);
  assert.equal(harness.page.realtimeFinishing, false);
});

test('immediate close does not duplicate session.finish from onStop', () => {
  const harness = createHarness();

  harness.page.closeRealtimeTranslation();

  assert.equal(
    harness.sent.filter((event) => event.type === 'session.finish').length,
    1
  );
  assert.equal(harness.getCloseCount(), 1);
  assert.equal(harness.page.realtimeFinishing, false);
});
