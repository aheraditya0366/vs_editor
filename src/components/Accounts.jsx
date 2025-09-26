import React from 'react'

export default function Accounts() {
  return (
    <div className="accounts">
      <div className="header">Accounts</div>
      <div style={{ padding: 16, textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <div style={{ marginBottom: 8 }}>Not signed in</div>
        <div style={{ fontSize: 12, color: '#666' }}>
          Sign in to sync your settings and access GitHub
        </div>
      </div>
    </div>
  )
}
