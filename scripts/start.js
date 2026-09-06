/**
 * 摸金阅读启动脚本
 * 用于在开发环境中快速启动项目
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..');

// 检查node_modules是否存在
if (!fs.existsSync(path.join(rootDir, 'node_modules'))) {
  console.log('📦 正在安装依赖...');
  
  // 根据操作系统选择合适的命令
  const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  
  // 执行npm install
  const installProcess = spawn(npmCmd, ['install'], { cwd: rootDir, stdio: 'inherit' });
  
  installProcess.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ 依赖安装失败，请手动执行 npm install');
      process.exit(1);
    }
    
    console.log('✅ 依赖安装完成');
    startDev();
  });
} else {
  startDev();
}

// 启动开发环境
function startDev() {
  console.log('🚀 正在启动摸金阅读开发环境...');
  
  // 根据操作系统选择合适的命令
  const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
  
  // 执行npm run dev
  const devProcess = spawn(npmCmd, ['run', 'dev'], { cwd: rootDir, stdio: 'inherit' });
  
  devProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ 开发环境启动失败，退出码: ${code}`);
      process.exit(code);
    }
  });
  
  // 监听Ctrl+C信号
  process.on('SIGINT', () => {
    console.log('👋 正在关闭摸金阅读开发环境...');
    devProcess.kill('SIGINT');
    process.exit(0);
  });
}