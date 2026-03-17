import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './components/HomePage'
import ApiDocs from './pages/ApiDocs'
import AppMarketplace from './pages/AppMarketplace'
import './pages.css'

function AppContent() {
  const location = useLocation()

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/api" element={<ApiDocs />} />
        <Route path="/app" element={<AppMarketplace />} />
      </Routes>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App