import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

function Menubar() {
  const toggleTerminal = useEditorStore((s) => s.toggleTerminal)
  const items = ['File', 'Edit', 'Selection', 'View', 'Go', 'Run', 'Terminal', 'Help']
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <img src="/vite.svg" alt="logo" width={18} height={18} />
      {items.map((label) => (
        <span
          key={label}
          style={{ opacity: 0.85, fontSize: 13, cursor: label === 'Terminal' ? 'pointer' : 'default' }}
          onClick={label === 'Terminal' ? toggleTerminal : undefined}
        >
          {label}
        </span>
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
  const [isOpen, setIsOpen] = useState(false)
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(true)
        inputRef.current?.focus()
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSelect = (file) => {
    openFile(file.path)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        placeholder="Search files (⌘K)"
        style={{
          width: '100%',
          background: '#202020',
          border: '1px solid #333',
          color: '#ddd',
          height: 24,
          borderRadius: 6,
          padding: '0 10px',
          fontSize: 13
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setFocusIndex((i) => Math.min(i + 1, files.length - 1))
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault()
            setFocusIndex((i) => Math.max(i - 1, 0))
          }
          if (e.key === 'Enter') {
            const f = files[focusIndex]
            if (f) {
              handleSelect(f)
            }
          }
        }}
      />
      {files.length > 0 && isOpen && (
        <div style={{
          position: 'absolute',
          top: 28,
          left: 0,
          right: 0,
          background: '#202020',
          border: '1px solid #333',
          borderRadius: 6,
          zIndex: 10,
          maxHeight: 240,
          overflow: 'auto'
        }}>
          {files.map((f, i) => (
            <div
              key={f.path}
              onMouseDown={() => handleSelect(f)}
              style={{
                padding: '6px 10px',
                background: i === focusIndex ? '#2a2a2a' : 'transparent',
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              <div style={{ fontWeight: 600 }}>{f.name}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{f.path}</div>
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
  const saveAll = useEditorStore((s) => s.saveAllFiles)
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar)
  const toggleTheme = useEditorStore((s) => s.toggleTheme)
  const activeId = useEditorStore((s) => s.activeTabId)
  const layoutMode = useEditorStore((s) => s.layoutMode)
  const setLayoutMode = useEditorStore((s) => s.setLayoutMode)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        save()
      }
      if (e.key.toLowerCase() === 's' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        saveAll()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [save, saveAll])

  const layoutButtons = [
    { mode: 'single', title: 'Single Panel', icon: '▭' },
    { mode: 'vertical-split', title: 'Vertical Split', icon: '▮▮' },
    { mode: 'horizontal-split', title: 'Horizontal Split', icon: '▯\u000A▯' },
    { mode: 'grid', title: 'Grid Layout', icon: '▦' },
  ]

  return (
    <div className="navbar">
      <Menubar />
      <HistoryControls />
      <QuickOpen />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {layoutButtons.map(({ mode, title, icon }) => (
          <button
            key={mode}
            title={title}
            onClick={() => setLayoutMode(mode)}
            className={`icon-btn${layoutMode === mode ? ' active' : ''}`}
            style={{ fontSize: 18, whiteSpace: 'pre-line' }}
            aria-label={title}
          >
            {icon}
          </button>
        ))}
        <button title="Toggle Theme" onClick={toggleTheme} className="icon-btn" aria-label="Toggle Theme">🌓</button>
        <button title="Toggle Sidebar" onClick={toggleSidebar} className="icon-btn" aria-label="Toggle Sidebar">☰</button>
        <button onClick={openFolder} className="primary-btn">Open</button>
        <button onClick={save} disabled={!activeId} className="primary-btn">Save</button>
        <button onClick={saveAll} className="primary-btn" title="Save All (Ctrl+Shift+S)">Save All</button>
      </div>
    </div>
  )
}
