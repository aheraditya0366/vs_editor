import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function Search() {
  const searchFiles = useEditorStore((s) => s.searchFiles)
  const openFileAt = useEditorStore((s) => s.openFileAt)
  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [focusIndex, setFocusIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const runSearch = async () => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const res = await searchFiles(query, { caseSensitive, useRegex, maxResults: 500 })
    setResults(res)
    setFocusIndex(0)
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') runSearch()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusIndex((i) => Math.min(i + 1, results.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusIndex((i) => Math.max(i - 1, 0))
    }
  }

  const openSelected = (r) => {
    if (!r) return
    openFileAt(r.path, r.lineNumber, r.column)
  }

  return (
    <div style={{ padding: 12, color: '#ccc', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#ccc' }}>Search</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search files (Ctrl+Shift+F)"
          style={{ flex: 1, background: '#202020', border: '1px solid #333', color: '#ddd', borderRadius: 6, padding: '6px 8px' }}
        />
        <button onClick={runSearch} className="primary-btn" disabled={loading}>Search</button>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
          Case sensitive
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" checked={useRegex} onChange={(e) => setUseRegex(e.target.checked)} />
          Use regex
        </label>
        <div style={{ marginLeft: 'auto', opacity: 0.7 }}>{loading ? 'Searching…' : `${results.length} results`}</div>
      </div>
      <div style={{ maxHeight: 'calc(100vh - 180px)', overflow: 'auto', borderTop: '1px solid #2a2a2a' }}>
        {results.map((r, i) => (
          <div
            key={`${r.path}:${r.lineNumber}:${r.column}:${i}`}
            onDoubleClick={() => openSelected(r)}
            onClick={() => setFocusIndex(i)}
            style={{
              padding: '6px 8px',
              background: i === focusIndex ? '#2a2a2a' : 'transparent',
              cursor: 'pointer',
              borderBottom: '1px solid #1f1f1f',
            }}
          >
            <div style={{ fontWeight: 600, color: '#ddd' }}>{r.path}</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>Ln {r.lineNumber}, Col {r.column}</div>
            <div style={{ fontFamily: 'monospace', whiteSpace: 'pre', color: '#bbb' }}>{r.lineText}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
