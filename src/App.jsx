import './App.css'
import Explorer from './components/Explorer'
import TabBar from './components/TabBar'
import CodeEditor from './components/CodeEditor'
import Navbar from './components/Navbar'
import StatusBar from './components/StatusBar'
import { useEditorStore } from './store/editorStore'

function App() {
  const sidebarVisible = useEditorStore((s) => s.sidebarVisible)
  const theme = useEditorStore((s) => s.theme)
  return (
    <div className={`app theme-${theme}`}>
      <Navbar />
      <aside className={`sidebar ${sidebarVisible ? '' : 'hidden'}`}>
        <Explorer />
      </aside>
      <section className="workbench">
        <TabBar />
        <CodeEditor />
        <StatusBar />
      </section>
    </div>
  )
}

export default App
