import { globalShortcut, BrowserWindow } from 'electron';

export class ShortcutManager {
  private registeredShortcuts: Map<string, () => void> = new Map();

  // 注册老板键
  registerBossKey(callback: () => void): boolean {
    const shortcut = 'Alt+Z';
    
    try {
      const success = globalShortcut.register(shortcut, callback);
      
      if (success) {
        this.registeredShortcuts.set('bossKey', callback);
        console.log('老板键注册成功:', shortcut);
      } else {
        console.error('老板键注册失败，可能已被其他应用占用');
      }
      
      return success;
    } catch (error) {
      console.error('注册老板键时发生错误:', error);
      return false;
    }
  }

  // 注册自定义快捷键
  registerCustomShortcut(key: string, callback: () => void): boolean {
    try {
      const success = globalShortcut.register(key, callback);
      
      if (success) {
        this.registeredShortcuts.set(key, callback);
        console.log('快捷键注册成功:', key);
      } else {
        console.error('快捷键注册失败:', key);
      }
      
      return success;
    } catch (error) {
      console.error('注册快捷键时发生错误:', error);
      return false;
    }
  }

  // 注销快捷键
  unregisterShortcut(key: string): void {
    try {
      globalShortcut.unregister(key);
      this.registeredShortcuts.delete(key);
      console.log('快捷键注销成功:', key);
    } catch (error) {
      console.error('注销快捷键时发生错误:', error);
    }
  }

  // 注销所有快捷键
  unregisterAll(): void {
    try {
      globalShortcut.unregisterAll();
      this.registeredShortcuts.clear();
      console.log('所有快捷键已注销');
    } catch (error) {
      console.error('注销所有快捷键时发生错误:', error);
    }
  }

  // 检查快捷键是否已注册
  isRegistered(key: string): boolean {
    return globalShortcut.isRegistered(key);
  }

  // 获取所有已注册的快捷键
  getRegisteredShortcuts(): string[] {
    return Array.from(this.registeredShortcuts.keys());
  }

  // 重新注册老板键（用于设置更改后）
  reregisterBossKey(newKey: string, callback: () => void): boolean {
    // 先注销旧的老板键
    const oldBossKey = this.findBossKey();
    if (oldBossKey) {
      this.unregisterShortcut(oldBossKey);
    }

    // 注册新的老板键
    return this.registerCustomShortcut(newKey, callback);
  }

  // 查找当前的老板键
  private findBossKey(): string | null {
    for (const [key] of this.registeredShortcuts) {
      if (key === 'bossKey' || key.includes('Alt+Z')) {
        return key;
      }
    }
    return null;
  }

  // 注册应用内快捷键（仅在应用获得焦点时生效）
  registerLocalShortcuts(window: BrowserWindow): void {
    // 这些快捷键只在应用窗口获得焦点时生效
    window.webContents.on('before-input-event', (event, input) => {
      // Ctrl+O 打开文件
      if (input.control && input.key.toLowerCase() === 'o') {
        window.webContents.send('shortcut-open-file');
        event.preventDefault();
      }
      
      // Ctrl+N 新建标签
      if (input.control && input.key.toLowerCase() === 'n') {
        window.webContents.send('shortcut-new-tab');
        event.preventDefault();
      }
      
      // Ctrl+W 关闭当前标签
      if (input.control && input.key.toLowerCase() === 'w') {
        window.webContents.send('shortcut-close-tab');
        event.preventDefault();
      }
      
      // F11 全屏切换
      if (input.key === 'F11') {
        const isFullScreen = window.isFullScreen();
        window.setFullScreen(!isFullScreen);
        event.preventDefault();
      }
      
      // Esc 退出全屏或隐藏窗口
      if (input.key === 'Escape') {
        if (window.isFullScreen()) {
          window.setFullScreen(false);
        } else {
          window.hide();
        }
        event.preventDefault();
      }
      
      // Ctrl+Plus 放大
      if (input.control && (input.key === '=' || input.key === '+')) {
        window.webContents.send('shortcut-zoom-in');
        event.preventDefault();
      }
      
      // Ctrl+Minus 缩小
      if (input.control && input.key === '-') {
        window.webContents.send('shortcut-zoom-out');
        event.preventDefault();
      }
      
      // Ctrl+0 重置缩放
      if (input.control && input.key === '0') {
        window.webContents.send('shortcut-zoom-reset');
        event.preventDefault();
      }
      
      // 左右箭头键翻页
      if (input.key === 'ArrowLeft') {
        window.webContents.send('shortcut-prev-page');
        event.preventDefault();
      }
      
      if (input.key === 'ArrowRight') {
        window.webContents.send('shortcut-next-page');
        event.preventDefault();
      }
      
      // 空格键翻页
      if (input.key === ' ') {
        if (input.shift) {
          window.webContents.send('shortcut-prev-page');
        } else {
          window.webContents.send('shortcut-next-page');
        }
        event.preventDefault();
      }
    });
  }

  // 验证快捷键格式
  validateShortcut(shortcut: string): boolean {
    const validModifiers = ['Ctrl', 'Alt', 'Shift', 'Cmd', 'Command'];
    const parts = shortcut.split('+');
    
    if (parts.length < 2) {
      return false;
    }
    
    // 检查修饰键
    const modifiers = parts.slice(0, -1);
    const key = parts[parts.length - 1];
    
    for (const modifier of modifiers) {
      if (!validModifiers.includes(modifier)) {
        return false;
      }
    }
    
    // 检查主键
    if (!key || key.length === 0) {
      return false;
    }
    
    return true;
  }

  // 获取快捷键的友好显示名称
  getShortcutDisplayName(shortcut: string): string {
    return shortcut
      .replace('Ctrl', 'Ctrl')
      .replace('Alt', 'Alt')
      .replace('Shift', 'Shift')
      .replace('Cmd', '⌘')
      .replace('Command', '⌘');
  }
}