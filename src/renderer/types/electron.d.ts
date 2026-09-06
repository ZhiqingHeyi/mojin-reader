// Electron 预加载脚本暴露 API 的类型定义
// 与 src/main/preload.ts 暴露的 window.electron 保持一致

import type {
  ReadTextResult,
  FileInfoResult,
  WindowStateResult,
  OpenFileDialogResult,
} from '../../shared/ipc';

export interface ElectronApi {
  // ---- 窗口控制 ----
  hideWindow: () => void;
  showWindow: () => void;
  minimizeWindow: () => void;
  setWindowOpacity: (opacity: number) => void;
  setWindowAlwaysOnTop: (flag: boolean) => void;
  setWindowSkipTaskbar: (flag: boolean) => void;
  toggleWindowMini: () => void;
  toggleWindowWide: () => void;
  toggleWindowMaximize: () => void;
  hideDock: () => void;
  getWindowState: () => Promise<WindowStateResult | null>;

  // ---- 文件系统 ----
  openFile: () => Promise<OpenFileDialogResult>;
  readTextFile: (filePath: string, encoding?: string) => Promise<ReadTextResult>;
  readFileBuffer: (filePath: string) => Promise<ArrayBuffer | null>;
  getFileInfo: (filePath: string) => Promise<FileInfoResult>;

  // ---- 设置持久化 ----
  getSettings: () => Promise<Record<string, unknown>>;
  setSetting: (key: string, value: unknown) => Promise<void>;

  // ---- 系统能力 ----
  openExternal: (url: string) => Promise<void>;

  // ---- 事件订阅（返回取消订阅函数）----
  onBossKey: (callback: () => void) => () => void;
  onFileOpened: (callback: (filePath: string) => void) => () => void;
  onWindowBlur: (callback: () => void) => () => void;
  onWindowFocus: (callback: () => void) => () => void;
  onMenu: (channel: string, callback: (...args: any[]) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronApi;
  }
}

export {};
