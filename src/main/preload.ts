import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  IPC,
  MENU_EVENT_CHANNELS,
  ReadTextResult,
  FileInfoResult,
  WindowStateResult,
  OpenFileDialogResult,
} from '../shared/ipc';

// 订阅辅助：统一封装，返回取消订阅函数
function subscribe<T extends any[]>(channel: string, callback: (...args: T) => void): () => void {
  const listener = (_event: IpcRendererEvent, ...args: any[]) => callback(...(args as T));
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

// 暴露给渲染进程的安全 API（与 src/renderer/types/electron.d.ts 保持一致）
const api = {
  // ---- 窗口控制 ----
  hideWindow: (): void => ipcRenderer.send(IPC.WindowHide),
  showWindow: (): void => ipcRenderer.send(IPC.WindowShow),
  minimizeWindow: (): void => ipcRenderer.send(IPC.WindowMinimize),
  setWindowOpacity: (opacity: number): void => ipcRenderer.send(IPC.WindowSetOpacity, opacity),
  setWindowAlwaysOnTop: (flag: boolean): void => ipcRenderer.send(IPC.WindowSetAlwaysOnTop, flag),
  setWindowSkipTaskbar: (flag: boolean): void => ipcRenderer.send(IPC.WindowSetSkipTaskbar, flag),
  toggleWindowMini: (): void => ipcRenderer.send(IPC.WindowToggleMini),
  toggleWindowWide: (): void => ipcRenderer.send(IPC.WindowToggleWide),
  toggleWindowMaximize: (): void => ipcRenderer.send(IPC.WindowToggleMaximize),
  hideDock: (): void => ipcRenderer.send(IPC.WindowHideDock),
  getWindowState: (): Promise<WindowStateResult | null> => ipcRenderer.invoke(IPC.WindowGetState),

  // ---- 文件系统 ----
  openFile: (): Promise<OpenFileDialogResult> => ipcRenderer.invoke(IPC.DialogOpenFile),
  readTextFile: (filePath: string, encoding?: string): Promise<ReadTextResult> =>
    ipcRenderer.invoke(IPC.FileReadText, filePath, encoding),
  readFileBuffer: (filePath: string): Promise<ArrayBuffer | null> =>
    ipcRenderer.invoke(IPC.FileReadBuffer, filePath),
  getFileInfo: (filePath: string): Promise<FileInfoResult> => ipcRenderer.invoke(IPC.FileGetInfo, filePath),

  // ---- 设置持久化 ----
  getSettings: (): Promise<Record<string, unknown>> => ipcRenderer.invoke(IPC.SettingsGet),
  setSetting: (key: string, value: unknown): Promise<void> => ipcRenderer.invoke(IPC.SettingsSet, key, value),

  // ---- 系统能力 ----
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(IPC.ShellOpenExternal, url),

  // ---- 事件订阅（返回取消订阅函数）----
  onBossKey: (callback: () => void): (() => void) => subscribe(IPC.EventBossKey, callback),
  onFileOpened: (callback: (filePath: string) => void): (() => void) => subscribe(IPC.EventFileOpened, callback),
  onWindowBlur: (callback: () => void): (() => void) => subscribe(IPC.EventWindowBlur, callback),
  onWindowFocus: (callback: () => void): (() => void) => subscribe(IPC.EventWindowFocus, callback),
  // 菜单事件：仅允许订阅白名单内的通道
  onMenu: (channel: string, callback: (...args: any[]) => void): (() => void) => {
    if (!MENU_EVENT_CHANNELS.includes(channel)) {
      return () => undefined;
    }
    return subscribe(channel, callback);
  },
};

contextBridge.exposeInMainWorld('electron', api);

export type ElectronApi = typeof api;
