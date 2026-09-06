import type { ThemeConfig } from 'antd';
import { theme as antdTheme } from 'antd';

// 摸金·古卷 主题配色
export const gold = {
  bright: '#E9CE8C',
  base: '#C9A96E',
  deep: '#A07F45',
  dark: '#7C6135',
};

export const darkPalette = {
  bgDeep: '#14100B',
  bg: '#1B1610',
  panel: '#241D14',
  raised: '#2D251A',
  line: '#3B3123',
  textHigh: '#F2E9D8',
  text: '#D8CCB8',
  textDim: '#9A8C77',
};

export const lightPalette = {
  bgDeep: '#EDE2CA',
  bg: '#F5EEDD',
  panel: '#FBF6EA',
  raised: '#FFFDF6',
  line: '#E4D9C3',
  textHigh: '#241E12',
  text: '#3A3226',
  textDim: '#7A6F5E',
};

export const buildTheme = (isDark: boolean): ThemeConfig => {
  const palette = isDark ? darkPalette : lightPalette;
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: gold.base,
      colorInfo: gold.base,
      colorSuccess: '#8FAE6B',
      colorWarning: '#D9A441',
      colorError: '#C4553F',
      colorTextBase: palette.textHigh,
      colorBgBase: palette.bg,
      colorBgContainer: palette.panel,
      colorBgElevated: palette.raised,
      colorBorder: palette.line,
      colorBorderSecondary: palette.line,
      colorSplit: palette.line,
      borderRadius: 10,
      borderRadiusLG: 14,
      borderRadiusSM: 8,
      fontSize: 14,
      fontFamily:
        "'PingFang SC','Microsoft YaHei','Noto Sans CJK SC',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
    },
    components: {
      Button: {
        colorPrimary: gold.base,
        colorPrimaryHover: gold.bright,
        colorPrimaryActive: gold.deep,
        primaryColor: '#241A0C',
        controlHeight: 34,
        borderRadius: 8,
      },
      Menu: {
        itemHeight: 44,
        itemSelectedBg: 'rgba(201,169,110,0.16)',
        itemSelectedColor: isDark ? gold.bright : gold.deep,
        itemHoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,97,53,0.08)',
        itemBorderRadius: 8,
        darkItemBg: 'transparent',
        darkSubMenuItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(201,169,110,0.18)',
        darkItemSelectedColor: gold.bright,
        darkItemHoverBg: 'rgba(255,255,255,0.07)',
        darkItemColor: palette.textDim,
      },
      Card: {
        headerBg: 'transparent',
        headerFontSize: 16,
        boxShadowTertiary: '0 8px 24px rgba(0,0,0,0.10)',
      },
      Tabs: {
        inkBarColor: gold.base,
        itemSelectedColor: isDark ? gold.bright : gold.deep,
        itemColor: palette.textDim,
        itemHoverColor: gold.base,
        titleFontSize: 14,
      },
      List: {
        colorSplit: palette.line,
      },
      Input: {
        colorBgContainer: palette.raised,
        colorBorder: palette.line,
        activeBorderColor: gold.base,
        hoverBorderColor: gold.deep,
        activeShadow: '0 0 0 2px rgba(201,169,110,0.18)',
      },
      InputNumber: {
        colorBgContainer: palette.raised,
        colorBorder: palette.line,
        activeBorderColor: gold.base,
        hoverBorderColor: gold.deep,
      },
      Select: {
        colorBgContainer: palette.raised,
        colorBorder: palette.line,
        optionSelectedBg: 'rgba(201,169,110,0.18)',
        optionSelectedColor: isDark ? gold.bright : gold.deep,
      },
      Switch: {
        colorPrimary: gold.base,
        trackHeight: 22,
      },
      Slider: {
        trackBg: gold.base,
        trackHoverBg: gold.bright,
        handleColor: gold.base,
        handleActiveColor: gold.bright,
        railBg: palette.line,
        railHoverBg: palette.textDim,
      },
      Tag: {
        defaultBg: palette.raised,
        defaultColor: palette.text,
      },
      Drawer: {
        colorBgElevated: palette.raised,
      },
      Modal: {
        colorBgElevated: palette.raised,
      },
      Empty: {
        colorTextDescription: palette.textDim,
      },
      Message: {
        contentBg: palette.raised,
      },
      Tooltip: {
        colorBgSpotlight: isDark ? '#3B3123' : '#4A3F2C',
      },
    },
  };
};
