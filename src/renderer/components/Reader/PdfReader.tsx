import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Slider, message, Spin, Tooltip, Drawer, Select, InputNumber } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  BookOutlined,
  MenuOutlined,
  SearchOutlined,
  SettingOutlined,
  ZoomInOutlined,
  ZoomOutOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  setCurrentPage, 
  setTotalPages, 
  updateReaderSettings
} from '../../store/slices/readerSlice';
import { addBookmark } from '../../store/slices/bookmarkSlice';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';
import './PdfReader.css';

interface PdfReaderProps {
  filePath: string;
  initialPage?: number;
}

interface Outline {
  title: string;
  dest: any;
  items?: Outline[];
  expanded?: boolean;
}

const PdfReader: React.FC<PdfReaderProps> = ({ filePath, initialPage }) => {
  const dispatch = useAppDispatch();
  const { readingProgress, settings } = useAppSelector(state => state.reader);
  const { currentPage, totalPages } = readingProgress;
  
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [outline, setOutline] = useState<Outline[]>([]);
  const [showOutline, setShowOutline] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [jumpToPage, setJumpToPage] = useState(currentPage);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 加载PDF文档
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);

        // 通过主进程读取文件缓冲（渲染进程无法直接访问文件路径）
        const data = await window.electron.readFileBuffer(filePath);
        if (!data) {
          throw new Error('读取 PDF 文件失败');
        }

        // 加载PDF文档
        const pdf = await pdfjsLib.getDocument({ data }).promise;

        setPdfDocument(pdf);
        const nextPage = initialPage && initialPage >= 1 && initialPage <= pdf.numPages ? initialPage : 1;
        dispatch(setTotalPages(pdf.numPages));
        dispatch(setCurrentPage(nextPage));

        // 尝试获取大纲
        try {
          const outline = await pdf.getOutline();
          if (outline) {
            const processedOutline = outline.map((item: any) => ({
              ...item,
              expanded: false
            }));
            setOutline(processedOutline);
          }
        } catch (error) {
          // 大纲获取失败或文档无目录项，静默处理
        }

        setIsLoading(false);
      } catch (error) {
        console.error('加载PDF失败:', error);
        message.error('PDF文档加载失败');
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [filePath, dispatch, initialPage]);
  
  // 渲染当前页面
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;
      
      try {
        const page = await pdfDocument.getPage(currentPage);
        const viewport = page.getViewport({ scale });
        
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderTask = page.render({
            canvasContext: context,
            viewport
          });
          
          await renderTask.promise;
        }
      } catch (error) {
        console.error('渲染PDF页面失败:', error);
      }
    };
    
    if (!isLoading) {
      renderPage();
    }
  }, [pdfDocument, currentPage, scale, isLoading]);
  
  // 翻页功能
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      dispatch(setCurrentPage(currentPage + 1));
    }
  }, [currentPage, totalPages, dispatch]);
  
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      dispatch(setCurrentPage(currentPage - 1));
    }
  }, [currentPage, dispatch]);
  
  // 缩放功能
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  };
  
  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };
  
  // 跳转到指定页面
  const handleJumpToPage = () => {
    if (jumpToPage >= 1 && jumpToPage <= totalPages) {
      dispatch(setCurrentPage(jumpToPage));
    } else {
      message.error(`页码必须在1到${totalPages}之间`);
    }
  };
  
  // 处理大纲点击
  const handleOutlineClick = async (dest: any) => {
    if (!dest || !Array.isArray(dest) || dest.length === 0) return;
    try {
      // PDF.js 大纲 dest 通常是 [页引用对象, namedDest, 参数...]，
      // 页引用形如 { num, gen }，需用 getPageIndex 解析为实际页码（0 基）
      const ref = dest[0];
      const pageIndex = await pdfDocument.getPageIndex(ref);
      const pageNumber = Math.min(Math.max(pageIndex + 1, 1), totalPages);
      dispatch(setCurrentPage(pageNumber));
      setShowOutline(false);
    } catch (error) {
      message.error('无法定位该目录项');
    }
  };
  
  // 添加书签
  const handleAddBookmark = () => {
    const title = `第${currentPage}页`;
    dispatch(addBookmark({
      title,
      filePath,
      fileType: 'pdf',
      position: currentPage,
      pageNumber: currentPage,
      progress: (currentPage / totalPages) * 100,
      notes: `页码: ${currentPage}/${totalPages}`,
    }));
    message.success('书签添加成功');
  };
  
  // 更新设置
  const updateSetting = (key: string, value: any) => {
    dispatch(updateReaderSettings({ [key]: value }));
  };
  
  // 递归渲染大纲
  const renderOutline = (items: Outline[], level = 0) => {
    return (
      <ul className={`pdf-outline-list level-${level}`}>
        {items.map((item, index) => (
          <li key={index} className="pdf-outline-item">
            <div 
              className="pdf-outline-title"
              onClick={() => handleOutlineClick(item.dest)}
              style={{ paddingLeft: `${level * 16}px` }}
            >
              {item.title}
            </div>
            {item.items && item.items.length > 0 && item.expanded && 
              renderOutline(item.items, level + 1)
            }
          </li>
        ))}
      </ul>
    );
  };
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prevPage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextPage();
          break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) {
            prevPage();
          } else {
            nextPage();
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextPage, prevPage]);
  
  // 鼠标滚轮事件处理
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        if (e.ctrlKey) {
          // 按住Ctrl键滚动鼠标滚轮进行缩放
          e.preventDefault();
          if (e.deltaY < 0) {
            zoomIn();
          } else {
            zoomOut();
          }
        }
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);
  
  if (isLoading) {
    return (
      <div className="pdf-reader-loading">
        <Spin size="large" />
        <p>正在加载PDF文档...</p>
      </div>
    );
  }
  
  // 确保opacity有默认值
  const contentOpacity = settings.opacity !== undefined ? settings.opacity : 1.0;
  
  return (
    <div className="pdf-reader">
      {/* 顶部工具栏：仅保留功能菜单（缩放/目录/书签/设置）；翻页等操作放底部工具条 */}
      <div className="pdf-reader-toolbar">
        <div className="toolbar-left">
          <span className="reader-toolbar-title">PDF 阅读器</span>
        </div>
        
        <div className="toolbar-right">
          <Button icon={<ZoomOutOutlined />} onClick={zoomOut} aria-label="缩小" />
          <span className="scale-info">{Math.round(scale * 100)}%</span>
          <Button icon={<ZoomInOutlined />} onClick={zoomIn} aria-label="放大" />
          
          <Tooltip title="目录">
            <Button 
              icon={<MenuOutlined />} 
              onClick={() => setShowOutline(!showOutline)}
              disabled={outline.length === 0}
              aria-label="目录"
            />
          </Tooltip>
          <Button 
            icon={<BookOutlined />} 
            onClick={handleAddBookmark}
            aria-label="添加书签"
          >
            添加书签
          </Button>
          <Button 
            icon={<SettingOutlined />}
            onClick={() => setShowSettings(!showSettings)}
            aria-label="设置"
          >
            设置
          </Button>
        </div>
      </div>
      
      {/* 设置面板 */}
      {showSettings && (
        <div className="pdf-reader-settings">
          <div className="settings-row">
            <label>透明度：</label>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={contentOpacity}
              onChange={(value) => updateSetting('opacity', value)}
              style={{ width: 150 }}
            />
            <span>{Math.round(contentOpacity * 100)}%</span>
          </div>
        </div>
      )}
      
      {/* PDF内容 */}
      <div 
        className="pdf-reader-content"
        ref={containerRef}
        style={{ opacity: contentOpacity }}
      >
        <canvas ref={canvasRef} className="pdf-canvas"></canvas>
      </div>

      {/* 底部翻页工具条 */}
      <div className="pdf-reader-bottom-bar">
        <div className="bottom-left">
          <Button 
            icon={<LeftOutlined />} 
            onClick={prevPage}
            disabled={currentPage <= 1}
            aria-label="上一页"
          >
            上一页
          </Button>
          <span className="page-info">{currentPage} / {totalPages}</span>
          <Button 
            icon={<RightOutlined />} 
            onClick={nextPage}
            disabled={currentPage >= totalPages}
            aria-label="下一页"
          >
            下一页
          </Button>
        </div>
        <div className="bottom-right">
          <div className="page-jump">
            <InputNumber
              min={1}
              max={totalPages}
              value={jumpToPage}
              onChange={(value) => setJumpToPage(value || 1)}
              style={{ width: 60 }}
              aria-label="跳转到指定页"
            />
            <Button onClick={handleJumpToPage}>跳转</Button>
          </div>
        </div>
      </div>
      
      {/* 目录抽屉 */}
      <Drawer
        title="目录"
        placement="left"
        closable={true}
        onClose={() => setShowOutline(false)}
        open={showOutline}
        width={300}
      >
        {outline.length > 0 ? (
          renderOutline(outline)
        ) : (
          <p className="no-outline">此PDF文档没有目录</p>
        )}
      </Drawer>
    </div>
  );
};

export default PdfReader;