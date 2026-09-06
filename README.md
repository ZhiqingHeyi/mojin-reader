# 摸金阅读 (Mojin Reader)

<p align="center">
  <img src="build/icons/icon.png" width="128" height="128" alt="Mojin Reader Logo" style="border-radius: 24px;">
</p>

<p align="center">
  <strong>专为办公与极客场景打造的轻量级隐蔽桌面阅读器</strong><br>
  从容阅读，大隐于市。支持多层分级透明、鼠标移出 0 虚影遁形与毫秒级全局老板键。
</p>

<p align="center">
  <a href="https://mojin-reader.vercel.app" target="_blank">🌐 访问官方网站 & 在线体验</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Electron-25.x-47848F.svg?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20麒麟%20%7C%20UOS-C9A96E.svg" alt="Platforms">
</p>

---

## ✨ 核心特性

- 🪟 **三档分层独立透明度**：
  - **窗口整体透明度**（原生 GPU 加速无级调节）；
  - **背景板透明度**（最低可调至 15% 或纯透，将文字自然融合于 IDE、终端或文档背景中）；
  - **内容字体透明度**（独立灰阶，柔和隐匿）。
- 👁️ **鼠标移出 0 虚影瞬态隐藏**：开启隐蔽模式后，鼠标离开应用视窗即刻彻底隐形（0 残影），鼠标重新移入顺滑恢复。
- ⚡ **全局系统级老板键（`Alt + Z`）**：无论当前焦点位于何处，毫秒级隐藏或唤醒窗口。
- 📚 **全格式专业排版引擎**：支持 `TXT`、`EPUB`、`PDF`，自动记忆阅读进度、支持章节目录解析与快速书签。
- 🌐 **隐蔽内嵌式网页浏览**：工作视窗内无痕检索资讯与文档，支持多 Tab 与预置摸鱼/技术社区。
- 🖥️ **全平台跨端与国产系统适配**：完整适配 macOS、Windows 以及 **统信 UOS、银河麒麟、Ubuntu** 等 Linux 发行版。

---

## 🛠️ 技术架构

- **桌面框架**：Electron 25 + TypeScript
- **界面视图**：React 18 + Ant Design 5 (暗金定制主题)
- **状态管理**：Redux Toolkit
- **构建工具**：Webpack 5 (分离主进程与渲染进程独立编译)
- **文档解析**：`pdfjs-dist`、`epubjs`、自定义高性能流式 TXT 分页引擎

---

## 🚀 本地开发与构建

### 1. 克隆仓库与安装依赖

```bash
git clone https://github.com/ZhiqingHeyi/mojin-reader.git
cd mojin-reader
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

### 3. 代码检查与验证

```bash
npm run lint
```

---

## 📦 多端打包

项目已配置跨平台与国产操作系统打包矩阵：

```bash
# 构建 macOS 安装包 (.dmg / .zip，包含 Apple Silicon 与 Intel 架构)
npm run dist:mac

# 构建 Windows 安装包 (.exe 安装器与便携式 .zip)
npm run dist:win

# 构建 Linux / 国产麒麟 / 统信 UOS 安装包 (.deb / .rpm / .AppImage / .tar.gz)
npm run dist:linux

# 一键构建全平台安装包
npm run dist:all
```

---

## 🤝 参与贡献

欢迎提交 Issue 与 Pull Request！
1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 开源许可证

本项目基于 [MIT 许可证](LICENSE) 开源。
