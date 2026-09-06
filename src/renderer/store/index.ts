import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import readerReducer from './slices/readerSlice';
import webViewReducer from './slices/webViewSlice';
import bookmarkReducer from './slices/bookmarkSlice';

const STORAGE_KEY = 'mojin-reader-state';

type PersistedState = {
  app?: ReturnType<typeof appReducer>;
  reader?: ReturnType<typeof readerReducer>;
  webView?: ReturnType<typeof webViewReducer>;
  bookmarks?: ReturnType<typeof bookmarkReducer>;
};

// 从 localStorage 恢复上次的状态（设置/最近文件/书签/阅读进度等）
function loadPersistedState(): PersistedState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as PersistedState;
  } catch (error) {
    console.warn('读取本地状态失败:', error);
    return undefined;
  }
}

const persistedState = loadPersistedState();

// 创建Redux store
const store = configureStore({
  reducer: {
    app: appReducer,
    reader: readerReducer,
    webView: webViewReducer,
    bookmarks: bookmarkReducer,
  },
  preloadedState: (persistedState || {}) as any,
  // 开发环境下启用Redux DevTools
  devTools: process.env.NODE_ENV !== 'production',
});

// 状态变更时持久化到 localStorage
store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        app: state.app,
        reader: state.reader,
        webView: state.webView,
        bookmarks: state.bookmarks,
      })
    );
  } catch (error) {
    // 序列化失败时静默忽略（例如临时性的超大状态）
  }
});

// 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
