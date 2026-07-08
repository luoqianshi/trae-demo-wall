import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Wechat4u, { Wechat4uContact, Wechat4uMessage } from 'wechat4u';

export interface WechatStatus {
  connected: boolean;
  loggedIn: boolean;
  userNickName: string | null;
  qrCodeUrl: string | null;
  phase: 'idle' | 'waiting_scan' | 'waiting_confirm' | 'logged_in' | 'logged_out' | 'error';
  contactCount: number;
  lastError: string | null;
}

export interface WechatContactDto {
  id: string;
  name: string;
  remarkName: string;
  avatar: string;
  type: 'friend' | 'group' | 'official' | 'special';
  isStar: boolean;
  signature: string;
}

export interface WechatMessageDto {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  content: string;
  timestamp: number;
  isSelf: boolean;
  type: 'text' | 'image' | 'voice' | 'file' | 'other';
}

/**
 * WechatService - Manages a real WeChat web connection via wechat4u.
 *
 * Lifecycle:
 * 1. startLogin() → generates QR code, returns URL
 * 2. User scans QR → state moves to waiting_confirm
 * 3. User confirms on phone → state moves to logged_in
 * 4. Contacts are fetched automatically on login
 * 5. Messages are received via 'message' event and stored in memory
 * 6. sendMessage() sends text to a contact
 * 7. logout() disconnects
 */
@Injectable()
export class WechatService implements OnModuleDestroy {
  private readonly logger = new Logger(WechatService.name);
  private bot: Wechat4u | null = null;

  private qrCodeUrl: string | null = null;
  private loggedIn = false;
  private userNickName: string | null = null;
  private phase: WechatStatus['phase'] = 'idle';
  private lastError: string | null = null;

  /** Auto-reconnect state */
  private syncFailCount = 0;
  private maxSyncRetries = 5;
  private reconnectDelay = 5000;
  private isReconnecting = false;
  private botData: any = null; // Exported bot data for session restore

  /** In-memory message store: contactId → messages[] */
  private messageStore = new Map<string, WechatMessageDto[]>();

  /** In-memory contact cache */
  private contactCache: WechatContactDto[] = [];

  /** Callback for incoming messages (used by controller for SSE push) */
  private messageListeners: Array<(msg: WechatMessageDto) => void> = [];

  /**
   * Start the WeChat login process. Generates a QR code URL.
   * Returns the QR code URL that the frontend should render.
   */
  async startLogin(): Promise<{ qrCodeUrl: string }> {
    // If already logged in, return current state
    if (this.loggedIn && this.bot) {
      return { qrCodeUrl: '' };
    }

    // Clean up any existing bot instance
    if (this.bot) {
      try {
        this.bot.logout();
      } catch {
        // ignore
      }
      this.bot = null;
    }

    this.phase = 'idle';
    this.qrCodeUrl = null;
    this.lastError = null;

    // Create new bot instance
    this.bot = new Wechat4u();

    // Set up event handlers
    this.bot.on('uuid', (uuid: string) => {
      this.qrCodeUrl = `https://login.weixin.qq.com/qrcode/${uuid}`;
      this.phase = 'waiting_scan';
      this.logger.log('WeChat QR code generated, waiting for scan...');
    });

    this.bot.on('scan', () => {
      this.phase = 'waiting_scan';
      this.logger.log('WeChat QR code scanned, waiting for confirm...');
    });

    this.bot.on('confirm', () => {
      this.phase = 'waiting_confirm';
      this.logger.log('WeChat login confirmed, connecting...');
    });

    this.bot.on('login', async () => {
      this.loggedIn = true;
      this.phase = 'logged_in';
      this.syncFailCount = 0;
      this.userNickName = this.bot?.user?.NickName || 'Unknown';
      this.logger.log(`WeChat logged in: ${this.userNickName}`);

      // Save bot data for potential session restore
      try {
        this.botData = this.bot?.botData;
      } catch {
        // ignore
      }

      // Fetch contacts
      try {
        await this.bot?.updateContacts();
        this.buildContactCache();
        this.logger.log(`Loaded ${this.contactCache.length} contacts`);
      } catch (err) {
        this.logger.warn(`Failed to fetch contacts: ${(err as Error).message}`);
      }
    });

    this.bot.on('contacts-updated', () => {
      // Rebuild contact cache when contacts are updated
      if (this.loggedIn) {
        this.buildContactCache();
        this.logger.debug(`Contacts updated: ${this.contactCache.length} contacts`);
      }
    });

    this.bot.on('logout', () => {
      const wasLoggedIn = this.loggedIn;
      this.loggedIn = false;
      this.phase = 'logged_out';
      this.qrCodeUrl = null;
      this.contactCache = [];
      this.messageStore.clear();
      this.logger.log('WeChat logged out');

      // Auto-reconnect if we were previously logged in (not a manual logout)
      if (wasLoggedIn && !this.isReconnecting) {
        this.scheduleReconnect();
      }
    });

    this.bot.on('message', (msg: Wechat4uMessage) => {
      this.handleIncomingMessage(msg);
    });

    this.bot.on('error', (err: Error) => {
      const errMsg = err.message || '';
      this.logger.error(`WeChat error: ${errMsg}`);

      // 1102 = sync failure, NOT a fatal login error
      // wechat4u internally retries sync 3 times, then may logout/restart
      // We should NOT mark the session as errored if we're already logged in
      if (errMsg.includes('1102') || errMsg.includes('同步失败')) {
        this.syncFailCount++;
        this.logger.warn(`WeChat sync failure #${this.syncFailCount}: ${errMsg}`);

        // Keep lastError for frontend display, but DON'T change phase
        this.lastError = `同步中断 (${this.syncFailCount}/${this.maxSyncRetries})，正在自动重连...`;

        // If too many failures, let wechat4u handle restart
        if (this.syncFailCount >= this.maxSyncRetries && !this.isReconnecting) {
          this.logger.warn(`Max sync retries (${this.maxSyncRetries}) reached, scheduling reconnect...`);
          // Don't change phase - wechat4u will either restart or logout
          // If it logs out, the logout handler will trigger reconnect
        }
      } else if (!this.loggedIn) {
        // Only mark as error if we haven't logged in yet (login phase error)
        this.lastError = errMsg;
        this.phase = 'error';
      } else {
        // Non-1102 error after login - log but keep session alive
        this.logger.warn(`Non-fatal WeChat error after login: ${errMsg}`);
        this.lastError = errMsg;
      }
    });

    // Start the login process
    this.bot.start();

    // Wait for QR code URL to be generated (max 15 seconds)
    const maxWait = 15000;
    const interval = 200;
    const startTime = Date.now();
    while (!this.qrCodeUrl && Date.now() - startTime < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    if (!this.qrCodeUrl) {
      throw new Error('Failed to generate WeChat QR code. Please try again.');
    }

    return { qrCodeUrl: this.qrCodeUrl };
  }

  /**
   * Get current WeChat connection status.
   */
  getStatus(): WechatStatus {
    return {
      connected: this.phase === 'logged_in',
      loggedIn: this.loggedIn,
      userNickName: this.userNickName,
      qrCodeUrl: this.qrCodeUrl,
      phase: this.phase,
      contactCount: this.contactCache.length,
      lastError: this.lastError,
    };
  }

  /**
   * Get the WeChat contacts list.
   */
  getContacts(): WechatContactDto[] {
    return this.contactCache;
  }

  /**
   * Get messages for a specific contact.
   */
  getMessages(contactId: string, limit = 50): WechatMessageDto[] {
    const messages = this.messageStore.get(contactId) || [];
    return messages.slice(-limit);
  }

  /**
   * Send a text message to a WeChat contact.
   */
  async sendMessage(toId: string, content: string): Promise<{ success: boolean }> {
    if (!this.loggedIn || !this.bot) {
      throw new Error('WeChat is not logged in');
    }

    try {
      await this.bot.sendMsg(content, toId);

      // Store the outgoing message
      const msg: WechatMessageDto = {
        id: `out-${Date.now()}`,
        fromId: this.bot.user?.UserName || 'self',
        fromName: this.userNickName || 'Me',
        toId,
        toName: this.getContactName(toId),
        content,
        timestamp: Date.now(),
        isSelf: true,
        type: 'text',
      };
      this.storeMessage(toId, msg);

      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to send WeChat message: ${(err as Error).message}`);
      throw err;
    }
  }

  /**
   * Register a listener for incoming messages (used for SSE push).
   */
  onMessage(listener: (msg: WechatMessageDto) => void): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Logout from WeChat.
   */
  async logout(): Promise<void> {
    // Mark as manual logout to prevent auto-reconnect
    this.isReconnecting = true;
    
    if (this.bot) {
      try {
        this.bot.logout();
      } catch {
        // ignore
      }
    }
    this.loggedIn = false;
    this.phase = 'logged_out';
    this.qrCodeUrl = null;
    this.contactCache = [];
    this.messageStore.clear();
    this.syncFailCount = 0;
    this.botData = null;
    this.isReconnecting = false;
    this.logger.log('WeChat logged out (manual)');
  }

  /**
   * Schedule an automatic reconnect with exponential backoff.
   * Uses saved botData to restore the session if available.
   */
  private async scheduleReconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.syncFailCount), 60000);
    this.logger.log(`Scheduling WeChat reconnect in ${delay / 1000}s (syncFailCount: ${this.syncFailCount})...`);

    await new Promise((resolve) => setTimeout(resolve, delay));

    this.isReconnecting = false;
    this.syncFailCount++;

    try {
      this.logger.log('Attempting WeChat reconnect...');

      // Try to restart with existing bot data
      if (this.bot) {
        try {
          this.bot.restart();
          this.logger.log('WeChat restart initiated');
          return;
        } catch (err) {
          this.logger.warn(`WeChat restart failed: ${(err as Error).message}, trying fresh login...`);
        }
      }

      // If restart fails, fall back to fresh login
      this.bot = null;
      this.phase = 'idle';
      this.lastError = null;
      await this.startLogin();
      this.logger.log('WeChat fresh login initiated after reconnect failure');
    } catch (err) {
      this.logger.error(`WeChat reconnect failed: ${(err as Error).message}`);
      this.lastError = `重连失败: ${(err as Error).message}`;

      // Retry with longer delay
      if (this.syncFailCount < this.maxSyncRetries + 3) {
        this.scheduleReconnect();
      } else {
        this.phase = 'error';
        this.logger.error('Max reconnect attempts reached. WeChat requires manual re-login.');
      }
    }
  }

  /**
   * Clean up on module destroy.
   */
  onModuleDestroy() {
    if (this.bot) {
      try {
        this.bot.logout();
      } catch {
        // ignore
      }
    }
  }

  // ============================================================
  // Private helpers
  // ============================================================

  private handleIncomingMessage(msg: Wechat4uMessage) {
    if (!this.bot) return;

    const fromId = msg.FromUserName;
    const toId = msg.ToUserName;
    const isSelf = fromId === this.bot.user?.UserName;

    // Determine the "other party" ID (for message storage)
    const otherId = isSelf ? toId : fromId;

    // Parse message content (for group messages, format is "senderId:\ncontent")
    let content = msg.Content;
    let senderName = this.getContactName(fromId);
    if (fromId.startsWith('@@') && content.includes(':\n')) {
      const colonIdx = content.indexOf(':\n');
      const senderId = content.substring(0, colonIdx);
      content = content.substring(colonIdx + 2);
      senderName = this.getContactName(senderId) || senderName;
    }

    // Only store text messages (MsgType 1 = text)
    if (msg.MsgType !== 1 && msg.MsgType !== 3) return;

    const dto: WechatMessageDto = {
      id: msg.MsgId || `msg-${Date.now()}`,
      fromId,
      fromName: senderName,
      toId,
      toName: isSelf ? this.getContactName(toId) : this.userNickName || 'Me',
      content: msg.MsgType === 3 ? '[图片]' : content,
      timestamp: msg.CreateTime * 1000,
      isSelf,
      type: msg.MsgType === 1 ? 'text' : msg.MsgType === 3 ? 'image' : 'other',
    };

    this.storeMessage(otherId, dto);

    // Notify listeners
    this.messageListeners.forEach((listener) => {
      try {
        listener(dto);
      } catch {
        // ignore listener errors
      }
    });

    this.logger.debug(`WeChat message from ${senderName}: ${content.substring(0, 50)}`);
  }

  private storeMessage(contactId: string, msg: WechatMessageDto) {
    if (!this.messageStore.has(contactId)) {
      this.messageStore.set(contactId, []);
    }
    this.messageStore.get(contactId)!.push(msg);

    // Keep only last 200 messages per contact
    const messages = this.messageStore.get(contactId)!;
    if (messages.length > 200) {
      this.messageStore.set(contactId, messages.slice(-200));
    }
  }

  private buildContactCache() {
    if (!this.bot?.contacts) return;

    this.contactCache = Object.values(this.bot.contacts)
      .filter((c) => {
        // Filter out system contacts and empty names
        if (!c.NickName && !c.RemarkName) return false;
        // Filter out file helper and system accounts
        if (c.UserName.startsWith('fmessage')) return false;
        if (c.UserName === 'filehelper') return false;
        if (c.VerifyFlag & 8) return false; // official accounts - keep them actually
        return true;
      })
      .map((c) => ({
        id: c.UserName,
        name: c.RemarkName || c.NickName || 'Unknown',
        remarkName: c.RemarkName,
        avatar: '', // HeadImgUrl needs separate fetch
        type: this.getContactType(c),
        isStar: c.StarFriend === 1,
        signature: c.Signature || '',
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  }

  private getContactType(c: Wechat4uContact): WechatContactDto['type'] {
    if (c.UserName.startsWith('@@')) return 'group';
    if (c.VerifyFlag & 8) return 'official';
    if (c.UserName.startsWith('gh_')) return 'official';
    if (c.Special) return 'special';
    return 'friend';
  }

  private getContactName(id: string): string {
    if (!this.bot?.contacts) return id;
    const c = this.bot.contacts[id];
    if (!c) return id;
    return c.RemarkName || c.NickName || id;
  }
}
