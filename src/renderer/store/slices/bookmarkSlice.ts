import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 定义书签类型
export interface Bookmark {
  id: string;
  title: string;
  filePath: string;
  fileType: 'txt' | 'pdf' | 'epub' | 'mobi' | 'azw3';
  position: number | string;
  pageNumber?: number;
  progress?: number;
  excerpt?: string;
  createdAt: string;
  notes?: string;
  tags?: string[];
}

// 定义书签状态类型
interface BookmarkState {
  items: Bookmark[];
  tags: string[];
}

// 初始状态
const initialState: BookmarkState = {
  items: [],
  tags: []
};

// 创建slice
const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    // 添加书签
    addBookmark: (state, action: PayloadAction<Omit<Bookmark, 'id' | 'createdAt'>>) => {
      // 生成唯一ID
      const id = Date.now().toString();
      
      // 创建新书签
      const newBookmark: Bookmark = {
        ...action.payload,
        id,
        createdAt: new Date().toISOString()
      };
      
      // 添加到书签列表
      state.items.unshift(newBookmark);
      
      // 更新标签列表
      if (action.payload.tags && action.payload.tags.length > 0) {
        action.payload.tags.forEach(tag => {
          if (!state.tags.includes(tag)) {
            state.tags.push(tag);
          }
        });
      }
    },
    
    // 更新书签
    updateBookmark: (state, action: PayloadAction<{ id: string; changes: Partial<Omit<Bookmark, 'id' | 'createdAt'>> }>) => {
      const { id, changes } = action.payload;
      const bookmarkIndex = state.items.findIndex(bookmark => bookmark.id === id);
      
      if (bookmarkIndex !== -1) {
        // 更新书签
        state.items[bookmarkIndex] = {
          ...state.items[bookmarkIndex],
          ...changes
        };
        
        // 更新标签列表
        if (changes.tags) {
          // 重新计算所有标签
          const allTags = new Set<string>();
          state.items.forEach(bookmark => {
            if (bookmark.tags) {
              bookmark.tags.forEach(tag => allTags.add(tag));
            }
          });
          state.tags = Array.from(allTags);
        }
      }
    },
    
    // 删除书签
    removeBookmark: (state, action: PayloadAction<string>) => {
      const bookmarkIndex = state.items.findIndex(bookmark => bookmark.id === action.payload);
      
      if (bookmarkIndex !== -1) {
        // 保存要删除的书签的标签
        const tagsToCheck = state.items[bookmarkIndex].tags || [];
        
        // 删除书签
        state.items.splice(bookmarkIndex, 1);
        
        // 更新标签列表
        if (tagsToCheck.length > 0) {
          // 重新计算所有标签
          const allTags = new Set<string>();
          state.items.forEach(bookmark => {
            if (bookmark.tags) {
              bookmark.tags.forEach(tag => allTags.add(tag));
            }
          });
          state.tags = Array.from(allTags);
        }
      }
    },
    
    // 添加标签到书签
    addTagToBookmark: (state, action: PayloadAction<{ bookmarkId: string; tag: string }>) => {
      const { bookmarkId, tag } = action.payload;
      const bookmarkIndex = state.items.findIndex(bookmark => bookmark.id === bookmarkId);
      
      if (bookmarkIndex !== -1) {
        const bookmark = state.items[bookmarkIndex];
        
        // 如果书签没有标签数组，创建一个
        if (!bookmark.tags) {
          bookmark.tags = [];
        }
        
        // 如果标签不存在，添加它
        if (!bookmark.tags.includes(tag)) {
          bookmark.tags.push(tag);
        }
        
        // 如果标签不在全局标签列表中，添加它
        if (!state.tags.includes(tag)) {
          state.tags.push(tag);
        }
      }
    },
    
    // 从书签中移除标签
    removeTagFromBookmark: (state, action: PayloadAction<{ bookmarkId: string; tag: string }>) => {
      const { bookmarkId, tag } = action.payload;
      const bookmarkIndex = state.items.findIndex(bookmark => bookmark.id === bookmarkId);
      
      if (bookmarkIndex !== -1) {
        const bookmark = state.items[bookmarkIndex];
        
        // 如果书签有标签数组，移除指定标签
        if (bookmark.tags) {
          bookmark.tags = bookmark.tags.filter(t => t !== tag);
        }
        
        // 检查是否还有其他书签使用这个标签
        const tagStillInUse = state.items.some(b => b.tags && b.tags.includes(tag));
        
        // 如果没有其他书签使用这个标签，从全局标签列表中移除它
        if (!tagStillInUse) {
          state.tags = state.tags.filter(t => t !== tag);
        }
      }
    },
    
    // 清空所有书签
    clearBookmarks: (state) => {
      state.items = [];
      state.tags = [];
    }
  }
});

// 导出actions
export const { 
  addBookmark, 
  updateBookmark, 
  removeBookmark, 
  addTagToBookmark, 
  removeTagFromBookmark, 
  clearBookmarks 
} = bookmarkSlice.actions;

// 导出reducer
export default bookmarkSlice.reducer;