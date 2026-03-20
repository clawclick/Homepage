import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-brand-top">
            <img src="/logo.png" alt="Claw.Click" />
            <span>Claw.Click</span>
          </div>
          <p>The Universal Router For Agents And Developers</p>
        </div>

        <div className="footer-links-group">
          <div className="footer-col">
            <h4>Products</h4>
            <Link to="/api">API</Link>
            <Link to="/app">App</Link>
          </div>
          <div className="footer-col">
            <h4>Community</h4>
            <a href="https://x.com/clawclick" target="_blank" rel="noopener noreferrer">Twitter / X</a>
            <a href="https://discord.gg/clawclick" target="_blank" rel="noopener noreferrer">Discord</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Claw.Click. All rights reserved.</p>
        <div className="footer-socials">
          <a href="https://x.com/clawclick" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
          <a href="https://discord.gg/clawclick" target="_blank" rel="noopener noreferrer" aria-label="Discord">DC</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
