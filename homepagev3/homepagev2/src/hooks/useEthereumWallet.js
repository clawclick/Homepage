import { useCallback, useEffect, useMemo, useState } from 'react'

function getEthereum() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.ethereum || null
}

function parseEthToWeiHex(amount) {
  const [wholePart, fractionPart = ''] = String(amount).split('.')
  const whole = BigInt(wholePart || '0') * 10n ** 18n
  const fraction = BigInt((fractionPart.padEnd(18, '0').slice(0, 18) || '0'))
  return `0x${(whole + fraction).toString(16)}`
}

export function useEthereumWallet() {
  const [account, setAccount] = useState('')
  const [chainId, setChainId] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  const refreshWallet = useCallback(async () => {
    const ethereum = getEthereum()
    if (!ethereum) {
      setAccount('')
      setChainId('')
      return
    }

    const [accounts, currentChainId] = await Promise.all([
      ethereum.request({ method: 'eth_accounts' }),
      ethereum.request({ method: 'eth_chainId' }),
    ])

    setAccount(accounts?.[0] || '')
    setChainId(currentChainId || '')
  }, [])

  useEffect(() => {
    const ethereum = getEthereum()
    if (!ethereum) {
      return undefined
    }

    refreshWallet().catch(() => {})

    const handleAccountsChanged = (accounts) => {
      setAccount(accounts?.[0] || '')
    }

    const handleChainChanged = (nextChainId) => {
      setChainId(nextChainId || '')
    }

    ethereum.on?.('accountsChanged', handleAccountsChanged)
    ethereum.on?.('chainChanged', handleChainChanged)

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      ethereum.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [refreshWallet])

  const connect = useCallback(async () => {
    const ethereum = getEthereum()
    if (!ethereum) {
      throw new Error('MetaMask is required to continue.')
    }

    setIsConnecting(true)
    setError('')

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
      const nextChainId = await ethereum.request({ method: 'eth_chainId' })
      setAccount(accounts?.[0] || '')
      setChainId(nextChainId || '')
      return accounts?.[0] || ''
    } catch (walletError) {
      const message = walletError?.message || 'Wallet connection failed.'
      setError(message)
      throw new Error(message)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const sendTransaction = useCallback(async ({ to, valueEth }) => {
    const ethereum = getEthereum()
    if (!ethereum) {
      throw new Error('MetaMask is required to send payment.')
    }

    if (!account) {
      throw new Error('Connect your wallet before sending a transaction.')
    }

    return ethereum.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: account,
          to,
          value: parseEthToWeiHex(valueEth),
        },
      ],
    })
  }, [account])

  return useMemo(() => ({
    account,
    chainId,
    isConnected: Boolean(account),
    isConnecting,
    error,
    hasProvider: Boolean(getEthereum()),
    connect,
    refreshWallet,
    sendTransaction,
  }), [account, chainId, connect, error, isConnecting, refreshWallet, sendTransaction])
}
