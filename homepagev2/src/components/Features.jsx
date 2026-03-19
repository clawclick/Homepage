import React from 'react'
import { Link } from 'react-router-dom'
import { useReveal } from '../hooks/useReveal'

const features = [
  {
    icon: 'universal-api',
    title: 'Universal API',
    slug: 'universal-api',
    desc: 'Single endpoint to access 45+ data sources, DEXs, and analytics platforms across every major chain.',
    gradient: 'linear-gradient(135deg, #e44b2e 0%, #cf3f27 100%)',
  },
  {
    icon: 'agent-first-design',
    title: 'Agent-First Design',
    slug: 'agent-first-design',
    desc: 'Purpose-built for autonomous agents. Structured responses, predictable schemas, and sub-50ms latency.',
    gradient: 'linear-gradient(135deg, #cf3f27 0%, #a92e1f 100%)',
  },
  {
    icon: 'multi-chain-routing',
    title: 'Multi-Chain Routing',
    slug: 'multi-chain-routing',
    desc: 'Ethereum, Base, BSC, and Solana — route orders and queries across chains with zero configuration.',
    gradient: 'linear-gradient(135deg, #f56a4a 0%, #e44b2e 100%)',
  },
  {
    icon: 'real-time-market-data',
    title: 'Real-Time Market Data',
    slug: 'real-time-market-data',
    desc: 'Live prices, liquidity pools, whale movements, and social sentiment aggregated in real-time.',
    gradient: 'linear-gradient(135deg, #bb3422 0%, #cf3f27 100%)',
  },
  {
    icon: 'risk-intelligence',
    title: 'Risk Intelligence',
    slug: 'risk-intelligence',
    desc: 'On-chain risk scoring, contract auditing signals, and rug-pull detection baked into every response.',
    gradient: 'linear-gradient(135deg, #7f2218 0%, #bb3422 100%)',
  },
  {
    icon: 'strategy-wrappers',
    title: 'Strategy Wrappers',
    slug: 'strategy-wrappers',
    desc: 'Pre-built trading strategies as API endpoints. Yield hunting, arbitrage, and momentum — deploy in one call.',
    gradient: 'linear-gradient(135deg, #e44b2e 0%, #cf3f27 100%)',
  },
]

const renderFeatureIcon = (icon) => {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': 'true',
  }

  switch (icon) {
    case 'universal-api':
      return (
        <svg {...commonProps}>
          <path d="M5 8.5H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M5 15.5H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M8.5 5L5 8.5L8.5 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.5 12L19 15.5L15.5 19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'agent-first-design':
      return (
        <svg {...commonProps}>
          <rect x="6" y="4.5" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M9 20H15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 2.5V4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="9.5" cy="10.5" r="1" fill="currentColor" />
          <circle cx="14.5" cy="10.5" r="1" fill="currentColor" />
          <path d="M9.5 14C10.2 14.5333 11.0333 14.8 12 14.8C12.9667 14.8 13.8 14.5333 14.5 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'multi-chain-routing':
      return (
        <svg {...commonProps}>
          <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="17" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="17" r="2.2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8.9 8.2L10.8 10.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M15.1 8.2L13.2 10.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M9.8 16H14.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    case 'real-time-market-data':
      return (
        <svg {...commonProps}>
          <path d="M5 18.5H19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M7.5 15V11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 15V7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M16.5 15V9.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M6.5 9.5L10.2 6.8L13 9.2L17.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'risk-intelligence':
      return (
        <svg {...commonProps}>
          <path d="M12 3.5L18 6V11.2C18 15.2 15.55 18.8 12 20.5C8.45 18.8 6 15.2 6 11.2V6L12 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M9.5 12L11.2 13.7L14.8 10.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'strategy-wrappers':
      return (
        <svg {...commonProps}>
          <rect x="4.5" y="6" width="15" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 10L10.5 12L8 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 10L13.5 12L16 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 4V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M12 18V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

const Features = () => {
  const [ref, visible] = useReveal(0.1)

  return (
    <section className="features" ref={ref}>
      <div className="section-header">
        <span className="section-label">Infrastructure</span>
        <h2 className="section-title">
          Everything your agent needs,<br />one request away
        </h2>
        <p className="section-desc">
          Stop stitching together APIs. Claw.Click aggregates data, execution, and 
          intelligence into a single, agent-optimized interface.
        </p>
      </div>

      <div className={`features-grid ${visible ? 'revealed' : ''}`} id="features">
        {features.map((f, i) => (
          <Link
            key={i}
            to={`/features/${f.slug}`}
            className="feature-card"
            style={{ '--feature-gradient': f.gradient, transitionDelay: `${i * 80}ms` }}
          >
            <div className="feature-card-top">
              <div className="feature-icon-wrap">
                <div className="feature-icon-glow" />
                <div className="feature-icon">{renderFeatureIcon(f.icon)}</div>
              </div>
              <span className="feature-index">0{i + 1}</span>
            </div>
            <div className="feature-copy">
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
            <div className="feature-card-bottom">
              <span className="feature-tag">Explore capability</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default Features
