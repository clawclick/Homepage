import React, { useState, useEffect } from 'react'

const ApiDocs = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [quickStartResponse, setQuickStartResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'chains', label: 'Supported Chains' },
    { id: 'response-format', label: 'Response Format' },
    { id: 'core-endpoints', label: 'Core Endpoints' },
    { id: 'market-data', label: 'Market Data' },
    { id: 'risk-assessment', label: 'Risk Assessment' },
    { id: 'wallet-analysis', label: 'Wallet Analysis' },
    { id: 'trading-dex', label: 'Trading & DEX' },
    { id: 'social-sentiment', label: 'Social & Sentiment' },
    { id: 'discovery-monitoring', label: 'Discovery & Monitoring' },
    { id: 'websockets', label: 'WebSockets' },
    { id: 'filters', label: 'Filtering Options' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'integrations', label: 'Data Providers' }
  ]

  // Scroll tracking to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = navigationSections.map(section => document.getElementById(section.id))
      let activeId = 'overview'
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= window.scrollY + 100) {
          activeId = section.id
          break
        }
      }
      
      setActiveSection(activeId)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Set initial active section
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80 // Account for fixed header
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  const runQuickStartExample = () => {
    setIsLoading(true)
    // Simulate API call with hardcoded response
    setTimeout(() => {
      setQuickStartResponse({
        endpoint: "tokenPoolInfo",
        status: "live",
        chain: "eth",
        tokenAddress: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        name: "USD Coin",
        symbol: "USDC",
        priceUsd: 1.0001,
        marketCapUsd: 32000000000,
        fdvUsd: 32000000000,
        liquidityUsd: 150000000,
        volume24hUsd: 5000000000,
        priceChange24hPct: -0.01,
        pairAddress: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
        dex: "uniswap_v3",
        providers: [
          { provider: "dexScreener", status: "ok", detail: "Live data" },
          { provider: "birdeye", status: "ok", detail: "Price confirmed" }
        ]
      })
      setIsLoading(false)
    }, 1500)
  }

  const supportedChains = [
    { name: "Ethereum", id: "eth / ethereum", chainId: "1", status: "Full support" },
    { name: "Base", id: "base", chainId: "8453", status: "Full support" },
    { name: "BSC", id: "bsc / bnb", chainId: "56", status: "Full support" },
    { name: "Solana", id: "sol / solana", chainId: "Non-EVM", status: "Full support" }
  ]

  const coreEndpoints = [
    {
      method: "GET",
      path: "/health",
      description: "Health check endpoint",
      parameters: [],
      example: "GET https://api.claw.click/health",
      response: `{
  "status": "ok",
  "service": "super-api"
}`
    },
    {
      method: "GET", 
      path: "/providers",
      description: "List all registered providers and their configuration status",
      parameters: [],
      example: "GET https://api.claw.click/providers",
      response: `{
  "providers": [
    {
      "id": "moralis",
      "label": "Moralis", 
      "folder": "Alpha_Wallet_tracking/Moralis",
      "category": "walletTracking",
      "configured": true
    },
    {
      "id": "birdeye",
      "label": "Birdeye",
      "folder": "Market_data/LowCaps/Birdeye", 
      "category": "marketData",
      "configured": true
    }
  ]
}`
    }
  ]

  const marketDataEndpoints = [
    {
      method: "GET",
      path: "/tokenPoolInfo", 
      description: "Get token price, market cap, liquidity, volume, and pool info. DexScreener is primary; Codex listPairsForToken is used as backup.",
      parameters: [
        { name: "chain", type: "string", required: false, default: "eth", description: "Chain to query" },
        { name: "tokenAddress", type: "string", required: true, default: "—", description: "Token contract address" },
        { name: "poolAddress", type: "string", required: false, default: "—", description: "Specific pool address" },
        { name: "symbol", type: "string", required: false, default: "—", description: "Token symbol hint" },
        { name: "tokenName", type: "string", required: false, default: "—", description: "Token name hint" }
      ],
      example: "GET https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      response: `{
  "endpoint": "tokenPoolInfo",
  "status": "live", 
  "chain": "eth",
  "tokenAddress": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "name": "USD Coin",
  "symbol": "USDC",
  "priceUsd": 1.0001,
  "marketCapUsd": 32000000000,
  "fdvUsd": 32000000000,
  "liquidityUsd": 150000000,
  "volume24hUsd": 5000000000,
  "priceChange24hPct": -0.01,
  "pairAddress": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
  "dex": "uniswap_v3",
  "providers": [
    { "provider": "dexScreener", "status": "ok", "detail": "Live data" },
    { "provider": "birdeye", "status": "ok", "detail": "Price confirmed" }
  ]
}`
    },
    {
      method: "GET",
      path: "/tokenPriceHistory",
      description: "Historical OHLCV price data for charting. Supports both token contracts and major assets. Primary sources are GeckoTerminal/Birdeye, with Codex getTokenBars as fallback.",
      parameters: [
        { name: "chain", type: "string", required: false, default: "eth", description: "Chain" },
        { name: "tokenAddress", type: "string", required: true, default: "—", description: "Token address, or major symbol like btc, eth, sol, xrp, bnb" },
        { name: "asset", type: "string", required: false, default: "—", description: "Optional explicit major asset name/symbol" },
        { name: "limit", type: "string", required: false, default: "3m", description: "Time range: 1d, 7d, 1m, 3m, 1y" },
        { name: "interval", type: "string", required: false, default: "1d", description: "Candle interval: 5m, 15m, 1h, 4h, 1d" }
      ],
      example: "GET https://api.claw.click/tokenPriceHistory?chain=sol&tokenAddress=So111...&limit=7d&interval=1h",
      response: `{
  "endpoint": "tokenPriceHistory",
  "status": "live",
  "chain": "sol", 
  "tokenAddress": "So111...",
  "currency": "usd",
  "limit": "7d",
  "interval": "1h",
  "points": [
    {
      "timestamp": 1710000000,
      "priceUsd": 150.5,
      "open": 150,
      "high": 152, 
      "low": 149,
      "close": 150.5,
      "volume": 1000000
    }
  ],
  "providers": [...]
}`
    },
    {
      method: "GET",
      path: "/detailedTokenStats",
      description: "Bucketed token stats from Codex, cached for 30 minutes. Useful for short-window and multi-window volume, price, liquidity, and trader-count deltas.",
      parameters: [
        { name: "chain", type: "string", required: false, default: "eth", description: "Chain" },
        { name: "tokenAddress", type: "string", required: true, default: "—", description: "Token address" },
        { name: "durations", type: "string", required: false, default: "hour1,day1", description: "Comma-separated durations: min5, hour1, hour4, hour12, day1" },
        { name: "bucketCount", type: "number", required: false, default: "6", description: "Number of buckets requested from Codex" },
        { name: "timestamp", type: "number", required: false, default: "—", description: "Optional unix timestamp snapshot" },
        { name: "statsType", type: "string", required: false, default: "UNFILTERED", description: "FILTERED or UNFILTERED" }
      ],
      example: "GET https://api.claw.click/detailedTokenStats?chain=eth&tokenAddress=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&durations=hour1,day1&bucketCount=6",
      response: `{
  "endpoint": "detailedTokenStats",
  "status": "live",
  "chain": "eth",
  "tokenAddress": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  "cached": false,
  "bucketCount": 6,
  "statsType": "UNFILTERED",
  "lastTransactionAt": 1773694307,
  "durations": {
    "hour1": {
      "duration": "hour1", 
      "start": 1773690707,
      "end": 1773694308,
      "statsUsd": {
        "volume": { 
          "currentValue": 13839617.47,
          "previousValue": 20042545.97, 
          "change": -0.3094 
        },
        "close": { 
          "currentValue": 2344.03,
          "previousValue": 2330.46,
          "change": 0.0058 
        }
      }
    }
  },
  "providers": [...]
}`
    }
  ]

  const riskEndpoints = [
    {
      method: "GET", 
      path: "/isScam",
      description: "Quick scam check — returns risk level and warnings.",
      parameters: [
        { name: "chain", type: "string", required: false, default: "eth", description: "Chain" },
        { name: "tokenAddress", type: "string", required: true, default: "—", description: "Token address" }
      ],
      example: "GET https://api.claw.click/isScam?chain=bsc&tokenAddress=0x...",
      response: `{
  "endpoint": "isScam",
  "status": "live",
  "chain": "bsc",
  "tokenAddress": "0x...",
  "isScam": false,
  "risk": "low",
  "riskLevel": 1,
  "warnings": [],
  "cached": true,
  "providers": [...]
}`
    },
    {
      method: "GET",
      path: "/fullAudit",
      description: "Deep contract audit — taxes, ownership, trading restrictions, holder stats, gas simulation.",
      parameters: [
        { name: "chain", type: "string", required: false, default: "eth", description: "Chain" },
        { name: "tokenAddress", type: "string", required: true, default: "—", description: "Token address" }
      ],
      example: "GET https://api.claw.click/fullAudit?chain=eth&tokenAddress=0x...",
      response: `{
  "endpoint": "fullAudit", 
  "status": "live",
  "chain": "eth",
  "tokenAddress": "0x...",
  "cached": false,
  "summary": {
    "isScam": false,
    "risk": "medium",
    "riskLevel": 2,
    "warnings": ["High sell tax"]
  },
  "taxes": { "buyTax": 1, "sellTax": 5, "transferTax": 0 },
  "contract": {
    "openSource": true,
    "isProxy": false,
    "isMintable": false,
    "canTakeBackOwnership": false,
    "hiddenOwner": false,
    "selfDestruct": false,
    "ownerAddress": "0x...",
    "creatorAddress": "0x..."
  },
  "trading": {
    "cannotBuy": false,
    "cannotSellAll": false,
    "isAntiWhale": false,
    "tradingCooldown": false,
    "transferPausable": false,
    "isBlacklisted": false,
    "isWhitelisted": false
  },
  "holders": { 
    "holderCount": 5000, 
    "lpHolderCount": 10, 
    "ownerPercent": 5, 
    "creatorPercent": 2 
  },
  "simulation": { "buyGas": "150000", "sellGas": "175000" },
  "providers": [...]
}`
    }
  ]

  const tradingEndpoints = [
    {
      method: "GET",
      path: "/swap",
      description: "Build an unsigned swap transaction. The caller signs and submits it. Use native, eth, or bnb as native-token sentinel for EVM native in/out.",
      parameters: [
        { name: "chain", type: "string", required: true, default: "—", description: "Chain: eth, base, bsc, sol" },
        { name: "dex", type: "string", required: true, default: "—", description: "DEX name (use /swapDexes to list)" },
        { name: "walletAddress", type: "string", required: true, default: "—", description: "Wallet that will sign" },
        { name: "tokenIn", type: "string", required: true, default: "—", description: "Input token address" },
        { name: "tokenOut", type: "string", required: true, default: "—", description: "Output token address" },
        { name: "amountIn", type: "string", required: true, default: "—", description: "Amount in raw units (wei/lamports)" },
        { name: "slippageBps", type: "number", required: false, default: "50", description: "Slippage tolerance in basis points (1–5000)" },
        { name: "deadline", type: "number", required: false, default: "now+20min", description: "Unix timestamp deadline (EVM only)" }
      ],
      example: "GET https://api.claw.click/swap?chain=eth&dex=uniswapV3&walletAddress=0x...&tokenIn=0x...&tokenOut=0x...&amountIn=1000000000000000000&slippageBps=100",
      response: `{
  "endpoint": "swap",
  "status": "live",
  "chain": "eth",
  "dex": "uniswapV3",
  "tokenIn": "0x...",
  "tokenOut": "0x...",
  "amountIn": "1000000000000000000",
  "slippageBps": 100,
  "tx": {
    "to": "0xRouterAddress",
    "data": "0xcalldata...",
    "value": "0x0",
    "chainId": 1,
    "from": "0xYourWallet",
    "gasLimit": "0x30000"
  },
  "providers": [...]
}`
    }
  ]

  const errorExamples = [
    {
      type: "Validation Errors (400)",
      response: `{
  "error": "Validation error",
  "message": "Invalid query parameters: tokenAddress — Required",
  "fields": [
    { "field": "tokenAddress", "message": "Required", "code": "invalid_type" }
  ]
}`
    },
    {
      type: "Invalid Chain (400)",
      response: `{
  "error": "Invalid chain",
  "message": "Unsupported chain \\"polygon\\". Valid chains: eth, base, bsc, sol"
}`
    },
    {
      type: "Not Found (404)",
      response: `{
  "error": "Not found",
  "message": "Route GET /foo does not exist. Available endpoints: /health, /providers, ..."
}`
    },
    {
      type: "Server Error (500)",
      response: `{
  "error": "Internal server error",
  "message": "Something went wrong processing GET /tokenPoolInfo. Check server logs for details."
}`
    }
  ]

  const integrations = [
    { name: "Moralis", category: "Infrastructure", status: "Live" },
    { name: "Birdeye", category: "Market Data", status: "Live" },
    { name: "DexScreener", category: "Market Data", status: "Live" },
    { name: "Codex.io", category: "Analytics", status: "Live" },
    { name: "Etherscan", category: "Infrastructure", status: "Live" },
    { name: "GoPlus", category: "Risk", status: "Live" },
    { name: "CoinGecko", category: "Market Data", status: "Live" },
    { name: "CoinMarketCap", category: "Market Data", status: "Live" },
    { name: "GeckoTerminal", category: "Market Data", status: "Live" },
    { name: "Zerion", category: "Portfolio", status: "Live" },
    { name: "DeBank", category: "Portfolio", status: "Live" },
    { name: "Arkham", category: "Analytics", status: "Live" },
    { name: "Dune Analytics", category: "Analytics", status: "Live" },
    { name: "Sim by Dune", category: "Analytics", status: "Live" },
    { name: "LunarCrush", category: "Sentiment", status: "Live" },
    { name: "Reddit API", category: "Sentiment", status: "Live" },
    { name: "X (Twitter)", category: "Sentiment", status: "Live" },
    { name: "Telegram", category: "Sentiment", status: "Live" },
    { name: "Bubblemaps", category: "Risk", status: "Live" },
    { name: "QuickIntel", category: "Risk", status: "Live" },
    { name: "Honeypot.is", category: "Risk", status: "Live" },
    { name: "Santiment", category: "Analytics", status: "Live" },
    { name: "DexTools", category: "Market Data", status: "Live" },
    { name: "Nansen", category: "Analytics", status: "Live" },
    { name: "Uniswap V2/V3/V4", category: "DEX", status: "Live" },
    { name: "PancakeSwap V2/V3", category: "DEX", status: "Live" },
    { name: "Aerodrome V2/V3", category: "DEX", status: "Live" },
    { name: "Raydium", category: "DEX", status: "Live" },
    { name: "Meteora", category: "DEX", status: "Live" },
    { name: "Pump.fun", category: "Launchpad", status: "Live" },
    { name: "Clanker", category: "Launchpad", status: "Live" },
    { name: "Virtuals Protocol", category: "Launchpad", status: "Live" }
  ]

  const CodeBlock = ({ children, language = 'bash' }) => {
    const highlightSyntax = (text) => {
      if (language === 'bash') {
        return text
          .replace(/(GET|POST|PUT|DELETE|PATCH)\s+/g, '<span class="method-highlight">$1</span> ')
          .replace(/(https?:\/\/[^\s\\]+)/g, '<span class="url-highlight">$1</span>')
      }
      return text
    }

    return (
      <div className="code-example">
        <div className="code-header">
          <span className="code-language">{language}</span>
        </div>
        <div className="code-block">
          <pre 
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightSyntax(children) }}
          />
        </div>
      </div>
    )
  }

  const JsonBlock = ({ children }) => {
    const highlightJson = (text) => {
      return text
        .replace(/"([^"]+)":/g, '<span class="json-property">"$1":</span>')
        .replace(/:\s*"([^"]+)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
        .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>')
    }

    return (
      <div className="code-example">
        <div className="code-header">
          <span className="code-language">json</span>
        </div>
        <div className="code-block json-block">
          <pre 
            className="language-json"
            dangerouslySetInnerHTML={{ __html: highlightJson(children) }}
          />
        </div>
      </div>
    )
  }

  const EndpointCard = ({ endpoint }) => (
    <div className="endpoint-card">
      <div className="endpoint-header">
        <span className={`method method-${endpoint.method.toLowerCase()}`}>
          {endpoint.method}
        </span>
        <code className="endpoint-path">{endpoint.path}</code>
      </div>
      <p className="endpoint-description">{endpoint.description}</p>
      
      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <div className="parameters-section">
          <h4 className="parameters-title">Parameters</h4>
          <div className="parameters-table">
            <div className="table-header">
              <span>Parameter</span>
              <span>Type</span>
              <span>Required</span>
              <span>Default</span>
              <span>Description</span>
            </div>
            {endpoint.parameters.map((param, index) => (
              <div key={index} className="table-row">
                <code className="param-name">{param.name}</code>
                <span className="param-type">{param.type}</span>
                <span className={`param-required ${param.required ? 'required' : 'optional'}`}>
                  {param.required ? 'Yes' : 'No'}
                </span>
                <code className="param-default">{param.default}</code>
                <span className="param-description">{param.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="example-section">
        <h4 className="example-title">Example</h4>
        <CodeBlock language="bash">{endpoint.example}</CodeBlock>
      </div>
      
      <div className="response-section">
        <h4 className="response-title">Response</h4>
        <JsonBlock>{endpoint.response}</JsonBlock>
      </div>
    </div>
  )

  return (
    <div className="api-docs-page">
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰ Menu
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-menu-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Navigation Sidebar */}
      <aside className={`api-docs-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-content">
          <h3 className="sidebar-title">API Documentation</h3>
          <nav className="sidebar-nav">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  scrollToSection(section.id)
                  setSidebarOpen(false) // Close mobile menu after navigation
                }}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="api-docs-main">
        {/* Overview */}
        <header className="api-docs-header" id="overview">
          <div className="api-docs-container">
            <div className="api-docs-hero">
              <h1 className="api-docs-title">Super API Documentation</h1>
              <p className="api-docs-subtitle">
                Unified Crypto Intelligence API — 50+ data providers behind clean REST endpoints
              </p>
              <div className="api-base-url">
                <span className="base-url-label">Base URL:</span>
                <code className="base-url">https://api.claw.click</code>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Start */}
        <section className="quick-start-section" id="quickstart">
          <div className="api-docs-container">
            <h2 className="section-title">Quick Start</h2>
            <div className="quick-start-interactive">
              <div className="quick-start-example">
                <CodeBlock language="bash">
                  {`curl -X GET "https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" \\
  -H "Content-Type: application/json"`}
                </CodeBlock>
                <button 
                  className="run-button" 
                  onClick={runQuickStartExample}
                  disabled={isLoading}
                >
                  {isLoading ? 'Running...' : 'Run'}
                </button>
              </div>
              
              {quickStartResponse && (
                <div className="quick-start-response">
                  <h3 className="response-title">Response</h3>
                  <JsonBlock>{JSON.stringify(quickStartResponse, null, 2)}</JsonBlock>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Supported Chains */}
        <section className="chains-section" id="chains">
          <div className="api-docs-container">
            <h2 className="section-title">Supported Chains</h2>
            <div className="chains-grid">
              {supportedChains.map((chain, index) => (
                <div key={index} className="chain-item">
                  <div className="chain-header">
                    <span className="chain-name">{chain.name}</span>
                    <span className="chain-id">ID: {chain.chainId}</span>
                  </div>
                  <span className="chain-alias">({chain.id})</span>
                  <span className="chain-status">{chain.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Response Format */}
        <section className="response-format-section" id="response-format">
          <div className="api-docs-container">
            <h2 className="section-title">Common Response Format</h2>
            <p className="response-description">
              Every endpoint returns a consistent JSON structure with provider status tracking:
            </p>
            <JsonBlock>
{`{
  "endpoint": "endpointName",
  "status": "live" | "partial",
  "providers": [
    {
      "provider": "providerName",
      "status": "ok" | "skipped" | "error",
      "detail": "Additional context..."
    }
  ],
  // ... endpoint-specific data
}`}
            </JsonBlock>
            <ul className="status-meanings">
              <li><strong>live:</strong> All providers returned data successfully</li>
              <li><strong>partial:</strong> Some providers were skipped or errored, but usable data was returned</li>
              <li><strong>ok:</strong> Provider contributed data successfully</li>
              <li><strong>skipped:</strong> Provider was not configured or not applicable</li>
              <li><strong>error:</strong> Provider encountered an error</li>
            </ul>
          </div>
        </section>

        {/* Core Endpoints */}
        <section className="endpoints-section" id="core-endpoints">
          <div className="api-docs-container">
            <h2 className="section-title">Core Endpoints</h2>
            <p className="section-description">Essential API endpoints for health checks and provider status</p>
            {coreEndpoints.map((endpoint, index) => (
              <EndpointCard key={index} endpoint={endpoint} />
            ))}
          </div>
        </section>

        {/* Market Data */}
        <section className="endpoints-section" id="market-data">
          <div className="api-docs-container">
            <h2 className="section-title">Market Data Endpoints</h2>
            <p className="section-description">Real-time and historical market data for tokens and trading pairs</p>
            {marketDataEndpoints.map((endpoint, index) => (
              <EndpointCard key={index} endpoint={endpoint} />
            ))}
          </div>
        </section>

        {/* Risk Assessment */}
        <section className="endpoints-section" id="risk-assessment">
          <div className="api-docs-container">
            <h2 className="section-title">Risk Assessment Endpoints</h2>
            <p className="section-description">Comprehensive risk analysis and security audits for tokens</p>
            {riskEndpoints.map((endpoint, index) => (
              <EndpointCard key={index} endpoint={endpoint} />
            ))}
          </div>
        </section>

        {/* Trading & DEX */}
        <section className="endpoints-section" id="trading-dex">
          <div className="api-docs-container">
            <h2 className="section-title">Trading & DEX Endpoints</h2>
            <p className="section-description">DEX trading, swaps, approvals, and liquidity management</p>
            
            <div className="dex-support-table">
              <h3>Supported DEXes by Chain</h3>
              <div className="table-wrapper">
                <table className="dex-table">
                  <thead>
                    <tr>
                      <th>Chain</th>
                      <th>Supported DEXes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Ethereum</td>
                      <td>uniswapV2, uniswapV3, uniswapV4</td>
                    </tr>
                    <tr>
                      <td>Base</td>
                      <td>uniswapV2, uniswapV3, uniswapV4, aerodromeV2, aerodromeV3</td>
                    </tr>
                    <tr>
                      <td>BSC</td>
                      <td>pancakeswapV2, pancakeswapV3</td>
                    </tr>
                    <tr>
                      <td>Solana</td>
                      <td>raydium, meteora, pumpfun</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {tradingEndpoints.map((endpoint, index) => (
              <EndpointCard key={index} endpoint={endpoint} />
            ))}
          </div>
        </section>

        {/* WebSockets */}
        <section className="websocket-section" id="websockets">
          <div className="api-docs-container">
            <h2 className="section-title">WebSocket Streaming</h2>
            <p className="websocket-description">
              Real-time launchpad events via WebSocket connection:
            </p>
            <CodeBlock language="javascript">
{`const WebSocket = require('ws');
const ws = new WebSocket('wss://api.claw.click/ws/launchpadEvents');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'info') {
    // Send filter for Pump.fun events
    ws.send(JSON.stringify({ protocol: 'PumpDotFun' }));
  } else if (msg.type === 'events') {
    msg.data.forEach(event => {
      console.log(\`New token: \${event.tokenSymbol} — $\${event.marketCap} mcap\`);
    });
  }
});`}
            </CodeBlock>
          </div>
        </section>

        {/* Error Handling */}
        <section className="error-handling-section" id="error-handling">
          <div className="api-docs-container">
            <h2 className="section-title">Error Handling</h2>
            <p className="section-description">Standard HTTP error responses and formats</p>
            {errorExamples.map((error, index) => (
              <div key={index} className="error-example">
                <h3 className="error-type">{error.type}</h3>
                <JsonBlock>{error.response}</JsonBlock>
              </div>
            ))}
          </div>
        </section>

        {/* Integrations */}
        <section className="integrations-section" id="integrations">
          <div className="api-docs-container">
            <h2 className="section-title">Data Sources & Integrations</h2>
            <p className="integrations-description">
              Our API aggregates data from {integrations.length}+ premium sources to provide comprehensive crypto intelligence and trading infrastructure.
            </p>
            
            <div className="integrations-grid">
              {integrations.map((integration, index) => (
                <div key={index} className="integration-item">
                  <div className="integration-header">
                    <span className="integration-name">{integration.name}</span>
                    <span className={`integration-status status-${integration.status.toLowerCase()}`}>
                      {integration.status}
                    </span>
                  </div>
                  <span className="integration-category">{integration.category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="api-cta-section">
          <div className="api-docs-container">
            <div className="api-cta">
              <h2 className="cta-title">Ready to Build?</h2>
              <p className="cta-description">
                Get your API key and start building with unified trading infrastructure.
              </p>
              <div className="cta-buttons">
                <button className="cta-button primary">Get API Key</button>
                <button className="cta-button secondary">View Examples</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ApiDocs