import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useEthereumWallet } from '../hooks/useEthereumWallet'
import { fetchUserUsageStats, generateUserApiKey } from '../lib/sessionApi'

function formatCompactNumber(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0'
  }

  return value.toLocaleString()
}

function formatPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00%'
  }

  return `${value.toFixed(2)}%`
}

function shortenWallet(address) {
  if (!address) {
    return ''
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const ApiUsage = () => {
  const { account, connect, hasProvider, isConnected, isConnecting } = useEthereumWallet()
  const [walletError, setWalletError] = useState('')
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageError, setUsageError] = useState('')
  const [usage, setUsage] = useState(null)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [generatedKey, setGeneratedKey] = useState(null)

  const loadUsage = async (walletAddress) => {
    const nextUsage = await fetchUserUsageStats(walletAddress)
    setUsage(nextUsage)
    return nextUsage
  }

  useEffect(() => {
    if (!account) {
      setUsage(null)
      setUsageError('')
      setGeneratedKey(null)
      return
    }

    let isMounted = true
    setUsageLoading(true)
    setUsageError('')

    fetchUserUsageStats(account)
      .then((data) => {
        if (isMounted) {
          setUsage(data)
        }
      })
      .catch((error) => {
        if (isMounted) {
          setUsageError(error.message || 'Failed to load usage stats.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setUsageLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [account])

  const handleConnect = async () => {
    setWalletError('')

    try {
      await connect()
    } catch (error) {
      setWalletError(error.message || 'Wallet connection failed.')
    }
  }

  const handleRefreshUsage = async () => {
    if (!account || usageLoading) {
      return
    }

    setUsageLoading(true)
    setUsageError('')

    try {
      await loadUsage(account)
    } catch (error) {
      setUsageError(error.message || 'Failed to load usage stats.')
    } finally {
      setUsageLoading(false)
    }
  }

  const handleGenerateKey = async () => {
    if (!account || generatingKey) {
      return
    }

    setGeneratingKey(true)
    setUsageError('')
    setGeneratedKey(null)

    try {
      const nextKey = await generateUserApiKey(account)
      setGeneratedKey(nextKey)
      await loadUsage(account)
    } catch (error) {
      setUsageError(error.message || 'Failed to generate API key.')
    } finally {
      setGeneratingKey(false)
    }
  }

  return (
    <div className="agent-analytics-page">
      <section className="agent-analytics-hero">
        <div className="agent-analytics-inner">
          <div>
            <Link to="/api" className="deploy-link-back">Back to API docs</Link>
            <p className="agent-analytics-kicker">My Api</p>
            <h1 className="agent-analytics-title">{isConnected && account ? shortenWallet(account) : 'My Api'}</h1>
            <p className="agent-analytics-subtitle">Your unified Claw.Click API dashboard, powered by the user stats endpoint.</p>
          </div>
          <div className="agent-analytics-actions">
            {isConnected && account && (
              <button className="btn-primary" type="button" onClick={handleGenerateKey} disabled={generatingKey}>
                {generatingKey ? 'Generating...' : 'Generate New Key'}
              </button>
            )}
            <button className="btn-secondary" type="button" onClick={handleRefreshUsage} disabled={!isConnected || usageLoading}>
              {usageLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </section>

      <section className="agent-analytics-section">
        <div className="agent-analytics-inner">
          {!hasProvider && (
            <div className="terminal-empty-card api-access-empty-card">
              <h1>MetaMask required</h1>
              <p>Install MetaMask so usage can be looked up by wallet address.</p>
            </div>
          )}

          {hasProvider && !isConnected && (
            <div className="terminal-empty-card api-access-empty-card">
              <h1>Connect your wallet</h1>
              <p>Usage is loaded for the connected wallet address only.</p>
              {walletError && <div className="deploy-error-banner">{walletError}</div>}
              <button className="deploy-wallet-button" type="button" onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
            </div>
          )}

          {isConnected && account && (
            <>
              {generatedKey?.key && (
                <div className="api-generated-key-card">
                  <div className="api-generated-key-header">
                    <div>
                      <p className="api-access-eyebrow">New Key Created</p>
                      <h4>{generatedKey.name}</h4>
                    </div>
                  </div>
                  <p className="api-generated-key-note">The new key has been created and the table below has been refreshed from the stats endpoint.</p>
                  <div className="api-generated-key-value">{generatedKey.key}</div>
                </div>
              )}

              {usageError && <div className="deploy-error-banner">{usageError}</div>}
              {usageLoading && <div className="agent-analytics-message">Loading API dashboard...</div>}

              {!usageLoading && usage && (
                <>
                  <div className="agent-summary-grid api-usage-summary-grid">
                    <div className="agent-summary-card">
                      <span className="agent-summary-label">Requests Today</span>
                      <strong>{formatCompactNumber(usage.requestsToday)}</strong>
                    </div>
                    <div className="agent-summary-card">
                      <span className="agent-summary-label">Successful Today</span>
                      <strong>{formatCompactNumber(usage.successfulToday)}</strong>
                    </div>
                    <div className="agent-summary-card">
                      <span className="agent-summary-label">Failed Today</span>
                      <strong>{formatCompactNumber(usage.failedToday)}</strong>
                    </div>
                    <div className="agent-summary-card">
                      <span className="agent-summary-label">Success Rate Today</span>
                      <strong>{formatPercent(usage.successRatePctToday)}</strong>
                    </div>
                  </div>

                  <div className="agent-panels api-usage-panels">
                    <article className="agent-panel">
                      <h2>Daily</h2>
                      <div className="agent-metric-grid">
                        <div><span>Total Requests</span><strong>{formatCompactNumber(usage.daily.summary.totalRequests)}</strong></div>
                        <div><span>Successful</span><strong>{formatCompactNumber(usage.daily.summary.successful)}</strong></div>
                        <div><span>Failed</span><strong>{formatCompactNumber(usage.daily.summary.failed)}</strong></div>
                        <div><span>Client Errors</span><strong>{formatCompactNumber(usage.daily.summary.clientErrors)}</strong></div>
                        <div><span>Server Errors</span><strong>{formatCompactNumber(usage.daily.summary.serverErrors)}</strong></div>
                        <div><span>Success Rate</span><strong>{formatPercent(usage.daily.summary.successRatePct)}</strong></div>
                        <div><span>Failure Rate</span><strong>{formatPercent(usage.daily.summary.failureRatePct)}</strong></div>
                        <div><span>Active Keys Today</span><strong>{formatCompactNumber(usage.activeKeysToday)}</strong></div>
                        <div><span>Avg Latency</span><strong>{formatCompactNumber(usage.daily.summary.latency.avgMs)} ms</strong></div>
                        <div><span>P50</span><strong>{formatCompactNumber(usage.daily.summary.latency.p50Ms)} ms</strong></div>
                        <div><span>P95</span><strong>{formatCompactNumber(usage.daily.summary.latency.p95Ms)} ms</strong></div>
                        <div><span>P99</span><strong>{formatCompactNumber(usage.daily.summary.latency.p99Ms)} ms</strong></div>
                      </div>
                    </article>

                    <article className="agent-panel">
                      <h2>All Time</h2>
                      <div className="agent-metric-grid">
                        <div><span>Total Requests</span><strong>{formatCompactNumber(usage.allTime.summary.totalRequests)}</strong></div>
                        <div><span>Successful</span><strong>{formatCompactNumber(usage.allTime.summary.successful)}</strong></div>
                        <div><span>Failed</span><strong>{formatCompactNumber(usage.allTime.summary.failed)}</strong></div>
                        <div><span>Client Errors</span><strong>{formatCompactNumber(usage.allTime.summary.clientErrors)}</strong></div>
                        <div><span>Server Errors</span><strong>{formatCompactNumber(usage.allTime.summary.serverErrors)}</strong></div>
                        <div><span>Success Rate</span><strong>{formatPercent(usage.allTime.summary.successRatePct)}</strong></div>
                        <div><span>Failure Rate</span><strong>{formatPercent(usage.allTime.summary.failureRatePct)}</strong></div>
                        <div><span>Key Count</span><strong>{formatCompactNumber(usage.keyCount)}</strong></div>
                        <div><span>Avg Latency</span><strong>{formatCompactNumber(usage.allTime.summary.latency.avgMs)} ms</strong></div>
                        <div><span>P50</span><strong>{formatCompactNumber(usage.allTime.summary.latency.p50Ms)} ms</strong></div>
                        <div><span>P95</span><strong>{formatCompactNumber(usage.allTime.summary.latency.p95Ms)} ms</strong></div>
                        <div><span>P99</span><strong>{formatCompactNumber(usage.allTime.summary.latency.p99Ms)} ms</strong></div>
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
                          {(usage.keyRows || []).map((row, index) => (
                            <tr key={row.id || row.prefix || `daily-key-${index}`}>
                              <td>{row.prefix || 'Unknown key'}</td>
                              <td>{formatCompactNumber(row.requestsToday)}</td>
                              <td>{formatCompactNumber(row.successful)}</td>
                              <td>{formatCompactNumber(row.failed)}</td>
                              <td>{formatPercent(row.successRatePct)}</td>
                              <td>{formatPercent(row.failureRatePct)}</td>
                            </tr>
                          ))}
                          {(!usage.keyRows || usage.keyRows.length === 0) && (
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
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default ApiUsage