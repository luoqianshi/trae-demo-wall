const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

const collections = [
  {
    name: 'foods',
    description: '美食库',
    fields: [
      { name: 'name', type: 'string', required: true, description: '食材名称' },
      { name: 'category', type: 'string', required: true, description: '分类ID' },
      { name: 'subCategory', type: 'string', description: '子分类ID' },
      { name: 'season', type: 'string', description: '季节（spring/summer/autumn/winter）' },
      { name: 'image', type: 'string', description: '图片URL' },
      { name: 'description', type: 'string', description: '描述' },
      { name: 'shelfLife', type: 'number', description: '保质期（天）' },
      { name: 'storageMethod', type: 'string', description: '储存方式' },
      { name: 'nutritionalValue', type: 'object', description: '营养价值' },
      { name: 'tags', type: 'array', description: '标签' },
      { name: 'popularity', type: 'number', default: 0, description: '人气值' },
      { name: 'isSeasonal', type: 'boolean', default: false, description: '是否应季' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  },
  {
    name: 'users',
    description: '用户',
    fields: [
      { name: 'openid', type: 'string', required: true, description: '微信openid' },
      { name: 'nickname', type: 'string', description: '昵称' },
      { name: 'avatarUrl', type: 'string', description: '头像URL' },
      { name: 'gender', type: 'number', description: '性别（0未知/1男/2女）' },
      { name: 'region', type: 'object', description: '地区信息' },
      { name: 'preferences', type: 'object', description: '偏好设置' },
      { name: 'tastes', type: 'array', description: '口味偏好' },
      { name: 'categories', type: 'array', description: '感兴趣的分类' },
      { name: 'notification', type: 'boolean', default: true, description: '是否开启通知' },
      { name: 'totalSaved', type: 'number', default: 0, description: '累计节省食材数量' },
      { name: 'totalExpired', type: 'number', default: 0, description: '累计过期食材数量' },
      { name: 'joinTime', type: 'date', description: '加入时间' },
      { name: 'lastActiveTime', type: 'date', description: '最后活跃时间' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  },
  {
    name: 'fridge',
    description: '冰箱',
    fields: [
      { name: 'userId', type: 'string', required: true, description: '用户ID' },
      { name: 'foodId', type: 'string', required: true, description: '食材ID' },
      { name: 'foodName', type: 'string', required: true, description: '食材名称' },
      { name: 'quantity', type: 'number', default: 1, description: '数量' },
      { name: 'unit', type: 'string', default: '个', description: '单位' },
      { name: 'purchaseDate', type: 'date', required: true, description: '购买日期' },
      { name: 'expireDate', type: 'date', required: true, description: '过期日期' },
      { name: 'storageLocation', type: 'string', default: 'refrigerator', description: '储存位置' },
      { name: 'status', type: 'string', default: 'fresh', description: '状态（fresh/warning/expired/used）' },
      { name: 'isExpired', type: 'boolean', default: false, description: '是否过期' },
      { name: 'image', type: 'string', description: '图片URL' },
      { name: 'note', type: 'string', description: '备注' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  },
  {
    name: 'votes',
    description: '投票',
    fields: [
      { name: 'title', type: 'string', required: true, description: '投票标题' },
      { name: 'description', type: 'string', description: '投票描述' },
      { name: 'options', type: 'array', required: true, description: '投票选项' },
      { name: 'multiSelect', type: 'boolean', default: false, description: '是否多选' },
      { name: 'maxSelect', type: 'number', default: 1, description: '最大可选数量' },
      { name: 'startTime', type: 'date', required: true, description: '开始时间' },
      { name: 'endTime', type: 'date', required: true, description: '结束时间' },
      { name: 'status', type: 'string', default: 'active', description: '状态（active/ended）' },
      { name: 'totalVotes', type: 'number', default: 0, description: '总投票数' },
      { name: 'creatorId', type: 'string', description: '创建者ID' },
      { name: 'tags', type: 'array', description: '标签' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  },
  {
    name: 'messages',
    description: '消息',
    fields: [
      { name: 'userId', type: 'string', required: true, description: '用户ID' },
      { name: 'type', type: 'string', required: true, description: '消息类型（expire/seasonal/vote/system）' },
      { name: 'title', type: 'string', required: true, description: '消息标题' },
      { name: 'content', type: 'string', description: '消息内容' },
      { name: 'data', type: 'object', description: '附加数据' },
      { name: 'isRead', type: 'boolean', default: false, description: '是否已读' },
      { name: 'isDeleted', type: 'boolean', default: false, description: '是否已删除' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  },
  {
    name: 'submissions',
    description: '投稿',
    fields: [
      { name: 'userId', type: 'string', required: true, description: '用户ID' },
      { name: 'title', type: 'string', required: true, description: '投稿标题' },
      { name: 'content', type: 'string', required: true, description: '投稿内容' },
      { name: 'images', type: 'array', description: '图片列表' },
      { name: 'tags', type: 'array', description: '标签' },
      { name: 'status', type: 'string', default: 'pending', description: '状态（pending/approved/rejected）' },
      { name: 'reviewComment', type: 'string', description: '审核意见' },
      { name: 'likes', type: 'number', default: 0, description: '点赞数' },
      { name: 'views', type: 'number', default: 0, description: '浏览数' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  },
  {
    name: 'favorites',
    description: '用户收藏',
    fields: [
      { name: 'openid', type: 'string', required: true, description: '用户openid' },
      { name: 'foodId', type: 'string', required: true, description: '美食ID' },
      { name: 'createTime', type: 'date', description: '创建时间' }
    ]
  },
  {
    name: 'wantList',
    description: '想吃清单',
    fields: [
      { name: 'userId', type: 'string', required: true, description: '用户ID' },
      { name: 'foodId', type: 'string', required: true, description: '美食ID' },
      { name: 'name', type: 'string', description: '美食名称' },
      { name: 'category', type: 'string', description: '分类' },
      { name: 'image', type: 'string', description: '图片URL' },
      { name: 'origin', type: 'string', description: '产地' },
      { name: 'status', type: 'string', default: 'active', description: '状态（active/moved/deleted）' },
      { name: 'sortOrder', type: 'number', default: 0, description: '排序' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  },
  {
    name: 'voteRecords',
    description: '投票记录',
    fields: [
      { name: 'openid', type: 'string', required: true, description: '用户openid' },
      { name: 'foodId', type: 'string', required: true, description: '美食ID' },
      { name: 'voteType', type: 'string', default: 'general', description: '投票类型' },
      { name: 'voteDate', type: 'string', required: true, description: '投票日期' },
      { name: 'createTime', type: 'date', description: '创建时间' }
    ]
  },
  {
    name: 'userPreferences',
    description: '用户偏好设置',
    fields: [
      { name: 'openid', type: 'string', required: true, description: '用户openid' },
      { name: 'hometown', type: 'string', description: '家乡' },
      { name: 'categories', type: 'array', description: '感兴趣的分类' },
      { name: 'tastes', type: 'array', description: '口味偏好' },
      { name: 'notification', type: 'boolean', default: true, description: '是否开启通知' },
      { name: 'createTime', type: 'date', description: '创建时间' },
      { name: 'updateTime', type: 'date', description: '更新时间' }
    ]
  }
]

exports.main = async (event, context) => {
  const results = []
  
  for (const collection of collections) {
    try {
      await db.createCollection(collection.name)
      results.push({
        name: collection.name,
        description: collection.description,
        status: 'created',
        message: `集合 ${collection.name} 创建成功`
      })
    } catch (err) {
      if (err.errCode === -305001) {
        results.push({
          name: collection.name,
          description: collection.description,
          status: 'exists',
          message: `集合 ${collection.name} 已存在`
        })
      } else {
        results.push({
          name: collection.name,
          description: collection.description,
          status: 'error',
          message: `集合 ${collection.name} 创建失败: ${err.message}`
        })
      }
    }
  }
  
  return {
    success: true,
    data: results,
    total: collections.length,
    created: results.filter(r => r.status === 'created').length,
    exists: results.filter(r => r.status === 'exists').length,
    error: results.filter(r => r.status === 'error').length
  }
}