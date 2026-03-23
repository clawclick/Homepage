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
    <div className="agent-analytics-page">
      <section className="agent-analytics-hero">
        <div className="agent-analytics-inner">
          <p className="agent-analytics-kicker">Agent Skill</p>
          <h1 className="agent-analytics-title">{agent?.name || id}</h1>
          <p className="agent-analytics-subtitle">
            Live skill content loaded from the agent route.
          </p>
          <div className="agent-analytics-actions">
            <Link className="btn-secondary" to={`/agents/${encodeURIComponent(id || '')}/analytics`}>Back to Analytics</Link>
            {sourceUrl && (
              <a className="btn-primary" href={sourceUrl} target="_blank" rel="noopener noreferrer">Open Source</a>
            )}
          </div>
        </div>
      </section>

      <section className="agent-analytics-section">
        <div className="agent-analytics-inner">
          {loading && <div className="agent-analytics-message">Loading skill...</div>}
          {!loading && error && <div className="deploy-error-banner">{error}</div>}
          {!loading && !error && (
            <article className="agent-panel agent-skill-panel">
              <div className="agent-skill-meta">
                <span>Skill Type</span>
                <strong>{agent?.skill?.type || 'route'}</strong>
                {sourceUrl && <code>{sourceUrl}</code>}
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
