import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义网页浏览设置类型
export interface WebViewSettings {
  defaultUrl: string;
  defaultMode: 'desktop' | 'mobile';
  clearDataOnExit: boolean;
  userAgents: {
    desktop: string;
    mobile: string;
  };
  history: {
    enabled: boolean;
    maxItems: number;
  };
}

// 定义历史记录项类型
export interface HistoryItem {
  id: string;
  url: string;
  title: string;
  favicon: string | null;
  timestamp: string;
}

// 定义网页浏览状态类型
interface WebViewState {
  settings: WebViewSettings;
  history: HistoryItem[];
  bookmarks: {
    id: string;
    url: string;
    title: string;
    favicon: string | null;
    timestamp: string;
  }[];
}

// 初始状态
const initialState: WebViewState = {
  settings: {
    defaultUrl: 'https://www.baidu.com',
    defaultMode: 'desktop',
    clearDataOnExit: false,
    userAgents: {
      desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
    },
    history: {
      enabled: true,
      maxItems: 100
    }
  },
  history: [],
  bookmarks: []
};

// 创建slice
const webViewSlice = createSlice({
  name: 'webView',
  initialState,
  reducers: {
    // 更新网页浏览设置
    updateWebViewSettings: (state, action: PayloadAction<Partial<WebViewSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // 添加历史记录（按 URL 去重，已存在则移到最前并更新标题）
    addHistoryItem: (state, action: PayloadAction<Omit<HistoryItem, 'id' | 'timestamp'>>) => {
      const existingIndex = state.history.findIndex(item => item.url === action.payload.url);
      
      if (existingIndex !== -1) {
        // 已存在：更新标题/图标并移到最前
        const [existing] = state.history.splice(existingIndex, 1);
        state.history.unshift({
          ...existing,
          title: action.payload.title || existing.title,
          favicon: action.payload.favicon ?? existing.favicon,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      
      // 创建新的历史记录项
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        url: action.payload.url,
        title: action.payload.title,
        favicon: action.payload.favicon,
        timestamp: new Date().toISOString()
      };
      
      // 添加到历史记录
      state.history.unshift(newItem);
      
      // 限制历史记录数量
      if (state.history.length > state.settings.history.maxItems) {
        state.history = state.history.slice(0, state.settings.history.maxItems);
      }
    },
    
    // 删除历史记录项
    removeHistoryItem: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(item => item.id !== action.payload);
    },
    
    // 清空历史记录
    clearHistory: (state) => {
      state.history = [];
    },
    
    // 添加书签
    addBookmark: (state, action: PayloadAction<Omit<HistoryItem, 'id' | 'timestamp'>>) => {
      // 检查URL是否已经存在于书签中
      const existingIndex = state.bookmarks.findIndex(item => item.url === action.payload.url);
      
      if (existingIndex !== -1) {
        // 如果存在，更新标题和图标
        state.bookmarks[existingIndex].title = action.payload.title;
        state.bookmarks[existingIndex].favicon = action.payload.favicon;
        state.bookmarks[existingIndex].timestamp = new Date().toISOString();
      } else {
        // 如果不存在，添加新书签
        const id = Date.now().toString();
        
        state.bookmarks.push({
          id,
          url: action.payload.url,
          title: action.payload.title,
          favicon: action.payload.favicon,
          timestamp: new Date().toISOString()
        });
      }
    },
    
    // 删除书签
    removeBookmark: (state, action: PayloadAction<string>) => {
      state.bookmarks = state.bookmarks.filter(item => item.id !== action.payload);
    },
    
    // 清空书签
    clearBookmarks: (state) => {
      state.bookmarks = [];
    }
  }
});

// 导出actions
export const { 
  updateWebViewSettings, 
  addHistoryItem, 
  removeHistoryItem, 
  clearHistory,
  addBookmark,
  removeBookmark,
  clearBookmarks
} = webViewSlice.actions;

// 导出reducer
export default webViewSlice.reducer;