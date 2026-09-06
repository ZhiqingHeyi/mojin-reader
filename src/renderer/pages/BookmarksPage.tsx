import React, { useState, useEffect } from 'react';
import { 
  List, 
  Button, 
  Input, 
  Empty, 
  Tabs, 
  Tag
} from 'antd';
import { 
  DeleteOutlined, 
  FileTextOutlined,
  FilePdfOutlined,
  BookOutlined as BookIcon,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { removeBookmark } from '../store/slices/bookmarkSlice';
import '../styles/BookmarksPage.css';

const { Search } = Input;

interface Bookmark {
  id: string;
  title: string;
  filePath: string;
  fileType: 'txt' | 'pdf' | 'epub' | 'mobi' | 'azw3';
  position: number | string;
  pageNumber?: number;
  progress?: number;
  excerpt?: string;
  createdAt: string;
  notes?: string;
  tags?: string[];
}

const BookmarksPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const bookmarks = useAppSelector(state => state.bookmarks.items);
  
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // 返回首页
  const goBack = () => {
    navigate('/');
  };
  
  // 打开书签对应的文件
  const openBookmark = (bookmark: Bookmark) => {
    let url = '';
    
    switch (bookmark.fileType) {
      case 'txt':
        url = `/reader/txt?path=${encodeURIComponent(bookmark.filePath)}&position=${bookmark.position}`;
        break;
      case 'pdf':
        url = `/reader/pdf?path=${encodeURIComponent(bookmark.filePath)}&page=${bookmark.pageNumber}`;
        break;
      case 'epub':
      case 'mobi':
      case 'azw3':
        url = `/reader/epub?path=${encodeURIComponent(bookmark.filePath)}&progress=${bookmark.progress}`;
        break;
    }
    
    navigate(url);
  };
  
  // 删除书签
  const deleteBookmark = (bookmarkId: string) => {
    dispatch(removeBookmark(bookmarkId));
  };
  
  // 获取文件图标
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'txt':
        return <FileTextOutlined style={{ fontSize: '20px', color: '#52c41a' }} />;
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: '20px', color: '#f5222d' }} />;
      case 'epub':
      case 'mobi':
      case 'azw3':
        return <BookIcon style={{ fontSize: '20px', color: '#1890ff' }} />;
      default:
        return <FileTextOutlined style={{ fontSize: '20px', color: '#faad14' }} />;
    }
  };
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 过滤书签
  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.title.toLowerCase().includes(searchText.toLowerCase()) ||
    (bookmark.excerpt && bookmark.excerpt.toLowerCase().includes(searchText.toLowerCase())) ||
    (bookmark.notes && bookmark.notes.toLowerCase().includes(searchText.toLowerCase()))
  );
  
  // 根据标签页过滤书签
  const getTabBookmarks = () => {
    switch (activeTab) {
      case 'all':
        return filteredBookmarks;
      case 'txt':
        return filteredBookmarks.filter(bookmark => bookmark.fileType === 'txt');
      case 'pdf':
        return filteredBookmarks.filter(bookmark => bookmark.fileType === 'pdf');
      case 'epub':
        return filteredBookmarks.filter(bookmark => 
          bookmark.fileType === 'epub' || 
          bookmark.fileType === 'mobi' || 
          bookmark.fileType === 'azw3'
        );
      default:
        return filteredBookmarks;
    }
  };
  
  return (
    <div className="bookmarks-page">
      <div className="bookmarks-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={goBack}
          className="back-button"
        >
          返回
        </Button>
        <h1>我的书签</h1>
      </div>
      
      <div className="search-bar">
        <Search
          placeholder="搜索书签..."
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        className="bookmarks-tabs"
        items={[{
          key: 'all',
          label: '全部',
        }, {
          key: 'txt',
          label: 'TXT',
        }, {
          key: 'pdf',
          label: 'PDF',
        }, {
          key: 'epub',
          label: 'EPUB/MOBI',
        }]}
      >
      </Tabs>
      
      <div className="bookmarks-list-container">
        {getTabBookmarks().length > 0 ? (
          <List
            className="bookmarks-list"
            itemLayout="vertical"
            dataSource={getTabBookmarks()}
            renderItem={bookmark => (
              <List.Item
                className="bookmark-item"
                actions={[
                  <Button 
                    key="delete"
                    type="text" 
                    icon={<DeleteOutlined />} 
                    onClick={() => deleteBookmark(bookmark.id)}
                    danger
                  >
                    删除
                  </Button>,
                  <Button 
                    key="open"
                    type="primary" 
                    onClick={() => openBookmark(bookmark)}
                  >
                    打开
                  </Button>
                ]}
              >
                <div className="bookmark-header" onClick={() => openBookmark(bookmark)}>
                  <div className="bookmark-icon">
                    {getFileIcon(bookmark.fileType)}
                  </div>
                  <div className="bookmark-title">
                    {bookmark.title}
                  </div>
                </div>
                
                {bookmark.excerpt && (
                  <div className="bookmark-excerpt">
                    &quot;{bookmark.excerpt}&quot;
                  </div>
                )}
                
                <div className="bookmark-meta">
                  <div className="bookmark-position">
                    {bookmark.fileType === 'pdf' ? 
                      `第 ${bookmark.pageNumber} 页` : 
                      bookmark.fileType === 'txt' ? 
                      `位置 ${bookmark.position}` :
                      `进度 ${Math.round(bookmark.progress || 0)}%`
                    }
                  </div>
                  <div className="bookmark-date">
                    添加于 {formatDate(bookmark.createdAt)}
                  </div>
                </div>
                
                {bookmark.notes && (
                  <div className="bookmark-notes">
                    <div className="notes-label">笔记:</div>
                    <div className="notes-content">{bookmark.notes}</div>
                  </div>
                )}
                
                {bookmark.tags && bookmark.tags.length > 0 && (
                  <div className="bookmark-tags">
                    {bookmark.tags.map(tag => (
                      <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                  </div>
                )}
              </List.Item>
            )}
          />
        ) : (
          <Empty 
            description={
              <span>
                {activeTab === 'all' ? '没有书签' : '没有找到书签'}
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;