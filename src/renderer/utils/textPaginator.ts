// 多语言行级分页器与 TXT 章节解析
// 借鉴 KOReader / Apple Books / Kindle 的行级分页思路：
// 按字符宽度（全角=2 半角=1）精确换行，避免英文单词截断与内容重复

export interface PageInfo {
  index: number;
  content: string; // 本页渲染文本（行间以 \n 连接）
  startOffset: number; // 在原文中的起始字符偏移
  endOffset: number; // 在原文中的结束字符偏移（不含）
}

export interface ChapterInfo {
  index: number;
  title: string;
  startOffset: number;
  endOffset: number;
  pageIndex: number; // 该章第一页的页码（分页后回填）
}

export interface PaginateResult {
  pages: PageInfo[];
  chapters: ChapterInfo[];
}

// ---------- 字符分类与宽度 ----------

function getCharWidth(ch: string): number {
  const code = ch.codePointAt(0) || 0;
  // 全角字符：CJK 表意文字 / 日文假名 / 韩文音节 / 全角标点 / CJK 标点
  const isFullWidth =
    (code >= 0x4e00 && code <= 0x9fff) || // CJK 统一表意
    (code >= 0x3400 && code <= 0x4dbf) || // 扩展A
    (code >= 0x20000 && code <= 0x2a6df) || // 扩展B
    (code >= 0xf900 && code <= 0xfaff) || // 兼容表意
    (code >= 0x3040 && code <= 0x30ff) || // 假名
    (code >= 0xac00 && code <= 0xd7af) || // 韩文
    (code >= 0xff01 && code <= 0xff60) || // 全角ASCII
    (code >= 0x3000 && code <= 0x303f); // CJK标点
  if (isFullWidth) return 2;
  // 中文单引号等常见宽字符
  if (ch === '\u2018' || ch === '\u2019' || ch === '\u201c' || ch === '\u201d' || ch === '\u2014') return 1;
  return 1; // 半角（拉丁字母/数字/标点/空格）
}

// 连续单词字符（拉丁字母 + 数字 + 撇号/连字符/下划线/小数点）
function isWordChar(ch: string): boolean {
  return /[a-zA-Z0-9'’\u2019\-_.]/.test(ch);
}

// ---------- 行级换行 ----------

interface Line {
  text: string;
  start: number;
  end: number; // 不含
}

// 将整段文本按字符宽度拆成"行"，英文单词保持完整不截断
function buildLines(text: string, maxUnits: number): Line[] {
  const lines: Line[] = [];
  let lineText = '';
  let lineStart = 0;
  let lineWidth = 0;
  let i = 0;

  const pushLine = (txt: string, start: number) => {
    if (txt.length > 0) {
      lines.push({ text: txt, start, end: start + txt.length });
    }
  };

  while (i < text.length) {
    const ch = text[i];

    // 显式换行
    if (ch === '\n') {
      pushLine(lineText, lineStart);
      lineText = '';
      lineStart = i + 1;
      lineWidth = 0;
      i++;
      continue;
    }

    // 连续单词（拉丁/数字串）保持完整
    if (isWordChar(ch)) {
      let word = '';
      const wordStart = i;
      let wordWidth = 0;
      while (i < text.length && isWordChar(text[i])) {
        word += text[i];
        wordWidth += getCharWidth(text[i]);
        i++;
      }
      if (lineWidth + wordWidth <= maxUnits) {
        lineText += word;
        lineWidth += wordWidth;
      } else if (lineText.trim().length > 0) {
        // 当前行放不下整个单词 → 换行
        pushLine(lineText, lineStart);
        lineText = word;
        lineStart = wordStart;
        lineWidth = wordWidth;
      } else {
        // 单词本身超过一行 → 强行截断
        pushLine(word, wordStart);
        lineText = '';
        lineStart = i;
        lineWidth = 0;
      }
      continue;
    }

    // 普通字符
    const chWidth = getCharWidth(ch);
    if (lineWidth + chWidth <= maxUnits) {
      lineText += ch;
      lineWidth += chWidth;
    } else {
      pushLine(lineText, lineStart);
      lineText = ch;
      lineStart = i;
      lineWidth = chWidth;
    }
    i++;
  }

  pushLine(lineText, lineStart);
  return lines;
}

// ---------- 分页 ----------

export function paginateText(
  text: string,
  width: number,
  height: number,
  fontSize: number,
  lineHeight: number,
  margin: number,
  pageWidthOverride = 0
): PaginateResult {
  const contentWidth = Math.max((pageWidthOverride > 0 ? pageWidthOverride : width) - margin * 2, 60);
  const contentHeight = Math.max(height - margin * 2, 60);
  const maxUnits = Math.max(10, Math.floor((contentWidth * 2) / fontSize));
  const linePx = fontSize * lineHeight;
  const linesPerPage = Math.max(1, Math.floor(contentHeight / linePx));

  const allLines = buildLines(text, maxUnits);

  const pages: PageInfo[] = [];
  for (let p = 0; p < allLines.length; p += linesPerPage) {
    const slice = allLines.slice(p, p + linesPerPage);
    const start = slice[0].start;
    const end = slice[slice.length - 1].end;
    pages.push({
      index: pages.length + 1,
      content: slice.map((l) => l.text).join('\n'),
      startOffset: start,
      endOffset: end,
    });
  }

  const chapters = parseChapters(text);
  assignChapterPages(pages, chapters);

  return { pages, chapters };
}

// ---------- 章节解析 ----------

// 匹配常见中文/英文章节标题（单独成行且较短）
const CHAPTER_RE =
  /^(第\s*[0-9０-９零一二三四五六七八九十百千万两]+\s*[章回节卷部篇集]|Chapter\s+[0-9０-９一二三四五六七八九十]+|序章|楔子|序言|前言|引子|后记|尾声|番外)/i;

export function parseChapters(text: string): ChapterInfo[] {
  const chapters: ChapterInfo[] = [];
  const lines = text.split('\n');
  let offset = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length > 0 && line.length <= 40 && CHAPTER_RE.test(line)) {
      chapters.push({
        index: chapters.length,
        title: line,
        startOffset: offset,
        endOffset: -1,
        pageIndex: -1,
      });
    }
    offset += rawLine.length + 1; // +1 为换行符
  }

  for (let i = 0; i < chapters.length; i++) {
    chapters[i].endOffset = i + 1 < chapters.length ? chapters[i + 1].startOffset : text.length;
  }

  return chapters;
}

// 分页完成后回填每章起始页码
export function assignChapterPages(pages: PageInfo[], chapters: ChapterInfo[]): void {
  let pageIdx = 0;
  for (const chapter of chapters) {
    // 找到第一个"结束偏移大于章节起始偏移"的页
    while (pageIdx < pages.length && pages[pageIdx].endOffset <= chapter.startOffset) {
      pageIdx++;
    }
    chapter.pageIndex = pageIdx < pages.length ? pages[pageIdx].index : (pages.length || 1);
  }
}

// 获取当前页所属章节（按字符偏移判断页面顶部位于哪一章）
export function getChapterAtPage(chapters: ChapterInfo[], pageStartOffset: number): ChapterInfo | null {
  if (chapters.length === 0) return null;
  let current: ChapterInfo | null = null;
  for (const chapter of chapters) {
    if (chapter.startOffset <= pageStartOffset) {
      current = chapter;
    } else {
      break;
    }
  }
  return current ?? chapters[0];
}
