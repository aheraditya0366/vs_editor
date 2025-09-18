//src/store/editorStore.js
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

export const useEditorStore = create((set, get) => ({
  tree: initialTree,
  fileContentMap: initialFiles,
  openTabs: [], // [{ id, path, name, dirty? }]
  activeTabId: null,
  rootDirectoryHandle: null,
  fileHandles: new Map(), // path -> FileSystemFileHandle
  dirtyMap: new Map(), // path -> boolean
  // Navigation & layout
  history: [], // array of tab ids
  historyIndex: -1,
  sidebarVisible: true,
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'dark',
  editorStatus: {
    lineNumber: 1,
    column: 1,
    eol: 'LF',
    tabSize: 2,
    insertSpaces: true,
    language: 'plaintext',
  },

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
    } catch (e) {
      // cancelled
    }
  },

  openFile: async (path) => {
    const name = path.split('/').pop()
    const exists = get().openTabs.find((t) => t.id === path)
    const nextTabs = exists ? get().openTabs : [...get().openTabs, { id: path, path, name }]
    if (!get().fileContentMap.has(path) && get().fileHandles.has(path)) {
      try {
        const fh = get().fileHandles.get(path)
        const text = await readHandleText(fh)
        const map = new Map(get().fileContentMap)
        map.set(path, text)
        set({ fileContentMap: map })
      } catch {}
    }
    set({ openTabs: nextTabs, activeTabId: path })
    get().pushHistory(path)
  },

  closeTab: (id) => {
    const tabs = get().openTabs.filter((t) => t.id !== id)
    let nextActive = get().activeTabId
    if (id === nextActive) nextActive = tabs.length ? tabs[tabs.length - 1].id : null
    set({ openTabs: tabs, activeTabId: nextActive })
  },

  activateTab: (id) => {
    set({ activeTabId: id })
    get().pushHistory(id)
  },

  getActiveContent: () => {
    const id = get().activeTabId
    if (!id) return ''
    return get().fileContentMap.get(id) ?? ''
  },

  updateActiveContent: (newValue) => {
    const id = get().activeTabId
    if (!id) return
    const map = new Map(get().fileContentMap)
    map.set(id, newValue)
    const dirty = new Map(get().dirtyMap)
    dirty.set(id, true)
    const tabs = get().openTabs.map((t) => (t.id === id ? { ...t, dirty: true } : t))
    set({ fileContentMap: map, dirtyMap: dirty, openTabs: tabs })
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
    }
  },
  goForward: () => {
    const { historyIndex, history } = get()
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1
      const id = history[idx]
      set({ historyIndex: idx, activeTabId: id })
    }
  },
  toggleSidebar: () => set({ sidebarVisible: !get().sidebarVisible }),

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: next })
    try { localStorage.setItem('theme', next) } catch {}
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
}))

