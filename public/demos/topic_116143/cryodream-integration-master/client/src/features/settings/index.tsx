import { Outlet } from '@tanstack/react-router'
import { Monitor, Bell, Palette, Wrench, UserCog, Settings2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { SidebarNav } from './components/sidebar-nav'
import { useTranslation } from 'react-i18next'

export function Settings() {
  const { t } = useTranslation()
  const sidebarNavItems = [
    {
      title: t('common.general'),
      href: '/settings/general',
      icon: <Settings2 size={18} />,
    },
    {
      title: t('common.profile'),
      href: '/settings',
      icon: <UserCog size={18} />,
    },
    {
      title: t('common.account'),
      href: '/settings/account',
      icon: <Wrench size={18} />,
    },
    {
      title: t('common.appearance'),
      href: '/settings/appearance',
      icon: <Palette size={18} />,
    },
    {
      title: t('common.notifications'),
      href: '/settings/notifications',
      icon: <Bell size={18} />,
    },
    {
      title: t('common.display'),
      href: '/settings/display',
      icon: <Monitor size={18} />,
    },
  ]

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
      </Header>

      <Main fixed>
        <div className='space-y-0.5'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {t('common.settings')}
          </h1>
          <p className='text-muted-foreground'>
            {t('common.manageYourAccountSettingsAndSetEPrefs')}
          </p>
        </div>
        <Separator className='my-4 lg:my-6' />
        <div className='flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <aside className='top-0 lg:sticky lg:w-1/5'>
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className='flex w-full overflow-y-hidden p-1'>
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  )
}
