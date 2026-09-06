import { ipcMain, dialog, shell } from 'electron';
import * as fs from 'fs';
import Store from 'electron-store';
import iconv from 'iconv-lite';
import { detect as detectCharset } from 'jschardet';
import windowManager from './window';
import {
  IPC,
  ReadTextResult,
  FileInfoResult,
  WindowStateResult,
  OpenFileDialogResult,
} from '../shared/ipc';

interface StoreSchema {
  settings: Record<string, unknown>;
}

// 用户设置持久化（electron-store，存于用户数据目录）
const store = new Store<StoreSchema>({
  defaults: { settings: {} },
});

const SUPPORTED_EXTENSIONS = ['txt', 'pdf', 'epub'];

// jschardet 检测结果 → iconv-lite 编码名映射
const ENCODING_MAP: Record<string, string> = {
  ascii: 'ascii',
  'UTF-8': 'utf-8',
  GB2312: 'gbk', // GBK 是 GB2312 超集，解码更安全
  GB18030: 'gb18030',
  Big5: 'big5',
  'Shift_JIS': 'shiftjis',
  'EUC-JP': 'eucjp',
  'EUC-KR': 'euckr',
  'windows-1252': 'windows-1252',
  'windows-1251': 'windows-1251',
  'ISO-8859-1': 'iso-8859-1',
  'ISO-8859-2': 'iso-8859-2',
  'UTF-16LE': 'utf-16le',
  'UTF-16BE': 'utf-16be',
};

/**
 * 基于 BOM、jschardet 统计与字节特征检测文本编码
 */
function detectEncoding(buffer: Buffer): string {
  // BOM 检测（对 UTF-16/32 最可靠）
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return 'utf-8';
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xfe && buffer[2] === 0x00 && buffer[3] === 0x00) {
    return 'utf-32le';
  }
  if (buffer.length >= 4 && buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0xfe && buffer[3] === 0xff) {
    return 'utf-32be';
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return 'utf-16le';
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return 'utf-16be';
  }

  // jschardet 统计检测（对 GBK/GB2312/Big5/Shift-JIS/EUC 等效果优于手写启发）
  try {
    const sample = buffer.subarray(0, Math.min(buffer.length, 65536));
    const result = detectCharset(sample);
    if (result && result.confidence >= 0.5) {
      const mapped = ENCODING_MAP[result.encoding] || result.encoding.toLowerCase();
      if (iconv.encodingExists(mapped)) {
        return mapped;
      }
    }
  } catch (error) {
    console.warn('jschardet 检测失败，回退到手写启发式:', error);
  }

  // 兜底：手写启发式
  const sampleLen = Math.min(buffer.length, 2000);
  let utf8Count = 0;
  let gbkCount = 0;
  let asciiCount = 0;

  for (let i = 0; i < sampleLen; i++) {
    const byte = buffer[i];
    if (byte < 0x80) {
      asciiCount++;
    } else if (byte >= 0xc0 && byte <= 0xdf && i + 1 < sampleLen) {
      const next = buffer[i + 1];
      if (next >= 0x80 && next <= 0xbf) {
        utf8Count++;
        i++;
      }
    } else if (byte >= 0xe0 && byte <= 0xef && i + 2 < sampleLen) {
      const n1 = buffer[i + 1];
      const n2 = buffer[i + 2];
      if (n1 >= 0x80 && n1 <= 0xbf && n2 >= 0x80 && n2 <= 0xbf) {
        utf8Count++;
        i += 2;
      }
    } else if (byte >= 0xa1 && byte <= 0xfe && i + 1 < sampleLen) {
      const next = buffer[i + 1];
      if (next >= 0xa1 && next <= 0xfe) {
        gbkCount++;
        i++;
      }
    }
  }

  const total = Math.max(1, sampleLen);
  if (asciiCount / total > 0.9) return 'ascii';
  if (utf8Count > gbkCount && utf8Count / total > 0.1) return 'utf-8';
  if (gbkCount / total > 0.1) return 'gbk';
  return 'utf-8';
}

/**
 * 读取文本文件，支持指定编码或自动检测
 */
function readTextFile(filePath: string, encoding?: string): ReadTextResult {
  try {
    const buffer = fs.readFileSync(filePath);
    const enc = encoding || detectEncoding(buffer);
    // iconv-lite 统一解码（支持 utf-8/utf-16/gbk/gb2312/big5 等）
    const content = iconv.decode(buffer, enc);
    return { content, encoding: enc, success: true };
  } catch (error) {
    return {
      content: '',
      encoding: encoding || 'utf-8',
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 读取文件为 ArrayBuffer（供 PDF.js / epub.js 使用）
 */
function readFileBuffer(filePath: string): ArrayBuffer | null {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  } catch (error) {
    console.error('读取文件失败:', filePath, error);
    return null;
  }
}

function getFileInfo(filePath: string): FileInfoResult {
  try {
    const stats = fs.statSync(filePath);
    const name = filePath.split(/[\\/]/).pop() || filePath;
    const ext = name.includes('.') ? name.substring(name.lastIndexOf('.') + 1).toLowerCase() : '';
    return {
      name,
      size: stats.size,
      extension: ext,
      lastModified: stats.mtimeMs,
      isReadable: true,
    };
  } catch (error) {
    console.error('获取文件信息失败:', filePath, error);
    return {
      name: filePath.split(/[\\/]/).pop() || filePath,
      size: 0,
      extension: '',
      lastModified: 0,
      isReadable: false,
    };
  }
}

export function registerIpcHandlers(): void {
  // ---- 窗口控制（send）----
  ipcMain.on(IPC.WindowHide, () => windowManager.hide());
  ipcMain.on(IPC.WindowShow, () => windowManager.show());
  ipcMain.on(IPC.WindowMinimize, () => windowManager.minimize());
  ipcMain.on(IPC.WindowSetOpacity, (_event, opacity: number) => {
    // 限制在 0 ~ 1 范围，0 为完全透明
    const validOpacity = Math.max(0, Math.min(1, opacity));
    windowManager.setOpacity(validOpacity);
  });
  ipcMain.on(IPC.WindowSetAlwaysOnTop, (_event, flag: boolean) => {
    windowManager.setAlwaysOnTop(flag);
  });
  ipcMain.on(IPC.WindowSetSkipTaskbar, (_event, flag: boolean) => {
    windowManager.setSkipTaskbar(flag);
  });
  ipcMain.on(IPC.WindowToggleMini, () => windowManager.toggleMini());
  ipcMain.on(IPC.WindowToggleWide, () => windowManager.toggleWide());
  ipcMain.on(IPC.WindowToggleMaximize, () => windowManager.toggleMaximize());
  ipcMain.on(IPC.WindowHideDock, () => windowManager.hideDock());

  // ---- 窗口状态查询（invoke）----
  ipcMain.handle(IPC.WindowGetState, (): WindowStateResult | null => windowManager.getState());

  // ---- 文件系统（invoke）----
  ipcMain.handle(IPC.DialogOpenFile, async (): Promise<OpenFileDialogResult> => {
    const win = windowManager.getWindow();
    const result = await dialog.showOpenDialog(win!, {
      title: '打开文件',
      properties: ['openFile'],
      filters: [
        { name: '文档', extensions: SUPPORTED_EXTENSIONS },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }
    return { canceled: false, filePath: result.filePaths[0] };
  });

  ipcMain.handle(IPC.FileReadText, (_event, filePath: string, encoding?: string): ReadTextResult => {
    return readTextFile(filePath, encoding);
  });

  ipcMain.handle(IPC.FileReadBuffer, (_event, filePath: string): ArrayBuffer | null => {
    return readFileBuffer(filePath);
  });

  ipcMain.handle(IPC.FileGetInfo, (_event, filePath: string): FileInfoResult => {
    return getFileInfo(filePath);
  });

  // ---- 设置持久化（invoke）----
  ipcMain.handle(IPC.SettingsGet, () => store.get('settings'));
  ipcMain.handle(IPC.SettingsSet, (_event, key: string, value: unknown) => {
    store.set(`settings.${key}`, value);
  });

  // ---- 系统能力（invoke）----
  ipcMain.handle(IPC.ShellOpenExternal, (_event, url: string) => {
    return shell.openExternal(url);
  });
}

export { store as settingsStore };
