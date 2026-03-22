import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEthereumWallet } from '../hooks/useEthereumWallet'
import { clawsFunApiUrl, fetchJson, getWalletHeaders } from '../lib/sessionApi'

function normalizeStreamText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function mergeStreamChunk(currentContent, incomingContent) {
  const current = typeof currentContent === 'string' ? currentContent : ''
  const incoming = typeof incomingContent === 'string' ? incomingContent : ''
  if (!incoming) return current
  if (!current) return incoming
  if (incoming === current) return current
  if (incoming.startsWith(current)) return incoming
  if (current.startsWith(incoming)) return current
  if (incoming.includes(current)) return incoming
  if (current.includes(incoming)) return current

  const normalizedCurrent = normalizeStreamText(current)
  const normalizedIncoming = normalizeStreamText(incoming)
  if (!normalizedIncoming) return current
  if (normalizedIncoming === normalizedCurrent) {
    return incoming.length >= current.length ? incoming : current
  }
  if (normalizedIncoming.includes(normalizedCurrent)) return incoming
  if (normalizedCurrent.includes(normalizedIncoming)) return current

  // Handle providers that resend a full snapshot with small prefix jitter.
  const snapshotIndex = incoming.indexOf(current)
  if (snapshotIndex !== -1) return incoming

  // Find the largest overlap between current suffix and incoming prefix.
  const maxOverlap = Math.min(current.length, incoming.length)
  for (let overlap = maxOverlap; overlap > 0; overlap -= 1) {
    if (current.slice(-overlap) === incoming.slice(0, overlap)) {
      return `${current}${incoming.slice(overlap)}`
    }
  }

  return `${current}${incoming}`
}

function normalizeHistoryMessage(message) {
  return {
    type: message.role === 'user' ? 'user' : 'assistant',
    content: typeof message.content === 'string'
      ? message.content
      : Array.isArray(message.content)
        ? message.content.filter((block) => block.type === 'text').map((block) => block.text).join('')
        : '',
    timestamp: message.timestamp,
  }
}

function getMessageIdentity(message) {
  return [
    message.type || '',
    message.timestamp ?? '',
    typeof message.content === 'string' ? message.content : '',
  ].join('::')
}

function getMessageContentIdentity(message) {
  return [
    message.type || '',
    normalizeStreamText(typeof message.content === 'string' ? message.content : ''),
  ].join('::')
}

const SessionTerminal = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { account, connect, hasProvider, isConnected, isConnecting, sendTransaction } = useEthereumWallet()
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
  const [showExtend, setShowExtend] = useState(false)
  const [extendHours, setExtendHours] = useState(1)
  const [estimatingExtend, setEstimatingExtend] = useState(false)
  const [extendEstimate, setExtendEstimate] = useState(null)
  const [extending, setExtending] = useState(false)
  const [extendError, setExtendError] = useState('')
  const [extendStatus, setExtendStatus] = useState('')
  const [treasuryAddress, setTreasuryAddress] = useState('')
  const [ethPriceUsd, setEthPriceUsd] = useState(0)
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
  const realtimeIdleTimeoutRef = useRef(null)
  const historyPollIntervalRef = useRef(null)
  const lastRealtimeActivityRef = useRef(Date.now())

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

  const fetchTerminalHistory = useCallback(async () => {
    const res = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/history`), { headers: getWalletHeaders(account) })
    if (!res.ok) {
      throw new Error('Failed to load terminal history')
    }
    const data = await res.json()
    return Array.isArray(data.messages) ? data.messages.map(normalizeHistoryMessage) : []
  }, [id, account])

  const loadHistory = useCallback(async (force = false) => {
    if ((!force && historyLoaded) || historySyncingRef.current) return
    historySyncingRef.current = true
    try {
      const hist = await fetchTerminalHistory()
      if (hist.length) {
        setMessages((prev) => {
          const sys = prev.filter((m) => m.type === 'system' || m.type === 'error')
          return [...sys, ...hist]
        })
      }
      setHistoryLoaded(true)
    } catch {}
    finally { historySyncingRef.current = false }
  }, [fetchTerminalHistory, historyLoaded])

  const stopHistoryPolling = useCallback(() => {
    if (realtimeIdleTimeoutRef.current) {
      clearTimeout(realtimeIdleTimeoutRef.current)
      realtimeIdleTimeoutRef.current = null
    }
    if (historyPollIntervalRef.current) {
      clearInterval(historyPollIntervalRef.current)
      historyPollIntervalRef.current = null
    }
  }, [])

  const appendNewHistoryMessages = useCallback((historyMessages) => {
    if (!Array.isArray(historyMessages) || historyMessages.length === 0) return

    setMessages((prev) => {
      const existingChatMessages = prev.filter((message) => message.type === 'user' || message.type === 'assistant')
      const existingIds = new Set(existingChatMessages.map(getMessageIdentity))
      const lastExistingMessage = existingChatMessages[existingChatMessages.length - 1]
      const lastExistingContentId = lastExistingMessage ? getMessageContentIdentity(lastExistingMessage) : ''
      const newMessages = historyMessages.filter((message) => {
        const identity = getMessageIdentity(message)
        if (existingIds.has(identity)) return false
        if (lastExistingContentId && getMessageContentIdentity(message) === lastExistingContentId) return false
        return true
      })

      if (newMessages.length === 0) {
        return prev
      }

      return [...prev, ...newMessages]
    })
  }, [])

  const pollHistoryUpdates = useCallback(async () => {
    if (!account || !id || activeStreamIdRef.current || historySyncingRef.current) return

    historySyncingRef.current = true
    try {
      const historyMessages = await fetchTerminalHistory()
      appendNewHistoryMessages(historyMessages)
      setHistoryLoaded(true)
    } catch {}
    finally {
      historySyncingRef.current = false
    }
  }, [account, appendNewHistoryMessages, fetchTerminalHistory, id])

  const startHistoryPolling = useCallback(() => {
    if (!account || !id || activeStreamIdRef.current || historyPollIntervalRef.current) return

    pollHistoryUpdates()
    historyPollIntervalRef.current = setInterval(() => {
      pollHistoryUpdates()
    }, 10000)
  }, [account, id, pollHistoryUpdates])

  const scheduleRealtimeFallback = useCallback(() => {
    if (!account || !id || activeStreamIdRef.current) return

    if (realtimeIdleTimeoutRef.current) {
      clearTimeout(realtimeIdleTimeoutRef.current)
    }

    realtimeIdleTimeoutRef.current = setTimeout(() => {
      if (!activeStreamIdRef.current && Date.now() - lastRealtimeActivityRef.current >= 30000) {
        startHistoryPolling()
      }
    }, 30000)
  }, [account, id, startHistoryPolling])

  const markRealtimeActivity = useCallback(() => {
    lastRealtimeActivityRef.current = Date.now()
    stopHistoryPolling()
  }, [stopHistoryPolling])

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

  useEffect(() => () => stopHistoryPolling(), [stopHistoryPolling])

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
    fetchJson('/api/payment')
      .then((data) => {
        if (data?.treasuryAddress) setTreasuryAddress(data.treasuryAddress)
        if (typeof data?.ethPriceUsd === 'number') setEthPriceUsd(data.ethPriceUsd)
      })
      .catch(() => {})
    fetchFiles()
    fetchApiKeys()
    const interval = setInterval(() => {
      fetchSession().then((data) => {
        if (data && !data.isActive) { clearInterval(interval); return }
        if (data && data.status === 'running') fetchFiles()
      })
    }, 10000)
    scheduleRealtimeFallback()
    return () => {
      clearInterval(interval)
      stopHistoryPolling()
    }
  }, [account, fetchSession, fetchFiles, fetchApiKeys, loadHistory, scheduleRealtimeFallback, stopHistoryPolling])

  const handleConnect = async () => { setError(''); try { await connect() } catch (e) { setError(e.message) } }

  const handleSend = async () => {
    if (!input.trim() || sending || !account || !id) return
    const userMsg = input.trim()
    const streamId = `stream-${Date.now()}`
    stopHistoryPolling()
    markRealtimeActivity()
    activeStreamIdRef.current = streamId
    setInput('')
    setSending(true)
    setMessages((prev) => [...prev, { type: 'user', content: userMsg, timestamp: Date.now() / 1000 }, { type: 'assistant', content: '', isStreaming: true, streamId }])
    const controller = new AbortController()
    abortControllerRef.current = controller
    let streamWatchdog = null
    let streamReceivedAnyData = false
    let wasWatchdogAbort = false

    try {
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/terminal`), {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json', ...getWalletHeaders(account) },
        body: JSON.stringify({ message: userMsg }), signal: controller.signal,
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, type: 'error', content: d.error || 'Failed to get response', isStreaming: false } : m)); return }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        const text = await res.text()
        let parsed = null
        try { parsed = JSON.parse(text) } catch {}
        const directText = parsed?.content || parsed?.message || parsed?.response || parsed?.reply || text
        markRealtimeActivity()
        updateStreamingAssistant((message) => ({ ...message, content: typeof directText === 'string' ? directText : JSON.stringify(directText), isStreaming: false }))
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      if (!reader) throw new Error('No response body')

      // Prevent requests from hanging forever when an upstream/proxy buffers SSE.
      streamWatchdog = setTimeout(() => {
        if (!streamReceivedAnyData) { wasWatchdogAbort = true; controller.abort() }
      }, 45000)

      const processLine = (line) => {
        const normalized = line.trimEnd()
        if (!normalized.startsWith('data:')) return
        markRealtimeActivity()
        streamReceivedAnyData = true
        const payload = normalized.slice(5).trimStart()
        if (!payload || payload === '[DONE]') {
          updateStreamingAssistant((message) => ({ ...message, isStreaming: false }))
          return
        }
        try {
          const event = JSON.parse(payload)
          if (event.type === 'delta') {
            updateStreamingAssistant((message) => {
              const nextContent = typeof event.content === 'string'
                ? event.content
                : typeof event.delta === 'string'
                  ? event.delta
                  : typeof event.text === 'string'
                    ? event.text
                    : ''
              const mergedContent = mergeStreamChunk(message.content, nextContent)
              return { ...message, content: mergedContent }
            })
          } else if (event.type === 'tool_start') setMessages((prev) => [...prev, { type: 'tool', content: `Using ${event.name}...`, toolName: event.name, toolPhase: 'start' }])
          else if (event.type === 'tool_result') setMessages((prev) => [...prev, { type: 'tool', content: typeof event.result === 'string' ? event.result.slice(0, 500) : JSON.stringify(event.result).slice(0, 500), toolName: event.name, toolPhase: 'result' }])
          else if (event.type === 'final' || event.type === 'aborted') updateStreamingAssistant((message) => ({ ...message, isStreaming: false }))
          else if (event.type === 'error') updateStreamingAssistant((message) => ({ ...message, type: 'error', content: event.message || 'Generation failed', isStreaming: false }))
        } catch {
          // If backend sends plain text chunks, still render them.
          updateStreamingAssistant((message) => ({ ...message, content: mergeStreamChunk(message.content, payload) }))
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() || ''
        lines.forEach(processLine)
      }

      if (buffer.trim()) {
        processLine(buffer.trim())
      }

      // Ensure streaming is always finalized when the reader closes cleanly.
      updateStreamingAssistant((message) => message.isStreaming ? { ...message, isStreaming: false } : message)
    } catch (err) {
      if (err.name !== 'AbortError') updateStreamingAssistant((message) => ({ ...message, type: 'error', content: err.message || 'Network error', isStreaming: false }))
      else if (wasWatchdogAbort) updateStreamingAssistant((message) => ({ ...message, type: 'error', content: 'Request timed out before stream started. Please retry.', isStreaming: false }))
      else updateStreamingAssistant((message) => ({ ...message, isStreaming: false, content: message.content || '(aborted)' }))
    } finally {
      if (streamWatchdog) clearTimeout(streamWatchdog)
      setSending(false)
      abortControllerRef.current = null
      activeStreamIdRef.current = null
      scheduleRealtimeFallback()
      inputRef.current?.focus()
    }
  }

  const handleAbort = async () => {
    abortControllerRef.current?.abort(); abortControllerRef.current = null; setSending(false)
    try { await fetch(clawsFunApiUrl(`/api/session/${id}/terminal/abort`), { method: 'POST', headers: getWalletHeaders(account) }) } catch {}
    updateStreamingAssistant((message) => ({ ...message, isStreaming: false, content: message.content || '(aborted)' }))
    activeStreamIdRef.current = null
    scheduleRealtimeFallback()
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

  const handleEstimateExtend = useCallback(async (hours) => {
    if (!session) return
    const normalizedHours = Math.max(1, Number(hours) || 1)
    setEstimatingExtend(true)
    setExtendError('')
    setExtendStatus('')
    try {
      const payload = {
        gpuType: session.gpuType,
        numGpus: session.numGpus,
        cpuCores: session.cpuCores,
        memoryGb: session.memoryGb,
        diskGb: session.diskGb,
        durationHours: normalizedHours,
      }

      let data = null
      let estimateError = null
      for (const endpoint of ['/estimate', '/api/session/estimate']) {
        try {
          const res = await fetch(clawsFunApiUrl(endpoint), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
          const parsed = await res.json().catch(() => ({}))
          if (!res.ok) {
            estimateError = new Error(parsed.error || 'Failed to estimate extension cost')
            continue
          }
          data = parsed
          estimateError = null
          break
        } catch (err) {
          estimateError = err
        }
      }
      if (!data) throw estimateError || new Error('Failed to estimate extension cost')

      const hourly = Number(data.hourlyPrice || 0)
      const total = Number(data.totalPrice || data.totalUsd || (hourly > 0 ? hourly * normalizedHours : 0))
      const totalEth = String(data.totalEth || (ethPriceUsd > 0 ? (total / ethPriceUsd).toFixed(6) : ''))
      setExtendEstimate({
        hours: normalizedHours,
        hourlyPrice: hourly,
        totalPrice: total,
        totalEth,
        gpuName: data.gpuName || session.gpuType || 'N/A',
      })
    } catch (err) {
      setExtendEstimate(null)
      setExtendError(err.message || 'Failed to estimate extension cost')
    } finally {
      setEstimatingExtend(false)
    }
  }, [session, ethPriceUsd])

  const handleExtendSession = async () => {
    if (!id || !account || extending) return
    const normalizedHours = Math.max(1, Number(extendHours) || 1)
    setExtending(true)
    setExtendError('')
    setExtendStatus('Preparing payment...')
    try {
      if (!extendEstimate || extendEstimate.hours !== normalizedHours) {
        throw new Error('Estimate extension cost before continuing.')
      }

      let nextTreasuryAddress = String(treasuryAddress || '').trim()
      let nextEthPriceUsd = ethPriceUsd
      if (!nextTreasuryAddress || nextTreasuryAddress === '0x0000000000000000000000000000000000000000') {
        const paymentData = await fetchJson('/api/payment').catch(() => null)
        if (paymentData?.treasuryAddress) {
          nextTreasuryAddress = String(paymentData.treasuryAddress).trim()
          setTreasuryAddress(nextTreasuryAddress)
        }
        if (typeof paymentData?.ethPriceUsd === 'number') {
          nextEthPriceUsd = paymentData.ethPriceUsd
          setEthPriceUsd(paymentData.ethPriceUsd)
        }
      }

      if (!nextTreasuryAddress || nextTreasuryAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Payment address unavailable. Please try again in a moment.')
      }

      const amountEth = String(extendEstimate.totalEth || (nextEthPriceUsd > 0 ? (extendEstimate.totalPrice / nextEthPriceUsd).toFixed(6) : '')).trim()
      if (!amountEth || Number(amountEth) <= 0) {
        throw new Error('Unable to calculate ETH amount for extension payment.')
      }

      setExtendStatus('Waiting for MetaMask confirmation...')
      const paymentTx = await sendTransaction({ to: nextTreasuryAddress, valueEth: amountEth })

      setExtendStatus('Payment confirmed. Extending session...')
      const res = await fetch(clawsFunApiUrl(`/api/session/${id}/extend`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getWalletHeaders(account) },
        body: JSON.stringify({ additionalHours: normalizedHours, paymentTx }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to extend session')

      setMessages((prev) => [...prev, { type: 'system', content: `Session extended by ${normalizedHours} hour${normalizedHours > 1 ? 's' : ''}.` }])
      setShowExtend(false)
      setExtendEstimate(null)
      fetchSession()
    } catch (err) {
      setExtendError(err.message || 'Failed to extend session')
    } finally {
      setExtendStatus('')
      setExtending(false)
    }
  }

  const handleOpenExtend = () => {
    setShowExtend(true)
    setExtendError('')
    setExtendStatus('')
    setExtendEstimate(null)
  }

  useEffect(() => {
    if (!showExtend || !session) return

    const normalizedHours = Math.max(1, Number(extendHours) || 1)
    if (extendEstimate?.hours === normalizedHours || estimatingExtend) return

    const timer = setTimeout(() => {
      handleEstimateExtend(normalizedHours)
    }, 250)

    return () => clearTimeout(timer)
  }, [showExtend, session, extendHours, extendEstimate?.hours, estimatingExtend, handleEstimateExtend])

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

  const statusColor = session?.status === 'running' ? '#0d9e8a'
    : (session?.status === 'provisioning' || session?.status === 'bootstrapping') ? '#0d9e8a'
    : session?.status === 'retrying' ? '#0d9e8a'
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
  const normalizedExtendHours = Math.max(1, Number(extendHours) || 1)
  const hasCurrentExtendEstimate = Boolean(extendEstimate && extendEstimate.hours === normalizedExtendHours)

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
            <p>Are you sure?</p>
            <div className="st-error-banner">This will delete all unsaved data. Please make sure all private keys are saved or wallets have been emptied!</div>
            <div className="st-modal-actions">
              <button className="st-btn st-btn-danger" onClick={handleTerminate} disabled={terminating}>{terminating ? 'Terminating...' : 'Yes, Terminate'}</button>
              <button className="st-btn st-btn-secondary" onClick={() => setShowTerminate(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Extend session modal */}
      {showExtend && (
        <div className="st-modal-overlay" onClick={() => !extending && setShowExtend(false)}>
          <div className="st-modal st-extend-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Extend Session</h2>
            <p>Add more runtime without redeploying.</p>

            <div className="st-extend-pills">
              {[1, 2, 4, 8].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  className={`st-extend-pill${extendHours === hours ? ' is-active' : ''}`}
                  onClick={() => setExtendHours(hours)}
                  disabled={estimatingExtend || extending}
                >
                  {hours}h
                </button>
              ))}
              <div className="st-extend-custom">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={extendHours}
                  onChange={(e) => setExtendHours(Math.max(1, Number(e.target.value) || 1))}
                  disabled={estimatingExtend || extending}
                />
                <span>hr</span>
              </div>
            </div>

            {extendEstimate && (
              <div className="st-extend-summary">
                <div className="st-extend-line"><span>{extendEstimate.gpuName}</span><span>${extendEstimate.hourlyPrice.toFixed(3)}/hr</span></div>
                <div className="st-extend-line"><span>{extendEstimate.hours}h extension</span><span>${extendEstimate.totalPrice.toFixed(3)}</span></div>
                <div className="st-extend-line st-extend-total"><span>Total (ETH)</span><span>{extendEstimate.totalEth || 'N/A'} ETH</span></div>
              </div>
            )}

            {extendStatus && <div className="st-extend-info">{extendStatus}</div>}
            {extendError && <div className="st-error-banner">{extendError}</div>}

            <div className="st-modal-actions">
              <button className="st-btn st-btn-success" onClick={handleExtendSession} disabled={extending || estimatingExtend || !hasCurrentExtendEstimate}>
                {extending ? 'Processing...' : `Pay & Extend ${Math.max(1, Number(extendHours) || 1)}h`}
              </button>
              <button className="st-btn st-btn-secondary" onClick={() => setShowExtend(false)} disabled={extending}>Cancel</button>
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
                  <button className="st-ctrl-btn st-ctrl-extend" onClick={handleOpenExtend} disabled={sending || extending || !session}>
                    {extending ? 'Extending...' : '+ Extend'}
                  </button>
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

                        {session.health && (
                          <>
                            <div className="st-info-divider" />
                            <div className="st-info-label">GPU Health</div>
                            <div className="st-info-row"><span>GPU</span><strong style={{ color: session.health.gpu_available ? '#0d9e8a' : '#ef4444' }}>{session.health.gpu_available ? (session.health.gpu_name || 'Available') : 'Not detected'}</strong></div>
                            {session.health.gpu_available && (
                              <>
                                <div className="st-info-row"><span>Utilization</span><strong>{session.health.gpu_utilization ?? session.health.gpuUsed ?? 0}%</strong></div>
                                <div className="st-info-row"><span>VRAM</span><strong>{session.health.gpu_memory_used ?? 0} / {session.health.gpu_memory_total ?? 0} MiB</strong></div>
                                <div className="st-vram-bar"><div className="st-vram-fill" style={{ width: `${session.health.gpu_memory_total ? Math.round((session.health.gpu_memory_used || 0) / session.health.gpu_memory_total * 100) : 0}%` }} /></div>
                              </>
                            )}
                            <div className="st-info-row"><span>Gateway</span><strong style={{ color: session.health.gateway_pid ? '#0d9e8a' : '#ef4444' }}>{session.health.gateway_pid ? `Running (PID ${session.health.gateway_pid})` : 'Stopped'}</strong></div>
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
                  <div className="st-integrations-section">
                    <div className="st-integrations-title">API Integrations</div>
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
