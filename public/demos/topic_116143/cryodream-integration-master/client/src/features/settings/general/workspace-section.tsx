import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ExternalLink,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
  MonitorOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useElectron, useWorkspace } from '@/hooks/use-electron'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** 从 Electron IPC 错误信息里提取有用部分（去掉前缀噪声） */
function extractWorkspaceError(raw: string): string {
  // Electron 抛出的错误一般格式：Error invoking remote method 'workspace:select': Error: <真实错误>
  const m = raw.match(/Error:\s*([^]*)$/)
  return (m ? m[1] : raw).trim()
}

export function WorkspaceSection() {
  const { t } = useTranslation()
  const { isElectron } = useElectron()
  const { current, select, refresh, openInExplorer } = useWorkspace()
  const [selecting, setSelecting] = useState(false)

  // ========== 非 Electron 环境 ==========
  if (!isElectron) {
    return (
      <div className='rounded-xl border border-dashed bg-muted/20 p-8 text-center'>
        <div className='mx-auto flex size-12 items-center justify-center rounded-full bg-muted'>
          <MonitorOff className='size-5 text-muted-foreground' />
        </div>
        <div className='mt-4 text-sm font-semibold'>
          {t('settings.general.workspace.title')}
        </div>
        <p className='mx-auto mt-1 max-w-md text-xs text-muted-foreground'>
          {t('settings.general.workspace.webNotAvailable')}
        </p>
      </div>
    )
  }

  const handleSelect = async () => {
    setSelecting(true)
    try {
      const ws = await select()
      if (ws) {
        toast.success(t('settings.general.workspace.selected', { name: ws.name }))
        // 切换工作区后需要重启后端才能使 comfyui 输出目录生效
        await restartBackendAfterSwitch()
      }
    } catch (err) {
      // IPC handler 抛出的 WorkspaceInitError 会带上 code 和 details
      const raw = err instanceof Error ? err.message : String(err)
      const detail = extractWorkspaceError(raw)
      toast.error(
        detail
          ? `${t('settings.general.workspace.selectFailed')}: ${detail}`
          : t('settings.general.workspace.selectFailed'),
        { duration: 8000 }
      )
      console.error('[workspace] select failed:', err)
    } finally {
      setSelecting(false)
    }
  }

  // 手动重新验证/授权当前工作区（不切换目录，直接对当前目录 icacls + 探针）
  const handleVerifyPermissions = async () => {
    const verify = window.electron?.workspace.verifyPermissions
    if (!verify) return
    const tId = toast.loading(t('settings.general.workspace.verifying'))
    try {
      const result = await verify()
      toast.dismiss(tId)
      console.log('[workspace] verifyPermissions 返回:', result)
      if (result.ok) {
        const warningLines = result.warnings ?? []
        if (warningLines.length > 0) {
          console.warn('[workspace] 授权过程中有 warning:', warningLines)
          toast.warning(t('settings.general.workspace.verifyOk'), {
            description: warningLines.join('\n'),
            duration: 15000,
          })
        } else {
          toast.success(t('settings.general.workspace.verifyOk'), {
            description: t('settings.general.workspace.verifyOkDesc'),
            duration: 6000,
          })
        }
      } else {
        console.error('[workspace] 权限校验失败:', result)
        toast.error(result.message, {
          description: `code=${result.code}${result.details ? '\n' + result.details : ''}`,
          duration: 20000,
        })
      }
    } catch (err) {
      toast.dismiss(tId)
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[workspace] verifyPermissions 抛出异常:', err)
      toast.error(msg, { duration: 15000 })
    }
  }

  const restartBackendAfterSwitch = async () => {
    const restart = window.electron?.app.restartBackend
    if (!restart) return
    const tId = toast.loading(t('settings.general.workspace.restartingBackend'))
    try {
      const ok = await restart()
      toast.dismiss(tId)
      if (ok) {
        toast.success(t('settings.general.workspace.backendRestarted'))
      } else {
        toast.error(t('settings.general.workspace.backendRestartFailed'))
      }
    } catch (err) {
      toast.dismiss(tId)
      toast.error(t('settings.general.workspace.backendRestartFailed'))
      console.error(err)
    }
  }

  const handleOpenInExplorer = async () => {
    try {
      await openInExplorer()
    } catch (err) {
      toast.error(t('settings.general.workspace.openFailed'))
      console.error(err)
    }
  }

  return (
    // 单工作区：仅展示 / 更换 / 打开
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card shadow-sm transition-colors',
        current && 'border-primary/40'
      )}
    >
      {/* 装饰性径向渐变 */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent'
      />

      <div className='relative p-5'>
        <div className='flex items-start gap-4'>
          <div
            className={cn(
              'flex size-12 flex-none items-center justify-center rounded-xl',
              current
                ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {current ? <FolderOpen className='size-6' /> : <Folder className='size-6' />}
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-sm font-semibold leading-none'>
                {t('settings.general.workspace.title')}
              </h3>
              {current ? (
                <Badge variant='secondary' className='h-5 gap-1 font-normal'>
                  <span className='size-1.5 rounded-full bg-emerald-500' />
                  {t('settings.general.workspace.active')}
                </Badge>
              ) : (
                <Badge variant='outline' className='h-5 gap-1 font-normal'>
                  <span className='size-1.5 rounded-full bg-amber-500' />
                  {t('settings.general.workspace.needSetup')}
                </Badge>
              )}
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              {t('settings.general.workspace.description')}
            </p>
          </div>
        </div>

        {/* 当前工作区名 + 路径 */}
        <div className='mt-4 space-y-2'>
          {current ? (
            <>
              <div className='text-sm font-medium'>{current.name}</div>
              <div className='flex items-center gap-2 rounded-lg border bg-muted/30 py-2 pe-2 ps-3 font-mono text-xs'>
                <span className='truncate' title={current.path}>
                  {current.path}
                </span>
                <Button
                  size='sm'
                  variant='ghost'
                  className='ms-auto h-6 gap-1 px-2 text-xs opacity-70 hover:opacity-100'
                  onClick={handleOpenInExplorer}
                >
                  <ExternalLink className='size-3' />
                  {t('settings.general.workspace.openInExplorer')}
                </Button>
              </div>
            </>
          ) : (
            <div className='rounded-lg border border-dashed bg-muted/10 p-4 text-center text-xs text-muted-foreground'>
              {t('settings.general.workspace.notSelected')}
            </div>
          )}
        </div>

        {/* 主操作行：只有 更换 / 刷新 */}
        <div className='mt-4 flex flex-wrap items-center gap-2'>
          <Button onClick={handleSelect} disabled={selecting} className='gap-1.5'>
            {selecting ? (
              <Loader2 className='size-4 animate-spin' />
            ) : (
              <FolderPlus className='size-4' />
            )}
            {current
              ? t('settings.general.workspace.changeButton')
              : t('settings.general.workspace.selectButton')}
          </Button>
          <Button
            variant='outline'
            onClick={refresh}
            disabled={selecting}
            className='gap-1.5'
          >
            <RefreshCw className='size-4' />
            {t('common.refresh')}
          </Button>
          {current && (
            <Button
              variant='ghost'
              onClick={handleVerifyPermissions}
              disabled={selecting}
              className='gap-1.5'
              title={t('settings.general.workspace.verifyHint')}
            >
              <ShieldCheck className='size-4' />
              {t('settings.general.workspace.verifyButton')}
            </Button>
          )}
        </div>

        {/* 提示：只允许一个工作区 + 目录结构说明 */}
        <p className='mt-3 text-[11px] leading-relaxed text-muted-foreground'>
          {t('settings.general.workspace.singleOnlyHint')}
          <br />
          <span className='font-mono'>{`${current?.path ?? '<workspace>'}\\canvas`}</span>
          {' — '}
          {t('settings.general.workspace.canvasDirDesc')}
        </p>
      </div>
    </div>
  )
}
