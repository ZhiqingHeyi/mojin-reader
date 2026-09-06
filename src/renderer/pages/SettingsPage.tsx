import React from 'react';
import { Card, Form, Switch, Select, Slider, InputNumber, Divider } from 'antd';
import {
  BgColorsOutlined,
  ReadOutlined,
  EyeInvisibleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { updateSettings } from '../store/slices/appSlice';
import stealthManager from '../utils/stealthManager';
import '../styles/SettingsPage.css';

const FONT_OPTIONS = [
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'KaiTi', label: '楷体' },
  { value: 'FangSong', label: '仿宋' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
];

const ENCODING_OPTIONS = [
  { value: 'auto', label: '自动检测' },
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'gbk', label: 'GBK' },
  { value: 'gb2312', label: 'GB2312' },
  { value: 'big5', label: 'Big5' },
];

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const appSettings = useAppSelector(state => state.app.settings);
  const [stealthSettings, setStealthSettings] = React.useState(stealthManager.getSettings());

  const updateAppSettings = (patch: Partial<typeof appSettings>) => {
    dispatch(updateSettings(patch));
  };

  const updateStealth = (patch: Parameters<typeof stealthManager.updateSettings>[0]) => {
    stealthManager.updateSettings(patch);
    setStealthSettings(stealthManager.getSettings());
  };

  return (
    <div className="settings-page">
      <Card
        title={<span><BgColorsOutlined /> 外观</span>}
        className="settings-card"
      >
        <Form layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
          <Form.Item label="主题">
            <Select
              value={appSettings.theme}
              onChange={value => updateAppSettings({ theme: value })}
              style={{ width: 200 }}
              options={[
                { value: 'light', label: '明亮' },
                { value: 'dark', label: '暗黑' },
                { value: 'system', label: '跟随系统' },
              ]}
            />
          </Form.Item>
          <Form.Item label="默认字体">
            <Select
              value={appSettings.defaultFont}
              onChange={value => updateAppSettings({ defaultFont: value })}
              style={{ width: 200 }}
              options={FONT_OPTIONS}
            />
          </Form.Item>
          <Form.Item label="默认字号">
            <Slider
              min={12}
              max={32}
              value={appSettings.defaultFontSize}
              onChange={value => updateAppSettings({ defaultFontSize: value })}
              style={{ width: 200 }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<span><ReadOutlined /> 阅读</span>}
        className="settings-card"
      >
        <Form layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
          <Form.Item label="TXT 默认编码">
            <Select
              value={appSettings.defaultEncoding}
              onChange={value => updateAppSettings({ defaultEncoding: value })}
              style={{ width: 200 }}
              options={ENCODING_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<span><EyeInvisibleOutlined /> 隐蔽功能</span>}
        className="settings-card"
      >
        <Form layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
          <Form.Item label="老板键 (Alt+Z)">
            <Switch
              checked={stealthSettings.bossKeyEnabled}
              onChange={checked => updateStealth({ bossKeyEnabled: checked })}
            />
          </Form.Item>
          <Form.Item label="鼠标移出隐藏">
            <Switch
              checked={stealthSettings.mouseOutHideEnabled}
              onChange={checked => updateStealth({ mouseOutHideEnabled: checked })}
            />
          </Form.Item>
          <Form.Item label="移出延迟(ms)">
            <InputNumber
              min={100}
              max={5000}
              step={100}
              value={stealthSettings.mouseOutHideDelay}
              onChange={value => updateStealth({ mouseOutHideDelay: value || 500 })}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label="默认透明度">
            <Slider
              min={0.3}
              max={1.0}
              step={0.1}
              value={stealthSettings.opacity}
              onChange={value => updateStealth({ opacity: value })}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item label="窗口置顶">
            <Switch
              checked={stealthSettings.alwaysOnTop}
              onChange={checked => updateStealth({ alwaysOnTop: checked })}
            />
          </Form.Item>
          <Form.Item label="隐藏任务栏图标">
            <Switch
              checked={stealthSettings.hideTaskbarIcon}
              onChange={checked => updateStealth({ hideTaskbarIcon: checked })}
            />
          </Form.Item>
          <Form.Item label="隐藏Dock图标 (macOS)">
            <Switch
              checked={stealthSettings.hideDockIcon}
              onChange={checked => {
                updateStealth({ hideDockIcon: checked });
                if (checked) {
                  window.electron.hideDock();
                }
              }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={<span><SettingOutlined /> 其他</span>}
        className="settings-card"
      >
        <Form layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 14 }}>
          <Form.Item label="启动时打开上次文件">
            <Switch
              checked={appSettings.openLastFileOnStartup}
              onChange={checked => updateAppSettings({ openLastFileOnStartup: checked })}
            />
          </Form.Item>
          <Form.Item label="自动检查更新">
            <Switch
              checked={appSettings.autoCheckUpdate}
              onChange={checked => updateAppSettings({ autoCheckUpdate: checked })}
            />
          </Form.Item>
        </Form>
      </Card>

      <Divider plain>设置会自动保存</Divider>
    </div>
  );
};

export default SettingsPage;
