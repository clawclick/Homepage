import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  const appendSystemMessage = useCallback((type, content) => {
    setMessages((current) => [...current, { type, content, timestamp: Date.now() / 1000 }])
  }, [])

  const fetchSession = useCallback(async () => {
    if (!id || !account) {
      return null
    }

    try {
      const data = await fetchJson(`/api/session/${id}`, {
        headers: getWalletHeaders(account),
      })
      setSession(data)

      setMessages((current) => {
        if (current.length > 0) {
          return current
        }

        const next = [
          { type: 'system', content: `Session #${id} connected.` },
          { type: 'system', content: `Agent: ${data.agent.name}` },
          { type: 'system', content: `GPU: ${data.gpuType || 'Any'} x${data.numGpus} · CPU: ${data.cpuCores} · RAM: ${data.memoryGb}GB` },
        ]

        if (data.status !== 'running' && data.status !== 'starting') {
          next.push({ type: 'system', content: `Session status: ${data.status}. The terminal opens once the runtime is ready.` })
        }

        return next
      })

      return data
    } catch (sessionError) {
      setError(sessionError.message || 'Failed to load session.')
      return null
    } finally {
      setLoading(false)
    }
  }, [account, id])

  const loadHistory = useCallback(async () => {
    if (!id || !account || historyLoaded) {
      return
    }

    try {
      const data = await fetchJson(`/api/session/${id}/terminal/history`, {
        headers: getWalletHeaders(account),
      })

      if (Array.isArray(data?.messages) && data.messages.length > 0) {
        const historyMessages = data.messages.map((message) => ({
          type: message.role === 'user' ? 'user' : 'assistant',
          content: typeof message.content === 'string'
            ? message.content
            : Array.isArray(message.content)
            ? message.content.filter((block) => block.type === 'text').map((block) => block.text).join('')
            : '',
          timestamp: message.timestamp,
        }))

        setMessages((current) => {
          const systemMessages = current.filter((message) => message.type === 'system' || message.type === 'error')
          return [...systemMessages, ...historyMessages]
        })
      }

      setHistoryLoaded(true)
    } catch {}
  }, [account, historyLoaded, id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!account) {
      setLoading(false)
      return undefined
    }

    let intervalId

    fetchSession().then((data) => {
      if (data && (data.status === 'running' || data.status === 'starting')) {
        loadHistory()
      }
    })

    intervalId = window.setInterval(() => {
      fetchSession().then((data) => {
        if (data && (data.status === 'running' || data.status === 'starting')) {
          loadHistory()
        }

        if (data && !data.isActive) {
          window.clearInterval(intervalId)
        }
      })
    }, 10000)

    return () => window.clearInterval(intervalId)
  }, [account, fetchSession, loadHistory])

  const handleConnect = async () => {
    setError('')
    try {
      await connect()
    } catch (connectError) {
      setError(connectError.message)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || sending || !account || !id) {
      return
    }

    const userMessage = input.trim()
    setInput('')
    setSending(true)
    setMessages((current) => [...current, { type: 'user', content: userMessage }, { type: 'assistant', content: '', isStreaming: true }])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getWalletHeaders(account),
        },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to get a response from the agent.')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Missing response stream.')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) {
            continue
          }

          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'delta') {
              setMessages((current) => current.map((message) => (
                message.isStreaming ? { ...message, content: event.content } : message
              )))
            } else if (event.type === 'tool_start') {
              appendSystemMessage('system', `Tool start: ${event.name}`)
            } else if (event.type === 'tool_result') {
              appendSystemMessage('system', `Tool result: ${event.name}`)
            } else if (event.type === 'final' || event.type === 'aborted') {
              setMessages((current) => current.map((message) => (
                message.isStreaming ? { ...message, isStreaming: false } : message
              )))
            } else if (event.type === 'error') {
              setMessages((current) => current.map((message) => (
                message.isStreaming
                  ? { ...message, type: 'error', content: event.message || 'Generation failed', isStreaming: false }
                  : message
              )))
            }
          } catch {}
        }
      }
    } catch (sendError) {
      if (sendError.name !== 'AbortError') {
        setMessages((current) => current.map((message) => (
          message.isStreaming
            ? { ...message, type: 'error', content: sendError.message || 'Network error', isStreaming: false }
            : message
        )))
      }
    } finally {
      setSending(false)
      abortControllerRef.current = null
    }
  }

  const handleAbort = async () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setSending(false)

    if (account && id) {
      try {
        await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/abort`), {
          method: 'POST',
          headers: getWalletHeaders(account),
        })
      } catch {}
    }

    setMessages((current) => current.map((message) => (
      message.isStreaming ? { ...message, isStreaming: false, content: message.content || '(aborted)' } : message
    )))
  }

  const handleRestart = async () => {
    if (!account || !id || restarting) {
      return
    }

    setRestarting(true)
    appendSystemMessage('system', 'Restarting OpenClaw gateway...')

    try {
      await fetchJson(`/api/session/${id}/terminal/restart`, {
        method: 'POST',
        headers: getWalletHeaders(account),
      })
      appendSystemMessage('system', 'Gateway restart requested.')
    } catch (restartError) {
      appendSystemMessage('error', restartError.message || 'Gateway restart failed.')
    } finally {
      setRestarting(false)
    }
  }

  const handleNewChat = async () => {
    if (!account || !id || creatingNewChat) {
      return
    }

    setCreatingNewChat(true)

    try {
      await fetchJson(`/api/session/${id}/terminal/new-session`, {
        method: 'POST',
        headers: getWalletHeaders(account),
      })
      setHistoryLoaded(false)
      setMessages([{ type: 'system', content: 'New chat session started. Previous context cleared.' }])
    } catch (chatError) {
      appendSystemMessage('error', chatError.message || 'Failed to start a new chat session.')
    } finally {
      setCreatingNewChat(false)
    }
  }

  const handleTerminate = async () => {
    if (!account || !id || terminating) {
      return
    }

    setTerminating(true)
    try {
      await fetchJson(`/api/session/${id}`, {
        method: 'DELETE',
        headers: getWalletHeaders(account),
      })
      appendSystemMessage('system', 'Session terminated. Returning to deploy flow...')
      window.setTimeout(() => navigate('/deploy'), 900)
    } catch (terminateError) {
      appendSystemMessage('error', terminateError.message || 'Failed to terminate session.')
    } finally {
      setTerminating(false)
    }
  }

  const statusText = useMemo(() => {
    if (!session) {
      return 'Loading'
    }

    const status = String(session.status || '')
    if (status === 'running') return 'Running'
    if (status === 'starting') return 'Starting'
    if (status === 'bootstrapping') return 'Bootstrapping'
    if (status === 'provisioning') return 'Provisioning'
    return status || 'Unknown'
  }, [session])

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) {
      return 'Expired'
    }

    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (!hasProvider) {
    return (
      <div className="session-terminal-page session-terminal-empty">
        <div className="terminal-empty-card">
          <h1>MetaMask required</h1>
          <p>This terminal uses on-chain payment and wallet ownership checks. Open the site with MetaMask installed.</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="session-terminal-page session-terminal-empty">
        <div className="terminal-empty-card">
          <h1>Connect your wallet</h1>
          <p>Only the wallet that created the session can read the transcript and send commands to the running agent.</p>
          {error && <div className="deploy-error-banner">{error}</div>}
          <button className="deploy-wallet-button" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="session-terminal-page">
      <div className="session-terminal-shell">
        <div className="terminal-topbar">
          <div>
            <Link to="/app" className="deploy-link-back">Back to app</Link>
            <h1>Agent terminal</h1>
            <p>{session?.agent?.name || `Session #${id}`}</p>
          </div>
          <div className="terminal-topbar-right">
            <span className="deploy-wallet-chip terminal-status-chip">{statusText}</span>
            {account && <span className="deploy-wallet-address">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>}
          </div>
        </div>

        <div className="terminal-grid">
          <aside className="terminal-sidebar">
            <h2>Session overview</h2>
            <div className="terminal-stat-list">
              <div><span>Session</span><strong>#{id}</strong></div>
              <div><span>Status</span><strong>{statusText}</strong></div>
              <div><span>GPU</span><strong>{session?.gpuType || 'Any'} x{session?.numGpus || 1}</strong></div>
              <div><span>CPU</span><strong>{session?.cpuCores || 'n/a'}</strong></div>
              <div><span>RAM</span><strong>{session?.memoryGb || 'n/a'} GB</strong></div>
              <div><span>Time left</span><strong>{formatTimeRemaining(session?.timeRemaining)}</strong></div>
              <div><span>Instance</span><strong>{session?.instance?.publicIp || 'Pending'}</strong></div>
            </div>

            <div className="terminal-actions-stack">
              <button onClick={handleNewChat} disabled={creatingNewChat}>{creatingNewChat ? 'Starting...' : 'New chat'}</button>
              <button onClick={handleRestart} disabled={restarting}>{restarting ? 'Restarting...' : 'Restart gateway'}</button>
              <button className="terminal-danger-button" onClick={handleTerminate} disabled={terminating}>{terminating ? 'Terminating...' : 'Terminate session'}</button>
            </div>
          </aside>

          <section className="terminal-main">
            <div className="terminal-transcript">
              {loading && <div className="terminal-loader">Loading session...</div>}
              {messages.map((message, index) => (
                <div key={`${message.timestamp || index}-${index}`} className={`terminal-message terminal-message-${message.type}`}>
                  <span className="terminal-message-label">{message.type}</span>
                  <pre>{message.content || (message.isStreaming ? '...' : '')}</pre>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="terminal-compose">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={session?.status === 'running' || session?.status === 'starting' ? 'Ask the agent for a trade plan, analysis, or execution update...' : 'Waiting for session to finish provisioning...'}
                disabled={sending || !(session?.status === 'running' || session?.status === 'starting')}
              />
              <div className="terminal-compose-actions">
                <button className="btn-secondary terminal-abort-button" onClick={handleAbort} disabled={!sending}>Abort</button>
                <button className="btn-primary terminal-send-button" onClick={handleSend} disabled={sending || !input.trim() || !(session?.status === 'running' || session?.status === 'starting')}>
                  {sending ? 'Streaming...' : 'Send'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default SessionTerminal