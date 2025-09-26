import { useState, Fragment } from 'react'
import { useEditorStore } from '../store/editorStore'

function TreeNode({ node, onContextMenu }) {
  const openFile = useEditorStore((s) => s.openFile)
  const [expanded, setExpanded] = useState(false)
  const [selected, setSelected] = useState(false)

  const handleClick = (e) => {
    e.stopPropagation()
    if (node.type === 'folder') {
      setExpanded(!expanded)
    } else {
      openFile(node.id)
      setSelected(true)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (onContextMenu) {
      onContextMenu(e, node)
    }
  }

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className={`tree-item folder ${selected ? 'selected' : ''}`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            userSelect: 'none',
            borderRadius: '6px',
            transition: 'all 160ms ease'
          }}
        >
          <span
            style={{ marginRight: '4px', fontSize: '10px', transition: 'transform 160ms ease' }}
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? '▾' : '▸'}
          </span>
          📁 {node.name}
        </div>
        {expanded && node.children && (
          <div style={{ paddingLeft: 16 }}>
            {node.children
              .sort((a, b) => {
                if (a.type === 'folder' && b.type === 'file') return -1
                if (a.type === 'file' && b.type === 'folder') return 1
                return a.name.localeCompare(b.name)
              })
              .map((child) => (
                <TreeNode key={child.id} node={child} onContextMenu={onContextMenu} />
              ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`tree-item file ${selected ? 'selected' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        cursor: 'pointer',
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
        borderRadius: '6px',
        transition: 'all 160ms ease'
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
  const [contextMenu, setContextMenu] = useState(null)

  const handleContextMenu = (e, node) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node
    })
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const handleMenuAction = (action, node) => {
    console.log(`${action} on ${node.name}`)
    closeContextMenu()
  }

  return (
    <div className="tree" style={{ height: '100%', overflow: 'auto' }} onClick={closeContextMenu}>
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
          <TreeNode node={n} onContextMenu={handleContextMenu} />
        </Fragment>
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
        >
          <div
            className="context-menu-item"
            onClick={() => handleMenuAction('open', contextMenu.node)}
          >
            📁 Open
          </div>
          <div
            className="context-menu-item"
            onClick={() => handleMenuAction('rename', contextMenu.node)}
          >
            ✏️ Rename
          </div>
          <div className="context-menu-separator" />
          <div
            className="context-menu-item danger"
            onClick={() => handleMenuAction('delete', contextMenu.node)}
          >
            🗑️ Delete
          </div>
        </div>
      )}
    </div>
  )
}
