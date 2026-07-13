/**
 * Mustache 模板变量处理工具。
 * 从模板字符串中提取 {{变量名}} 形式的变量，并支持值替换。
 */

/** 匹配 Mustache 简单变量的正则：只接受字母/数字/下划线，首字符不能是数字 */
const MUSTACHE_VARIABLE_REGEX = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g

/**
 * 从模板字符串中提取所有 {{变量名}} 形式的变量。
 * 去重后返回变量名数组（不含花括号）。
 */
export function extractMustacheVariables(template: string): string[] {
  if (!template) return []
  const variables: string[] = []
  const regex = new RegExp(MUSTACHE_VARIABLE_REGEX.source, 'g')
  let match: RegExpExecArray | null
  while ((match = regex.exec(template)) !== null) {
    const name = match[1]
    if (!variables.includes(name)) variables.push(name)
  }
  return variables
}

/**
 * 使用给定的值映射替换模板中的 {{变量名}} 占位符。
 * 如果某个变量在映射中不存在，则保持原样（不替换，方便调试）。
 */
export function substituteMustacheVariables(
  template: string,
  values: Record<string, string>,
): string {
  if (!template) return ''
  return template.replace(MUSTACHE_VARIABLE_REGEX, (_match, name: string) => {
    if (values[name] !== undefined && values[name] !== null) return String(values[name])
    return `{{${name}}}`
  })
}

/**
 * 检查模板是否包含任何 {{变量名}} 形式的变量。
 */
export function hasMustacheVariables(template: string): boolean {
  return extractMustacheVariables(template).length > 0
}

/**
 * 将模板中检测到的变量与实际值合并（用于运行时）。
 * 对于未提供值的变量，返回空字符串作为默认值。
 */
export function resolveMustacheVariables(
  template: string,
  values: Record<string, string>,
): { resolvedText: string; missingVariables: string[] } {
  const allVariables = extractMustacheVariables(template)
  const missing = allVariables.filter((name) => values[name] === undefined || values[name] === null)
  const resolvedText = substituteMustacheVariables(template, values)
  return { resolvedText, missingVariables: missing }
}
