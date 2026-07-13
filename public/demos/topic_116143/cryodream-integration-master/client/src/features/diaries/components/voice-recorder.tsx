import { Loader2, Mic, Send, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { diaryApi } from '../api/diary-api'
import { useAudioRecorder } from '../hooks/use-audio-recorder'

interface VoiceRecorderProps {
  onTranscribed: (plainText: string, audioUrl: string, durationSec: number) => void
}

export function VoiceRecorder({ onTranscribed }: VoiceRecorderProps) {
  const { state, seconds, start, stop, cancel, setState } = useAudioRecorder()

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const handleStart = async () => {
    try {
      await start()
    } catch {
      toast.error('麦克风启动失败，请检查权限')
    }
  }

  const handleStop = async () => {
    try {
      const blob = await stop()
      if (blob.size < 1000) {
        toast.warning('录音太短，请重试')
        return
      }
      setState('uploading')
      toast.info('正在转写语音...')
      const result = await diaryApi.transcribe(blob)
      toast.success(`转写完成（${result.durationSec}s）`)
      onTranscribed(result.plainText, result.audioUrl, result.durationSec)
    } catch (e) {
      toast.error('语音转写失败：' + (e as Error).message)
    } finally {
      setState('idle')
    }
  }

  const handleCancel = () => {
    cancel()
  }

  if (state === 'idle') {
    return (
      <Button onClick={handleStart} size='sm'>
        <Mic className='size-3.5' data-icon='inline-start' />
        语音输入
      </Button>
    )
  }

  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-2 rounded-lg border bg-red-50 px-3 py-1.5 dark:bg-red-900/20'>
        <span className='size-2 animate-pulse rounded-full bg-red-500' />
        <span className='font-mono text-sm font-medium tabular-nums'>
          {formatTime(seconds)}
        </span>
      </div>
      <Button variant='outline' size='sm' onClick={handleCancel}>
        <X className='size-3.5' />
        取消
      </Button>
      {state === 'uploading' ? (
        <Button size='sm' disabled>
          <Loader2 className='size-3.5 animate-spin' />
          转写中...
        </Button>
      ) : (
        <Button size='sm' onClick={handleStop}>
          <Send className='size-3.5' />
          完成
        </Button>
      )}
    </div>
  )
}
