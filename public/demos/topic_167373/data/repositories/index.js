// repositories/index.js
// 数据层仓库聚合导出

const recordRepository = require('./record-repository.js');
const userProfileRepository = require('./user-profile-repository.js');
const appSettingsRepository = require('./app-settings-repository.js');

module.exports = {
  recordRepository,
  userProfileRepository,
  appSettingsRepository
};
