import { useEditorStore } from '../store/editorStore'

export default function StatusBar() {
  const { lineNumber, column, eol, tabSize, insertSpaces, language } = useEditorStore((s) => s.editorStatus)
  const activeId = useEditorStore((s) => s.activeTabId)

  return (
    <div className="statusbar">
      <div className="status-left">
        <span className="status-chip" title="Source Control">∞ Agents</span>
        <span className="status-chip" title="Problems">× 0 △ 0</span>
        <span className="status-file" title={activeId || ''}>{activeId || 'No file'}</span>
      </div>
      <div className="status-right">
        <span className="status-chip" title="Cursor Position">Ln {lineNumber}, Col {column}</span>
        <span className="status-chip" title="Indentation">{insertSpaces ? 'Spaces' : 'Tabs'}: {tabSize}</span>
        <span className="status-chip" title="End of Line">{eol}</span>
        <span className="status-chip" title="Encoding">UTF-8</span>
        <span className="status-chip" title="Language">{language || 'Plain Text'}</span>
        <span className="status-chip clickable" title="Go Live">Go Live</span>
        <span className="status-chip" title="Formatter">✓ Prettier</span>
        <span className="status-chip" title="Notifications">🔔</span>
      </div>
    </div>
  )
}


