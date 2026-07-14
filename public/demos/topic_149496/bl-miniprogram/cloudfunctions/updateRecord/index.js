// 云函数：updateRecord - 编辑信息 或 切换显隐状态
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { type, id, action, data } = event
  // type: 'help' | 'idle'
  // action: 'edit' | 'toggleVisibility'
  // data: 编辑时传入的字段（title/description/name/price/category/contact等）

  if (!type || !id || !action) {
    return { success: false, message: '参数错误' }
  }

  let collectionName
  if (type === 'help') collectionName = 'help_requests'
  else if (type === 'idle') collectionName = 'idle_items'
  else return { success: false, message: '类型参数错误' }

  try {
    // 验证记录归属
    const recordRes = await db.collection(collectionName).where({ _id: id }).get()
    if (recordRes.data.length === 0) {
      return { success: false, message: '记录不存在' }
    }
    const record = recordRes.data[0]
    if (record.user_id !== openid) {
      return { success: false, message: '无权操作他人记录' }
    }

    // ===== 切换显隐状态 =====
    if (action === 'toggleVisibility') {
      // 已完成/已出售的记录不允许切换显隐
      if (record.status === '已完成' || record.status === '已出售') {
        return { success: false, message: '已完成的记录无法切换显隐' }
      }
      const currentHidden = record.hidden === true
      const newHidden = !currentHidden
      await db.collection(collectionName).where({ _id: id }).update({
        data: {
          hidden: newHidden,
          update_time: db.serverDate()
        }
      })
      return {
        success: true,
        hidden: newHidden,
        message: type === 'idle'
          ? (newHidden ? '已下架' : '已上架')
          : (newHidden ? '已隐藏' : '已显示')
      }
    }

    // ===== 编辑信息 =====
    if (action === 'edit') {
      // 已完成/已出售的记录不允许编辑
      if (record.status === '已完成' || record.status === '已出售') {
        return { success: false, message: '已完成的记录无法编辑' }
      }

      const updateData = { update_time: db.serverDate() }

      if (type === 'help') {
        // 互助：可编辑标题、描述、联系方式
        if (data.title !== undefined) {
          if (!data.title || !data.title.trim()) {
            return { success: false, message: '标题不能为空' }
          }
          if (data.title.length > 20) {
            return { success: false, message: '标题最多20字' }
          }
          updateData.title = data.title.trim()
        }
        if (data.description !== undefined) {
          if (data.description.length > 200) {
            return { success: false, message: '描述最多200字' }
          }
          updateData.description = data.description.trim()
        }
        if (data.contact !== undefined) {
          updateData.contact = data.contact
        }
      } else {
        // 闲置：可编辑名称、价格、描述、分类、联系方式
        if (data.name !== undefined) {
          if (!data.name || !data.name.trim()) {
            return { success: false, message: '物品名称不能为空' }
          }
          if (data.name.length > 20) {
            return { success: false, message: '名称最多20字' }
          }
          updateData.name = data.name.trim()
        }
        if (data.price !== undefined) {
          if (isNaN(data.price) || Number(data.price) < 0) {
            return { success: false, message: '请输入有效价格' }
          }
          updateData.price = Number(data.price)
        }
        if (data.category !== undefined) {
          updateData.category = data.category
        }
        if (data.description !== undefined) {
          if (data.description.length > 200) {
            return { success: false, message: '描述最多200字' }
          }
          updateData.description = data.description.trim()
        }
        if (data.contact !== undefined) {
          updateData.contact = data.contact
        }
        // 编辑图片（可选）
        if (data.photos !== undefined) {
          if (!data.photos || data.photos.length === 0) {
            return { success: false, message: '至少保留1张照片' }
          }
          updateData.photos = data.photos
        }
      }

      await db.collection(collectionName).where({ _id: id }).update({ data: updateData })

      // 返回更新后的记录
      const updatedRes = await db.collection(collectionName).where({ _id: id }).get()
      return {
        success: true,
        record: updatedRes.data[0],
        message: '修改成功'
      }
    }

    return { success: false, message: '未知的操作类型' }
  } catch (err) {
    return { success: false, message: '操作失败：' + err.message }
  }
}
