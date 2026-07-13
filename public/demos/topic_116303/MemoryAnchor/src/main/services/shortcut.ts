// Shortcut Service
// Handles global keyboard shortcuts

import { globalShortcut } from 'electron';
import { logger } from '../utils/logger';
import { ShortcutConfig, DEFAULT_SHORTCUTS } from '../../shared/types/config';
import { windowManager } from '../window';

/**
 * 快捷键动作类型
 */
export type ShortcutAction =
  | 'toggleWindow'
  | 'newCollection'
  | 'search'
  | 'allCollections'
  | 'settings'
  | 'quickScrape';

const ALL_ACTIONS: ShortcutAction[] = [
  'toggleWindow',
  'newCollection',
  'search',
  'allCollections',
  'settings',
  'quickScrape',
];

// Only these accelerators stay registered while the app is unfocused, so the
// window can be summoned from anywhere. Everything else is an in-app command
// and must NOT capture the key combo system-wide (it would steal the shortcut
// from whatever app the user is actually using).
const GLOBAL_ACTIONS: ReadonlySet<ShortcutAction> = new Set<ShortcutAction>(['toggleWindow']);

/**
 * 快捷键回调函数类型
 */
export type ShortcutCallback = () => void;

/**
 * 快捷键管理器类
 */
export class ShortcutManager {
  private shortcuts: Map<string, ShortcutCallback> = new Map();
  private registeredAccelerators: Map<string, string> = new Map();
  private isRegistered: boolean = false;
  private currentConfig: ShortcutConfig = DEFAULT_SHORTCUTS;
  private appScopedRegistered: boolean = false;

  constructor() {
    // 默认快捷键回调
    this.setupDefaultCallbacks();
  }

  /**
   * 设置默认快捷键回调函数
   */
  private setupDefaultCallbacks(): void {
    // 显示/隐藏窗口
    this.shortcuts.set('toggleWindow', () => {
      windowManager.toggleWindowVisibility();
      logger.debug('ShortcutManager', 'Toggled window visibility via shortcut');
    });

    // 新建收藏（发送消息到渲染进程）
    this.shortcuts.set('newCollection', () => {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send('shortcut:newCollection');
        logger.debug('ShortcutManager', 'Triggered new collection via shortcut');
      }
    });

    // 搜索（发送消息到渲染进程）
    this.shortcuts.set('search', () => {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        windowManager.showMainWindow();
        mainWindow.webContents.send('shortcut:search');
        logger.debug('ShortcutManager', 'Triggered search via shortcut');
      }
    });

    // 全部收藏（发送消息到渲染进程）
    this.shortcuts.set('allCollections', () => {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        windowManager.showMainWindow();
        mainWindow.webContents.send('shortcut:allCollections');
        logger.debug('ShortcutManager', 'Triggered all collections via shortcut');
      }
    });

    // 设置（发送消息到渲染进程）
    this.shortcuts.set('settings', () => {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        windowManager.showMainWindow();
        mainWindow.webContents.send('shortcut:settings');
        logger.debug('ShortcutManager', 'Triggered settings via shortcut');
      }
    });

    // 快速抓取（发送消息到渲染进程）
    this.shortcuts.set('quickScrape', () => {
      const mainWindow = windowManager.getMainWindow();
      if (mainWindow) {
        windowManager.showMainWindow();
        mainWindow.webContents.send('shortcut:quickScrape');
        logger.debug('ShortcutManager', 'Triggered quick scrape via shortcut');
      }
    });
  }

  /**
   * 注册快捷键
   */
  register(action: ShortcutAction, accelerator: string): boolean {
    // 检查快捷键格式是否有效
    if (!this.isValidAccelerator(accelerator)) {
      logger.error('ShortcutManager', `Invalid accelerator format: ${accelerator}`);
      return false;
    }

    // 检查快捷键是否已被占用
    if (this.registeredAccelerators.has(accelerator)) {
      logger.warn(
        'ShortcutManager',
        `Accelerator ${accelerator} is already registered for ${this.registeredAccelerators.get(accelerator)}`
      );
      return false;
    }

    // 检查是否已注册了该动作
    const oldAccelerator = this.registeredAccelerators.get(action);
    if (oldAccelerator) {
      // 先注销旧的快捷键
      this.unregister(action);
    }

    // 注册新的快捷键
    const callback = this.shortcuts.get(action);
    if (!callback) {
      logger.error('ShortcutManager', `No callback defined for action: ${action}`);
      return false;
    }

    try {
      const success = globalShortcut.register(accelerator, callback);

      if (success) {
        this.registeredAccelerators.set(accelerator, action);
        this.registeredAccelerators.set(action, accelerator);
        logger.info('ShortcutManager', `Registered shortcut: ${accelerator} for ${action}`);
        return true;
      } else {
        logger.error('ShortcutManager', `Failed to register shortcut: ${accelerator}`);
        return false;
      }
    } catch (error) {
      logger.error('ShortcutManager', `Error registering shortcut: ${accelerator}`, error);
      return false;
    }
  }

  /**
   * 注销快捷键
   */
  unregister(action: ShortcutAction): boolean {
    const accelerator = this.registeredAccelerators.get(action);

    if (!accelerator) {
      logger.warn('ShortcutManager', `No accelerator registered for action: ${action}`);
      return false;
    }

    try {
      globalShortcut.unregister(accelerator);
      this.registeredAccelerators.delete(accelerator);
      this.registeredAccelerators.delete(action);
      logger.info('ShortcutManager', `Unregistered shortcut: ${accelerator}`);
      return true;
    } catch (error) {
      logger.error('ShortcutManager', `Error unregistering shortcut: ${accelerator}`, error);
      return false;
    }
  }

  /**
   * 注销所有快捷键
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredAccelerators.clear();
    this.isRegistered = false;
    this.appScopedRegistered = false;
    logger.info('ShortcutManager', 'All shortcuts unregistered');
  }

  /**
   * 批量注册快捷键（使用配置）。
   *
   * 全局（与焦点无关）的快捷键始终注册；应用内快捷键仅在窗口聚焦时注册，
   * 以免在其他应用中抢占按键组合。
   */
  registerAll(config: ShortcutConfig): boolean {
    this.currentConfig = config;

    // 先注销所有现有的快捷键
    this.unregisterAll();

    // 注册全局快捷键（例如唤起窗口）
    const results: boolean[] = [];
    for (const action of ALL_ACTIONS) {
      if (GLOBAL_ACTIONS.has(action)) {
        results.push(this.register(action, config[action]));
      }
    }

    const successCount = results.filter((r) => r).length;
    this.isRegistered = successCount > 0;

    // 若窗口已聚焦，则同时激活应用内快捷键
    if (windowManager.getMainWindow()?.isFocused()) {
      this.registerAppScoped();
    }

    logger.info(
      'ShortcutManager',
      `Registered ${successCount}/${results.length} global shortcuts`
    );

    return this.isRegistered;
  }

  /**
   * 注册应用内（聚焦时生效）快捷键
   */
  private registerAppScoped(): void {
    if (this.appScopedRegistered) return;
    for (const action of ALL_ACTIONS) {
      if (!GLOBAL_ACTIONS.has(action)) {
        this.register(action, this.currentConfig[action]);
      }
    }
    this.appScopedRegistered = true;
    logger.debug('ShortcutManager', 'App-scoped shortcuts registered (window focused)');
  }

  /**
   * 注销应用内快捷键
   */
  private unregisterAppScoped(): void {
    if (!this.appScopedRegistered) return;
    for (const action of ALL_ACTIONS) {
      if (!GLOBAL_ACTIONS.has(action)) {
        this.unregister(action);
      }
    }
    this.appScopedRegistered = false;
    logger.debug('ShortcutManager', 'App-scoped shortcuts unregistered (window blurred)');
  }

  /**
   * 注册默认快捷键
   */
  registerDefaults(): boolean {
    return this.registerAll(DEFAULT_SHORTCUTS);
  }

  /**
   * 更新单个快捷键
   */
  updateShortcut(action: ShortcutAction, newAccelerator: string): boolean {
    this.currentConfig = { ...this.currentConfig, [action]: newAccelerator };

    // 先注销旧的快捷键
    this.unregister(action);

    // 全局快捷键始终生效；应用内快捷键仅在当前处于聚焦态时才实际注册
    if (GLOBAL_ACTIONS.has(action) || this.appScopedRegistered) {
      return this.register(action, newAccelerator);
    }
    return true;
  }

  /**
   * 检查快捷键格式是否有效
   */
  private isValidAccelerator(accelerator: string): boolean {
    // Electron 支持的按键
    const validKeys = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
      'F9',
      'F10',
      'F11',
      'F12',
      'F13',
      'F14',
      'F15',
      'F16',
      'F17',
      'F18',
      'F19',
      'F20',
      'F21',
      'F22',
      'F23',
      'F24',
      'Plus',
      'Space',
      'Tab',
      'Backspace',
      'Delete',
      'Insert',
      'Return',
      'Enter',
      'Up',
      'Down',
      'Left',
      'Right',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Escape',
      'Esc',
    ];

    // Electron 支持的修饰键
    const validModifiers = [
      'Command',
      'Cmd',
      'Control',
      'Ctrl',
      'CommandOrControl',
      'CmdOrCtrl',
      'Alt',
      'Option',
      'AltGr',
      'Shift',
      'Super',
      'Meta',
    ];

    // 分割快捷键字符串
    const parts = accelerator.split('+');

    // 检查每个部分
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // 最后一部分应该是主键
      if (i === parts.length - 1) {
        if (!validKeys.includes(part)) {
          return false;
        }
      } else {
        // 其他部分应该是修饰键
        if (!validModifiers.includes(part)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 检查快捷键冲突
   */
  checkConflicts(accelerator: string): {
    hasConflict: boolean;
    conflictWith?: string;
  } {
    if (this.registeredAccelerators.has(accelerator)) {
      return {
        hasConflict: true,
        conflictWith: this.registeredAccelerators.get(accelerator),
      };
    }

    // 检查系统或其他应用是否已注册该快捷键
    // 注意：globalShortcut.isRegistered 在某些平台可能不准确
    const isRegistered = globalShortcut.isRegistered(accelerator);
    if (isRegistered && !this.registeredAccelerators.has(accelerator)) {
      return {
        hasConflict: true,
        conflictWith: 'system or other application',
      };
    }

    return {
      hasConflict: false,
    };
  }

  /**
   * 获取已注册的快捷键列表
   */
  getRegisteredShortcuts(): Map<string, string> {
    return new Map(this.registeredAccelerators);
  }

  /**
   * 设置自定义快捷键回调
   */
  setCallback(action: ShortcutAction, callback: ShortcutCallback): void {
    this.shortcuts.set(action, callback);
    logger.debug('ShortcutManager', `Callback set for action: ${action}`);
  }

  /**
   * 获取快捷键是否已注册
   */
  isShortcutRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * 应用窗口获得焦点时：激活应用内快捷键
   */
  onWindowFocus(): void {
    // 全局快捷键在启动时已注册；聚焦时补充注册应用内快捷键
    if (!this.isRegistered) {
      this.registerDefaults();
      return;
    }
    this.registerAppScoped();
  }

  /**
   * 应用窗口失去焦点时：注销应用内快捷键
   *
   * 仅保留全局快捷键（例如唤起窗口），避免应用内快捷键在其他应用中
   * 抢占相同的按键组合。
   */
  onWindowBlur(): void {
    this.unregisterAppScoped();
  }

  /**
   * 销毁快捷键管理器
   */
  destroy(): void {
    this.unregisterAll();
    logger.info('ShortcutManager', 'Shortcut manager destroyed');
  }
}

// 导出单例实例
export const shortcutManager = new ShortcutManager();