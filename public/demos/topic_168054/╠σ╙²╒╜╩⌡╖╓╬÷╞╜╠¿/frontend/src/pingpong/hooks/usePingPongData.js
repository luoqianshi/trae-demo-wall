import { useState, useEffect, useCallback, useRef } from 'react'
import { connectWebSocket, getAnalysisStatus, getAnalysisData, startAnalysis } from '../api/client.js'
import { demoData } from '../data/demoData.js'

/**
 * 乒乓球分析数据管理Hook
 * 负责WebSocket连接、进度跟踪、数据获取
 * 当taskId为'demo'时，使用内置模拟数据，不调用后端API
 * @param {string} taskId - 任务ID，'demo'表示演示模式
 * @returns {{
 *   status: string,
 *   progress: number,
 *   data: Object|null,
 *   error: string|null,
 *   retry: () => void
 * }}
 */
export function usePingPongData(taskId) {
  const [status, setStatus] = useState('connecting')
  const [progress, setProgress] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const wsRef = useRef(null)
  const mountedRef = useRef(true)

  const isDemo = taskId === 'demo'

  const fetchData = useCallback(async () => {
    try {
      const result = await getAnalysisData(taskId)
      if (mountedRef.current) {
        setData(result)
      }
    } catch (e) {
      console.error('获取分析数据失败:', e)
      if (mountedRef.current) {
        setError('获取分析数据失败')
      }
    }
  }, [taskId])

  const pollStatus = useCallback(async () => {
    let attempts = 0
    const maxAttempts = 600
    const interval = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts || !mountedRef.current) {
        clearInterval(interval)
        if (mountedRef.current && status !== 'completed') {
          setError('分析超时')
          setStatus('error')
        }
        return
      }

      try {
        const statusData = await getAnalysisStatus(taskId)
        if (statusData.status === 'completed' || statusData.status === 'done') {
          clearInterval(interval)
          setProgress(100)
          setStatus('completed')
          fetchData()
        } else if (statusData.status === 'error' || statusData.status === 'failed') {
          clearInterval(interval)
          setStatus('error')
          setError('分析失败')
        } else {
          setStatus('analyzing')
          if (statusData.total_frames > 0) {
            const pct = Math.round(
              (statusData.processed_frames / statusData.total_frames) * 100
            )
            setProgress(pct)
          }
        }
      } catch (e) {
        console.error('轮询状态失败:', e)
      }
    }, 1000)
  }, [taskId, status, fetchData])

  const init = useCallback(async () => {
    if (!taskId) return
    setStatus('connecting')
    setError(null)
    setProgress(0)

    try {
      await startAnalysis(taskId)
    } catch (e) {
      console.warn('启动分析:', e)
    }

    const ws = connectWebSocket(
      taskId,
      (msg) => {
        if (!mountedRef.current) return
        setProgress(msg.percentage || 0)
        setStatus('analyzing')
      },
      (msg) => {
        if (!mountedRef.current) return
        setProgress(100)
        setStatus('completed')
        fetchData()
      },
      (err) => {
        if (!mountedRef.current) return
        console.error('WebSocket错误:', err)
        pollStatus()
      }
    )

    wsRef.current = ws
  }, [taskId, fetchData, pollStatus])

  const retry = useCallback(() => {
    if (isDemo) {
      setData(demoData)
      setProgress(100)
      setStatus('completed')
      return
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    init()
  }, [init, isDemo])

  useEffect(() => {
    mountedRef.current = true

    if (isDemo) {
      setData(demoData)
      setProgress(100)
      setStatus('completed')
      return
    }

    init()

    return () => {
      mountedRef.current = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [init, isDemo])

  return { status, progress, data, error, retry }
}
