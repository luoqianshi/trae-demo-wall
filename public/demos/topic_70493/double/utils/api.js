function extractKeywords(text) {
  const keywords = []
  const regex = /[\u4e00-\u9fa5]{2,}/g
  let match
  while ((match = regex.exec(text)) !== null) {
    if (!keywords.includes(match[0])) {
      keywords.push(match[0])
    }
  }
  return keywords.slice(0, 5)
}

function convertId(obj) {
  if (!obj) return obj
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (item._id) {
        item.id = item._id
        delete item._id
      }
      return item
    })
  }
  if (obj._id) {
    obj.id = obj._id
    delete obj._id
  }
  return obj
}

const api = {
  async call(action, data) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'api',
        data: { action, data }
      })
      return res.result
    } catch (err) {
      console.error('云函数调用失败:', err)
      return { success: false, message: '网络请求失败' }
    }
  },
  
  async login(code) {
    const result = await this.call('login', { code })
    if (result.success && result.data) {
      result.data = convertId(result.data)
    }
    return result
  },
  
  async getUser() {
    const result = await this.call('getUser', {})
    if (result.success && result.data) {
      result.data = convertId(result.data)
    }
    return result
  },
  
  async getRivers() {
    const result = await this.call('getRivers', {})
    if (result.success && result.rivers) {
      result.rivers = convertId(result.rivers)
      result.rivers.forEach(river => {
        if (river.bottles) {
          river.bottles = convertId(river.bottles)
        }
      })
    }
    return result
  },
  
  async createRiver(name, relationType, customRelation) {
    const result = await this.call('createRiver', { name, relationType, customRelation })
    if (result.success && result.river) {
      result.river = convertId(result.river)
    }
    return result
  },
  
  async getRiver(riverId) {
    const result = await this.call('getRiver', { riverId })
    if (result.success && result.river) {
      result.river = convertId(result.river)
      if (result.river.bottles) {
        result.river.bottles = convertId(result.river.bottles)
      }
    }
    return result
  },
  
  async createBottle(riverId, content, bottleType, images) {
    const keywords = extractKeywords(content)
    const result = await this.call('createBottle', { riverId, content, bottleType, images, keywords })
    if (result.success && result.bottle) {
      result.bottle = convertId(result.bottle)
    }
    return result
  },
  
  async deleteBottle(bottleId) {
    return await this.call('deleteBottle', { bottleId })
  },
  
  async toggleBottle(bottleId) {
    const result = await this.call('toggleBottle', { bottleId })
    if (result.success && result.bottle) {
      result.bottle = convertId(result.bottle)
    }
    return result
  },
  
  async getStatistics() {
    return await this.call('getStatistics', {})
  }
}

module.exports = api