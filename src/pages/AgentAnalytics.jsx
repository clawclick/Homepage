import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { clawsFunApiUrl, fetchAgentStats, fetchAgents } from '../lib/sessionApi'

function formatPct(value) {
  if (typeof value !== 'number') {
    return '0.00%'
  }
  return `${value.toFixed(2)}%`
}

function formatNumber(value) {
  if (typeof value !== 'number') {
    return '0'
  }
  return value.toLocaleString()
}

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'Unavailable'
  }

  return `$${value.toFixed(2)}`
}

function formatAgentGpu(agent) {
  const gpuType = agent?.defaults?.gpuType || 'Any GPU'
  const gpuCount = agent?.defaults?.numGpus || 1
  const cpuCores = agent?.defaults?.cpuCores
  const memoryGb = agent?.defaults?.memoryGb

  const resourceBits = []

  if (cpuCores) {
    resourceBits.push(`${cpuCores} CPU`)
  }

  if (memoryGb) {
    resourceBits.push(`${memoryGb}GB RAM`)
  }

  return `${gpuType} x${gpuCount}${resourceBits.length ? ` • ${resourceBits.join(' • ')}` : ''}`
}

const AgentAnalytics = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payload, setPayload] = useState(null)
  const [marketplaceAgents, setMarketplaceAgents] = useState([])
  const [dailyEstimate, setDailyEstimate] = useState(null)
  const [dailyEstimateLoading, setDailyEstimateLoading] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError('')

    fetchAgentStats(id, true)
      .then((data) => {
        if (isMounted) {
          setPayload(data)
        }
      })
      .catch((statsError) => {
        if (isMounted) {
          setError(statsError.message || 'Failed to load agent analytics.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id])

  useEffect(() => {
    let isMounted = true

    fetchAgents()
      .then((data) => {
        if (isMounted) {
          setMarketplaceAgents(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const statsAgent = useMemo(() => payload?.agents?.[0] || null, [payload])

  const marketplaceAgent = useMemo(() => {
    return marketplaceAgents.find((item) => String(item.id) === String(id)) || null
  }, [id, marketplaceAgents])

  const agent = useMemo(() => {
    if (!statsAgent && !marketplaceAgent) {
      return null
    }

    return {
      ...statsAgent,
      ...marketplaceAgent,
      defaults: {
        ...(statsAgent?.defaults || {}),
        ...(marketplaceAgent?.defaults || {}),
      },
      daily: statsAgent?.daily,
      allTime: statsAgent?.allTime,
      keys: statsAgent?.keys,
    }
  }, [marketplaceAgent, statsAgent])

  useEffect(() => {
    if (!agent?.defaults) {
      setDailyEstimate(null)
      setDailyEstimateLoading(false)
      return
    }

    const gpuType = agent.defaults.gpuType
    const numGpus = agent.defaults.numGpus || 1
    const cpuCores = agent.defaults.cpuCores
    const memoryGb = agent.defaults.memoryGb
    const diskGb = agent.defaults.diskGb

    setDailyEstimateLoading(true)

    fetch(clawsFunApiUrl('/api/session/estimate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gpuType: gpuType === 'Any GPU' ? undefined : gpuType,
        numGpus,
        cpuCores,
        memoryGb,
        diskGb,
        durationHours: 24,
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && data.available && typeof data.totalPrice === 'number') {
          setDailyEstimate({
            totalPrice: data.totalPrice,
            gpuName: data.gpuName || gpuType || 'Any GPU',
          })
          return
        }

        if (data && data.available && typeof data.hourlyPrice === 'number') {
          setDailyEstimate({
            totalPrice: data.hourlyPrice * 24,
            gpuName: data.gpuName || gpuType || 'Any GPU',
          })
          return
        }

        setDailyEstimate(null)
      })
      .catch(() => {
        setDailyEstimate(null)
      })
      .finally(() => {
        setDailyEstimateLoading(false)
      })
  }, [agent])

  return (
    <div className="agent-analytics-page">
      <section className="agent-analytics-hero">
        <div className="agent-analytics-inner">
          <p className="agent-analytics-kicker">Agent Analytics</p>
          <h1 className="agent-analytics-title">{agent?.name || id}</h1>
          <p className="agent-analytics-subtitle">
            {agent?.description || 'Daily + all-time API performance, including successful and failed request quality metrics.'}
          </p>

          {agent && (
            <div className="agent-analytics-overview">
              <div className="agent-analytics-overview-main">
                <div className="agent-overview-chip">
                  <span>Type</span>
                  <strong>{agent.type || 'Agent'}</strong>
                </div>
                <div className="agent-overview-chip agent-overview-chip-accent">
                  <span>Recommended GPU</span>
                  <strong>{formatAgentGpu(agent)}</strong>
                </div>
              </div>
              <div className="agent-analytics-overview-meta">
                <div className="agent-overview-meta-card">
                  <span>Name</span>
                  <strong>{agent.name || id}</strong>
                </div>
                <div className="agent-overview-meta-card">
                  <span>Cost Per Day</span>
                  <strong>
                    {dailyEstimateLoading ? 'Estimating...' : formatCurrency(dailyEstimate?.totalPrice)}
                  </strong>
                  {!dailyEstimateLoading && (
                    <em className="agent-overview-meta-note">
                      {dailyEstimate?.gpuName ? `24h estimate via ${dailyEstimate.gpuName}` : '24h estimate based on recommended runtime'}
                    </em>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="agent-analytics-actions">
            <Link className="btn-secondary" to="/app">Back to Marketplace</Link>
            <Link className="btn-primary" to={`/deploy?agent=${encodeURIComponent(id || '')}`}>Deploy Agent</Link>
          </div>
        </div>
      </section>

      <section className="agent-analytics-section">
        <div className="agent-analytics-inner">
          {loading && <div className="agent-analytics-message">Loading analytics...</div>}
          {!loading && error && <div className="deploy-error-banner">{error}</div>}

          {!loading && !error && !agent && (
            <div className="agent-analytics-message">No analytics found for this agent yet.</div>
          )}

          {!loading && !error && agent && (
            <>
              <div className="agent-summary-grid">
                <div className="agent-summary-card">
                  <span className="agent-summary-label">Requests Today</span>
                  <strong>{formatNumber(agent.daily.requestsToday)}</strong>
                </div>
                <div className="agent-summary-card">
                  <span className="agent-summary-label">Successful Today</span>
                  <strong>{formatNumber(agent.daily.successfulToday)}</strong>
                </div>
                <div className="agent-summary-card">
                  <span className="agent-summary-label">Failed Today</span>
                  <strong>{formatNumber(agent.daily.failedToday)}</strong>
                </div>
                <div className="agent-summary-card">
                  <span className="agent-summary-label">Success Rate Today</span>
                  <strong>{formatPct(agent.daily.successRatePctToday)}</strong>
                </div>
              </div>

              <div className="agent-panels">
                <article className="agent-panel">
                  <h2>Daily</h2>
                  <div className="agent-metric-grid">
                    <div><span>Total Requests</span><strong>{formatNumber(agent.daily.requestsToday)}</strong></div>
                    <div><span>Successful</span><strong>{formatNumber(agent.daily.successfulToday)}</strong></div>
                    <div><span>Failed</span><strong>{formatNumber(agent.daily.failedToday)}</strong></div>
                    <div><span>Client Errors</span><strong>{formatNumber(agent.daily.clientErrorsToday)}</strong></div>
                    <div><span>Server Errors</span><strong>{formatNumber(agent.daily.serverErrorsToday)}</strong></div>
                    <div><span>Success Rate</span><strong>{formatPct(agent.daily.successRatePctToday)}</strong></div>
                    <div><span>Failure Rate</span><strong>{formatPct(agent.daily.failureRatePctToday)}</strong></div>
                    <div><span>Active Keys Today</span><strong>{formatNumber(agent.daily.activeKeysToday)}</strong></div>
                    <div><span>Avg Latency</span><strong>{formatNumber(agent.daily.latencyToday.avgMs)}ms</strong></div>
                    <div><span>P50</span><strong>{formatNumber(agent.daily.latencyToday.p50Ms)}ms</strong></div>
                    <div><span>P95</span><strong>{formatNumber(agent.daily.latencyToday.p95Ms)}ms</strong></div>
                    <div><span>P99</span><strong>{formatNumber(agent.daily.latencyToday.p99Ms)}ms</strong></div>
                  </div>
                </article>

                <article className="agent-panel">
                  <h2>All Time</h2>
                  <div className="agent-metric-grid">
                    <div><span>Total Requests</span><strong>{formatNumber(agent.allTime.totalRequests)}</strong></div>
                    <div><span>Successful</span><strong>{formatNumber(agent.allTime.successful)}</strong></div>
                    <div><span>Failed</span><strong>{formatNumber(agent.allTime.failed)}</strong></div>
                    <div><span>Client Errors</span><strong>{formatNumber(agent.allTime.clientErrors)}</strong></div>
                    <div><span>Server Errors</span><strong>{formatNumber(agent.allTime.serverErrors)}</strong></div>
                    <div><span>Success Rate</span><strong>{formatPct(agent.allTime.successRatePct)}</strong></div>
                    <div><span>Failure Rate</span><strong>{formatPct(agent.allTime.failureRatePct)}</strong></div>
                    <div><span>Key Count</span><strong>{formatNumber(agent.allTime.keyCount)}</strong></div>
                    <div><span>Avg Latency</span><strong>{formatNumber(agent.allTime.latency.avgMs)}ms</strong></div>
                    <div><span>P50</span><strong>{formatNumber(agent.allTime.latency.p50Ms)}ms</strong></div>
                    <div><span>P95</span><strong>{formatNumber(agent.allTime.latency.p95Ms)}ms</strong></div>
                    <div><span>P99</span><strong>{formatNumber(agent.allTime.latency.p99Ms)}ms</strong></div>
                  </div>
                </article>
              </div>

              <article className="agent-panel">
                <h2>Key-Level Daily Stats</h2>
                <div className="agent-table-wrap">
                  <table className="agent-table">
                    <thead>
                      <tr>
                        <th>Key Prefix</th>
                        <th>Total</th>
                        <th>Successful</th>
                        <th>Failed</th>
                        <th>Success %</th>
                        <th>Failure %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(agent.keys?.daily || []).map((item) => (
                        <tr key={item.id}>
                          <td>{item.prefix}</td>
                          <td>{formatNumber(item.requestsToday)}</td>
                          <td>{formatNumber(item.successfulToday)}</td>
                          <td>{formatNumber(item.failedToday)}</td>
                          <td>{formatPct(item.successRatePctToday)}</td>
                          <td>{formatPct(item.failureRatePctToday)}</td>
                        </tr>
                      ))}
                      {(!agent.keys?.daily || agent.keys.daily.length === 0) && (
                        <tr>
                          <td colSpan={6}>No key-level daily rows available.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </article>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default AgentAnalytics
