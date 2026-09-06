// 生成「摸金阅读」品牌图标（纯 Node，无第三方依赖）
// 设计取向：扁平克制 —— 暖墨色圆角底 + 单一金色展开书页，无光束/星芒/多色堆叠
// 输出：
//   build/icons/icon.png   512x512 源图
//   build/icons/icon.ico   Windows 多尺寸
//   build/icons/icon.icns  macOS 多尺寸
//   assets/tray-icon.png   128x128 托盘图标
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function pngEncode(size, rgba) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const p = y * stride + 1 + x * 4;
      const s = (y * size + x) * 4;
      raw[p] = rgba[s];
      raw[p + 1] = rgba[s + 1];
      raw[p + 2] = rgba[s + 2];
      raw[p + 3] = rgba[s + 3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function icoEncode(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dirSize = 16 * entries.length;
  let offset = header.length + dirSize;
  const dirs = [];
  const blobs = [];
  for (const e of entries) {
    const dir = Buffer.alloc(16);
    dir[0] = e.size === 256 ? 0 : e.size;
    dir[1] = e.size === 256 ? 0 : e.size;
    dir[2] = 0;
    dir[3] = 0;
    dir.writeUInt16LE(1, 4);
    dir.writeUInt16LE(32, 6);
    dir.writeUInt32LE(e.data.length, 8);
    dir.writeUInt32LE(offset, 12);
    dirs.push(dir);
    blobs.push(e.data);
    offset += e.data.length;
  }
  return Buffer.concat([header, ...dirs, ...blobs]);
}

function icnsEncode(entries) {
  const parts = [];
  let total = 8;
  for (const e of entries) {
    const head = Buffer.alloc(8);
    head.write(e.type, 0, 4, 'ascii');
    head.writeUInt32BE(e.data.length + 8, 4);
    parts.push(head, e.data);
    total += e.data.length + 8;
  }
  const magic = Buffer.alloc(8);
  magic.write('icns', 0, 4, 'ascii');
  magic.writeUInt32BE(total, 4);
  return Buffer.concat([magic, ...parts]);
}

function inRoundRect(u, v, half, cr) {
  const au = Math.abs(u);
  const av = Math.abs(v);
  if (au <= half - cr && av <= half) return true;
  if (av <= half - cr && au <= half) return true;
  const ou = au - (half - cr);
  const ov = av - (half - cr);
  return ou > 0 && ov > 0 && ou * ou + ov * ov <= cr * cr;
}

const BG_TOP = [27, 23, 18];
const BG_BOTTOM = [15, 12, 9];
const GOLD = [201, 169, 110];
const GOLD_DIM = [141, 115, 72];

// 画布归一化坐标范围 [-1,1]；底板留出 macOS 图标标准边距
const TILE_HALF = 0.84;
const TILE_CR = 0.19;

// 开卷轮廓：V 形书页带 + 平放封面底座 + 中缝书脊
const OW = 0.6;
const TAN = 0.4;
const TOP = 0.11;
const TH = 0.26;
const SPINE_GAP = 0.028;
const SPINE_HALF_W = 0.022;
const SPINE_TOP = 0.075;
const SPINE_BOT = -0.16;

// 圆角矩形判定（中心 cu/cv、半宽半高 hw/hh、圆角 cr）
function inRoundRectXY(u, v, cu, cv, hw, hh, cr) {
  const dx = Math.abs(u - cu);
  const dy = Math.abs(v - cv);
  if (dx <= hw - cr && dy <= hh) return true;
  if (dy <= hh - cr && dx <= hw) return true;
  const ox = dx - (hw - cr);
  const oy = dy - (hh - cr);
  return ox > 0 && oy > 0 && ox * ox + oy * oy <= cr * cr;
}

// 封面底座（画布坐标下的圆角横条）
const BAR_HALF_W = 0.49;
const BAR_CY = -0.196;
const BAR_HALF_H = 0.038;
const BAR_CR = 0.036;

// 图形缩放与垂直居中：形状空间几何中心，缩放到磁贴后回落至画布中心
const MAG = 1.06;
const SHAPE_CY = -0.03;

// 形状空间坐标：横向取绝对值实现左右镜像，书页带随横向距离抬升形成 V 形开卷
function shapeCoord(u, v) {
  const s = Math.abs(u) / MAG;
  return [s, v / MAG - SHAPE_CY - s * TAN];
}

// 单个采样点着色，返回 [r, g, b, a]
function sample(u, v) {
  if (!inRoundRect(u, v, TILE_HALF, TILE_CR)) return [0, 0, 0, 0];

  const t = (0.5 - 0.5 * (v / TILE_HALF)) * 0.5 + 0.25;
  const bg = [
    BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t,
    BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t,
    BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t,
  ];

  const [s, p] = shapeCoord(u, v);
  const outsideSpine = s > SPINE_GAP;
  const pageBot = TOP - TH;

  if (outsideSpine && p <= TOP && p >= pageBot && s <= OW) {
    return [GOLD[0], GOLD[1], GOLD[2], 255];
  }

  if (Math.abs(u) <= SPINE_HALF_W * MAG && v <= SPINE_TOP && v >= SPINE_BOT) {
    return [GOLD[0], GOLD[1], GOLD[2], 255];
  }

  if (inRoundRectXY(u, v, 0, BAR_CY, BAR_HALF_W, BAR_HALF_H, BAR_CR)) {
    return [GOLD_DIM[0], GOLD_DIM[1], GOLD_DIM[2], 255];
  }

  return [bg[0], bg[1], bg[2], 255];
}

function draw(size) {
  const ss = size <= 32 ? 6 : size <= 128 ? 4 : 3;
  const img = new Uint8Array(size * size * 4);
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const px = (ox + (sx + 0.5) / ss) / size;
          const py = (oy + (sy + 0.5) / ss) / size;
          const c = sample((px - 0.5) * 2, (0.5 - py) * 2);
          const al = c[3];
          r += c[0] * al;
          g += c[1] * al;
          b += c[2] * al;
          a += al;
        }
      }
      const idx = (oy * size + ox) * 4;
      const div = a > 0 ? a : 255;
      img[idx] = Math.round(r / div);
      img[idx + 1] = Math.round(g / div);
      img[idx + 2] = Math.round(b / div);
      img[idx + 3] = Math.round(a / (ss * ss));
    }
  }
  return img;
}

const root = path.join(__dirname, '..');
const iconDir = path.join(root, 'build', 'icons');
const assetDir = path.join(root, 'assets');
fs.mkdirSync(iconDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });

const cache = new Map();
function pngOf(size) {
  if (!cache.has(size)) cache.set(size, pngEncode(size, draw(size)));
  return cache.get(size);
}

fs.writeFileSync(path.join(iconDir, 'icon.png'), pngOf(512));
fs.writeFileSync(path.join(assetDir, 'tray-icon.png'), pngOf(128));

fs.writeFileSync(
  path.join(iconDir, 'icon.ico'),
  icoEncode([16, 24, 32, 48, 64, 128, 256].map((s) => ({ size: s, data: pngOf(s) })))
);

fs.writeFileSync(
  path.join(iconDir, 'icon.icns'),
  icnsEncode([
    { type: 'icp4', data: pngOf(16) },
    { type: 'icp5', data: pngOf(32) },
    { type: 'ic07', data: pngOf(128) },
    { type: 'ic08', data: pngOf(256) },
    { type: 'ic09', data: pngOf(512) },
    { type: 'ic11', data: pngOf(32) },
    { type: 'ic12', data: pngOf(64) },
    { type: 'ic13', data: pngOf(256) },
    { type: 'ic14', data: pngOf(512) },
  ])
);

console.log('图标已生成（扁平克制版）:');
console.log('  build/icons/icon.png / icon.ico / icon.icns');
console.log('  assets/tray-icon.png');
