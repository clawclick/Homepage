import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import './styles/api-docs.css'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AppMarketplace from './pages/AppMarketplace'
import ApiDocs from './pages/ApiDocs'
import ApiUsage from './pages/ApiUsage'
import FeatureDetail from './pages/FeatureDetail'
import DeploySession from './pages/DeploySession'
import MySessions from './pages/MySessions'
import SessionTerminal from './pages/SessionTerminal'
import AgentAnalytics from './pages/AgentAnalytics'
import AgentSkillView from './pages/AgentSkillView'

function AppShell() {
  const location = useLocation()
  const hideChrome = location.pathname.startsWith('/deploy') || location.pathname.startsWith('/session/')

  return (
    <div className="app">
      {!hideChrome && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app" element={<AppMarketplace />} />
          <Route path="/api" element={<ApiDocs />} />
          <Route path="/api/my-api" element={<ApiUsage />} />
          <Route path="/api/keys" element={<ApiUsage />} />
          <Route path="/api/usage" element={<ApiUsage />} />
          <Route path="/features/:slug" element={<FeatureDetail />} />
          <Route path="/sessions" element={<MySessions />} />
          <Route path="/deploy" element={<DeploySession />} />
          <Route path="/agents/:id/analytics" element={<AgentAnalytics />} />
          <Route path="/agents/:id/skill" element={<AgentSkillView />} />
          <Route path="/session/:id" element={<SessionTerminal />} />
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  )
}

function App() {
  return <AppShell />
}

export default App
