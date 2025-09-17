import { useEditorStore } from '../store/editorStore'

export default function TabBar() {
  const tabs = useEditorStore((s) => s.openTabs)
  const activeId = useEditorStore((s) => s.activeTabId)
  const activateTab = useEditorStore((s) => s.activateTab)
  const closeTab = useEditorStore((s) => s.closeTab)

  return (
    <div className="tabbar">
      {tabs.map((t) => (
        <div
          key={t.id}
          className={`tab ${t.id === activeId ? 'active' : ''}`}
          onClick={() => activateTab(t.id)}
        >
          <span>{t.dirty ? `${t.name} *` : t.name}</span>
          <button
            aria-label={`Close ${t.name}`}
            onClick={(e) => {
              e.stopPropagation()
              closeTab(t.id)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}


