import { useEditorStore } from '../store/editorStore'

export default function TabBar({ panelId }) {
  const tabs = useEditorStore((s) => s.openTabs)
  const activeTabIdsPerPanel = useEditorStore((s) => s.activeTabIdsPerPanel)
  const setActiveTabForPanel = useEditorStore((s) => s.setActiveTabForPanel)
  const closeTab = useEditorStore((s) => s.closeTab)

  const activeId = activeTabIdsPerPanel[panelId] || null

  // Filter unique tabs by id to prevent duplicates
  const uniqueTabsMap = new Map()
  tabs.forEach(t => {
    if (!uniqueTabsMap.has(t.id)) {
      uniqueTabsMap.set(t.id, t)
    }
  })
  const uniqueTabs = Array.from(uniqueTabsMap.values())

  return (
    <div className="tabbar">
      {uniqueTabs.map((t) => (
        <div
          key={t.id}
          className={`tab ${t.id === activeId ? 'active' : ''}`}
          onClick={() => setActiveTabForPanel(panelId, t.id)}
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


