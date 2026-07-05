/**
 * storage.js - localStorage 数据管理模块
 * 使用 'jiahu_' 前缀的 key 存储所有数据
 */
const Storage = {
  // All keys prefixed with 'jiahu_'
  KEYS: {
    USERS: 'users',
    CURRENT_USER: 'current_user',
    GROUPS: 'groups',
    MEMBERS: 'familyMembers',
    MEDICAL_RECORDS: 'medicalRecords',
    TREATMENTS: 'treatments',
    CURRENT_GROUP: 'current_group',
    INVITE_CODES: 'inviteCodes',
    INITIALIZED: 'initialized'
  },

  /**
   * Build a prefixed localStorage key
   * @param {string} key - unprefixed key
   * @returns {string} prefixed key like 'jiahu_users'
   */
  _prefixedKey(key) {
    return `jiahu_${key}`;
  },

  /**
   * Get all items of a collection
   * @param {string} key - collection key from KEYS
   * @returns {Array} array of items, empty array if none
   */
  getAll(key) {
    try {
      const data = localStorage.getItem(this._prefixedKey(key));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Storage.getAll error for key "${key}":`, e);
      return [];
    }
  },

  /**
   * Save entire collection
   * @param {string} key - collection key from KEYS
   * @param {Array|Object} data - data to save
   */
  save(key, data) {
    try {
      localStorage.setItem(this._prefixedKey(key), JSON.stringify(data));
    } catch (e) {
      console.error(`Storage.save error for key "${key}":`, e);
    }
  },

  /**
   * Get single item by id
   * @param {string} key - collection key from KEYS
   * @param {string} id - item id
   * @returns {Object|null} found item or null
   */
  getById(key, id) {
    const items = this.getAll(key);
    return items.find(item => item.id === id) || null;
  },

  /**
   * Add new item with auto-generated id and timestamps
   * @param {string} key - collection key from KEYS
   * @param {Object} item - item data to add
   * @returns {Object} the created item with id and timestamps
   */
  add(key, item) {
    const items = this.getAll(key);
    const now = new Date().toISOString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newItem = {
      ...item,
      id: `${key}_${Date.now()}_${random}`,
      createdAt: now,
      updatedAt: now
    };
    items.push(newItem);
    this.save(key, items);
    return newItem;
  },

  /**
   * Update item by id, merge updates, set updatedAt
   * @param {string} key - collection key from KEYS
   * @param {string} id - item id
   * @param {Object} updates - fields to merge into the item
   * @returns {Object|null} updated item or null if not found
   */
  update(key, id, updates) {
    const items = this.getAll(key);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      console.warn(`Storage.update: item "${id}" not found in "${key}"`);
      return null;
    }
    const now = new Date().toISOString();
    items[index] = {
      ...items[index],
      ...updates,
      id: items[index].id, // ensure id is not overwritten
      createdAt: items[index].createdAt, // ensure createdAt is not overwritten
      updatedAt: now
    };
    this.save(key, items);
    return items[index];
  },

  /**
   * Delete item by id
   * @param {string} key - collection key from KEYS
   * @param {string} id - item id
   * @returns {boolean} true if deleted, false if not found
   */
  remove(key, id) {
    const items = this.getAll(key);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      console.warn(`Storage.remove: item "${id}" not found in "${key}"`);
      return false;
    }
    items.splice(index, 1);
    this.save(key, items);
    return true;
  },

  /**
   * Get current logged-in user object
   * @returns {Object|null} user object or null
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem(this._prefixedKey(this.KEYS.CURRENT_USER));
      if (!userData) return null;
      
      let parsed;
      try {
        parsed = JSON.parse(userData);
      } catch (parseError) {
        // Legacy format: raw string ID (not JSON)
        parsed = userData;
      }
      
      // If parsed is a string (legacy ID), look up the full user object
      if (typeof parsed === 'string') {
        const user = this.getById(this.KEYS.USERS, parsed);
        // Migrate: store the full object for next time
        if (user) {
          localStorage.setItem(this._prefixedKey(this.KEYS.CURRENT_USER), JSON.stringify(user));
        }
        return user;
      }
      return parsed;
    } catch (e) {
      console.error('Storage.getCurrentUser error:', e);
      return null;
    }
  },

  /**
   * Set current user object
   * @param {Object|null} user - user object to set as current, or null to clear
   */
  setCurrentUser(user) {
    if (user === null) {
      localStorage.removeItem(this._prefixedKey(this.KEYS.CURRENT_USER));
    } else {
      localStorage.setItem(this._prefixedKey(this.KEYS.CURRENT_USER), JSON.stringify(user));
    }
  },

  /**
   * Get current family group
   * @returns {Object|null} group object or null
   */
  getCurrentGroup() {
    try {
      const groupData = localStorage.getItem(this._prefixedKey(this.KEYS.CURRENT_GROUP));
      if (!groupData) return null;
      const parsed = JSON.parse(groupData);
      // If parsed is a string (legacy ID), look up the full group object
      if (typeof parsed === 'string') {
        const group = this.getById(this.KEYS.GROUPS, parsed);
        // Migrate: store the full object for next time
        if (group) {
          localStorage.setItem(this._prefixedKey(this.KEYS.CURRENT_GROUP), JSON.stringify(group));
        }
        return group;
      }
      return parsed;
    } catch (e) {
      console.error('Storage.getCurrentGroup error:', e);
      return null;
    }
  },

  /**
   * Set current group object
   * @param {Object|null} group - group object to set as current, or null to clear
   */
  setCurrentGroup(group) {
    if (group === null) {
      localStorage.removeItem(this._prefixedKey(this.KEYS.CURRENT_GROUP));
    } else {
      localStorage.setItem(this._prefixedKey(this.KEYS.CURRENT_GROUP), JSON.stringify(group));
    }
  },

  /**
   * Clear all app data (for reset)
   */
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(this._prefixedKey(key));
    });
  },

  /**
   * Generate a 6-character random invite code (uppercase letters + digits)
   * Ensures uniqueness against existing codes
   * @param {string} groupId - the family group id
   * @returns {Object} the created invite code record
   */
  generateInviteCode(groupId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous chars like 0/O, 1/I
    const existing = this.getAll(this.KEYS.INVITE_CODES);
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (existing.some(ic => ic.code === code));

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const record = {
      code: code,
      groupId: groupId,
      expiresAt: expiresAt,
      used: false,
      usedBy: null,
      createdAt: now.toISOString()
    };
    return this.add(this.KEYS.INVITE_CODES, record);
  },

  /**
   * Validate an invite code and return the associated group if valid
   * @param {string} code - the invite code to validate
   * @returns {{ valid: boolean, group?: Object, inviteCode?: Object, reason?: string }}
   */
  validateInviteCode(code) {
    if (!code) return { valid: false, reason: '请输入邀请码' };
    const upperCode = code.toUpperCase().trim();
    const allCodes = this.getAll(this.KEYS.INVITE_CODES);
    const record = allCodes.find(ic => ic.code === upperCode);

    if (!record) return { valid: false, reason: '邀请码无效' };
    if (record.used) return { valid: false, reason: '该邀请码已被使用' };

    const now = new Date();
    const expires = new Date(record.expiresAt);
    if (now > expires) return { valid: false, reason: '邀请码已过期' };

    const group = this.getById(this.KEYS.GROUPS, record.groupId);
    if (!group) return { valid: false, reason: '关联的家庭组不存在' };

    return { valid: true, group: group, inviteCode: record };
  },

  /**
   * Mark an invite code as used by a user
   * @param {string} inviteCodeId - the invite code record id
   * @param {string} userId - the user who used it
   */
  useInviteCode(inviteCodeId, userId) {
    this.update(this.KEYS.INVITE_CODES, inviteCodeId, {
      used: true,
      usedBy: userId
    });
  },

  /**
   * Get all invite codes for a group, sorted by creation date descending
   * @param {string} groupId - the family group id
   * @returns {Array} invite code records
   */
  getInviteCodesByGroup(groupId) {
    const all = this.getAll(this.KEYS.INVITE_CODES);
    return all
      .filter(ic => ic.groupId === groupId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Get the current active (unused & unexpired) invite codes for a group
   * @param {string} groupId - the family group id
   * @returns {Array} active invite code records
   */
  getActiveInviteCodes(groupId) {
    const now = new Date();
    return this.getInviteCodesByGroup(groupId).filter(ic => {
      if (ic.used) return false;
      if (now > new Date(ic.expiresAt)) return false;
      return true;
    });
  },

  /**
   * Initialize test data (only if not already initialized)
   */
  initTestData() {
    // Skip if already initialized
    const initialized = localStorage.getItem(this._prefixedKey(this.KEYS.INITIALIZED));
    if (initialized === 'true') return;

    // Test users
    const users = [
      {
        id: 'user_001',
        username: 'test001',
        password: '123456', // MVP only - plaintext for demo
        displayName: '张三',
        phone: '13800138001',
        avatar: '',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z'
      },
      {
        id: 'user_002',
        username: 'test002',
        password: '123456',
        displayName: '李四',
        phone: '13800138002',
        avatar: '',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z'
      }
    ];

    // Test group
    const groups = [
      {
        id: 'group_001',
        name: '张家',
        adminId: 'user_001',
        members: ['user_001', 'user_002'],
        inviteCode: 'ABC123',
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z'
      }
    ];

    // Test family members
    const members = [
      {
        id: 'member_001',
        groupId: 'group_001',
        name: '张大山',
        relationship: 'father',
        gender: 'male',
        idCard: '110101199001011234',
        birthDate: '1990-01-01',
        age: 36,
        bloodType: 'A',
        allergies: '无',
        medicalHistory: '高血压',
        phone: '13800138000',
        notes: '',
        createdBy: 'user_001',
        editableBy: ['user_001', 'user_002'],
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z'
      },
      {
        id: 'member_002',
        groupId: 'group_001',
        name: '王小花',
        relationship: 'mother',
        gender: 'female',
        idCard: '110101199205052345',
        birthDate: '1992-05-05',
        age: 34,
        bloodType: 'B',
        allergies: '青霉素',
        medicalHistory: '无',
        phone: '13900139000',
        notes: '',
        createdBy: 'user_001',
        editableBy: ['user_001'],
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z'
      },
      {
        id: 'member_003',
        groupId: 'group_001',
        name: '张小明',
        relationship: 'son',
        gender: 'male',
        idCard: '',
        birthDate: '2016-01-01',
        age: 10,
        bloodType: '',
        allergies: '',
        medicalHistory: '',
        phone: '',
        notes: '',
        createdBy: 'user_001',
        editableBy: ['user_001'],
        createdAt: '2026-06-01T00:00:00.000Z',
        updatedAt: '2026-06-01T00:00:00.000Z'
      }
    ];

    // Test medical record for 张大山
    const medicalRecords = [
      {
        id: 'record_001',
        memberId: 'member_001',
        groupId: 'group_001',
        memberName: '张大山',
        visitDate: '2026-07-01',
        hospital: '协和医院',
        department: '内科',
        doctor: '李医生',
        diagnosis: '感冒',
        symptoms: '咳嗽发烧',
        prescription: '阿莫西林',
        cost: 200,
        notes: '多休息',
        images: [],
        createdAt: '2026-07-01T10:00:00.000Z',
        updatedAt: '2026-07-01T10:00:00.000Z'
      }
    ];

    // Test treatment for that record
    const treatments = [
      {
        id: 'treatment_001',
        medicalRecordId: 'record_001',
        memberId: 'member_001',
        groupId: 'group_001',
        memberName: '张大山',
        treatmentDate: '2026-07-02',
        startDate: '2026-07-02',
        endDate: '',
        treatmentType: 'medication',
        treatmentContent: '服用阿莫西林每日3次',
        duration: '7天',
        effect: '好转',
        notes: '',
        images: [],
        createdAt: '2026-07-02T09:00:00.000Z',
        updatedAt: '2026-07-02T09:00:00.000Z'
      }
    ];

    // Save all test data
    this.save(this.KEYS.USERS, users);
    this.save(this.KEYS.GROUPS, groups);
    this.save(this.KEYS.MEMBERS, members);
    this.save(this.KEYS.MEDICAL_RECORDS, medicalRecords);
    this.save(this.KEYS.TREATMENTS, treatments);

    // Mark as initialized
    localStorage.setItem(this._prefixedKey(this.KEYS.INITIALIZED), 'true');
  }
};
