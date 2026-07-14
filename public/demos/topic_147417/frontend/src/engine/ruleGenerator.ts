import type { SceneRule } from "./types"

export interface TuyaRule {
  id: string
  name: string
  triggers: Array<{
    entityId: string
    type: string
    value: unknown
    operator?: string
  }>
  actions: Array<{
    entityId: string
    type: string
    value: unknown
    delay?: number
  }>
  conditions?: Array<{
    entityId: string
    type: string
    value: unknown
    operator?: string
  }>
}

export function generateTuyaRule(sceneRule: SceneRule): TuyaRule {
  return {
    id: sceneRule.id,
    name: sceneRule.name,
    triggers: sceneRule.triggers.map((t) => {
      const result: Record<string, unknown> = { type: t.type }
      if (t.type !== "manual") {
        result.entityId = t.entityId
        result.value = t.value
        if (t.operator) result.operator = t.operator
      }
      return result as TuyaRule["triggers"][0]
    }),
    actions: sceneRule.actions.map((a) => ({
      entityId: a.entityId,
      type: a.type,
      value: a.value,
      delay: a.delay,
    })),
    conditions: sceneRule.conditions?.map((c) => ({
      entityId: c.entityId,
      type: c.type,
      value: c.value,
      operator: c.operator,
    })),
  }
}

export function validateRule(rule: object): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (typeof rule !== "object" || rule === null) {
    errors.push("规则必须是对象类型")
    return { valid: false, errors }
  }

  const ruleObj = rule as Record<string, unknown>

  if (!ruleObj.name || typeof ruleObj.name !== "string") {
    errors.push("规则必须包含 name 字段")
  }

  if (!ruleObj.triggers || !Array.isArray(ruleObj.triggers)) {
    errors.push("规则必须包含 triggers 数组")
  } else if ((ruleObj.triggers as unknown[]).length === 0) {
    errors.push("triggers 数组不能为空")
  }

  if (!ruleObj.actions || !Array.isArray(ruleObj.actions)) {
    errors.push("规则必须包含 actions 数组")
  } else if ((ruleObj.actions as unknown[]).length === 0) {
    errors.push("actions 数组不能为空")
  }

  const triggerTypesRequiringEntity = ["device_status"]

  if (ruleObj.triggers && Array.isArray(ruleObj.triggers)) {
    (ruleObj.triggers as unknown[]).forEach((trigger, index) => {
      if (typeof trigger !== "object" || trigger === null) {
        errors.push(`trigger[${index}] 必须是对象`)
      } else {
        const t = trigger as Record<string, unknown>
        if (!t.type || typeof t.type !== "string") {
          errors.push(`trigger[${index}] 必须包含 type 字段`)
        }
        const triggerType = t.type as string
        if (triggerTypesRequiringEntity.includes(triggerType)) {
          if (!t.entityId || typeof t.entityId !== "string" || t.entityId.trim() === "") {
            errors.push(`trigger[${index}] 必须包含 entityId 字段`)
          }
        }
      }
    })
  }

  const actionTypesRequiringEntity = ["device_control"]

  if (ruleObj.actions && Array.isArray(ruleObj.actions)) {
    (ruleObj.actions as unknown[]).forEach((action, index) => {
      if (typeof action !== "object" || action === null) {
        errors.push(`action[${index}] 必须是对象`)
      } else {
        const a = action as Record<string, unknown>
        if (!a.type || typeof a.type !== "string") {
          errors.push(`action[${index}] 必须包含 type 字段`)
        }
        const actionType = a.type as string
        if (actionTypesRequiringEntity.includes(actionType)) {
          if (!a.entityId || typeof a.entityId !== "string" || a.entityId.trim() === "") {
            errors.push(`action[${index}] 必须包含 entityId 字段`)
          }
        }
      }
    })
  }

  return { valid: errors.length === 0, errors }
}
