import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AnimatedCube from './AnimatedCube'
import { fetchAgents, superApiWsUrl } from '../lib/sessionApi'

const SUPER_API_ADMIN_KEY = 'ADMIN_API_KEY'

function getChainLabel(chain) {
  if (!chain) {
    return 'multi-chain'
  }

  return String(chain).replace(/_/g, ' ')
}

function getChainBadgeClass(chain) {
  const normalized = String(chain || 'multi-chain').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `badge-chain badge-chain-${normalized}`
}

function getRiskBadgeClass(risk) {
  const normalized = String(risk || 'unrated').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `badge-risk badge-risk-${normalized}`
}

function getLatencyClass(latency) {
  if (latency <= 50) {
    return 'excellent'
  }
  if (latency <= 100) {
    return 'good'
  }
  if (latency <= 150) {
    return 'elevated'
  }
  if (latency <= 300) {
    return 'warning'
  }
  return 'critical'
}

function normalizeAgentStatsRows(payload) {
  if (!payload || typeof payload !== 'object') {
    return []
  }

  // Incremental updates after subscription.
  if (payload.type === 'agentStats') {
    return Array.isArray(payload.data) ? payload.data : [payload.data]
  }

  // Initial subscription response can carry snapshots in different shapes.
  if (payload.type === 'subscribed') {
    const snapshots = Array.isArray(payload.data?.snapshots)
      ? payload.data.snapshots
      : Array.isArray(payload.snapshots)
        ? payload.snapshots
        : []

    return snapshots.map((snapshot) => {
      const stats = snapshot?.stats && typeof snapshot.stats === 'object'
        ? snapshot.stats
        : snapshot

      return {
        ...stats,
        agentId: snapshot?.agentId ?? stats?.agentId,
      }
    })
  }

  return []
}

function createMetrics({
  scamScore = '--',
  holderRisk = 'Pending',
  volatility = 'Pending',
  macd = 'Pending',
} = {}) {
  return {
    scamScore,
    holderRisk,
    volatility,
    macd,
  }
}

function createStep({
  time,
  label,
  title,
  detail,
  status,
  decision,
  confidence,
  metrics,
  activatedChecks,
  summary,
}) {
  return {
    time,
    label,
    title,
    detail,
    status,
    decision,
    confidence,
    metrics,
    activatedChecks,
    summary,
  }
}

const demoScenarios = [
  {
    id: 'breakout-buy',
    name: 'Breakout token found',
    pair: 'BONK / SOL',
    command: 'discover --source stream --filter breakout',
    reasoning: 'A fast breakout was found on the stream, the risk gates stayed clean, and momentum confirmed a buy.',
    steps: [
      createStep({
        time: '08:42:11',
        label: 'Event',
        title: 'Token found on breakout filter',
        detail: 'BONK surfaced after a sharp volume and price expansion.',
        status: 'Watching breakout candidates',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API found a live breakout candidate and started the pipeline.',
      }),
      createStep({
        time: '08:42:12',
        label: 'Meta',
        title: 'Token context loaded',
        detail: 'Pair metadata, routes, and venue coverage were resolved.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine knows what it found and where it can trade.',
      }),
      createStep({
        time: '08:42:13',
        label: 'Scan',
        title: 'Volatility accepted',
        detail: 'The move is fast, but still inside the strategy range.',
        status: 'Volatility accepted',
        decision: 'Watching',
        confidence: '37%',
        metrics: createMetrics({ volatility: 'High' }),
        activatedChecks: ['Volatility'],
        summary: 'Momentum is real and still tradeable.',
      }),
      createStep({
        time: '08:42:14',
        label: 'Risk',
        title: 'Risk checks passed',
        detail: 'Holder concentration stayed healthy and the contract cleared safety heuristics.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '56%',
        metrics: createMetrics({ scamScore: '0.08', holderRisk: 'Low', volatility: 'High' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Nothing in the risk layer blocked the setup.',
      }),
      createStep({
        time: '08:42:15',
        label: 'TA',
        title: 'Indicators confirmed',
        detail: 'RSI reset cleanly and MACD stayed bullish into continuation.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '74%',
        metrics: createMetrics({ scamScore: '0.08', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Momentum and structure lined up behind the breakout.',
      }),
      createStep({
        time: '08:42:16',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The decision engine promoted the token into a buy.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '82%',
        metrics: createMetrics({ scamScore: '0.08', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'A fast breakout was found on the stream, the risk gates stayed clean, and momentum confirmed a buy.',
      }),
    ],
  },
  {
    id: 'weak-momentum',
    name: 'Weak momentum token',
    pair: 'JUP / SOL',
    command: 'discover --source stream --filter momentum',
    reasoning: 'The token looked clean, but the move never built enough strength to justify a trade.',
    steps: [
      createStep({
        time: '08:58:03',
        label: 'Event',
        title: 'Momentum token found',
        detail: 'JUP surfaced on the scanner after a moderate push higher.',
        status: 'Watching momentum tokens',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API found a candidate, but it still needs a lot more confirmation.',
      }),
      createStep({
        time: '08:58:04',
        label: 'Meta',
        title: 'Token context loaded',
        detail: 'Market metadata and routes were resolved successfully.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '16%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The asset is real and tradable, so the engine keeps going.',
      }),
      createStep({
        time: '08:58:05',
        label: 'Scan',
        title: 'Volatility came in muted',
        detail: 'Price expansion stayed shallow and lacked real follow-through.',
        status: 'Momentum soft',
        decision: 'Watching',
        confidence: '28%',
        metrics: createMetrics({ volatility: 'Low' }),
        activatedChecks: ['Volatility'],
        summary: 'There is movement, but not enough velocity to matter.',
      }),
      createStep({
        time: '08:58:06',
        label: 'Risk',
        title: 'Risk checks passed',
        detail: 'Holder and contract quality stayed clean.',
        status: 'Risk gate cleared',
        decision: 'Watching',
        confidence: '39%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Low' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Risk is not the issue here. Signal quality is.',
      }),
      createStep({
        time: '08:58:07',
        label: 'TA',
        title: 'Indicators stayed flat',
        detail: 'RSI stayed neutral and MACD failed to widen into momentum.',
        status: 'Indicators weak',
        decision: 'No edge',
        confidence: '35%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Low', macd: 'Flat' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The setup stayed clean, but never became strong enough.',
      }),
      createStep({
        time: '08:58:08',
        label: 'Action',
        title: 'Strategy returned NO TRADE',
        detail: 'The engine withheld capital because momentum was too weak.',
        status: 'Decision returned',
        decision: 'NO TRADE',
        confidence: '43%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Low', macd: 'Flat' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token looked clean, but the move never built enough strength to justify a trade.',
      }),
    ],
  },
  {
    id: 'scam-risk',
    name: 'Scam risk reject',
    pair: 'SHDW / ETH',
    command: 'discover --source stream --filter new-token',
    reasoning: 'The token was found fast, but the contract scan threw enough red flags to force a rejection.',
    steps: [
      createStep({
        time: '09:21:41',
        label: 'Event',
        title: 'New token found',
        detail: 'SHDW surfaced after a sudden burst in activity.',
        status: 'Watching new token alerts',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API found a hot new token and started a full review.',
      }),
      createStep({
        time: '09:21:42',
        label: 'Meta',
        title: 'Token context loaded',
        detail: 'Pair data, routes, and token metadata were resolved.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '14%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The asset resolved cleanly, so the risk layer took over.',
      }),
      createStep({
        time: '09:21:43',
        label: 'Scan',
        title: 'Volatility looked acceptable',
        detail: 'The move was active enough to keep scanning.',
        status: 'Volatility acceptable',
        decision: 'Watching',
        confidence: '26%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'Nothing in the volatility profile blocked the token yet.',
      }),
      createStep({
        time: '09:21:44',
        label: 'Risk',
        title: 'Scam checks failed',
        detail: 'Contract behavior and transfer restrictions scored far above policy.',
        status: 'Critical risk detected',
        decision: 'Unsafe',
        confidence: '81%',
        metrics: createMetrics({ scamScore: '0.84', holderRisk: 'Medium', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'The token failed the safety layer before strategy logic could matter.',
      }),
      createStep({
        time: '09:21:45',
        label: 'TA',
        title: 'Indicators skipped',
        detail: 'Momentum analysis was deprioritized once policy was tripped.',
        status: 'Policy override',
        decision: 'Unsafe',
        confidence: '88%',
        metrics: createMetrics({ scamScore: '0.84', holderRisk: 'Medium', volatility: 'Medium', macd: 'Skipped' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Once the contract failed policy, indicators stopped mattering.',
      }),
      createStep({
        time: '09:21:46',
        label: 'Action',
        title: 'Strategy returned REJECTED',
        detail: 'The engine blocked the trade on contract safety grounds.',
        status: 'Decision returned',
        decision: 'REJECTED',
        confidence: '92%',
        metrics: createMetrics({ scamScore: '0.84', holderRisk: 'Medium', volatility: 'Medium', macd: 'Skipped' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token was found fast, but the contract scan threw enough red flags to force a rejection.',
      }),
    ],
  },
  {
    id: 'pumpfun-graduation',
    name: 'Pump.fun graduation',
    pair: 'MOON / SOL',
    command: 'listen --source pumpfun --event graduation',
    reasoning: 'The token graduated from pump.fun cleanly, liquidity held up, and the engine promoted it into a buy.',
    steps: [
      createStep({
        time: '09:14:02',
        label: 'Event',
        title: 'Pump.fun graduation event received',
        detail: 'The event stream flagged MOON as newly graduated and tradable.',
        status: 'Listening to graduation events',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'A live event just told the API a fresh token graduated and is ready for analysis.',
      }),
      createStep({
        time: '09:14:03',
        label: 'Meta',
        title: 'Token metadata and routes loaded',
        detail: 'The API hydrated token metadata, tradable routes, and venue availability.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '16%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine now knows what the token is and where it can trade.',
      }),
      createStep({
        time: '09:14:04',
        label: 'Scan',
        title: 'Volatility profile accepted',
        detail: 'The post-graduation move is active but still inside the strategy risk band.',
        status: 'Volatility accepted',
        decision: 'Watching',
        confidence: '33%',
        metrics: createMetrics({ volatility: 'High' }),
        activatedChecks: ['Volatility'],
        summary: 'The move is hot, but not too wild for the strategy to continue.',
      }),
      createStep({
        time: '09:14:05',
        label: 'Risk',
        title: 'Holder and scam scans passed',
        detail: 'Holder concentration stayed healthy and the contract cleared safety heuristics.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '57%',
        metrics: createMetrics({ scamScore: '0.07', holderRisk: 'Low', volatility: 'High' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'The new graduate cleared the risky parts of the review cleanly.',
      }),
      createStep({
        time: '09:14:06',
        label: 'TA',
        title: 'Indicators confirmed continuation',
        detail: 'RSI held re-entry strength and MACD stayed constructive after graduation.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '73%',
        metrics: createMetrics({ scamScore: '0.07', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Momentum and safety lined up after the graduation event.',
      }),
      createStep({
        time: '09:14:07',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The decision engine returned a buy after the graduation workflow cleared all checks.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '82%',
        metrics: createMetrics({ scamScore: '0.07', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token graduated from pump.fun cleanly, liquidity held up, and the engine promoted it into a buy.',
      }),
    ],
  },
  {
    id: 'twitter-ticker-discovery',
    name: 'Twitter ticker discovery',
    pair: 'GIGA / SOL',
    command: 'social-scan --platform twitter --ticker GIGA',
    reasoning: 'Social attention was real, but after resolving the contract and running the scans the engine still returned no trade.',
    steps: [
      createStep({
        time: '10:22:18',
        label: 'Social',
        title: 'Ticker started clustering on Twitter',
        detail: 'The same GIGA ticker began appearing across multiple monitored accounts.',
        status: 'Watching social bursts',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API noticed the ticker spreading fast enough to deserve investigation.',
      }),
      createStep({
        time: '10:22:19',
        label: 'Search',
        title: 'Search token endpoint resolved contract',
        detail: 'The token search flow mapped the ticker to its contract and trading pair.',
        status: 'Search endpoint resolved token',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The ticker is no longer ambiguous. The engine now has the actual contract to scan.',
      }),
      createStep({
        time: '10:22:20',
        label: 'Scan',
        title: 'Volatility came in elevated',
        detail: 'Social momentum pushed price action higher, but the move stayed borderline unstable.',
        status: 'Volatility elevated',
        decision: 'Watching',
        confidence: '31%',
        metrics: createMetrics({ volatility: 'High' }),
        activatedChecks: ['Volatility'],
        summary: 'There is energy here, but social spikes can still be noisy.',
      }),
      createStep({
        time: '10:22:21',
        label: 'Risk',
        title: 'Holder and contract scans returned mixed quality',
        detail: 'Nothing was malicious, but holder quality and distribution were only average.',
        status: 'Risk mixed',
        decision: 'Borderline',
        confidence: '44%',
        metrics: createMetrics({ scamScore: '0.19', holderRisk: 'Medium', volatility: 'High' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'The contract is tradable, but the holder picture is not strong enough to inspire conviction.',
      }),
      createStep({
        time: '10:22:22',
        label: 'TA',
        title: 'Indicators failed to confirm',
        detail: 'RSI moved fast, but MACD lagged and failed to confirm durable momentum.',
        status: 'Indicators conflicted',
        decision: 'No edge',
        confidence: '41%',
        metrics: createMetrics({ scamScore: '0.19', holderRisk: 'Medium', volatility: 'High', macd: 'Mixed' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Social attention alone was not enough to create a clean entry.',
      }),
      createStep({
        time: '10:22:23',
        label: 'Action',
        title: 'Strategy returned NO TRADE',
        detail: 'The engine withheld capital after the contract search and follow-up scans.',
        status: 'Decision returned',
        decision: 'NO TRADE',
        confidence: '47%',
        metrics: createMetrics({ scamScore: '0.19', holderRisk: 'Medium', volatility: 'High', macd: 'Mixed' }),
        activatedChecks: ['Decision engine'],
        summary: 'Social attention was real, but after resolving the contract and running the scans the engine still returned no trade.',
      }),
    ],
  },
  {
    id: 'smart-money-out-sol',
    name: 'Smart money out of SOL',
    pair: 'SOL / USDC',
    command: 'flow-watch --wallet-set smart-money --asset SOL',
    reasoning: 'Smart money started rotating out of SOL, momentum weakened, and the engine converted that flow into a sell.',
    steps: [
      createStep({
        time: '13:08:11',
        label: 'Flow',
        title: 'Smart money outflow detected',
        detail: 'Tracked wallets started trimming SOL exposure across multiple venues.',
        status: 'Watching smart money exits',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API is following wallet flows to see whether the outflow is meaningful.',
      }),
      createStep({
        time: '13:08:12',
        label: 'Meta',
        title: 'Asset context hydrated',
        detail: 'Market and route metadata were loaded around the SOL trade path.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '17%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine has enough context to interpret the wallet movement.',
      }),
      createStep({
        time: '13:08:13',
        label: 'Scan',
        title: 'Volatility stayed tradeable',
        detail: 'The move accelerated, but remained inside the strategy execution envelope.',
        status: 'Volatility acceptable',
        decision: 'Watching',
        confidence: '29%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The move is actionable without becoming chaotic.',
      }),
      createStep({
        time: '13:08:14',
        label: 'Risk',
        title: 'Risk scans stayed clean',
        detail: 'No contract or holder issues interfered with the flow-based signal.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '48%',
        metrics: createMetrics({ scamScore: '0.02', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Nothing blocked the strategy from acting on the outflow.',
      }),
      createStep({
        time: '13:08:15',
        label: 'TA',
        title: 'Indicators rolled bearish',
        detail: 'RSI weakened and MACD confirmed downside continuation after the wallet exits.',
        status: 'Bearish alignment',
        decision: 'Short setup',
        confidence: '72%',
        metrics: createMetrics({ scamScore: '0.02', holderRisk: 'Low', volatility: 'Medium', macd: 'Bearish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Wallet flow and chart structure lined up to the downside.',
      }),
      createStep({
        time: '13:08:16',
        label: 'Action',
        title: 'Strategy emitted SELL',
        detail: 'The decision engine turned smart money outflow into a sell action on SOL.',
        status: 'Decision returned',
        decision: 'SELL',
        confidence: '79%',
        metrics: createMetrics({ scamScore: '0.02', holderRisk: 'Low', volatility: 'Medium', macd: 'Bearish' }),
        activatedChecks: ['Decision engine'],
        summary: 'Smart money started rotating out of SOL, momentum weakened, and the engine converted that flow into a sell.',
      }),
    ],
  },
  {
    id: 'smart-money-into-eth',
    name: 'Smart money into ETH',
    pair: 'ETH / USDC',
    command: 'flow-watch --wallet-set smart-money --asset ETH',
    reasoning: 'Smart money began accumulating ETH, the quality checks stayed clean, and the engine promoted the flow into a buy.',
    steps: [
      createStep({
        time: '15:44:31',
        label: 'Flow',
        title: 'Smart money inflow detected',
        detail: 'Tracked wallets started adding ETH exposure across the monitored venues.',
        status: 'Watching smart money accumulation',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The engine spotted coordinated wallet inflows into ETH.',
      }),
      createStep({
        time: '15:44:32',
        label: 'Meta',
        title: 'Asset metadata loaded',
        detail: 'Pair context, route availability, and execution paths were hydrated.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The API now has enough market context to score the inflow properly.',
      }),
      createStep({
        time: '15:44:33',
        label: 'Scan',
        title: 'Volatility stayed constructive',
        detail: 'Price expansion improved while remaining inside the strategy tolerance band.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '34%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The market is moving, but not in a way that looks unstable.',
      }),
      createStep({
        time: '15:44:34',
        label: 'Risk',
        title: 'Risk scans passed',
        detail: 'Holder quality and safety heuristics stayed inside policy.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '52%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Nothing in the risk model blocked the accumulation thesis.',
      }),
      createStep({
        time: '15:44:35',
        label: 'TA',
        title: 'Indicators confirmed continuation',
        detail: 'RSI improved out of consolidation and MACD confirmed upside continuation.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '74%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Wallet flow and momentum both pointed in the same direction.',
      }),
      createStep({
        time: '15:44:36',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The decision engine promoted the ETH inflow into a buy action.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '83%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'Smart money began accumulating ETH, the quality checks stayed clean, and the engine promoted the flow into a buy.',
      }),
    ],
  },
]

function getDecisionTone(decision) {
  const normalized = String(decision || '').trim().toLowerCase()

  if (normalized.includes('buy')) {
    return 'buy'
  }

  if (normalized.includes('sell')) {
    return 'sell'
  }

  if (normalized.includes('reject')) {
    return 'reject'
  }

  if (normalized.includes('no trade')) {
    return 'neutral'
  }

  return 'pending'
}

function getScenarioBootLine(scenario) {
  switch (scenario.id) {
    case 'pumpfun-graduation':
      return 'listening for new pump.fun graduates'
    case 'twitter-ticker-discovery':
      return 'watching twitter for repeated ticker mentions'
    case 'smart-money-out-sol':
      return 'tracking smart money exits on SOL'
    case 'smart-money-into-eth':
      return 'tracking smart money inflows on ETH'
    default:
      return `loading ${scenario.name.toLowerCase()}`
  }
}

function getStepBadge(step) {
  const label = String(step.label || '').toLowerCase()

  switch (label) {
    case 'event':
    case 'social':
    case 'search':
    case 'flow':
      return { text: 'FOUND', tone: 'found' }
    case 'meta':
      return { text: 'META', tone: 'meta' }
    case 'scan':
      return { text: 'SCAN', tone: 'scan' }
    case 'risk':
      return { text: 'RISK', tone: 'risk' }
    case 'ta':
      return { text: 'SIGNAL', tone: 'signal' }
    case 'action':
      return { text: 'DECISION', tone: 'decision' }
    default:
      return { text: 'LOG', tone: 'meta' }
  }
}

const CLAW_CLICK_ASCII = [
  '  /$$$$$$  /$$        /$$$$$$  /$$      /$$ /$$     /$$$$$$  /$$       /$$$$$$  /$$$$$$  /$$   /$$',
  ' /$$__  $$| $$       /$$__  $$| $$  /$ | $$|  $$   /$$__  $$| $$      |_  $$_/ /$$__  $$| $$  /$$/',
  '| $$  \\__/| $$      | $$  \\ $$| $$ /$$$| $$ \\  $$ | $$  \\__/| $$        | $$  | $$  \\__/| $$ /$$/ ',
  '| $$      | $$      | $$$$$$$$| $$/$$ $$ $$  \\  $$| $$      | $$        | $$  | $$      | $$$$$/  ',
  '| $$      | $$      | $$__  $$| $$$$_  $$$$   /$$/| $$      | $$        | $$  | $$      | $$  $$  ',
  '| $$    $$| $$      | $$  | $$| $$$/ \\  $$$  /$$/ | $$    $$| $$        | $$  | $$    $$| $$\\  $$ ',
  '|  $$$$$$/| $$$$$$$$| $$  | $$| $$/   \\  $$ /$$/  |  $$$$$$/| $$$$$$$$ /$$$$$$|  $$$$$$/| $$ \\  $$',
  ' \\______/ |________/|__/  |__/|__/     \\__/|__/    \\______/ |________/|______/ \\______/ |__/  \\__/',
  '                                                                                                      ',
  '                                                                                                      ',
  '                                                                                                      ',
]

function formatMetricsLine(metrics) {
  const items = []

  if (metrics.scamScore && metrics.scamScore !== '--') {
    items.push(`scam ${metrics.scamScore}`)
  }

  if (metrics.holderRisk && metrics.holderRisk !== 'Pending') {
    items.push(`holders ${metrics.holderRisk}`)
  }

  if (metrics.volatility && metrics.volatility !== 'Pending') {
    items.push(`volatility ${metrics.volatility}`)
  }

  if (metrics.macd && metrics.macd !== 'Pending') {
    items.push(`macd ${metrics.macd}`)
  }

  return items.length > 0
    ? items.join(' | ')
    : 'holders, scam, volatility, and indicators are still loading'
}

const ValueProp = () => {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [liveTelemetry, setLiveTelemetry] = useState({})
  const [loopDistance, setLoopDistance] = useState(0)
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [activePipelineStep, setActivePipelineStep] = useState(-1)
  const trackRef = useRef(null)
  const terminalViewportRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    fetchAgents()
      .then((data) => {
        if (isMounted) {
          setAgents(data.slice(0, 10))
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const getAgentSeed = (agent, index = 0) => {
    const raw = String(agent?.id || agent?.name || index)
    return raw.split('').reduce((total, character, characterIndex) => total + character.charCodeAt(0) * (characterIndex + 1), 0)
  }

  const getDefaultTelemetry = (agent, index = 0) => {
    const seed = getAgentSeed(agent, index)

    return {
      throughput: 700 + (seed % 401),
      latency: 70 + (seed % 21),
    }
  }

  useEffect(() => {
    if (agents.length === 0) {
      return undefined
    }

    let isMounted = true
    let socket = null

    const displayedAgentIds = agents.slice(0, 10).map((agent) => String(agent.id))
    const trackedAgentIdMap = new Map(displayedAgentIds.map((agentId) => [agentId.toLowerCase(), agentId]))
    const trackedAgentIds = new Set([...trackedAgentIdMap.keys()])

    const connect = () => {
      const streamUrl = new URL(superApiWsUrl('/ws/agentStats'))
      if (SUPER_API_ADMIN_KEY) {
        streamUrl.searchParams.set('adminKey', SUPER_API_ADMIN_KEY)
      }

      console.log('[agentStats] connecting', {
        url: streamUrl.toString(),
        agentIds: displayedAgentIds,
      })

      socket = new WebSocket(streamUrl.toString())

      socket.onopen = () => {
        if (!isMounted) {
          return
        }

        try {
          const subscriptionPayload = { agentIds: displayedAgentIds }
          console.log('[agentStats] subscribing', subscriptionPayload)
          socket.send(JSON.stringify(subscriptionPayload))
        } catch {}
      }

      socket.onmessage = (event) => {
        if (!isMounted) {
          return
        }

        try {
          console.log('[agentStats] raw response', event.data)
          const payload = JSON.parse(event.data)
          console.log('[agentStats] parsed response', payload)
          const rows = normalizeAgentStatsRows(payload)

          if (rows.length === 0) {
            console.log('[agentStats] ignoring non-agentStats payload', payload)
            return
          }

          setLiveTelemetry((current) => {
            const next = { ...current }

            rows.forEach((row) => {
              if (!row?.agentId) {
                return
              }

              const incomingAgentId = String(row.agentId).toLowerCase()
              if (!trackedAgentIds.has(incomingAgentId)) {
                return
              }

              const agentId = trackedAgentIdMap.get(incomingAgentId) || String(row.agentId)
              next[agentId] = {
                window: row.window || 'rolling_60m',
                requestsLastHour: Number(row.requestsLastHour ?? 0),
                currentMinuteRequests: Number(row.currentMinuteRequests ?? 0),
                latencyMs: Math.round(Number(row.avgResponseMsLastHour ?? 0)),
                updatedAt: row.updatedAt || new Date().toISOString(),
              }
            })

            return next
          })
        } catch {}
      }

      socket.onclose = () => {
        if (!isMounted) {
          return
        }

        console.log('[agentStats] socket closed, scheduling reconnect')
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000)
      }

      socket.onerror = (error) => {
        console.error('[agentStats] socket error', error)
        socket?.close()
      }
    }

    connect()

    return () => {
      isMounted = false
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close()
      }
    }
  }, [agents])

  useEffect(() => {
    const activeScenario = demoScenarios[activeScenarioIndex]
    const isFinalStep = activePipelineStep >= activeScenario.steps.length - 1
    const delay = isFinalStep ? 7800 : 4500

    const timeoutId = window.setTimeout(() => {
      if (isFinalStep) {
        setActiveScenarioIndex((scenarioIndex) => (scenarioIndex + 1) % demoScenarios.length)
        setActivePipelineStep(-1)
        return
      }

      setActivePipelineStep((current) => current + 1)
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeScenarioIndex, activePipelineStep])

  const getSparklinePoints = (agent, index) => {
    const seed = getAgentSeed(agent, index) * 0.0073 + index * 0.37
    const points = []

    for (let step = 0; step < 16; step += 1) {
      const x = step * 8
      const wave = Math.sin(seed + step * 0.72) * 9
      const pulse = Math.cos(seed * 0.55 + step * 0.41) * 5
      const y = Math.max(4, Math.min(34, 20 - wave - pulse))
      points.push(`${x},${y.toFixed(2)}`)
    }

    return points.join(' ')
  }

  const strategyRail = agents.length > 0 ? [...agents, ...agents] : []
  const currentScenario = demoScenarios[activeScenarioIndex]
  const visiblePipelineSteps = activePipelineStep >= 0
    ? currentScenario.steps.slice(0, activePipelineStep + 1)
    : []
  const currentPipelineState = activePipelineStep >= 0
    ? currentScenario.steps[activePipelineStep]
    : {
        status: 'Starting insight generation...',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        summary: 'Generating the first live scan output...',
      }
  const hasFinalDecision = activePipelineStep === currentScenario.steps.length - 1
  const decisionTone = getDecisionTone(currentPipelineState.decision)
  const terminalCommand = `${currentScenario.command || 'run'} --pair ${currentScenario.pair}`
  const nextStep = activePipelineStep >= 0
    ? currentScenario.steps[activePipelineStep + 1]
    : null
  const terminalLines = [
    { kind: 'separator', text: '_______________________________________________' },
    ...CLAW_CLICK_ASCII.map((line) => ({ kind: 'ascii', text: line })),
    { kind: 'separator', text: '_______________________________________________' },
    {
      kind: 'meta',
      prefix: 'boot',
      text: activePipelineStep < 0
        ? 'Starting insight generation'
        : getScenarioBootLine(currentScenario),
      detail: activePipelineStep < 0
        ? 'waiting for the first live signal to come in'
        : `scenario: ${currentScenario.name}`,
    },
    ...visiblePipelineSteps.map((step) => {
      const badge = getStepBadge(step)

      return {
        kind: 'stage',
        prefix: step.time,
        badge,
        text: step.title,
        detail: step.detail,
      }
    }),
  ]

  if (activePipelineStep >= 0) {
    terminalLines.push({
      kind: hasFinalDecision ? `decision ${decisionTone}` : 'pending',
      prefix: hasFinalDecision ? 'model' : 'queue',
      badge: hasFinalDecision
        ? {
            text: currentPipelineState.decision,
            tone: decisionTone,
          }
        : { text: 'LIVE', tone: 'pending' },
      text: hasFinalDecision
        ? `Decision returned with ${currentPipelineState.confidence} confidence`
        : `Running ${visiblePipelineSteps.length} of ${currentScenario.steps.length} checks`,
      detail: hasFinalDecision
        ? currentPipelineState.summary || currentScenario.reasoning
        : nextStep
          ? `next up: ${nextStep.title.toLowerCase()}`
          : 'waiting for the current scan to finish',
    })

    terminalLines.push({
      kind: hasFinalDecision ? 'summary' : 'metric',
      prefix: hasFinalDecision ? 'why' : 'read',
      badge: { text: hasFinalDecision ? 'WHY' : 'READ', tone: hasFinalDecision ? 'signal' : 'meta' },
      text: hasFinalDecision
        ? `Why it landed on ${currentPipelineState.decision}`
        : 'Current model read',
      detail: hasFinalDecision
        ? `${formatMetricsLine(currentPipelineState.metrics)}.`
        : `${formatMetricsLine(currentPipelineState.metrics)}. ${currentPipelineState.summary}`,
    })
  }

  useEffect(() => {
    const viewport = terminalViewportRef.current
    if (!viewport) return

    const syncScroll = () => {
      viewport.scrollTop = viewport.scrollHeight
    }

    syncScroll()
    const raf = requestAnimationFrame(syncScroll)

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [activeScenarioIndex, activePipelineStep])

  useEffect(() => {
    const trackEl = trackRef.current
    if (!trackEl) return undefined

    const updateLoopDistance = () => {
      const cards = trackEl.querySelectorAll('.strategy-preview-card')
      const half = Math.floor(cards.length / 2)
      if (cards.length < 2 || half === 0 || !cards[half]) return

      const firstStart = cards[0].offsetLeft
      const secondStart = cards[half].offsetLeft
      const measured = secondStart - firstStart
      if (measured > 0) {
        setLoopDistance(measured)
      }
    }

    updateLoopDistance()

    const raf = requestAnimationFrame(updateLoopDistance)
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateLoopDistance)
      : null

    if (resizeObserver) {
      resizeObserver.observe(trackEl)
    } else {
      window.addEventListener('resize', updateLoopDistance)
    }

    return () => {
      cancelAnimationFrame(raf)
      if (resizeObserver) {
        resizeObserver.disconnect()
      } else {
        window.removeEventListener('resize', updateLoopDistance)
      }
    }
  }, [strategyRail.length])

  return (
    <section className="valueprop">
      <div className="valueprop-inner">
        <div className="valueprop-description">
          <div className="section-header">
            <span className="section-label">What We Do</span>
            <h2 className="section-title">One API. Every data source.</h2>
          </div>
          <p className="valueprop-text">
            Our solution is a unified Trading API that aggregates over 100+ trading, analytics, social and risk data sources into a single programmable interface. Instead of managing multiple integrations, Developers and Agents interact with one standardized endpoint, removing friction of juggling API's, hitting rate limits and keeping on top of manual avenues.
          </p>
        </div>

        <div className="api-pipeline-showcase">
          <div className="api-terminal-shell">
            <div className="api-terminal-topbar">
              <div className="api-terminal-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className="api-terminal-meta">
                <span className="api-terminal-title">superapi-terminal</span>
                <span className="api-terminal-scenario">{currentScenario.name}</span>
              </div>
              <div className="api-terminal-status">
                <span>{currentScenario.pair}</span>
                <span>{currentPipelineState.status}</span>
              </div>
            </div>

            <div className="api-terminal-command-row">
              <span className="api-terminal-command-prompt">scan@superapi:~$</span>
              <span className="api-terminal-command-value">{terminalCommand}</span>
            </div>

            <div className="api-terminal-viewport" ref={terminalViewportRef} aria-label="Live terminal pipeline demo">
              {terminalLines.map((line, index) => (
                <div
                  key={`${activeScenarioIndex}-${activePipelineStep}-${index}-${line.text}`}
                  className={`api-terminal-line api-terminal-line-${line.kind.replace(/\s+/g, '-')}`}
                >
                  <span className="api-terminal-line-prefix">
                    {line.prefix || ''}
                  </span>
                  {line.badge ? (
                    <span className={`api-terminal-line-badge api-terminal-line-badge-${line.badge.tone}`}>
                      [{line.badge.text}]
                    </span>
                  ) : (
                    <span className="api-terminal-line-badge api-terminal-line-badge-placeholder" aria-hidden="true" />
                  )}
                  <span className="api-terminal-line-text">
                    <span className="api-terminal-line-main">{line.text}</span>
                    {line.detail ? (
                      <span className="api-terminal-line-detail">{line.detail}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="strategy-wrappers-block">
          <div className="section-header">
            <span className="section-label">Strategy Wrappers</span>
            <h2 className="section-title">Package. Share. Earn.</h2>
          </div>
          <AnimatedCube />
          <p className="valueprop-text">
            Strategies can be packaged as parameterized API endpoints, allowing bots or applications to call trading logic directly while the underlying strategy remains private, allowing for a novel architecture for copy trading capital and allowing strategy creators to earn revenue while not risking capital — all verified by the Click Oracle for data validation in real time.
          </p>
          <button className="btn-primary">Create Wrapper</button>

          <div className="strategy-wrappers-showcase">
            <div className="strategy-preview-carousel">
              <div
                className="strategy-preview-track"
                ref={trackRef}
                style={loopDistance > 0 ? { '--sp-loop-distance': `${loopDistance}px` } : undefined}
              >
                {strategyRail.map((agent, index) => {
                  const live = liveTelemetry[String(agent.id)]
                  const defaults = getDefaultTelemetry(agent, index)
                  const liveThroughput = Number(live?.requestsLastHour ?? 0)
                  const liveLatency = Number(live?.latencyMs ?? 0)
                  const hasLiveThroughput = liveThroughput > 0
                  const hasLiveLatency = liveLatency > 0
                  const telemetry = {
                    throughput: hasLiveThroughput ? liveThroughput : defaults.throughput,
                    latency: hasLiveLatency ? liveLatency : defaults.latency,
                  }
                  const sparklinePoints = getSparklinePoints(agent, index)
                  const latencyClass = getLatencyClass(telemetry.latency)
                  const volumeValue = 120000 + ((Number(agent.id) || 1) * 17300) + (index * 2900)
                  const normalizedAgentName = String(agent.name || '').trim().toLowerCase()
                  const winRatePresets = [58.2, 63.7, 55.9, 61.1, 66.3, 59.8]
                  let winRateDisplay = `${winRatePresets[index % winRatePresets.length].toFixed(1)}%`
                  const isCustomAgent = normalizedAgentName.includes('custom')
                  let isInfiniteWinRate = false

                  if (normalizedAgentName.includes('candle surfer') || normalizedAgentName.includes('candel surfer')) {
                    winRateDisplay = '61.4%'
                  } else if (isCustomAgent) {
                    winRateDisplay = '∞'
                    isInfiniteWinRate = true
                  }

                  return (
                    <div key={`${agent.id}-${index}`} className="strategy-preview-card">
                      <div className="spc-header">
                        <h3 className="spc-name">{agent.name}</h3>
                        <p className="spc-type" title={agent.description || 'No backend description provided for this agent yet.'}>
                          {agent.description || 'No backend description provided for this agent yet.'}
                        </p>
                      </div>

                      <div className="spc-live-strip" aria-label="Live telemetry">
                        <div className="spc-throughput">
                          <span className="spc-live-dot" />
                          <span className="spc-live-label">req/h</span>
                          <strong>{telemetry.throughput.toLocaleString()}</strong>
                        </div>
                        <span className={`spc-latency spc-latency-${latencyClass}`}>
                          {telemetry.latency}ms
                        </span>
                      </div>

                      <div className="spc-sparkline-wrap" aria-hidden="true">
                        <svg className="spc-sparkline" viewBox="0 0 120 38" preserveAspectRatio="none">
                          <polyline className="spc-sparkline-line" points={sparklinePoints} />
                        </svg>
                      </div>

                      <div className="spc-card-section">
                        <div className="spc-metrics">
                          <div className="spc-metric">
                            <span className="spc-metric-label">Agent ID</span>
                            <span className="spc-metric-value">#{agent.id}</span>
                          </div>
                          <div className="spc-metric spc-metric-centered">
                            <span className="spc-metric-label">Type</span>
                            <span className="spc-metric-value spc-blue" title={agent.type || 'Unknown'}>{agent.type || 'Unknown'}</span>
                          </div>
                          <div className="spc-metric">
                            <span className="spc-metric-label">Volume</span>
                            <span className="spc-metric-value">${volumeValue.toLocaleString()}</span>
                          </div>
                          <div className="spc-metric spc-metric-centered">
                            <span className="spc-metric-label">Win rate</span>
                            <span className={`spc-metric-value spc-blue${isInfiniteWinRate ? ' spc-metric-value-infinity' : ''}`}>{winRateDisplay}</span>
                          </div>
                        </div>
                      </div>

                      <div className="spc-card-section spc-card-section-footer">
                        <div className="spc-badges">
                          <span className={`spc-badge ${getChainBadgeClass(agent.chains?.[0])}`}>
                            {getChainLabel(agent.chains?.[0])}
                          </span>
                          <span className={`spc-badge ${getRiskBadgeClass(agent.risk)}`}>
                            {agent.risk || 'unrated'}
                          </span>
                        </div>
                      </div>

                      <div className="spc-actions">
                        <button className="btn-primary spc-btn" onClick={() => navigate(`/deploy?agent=${agent.id}`)}>Deploy</button>
                        <button className="btn-secondary spc-btn" onClick={() => navigate(`/agents/${encodeURIComponent(agent.id)}/analytics`)}>Details</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ValueProp
