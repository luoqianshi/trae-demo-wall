/** Core account, connector, task and job API wrappers. */
(function () {
  'use strict';
  const api = window.MiniFishAPI;
  if (!api) return;

  api.profile = {
    me() { return api.get('/auth/me'); },
    update(body) { return api.patch('/auth/me', body); }
  };

  api.accounts = {
    list() { return api.get('/creator-accounts'); },
    get(id) { return api.get('/creator-accounts/' + encodeURIComponent(id)); },
    update(id, body) { return api.patch('/creator-accounts/' + encodeURIComponent(id), body); },
    remove(id) { return api.delete('/creator-accounts/' + encodeURIComponent(id)); },
    credentialCheck(id) {
      return api.post(
        '/creator-accounts/' + encodeURIComponent(id) + '/credential-checks',
        {},
        null,
        api.withIdempotency()
      );
    },
    sync(id) {
      return api.post(
        '/creator-accounts/' + encodeURIComponent(id) + '/syncs',
        {},
        null,
        api.withIdempotency()
      );
    },
    syncAll() { return api.post('/sync-runs', {}, null, api.withIdempotency()); },
    policy() { return api.get('/sync-policy'); },
    updatePolicy(body) { return api.put('/sync-policy', body); }
  };

  api.connectors = {
    platforms() { return api.get('/platforms'); },
    sessions() { return api.get('/connector-sessions'); },
    createSession(platform) { return api.post('/connector-sessions', { platform }); }
  };

  api.notifications = {
    list(params) { return api.get('/notifications', params); },
    unreadCount() { return api.get('/notifications/unread-count'); },
    mark(id, read) { return api.patch('/notifications/' + encodeURIComponent(id), { read }); },
    readAll() { return api.post('/notifications/read-all', {}); }
  };

  api.tasks = {
    list(params) { return api.get('/tasks', params); },
    create(body) { return api.post('/tasks', body); },
    update(id, body) { return api.patch('/tasks/' + encodeURIComponent(id), body); },
    remove(id) { return api.delete('/tasks/' + encodeURIComponent(id)); }
  };

  api.jobs = {
    get(id) { return api.get('/jobs/' + encodeURIComponent(id)); },
    cancel(id) { return api.post('/jobs/' + encodeURIComponent(id) + '/cancel', {}); },
    retry(id) { return api.post('/jobs/' + encodeURIComponent(id) + '/retries', {}); },
    subscribe(id, handlers) { return api.subscribeJobEvents(id, handlers); }
  };
})();
