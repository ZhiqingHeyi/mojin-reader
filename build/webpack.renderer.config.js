const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  target: 'electron-renderer',
  // 关闭 node 内置模块的外部化（默认会把 fs/http 等原样 require 到渲染进程），
  // 改用下方 resolve.fallback 的浏览器实现或空实现，避免运行时 require is not defined。
  externalsPresets: { node: false },
  node: {
    __dirname: false,
    __filename: false,
    global: true
  },
  entry: './src/renderer/index.tsx',
  output: {
    path: path.resolve(__dirname, '../dist/renderer'),
    filename: 'bundle.js',
    assetModuleFilename: 'assets/[hash][ext][query]',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, '../src/renderer'),
    },
    fallback: {
      buffer: require.resolve('buffer/'),
      fs: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
    }),
    new webpack.DefinePlugin({
      global: 'window',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
      global: 'global'
    }),
    new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
      const mod = resource.request.replace(/^node:/, "");
      switch (mod) {
        case 'buffer':
          resource.request = 'buffer';
          break;
        case 'process':
          resource.request = 'process/browser';
          break;
        case 'util':
          resource.request = 'util';
          break;
        default:
          throw new Error(`Not found ${mod}`);
      }
    })
  ],
  devServer: {
    host: 'localhost',
    port: 3000,
    hot: false,
    liveReload: false,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, '../public'),
    },
    devMiddleware: {
      publicPath: '/',
      writeToDisk: false
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    client: false
  },
  node: {
    __dirname: false,
    __filename: false,
    global: true
  },
  externals: {
    electron: 'commonjs electron',
  },
};