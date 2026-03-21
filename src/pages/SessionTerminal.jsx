import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEthereumWallet } from '../hooks/useEthereumWallet'
import { clawsFunApiUrl, fetchJson, getWalletHeaders } from '../lib/sessionApi'

const SessionTerminal = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { account, connect, hasProvider, isConnected, isConnecting } = useEthereumWallet()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [restarting, setRestarting] = useState(false)
  const [creatingNewChat, setCreatingNewChat] = useState(false)
  const [terminating, setTerminating] = useState(false)
  const [showTerminate, setShowTerminate] = useState(false)
  const [rebooting, setRebooting] = useState(false)
  const [files, setFiles] = useState([])
  const [currentPath, setCurrentPath] = useState('')
  const [parentPath, setParentPath] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [apiKeys, setApiKeys] = useState([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [savingKey, setSavingKey] = useState(false)
  const [openSections, setOpenSections] = useState({ status: true, apiKeys: true })
  const [editingFile, setEditingFile] = useState(false)
  const [editFilePath, setEditFilePath] = useState('')
  const [editFileContent, setEditFileContent] = useState('')
  const [editFileLoading, setEditFileLoading] = useState(false)
  const [editFileSaving, setEditFileSaving] = useState(false)
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const historySyncingRef = useRef(false)
  const activeStreamIdRef = useRef(null)

  const transcriptStorageKey = id && account ? `session-terminal:${id}:${account.toLowerCase()}` : ''

  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))

  const fetchSession = useCallback(async () => {
    if (!id || !account) return null
    try {
      const data = await fetchJson(`/api/session/${id}`, { headers: getWalletHeaders(account) })
      setSession(data)
      setMessages((current) => {
        if (current.length > 0) return current
        const init = [
          { type: 'system', content: `Session #${id} — ${data.agent?.name || 'Agent'}` },
          { type: 'system', content: `GPU: ${data.gpuType || 'N/A'} x${data.numGpus} | CPU: ${data.cpuCores} cores | RAM: ${data.memoryGb} GB` },
        ]
        if (data.status === 'running' && data.health) {
          init.push({ type: 'system', content: `Status: Running | Uptime: ${Math.floor((data.health.uptime || 0) / 60)}m | GPU: ${data.health.gpu_name || 'N/A'}` })
        } else if (data.status === 'provisioning') {
          init.push({ type: 'system', content: 'GPU instance is starting up... This may take 1-5 minutes.' })
        } else if (data.status === 'bootstrapping') {
          init.push({ type: 'system', content: 'OpenClaw agent is being installed and configured...' })
        } else if (data.status === 'error') {
          init.push({ type: 'error', content: 'Session encountered an error during provisioning.' })
        } else if (data.status === 'retrying') {
          init.push({ type: 'system', content: 'First attempt failed — automatically retrying with a new GPU instance...' })
        } else if (data.status === 'failed') {
          init.push({ type: 'error', content: 'Session failed after multiple attempts.' })
        }
        return init
      })
      return data
    } catch (err) {
      setMessages((current) => (current.length === 0 ? [{ type: 'error', content: `Failed to load session: ${err.message}` }] : current))
      return null
    } finally {
      setLoading(false)
    }
  }, [account, id])

  const fetchFiles = useCallback(async (dirPath) => {
    const p = dirPath ?? currentPath
    try {
      const qs = p ? `?path=${encodeURIComponent(p)}` : ''
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/files${qs}`), { headers: getWalletHeaders(account) })
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
        if (typeof data.path === 'string') setCurrentPath(data.path)
        setParentPath(data.parent ?? null)
      }
    } catch {}
  }, [id, account, currentPath])

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/keys`), { headers: getWalletHeaders(account) })
      if (res.ok) { const data = await res.json(); setApiKeys(data.keys || []) }
    } catch {}
  }, [id, account])

  const loadHistory = useCallback(async (force = false) => {
    if ((!force && historyLoaded) || historySyncingRef.current) return
    historySyncingRef.current = true
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/history`), { headers: getWalletHeaders(account) })
      if (res.ok) {
        const data = await res.json()
        if (data.messages?.length) {
          const hist = data.messages.map((m) => ({
            type: m.role === 'user' ? 'user' : 'assistant',
            content: typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.filter((b) => b.type === 'text').map((b) => b.text).join('') : '',
            timestamp: m.timestamp,
          }))
          setMessages((prev) => {
            const sys = prev.filter((m) => m.type === 'system' || m.type === 'error')
            return [...sys, ...hist]
          })
        }
        setHistoryLoaded(true)
      }
    } catch {}
    finally { historySyncingRef.current = false }
  }, [id, account, historyLoaded])

  const updateStreamingAssistant = useCallback((updater) => {
    setMessages((prev) => {
      const next = [...prev]
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].isStreaming && (!activeStreamIdRef.current || next[index].streamId === activeStreamIdRef.current)) {
          next[index] = updater(next[index])
          break
        }
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (!transcriptStorageKey || typeof window === 'undefined') {
      return
    }

    try {
      const sanitizedMessages = messages.map((message) => ({
        ...message,
        isStreaming: false,
      }))
      window.localStorage.setItem(transcriptStorageKey, JSON.stringify(sanitizedMessages))
    } catch {}
  }, [messages, transcriptStorageKey])

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!account) { setLoading(false); return }

    let hasCachedTranscript = false
    if (transcriptStorageKey && typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(transcriptStorageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            hasCachedTranscript = true
            setMessages(parsed)
            setHistoryLoaded(true)
          }
        }
      } catch {}
    }

    fetchSession().then((data) => {
      if (!hasCachedTranscript && data && (data.status === 'running' || data.status === 'starting')) {
        loadHistory()
      }
    })
    fetchFiles()
    fetchApiKeys()
    const interval = setInterval(() => {
      fetchSession().then((data) => {
        if (data && !data.isActive) { clearInterval(interval); return }
        if (data && data.status === 'running') fetchFiles()
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [account, fetchSession, fetchFiles, fetchApiKeys, loadHistory])

  const handleConnect = async () => { setError(''); try { await connect() } catch (e) { setError(e.message) } }

  const handleSend = async () => {
    if (!input.trim() || sending || !account || !id) return
    const userMsg = input.trim()
    const streamId = `stream-${Date.now()}`
    activeStreamIdRef.current = streamId
    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, { type: 'user', content: userMsg, timestamp: Date.now() / 1000 }, { type: 'assistant', content: '', isStreaming: true, streamId }])
    const controller = new AbortController()
    abortControllerRef.current = controller
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal`), {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...getWalletHeaders(account) },
        body: JSON.stringify({ message: userMsg }), signal: controller.signal,
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, type: 'error', content: d.error || 'Failed to get response', isStreaming: false } : m)); return }
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      if (!reader) throw new Error('No response body')
      const processLine = (line) => {
        if (!line.startsWith('data: ')) return
        try {
          const event = JSON.parse(line.slice(6))
          if (event.type === 'delta') {
            updateStreamingAssistant((message) => {
              const nextContent = typeof event.content === 'string' ? event.content : ''
              const mergedContent = nextContent.startsWith(message.content || '')
                ? nextContent
                : `${message.content || ''}${nextContent}`
              return { ...message, content: mergedContent }
            })
          } else if (event.type === 'tool_start') setMessages((prev) => [...prev, { type: 'tool', content: `Using ${event.name}...`, toolName: event.name, toolPhase: 'start' }])
          else if (event.type === 'tool_result') setMessages((prev) => [...prev, { type: 'tool', content: typeof event.result === 'string' ? event.result.slice(0, 500) : JSON.stringify(event.result).slice(0, 500), toolName: event.name, toolPhase: 'result' }])
          else if (event.type === 'final' || event.type === 'aborted') updateStreamingAssistant((message) => ({ ...message, isStreaming: false }))
          else if (event.type === 'error') updateStreamingAssistant((message) => ({ ...message, type: 'error', content: event.message || 'Generation failed', isStreaming: false }))
        } catch {}
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        lines.forEach(processLine)
      }

      if (buffer.trim()) {
        processLine(buffer.trim())
      }
    } catch (err) {
      if (err.name !== 'AbortError') updateStreamingAssistant((message) => ({ ...message, type: 'error', content: err.message || 'Network error', isStreaming: false }))
    } finally {
      setSending(false)
      abortControllerRef.current = null
      activeStreamIdRef.current = null
      inputRef.current?.focus()
    }
  }

  const handleAbort = async () => {
    abortControllerRef.current?.abort(); abortControllerRef.current = null; setSending(false)
    try { await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/abort`), { method: 'POST', headers: getWalletHeaders(account) }) } catch {}
    updateStreamingAssistant((message) => ({ ...message, isStreaming: false, content: message.content || '(aborted)' }))
    activeStreamIdRef.current = null
  }

  const handleRestartGateway = async () => {
    if (restarting) return; setRestarting(true)
    setMessages((prev) => [...prev, { type: 'system', content: 'Restarting OpenClaw gateway...' }])
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/restart`), { method: 'POST', headers: getWalletHeaders(account) })
      const data = await res.json()
      if (res.ok) { setMessages((prev) => [...prev, { type: 'system', content: 'Gateway restarted. Reconnecting in a few seconds...' }]); setTimeout(() => fetchSession(), 5000) }
      else setMessages((prev) => [...prev, { type: 'error', content: `Restart failed: ${data.error}` }])
    } catch (err) { setMessages((prev) => [...prev, { type: 'error', content: `Restart error: ${err.message}` }]) }
    finally { setRestarting(false) }
  }

  const handleNewSession = async () => {
    if (creatingNewChat) return; setCreatingNewChat(true)
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/new-session`), { method: 'POST', headers: getWalletHeaders(account) })
      const data = await res.json()
      if (res.ok) {
        activeStreamIdRef.current = null
        setMessages([{ type: 'system', content: 'New chat session started. Previous context cleared.' }])
        setHistoryLoaded(true)
        if (transcriptStorageKey && typeof window !== 'undefined') {
          try { window.localStorage.removeItem(transcriptStorageKey) } catch {}
        }
      }
      else setMessages((prev) => [...prev, { type: 'error', content: `New session failed: ${data.error}` }])
    } catch (err) { setMessages((prev) => [...prev, { type: 'error', content: `New session error: ${err.message}` }]) }
    finally { setCreatingNewChat(false) }
  }

  const handleReboot = async () => {
    if (rebooting) return
    if (!window.confirm('Reboot the entire GPU instance? Gateway will restart automatically in 1-3 minutes.')) return
    setRebooting(true)
    setMessages((prev) => [...prev, { type: 'system', content: 'Rebooting GPU instance...' }])
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/reboot`), { method: 'POST', headers: getWalletHeaders(account) })
      const data = await res.json()
      if (res.ok) { setMessages((prev) => [...prev, { type: 'system', content: 'Instance is rebooting. Gateway will restart automatically in 1-3 minutes.' }]); setTimeout(() => fetchSession(), 60000) }
      else setMessages((prev) => [...prev, { type: 'error', content: `Reboot failed: ${data.error}` }])
    } catch (err) { setMessages((prev) => [...prev, { type: 'error', content: `Reboot error: ${err.message}` }]) }
    finally { setRebooting(false) }
  }

  const handleTerminate = async () => {
    setTerminating(true)
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}`), { method: 'DELETE', headers: getWalletHeaders(account) })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) => [...prev, { type: 'system', content: 'Session terminated. GPU instance destroyed.' }])
        setSession((prev) => prev ? { ...prev, status: 'terminated', isActive: false } : prev)
        setShowTerminate(false)
        setTimeout(() => navigate('/deploy'), 1500)
      } else setMessages((prev) => [...prev, { type: 'error', content: `Terminate failed: ${data.error}` }])
    } catch (err) { setMessages((prev) => [...prev, { type: 'error', content: `Terminate error: ${err.message}` }]) }
    finally { setTerminating(false) }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setMessages((prev) => [...prev, { type: 'system', content: `Uploading ${file.name}...` }])
    try {
      const formData = new FormData(); formData.append('file', file)
      if (currentPath) formData.append('path', currentPath)
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/upload`), { method: 'POST', headers: getWalletHeaders(account), body: formData })
      const data = await res.json()
      if (res.ok) { setMessages((prev) => [...prev, { type: 'system', content: `Uploaded ${file.name}` }]); fetchFiles() }
      else setMessages((prev) => [...prev, { type: 'error', content: `Upload failed: ${data.error}` }])
    } catch (err) { setMessages((prev) => [...prev, { type: 'error', content: `Upload error: ${err.message}` }]) }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  const handleDownloadFile = async (filePath) => {
    const fullPath = currentPath ? `${currentPath}/${filePath}` : filePath
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/files?path=${encodeURIComponent(fullPath)}&download=1`), { headers: getWalletHeaders(account) })
      if (!res.ok) return
      const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filePath; a.click(); URL.revokeObjectURL(url)
    } catch {}
  }

  const handleDeleteFile = async (fileName) => {
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/files?path=${encodeURIComponent(fullPath)}`), { method: 'DELETE', headers: getWalletHeaders(account) })
      if (res.ok) { setMessages((prev) => [...prev, { type: 'system', content: `Deleted ${fullPath}` }]); fetchFiles() }
    } catch {}
  }

  const handleSaveKey = async () => {
    if (!newKeyName.trim() || !newKeyValue.trim() || savingKey) return
    setSavingKey(true)
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/keys`), { method: 'POST', headers: { 'Content-Type': 'application/json', ...getWalletHeaders(account) }, body: JSON.stringify({ keyName: newKeyName.trim(), keyValue: newKeyValue.trim() }) })
      if (res.ok) { setNewKeyName(''); setNewKeyValue(''); fetchApiKeys(); setMessages((prev) => [...prev, { type: 'system', content: 'API key saved. Please restart the instance for the new key to be picked up.' }]) }
    } catch {}
    finally { setSavingKey(false) }
  }

  const handleDeleteKey = async (keyName) => {
    try { await fetch(clawsFunApiUrl(`/api/session/${id}/keys?keyName=${encodeURIComponent(keyName)}`), { method: 'DELETE', headers: getWalletHeaders(account) }); fetchApiKeys() } catch {}
  }

  const handleOpenFile = async (fileName) => {
    const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName
    setEditFilePath(fullPath)
    setEditingFile(true)
    setEditFileLoading(true)
    setEditFileContent('')
    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/files?path=${encodeURIComponent(fullPath)}&download=1`), { headers: getWalletHeaders(account) })
      if (!res.ok) throw new Error('Failed to read file')
      const text = await res.text()
      setEditFileContent(text)
    } catch (err) {
      setEditFileContent(`Error loading file: ${err.message}`)
    } finally { setEditFileLoading(false) }
  }

  const handleSaveFile = async () => {
    if (editFileSaving) return
    setEditFileSaving(true)
    try {
      const blob = new Blob([editFileContent], { type: 'application/octet-stream' })
      const formData = new FormData()
      const fileName = editFilePath.split('/').pop() || 'file'
      formData.append('file', blob, fileName)
      const dirPath = editFilePath.split('/').slice(0, -1).join('/')
      if (dirPath) formData.append('path', dirPath)
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/upload`), { method: 'POST', headers: getWalletHeaders(account), body: formData })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Save failed') }
      setMessages((prev) => [...prev, { type: 'system', content: `Saved ${editFilePath}` }])
      fetchFiles()
    } catch (err) {
      setMessages((prev) => [...prev, { type: 'error', content: `Save error: ${err.message}` }])
    } finally { setEditFileSaving(false) }
  }

  const handleCloseEditor = () => { setEditingFile(false); setEditFilePath(''); setEditFileContent('') }

  const navigateToDir = (dirName) => { const p = currentPath ? `${currentPath}/${dirName}` : dirName; setCurrentPath(p); fetchFiles(p) }
  const navigateUp = () => { if (parentPath !== null) { setCurrentPath(parentPath); fetchFiles(parentPath) } }

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return 'Expired'
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60)
    if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
    return `${h}h ${m}m`
  }
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusColor = session?.status === 'running' ? '#22c55e'
    : (session?.status === 'provisioning' || session?.status === 'bootstrapping') ? '#14b8a6'
    : session?.status === 'retrying' ? '#06b6d4'
    : (session?.status === 'error' || session?.status === 'failed') ? '#ef4444'
    : '#0d9e8a'

  const statusText = session?.status === 'running' ? 'Running'
    : session?.status === 'provisioning' ? 'Provisioning GPU...'
    : session?.status === 'bootstrapping' ? 'Loading Agent...'
    : session?.status === 'starting' ? 'Starting Agent...'
    : session?.status === 'retrying' ? 'Retrying...'
    : session?.status === 'terminated' ? 'Terminated'
    : session?.status === 'expired' ? 'Expired'
    : session?.status === 'error' ? 'Error'
    : session?.status === 'failed' ? 'Failed'
    : 'Loading...'

  const isReady = session?.status === 'running' || session?.status === 'starting'
  const isActive = session?.isActive && !session?.isExpired

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="st-page st-center">
        <div className="st-spinner" />
        <p className="st-muted">Loading session...</p>
      </div>
    )
  }

  /* ── No MetaMask ── */
  if (!hasProvider) {
    return (
      <div className="st-page st-center">
        <div className="st-empty-card">
          <div className="st-empty-icon">🔒</div>
          <h2>MetaMask Required</h2>
          <p>This terminal uses on-chain payment and wallet ownership checks. Install MetaMask to continue.</p>
        </div>
      </div>
    )
  }

  /* ── Not connected ── */
  if (!isConnected) {
    return (
      <div className="st-page st-center">
        <div className="st-empty-card">
          <div className="st-empty-icon">🔒</div>
          <h2>Connect Wallet</h2>
          <p>Only the wallet that created this session can view and control it.</p>
          {error && <div className="st-error-banner">{error}</div>}
          <button className="st-btn st-btn-primary" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="st-page st-ide">
      {/* Terminate confirmation modal */}
      {showTerminate && (
        <div className="st-modal-overlay">
          <div className="st-modal">
            <div className="st-empty-icon">⚠️</div>
            <h2>Terminate Session?</h2>
            <p>This will destroy the GPU instance and stop the agent. Any unsaved data will be lost.</p>
            <div className="st-modal-actions">
              <button className="st-btn st-btn-danger" onClick={handleTerminate} disabled={terminating}>{terminating ? 'Terminating...' : 'Yes, Terminate'}</button>
              <button className="st-btn st-btn-secondary" onClick={() => setShowTerminate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* File editor modal */}
      {editingFile && (
        <div className="st-modal-overlay" onClick={handleCloseEditor}>
          <div className="st-editor-modal" onClick={(e) => e.stopPropagation()}>
            <div className="st-editor-header">
              <div className="st-editor-title">
                <span className="st-editor-icon">📄</span>
                <span className="st-editor-path">{editFilePath}</span>
              </div>
              <div className="st-editor-actions">
                {isActive && (
                  <button className="st-btn st-btn-primary st-btn-small" onClick={handleSaveFile} disabled={editFileSaving || editFileLoading}>
                    {editFileSaving ? 'Saving...' : 'Save'}
                  </button>
                )}
                <button className="st-btn st-btn-small" onClick={() => handleDownloadFile(editFilePath.split('/').pop())}>↓ Download</button>
                <button className="st-btn st-btn-small" onClick={handleCloseEditor}>✕</button>
              </div>
            </div>
            {editFileLoading ? (
              <div className="st-editor-loading"><div className="st-spinner" />Loading file...</div>
            ) : (
              <textarea
                className="st-editor-textarea"
                value={editFileContent}
                onChange={(e) => setEditFileContent(e.target.value)}
                readOnly={!isActive}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

      {/* Header bar */}
      <header className="st-header">
        <div className="st-header-left">
          <Link to="/" className="st-logo-link">
            <img src="/logo.png" alt="Claw" className="st-logo-img" />
            <span className="st-logo-text">claw.click</span>
          </Link>
          <span className="st-header-divider" />
          <span className="st-header-agent">{session?.agent?.name || `Session #${id}`}</span>
          <span className="st-status-dot" style={{ background: statusColor }} />
          <span className="st-status-label" style={{ color: statusColor }}>{statusText}</span>
          {session && isActive && <span className="st-time-chip">{formatTimeRemaining(session.timeRemaining)} left</span>}
        </div>
        <div className="st-header-right">
          {session?.instance?.costPerHour && <span className="st-cost-label">${session.instance.costPerHour.toFixed(2)}/hr</span>}
          {account && <span className="st-wallet-chip">{account.slice(0, 6)}...{account.slice(-4)}</span>}
        </div>
      </header>

      {/* Provisioning overlay */}
      {session && !isReady && isActive && (
        <div className="st-provision-overlay">
          <div className="st-spinner st-spinner-lg" />
          <h2>{session.status === 'provisioning' ? 'Starting GPU Instance' : 'Setting Up Agent'}</h2>
          <p className="st-muted">
            {session.status === 'provisioning'
              ? 'A GPU instance is being provisioned. This typically takes 1-5 minutes.'
              : 'The agent is being bootstrapped with its skills and API data. Please don\'t close this page.'}
          </p>
          <div className="st-provision-detail">
            <div><span>Agent</span><strong>{session.agent?.name}</strong></div>
            <div><span>GPU</span><strong>{session.gpuType || 'N/A'} x{session.numGpus}</strong></div>
            {session.agent?.memoryCID && <div><span>Memory CID</span><strong className="st-mono st-truncate">{session.agent.memoryCID}</strong></div>}
          </div>
          <p className="st-provision-note">This page will automatically update when the agent is ready.</p>
        </div>
      )}

      {/* Main IDE layout */}
      {(isReady || !isActive) && (
        <div className="st-body">
          {/* Left sidebar – Files */}
          <aside className="st-sidebar-left">
            <div className="st-sidebar-header">
              <h3 className="st-sidebar-title">📁 Files</h3>
              <div className="st-breadcrumb">
                <span className="st-breadcrumb-prefix">$</span>
                <button onClick={() => { setCurrentPath(''); fetchFiles('') }} className="st-breadcrumb-seg">.openclaw</button>
                {currentPath && currentPath.split('/').map((seg, i, arr) => {
                  const partial = arr.slice(0, i + 1).join('/')
                  return (
                    <React.Fragment key={i}>
                      <span className="st-breadcrumb-sep">/</span>
                      <button onClick={() => { setCurrentPath(partial); fetchFiles(partial) }} className="st-breadcrumb-seg">{seg}</button>
                    </React.Fragment>
                  )
                })}
              </div>
              <button className="st-btn st-btn-upload" onClick={() => fileInputRef.current?.click()} disabled={!isActive || uploading}>
                {uploading ? 'Uploading...' : '↑ Upload'}
              </button>
            </div>
            <div className="st-file-list">
              {parentPath !== null && (
                <button onClick={navigateUp} className="st-file-item"><span className="st-file-icon">↑</span><span className="st-file-name">..</span></button>
              )}
              {files.length === 0 && parentPath === null && <div className="st-file-empty">Empty directory</div>}
              {files.sort((a, b) => { if (a.type === 'folder' && b.type !== 'folder') return -1; if (a.type !== 'folder' && b.type === 'folder') return 1; return a.name.localeCompare(b.name) }).map((file, i) => (
                <div key={i} className="st-file-item">
                  {file.type === 'folder' ? (
                    <button onClick={() => navigateToDir(file.name)} className="st-file-btn">
                      <span className="st-file-icon">📁</span>
                      <span className="st-file-name">{file.name}</span>
                    </button>
                  ) : (
                    <button onClick={() => handleOpenFile(file.name)} className="st-file-btn">
                      <span className="st-file-icon">📄</span>
                      <span className="st-file-name">{file.name}</span>
                      <span className="st-file-size">{formatSize(file.size)}</span>
                    </button>
                  )}
                  <div className="st-file-actions">
                    {file.type !== 'folder' && <button onClick={() => handleDownloadFile(file.name)} title="Download">↓</button>}
                    {isActive && <button onClick={() => handleDeleteFile(file.name)} title="Delete" className="st-file-delete">✕</button>}
                  </div>
                </div>
              ))}
            </div>
            {/* Agent info */}
            {session && (
              <div className="st-sidebar-agent-info">
                <h4>Agent</h4>
                <div>{session.agent?.wallet?.slice(0, 8)}...{session.agent?.wallet?.slice(-6)}</div>
                {session.health?.gpu_name && <div>{session.health.gpu_name}</div>}
                {session.health && <div>{Math.floor((session.health.uptime || 0) / 60)}m uptime</div>}
              </div>
            )}
          </aside>

          {/* Center – Chat */}
          <main className="st-chat">
            <div className="st-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`st-msg-row ${msg.type === 'user' ? 'st-msg-row-right' : ''}`}>
                  <div className={`st-msg st-msg-${msg.type}`}>
                    {msg.type === 'tool' ? (
                      <div className="st-msg-tool"><span>{msg.toolPhase === 'start' ? '⚙️' : '✓'}</span> {msg.content}</div>
                    ) : msg.type === 'assistant' && msg.content && !msg.isStreaming ? (
                      <div className="st-msg-body st-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="st-msg-body">
                        {msg.content || ''}
                        {msg.isStreaming && <span className="st-cursor" />}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && !messages.some((m) => m.isStreaming) && (
                <div className="st-msg-row">
                  <div className="st-msg st-msg-assistant">
                    <div className="st-msg-dots"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div className="st-input-area">
              <div className="st-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder={isReady ? 'Type a message to the agent...' : 'Agent is not ready yet...'}
                  disabled={!isReady || sending}
                  className="st-input"
                />
                {sending ? (
                  <button onClick={handleAbort} className="st-btn st-btn-danger">Stop</button>
                ) : (
                  <button onClick={handleSend} disabled={!isReady || !input.trim()} className="st-btn st-btn-primary">Send</button>
                )}
              </div>
              <div className="st-input-meta">
                <span>{sending ? 'Agent is generating...' : isReady ? 'Connected to agent' : `Status: ${statusText}`}</span>
                {session && isActive && <span>{formatTimeRemaining(session.timeRemaining)} remaining</span>}
              </div>
              {/* Control buttons */}
              {session && isActive && (
                <div className="st-controls">
                  <button className="st-ctrl-btn st-ctrl-new" onClick={handleNewSession} disabled={creatingNewChat || sending}>
                    {creatingNewChat ? 'Creating...' : '+ New Chat'}
                  </button>
                  <button className="st-ctrl-btn st-ctrl-restart" onClick={handleRestartGateway} disabled={restarting || sending}>
                    {restarting ? 'Restarting...' : isReady ? '↻ Restart Gateway' : '▶ Start Gateway'}
                  </button>
                  <button className="st-ctrl-btn st-ctrl-reboot" onClick={handleReboot} disabled={rebooting || sending}>
                    {rebooting ? 'Rebooting...' : '⚡ Reboot Instance'}
                  </button>
                  <div style={{ flex: 1 }} />
                  <button className="st-ctrl-btn st-ctrl-terminate" onClick={() => setShowTerminate(true)}>
                    ■ Terminate
                  </button>
                </div>
              )}
            </div>
          </main>

          {/* Right sidebar – Session info & API keys */}
          <aside className="st-sidebar-right">
            <div className="st-sidebar-scroll">
              {session && (
                <>
                  {/* Session Info */}
                  <div className="st-info-section">
                    <button onClick={() => toggleSection('status')} className="st-info-toggle">
                      <span>Session Info</span>
                      <span className={openSections.status ? 'st-chevron-open' : 'st-chevron'}>▼</span>
                    </button>
                    {openSections.status && (
                      <div className="st-info-body">
                        <div className="st-info-row"><span>Status</span><strong style={{ color: statusColor }}>{statusText}</strong></div>
                        <div className="st-info-row"><span>GPU</span><strong>{session.gpuType || 'N/A'} x{session.numGpus}</strong></div>
                        <div className="st-info-row"><span>CPU / RAM</span><strong>{session.cpuCores} cores / {session.memoryGb} GB</strong></div>
                        <div className="st-info-row"><span>Cost</span><strong>${session.instance?.costPerHour?.toFixed(2) || '?'}/hr</strong></div>
                        <div className="st-info-row"><span>Time Left</span><strong>{formatTimeRemaining(session.timeRemaining)}</strong></div>
                        <div className="st-info-row"><span>Storage</span><strong>{formatSize(session.storageUsed || 0)} / 500 MB</strong></div>

                        <div className="st-info-divider" />
                        <div className="st-info-label">Agent Identity</div>
                        <div className="st-info-row"><span>Name</span><strong>{session.agent?.name}</strong></div>
                        <div className="st-info-row"><span>Wallet</span><strong className="st-mono">{session.agent?.wallet?.slice(0, 6)}...{session.agent?.wallet?.slice(-4)}</strong></div>

                        {session.health && (
                          <>
                            <div className="st-info-divider" />
                            <div className="st-info-label">GPU Health</div>
                            <div className="st-info-row"><span>GPU</span><strong style={{ color: session.health.gpu_available ? '#22c55e' : '#ef4444' }}>{session.health.gpu_available ? (session.health.gpu_name || 'Available') : 'Not detected'}</strong></div>
                            {session.health.gpu_available && (
                              <>
                                <div className="st-info-row"><span>Utilization</span><strong>{session.health.gpu_utilization ?? session.health.gpuUsed ?? 0}%</strong></div>
                                <div className="st-info-row"><span>VRAM</span><strong>{session.health.gpu_memory_used ?? 0} / {session.health.gpu_memory_total ?? 0} MiB</strong></div>
                                <div className="st-vram-bar"><div className="st-vram-fill" style={{ width: `${session.health.gpu_memory_total ? Math.round((session.health.gpu_memory_used || 0) / session.health.gpu_memory_total * 100) : 0}%` }} /></div>
                              </>
                            )}
                            <div className="st-info-row"><span>Gateway</span><strong style={{ color: session.health.gateway_pid ? '#22c55e' : '#ef4444' }}>{session.health.gateway_pid ? `Running (PID ${session.health.gateway_pid})` : 'Stopped'}</strong></div>
                            <div className="st-info-row"><span>Uptime</span><strong>{session.health.uptime >= 3600 ? `${Math.floor(session.health.uptime / 3600)}h ${Math.floor((session.health.uptime % 3600) / 60)}m` : `${Math.floor((session.health.uptime || 0) / 60)} min`}</strong></div>
                          </>
                        )}

                        {session.instance?.publicIp && (
                          <>
                            <div className="st-info-divider" />
                            <div className="st-info-label">Connection</div>
                            <div className="st-info-row"><span>Instance</span><strong>{session.instance.id}</strong></div>
                            <div className="st-ssh-cmd">ssh -p {session.instance.sshPort} root@{session.instance.sshHost}</div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* API Keys */}
                  <div className="st-info-section">
                    <div className="st-info-label" style={{ padding: '12px 16px 8px' }}>API Integrations</div>
                    <div className="st-api-list">
                      {[
                        { key: 'ANTHROPIC_API_KEY', name: 'Anthropic (recommended)', desc: 'Claude models' },
                        { key: 'OPENAI_API_KEY', name: 'OpenAI', desc: 'GPT-4, Vision, TTS' },
                        { key: 'COINGECKO_API_KEY', name: 'CoinGecko', desc: 'Crypto data & prices' },
                        { key: 'TWITTER_API_KEY', name: 'Twitter', desc: 'Post & monitor' },
                        { key: 'ALCHEMY_API_KEY', name: 'Alchemy RPC', desc: 'Blockchain queries' },
                      ].map((api) => {
                        const saved = apiKeys.find((k) => k.key_name === api.key)
                        const isEditing = newKeyName === api.key
                        return (
                          <div key={api.key} className="st-api-item">
                            <button onClick={() => { if (isEditing) { setNewKeyName(''); setNewKeyValue('') } else { setNewKeyName(api.key); setNewKeyValue('') } }} className="st-api-toggle">
                              <div>
                                <div className="st-api-name">{api.name}</div>
                                <div className="st-api-desc">{api.desc}</div>
                              </div>
                              {saved ? (
                                <div className="st-api-status">
                                  <span className="st-api-dot st-api-dot-active" />
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteKey(api.key) }} className="st-api-remove">✕</button>
                                </div>
                              ) : (
                                <span className="st-api-dot" />
                              )}
                            </button>
                            {isEditing && !saved && (
                              <div className="st-api-input-row">
                                <input type="password" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} placeholder={`Paste ${api.name} key...`} className="st-api-input" onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()} autoFocus />
                                <button onClick={handleSaveKey} disabled={!newKeyValue.trim() || savingKey} className="st-btn st-btn-small">{savingKey ? '...' : 'Save'}</button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                      <p className="st-api-note">Keys are encrypted & injected as env vars into the agent.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

export default SessionTerminal