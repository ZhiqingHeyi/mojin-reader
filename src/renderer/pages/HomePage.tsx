import React, { useMemo } from 'react';
import {
  Button,
  List,
  Input,
  Empty,
  message,
  Tabs,
  Space,
  Dropdown,
} from 'antd';
import {
  FileTextOutlined,
  FilePdfOutlined,
  BookOutlined,
  GlobalOutlined,
  FolderOpenOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { addRecentFile, removeRecentFile } from '../store/slices/appSlice';
import '../styles/HomePage.css';

const { Search } = Input;

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'txt' | 'pdf' | 'epub' | 'mobi' | 'azw3';
  lastOpened: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const recentFiles = useAppSelector(state => state.app.recentFiles);

  const [searchText, setSearchText] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('recent');

  const files: FileItem[] = useMemo(() => recentFiles, [recentFiles]);

  // 根据扩展名决定阅读器类型
  const resolveReaderType = (filePath: string): 'txt' | 'pdf' | 'epub' | null => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    if (ext === 'txt') return 'txt';
    if (ext === 'pdf') return 'pdf';
    if (ext === 'epub') return 'epub';
    // MOBI/AZW3/other formats not supported yet - show proper error instead of misleading EPUB load
    return null;
  };

  // 打开指定路径文件
  const openFilePath = async (filePath: string) => {
    const readerType = resolveReaderType(filePath);
    if (!readerType) {
      message.error('不支持的文件格式，当前支持 TXT / PDF / EPUB');
      return;
    }

    const name = filePath.split(/[\\/]/).pop() || filePath;

    dispatch(addRecentFile({
      id: filePath,
      name,
      path: filePath,
      type: readerType,
      lastOpened: new Date().toISOString(),
    }));

    navigate(`/reader/${readerType}?path=${encodeURIComponent(filePath)}`);
  };

  // 通过系统对话框打开文件
  const handleOpenFile = async () => {
    try {
      const result = await window.electron.openFile();
      if (result.canceled || !result.filePath) return;
      await openFilePath(result.filePath);
    } catch (error) {
      console.error('打开文件失败:', error);
      message.error('打开文件失败');
    }
  };

  // 打开文件列表中的文件
  const openFile = (file: FileItem) => {
    openFilePath(file.path);
  };

  // 删除文件（从最近文件中移除）
  const deleteFile = (fileId: string) => {
    dispatch(removeRecentFile(fileId));
    message.success('已从最近文件中移除');
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'txt':
        return <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'pdf':
        return <FilePdfOutlined style={{ fontSize: '24px', color: '#f5222d' }} />;
      case 'epub':
      case 'mobi':
      case 'azw3':
        return <BookOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
      default:
        return <FileTextOutlined style={{ fontSize: '24px', color: '#faad14' }} />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const getTabFiles = () => {
    switch (activeTab) {
      case 'recent':
        return [...filteredFiles].sort(
          (a, b) => new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
        );
      case 'txt':
        return filteredFiles.filter(file => file.type === 'txt');
      case 'pdf':
        return filteredFiles.filter(file => file.type === 'pdf');
      case 'epub':
        return filteredFiles.filter(file =>
          file.type === 'epub' || file.type === 'mobi' || file.type === 'azw3'
        );
      default:
        return filteredFiles;
    }
  };

  const openWebBrowser = () => navigate('/webview');

  return (
    <div className="home-page">
      <div className="home-header">
        <h1>摸金阅读</h1>
        <p className="subtitle">· 寻龙分金 · 静谧阅读 ·</p>
      </div>

      <div className="action-bar">
        <Space>
          <Button type="primary" icon={<FolderOpenOutlined />} onClick={handleOpenFile}>
            打开文件
          </Button>

          <Button
            type="primary"
            icon={<GlobalOutlined />}
            onClick={openWebBrowser}
          >
            网页阅读
          </Button>
        </Space>

        <Search
          placeholder="搜索文件..."
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 250 }}
        />
      </div>

      <div className="drop-hint">提示：也可以直接把文件拖入窗口打开</div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="file-tabs"
        items={[{
          key: 'recent',
          label: <span><ClockCircleOutlined /> 最近</span>,
        }, {
          key: 'txt',
          label: <span><FileTextOutlined /> TXT</span>,
        }, {
          key: 'pdf',
          label: <span><FilePdfOutlined /> PDF</span>,
        }, {
          key: 'epub',
          label: <span><BookOutlined /> EPUB</span>,
        }]}
      >
      </Tabs>

      <div className="file-list-container">
        {getTabFiles().length > 0 ? (
          <List
            className="file-list"
            itemLayout="horizontal"
            dataSource={getTabFiles()}
            renderItem={file => (
              <List.Item
                className="file-item"
                actions={[
                  <Dropdown
                    key="more"
                    menu={{
                      items: [
                        {
                          key: 'info',
                          label: '文件信息',
                          icon: <InfoCircleOutlined />,
                          onClick: () => message.info(`路径：${file.path}`),
                        },
                        {
                          key: 'rename',
                          label: '重命名',
                          icon: <EditOutlined />,
                          onClick: () => message.info('重命名功能开发中'),
                        },
                        {
                          key: 'delete',
                          label: '从列表移除',
                          icon: <DeleteOutlined />,
                          danger: true,
                          onClick: () => deleteFile(file.id),
                        },
                      ],
                    }}
                    placement="bottomRight"
                  >
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>,
                ]}
              >
                <div className="file-item-content" onClick={() => openFile(file)}>
                  <div className="file-icon">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      <span>{file.type.toUpperCase()}</span>
                      {file.lastOpened && (
                        <>
                          <span>·</span>
                          <span>上次打开: {formatDate(file.lastOpened)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            description={
              activeTab === 'recent'
                ? '还没有打开过文件，点击「打开文件」或拖拽文件到窗口'
                : '没有找到文件'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
