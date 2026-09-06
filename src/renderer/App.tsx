import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/lib/locale/zh_CN';
import MainLayout from './components/Layout/MainLayout';
import HomePage from './pages/HomePage';
import ReaderPage from './pages/ReaderPage';
import WebViewPage from './pages/WebViewPage';
import SettingsPage from './pages/SettingsPage';
import BookmarksPage from './pages/BookmarksPage';
import { useAppSelector, useAppDispatch } from './hooks/redux';
import { addRecentFile, clearRecentFiles } from './store/slices/appSlice';
import { IPC } from '../shared/ipc';
import { buildTheme } from './styles/theme';
import './styles/App.css';

type ReaderType = 'txt' | 'pdf' | 'epub';

// 解析文件路径对应的阅读器类型与文件信息
function resolveFileInfo(filePath: string): { readerType: ReaderType; name: string } | null {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  let readerType: ReaderType | null = null;
  if (ext === 'txt') readerType = 'txt';
  else if (ext === 'pdf') readerType = 'pdf';
  else if (ext === 'epub') readerType = 'epub';

  if (!readerType) {
    message.error('不支持的文件格式，当前支持 TXT / PDF / EPUB');
    return null;
  }

  const name = filePath.split(/[\\/]/).pop() || filePath;
  return { readerType, name };
}

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 打开文件并跳转到阅读器
  const openFileAndNavigate = async (filePath?: string) => {
    let target = filePath;
    if (!target) {
      const result = await window.electron.openFile();
      if (result.canceled || !result.filePath) return;
      target = result.filePath;
    }

    const info = resolveFileInfo(target);
    if (!info) return;

    dispatch(addRecentFile({
      id: target,
      name: info.name,
      path: target,
      type: info.readerType,
      lastOpened: new Date().toISOString(),
    }));

    navigate(`/reader/${info.readerType}?path=${encodeURIComponent(target)}`);
  };

  useEffect(() => {
    const unsubs: (() => void)[] = [];

    // 菜单事件 → 渲染进程行为
    unsubs.push(window.electron.onMenu(IPC.EventMenuOpenFile, () => openFileAndNavigate()));
    unsubs.push(window.electron.onMenu(IPC.EventMenuOpenRecentFile, (filePath: string) => openFileAndNavigate(filePath)));
    unsubs.push(window.electron.onMenu(IPC.EventMenuOpenUrl, () => navigate('/webview')));
    unsubs.push(window.electron.onMenu(IPC.EventMenuOpenSettings, () => navigate('/settings')));
    unsubs.push(window.electron.onMenu(IPC.EventMenuManageBookmarks, () => navigate('/bookmarks')));
    unsubs.push(window.electron.onMenu(IPC.EventMenuClearRecent, () => dispatch(clearRecentFiles())));

    // 全局拖拽打开文件
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0] as (File & { path?: string }) | undefined;
      if (file?.path) {
        openFileAndNavigate(file.path);
      }
    };
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      unsubs.forEach(unsub => unsub());
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, dispatch]);

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="reader/:type" element={<ReaderPage />} />
        <Route path="webview" element={<WebViewPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="bookmarks" element={<BookmarksPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  const theme = useAppSelector(state => state.app.settings.theme);

  const systemDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && !!systemDark);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={buildTheme(isDark)}
    >
      <div className={`app-container ${isDark ? 'dark-theme' : 'light-theme'}`}>
        <Router>
          <AppRoutes />
        </Router>
      </div>
    </ConfigProvider>
  );
};

export default App;
