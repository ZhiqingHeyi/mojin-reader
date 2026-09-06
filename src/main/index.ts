import './setUserData';
import { app, BrowserWindow, Menu, Tray, nativeImage, NativeImage } from 'electron';
import * as path from 'path';
import windowManager from './window';
import { registerIpcHandlers } from './ipc';
import { ShortcutManager } from './shortcuts';
import { MenuManager } from './menu';
import { IPC } from '../shared/ipc';

// 当 assets 图标缺失时，用代码生成一个纯色兜底图标，避免托盘创建崩溃
function createFallbackTrayIcon(): NativeImage {
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      buf[i] = 0x4a;      // R
      buf[i + 1] = 0x7d;  // G
      buf[i + 2] = 0xff;  // B
      buf[i + 3] = 255;   // A
    }
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

class MojinReaderApp {
  private tray: Tray | null = null;
  private shortcutManager: ShortcutManager;
  private menuManager: MenuManager;

  constructor() {
    this.shortcutManager = new ShortcutManager();
    this.menuManager = new MenuManager();
    this.initializeApp();
  }

  private initializeApp(): void {
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    app.on('second-instance', () => {
      const win = windowManager.getWindow();
      if (win) {
        if (win.isMinimized()) win.restore();
        win.show();
        win.focus();
      }
    });

    app.whenReady().then(() => {
      // 在 macOS 开发环境下动态设置 Dock 图标与名称
      if (process.platform === 'darwin' && app.dock) {
        app.setName('摸金阅读');
        // 优先尝试根目录的 build/icons/icon.png，兼容开发态和编译后路径
        const possibleIconPaths = [
          path.join(__dirname, '../../build/icons/icon.png'),
          path.join(__dirname, '../build/icons/icon.png'),
          path.join(__dirname, '../assets/tray-icon.png'),
        ];
        for (const p of possibleIconPaths) {
          const dockIcon = nativeImage.createFromPath(p);
          if (!dockIcon.isEmpty()) {
            app.dock.setIcon(dockIcon);
            break;
          }
        }
      }

      this.createMainWindow();
      this.createTray();
      this.setupMenu();
      this.registerShortcuts();
      registerIpcHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('will-quit', () => {
      this.shortcutManager.unregisterAll();
      windowManager.setQuitting(true);
    });
  }

  private createMainWindow(): void {
    const appIconPath = path.join(__dirname, '../assets/tray-icon.png');
    const win = windowManager.createMainWindow({ icon: appIconPath });

    // 加载应用
    if (process.env.NODE_ENV === 'development') {
      win.loadURL('http://localhost:3000');
      win.webContents.openDevTools();
    } else {
      win.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
  }

  private createTray(): void {
    const iconPath = path.join(__dirname, '../assets/tray-icon.png');
    let icon: NativeImage = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      icon = createFallbackTrayIcon();
    }

    this.tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主窗口',
        click: () => windowManager.show(),
      },
      {
        label: '现形',
        click: () => {
          windowManager.setOpacity(1);
          windowManager.show();
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          windowManager.setQuitting(true);
          app.quit();
        },
      },
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('摸金阅读');

    this.tray.on('double-click', () => windowManager.show());
    this.tray.on('click', () => windowManager.show());
  }

  private setupMenu(): void {
    Menu.setApplicationMenu(this.menuManager.createApplicationMenu());
  }

  private registerShortcuts(): void {
    // 注册老板键 Alt+Z：主进程切换窗口可见性，并通知渲染进程
    this.shortcutManager.registerBossKey(() => {
      const win = windowManager.getWindow();
      if (!win) return;
      if (win.isVisible()) {
        windowManager.hide();
      } else {
        windowManager.show();
      }
      win.webContents.send(IPC.EventBossKey);
    });
  }
}

new MojinReaderApp();
