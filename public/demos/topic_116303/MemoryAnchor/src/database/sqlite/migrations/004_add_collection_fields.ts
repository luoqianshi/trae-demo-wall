// Add Collection Fields Migration
// The Collection model uses `description`, `notes` and `view_count`, but the
// initial schema (001) never created them, so INSERT/UPDATE failed with
// "table collections has no column named description". Add the missing columns.

import Database from 'better-sqlite3';
import type { Migration } from './index';

export const addCollectionFieldsMigration: Migration = {
  version: '004',
  name: 'add_collection_fields',

  up: (db: Database.Database) => {
    const existing = new Set(
      (db.prepare('PRAGMA table_info(collections)').all() as Array<{ name: string }>).map((c) => c.name)
    );
    const addColumn = (name: string, ddl: string) => {
      if (!existing.has(name)) {
        db.exec(`ALTER TABLE collections ADD COLUMN ${ddl}`);
      }
    };
    addColumn('description', 'description TEXT');
    addColumn('notes', 'notes TEXT');
    addColumn('view_count', 'view_count INTEGER DEFAULT 0');
  },

  // SQLite can't easily drop columns; rollback is a no-op.
  down: (_db: Database.Database) => {
    // no-op
  },
};

export default addCollectionFieldsMigration;
