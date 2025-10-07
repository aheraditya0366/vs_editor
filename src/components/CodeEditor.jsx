import Editor from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { useEditorStore } from '../store/editorStore'

export default function CodeEditor({ tabId }) {
  const value = useEditorStore((s) => s.fileContentMap.get(tabId) ?? '')
  const update = useEditorStore((s) => s.updateActiveContent)
  const save = useEditorStore((s) => s.saveActiveFile)
  const setStatus = useEditorStore((s) => s.updateEditorStatus)
  const theme = useEditorStore((s) => s.theme)
  const pendingCursor = useEditorStore((s) => s.pendingCursorLocation)
  const consumePendingCursor = useEditorStore((s) => s.consumePendingCursorLocation)
  const editorRef = useRef(null)

  const language = (() => {
    if (!tabId) return 'javascript'
    if (tabId.endsWith('.jsx')) return 'javascript'
    if (tabId.endsWith('.js')) return 'javascript'
    if (tabId.endsWith('.css')) return 'css'
    if (tabId.endsWith('.html')) return 'html'
    return 'plaintext'
  })()

  // Jump to pending cursor when requested by store
  useEffect(() => {
    if (!editorRef.current) return
    if (!pendingCursor) return
    if (!tabId || pendingCursor.id !== tabId) return
    const target = { lineNumber: pendingCursor.lineNumber || 1, column: pendingCursor.column || 1 }
    const editor = editorRef.current
    try {
      editor.revealPositionInCenter(target)
      editor.setPosition(target)
      editor.focus()
    } finally {
      consumePendingCursor()
    }
  }, [pendingCursor, tabId, consumePendingCursor])

  if (!tabId) {
    return (
      <div className="editor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
        <div>No file open. Use Explorer or Quick Open to select a file.</div>
      </div>
    )
  }

  return (
    <div className="editor">
      <Editor
        height="100%"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        language={language}
        value={value}
        onChange={(v) => update(v ?? '', tabId)}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        onMount={(editor, monaco) => {
          editorRef.current = editor
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            save()
          })
          const updateCursor = () => {
            const pos = editor.getPosition()
            if (!pos) return
            setStatus({ lineNumber: pos.lineNumber, column: pos.column })
          }
          editor.onDidChangeCursorPosition(updateCursor)
          updateCursor()
          const model = editor.getModel()
          if (model) {
            const eol = model.getEOL() === '\n' ? 'LF' : 'CRLF'
            const { insertSpaces, tabSize } = model.getOptions()
            setStatus({ eol, insertSpaces, tabSize, language })
            model.onDidChangeOptions(() => {
              const opts = model.getOptions()
              setStatus({ insertSpaces: opts.insertSpaces, tabSize: opts.tabSize })
            })
          }
        }}
      />
    </div>
  )
}



