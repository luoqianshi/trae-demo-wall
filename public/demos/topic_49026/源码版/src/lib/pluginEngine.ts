// 衡舟插件引擎 v1
// 轻量级插件框架：允许用户自定义记忆提取规则、提醒触发条件、对话预处理

import type { Memory, Person, DiaryEntry } from '../types'

// === 插件类型定义 ===

export interface PluginContext {
  // 当前用户输入
  userInput: string
  // 当前对话历史
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  // 已检索到的记忆
  memories: Memory[]
  // 已检索到的人物
  people: Person[]
  // 已检索到的日记
  diaries: DiaryEntry[]
  // 用户画像（只读）
  userProfile: string
}

export interface PluginResult {
  // 是否拦截默认行为
  intercept?: boolean
  // 修改后的用户输入（预处理）
  modifiedInput?: string
  // 额外注入的系统提示
  extraSystemPrompt?: string
  // 额外注入的记忆（插件自定义检索）
  extraMemories?: Partial<Memory>[]
  // 提醒触发（返回提醒内容，空数组表示不触发）
  reminders?: Array<{
    type: 'todo' | 'habit' | 'tip'
    title: string
    content: string
    priority: 'urgent' | 'normal' | 'gentle'
  }>
}

export interface HengzhouPlugin {
  // 插件元信息
  id: string
  name: string
  version: string
  description: string
  author?: string

  // 生命周期钩子
  onInit?: () => void
  onDestroy?: () => void

  // 对话预处理：用户输入 → 插件处理 → 进入RAG/LLM
  beforeChat?: (ctx: PluginContext) => PluginResult | Promise<PluginResult>

  // 记忆提取后处理：LLM提取的记忆 → 插件过滤/增强 → 入库
  afterMemoryExtract?: (memories: Memory[], ctx: PluginContext) => Memory[] | Promise<Memory[]>

  // 提醒生成：插件自定义提醒逻辑
  generateReminders?: (ctx: PluginContext) => PluginResult['reminders'] | Promise<PluginResult['reminders']>

  // 设置面板：插件自定义配置UI（返回React组件或配置对象）
  settings?: Record<string, { type: 'string' | 'number' | 'boolean' | 'select'; label: string; default: any; options?: string[] }>
}

// === 插件引擎 ===

class PluginEngine {
  private plugins: Map<string, HengzhouPlugin> = new Map()
  private pluginSettings: Map<string, Record<string, any>> = new Map()

  // 注册插件
  register(plugin: HengzhouPlugin): void {
    if (this.plugins.has(plugin.id)) {
      console.warn(`[PluginEngine] 插件 ${plugin.id} 已存在，将被覆盖`)
    }
    this.plugins.set(plugin.id, plugin)

    // 加载保存的设置
    const saved = localStorage.getItem(`hengzhou-plugin-settings-${plugin.id}`)
    if (saved) {
      try {
        this.pluginSettings.set(plugin.id, JSON.parse(saved))
      } catch { /* ignore */ }
    } else if (plugin.settings) {
      // 使用默认设置
      const defaults: Record<string, any> = {}
      for (const [key, config] of Object.entries(plugin.settings)) {
        defaults[key] = config.default
      }
      this.pluginSettings.set(plugin.id, defaults)
    }

    plugin.onInit?.()
    console.log(`[PluginEngine] 插件已加载: ${plugin.name} v${plugin.version}`)
  }

  // 卸载插件
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (plugin) {
      plugin.onDestroy?.()
      this.plugins.delete(pluginId)
      console.log(`[PluginEngine] 插件已卸载: ${pluginId}`)
    }
  }

  // 获取所有已注册插件
  getPlugins(): HengzhouPlugin[] {
    return Array.from(this.plugins.values())
  }

  // 获取插件设置
  getSetting(pluginId: string, key: string): any {
    const settings = this.pluginSettings.get(pluginId) || {}
    const plugin = this.plugins.get(pluginId)
    if (plugin?.settings?.[key] && !(key in settings)) {
      return plugin.settings[key].default
    }
    return settings[key]
  }

  // 设置插件配置
  setSetting(pluginId: string, key: string, value: any): void {
    const settings = this.pluginSettings.get(pluginId) || {}
    settings[key] = value
    this.pluginSettings.set(pluginId, settings)
    localStorage.setItem(`hengzhou-plugin-settings-${pluginId}`, JSON.stringify(settings))
  }

  // 执行对话前处理（所有插件顺序执行，结果合并）
  async beforeChat(ctx: PluginContext): Promise<PluginResult> {
    const merged: PluginResult = {}

    for (const plugin of this.plugins.values()) {
      if (!plugin.beforeChat) continue
      try {
        const result = await plugin.beforeChat(ctx)
        if (result.intercept) {
          merged.intercept = true
        }
        if (result.modifiedInput) {
          merged.modifiedInput = result.modifiedInput
        }
        if (result.extraSystemPrompt) {
          merged.extraSystemPrompt = (merged.extraSystemPrompt || '') + '\n' + result.extraSystemPrompt
        }
        if (result.extraMemories) {
          merged.extraMemories = [...(merged.extraMemories || []), ...result.extraMemories]
        }
      } catch (e) {
        console.warn(`[PluginEngine] 插件 ${plugin.id} beforeChat 出错:`, e)
      }
    }

    return merged
  }

  // 执行记忆提取后处理
  async afterMemoryExtract(memories: Memory[], ctx: PluginContext): Promise<Memory[]> {
    let result = memories
    for (const plugin of this.plugins.values()) {
      if (!plugin.afterMemoryExtract) continue
      try {
        result = await plugin.afterMemoryExtract(result, ctx)
      } catch (e) {
        console.warn(`[PluginEngine] 插件 ${plugin.id} afterMemoryExtract 出错:`, e)
      }
    }
    return result
  }

  // 执行提醒生成
  async generateReminders(ctx: PluginContext): Promise<PluginResult['reminders']> {
    const allReminders: PluginResult['reminders'] = []
    for (const plugin of this.plugins.values()) {
      if (!plugin.generateReminders) continue
      try {
        const reminders = await plugin.generateReminders(ctx)
        if (reminders) allReminders.push(...reminders)
      } catch (e) {
        console.warn(`[PluginEngine] 插件 ${plugin.id} generateReminders 出错:`, e)
      }
    }
    return allReminders
  }
}

// 单例导出
export const pluginEngine = new PluginEngine()

// === 内置示例插件 ===

// 示例1：职场黑话翻译插件
export const workplaceJargonPlugin: HengzhouPlugin = {
  id: 'workplace-jargon',
  name: '职场黑话翻译',
  version: '1.0.0',
  description: '自动识别并翻译职场中的委婉表达和潜台词',

  beforeChat(ctx) {
    const jargonMap: Record<string, string> = {
      '优化': '可能意味着裁员或降薪',
      '拥抱变化': '组织架构调整，可能有人员变动',
      '扁平化管理': '取消中层，直接向高层汇报',
      '弹性工作': '可能意味着加班没有加班费',
      '狼性文化': '高强度工作，末位淘汰',
      '沉淀': '项目被砍或暂停',
      '赋能': '让你多干活但不多给钱',
      '闭环': '从头到尾你一个人搞定',
      '对齐': '开会统一思想',
      '抓手': '找到切入点或突破口',
    }

    let modified = ctx.userInput
    let found = false
    let extraPrompt = ''

    for (const [word, meaning] of Object.entries(jargonMap)) {
      if (modified.includes(word)) {
        found = true
        extraPrompt += `- "${word}" 在职场中通常意味着：${meaning}\n`
      }
    }

    if (found) {
      return {
        extraSystemPrompt: `用户输入中包含了职场黑话，以下是可能的潜台词：\n${extraPrompt}请在回复中帮助用户理解这些表达背后的真实含义。`,
      }
    }
    return {}
  },
}

// 示例2：情绪日记提醒插件
export const emotionTrackerPlugin: HengzhouPlugin = {
  id: 'emotion-tracker',
  name: '情绪追踪',
  version: '1.0.0',
  description: '当检测到连续负面情绪时，主动提醒用户关注心理健康',

  settings: {
    threshold: { type: 'number', label: '连续负面天数阈值', default: 3 },
    enabled: { type: 'boolean', label: '启用情绪追踪', default: true },
  },

  generateReminders(ctx) {
    const enabled = pluginEngine.getSetting('emotion-tracker', 'enabled')
    if (!enabled) return []

    const negativeWords = ['累', '烦', '难受', '不开心', '焦虑', '压力', '失眠', '抑郁', '痛苦', '绝望']
    let negativeCount = 0

    for (const msg of ctx.messages.slice(-10)) {
      if (msg.role === 'user' && negativeWords.some(w => msg.content.includes(w))) {
        negativeCount++
      }
    }

    const threshold = pluginEngine.getSetting('emotion-tracker', 'threshold')
    if (negativeCount >= threshold) {
      return [{
        type: 'tip',
        title: '情绪观察',
        content: `最近${negativeCount}次对话中检测到负面情绪词汇。要不要聊聊是什么让你这么累？或者我帮你记一篇情绪日记？`,
        priority: 'gentle',
      }]
    }
    return []
  },
}

// 示例3：重要日期提醒插件
export const importantDatesPlugin: HengzhouPlugin = {
  id: 'important-dates',
  name: '重要日期提醒',
  version: '1.0.0',
  description: '自动识别对话中的日期信息，在临近时提醒',

  afterMemoryExtract(memories) {
    // 给包含日期的记忆打标签
    return memories.map(m => {
      const datePattern = /(\d{1,2})月(\d{1,2})日|(\d{4})-(\d{2})-(\d{2})/
      if (datePattern.test(m.content) && !m.tags?.includes('has-date')) {
        return { ...m, tags: [...(m.tags || []), 'has-date'] }
      }
      return m
    })
  },

  generateReminders(ctx) {
    const reminders: PluginResult['reminders'] = []
    const now = new Date()

    for (const mem of ctx.memories) {
      if (!mem.tags?.includes('has-date')) continue

      const match = mem.content.match(/(\d{1,2})月(\d{1,2})日/)
      if (match) {
        const month = parseInt(match[1]) - 1
        const day = parseInt(match[2])
        const targetDate = new Date(now.getFullYear(), month, day)
        const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / 86400000)

        if (diffDays >= 0 && diffDays <= 3) {
          reminders.push({
            type: 'todo',
            title: '日期临近',
            content: `${diffDays === 0 ? '今天' : diffDays === 1 ? '明天' : `${diffDays}天后`}：${mem.content.slice(0, 50)}...`,
            priority: diffDays === 0 ? 'urgent' : 'normal',
          })
        }
      }
    }

    return reminders
  },
}

// 自动注册内置插件
pluginEngine.register(workplaceJargonPlugin)
pluginEngine.register(emotionTrackerPlugin)
pluginEngine.register(importantDatesPlugin)
