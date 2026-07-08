async function callFn(name, data) {
  const res = await wx.cloud.callFunction({ name, data })
  if (!res.result || !res.result.ok) {
    throw new Error((res.result && res.result.error) || `${name} failed`)
  }
  return res.result
}

module.exports = { callFn }
