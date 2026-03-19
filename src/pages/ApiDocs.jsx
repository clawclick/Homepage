import React, { useState, useEffect } from 'react'

const ApiDocs = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [expandedEndpoint, setExpandedEndpoint] = useState(null)
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigationSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'endpoints', label: 'API Endpoints' },
    { id: 'auth', label: 'Authentication' },
    { id: 'chains', label: 'Supported Chains' },
    { id: 'websockets', label: 'WebSockets' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'integrations', label: 'Data Providers' }
  ]

  // Comprehensive endpoints data from GitHub README
  const endpoints = [
    {
      category: 'Core',
      items: [
        {
          method: 'GET', path: '/health', description: 'Health check',
          requiresAuth: false, example: 'GET https://api.claw.click/health',
          response: '{"status": "ok", "service": "super-api"}'
        },
        {
          method: 'GET', path: '/providers', description: 'List all 50+ providers and their config status',
          requiresAuth: false, example: 'GET https://api.claw.click/providers',
          response: '{"providers": [{"id": "moralis", "label": "Moralis", "category": "walletTracking", "configured": true}, {"id": "birdeye", "label": "Birdeye", "category": "marketData", "configured": true}, {"id": "dexScreener", "label": "DexScreener", "category": "marketData", "configured": true}, {"id": "codex", "label": "Codex.io", "category": "analytics", "configured": true}]}'
        },
        {
          method: 'GET', path: '/stats', description: 'Summary daily stats: requests, users, volume (Admin)',
          requiresAuth: true, example: 'GET https://api.claw.click/stats',
          response: '{"endpoint": "stats", "dayKey": "2026-03-19", "requests": {"total": 1240}, "users": {"totalGenerated": 12, "activeToday": 4}, "volume": {"buyWei": "1000000000000000000", "sellWei": "500000000000000000", "buyEth": "1", "sellEth": "0.5", "buyCount": 3, "sellCount": 2}}'
        }
      ]
    },
    {
      category: 'Market Data',
      items: [
        {
          method: 'GET', path: '/tokenPoolInfo', description: 'Token price, market cap, liquidity, pair info',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain to query' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token contract address' },
            { name: 'poolAddress', required: false, default: '—', description: 'Specific pool address' },
            { name: 'symbol', required: false, default: '—', description: 'Token symbol hint' },
            { name: 'tokenName', required: false, default: '—', description: 'Token name hint' }
          ],
          example: 'GET https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          response: '{"endpoint": "tokenPoolInfo", "status": "live", "chain": "eth", "tokenAddress": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "name": "USD Coin", "symbol": "USDC", "priceUsd": 1.0001, "marketCapUsd": 32000000000, "fdvUsd": 32000000000, "liquidityUsd": 150000000, "volume24hUsd": 5000000000, "priceChange24hPct": -0.01, "pairAddress": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", "dex": "uniswap_v3", "providers": [{"provider": "dexScreener", "status": "ok", "detail": "Live data"}, {"provider": "birdeye", "status": "ok", "detail": "Price confirmed"}]}'
        },
        {
          method: 'GET', path: '/tokenPriceHistory', description: 'Historical OHLCV price data for charting',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address or major symbol (btc, eth, sol)' },
            { name: 'limit', required: false, default: '3m', description: 'Time range: 1d, 7d, 1m, 3m, 1y' },
            { name: 'interval', required: false, default: '1d', description: 'Candle interval: 5m, 15m, 1h, 4h, 1d' }
          ],
          example: 'GET https://api.claw.click/tokenPriceHistory?chain=sol&tokenAddress=So111...&limit=7d&interval=1h',
          response: '{"endpoint": "tokenPriceHistory", "status": "live", "chain": "sol", "points": [{"timestamp": 1710000000, "priceUsd": 150.5, "open": 150, "high": 152, "low": 149, "close": 150.5, "volume": 1000000}]}'
        },
        {
          method: 'GET', path: '/detailedTokenStats', description: 'Bucketed token stats from Codex (cached 30 min)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' },
            { name: 'durations', required: false, default: 'hour1,day1', description: 'Comma-separated: min5, hour1, hour4, hour12, day1' },
            { name: 'bucketCount', required: false, default: '6', description: 'Number of buckets from Codex' }
          ],
          example: 'GET https://api.claw.click/detailedTokenStats?chain=eth&tokenAddress=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          response: '{"endpoint": "detailedTokenStats", "status": "live", "durations": {"hour1": {"statsUsd": {"volume": {"currentValue": 13839617.47, "change": -0.3094}}}}}'
        },
        {
          method: 'GET', path: '/trendingTokens', description: 'Currently trending tokens across all chains',
          requiresAuth: true,
          example: 'GET https://api.claw.click/trendingTokens',
          response: '{"endpoint": "trendingTokens", "status": "live", "tokens": [{"chainId": "solana", "name": "PepeCoin", "symbol": "PEPE", "priceUsd": 0.0001, "volume24hUsd": 50000000, "marketCapUsd": 5000000, "liquidityUsd": 2000000, "priceChange24hPct": 150, "boostAmount": 500, "source": "dexScreener"}]}'
        },
        {
          method: 'GET', path: '/newPairs', description: 'Recently created trading pairs/pools',
          requiresAuth: true,
          params: [
            { name: 'source', required: false, default: 'all', description: 'Filter: all, dexscreener, pumpfun, raydium, uniswap' },
            { name: 'limit', required: false, default: '10', description: 'Results per source (1–50)' }
          ],
          example: 'GET https://api.claw.click/newPairs?source=pumpfun&limit=5',
          response: '{"endpoint": "newPairs", "status": "live", "source": "pumpfun", "pairs": [{"source": "pumpfun", "chainId": "solana", "pairAddress": null, "tokenAddress": "GmD5J8...", "name": "NewToken", "symbol": "NEW", "description": "A new meme token", "createdAt": 1710000000, "marketCap": 50000, "url": "https://pump.fun/..."}]}'
        }
      ]
    },
    {
      category: 'Risk Assessment',
      items: [
        {
          method: 'GET', path: '/isScam', description: 'Quick scam check with risk score',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' }
          ],
          example: 'GET https://api.claw.click/isScam?chain=bsc&tokenAddress=0x...',
          response: '{"endpoint": "isScam", "status": "live", "chain": "bsc", "tokenAddress": "0x...", "isScam": false, "risk": "low", "riskLevel": 1, "warnings": [], "cached": true, "providers": [{"provider": "goplus", "status": "ok"}, {"provider": "honeypot", "status": "ok"}]}'
        },
        {
          method: 'GET', path: '/fullAudit', description: 'Deep contract audit (taxes, ownership, trading flags)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' }
          ],
          example: 'GET https://api.claw.click/fullAudit?chain=eth&tokenAddress=0x...',
          response: '{"endpoint": "fullAudit", "status": "live", "chain": "eth", "tokenAddress": "0x...", "summary": {"isScam": false, "risk": "medium", "riskLevel": 2, "warnings": ["High sell tax"]}, "taxes": {"buyTax": 1, "sellTax": 5, "transferTax": 0}, "contract": {"openSource": true, "isProxy": false, "isMintable": false}, "trading": {"cannotBuy": false, "cannotSellAll": false}, "holders": {"holderCount": 5000, "ownerPercent": 5}, "simulation": {"buyGas": "150000", "sellGas": "175000"}}'
        }
      ]
    },
    {
      category: 'Trading & DEX',
      items: [
        {
          method: 'GET', path: '/swap', description: 'Build unsigned swap transaction',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain: eth, base, bsc, sol' },
            { name: 'dex', required: true, default: '—', description: 'DEX name (use /swapDexes to list)' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet that will sign' },
            { name: 'tokenIn', required: true, default: '—', description: 'Input token address' },
            { name: 'tokenOut', required: true, default: '—', description: 'Output token address' },
            { name: 'amountIn', required: true, default: '—', description: 'Amount in raw units (wei/lamports)' },
            { name: 'slippageBps', required: false, default: '50', description: 'Slippage tolerance in basis points' }
          ],
          example: 'GET https://api.claw.click/swap?chain=eth&dex=uniswapV3&walletAddress=0x...&tokenIn=0x...&tokenOut=0x...&amountIn=1000000000000000000',
          response: '{"endpoint": "swap", "status": "live", "chain": "eth", "dex": "uniswapV3", "tokenIn": "0x...", "tokenOut": "0x...", "amountIn": "1000000000000000000", "slippageBps": 100, "tx": {"to": "0xE592427A0AEce92De3Edee1F18E0157C05861564", "data": "0x414bf389000...", "value": "0x0", "chainId": 1, "from": "0xYourWallet", "gasLimit": "0x30000"}}'
        },
        {
          method: 'GET', path: '/swapQuote', description: 'Get swap quote without building transaction',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain' },
            { name: 'dex', required: true, default: '—', description: 'DEX name' },
            { name: 'tokenIn', required: true, default: '—', description: 'Input token' },
            { name: 'tokenOut', required: true, default: '—', description: 'Output token' },
            { name: 'amountIn', required: true, default: '—', description: 'Raw amount in' }
          ],
          example: 'GET https://api.claw.click/swapQuote?chain=eth&dex=uniswapV3&tokenIn=0x...&tokenOut=0x...&amountIn=1000000',
          response: '{"endpoint": "swapQuote", "status": "live", "chain": "eth", "dex": "uniswapV3", "amountOut": "997000", "amountOutMin": "992000", "priceImpact": 0.15, "providers": [{"provider": "uniswapV3", "status": "ok"}]}'
        },
        {
          method: 'GET', path: '/swapDexes', description: 'List available DEXes for a chain',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain' }
          ],
          example: 'GET https://api.claw.click/swapDexes?chain=eth',
          response: '{"endpoint": "swapDexes", "chain": "eth", "dexes": [{"id": "uniswapV2", "label": "Uniswap V2"}, {"id": "uniswapV3", "label": "Uniswap V3"}, {"id": "uniswapV4", "label": "Uniswap V4"}]}'
        },
        {
          method: 'GET', path: '/approve', description: 'Build unsigned approval transaction steps',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain (eth, base, bsc)' },
            { name: 'dex', required: true, default: '—', description: 'DEX id from /swapDexes' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet that will sign' },
            { name: 'tokenIn', required: true, default: '—', description: 'Token to approve' }
          ],
          example: 'GET https://api.claw.click/approve?chain=eth&dex=uniswapV3&walletAddress=0x...&tokenIn=0x...',
          response: '{"endpoint": "approve", "status": "live", "chain": "eth", "dex": "uniswapV3", "tokenIn": "0x...", "approvalMode": "auto", "resolvedMode": "erc20", "spender": "0xE592427A0AEce92De3Edee1F18E0157C05861564", "steps": [{"kind": "erc20", "label": "Approve Uniswap V3 Router", "spender": "0xE592427A0AEce92De3Edee1F18E0157C05861564", "tx": {"to": "0xTokenAddress", "data": "0x095ea7b3...", "value": "0x0", "chainId": 1, "from": "0xYourWallet"}}]}'
        }
      ]
    },
    {
      category: 'Wallet Analysis',
      items: [
        {
          method: 'GET', path: '/walletReview', description: 'Comprehensive wallet analysis — PnL, holdings, protocols, activity',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet address' },
            { name: 'days', required: false, default: '30', description: 'Lookback period' }
          ],
          example: 'GET https://api.claw.click/walletReview?chain=sol&walletAddress=8X35r...&days=30',
          response: '{"endpoint": "walletReview", "status": "live", "chain": "sol", "walletAddress": "8X35r...", "days": "30", "summary": {"totalNetWorthUsd": 125000, "chainNetWorthUsd": 80000, "realizedProfitUsd": 15000, "realizedProfitPct": 23.5, "totalTradeVolumeUsd": 500000, "totalTrades": 150, "profitable": true, "tokenCount": 15, "protocolCount": 5, "activeChains": ["sol", "eth"]}, "topHoldings": [{"tokenAddress": "So111...", "chain": "sol", "symbol": "SOL", "amount": 500, "priceUsd": 160, "valueUsd": 80000}]}'
        },
        {
          method: 'GET', path: '/holders', description: 'Top holder rows for a token',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain: eth, base, bsc, sol' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token contract or mint address' },
            { name: 'limit', required: false, default: '150', description: 'Maximum rows returned (1–150)' }
          ],
          example: 'GET https://api.claw.click/holders?chain=sol&tokenAddress=Dz9mQ...&limit=5',
          response: '{"endpoint": "holders", "status": "live", "cached": false, "chain": "sol", "tokenAddress": "Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk", "limit": 5, "holderCount": 36547, "totalSupplyRaw": "999111158353621", "totalSupplyFormatted": "999111158.353621", "holders": [{"address": "u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w", "label": null, "entity": null, "balance": "66226101364616", "balanceFormatted": "66226101.364616", "percentOfSupply": 6.6286}]}'
        }
      ]
    },
    {
      category: 'Discovery & Analytics',
      items: [
        {
          method: 'GET', path: '/tokenSearch', description: 'Search tokens by name, symbol, or address',
          requiresAuth: true,
          params: [
            { name: 'query', required: true, default: '—', description: 'Search term' }
          ],
          example: 'GET https://api.claw.click/tokenSearch?query=pepe',
          response: '{"endpoint": "tokenSearch", "status": "live", "query": "pepe", "results": [{"chainId": "ethereum", "pairAddress": "0x...", "tokenAddress": "0x6982508145454ce325ddbe47a25d4ec3d2311933", "name": "Pepe", "symbol": "PEPE", "priceUsd": 0.00001, "volume24hUsd": 200000000, "liquidityUsd": 50000000, "priceChange24hPct": 5.2, "fdvUsd": 4000000000, "dex": "uniswap"}]}'
        },
        {
          method: 'GET', path: '/filterTokens', description: 'Filter tokens by metrics (Codex, cached 5 min)',
          requiresAuth: true,
          params: [
            { name: 'network', required: false, default: '—', description: 'Chain filter: eth, base, bsc, sol (comma-separated)' },
            { name: 'minLiquidity', required: false, default: '—', description: 'Minimum USD liquidity' },
            { name: 'minVolume24', required: false, default: '—', description: 'Minimum 24h volume' },
            { name: 'sortBy', required: false, default: 'trendingScore24', description: 'Sort field' }
          ],
          example: 'GET https://api.claw.click/filterTokens?network=sol&minLiquidity=50000&sortBy=trendingScore24',
          response: '{"endpoint": "filterTokens", "status": "live", "cached": true, "count": 10, "page": 0, "tokens": [{"address": "TokenMint...", "name": "MemeToken", "symbol": "MEME", "priceUsd": "0.0001", "liquidity": "65000", "marketCap": "500000", "volume24h": "12000000", "change24h": "0.15", "holders": 4500, "sniperCount": 5, "devHeldPct": 1.5, "top10HoldersPct": 28, "launchpad": {"name": "Pump", "completed": true}}]}'
        },
        {
          method: 'GET', path: '/volatilityScanner', description: 'Swing-trade volatility scanner (cached 5 min)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'sol', description: 'Chain to scan' },
            { name: 'minVolume', required: false, default: '100000', description: 'Minimum 24h volume (USD)' },
            { name: 'minSwingPct', required: false, default: '10', description: 'Minimum median swing size (%)' }
          ],
          example: 'GET https://api.claw.click/volatilityScanner?chain=sol&minVolume=500000',
          response: '{"endpoint": "volatilityScanner", "chain": "sol", "duration": "hour4", "count": 5, "cached": false, "scanned": 50, "candidates": [{"address": "TokenMint...", "name": "ExampleToken", "symbol": "EX", "priceUsd": "0.00523", "liquidity": "250000", "volume24h": "1200000", "support": 0.0042, "resistance": 0.0068, "swingPct": 18.5, "swingCount": 4, "currentPosition": 0.32, "buyVsSellRatio": 1.15, "swingScore": 85}]}'
        },
        {
          method: 'GET', path: '/topTraders', description: 'Top traders for a token (multi-chain via Birdeye)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'sol', description: 'Chain (sol, eth, base, bsc)' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' },
            { name: 'timeFrame', required: false, default: '24h', description: 'Time frame (30m, 1h, 2h, 4h, 8h, 24h)' }
          ],
          example: 'GET https://api.claw.click/topTraders?chain=eth&tokenAddress=0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7&timeFrame=24h',
          response: '{"endpoint": "topTraders", "status": "live", "chain": "eth", "tokenAddress": "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7", "timeFrame": "24h", "traders": [{"address": "0x...", "tradeCount": 4, "volume": 394.10, "buyVolume": 394.10, "sellVolume": 0, "profit": 12.5, "winRate": 0.75}], "providers": [{"provider": "birdeye", "status": "ok"}]}'
        },
        {
          method: 'GET', path: '/gasFeed', description: 'Current gas prices for EVM chains',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain (eth, base, bsc)' }
          ],
          example: 'GET https://api.claw.click/gasFeed?chain=eth',
          response: '{"endpoint": "gasFeed", "status": "live", "chain": "eth", "lastBlock": "23467872", "safeGwei": "0.38", "proposeGwei": "0.38", "fastGwei": "0.42", "baseFeeGwei": "0.38", "providers": [{"provider": "etherscanV2", "status": "ok"}]}'
        }
      ]
    }
  ]

  const supportedChains = [
    { name: "Ethereum", id: "eth / ethereum", chainId: "1", status: "live" },
    { name: "Base", id: "base", chainId: "8453", status: "live" },
    { name: "BSC", id: "bsc / bnb", chainId: "56", status: "live" },
    { name: "Solana", id: "sol / solana", chainId: "Non-EVM", status: "live" }
  ]

  const integrations = [
    { name: "Moralis", category: "Infrastructure", status: "live" },
    { name: "Birdeye", category: "Market Data", status: "live" },
    { name: "DexScreener", category: "Market Data", status: "live" },
    { name: "Codex.io", category: "Analytics", status: "live" },
    { name: "Alchemy", category: "Infrastructure", status: "live" },
    { name: "GoPlus", category: "Risk", status: "live" },
    { name: "CoinGecko", category: "Market Data", status: "apikey" },
    { name: "CoinMarketCap", category: "Market Data", status: "live" },
    { name: "GeckoTerminal", category: "Market Data", status: "live" },
    { name: "Zerion", category: "Portfolio", status: "live" },
    { name: "DeBank", category: "Portfolio", status: "apikey" },
    { name: "Arkham", category: "Analytics", status: "apikey" },
    { name: "Dune Analytics", category: "Analytics", status: "apikey" },
    { name: "DefiLlama", category: "DeFi", status: "live" },
    { name: "LunarCrush", category: "Sentiment", status: "apikey" },
    { name: "Uniswap V2/V3/V4", category: "DEX", status: "live" },
    { name: "PancakeSwap V2/V3", category: "DEX", status: "live" },
    { name: "Raydium", category: "DEX", status: "live" },
    { name: "Pump.fun", category: "Launchpad", status: "live" }
  ]

  // Scroll tracking
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
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  const runEndpoint = async (endpoint) => {
    const endpointKey = `${endpoint.method}_${endpoint.path}`
    setLoading(prev => ({ ...prev, [endpointKey]: true }))
    
    try {
      // Show cached response with realistic delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setResponses(prev => ({
        ...prev,
        [endpointKey]: {
          status: 200,
          data: JSON.parse(endpoint.response),
          cached: true
        }
      }))
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        [endpointKey]: {
          status: 500,
          error: 'Failed to parse example response'
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [endpointKey]: false }))
    }
  }

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
                  setSidebarOpen(false)
                }}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-socials">
            <a href="https://t.me/clawclick" target="_blank" rel="noopener noreferrer" className="sidebar-social-link" title="Telegram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span>Telegram</span>
            </a>
            <a href="https://x.com/clawclick" target="_blank" rel="noopener noreferrer" className="sidebar-social-link" title="X (Twitter)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X (Twitter)</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="api-docs-main">
        {/* Overview */}
        <header className="api-docs-header" id="overview">
          <div className="api-docs-container">
            <div className="api-docs-hero">
              <h1 className="api-docs-title">Claw.Click Trading API</h1>
              <p className="api-docs-subtitle">
                Unified Crypto Intelligence API — 50+ data providers behind clean REST endpoints
              </p>
              <div className="api-stats">
                <div className="stat-item">
                  <span className="stat-number">50+</span>
                  <span className="stat-label">Data Sources</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">4</span>
                  <span className="stat-label">Blockchains</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">30+</span>
                  <span className="stat-label">Endpoints</span>
                </div>
              </div>
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
            <div className="quick-start-cards">
              <div className="quick-start-card">
                <h3>1. Get Token Info</h3>
                <CodeBlock language="bash">
                  curl "https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
                </CodeBlock>
              </div>
              <div className="quick-start-card">
                <h3>2. Check Risk</h3>
                <CodeBlock language="bash">
                  curl "https://api.claw.click/isScam?chain=eth&tokenAddress=0x..."
                </CodeBlock>
              </div>
              <div className="quick-start-card">
                <h3>3. Build Swap</h3>
                <CodeBlock language="bash">
                  curl "https://api.claw.click/swap?chain=eth&dex=uniswapV3&walletAddress=0x...&tokenIn=0x...&tokenOut=0x...&amountIn=1000000000000000000"
                </CodeBlock>
              </div>
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="endpoints-section" id="endpoints">
          <div className="api-docs-container">
            <h2 className="section-title">API Endpoints</h2>
            <p className="section-description">
              Comprehensive endpoint reference with interactive examples
            </p>

            {endpoints.map((category) => (
              <div key={category.category} className="endpoint-category">
                <h3 className="category-title">{category.category}</h3>
                <div className="endpoints-table">
                  <div className="table-header">
                    <span>Endpoint</span>
                    <span>Description</span>
                    <span>Actions</span>
                  </div>
                  
                  {category.items.map((endpoint, index) => {
                    const endpointKey = `${endpoint.method}_${endpoint.path}`
                    const isExpanded = expandedEndpoint === endpointKey
                    const isLoading = loading[endpointKey]
                    const response = responses[endpointKey]

                    return (
                      <div key={index} className="endpoint-row">
                        <div className="endpoint-summary" onClick={() => setExpandedEndpoint(isExpanded ? null : endpointKey)}>
                          <code className="endpoint-path">{endpoint.path}</code>
                          <span className="endpoint-description">{endpoint.description}</span>
                          <div className="endpoint-badges">
                            <span className={`method method-${endpoint.method.toLowerCase()}`}>
                              {endpoint.method}
                            </span>
                            <span className={`auth-status ${endpoint.requiresAuth ? 'required' : 'public'}`}>
                              {endpoint.requiresAuth ? 'API Key Required' : 'Public'}
                            </span>
                            <button 
                              className="run-button"
                              onClick={(e) => {
                                e.stopPropagation()
                                runEndpoint(endpoint)
                              }}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Running...' : 'Run'}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="endpoint-details">
                            {endpoint.params && (
                              <div className="params-section">
                                <h4>Parameters</h4>
                                <div className="params-table">
                                  <div className="params-header">
                                    <span>Parameter</span>
                                    <span>Required</span>
                                    <span>Default</span>
                                    <span>Description</span>
                                  </div>
                                  {endpoint.params.map((param, pidx) => (
                                    <div key={pidx} className="param-row">
                                      <code className="param-name">{param.name}</code>
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
                              <h4>Example Request</h4>
                              <CodeBlock language="bash">{endpoint.example}</CodeBlock>
                            </div>

                            <div className="response-section">
                              <h4>
                                {response ? (
                                  <>
                                    Live Response{' '}
                                    <span className={`status-code ${response.status === 200 ? 'success' : 'error'}`}>
                                      {response.status}
                                    </span>
                                    {response.cached && <span className="cached-badge">Cached Example</span>}
                                  </>
                                ) : (
                                  'Example Response'
                                )}
                              </h4>
                              {response ? (
                                response.data ? (
                                  <JsonBlock>{JSON.stringify(response.data, null, 2)}</JsonBlock>
                                ) : (
                                  <div className="error-response">{response.error}</div>
                                )
                              ) : (
                                <JsonBlock>{JSON.stringify(JSON.parse(endpoint.response), null, 2)}</JsonBlock>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Always show response directly below if Run was clicked */}
                        {response && !isExpanded && (
                          <div className="endpoint-response-direct">
                            <div className="response-header">
                              <h4>
                                Response{' '}
                                <span className={`status-code ${response.status === 200 ? 'success' : 'error'}`}>
                                  {response.status}
                                </span>
                                {response.cached && <span className="cached-badge">Cached Example</span>}
                              </h4>
                            </div>
                            {response.data ? (
                              <JsonBlock>{JSON.stringify(response.data, null, 2)}</JsonBlock>
                            ) : (
                              <div className="error-response">{response.error}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Authentication */}
        <section className="auth-section" id="auth">
          <div className="api-docs-container">
            <h2 className="section-title">Authentication</h2>
            <div className="auth-cards">
              <div className="auth-card">
                <h3>Public Endpoints</h3>
                <p>No authentication required</p>
                <ul>
                  <li>/health</li>
                  <li>/providers</li>
                </ul>
              </div>
              <div className="auth-card">
                <h3>Protected Endpoints</h3>
                <p>Include API key in headers</p>
                <CodeBlock language="bash">
                  {`curl -H "x-api-key: YOUR_API_KEY" \\
  "https://api.claw.click/tokenPoolInfo?..."`}
                </CodeBlock>
              </div>
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
                    <span className={`chain-status status-${chain.status}`}>
                      {chain.status}
                    </span>
                  </div>
                  <div className="chain-details">
                    <span className="chain-id">Chain ID: {chain.chainId}</span>
                    <span className="chain-alias">({chain.id})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WebSockets */}
        <section className="websocket-section" id="websockets">
          <div className="api-docs-container">
            <h2 className="section-title">WebSocket Streaming</h2>
            <div className="websocket-card">
              <h3>Real-time Launchpad Events</h3>
              <p>Connect to our WebSocket for live token launches and updates</p>
              <CodeBlock language="javascript">
{`const WebSocket = require('ws');
const ws = new WebSocket('wss://api.claw.click/ws/launchpadEvents');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'info') {
    ws.send(JSON.stringify({ protocol: 'PumpDotFun' }));
  } else if (msg.type === 'events') {
    msg.data.forEach(event => {
      console.log(\`New token: \${event.tokenSymbol} — $\${event.marketCap} mcap\`);
    });
  }
});`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Error Handling */}
        <section className="error-section" id="error-handling">
          <div className="api-docs-container">
            <h2 className="section-title">Error Handling</h2>
            <div className="error-examples">
              <div className="error-example">
                <h3>400 - Validation Error</h3>
                <JsonBlock>
{`{
  "error": "Validation error",
  "message": "Invalid query parameters: tokenAddress — Required",
  "fields": [
    { "field": "tokenAddress", "message": "Required", "code": "invalid_type" }
  ]
}`}
                </JsonBlock>
              </div>
              <div className="error-example">
                <h3>500 - Server Error</h3>
                <JsonBlock>
{`{
  "error": "Internal server error",
  "message": "Something went wrong processing GET /tokenPoolInfo. Check server logs for details."
}`}
                </JsonBlock>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="integrations-section" id="integrations">
          <div className="api-docs-container">
            <h2 className="section-title">Data Sources & Integrations</h2>
            <p className="integrations-description">
              Our API integrates with 24/52 premium data sources. Additional providers require API keys for full activation.
            </p>
            
            <div className="integrations-grid">
              {integrations.map((integration, index) => (
                <div key={index} className="integration-item">
                  <div className="integration-header">
                    <span className="integration-name">{integration.name}</span>
                    <span className={`integration-status status-${integration.status}`}>
                      {integration.status === 'live' ? 'Live' : 'API Key Required'}
                    </span>
                  </div>
                  <span className="integration-category">{integration.category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="api-cta-section">
          <div className="api-docs-container">
            <div className="api-cta">
              <h2 className="cta-title">Ready to Build?</h2>
              <p className="cta-description">
                Get your API key and start building with unified trading infrastructure.
              </p>
              <div className="cta-buttons">
                <button className="cta-button primary">Get API Key</button>
                <a href="https://github.com/clawclick" target="_blank" rel="noopener noreferrer" className="cta-button secondary">
                  View GitHub
                </a>
              </div>
            </div>
            <div className="api-footer">
              <p className="footer-text">
                Open source API infrastructure by{' '}
                <a href="https://github.com/clawclick" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Claw.Click
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ApiDocs