import React from 'react'
import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header className="header">
      <Link to="/" className="header-logo">
        <img src="/logo.png" alt="Claw.Click" />
        <span>Claw.Click</span>
      </Link>
      <nav className="header-nav">
        <Link to="/api">API</Link>
        <Link to="/app" className="nav-cta">Launch App →</Link>
      </nav>
    </header>
  )
}

export default Header
