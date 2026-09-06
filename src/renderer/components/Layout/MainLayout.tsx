import React, { useEffect, useRef, useState } from 'react';
import { Layout, Menu, Button, Tooltip, message, Popover, Slider } from 'antd';
import { 
  HomeOutlined, 
  BookOutlined, 
  GlobalOutlined, 
  SettingOutlined,
  BookFilled,  // 使用BookFilled替代BookmarkOutlined
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EyeInvisibleOutlined,
  CompassOutlined,
  PushpinOutlined,
  ColumnHeightOutlined,
  ColumnWidthOutlined,
  BgColorsOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import stealthManager from '../../utils/stealthManager';
import './MainLayout.css';

const { Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const recentFiles = useAppSelector(state => state.app.recentFiles);  // 从state中获取recentFiles
  
  const [collapsed, setCollapsed] = useState(true);
  const [opacity, setOpacity] = useState(() => stealthManager.getSettings().opacity);
  const [contentOpacity, setContentOpacity] = useState(() => stealthManager.getSettings().contentOpacity);
  const [backgroundOpacity, setBackgroundOpacity] = useState(() => stealthManager.getSettings().backgroundOpacity);
  const [alwaysOnTop, setAlwaysOnTop] = useState(() => stealthManager.getSettings().alwaysOnTop);
  const [isMini, setIsMini] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [stealthActive, setStealthActive] = useState(
    () => stealthManager.getSettings().mouseOutHideEnabled
  );

  // 监听隐身设置变化（设置页/其他入口改动时同步顶部状态）
  useEffect(() => {
    const sync = (settings: { opacity?: number; contentOpacity?: number; backgroundOpacity?: number; alwaysOnTop?: boolean; mouseOutHideEnabled?: boolean }) => {
      if (typeof settings.opacity === 'number') setOpacity(settings.opacity);
      if (typeof settings.contentOpacity === 'number') setContentOpacity(settings.contentOpacity);
      if (typeof settings.backgroundOpacity === 'number') setBackgroundOpacity(settings.backgroundOpacity);
      if (typeof settings.alwaysOnTop === 'boolean') setAlwaysOnTop(settings.alwaysOnTop);
      if (typeof settings.mouseOutHideEnabled === 'boolean') setStealthActive(settings.mouseOutHideEnabled);
    };
    stealthManager.on('settings-updated', sync as (...args: unknown[]) => void);
    return () => stealthManager.off('settings-updated', sync as (...args: unknown[]) => void);
  }, []);

  // 侧边栏：鼠标移入展开；移出延迟收起（给用户缓冲，避免"一动就收"）
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCollapseTimer = () => {
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
  };

  const expandSider = () => {
    clearCollapseTimer();
    setCollapsed(false);
  };

  const collapseSider = () => {
    clearCollapseTimer();
    setCollapsed(true);
  };

  // 鼠标移出侧边栏：延迟 400ms 再收起，期间移回则取消收起
  const handleSiderMouseLeave = () => {
    clearCollapseTimer();
    collapseTimerRef.current = setTimeout(() => {
      setCollapsed(true);
      collapseTimerRef.current = null;
    }, 400);
  };

  // 鼠标重新移入侧边栏：取消即将发生的收起
  const handleSiderMouseEnter = () => {
    clearCollapseTimer();
  };

  useEffect(() => {
    return () => clearCollapseTimer();
  }, []);

  // 小眼睛：切换「鼠标移出自动隐藏」隐蔽模式
  const toggleStealth = () => {
    const next = !stealthActive;
    setStealthActive(next);
    stealthManager.updateSettings({ mouseOutHideEnabled: next, mouseOutHideDelay: 400 });
    if (next) {
      message.success('已开启隐蔽模式：鼠标移出窗口自动隐藏');
    } else {
      message.success('已关闭隐蔽模式');
    }
  };
  
  // 根据路径确定当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/') return '1';
    if (path.startsWith('/reader')) return '2';
    if (path.startsWith('/webview')) return '3';
    if (path.startsWith('/bookmarks')) return '4';
    if (path.startsWith('/settings')) return '5';
    return '1';
  };
  
  // 处理菜单点击
  const handleMenuClick = (key: string) => {
    switch (key) {
      case '1':
        navigate('/');
        break;
      case '2': {
        const recentFile = recentFiles[0];
        if (recentFile) {
          const fileType = recentFile.type;
          navigate(`/reader/${fileType}?path=${encodeURIComponent(recentFile.path)}`);
        } else {
          navigate('/');
        }
        break;
      }
      case '3':
        navigate('/webview');
        break;
      case '4':
        navigate('/bookmarks');
        break;
      case '5':
        navigate('/settings');
        break;
    }
    // 点击菜单项后立即收起侧边栏（导航完成）
    collapseSider();
  };
  
  // 切换侧边栏折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  // 调整整体透明度
  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    stealthManager.updateSettings({ opacity: value });
  };
  
  // 调整内容区透明度
  const handleContentOpacityChange = (value: number) => {
    setContentOpacity(value);
    stealthManager.setContentOpacity(value);
  };

  // 调整背景板透明度
  const handleBackgroundOpacityChange = (value: number) => {
    setBackgroundOpacity(value);
    stealthManager.setBackgroundOpacity(value);
  };

  // 窗口置顶开关
  const toggleAlwaysOnTop = () => {
    const next = !alwaysOnTop;
    setAlwaysOnTop(next);
    window.electron.setWindowAlwaysOnTop(next);
  };

  // 迷你模式开关
  const toggleMini = () => {
    window.electron.toggleWindowMini();
    setIsMini(!isMini);
  };

  // PC 宽屏模式开关
  const toggleWide = () => {
    window.electron.toggleWindowWide();
    setIsWide(!isWide);
  };

  // 透明度预设档位
  const applyOpacityPreset = (preset: { opacity: number; contentOpacity: number; backgroundOpacity: number }) => {
    handleOpacityChange(preset.opacity);
    handleContentOpacityChange(preset.contentOpacity);
    handleBackgroundOpacityChange(preset.backgroundOpacity);
  };

  const resetOpacity = () => {
    handleOpacityChange(1);
    handleContentOpacityChange(1);
    handleBackgroundOpacityChange(1);
  };

  const opacityPresets = [
    { label: '轻度', value: { opacity: 0.9, contentOpacity: 1, backgroundOpacity: 0.9 }, desc: '略微透光' },
    { label: '阅读', value: { opacity: 0.7, contentOpacity: 0.95, backgroundOpacity: 0.6 }, desc: '适合专注阅读' },
    { label: '深度', value: { opacity: 0.5, contentOpacity: 0.9, backgroundOpacity: 0.3 }, desc: '深度隐藏' },
  ];

  // 透明度面板内容
  const opacityPanel = (
    <div className="opacity-panel">
      <div className="opacity-presets">
        {opacityPresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            className="opacity-preset-btn"
            onClick={() => applyOpacityPreset(preset.value)}
            title={preset.desc}
          >
            {preset.label}
            <span className="opacity-preset-desc">{preset.desc}</span>
          </button>
        ))}
      </div>
      <div className="opacity-row">
        <span className="opacity-label"><EyeInvisibleOutlined /> 整体透明度</span>
        <Slider
          className="opacity-slider-ant"
          min={0.3}
          max={1}
          step={0.05}
          value={opacity}
          onChange={handleOpacityChange}
          tooltip={{ formatter: (v: number | undefined) => `${Math.round((v ?? 1) * 100)}%` }}
        />
        <span className="opacity-value">{Math.round(opacity * 100)}%</span>
      </div>
      <div className="opacity-row">
        <span className="opacity-label"><BookOutlined /> 内容透明度</span>
        <Slider
          className="opacity-slider-ant"
          min={0.4}
          max={1}
          step={0.05}
          value={contentOpacity}
          onChange={handleContentOpacityChange}
          tooltip={{ formatter: (v: number | undefined) => `${Math.round((v ?? 1) * 100)}%` }}
        />
        <span className="opacity-value">{Math.round(contentOpacity * 100)}%</span>
      </div>
      <div className="opacity-row">
        <span className="opacity-label"><BgColorsOutlined /> 背景板透明度</span>
        <Slider
          className="opacity-slider-ant"
          min={0.15}
          max={1}
          step={0.05}
          value={backgroundOpacity}
          onChange={handleBackgroundOpacityChange}
          tooltip={{ formatter: (v: number | undefined) => `${Math.round((v ?? 1) * 100)}%` }}
        />
        <span className="opacity-value">{Math.round(backgroundOpacity * 100)}%</span>
      </div>
      <div className="opacity-panel-footer">
        <span className="opacity-panel-tip">内容/背景板透明度独立调节，整体透明度作用于整个窗口</span>
        <Button type="link" size="small" onClick={resetOpacity} className="opacity-reset-btn">恢复默认</Button>
      </div>
    </div>
  );

  return (
    <Layout
      className="main-layout"
      style={{
        '--bg-opacity': backgroundOpacity,
      } as React.CSSProperties}
    >
      {/* 收起状态的悬停触发区：鼠标移到左侧边缘时展开侧边栏 */}
      {collapsed && (
        <div
          className="sider-hover-strip"
          onMouseEnter={expandSider}
        >
          <span className="sider-hover-icon"><EyeInvisibleOutlined /></span>
        </div>
      )}

      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        trigger={null}
        className="main-sider"
        width={200}
        collapsedWidth={0}
        onMouseEnter={handleSiderMouseEnter}
        onMouseLeave={handleSiderMouseLeave}
      >
        <div className="logo">
          <span className="logo-mark"><CompassOutlined /></span>
          {!collapsed && <h1>摸金阅读</h1>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={[
            {
              key: '1',
              icon: <HomeOutlined />,
              label: '首页',
              onClick: () => handleMenuClick('1')
            },
            {
              key: '2',
              icon: <BookOutlined />,
              label: '阅读器',
              onClick: () => handleMenuClick('2')
            },
            {
              key: '3',
              icon: <GlobalOutlined />,
              label: '网页浏览',
              onClick: () => handleMenuClick('3')
            },
            {
              key: '4',
              icon: <BookFilled />,
              label: '书签',
              onClick: () => handleMenuClick('4')
            },
            {
              key: '5',
              icon: <SettingOutlined />,
              label: '设置',
              onClick: () => handleMenuClick('5')
            }
          ]}
        />
      </Sider>
      
      <Layout className="site-layout">
        <div className="site-layout-header">
          <Button 
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            className="trigger-button"
          />
          
          <div className="header-actions">
            <Tooltip title="回到主页">
              <Button
                type="text"
                icon={<HomeOutlined />}
                onClick={() => navigate('/')}
                className="home-button"
                aria-label="回到主页"
              />
            </Tooltip>
            <Tooltip title={stealthActive ? '关闭隐蔽模式（鼠标移出自动隐藏）' : '开启隐蔽模式（鼠标移出自动隐藏）'}>
              <Button
                type={stealthActive ? 'primary' : 'text'}
                icon={<EyeInvisibleOutlined />}
                onClick={toggleStealth}
                className="stealth-button"
                aria-label={stealthActive ? '关闭隐蔽模式' : '开启隐蔽模式'}
              />
            </Tooltip>
            <Tooltip title="窗口置顶">
              <Button
                type={alwaysOnTop ? 'primary' : 'text'}
                icon={<PushpinOutlined />}
                onClick={toggleAlwaysOnTop}
                aria-label="窗口置顶"
              />
            </Tooltip>
            <Tooltip title="迷你模式">
              <Button
                type={isMini ? 'primary' : 'text'}
                icon={<ColumnHeightOutlined />}
                onClick={toggleMini}
                aria-label="迷你模式"
              />
            </Tooltip>
            <Tooltip title="PC 宽屏阅读">
              <Button
                type={isWide ? 'primary' : 'text'}
                icon={<ColumnWidthOutlined />}
                onClick={toggleWide}
                aria-label="PC宽屏阅读"
              />
            </Tooltip>

            <Popover
              content={opacityPanel}
              trigger="click"
              placement="bottomRight"
              overlayClassName="opacity-popover"
            >
              <Tooltip title="透明度控制">
                <Button
                  type="text"
                  icon={<BgColorsOutlined />}
                  className="opacity-button"
                  aria-label="透明度控制"
                />
              </Tooltip>
            </Popover>
          </div>
        </div>
        
        <Content className="site-layout-content">
          <div className="content-area" style={{ opacity: contentOpacity }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;