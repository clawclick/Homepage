import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedCube from './AnimatedCube'
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

const ValueProp = () => {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [telemetryTick, setTelemetryTick] = useState(0)

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetryTick((prev) => prev + 1)
    }, 1200)
    return () => clearInterval(timer)
  }, [])

  const getTelemetry = (agent, index) => {
    const base = (Number(agent.id) || 1) * 17 + index * 11
    const throughput = 780 + (base % 220) + ((telemetryTick * 23 + base) % 95)
    const latency = 24 + ((base + telemetryTick * 7) % 30)
    return { throughput, latency }
  }

  const getSparklinePoints = (agent, index) => {
    const seed = (Number(agent.id) || 1) * 0.73 + index * 0.37 + telemetryTick * 0.32
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
          <div className="strategy-preview-track">
            {strategyRail.map((agent, index) => {
              const telemetry = getTelemetry(agent, index)
              const sparklinePoints = getSparklinePoints(agent, index)
              const latencyClass = telemetry.latency <= 34 ? 'fast' : telemetry.latency <= 45 ? 'normal' : 'slow'
              const volumeValue = 120000 + ((Number(agent.id) || 1) * 17300) + (index * 2900)
              const pnlPresets = [128.4, 347.2, 189.6, -12.8, 265.3, 142.1]
              const pnlValue = pnlPresets[index % pnlPresets.length]
              const pnlDisplay = `${pnlValue >= 0 ? '+' : ''}${pnlValue.toFixed(1)}%`

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
                  <span className="spc-live-label">req/s</span>
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
                  <div className="spc-metric">
                    <span className="spc-metric-label">Type</span>
                    <span className="spc-metric-value spc-blue" title={agent.type || 'Unknown'}>{agent.type || 'Unknown'}</span>
                  </div>
                  <div className="spc-metric">
                    <span className="spc-metric-label">Volume</span>
                    <span className="spc-metric-value">${volumeValue.toLocaleString()}</span>
                  </div>
                  <div className="spc-metric">
                    <span className="spc-metric-label">PnL</span>
                    <span className={`spc-metric-value ${pnlValue >= 0 ? 'spc-blue' : ''}`}>{pnlDisplay}</span>
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
                <button className="btn-secondary spc-btn" onClick={() => navigate(`/deploy?agent=${agent.id}`)}>Details</button>
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
