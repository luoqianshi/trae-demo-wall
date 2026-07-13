import { useTranslation } from 'react-i18next'
import {
  Folder,
  Layout,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Sun,
} from 'lucide-react'
import {
  DirConfig,
  LayoutConfig,
  SidebarConfig,
  ThemeConfig,
} from '@/components/config-drawer'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSidebar } from '@/components/ui/sidebar'
import { useDirection } from '@/context/direction-provider'
import { useLayout } from '@/context/layout-provider'
import { useTheme } from '@/context/theme-provider'
import { useElectron } from '@/hooks/use-electron'
import { useWorkspace } from '@/hooks/use-electron'
import { WorkspaceSection } from './workspace-section'

export function SettingsGeneral() {
  const { t } = useTranslation()
  const { setOpen } = useSidebar()
  const { resetDir } = useDirection()
  const { resetTheme, theme, resolvedTheme } = useTheme()
  const { resetLayout, variant } = useLayout()
  const { isElectron } = useElectron()
  const { current } = useWorkspace()

  const handleResetAll = () => {
    setOpen(true)
    resetDir()
    resetTheme()
    resetLayout()
  }

  const themeLabel =
    theme === 'system' ? t('common.system') : theme === 'dark' ? t('common.dark') : t('common.light')
  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    // 使用 h-full + flex-col + min-h-0 让内容区域受父级 Main(fixed) 高度约束
    <div className='flex h-full w-full min-h-0 flex-1 flex-col'>
      {/* ===== 顶部状态概览 ===== */}
      <div className='flex-none pb-4'>
        <div className='rounded-xl border bg-gradient-to-br from-muted/40 via-background to-background p-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <div className='flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                <Palette className='size-4' />
              </div>
              <div className='leading-tight'>
                <div className='text-sm font-semibold'>
                  {t('common.themeSettings')}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {t('settings.general.overview.hint')}
                </div>
              </div>
            </div>

            <div className='ms-auto flex flex-wrap items-center gap-2'>
              <Badge variant='outline' className='gap-1.5 py-1 font-normal'>
                <ThemeIcon className='size-3.5' />
                <span className='capitalize'>{themeLabel}</span>
              </Badge>
              <Badge variant='outline' className='gap-1.5 py-1 font-normal capitalize'>
                <Layout className='size-3.5' />
                {variant}
              </Badge>
              {isElectron && current && (
                <Badge variant='outline' className='gap-1.5 py-1 font-normal'>
                  <Folder className='size-3.5' />
                  <span className='max-w-[180px] truncate'>{current.name}</span>
                </Badge>
              )}
              <Button
                variant='ghost'
                size='sm'
                onClick={handleResetAll}
                className='h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground'
              >
                <RotateCcw className='size-3.5' />
                {t('common.reset')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 主体：Tab 分区 + 内部滚动 ===== */}
      <Tabs
        defaultValue='workspace'
        className='flex min-h-0 flex-1 flex-col gap-4'
      >
        <TabsList className='flex-none self-start'>
          <TabsTrigger value='workspace' className='gap-1.5'>
            <Folder className='size-4' />
            {t('settings.general.tabs.workspace')}
          </TabsTrigger>
          <TabsTrigger value='appearance' className='gap-1.5'>
            <Palette className='size-4' />
            {t('settings.general.tabs.appearance')}
          </TabsTrigger>
          <TabsTrigger value='layout' className='gap-1.5'>
            <Monitor className='size-4' />
            {t('settings.general.tabs.layout')}
          </TabsTrigger>
        </TabsList>

        {/* ===== 工作区 ===== */}
        <TabsContent
          value='workspace'
          className='min-h-0 flex-1 overflow-y-auto pe-1'
        >
          <WorkspaceSection />
        </TabsContent>

        {/* ===== 外观 / 主题 ===== */}
        <TabsContent
          value='appearance'
          className='min-h-0 flex-1 overflow-y-auto pe-1'
        >
          <SectionCard
            icon={<Palette className='size-4' />}
            title={t('settings.general.appearance.title')}
            description={t('settings.general.appearance.description')}
          >
            <ThemeConfig />
          </SectionCard>
        </TabsContent>

        {/* ===== 布局 ===== */}
        <TabsContent
          value='layout'
          className='min-h-0 flex-1 space-y-4 overflow-y-auto pe-1'
        >
          <SectionCard
            icon={<Monitor className='size-4' />}
            title={t('settings.general.layout.sidebarTitle')}
            description={t('settings.general.layout.sidebarDescription')}
          >
            <SidebarConfig />
          </SectionCard>

          <SectionCard
            icon={<Layout className='size-4' />}
            title={t('settings.general.layout.layoutTitle')}
            description={t('settings.general.layout.layoutDescription')}
          >
            <LayoutConfig />
          </SectionCard>

          <SectionCard
            icon={<RotateCcw className='size-4' />}
            title={t('settings.general.layout.directionTitle')}
            description={t('settings.general.layout.directionDescription')}
          >
            <DirConfig />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ===== 通用卡片容器（比 shadcn Card 更轻量，专为设置块设计） =====
function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className='group/section rounded-xl border bg-card shadow-sm transition-colors hover:border-primary/30'>
      <header className='flex items-start gap-3 p-5'>
        <div className='flex size-9 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary'>
          {icon}
        </div>
        <div className='min-w-0 flex-1'>
          <h3 className='text-sm font-semibold leading-6'>{title}</h3>
          {description && (
            <p className='mt-0.5 text-xs text-muted-foreground'>{description}</p>
          )}
        </div>
      </header>
      <Separator />
      <div className='p-5'>{children}</div>
    </section>
  )
}
