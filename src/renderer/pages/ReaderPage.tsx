import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAppDispatch } from '../hooks/redux';
import TxtReader from '../components/Reader/TxtReader';
import PdfReader from '../components/Reader/PdfReader';
import EpubReader from '../components/Reader/EpubReader';
import { setCurrentFile } from '../store/slices/readerSlice';
import '../styles/ReaderPage.css';

const ReaderPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 路由格式: /reader/:type?path=xxx&page=n&position=n&progress=n
  const filePath = searchParams.get('path') || '';
  const initialPage = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
  const initialPosition = searchParams.get('position') ? Number(searchParams.get('position')) : undefined;
  const initialProgress = searchParams.get('progress') ? Number(searchParams.get('progress')) : undefined;

  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(!!filePath);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!filePath) {
      setError('文件路径无效，请返回首页选择文件');
      setIsLoading(false);
      return;
    }

    // 记录当前文件到 Redux
    dispatch(setCurrentFile({ filePath, fileType: type || 'txt' }));

    // 仅 TXT 需要预读取内容；PDF/EPUB 由阅读器组件自行读取文件缓冲
    if (type !== 'txt') {
      setIsLoading(false);
      return;
    }

    const loadTxt = async () => {
      try {
        setIsLoading(true);
        const result = await window.electron.readTextFile(filePath);
        if (!result.success) {
          throw new Error(result.error || '读取失败');
        }
        setFileContent(result.content);
        setIsLoading(false);
      } catch (err) {
        console.error('加载 TXT 失败:', err);
        setError('加载文件失败，请检查文件格式是否支持');
        setIsLoading(false);
        message.error('文件加载失败，请检查文件格式是否支持');
      }
    };

    loadTxt();
  }, [filePath, type, dispatch]);

  const goBack = () => navigate('/');

  if (isLoading) {
    return (
      <div className="reader-loading">
        <Spin size="large" />
        <p>正在加载文件...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reader-error">
        <h2>出错了</h2>
        <p>{error}</p>
        <Button type="primary" onClick={goBack}>返回首页</Button>
      </div>
    );
  }

  const renderReader = () => {
    if (!filePath) return null;

    switch (type) {
      case 'txt':
        return (
          <TxtReader
            filePath={filePath}
            content={fileContent}
            initialPage={initialPage || initialPosition}
          />
        );
      case 'pdf':
        return <PdfReader filePath={filePath} initialPage={initialPage} />;
      case 'epub':
      case 'mobi':
      case 'azw3':
        return <EpubReader filePath={filePath} initialProgress={initialProgress} />;
      default:
        return <div>不支持的文件格式</div>;
    }
  };

  return (
    <div className="reader-page">
      <div className="reader-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={goBack}
          className="back-button"
        >
          返回
        </Button>
        <div className="file-info">
          <span className="file-name">{filePath.split(/[\\/]/).pop() || filePath}</span>
          <span className="file-type">{(type || 'txt').toUpperCase()}</span>
        </div>
      </div>

      <div className="reader-container">
        {renderReader()}
      </div>
    </div>
  );
};

export default ReaderPage;
