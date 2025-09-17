import Editor from '@monaco-editor/react'
import { useEditorStore } from '../store/editorStore'

export default function CodeEditor() {
  const activeId = useEditorStore((s) => s.activeTabId)
  const value = useEditorStore((s) => s.getActiveContent())
  const update = useEditorStore((s) => s.updateActiveContent)
  const save = useEditorStore((s) => s.saveActiveFile)
  const setStatus = useEditorStore((s) => s.updateEditorStatus)
  const theme = useEditorStore((s) => s.theme)

  const language = (() => {
    if (!activeId) return 'javascript'
    if (activeId.endsWith('.jsx')) return 'javascript'
    if (activeId.endsWith('.js')) return 'javascript'
    if (activeId.endsWith('.css')) return 'css'
    if (activeId.endsWith('.html')) return 'html'
    return 'plaintext'
  })()

  return (
    <div className="editor">
      <Editor
        height="100%"
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        language={language}
        value={value}
        onChange={(v) => update(v ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        onMount={(editor, monaco) => {
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


