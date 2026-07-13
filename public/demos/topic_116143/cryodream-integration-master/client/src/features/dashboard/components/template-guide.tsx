import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, FolderOpen, Palette, Code2, Zap, Lightbulb, CheckCircle2 } from 'lucide-react'

export function TemplateGuide() {
  const { t } = useTranslation()

  return (
    <div className='space-y-6'>
      {/* 开发规范说明 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {t('dashboard.templateGuideTitle')}
            <Badge variant='secondary'>必读</Badge>
          </CardTitle>
          <CardDescription>
            {t('dashboard.templateGuideDesc')}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 🚀 AI 快速上手指南 */}
      <Card className='border-green-500/20 bg-green-500/5'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-green-600' />
            {t('dashboard.aiQuickStart')}
            <Badge variant='outline'>AI 专用</Badge>
          </CardTitle>
          <CardDescription>
            {t('dashboard.aiQuickStartDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='rounded-lg border bg-card p-4 shadow-sm'>
              <div className='mb-3 flex items-center gap-2'>
                <Lightbulb className='h-5 w-5 text-yellow-500' />
                <h4 className='font-semibold'>{t('dashboard.aiInstructionTitle')}</h4>
              </div>
              <p className='text-sm text-muted-foreground mb-3'>
                {t('dashboard.aiInstructionContent')}
              </p>
              <div className='rounded-md bg-muted p-3 font-mono text-xs'>
                <div className='text-muted-foreground mb-2'>// 给 AI 的提示词示例：</div>
                <div className='text-primary'>
                  "请按照通用开发规范创建一个新的布局组件，参考 docs/template/通用开发规范.md"
                </div>
              </div>
            </div>

            <div className='grid gap-3 md:grid-cols-2'>
              <div className='rounded-lg border bg-card p-4 shadow-sm'>
                <div className='mb-2 flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-green-600' />
                  <h4 className='font-semibold text-sm'>{t('dashboard.aiMustFollow')}</h4>
                </div>
                <ul className='text-xs text-muted-foreground space-y-1'>
                  <li>• Header 和 Main 必须使用 fixed</li>
                  <li>• 标题使用 text-2xl font-bold tracking-tight</li>
                  <li>• 必须添加 Badge 标签</li>
                  <li>• 内容区域使用 faded-bottom no-scrollbar overflow-auto</li>
                  <li>• 按钮图标使用 size={'{'}18{'}'}</li>
                </ul>
              </div>

              <div className='rounded-lg border bg-card p-4 shadow-sm'>
                <div className='mb-2 flex items-center gap-2'>
                  <Code2 className='h-4 w-4 text-blue-600' />
                  <h4 className='font-semibold text-sm'>{t('dashboard.aiCodeStyle')}</h4>
                </div>
                <ul className='text-xs text-muted-foreground space-y-1'>
                  <li>• 导入顺序：React → 路由 → 图标 → UI → 布局</li>
                  <li>• 使用 useTranslation() 进行国际化</li>
                  <li>• 组件使用默认导出</li>
                  <li>• 文件命名使用 kebab-case</li>
                </ul>
              </div>
            </div>

            <div className='rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm'>
              <div className='mb-2 flex items-center gap-2'>
                <Palette className='h-4 w-4 text-amber-600' />
                <h4 className='font-semibold text-sm'>{t('dashboard.aiFlexibleLayout')}</h4>
              </div>
              <ul className='text-xs text-muted-foreground space-y-1'>
                <li>• ✅ Header 可以不加按钮组（如仪表盘）</li>
                <li>• ✅ 标题区域可以简化（无操作按钮）</li>
                <li>• ✅ 根据业务需求调整布局结构</li>
                <li>• ❌ 不建议修改 fixed 属性和标题样式</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 核心规范文档 */}
      <Card className='border-blue-500/20 bg-blue-500/5'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            {t('dashboard.coreSpecs')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.coreSpecsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='rounded-md border bg-card p-4 shadow-sm'>
              <div className='flex items-start justify-between'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <h4 className='font-semibold'>通用开发规范.md</h4>
                    <Badge variant='outline'>最重要</Badge>
                  </div>
                  <p className='text-sm text-muted-foreground'>
                    docs/template/通用开发规范.md
                  </p>
                  <p className='pt-2 text-sm'>
                    {t('dashboard.specsContent')}
                  </p>
                </div>
                <Button variant='outline' size='sm' className='shrink-0'>
                  <ExternalLink className='mr-2 h-4 w-4' />
                  {t('common.view')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开发流程 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FolderOpen className='h-5 w-5' />
            {t('dashboard.devWorkflow')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid gap-3 md:grid-cols-4'>
              <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
                <div className='mb-2 flex justify-center'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                    1
                  </div>
                </div>
                <h4 className='font-semibold'>{t('dashboard.step1Title')}</h4>
                <p className='text-xs text-muted-foreground pt-1'>
                  {t('dashboard.step1Desc')}
                </p>
              </div>

              <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
                <div className='mb-2 flex justify-center'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                    2
                  </div>
                </div>
                <h4 className='font-semibold'>{t('dashboard.step2Title')}</h4>
                <p className='text-xs text-muted-foreground pt-1'>
                  {t('dashboard.step2Desc')}
                </p>
              </div>

              <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
                <div className='mb-2 flex justify-center'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                    3
                  </div>
                </div>
                <h4 className='font-semibold'>{t('dashboard.step3Title')}</h4>
                <p className='text-xs text-muted-foreground pt-1'>
                  {t('dashboard.step3Desc')}
                </p>
              </div>

              <div className='rounded-lg border bg-card p-4 text-center shadow-sm'>
                <div className='mb-2 flex justify-center'>
                  <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground'>
                    4
                  </div>
                </div>
                <h4 className='font-semibold'>{t('dashboard.step4Title')}</h4>
                <p className='text-xs text-muted-foreground pt-1'>
                  {t('dashboard.step4Desc')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 布局模板示例 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Palette className='h-5 w-5' />
            {t('dashboard.layoutTemplates')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.layoutTemplatesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='rounded-md border bg-card p-4 shadow-sm'>
              <h4 className='mb-2 font-semibold'>1. Standard Layout</h4>
              <p className='mb-3 text-sm text-muted-foreground'>
                features/templates/layout/standard-layout.tsx
              </p>
              <ul className='space-y-1 text-sm'>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>固定头部 (Header Fixed)</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>标题 + Badge + 描述</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>右侧按钮组</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>分隔线 + 可滚动内容区</span>
                </li>
              </ul>
            </div>

            <div className='rounded-md border bg-card p-4 shadow-sm'>
              <h4 className='mb-2 font-semibold'>2. Standard List Layout</h4>
              <p className='mb-3 text-sm text-muted-foreground'>
                features/templates/layout/standard-list-layout.tsx
              </p>
              <ul className='space-y-1 text-sm'>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>数据表格布局</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>分页器 + 批量操作</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>响应式卡片视图</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>faded-bottom 滚动效果</span>
                </li>
              </ul>
            </div>

            <div className='rounded-md border bg-card p-4 shadow-sm'>
              <h4 className='mb-2 font-semibold'>3. Top Nav Layout</h4>
              <p className='mb-3 text-sm text-muted-foreground'>
                features/templates/layout/top-nav-layout.tsx
              </p>
              <ul className='space-y-1 text-sm'>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>顶部导航栏 (TopNav)</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>Tabs 切换</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>统计卡片网格</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>主内容区 (4:3 列比例)</span>
                </li>
              </ul>
            </div>

            <div className='rounded-md border bg-card p-4 shadow-sm'>
              <h4 className='mb-2 font-semibold'>4. Tab Layout</h4>
              <p className='mb-3 text-sm text-muted-foreground'>
                features/templates/layout/tab-layout.tsx
              </p>
              <ul className='space-y-1 text-sm'>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>标题区域 Tabs</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>工具栏（搜索/筛选/排序）</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>3 列网格布局</span>
                </li>
                <li className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-primary' />
                  <span>完全符合 UI 模板规范</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开发环境依赖 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Code2 className='h-5 w-5' />
            {t('dashboard.devDependencies')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.devDependenciesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='rounded-md bg-muted p-4 font-mono text-sm'>
              <div className='mb-2 font-semibold text-primary'>核心依赖</div>
              <ul className='space-y-1 text-muted-foreground'>
                <li>@tanstack/react-router - 路由系统</li>
                <li>react-i18next - 国际化</li>
                <li>recharts - 图表库</li>
                <li>lucide-react - 图标库</li>
              </ul>
            </div>

            <div className='rounded-md bg-muted p-4 font-mono text-sm'>
              <div className='mb-2 font-semibold text-primary'>UI 组件</div>
              <ul className='space-y-1 text-muted-foreground'>
                <li>@/components/ui/* - shadcn/ui 组件</li>
                <li>@/components/layout/* - 布局组件</li>
                <li>@/components/* - 通用组件</li>
              </ul>
            </div>

            <div className='rounded-md bg-muted p-4 font-mono text-sm'>
              <div className='mb-2 font-semibold text-primary'>开发工具</div>
              <ul className='space-y-1 text-muted-foreground'>
                <li>Vite - 构建工具</li>
                <li>TypeScript - 类型系统</li>
                <li>Tailwind CSS - CSS 框架</li>
                <li>ESLint + Prettier - 代码规范</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 检查清单 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.checklist')}</CardTitle>
          <CardDescription>{t('dashboard.checklistDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-3 md:grid-cols-2'>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-4 w-4 rounded-sm border border-primary' />
              <div>
                <p className='font-medium'>组件文件已创建</p>
                <p className='text-sm text-muted-foreground'>features/ 目录下</p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-4 w-4 rounded-sm border border-primary' />
              <div>
                <p className='font-medium'>路由文件已创建</p>
                <p className='text-sm text-muted-foreground'>routes/ 目录下</p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-4 w-4 rounded-sm border border-primary' />
              <div>
                <p className='font-medium'>国际化已添加</p>
                <p className='text-sm text-muted-foreground'>zh.json + en.json</p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-4 w-4 rounded-sm border border-primary' />
              <div>
                <p className='font-medium'>侧边栏配置已更新</p>
                <p className='text-sm text-muted-foreground'>sidebar-data.ts</p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-4 w-4 rounded-sm border border-primary' />
              <div>
                <p className='font-medium'>Badge 标签已添加</p>
                <p className='text-sm text-muted-foreground'>variant='secondary'</p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='mt-1 h-4 w-4 rounded-sm border border-primary' />
              <div>
                <p className='font-medium'>布局符合规范</p>
                <p className='text-sm text-muted-foreground'>Header + Main</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
