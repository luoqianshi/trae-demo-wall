import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface FileEvent {
  path: string
  kind: string
}

export function FileMonitor() {
  const { t } = useTranslation()
  const [events, setEvents] = useState<FileEvent[]>([])

  useEffect(() => {
    // 监听文件系统事件
    const unlisten = listen<FileEvent>('file-system-event', (event) => {
      setEvents(prev => [...prev, event.payload])
    })

    // 启动文件监控
    const startMonitoring = async () => {
      try {
        await invoke('start_file_monitoring', {
          path: 'C:\\Users\\YourName\\Documents'  // 要监控的路径
        })
      } catch (e) {
        console.error(t('fileMonitor.errors.startFailed'), e)
      }
    }

    startMonitoring()

    return () => {
      unlisten.then(fn => fn())  // 清理监听器
    }
  }, [t])

  const getEventType = (kind: string) => {
    if (kind.includes('Create')) return t('fileMonitor.events.created')
    if (kind.includes('Remove')) return t('fileMonitor.events.deleted')
    if (kind.includes('Modify')) return t('fileMonitor.events.modified')
    if (kind.includes('Rename')) return t('fileMonitor.events.renamed')
    return kind
  }

  return (
    <div>
      <h2>{t('fileMonitor.title')}</h2>
      <ul>
        {events.map((event, index) => (
          <li key={index}>
            {event.path} - {getEventType(event.kind)}
          </li>
        ))}
      </ul>
    </div>
  )
} 