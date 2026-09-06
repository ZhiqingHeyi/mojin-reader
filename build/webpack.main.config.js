const path = require('path');
const fs = require('fs');

// 构建完成后把项目根目录 assets/ 复制到 dist/assets/，供托盘/窗口图标运行时加载
class CopyAssetsPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tap('CopyAssetsPlugin', () => {
      const src = path.resolve(__dirname, '../assets');
      const dest = path.resolve(__dirname, '../dist/assets');
      if (!fs.existsSync(src)) return;
      fs.mkdirSync(dest, { recursive: true });
      for (const file of fs.readdirSync(src)) {
        const from = path.join(src, file);
        if (fs.statSync(from).isFile()) {
          fs.copyFileSync(from, path.join(dest, file));
        }
      }
      console.log('[CopyAssetsPlugin] 已复制 assets/ -> dist/assets/');
    });
  }
}

module.exports = {
  target: 'electron-main',
  entry: {
    index: './src/main/index.ts',
    preload: './src/main/preload.ts',
  },
  output: {
    path: path.resolve(__dirname, '../dist/main'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  externals: {
    electron: 'commonjs electron',
  },
  plugins: [new CopyAssetsPlugin()],
};