import { useEffect, useMemo, useState } from 'react'
import { Cookie, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  cookiePlatforms,
  getPlatformCookieSetting,
  updatePlatformCookieSetting,
  type PlatformCookieDefinition,
  type PlatformCookieSetting,
} from './cookie-settings-store'

export function CookieSettingsPage() {
  const [statuses, setStatuses] = useState<Record<string, PlatformCookieSetting | null>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null)

  const platforms = useMemo<PlatformCookieDefinition[]>(
    () => cookiePlatforms.map((platform) => ({ ...platform, status: statuses[platform.id] })),
    [statuses]
  )

  const loadPlatform = async (platform: PlatformCookieDefinition) => {
    const status = await getPlatformCookieSetting(platform.id)
    setStatuses((prev) => ({ ...prev, [platform.id]: status }))
  }

  const loadAll = async () => {
    setLoading(true)
    try {
      const entries = await Promise.all(
        cookiePlatforms.map(async (platform) => [platform.id, await getPlatformCookieSetting(platform.id)] as const)
      )
      setStatuses(Object.fromEntries(entries))
    } catch (error) {
      console.error(error)
      toast.error('Cookie 状态加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  const handleSave = async (platform: PlatformCookieDefinition) => {
    const value = inputs[platform.id]?.trim()
    if (!value) {
      toast.error(`请粘贴${platform.name} Cookie`)
      return
    }
    setSavingPlatform(platform.id)
    try {
      const next = await updatePlatformCookieSetting(platform.id, value)
      setStatuses((prev) => ({ ...prev, [platform.id]: next }))
      setInputs((prev) => ({ ...prev, [platform.id]: '' }))
      toast.success(`${platform.name} Cookie 已保存`)
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : `${platform.name} Cookie 保存失败`)
    } finally {
      setSavingPlatform(null)
    }
  }

  return (
    <>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>Cookie 管理</h1>
              <Badge variant='secondary'>平台凭证</Badge>
            </div>
            <p className='text-muted-foreground'>
              集中管理外部平台网页端 Cookie。抖音、小红书、B站、公众号等平台凭证后续都放在这里统一维护。
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={() => void loadAll()} disabled={loading}>
            <RefreshCw className='mr-2 size-4' />
            刷新状态
          </Button>
        </div>
      </div>

      <Separator className='my-4 shadow-sm' />

      <div className='faded-bottom no-scrollbar flex flex-1 flex-col gap-4 overflow-auto pb-16'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <ShieldCheck className='size-4' />
              安全说明
            </CardTitle>
            <CardDescription>
              Cookie 属于敏感凭证，只在服务端保存和使用。页面仅显示脱敏预览，不回显完整 Cookie；更新时重新粘贴覆盖即可。
            </CardDescription>
          </CardHeader>
        </Card>

        {platforms.map((platform) => {
          const status = platform.status
          const saving = savingPlatform === platform.id
          return (
            <Card key={platform.id}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-sm'>
                  <Cookie className='size-4' />
                  {platform.name} Cookie
                  <Badge variant={status?.configured ? 'default' : 'outline'}>
                    {status?.configured ? '已配置' : '未配置'}
                  </Badge>
                </CardTitle>
                <CardDescription>{platform.description}</CardDescription>
              </CardHeader>
              <CardContent className='flex flex-col gap-3'>
                <div className='rounded-md border bg-muted/30 p-3 text-sm'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-muted-foreground'>当前状态:</span>
                    <Badge variant={status?.configured ? 'default' : 'outline'}>
                      {status?.configured ? `已保存 ${status.cookieCount || 0} 个 Cookie` : '尚未保存'}
                    </Badge>
                    <Badge variant='secondary'>{platform.usage}</Badge>
                    {status?.updateTime && (
                      <span className='text-xs text-muted-foreground'>更新时间: {new Date(status.updateTime).toLocaleString()}</span>
                    )}
                  </div>
                  {status?.maskedCookie && (
                    <p className='mt-2 break-all text-xs text-muted-foreground'>{status.maskedCookie}</p>
                  )}
                </div>

                <div className='flex flex-col gap-2'>
                  <Label htmlFor={`${platform.id}-cookie`}>粘贴 Cookie</Label>
                  <Textarea
                    id={`${platform.id}-cookie`}
                    value={inputs[platform.id] ?? ''}
                    onChange={(event) => setInputs((prev) => ({ ...prev, [platform.id]: event.target.value }))}
                    placeholder={`支持：${platform.supportedFormats.join(' / ')}`}
                    rows={7}
                  />
                  <p className='text-xs text-muted-foreground'>
                    支持直接粘贴 EditThisCookie V3 导出的 JSON，也支持浏览器请求头里的 name=value; name2=value2 格式。
                  </p>
                </div>

                <div className='flex justify-end gap-2'>
                  <Button variant='outline' size='sm' onClick={() => void loadPlatform(platform)} disabled={loading || saving}>
                    <RefreshCw className='mr-2 size-4' />
                    获取状态
                  </Button>
                  <Button size='sm' onClick={() => void handleSave(platform)} disabled={saving || !inputs[platform.id]?.trim()}>
                    <Save className='mr-2 size-4' />
                    {saving ? '保存中...' : '保存/更新 Cookie'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
