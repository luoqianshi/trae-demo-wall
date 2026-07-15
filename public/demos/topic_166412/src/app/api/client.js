/**
 * MiniFish API Client
 *
 * Public request methods always return an ApiResponse envelope so callers do
 * not accidentally discard pagination metadata, request IDs, or HTTP 202.
 * Access tokens remain memory-only; refresh tokens remain HttpOnly cookies.
 */
(function () {
  'use strict';

  const BASE_URL = (window.MiniFishConfig && window.MiniFishConfig.apiBaseUrl)
    || 'http://127.0.0.1:3100/api/v1';
  const DEFAULT_TIMEOUT_MS = 30000;
  const TERMINAL_EVENTS = new Set(['completed', 'failed']);
  const MAX_SSE_RETRIES = 3;

  let accessToken = null;
  let currentUser = null;
  let refreshPromise = null;

  class ApiError extends Error {
    constructor(message, code, status, requestId, details) {
      super(message || '请求失败');
      this.name = 'ApiError';
      this.code = code || 'INTERNAL_ERROR';
      this.status = status || 0;
      this.requestId = requestId || '';
      // Both spellings are exposed because the HTTP envelope uses request_id.
      this.request_id = this.requestId;
      this.details = details === undefined ? null : details;
    }
  }

  function classifyFetchFailure(error, timedOut) {
    if (error instanceof ApiError) return error;
    if (timedOut) {
      return new ApiError('请求超时，请稍后重试', 'REQUEST_TIMEOUT', 0);
    }
    if (error && error.name === 'AbortError') {
      return new ApiError('请求已取消', 'REQUEST_ABORTED', 0);
    }
    // fetch only uses TypeError for transport/CORS/DNS failures. Do not turn
    // server responses or ordinary client exceptions into a fake network error.
    if (error instanceof TypeError) {
      return new ApiError('网络请求失败，请检查后端服务或网络连接', 'NETWORK_ERROR', 0);
    }
    return new ApiError(
      error && error.message || '请求发送失败',
      error && error.code || 'REQUEST_FAILED',
      error && error.status || 0,
      error && (error.requestId || error.request_id) || '',
      error && error.details
    );
  }

  async function fetchResponse(url, options, timeoutMs) {
    const configuredTimeout = Number.isFinite(timeoutMs) ? Math.max(0, timeoutMs) : DEFAULT_TIMEOUT_MS;
    const externalSignal = options && options.signal;
    const controller = new AbortController();
    let timedOut = false;
    let timer = null;
    let onExternalAbort = null;

    if (externalSignal) {
      if (externalSignal.aborted) controller.abort();
      else {
        onExternalAbort = () => controller.abort();
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }
    if (configuredTimeout > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, configuredTimeout);
    }

    try {
      return await fetch(url, { ...(options || {}), signal: controller.signal });
    } catch (error) {
      throw classifyFetchFailure(error, timedOut);
    } finally {
      if (timer) clearTimeout(timer);
      if (externalSignal && onExternalAbort) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  function buildQuery(params) {
    if (!params) return '';
    const search = new URLSearchParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) value.forEach(item => search.append(key, item));
      else search.set(key, value);
    });
    const query = search.toString();
    return query ? '?' + query : '';
  }

  async function parseBody(res) {
    if (res.status === 204) return {};
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json')) return {};
    try { return await res.json(); } catch { return {}; }
  }

  async function parseResponse(res) {
    const body = await parseBody(res);
    if (!res.ok) {
      const serverError = body && body.error || {};
      const requestId = body && body.request_id || res.headers.get('x-request-id') || '';
      const code = serverError.code || 'HTTP_' + res.status;
      const fallback = code === 'AUTH_REQUIRED' || code === 'AUTH_EXPIRED'
        ? '登录已过期，请重新登录'
        : '请求失败，请稍后重试';
      throw new ApiError(
        serverError.message || fallback,
        code,
        res.status,
        requestId,
        serverError.details
      );
    }
    return Object.freeze({
      data: res.status === 204 ? null : (body.data !== undefined ? body.data : body),
      meta: body.meta || null,
      request_id: body.request_id || res.headers.get('x-request-id') || '',
      status: res.status,
      accepted: res.status === 202
    });
  }

  async function doRefresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = fetchResponse(BASE_URL + '/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    }, DEFAULT_TIMEOUT_MS)
      .then(parseResponse)
      .then(response => {
        const data = response.data;
        if (!data || !data.access_token) {
          throw new ApiError('登录已过期，请重新登录', 'AUTH_EXPIRED', 401, response.request_id);
        }
        accessToken = data.access_token;
        if (data.user) currentUser = data.user;
        return response;
      })
      .catch(error => {
        accessToken = null;
        currentUser = null;
        throw error;
      })
      .finally(() => { refreshPromise = null; });
    return refreshPromise;
  }

  async function request(method, path, params, body, options) {
    options = options || {};
    const query = params ? buildQuery(params) : '';
    const url = BASE_URL + path + query;
    const headers = { 'Accept': 'application/json' };
    if (body !== undefined && body !== null) headers['Content-Type'] = 'application/json';
    if (accessToken) headers.Authorization = 'Bearer ' + accessToken;

    const fetchOptions = {
      method,
      credentials: 'include',
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    };
    delete fetchOptions._retried;
    delete fetchOptions.timeoutMs;
    if (body !== undefined && body !== null) fetchOptions.body = JSON.stringify(body);

    const res = await fetchResponse(url, fetchOptions, options.timeoutMs);

    const refreshExcluded = ['/auth/login', '/auth/register', '/auth/refresh'].includes(path);
    if (res.status === 401 && !options._retried && !refreshExcluded) {
      await doRefresh();
      return request(method, path, params, body, { ...options, _retried: true });
    }
    return parseResponse(res);
  }

  async function download(path, params, options) {
    options = options || {};
    const headers = { 'Accept': 'application/octet-stream' };
    if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
    const res = await fetchResponse(BASE_URL + path + buildQuery(params), {
      method: 'GET',
      credentials: 'include',
      headers: { ...headers, ...(options.headers || {}) },
      signal: options.signal
    }, options.timeoutMs);
    if (res.status === 401 && !options._retried) {
      await doRefresh();
      return download(path, params, { ...options, _retried: true });
    }
    if (!res.ok) return parseResponse(res);
    const disposition = res.headers.get('content-disposition') || '';
    const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const plain = disposition.match(/filename="?([^";]+)"?/i);
    const filename = encoded ? decodeURIComponent(encoded[1]) : plain ? plain[1] : 'artifact';
    return {
      blob: await res.blob(),
      filename,
      request_id: res.headers.get('x-request-id') || '',
      status: res.status
    };
  }

  function createSseParser(onEvent) {
    let buffer = '';
    let eventType = 'message';
    let eventId = '';
    let dataLines = [];

    function dispatch() {
      if (!dataLines.length) return;
      const raw = dataLines.join('\n');
      const data = JSON.parse(raw);
      onEvent({ id: eventId, type: eventType || 'message', data });
      eventType = 'message';
      eventId = '';
      dataLines = [];
    }

    return {
      push(text) {
        buffer += text;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';
        lines.forEach(line => {
          if (line === '') { dispatch(); return; }
          if (line.startsWith(':')) return;
          const separator = line.indexOf(':');
          const field = separator === -1 ? line : line.slice(0, separator);
          let value = separator === -1 ? '' : line.slice(separator + 1);
          if (value.startsWith(' ')) value = value.slice(1);
          if (field === 'id') eventId = value;
          else if (field === 'event') eventType = value;
          else if (field === 'data') dataLines.push(value);
        });
      },
      flush() {
        if (buffer) {
          this.push('\n');
        }
        dispatch();
      }
    };
  }

  function subscribeEvents(path, handlers) {
    handlers = handlers || {};
    let aborted = false;
    let retryCount = 0;
    let refreshedOnce = false;
    let lastEventId = '';
    let lastSequence = -1;
    let abortController = null;

    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

    async function connect() {
      while (!aborted) {
        const headers = { 'Accept': 'text/event-stream' };
        if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
        if (lastEventId) headers['Last-Event-ID'] = lastEventId;
        abortController = new AbortController();

        try {
          const res = await fetch(BASE_URL + path, {
            headers,
            credentials: 'include',
            signal: abortController.signal
          });
          if (res.status === 401 && !refreshedOnce) {
            refreshedOnce = true;
            await doRefresh();
            continue;
          }
          if (!res.ok || !res.body) {
            throw new ApiError('实时连接失败', 'SSE_ERROR', res.status, res.headers.get('x-request-id'));
          }

          retryCount = 0;
          const parser = createSseParser(event => {
            if (event.id) lastEventId = event.id;
            const payload = event.data && typeof event.data === 'object' ? event.data : {};
            const sequence = Number(payload.sequence);
            if (Number.isFinite(sequence) && sequence <= lastSequence) return;
            if (Number.isFinite(sequence)) lastSequence = sequence;
            const normalized = { ...payload, type: event.type, event_id: event.id };
            if (handlers.onEvent) handlers.onEvent(normalized);
            if (event.type === 'progress' && handlers.onProgress) handlers.onProgress(normalized);
            if (event.type === 'delta' && handlers.onDelta) handlers.onDelta(normalized);
            if (event.type === 'block' && handlers.onBlock) handlers.onBlock(normalized);
            if (event.type === 'artifact' && handlers.onArtifact) handlers.onArtifact(normalized);
            if (event.type === 'completed' && handlers.onCompleted) handlers.onCompleted(normalized);
            if (event.type === 'failed' && handlers.onFailed) handlers.onFailed(normalized);
            if (TERMINAL_EVENTS.has(event.type)) aborted = true;
          });
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (!aborted) {
            const chunk = await reader.read();
            if (chunk.done) break;
            parser.push(decoder.decode(chunk.value, { stream: true }));
          }
          parser.flush();
          if (aborted) return;
          throw new ApiError('实时连接已断开', 'SSE_DISCONNECTED', 0);
        } catch (error) {
          if (aborted || error.name === 'AbortError') return;
          retryCount += 1;
          if (retryCount > MAX_SSE_RETRIES) {
            if (handlers.onFallback) handlers.onFallback({ last_event_id: lastEventId, error });
            else if (handlers.onError) handlers.onError(error);
            return;
          }
          if (handlers.onRetry) handlers.onRetry({ attempt: retryCount, last_event_id: lastEventId });
          await wait(Math.min(1000 * (2 ** (retryCount - 1)), 4000));
        }
      }
    }

    connect();
    return function unsubscribe() {
      aborted = true;
      if (abortController) abortController.abort();
    };
  }

  const client = {
    BASE_URL,
    ApiError,
    buildQuery,
    request,
    download,
    get(path, params, options) { return request('GET', path, params, undefined, options); },
    post(path, body, params, options) { return request('POST', path, params, body, options); },
    put(path, body, params, options) { return request('PUT', path, params, body, options); },
    patch(path, body, params, options) { return request('PATCH', path, params, body, options); },
    delete(path, params, options) { return request('DELETE', path, params, undefined, options); },
    withIdempotency(key) {
      const generated = key || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
      return { headers: { 'Idempotency-Key': generated } };
    },
    getAccessToken() { return accessToken; },
    getCurrentUser() { return currentUser; },
    isLoggedIn() { return !!accessToken; },
    async register(email, password, displayName) {
      const response = await request('POST', '/auth/register', null, {
        email,
        password,
        display_name: displayName
      });
      const data = response.data;
      if (data && data.access_token) accessToken = data.access_token;
      if (data && data.user) currentUser = data.user;
      return response;
    },
    async login(email, password) {
      const response = await request('POST', '/auth/login', null, { email, password });
      const data = response.data;
      if (data && data.access_token) accessToken = data.access_token;
      if (data && data.user) currentUser = data.user;
      return response;
    },
    refresh() { return doRefresh(); },
    async loadMe() {
      const response = await request('GET', '/auth/me');
      if (response.data) currentUser = response.data;
      return response;
    },
    async logout() {
      try { await request('POST', '/auth/logout'); } catch {}
      accessToken = null;
      currentUser = null;
    },
    subscribeEvents,
    subscribeJobEvents(jobId, handlers) {
      return subscribeEvents('/jobs/' + encodeURIComponent(jobId) + '/events', handlers);
    }
  };

  window.MiniFishAPI = client;
})();
