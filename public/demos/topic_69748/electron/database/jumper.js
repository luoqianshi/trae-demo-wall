const { getDb } = require('./db-utils');

function getJumperConfig() {
  const db = getDb();
  if (!db) return { id: 'default', personTemplate: '', groupTemplate: '' };
  const row = db.prepare("SELECT * FROM jumper_config WHERE id = 'default'").get();
  if (!row) return { id: 'default', personTemplate: '', groupTemplate: '' };
  return {
    id: row.id,
    personTemplate: row.personTemplate || '',
    groupTemplate: row.groupTemplate || ''
  };
}

function saveJumperConfig(data) {
  const db = getDb();
  if (!db) return false;
  db.prepare(`
    INSERT OR REPLACE INTO jumper_config (id, personTemplate, groupTemplate)
    VALUES ('default', @personTemplate, @groupTemplate)
  `).run({
    personTemplate: data.personTemplate || '',
    groupTemplate: data.groupTemplate || ''
  });
  return true;
}

module.exports = { getJumperConfig, saveJumperConfig };
