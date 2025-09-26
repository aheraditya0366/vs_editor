import React from 'react'

export default function SourceControl() {
  return (
    <div className="source-control">
      <div className="header">Source Control</div>
      <div style={{ padding: 16, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <div style={{ marginBottom: 8 }}>No source control providers registered</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          Git integration would appear here
        </div>
      </div>
    </div>
  )
}

