import React from 'react'
import Hero from '../components/Hero'
import ValueProp from '../components/ValueProp'
import Features from '../components/Features'
import CodeShowcase from '../components/CodeShowcase'
import IntegrationCarousel from '../components/IntegrationCarousel'
import CTA from '../components/CTA'

const HomePage = () => {
  return (
    <>
      <Hero />
      <ValueProp />
      <Features />
      <CodeShowcase />
      <IntegrationCarousel />
      <CTA />
    </>
  )
}

export default HomePage
