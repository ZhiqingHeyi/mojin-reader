/**
 * 摸金阅读运行脚本
 * 用于在命令行中快速启动项目
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..');

// 检查dist目录是否存在
const distDir = path.join(rootDir, 'dist');
if (!fs.existsSync(distDir) || !fs.existsSync(path.join(distDir, 'main', 'index.js'))) {
  console.log('📦 项目尚未构建，正在构建...');
  
  // 根据操作系统选择合适的命令
  const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  
  // 执行npm run build
  const buildProcess = spawn(npmCmd, ['run', 'build'], { cwd: rootDir, stdio: 'inherit' });
  
  buildProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ 构建失败，请手动执行 npm run build');
      process.exit(1);
    }
    
    console.log('✅ 构建完成');
    startApp();
  });
} else {
  startApp();
}

// 启动应用
function startApp() {
  console.log('🚀 正在启动摸金阅读...');
  
  // 根据操作系统选择合适的命令
  const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  
  // 执行npm start
  const startProcess = spawn(npmCmd, ['start'], { cwd: rootDir, stdio: 'inherit' });
  
  startProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ 应用启动失败，退出码: ${code}`);
      process.exit(code);
    }
  });
  
  // 监听Ctrl+C信号
  process.on('SIGINT', () => {
    console.log('👋 正在关闭摸金阅读...');
    startProcess.kill('SIGINT');
    process.exit(0);
  });
}