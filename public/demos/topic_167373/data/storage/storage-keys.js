// storage-keys.js
// 数据层存储键集中管理，避免散落的字符串

module.exports = {
  RECORDS: 'pt_records',
  USER_PROFILE: 'pt_user_profile',
  APP_SETTINGS: 'pt_app_settings',
  // PT-mp-007 提醒去重（避免同一天重复弹提醒）
  LAST_REMINDER_DATE: 'pt_last_reminder_date',
  // V0.2.0 波波互动计数（用于统计气泡已展示次数）
  BOBO_INTERACTIONS: 'pt_bobo_interactions'
};
