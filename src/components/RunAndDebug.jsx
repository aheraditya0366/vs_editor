import React from 'react'

export default function RunAndDebug() {
  return (
    <div className="run-debug">
      <div className="header">Run and Debug</div>
      <div style={{ padding: 16, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>▶️</div>
        <div style={{ marginBottom: 8 }}>No debug configurations found</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          Create a launch.json file to configure debugging
        </div>
      </div>
    </div>
  )
}
