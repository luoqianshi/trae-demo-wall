const db = wx.cloud.database()

const Cloud = {
  getCollection: (name) => {
    return db.collection(name)
  },

  add: (collectionName, data) => {
    return new Promise((resolve, reject) => {
      db.collection(collectionName).add({
        data: {
          ...data,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        },
        success: (res) => {
          resolve({ success: true, data: res })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  get: (collectionName, id) => {
    return new Promise((resolve, reject) => {
      db.collection(collectionName).doc(id).get({
        success: (res) => {
          resolve({ success: true, data: res.data })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  update: (collectionName, id, data) => {
    return new Promise((resolve, reject) => {
      db.collection(collectionName).doc(id).update({
        data: {
          ...data,
          updateTime: db.serverDate()
        },
        success: (res) => {
          resolve({ success: true, data: res })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  remove: (collectionName, id) => {
    return new Promise((resolve, reject) => {
      db.collection(collectionName).doc(id).remove({
        success: (res) => {
          resolve({ success: true, data: res })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  query: (collectionName, conditions = {}, options = {}) => {
    return new Promise((resolve, reject) => {
      let query = db.collection(collectionName)
      
      if (conditions) {
        Object.keys(conditions).forEach(key => {
          if (conditions[key] !== undefined) {
            query = query.where({ [key]: conditions[key] })
          }
        })
      }
      
      if (options.orderBy) {
        query = query.orderBy(options.orderBy.field, options.orderBy.direction || 'desc')
      }
      
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      if (options.skip) {
        query = query.skip(options.skip)
      }
      
      query.get({
        success: (res) => {
          resolve({ success: true, data: res.data, total: res.data.length })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  callFunction: (name, data = {}) => {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: name,
        data: data,
        success: (res) => {
          resolve({ success: true, data: res.result })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  uploadFile: (filePath, cloudPath) => {
    return new Promise((resolve, reject) => {
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: (res) => {
          resolve({ success: true, data: res })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  downloadFile: (fileID) => {
    return new Promise((resolve, reject) => {
      wx.cloud.downloadFile({
        fileID: fileID,
        success: (res) => {
          resolve({ success: true, data: res })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  },

  count: (collectionName, conditions = {}) => {
    return new Promise((resolve, reject) => {
      let query = db.collection(collectionName)
      
      if (conditions) {
        Object.keys(conditions).forEach(key => {
          if (conditions[key] !== undefined) {
            query = query.where({ [key]: conditions[key] })
          }
        })
      }
      
      query.count({
        success: (res) => {
          resolve({ success: true, data: res.total })
        },
        fail: (err) => {
          reject({ success: false, error: err })
        }
      })
    })
  }
}

module.exports = Cloud