import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
            {strategyRail.map((agent, index) => (
            <div key={`${agent.id}-${index}`} className="strategy-preview-card">
              <div className="spc-header">
                <h3 className="spc-name">{agent.name}</h3>
                <p className="spc-type" title={agent.description || 'No backend description provided for this agent yet.'}>
                  {agent.description || 'No backend description provided for this agent yet.'}
                </p>
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
                    <span className="spc-metric-label">Status</span>
                    <span className="spc-metric-value">{agent.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="spc-metric">
                    <span className="spc-metric-label">Creator</span>
                    <span className="spc-metric-value" title={formatCreator(agent.created_by)}>{formatCreator(agent.created_by)}</span>
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

                <div className="spc-tags">
                  {(agent.chains || []).slice(1, 3).map((chain) => (
                    <span key={chain} className="spc-tag" title={getChainLabel(chain)}>{getChainLabel(chain)}</span>
                  ))}
                  {agent.skill_source_type && <span className="spc-tag" title={agent.skill_source_type}>{agent.skill_source_type}</span>}
                </div>
              </div>

              <div className="spc-actions">
                <button className="btn-primary spc-btn" onClick={() => navigate(`/deploy?agent=${agent.id}`)}>Deploy</button>
                <button className="btn-secondary spc-btn" onClick={() => navigate(`/deploy?agent=${agent.id}`)}>Details</button>
              </div>
            </div>
            ))}
          </div>
        </div>

        <div className="strategy-wrappers-block">
          <div className="section-header">
            <span className="section-label">Strategy Wrappers</span>
            <h2 className="section-title">Package. Share. Earn.</h2>
          </div>
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
