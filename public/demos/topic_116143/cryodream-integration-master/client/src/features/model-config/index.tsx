import { useEffect, useState } from 'react'
import { BrainCog, Edit, Plus, RefreshCw, Trash2, TestTube, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Combobox } from '@/components/ui/combobox'
import {
  addModelConfig,
  createModelConfig,
  deleteModelConfig,
  fetchRemoteModels,
  getModelConfigs,
  listModelConfigs,
  listModelProviders,
  modelTypeLabels,
  modelTypeOptions,
  testModelConfig,
  updateDouyinCookieSetting,
  updateModelConfig,
  type DouyinCookieSetting,
  type ModelConfig,
  type ModelProviderVO,
  type ModelType,
} from './model-config-store'

const maskApiKey = (value: string) => {
  if (!value) return '未配置'
  if (value.length <= 8) return '已配置'
  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}

export function ModelConfigPage() {
  const [configs, setConfigs] = useState<ModelConfig[]>(() => getModelConfigs())
  const [providers, setProviders] = useState<ModelProviderVO[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ModelConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchedModelOptions, setFetchedModelOptions] = useState<{ label: string; value: string }[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const [remoteConfigs, remoteProviders] = await Promise.all([
        listModelConfigs(),
        listModelProviders(),
      ])
      setConfigs(remoteConfigs.length > 0 ? remoteConfigs : getModelConfigs())
      setProviders(remoteProviders)
    } catch (error) {
      console.error(error)
      toast.error('数据加载失败，已使用本地缓存')
      setConfigs(getModelConfigs())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleAdd = () => {
    const next = createModelConfig('chat')
    setEditingConfig(next)
    setFetchedModelOptions([])
    setDialogOpen(true)
  }

  const handleEdit = (config: ModelConfig) => {
    setEditingConfig({ ...config })
    // 初始化已获取的模型列表：从厂商预设模型 + 当前模型
    const provider = providers.find((p) => p.code === config.provider)
    const presetOptions = (provider?.models ?? []).map((m) => ({ label: m, value: m }))
    // 如果当前模型不在预设中，添加到选项
    if (config.model && !presetOptions.some((o) => o.value === config.model)) {
      presetOptions.push({ label: config.model, value: config.model })
    }
    setFetchedModelOptions(presetOptions)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    const target = configs.find((item) => item.id === id)
    if (!target) return
    if (!confirm(`确定删除"${target.name}"吗？`)) return

    try {
      if (!id.startsWith('temp-')) {
        await deleteModelConfig(id)
      }
      const nextConfigs = configs.filter((item) => item.id !== id)
      setConfigs(nextConfigs)
      toast.success('模型配置已删除')
    } catch (error) {
      console.error(error)
      toast.error('删除失败，请检查后端服务')
    }
  }

  const handleSave = async () => {
    if (!editingConfig) return
    if (!editingConfig.name.trim() || !editingConfig.model.trim()) {
      toast.error('配置名称和模型名称不能为空')
      return
    }

    setSaving(true)
    try {
      if (editingConfig.id.startsWith('temp-')) {
        const newId = await addModelConfig(editingConfig)
        const nextConfigs = [...configs, { ...editingConfig, id: newId }]
        setConfigs(nextConfigs)
      } else {
        await updateModelConfig(editingConfig)
        const nextConfigs = configs.map((item) => (item.id === editingConfig.id ? editingConfig : item))
        setConfigs(nextConfigs)
      }
      toast.success('模型配置已保存')
      setDialogOpen(false)
      setEditingConfig(null)
      void loadData()
    } catch (error) {
      console.error(error)
      toast.error('保存失败，请检查后端服务')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!editingConfig) return
    if (!editingConfig.baseUrl || !editingConfig.apiKey || !editingConfig.model) {
      toast.error('请先填写接口地址、API 密钥和模型名称')
      return
    }

    setTesting(true)
    try {
      const result = await testModelConfig({
        providerCode: editingConfig.provider,
        baseUrl: editingConfig.baseUrl,
        apiKey: editingConfig.apiKey,
        model: editingConfig.model,
      })
      if (result.includes('成功')) {
        toast.success(result)
      } else {
        toast.error(result)
      }
    } catch (error) {
      console.error(error)
      toast.error('测试请求失败')
    } finally {
      setTesting(false)
    }
  }

  const handleFetchModels = async () => {
    if (!editingConfig) return
    if (!editingConfig.baseUrl) {
      toast.error('请先填写接口地址')
      return
    }

    setFetchingModels(true)
    try {
      const models = await fetchRemoteModels(editingConfig.baseUrl, editingConfig.apiKey || undefined)
      if (models.length === 0) {
        toast.warning('未获取到可用模型，请检查接口地址和密钥')
        return
      }
      const options = models.sort((a, b) => a.localeCompare(b)).map((m) => ({ label: m, value: m }))
      setFetchedModelOptions(options)
      toast.success(`成功获取 ${models.length} 个模型`)
    } catch (error) {
      console.error(error)
      toast.error('获取模型列表失败，请检查接口地址和密钥')
    } finally {
      setFetchingModels(false)
    }
  }

  const updateEditingConfig = (patch: Partial<ModelConfig>) => {
    if (!editingConfig) return
    setEditingConfig({ ...editingConfig, ...patch })
  }

  const handleProviderChange = (providerCode: string) => {
    if (providerCode === 'custom') {
      updateEditingConfig({
        provider: 'custom',
        providerName: '',
        baseUrl: '',
        model: '',
      })
      setFetchedModelOptions([])
      return
    }
    const provider = providers.find((p) => p.code === providerCode)
    if (!provider) return
    updateEditingConfig({
      provider: providerCode as ModelConfig['provider'],
      providerName: provider.name,
      baseUrl: provider.defaultBaseUrl,
      model: '',
    })
    // 预设厂商模型作为初始选项
    setFetchedModelOptions(provider.models.map((m) => ({ label: m, value: m })))
  }

  const getProviderName = (config: ModelConfig) => {
    const provider = providers.find((p) => p.code === config.provider)
    return provider?.name || config.providerName || '自定义'
  }

  const getModelTypeName = (modelType: string) => {
    return modelTypeLabels[modelType as ModelType] || '对话'
  }

  const getModelTypeBadgeVariant = (modelType: string) => {
    switch (modelType) {
      case 'embedding':
        return 'default'
      case 'image':
        return 'secondary'
      case 'audio':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  return (
    <>
      {/* ===== 标题区域 ===== */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>模型设置</h1>
              <Badge variant='secondary'>配置</Badge>
            </div>
            <p className='text-muted-foreground'>
              单独维护模型厂商、接口地址、API 密钥和自定义模型，工作流节点会读取已启用配置。
            </p>
          </div>
          {/* 右侧主要操作按钮 */}
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={() => { void loadData(); void loadDouyinCookie() }} disabled={loading}>
              <RefreshCw className='mr-2 size-4' />
              刷新
            </Button>
            <Button size='sm' onClick={handleAdd}>
              <Plus className='mr-2 size-4' />
              新增模型
            </Button>
          </div>
        </div>
      </div>

      <Separator className='my-4 shadow-sm' />

      {/* ===== 内容区域 ===== */}
      <div className='faded-bottom no-scrollbar flex flex-1 flex-col gap-4 overflow-auto pb-16'>
        <Card className='gap-0 overflow-hidden py-0'>
          <CardHeader className='border-b px-4 py-3'>
            <CardTitle className='flex items-center gap-2 text-sm'>
              <BrainCog className='size-4' />
              模型列表
            </CardTitle>
            <CardDescription>模型与智能体节点只读取已启用模型；新增的自定义模型也会进入下拉框。</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>厂商</TableHead>
                  <TableHead>模型</TableHead>
                  <TableHead>密钥</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className='w-[100px] text-end'>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className='font-medium'>{config.name}</TableCell>
                    <TableCell>
                      <Badge variant={getModelTypeBadgeVariant(config.modelType) as 'default' | 'secondary' | 'outline'}>
                        {getModelTypeName(config.modelType)}
                      </Badge>
                    </TableCell>
                    <TableCell>{getProviderName(config)}</TableCell>
                    <TableCell>{config.model || '未填写'}</TableCell>
                    <TableCell>{maskApiKey(config.apiKey)}</TableCell>
                    <TableCell>
                      <Badge variant={config.enabled ? 'default' : 'outline'}>{config.enabled ? '启用' : '停用'}</Badge>
                    </TableCell>
                    <TableCell className='text-end'>
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='size-7 text-muted-foreground hover:text-primary'
                          onClick={() => handleEdit(config)}
                          title='编辑模型配置'
                        >
                          <Edit className='size-4' />
                        </Button>
                        <Button
                          type='button'
                          size='icon'
                          variant='ghost'
                          className='size-7 text-muted-foreground hover:text-destructive'
                          disabled={configs.length <= 1}
                          onClick={() => void handleDelete(config.id)}
                          title='删除模型配置'
                        >
                          <Trash2 className='size-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ===== 新增/编辑弹窗 ===== */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) {
          setEditingConfig(null)
        }
      }}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{editingConfig?.id.startsWith('temp-') ? '新增模型配置' : '编辑模型配置'}</DialogTitle>
            <DialogDescription>选择厂商后自动填充接口地址，从下拉列表选择模型。</DialogDescription>
          </DialogHeader>

          {editingConfig && (
            <div className='grid gap-4 py-4'>
              {/* 配置名称 */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='config-name'>配置名称</Label>
                <Input
                  id='config-name'
                  value={editingConfig.name}
                  onChange={(event) => updateEditingConfig({ name: event.target.value })}
                  placeholder='例如：我的 OpenAI 配置'
                />
              </div>

              {/* 模型类型 */}
              <div className='flex flex-col gap-2'>
                <Label>模型类型</Label>
                <Select
                  value={editingConfig.modelType}
                  onValueChange={(value) => updateEditingConfig({ modelType: value as ModelType })}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='请选择模型类型' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {modelTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className='text-xs text-muted-foreground'>对话/文本为 LLM，嵌入用于 RAG 向量化，生图和语音用于多模态场景。</p>
              </div>

              {/* 选择厂商 */}
              <div className='flex flex-col gap-2'>
                <Label>模型厂商</Label>
                <Select
                  value={editingConfig.provider}
                  onValueChange={handleProviderChange}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='请选择厂商' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {providers.map((provider) => (
                        <SelectItem key={provider.code} value={provider.code}>
                          {provider.name}
                        </SelectItem>
                      ))}
                      <SelectItem value='custom'>自定义</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* 自定义厂商名称（仅在选择自定义时显示） */}
              {editingConfig.provider === 'custom' && (
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='provider-name'>厂商名称</Label>
                  <Input
                    id='provider-name'
                    value={editingConfig.providerName}
                    onChange={(event) => updateEditingConfig({ providerName: event.target.value })}
                    placeholder='例如：我的自定义厂商'
                  />
                </div>
              )}

              {/* 接口地址 */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='base-url'>接口地址</Label>
                <Input
                  id='base-url'
                  value={editingConfig.baseUrl}
                  onChange={(event) => updateEditingConfig({ baseUrl: event.target.value })}
                  placeholder='例如：https://api.openai.com/v1'
                />
              </div>

              {/* API 密钥 */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='api-key'>API 密钥</Label>
                <Input
                  id='api-key'
                  type='password'
                  value={editingConfig.apiKey}
                  onChange={(event) => updateEditingConfig({ apiKey: event.target.value })}
                  placeholder='请输入 API 密钥'
                />
              </div>

              {/* 选择模型 */}
              <div className='flex flex-col gap-2'>
                <Label>模型</Label>
                <div className='flex gap-2'>
                  <Combobox
                    mode='single'
                    value={editingConfig.model}
                    options={fetchedModelOptions}
                    onChange={(model) => updateEditingConfig({ model })}
                    placeholder='选择或输入模型名称'
                    searchPlaceholder='搜索模型...'
                    emptyText='无匹配模型'
                    allowCreate
                    className='flex-1'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => void handleFetchModels()}
                    disabled={fetchingModels || !editingConfig.baseUrl}
                    title='从远程 API 获取模型列表'
                  >
                    <Download className={fetchingModels ? 'animate-pulse' : ''} />
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>点击下载按钮从远程 API 获取可用模型，或直接输入自定义模型名称。</p>
              </div>

              {/* 温度和最大令牌数 */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='temperature'>温度</Label>
                  <Input
                    id='temperature'
                    type='number'
                    step='0.1'
                    min='0'
                    max='2'
                    value={editingConfig.temperature}
                    onChange={(event) => updateEditingConfig({ temperature: Number.parseFloat(event.target.value || '0') })}
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor='max-tokens'>最大令牌数</Label>
                  <Input
                    id='max-tokens'
                    type='number'
                    min='1'
                    value={editingConfig.maxTokens}
                    onChange={(event) => updateEditingConfig({ maxTokens: Number.parseInt(event.target.value || '1000', 10) })}
                  />
                </div>
              </div>

              {/* 描述 */}
              <div className='flex flex-col gap-2'>
                <Label htmlFor='description'>描述</Label>
                <Textarea
                  id='description'
                  value={editingConfig.description ?? ''}
                  onChange={(event) => updateEditingConfig({ description: event.target.value })}
                  placeholder='说明这个模型适合什么场景'
                  rows={2}
                />
              </div>

              {/* 启用配置 */}
              <div className='flex items-center justify-between rounded-lg border px-3 py-2'>
                <div className='flex flex-col gap-1'>
                  <Label>启用配置</Label>
                  <p className='text-xs text-muted-foreground'>关闭后，工作流节点的模型下拉框默认不显示该配置。</p>
                </div>
                <Switch checked={editingConfig.enabled} onCheckedChange={(enabled) => updateEditingConfig({ enabled })} />
              </div>
            </div>
          )}

          <DialogFooter className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleTest}
              disabled={testing || !editingConfig?.baseUrl || !editingConfig?.apiKey || !editingConfig?.model}
            >
              <TestTube className='mr-2 size-4' />
              {testing ? '测试中...' : '测试 API'}
            </Button>
            <div className='flex-1' />
            <Button variant='outline' onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
