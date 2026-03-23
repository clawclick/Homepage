import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEthereumWallet } from '../hooks/useEthereumWallet'
import { fetchUserSessions } from '../lib/sessionApi'

function formatTimeRemaining(seconds) {
  if (!seconds || seconds <= 0) {
    return 'Expired'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  return `${hours}h ${minutes}m`
}

function formatStatus(status) {
  const normalized = String(status || '').toLowerCase()

  if (!normalized) {
    return 'Unknown'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function getStatusPriority(session) {
  const status = String(session.status || '').toLowerCase()

  if (session.isActive || status === 'running') {
    return 0
  }

  if (status === 'starting' || status === 'bootstrapping' || status === 'provisioning' || status === 'retrying') {
    return 1
  }

  if (status === 'pending') {
    return 2
  }

  if (status === 'terminated' || status === 'expired') {
    return 4
  }

  if (status === 'failed' || status === 'error') {
    return 5
  }

  return 3
}

function getStatusBadgeClass(status) {
  const normalized = String(status || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `my-session-status my-session-status-${normalized}`
}

function getAgentName(session) {
  return session.agent?.name || session.agentName || session.agent_id || `Session #${session.id}`
}

const MySessions = () => {
  const navigate = useNavigate()
  const { account, connect, hasProvider, isConnected, isConnecting } = useEthereumWallet()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasProvider) {
      setLoading(false)
      return
    }

    if (!account) {
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    setError('')

    fetchUserSessions(account)
      .then((data) => {
        if (isMounted) {
          setSessions(data)
        }
      })
      .catch((sessionError) => {
        if (isMounted) {
          setError(sessionError.message || 'Failed to load your sessions.')
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
  }, [account, hasProvider])

  const activeSessions = useMemo(() => {
    return sessions.filter((session) => {
      const status = String(session.status || '').toLowerCase()
      return session.isActive || ['running', 'starting', 'bootstrapping', 'provisioning', 'retrying'].includes(status)
    })
  }, [sessions])

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((left, right) => {
      const priorityDifference = getStatusPriority(left) - getStatusPriority(right)

      if (priorityDifference !== 0) {
        return priorityDifference
      }

      const leftUpdated = Number(left.updatedAt || left.updated_at || left.createdAt || left.created_at || 0)
      const rightUpdated = Number(right.updatedAt || right.updated_at || right.createdAt || right.created_at || 0)

      return rightUpdated - leftUpdated
    })
  }, [sessions])

  const handleConnect = async () => {
    setError('')

    try {
      await connect()
    } catch (connectError) {
      setError(connectError.message || 'Wallet connection failed.')
    }
  }

  if (!hasProvider) {
    return (
      <div className="my-sessions-page my-sessions-empty-shell">
        <div className="terminal-empty-card">
          <h1>MetaMask required</h1>
          <p>Connect with the wallet that launched your sessions so the app can query /api/sessions with your address.</p>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="my-sessions-page my-sessions-empty-shell">
        <div className="terminal-empty-card">
          <h1>Connect your wallet</h1>
          <p>We only load sessions for the connected address, using your wallet as both the query param and the request header.</p>
          {error && <div className="deploy-error-banner">{error}</div>}
          <button className="deploy-wallet-button" type="button" onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="my-sessions-page">
      <section className="my-sessions-hero">
        <div className="my-sessions-hero-inner">
          <div>
            <Link to="/app" className="deploy-link-back">Back to app</Link>
            <h1>My Sessions</h1>
            <p>Active and recent sessions for {`${account.slice(0, 6)}...${account.slice(-4)}`}</p>
          </div>
          <div className="my-sessions-hero-meta">
            <div>
              <span>Total Sessions</span>
              <strong>{loading ? '...' : sessions.length}</strong>
            </div>
            <div>
              <span>Active</span>
              <strong>{loading ? '...' : activeSessions.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="my-sessions-grid-section">
        {error && <div className="deploy-error-banner">{error}</div>}
        {!loading && sessions.length === 0 && (
          <div className="terminal-empty-card my-sessions-empty-card">
            <h1>No sessions yet</h1>
            <p>This wallet does not have any sessions returned from /api/sessions yet.</p>
            <div className="my-sessions-empty-actions">
              <button className="btn-primary" type="button" onClick={() => navigate('/app')}>Browse agents</button>
              <button className="btn-secondary" type="button" onClick={() => navigate('/deploy')}>Launch a session</button>
            </div>
          </div>
        )}

        {loading && <div className="terminal-loader my-sessions-loader">Loading sessions...</div>}

        {!loading && sessions.length > 0 && (
          <div className="my-sessions-grid">
            {sortedSessions.map((session) => (
              <article key={session.id} className="my-session-card">
                <div className="my-session-card-topline">
                  <span>Session #{session.id}</span>
                  <strong className={getStatusBadgeClass(session.status)}>{formatStatus(session.status)}</strong>
                </div>

                <h2>{getAgentName(session)}</h2>
                <p>{session.agent?.description || 'Resume this session to continue working with the agent runtime.'}</p>

                <div className="my-session-stat-grid">
                  <div>
                    <span>GPU</span>
                    <strong>{session.gpuType || 'Any'} x{session.numGpus || 1}</strong>
                  </div>
                  <div>
                    <span>CPU</span>
                    <strong>{session.cpuCores || 'n/a'}</strong>
                  </div>
                  <div>
                    <span>RAM</span>
                    <strong>{session.memoryGb || 'n/a'} GB</strong>
                  </div>
                  <div>
                    <span>Time left</span>
                    <strong>{formatTimeRemaining(session.timeRemaining)}</strong>
                  </div>
                  <div>
                    <span>Gateway</span>
                    {session.instance?.agentUrl ? (
                      <a
                        href={session.instance.agentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="my-session-gateway-link"
                      >
                        Open Gateway
                      </a>
                    ) : (
                      <strong>Pending</strong>
                    )}
                  </div>
                  <div>
                    <span>Agent</span>
                    <strong>{session.agent?.id ? `#${session.agent.id}` : 'n/a'}</strong>
                  </div>
                </div>

                <div className="my-session-card-actions">
                  <button className="btn-primary" type="button" onClick={() => navigate(`/session/${session.id}`)}>
                    Open session
                  </button>
                  <button className="btn-secondary" type="button" onClick={() => navigate(session.agent?.id ? `/deploy?agent=${session.agent.id}` : '/deploy')}>
                    Launch again
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default MySessions
