// 全局类型定义

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  extension: string;
  lastModified: Date;
  type: 'txt' | 'pdf' | 'epub' | 'mobi' | 'azw3' | 'unknown';
}

export interface ReadingPosition {
  page: number;
  progress: number; // 0-100
  position?: {
    x: number;
    y: number;
  };
}

export interface BookmarkData {
  id: string;
  title: string;
  filePath?: string;
  url?: string;
  type: 'document' | 'webpage';
  position: ReadingPosition;
  note?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppTheme {
  name: string;
  colors: {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
}

export interface WindowState {
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  opacity: number;
  alwaysOnTop: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface UserSettings {
  // 外观设置
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  
  // 阅读设置
  pageWidth: number;
  margin: number;
  backgroundColor: string;
  textColor: string;
  
  // 隐蔽功能设置
  bossKeyEnabled: boolean;
  bossKey: string;
  transparencyEnabled: boolean;
  mouseOutHide: boolean;
  autoHideDelay: number;
  
  // 窗口设置
  alwaysOnTop: boolean;
  startMinimized: boolean;
  closeToTray: boolean;
  
  // 其他设置
  language: 'zh-CN' | 'en-US';
  autoSave: boolean;
  backupEnabled: boolean;
}

export interface SearchResult {
  page: number;
  text: string;
  position: number;
  context: string;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
  wordCount?: number;
}

export interface WebViewTab {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  userAgent: 'desktop' | 'mobile';
  zoomLevel: number;
}

export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  visitTime: string;
  favicon?: string;
}

export interface DownloadItem {
  id: string;
  url: string;
  filename: string;
  savePath: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'progressing' | 'completed' | 'cancelled' | 'interrupted';
  startTime: string;
  endTime?: string;
}

// 事件类型
export interface AppEvents {
  'file-opened': (filePath: string) => void;
  'file-closed': () => void;
  'page-changed': (page: number) => void;
  'bookmark-added': (bookmark: BookmarkData) => void;
  'bookmark-removed': (bookmarkId: string) => void;
  'settings-changed': (settings: Partial<UserSettings>) => void;
  'window-state-changed': (state: WindowState) => void;
  'search-performed': (query: string, results: SearchResult[]) => void;
  'error-occurred': (error: Error) => void;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 文件操作结果
export interface FileOperationResult {
  success: boolean;
  filePath?: string;
  error?: string;
  metadata?: DocumentMetadata;
}

// 导出/导入数据格式
export interface ExportData {
  version: string;
  exportTime: string;
  bookmarks: BookmarkData[];
  settings: UserSettings;
  recentFiles: string[];
}

// 插件接口（为未来扩展预留）
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  enabled: boolean;
  main: string;
  permissions: string[];
}

// 统计数据
export interface ReadingStats {
  totalReadingTime: number; // 总阅读时间（分钟）
  documentsRead: number; // 已读文档数量
  pagesRead: number; // 已读页数
  averageReadingSpeed: number; // 平均阅读速度（页/分钟）
  favoriteFormat: string; // 最喜欢的文档格式
  readingStreak: number; // 连续阅读天数
  lastReadingDate: string; // 最后阅读日期
}

// 错误类型
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 常用的工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;