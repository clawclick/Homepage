import React, { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { fetchAgents, superApiPublicUrl } from '../lib/sessionApi'

function extractSkillContent(data) {
  if (typeof data === 'string') {
    return data
  }

  const candidates = [
    data?.content,
    data?.markdown,
    data?.text,
    data?.skill,
    data?.body,
    data?.data?.content,
    data?.data?.markdown,
    data?.data?.text,
    data?.data?.skill,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
    }
  }

  return JSON.stringify(data, null, 2)
}

function formatSkillType(value) {
  if (!value) {
    return 'Route Skill'
  }

  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const AgentSkillView = () => {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [agent, setAgent] = useState(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    let isMounted = true

    setLoading(true)
    setError('')

    fetchAgents()
      .then(async (agents) => {
        const nextAgent = Array.isArray(agents)
          ? agents.find((item) => String(item.id) === String(id)) || null
          : null

        if (!nextAgent) {
          throw new Error('Agent not found.')
        }

        if (!nextAgent.skill?.route) {
          throw new Error('This agent does not expose a route-based skill.')
        }

        const requestUrl = superApiPublicUrl(nextAgent.skill.route)
        const response = await fetch(requestUrl)

        if (!response.ok) {
          throw new Error(`Failed to load skill: ${response.status}`)
        }

        const contentType = response.headers.get('content-type') || ''
        let nextContent = ''

        if (contentType.includes('application/json')) {
          nextContent = extractSkillContent(await response.json())
        } else {
          nextContent = await response.text()
        }

        if (isMounted) {
          setAgent(nextAgent)
          setContent(nextContent)
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError.message || 'Failed to load skill.')
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

  const sourceUrl = useMemo(() => {
    return agent?.skill?.route ? superApiPublicUrl(agent.skill.route) : ''
  }, [agent])

  return (
    <div className="agent-skill-page st-page">
      <section className="agent-skill-hero">
        <div className="agent-skill-container">
          <div className="agent-skill-hero-copy">
            <p className="agent-skill-kicker">Agent Skill</p>
            <h1 className="agent-skill-title">
              <span className="text-gradient">{agent?.name || id}</span>
            </h1>
            <p className="agent-skill-subtitle">
              {agent?.description || 'Skill instructions, routing details, and rendered markdown presented with the same visual language as the homepage.'}
            </p>

            <div className="agent-skill-badges">
              <span className="agent-skill-badge">{formatSkillType(agent?.skill?.type)}</span>
              {agent?.type && <span className="agent-skill-badge agent-skill-badge-muted">{agent.type}</span>}
              {agent?.risk && <span className="agent-skill-badge agent-skill-badge-muted">Risk: {agent.risk}</span>}
            </div>

            <div className="agent-skill-actions">
              <Link className="btn-secondary" to={`/agents/${encodeURIComponent(id || '')}/analytics`}>Back to Analytics</Link>
              {sourceUrl && (
                <a className="btn-primary btn-glow" href={sourceUrl} target="_blank" rel="noopener noreferrer">Open Source</a>
              )}
            </div>
          </div>

          <aside className="agent-skill-spotlight">
            <div className="agent-skill-spotlight-card">
              <span>Source Route</span>
              <strong>{agent?.skill?.route || 'Unavailable'}</strong>
              <p>Live content is fetched directly from the public skill endpoint.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="agent-skill-content-section">
        <div className="agent-skill-container">
          {loading && <div className="agent-skill-message">Loading skill...</div>}
          {!loading && error && <div className="deploy-error-banner">{error}</div>}
          {!loading && !error && (
            <article className="agent-skill-shell">
              <div className="agent-skill-shell-header">
                <div>
                  <p className="agent-skill-shell-label">Rendered Skill</p>
                  <h2 className="agent-skill-shell-title">{agent?.name || id}</h2>
                </div>
                {sourceUrl && (
                  <code className="agent-skill-shell-code">{sourceUrl}</code>
                )}
              </div>

              <div className="agent-skill-body st-markdown">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </article>
          )}
        </div>
      </section>
    </div>
  )
}

export default AgentSkillView
