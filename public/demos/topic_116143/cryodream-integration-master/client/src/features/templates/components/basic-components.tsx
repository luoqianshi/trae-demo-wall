'use client'

import { useTranslation } from 'react-i18next'
import { Bell, Settings, User, Mail, Phone, MapPin, Calendar, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { Search } from '@/components/search'

export default function ComponentsExample() {
  const { t } = useTranslation()

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main Content ===== */}
      <Main fixed>
        {/* Tabs 包裹整个区域 */}
        <Tabs defaultValue='basic' className='flex h-full flex-col'>
          {/* 固定区域：标题、按钮和 TabsList */}
          <div className='shrink-0 space-y-4'>
            <div className='flex items-center justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <h1 className='text-2xl font-bold tracking-tight'>
                  {t('templates.componentsExample')}
                </h1>
                <Badge variant='secondary'>Components</Badge>
              </div>
              <p className='text-muted-foreground'>
                {t('templates.componentsExampleDesc')}
              </p>
              {/* 右侧主要操作按钮 */}
              <div className='flex gap-2'>
                <Button variant='outline' size='icon'>
                  <Bell className='h-4 w-4' />
                </Button>
                <Button variant='outline' size='icon'>
                  <Settings className='h-4 w-4' />
                </Button>
                <Button className='space-x-1'>
                  <span>{t('common.create')}</span>
                  <Settings size={18} />
                </Button>
              </div>
            </div>

            <Separator className='shadow-sm' />

            {/* TabsList */}
            <TabsList>
              <TabsTrigger value='basic'>{t('components.buttons')}</TabsTrigger>
              <TabsTrigger value='cards'>{t('components.tables')}</TabsTrigger>
              <TabsTrigger value='forms'>{t('components.forms')}</TabsTrigger>
            </TabsList>
          </div>

          {/* 可滚动区域：Tabs 内容 */}
          <div className='faded-bottom no-scrollbar flex-1 overflow-auto pt-4 pb-16'>
            {/* ===== 基础组件 ===== */}
            <TabsContent value='basic' className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {/* 徽章展示 */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>{t('components.badge')}</CardTitle>
                  <CardDescription>{t('components.badgeDesc')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex flex-wrap gap-2'>
                    <Badge>{t('components.default')}</Badge>
                    <Badge variant='secondary'>{t('components.secondary')}</Badge>
                    <Badge variant='outline'>{t('components.outline')}</Badge>
                    <Badge variant='destructive'>{t('components.destructive')}</Badge>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Badge className='bg-green-500'>{t('components.success')}</Badge>
                    <Badge className='bg-blue-500'>{t('components.info')}</Badge>
                    <Badge className='bg-yellow-500'>{t('components.warning')}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 头像展示 */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>{t('components.avatar')}</CardTitle>
                  <CardDescription>{t('components.avatarDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-4'>
                    <Avatar>
                      <AvatarImage src='https://api.dicebear.com/7.x/avataaars/svg?seed=component' />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback className='bg-primary text-primary-foreground'>
                        UI
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardContent>
              </Card>

              {/* 进度条展示 */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>{t('components.progress')}</CardTitle>
                  <CardDescription>{t('components.progressDesc')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>{t('components.completion')}</span>
                      <span className='text-muted-foreground'>75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>{t('components.uploading')}</span>
                      <span className='text-muted-foreground'>45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>{t('components.downloading')}</span>
                      <span className='text-muted-foreground'>90%</span>
                    </div>
                    <Progress value={90} />
                  </div>
                </CardContent>
              </Card>

              {/* 开关控件 */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>{t('components.switch')}</CardTitle>
                  <CardDescription>{t('components.switchDesc')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='switch-1'>{t('components.notifications')}</Label>
                    <Switch id='switch-1' defaultChecked />
                  </div>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='switch-2'>{t('components.autoSave')}</Label>
                    <Switch id='switch-2' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='switch-3'>{t('components.darkMode')}</Label>
                    <Switch id='switch-3' defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* 滑块控件 */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>{t('components.slider')}</CardTitle>
                  <CardDescription>{t('components.sliderDesc')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>{t('components.volumeControl')}</Label>
                    <Slider defaultValue={[50]} max={100} step={1} />
                  </div>
                  <div className='space-y-2'>
                    <Label>{t('components.brightnessAdjust')}</Label>
                    <Slider defaultValue={[75]} max={100} step={5} />
                  </div>
                </CardContent>
              </Card>

              {/* 按钮展示 */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Button</CardTitle>
                  <CardDescription>{t('components.buttonsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex flex-wrap gap-2'>
                    <Button>{t('components.default')}</Button>
                    <Button variant='secondary'>{t('components.secondary')}</Button>
                    <Button variant='outline'>{t('components.outline')}</Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button variant='ghost'>{t('components.ghost')}</Button>
                    <Button variant='link'>{t('components.link')}</Button>
                    <Button variant='destructive'>{t('components.destructive')}</Button>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button size='sm'>{t('components.small')}</Button>
                    <Button size='lg'>{t('components.large')}</Button>
                    <Button size='icon' variant='outline'>
                      <Settings className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== 卡片组件 ===== */}
          <TabsContent value='cards' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {/* 用户信息卡片 */}
              <Card>
                <CardHeader className='flex flex-row items-center gap-4'>
                  <Avatar className='h-12 w-12'>
                    <AvatarImage src='https://api.dicebear.com/7.x/avataaars/svg?seed=component' />
                    <AvatarFallback>OM</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>John Doe</CardTitle>
                    <CardDescription>Senior Frontend Developer</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Mail className='h-4 w-4 text-muted-foreground' />
                      <span>john.doe@example.com</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Phone className='h-4 w-4 text-muted-foreground' />
                      <span>+1 555-123-4567</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4 text-muted-foreground' />
                      <span>San Francisco, CA</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 统计卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('components.statsCard')}</CardTitle>
                  <CardDescription>{t('components.monthlyStats')}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <div className='text-sm text-muted-foreground'>{t('components.totalRevenue')}</div>
                      <div className='text-2xl font-bold'>$45,231</div>
                    </div>
                    <Badge className='bg-green-500'>+20.1%</Badge>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <div className='text-sm text-muted-foreground'>{t('components.newUsers')}</div>
                      <div className='text-2xl font-bold'>+2,350</div>
                    </div>
                    <Badge className='bg-blue-500'>+180.1%</Badge>
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <div className='text-sm text-muted-foreground'>{t('components.activeUsers')}</div>
                      <div className='text-2xl font-bold'>+12,234</div>
                    </div>
                    <Badge className='bg-green-500'>+19%</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 任务卡片 */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle>Task Progress</CardTitle>
                    <Badge variant='outline'>In Progress</Badge>
                  </div>
                  <CardDescription>Frontend Development</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>Overall Progress</span>
                      <span className='text-muted-foreground'>65%</span>
                    </div>
                    <Progress value={65} />
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm'>
                      <Check className='h-4 w-4 text-green-500' />
                      <span className='text-muted-foreground line-through'>Requirements Analysis</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <Check className='h-4 w-4 text-green-500' />
                      <span className='text-muted-foreground line-through'>UI Design</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <div className='h-4 w-4 rounded-full border-2 border-primary' />
                      <span>Frontend Development</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm'>
                      <div className='h-4 w-4 rounded-full border' />
                      <span className='text-muted-foreground'>Testing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 通知卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Recent notifications</CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-start gap-3 rounded-lg border p-3'>
                    <Bell className='h-5 w-5 text-blue-500' />
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium'>System Update</p>
                      <p className='text-xs text-muted-foreground'>System maintenance scheduled for 11:00 PM tonight</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 rounded-lg border p-3'>
                    <User className='h-5 w-5 text-green-500' />
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium'>New User Registration</p>
                      <p className='text-xs text-muted-foreground'>Jane Smith just registered an account</p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 rounded-lg border p-3'>
                    <Calendar className='h-5 w-5 text-yellow-500' />
                    <div className='flex-1 space-y-1'>
                      <p className='text-sm font-medium'>Meeting Reminder</p>
                      <p className='text-xs text-muted-foreground'>Project meeting tomorrow at 10:00 AM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 活动卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle>最近活动</CardTitle>
                  <CardDescription>用户最近的操作记录</CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback>OM</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 text-sm'>
                      <span className='font-medium'>张三</span>
                      <span className='text-muted-foreground'> 上传了 </span>
                      <span className='font-medium'>项目文档.pdf</span>
                    </div>
                    <span className='text-xs text-muted-foreground'>2 分钟前</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 text-sm'>
                      <span className='font-medium'>李四</span>
                      <span className='text-muted-foreground'> 创建了 </span>
                      <span className='font-medium'>新任务</span>
                    </div>
                    <span className='text-xs text-muted-foreground'>1 小时前</span>
                  </div>
                  <div className='flex items-center gap-3'>
                    <Avatar className='h-8 w-8'>
                      <AvatarFallback>UI</AvatarFallback>
                    </Avatar>
                    <div className='flex-1 text-sm'>
                      <span className='font-medium'>王五</span>
                      <span className='text-muted-foreground'> 更新了 </span>
                      <span className='font-medium'>用户资料</span>
                    </div>
                    <span className='text-xs text-muted-foreground'>3 小时前</span>
                  </div>
                </CardContent>
              </Card>

              {/* 设置卡片 */}
              <Card>
                <CardHeader>
                  <CardTitle>快捷设置</CardTitle>
                  <CardDescription>常用设置项</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Bell className='h-5 w-5 text-muted-foreground' />
                      <div>
                        <div className='text-sm font-medium'>推送通知</div>
                        <div className='text-xs text-muted-foreground'>接收系统推送</div>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Mail className='h-5 w-5 text-muted-foreground' />
                      <div>
                        <div className='text-sm font-medium'>邮件通知</div>
                        <div className='text-xs text-muted-foreground'>接收邮件提醒</div>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <User className='h-5 w-5 text-muted-foreground' />
                      <div>
                        <div className='text-sm font-medium'>隐私模式</div>
                        <div className='text-xs text-muted-foreground'>隐藏个人信息</div>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== 表单组件 ===== */}
          <TabsContent value='forms' className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2'>
              {/* 基本信息表单 */}
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                  <CardDescription>填写您的个人信息</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>姓名</Label>
                    <Input id='name' placeholder='请输入姓名' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>邮箱</Label>
                    <Input id='email' type='email' placeholder='name@example.com' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>手机号</Label>
                    <Input id='phone' placeholder='请输入手机号' />
                  </div>
                  <div className='space-y-2'>
                    <Label>性别</Label>
                    <div className='flex gap-4'>
                      <Button variant='outline' className='flex-1'>男</Button>
                      <Button variant='outline' className='flex-1'>女</Button>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <Button className='flex-1'>保存</Button>
                    <Button variant='outline' className='flex-1'>取消</Button>
                  </div>
                </CardContent>
              </Card>

              {/* 联系表单 */}
              <Card>
                <CardHeader>
                  <CardTitle>联系信息</CardTitle>
                  <CardDescription>您的联系方式</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='address'>地址</Label>
                    <Input id='address' placeholder='请输入详细地址' />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='city'>城市</Label>
                      <Input id='city' placeholder='北京市' />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='zip'>邮编</Label>
                      <Input id='zip' placeholder='100000' />
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='company'>公司</Label>
                    <Input id='company' placeholder='公司名称' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='position'>职位</Label>
                    <Input id='position' placeholder='职位名称' />
                  </div>
                  <Button className='w-full'>更新联系信息</Button>
                </CardContent>
              </Card>

              {/* 偏好设置表单 */}
              <Card>
                <CardHeader>
                  <CardTitle>偏好设置</CardTitle>
                  <CardDescription>自定义您的使用体验</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>主题偏好</Label>
                    <div className='grid grid-cols-3 gap-2'>
                      <Button variant='outline' className='h-20 flex-col gap-2'>
                        <div className='h-8 w-full rounded bg-white border' />
                        <span className='text-xs'>浅色</span>
                      </Button>
                      <Button variant='outline' className='h-20 flex-col gap-2'>
                        <div className='h-8 w-full rounded bg-gray-800 border' />
                        <span className='text-xs'>深色</span>
                      </Button>
                      <Button variant='outline' className='h-20 flex-col gap-2'>
                        <div className='h-8 w-full rounded bg-gradient-to-b from-white to-gray-800 border' />
                        <span className='text-xs'>系统</span>
                      </Button>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label>语言设置</Label>
                    <div className='flex gap-2'>
                      <Button variant='outline' className='flex-1'>简体中文</Button>
                      <Button variant='outline' className='flex-1'>English</Button>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label>时区设置</Label>
                    <div className='flex items-center justify-between rounded-lg border p-3'>
                      <span className='text-sm'>UTC+8 (北京时间)</span>
                      <Badge variant='outline'>当前</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 安全设置表单 */}
              <Card>
                <CardHeader>
                  <CardTitle>安全设置</CardTitle>
                  <CardDescription>保护您的账户安全</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='current-password'>当前密码</Label>
                    <Input id='current-password' type='password' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='new-password'>新密码</Label>
                    <Input id='new-password' type='password' />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='confirm-password'>确认密码</Label>
                    <Input id='confirm-password' type='password' />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='text-sm font-medium'>双重验证</div>
                      <div className='text-xs text-muted-foreground'>启用额外的安全保护</div>
                    </div>
                    <Switch />
                  </div>
                  <Button className='w-full'>更新安全设置</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
        </Tabs>
      </Main>
    </>
  )
}
