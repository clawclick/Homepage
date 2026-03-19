import React, { useEffect } from 'react'

const ApiGrid = () => {
  const apiLogosRow1 = [
    { name: 'Dexscreener', logo: '/integrations/Dexscreener+logo.jpg', className: 'dexscreener' },
    { name: 'DeFiLlama', logo: '/integrations/653ef3f92944e7d505ca0e91_DefiLlama Logo-p-500.png', className: 'defillama' },
    { name: 'Etherscan', logo: '/integrations/etherscanlogo-freelogovectors.net_.png', className: 'etherscan' },
    { name: 'Moralis', logo: '/integrations/Blog-Moralis-Logo.png', className: 'moralis' },
    { name: 'BSC Scan', logo: '/integrations/bscscan.png', className: 'bscscan' },
    { name: 'Nansen', logo: '/integrations/nansen.png', className: 'nansen' }
  ]

  const apiLogosRow2 = [
    { name: 'Dune Analytics', logo: '/integrations/dune-1.png', className: 'dune' },
    { name: 'Polymarket', logo: '/integrations/Polymarket_Logo.jpg', className: 'polymarket' },
    { name: 'CoinGecko', logo: '/integrations/coingecko.png', className: 'coingecko' },
    { name: 'X (Twitter)', logo: '/integrations/R.png', className: 'twitter' },
    { name: 'Binance', logo: '/integrations/0_0PMnB3TBjf0r4eAt.png', className: 'binance' },
    { name: 'PancakeSwap', logo: '/integrations/OIP (2).webp', className: 'pancakeswap' }
  ]

  const apiLogosRow3 = [
    { name: 'Ethereum', logo: '/integrations/0fe184c9a32f0de4ff2c42a1921c004e2bb6004637d7821067027febf6d4f6b5.png', className: 'ethereum' },
    { name: 'Alchemy', logo: '/integrations/Alchemy_logo_black_highresolution.jpg', className: 'alchemy' },
    { name: 'Trading View', logo: '/integrations/0_dtGHiihVsdIgCHcw.png', className: 'tradingview' },
    { name: 'CoinMarketCap', logo: '/integrations/unnamed.png', className: 'coinmarketcap' },
    { name: 'Solana', logo: '/integrations/Solana-1.png', className: 'solana' },
    { name: 'Reddit', logo: '/integrations/Reddit-Logo-2017.png', className: 'reddit' }
  ]

  useEffect(() => {
    const createParticles = (element) => {
      const particles = []
      const numParticles = 25
      
      // Clear existing particles
      element.querySelectorAll('.hover-particle').forEach(p => p.remove())
      
      for (let i = 0; i < numParticles; i++) {
        const particle = document.createElement('div')
        particle.className = 'hover-particle'
        const size = Math.random() * 4 + 2 // 2-6px size variation
        const colors = ['#00ff88', '#ff6b6b', '#4f46e5', '#f0b90b', '#9945ff', '#00d4ff', '#ff9500', '#e91e63']
        particle.style.cssText = `
          position: absolute;
          width: ${size}px;
          height: ${size}px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          z-index: 10;
          left: ${Math.random() * 120 - 10}%;
          top: ${Math.random() * 120 - 10}%;
          box-shadow: 0 0 ${size * 2}px currentColor;
          animation: particleFloat ${1.5 + Math.random() * 3}s ease-in-out infinite;
          animation-delay: ${Math.random() * 1}s;
        `
        element.appendChild(particle)
        particles.push(particle)
      }
      
      return particles
    }

    const handleMouseEnter = (e) => {
      const particles = createParticles(e.currentTarget)
      particles.forEach(particle => {
        particle.style.opacity = '1'
      })
    }

    const handleMouseLeave = (e) => {
      const particles = e.currentTarget.querySelectorAll('.hover-particle')
      particles.forEach(particle => {
        particle.style.opacity = '0'
        setTimeout(() => particle.remove(), 300)
      })
    }

    const apiItems = document.querySelectorAll('.api-logo-item')
    apiItems.forEach(item => {
      item.addEventListener('mouseenter', handleMouseEnter)
      item.addEventListener('mouseleave', handleMouseLeave)
    })

    // Add particle animation keyframes to document if not exists
    if (!document.querySelector('#particleAnimation')) {
      const style = document.createElement('style')
      style.id = 'particleAnimation'
      style.textContent = `
        @keyframes particleFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.8;
          }
          20% {
            transform: translate(25px, -30px) scale(1.5) rotate(90deg);
            opacity: 1;
          }
          40% {
            transform: translate(-20px, -50px) scale(0.7) rotate(180deg);
            opacity: 0.9;
          }
          60% {
            transform: translate(35px, -25px) scale(1.3) rotate(270deg);
            opacity: 1;
          }
          80% {
            transform: translate(-15px, -40px) scale(0.9) rotate(360deg);
            opacity: 0.8;
          }
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      apiItems.forEach(item => {
        item.removeEventListener('mouseenter', handleMouseEnter)
        item.removeEventListener('mouseleave', handleMouseLeave)
        item.querySelectorAll('.hover-particle').forEach(p => p.remove())
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
        </header>
        
        <div className="api-carousel">
          <div className="api-row slide-right">
            {apiLogosRow1.map((api, index) => (
              <div key={index} className={`api-logo-item ${api.className}`}>
                <img 
                  src={api.logo} 
                  alt={api.name} 
                  className="api-logo-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="api-row slide-left">
            {apiLogosRow2.map((api, index) => (
              <div key={index} className={`api-logo-item ${api.className}`}>
                <img 
                  src={api.logo} 
                  alt={api.name} 
                  className="api-logo-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            ))}
          </div>
          
          <div className="api-row slide-right">
            {apiLogosRow3.map((api, index) => (
              <div key={index} className={`api-logo-item ${api.className}`}>
                <img 
                  src={api.logo} 
                  alt={api.name} 
                  className="api-logo-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              </div>
            ))}
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