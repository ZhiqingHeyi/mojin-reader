/**
 * 隐蔽功能管理器
 * 提供老板键、透明度调节、鼠标移出隐藏等功能
 * 通过 preload 暴露的 window.electron 与主进程通信（contextIsolation 环境下不能直接 require('electron')）
 */

export interface StealthSettings {
  // 老板键设置
  bossKeyEnabled: boolean;
  bossKey: string; // 例如 "Alt+Z"

  // 透明度设置
  transparencyEnabled: boolean;
  opacity: number; // 0.3 - 1.0 整体透明度

  // 分层透明度（屏蔽模式控制台）
  contentOpacity: number; // 内容区透明度 0.4 - 1.0
  backgroundOpacity: number; // 背景板透明度 0.15 - 1.0

  // 鼠标移出隐藏
  mouseOutHideEnabled: boolean;
  mouseOutHideDelay: number; // 毫秒

  // 其他隐蔽设置
  hideOnMinimize: boolean;
  hideTaskbarIcon: boolean;
  hideDockIcon: boolean;
  alwaysOnTop: boolean;
  hideTitle: boolean;
}

export interface StealthState {
  isHidden: boolean;
  isTransparent: boolean;
  currentOpacity: number;
  mouseOutTimer: number | null;
}

class StealthManager {
  private settings: StealthSettings;
  private state: StealthState;
  private listeners: Map<string, Array<(...args: any[]) => void>>;
  private unbindBossKey: (() => void) | null = null;

  constructor() {
    this.settings = {
      bossKeyEnabled: true,
      bossKey: 'Alt+Z',
      transparencyEnabled: true,
      opacity: 1.0,
      contentOpacity: 1.0,
      backgroundOpacity: 1.0,
      mouseOutHideEnabled: false,
      mouseOutHideDelay: 500,
      hideOnMinimize: false,
      hideTaskbarIcon: false,
      hideDockIcon: false,
      alwaysOnTop: false,
      hideTitle: false,
    };

    this.state = {
      isHidden: false,
      isTransparent: false,
      currentOpacity: 1.0,
      mouseOutTimer: null,
    };

    this.listeners = new Map();

    // 先恢复上次保存的设置
    this.loadSettings();

    // 初始化
    this.init();
  }

  private get api() {
    return typeof window !== 'undefined' ? window.electron : null;
  }

  /**
   * 初始化隐蔽功能
   */
  private init() {
    // 注册老板键监听（主进程已注册全局快捷键，这里只同步状态）
    this.registerBossKey();

    // 注册鼠标移出事件
    this.registerMouseEvents();

    // 应用初始设置（整体透明度/置顶/任务栏等）
    if (this.settings.transparencyEnabled && this.settings.opacity !== undefined) {
      this.api?.setWindowOpacity(this.settings.opacity);
      this.state.currentOpacity = this.settings.opacity;
    }
    if (this.settings.alwaysOnTop) {
      this.api?.setWindowAlwaysOnTop(true);
    }
    if (this.settings.hideTaskbarIcon) {
      this.api?.setWindowSkipTaskbar(true);
    }
    if (this.settings.hideDockIcon) {
      this.api?.hideDock();
    }
  }

  /**
   * 注册老板键状态同步
   */
  private registerBossKey() {
    if (this.settings.bossKeyEnabled && this.api) {
      this.unbindBossKey = this.api.onBossKey(() => {
        // 窗口的隐藏/显示由主进程完成，这里仅同步状态
        this.state.isHidden = !this.state.isHidden;
        this.emit('visibility-changed', !this.state.isHidden);
      });
    }
  }

  /**
   * 注册鼠标事件
   */
  private registerMouseEvents() {
    if (this.settings.mouseOutHideEnabled) {
      window.addEventListener('blur', this.handleMouseLeave);
      window.addEventListener('focus', this.handleMouseEnter);
      document.addEventListener('mouseleave', this.handleMouseLeave);
      document.addEventListener('mouseenter', this.handleMouseEnter);
    }
  }

  /**
   * 处理鼠标离开窗口：真正完全透明（透明度降为 0，不留虚影）
   */
  private handleMouseLeave = () => {
    if (!this.settings.mouseOutHideEnabled || this.state.isHidden) return;

    this.state.mouseOutTimer = window.setTimeout(() => {
      this.setTransparency(0, true);
      this.state.isTransparent = true;
      this.emit('transparency-changed', 0);
    }, this.settings.mouseOutHideDelay);
  };

  /**
   * 处理鼠标进入窗口：恢复到用户设定的整体透明度
   */
  private handleMouseEnter = () => {
    if (!this.settings.mouseOutHideEnabled) return;

    if (this.state.mouseOutTimer) {
      clearTimeout(this.state.mouseOutTimer);
      this.state.mouseOutTimer = null;
    }

    if (this.state.isTransparent) {
      this.setTransparency(this.settings.opacity);
      this.state.isTransparent = false;
      this.emit('transparency-changed', this.settings.opacity);
    }
  };

  /**
   * 隐藏窗口
   */
  public hide() {
    this.api?.hideWindow();
    this.state.isHidden = true;
    this.emit('visibility-changed', false);
  }

  /**
   * 显示窗口
   */
  public show() {
    this.api?.showWindow();
    this.state.isHidden = false;
    this.emit('visibility-changed', true);
  }

  /**
   * 切换窗口可见性
   */
  public toggleVisibility() {
    if (this.state.isHidden) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * 设置窗口整体透明度
   * @param opacity 目标透明度 0-1
   * @param allowDeepHide 是否允许极低透明度（用于"鼠标移出消失"；默认仅允许 0.3-1.0 的正常调节）
   */
  public setTransparency(opacity: number, allowDeepHide = false) {
    const validOpacity = allowDeepHide
      ? Math.max(0, Math.min(1.0, opacity))
      : Math.max(0.3, Math.min(1.0, opacity));
    this.api?.setWindowOpacity(validOpacity);
    this.state.currentOpacity = validOpacity;
    this.emit('opacity-changed', validOpacity);
  }

  /**
   * 设置内容区透明度（独立于整体透明度，作用于阅读内容/正文区域）
   */
  public setContentOpacity(value: number) {
    const valid = Math.max(0.4, Math.min(1.0, value));
    this.settings.contentOpacity = valid;
    this.emit('content-opacity-changed', valid);
    this.emit('settings-updated', this.settings);
    this.saveSettings();
  }

  /**
   * 设置背景板透明度（独立于整体透明度，作用于页面/背景面板区域）
   */
  public setBackgroundOpacity(value: number) {
    const valid = Math.max(0.15, Math.min(1.0, value));
    this.settings.backgroundOpacity = valid;
    this.emit('background-opacity-changed', valid);
    this.emit('settings-updated', this.settings);
    this.saveSettings();
  }

  /**
   * 更新设置
   */
  public updateSettings(newSettings: Partial<StealthSettings>) {
    const oldSettings = { ...this.settings };
    this.settings = { ...this.settings, ...newSettings };

    if (oldSettings.mouseOutHideEnabled !== this.settings.mouseOutHideEnabled) {
      if (this.settings.mouseOutHideEnabled) {
        window.addEventListener('blur', this.handleMouseLeave);
        window.addEventListener('focus', this.handleMouseEnter);
        document.addEventListener('mouseleave', this.handleMouseLeave);
        document.addEventListener('mouseenter', this.handleMouseEnter);
      } else {
        window.removeEventListener('blur', this.handleMouseLeave);
        window.removeEventListener('focus', this.handleMouseEnter);
        document.removeEventListener('mouseleave', this.handleMouseLeave);
        document.removeEventListener('mouseenter', this.handleMouseEnter);
      }
    }

    if (oldSettings.bossKeyEnabled !== this.settings.bossKeyEnabled && this.api) {
      if (this.settings.bossKeyEnabled && !this.unbindBossKey) {
        this.unbindBossKey = this.api.onBossKey(() => {
          this.state.isHidden = !this.state.isHidden;
          this.emit('visibility-changed', !this.state.isHidden);
        });
      } else if (!this.settings.bossKeyEnabled && this.unbindBossKey) {
        this.unbindBossKey();
        this.unbindBossKey = null;
      }
    }

    if (oldSettings.alwaysOnTop !== this.settings.alwaysOnTop) {
      this.api?.setWindowAlwaysOnTop(this.settings.alwaysOnTop);
    }

    if (oldSettings.hideTaskbarIcon !== this.settings.hideTaskbarIcon) {
      this.api?.setWindowSkipTaskbar(this.settings.hideTaskbarIcon);
    }

    if (oldSettings.hideDockIcon !== this.settings.hideDockIcon && this.settings.hideDockIcon) {
      this.api?.hideDock();
    }

    if (oldSettings.opacity !== this.settings.opacity && this.settings.transparencyEnabled) {
      this.setTransparency(this.settings.opacity);
    }

    this.emit('settings-updated', this.settings);
    this.saveSettings();
  }

  /**
   * 保存设置到本地存储
   */
  private saveSettings() {
    try {
      localStorage.setItem('stealth-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('保存隐蔽设置失败:', error);
    }
  }

  /**
   * 加载设置
   */
  public loadSettings() {
    try {
      const savedSettings = localStorage.getItem('stealth-settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        this.emit('settings-updated', this.settings);
      }
    } catch (error) {
      console.error('加载隐蔽设置失败:', error);
    }
  }

  /**
   * 获取当前设置
   */
  public getSettings(): StealthSettings {
    return { ...this.settings };
  }

  /**
   * 获取当前状态
   */
  public getState(): StealthState {
    return { ...this.state };
  }

  /**
   * 添加事件监听器
   */
  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emit(event: string, ...args: any[]) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`事件处理器错误 (${event}):`, error);
      }
    });
  }

  /**
   * 清理资源
   */
  public dispose() {
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('mouseenter', this.handleMouseEnter);

    if (this.state.mouseOutTimer) {
      clearTimeout(this.state.mouseOutTimer);
    }

    this.unbindBossKey?.();
    this.unbindBossKey = null;
  }
}

// 创建单例
const stealthManager = new StealthManager();

export default stealthManager;
