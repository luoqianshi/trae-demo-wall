/**
 * 内容安全检查。
 * W1: stub 模式，始终通过（仅日志）。
 * W2: 替换为腾讯云 TextModeration 或网信办指定 API。
 *
 * 接口契约（保持不变）：
 *   输入: text (string)
 *   输出: { ok: boolean, provider: string, reason?: string }
 */
async function checkContent(text) {
  console.log('[content-safety] stub check for text length=', (text || '').length)
  return { ok: true, provider: 'stub' }
}

module.exports = { checkContent }
