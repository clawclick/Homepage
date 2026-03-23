import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEthereumWallet } from '../hooks/useEthereumWallet'
import { clawsFunApiUrl, fetchAgents, fetchJson } from '../lib/sessionApi'

const ANY_GPU = {
  id: 'any',
  label: 'Any GPU',
  desc: 'Cheapest suitable machine from Vast.ai',
  minPrice: 0.03,
}

const LOCATION_TO_COUNTRIES = {
  any: undefined,
  US: 'US',
  CA: 'CA',
  GB: 'GB',
  EU: 'DE,FR,NL,ES,CZ,PL,BG,HU,DK',
  SE: 'SE,NO,IS,FI',
  JP: 'JP',
  KR: 'KR',
}

const LOCATION_OPTIONS = [
  { id: 'any', label: 'Any', detail: 'Cheapest worldwide' },
  { id: 'US', label: 'US', detail: 'United States' },
  { id: 'CA', label: 'CA', detail: 'Canada' },
  { id: 'GB', label: 'UK', detail: 'United Kingdom' },
  { id: 'EU', label: 'EU', detail: 'European Union' },
  { id: 'SE', label: 'Nordic', detail: 'Nordics' },
  { id: 'JP', label: 'JP', detail: 'Japan' },
  { id: 'KR', label: 'KR', detail: 'Korea' },
]

const GPU_COUNT_OPTIONS = [1, 2, 4]

const GPU_RESOURCE_DEFAULTS = {
  any: { cpu: 2, ram: 4, disk: 10 },
  'RTX 4060': { cpu: 6, ram: 16, disk: 20 },
  'RTX 4090': { cpu: 8, ram: 32, disk: 20 },
  'RTX 5090': { cpu: 16, ram: 64, disk: 30 },
  'H100 SXM': { cpu: 16, ram: 128, disk: 40 },
  H200: { cpu: 16, ram: 128, disk: 40 },
}

const DeploySession = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedAgentId = Number(searchParams.get('agent') || searchParams.get('strategy'))
  const {
    account,
    chainId,
    connect,
    error: walletError,
    hasProvider,
    isConnected,
    isConnecting,
    sendTransaction,
  } = useEthereumWallet()

  const [cpu, setCpu] = useState(2)
  const [memory, setMemory] = useState(4)
  const [durationHours, setDurationHours] = useState(4)
  const [gpuType, setGpuType] = useState('any')
  const [numGpus, setNumGpus] = useState(1)
  const [diskGb, setDiskGb] = useState(10)
  const [location, setLocation] = useState('any')
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [gpuOptions, setGpuOptions] = useState([ANY_GPU])
  const [gpusLoading, setGpusLoading] = useState(true)
  const [treasuryAddress, setTreasuryAddress] = useState('')
  const [ethPriceUsd, setEthPriceUsd] = useState(2500)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [realHourlyPrice, setRealHourlyPrice] = useState(null)
  const [realGpuName, setRealGpuName] = useState('')
  const [numOffers, setNumOffers] = useState(0)
  const [pricingFallback, setPricingFallback] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agents, setAgents] = useState([])

  const selectedAgent = useMemo(() => {
    return agents.find((agent) => Number(agent.id) === requestedAgentId) || null
  }, [agents, requestedAgentId])

  const agentId = selectedAgent?.id ?? requestedAgentId ?? null

  useEffect(() => {
    fetchAgents()
      .then((data) => setAgents(data))
      .catch(() => {})

    setGpusLoading(true)

    fetchJson('/api/session/gpus')
      .then((data) => {
        if (!data?.gpus?.length) {
          return
        }

        const fetched = data.gpus.slice(0, 20).map((gpu) => ({
          id: gpu.name,
          label: gpu.name,
          desc: `${gpu.vramGb}GB VRAM`,
          minPrice: gpu.minPricePerHour,
          available: gpu.available,
        }))
        const cheapest = Math.min(...fetched.map((gpu) => gpu.minPrice))
        setGpuOptions([{ ...ANY_GPU, minPrice: cheapest }, ...fetched])
      })
      .catch(() => {})
      .finally(() => setGpusLoading(false))

    fetchJson('/api/payment')
      .then((data) => {
        if (data?.treasuryAddress) {
          setTreasuryAddress(data.treasuryAddress)
        }

        if (typeof data?.ethPriceUsd === 'number') {
          setEthPriceUsd(data.ethPriceUsd)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedAgent?.defaults) {
      return
    }

    if (selectedAgent.defaults.gpuType) {
      setGpuType(selectedAgent.defaults.gpuType)
    }

    if (selectedAgent.defaults.numGpus) {
      setNumGpus(selectedAgent.defaults.numGpus)
    }

    if (selectedAgent.defaults.cpuCores) {
      setCpu(selectedAgent.defaults.cpuCores)
    }

    if (selectedAgent.defaults.memoryGb) {
      setMemory(selectedAgent.defaults.memoryGb)
    }

    if (selectedAgent.defaults.diskGb) {
      setDiskGb(selectedAgent.defaults.diskGb)
    }
  }, [selectedAgent])

  useEffect(() => {
    const defaults = GPU_RESOURCE_DEFAULTS[gpuType] || GPU_RESOURCE_DEFAULTS.any
    setCpu(defaults.cpu)
    setMemory(defaults.ram)
    setDiskGb(defaults.disk)
  }, [gpuType])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPricingLoading(true)
      setPricingFallback(false)

      fetch(clawsFunApiUrl('/api/session/estimate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gpuType: gpuType === 'any' ? undefined : gpuType,
          numGpus,
          cpuCores: cpu,
          memoryGb: memory,
          diskGb,
          durationHours,
          geolocation: LOCATION_TO_COUNTRIES[location],
        }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          const gpuTypes = gpuType === 'any' ? undefined : gpuType
          console.log('Pricing estimate data', data, gpuTypes)
          if (data && data.available && data.hourlyPrice > 0) {
            setRealHourlyPrice(data.hourlyPrice)
            setRealGpuName(data.gpuName || '')
            setNumOffers(data.numOffers || 0)
            setPricingFallback(Boolean(data.fallback))
            return
          }

          setRealHourlyPrice(null)
          setRealGpuName('')
          setNumOffers(0)
        })
        .catch(() => {
          setRealHourlyPrice(null)
          setRealGpuName('')
          setNumOffers(0)
          setPricingFallback(true)
        })
        .finally(() => setPricingLoading(false))
    }, 550)

    return () => window.clearTimeout(timer)
  }, [cpu, diskGb, durationHours, gpuType, location, memory, numGpus])

  const selectedGpu = useMemo(() => {
    return gpuOptions.find((gpu) => gpu.id === gpuType) || gpuOptions[0] || ANY_GPU
  }, [gpuOptions, gpuType])

  const selectedGpuMinimums = useMemo(() => {
    return GPU_RESOURCE_DEFAULTS[gpuType] || GPU_RESOURCE_DEFAULTS.any
  }, [gpuType])

  const fallbackHourly = selectedGpu.minPrice * numGpus + cpu * 0.01 + memory * 0.005
  const hourlyPrice = (realHourlyPrice ?? fallbackHourly) * 1.1
  const totalUsd = hourlyPrice * durationHours
  const totalEth = ethPriceUsd > 0 ? (totalUsd / ethPriceUsd).toFixed(6) : '0.000000'

  const handleConnect = async () => {
    setError('')
    try {
      await connect()
    } catch (connectError) {
      setError(connectError.message)
    }
  }

  const handleDeploy = async () => {
    if (!isConnected || !account) {
      setError('Connect your wallet before starting a session.')
      return
    }

    if (!agentId) {
      setError('Select an agent card before launching a session.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      let paymentTx = `0x${'f'.repeat(64)}`
      if (treasuryAddress && treasuryAddress !== '0x0000000000000000000000000000000000000000') {
        setStatusText('Confirm the payment in MetaMask...')
        paymentTx = await sendTransaction({ to: treasuryAddress, valueEth: totalEth })
      }

      setStatusText('Provisioning GPU and loading agent bundle...')
      const createPayload = {
        agentId,
        userAddress: account,
        cpuCores: cpu,
        memoryGb: memory,
        gpuType: gpuType === 'any' ? undefined : gpuType,
        numGpus,
        durationHours,
        diskGb,
        geolocation: LOCATION_TO_COUNTRIES[location],
        paymentTx,
        apiKeys: {
          openai: openaiKey || undefined,
          anthropic: anthropicKey || undefined,
        },
      }
      console.log('/api/session/create payload', createPayload)
      const createResponse = await fetchJson('/api/session/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createPayload),
      })

      setStatusText('Session created. Opening terminal...')
      window.setTimeout(() => {
        navigate(`/session/${createResponse.sessionId}`)
      }, 900)
    } catch (submitError) {
      setError(submitError.message || 'Failed to create session.')
      setStatusText('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="deploy-session-page">
      {/* Loading overlay after payment */}
      {isSubmitting && (
        <div className="deploy-loading-overlay">
          <div className="deploy-loading-content">
            <div className="st-spinner st-spinner-lg" />
            <h2>{statusText || 'Provisioning session...'}</h2>
            <p className="deploy-loading-subtitle">
              {statusText === 'Confirm the payment in MetaMask...'
                ? 'Please approve the transaction in your MetaMask wallet.'
                : statusText === 'Provisioning GPU and loading agent bundle...'
                ? 'Setting up your GPU instance and loading the agent. This may take 2-5 minutes.'
                : 'Setting up your session...'}
            </p>
          </div>
        </div>
      )}

      <div className="deploy-session-shell">
        <div className="deploy-session-topbar">
          <Link to="/app" className="deploy-link-back">Back to marketplace</Link>
          <div className="deploy-wallet-row">
            <span className="deploy-wallet-chip">{chainId ? `Chain ${parseInt(chainId, 16)}` : 'Wallet not connected'}</span>
            {isConnected ? (
              <span className="deploy-wallet-address">{`${account.slice(0, 6)}...${account.slice(-4)}`}</span>
            ) : (
              <button className="deploy-wallet-button" onClick={handleConnect} disabled={isConnecting}>
                {hasProvider ? (isConnecting ? 'Connecting...' : 'Connect MetaMask') : 'MetaMask required'}
              </button>
            )}
          </div>
        </div>

        <div className="deploy-session-grid">
          <aside className="deploy-panel deploy-panel-highlight">
            <span className="deploy-kicker">Session wizard</span>
            <h1>Launch a live agent session</h1>
            <p>
              {selectedAgent
                ? `You selected ${selectedAgent.name}. Configure hardware, route payment through claws-fun, and boot into a live terminal.`
                : 'Configure hardware, route payment through claws-fun, and boot into a live terminal.'}
            </p>

            {selectedAgent && (
              <div className="deploy-strategy-card">
                <div className="deploy-strategy-topline">
                  <span>Selected agent</span>
                  <strong>{selectedAgent.type || 'agent'}</strong>
                </div>
                <h2>{selectedAgent.name}</h2>
                <p>{selectedAgent.description || 'Use this backend agent to initialize the session configuration.'}</p>
                <div className="deploy-strategy-tags">
                  <span>{selectedAgent.walletAddress ? `${selectedAgent.walletAddress.slice(0, 6)}...${selectedAgent.walletAddress.slice(-4)}` : 'No wallet linked'}</span>
                  <span>{selectedAgent.defaults?.gpuType || 'Any GPU'}</span>
                  <span>{selectedAgent.metadata?.test ? 'Test agent' : 'Live agent'}</span>
                </div>
              </div>
            )}

            <div className="deploy-price-card">
              <div>
                <span>Total estimate</span>
                <strong>${totalUsd.toFixed(2)}</strong>
              </div>
              <div>
                <span>Payment</span>
                <strong>{totalEth} ETH</strong>
              </div>
              <div>
                <span>Runtime</span>
                <strong>{durationHours}h</strong>
              </div>
            </div>

            <ul className="deploy-note-list">
              <li>Pricing is estimated directly from the claws-fun Vast.ai session API.</li>
              <li>The selected card now supplies the agent id used for backend session lookups and provisioning.</li>
              <li>If a live session already exists for this wallet and agent id, you skip payment and reopen it.</li>
            </ul>

            <div className="deploy-warning-card">
              <span className="deploy-warning-kicker">Risk Warning</span>
              <ul className="deploy-warning-list">
                <li>No profit is guaranteed, and you can lose money using these agents.</li>
                <li>This is an experimental system built around autonomous trading workflows and revolutionary new trading techniques.</li>
                <li>Core decisions primarily rely on third-party LLMs and automated strategy logic, which can be wrong, delayed, or behave unpredictably in live markets.</li>
              </ul>
              <p className="deploy-warning-ack">By starting your session, you agree to these risks.</p>
            </div>
          </aside>

          <section className="deploy-panel">
            <div className="deploy-form-grid deploy-form-grid-stack">
              <div className="deploy-config-section deploy-field-full">
                <div className="deploy-section-heading">
                  <span>GPU type</span>
                  <small>{gpusLoading ? 'Loading available machines...' : `${Math.max(gpuOptions.length - 1, 0)} live GPU models`}</small>
                </div>
                <div className="deploy-grid-select deploy-gpu-grid">
                  {gpuOptions.map((gpu) => (
                    <button
                      key={gpu.id}
                      type="button"
                      className={`deploy-select-card ${gpuType === gpu.id ? 'is-active' : ''}`}
                      onClick={() => setGpuType(gpu.id)}
                    >
                      <div className="deploy-select-card-title-row">
                        <strong>{gpu.label}</strong>
                        <span>{typeof gpu.available === 'number' ? `${gpu.available} live` : 'live pricing'}</span>
                      </div>
                      <p>{gpu.desc}</p>
                      <div className="deploy-select-card-footer">from ${gpu.minPrice.toFixed(2)}/hr</div>
                    </button>
                  ))}
                </div>

                <div className="deploy-chip-row">
                  <span>GPU count</span>
                  <div className="deploy-pill-row">
                    {GPU_COUNT_OPTIONS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={`deploy-pill-button ${numGpus === count ? 'is-active' : ''}`}
                        onClick={() => setNumGpus(count)}
                      >
                        {count}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="deploy-config-section deploy-field-full">
                <div className="deploy-section-heading">
                  <span>Region</span>
                  <small>Filter where the Vast.ai instance can be placed</small>
                </div>
                <div className="deploy-grid-select deploy-location-grid">
                  {LOCATION_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`deploy-select-card deploy-select-card-compact ${location === option.id ? 'is-active' : ''}`}
                      onClick={() => setLocation(option.id)}
                    >
                      <strong>{option.label}</strong>
                      <p>{option.detail}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="deploy-config-section deploy-field-full">
                <div className="deploy-section-heading">
                  <span>Minimum resources</span>
                  <small>Higher settings narrow the machine pool and typically increase cost</small>
                </div>
                <div className="deploy-slider-stack">
                  <label className="deploy-slider-group">
                    <div className="deploy-slider-meta">
                      <span>Min CPU cores</span>
                      <strong>{cpu} cores</strong>
                    </div>
                    <input type="range" min={selectedGpuMinimums.cpu} max="32" step="2" value={cpu} onChange={(event) => setCpu(Math.max(Number(event.target.value), selectedGpuMinimums.cpu))} className="deploy-range" />
                    <div className="deploy-slider-scale"><span>{selectedGpuMinimums.cpu} cores</span><span>32 cores</span></div>
                  </label>

                  <label className="deploy-slider-group">
                    <div className="deploy-slider-meta">
                      <span>Min RAM</span>
                      <strong>{memory} GB</strong>
                    </div>
                    <input type="range" min={selectedGpuMinimums.ram} max="256" step="4" value={memory} onChange={(event) => setMemory(Math.max(Number(event.target.value), selectedGpuMinimums.ram))} className="deploy-range" />
                    <div className="deploy-slider-scale"><span>{selectedGpuMinimums.ram} GB</span><span>256 GB</span></div>
                  </label>

                  <label className="deploy-slider-group">
                    <div className="deploy-slider-meta">
                      <span>Min disk</span>
                      <strong>{diskGb} GB</strong>
                    </div>
                    <input type="range" min={selectedGpuMinimums.disk} max="200" step="10" value={diskGb} onChange={(event) => setDiskGb(Math.max(Number(event.target.value), selectedGpuMinimums.disk))} className="deploy-range" />
                    <div className="deploy-slider-scale"><span>{selectedGpuMinimums.disk} GB</span><span>200 GB</span></div>
                  </label>
                </div>
              </div>

              <div className="deploy-config-section deploy-field-full">
                <div className="deploy-section-heading">
                  <span>Duration</span>
                  <small>{durationHours} hours · {(durationHours / 24).toFixed(1)} days</small>
                </div>
                <label className="deploy-slider-group deploy-slider-group-standalone">
                  <input type="range" min="1" max="720" step="1" value={durationHours} onChange={(event) => setDurationHours(Number(event.target.value))} className="deploy-range" />
                  <div className="deploy-slider-scale"><span>1 hour</span><span>30 days</span></div>
                </label>
              </div>
            </div>

            <div className="deploy-estimate-grid">
              <div>
                <span>Host</span>
                <strong>{realGpuName || selectedGpu.label}</strong>
              </div>
              <div>
                <span>Hourly</span>
                <strong>{pricingLoading ? 'Refreshing...' : `$${hourlyPrice.toFixed(2)}`}</strong>
              </div>
              <div>
                <span>Offers</span>
                <strong>{numOffers || 'n/a'}</strong>
              </div>
            </div>

            <div className={`deploy-api-spotlight ${showApiKeys ? 'is-open' : ''}`}>
              <div className="deploy-api-spotlight-copy">
                <span className="deploy-api-spotlight-kicker">Important setup</span>
                <strong>Attach your model API keys before launch</strong>
                <p>Sessions work best when a model provider key is attached. Anthropic is the top recommendation for strong agentic task handling.</p>
              </div>
              <button className="deploy-toggle deploy-toggle-prominent deploy-toggle-flashy" onClick={() => setShowApiKeys((value) => !value)}>
                {showApiKeys ? 'Hide model API keys' : 'Attach model API keys'}
              </button>
            </div>

            {showApiKeys && (
              <div className="deploy-form-grid deploy-api-grid deploy-form-grid-stack deploy-api-fields">
                <label className="deploy-field deploy-field-full deploy-input-field deploy-input-field-featured">
                  <span>
                    Anthropic key
                    <em className="deploy-recommended-note">Highly recommended for best agentic task handling experience</em>
                  </span>
                  <input value={anthropicKey} onChange={(event) => setAnthropicKey(event.target.value)} placeholder="sk-ant-..." />
                </label>
                <label className="deploy-field deploy-field-full deploy-input-field">
                  <span>OpenAI key</span>
                  <input value={openaiKey} onChange={(event) => setOpenaiKey(event.target.value)} placeholder="sk-..." />
                </label>
              </div>
            )}

            {(error || walletError) && <div className="deploy-error-banner">{error || walletError}</div>}
            {statusText && <div className="deploy-status-banner">{statusText}</div>}
            {pricingFallback && <div className="deploy-subtle-note">Live pricing is unavailable right now. The estimate is using fallback logic.</div>}

            <div className="deploy-actions-row">
              <button className="btn-primary deploy-main-button" onClick={handleDeploy} disabled={isSubmitting || pricingLoading}>
                {isSubmitting ? 'Provisioning...' : 'Pay and launch terminal'}
              </button>
              <Link to="/app" className="btn-secondary deploy-cancel-link">Cancel</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default DeploySession
