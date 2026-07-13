/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

function getVisitRecords() {
  try { return JSON.parse(localStorage.getItem('my_visit_records') || '[]'); }
  catch(e) { return []; }
}
function saveVisitRecords(records) {
  localStorage.setItem('my_visit_records', JSON.stringify(records));
}
function addVisitRecord(record) {
  const records = getVisitRecords();
  records.unshift(record);
  saveVisitRecords(records);
}

function getMedicationLogs() {
  try { return JSON.parse(localStorage.getItem('my_medication_logs') || '[]'); }
  catch(e) { return []; }
}
function saveMedicationLogs(logs) {
  localStorage.setItem('my_medication_logs', JSON.stringify(logs));
}
function addMedicationLog(log) {
  const logs = getMedicationLogs();
  logs.unshift(log);
  saveMedicationLogs(logs);
}

function getReminderSettings() {
  try { return JSON.parse(localStorage.getItem('my_reminder_settings') || '{"medication":false,"medication_time":"08:00","follow_up":false}'); }
  catch(e) { return { medication: false, medication_time: '08:00', follow_up: false }; }
}
function saveReminderSettings(settings) {
  localStorage.setItem('my_reminder_settings', JSON.stringify(settings));
}

function getHealthLogs() {
  try { return JSON.parse(localStorage.getItem('my_health_logs') || '[]'); }
  catch(e) { return []; }
}
function saveHealthLogs(logs) {
  localStorage.setItem('my_health_logs', JSON.stringify(logs));
}

function getSelfMeasurements() {
  try { return JSON.parse(localStorage.getItem('my_self_measurements') || '[]'); }
  catch(e) { return []; }
}

function getFamilyMembers() {
  try { return JSON.parse(localStorage.getItem('my_family_members') || '[]'); }
  catch(e) { return []; }
}

function getShareLogs() {
  try { return JSON.parse(localStorage.getItem('my_share_logs') || '[]'); }
  catch(e) { return []; }
}
function saveShareLogs(logs) {
  localStorage.setItem('my_share_logs', JSON.stringify(logs));
}

function getFamilyConfirmedRecords() {
  try { return JSON.parse(localStorage.getItem('family_confirmed_records') || '[]'); }
  catch(e) { return []; }
}
function confirmFamilyRecord(recordId) {
  const confirmed = getFamilyConfirmedRecords();
  if (!confirmed.includes(recordId)) {
    confirmed.push(recordId);
    localStorage.setItem('family_confirmed_records', JSON.stringify(confirmed));
  }
}

function getDemoMode() {
  return localStorage.getItem('demo_current_mode') || 'online';
}
function setDemoMode(mode) {
  localStorage.setItem('demo_current_mode', mode);
}

function resetAllData() {
  localStorage.removeItem('my_visit_records');
  localStorage.removeItem('my_medication_logs');
  localStorage.removeItem('my_reminder_settings');
  localStorage.removeItem('my_health_logs');
  localStorage.removeItem('my_self_measurements');
  localStorage.removeItem('my_family_members');
  localStorage.removeItem('my_share_logs');
  localStorage.removeItem('family_confirmed_records');
  localStorage.removeItem('demo_current_mode');
  initMockData();
}