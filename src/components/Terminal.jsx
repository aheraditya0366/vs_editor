import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { useEditorStore } from '../store/editorStore'

export default function Terminal() {
  const terminalRef = useRef(null)
  const xtermRef = useRef(null)
  const fitAddonRef = useRef(null)
  const [currentInput, setCurrentInput] = useState('')
  const [commandHistory, setCommandHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [height, setHeight] = useState(200)
  const [dragging, setDragging] = useState(false)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)

  const {
    terminalTabs,
    activeTerminalId,
    terminalVisible,
    addTerminalTab,
    closeTerminalTab,
    activateTerminalTab,
    updateTerminalCwd,
    listFilesInDir,
    runCommand,
  } = useEditorStore()

  const activeTab = terminalTabs.find(t => t.id === activeTerminalId)
  const cwd = activeTab?.cwd || '/'

  useEffect(() => {
    if (!terminalVisible || !terminalRef.current) return

    const xterm = new XTerm({
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        selection: '#264f78',
      },
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      cursorBlink: true,
      allowTransparency: true,
    })

    const fitAddon = new FitAddon()
    xterm.loadAddon(fitAddon)
    xterm.open(terminalRef.current)
    fitAddon.fit()
    xterm.focus()

    xtermRef.current = xterm
    fitAddonRef.current = fitAddon

    // Initialize with prompt
    xterm.writeln('Welcome to VS Editor Terminal')
    xterm.writeln('Type "help" for available commands.')
    writePrompt(xterm)

    xterm.onKey((e) => {
      handleKey(e, xterm)
    })

    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (xtermRef.current) {
        xtermRef.current.dispose()
      }
    }
  }, [terminalVisible])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging) return
      const dy = e.clientY - startYRef.current
      const newHeight = Math.min(Math.max(startHeightRef.current + dy, 100), window.innerHeight - 100)
      setHeight(newHeight)
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }

    const handleMouseUp = () => {
      setDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging])

  const writePrompt = (xterm) => {
    const cwd = getCurrentWorkingDirectory()
    xterm.write(`\r\n${cwd}$ `)
  }

  const getCurrentWorkingDirectory = () => {
    return cwd
  }

  const handleKey = (e, xterm) => {
    const ev = e.domEvent
    const key = e.key

    if (ev.key === 'Enter') {
      xterm.write('\r\n')
      const command = currentInput.trim()
      if (command) {
        setCommandHistory(prev => [...prev, command])
        setHistoryIndex(-1)
        executeCommand(command, xterm)
      }
      setCurrentInput('')
      writePrompt(xterm)
    } else if (ev.key === 'Backspace') {
      ev.preventDefault()
      if (currentInput.length > 0) {
        setCurrentInput(prev => prev.slice(0, -1))
        xterm.write('\b \b')
      }
    } else if (ev.key === 'ArrowUp') {
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        const cmd = commandHistory[commandHistory.length - 1 - newIndex]
        xterm.write('\r\x1b[K' + getCurrentWorkingDirectory() + '$ ' + cmd)
        setCurrentInput(cmd)
      }
    } else if (ev.key === 'ArrowDown') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        const cmd = commandHistory[commandHistory.length - 1 - newIndex]
        xterm.write('\r\x1b[K' + getCurrentWorkingDirectory() + '$ ' + cmd)
        setCurrentInput(cmd)
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        xterm.write('\r\x1b[K' + getCurrentWorkingDirectory() + '$ ')
        setCurrentInput('')
      }
    } else if (key.length === 1 && ev.key >= ' ') {
      setCurrentInput(prev => prev + key)
      xterm.write(key)
    }
  }

  const executeCommand = (command, xterm) => {
    const output = runCommand(command, activeTerminalId)
    if (output === '') {
      // Special case for clear
      if (command.trim().toLowerCase() === 'clear') {
        xterm.clear()
      }
    } else {
      xterm.writeln(output)
    }
  }

  if (!terminalVisible) return null

  return (
    <div className="terminal-container" style={{ height }}>
      <div
        className="terminal-resizer"
        onMouseDown={(e) => {
          setDragging(true)
          startYRef.current = e.clientY
          startHeightRef.current = height
        }}
      />
      <div className="terminal-tabs">
        {terminalTabs.map((tab) => (
          <div
            key={tab.id}
            className={`terminal-tab ${tab.id === activeTerminalId ? 'active' : ''}`}
            onClick={() => activateTerminalTab(tab.id)}
          >
            <span>{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTerminalTab(tab.id)
              }}
              className="close-tab"
            >
              ×
            </button>
          </div>
        ))}
        <button onClick={addTerminalTab} className="add-tab">+</button>
      </div>
      <div
        ref={terminalRef}
        className="terminal"
        tabIndex={0}
        onClick={() => xtermRef.current?.focus()}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault()
            if (currentInput.length > 0) {
              setCurrentInput(prev => prev.slice(0, -1))
              xtermRef.current?.write('\b \b')
            }
          }
        }}
      />
    </div>
  )
}
