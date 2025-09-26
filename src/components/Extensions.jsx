import React from 'react'

export default function Extensions() {
  return (
    <div className="extensions">
      <div className="header">Extensions</div>
      <div style={{ padding: 16, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
        <div style={{ marginBottom: 8 }}>No extensions installed yet</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          Browse and install extensions from the marketplace
        </div>
      </div>
    </div>
  )
}
