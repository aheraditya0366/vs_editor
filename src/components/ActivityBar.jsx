import React from 'react'
import { useEditorStore } from '../store/editorStore'

const icons = {
  explorer: '📁',
  search: '🔍',
  sourceControl: '📋',
  runAndDebug: '▶️',
  extensions: '📦',
  accounts: '👤',
}

export default function ActivityBar({ onToggleSidebar }) {
  const activeView = useEditorStore((s) => s.activeView)
  const setActiveView = useEditorStore((s) => s.setActiveView)
  const sidebarVisible = useEditorStore((s) => s.sidebarVisible)
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar)

  const handleViewClick = (viewName) => {
    if (activeView === viewName) {
      // Same view clicked - only toggle sidebar if it's the explorer view
      if (viewName === 'explorer') {
        if (onToggleSidebar) {
          onToggleSidebar()
        } else {
          toggleSidebar()
        }
      }
    } else {
      // Different view clicked - switch to new view
      setActiveView(viewName)
      // Only ensure sidebar is visible if switching TO explorer view
      if (viewName === 'explorer' && !sidebarVisible) {
        if (onToggleSidebar) {
          onToggleSidebar()
        } else {
          toggleSidebar()
        }
      }
    }
  }

  return (
    <nav className="activity-bar" aria-label="Activity Bar">
      <button
        className={`activity-btn ${activeView === 'explorer' ? 'active' : ''}`}
        onClick={() => handleViewClick('explorer')}
        title="Explorer (Ctrl+Shift+E)"
        aria-pressed={activeView === 'explorer'}
      >
        {icons.explorer}
      </button>
      <button
        className={`activity-btn ${activeView === 'search' ? 'active' : ''}`}
        onClick={() => handleViewClick('search')}
        title="Search (Ctrl+Shift+F)"
        aria-pressed={activeView === 'search'}
      >
        {icons.search}
      </button>
      <button
        className={`activity-btn ${activeView === 'sourceControl' ? 'active' : ''}`}
        onClick={() => handleViewClick('sourceControl')}
        title="Source Control (Ctrl+Shift+G)"
        aria-pressed={activeView === 'sourceControl'}
      >
        {icons.sourceControl}
      </button>
      <button
        className={`activity-btn ${activeView === 'runAndDebug' ? 'active' : ''}`}
        onClick={() => handleViewClick('runAndDebug')}
        title="Run and Debug (Ctrl+Shift+D)"
        aria-pressed={activeView === 'runAndDebug'}
      >
        {icons.runAndDebug}
      </button>
      <button
        className={`activity-btn ${activeView === 'extensions' ? 'active' : ''}`}
        onClick={() => handleViewClick('extensions')}
        title="Extensions (Ctrl+Shift+X)"
        aria-pressed={activeView === 'extensions'}
      >
        {icons.extensions}
      </button>
      <div className="activity-bar-divider"></div>
      <button
        className={`activity-btn ${activeView === 'accounts' ? 'active' : ''}`}
        onClick={() => handleViewClick('accounts')}
        title="Accounts"
        aria-pressed={activeView === 'accounts'}
      >
        {icons.accounts}
      </button>
    </nav>
  )
}

