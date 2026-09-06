import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button, Select, Slider, ColorPicker, InputNumber, Input, message, Spin, Drawer, Empty } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  SettingOutlined,
  SearchOutlined,
  BookOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  setCurrentPage,
  setTotalPages,
  updateReaderSettings,
} from '../../store/slices/readerSlice';
import { addBookmark } from '../../store/slices/bookmarkSlice';
import {
  paginateText,
  getChapterAtPage,
  ChapterInfo,
  PageInfo,
} from '../../utils/textPaginator';
import './TxtReader.css';

const { Option } = Select;

interface TxtReaderProps {
  filePath: string;
  content: string;
  initialPage?: number;
}

const TxtReader: React.FC<TxtReaderProps> = ({ filePath, content, initialPage }) => {
  const dispatch = useAppDispatch();
  const { readingProgress, settings } = useAppSelector((state) => state.reader);

  const [pages, setPages] = useState<PageInfo[]>([]);
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [encoding, setEncoding] = useState<string>('utf-8');
  const [displayContent, setDisplayContent] = useState(content);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHits, setSearchHits] = useState<number[]>([]);
  const [searchCursor, setSearchCursor] = useState(0);

  const contentRef = useRef<HTMLDivElement>(null);
  const firstPaginationDone = useRef(false);

  // 文件内容变化（换文件 / 换编码重新读取）时同步显示内容
  useEffect(() => {
    setDisplayContent(content);
    firstPaginationDone.current = false;
  }, [content]);

  // 切换编码后按新编码重新读取文件
  const handleEncodingChange = async (value: string) => {
    setEncoding(value);
    try {
      const result = await window.electron.readTextFile(filePath, value);
      if (result.success) {
        setDisplayContent(result.content);
        message.success(`已按 ${value.toUpperCase()} 编码重新加载`);
      } else {
        message.error(result.error || '按指定编码读取失败');
      }
    } catch (error) {
      console.error('重新读取文件失败:', error);
      message.error('重新读取文件失败');
    }
  };

  // 支持的编码格式
  const encodings = [
    { value: 'utf-8', label: 'UTF-8' },
    { value: 'gbk', label: 'GBK' },
    { value: 'gb2312', label: 'GB2312' },
    { value: 'big5', label: 'Big5' },
    { value: 'utf-16', label: 'UTF-16' },
    { value: 'iso-8859-1', label: 'ISO-8859-1' },
  ];

  // 字体选项
  const fontFamilies = [
    { value: 'Microsoft YaHei', label: '微软雅黑' },
    { value: 'SimSun', label: '宋体' },
    { value: 'SimHei', label: '黑体' },
    { value: 'KaiTi', label: '楷体' },
    { value: 'FangSong', label: '仿宋' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Consolas', label: 'Consolas' },
  ];

  // 主题选项
  const themes = [
    { value: 'light', label: '明亮', backgroundColor: '#ffffff', textColor: '#333333' },
    { value: 'dark', label: '暗黑', backgroundColor: '#1f1f1f', textColor: '#e0e0e0' },
    { value: 'sepia', label: '护眼', backgroundColor: '#f7f3e9', textColor: '#5c4b37' },
    { value: 'green', label: '绿色', backgroundColor: '#e8f5e8', textColor: '#2d5016' },
  ];

  // 行级分页（依赖内容与排版设置）
  const recalculatePages = useCallback(() => {
    if (!displayContent || !contentRef.current) return;

    const el = contentRef.current;
    const result = paginateText(
      displayContent,
      el.clientWidth,
      el.clientHeight,
      settings.fontSize,
      settings.lineHeight,
      settings.margin,
      settings.pageWidth
    );

    setPages(result.pages);
    setChapters(result.chapters);
    dispatch(setTotalPages(result.pages.length));
    setIsLoading(false);

    // 首次分页：优先定位到书签指定页
    if (!firstPaginationDone.current) {
      firstPaginationDone.current = true;
      if (initialPage && initialPage >= 1 && initialPage <= result.pages.length) {
        dispatch(setCurrentPage(initialPage));
      } else {
        dispatch(setCurrentPage(1));
      }
    }
  }, [displayContent, settings.fontSize, settings.lineHeight, settings.margin, settings.pageWidth, dispatch, initialPage]);

  // 初始分页
  useEffect(() => {
    recalculatePages();
  }, [recalculatePages]);

  // 窗口大小变化：500ms 防抖重排，并尽量保持当前阅读位置
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const anchor = pages[readingProgress.currentPage - 1]?.startOffset ?? 0;
        recalculatePages();
        const target = pages.find((p) => p.startOffset <= anchor && anchor < p.endOffset) ?? pages[0];
        if (target) dispatch(setCurrentPage(target.index));
      }, 500);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [pages, readingProgress.currentPage, recalculatePages, dispatch]);

  // 翻页
  const goToPage = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= pages.length) {
      dispatch(setCurrentPage(pageNumber));
    }
  };

  const nextPage = () => goToPage(readingProgress.currentPage + 1);
  const prevPage = () => goToPage(readingProgress.currentPage - 1);

  const jumpToPage = (page: number) => {
    if (page >= 1 && page <= pages.length) {
      goToPage(page);
    } else {
      message.warning(`页码范围：1-${pages.length}`);
    }
  };

  // 章节目录跳转
  const jumpToChapter = (chapter: ChapterInfo) => {
    goToPage(chapter.pageIndex);
    setShowChapters(false);
  };

  const currentChapter = useMemo(
    () => getChapterAtPage(chapters, pages[readingProgress.currentPage - 1]?.startOffset ?? 0),
    [chapters, pages, readingProgress.currentPage]
  );

  // 搜索
  const runSearch = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) {
        setSearchHits([]);
        setSearchCursor(0);
        return;
      }
      const hits: number[] = [];
      pages.forEach((p) => {
        if (p.content.toLowerCase().includes(q)) hits.push(p.index);
      });
      setSearchHits(hits);
      if (hits.length > 0) {
        // 从当前页之后开始定位
        const idx = hits.findIndex((p) => p >= readingProgress.currentPage);
        const cursor = idx >= 0 ? idx : 0;
        setSearchCursor(cursor);
        goToPage(hits[cursor]);
      } else {
        setSearchCursor(0);
        message.info('未找到匹配内容');
      }
    },
    [pages, readingProgress.currentPage]
  );

  const gotoHit = (cursor: number) => {
    if (searchHits.length === 0) return;
    const next = (cursor + searchHits.length) % searchHits.length;
    setSearchCursor(next);
    goToPage(searchHits[next]);
  };

  // 添加书签
  const handleAddBookmark = () => {
    if (pages.length === 0) {
      message.warning('文档未加载完成，无法添加书签');
      return;
    }
    if (readingProgress.currentPage < 1 || readingProgress.currentPage > pages.length) {
      message.warning('当前页码无效，无法添加书签');
      return;
    }
    const currentPageItem = pages[readingProgress.currentPage - 1];
    const title = currentPageItem.content.replace(/\s+/g, ' ').trim().substring(0, 50) + '...';

    dispatch(
      addBookmark({
        title,
        filePath,
        fileType: 'txt',
        position: readingProgress.currentPage,
        pageNumber: readingProgress.currentPage,
        progress: readingProgress.progress,
        notes: `第${readingProgress.currentPage}页`,
      })
    );
    message.success('书签添加成功');
  };

  // 设置更新
  const updateSettings = (key: string, value: any) => {
    dispatch(updateReaderSettings({ [key]: value }));
  };

  // 键盘事件
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
          if (e.shiftKey) prevPage();
          else nextPage();
          break;
        case 'Home':
          e.preventDefault();
          goToPage(1);
          break;
        case 'End':
          e.preventDefault();
          goToPage(pages.length);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages.length, readingProgress.currentPage]);

  const currentPageContent = pages[readingProgress.currentPage - 1]?.content || '';

  return (
    <div className="txt-reader">
      {/* 顶部工具栏：仅保留功能菜单（目录/书签/搜索/设置）；翻页等操作放底部工具条 */}
      <div className="txt-reader-toolbar">
        <div className="toolbar-left">
          <span className="reader-toolbar-title">阅读器</span>
        </div>

        <div className="toolbar-right">
          <Button icon={<MenuOutlined />} onClick={() => setShowChapters(true)}>
            目录
          </Button>
          <Button icon={<BookOutlined />} onClick={handleAddBookmark}>
            书签
          </Button>
          <Button icon={<SearchOutlined />} onClick={() => setSearchVisible(!searchVisible)}>
            搜索
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setShowSettings(!showSettings)}>
            设置
          </Button>
        </div>
      </div>

      {/* 当前章节指示 */}
      <div className="txt-chapter-bar" onClick={() => setShowChapters(true)} title="点击打开目录">
        {currentChapter ? currentChapter.title : '（无章节信息）'}
      </div>

      {/* 搜索栏 */}
      {searchVisible && (
        <div className="txt-search-bar">
          <Input
            autoFocus
            placeholder="输入要查找的内容"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={() => runSearch(searchQuery)}
            style={{ flex: 1 }}
          />
          <Button onClick={() => runSearch(searchQuery)}>查找</Button>
          <Button disabled={searchHits.length === 0} onClick={() => gotoHit(searchCursor - 1)}>
            上一处
          </Button>
          <Button disabled={searchHits.length === 0} onClick={() => gotoHit(searchCursor + 1)}>
            下一处
          </Button>
          <span className="txt-search-count">
            {searchHits.length > 0 ? `${searchCursor + 1}/${searchHits.length}` : '0/0'}
          </span>
          <Button type="text" onClick={() => setSearchVisible(false)}>
            关闭
          </Button>
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className="txt-reader-settings">
          <div className="settings-row">
            <label>编码格式：</label>
            <Select value={encoding} onChange={handleEncodingChange} style={{ width: 120 }}>
              {encodings.map((enc) => (
                <Option key={enc.value} value={enc.value}>
                  {enc.label}
                </Option>
              ))}
            </Select>
          </div>

          <div className="settings-row">
            <label>字体大小：</label>
            <Slider
              min={12}
              max={32}
              value={settings.fontSize}
              onChange={(value) => updateSettings('fontSize', value)}
              style={{ width: 150 }}
            />
            <span>{settings.fontSize}px</span>
          </div>

          <div className="settings-row">
            <label>字体：</label>
            <Select
              value={settings.fontFamily}
              onChange={(value) => updateSettings('fontFamily', value)}
              style={{ width: 150 }}
            >
              {fontFamilies.map((font) => (
                <Option key={font.value} value={font.value}>
                  {font.label}
                </Option>
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
              onChange={(value) => updateSettings('lineHeight', value)}
              style={{ width: 150 }}
            />
            <span>{settings.lineHeight}</span>
          </div>

          <div className="settings-row">
            <label>主题：</label>
            <Select
              value={settings.theme}
              onChange={(value) => {
                const theme = themes.find((t) => t.value === value);
                if (theme) {
                  updateSettings('theme', value);
                  updateSettings('backgroundColor', theme.backgroundColor);
                  updateSettings('textColor', theme.textColor);
                }
              }}
              style={{ width: 120 }}
            >
              {themes.map((theme) => (
                <Option key={theme.value} value={theme.value}>
                  {theme.label}
                </Option>
              ))}
            </Select>
          </div>

          <div className="settings-row">
            <label>背景色：</label>
            <ColorPicker
              value={settings.backgroundColor}
              onChange={(color) => updateSettings('backgroundColor', color.toHexString())}
            />
          </div>

          <div className="settings-row">
            <label>文字颜色：</label>
            <ColorPicker
              value={settings.textColor}
              onChange={(color) => updateSettings('textColor', color.toHexString())}
            />
          </div>
        </div>
      )}

      {/* 阅读内容 */}
      <div
        className="txt-reader-content"
        ref={contentRef}
        style={{
          fontSize: `${settings.fontSize}px`,
          fontFamily: settings.fontFamily,
          lineHeight: settings.lineHeight,
          backgroundColor: settings.backgroundColor,
          color: settings.textColor,
          padding: `${settings.margin}px`,
          width: settings.pageWidth > 0 ? `${settings.pageWidth}px` : '100%',
          margin: '0 auto',
        }}
      >
        {isLoading ? (
          <div className="txt-reader-loading">
            <Spin size="large" />
            <p>正在排版...</p>
          </div>
        ) : (
          <pre className="txt-content">{currentPageContent}</pre>
        )}
      </div>

      {/* 底部翻页工具条：翻页/页码跳转放这里，避免与顶部菜单互相挤占，也不再被侧边栏覆盖 */}
      <div className="txt-reader-bottom-bar">
        <div className="bottom-left">
          <Button
            icon={<LeftOutlined />}
            onClick={prevPage}
            disabled={readingProgress.currentPage <= 1}
            aria-label="上一页"
          >
            上一页
          </Button>
          <div className="page-info">
            <InputNumber
              min={1}
              max={pages.length}
              value={readingProgress.currentPage}
              onChange={(value) => jumpToPage(value || 1)}
              style={{ width: 72 }}
              aria-label="跳转到指定页"
            />
            <span>/ {pages.length}</span>
          </div>
          <Button
            icon={<RightOutlined />}
            onClick={nextPage}
            disabled={readingProgress.currentPage >= pages.length}
            aria-label="下一页"
          >
            下一页
          </Button>
        </div>
        <div className="bottom-right">
          <span className="page-info-text">
            进度 {Math.round(readingProgress.progress || ((readingProgress.currentPage / Math.max(pages.length, 1)) * 100))}%
          </span>
        </div>
      </div>

      {/* 细进度条 */}
      <div className="txt-reader-progress">
        <div className="progress-bar" style={{ width: `${readingProgress.progress || ((readingProgress.currentPage / Math.max(pages.length, 1)) * 100)}%` }} />
      </div>

      {/* 章节目录抽屉 */}
      <Drawer
        title={`目录（${chapters.length}章）`}
        placement="right"
        width={280}
        open={showChapters}
        onClose={() => setShowChapters(false)}
      >
        {chapters.length === 0 ? (
          <Empty description="未识别到章节标题" />
        ) : (
          <div className="txt-chapter-list">
            {chapters.map((chapter) => (
              <div
                key={chapter.index}
                className={`txt-chapter-item ${
                  currentChapter && currentChapter.index === chapter.index ? 'active' : ''
                }`}
                onClick={() => jumpToChapter(chapter)}
              >
                {chapter.title}
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TxtReader;
