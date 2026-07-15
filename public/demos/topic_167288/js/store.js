// ===== 数据存储层：localStorage 封装 =====
const Store = {
  PREFIX: 'pawmap_',

  // 读取集合
  get(collection) {
    try {
      const data = localStorage.getItem(this.PREFIX + collection)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Store.get error:', collection, e)
      return []
    }
  },

  // 写入集合
  set(collection, data) {
    try {
      localStorage.setItem(this.PREFIX + collection, JSON.stringify(data))
    } catch (e) {
      console.error('Store.set error:', collection, e)
    }
  },

  // 插入记录
  insert(collection, record) {
    const data = this.get(collection)
    const id = record.id || (collection + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6))
    const newRecord = { id, ...record, id }
    data.push(newRecord)
    this.set(collection, data)
    return newRecord
  },

  // 按 ID 查找
  findById(collection, id) {
    return this.get(collection).find(item => item.id === id)
  },

  // 按 ID 更新
  updateById(collection, id, updates) {
    const data = this.get(collection)
    const index = data.findIndex(item => item.id === id)
    if (index >= 0) {
      data[index] = { ...data[index], ...updates }
      this.set(collection, data)
      return data[index]
    }
    return null
  },

  // 按 ID 删除
  deleteById(collection, id) {
    const data = this.get(collection)
    const filtered = data.filter(item => item.id !== id)
    this.set(collection, filtered)
    return data.length !== filtered.length
  },

  // 按条件查询
  query(collection, condition) {
    return this.get(collection).filter(item => {
      for (const key in condition) {
        if (item[key] !== condition[key]) return false
      }
      return true
    })
  },

  // 按条件删除
  deleteByCondition(collection, condition) {
    const data = this.get(collection)
    const filtered = data.filter(item => {
      for (const key in condition) {
        if (item[key] !== condition[key]) return true
      }
      return false
    })
    this.set(collection, filtered)
  },

  // 读取单个值（如 current_user）
  getValue(key) {
    try {
      const data = localStorage.getItem(this.PREFIX + key)
      return data ? JSON.parse(data) : null
    } catch (e) {
      return null
    }
  },

  // 写入单个值
  setValue(key, value) {
    localStorage.setItem(this.PREFIX + key, JSON.stringify(value))
  },

  // 清空所有数据
  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  }
}
