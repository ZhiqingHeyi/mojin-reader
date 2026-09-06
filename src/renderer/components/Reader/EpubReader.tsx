import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Slider, message, Spin, Tooltip, Drawer, Select, ColorPicker } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  BookOutlined,
  MenuOutlined,
  SearchOutlined,
  SettingOutlined,
  FontSizeOutlined
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  setCurrentPage, 
  setTotalPages, 
  updateReaderSettings,
  setProgress
} from '../../store/slices/readerSlice';
import { addBookmark } from '../../store/slices/bookmarkSlice';
import ePub from 'epubjs';
import './EpubReader.css';

interface EpubReaderProps {
  filePath: string;
  initialProgress?: number;
}

interface TocItem {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
  expanded?: boolean;
}

const EpubReader: React.FC<EpubReaderProps> = ({ filePath, initialProgress }) => {
  const dispatch = useAppDispatch();
  const { readingProgress, settings } = useAppSelector(state => state.reader);
  
  const [book, setBook] = useState<any>(null);
  const [rendition, setRendition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentCfi, setCurrentCfi] = useState<string>('');
  const [metadata, setMetadata] = useState<any>({});
  const [totalLocations, setTotalLocations] = useState(100);
  
  const viewerRef = useRef<HTMLDivElement>(null);

  // 用 ref 缓存设置，避免 settings 变化触发 effect 重跑导致 book 被反复销毁
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // 用 ref 缓存初始进度，避免其变化触发 effect 重跑
  const initialProgressRef = useRef(initialProgress);
  initialProgressRef.current = initialProgress;

  // 加载EPUB文档（仅依赖 filePath；设置变化通过单独 effect 应用于 rendition）
  useEffect(() => {
    let bookRef: any = null;
    let renditionRef: any = null;
    let cancelled = false;

    const loadEpub = async () => {
      try {
        setIsLoading(true);

        // 通过主进程读取文件缓冲（渲染进程无法直接访问文件路径）
        const data = await window.electron.readFileBuffer(filePath);
        if (!data) {
          throw new Error('读取 EPUB 文件失败');
        }

        // 加载EPUB文档
        const book = ePub(data);
        bookRef = book;
        setBook(book);

        // 等待书籍加载完成
        await book.opened;

        // 获取元数据
        const metadata = await book.loaded.metadata;
        setMetadata(metadata);

        if (cancelled) return;

        // 创建渲染器（内容容器始终渲染，viewerRef 此时可用）
        if (viewerRef.current) {
          const rendition = book.renderTo(viewerRef.current, {
            width: '100%',
            height: '100%',
            spread: 'none'
          });
          renditionRef = rendition;

          // epubjs 内部 Queue 依赖 requestAnimationFrame 驱动；窗口隐藏/最小化时 rAF 被冻结，
          // 会导致 display()/next() 等任务永不执行（表现为空白页、翻页无效）。
          // 改用 setTimeout 驱动队列，并重新调度一次（绕过已被 rAF 冻结的旧调度）。
          const q = (rendition.q as any);
          q.tick = (fn: () => void) => setTimeout(fn, 16);
          q.run();

          // 注册主题
          rendition.themes.register('light', { body: { color: '#333333', background: '#ffffff' } });
          rendition.themes.register('dark', { body: { color: '#e0e0e0', background: '#1f1f1f' } });
          rendition.themes.register('sepia', { body: { color: '#5c4b37', background: '#f7f3e9' } });

          // 应用主题与字体
          rendition.themes.select(settingsRef.current.theme);
          rendition.themes.fontSize(`${settingsRef.current.fontSize}px`);

          // 显示内容
          await rendition.display();
          setRendition(rendition);

          // 监听渲染事件
          rendition.on('relocated', (location: any) => {
            if (location && location.start) {
              setCurrentCfi(location.start.cfi);
              dispatch(setProgress(location.start.percentage * 100));
            }
          });
        }

        // 先展示内容，再在后台加载目录与位置信息（大书较慢，避免阻塞渲染）
        if (!cancelled) setIsLoading(false);

        // 目录（后台加载）
        book.loaded.navigation.then((navigation: any) => {
          const toc = navigation.toc.map((item: any) => ({
            id: item.id,
            href: item.href,
            label: item.label,
            subitems: item.subitems || [],
            expanded: false
          }));
          setToc(toc);
        }).catch(() => {});

        // 位置信息（后台生成，用于进度跳转）
        book.ready.then(() => book.locations.generate(1600)).then(() => {
          setTotalLocations((book.locations as any).total);
          dispatch(setTotalPages((book.spine as any).length));

          // 跳转到书签指定的进度位置
          if (initialProgressRef.current && initialProgressRef.current > 0) {
            try {
              const cfi = book.locations.cfiFromPercentage(initialProgressRef.current / 100);
              const r = renditionRef;
              if (r) {
                r.display(cfi);
              }
              dispatch(setProgress(initialProgressRef.current));
            } catch (e) {
              console.warn('跳转到书签进度失败:', e);
            }
          }
        }).catch(() => {});
      } catch (error) {
        console.error('[epub] 加载失败:', error);
        message.error('EPUB文档加载失败');
        if (!cancelled) setIsLoading(false);
      }
    };

    loadEpub();

    // 清理函数
    return () => {
      cancelled = true;
      if (renditionRef) {
        try { renditionRef.destroy(); } catch (e) { /* ignore */ }
      }
      if (bookRef) {
        try { bookRef.destroy(); } catch (e) { /* ignore */ }
      }
    };
  }, [filePath, dispatch]);
  
  // 翻页功能
  const nextPage = useCallback(() => {
    if (rendition) {
      rendition.next();
    }
  }, [rendition]);
  
  const prevPage = useCallback(() => {
    if (rendition) {
      rendition.prev();
    }
  }, [rendition]);
  
  // 跳转到指定位置
  const jumpToLocation = (progress: number) => {
    if (book && rendition) {
      const cfi = book.locations.cfiFromPercentage(progress / 100);
      rendition.display(cfi);
    }
  };
  
  // 处理目录点击
  const handleTocClick = (href: string) => {
    if (rendition) {
      rendition.display(href);
      setShowToc(false);
    }
  };
  
  // 添加书签
  const handleAddBookmark = () => {
    if (currentCfi) {
      const title = metadata.title || '未知章节';
      dispatch(addBookmark({
        title,
        filePath,
        fileType: 'epub',
        position: currentCfi,
        progress: readingProgress.progress,
        notes: `进度: ${Math.round(readingProgress.progress)}%`,
      }));
      message.success('书签添加成功');
    }
  };
  
  // 更新设置
  const updateSetting = (key: string, value: any) => {
    dispatch(updateReaderSettings({ [key]: value }));
    
    if (rendition) {
      if (key === 'fontSize') {
        rendition.themes.fontSize(`${value}px`);
      } else if (key === 'theme') {
        rendition.themes.select(value);
      }
    }
  };
  
  // 递归渲染目录
  const renderToc = (items: TocItem[], level = 0) => {
    return (
      <ul className={`epub-toc-list level-${level}`}>
        {items.map((item, index) => (
          <li key={index} className="epub-toc-item">
            <div 
              className="epub-toc-title"
              onClick={() => handleTocClick(item.href)}
              style={{ paddingLeft: `${level * 16}px` }}
            >
              {item.label}
            </div>
            {item.subitems && item.subitems.length > 0 && item.expanded && 
              renderToc(item.subitems, level + 1)
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
  
  // 字体选项
  const fontFamilies = [
    { value: 'inherit', label: '默认字体' },
    { value: 'Microsoft YaHei', label: '微软雅黑' },
    { value: 'SimSun', label: '宋体' },
    { value: 'SimHei', label: '黑体' },
    { value: 'KaiTi', label: '楷体' },
    { value: 'FangSong', label: '仿宋' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' }
  ];
  
  // 主题选项
  const themeOptions = [
    { value: 'light', label: '明亮' },
    { value: 'dark', label: '暗黑' },
    { value: 'sepia', label: '护眼' }
  ];
  
  return (
    <div className={`epub-reader ${settings.theme}-theme`}>
      {/* 顶部工具栏：仅保留功能菜单（目录/书签/设置）；翻页与进度放底部工具条 */}
      <div className="epub-reader-toolbar">
        <div className="toolbar-left">
          <span className="reader-toolbar-title">EPUB 阅读器</span>
        </div>
        
        <div className="toolbar-right">
          <Tooltip title="目录">
            <Button 
              icon={<MenuOutlined />} 
              onClick={() => setShowToc(!showToc)}
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
        <div className="epub-reader-settings">
          <div className="settings-row">
            <label>字体大小：</label>
            <Slider
              min={12}
              max={32}
              value={settings.fontSize}
              onChange={(value) => updateSetting('fontSize', value)}
              style={{ width: 150 }}
            />
            <span>{settings.fontSize}px</span>
          </div>
          
          <div className="settings-row">
            <label>字体：</label>
            <Select
              value={settings.fontFamily}
              onChange={(value) => updateSetting('fontFamily', value)}
              style={{ width: 150 }}
            >
              {fontFamilies.map(font => (
                <Select.Option key={font.value} value={font.value}>
                  {font.label}
                </Select.Option>
              ))}
            </Select>
          </div>
          
          <div className="settings-row">
            <label>主题：</label>
            <Select
              value={settings.theme}
              onChange={(value) => updateSetting('theme', value)}
              style={{ width: 120 }}
            >
              {themeOptions.map(theme => (
                <Select.Option key={theme.value} value={theme.value}>
                  {theme.label}
                </Select.Option>
              ))}
            </Select>
          </div>
          
          <div className="settings-row">
            <label>行高：</label>
            <Slider
              min={1.0}
              max={3.0}
              step={0.1}
              value={settings.lineHeight}
              onChange={(value) => updateSetting('lineHeight', value)}
              style={{ width: 150 }}
            />
            <span>{settings.lineHeight}</span>
          </div>
          
          <div className="settings-row">
            <label>页边距：</label>
            <Slider
              min={0}
              max={50}
              value={settings.margin}
              onChange={(value) => updateSetting('margin', value)}
              style={{ width: 150 }}
            />
            <span>{settings.margin}px</span>
          </div>
        </div>
      )}
      
      {/* EPUB内容 */}
      <div 
        className="epub-reader-content"
        ref={viewerRef}
      >
        {isLoading && (
          <div className="epub-reader-loading">
            <Spin size="large" />
            <p>正在加载EPUB文档...</p>
          </div>
        )}
      </div>
      
      {/* 目录抽屉 */}
      <Drawer
        title="目录"
        placement="left"
        closable={true}
        onClose={() => setShowToc(false)}
        open={showToc}
        width={300}
      >
        {toc.length > 0 ? (
          renderToc(toc)
        ) : (
          <p className="no-toc">此EPUB文档没有目录</p>
        )}
      </Drawer>
      
      {/* 底部翻页/进度工具条：翻页操作放底部，左侧翻页，中间进度，右侧百分比 */}
      <div className="epub-reader-bottom-bar">
        <Button 
          icon={<LeftOutlined />} 
          onClick={prevPage}
          disabled={readingProgress.progress <= 0}
          aria-label="上一页"
        >
          上一页
        </Button>
        <div className="epub-progress-track">
          <Slider
            min={0}
            max={100}
            value={Math.round(readingProgress.progress)}
            onChange={jumpToLocation}
            tooltip={{ formatter: (value) => `${value}%` }}
          />
        </div>
        <span className="epub-progress-percent">{Math.round(readingProgress.progress)}%</span>
        <Button 
          icon={<RightOutlined />} 
          onClick={nextPage}
          disabled={readingProgress.progress >= 100}
          aria-label="下一页"
        >
          下一页
        </Button>
      </div>
      
      {/* 元数据信息 */}
      {metadata && (
        <div className="epub-metadata">
          <div className="metadata-title">{metadata.title}</div>
          {metadata.creator && <div className="metadata-author">{metadata.creator}</div>}
        </div>
      )}
    </div>
  );
};

export default EpubReader;