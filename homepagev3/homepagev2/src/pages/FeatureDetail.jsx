import React, { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'

const featureData = {
  'universal-api': {
    icon: '⚡',
    title: 'Universal API',
    tagline: 'One endpoint. Every data source. Zero friction.',
    gradient: 'linear-gradient(135deg, #e44b2e 0%, #cf3f27 100%)',
    overview: `Claw.Click's Universal API collapses the entire fragmented DeFi data landscape into a single, programmable interface. Instead of juggling dozens of API keys, rate limits, and incompatible response formats, you hit one endpoint and get clean, normalized data from 45+ providers instantly.`,
    highlights: [
      { label: '45+', desc: 'Integrated data providers' },
      { label: '<50ms', desc: 'Average response time' },
      { label: '99.9%', desc: 'Uptime SLA' },
      { label: '4', desc: 'Supported chains' },
    ],
    sections: [
      {
        title: 'Unified Data Normalization',
        text: 'Every response from every provider is normalized into a consistent schema. Whether you\'re pulling price data from DexScreener, liquidity info from DeFiLlama, or on-chain analytics from Moralis — the format is identical. Your agent code stays clean and provider-agnostic.',
        code: `GET /api/tokenPoolInfo?chain=eth&address=0xA0b8...3606eb48\n\n// Returns normalized data regardless of upstream provider\n{\n  "name": "USD Coin",\n  "symbol": "USDC",\n  "priceUsd": 1.0001,\n  "marketCapUsd": 32000000000,\n  "liquidityUsd": 150000000,\n  "volume24hUsd": 5000000000,\n  "providers": ["dexScreener", "birdeye", "moralis"]\n}`,
      },
      {
        title: 'Automatic Provider Failover',
        text: 'If a provider goes down or returns stale data, the API automatically routes to the next available source. Your agents never hit a dead end — the Universal API handles retries, fallbacks, and health checking behind the scenes.',
      },
      {
        title: 'Smart Aggregation',
        text: 'For critical data points like price and volume, the API cross-references multiple providers and returns a confidence-weighted aggregate. This eliminates single-source risk and gives your agents the most accurate picture of the market at any given moment.',
      },
      {
        title: 'Rate Limit Abstraction',
        text: 'Each upstream provider has different rate limits, auth mechanisms, and throttling behavior. The Universal API manages all of this internally — you get a single, generous rate limit and never have to worry about per-provider quotas again.',
      },
    ],
    useCases: [
      'Portfolio tracking bots that need data from multiple DEXs simultaneously',
      'Arbitrage agents scanning price discrepancies across providers',
      'Dashboard applications aggregating real-time market analytics',
      'Research tools pulling historical and live data in one call',
    ],
  },

  'agent-first-design': {
    icon: '🤖',
    title: 'Agent-First Design',
    tagline: 'Built for machines. Optimized for autonomy.',
    gradient: 'linear-gradient(135deg, #cf3f27 0%, #a92e1f 100%)',
    overview: `Every endpoint, schema, and error response in Claw.Click is designed from the ground up for autonomous agents — not human developers clicking through dashboards. Predictable structures, deterministic behavior, and machine-parseable outputs mean your agents can operate without supervision.`,
    highlights: [
      { label: 'JSON', desc: 'Structured schemas everywhere' },
      { label: '<50ms', desc: 'P95 response latency' },
      { label: '0', desc: 'Ambiguous response fields' },
      { label: '100%', desc: 'Deterministic outputs' },
    ],
    sections: [
      {
        title: 'Deterministic Response Schemas',
        text: 'Every endpoint returns a strictly typed JSON response with no optional mystery fields. Agents can parse responses with zero conditional logic — if a field exists in the schema, it\'s always present. This eliminates an entire class of runtime errors for autonomous systems.',
        code: `// Every response follows the same envelope\n{\n  "status": "ok",\n  "endpoint": "tokenPoolInfo",\n  "chain": "eth",\n  "data": { ... },\n  "providers": [\n    { "provider": "dexScreener", "status": "ok" },\n    { "provider": "birdeye", "status": "ok" }\n  ],\n  "timing": { "total_ms": 42 }\n}`,
      },
      {
        title: 'Typed Error Handling',
        text: 'Errors aren\'t string messages — they\'re structured objects with error codes, retry hints, and suggested alternatives. An agent can programmatically decide whether to retry, fallback, or abort based on the error type without parsing natural language.',
      },
      {
        title: 'Sub-50ms Latency',
        text: 'Agent decision loops run on tight cycles. The API is engineered for P95 latency under 50ms for cached data paths and under 200ms for cold aggregation queries. Edge caching, connection pooling, and pre-warmed provider sessions keep things fast.',
      },
      {
        title: 'Batch & Streaming Modes',
        text: 'Need 20 token prices at once? Use batch mode. Need continuous market updates? Connect via WebSocket streaming. Both modes return the same normalized schemas, so your agent code works identically in either context.',
      },
    ],
    useCases: [
      'Autonomous trading agents making sub-second decisions',
      'Multi-agent systems coordinating across data sources',
      'LLM-powered financial assistants parsing live market data',
      'Headless bots operating 24/7 without human intervention',
    ],
  },

  'multi-chain-routing': {
    icon: '🔗',
    title: 'Multi-Chain Routing',
    tagline: 'Every chain. One interface. Zero config.',
    gradient: 'linear-gradient(135deg, #f56a4a 0%, #e44b2e 100%)',
    overview: `Ethereum, Base, BSC, and Solana — the four chains that matter most for DeFi are all accessible through identical API calls. Just change the chain parameter and the entire routing, provider selection, and data normalization adapts automatically.`,
    highlights: [
      { label: '4', desc: 'Chains supported' },
      { label: '32+', desc: 'DEXs integrated' },
      { label: '0', desc: 'Chain-specific code needed' },
      { label: '∞', desc: 'Cross-chain combinations' },
    ],
    sections: [
      {
        title: 'Chain-Agnostic Endpoints',
        text: 'Every endpoint accepts a `chain` parameter. Whether you\'re querying Uniswap V3 on Ethereum or Raydium on Solana, the request format and response schema are identical. Your agent logic doesn\'t need chain-specific branches.',
        code: `// Same endpoint, different chains\nGET /api/tokenPoolInfo?chain=eth&address=0xA0b8...\nGET /api/tokenPoolInfo?chain=sol&address=EPjFWdd5...\nGET /api/tokenPoolInfo?chain=bsc&address=0x55d3...\nGET /api/tokenPoolInfo?chain=base&address=0x833...`,
      },
      {
        title: 'Intelligent DEX Selection',
        text: 'When executing swaps, the router automatically selects the optimal DEX based on liquidity depth, slippage, and gas costs. On Ethereum it might route through Uniswap V3, on BSC through PancakeSwap, and on Solana through Jupiter — all transparently.',
      },
      {
        title: 'Cross-Chain Data Queries',
        text: 'Need to compare the same token\'s price across Ethereum and BSC? Query both in a single batch call. The API handles the fan-out to chain-specific providers and returns a unified response with per-chain breakdowns.',
      },
      {
        title: 'Supported Chains & DEXs',
        text: 'Full support for Ethereum (Uniswap V2/V3, Sushiswap, Curve, Balancer), Base (Aerodrome, BaseSwap), BSC (PancakeSwap V2/V3, Biswap), and Solana (Jupiter, Raydium, Orca). More chains and DEXs are added continuously.',
      },
    ],
    useCases: [
      'Cross-chain arbitrage bots exploiting price differences',
      'Multi-chain portfolio management dashboards',
      'Chain-agnostic trading agents that follow liquidity',
      'DEX aggregators building best-execution routing',
    ],
  },

  'real-time-market-data': {
    icon: '📊',
    title: 'Real-Time Market Data',
    tagline: 'Live prices. On-chain signals. Social sentiment. All in one feed.',
    gradient: 'linear-gradient(135deg, #bb3422 0%, #cf3f27 100%)',
    overview: `Market data from Claw.Click isn't just price tickers — it's a multi-dimensional stream combining on-chain activity, DEX liquidity, whale wallet movements, holder analytics, and social sentiment from X, Reddit, and Telegram. All normalized, all real-time.`,
    highlights: [
      { label: 'Real-time', desc: 'WebSocket streaming' },
      { label: '50+', desc: 'Data dimensions per token' },
      { label: '6', desc: 'Social platforms monitored' },
      { label: '24/7', desc: 'Continuous monitoring' },
    ],
    sections: [
      {
        title: 'Comprehensive Token Analytics',
        text: 'Every token query returns price, market cap, fully diluted valuation, 24h volume, liquidity depth, holder count, buy/sell ratio, and transaction count. Historical data is available for price, volume, and liquidity across configurable time ranges.',
        code: `GET /api/detailedTokenStats?chain=eth&address=0xA0b8...\n\n{\n  "priceUsd": 1.0001,\n  "marketCapUsd": 32000000000,\n  "volume24h": 5000000000,\n  "liquidity": 150000000,\n  "holders": 1847293,\n  "buyCount24h": 12847,\n  "sellCount24h": 9234,\n  "priceChange24h": 0.02,\n  "whaleTransactions": 47\n}`,
      },
      {
        title: 'Whale Wallet Tracking',
        text: 'The API monitors known whale wallets, smart money addresses, and institutional accounts in real-time. Get alerts when large holders accumulate, distribute, or bridge tokens — critical alpha for agents making directional bets.',
      },
      {
        title: 'Social Sentiment Scoring',
        text: 'Natural language processing runs across X (Twitter), Reddit, Telegram, and Discord mentions to generate per-token sentiment scores. Detect hype cycles, FUD events, and coordinated shill campaigns before they impact price.',
      },
      {
        title: 'WebSocket Streaming',
        text: 'Subscribe to real-time price updates, new pair launches, large transactions, and sentiment shifts via persistent WebSocket connections. Zero polling, zero delay — your agents react to market events as they happen.',
      },
    ],
    useCases: [
      'Sentiment-based trading agents buying on positive momentum shifts',
      'Whale-following bots that mirror smart money movements',
      'Market dashboards displaying live multi-source analytics',
      'Alert systems notifying on unusual volume or holder changes',
    ],
  },

  'risk-intelligence': {
    icon: '🛡️',
    title: 'Risk Intelligence',
    tagline: 'Scam detection. Contract audits. Risk scores. Baked in.',
    gradient: 'linear-gradient(135deg, #7f2218 0%, #bb3422 100%)',
    overview: `Every token interaction through Claw.Click is automatically enriched with risk intelligence. Contract audit signals, honeypot detection, rug-pull probability scores, and liquidity lock verification run behind every query — so your agents never blindly ape into a scam.`,
    highlights: [
      { label: '0-100', desc: 'Risk score per token' },
      { label: '12+', desc: 'Risk signals analyzed' },
      { label: '<1s', desc: 'Audit scan time' },
      { label: '97.3%', desc: 'Scam detection accuracy' },
    ],
    sections: [
      {
        title: 'Instant Contract Auditing',
        text: 'The `/isScam` endpoint runs a battery of checks against any token contract: ownership renounced, hidden mint functions, transfer tax traps, proxy patterns, blacklist functions, and more. Results come back in under a second with a detailed breakdown.',
        code: `GET /api/isScam?chain=eth&address=0xSUSPICIOUS...\n\n{\n  "riskScore": 87,\n  "verdict": "HIGH_RISK",\n  "flags": [\n    "ownership_not_renounced",\n    "hidden_mint_function",\n    "high_transfer_tax",\n    "low_liquidity_lock"\n  ],\n  "contractAge": "2 hours",\n  "holderConcentration": "top10_hold_94%"\n}`,
      },
      {
        title: 'Full Deep Audit',
        text: 'For thorough analysis, the `/fullAudit` endpoint performs a comprehensive multi-source audit combining on-chain analysis, social signals, deployer history, and liquidity patterns. Get a complete risk profile with actionable intelligence.',
      },
      {
        title: 'Honeypot Detection',
        text: 'The system simulates buy and sell transactions to detect honeypot contracts — tokens you can buy but can\'t sell. This catches sophisticated traps that static analysis alone would miss, protecting agents from irreversible losses.',
      },
      {
        title: 'Continuous Risk Monitoring',
        text: 'Risk scores aren\'t static. The API continuously monitors contract state changes, ownership transfers, liquidity removals, and holder distribution shifts. An agent can subscribe to risk alerts for any token in its portfolio.',
      },
    ],
    useCases: [
      'Pre-trade risk gates that reject high-risk tokens automatically',
      'New token scanners filtering launches by safety score',
      'Portfolio monitoring bots watching for rug-pull signals',
      'Due-diligence tools for fund managers evaluating tokens',
    ],
  },

  'strategy-wrappers': {
    icon: '🔄',
    title: 'Strategy Wrappers',
    tagline: 'Package your alpha. Share the edge. Earn passively.',
    gradient: 'linear-gradient(135deg, #e44b2e 0%, #cf3f27 100%)',
    overview: `Strategy Wrappers let anyone package trading logic as a parameterized API endpoint. Your strategy stays private — callers interact through a clean interface without seeing the implementation. Deploy once, earn revenue every time someone calls your wrapper.`,
    highlights: [
      { label: 'Private', desc: 'Strategy logic stays hidden' },
      { label: 'Revenue', desc: 'Earn per-call fees' },
      { label: 'Verified', desc: 'Click Oracle validation' },
      { label: '1-Click', desc: 'Deploy & go live' },
    ],
    sections: [
      {
        title: 'How Wrappers Work',
        text: 'A Strategy Wrapper is a serverless function that accepts parameters (token, chain, amount, risk level) and executes your proprietary trading logic using Claw.Click\'s Universal API under the hood. The wrapper is exposed as an API endpoint that other agents or applications can call — paying you a fee per execution.',
        code: `// Creating a wrapper\nPOST /api/wrappers/create\n{\n  "name": "DeFi Yield Hunter",\n  "description": "Automated yield farming across top pools",\n  "parameters": [\n    { "name": "chain", "type": "string", "required": true },\n    { "name": "amount", "type": "number", "required": true },\n    { "name": "risk_level", "type": "string", "default": "medium" }\n  ],\n  "fee_per_call": 0.001\n}`,
      },
      {
        title: 'Click Oracle Verification',
        text: 'Every wrapper execution is verified by the Click Oracle — a real-time data validation layer that ensures strategy outputs match expected parameters, prevents manipulation, and provides transparency to callers without exposing your strategy logic.',
      },
      {
        title: 'Revenue Model',
        text: 'Set your own per-call fee. Every time an agent or application calls your wrapper, you earn. High-performing strategies with good track records attract more callers organically through the marketplace. No capital risk — your strategy executes with the caller\'s funds.',
      },
      {
        title: 'Strategy Marketplace',
        text: 'Published wrappers appear in the Claw.Click Strategy Marketplace where users can browse by performance metrics, risk level, chain support, and strategy type. Top strategies get featured placement and drive significant call volume.',
      },
    ],
    useCases: [
      'Quantitative traders monetizing strategies without capital risk',
      'Copy-trading platforms offering curated strategy portfolios',
      'Agent developers packaging bots as callable services',
      'Fund managers offering strategy-as-a-service to clients',
    ],
  },
}

const FeatureDetail = () => {
  const { slug } = useParams()
  const feature = featureData[slug]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!feature) return <Navigate to="/" replace />

  return (
    <div className="fd-page">
      {/* Hero */}
      <section className="fd-hero">
        <div className="fd-hero-orb" style={{ background: feature.gradient }} aria-hidden="true" />
        <div className="fd-hero-inner">
          <Link to="/#features" className="fd-back">← Back to Features</Link>
          <div className="fd-hero-icon" style={{ background: feature.gradient }}>
            <span>{feature.icon}</span>
          </div>
          <h1 className="fd-hero-title">{feature.title}</h1>
          <p className="fd-hero-tagline">{feature.tagline}</p>
        </div>
      </section>

      {/* Highlights */}
      <section className="fd-highlights">
        <div className="fd-highlights-grid">
          {feature.highlights.map((h, i) => (
            <div key={i} className="fd-highlight">
              <span className="fd-highlight-val">{h.label}</span>
              <span className="fd-highlight-desc">{h.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Overview */}
      <section className="fd-overview">
        <div className="fd-overview-inner">
          <h2 className="fd-section-title">Overview</h2>
          <p className="fd-body-text">{feature.overview}</p>
        </div>
      </section>

      {/* Detail sections */}
      <section className="fd-details">
        {feature.sections.map((s, i) => (
          <div key={i} className="fd-detail-block">
            <div className="fd-detail-content">
              <div className="fd-detail-num">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="fd-detail-title">{s.title}</h3>
              <p className="fd-body-text">{s.text}</p>
            </div>
            {s.code && (
              <div className="fd-detail-code">
                <pre><code>{s.code}</code></pre>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Use Cases */}
      <section className="fd-usecases">
        <div className="fd-usecases-inner">
          <h2 className="fd-section-title">Use Cases</h2>
          <div className="fd-usecases-grid">
            {feature.useCases.map((uc, i) => (
              <div key={i} className="fd-usecase-card">
                <div className="fd-usecase-num" style={{ background: feature.gradient }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <p>{uc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fd-cta">
        <h2>Ready to integrate <span className="text-gradient">{feature.title}</span>?</h2>
        <p>Get started with the API documentation or explore the marketplace.</p>
        <div className="fd-cta-actions">
          <Link to="/api" className="btn-primary btn-glow">View API Docs →</Link>
          <Link to="/app" className="btn-secondary">Marketplace</Link>
        </div>
      </section>
    </div>
  )
}

export default FeatureDetail
