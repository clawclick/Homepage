const BACKEND_URL = import.meta.env.VITE_CLAWS_FUN_BACKEND_URL || 'https://claws-fun-backend-764a4f25b49e.herokuapp.com'
const SUPER_API_URL = import.meta.env.VITE_SUPER_API_URL || 'https://api.claw.click'
const SUPER_API_WS_URL = import.meta.env.VITE_SUPER_API_WS_URL || SUPER_API_URL.replace(/^http/i, 'ws')
const ADMIN_API_KEY = 'ADMIN_API_KEY'
const USER_KEYS_PATH = import.meta.env.VITE_SUPER_API_USER_KEYS_PATH || '/user/keys'
const USER_KEY_CREATE_PATH = import.meta.env.VITE_SUPER_API_GENERATE_KEY_PATH || '/admin/apiKeys/generate'
const USER_USAGE_PATH = import.meta.env.VITE_SUPER_API_USER_USAGE_PATH || '/admin/stats/user'
const STATS_AGENTS_CACHE_TTL_MS = 2 * 60 * 60 * 1000
const STATS_AGENTS_CACHE_PREFIX = 'stats-agents:v1:'
const statsAgentsMemoryCache = new Map()

function getStatsAgentsCacheKey(agentId, includeKeys) {
  const idPart = agentId === undefined || agentId === null || agentId === '' ? '*' : String(agentId)
  return `${idPart}:${includeKeys ? '1' : '0'}`
}

function readStatsAgentsCache(cacheKey) {
  const now = Date.now()
  const memoryEntry = statsAgentsMemoryCache.get(cacheKey)

  if (memoryEntry) {
    if (memoryEntry.expiresAt > now) {
      return memoryEntry.data
    }

    statsAgentsMemoryCache.delete(cacheKey)
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    const serialized = window.localStorage.getItem(`${STATS_AGENTS_CACHE_PREFIX}${cacheKey}`)
    if (!serialized) {
      return null
    }

    const parsed = JSON.parse(serialized)
    if (!parsed || typeof parsed !== 'object' || parsed.expiresAt <= now) {
      window.localStorage.removeItem(`${STATS_AGENTS_CACHE_PREFIX}${cacheKey}`)
      return null
    }

    statsAgentsMemoryCache.set(cacheKey, {
      data: parsed.data,
      expiresAt: parsed.expiresAt,
    })

    return parsed.data
  } catch {
    return null
  }
}

function writeStatsAgentsCache(cacheKey, data) {
  const entry = {
    data,
    expiresAt: Date.now() + STATS_AGENTS_CACHE_TTL_MS,
  }

  statsAgentsMemoryCache.set(cacheKey, entry)

  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(`${STATS_AGENTS_CACHE_PREFIX}${cacheKey}`, JSON.stringify(entry))
  } catch {
    // Ignore storage write issues and keep runtime cache only.
  }
}

function superApiUrl(path) {
  return `${SUPER_API_URL}${path}`
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    query.set(key, String(value))
  })

  return query.toString()
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

async function fetchSuperApiJson(path, { method = 'GET', walletAddress, query, headers = {}, body } = {}) {
  const requestQuery = buildQueryString({ ...query, walletAddress })
  const requestUrl = `${superApiUrl(path)}${requestQuery ? `?${requestQuery}` : ''}`
  const response = await fetch(requestUrl, {
    method,
    headers: {
      ...(walletAddress ? getWalletHeaders(walletAddress) : {}),
      ...headers,
    },
    body,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new Error(data?.message || data?.details || data?.error || `Request failed: ${response.status}`)
  }

  return data
}

function normalizeApiKey(item, index = 0) {
  const maskedKey = item.maskedKey || item.masked_key || item.preview || item.keyPrefix || item.key_prefix || item.prefix || item.key || ''

  return {
    id: item.id || item.keyId || item.key_id || item.name || item.keyName || item.key_name || `key-${index}`,
    name: item.name || item.keyName || item.key_name || `API Key ${index + 1}`,
    prefix: item.prefix || item.keyPrefix || item.key_prefix || maskedKey,
    maskedKey,
    createdAt: item.createdAt || item.created_at || null,
    lastUsedAt: item.lastUsedAt || item.last_used_at || item.lastRequestAt || item.last_request_at || null,
    status: item.status || (item.revoked ? 'revoked' : 'active'),
    requestsToday: item.requestsToday ?? item.requests_today ?? item.dailyRequests ?? item.daily_requests ?? 0,
    totalRequests: item.totalRequests ?? item.total_requests ?? item.allTimeRequests ?? item.all_time_requests ?? 0,
  }
}

function normalizeUsagePayload(data) {
  const normalizeLatency = (latency) => ({
    avgMs: latency?.avgMs ?? 0,
    p50Ms: latency?.p50Ms ?? 0,
    p95Ms: latency?.p95Ms ?? 0,
    p99Ms: latency?.p99Ms ?? 0,
  })

  const normalizeUsageKeyRow = (item, scope) => {
    const isDailyScope = scope === 'daily'

    return {
      id: item?.id || item?.keyId || item?.key_id || item?.prefix || null,
      prefix: item?.prefix || item?.keyPrefix || item?.key_prefix || '',
      label: item?.label || item?.name || item?.keyName || item?.key_name || 'Unlabeled key',
      agentId: item?.agentId || item?.agent_id || null,
      agentWalletEvm: item?.agentWalletEvm || item?.agent_wallet_evm || null,
      agentWalletSol: item?.agentWalletSol || item?.agent_wallet_sol || null,
      createdAt: item?.createdAt || item?.created_at || null,
      lastUsedAt: item?.lastUsedAt || item?.last_used_at || null,
      totalRequests: item?.totalRequests ?? item?.total_requests ?? 0,
      successful: isDailyScope ? (item?.successfulToday ?? 0) : (item?.successful ?? 0),
      failed: isDailyScope ? (item?.failedToday ?? 0) : (item?.failed ?? 0),
      clientErrors: isDailyScope ? (item?.clientErrorsToday ?? 0) : (item?.clientErrors ?? 0),
      serverErrors: isDailyScope ? (item?.serverErrorsToday ?? 0) : (item?.serverErrors ?? 0),
      successRatePct: isDailyScope ? (item?.successRatePctToday ?? 0) : (item?.successRatePct ?? 0),
      failureRatePct: isDailyScope ? (item?.failureRatePctToday ?? 0) : (item?.failureRatePct ?? 0),
      requestsToday: item?.requestsToday ?? 0,
      activeToday: Boolean(item?.activeToday),
      latency: normalizeLatency(isDailyScope ? item?.latencyToday : item?.latency),
    }
  }

  const normalizeUsageSummary = (summary) => ({
    matchedKeys: summary?.matchedKeys ?? 0,
    totalRequests: summary?.totalRequests ?? 0,
    successful: summary?.successful ?? 0,
    failed: summary?.failed ?? 0,
    clientErrors: summary?.clientErrors ?? 0,
    serverErrors: summary?.serverErrors ?? 0,
    successRatePct: summary?.successRatePct ?? 0,
    failureRatePct: summary?.failureRatePct ?? 0,
    latency: normalizeLatency(summary?.latency),
  })

  const dailyKeysSource = Array.isArray(data?.daily?.keys)
    ? data.daily.keys
    : isObject(data?.daily?.apiKeys)
      ? Object.values(data.daily.apiKeys)
      : []
  const allTimeKeysSource = Array.isArray(data?.allTime?.keys)
    ? data.allTime.keys
    : isObject(data?.allTime?.apiKeys)
      ? Object.values(data.allTime.apiKeys)
      : []
  const dailySummary = normalizeUsageSummary(data?.daily?.summary)
  const allTimeSummary = normalizeUsageSummary(data?.allTime?.summary)
  const dailyKeys = dailyKeysSource.map((item) => normalizeUsageKeyRow(item, 'daily'))
  const allTimeKeys = allTimeKeysSource.map((item) => normalizeUsageKeyRow(item, 'allTime'))

  return {
    endpoint: data?.endpoint || null,
    dayKey: data?.dayKey || null,
    startedAt: data?.startedAt || null,
    resetsAt: data?.resetsAt || null,
    filter: isObject(data?.filter) ? data.filter : {},
    daily: {
      summary: dailySummary,
      keys: dailyKeys,
    },
    allTime: {
      summary: allTimeSummary,
      keys: allTimeKeys,
    },
    requestsToday: dailySummary.totalRequests,
    successfulToday: dailySummary.successful,
    failedToday: dailySummary.failed,
    successRatePctToday: dailySummary.successRatePct,
    activeKeysToday: dailyKeys.filter((item) => item.activeToday).length || dailySummary.matchedKeys,
    totalRequests: allTimeSummary.totalRequests,
    successful: allTimeSummary.successful,
    failed: allTimeSummary.failed,
    keyCount: allTimeSummary.matchedKeys || dailySummary.matchedKeys,
    keyRows: dailyKeys,
    allTimeKeyRows: allTimeKeys,
    endpointRows: [],
    raw: data,
  }
}

function normalizeGeneratedKey(data) {
  return {
    id: data?.id || data?.keyId || data?.key_id || null,
    name: data?.name || data?.keyName || data?.key_name || data?.label || 'New API Key',
    key: data?.key || data?.apiKey || data?.generatedKey || data?.token || data?.api_key || '',
    maskedKey: data?.maskedKey || data?.masked_key || data?.preview || '',
    createdAt: data?.createdAt || data?.created_at || null,
  }
}

export function clawsFunApiUrl(path) {
  return `${BACKEND_URL}${path}`
}

export function superApiWsUrl(path) {
  return `${SUPER_API_WS_URL}${path}`
}

export function getWalletHeaders(address) {
  if (!address) {
    return {}
  }

  return {
    'x-wallet-address': address,
  }
}

export async function fetchJson(path, options = {}) {
  const response = await fetch(clawsFunApiUrl(path), options)
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new Error(data?.details || data?.error || `Request failed: ${response.status}`)
  }

  return data
}

function normalizeAgent(agent) {
  const metadata = isObject(agent.metadata) ? agent.metadata : {}
  const skillType = agent.skillType || agent.skill_type || metadata.skillType || metadata.skill_type || metadata.type || null
  const skillRoute = agent.skillRoute || agent.skill_route || agent.route || metadata.skillRoute || metadata.skill_route || metadata.route || null
  const skillInline = agent.skillInline || agent.skill_inline || agent.inline || metadata.skillInline || metadata.skill_inline || metadata.inline || metadata.content || null

  return {
    ...agent,
    type: agent.type || agent.agent_type || null,
    walletAddress: agent.walletAddress || agent.wallet_address || null,
    chains: agent.chains || agent.metadata?.chains || [],
    risk: agent.risk || agent.metadata?.risk_level || null,
    skill: {
      type: skillType,
      route: skillRoute,
      inline: typeof skillInline === 'string' ? skillInline : null,
    },
    defaults: {
      cpuCores: agent.defaults?.cpuCores ?? agent.default_cpu_cores ?? null,
      memoryGb: agent.defaults?.memoryGb ?? agent.default_memory_gb ?? null,
      gpuType: agent.defaults?.gpuType ?? agent.default_gpu_type ?? null,
      numGpus: agent.defaults?.numGpus ?? agent.default_num_gpus ?? null,
      diskGb: agent.defaults?.diskGb ?? agent.default_disk_gb ?? null,
    },
  }
}

export async function fetchAgents() {
  const data = await fetchJson('/api/agents')
  return Array.isArray(data?.agents) ? data.agents.map(normalizeAgent) : []
}

export async function fetchAgentStats(agentId, includeKeys = true) {
  const cacheKey = getStatsAgentsCacheKey(agentId, includeKeys)
  const cached = readStatsAgentsCache(cacheKey)
  if (cached) {
    return cached
  }

  const query = new URLSearchParams({
    includeKeys: includeKeys ? 'true' : 'false',
  })

  if (agentId !== undefined && agentId !== null && agentId !== '') {
    query.set('agentId', String(agentId))
  }

  const response = await fetch(`${SUPER_API_URL}/admin/stats/agents?${query.toString()}`, {
    headers: {
      'x-admin-key': ADMIN_API_KEY,
    },
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Request failed: ${response.status}`)
  }

  writeStatsAgentsCache(cacheKey, data)

  return data
}


export async function generateUserApiKey(walletAddressOrOptions, name) {
  const options = isObject(walletAddressOrOptions)
    ? walletAddressOrOptions
    : {
        agentWalletEvm: walletAddressOrOptions,
        label: name,
      }
  const walletAddress = options.agentWalletEvm || options.walletAddress || ''

  if (!walletAddress) {
    throw new Error('Wallet address is required to generate an API key.')
  }

  if (!ADMIN_API_KEY) {
    throw new Error('VITE_ADMIN_API_KEY or ADMIN_API_KEY must be set.')
  }

  const payload = {
    label: options.label?.trim() || name?.trim() || 'user-website',
    agentWalletEvm: walletAddress,
  }

  if (options.agentId) {
    payload.agentId = String(options.agentId)
  }

  if (options.agentWalletSol) {
    payload.agentWalletSol = options.agentWalletSol
  }

  const data = await fetchSuperApiJson(USER_KEY_CREATE_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  return normalizeGeneratedKey(data)
}

export async function fetchUserUsageStats(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required to load usage stats.')
  }

  if (!ADMIN_API_KEY) {
    throw new Error('VITE_ADMIN_API_KEY or ADMIN_API_KEY must be set.')
  }

  const data = await fetchSuperApiJson(USER_USAGE_PATH, {
    query: {
      agentWalletEvm: walletAddress,
    },
    headers: {
      'x-admin-key': ADMIN_API_KEY,
    },
  })

  return normalizeUsagePayload(data)
}

export async function fetchAdminVolumeStats() {
  if (!ADMIN_API_KEY) {
    throw new Error('VITE_ADMIN_API_KEY or ADMIN_API_KEY must be set.')
  }

  return fetchSuperApiJson('/admin/stats/volume', {
    headers: {
      'x-admin-key': ADMIN_API_KEY,
    },
  })
}

export function superApiPublicUrl(path) {
  if (!path) {
    return SUPER_API_URL
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${SUPER_API_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export async function fetchUserSessions(walletAddress) {
  if (!walletAddress) {
    throw new Error('Wallet address is required to load sessions.')
  }

  const data = await fetchJson(`/api/sessions?wallet=${encodeURIComponent(walletAddress)}`, {
    headers: getWalletHeaders(walletAddress),
  })

  return Array.isArray(data?.sessions) ? data.sessions : []
}

export function findReusableSession(sessions) {
  const activeStatuses = ['running', 'starting', 'bootstrapping', 'provisioning', 'retrying']
  const invalidStatuses = ['terminated', 'expired', 'failed', 'error']

  return sessions.find((session) => {
    const status = String(session.status || '').toLowerCase()
    const hasTimeLeft = typeof session.timeRemaining !== 'number' || session.timeRemaining > 0

    return (session.isActive || activeStatuses.includes(status)) && !session.isExpired && hasTimeLeft && !invalidStatuses.includes(status)
  }) || null
}
