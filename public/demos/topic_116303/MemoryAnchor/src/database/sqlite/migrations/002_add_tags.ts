// Add Tags Migration
// This migration is a no-op since tags tables are already created in 001_initial

import Database from 'better-sqlite3';
import type { Migration } from './index';

export const addTagsMigration: Migration = {
  version: '002',
  name: 'add_tags',

  up: (_db: Database.Database) => {
    // Tags and collection_tags tables are already created in initial migration
  },

  down: (_db: Database.Database) => {
    // No action needed
  },
};

export default addTagsMigration;
