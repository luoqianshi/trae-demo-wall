/**
 * 内容安全检查。
 * Web 演示版：stub 模式，始终通过。
 * 接口契约与 cloudfunctions/fn-solve/content-safety.js 一致。
 */
async function checkContent(text) {
  console.log('[content-safety] stub check for text length=', (text || '').length)
  return { ok: true, provider: 'stub' }
}

module.exports = { checkContent }
