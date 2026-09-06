import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 阅读进度类型
export interface ReadingProgress {
  currentPage: number;
  totalPages: number;
  progress: number; // 百分比，0-100
}

// 书签类型
export interface Bookmark {
  id: string;
  title: string;
  filePath?: string;
  fileType?: string;
  page?: number;
  progress?: number;
  position?: number | string;
  cfi?: string; // 添加cfi属性，用于EPUB书签
  note?: string;
  timestamp?: string;
}

// 定义阅读设置类型
export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia' | 'green';
  textColor: string;
  backgroundColor: string;
  margin: number;
  pageWidth: number;
  opacity?: number; // 添加透明度设置
  progress?: number; // 添加进度设置
  
  // TXT阅读设置
  txtSettings: {
    encoding: 'auto' | 'utf-8' | 'gbk' | 'gb2312' | 'big5';
  };
  
  // PDF阅读设置
  pdfSettings: {
    zoom: 'auto' | 'page-width' | 'page-fit' | number;
    displayMode: 'single' | 'double' | 'scroll';
    showOutline: boolean;
    nightMode: boolean;
  };
  
  // EPUB阅读设置
  epubSettings: {
    theme: 'light' | 'dark' | 'sepia';
    margin: number;
  };
}

// 定义阅读器状态类型
interface ReaderState {
  settings: ReaderSettings;
  readingProgress: ReadingProgress;
  currentFilePath: string | null;
  currentFileType: string | null;
  currentPosition: number | string | null;
  bookmarks: Bookmark[];
  history: {
    filePath: string;
    fileType: string;
    position: number | string;
    timestamp: string;
  }[];
}

// 初始状态
const initialState: ReaderState = {
  settings: {
    fontSize: 16,
    fontFamily: 'Microsoft YaHei',
    lineHeight: 1.5,
    theme: 'light',
    textColor: '#333333',
    backgroundColor: '#ffffff',
    margin: 20,
    pageWidth: 0,  // 0 = 自适应容器宽度
    opacity: 1, // 默认不透明
    progress: 0, // 默认进度为0
    
    txtSettings: {
      encoding: 'auto'
    },
    pdfSettings: {
      zoom: 'auto',
      displayMode: 'single',
      showOutline: true,
      nightMode: false
    },
    epubSettings: {
      theme: 'light',
      margin: 20
    }
  },
  readingProgress: {
    currentPage: 1,
    totalPages: 1,
    progress: 0
  },
  currentFilePath: null,
  currentFileType: null,
  currentPosition: null,
  bookmarks: [],
  history: []
};

// 创建slice
const readerSlice = createSlice({
  name: 'reader',
  initialState,
  reducers: {
    // 更新阅读设置
    updateReaderSettings: (state, action: PayloadAction<Partial<ReaderSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // 更新TXT阅读设置
    updateTxtSettings: (state, action: PayloadAction<Partial<ReaderState['settings']['txtSettings']>>) => {
      state.settings.txtSettings = { ...state.settings.txtSettings, ...action.payload };
    },
    
    // 更新PDF阅读设置
    updatePdfSettings: (state, action: PayloadAction<Partial<ReaderState['settings']['pdfSettings']>>) => {
      state.settings.pdfSettings = { ...state.settings.pdfSettings, ...action.payload };
    },
    
    // 更新EPUB阅读设置
    updateEpubSettings: (state, action: PayloadAction<Partial<ReaderState['settings']['epubSettings']>>) => {
      state.settings.epubSettings = { ...state.settings.epubSettings, ...action.payload };
    },
    
    // 设置当前页码
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.readingProgress.currentPage = action.payload;
      state.readingProgress.progress = Math.floor((action.payload / state.readingProgress.totalPages) * 100);
    },
    
    // 设置总页数
    setTotalPages: (state, action: PayloadAction<number>) => {
      state.readingProgress.totalPages = action.payload;
      state.readingProgress.progress = Math.floor((state.readingProgress.currentPage / action.payload) * 100);
    },
    
    // 设置阅读进度
    setProgress: (state, action: PayloadAction<number>) => {
      state.readingProgress.progress = action.payload;
    },
    
    // 设置当前文件
    setCurrentFile: (state, action: PayloadAction<{ filePath: string; fileType: string; position?: number | string }>) => {
      state.currentFilePath = action.payload.filePath;
      state.currentFileType = action.payload.fileType;
      state.currentPosition = action.payload.position || null;
      
      // 添加到历史记录
      state.history.unshift({
        filePath: action.payload.filePath,
        fileType: action.payload.fileType,
        position: action.payload.position || 0,
        timestamp: new Date().toISOString()
      });
      
      // 限制历史记录数量为50条
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    },
    
    // 更新当前阅读位置
    updatePosition: (state, action: PayloadAction<number | string>) => {
      state.currentPosition = action.payload;
      
      // 更新历史记录中的位置
      if (state.currentFilePath && state.history.length > 0) {
        const firstHistoryItem = state.history[0];
        if (firstHistoryItem.filePath === state.currentFilePath) {
          firstHistoryItem.position = action.payload;
          firstHistoryItem.timestamp = new Date().toISOString();
        }
      }
    },
    
    // 添加书签
    addBookmark: (state, action: PayloadAction<Omit<Bookmark, 'id' | 'timestamp'>>) => {
      const id = Date.now().toString();
      
      state.bookmarks.push({
        id,
        ...action.payload,
        filePath: state.currentFilePath || undefined,
        fileType: state.currentFileType || undefined,
        timestamp: new Date().toISOString()
      });
    },
    
    // 删除书签
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(bookmark => bookmark.id !== action.payload);
    },
    
    // 清空书签
    clearBookmarks: (state) => {
      state.bookmarks = [];
    },
    
    // 清空历史记录
    clearHistory: (state) => {
      state.history = [];
    }
  }
});

// 导出actions
export const { 
  updateReaderSettings, 
  updateTxtSettings, 
  updatePdfSettings, 
  updateEpubSettings,
  setCurrentPage,
  setTotalPages,
  setProgress,
  setCurrentFile,
  updatePosition,
  addBookmark,
  removeBookmark,
  clearBookmarks,
  clearHistory
} = readerSlice.actions;

// 导出reducer
export default readerSlice.reducer;