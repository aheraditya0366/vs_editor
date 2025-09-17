import { useState, Fragment } from 'react'
import { useEditorStore } from '../store/editorStore'

function TreeNode({ node }) {
  const openFile = useEditorStore((s) => s.openFile)
  const [expanded, setExpanded] = useState(true)

  if (node.type === 'folder') {
    return (
      <div>
        <div className="tree-item folder" onClick={() => setExpanded(!expanded)}>
          {expanded ? '▾' : '▸'} {node.name}
        </div>
        {expanded && (
          <div style={{ paddingLeft: 12 }}>
            {node.children?.map((child) => (
              <TreeNode key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="tree-item" onClick={() => openFile(node.id)}>
      {node.name}
    </div>
  )
}

export default function Explorer() {
  const tree = useEditorStore((s) => s.tree)
  const openFolder = useEditorStore((s) => s.openFolder)

  return (
    <div className="tree">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Explorer</div>
        <button onClick={openFolder} style={{ fontSize: 12, padding: '2px 6px', cursor: 'pointer' }}>Open Folder</button>
      </div>
      {tree.map((n) => (
        <Fragment key={n.id}>
          <TreeNode node={n} />
        </Fragment>
      ))}
    </div>
  )
}


