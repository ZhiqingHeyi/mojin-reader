/**
 * 摸金阅读构建脚本
 * 用于在生产环境中构建和打包项目
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..');

// 检查构建目录
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  console.log('🧹 清理旧的构建文件...');
  fs.rmSync(distDir, { recursive: true, force: true });
}

// 检查发布目录
const releaseDir = path.join(rootDir, 'release');
if (fs.existsSync(releaseDir)) {
  console.log('🧹 清理旧的发布文件...');
  fs.rmSync(releaseDir, { recursive: true, force: true });
}

// 根据操作系统选择合适的命令
const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';

// 构建应用
console.log('🏗️ 开始构建摸金阅读应用...');
console.log('📦 第1步：构建主进程和渲染进程...');

const buildProcess = spawn(npmCmd, ['run', 'build'], { cwd: rootDir, stdio: 'inherit' });

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ 构建失败，退出码: ${code}`);
    process.exit(code);
  }
  
  console.log('✅ 构建完成');
  console.log('📦 第2步：打包应用...');
  
  const packProcess = spawn(npmCmd, ['run', 'dist'], { cwd: rootDir, stdio: 'inherit' });
  
  packProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ 打包失败，退出码: ${code}`);
      process.exit(code);
    }
    
    console.log('✅ 打包完成');
    console.log('🎉 摸金阅读应用构建和打包成功！');
    console.log(`📁 安装包位置: ${path.join(rootDir, 'release')}`);
  });
});

// 监听Ctrl+C信号
process.on('SIGINT', () => {
  console.log('👋 正在取消构建过程...');
  process.exit(0);
});