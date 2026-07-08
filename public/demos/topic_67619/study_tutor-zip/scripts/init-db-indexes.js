// 在微信开发者工具的云开发控制台 → 数据库 → 任一集合 → 控制台中运行
// 或在云函数中执行。这里给出可粘贴到控制台的命令。

const collections = [
  {
    name: 'users',
    indexes: [
      { name: 'idx_openid', keys: { openid: 1 }, unique: true }
    ]
  },
  {
    name: 'questions',
    indexes: [
      { name: 'idx_hash', keys: { hash: 1 }, unique: true },
      { name: 'idx_topic_diff', keys: { topic: 1, difficulty: 1 } }
    ]
  },
  {
    name: 'mistakes',
    indexes: [
      { name: 'idx_openid_status', keys: { openid: 1, status: 1 } },
      { name: 'idx_openid_addedAt', keys: { openid: 1, addedAt: -1 } }
    ]
  },
  {
    name: 'usage_log',
    indexes: [
      { name: 'idx_openid_ts', keys: { openid: 1, ts: -1 } }
    ]
  },
  {
    name: 'feedback',
    indexes: [
      { name: 'idx_questionId', keys: { questionId: 1 } }
    ]
  }
]

console.log('请在云开发控制台 → 数据库 → 索引管理 中按以下定义创建：')
console.log(JSON.stringify(collections, null, 2))
