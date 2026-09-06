import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import { IPC } from '../shared/ipc';

export interface WindowOptions {
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  frame?: boolean;
  transparent?: boolean;
  alwaysOnTop?: boolean;
  skipTaskbar?: boolean;
  title?: string;
  icon?: string;
}

// 窗口尺寸模式
export const MINI_HEIGHT = 380; // 迷你模式高度
export const WIDE_WIDTH = 950; // PC 宽屏阅读模式宽度

class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;
  // 迷你模式 / 宽屏模式记忆的原始尺寸
  private miniOriginalSize = { width: 400, height: 700 };
  private wideOriginalSize = { width: 400, height: 700 };
  private isMini = false;
  private isWide = false;

  /**
   * 创建主窗口（只负责窗口的创建与生命周期，托盘/IPC/快捷键由入口统一管理）
   */
  public createMainWindow(options: WindowOptions = {}): BrowserWindow {
    const defaultOptions: WindowOptions = {
      width: 400,
      height: 700,
      minWidth: 320,
      minHeight: 360,
      frame: true,
      transparent: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      title: '摸金阅读',
    };

    const windowOptions = { ...defaultOptions, ...options };

    this.mainWindow = new BrowserWindow({
      width: windowOptions.width,
      height: windowOptions.height,
      minWidth: windowOptions.minWidth,
      minHeight: windowOptions.minHeight,
      frame: windowOptions.frame,
      transparent: windowOptions.transparent,
      alwaysOnTop: windowOptions.alwaysOnTop,
      skipTaskbar: windowOptions.skipTaskbar,
      title: windowOptions.title,
      icon: windowOptions.icon,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    // 关闭时隐藏到托盘，而非真正退出
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow?.hide();
      }
    });

    // 窗口失焦/聚焦事件转发给渲染进程
    this.mainWindow.on('blur', () => {
      this.mainWindow?.webContents.send(IPC.EventWindowBlur);
    });
    this.mainWindow.on('focus', () => {
      this.mainWindow?.webContents.send(IPC.EventWindowFocus);
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  public getWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  public hide(): void {
    this.mainWindow?.hide();
  }

  public show(): void {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  public minimize(): void {
    this.mainWindow?.minimize();
  }

  public setOpacity(opacity: number): void {
    this.mainWindow?.setOpacity(opacity);
  }

  public setAlwaysOnTop(flag: boolean): void {
    this.mainWindow?.setAlwaysOnTop(flag);
  }

  public setSkipTaskbar(flag: boolean): void {
    this.mainWindow?.setSkipTaskbar(flag);
  }

  /**
   * 迷你模式：在迷你高度与原始高度之间切换
   */
  public toggleMini(): void {
    if (!this.mainWindow) return;
    const [w, h] = this.mainWindow.getSize();
    if (!this.isMini) {
      this.miniOriginalSize = { width: w, height: h };
      this.mainWindow.setSize(w, MINI_HEIGHT);
      this.isMini = true;
    } else {
      this.mainWindow.setSize(this.miniOriginalSize.width, this.miniOriginalSize.height);
      this.isMini = false;
    }
  }

  /**
   * PC 宽屏阅读模式：在宽屏宽度与原始宽度之间切换
   */
  public toggleWide(): void {
    if (!this.mainWindow) return;
    const [w, h] = this.mainWindow.getSize();
    if (!this.isWide) {
      this.wideOriginalSize = { width: w, height: h };
      this.mainWindow.setSize(WIDE_WIDTH, h);
      this.isWide = true;
    } else {
      this.mainWindow.setSize(this.wideOriginalSize.width, this.wideOriginalSize.height);
      this.isWide = false;
    }
  }

  /**
   * 最大化 / 还原切换
   */
  public toggleMaximize(): void {
    if (!this.mainWindow) return;
    if (this.mainWindow.isMaximized()) {
      this.mainWindow.unmaximize();
    } else {
      this.mainWindow.maximize();
    }
  }

  /**
   * 隐藏 macOS Dock 图标（仅保留托盘入口，极致隐蔽）
   */
  public hideDock(): void {
    if (process.platform === 'darwin') {
      app.dock?.hide();
    }
  }

  public isMiniMode(): boolean {
    return this.isMini;
  }

  public isWideMode(): boolean {
    return this.isWide;
  }

  public getState() {
    if (!this.mainWindow) return null;
    return {
      isVisible: this.mainWindow.isVisible(),
      isMinimized: this.mainWindow.isMinimized(),
      isMaximized: this.mainWindow.isMaximized(),
      opacity: this.mainWindow.getOpacity(),
      alwaysOnTop: this.mainWindow.isAlwaysOnTop(),
      isMini: this.isMini,
      isWide: this.isWide,
    };
  }

  public setQuitting(value: boolean): void {
    this.isQuitting = value;
  }

  public isQuitAllowed(): boolean {
    return this.isQuitting;
  }

  public dispose(): void {
    if (this.mainWindow) {
      this.mainWindow.close();
      this.mainWindow = null;
    }
  }
}

// 创建单例
const windowManager = new WindowManager();

export default windowManager;
