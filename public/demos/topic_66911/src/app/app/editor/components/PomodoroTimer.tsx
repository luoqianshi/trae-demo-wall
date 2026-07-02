'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Play, Pause, RotateCcw, Settings, Coffee, Brain, Clock } from 'lucide-react'

interface PomodoroTimerProps {
  onSessionComplete?: (minutes: number) => void
  className?: string
}

export default function PomodoroTimer({ onSessionComplete, className = '' }: PomodoroTimerProps) {
  const DEFAULT_WORK = 25 * 60
  const DEFAULT_BREAK = 5 * 60
  const DEFAULT_LONG_BREAK = 15 * 60

  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK)
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK)
  const [longBreakDuration, setLongBreakDuration] = useState(DEFAULT_LONG_BREAK)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'work' | 'break' | 'longBreak'>('work')
  const [sessions, setSessions] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startTimer = () => {
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSessionComplete()
          return prev
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const resetTimer = () => {
    pauseTimer()
    switch (mode) {
      case 'work':
        setTimeLeft(workDuration)
        break
      case 'break':
        setTimeLeft(breakDuration)
        break
      case 'longBreak':
        setTimeLeft(longBreakDuration)
        break
    }
  }

  const handleSessionComplete = () => {
    pauseTimer()
    
    if (mode === 'work') {
      const newSessions = sessions + 1
      setSessions(newSessions)
      onSessionComplete?.(workDuration / 60)
      
      // 每4个工作周期后进入长休息
      if (newSessions % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(longBreakDuration)
      } else {
        setMode('break')
        setTimeLeft(breakDuration)
      }
    } else {
      setMode('work')
      setTimeLeft(workDuration)
    }
    
    // 播放提示音
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioCtx = new AudioContext()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      
      oscillator.frequency.value = mode === 'work' ? 800 : 600
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
      
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.5)
    }
  }

  const switchMode = (newMode: 'work' | 'break' | 'longBreak') => {
    pauseTimer()
    setMode(newMode)
    switch (newMode) {
      case 'work':
        setTimeLeft(workDuration)
        break
      case 'break':
        setTimeLeft(breakDuration)
        break
      case 'longBreak':
        setTimeLeft(longBreakDuration)
        break
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getCurrentDuration = () => {
    switch (mode) {
      case 'work':
        return workDuration
      case 'break':
        return breakDuration
      case 'longBreak':
        return longBreakDuration
    }
  }

  const progress = ((getCurrentDuration() - timeLeft) / getCurrentDuration()) * 100

  const modeConfig = {
    work: {
      icon: Brain,
      label: '专注',
      color: 'text-cinnabar',
      bg: 'from-red-50 to-orange-50',
      border: 'border-red-100',
      progress: 'bg-cinnabar'
    },
    break: {
      icon: Coffee,
      label: '小憩',
      color: 'text-green-600',
      bg: 'from-green-50 to-emerald-50',
      border: 'border-green-100',
      progress: 'bg-green-600'
    },
    longBreak: {
      icon: Clock,
      label: '长休',
      color: 'text-blue-600',
      bg: 'from-blue-50 to-indigo-50',
      border: 'border-blue-100',
      progress: 'bg-blue-600'
    }
  }

  const config = modeConfig[mode]
  const Icon = config.icon

  return (
    <div className={`p-4 bg-gradient-to-br ${config.bg} rounded-xl border ${config.border} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${config.color}`} />
          <span className="text-sm font-medium text-ink">
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {sessions > 0 && (
            <span className="text-xs text-ink-muted bg-white/60 px-2 py-0.5 rounded-full">
              {sessions} 轮
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 text-ink-muted hover:text-ink hover:bg-white/60 rounded-lg transition-colors"
            title="设置"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timer display */}
      <div className="text-center mb-3">
        <span className={`text-4xl font-mono font-bold ${config.color} tracking-wider`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/60 rounded-full h-2 mb-4 overflow-hidden">
        <div
          className={`h-full ${config.progress} transition-all duration-300 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition-all ${
            isRunning
              ? 'bg-white/80 text-ink hover:bg-white'
              : `${config.color} bg-white hover:bg-white/80`
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              暂停
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              开始
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="p-2 text-ink-muted hover:text-ink hover:bg-white/60 rounded-lg transition-colors"
          title="重置"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Mode switch buttons */}
      <div className="flex items-center justify-center gap-1 mt-3">
        {(['work', 'break', 'longBreak'] as const).map((m) => {
          const mConfig = modeConfig[m]
          const MIcon = mConfig.icon
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === m
                  ? `${mConfig.color} bg-white shadow-sm`
                  : 'text-ink-muted hover:text-ink hover:bg-white/60'
              }`}
            >
              <MIcon className="w-3 h-3" />
              {mConfig.label}
            </button>
          )
        })}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-white/40 space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-ink-muted">专注时长（分钟）</label>
            <input
              type="number"
              min="1"
              max="60"
              value={workDuration / 60}
              onChange={(e) => {
                const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 25))
                setWorkDuration(val * 60)
                if (mode === 'work' && !isRunning) {
                  setTimeLeft(val * 60)
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-white/80 border border-white/40 rounded-lg text-ink focus:outline-none focus:border-ochre"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-ink-muted">小憩时长（分钟）</label>
            <input
              type="number"
              min="1"
              max="30"
              value={breakDuration / 60}
              onChange={(e) => {
                const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 5))
                setBreakDuration(val * 60)
                if (mode === 'break' && !isRunning) {
                  setTimeLeft(val * 60)
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-white/80 border border-white/40 rounded-lg text-ink focus:outline-none focus:border-ochre"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-ink-muted">长休时长（分钟）</label>
            <input
              type="number"
              min="1"
              max="60"
              value={longBreakDuration / 60}
              onChange={(e) => {
                const val = Math.max(1, Math.min(60, parseInt(e.target.value) || 15))
                setLongBreakDuration(val * 60)
                if (mode === 'longBreak' && !isRunning) {
                  setTimeLeft(val * 60)
                }
              }}
              className="w-full px-3 py-1.5 text-sm bg-white/80 border border-white/40 rounded-lg text-ink focus:outline-none focus:border-ochre"
            />
          </div>
        </div>
      )}
    </div>
  )
}