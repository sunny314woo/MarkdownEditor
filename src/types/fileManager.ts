export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  parentId?: string;
  createdAt: number;
  updatedAt: number;
  isExpanded?: boolean;
}

export interface Tab {
  id: string;
  fileId: string;
  name: string;
  isActive: boolean;
}

export interface FileManagerState {
  rootFolder: FileNode;
  tabs: Tab[];
  activeTabId: string | null;
  searchQuery: string;
  sidebarVisible: boolean;
}
