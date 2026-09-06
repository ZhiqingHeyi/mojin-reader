import React, { useRef, useState } from 'react';
import { Button, Card, Row, Col, Segmented, List, Empty, message, Popconfirm } from 'antd';
import {
  ArrowLeftOutlined,
  ReadOutlined,
  CoffeeOutlined,
  FileTextOutlined,
  GlobalOutlined,
  StarOutlined,
  HistoryOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import WebBrowser, { WebBrowserRef } from '../components/WebView/WebBrowser';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import {
  removeBookmark,
  clearBookmarks,
  removeHistoryItem,
  clearHistory,
} from '../store/slices/webViewSlice';
import '../styles/WebViewPage.css';

// 预设网站列表
const PRESET_SITES = [
  // 小说和阅读网站
  { name: '微信读书', url: 'https://weread.qq.com/', category: '阅读', icon: <ReadOutlined /> },
  { name: '番茄小说', url: 'https://fanqienovel.com/', category: '阅读', icon: <ReadOutlined /> },
  { name: '起点中文', url: 'https://www.qidian.com/', category: '阅读', icon: <ReadOutlined /> },
  { name: '晋江文学', url: 'https://www.jjwxc.net/', category: '阅读', icon: <ReadOutlined /> },
  { name: '纵横中文', url: 'https://www.zongheng.com/', category: '阅读', icon: <ReadOutlined /> },

  // 摸鱼网站
  { name: '小红书', url: 'https://www.xiaohongshu.com/', category: '摸鱼', icon: <CoffeeOutlined /> },
  { name: '微博', url: 'https://weibo.com/', category: '摸鱼', icon: <CoffeeOutlined /> },
  { name: '知乎', url: 'https://www.zhihu.com/', category: '摸鱼', icon: <CoffeeOutlined /> },
  { name: 'B站', url: 'https://www.bilibili.com/', category: '摸鱼', icon: <CoffeeOutlined /> },

  // 刷题网站
  { name: '粉笔', url: 'https://www.fenbi.com/', category: '刷题', icon: <FileTextOutlined /> },
  { name: '猿辅导', url: 'https://www.yuanfudao.com/', category: '刷题', icon: <FileTextOutlined /> },
  { name: '作业帮', url: 'https://www.zybang.com/', category: '刷题', icon: <FileTextOutlined /> },
  { name: '网易云课堂', url: 'https://study.163.com/', category: '刷题', icon: <FileTextOutlined /> },
  { name: '腾讯课堂', url: 'https://ke.qq.com/', category: '刷题', icon: <FileTextOutlined /> },
];

type ViewMode = 'sites' | 'bookmarks' | 'history';

const WebViewPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const webViewSettings = useAppSelector((state) => state.webView.settings);
  const bookmarks = useAppSelector((state) => state.webView.bookmarks);
  const history = useAppSelector((state) => state.webView.history);
  const webViewRef = useRef<WebBrowserRef>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('sites');

  const goBack = () => navigate('/');

  const openUrl = (url: string) => {
    webViewRef.current?.loadURL(url);
    message.info(`已打开 ${url}`);
  };

  const categories = Array.from(new Set(PRESET_SITES.map((site) => site.category)));

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return isToday ? hm : `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="webview-page">
      <div className="webview-header">
        <Button icon={<ArrowLeftOutlined />} onClick={goBack} className="back-button">
          返回
        </Button>
        <div className="webview-header-title">
          <GlobalOutlined /> 网页阅读
        </div>
        <Segmented
          size="small"
          value={viewMode}
          onChange={(value) => setViewMode(value as ViewMode)}
          options={[
            { label: '网站', value: 'sites' },
            { label: `收藏${bookmarks.length ? `(${bookmarks.length})` : ''}`, value: 'bookmarks' },
            { label: `历史${history.length ? `(${history.length})` : ''}`, value: 'history' },
          ]}
        />
      </div>

      {/* 预设网站 */}
      {viewMode === 'sites' && (
        <div className="preset-sites">
          {categories.map((category) => (
            <div className="preset-category" key={category}>
              <h3>{category}</h3>
              <Row gutter={[12, 12]}>
                {PRESET_SITES.filter((site) => site.category === category).map((site, index) => (
                  <Col span={6} key={index}>
                    <Card hoverable onClick={() => openUrl(site.url)} className="site-card">
                      <div className="site-content">
                        <div className="site-icon">{site.icon}</div>
                        <div className="site-name">{site.name}</div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>
      )}

      {/* 收藏列表 */}
      {viewMode === 'bookmarks' && (
        <div className="url-list-panel">
          <div className="url-list-header">
            <span>
              <StarOutlined /> 我的收藏
            </span>
            {bookmarks.length > 0 && (
              <Popconfirm title="清空全部收藏？" onConfirm={() => dispatch(clearBookmarks())}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />}>
                  清空
                </Button>
              </Popconfirm>
            )}
          </div>
          {bookmarks.length === 0 ? (
            <Empty description="暂无收藏" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={bookmarks}
              renderItem={(item) => (
                <List.Item
                  className="url-list-item"
                  onClick={() => openUrl(item.url)}
                  actions={[
                    <Button
                      key="del"
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(removeBookmark(item.id));
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<div className="url-favicon">{(item.title || item.url).charAt(0)}</div>}
                    title={<span className="url-item-title">{item.title || item.url}</span>}
                    description={<span className="url-item-url">{item.url}</span>}
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      )}

      {/* 历史列表 */}
      {viewMode === 'history' && (
        <div className="url-list-panel">
          <div className="url-list-header">
            <span>
              <HistoryOutlined /> 浏览历史
            </span>
            {history.length > 0 && (
              <Popconfirm title="清空全部历史？" onConfirm={() => dispatch(clearHistory())}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />}>
                  清空
                </Button>
              </Popconfirm>
            )}
          </div>
          {history.length === 0 ? (
            <Empty description="暂无历史记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <List
              size="small"
              dataSource={history}
              renderItem={(item) => (
                <List.Item
                  className="url-list-item"
                  onClick={() => openUrl(item.url)}
                  actions={[
                    <Button
                      key="del"
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch(removeHistoryItem(item.id));
                      }}
                    />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<div className="url-favicon">{(item.title || item.url).charAt(0)}</div>}
                    title={<span className="url-item-title">{item.title || item.url}</span>}
                    description={
                      <span className="url-item-url">
                        {formatTime(item.timestamp)} · {item.url}
                      </span>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      )}

      <div className="webview-container">
        <WebBrowser
          ref={webViewRef}
          initialUrl={webViewSettings.defaultUrl || 'https://www.baidu.com'}
        />
      </div>
    </div>
  );
};

export default WebViewPage;
