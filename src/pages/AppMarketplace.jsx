import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEthereumWallet } from '../hooks/useEthereumWallet'
import { fetchAgents } from '../lib/sessionApi'

function formatCreator(creator) {
  if (!creator) {
    return 'System'
  }

  if (creator.startsWith('0x') && creator.length > 10) {
    return `${creator.slice(0, 6)}...${creator.slice(-4)}`
  }

  return creator
}

function getChainLabel(chain) {
  if (!chain) {
    return 'multi-chain'
  }

  return String(chain).replace(/_/g, ' ')
}

function getChainBadgeClass(chain) {
  const normalized = String(chain || 'multi-chain').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `badge-chain badge-chain-${normalized}`
}

function getRiskBadgeClass(risk) {
  const normalized = String(risk || 'unrated').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `badge-risk badge-risk-${normalized}`
}

const AppMarketplace = () => {
  const [typeFilter, setTypeFilter] = useState('All')
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [walletActionError, setWalletActionError] = useState('')
  const navigate = useNavigate()
  const { connect, hasProvider, isConnected, isConnecting } = useEthereumWallet()

  useEffect(() => {
    let isMounted = true

    fetchAgents()
      .then((data) => {
        if (!isMounted) {
          return
        }

        setAgents(data)
      })
      .catch((agentError) => {
        if (!isMounted) {
          return
        }

        setError(agentError.message || 'Failed to load agents.')
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const typeOptions = useMemo(() => {
    return ['All', ...new Set(agents.map((agent) => agent.type).filter(Boolean))]
  }, [agents])

  const filtered = useMemo(() => {
    return agents.filter((agent) => {
      if (typeFilter !== 'All' && agent.type !== typeFilter) {
        return false
      }

      return true
    })
  }, [agents, typeFilter])

  const handleMySessions = async () => {
    setWalletActionError('')

    if (!hasProvider) {
      setWalletActionError('MetaMask is required to load your sessions.')
      return
    }

    try {
      if (!isConnected) {
        await connect()
      }

      navigate('/sessions')
    } catch (connectError) {
      setWalletActionError(connectError.message || 'Wallet connection failed.')
    }
  }

  return (
    <div className="mp-page">
      {/* Hero */}
      <section className="mp-hero">
        <div className="mp-hero-inner">
          <h1 className="mp-title">Agent Marketplace</h1>
          <p className="mp-subtitle">
            Launch real agents from the claws-fun backend with live session provisioning
          </p>
          <div className="mp-stats-row">
            <div className="mp-stat">
              <span className="mp-stat-value">$47.2M</span>
              <span className="mp-stat-label">Total Volume</span>
            </div>
            <div className="mp-stat">
              <span className="mp-stat-value">5,847</span>
              <span className="mp-stat-label">Active Strategies</span>
            </div>
            <div className="mp-stat">
              <span className="mp-stat-value">94.3%</span>
              <span className="mp-stat-label">Avg Win Rate</span>
            </div>
          </div>
          <div className="mp-hero-actions">
            <button className="btn-primary" type="button">
              Create Agent
            </button>
            <button className="btn-secondary" type="button" onClick={handleMySessions} disabled={isConnecting}>
              {isConnecting ? 'Connecting...' : 'My Sessions'}
            </button>
          </div>
          {walletActionError && <div className="deploy-error-banner mp-hero-error">{walletActionError}</div>}
        </div>
      </section>

      {/* Filters */}
      <section className="mp-filters">
        <div className="mp-filters-inner">
          <div className="mp-filter-group">
            <label>Type</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              {typeOptions.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="mp-grid-section">
        {error && <div className="deploy-error-banner">{error}</div>}
        <div className="mp-grid">
          {!isLoading && filtered.length === 0 && (
            <div className="mp-card">
              <div className="mp-card-header">
                <h3>No agents found</h3>
                <span className="mp-card-type">Try a different filter or check the backend response.</span>
              </div>
            </div>
          )}

          {filtered.map((agent) => (
            <div key={agent.id} className="mp-card">
              <div className="mp-card-header">
                <h3>{agent.name}</h3>
                <p className="mp-card-type" title={agent.description || 'No backend description provided for this agent yet.'}>
                  {agent.description || 'No backend description provided for this agent yet.'}
                </p>
              </div>

              <div className="mp-card-section">
                <div className="mp-card-metrics">
                  <div className="mp-card-metric">
                    <span className="mp-card-metric-label">Agent ID</span>
                    <span className="mp-card-metric-value">#{agent.id}</span>
                  </div>
                  <div className="mp-card-metric">
                    <span className="mp-card-metric-label">Type</span>
                    <span className="mp-card-metric-value" title={agent.type || 'Unknown'}>{agent.type || 'Unknown'}</span>
                  </div>
                  <div className="mp-card-metric">
                    <span className="mp-card-metric-label">Status</span>
                    <span className="mp-card-metric-value">{agent.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="mp-card-metric">
                    <span className="mp-card-metric-label">Provisioning</span>
                    <span className="mp-card-metric-value" title={formatCreator(agent.created_by)}>{formatCreator(agent.created_by)}</span>
                  </div>
                </div>
              </div>

              <div className="mp-card-section mp-card-section-footer">
                <div className="mp-card-badges">
                  <span className={`mp-badge ${getChainBadgeClass(agent.chains?.[0])}`}>
                    {getChainLabel(agent.chains?.[0])}
                  </span>
                  <span className={`mp-badge ${getRiskBadgeClass(agent.risk)}`}>
                    {agent.risk || 'unrated'}
                  </span>
                </div>

                <div className="mp-card-tags">
                  {(agent.chains || []).slice(1, 3).map((chain) => (
                    <span key={chain} className="mp-tag" title={getChainLabel(chain)}>{getChainLabel(chain)}</span>
                  ))}
                  {agent.skill_source_type && <span className="mp-tag" title={agent.skill_source_type}>{agent.skill_source_type}</span>}
                </div>
              </div>

              <div className="mp-card-actions">
                <button className="btn-primary mp-btn" onClick={() => navigate(`/deploy?agent=${agent.id}`)}>Deploy</button>
                <button className="btn-secondary mp-btn" onClick={() => navigate(`/agents/${encodeURIComponent(agent.id)}/analytics`)}>Details</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mp-cta">
        <div className="mp-cta-inner">
          <h2>Bring Your Own Agent</h2>
          <p>Publish agents into the claws-fun backend and they can appear here automatically.</p>
          <div className="mp-cta-actions">
            <button className="btn-primary">Create Agent</button>
            <Link to="/api" className="btn-secondary">Documentation</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AppMarketplace
