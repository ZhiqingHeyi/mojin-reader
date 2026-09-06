import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Input, Button, Tooltip, message } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
  HomeOutlined,
  MobileOutlined,
  DesktopOutlined,
  ColumnWidthOutlined,
  StarOutlined,
  StarFilled,
  SettingOutlined,
} from '@ant-design/icons';
import './WebBrowser.css';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  addHistoryItem,
  addBookmark,
  removeBookmark,
} from '../../store/slices/webViewSlice';

const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';

export interface WebBrowserRef {
  setUserAgent: (userAgent: string) => void;
  reload: () => void;
  loadURL: (url: string) => void;
  goBack: () => void;
  goForward: () => void;
  toggleMobileMode: () => void;
}

interface WebBrowserProps {
  initialUrl?: string;
  onLoad?: (e: any) => void;
  onLoadStart?: () => void;
  onError?: (e: any) => void;
}

const WebBrowser = forwardRef<WebBrowserRef, WebBrowserProps>((props, ref) => {
  const { initialUrl = 'https://www.baidu.com', onLoad, onLoadStart, onError } = props;
  const dispatch = useAppDispatch();
  const { bookmarks } = useAppSelector(state => state.webView);

  const webviewRef = useRef<Electron.WebviewTag | null>(null);
  const webviewReadyRef = useRef(false);
  const pendingUaRef = useRef<string | null>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const initialUrlRef = useRef(initialUrl);
  const [url, setUrl] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [title, setTitle] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMode, setMobileMode] = useState(false);
  const [width, setWidth] = useState('100%');

  const isBookmarked = bookmarks.some(bookmark => bookmark.url === currentUrl);

  // 统一的跳转方法：已 ready 直接 loadURL，未 ready 则暂存待 dom-ready 后执行，
  // 并同步地址栏，保证任何时刻调用都不会被静默丢弃
  const navigateWebview = useCallback((targetUrl: string) => {
    const processed = targetUrl.trim();
    setUrl(processed);
    const webview = webviewRef.current;
    if (!webview) {
      pendingUrlRef.current = processed;
      return;
    }
    if (webviewReadyRef.current) {
      webview.loadURL(processed);
    } else {
      pendingUrlRef.current = processed;
    }
  }, []);

  useImperativeHandle(ref, (): WebBrowserRef => ({
    loadURL: (targetUrl: string) => {
      navigateWebview(targetUrl);
    },
    reload: () => {
      if (webviewReadyRef.current) {
        webviewRef.current?.reload();
      }
    },
    goBack: () => {
      if (webviewReadyRef.current) {
        webviewRef.current?.goBack();
      }
    },
    goForward: () => {
      if (webviewReadyRef.current) {
        webviewRef.current?.goForward();
      }
    },
    setUserAgent: (userAgent: string) => {
      const webview = webviewRef.current;
      if (!webview) return;
      if (webviewReadyRef.current) {
        webview.setUserAgent(userAgent);
      } else {
        pendingUaRef.current = userAgent;
      }
    },
    toggleMobileMode: () => setMobileMode(m => !m),
  }));

  const bindWebview = (webview: Electron.WebviewTag) => {
    const handleStartLoading = () => {
      setIsLoading(true);
      onLoadStart?.();
    };

    const handleStopLoading = () => {
      setIsLoading(false);
    };

    const handleDidFinishLoad = () => {
      const u = webview.getURL();
      const t = webview.getTitle();
      const back = webview.canGoBack();
      const forward = webview.canGoForward();
      setCurrentUrl(u);
      setTitle(t);
      setCanGoBack(back);
      setCanGoForward(forward);
      setIsLoading(false);
      dispatch(addHistoryItem({ url: u, title: t, favicon: null }));
      onLoad?.({ url: u, title: t, canGoBack: back, canGoForward: forward });
    };

    const handleDidNavigate = () => {
      const u = webview.getURL();
      const t = webview.getTitle();
      setCurrentUrl(u);
      setTitle(t);
      setCanGoBack(webview.canGoBack());
      setCanGoForward(webview.canGoForward());
    };

    const handleDidFailLoad = (e: Electron.DidFailLoadEvent) => {
      setIsLoading(false);
      onError?.({ errorCode: e.errorCode, errorDescription: e.errorDescription });
    };

    const handleDomReady = () => {
      webviewReadyRef.current = true;
      if (pendingUaRef.current) {
        webview.setUserAgent(pendingUaRef.current);
        pendingUaRef.current = null;
      }
      // 补发 ready 前被暂存的跳转请求（确保不丢失点击）
      if (pendingUrlRef.current) {
        const pending = pendingUrlRef.current;
        pendingUrlRef.current = null;
        webview.loadURL(pending);
      }
    };

    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-start-loading', handleStartLoading);
    webview.addEventListener('did-stop-loading', handleStopLoading);
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-fail-load', handleDidFailLoad);

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-start-loading', handleStartLoading);
      webview.removeEventListener('did-stop-loading', handleStopLoading);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
    };
  };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;
    // 初始地址通过 <webview src> 属性加载，无需在 dom-ready 前调用 loadURL
    return bindWebview(webview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialUrl !== initialUrlRef.current) {
      initialUrlRef.current = initialUrl;
      navigateWebview(initialUrl);
    }
  }, [initialUrl, navigateWebview]);

  // 手机/电脑模式切换：更新 user agent（dom-ready 后再应用）
  useEffect(() => {
    const ua = mobileMode ? MOBILE_UA : navigator.userAgent;
    const webview = webviewRef.current;
    if (!webview) return;
    if (webviewReadyRef.current) {
      webview.setUserAgent(ua);
    } else {
      pendingUaRef.current = ua;
    }
  }, [mobileMode]);

  const navigateToUrl = (targetUrl: string) => {
    let processedUrl = targetUrl.trim();
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }
    navigateWebview(processedUrl);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(url);
  };

  const handleGoBack = () => {
    if (webviewReadyRef.current) webviewRef.current?.goBack();
  };
  const handleGoForward = () => {
    if (webviewReadyRef.current) webviewRef.current?.goForward();
  };
  const handleRefresh = () => {
    if (webviewReadyRef.current) webviewRef.current?.reload();
  };
  const handleHome = () => navigateToUrl('https://www.baidu.com');

  const toggleBookmark = () => {
    if (isBookmarked) {
      const existing = bookmarks.find(bookmark => bookmark.url === currentUrl);
      if (existing) {
        dispatch(removeBookmark(existing.id));
      }
      message.success('已取消收藏');
    } else {
      dispatch(addBookmark({ url: currentUrl, title: title || currentUrl, favicon: null }));
      message.success('已添加到收藏');
    }
  };

  const toggleWidth = () => {
    if (width === '100%') {
      setWidth('70%');
    } else if (width === '70%') {
      setWidth('50%');
    } else {
      setWidth('100%');
    }
  };

  const openSettings = () => {
    message.info('请前往「设置」页调整网页浏览偏好');
  };

  return (
    <div className="web-browser">
      <div className="browser-toolbar">
        <div className="navigation-buttons">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            disabled={!canGoBack}
          />
          <Button
            icon={<ArrowRightOutlined />}
            onClick={handleGoForward}
            disabled={!canGoForward}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={isLoading}
          />
          <Button icon={<HomeOutlined />} onClick={handleHome} />
        </div>

        <form onSubmit={handleUrlSubmit} className="url-form">
          <Input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="输入网址"
            className="url-input"
          />
        </form>

        <div className="browser-actions">
          <Tooltip title={mobileMode ? '切换到电脑模式' : '切换到手机模式'}>
            <Button
              icon={mobileMode ? <DesktopOutlined /> : <MobileOutlined />}
              onClick={() => setMobileMode(m => !m)}
            />
          </Tooltip>
          <Tooltip title="调整宽度">
            <Button icon={<ColumnWidthOutlined />} onClick={toggleWidth} />
          </Tooltip>
          <Tooltip title={isBookmarked ? '取消收藏' : '添加到收藏'}>
            <Button
              icon={isBookmarked ? <StarFilled /> : <StarOutlined />}
              onClick={toggleBookmark}
            />
          </Tooltip>
          <Tooltip title="设置">
            <Button icon={<SettingOutlined />} onClick={openSettings} />
          </Tooltip>
        </div>
      </div>

      <div className="webview-container" style={{ width }}>
        <webview
          ref={(el: any) => {
            webviewRef.current = el as Electron.WebviewTag | null;
            // Electron <webview> 允许新窗口弹窗；React 不识别该属性，故在此设置
            if (el) el.setAttribute('allowpopups', 'true');
          }}
          src={initialUrl}
          className="webview-element"
        />
      </div>

      <div className="browser-footer">
        <span className="page-title">{title || currentUrl}</span>
      </div>
    </div>
  );
});

WebBrowser.displayName = 'WebBrowser';

export default WebBrowser;
