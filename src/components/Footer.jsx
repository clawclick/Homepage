import React from 'react'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-logo">
            <img src="/logo.png" alt="Claw.Click" className="footer-logo-image" />
            <p className="footer-tagline">The Universal Router For Agents And Developers</p>
          </div>
          
          <div className="footer-products">
            <h3 className="footer-heading">Products</h3>
            <div className="footer-links">
              <a href="https://www.claw.click/api" className="footer-link">API</a>
              <a href="https://www.claw.click/app" className="footer-link">APP</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="copyright">© 2026 Claw.Click. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer