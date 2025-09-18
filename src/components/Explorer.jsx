import { useState, Fragment } from 'react'
import { useEditorStore } from '../store/editorStore'

function TreeNode({ node }) {
  const openFile = useEditorStore((s) => s.openFile)
  const [expanded, setExpanded] = useState(false) // Start collapsed by default like VS Code

  if (node.type === 'folder') {
    return (
      <div>
        <div 
          className="tree-item folder" 
          onClick={() => setExpanded(!expanded)}
          style={{ 
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none'
          }}
        >
          <span style={{ marginRight: '4px', fontSize: '10px' }}>
            {expanded ? '▾' : '▸'}
          </span>
          📁 {node.name}
        </div>
        {expanded && node.children && (
          <div style={{ paddingLeft: 16 }}>
            {node.children
              .sort((a, b) => {
                // Sort folders first, then files
                if (a.type === 'folder' && b.type === 'file') return -1
                if (a.type === 'file' && b.type === 'folder') return 1
                return a.name.localeCompare(b.name)
              })
              .map((child) => (
                <TreeNode key={child.id} node={child} />
              ))}
          </div>
        )}
      </div>
    )
  }

  // File node - use node.id which is the path in your store
  return (
    <div 
      className="tree-item file" 
      onClick={() => openFile(node.id)}
      style={{ 
        cursor: 'pointer',
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none'
      }}
    >
      <span style={{ marginRight: '4px' }}>📄</span>
      {node.name}
    </div>
  )
}

export default function Explorer() {
  const tree = useEditorStore((s) => s.tree)
  const openFolder = useEditorStore((s) => s.openFolder)
  const rootDirectoryHandle = useEditorStore((s) => s.rootDirectoryHandle)

  return (
    <div className="tree" style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 8,
        padding: '4px 8px',
        borderBottom: '1px solid #2a2a2a'
      }}>
        <div style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: '#cccccc' }}>
          Explorer
        </div>
        <button 
          onClick={openFolder}
          style={{ 
            fontSize: 11, 
            padding: '3px 8px', 
            cursor: 'pointer',
            border: '1px solid #2a2a2a',
            borderRadius: '3px',
            backgroundColor: '#1e1e1e',
            color: '#cccccc'
          }}
        >
          Open Folder
        </button>
      </div>
      
      {tree.length === 0 && !rootDirectoryHandle && (
        <div style={{ 
          padding: '16px 8px', 
          color: '#888', 
          fontSize: '12px',
          textAlign: 'center'
        }}>
          No folder opened
        </div>
      )}
      
      {tree.map((n) => (
        <Fragment key={n.id}>
          <TreeNode node={n} />
        </Fragment>
      ))}
    </div>
  )
}