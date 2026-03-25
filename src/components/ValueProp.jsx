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
    reasoning: 'The token resolved cleanly, but market context stayed too soft to justify a trade.',
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
        label: 'Market',
        title: 'Market context stayed too soft',
        detail: 'Recent price history and breadth never expanded into a real momentum move.',
        status: 'Market soft',
        decision: 'No edge',
        confidence: '31%',
        metrics: createMetrics({ volatility: 'Low' }),
        activatedChecks: ['Market overview', 'Price history'],
        summary: 'The market context stayed too quiet to justify deeper signal work.',
      }),
      createStep({
        time: '08:58:06',
        label: 'Action',
        title: 'Strategy returned NO TRADE',
        detail: 'The engine withheld capital because the market never developed a real edge.',
        status: 'Decision returned',
        decision: 'NO TRADE',
        confidence: '44%',
        metrics: createMetrics({ volatility: 'Low' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token resolved cleanly, but market context stayed too soft to justify a trade.',
      }),
    ],
  },
  {
    id: 'scam-risk',
    name: 'Scam risk reject',
    pair: 'SHDW / ETH',
    command: 'discover --source stream --filter new-token',
    reasoning: 'The token was found fast, but the audit layer threw enough red flags to reject it immediately.',
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
        label: 'Audit',
        title: 'Full audit flagged critical contract risk',
        detail: 'Transfer restrictions and policy checks failed hard enough to stop the pipeline immediately.',
        status: 'Critical risk detected',
        decision: 'Unsafe',
        confidence: '86%',
        metrics: createMetrics({ scamScore: '0.84', holderRisk: 'Medium' }),
        activatedChecks: ['Full audit', 'Scam scan'],
        summary: 'The token failed the safety layer before strategy logic could matter.',
      }),
      createStep({
        time: '09:21:44',
        label: 'Action',
        title: 'Strategy returned REJECTED',
        detail: 'The engine blocked the trade on contract safety grounds.',
        status: 'Decision returned',
        decision: 'REJECTED',
        confidence: '92%',
        metrics: createMetrics({ scamScore: '0.84', holderRisk: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token was found fast, but the audit layer threw enough red flags to reject it immediately.',
      }),
    ],
  },
  {
    id: 'pumpfun-graduation',
    name: 'Launchpad completion buy',
    pair: 'MOON / SOL',
    command: 'listen --source pumpfun --event completed',
    reasoning: 'The token completed its launchpad curve cleanly, liquidity held up, and the engine promoted it into a buy.',
    steps: [
      createStep({
        time: '09:14:02',
        label: 'Event',
        title: 'Launchpad completion event received',
        detail: 'The event stream flagged MOON as completed and ready for post-curve review.',
        status: 'Listening to completion events',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'A live event just told the API a launchpad token completed and is ready for analysis.',
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
        detail: 'The post-completion move is active but still inside the strategy risk band.',
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
        detail: 'RSI held re-entry strength and MACD stayed constructive after completion.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '73%',
        metrics: createMetrics({ scamScore: '0.07', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Momentum and safety lined up after the completion event.',
      }),
      createStep({
        time: '09:14:07',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The decision engine returned a buy after the completion workflow cleared all checks.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '82%',
        metrics: createMetrics({ scamScore: '0.07', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token completed its launchpad curve cleanly, liquidity held up, and the engine promoted it into a buy.',
      }),
    ],
  },
  {
    id: 'twitter-ticker-discovery',
    name: 'Twitter ticker discovery',
    pair: 'GIGA / SOL',
    command: 'social-scan --platform twitter --resolve-contracts',
    reasoning: 'Social attention was real, but after resolving the contract and checking source strength plus holder quality, the engine still returned no trade.',
    steps: [
      createStep({
        time: '10:22:18',
        label: 'Social',
        title: 'Ticker started clustering on Twitter',
        detail: 'The same ticker began appearing across multiple monitored accounts.',
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
        label: 'Sentiment',
        title: 'Source strength came in mixed',
        detail: 'Like velocity was real, but the surrounding accounts were too noisy to build conviction.',
        status: 'Sentiment mixed',
        decision: 'Watching',
        confidence: '31%',
        metrics: createMetrics(),
        activatedChecks: ['Like check', 'Follower check'],
        summary: 'Social attention existed, but source quality stayed mixed.',
      }),
      createStep({
        time: '10:22:21',
        label: 'Risk',
        title: 'Holder and chatter checks stayed mixed',
        detail: 'Nothing failed outright, but holder quality and surrounding chatter were not strong enough to keep pushing.',
        status: 'Edge not clean enough',
        decision: 'No edge',
        confidence: '44%',
        metrics: createMetrics({ scamScore: '0.19', holderRisk: 'Medium' }),
        activatedChecks: ['Holder scan', 'FUD search'],
        summary: 'The contract was tradable, but the social edge never became clean enough.',
      }),
      createStep({
        time: '10:22:22',
        label: 'Action',
        title: 'Strategy returned NO TRADE',
        detail: 'The engine withheld capital after the contract search, sentiment check, and holder review.',
        status: 'Decision returned',
        decision: 'NO TRADE',
        confidence: '47%',
        metrics: createMetrics({ scamScore: '0.19', holderRisk: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'Social attention was real, but after resolving the contract and checking source strength plus holder quality, the engine still returned no trade.',
      }),
    ],
  },
  {
    id: 'smart-money-out-sol',
    name: 'Smart money out of SOL',
    pair: 'SOL / USDC',
    command: 'flow-watch --wallet-set smart-money --monitor-rotation',
    reasoning: 'Smart money started rotating out of SOL, the wallet cluster weakened, and market context confirmed the sell.',
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
        label: 'Wallets',
        title: 'Related wallets and PnL turned bearish',
        detail: 'The cluster behind the outflow showed distribution behavior and declining trade quality.',
        status: 'Wallet quality turning lower',
        decision: 'Watching',
        confidence: '32%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Wallet cluster', 'PnL'],
        summary: 'The outflow looked coordinated rather than random.',
      }),
      createStep({
        time: '13:08:14',
        label: 'Market',
        title: 'Market context confirmed the rotation',
        detail: 'Broader market structure backed the outflow across the SOL trade path.',
        status: 'Rotation confirmed',
        decision: 'Short setup',
        confidence: '69%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Market overview', 'Wallet review'],
        summary: 'Wallet behavior and broader market context lined up to the downside.',
      }),
      createStep({
        time: '13:08:15',
        label: 'Action',
        title: 'Strategy emitted SELL',
        detail: 'The decision engine turned smart money outflow into a sell action on SOL.',
        status: 'Decision returned',
        decision: 'SELL',
        confidence: '79%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'Smart money started rotating out of SOL, the wallet cluster weakened, and market context confirmed the sell.',
      }),
    ],
  },
  {
    id: 'smart-money-into-eth',
    name: 'Smart money into ETH',
    pair: 'ETH / USDC',
    command: 'flow-watch --wallet-set smart-money --monitor-rotation',
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
  {
    id: 'volume-exhaustion-sell',
    name: 'Breakout exhaustion sell',
    pair: 'WIF / SOL',
    command: 'discover --source stream --filter breakout',
    reasoning: 'The breakout looked real at first, but the move exhausted quickly and the engine flipped into a sell.',
    steps: [
      createStep({
        time: '08:49:11',
        label: 'Event',
        title: 'Breakout token hit the scanner',
        detail: 'WIF surfaced after a fast expansion in price and volume.',
        status: 'Watching breakout candidates',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API found a fast breakout and opened the review pipeline.',
      }),
      createStep({
        time: '08:49:12',
        label: 'Meta',
        title: 'Token context loaded',
        detail: 'Pair data, liquidity routes, and venue coverage resolved cleanly.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '17%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine has enough context to score the breakout properly.',
      }),
      createStep({
        time: '08:49:13',
        label: 'Scan',
        title: 'Volatility stretched higher',
        detail: 'The move accelerated beyond the normal breakout comfort zone.',
        status: 'Volatility stretched',
        decision: 'Watching',
        confidence: '33%',
        metrics: createMetrics({ volatility: 'High' }),
        activatedChecks: ['Volatility'],
        summary: 'Momentum stayed fast, but the extension started to look unstable.',
      }),
      createStep({
        time: '08:49:14',
        label: 'Risk',
        title: 'Risk checks still passed',
        detail: 'The contract stayed clean and holder concentration remained acceptable.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '48%',
        metrics: createMetrics({ scamScore: '0.04', holderRisk: 'Low', volatility: 'High' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Risk stayed clean, so the engine kept leaning on signal quality.',
      }),
      createStep({
        time: '08:49:15',
        label: 'TA',
        title: 'Indicators rolled over',
        detail: 'RSI diverged and MACD crossed lower as the breakout stalled.',
        status: 'Momentum faded',
        decision: 'Exit setup',
        confidence: '71%',
        metrics: createMetrics({ scamScore: '0.04', holderRisk: 'Low', volatility: 'High', macd: 'Bearish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The move lost momentum quickly and started to unwind.',
      }),
      createStep({
        time: '08:49:16',
        label: 'Action',
        title: 'Strategy emitted SELL',
        detail: 'The engine switched from breakout watch to a sell on exhaustion.',
        status: 'Decision returned',
        decision: 'SELL',
        confidence: '78%',
        metrics: createMetrics({ scamScore: '0.04', holderRisk: 'Low', volatility: 'High', macd: 'Bearish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The breakout looked real at first, but the move exhausted quickly and the engine flipped into a sell.',
      }),
    ],
  },
  {
    id: 'liquidity-reclaim-buy',
    name: 'Liquidity reclaim buy',
    pair: 'MYRO / SOL',
    command: 'discover --source stream --filter reclaim',
    reasoning: 'The scanner found a clean liquidity reclaim, broader market support held up, and entry scoring promoted it into a buy.',
    steps: [
      createStep({
        time: '08:53:11',
        label: 'Event',
        title: 'Reclaim candidate found on stream',
        detail: 'MYRO surfaced after reclaiming a prior breakdown level on strong flow.',
        status: 'Watching reclaim candidates',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The stream found a reclaim setup with enough activity to open the pipeline.',
      }),
      createStep({
        time: '08:53:12',
        label: 'Liquidity',
        title: 'Pool depth held through reclaim',
        detail: 'Pool info showed stable depth and enough route coverage to stay tradeable after the reclaim.',
        status: 'Liquidity confirmed',
        decision: 'Scanning',
        confidence: '26%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Pool info', 'Routes'],
        summary: 'The reclaim still had enough depth behind it to remain actionable.',
      }),
      createStep({
        time: '08:53:13',
        label: 'Market',
        title: 'Top trader flow supported the reclaim',
        detail: 'Broader market context and top trader activity stayed constructive instead of fading immediately.',
        status: 'Market supportive',
        decision: 'Qualified',
        confidence: '52%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Market overview', 'Top traders'],
        summary: 'The reclaim kept attracting constructive market participation.',
      }),
      createStep({
        time: '08:53:14',
        label: 'TA',
        title: 'Entry scoring confirmed the reclaim',
        detail: 'Entry scoring and structure both lined up behind the move.',
        status: 'Entry aligned',
        decision: 'Prime setup',
        confidence: '75%',
        metrics: createMetrics({ volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Entry scoring', 'Indicators'],
        summary: 'The reclaim stayed constructive once the entry model weighed in.',
      }),
      createStep({
        time: '08:53:15',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the reclaim setup into a buy action.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '83%',
        metrics: createMetrics({ volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The scanner found a clean liquidity reclaim, broader market support held up, and entry scoring promoted it into a buy.',
      }),
    ],
  },
  {
    id: 'trend-reversal-buy',
    name: 'Trend reversal buy',
    pair: 'CLOUD / SOL',
    command: 'discover --source stream --filter reversal',
    reasoning: 'A live reversal candidate built enough confirmation across volatility, risk, and indicators for the engine to issue a buy.',
    steps: [
      createStep({
        time: '09:02:27',
        label: 'Event',
        title: 'Reversal token found on stream',
        detail: 'CLOUD hit the scanner after reclaiming trend and printing a stronger bid.',
        status: 'Watching reversal candidates',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The stream found a reversal candidate with enough strength to investigate.',
      }),
      createStep({
        time: '09:02:28',
        label: 'Meta',
        title: 'Token context loaded',
        detail: 'Token metadata, routes, and pool coverage resolved cleanly.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine has full context on the reversal candidate.',
      }),
      createStep({
        time: '09:02:29',
        label: 'Scan',
        title: 'Volatility stayed constructive',
        detail: 'The move expanded enough to matter while remaining inside the strategy band.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '35%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The reversal is moving with enough force without becoming unstable.',
      }),
      createStep({
        time: '09:02:30',
        label: 'Risk',
        title: 'Risk scans passed',
        detail: 'Holder concentration stayed healthy and the contract cleared safety heuristics.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '55%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'The quality layer stayed clear, so the reversal remained actionable.',
      }),
      createStep({
        time: '09:02:31',
        label: 'TA',
        title: 'Indicators confirmed continuation',
        detail: 'RSI recovered cleanly and MACD widened into bullish follow-through.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '76%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The reversal kept improving as the signal layer confirmed continuation.',
      }),
      createStep({
        time: '09:02:32',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The decision engine upgraded the reversal into a buy.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '84%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'A live reversal candidate built enough confirmation across volatility, risk, and indicators for the engine to issue a buy.',
      }),
    ],
  },
  {
    id: 'pumpfun-no-trade',
    name: 'Launchpad created no trade',
    pair: 'SPRK / SOL',
    command: 'listen --source pumpfun --event created',
    reasoning: 'A fresh launchpad create event looked interesting, but the early move never built enough conviction to trade.',
    steps: [
      createStep({
        time: '09:31:07',
        label: 'Event',
        title: 'Launchpad created event received',
        detail: 'SPRK appeared on the event stream as a fresh launchpad create event.',
        status: 'Listening to creation events',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'A newly created launchpad token hit the pipeline and qualified for review.',
      }),
      createStep({
        time: '09:31:08',
        label: 'Meta',
        title: 'Token context hydrated',
        detail: 'The API resolved pool metadata, routes, and tradable venues.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '15%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine knows where the graduate can trade and how to score it.',
      }),
      createStep({
        time: '09:31:09',
        label: 'Scan',
        title: 'Volatility came in light',
        detail: 'The early launchpad move stayed active but never accelerated.',
        status: 'Momentum soft',
        decision: 'Watching',
        confidence: '29%',
        metrics: createMetrics({ volatility: 'Low' }),
        activatedChecks: ['Volatility'],
        summary: 'There was movement, but not enough force behind it.',
      }),
      createStep({
        time: '09:31:10',
        label: 'Risk',
        title: 'Risk checks passed',
        detail: 'Holder distribution and contract safety remained acceptable.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '43%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Low' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Risk stayed clean, so the decision came down to signal quality.',
      }),
      createStep({
        time: '09:31:11',
        label: 'TA',
        title: 'Indicators stayed neutral',
        detail: 'RSI flattened out and MACD failed to widen into a real trend.',
        status: 'Indicators weak',
        decision: 'No edge',
        confidence: '40%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Low', macd: 'Flat' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The fresh launch looked safe, but the move never developed a tradeable edge.',
      }),
      createStep({
        time: '09:31:12',
        label: 'Action',
        title: 'Strategy returned NO TRADE',
        detail: 'The engine passed on the created token because the follow-through stayed weak.',
        status: 'Decision returned',
        decision: 'NO TRADE',
        confidence: '46%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Low', macd: 'Flat' }),
        activatedChecks: ['Decision engine'],
        summary: 'A fresh launchpad create event looked interesting, but the early move never built enough conviction to trade.',
      }),
    ],
  },
  {
    id: 'pumpfun-risk-reject',
    name: 'Launchpad created reject',
    pair: 'RUGX / SOL',
    command: 'listen --source pumpfun --event created',
    reasoning: 'The launchpad create event was real, but the audit layer blocked the token before any deeper strategy work mattered.',
    steps: [
      createStep({
        time: '09:36:22',
        label: 'Event',
        title: 'Launchpad created event received',
        detail: 'RUGX came through the listener as a newly created launchpad token.',
        status: 'Listening to creation events',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API found a fresh launchpad create event and started a full risk review.',
      }),
      createStep({
        time: '09:36:23',
        label: 'Meta',
        title: 'Token metadata resolved',
        detail: 'Pool data, routes, and market context loaded correctly.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '16%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The asset resolved, so the safety layer took over.',
      }),
      createStep({
        time: '09:36:24',
        label: 'Audit',
        title: 'Audit layer blocked the new launch',
        detail: 'Holder concentration and contract permissions triggered a hard stop immediately after hydration.',
        status: 'Critical risk detected',
        decision: 'Unsafe',
        confidence: '84%',
        metrics: createMetrics({ scamScore: '0.79', holderRisk: 'High' }),
        activatedChecks: ['Full audit', 'Scam scan'],
        summary: 'The fresh launch failed the safety layer before the strategy logic mattered.',
      }),
      createStep({
        time: '09:36:25',
        label: 'Action',
        title: 'Strategy returned REJECTED',
        detail: 'The engine blocked the created token on safety grounds.',
        status: 'Decision returned',
        decision: 'REJECTED',
        confidence: '93%',
        metrics: createMetrics({ scamScore: '0.79', holderRisk: 'High' }),
        activatedChecks: ['Decision engine'],
        summary: 'The launchpad create event was real, but the audit layer blocked the token before any deeper strategy work mattered.',
      }),
    ],
  },
  {
    id: 'pumpfun-exit-sell',
    name: 'Launchpad migration sell',
    pair: 'FLASH / SOL',
    command: 'listen --source pumpfun --event migrated',
    reasoning: 'The token migrated out of the launchpad curve into open liquidity, then rolled over fast enough for the engine to emit a sell.',
    steps: [
      createStep({
        time: '09:42:40',
        label: 'Event',
        title: 'Launchpad migration event received',
        detail: 'FLASH hit the feed as a fresh migration event with active open-market routing.',
        status: 'Watching migration events',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'A freshly migrated launchpad token entered the flow and triggered a continuation check.',
      }),
      createStep({
        time: '09:42:41',
        label: 'Meta',
        title: 'Token context hydrated',
        detail: 'Tradable venues, route paths, and pool coverage were resolved.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine had enough context to read the graduate in real time.',
      }),
      createStep({
        time: '09:42:42',
        label: 'Scan',
        title: 'Volatility surged higher',
        detail: 'The post-migration move expanded quickly and started to look overextended.',
        status: 'Volatility stretched',
        decision: 'Watching',
        confidence: '36%',
        metrics: createMetrics({ volatility: 'High' }),
        activatedChecks: ['Volatility'],
        summary: 'The migrated token opened hot, but the stretch started to look unstable.',
      }),
      createStep({
        time: '09:42:43',
        label: 'Risk',
        title: 'Risk checks passed',
        detail: 'The contract stayed clean and holder concentration remained acceptable.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '51%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'High' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Risk stayed clear, so the engine leaned harder on momentum.',
      }),
      createStep({
        time: '09:42:44',
        label: 'TA',
        title: 'Indicators flipped bearish',
        detail: 'RSI diverged down and MACD rolled over after the first expansion leg.',
        status: 'Bearish reversal',
        decision: 'Exit setup',
        confidence: '73%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'High', macd: 'Bearish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The initial strength faded quickly and resolved into a reversal.',
      }),
      createStep({
        time: '09:42:45',
        label: 'Action',
        title: 'Strategy emitted SELL',
        detail: 'The engine turned the failed post-migration continuation into a sell.',
        status: 'Decision returned',
        decision: 'SELL',
        confidence: '80%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'High', macd: 'Bearish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token migrated out of the launchpad curve into open liquidity, then rolled over fast enough for the engine to emit a sell.',
      }),
    ],
  },
  {
    id: 'pumpfun-breakout-buy',
    name: 'Launchpad completion breakout buy',
    pair: 'SURF / SOL',
    command: 'listen --source pumpfun --event completed',
    reasoning: 'The completion event held its first pullback, quality checks stayed clean, and the engine promoted the post-launch strength into a buy.',
    steps: [
      createStep({
        time: '09:47:18',
        label: 'Event',
        title: 'Launchpad completion event received',
        detail: 'SURF appeared on the live completion feed with active routing ready.',
        status: 'Listening to completion events',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'A freshly completed launchpad token hit the pipeline and qualified for a continuation review.',
      }),
      createStep({
        time: '09:47:19',
        label: 'Meta',
        title: 'Token context hydrated',
        detail: 'Pool data, venue coverage, and routes resolved cleanly.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '17%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The engine now has the market context needed to score the graduate.',
      }),
      createStep({
        time: '09:47:20',
        label: 'Scan',
        title: 'Volatility profile accepted',
        detail: 'The post-graduation move stayed active without becoming chaotic.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '34%',
        metrics: createMetrics({ volatility: 'High' }),
        activatedChecks: ['Volatility'],
        summary: 'The graduate has enough movement to matter while staying tradeable.',
      }),
      createStep({
        time: '09:47:21',
        label: 'Risk',
        title: 'Risk checks passed',
        detail: 'Holder quality stayed healthy and contract heuristics cleared policy.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '56%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'High' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Nothing in the risk model blocked the launchpad continuation thesis.',
      }),
      createStep({
        time: '09:47:22',
        label: 'TA',
        title: 'Indicators confirmed continuation',
        detail: 'RSI held strength on the first pullback and MACD stayed constructive.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '77%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The graduate kept holding strength as the chart confirmed continuation.',
      }),
      createStep({
        time: '09:47:23',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the completed token into a buy after the follow-through held.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '84%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'High', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The completion event held its first pullback, quality checks stayed clean, and the engine promoted the post-launch strength into a buy.',
      }),
    ],
  },
  {
    id: 'pumpfun-liquidity-buy',
    name: 'Launchpad migration liquidity buy',
    pair: 'EMBER / SOL',
    command: 'listen --source pumpfun --event migrated',
    reasoning: 'The token migrated into healthy liquidity, clean routes, and stable follow-through, so the engine issued a buy.',
    steps: [
      createStep({
        time: '09:54:41',
        label: 'Event',
        title: 'Launchpad migration event received',
        detail: 'EMBER entered the stream as a newly migrated token with active venues.',
        status: 'Watching migration events',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'A newly migrated launchpad token hit the event feed and opened a full review.',
      }),
      createStep({
        time: '09:54:42',
        label: 'Liquidity',
        title: 'Pool depth and route coverage resolved cleanly',
        detail: 'Pool info showed healthy depth, clean routes, and stable venue coverage right after migration.',
        status: 'Liquidity confirmed',
        decision: 'Qualified',
        confidence: '34%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Pool info', 'Routes'],
        summary: 'The migrated token had enough depth and route quality to stay in play.',
      }),
      createStep({
        time: '09:54:43',
        label: 'Market',
        title: 'Follow-through stayed orderly',
        detail: 'Market overview showed active participation without the kind of expansion that breaks execution.',
        status: 'Market aligned',
        decision: 'Prime setup',
        confidence: '67%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Market overview'],
        summary: 'The graduate held steady after the event instead of turning chaotic.',
      }),
      createStep({
        time: '09:54:44',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the migrated launchpad token into a buy.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '85%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'The token migrated into healthy liquidity, clean routes, and stable follow-through, so the engine issued a buy.',
      }),
    ],
  },
  {
    id: 'twitter-conviction-buy',
    name: 'Twitter conviction buy',
    pair: 'AURA / SOL',
    command: 'social-scan --platform twitter --resolve-contracts',
    reasoning: 'The social burst resolved into a real contract, the quality checks stayed clean, and the engine upgraded it into a buy.',
    steps: [
      createStep({
        time: '10:31:02',
        label: 'Social',
        title: 'Ticker started clustering on Twitter',
        detail: 'The same ticker began showing up across tracked accounts and lists.',
        status: 'Watching social bursts',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API found a social burst worth resolving into a real token.',
      }),
      createStep({
        time: '10:31:03',
        label: 'Search',
        title: 'Search token endpoint resolved contract',
        detail: 'The search flow mapped the ticker to AURA and its active pool.',
        status: 'Search endpoint resolved token',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The ticker resolved cleanly into a tradable contract.',
      }),
      createStep({
        time: '10:31:04',
        label: 'Scan',
        title: 'Volatility looked supportive',
        detail: 'The move was active, but still inside the strategy tolerance band.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '34%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The social move had real energy without becoming unstable.',
      }),
      createStep({
        time: '10:31:05',
        label: 'Risk',
        title: 'Holder and contract scans passed',
        detail: 'Holder quality stayed healthy and the contract cleared safety heuristics.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '55%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'The social signal stayed intact after the quality checks.',
      }),
      createStep({
        time: '10:31:06',
        label: 'TA',
        title: 'Indicators confirmed continuation',
        detail: 'RSI improved and MACD widened into a constructive trend.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '75%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Social momentum and technical structure pointed the same way.',
      }),
      createStep({
        time: '10:31:07',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the social discovery into a buy after all checks cleared.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '84%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The social burst resolved into a real contract, the quality checks stayed clean, and the engine upgraded it into a buy.',
      }),
    ],
  },
  {
    id: 'twitter-contract-reject',
    name: 'Twitter contract reject',
    pair: 'CLIQ / SOL',
    command: 'social-scan --platform twitter --resolve-contracts',
    reasoning: 'Twitter found the ticker quickly, and the audit layer rejected it before the rest of the pipeline had any reason to continue.',
    steps: [
      createStep({
        time: '10:38:19',
        label: 'Social',
        title: 'Ticker started clustering on Twitter',
        detail: 'The ticker spread fast enough across monitored accounts to trigger a search.',
        status: 'Watching social bursts',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API picked up a fast social burst and started contract resolution.',
      }),
      createStep({
        time: '10:38:20',
        label: 'Search',
        title: 'Search token endpoint resolved contract',
        detail: 'The search layer mapped the ticker to CLIQ and its live pool.',
        status: 'Search endpoint resolved token',
        decision: 'Scanning',
        confidence: '19%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The social ticker resolved into a concrete contract for review.',
      }),
      createStep({
        time: '10:38:21',
        label: 'Audit',
        title: 'Audit layer flagged the contract immediately',
        detail: 'Full audit, scam heuristics, and negative chatter checks all tripped before any further scoring mattered.',
        status: 'Critical risk detected',
        decision: 'Unsafe',
        confidence: '90%',
        metrics: createMetrics({ scamScore: '0.76', holderRisk: 'High' }),
        activatedChecks: ['Full audit', 'FUD search', 'Scam scan'],
        summary: 'The contract failed the safety layer before signal quality could matter.',
      }),
      createStep({
        time: '10:38:22',
        label: 'Action',
        title: 'Strategy returned REJECTED',
        detail: 'The engine blocked the social ticker on contract safety grounds.',
        status: 'Decision returned',
        decision: 'REJECTED',
        confidence: '94%',
        metrics: createMetrics({ scamScore: '0.76', holderRisk: 'High' }),
        activatedChecks: ['Decision engine'],
        summary: 'Twitter found the ticker quickly, and the audit layer rejected it before the rest of the pipeline had any reason to continue.',
      }),
    ],
  },
  {
    id: 'twitter-exhaustion-sell',
    name: 'Twitter exhaustion sell',
    pair: 'NOVA / SOL',
    command: 'social-scan --platform twitter --resolve-contracts',
    reasoning: 'The social move resolved into a real token, but momentum exhausted and the engine converted it into a sell.',
    steps: [
      createStep({
        time: '10:44:51',
        label: 'Social',
        title: 'Ticker started clustering on Twitter',
        detail: 'The same ticker burst across multiple accounts in a short window.',
        status: 'Watching social bursts',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'A fast social burst pushed the ticker into the resolution queue.',
      }),
      createStep({
        time: '10:44:52',
        label: 'Search',
        title: 'Search token endpoint resolved contract',
        detail: 'The search layer mapped the ticker to NOVA and its primary pool.',
        status: 'Search endpoint resolved token',
        decision: 'Scanning',
        confidence: '19%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The ticker resolved into a real contract, so the engine kept going.',
      }),
      createStep({
        time: '10:44:53',
        label: 'Scan',
        title: 'Volatility stretched higher',
        detail: 'The social move expanded quickly and started to look overextended.',
        status: 'Volatility stretched',
        decision: 'Watching',
        confidence: '35%',
        metrics: createMetrics({ volatility: 'High' }),
        activatedChecks: ['Volatility'],
        summary: 'The move had energy, but the extension started to look unstable.',
      }),
      createStep({
        time: '10:44:54',
        label: 'Risk',
        title: 'Risk checks passed',
        detail: 'Holder quality stayed acceptable and the contract cleared heuristics.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '49%',
        metrics: createMetrics({ scamScore: '0.11', holderRisk: 'Medium', volatility: 'High' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Risk stayed manageable, so the signal layer became the key filter.',
      }),
      createStep({
        time: '10:44:55',
        label: 'TA',
        title: 'Indicators rolled over',
        detail: 'RSI diverged down and MACD crossed lower after the social spike stalled.',
        status: 'Momentum faded',
        decision: 'Exit setup',
        confidence: '72%',
        metrics: createMetrics({ scamScore: '0.11', holderRisk: 'Medium', volatility: 'High', macd: 'Bearish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The social burst lost strength and resolved into a bearish reversal.',
      }),
      createStep({
        time: '10:44:56',
        label: 'Action',
        title: 'Strategy emitted SELL',
        detail: 'The engine turned the failed social continuation into a sell.',
        status: 'Decision returned',
        decision: 'SELL',
        confidence: '79%',
        metrics: createMetrics({ scamScore: '0.11', holderRisk: 'Medium', volatility: 'High', macd: 'Bearish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The social move resolved into a real token, but momentum exhausted and the engine converted it into a sell.',
      }),
    ],
  },
  {
    id: 'twitter-multi-account-buy',
    name: 'Twitter multi-account buy',
    pair: 'KITE / SOL',
    command: 'social-scan --platform twitter --resolve-contracts',
    reasoning: 'The ticker clustered across tracked accounts, resolved into a clean contract, and the engine promoted the social signal into a buy.',
    steps: [
      createStep({
        time: '10:49:28',
        label: 'Social',
        title: 'Ticker started clustering on Twitter',
        detail: 'KITE showed up across multiple tracked accounts inside a short window.',
        status: 'Watching social bursts',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The social layer found a burst strong enough to resolve into a real token.',
      }),
      createStep({
        time: '10:49:29',
        label: 'Search',
        title: 'Search token endpoint resolved contract',
        detail: 'The search flow mapped the ticker to KITE and its active pool.',
        status: 'Search endpoint resolved token',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The ticker resolved cleanly into a tradable contract.',
      }),
      createStep({
        time: '10:49:30',
        label: 'Scan',
        title: 'Volatility looked supportive',
        detail: 'The social move stayed active without breaking the strategy range.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '35%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The move had enough energy to matter without looking unstable.',
      }),
      createStep({
        time: '10:49:31',
        label: 'Risk',
        title: 'Holder and contract scans passed',
        detail: 'Holder quality stayed healthy and the contract cleared safety heuristics.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '56%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Nothing in the quality layer blocked the social setup.',
      }),
      createStep({
        time: '10:49:32',
        label: 'TA',
        title: 'Indicators confirmed continuation',
        detail: 'RSI stayed firm and MACD widened into a constructive trend.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '76%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'The social burst and chart structure kept pointing in the same direction.',
      }),
      createStep({
        time: '10:49:33',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine upgraded the social ticker into a buy after all checks cleared.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '84%',
        metrics: createMetrics({ scamScore: '0.06', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The ticker clustered across tracked accounts, resolved into a clean contract, and the engine promoted the social signal into a buy.',
      }),
    ],
  },
  {
    id: 'twitter-sentiment-buy',
    name: 'Twitter sentiment buy',
    pair: 'PRSM / SOL',
    command: 'social-scan --platform twitter --resolve-contracts',
    reasoning: 'The social burst resolved cleanly, quality stayed high, and the engine turned the rising sentiment into a buy.',
    steps: [
      createStep({
        time: '10:56:14',
        label: 'Social',
        title: 'Ticker started clustering on Twitter',
        detail: 'PRSM picked up repeated mentions across monitored lists and high-signal accounts.',
        status: 'Watching social bursts',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The API found a social burst strong enough to warrant contract resolution.',
      }),
      createStep({
        time: '10:56:15',
        label: 'Search',
        title: 'Search token endpoint resolved contract',
        detail: 'The search layer mapped the ticker to PRSM and its primary pool.',
        status: 'Search endpoint resolved token',
        decision: 'Scanning',
        confidence: '19%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The social ticker is no longer ambiguous and can be scored directly.',
      }),
      createStep({
        time: '10:56:16',
        label: 'Scan',
        title: 'Volatility stayed constructive',
        detail: 'The move expanded with healthy activity while remaining inside tolerance.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '36%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The social move has enough strength to keep advancing through the pipeline.',
      }),
      createStep({
        time: '10:56:17',
        label: 'Risk',
        title: 'Risk checks passed',
        detail: 'Holder quality and contract safety both remained inside policy.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '57%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Nothing in the risk model blocked the sentiment-driven setup.',
      }),
      createStep({
        time: '10:56:18',
        label: 'TA',
        title: 'Indicators confirmed upside',
        detail: 'RSI held strength and MACD continued widening into bullish follow-through.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '77%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Sentiment and technical structure stayed aligned into the close of the scan.',
      }),
      createStep({
        time: '10:56:19',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the sentiment setup into a buy action.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '85%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'The social burst resolved cleanly, quality stayed high, and the engine turned the rising sentiment into a buy.',
      }),
    ],
  },
  {
    id: 'smart-money-into-sol',
    name: 'Smart money into SOL',
    pair: 'SOL / USDC',
    command: 'flow-watch --wallet-set smart-money --monitor-rotation',
    reasoning: 'Smart money rotated back into SOL, the quality checks stayed clean, and the engine upgraded the flow into a buy.',
    steps: [
      createStep({
        time: '16:18:09',
        label: 'Flow',
        title: 'Smart money inflow detected',
        detail: 'Tracked wallets began adding SOL across monitored venues.',
        status: 'Watching smart money accumulation',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The engine spotted coordinated wallet inflows into SOL.',
      }),
      createStep({
        time: '16:18:10',
        label: 'Meta',
        title: 'Asset context hydrated',
        detail: 'Pair data, execution paths, and routing context were loaded.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The flow now had enough market context to be scored properly.',
      }),
      createStep({
        time: '16:18:11',
        label: 'Scan',
        title: 'Volatility stayed supportive',
        detail: 'The move accelerated, but remained inside the strategy tolerance band.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '34%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The market was moving with enough energy to matter, but not too much.',
      }),
      createStep({
        time: '16:18:12',
        label: 'Risk',
        title: 'Risk scans passed',
        detail: 'Contract quality and holder distribution stayed inside policy.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '53%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'Nothing in the risk model blocked the inflow thesis.',
      }),
      createStep({
        time: '16:18:13',
        label: 'TA',
        title: 'Indicators confirmed continuation',
        detail: 'RSI improved and MACD widened into an upside continuation read.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '75%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Wallet flow and price structure lined up behind the move.',
      }),
      createStep({
        time: '16:18:14',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the SOL inflow into a buy action.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '84%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'Smart money rotated back into SOL, the quality checks stayed clean, and the engine upgraded the flow into a buy.',
      }),
    ],
  },
  {
    id: 'smart-money-out-eth',
    name: 'Smart money out of ETH',
    pair: 'ETH / USDC',
    command: 'flow-watch --wallet-set smart-money --monitor-rotation',
    reasoning: 'Smart money began trimming ETH, wallet quality rolled over, and the screener confirmed the exit.',
    steps: [
      createStep({
        time: '16:27:44',
        label: 'Flow',
        title: 'Smart money outflow detected',
        detail: 'Tracked wallets began cutting ETH exposure across the monitored venues.',
        status: 'Watching smart money exits',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The engine spotted coordinated wallet outflows from ETH.',
      }),
      createStep({
        time: '16:27:45',
        label: 'Meta',
        title: 'Asset metadata loaded',
        detail: 'Pair context, route availability, and market structure resolved cleanly.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The outflow now had enough market context to be read properly.',
      }),
      createStep({
        time: '16:27:46',
        label: 'Wallets',
        title: 'Wallet review and PnL weakened',
        detail: 'The outflow cluster showed deteriorating trade quality and steady net selling pressure.',
        status: 'Wallet conviction flipped',
        decision: 'Watching',
        confidence: '33%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Wallet review', 'PnL'],
        summary: 'The outflow looked increasingly coordinated rather than random.',
      }),
      createStep({
        time: '16:27:47',
        label: 'Risk',
        title: 'Token screener backed the exit',
        detail: 'Broader screening confirmed the rotation was happening with fading structure rather than noise.',
        status: 'Exit confirmed',
        decision: 'Short setup',
        confidence: '71%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Token screener'],
        summary: 'Wallet behavior and screening data both pointed toward an exit.',
      }),
      createStep({
        time: '16:27:48',
        label: 'Action',
        title: 'Strategy emitted SELL',
        detail: 'The engine turned the ETH outflow into a sell action.',
        status: 'Decision returned',
        decision: 'SELL',
        confidence: '81%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'Smart money began trimming ETH, wallet quality rolled over, and the screener confirmed the exit.',
      }),
    ],
  },
  {
    id: 'smart-money-into-btc',
    name: 'Smart money into BTC',
    pair: 'BTC / USDC',
    command: 'flow-watch --wallet-set smart-money --monitor-rotation',
    reasoning: 'Tracked wallets rotated into BTC, the wallet cluster stayed high quality, and broader market context supported a buy.',
    steps: [
      createStep({
        time: '16:34:18',
        label: 'Flow',
        title: 'Smart money inflow detected',
        detail: 'Tracked wallets began adding BTC across the monitored venues.',
        status: 'Watching smart money accumulation',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The engine spotted coordinated wallet inflows into BTC.',
      }),
      createStep({
        time: '16:34:19',
        label: 'Meta',
        title: 'Asset metadata loaded',
        detail: 'Pair context, routes, and execution paths resolved successfully.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '18%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The flow now has enough market context to be scored properly.',
      }),
      createStep({
        time: '16:34:20',
        label: 'Wallets',
        title: 'Related wallet cluster stayed high quality',
        detail: 'The inflow came from linked wallets with strong realized performance and steady sizing.',
        status: 'Wallet quality strong',
        decision: 'Watching',
        confidence: '35%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Wallet cluster', 'Wallet review'],
        summary: 'The wallets behind the move looked disciplined rather than noisy.',
      }),
      createStep({
        time: '16:34:21',
        label: 'Market',
        title: 'Market overview backed the inflow',
        detail: 'BTC strength held across the broader market while realized PnL stayed supportive.',
        status: 'Market aligned',
        decision: 'Prime setup',
        confidence: '72%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Market overview', 'PnL'],
        summary: 'Wallet quality and broader market context both stayed supportive.',
      }),
      createStep({
        time: '16:34:22',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the BTC inflow into a buy action.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '85%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'Tracked wallets rotated into BTC, the wallet cluster stayed high quality, and broader market context supported a buy.',
      }),
    ],
  },
  {
    id: 'smart-money-into-link',
    name: 'Smart money into LINK',
    pair: 'LINK / USDC',
    command: 'flow-watch --wallet-set smart-money --monitor-rotation',
    reasoning: 'Smart money started accumulating LINK, momentum confirmed the move, and the engine upgraded the flow into a buy.',
    steps: [
      createStep({
        time: '16:41:07',
        label: 'Flow',
        title: 'Smart money inflow detected',
        detail: 'Tracked wallets began adding LINK across monitored venues.',
        status: 'Watching smart money accumulation',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Live stream'],
        summary: 'The engine found coordinated wallet inflows building into LINK.',
      }),
      createStep({
        time: '16:41:08',
        label: 'Meta',
        title: 'Asset context hydrated',
        detail: 'Market context, route availability, and pair metadata resolved cleanly.',
        status: 'Metadata loaded',
        decision: 'Scanning',
        confidence: '17%',
        metrics: createMetrics(),
        activatedChecks: ['Token metadata'],
        summary: 'The accumulation flow now has enough context to be scored correctly.',
      }),
      createStep({
        time: '16:41:09',
        label: 'Scan',
        title: 'Volatility stayed supportive',
        detail: 'The move expanded inside the strategy band without looking unstable.',
        status: 'Volatility supportive',
        decision: 'Watching',
        confidence: '35%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Volatility'],
        summary: 'The inflow has enough movement behind it to remain actionable.',
      }),
      createStep({
        time: '16:41:10',
        label: 'Risk',
        title: 'Risk scans passed',
        detail: 'Holder quality and contract heuristics stayed safely inside policy.',
        status: 'Risk gate cleared',
        decision: 'Qualified',
        confidence: '56%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Holder scan', 'Scam scan'],
        summary: 'The quality layer stayed clean, so the flow remained high-conviction.',
      }),
      createStep({
        time: '16:41:11',
        label: 'TA',
        title: 'Indicators confirmed upside',
        detail: 'RSI improved and MACD widened into a healthy bullish continuation read.',
        status: 'Indicators aligned',
        decision: 'Prime setup',
        confidence: '77%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['RSI', 'MACD'],
        summary: 'Wallet flow and chart structure kept confirming the move higher.',
      }),
      createStep({
        time: '16:41:12',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine promoted the LINK inflow into a buy.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '86%',
        metrics: createMetrics({ scamScore: '0.03', holderRisk: 'Low', volatility: 'Medium', macd: 'Bullish' }),
        activatedChecks: ['Decision engine'],
        summary: 'Smart money started accumulating LINK, momentum confirmed the move, and the engine upgraded the flow into a buy.',
      }),
    ],
  },
  {
    id: 'copy-wallet-conviction-buy',
    name: 'Copy trader conviction buy',
    pair: 'ORBIT / SOL',
    command: 'copy-traders --source top-traders --follow-buys',
    reasoning: 'Top traders surfaced strong wallets to watch, wallet PnL confirmed conviction, and the token buy held up well enough for the engine to copy it.',
    steps: [
      createStep({
        time: '17:02:11',
        label: 'Flow',
        title: 'Top traders surfaced wallets to watch',
        detail: 'Top trader flow on a hot pair surfaced wallets with strong recent execution worth monitoring.',
        status: 'Finding copyable wallets',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Top traders'],
        summary: 'The copy-trader flow first found a wallet cluster worth tracking.',
      }),
      createStep({
        time: '17:02:12',
        label: 'Wallets',
        title: 'PnL and related wallets confirmed quality',
        detail: 'Wallet review, PnL, and related-wallet checks showed disciplined sizing and healthy realized performance.',
        status: 'Wallet cluster approved',
        decision: 'Watching',
        confidence: '24%',
        metrics: createMetrics(),
        activatedChecks: ['PnL', 'Related wallets', 'Wallet review'],
        summary: 'The wallet cluster looked good enough to keep following.',
      }),
      createStep({
        time: '17:02:13',
        label: 'Event',
        title: 'Fresh token buy detected from watched wallet',
        detail: 'Listening to wallet activity surfaced a new buy into ORBIT and moved the token into the pipeline.',
        status: 'New wallet buy detected',
        decision: 'Watching',
        confidence: '41%',
        metrics: createMetrics(),
        activatedChecks: ['Listening to wallet'],
        summary: 'The copy-trader flow now has a concrete token to evaluate.',
      }),
      createStep({
        time: '17:02:14',
        label: 'Liquidity',
        title: 'Pool depth and routes held up',
        detail: 'Pool info showed stable depth and enough route coverage to stay tradeable.',
        status: 'Liquidity confirmed',
        decision: 'Qualified',
        confidence: '58%',
        metrics: createMetrics({ volatility: 'Medium' }),
        activatedChecks: ['Pool info', 'Routes'],
        summary: 'The token had enough depth behind the wallet buy to remain actionable.',
      }),
      createStep({
        time: '17:02:15',
        label: 'Market',
        title: 'Market context backed the copy',
        detail: 'Broader market participation stayed constructive instead of fading after the wallet entry.',
        status: 'Copy candidate approved',
        decision: 'Prime setup',
        confidence: '74%',
        metrics: createMetrics({ holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Market overview', 'Top traders'],
        summary: 'The wallet buy held up once broader market context was checked.',
      }),
      createStep({
        time: '17:02:16',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine copied the wallet flow into a buy after the token review cleared.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '84%',
        metrics: createMetrics({ holderRisk: 'Low', volatility: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'Top traders surfaced strong wallets to watch, wallet PnL confirmed conviction, and the token buy held up well enough for the engine to copy it.',
      }),
    ],
  },
  {
    id: 'copy-wallet-related-buy',
    name: 'Copy trader tracked-wallet buy',
    pair: 'NIMB / SOL',
    command: 'copy-traders --wallet-set tracked --follow-buys',
    reasoning: 'A tracked wallet already on the board started buying again, related-wallet quality stayed strong, and the token cleared audit well enough for the engine to copy the trade.',
    steps: [
      createStep({
        time: '17:09:34',
        label: 'Flow',
        title: 'Tracked wallet moved back into focus',
        detail: 'A wallet already on the board started sizing back in with the kind of execution profile the strategy follows.',
        status: 'Tracked wallet reactivated',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Wallet review'],
        summary: 'The copy-trader flow already had a wallet and moved it back into active review.',
      }),
      createStep({
        time: '17:09:35',
        label: 'Wallets',
        title: 'Related wallets confirmed conviction',
        detail: 'Linked wallets showed similar entries, healthy realized PnL, and stable sizing behavior.',
        status: 'Related wallets aligned',
        decision: 'Watching',
        confidence: '28%',
        metrics: createMetrics(),
        activatedChecks: ['PnL', 'Related wallets', 'Wallet review'],
        summary: 'The wallet cluster looked coordinated rather than random.',
      }),
      createStep({
        time: '17:09:36',
        label: 'Event',
        title: 'New token buy surfaced from watched wallets',
        detail: 'Listening to wallet activity confirmed fresh buys into NIMB across the related cluster.',
        status: 'Cluster buy detected',
        decision: 'Watching',
        confidence: '43%',
        metrics: createMetrics(),
        activatedChecks: ['Listening to wallet'],
        summary: 'The copy-trader flow now has a specific token to scan.',
      }),
      createStep({
        time: '17:09:37',
        label: 'Audit',
        title: 'Audit and holder checks passed',
        detail: 'Full audit cleared and holder quality stayed healthy enough to keep the copy alive.',
        status: 'Quality confirmed',
        decision: 'Prime setup',
        confidence: '72%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low' }),
        activatedChecks: ['Full audit', 'Holder scan'],
        summary: 'The token cleared the quality layer after the wallet cluster buy was detected.',
      }),
      createStep({
        time: '17:09:38',
        label: 'Action',
        title: 'Strategy emitted BUY',
        detail: 'The engine copied the cluster buy after the token cleared audit and holder review.',
        status: 'Decision returned',
        decision: 'BUY',
        confidence: '86%',
        metrics: createMetrics({ scamScore: '0.05', holderRisk: 'Low' }),
        activatedChecks: ['Decision engine'],
        summary: 'A tracked wallet already on the board started buying again, related-wallet quality stayed strong, and the token cleared audit well enough for the engine to copy the trade.',
      }),
    ],
  },
  {
    id: 'copy-wallet-no-trade',
    name: 'Copy trader thin-liquidity pass',
    pair: 'VALE / SOL',
    command: 'copy-traders --source top-traders --follow-buys',
    reasoning: 'Top traders found the wallet first, but related wallets did not confirm strongly enough and pool depth stayed too thin to copy.',
    steps: [
      createStep({
        time: '17:16:08',
        label: 'Flow',
        title: 'Top traders surfaced a wallet to watch',
        detail: 'Top trader flow found a wallet with enough recent edge to move into copy review.',
        status: 'Finding copyable wallets',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Top traders'],
        summary: 'The copy-trader flow identified a wallet worth monitoring.',
      }),
      createStep({
        time: '17:16:09',
        label: 'Wallets',
        title: 'Related wallets stayed mixed',
        detail: 'Related wallets did not follow size cleanly and recent realized quality looked uneven.',
        status: 'Wallet conviction mixed',
        decision: 'Watching',
        confidence: '25%',
        metrics: createMetrics(),
        activatedChecks: ['PnL', 'Related wallets', 'Wallet review'],
        summary: 'The wallet cluster did not fully confirm the lead wallet.',
      }),
      createStep({
        time: '17:16:10',
        label: 'Event',
        title: 'New token buy detected from watched wallet',
        detail: 'Listening to wallet activity showed a fresh buy into VALE and moved the token into review.',
        status: 'New wallet buy detected',
        decision: 'Watching',
        confidence: '38%',
        metrics: createMetrics(),
        activatedChecks: ['Listening to wallet'],
        summary: 'The copy-trader flow has a token, but conviction is still thin.',
      }),
      createStep({
        time: '17:16:11',
        label: 'Liquidity',
        title: 'Pool depth stayed too thin',
        detail: 'Pool info showed shallow depth and weaker route quality than the strategy allows.',
        status: 'Liquidity too thin',
        decision: 'No edge',
        confidence: '44%',
        metrics: createMetrics({ volatility: 'Low' }),
        activatedChecks: ['Pool info', 'Routes'],
        summary: 'The token failed liquidity requirements even before deeper signal work mattered.',
      }),
      createStep({
        time: '17:16:12',
        label: 'Action',
        title: 'Strategy returned NO TRADE',
        detail: 'The engine passed on copying the wallet buy because liquidity and wallet confirmation were too weak.',
        status: 'Decision returned',
        decision: 'NO TRADE',
        confidence: '51%',
        metrics: createMetrics({ volatility: 'Low' }),
        activatedChecks: ['Decision engine'],
        summary: 'Top traders found the wallet first, but related wallets did not confirm strongly enough and pool depth stayed too thin to copy.',
      }),
    ],
  },
  {
    id: 'copy-wallet-audit-pass',
    name: 'Copy trader audit block',
    pair: 'PRYX / SOL',
    command: 'copy-traders --wallet-set tracked --follow-buys',
    reasoning: 'A tracked wallet already on the board made a fresh entry, but the token buy failed audit checks, so the engine refused to copy it.',
    steps: [
      createStep({
        time: '17:23:42',
        label: 'Flow',
        title: 'Tracked wallet fired a fresh entry',
        detail: 'A wallet already under watch opened a new position with enough quality to justify token review.',
        status: 'Tracked wallet active',
        decision: 'Scanning',
        confidence: '--',
        metrics: createMetrics(),
        activatedChecks: ['Wallet review', 'PnL'],
        summary: 'The copy-trader flow already had the wallet and moved straight into trade review.',
      }),
      createStep({
        time: '17:23:43',
        label: 'Wallets',
        title: 'Wallet review cleared minimum quality',
        detail: 'Wallet review and related-wallet checks stayed strong enough to keep investigating the trade.',
        status: 'Wallet quality approved',
        decision: 'Watching',
        confidence: '29%',
        metrics: createMetrics(),
        activatedChecks: ['PnL', 'Related wallets', 'Wallet review'],
        summary: 'The wallet looked good enough to justify scanning the token it bought.',
      }),
      createStep({
        time: '17:23:44',
        label: 'Event',
        title: 'New token buy surfaced from watched wallet',
        detail: 'Listening to wallet activity confirmed fresh buying into PRYX and moved the token into the scan pipeline.',
        status: 'New wallet buy detected',
        decision: 'Watching',
        confidence: '42%',
        metrics: createMetrics(),
        activatedChecks: ['Listening to wallet'],
        summary: 'The copy-trader flow now has a concrete token to evaluate.',
      }),
      createStep({
        time: '17:23:45',
        label: 'Audit',
        title: 'Audit checks blocked the token',
        detail: 'Full audit and scam heuristics surfaced enough contract risk to stop the copy outright.',
        status: 'Audit blocked copy',
        decision: 'Unsafe',
        confidence: '83%',
        metrics: createMetrics({ scamScore: '0.63', holderRisk: 'Medium' }),
        activatedChecks: ['Full audit', 'Scam scan'],
        summary: 'The wallet looked strong, but the token itself failed policy.',
      }),
      createStep({
        time: '17:23:46',
        label: 'Action',
        title: 'Strategy returned NO TRADE',
        detail: 'The engine refused to copy the wallet buy because the token failed audit.',
        status: 'Decision returned',
        decision: 'NO TRADE',
        confidence: '88%',
        metrics: createMetrics({ scamScore: '0.63', holderRisk: 'Medium' }),
        activatedChecks: ['Decision engine'],
        summary: 'A tracked wallet already on the board made a fresh entry, but the token buy failed audit checks, so the engine refused to copy it.',
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

const scenarioEndpointProfiles = {
  'breakout-buy': {
    source: 'GET /trendingTokens',
    steps: {
      event: 'GET /trendingTokens',
      meta: 'GET /tokenPoolInfo',
      scan: 'GET /marketOverview + /topTraders',
      risk: 'GET /holderAnalysis + /holders',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'weak-momentum': {
    source: 'GET /newPairs',
    steps: {
      event: 'GET /newPairs',
      meta: 'GET /detailedTokenStats',
      market: 'GET /marketOverview + /tokenPriceHistory',
      action: 'Agent Reasoning',
    },
  },
  'scam-risk': {
    source: 'GET /getNewEthTradableTokens',
    steps: {
      event: 'GET /getNewEthTradableTokens',
      meta: 'GET /detailedTokenStats',
      audit: 'GET /fullAudit + /isScam',
      action: 'Agent Reasoning',
    },
  },
  'volume-exhaustion-sell': {
    source: 'GET /trendingTokens',
    steps: {
      event: 'GET /trendingTokens',
      meta: 'GET /tokenPoolInfo',
      scan: 'GET /topTraders + /tokenPriceHistory',
      risk: 'GET /holderAnalysis + /holders',
      ta: 'GET /priceHistoryIndicators',
      action: 'Agent Reasoning',
    },
  },
  'liquidity-reclaim-buy': {
    source: 'GET /newPairs',
    steps: {
      event: 'GET /newPairs',
      liquidity: 'GET /tokenPoolInfo',
      market: 'GET /marketOverview + /topTraders',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'trend-reversal-buy': {
    source: 'GET /newPairs',
    steps: {
      event: 'GET /newPairs',
      meta: 'GET /detailedTokenStats',
      scan: 'GET /marketOverview + /tokenPriceHistory',
      risk: 'GET /holderAnalysis + /holders',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'pumpfun-graduation': {
    source: 'WS /ws/launchpadEvents',
    steps: {
      event: 'WS /ws/launchpadEvents',
      meta: 'GET /tokenPoolInfo',
      scan: 'GET /marketOverview + /topTraders',
      risk: 'GET /holderAnalysis + /fullAudit',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'pumpfun-no-trade': {
    source: 'WS /ws/launchpadEvents',
    steps: {
      event: 'WS /ws/launchpadEvents',
      meta: 'GET /detailedTokenStats',
      scan: 'GET /marketOverview',
      risk: 'GET /holderAnalysis + /holders',
      ta: 'GET /priceHistoryIndicators',
      action: 'Agent Reasoning',
    },
  },
  'pumpfun-risk-reject': {
    source: 'WS /ws/launchpadEvents',
    steps: {
      event: 'WS /ws/launchpadEvents',
      meta: 'GET /tokenPoolInfo',
      audit: 'GET /fullAudit + /isScam',
      action: 'Agent Reasoning',
    },
  },
  'pumpfun-exit-sell': {
    source: 'WS /ws/launchpadEvents',
    steps: {
      event: 'WS /ws/launchpadEvents',
      meta: 'GET /tokenPoolInfo',
      scan: 'GET /volatilityScanner + /tokenPriceHistory',
      risk: 'GET /holderAnalysis + /holders',
      ta: 'GET /priceHistoryIndicators',
      action: 'Agent Reasoning',
    },
  },
  'pumpfun-breakout-buy': {
    source: 'WS /ws/launchpadEvents',
    steps: {
      event: 'WS /ws/launchpadEvents',
      meta: 'GET /detailedTokenStats',
      scan: 'GET /marketOverview + /topTraders',
      risk: 'GET /tokenHolders + /fullAudit',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'pumpfun-liquidity-buy': {
    source: 'WS /ws/launchpadEvents',
    steps: {
      event: 'WS /ws/launchpadEvents',
      liquidity: 'GET /tokenPoolInfo',
      market: 'GET /marketOverview',
      action: 'Agent Reasoning',
    },
  },
  'twitter-ticker-discovery': {
    source: 'GET /xCountRecent + /xSearch',
    steps: {
      social: 'GET /xCountRecent + /xSearch',
      search: 'GET /tokenSearch',
      sentiment: 'GET /xUserLikes + /xUserFollowers',
      risk: 'GET /holderAnalysis + /fudSearch',
      action: 'Agent Reasoning',
    },
  },
  'twitter-conviction-buy': {
    source: 'GET /xSearch + /xUserFollowers',
    steps: {
      social: 'GET /xSearch + /xUserFollowers',
      search: 'GET /tokenSearch',
      scan: 'GET /xUserLikes + /marketOverview',
      risk: 'GET /holderAnalysis + /fullAudit',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'twitter-contract-reject': {
    source: 'GET /xCountRecent + /xSearch',
    steps: {
      social: 'GET /xCountRecent + /xSearch',
      search: 'GET /tokenSearch',
      audit: 'GET /fullAudit + /isScam + /fudSearch',
      action: 'Agent Reasoning',
    },
  },
  'twitter-exhaustion-sell': {
    source: 'GET /xCountRecent + /xSearch',
    steps: {
      social: 'GET /xCountRecent + /xSearch',
      search: 'GET /tokenSearch',
      scan: 'GET /xUserLikes + /tokenPriceHistory',
      risk: 'GET /holderAnalysis + /fudSearch',
      ta: 'GET /priceHistoryIndicators',
      action: 'Agent Reasoning',
    },
  },
  'twitter-multi-account-buy': {
    source: 'GET /xCountRecent + /xSearch',
    steps: {
      social: 'GET /xCountRecent + /xSearch',
      search: 'GET /tokenSearch',
      scan: 'GET /xUserFollowers + /xUserLikes',
      risk: 'GET /holderAnalysis + /holders',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'twitter-sentiment-buy': {
    source: 'GET /xSearch + /xUserLikes',
    steps: {
      social: 'GET /xSearch + /xUserLikes',
      search: 'GET /tokenSearch',
      scan: 'GET /fudSearch + /marketOverview',
      risk: 'GET /holderAnalysis + /isScam',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'smart-money-out-sol': {
    source: 'POST /smartMoneyNetflow + /addressRelatedWallets',
    steps: {
      flow: 'POST /smartMoneyNetflow + /addressRelatedWallets',
      meta: 'GET /walletReview',
      wallets: 'GET /pnl + /addressRelatedWallets',
      market: 'GET /marketOverview + /walletReview',
      action: 'Agent Reasoning',
    },
  },
  'smart-money-into-eth': {
    source: 'POST /smartMoneyNetflow + GET /getTopEthTokens',
    steps: {
      flow: 'POST /smartMoneyNetflow + GET /getTopEthTokens',
      meta: 'POST /addressRelatedWallets',
      scan: 'GET /walletReview + /pnl',
      risk: 'POST /tokenScreener',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'smart-money-into-sol': {
    source: 'POST /smartMoneyNetflow + GET /nansenPresets',
    steps: {
      flow: 'POST /smartMoneyNetflow + GET /nansenPresets',
      meta: 'POST /addressRelatedWallets',
      scan: 'GET /walletReview + /pnl',
      risk: 'POST /tokenScreener',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'smart-money-out-eth': {
    source: 'POST /smartMoneyNetflow + GET /getTopEthTokens',
    steps: {
      flow: 'POST /smartMoneyNetflow + GET /getTopEthTokens',
      meta: 'GET /walletReview',
      wallets: 'GET /walletReview + /pnl',
      risk: 'POST /tokenScreener',
      action: 'Agent Reasoning',
    },
  },
  'smart-money-into-btc': {
    source: 'POST /smartMoneyNetflow + GET /marketOverview',
    steps: {
      flow: 'POST /smartMoneyNetflow + GET /marketOverview',
      meta: 'POST /addressRelatedWallets',
      wallets: 'GET /walletReview + /addressRelatedWallets',
      market: 'GET /marketOverview + /pnl',
      action: 'Agent Reasoning',
    },
  },
  'smart-money-into-link': {
    source: 'POST /smartMoneyNetflow + GET /nansenPresets',
    steps: {
      flow: 'POST /smartMoneyNetflow + GET /nansenPresets',
      meta: 'POST /addressRelatedWallets',
      scan: 'GET /walletReview + /topTraders',
      risk: 'POST /tokenScreener',
      ta: 'GET /priceHistoryIndicators + /rateMyEntry',
      action: 'Agent Reasoning',
    },
  },
  'copy-wallet-conviction-buy': {
    source: 'GET /topTraders',
    steps: {
      flow: 'GET /topTraders',
      wallets: 'GET /walletReview + /pnl + POST /addressRelatedWallets',
      event: 'Listening to wallet activity',
      liquidity: 'GET /tokenPoolInfo',
      market: 'GET /marketOverview + /topTraders',
      action: 'Agent Reasoning',
    },
  },
  'copy-wallet-related-buy': {
    source: 'GET /walletReview + /pnl',
    steps: {
      flow: 'GET /walletReview + /pnl',
      wallets: 'GET /walletReview + /pnl + POST /addressRelatedWallets',
      event: 'Listening to wallet activity',
      audit: 'GET /fullAudit + /holderAnalysis',
      action: 'Agent Reasoning',
    },
  },
  'copy-wallet-no-trade': {
    source: 'GET /topTraders',
    steps: {
      flow: 'GET /topTraders',
      wallets: 'GET /walletReview + /pnl + POST /addressRelatedWallets',
      event: 'Listening to wallet activity',
      liquidity: 'GET /tokenPoolInfo',
      action: 'Agent Reasoning',
    },
  },
  'copy-wallet-audit-pass': {
    source: 'GET /walletReview + /pnl',
    steps: {
      flow: 'GET /walletReview + /pnl',
      wallets: 'GET /walletReview + POST /addressRelatedWallets',
      event: 'Listening to wallet activity',
      audit: 'GET /fullAudit + /isScam',
      action: 'Agent Reasoning',
    },
  },
}

const endpointCheckLabelMap = {
  '/ws/launchpadEvents': 'Launchpad feed',
  '/trendingTokens': 'Trending feed',
  '/newPairs': 'New pairs',
  '/getNewEthTradableTokens': 'New ETH tradables',
  '/getTopEthTokens': 'Top ETH',
  '/tokenSearch': 'Token search',
  '/tokenPoolInfo': 'Pool info',
  '/detailedTokenStats': 'Detailed stats',
  '/marketOverview': 'Market overview',
  '/tokenPriceHistory': 'Price history',
  '/priceHistoryIndicators': 'Indicators',
  '/rateMyEntry': 'Entry score',
  '/volatilityScanner': 'Volatility',
  '/holderAnalysis': 'Holder analysis',
  '/holders': 'Holders',
  '/tokenHolders': 'Top holders',
  '/isScam': 'Scam scan',
  '/fullAudit': 'Full audit',
  '/fudSearch': 'FUD search',
  '/topTraders': 'Top traders',
  '/xSearch': 'Twitter search',
  '/xCountRecent': 'Mention count',
  '/xUserFollowers': 'Follower check',
  '/xUserLikes': 'Like check',
  '/smartMoneyNetflow': 'Smart money',
  '/addressRelatedWallets': 'Wallet cluster',
  '/walletReview': 'Wallet review',
  '/pnl': 'PnL',
  '/tokenScreener': 'Token screener',
  '/nansenPresets': 'Nansen preset',
}

function getScenarioBootLine(scenario) {
  if (scenario.id === 'pumpfun-no-trade' || scenario.id === 'pumpfun-risk-reject') {
    return 'listening for newly created launchpad tokens'
  }

  if (scenario.id === 'pumpfun-exit-sell' || scenario.id === 'pumpfun-liquidity-buy') {
    return 'watching launchpad migration events'
  }

  if (scenario.id.startsWith('pumpfun-')) {
    return 'listening for launchpad completion events'
  }

  if (scenario.id.startsWith('twitter-')) {
    return 'watching twitter for repeated ticker mentions'
  }

  if (scenario.id.startsWith('smart-money-out-')) {
    return 'tracking smart money outflows'
  }

  if (scenario.id.startsWith('smart-money-into-')) {
    return 'tracking smart money inflows'
  }

  if (scenario.id.startsWith('copy-wallet-')) {
    return 'ranking traders and watching wallet activity'
  }

  return 'monitoring live token sources'
}

function getPairRevealStepIndex(scenario) {
  if (scenario.id.startsWith('twitter-')) {
    return 1
  }

  if (scenario.id.startsWith('copy-wallet-')) {
    return 2
  }

  return 0
}

function getLiveRunLabel(scenario, activePipelineStep, currentPipelineState, hasFinalDecision) {
  if (activePipelineStep < 0) {
    return 'Listening for live signals'
  }

  if (hasFinalDecision) {
    return 'Decision returned'
  }

  if (activePipelineStep < getPairRevealStepIndex(scenario)) {
    return 'Candidate detected'
  }

  return currentPipelineState.status || 'Reviewing candidate'
}

function getQueuedStageText(step) {
  const label = String(step.label || '').trim().toLowerCase()

  switch (label) {
    case 'event':
      return 'Waiting for a live trigger'
    case 'social':
      return 'Watching for a social burst'
    case 'search':
      return 'Resolving the contract'
    case 'flow':
      return 'Watching wallet activity'
    case 'meta':
      return 'Loading token context'
    case 'liquidity':
      return 'Checking pool depth and routes'
    case 'wallets':
      return 'Reviewing wallet cluster quality'
    case 'market':
      return 'Reading broader market context'
    case 'sentiment':
      return 'Scoring source strength'
    case 'audit':
      return 'Running contract and policy audit'
    case 'scan':
      return 'Running volatility checks'
    case 'risk':
      return 'Checking holders and safety'
    case 'ta':
      return 'Reading indicators'
    case 'action':
      return 'Preparing a decision'
    default:
      return 'Waiting for the next module'
  }
}

function getScenarioIndexById(id) {
  return demoScenarios.findIndex((scenario) => scenario.id === id)
}

const demoStrategyOptions = [
  {
    id: 'scan-live-tokens',
    label: 'Scan live tokens',
    command: 'discover --source stream --filter candidates',
    scenarioIds: ['breakout-buy', 'weak-momentum', 'scam-risk', 'volume-exhaustion-sell', 'liquidity-reclaim-buy', 'trend-reversal-buy'],
  },
  {
    id: 'watch-launchpad-events',
    label: 'Watch launchpad events',
    command: 'listen --source launchpad --event all',
    scenarioIds: ['pumpfun-graduation', 'pumpfun-no-trade', 'pumpfun-risk-reject', 'pumpfun-exit-sell', 'pumpfun-breakout-buy', 'pumpfun-liquidity-buy'],
  },
  {
    id: 'search-twitter',
    label: 'Search Twitter',
    command: 'social-scan --platform twitter --resolve-contracts',
    scenarioIds: ['twitter-ticker-discovery', 'twitter-conviction-buy', 'twitter-contract-reject', 'twitter-exhaustion-sell', 'twitter-multi-account-buy', 'twitter-sentiment-buy'],
  },
  {
    id: 'follow-smart-money',
    label: 'Follow smart money',
    command: 'flow-watch --wallet-set smart-money --monitor-rotation',
    scenarioIds: ['smart-money-out-sol', 'smart-money-into-eth', 'smart-money-into-sol', 'smart-money-out-eth', 'smart-money-into-btc', 'smart-money-into-link'],
  },
  {
    id: 'copy-wallets',
    label: 'Copy traders',
    command: 'copy-traders --source mixed --follow-buys',
    scenarioIds: ['copy-wallet-conviction-buy', 'copy-wallet-related-buy', 'copy-wallet-no-trade', 'copy-wallet-audit-pass'],
  },
]

function getStrategyOptionById(id) {
  return demoStrategyOptions.find((option) => option.id === id) || null
}

function getStrategyScenarioIndexes(id) {
  const option = getStrategyOptionById(id)

  if (!option) {
    return []
  }

  return option.scenarioIds
    .map((scenarioId) => getScenarioIndexById(scenarioId))
    .filter((index) => index >= 0)
}

function getStrategyAnchorIndex(id) {
  const indexes = getStrategyScenarioIndexes(id)
  return indexes[0] ?? 0
}

function pickScenarioIndexForSelection(id) {
  const indexes = getStrategyScenarioIndexes(id)

  if (indexes.length === 0) {
    return 0
  }

  return indexes[Math.floor(Math.random() * indexes.length)]
}

function getStrategyLabel(id) {
  return getStrategyOptionById(id)?.label || 'Selected strategy'
}

function getStrategyCommand(id) {
  return getStrategyOptionById(id)?.command || 'run'
}

function getNextStrategyId(id) {
  const index = demoStrategyOptions.findIndex((option) => option.id === id)

  if (index < 0) {
    return demoStrategyOptions[0]?.id || ''
  }

  return demoStrategyOptions[(index + 1) % demoStrategyOptions.length]?.id || id
}

function getSelectionIdFromPrompt(prompt) {
  const normalized = String(prompt || '').trim().toLowerCase()

  if (!normalized) {
    return ''
  }

  const keywordSets = [
    { id: 'watch-launchpad-events', keywords: ['pump', 'graduation', 'graduate', 'pumpfun', 'launchpad', 'moon', 'created', 'creation', 'completed', 'completion', 'migrated', 'migration'] },
    { id: 'search-twitter', keywords: ['twitter', 'social', 'ticker', 'search', 'contract', 'giga'] },
    { id: 'follow-smart-money', keywords: ['smart money', 'wallet flow', 'eth', 'sol', 'rotation', 'inflow', 'outflow'] },
    { id: 'copy-wallets', keywords: ['copy wallet', 'copy trade', 'copy trader', 'copy traders', 'mirror wallet', 'tracked wallet', 'top traders'] },
    { id: 'scan-live-tokens', keywords: ['breakout', 'volume spike', 'new token', 'momentum', 'honeypot', 'scam', 'bonk', 'jup', 'shdw'] },
  ]

  const matched = keywordSets.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)))

  return matched ? matched.id : ''
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
    case 'liquidity':
      return { text: 'POOL', tone: 'meta' }
    case 'wallets':
      return { text: 'WALLET', tone: 'meta' }
    case 'market':
      return { text: 'MARKET', tone: 'scan' }
    case 'sentiment':
      return { text: 'SOCIAL', tone: 'signal' }
    case 'audit':
      return { text: 'AUDIT', tone: 'risk' }
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

function getScenarioSourceEndpoint(scenario) {
  const profile = scenarioEndpointProfiles[scenario.id]
  if (profile?.source) {
    return profile.source
  }

  if (scenario.id.startsWith('pumpfun-')) {
    return 'WS /ws/launchpadEvents'
  }

  if (scenario.id.startsWith('twitter-')) {
    return 'GET /xSearch'
  }

  if (scenario.id.startsWith('smart-money-')) {
    return 'POST /smartMoneyNetflow'
  }

  return 'GET /newPairs'
}

function getStepEndpoint(scenario, step) {
  const label = String(step?.label || '').trim().toLowerCase()
  const profile = scenarioEndpointProfiles[scenario.id]

  if (profile?.steps?.[label]) {
    return profile.steps[label]
  }

  switch (label) {
    case 'event':
      return getScenarioSourceEndpoint(scenario)
    case 'social':
      return getScenarioSourceEndpoint(scenario)
    case 'search':
      return 'GET /tokenSearch'
    case 'flow':
      return getScenarioSourceEndpoint(scenario)
    case 'meta':
      return 'GET /detailedTokenStats'
    case 'liquidity':
      return 'GET /tokenPoolInfo'
    case 'wallets':
      return 'GET /walletReview + /pnl'
    case 'market':
      return 'GET /marketOverview'
    case 'sentiment':
      return 'GET /xUserLikes + /xUserFollowers'
    case 'audit':
      return 'GET /fullAudit + /isScam'
    case 'scan':
      return 'GET /volatilityScanner'
    case 'risk':
      return 'GET /holderAnalysis + /isScam'
    case 'ta':
      return 'GET /priceHistoryIndicators'
    case 'action':
      return 'Agent Reasoning'
    default:
      return 'Agent Reasoning'
  }
}

function getEndpointCheckLabels(endpoint, fallback = []) {
  const text = String(endpoint || '')

  if (!text || text.includes('Agent Reasoning')) {
    return Array.isArray(fallback) && fallback.length > 0 ? fallback : ['Decision engine']
  }

  const labels = Object.entries(endpointCheckLabelMap)
    .filter(([route]) => text.includes(route))
    .map(([, label]) => label)

  return labels.length > 0 ? [...new Set(labels)] : fallback
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

function getMetricBarValue(type, value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (type === 'safety') {
    const numeric = Number.parseFloat(value)
    if (!Number.isFinite(numeric)) {
      return 14
    }

    return Math.max(6, Math.min(96, Math.round((1 - numeric) * 100)))
  }

  if (type === 'holders') {
    if (normalized === 'low') return 82
    if (normalized === 'medium') return 54
    if (normalized === 'high') return 24
    return 16
  }

  if (type === 'volatility') {
    if (normalized === 'low') return 40
    if (normalized === 'medium') return 62
    if (normalized === 'high') return 84
    return 16
  }

  if (type === 'signal') {
    if (normalized === 'bullish') return 80
    if (normalized === 'bearish') return 30
    if (normalized === 'mixed') return 50
    if (normalized === 'flat') return 42
    if (normalized === 'skipped') return 12
    return 16
  }

  return 16
}

function getMetricBarTone(type, value) {
  const normalized = String(value || '').trim().toLowerCase()

  if (type === 'safety') {
    const numeric = Number.parseFloat(value)

    if (!Number.isFinite(numeric)) {
      return 'neutral'
    }

    if (numeric <= 0.15) return 'good'
    if (numeric <= 0.35) return 'caution'
    return 'danger'
  }

  if (type === 'holders') {
    if (normalized === 'low') return 'good'
    if (normalized === 'medium') return 'caution'
    if (normalized === 'high') return 'danger'
    return 'neutral'
  }

  if (type === 'volatility') {
    if (normalized === 'medium') return 'good'
    if (normalized === 'low') return 'neutral'
    if (normalized === 'high') return 'caution'
    return 'neutral'
  }

  if (type === 'signal') {
    if (normalized === 'bullish') return 'good'
    if (normalized === 'mixed' || normalized === 'flat') return 'neutral'
    if (normalized === 'bearish' || normalized === 'skipped') return 'danger'
    return 'neutral'
  }

  return 'neutral'
}

function getVisualMetrics(metrics) {
  return [
    {
      label: 'Safety',
      value: metrics.scamScore === '--' ? 'Pending' : `score ${metrics.scamScore}`,
      width: getMetricBarValue('safety', metrics.scamScore),
      tone: getMetricBarTone('safety', metrics.scamScore),
    },
    {
      label: 'Holders',
      value: metrics.holderRisk,
      width: getMetricBarValue('holders', metrics.holderRisk),
      tone: getMetricBarTone('holders', metrics.holderRisk),
    },
    {
      label: 'Volatility',
      value: metrics.volatility,
      width: getMetricBarValue('volatility', metrics.volatility),
      tone: getMetricBarTone('volatility', metrics.volatility),
    },
    {
      label: 'Signal',
      value: metrics.macd,
      width: getMetricBarValue('signal', metrics.macd),
      tone: getMetricBarTone('signal', metrics.macd),
    },
  ]
}

const ValueProp = () => {
  const navigate = useNavigate()
  const [agents, setAgents] = useState([])
  const [liveTelemetry, setLiveTelemetry] = useState({})
  const [loopDistance, setLoopDistance] = useState(0)
  const [hasActivatedTerminal, setHasActivatedTerminal] = useState(false)
  const [selectedScenarioId, setSelectedScenarioId] = useState(demoStrategyOptions[0].id)
  const [idleCountdown, setIdleCountdown] = useState(10)
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [activePipelineStep, setActivePipelineStep] = useState(-1)
  const [isBootingFlow, setIsBootingFlow] = useState(false)
  const showcaseRef = useRef(null)
  const trackRef = useRef(null)
  const terminalShellRef = useRef(null)
  const terminalViewportRef = useRef(null)
  const visualStageListRef = useRef(null)
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

  useEffect(() => {
    const target = showcaseRef.current
    if (!target) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasActivatedTerminal(true)
        }
      },
      { threshold: 0.35 },
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
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

    if (!hasActivatedTerminal) {
      return undefined
    }

    if (isBootingFlow) {
      const timeoutId = window.setTimeout(() => {
        setIsBootingFlow(false)
        setActivePipelineStep(0)
      }, 2400)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    if (activePipelineStep < 0) {
      return undefined
    }

    const isFinalStep = activePipelineStep >= activeScenario.steps.length - 1
    const delay = isFinalStep ? 7800 : 4500

    const timeoutId = window.setTimeout(() => {
      if (isFinalStep) {
        setActivePipelineStep(-1)
        setIsBootingFlow(false)
        setSelectedScenarioId((current) => getNextStrategyId(current))
        return
      }

      setActivePipelineStep((current) => current + 1)
    }, delay)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activeScenarioIndex, activePipelineStep, hasActivatedTerminal, isBootingFlow, selectedScenarioId])

  useEffect(() => {
    if (!hasActivatedTerminal || activePipelineStep >= 0 || isBootingFlow) {
      return undefined
    }

    if (idleCountdown <= 0) {
      setActiveScenarioIndex(pickScenarioIndexForSelection(selectedScenarioId))
      setActivePipelineStep(-1)
      setIsBootingFlow(true)
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setIdleCountdown((current) => current - 1)
    }, 1000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [activePipelineStep, hasActivatedTerminal, idleCountdown, isBootingFlow, selectedScenarioId])

  useEffect(() => {
    if (!hasActivatedTerminal) {
      return
    }

    if (activePipelineStep < 0 && !isBootingFlow) {
      setIdleCountdown(10)
    }
  }, [activePipelineStep, hasActivatedTerminal, isBootingFlow])

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
  const selectedStrategyIndex = Math.max(
    demoStrategyOptions.findIndex((strategy) => strategy.id === selectedScenarioId),
    0,
  )
  const selectedScenarioIndex = getStrategyAnchorIndex(selectedScenarioId)
  const currentScenarioIndex = activePipelineStep >= 0
    ? activeScenarioIndex
    : selectedScenarioIndex
  const currentScenario = demoScenarios[currentScenarioIndex]
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
  const terminalCommand = activePipelineStep < 0
    ? 'select-strategy --interactive'
    : currentScenario.command || 'run'
  const visualMetrics = getVisualMetrics(currentPipelineState.metrics)
  const currentEndpoint = isBootingFlow
    ? getScenarioSourceEndpoint(currentScenario)
    : activePipelineStep >= 0
      ? getStepEndpoint(currentScenario, currentPipelineState)
      : getScenarioSourceEndpoint(currentScenario)
  const completedChecks = getEndpointCheckLabels(currentEndpoint, currentPipelineState.activatedChecks || [])
  const pairIsRevealed = activePipelineStep >= getPairRevealStepIndex(currentScenario)
  const displayPair = pairIsRevealed ? currentScenario.pair : 'Candidate pending'
  const liveRunLabel = !hasActivatedTerminal
    ? 'Scroll to start live CLI'
    : isBootingFlow
      ? 'Initializing selected strategy'
    : activePipelineStep < 0
      ? 'Select a strategy'
      : getLiveRunLabel(currentScenario, activePipelineStep, currentPipelineState, hasFinalDecision)
  const liveStatusPill = !hasActivatedTerminal
    ? 'Idle until visible'
    : isBootingFlow
      ? 'Booting flow'
    : activePipelineStep < 0
      ? `Enter to run | auto in ${idleCountdown}s`
      : hasFinalDecision
        ? 'Decision returned'
        : `${visiblePipelineSteps.length} / ${currentScenario.steps.length} checks`
  const menuIsActive = hasActivatedTerminal && activePipelineStep < 0 && !isBootingFlow
  const terminalLines = [
    { kind: 'separator', text: '_______________________________________________' },
    { kind: 'ascii', text: CLAW_CLICK_ASCII.join('\n') },
    { kind: 'separator', text: '_______________________________________________' },
  ]

  if (menuIsActive) {
    terminalLines.push(
      {
        kind: 'menu-heading',
        prefix: '',
        text: 'Select your strategy',
        detail: `Use arrow keys or press 1-${demoStrategyOptions.length}, then hit Enter to run`,
      },
      ...demoStrategyOptions.map((strategy, index) => ({
        kind: index === selectedStrategyIndex ? 'menu-selected' : 'menu-option',
        prefix: index === selectedStrategyIndex ? '>' : `${index + 1}`,
        text: `${index + 1}. ${strategy.label}`,
        detail: strategy.command,
      })),
      {
        kind: 'menu-meta',
        prefix: '',
        text: `Press Enter to run ${getStrategyLabel(selectedScenarioId)}`,
        detail: `Auto run starts in ${idleCountdown}s`,
      },
    )
  } else if (isBootingFlow) {
    terminalLines.push({
      kind: 'meta',
      prefix: 'boot',
      text: 'Starting insight generation',
      detail: `${getStrategyLabel(selectedScenarioId)} selected. initializing live modules`,
      endpoint: getScenarioSourceEndpoint(currentScenario),
    })
  } else {
    terminalLines.push(
      {
        kind: 'meta',
        prefix: 'boot',
        text: getScenarioBootLine(currentScenario),
        detail: pairIsRevealed
          ? `${currentScenario.pair} moved into the pipeline`
          : 'candidate detected. resolving more context',
        endpoint: getScenarioSourceEndpoint(currentScenario),
      },
      ...visiblePipelineSteps.map((step) => {
        const badge = getStepBadge(step)

        return {
          kind: 'stage',
          prefix: step.time,
          badge,
          text: step.title,
          detail: step.detail,
          endpoint: getStepEndpoint(currentScenario, step),
        }
      }),
    )
  }

  if (activePipelineStep >= 0 && hasFinalDecision) {
    terminalLines.push({
      kind: `decision ${decisionTone}`,
      prefix: 'model',
      badge: {
        text: currentPipelineState.decision,
        tone: decisionTone,
      },
      text: `Decision returned with ${currentPipelineState.confidence} confidence`,
      detail: currentPipelineState.summary || currentScenario.reasoning,
      endpoint: 'Agent Reasoning',
    })

    terminalLines.push({
      kind: 'summary',
      prefix: 'why',
      badge: { text: 'WHY', tone: 'signal' },
      text: `Why it landed on ${currentPipelineState.decision}`,
      detail: `${formatMetricsLine(currentPipelineState.metrics)}.`,
      endpoint: 'Agent Reasoning',
    })
  }

  useEffect(() => {
    const viewport = terminalViewportRef.current
    if (!viewport || !hasActivatedTerminal || activePipelineStep < 0) return

    const syncScroll = () => {
      viewport.scrollTop = viewport.scrollHeight
    }

    syncScroll()
    const raf = requestAnimationFrame(syncScroll)

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [activeScenarioIndex, activePipelineStep, hasActivatedTerminal])

  useEffect(() => {
    const stageList = visualStageListRef.current
    if (!stageList) return

    if (activePipelineStep < 2) {
      stageList.scrollTo({
        top: 0,
        behavior: activePipelineStep < 0 ? 'auto' : 'smooth',
      })
      return
    }

    const activeStage = stageList.querySelector('.api-visual-stage-active, .api-visual-stage-up-next')
    if (!activeStage) {
      stageList.scrollTop = 0
      return
    }

    const targetTop = Math.max(0, activeStage.offsetTop - stageList.clientHeight * 0.32)

    stageList.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    })
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

  useEffect(() => {
    if (!menuIsActive) {
      return
    }

    terminalShellRef.current?.focus({ preventScroll: true })
  }, [menuIsActive, selectedScenarioId])

  const runScenarioByIndex = (scenarioIndex) => {
    if (scenarioIndex < 0 || scenarioIndex >= demoScenarios.length) {
      return
    }

    setHasActivatedTerminal(true)
    setActiveScenarioIndex(scenarioIndex)
    setActivePipelineStep(-1)
    setIsBootingFlow(true)
    setIdleCountdown(10)
  }

  const runSelectedStrategy = (strategyId) => {
    setSelectedScenarioId(strategyId)
    runScenarioByIndex(pickScenarioIndexForSelection(strategyId))
  }

  const handleTerminalMenuKeyDown = (event) => {
    if (!menuIsActive) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedScenarioId((current) => getNextStrategyId(current))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const currentIndex = demoStrategyOptions.findIndex((option) => option.id === selectedScenarioId)
      const nextIndex = currentIndex <= 0 ? demoStrategyOptions.length - 1 : currentIndex - 1
      setSelectedScenarioId(demoStrategyOptions[nextIndex].id)
      return
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault()
      const nextIndex = Number(event.key) - 1
      if (demoStrategyOptions[nextIndex]) {
        setSelectedScenarioId(demoStrategyOptions[nextIndex].id)
      }
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      runSelectedStrategy(selectedScenarioId)
    }
  }

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

        <div className="api-pipeline-showcase" ref={showcaseRef}>
          <div className="api-pipeline-grid">
            <div
              className="api-terminal-shell"
              ref={terminalShellRef}
              tabIndex={0}
              onKeyDown={handleTerminalMenuKeyDown}
            >
              <div className="api-terminal-topbar">
                <div className="api-terminal-dots" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="api-terminal-meta">
                  <span className="api-terminal-title">superapi-terminal</span>
                  <span className="api-terminal-scenario">{liveRunLabel}</span>
                </div>
                <div className="api-terminal-status">
                  <span>{displayPair}</span>
                  <span>{liveStatusPill}</span>
                </div>
              </div>

              <div className="api-terminal-command-row">
                <span className="api-terminal-command-prompt">scan@superapi:~$</span>
                <span className="api-terminal-command-value">{terminalCommand}</span>
              </div>

              <div className="api-terminal-viewport" ref={terminalViewportRef} aria-label="Live terminal pipeline demo">
                {terminalLines.map((line, index) => (
                  (() => {
                    const isMenuLine = line.kind.startsWith('menu')

                    return (
                      <div
                        key={`${activeScenarioIndex}-${activePipelineStep}-${index}-${line.text}`}
                        className={`api-terminal-line api-terminal-line-${line.kind.replace(/\s+/g, '-')}${line.endpoint ? ' api-terminal-line-has-endpoint' : ''}`}
                        onClick={
                          line.kind === 'menu-option' || line.kind === 'menu-selected'
                            ? () => {
                                const menuIndex = Number(line.text.split('.')[0]) - 1
                                const nextStrategy = demoStrategyOptions[menuIndex]
                                if (nextStrategy) {
                                  setSelectedScenarioId(nextStrategy.id)
                                  terminalShellRef.current?.focus({ preventScroll: true })
                                }
                              }
                            : undefined
                        }
                      >
                        <span className="api-terminal-line-prefix">
                          {line.prefix || ''}
                        </span>
                        {!isMenuLine ? (
                          line.badge ? (
                            <span className={`api-terminal-line-badge api-terminal-line-badge-${line.badge.tone}`}>
                              [{line.badge.text}]
                            </span>
                          ) : (
                            <span className="api-terminal-line-badge api-terminal-line-badge-placeholder" aria-hidden="true" />
                          )
                        ) : null}
                        {line.endpoint ? (
                          <span className="api-terminal-line-endpoint">{line.endpoint}</span>
                        ) : null}
                        <span className="api-terminal-line-text">
                          <span className="api-terminal-line-main">{line.text}</span>
                          {line.detail ? (
                            <span className="api-terminal-line-detail">{line.detail}</span>
                          ) : null}
                        </span>
                      </div>
                    )
                  })()
                ))}
              </div>
            </div>

            <aside className={`api-visual-shell api-visual-shell-${decisionTone}`} aria-label="Live scan visualization">
              <div className="api-visual-hero">
                <div className="api-visual-hero-copy">
                  <span className="api-visual-kicker">Live scan map</span>
                  <h3>{displayPair}</h3>
                  <p>
                    {activePipelineStep < 0
                      ? `${getStrategyLabel(selectedScenarioId)} is selected. Press Enter to run it, or wait for auto launch.`
                      : currentPipelineState.summary || currentScenario.reasoning}
                  </p>
                </div>
                <div className={`api-visual-status-rail api-visual-status-rail-${decisionTone}`}>
                  <span className="api-visual-status-label">Decision engine</span>
                  <div className="api-visual-status-main">
                    <strong>{currentPipelineState.decision}</strong>
                    <span className="api-visual-status-confidence">{currentPipelineState.confidence}</span>
                  </div>
                  <span className="api-visual-status-detail">{currentPipelineState.status}</span>
                </div>
              </div>

              <div className="api-visual-panel api-visual-panel-pipeline">
                <div className="api-visual-panel-header">
                  <span>Pipeline</span>
                  <span>{Math.max(activePipelineStep + 1, 0)} / {currentScenario.steps.length} complete</span>
                </div>
                <div className="api-visual-stage-list" ref={visualStageListRef}>
                  {currentScenario.steps.map((step, index) => {
                    let stageState = 'queued'

                    if (activePipelineStep < 0) {
                      stageState = index === 0 ? 'up-next' : 'queued'
                    } else if (index < activePipelineStep) {
                      stageState = 'complete'
                    } else if (index === activePipelineStep) {
                      stageState = 'active'
                    }

                    return (
                      <div
                        key={`${currentScenario.id}-${step.label}-${step.time}`}
                        className={`api-visual-stage api-visual-stage-${stageState}`}
                      >
                        <span className="api-visual-stage-dot" aria-hidden="true" />
                        <div className="api-visual-stage-copy">
                          <strong>{step.label}</strong>
                          <span>{stageState === 'queued' || stageState === 'up-next' ? getQueuedStageText(step) : step.title}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="api-visual-panel api-visual-panel-metrics">
                <div className="api-visual-panel-header">
                  <span>Model read</span>
                  <span>{currentPipelineState.status}</span>
                </div>
                <div className="api-visual-metric-list">
                  {visualMetrics.map((metric) => (
                    <div key={`${currentScenario.id}-${metric.label}`} className="api-visual-metric">
                      <div className="api-visual-metric-topline">
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                      </div>
                      <div className="api-visual-metric-track">
                        <span
                          className={`api-visual-metric-fill api-visual-metric-fill-${metric.tone}`}
                          style={{ width: `${metric.width}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="api-visual-panel api-visual-panel-checks">
                <div className="api-visual-panel-header">
                  <span>Checks used</span>
                  <span>{completedChecks.length || 1} active</span>
                </div>
                <div className="api-visual-checks">
                  {(completedChecks.length > 0 ? completedChecks : ['Listening']).map((check) => (
                    <span key={`${currentScenario.id}-${check}`} className="api-visual-check-pill">
                      {check}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
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
