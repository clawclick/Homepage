const BACKEND_URL = import.meta.env.VITE_CLAWS_FUN_BACKEND_URL || 'https://claws-fun-backend-764a4f25b49e.herokuapp.com'

export function clawsFunApiUrl(path) {
  return `${BACKEND_URL}${path}`
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
  return {
    ...agent,
    type: agent.type || agent.agent_type || null,
    walletAddress: agent.walletAddress || agent.wallet_address || null,
    chains: agent.chains || agent.metadata?.chains || [],
    risk: agent.risk || agent.metadata?.risk_level || null,
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
