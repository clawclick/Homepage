import React, { useEffect } from 'react'

const ApiGrid = () => {
  const apiLogos = [
    { name: 'Dexscreener', logo: '/integrations/Dexscreener+logo.jpg', className: 'dexscreener' },
    { name: 'DeFiLlama', logo: '/integrations/653ef3f92944e7d505ca0e91_DefiLlama Logo-p-500.png', className: 'defillama' },
    { name: 'Etherscan', logo: '/integrations/etherscanlogo-freelogovectors.net_.png', className: 'etherscan' },
    { name: 'Moralis', logo: '/integrations/Blog-Moralis-Logo.png', className: 'moralis' },
    { name: 'BSC Scan', logo: '/integrations/bscscan.png', className: 'bscscan' },
    { name: 'Nansen', logo: '/integrations/nansen.png', className: 'nansen' },
    { name: 'Dune Analytics', logo: '/integrations/dune-1.png', className: 'dune' },
    { name: 'Polymarket', logo: '/integrations/Polymarket_Logo.jpg', className: 'polymarket' },
    { name: 'CoinGecko', logo: '/integrations/coingecko.png', className: 'coingecko' },
    { name: 'X (Twitter)', logo: '/integrations/R.png', className: 'twitter' },
    { name: 'Binance', logo: '/integrations/0_0PMnB3TBjf0r4eAt.png', className: 'binance' },
    { name: 'PancakeSwap', logo: '/integrations/OIP (2).webp', className: 'pancakeswap' },
    { name: 'Ethereum', logo: '/integrations/0fe184c9a32f0de4ff2c42a1921c004e2bb6004637d7821067027febf6d4f6b5.png', className: 'ethereum' },
    { name: 'Alchemy', logo: '/integrations/Alchemy_logo_black_highresolution.jpg', className: 'alchemy' },
    { name: 'Trading View', logo: '/integrations/0_dtGHiihVsdIgCHcw.png', className: 'tradingview' },
    { name: 'CoinMarketCap', logo: '/integrations/unnamed.png', className: 'coinmarketcap' },
    { name: 'Solana', logo: '/integrations/Solana-1.png', className: 'solana' },
    { name: 'Reddit', logo: '/integrations/Reddit-Logo-2017.png', className: 'reddit' }
  ]

  // Randomize order and assign random sizes
  const randomizedApis = apiLogos
    .sort(() => Math.random() - 0.5)
    .map((api, index) => {
      const sizes = ['small', 'medium', 'large']
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)]
      return { ...api, size: randomSize }
    })

  useEffect(() => {
    const handleMouseEnter = (event) => {
      const item = event.currentTarget
      
      // Create hover particles
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div')
        particle.className = 'hover-particle'
        particle.style.cssText = `
          position: absolute;
          width: 4px;
          height: 4px;
          background: #3b82f6;
          border-radius: 50%;
          pointer-events: none;
          animation: particleFloat 2s ease-out forwards;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation-delay: ${Math.random() * 0.5}s;
        `
        item.appendChild(particle)
        
        setTimeout(() => particle.remove(), 2500)
      }
    }

    const apiItems = document.querySelectorAll('.api-logo-item')
    apiItems.forEach(item => {
      item.addEventListener('mouseenter', handleMouseEnter)
    })

    // Add particle animation keyframes
    if (!document.querySelector('#particleAnimation')) {
      const style = document.createElement('style')
      style.id = 'particleAnimation'
      style.textContent = `
        @keyframes particleFloat {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0);
            opacity: 0;
          }
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      apiItems.forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter)
      })
    }
  }, [])

  return (
    <section className="api-grid-section">
      <div className="api-grid-container">
        <header className="api-grid-header">
          <h2 className="api-grid-heading">Trusted by Industry Leaders</h2>
          <p className="api-grid-subtitle">
            Integrated with 50+ premium data sources and major blockchain infrastructure providers
          </p>
        </header>
        
        <div className="api-static-grid">
          {randomizedApis.map((api, index) => (
            <div key={index} className={`api-logo-item ${api.size}`}>
              <img 
                src={api.logo} 
                alt={api.name} 
                className="api-logo-image"
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
              <div className="api-logo-overlay">
                <span className="api-logo-name">{api.name}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="integration-stats">
          <div className="integration-stat">
            <span className="integration-number">24</span>
            <span className="integration-label">Live Now</span>
          </div>
          <div className="integration-stat">
            <span className="integration-number">28</span>
            <span className="integration-label">Coming Soon</span>
          </div>
          <div className="integration-stat">
            <span className="integration-number">99.9%</span>
            <span className="integration-label">Uptime</span>
          </div>
        </div>
        
        <div className="api-cta">
          <h3 className="api-cta-title">Ready to Build?</h3>
          <p className="api-cta-text">
            Join developers building the future of trading infrastructure
          </p>
          <div className="api-cta-buttons">
            <a href="/api" className="api-cta-button primary">
              Get API Access
            </a>
            <a href="https://github.com/clawclick" target="_blank" rel="noopener noreferrer" className="api-cta-button secondary">
              View on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ApiGrid