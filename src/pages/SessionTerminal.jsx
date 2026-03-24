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

function parseHistoryToolCalls(blocks) {
  const toolCalls = []

  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue

    if (block.type === 'tool_use' || block.type === 'toolCall') {
      toolCalls.push({
        id: block.id || `tool-${Date.now()}-${toolCalls.length}`,
        name: block.name || 'Tool',
        status: 'running',
        args: summarizeToolArgs(block.input ?? block.arguments),
        result: '',
        startedAtMs: null,
        finishedAtMs: null,
      })
      continue
    }

    if (block.type === 'tool_result' || block.type === 'toolResult') {
      const result = summarizeToolResult(block.content)
      const toolUseId = block.tool_use_id || block.toolCallId
      const existingIndex = toolCalls.findIndex((toolCall) => toolCall.id === toolUseId || (!toolUseId && toolCall.status === 'running'))

      if (existingIndex >= 0) {
        toolCalls[existingIndex] = {
          ...toolCalls[existingIndex],
          status: 'completed',
          result,
          finishedAtMs: null,
        }
      } else {
        toolCalls.push({
          id: toolUseId || `tool-${Date.now()}-${toolCalls.length}`,
          name: block.name || 'Tool',
          status: 'completed',
          args: '',
          result,
          startedAtMs: null,
          finishedAtMs: null,
        })
      }
    }
  }

  return toolCalls
}

function parseGatewayHistoryMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return []

  const parsed = rawMessages.map((message, index) => {
    const content = message?.content
    const blocks = Array.isArray(content) ? content : typeof content === 'string' ? [{ type: 'text', text: content }] : []
    const visibleText = extractText(message)
    const reasoning = extractThinking(message)
    const toolCalls = parseHistoryToolCalls(blocks)
    const details = createAssistantDetails()
    details.reasoning = reasoning
    details.toolCalls = toolCalls

    return {
      id: message?.id || `hist-${index}`,
      type: message?.role === 'user' ? 'user' : 'assistant',
      content: visibleText,
      timestamp: message?.timestamp,
      details,
      _internalOnly: message?.role !== 'user' && !visibleText && (reasoning || toolCalls.length > 0),
      _toolResultRole: message?.role === 'toolResult',
    }
  })

  const merged = []
  for (const entry of parsed) {
    if (entry.type === 'assistant' && (entry._internalOnly || entry._toolResultRole)) {
      const last = merged[merged.length - 1]
      if (last && last.type === 'assistant') {
        const lastDetails = ensureAssistantDetails(last)
        last.details = {
          ...lastDetails,
          reasoning: [lastDetails.reasoning, entry.details.reasoning].filter(Boolean).join('\n').trim(),
          toolCalls: [...lastDetails.toolCalls, ...entry.details.toolCalls],
        }
      }
      continue
    }

    merged.push({
      id: entry.id,
      type: entry.type,
      content: entry.content,
      timestamp: entry.timestamp,
      details: entry.type === 'assistant' ? entry.details : undefined,
    })
  }

  return merged.filter((message) => message.type === 'user' || message.content || message.details?.reasoning || message.details?.toolCalls?.length)
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

function logTerminalStream(event, details = {}) {
  try {
    console.log(`[SessionTerminal] ${event}`, details)
  } catch {}
}

function createAssistantDetails() {
  return {
    isOpen: false,
    reasoning: '',
    reasoningUpdatedAt: null,
    toolCalls: [],
    elapsedMs: 0,
    usage: null,
  }
}

function ensureAssistantDetails(message) {
  return message.details || createAssistantDetails()
}

function formatElapsedMs(value) {
  const elapsedMs = Number(value) || 0
  if (elapsedMs < 1000) return `${elapsedMs}ms`
  const totalSeconds = Math.max(1, Math.round(elapsedMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${totalSeconds}s`
  return `${minutes}m ${seconds}s`
}

function summarizeToolArgs(args) {
  if (args == null) return ''
  if (typeof args === 'string') return args
  try {
    return JSON.stringify(args, null, 2)
  } catch {
    return String(args)
  }
}

function summarizeToolResult(result) {
  if (result == null) return ''
  if (typeof result === 'string') return result
  try {
    return JSON.stringify(result, null, 2)
  } catch {
    return String(result)
  }
}

function extractText(message) {
  if (!message || typeof message !== 'object') return ''

  const content = message.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .filter((block) => block && block.type === 'text')
    .map((block) => block.text || '')
    .join('\n')
}

function extractThinking(message) {
  if (!message || typeof message !== 'object') return ''

  const content = message.content
  if (!Array.isArray(content)) return ''

  const thinking = content
    .filter((block) => {
      // console.log('Extracting thinking from message block type:', block?.type, block)
      return block && block.type === 'thinking'
    })
    .map((block) => block.thinking || block.text || '')
    .filter(Boolean)
    .join('\n')
  return thinking
}

function normalizeUsage(value) {
  if (!value || typeof value !== 'object') return null

  const normalized = {
    inputTokens: Number(value.inputTokens ?? value.input_tokens ?? value.promptTokens ?? value.prompt_tokens) || 0,
    outputTokens: Number(value.outputTokens ?? value.output_tokens ?? value.completionTokens ?? value.completion_tokens) || 0,
    reasoningTokens: Number(value.reasoningTokens ?? value.reasoning_tokens ?? value.thinkingTokens ?? value.thinking_tokens) || 0,
    totalTokens: Number(value.totalTokens ?? value.total_tokens ?? value.total) || 0,
    contextWindow: Number(value.contextWindow ?? value.context_window ?? value.maxContextTokens ?? value.max_context_tokens ?? value.maxTokens ?? value.max_tokens) || 0,
  }

  if (!normalized.totalTokens) {
    normalized.totalTokens = normalized.inputTokens + normalized.outputTokens + normalized.reasoningTokens
  }

  if (!normalized.totalTokens && !normalized.contextWindow) return null
  return normalized
}

function usagePercent(used, total) {
  if (!used || !total) return 0
  return Math.max(0, Math.min(100, (used / total) * 100))
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
  const [manualRefreshingHistory, setManualRefreshingHistory] = useState(false)
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const historySyncingRef = useRef(false)
  const activeStreamIdRef = useRef(null)
  const suppressNextAutoScrollRef = useRef(false)

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

  const fetchLatestUsage = useCallback(async () => {
    if (!id || !account) return null
    try {
      const data = await fetchJson(`/api/session/${id}`, { headers: getWalletHeaders(account) })
      return normalizeUsage(data?.usage)
    } catch {
      return null
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
    return parseGatewayHistoryMessages(data.messages)
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

  const handleManualHistoryRefresh = useCallback(async () => {
    if (!account || !id || activeStreamIdRef.current || historySyncingRef.current || manualRefreshingHistory) return

    historySyncingRef.current = true
    setManualRefreshingHistory(true)
    try {
      logTerminalStream('history:manual-refresh', { sessionId: id })
      const historyMessages = await fetchTerminalHistory()
      appendNewHistoryMessages(historyMessages)
      setHistoryLoaded(true)
    } catch (err) {
      logTerminalStream('history:manual-refresh-error', { sessionId: id, message: err.message })
    } finally {
      historySyncingRef.current = false
      setManualRefreshingHistory(false)
    }
  }, [account, appendNewHistoryMessages, fetchTerminalHistory, id, manualRefreshingHistory])

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

  const toggleAssistantDetails = useCallback((messageIndex) => {
    suppressNextAutoScrollRef.current = true
    setMessages((prev) => prev.map((message, index) => {
      if (index !== messageIndex || message.type !== 'assistant') return message
      const details = ensureAssistantDetails(message)
      return {
        ...message,
        details: {
          ...details,
          isOpen: !details.isOpen,
        },
      }
    }))
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

  useEffect(() => {
    if (!messagesEndRef.current) return
    if (suppressNextAutoScrollRef.current) {
      suppressNextAutoScrollRef.current = false
      return
    }
    const hasStreamingMessage = messages.some((message) => message.isStreaming)
    messagesEndRef.current.scrollIntoView({ behavior: hasStreamingMessage ? 'auto' : 'smooth', block: 'end' })
  }, [messages])

  useEffect(() => {
    if (!inputRef.current) return
    inputRef.current.style.height = '0px'
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 220)}px`
  }, [input])

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
    return () => {
      clearInterval(interval)
    }
  }, [account, fetchSession, fetchFiles, fetchApiKeys, loadHistory])

  const handleConnect = async () => { setError(''); try { await connect() } catch (e) { setError(e.message) } }

  const handleSend = async () => {
    if (!input.trim() || sending || !account || !id) return
    const userMsg = input.trim()
    const streamId = `stream-${Date.now()}`
    logTerminalStream('sse:open', { sessionId: id, streamId, messageLength: userMsg.length })
    activeStreamIdRef.current = streamId
    setInput('')
    setSending(true)
    setMessages((prev) => [
      ...prev,
      { type: 'user', content: userMsg, timestamp: Date.now() / 1000 },
      { type: 'assistant', content: '', isStreaming: true, streamId, details: createAssistantDetails() },
    ])
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
      logTerminalStream('sse:response', {
        sessionId: id,
        streamId,
        ok: res.ok,
        status: res.status,
        contentType: res.headers.get('content-type') || '',
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); setMessages((prev) => prev.map((m) => m.isStreaming ? { ...m, type: 'error', content: d.error || 'Failed to get response', isStreaming: false } : m)); return }

      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('text/event-stream')) {
        const text = await res.text()
        let parsed = null
        try { parsed = JSON.parse(text) } catch {}
        const directText = parsed?.content || parsed?.message || parsed?.response || parsed?.reply || text
        logTerminalStream('sse:non-stream-response', {
          sessionId: id,
          streamId,
          textLength: typeof directText === 'string' ? directText.length : JSON.stringify(directText).length,
        })
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
        streamReceivedAnyData = true
        const payload = normalized.slice(5).trimStart()
        if (!payload || payload === '[DONE]') {
          logTerminalStream('sse:done-sentinel', { sessionId: id, streamId })
          updateStreamingAssistant((message) => ({ ...message, isStreaming: false }))
          return
        }
        try {
          const event = JSON.parse(payload)
          if (event.type === 'delta') {
            logTerminalStream('sse:delta', {
              sessionId: id,
              streamId,
              chunkLength: typeof event.content === 'string'
                ? event.content.length
                : typeof event.delta === 'string'
                  ? event.delta.length
                  : typeof event.text === 'string'
                    ? event.text.length
                    : 0,
            })
            updateStreamingAssistant((message) => {
              const details = ensureAssistantDetails(message)
              const streamedMessage = event.message && typeof event.message === 'object' ? event.message : null
              const nextContent = extractText(streamedMessage)
              const nextReasoning = extractThinking(streamedMessage)
              return {
                ...message,
                content: nextContent ? mergeStreamChunk(message.content, nextContent) : message.content,
                details: {
                  ...details,
                  reasoning: nextReasoning ? mergeStreamChunk(details.reasoning, nextReasoning) : details.reasoning,
                  reasoningUpdatedAt: nextReasoning ? Date.now() : details.reasoningUpdatedAt,
                  elapsedMs: Math.max(details.elapsedMs || 0, Number(event.elapsedMs) || 0),
                },
              }
            })
          } else if (event.type === 'tool_start') {
            logTerminalStream('sse:tool_start', { sessionId: id, streamId, name: event.name, args: event.args })
            updateStreamingAssistant((message) => {
              const details = ensureAssistantDetails(message)
              return {
                ...message,
                details: {
                  ...details,
                  elapsedMs: Math.max(details.elapsedMs || 0, Number(event.elapsedMs) || 0),
                  toolCalls: [
                    ...details.toolCalls,
                    {
                      id: `tool-${Date.now()}-${details.toolCalls.length}`,
                      name: event.name || 'Tool',
                      status: 'running',
                      args: summarizeToolArgs(event.args),
                      result: '',
                      startedAtMs: Number(event.elapsedMs) || 0,
                      finishedAtMs: null,
                    },
                  ],
                },
              }
            })
          } else if (event.type === 'tool_result') {
            logTerminalStream('sse:tool_result', { sessionId: id, streamId, name: event.name, result: event.result })
            updateStreamingAssistant((message) => {
              const details = ensureAssistantDetails(message)
              const nextToolCalls = [...details.toolCalls]
              const runningIndex = nextToolCalls.findIndex((toolCall) => toolCall.name === event.name && toolCall.status === 'running')
              const summarizedResult = summarizeToolResult(event.result)
              if (runningIndex >= 0) {
                nextToolCalls[runningIndex] = {
                  ...nextToolCalls[runningIndex],
                  status: 'completed',
                  result: summarizedResult,
                  finishedAtMs: Number(event.elapsedMs) || 0,
                }
              } else {
                nextToolCalls.push({
                  id: `tool-${Date.now()}-${nextToolCalls.length}`,
                  name: event.name || 'Tool',
                  status: 'completed',
                  args: '',
                  result: summarizedResult,
                  startedAtMs: null,
                  finishedAtMs: Number(event.elapsedMs) || 0,
                })
              }
              return {
                ...message,
                details: {
                  ...details,
                  elapsedMs: Math.max(details.elapsedMs || 0, Number(event.elapsedMs) || 0),
                  toolCalls: nextToolCalls,
                },
              }
            })
          } else if (event.type === 'final' || event.type === 'aborted') {
            logTerminalStream(`sse:${event.type}`, { sessionId: id, streamId, payload: event })
            const streamedUsage = normalizeUsage(event.usage)
            updateStreamingAssistant((message) => {
              const details = ensureAssistantDetails(message)
              return {
                ...message,
                isStreaming: false,
                details: {
                  ...details,
                  elapsedMs: Math.max(details.elapsedMs || 0, Number(event.elapsedMs) || 0),
                  usage: streamedUsage || details.usage,
                },
              }
            })
            if (!streamedUsage) {
              fetchLatestUsage().then((latestUsage) => {
                if (!latestUsage) return
                updateStreamingAssistant((message) => {
                  const details = ensureAssistantDetails(message)
                  return {
                    ...message,
                    details: {
                      ...details,
                      usage: latestUsage || details.usage,
                    },
                  }
                })
              })
            }
          } else if (event.type === 'usage') {
            logTerminalStream('sse:usage', { sessionId: id, streamId, payload: event })
            updateStreamingAssistant((message) => {
              const details = ensureAssistantDetails(message)
              return {
                ...message,
                details: {
                  ...details,
                  usage: normalizeUsage(event.usage) || details.usage,
                  elapsedMs: Math.max(details.elapsedMs || 0, Number(event.elapsedMs) || 0),
                },
              }
            })
          } else if (event.type === 'error') {
            logTerminalStream('sse:error', { sessionId: id, streamId, payload: event })
            updateStreamingAssistant((message) => {
              const details = ensureAssistantDetails(message)
              return {
                ...message,
                type: 'error',
                content: event.message || 'Generation failed',
                isStreaming: false,
                details: {
                  ...details,
                  elapsedMs: Math.max(details.elapsedMs || 0, Number(event.elapsedMs) || 0),
                  usage: normalizeUsage(event.usage) || details.usage,
                },
              }
            })
          } else {
            logTerminalStream('sse:unknown-event', { sessionId: id, streamId, payload: event })
          }
        } catch {
          // If backend sends plain text chunks, still render them.
          logTerminalStream('sse:plain-text-chunk', { sessionId: id, streamId, chunkLength: payload.length })
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

      logTerminalStream('sse:reader-closed', { sessionId: id, streamId, hadData: streamReceivedAnyData })
      // Ensure streaming is always finalized when the reader closes cleanly.
      updateStreamingAssistant((message) => message.isStreaming ? { ...message, isStreaming: false } : message)
    } catch (err) {
      if (err.name !== 'AbortError') {
        logTerminalStream('sse:catch-error', { sessionId: id, streamId, name: err.name, message: err.message })
        updateStreamingAssistant((message) => ({ ...message, type: 'error', content: err.message || 'Network error', isStreaming: false }))
      } else if (wasWatchdogAbort) {
        logTerminalStream('sse:watchdog-timeout', { sessionId: id, streamId })
        updateStreamingAssistant((message) => ({ ...message, type: 'error', content: 'Request timed out before stream started. Please retry.', isStreaming: false }))
      } else {
        logTerminalStream('sse:abort', { sessionId: id, streamId })
        updateStreamingAssistant((message) => ({ ...message, isStreaming: false, content: message.content || '(aborted)' }))
      }
    } finally {
      if (streamWatchdog) clearTimeout(streamWatchdog)
      setSending(false)
      abortControllerRef.current = null
      activeStreamIdRef.current = null
      logTerminalStream('sse:closed', { sessionId: id, streamId })
      inputRef.current?.focus()
    }
  }

  const handleAbort = async () => {
    logTerminalStream('sse:manual-abort', { sessionId: id, streamId: activeStreamIdRef.current })
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
          <div className="st-modal stx-extend-modal" onClick={(e) => e.stopPropagation()}>
            <div className="stx-extend-hero">
              <span className="stx-extend-kicker">Runtime top-up</span>
              <h2>Extend Session</h2>
              <p>Add more runtime without redeploying.</p>
            </div>

            <div className="stx-extend-section-label">Quick presets</div>
            <div className="stx-extend-pills">
              {[1, 2, 4, 8].map((hours) => (
                <button
                  key={hours}
                  type="button"
                  className={`stx-extend-pill${extendHours === hours ? ' is-active' : ''}`}
                  onClick={() => setExtendHours(hours)}
                  disabled={estimatingExtend || extending}
                >
                  {hours}h
                </button>
              ))}
            </div>

            <label className="stx-extend-custom-card">
              <span className="stx-extend-custom-label">Custom hours</span>
              <div className="stx-extend-custom">
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={extendHours}
                  onChange={(e) => setExtendHours(Math.max(1, Number(e.target.value) || 1))}
                  disabled={estimatingExtend || extending}
                />
                <span>hours</span>
              </div>
            </label>

            {extendEstimate && (
              <div className="stx-extend-summary">
                <div className="stx-extend-line"><span>{extendEstimate.gpuName}</span><span>${extendEstimate.hourlyPrice.toFixed(3)}/hr</span></div>
                <div className="stx-extend-line"><span>{extendEstimate.hours}h extension</span><span>${extendEstimate.totalPrice.toFixed(3)}</span></div>
                <div className="stx-extend-line stx-extend-total"><span>Total (ETH)</span><span>{extendEstimate.totalEth || 'N/A'} ETH</span></div>
              </div>
            )}

            {extendStatus && <div className="stx-extend-info">{extendStatus}</div>}
            {extendError && <div className="st-error-banner">{extendError}</div>}

            <div className="stx-extend-actions">
              <button className="st-btn stx-extend-primary" onClick={handleExtendSession} disabled={extending || estimatingExtend || !hasCurrentExtendEstimate}>
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
                    {msg.type === 'assistant' && msg.content && !msg.isStreaming ? (
                      <div className="st-msg-body st-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="st-msg-body">
                        {msg.content || ''}
                        {msg.isStreaming && <span className="st-cursor" />}
                      </div>
                    )}
                    {msg.type === 'assistant' && msg.details ? (
                      <div className="st-agent-details">
                        <div className="st-agent-details-bar">
                          <button
                            type="button"
                            className={`st-agent-details-toggle${msg.details.isOpen ? ' is-open' : ''}`}
                            onClick={() => toggleAssistantDetails(i)}
                          >
                            <span>{msg.details.isOpen ? 'Hide details' : 'Show details'}</span>
                            <span className="st-agent-details-meta">
                              {msg.details.reasoning ? 'Thinking' : 'Live run'}
                              {msg.details.toolCalls?.length ? ` • ${msg.details.toolCalls.length} tool${msg.details.toolCalls.length === 1 ? '' : 's'}` : ''}
                              {msg.details.elapsedMs ? ` • ${formatElapsedMs(msg.details.elapsedMs)}` : ''}
                            </span>
                          </button>
                          {!msg.isStreaming && msg.details.usage ? (
                            <div className="st-agent-usage-summary">
                              <span className="st-agent-usage-label">Tokens</span>
                              <span className="st-agent-usage-value">
                                {msg.details.usage.totalTokens.toLocaleString()}
                                {msg.details.usage.contextWindow > 0 ? ` / ${msg.details.usage.contextWindow.toLocaleString()}` : ''}
                                {msg.details.usage.contextWindow > 0 ? ` • ${usagePercent(msg.details.usage.totalTokens, msg.details.usage.contextWindow).toFixed(1)}%` : ''}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        {msg.details.isOpen && (
                          <div className="st-agent-details-panel">
                            <div className="st-agent-detail-block">
                              <div className="st-agent-detail-header">
                                <span>Thinking</span>
                                {msg.details.elapsedMs ? <span>{formatElapsedMs(msg.details.elapsedMs)}</span> : null}
                              </div>
                              <div className={`st-agent-detail-body${msg.details.reasoning ? '' : ' st-agent-detail-empty'}`}>
                                {msg.details.reasoning || (msg.isStreaming ? 'Waiting for reasoning stream...' : 'No reasoning was exposed for this run.')}
                              </div>
                            </div>
                            <div className="st-agent-detail-block">
                              <div className="st-agent-detail-header">
                                <span>Tool activity</span>
                                <span>{msg.details.toolCalls?.length || 0}</span>
                              </div>
                              {msg.details.toolCalls?.length ? (
                                <div className="st-agent-tools-list">
                                  {msg.details.toolCalls.map((toolCall) => (
                                    <div key={toolCall.id} className="st-agent-tool-item">
                                      <div className="st-agent-tool-row">
                                        <span className="st-agent-tool-name">{toolCall.name}</span>
                                        <span className={`st-agent-tool-status st-agent-tool-status-${toolCall.status}`}>
                                          {toolCall.status === 'running' ? 'Running' : 'Done'}
                                        </span>
                                      </div>
                                      {toolCall.startedAtMs != null ? (
                                        <div className="st-agent-tool-time">
                                          Started at {formatElapsedMs(toolCall.startedAtMs)}
                                          {toolCall.finishedAtMs != null ? ` • Finished at ${formatElapsedMs(toolCall.finishedAtMs)}` : ''}
                                        </div>
                                      ) : toolCall.finishedAtMs != null ? (
                                        <div className="st-agent-tool-time">Finished at {formatElapsedMs(toolCall.finishedAtMs)}</div>
                                      ) : null}
                                      {toolCall.args ? <pre className="st-agent-tool-code">{toolCall.args}</pre> : null}
                                      {toolCall.result ? <pre className="st-agent-tool-code">{toolCall.result}</pre> : null}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="st-agent-detail-body st-agent-detail-empty">
                                  No tool calls yet.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
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
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={isReady ? 'Type a message to the agent...' : 'Agent is not ready yet...'}
                  disabled={!isReady || sending}
                  className="st-input"
                  rows={1}
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
              <button
                type="button"
                className="st-history-refresh"
                onClick={handleManualHistoryRefresh}
                disabled={manualRefreshingHistory || Boolean(activeStreamIdRef.current) || historySyncingRef.current}
                title={activeStreamIdRef.current ? 'Refresh disabled while live stream is active' : 'Refresh chat history'}
              >
                {manualRefreshingHistory ? 'Refreshing...' : 'Refresh'}
              </button>
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
                    <button onClick={() => toggleSection('apiKeys')} className="st-info-toggle">
                      <span>API Integrations</span>
                      <span className={openSections.apiKeys ? 'st-chevron-open' : 'st-chevron'}>▼</span>
                    </button>
                    {openSections.apiKeys && (
                      <div className="st-api-list">
                        {[
                          { key: 'ANTHROPIC_API_KEY', name: 'Anthropic (recommended)', desc: 'Claude models' },
                          { key: 'OPENAI_API_KEY', name: 'OpenAI', desc: 'GPT-4, Vision, TTS' },
                          { key: 'XAI_API_KEY', name: 'xAI', desc: 'Grok models' },
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
                    )}
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
