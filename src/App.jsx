import './App.css'
import Explorer from './components/Explorer.jsx'
import TabBar from './components/TabBar.jsx'
import CodeEditor from './components/CodeEditor.jsx'
import Navbar from './components/Navbar.jsx'
import StatusBar from './components/StatusBar.jsx'
import Terminal from './components/Terminal.jsx'
import ActivityBar from './components/ActivityBar.jsx'
import SourceControl from './components/SourceControl.jsx'
import RunAndDebug from './components/RunAndDebug.jsx'
import Extensions from './components/Extensions.jsx'
import Accounts from './components/Accounts.jsx'
import { useEditorStore } from './store/editorStore.js'
import { useState, useEffect } from 'react'
import LayoutButtons from './components/LayoutButtons.jsx'

function App() {
  const sidebarVisible = useEditorStore((s) => s.sidebarVisible)
  const theme = useEditorStore((s) => s.theme)
  const terminalVisible = useEditorStore((s) => s.terminalVisible)
  const activeView = useEditorStore((s) => s.activeView)
  const toggleSidebar = useEditorStore((s) => s.toggleSidebar)
  const layoutMode = useEditorStore((s) => s.layoutMode)
  const activeTabId = useEditorStore((s) => s.activeTabId)
  const openTabs = useEditorStore((s) => s.openTabs)
  const openFile = useEditorStore((s) => s.openFile)
  const updatePanelsForLayout = useEditorStore((s) => s.updatePanelsForLayout)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (!activeTabId && openTabs.length === 0) {
      // Open first file in tree automatically
      const firstFile = findFirstFile()
      if (firstFile) {
        openFile(firstFile)
      }
    } else if (!activeTabId && openTabs.length > 0) {
      // Set activeTabId to first open tab
      openFile(openTabs[0].id)
    }
  }, [activeTabId, openTabs, openFile])

  const findFirstFile = () => {
    const tree = useEditorStore.getState().tree
    const findFile = (nodes) => {
      for (const node of nodes) {
        if (node.type === 'file') return node.id
        if (node.children) {
          const found = findFile(node.children)
          if (found) return found
        }
      }
      return null
    }
    return findFile(tree)
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 700)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleToggleSidebar = () => {
    toggleSidebar()
  }

  const activeTabIdsPerPanel = useEditorStore((s) => s.activeTabIdsPerPanel)

  const renderLayout = () => {
    switch (layoutMode) {
      case 'single':
        return (
          <>
            <TabBar panelId="single" />
            <CodeEditor tabId={activeTabIdsPerPanel.single} />
          </>
        )
      case 'vertical-split':
        return (
          <div style={{ display: 'flex', height: '100%' }}>
            <div style={{ flex: 1, borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="verticalSplitLeft" />
              <CodeEditor tabId={activeTabIdsPerPanel.verticalSplitLeft} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="verticalSplitRight" />
              <CodeEditor tabId={activeTabIdsPerPanel.verticalSplitRight} />
            </div>
          </div>
        )
      case 'horizontal-split':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, borderBottom: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="horizontalSplitTop" />
              <CodeEditor tabId={activeTabIdsPerPanel.horizontalSplitTop} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="horizontalSplitBottom" />
              <CodeEditor tabId={activeTabIdsPerPanel.horizontalSplitBottom} />
            </div>
          </div>
        )
      case 'grid':
        return (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            height: '100%',
            gap: '1px',
          }}>
            <div style={{ borderRight: '1px solid #2a2a2a', borderBottom: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="gridTopLeft" />
              <CodeEditor tabId={activeTabIdsPerPanel.gridTopLeft} />
            </div>
            <div style={{ borderBottom: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="gridTopRight" />
              <CodeEditor tabId={activeTabIdsPerPanel.gridTopRight} />
            </div>
            <div style={{ borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="gridBottomLeft" />
              <CodeEditor tabId={activeTabIdsPerPanel.gridBottomLeft} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <TabBar panelId="gridBottomRight" />
              <CodeEditor tabId={activeTabIdsPerPanel.gridBottomRight} />
            </div>
          </div>
        )
      default:
        return <CodeEditor tabId={activeTabIdsPerPanel.single} />
    }
  }

  return (
    <div className={`app theme-${theme} ${terminalVisible ? 'terminal-visible' : ''} ${isMobile ? 'mobile' : ''}`}>
      <Navbar />
      <ActivityBar onToggleSidebar={handleToggleSidebar} />
      <aside className={`sidebar ${sidebarVisible ? '' : 'hidden'}`}>
        {activeView === 'explorer' && <Explorer />}
        {activeView === 'search' && (
          <div style={{ padding: 16, color: '#888', fontSize: 14 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, color: '#cccccc' }}>
              Search
            </div>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ marginBottom: 8 }}>Search functionality</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                Use Ctrl+Shift+F to search in files
              </div>
            </div>
          </div>
        )}
        {activeView === 'sourceControl' && <SourceControl />}
        {activeView === 'runAndDebug' && <RunAndDebug />}
        {activeView === 'extensions' && <Extensions />}
        {activeView === 'accounts' && <Accounts />}
      </aside>
      <section className="workbench">
        {renderLayout()}
      </section>
      {terminalVisible && <Terminal />}
      <StatusBar />

      {/* Mobile overlay */}
      {isMobile && sidebarVisible && (
        <div
          className="mobile-overlay"
          onClick={() => toggleSidebar()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 25
          }}
        />
      )}
    </div>
  )
}

export default App;
