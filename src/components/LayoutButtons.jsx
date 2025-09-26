import React from 'react'
import { useEditorStore } from '../store/editorStore'

const layoutButtons = [
  { mode: 'single', title: 'Single Panel', icon: '▭' },
  { mode: 'vertical-split', title: 'Vertical Split', icon: '▮▮' },
  { mode: 'horizontal-split', title: 'Horizontal Split', icon: '▯\n▯' },
  { mode: 'grid', title: 'Grid Layout', icon: '▦' },
]

export default function LayoutButtons() {
  const layoutMode = useEditorStore((s) => s.layoutMode)
  const setLayoutMode = useEditorStore((s) => s.setLayoutMode)

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {layoutButtons.map(({ mode, title, icon }) => (
        <button
          key={mode}
          title={title}
          onClick={() => setLayoutMode(mode)}
          className={`icon-btn${layoutMode === mode ? ' active' : ''}`}
          style={{ fontSize: 18, whiteSpace: 'pre-line' }}
          aria-label={title}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}
