(function () {
  const api = window.MiniFishAPI;
  if (!api) return;
  api.studio = {
    sessions(params) { return api.get('/studio/sessions', params); },
    createSession(body) { return api.post('/studio/sessions', body); },
    session(id) { return api.get('/studio/sessions/' + encodeURIComponent(id)); },
    updateSession(id, body) { return api.patch('/studio/sessions/' + encodeURIComponent(id), body); },
    removeSession(id) { return api.delete('/studio/sessions/' + encodeURIComponent(id)); },
    messages(id) { return api.get('/studio/sessions/' + encodeURIComponent(id) + '/messages'); },
    run(id, body) {
      return api.post(
        '/studio/sessions/' + encodeURIComponent(id) + '/runs',
        body,
        null,
        api.withIdempotency()
      );
    },
    getRun(id) { return api.get('/studio/runs/' + encodeURIComponent(id)); },
    subscribeRun(id, handlers) {
      return api.subscribeEvents('/studio/runs/' + encodeURIComponent(id) + '/events', handlers);
    },
    regenerate(messageId) {
      return api.post('/studio/messages/' + encodeURIComponent(messageId) + '/regenerations', {}, null, api.withIdempotency());
    },
    feedback(messageId, feedback) {
      return api.put('/studio/messages/' + encodeURIComponent(messageId) + '/feedback', { feedback });
    },
    artifacts(sessionId) { return api.get('/studio/sessions/' + encodeURIComponent(sessionId) + '/artifacts'); },
    artifact(id) { return api.get('/artifacts/' + encodeURIComponent(id)); },
    artifactDownload(id) { return api.download('/artifacts/' + encodeURIComponent(id) + '/download'); },
    uploadIntent(body) { return api.post('/files/upload-intents', body); },
    completeUpload(id, dataBase64) {
      return api.post('/files/' + encodeURIComponent(id) + '/complete', { data_base64: dataBase64 });
    }
  };
})();
