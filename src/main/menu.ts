import { Menu, app, clipboard, shell } from 'electron';
import path from 'path';
import { IPC } from '../shared/ipc';

export class MenuManager {
  private menu: Menu | null = null;

  // 创建应用菜单
  createApplicationMenu(): Menu {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: '文件',
        submenu: [
          {
            label: '打开文件',
            accelerator: 'CmdOrCtrl+O',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuOpenFile);
            }
          },
          {
            label: '打开网址',
            accelerator: 'CmdOrCtrl+L',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuOpenUrl);
            }
          },
          { type: 'separator' },
          {
            label: '最近打开',
            submenu: [
              {
                label: '清空最近打开',
                click: (_, window) => {
                  window?.webContents.send(IPC.EventMenuClearRecent);
                }
              }
            ]
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: '编辑',
        submenu: [
          {
            label: '撤销',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
          },
          {
            label: '重做',
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
          },
          { type: 'separator' },
          {
            label: '剪切',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
          },
          {
            label: '复制',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
          },
          {
            label: '粘贴',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
          },
          {
            label: '全选',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectAll'
          },
          { type: 'separator' },
          {
            label: '查找',
            accelerator: 'CmdOrCtrl+F',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuFind);
            }
          }
        ]
      },
      {
        label: '视图',
        submenu: [
          {
            label: '重新加载',
            accelerator: 'CmdOrCtrl+R',
            click: (_, window) => {
              window?.reload();
            }
          },
          {
            label: '强制重新加载',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: (_, window) => {
              window?.webContents.reloadIgnoringCache();
            }
          },
          {
            label: '开发者工具',
            accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
            click: (_, window) => {
              window?.webContents.toggleDevTools();
            }
          },
          { type: 'separator' },
          {
            label: '实际大小',
            accelerator: 'CmdOrCtrl+0',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuZoomReset);
            }
          },
          {
            label: '放大',
            accelerator: 'CmdOrCtrl+Plus',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuZoomIn);
            }
          },
          {
            label: '缩小',
            accelerator: 'CmdOrCtrl+-',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuZoomOut);
            }
          },
          { type: 'separator' },
          {
            label: '全屏',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            click: (_, window) => {
              if (window) {
                window.setFullScreen(!window.isFullScreen());
              }
            }
          }
        ]
      },
      {
        label: '阅读',
        submenu: [
          {
            label: '上一页',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuPrevPage);
            }
          },
          {
            label: '下一页',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuNextPage);
            }
          },
          { type: 'separator' },
          {
            label: '跳转到页面',
            accelerator: 'CmdOrCtrl+G',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuGotoPage);
            }
          },
          {
            label: '添加书签',
            accelerator: 'CmdOrCtrl+D',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuAddBookmark);
            }
          },
          {
            label: '书签管理',
            accelerator: 'CmdOrCtrl+Shift+O',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuManageBookmarks);
            }
          }
        ]
      },
      {
        label: '工具',
        submenu: [
          {
            label: '设置',
            accelerator: 'CmdOrCtrl+,',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuOpenSettings);
            }
          },
          { type: 'separator' },
          {
            label: '透明度',
            submenu: [
              {
                label: '完全不透明',
                click: (_, window) => {
                  window?.setOpacity(1.0);
                }
              },
              {
                label: '90%',
                click: (_, window) => {
                  window?.setOpacity(0.9);
                }
              },
              {
                label: '80%',
                click: (_, window) => {
                  window?.setOpacity(0.8);
                }
              },
              {
                label: '70%',
                click: (_, window) => {
                  window?.setOpacity(0.7);
                }
              },
              {
                label: '60%',
                click: (_, window) => {
                  window?.setOpacity(0.6);
                }
              },
              {
                label: '50%',
                click: (_, window) => {
                  window?.setOpacity(0.5);
                }
              }
            ]
          },
          {
            label: '隐藏功能',
            submenu: [
              {
                label: '隐藏窗口',
                click: (_, window) => {
                  window?.hide();
                }
              },
              {
                label: '置顶显示',
                type: 'checkbox',
                click: (menuItem, window) => {
                  if (window) {
                    window.setAlwaysOnTop(menuItem.checked);
                  }
                }
              }
            ]
          }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '使用说明',
            click: () => {
              shell.openExternal('https://github.com/mojin-reader/help');
            }
          },
          {
            label: '快捷键说明',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuShowShortcuts);
            }
          },
          { type: 'separator' },
          {
            label: '检查更新',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuCheckUpdate);
            }
          },
          {
            label: '关于摸金阅读',
            click: (_, window) => {
              window?.webContents.send(IPC.EventMenuShowAbout);
            }
          }
        ]
      }
    ];

    // macOS 特殊处理
    if (process.platform === 'darwin') {
      template.unshift({
        label: app.getName(),
        submenu: [
          {
            label: '关于 ' + app.getName(),
            role: 'about'
          },
          { type: 'separator' },
          {
            label: '服务',
            role: 'services',
            submenu: []
          },
          { type: 'separator' },
          {
            label: '隐藏 ' + app.getName(),
            accelerator: 'Command+H',
            role: 'hide'
          },
          {
            label: '隐藏其他',
            accelerator: 'Command+Shift+H',
            role: 'hideOthers'  // 修正大小写
          },
          {
            label: '显示全部',
            role: 'unhide'
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: 'Command+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      });
    }

    this.menu = Menu.buildFromTemplate(template);
    return this.menu;
  }

  // 创建右键上下文菜单
  createContextMenu(params: Electron.ContextMenuParams): Menu {
    const template: Electron.MenuItemConstructorOptions[] = [];

    // 如果有选中文本
    if (params.selectionText) {
      template.push(
        {
          label: '复制',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        { type: 'separator' }
      );
    }

    // 如果是可编辑区域
    if (params.isEditable) {
      template.push(
        {
          label: '剪切',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: '复制',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: '粘贴',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        { type: 'separator' }
      );
    }

    // 如果是链接
    if (params.linkURL) {
      template.push(
        {
          label: '在新窗口中打开链接',
          click: () => {
            shell.openExternal(params.linkURL);
          }
        },
        {
          label: '复制链接地址',
          click: () => {
            clipboard.writeText(params.linkURL);
          }
        },
        { type: 'separator' }
      );
    }

    // 如果是图片
    if (params.hasImageContents) {
      template.push(
        {
          label: '复制图片',
          click: (_, window) => {
            window?.webContents.copyImageAt(params.x, params.y);
          }
        },
        {
          label: '保存图片',
          click: (_, window) => {
            window?.webContents.send('context-save-image', params);
          }
        },
        { type: 'separator' }
      );
    }

    // 通用选项
    template.push(
      {
        label: '刷新',
        accelerator: 'CmdOrCtrl+R',
        click: (_, window) => {
          window?.reload();
        }
      },
      {
        label: '检查元素',
        click: (_, window) => {
          window?.webContents.inspectElement(params.x, params.y);
        }
      }
    );

    return Menu.buildFromTemplate(template);
  }

  // 设置应用菜单
  setApplicationMenu(): void {
    const menu = this.createApplicationMenu();
    Menu.setApplicationMenu(menu);
  }

  // 更新菜单项状态
  updateMenuItemState(menuId: string, enabled: boolean, checked?: boolean): void {
    if (this.menu) {
      const menuItem = this.menu.getMenuItemById(menuId);
      if (menuItem) {
        menuItem.enabled = enabled;
        if (typeof checked === 'boolean') {
          menuItem.checked = checked;
        }
      }
    }
  }

  // 添加最近打开的文件到菜单
  updateRecentFiles(recentFiles: string[]): void {
    if (!this.menu) return;

    const fileMenu = this.menu.items.find(item => item.label === '文件');
    if (!fileMenu || !fileMenu.submenu) return;

    const recentMenu = fileMenu.submenu.items.find(item => item.label === '最近打开');
    if (!recentMenu || !recentMenu.submenu) return;

    // 重新构建"最近打开"子菜单：先加最近文件项，再追加分隔线与"清空"项
    const newSubmenuItems: Electron.MenuItemConstructorOptions[] = [];
    recentFiles.slice(0, 10).forEach((filePath, index) => {
      const fileName = path.basename(filePath);
      newSubmenuItems.push({
        label: `${index + 1}. ${fileName}`,
        click: (_, window) => {
          window?.webContents.send(IPC.EventMenuOpenRecentFile, filePath);
        }
      });
    });

    if (newSubmenuItems.length > 0) {
      newSubmenuItems.push({ type: 'separator' });
      newSubmenuItems.push({
        label: '清空最近打开',
        click: (_, window) => {
          window?.webContents.send(IPC.EventMenuClearRecent);
        }
      });
    }

    recentMenu.submenu = Menu.buildFromTemplate(newSubmenuItems);
  }
}