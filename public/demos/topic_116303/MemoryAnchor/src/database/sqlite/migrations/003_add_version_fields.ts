import Database from 'better-sqlite3';
import type { Migration } from './index';

export const addVersionFieldsMigration: Migration = {
  version: '003',
  name: 'add_version_fields',

  up: (db: Database.Database) => {
    db.exec(`
      ALTER TABLE versions ADD COLUMN html_content TEXT;
      ALTER TABLE versions ADD COLUMN checksum TEXT;
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_versions_checksum ON versions(checksum);
    `);

    db.exec(`
      ALTER TABLE collections ADD COLUMN html_content TEXT;
      ALTER TABLE collections ADD COLUMN favicon TEXT;
      ALTER TABLE collections ADD COLUMN thumbnail TEXT;
    `);
  },

  down: (db: Database.Database) => {
    db.exec(`
      DROP INDEX IF EXISTS idx_versions_checksum;
    `);
  },
};

export default addVersionFieldsMigration;
