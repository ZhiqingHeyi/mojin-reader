// IPC 通道契约（主进程 / 预加载脚本 / 渲染进程共享的唯一数据源）
// 主进程 handler、preload 暴露的 API、渲染进程调用方必须全部使用本模块中的常量，
// 避免通道命名不一致导致功能静默失效。

export const IPC = {
  // ---- 窗口控制（渲染进程 → 主进程，send）----
  WindowHide: 'window:hide',
  WindowShow: 'window:show',
  WindowMinimize: 'window:minimize',
  WindowSetOpacity: 'window:set-opacity',
  WindowSetAlwaysOnTop: 'window:set-always-on-top',
  WindowSetSkipTaskbar: 'window:set-skip-taskbar',
  WindowToggleMini: 'window:toggle-mini',
  WindowToggleWide: 'window:toggle-wide',
  WindowToggleMaximize: 'window:toggle-maximize',
  WindowHideDock: 'window:hide-dock',
  // ---- 窗口状态查询（invoke）----
  WindowGetState: 'window:get-state',

  // ---- 文件系统（invoke）----
  DialogOpenFile: 'dialog:open-file',
  FileReadText: 'file:read-text',
  FileReadBuffer: 'file:read-buffer',
  FileGetInfo: 'file:get-info',

  // ---- 设置持久化（invoke）----
  SettingsGet: 'settings:get',
  SettingsSet: 'settings:set',

  // ---- 系统能力（invoke）----
  ShellOpenExternal: 'shell:open-external',

  // ---- 主进程 → 渲染进程事件 ----
  EventBossKey: 'event:boss-key',
  EventFileOpened: 'event:file-opened',
  EventWindowBlur: 'event:window-blur',
  EventWindowFocus: 'event:window-focus',
  EventMenuOpenFile: 'event:menu-open-file',
  EventMenuOpenUrl: 'event:menu-open-url',
  EventMenuOpenSettings: 'event:menu-open-settings',
  EventMenuManageBookmarks: 'event:menu-manage-bookmarks',
  EventMenuClearRecent: 'event:menu-clear-recent',
  EventMenuOpenRecentFile: 'event:menu-open-recent-file',
  EventMenuPrevPage: 'event:menu-prev-page',
  EventMenuNextPage: 'event:menu-next-page',
  EventMenuGotoPage: 'event:menu-goto-page',
  EventMenuAddBookmark: 'event:menu-add-bookmark',
  EventMenuZoomIn: 'event:menu-zoom-in',
  EventMenuZoomOut: 'event:menu-zoom-out',
  EventMenuZoomReset: 'event:menu-zoom-reset',
  EventMenuShowShortcuts: 'event:menu-show-shortcuts',
  EventMenuFind: 'event:menu-find',
  EventMenuShowAbout: 'event:menu-show-about',
  EventMenuCheckUpdate: 'event:menu-check-update',
} as const;

// 菜单事件通道白名单（preload 只允许订阅这些通道）
export const MENU_EVENT_CHANNELS: readonly string[] = [
  IPC.EventMenuOpenFile,
  IPC.EventMenuOpenUrl,
  IPC.EventMenuOpenSettings,
  IPC.EventMenuManageBookmarks,
  IPC.EventMenuClearRecent,
  IPC.EventMenuOpenRecentFile,
  IPC.EventMenuPrevPage,
  IPC.EventMenuNextPage,
  IPC.EventMenuGotoPage,
  IPC.EventMenuAddBookmark,
  IPC.EventMenuZoomIn,
  IPC.EventMenuZoomOut,
  IPC.EventMenuZoomReset,
  IPC.EventMenuShowShortcuts,
  IPC.EventMenuFind,
  IPC.EventMenuShowAbout,
  IPC.EventMenuCheckUpdate,
];

// ---- 数据结构 ----

export interface ReadTextResult {
  content: string;
  encoding: string;
  success: boolean;
  error?: string;
}

export interface FileInfoResult {
  name: string;
  size: number;
  extension: string;
  lastModified: number;
  isReadable: boolean;
}

export interface WindowStateResult {
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  opacity: number;
  alwaysOnTop: boolean;
  isMini: boolean;
  isWide: boolean;
}

export interface OpenFileDialogResult {
  canceled: boolean;
  filePath?: string;
}
