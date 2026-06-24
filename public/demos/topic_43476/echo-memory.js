/**
 * Echo Memory Module
 * IndexedDB wrapper for persistent storage of sessions, messages, capabilities, and tasks
 * Enables multi-session management and capability library
 */

class EchoMemory {
  constructor() {
    this.dbName = 'EchoDB';
    this.dbVersion = 1;
    this.db = null;
  }

  /**
   * Initialize the database
   */
  async init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
          msgStore.createIndex('sessionId', 'sessionId', { unique: false });
          msgStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Outputs store (requirement cards, task trees, plans, etc.)
        if (!db.objectStoreNames.contains('outputs')) {
          const outStore = db.createObjectStore('outputs', { keyPath: 'id', autoIncrement: true });
          outStore.createIndex('sessionId', 'sessionId', { unique: false });
          outStore.createIndex('type', 'type', { unique: false });
        }

        // Tasks store (task board items)
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('sessionId', 'sessionId', { unique: false });
          taskStore.createIndex('taskId', 'taskId', { unique: false });
          taskStore.createIndex('status', 'status', { unique: false });
        }

        // Capabilities store (sedimented capabilities)
        if (!db.objectStoreNames.contains('capabilities')) {
          const capStore = db.createObjectStore('capabilities', { keyPath: 'id', autoIncrement: true });
          capStore.createIndex('name', 'name', { unique: false });
          capStore.createIndex('type', 'type', { unique: false });
          capStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Generated files store
        if (!db.objectStoreNames.contains('files')) {
          const fileStore = db.createObjectStore('files', { keyPath: 'id', autoIncrement: true });
          fileStore.createIndex('sessionId', 'sessionId', { unique: false });
        }
      };
    });
  }

  /**
   * Generic transaction helper
   */
  _tx(storeName, mode = 'readonly') {
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  /**
   * Generic request helper
   */
  _request(store, method, ...args) {
    return new Promise((resolve, reject) => {
      const req = store[method](...args);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // ===== Session Management =====

  async createSession(title) {
    const session = {
      id: 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      title: title || '新对话',
      phase: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this._request(this._tx('sessions', 'readwrite'), 'add', session);
    return session;
  }

  async getSession(id) {
    return await this._request(this._tx('sessions'), 'get', id);
  }

  async getAllSessions() {
    return new Promise((resolve, reject) => {
      const store = this._tx('sessions');
      const index = store.index('createdAt');
      const req = index.openCursor(null, 'prev');
      const results = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateSession(id, updates) {
    const session = await this.getSession(id);
    if (!session) return null;
    Object.assign(session, updates, { updatedAt: Date.now() });
    await this._request(this._tx('sessions', 'readwrite'), 'put', session);
    return session;
  }

  async deleteSession(id) {
    // Delete session and all related data
    const tx = this.db.transaction(['sessions', 'messages', 'outputs', 'tasks', 'files'], 'readwrite');
    
    tx.objectStore('sessions').delete(id);
    
    // Delete messages
    const msgStore = tx.objectStore('messages');
    const msgIndex = msgStore.index('sessionId');
    const msgReq = msgIndex.openCursor(IDBKeyRange.only(id));
    msgReq.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };

    // Delete outputs
    const outStore = tx.objectStore('outputs');
    const outIndex = outStore.index('sessionId');
    const outReq = outIndex.openCursor(IDBKeyRange.only(id));
    outReq.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };

    // Delete tasks
    const taskStore = tx.objectStore('tasks');
    const taskIndex = taskStore.index('sessionId');
    const taskReq = taskIndex.openCursor(IDBKeyRange.only(id));
    taskReq.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };

    // Delete files
    const fileStore = tx.objectStore('files');
    const fileIndex = fileStore.index('sessionId');
    const fileReq = fileIndex.openCursor(IDBKeyRange.only(id));
    fileReq.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) { cursor.delete(); cursor.continue(); }
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ===== Messages =====

  async addMessage(sessionId, role, content) {
    const message = {
      sessionId,
      role,
      content,
      createdAt: Date.now(),
    };
    const id = await this._request(this._tx('messages', 'readwrite'), 'add', message);
    // Update session timestamp
    await this.updateSession(sessionId, {});
    return { ...message, id };
  }

  async getMessages(sessionId) {
    return new Promise((resolve, reject) => {
      const store = this._tx('messages');
      const index = store.index('sessionId');
      const req = index.openCursor(IDBKeyRange.only(sessionId));
      const results = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ===== Outputs =====

  async saveOutput(sessionId, type, content) {
    const output = {
      sessionId,
      type,
      content,
      createdAt: Date.now(),
    };
    const id = await this._request(this._tx('outputs', 'readwrite'), 'add', output);
    return { ...output, id };
  }

  async getOutputs(sessionId) {
    return new Promise((resolve, reject) => {
      const store = this._tx('outputs');
      const index = store.index('sessionId');
      const req = index.openCursor(IDBKeyRange.only(sessionId));
      const results = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ===== Tasks =====

  async saveTask(sessionId, taskId, title, executor, status, complexity, note) {
    const task = {
      sessionId,
      taskId,
      title,
      executor,
      status: status || 'pending',
      complexity: complexity || 'mid',
      note: note || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const id = await this._request(this._tx('tasks', 'readwrite'), 'add', task);
    return { ...task, id };
  }

  async getTasks(sessionId) {
    return new Promise((resolve, reject) => {
      const store = this._tx('tasks');
      const index = store.index('sessionId');
      const req = index.openCursor(IDBKeyRange.only(sessionId));
      const results = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateTask(sessionId, taskId, updates) {
    return new Promise((resolve, reject) => {
      const store = this._tx('tasks', 'readwrite');
      const index = store.index('sessionId');
      const req = index.openCursor(IDBKeyRange.only(sessionId));
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.taskId === taskId) {
            const updated = { ...cursor.value, ...updates, updatedAt: Date.now() };
            cursor.update(updated);
            resolve(updated);
            return;
          }
          cursor.continue();
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteTasksBySession(sessionId) {
    return new Promise((resolve, reject) => {
      const store = this._tx('tasks', 'readwrite');
      const index = store.index('sessionId');
      const req = index.openCursor(IDBKeyRange.only(sessionId));
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) { cursor.delete(); cursor.continue(); }
        else { resolve(); }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ===== Capabilities =====

  async saveCapability(name, type, scenario, steps, notes) {
    const capability = {
      name,
      type: type || '流程模板',
      scenario,
      steps: steps || [],
      notes: notes || '',
      usageCount: 0,
      createdAt: Date.now(),
    };
    const id = await this._request(this._tx('capabilities', 'readwrite'), 'add', capability);
    return { ...capability, id };
  }

  async getCapability(id) {
    return await this._request(this._tx('capabilities'), 'get', id);
  }

  async getAllCapabilities() {
    return new Promise((resolve, reject) => {
      const store = this._tx('capabilities');
      const index = store.index('createdAt');
      const req = index.openCursor(null, 'prev');
      const results = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteCapability(id) {
    await this._request(this._tx('capabilities', 'readwrite'), 'delete', id);
  }

  async incrementCapabilityUsage(id) {
    const cap = await this.getCapability(id);
    if (cap) {
      cap.usageCount = (cap.usageCount || 0) + 1;
      await this._request(this._tx('capabilities', 'readwrite'), 'put', cap);
    }
  }

  // ===== Generated Files =====

  async saveFile(sessionId, filename, language, description, content) {
    const file = {
      sessionId,
      filename,
      language,
      description,
      content,
      createdAt: Date.now(),
    };
    const id = await this._request(this._tx('files', 'readwrite'), 'add', file);
    return { ...file, id };
  }

  async getFiles(sessionId) {
    return new Promise((resolve, reject) => {
      const store = this._tx('files');
      const index = store.index('sessionId');
      const req = index.openCursor(IDBKeyRange.only(sessionId));
      const results = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ===== Utility =====

  async clearAll() {
    const stores = ['sessions', 'messages', 'outputs', 'tasks', 'capabilities', 'files'];
    for (const store of stores) {
      await this._request(this._tx(store, 'readwrite'), 'clear');
    }
  }
}

// Export as global
window.EchoMemory = EchoMemory;
