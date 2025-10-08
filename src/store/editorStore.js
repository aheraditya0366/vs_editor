import { create } from 'zustand'

const initialTree = [
  {
    id: 'src',
    name: 'src',
    type: 'folder',
    children: [
      { id: 'src/App.jsx', name: 'App.jsx', type: 'file' },
      { id: 'src/main.jsx', name: 'main.jsx', type: 'file' },
      { id: 'src/index.css', name: 'index.css', type: 'file' },
      { id: 'src/App.css', name: 'App.css', type: 'file' },
    ],
  },
  {
    id: 'public',
    name: 'public',
    type: 'folder',
    children: [
      { id: 'public/index.html', name: 'index.html', type: 'file' },
    ],
  },
]

const initialFiles = new Map([
  [
    'src/App.jsx',
    `import { useState } from 'react'\nimport reactLogo from './assets/react.svg'\nimport viteLogo from '/vite.svg'\nimport './App.css'\n\nfunction App() {\n  const [count, setCount] = useState(0)\n\n  return (\n    <>\n      <div>\n        <a href=\"https://vite.dev\" target=\"_blank\">\n          <img src={viteLogo} className=\"logo\" alt=\"Vite logo\" />\n        </a>\n        <a href=\"https://react.dev\" target=\"_blank\">\n          <img src={reactLogo} className=\"logo react\" alt=\"React logo\" />\n        </a>\n      </div>\n      <h1>Vite + React</h1>\n      <div className=\"card\">\n        <button onClick={() => setCount((count) => count + 1)}>\n          count is {count}\n        </button>\n        <p>\n          Edit <code>src/App.jsx</code> and save to test HMR\n        </p>\n      </div>\n      <p className=\"read-the-docs\">\n        Click on the Vite and React logos to learn more\n      </p>\n    </>\n  )\n}\n\nexport default App\n`,
  ],
  [
    'src/main.jsx',
    `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)\n`,
  ],
  [
    'src/index.css',
    `:root {\n  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;\n}\n`,
  ],
  [
    'src/App.css',
    `.app { display: flex; height: 100vh; }\n.sidebar { width: 260px; border-right: 1px solid #2a2a2a; overflow: auto; }\n.workbench { flex: 1; display: flex; flex-direction: column; }\n.tabbar { height: 36px; display: flex; align-items: center; gap: 4px; border-bottom: 1px solid #2a2a2a; overflow: auto; }\n.tab { display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: #1e1e1e; border: 1px solid #2a2a2a; border-bottom: none; border-radius: 6px 6px 0 0; cursor: pointer; }\n.tab.active { background: #2a2a2a; }\n.editor { flex: 1; }\n.tree { font-size: 14px; padding: 8px; }\n.tree-item { padding: 2px 4px; cursor: pointer; border-radius: 4px; }\n.tree-item:hover { background: #2a2a2a; }\n.folder { font-weight: 600; }\n`,
  ],
  [
    'public/index.html',
    `<!doctype html>\n<html>\n  <head><meta charset=\"UTF-8\" /><title>Project</title></head>\n  <body><div id=\"root\"></div></body>\n</html>\n`,
  ],
])

// Helpers for File System Access API
async function readHandleText(fileHandle) {
  const file = await fileHandle.getFile()
  return await file.text()
}

async function writeHandleText(fileHandle, text) {
  const writable = await fileHandle.createWritable()
  await writable.write(text)
  await writable.close()
}

async function buildFsTree(rootHandle) {
  const handles = new Map()

  async function walk(dirHandle, base) {
    const children = []
    for await (const entry of dirHandle.values()) {
      const path = base ? `${base}/${entry.name}` : entry.name
      if (entry.kind === 'file') {
        handles.set(path, entry)
        children.push({ id: path, name: entry.name, type: 'file' })
      } else if (entry.kind === 'directory') {
        const node = await walk(entry, path)
        children.push({ id: path, name: entry.name, type: 'folder', children: node.children })
      }
    }
    return { children }
  }

  const root = await walk(rootHandle, '')
  return { tree: [{ id: rootHandle.name, name: rootHandle.name, type: 'folder', children: root.children }], handles }
}

// Resolve a directory handle from a relative path like "src/components"
async function getDirHandleFromPath(rootHandle, dirPath) {
  if (!rootHandle) return null
  if (!dirPath || dirPath === '/' || dirPath === rootHandle.name) return rootHandle
  const parts = dirPath.split('/').filter(Boolean)
  // If first part equals root name, skip it
  const startIndex = parts[0] === rootHandle.name ? 1 : 0
  let current = rootHandle
  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i]
    current = await current.getDirectoryHandle(part)
  }
  return current
}

function deepCloneTree(nodes) {
  return nodes.map(n => ({ ...n, children: n.children ? deepCloneTree(n.children) : undefined }))
}

function addNodeToTree(nodes, dirId, newNode) {
  return nodes.map(n => {
    if (n.id === dirId && n.type === 'folder') {
      const children = n.children ? [...n.children, newNode] : [newNode]
      return { ...n, children }
    }
    if (n.children) {
      return { ...n, children: addNodeToTree(n.children, dirId, newNode) }
    }
    return n
  })
}

function removeNodeFromTree(nodes, targetId) {
  const out = []
  for (const n of nodes) {
    if (n.id === targetId) continue
    if (n.children) {
      out.push({ ...n, children: removeNodeFromTree(n.children, targetId) })
    } else {
      out.push(n)
    }
  }
  return out
}

function renameNodeInTree(nodes, targetId, newId, newName) {
  return nodes.map(n => {
    if (n.id === targetId) {
      return { ...n, id: newId, name: newName }
    }
    if (n.children) {
      return { ...n, children: renameNodeInTree(n.children, targetId, newId, newName) }
    }
    return n
  })
}

function pathDirname(path) {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

function pathBasename(path) {
  const parts = path.split('/')
  return parts.pop()
}

export const useEditorStore = create((set, get) => ({
  tree: initialTree,
  fileContentMap: initialFiles,
  openTabs: [], // [{ id, path, name, dirty? }]
  activeTabId: null,
  // Editor jump target, consumed by CodeEditor
  pendingCursorLocation: null, // { id, lineNumber, column }
  activeTabIdsPerPanel: { // new state to track active tab per panel
    single: null,
    verticalSplitLeft: null,
    verticalSplitRight: null,
    horizontalSplitTop: null,
    horizontalSplitBottom: null,
    gridTopLeft: null,
    gridTopRight: null,
    gridBottomLeft: null,
    gridBottomRight: null,
  },
  rootDirectoryHandle: null,
  fileHandles: new Map(), // path -> FileSystemFileHandle
  dirtyMap: new Map(), // path -> boolean
  // Navigation & layout
  history: [], // array of tab ids
  historyIndex: -1,
  sidebarVisible: true,
  activeView: 'explorer', // 'explorer', 'search', 'sourceControl', 'runAndDebug', 'extensions', 'accounts'
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'dark',
  layoutMode: 'single', // 'single', 'vertical-split', 'horizontal-split', 'grid'
  editorStatus: {
    lineNumber: 1,
    column: 1,
    eol: 'LF',
    tabSize: 2,
    insertSpaces: true,
    language: 'plaintext',
  },
  // Autosave
  autosaveEnabled: false,
  autosaveDebounceMs: 1200,
  // Session
  sessionLoaded: false,

  openFolder: async () => {
    if (!window.showDirectoryPicker) {
      alert('Your browser does not support the File System Access API.')
      return
    }
    try {
      const handle = await window.showDirectoryPicker()
      const { tree, handles } = await buildFsTree(handle)
      set({
        rootDirectoryHandle: handle,
        fileHandles: handles,
        tree,
        fileContentMap: new Map(),
        openTabs: [],
        activeTabId: null,
        dirtyMap: new Map(),
        history: [],
        historyIndex: -1,
      })
      get().saveSession()
    } catch (e) {
      // cancelled
    }
  },

  openFile: async (path) => {
    const filePath = path
    const name = filePath.split('/').pop()
    const exists = get().openTabs.find((t) => t.id === filePath)
    const nextTabs = exists ? get().openTabs : [...get().openTabs, { id: filePath, path: filePath, name }]
    if (!get().fileContentMap.has(filePath)) {
      if (get().fileHandles.has(filePath)) {
        try {
          const fh = get().fileHandles.get(filePath)
          const text = await readHandleText(fh)
          const map = new Map(get().fileContentMap)
          map.set(filePath, text)
          set({ fileContentMap: map })
        } catch {}
      } else {
        // Fallback: try to fetch from server
        try {
          const response = await fetch(`/${filePath}`)
          if (response.ok) {
            const text = await response.text()
            const map = new Map(get().fileContentMap)
            map.set(filePath, text)
            set({ fileContentMap: map })
          }
        } catch {}
      }
    }
    set({ openTabs: nextTabs, activeTabId: filePath })
    get().pushHistory(filePath)
    get().updatePanelsForLayout()
    get().saveSession()
  },

  closeTab: (id) => {
    const tabs = get().openTabs.filter((t) => t.id !== id)
    let nextActive = get().activeTabId
    if (id === nextActive) nextActive = tabs.length ? tabs[tabs.length - 1].id : null
    set({ openTabs: tabs, activeTabId: nextActive })
    get().updatePanelsForLayout()
    get().saveSession()
  },

  activateTab: (id) => {
    set({ activeTabId: id })
    get().pushHistory(id)
    get().updatePanelsForLayout()
    get().saveSession()
  },

  getActiveContent: () => {
    const id = get().activeTabId
    if (!id) return ''
    return get().fileContentMap.get(id) ?? ''
  },

  updateActiveContent: (newValue, targetId) => {
    const id = targetId || get().activeTabId
    if (!id) return
    const map = new Map(get().fileContentMap)
    map.set(id, newValue)
    const dirty = new Map(get().dirtyMap)
    dirty.set(id, true)
    const tabs = get().openTabs.map((t) => (t.id === id ? { ...t, dirty: true } : t))
    set({ fileContentMap: map, dirtyMap: dirty, openTabs: tabs })
    // Schedule autosave if enabled
    if (get().autosaveEnabled) {
      get().scheduleAutosave(id)
    }
  },

  saveActiveFile: async () => {
    const id = get().activeTabId
    if (!id) return
    const content = get().fileContentMap.get(id) ?? ''
    if (get().fileHandles.has(id)) {
      try {
        await writeHandleText(get().fileHandles.get(id), content)
      } catch {}
    }
    const dirty = new Map(get().dirtyMap)
    dirty.set(id, false)
    const tabs = get().openTabs.map((t) => (t.id === id ? { ...t, dirty: false } : t))
    set({ dirtyMap: dirty, openTabs: tabs })
    get().saveSession()
  },

  // Save all dirty files with underlying FileSystem handles
  saveAllFiles: async () => {
    const dirtyMap = new Map(get().dirtyMap)
    const updatedTabs = get().openTabs.map((t) => ({ ...t }))
    for (const [path, isDirty] of dirtyMap.entries()) {
      if (!isDirty) continue
      const content = get().fileContentMap.get(path) ?? ''
      if (get().fileHandles.has(path)) {
        try {
          await writeHandleText(get().fileHandles.get(path), content)
          dirtyMap.set(path, false)
          const tabIndex = updatedTabs.findIndex((tt) => tt.id === path)
          if (tabIndex >= 0) updatedTabs[tabIndex].dirty = false
        } catch {}
      }
    }
    set({ dirtyMap, openTabs: updatedTabs })
    get().saveSession()
  },

  updateEditorStatus: (partial) => {
    set({ editorStatus: { ...get().editorStatus, ...partial } })
  },

  // History & layout actions
  pushHistory: (id) => {
    if (!id) return
    const { history, historyIndex } = get()
    const current = historyIndex >= 0 ? history[historyIndex] : null
    if (current === id) return
    const next = history.slice(0, historyIndex + 1)
    next.push(id)
    set({ history: next, historyIndex: next.length - 1 })
  },
  canGoBack: () => get().historyIndex > 0,
  canGoForward: () => get().historyIndex >= 0 && get().historyIndex < get().history.length - 1,
  goBack: () => {
    const { historyIndex, history } = get()
    if (historyIndex > 0) {
      const idx = historyIndex - 1
      const id = history[idx]
      set({ historyIndex: idx, activeTabId: id })
      get().updatePanelsForLayout()
    }
  },
  goForward: () => {
    const { historyIndex, history } = get()
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1
      const id = history[idx]
      set({ historyIndex: idx, activeTabId: id })
      get().updatePanelsForLayout()
    }
  },
  toggleSidebar: () => set({ sidebarVisible: !get().sidebarVisible }),

  setActiveView: (view) => set({ activeView: view }),

  setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

  setLayoutMode: (mode) => {
    set({ layoutMode: mode })
    get().updatePanelsForLayout()
    get().saveSession()
  },

  setActiveTabForPanel: (panel, tabId) => {
    const activeTabIdsPerPanel = { ...get().activeTabIdsPerPanel, [panel]: tabId }
    set({ activeTabIdsPerPanel })
  },

  updatePanelsForLayout: () => {
    const activeTabId = get().activeTabId
    const layoutMode = get().layoutMode
    const activeTabIdsPerPanel = { ...get().activeTabIdsPerPanel }
    if (layoutMode === 'single') {
      activeTabIdsPerPanel.single = activeTabId
    } else if (layoutMode === 'vertical-split') {
      activeTabIdsPerPanel.verticalSplitLeft = activeTabId
      activeTabIdsPerPanel.verticalSplitRight = activeTabId
    } else if (layoutMode === 'horizontal-split') {
      activeTabIdsPerPanel.horizontalSplitTop = activeTabId
      activeTabIdsPerPanel.horizontalSplitBottom = activeTabId
    } else if (layoutMode === 'grid') {
      activeTabIdsPerPanel.gridTopLeft = activeTabId
      activeTabIdsPerPanel.gridTopRight = activeTabId
      activeTabIdsPerPanel.gridBottomLeft = activeTabId
      activeTabIdsPerPanel.gridBottomRight = activeTabId
    }
    set({ activeTabIdsPerPanel })
  },

  // Open a file and request the editor to jump to a location
  openFileAt: async (path, lineNumber = 1, column = 1) => {
    set({ pendingCursorLocation: { id: path, lineNumber, column } })
    await get().openFile(path)
  },

  // Reset pending cursor request after editor consumes it
  consumePendingCursorLocation: () => {
    set({ pendingCursorLocation: null })
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: next })
    try { localStorage.setItem('theme', next) } catch {}
    get().saveSession()
  },

  // File listing for quick open
  listAllFiles: () => {
    const out = []
    function walk(nodes, prefix) {
      nodes.forEach((n) => {
        if (n.type === 'file') {
          out.push({ path: n.id, name: n.name })
        } else if (n.children) {
          walk(n.children, n.id)
        }
      })
    }
    walk(get().tree, '')
    return out
  },

  // Explorer CRUD operations
  refreshTree: async () => {
    const handle = get().rootDirectoryHandle
    if (!handle) return
    try {
      const { tree, handles } = await buildFsTree(handle)
      set({ tree, fileHandles: handles })
    } catch {}
  },

  createFile: async (dirId, name) => {
    const handle = get().rootDirectoryHandle
    if (handle) {
      try {
        const dirHandle = await getDirHandleFromPath(handle, dirId)
        const fileHandle = await dirHandle.getFileHandle(name, { create: true })
        // Initialize empty content
        await writeHandleText(fileHandle, '')
        await get().refreshTree()
      } catch {}
      return
    }
    // In-memory fallback
    const newPath = dirId ? `${dirId}/${name}` : name
    const newTree = addNodeToTree(get().tree, dirId, { id: newPath, name, type: 'file' })
    const map = new Map(get().fileContentMap)
    map.set(newPath, '')
    set({ tree: newTree, fileContentMap: map })
  },

  createFolder: async (dirId, name) => {
    const handle = get().rootDirectoryHandle
    if (handle) {
      try {
        const dirHandle = await getDirHandleFromPath(handle, dirId)
        await dirHandle.getDirectoryHandle(name, { create: true })
        await get().refreshTree()
      } catch {}
      return
    }
    const newPath = dirId ? `${dirId}/${name}` : name
    const newTree = addNodeToTree(get().tree, dirId, { id: newPath, name, type: 'folder', children: [] })
    set({ tree: newTree })
  },

  deleteEntry: async (nodeId, type) => {
    const handle = get().rootDirectoryHandle
    if (handle) {
      try {
        const parentPath = pathDirname(nodeId)
        const name = pathBasename(nodeId)
        const dirHandle = await getDirHandleFromPath(handle, parentPath)
        await dirHandle.removeEntry(name, { recursive: type === 'folder' })
        // Close any open tabs under this path
        const tabs = get().openTabs.filter(t => !(t.id === nodeId || (type === 'folder' && t.id.startsWith(nodeId + '/'))))
        let nextActive = get().activeTabId
        if (!tabs.find(t => t.id === nextActive)) nextActive = tabs.length ? tabs[tabs.length - 1].id : null
        // Clean maps
        const fileMap = new Map(get().fileContentMap)
        const dirtyMap = new Map(get().dirtyMap)
        for (const key of Array.from(fileMap.keys())) {
          if (key === nodeId || (type === 'folder' && key.startsWith(nodeId + '/'))) fileMap.delete(key)
        }
        for (const key of Array.from(dirtyMap.keys())) {
          if (key === nodeId || (type === 'folder' && key.startsWith(nodeId + '/'))) dirtyMap.delete(key)
        }
        set({ openTabs: tabs, activeTabId: nextActive, fileContentMap: fileMap, dirtyMap })
        await get().refreshTree()
        get().updatePanelsForLayout()
        get().saveSession()
      } catch {}
      return
    }
    // In-memory fallback
    const newTree = removeNodeFromTree(get().tree, nodeId)
    const fileMap = new Map(get().fileContentMap)
    const dirtyMap = new Map(get().dirtyMap)
    fileMap.delete(nodeId)
    dirtyMap.delete(nodeId)
    set({ tree: newTree, fileContentMap: fileMap, dirtyMap })
  },

  renameEntry: async (nodeId, type, newName) => {
    if (!newName) return
    const handle = get().rootDirectoryHandle
    if (handle && type === 'file') {
      try {
        const parentPath = pathDirname(nodeId)
        const oldName = pathBasename(nodeId)
        const dirHandle = await getDirHandleFromPath(handle, parentPath)
        // Create new file, copy content, remove old
        const newPath = parentPath ? `${parentPath}/${newName}` : newName
        const newHandle = await dirHandle.getFileHandle(newName, { create: true })
        const content = get().fileContentMap.get(nodeId) ?? ''
        await writeHandleText(newHandle, content)
        await dirHandle.removeEntry(oldName)
        // Update tabs and maps
        const tabs = get().openTabs.map(t => t.id === nodeId ? { ...t, id: newPath, path: newPath, name: newName } : t)
        const fileMap = new Map(get().fileContentMap)
        if (fileMap.has(nodeId)) {
          const text = fileMap.get(nodeId)
          fileMap.delete(nodeId)
          fileMap.set(newPath, text)
        }
        const dirtyMap = new Map(get().dirtyMap)
        if (dirtyMap.has(nodeId)) {
          const dirty = dirtyMap.get(nodeId)
          dirtyMap.delete(nodeId)
          dirtyMap.set(newPath, dirty)
        }
        let active = get().activeTabId
        if (active === nodeId) active = newPath
        set({ openTabs: tabs, fileContentMap: fileMap, dirtyMap, activeTabId: active })
        await get().refreshTree()
        get().updatePanelsForLayout()
        get().saveSession()
      } catch {}
      return
    }
    // In-memory fallback or unsupported directory rename
    const parentPath = pathDirname(nodeId)
    const newId = parentPath ? `${parentPath}/${newName}` : newName
    const newTree = renameNodeInTree(get().tree, nodeId, newId, newName)
    const fileMap = new Map(get().fileContentMap)
    if (type === 'file' && fileMap.has(nodeId)) {
      const text = fileMap.get(nodeId)
      fileMap.delete(nodeId)
      fileMap.set(newId, text)
    }
    set({ tree: newTree, fileContentMap: fileMap })
  },

  // Search across files in the current tree
  // Returns: [{ path, lineNumber, column, lineText }]
  searchFiles: async (query, options = {}) => {
    const { caseSensitive = false, useRegex = false, maxResults = 500 } = options
    if (!query) return []

    const files = get().listAllFiles()
    const results = []
    let pattern
    try {
      pattern = useRegex ? new RegExp(query, caseSensitive ? 'g' : 'gi') : null
    } catch {
      // Invalid regex; treat as plain text
      pattern = null
    }

    const getContent = async (path) => {
      if (get().fileContentMap.has(path)) {
        return get().fileContentMap.get(path)
      }
      if (get().fileHandles.has(path)) {
        try {
          const fh = get().fileHandles.get(path)
          return await readHandleText(fh)
        } catch {}
      }
      try {
        const resp = await fetch(`/${path}`)
        if (resp.ok) return await resp.text()
      } catch {}
      return ''
    }

    for (const file of files) {
      if (results.length >= maxResults) break
      const text = await getContent(file.path)
      if (!text) continue
      const lines = text.split(/\r?\n/)
      for (let i = 0; i < lines.length; i++) {
        if (results.length >= maxResults) break
        const lineText = lines[i]
        if (useRegex && pattern) {
          pattern.lastIndex = 0
          const match = pattern.exec(lineText)
          if (match) {
            const col = (match.index ?? 0) + 1
            results.push({ path: file.path, lineNumber: i + 1, column: col, lineText })
          }
        } else {
          const haystack = caseSensitive ? lineText : lineText.toLowerCase()
          const needle = caseSensitive ? query : query.toLowerCase()
          const idx = haystack.indexOf(needle)
          if (idx >= 0) {
            results.push({ path: file.path, lineNumber: i + 1, column: idx + 1, lineText })
          }
        }
      }
    }
    return results
  },

  // Terminal state and actions
  terminalTabs: [{ id: 'terminal-1', name: 'Terminal 1', output: [], cwd: '/' }],
  activeTerminalId: 'terminal-1',
  terminalVisible: false,

  addTerminalTab: () => {
    const tabs = get().terminalTabs
    const newId = `terminal-${tabs.length + 1}`
    const newTab = { id: newId, name: `Terminal ${tabs.length + 1}`, output: [], cwd: '/' }
    set({ terminalTabs: [...tabs, newTab], activeTerminalId: newId })
  },

  closeTerminalTab: (id) => {
    const tabs = get().terminalTabs.filter((t) => t.id !== id)
    let nextActive = get().activeTerminalId
    if (id === nextActive) nextActive = tabs.length ? tabs[tabs.length - 1].id : null
    set({ terminalTabs: tabs, activeTerminalId: nextActive })
  },

  activateTerminalTab: (id) => {
    set({ activeTerminalId: id })
  },

  toggleTerminal: () => set({ terminalVisible: !get().terminalVisible }),

  updateTerminalCwd: (id, newCwd) => {
    set(state => ({
      terminalTabs: state.terminalTabs.map(t => t.id === id ? { ...t, cwd: newCwd } : t)
    }))
  },

  listFilesInDir: (dir) => {
    const out = []
    const walk = (nodes, prefix) => {
      nodes.forEach(n => {
        if (n.type === 'file') {
          out.push(n.name)
        } else if (n.children) {
          out.push(n.name + '/')
        }
      })
    }
    // Find the dir in tree
    const findDir = (nodes, path) => {
      for (const n of nodes) {
        if (n.id === path) return n.children || []
        if (n.children) {
          const found = findDir(n.children, path)
          if (found) return found
        }
      }
      return []
    }
    const children = findDir(get().tree, dir)
    walk(children, dir)
    return out
  },

  runCommand: (command, terminalId) => {
    const tab = get().terminalTabs.find(t => t.id === terminalId)
    if (!tab) return 'Terminal not found'
    const cwd = tab.cwd
    const args = command.split(' ')
    const cmd = args[0].toLowerCase()
    let output = ''

    switch (cmd) {
      case 'help':
        output = 'Available commands:\n  help - Show this help\n  echo <text> - Echo text\n  ls - List files\n  pwd - Print working directory\n  clear - Clear terminal\n  date - Show current date\n  cd <dir> - Change directory\n  mkdir <dir> - Create directory\n  touch <file> - Create file\n  cat <file> - Display file contents'
        break
      case 'echo':
        output = args.slice(1).join(' ')
        break
      case 'ls':
        const files = get().listFilesInDir(cwd)
        output = files.length === 0 ? 'No files found' : files.join('  ')
        break
      case 'pwd':
        output = cwd
        break
      case 'clear':
        output = '' // Special case, handled in component
        break
      case 'date':
        output = new Date().toString()
        break
      case 'cd':
        if (args.length < 2) {
          output = 'Usage: cd <directory>'
        } else {
          const target = args[1]
          if (target === '..') {
            if (cwd !== '/') {
              const parts = cwd.split('/').filter(Boolean)
              parts.pop()
              const newCwd = '/' + parts.join('/')
              get().updateTerminalCwd(terminalId, newCwd === '/' ? '/' : newCwd + '/')
              output = ''
            } else {
              output = ''
            }
          } else {
            const files = get().listFilesInDir(cwd)
            if (files.includes(target + '/')) {
              let newCwd = cwd
              if (!newCwd.endsWith('/')) newCwd += '/'
              newCwd += target + '/'
              get().updateTerminalCwd(terminalId, newCwd)
              output = ''
            } else {
              output = `cd: no such file or directory: ${target}`
            }
          }
        }
        break
      case 'mkdir':
        if (args.length < 2) {
          output = 'Usage: mkdir <directory>'
        } else {
          output = `Created directory: ${args[1]}`
        }
        break
      case 'touch':
        if (args.length < 2) {
          output = 'Usage: touch <file>'
        } else {
          output = `Created file: ${args[1]}`
        }
        break
      case 'cat':
        if (args.length < 2) {
          output = 'Usage: cat <file>'
        } else {
          const fileName = args[1]
          const files = get().listFilesInDir(cwd)
          if (files.includes(fileName)) {
            output = `Contents of ${fileName}:\n[File contents would be displayed here]`
          } else {
            output = `cat: ${fileName}: No such file or directory`
          }
        }
        break
      default:
        output = `Command not found: ${cmd}\nType 'help' for available commands.`
    }
    return output
  },

  // Autosave controls
  setAutosaveEnabled: (enabled) => set({ autosaveEnabled: enabled }),
  toggleAutosave: () => set({ autosaveEnabled: !get().autosaveEnabled }),
  scheduleAutosave: (fileId) => {
    const win = typeof window !== 'undefined' ? window : null
    if (!win) return
    const timers = (get().__autosaveTimers ||= new Map())
    const prev = timers.get(fileId)
    if (prev) {
      try { win.clearTimeout(prev) } catch {}
    }
    const timeout = win.setTimeout(() => {
      // Only save if still dirty
      const dirty = get().dirtyMap.get(fileId)
      if (dirty) {
        const prevActive = get().activeTabId
        set({ activeTabId: fileId })
        get().saveActiveFile()
        set({ activeTabId: prevActive })
      }
    }, get().autosaveDebounceMs)
    timers.set(fileId, timeout)
  },

  // Session persistence
  saveSession: () => {
    try {
      const data = {
        openTabs: get().openTabs.map(t => t.id),
        activeTabId: get().activeTabId,
        layoutMode: get().layoutMode,
        sidebarVisible: get().sidebarVisible,
        theme: get().theme,
        autosaveEnabled: get().autosaveEnabled,
      }
      localStorage.setItem('vs_editor_session', JSON.stringify(data))
    } catch {}
  },
  loadSession: async () => {
    try {
      const raw = localStorage.getItem('vs_editor_session')
      if (!raw) return
      const data = JSON.parse(raw)
      if (typeof data.autosaveEnabled === 'boolean') set({ autosaveEnabled: data.autosaveEnabled })
      if (data.layoutMode) set({ layoutMode: data.layoutMode })
      if (typeof data.sidebarVisible === 'boolean') set({ sidebarVisible: data.sidebarVisible })
      if (data.theme) set({ theme: data.theme })
      if (Array.isArray(data.openTabs) && data.openTabs.length > 0) {
        for (let i = 0; i < data.openTabs.length; i++) {
          // Sequentially open tabs to populate content map
          const p = data.openTabs[i]
          // eslint-disable-next-line no-await-in-loop
          await get().openFile(p)
        }
        if (data.activeTabId) set({ activeTabId: data.activeTabId })
        get().updatePanelsForLayout()
      }
      set({ sessionLoaded: true })
    } catch {}
  },
}))


