/**
 * 摸金阅读测试脚本
 * 用于测试项目的基本功能
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 获取项目根目录
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 摸金阅读功能测试');
console.log('======================');

// 测试项目结构
function testProjectStructure() {
  console.log('\n📁 测试项目结构...');
  
  const requiredDirs = [
    'src/main',
    'src/renderer',
    'src/renderer/components',
    'src/renderer/pages',
    'src/renderer/store',
    'src/renderer/styles',
    'build',
    'public'
  ];
  
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'src/main/index.ts',
    'src/renderer/index.tsx',
    'src/renderer/App.tsx',
    'public/index.html'
  ];
  
  let allDirsExist = true;
  let allFilesExist = true;
  
  // 检查目录
  for (const dir of requiredDirs) {
    const dirPath = path.join(rootDir, dir);
    const exists = fs.existsSync(dirPath);
    console.log(`${exists ? '✅' : '❌'} ${dir}`);
    if (!exists) allDirsExist = false;
  }
  
  // 检查文件
  for (const file of requiredFiles) {
    const filePath = path.join(rootDir, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
  }
  
  return { allDirsExist, allFilesExist };
}

// 测试依赖安装
function testDependencies() {
  console.log('\n📦 测试依赖安装...');
  
  const nodeModulesPath = path.join(rootDir, 'node_modules');
  const nodeModulesExist = fs.existsSync(nodeModulesPath);
  
  console.log(`${nodeModulesExist ? '✅' : '❌'} node_modules 目录`);
  
  // 检查核心依赖
  const requiredDeps = [
    'react',
    'react-dom',
    'electron',
    '@reduxjs/toolkit',
    'antd',
    'typescript'
  ];
  
  let allDepsExist = true;
  
  for (const dep of requiredDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    const exists = fs.existsSync(depPath);
    console.log(`${exists ? '✅' : '❌'} ${dep}`);
    if (!exists) allDepsExist = false;
  }
  
  return { nodeModulesExist, allDepsExist };
}

// 测试TypeScript配置
function testTypeScript() {
  console.log('\n🔧 测试TypeScript配置...');
  
  const tsconfigPath = path.join(rootDir, 'tsconfig.json');
  const tsconfigExists = fs.existsSync(tsconfigPath);
  
  console.log(`${tsconfigExists ? '✅' : '❌'} tsconfig.json`);
  
  if (tsconfigExists) {
    try {
      const tsconfig = require(tsconfigPath);
      const hasJsxConfig = tsconfig.compilerOptions && tsconfig.compilerOptions.jsx;
      console.log(`${hasJsxConfig ? '✅' : '❌'} JSX配置`);
      
      return { tsconfigExists, hasJsxConfig };
    } catch (err) {
      console.log('❌ tsconfig.json 解析失败');
      return { tsconfigExists, hasJsxConfig: false };
    }
  }
  
  return { tsconfigExists, hasJsxConfig: false };
}

// 测试Webpack配置
function testWebpack() {
  console.log('\n⚙️ 测试Webpack配置...');
  
  const mainConfigPath = path.join(rootDir, 'build', 'webpack.main.config.js');
  const rendererConfigPath = path.join(rootDir, 'build', 'webpack.renderer.config.js');
  
  const mainConfigExists = fs.existsSync(mainConfigPath);
  const rendererConfigExists = fs.existsSync(rendererConfigPath);
  
  console.log(`${mainConfigExists ? '✅' : '❌'} webpack.main.config.js`);
  console.log(`${rendererConfigExists ? '✅' : '❌'} webpack.renderer.config.js`);
  
  return { mainConfigExists, rendererConfigExists };
}

// 测试阅读器组件
function testReaderComponents() {
  console.log('\n📚 测试阅读器组件...');
  
  const components = [
    'src/renderer/components/Reader/TxtReader.tsx',
    'src/renderer/components/Reader/PdfReader.tsx',
    'src/renderer/components/Reader/EpubReader.tsx',
    'src/renderer/components/WebView/WebBrowser.tsx'
  ];
  
  let allComponentsExist = true;
  
  for (const component of components) {
    const componentPath = path.join(rootDir, component);
    const exists = fs.existsSync(componentPath);
    console.log(`${exists ? '✅' : '❌'} ${component}`);
    if (!exists) allComponentsExist = false;
  }
  
  return { allComponentsExist };
}

// 测试页面组件
function testPageComponents() {
  console.log('\n📄 测试页面组件...');
  
  const pages = [
    'src/renderer/pages/HomePage.tsx',
    'src/renderer/pages/ReaderPage.tsx',
    'src/renderer/pages/WebViewPage.tsx',
    'src/renderer/pages/SettingsPage.tsx',
    'src/renderer/pages/BookmarksPage.tsx'
  ];
  
  let allPagesExist = true;
  
  for (const page of pages) {
    const pagePath = path.join(rootDir, page);
    const exists = fs.existsSync(pagePath);
    console.log(`${exists ? '✅' : '❌'} ${page}`);
    if (!exists) allPagesExist = false;
  }
  
  return { allPagesExist };
}

// 测试Redux状态管理
function testRedux() {
  console.log('\n🔄 测试Redux状态管理...');
  
  const reduxFiles = [
    'src/renderer/store/index.ts',
    'src/renderer/store/slices/appSlice.ts',
    'src/renderer/store/slices/readerSlice.ts',
    'src/renderer/store/slices/webViewSlice.ts',
    'src/renderer/store/slices/bookmarkSlice.ts'
  ];
  
  let allReduxFilesExist = true;
  
  for (const file of reduxFiles) {
    const filePath = path.join(rootDir, file);
    const exists = fs.existsSync(filePath);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allReduxFilesExist = false;
  }
  
  return { allReduxFilesExist };
}

// 运行所有测试
function runAllTests() {
  const structureResult = testProjectStructure();
  const dependenciesResult = testDependencies();
  const typeScriptResult = testTypeScript();
  const webpackResult = testWebpack();
  const readerComponentsResult = testReaderComponents();
  const pageComponentsResult = testPageComponents();
  const reduxResult = testRedux();
  
  console.log('\n📋 测试结果总结:');
  console.log(`项目结构: ${structureResult.allDirsExist && structureResult.allFilesExist ? '✅' : '❌'}`);
  console.log(`依赖安装: ${dependenciesResult.nodeModulesExist && dependenciesResult.allDepsExist ? '✅' : '❌'}`);
  console.log(`TypeScript: ${typeScriptResult.tsconfigExists && typeScriptResult.hasJsxConfig ? '✅' : '❌'}`);
  console.log(`Webpack: ${webpackResult.mainConfigExists && webpackResult.rendererConfigExists ? '✅' : '❌'}`);
  console.log(`阅读器组件: ${readerComponentsResult.allComponentsExist ? '✅' : '❌'}`);
  console.log(`页面组件: ${pageComponentsResult.allPagesExist ? '✅' : '❌'}`);
  console.log(`Redux状态管理: ${reduxResult.allReduxFilesExist ? '✅' : '❌'}`);
  
  const allTestsPassed = 
    structureResult.allDirsExist && 
    structureResult.allFilesExist && 
    dependenciesResult.nodeModulesExist && 
    dependenciesResult.allDepsExist && 
    typeScriptResult.tsconfigExists && 
    typeScriptResult.hasJsxConfig && 
    webpackResult.mainConfigExists && 
    webpackResult.rendererConfigExists && 
    readerComponentsResult.allComponentsExist && 
    pageComponentsResult.allPagesExist && 
    reduxResult.allReduxFilesExist;
  
  console.log(`\n${allTestsPassed ? '✅ 所有测试通过！' : '❌ 部分测试未通过，请检查上述问题'}`);
  
  if (!allTestsPassed) {
    console.log('\n⚠️ 建议修复上述问题后再启动项目');
  } else {
    console.log('\n🚀 项目已准备就绪，可以使用以下命令启动:');
    console.log('npm run dev');
  }
}

// 执行测试
runAllTests();