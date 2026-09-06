import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义最近文件类型
export interface RecentFile {
  id: string;
  name: string;
  path: string;
  type: 'txt' | 'pdf' | 'epub' | 'mobi' | 'azw3';
  lastOpened: string;
}

// 定义应用设置类型
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh-CN' | 'en-US';
  autoCheckUpdate: boolean;
  openLastFileOnStartup: boolean;
  defaultEncoding: 'auto' | 'utf-8' | 'gbk' | 'gb2312' | 'big5';
  defaultFont: string;
  defaultFontSize: number;
}

// 定义应用状态类型
interface AppState {
  settings: AppSettings;
  recentFiles: RecentFile[];
  isFirstRun: boolean;
}

// 初始状态
const initialState: AppState = {
  settings: {
    theme: 'system',
    language: 'zh-CN',
    autoCheckUpdate: true,
    openLastFileOnStartup: true,
    defaultEncoding: 'auto',
    defaultFont: 'Microsoft YaHei',
    defaultFontSize: 16
  },
  recentFiles: [],
  isFirstRun: true
};

// 创建slice
const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // 更新设置
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    // 添加最近文件
    addRecentFile: (state, action: PayloadAction<RecentFile>) => {
      // 检查文件是否已存在
      const existingIndex = state.recentFiles.findIndex(file => file.id === action.payload.id);
      
      if (existingIndex !== -1) {
        // 如果存在，更新最后打开时间并移到列表顶部
        state.recentFiles.splice(existingIndex, 1);
      }
      
      // 添加到列表顶部
      state.recentFiles.unshift(action.payload);
      
      // 限制最近文件数量为20个
      if (state.recentFiles.length > 20) {
        state.recentFiles = state.recentFiles.slice(0, 20);
      }
    },
    
    // 移除最近文件
    removeRecentFile: (state, action: PayloadAction<string>) => {
      state.recentFiles = state.recentFiles.filter(file => file.id !== action.payload);
    },
    
    // 清空最近文件
    clearRecentFiles: (state) => {
      state.recentFiles = [];
    },
    
    // 设置首次运行状态
    setFirstRun: (state, action: PayloadAction<boolean>) => {
      state.isFirstRun = action.payload;
    }
  }
});

// 导出actions
export const { 
  updateSettings, 
  addRecentFile, 
  removeRecentFile, 
  clearRecentFiles,
  setFirstRun
} = appSlice.actions;

// 导出reducer
export default appSlice.reducer;