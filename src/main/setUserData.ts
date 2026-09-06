import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 用户数据目录（userData）解析：
 * - 优先使用环境变量 MOJIN_USER_DATA_DIR 显式指定；
 * - 否则使用项目内的 data 目录（便携模式）。这在沙箱 / 受限环境中可避免
 *   写入 ~/Library/Application Support 时触发 EPERM / 沙箱拦截；
 * - 若项目目录不可写（例如打包进只读的 .app 后），回退到系统默认目录。
 *
 * 注意：不要在系统默认 userData 目录上做“写入探测”，受限环境下可能被沙箱
 * 直接终止进程。这里只对项目目录做一次 mkdir，成功即可安全使用。
 */
function resolveUserDataDir(): string {
  if (process.env.MOJIN_USER_DATA_DIR) {
    return process.env.MOJIN_USER_DATA_DIR;
  }
  const projectData = path.join(path.resolve(__dirname, '../..'), 'data');
  try {
    fs.mkdirSync(projectData, { recursive: true });
    return projectData;
  } catch (error) {
    console.warn('项目 data 目录不可写，回退到系统默认用户目录:', error);
    return app.getPath('userData');
  }
}

const userDataDir = resolveUserDataDir();
try {
  fs.mkdirSync(userDataDir, { recursive: true });
  app.setPath('userData', userDataDir);
} catch (error) {
  console.warn('初始化用户数据目录失败，将使用默认目录:', error);
}
console.log('[mojin-reader] userData =', userDataDir);
