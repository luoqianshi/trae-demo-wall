(function(window) {
  // ============================================================
  // Storage性能优化：内存缓存 + 延迟写入
  // ============================================================
  const memoryCache = new Map(); // 内存缓存层，避免频繁JSON解析
  let pendingWrites = {};        // 待写入的数据
  let writeScheduled = false;     // 是否已安排写入

  // 批量延迟写入localStorage，提升性能
  function scheduleWrite(key, value) {
    pendingWrites[key] = value;
    
    if (!writeScheduled) {
      writeScheduled = true;
      requestAnimationFrame(() => {
        flushWrites();
      });
    }
  }

  // 批量写入所有待处理的数据
  function flushWrites() {
    try {
      const keys = Object.keys(pendingWrites);
      for (const key of keys) {
        const value = pendingWrites[key];
        // 对于null值，移除该项
        if (value === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
        delete pendingWrites[key];
      }
    } catch (e) {
      console.error('Storage.flushWrites error:', e);
    }
    writeScheduled = false;
  }

  const Storage = {
    // 强制刷新所有待写入数据
    flush() {
      flushWrites();
    },

    setItem(key, value) {
      try {
        // 立即更新内存缓存
        memoryCache.set(key, value);
        // 延迟写入localStorage
        scheduleWrite(key, value);
        return true;
      } catch (e) {
        console.error('Storage.setItem error:', e);
        return false;
      }
    },

    getItem(key) {
      // 优先从内存缓存读取
      if (memoryCache.has(key)) {
        return memoryCache.get(key);
      }
      
      try {
        const value = localStorage.getItem(key);
        const parsed = value ? JSON.parse(value) : null;
        // 存入内存缓存
        if (parsed !== null) {
          memoryCache.set(key, parsed);
        }
        return parsed;
      } catch (e) {
        console.error('Storage.getItem error:', e);
        return null;
      }
    },

    // 直接设置值，绕过缓存（用于紧急同步场景）
    setItemSync(key, value) {
      try {
        memoryCache.set(key, value);
        localStorage.setItem(key, JSON.stringify(value));
        delete pendingWrites[key];
        return true;
      } catch (e) {
        console.error('Storage.setItemSync error:', e);
        return false;
      }
    },

    removeItem(key) {
      try {
        memoryCache.delete(key);
        scheduleWrite(key, null);
        return true;
      } catch (e) {
        console.error('Storage.removeItem error:', e);
        return false;
      }
    },

    clear() {
      try {
        memoryCache.clear();
        pendingWrites = {};
        localStorage.clear();
        return true;
      } catch (e) {
        console.error('Storage.clear error:', e);
        return false;
      }
    },
    
    // 清除内存缓存（但不清除localStorage）
    clearMemoryCache() {
      memoryCache.clear();
    },
    
    addFavorite(id) {
      const favorites = this.getFavorites();
      if (!favorites.includes(id)) {
        favorites.push(id);
        this.setItem('favorites', favorites);
      }
      return favorites;
    },

    removeFavorite(id) {
      const favorites = this.getFavorites();
      const filtered = favorites.filter(item => item !== id);
      this.setItem('favorites', filtered);
      return filtered;
    },

    getFavorites() {
      return this.getItem('favorites') || [];
    },

    isFavorite(id) {
      const favorites = this.getFavorites();
      return favorites.includes(id);
    },

    addBooking(booking) {
      const bookings = this.getBookings();
      booking.id = Date.now().toString();
      booking.createdAt = new Date().toISOString();
      booking.status = booking.status || 'confirmed';
      bookings.push(booking);
      this.setItem('bookings', bookings);
      return booking;
    },

    removeBooking(id) {
      const bookings = this.getBookings();
      const filtered = bookings.filter(item => item.id !== id);
      this.setItem('bookings', filtered);
      return filtered;
    },

    cancelBooking(id) {
      const bookings = this.getBookings();
      const updated = bookings.map(item => {
        if (item.id === id) {
          return { ...item, status: 'cancelled', cancelledAt: new Date().toISOString() };
        }
        return item;
      });
      this.setItem('bookings', updated);
      return updated;
    },

    getBookings() {
      return this.getItem('bookings') || [];
    },

    hasBooked(id) {
      const bookings = this.getBookings();
      return bookings.some(item => item.activityId === id);
    },

    addSubscription(tag) {
      const subscriptions = this.getSubscriptions();
      if (!subscriptions.includes(tag)) {
        subscriptions.push(tag);
        this.setItem('subscriptions', subscriptions);
      }
      return subscriptions;
    },

    removeSubscription(tag) {
      const subscriptions = this.getSubscriptions();
      const filtered = subscriptions.filter(item => item !== tag);
      this.setItem('subscriptions', filtered);
      return filtered;
    },

    getSubscriptions() {
      return this.getItem('subscriptions') || [];
    },

    isSubscribed(tag) {
      const subscriptions = this.getSubscriptions();
      return subscriptions.includes(tag);
    },

    addSchedule(schedule) {
      const schedules = this.getSchedules();
      schedule.id = Date.now().toString();
      schedule.createdAt = new Date().toISOString();
      schedules.push(schedule);
      this.setItem('schedules', schedules);
      return schedule;
    },

    removeSchedule(id) {
      const schedules = this.getSchedules();
      const filtered = schedules.filter(item => item.id !== id);
      this.setItem('schedules', filtered);
      return filtered;
    },

    getSchedules() {
      return this.getItem('schedules') || [];
    },

    hasSchedule(id) {
      const schedules = this.getSchedules();
      return schedules.some(item => item.activityId === id);
    },

    addSearchHistory(query) {
      const history = this.getSearchHistory();
      const filtered = history.filter(item => item !== query);
      filtered.unshift(query);
      const limited = filtered.slice(0, 20);
      this.setItem('searchHistory', limited);
      return limited;
    },

    getSearchHistory() {
      return this.getItem('searchHistory') || [];
    },

    removeSearchHistory(query) {
      const history = this.getSearchHistory();
      const filtered = history.filter(item => item !== query);
      this.setItem('searchHistory', filtered);
      return filtered;
    },

    clearSearchHistory() {
      this.setItem('searchHistory', []);
      return [];
    },

    getUser() {
      return this.getItem('user') || {
        id: 'default-user',
        name: '用户',
        avatar: '',
        phone: '',
        location: '北京市',
        childAge: 5,
        preferences: []
      };
    },

    setUser(user) {
      this.setItem('user', user);
      return user;
    },

    addMessage(message) {
      const messages = this.getMessages();
      message.id = Date.now().toString();
      message.createdAt = new Date().toISOString();
      message.read = false;
      messages.unshift(message);
      this.setItem('messages', messages);
      return message;
    },

    getMessages() {
      return this.getItem('messages') || [];
    },

    markAsRead(id) {
      const messages = this.getMessages();
      const updated = messages.map(item => {
        if (item.id === id) {
          return { ...item, read: true };
        }
        return item;
      });
      this.setItem('messages', updated);
      return updated;
    },

    deleteMessage(id) {
      const messages = this.getMessages();
      const filtered = messages.filter(item => item.id !== id);
      this.setItem('messages', filtered);
      return filtered;
    },

    markAllAsRead() {
      const messages = this.getMessages();
      const updated = messages.map(item => ({ ...item, read: true }));
      this.setItem('messages', updated);
      return updated;
    },

    getReminderSettings() {
      return this.getItem('reminderSettings') || {
        beforeDeadline: '24h',
        beforeStart: '1h'
      };
    },

    setReminderSettings(settings) {
      this.setItem('reminderSettings', settings);
      return settings;
    },

    getActivityReminders() {
      return this.getItem('activityReminders') || {};
    },

    getActivityReminder(activityId) {
      const reminders = this.getActivityReminders();
      return reminders[activityId] || null;
    },

    setActivityReminder(activityId, reminder) {
      const reminders = this.getActivityReminders();
      reminders[activityId] = reminder;
      this.setItem('activityReminders', reminders);
      return reminders;
    },

    removeActivityReminder(activityId) {
      const reminders = this.getActivityReminders();
      delete reminders[activityId];
      this.setItem('activityReminders', reminders);
      return reminders;
    },

    hasActivityReminder(activityId) {
      const reminders = this.getActivityReminders();
      return !!reminders[activityId];
    },

    getSettings() {
      return this.getItem('settings') || {
        notifications: {
          enabled: true,
          activityReminder: true,
          bookingSuccess: true,
          bookingFailure: true,
          activityCancel: true,
          subscription: true,
          systemNotice: true
        },
        privacy: {
          showLocation: true,
          allowDataCollection: true
        },
        cacheSize: 0
      };
    },

    setSettings(settings) {
      this.setItem('settings', settings);
      return settings;
    },

    updateSettings(key, value) {
      const settings = this.getSettings();
      const keys = key.split('.');
      let current = settings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      this.setItem('settings', settings);
      return settings;
    },

    getNotificationSetting(key) {
      const settings = this.getSettings();
      if (key === 'enabled') {
        return settings.notifications.enabled;
      }
      return settings.notifications[key] !== false;
    },

    setNotificationSetting(key, value) {
      return this.updateSettings(`notifications.${key}`, value);
    },

    getCacheSize() {
      const settings = this.getSettings();
      return settings.cacheSize || 0;
    },

    setCacheSize(size) {
      return this.updateSettings('cacheSize', size);
    },

    clearCache() {
      this.clearSearchHistory();
      this.clearMemoryCache();
      this.setCacheSize(0);
      return 0;
    },

    getUnreadMessageCount() {
      const messages = this.getMessages();
      return messages.filter(m => !m.read).length;
    },

    getAppVersion() {
      return '1.0.0';
    }
  };

  window.Storage = Storage;
})(window);