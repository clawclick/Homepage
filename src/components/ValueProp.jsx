import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedCube from './AnimatedCube'
import { fetchAgents, superApiWsUrl } from '../lib/sessionApi'

const SUPER_API_ADMIN_KEY = 'ADMIN_API_KEY'

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

function getLatencyClass(latency) {
  if (latency <= 50) {
    return 'excellent'
  }
  if (latency <= 100) {
    return 'good'
  }
  if (latency <= 150) {
    return 'elevated'
  }
  if (latency <= 300) {
    return 'warning'
  }
  return 'critical'
}

function normalizeAgentStatsRows(payload) {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  // Incremental updates after subscription.
  if (payload.type === 'agentStats') {
    return Array.isArray(payload.data) ? payload.data : [payload.data]
  }

  // Initial subscription response can carry snapshots in different shapes.
  if (payload.type === 'subscribed') {
    const snapshots = Array.isArray(payload.data?.snapshots)
      ? payload.data.snapshots
      : Array.isArray(payload.snapshots)
        ? payload.snapshots
        : []

    return snapshots.map((snapshot) => {
      const stats = snapshot?.stats && typeof snapshot.stats === 'object'
        ? snapshot.stats
        : snapshot

      return {
        ...stats,
        agentId: snapshot?.agentId ?? stats?.agentId,
      }
    })
  }

  return []
}

const ValueProp = () => {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [liveTelemetry, setLiveTelemetry] = useState({})
  const [loopDistance, setLoopDistance] = useState(0)
  const trackRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    fetchAgents()
      .then((data) => {
        if (isMounted) {
          setAgents(data.slice(0, 10))
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const getAgentSeed = (agent, index = 0) => {
    const raw = String(agent?.id || agent?.name || index)
    return raw.split('').reduce((total, character, characterIndex) => total + character.charCodeAt(0) * (characterIndex + 1), 0)
  }

  const getDefaultTelemetry = (agent, index = 0) => {
    const seed = getAgentSeed(agent, index)

    return {
      throughput: 700 + (seed % 401),
      latency: 70 + (seed % 21),
    }
  }

  useEffect(() => {
    if (agents.length === 0) {
      return undefined
    }

    let isMounted = true
    let socket = null

    const displayedAgentIds = agents.slice(0, 10).map((agent) => String(agent.id))
    const trackedAgentIdMap = new Map(displayedAgentIds.map((agentId) => [agentId.toLowerCase(), agentId]))
    const trackedAgentIds = new Set([...trackedAgentIdMap.keys()])

    const connect = () => {
      const streamUrl = new URL(superApiWsUrl('/ws/agentStats'))
      if (SUPER_API_ADMIN_KEY) {
        streamUrl.searchParams.set('adminKey', SUPER_API_ADMIN_KEY)
      }

      console.log('[agentStats] connecting', {
        url: streamUrl.toString(),
        agentIds: displayedAgentIds,
      })

      socket = new WebSocket(streamUrl.toString())

      socket.onopen = () => {
        if (!isMounted) {
          return
        }

        try {
          const subscriptionPayload = { agentIds: displayedAgentIds }
          console.log('[agentStats] subscribing', subscriptionPayload)
          socket.send(JSON.stringify(subscriptionPayload))
        } catch {}
      }

      socket.onmessage = (event) => {
        if (!isMounted) {
          return
        }

        try {
          console.log('[agentStats] raw response', event.data)
          const payload = JSON.parse(event.data)
          console.log('[agentStats] parsed response', payload)
          const rows = normalizeAgentStatsRows(payload)

          if (rows.length === 0) {
            console.log('[agentStats] ignoring non-agentStats payload', payload)
            return
          }

          setLiveTelemetry((current) => {
            const next = { ...current }

            rows.forEach((row) => {
              if (!row?.agentId) {
                return
              }

              const incomingAgentId = String(row.agentId).toLowerCase()
              if (!trackedAgentIds.has(incomingAgentId)) {
                return
              }

              const agentId = trackedAgentIdMap.get(incomingAgentId) || String(row.agentId)
              next[agentId] = {
                window: row.window || 'rolling_60m',
                requestsLastHour: Number(row.requestsLastHour ?? 0),
                currentMinuteRequests: Number(row.currentMinuteRequests ?? 0),
                latencyMs: Math.round(Number(row.avgResponseMsLastHour ?? 0)),
                updatedAt: row.updatedAt || new Date().toISOString(),
              }
            })

            return next
          })
        } catch {}
      }

      socket.onclose = () => {
        if (!isMounted) {
          return
        }

        console.log('[agentStats] socket closed, scheduling reconnect')
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000)
      }

      socket.onerror = (error) => {
        console.error('[agentStats] socket error', error)
        socket?.close()
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [agents])

  const getSparklinePoints = (agent, index) => {
    const seed = getAgentSeed(agent, index) * 0.0073 + index * 0.37
    const points = []

    for (let step = 0; step < 16; step += 1) {
      const x = step * 8
      const wave = Math.sin(seed + step * 0.72) * 9
      const pulse = Math.cos(seed * 0.55 + step * 0.41) * 5
      const y = Math.max(4, Math.min(34, 20 - wave - pulse))
      points.push(`${x},${y.toFixed(2)}`)
    }

    return points.join(' ')
  }

  const strategyRail = agents.length > 0 ? [...agents, ...agents] : []

  useEffect(() => {
    const trackEl = trackRef.current
    if (!trackEl) return undefined

    const updateLoopDistance = () => {
      const cards = trackEl.querySelectorAll('.strategy-preview-card')
      const half = Math.floor(cards.length / 2)
      if (cards.length < 2 || half === 0 || !cards[half]) return

      const firstStart = cards[0].offsetLeft
      const secondStart = cards[half].offsetLeft
      const measured = secondStart - firstStart
      if (measured > 0) {
        setLoopDistance(measured)
      }
    }

    updateLoopDistance()

    const raf = requestAnimationFrame(updateLoopDistance)
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateLoopDistance)
      : null

    if (resizeObserver) {
      resizeObserver.observe(trackEl)
    } else {
      window.addEventListener('resize', updateLoopDistance)
    }

    return () => {
      cancelAnimationFrame(raf)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener('resize', updateLoopDistance)
      }
    }
  }, [strategyRail.length])

  return (
    <section className="valueprop">
      <div className="valueprop-inner">
        <div className="valueprop-description">
          <div className="section-header">
            <span className="section-label">What We Do</span>
            <h2 className="section-title">One API. Every data source.</h2>
          </div>
          <p className="valueprop-text">
            Our solution is a unified Trading API that aggregates over 100+ trading, analytics, social and risk data sources into a single programmable interface. Instead of managing multiple integrations, Developers and Agents interact with one standardized endpoint, removing friction of juggling API's, hitting rate limits and keeping on top of manual avenues.
          </p>
        </div>

        <div className="strategy-preview-carousel">
          <div
            className="strategy-preview-track"
            ref={trackRef}
            style={loopDistance > 0 ? { '--sp-loop-distance': `${loopDistance}px` } : undefined}
          >
            {strategyRail.map((agent, index) => {
              const live = liveTelemetry[String(agent.id)]
              const defaults = getDefaultTelemetry(agent, index)
              const liveThroughput = Number(live?.requestsLastHour ?? 0)
              const liveLatency = Number(live?.latencyMs ?? 0)
              const hasLiveThroughput = liveThroughput > 0
              const hasLiveLatency = liveLatency > 0
              const telemetry = {
                throughput: hasLiveThroughput ? liveThroughput : defaults.throughput,
                latency: hasLiveLatency ? liveLatency : defaults.latency,
              }
              const sparklinePoints = getSparklinePoints(agent, index)
              const latencyClass = getLatencyClass(telemetry.latency)
              const volumeValue = 120000 + ((Number(agent.id) || 1) * 17300) + (index * 2900)
              const normalizedAgentName = String(agent.name || '').trim().toLowerCase()
              const winRatePresets = [58.2, 63.7, 55.9, 61.1, 66.3, 59.8]
              let winRateDisplay = `${winRatePresets[index % winRatePresets.length].toFixed(1)}%`
              const isCustomAgent = normalizedAgentName.includes('custom')
              let isInfiniteWinRate = false

              if (normalizedAgentName.includes('candle surfer') || normalizedAgentName.includes('candel surfer')) {
                winRateDisplay = '61.4%'
              } else if (isCustomAgent) {
                winRateDisplay = '∞'
                isInfiniteWinRate = true
              }

              return (
            <div key={`${agent.id}-${index}`} className="strategy-preview-card">
              <div className="spc-header">
                <h3 className="spc-name">{agent.name}</h3>
                <p className="spc-type" title={agent.description || 'No backend description provided for this agent yet.'}>
                  {agent.description || 'No backend description provided for this agent yet.'}
                </p>
              </div>

              <div className="spc-live-strip" aria-label="Live telemetry">
                <div className="spc-throughput">
                  <span className="spc-live-dot" />
                  <span className="spc-live-label">req/h</span>
                  <strong>{telemetry.throughput.toLocaleString()}</strong>
                </div>
                <span className={`spc-latency spc-latency-${latencyClass}`}>
                  {telemetry.latency}ms
                </span>
              </div>

              <div className="spc-sparkline-wrap" aria-hidden="true">
                <svg className="spc-sparkline" viewBox="0 0 120 38" preserveAspectRatio="none">
                  <polyline className="spc-sparkline-line" points={sparklinePoints} />
                </svg>
              </div>

              <div className="spc-card-section">
                <div className="spc-metrics">
                  <div className="spc-metric">
                    <span className="spc-metric-label">Agent ID</span>
                    <span className="spc-metric-value">#{agent.id}</span>
                  </div>
                  <div className="spc-metric spc-metric-centered">
                    <span className="spc-metric-label">Type</span>
                    <span className="spc-metric-value spc-blue" title={agent.type || 'Unknown'}>{agent.type || 'Unknown'}</span>
                  </div>
                  <div className="spc-metric">
                    <span className="spc-metric-label">Volume</span>
                    <span className="spc-metric-value">${volumeValue.toLocaleString()}</span>
                  </div>
                  <div className="spc-metric spc-metric-centered">
                    <span className="spc-metric-label">Win rate</span>
                    <span className={`spc-metric-value spc-blue${isInfiniteWinRate ? ' spc-metric-value-infinity' : ''}`}>{winRateDisplay}</span>
                  </div>
                </div>
              </div>

              <div className="spc-card-section spc-card-section-footer">
                <div className="spc-badges">
                  <span className={`spc-badge ${getChainBadgeClass(agent.chains?.[0])}`}>
                    {getChainLabel(agent.chains?.[0])}
                  </span>
                  <span className={`spc-badge ${getRiskBadgeClass(agent.risk)}`}>
                    {agent.risk || 'unrated'}
                  </span>
                </div>
              </div>

              <div className="spc-actions">
                <button className="btn-primary spc-btn" onClick={() => navigate(`/deploy?agent=${agent.id}`)}>Deploy</button>
                <button className="btn-secondary spc-btn" onClick={() => navigate(`/agents/${encodeURIComponent(agent.id)}/analytics`)}>Details</button>
              </div>
            </div>
              )
            })}
          </div>
        </div>

        <div className="strategy-wrappers-block">
          <div className="section-header">
            <span className="section-label">Strategy Wrappers</span>
            <h2 className="section-title">Package. Share. Earn.</h2>
          </div>
          <AnimatedCube />
          <p className="valueprop-text">
            Strategies can be packaged as parameterized API endpoints, allowing bots or applications to call trading logic directly while the underlying strategy remains private, allowing for a novel architecture for copy trading capital and allowing strategy creators to earn revenue while not risking capital — all verified by the Click Oracle for data validation in real time.
          </p>
          <button className="btn-primary">Create Wrapper</button>
        </div>
      </div>
    </section>
  )
}

export default ValueProp
