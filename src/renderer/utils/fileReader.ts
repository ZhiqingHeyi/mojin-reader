// 文件读取和编码检测工具

export interface FileReadResult {
  content: string;
  encoding: string;
  success: boolean;
  error?: string;
}

export interface EncodingDetectionResult {
  encoding: string;
  confidence: number;
}

/**
 * 检测文本编码格式
 */
export function detectEncoding(buffer: ArrayBuffer): EncodingDetectionResult {
  const bytes = new Uint8Array(buffer);
  
  // 检查BOM标记
  if (bytes.length >= 3) {
    // UTF-8 BOM
    if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      return { encoding: 'utf-8', confidence: 1.0 };
    }
  }
  
  if (bytes.length >= 2) {
    // UTF-16 LE BOM
    if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return { encoding: 'utf-16le', confidence: 1.0 };
    }
    // UTF-16 BE BOM
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return { encoding: 'utf-16be', confidence: 1.0 };
    }
  }
  
  // 统计字节特征
  let asciiCount = 0;
  let utf8Count = 0;
  let gbkCount = 0;
  
  for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
    const byte = bytes[i];
    
    // ASCII字符
    if (byte < 128) {
      asciiCount++;
    }
    // 可能的UTF-8序列
    else if (byte >= 0xC0 && byte <= 0xDF && i + 1 < bytes.length) {
      const next = bytes[i + 1];
      if (next >= 0x80 && next <= 0xBF) {
        utf8Count++;
        i++; // 跳过下一个字节
      }
    }
    // 可能的GBK字符
    else if (byte >= 0xA1 && byte <= 0xFE && i + 1 < bytes.length) {
      const next = bytes[i + 1];
      if (next >= 0xA1 && next <= 0xFE) {
        gbkCount++;
        i++; // 跳过下一个字节
      }
    }
  }
  
  const total = Math.min(bytes.length, 1000);
  const utf8Ratio = utf8Count / total;
  const gbkRatio = gbkCount / total;
  const asciiRatio = asciiCount / total;
  
  // 判断编码
  if (asciiRatio > 0.9) {
    return { encoding: 'ascii', confidence: asciiRatio };
  } else if (utf8Ratio > gbkRatio && utf8Ratio > 0.1) {
    return { encoding: 'utf-8', confidence: utf8Ratio };
  } else if (gbkRatio > 0.1) {
    return { encoding: 'gbk', confidence: gbkRatio };
  } else {
    return { encoding: 'utf-8', confidence: 0.5 }; // 默认UTF-8
  }
}

/**
 * 使用指定编码读取文本文件
 */
export function decodeText(buffer: ArrayBuffer, encoding: string): string {
  try {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(buffer);
  } catch (error) {
    console.warn(`解码失败，编码: ${encoding}`, error);
    // 回退到UTF-8
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } catch (fallbackError) {
      console.error('UTF-8解码也失败', fallbackError);
      return '';
    }
  }
}

/**
 * 读取文本文件并自动检测编码（通过主进程 IPC 读取，渲染进程无法直接访问文件系统）
 */
export async function readTextFile(filePath: string): Promise<FileReadResult> {
  try {
    const result = await window.electron.readTextFile(filePath);
    return {
      content: result.content,
      encoding: result.encoding,
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    console.error('读取文件失败:', error);
    return {
      content: '',
      encoding: 'unknown',
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 使用指定编码重新读取文件（通过主进程 IPC）
 */
export async function readTextFileWithEncoding(
  filePath: string,
  encoding: string
): Promise<FileReadResult> {
  try {
    const result = await window.electron.readTextFile(filePath, encoding);
    return {
      content: result.content,
      encoding: result.encoding,
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    console.error('读取文件失败:', error);
    return {
      content: '',
      encoding,
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

/**
 * 验证文本内容是否包含乱码
 */
export function hasGarbledText(text: string): boolean {
  // 检查是否包含大量的替换字符
  const replacementCharCount = (text.match(/�/g) || []).length;
  const replacementRatio = replacementCharCount / text.length;
  
  if (replacementRatio > 0.01) { // 超过1%的替换字符
    return true;
  }
  
  let controlCharacterCount = 0;
  let uncommonCharacterCount = 0;
  for (const character of text) {
    const code = character.charCodeAt(0);
    if ((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127) {
      controlCharacterCount += 1;
    } else if (code > 127 && !(code >= 0x3400 && code <= 0x4dbf) && !(code >= 0x4e00 && code <= 0x9fff) && !(code >= 0xff00 && code <= 0xffef) && !(code >= 0x0100 && code <= 0x024f)) {
      uncommonCharacterCount += 1;
    }
  }
  if (controlCharacterCount > text.length * 0.05 || uncommonCharacterCount > text.length * 0.05) {
    return true;
  }
  
  return false;
}

/**
 * 获取支持的编码列表
 */
export function getSupportedEncodings(): Array<{value: string, label: string}> {
  return [
    { value: 'utf-8', label: 'UTF-8' },
    { value: 'gbk', label: 'GBK' },
    { value: 'gb2312', label: 'GB2312' },
    { value: 'big5', label: 'Big5' },
    { value: 'utf-16le', label: 'UTF-16 LE' },
    { value: 'utf-16be', label: 'UTF-16 BE' },
    { value: 'iso-8859-1', label: 'ISO-8859-1' },
    { value: 'windows-1252', label: 'Windows-1252' },
    { value: 'ascii', label: 'ASCII' }
  ];
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件信息（通过主进程 IPC）
 */
export async function getFileInfo(filePath: string): Promise<{
  name: string;
  size: number;
  extension: string;
  lastModified: Date;
  isReadable: boolean;
}> {
  try {
    const info = await window.electron.getFileInfo(filePath);
    return {
      name: info.name,
      size: info.size,
      extension: info.extension,
      lastModified: new Date(info.lastModified),
      isReadable: info.isReadable,
    };
  } catch (error) {
    console.error('获取文件信息失败:', error);
    return {
      name: '',
      size: 0,
      extension: '',
      lastModified: new Date(),
      isReadable: false,
    };
  }
}

/**
 * 清理文本内容
 */
export function cleanTextContent(text: string): string {
  return text
    // 移除BOM标记
    .replace(/^\uFEFF/, '')
    // 统一换行符
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 移除多余的空白字符
    .replace(/[ \t]+$/gm, '') // 行尾空白
    .replace(/\n{3,}/g, '\n\n') // 多个连续换行
    // 移除零宽字符
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

/**
 * 分割文本为段落
 */
export function splitTextIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/) // 按空行分割
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
}

/**
 * 估算阅读时间（分钟）
 */
export function estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
  // 中文按字符计算，英文按单词计算
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  
  // 中文阅读速度通常比英文慢
  const totalWords = chineseChars * 0.5 + englishWords;
  
  return Math.ceil(totalWords / wordsPerMinute);
}