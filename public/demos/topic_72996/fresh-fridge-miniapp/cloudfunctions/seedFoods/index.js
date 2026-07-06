const cloud = require('wx-server-sdk')
const foodsSeed = require('./foodsSeed.js')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { force = false, updateImages = false } = event

  try {
    // 模式1：仅更新图片
    if (updateImages) {
      let updatedCount = 0
      let skippedCount = 0
      const results = []
      const now = new Date()

      for (const foodData of foodsSeed) {
        const existingFood = await db.collection('foods').where({
          name: foodData.name,
          origin: foodData.origin
        }).get()

        if (existingFood.data.length > 0) {
          const food = existingFood.data[0]
          await db.collection('foods').doc(food._id).update({
            data: {
              images: foodData.images,
              updateTime: now
            }
          })
          updatedCount++
          results.push({
            name: foodData.name,
            status: 'updated',
            message: '图片已更新'
          })
        } else {
          skippedCount++
          results.push({
            name: foodData.name,
            status: 'skipped',
            message: '不存在，跳过'
          })
        }
      }

      return {
        success: true,
        message: `图片更新完成，共更新 ${updatedCount} 条，跳过 ${skippedCount} 条`,
        data: {
          total: foodsSeed.length,
          updatedCount,
          skippedCount,
          results
        }
      }
    }

    const countResult = await db.collection('foods').count()
    const existingCount = countResult.total

    if (existingCount > 0 && !force) {
      return {
        success: true,
        message: '数据库中已有美食数据，跳过导入',
        data: {
          existingCount,
          importedCount: 0,
          skipped: true
        }
      }
    }

    if (force && existingCount > 0) {
      const allFoods = await db.collection('foods').get()
      for (const food of allFoods.data) {
        await db.collection('foods').doc(food._id).remove()
      }
    }

    const now = new Date()
    let importedCount = 0
    let skippedCount = 0
    const results = []

    for (const foodData of foodsSeed) {
      const existingFood = await db.collection('foods').where({
        name: foodData.name,
        origin: foodData.origin
      }).get()

      if (existingFood.data.length > 0) {
        skippedCount++
        results.push({
          name: foodData.name,
          status: 'skipped',
          message: '已存在，跳过'
        })
        continue
      }

      const addData = {
        ...foodData,
        createTime: now,
        updateTime: now
      }

      const addResult = await db.collection('foods').add({
        data: addData
      })

      importedCount++
      results.push({
        name: foodData.name,
        status: 'imported',
        _id: addResult._id
      })
    }

    return {
      success: true,
      message: force ? `强制导入完成，共导入 ${importedCount} 条数据` : `导入完成，共导入 ${importedCount} 条数据，跳过 ${skippedCount} 条已存在数据`,
      data: {
        total: foodsSeed.length,
        importedCount,
        skippedCount,
        results
      }
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: '导入失败'
    }
  }
}
