// <webview> 标签的 JSX 类型声明（Electron 内置元素，React 不自带）
declare namespace JSX {
  interface IntrinsicElements {
    webview: any;
  }
}
