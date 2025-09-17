import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

function Menubar() {
  const items = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help']
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <img src="/vite.svg" alt="logo" width={18} height={18} />
      {items.map((label) => (
        <span key={label} style={{ opacity: 0.85, fontSize: 13 }}>{label}</span>
      ))}
    </div>
  )
}

function HistoryControls() {
  const goBack = useEditorStore((s) => s.goBack)
  const goForward = useEditorStore((s) => s.goForward)
  const historyIndex = useEditorStore((s) => s.historyIndex)
  const historyLen = useEditorStore((s) => s.history.length)
  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex >= 0 && historyIndex < historyLen - 1
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
      <button title="Back" onClick={goBack} disabled={!canGoBack} className="icon-btn">←</button>
      <button title="Forward" onClick={goForward} disabled={!canGoForward} className="icon-btn">→</button>
    </div>
  )
}

function QuickOpen() {
  const listAllFiles = useEditorStore((s) => s.listAllFiles)
  const tree = useEditorStore((s) => s.tree)
  const openFile = useEditorStore((s) => s.openFile)
  const [query, setQuery] = useState('')
  const [focusIndex, setFocusIndex] = useState(0)
  const inputRef = useRef(null)

  const files = useMemo(() => {
    const q = query.toLowerCase().trim()
    const all = listAllFiles()
    if (!q) return all.slice(0, 50)
    return all.filter(f => f.path.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)).slice(0, 50)
  }, [query, listAllFiles, tree])

  useEffect(() => {
    setFocusIndex(0)
  }, [query])

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search files"
        style={{ width: '100%', background: '#202020', border: '1px solid #333', color: '#ddd', height: 24, borderRadius: 6, padding: '0 10px' }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIndex((i) => Math.min(i + 1, files.length - 1)) }
          if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIndex((i) => Math.max(i - 1, 0)) }
          if (e.key === 'Enter') {
            const f = files[focusIndex]
            if (f) {
              openFile(f.path)
              setQuery('')
            }
          }
        }}
      />
      {files.length > 0 && query && (
        <div style={{ position: 'absolute', top: 28, left: 0, right: 0, background: '#202020', border: '1px solid #333', borderRadius: 6, zIndex: 10, maxHeight: 240, overflow: 'auto' }}>
          {files.map((f, i) => (
            <div key={f.path} onMouseDown={() => { openFile(f.path); setQuery('') }} style={{ padding: '6px 10px', background: i === focusIndex ? '#2a2a2a' : 'transparent', cursor: 'pointer' }}>
              {f.path}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Navbar() {
  const openFolder = useEditorStore((s) => s.openFolder)
  const save = useEditorStore((s) => s.saveActiveFile)
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar)
  const toggleTheme = useEditorStore((s) => s.toggleTheme)
  const activeId = useEditorStore((s) => s.activeTabId)

  return (
    <div className="navbar">
      <Menubar />
      <HistoryControls />
      <QuickOpen />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button title="Toggle Theme" onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme">🌓</button>
        <button title="Toggle Sidebar" onClick={toggleSidebar} className="icon-btn" aria-label="Toggle Sidebar">☰</button>
        <button onClick={openFolder} className="primary-btn">Open</button>
        <button onClick={save} disabled={!activeId} className="primary-btn">Save</button>
      </div>
    </div>
  )
}


