(function () {
  const api = window.MiniFishAPI;
  if (!api) return;
  api.media = {
    createAsset(body) { return api.post('/media/assets', body); },
    assets(params) { return api.get('/media/assets', params); },
    analyze(body, options) { return api.post('/media/analyses', body, null, options); },
    analyses(params) { return api.get('/media/analyses', params); },
    analysis(id) { return api.get('/media/analyses/' + encodeURIComponent(id)); },
    analysisDetail(id) { return api.get('/media/analyses/' + encodeURIComponent(id)); },
    transcribe(body, options) { return api.post('/speech/transcriptions', body, null, options); },
    transcription(id) { return api.get('/speech/transcriptions/' + encodeURIComponent(id)); }
  };
})();
